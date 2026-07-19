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

const PROFILE_SELECT_SQL = `
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
`;

async function findByUserId(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(PROFILE_SELECT_SQL);

  return mapProfileRow(result.recordset[0]);
}

// @spec FR-FE03-001 AC-FE03-012
async function createBlankProfile(userId) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        IF NOT EXISTS (
          SELECT 1
          FROM UserProfiles WITH (UPDLOCK, HOLDLOCK)
          WHERE UserId = @UserId
        )
        BEGIN
          INSERT INTO UserProfiles (UserId)
          VALUES (@UserId);
        END
      `);

    const result = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(PROFILE_SELECT_SQL);

    await transaction.commit();
    return mapProfileRow(result.recordset[0]);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// @spec FR-FE03-010
async function updateByUserId(userId, updates, { auditLogRepository, auditEntry } = {}) {
  if (!auditLogRepository || typeof auditLogRepository.create !== 'function' || !auditEntry) {
    throw new Error('Profile updates require an audit entry.');
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    if (updates.phone !== undefined) {
      await new sql.Request(transaction)
        .input('UserId', sql.Int, userId)
        .input('Phone', sql.NVarChar(20), updates.phone)
        .query(`
          UPDATE Users
          SET Phone = @Phone,
              UpdatedAt = GETDATE()
          WHERE UserId = @UserId
        `);
    }

    const profileAssignments = [];
    const profileRequest = new sql.Request(transaction).input('UserId', sql.Int, userId);

    if (updates.fullName !== undefined) {
      profileAssignments.push('FullName = @FullName');
      profileRequest.input('FullName', sql.NVarChar(100), updates.fullName);
    }
    if (updates.address !== undefined) {
      profileAssignments.push('Address = @Address');
      profileRequest.input('Address', sql.NVarChar(255), updates.address);
    }
    if (updates.dateOfBirth !== undefined) {
      profileAssignments.push('DateOfBirth = @DateOfBirth');
      profileRequest.input('DateOfBirth', sql.Date, updates.dateOfBirth);
    }

    if (profileAssignments.length > 0) {
      await profileRequest.query(`
        UPDATE UserProfiles
        SET ${profileAssignments.join(',\n            ')},
            UpdatedAt = GETDATE()
        WHERE UserId = @UserId
      `);
    }

    await auditLogRepository.create({ ...auditEntry, transaction });
    const result = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(PROFILE_SELECT_SQL);

    await transaction.commit();
    return mapProfileRow(result.recordset[0]);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// @spec BR-FE03-017 FR-FE03-010
async function updateAvatarByUserId(userId, avatarUrl, { auditLogRepository, auditEntry } = {}) {
  if (!auditLogRepository || typeof auditLogRepository.create !== 'function' || !auditEntry) {
    throw new Error('Avatar updates require an audit entry.');
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('AvatarUrl', sql.NVarChar(255), avatarUrl)
      .query(`
        UPDATE UserProfiles
        SET AvatarUrl = @AvatarUrl,
            UpdatedAt = GETDATE()
        WHERE UserId = @UserId
      `);

    await auditLogRepository.create({ ...auditEntry, transaction });
    const result = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(PROFILE_SELECT_SQL);
    await transaction.commit();
    return mapProfileRow(result.recordset[0]);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  findByUserId,
  createBlankProfile,
  updateByUserId,
  updateAvatarByUserId,
};
