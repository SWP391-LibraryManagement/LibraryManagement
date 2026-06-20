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
  const allowDevBookManagementWithoutLogin =
    process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
  const authenticateOrDevLibrarian = allowDevBookManagementWithoutLogin
    ? function devBookManagementLibrarian(req, res, next) {
        req.user = {
          userId: null,
          email: 'dev-librarian@example.test',
          username: 'dev_librarian',
          roles: ['LIBRARIAN'],
        };
        return next();
      }
    : authenticate;
  const requireBookManager = [authenticateOrDevLibrarian, requireAnyRole('LIBRARIAN', 'ADMIN')];

  router.get('/', bookController.getHomeBooks);
  router.get('/categories', bookController.getCategories);
  router.get('/metadata', requireBookManager, bookController.getMetadata);
  router.get('/management', requireBookManager, bookController.getManagementBooks);
  router.get('/:bookId', bookController.getBookById);
  router.post('/', requireBookManager, bookController.createBook);
  router.put('/:bookId', requireBookManager, bookController.updateBook);
  router.patch('/:bookId/deactivate', requireBookManager, bookController.deactivateBook);

  return router;
}

module.exports = {
  createBookRoutes,
};
