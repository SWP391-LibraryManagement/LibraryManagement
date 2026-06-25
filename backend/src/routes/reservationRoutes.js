const express = require('express');
const { createReservationController } = require('../controllers/reservationController');
const { createAuthenticate, requireAnyRole } = require('../middleware/authMiddleware');
const {
  createReservationValidators,
  listMyReservationsValidators,
  listReservationsValidators,
  cancelReservationValidators,
  processReservationValidators,
  processQueueValidators,
} = require('../validators/reservationValidators');

function createReservationRoutes({ authService, reservationService } = {}) {
  const router = express.Router();
  const controller = createReservationController(reservationService);
  const authenticate = createAuthenticate(authService);

  router.post(
    '/',
    authenticate,
    requireAnyRole('MEMBER'),
    createReservationValidators,
    controller.create
  );

  router.get(
    '/me',
    authenticate,
    requireAnyRole('MEMBER'),
    listMyReservationsValidators,
    controller.listMine
  );

  router.post(
    '/process-queue',
    authenticate,
    requireAnyRole('LIBRARIAN', 'ADMIN'),
    processQueueValidators,
    controller.processQueue
  );

  router.post(
    '/expire-holds',
    authenticate,
    requireAnyRole('LIBRARIAN', 'ADMIN'),
    controller.expireHolds
  );

  router.get(
    '/',
    authenticate,
    requireAnyRole('LIBRARIAN', 'ADMIN'),
    listReservationsValidators,
    controller.listAll
  );

  router.patch(
    '/:reservationId/cancel',
    authenticate,
    requireAnyRole('MEMBER'),
    cancelReservationValidators,
    controller.cancel
  );

  router.patch(
    '/:reservationId/process',
    authenticate,
    requireAnyRole('LIBRARIAN', 'ADMIN'),
    processReservationValidators,
    controller.process
  );

  return router;
}

module.exports = {
  createReservationRoutes,
};
