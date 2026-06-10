# CHANGELOG.md - FE07 Borrowing Management

## 2026-06-02

- Replaced old Borrow Book draft with FE07 Borrowing Management draft.
- Expanded scope to include borrow request, approval/rejection, return processing, renewal, and borrowing history.
- Added stable requirement IDs for business rules, functional requirements, acceptance criteria, edge cases, and open questions.

## 2026-06-10

- Updated API contract policy to allow approval in `SPEC.md` unless the team reintroduces a shared API contract document.
- Resolved FE07 borrow limit and default loan duration using shared Phase 1 decisions: 5 active borrowed copies and 14 calendar days.
- Resolved remaining FE07 open questions: 1 renewal, unpaid fines block borrowing/renewal, members create own requests, pending details use `REQUESTED`, requests auto-complete when all details are terminal, and FE09 owns fine creation.
- Approved FE07 `SPEC.md` for Phase 2 planning after flow review, API approval, FE08/FE09 dependency check, and acceptance-criteria testability review.

## 2026-06-10 - Backend Slice Ready For Review

- Added the FE07 backend plan and task checklist for Nhat's borrowing scope.
- Added borrow request, approval, rejection, return, renewal, history, audit, and notification handoff logic.
- Aligned the SQL script with approved borrow request/detail statuses.
- Added backend tests for borrowing rules, return/fine-review data, renewal, and role guards.
