const { sql, getPool } = require('../config/db');

async function createNotification({ userId, recipientEmail, templateCode, sourceFeature, safePayload }) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId || null)
    .input('RecipientEmail', sql.NVarChar(100), recipientEmail)
    .input('TemplateCode', sql.NVarChar(100), templateCode)
    .input('SourceFeature', sql.NVarChar(20), sourceFeature || null)
    .input('SafePayload', sql.NVarChar(sql.MAX), safePayload ? JSON.stringify(safePayload) : null)
    .query(`
      INSERT INTO Notifications (TemplateId, UserId, RecipientEmail, SourceFeature, SafePayload)
      SELECT TemplateId, @UserId, @RecipientEmail, @SourceFeature, @SafePayload
      FROM NotificationTemplates
      WHERE TemplateCode = @TemplateCode
    `);

  return result.rowsAffected?.[0] || 0;
}

module.exports = {
  createNotification,
};
