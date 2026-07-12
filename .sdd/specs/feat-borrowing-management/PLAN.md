# PLAN.md - FE07 Borrowing Management

Status: READY FOR REVIEW

Owner: Nhat

Updated: 2026-07-12

---

## 1. Scope

Implement and harden the Phase 2 FE07 slice from the approved `SPEC.md`.

Included:

- Member creates borrow requests for available physical copies.
- Member views only their own borrowing history.
- Librarian/admin lists, approves, rejects, returns, and renews borrowing records.
- Return processing updates copy status and exposes fine-review data for FE09.
- Renewal checks overdue, unpaid fine, renewal limit, and FE08 reservation conflict.
- Borrowing actions write audit logs and create safe FE10 notification requests where useful.
- Frontend borrowing screens expose actionable loading, empty, permission, eligibility, invalid-state, and API error feedback.

Not included:

- FE09 fine calculation or fine creation.
- FE10 delivery worker implementation.
- Redesigning frontend screens outside FE07 borrowing workflows.
- Hardware/RFID flows.

---

## 2. Approved Rules Used

| Rule | Plan impact |
| --- | --- |
| Maximum active borrowed copies is 5 | Create and approve paths enforce the limit. |
| Default loan duration is 14 days | Approval sets due date to approval date + 14 calendar days. |
| One renewal per detail | Renew path increments `RenewalCount` once only. |
| Pending items use `BorrowDetails.Status = REQUESTED` | Database script and repository use the approved status. |
| Unpaid fine blocks borrowing/renewal | Service checks `Fines` before create and renew. |
| Reservation by another member blocks renewal | Service checks FE08 reservation state before renewal. |
| FE07 does not create fines | Return response exposes `fineCandidate`; no `Fines` insert is performed. |

---

## 3. Implementation Plan

### 3.1 API and Access Control

- Add `/api/borrow-requests`, `/api/borrow-details`, and `/api/members/{memberId}/borrowings`.
- Reuse FE02 authentication.
- Keep member actions scoped to the current member.
- Restrict staff actions to librarian/admin.

### 3.2 Borrow Request

- Validate `copyIds` and reject duplicates.
- Check active account and approved membership.
- Reject unavailable copies.
- Reject users blocked by overdue active loans or unpaid fines.
- Create `PENDING` request and `REQUESTED` details.

### 3.3 Staff Approval and Rejection

- Recheck member eligibility, borrowing blockers, copy availability, and borrow limit.
- Approve transactionally: request status, detail status, due date, copy status.
- Reject pending requests without changing copy status.

### 3.4 Return and Renewal

- Return updates detail status, return date, copy status, and request completion.
- Damaged/lost/overdue returns expose fine-review data only.
- Renewal extends due date by 14 days only when all rules pass.

### 3.5 Tests

- Add route tests with in-memory repositories.
- Cover create, duplicate copy, unavailable copy, approve, history, return, fine candidate, completion, renewal, reservation conflict, and role guards.
- Add focused frontend Node tests for borrowing API error messages and generic fallback behavior.

### 3.6 Frontend Error Handling

- Keep borrowing-specific error messages scoped to `borrowingApi` so other feature APIs retain generic handling.
- Translate FE07 role, eligibility, borrowing-limit, copy, return-state, and renewal-conflict codes into actionable Vietnamese messages.
- Preserve authentication, validation-detail, backend-message, and network fallbacks.

---

## 4. Review Notes

- `database/Librarymanagement.sql` is aligned with approved FE07 statuses.
- FE07 frontend screens and error states are implemented under FE07-T20 to FE07-T27.
