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
