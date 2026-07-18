const { sql, getPool } = require('../config/db');

async function create({
  userId,
  action,
  targetType,
  targetId,
  metadata,
  ipAddress,
  userAgent,
  transaction,
}) {
  const request = transaction ? new sql.Request(transaction) : (await getPool()).request();
  await request
    .input('UserId', sql.Int, userId || null)
    .input('Action', sql.NVarChar(255), action)
    .input('TargetType', sql.NVarChar(100), targetType || null)
    .input('TargetId', sql.Int, targetId || null)
    .input('Metadata', sql.NVarChar(sql.MAX), metadata ? JSON.stringify(metadata) : null)
    .input('IpAddress', sql.NVarChar(50), ipAddress || null)
    .input('UserAgent', sql.NVarChar(255), userAgent || null)
    .query(`
      INSERT INTO AuditLogs (UserId, Action, TargetType, TargetId, Metadata, IpAddress, UserAgent)
      VALUES (@UserId, @Action, @TargetType, @TargetId, @Metadata, @IpAddress, @UserAgent)
    `);
}

async function listRecent({ page = 1, limit = 8 } = {}) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 100);
  const offset = (safePage - 1) * safeLimit;
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Limit', sql.Int, safeLimit)
    .input('Offset', sql.Int, offset)
    .query(`
      SELECT
        al.LogId,
        al.UserId,
        actor.Email AS ActorEmail,
        actorProfile.FullName AS ActorName,
        al.Action,
        al.TargetType,
        al.TargetId,
        target.Email AS TargetEmail,
        targetProfile.FullName AS TargetName,
        al.Metadata,
        al.IpAddress,
        al.CreatedAt
      FROM AuditLogs al
      LEFT JOIN Users actor ON al.UserId = actor.UserId
      LEFT JOIN UserProfiles actorProfile ON actor.UserId = actorProfile.UserId
      LEFT JOIN Users target
        ON al.TargetId = target.UserId
        AND UPPER(COALESCE(al.TargetType, '')) IN ('USER', 'USERS', 'ACCOUNT')
      LEFT JOIN UserProfiles targetProfile ON target.UserId = targetProfile.UserId
      ORDER BY al.CreatedAt DESC, al.LogId DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;

      SELECT COUNT_BIG(*) AS Total
      FROM AuditLogs;
    `);

  const data = result.recordsets[0].map((row) => ({
    logId: row.LogId,
    userId: row.UserId,
    actorEmail: row.ActorEmail,
    actorName: row.ActorName,
    action: row.Action,
    targetType: row.TargetType,
    targetId: row.TargetId,
    targetEmail: row.TargetEmail,
    targetName: row.TargetName,
    metadata: row.Metadata,
    ipAddress: row.IpAddress,
    createdAt: row.CreatedAt,
  }));

  const total = Number(result.recordsets[1]?.[0]?.Total || 0);
  return {
    data,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
}

module.exports = {
  create,
  listRecent,
};
