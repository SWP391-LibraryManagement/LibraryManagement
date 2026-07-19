const { body, matchedData, param, query } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');

const LIST_STATUSES = ['ACTIVE', 'INACTIVE', 'LOCKED'];
const LIST_ROLES = ['MEMBER', 'LIBRARIAN', 'ADMIN'];

function uppercaseTrimmed(value) {
  return String(value).trim().toUpperCase();
}

function lowercaseTrimmed(value) {
  return String(value).trim().toLowerCase();
}

function blankToNull(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function assignValidatedListQuery(req, res, next) {
  req.validatedListQuery = matchedData(req, { locations: ['query'] });
  return next();
}

function assignValidatedUserCreate(req, res, next) {
  req.validatedUserCreate = matchedData(req, { locations: ['body'] });
  return next();
}

function assignValidatedUserUpdate(req, res, next) {
  req.validatedUserUpdate = matchedData(req, { locations: ['body'] });
  return next();
}

function assignValidatedUserStatus(req, res, next) {
  req.validatedUserStatus = matchedData(req, { locations: ['body'] });
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

// @spec FR-FE11-021, FR-FE11-028
const createUserValidators = [
  body('type')
    .exists({ values: 'null' })
    .withMessage('User type is required.')
    .bail()
    .customSanitizer(lowercaseTrimmed)
    .isIn(['member', 'librarian'])
    .withMessage('User type must be member or librarian.'),
  body('email')
    .exists({ values: 'null' })
    .withMessage('Email is required.')
    .bail()
    .customSanitizer(lowercaseTrimmed)
    .isLength({ min: 3, max: 255 })
    .withMessage('Email must be at most 255 characters.')
    .bail()
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .withMessage('Email must be valid.'),
  body('username')
    .optional()
    .customSanitizer(blankToNull)
    .custom((value) => value === null || (/^[a-zA-Z0-9._-]+$/.test(value) && value.length <= 50))
    .withMessage('Username must use letters, numbers, dot, underscore, or dash and be at most 50 characters.'),
  body('fullName')
    .exists({ values: 'null' })
    .withMessage('Full name is required.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Full name must be between 1 and 100 characters.'),
  body('phone')
    .optional()
    .customSanitizer(blankToNull)
    .custom((value) => value === null || (value.length <= 20 && /^[0-9+\-\s()]+$/.test(value)))
    .withMessage('Phone number is invalid.'),
  body('address')
    .optional()
    .customSanitizer(blankToNull)
    .custom((value) => value === null || value.length <= 255)
    .withMessage('Address must be at most 255 characters.'),
  body('department')
    .optional()
    .customSanitizer(blankToNull)
    .custom((value, { req }) => {
      if (value !== null && req.body.type !== 'librarian') return false;
      return value === null || value.length <= 100;
    })
    .withMessage('Department is Librarian-only and must be at most 100 characters.'),
  body('specialization')
    .optional()
    .customSanitizer(blankToNull)
    .custom((value, { req }) => {
      if (value !== null && req.body.type !== 'librarian') return false;
      return value === null || value.length <= 100;
    })
    .withMessage('Specialization is Librarian-only and must be at most 100 characters.'),
  handleValidationErrors,
  assignValidatedUserCreate,
];

const updateUserValidators = [
  positiveIdParam('userId', 'User ID'),
  body('expectedUpdatedAt')
    .exists({ values: 'null' })
    .withMessage('Expected updated timestamp is required.')
    .bail()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Expected updated timestamp must be ISO 8601.')
    .toDate(),
  body('email')
    .optional()
    .customSanitizer(lowercaseTrimmed)
    .isLength({ min: 3, max: 255 })
    .withMessage('Email must be at most 255 characters.')
    .bail()
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .withMessage('Email must be valid.'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Full name must be between 1 and 100 characters.'),
  body('phone')
    .optional()
    .customSanitizer(blankToNull)
    .custom((value) => value === null || (value.length <= 20 && /^[0-9+\-\s()]+$/.test(value)))
    .withMessage('Phone number is invalid.'),
  body('address')
    .optional()
    .customSanitizer(blankToNull)
    .custom((value) => value === null || value.length <= 255)
    .withMessage('Address must be at most 255 characters.'),
  body('department')
    .optional()
    .customSanitizer(blankToNull)
    .custom((value) => value === null || value.length <= 100)
    .withMessage('Department must be at most 100 characters.'),
  body('specialization')
    .optional()
    .customSanitizer(blankToNull)
    .custom((value) => value === null || value.length <= 100)
    .withMessage('Specialization must be at most 100 characters.'),
  body('_error').custom((_, { req }) => {
    const editableFields = [
      'email',
      'fullName',
      'phone',
      'address',
      'department',
      'specialization',
    ];
    if (editableFields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field))) {
      return true;
    }
    throw new Error('At least one editable field is required.');
  }),
  handleValidationErrors,
  assignValidatedUserUpdate,
];

const updateUserStatusValidators = [
  positiveIdParam('userId', 'User ID'),
  body('status')
    .exists({ values: 'null' })
    .withMessage('Status is required.')
    .bail()
    .customSanitizer(uppercaseTrimmed)
    .equals('INACTIVE')
    .withMessage('Status must be INACTIVE.'),
  body('expectedUpdatedAt')
    .exists({ values: 'null' })
    .withMessage('Expected updated timestamp is required.')
    .bail()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Expected updated timestamp must be ISO 8601.')
    .toDate(),
  handleValidationErrors,
  assignValidatedUserStatus,
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
  createUserValidators,
  updateUserValidators,
  updateUserStatusValidators,
  assignRoleValidators,
  revokeRoleValidators,
};
