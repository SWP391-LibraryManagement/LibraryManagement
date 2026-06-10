# CONTEXT.md - FE09 Fine Management

# Version: 0.1.0

# Status: DRAFT

# Owner: Long

# Last Updated: 2026-06-10

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

- `Fines(FineId, UserId, BorrowDetailId, Amount, Reason, Status, PaidAt)`
- `BorrowDetails(BorrowDetailId, RequestId, CopyId, DueDate, ReturnDate, Status)`
- `BorrowRequests(RequestId, UserId, RequestDate, Status)`
- `BookCopies(CopyId, BookId, Barcode, Status, Location)`
- `Users(UserId, Username, Email, Phone, Status, CreatedAt)`

Project baseline decisions include:

- Overdue fine is 5,000 VND per overdue day per copy.
- Fine starts the day after the due date.
- The default loan duration is 14 calendar days, owned by FE07.
- A member with unpaid fines may be restricted from borrowing.

Potential issues to review:

- Current SQL does not store payment amount, collected by, or collection note separately.
- Current SQL does not define damaged/lost fine policy.
- Current SQL does not prevent duplicate fine records for the same borrow detail.
- Fine calculation date source must be server-controlled, not client-controlled.
- Status values need to be standardized.

These are not blockers for drafting, but they must be resolved before implementation.

---

## 5. Main Use Cases From Assignment Sheet

| Use Case ID | Use Case Name | Owner |
| ----------- | ------------- | ----- |
| UC41 | View Fine Information | Long |
| UC42 | Calculate Fine | Long |
| UC43 | Record Fine Collection | Long |
| UC44 | Mark Fine As Paid | Long |

---

## 6. Feature Tests From Assignment Sheet

| Test ID | Test Name | Owner |
| ------- | --------- | ----- |
| FT42 | View fine information | Long |
| FT43 | Calculate fine | Long |
| FT44 | Record fine collection | Long |
| FT45 | Mark fine as paid | Long |

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

## 9. Open Questions For Team / Teacher

| ID | Question | Owner | Status |
| -- | -------- | ----- | ------ |
| Q-FE09-001 | Are damaged/lost fines in Phase 1, or only overdue fines? | Team/Teacher | Open |
| Q-FE09-002 | Does any unpaid fine block new borrowing, or only fines above a threshold? | Team/Teacher | Open |
| Q-FE09-003 | Should fine collection store collected amount, collector, and note? | Team/Teacher | Open |
| Q-FE09-004 | Can fines be waived/cancelled by Admin? | Team/Teacher | Open |
| Q-FE09-005 | Should fine calculation run on return only, scheduled daily, or both? | Team/Teacher | Open |

---

## 10. Notes For Implementation Later

- Do not implement until `SPEC.md` is reviewed and approved.
- `PLAN.md` and `TASKS.md` stay `NOT STARTED` until approval.
- Use server-side dates for calculation.
- Do not trust client-provided fine amount for calculation.
- Avoid duplicate active fines for the same borrow detail and reason.
- Keep online payment out of scope.
