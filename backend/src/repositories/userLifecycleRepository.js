const { sql, getPool } = require('../config/db');

const EDITABLE_FIELDS = ['department', 'specialization'];

function sameDate(left, right) {
  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();
  return Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime === rightTime;
}

function normalizeNullable(value) {
  return value === undefined ? undefined : value ?? null;
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
        u.Status,
        u.DeactivatedAt,
        COALESCE(u.UpdatedAt, u.CreatedAt) AS EffectiveUpdatedAt,
        up.Department,
        up.Specialization
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

function currentValues(row) {
  return {
    department: row.Department ?? null,
    specialization: row.Specialization ?? null,
  };
}

function effectiveChanges(row, changes) {
  const current = currentValues(row);
  const next = { ...current };
  const changedFields = [];

  for (const field of EDITABLE_FIELDS) {
    if (changes[field] === undefined) continue;
    next[field] = normalizeNullable(changes[field]);
    if (next[field] !== current[field]) changedFields.push(field);
  }

  changedFields.sort();
  return { next, changedFields };
}

// @spec BR-FE11-027, FR-FE11-004, FR-FE11-007, FR-FE11-020, FR-FE11-023
async function updateManagedUser({
  adminUserId,
  userId,
  expectedUpdatedAt,
  changes,
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

    const target = await lockManagedUser(transaction, userId, expectedUpdatedAt);
    if (!target) return rollbackWith(transaction, 'USER_NOT_FOUND');
    if (!sameDate(target.EffectiveUpdatedAt, expectedUpdatedAt)) {
      return rollbackWith(transaction, 'STALE_USER_STATE');
    }

    const roles = await lockUserRoles(transaction, userId);
    if (!roles.includes('LIBRARIAN')
      && (changes.department !== undefined || changes.specialization !== undefined)) {
      return rollbackWith(transaction, 'VALIDATION_ERROR');
    }

    const { next, changedFields } = effectiveChanges(target, changes);
    if (!changedFields.length) {
      await transaction.commit();
      return { outcome: 'NO_CHANGE' };
    }

    await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('Now', sql.DateTime, now)
      .query(`
        UPDATE Users
        SET UpdatedAt = @Now
        WHERE UserId = @UserId
      `);

    await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('Department', sql.NVarChar(100), next.department)
      .input('Specialization', sql.NVarChar(100), next.specialization)
      .input('Now', sql.DateTime, now)
      .query(`
        MERGE UserProfiles AS target
        USING (SELECT @UserId AS UserId) AS source
        ON target.UserId = source.UserId
        WHEN MATCHED THEN
          UPDATE SET
            Department = @Department,
            Specialization = @Specialization,
            UpdatedAt = @Now
        WHEN NOT MATCHED THEN
          INSERT (UserId, Department, Specialization, CreatedAt)
          VALUES (@UserId, @Department, @Specialization, @Now);
      `);

    await new sql.Request(transaction)
      .input('AdminUserId', sql.Int, adminUserId)
      .input('TargetId', sql.Int, userId)
      .input('Metadata', sql.NVarChar(sql.MAX), JSON.stringify({ changedFields }))
      .input('IpAddress', sql.NVarChar(50), ipAddress || null)
      .input('UserAgent', sql.NVarChar(255), userAgent || null)
      .input('Now', sql.DateTime, now)
      .query(`
        INSERT INTO AuditLogs
          (UserId, Action, TargetType, TargetId, Metadata, IpAddress, UserAgent, CreatedAt)
        VALUES
          (@AdminUserId, 'USER_UPDATE', 'USER', @TargetId, @Metadata,
           @IpAddress, @UserAgent, @Now)
      `);

    await transaction.commit();
    return { outcome: 'UPDATED', changedFields };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// @spec BR-FE11-003, BR-FE11-006, BR-FE11-027, FR-FE11-008, FR-FE11-011
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
  updateManagedUser,
  deactivateManagedUser,
};
