const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');
const { COPY_STATUSES, MANUAL_STATUSES } = require('../services/inventoryService');

const idParam = (name, label) =>
  param(name)
    .isInt({ min: 1 })
    .withMessage(`${label} must be a positive integer.`)
    .toInt();

const listInventoryValidators = [
  query('bookId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Book ID must be a positive integer.')
    .toInt(),
  query('status')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .toUpperCase()
    .isIn(COPY_STATUSES)
    .withMessage('Copy status is not supported.'),
  query('barcode')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Barcode must be at most 100 characters.'),
  query('location')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be at most 100 characters.'),
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

const copyIdParamValidators = [
  idParam('copyId', 'Copy ID'),
  handleValidationErrors,
];

const barcodeParamValidators = [
  param('barcode')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Barcode is required.')
    .isLength({ max: 100 })
    .withMessage('Barcode must be at most 100 characters.'),
  handleValidationErrors,
];

const createCopyValidators = [
  idParam('bookId', 'Book ID'),
  body('barcode')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Barcode is required.')
    .isLength({ max: 100 })
    .withMessage('Barcode must be at most 100 characters.'),
  body('status')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .toUpperCase()
    .isIn(MANUAL_STATUSES)
    .withMessage('Copy status is not supported for manual inventory management.'),
  body('location')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be at most 100 characters.'),
  handleValidationErrors,
];

const updateCopyValidators = [
  idParam('copyId', 'Copy ID'),
  body('barcode')
    .optional({ nullable: true })
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Barcode cannot be empty.')
    .isLength({ max: 100 })
    .withMessage('Barcode must be at most 100 characters.'),
  body('status')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .toUpperCase()
    .isIn(MANUAL_STATUSES)
    .withMessage('Copy status is not supported for manual inventory management.'),
  body('location')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be at most 100 characters.'),
  handleValidationErrors,
];

const updateCopyStatusValidators = [
  idParam('copyId', 'Copy ID'),
  body('status')
    .isString()
    .trim()
    .toUpperCase()
    .isIn(MANUAL_STATUSES)
    .withMessage('Copy status is not supported for manual inventory management.'),
  body('reason')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Reason must be at most 255 characters.'),
  handleValidationErrors,
];

module.exports = {
  listInventoryValidators,
  copyIdParamValidators,
  barcodeParamValidators,
  createCopyValidators,
  updateCopyValidators,
  updateCopyStatusValidators,
};
