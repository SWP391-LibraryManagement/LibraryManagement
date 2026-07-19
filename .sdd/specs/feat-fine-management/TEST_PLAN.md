# FE09 Test Plan - Fine Management

Version: 0.3.1
Status: APPROVED BASELINE; IMPLEMENTATION FOLLOW-UP PENDING
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

The normalization tasks are contract work awaiting human review. Historical test results do not prove
FE09-T013 through FE09-T020 are complete.

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
- Frontend `FineManagement.jsx` remains a documented TD-004 migration boundary and must not be presented as production server-side completion.

## 5. Current Evidence

- `backend/tests/fineManagementRoutes.test.js` covers the current server-side route behavior, including full-only collection.
- `backend/tests/fineRoutes.test.js` verifies staff list RBAC and that legacy CRUD mutation routes return `404`.
- FE09-T013 through FE09-T020 focused contract, SQL concurrency, and frontend-boundary tests have not yet been added; no completion claim is made for them.

## 6. Gaps

- FE09-T013 through FE09-T020 remain pending focused validation and human review of the normalized contract.
- TD-004: migrate the frontend from legacy CRUD/browser storage to the approved server-side API and add the corresponding UI pagination.
- A SQL Server-backed environment is still required for persistence, duplicate-calculation, and atomic state/audit concurrency evidence.
- Online payment, partial payment, automatic scheduling, and lost/damaged fine policies remain outside Phase 1.

## 7. NFR Coverage

| NFR ID | Test target | Evidence state |
| ------ | ----------- | -------------- |
| NFR-FE09-SEC-001 | Authentication on all fine endpoints and staff-only manual calculation. | Historical route coverage; complete endpoint matrix pending FE09-T013/T014. |
| NFR-FE09-SEC-002 | Member own-fine isolation for list and detail. | Historical own-list evidence; detail isolation pending FE09-T018. |
| NFR-FE09-SEC-003 | Librarian/Admin collection/paid guards and Admin-only waive/cancel guards. | Partial historical evidence; normalized route cases pending FE09-T016/T017. |
| NFR-FE09-SEC-004 | Calculation ignores client amount, overdue days, and date inputs. | Historical calculation evidence; expanded tampering cases pending FE09-T015. |
| NFR-FE09-SEC-005 | Validate IDs, status, payment method, note, reason, and pagination before repository access. | Pending FE09-T013/T014/T018. |
| NFR-FE09-TXN-001 | Atomic fine creation and duplicate detection under concurrency. | Repository foundation exists; SQL concurrency evidence pending FE09-T015. |
| NFR-FE09-TXN-002 | Atomic payment/reason/state/audit update with rollback and one terminal winner. | Pending FE09-T016/T017. |
| NFR-FE09-PERF-001 | Pagination defaults/bounds and fixed `FineId ASC` ordering. | Pending FE09-T018. |
| NFR-FE09-PERF-002 | Borrow-detail calculation lookup uses key-based access. | Repository review and focused contract evidence pending FE09-T015. |
| NFR-FE09-LOG-001 | Calculation, collection, paid, waive, cancel, and failed mutation are traceable. | Partial historical evidence; complete audit matrix pending FE09-T016/T017. |
| NFR-FE09-LOG-002 | Audit/log output excludes unnecessary personal data. | Pending FE09-T013/T016/T017 security assertions. |
| NFR-FE09-UX-001 | Fine display includes amount, reason, status, and borrowing context. | Server contract pending FE09-T018; production frontend remains TD-004. |
| NFR-FE09-UX-002 | Error responses distinguish missing, unauthorized, and terminal conflicts. | Deterministic codes specified; route assertions pending FE09-T013/T014. |
| NFR-FE09-TIME-001 | Returned and active loans use `Asia/Ho_Chi_Minh` business date. | Pending FE09-T015 timezone-boundary tests. |

## 8. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/fineManagementRoutes.test.js tests/fineRoutes.test.js tests/fineContract.test.js
npm.cmd --prefix backend test -- --runTestsByPath tests/sql/fineConcurrency.sqltest.js
node --test frontend/test/fineManagementFrontend.test.js
npm.cmd run trace:enforce
git diff --check
```

The full repository test, lint, and build gates remain required by the project before merge; they
are not rerun as part of this documentation-only normalization pass.
