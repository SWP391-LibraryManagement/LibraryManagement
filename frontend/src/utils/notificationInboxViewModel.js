export const ALLOWED_NOTIFICATION_ACTION_PATHS = Object.freeze([
  '/membership',
  '/reservations/mine',
  '/borrowing/history',
  '/fines/mine',
]);

export const NOTIFICATION_READ_STATES = Object.freeze({
  ALL: 'all',
  UNREAD: 'unread',
  READ: 'read',
});

const allowedActionPaths = new Set(ALLOWED_NOTIFICATION_ACTION_PATHS);

export function formatUnreadBadge(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count <= 0) return null;
  if (count >= 100) return '99+';
  return String(Math.floor(count));
}

export function isAllowedNotificationActionPath(value) {
  return typeof value === 'string' && allowedActionPaths.has(value);
}

// @spec BR-FE10-018, FR-FE10-013, EC-FE10-019
export async function openNotificationInboxItem({
  notification,
  markRead,
  refreshUnreadCount,
  navigate,
  onWarning,
}) {
  let readSucceeded = false;

  try {
    await markRead(notification?.notificationId);
    readSucceeded = true;
    await refreshUnreadCount();
  } catch {
    onWarning?.('Không thể đồng bộ trạng thái đã đọc. Nội dung liên quan vẫn có thể được mở.');
  }

  const actionPath = notification?.actionPath;
  const navigated = isAllowedNotificationActionPath(actionPath);
  if (navigated) {
    navigate(actionPath);
  } else {
    onWarning?.('Liên kết của thông báo này không hợp lệ nên đã bị chặn.');
  }

  return { readSucceeded, navigated };
}
