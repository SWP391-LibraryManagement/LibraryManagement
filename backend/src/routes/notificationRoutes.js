const express = require('express');
const { createNotificationController } = require('../controllers/notificationController');
const { createAuthenticate, requireAnyRole } = require('../middleware/authMiddleware');
const {
  createNotificationRequestValidators,
  processPendingNotificationsValidators,
} = require('../validators/notificationValidators');

function createNotificationRoutes({ authService, notificationService } = {}) {
  const router = express.Router();
  const controller = createNotificationController(notificationService);
  const authenticate = createAuthenticate(authService);

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

  return router;
}

module.exports = {
  createNotificationRoutes,
};
