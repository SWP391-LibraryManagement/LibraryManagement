# CHANGELOG.md - FE05 Book Management

## 2026-07-20 - Vietnamese UI localization and typography

- Localized frontend-generated labels, states, accessibility names, and safe error feedback for this feature.
- Preserved API contracts, raw enum values, permissions, business rules, and user-owned catalog/profile data.
- Applied the shared `Be Vietnam Pro` body and `Noto Serif` heading typography contract with Unicode-capable fallbacks.

## 2026-07-19 - Phase 3 Azure staging migration hardening

- Reproduced the staging schema drift where the deployed FE05 catalog query failed because `Books.RowVersion` was missing.
- Updated the approved FE05 reconciliation migration to drop and recreate `UX_Books_ISBN_NotNull` while narrowing legacy `Books.ISBN`, avoiding SQL Server error 4922 from the dependent filtered index.
- Applied all five approved reconciliation migrations twice to `LibraryManagementStaging`; the public catalog and the SQL-aware staging smoke check then passed.

## 2026-07-19 - Phase 2 Exit Closeout

- feat-book-management is accepted within the complete Phase 2 FE01-FE12 reconciliation recorded by PR #40/#41; validation and residual boundaries are consolidated in `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Deferred and future-scope limitations remain explicit and are not widened by this closeout.

## 2026-07-19 - Remove duplicate Admin Console book mutations

- Kept `UserManagement` Library book rows read-only and removed its create/edit/deactivate book controls.
- Removed the unused FE11 `adminApi` book mutation aliases; canonical `BookManagement` remains the only FE05 mutation surface.
- Added frontend regression coverage for the FE05/FE11 ownership boundary.

## 2026-07-19 - Hybrid reconciliation evidence

- Executed FE05-T001 through FE05-T008 from RED tests through focused verification in the isolated `feat/fe05-book-reconciliation` worktree.
- Reconciled frontend reads with `/api/admin/books`, server-owned pagination, canonical `{ items, pagination }`/`{ book }` responses, and `If-Match` version propagation.
- Added confirmation/reason UX for reasoned deactivate/reactivate commands and mapped `STALE_BOOK_STATE` to a truthful reload message.
- Added the missing FE05 SQL suite and fixed rowversion comparison to normalize raw `mssql` buffers instead of comparing driver binary strings with API hex versions.
- Passed focused backend 45/45, FE05 SQL 7/7, frontend 6/6, traceability 26/26, diff hygiene, and the aggregate 61/61 SQL gate with cleanup.
- Browser acceptance and human integration gates remain open.

## 2026-07-19 - Copy Ownership And Route Reconciliation In Progress

- Removed the FE05 availability mutation route and stopped the Book Management UI from changing physical-copy state.
- Added the canonical protected `/api/admin/books` list route and explicit deactivate/reactivate commands with required reasons.
- Changed public unavailable copy text to `Không khả dụng`; rowversion, atomic audit, deterministic queries, and remaining task evidence stay pending.

## 2026-07-18 - Librarian Book Management Navigation

- Added the dedicated Librarian sidebar entry and route `/librarian/books` for FE05 book management.
- Removed the previous redirect from `/librarian/books` to the FE09 fine page.
- Kept FE05 available only to authenticated Librarian/Admin roles through its dedicated page shell.

## 2026-07-18 - Catalog Metadata Creation Timestamps

- Added database-owned `CreatedAt` timestamps to categories, authors, and publishers.
- Updated protected metadata-management reads and creates to return the persisted timestamp.
- Replaced the admin UI placeholder with the formatted database timestamp.
- Enforced the existing inactive-book rule in FE07 borrowing and FE08 reservation creation while preserving inventory and historical reads.
- Added status-based deactivation for categories, authors, and publishers without cascading changes to existing books.

## 2026-07-17 - Phase 1 Baseline Approved

- Nhật approved the normalized FE05 specification, plan, and task boundary as the Phase 1 baseline; implementation tasks remain pending.

## 2026-07-17 - Final Contract Audit

- Made the staff book-list flow use the approved query filters and sort/order contract.
- Replaced non-verifiable search-performance wording with a database-filtering requirement.

## 2026-07-17 - Detail Contract Wording - v0.5.1

- Clarified that staff detail reads may return both `ACTIVE` and `INACTIVE` books; public callers still receive only active public-safe detail or `404`.
- Marked SPEC/PLAN/TASKS ready for human re-review; no implementation behavior or code changed.

## 2026-07-16 - Planning Human Review Approval

- Nhat approved the FE05 prototype-reconciliation plan and ordered task decomposition.
- Marked `PLAN.md` and `TASKS.md` as `APPROVED`; implementation tasks remain unchecked and have not started.

## 2026-07-16 - Implementation Planning Decomposition

- Replaced placeholder `PLAN.md` and `TASKS.md` with a `READY FOR REVIEW` reconciliation plan for approved SPEC v0.5.0.
- Added ordered RED/GREEN tasks for deterministic queries, metadata validation, SQL `rowversion`/`If-Match`, atomic audit writes, and dedicated deactivate/reactivate commands.
- Made removal of FE05 copy-status mutation ownership and replacement of prototype frontend expectations explicit, with all 61 BR/FR/AC requirements mapped to concrete tasks and verification gates.

## 2026-07-16 - Human Review Approval

- Nhat confirmed human review of revision v0.5.0.
- Marked `SPEC.md` and `CONTEXT.md` as `APPROVED` and completed the revision review gate.

## 2026-07-15 - Catalog Ownership and Deterministic Contract (v0.5.0)

- Removed FE05 copy-status mutation ownership and deleted the `/api/books/{bookId}/availability` contract.
- Defined public availability as a read-only aggregation of `Books.Status` and FE06-owned copy states.
- Formalized `ACTIVE`/`INACTIVE` deactivation/reactivation without rewriting copy, borrow, reservation, or history rows.
- Added SQL `rowversion`/`If-Match` stale-write protection, deterministic search/pagination/sort rules, and explicit rejection criteria for invalid pages/rating.
- Standardized the derived unavailable display label as `Không khả dụng` so reserved/damaged/lost/inactive copies are not mislabeled as borrowed.
- Added complete BR/FR/AC traceability with concrete planned test intents.

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
## 2026-07-18 - Librarian layout alignment

- Aligned the librarian book-management workspace with the shared cream-and-brown visual system.
- Clarified summary cards, search, filters, tables, buttons, and Vietnamese section labels without changing FE05 API behavior.
- Removed the duplicated inner module heading, made refresh reload both catalog metadata and book rows, and added eight-row management pagination.
- Renamed the destructive-looking Delete area to the actual soft-deactivation behavior while preserving catalog and workflow history.
- After creation, reset incompatible management filters and navigate to the page containing the new canonical book record.
- Display continuous row numbers across pages while retaining the immutable database BookId for API calls and cross-feature relationships.
## 2026-07-22

- Connected Librarian/Admin search, status, and category filters to the canonical staff book list.
- Removed staff-facing rating controls/details and book-status reason/confirmation inputs while preserving a generated audit reason.
- Added deployed metadata schema reconciliation for Authors, Publishers, and Categories.
- Added `Còn sách`/`Không khả dụng` catalog-status selection to the Librarian update form; the UI continues to use the dedicated version-safe reactivate/deactivate APIs and does not mutate physical-copy status.
- Documented that deployed Book Management requires both the FE05 rowversion migration and the library-metadata compatibility migration because code deployment does not apply SQL migrations.
