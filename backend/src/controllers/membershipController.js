const { defaultMembershipService } = require('../services/membershipService');

function createMembershipController(membershipService = defaultMembershipService) {
  return {
    // @spec FR-FE04-001 FR-FE04-002 FR-FE04-003
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

    // @spec FR-FE04-007 NFR-FE04-SEC-003
    getMyStatus: async (req, res, next) => {
      try {
        const result = await membershipService.getMyStatus(req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec NFR-FE04-PERF-001 NFR-FE04-SEC-002
    listApplications: async (req, res, next) => {
      try {
        const result = await membershipService.listApplications(req.query, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE04-004 FR-FE04-006 FR-FE04-008
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

    // @spec FR-FE04-005 FR-FE04-006 FR-FE04-008
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
