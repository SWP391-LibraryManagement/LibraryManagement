# Member Rejected Borrow Status Design

Date: 2026-07-22

Status: APPROVED BY NHAT

## 1. Goal

Ensure that a member sees `Đã từ chối` in borrowing history after a Librarian or Admin rejects the member's pending borrow request.

The change must preserve the separate FE07 request and detail lifecycles, the existing database schema, and the canonical detail-status history filters.

## 2. Root Cause

Rejection persistence already works correctly:

- `BorrowRequests.Status` changes from `PENDING` to `REJECTED`.
- The associated `BorrowDetails.Status` remains `REQUESTED`, as required by the current detail-state enum.
- The history SQL query already selects `BorrowRequests.Status AS RequestStatus`.

The defect occurs at the read-model boundary. `mapBorrowDetail` discards `RequestStatus`, so `/api/borrow-requests/me` returns only the detail status `REQUESTED`. The member frontend maps that value to `Pending`, which is displayed as `Chờ xử lý`.

## 3. Approved Approach

Extend the borrowing-detail read model with `requestStatus` and use it only to resolve the member-visible status of rejected requests.

For a history row:

1. If `requestStatus === 'REJECTED'`, the effective UI status is `Rejected`.
2. Otherwise, the effective UI status continues to come from the detail status, including derived `OVERDUE` behavior.

This approach does not overwrite `BorrowDetail.status` and does not introduce `REJECTED` into the persisted detail-state enum.

## 4. Scope

### In Scope

- Expose `requestStatus` from the SQL and in-memory borrowing-detail mappers.
- Document `requestStatus` in the FE07 response contract.
- Make member history map rejected requests to the existing `Rejected` UI state and Vietnamese label `Đã từ chối`.
- Add backend, frontend, and OpenAPI regression tests.
- Update the FE07 SPEC and CHANGELOG for the observable read-model behavior.

### Out of Scope

- Database schema changes.
- Updating `BorrowDetails.Status` during rejection.
- Adding new request or detail enum values.
- Adding a rejected-history tab or changing the accepted `status` query filter values.
- Displaying or persisting a rejection reason to members.
- Changing Librarian/Admin rejection behavior.

## 5. Data And API Contract

Borrow-detail responses gain one request-level field:

```json
{
  "borrowDetailId": 41,
  "requestId": 17,
  "status": "REQUESTED",
  "requestStatus": "REJECTED"
}
```

`status` remains the canonical detail status and continues to accept only `REQUESTED`, `BORROWED`, `RETURNED`, `LOST`, `DAMAGED`, and derived `OVERDUE` where applicable.

`requestStatus` reports the owning request state: `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`, or `CANCELLED`.

The `/api/borrow-requests/me` and `/api/members/{memberId}/borrowings` query contract remains unchanged. Filtering still operates on detail status, so this fix does not add `REJECTED` as a history filter value.

## 6. Backend Design

The SQL queries require no change because both borrowing-detail selects already include `br.Status AS RequestStatus`.

The production `mapBorrowDetail` mapper will copy `row.RequestStatus` to `requestStatus`. The in-memory mapper will look up the owning request and expose the same field so route tests preserve SQL/in-memory parity.

The rejection transaction remains unchanged. It continues to update only the request header and audit state, leaving requested details in their approved persisted state.

## 7. Frontend Design

`mapBorrowDetailsToHistoryRows` will derive an effective display status:

```text
requestStatus is REJECTED -> Rejected
otherwise                 -> existing detail-status mapping
```

The existing localization already maps `Rejected` to `Đã từ chối`, so no new translation key is required. Rejected rows remain non-renewable because renewal is still enabled only for details whose persisted status is `BORROWED`.

Other screens that consume borrow details retain their current detail-state behavior unless they explicitly use the new request-level field.

## 8. Error And Compatibility Behavior

- Existing clients that ignore unknown response properties remain compatible.
- Existing detail-state filters and pagination remain unchanged.
- A missing `requestStatus` from an older or partial payload falls back to the existing detail-status mapping.
- No rejection reason or staff identity is exposed by the new field.

## 9. Test Design

### Backend Route Regression

1. Member creates a borrow request.
2. Librarian rejects it with a valid reason.
3. Member loads `/api/borrow-requests/me`.
4. The returned row keeps `status: 'REQUESTED'` and reports `requestStatus: 'REJECTED'`.

This test proves both lifecycle integrity and the fixed read contract.

### Frontend Mapper Regression

- A detail with `status: 'REQUESTED'` and `requestStatus: 'REJECTED'` maps to UI status `Rejected`.
- A normal pending detail without rejected request state still maps to `Pending`.
- Existing borrowed, overdue, returned, damaged, and lost mappings remain unchanged.

### Contract Regression

- OpenAPI documents `BorrowDetail.requestStatus` with the request-status enum.
- Focused FE07 backend and frontend tests pass.
- Frontend lint/build, traceability enforcement, and diff hygiene pass before completion is claimed.

## 10. Acceptance Criteria

- Given a member's pending borrow request, when a Librarian or Admin rejects it and the member reloads borrowing history, then every detail belonging to that request displays `Đã từ chối` instead of `Chờ xử lý`.
- The rejected request remains `REJECTED` and its details remain `REQUESTED` in persistence.
- Pending requests that have not been rejected continue to display `Chờ xử lý`.
- No database schema, filter enum, pagination, permission, or rejection-transaction behavior changes.

## 11. Review Outcome

Nhat approved the read-model approach on 2026-07-22. The implementation should be a surgical FE07 change with test-first verification and no edits to unrelated in-progress authentication or admin-console work.
