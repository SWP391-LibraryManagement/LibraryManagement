# FE11 User List Envelope Decision

Status: APPROVED BY HUMAN - 2026-07-18

Date: 2026-07-18

Scope: `TD-026` and the data-source dependency forecast for `TD-023`

## Current Conflict

The approved `GET /api/users` response is `{ data, pagination }`. The implementation also emits top-level `summary`, and the Admin page consumes it for user counters. Permissions currently derives role counts from only the loaded page, which is not authoritative.

FE12 already owns the completed global user-statistics read model at `GET /api/reports/users`. Its B7 response includes `totals.users`, `usersByStatus`, and `usersByRole`, sourced from FE11 Users/Roles data.

## Option A - Formalize `summary` In `GET /api/users`

- Smallest implementation change.
- Requires an approved FE11 SPEC/API contract change.
- Couples paginated list retrieval to unrelated global aggregates.
- Duplicates FE12 user-statistics ownership.

Result: rejected.

## Option B - Remove `summary` And Derive Counts From The Loaded Page

- Preserves the documented list envelope.
- Produces incorrect global counts whenever pagination/filtering is active.

Result: rejected because it cannot satisfy authoritative dashboard or Permissions counts.

## Option C - Reuse The FE12 User-Statistics Read Model

- Keep `GET /api/users` exactly `{ data, pagination }`.
- Use existing `GET /api/reports/users` for the Admin user cards.
- Map `total` from `totals.users`.
- Map `active` from `usersByStatus.ACTIVE`, defaulting to numeric zero.
- Map `inactive` from `usersByStatus.INACTIVE`, defaulting to numeric zero.
- Map `librarians` from `usersByRole.LIBRARIAN`, defaulting to numeric zero.
- Load the paginated list and FE12 statistics independently so list filters never change global cards.
- Remove the undocumented repository aggregate query and top-level list `summary` in the same TD-026 slice.
- Do not create `/api/admin/user-summary`.

Result: recommended because it preserves both FE11 and FE12 source ownership without another public endpoint.

## TD-023 Dependency Forecast

`TD-023` remains outside Batch 1 and receives no implementation authorization from this decision. Its future Permissions view must not derive counts from paginated user rows. It should reuse FE12 `usersByRole` for counts and keep FE11 ownership of the read-only permission matrix, unless a separately approved TD-023 contract chooses another composition.

## Validation Required After H1

- `GET /api/users` repository/service/route tests assert exact top-level keys `data` and `pagination`.
- The removed summary aggregate SQL is not executed by list requests.
- Admin page requests the list and FE12 statistics independently.
- Dashboard-card mapping uses deterministic numeric zero defaults.
- List loading/filter errors do not overwrite an independently successful statistics result, and statistics errors do not erase a successfully loaded list.
- Frontend does not derive global status or role counts from page rows.
- Existing FE12 authorization, response, and B7 tests remain unchanged and pass.

## File Ownership Clarification

TD-026 owns only the FE11 list-envelope and Admin consumer migration files:

- `.sdd/specs/feat-user-role-management/SPEC.md` only if a documentation clarification is required
- `docs/api/api-contract.md`
- `backend/src/docs/openapi.yaml`
- `backend/src/repositories/userRepository.js`
- `backend/src/services/userManagementService.js` only if it currently forwards repository summary state
- `backend/tests/userRepository.test.js`
- `backend/tests/userManagementService.test.js`
- `backend/tests/userManagementRoutes.test.js`
- `frontend/src/page/UserManagement.jsx`
- `frontend/test/userManagementFrontend.test.js`
- `frontend/test/userManagementApi.test.js` only for exact list-envelope assertions

TD-026 does not own Admin routes/controllers/services, FE12 production files, or a new summary endpoint.

## H1 Decision

Recommended approval: Option C. Approval authorizes the FE11/API documentation clarification and a later detailed TD-026 implementation plan. No product code changes occur in the H1 preparation or governance activation phase.
