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

async function listRecent(limit = 30) {
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Limit', sql.Int, safeLimit)
    .query(`
      SELECT TOP (@Limit)
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
      LEFT JOIN Users target ON al.TargetId = target.UserId
      LEFT JOIN UserProfiles targetProfile ON target.UserId = targetProfile.UserId
      ORDER BY al.CreatedAt DESC, al.LogId DESC
    `);

  return result.recordset.map((row) => ({
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
}

module.exports = {
  create,
  listRecent,
};
