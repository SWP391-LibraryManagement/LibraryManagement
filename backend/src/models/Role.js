const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'Role',
  tableName: 'Roles',
  primaryKey: 'roleId',
  columns: [
    { attribute: 'roleId', name: 'RoleId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'roleName', name: 'RoleName', type: 'NVARCHAR(50)', required: true, unique: true, allowedValues: ['ADMIN', 'LIBRARIAN', 'MEMBER', 'GUEST'] },
  ],
});
