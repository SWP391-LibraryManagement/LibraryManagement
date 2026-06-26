# CHANGELOG.md - FE09 Fine Management

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
