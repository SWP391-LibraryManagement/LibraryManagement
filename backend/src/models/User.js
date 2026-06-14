const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'User',
  tableName: 'Users',
  primaryKey: 'userId',
  columns: [
    { attribute: 'userId', name: 'UserId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'username', name: 'Username', type: 'NVARCHAR(50)', required: true, unique: true },
    { attribute: 'email', name: 'Email', type: 'NVARCHAR(100)', required: true, unique: true },
    { attribute: 'passwordHash', name: 'PasswordHash', type: 'NVARCHAR(255)', required: true },
    { attribute: 'phone', name: 'Phone', type: 'NVARCHAR(20)', nullable: true },
    { attribute: 'status', name: 'Status', type: 'NVARCHAR(20)', required: true, default: 'ACTIVE', allowedValues: ['ACTIVE', 'INACTIVE', 'LOCKED'] },
    { attribute: 'emailVerifiedAt', name: 'EmailVerifiedAt', type: 'DATETIME', nullable: true },
    { attribute: 'failedLoginCount', name: 'FailedLoginCount', type: 'INT', required: true, default: 0 },
    { attribute: 'lockedUntil', name: 'LockedUntil', type: 'DATETIME', nullable: true },
    { attribute: 'lastLoginAt', name: 'LastLoginAt', type: 'DATETIME', nullable: true },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'updatedAt', name: 'UpdatedAt', type: 'DATETIME', nullable: true },
  ],
});