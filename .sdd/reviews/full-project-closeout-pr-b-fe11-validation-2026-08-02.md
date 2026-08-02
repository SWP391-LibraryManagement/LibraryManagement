# Full Project Closeout PR B - FE11 Validation Record

- Date: 2026-08-02
- Branch: `feat/full-project-closeout-pr-b-fe11`
- Starting baseline: `042d61907c0ae5a6577ab9d40d5e78601fb4e147`
- State at this record: uncommitted H2 candidate
- Feature state: `PARTIAL`

## 1. Scope and decisions

PR B reconciles FE11 Core without changing the public API, schema, role catalog,
dependencies, workflows or the approved eight-entry Admin sidebar.

| Decision | Applied contract |
| --- | --- |
| BD-003 | Selecting the current sole role returns the canonical safe DTO as an idempotent no-op and writes no role-change audit. |
| BD-004 | Role change atomically replaces all mappings with exactly one approved role; zero/multiple legacy mappings normalize through that command. |
| BD-005 | The read-only permission matrix opens inside User/Role Management; no ninth sidebar entry is added. |

The only product-behavior change is permission-surface reachability. Core account,
lifecycle and role behavior was characterized before source tags were added.

## 2. RED-GREEN evidence

### RED

- Static frontend contract: 25/26 passed, 1 failed because
  `AdminPermissionsSection({ embedded = false })` and the embedded toggle/mount
  did not exist.
- Focused Chromium: 0/1 passed; timed out waiting for the missing
  `Xem ma trận quyền` button.
- After the button was added, Chromium exposed a separate E2E harness defect:
  `/api/admin/permissions` returned 500 because the injected system Admin
  service omitted production `getPermissions`. Source inspection confirmed
  `harnessGetPermissions=undefined` while `productionGetPermissions=function`.

### GREEN

- Static frontend contract: 26/26 passed.
- Focused Chromium: 1/1 passed in 14.6 seconds after the harness delegated to
  the production read-only policy.
- Focused FE11 backend characterization: 9/9 suites, 186/186 tests passed.
- FE11 source trace: 43/43, 100%; `Implementation State` remains `PARTIAL`.

## 3. Disposable SQL Server evidence

- Exact target: `LibraryManagement_FE11_PRB_20260802` on local `MSSQLSERVER`.
- Fail-closed conditions: exact DB name, non-staging/non-production name,
  `DB_SERVER`/`DB_NAME` present and `FE11_SQL_TEST_ALLOW_MUTATION=true`.
- Node driver could not use Windows integrated authentication (`Login failed for
  user ''`), so the run created a random-password local SQL login only for the
  disposable DB and removed it in `finally`; the password was neither printed
  nor persisted.
- Result: 1/1 suite, 9/9 mutable tests passed, 0 skipped.
- Covered: actor revalidation; duplicate/no-partial state; stale/self/pending/
  active-loan guards; ACTIVE/LOCKED deactivation; refresh revocation; audit;
  same-role no-op; valid replacement; unique index; injected audit rollback.
- Cleanup proof: `CLEANED`, `SQL_RUNNER_DROPPED`, `DROPPED`.

## 4. L1 automated gates

| Gate | Result |
| --- | --- |
| Focused backend | PASS - 9 suites, 186/186 |
| Focused frontend | PASS - 36/36 across the four planned files; embedded-surface contract 26/26 |
| Full backend | PASS - 74 suites, 1180/1180 |
| Backend coverage | PASS - statements 91.98%, branches 81.28%, functions 97.08%, lines 91.94% |
| Full frontend | PASS - 273/273 |
| Frontend lint/build | PASS - ESLint clean; Vite production build completed |
| Focused Chromium | PASS - 1/1 in 14.6 seconds |
| Full Chromium E2E | PASS - 12/12 in 1.3 minutes |
| System integration | PASS - 1 suite, 11/11 |
| Deployment contracts | PASS - 20/20 |
| Mutable SQL | PASS - 9/9, 0 skipped |
| Trace enforcement | PASS - FE11 43/43, `PARTIAL` |
| Secrets/OpenAPI/import | PASS - secret scanner 5/5 plus clean tracked scan; OpenAPI parsed; backend imported |

## 5. L2 requirement mapping

| Requirement group | Evidence |
| --- | --- |
| FR-004/007/010/020 | Retired profile/work-field route variants return safe 404 without service work; Admin UI exposes only approved account actions. |
| FR-023 | Route/service/repository plus SQL prove stale deactivation rejects before mutation/audit. |
| FR-025 | Repository/service plus SQL prove canonical no-op without mapping/token/audit DML. |
| FR-026/027 | Zero/multiple mapping characterization, replacement SQL and `UX_UserRoles_UserId` prove exactly-one-role normalization. |
| FR-030/032 | Static and Chromium evidence prove eight sidebar entries plus embedded read-only matrix at desktop/mobile sizes. |

## 6. L3 security review

- Authorization remains server-side and Admin-only before controller/service work.
- Permission data remains a deterministic read-only allowlist; no mutation UI or
  endpoint was added.
- Existing parameterized SQL and transaction boundaries remain unchanged.
- SQL evidence refuses staging/production names, uses exact synthetic IDs for
  cleanup and drops the test-only trigger/login/database.
- Response characterization rejects password/token/session/stack fields.
- Root and backend dependency audits report zero vulnerabilities. The frontend
  fail-closed audit accepts only documented GHSA-qwww-vcr4-c8h2 because the
  application does not use React Router unstable RSC APIs.
- No secret, raw token, credential, connection string, cookie, authorization
  header or full synthetic email is stored in this record.

## 7. L4 browser matrix

Focused local Chromium verified:

- desktop/table and responsive card layouts remain reachable;
- Admin sidebar contains exactly eight buttons and no Permissions item;
- `Xem ma trận quyền` calls `GET /api/admin/permissions`, receives 200 and shows
  the read-only matrix;
- `Ẩn ma trận quyền` removes it;
- the same open/hide path works at 390x844;
- desktop and mobile checks report no document-level horizontal overflow.
- at 390x844 the three action labels wrap onto multiple lines, but remain
  readable, keyboard-addressable and contained without horizontal overflow.

## 8. Persistent scope and residual gate

`git diff --check` exits 0. The only output is Git's existing LF-to-CRLF working
copy warning; there is no whitespace error. The persistent H2 scope is exactly
19 files:

1. `.sdd/reviews/full-project-closeout-pr-b-fe11-validation-2026-08-02.md`
2. `.sdd/specs/feat-user-role-management/CHANGELOG.md`
3. `.sdd/specs/feat-user-role-management/PLAN.md`
4. `.sdd/specs/feat-user-role-management/SPEC.md`
5. `.sdd/specs/feat-user-role-management/TASKS.md`
6. `backend/src/repositories/userLifecycleRepository.js`
7. `backend/src/repositories/userRoleRepository.js`
8. `backend/src/routes/userManagementRoutes.js`
9. `backend/src/services/userManagementService.js`
10. `backend/tests/fe11SchemaMigration.test.js`
11. `backend/tests/helpers/systemIntegrationHarness.js`
12. `backend/tests/sql/fe11Core.sqltest.js`
13. `backend/tests/userManagementRoutes.test.js`
14. `backend/tests/userRoleRepository.test.js`
15. `docs/superpowers/plans/2026-08-02-full-project-closeout-pr-b-fe11-core.md`
16. `frontend/src/page/admin/permissions/AdminPermissionsSection.jsx`
17. `frontend/src/page/admin/users/AdminUsersSection.jsx`
18. `frontend/test/userManagementFrontend.test.js`
19. `tests/e2e/fe11-admin-request-management.spec.js`

The exact SHA-256 of the complete tracked-plus-untracked H2 snapshot is reported
in the H2 handoff after this record is finalized; embedding that value here
would mutate the snapshot being hashed.

Residual truth: PR B has not been committed, pushed, merged or deployed. Exact
post-merge CI/staging acceptance and the final `Implementation State: COMPLETE`
transition remain assigned to PR D. No `v1.0.3` release evidence is claimed here.
