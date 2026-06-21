# TASKS.md - FE08 Reservation Management

Status: READY FOR REVIEW

Owner: Nhat

Updated: 2026-06-10

---

## 1. Backend Tasks

- [x] FE08-T01 Add reservation routes under `/api/reservations`.
- [x] FE08-T02 Add request validators for create, list, cancel, process, and process queue.
- [x] FE08-T03 Add role guard middleware for member/librarian/admin actions.
- [x] FE08-T04 Add reservation service rules for eligibility, duplicate active reservation, available-copy rejection, and max active limit.
- [x] FE08-T05 Add SQL repository methods for copy lookup, reservation CRUD, staff list, and queue hold.
- [x] FE08-T06 Add member endpoints: create reservation, list my reservations, cancel my active reservation.
- [x] FE08-T07 Add staff endpoints: list reservations, process one reservation, process next queue item.
- [x] FE08-T08 Create FE10 `RESERVATION_READY` notification request during queue processing.
- [x] FE08-T09 Write audit logs for create, cancel, and process actions.

## 2. Test Tasks

- [x] FE08-T10 Add in-memory reservation repository test helper.
- [x] FE08-T11 Test reservation creation, duplicate rejection, available-copy rejection, and 3-active limit.
- [x] FE08-T12 Test owner-only cancellation and repeated cancellation handling.
- [x] FE08-T13 Test staff listing and earliest eligible queue processing.
- [x] FE08-T14 Test notification request creation when a copy is held.
- [x] FE08-T15 Test authentication and role guards.

## 3. Frontend Tasks

- [x] FE08-T16 Implement member my reservations screen.
- [x] FE08-T17 Implement librarian reservation management screen.
- [x] FE08-T18 Implement librarian reservation queue processing screen.
- [x] FE08-T19 Wire frontend screens to backend APIs.
- [x] FE08-T20 Add accessibility: table captions, header scopes, form labels, keyboard support.
- [x] FE08-T21 Add loading, empty, and error states on all screens.

## 4. Validation

- [x] `npm test` in `backend`.
- [x] `npm.cmd --prefix frontend run lint` passed.
- [x] `npm.cmd --prefix frontend run build` passed.
- [x] Browser verification: tables, captions, labels, and keyboard navigation verified.

## 4. Traceability

| Spec ID | Covered by |
| --- | --- |
| BR-FE08-001 | FE08-T03, FE08-T15 |
| BR-FE08-002 | FE08-T03, FE08-T04, FE08-T11 |
| BR-FE08-003 | FE08-T06, FE08-T12 |
| BR-FE08-004 | FE08-T03, FE08-T07, FE08-T13 |
| BR-FE08-005 | FE08-T04, FE08-T11 |
| BR-FE08-006 | FE08-T04, FE08-T11 |
| BR-FE08-008 | FE08-T07, FE08-T13 |
| BR-FE08-009 | FE08-T06, FE08-T12, FE08-T13 |
| BR-FE08-012 | FE08-T08, FE08-T14 |
| FR-FE08-004 | FE08-T06, FE08-T12 |
| FR-FE08-005 | FE08-T07, FE08-T13 |
| FR-FE08-008 | FE08-T08, FE08-T14 |
| FR-FE08-010 | FE08-T06, FE08-T12 |

## 5. Still Outside This Slice

- FE07 return integration.
- FE10 delivery worker.
- Automatic expiration job.
