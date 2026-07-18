export const MEMBERSHIP_STATUS_LABELS = {
  NONE: 'Chưa nộp đơn',
  PENDING: 'Đang chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  INACTIVE: 'Ngừng hoạt động',
};

export function membershipStatusLabel(status) {
  return MEMBERSHIP_STATUS_LABELS[String(status || 'NONE').toUpperCase()] || status || 'Chưa rõ';
}
