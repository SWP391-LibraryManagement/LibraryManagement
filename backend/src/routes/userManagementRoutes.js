const express = require('express');
const { createUserManagementController } = require('../controllers/userManagementController');
const { createAuthenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/requireRole');

function createUserManagementRoutes({ authService, userManagementService } = {}) {
  const router = express.Router();
  const controller = createUserManagementController(userManagementService);
  const authenticate = createAuthenticate(authService);
  const allowDevUserManagementWithoutLogin =
    process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
  const authenticateOrDevAdmin = allowDevUserManagementWithoutLogin
    ? function devUserManagementAdmin(req, res, next) {
        req.user = {
          userId: null,
          email: 'dev-admin@example.test',
          username: 'dev_admin',
          roles: ['ADMIN'],
        };
        return next();
      }
    : authenticate;
  const requireAdmin = [authenticateOrDevAdmin, requireRole('ADMIN')];

  router.get('/', controller.listUsers);
  router.get('/roles', controller.listRoles);
  router.get('/audit-logs', requireAdmin, controller.listAuditLogs);
  router.get('/:userId', controller.getUser);
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
