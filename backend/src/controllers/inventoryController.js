const { defaultInventoryService } = require('../services/inventoryService');

function requestContext(req) {
  return {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
}

function createInventoryController(inventoryService = defaultInventoryService) {
  return {
    // @spec FR-FE06-001, FR-FE06-009
    listInventory: async (req, res, next) => {
      try {
        const result = await inventoryService.listInventory(req.query, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE06-002, FR-FE06-003
    getCopy: async (req, res, next) => {
      try {
        const result = await inventoryService.getCopy(req.params.copyId, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE06-002, FR-FE06-003
    getCopyByBarcode: async (req, res, next) => {
      try {
        const result = await inventoryService.getCopyByBarcode(req.params.barcode, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE06-004, FR-FE06-005, FR-FE06-011, FR-FE06-012
    createCopy: async (req, res, next) => {
      try {
        const result = await inventoryService.createCopy(
          req.params.bookId,
          req.body,
          req.user,
          requestContext(req)
        );
        return res.status(201).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE06-005, FR-FE06-006, FR-FE06-007, FR-FE06-013, FR-FE06-014
    updateCopy: async (req, res, next) => {
      try {
        const result = await inventoryService.updateCopy(
          req.params.copyId,
          req.body,
          req.user,
          requestContext(req),
          req.headers['if-match']
        );
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE06-006, FR-FE06-007, FR-FE06-013, FR-FE06-014, FR-FE06-015, FR-FE06-016
    updateCopyStatus: async (req, res, next) => {
      try {
        const result = await inventoryService.updateCopyStatus(
          req.params.copyId,
          req.body,
          req.user,
          requestContext(req),
          req.headers['if-match']
        );
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE06-008, FR-FE06-017
    deactivateCopy: async (req, res, next) => {
      try {
        const result = await inventoryService.deactivateCopy(
          req.params.copyId,
          req.body,
          req.user,
          requestContext(req),
          req.headers['if-match']
        );
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = {
  createInventoryController,
};
