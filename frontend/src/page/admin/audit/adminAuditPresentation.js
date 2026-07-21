const ACTION_LABELS = Object.freeze({
  AUTH_LOGIN_ATTEMPT: 'Thử đăng nhập',
  AUTH_LOGIN_SUCCESS: 'Đăng nhập thành công',
  AUTH_LOGOUT: 'Đăng xuất',
  USER_CREATE: 'Tạo người dùng',
  USER_UPDATE: 'Cập nhật người dùng',
  USER_DEACTIVATE: 'Vô hiệu hóa người dùng',
  USER_ROLE_ASSIGN: 'Gán vai trò',
  USER_ROLE_REVOKE: 'Thu hồi vai trò',
  REPORT_USERS_VIEW: 'Xem báo cáo người dùng',
});

const DETAIL_LABELS = Object.freeze({
  roleName: 'Vai trò',
  reportType: 'Loại báo cáo',
  status: 'Trạng thái',
  reason: 'Lý do',
  changedFields: 'Trường đã thay đổi',
});

export function formatAuditAction(action) {
  const raw = String(action || '').trim();
  return {
    label: ACTION_LABELS[raw] || raw || 'Chưa xác định',
    raw,
    known: Boolean(ACTION_LABELS[raw]),
  };
}

export function formatAuditDetailKey(key) {
  return DETAIL_LABELS[key] || key;
}
