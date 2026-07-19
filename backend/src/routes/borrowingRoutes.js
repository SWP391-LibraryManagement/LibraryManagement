const express = require('express');
const { createBorrowingController } = require('../controllers/borrowingController');
const { createAuthenticate, requireAnyRole } = require('../middleware/authMiddleware');
const {
  createBorrowRequestValidators,
  listBorrowRequestsValidators,
  memberHistoryValidators,
  memberBorrowingsValidators,
  approveBorrowRequestValidators,
  rejectBorrowRequestValidators,
  returnBorrowDetailValidators,
  renewBorrowDetailValidators,
} = require('../validators/borrowingValidators');

function createBorrowingRoutes({ authService, borrowingService } = {}) {
  const router = express.Router();
  const controller = createBorrowingController(borrowingService);
  const authenticate = createAuthenticate(authService);

  router.post(
    '/borrow-requests',
    authenticate,
    requireAnyRole('MEMBER'),
    createBorrowRequestValidators,
    controller.createRequest
  );

  router.get(
    '/borrow-requests/me',
    authenticate,
    requireAnyRole('MEMBER'),
    memberHistoryValidators,
    controller.listMine
  );

  router.get(
    '/borrow-requests',
    authenticate,
    requireAnyRole('LIBRARIAN', 'ADMIN'),
    listBorrowRequestsValidators,
    controller.listAll
  );

  router.get(
    '/members/:memberId/borrowings',
    authenticate,
    requireAnyRole('LIBRARIAN', 'ADMIN'),
    memberBorrowingsValidators,
    controller.listMemberBorrowings
  );

  router.patch(
    '/borrow-requests/:requestId/approve',
    authenticate,
    requireAnyRole('LIBRARIAN', 'ADMIN'),
    approveBorrowRequestValidators,
    controller.approveRequest
  );

  router.patch(
    '/borrow-requests/:requestId/reject',
    authenticate,
    requireAnyRole('LIBRARIAN', 'ADMIN'),
    rejectBorrowRequestValidators,
    controller.rejectRequest
  );

  router.patch(
    '/borrow-details/:borrowDetailId/return',
    authenticate,
    requireAnyRole('LIBRARIAN', 'ADMIN'),
    returnBorrowDetailValidators,
    controller.returnDetail
  );

  router.patch(
    '/borrow-details/:borrowDetailId/renew',
    authenticate,
    requireAnyRole('MEMBER', 'LIBRARIAN', 'ADMIN'),
    renewBorrowDetailValidators,
    controller.renewDetail
  );

  return router;
}

module.exports = {
  createBorrowingRoutes,
};
