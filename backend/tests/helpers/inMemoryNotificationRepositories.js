function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const sensitiveQueueIdentifiers = new Set([
  'ACCOUNT_VERIFICATION',
  'PASSWORD_RESET',
  'ACCOUNT_SETUP',
  'EMAIL_VERIFY',
]);

function isSensitiveQueueNotification(notification) {
  return [notification?.type, notification?.templateKey].some((identifier) =>
    sensitiveQueueIdentifiers.has(String(identifier || '').toUpperCase())
  );
}

function makeInMemoryNotificationDependencies() {
  let nextNotificationId = 1;
  const templates = [
    {
      templateId: 1,
      templateCode: 'ACCOUNT_VERIFICATION',
      subject: 'Verify your library account',
      body: 'Verification code: {{otp}}. Expires in {{expiresInMinutes}} minutes.',
      status: 'ACTIVE',
    },
    {
      templateId: 2,
      templateCode: 'PASSWORD_RESET',
      subject: 'Reset your library password',
      body: 'Password reset code: {{otp}}. Expires in {{expiresInMinutes}} minutes.',
      status: 'ACTIVE',
    },
    {
      templateId: 3,
      templateCode: 'ACCOUNT_SETUP',
      subject: 'Set up your library account',
      body: 'Setup link: {{setupLink}}. Expires in {{expiresInHours}} hours.',
      status: 'ACTIVE',
    },
    {
      templateId: 4,
      templateCode: 'RESERVATION_READY',
      subject: 'Reservation ready',
      body: 'Copy {{copyId}} is ready.',
      status: 'ACTIVE',
    },
    {
      templateId: 5,
      templateCode: 'DUE_DATE_REMINDER',
      subject: 'Due date reminder',
      body: 'Due date: {{dueDate}}',
      status: 'ACTIVE',
    },
    {
      templateId: 6,
      templateCode: 'FINE_NOTICE',
      subject: 'Fine notice',
      body: 'Fine amount: {{amount}}',
      status: 'ACTIVE',
    },
    {
      templateId: 7,
      templateCode: 'OVERDUE_NOTICE',
      subject: 'Overdue notice',
      body: 'Overdue since: {{dueDate}}',
      status: 'ACTIVE',
    },
    {
      templateId: 8,
      templateCode: 'MEMBERSHIP_RESULT',
      subject: 'Membership result',
      body: 'Membership status: {{membershipStatus}}',
      status: 'ACTIVE',
    },
  ];
  const notifications = [];
  const attempts = [];

  function mapNotification(notification) {
    return clone(notification || null);
  }

  const notificationRepository = {
    async findTemplateByCode(templateCode) {
      return clone(templates.find((template) => template.templateCode === templateCode) || null);
    },

    async findByIdempotencyKey(idempotencyKey) {
      return mapNotification(
        notifications.find((notification) => notification.idempotencyKey === idempotencyKey) || null
      );
    },

    async findById(notificationId) {
      return mapNotification(
        notifications.find((notification) => notification.notificationId === Number(notificationId)) || null
      );
    },

    async transitionFailedToPending(notificationId) {
      const notification = notifications.find(
        (item) => item.notificationId === Number(notificationId) && item.status === 'FAILED'
      );

      if (!notification) {
        return null;
      }

      notification.status = 'PENDING';
      notification.lastErrorMessage = null;
      notification.sentAt = null;
      return mapNotification(notification);
    },

    async createRequest(input) {
      const notification = {
        notificationId: nextNotificationId,
        type: input.type,
        channel: input.channel,
        userId: input.userId || null,
        recipientEmail: input.recipientEmail,
        templateId: input.templateId,
        templateKey: input.templateKey,
        title: input.title,
        body: input.body,
        status: 'PENDING',
        sourceFeature: input.sourceFeature || null,
        sourceEntityType: input.sourceEntityType || null,
        sourceEntityId: input.sourceEntityId || null,
        idempotencyKey: input.idempotencyKey || null,
        safePayload: input.safePayload || null,
        attemptCount: 0,
        lastErrorMessage: null,
        createdAt: new Date(),
        sentAt: null,
      };

      nextNotificationId += 1;
      notifications.push(notification);
      return mapNotification(notification);
    },

    async createNotification(input) {
      const template = templates.find((item) => item.templateCode === input.templateCode);

      if (!template) {
        return null;
      }

      return this.createRequest({
        type: null,
        channel: 'EMAIL',
        userId: input.userId,
        recipientEmail: input.recipientEmail,
        templateId: template.templateId,
        templateKey: input.templateCode,
        title: template.subject,
        body: template.body,
        sourceFeature: input.sourceFeature,
        sourceEntityType: input.sourceEntityType,
        sourceEntityId: input.sourceEntityId,
        safePayload: input.safePayload,
      });
    },

    async listPending(limit = 20) {
      return notifications
        .filter(
          (notification) =>
            notification.status === 'PENDING' &&
            !isSensitiveQueueNotification(notification)
        )
        .slice(0, limit)
        .map(mapNotification);
    },

    async markSent({ notificationId, providerMessageId }) {
      const notification = notifications.find(
        (item) => item.notificationId === Number(notificationId)
      );

      notification.status = 'SENT';
      notification.sentAt = new Date();
      notification.attemptCount += 1;
      notification.lastErrorMessage = null;
      attempts.push({
        notificationId: notification.notificationId,
        status: 'SENT',
        providerMessageId: providerMessageId || null,
        attemptedAt: new Date(),
      });

      return mapNotification(notification);
    },

    async markFailed({ notificationId, safeErrorMessage }) {
      const notification = notifications.find(
        (item) => item.notificationId === Number(notificationId)
      );

      notification.status = 'FAILED';
      notification.attemptCount += 1;
      notification.lastErrorMessage = safeErrorMessage;
      attempts.push({
        notificationId: notification.notificationId,
        status: 'FAILED',
        safeErrorMessage,
        attemptedAt: new Date(),
      });

      return mapNotification(notification);
    },
  };

  return {
    notificationRepository,
    state: {
      templates,
      notifications,
      attempts,
    },
  };
}

module.exports = {
  makeInMemoryNotificationDependencies,
};
