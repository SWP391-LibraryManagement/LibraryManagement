const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');

const requestStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'];
const detailStatuses = ['REQUESTED', 'BORROWED', 'RETURNED', 'LOST', 'DAMAGED', 'OVERDUE'];
const returnConditions = ['NORMAL', 'DAMAGED', 'LOST'];

function isDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

const createBorrowRequestValidators = [
  body('copyIds')
    .isArray({ min: 1 })
    .withMessage('At least one copy ID is required.'),
  body('copyIds.*')
    .isInt({ min: 1 })
    .withMessage('Each copy ID must be a positive integer.')
    .toInt(),
  handleValidationErrors,
];

const listBorrowRequestsValidators = [
  query('status')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isIn(requestStatuses)
    .withMessage('Status is not supported.'),
  query('memberId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Member ID must be a positive integer.')
    .toInt(),
  query('fromDate')
    .optional({ nullable: true, checkFalsy: true })
    .custom(isDateOnly)
    .withMessage('From date must use YYYY-MM-DD.'),
  query('toDate')
    .optional({ nullable: true, checkFalsy: true })
    .custom(isDateOnly)
    .withMessage('To date must use YYYY-MM-DD.'),
  query('page')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.')
    .toInt()
    .default(1),
  query('limit')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.')
    .toInt()
    .default(20),
  query('toDate')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value, { req }) => !req.query.fromDate || value >= req.query.fromDate)
    .withMessage('To date must be on or after from date.'),
  handleValidationErrors,
];

const historyQueryFieldValidators = [
  query('status')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isIn(detailStatuses)
    .withMessage('Status is not supported.'),
  query('fromDate')
    .optional({ nullable: true, checkFalsy: true })
    .custom(isDateOnly)
    .withMessage('From date must use YYYY-MM-DD.'),
  query('toDate')
    .optional({ nullable: true, checkFalsy: true })
    .custom(isDateOnly)
    .withMessage('To date must use YYYY-MM-DD.'),
  query('page')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.')
    .toInt()
    .default(1),
  query('limit')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.')
    .toInt()
    .default(20),
  query('toDate')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value, { req }) => !req.query.fromDate || value >= req.query.fromDate)
    .withMessage('To date must be on or after from date.'),
];

const memberHistoryValidators = [
  ...historyQueryFieldValidators,
  handleValidationErrors,
];

const memberBorrowingsValidators = [
  param('memberId')
    .isInt({ min: 1 })
    .withMessage('Member ID must be a positive integer.')
    .toInt(),
  ...historyQueryFieldValidators,
  handleValidationErrors,
];

const requestIdParamValidator = [
  param('requestId')
    .isInt({ min: 1 })
    .withMessage('Request ID must be a positive integer.')
    .toInt(),
];

const borrowDetailIdParamValidator = [
  param('borrowDetailId')
    .isInt({ min: 1 })
    .withMessage('Borrow detail ID must be a positive integer.')
    .toInt(),
];

const approveBorrowRequestValidators = [
  ...requestIdParamValidator,
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be at most 500 characters.'),
  handleValidationErrors,
];

const rejectBorrowRequestValidators = [
  ...requestIdParamValidator,
  body('reason')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Reject reason is required.')
    .isLength({ max: 500 })
    .withMessage('Reject reason must be at most 500 characters.'),
  handleValidationErrors,
];

const returnBorrowDetailValidators = [
  ...borrowDetailIdParamValidator,
  body('condition')
    .isString()
    .trim()
    .toUpperCase()
    .isIn(returnConditions)
    .withMessage('Return condition must be NORMAL, DAMAGED, or LOST.'),
  body('returnDate')
    .optional({ nullable: true, checkFalsy: true })
    .custom(isDateOnly)
    .withMessage('Return date must use YYYY-MM-DD.'),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be at most 500 characters.'),
  handleValidationErrors,
];

const renewBorrowDetailValidators = [
  ...borrowDetailIdParamValidator,
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be at most 500 characters.'),
  handleValidationErrors,
];

module.exports = {
  createBorrowRequestValidators,
  listBorrowRequestsValidators,
  memberHistoryValidators,
  memberBorrowingsValidators,
  approveBorrowRequestValidators,
  rejectBorrowRequestValidators,
  returnBorrowDetailValidators,
  renewBorrowDetailValidators,
};
