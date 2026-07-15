const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');
const errors = require('../utils/safeErrors');

const notificationTypes = [
  'ACCOUNT_VERIFICATION',
  'PASSWORD_RESET',
  'ACCOUNT_SETUP',
  'RESERVATION_AVAILABLE',
  'DUE_DATE_REMINDER',
  'OVERDUE_NOTICE',
  'FINE_NOTICE',
  'GENERAL_SYSTEM',
];

const channels = ['EMAIL'];
const sensitiveNotificationTypes = new Set([
  'ACCOUNT_VERIFICATION',
  'PASSWORD_RESET',
  'ACCOUNT_SETUP',
]);
const unsafeSourceEntityTypeFragments = [
  'template',
  'link',
  'token',
  'provider',
  'stack',
  'password',
  'otp',
];

function normalizeSourceEntityType(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_\-\s]/g, '');
}

function enforceHttpNotificationBoundary(req, res, next) {
  if (Object.prototype.hasOwnProperty.call(req.body || {}, 'sourceFeature')) {
    return next(
      errors.badRequest(
        'SOURCE_FEATURE_HTTP_FORBIDDEN',
        'Notification source cannot be supplied through HTTP.'
      )
    );
  }

  const type = String(req.body?.type || '').trim().toUpperCase();

  if (sensitiveNotificationTypes.has(type)) {
    return next(
      errors.forbidden(
        'SENSITIVE_NOTIFICATION_INTERNAL_ONLY',
        'Sensitive authentication notifications must be requested internally.'
      )
    );
  }

  return next();
}

const createNotificationRequestValidators = [
  enforceHttpNotificationBoundary,
  body('type')
    .isString()
    .trim()
    .toUpperCase()
    .isIn(notificationTypes)
    .withMessage('Notification type is not supported.'),
  body('channel')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .toUpperCase()
    .isIn(channels)
    .withMessage('Notification channel is not supported.'),
  body('userId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer.')
    .toInt(),
  body('recipientEmail')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Recipient email must be valid.')
    .normalizeEmail(),
  body('templateKey')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Template key is required.')
    .isLength({ max: 100 })
    .withMessage('Template key must be at most 100 characters.'),
  body('templateData')
    .optional({ nullable: true })
    .isObject()
    .withMessage('Template data must be an object.'),
  body('sourceEntityType')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Source entity type must be a safe identifier of at most 50 characters.')
    .matches(/^[a-zA-Z][a-zA-Z0-9_]*$/)
    .withMessage('Source entity type must be a safe identifier of at most 50 characters.')
    .custom((value) => {
      if (value === 'AuthToken') {
        return true;
      }

      if (
        unsafeSourceEntityTypeFragments.some((fragment) =>
          normalizeSourceEntityType(value).includes(fragment)
        )
      ) {
        throw new Error('Source entity type must be a safe identifier of at most 50 characters.');
      }

      return true;
    }),
  body('sourceEntityId')
    .optional()
    .custom((value) => Number.isInteger(value) && value > 0)
    .withMessage('Source entity ID must be a positive integer.'),
  body('idempotencyKey')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Idempotency key must be at most 100 characters.'),
  handleValidationErrors,
];

const processPendingNotificationsValidators = [
  body('limit')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.')
    .toInt(),
  handleValidationErrors,
];

const retryNotificationValidators = [
  param('id')
    .isInt({ min: 1, max: 2147483647 })
    .withMessage('Notification ID must be a positive integer.')
    .toInt(),
  handleValidationErrors,
];

module.exports = {
  createNotificationRequestValidators,
  processPendingNotificationsValidators,
  retryNotificationValidators,
};
