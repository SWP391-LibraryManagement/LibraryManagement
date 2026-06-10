const { defaultBorrowingService } = require('../services/borrowingService');

function createBorrowingController(borrowingService = defaultBorrowingService) {
  return {
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

    listMine: async (req, res, next) => {
      try {
        const result = await borrowingService.listMyBorrowRequests(req.query, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    listAll: async (req, res, next) => {
      try {
        const result = await borrowingService.listBorrowRequests(req.query, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

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
