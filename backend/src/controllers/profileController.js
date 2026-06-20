const { defaultProfileService } = require('../services/profileService');

function requestContext(req) {
  return {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
}

function createProfileController(profileService = defaultProfileService) {
  return {
    getMe: async (req, res, next) => {
      try {
        const result = await profileService.getMyProfile(req.user.userId);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    updateMe: async (req, res, next) => {
      try {
        const result = await profileService.updateMyProfile(req.user.userId, req.body, requestContext(req));
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = {
  createProfileController,
};
