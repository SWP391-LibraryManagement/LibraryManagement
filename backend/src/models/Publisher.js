const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'Publisher',
  tableName: 'Publishers',
  primaryKey: 'publisherId',
  columns: [
    { attribute: 'publisherId', name: 'PublisherId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'publisherName', name: 'PublisherName', type: 'NVARCHAR(100)', required: true, unique: true },
  ],
});
