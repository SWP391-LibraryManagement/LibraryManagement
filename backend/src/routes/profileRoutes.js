const express = require('express');
const { createProfileController } = require('../controllers/profileController');
const { createAuthenticate } = require('../middleware/authMiddleware');
const { avatarUpload } = require('../middleware/avatarUpload');

function createProfileRoutes({ authService, profileService } = {}) {
  const router = express.Router();
  const controller = createProfileController(profileService);
  const authenticate = createAuthenticate(authService);

  router.get('/me', authenticate, controller.getMe);
  router.put('/me', authenticate, controller.updateMe);
  router.post('/me/avatar', authenticate, avatarUpload, controller.updateAvatar);

  return router;
}

module.exports = {
  createProfileRoutes,
};
