const { query } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');

const borrowingStatuses = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
  'CANCELLED',
  'REQUESTED',
  'BORROWED',
  'RETURNED',
  'LOST',
  'DAMAGED',
  'OVERDUE',
];
const copyStatuses = ['AVAILABLE', 'BORROWED', 'RESERVED', 'DAMAGED', 'LOST', 'INACTIVE'];
const userStatuses = ['ACTIVE', 'INACTIVE', 'LOCKED'];
const membershipStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'INACTIVE'];

function dateRangeValidator(value, { req }) {
  if (!req.query.fromDate || !req.query.toDate) {
    return true;
  }

  if (new Date(req.query.fromDate).getTime() > new Date(req.query.toDate).getTime()) {
    throw new Error('From date must be before or equal to to date.');
  }

  return true;
}

const commonDateValidators = [
  query('fromDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('From date must be a valid date.'),
  query('toDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('To date must be a valid date.')
    .custom(dateRangeValidator),
];

const borrowingReportValidators = [
  ...commonDateValidators,
  query('status')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isIn(borrowingStatuses)
    .withMessage('Borrowing status is not supported.'),
  query('bookId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Book ID must be a positive integer.')
    .toInt(),
  query('userId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer.')
    .toInt(),
  handleValidationErrors,
];

const inventoryReportValidators = [
  query('categoryId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer.')
    .toInt(),
  query('bookId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Book ID must be a positive integer.')
    .toInt(),
  query('status')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isIn(copyStatuses)
    .withMessage('Copy status is not supported.'),
  query('location')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be at most 100 characters.'),
  handleValidationErrors,
];

const userStatisticsValidators = [
  ...commonDateValidators,
  query('roleId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer.')
    .toInt(),
  query('status')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isIn(userStatuses)
    .withMessage('User status is not supported.'),
  query('membershipStatus')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isIn(membershipStatuses)
    .withMessage('Membership status is not supported.'),
  handleValidationErrors,
];

module.exports = {
  borrowingReportValidators,
  inventoryReportValidators,
  userStatisticsValidators,
};
