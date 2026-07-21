const { defaultBorrowingService } = require('../services/borrowingService');

function createBorrowingController(borrowingService = defaultBorrowingService) {
  return {
    listCandidates: async (req, res, next) => {
      try {
        const result = await borrowingService.listBorrowCandidates(req.query, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE07-001, FR-FE07-002, FR-FE07-003
    createRequest: async (req, res, next) => {
      try {
        const result = await borrowingService.createBorrowRequest(req.body, req.user, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(201).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE07-010
    listMine: async (req, res, next) => {
      try {
        const result = await borrowingService.listMyBorrowRequests(req.query, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE07-011
    listAll: async (req, res, next) => {
      try {
        const result = await borrowingService.listBorrowRequests(req.query, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE07-011
    listMemberBorrowings: async (req, res, next) => {
      try {
        const result = await borrowingService.listMemberBorrowings(
          req.params.memberId,
          req.query,
          req.user
        );
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE07-004, FR-FE07-005, FR-FE07-012, FR-FE07-013
    approveRequest: async (req, res, next) => {
      try {
        const result = await borrowingService.approveBorrowRequest(
          req.params.requestId,
          req.body,
          req.user,
          {
            ip: req.ip,
            userAgent: req.get('user-agent'),
          }
        );
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE07-006
    rejectRequest: async (req, res, next) => {
      try {
        const result = await borrowingService.rejectBorrowRequest(
          req.params.requestId,
          req.body,
          req.user,
          {
            ip: req.ip,
            userAgent: req.get('user-agent'),
          }
        );
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE07-007, FR-FE07-008, FR-FE07-013
    returnDetail: async (req, res, next) => {
      try {
        const result = await borrowingService.returnBorrowDetail(
          req.params.borrowDetailId,
          req.body,
          req.user,
          {
            ip: req.ip,
            userAgent: req.get('user-agent'),
          }
        );
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE07-009
    renewDetail: async (req, res, next) => {
      try {
        const result = await borrowingService.renewBorrowDetail(
          req.params.borrowDetailId,
          req.body,
          req.user,
          {
            ip: req.ip,
            userAgent: req.get('user-agent'),
          }
        );
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = {
  createBorrowingController,
};
