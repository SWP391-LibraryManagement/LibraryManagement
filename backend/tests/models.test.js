const models = require('../src/models');

describe('SQL Server model metadata', () => {
  test('exports one model per database table', () => {
    expect(Object.keys(models).sort()).toEqual([
      'AuditLog',
      'AuthToken',
      'Author',
      'Book',
      'BookCopy',
      'BorrowDetail',
      'BorrowRequest',
      'Category',
      'Fine',
      'Member',
      'MembershipApplication',
      'Notification',
      'NotificationAttempt',
      'NotificationTemplate',
      'Publisher',
      'Reservation',
      'Role',
      'User',
      'UserProfile',
      'UserRole',
    ]);
  });

  test('maps SQL Server column names to camelCase attributes', () => {
    expect(models.Book.mapRow({ BookId: 1, Title: 'Clean Code', ISBN: 'B1', Status: 'ACTIVE' })).toMatchObject({
      bookId: 1,
      title: 'Clean Code',
      isbn: 'B1',
      status: 'ACTIVE',
    });
  });

  test('keeps table and primary key metadata available for repositories', () => {
    expect(models.User.tableName).toBe('Users');
    expect(models.User.primaryKey).toBe('userId');
    expect(models.User.columnsByAttribute.email.name).toBe('Email');
    expect(models.UserRole.primaryKey).toEqual(['userId', 'roleId']);
  });
});
