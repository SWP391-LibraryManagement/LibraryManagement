# PLAN.md - FE09 Fine Management

Status: READY FOR REVIEW

Owner: Dung (server-side layer implemented by Nhat on 2026-06-25, see CHANGELOG)

> Execution plan for the production-aligned FE09 layer (SPEC §11.1). Scope of this iteration:
> backend server-side calculation, collection, paid-marking, waive/cancel, and audit. The legacy
> prototype (`fineService.js` + CRUD routes + `FineManagement.jsx`) is intentionally kept so the
> demo UI keeps working; aligning the frontend to the new API is tracked as TD-004 (follow-up).

## 1. Architectural Approach

Layered, matching FE07/FE08: Router → Controller → Service → Repository.

- The server-side workflow is added **alongside** the prototype, not replacing it, to avoid breaking
  the current `FineManagement.jsx` (decision: "Backend + keep FE", 2026-06-25).
- The service is a factory with dependency injection (`createFineManagementService`) so it can be
  unit-tested with in-memory doubles, exactly like borrowing/reservation.
- Fines are **computed server-side** from stored `BorrowDetails` due/return dates; client-supplied
  `amount`/`overdueDays` are ignored (BR-FE09-007, BR-FE09-008, NFR-FE09-SEC-004).

## 2. Components

| Component | Responsibility | File |
| --------- | -------------- | ---- |
| fineRepository | DB access + transactions for fines and borrow-detail lookup | `backend/src/repositories/fineRepository.js` |
| fineManagementService | Calculation, duplicate prevention, collection, paid/waive/cancel, audit | `backend/src/services/fineManagementService.js` |
| fineManagementController | HTTP adapters for the SPEC §11 endpoints | `backend/src/controllers/fineManagementController.js` |
| fineRoutes (extended) | New server-side routes + kept legacy CRUD routes | `backend/src/routes/fineRoutes.js` |

## 3. Data Flow

POST /api/fines/calculate → controller → service.calculateFine
  → fineRepository.getBorrowDetailForFine (due/return dates)
  → compute overdueDays (day after dueDate) × 5,000 VND
  → fineRepository.findActiveFineByBorrowDetail (dedupe) → createFine (transaction)
  → audit FINE_CALCULATE → response

POST /api/fines/{id}/collections / PATCH /api/fines/{id}/paid → service → repository (transaction)
  → PAID iff fully collected (INV-5) → audit FINE_COLLECT / FINE_MARK_PAID

## 4. Dependencies (implementation order)

1. fineRepository (no deps beyond db config)
2. fineManagementService (needs fineRepository, auditLogRepository)
3. fineManagementController + routes (needs service)
4. app.js wiring (inject `fineManagementService`)
5. tests (in-memory repository double)

## 5. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Duplicate fines from concurrent calculate | Med | High (money) | `UPDLOCK/HOLDLOCK` dedupe inside createFine transaction (BR-FE09-009) |
| Trusting client amount | High | High (money) | Amount computed only from stored dates; client fields ignored (NFR-FE09-SEC-004) |
| Double collection on a resolved fine | Med | High | Terminal-state guards; updates only `WHERE Status='UNPAID'` (INV-6) |
| `Fines` CHECK lacks `CANCELLED` | High | Med | SQL CHECK updated to include `CANCELLED` (matches spec state model) |

## 6. Notes for Reviewer (B3)

- Legacy CRUD endpoints (`POST/PUT/DELETE /api/fines`) are unchanged and still back the prototype UI.
- `collectedAmount` reuses the existing `Fines.PaidAmount` column; no `CollectionNote` column exists,
  so notes are kept in the audit metadata only (acceptable for Phase 1, Q-FE09-004).
- Frontend alignment to the new API is **out of scope** here (TD-004).
