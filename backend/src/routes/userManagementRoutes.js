const express = require('express');
const { createUserManagementController } = require('../controllers/userManagementController');
const { createAuthenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/requireRole');
const {
  listUsersValidators,
  resendSetupValidators,
  assignRoleValidators,
  revokeRoleValidators,
} = require('../validators/userManagementValidators');

function createUserManagementRoutes({ authService, userManagementService } = {}) {
  const router = express.Router();
  const controller = createUserManagementController(userManagementService);
  const authenticate = createAuthenticate(authService);
  const requireAdmin = [authenticate, requireRole('ADMIN')];

  router.get('/', ...requireAdmin, listUsersValidators, controller.listUsers);
  router.get('/roles', requireAdmin, controller.listRoles);
  router.get('/audit-logs', requireAdmin, controller.listAuditLogs);
  router.get('/:userId', requireAdmin, controller.getUser);
  router.post('/', requireAdmin, controller.createUser);
  router.post(
    '/:userId/resend-setup',
    ...requireAdmin,
    resendSetupValidators,
    controller.resendSetup
  );
  router.put('/:userId', requireAdmin, controller.updateUser);
  router.patch('/:userId/status', requireAdmin, controller.updateStatus);
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
