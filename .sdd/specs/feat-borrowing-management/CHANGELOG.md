# CHANGELOG.md - FE07 Borrowing Management

## 2026-06-25 - Clarified OVERDUE as a derived state (v0.3.1)

- Documented that `OVERDUE` is a derived state in Phase 1: the system does not persist
  `BorrowDetails.Status = 'OVERDUE'`; it is computed from a `BORROWED` detail with `dueDate < today`
  and consumed by FE09. A persisted OVERDUE status + scheduled job is deferred to a later phase.
- This aligns the spec with the current implementation (Validation Gate finding); no behavior change.

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

## 2026-06-20 - Frontend UI Implemented and Accessibility Validated

- Implemented member borrow request, borrowing history, librarian borrow request approval/rejection, return processing, and member borrowing details screens.
- Wired all frontend screens to backend APIs using axios and React hooks.
- Added table captions, column header scopes, accessible labels for date inputs, selects, pagination buttons, and icon controls.
- Added keyboard support for selectable table rows (Enter/Space).
- Added loading, empty, and error states on all reviewed screens.
- Validated: `npm.cmd --prefix frontend run lint`, `npm.cmd --prefix frontend run build`, `npm.cmd --prefix backend test`.
- Merged via PR #7 into `feat/fe07-fe08-fe10-fe12-ui-polish`.

## 2026-06-25 - Raised Unwanted (Error-Handling) Requirement Coverage

- Bumped version to 0.2.0 (MINOR); status unchanged (APPROVED).
- Added new sub-section "7.1 Unwanted Behaviour Requirements" with 9 EARS unwanted requirements (FR-FE07-014 to FR-FE07-022) covering borrow-limit overrun, ineligible/inactive member, unpaid fine/overdue blocking, invalid/duplicate/empty request items, copy unavailable at approval, concurrent approval race, disallowed renewal, invalid state/date transitions, and transaction rollback.
- Each new FR is written as `IF`/`WHERE [condition], the system shall ...` and traces to existing EC-*, BR-*, and AF-* sources (no new logic invented).
- Unwanted FR share raised from ~15% (2/13) to ~50% (11/22), meeting the ≥30% target.
- Extended Traceability Matrix (Section 16) with rows for FR-FE07-014 to FR-FE07-022 (Test Case = TBD).

## 2026-06-25 - Added Formal State Model (State Diagrams) for Both Lifecycles

- Bumped version to 0.3.0 (MINOR); status unchanged (APPROVED).
- Added new sub-section "10.3 State Model & Transition Rules" at the end of Section 10 Data Requirements, modeling FE07's two lifecycles separately.
- (A) BorrowRequest lifecycle: states PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED — with Mermaid `stateDiagram-v2`, state descriptions, valid transitions (From/To/Trigger/Condition/FR-BR), forbidden transitions, and invariants INV-FE07-A1..A6.
- (B) BorrowDetail lifecycle: states REQUESTED, BORROWED, RETURNED, LOST, DAMAGED, OVERDUE — with Mermaid `stateDiagram-v2`, descriptions, valid transitions, forbidden transitions, and invariants INV-FE07-B1..B8.
- All state values reuse the enums declared in Section 10.2 (no new status invented). Transitions trace to existing MF-*, FR-*, BR-*, AF-*, and EC-* sources.
- Documented enum-declared states without an explicit flow (request `CANCELLED`, detail `OVERDUE`) as modeled per the declared enum with their dependency on FE09 / Phase 2 confirmation noted.
