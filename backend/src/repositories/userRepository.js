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

function mapManagedUser(row) {
  if (!row) {
    return null;
  }

  return {
    userId: row.UserId,
    username: row.Username,
    email: row.Email,
    phone: row.Phone,
    status: row.Status,
    fullName: row.FullName,
    address: row.Address,
    lastLoginAt: row.LastLoginAt,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    roles: row.Roles ? String(row.Roles).split(',').filter(Boolean) : [],
  };
}

async function listManagedUsers({ page = 1, limit = 20, status, role, search } = {}) {
  const pool = await getPool();
  const offset = (page - 1) * limit;
  const request = pool
    .request()
    .input('Offset', sql.Int, offset)
    .input('Limit', sql.Int, limit);

  const where = [];

  if (status) {
    request.input('Status', sql.NVarChar(20), status);
    where.push('UPPER(u.Status) = @Status');
  }

  if (role) {
    request.input('Role', sql.NVarChar(50), role);
    where.push(`
      EXISTS (
        SELECT 1
        FROM UserRoles roleFilterUr
        INNER JOIN Roles roleFilterR ON roleFilterUr.RoleId = roleFilterR.RoleId
        WHERE roleFilterUr.UserId = u.UserId
          AND UPPER(roleFilterR.RoleName) = @Role
      )
    `);
  }

  if (search) {
    request.input('Search', sql.NVarChar(150), `%${search}%`);
    where.push(`(
      LOWER(u.Email) LIKE LOWER(@Search)
      OR LOWER(u.Username) LIKE LOWER(@Search)
      OR LOWER(up.FullName) LIKE LOWER(@Search)
      OR u.Phone LIKE @Search
      OR LOWER(up.Address) LIKE LOWER(@Search)
      OR LOWER(roleList.Roles) LIKE LOWER(@Search)
      OR CONVERT(NVARCHAR(20), u.UserId) LIKE @Search
    )`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const result = await request.query(`
    WITH ManagedUsers AS (
      SELECT
        u.UserId,
        u.Username,
        u.Email,
        u.Phone,
        u.Status,
        u.LastLoginAt,
        u.CreatedAt,
        u.UpdatedAt,
        up.FullName,
        up.Address,
        roleList.Roles,
        COUNT(*) OVER() AS TotalCount
      FROM Users u
      LEFT JOIN UserProfiles up ON u.UserId = up.UserId
      OUTER APPLY (
        SELECT STUFF((
          SELECT ',' + r.RoleName
          FROM UserRoles ur
          INNER JOIN Roles r ON ur.RoleId = r.RoleId
          WHERE ur.UserId = u.UserId
          ORDER BY r.RoleName
          FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS Roles
      ) roleList
      ${whereClause}
      GROUP BY
        u.UserId,
        u.Username,
        u.Email,
        u.Phone,
        u.Status,
        u.LastLoginAt,
        u.CreatedAt,
        u.UpdatedAt,
        up.FullName,
        up.Address,
        roleList.Roles
    )
    SELECT *
    FROM ManagedUsers
    ORDER BY CreatedAt DESC, UserId DESC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;

    SELECT
      COUNT_BIG(1) AS Total,
      SUM(CASE WHEN u.Status = 'ACTIVE' THEN 1 ELSE 0 END) AS Active,
      SUM(CASE WHEN u.Status = 'INACTIVE' THEN 1 ELSE 0 END) AS Inactive,
      SUM(CASE WHEN librarianUsers.UserId IS NOT NULL THEN 1 ELSE 0 END) AS Librarians
    FROM Users u
    LEFT JOIN (
      SELECT DISTINCT ur.UserId
      FROM UserRoles ur
      INNER JOIN Roles r ON r.RoleId = ur.RoleId
      WHERE r.RoleName = 'LIBRARIAN'
    ) librarianUsers ON librarianUsers.UserId = u.UserId;
  `);

  const rows = result.recordsets[0] || [];
  const total = rows[0]?.TotalCount || 0;
  const summaryRow = result.recordsets[1]?.[0] || {};

  return {
    data: rows.map(mapManagedUser),
    summary: {
      total: Number(summaryRow.Total || 0),
      active: Number(summaryRow.Active || 0),
      inactive: Number(summaryRow.Inactive || 0),
      librarians: Number(summaryRow.Librarians || 0),
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getManagedUserById(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT
        u.UserId,
        u.Username,
        u.Email,
        u.Phone,
        u.Status,
        u.LastLoginAt,
        u.CreatedAt,
        u.UpdatedAt,
        up.FullName,
        up.Address,
        roleList.Roles
      FROM Users u
      LEFT JOIN UserProfiles up ON u.UserId = up.UserId
      OUTER APPLY (
        SELECT STUFF((
          SELECT ',' + r.RoleName
          FROM UserRoles ur
          INNER JOIN Roles r ON ur.RoleId = r.RoleId
          WHERE ur.UserId = u.UserId
          ORDER BY r.RoleName
          FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS Roles
      ) roleList
      WHERE u.UserId = @UserId
      GROUP BY
        u.UserId,
        u.Username,
        u.Email,
        u.Phone,
        u.Status,
        u.LastLoginAt,
        u.CreatedAt,
        u.UpdatedAt,
        up.FullName,
        up.Address,
        roleList.Roles
    `);

  return mapManagedUser(result.recordset[0]);
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

async function createAdminManagedUser({ username, email, passwordHash, phone, fullName, address, roleName }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const userResult = await new sql.Request(transaction)
      .input('Username', sql.NVarChar(50), username)
      .input('Email', sql.NVarChar(100), email)
      .input('PasswordHash', sql.NVarChar(255), passwordHash)
      .input('Phone', sql.NVarChar(20), phone || null)
      .query(`
        INSERT INTO Users (Username, Email, PasswordHash, Phone, Status)
        OUTPUT INSERTED.*
        VALUES (@Username, @Email, @PasswordHash, @Phone, 'ACTIVE')
      `);

    const user = mapUser(userResult.recordset[0]);

    await new sql.Request(transaction)
      .input('UserId', sql.Int, user.userId)
      .input('FullName', sql.NVarChar(100), fullName)
      .input('Address', sql.NVarChar(255), address || null)
      .query(`
        INSERT INTO UserProfiles (UserId, FullName, Address)
        VALUES (@UserId, @FullName, @Address)
      `);

    await new sql.Request(transaction)
      .input('UserId', sql.Int, user.userId)
      .input('RoleName', sql.NVarChar(50), roleName)
      .query(`
        INSERT INTO UserRoles (UserId, RoleId)
        SELECT @UserId, RoleId
        FROM Roles
        WHERE RoleName = @RoleName
      `);

    await transaction.commit();
    return user;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function updateManagedUser(userId, updates) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    if (updates.email !== undefined || updates.phone !== undefined) {
      const existing = await findById(userId);
      await new sql.Request(transaction)
        .input('UserId', sql.Int, userId)
        .input('Email', sql.NVarChar(100), updates.email === undefined ? existing.email : updates.email)
        .input('Phone', sql.NVarChar(20), updates.phone === undefined ? existing.phone : updates.phone)
        .query(`
          UPDATE Users
          SET Email = @Email,
              Phone = @Phone,
              UpdatedAt = GETDATE()
          WHERE UserId = @UserId
        `);
    } else {
      await new sql.Request(transaction)
        .input('UserId', sql.Int, userId)
        .query(`
          UPDATE Users
          SET UpdatedAt = GETDATE()
          WHERE UserId = @UserId
        `);
    }

    if (updates.fullName !== undefined || updates.address !== undefined) {
      const existingProfile = await new sql.Request(transaction)
        .input('UserId', sql.Int, userId)
        .query('SELECT TOP 1 * FROM UserProfiles WHERE UserId = @UserId');

      const currentProfile = existingProfile.recordset[0] || {};
      await new sql.Request(transaction)
        .input('UserId', sql.Int, userId)
        .input(
          'FullName',
          sql.NVarChar(100),
          updates.fullName === undefined ? currentProfile.FullName || null : updates.fullName
        )
        .input(
          'Address',
          sql.NVarChar(255),
          updates.address === undefined ? currentProfile.Address || null : updates.address
        )
        .query(`
          MERGE UserProfiles AS target
          USING (SELECT @UserId AS UserId) AS source
          ON target.UserId = source.UserId
          WHEN MATCHED THEN
            UPDATE SET FullName = @FullName, Address = @Address, UpdatedAt = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (UserId, FullName, Address)
            VALUES (@UserId, @FullName, @Address);
        `);
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function updateManagedUserStatus(userId, status) {
  const pool = await getPool();
  await pool
    .request()
    .input('UserId', sql.Int, userId)
    .input('Status', sql.NVarChar(20), status)
    .query(`
      UPDATE Users
      SET Status = @Status,
          UpdatedAt = GETDATE()
      WHERE UserId = @UserId
    `);
}

async function listRoles() {
  const pool = await getPool();
  const result = await pool
    .request()
    .query('SELECT RoleId, RoleName FROM Roles ORDER BY RoleName');

  return result.recordset.map((row) => ({
    roleId: row.RoleId,
    roleName: row.RoleName,
  }));
}

async function countActiveBorrowingsByUserId(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT COUNT(*) AS ActiveBorrowingCount
      FROM BorrowRequests br
      INNER JOIN BorrowDetails bd ON br.RequestId = bd.RequestId
      WHERE br.UserId = @UserId
        AND br.Status = 'APPROVED'
        AND bd.Status IN ('BORROWED', 'OVERDUE')
    `);

  return result.recordset[0]?.ActiveBorrowingCount || 0;
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
          Status = CASE WHEN @LockedUntil IS NOT NULL THEN 'LOCKED' ELSE Status END,
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
          Status = CASE WHEN Status = 'LOCKED' THEN 'ACTIVE' ELSE Status END,
          LastLoginAt = GETDATE(),
          UpdatedAt = GETDATE()
      WHERE UserId = @UserId
    `);
}

async function unlockExpiredAccount(userId) {
  const pool = await getPool();
  await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      UPDATE Users
      SET FailedLoginCount = 0,
          LockedUntil = NULL,
          Status = CASE WHEN Status = 'LOCKED' THEN 'ACTIVE' ELSE Status END,
          UpdatedAt = GETDATE()
      WHERE UserId = @UserId
    `);
}

async function updatePassword(userId, passwordHash) {
  const pool = await getPool();
  await pool
    .request()
    .input('UserId', sql.Int, userId)
    .input('PasswordHash', sql.NVarChar(255), passwordHash)
    .query(`
      UPDATE Users
      SET PasswordHash = @PasswordHash,
          FailedLoginCount = 0,
          LockedUntil = NULL,
          Status = CASE WHEN Status = 'LOCKED' THEN 'ACTIVE' ELSE Status END,
          UpdatedAt = GETDATE()
      WHERE UserId = @UserId
    `);
}

async function updatePasswordAndActivate(userId, passwordHash) {
  const pool = await getPool();
  await pool
    .request()
    .input('UserId', sql.Int, userId)
    .input('PasswordHash', sql.NVarChar(255), passwordHash)
    .query(`
      UPDATE Users
      SET PasswordHash = @PasswordHash,
          Status = 'ACTIVE',
          EmailVerifiedAt = COALESCE(EmailVerifiedAt, GETDATE()),
          FailedLoginCount = 0,
          LockedUntil = NULL,
          UpdatedAt = GETDATE()
      WHERE UserId = @UserId
    `);
}

module.exports = {
  listManagedUsers,
  getManagedUserById,
  findByEmail,
  findByUsername,
  findByEmailOrUsername,
  findById,
  getRolesByUserId,
  getSafeUserById,
  createRegisteredUser,
  createAdminManagedUser,
  updateManagedUser,
  updateManagedUserStatus,
  listRoles,
  countActiveBorrowingsByUserId,
  markEmailVerified,
  updateFailedLogin,
  resetFailedLoginsAndSetLastLogin,
  unlockExpiredAccount,
  updatePassword,
  updatePasswordAndActivate,
};
