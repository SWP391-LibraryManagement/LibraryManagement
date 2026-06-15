const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'BookCopy',
  tableName: 'BookCopies',
  primaryKey: 'copyId',
  columns: [
    { attribute: 'copyId', name: 'CopyId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'bookId', name: 'BookId', type: 'INT', required: true, references: { table: 'Books', column: 'BookId' } },
    { attribute: 'barcode', name: 'Barcode', type: 'NVARCHAR(100)', required: true, unique: true },
    {
      attribute: 'status',
      name: 'Status',
      type: 'NVARCHAR(20)',
      required: true,
      default: 'AVAILABLE',
      allowedValues: ['AVAILABLE', 'BORROWED', 'RESERVED', 'DAMAGED', 'LOST', 'INACTIVE'],
    },
    { attribute: 'location', name: 'Location', type: 'NVARCHAR(100)', nullable: true },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'updatedAt', name: 'UpdatedAt', type: 'DATETIME', nullable: true },
  ],
});
