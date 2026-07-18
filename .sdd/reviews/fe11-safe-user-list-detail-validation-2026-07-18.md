# FE11 Safe User List And Detail Validation

Date: 2026-07-18

Scope: FE11-U01..U06 only

Status: VALIDATION COMPLETE - HUMAN IMPLEMENTATION REVIEW APPROVED

## L1 Automated Evidence

| Check | Result |
| --- | --- |
| Focused backend | PASS - 4 suites, 105/105 tests |
| Full backend | PASS - 30 suites, 434/434 tests |
| Backend coverage | PASS - 92.47% statements, 82.35% branches, 97.10% functions, 92.40% lines |
| Full frontend | PASS - 81/81 tests |
| Frontend lint | PASS |
| Frontend production build | PASS; existing bundle-size advisory remains non-blocking |
| Traceability enforcement | PASS; FE11 tagged FR count increased from 13 to 16 while whole-feature state remains deferred |
| Diff check | PASS |
| Sensitive-name review | PASS; matches are pre-existing auth/setup code or explicit forbidden-field assertions |

Focused command:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/userRepository.test.js tests/userRoleRepository.test.js
```

Full commands:

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
```

## L2 Spec Compliance

- `FR-FE11-001` / `AC-FE11-001`: defaults apply only when omitted; invalid supplied values are rejected; status/role/search are normalized; search is limited to email, full name, and user ID; SQL order remains stable.
- `BR-FE11-026`: list, mutation readback, and detail base fields use the explicit allowlist with `phoneNumber`; roles are deterministic uppercase strings; hostile credential/token/session/link/audit-secret columns are ignored.
- `FR-FE11-002` / `AC-FE11-002`: detail uses a dedicated one-query projection and returns exactly `activeBorrowingCount`, `unpaidFineTotal`, and `openReservationCount` with numeric zero defaults.
- `FR-FE11-015`: existing Admin-first middleware remains before list/detail validation.
- `FR-FE11-016`: invalid IDs return `400 VALIDATION_ERROR`; valid missing detail IDs return `404 USER_NOT_FOUND`.
- `TD-012`: `department` and `specialization` remain absent because no approved schema persistence exists; no fake null placeholders were added.

## L3 Constitution And Safety

- Server-side authentication and Admin role enforcement remain unchanged and precede validation details.
- Express-validator applies allowlisted pagination, status, role, search, and positive-ID rules.
- Express 5 query sanitization is copied from `matchedData` into `req.validatedListQuery`; raw query strings do not bypass service validation.
- Repository SQL uses typed `mssql` parameters; no request value is concatenated into SQL.
- The safe DTO is constructed field by field and does not spread a database row.
- Client errors remain safe and contain no SQL text, stack trace, or credential metadata.
- No dependency, schema, secret, credential, or production configuration change was introduced.

## L4 Acceptance And Residual Risks

- Automated tests prove the route/service/repository/frontend contracts and the original RED failures were observed before production changes.
- Real SQL Server execution of the three aggregate subqueries was not available in the disposable CI/local baseline; repository tests verify emitted SQL, typed inputs, mapping, and zero behavior.
- Frontend Node tests verify source contracts and pure helpers; no new browser-level interaction test was added for the drawer.
- The Vite build retains the pre-existing large-chunk advisory; it is unrelated to this bounded slice.
- Update/deactivation not-found behavior, librarian-field persistence, and remaining FE11 admin-console work stay deferred.

## Files Changed

- FE11 SDD planning, tasks, test plan, changelog, debt register, design, implementation plan, and this review.
- Backend user-management validators, routes, controller, service, repository, and focused tests.
- Frontend user-management query helper, API, Admin page, and focused tests.

## Remaining FE11 Work

- `TD-012`: librarian `department`/`specialization` persistence and validation.
- Remaining `TD-014`: update/deactivation and other non-detail not-found/acting-admin semantics.
- Remaining `TD-015`: update/deactivation/audit service coverage.
- `TD-016`: remaining create/update concurrency and contract debt.
- `TD-017`: development bypass configuration risk.
- Admin dashboard, permissions, audit-log, request-management, update, and deactivation slices.

## Human Review Gate

Human implementation review was approved on 2026-07-18. The reviewer confirmed the safe DTO, aggregate semantics, frontend behavior, scope boundary, and documented residual risks; `FE11-U06` is complete for this bounded slice.

Branch merge/push remains a separate integration action and is not claimed by this validation record.
