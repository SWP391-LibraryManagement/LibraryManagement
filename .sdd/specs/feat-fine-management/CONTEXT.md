# CONTEXT.md - FE09 Fine Management

# Version: 0.2.0

# Status: APPROVED - BASELINE 2026-07-17

# Owner: Dung

# Last Updated: 2026-07-17

# Feature folder: `.sdd/specs/feat-fine-management/`

---

## 1. Feature Purpose

Fine Management exists to calculate and track fines for overdue, lost, damaged, or other policy-violating borrowing outcomes.

This feature must keep three things consistent:

- Fine calculation must be traceable and testable.
- Fine payment/collection status must be recorded clearly.
- Borrowing and inventory workflows remain owned by FE07 and FE06.

FE09 is a Full Spec feature because wrong fine calculation affects member eligibility, financial records, borrowing restrictions, and reports.

---

## 2. Real-World Workflow

The typical fine workflow:

1. FE07 identifies a returned or active borrowed copy that is overdue, lost, or damaged.
2. FE09 calculates fine amount using approved policy.
3. FE09 creates or updates a fine record.
4. Member or librarian views fine information.
5. Librarian records fine collection if money is collected offline.
6. Librarian/admin marks the fine as paid when collection is complete.
7. FE10 may notify the member about overdue/fine information.
8. FE07 may read unpaid fine status to decide borrowing eligibility.

---

## 3. Feature Boundary

FE09 includes:

- View fine information.
- Calculate overdue fine.
- Record fine collection.
- Mark fine as paid.
- Store fine reason, amount, status, and payment timestamp.

FE09 does not include:

- Borrow/return approval and due date assignment. That belongs to FE07.
- Physical copy status management. That belongs to FE06.
- Online payment gateway. Out of scope for this project phase.
- Sending notifications. That belongs to FE10.
- Reporting dashboards. That belongs to FE12, although FE12 reads fine data.

---

## 4. Current Data Model Notes

The current SQL script includes:

- `Fines(FineId, UserId, BorrowDetailId, OverdueDays, RatePerDay, Amount, PaidAmount, Reason, Status, CalculatedAt, PaidAt, CreatedBy, CollectedBy, PaymentMethod, CreatedAt, UpdatedAt)`
- `BorrowDetails(BorrowDetailId, RequestId, CopyId, DueDate, ReturnDate, Status)`
- `BorrowRequests(RequestId, UserId, RequestDate, Status)`
- `BookCopies(CopyId, BookId, Barcode, Status, Location)`
- `Users(UserId, Username, Email, Phone, Status, CreatedAt)`

Project baseline decisions include:

- Overdue fine is 5,000 VND per overdue day per copy.
- Fine starts the day after the due date.
- The default loan duration is 14 calendar days, owned by FE07.
- A member with any `UNPAID` fine whose amount is greater than 0 is restricted from new borrowing and renewal in FE07.

Potential issues to review:

- Current SQL stores `PaidAmount`, `CollectedBy`, and `PaymentMethod`; it does not have a separate collection-note column.
- Current SQL does not define damaged/lost fine policy.
- Current SQL does not prevent duplicate fine records for the same borrow detail.
- Fine calculation date source is the server business date in `Asia/Ho_Chi_Minh`, not client input.
- Status values are `UNPAID`, `PAID`, `WAIVED`, and `CANCELLED`; all except `UNPAID` are terminal.
- Phase 1 has no partial payment: full offline collection sets `PaidAmount = Amount`, `CollectedBy`, `PaymentMethod`, `PaidAt`, and `Status = PAID` atomically.
- Collection notes are audit metadata because the current schema has no collection-note column.

These decisions are closed in SPEC v0.4.0 and must be reconciled against the existing server-side prototype before implementation is considered complete.

---

## 5. Main Use Cases From Assignment Sheet

Owner column reflects the current team redistribution.

| Use Case ID | Use Case Name | Owner |
| ----------- | ------------- | ----- |
| UC41 | View Fine Information | Dung |
| UC42 | Calculate Fine | Dung |
| UC43 | Record Fine Collection | Dung |
| UC44 | Mark Fine As Paid | Dung |

---

## 6. Feature Tests From Assignment Sheet

Owner column reflects the current team redistribution.

| Test ID | Test Name | Owner |
| ------- | --------- | ----- |
| FT42 | View fine information | Dung |
| FT43 | Calculate fine | Dung |
| FT44 | Record fine collection | Dung |
| FT45 | Mark fine as paid | Dung |

---

## 7. Key Risks

- Fine amount may be wrong if overdue days are calculated incorrectly.
- Duplicate fine records may charge a member twice for the same borrow detail.
- Payment collection may be recorded without proper authorization.
- Unpaid/paid status may become inconsistent if collection and paid marking are separate.
- Client-provided dates or amounts may allow tampering.
- Missing fine data may cause FE07 to allow borrowing when unpaid fines should block it.

---

## 8. Dependencies

| Dependency | Why It Matters |
| ---------- | -------------- |
| FE07 Borrowing Management | Provides due date, return date, borrow detail status, and member borrowing data. |
| FE06 Inventory / Book Copy Management | Provides copy condition/status for lost or damaged cases. |
| FE10 Notification Management | Sends overdue/fine notifications when requested. |
| FE11 User & Role Management | Provides librarian/admin permissions for collection and paid status. |
| FE12 Reporting & Statistics | Reads fine data for reports. |
| SQL Server database | Stores fine and borrowing data. |

---

## 9. Resolved Questions For Team / Teacher

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE09-001 | Phase 1 supports overdue fines only; lost/damaged fines are out of scope. | Review packet 2026-06-10 | APPROVED |
| Q-FE09-002 | Any UNPAID fine with amount greater than 0 blocks new borrowing and renewal. | Review packet 2026-06-10 | APPROVED |
| Q-FE09-003 | No partial payments in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE09-004 | Store collector ID and note with the fine payment record/table if payment tracking exists; otherwise store on fine record for Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE09-005 | Admin can waive/cancel fines with required reason and audit log. | Review packet 2026-06-10 | APPROVED |
| Q-FE09-006 | Fine calculation runs on return and may also run manually by librarian/admin; scheduled daily job is future work. | Review packet 2026-06-10 | APPROVED |
| Q-FE09-007 | Prototype UI may store fine records locally for demo continuity, but final FE09 behavior must use server-side calculation and persistence. | User correction 2026-06-21 | APPROVED |
| Q-FE09-008 | Phase 1 librarian collection resolves a full offline-paid overdue fine directly; no partial payment or admin confirmation/refusal step is required. | User correction 2026-06-30 | APPROVED |
| Q-FE09-009 | Librarian fine list defaults to stable FineId ascending order. | User correction 2026-06-30 | APPROVED |
| Q-FE09-010 | Overdue-day calculation uses the current server business date in `Asia/Ho_Chi_Minh`. | Nhat normalization review 2026-07-17 | APPROVED |

---

## 10. Notes For Implementation Later

- `SPEC.md` v0.4.0 is baseline-approved; implementation must follow the reconciled plan/tasks and remains pending.
- Use `Asia/Ho_Chi_Minh` server business dates for calculation.
- Do not trust client-provided amount or overdue-day values.
- Avoid duplicate active fines for the same borrow detail and reason under a database lock.
- Record full offline collection only; partial payment is not a Phase 1 state.
- Keep online payment out of scope.
