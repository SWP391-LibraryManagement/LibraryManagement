const { sql, getPool } = require('../config/db');

async function create({ userId, action, targetType, targetId, metadata, ipAddress, userAgent }) {
  const pool = await getPool();
  await pool
    .request()
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

module.exports = {
  create,
};
