const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'Member',
  tableName: 'Members',
  primaryKey: 'memberId',
  columns: [
    { attribute: 'memberId', name: 'MemberId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'userId', name: 'UserId', type: 'INT', required: true, unique: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'status', name: 'Status', type: 'NVARCHAR(20)', required: true, default: 'PENDING', allowedValues: ['PENDING', 'APPROVED', 'REJECTED', 'INACTIVE'] },
    { attribute: 'approvedAt', name: 'ApprovedAt', type: 'DATETIME', nullable: true },
    { attribute: 'approvedBy', name: 'ApprovedBy', type: 'INT', nullable: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'updatedAt', name: 'UpdatedAt', type: 'DATETIME', nullable: true },
  ],
});
