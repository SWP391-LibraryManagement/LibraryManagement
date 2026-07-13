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
    .custom(isDateOnly)
    .withMessage('From date must use YYYY-MM-DD.'),
  query('toDate')
    .optional({ nullable: true, checkFalsy: true })
    .custom(isDateOnly)
    .withMessage('To date must use YYYY-MM-DD.')
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
  borrowingStatuses,
  copyStatuses,
  userStatuses,
  membershipStatuses,
  borrowingReportValidators,
  inventoryReportValidators,
  userStatisticsValidators,
};
