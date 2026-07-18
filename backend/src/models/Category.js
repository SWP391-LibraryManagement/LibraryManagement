const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'Category',
  tableName: 'Categories',
  primaryKey: 'categoryId',
  columns: [
    { attribute: 'categoryId', name: 'CategoryId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'categoryName', name: 'CategoryName', type: 'NVARCHAR(100)', required: true, unique: true },
    { attribute: 'status', name: 'Status', type: 'NVARCHAR(20)', required: true, default: 'ACTIVE' },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
  ],
});
