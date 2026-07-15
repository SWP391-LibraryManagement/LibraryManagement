const { defaultUserManagementService } = require('../services/userManagementService');

function requestContext(req) {
  return {
    adminUserId: req.user.userId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
}

function createUserManagementController(userManagementService = defaultUserManagementService) {
  return {
    listUsers: async (req, res, next) => {
      try {
        const result = await userManagementService.listUsers(req.query);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    getUser: async (req, res, next) => {
      try {
        const result = await userManagementService.getUser(req.params.userId);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    listRoles: async (req, res, next) => {
      try {
        const result = await userManagementService.listRoles();
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    listAuditLogs: async (req, res, next) => {
      try {
        const result = await userManagementService.listAuditLogs(req.query);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    createUser: async (req, res, next) => {
      try {
        const result = await userManagementService.createUser(req.body, requestContext(req));
        return res.status(201).json(result);
      } catch (error) {
        return next(error);
      }
    },

    resendSetup: async (req, res, next) => {
      try {
        // @spec FR-FE11-036, FR-FE11-038
        const result = await userManagementService.resendSetup(
          req.params.userId,
          requestContext(req)
        );
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    updateUser: async (req, res, next) => {
      try {
        const result = await userManagementService.updateUser(req.params.userId, req.body, requestContext(req));
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    updateStatus: async (req, res, next) => {
      try {
        const result = await userManagementService.updateStatus(req.params.userId, req.body, requestContext(req));
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    assignRole: async (req, res, next) => {
      try {
        const result = await userManagementService.assignRole(req.params.userId, req.body, requestContext(req));
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    revokeRole: async (req, res, next) => {
      try {
        const result = await userManagementService.revokeRole(
          req.params.userId,
          req.params.roleId,
          requestContext(req)
        );
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = {
  createUserManagementController,
};
