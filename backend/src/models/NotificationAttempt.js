const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'NotificationAttempt',
  tableName: 'NotificationAttempts',
  primaryKey: 'attemptId',
  columns: [
    { attribute: 'attemptId', name: 'AttemptId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'notificationId', name: 'NotificationId', type: 'INT', required: true, references: { table: 'Notifications', column: 'NotificationId' } },
    { attribute: 'attemptedAt', name: 'AttemptedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'status', name: 'Status', type: 'NVARCHAR(20)', required: true, allowedValues: ['SENT', 'FAILED'] },
    { attribute: 'safeErrorMessage', name: 'SafeErrorMessage', type: 'NVARCHAR(500)', nullable: true },
    { attribute: 'providerMessageId', name: 'ProviderMessageId', type: 'NVARCHAR(255)', nullable: true },
  ],
});
