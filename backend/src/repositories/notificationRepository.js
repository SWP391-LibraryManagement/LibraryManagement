const { sql, getPool } = require('../config/db');

let notificationColumnsPromise;

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
    templateKey: row.TemplateKey,
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

async function getNotificationColumns(pool) {
  if (!notificationColumnsPromise) {
    notificationColumnsPromise = pool
      .request()
      .query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'Notifications'
      `)
      .then((result) => new Set(result.recordset.map((row) => row.COLUMN_NAME)));
  }

  return notificationColumnsPromise;
}

async function insertNotification(pool, fieldDefinitions) {
  const columns = await getNotificationColumns(pool);
  const includedFields = fieldDefinitions.filter((field) => columns.has(field.column));
  const request = pool.request();

  includedFields.forEach((field) => {
    request.input(field.param, field.type, field.value);
  });

  const result = await request.query(`
    INSERT INTO Notifications (
      ${includedFields.map((field) => field.column).join(',\n      ')}
    )
    OUTPUT INSERTED.*
    VALUES (
      ${includedFields.map((field) => `@${field.param}`).join(',\n      ')}
    )
  `);

  return mapNotification(result.recordset[0]);
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

async function findByIdempotencyKey(idempotencyKey) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('IdempotencyKey', sql.NVarChar(100), idempotencyKey)
    .query(`
      SELECT TOP 1 *
      FROM Notifications
      WHERE IdempotencyKey = @IdempotencyKey
      ORDER BY CreatedAt DESC
    `);

  return mapNotification(result.recordset[0]);
}

async function findById(notificationId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('NotificationId', sql.Int, notificationId)
    .query(`
      SELECT TOP 1 *
      FROM Notifications
      WHERE NotificationId = @NotificationId
    `);

  return mapNotification(result.recordset[0]);
}

async function transitionFailedToPending(notificationId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('NotificationId', sql.Int, notificationId)
    .query(`
      UPDATE Notifications
      SET Status = 'PENDING',
          LastErrorMessage = NULL,
          SentAt = NULL
      OUTPUT INSERTED.*
      WHERE NotificationId = @NotificationId
        AND Status = 'FAILED'
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
  return insertNotification(pool, [
    { column: 'NotificationType', param: 'NotificationType', type: sql.NVarChar(50), value: type },
    { column: 'Channel', param: 'Channel', type: sql.NVarChar(20), value: channel },
    { column: 'UserId', param: 'UserId', type: sql.Int, value: userId || null },
    { column: 'RecipientEmail', param: 'RecipientEmail', type: sql.NVarChar(255), value: recipientEmail },
    { column: 'TemplateId', param: 'TemplateId', type: sql.Int, value: templateId },
    { column: 'TemplateKey', param: 'TemplateKey', type: sql.NVarChar(100), value: templateKey },
    { column: 'Title', param: 'Title', type: sql.NVarChar(255), value: title || null },
    { column: 'Body', param: 'Body', type: sql.NVarChar(sql.MAX), value: body || null },
    { column: 'SourceFeature', param: 'SourceFeature', type: sql.NVarChar(20), value: sourceFeature || null },
    { column: 'SourceEntityType', param: 'SourceEntityType', type: sql.NVarChar(50), value: sourceEntityType || null },
    { column: 'SourceEntityId', param: 'SourceEntityId', type: sql.Int, value: sourceEntityId || null },
    { column: 'IdempotencyKey', param: 'IdempotencyKey', type: sql.NVarChar(100), value: idempotencyKey || null },
    {
      column: 'SafePayload',
      param: 'SafePayload',
      type: sql.NVarChar(sql.MAX),
      value: safePayload ? JSON.stringify(safePayload) : null,
    },
  ]);
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
    return 0;
  }

  const pool = await getPool();
  return insertNotification(pool, [
    { column: 'TemplateId', param: 'TemplateId', type: sql.Int, value: template.templateId },
    { column: 'UserId', param: 'UserId', type: sql.Int, value: userId || null },
    { column: 'RecipientEmail', param: 'RecipientEmail', type: sql.NVarChar(255), value: recipientEmail },
    { column: 'TemplateKey', param: 'TemplateKey', type: sql.NVarChar(100), value: templateCode },
    { column: 'Title', param: 'Title', type: sql.NVarChar(255), value: template.subject },
    { column: 'Body', param: 'Body', type: sql.NVarChar(sql.MAX), value: template.body },
    { column: 'SourceFeature', param: 'SourceFeature', type: sql.NVarChar(20), value: sourceFeature || null },
    { column: 'SourceEntityType', param: 'SourceEntityType', type: sql.NVarChar(50), value: sourceEntityType || null },
    { column: 'SourceEntityId', param: 'SourceEntityId', type: sql.Int, value: sourceEntityId || null },
    {
      column: 'SafePayload',
      param: 'SafePayload',
      type: sql.NVarChar(sql.MAX),
      value: safePayload ? JSON.stringify(safePayload) : null,
    },
  ]);
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
        AND (NotificationType IS NULL OR NotificationType NOT IN ('ACCOUNT_VERIFICATION', 'PASSWORD_RESET', 'EMAIL_VERIFY'))
        AND (TemplateKey IS NULL OR TemplateKey NOT IN ('ACCOUNT_VERIFICATION', 'PASSWORD_RESET', 'EMAIL_VERIFY'))
      ORDER BY CreatedAt ASC, NotificationId ASC
    `);

  return result.recordset.map(mapNotification);
}

async function claimNextPending() {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const result = await new sql.Request(transaction).query(`
      SELECT TOP 1 *
      FROM Notifications WITH (UPDLOCK, READPAST, HOLDLOCK, ROWLOCK)
      WHERE Status = 'PENDING'
        AND (NotificationType IS NULL OR NotificationType NOT IN ('ACCOUNT_VERIFICATION', 'PASSWORD_RESET', 'ACCOUNT_SETUP', 'EMAIL_VERIFY'))
        AND (TemplateKey IS NULL OR TemplateKey NOT IN ('ACCOUNT_VERIFICATION', 'PASSWORD_RESET', 'ACCOUNT_SETUP', 'EMAIL_VERIFY'))
      ORDER BY CreatedAt ASC, NotificationId ASC
    `);
    const notification = mapNotification(result.recordset[0]);

    if (!notification) {
      await transaction.rollback();
      return null;
    }

    return { notification, transaction };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function markClaimSent({ claim, providerMessageId }) {
  try {
    const result = await new sql.Request(claim.transaction)
      .input('NotificationId', sql.Int, claim.notification.notificationId)
      .query(`
        UPDATE Notifications
        SET Status = 'SENT',
            SentAt = GETDATE(),
            AttemptCount = AttemptCount + 1,
            LastErrorMessage = NULL
        OUTPUT INSERTED.*
        WHERE NotificationId = @NotificationId
          AND Status = 'PENDING'
      `);

    if (!result.recordset.length) {
      throw new Error('Claimed notification is no longer pending.');
    }

    await new sql.Request(claim.transaction)
      .input('NotificationId', sql.Int, claim.notification.notificationId)
      .input('ProviderMessageId', sql.NVarChar(255), providerMessageId || null)
      .query(`
        INSERT INTO NotificationAttempts (NotificationId, Status, ProviderMessageId)
        VALUES (@NotificationId, 'SENT', @ProviderMessageId)
      `);

    await claim.transaction.commit();
    return mapNotification(result.recordset[0]);
  } catch (error) {
    await claim.transaction.rollback();
    throw error;
  }
}

async function markClaimFailed({ claim, safeErrorMessage }) {
  try {
    const result = await new sql.Request(claim.transaction)
      .input('NotificationId', sql.Int, claim.notification.notificationId)
      .input('SafeErrorMessage', sql.NVarChar(500), safeErrorMessage)
      .query(`
        UPDATE Notifications
        SET Status = 'FAILED',
            AttemptCount = AttemptCount + 1,
            LastErrorMessage = @SafeErrorMessage
        OUTPUT INSERTED.*
        WHERE NotificationId = @NotificationId
          AND Status = 'PENDING'
      `);

    if (!result.recordset.length) {
      throw new Error('Claimed notification is no longer pending.');
    }

    await new sql.Request(claim.transaction)
      .input('NotificationId', sql.Int, claim.notification.notificationId)
      .input('SafeErrorMessage', sql.NVarChar(500), safeErrorMessage)
      .query(`
        INSERT INTO NotificationAttempts (NotificationId, Status, SafeErrorMessage)
        VALUES (@NotificationId, 'FAILED', @SafeErrorMessage)
      `);

    await claim.transaction.commit();
    return mapNotification(result.recordset[0]);
  } catch (error) {
    await claim.transaction.rollback();
    throw error;
  }
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
  findByIdempotencyKey,
  findById,
  transitionFailedToPending,
  createRequest,
  createNotification,
  listPending,
  claimNextPending,
  markClaimSent,
  markClaimFailed,
  markSent,
  markFailed,
};
