const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'Author',
  tableName: 'Authors',
  primaryKey: 'authorId',
  columns: [
    { attribute: 'authorId', name: 'AuthorId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'authorName', name: 'AuthorName', type: 'NVARCHAR(100)', required: true, unique: true },
  ],
});
