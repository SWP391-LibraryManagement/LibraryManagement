const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'NotificationTemplate',
  tableName: 'NotificationTemplates',
  primaryKey: 'templateId',
  columns: [
    { attribute: 'templateId', name: 'TemplateId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'templateCode', name: 'TemplateCode', type: 'NVARCHAR(100)', required: true, unique: true },
    { attribute: 'subject', name: 'Subject', type: 'NVARCHAR(255)', required: true },
    { attribute: 'body', name: 'Body', type: 'NVARCHAR(MAX)', required: true },
    { attribute: 'status', name: 'Status', type: 'NVARCHAR(20)', required: true, default: 'ACTIVE', allowedValues: ['ACTIVE', 'INACTIVE'] },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'updatedAt', name: 'UpdatedAt', type: 'DATETIME', nullable: true },
  ],
});
