const { body, matchedData, param, query } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');

const LIST_STATUSES = ['ACTIVE', 'INACTIVE', 'LOCKED'];
const LIST_ROLES = ['MEMBER', 'LIBRARIAN', 'ADMIN'];

function uppercaseTrimmed(value) {
  return String(value).trim().toUpperCase();
}

function assignValidatedListQuery(req, res, next) {
  req.validatedListQuery = matchedData(req, { locations: ['query'] });
  return next();
}

function positiveIdParam(name, label) {
  return param(name)
    .isInt({ min: 1 })
    .withMessage(`${label} must be a positive integer.`)
    .toInt();
}

const listUsersValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100.')
    .toInt(),
  query('status')
    .optional()
    .customSanitizer(uppercaseTrimmed)
    .isIn(LIST_STATUSES)
    .withMessage('Status must be ACTIVE, INACTIVE, or LOCKED.'),
  query('role')
    .optional()
    .customSanitizer(uppercaseTrimmed)
    .isIn(LIST_ROLES)
    .withMessage('Role must be MEMBER, LIBRARIAN, or ADMIN.'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search must be between 1 and 200 characters.'),
  handleValidationErrors,
  assignValidatedListQuery,
];

const getUserValidators = [
  positiveIdParam('userId', 'User ID'),
  handleValidationErrors,
];

const resendSetupValidators = [
  positiveIdParam('userId', 'User ID'),
  handleValidationErrors,
];

const assignRoleValidators = [
  positiveIdParam('userId', 'User ID'),
  body('roleId')
    .exists({ values: 'null' })
    .withMessage('Role ID is required.')
    .bail()
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer.')
    .toInt(),
  handleValidationErrors,
];

const revokeRoleValidators = [
  positiveIdParam('userId', 'User ID'),
  positiveIdParam('roleId', 'Role ID'),
  handleValidationErrors,
];

module.exports = {
  listUsersValidators,
  getUserValidators,
  resendSetupValidators,
  assignRoleValidators,
  revokeRoleValidators,
};
