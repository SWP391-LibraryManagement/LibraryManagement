const express = require('express');
const { createAdminController } = require('../controllers/adminController');
const { createAuthenticate, requireAnyRole } = require('../middleware/authMiddleware');

function createAdminRoutes({ authService, adminService } = {}) {
  const router = express.Router();
  const controller = createAdminController(adminService);
  const authenticate = createAuthenticate(authService);
  const requireAdmin = [authenticate, requireAnyRole('ADMIN')];

  router.get('/dashboard', requireAdmin, controller.dashboard);
  router.get('/library/books', requireAdmin, controller.listBooks);
  router.get('/library/:resource', requireAdmin, controller.listResource);
  router.post('/library/:resource', requireAdmin, controller.createResource);
  router.put('/library/:resource/:id', requireAdmin, controller.updateResource);
  router.patch('/library/:resource/:id/deactivate', requireAdmin, controller.deactivateResource);
  router.get('/borrowings', requireAdmin, controller.listBorrowings);
  router.get('/requests', requireAdmin, controller.listRequests);

  return router;
}

module.exports = {
  createAdminRoutes,
};
