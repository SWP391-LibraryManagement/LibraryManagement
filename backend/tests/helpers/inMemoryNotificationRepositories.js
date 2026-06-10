function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeInMemoryNotificationDependencies() {
  let nextNotificationId = 1;
  const templates = [
    {
      templateId: 1,
      templateCode: 'ACCOUNT_VERIFICATION',
      subject: 'Verify {{name}}',
      body: 'Verification purpose: {{purpose}}',
      status: 'ACTIVE',
    },
    {
      templateId: 2,
      templateCode: 'PASSWORD_RESET',
      subject: 'Reset password',
      body: 'Use this safe reset link: {{resetLink}}',
      status: 'ACTIVE',
    },
    {
      templateId: 3,
      templateCode: 'RESERVATION_READY',
      subject: 'Reservation ready',
      body: 'Copy {{copyId}} is ready.',
      status: 'ACTIVE',
    },
    {
      templateId: 4,
      templateCode: 'DUE_DATE_REMINDER',
      subject: 'Due date reminder',
      body: 'Due date: {{dueDate}}',
      status: 'ACTIVE',
    },
    {
      templateId: 5,
      templateCode: 'FINE_NOTICE',
      subject: 'Fine notice',
      body: 'Fine amount: {{amount}}',
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

    async findActiveByIdempotencyKey(idempotencyKey) {
      return mapNotification(
        notifications.find(
          (notification) =>
            notification.idempotencyKey === idempotencyKey &&
            ['PENDING', 'SENT', 'DELIVERED'].includes(notification.status)
        ) || null
      );
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
        type: input.templateCode,
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
        .filter((notification) => notification.status === 'PENDING')
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
