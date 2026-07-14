const express = require('express');
const { createMembershipController } = require('../controllers/membershipController');
const { createAuthenticate, requireAnyRole } = require('../middleware/authMiddleware');
const {
  listApplicationsValidators,
  approveApplicationValidators,
  rejectApplicationValidators,
} = require('../validators/membershipValidators');

function createMembershipRoutes({ authService, membershipService } = {}) {
  const router = express.Router();
  const controller = createMembershipController(membershipService);
  const authenticate = createAuthenticate(authService);

  router.post(
    '/applications',
    authenticate,
    requireAnyRole('MEMBER'),
    controller.apply
  );

  router.get(
    '/status/me',
    authenticate,
    requireAnyRole('MEMBER'),
    controller.getMyStatus
  );

  router.get(
    '/applications',
    authenticate,
    requireAnyRole('LIBRARIAN', 'ADMIN'),
    listApplicationsValidators,
    controller.listApplications
  );

  router.patch(
    '/applications/:applicationId/approve',
    authenticate,
    requireAnyRole('LIBRARIAN', 'ADMIN'),
    approveApplicationValidators,
    controller.approve
  );

  router.patch(
    '/applications/:applicationId/reject',
    authenticate,
    requireAnyRole('LIBRARIAN', 'ADMIN'),
    rejectApplicationValidators,
    controller.reject
  );

  return router;
}

module.exports = {
  createMembershipRoutes,
};
