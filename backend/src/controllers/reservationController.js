const { defaultReservationService } = require('../services/reservationService');

function createReservationController(reservationService = defaultReservationService) {
  return {
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

    listMine: async (req, res, next) => {
      try {
        const result = await reservationService.listMyReservations(req.query, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

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

    listAll: async (req, res, next) => {
      try {
        const result = await reservationService.listReservations(req.query, req.user);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    process: async (req, res, next) => {
      try {
        const result = await reservationService.processReservation(
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
  };
}

module.exports = {
  createReservationController,
};
