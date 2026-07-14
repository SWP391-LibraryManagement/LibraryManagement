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
  router.delete('/library/:resource/:id', requireAdmin, controller.deleteResource);
  router.get('/borrowings', requireAdmin, controller.listBorrowings);
  router.post('/borrowings', requireAdmin, controller.createBorrowing);
  router.put('/borrowings/:id', requireAdmin, controller.updateBorrowing);
  router.get('/requests', requireAdmin, controller.listRequests);
  router.patch('/requests/:id/status', requireAdmin, controller.updateRequestStatus);

  return router;
}

module.exports = {
  createAdminRoutes,
};
