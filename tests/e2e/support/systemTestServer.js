const http = require('http');
const { randomBytes } = require('crypto');

process.env.BCRYPT_COST = process.env.BCRYPT_COST || '4';
process.env.JWT_SECRET = randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const {
  createVerifiedActor,
  makeSystemIntegrationApp,
  syncCopyStatus,
  syncFineSourceFromBorrowing,
  syncReservationClaims,
} = require('../../../backend/tests/helpers/systemIntegrationHarness');

const HOST = '127.0.0.1';
const PORT = Number(process.env.E2E_BACKEND_PORT || 3100);
let setup = makeSystemIntegrationApp();
let failNextNotificationRead = false;

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function postJson(pathname, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = http.request({
      host: HOST,
      port: PORT,
      path: pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers },
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString('utf8')) }));
    });
    req.on('error', reject);
    req.end(body);
  });
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function latestBorrowState() {
  const state = setup.dependencies.borrowingDependencies.state;
  const latestRequest = state.borrowRequests[state.borrowRequests.length - 1] || null;
  const latestDetail = latestRequest
    ? state.borrowDetails.find((detail) => detail.requestId === latestRequest.requestId) || null
    : null;

  return {
    latestRequestId: latestRequest?.requestId || null,
    latestRequestStatus: latestRequest?.status || null,
    latestBorrowDetailId: latestDetail?.borrowDetailId || null,
    latestBorrowDetailStatus: latestDetail?.status || null,
  };
}

function connectedFlowState(copyId = 1) {
  const normalizedCopyId = Number(copyId);
  const borrowingState = setup.dependencies.borrowingDependencies.state;
  const reservationState = setup.dependencies.reservationDependencies.state;
  const notificationState = setup.dependencies.notificationDependencies.state;

  return {
    copyId: normalizedCopyId,
    borrowingCopyStatus:
      borrowingState.copies.find((copy) => copy.copyId === normalizedCopyId)?.status || null,
    reservationCopyStatus:
      reservationState.copies.find((copy) => copy.copyId === normalizedCopyId)?.status || null,
    borrowRequests: borrowingState.borrowRequests.map((request) => ({
      requestId: request.requestId,
      userId: request.userId,
      status: request.status,
      details: borrowingState.borrowDetails
        .filter((detail) => detail.requestId === request.requestId)
        .map((detail) => ({
          borrowDetailId: detail.borrowDetailId,
          copyId: detail.copyId,
          status: detail.status,
        })),
    })),
    reservations: reservationState.reservations
      .filter((reservation) => reservation.copyId === normalizedCopyId)
      .map((reservation) => ({
        reservationId: reservation.reservationId,
        userId: reservation.userId,
        copyId: reservation.copyId,
        status: reservation.status,
        expiresAt: reservation.expiresAt || null,
      })),
    notifications: notificationState.notifications.map((notification) => ({
      notificationId: notification.notificationId,
      userId: notification.userId,
      templateKey: notification.templateKey,
      idempotencyKey: notification.idempotencyKey,
    })),
  };
}

function seedPendingBorrowRequests({ userId, copyId, count }) {
  const state = setup.dependencies.borrowingDependencies.state;
  const normalizedUserId = Number(userId);
  const normalizedCopyId = Number(copyId);
  const normalizedCount = Number(count);
  const userExists = setup.dependencies.authDependencies.state.users.some(
    (user) => user.userId === normalizedUserId
  );
  const copyExists = state.copies.some((copy) => copy.copyId === normalizedCopyId);

  if (
    !userExists
    || !copyExists
    || !Number.isInteger(normalizedCount)
    || normalizedCount < 1
    || normalizedCount > 100
  ) {
    return null;
  }

  let nextRequestId =
    Math.max(0, ...state.borrowRequests.map((request) => request.requestId)) + 1;
  let nextDetailId =
    Math.max(0, ...state.borrowDetails.map((detail) => detail.borrowDetailId)) + 1;
  const requestIds = [];

  for (let index = 0; index < normalizedCount; index += 1) {
    const createdAt = new Date(Date.now() + index);
    const requestId = nextRequestId;
    state.borrowRequests.push({
      requestId,
      userId: normalizedUserId,
      requestDate: createdAt,
      status: 'PENDING',
      createdBy: normalizedUserId,
      approvedBy: null,
      approvedAt: null,
      rejectedAt: null,
      processedAt: null,
      createdAt,
      updatedAt: null,
    });
    state.borrowDetails.push({
      borrowDetailId: nextDetailId,
      requestId,
      userId: normalizedUserId,
      copyId: normalizedCopyId,
      borrowDate: null,
      dueDate: null,
      returnDate: null,
      renewalCount: 0,
      status: 'REQUESTED',
      createdAt,
      updatedAt: null,
    });
    requestIds.push(requestId);
    nextRequestId += 1;
    nextDetailId += 1;
  }

  return requestIds;
}

function seedNotifications({ ownerUserId, crossUserId, eligibleCount = 5 }) {
  const authState = setup.dependencies.authDependencies.state;
  const notificationState = setup.dependencies.notificationDependencies.state;
  const owner = authState.users.find((user) => user.userId === Number(ownerUserId));
  const crossUser = authState.users.find((user) => user.userId === Number(crossUserId));
  const count = Number(eligibleCount);
  if (!owner || !crossUser || !Number.isInteger(count) || count < 1 || count > 100) {
    return null;
  }

  const eligibleDefinitions = [
    { type: 'GENERAL_SYSTEM', templateKey: 'MEMBERSHIP_RESULT', sourceFeature: 'FE04' },
    { type: 'RESERVATION_AVAILABLE', templateKey: 'RESERVATION_READY', sourceFeature: 'FE08' },
    { type: 'DUE_DATE_REMINDER', templateKey: 'DUE_DATE_REMINDER', sourceFeature: 'FE07' },
    { type: 'OVERDUE_NOTICE', templateKey: 'OVERDUE_NOTICE', sourceFeature: 'FE07' },
    { type: 'FINE_NOTICE', templateKey: 'FINE_NOTICE', sourceFeature: 'FE09' },
  ];
  let nextNotificationId = Math.max(
    0,
    ...notificationState.notifications.map((item) => item.notificationId),
  ) + 1;

  function makeRow({ userId, title, definition, createdAt }) {
    const notificationId = nextNotificationId;
    nextNotificationId += 1;
    return {
      notificationId,
      type: definition.type,
      channel: 'EMAIL',
      userId,
      recipientEmail: userId == null
        ? 'userless@example.test'
        : authState.users.find((user) => user.userId === Number(userId))?.email || null,
      templateId: null,
      templateKey: definition.templateKey,
      title,
      body: `Nội dung ${title}.`,
      status: 'PENDING',
      sourceFeature: definition.sourceFeature,
      sourceEntityType: 'E2E_NOTIFICATION',
      sourceEntityId: notificationId,
      idempotencyKey: `E2E:FE10:${notificationId}`,
      safePayload: null,
      attemptCount: 0,
      lastErrorMessage: null,
      createdAt,
      sentAt: null,
      readAt: null,
    };
  }

  const ownedRows = Array.from({ length: count }, (_, index) => makeRow({
    userId: owner.userId,
    title: `FE10 owned ${index + 1}`,
    definition: eligibleDefinitions[index % eligibleDefinitions.length],
    createdAt: new Date(Date.UTC(2026, 6, 14, 1, 0, index)),
  }));
  const sensitiveTitle = 'FE10 sensitive setup';
  const sensitiveRow = makeRow({
    userId: owner.userId,
    title: sensitiveTitle,
    definition: { type: 'ACCOUNT_SETUP', templateKey: 'ACCOUNT_SETUP', sourceFeature: 'FE11' },
    createdAt: new Date('2026-07-14T02:00:00.000Z'),
  });
  const userlessTitle = 'FE10 userless due reminder';
  const userlessRow = makeRow({
    userId: null,
    title: userlessTitle,
    definition: eligibleDefinitions[2],
    createdAt: new Date('2026-07-14T02:01:00.000Z'),
  });
  const crossUserTitle = 'FE10 cross-user due reminder';
  const crossUserRow = makeRow({
    userId: crossUser.userId,
    title: crossUserTitle,
    definition: eligibleDefinitions[2],
    createdAt: new Date('2026-07-14T02:02:00.000Z'),
  });

  notificationState.notifications.push(
    ...ownedRows,
    sensitiveRow,
    userlessRow,
    crossUserRow,
  );

  return {
    ownedNotificationIds: ownedRows.map((item) => item.notificationId),
    ownedTitles: ownedRows.map((item) => item.title),
    sensitiveTitle,
    sensitiveNotificationId: sensitiveRow.notificationId,
    userlessTitle,
    userlessNotificationId: userlessRow.notificationId,
    crossUserTitle,
    crossUserNotificationId: crossUserRow.notificationId,
  };
}

async function handleControl(req, res, pathname) {
  if (req.method === 'POST' && pathname === '/__e2e__/setup') {
    const {
      memberEmail,
      memberBEmail,
      librarianEmail,
      adminEmail,
      password,
    } = await readJson(req);
    if (!memberEmail || !librarianEmail || !password) {
      sendJson(res, 400, { error: 'memberEmail, librarianEmail, and password are required.' });
      return;
    }

    setup = makeSystemIntegrationApp();
    failNextNotificationRead = false;

    const member = await createVerifiedActor({ setup, email: memberEmail, password });
    const memberB = memberBEmail
      ? await createVerifiedActor({ setup, email: memberBEmail, password })
      : null;
    const librarian = await createVerifiedActor({
      setup,
      email: librarianEmail,
      password,
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const admin = adminEmail
      ? await createVerifiedActor({
          setup,
          email: adminEmail,
          password,
          role: 'ADMIN',
          approveMember: false,
        })
      : null;
    const profiles = setup.dependencies.authDependencies.state.profiles;
    const memberProfile = profiles.find((profile) => profile.userId === member.userId)
      || { userId: member.userId };
    Object.assign(memberProfile, {
      fullName: 'FE04 Browser Applicant',
      phone: '0900000004',
      dateOfBirth: '2000-04-04',
      address: 'FE04 Test Address',
    });
    const memberUser = setup.dependencies.authDependencies.state.users.find(
      (user) => user.userId === member.userId
    );
    memberUser.phone = memberProfile.phone;
    if (!profiles.includes(memberProfile)) profiles.push(memberProfile);
    const application = await postJson('/api/membership/applications', {}, {
      Authorization: `Bearer ${member.accessToken}`,
    });
    if (application.statusCode !== 201) throw new Error('E2E membership seed failed.');
    sendJson(res, 201, {
      memberUserId: member.userId,
      memberAUserId: member.userId,
      ...(memberB ? { memberBUserId: memberB.userId } : {}),
      librarianUserId: librarian.userId,
      copyId: 1,
      bookId: 1,
      ...(admin ? { adminUserId: admin.userId } : {}),
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/__e2e__/sync-connected-state') {
    const { from, copyId = 1 } = await readJson(req);
    const borrowingState = setup.dependencies.borrowingDependencies.state;
    const reservationState = setup.dependencies.reservationDependencies.state;
    const sourceState = from === 'borrowing'
      ? borrowingState
      : from === 'reservation'
        ? reservationState
        : null;
    const targetState = from === 'borrowing'
      ? reservationState
      : from === 'reservation'
        ? borrowingState
        : null;

    if (!sourceState || !targetState) {
      sendJson(res, 400, { error: 'from must be borrowing or reservation.' });
      return;
    }
    syncCopyStatus(sourceState, targetState, copyId);
    syncReservationClaims(sourceState, targetState, copyId);
    sendJson(res, 200, connectedFlowState(copyId));
    return;
  }

  if (req.method === 'GET' && pathname === '/__e2e__/connected-state') {
    sendJson(res, 200, connectedFlowState());
    return;
  }

  if (req.method === 'POST' && pathname === '/__e2e__/seed-pending-borrow-requests') {
    const requestIds = seedPendingBorrowRequests(await readJson(req));
    if (!requestIds) {
      sendJson(res, 400, { error: 'Valid userId, copyId, and count from 1 to 100 are required.' });
      return;
    }
    sendJson(res, 201, { requestIds });
    return;
  }

  if (req.method === 'POST' && pathname === '/__e2e__/seed-notifications') {
    const result = seedNotifications(await readJson(req));
    if (!result) {
      sendJson(res, 400, { error: 'Valid owner, cross-user, and count from 1 to 100 are required.' });
      return;
    }
    sendJson(res, 201, result);
    return;
  }

  if (req.method === 'POST' && pathname === '/__e2e__/fail-next-notification-read') {
    failNextNotificationRead = true;
    sendJson(res, 200, { armed: true });
    return;
  }

  if (req.method === 'GET' && pathname === '/__e2e__/state') {
    sendJson(res, 200, latestBorrowState());
    return;
  }

  if (req.method === 'POST' && pathname === '/__e2e__/make-overdue') {
    const { borrowDetailId, dueDate } = await readJson(req);
    const detail = setup.dependencies.borrowingDependencies.state.borrowDetails.find(
      (item) => item.borrowDetailId === Number(borrowDetailId)
    );
    if (!detail) {
      sendJson(res, 404, { error: 'Borrow detail not found.' });
      return;
    }
    detail.dueDate = dueDate;
    sendJson(res, 200, { borrowDetailId: detail.borrowDetailId, dueDate: detail.dueDate });
    return;
  }

  if (req.method === 'POST' && pathname === '/__e2e__/sync-fines') {
    syncFineSourceFromBorrowing(setup);
    sendJson(res, 200, { synchronized: true });
    return;
  }

  sendJson(res, 404, { error: 'Unknown E2E control endpoint.' });
}

const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, `http://${HOST}:${PORT}`).pathname;
    if (pathname.startsWith('/__e2e__/')) {
      await handleControl(req, res, pathname);
      return;
    }
    if (
      failNextNotificationRead
      && req.method === 'PATCH'
      && /^\/api\/notifications\/\d+\/read$/.test(pathname)
    ) {
      failNextNotificationRead = false;
      sendJson(res, 503, {
        error: {
          code: 'E2E_NOTIFICATION_READ_FAILURE',
          message: 'Notification read state is temporarily unavailable.',
        },
      });
      return;
    }
    setup.app(req, res);
  } catch (error) {
    sendJson(res, 500, { error: 'E2E control request failed.' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`System E2E test server listening on http://${HOST}:${PORT}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
