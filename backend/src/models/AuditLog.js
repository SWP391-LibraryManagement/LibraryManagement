const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'AuditLog',
  tableName: 'AuditLogs',
  primaryKey: 'logId',
  columns: [
    { attribute: 'logId', name: 'LogId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'userId', name: 'UserId', type: 'INT', nullable: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'action', name: 'Action', type: 'NVARCHAR(255)', required: true },
    { attribute: 'targetType', name: 'TargetType', type: 'NVARCHAR(100)', nullable: true },
    { attribute: 'targetId', name: 'TargetId', type: 'INT', nullable: true },
    { attribute: 'metadata', name: 'Metadata', type: 'NVARCHAR(MAX)', nullable: true },
    { attribute: 'ipAddress', name: 'IpAddress', type: 'NVARCHAR(50)', nullable: true },
    { attribute: 'userAgent', name: 'UserAgent', type: 'NVARCHAR(255)', nullable: true },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
  ],
});
