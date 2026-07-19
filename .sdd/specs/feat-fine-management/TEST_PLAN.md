# FE09 Test Plan - Fine Management

Version: 0.3.2
Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED
Last Updated: 2026-07-19

Source Spec: `.sdd/specs/feat-fine-management/SPEC.md` v0.4.1
Feature IDs: `BR-FE09-*`, `FR-FE09-*`, `AC-FE09-*`
Authoritative AC-to-test mapping: `SPEC.md` section 16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Server-side overdue fine calculation, duplicate prevention, full offline collection, paid/waived/
cancelled terminal states, audit logging, FE07 eligibility readback, deterministic fine lists, and
role-protected visibility. Legacy `POST`/`PUT`/`DELETE /api/fines` CRUD routes are not part of the
production contract and must remain unregistered; `fineRoutes.test.js` verifies that boundary.

FE09-T013 through FE09-T021 now have agent-side RED/GREEN, live SQL, and browser/L4 evidence.
Project human acceptance remains a release gate.

## 2. Unit / Service Test Targets

- Calculation: 5,000 VND per overdue day per copy, starting the day after the stored due date.
- Date source: use stored due/return dates and the `Asia/Ho_Chi_Minh` business date; ignore client-supplied amount, overdue days, or dates.
- Non-overdue and incomplete data: create no fine for zero/negative overdue days and reject missing required borrowing data.
- Duplicate prevention: return the existing active fine unchanged and prevent concurrent duplicate creation.
- Payment invariant: Phase 1 accepts no partial payment; `PaidAmount = 0` while `UNPAID` and `PaidAmount = Amount` only when `PAID`.
- Full collection and paid reconciliation: set `CollectedBy`, `PaymentMethod`, `PaidAt`, `PaidAmount`, and `Status = PAID` atomically.
- Terminal states: reject collection, paid, waive, or cancel retries for `PAID`, `WAIVED`, and `CANCELLED` without overwriting metadata.
- Admin resolution: only Admin may waive/cancel; trim and validate reason length 1..500; write state and audit atomically.
- Audit and rollback: calculation and every state change are traceable; a failed audit write rolls back the related fine mutation.
- Fine list: default `page = 1`, `limit = 20`, bounds `page >= 1` and `limit = 1..100`, fixed `FineId ASC`, and deterministic filter validation.

## 3. API / Integration Test Targets (SPEC section 11)

- `POST /api/fines/calculate`: Librarian/Admin access, overdue calculation, on-time/no-fine result, missing borrow detail, missing due date, timezone boundary, client-tampering rejection/ignore behavior, and idempotency.
- `GET /api/fines/me`: member-only own-fine isolation, default pagination, status filtering, and invalid query rejection before repository access.
- `GET /api/fines`: staff-only list, member/guest denial, `q`/user/status filters, default pagination, fixed `FineId ASC` ordering, and invalid page/limit/status/user ID rejection.
- `GET /api/fines/:fineId`: owner-only member detail access, staff access, foreign-member denial, and safe not-found behavior.
- `POST /api/fines/:fineId/collections`: full offline collection only; reject `collectedAmount` or partial-payment payloads; store all payment metadata and return `PAID` atomically.
- `PATCH /api/fines/:fineId/paid`: same full-payment metadata and terminal-state rules as collection; member denial and double-pay conflict.
- `PATCH /api/fines/:fineId/waive`: Admin-only valid reason, invalid reason, audit record, terminal conflict, and resolved-fine visibility.
- `PATCH /api/fines/:fineId/cancel`: Admin-only valid reason, invalid reason, audit record, terminal conflict, and resolved-fine visibility.
- FE07/FE12 integration: `UNPAID` positive fines block borrowing/renewal, while `PAID`, `WAIVED`, and `CANCELLED` fines do not block it and expose stable state to consumers.

## 4. E2E / Manual Acceptance Flows

- Overdue return -> Librarian calculates the fine -> Librarian records one full offline collection -> payment metadata and audit are committed -> FE07 no longer blocks the member.
- Admin waives or cancels an unpaid fine with a valid reason -> the fine remains visible, becomes terminal, and the audit record is committed atomically.
- Staff lists fines with omitted pagination -> the first 20 records appear in `FineId ASC` order; invalid filters are rejected without a data query.
- Frontend `FineManagement.jsx` sends canonical search/status/page/limit queries, consumes the server list envelope, and renders responsive desktop/mobile pagination without browser-side filtering or slicing.

## 5. Current Evidence

- `backend/tests/fineManagementRoutes.test.js` contains the reconciled server-side route coverage (21 tests; AC-FE09-001..015 plus transaction and validation cases).
- `backend/tests/fineRoutes.test.js` verifies staff list RBAC and that legacy CRUD mutation routes return `404`.
- `backend/tests/fineContract.test.js` covers the eight canonical OpenAPI operations and the timezone boundary.
- `backend/tests/sql/fineConcurrency.sqltest.js` passes all three static transaction/contract checks and six mutable SQL cases on the disposable SQL Server runtime.
- `frontend/test/fineManagementFrontend.test.js` covers canonical API ownership, server query construction, server pagination metadata, and no demo storage.
- `frontend/test/fineOperationalFrontend.test.js` preserves the shared operational layout and safe mutation boundary.
- `tests/e2e/fe09-fine-management.spec.js` passes the server-query, pagination, filter/search, returned-row-count, and mobile-overflow L4 flow.

## 6. Gaps

- Persistence, duplicate-calculation, terminal-winner, eligibility, and atomic rollback evidence passed on disposable SQL Server; see `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Final project human integration acceptance remains open.
- Online payment, partial payment, automatic scheduling, and lost/damaged fine policies remain outside Phase 1.

## 7. NFR Coverage

| NFR ID | Test target | Evidence state |
| ------ | ----------- | -------------- |
| NFR-FE09-SEC-001 | Authentication on all fine endpoints and staff-only manual calculation. | Route middleware plus focused role/permission evidence; browser L4 runs with stored Librarian state. |
| NFR-FE09-SEC-002 | Member own-fine isolation for list and detail. | Focused own-list and foreign-detail tests pass. |
| NFR-FE09-SEC-003 | Librarian/Admin collection/paid guards and Admin-only waive/cancel guards. | Focused role matrix passes. |
| NFR-FE09-SEC-004 | Calculation ignores client amount, overdue days, and date inputs. | Focused tampering test passes. |
| NFR-FE09-SEC-005 | Validate IDs, status, payment method, note, reason, and pagination before repository access. | Focused validation matrix passes. |
| NFR-FE09-TXN-001 | Atomic fine creation and duplicate detection under concurrency. | In-memory and live SQL duplicate-calculation/rollback cases pass. |
| NFR-FE09-TXN-002 | Atomic payment/reason/state/audit update with rollback and one terminal winner. | In-memory and live SQL terminal-winner/rollback cases pass. |
| NFR-FE09-PERF-001 | Pagination defaults/bounds and fixed `FineId ASC` ordering. | Focused list contract passes. |
| NFR-FE09-PERF-002 | Borrow-detail calculation lookup uses key-based access. | Repository lookup is primary-key bounded and covered by source review. |
| NFR-FE09-LOG-001 | Calculation, collection, paid, waive, cancel, and failed mutation are traceable. | Focused audit metadata and rollback tests pass. |
| NFR-FE09-LOG-002 | Audit/log output excludes unnecessary personal data. | Audit metadata is allow-listed to fine context and safe note/reason fields. |
| NFR-FE09-UX-001 | Fine display includes amount, reason, status, and borrowing context. | API DTO/OpenAPI, frontend source checks, and browser/L4 pass. |
| NFR-FE09-UX-002 | Error responses distinguish missing, unauthorized, and terminal conflicts. | Deterministic error-code assertions pass. |
| NFR-FE09-TIME-001 | Returned and active loans use `Asia/Ho_Chi_Minh` business date. | Focused boundary test passes; live environment confirmation pending. |

## 8. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/fineManagementRoutes.test.js tests/fineRoutes.test.js tests/fineContract.test.js
npm.cmd --prefix backend run test:sql:fe09
node --test frontend/test/fineManagementFrontend.test.js
$env:E2E_FRONTEND_PORT='4185'; $env:E2E_BACKEND_PORT='3101'; $env:E2E_FRONTEND_URL='http://127.0.0.1:4185'; $env:E2E_BACKEND_URL='http://127.0.0.1:3101'; npx playwright test tests/e2e/fe09-fine-management.spec.js --project=chromium
npm.cmd run trace:enforce
git diff --check
```

The full repository test, lint, and build gates remain required by the project before merge; they
are not rerun as part of this documentation-only normalization pass.
