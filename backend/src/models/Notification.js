const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'Notification',
  tableName: 'Notifications',
  primaryKey: 'notificationId',
  columns: [
    { attribute: 'notificationId', name: 'NotificationId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'templateId', name: 'TemplateId', type: 'INT', nullable: true, references: { table: 'NotificationTemplates', column: 'TemplateId' } },
    { attribute: 'userId', name: 'UserId', type: 'INT', nullable: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'recipientEmail', name: 'RecipientEmail', type: 'NVARCHAR(100)', required: true },
    { attribute: 'channel', name: 'Channel', type: 'NVARCHAR(20)', required: true, default: 'EMAIL', allowedValues: ['EMAIL'] },
    { attribute: 'status', name: 'Status', type: 'NVARCHAR(20)', required: true, default: 'PENDING', allowedValues: ['PENDING', 'SENT', 'FAILED', 'CANCELLED'] },
    { attribute: 'sourceFeature', name: 'SourceFeature', type: 'NVARCHAR(20)', nullable: true },
    { attribute: 'sourceEntityType', name: 'SourceEntityType', type: 'NVARCHAR(50)', nullable: true },
    { attribute: 'sourceEntityId', name: 'SourceEntityId', type: 'INT', nullable: true },
    { attribute: 'safePayload', name: 'SafePayload', type: 'NVARCHAR(MAX)', nullable: true },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'sentAt', name: 'SentAt', type: 'DATETIME', nullable: true },
  ],
});
