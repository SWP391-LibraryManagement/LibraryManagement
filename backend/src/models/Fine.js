const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'Fine',
  tableName: 'Fines',
  primaryKey: 'fineId',
  columns: [
    { attribute: 'fineId', name: 'FineId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'userId', name: 'UserId', type: 'INT', required: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'borrowDetailId', name: 'BorrowDetailId', type: 'INT', required: true, references: { table: 'BorrowDetails', column: 'BorrowDetailId' } },
    { attribute: 'overdueDays', name: 'OverdueDays', type: 'INT', required: true, default: 0 },
    { attribute: 'ratePerDay', name: 'RatePerDay', type: 'DECIMAL(10,2)', required: true, default: 5000 },
    { attribute: 'amount', name: 'Amount', type: 'DECIMAL(10,2)', required: true },
    { attribute: 'paidAmount', name: 'PaidAmount', type: 'DECIMAL(10,2)', required: true, default: 0 },
    { attribute: 'reason', name: 'Reason', type: 'NVARCHAR(255)', nullable: true },
    { attribute: 'status', name: 'Status', type: 'NVARCHAR(20)', required: true, default: 'UNPAID', allowedValues: ['UNPAID', 'PAID', 'WAIVED'] },
    { attribute: 'calculatedAt', name: 'CalculatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'paidAt', name: 'PaidAt', type: 'DATETIME', nullable: true },
    { attribute: 'createdBy', name: 'CreatedBy', type: 'INT', nullable: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'collectedBy', name: 'CollectedBy', type: 'INT', nullable: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'paymentMethod', name: 'PaymentMethod', type: 'NVARCHAR(50)', nullable: true },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'updatedAt', name: 'UpdatedAt', type: 'DATETIME', nullable: true },
  ],
});
