const express = require('express');
const { createAuthController } = require('../controllers/authController');
const { createAuthenticate } = require('../middleware/authMiddleware');
const { createCaptchaValidator } = require('../middleware/captchaMiddleware');
const {
  registerValidators,
  verifyEmailValidators,
  resendVerificationValidators,
  loginValidators,
  refreshTokenValidators,
  logoutValidators,
  changePasswordValidators,
  requestChangePasswordOtpValidators,
  confirmChangePasswordValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
} = require('../validators/authValidators');

function createAuthRoutes({ authService, captchaService }) {
  const router = express.Router();
  const controller = createAuthController({ authService, captchaService });
  const authenticate = createAuthenticate(authService);
  const captchaValidator = createCaptchaValidator(captchaService);

  router.get('/captcha', controller.captcha);
  router.post('/register', captchaValidator, registerValidators, controller.register);
  router.post('/verify-email', verifyEmailValidators, controller.verifyEmail);
  router.post('/resend-verification', resendVerificationValidators, controller.resendVerification);
  router.post('/login', captchaValidator, loginValidators, controller.login);
  router.post('/refresh-token', refreshTokenValidators, controller.refreshToken);
  router.post('/logout', logoutValidators, controller.logout);
  router.post('/change-password', authenticate, changePasswordValidators, controller.changePassword);
  router.post('/change-password/request-otp', authenticate, requestChangePasswordOtpValidators, controller.requestChangePasswordOtp);
  router.post('/change-password/confirm', authenticate, confirmChangePasswordValidators, controller.confirmChangePassword);
  router.post('/forgot-password', forgotPasswordValidators, controller.forgotPassword);
  router.post('/reset-password', resetPasswordValidators, controller.resetPassword);
  router.get('/me', authenticate, controller.me);

  return router;
}

module.exports = {
  createAuthRoutes,
};
