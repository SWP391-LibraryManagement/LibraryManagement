const INBOX_TYPES = Object.freeze([
  'GENERAL_SYSTEM',
  'RESERVATION_AVAILABLE',
  'DUE_DATE_REMINDER',
  'OVERDUE_NOTICE',
  'FINE_NOTICE',
]);

const ACTION_MAPPINGS = Object.freeze([
  {
    type: 'GENERAL_SYSTEM',
    templateKey: 'MEMBERSHIP_RESULT',
    sourceFeatures: ['FE04'],
    actionPath: '/membership',
  },
  {
    type: 'RESERVATION_AVAILABLE',
    templateKey: 'RESERVATION_READY',
    sourceFeatures: ['FE08'],
    actionPath: '/reservations/mine',
  },
  {
    type: 'DUE_DATE_REMINDER',
    templateKey: 'DUE_DATE_REMINDER',
    sourceFeatures: ['FE07'],
    actionPath: '/borrowing/history',
  },
  {
    type: 'OVERDUE_NOTICE',
    templateKey: 'OVERDUE_NOTICE',
    sourceFeatures: ['FE07', 'FE09'],
    actionPath: '/borrowing/history',
  },
  {
    type: 'FINE_NOTICE',
    templateKey: 'FINE_NOTICE',
    sourceFeatures: ['FE09'],
    actionPath: '/fines/mine',
  },
]);

function getInboxActionPath(notification) {
  const mapping = ACTION_MAPPINGS.find(
    ({ type, templateKey, sourceFeatures }) =>
      notification?.type === type &&
      notification?.templateKey === templateKey &&
      sourceFeatures.includes(notification?.sourceFeature)
  );

  return mapping?.actionPath || null;
}

function toSafeInboxItem(notification) {
  if (!notification) {
    return null;
  }

  return {
    notificationId: notification.notificationId,
    type: notification.type,
    title: notification.title,
    message: notification.body,
    createdAt: notification.createdAt,
    readAt: notification.readAt,
    actionPath: getInboxActionPath(notification),
  };
}

module.exports = {
  INBOX_TYPES,
  getInboxActionPath,
  toSafeInboxItem,
};
