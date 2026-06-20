const express = require('express');
const { createProfileController } = require('../controllers/profileController');
const { createAuthenticate } = require('../middleware/authMiddleware');

function createProfileRoutes({ authService, profileService } = {}) {
  const router = express.Router();
  const controller = createProfileController(profileService);
  const authenticate = createAuthenticate(authService);

  router.get('/me', authenticate, controller.getMe);
  router.put('/me', authenticate, controller.updateMe);

  return router;
}

module.exports = {
  createProfileRoutes,
};
