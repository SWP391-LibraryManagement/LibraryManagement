const express = require('express');
const { createFineManagementController } = require('../controllers/fineManagementController');
const { createAuthenticate, requireAnyRole } = require('../middleware/authMiddleware');

function createFineRoutes({ authService, fineManagementService } = {}) {
  const router = express.Router();
  const authenticate = createAuthenticate(authService);
  const requireStaff = [authenticate, requireAnyRole('LIBRARIAN', 'ADMIN')];
  const fineManagement = createFineManagementController(fineManagementService);

  // --- Server-side FE09 workflow (SPEC §11). Specific paths are declared before '/:fineId'. ---
  router.get('/me', authenticate, fineManagement.listMine);
  router.post('/calculate', requireStaff, fineManagement.calculate);
  router.post('/:fineId/collections', requireStaff, fineManagement.collect);
  router.patch('/:fineId/paid', requireStaff, fineManagement.markPaid);
  router.patch('/:fineId/waive', authenticate, fineManagement.waive);
  router.patch('/:fineId/cancel', authenticate, fineManagement.cancel);
  router.get('/:fineId', authenticate, fineManagement.getOne);

  // Canonical FE09 list. Legacy write routes remain isolated for backward compatibility only.
  router.get('/', requireStaff, fineManagement.listAll);

  return router;
}

module.exports = {
  createFineRoutes,
};
