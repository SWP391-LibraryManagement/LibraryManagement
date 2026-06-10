# CONTEXT.md - FE07 Borrowing Management

# Version: 0.1.0

# Status: APPROVED

# Owner: Nhat

# Last Updated: 2026-06-10

# Feature folder: `.sdd/specs/feat-borrowing-management/`

---

## 1. Feature Purpose

Borrowing Management exists to control the movement of physical book copies from the library to members and back to the library.

This feature must keep three things consistent:

- The member's borrowing status.
- The physical copy status in inventory.
- The transaction history used later by fines, reports, and audits.

Because borrowing is the center of daily library operations, this feature is treated as a Full Spec feature.

---

## 2. Real-World Workflow

The typical small/medium library workflow:

1. A member wants to borrow one or more books.
2. The system or librarian checks whether the member is allowed to borrow.
3. The system checks whether each requested physical copy is available.
4. A borrow request is created.
5. A librarian approves or rejects the request.
6. If approved, the system records due dates and marks copies as borrowed.
7. Later, the member returns one or more copies.
8. The librarian records return condition: normal, damaged, or lost.
9. The system updates copy status and exposes overdue/lost/damaged data for Fine Management.
10. The member and librarian can view borrowing history.

---

## 3. Feature Boundary

FE07 includes:

- Create borrow request.
- Approve/reject borrow request.
- Process borrowed copy handover.
- Process return.
- Renew borrowed item.
- View member borrowing history.
- View borrowing information for librarian/admin.

FE07 does not include:

- Reservation queue ownership. That belongs to FE08.
- Fine calculation ownership. That belongs to FE09.
- Notification sending ownership. That belongs to FE10.
- User account/role management. That belongs to FE11.

---

## 4. Current Data Model Notes

The current SQL script includes:

- `BorrowRequests(RequestId, UserId, RequestDate, Status)`
- `BorrowDetails(BorrowDetailId, RequestId, CopyId, DueDate, ReturnDate, Status)`
- `BookCopies(CopyId, BookId, Barcode, Status, Location)`
- `Fines(FineId, UserId, BorrowDetailId, Amount, Reason, Status, PaidAt)`
- `AuditLogs(LogId, UserId, Action, CreatedAt)`

Potential issue to review:

- `BorrowDetails.Status` currently defaults to `BORROWED`. If members can create pending borrow requests before librarian approval, the team may need a `REQUESTED` detail status or a separate request-detail design.
- `BorrowRequests` has no rejection reason field.
- `BorrowDetails` has no renew count field.
- `AuditLogs` is simple and may need object ID or action type later.

These are not blockers for drafting, but they must be resolved before implementation.

---

## 5. Main Use Cases From Assignment Sheet

| Use Case ID | Use Case Name | Owner |
| ----------- | ------------- | ----- |
| UC29 | Create Borrow Request | Nhat |
| UC30 | View Borrowing History | Nhat |
| UC31 | Renew Borrowed Books | Nhat |
| UC32 | Process Borrow Request | Nhat |
| UC33 | Process Return Request | Nhat |
| UC34 | View Member Borrowing Information | Nhat |
| UC35 | Approve Borrow Request | Nhat |

## 6. Feature Tests From Assignment Sheet

| Test ID | Test Name | Owner |
| ------- | --------- | ----- |
| FT30 | Create borrow request | Nhat |
| FT31 | View borrowing history | Nhat |
| FT32 | Renew borrowed books | Nhat |
| FT33 | Process borrow request | Nhat |
| FT34 | Process return request | Nhat |
| FT35 | View member borrowing information | Nhat |
| FT36 | Approve borrow request | Nhat |

---

## 7. Key Risks

- Borrowing can corrupt inventory if copy status is not updated transactionally.
- Borrowing can corrupt fine/report logic if due date and return date are missing or wrong.
- A member may borrow beyond the allowed limit if active borrowed copies are not counted correctly.
- Concurrent approval can assign one physical copy to more than one member if availability is not rechecked at approval time.
- Renewal can conflict with reservations if another member is waiting for the book.

---

## 8. Dependencies

| Dependency | Why It Matters |
| ---------- | -------------- |
| FE02 Authentication | Identifies the current actor. |
| FE04 Membership Management | Confirms whether a user is an approved member. |
| FE06 Inventory / Book Copy Management | Owns physical copy statuses. |
| FE08 Reservation Management | May affect renewal priority. |
| FE09 Fine Management | Uses overdue/return data and may block borrowing. |
| FE10 Notification Management | Sends borrow, return, and renewal result notifications. |
| FE11 User & Role Management | Provides role permissions. |

---

## 9. Open Questions For Team / Teacher

| ID | Question | Owner | Status |
| -- | -------- | ----- | ------ |
| Q-FE07-001 | Maximum active borrowed copies per member? | Team/Teacher | Resolved: 5 active borrowed copies per member (DEC-GEN-001). |
| Q-FE07-002 | Default loan duration in days? | Team/Teacher | Resolved: 14 calendar days from borrow approval date (DEC-GEN-002). |
| Q-FE07-003 | Renewal limit per borrowed copy? | Team/Teacher | Resolved: 1 renewal per `BorrowDetail`, adding 14 calendar days from the current due date. |
| Q-FE07-004 | Does unpaid fine block borrowing? | Team/Teacher | Resolved: any `UNPAID` fine with amount greater than 0 blocks new borrowing and renewal. |
| Q-FE07-005 | Does member create request directly, or librarian creates request at desk? | Team/Teacher | Resolved: member creates own borrow request; librarian/admin approves, rejects, returns, renews, and views history. |
| Q-FE07-006 | Should pending request details use `REQUESTED` status or another table? | Team/DB owner | Resolved: use `BorrowDetails.Status = REQUESTED`; no extra request-detail table in Phase 1. |
| Q-FE07-007 | Should request status become `COMPLETED` automatically when all details are returned/lost/damaged? | Team | Resolved: yes, mark `BorrowRequests.Status = COMPLETED` when all details are terminal. |
| Q-FE07-008 | Should damaged/lost returns immediately create a fine record, or only expose data for FE09? | Team/Teacher | Resolved: FE07 records damaged/lost return data only; FE09 owns fine creation. |

---

## 10. Notes For Implementation Later

- FE07 `SPEC.md` is approved for Phase 2 planning.
- `PLAN.md` and `TASKS.md` may now be updated from the approved spec before implementation.
- Use database transactions for approve and return flows.
- Every API endpoint must validate role and input on the server.
