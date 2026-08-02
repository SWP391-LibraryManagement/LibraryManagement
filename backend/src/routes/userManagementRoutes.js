const express = require('express');
const { createUserManagementController } = require('../controllers/userManagementController');
const { createAuthenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/requireRole');
const errors = require('../utils/safeErrors');
const {
  listUsersValidators,
  getUserValidators,
  createUserValidators,
  updateUserStatusValidators,
  resendSetupValidators,
  replaceRoleValidators,
} = require('../validators/userManagementValidators');

function createUserManagementRoutes({ authService, userManagementService } = {}) {
  const router = express.Router();
  const controller = createUserManagementController(userManagementService);
  const authenticate = createAuthenticate(authService);
  const requireAdmin = [authenticate, requireRole('ADMIN')];

  // @spec FR-FE11-004, FR-FE11-007, FR-FE11-010, FR-FE11-020 — FE11 intentionally
  // registers no existing-user profile/work-field PUT route; FE03 owns personal profile edits.
  // @spec FR-FE11-015
  router.get('/', ...requireAdmin, listUsersValidators, controller.listUsers);
  router.get('/roles', requireAdmin, controller.listRoles);
  router.get('/audit-logs', (req, res, next) => (
    next(errors.notFound('NOT_FOUND', 'Resource not found.'))
  ));
  router.get('/:userId', ...requireAdmin, getUserValidators, controller.getUser);
  router.post('/', ...requireAdmin, createUserValidators, controller.createUser);
  router.post(
    '/:userId/resend-setup',
    ...requireAdmin,
    resendSetupValidators,
    controller.resendSetup
  );
  router.patch(
    '/:userId/status',
    ...requireAdmin,
    updateUserStatusValidators,
    controller.updateStatus
  );
  router.put('/:userId/role', ...requireAdmin, replaceRoleValidators, controller.replaceRole);

  return router;
}

module.exports = {
  createUserManagementRoutes,
};
