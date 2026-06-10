const errors = require('../utils/safeErrors');

const supportedTypes = [
  'ACCOUNT_VERIFICATION',
  'PASSWORD_RESET',
  'RESERVATION_AVAILABLE',
  'DUE_DATE_REMINDER',
  'OVERDUE_NOTICE',
  'FINE_NOTICE',
  'GENERAL_SYSTEM',
];

const sensitiveKeys = ['token', 'verificationToken', 'resetToken', 'verificationLink', 'resetLink', 'password'];

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

function hasAnyRole(user, allowedRoles) {
  const currentRoles = Array.isArray(user?.roles) ? user.roles.map(normalizeRole) : [];
  return allowedRoles.map(normalizeRole).some((role) => currentRoles.includes(role));
}

function sanitizeString(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/[<>]/g, '');
}

function sanitizePayload(payload = {}) {
  const result = {};

  for (const [key, value] of Object.entries(payload || {})) {
    if (sensitiveKeys.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey.toLowerCase()))) {
      result[key] = '[REDACTED]';
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizePayload(value);
      continue;
    }

    result[key] = typeof value === 'string' ? sanitizeString(value) : value;
  }

  return result;
}

function extractVariables(templateText) {
  const variables = new Set();
  const pattern = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
  let match = pattern.exec(templateText || '');

  while (match) {
    variables.add(match[1]);
    match = pattern.exec(templateText || '');
  }

  return Array.from(variables);
}

function renderTemplate(templateText, templateData) {
  return sanitizeString(
    String(templateText || '').replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) =>
      templateData[key] === undefined || templateData[key] === null ? '' : templateData[key]
    )
  );
}

function createNotificationService({
  notificationRepository,
  userRepository,
  auditLogRepository,
  emailProvider,
} = {}) {
  if (!notificationRepository) {
    notificationRepository = require('../repositories/notificationRepository');
  }

  if (!userRepository) {
    userRepository = require('../repositories/userRepository');
  }

  if (!auditLogRepository) {
    auditLogRepository = require('../repositories/auditLogRepository');
  }

  if (!emailProvider) {
    emailProvider = {
      async send() {
        return { providerMessageId: `mock-${Date.now()}` };
      },
    };
  }

  async function writeAudit(context, action, extra = {}) {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') {
      return;
    }

    await auditLogRepository.create({
      userId: extra.userId ?? context?.userId ?? null,
      action,
      targetType: extra.targetType || 'NOTIFICATION',
      targetId: extra.targetId ?? null,
      metadata: extra.metadata || null,
      ipAddress: context?.ip || null,
      userAgent: context?.userAgent || null,
    });
  }

  function requireInternalActor(actor) {
    if (!hasAnyRole(actor, ['LIBRARIAN', 'ADMIN'])) {
      throw errors.forbidden('ROLE_REQUIRED', 'Your role cannot perform this action.');
    }
  }

  async function resolveRecipient({ userId, recipientEmail }) {
    if (userId) {
      const user = await userRepository.getSafeUserById(userId);

      if (!user) {
        throw errors.notFound('RECIPIENT_NOT_FOUND', 'Recipient user was not found.');
      }

      if (!user.email) {
        throw errors.badRequest('RECIPIENT_EMAIL_MISSING', 'Recipient email is required.');
      }

      return {
        userId: user.userId,
        recipientEmail: user.email,
      };
    }

    if (!recipientEmail) {
      throw errors.badRequest('RECIPIENT_REQUIRED', 'Recipient user or email is required.');
    }

    return {
      userId: null,
      recipientEmail,
    };
  }

  function validateTemplateData(template, templateData) {
    const requiredVariables = [
      ...extractVariables(template.subject),
      ...extractVariables(template.body),
    ];
    const missingVariables = requiredVariables.filter(
      (variable) => templateData[variable] === undefined || templateData[variable] === null
    );

    if (missingVariables.length) {
      throw errors.badRequest(
        'TEMPLATE_DATA_MISSING',
        'Required template data is missing.',
        missingVariables.map((field) => ({ field, message: 'Required template variable is missing.' }))
      );
    }
  }

  async function createNotificationRequest(input, actor, context = {}) {
    requireInternalActor(actor);

    const type = String(input.type || '').toUpperCase();
    const channel = String(input.channel || 'EMAIL').toUpperCase();
    const templateKey = String(input.templateKey || '').trim();
    const templateData = sanitizePayload(input.templateData || {});

    if (!supportedTypes.includes(type)) {
      throw errors.badRequest('UNSUPPORTED_NOTIFICATION_TYPE', 'Notification type is not supported.');
    }

    if (channel !== 'EMAIL') {
      throw errors.badRequest('UNSUPPORTED_NOTIFICATION_CHANNEL', 'Notification channel is not supported.');
    }

    if (input.idempotencyKey) {
      const existing = await notificationRepository.findActiveByIdempotencyKey(input.idempotencyKey);

      if (existing) {
        return {
          duplicate: true,
          notification: existing,
        };
      }
    }

    const template = await notificationRepository.findTemplateByCode(templateKey);

    if (!template || template.status !== 'ACTIVE') {
      throw errors.badRequest('TEMPLATE_NOT_AVAILABLE', 'Notification template is not available.');
    }

    const recipient = await resolveRecipient(input);

    validateTemplateData(template, templateData);

    const notification = await notificationRepository.createRequest({
      type,
      channel,
      userId: recipient.userId,
      recipientEmail: recipient.recipientEmail,
      templateId: template.templateId,
      templateKey,
      title: renderTemplate(template.subject, templateData),
      body: renderTemplate(template.body, templateData),
      sourceFeature: input.sourceFeature || null,
      sourceEntityType: input.sourceEntityType || null,
      sourceEntityId: input.sourceEntityId || null,
      idempotencyKey: input.idempotencyKey || null,
      safePayload: templateData,
    });

    await writeAudit(context, 'NOTIFICATION_REQUEST_CREATE', {
      userId: actor.userId,
      targetId: notification.notificationId,
      metadata: {
        type,
        channel,
        sourceFeature: input.sourceFeature || null,
        sourceEntityType: input.sourceEntityType || null,
        sourceEntityId: input.sourceEntityId || null,
      },
    });

    return {
      duplicate: false,
      notification,
    };
  }

  function safeFailureMessage(error) {
    if (error?.safeMessage) {
      return sanitizeString(error.safeMessage).slice(0, 500);
    }

    return 'Notification delivery failed.';
  }

  async function processPendingNotifications(input, actor, context = {}) {
    requireInternalActor(actor);

    const limit = Number(input.limit || 20);
    const pendingNotifications = await notificationRepository.listPending(limit);
    const result = {
      processed: 0,
      failed: 0,
      notifications: [],
    };

    for (const notification of pendingNotifications) {
      try {
        const providerResult = await emailProvider.send({
          to: notification.recipientEmail,
          subject: notification.title,
          body: notification.body,
        });

        const updatedNotification = await notificationRepository.markSent({
          notificationId: notification.notificationId,
          providerMessageId: providerResult?.providerMessageId || null,
        });

        result.processed += 1;
        result.notifications.push(updatedNotification);
      } catch (error) {
        const updatedNotification = await notificationRepository.markFailed({
          notificationId: notification.notificationId,
          safeErrorMessage: safeFailureMessage(error),
        });

        result.failed += 1;
        result.notifications.push(updatedNotification);
      }
    }

    await writeAudit(context, 'NOTIFICATION_PROCESS_PENDING', {
      userId: actor.userId,
      metadata: { processed: result.processed, failed: result.failed },
    });

    return result;
  }

  return {
    createNotificationRequest,
    processPendingNotifications,
  };
}

const defaultNotificationService = createNotificationService();

module.exports = {
  createNotificationService,
  defaultNotificationService,
  sanitizePayload,
};
