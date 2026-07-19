const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'Publisher',
  tableName: 'Publishers',
  primaryKey: 'publisherId',
  columns: [
    { attribute: 'publisherId', name: 'PublisherId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'publisherName', name: 'PublisherName', type: 'NVARCHAR(100)', required: true, unique: true },
    { attribute: 'status', name: 'Status', type: 'NVARCHAR(20)', required: true, default: 'ACTIVE' },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
  ],
});
