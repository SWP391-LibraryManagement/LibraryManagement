const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'Category',
  tableName: 'Categories',
  primaryKey: 'categoryId',
  columns: [
    { attribute: 'categoryId', name: 'CategoryId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'categoryName', name: 'CategoryName', type: 'NVARCHAR(100)', required: true, unique: true },
  ],
});
