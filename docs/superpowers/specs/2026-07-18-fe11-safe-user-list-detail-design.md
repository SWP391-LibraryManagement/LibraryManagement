# FE11 Safe User List And Detail Design

Status: APPROVED BY HUMAN - 2026-07-18

Feature: FE11 User & Role Management

## 1. Decision

Use SDD Full depth for a bounded FE11 user-list and user-detail slice. Keep the existing `userRepository.js` boundary, replace the managed-user response mapping with an explicit `UserManagementView` allowlist, add strict list/detail request validation, and load the detail-only related summaries in one parameterized SQL query.

This slice is Core behavior because the endpoints expose personal data and define an Admin-only API contract. A broad mapper, permissive query handling, or inconsistent not-found response could expose credentials, break clients, or hide stale user-directory state.

## 2. Source Requirements

The design implements or advances these approved FE11 requirements:

- `BR-FE11-001`, `BR-FE11-026`: Admin-only access and the explicit safe response boundary.
- `FR-FE11-001`, `AC-FE11-001`: paginated list defaults, bounds, filters, search fields, and stable ordering.
- `FR-FE11-002`, `AC-FE11-002`: safe detail DTO, deterministic related summaries, and forbidden-field exclusion.
- `FR-FE11-015`, `FR-FE11-016`: authorization rejection and not-found behavior.
- `NFR-FE11-SEC-001`, `NFR-FE11-SEC-002`, `NFR-FE11-SEC-004..006`: server-side RBAC, boundary validation, parameterized SQL, and sensitive-field exclusion.
- `NFR-FE11-PERF-001`: apply pagination in SQL instead of materializing the full user table.

Primary source: `.sdd/specs/feat-user-role-management/SPEC.md`.

Cross-feature aggregate semantics come from:

- FE07: an active borrowing is a current `BorrowDetails.Status = BORROWED` record.
- FE08: an open reservation has status `ACTIVE` or `NOTIFIED`.
- FE09: an unpaid balance belongs to a fine with status `UNPAID`; Phase 1 has no valid partial-payment state.

## 3. Current Problem

The current managed-user mapper omits credentials but returns `phone` instead of the approved `phoneNumber` field. List search includes username, phone, address, and roles even though FE11 limits search to email, full name, and user ID. The service silently clamps invalid pagination instead of rejecting invalid input, list/detail routes have no focused validators, and a missing detail record returns `400 USER_NOT_FOUND` instead of `404`.

The current detail repository returns the same list-row shape and has no `relatedSummary`. The frontend uses the selected list row directly as detail, expects `phone`, and never calls the detail endpoint.

These gaps are the list/detail portions of `TD-014` and `TD-015`. `TD-012` remains open because the approved database has no persistence for librarian `department` or `specialization`.

## 4. Scope

### In Scope

- Replace managed-user response mapping with the explicit `UserManagementView` allowlist.
- Return `phoneNumber` instead of `phone` in managed-user responses.
- Keep roles as uppercase role-name strings in deterministic alphabetical order.
- Validate list pagination, status, role, and search at the HTTP boundary and service boundary.
- Restrict list search to email, full name, and user ID.
- Keep stable list ordering `CreatedAt DESC, UserId DESC`.
- Add a detail-only repository read that returns the safe DTO plus the three required aggregate fields.
- Return deterministic numeric zero values when aggregate source rows are absent.
- Return `404 USER_NOT_FOUND` for a valid positive user ID that does not exist.
- Update the frontend to omit UI sentinels from list queries, consume `phoneNumber`, fetch real detail data, and render the summaries.
- Add route, service, repository, and frontend tests through RED-GREEN TDD.
- Update FE11 planning, traceability, test strategy, changelog, and technical-debt records during implementation.

### Out Of Scope

- Database schema changes.
- Fake `department: null` or `specialization: null` placeholders. Those fields remain absent until `TD-012` is implemented through an approved schema change.
- User-information update behavior, optimistic concurrency, and no-op update handling.
- Account deactivation and credential invalidation.
- Account creation, setup resend, and role-mutation behavior.
- Admin dashboard, permissions, audit-log, and request-management screens.
- Changes to the feature-wide traceability status heuristic.

## 5. Architecture

The existing layered request flow remains:

```text
route validator
  -> userManagementController
  -> userManagementService
  -> userRepository
  -> parameterized SQL Server query
```

No new repository or dependency is introduced. `userRepository.js` remains the read owner because list and detail are closely related projections over the same user, profile, and role tables.

The repository keeps list/readback behavior separate from detail behavior:

- `listManagedUsers` returns paginated list DTOs without `relatedSummary`.
- `getManagedUserById` remains the safe non-detail readback used by existing mutation flows.
- A dedicated detail read returns the safe DTO plus `relatedSummary`, preventing detail-only fields from leaking into create, update, or role-mutation responses.

## 6. UserManagementView Contract

The list item and base detail object contain only:

```text
userId
email
username
fullName
phoneNumber
address
status
roles
createdAt
updatedAt
lastLoginAt
```

The mapper constructs this object field by field. It does not spread a database row and does not map a broad user object before deleting sensitive properties.

The response must never contain:

```text
passwordHash
raw password
raw or hashed auth token
credential token ID
refresh or session identifier
setup or reset link
provider payload
secret audit metadata
```

`department` and `specialization` are not returned in this slice because no approved schema column stores them. The API does not invent null placeholders for unavailable data.

## 7. List API Contract

Endpoint: `GET /api/users`

| Query | Contract |
| --- | --- |
| `page` | Optional. Defaults to `1` only when omitted. When supplied, it must be an integer greater than or equal to `1`. |
| `limit` | Optional. Defaults to `20` only when omitted. When supplied, it must be an integer from `1` through `100`. |
| `status` | Optional. Case-normalized to one of `ACTIVE`, `INACTIVE`, or `LOCKED`. |
| `role` | Optional. Case-normalized to one of `MEMBER`, `LIBRARIAN`, or `ADMIN`. |
| `search` | Optional. Trimmed to `1..200` characters when supplied. Searches only email, full name, or textual user ID. |

Invalid supplied values return `400 VALIDATION_ERROR`; they are not clamped, replaced with defaults, or treated as no filter. The UI-only `ALL` sentinel and an empty search string are omitted by the frontend instead of being sent to the server.

The repository uses typed parameters for all filter values. Result order is always:

```sql
ORDER BY CreatedAt DESC, UserId DESC
```

The response keeps the existing pagination envelope:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

`relatedSummary` is never present on list items.

## 8. Detail API And Aggregate Contract

Endpoint: `GET /api/users/{userId}`

The route accepts only a positive integer `userId`. An invalid ID shape returns `400 VALIDATION_ERROR`. A valid ID with no matching user returns:

```text
HTTP 404
code: USER_NOT_FOUND
message: User was not found.
```

The repository executes one detail query. The query reads the base safe fields and roles, then calculates the following aggregate subqueries for the same user:

| Field | Definition |
| --- | --- |
| `activeBorrowingCount` | Count `BorrowDetails` joined through the user's `BorrowRequests` where `BorrowDetails.Status = 'BORROWED'`. `OVERDUE` is derived in FE07 and is not a persisted status. |
| `unpaidFineTotal` | Sum `Amount - PaidAmount` for `Fines.Status = 'UNPAID'`. Under the FE09 Phase 1 invariant, valid unpaid fines have `PaidAmount = 0`; subtracting preserves the outstanding-balance meaning for legacy rows. |
| `openReservationCount` | Count `Reservations` where status is `ACTIVE` or `NOTIFIED`. |

SQL `COALESCE` supplies numeric zero when no matching rows exist. The JSON detail response adds exactly:

```json
{
  "relatedSummary": {
    "activeBorrowingCount": 0,
    "unpaidFineTotal": 0,
    "openReservationCount": 0
  }
}
```

No aggregate is loaded for the list endpoint.

## 9. Service And Validation Responsibilities

Route validation runs after authentication and Admin authorization. This preserves the existing behavior in which unauthenticated or non-Admin callers receive `401` or `403` before request-shape details are exposed.

The service will:

- Apply the same defaults and allowlists when called directly outside the HTTP route.
- Reject invalid direct-service inputs instead of silently normalizing them into valid values.
- Pass only normalized filters to the repository.
- Call the dedicated detail read for `getUser`.
- Map a missing detail result to `404 USER_NOT_FOUND`.

The slice does not change the not-found behavior of update or deactivation operations; those remain separately deferred.

## 10. Frontend Behavior

`userManagementApi.js` adds a focused detail request for `GET /users/{userId}`. The list request builder omits `role`, `status`, and `search` when their UI values mean no filter.

`UserManagement.jsx` will:

- Read `phoneNumber` for table, edit-form initialization, and detail rendering while continuing to send the existing `phone` request field for create/update endpoints.
- Call the detail endpoint when an Admin selects a user row.
- Open the detail drawer only after the detail response succeeds.
- Render the three `relatedSummary` values in the drawer.
- On `404`, keep the drawer closed, show a safe message, and reload the current list because the selected list row is stale.
- On other failures, keep the drawer closed and show the existing safe fallback message.

The detail request does not add new edit, deactivation, or role-management behavior.

## 11. Error And Security Contract

| Condition | HTTP | Code |
| --- | ---: | --- |
| Missing authentication | 401 | Existing authentication code |
| Authenticated non-Admin | 403 | `ADMIN_REQUIRED` |
| Invalid list query or user ID | 400 | `VALIDATION_ERROR` |
| Valid user ID not found on detail | 404 | `USER_NOT_FOUND` |
| Unexpected database failure | 500 | Existing generic internal error |

Errors returned to the client do not include SQL text, stack traces, credential fields, or repository metadata. All SQL values remain typed parameters; no query input is concatenated into SQL.

## 12. Testing Strategy

Implementation follows strict RED-GREEN TDD.

### Route Tests

- Accept omitted list parameters and forward canonical defaults.
- Accept each approved status and role value.
- Reject invalid, zero, negative, fractional, oversized, and non-numeric pagination values.
- Reject unapproved status/role values and search values outside `1..200` after trimming.
- Reject invalid detail IDs without calling the service.
- Preserve authentication and Admin authorization precedence over validation.

### Service Tests

- Apply defaults only to omitted values.
- Normalize approved status/role casing and trim search.
- Reject invalid direct-service input before repository access.
- Forward only the canonical list contract.
- Return the detail DTO on success and map a missing detail to `404 USER_NOT_FOUND`.

### Repository Tests

- Return only the explicit allowlist and use `phoneNumber`.
- Keep roles uppercase and alphabetically ordered.
- Keep list order stable and search limited to email, full name, and user ID.
- Keep `relatedSummary` absent from list/readback responses.
- Return all three detail aggregates with deterministic zero defaults.
- Verify aggregate status predicates match FE07, FE08, and FE09 semantics.
- Seed or mock a row containing password, token, session, setup-link, and audit-secret fields and prove none appear in the mapped response.
- Verify query inputs are parameterized.

### Frontend Tests

- Omit `ALL` filters and empty search from list requests.
- Render `phoneNumber` in the table and detail drawer.
- Request detail when a row is selected and render all summary values.
- Keep the drawer closed on failure.
- Reload the list after a detail `404`.

### Regression Validation

- Focused FE11 backend and frontend tests.
- Full backend test suite and coverage.
- Frontend lint, tests, and production build.
- Traceability enforcement.
- `git diff --check` and credential-pattern review.
- SQL-backed aggregate verification when SQL Server is available; otherwise record it as residual integration evidence rather than claiming it passed.

## 13. Documentation And Traceability

When implementation begins:

- Add a separately reviewable list/detail task group to FE11 `PLAN.md` and `TASKS.md`.
- Keep the whole-feature implementation state accurate; this bounded slice does not complete FE11.
- Update FE11 `TEST_PLAN.md` and `CHANGELOG.md`.
- Add `@spec` tags for `FR-FE11-001`, `FR-FE11-002`, `FR-FE11-015`, and `FR-FE11-016` at the relevant validation, service, and repository branches.
- Narrow `TD-014` and `TD-015` only for the list/detail evidence actually completed.
- Keep `TD-012` open and explicitly state that no librarian-field schema migration occurred.
- Do not expand this slice into a traceability-checker policy change.

## 14. Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Broad row mapping exposes a future credential column | Construct the DTO from an explicit field allowlist and test hostile extra columns. |
| Detail aggregates make every list row expensive | Keep aggregates detail-only and use one query for one selected user. |
| UI sends `ALL` or empty search and strict validation breaks current behavior | Omit UI sentinels before making the request. |
| Existing consumers still read `phone` | Migrate every FE11 list/detail/edit initialization read to `phoneNumber`; keep request payload naming unchanged. |
| Detail-only summaries leak into mutation readback | Use a dedicated detail repository operation rather than changing general readback shape. |
| FE07 persisted/derived status drift causes incorrect counts | Count only persisted `BORROWED`, matching the approved FE07 definition. |
| Missing librarian fields are represented inaccurately | Omit them and retain `TD-012`; do not fabricate null placeholders. |
| SQL Server is unavailable in CI | Unit-test mapper/query contracts and record SQL-backed aggregate validation as an explicit residual gap. |

## 15. Definition Of Done

This slice is complete only when:

- List and detail endpoints return only the approved safe fields.
- `phoneNumber` replaces `phone` in FE11 managed-user responses and consumers.
- Invalid list/detail inputs are rejected instead of clamped or broadened.
- List search and ordering match the approved FE11 contract.
- Detail returns the three deterministic aggregates and missing users return `404 USER_NOT_FOUND`.
- The frontend fetches and renders real detail data.
- Route, service, repository, and frontend RED-GREEN tests pass.
- Full regression, traceability, diff, and credential checks pass or any unavailable SQL evidence is explicitly reported.
- FE11 planning, task state, test plan, changelog, and technical debt are synchronized.
- A human reviews the implementation and validation evidence.
