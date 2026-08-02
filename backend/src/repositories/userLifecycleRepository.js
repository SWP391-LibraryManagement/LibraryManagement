const { sql, getPool } = require('../config/db');

function sameDate(left, right) {
  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();
  return Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime === rightTime;
}

async function rollbackWith(transaction, outcome, details = {}) {
  await transaction.rollback();
  return { outcome, ...details };
}

async function lockActingAdmin(transaction, adminUserId) {
  const result = await new sql.Request(transaction)
    .input('AdminUserId', sql.Int, adminUserId)
    .query(`
      SELECT
        u.UserId,
        u.Status,
        CASE WHEN EXISTS (
          SELECT 1
          FROM UserRoles ur WITH (UPDLOCK, HOLDLOCK)
          INNER JOIN Roles r WITH (UPDLOCK, HOLDLOCK) ON r.RoleId = ur.RoleId
          WHERE ur.UserId = u.UserId
            AND UPPER(r.RoleName) = 'ADMIN'
        ) THEN 1 ELSE 0 END AS IsAdmin
      FROM Users u WITH (UPDLOCK, HOLDLOCK)
      WHERE u.UserId = @AdminUserId
    `);
  return result.recordset[0];
}

async function lockManagedUser(transaction, userId, expectedUpdatedAt) {
  const result = await new sql.Request(transaction)
    .input('UserId', sql.Int, userId)
    .input('ExpectedUpdatedAt', sql.DateTime, expectedUpdatedAt)
    .query(`
      SELECT
        u.UserId,
        u.Phone,
        u.Status,
        u.DeactivatedAt,
        CASE
          WHEN COALESCE(up.UpdatedAt, up.CreatedAt) > COALESCE(u.UpdatedAt, u.CreatedAt)
            THEN COALESCE(up.UpdatedAt, up.CreatedAt)
          ELSE COALESCE(u.UpdatedAt, u.CreatedAt)
        END AS EffectiveUpdatedAt,
        up.FullName,
        up.Address
      FROM Users u WITH (UPDLOCK, HOLDLOCK)
      LEFT JOIN UserProfiles up WITH (UPDLOCK, HOLDLOCK) ON up.UserId = u.UserId
      WHERE u.UserId = @UserId
    `);
  return result.recordset[0];
}

async function lockUserRoles(transaction, userId) {
  const result = await new sql.Request(transaction)
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT r.RoleName
      FROM UserRoles ur WITH (UPDLOCK, HOLDLOCK)
      INNER JOIN Roles r WITH (UPDLOCK, HOLDLOCK) ON r.RoleId = ur.RoleId
      WHERE ur.UserId = @UserId
    `);
  return result.recordset.map((row) => String(row.RoleName).toUpperCase());
}

// @spec BR-FE11-003, BR-FE11-006, BR-FE11-027, BR-FE11-030, FR-FE11-008, FR-FE11-011, FR-FE11-023, FR-FE11-041
async function deactivateManagedUser({
  adminUserId,
  userId,
  expectedUpdatedAt,
  ipAddress,
  userAgent,
  now = new Date(),
}) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const actor = await lockActingAdmin(transaction, adminUserId);
    if (!actor) return rollbackWith(transaction, 'ADMIN_NOT_FOUND');
    if (actor.Status !== 'ACTIVE' || !actor.IsAdmin) {
      return rollbackWith(transaction, 'ADMIN_REQUIRED');
    }

    await new sql.Request(transaction)
      .input('MemberLockResource', sql.NVarChar(255), `FE07-BORROW-MEMBER-${userId}`)
      .query(`
        DECLARE @MemberLockResult INT;
        EXEC @MemberLockResult = sp_getapplock
          @Resource = @MemberLockResource,
          @LockMode = 'Exclusive',
          @LockOwner = 'Transaction',
          @LockTimeout = 10000;
        IF @MemberLockResult < 0
          THROW 51001, 'Unable to acquire borrowing member lock.', 1;
      `);

    const target = await lockManagedUser(transaction, userId, expectedUpdatedAt);
    if (!target) return rollbackWith(transaction, 'USER_NOT_FOUND');
    if (Number(target.UserId) === Number(adminUserId)) {
      return rollbackWith(transaction, 'CANNOT_DEACTIVATE_SELF');
    }
    if (!sameDate(target.EffectiveUpdatedAt, expectedUpdatedAt)) {
      return rollbackWith(transaction, 'STALE_USER_STATE');
    }
    if (target.Status === 'INACTIVE') {
      if (!target.DeactivatedAt) {
        return rollbackWith(transaction, 'ACCOUNT_PENDING_ACTIVATION');
      }
      await transaction.commit();
      return { outcome: 'ALREADY_DEACTIVATED' };
    }
    if (!['ACTIVE', 'LOCKED'].includes(target.Status)) {
      return rollbackWith(transaction, 'VALIDATION_ERROR');
    }

    await lockUserRoles(transaction, userId);
    await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT MemberId
        FROM Members WITH (UPDLOCK, HOLDLOCK)
        WHERE UserId = @UserId
      `);

    const borrowingResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS ActiveBorrowingCount
        FROM BorrowRequests br WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN BorrowDetails bd WITH (UPDLOCK, HOLDLOCK)
          ON bd.RequestId = br.RequestId
        WHERE br.UserId = @UserId
          AND bd.Status = 'BORROWED'
      `);
    const activeBorrowingCount = Number(
      borrowingResult.recordset[0]?.ActiveBorrowingCount || 0
    );
    if (activeBorrowingCount > 0) {
      return rollbackWith(transaction, 'ACTIVE_BORROWINGS_EXIST', {
        activeBorrowingCount,
      });
    }

    const pendingRequestResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT COUNT(DISTINCT br.RequestId) AS PendingRequestCount
        FROM BorrowRequests br WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN BorrowDetails bd WITH (UPDLOCK, HOLDLOCK)
          ON bd.RequestId = br.RequestId
        WHERE br.UserId = @UserId
          AND br.Status = 'PENDING'
          AND bd.Status = 'REQUESTED'
      `);
    const pendingRequestCount = Number(
      pendingRequestResult.recordset[0]?.PendingRequestCount || 0
    );
    if (pendingRequestCount > 0) {
      return rollbackWith(transaction, 'PENDING_BORROW_REQUESTS_EXIST', {
        pendingRequestCount,
      });
    }

    await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('Now', sql.DateTime, now)
      .query(`
        UPDATE Users
        SET Status = 'INACTIVE',
            DeactivatedAt = @Now,
            UpdatedAt = @Now
        WHERE UserId = @UserId
      `);

    await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('Now', sql.DateTime, now)
      .query(`
        UPDATE AuthTokens
        SET RevokedAt = @Now
        WHERE UserId = @UserId
          AND TokenType = 'REFRESH'
          AND UsedAt IS NULL
          AND RevokedAt IS NULL
      `);

    await new sql.Request(transaction)
      .input('AdminUserId', sql.Int, adminUserId)
      .input('TargetId', sql.Int, userId)
      .input(
        'Metadata',
        sql.NVarChar(sql.MAX),
        JSON.stringify({ previousStatus: target.Status, newStatus: 'INACTIVE' })
      )
      .input('IpAddress', sql.NVarChar(50), ipAddress || null)
      .input('UserAgent', sql.NVarChar(255), userAgent || null)
      .input('Now', sql.DateTime, now)
      .query(`
        INSERT INTO AuditLogs
          (UserId, Action, TargetType, TargetId, Metadata, IpAddress, UserAgent, CreatedAt)
        VALUES
          (@AdminUserId, 'USER_DEACTIVATE', 'USER', @TargetId, @Metadata,
           @IpAddress, @UserAgent, @Now)
      `);

    await transaction.commit();
    return { outcome: 'DEACTIVATED', previousStatus: target.Status };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  deactivateManagedUser,
};
