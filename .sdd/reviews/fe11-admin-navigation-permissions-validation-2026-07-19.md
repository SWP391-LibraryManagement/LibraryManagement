# FE11 Admin Navigation And Permissions Validation - 2026-07-19

Status: H2 REVIEW READY

Scope: `FE11-PERM01..FE11-PERM05` / `TD-023` only

Decision: Hybrid SDD + ADD, Standard depth. Core is Admin-first authorization, exact policy/API ownership, FE11/FE12 ownership, and failure isolation; Shell is the read-only responsive presentation.

## L1 - Automated Evidence

### Clean Baseline

| Command | Result |
| --- | --- |
| `npm.cmd test` in `backend/` | 36 suites, 600/600 tests PASS |
| `npm.cmd test` in `frontend/` | 113/113 tests PASS |

### Observed RED

- Service RED: 2/2 tests failed with `TypeError: adminService.getPermissions is not a function`.
- Route RED: 4/4 tests failed with HTTP 404 because `/api/admin/permissions` did not exist.
- Frontend boundary RED: six failures exposed the missing Admin API adapter, missing utility module, stale Membership navigation, unreachable Permissions state, and hardcoded matrix.
- Frontend helper RED: after the import boundary existed, 3/3 assertions failed for role summary, module coverage, and matrix cell derivation.

### GREEN And Regression

| Command | Result |
| --- | --- |
| Service plus Audit Service focused command | 2 suites, 132/132 tests PASS |
| Permission service/route plus Audit/security focused command | 4 suites, 28/28 tests PASS |
| Frontend API/helper/page/App Shell focused command | 38/38 tests PASS |
| `npm.cmd --prefix backend test` | 38 suites, 606/606 tests PASS |
| `npm.cmd --prefix frontend test` | 120/120 tests PASS |
| `npm.cmd --prefix backend run test:coverage:ci` | 38 suites, 606/606 tests PASS |
| `npm.cmd --prefix frontend run lint` | PASS with zero warnings |
| `npm.cmd --prefix frontend run build` | PASS; existing non-blocking bundle-size warning remains |
| OpenAPI YAML parse | `OpenAPI OK` |
| Backend health import | `Backend app import OK` |
| `npm.cmd run trace:enforce` | PASS |
| `npm.cmd run test:e2e` | Chromium golden path 1/1 PASS |
| `git diff --check` | PASS |
| Exact scope comparison | PASS; exactly 21 approved TD-023 files |
| Product drift scan | PASS; no hardcoded matrix, Membership sidebar item, roles section, or duplicate summary endpoint |
| High-confidence sensitive-term scan | PASS after review; matches are authorization documentation, negative safety statements, random test JWT setup, and dummy bearer headers only |

Coverage:

- Statements: 92.51% (791/855)
- Branches: 82.46% (536/650)
- Functions: 97.1% (134/138)
- Lines: 92.44% (783/847)

## L2 - Specification Compliance

| Requirement | Code boundary | Test evidence |
| --- | --- | --- |
| `FR-FE11-030`, `AC-FE11-016`, `BR-FE11-016` | Exact eight-entry `Sidebar` in `UserManagement.jsx` | Exact ordered source-contract test plus App Shell regression |
| `FR-FE11-032`, `AC-FE11-017`, `BR-FE11-017` | Immutable policy, fresh service DTO, Admin route/controller, frontend adapter/view | Exact 15-row service test, route tests, adapter/helper/page tests |
| `FR-FE11-015`, `NFR-FE11-SEC-001/002` | `authenticate` then `requireAnyRole('ADMIN')` before controller | Missing token 401 and Member/Librarian 403 without service invocation |
| TD-026 ownership decision | Existing FE12 `reportApi.users()` supplies `usersByRole` | Role-summary helper and page source-contract tests |
| Failure isolation | Separate permission and statistics state/loaders/catches/retry buttons | Page source-contract tests and code review |

No FE04, FE12 production, schema, permission-mutation, role-CRUD, or TD-025 requirement is implemented by this diff.

## L3 - Constitution And Safety

- Authentication and Admin authorization execute before the controller; non-Admin callers cannot observe policy data.
- The endpoint accepts no business input, performs no database access, and invokes no repository or write method.
- The service returns explicit allowlisted DTO keys and fresh nested objects; callers cannot mutate the shared frozen policy.
- Allowed roles are restricted to `ADMIN`, `LIBRARIAN`, and `MEMBER`, with deterministic order and no duplicates.
- The response contains no credential, token, session, personal, audit, provider, or internal-function data.
- React renders labels through normal text nodes; no HTML injection or `dangerouslySetInnerHTML` path was introduced.
- No schema, dependency, auth implementation, CORS, rate-limit, secret, or environment change was introduced.

## L4 - Acceptance Evidence

- Source-contract tests prove the sidebar contains exactly Home, Dashboard, Library, Borrowing Management, Request Management, All Users, Permissions, and Audit Logs in order.
- The Membership sidebar entry is absent while all FE04 imports, state, loaders, components, and routes remain untouched.
- The Permissions view is reachable and loads `adminApi.permissions()` plus FE12 `reportApi.users()` independently.
- Role counts use numeric zero defaults and only FE12 `usersByRole`; paginated user rows are not used.
- Module coverage and matrix cells derive only from FE11 `allowedRoles`; no frontend permission definition remains.
- Later FE11 or FE12 failures preserve the corresponding last successful data and expose independent retry controls.
- Chromium golden-path regression passes on desktop/mobile. A signed-in feature-specific Permissions browser interaction remains a residual manual H2 check.

## Residual Risks

- The browser suite emitted pre-existing `/api/profile/me` SQL-configuration errors because local SQL Server variables are absent; the golden path still passed 1/1 and TD-023 performs no SQL access.
- The frontend production build retains the existing non-blocking chunk-size warning.
- The current automated browser flow does not open the new Permissions section; focused source contracts, full frontend tests, lint, and build cover this slice locally.
- GitHub PR checks, H3, implementation merge, post-merge main CI, and documentation closeout remain pending.

## H2 Review Boundary

- Review only the TD-023 governance, backend policy/service/route/tests, frontend adapter/helper/page/tests, API/OpenAPI contract, and this validation record.
- `TD-023` remains `IN PROGRESS`; `FE11-PERM06` remains unchecked.
- H2 may authorize only the unchanged reviewed commit set, push, and draft PR publication. H3 remains required before merge.
- Whole FE11 remains `Implementation State: DEFERRED`, and `TD-025` remains open.
