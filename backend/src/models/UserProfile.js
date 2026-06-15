const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'UserProfile',
  tableName: 'UserProfiles',
  primaryKey: 'profileId',
  columns: [
    { attribute: 'profileId', name: 'ProfileId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'userId', name: 'UserId', type: 'INT', required: true, unique: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'fullName', name: 'FullName', type: 'NVARCHAR(100)', nullable: true },
    { attribute: 'address', name: 'Address', type: 'NVARCHAR(255)', nullable: true },
    { attribute: 'dateOfBirth', name: 'DateOfBirth', type: 'DATE', nullable: true },
    { attribute: 'avatarUrl', name: 'AvatarUrl', type: 'NVARCHAR(255)', nullable: true },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'updatedAt', name: 'UpdatedAt', type: 'DATETIME', nullable: true },
  ],
});
