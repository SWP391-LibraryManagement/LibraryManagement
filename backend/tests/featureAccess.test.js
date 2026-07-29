describe('featureAccess', () => {
  const loadSubject = () => require('../src/utils/featureAccess');

  afterEach(() => {
    jest.resetModules();
  });

  test('normalizes roles without changing the existing whitespace behavior', () => {
    const { normalizeRole } = loadSubject();

    expect(normalizeRole('librarian')).toBe('LIBRARIAN');
    expect(normalizeRole(' librarian ')).toBe(' LIBRARIAN ');
    expect(normalizeRole(null)).toBe('');
  });

  test('checks whether a user has any allowed role case-insensitively', () => {
    const { hasAnyRole } = loadSubject();

    expect(hasAnyRole({ roles: ['member', 'librarian'] }, ['ADMIN', 'LIBRARIAN'])).toBe(true);
    expect(hasAnyRole({ roles: ['member'] }, ['ADMIN', 'LIBRARIAN'])).toBe(false);
    expect(hasAnyRole(null, ['MEMBER'])).toBe(false);
  });

  test('converts positive integer identifiers and preserves validation errors', () => {
    const { toPositiveInteger } = loadSubject();

    expect(toPositiveInteger('12', 'copyId')).toBe(12);

    let caughtError;
    try {
      toPositiveInteger(0, 'copyId');
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toMatchObject({
      statusCode: 400,
      code: 'INVALID_ID',
      message: 'copyId must be a positive integer.',
    });
  });
});
