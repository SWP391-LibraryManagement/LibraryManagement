const { sql, getPool } = require('../config/db');

function mapTemplate(row) {
  if (!row) {
    return null;
  }

  return {
    templateId: row.TemplateId,
    templateCode: row.TemplateCode,
    subject: row.Subject,
    body: row.Body,
    status: row.Status,
  };
}

function mapNotification(row) {
  if (!row) {
    return null;
  }

  return {
    notificationId: row.NotificationId,
    type: row.NotificationType,
    channel: row.Channel,
    userId: row.UserId,
    recipientEmail: row.RecipientEmail,
    templateId: row.TemplateId,
    status: row.Status,
    sourceFeature: row.SourceFeature,
    sourceEntityType: row.SourceEntityType,
    sourceEntityId: row.SourceEntityId,
    idempotencyKey: row.IdempotencyKey,
    title: row.Title,
    body: row.Body,
    safePayload: row.SafePayload ? JSON.parse(row.SafePayload) : null,
    attemptCount: row.AttemptCount,
    lastErrorMessage: row.LastErrorMessage,
    createdAt: row.CreatedAt,
    sentAt: row.SentAt,
  };
}

async function findTemplateByCode(templateCode) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('TemplateCode', sql.NVarChar(100), templateCode)
    .query(`
      SELECT TOP 1 TemplateId, TemplateCode, Subject, Body, Status
      FROM NotificationTemplates
      WHERE TemplateCode = @TemplateCode
    `);

  return mapTemplate(result.recordset[0]);
}

async function findActiveByIdempotencyKey(idempotencyKey) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('IdempotencyKey', sql.NVarChar(100), idempotencyKey)
    .query(`
      SELECT TOP 1 *
      FROM Notifications
      WHERE IdempotencyKey = @IdempotencyKey
        AND Status IN ('PENDING', 'SENT', 'DELIVERED')
      ORDER BY CreatedAt DESC
    `);

  return mapNotification(result.recordset[0]);
}

async function createRequest({
  type,
  channel,
  userId,
  recipientEmail,
  templateId,
  templateKey,
  title,
  body,
  sourceFeature,
  sourceEntityType,
  sourceEntityId,
  idempotencyKey,
  safePayload,
}) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('NotificationType', sql.NVarChar(50), type)
    .input('Channel', sql.NVarChar(20), channel)
    .input('UserId', sql.Int, userId || null)
    .input('RecipientEmail', sql.NVarChar(100), recipientEmail)
    .input('TemplateId', sql.Int, templateId)
    .input('TemplateKey', sql.NVarChar(100), templateKey)
    .input('Title', sql.NVarChar(255), title || null)
    .input('Body', sql.NVarChar(sql.MAX), body || null)
    .input('SourceFeature', sql.NVarChar(20), sourceFeature || null)
    .input('SourceEntityType', sql.NVarChar(50), sourceEntityType || null)
    .input('SourceEntityId', sql.Int, sourceEntityId || null)
    .input('IdempotencyKey', sql.NVarChar(100), idempotencyKey || null)
    .input('SafePayload', sql.NVarChar(sql.MAX), safePayload ? JSON.stringify(safePayload) : null)
    .query(`
      INSERT INTO Notifications (
        NotificationType,
        Channel,
        UserId,
        RecipientEmail,
        TemplateId,
        TemplateKey,
        Title,
        Body,
        SourceFeature,
        SourceEntityType,
        SourceEntityId,
        IdempotencyKey,
        SafePayload
      )
      OUTPUT INSERTED.*
      VALUES (
        @NotificationType,
        @Channel,
        @UserId,
        @RecipientEmail,
        @TemplateId,
        @TemplateKey,
        @Title,
        @Body,
        @SourceFeature,
        @SourceEntityType,
        @SourceEntityId,
        @IdempotencyKey,
        @SafePayload
      )
    `);

  return mapNotification(result.recordset[0]);
}

async function createNotification({
  userId,
  recipientEmail,
  templateCode,
  sourceFeature,
  sourceEntityType,
  sourceEntityId,
  safePayload,
}) {
  const template = await findTemplateByCode(templateCode);

  if (!template) {
    return null;
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId || null)
    .input('RecipientEmail', sql.NVarChar(100), recipientEmail)
    .input('TemplateId', sql.Int, template.templateId)
    .input('TemplateKey', sql.NVarChar(100), templateCode)
    .input('Title', sql.NVarChar(255), template.subject)
    .input('Body', sql.NVarChar(sql.MAX), template.body)
    .input('SourceFeature', sql.NVarChar(20), sourceFeature || null)
    .input('SourceEntityType', sql.NVarChar(50), sourceEntityType || null)
    .input('SourceEntityId', sql.Int, sourceEntityId || null)
    .input('SafePayload', sql.NVarChar(sql.MAX), safePayload ? JSON.stringify(safePayload) : null)
    .query(`
      INSERT INTO Notifications (
        TemplateId,
        UserId,
        RecipientEmail,
        TemplateKey,
        Title,
        Body,
        SourceFeature,
        SourceEntityType,
        SourceEntityId,
        SafePayload
      )
      OUTPUT INSERTED.*
      VALUES (
        @TemplateId,
        @UserId,
        @RecipientEmail,
        @TemplateKey,
        @Title,
        @Body,
        @SourceFeature,
        @SourceEntityType,
        @SourceEntityId,
        @SafePayload
      )
    `);

  return mapNotification(result.recordset[0]);
}

async function listPending(limit = 20) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Limit', sql.Int, limit)
    .query(`
      SELECT TOP (@Limit) *
      FROM Notifications
      WHERE Status = 'PENDING'
      ORDER BY CreatedAt ASC, NotificationId ASC
    `);

  return result.recordset.map(mapNotification);
}

async function markSent({ notificationId, providerMessageId }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const result = await new sql.Request(transaction)
      .input('NotificationId', sql.Int, notificationId)
      .query(`
        UPDATE Notifications
        SET Status = 'SENT',
            SentAt = GETDATE(),
            AttemptCount = AttemptCount + 1,
            LastErrorMessage = NULL
        OUTPUT INSERTED.*
        WHERE NotificationId = @NotificationId
      `);

    await new sql.Request(transaction)
      .input('NotificationId', sql.Int, notificationId)
      .input('ProviderMessageId', sql.NVarChar(255), providerMessageId || null)
      .query(`
        INSERT INTO NotificationAttempts (NotificationId, Status, ProviderMessageId)
        VALUES (@NotificationId, 'SENT', @ProviderMessageId)
      `);

    await transaction.commit();
    return mapNotification(result.recordset[0]);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function markFailed({ notificationId, safeErrorMessage }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const result = await new sql.Request(transaction)
      .input('NotificationId', sql.Int, notificationId)
      .input('SafeErrorMessage', sql.NVarChar(500), safeErrorMessage)
      .query(`
        UPDATE Notifications
        SET Status = 'FAILED',
            AttemptCount = AttemptCount + 1,
            LastErrorMessage = @SafeErrorMessage
        OUTPUT INSERTED.*
        WHERE NotificationId = @NotificationId
      `);

    await new sql.Request(transaction)
      .input('NotificationId', sql.Int, notificationId)
      .input('SafeErrorMessage', sql.NVarChar(500), safeErrorMessage)
      .query(`
        INSERT INTO NotificationAttempts (NotificationId, Status, SafeErrorMessage)
        VALUES (@NotificationId, 'FAILED', @SafeErrorMessage)
      `);

    await transaction.commit();
    return mapNotification(result.recordset[0]);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  findTemplateByCode,
  findActiveByIdempotencyKey,
  createRequest,
  createNotification,
  listPending,
  markSent,
  markFailed,
};
