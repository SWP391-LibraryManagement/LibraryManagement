const express = require('express');
const { createReportController } = require('../controllers/reportController');
const { createAuthenticate, requireAnyRole } = require('../middleware/authMiddleware');
const {
  borrowingReportValidators,
  inventoryReportValidators,
  userStatisticsValidators,
} = require('../validators/reportValidators');

function createReportRoutes({ authService, reportService } = {}) {
  const router = express.Router();
  const controller = createReportController(reportService);
  const authenticate = createAuthenticate(authService);
  const staffOnly = [authenticate, requireAnyRole('LIBRARIAN', 'ADMIN')];

  router.get('/borrowing', ...staffOnly, borrowingReportValidators, controller.borrowing);
  router.get('/inventory', ...staffOnly, inventoryReportValidators, controller.inventory);
  router.get('/users', ...staffOnly, userStatisticsValidators, controller.users);

  return router;
}

module.exports = {
  createReportRoutes,
};
