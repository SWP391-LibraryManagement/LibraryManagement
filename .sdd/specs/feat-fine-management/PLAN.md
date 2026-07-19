# PLAN.md - FE09 Fine Management

Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED

Owner: Dung

Updated: 2026-07-19

Workflow State: SPEC v0.4.1 approved; FE09-T013 through FE09-T021, live SQL, and browser/L4 are agent-side complete, with final human review open

> **For implementation agents:** Execute the reconciliation tasks after the historical slice review. Treat the approved fine contract as the source of truth: server dates, no client amount, no partial payment, terminal states, and atomic audit/payment updates.

---

## 1. Goal

Reconcile the existing FE09 server-side fine workflow and prototype UI with the deterministic v0.4.1 contract for overdue calculation, full offline collection, paid/waived/cancelled states, list filtering, timezone, audit, and FE07/FE12 visibility.

## 2. Source Documents

- `.sdd/specs/feat-fine-management/SPEC.md` v0.4.1.
- `.sdd/specs/feat-fine-management/CONTEXT.md` v0.2.0.
- `.sdd/specs/feat-fine-management/TEST_PLAN.md`.
- `.sdd/specs/feat-borrowing-management/SPEC.md` v0.5.0.
- `.sdd/rfcs/ADR-002-database-design.md`.
- `database/Librarymanagement.sql`.
- `.sdd/constraints/safety.md`.

## 3. Existing Baseline And Drift

| Approved contract | Current drift to reconcile |
| --- | --- |
| Phase 1 has no partial payment | Resolved: service rejects client amounts and repository always sets `PaidAmount = Amount`. |
| Full collection sets `PaidAmount = Amount`, `CollectedBy`, `PaymentMethod`, `PaidAt`, and `PAID` atomically | Resolved: mutation and audit share the repository transaction boundary. |
| Overdue date uses `Asia/Ho_Chi_Minh` | Resolved: `libraryBusinessTime.js` owns explicit business-date conversion. |
| Admin waive/cancel are part of the state model | Resolved: canonical routes, role/reason validation, terminal conflicts, and audit metadata are covered. |
| Fine list is paginated, filtered, and fixed `FineId ASC` | Resolved in the server contract, repository, and UI: `q`, `status`, `page`, and `limit` are server-owned and the UI consumes the canonical envelope. |
| FE09 production behavior is server-side | Resolved: the UI calls canonical APIs, performs no browser-side list filtering/pagination, and has focused browser/L4 evidence. |
| Every state/payment change is atomic and audited | Resolved: calculation, collection, paid, waive, and cancel use one mutation/audit transaction with rollback evidence. |

Historical T001-T011 results prove the earlier server-side slice only. They do not close v0.4.1 reconciliation tasks.

## 4. Scope

### In Scope

- View own fines, staff list/detail, and protected fine context.
- Calculate overdue fines from stored borrowing dates and server business date.
- Prevent duplicate active fines under concurrency.
- Record one full offline collection or explicit full-payment reconciliation.
- Mark `PAID`, `WAIVED`, or `CANCELLED` with terminal-state guards and audit metadata.
- Expose fine state consistently to FE07 borrowing eligibility and FE12 reports.
- Validate and document pagination, filtering, IDs, status, payment method, and admin reason.
- Focused backend/SQL/contract tests, traceability, server-controlled frontend list behavior, and browser/L4 acceptance.

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
| HTTP boundary | `backend/src/routes/fineRoutes.js`, `backend/src/controllers/fineManagementController.js` | Route server-side list/detail/calculation/collection/paid/waive/cancel; legacy create/update/delete mutations remain unregistered and return `404`. |
| Business rules | `backend/src/services/fineManagementService.js`, create `backend/src/utils/libraryBusinessTime.js` | Timezone-aware calculation, full collection, terminal states, role/reason validation, and safe errors. |
| Persistence | `backend/src/repositories/fineRepository.js`, `backend/src/repositories/auditLogRepository.js` | Locked duplicate detection, atomic state/payment/audit writes, list pagination/filter/order. |
| API docs | `backend/src/docs/openapi.yaml`, `.sdd/specs/feat-fine-management/SPEC.md` | Exact request/response/error contracts. |
| Backend tests | `backend/tests/fineManagementRoutes.test.js`, `backend/tests/fineRoutes.test.js`, create `backend/tests/fineContract.test.js`, create `backend/tests/sql/fineConcurrency.sqltest.js`, `backend/tests/helpers/inMemoryFineRepositories.js` | Reconciliation tests plus explicit legacy-mutation `404` coverage. |
| Frontend boundary | `frontend/src/page/FineManagement.jsx`, `frontend/src/api/libraryFeatureApi.js`, `frontend/src/utils/fineListQuery.js`, `frontend/test/fineManagementFrontend.test.js`, `tests/e2e/fe09-fine-management.spec.js` | Builds canonical server queries, consumes server pagination, preserves safe mutation ownership, and proves desktop/mobile L4 behavior. |

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

- Verify existing SQL fields and `CK_Fines_Status`; update ADR/OpenAPI only for confirmed v0.4.1 contract gaps.
- Route management list to the server-side service and keep legacy create/update/delete mutations outside the production router.

### 7.3 Calculation And Eligibility Contract

- Centralize business-date conversion to `Asia/Ho_Chi_Minh`.
- Calculate from stored `DueDate`/`ReturnDate` or current business date; amount is `overdueDays * 5000`.
- Recalculate an existing `UNPAID` overdue fine in place; terminal fine records remain unchanged.

### 7.4 Full Collection And Terminal States

- Remove partial collection semantics from the production contract.
- Collection/paid set `PaidAmount = Amount`, `CollectedBy`, `PaymentMethod`, `PaidAt`, and `PAID` in one transaction.
- Admin waive/cancel require reason and update state plus audit atomically.
- Terminal states reject later collection/payment/resolution without overwriting metadata.

### 7.5 Reads, Integration, And Frontend Boundary

- Add deterministic list/detail filters and safe FE07/FE12 state readback.
- Move list search, status filtering, and pagination fully onto the canonical server query/envelope.
- Add focused source tests plus browser evidence for request parameters, page transitions, filtered totals, and responsive overflow.
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
| FE09 backend | `npm.cmd --prefix backend test -- --runTestsByPath tests/fineManagementRoutes.test.js tests/fineRoutes.test.js tests/fineContract.test.js` | Server-side API, legacy mutation `404`, contract, terminal, and permission cases pass. |
| FE09 SQL concurrency | `npm.cmd --prefix backend test -- --runTestsByPath tests/sql/fineConcurrency.sqltest.js` | Duplicate calculation and atomic payment/audit cases pass when SQL configuration is available. |
| FE09 frontend boundary | `node --test frontend/test/fineManagementFrontend.test.js frontend/test/fineOperationalFrontend.test.js` | Canonical query construction, server pagination consumption, no browser-storage fallback, and safe terminal actions pass. |
| FE09 browser/L4 | Playwright on isolated frontend/backend ports `4185/3101` | Server search/status/page requests, returned-row counts, totals, page navigation, and mobile overflow pass. |
| Traceability | `npm.cmd run trace:enforce` | FE09 changed implementation files satisfy the traceability threshold. |
| Diff hygiene | `git diff --check` | No whitespace errors. |

## 10. Human Review Gate

- [x] Nhat confirmed no partial payment is accepted in Phase 1 on 2026-07-17.
- [x] Nhat confirmed full collection and paid reconciliation use the same payment metadata rules on 2026-07-17.
- [x] Nhat confirmed waive/cancel ownership and reason length on 2026-07-17.
- [x] Nhat confirmed the `Asia/Ho_Chi_Minh` calculation boundary on 2026-07-17.
- [x] Nhat confirmed the prototype frontend is not production completion evidence on 2026-07-17; upstream v0.4.1 removes its legacy create/update/delete server mutations.

Agent-side implementation and L4 evidence are recorded in `.sdd/reviews/fe09-fine-reconciliation-validation-2026-07-19.md`; live SQL evidence is recorded in `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`. These automated gates do not substitute for final project human acceptance.
