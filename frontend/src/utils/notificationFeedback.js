// @spec BR-FE10-008, MF-FE10-003, MF-FE10-006
// Shared helper để ánh xạ `notificationStatus` từ kết quả side-effect (đặt chỗ / duyệt hội viên / duyệt mượn)
// sang message toast tiếng Việt. Tránh tình trạng mỗi page tự parse và tạo nhãn khác nhau.

const DEFAULT_ACTIONS = {
  approve: 'Đã duyệt',
  reject: 'Đã từ chối',
  notify: 'Đã thông báo',
  reserve: 'Đã đặt chỗ',
};

function normalizeStatus(value) {
  return String(value || '').trim().toUpperCase();
}

function describeDecision(action, customActionLabel) {
  if (customActionLabel) return customActionLabel;
  return DEFAULT_ACTIONS[action] || 'Đã xử lý';
}

// Trả về { type, message } cho toast. type: 'success' | 'warning' | 'info' | 'error'.
// successMessage / warningMessage cho phép caller override label cụ thể theo ngữ cảnh.
export function getNotificationFeedback({
  action,
  notificationStatus,
  customActionLabel,
  successMessage,
  warningMessage,
  infoMessage,
  pendingMessage,
}) {
  const status = normalizeStatus(notificationStatus);
  const decision = describeDecision(action, customActionLabel);

  if (status === 'FAILED') {
    return {
      type: 'warning',
      message: warningMessage || `${decision}, nhưng thông báo kết quả chưa gửi được.`,
    };
  }

  if (status === 'PENDING' || status === 'PROCESSING' || status === 'QUEUED') {
    return {
      type: 'info',
      message: pendingMessage || `${decision}. Thông báo đang được xếp hàng gửi, có thể nhận trong vài phút.`,
    };
  }

  if (status === 'SKIPPED') {
    return {
      type: 'info',
      message: infoMessage || `${decision}. Không cần gửi thông báo cho trường hợp này.`,
    };
  }

  if (status === 'SENT' || status === 'DELIVERED') {
    return {
      type: 'success',
      message: successMessage || `${decision}. Thông báo đã được gửi.`,
    };
  }

  // Mặc định: không trả notificationStatus (undefined / null / unknown). Coi như thành công để không lộ chi tiết.
  return {
    type: 'success',
    message: successMessage || `${decision}.`,
  };
}

// @spec FR-FE08-021 — thu thập warnings từ expire-holds về RESERVATION_NOTIFY_AUDIT_FAILED.
// Trả về danh sách message tiếng Việt để hiển thị toast warning song song với success toast.
export function describeNotificationWarnings(warnings = []) {
  if (!Array.isArray(warnings) || warnings.length === 0) return [];
  return warnings.map((entry) => {
    const code = String(entry?.code || entry?.type || '').toUpperCase();
    const reservationId = entry?.reservationId || entry?.id || '';
    if (code === 'RESERVATION_NOTIFY_AUDIT_FAILED') {
      return reservationId
        ? `Không ghi được nhật ký thông báo cho lượt đặt ${reservationId}.`
        : 'Không ghi được nhật ký thông báo cho một lượt đặt chỗ.';
    }
    return entry?.message || `Có cảnh báo khi gửi thông báo${reservationId ? ` cho lượt đặt ${reservationId}` : ''}.`;
  });
}
