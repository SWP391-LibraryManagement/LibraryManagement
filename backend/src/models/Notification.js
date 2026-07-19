const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'Notification',
  tableName: 'Notifications',
  primaryKey: 'notificationId',
  columns: [
    { attribute: 'notificationId', name: 'NotificationId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'type', name: 'NotificationType', type: 'NVARCHAR(50)', nullable: true, allowedValues: ['ACCOUNT_VERIFICATION', 'PASSWORD_RESET', 'ACCOUNT_SETUP', 'RESERVATION_AVAILABLE', 'DUE_DATE_REMINDER', 'OVERDUE_NOTICE', 'FINE_NOTICE', 'GENERAL_SYSTEM'] },
    { attribute: 'templateId', name: 'TemplateId', type: 'INT', nullable: true, references: { table: 'NotificationTemplates', column: 'TemplateId' } },
    { attribute: 'templateKey', name: 'TemplateKey', type: 'NVARCHAR(100)', nullable: true },
    { attribute: 'userId', name: 'UserId', type: 'INT', nullable: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'recipientEmail', name: 'RecipientEmail', type: 'NVARCHAR(255)', required: true },
    { attribute: 'channel', name: 'Channel', type: 'NVARCHAR(20)', required: true, default: 'EMAIL', allowedValues: ['EMAIL'] },
    { attribute: 'status', name: 'Status', type: 'NVARCHAR(20)', required: true, default: 'PENDING', allowedValues: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'SKIPPED', 'CANCELLED'] },
    { attribute: 'title', name: 'Title', type: 'NVARCHAR(255)', nullable: true },
    { attribute: 'body', name: 'Body', type: 'NVARCHAR(MAX)', nullable: true },
    { attribute: 'sourceFeature', name: 'SourceFeature', type: 'NVARCHAR(20)', nullable: true },
    { attribute: 'sourceEntityType', name: 'SourceEntityType', type: 'NVARCHAR(50)', nullable: true },
    { attribute: 'sourceEntityId', name: 'SourceEntityId', type: 'INT', nullable: true },
    { attribute: 'idempotencyKey', name: 'IdempotencyKey', type: 'NVARCHAR(100)', nullable: true },
    { attribute: 'safePayload', name: 'SafePayload', type: 'NVARCHAR(MAX)', nullable: true },
    { attribute: 'attemptCount', name: 'AttemptCount', type: 'INT', required: true, default: 0 },
    { attribute: 'lastErrorMessage', name: 'LastErrorMessage', type: 'NVARCHAR(500)', nullable: true },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'sentAt', name: 'SentAt', type: 'DATETIME', nullable: true },
  ],
});
