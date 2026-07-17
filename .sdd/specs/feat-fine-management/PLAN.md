# PLAN.md - FE09 Fine Management

Status: APPROVED - BASELINE 2026-07-17; IMPLEMENTATION FOLLOW-UP PENDING

Owner: Dung

Updated: 2026-07-17

Workflow State: SPEC v0.4.0 baseline approved; historical server-side slice remains recorded and reconciliation tasks are pending execution

> **For implementation agents:** Execute the reconciliation tasks after the historical slice review. Treat the approved fine contract as the source of truth: server dates, no client amount, no partial payment, terminal states, and atomic audit/payment updates.

---

## 1. Goal

Reconcile the existing FE09 server-side fine workflow and retained prototype UI with the deterministic v0.4.0 contract for overdue calculation, full offline collection, paid/waived/cancelled states, list filtering, timezone, audit, and FE07/FE12 visibility.

## 2. Source Documents

- `.sdd/specs/feat-fine-management/SPEC.md` v0.4.0.
- `.sdd/specs/feat-fine-management/CONTEXT.md` v0.2.0.
- `.sdd/specs/feat-fine-management/TEST_PLAN.md`.
- `.sdd/specs/feat-borrowing-management/SPEC.md` v0.5.0.
- `.sdd/rfcs/ADR-002-database-design.md`.
- `database/Librarymanagement.sql`.
- `.sdd/constraints/safety.md`.

## 3. Existing Baseline And Drift

| Approved contract | Current drift to reconcile |
| --- | --- |
| Phase 1 has no partial payment | `recordCollection` accepts `collectedAmount` and can persist an unpaid partial amount. |
| Full collection sets `PaidAmount = Amount`, `CollectedBy`, `PaymentMethod`, `PaidAt`, and `PAID` atomically | Payment/audit writes are split across repository and service calls; the contract does not consistently define the metadata. |
| Overdue date uses `Asia/Ho_Chi_Minh` | Service date-only calculation uses the runtime local timezone rather than an explicit business timezone. |
| Admin waive/cancel are part of the state model | Routes exist, but the approved API contract, functional requirements, acceptance criteria, and traceability were incomplete. |
| Fine list is paginated, filtered, and fixed `FineId ASC` | Management list is still routed to legacy CRUD and service filters do not implement the full contract. |
| FE09 production behavior is server-side | `FineManagement.jsx` still owns demo/browser-storage records and legacy CRUD behavior. |
| Every state/payment change is atomic and audited | Calculation and state mutation audit calls occur after repository transactions, so rollback evidence is incomplete. |

Historical T001-T011 results prove the earlier server-side slice only. They do not close v0.4.0 reconciliation tasks.

## 4. Scope

### In Scope

- View own fines, staff list/detail, and protected fine context.
- Calculate overdue fines from stored borrowing dates and server business date.
- Prevent duplicate active fines under concurrency.
- Record one full offline collection or explicit full-payment reconciliation.
- Mark `PAID`, `WAIVED`, or `CANCELLED` with terminal-state guards and audit metadata.
- Expose fine state consistently to FE07 borrowing eligibility and FE12 reports.
- Validate and document pagination, filtering, IDs, status, payment method, and admin reason.
- Focused backend/SQL/contract tests, traceability, and a documented frontend migration boundary.

### Out Of Scope

- Partial payments or a `PARTIALLY_PAID` status.
- Online payment gateway, card processing, refunds, or payment confirmation/refusal workflow.
- Fine calculation for lost/damaged copies in Phase 1.
- Borrow/return ownership, copy status changes, notifications, or reporting dashboard implementation.
- Automatic daily fine scheduler.

## 5. File And Interface Map

| Area | Files | Responsibility |
| --- | --- | --- |
| Data/schema | `database/Librarymanagement.sql`, `backend/src/models/Fine.js`, `.sdd/rfcs/ADR-002-database-design.md` | Verify `OverdueDays`, `RatePerDay`, `PaidAmount`, `PaidAt`, `CollectedBy`, `PaymentMethod`, and terminal status check. |
| HTTP boundary | `backend/src/routes/fineRoutes.js`, `backend/src/controllers/fineManagementController.js`, `backend/src/controllers/fineController.js` | Route server-side list/detail/calculation/collection/paid/waive/cancel and isolate legacy CRUD. |
| Business rules | `backend/src/services/fineManagementService.js`, create `backend/src/utils/libraryBusinessTime.js` | Timezone-aware calculation, full collection, terminal states, role/reason validation, and safe errors. |
| Persistence | `backend/src/repositories/fineRepository.js`, `backend/src/repositories/auditLogRepository.js` | Locked duplicate detection, atomic state/payment/audit writes, list pagination/filter/order. |
| API docs | `backend/src/docs/openapi.yaml`, `.sdd/specs/feat-fine-management/SPEC.md` | Exact request/response/error contracts. |
| Backend tests | `backend/tests/fineManagementRoutes.test.js`, `backend/tests/fineRoutes.test.js`, create `backend/tests/fineContract.test.js`, create `backend/tests/sql/fineConcurrency.sqltest.js`, `backend/tests/helpers/inMemoryFineRepositories.js` | Reconciliation tests and historical prototype coverage. |
| Frontend boundary | `frontend/src/page/FineManagement.jsx`, `frontend/src/api/libraryFeatureApi.js`, create `frontend/test/fineManagementFrontend.test.js` | Explicitly preserve demo behavior only until a separately approved frontend migration task is executed. |

## 6. Approved Interfaces

| Method | Endpoint | Required behavior |
| --- | --- | --- |
| `GET` | `/api/fines/me` | Member-only own fines; `page = 1`, `limit = 20`; no cross-member data. |
| `GET` | `/api/fines` | Librarian/Admin list; `q`, `userId`, `status`, page/limit; fixed `FineId ASC`. |
| `GET` | `/api/fines/{fineId}` | Owner or Librarian/Admin detail; safe borrowing context only. |
| `POST` | `/api/fines/calculate` | Librarian/Admin manual calculation from `borrowDetailId`; no client amount/date and no scheduler actor. |
| `POST` | `/api/fines/{fineId}/collections` | Librarian/Admin records full offline collection; sets all payment fields and `PAID` atomically. |
| `PATCH` | `/api/fines/{fineId}/paid` | Librarian/Admin full-payment reconciliation with the same terminal/payment rules. |
| `PATCH` | `/api/fines/{fineId}/waive` | Admin-only reasoned transition `UNPAID -> WAIVED`. |
| `PATCH` | `/api/fines/{fineId}/cancel` | Admin-only reasoned transition `UNPAID -> CANCELLED`. |

Resolved fine collection conflicts return `409 FINE_NOT_COLLECTIBLE`; resolved paid conflicts return `409 FINE_NOT_PAYABLE`; resolved waive/cancel conflicts return `409 FINE_NOT_RESOLVABLE`.

## 7. Ordered Implementation Strategy

### 7.1 RED Contract And Concurrency Tests

- Add failing tests for no partial amount, full collection metadata, timezone boundary, waive/cancel API, invalid reason, pagination, fixed ordering, and atomic audit rollback.
- Add SQL concurrency tests proving only one duplicate calculation and one terminal payment transition succeeds.

### 7.2 Schema/API Reconciliation

- Verify existing SQL fields and `CK_Fines_Status`; update ADR/OpenAPI only for confirmed v0.4.0 contract gaps.
- Route management list to server-side service and keep legacy CRUD explicitly outside production completion evidence.

### 7.3 Calculation And Eligibility Contract

- Centralize business-date conversion to `Asia/Ho_Chi_Minh`.
- Calculate from stored `DueDate`/`ReturnDate` or current business date; amount is `overdueDays * 5000`.
- Return an existing active overdue fine unchanged and never mutate its amount on recalculation.

### 7.4 Full Collection And Terminal States

- Remove partial collection semantics from the production contract.
- Collection/paid set `PaidAmount = Amount`, `CollectedBy`, `PaymentMethod`, `PaidAt`, and `PAID` in one transaction.
- Admin waive/cancel require reason and update state plus audit atomically.
- Terminal states reject later collection/payment/resolution without overwriting metadata.

### 7.5 Reads, Integration, And Frontend Boundary

- Add deterministic list/detail filters and safe FE07/FE12 state readback.
- Keep the legacy browser-storage UI explicitly marked as a deferred migration; do not claim FE09 UI completion from it.
- Add focused traceability and evidence before any full merge gate.

## 8. Dependency Order

1. RED backend/SQL/contract tests.
2. Schema/OpenAPI/model reconciliation.
3. Calculation/timezone/duplicate prevention.
4. Full collection/paid/waive/cancel atomic states.
5. List/detail and FE07/FE12 readback.
6. Frontend boundary documentation, traceability, focused verification, human review.

## 9. Verification Gates

| Gate | Command | Expected result |
| --- | --- | --- |
| FE09 backend | `npm.cmd --prefix backend test -- --runTestsByPath tests/fineManagementRoutes.test.js tests/fineRoutes.test.js tests/fineContract.test.js` | Server-side API, legacy isolation, contract, terminal, and permission cases pass. |
| FE09 SQL concurrency | `npm.cmd --prefix backend test -- --runTestsByPath tests/sql/fineConcurrency.sqltest.js` | Duplicate calculation and atomic payment/audit cases pass when SQL configuration is available. |
| FE09 frontend boundary | `node --test frontend/test/fineManagementFrontend.test.js` | Deferred migration boundary and no false production-complete claim are recorded when the focused file exists. |
| Traceability | `npm.cmd run trace:enforce` | FE09 changed implementation files satisfy the traceability threshold. |
| Diff hygiene | `git diff --check` | No whitespace errors. |

## 10. Human Review Gate

- [x] Nhat confirmed no partial payment is accepted in Phase 1 on 2026-07-17.
- [x] Nhat confirmed full collection and paid reconciliation use the same payment metadata rules on 2026-07-17.
- [x] Nhat confirmed waive/cancel ownership and reason length on 2026-07-17.
- [x] Nhat confirmed the `Asia/Ho_Chi_Minh` calculation boundary on 2026-07-17.
- [x] Nhat confirmed legacy frontend CRUD remains explicitly deferred and is not production completion evidence on 2026-07-17.
