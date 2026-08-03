const {
  CLEANUP_SQL,
  DISCOVERY_SQL,
  buildSyntheticIsbn,
  parseArguments,
  runCleanup,
  validateRunId,
} = require('../scripts/cleanupStagingAcceptanceData');

const RUN_ID = 'lms-acceptance-20260802-2e3a025d';

function makePool(rows) {
  const queries = [];
  return {
    queries,
    request() {
      return {
        input() {
          return this;
        },
        async query(query) {
          queries.push(query);
          return { recordset: rows };
        },
      };
    },
  };
}

describe('staging acceptance cleanup operator', () => {
  test('defaults to dry-run and validates exact run identifiers', () => {
    expect(parseArguments([])).toEqual({ execute: false, runId: null });
    expect(parseArguments(['--run-id', RUN_ID, '--execute'])).toEqual({
      execute: true,
      runId: RUN_ID,
    });
    expect(validateRunId(RUN_ID)).toBe(true);
    expect(validateRunId('1984')).toBe(false);
    expect(buildSyntheticIsbn(RUN_ID)).toBe('ACC-2e3a025d');
  });

  test('rejects unknown or incomplete command arguments', () => {
    expect(() => parseArguments(['--force'])).toThrow('Unknown argument: --force');
    expect(() => parseArguments(['--run-id'])).toThrow('--run-id requires a value.');
    expect(() => parseArguments(['--run-id', '1984'])).toThrow('Invalid acceptance run ID.');
  });

  test('cleanup SQL is staging-only and deletes children before parents', () => {
    expect(CLEANUP_SQL).toContain("DB_NAME() <> 'LibraryManagementStaging'");
    expect(CLEANUP_SQL).toContain('DELETE FROM NotificationAttempts');
    expect(CLEANUP_SQL.indexOf('DELETE FROM NotificationAttempts'))
      .toBeLessThan(CLEANUP_SQL.indexOf('DELETE FROM Notifications'));
    expect(CLEANUP_SQL.indexOf('DELETE FROM BookCopies'))
      .toBeLessThan(CLEANUP_SQL.indexOf('DELETE FROM Books'));
    expect(CLEANUP_SQL.indexOf('DELETE FROM Books'))
      .toBeLessThan(CLEANUP_SQL.indexOf('DELETE FROM Users'));
    expect(CLEANUP_SQL).not.toContain("UPDATE Books SET Status = 'INACTIVE'");
    expect(CLEANUP_SQL).toContain('Acceptance fixture residue remains after cleanup.');
  });

  test('discovery and cleanup match the exact historical suffix identities', () => {
    expect(DISCOVERY_SQL).toContain('RIGHT(candidate.RunId, 8)');
    expect(CLEANUP_SQL).toContain('RIGHT(@RunId, 8)');

    for (const statement of [DISCOVERY_SQL, CLEANUP_SQL]) {
      expect(statement).toContain("acc_member_a_");
      expect(statement).toContain("acc_member_b_");
      expect(statement).toContain("acc_librarian_");
      expect(statement).toContain("acc_admin_");
      expect(statement).toContain("member-a.");
      expect(statement).toContain("member-b.");
      expect(statement).toContain("librarian.");
      expect(statement).toContain("admin.");
      expect(statement).not.toContain("Username LIKE CONCAT('%', @RunId)");
    }
  });

  test('dry-run only discovers candidate counts', async () => {
    const pool = makePool([{
      RunId: RUN_ID,
      UserCount: 4,
      BookCount: 1,
      CopyCount: 1,
      StoredIsbn: null,
    }]);

    await expect(runCleanup({ pool, argv: [] })).resolves.toEqual({
      mode: 'dry-run',
      candidates: [{
        runId: RUN_ID,
        userCount: 4,
        bookCount: 1,
        copyCount: 1,
        storedIsbn: null,
        expectedIsbn: 'ACC-2e3a025d',
      }],
    });
    expect(pool.queries).toHaveLength(1);
    expect(pool.queries[0]).not.toBe(CLEANUP_SQL);
  });

  test('execute refuses an incomplete fixture before opening a delete transaction', async () => {
    const pool = makePool([{
      RunId: RUN_ID,
      UserCount: 3,
      BookCount: 1,
      CopyCount: 1,
      StoredIsbn: null,
    }]);

    await expect(runCleanup({ pool, argv: ['--execute'] }))
      .rejects.toThrow(`Fixture identity is incomplete for ${RUN_ID}: users=3, books=1, copies=1.`);
    expect(pool.queries).toHaveLength(1);
  });
});
