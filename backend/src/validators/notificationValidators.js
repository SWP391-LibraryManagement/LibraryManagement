const { body } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');

const notificationTypes = [
  'ACCOUNT_VERIFICATION',
  'PASSWORD_RESET',
  'RESERVATION_AVAILABLE',
  'DUE_DATE_REMINDER',
  'OVERDUE_NOTICE',
  'FINE_NOTICE',
  'GENERAL_SYSTEM',
];

const channels = ['EMAIL'];

const createNotificationRequestValidators = [
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
  body('sourceFeature')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Source feature must be at most 20 characters.'),
  body('sourceEntityType')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Source entity type must be at most 50 characters.'),
  body('sourceEntityId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Source entity ID must be a positive integer.')
    .toInt(),
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

module.exports = {
  createNotificationRequestValidators,
  processPendingNotificationsValidators,
};
