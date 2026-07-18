# FE11 Audit Log Validation - 2026-07-18

Status: B7 INTEGRATION COMPLETE

Scope: `FE11-AUD01` / `TD-024` only

Decision: Hybrid SDD + ADD, Full depth for the security-sensitive read boundary. Core behavior is authorization, validation, SQL filtering/order, and redaction. The frontend is the bounded Shell consumer of the canonical DTO.

## L1 - Automated Evidence

### Observed RED

- Route RED: 18 failed and 41 passed because the canonical Admin route did not exist and the legacy route still reached authentication/authorization behavior.
- Repository RED: 5 failed because `listAuditLogs` did not exist.
- Service RED: 130 failed and 46 passed because `adminService.listAuditLogs` and the projector did not exist.
- Frontend RED: 5 failed and 12 passed because the Admin API, filter builder, canonical DTO rendering, and legacy adapter removal were absent.

### GREEN And Regression

| Command | Observed result |
| --- | --- |
| `npm.cmd test -- --runTestsByPath tests/adminAuditLogRoutes.test.js tests/userManagementRoutes.test.js` | 2 suites, 59/59 tests PASS |
| `npm.cmd test -- --runTestsByPath tests/auditLogRepository.test.js` | 1 suite, 5/5 tests PASS |
| `npm.cmd test -- --runTestsByPath tests/adminAuditLogService.test.js tests/userManagementService.test.js` | 2 suites, 176/176 tests PASS |
| `node --test test/adminApi.test.js test/userManagementApi.test.js test/userManagementFrontend.test.js` | 17/17 tests PASS |
| Focused six-suite backend command from the plan | 6 suites, 246/246 tests PASS |
| `npm.cmd --prefix backend test` | 36 suites, 598/598 tests PASS |
| `npm.cmd --prefix backend run test:coverage:ci` | 36 suites, 598/598 tests PASS |
| `npm.cmd --prefix frontend test` | 111/111 tests PASS |
| `npm.cmd --prefix frontend run lint` | PASS |
| `npm.cmd --prefix frontend run build` | PASS; existing non-blocking bundle-size warning remains |
| OpenAPI YAML parse | `OpenAPI OK` |
| `npm.cmd run trace:enforce` | PASS |
| Tracked and untracked diff hygiene | PASS; Git reports only line-ending conversion warnings |
| High-confidence secret scan | PASS |

Coverage:

- Statements: 92.51% (791/855)
- Branches: 82.46% (536/650)
- Functions: 97.1% (134/138)
- Lines: 92.44% (783/847)

## L2 - Specification Compliance

| Requirement | Code boundary | Test evidence |
| --- | --- | --- |
| `FR-FE11-033` | Canonical route/controller/service/repository/frontend flow | Route, repository, service, and frontend contract suites |
| `AC-FE11-018` | Searchable/filterable read-only Admin view with safe DTO | Query/filter tests, projector matrix, frontend source contracts |
| `BR-FE11-018` | Admin-only read access and sensitive-field redaction | Admin-first route tests and default-deny service tests |
| `BR-FE11-026` | Credential/token/session/link and secret metadata exclusion | Hostile metadata tests, DTO omission assertions, security scan |
| `FE11-AUD01` / `TD-024` | Canonical ownership, legacy retirement, docs, and validation | Complete uncommitted H2 diff and this packet |

No requirement, acceptance criterion, task, or debt row is closed by this H2-ready packet.

## L3 - Constitution And Safety

- Authentication and Admin authorization execute before detailed query validation.
- Server boundary validation normalizes only the approved query names and rejects invalid bounds/date ranges.
- SQL uses typed `mssql` parameters; search metacharacters are escaped and request text is not interpolated into SQL.
- Data and count statements share the same filter fragment and use stable `CreatedAt DESC, LogId DESC` ordering.
- Projection is action-aware and default-deny. Invalid JSON, arrays, scalars, unknown actions, and invalid shapes return `{}`.
- Raw `Metadata` and `UserAgent` never cross the service DTO boundary.
- Sensitive concepts are limited to deny rules and negative assertions; no real secrets or PII were added.
- No schema, dependency, authentication, audit-write, export, update/delete, TD-026, TD-023, or TD-025 expansion occurred.

## L4 - Acceptance Evidence

- Combined `q`, `action`, `actorId`, `from`, and `to` filters are demonstrated through the repository test harness with typed inputs and one data/count scope.
- Pagination, empty-page behavior, and stable two-column ordering are automated.
- Safe details are demonstrated for every approved action family plus hostile, malformed, and unknown metadata.
- Non-user targets return `label: null`; user/account targets alone may receive joined labels.
- The retired `/api/users/audit-logs` path returns `404 NOT_FOUND` without invoking authentication or a service.
- Frontend contracts demonstrate Apply, Clear, refresh, page preservation, canonical nested DTO fields, and React text-only rendering.

Residual environment gaps:

- No real SQL Server-backed query execution was available in this local gate; emitted SQL and typed binding behavior are automated.
- No signed-in browser interaction was run; frontend source contracts, full tests, lint, and production build are green.
- GitHub PR checks, H3 approval, merge, and exact post-merge `main` CI completed successfully.

## Scope And Security Scan

- All 25 changed/untracked files are restricted to the TD-024 plan ownership: Admin audit boundary, retired legacy boundary, focused tests, frontend adapter/page/tests, API/OpenAPI docs, FE11 test/changelog records, the reviewed plan, and this validation packet.
- Diff-level sensitive-term matches are confined to projector deny rules, action names, documentation, bearer-token test setup, and negative assertions. A whole-file scan also reports pre-existing account-setup code in touched FE11 files; no new secret or credential value was added.
- `fetchAuditLogs` remains only in a negative frontend assertion; `/users/audit-logs` remains only in retirement tests/docs; no functional `listRecent` reference remains.

## B7 Integration Evidence

- Human H2 and H3 reviews were approved on 2026-07-18.
- PR #33 merged into `main` as `3c88e432feaeda101fb84d6d263ad83691f462ef`.
- Post-merge CI run `29651173195` completed successfully.
- `TD-024` / `FE11-AUD01` is complete through B7; whole FE11 remains deferred.
