const errors = require('../utils/safeErrors');

const supportedTypes = [
  'ACCOUNT_VERIFICATION',
  'PASSWORD_RESET',
  'ACCOUNT_SETUP',
  'RESERVATION_AVAILABLE',
  'DUE_DATE_REMINDER',
  'OVERDUE_NOTICE',
  'FINE_NOTICE',
  'GENERAL_SYSTEM',
];

const canonicalTemplateKeys = {
  ACCOUNT_VERIFICATION: 'ACCOUNT_VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
  ACCOUNT_SETUP: 'ACCOUNT_SETUP',
  RESERVATION_AVAILABLE: 'RESERVATION_READY',
  DUE_DATE_REMINDER: 'DUE_DATE_REMINDER',
  OVERDUE_NOTICE: 'OVERDUE_NOTICE',
  FINE_NOTICE: 'FINE_NOTICE',
  GENERAL_SYSTEM: 'MEMBERSHIP_RESULT',
};

const sensitiveTypeOwners = {
  ACCOUNT_VERIFICATION: 'FE02',
  PASSWORD_RESET: 'FE02',
  ACCOUNT_SETUP: 'FE11',
};
const sensitiveNotificationTypes = new Set(Object.keys(sensitiveTypeOwners));
const sensitiveQueueIdentifiers = new Set([
  'ACCOUNT_VERIFICATION',
  'PASSWORD_RESET',
  'ACCOUNT_SETUP',
  'EMAIL_VERIFY',
]);
const sensitiveKeyFragments = [
  'token',
  'otp',
  'password',
  'verificationlink',
  'resetlink',
  'setuplink',
];
const unsafeSourceEntityTypeFragments = [
  'template',
  'link',
  'token',
  'provider',
  'stack',
  'password',
  'otp',
];
const allowedSourceFeatures = new Set(['FE02', 'FE07', 'FE08', 'FE09', 'FE11', 'SYSTEM']);

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

function isSensitiveQueueNotification(notification) {
  return [notification?.type, notification?.templateKey].some((identifier) =>
    sensitiveQueueIdentifiers.has(String(identifier || '').toUpperCase())
  );
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
  emailService,
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
    if (!emailService) {
      emailService = require('./emailService');
    }

    emailProvider = {
      async send(message) {
        const result = await emailService.sendNotificationEmail(message);

        if (!result || result.sent !== true) {
          throw new Error('Notification email delivery failed.');
        }

        return { providerMessageId: result.providerMessageId || null };
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

  function validateServiceBoundaryInput(input, { isInternal = false } = {}) {
    if (isInternal && (!input || typeof input !== 'object' || Array.isArray(input))) {
      throw errors.badRequest(
        'INVALID_NOTIFICATION_REQUEST',
        'Notification request must be an object.'
      );
    }

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
      (typeof input.recipientEmail !== 'string' || !isValidRecipientEmail(input.recipientEmail))
    ) {
      throw errors.badRequest('INVALID_RECIPIENT_EMAIL', 'Recipient email must be valid.');
    }

    let sourceFeature = null;

    if (
      input.sourceFeature !== undefined &&
      input.sourceFeature !== null &&
      input.sourceFeature !== ''
    ) {
      if (typeof input.sourceFeature !== 'string') {
        throw errors.badRequest(
          'INVALID_SOURCE_FEATURE',
          'Notification source is not allowed.'
        );
      }

      sourceFeature = normalizeSourceFeature(input.sourceFeature);

      if (!allowedSourceFeatures.has(sourceFeature)) {
        throw errors.badRequest('INVALID_SOURCE_FEATURE', 'Notification source is not allowed.');
      }
    }

    let sourceEntityType = null;

    if (
      input.sourceEntityType !== undefined &&
      input.sourceEntityType !== null &&
      input.sourceEntityType !== ''
    ) {
      if (typeof input.sourceEntityType !== 'string') {
        throw errors.badRequest(
          'INVALID_SOURCE_ENTITY_TYPE',
          'Source entity type must be a safe identifier of at most 50 characters.'
        );
      }

      sourceEntityType = input.sourceEntityType.trim();
      const normalizedSourceEntityType = normalizePayloadKey(sourceEntityType);
      const isAuthTokenSource = sourceEntityType === 'AuthToken';
      const isUnsafeSourceEntityType =
        !isAuthTokenSource &&
        unsafeSourceEntityTypeFragments.some((fragment) =>
          normalizedSourceEntityType.includes(fragment)
        );

      if (
        !sourceEntityType ||
        sourceEntityType.length > 50 ||
        !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(sourceEntityType) ||
        isUnsafeSourceEntityType
      ) {
        throw errors.badRequest(
          'INVALID_SOURCE_ENTITY_TYPE',
          'Source entity type must be a safe identifier of at most 50 characters.'
        );
      }
    }

    if (!isInternal) {
      return { ...input, sourceFeature, sourceEntityType };
    }

    if (typeof input.type !== 'string') {
      throw errors.badRequest(
        'INVALID_NOTIFICATION_TYPE',
        'Notification type must be a supported string.'
      );
    }

    const type = input.type.trim().toUpperCase();

    if (!supportedTypes.includes(type)) {
      throw errors.badRequest('UNSUPPORTED_NOTIFICATION_TYPE', 'Notification type is not supported.');
    }

    let channel = 'EMAIL';

    if (input.channel !== undefined && input.channel !== null && input.channel !== '') {
      if (typeof input.channel !== 'string') {
        throw errors.badRequest(
          'INVALID_NOTIFICATION_CHANNEL',
          'Notification channel must be a supported string.'
        );
      }

      channel = input.channel.trim().toUpperCase();
    }

    if (channel !== 'EMAIL') {
      throw errors.badRequest(
        'UNSUPPORTED_NOTIFICATION_CHANNEL',
        'Notification channel is not supported.'
      );
    }

    if (
      input.userId !== undefined &&
      input.userId !== null &&
      input.userId !== '' &&
      (!Number.isInteger(input.userId) || input.userId <= 0)
    ) {
      throw errors.badRequest('INVALID_USER_ID', 'User ID must be a positive integer.');
    }

    if (typeof input.templateKey !== 'string') {
      throw errors.badRequest(
        'INVALID_TEMPLATE_KEY',
        'Template key must be a non-empty string of at most 100 characters.'
      );
    }

    const templateKey = input.templateKey.trim();

    if (!templateKey || templateKey.length > 100) {
      throw errors.badRequest(
        'INVALID_TEMPLATE_KEY',
        'Template key must be a non-empty string of at most 100 characters.'
      );
    }

    if (
      input.templateData !== undefined &&
      input.templateData !== null &&
      (typeof input.templateData !== 'object' || Array.isArray(input.templateData))
    ) {
      throw errors.badRequest('INVALID_TEMPLATE_DATA', 'Template data must be an object.');
    }

    let idempotencyKey = null;

    if (
      input.idempotencyKey !== undefined &&
      input.idempotencyKey !== null &&
      input.idempotencyKey !== ''
    ) {
      if (typeof input.idempotencyKey !== 'string') {
        throw errors.badRequest(
          'INVALID_IDEMPOTENCY_KEY',
          'Idempotency key must be a string of at most 100 characters.'
        );
      }

      idempotencyKey = input.idempotencyKey.trim();

      if (idempotencyKey.length > 100) {
        throw errors.badRequest(
          'INVALID_IDEMPOTENCY_KEY',
          'Idempotency key must be a string of at most 100 characters.'
        );
      }
    }

    return {
      ...input,
      type,
      channel,
      userId: input.userId || null,
      templateKey,
      templateData: input.templateData ?? {},
      sourceFeature,
      sourceEntityType,
      idempotencyKey,
    };
  }

  async function createNotificationRequestWithSource(
    input,
    { sourceFeature, auditUserId, isInternal },
    context = {}
  ) {
    const requestInput = validateServiceBoundaryInput(input, { isInternal });
    const effectiveSourceFeature = isInternal ? sourceFeature : requestInput.sourceFeature;

    const type = String(requestInput.type || '').toUpperCase();
    const channel = String(requestInput.channel || 'EMAIL').toUpperCase();
    const templateKey = String(requestInput.templateKey || '').trim();
    const rawTemplateData = requestInput.templateData || {};
    const sensitiveOwner = sensitiveTypeOwners[type] || null;

    if (sensitiveOwner && (!isInternal || effectiveSourceFeature !== sensitiveOwner)) {
      throw errors.forbidden(
        'SENSITIVE_NOTIFICATION_INTERNAL_ONLY',
        'Sensitive authentication notifications must be requested internally.'
      );
    }

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

    if (isSensitiveNotification) {
      if (requestInput.sourceEntityType !== 'AuthToken') {
        throw errors.badRequest(
          'INVALID_SOURCE_ENTITY_TYPE',
          'Sensitive authentication notifications require an AuthToken source.'
        );
      }

      if (!Number.isInteger(requestInput.sourceEntityId) || requestInput.sourceEntityId <= 0) {
        throw errors.badRequest(
          'INVALID_SOURCE_ENTITY_ID',
          'Sensitive authentication notifications require a positive AuthToken ID.'
        );
      }

      const expectedIdempotencyKey = `${sensitiveOwner}:${type}:${requestInput.sourceEntityId}`;

      if (requestInput.idempotencyKey !== expectedIdempotencyKey) {
        throw errors.badRequest(
          'INVALID_IDEMPOTENCY_KEY',
          'Sensitive authentication notification idempotency key is invalid.'
        );
      }
    }

    const templateData = isSensitiveNotification
      ? { redacted: true }
      : sanitizePayload(rawTemplateData);
    const persistedSourceFeature = effectiveSourceFeature || null;
    const auditSourceFeature = effectiveSourceFeature || null;
    const sourceEntityType = requestInput.sourceEntityType || null;
    const sourceEntityId = requestInput.sourceEntityId ?? null;
    const idempotencyKey = requestInput.idempotencyKey || null;

    if (idempotencyKey) {
      const existing = await notificationRepository.findByIdempotencyKey(idempotencyKey);

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

    const recipient = await resolveRecipient(requestInput);

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
        sourceEntityType: isInternal ? requestInput.sourceEntityType || null : sourceEntityType,
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

    if (Object.prototype.hasOwnProperty.call(input || {}, 'sourceFeature')) {
      throw errors.badRequest(
        'SOURCE_FEATURE_HTTP_FORBIDDEN',
        'Notification source cannot be supplied through HTTP.'
      );
    }

    return createNotificationRequestWithSource(
      input,
      { sourceFeature: input.sourceFeature || null, auditUserId: actor.userId, isInternal: false },
      context
    );
  }

  async function retryNotification(notificationId, actor, context = {}) {
    requireInternalActor(actor);

    const notification = await notificationRepository.findById(notificationId);

    if (!notification) {
      throw errors.notFound('NOTIFICATION_NOT_FOUND', 'Notification was not found.');
    }

    if (isSensitiveQueueNotification(notification)) {
      throw errors.conflict(
        'REISSUE_REQUIRED',
        'Create a new notification from the source event.'
      );
    }

    if (notification.status !== 'FAILED') {
      throw errors.conflict(
        'NOTIFICATION_RETRY_NOT_ALLOWED',
        'Only failed queued notifications can be retried.'
      );
    }

    const retriedNotification = await notificationRepository.transitionFailedToPending(notificationId);

    if (!retriedNotification) {
      throw errors.conflict(
        'NOTIFICATION_RETRY_NOT_ALLOWED',
        'Only failed queued notifications can be retried.'
      );
    }

    await writeAudit(context, 'NOTIFICATION_RETRY', {
      userId: actor.userId,
      targetId: retriedNotification.notificationId,
      metadata: { fromStatus: 'FAILED', toStatus: 'PENDING' },
    });

    return {
      notificationId: retriedNotification.notificationId,
      status: retriedNotification.status,
    };
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
          input,
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

  function safeFailureMessage() {
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
    retryNotification,
  };
}

const defaultNotificationService = createNotificationService();

module.exports = {
  createNotificationService,
  defaultNotificationService,
  sanitizePayload,
};
