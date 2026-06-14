const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'MembershipApplication',
  tableName: 'MembershipApplications',
  primaryKey: 'applicationId',
  columns: [
    { attribute: 'applicationId', name: 'ApplicationId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'userId', name: 'UserId', type: 'INT', required: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'status', name: 'Status', type: 'NVARCHAR(20)', required: true, default: 'PENDING', allowedValues: ['PENDING', 'APPROVED', 'REJECTED'] },
    { attribute: 'appliedAt', name: 'AppliedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'approvedAt', name: 'ApprovedAt', type: 'DATETIME', nullable: true },
    { attribute: 'reviewedBy', name: 'ReviewedBy', type: 'INT', nullable: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'reviewNote', name: 'ReviewNote', type: 'NVARCHAR(500)', nullable: true },
  ],
});
