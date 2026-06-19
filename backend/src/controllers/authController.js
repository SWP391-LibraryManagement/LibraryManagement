const { defaultAuthService } = require('../services/authService');

function createAuthController(authService = defaultAuthService) {
  return {
    register: async (req, res, next) => {
      try {
        const result = await authService.register(req.body, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(201).json(result);
      } catch (error) {
        return next(error);
      }
    },

    verifyEmail: async (req, res, next) => {
      try {
        const result = await authService.verifyEmail(req.body, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    resendVerification: async (req, res, next) => {
      try {
        const result = await authService.resendVerification(req.body, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    login: async (req, res, next) => {
      try {
        const result = await authService.login(req.body, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    refreshToken: async (req, res, next) => {
      try {
        const result = await authService.refreshToken(req.body, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    logout: async (req, res, next) => {
      try {
        const result = await authService.logout(req.body, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          userId: req.user?.userId,
        });
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    changePassword: async (req, res, next) => {
      try {
        const result = await authService.changePassword(req.body, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          userId: req.user.userId,
        });
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    forgotPassword: async (req, res, next) => {
      try {
        const result = await authService.forgotPassword(req.body, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    resetPassword: async (req, res, next) => {
      try {
        const result = await authService.resetPassword(req.body, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(200).json(result);
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
  };
}

module.exports = {
  createAuthController,
};
