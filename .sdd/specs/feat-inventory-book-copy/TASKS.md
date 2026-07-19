# TASKS.md - FE06 Inventory / Book Copy Management

Status: READY FOR REVIEW - FE06 reconciliation and live SQL complete; merge/human gates pending

Owner: Dat

Updated: 2026-07-19

Workflow State: FE06-T001 through FE06-T008 plus the post-H2 transactional race correction executed; final integration remains gated

---

## Task Rules

- Execute tasks in numeric order and begin each behavior task with its named RED tests.
- Do not claim completion from existing routes/tests; they predate v0.4.0.
- FE06 never performs FE07/FE08 workflow transitions into/out of `BORROWED` or `RESERVED`.
- Every existing-copy mutation requires matching `If-Match` and same-transaction conflict/audit handling.
- Add `@spec` tags to changed implementation files for mapped FR/BR IDs.

## Ordered Tasks

- [x] **FE06-T001 - Add RED route, SQL concurrency, and frontend contract tests.**
  - Maps to: BR-FE06-001 through BR-FE06-018; FR-FE06-001 through FR-FE06-024; AC-FE06-001 through AC-FE06-014.
  - Files: `backend/tests/inventoryRoutes.test.js`, create `backend/tests/helpers/inMemoryInventoryRepositories.js`, create `backend/tests/sql/inventoryConcurrency.sqltest.js`, `frontend/test/inventoryOperationalFrontend.test.js`.
  - Dependency: none.
  - RED: cover list/count response, deterministic pagination, safe fields, barcode/reference/location validation, active parent, transition matrix, required reason, borrow/reservation conflict, `If-Match`, idempotent deactivation, atomic audit, and removal of mock frontend ownership.
  - Verify RED: focused backend/SQL/frontend commands fail only on missing v0.4.0 behavior.
  - DoD: every AC has at least one assertion and rollback tests inspect copy, workflow, and audit state.

- [x] **FE06-T002 - Add BookCopies rowversion and document the mutation contract.**
  - Maps to: BR-FE06-010, BR-FE06-012, BR-FE06-016; FR-FE06-010, FR-FE06-017 through FR-FE06-019; AC-FE06-006, AC-FE06-009, AC-FE06-012; NFR-FE06-TXN-001/002.
  - Files: `database/Librarymanagement.sql`, `.sdd/rfcs/ADR-002-database-design.md`, `backend/src/models/BookCopy.js`, `backend/src/docs/openapi.yaml`.
  - Dependency: FE06-T001.
  - GREEN: add SQL `rowversion`, define opaque version encoding, document `If-Match` on update/status/delete, and preserve soft-deactivation-only behavior.
  - Verify: SQL tests can read/compare/advance versions and show no physical delete path.
  - DoD: schema changes remain reviewable and do not alter FE05 metadata or FE07/FE08 workflow columns.

- [x] **FE06-T003 - Reconcile validators, headers, and safe API responses.**
  - Maps to: BR-FE06-001 through BR-FE06-004, BR-FE06-011, BR-FE06-016 through BR-FE06-018; FR-FE06-001 through FR-FE06-005, FR-FE06-009, FR-FE06-011 through FR-FE06-014, FR-FE06-018, FR-FE06-020, FR-FE06-021, FR-FE06-023, FR-FE06-024; AC-FE06-001 through AC-FE06-005, AC-FE06-010, AC-FE06-012 through AC-FE06-014; NFR-FE06-SEC-001 through NFR-FE06-SEC-004.
  - Files: `backend/src/routes/inventoryRoutes.js`, `backend/src/controllers/inventoryController.js`, `backend/src/validators/inventoryValidators.js`, `backend/src/docs/openapi.yaml`.
  - Dependency: FE06-T001, FE06-T002.
  - GREEN: validate IDs, barcode, optional location 1..100 without control characters, exact page/limit policy, supported manual states, required reason 1..500, and `If-Match`.
  - Verify: route tests return deterministic safe `400`, `401`, `403`, `404`, and `409` responses.
  - DoD: invalid supplied pagination is rejected before repository query and response fields exclude unrelated protected data.

- [x] **FE06-T004 - Reconcile inventory list, counts, and lookups.**
  - Maps to: BR-FE06-003 through BR-FE06-006, BR-FE06-009, BR-FE06-018; FR-FE06-001 through FR-FE06-003, FR-FE06-008, FR-FE06-009, FR-FE06-024; AC-FE06-001 through AC-FE06-003, AC-FE06-009, AC-FE06-014; NFR-FE06-PERF-001 through NFR-FE06-PERF-003.
  - Files: `backend/src/services/inventoryService.js`, `backend/src/repositories/inventoryRepository.js`, `backend/tests/inventoryRoutes.test.js`.
  - Dependency: FE06-T003.
  - GREEN: return `{ items, page, limit, totalItems, totalPages, countsByStatus }` with identical filters for items/counts; expose copy/book summary and opaque version only.
  - Verify: focused route tests pass omitted/default pagination, invalid pagination, combined filters, counts, barcode hit/miss, and inactive availability cases.
  - DoD: only `AVAILABLE` copies count as stored available; effective borrow/public availability still also requires active parent book.

- [x] **FE06-T005 - Implement atomic create and metadata update.**
  - Maps to: BR-FE06-002, BR-FE06-003, BR-FE06-009, BR-FE06-011 through BR-FE06-013, BR-FE06-015, BR-FE06-016; FR-FE06-004, FR-FE06-005, FR-FE06-010 through FR-FE06-012, FR-FE06-018, FR-FE06-019, FR-FE06-021, FR-FE06-022; AC-FE06-004 through AC-FE06-006, AC-FE06-011, AC-FE06-012.
  - Files: `backend/src/services/inventoryService.js`, `backend/src/repositories/inventoryRepository.js`, `backend/src/repositories/auditLogRepository.js`, `backend/tests/inventoryRoutes.test.js`, `backend/tests/sql/inventoryConcurrency.sqltest.js`.
  - Dependency: FE06-T002 through FE06-T004.
  - GREEN: create is server-controlled `AVAILABLE` under an active parent; metadata update changes only barcode/location with current version; mutation and audit commit atomically.
  - Verify: focused route/SQL tests pass active/inactive parent, duplicate barcode, invalid location, stale version, and audit-failure rollback cases.
  - DoD: update cannot accept status or FE05 metadata and returns the advanced version.

- [x] **FE06-T006 - Implement transactional manual status and deactivation commands.**
  - Maps to: BR-FE06-004 through BR-FE06-008, BR-FE06-010, BR-FE06-012, BR-FE06-014 through BR-FE06-017; FR-FE06-006 through FR-FE06-008, FR-FE06-010, FR-FE06-013 through FR-FE06-020, FR-FE06-022, FR-FE06-023; AC-FE06-006 through AC-FE06-013; NFR-FE06-TXN-001/002, NFR-FE06-LOG-001.
  - Files: `backend/src/services/inventoryService.js`, `backend/src/repositories/inventoryRepository.js`, `backend/src/repositories/auditLogRepository.js`, `backend/tests/inventoryRoutes.test.js`, `backend/tests/sql/inventoryConcurrency.sqltest.js`.
  - Dependency: FE06-T005.
  - RED: race tests change borrow/reservation state between initial read and mutation; tests also cover prohibited manual `BORROWED`/`RESERVED`, reserved release, borrowed release, active-parent guard, reason, stale version, and duplicate deactivate.
  - GREEN: lock `BookCopies -> BorrowDetails -> Reservations`, compare version, recheck conflicts/parent, apply one valid transition, and write audit in one transaction.
  - Verify: focused route/SQL tests pass all state-matrix and rollback cases without deadlock.
  - Post-H2 correction evidence: four route race regressions went RED at `201/200`, then GREEN; route `35/35`, FE06 SQL `10/10` live, cleanup `DB_CLEAN`/`LOGIN_CLEAN`.
  - DoD: duplicate current-version deactivation returns current copy plus `changed = false` and writes no second transition audit.

- [x] **FE06-T007 - Replace mock inventory ownership with server-backed frontend state.**
  - Maps to: AC-FE06-001 through AC-FE06-014; NFR-FE06-UX-001/002.
  - Files: `frontend/src/page/InventoryPage.jsx`, `frontend/src/component/inventory/InventoryManagement.jsx`, `frontend/src/component/inventory/BookCopies.jsx`, `frontend/src/component/inventory/Filter.jsx`, `frontend/src/component/inventory/StatusBadge.jsx`, `frontend/src/api/libraryFeatureApi.js`, `frontend/test/inventoryOperationalFrontend.test.js`.
  - Dependency: FE06-T003 through FE06-T006.
  - RED: tests fail while operational data comes from `MOCK_BOOKS`/`MOCK_COPIES`, mutations omit `If-Match`/reason, or conflicts offer a local override.
  - GREEN: load/filter real inventory, preserve copy version, require reason/confirmation, send current version, reload after success, and show stale/borrow/reservation/parent conflict guidance.
  - Verify: `node --test frontend/test/inventoryOperationalFrontend.test.js` passes.
  - DoD: UI clearly separates book metadata from copy state and never fabricates successful copy mutations.

- [x] **FE06-T008 - Close traceability and verification evidence.**
  - Maps to: all FE06 BR/FR/AC IDs and the Definition of Done.
  - Files: changed FE06 implementation/tests, `.sdd/specs/feat-inventory-book-copy/TEST_PLAN.md`, `.sdd/specs/feat-inventory-book-copy/CHANGELOG.md`.
  - Dependency: FE06-T001 through FE06-T007.
  - Verify: focused backend, SQL, frontend, `npm.cmd run trace:enforce`, and `git diff --check` pass; full suites run only at the merge gate.
  - DoD: evidence records exact results and cross-feature lock review without claiming prototype/historical tests cover v0.4.0.

## Requirement-To-Task Coverage

| Requirement IDs | Planned tasks |
| --- | --- |
| BR-FE06-001 through BR-FE06-004 | FE06-T003, FE06-T005 |
| BR-FE06-005 through BR-FE06-010 | FE06-T004, FE06-T006 |
| BR-FE06-011 through BR-FE06-014 | FE06-T003, FE06-T005, FE06-T006 |
| BR-FE06-015 through BR-FE06-018 | FE06-T002, FE06-T003, FE06-T005, FE06-T006 |
| FR-FE06-001 through FR-FE06-005 | FE06-T003, FE06-T004, FE06-T005 |
| FR-FE06-006 through FR-FE06-010 | FE06-T004, FE06-T006 |
| FR-FE06-011 through FR-FE06-014 | FE06-T003, FE06-T005, FE06-T006 |
| FR-FE06-015 through FR-FE06-020 | FE06-T002, FE06-T006 |
| FR-FE06-021 through FR-FE06-024 | FE06-T003, FE06-T005, FE06-T006 |
| AC-FE06-001 through AC-FE06-005 | FE06-T004, FE06-T005 |
| AC-FE06-006 through AC-FE06-010 | FE06-T003, FE06-T006 |
| AC-FE06-011 through AC-FE06-014 | FE06-T003, FE06-T005, FE06-T006, FE06-T007 |

## Completion Gate

- [ ] FE06-T001 through FE06-T008 are complete and independently reviewed.
- [x] Focused backend `35/35`, FE06 SQL `10/10`, frontend `6/6`, traceability `24/24`, and diff checks pass.
- [ ] Full merge-gate suites pass when the implementation branch is ready.
- [ ] FE05/FE07/FE08 owners confirm state ownership and lock-order compatibility.
- [ ] Dat confirms server-backed inventory and stale/conflict UX behavior.
