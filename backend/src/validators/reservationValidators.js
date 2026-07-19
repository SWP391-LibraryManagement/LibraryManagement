const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');

const reservationStatuses = ['ACTIVE', 'NOTIFIED', 'FULFILLED', 'CANCELLED', 'EXPIRED'];

const createReservationValidators = [
  body('copyId')
    .exists()
    .withMessage('Copy ID is required in Phase 1.')
    .bail()
    .isInt({ min: 1 })
    .withMessage('Copy ID must be a positive integer.')
    .toInt(),
  body('bookId')
    .not().exists()
    .withMessage('Book ID is not supported; use copyId.'),
  handleValidationErrors,
];

const listMyReservationsValidators = [
  query('status')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isIn(reservationStatuses)
    .withMessage('Status is not supported.'),
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
  handleValidationErrors,
];

const listReservationCandidatesValidators = [
  query('q')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search query must be at most 200 characters.'),
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
  handleValidationErrors,
];

const listReservationsValidators = [
  query('bookId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Book ID must be a positive integer.')
    .toInt(),
  query('memberId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Member ID must be a positive integer.')
    .toInt(),
  query('status')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isIn(reservationStatuses)
    .withMessage('Status is not supported.'),
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
  handleValidationErrors,
];

const reservationIdParamValidator = [
  param('reservationId')
    .isInt({ min: 1 })
    .withMessage('Reservation ID must be a positive integer.')
    .toInt(),
];

const cancelReservationValidators = [
  ...reservationIdParamValidator,
  body('reason')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Reason must be at most 255 characters.'),
  handleValidationErrors,
];

const processReservationValidators = [
  ...reservationIdParamValidator,
  body('copyId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Copy ID must be a positive integer.')
    .toInt(),
  handleValidationErrors,
];

const processQueueValidators = [
  body('copyId')
    .exists()
    .withMessage('Copy ID is required in Phase 1.')
    .bail()
    .isInt({ min: 1 })
    .withMessage('Copy ID must be a positive integer.')
    .toInt(),
  body('bookId')
    .not().exists()
    .withMessage('Book ID is not supported; use copyId.'),
  handleValidationErrors,
];

module.exports = {
  createReservationValidators,
  listReservationCandidatesValidators,
  listMyReservationsValidators,
  listReservationsValidators,
  cancelReservationValidators,
  processReservationValidators,
  processQueueValidators,
};
