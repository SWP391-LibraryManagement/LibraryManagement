export const ADMIN_MEMBERSHIP_PAGE_SIZE = 10;
export const EMPTY_ADMIN_MEMBERSHIP_FILTERS = Object.freeze({
  q: '',
  status: 'PENDING',
});

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function normalizeAdminMembershipList(response = {}, fallback = {}) {
  const rows = Array.isArray(response)
    ? response
    : response.applications || response.items || response.data || [];
  const limit = toPositiveInteger(
    response.limit || response.pagination?.limit,
    fallback.limit || ADMIN_MEMBERSHIP_PAGE_SIZE,
  );
  const total = Math.max(0, Number(response.total || response.pagination?.total || rows.length) || 0);

  return {
    applications: rows.map((row) => ({
      applicationId: Number(row.applicationId || row.id),
      userId: row.userId ?? row.applicant?.userId ?? null,
      status: String(row.status || '').toUpperCase(),
      appliedAt: row.appliedAt || row.createdAt || null,
      approvedAt: row.approvedAt || null,
      rejectionReason: row.rejectionReason || row.reviewNote || null,
      applicant: {
        userId: row.applicant?.userId ?? row.userId ?? null,
        fullName: row.applicant?.fullName || row.fullName || row.name || '',
        username: row.applicant?.username || row.username || row.userName || '',
        email: row.applicant?.email || row.email || '',
        phone: row.applicant?.phone || row.phone || '',
      },
    })),
    pagination: {
      page: toPositiveInteger(
        response.page || response.pagination?.page,
        fallback.page || 1,
      ),
      limit,
      total,
      totalPages: toPositiveInteger(
        response.totalPages || response.pagination?.totalPages,
        Math.max(Math.ceil(total / limit), 1),
      ),
    },
  };
}

export function isPendingMembershipApplication(application) {
  return String(application?.status || '').toUpperCase() === 'PENDING';
}

export function getMembershipDecisionFeedback(action, notificationStatus) {
  const approved = action === 'approve';
  const decision = approved ? 'Đã duyệt đơn' : 'Đã từ chối đơn';

  if (String(notificationStatus || '').toUpperCase() === 'FAILED') {
    return {
      type: 'warning',
      message: `${decision}, nhưng thông báo kết quả chưa gửi được.`,
    };
  }

  return {
    type: 'success',
    message: approved
      ? 'Đã duyệt đơn đăng ký hội viên.'
      : 'Đã từ chối đơn đăng ký hội viên.',
  };
}
