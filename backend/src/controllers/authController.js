const { defaultAuthService } = require('../services/authService');

function requestContext(req) {
  return {
    userId: req.user?.userId || null,
    ip: req.ip || '',
    userAgent: req.get('user-agent'),
  };
}

function createAuthController(authService = defaultAuthService) {
  return {
    register: async (req, res, next) => {
      try {
        const result = await authService.register(req.body, requestContext(req));
        return res.status(201).json(result);
      } catch (error) {
        return next(error);
      }
    },

    verifyEmail: async (req, res, next) => {
      try {
        await authService.verifyEmail(req.body.token, requestContext(req));
        return res.status(200).json({ message: 'Account verified. You can now login.' });
      } catch (error) {
        return next(error);
      }
    },

    resendVerification: async (req, res, next) => {
      try {
        const result = await authService.resendVerification(req.body.email, requestContext(req));
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    login: async (req, res, next) => {
      try {
        const result = await authService.login(req.body, requestContext(req));
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    refreshToken: async (req, res, next) => {
      try {
        const result = await authService.refreshToken(req.body.refreshToken || req.body.token, requestContext(req));
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    logout: async (req, res, next) => {
      try {
        await authService.logout(req.user?.userId, req.body.refreshToken || req.body.token, requestContext(req), req.user?.sessionId);
        return res.status(200).json({ message: 'Logged out' });
      } catch (error) {
        return next(error);
      }
    },

    changePassword: async (req, res, next) => {
      try {
        await authService.changePassword(req.user.userId, req.body, requestContext(req));
        return res.status(200).json({ message: 'Password changed' });
      } catch (error) {
        return next(error);
      }
    },

    forgotPassword: async (req, res, next) => {
      try {
        const result = await authService.forgotPassword(req.body.email, requestContext(req));
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    resetPassword: async (req, res, next) => {
      try {
        const result = await authService.resetPassword(req.body, requestContext(req));
        return res.status(200).json({ message: result.message });
      } catch (error) {
        return next(error);
      }
    },

    me: async (req, res, next) => {
      try {
        const result = await authService.me(req.user.userId);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    verifySession: async (req, res, next) => {
      try {
        return res.status(200).json({
          valid: true,
          userId: req.user.userId,
          roles: req.user.roles || [],
        });
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = {
  createAuthController,
};
