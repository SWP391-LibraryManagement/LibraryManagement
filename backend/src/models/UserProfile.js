const defineModel = require('./defineModel');

module.exports = defineModel({
  tableName: 'UserProfiles',
  primaryKey: 'profileId',
  columns: [
    {
      attribute: 'profileId',
      name: 'ProfileId',
    },
    {
      attribute: 'userId',
      name: 'UserId',
    },
    {
      attribute: 'fullName',
      name: 'FullName',
    },
    {
      attribute: 'address',
      name: 'Address',
    },
    {
      attribute: 'dateOfBirth',
      name: 'DateOfBirth',
    },
    {
      attribute: 'avatarUrl',
      name: 'AvatarUrl',
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
