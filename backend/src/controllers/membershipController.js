const { defaultMembershipService } = require('../services/membershipService');

function createMembershipController(membershipService = defaultMembershipService) {
  return {
    apply: async (req, res, next) => {
      try {
        const result = await membershipService.apply(req.user, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(201).json(result);
      } catch (error) {
        return next(error);
      }
    },

    getMyStatus: async (req, res, next) => {
      try {
        const result = await membershipService.getMyStatus(req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    listApplications: async (req, res, next) => {
      try {
        const result = await membershipService.listApplications(req.query, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    approve: async (req, res, next) => {
      try {
        const result = await membershipService.approve(req.params.applicationId, req.user, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    reject: async (req, res, next) => {
      try {
        const result = await membershipService.reject(req.params.applicationId, req.body.reason, req.user, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = {
  createMembershipController,
};
