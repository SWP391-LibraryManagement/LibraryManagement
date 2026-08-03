# FE05 Legacy Cleanup Identity Amendment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the tracked staging cleanup operator recognize the exact full-run identities used by the retained 2026-08-02 acceptance fixtures and close FE05-T021 with verified staging evidence.

**Architecture:** Keep the existing CLI, validation, discovery result, and transactional deletion flow. Change only the username/email identity key from the final eight-character suffix to the already validated complete run ID; keep the suffix-based synthetic ISBN helper unchanged. Amend historical planning and FE05 closeout documents so the tracked contract matches the observed staging data.

**Tech Stack:** Node.js, Jest, SQL Server through `mssql`, Markdown SDD documents.

## Global Constraints

- Restrict cleanup execution to `LibraryManagementStaging`.
- Accept only run IDs matching `^lms-acceptance-20260802-[0-9a-f]{8}$`.
- Require exactly four users, one exact-title book, and one exact-barcode copy before deletion.
- Preserve parameterized SQL, serializable per-run transactions, child-before-parent deletion, rollback, and residue checks.
- Do not change schema, public API, roles, dependencies, normal FE05 behavior, or the optional ISBN rule for real books.
- Do not print credentials, connection strings, token material, passwords, or PII.

---

### Task 1: Correct The Historical Identity Matcher With TDD

**Files:**
- Modify: `backend/tests/stagingAcceptanceCleanupScript.test.js`
- Modify: `backend/scripts/cleanupStagingAcceptanceData.js`

**Interfaces:**
- Consumes: validated `runId` values from `RUN_ID_PATTERN` and SQL parameter `@RunId`.
- Produces: `DISCOVERY_SQL` and `CLEANUP_SQL` that match `acc_*_<full-run-id>` usernames and corresponding `<role>.<full-run-id>@lms.invalid` emails.

- [ ] **Step 1: Replace the suffix contract test with a full-run regression**

Update the identity test to assert the exact SQL key and preserve exact matching:

```js
test('discovery and cleanup match the exact historical full-run identities', () => {
  expect(DISCOVERY_SQL).toContain("CONCAT('acc_member_a_', candidate.RunId)");
  expect(DISCOVERY_SQL).toContain("CONCAT('member-a.', candidate.RunId, '@lms.invalid')");
  expect(CLEANUP_SQL).toContain("CONCAT('acc_member_a_', @RunId)");
  expect(CLEANUP_SQL).toContain("CONCAT('member-a.', @RunId, '@lms.invalid')");
  expect(DISCOVERY_SQL).not.toContain('RIGHT(candidate.RunId, 8)');
  expect(CLEANUP_SQL).not.toContain('RIGHT(@RunId, 8)');

  for (const statement of [DISCOVERY_SQL, CLEANUP_SQL]) {
    expect(statement).toContain('acc_member_b_');
    expect(statement).toContain('acc_librarian_');
    expect(statement).toContain('acc_admin_');
    expect(statement).not.toContain("Username LIKE CONCAT('%', @RunId)");
  }
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/stagingAcceptanceCleanupScript.test.js
```

Expected: FAIL because `DISCOVERY_SQL` still uses `candidate.Suffix` and `CLEANUP_SQL` still declares/uses `@Suffix`.

- [ ] **Step 3: Implement the minimal full-run matcher**

In `DISCOVERY_SQL`, remove the `Suffix` projection from `CandidateRuns` and use `candidate.RunId` in all four username/email pairs:

```sql
CONCAT('acc_member_a_', candidate.RunId)
CONCAT('member-a.', candidate.RunId, '@lms.invalid')
```

Apply the same replacement for Member B, Librarian, and Admin.

In `CLEANUP_SQL`, remove:

```sql
DECLARE @Suffix NVARCHAR(8) = RIGHT(@RunId, 8);
```

Use `@RunId` directly in the initial fixture-user lookup and the post-delete residue query:

```sql
CONCAT('acc_member_a_', @RunId)
CONCAT('member-a.', @RunId, '@lms.invalid')
```

Apply the same replacement for Member B, Librarian, and Admin. Do not change `buildSyntheticIsbn(runId)`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/stagingAcceptanceCleanupScript.test.js
```

Expected: PASS, 6/6 tests.

---

### Task 2: Reconcile Documentation And Close FE05-T021

**Files:**
- Modify: `docs/superpowers/specs/2026-08-04-fe05-catalog-data-hygiene-design.md`
- Modify: `docs/superpowers/plans/2026-08-04-fe05-catalog-data-hygiene.md`
- Modify: `docs/superpowers/plans/2026-08-02-azure-staging-authenticated-acceptance.md`
- Modify: `.sdd/specs/feat-book-management/TASKS.md`
- Modify: `.sdd/specs/feat-book-management/CHANGELOG.md`

**Interfaces:**
- Consumes: the approved amendment design, merge SHA `a2d22910b24d18ce876acfa7572f1b6d478f207f`, CI run `30839756115`, deployment run `30840132636`, and completed staging/browser verification.
- Produces: documentation that distinguishes the observed full-run historical identities from the future suffix-based synthetic ISBN.

- [ ] **Step 1: Correct the original cleanup design and implementation plan**

Replace suffix-only historical user identity wording with:

```text
acc_member_a_<full-run-id>
acc_member_b_<full-run-id>
acc_librarian_<full-run-id>
acc_admin_<full-run-id>
```

and matching `.invalid` emails. Keep `ACC-<8 hex suffix>` only in the future ISBN amendment.

- [ ] **Step 2: Add a historical execution note to the acceptance plan**

In the 2026-08-04 hygiene amendment, state that retained 2026-08-02 database rows used the complete run ID in usernames/emails even though the earlier planned identity block below used `<suffix>`. State that the tracked cleanup operator follows observed persisted identities and that the historical block remains unchanged as planning evidence.

- [ ] **Step 3: Close FE05-T021 with exact evidence**

Change `FE05-T021` from `[~]` to `[x]` and add evidence covering:

```text
PR #112 merge a2d22910b24d18ce876acfa7572f1b6d478f207f
post-merge CI 30839756115 PASS
staging deployment 30840132636 PASS
10 exact fixture graphs deleted
final SQL residue 0 users / 0 books / 0 copies
browser QA: all-status label, independent A/B statuses, visible ISBN, old acceptance search returned 0
```

Add the same legacy-identity correction and closeout summary to the top 2026-08-04 changelog entry. Do not change FE05 SPEC behavior or version.

- [ ] **Step 4: Run focused verification after documentation changes**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/stagingAcceptanceCleanupScript.test.js tests/bookRoutes.test.js
git diff --check
```

Expected: PASS, 53/53 tests; no whitespace errors.

---

### Task 3: Run Repository Gates And Publish The Follow-Up

**Files:**
- Review every path changed by Tasks 1-2.

**Interfaces:**
- Produces: an H2-reviewable implementation diff, then a follow-up PR after approval.

- [ ] **Step 1: Run full required gates**

Run:

```powershell
npm.cmd --prefix backend test
npm.cmd run test:deployment
npm.cmd run trace:enforce
npm.cmd run test:secrets
git diff --check
```

Expected: all commands exit `0`; backend, deployment, traceability, and secret checks report no failures.

- [ ] **Step 2: Review scope and generated artifacts**

Run:

```powershell
git status --short
git diff --stat HEAD~1
git diff HEAD~1 -- backend/scripts/cleanupStagingAcceptanceData.js backend/tests/stagingAcceptanceCleanupScript.test.js docs/superpowers/specs/2026-08-04-fe05-catalog-data-hygiene-design.md docs/superpowers/plans/2026-08-04-fe05-catalog-data-hygiene.md docs/superpowers/plans/2026-08-02-azure-staging-authenticated-acceptance.md .sdd/specs/feat-book-management/TASKS.md .sdd/specs/feat-book-management/CHANGELOG.md
```

Confirm there is no schema, API, dependency, frontend, generated build, credential, or runtime artifact change.

- [ ] **Step 3: Present the complete implementation diff and gate evidence for H2**

Do not commit generated implementation changes until the user approves the exact diff and evidence.

- [ ] **Step 4: Commit, push, and open the PR after H2**

Run:

```powershell
git add -- backend/scripts/cleanupStagingAcceptanceData.js backend/tests/stagingAcceptanceCleanupScript.test.js docs/superpowers/specs/2026-08-04-fe05-catalog-data-hygiene-design.md docs/superpowers/plans/2026-08-04-fe05-catalog-data-hygiene.md docs/superpowers/plans/2026-08-02-azure-staging-authenticated-acceptance.md .sdd/specs/feat-book-management/TASKS.md .sdd/specs/feat-book-management/CHANGELOG.md
git commit -m "fix: align FE05 cleanup legacy identities"
git push -u origin codex/fix-fe05-cleanup-legacy-identity
gh pr create --base main --head codex/fix-fe05-cleanup-legacy-identity --title "fix(FE05): align legacy cleanup identities" --body "Correct the historical full-run acceptance identity matcher, preserve the staging-only transactional cleanup boundaries, add regression coverage, and record FE05-T021 staging closeout evidence."
```

Expected: branch push succeeds and the PR is created against `main`.

- [ ] **Step 5: Complete integration gates**

Wait for exact-head CI. Present the PR diff, mergeability, and CI evidence for H3. After explicit H3 approval, merge the PR, then verify exact post-merge CI and staging deployment for the merge SHA.
