const express = require('express');
const { createReportController } = require('../controllers/reportController');
const { createAuthenticate, requireAnyRole } = require('../middleware/authMiddleware');
const { defaultReportService } = require('../services/reportService');
const {
  borrowingReportValidators,
  inventoryReportValidators,
  userStatisticsValidators,
} = require('../validators/reportValidators');

function createReportRoutes({ authService, reportService } = {}) {
  const router = express.Router();
  const activeReportService = reportService || defaultReportService;
  const controller = createReportController(activeReportService);
  const authenticate = createAuthenticate(authService);
  const staffOnly = [authenticate, requireAnyRole('LIBRARIAN', 'ADMIN')];

  router.get('/borrowing', ...staffOnly, borrowingReportValidators, controller.borrowing);
  router.get('/inventory', ...staffOnly, inventoryReportValidators, controller.inventory);
  router.get('/users', ...staffOnly, userStatisticsValidators, controller.users);

  router.use(async (error, req, res, next) => {
    try {
      await activeReportService.auditAccessFailure(error, req.user, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: `${req.baseUrl}${req.path}`,
      });
    } catch (auditError) {
      console.error('[report audit error]', {
        code: auditError?.code || 'AUDIT_WRITE_FAILED',
        method: req.method,
        path: `${req.baseUrl}${req.path}`,
      });
    }

    return next(error);
  });

  return router;
}

module.exports = {
  createReportRoutes,
};
