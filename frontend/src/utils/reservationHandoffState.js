import { isActiveReservationQueueStatus } from './reservationViewState.js';

export const STALE_QUEUE_HANDOFF_NOTICE = 'Hàng đợi đã thay đổi. Hãy tải lại hoặc chọn bản sao khác.';

function isActiveQueueCopy(reservations, copyId) {
  return reservations.some((item) => (
    item.copyId === copyId && isActiveReservationQueueStatus(item.status)
  ));
}

// @spec FR-FE08-039 — FE07 handoff chỉ mở đúng hàng đợi của bản sao vừa trả.
export function resolveReservationQueueHandoff({
  pendingCopyId,
  currentCopyId,
  reservations,
}) {
  const rows = Array.isArray(reservations) ? reservations : [];

  if (Number.isInteger(pendingCopyId) && pendingCopyId > 0) {
    const isPendingCopyActive = isActiveQueueCopy(rows, pendingCopyId);
    return {
      queueCopyId: isPendingCopyActive ? pendingCopyId : null,
      notice: isPendingCopyActive ? '' : STALE_QUEUE_HANDOFF_NOTICE,
      consumePendingHandoff: true,
    };
  }

  if (isActiveQueueCopy(rows, currentCopyId)) {
    return {
      queueCopyId: currentCopyId,
      notice: '',
      consumePendingHandoff: false,
    };
  }

  return {
    queueCopyId: rows.find((item) => isActiveReservationQueueStatus(item.status))?.copyId || null,
    notice: '',
    consumePendingHandoff: false,
  };
}
