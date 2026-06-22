const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'AuthToken',
  tableName: 'AuthTokens',
  primaryKey: 'tokenId',
  columns: [
    { attribute: 'tokenId', name: 'TokenId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'userId', name: 'UserId', type: 'INT', required: true, references: { table: 'Users', column: 'UserId' } },
    {
      attribute: 'tokenType',
      name: 'TokenType',
      type: 'NVARCHAR(30)',
      required: true,
      allowedValues: ['REFRESH', 'PASSWORD_RESET', 'EMAIL_VERIFY', 'ACCOUNT_SETUP', 'CHANGE_PASSWORD_OTP'],
    },
    { attribute: 'tokenHash', name: 'TokenHash', type: 'NVARCHAR(255)', required: true },
    { attribute: 'expiresAt', name: 'ExpiresAt', type: 'DATETIME', required: true },
    { attribute: 'usedAt', name: 'UsedAt', type: 'DATETIME', nullable: true },
    { attribute: 'revokedAt', name: 'RevokedAt', type: 'DATETIME', nullable: true },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'createdByIp', name: 'CreatedByIp', type: 'NVARCHAR(50)', nullable: true },
  ],
  indexes: [
    { name: 'IX_AuthTokens_UserId_TokenType', columns: ['UserId', 'TokenType'] },
    { name: 'IX_AuthTokens_TokenHash', columns: ['TokenHash'] },
  ],
});
