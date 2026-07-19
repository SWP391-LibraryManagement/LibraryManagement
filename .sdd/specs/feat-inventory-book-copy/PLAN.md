# PLAN.md - FE06 Inventory / Book Copy Management

Status: READY FOR REVIEW - FE06 reconciliation and live SQL complete; human gates pending

Owner: Dat

Updated: 2026-07-19

Workflow State: FE06-T001 through FE06-T008 executed in isolated worktree; integration review remains open

> **For implementation agents:** Execute `TASKS.md` in order. Every manual copy mutation must be proven with focused RED/GREEN tests, matching `If-Match`, transactional conflict checks, and an atomic audit write.

---

## 1. Goal

Reconcile the FE06 prototype with the approved deterministic copy-lifecycle contract so that inventory reads, physical-copy metadata, manual state transitions, effective availability, concurrency, and audit history remain consistent with FE05, FE07, and FE08.

## 2. Source Documents

- `.sdd/specs/feat-inventory-book-copy/SPEC.md` v0.4.0.
- `.sdd/specs/feat-inventory-book-copy/CONTEXT.md` v0.2.0.
- `.sdd/specs/feat-inventory-book-copy/TEST_PLAN.md`.
- `.sdd/rfcs/ADR-002-database-design.md`.
- FE05, FE07, and FE08 approved specs for parent-book, borrow, and reservation ownership.
- `database/Librarymanagement.sql`.
- `.sdd/constraints/safety.md`.

## 3. Existing Baseline And Drift

| Approved contract | Current drift to reconcile |
| --- | --- |
| Existing-copy mutations require SQL `rowversion` and `If-Match` | `BookCopies` has no rowversion and routes/services accept no version header. |
| Conflict checks and audit write occur in the mutation transaction | Service currently checks borrow/reservation before separate repository update and writes audit afterward. |
| Lock order is `BookCopies -> BorrowDetails -> Reservations` | Repository helpers perform independent reads without transaction-scoped locks. |
| Create/status-to-`AVAILABLE` requires parent `Books.Status = ACTIVE` | Current parent lookup does not enforce active status for all FE06-owned transitions into `AVAILABLE`. |
| Status reason is required, trimmed 1..500 | Current reason is optional and validator maximum is 255. |
| Duplicate deactivation is idempotent with `changed = false` | Prototype handles status but lacks current-version and atomic audit semantics. |
| Inventory returns counts and deterministic pagination | Current response/filter shape must be reconciled to `{ items, page, limit, totalItems, totalPages, countsByStatus }`. |
| Frontend is server-backed | `InventoryManagement.jsx` still owns `MOCK_BOOKS`/`MOCK_COPIES`; copy dialogs call APIs against mock-selected state. |

## 4. Scope

### In Scope

- Protected inventory list, copy detail, barcode lookup, copy create/update/status/deactivate endpoints.
- Barcode and location validation, deterministic pagination, safe response fields, and counts by status.
- Approved manual transitions among `AVAILABLE`, `DAMAGED`, `LOST`, and `INACTIVE`; direct `BORROWED`/`RESERVED` mutation remains forbidden.
- Active parent-book guard for FE06-owned transitions into `AVAILABLE`.
- SQL `rowversion`, `If-Match`, transactional borrow/reservation rechecks, fixed lock order, and atomic audit logs.
- Idempotent duplicate deactivation and explicit reservation/borrow conflict errors.
- Server-backed operational frontend, focused tests, API docs, and traceability.

### Out Of Scope

- FE05 catalog metadata updates.
- FE07 checkout/return and FE08 hold/release implementation.
- Fine creation, RFID/barcode hardware integration, bulk import/export, or copy condition fields.
- Physical deletion of copies.
- Borrower/reservation-owner PII in FE06 responses.

## 5. File And Interface Map

| Area | Files | Responsibility |
| --- | --- | --- |
| SQL contract | `database/Librarymanagement.sql`, `.sdd/rfcs/ADR-002-database-design.md` | Add `BookCopies` rowversion and document mutation lock/ownership rules. |
| HTTP boundary | `backend/src/routes/inventoryRoutes.js`, `backend/src/controllers/inventoryController.js`, `backend/src/validators/inventoryValidators.js` | RBAC, `If-Match`, IDs, filters, metadata, status, and reason validation. |
| Business rules | `backend/src/services/inventoryService.js` | Approved transition matrix, parent-book guard, conflict outcomes, safe response contract, and idempotency. |
| Persistence | `backend/src/repositories/inventoryRepository.js`, `backend/src/repositories/auditLogRepository.js` | Transactional row locks, version comparison, conflict rechecks, mutation, count query, and audit. |
| Models/docs | `backend/src/models/BookCopy.js`, `backend/src/docs/openapi.yaml` | Version metadata and approved API schemas/errors. |
| Backend tests | `backend/tests/inventoryRoutes.test.js`, create `backend/tests/helpers/inMemoryInventoryRepositories.js`, create `backend/tests/sql/inventoryConcurrency.sqltest.js` | Route, transition, rollback, stale-write, lock/conflict, pagination, and data-exposure evidence. |
| Frontend | `frontend/src/page/InventoryPage.jsx`, `frontend/src/component/inventory/InventoryManagement.jsx`, `frontend/src/component/inventory/BookCopies.jsx`, `frontend/src/component/inventory/Filter.jsx`, `frontend/src/component/inventory/StatusBadge.jsx`, `frontend/src/api/libraryFeatureApi.js` | Server-backed inventory, version propagation, reasons, confirmations, and canonical state. |
| Frontend tests | `frontend/test/inventoryOperationalFrontend.test.js` | Replace mock-ownership assertions with v0.4.0 API/state assertions. |

## 6. Approved Interfaces

| Method | Endpoint | Required behavior |
| --- | --- | --- |
| `GET` | `/api/inventory` | Librarian/Admin; validated filters and deterministic page/count response. |
| `GET` | `/api/book-copies/{copyId}` | Protected safe copy detail with related book summary and version. |
| `GET` | `/api/book-copies/barcode/{barcode}` | Protected barcode lookup or `404`. |
| `POST` | `/api/books/{bookId}/copies` | Server-controlled `AVAILABLE`; active parent and unique barcode required. |
| `PUT` | `/api/book-copies/{copyId}` | Matching `If-Match`; barcode/location only, no status. |
| `PATCH` | `/api/book-copies/{copyId}/status` | Matching `If-Match`; `{ status, reason }`; approved FE06 transition only. |
| `DELETE` | `/api/book-copies/{copyId}` | Matching `If-Match`; `{ reason }`; soft-deactivate only. |

All existing-copy mutation responses include the advanced opaque version. Missing/stale versions return `409 STALE_COPY_STATE` with no state or audit change.

## 7. Ordered Implementation Strategy

### 7.1 Lock V0.4.0 With RED Tests

- Extend route tests for response shape, pagination rejection, safe fields, parent inactive, location control characters, status/reason validation, conflict codes, and idempotent deactivation.
- Add SQL tests for two competing versions, transaction rollback, and borrow/reservation state changing between read and mutation.
- Replace frontend tests that intentionally preserve mock ownership.

### 7.2 Reconcile Schema And Mutation Primitive

- Add SQL `rowversion` to `BookCopies`, expose an opaque version, and document the change in ADR/model/OpenAPI.
- Build one repository mutation primitive that locks `BookCopies`, compares version, then locks/rechecks `BorrowDetails` and `Reservations` in the approved order before writing copy and audit state.

### 7.3 Reconcile Reads And Validation

- Return filtered items and counts from the same committed filter contract.
- Reject invalid supplied page/limit without normalization or query execution.
- Keep barcode lookup indexed and responses free of unrelated user/fine/audit data.
- Validate barcode, optional location, status, reason, IDs, and `If-Match` at the boundary.

### 7.4 Reconcile Create/Metadata/State Commands

- Create only `AVAILABLE` copies under active books; initial status is not client-controlled.
- Metadata update changes barcode/location only.
- Manual status command follows the exact state matrix and active-parent guard for transitions into `AVAILABLE`.
- Deactivation is soft-only; duplicate deactivation with current version returns `changed = false` and no second transition audit.

### 7.5 Reconcile Frontend And Evidence

- Load real inventory/copy data and remove mock operational ownership.
- Preserve last-seen version, send `If-Match`, require transition reason, and reload on success/stale conflict.
- Explain FE07/FE08-owned conflicts without offering a prohibited override.
- Add `@spec` tags and focused evidence before the full merge gate.

## 8. Dependency Order

1. RED route/SQL/frontend tests.
2. SQL rowversion, ADR/model, and API contract.
3. Validators and read response reconciliation.
4. Transactional create/update/status/deactivate implementation.
5. Server-backed frontend.
6. Traceability, focused verification, then human review.

FE06 lock and state contracts must remain compatible with FE07 approval/return and FE08 hold/release transactions.

## 9. Verification Gates

| Gate | Command | Expected result |
| --- | --- | --- |
| FE06 backend | `npm.cmd --prefix backend test -- --runTestsByPath tests/inventoryRoutes.test.js` | Route, validation, transition, response, and RBAC cases pass. |
| FE06 SQL concurrency | `npm.cmd --prefix backend test -- --runTestsByPath tests/sql/inventoryConcurrency.sqltest.js` | Stale version, lock/recheck, idempotency, and rollback cases pass when SQL configuration is available. |
| FE06 frontend | `node --test frontend/test/inventoryOperationalFrontend.test.js` | Server-backed data, version, reason, and conflict-state assertions pass. |
| Traceability | `npm.cmd run trace:enforce` | FE06 changed implementation files satisfy the repository threshold. |
| Diff hygiene | `git diff --check` | No whitespace errors. |

## 10. Human Review Gate

- [x] Confirm SQL rowversion encoding and `If-Match` response/request handling.
- [x] Confirm the repository lock order and same-transaction conflict checks match FE07/FE08.
- [x] Confirm duplicate deactivation writes no second transition audit.
- [x] Confirm FE06 responses exclude borrower/reservation-owner data.
- [x] Approve `TASKS.md` ordering and mappings before implementation starts.
