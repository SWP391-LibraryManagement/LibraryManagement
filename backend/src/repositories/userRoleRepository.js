const { sql, getPool } = require('../config/db');

const OPERATIONS = new Set(['ASSIGN', 'REVOKE']);

async function rollbackWith(transaction, outcome) {
  await transaction.rollback();
  return { outcome };
}

// @spec BR-FE11-007, BR-FE11-009, BR-FE11-010, FR-FE11-012, FR-FE11-013, FR-FE11-014
// @spec FR-FE11-017, FR-FE11-024, FR-FE11-025, FR-FE11-026, FR-FE11-027
async function mutateUserRole({
  operation,
  adminUserId,
  userId,
  roleId,
  ipAddress,
  userAgent,
  now = new Date(),
}) {
  if (!OPERATIONS.has(operation)) {
    throw new TypeError('Role mutation operation must be ASSIGN or REVOKE.');
  }

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
    if (!actor) {
      return rollbackWith(transaction, 'ADMIN_NOT_FOUND');
    }
    if (actor.Status !== 'ACTIVE' || !actor.IsAdmin) {
      return rollbackWith(transaction, 'ADMIN_REQUIRED');
    }

    const targetResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT UserId
        FROM Users WITH (UPDLOCK, HOLDLOCK)
        WHERE UserId = @UserId
      `);

    if (!targetResult.recordset[0]) {
      return rollbackWith(transaction, 'USER_NOT_FOUND');
    }

    const roleResult = await new sql.Request(transaction)
      .input('RoleId', sql.Int, roleId)
      .query(`
        SELECT RoleId, RoleName
        FROM Roles WITH (UPDLOCK, HOLDLOCK)
        WHERE RoleId = @RoleId
      `);
    const roleRow = roleResult.recordset[0];

    if (!roleRow) {
      return rollbackWith(transaction, 'ROLE_NOT_FOUND');
    }

    const role = {
      roleId: roleRow.RoleId,
      roleName: roleRow.RoleName,
    };
    const mappingResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT ur.RoleId, r.RoleName
        FROM UserRoles ur WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN Roles r WITH (UPDLOCK, HOLDLOCK) ON r.RoleId = ur.RoleId
        WHERE ur.UserId = @UserId
      `);
    const targetRoles = mappingResult.recordset;
    const existingMapping = targetRoles.some((item) => item.RoleId === roleId);

    if (operation === 'ASSIGN' && existingMapping) {
      return rollbackWith(transaction, 'USER_ALREADY_HAS_ROLE');
    }

    if (operation === 'REVOKE' && !existingMapping) {
      return rollbackWith(transaction, 'USER_ROLE_NOT_FOUND');
    }

    if (operation === 'REVOKE' && targetRoles.length <= 1) {
      return rollbackWith(transaction, 'LAST_USER_ROLE');
    }

    if (operation === 'REVOKE' && String(role.roleName).toUpperCase() === 'ADMIN') {
      const adminsResult = await new sql.Request(transaction).query(`
        SELECT ur.UserId
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

    if (operation === 'ASSIGN') {
      await new sql.Request(transaction)
        .input('UserId', sql.Int, userId)
        .input('RoleId', sql.Int, roleId)
        .input('Now', sql.DateTime, now)
        .query(`
          INSERT INTO UserRoles (UserId, RoleId, CreatedAt)
          VALUES (@UserId, @RoleId, @Now)
        `);
    } else {
      await new sql.Request(transaction)
        .input('UserId', sql.Int, userId)
        .input('RoleId', sql.Int, roleId)
        .query(`
          DELETE FROM UserRoles
          WHERE UserId = @UserId AND RoleId = @RoleId
        `);
    }

    const action = operation === 'ASSIGN' ? 'USER_ROLE_ASSIGN' : 'USER_ROLE_REVOKE';
    await new sql.Request(transaction)
      .input('AdminUserId', sql.Int, adminUserId)
      .input('Action', sql.NVarChar(255), action)
      .input('TargetId', sql.Int, userId)
      .input(
        'Metadata',
        sql.NVarChar(sql.MAX),
        JSON.stringify({ roleId: role.roleId, roleName: role.roleName })
      )
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
    return {
      outcome: operation === 'ASSIGN' ? 'ASSIGNED' : 'REVOKED',
      role,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  mutateUserRole,
};
