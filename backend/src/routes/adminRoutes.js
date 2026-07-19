const express = require('express');
const { createAdminController } = require('../controllers/adminController');
const { createAuthenticate, requireAnyRole } = require('../middleware/authMiddleware');
const {
  auditLogQueryValidators,
  requestIdValidators,
  requestListQueryValidators,
} = require('../validators/adminValidators');

function createAdminRoutes({ authService, adminService } = {}) {
  const router = express.Router();
  const controller = createAdminController(adminService);
  const authenticate = createAuthenticate(authService);
  const requireAdmin = [authenticate, requireAnyRole('ADMIN')];

  // @spec FR-FE11-033
  router.get(
    '/audit-logs',
    ...requireAdmin,
    auditLogQueryValidators,
    controller.listAuditLogs
  );
  // @spec FR-FE11-032, BR-FE11-017, AC-FE11-017
  router.get('/permissions', ...requireAdmin, controller.permissions);
  router.get('/dashboard', requireAdmin, controller.dashboard);
  router.get('/library/books', requireAdmin, controller.listBooks);
  router.get('/library/:resource', requireAdmin, controller.listResource);
  router.post('/library/:resource', requireAdmin, controller.createResource);
  router.put('/library/:resource/:id', requireAdmin, controller.updateResource);
  router.patch('/library/:resource/:id/deactivate', requireAdmin, controller.deactivateResource);
  router.get('/borrowings', requireAdmin, controller.listBorrowings);
  // @spec FR-FE11-034, AC-FE11-019
  router.get('/requests', requireAdmin, requestListQueryValidators, controller.listRequests);
  router.get('/requests/:requestId', requireAdmin, requestIdValidators, controller.getRequestDetail);

  return router;
}

module.exports = {
  createAdminRoutes,
};
