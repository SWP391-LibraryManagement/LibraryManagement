const defineModel = require('./defineModel');

module.exports = defineModel({
  tableName: 'Users',
  primaryKey: 'userId',
  columns: [
    {
      attribute: 'userId',
      name: 'UserId',
    },
    {
      attribute: 'username',
      name: 'Username',
    },
    {
      attribute: 'email',
      name: 'Email',
    },
    {
      attribute: 'passwordHash',
      name: 'PasswordHash',
    },
    {
      attribute: 'phone',
      name: 'Phone',
    },
    {
      attribute: 'status',
      name: 'Status',
    },
    {
      attribute: 'emailVerifiedAt',
      name: 'EmailVerifiedAt',
    },
    {
      attribute: 'failedLoginCount',
      name: 'FailedLoginCount',
    },
    {
      attribute: 'lockedUntil',
      name: 'LockedUntil',
    },
    {
      attribute: 'lastLoginAt',
      name: 'LastLoginAt',
    },
    {
      attribute: 'createdAt',
      name: 'CreatedAt',
    },
    {
      attribute: 'updatedAt',
      name: 'UpdatedAt',
    },
  ],
});