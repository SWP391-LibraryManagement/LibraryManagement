const express = require('express');
const bookController = require('../controllers/bookController');
const { createAuthenticate } = require('../middleware/authMiddleware');
const errors = require('../utils/safeErrors');

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

  router.get('/', bookController.getHomeBooks);
  router.get('/categories', bookController.getCategories);
  router.get('/metadata', requireBookManager, bookController.getMetadata);
  router.get('/management', requireBookManager, bookController.getManagementBooks);
  router.get('/:bookId', optionalAuthenticate, bookController.getBookById);
  router.post('/', requireBookManager, bookController.createBook);
  router.put('/:bookId', requireBookManager, bookController.updateBook);
  router.patch('/:bookId/deactivate', requireBookManager, bookController.deactivateBook);
  router.patch('/:bookId/reactivate', requireBookManager, bookController.reactivateBook);

  return router;
}

function createAdminBookRoutes({ authService } = {}) {
  const router = express.Router();
  const authenticate = createAuthenticate(authService);
  const requireBookManager = [authenticate, requireAnyRole('LIBRARIAN', 'ADMIN')];

  // @spec FR-FE05-004, BR-FE05-017
  router.get('/', requireBookManager, bookController.getManagementBooks);
  return router;
}

module.exports = {
  createBookRoutes,
  createAdminBookRoutes,
};
