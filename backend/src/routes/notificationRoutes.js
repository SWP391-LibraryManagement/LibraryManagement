const express = require('express');
const { createNotificationController } = require('../controllers/notificationController');
const { createAuthenticate, requireAnyRole } = require('../middleware/authMiddleware');
const {
  createNotificationRequestValidators,
  processPendingNotificationsValidators,
  retryNotificationValidators,
  listMineValidators,
  markReadValidators,
} = require('../validators/notificationValidators');

function createNotificationRoutes({ authService, notificationService } = {}) {
  const router = express.Router();
  const controller = createNotificationController(notificationService);
  const authenticate = createAuthenticate(authService);

  router.get(
    '/mine',
    authenticate,
    requireAnyRole('MEMBER', 'LIBRARIAN', 'ADMIN'),
    listMineValidators,
    controller.listMine
  );

  router.get(
    '/mine/unread-count',
    authenticate,
    requireAnyRole('MEMBER', 'LIBRARIAN', 'ADMIN'),
    controller.unreadCount
  );

  router.patch(
    '/mine/read-all',
    authenticate,
    requireAnyRole('MEMBER', 'LIBRARIAN', 'ADMIN'),
    controller.markAllRead
  );

  router.patch(
    '/:id/read',
    authenticate,
    requireAnyRole('MEMBER', 'LIBRARIAN', 'ADMIN'),
    markReadValidators,
    controller.markRead
  );

  router.post(
    '/requests',
    authenticate,
    requireAnyRole('LIBRARIAN', 'ADMIN'),
    createNotificationRequestValidators,
    controller.createRequest
  );

  router.post(
    '/process-pending',
    authenticate,
    requireAnyRole('LIBRARIAN', 'ADMIN'),
    processPendingNotificationsValidators,
    controller.processPending
  );

  router.post(
    '/:id/retry',
    authenticate,
    requireAnyRole('LIBRARIAN', 'ADMIN'),
    retryNotificationValidators,
    controller.retry
  );

  return router;
}

module.exports = {
  createNotificationRoutes,
};
