const { defaultFineManagementService } = require('../services/fineManagementService');

// FE09 server-side controller (SPEC §11). The legacy CRUD controller (fineController.js) is kept
// for the existing prototype UI; this controller exposes the production-aligned fine workflow.
function createFineManagementController(fineManagementService = defaultFineManagementService) {
  function context(req) {
    return { ip: req.ip, userAgent: req.get('user-agent') };
  }

  return {
    // @spec FR-FE09-003, FR-FE09-004, FR-FE09-005, FR-FE09-006
    calculate: async (req, res, next) => {
      try {
        const result = await fineManagementService.calculateFine(req.body, req.user, context(req));
        return res.status(result.created ? 201 : 200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE09-001
    listMine: async (req, res, next) => {
      try {
        const result = await fineManagementService.listMyFines(req.query, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE09-002
    listAll: async (req, res, next) => {
      try {
        const result = await fineManagementService.listFines(req.query, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE09-001, FR-FE09-002
    getOne: async (req, res, next) => {
      try {
        const result = await fineManagementService.getFine(req.params.fineId, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE09-007
    collect: async (req, res, next) => {
      try {
        const result = await fineManagementService.recordCollection(
          req.params.fineId,
          req.body,
          req.user,
          context(req)
        );
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE09-008
    markPaid: async (req, res, next) => {
      try {
        const result = await fineManagementService.markPaid(
          req.params.fineId,
          req.body,
          req.user,
          context(req)
        );
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE09-010 (state change available to FE07/FE12)
    waive: async (req, res, next) => {
      try {
        const result = await fineManagementService.waiveFine(
          req.params.fineId,
          req.body,
          req.user,
          context(req)
        );
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE09-010 (state change available to FE07/FE12)
    cancel: async (req, res, next) => {
      try {
        const result = await fineManagementService.cancelFine(
          req.params.fineId,
          req.body,
          req.user,
          context(req)
        );
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = {
  createFineManagementController,
};
