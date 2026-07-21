const errors = require('../utils/safeErrors');

const APPLICATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

function hasAnyRole(user, allowedRoles) {
  const currentRoles = Array.isArray(user?.roles) ? user.roles.map(normalizeRole) : [];
  return allowedRoles.map(normalizeRole).some((role) => currentRoles.includes(role));
}

function toPositiveInteger(value, fieldName) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw errors.badRequest('INVALID_ID', `${fieldName} must be a positive integer.`);
  }
  return numberValue;
}

function toSafeApplication(application) {
  if (!application) return null;

  return {
    applicationId: application.applicationId,
    userId: application.userId,
    status: application.status,
    appliedAt: application.appliedAt || null,
    approvedAt: application.approvedAt || null,
    rejectionReason: application.rejectionReason || null,
  };
}

function toStatusResponse(application, member) {
  // Members is the canonical eligibility projection consumed by FE07/FE08.
  // Application status is only a fallback before a canonical member row exists.
  const status = member?.status || application?.status || 'NONE';

  return {
    membershipStatusView: status,
    memberStatus: member?.status || null,
    currentApplication: toSafeApplication(application),
  };
}

function isPendingApplicationConflict(error) {
  return (
    error?.code === 'MEMBERSHIP_PENDING_CONFLICT' ||
    error?.number === 2601 ||
    error?.number === 2627
  );
}

function createMembershipService({
  membershipRepository,
  auditLogRepository,
  notificationRequester,
} = {}) {
  if (!membershipRepository) {
    membershipRepository = require('../repositories/membershipRepository');
  }

  if (!auditLogRepository) {
    auditLogRepository = require('../repositories/auditLogRepository');
  }

  async function writeAudit(
    context,
    action,
    actor,
    application,
    member,
    metadata = {},
    transaction
  ) {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') return;

    await auditLogRepository.create({
      userId: actor?.userId || null,
      action,
      targetType: 'MEMBERSHIP_APPLICATION',
      targetId: application?.applicationId || null,
      metadata: {
        userId: application?.userId,
        memberId: member?.memberId || null,
        status: application?.status,
        result: application?.status,
        ...metadata,
      },
      ipAddress: context?.ip || null,
      userAgent: context?.userAgent || null,
      transaction,
    });
  }

  // @spec FR-FE04-012
  async function notifyMembershipResult(application) {
    if (!notificationRequester || typeof notificationRequester.createNotificationRequest !== 'function') {
      return 'NOT_CONFIGURED';
    }

    try {
      const delivery = await notificationRequester.createNotificationRequest({
        type: 'GENERAL_SYSTEM',
        channel: 'EMAIL',
        templateKey: 'MEMBERSHIP_RESULT',
        userId: application.userId,
        recipientEmail: application.applicant?.email,
        templateData: {
          applicationId: application.applicationId,
          membershipStatus: application.status,
          rejectionReason: application.rejectionReason || null,
        },
        sourceEntityType: 'MEMBERSHIP_APPLICATION',
        sourceEntityId: application.applicationId,
        idempotencyKey: `FE04:MEMBERSHIP_RESULT:${application.applicationId}:${application.status}`,
      });
      return ['PENDING', 'SENT', 'FAILED'].includes(delivery?.status)
        ? delivery.status
        : 'FAILED';
    } catch {
      return 'FAILED';
    }
  }

  function requireAuthenticatedActor(actor) {
    if (!Number.isInteger(Number(actor?.userId)) || Number(actor.userId) <= 0) {
      throw errors.unauthorized('UNAUTHORIZED', 'Authentication is required.');
    }
  }

  function requireStaff(actor) {
    if (!hasAnyRole(actor, ['LIBRARIAN', 'ADMIN'])) {
      throw errors.forbidden('STAFF_ROLE_REQUIRED', 'Only librarian or admin can review membership applications.');
    }
  }

  // @spec FR-FE04-001 FR-FE04-002 FR-FE04-003 FR-FE04-010 FR-FE04-011 FR-FE04-013
  async function apply(actor, context = {}) {
    requireAuthenticatedActor(actor);

    const user = await membershipRepository.findUser(actor.userId);
    if (!user) {
      throw errors.notFound('USER_NOT_FOUND', 'User account was not found.');
    }

    if ((user.Status || user.status) !== 'ACTIVE') {
      throw errors.forbidden('USER_ACCOUNT_INACTIVE', 'User account is not active.');
    }

    const missingFields = [
      ['fullName', user.FullName ?? user.fullName],
      ['phone', user.Phone ?? user.phone],
      ['dateOfBirth', user.DateOfBirth ?? user.dateOfBirth],
      ['address', user.Address ?? user.address],
    ]
      .filter(([, value]) => value == null || String(value).trim() === '')
      .map(([field]) => field);

    if (missingFields.length) {
      throw errors.badRequest(
        'MEMBERSHIP_PROFILE_INCOMPLETE',
        'Complete the required personal profile fields before applying for membership.',
        { missingFields }
      );
    }

    const member = await membershipRepository.findMemberByUserId(actor.userId);
    if (member?.status === 'APPROVED') {
      throw errors.conflict('MEMBERSHIP_ALREADY_APPROVED', 'Membership is already approved.');
    }

    const blockingStatus = await membershipRepository.hasBlockingApplication(actor.userId);
    if (blockingStatus === 'PENDING') {
      throw errors.conflict('MEMBERSHIP_APPLICATION_PENDING', 'A pending membership application already exists.');
    }
    if (blockingStatus === 'APPROVED') {
      throw errors.conflict('MEMBERSHIP_ALREADY_APPROVED', 'Membership is already approved.');
    }

    let application;
    try {
      application = await membershipRepository.createApplication(actor.userId, {
        onBeforeCommit: ({ application: pendingApplication, member: pendingMember, transaction }) =>
          writeAudit(
            context,
            'MEMBERSHIP_APPLICATION_SUBMITTED',
            actor,
            pendingApplication,
            pendingMember,
            { timestamp: pendingApplication.appliedAt },
            transaction
          ),
      });
    } catch (error) {
      if (isPendingApplicationConflict(error)) {
        throw errors.conflict(
          'MEMBERSHIP_APPLICATION_PENDING',
          'A pending membership application already exists.'
        );
      }
      throw error;
    }

    return toStatusResponse(application, application.member || { ...member, status: 'PENDING' });
  }

  async function getMyStatus(actor) {
    requireAuthenticatedActor(actor);
    const [application, member] = await Promise.all([
      membershipRepository.findLatestByUserId(actor.userId),
      membershipRepository.findMemberByUserId(actor.userId),
    ]);

    return toStatusResponse(application, member);
  }

  // @spec FR-FE04-009
  async function listApplications(filters, actor) {
    requireStaff(actor);

    const status = filters.status ? String(filters.status).toUpperCase() : undefined;
    if (status && !APPLICATION_STATUSES.includes(status)) {
      throw errors.badRequest('INVALID_STATUS', 'Membership application status is not supported.');
    }

    return membershipRepository.listApplications({
      q: String(filters.q || '').trim(),
      status,
      page: filters.page,
      limit: filters.limit,
    });
  }

  async function approve(applicationIdInput, actor, context = {}) {
    requireStaff(actor);
    const applicationId = toPositiveInteger(applicationIdInput, 'Application ID');
    const result = await membershipRepository.approve(applicationId, actor.userId, {
      onBeforeCommit: ({ application, member, decisionAt, transaction }) =>
        writeAudit(
          context,
          'MEMBERSHIP_APPLICATION_APPROVED',
          actor,
          application,
          member,
          { decisionAt },
          transaction
        ),
    });

    if (!result) {
      throw errors.notFound('MEMBERSHIP_APPLICATION_NOT_FOUND', 'Membership application was not found.');
    }
    if (result.invalidStatus) {
      throw errors.conflict('MEMBERSHIP_APPLICATION_NOT_PENDING', 'Only pending applications can be approved.');
    }

    const notificationStatus = await notifyMembershipResult(result);
    return {
      ...toStatusResponse(
        result,
        result.member || {
          userId: result.userId,
          status: 'APPROVED',
          approvedAt: result.approvedAt,
        }
      ),
      notificationStatus,
    };
  }

  async function reject(applicationIdInput, reason, actor, context = {}) {
    requireStaff(actor);
    const applicationId = toPositiveInteger(applicationIdInput, 'Application ID');
    const cleanReason = String(reason || '').trim();

    if (!cleanReason) {
      throw errors.badRequest('REJECTION_REASON_REQUIRED', 'Rejection reason is required.');
    }
    if (cleanReason.length > 500) {
      throw errors.badRequest('REJECTION_REASON_TOO_LONG', 'Rejection reason must be at most 500 characters.');
    }

    const result = await membershipRepository.reject(applicationId, actor.userId, cleanReason, {
      onBeforeCommit: ({ application, member, decisionAt, transaction }) =>
        writeAudit(
          context,
          'MEMBERSHIP_APPLICATION_REJECTED',
          actor,
          application,
          member,
          { decisionAt, reason: cleanReason },
          transaction
        ),
    });

    if (!result) {
      throw errors.notFound('MEMBERSHIP_APPLICATION_NOT_FOUND', 'Membership application was not found.');
    }
    if (result.invalidStatus) {
      throw errors.conflict('MEMBERSHIP_APPLICATION_NOT_PENDING', 'Only pending applications can be rejected.');
    }

    const notificationStatus = await notifyMembershipResult(result);
    return {
      ...toStatusResponse(
        result,
        result.member || { userId: result.userId, status: 'REJECTED' }
      ),
      notificationStatus,
    };
  }

  return {
    apply,
    getMyStatus,
    listApplications,
    approve,
    reject,
  };
}

const defaultMembershipService = createMembershipService();

module.exports = {
  createMembershipService,
  defaultMembershipService,
};
