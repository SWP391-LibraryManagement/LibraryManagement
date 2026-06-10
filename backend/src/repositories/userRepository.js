const { sql, getPool } = require('../config/db');

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    userId: row.UserId,
    username: row.Username,
    email: row.Email,
    passwordHash: row.PasswordHash,
    phone: row.Phone,
    status: row.Status,
    emailVerifiedAt: row.EmailVerifiedAt,
    failedLoginCount: row.FailedLoginCount,
    lockedUntil: row.LockedUntil,
    lastLoginAt: row.LastLoginAt,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

function mapSafeUser(row, roles = []) {
  const user = mapUser(row);

  if (!user) {
    return null;
  }

  delete user.passwordHash;
  user.roles = roles;

  return user;
}

async function findByEmail(email) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Email', sql.NVarChar(100), email)
    .query('SELECT TOP 1 * FROM Users WHERE LOWER(Email) = LOWER(@Email)');

  return mapUser(result.recordset[0]);
}

async function findByUsername(username) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Username', sql.NVarChar(50), username)
    .query('SELECT TOP 1 * FROM Users WHERE LOWER(Username) = LOWER(@Username)');

  return mapUser(result.recordset[0]);
}

async function findByEmailOrUsername(identifier) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Identifier', sql.NVarChar(100), identifier)
    .query(`
      SELECT TOP 1 *
      FROM Users
      WHERE LOWER(Email) = LOWER(@Identifier)
         OR LOWER(Username) = LOWER(@Identifier)
    `);

  return mapUser(result.recordset[0]);
}

async function findById(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query('SELECT TOP 1 * FROM Users WHERE UserId = @UserId');

  return mapUser(result.recordset[0]);
}

async function getRolesByUserId(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT r.RoleName
      FROM UserRoles ur
      INNER JOIN Roles r ON ur.RoleId = r.RoleId
      WHERE ur.UserId = @UserId
      ORDER BY r.RoleName
    `);

  return result.recordset.map((row) => row.RoleName);
}

async function getSafeUserById(userId) {
  const user = await findById(userId);

  if (!user) {
    return null;
  }

  const roles = await getRolesByUserId(userId);
  return mapSafeUser(
    {
      UserId: user.userId,
      Username: user.username,
      Email: user.email,
      PasswordHash: user.passwordHash,
      Phone: user.phone,
      Status: user.status,
      EmailVerifiedAt: user.emailVerifiedAt,
      FailedLoginCount: user.failedLoginCount,
      LockedUntil: user.lockedUntil,
      LastLoginAt: user.lastLoginAt,
      CreatedAt: user.createdAt,
      UpdatedAt: user.updatedAt,
    },
    roles
  );
}

async function createRegisteredUser({ username, email, passwordHash, phoneNumber, fullName }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const userResult = await new sql.Request(transaction)
      .input('Username', sql.NVarChar(50), username)
      .input('Email', sql.NVarChar(100), email)
      .input('PasswordHash', sql.NVarChar(255), passwordHash)
      .input('Phone', sql.NVarChar(20), phoneNumber || null)
      .query(`
        INSERT INTO Users (Username, Email, PasswordHash, Phone, Status)
        OUTPUT INSERTED.*
        VALUES (@Username, @Email, @PasswordHash, @Phone, 'INACTIVE')
      `);

    const user = mapUser(userResult.recordset[0]);

    if (fullName) {
      await new sql.Request(transaction)
        .input('UserId', sql.Int, user.userId)
        .input('FullName', sql.NVarChar(100), fullName)
        .query(`
          INSERT INTO UserProfiles (UserId, FullName)
          VALUES (@UserId, @FullName)
        `);
    }

    await new sql.Request(transaction)
      .input('UserId', sql.Int, user.userId)
      .query(`
        INSERT INTO UserRoles (UserId, RoleId)
        SELECT @UserId, RoleId
        FROM Roles
        WHERE RoleName = 'MEMBER'
      `);

    await transaction.commit();
    return user;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function markEmailVerified(userId) {
  const pool = await getPool();
  await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      UPDATE Users
      SET Status = 'ACTIVE',
          EmailVerifiedAt = COALESCE(EmailVerifiedAt, GETDATE()),
          UpdatedAt = GETDATE()
      WHERE UserId = @UserId
    `);
}

async function updateFailedLogin(userId, failedLoginCount, lockedUntil) {
  const pool = await getPool();
  await pool
    .request()
    .input('UserId', sql.Int, userId)
    .input('FailedLoginCount', sql.Int, failedLoginCount)
    .input('LockedUntil', sql.DateTime, lockedUntil || null)
    .query(`
      UPDATE Users
      SET FailedLoginCount = @FailedLoginCount,
          LockedUntil = @LockedUntil,
          UpdatedAt = GETDATE()
      WHERE UserId = @UserId
    `);
}

async function resetFailedLoginsAndSetLastLogin(userId) {
  const pool = await getPool();
  await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      UPDATE Users
      SET FailedLoginCount = 0,
          LockedUntil = NULL,
          LastLoginAt = GETDATE(),
          UpdatedAt = GETDATE()
      WHERE UserId = @UserId
    `);
}

module.exports = {
  findByEmail,
  findByUsername,
  findByEmailOrUsername,
  findById,
  getRolesByUserId,
  getSafeUserById,
  createRegisteredUser,
  markEmailVerified,
  updateFailedLogin,
  resetFailedLoginsAndSetLastLogin,
};
