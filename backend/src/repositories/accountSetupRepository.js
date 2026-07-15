const { sql, getPool } = require('../config/db');

function mapUser(row) {
  return {
    userId: row.UserId,
    username: row.Username,
    email: row.Email,
    phone: row.Phone,
    status: row.Status,
    createdAt: row.CreatedAt,
  };
}

// @spec BR-FE11-024, FR-FE11-003, FR-FE11-009 - source state commits or rolls back together.
async function createPendingAccount({
  username,
  email,
  passwordHash,
  phone,
  fullName,
  address,
  roleName,
  tokenHash,
  expiresAt,
  adminUserId,
  ip,
  userAgent,
  now = new Date(),
}) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const userResult = await new sql.Request(transaction)
      .input('Username', sql.NVarChar(50), username)
      .input('Email', sql.NVarChar(100), email)
      .input('PasswordHash', sql.NVarChar(255), passwordHash)
      .input('Phone', sql.NVarChar(20), phone || null)
      .input('Now', sql.DateTime, now)
      .query(`
        INSERT INTO Users (Username, Email, PasswordHash, Phone, Status, CreatedAt)
        OUTPUT INSERTED.UserId, INSERTED.Username, INSERTED.Email, INSERTED.Phone,
               INSERTED.Status, INSERTED.CreatedAt
        VALUES (@Username, @Email, @PasswordHash, @Phone, 'INACTIVE', @Now)
      `);

    const user = mapUser(userResult.recordset[0]);

    await new sql.Request(transaction)
      .input('UserId', sql.Int, user.userId)
      .input('FullName', sql.NVarChar(100), fullName)
      .input('Address', sql.NVarChar(255), address || null)
      .input('Now', sql.DateTime, now)
      .query(`
        INSERT INTO UserProfiles (UserId, FullName, Address, CreatedAt)
        VALUES (@UserId, @FullName, @Address, @Now)
      `);

    const roleResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, user.userId)
      .input('RoleName', sql.NVarChar(50), roleName)
      .input('Now', sql.DateTime, now)
      .query(`
        INSERT INTO UserRoles (UserId, RoleId, CreatedAt)
        OUTPUT INSERTED.RoleId
        SELECT @UserId, RoleId, @Now
        FROM Roles
        WHERE RoleName = @RoleName
      `);

    if (!roleResult.recordset.length) {
      throw new Error('Account setup role was not found.');
    }

    const tokenResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, user.userId)
      .input('TokenHash', sql.NVarChar(255), tokenHash)
      .input('ExpiresAt', sql.DateTime, expiresAt)
      .input('CreatedByIp', sql.NVarChar(50), ip || null)
      .input('Now', sql.DateTime, now)
      .query(`
        INSERT INTO AuthTokens
          (UserId, TokenType, TokenHash, ExpiresAt, CreatedByIp, CreatedAt)
        OUTPUT INSERTED.TokenId
        VALUES
          (@UserId, 'ACCOUNT_SETUP', @TokenHash, @ExpiresAt, @CreatedByIp, @Now)
      `);

    const tokenId = tokenResult.recordset[0].TokenId;
    const auditMetadata = JSON.stringify({ email: user.email, roleName });

    await new sql.Request(transaction)
      .input('AdminUserId', sql.Int, adminUserId)
      .input('TargetId', sql.Int, user.userId)
      .input('Metadata', sql.NVarChar(sql.MAX), auditMetadata)
      .input('IpAddress', sql.NVarChar(50), ip || null)
      .input('UserAgent', sql.NVarChar(255), userAgent || null)
      .input('Now', sql.DateTime, now)
      .query(`
        INSERT INTO AuditLogs
          (UserId, Action, TargetType, TargetId, Metadata, IpAddress, UserAgent, CreatedAt)
        VALUES
          (@AdminUserId, 'USER_CREATE', 'USER', @TargetId, @Metadata,
           @IpAddress, @UserAgent, @Now)
      `);

    await transaction.commit();
    return { user, tokenId };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// @spec BR-FE02-024, FR-FE02-024, FR-FE02-025 - one locked transaction owns setup consumption.
async function completeSetup({ tokenHash, passwordHash, now = new Date(), context = {} }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const setupResult = await new sql.Request(transaction)
      .input('TokenHash', sql.NVarChar(255), tokenHash)
      .query(`
        SELECT TOP 1
          t.TokenId,
          t.UserId,
          t.ExpiresAt,
          t.UsedAt,
          t.RevokedAt,
          u.Status
        FROM AuthTokens t WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN Users u WITH (UPDLOCK, HOLDLOCK) ON u.UserId = t.UserId
        WHERE t.TokenType = 'ACCOUNT_SETUP'
          AND t.TokenHash = @TokenHash
      `);

    const setup = setupResult.recordset[0];

    if (!setup) {
      await transaction.rollback();
      return { matched: false };
    }

    if (setup.UsedAt || setup.RevokedAt || setup.Status !== 'INACTIVE') {
      await transaction.rollback();
      return { matched: true, outcome: 'INVALID' };
    }

    if (new Date(setup.ExpiresAt).getTime() <= now.getTime()) {
      await transaction.rollback();
      return { matched: true, outcome: 'EXPIRED' };
    }

    const userUpdate = await new sql.Request(transaction)
      .input('UserId', sql.Int, setup.UserId)
      .input('PasswordHash', sql.NVarChar(255), passwordHash)
      .input('Now', sql.DateTime, now)
      .query(`
        UPDATE Users
        SET PasswordHash = @PasswordHash,
            Status = 'ACTIVE',
            EmailVerifiedAt = COALESCE(EmailVerifiedAt, @Now),
            FailedLoginCount = 0,
            LockedUntil = NULL,
            UpdatedAt = @Now
        OUTPUT INSERTED.UserId
        WHERE UserId = @UserId
          AND Status = 'INACTIVE'
      `);

    if (!userUpdate.recordset.length) {
      await transaction.rollback();
      return { matched: true, outcome: 'INVALID' };
    }

    const tokenUpdate = await new sql.Request(transaction)
      .input('TokenId', sql.Int, setup.TokenId)
      .input('Now', sql.DateTime, now)
      .query(`
        UPDATE AuthTokens
        SET UsedAt = @Now
        OUTPUT INSERTED.TokenId
        WHERE TokenId = @TokenId
          AND UsedAt IS NULL
          AND RevokedAt IS NULL
      `);

    if (!tokenUpdate.recordset.length) {
      await transaction.rollback();
      return { matched: true, outcome: 'INVALID' };
    }

    await new sql.Request(transaction)
      .input('UserId', sql.Int, setup.UserId)
      .input('TokenId', sql.Int, setup.TokenId)
      .input('Now', sql.DateTime, now)
      .query(`
        UPDATE AuthTokens
        SET RevokedAt = @Now
        WHERE UserId = @UserId
          AND TokenType = 'ACCOUNT_SETUP'
          AND TokenId <> @TokenId
          AND UsedAt IS NULL
          AND RevokedAt IS NULL
      `);

    await new sql.Request(transaction)
      .input('UserId', sql.Int, setup.UserId)
      .input('Metadata', sql.NVarChar(sql.MAX), JSON.stringify({ tokenId: setup.TokenId }))
      .input('IpAddress', sql.NVarChar(50), context.ip || null)
      .input('UserAgent', sql.NVarChar(255), context.userAgent || null)
      .input('Now', sql.DateTime, now)
      .query(`
        INSERT INTO AuditLogs
          (UserId, Action, TargetType, TargetId, Metadata, IpAddress, UserAgent, CreatedAt)
        VALUES
          (@UserId, 'AUTH_ACCOUNT_SETUP_COMPLETE', 'USER', @UserId, @Metadata,
           @IpAddress, @UserAgent, @Now)
      `);

    await transaction.commit();
    return { matched: true, outcome: 'COMPLETED', userId: setup.UserId };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  createPendingAccount,
  completeSetup,
};
