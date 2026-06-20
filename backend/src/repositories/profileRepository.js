const { sql, getPool } = require('../config/db');

function mapProfileRow(row) {
  if (!row) {
    return null;
  }

  return {
    userId: row.UserId,
    username: row.Username,
    email: row.Email,
    phone: row.Phone,
    status: row.Status,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    profileId: row.ProfileId,
    fullName: row.FullName,
    address: row.Address,
    dateOfBirth: row.DateOfBirth,
    avatarUrl: row.AvatarUrl,
    profileCreatedAt: row.ProfileCreatedAt,
    profileUpdatedAt: row.ProfileUpdatedAt,
  };
}

async function findByUserId(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT TOP 1
        u.UserId,
        u.Username,
        u.Email,
        u.Phone,
        u.Status,
        u.CreatedAt,
        u.UpdatedAt,
        up.ProfileId,
        up.FullName,
        up.Address,
        up.DateOfBirth,
        up.AvatarUrl,
        up.CreatedAt AS ProfileCreatedAt,
        up.UpdatedAt AS ProfileUpdatedAt
      FROM Users u
      LEFT JOIN UserProfiles up ON u.UserId = up.UserId
      WHERE u.UserId = @UserId
    `);

  return mapProfileRow(result.recordset[0]);
}

async function createBlankProfile(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM UserProfiles WHERE UserId = @UserId)
      BEGIN
        INSERT INTO UserProfiles (UserId)
        VALUES (@UserId);
      END

      SELECT TOP 1
        u.UserId,
        u.Username,
        u.Email,
        u.Phone,
        u.Status,
        u.CreatedAt,
        u.UpdatedAt,
        up.ProfileId,
        up.FullName,
        up.Address,
        up.DateOfBirth,
        up.AvatarUrl,
        up.CreatedAt AS ProfileCreatedAt,
        up.UpdatedAt AS ProfileUpdatedAt
      FROM Users u
      INNER JOIN UserProfiles up ON u.UserId = up.UserId
      WHERE u.UserId = @UserId
    `);

  return mapProfileRow(result.recordset[0]);
}

async function updateByUserId(userId, updates) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const existingResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT TOP 1
          u.Phone,
          up.FullName,
          up.Address,
          up.DateOfBirth,
          up.AvatarUrl
        FROM Users u
        LEFT JOIN UserProfiles up ON u.UserId = up.UserId
        WHERE u.UserId = @UserId
      `);

    const existing = existingResult.recordset[0] || {};

    await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('Phone', sql.NVarChar(20), updates.phone === undefined ? existing.Phone || null : updates.phone)
      .query(`
        UPDATE Users
        SET Phone = @Phone,
            UpdatedAt = GETDATE()
        WHERE UserId = @UserId
      `);

    await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input(
        'FullName',
        sql.NVarChar(100),
        updates.fullName === undefined ? existing.FullName || null : updates.fullName
      )
      .input(
        'Address',
        sql.NVarChar(255),
        updates.address === undefined ? existing.Address || null : updates.address
      )
      .input(
        'DateOfBirth',
        sql.Date,
        updates.dateOfBirth === undefined ? existing.DateOfBirth || null : updates.dateOfBirth
      )
      .input(
        'AvatarUrl',
        sql.NVarChar(255),
        updates.avatarUrl === undefined ? existing.AvatarUrl || null : updates.avatarUrl
      )
      .query(`
        MERGE UserProfiles AS target
        USING (SELECT @UserId AS UserId) AS source
        ON target.UserId = source.UserId
        WHEN MATCHED THEN
          UPDATE SET
            FullName = @FullName,
            Address = @Address,
            DateOfBirth = @DateOfBirth,
            AvatarUrl = @AvatarUrl,
            UpdatedAt = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (UserId, FullName, Address, DateOfBirth, AvatarUrl)
          VALUES (@UserId, @FullName, @Address, @DateOfBirth, @AvatarUrl);
      `);

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return findByUserId(userId);
}

module.exports = {
  findByUserId,
  createBlankProfile,
  updateByUserId,
};
