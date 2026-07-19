const express = require('express');
const bookController = require('../controllers/bookController');
const { createAuthenticate } = require('../middleware/authMiddleware');
const errors = require('../utils/safeErrors');
const { query, validationResult } = require('express-validator');

const publicQueryKeys = new Set(['q', 'categoryId', 'authorId', 'publisherId', 'page', 'limit']);
// @spec FR-FE01-002, FR-FE01-007, FR-FE01-011, FR-FE01-012
function validatePublicQueryKeys(req, _res, next) {
  const unknown = Object.keys(req.query).find((key) => !publicQueryKeys.has(key));
  if (unknown) return next(errors.badRequest('VALIDATION_ERROR', `Query field '${unknown}' is not supported.`));
  return next();
}

const publicQueryValidators = [
  query('q').optional({ nullable: true }).isLength({ max: 200 }).withMessage('q must be at most 200 characters.'),
  query('categoryId').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage('categoryId must be positive.').toInt(),
  query('authorId').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage('authorId must be positive.').toInt(),
  query('publisherId').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage('publisherId must be positive.').toInt(),
  query('page').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage('page must be positive.').toInt(),
  query('limit').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100.').toInt(),
  (req, _res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) return next(errors.badRequest('VALIDATION_ERROR', 'Invalid public book query.', result.array()));
    return next();
  },
];

function requireAnyRole(...roleNames) {
  const allowedRoles = roleNames.map((role) => String(role || '').toUpperCase());

  return function requireAnyRoleMiddleware(req, res, next) {
    const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
    const normalizedRoles = userRoles.map((role) => String(role || '').toUpperCase());
    const isAllowed = allowedRoles.some((role) => normalizedRoles.includes(role));

    if (!isAllowed) {
      return next(errors.forbidden('BOOK_MANAGER_REQUIRED', 'Librarian or Admin access is required.'));
    }

    return next();
  };
}

function createBookRoutes({ authService } = {}) {
  const router = express.Router();
  const authenticate = createAuthenticate(authService);
  const requireBookManager = [authenticate, requireAnyRole('LIBRARIAN', 'ADMIN')];
  const optionalAuthenticate = (req, res, next) => {
    if (!req.headers.authorization) return next();
    return authenticate(req, res, next);
  };

  router.get('/', validatePublicQueryKeys, publicQueryValidators, bookController.getHomeBooks);
  router.get('/metadata', requireBookManager, bookController.getMetadata);
  router.get('/:bookId', optionalAuthenticate, bookController.getBookById);
  router.post('/', requireBookManager, bookController.createBook);
  router.put('/:bookId', requireBookManager, bookController.updateBook);
  router.patch('/:bookId/deactivate', requireBookManager, bookController.deactivateBook);
  if (typeof bookController.reactivateBook === 'function') {
    router.patch('/:bookId/reactivate', requireBookManager, bookController.reactivateBook);
  }

  return router;
}

function createAdminBookRoutes({ authService } = {}) {
  const router = express.Router();
  const authenticate = createAuthenticate(authService);
  const requireBookManager = [authenticate, requireAnyRole('LIBRARIAN', 'ADMIN')];
  router.get('/', requireBookManager, bookController.getManagementBooks);
  return router;
}

module.exports = {
  createBookRoutes,
  createAdminBookRoutes,
};
