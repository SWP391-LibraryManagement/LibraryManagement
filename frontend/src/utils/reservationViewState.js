const ACTIVE_QUEUE_STATUSES = new Set(['Waiting']);

export function isActiveReservationQueueStatus(status) {
  return ACTIVE_QUEUE_STATUSES.has(status);
}

export function getExpireHoldsSuccessMessage({ expiredCount = 0, promoted = [] } = {}) {
  const normalizedExpiredCount = Number(expiredCount) || 0;
  const promotedCount = Array.isArray(promoted) ? promoted.length : 0;
  return `Đã xử lý ${normalizedExpiredCount} lượt giữ chỗ hết hạn và chuyển tiếp ${promotedCount} lượt đặt chỗ.`;
}
