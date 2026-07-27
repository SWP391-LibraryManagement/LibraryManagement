const { defaultNotificationService } = require('../services/notificationService');

function notificationSummary(notification) {
  return {
    notificationId: notification.notificationId,
    status: notification.status,
  };
}

function createNotificationController(notificationService = defaultNotificationService) {
  return {
    // @spec FR-FE10-001, FR-FE10-002, FR-FE10-003, FR-FE10-004, FR-FE10-005, FR-FE10-008, FR-FE10-009
    createRequest: async (req, res, next) => {
      try {
        const result = await notificationService.createNotificationRequest(req.body, req.user, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(result.duplicate ? 200 : 201).json(notificationSummary(result.notification));
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE10-006, FR-FE10-007
    processPending: async (req, res, next) => {
      try {
        const result = await notificationService.processPendingNotifications(req.body, req.user, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(200).json({ processed: result.processed, failed: result.failed });
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE10-007, FR-FE10-009
    retry: async (req, res, next) => {
      try {
        const result = await notificationService.retryNotification(req.params.id, req.user, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE10-011
    listMine: async (req, res, next) => {
      try {
        const result = await notificationService.listMyNotifications(req.query, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE10-012
    unreadCount: async (req, res, next) => {
      try {
        const result = await notificationService.countMyUnreadNotifications(req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE10-013
    markRead: async (req, res, next) => {
      try {
        const result = await notificationService.markMyNotificationRead(req.params.id, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE10-014
    markAllRead: async (req, res, next) => {
      try {
        const result = await notificationService.markAllMyNotificationsRead(req.user);
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
