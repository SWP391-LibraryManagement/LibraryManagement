# CHANGELOG.md - FE09 Fine Management

## 2026-07-19 - Production Boundary Reconciliation In Progress

- Removed legacy create/update/delete fine routes from the production router and converted their tests to assert `404`.
- Enforced Phase 1 full-only offline collection by rejecting every client-supplied `collectedAmount`.
- Reconciled `TEST_PLAN.md` and the approved v0.4.1 review-gate decisions; timezone, pagination, concurrency, atomic audit, and full traceability tasks remain open.

## 2026-07-18 - Librarian Fine Page Restored

- Restored the `Quản lý tiền phạt` sidebar item and `/librarian/fines` page after clarifying that only the redundant embedded book workspace should be removed.
- Kept FE05 book management on its separate `/librarian/books` route.

## 2026-07-18 - Librarian Fine Navigation Separation

- Kept `/librarian/fines` as the dedicated FE09 workspace and preserved its Librarian sidebar entry.
- Removed the embedded FE05 book-management workspace from the fine page because FE05 now has its own `/librarian/books` sidebar route.

## 2026-07-17 - Phase 1 Baseline Approved

- Nhật approved the normalized FE09 accrual, payment, terminal-state, and server-boundary contract as the Phase 1 baseline; implementation follow-up remains pending.
- Closed the reconciliation-plan review gate while retaining the deferred frontend migration and pending implementation tasks.

## 2026-07-17 - Payment Storage Contract

- Chose `Fines` as the Phase 1 payment metadata owner; no separate payment table is required.
- Kept collection notes in safe audit metadata rather than the `Fines` table.

## 2026-07-17 - Fine Accrual And Payment Invariant Hardening

- Bumped `SPEC.md` to 0.4.1.
- Recalculation now updates an existing `UNPAID` fine in place instead of freezing an earlier amount.
- Terminal fines remain immutable; `PaymentMethod` and payment metadata invariants are explicit.

## 2026-07-17 - Deterministic Contract Normalization (v0.4.0)

- Resolved the conflict between the no-partial-payment decision and `collectedAmount`: Phase 1 now records one full offline collection with `PaidAmount = Amount` and `PAID` atomically.
- Added explicit admin waive/cancel contracts, deterministic pagination/order, `Asia/Ho_Chi_Minh` date policy, terminal conflict behavior, and complete requirement traceability.
- Replaced the high-level reconciliation plan/tasks with FE09-T013 through FE09-T020; historical TD-001/002/003 evidence remains separate from v0.4.0 completion.
- Updated `TEST_PLAN.md` with no-partial-payment, full metadata, timezone, atomicity, terminal-state, admin-resolution, pagination, and FE07/FE12 integration targets.
- Locked terminal conflicts to `409 FINE_NOT_COLLECTIBLE`, `409 FINE_NOT_PAYABLE`, and `409 FINE_NOT_RESOLVABLE`; locked reason validation to `REASON_REQUIRED` or `REASON_TOO_LONG`.
- Removed remaining optional audit/sort wording and made resolved fine visibility and terminal states explicit.
- Added explicit test-plan mappings for all FE09 security, transaction, performance, logging, usability, and business-time NFR IDs.
- Corrected `CONTEXT.md` to match the current SQL payment metadata fields while keeping collection notes in audit metadata only.

## 2026-06-10

- Created FE09 Fine Management feature specification structure.
- Established specification files: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md, and CHANGELOG.md.
- Updated current owner and assignment scope after team redistribution: UC41-UC44 and FT42-FT45 owned by Dung.
- Re-aligned FE09 owner with `Library Management (5).xlsx`.
- Applied shared Phase 1 baseline decision for overdue fine: 5,000 VND per overdue day per copy, starting the day after due date.
- Kept online payment gateway out of scope and limited FE09 to fine calculation, collection recording, and paid status.
- Clarified API contract policy so REST endpoints may stay in SPEC.md unless the team reintroduces a shared API contract file.
- Resolved FE09/FE07 borrowing-block dependency: any `UNPAID` fine with amount greater than 0 blocks new borrowing and renewal in FE07.

## 2026-06-10 - Phase 1 Review Decisions Approved

- Approved open-question decisions from `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Updated `SPEC.md` decision status from draft/proposed/open to approved where applicable.
- Preserved Phase 1 scope controls and deferred future-work items explicitly.

## 2026-06-21

- Added prototype alignment note: current FE09 UI may keep fine records locally for demo continuity, while the final implementation must use server-side calculation and persistence.
- Clarified that duplicate prevention, collection recording, and paid marking remain server-side responsibilities for the completed FE09 feature.

## 2026-06-22

- Added prototype drift notes to `PLAN.md` and `TASKS.md`.
- Clarified that existing FE09 backend/frontend code remains prototype/demo code until reconciled against approved tasks, server-side fine calculation/persistence, borrowing-block integration, authorization, traceability tags, and tests.

## 2026-06-25

- Added section `10.3 State Model & Transition Rules (Fine)` formalizing the `Fine.status` lifecycle (Mermaid `stateDiagram-v2`, state descriptions, valid/invalid transitions, and invariants).
- State set sourced directly from approved values in 10.2: `UNPAID`, `PAID`, `WAIVED`, `CANCELLED`. No `PARTIALLY_PAID` state per Q-FE09-003 (no partial payment in Phase 1).
- Documented idempotency / duplicate-prevention and `amount` immutability as explicit invariants and forbidden transitions; traced to FR/BR/AF/EC/NFR.
- Bumped version `0.1.0` → `0.2.0` (MINOR) and updated `Last Updated` to 2026-06-25; Status kept `APPROVED`.

## 2026-06-25 - Server-side implementation (TD-001/002/003)

- Implemented the production-aligned FE09 backend layer alongside the kept prototype (decision: "Backend + keep FE", owner Dung; implemented by Nhat):
  - `repositories/fineRepository.js` — DB access with transactions and locked duplicate-prevention.
  - `services/fineManagementService.js` — server-side overdue calculation (5,000 VND/day from the day after due date), duplicate prevention, collection (PAID iff fully collected), mark paid, admin waive/cancel, and audit logging.
  - `controllers/fineManagementController.js` + extended `routes/fineRoutes.js` exposing SPEC §11 endpoints (`/calculate`, `/me`, `/{id}/collections`, `PATCH /{id}/paid`, waive/cancel); legacy CRUD routes kept for the demo UI.
- Computed amounts no longer trust client input (BR-FE09-007/008, NFR-FE09-SEC-004).
- Tagged FR-FE09-001..010 with `@spec` → 100% traceability; added `tests/fineManagementRoutes.test.js` (11 tests, AC-FE09-001..010) with an in-memory repository double.
- Updated `database/Librarymanagement.sql` `CK_Fines_Status` to include `CANCELLED` (matches the §10.3 state model).
- `PLAN.md`/`TASKS.md` moved NOT STARTED → READY FOR REVIEW; TD-001/002/003 closed. Frontend alignment remains TD-004.

## 2026-06-30

- Bumped `SPEC.md` version to 0.3.0 and updated Last Updated to 2026-06-30.
- Clarified the Phase 1 fine collection workflow: librarian/admin records offline collection; full collection resolves the fine as `PAID`; no admin confirm/refuse payment sidebar step is required unless approved later.
- Added stable fine-list ordering guidance: librarian fine list defaults to fine ID ascending.
- Added BR-FE09-017..018, FR-FE09-011..013, AC-FE09-011..012, EC-FE09-011, and Q-FE09-008..009.
- Updated the `/api/fines` API contract to include `q?` and `sort?` with default fine ID ascending order.
## 2026-07-18 - Librarian layout alignment

- Aligned fine statistics, policy guidance, forms, detail cards, and action buttons with the shared librarian cream-and-brown visual system.
- Improved component spacing and hierarchy without changing FE09 calculation or persistence behavior.
- Replaced the browser-storage demonstration screen with the canonical FE09 server workflow and removed the demonstration-data notice.
- Connected the staff list to SQL-backed fine, member, borrowing-detail, book, and barcode fields with ascending FineId ordering, search, status filtering, refresh, and pagination.
- Replaced arbitrary edit/delete controls with traceable state transitions: calculate, full offline collection/mark-paid, plus Admin-only waive/cancel with a required reason.
