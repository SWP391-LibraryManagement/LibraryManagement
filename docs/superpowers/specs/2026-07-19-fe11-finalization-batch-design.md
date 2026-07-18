# FE11 Finalization Batch Design

Status: WRITTEN SPEC REVIEW

Date: 2026-07-19

Base: `origin/main@f706c5457254db16401009e260dd9528aeb8c3c5`

Decision: Hybrid SDD + ADD, Full depth. Schema, authorization, optimistic concurrency,
credential invalidation, audit atomicity, and FE07 ownership are Core. Admin presentation and
CSV composition are Shell.

## 1. Goal

Complete the remaining approved FE11 User and Role Management requirements through B7 without
reopening already completed slices or duplicating FE07 borrowing business logic.

The batch closes the remaining FE11 implementation debt:

- `TD-012`: librarian `department` and `specialization` persistence.
- `TD-014`: incomplete update/deactivation not-found and transition semantics.
- `TD-015`: missing focused update/deactivation service coverage.
- `TD-016`: email length and optimistic-concurrency drift.
- `TD-017`: unsafe implicit frontend Admin development bypass.
- `TD-025`: incomplete canonical Request Management list/detail and terminal-state evidence.

`TD-021` remains a cross-feature residual only when a real SQL Server-backed CI environment is not
available. It does not authorize hiding an FE11 code, API, security, or browser-acceptance gap.

## 2. Existing Completed Boundaries

This batch preserves the B7-complete FE11 slices already on `main`:

- Admin-created account setup and resend.
- Transactional role assignment and revocation.
- Safe user list and detail DTOs.
- Admin role-action UI contract.
- Canonical Admin Audit Logs.
- Canonical user-list envelope with independent FE12 counters.
- Admin navigation and read-only permissions matrix.

The batch does not redesign these boundaries. Regression tests must prove they remain unchanged.

## 3. Delivery Structure

The batch uses four pull requests total:

1. Governance activation: this design, the implementation plan, task/debt activation, schema/API
   contract updates, and validation commands.
2. Wave A implementation: User Lifecycle Core.
3. Wave B implementation: Request Management and browser acceptance.
4. Documentation closeout: final B7 evidence and FE11 completion state.

One H1 governs the full batch. Each implementation wave receives one H2 before commit/push and one
H3 after required checks. The closeout receives its own H2/H3 because it changes authoritative
project memory.

## 4. Scope

### 4.1 Wave A - User Lifecycle Core

- Reviewable idempotent SQL Server migration and synchronized baseline schema.
- Direct FE10 recipient-email persistence synchronization required by the 255-character user email
  contract.
- Librarian field persistence on create, list/detail, and update.
- Canonical email length of 255 characters.
- Optimistic-concurrency and no-op user updates.
- Atomic user/librarian deactivation with credential invalidation and audit.
- Minimum FE07 member-lock-order alignment required to serialize approval against deactivation.
- Removal of implicit frontend Admin access when Vite is not in production mode.
- API/OpenAPI/model/test/documentation synchronization for the above behavior.

### 4.2 Wave B - Request Management And Acceptance

- Canonical Admin request-list validation, stable server pagination, and response envelope.
- Canonical Admin request-detail read boundary.
- FE11 safe projections over FE07 request data.
- FE07-owned approve/reject mutations with terminal-state enforcement.
- Admin UI migration to server pagination and authoritative detail loading.
- Filter-complete CSV export composed from the paginated read API.
- Feature-specific FE11 Playwright acceptance.

### 4.3 Out Of Scope

- Reactivating deactivated accounts in Phase 1.
- Permanent user deletion.
- Role CRUD, role hierarchy, or permission editing.
- New FE07 approval/rejection business rules or duplicate mutation endpoints under `/api/admin`.
- FE04 Membership removal or behavior changes.
- FE12 production changes.
- New migration framework or dependency.
- A new session table; deactivation invalidates credentials through the approved `AuthTokens`
  mechanism already used by FE02/FE11.
- Unrelated Admin Console refactoring.

## 5. Schema Contract

### 5.1 Canonical Columns

The Phase 1 SQL Server schema shall contain:

```text
Users.Email                    NVARCHAR(255) NOT NULL UNIQUE
Users.DeactivatedAt            DATETIME NULL
UserProfiles.Department        NVARCHAR(100) NULL
UserProfiles.Specialization    NVARCHAR(100) NULL
Notifications.RecipientEmail   NVARCHAR(255) NOT NULL
```

`Department` and `Specialization` are optional Librarian profile fields. Whitespace-only values are
stored as `NULL`. `DeactivatedAt` is `NULL` for active, locked, or setup-incomplete accounts and is
set only by the deactivation transaction. `Notifications.RecipientEmail` must widen with
`Users.Email`; otherwise an FE11 account can satisfy the 255-character user contract but fail when
FE10 persists its setup delivery.

### 5.2 Migration Artifact

Create a reviewable idempotent Phase 1 script:

```text
database/migrations/2026-07-19-fe11-finalization.sql
```

The script shall:

- Detect every column before adding or altering it.
- Preserve email uniqueness while widening the column to 255 characters.
- Use deterministic constraint/index names when a uniqueness object must be recreated.
- Fail before modification if existing data cannot satisfy the target schema.
- Be safe to execute twice without duplicate columns, constraints, or data mutation.
- Contain no seed user, credential, token, or real personal data.

The same canonical column definitions must be applied to `database/Librarymanagement.sql`, model
metadata, repository parameter bindings, ADR-002, and the affected FE02/FE03/FE10/FE11
specification data contracts. FE03 behavior does not expand: it must record that the two Librarian
columns are FE11-admin-managed and are not part of the self-profile read/update allowlist.

## 6. User Management Data Contract

### 6.1 Safe DTO

`UserManagementView` remains the only FE11 user response. The existing allowlist is preserved.

- `department` and `specialization` are returned only when the target currently has the
  `LIBRARIAN` role.
- They are omitted for non-Librarian targets, not returned as invented `null` placeholders.
- `deactivatedAt` remains an internal lifecycle field unless the approved FE11 SPEC safe DTO is
  explicitly revised before governance activation.
- Credential, token, session, provider, link, and secret audit fields remain forbidden.

### 6.2 Input Normalization

- Email is trimmed, normalized to lowercase, validated, and limited to 255 characters.
- `fullName` is trimmed, required, and limited to 100 characters, matching FE03 and the shared
  `UserProfiles.FullName` schema. Governance corrects the stale FE11 255-character data note.
- `department` and `specialization` are trimmed and limited to 100 characters each.
- Optional `phone`, `address`, `department`, and `specialization` whitespace-only input becomes
  `null`.
- `fullName` cannot normalize to an empty value.
- A non-Librarian target that receives `department` or `specialization` returns
  `400 VALIDATION_ERROR`; the server never silently discards the fields.
- All validation executes on the server before persistence.

## 7. Optimistic Update Contract

`PUT /api/users/{userId}` requires:

```json
{
  "expectedUpdatedAt": "2026-07-19T08:00:00.000Z",
  "fullName": "Optional Name",
  "phone": "0900000000",
  "address": "Optional Address",
  "email": "optional@example.test",
  "department": "Reference",
  "specialization": "Research Support"
}
```

Only `expectedUpdatedAt` is always required. At least one editable field must be present.

The transaction order is:

1. Authentication and Admin authorization.
2. Boundary validation and normalization.
3. Lock and revalidate the active acting Admin.
4. Lock and load the target safe state and current roles.
5. Return `404 USER_NOT_FOUND` when the target is absent.
6. Compare stored `UpdatedAt` with `expectedUpdatedAt`.
7. Return `409 STALE_USER_STATE` before any field or audit mutation when stale.
8. Validate Librarian-only fields against the locked roles.
9. Check normalized email uniqueness against other users inside the transaction.
10. Compute the effective field diff.
11. For a no-op, commit no mutation, write no success audit, and return the current safe DTO.
12. For an effective change, persist user/profile fields, advance `UpdatedAt`, write one allowlisted
    audit entry, and commit atomically.

The response is the updated `UserManagementView`, not a message-only object. Duplicate normalized
email returns `409 EMAIL_ALREADY_EXISTS`. Invalid input returns `400 VALIDATION_ERROR` with safe
field details. The database unique object remains the final concurrency guard; SQL Server duplicate
key errors `2601`/`2627` are mapped to the same safe `409 EMAIL_ALREADY_EXISTS` response.

The update success audit metadata contains only a stable sorted `changedFields` allowlist. It does
not copy email, phone, address, department, specialization, credentials, or before/after PII values
into the audit record.

## 8. Deactivation Contract

`PATCH /api/users/{userId}/status` accepts only:

```json
{
  "status": "INACTIVE",
  "expectedUpdatedAt": "2026-07-19T08:00:00.000Z"
}
```

Reactivation is not supported in Phase 1.

The deactivation transaction shall:

1. Authenticate and authorize Admin before detailed validation.
2. Validate a positive target ID, exact `INACTIVE` status, and `expectedUpdatedAt`.
3. Lock and revalidate the active acting Admin.
4. Lock and load the target.
5. Return `404 USER_NOT_FOUND` for an absent target or acting Admin.
6. Reject self-deactivation with `400 CANNOT_DEACTIVATE_SELF`.
7. Reject stale state with `409 STALE_USER_STATE` before mutation.
8. Distinguish the two logical `INACTIVE` modes using `DeactivatedAt`.
   - `INACTIVE` plus `DeactivatedAt IS NULL` is `PENDING_ACTIVATION`; reject with
     `409 ACCOUNT_PENDING_ACTIVATION` because Phase 1 has no approved pending-to-deactivated
     transition.
   - `INACTIVE` plus `DeactivatedAt IS NOT NULL` is already deactivated; return the current safe DTO
     idempotently with no timestamp, token, or audit mutation.
9. Only an `ACTIVE` or `LOCKED` target proceeds. Count active `BORROWED` details under the
   transaction and reject with `409 ACTIVE_BORROWINGS_EXIST`, including only the numeric count in
   safe error details.
10. Set `Status = 'INACTIVE'`, set server `DeactivatedAt`, and advance `UpdatedAt`.
11. Revoke every active `REFRESH` credential owned by the target through `AuthTokens`; the access
    token becomes unusable because authenticated requests require its active refresh/session ID.
12. Write one `USER_DEACTIVATE` audit entry containing only `previousStatus` and
    `newStatus: "INACTIVE"`.
13. Commit all changes together or roll back all changes on any failure.

Deactivation and FE07 approval must serialize on the same member-scoped user lock before either
path changes borrowing or account state. The implementation plan must compare the current FE07 SQL
lock order with approved `NFR-FE07-TXN-003`; Wave A includes only the minimum lock-order correction
required to prevent an approved borrow and a deactivation from both committing for the same user.
No FE07 eligibility or mutation rule changes.

The frontend reloads the authoritative target/list after success. It does not simulate status
changes locally before the server response.

## 9. Frontend Access Hardening

Remove the implicit rule:

```text
import.meta.env.MODE !== 'production' => grant Admin access
```

The Admin Console shall require the same canonical authenticated user and role state in every Vite
mode. Development tests may inject explicit test state through existing test helpers, but product
code shall contain no fallback that invents an Admin identity.

Missing/invalid identity redirects to the approved login/access-denied flow. This change does not
alter backend authentication or token storage.

## 10. Canonical Request List Contract

`GET /api/admin/requests` accepts only:

```text
page    positive integer, default 1
limit   integer 1..100, default 20
q       trimmed string 1..100 when supplied
status  PENDING | APPROVED | REJECTED | COMPLETED | CANCELLED
from    YYYY-MM-DD when supplied
to      YYYY-MM-DD when supplied, and from <= to
```

Authentication and Admin authorization execute before query validation. Unknown query fields are
ignored, matching the existing `matchedData` query-boundary policy; supported fields are always
taken from validated data rather than raw `req.query`. `from` and `to` are inclusive calendar-date
filters against `RequestDate`.

The response contains exactly:

```json
{
  "data": [
    {
      "requestId": 25,
      "requestDate": "2026-07-19T08:00:00.000Z",
      "status": "PENDING",
      "member": {
        "userId": 10,
        "fullName": "Member Name",
        "email": "member@example.test",
        "phoneNumber": "0900000000"
      },
      "itemCount": 2,
      "bookTitles": ["Book A", "Book B"],
      "categories": ["Category A"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

List ordering is stable: `RequestDate DESC, RequestId DESC`. Search covers only book title, member
full name, and member email. SQL parameters and escaped `LIKE` patterns are required. The data and
count query must use the same filter scope.

Pagination is applied to distinct `BorrowRequests` headers before child detail rows are joined, so
a page never cuts one request across pages. The count query counts distinct matching request IDs.
`bookTitles` is built from non-null detail titles in `BorrowDetailId ASC` order and preserves one
entry per detail; `categories` contains unique non-null category names in first-occurrence order.
The repository must group rows or use a structured SQL representation; it must not create these
arrays by splitting comma-delimited `STRING_AGG` output because valid titles/categories may contain
commas.

The frontend migrates from `fromDate`/`toDate` and client pagination to canonical `from`/`to` and
server pagination.

## 11. Canonical Request Detail Contract

Add `GET /api/admin/requests/{requestId}`.

- Authentication and Admin authorization run before parameter validation.
- A non-positive/non-integer ID returns `400 VALIDATION_ERROR`.
- A missing request returns `404 BORROW_REQUEST_NOT_FOUND`.
- FE11 reads through `borrowingRepository.findBorrowRequestById()` and projects an explicit safe
  Admin DTO. It does not duplicate FE07 request-detail SQL or mutation logic.

The response contains exactly:

```json
{
  "requestId": 25,
  "requestDate": "2026-07-19T08:00:00.000Z",
  "status": "PENDING",
  "createdAt": "2026-07-19T08:00:00.000Z",
  "updatedAt": null,
  "member": {
    "userId": 10,
    "memberId": 7,
    "fullName": "Member Name",
    "email": "member@example.test",
    "phoneNumber": "0900000000",
    "status": "ACTIVE"
  },
  "items": [
    {
      "borrowDetailId": 80,
      "copyId": 44,
      "barcode": "BC-0044",
      "title": "Book A",
      "author": "Author A",
      "location": "Shelf A",
      "status": "REQUESTED"
    }
  ],
  "lifecycle": {
    "approvedAt": null,
    "rejectedAt": null,
    "processedAt": null
  }
}
```

No password, token, session, raw audit metadata, internal credential ID, or unrelated profile field
is allowed.

## 12. Request Mutations And Terminal State

FE07 remains the only owner of:

```text
PATCH /api/borrow-requests/{requestId}/approve
PATCH /api/borrow-requests/{requestId}/reject
```

The Admin FE11 page continues to call those endpoints. No `/api/admin/requests/{id}/approve` or
`/reject` alias is added.

- Only `PENDING` requests expose approve/reject controls.
- Any non-`PENDING` direct mutation returns `409 BORROW_REQUEST_NOT_PENDING`.
- A mutation rejected because the current state is non-`PENDING` changes no
  request/detail/copy state and writes no success audit.
- The frontend loads authoritative detail when opening the modal.
- A successful mutation reloads the current paginated list and, if the modal remains open, reloads
  its authoritative detail before rendering success state.
- A failed mutation keeps the modal open, preserves the last successful detail, and displays the
  safe FE07 error.
- `APPROVED`, `REJECTED`, `COMPLETED`, and `CANCELLED` detail views are read-only.

## 13. CSV Export

No export endpoint or dependency is added. Export uses the canonical paginated list API:

1. Freeze the current validated filters.
2. Fetch all pages sequentially with `limit = 100`.
3. Stop when `data` is empty or `page >= totalPages`; this handles the canonical empty result where
   `totalPages` may be `0`.
4. Build CSV from the list DTO allowlist only.
5. Use stable columns `requestId`, `requestDate`, `status`, `memberUserId`, `memberName`,
   `memberEmail`, `memberPhoneNumber`, `itemCount`, `bookTitles`, and `categories`; join array values
   with ` | `.
6. Prefix a single quote to any cell whose first non-whitespace character is `=`, `+`, `-`, or `@`,
   then apply standard CSV quote/newline escaping.
7. Disable duplicate export clicks while the operation runs.
8. Abort and report a safe error if any page fails; do not download a partial file.

## 14. Testing Strategy

All implementation follows RED-GREEN TDD.

### 14.1 Wave A

- Static/idempotence tests for the migration script and baseline/model synchronization.
- Repository tests for locked actor/target state, stale update, duplicate email, no-op, Librarian
  field persistence, active-borrowing block, token revocation, audit, commit, and rollback.
- A concurrency test for deactivation versus FE07 approval proving both cannot commit for the same
  user and the final account/borrowing state remains valid.
- Service tests for deterministic safe error mapping and DTO allowlists.
- Route tests for Admin-first authorization and boundary validation.
- Frontend tests for `expectedUpdatedAt`, Librarian fields, authoritative reload, and removal of the
  implicit Admin bypass.
- Regression tests for account setup, role mutation, safe reads, Audit Logs, and Permissions.

### 14.2 Wave B

- Admin request-list validator, filter, stable pagination, and matching count/data scope tests.
- Request-detail authentication, authorization, ID, 404, projection, and forbidden-field tests.
- FE07 regression tests proving non-pending approve/reject returns `409` with no success mutation or
  audit.
- Frontend tests for canonical query names, server pagination, detail loading, terminal controls,
  failure preservation, and multi-page safe CSV export.
- Feature-specific Playwright Admin acceptance with isolated fixtures:
  1. Direct Admin Console access without identity redirects to the approved login/access-denied
     flow in the same Vite mode used by CI.
  2. Admin login opens All Users, updates an active Librarian's approved fields, reloads the
     authoritative detail, then deactivates that fixture and observes authoritative `INACTIVE`.
  3. Permissions loads through the canonical FE11 endpoint.
  4. Request Management uses server pagination, opens authoritative pending and terminal details,
     and exposes no approve/reject controls for the terminal request.
  5. CSV export traverses more than one fixture page and contains only the approved escaped columns.

### 14.3 Required Gates

Each implementation wave runs:

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
npm.cmd run test:e2e
```

Also require OpenAPI parse, backend import, `git diff --check`, exact scope comparison, product-drift
scan, and high-confidence secret/credential scan.

When a SQL Server environment is available, execute the migration twice and assert the five target
columns and email unique constraint. If no environment exists, retain the SQL-backed portion of
`TD-021` as an explicit cross-feature residual; static migration verification does not pretend to be
a live SQL execution.

## 15. Governance And Task Mapping

The governance activation adds these bounded tasks:

| Task | Scope | Debt |
| --- | --- | --- |
| `FE11-FIN01` | Activate the approved Finalization Batch contract | all batch debt |
| `FE11-LIFE01` | Add the reviewable schema migration and synchronized contracts | TD-012, TD-016 |
| `FE11-LIFE02` | Persist and return Librarian fields safely | TD-012 |
| `FE11-LIFE03` | Implement optimistic/no-op user updates | TD-014, TD-015, TD-016 |
| `FE11-LIFE04` | Implement atomic deactivation and credential invalidation | TD-014, TD-015, TD-016 |
| `FE11-LIFE05` | Align the Admin UI and remove implicit dev Admin access | TD-017 |
| `FE11-LIFE06` | Pass Wave A H2/H3/B7 integration | Wave A |
| `FE11-REQ01` | Canonicalize Admin request list and detail reads | TD-025 |
| `FE11-REQ02` | Align request detail, pagination, actions, and CSV UI | TD-025 |
| `FE11-REQ03` | Prove FE07 terminal-state immutability | TD-025 |
| `FE11-ACC01` | Pass FE11 browser acceptance and Wave B integration | TD-021, TD-025 |
| `FE11-FIN02` | Close final FE11 debt and publish B7 evidence | batch closeout |

Governance moves `TD-012`, `TD-014`, `TD-015`, `TD-016`, `TD-017`, and `TD-025` to `IN PROGRESS`
only after the activation PR merges. `TD-021` stays `PARTIAL` until its remaining cross-feature
evidence is actually available.

## 16. H1/H2/H3 Boundaries

H1 approves:

- This contract, two-wave dependency order, file ownership, schema/API names, and test commands.
- One governance activation diff and isolated implementation worktrees.
- Uncommitted RED-GREEN work inside the active wave after governance merges.

H1 does not approve:

- Product implementation commit/push/merge.
- Any schema/API/permission behavior not named in this design.
- Parallel edits to the same Core user repository, FE11 SPEC, or baseline SQL file.

H2 is required before each generated implementation diff is committed and published. H3 is
required after PR checks and before every merge. The closeout is documentation-only but still
requires H2/H3 because it changes FE11 completion and debt status.

## 17. File Ownership

The implementation plan must assign one serial Core owner per wave.

Wave A anticipated Core files:

```text
database/Librarymanagement.sql
database/migrations/2026-07-19-fe11-finalization.sql
.sdd/rfcs/ADR-002-database-design.md
.sdd/specs/feat-user-role-management/SPEC.md
docs/api/api-contract.md
backend/src/models/User.js
backend/src/models/UserProfile.js
backend/src/models/Notification.js
backend/src/docs/openapi.yaml
backend/src/validators/userManagementValidators.js
backend/src/repositories/userRepository.js
backend/src/repositories/accountSetupRepository.js
backend/src/repositories/notificationRepository.js
backend/src/repositories/borrowingRepository.js
backend/src/services/userManagementService.js
backend/src/routes/userManagementRoutes.js
frontend/src/api/userManagementApi.js
frontend/src/page/UserManagement.jsx
.sdd/specs/feat-auth/SPEC.md
.sdd/specs/feat-user-profile/SPEC.md
.sdd/specs/feat-notification-management/SPEC.md
```

Wave B anticipated Core files:

```text
docs/api/api-contract.md
backend/src/docs/openapi.yaml
backend/src/validators/adminValidators.js
backend/src/repositories/adminRepository.js
backend/src/services/adminService.js
backend/src/controllers/adminController.js
backend/src/routes/adminRoutes.js
frontend/src/api/adminApi.js
frontend/src/page/UserManagement.jsx
tests/e2e/fe11-admin-console.spec.js
tests/e2e/support/systemTestServer.js
```

Tests and governance files follow the owning production boundary. No other feature production file
may change unless the implementation plan identifies a direct approved dependency and its
regression command.

## 18. Risks And Mitigations

- Schema drift: one idempotent migration plus synchronized baseline/model/ADR tests.
- Lost update: locked `expectedUpdatedAt` comparison before any mutation.
- Partial deactivation: one SQL transaction for status, timestamp, credentials, and audit.
- Pending/deactivated ambiguity: use `DeactivatedAt` to reject pending activation and make only an
  already-deactivated account idempotent.
- Privilege bypass: remove implicit non-production Admin identity; keep server authorization.
- FE07 duplication: reuse FE07 read repository and mutation endpoints; FE11 owns only Admin DTOs.
- Cross-feature email truncation: widen FE10 recipient persistence/bindings with `Users.Email` and
  run account-setup delivery regression at the 255-character boundary.
- Approval/deactivation race: share the approved member-scoped lock order and prove the invariant
  with concurrency evidence.
- Pagination inconsistency: shared filter scope and stable tie-break ordering for data/count.
- CSV injection: allowlisted DTO fields plus formula-prefix escaping.
- Oversized PRs: fixed Wave A/Wave B boundaries and one Core owner at a time.
- Schedule pressure: no per-debt PRs, no unrelated refactor, and no new dependency/framework.

## 19. Definition Of Done

FE11 may move from `Implementation State: DEFERRED` to `COMPLETE THROUGH B7` only when:

- The governance activation, Wave A, Wave B, and closeout PRs are merged.
- Each exact merge commit has successful `main` CI evidence.
- All FE11 acceptance criteria have code/test traceability or explicit environment evidence.
- The schema/API/OpenAPI/baseline/model contracts agree.
- `FE11-FIN01..FE11-FIN02` and all intermediate tasks are complete.
- `TD-012`, `TD-014`, `TD-015`, `TD-016`, `TD-017`, and `TD-025` are resolved.
- No unresolved FE11 P1 product-code debt remains.
- `TD-021`, if still partial, names only the unavailable live SQL Server execution and not a
  missing FE11 browser or code requirement.
- FE04, FE07 mutation ownership, FE12 production behavior, and completed FE11 slices remain intact.

## 20. Approval Record

The human approved:

- A Full-spec FE11 Finalization Batch rather than presentation-only completion.
- The required schema migration.
- The recommended two-wave architecture.
- The data/transaction contract, including 100-character Librarian fields and idempotent repeated
  deactivation.
- FE11 Admin read ownership with FE07 mutation ownership.
- Canonical request list `from`/`to` plus server pagination alignment.
- The four-PR delivery sequence and final B7 closeout.

Written-file review remains required before implementation planning begins.

That review must explicitly confirm the self-review corrections discovered after the earlier
section approvals: FE10 recipient-email width synchronization, FE11 `fullName` max 100 alignment
with FE03, the pending-activation deactivation rejection, and the minimum FE07 lock-order dependency.
