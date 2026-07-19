const adminService = require('../services/adminService');

function createAdminController(service = adminService) {
  return {
    permissions: async (req, res, next) => {
      try {
        return res.status(200).json(await service.getPermissions());
      } catch (error) {
        return next(error);
      }
    },
    listAuditLogs: async (req, res, next) => {
      try {
        return res.status(200).json(
          await service.listAuditLogs(req.validatedAuditQuery || req.query)
        );
      } catch (error) {
        return next(error);
      }
    },
    dashboard: async (req, res, next) => {
      try {
        return res.status(200).json(await service.getDashboard());
      } catch (error) {
        return next(error);
      }
    },
    listBooks: async (req, res, next) => {
      try {
        return res.status(200).json(await service.listBooks(req.query));
      } catch (error) {
        return next(error);
      }
    },
    listResource: async (req, res, next) => {
      try {
        return res.status(200).json(await service.listResource(req.params.resource, req.query));
      } catch (error) {
        return next(error);
      }
    },
    createResource: async (req, res, next) => {
      try {
        return res.status(201).json(await service.createResource(req.params.resource, req.body));
      } catch (error) {
        return next(error);
      }
    },
    updateResource: async (req, res, next) => {
      try {
        return res.status(200).json(await service.updateResource(req.params.resource, req.params.id, req.body));
      } catch (error) {
        return next(error);
      }
    },
    deactivateResource: async (req, res, next) => {
      try {
        return res.status(200).json(await service.deactivateResource(req.params.resource, req.params.id));
      } catch (error) {
        return next(error);
      }
    },
    listBorrowings: async (req, res, next) => {
      try {
        return res.status(200).json(await service.listBorrowings(req.query));
      } catch (error) {
        return next(error);
      }
    },
    listRequests: async (req, res, next) => {
      try {
        return res.status(200).json(await service.listRequests(req.validatedRequestQuery));
      } catch (error) {
        return next(error);
      }
    },
    getRequestDetail: async (req, res, next) => {
      try {
        return res.status(200).json(await service.getRequestDetail(req.validatedRequestId));
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = {
  createAdminController,
};
