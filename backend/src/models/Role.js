const defineModel = require('./defineModel');

module.exports = defineModel({
  tableName: 'Roles',
  primaryKey: 'roleId',
  columns: [
    {
      attribute: 'roleId',
      name: 'RoleId',
    },
    {
      attribute: 'roleName',
      name: 'RoleName',
    },
  ],
});
