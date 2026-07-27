const { sql, getPool } = require('../config/db');

async function rollbackWith(transaction, outcome) {
  await transaction.rollback();
  return { outcome };
}

// @spec BR-FE11-007..010, FR-FE11-012, FR-FE11-014
// @spec FR-FE11-017, FR-FE11-024
async function replaceUserRole({
  adminUserId,
  userId,
  roleId,
  ipAddress,
  userAgent,
  now = new Date(),
}) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const actorResult = await new sql.Request(transaction)
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

    const actor = actorResult.recordset[0];
    if (!actor) return rollbackWith(transaction, 'ADMIN_NOT_FOUND');
    if (actor.Status !== 'ACTIVE' || !actor.IsAdmin) {
      return rollbackWith(transaction, 'ADMIN_REQUIRED');
    }

    const targetResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT UserId, Status
        FROM Users WITH (UPDLOCK, HOLDLOCK)
        WHERE UserId = @UserId
      `);
    const target = targetResult.recordset[0];
    if (!target) return rollbackWith(transaction, 'USER_NOT_FOUND');

    const roleResult = await new sql.Request(transaction)
      .input('RoleId', sql.Int, roleId)
      .query(`
        SELECT RoleId, RoleName
        FROM Roles WITH (UPDLOCK, HOLDLOCK)
        WHERE RoleId = @RoleId
          AND UPPER(RoleName) IN ('ADMIN', 'LIBRARIAN', 'MEMBER')
      `);
    const roleRow = roleResult.recordset[0];
    if (!roleRow) return rollbackWith(transaction, 'ROLE_NOT_FOUND');

    const role = {
      roleId: roleRow.RoleId,
      roleName: String(roleRow.RoleName).toUpperCase(),
    };
    const mappingResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT ur.RoleId, UPPER(r.RoleName) AS RoleName
        FROM UserRoles ur WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN Roles r WITH (UPDLOCK, HOLDLOCK) ON r.RoleId = ur.RoleId
        WHERE ur.UserId = @UserId
      `);
    const currentRoles = mappingResult.recordset.map((item) => ({
      roleId: item.RoleId,
      roleName: item.RoleName,
    }));

    if (currentRoles.length === 1 && currentRoles[0].roleId === roleId) {
      await transaction.commit();
      return { outcome: 'UNCHANGED', role };
    }

    const removesAdmin = currentRoles.some(({ roleName }) => roleName === 'ADMIN')
      && role.roleName !== 'ADMIN'
      && target.Status === 'ACTIVE';

    if (removesAdmin) {
      const adminsResult = await new sql.Request(transaction).query(`
        SELECT DISTINCT ur.UserId
        FROM UserRoles ur WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN Roles r WITH (UPDLOCK, HOLDLOCK) ON r.RoleId = ur.RoleId
        INNER JOIN Users u WITH (UPDLOCK, HOLDLOCK) ON u.UserId = ur.UserId
        WHERE UPPER(r.RoleName) = 'ADMIN'
          AND u.Status = 'ACTIVE'
      `);

      if (adminsResult.recordset.length <= 1) {
        return rollbackWith(transaction, 'LAST_ADMIN_ROLE');
      }
    }

    await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query('DELETE FROM UserRoles WHERE UserId = @UserId');

    await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('RoleId', sql.Int, roleId)
      .input('Now', sql.DateTime, now)
      .query(`
        INSERT INTO UserRoles (UserId, RoleId, CreatedAt)
        VALUES (@UserId, @RoleId, @Now)
      `);

    // Make every role-owned surface converge on the new sole role after login.
    await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('Now', sql.DateTime, now)
      .query(`
        UPDATE AuthTokens
        SET RevokedAt = COALESCE(RevokedAt, @Now)
        WHERE UserId = @UserId
          AND TokenType = 'REFRESH'
          AND UsedAt IS NULL
          AND RevokedAt IS NULL
      `);

    await new sql.Request(transaction)
      .input('AdminUserId', sql.Int, adminUserId)
      .input('Action', sql.NVarChar(255), 'USER_ROLE_REPLACE')
      .input('TargetId', sql.Int, userId)
      .input('Metadata', sql.NVarChar(sql.MAX), JSON.stringify({ previousRoles: currentRoles, role }))
      .input('IpAddress', sql.NVarChar(50), ipAddress || null)
      .input('UserAgent', sql.NVarChar(255), userAgent || null)
      .input('Now', sql.DateTime, now)
      .query(`
        INSERT INTO AuditLogs
          (UserId, Action, TargetType, TargetId, Metadata, IpAddress, UserAgent, CreatedAt)
        VALUES
          (@AdminUserId, @Action, 'USER', @TargetId, @Metadata,
           @IpAddress, @UserAgent, @Now)
      `);

    await transaction.commit();
    return { outcome: 'REPLACED', role };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  replaceUserRole,
};
