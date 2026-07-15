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

module.exports = {
  createPendingAccount,
};
