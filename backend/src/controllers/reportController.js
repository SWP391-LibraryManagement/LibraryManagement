const { defaultReportService } = require('../services/reportService');

function createReportController(reportService = defaultReportService) {
  return {
    // @spec FR-FE12-001, FR-FE12-004, FR-FE12-005, FR-FE12-006, FR-FE12-007
    borrowing: async (req, res, next) => {
      try {
        const result = await reportService.getBorrowingReport(req.query, req.user, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE12-002, FR-FE12-004, FR-FE12-005, FR-FE12-006, FR-FE12-007
    inventory: async (req, res, next) => {
      try {
        const result = await reportService.getInventoryReport(req.query, req.user, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE12-003, FR-FE12-004, FR-FE12-007, FR-FE12-008
    users: async (req, res, next) => {
      try {
        const result = await reportService.getUserStatistics(req.query, req.user, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = {
  createReportController,
};
