const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'Book',
  tableName: 'Books',
  primaryKey: 'bookId',
  columns: [
    { attribute: 'bookId', name: 'BookId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'title', name: 'Title', type: 'NVARCHAR(255)', required: true },
    { attribute: 'isbn', name: 'ISBN', type: 'NVARCHAR(50)', nullable: true, uniqueWhenNotNull: true },
    { attribute: 'categoryId', name: 'CategoryId', type: 'INT', nullable: true, references: { table: 'Categories', column: 'CategoryId' } },
    { attribute: 'authorId', name: 'AuthorId', type: 'INT', nullable: true, references: { table: 'Authors', column: 'AuthorId' } },
    { attribute: 'publisherId', name: 'PublisherId', type: 'INT', nullable: true, references: { table: 'Publishers', column: 'PublisherId' } },
    { attribute: 'publishYear', name: 'PublishYear', type: 'INT', nullable: true },
    { attribute: 'description', name: 'Description', type: 'NVARCHAR(MAX)', nullable: true },
    { attribute: 'coverUrl', name: 'CoverUrl', type: 'NVARCHAR(255)', nullable: true },
    { attribute: 'status', name: 'Status', type: 'NVARCHAR(20)', required: true, default: 'ACTIVE', allowedValues: ['ACTIVE', 'INACTIVE'] },
    { attribute: 'createdBy', name: 'CreatedBy', type: 'INT', nullable: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'updatedBy', name: 'UpdatedBy', type: 'INT', nullable: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'updatedAt', name: 'UpdatedAt', type: 'DATETIME', nullable: true },
  ],
  indexes: [{ name: 'UX_Books_ISBN_NotNull', columns: ['ISBN'], unique: true, filter: 'ISBN IS NOT NULL' }],
});
