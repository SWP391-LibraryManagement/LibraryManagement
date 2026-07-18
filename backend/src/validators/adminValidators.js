const { matchedData, query } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');

function isDateOnly(value) {
  const text = String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;

  const date = new Date(`${text}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

function validateAuditDateRange(value, { req }) {
  const from = req.query.from;
  if (!from || from <= value) return true;

  throw new Error('From date must be before or equal to to date.');
}

function assignValidatedAuditQuery(req, res, next) {
  const data = matchedData(req, { locations: ['query'] });
  req.validatedAuditQuery = {
    page: data.page ?? 1,
    limit: data.limit ?? 20,
    ...(data.q ? { q: data.q } : {}),
    ...(data.action ? { action: data.action } : {}),
    ...(data.actorId ? { actorId: data.actorId } : {}),
    ...(data.from ? { from: data.from } : {}),
    ...(data.to ? { to: data.to } : {}),
  };
  return next();
}

const auditLogQueryValidators = [
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
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search must be between 1 and 100 characters.'),
  query('action')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Action must be between 1 and 100 characters.'),
  query('actorId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Actor ID must be a positive integer.')
    .toInt(),
  query('from')
    .optional()
    .custom(isDateOnly)
    .withMessage('From date must use YYYY-MM-DD.'),
  query('to')
    .optional()
    .custom(isDateOnly)
    .withMessage('To date must use YYYY-MM-DD.')
    .bail()
    .custom(validateAuditDateRange),
  handleValidationErrors,
  assignValidatedAuditQuery,
];

module.exports = {
  isDateOnly,
  validateAuditDateRange,
  assignValidatedAuditQuery,
  auditLogQueryValidators,
};
