const express = require('express');
const { createUserManagementController } = require('../controllers/userManagementController');
const { createAuthenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/requireRole');

function createUserManagementRoutes({ authService, userManagementService } = {}) {
  const router = express.Router();
  const controller = createUserManagementController(userManagementService);
  const authenticate = createAuthenticate(authService);
  const requireAdmin = [authenticate, requireRole('ADMIN')];

  router.get('/', requireAdmin, controller.listUsers);
  router.get('/roles', requireAdmin, controller.listRoles);
  router.get('/audit-logs', requireAdmin, controller.listAuditLogs);
  router.get('/:userId', requireAdmin, controller.getUser);
  router.post('/', requireAdmin, controller.createUser);
  router.put('/:userId', requireAdmin, controller.updateUser);
  router.patch('/:userId/status', requireAdmin, controller.updateStatus);
  router.post('/:userId/roles', requireAdmin, controller.assignRole);
  router.delete('/:userId/roles/:roleId', requireAdmin, controller.revokeRole);

  return router;
}

module.exports = {
  createUserManagementRoutes,
};
