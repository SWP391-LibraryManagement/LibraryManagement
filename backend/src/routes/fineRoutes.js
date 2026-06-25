const express = require('express');
const fineController = require('../controllers/fineController');
const { createAuthenticate, requireAnyRole } = require('../middleware/authMiddleware');

function createFineRoutes({ authService } = {}) {
  const router = express.Router();
  const authenticate = createAuthenticate(authService);
  const requireStaff = [authenticate, requireAnyRole('LIBRARIAN', 'ADMIN')];

  router.get('/', requireStaff, fineController.listFines);
  router.post('/', requireStaff, fineController.createFine);
  router.put('/:fineId', requireStaff, fineController.updateFine);
  router.delete('/:fineId', requireStaff, fineController.deleteFine);

  return router;
}

module.exports = {
  createFineRoutes,
};
