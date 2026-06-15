const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'UserRole',
  tableName: 'UserRoles',
  primaryKey: ['userId', 'roleId'],
  columns: [
    { attribute: 'userId', name: 'UserId', type: 'INT', primaryKey: true, required: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'roleId', name: 'RoleId', type: 'INT', primaryKey: true, required: true, references: { table: 'Roles', column: 'RoleId' } },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
  ],
});
