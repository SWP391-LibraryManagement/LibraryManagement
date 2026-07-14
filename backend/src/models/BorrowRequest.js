const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'BorrowRequest',
  tableName: 'BorrowRequests',
  primaryKey: 'requestId',
  columns: [
    { attribute: 'requestId', name: 'RequestId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'userId', name: 'UserId', type: 'INT', required: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'requestDate', name: 'RequestDate', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'status', name: 'Status', type: 'NVARCHAR(20)', required: true, default: 'PENDING', allowedValues: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'] },
    { attribute: 'createdBy', name: 'CreatedBy', type: 'INT', nullable: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'approvedBy', name: 'ApprovedBy', type: 'INT', nullable: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'approvedAt', name: 'ApprovedAt', type: 'DATETIME', nullable: true },
    { attribute: 'rejectedAt', name: 'RejectedAt', type: 'DATETIME', nullable: true },
    { attribute: 'processedAt', name: 'ProcessedAt', type: 'DATETIME', nullable: true },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'updatedAt', name: 'UpdatedAt', type: 'DATETIME', nullable: true },
  ],
});
