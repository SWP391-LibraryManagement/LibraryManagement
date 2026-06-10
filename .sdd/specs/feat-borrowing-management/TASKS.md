# TASKS.md - FE07 Borrowing Management

Status: READY FOR REVIEW

Owner: Nhat

Updated: 2026-06-10

---

## 1. Backend Tasks

- [x] FE07-T01 Add borrowing routes from the approved API contract.
- [x] FE07-T02 Add validators for request IDs, detail IDs, copy IDs, statuses, dates, reject reason, return condition, and notes.
- [x] FE07-T03 Add borrowing service rules for member eligibility, borrow limit, unpaid fine, overdue loan, copy availability, and duplicate request items.
- [x] FE07-T04 Add SQL repository methods for borrow request creation, listing, approval, rejection, return, and renewal.
- [x] FE07-T05 Add member endpoints for create request and own history.
- [x] FE07-T06 Add staff endpoints for list requests and member borrowing info.
- [x] FE07-T07 Add approval flow that marks details `BORROWED`, sets due dates, and marks copies `BORROWED`.
- [x] FE07-T08 Add rejection flow for pending requests.
- [x] FE07-T09 Add return flow for normal, damaged, and lost returns.
- [x] FE07-T10 Add renewal flow with one-renewal limit and FE08 reservation conflict check.
- [x] FE07-T11 Expose fine-review data without creating FE09 fine rows.
- [x] FE07-T12 Write audit logs for create, approve, reject, return, and renew.
- [x] FE07-T13 Align SQL script with approved FE07 statuses.

## 2. Test Tasks

- [x] FE07-T14 Add in-memory borrowing repository helper.
- [x] FE07-T15 Test create request, duplicate copy rejection, and unavailable copy rejection.
- [x] FE07-T16 Test approval and member-only history.
- [x] FE07-T17 Test return processing, completed request update, and fine candidate output.
- [x] FE07-T18 Test renewal success, renewal limit, and reservation conflict.
- [x] FE07-T19 Test authentication and role guards.

## 3. Validation

- [x] `npm test` in `backend`.

## 4. Traceability

| Spec ID | Covered by |
| --- | --- |
| BR-FE07-004 | FE07-T03, FE07-T15 |
| BR-FE07-005 | FE07-T03, FE07-T07 |
| BR-FE07-007 | FE07-T03, FE07-T15 |
| BR-FE07-009 | FE07-T07, FE07-T16 |
| BR-FE07-011 | FE07-T09, FE07-T17 |
| BR-FE07-014 | FE07-T11, FE07-T17 |
| BR-FE07-015 | FE07-T10, FE07-T18 |
| BR-FE07-018 | FE07-T10, FE07-T18 |
| BR-FE07-019 | FE07-T04, FE07-T15 |
| BR-FE07-020 | FE07-T09, FE07-T17 |
| BR-FE07-021 | FE07-T11, FE07-T17 |
| FR-FE07-010 | FE07-T05, FE07-T16 |
| FR-FE07-011 | FE07-T06 |
| FR-FE07-013 | FE07-T09, FE07-T17 |

## 5. Still Outside This Slice

- Frontend borrowing screens.
- FE09 fine creation.
- FE10 delivery worker.
