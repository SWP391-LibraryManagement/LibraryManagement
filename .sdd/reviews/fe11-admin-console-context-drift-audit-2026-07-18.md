# FE11 Admin Console Context And Drift Audit

Date: 2026-07-18

Method: Hybrid SDD/ADD context reconciliation with separate Standards and Spec reviews

Fixed point:

- Base: `66642b5`
- Target: `origin/main@8da84bd`
- Scope: FE11 User Management, Admin Console, role-action UI, Audit Logs, and Request Management only

## Decision

SDD Full reconciliation is required before any new FE11 Admin Console implementation slice starts.

The following bounded slices are complete through B7:

- Account setup: `FE11-S01..S07`
- Transactional backend role assignment/revocation: `FE11-R01..R05`
- Safe user list/detail: `FE11-U01..U06`

The whole feature remains `Implementation State: DEFERRED`. Existing Admin Console and Audit Log prototype behavior is not accepted as conformance where it conflicts with `SPEC.md` or was added without an approved task group.

`docs/agents/issue-tracker.md` is absent, so the canonical local FE11 `SPEC.md`, approved slice designs/plans, validation records, code, and tests are the available evidence set.

## Standards Review Findings

### High - Audit behavior was implemented outside an approved FE11 task

`PLAN.md` and `TASKS.md` keep Admin Console/Audit work deferred, but commit `1fabe35` and `CHANGELOG.md` record Audit Log pagination/display implementation. This violates the repo rule that implementation must follow an approved SPEC/PLAN/TASKS slice. The existing behavior must be treated as partial prototype code until a separately reviewed task group validates it.

### High - Audit input validation and redaction do not meet repository safety rules

`backend/src/services/userManagementService.js` silently normalizes/clamps Audit Log pagination instead of using a route-boundary validator. `backend/src/repositories/auditLogRepository.js` returns raw `Metadata`. This conflicts with validation-at-the-boundary and safe-output rules.

### Medium - Authoritative evidence records are stale

The FE11 traceability tables still mark completed account-setup, transactional-role, and safe-read rows as `Ready for review` or `Not Started`. `TEST_PLAN.md` also retained a pre-review safe-read statement. These stale records create Context Amnesia even though bounded validation and post-merge CI evidence exist.

### Medium - Shared API and agent memory were stale

The shared API document retained `GUEST`, username search, an obsolete list envelope, and a nested detail DTO. `.agents/CLAUDE.md` mentioned only FE11 account setup and incorrectly described Sequelize as the SQL Server access layer, while ADR-002 requires parameterized `mssql` queries.

## Spec Review Findings

### High - Admin role actions cannot call the approved backend contract

`FR-FE11-012/013`, `AC-FE11-013/014`, and the canonical API require numeric `roleId`. `frontend/src/api/userManagementApi.js` sends `{ roleName }` for assignment and places `roleName` in the DELETE path, while `backend/src/validators/userManagementValidators.js` requires positive integer IDs. The backend role slice is B7-complete, but the Admin UI path is non-conforming and remains deferred.

### High - Audit Logs are only a partial implementation

The canonical endpoint is `GET /api/admin/audit-logs` with `q`, `action`, `actorId`, `from`, `to`, pagination, and sensitive-field redaction. The implementation exposes `/api/users/audit-logs`, supports page/limit only, provides no UI search/filter controls, and returns raw metadata. Existing tests prove Admin authorization and pagination, not `FR-FE11-033` / `AC-FE11-018`.

### Medium - Admin navigation and Permissions conflict with the approved console

`FR-FE11-030` requires Home, Dashboard, Library, Borrowing Management, Request Management, All Users, Permissions, and Audit Logs. `frontend/src/page/UserManagement.jsx` omits Permissions and adds Membership Management. The permissions content is unreachable, uses hardcoded matrices, and derives role counts from only the loaded user page; `/api/admin/permissions` is absent.

### Medium - Request Management is incomplete

List/search/filter/export and pending-only UI actions exist. Terminal rows are view-only in the current component, but `GET /api/admin/requests/{requestId}` is absent and no focused server-side acceptance test proves completed/rejected/cancelled requests are immutable for this Admin view.

### Medium - The safe-list envelope drifted after its approved validation scope

The approved safe-read design fixes the response envelope to `data` plus `pagination`. Commit `1fabe35` added a top-level `summary` in `backend/src/repositories/userRepository.js`; this behavior is not in the SPEC/design and lacks a focused repository contract assertion.

### Low - Closed-slice evidence metadata remains stale

The code, validation reviews, human approvals, merges, and CI runs prove the three bounded slices above. The status cells inside `SPEC.md` do not reflect that evidence. Because SPEC is the source of truth, evidence metadata should be reconciled only in a separately approved SPEC maintenance change, without modifying requirements.

## Reconciliation Applied

- Updated `.agents/CLAUDE.md` with the actual FE11 B7 slices, `mssql` architecture, and unresolved Admin Console drift.
- Corrected ADR-005 from awaiting review to accepted for the implemented account-setup slice.
- Reconciled the shared safe list/detail API documentation to the approved FE11 contract; the extra implementation `summary` remains explicitly non-contract.
- Updated `TEST_PLAN.md`, `TASKS.md`, and `CHANGELOG.md` with the fixed-point audit and current evidence state.
- Corrected stale `TD-015`, `TD-016`, and `TD-021` descriptions and registered `TD-022..TD-027` for newly classified drift.
- Left `SPEC.md` and all product code unchanged.

## Next Gate

Do not implement all findings as one broad change. Select and approve one bounded remediation slice with its own design, tasks, RED tests, validation gate, human review, merge, and post-merge evidence. Recommended first slice: `TD-022` Admin role-action UI contract, because the backend transaction is already validated and the current UI path is deterministically incompatible.

## Human Review Gate

Human review was confirmed on 2026-07-18. The reviewer accepted the fixed point, separate Standards/Spec findings, bounded B7 classification, deferred whole-feature state, and documentation-only reconciliation. This approval closes `FE11-C01`; it does not approve any product-code remediation slice.
