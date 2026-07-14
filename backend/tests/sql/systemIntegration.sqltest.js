const crypto = require('crypto');
const dotenv = require('dotenv');

if (process.env.SYSTEM_SQL_TEST_ENV_FILE) {
  dotenv.config({ path: process.env.SYSTEM_SQL_TEST_ENV_FILE, quiet: true });
}

if (process.env.SYSTEM_SQL_TEST_ALLOW_MUTATION !== 'true') {
  throw new Error('System SQL test requires SYSTEM_SQL_TEST_ALLOW_MUTATION=true.');
}

const { sql, getPool, resetPoolForTests } = require('../../src/config/db');
const { createBorrowingService } = require('../../src/services/borrowingService');
const { createFineManagementService } = require('../../src/services/fineManagementService');
const { createNotificationService } = require('../../src/services/notificationService');
const { createReportService } = require('../../src/services/reportService');

jest.setTimeout(30000);

const FIXED_NOW = new Date('2026-07-14T00:00:00.000Z');

let pool;
let activeSeed;
const completedSeeds = [];

function createSeed() {
  return {
    key: `sit${Date.now()}${process.pid}`,
    userIds: [],
    copyIds: [],
    requestIds: [],
    detailIds: [],
    fineIds: [],
    notificationIds: [],
    templateIds: [],
  };
}

function pushUnique(target, values) {
  for (const value of values) {
    if (value && !target.includes(value)) {
      target.push(value);
    }
  }
}

async function insertUser(seed, suffix, roleName) {
  const username = `${seed.key}-${suffix}`.slice(0, 50);
  const email = `${username}@example.test`.slice(0, 100);
  const passwordHash = crypto.randomBytes(32).toString('hex');
  const userResult = await pool
    .request()
    .input('Username', sql.NVarChar(50), username)
    .input('Email', sql.NVarChar(100), email)
    .input('PasswordHash', sql.NVarChar(255), passwordHash)
    .query(`
      INSERT INTO Users (Username, Email, PasswordHash, Status, EmailVerifiedAt)
      OUTPUT INSERTED.UserId
      VALUES (@Username, @Email, @PasswordHash, 'ACTIVE', GETDATE())
    `);

  const userId = userResult.recordset[0].UserId;
  seed.userIds.push(userId);

  const roleResult = await pool
    .request()
    .input('RoleName', sql.NVarChar(50), roleName)
    .query('SELECT TOP 1 RoleId FROM Roles WHERE RoleName = @RoleName');

  if (!roleResult.recordset.length) {
    throw new Error(`SIT-SQL-001 requires the ${roleName} role.`);
  }

  await pool
    .request()
    .input('UserId', sql.Int, userId)
    .input('RoleId', sql.Int, roleResult.recordset[0].RoleId)
    .query('INSERT INTO UserRoles (UserId, RoleId) VALUES (@UserId, @RoleId)');

  return { userId, email, roles: [roleName] };
}

async function insertApprovedMember(userId, approvedBy) {
  await pool
    .request()
    .input('UserId', sql.Int, userId)
    .input('ApprovedBy', sql.Int, approvedBy)
    .query(`
      INSERT INTO Members (UserId, Status, ApprovedAt, ApprovedBy)
      VALUES (@UserId, 'APPROVED', GETDATE(), @ApprovedBy)
    `);
}

async function findExistingBookId() {
  const result = await pool
    .request()
    .query("SELECT TOP 1 BookId FROM Books WHERE Status = 'ACTIVE' ORDER BY BookId ASC");

  if (!result.recordset.length) {
    throw new Error('SIT-SQL-001 requires at least one ACTIVE Book row.');
  }

  return result.recordset[0].BookId;
}

async function insertAvailableCopy(seed, bookId) {
  const result = await pool
    .request()
    .input('BookId', sql.Int, bookId)
    .input('Barcode', sql.NVarChar(100), `${seed.key}-copy`)
    .input('Location', sql.NVarChar(100), 'SIT-SQL-001')
    .query(`
      INSERT INTO BookCopies (BookId, Barcode, Status, Location)
      OUTPUT INSERTED.CopyId
      VALUES (@BookId, @Barcode, 'AVAILABLE', @Location)
    `);

  const copyId = result.recordset[0].CopyId;
  seed.copyIds.push(copyId);
  return copyId;
}

async function ensureDueDateTemplate(seed) {
  const existing = await pool
    .request()
    .input('TemplateCode', sql.NVarChar(100), 'DUE_DATE_REMINDER')
    .query(`
      SELECT TOP 1 TemplateId, Status
      FROM NotificationTemplates
      WHERE TemplateCode = @TemplateCode
    `);

  if (existing.recordset.length) {
    if (existing.recordset[0].Status !== 'ACTIVE') {
      throw new Error('SIT-SQL-001 requires an ACTIVE DUE_DATE_REMINDER template.');
    }

    return existing.recordset[0].TemplateId;
  }

  const inserted = await pool
    .request()
    .input('TemplateCode', sql.NVarChar(100), 'DUE_DATE_REMINDER')
    .input('Subject', sql.NVarChar(255), 'Library due date reminder')
    .input('Body', sql.NVarChar(sql.MAX), 'Borrowing request {{requestId}} is due on {{dueDate}}.')
    .query(`
      INSERT INTO NotificationTemplates (TemplateCode, Subject, Body, Status)
      OUTPUT INSERTED.TemplateId
      VALUES (@TemplateCode, @Subject, @Body, 'ACTIVE')
    `);

  const templateId = inserted.recordset[0].TemplateId;
  seed.templateIds.push(templateId);
  return templateId;
}

async function captureDerivedIds(seed) {
  for (const requestId of seed.requestIds) {
    const details = await pool
      .request()
      .input('RequestId', sql.Int, requestId)
      .query('SELECT BorrowDetailId FROM BorrowDetails WHERE RequestId = @RequestId');
    pushUnique(seed.detailIds, details.recordset.map((row) => row.BorrowDetailId));

    const notifications = await pool
      .request()
      .input('RequestId', sql.Int, requestId)
      .query(`
        SELECT NotificationId
        FROM Notifications
        WHERE SourceFeature = 'FE07'
          AND SourceEntityType = 'BORROWING'
          AND SourceEntityId = @RequestId
      `);
    pushUnique(seed.notificationIds, notifications.recordset.map((row) => row.NotificationId));
  }

  for (const detailId of seed.detailIds) {
    const fines = await pool
      .request()
      .input('BorrowDetailId', sql.Int, detailId)
      .query('SELECT FineId FROM Fines WHERE BorrowDetailId = @BorrowDetailId');
    pushUnique(seed.fineIds, fines.recordset.map((row) => row.FineId));
  }
}

async function cleanSeed(seed) {
  await captureDerivedIds(seed);

  for (const notificationId of seed.notificationIds) {
    await pool
      .request()
      .input('NotificationId', sql.Int, notificationId)
      .query('DELETE FROM NotificationAttempts WHERE NotificationId = @NotificationId');
  }

  for (const notificationId of seed.notificationIds) {
    await pool
      .request()
      .input('NotificationId', sql.Int, notificationId)
      .query('DELETE FROM Notifications WHERE NotificationId = @NotificationId');
  }

  for (const userId of seed.userIds) {
    await pool.request().input('UserId', sql.Int, userId).query('DELETE FROM AuditLogs WHERE UserId = @UserId');
  }

  for (const notificationId of seed.notificationIds) {
    await pool
      .request()
      .input('NotificationId', sql.Int, notificationId)
      .query(`
        DELETE FROM AuditLogs
        WHERE Action = 'NOTIFICATION_REQUEST_CREATE'
          AND TargetId = @NotificationId
      `);
  }

  for (const templateId of seed.templateIds) {
    await pool
      .request()
      .input('TemplateId', sql.Int, templateId)
      .query('DELETE FROM NotificationTemplates WHERE TemplateId = @TemplateId');
  }

  for (const fineId of seed.fineIds) {
    await pool.request().input('FineId', sql.Int, fineId).query('DELETE FROM Fines WHERE FineId = @FineId');
  }

  for (const detailId of seed.detailIds) {
    await pool
      .request()
      .input('BorrowDetailId', sql.Int, detailId)
      .query('DELETE FROM BorrowDetails WHERE BorrowDetailId = @BorrowDetailId');
  }

  for (const requestId of seed.requestIds) {
    await pool
      .request()
      .input('RequestId', sql.Int, requestId)
      .query('DELETE FROM BorrowRequests WHERE RequestId = @RequestId');
  }

  for (const userId of seed.userIds) {
    await pool.request().input('UserId', sql.Int, userId).query('DELETE FROM Reservations WHERE UserId = @UserId');
  }

  for (const copyId of seed.copyIds) {
    await pool.request().input('CopyId', sql.Int, copyId).query('DELETE FROM Reservations WHERE CopyId = @CopyId');
    await pool.request().input('CopyId', sql.Int, copyId).query('DELETE FROM BookCopies WHERE CopyId = @CopyId');
  }

  for (const userId of seed.userIds) {
    await pool.request().input('UserId', sql.Int, userId).query('DELETE FROM Members WHERE UserId = @UserId');
    await pool.request().input('UserId', sql.Int, userId).query('DELETE FROM UserRoles WHERE UserId = @UserId');
  }

  for (const userId of seed.userIds) {
    await pool.request().input('UserId', sql.Int, userId).query('DELETE FROM Users WHERE UserId = @UserId');
  }
}

async function getCleanupCounts(seed) {
  const result = await pool
    .request()
    .input('UsernamePrefix', sql.NVarChar(50), `${seed.key}%`)
    .input('BarcodePrefix', sql.NVarChar(100), `${seed.key}%`)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM Users WHERE Username LIKE @UsernamePrefix) AS TestUsers,
        (SELECT COUNT(*) FROM BookCopies WHERE Barcode LIKE @BarcodePrefix) AS TestCopies
    `);

  return result.recordset[0];
}

beforeAll(async () => {
  try {
    pool = await getPool();
  } catch (_error) {
    throw new Error(
      'SIT-SQL-001 requires reachable SQL Server configuration from SYSTEM_SQL_TEST_ENV_FILE.'
    );
  }
});

afterEach(async () => {
  if (!activeSeed || !pool) {
    return;
  }

  await cleanSeed(activeSeed);
  const counts = await getCleanupCounts(activeSeed);
  expect(counts).toEqual({ TestUsers: 0, TestCopies: 0 });
  completedSeeds.push(activeSeed);
  activeSeed = null;
});

afterAll(async () => {
  try {
    if (pool && activeSeed) {
      await cleanSeed(activeSeed);
      const counts = await getCleanupCounts(activeSeed);
      expect(counts).toEqual({ TestUsers: 0, TestCopies: 0 });
      activeSeed = null;
    }

    for (const seed of completedSeeds) {
      const counts = await getCleanupCounts(seed);
      expect(counts).toEqual({ TestUsers: 0, TestCopies: 0 });
    }
  } finally {
    if (pool) {
      await pool.close();
    }

    resetPoolForTests();
  }
});

test('[SIT-SQL-001] FE07 return is visible to FE09 and FE12 through shared SQL state', async () => {
  activeSeed = createSeed();
  const member = await insertUser(activeSeed, 'member', 'MEMBER');
  const librarian = await insertUser(activeSeed, 'librarian', 'LIBRARIAN');
  await insertApprovedMember(member.userId, librarian.userId);

  const bookId = await findExistingBookId();
  const copyId = await insertAvailableCopy(activeSeed, bookId);
  await ensureDueDateTemplate(activeSeed);
  const notificationErrors = [];
  const productionNotificationService = createNotificationService();
  const observingNotificationService = {
    createSourceNotificationRequester(sourceFeature) {
      const requester = productionNotificationService.createSourceNotificationRequester(sourceFeature);

      return {
        async createNotificationRequest(input, context) {
          try {
            return await requester.createNotificationRequest(input, context);
          } catch (error) {
            notificationErrors.push({ code: error.code, message: error.message });
            throw error;
          }
        },
      };
    },
  };
  const borrowingService = createBorrowingService({
    clock: () => FIXED_NOW,
    notificationService: observingNotificationService,
  });
  const fineManagementService = createFineManagementService({ clock: () => FIXED_NOW });
  const reportService = createReportService();
  const memberContext = {
    userId: member.userId,
    ip: '127.0.0.1',
    userAgent: 'sit-sql-member',
  };
  const librarianContext = {
    userId: librarian.userId,
    ip: '127.0.0.1',
    userAgent: 'sit-sql-librarian',
  };

  const created = await borrowingService.createBorrowRequest(
    { copyIds: [copyId] },
    member,
    memberContext
  );
  const requestId = created.borrowRequest.requestId;
  const detailId = created.borrowRequest.details[0].borrowDetailId;
  activeSeed.requestIds.push(requestId);
  activeSeed.detailIds.push(detailId);
  expect(created.borrowRequest).toMatchObject({ status: 'PENDING' });
  expect(created.borrowRequest.details[0]).toMatchObject({ copyId, status: 'REQUESTED' });

  const approved = await borrowingService.approveBorrowRequest(
    requestId,
    { notes: 'SIT-SQL-001 approval' },
    librarian,
    librarianContext
  );
  expect(approved.borrowRequest).toMatchObject({ requestId, status: 'APPROVED' });
  expect(approved.borrowRequest.details[0]).toMatchObject({
    borrowDetailId: detailId,
    status: 'BORROWED',
    dueDate: '2026-07-28',
  });
  expect(notificationErrors).toEqual([]);

  const approvedCopy = await pool
    .request()
    .input('CopyId', sql.Int, copyId)
    .query('SELECT Status FROM BookCopies WHERE CopyId = @CopyId');
  expect(approvedCopy.recordset[0].Status).toBe('BORROWED');

  const notifications = await pool
    .request()
    .input('RequestId', sql.Int, requestId)
    .query(`
      SELECT
        n.NotificationId,
        n.Status,
        n.SourceFeature,
        n.SourceEntityType,
        n.SourceEntityId,
        nt.TemplateCode
      FROM Notifications n
      LEFT JOIN NotificationTemplates nt ON n.TemplateId = nt.TemplateId
      WHERE n.SourceFeature = 'FE07'
        AND n.SourceEntityType = 'BORROWING'
        AND n.SourceEntityId = @RequestId
    `);
  pushUnique(activeSeed.notificationIds, notifications.recordset.map((row) => row.NotificationId));
  expect(notifications.recordset).toHaveLength(1);
  expect(notifications.recordset[0]).toMatchObject({
    Status: 'PENDING',
    SourceFeature: 'FE07',
    SourceEntityType: 'BORROWING',
    SourceEntityId: requestId,
    TemplateCode: 'DUE_DATE_REMINDER',
  });

  await pool
    .request()
    .input('RequestId', sql.Int, requestId)
    .input('BorrowDetailId', sql.Int, detailId)
    .input('RequestDate', sql.DateTime, FIXED_NOW)
    .input('DueDate', sql.Date, new Date('2026-06-30T00:00:00.000Z'))
    .query(`
      UPDATE BorrowRequests SET RequestDate = @RequestDate WHERE RequestId = @RequestId;
      UPDATE BorrowDetails SET DueDate = @DueDate WHERE BorrowDetailId = @BorrowDetailId;
    `);

  const returned = await borrowingService.returnBorrowDetail(
    detailId,
    { condition: 'NORMAL', returnDate: '2026-07-14', notes: 'SIT-SQL-001 return' },
    librarian,
    librarianContext
  );
  expect(returned.borrowDetail).toMatchObject({
    borrowDetailId: detailId,
    status: 'RETURNED',
    dueDate: '2026-06-30',
    returnDate: '2026-07-14',
  });
  expect(returned.fineCandidate).toMatchObject({
    borrowDetailId: detailId,
    overdueDays: 14,
    needsFineReview: true,
  });

  const calculated = await fineManagementService.calculateFine(
    { borrowDetailId: detailId },
    librarian,
    librarianContext
  );
  activeSeed.fineIds.push(calculated.fine.fineId);
  expect(calculated).toMatchObject({ created: true, overdueDays: 14, amount: 70000 });
  expect(calculated.fine).toMatchObject({
    userId: member.userId,
    borrowDetailId: detailId,
    overdueDays: 14,
    ratePerDay: 5000,
    amount: 70000,
    status: 'UNPAID',
  });

  const report = await reportService.getBorrowingReport(
    { fromDate: '2026-07-01', toDate: '2026-07-31', userId: member.userId },
    librarian,
    librarianContext
  );
  expect(report.totals).toEqual({ requests: 1, details: 1, activeLoans: 0, overdueLoans: 0 });
  expect(report.requestStatusCounts).toEqual({ COMPLETED: 1 });
  expect(report.detailStatusCounts).toEqual({ RETURNED: 1 });
  expect(report.borrowCountByPeriod).toEqual({ '2026-07-14': 1 });
  expect(report.topBorrowedBooks).toEqual([
    expect.objectContaining({ bookId, borrowCount: 1 }),
  ]);

  const auditRows = await pool
    .request()
    .input('MemberUserId', sql.Int, member.userId)
    .input('LibrarianUserId', sql.Int, librarian.userId)
    .input('NotificationId', sql.Int, activeSeed.notificationIds[0])
    .query(`
      SELECT LogId, UserId, Action, TargetType, TargetId, Metadata
      FROM AuditLogs
      WHERE UserId IN (@MemberUserId, @LibrarianUserId)
         OR (Action = 'NOTIFICATION_REQUEST_CREATE' AND TargetId = @NotificationId)
      ORDER BY LogId ASC
    `);
  const auditActions = auditRows.recordset.map((row) => row.Action);
  expect(auditActions).toEqual(
    expect.arrayContaining([
      'BORROW_REQUEST_CREATE',
      'BORROW_REQUEST_APPROVE',
      'NOTIFICATION_REQUEST_CREATE',
      'BORROW_DETAIL_RETURN',
      'FINE_CALCULATE',
      'REPORT_BORROWING_VIEW',
    ])
  );

  const notificationAudit = auditRows.recordset.find(
    (row) => row.Action === 'NOTIFICATION_REQUEST_CREATE'
  );
  expect(JSON.parse(notificationAudit.Metadata)).toMatchObject({
    sourceFeature: 'FE07',
    sourceEntityType: 'BORROWING',
    sourceEntityId: requestId,
  });
});
