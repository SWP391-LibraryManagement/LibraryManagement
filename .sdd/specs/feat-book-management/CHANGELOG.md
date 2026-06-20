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
