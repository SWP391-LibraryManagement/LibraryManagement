const errors = require('../utils/safeErrors');

const MAX_ACTIVE_BORROWED_COPIES = 5;
const LOAN_DAYS = 14;
const RENEWAL_LIMIT = 1;
const ACTIVE_BORROW_STATUSES = ['BORROWED', 'OVERDUE'];
const TERMINAL_DETAIL_STATUSES = ['RETURNED', 'LOST', 'DAMAGED'];

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

function toDateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function differenceInCalendarDays(leftDate, rightDate) {
  const left = toDateOnly(new Date(leftDate));
  const right = toDateOnly(new Date(rightDate));
  return Math.max(0, Math.ceil((left.getTime() - right.getTime()) / 86400000));
}

function createBorrowingService({
  borrowingRepository,
  auditLogRepository,
  notificationRepository,
  clock = () => new Date(),
} = {}) {
  if (!borrowingRepository) {
    borrowingRepository = require('../repositories/borrowingRepository');
  }

  if (!auditLogRepository) {
    auditLogRepository = require('../repositories/auditLogRepository');
  }

  if (!notificationRepository) {
    notificationRepository = require('../repositories/notificationRepository');
  }

  async function writeAudit(context, action, extra = {}) {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') {
      return;
    }

    await auditLogRepository.create({
      userId: extra.userId ?? context?.userId ?? null,
      action,
      targetType: extra.targetType || 'BORROWING',
      targetId: extra.targetId ?? null,
      metadata: extra.metadata || null,
      ipAddress: context?.ip || null,
      userAgent: context?.userAgent || null,
    });
  }

  async function createNotification({ userId, recipientEmail, templateCode, sourceEntityId, safePayload }) {
    if (!notificationRepository || typeof notificationRepository.createNotification !== 'function') {
      return;
    }

    await notificationRepository.createNotification({
      userId,
      recipientEmail,
      templateCode,
      sourceFeature: 'FE07',
      sourceEntityType: 'BORROWING',
      sourceEntityId,
      safePayload,
    });
  }

  function requireMember(actor) {
    if (!hasAnyRole(actor, ['MEMBER'])) {
      throw errors.forbidden('MEMBER_ROLE_REQUIRED', 'Only members can perform this action.');
    }
  }

  function requireStaff(actor) {
    if (!hasAnyRole(actor, ['LIBRARIAN', 'ADMIN'])) {
      throw errors.forbidden('STAFF_ROLE_REQUIRED', 'Only librarian or admin can perform this action.');
    }
  }

  async function ensureEligibleMember(userId) {
    const eligibility = await borrowingRepository.getMemberEligibility(userId);

    if (!eligibility) {
      throw errors.notFound('MEMBER_NOT_FOUND', 'Member account was not found.');
    }

    if (eligibility.userStatus !== 'ACTIVE') {
      throw errors.forbidden('MEMBER_ACCOUNT_INACTIVE', 'Member account is not active.');
    }

    if (eligibility.memberStatus !== 'APPROVED') {
      throw errors.forbidden('MEMBERSHIP_NOT_APPROVED', 'Approved membership is required to borrow books.');
    }

    return eligibility;
  }

  async function ensureNoBorrowingBlockers(userId) {
    if (await borrowingRepository.hasBlockingFine(userId)) {
      throw errors.conflict('UNPAID_FINE_BLOCKS_BORROWING', 'Unpaid fine blocks borrowing.');
    }

    if (await borrowingRepository.hasOverdueActiveLoans(userId, clock())) {
      throw errors.conflict('OVERDUE_LOAN_BLOCKS_BORROWING', 'Overdue borrowed item blocks borrowing.');
    }
  }

  function normalizeCopyIds(copyIds) {
    if (!Array.isArray(copyIds) || copyIds.length === 0) {
      throw errors.badRequest('COPY_IDS_REQUIRED', 'At least one copy ID is required.');
    }

    const normalizedCopyIds = copyIds.map((copyId) => toPositiveInteger(copyId, 'Copy ID'));
    const uniqueCopyIds = new Set(normalizedCopyIds);

    if (uniqueCopyIds.size !== normalizedCopyIds.length) {
      throw errors.badRequest('DUPLICATE_COPY_IN_REQUEST', 'Duplicate copy IDs are not allowed.');
    }

    return normalizedCopyIds;
  }

  async function validateCopiesAvailable(copyIds) {
    const copies = await borrowingRepository.findCopiesByIds(copyIds);
    const foundIds = new Set(copies.map((copy) => copy.copyId));

    for (const copyId of copyIds) {
      if (!foundIds.has(copyId)) {
        throw errors.notFound('COPY_NOT_FOUND', 'Requested copy was not found.');
      }
    }

    const unavailableCopy = copies.find((copy) => copy.status !== 'AVAILABLE');

    if (unavailableCopy) {
      throw errors.conflict('COPY_NOT_AVAILABLE', 'A requested copy is not available.');
    }

    return copies;
  }

  async function validateBorrowLimit(userId, requestedCount) {
    const activeCount = await borrowingRepository.countActiveBorrowedCopies(userId);

    if (activeCount + requestedCount > MAX_ACTIVE_BORROWED_COPIES) {
      throw errors.conflict(
        'BORROW_LIMIT_EXCEEDED',
        'A member cannot have more than 5 active borrowed copies.'
      );
    }
  }

  async function createBorrowRequest(input, actor, context = {}) {
    requireMember(actor);

    const userId = actor.userId;
    const copyIds = normalizeCopyIds(input.copyIds);

    await ensureEligibleMember(userId);
    await ensureNoBorrowingBlockers(userId);
    await validateBorrowLimit(userId, copyIds.length);
    await validateCopiesAvailable(copyIds);

    const borrowRequest = await borrowingRepository.createBorrowRequest({ userId, copyIds });

    await writeAudit(context, 'BORROW_REQUEST_CREATE', {
      userId,
      targetId: borrowRequest.requestId,
      metadata: { copyIds },
    });

    return {
      borrowRequest,
    };
  }

  async function listMyBorrowRequests(filters, actor) {
    requireMember(actor);

    const borrowRequests = await borrowingRepository.listBorrowRequests({
      userId: actor.userId,
      status: filters.status || undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
    });

    return { borrowRequests };
  }

  async function listBorrowRequests(filters, actor) {
    requireStaff(actor);

    const borrowRequests = await borrowingRepository.listBorrowRequests({
      memberId: filters.memberId ? Number(filters.memberId) : undefined,
      status: filters.status || undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
    });

    return { borrowRequests };
  }

  async function listMemberBorrowings(memberIdInput, filters, actor) {
    requireStaff(actor);

    const memberId = toPositiveInteger(memberIdInput, 'Member ID');
    const borrowings = await borrowingRepository.listBorrowDetails({
      userId: memberId,
      status: filters.status || undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
    });

    return { borrowings };
  }

  async function approveBorrowRequest(requestIdInput, input, actor, context = {}) {
    requireStaff(actor);

    const requestId = toPositiveInteger(requestIdInput, 'Request ID');
    const borrowRequest = await borrowingRepository.findBorrowRequestById(requestId);

    if (!borrowRequest) {
      throw errors.notFound('BORROW_REQUEST_NOT_FOUND', 'Borrow request was not found.');
    }

    if (borrowRequest.status !== 'PENDING') {
      throw errors.conflict('BORROW_REQUEST_NOT_PENDING', 'Only pending borrow requests can be approved.');
    }

    const copyIds = borrowRequest.details.map((detail) => detail.copyId);

    await ensureEligibleMember(borrowRequest.userId);
    await ensureNoBorrowingBlockers(borrowRequest.userId);
    await validateBorrowLimit(borrowRequest.userId, copyIds.length);
    await validateCopiesAvailable(copyIds);

    const approvalDate = clock();
    const dueDate = addDays(approvalDate, LOAN_DAYS);
    const approvedRequest = await borrowingRepository.approveBorrowRequest({
      requestId,
      approvedBy: actor.userId,
      approvalDate,
      dueDate,
    });

    if (!approvedRequest) {
      throw errors.conflict('BORROW_REQUEST_APPROVAL_FAILED', 'Borrow request cannot be approved safely.');
    }

    await writeAudit(context, 'BORROW_REQUEST_APPROVE', {
      userId: actor.userId,
      targetId: requestId,
      metadata: { approvedMemberId: approvedRequest.userId, copyIds, notes: input.notes || null },
    });

    await createNotification({
      userId: approvedRequest.userId,
      recipientEmail: approvedRequest.member.email,
      templateCode: 'DUE_DATE_REMINDER',
      sourceEntityId: approvedRequest.requestId,
      safePayload: {
        purpose: 'BORROW_APPROVED',
        requestId: approvedRequest.requestId,
        dueDate,
      },
    });

    return {
      borrowRequest: approvedRequest,
    };
  }

  async function rejectBorrowRequest(requestIdInput, input, actor, context = {}) {
    requireStaff(actor);

    const requestId = toPositiveInteger(requestIdInput, 'Request ID');
    const borrowRequest = await borrowingRepository.findBorrowRequestById(requestId);

    if (!borrowRequest) {
      throw errors.notFound('BORROW_REQUEST_NOT_FOUND', 'Borrow request was not found.');
    }

    if (borrowRequest.status !== 'PENDING') {
      throw errors.conflict('BORROW_REQUEST_NOT_PENDING', 'Only pending borrow requests can be rejected.');
    }

    const rejectedRequest = await borrowingRepository.rejectBorrowRequest({
      requestId,
      rejectedBy: actor.userId,
    });

    await writeAudit(context, 'BORROW_REQUEST_REJECT', {
      userId: actor.userId,
      targetId: requestId,
      metadata: { rejectedMemberId: borrowRequest.userId, reason: input.reason },
    });

    return {
      borrowRequest: rejectedRequest,
    };
  }

  function mapReturnConditionToStatuses(condition) {
    if (condition === 'DAMAGED') {
      return { detailStatus: 'DAMAGED', copyStatus: 'DAMAGED' };
    }

    if (condition === 'LOST') {
      return { detailStatus: 'LOST', copyStatus: 'LOST' };
    }

    return { detailStatus: 'RETURNED', copyStatus: 'AVAILABLE' };
  }

  async function returnBorrowDetail(borrowDetailIdInput, input, actor, context = {}) {
    requireStaff(actor);

    const borrowDetailId = toPositiveInteger(borrowDetailIdInput, 'Borrow detail ID');
    const borrowDetail = await borrowingRepository.findBorrowDetailById(borrowDetailId);

    if (!borrowDetail) {
      throw errors.notFound('BORROW_DETAIL_NOT_FOUND', 'Borrow detail was not found.');
    }

    if (borrowDetail.status !== 'BORROWED') {
      throw errors.conflict('BORROW_DETAIL_NOT_BORROWED', 'Only borrowed items can be returned.');
    }

    const returnDate = input.returnDate ? new Date(input.returnDate) : clock();

    if (borrowDetail.borrowDate && toDateOnly(returnDate) < toDateOnly(new Date(borrowDetail.borrowDate))) {
      throw errors.badRequest('INVALID_RETURN_DATE', 'Return date cannot be before borrow date.');
    }

    const { detailStatus, copyStatus } = mapReturnConditionToStatuses(input.condition);
    const overdueDays = differenceInCalendarDays(returnDate, new Date(borrowDetail.dueDate));
    const returnedDetail = await borrowingRepository.returnBorrowDetail({
      borrowDetailId,
      detailStatus,
      copyStatus,
      returnDate,
    });

    await writeAudit(context, 'BORROW_DETAIL_RETURN', {
      userId: actor.userId,
      targetType: 'BORROW_DETAIL',
      targetId: borrowDetailId,
      metadata: {
        requestId: borrowDetail.requestId,
        memberId: borrowDetail.userId,
        copyId: borrowDetail.copyId,
        condition: input.condition,
        overdueDays,
        notes: input.notes || null,
      },
    });

    return {
      borrowDetail: returnedDetail,
      fineCandidate: {
        userId: borrowDetail.userId,
        borrowDetailId,
        copyId: borrowDetail.copyId,
        condition: input.condition,
        overdueDays,
        needsFineReview: overdueDays > 0 || input.condition === 'DAMAGED' || input.condition === 'LOST',
      },
    };
  }

  async function renewBorrowDetail(borrowDetailIdInput, input, actor, context = {}) {
    const borrowDetailId = toPositiveInteger(borrowDetailIdInput, 'Borrow detail ID');
    const borrowDetail = await borrowingRepository.findBorrowDetailById(borrowDetailId);

    if (!borrowDetail) {
      throw errors.notFound('BORROW_DETAIL_NOT_FOUND', 'Borrow detail was not found.');
    }

    if (hasAnyRole(actor, ['MEMBER']) && borrowDetail.userId !== actor.userId) {
      throw errors.forbidden('BORROW_DETAIL_OWNER_REQUIRED', 'Members can renew only their own borrowed items.');
    }

    if (!hasAnyRole(actor, ['MEMBER', 'LIBRARIAN', 'ADMIN'])) {
      throw errors.forbidden('ROLE_REQUIRED', 'Your role cannot perform this action.');
    }

    if (borrowDetail.status !== 'BORROWED') {
      throw errors.conflict('BORROW_DETAIL_NOT_BORROWED', 'Only borrowed items can be renewed.');
    }

    if (borrowDetail.renewalCount >= RENEWAL_LIMIT) {
      throw errors.conflict('RENEWAL_LIMIT_REACHED', 'This borrowed item has already been renewed.');
    }

    if (toDateOnly(new Date(borrowDetail.dueDate)) < toDateOnly(clock())) {
      throw errors.conflict('BORROW_DETAIL_OVERDUE', 'Overdue borrowed items cannot be renewed.');
    }

    await ensureEligibleMember(borrowDetail.userId);
    await ensureNoBorrowingBlockers(borrowDetail.userId);

    if (await borrowingRepository.hasReservationConflict(borrowDetail.copyId, borrowDetail.userId)) {
      throw errors.conflict('RESERVATION_BLOCKS_RENEWAL', 'Another member has reservation priority for this copy.');
    }

    const newDueDate = addDays(new Date(borrowDetail.dueDate), LOAN_DAYS);
    const renewedDetail = await borrowingRepository.renewBorrowDetail({
      borrowDetailId,
      newDueDate,
    });

    await writeAudit(context, 'BORROW_DETAIL_RENEW', {
      userId: actor.userId,
      targetType: 'BORROW_DETAIL',
      targetId: borrowDetailId,
      metadata: {
        requestId: borrowDetail.requestId,
        memberId: borrowDetail.userId,
        copyId: borrowDetail.copyId,
        newDueDate,
        notes: input.notes || null,
      },
    });

    await createNotification({
      userId: borrowDetail.userId,
      recipientEmail: borrowDetail.member.email,
      templateCode: 'DUE_DATE_REMINDER',
      sourceEntityId: borrowDetail.requestId,
      safePayload: {
        purpose: 'BORROW_RENEWED',
        requestId: borrowDetail.requestId,
        borrowDetailId,
        dueDate: newDueDate,
      },
    });

    return {
      borrowDetail: renewedDetail,
    };
  }

  return {
    createBorrowRequest,
    listMyBorrowRequests,
    listBorrowRequests,
    listMemberBorrowings,
    approveBorrowRequest,
    rejectBorrowRequest,
    returnBorrowDetail,
    renewBorrowDetail,
  };
}

const defaultBorrowingService = createBorrowingService();

module.exports = {
  createBorrowingService,
  defaultBorrowingService,
  ACTIVE_BORROW_STATUSES,
  TERMINAL_DETAIL_STATUSES,
};
