const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');

const applicationStatuses = ['PENDING', 'APPROVED', 'REJECTED'];

// @spec NFR-FE04-SEC-004 EC-FE04-005
const applicationIdParamValidator = [
  param('applicationId')
    .isInt({ min: 1, max: 2147483647 })
    .withMessage('Application ID must be a positive integer.')
    .toInt(),
];

// @spec NFR-FE04-SEC-004 NFR-FE04-PERF-001
const listApplicationsValidators = [
  query('q')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search text must be at most 100 characters.'),
  query('status')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .toUpperCase()
    .isIn(applicationStatuses)
    .withMessage('Membership application status is not supported.'),
  query('page')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.')
    .toInt(),
  query('limit')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.')
    .toInt(),
  handleValidationErrors,
];

const approveApplicationValidators = [
  ...applicationIdParamValidator,
  handleValidationErrors,
];

// @spec BR-FE04-010 NFR-FE04-SEC-004 EC-FE04-008
const rejectApplicationValidators = [
  ...applicationIdParamValidator,
  body('reason')
    .isString()
    .withMessage('Rejection reason is required.')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required.')
    .isLength({ max: 500 })
    .withMessage('Rejection reason must be at most 500 characters.'),
  handleValidationErrors,
];

module.exports = {
  listApplicationsValidators,
  approveApplicationValidators,
  rejectApplicationValidators,
};
