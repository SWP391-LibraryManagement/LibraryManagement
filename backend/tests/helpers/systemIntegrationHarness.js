const request = require('supertest');
const { createApp } = require('../../src/app');
const { createAuthService } = require('../../src/services/authService');
const { createBorrowingService } = require('../../src/services/borrowingService');
const { createReservationService } = require('../../src/services/reservationService');
const { createFineManagementService } = require('../../src/services/fineManagementService');
const { createNotificationService } = require('../../src/services/notificationService');
const { createReportService } = require('../../src/services/reportService');
const { makeInMemoryAuthDependencies } = require('./inMemoryAuthRepositories');
const { makeInMemoryBorrowingDependencies } = require('./inMemoryBorrowingRepositories');
const { makeInMemoryReservationDependencies } = require('./inMemoryReservationRepositories');
const { makeInMemoryFineDependencies } = require('./inMemoryFineRepositories');
const { makeInMemoryNotificationDependencies } = require('./inMemoryNotificationRepositories');
const { makeInMemoryReportDependencies } = require('./inMemoryReportRepositories');

const FIXED_NOW = new Date('2026-07-14T00:00:00.000Z');

function authHeader(accessToken) {
  return `Bearer ${accessToken}`;
}

function syncCopyStatus(sourceState, targetState, copyId) {
  const source = sourceState.copies.find((copy) => copy.copyId === Number(copyId));
  const target = targetState.copies.find((copy) => copy.copyId === Number(copyId));
  if (!source || !target) {
    throw new Error(`Missing shared copy ${copyId}.`);
  }
  target.status = source.status;
}

function syncReservationClaims(sourceState, targetState, copyId) {
  const normalizedCopyId = Number(copyId);
  const sourceClaims = sourceState.reservations.filter(
    (reservation) => reservation.copyId === normalizedCopyId
  );
  const retainedClaims = targetState.reservations.filter(
    (reservation) => reservation.copyId !== normalizedCopyId
  );

  targetState.reservations.splice(
    0,
    targetState.reservations.length,
    ...retainedClaims,
    ...sourceClaims.map((reservation) => ({ ...reservation }))
  );
}

function makeSystemIntegrationApp({ borrowingNotificationError = null } = {}) {
  const authDependencies = makeInMemoryAuthDependencies();
  const borrowingDependencies = makeInMemoryBorrowingDependencies(authDependencies.state);
  const reservationDependencies = makeInMemoryReservationDependencies(authDependencies.state);
  const fineDependencies = makeInMemoryFineDependencies();
  const notificationDependencies = makeInMemoryNotificationDependencies(authDependencies.state);
  const reportDependencies = makeInMemoryReportDependencies(
    authDependencies.state,
    borrowingDependencies.state
  );

  const authService = createAuthService(authDependencies);
  const notificationService = createNotificationService({
    notificationRepository: notificationDependencies.notificationRepository,
    templateRepository: notificationDependencies.templateRepository,
    userRepository: authDependencies.userRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    emailProvider: { send: async () => ({ success: true }) },
    clock: () => FIXED_NOW,
  });
  const borrowingNotificationService = borrowingNotificationError
    ? {
        createSourceNotificationRequester: () => ({
          createNotificationRequest: async () => {
            throw borrowingNotificationError;
          },
        }),
      }
    : notificationService;
  const borrowingService = createBorrowingService({
    borrowingRepository: borrowingDependencies.borrowingRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    notificationService: borrowingNotificationService,
    clock: () => FIXED_NOW,
  });
  const reservationService = createReservationService({
    reservationRepository: reservationDependencies.reservationRepository,
    bookCopyRepository: reservationDependencies.bookCopyRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    notificationService,
    clock: () => FIXED_NOW,
  });
  const fineManagementService = createFineManagementService({
    fineRepository: fineDependencies.fineRepository,
    auditLogRepository: fineDependencies.auditLogRepository,
    clock: () => FIXED_NOW,
  });
  const reportService = createReportService({
    reportRepository: reportDependencies.reportRepository,
    auditLogRepository: authDependencies.auditLogRepository,
  });
  const services = {
    authService,
    borrowingService,
    reservationService,
    fineManagementService,
    notificationService,
    reportService,
  };
  const dependencies = {
    authDependencies,
    borrowingDependencies,
    reservationDependencies,
    fineDependencies,
    notificationDependencies,
    reportDependencies,
  };

  return {
    app: createApp(services),
    services,
    dependencies,
  };
}

async function createVerifiedActor({
  setup,
  email,
  password = 'Password1!',
  role = 'MEMBER',
  approveMember = true,
}) {
  const registered = await request(setup.app).post('/api/auth/register').send({
    email,
    password,
    confirmPassword: password,
    fullName: email.split('@')[0],
  });
  if (registered.status !== 201) {
    throw new Error(`Registration failed for ${email}.`);
  }

  const userId = registered.body.userId;
  await request(setup.app)
    .post('/api/auth/verify-email')
    .send({ token: registered.body.debugVerificationToken })
    .expect(200);
  setup.dependencies.authDependencies.state.rolesByUserId.set(userId, [role]);

  if (role === 'MEMBER' && approveMember) {
    setup.dependencies.borrowingDependencies.approveMember(userId);
    setup.dependencies.reservationDependencies.approveMember(userId);
  }

  const login = await request(setup.app).post('/api/auth/login').send({ email, password });
  if (login.status !== 200) {
    throw new Error(`Login failed for ${email}.`);
  }
  return { userId, accessToken: login.body.accessToken };
}

function syncFineSourceFromBorrowing(setup) {
  const { borrowingDependencies, fineDependencies, authDependencies } = setup.dependencies;
  const mapped = borrowingDependencies.state.borrowDetails.map((detail) => {
    const requestRow = borrowingDependencies.state.borrowRequests.find(
      (item) => item.requestId === detail.requestId
    );
    const copy = borrowingDependencies.state.copies.find((item) => item.copyId === detail.copyId);
    const book = borrowingDependencies.state.books.find((item) => item.bookId === copy?.bookId);
    const user = authDependencies.state.users.find((item) => item.userId === requestRow?.userId);
    if (!requestRow) {
      throw new Error(`Missing request for borrow detail ${detail.borrowDetailId}.`);
    }
    return {
      borrowDetailId: detail.borrowDetailId,
      userId: requestRow.userId,
      copyId: detail.copyId,
      dueDate: detail.dueDate,
      returnDate: detail.returnDate,
      detailStatus: detail.status,
      barcode: copy?.barcode || null,
      bookTitle: book?.title || null,
      email: user?.email || null,
      username: user?.username || null,
    };
  });
  fineDependencies.state.borrowDetails.splice(
    0,
    fineDependencies.state.borrowDetails.length,
    ...mapped
  );
}

function syncFineBlockersToBorrowing(setup) {
  const { borrowingDependencies, fineDependencies } = setup.dependencies;
  borrowingDependencies.state.fines.splice(
    0,
    borrowingDependencies.state.fines.length,
    ...fineDependencies.state.fines.map((fine) => ({
      fineId: fine.fineId,
      userId: fine.userId,
      amount: fine.amount,
      status: fine.status,
    }))
  );
}

module.exports = {
  FIXED_NOW,
  authHeader,
  createVerifiedActor,
  makeSystemIntegrationApp,
  syncCopyStatus,
  syncReservationClaims,
  syncFineBlockersToBorrowing,
  syncFineSourceFromBorrowing,
};
