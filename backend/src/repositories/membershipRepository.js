const { sql, getPool } = require('../config/db');

function mapApplication(row) {
  if (!row) return null;

  return {
    applicationId: row.ApplicationId,
    userId: row.UserId,
    status: row.Status,
    appliedAt: row.AppliedAt,
    approvedAt: row.ApprovedAt,
    reviewedBy: row.ReviewedBy,
    reviewNote: row.ReviewNote,
    rejectionReason: row.Status === 'REJECTED' ? row.ReviewNote : null,
    applicant: {
      userId: row.UserId,
      email: row.Email,
      username: row.Username,
      status: row.UserStatus,
      fullName: row.FullName,
      phone: row.Phone,
    },
  };
}

function mapMember(row) {
  if (!row || !row.MemberId) return null;

  return {
    memberId: row.MemberId,
    userId: row.UserId,
    status: row.MemberStatus,
    approvedAt: row.MemberApprovedAt,
    approvedBy: row.ApprovedBy,
    createdAt: row.MemberCreatedAt,
    updatedAt: row.MemberUpdatedAt,
  };
}

const applicationSelect = `
  SELECT
    ma.ApplicationId,
    ma.UserId,
    ma.Status,
    ma.AppliedAt,
    ma.ApprovedAt,
    ma.ReviewedBy,
    ma.ReviewNote,
    u.Email,
    u.Username,
    u.Phone,
    u.Status AS UserStatus,
    up.FullName
  FROM MembershipApplications ma
  INNER JOIN Users u ON ma.UserId = u.UserId
  LEFT JOIN UserProfiles up ON u.UserId = up.UserId
`;

async function findUser(userId) {
  const pool = await getPool();
  const result = await pool.request().input('UserId', sql.Int, userId).query(`
    SELECT TOP 1 UserId, Email, Username, Phone, Status
    FROM Users
    WHERE UserId = @UserId
  `);

  return result.recordset[0] || null;
}

async function findMemberByUserId(userId, transaction) {
  const request = transaction
    ? new sql.Request(transaction)
    : (await getPool()).request();
  const result = await request.input('UserId', sql.Int, userId).query(`
    SELECT TOP 1
      MemberId,
      UserId,
      Status AS MemberStatus,
      ApprovedAt AS MemberApprovedAt,
      ApprovedBy,
      CreatedAt AS MemberCreatedAt,
      UpdatedAt AS MemberUpdatedAt
    FROM Members
    WHERE UserId = @UserId
  `);

  return mapMember(result.recordset[0]);
}

async function findLatestByUserId(userId) {
  const pool = await getPool();
  const result = await pool.request().input('UserId', sql.Int, userId).query(`
    ${applicationSelect}
    WHERE ma.UserId = @UserId
    ORDER BY ma.AppliedAt DESC, ma.ApplicationId DESC
  `);

  return mapApplication(result.recordset[0]);
}

async function hasBlockingApplication(userId) {
  const pool = await getPool();
  const result = await pool.request().input('UserId', sql.Int, userId).query(`
    SELECT TOP 1 Status
    FROM MembershipApplications
    WHERE UserId = @UserId AND Status IN ('PENDING', 'APPROVED')
    ORDER BY AppliedAt DESC, ApplicationId DESC
  `);

  return result.recordset[0]?.Status || null;
}

async function createApplication(userId, { onBeforeCommit } = {}) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const result = await new sql.Request(transaction).input('UserId', sql.Int, userId).query(`
      INSERT INTO MembershipApplications (UserId, Status, AppliedAt)
      OUTPUT INSERTED.ApplicationId
      VALUES (@UserId, 'PENDING', GETDATE());

      MERGE Members AS target
      USING (SELECT @UserId AS UserId) AS source
      ON target.UserId = source.UserId
      WHEN MATCHED THEN
        UPDATE SET Status = 'PENDING', ApprovedAt = NULL, ApprovedBy = NULL, UpdatedAt = GETDATE()
      WHEN NOT MATCHED THEN
        INSERT (UserId, Status, CreatedAt)
        VALUES (@UserId, 'PENDING', GETDATE());
    `);

    const applicationId = result.recordset[0].ApplicationId;
    const application = await findById(applicationId, transaction);
    const member = await findMemberByUserId(userId, transaction);
    application.member = member;

    if (typeof onBeforeCommit === 'function') {
      await onBeforeCommit({ application, member, transaction });
    }

    await transaction.commit();
    return application;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function findById(applicationId, transaction) {
  const request = transaction
    ? new sql.Request(transaction)
    : (await getPool()).request();
  const result = await request.input('ApplicationId', sql.Int, applicationId).query(`
    ${applicationSelect}
    WHERE ma.ApplicationId = @ApplicationId
  `);

  return mapApplication(result.recordset[0]);
}

async function listApplications({ q, status, page = 1, limit = 20 } = {}) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const offset = (safePage - 1) * safeLimit;
  const pool = await getPool();
  const request = pool.request().input('Offset', sql.Int, offset).input('Limit', sql.Int, safeLimit);
  const where = [];

  if (status) {
    request.input('Status', sql.NVarChar(20), status);
    where.push('ma.Status = @Status');
  }

  if (q) {
    request.input('Search', sql.NVarChar(102), `%${q}%`);
    where.push(`(
      CAST(ma.ApplicationId AS NVARCHAR(20)) LIKE @Search
      OR u.Email LIKE @Search
      OR u.Username LIKE @Search
      OR up.FullName LIKE @Search
    )`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const result = await request.query(`
    SELECT COUNT_BIG(1) AS Total
    FROM MembershipApplications ma
    INNER JOIN Users u ON ma.UserId = u.UserId
    LEFT JOIN UserProfiles up ON u.UserId = up.UserId
    ${whereSql};

    ${applicationSelect}
    ${whereSql}
    ORDER BY ma.AppliedAt DESC, ma.ApplicationId DESC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
  `);

  const total = Number(result.recordsets[0][0]?.Total || 0);

  return {
    applications: result.recordsets[1].map(mapApplication),
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.max(Math.ceil(total / safeLimit), 1),
  };
}

async function approve(applicationId, reviewerId, options) {
  return review(applicationId, reviewerId, 'APPROVED', null, options);
}

async function reject(applicationId, reviewerId, reason, options) {
  return review(applicationId, reviewerId, 'REJECTED', reason, options);
}

async function review(applicationId, reviewerId, status, reason, { onBeforeCommit } = {}) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  const decisionAt = new Date();
  await transaction.begin();

  try {
    const current = await new sql.Request(transaction)
      .input('ApplicationId', sql.Int, applicationId)
      .query(`
        SELECT TOP 1 ApplicationId, UserId, Status
        FROM MembershipApplications WITH (UPDLOCK, HOLDLOCK)
        WHERE ApplicationId = @ApplicationId
      `);

    const row = current.recordset[0];
    if (!row) {
      await transaction.rollback();
      return null;
    }

    if (row.Status !== 'PENDING') {
      await transaction.rollback();
      return { invalidStatus: row.Status };
    }

    const applicationUpdate = await new sql.Request(transaction)
      .input('ApplicationId', sql.Int, applicationId)
      .input('ReviewerId', sql.Int, reviewerId)
      .input('ReviewNote', sql.NVarChar(500), reason || null)
      .input('DecisionAt', sql.DateTime2, decisionAt)
      .query(`
        UPDATE MembershipApplications
        SET Status = '${status}',
            ApprovedAt = ${status === 'APPROVED' ? '@DecisionAt' : 'NULL'},
            ReviewedBy = @ReviewerId,
            ReviewNote = @ReviewNote
        WHERE ApplicationId = @ApplicationId
          AND Status = 'PENDING'
      `);

    if (applicationUpdate.rowsAffected?.[0] !== 1) {
      await transaction.rollback();
      return { invalidStatus: row.Status };
    }

    await new sql.Request(transaction)
      .input('UserId', sql.Int, row.UserId)
      .input('ReviewerId', sql.Int, reviewerId)
      .input('DecisionAt', sql.DateTime2, decisionAt)
      .query(`
        MERGE Members AS target
        USING (SELECT @UserId AS UserId) AS source
        ON target.UserId = source.UserId
        WHEN MATCHED THEN
          UPDATE SET
            Status = '${status}',
            ApprovedAt = ${status === 'APPROVED' ? '@DecisionAt' : 'NULL'},
            ApprovedBy = ${status === 'APPROVED' ? '@ReviewerId' : 'NULL'},
            UpdatedAt = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (UserId, Status, ApprovedAt, ApprovedBy, CreatedAt, UpdatedAt)
          VALUES (@UserId, '${status}', ${status === 'APPROVED' ? '@DecisionAt' : 'NULL'}, ${status === 'APPROVED' ? '@ReviewerId' : 'NULL'}, GETDATE(), GETDATE());
      `);

    const application = await findById(applicationId, transaction);
    const member = await findMemberByUserId(row.UserId, transaction);
    application.member = member;
    application.decisionAt = decisionAt;

    if (typeof onBeforeCommit === 'function') {
      await onBeforeCommit({ application, member, decisionAt, transaction });
    }

    await transaction.commit();
    return application;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  findUser,
  findMemberByUserId,
  findLatestByUserId,
  hasBlockingApplication,
  createApplication,
  findById,
  listApplications,
  approve,
  reject,
};
