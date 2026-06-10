const { defaultNotificationService } = require('../services/notificationService');

function createNotificationController(notificationService = defaultNotificationService) {
  return {
    createRequest: async (req, res, next) => {
      try {
        const result = await notificationService.createNotificationRequest(req.body, req.user, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(result.duplicate ? 200 : 201).json(result);
      } catch (error) {
        return next(error);
      }
    },

    processPending: async (req, res, next) => {
      try {
        const result = await notificationService.processPendingNotifications(req.body, req.user, {
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
  createNotificationController,
};
