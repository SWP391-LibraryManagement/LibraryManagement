const express = require('express');
const { createAuthController } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const {
  registerValidators,
  verifyEmailValidators,
  loginValidators,
} = require('../validators/authValidators');

function createAuthRoutes(authService) {
  const router = express.Router();
  const controller = createAuthController(authService);

  router.post('/register', registerValidators, controller.register);
  router.post('/verify-email', verifyEmailValidators, controller.verifyEmail);
  router.post('/login', loginValidators, controller.login);
  router.get('/me', authenticate, controller.me);

  return router;
}

module.exports = {
  createAuthRoutes,
};
