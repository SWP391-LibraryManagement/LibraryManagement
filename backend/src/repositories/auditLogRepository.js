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

function escapeLikePattern(value) {
  return String(value).replace(/[\\%_\[]/g, (character) => `\\${character}`);
}

// @spec FR-FE11-033
async function listAuditLogs({
  page = 1,
  limit = 20,
  q,
  action,
  actorId,
  from,
  to,
} = {}) {
  const offset = (page - 1) * limit;
  const clauses = ['1 = 1'];

  if (q) clauses.push(`(
    LOWER(al.Action) LIKE LOWER(@Search) ESCAPE '\\'
    OR LOWER(COALESCE(actor.Email, '')) LIKE LOWER(@Search) ESCAPE '\\'
    OR LOWER(COALESCE(actorProfile.FullName, '')) LIKE LOWER(@Search) ESCAPE '\\'
    OR LOWER(COALESCE(al.TargetType, '')) LIKE LOWER(@Search) ESCAPE '\\'
    OR CONVERT(NVARCHAR(20), al.TargetId) LIKE @Search ESCAPE '\\'
  )`);
  if (action) clauses.push('al.Action = @Action');
  if (actorId) clauses.push('al.UserId = @ActorId');
  if (from) clauses.push('al.CreatedAt >= @FromDate');
  if (to) clauses.push('al.CreatedAt < DATEADD(DAY, 1, @ToDate)');

  const whereSql = clauses.join('\n        AND ');
  const request = (await getPool()).request()
    .input('Offset', sql.Int, offset)
    .input('Limit', sql.Int, limit);

  if (q) request.input('Search', sql.NVarChar(202), `%${escapeLikePattern(q)}%`);
  if (action) request.input('Action', sql.NVarChar(100), action);
  if (actorId) request.input('ActorId', sql.Int, actorId);
  if (from) request.input('FromDate', sql.Date, from);
  if (to) request.input('ToDate', sql.Date, to);

  const result = await request.query(`
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
    WHERE ${whereSql}
    ORDER BY al.CreatedAt DESC, al.LogId DESC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;

    SELECT COUNT_BIG(*) AS Total
    FROM AuditLogs al
    LEFT JOIN Users actor ON al.UserId = actor.UserId
    LEFT JOIN UserProfiles actorProfile ON actor.UserId = actorProfile.UserId
    WHERE ${whereSql};
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
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

module.exports = {
  create,
  listAuditLogs,
};
