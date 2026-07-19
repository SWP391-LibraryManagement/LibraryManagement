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

  // @spec BR-FE04-001 BR-FE04-002 FR-FE04-001 AC-FE04-001 AC-FE04-008
  router.post(
    '/applications',
    authenticate,
    controller.apply
  );

  // @spec BR-FE04-011 FR-FE04-007 AC-FE04-007 AC-FE04-008
  router.get(
    '/status/me',
    authenticate,
    controller.getMyStatus
  );

  // @spec BR-FE04-006 BR-FE04-007 NFR-FE04-PERF-001
  router.get(
    '/applications',
    authenticate,
    requireAnyRole('LIBRARIAN', 'ADMIN'),
    listApplicationsValidators,
    controller.listApplications
  );

  // @spec BR-FE04-006 BR-FE04-008 FR-FE04-004 AC-FE04-003 AC-FE04-005
  router.patch(
    '/applications/:applicationId/approve',
    authenticate,
    requireAnyRole('LIBRARIAN', 'ADMIN'),
    approveApplicationValidators,
    controller.approve
  );

  // @spec BR-FE04-007 BR-FE04-008 BR-FE04-010 FR-FE04-005 AC-FE04-004 AC-FE04-005
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
