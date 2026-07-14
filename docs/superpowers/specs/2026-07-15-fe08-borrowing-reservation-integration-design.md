# FE08 Borrowing-Reservation Integration Design

Date: 2026-07-15

Status: APPROVED BY NHAT FOR WRITTEN REVIEW

Branch: `docs/fe08-borrowing-reservation-integration`

## 1. Goal

Close the Phase 1 lifecycle gap between FE07 Borrowing and FE08 Reservation so that a member with a `NOTIFIED` reservation can borrow the held copy, while every other member remains blocked by reservation queue priority.

The solution must preserve FE07 as the owner of borrow creation and approval, preserve FE08 as the owner of reservation state, and preserve manual librarian queue processing.

## 2. Approved Product Decision

Nhat selected the FE07-owned fulfillment approach:

1. The notified member creates the normal FE07 borrow request for the held copy.
2. FE07 accepts a `RESERVED` copy only when its `NOTIFIED` reservation belongs to that member.
3. Librarian/admin approval atomically changes the borrow request/details/copy and the matching reservation to their completed states.
4. No FE08-specific fulfill endpoint and no automatic borrowing are introduced.

## 3. Current Failure Modes

The current contracts leave two end-to-end gaps:

- FE08 declares `NOTIFIED -> FULFILLED` when the held copy is borrowed, but FE07 accepts only `BookCopies.Status = AVAILABLE`. A held `RESERVED` copy therefore cannot reach `FULFILLED` through the approved borrow flow.
- FE07 makes a normally returned copy `AVAILABLE`, while FE08 queue processing is manual. Without a reservation-aware FE07 check, another pending borrow request can be approved before the queue is processed.

## 4. Scope

### In Scope

- Reservation-aware borrow request validation in FE07.
- Reservation-aware borrow approval validation under database locks.
- Atomic `NOTIFIED -> FULFILLED` transition during FE07 approval.
- Queue-priority protection while an `ACTIVE` reservation exists.
- Matching in-memory and SQL repository behavior.
- Audit metadata for reservation fulfillment.
- FE07/FE08 spec, plan, task, contract, route, service, repository, and concurrency tests required by this behavior.

### Out of Scope

- New database tables or columns.
- A new fulfillment HTTP endpoint.
- Automatic queue processing after return.
- Scheduled hold expiration.
- Partial approval of multi-copy borrow requests.
- Changes to FE09 fine calculation or FE10 notification delivery.
- Book-level reservation; Phase 1 remains copy-level by `CopyId`.

## 5. Ownership Boundaries

| Responsibility | Owner |
| --- | --- |
| Member eligibility, borrowing blockers, borrow limit, request creation, approval, due date | FE07 |
| Reservation queue order, hold selection, hold expiration, reservation lifecycle | FE08 |
| Copy status | FE06 data, changed only through approved FE07/FE08 transactions |
| Reservation-ready notification | FE10 request triggered by FE08 |
| Fine calculation | FE09 |

FE07 may update a reservation to `FULFILLED` only as part of a successful borrow approval for the same member and copy. It does not select queue entries, expire holds, or decide reservation priority order.

## 6. Borrowability Contract

FE07 classifies every requested copy for the requesting member before request creation and again during approval.

| Copy state | Reservation state for copy | Requesting member | Result |
| --- | --- | --- | --- |
| `AVAILABLE` | No `ACTIVE` or `NOTIFIED` reservation | Any eligible member | `NORMAL_AVAILABLE` - allowed |
| `AVAILABLE` | One or more `ACTIVE` reservations | Any member | Reject `RESERVATION_QUEUE_PRIORITY` |
| `RESERVED` | `NOTIFIED` reservation belongs to requester | Reservation owner | `HELD_FOR_MEMBER` - allowed |
| `RESERVED` | `NOTIFIED` reservation belongs to another member | Other member | Reject `COPY_NOT_AVAILABLE` |
| `RESERVED` | No matching `NOTIFIED` reservation | Any member | Reject `RESERVATION_STATE_CONFLICT` |
| `BORROWED`, `DAMAGED`, `LOST`, `INACTIVE` | Any | Any member | Reject `COPY_NOT_AVAILABLE` |

For an all-or-nothing multi-copy request, every copy must classify as either `NORMAL_AVAILABLE` or `HELD_FOR_MEMBER`. One blocked copy rejects the whole create or approval operation.

`ADMIN` and `LIBRARIAN` do not bypass queue ownership. Staff may approve the request, but the held reservation must belong to the member who owns the borrow request.

## 7. Request Creation Flow

`POST /api/borrow-requests` remains the only member borrow-request endpoint.

1. Authenticate the member and normalize unique `copyIds`.
2. Validate account, membership, overdue loan, unpaid fine, and borrow limit.
3. Load copy status plus any `ACTIVE`/`NOTIFIED` reservation claims.
4. Apply the borrowability contract.
5. Create one `PENDING` borrow request and `REQUESTED` details through the existing FE07 transaction.

Creating a request does not change copy or reservation state. The approval transaction remains the authority for the final handover.

## 8. Approval Transaction

`PATCH /api/borrow-requests/{requestId}/approve` keeps the existing endpoint and response shape.

The SQL transaction uses this lock order:

1. Pending `BorrowRequests` row.
2. Member/user rows and eligibility dependencies.
3. Blocking fines and overdue borrow details.
4. Requested `BorrowDetails` rows.
5. `BookCopies` rows in ascending `CopyId` order using `UPDLOCK, HOLDLOCK`.
6. `Reservations` rows for those copies using `UPDLOCK, HOLDLOCK` and the same copy order.
7. Active borrowed-copy count.

After all checks pass, the transaction:

1. Changes the request to `APPROVED`.
2. Changes requested details to `BORROWED` and assigns borrow/due dates.
3. Changes each copy to `BORROWED`.
4. Changes every matching requester-owned `NOTIFIED` reservation to `FULFILLED`.
5. Preserves `NotifiedAt` and `ExpiresAt` as historical hold evidence; `UpdatedAt` records fulfillment time.
6. Writes the existing borrow-approval audit and a `RESERVATION_FULFILL` audit for each fulfilled reservation.
7. Commits only after every update and audit succeeds.

Any failed check or write rolls back the request, details, copy statuses, reservation statuses, and audit records together.

## 9. Return And Manual Queue Handoff

FE07 continues to set a normal returned copy to `AVAILABLE`. FE08 remains manual in Phase 1.

Queue priority is protected as follows:

- While any `ACTIVE` reservation exists for that copy, FE07 rejects normal request creation and approval with `RESERVATION_QUEUE_PRIORITY`.
- Librarian/admin runs the existing FE08 queue action, which atomically changes the selected reservation to `NOTIFIED` and the copy to `RESERVED`.
- The selected member can then create a borrow request for that held copy.
- Expiration/cancellation may release the copy to `AVAILABLE`; if another `ACTIVE` queue entry remains, FE07 continues to block ordinary borrowing until staff processes the next queue entry.

This closes the return-to-queue race without changing the approved manual queue policy.

## 10. Concurrency Rules

- Queue hold and borrow approval lock `BookCopies` before `Reservations`, preventing opposite lock ordering.
- If queue processing wins first, approval re-reads `RESERVED` plus the selected `NOTIFIED` owner and applies the borrowability contract.
- If approval sees an `ACTIVE` queue entry before selection, it returns `RESERVATION_QUEUE_PRIORITY` and changes nothing.
- Two approvals for the same held copy cannot both succeed because the first changes the copy to `BORROWED` and the reservation to `FULFILLED` under locks.
- A concurrent hold expiration/cancellation and approval can have only one valid state transition; the loser re-reads and returns a safe conflict.

## 11. Error Contract

| Code | HTTP | Meaning |
| --- | --- | --- |
| `RESERVATION_QUEUE_PRIORITY` | `409` | An active reservation queue must be processed before ordinary borrowing. |
| `COPY_NOT_AVAILABLE` | `409` | Copy is not borrowable by this member in its current state. |
| `RESERVATION_STATE_CONFLICT` | `409` | Copy is `RESERVED` without a matching requester-owned `NOTIFIED` reservation. |
| `BORROW_REQUEST_NOT_PENDING` | `409` | Existing FE07 approval state conflict. |

Errors expose no member identity from another reservation. The client receives only the blocking reason needed to continue safely.

## 12. API And Schema Impact

- No new endpoint.
- No response DTO expansion is required.
- `POST /api/borrow-requests` continues to accept `{ copyIds: number[] }`.
- Approval continues to use the existing endpoint and optional notes.
- No schema migration. Existing `Reservations.Status = FULFILLED` and `BookCopies.Status = RESERVED/BORROWED` are sufficient.

## 13. Spec Changes Required

FE07 must explicitly allow:

- `AVAILABLE` with no queue claim; or
- `RESERVED` with a requester-owned `NOTIFIED` reservation.

FE07 must explicitly block `AVAILABLE` copies with an active reservation queue and must fulfill matching reservations during approval.

FE08 must explicitly define:

- FE07 approval as the trigger for `NOTIFIED -> FULFILLED`.
- The notified reservation owner as the only member allowed to borrow the held copy.
- Manual queue priority as a blocker for other FE07 create/approve actions.
- Cancellation as allowed from `ACTIVE` and `NOTIFIED`.
- Copy-level `CopyId` as the final Phase 1 API target.

## 14. Test Design

### Service And Route Tests

- Ordinary member cannot create a request for an `AVAILABLE` copy with an `ACTIVE` reservation queue.
- Notified owner can create a request for their `RESERVED` copy.
- Another member cannot create a request for that held copy.
- Approval of the notified owner's request changes reservation to `FULFILLED` and copy to `BORROWED`.
- Approval for a different member is rejected without exposing the reservation owner.
- Multi-copy approval rolls back when one copy has queue priority.
- Audit failure rolls back borrowing and reservation fulfillment.

### SQL Concurrency Tests

- Queue processing versus ordinary approval preserves reservation priority.
- Two approvals against one held copy permit only one success.
- Approval versus hold expiration/cancellation leaves one valid terminal outcome.
- Transaction failure leaves request `PENDING`, details `REQUESTED`, copy `RESERVED` or `AVAILABLE` as originally read, and reservation `NOTIFIED` or `ACTIVE` as originally read.

### Contract Tests

- OpenAPI and validators retain existing endpoints and payload shapes.
- Error resolver maps `RESERVATION_QUEUE_PRIORITY` and `RESERVATION_STATE_CONFLICT` to actionable Vietnamese copy.

## 15. Acceptance Criteria

- AC-INT-FE07-FE08-001: Given a copy with an active reservation queue, when another member creates or approves a borrow request, then the operation returns `409 RESERVATION_QUEUE_PRIORITY` and changes no record.
- AC-INT-FE07-FE08-002: Given a `NOTIFIED` reservation and a `RESERVED` copy, when the reservation owner creates a borrow request, then FE07 accepts the request without changing hold state.
- AC-INT-FE07-FE08-003: Given the reservation owner's pending request, when staff approves it, then request/details/copy/reservation/audits commit atomically and the reservation becomes `FULFILLED`.
- AC-INT-FE07-FE08-004: Given any failed validation, concurrent state change, or audit write, when approval runs, then all borrowing and reservation records remain consistent with the pre-transaction state.
- AC-INT-FE07-FE08-005: Given cancellation or expiration releases a held copy while another active queue entry remains, when an ordinary member attempts to borrow it before queue processing, then FE07 preserves queue priority.

## 16. Review Outcome

This design closes both identified FE07-FE08 blockers while preserving the approved Phase 1 manual queue, all-or-nothing borrowing, existing endpoints, and feature ownership boundaries.
