const { defaultReservationService } = require('../services/reservationService');

function createReservationController(reservationService = defaultReservationService) {
  return {
    // @spec FR-FE08-001, FR-FE08-002, FR-FE08-003
    create: async (req, res, next) => {
      try {
        const result = await reservationService.createReservation(req.body, req.user, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(201).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE08-029, AC-FE08-015, NFR-FE08-SEC-004, NFR-FE08-PERF-003
    listCandidates: async (req, res, next) => {
      try {
        const result = await reservationService.listReservationCandidates(req.query, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE08-010
    listMine: async (req, res, next) => {
      try {
        const result = await reservationService.listMyReservations(req.query, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE08-004, FR-FE08-009
    cancel: async (req, res, next) => {
      try {
        const result = await reservationService.cancelReservation(
          req.params.reservationId,
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

    // @spec FR-FE08-005
    listAll: async (req, res, next) => {
      try {
        const result = await reservationService.listReservations(req.query, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE08-006, FR-FE08-008, FR-FE08-009
    processQueue: async (req, res, next) => {
      try {
        const result = await reservationService.processQueue(req.body, req.user, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    // @spec FR-FE08-019
    expireHolds: async (req, res, next) => {
      try {
        const result = await reservationService.expireHolds(req.user, {
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
  createReservationController,
};
