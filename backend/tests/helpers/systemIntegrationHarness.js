const request = require('supertest');
const { createApp } = require('../../src/app');
const { createAuthService } = require('../../src/services/authService');
const { createBorrowingService } = require('../../src/services/borrowingService');
const { createReservationService } = require('../../src/services/reservationService');
const { createFineManagementService } = require('../../src/services/fineManagementService');
const { createNotificationService } = require('../../src/services/notificationService');
const { createReportService } = require('../../src/services/reportService');
const errors = require('../../src/utils/safeErrors');
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

function createSystemProfileService(authState) {
  return {
    async getMyProfile(userId) {
      const user = authState.users.find((item) => item.userId === Number(userId));
      if (!user) return null;
      const profile = authState.profiles.find((item) => item.userId === Number(userId)) || {};

      return {
        userId: user.userId,
        username: user.username,
        email: user.email,
        phone: user.phone ?? null,
        status: user.status,
        createdAt: user.createdAt,
        profileId: profile.profileId ?? null,
        fullName: profile.fullName ?? user.fullName ?? null,
        address: profile.address ?? null,
        dateOfBirth: profile.dateOfBirth ?? null,
        avatarUrl: profile.avatarUrl ?? null,
      };
    },
  };
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function createSystemAdminService(authState, borrowingDependencies) {
  const { state, borrowingRepository } = borrowingDependencies;

  function memberView(userId) {
    const user = authState.users.find((item) => item.userId === Number(userId));
    const profile = authState.profiles.find((item) => item.userId === Number(userId));
    return {
      userId: Number(userId),
      memberId: Number(userId),
      fullName: profile?.fullName || user?.fullName || user?.username || null,
      email: user?.email || null,
      phoneNumber: user?.phone || null,
      status: user?.status || null,
    };
  }

  function requestItems(requestId) {
    return state.borrowDetails
      .filter((detail) => detail.requestId === Number(requestId))
      .map((detail) => {
        const copy = state.copies.find((item) => item.copyId === detail.copyId);
        const book = state.books.find((item) => item.bookId === copy?.bookId);
        return {
          borrowDetailId: detail.borrowDetailId,
          copyId: detail.copyId,
          barcode: copy?.barcode || null,
          title: book?.title || null,
          author: book?.author || null,
          category: book?.category || null,
          location: copy?.location || null,
          status: detail.status,
        };
      });
  }

  function listRow(request) {
    const items = requestItems(request.requestId);
    return {
      requestId: request.requestId,
      requestDate: request.requestDate,
      status: request.status,
      member: memberView(request.userId),
      itemCount: items.length,
      bookTitles: uniqueValues(items.map((item) => item.title)),
      categories: uniqueValues(items.map((item) => item.category)),
    };
  }

  return {
    async getDashboard() {
      const totalMembers = [...authState.rolesByUserId.values()]
        .filter((roles) => roles.includes('MEMBER')).length;
      const borrowed = state.borrowDetails.filter((detail) => detail.status === 'BORROWED');
      return {
        summary: {
          totalBooks: state.books.length,
          totalMembers,
          totalAuthors: uniqueValues(state.books.map((book) => book.author)).length,
          totalBorrowed: borrowed.length,
          overdueBorrowed: borrowed.filter(
            (detail) => detail.dueDate && new Date(detail.dueDate) < FIXED_NOW
          ).length,
        },
        charts: { mostBorrowed: [], overdue: [], returnedToday: [] },
      };
    },

    async listRequests(filters = {}) {
      const page = Number(filters.page) || 1;
      const limit = Number(filters.limit) || 20;
      const q = String(filters.q || '').trim().toLowerCase();
      const rows = state.borrowRequests
        .map(listRow)
        .filter((row) => {
          if (filters.status && row.status !== filters.status) return false;
          const requestDate = new Date(row.requestDate).toISOString().slice(0, 10);
          if (filters.from && requestDate < filters.from) return false;
          if (filters.to && requestDate > filters.to) return false;
          if (!q) return true;
          const searchable = [
            row.member.fullName,
            row.member.email,
            ...row.bookTitles,
            ...row.categories,
          ].filter(Boolean).join(' ').toLowerCase();
          return searchable.includes(q);
        })
        .sort((left, right) => {
          const dateOrder = new Date(right.requestDate) - new Date(left.requestDate);
          return dateOrder || right.requestId - left.requestId;
        });
      const start = (page - 1) * limit;
      return {
        data: rows.slice(start, start + limit),
        pagination: {
          page,
          limit,
          total: rows.length,
          totalPages: rows.length === 0 ? 0 : Math.ceil(rows.length / limit),
        },
      };
    },

    async getRequestDetail(requestId) {
      const request = await borrowingRepository.findBorrowRequestById(requestId);
      if (!request) {
        throw errors.notFound('BORROW_REQUEST_NOT_FOUND', 'Borrow request was not found.');
      }
      return {
        requestId: request.requestId,
        requestDate: request.requestDate,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt || null,
        member: memberView(request.userId),
        items: requestItems(request.requestId).map(({ category, ...item }) => item),
        lifecycle: {
          approvedAt: request.approvedAt || null,
          rejectedAt: request.rejectedAt || null,
          processedAt: request.processedAt || null,
        },
      };
    },
  };
}

function createSystemUserManagementService(authState) {
  const roleCatalog = [
    { roleId: 1, roleName: 'ADMIN' },
    { roleId: 2, roleName: 'LIBRARIAN' },
    { roleId: 3, roleName: 'MEMBER' },
    { roleId: 4, roleName: 'GUEST' },
  ];

  function managedUser(user) {
    const profile = authState.profiles.find((item) => item.userId === user.userId);
    return {
      userId: user.userId,
      username: user.username,
      email: user.email,
      phone: user.phone || null,
      status: user.status,
      fullName: profile?.fullName || user.fullName || null,
      address: profile?.address || null,
      department: profile?.department || null,
      specialization: profile?.specialization || null,
      lastLoginAt: user.lastLoginAt || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt || user.createdAt,
      roles: [...(authState.rolesByUserId.get(user.userId) || [])],
    };
  }

  return {
    async listUsers(filters = {}) {
      const page = Number(filters.page) || 1;
      const limit = Number(filters.limit) || 20;
      const search = String(filters.search || '').trim().toLowerCase();
      const rows = authState.users
        .map(managedUser)
        .filter((user) => {
          if (filters.status && user.status !== filters.status) return false;
          if (filters.role && !user.roles.includes(filters.role)) return false;
          if (!search) return true;
          return [user.fullName, user.email, user.username, user.phone]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(search);
        })
        .sort((left, right) => right.userId - left.userId);
      const start = (page - 1) * limit;
      return {
        data: rows.slice(start, start + limit),
        pagination: {
          page,
          limit,
          total: rows.length,
          totalPages: rows.length === 0 ? 0 : Math.ceil(rows.length / limit),
        },
      };
    },

    async listRoles() {
      return { data: roleCatalog.map((role) => ({ ...role })) };
    },
  };
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
  const profileService = createSystemProfileService(authDependencies.state);
  const adminService = createSystemAdminService(
    authDependencies.state,
    borrowingDependencies
  );
  const userManagementService = createSystemUserManagementService(authDependencies.state);
  const services = {
    authService,
    borrowingService,
    reservationService,
    fineManagementService,
    notificationService,
    reportService,
    profileService,
    adminService,
    userManagementService,
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
    .send({
      token: setup.dependencies.authDependencies.state.generatedOtps.at(-1),
    })
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
