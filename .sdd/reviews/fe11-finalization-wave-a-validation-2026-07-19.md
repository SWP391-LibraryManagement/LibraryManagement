# FE11 Finalization Wave A Validation - 2026-07-19

Status: H2 READY - UNCOMMITTED

Scope: `FE11-FIN01`, `FE11-LIFE01..FE11-LIFE05`; `FE11-LIFE06` remains open until H3, merge, and exact post-merge `main` CI.

Decision: Hybrid SDD + ADD, Full depth. Schema, authorization, optimistic concurrency, credential invalidation, audit atomicity, and FE07 serialization are Core; the Admin form and route presentation are Shell.

## Governance Prerequisite

- The Finalization Batch design and plan were approved before product work.
- Governance PR #39 passed `foundation-checks` run `29658802446`, merged as `62ac2d1a990af52d5f70f2a1da3e188639bd685a`, and exact post-merge `main` CI run `29658912068` passed.
- Wave A started from `origin/main@62ac2d1` in the isolated branch `feat/fe11-finalization-wave-a`.

## RED-GREEN History

### Planned Wave A RED

- Schema RED exposed the absent idempotent migration and stale 100-character email persistence widths.
- Account setup and safe-read RED exposed missing Librarian persistence/projection, missing effective `updatedAt`, missing create validation, and missing transaction-local acting-Admin checks.
- Lifecycle RED exposed the missing transactional repository for optimistic/no-op updates, atomic deactivation, refresh revocation, audit rollback, and member-first FE07 serialization.
- Frontend RED exposed the development Admin bypass, absent effective-version payloads, missing Librarian fields, and ACTIVE-only deactivation controls.

### Review-Driven RED

During final production-diff review, two additional regressions were added before their fixes:

| Command | Observed RED |
| --- | --- |
| `npm.cmd test -- --runTestsByPath tests/fe11SchemaMigration.test.js tests/userManagementService.test.js` in `backend/` | 2 suites failed; 2 tests failed and 74 passed. The migration checked byte width without fully enforcing SQL type/nullability, and service duplicate preflight disclosed `EMAIL_ALREADY_EXISTS` before the transaction-authoritative `ADMIN_REQUIRED` actor outcome. |
| `npm.cmd test -- --runTestsByPath tests/accountSetupRepository.test.js tests/authRoutes.test.js` in `backend/` | 2 suites failed; 2 tests failed and 28 passed. Setup completion accepted an `INACTIVE` account with non-null `DeactivatedAt`, allowing legacy unused setup state to reactivate a Phase 1 terminal deactivation. |

The minimal fixes made the source transaction authoritative for create actor/duplicate decisions, made the migration repair `nvarchar` type plus nullability rather than byte width alone, and required setup completion to accept only pending-activation accounts where `DeactivatedAt` is null.

### Focused GREEN

| Command | Result |
| --- | --- |
| `npm.cmd test -- --runTestsByPath tests/userManagementService.test.js` in `backend/` | 1 suite, 73/73 tests PASS |
| `npm.cmd test -- --runTestsByPath tests/fe11SchemaMigration.test.js` in `backend/` | 1 suite, 3/3 tests PASS |
| `npm.cmd test -- --runTestsByPath tests/fe11SchemaMigration.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js tests/accountSetupRepository.test.js tests/userLifecycleRepository.test.js` in `backend/` | 5 suites, 181/181 tests PASS |
| `npm.cmd test -- --runTestsByPath tests/accountSetupRepository.test.js tests/authRoutes.test.js` in `backend/` | 2 suites, 30/30 tests PASS after the deactivated-account setup guard |
| `npm.cmd test -- --runTestsByPath tests/fe11SchemaMigration.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js tests/accountSetupRepository.test.js tests/userLifecycleRepository.test.js tests/authRoutes.test.js` in `backend/` | 6 suites, 201/201 tests PASS |

## L1 - Automated Evidence

| Command | Result |
| --- | --- |
| `npm.cmd --prefix backend test` | 41 suites, 701/701 tests PASS |
| `npm.cmd --prefix backend run test:coverage:ci` | 41 suites, 701/701 tests PASS; 92.51% statements, 82.46% branches, 97.1% functions, 92.44% lines |
| `npm.cmd --prefix frontend test` | 124/124 tests PASS |
| `npm.cmd --prefix frontend run lint` | PASS with zero reported errors or warnings |
| `npm.cmd --prefix frontend run build` | PASS; existing non-blocking large-chunk warning remains |
| `npm.cmd run trace:enforce` | PASS; FE11 has 25/38 FR IDs tagged and whole-feature completion remains open |
| `node -e "require('./backend/node_modules/yamljs').load('backend/src/docs/openapi.yaml'); console.log('openapi ok')"` | PASS - `openapi ok` |
| `node -e "require('./backend/src/app'); console.log('backend import ok')"` | PASS - `backend import ok` |
| Isolated equivalent of `npm.cmd run test:e2e` using the unchanged golden-path spec contract with frontend `4183` and backend `3100` | Chromium system golden path 1/1 PASS; temporary config/spec removed after execution |
| `node --check backend/tests/sql/borrowingConcurrency.sqltest.js` | PASS |
| Product drift, Admin mutation alias, migration sensitive-content, and dependency scope scans | PASS |
| `git diff --check` | PASS |

## L2 - Specification Compliance

| Task / contract | Production boundary | Test evidence |
| --- | --- | --- |
| `FE11-FIN01` | Approved Full-depth design/plan and merged governance activation | PR #39 and exact post-merge CI evidence above |
| `FE11-LIFE01` | Idempotent migration, deterministic `UX_Users_Email`, canonical baseline/model/binding widths | `fe11SchemaMigration.test.js`; migration static checks; OpenAPI parse |
| `FE11-LIFE02` | Librarian create/read/update fields; active-Admin create/resend revalidation; safe duplicate outcomes | account-setup repository, user repository, service, and route suites |
| `FE11-LIFE03` | Locked actor/target/roles, effective version, no-op, duplicate email, sorted audit allowlist, rollback | `userLifecycleRepository.test.js`, service/route mapping tests |
| `FE11-LIFE04` | Pending/deactivated distinction, ACTIVE/LOCKED deactivation, active-borrowing guard, REFRESH revocation, atomic audit, FE07 lock order | lifecycle repository tests, borrowing repository regression, SQL race test source |
| `FE11-LIFE05` | Stored authenticated Admin state in all Vite modes; effective-version payloads; authoritative reload; Librarian form fields | frontend API/page contract tests, full frontend tests, lint, build, browser regression |

Contract details verified:

- `Users.Email` and `Notifications.RecipientEmail` are `NVARCHAR(255)`.
- `UserProfiles.Department` and `UserProfiles.Specialization` are nullable `NVARCHAR(100)`.
- `fullName`, `department`, and `specialization` use 100-character boundaries.
- Managed-user `updatedAt` is `COALESCE(Users.UpdatedAt, Users.CreatedAt)` and is reused for mutations.
- Create/resend lock and revalidate the active acting Admin inside their source transactions.
- Setup completion rejects `INACTIVE` accounts with non-null `DeactivatedAt`; only pending-activation accounts can transition to `ACTIVE`.
- `INACTIVE` plus null `DeactivatedAt` returns `409 ACCOUNT_PENDING_ACTIVATION`.
- Deactivation revokes only active `REFRESH` credentials and audits in the same transaction.
- FE07 remains the sole approve/reject mutation owner; Wave A changes only the minimum lock order needed for serialization.

## L3 - Constitution And Safety

- Authentication and Admin authorization execute before detailed create/update/deactivation validation.
- Create, resend, update, and deactivation revalidate the active acting Admin under `UPDLOCK, HOLDLOCK` before source mutation.
- All changed database access uses typed `mssql` parameters; request values are not concatenated into SQL.
- The create source transaction is authoritative for actor and duplicate outcomes, preventing stale/non-Admin callers from learning duplicate-email state through a service preflight.
- Update audit metadata contains only sorted `changedFields`; deactivation audit metadata contains only previous/new status.
- Deactivation status, `DeactivatedAt`, `UpdatedAt`, active REFRESH revocation, and audit commit or roll back together.
- Setup consumption checks `Status = INACTIVE` and `DeactivatedAt IS NULL` under the same locked transaction, preventing reactivation of a deactivated account.
- Managed-user responses remain explicit allowlists; Librarian fields are omitted for non-Librarian targets.
- No raw setup token/link, password, credential, secret, seed user, real PII, new dependency, session table, role CRUD, permission editing, or FE12 production change is introduced.

## L4 - Acceptance Evidence

- Automated route/service/repository tests cover create, resend, update, no-op, stale state, duplicate email, Librarian-only fields, pending activation, self-target, active borrowings, ACTIVE/LOCKED deactivation, refresh revocation, audit, and rollback outcomes.
- FE02 route and SQL-repository tests cover rejection of a deactivated account even when an unused `ACCOUNT_SETUP` token exists.
- Frontend tests cover login/home redirects, removal of implicit development Admin access, effective-version payloads, Librarian form fields, ACTIVE/LOCKED controls, and safe pending-activation messaging.
- The existing Chromium system golden path is the browser regression boundary for Wave A and passes 1/1 through the isolated `4183` frontend equivalent.
- Live SQL race code accepts only: approval wins and deactivation is blocked, or deactivation wins and approval observes an inactive member. The impossible final state is an INACTIVE user with a newly APPROVED request.

## Subsequent Live SQL Evidence

- The environment-only SQL residual was resolved later on 2026-07-19 using a disposable local SQL Server database and login.
- The canonical baseline plus all five reconciliation migrations passed two executions; all 8/8 SQL suites and 61/61 tests passed, including FE03 profile transactions, FE05 rowversion mutation, and FE07 approval/lifecycle serialization.
- Database/login cleanup returned `DB_CLEAN` and `LOGIN_CLEAN`; details are in `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Static migration/idempotence checks, emitted SQL lock-order tests, repository transaction tests, and JavaScript syntax checks remain part of the mandatory gate.
- The standard Playwright frontend port `4173` is occupied by pre-existing PID `13432`; it was not terminated or reused. The same golden-path contract passed 1/1 on isolated port `4183`, and all temporary runner files were removed.
- The local E2E server may log known `/api/profile/me` SQL-configuration errors when SQL environment variables are absent; this is recorded separately from the Chromium golden-path result.
- The frontend production build may retain the existing non-blocking large-chunk warning.

## H2 Boundary

- All implementation and evidence changes remain uncommitted.
- `FE11-FIN01` and `FE11-LIFE01..FE11-LIFE05` may be marked complete from the evidence in this record.
- `FE11-LIFE06` remains unchecked until the unchanged H2-reviewed diff is committed, PR checks pass, H3 approves integration, the PR merges, and the exact post-merge `main` CI run succeeds.
- Wave B Request Management (`FE11-REQ01..FE11-ACC01`) and whole-feature FE11 B7 closeout are outside this diff.
