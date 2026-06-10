const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');

const requestStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'];
const detailStatuses = ['REQUESTED', 'BORROWED', 'RETURNED', 'LOST', 'DAMAGED', 'OVERDUE'];
const returnConditions = ['NORMAL', 'DAMAGED', 'LOST'];

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
    .isISO8601()
    .withMessage('From date must be a valid date.'),
  query('toDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('To date must be a valid date.'),
  handleValidationErrors,
];

const memberBorrowingsValidators = [
  param('memberId')
    .isInt({ min: 1 })
    .withMessage('Member ID must be a positive integer.')
    .toInt(),
  query('status')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isIn(detailStatuses)
    .withMessage('Status is not supported.'),
  query('fromDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('From date must be a valid date.'),
  query('toDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('To date must be a valid date.'),
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
    .isISO8601()
    .withMessage('Return date must be a valid date.'),
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
  memberBorrowingsValidators,
  approveBorrowRequestValidators,
  rejectBorrowRequestValidators,
  returnBorrowDetailValidators,
  renewBorrowDetailValidators,
};
