const { defaultReportService } = require('../services/reportService');

function createReportController(reportService = defaultReportService) {
  return {
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
