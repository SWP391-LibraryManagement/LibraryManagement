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

function toStatusResponse(application, member) {
  const status = application?.status || member?.status || 'NONE';

  return {
    status,
    applicationId: application?.applicationId || null,
    userId: application?.userId || member?.userId || null,
    appliedAt: application?.appliedAt || null,
    approvedAt: application?.approvedAt || member?.approvedAt || null,
    reviewedBy: application?.reviewedBy || null,
    rejectionReason: application?.rejectionReason || null,
    application: application || null,
    member: member || null,
  };
}

function createMembershipService({
  membershipRepository,
  auditLogRepository,
} = {}) {
  if (!membershipRepository) {
    membershipRepository = require('../repositories/membershipRepository');
  }

  if (!auditLogRepository) {
    auditLogRepository = require('../repositories/auditLogRepository');
  }

  async function writeAudit(context, action, actor, application, metadata = {}) {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') return;

    await auditLogRepository.create({
      userId: actor?.userId || null,
      action,
      targetType: 'MEMBERSHIP_APPLICATION',
      targetId: application?.applicationId || null,
      metadata: { userId: application?.userId, status: application?.status, ...metadata },
      ipAddress: context?.ip || null,
      userAgent: context?.userAgent || null,
    });
  }

  function requireMember(actor) {
    if (!hasAnyRole(actor, ['MEMBER'])) {
      throw errors.forbidden('MEMBER_ROLE_REQUIRED', 'Only registered members can perform this action.');
    }
  }

  function requireStaff(actor) {
    if (!hasAnyRole(actor, ['LIBRARIAN', 'ADMIN'])) {
      throw errors.forbidden('STAFF_ROLE_REQUIRED', 'Only librarian or admin can review membership applications.');
    }
  }

  async function apply(actor, context = {}) {
    requireMember(actor);

    const user = await membershipRepository.findUser(actor.userId);
    if (!user) {
      throw errors.notFound('USER_NOT_FOUND', 'User account was not found.');
    }

    if ((user.Status || user.status) !== 'ACTIVE') {
      throw errors.forbidden('USER_ACCOUNT_INACTIVE', 'User account is not active.');
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

    const application = await membershipRepository.createApplication(actor.userId);
    await writeAudit(context, 'MEMBERSHIP_APPLICATION_SUBMITTED', actor, application);
    return { application, ...toStatusResponse(application, { ...member, status: 'PENDING' }) };
  }

  async function getMyStatus(actor) {
    requireMember(actor);
    const [application, member] = await Promise.all([
      membershipRepository.findLatestByUserId(actor.userId),
      membershipRepository.findMemberByUserId(actor.userId),
    ]);

    return toStatusResponse(application, member);
  }

  async function listApplications(filters, actor) {
    requireStaff(actor);

    const status = filters.status ? String(filters.status).toUpperCase() : undefined;
    if (status && !APPLICATION_STATUSES.includes(status)) {
      throw errors.badRequest('INVALID_STATUS', 'Membership application status is not supported.');
    }

    return membershipRepository.listApplications({
      status,
      page: filters.page,
      limit: filters.limit,
    });
  }

  async function approve(applicationIdInput, actor, context = {}) {
    requireStaff(actor);
    const applicationId = toPositiveInteger(applicationIdInput, 'Application ID');
    const result = await membershipRepository.approve(applicationId, actor.userId);

    if (!result) {
      throw errors.notFound('MEMBERSHIP_APPLICATION_NOT_FOUND', 'Membership application was not found.');
    }
    if (result.invalidStatus) {
      throw errors.conflict('MEMBERSHIP_APPLICATION_NOT_PENDING', 'Only pending applications can be approved.');
    }

    await writeAudit(context, 'MEMBERSHIP_APPLICATION_APPROVED', actor, result);
    return { application: result, ...toStatusResponse(result, { userId: result.userId, status: 'APPROVED', approvedAt: result.approvedAt }) };
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

    const result = await membershipRepository.reject(applicationId, actor.userId, cleanReason);

    if (!result) {
      throw errors.notFound('MEMBERSHIP_APPLICATION_NOT_FOUND', 'Membership application was not found.');
    }
    if (result.invalidStatus) {
      throw errors.conflict('MEMBERSHIP_APPLICATION_NOT_PENDING', 'Only pending applications can be rejected.');
    }

    await writeAudit(context, 'MEMBERSHIP_APPLICATION_REJECTED', actor, result, { reason: cleanReason });
    return { application: result, ...toStatusResponse(result, { userId: result.userId, status: 'REJECTED' }) };
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
