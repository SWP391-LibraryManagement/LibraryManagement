const http = require('http');
const { randomBytes } = require('crypto');

process.env.BCRYPT_COST = process.env.BCRYPT_COST || '4';
process.env.JWT_SECRET = randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const {
  createVerifiedActor,
  makeSystemIntegrationApp,
  syncFineSourceFromBorrowing,
} = require('../../../backend/tests/helpers/systemIntegrationHarness');

const HOST = '127.0.0.1';
const PORT = Number(process.env.E2E_BACKEND_PORT || 3100);
let setup = makeSystemIntegrationApp();

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
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

async function handleControl(req, res, pathname) {
  if (req.method === 'POST' && pathname === '/__e2e__/setup') {
    const { memberEmail, librarianEmail, adminEmail, password } = await readJson(req);
    if (!memberEmail || !librarianEmail || !password) {
      sendJson(res, 400, { error: 'memberEmail, librarianEmail, and password are required.' });
      return;
    }

    setup = makeSystemIntegrationApp();

    const member = await createVerifiedActor({ setup, email: memberEmail, password });
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
    sendJson(res, 201, {
      memberUserId: member.userId,
      librarianUserId: librarian.userId,
      ...(admin ? { adminUserId: admin.userId } : {}),
    });
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
