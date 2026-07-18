const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'Author',
  tableName: 'Authors',
  primaryKey: 'authorId',
  columns: [
    { attribute: 'authorId', name: 'AuthorId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'authorName', name: 'AuthorName', type: 'NVARCHAR(100)', required: true, unique: true },
    { attribute: 'status', name: 'Status', type: 'NVARCHAR(20)', required: true, default: 'ACTIVE' },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
  ],
});
