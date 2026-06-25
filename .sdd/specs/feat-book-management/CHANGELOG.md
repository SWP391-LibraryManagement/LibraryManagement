# CHANGELOG.md - FE05 Book Management

## 2026-06-02

- Created initial FE05 Book Management specification.
- Defined scope for book catalog management, including book listing, creation, update, and deactivation.
- Clarified actor responsibilities for Guest, Member, and Librarian.
- Added stable requirement IDs for business rules, functional requirements, acceptance criteria, edge cases, and open questions.
- Defined RESTful API considerations for book management operations.
- Added data model assumptions for Books, Categories, Authors, and Publishers entities.

## 2026-06-10

- Completed FE05 `SPEC.md` sections required by the SDD template: acceptance criteria, edge cases, data requirements, API contract, non-functional requirements, out of scope, dependencies, open questions, traceability, and review checklist.
- Aligned FE05 scope level with the Master Feature List as Standard Spec.
- Updated current data model notes to match the SQL script more closely.
- Updated API contract policy to allow approval in `SPEC.md` unless the team reintroduces a shared API contract document.

## 2026-06-10 - Phase 1 Review Decisions Approved

- Approved open-question decisions from `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Updated `SPEC.md` decision status from draft/proposed/open to approved where applicable.
- Preserved Phase 1 scope controls and deferred future-work items explicitly.

## 2026-06-21

- Updated FE05 deactivation behavior so `Delete Book` performs status-based catalog removal even when copies are currently borrowed or reserved.
- Clarified that borrow/reservation history and copy records remain unchanged when a book is hidden from the public catalog.
- Added staff update support for changing book `status` directly between `ACTIVE` and `INACTIVE`.
- Updated FE05 API contract and context notes to align with the implemented `/api/books/{bookId}` update payload.

## 2026-06-22

- Added prototype drift notes to `PLAN.md` and `TASKS.md`.
- Clarified that existing FE05 backend/frontend code is prototype/demo code until reconciled against approved tasks, traceability tags, role checks, audit logging, and tests.

## 2026-06-25

- Bumped `SPEC.md` version to 0.2.0 (MINOR) and updated Last Updated to 2026-06-25; Status unchanged (APPROVED).
- Increased the share of "Unwanted" (error/abnormal-condition) Functional Requirements to meet the EARS coverage target of >=30%.
- Added 9 new EARS Unwanted FRs (IF/WHERE form), each traceable to an existing Alternative Flow, Edge Case, or Business Rule — no new logic introduced:
  - FR-FE05-011: Reject duplicate ISBN on create/update (AF-FE05-001, EC-FE05-003, BR-FE05-005).
  - FR-FE05-012: Reject missing/empty title (EC-FE05-002, BR-FE05-006).
  - FR-FE05-013: Reject non-existent category/author/publisher reference (AF-FE05-002, EC-FE05-005/006/007).
  - FR-FE05-014: Return not-found for non-existent book on view/update/deactivate (AF-FE05-003, EC-FE05-001).
  - FR-FE05-015: Deny guest/member access to protected book management (AF-FE05-004, EC-FE05-009, BR-FE05-002/003/004).
  - FR-FE05-016: Reject invalid or future publish year (EC-FE05-008).
  - FR-FE05-017: Reject over-length search keyword (EC-FE05-011).
  - FR-FE05-018: Roll back book update and audit log on partial failure (EC-FE05-012, NFR-FE05-TXN-001).
  - FR-FE05-019: Prevent borrowing and hide INACTIVE books from public search while preserving history (BR-FE05-008/009, EC-FE05-010, Q-FE05-007).
- Updated Section 16 Traceability Matrix with the 9 new FRs (Test Case marked TBD).
- Result: total FRs 10 -> 19; Unwanted FRs 0 -> 9 (~47.4%).
