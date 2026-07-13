const crypto = require('crypto');
const env = require('../config/env');
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

const canonicalTemplateKeys = {
  ACCOUNT_VERIFICATION: 'ACCOUNT_VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
  RESERVATION_AVAILABLE: 'RESERVATION_READY',
  DUE_DATE_REMINDER: 'DUE_DATE_REMINDER',
  OVERDUE_NOTICE: 'OVERDUE_NOTICE',
  FINE_NOTICE: 'FINE_NOTICE',
  GENERAL_SYSTEM: 'MEMBERSHIP_RESULT',
};

const sensitiveNotificationTypes = new Set(['ACCOUNT_VERIFICATION', 'PASSWORD_RESET']);
const sensitiveQueueIdentifiers = new Set([
  'ACCOUNT_VERIFICATION',
  'PASSWORD_RESET',
  'EMAIL_VERIFY',
]);
const sensitiveKeyFragments = ['token', 'otp', 'password', 'verificationlink', 'resetlink'];
const unsafeAuditSourceFragments = ['template', 'link', 'token', 'provider', 'stack', 'password', 'otp'];
const allowedSourceFeatures = new Set(['FE02', 'FE07', 'FE08', 'FE09', 'SYSTEM']);

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

function normalizePayloadKey(key) {
  return String(key || '')
    .toLowerCase()
    .replace(/[_\-\s]/g, '');
}

function isSensitivePayloadKey(key) {
  const normalizedKey = normalizePayloadKey(key);
  return sensitiveKeyFragments.some((fragment) => normalizedKey.includes(fragment));
}

function containsSensitivePayloadKey(payload) {
  if (Array.isArray(payload)) {
    return payload.some(containsSensitivePayloadKey);
  }

  if (!payload || typeof payload !== 'object') {
    return false;
  }

  return Object.entries(payload).some(
    ([key, value]) => isSensitivePayloadKey(key) || containsSensitivePayloadKey(value)
  );
}

function sanitizePayload(payload) {
  if (Array.isArray(payload)) {
    return payload.map(sanitizePayload);
  }

  if (!payload || typeof payload !== 'object') {
    return typeof payload === 'string' ? sanitizeString(payload) : payload;
  }

  const result = {};

  for (const [key, value] of Object.entries(payload)) {
    if (isSensitivePayloadKey(key)) {
      result[key] = '[REDACTED]';
      continue;
    }

    result[key] = sanitizePayload(value);
  }

  return result;
}

function safeInternalError(code, message) {
  const error = errors.internal(code, message);
  error.stack = undefined;
  return error;
}

function normalizeSourceFeature(sourceFeature) {
  return String(sourceFeature || '').trim().toUpperCase();
}

function isValidRecipientEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

function safeSourceEntityType(sourceEntityType) {
  if (typeof sourceEntityType !== 'string') {
    return null;
  }

  const normalizedValue = normalizePayloadKey(sourceEntityType);

  if (unsafeAuditSourceFragments.some((fragment) => normalizedValue.includes(fragment))) {
    return null;
  }

  const safeValue = sanitizeString(sourceEntityType)
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .slice(0, 50);

  return safeValue || null;
}

function isSensitiveQueueNotification(notification) {
  return [notification?.type, notification?.templateKey].some((identifier) =>
    sensitiveQueueIdentifiers.has(String(identifier || '').toUpperCase())
  );
}

function deriveSensitiveIdempotencyKey(idempotencyKey) {
  let jwtSecret;

  try {
    jwtSecret = env.requiredEnv('JWT_SECRET');
  } catch (error) {
    throw safeInternalError('NOTIFICATION_CONFIG_ERROR', 'Notification configuration is incomplete.');
  }

  return `sensitive-hmac-sha256:${crypto
    .createHmac('sha256', jwtSecret)
    .update(String(idempotencyKey))
    .digest('hex')}`;
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
      userId: Object.prototype.hasOwnProperty.call(extra, 'userId')
        ? extra.userId
        : context?.userId ?? null,
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

  function validateServiceBoundaryInput(input) {
    if (
      Object.prototype.hasOwnProperty.call(input, 'sourceEntityId') &&
      (!Number.isInteger(input.sourceEntityId) || input.sourceEntityId <= 0)
    ) {
      throw errors.badRequest(
        'INVALID_SOURCE_ENTITY_ID',
        'Source entity ID must be a positive integer.'
      );
    }

    if (
      input.recipientEmail !== undefined &&
      input.recipientEmail !== null &&
      input.recipientEmail !== '' &&
      !isValidRecipientEmail(input.recipientEmail)
    ) {
      throw errors.badRequest('INVALID_RECIPIENT_EMAIL', 'Recipient email must be valid.');
    }
  }

  async function createNotificationRequestWithSource(
    input,
    { sourceFeature, auditUserId, isInternal },
    context = {}
  ) {
    validateServiceBoundaryInput(input);

    const type = String(input.type || '').toUpperCase();
    const channel = String(input.channel || 'EMAIL').toUpperCase();
    const templateKey = String(input.templateKey || '').trim();
    const rawTemplateData = input.templateData || {};

    if (!supportedTypes.includes(type)) {
      throw errors.badRequest('UNSUPPORTED_NOTIFICATION_TYPE', 'Notification type is not supported.');
    }

    if (channel !== 'EMAIL') {
      throw errors.badRequest('UNSUPPORTED_NOTIFICATION_CHANNEL', 'Notification channel is not supported.');
    }

    if (templateKey !== canonicalTemplateKeys[type]) {
      throw errors.badRequest(
        'CANONICAL_TEMPLATE_MISMATCH',
        'Notification type and template key do not match.'
      );
    }

    if (!sensitiveNotificationTypes.has(type) && containsSensitivePayloadKey(rawTemplateData)) {
      throw errors.badRequest(
        'SENSITIVE_TEMPLATE_DATA',
        'Queued notification template data contains a sensitive field.'
      );
    }

    const isSensitiveNotification = sensitiveNotificationTypes.has(type);
    const templateData = isSensitiveNotification
      ? { redacted: true }
      : sanitizePayload(rawTemplateData);
    const persistedSourceFeature = isSensitiveNotification ? null : sourceFeature || null;
    const auditSourceFeature = isSensitiveNotification && !isInternal ? null : sourceFeature || null;
    const sourceEntityType = isSensitiveNotification ? null : input.sourceEntityType || null;
    const sourceEntityId = input.sourceEntityId ?? null;
    const idempotencyKey = input.idempotencyKey
      ? isSensitiveNotification
        ? deriveSensitiveIdempotencyKey(input.idempotencyKey)
        : input.idempotencyKey
      : null;

    if (idempotencyKey) {
      const existing = await notificationRepository.findActiveByIdempotencyKey(idempotencyKey);

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

    validateTemplateData(template, rawTemplateData);

    const renderedTitle = renderTemplate(template.subject, rawTemplateData);
    const renderedBody = renderTemplate(template.body, rawTemplateData);

    let notification = await notificationRepository.createRequest({
      type,
      channel,
      userId: recipient.userId,
      recipientEmail: recipient.recipientEmail,
      templateId: template.templateId,
      templateKey,
      title: isSensitiveNotification ? null : renderedTitle,
      body: isSensitiveNotification ? null : renderedBody,
      sourceFeature: persistedSourceFeature,
      sourceEntityType,
      sourceEntityId,
      idempotencyKey,
      safePayload: templateData,
    });

    if (isSensitiveNotification) {
      let providerFailed = false;

      try {
        await emailProvider.send({
          to: recipient.recipientEmail,
          subject: renderedTitle,
          body: renderedBody,
        });
      } catch (error) {
        try {
          notification = await notificationRepository.markFailed({
            notificationId: notification.notificationId,
            safeErrorMessage: 'Notification delivery failed.',
          });
        } catch (markFailedError) {
          throw safeInternalError(
            'NOTIFICATION_DELIVERY_FAILURE_TRANSITION_FAILED',
            'Notification delivery failure could not be recorded.'
          );
        }
        providerFailed = true;
      }

      if (!providerFailed) {
        try {
          notification = await notificationRepository.markSent({
            notificationId: notification.notificationId,
            providerMessageId: null,
          });
        } catch (error) {
          throw safeInternalError(
            'NOTIFICATION_DELIVERY_TRANSITION_FAILED',
            'Notification delivery state could not be recorded.'
          );
        }
      }
    }

    const auditDetails = {
      userId: auditUserId,
      targetId: notification.notificationId,
      metadata: {
        type,
        channel,
        sourceFeature: auditSourceFeature,
        sourceEntityType: isInternal ? safeSourceEntityType(input.sourceEntityType) : sourceEntityType,
        sourceEntityId,
      },
    };

    if (isSensitiveNotification) {
      try {
        await writeAudit(context, 'NOTIFICATION_REQUEST_CREATE', auditDetails);
      } catch {
        console.error('[notification audit fallback]', {
          code: 'NOTIFICATION_AUDIT_WRITE_FAILED',
          message: 'Notification audit record could not be written.',
        });
      }
    } else {
      await writeAudit(context, 'NOTIFICATION_REQUEST_CREATE', auditDetails);
    }

    return {
      duplicate: false,
      notification,
    };
  }

  async function createNotificationRequest(input, actor, context = {}) {
    requireInternalActor(actor);

    return createNotificationRequestWithSource(
      input,
      { sourceFeature: input.sourceFeature || null, auditUserId: actor.userId, isInternal: false },
      context
    );
  }

  function createSourceNotificationRequester(sourceFeature) {
    const boundSourceFeature = normalizeSourceFeature(sourceFeature);

    if (!allowedSourceFeatures.has(boundSourceFeature)) {
      throw errors.badRequest('SOURCE_REQUESTER_NOT_ALLOWED', 'Notification source is not allowed.');
    }

    return {
      async createNotificationRequest(input, context = {}) {
        if (Object.prototype.hasOwnProperty.call(input || {}, 'sourceFeature')) {
          throw errors.badRequest(
            'SOURCE_FEATURE_OVERRIDE',
            'Notification source cannot be overridden.'
          );
        }

        const result = await createNotificationRequestWithSource(
          input || {},
          { sourceFeature: boundSourceFeature, auditUserId: null, isInternal: true },
          context
        );

        return {
          notificationId: result.notification.notificationId,
          status: result.notification.status,
        };
      },
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
    const pendingNotifications = (await notificationRepository.listPending(limit)).filter(
      (notification) => !isSensitiveQueueNotification(notification)
    );
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
    createSourceNotificationRequester,
    processPendingNotifications,
  };
}

const defaultNotificationService = createNotificationService();

module.exports = {
  createNotificationService,
  defaultNotificationService,
  sanitizePayload,
};
