const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'BorrowDetail',
  tableName: 'BorrowDetails',
  primaryKey: 'borrowDetailId',
  columns: [
    { attribute: 'borrowDetailId', name: 'BorrowDetailId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'requestId', name: 'RequestId', type: 'INT', required: true, references: { table: 'BorrowRequests', column: 'RequestId' } },
    { attribute: 'copyId', name: 'CopyId', type: 'INT', required: true, references: { table: 'BookCopies', column: 'CopyId' } },
    { attribute: 'borrowDate', name: 'BorrowDate', type: 'DATE', nullable: true },
    { attribute: 'dueDate', name: 'DueDate', type: 'DATE', required: true },
    { attribute: 'returnDate', name: 'ReturnDate', type: 'DATE', nullable: true },
    { attribute: 'renewalCount', name: 'RenewalCount', type: 'INT', required: true, default: 0 },
    { attribute: 'status', name: 'Status', type: 'NVARCHAR(20)', required: true, default: 'BORROWED', allowedValues: ['BORROWED', 'RETURNED', 'OVERDUE', 'LOST'] },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'updatedAt', name: 'UpdatedAt', type: 'DATETIME', nullable: true },
  ],
});
