const express = require('express');
const { createUserManagementController } = require('../controllers/userManagementController');
const { createAuthenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/requireRole');
const errors = require('../utils/safeErrors');
const {
  listUsersValidators,
  getUserValidators,
  createUserValidators,
  updateUserValidators,
  updateUserStatusValidators,
  resendSetupValidators,
  assignRoleValidators,
  revokeRoleValidators,
} = require('../validators/userManagementValidators');

function createUserManagementRoutes({ authService, userManagementService } = {}) {
  const router = express.Router();
  const controller = createUserManagementController(userManagementService);
  const authenticate = createAuthenticate(authService);
  const requireAdmin = [authenticate, requireRole('ADMIN')];

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
  router.put('/:userId', ...requireAdmin, updateUserValidators, controller.updateUser);
  router.patch(
    '/:userId/status',
    ...requireAdmin,
    updateUserStatusValidators,
    controller.updateStatus
  );
  router.post('/:userId/roles', ...requireAdmin, assignRoleValidators, controller.assignRole);
  router.delete(
    '/:userId/roles/:roleId',
    ...requireAdmin,
    revokeRoleValidators,
    controller.revokeRole
  );

  return router;
}

module.exports = {
  createUserManagementRoutes,
};
