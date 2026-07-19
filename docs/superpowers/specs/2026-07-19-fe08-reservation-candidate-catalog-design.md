# FE08 Reservation Candidate Catalog Design

Date: 2026-07-19
Feature: FE08 Reservation Management
Debt: TD-028
Delivery: Hybrid SDD + ADD
Specification depth: Standard for the new API contract; implementation remains bounded by the approved FE08 Core contract.
Design status: APPROVED by user with `APPROVE TD-028 - Option A`

## 1. Context

FE08 reservation creation correctly targets a physical `CopyId`, and the mutation is already a protected,
server-validated `POST /api/reservations` operation. The member reservation screen still obtains its visible
candidate catalog from `DEMO_RESERVABLE`, which can drift from SQL state and can show copies that do not exist.

The surrounding contracts intentionally have different boundaries:

- FE01 public browse exposes book-level availability and does not expose physical copy identifiers.
- FE06 copy-detail reads are restricted to Librarian/Admin users.
- FE08 therefore needs a member-safe, read-only source of reservation candidates while keeping the approved
  `CopyId` mutation contract.

## 2. Decision

Add a protected member-only `GET /api/reservations/candidates` endpoint. It returns one row per eligible physical
copy with only the metadata needed to choose a reservation target. The endpoint is advisory: the existing create
mutation remains authoritative and rechecks all eligibility rules in the server transaction.

This decision does not widen FE01, grant members access to FE06 inventory, or change the reservation target from
`CopyId` to `BookId`.

## 3. Core Contract

### 3.1 Access

- Route: `GET /api/reservations/candidates`
- Authentication: required.
- Authorization: `MEMBER` required; Librarian/Admin access is not implied by this route.
- No reservation, audit, notification, or copy state is mutated.

### 3.2 Query

All query parameters are optional:

| Parameter | Type | Default | Rule |
| --- | --- | --- | --- |
| `q` | string | empty | Trimmed; maximum 200 characters; matches active book title or author name. |
| `page` | positive integer | 1 | Must be at least 1. |
| `limit` | integer | 20 | Must be between 1 and 100. |

Filtering and pagination are server-owned. The result is ordered deterministically by `Book.Title ASC`,
`Book.BookId ASC`, and `BookCopy.CopyId ASC`.

### 3.3 Candidate eligibility

A row is returned only when:

- The parent book has `Books.Status = 'ACTIVE'`.
- The physical copy has `BookCopies.Status IN ('BORROWED', 'RESERVED')`.
- The copy is not `AVAILABLE`, `DAMAGED`, `LOST`, or `INACTIVE`.

The `RESERVED` state is included because it represents an existing queue/hold target. The create mutation still
rejects a copy when its state changes or when the requesting member is no longer eligible.

### 3.4 Response envelope

Successful responses use the canonical server-backed list shape:

```json
{
  "data": [
    {
      "copyId": 12,
      "bookId": 4,
      "title": "Clean Code",
      "authorName": "Robert C. Martin",
      "copyStatus": "BORROWED",
      "activeReservationCount": 2
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

`authorName` may be `null`. `activeReservationCount` counts only `Reservations.Status = 'ACTIVE'` for the
candidate copy and is a queue summary, not a guarantee about the position the caller will receive after a future
mutation.

The response must not contain `barcode`, `location`, reservation owner information, member email, reservation
timestamps, internal rowversion values, or staff-only metadata.

### 3.5 Errors

- Unauthenticated request: existing generic `401` authentication envelope.
- Authenticated non-member: existing `403` authorization envelope.
- Invalid `q`, `page`, or `limit`: existing validation `400` envelope.
- No matching candidates: `200` with `data: []`, `total: 0`, and `totalPages: 0`.

## 4. Architecture and Data Flow

1. `MyReservationsPage` sends `reservationApi.listCandidates({ q, page, limit })`.
2. The route authenticates the caller, requires `MEMBER`, and validates query parameters.
3. The controller passes the normalized query to the reservation service.
4. The service delegates to a read-only repository method.
5. The repository uses parameterized SQL joining `Books`, `BookCopies`, and an aggregate of active
   `Reservations`; it returns only the safe projection above.
6. The service maps the rows into `{ data, pagination }`.
7. Selecting a row calls the existing `reservationApi.create(copyId)` mutation. The server revalidates book status,
   copy status, member eligibility, duplicate reservation, and the three-active-reservation limit.
8. After create or cancel, the page reloads canonical reservations and candidate data rather than mutating a local
   catalog.

No schema migration is required. All SQL must remain parameterized and the read path must not acquire mutation
locks or write audit records.

## 5. Frontend Boundary

`MyReservationsPage` will:

- Remove its import and use of `DEMO_RESERVABLE`.
- Keep search text in component state but send it as `q` to the server.
- Render loading, empty, validation-error, and request-error states from the candidate endpoint.
- Render server-provided `copyStatus` and `activeReservationCount`; it must not invent ETA values or availability
  counts from local data.
- Preserve the existing rule that an available copy is borrowed instead of reserved; candidates never include an
  available copy, and the mutation remains the final guard.
- Preserve the existing reservation lifecycle table, cancellation flow, and Vietnamese error isolation.

The documented temporary `DEMO_BORROW_CATALOG` remains outside this change. No other demo catalog is reintroduced.

## 6. Traceability and Artifacts

The implementation plan must update the following source-of-truth artifacts before code is considered complete:

- `.sdd/specs/feat-reservation-management/SPEC.md`: add the candidate endpoint, safe projection, and member-only
  boundary with stable requirement IDs.
- `.sdd/specs/feat-reservation-management/PLAN.md`: add the candidate catalog work and validation gates.
- `.sdd/specs/feat-reservation-management/TASKS.md`: add atomic backend, frontend, test, OpenAPI, and evidence tasks.
- `.sdd/specs/feat-reservation-management/CHANGELOG.md`: record the approved contract and removal of the static
  candidate source.
- `backend/src/routes/reservationRoutes.js`, controller, service, repository, validators, and OpenAPI.
- `backend/tests/reservationRoutes.test.js` and a SQL-backed candidate test suite.
- `frontend/src/api/libraryFeatureApi.js`, `frontend/src/page/reservation/MyReservationsPage.jsx`,
  `frontend/src/utils/libraryFeatureViewModels.js`, and focused frontend tests.
- `TECH_DEBT.md`: close TD-028 only after implementation and validation evidence pass.
- `.sdd/reviews/fe08-reservation-candidate-catalog-validation-2026-07-19.md` and the full acceptance packet.

## 7. Validation Design

### Backend unit/route checks

- Member can list candidates with the default envelope.
- Guest and non-member roles receive `401`/`403`.
- Invalid `q`, `page`, and `limit` are rejected.
- Search, fixed eligible statuses, deterministic order, pagination, and empty results are covered.
- The projection excludes barcode, location, owner, email, timestamps, and version fields.
- Candidate listing does not call create, audit, notification, or mutation repository methods.
- Existing create/cancel and role-guard regressions remain green.

### SQL-backed checks

- Seed active books with `AVAILABLE`, `BORROWED`, `RESERVED`, `DAMAGED`, `LOST`, and `INACTIVE` copies.
- Assert only active-book borrowed/reserved copies are returned.
- Assert active reservation counts are correct and terminal reservations are excluded.
- Assert search, stable ordering, pagination, and redacted projection against SQL Server.
- Use guarded synthetic cleanup and include the suite in the aggregate Live SQL evidence.

### Frontend and browser checks

- The page requests candidates from the API and never imports `DEMO_RESERVABLE`.
- Search sends `q` and renders server results; no browser-side filtering/slicing is authoritative.
- Empty/error/loading states are visible and safe.
- Selecting a candidate sends its real `copyId`; a successful reservation refreshes canonical server state.
- Focused frontend tests and the member reservation browser walkthrough pass on isolated ports.

### Final gates

- Backend regression, coverage, frontend regression, lint, build, system integration, SQL-backed suites, and E2E.
- Traceability enforcement, OpenAPI parse, secret/dependency/scope scans, and diff hygiene.
- Human Decision Gate A records this contract and Gate B re-runs after the implementation head is green.

## 8. Risks and Explicit Non-goals

- A candidate can become unavailable between listing and creation; this is expected and handled by the existing
  server conflict contract.
- Copy identifiers are exposed to authenticated members only because the approved mutation requires them; no
  physical-location or ownership information is exposed.
- This change does not add automatic queue processing, ETA prediction, notification workers, book-level reservation
  mutation, public copy identifiers, or a database migration.

