# TASKS.md - FE09 Fine Management

Status: READY FOR REVIEW

Owner: Dung 

> Tasks decomposed from PLAN.md. This iteration delivers the server-side fine workflow (TD-001/002/003);
> the legacy prototype is kept and frontend alignment (TD-004) remains a follow-up.

| ID | Task | Files | Deps | Spec Refs | Done When | Status |
| -- | ---- | ----- | ---- | --------- | --------- | ------ |
| T001 | Fine repository: borrow-detail lookup + fine CRUD with transactions | `backend/src/repositories/fineRepository.js` | - | FR-FE09-003/006, NFR-FE09-TXN-001 | Server-side create/collect/paid run in transactions; dedupe under lock | DONE |
| T002 | Calculate fine server-side from stored dates | `backend/src/services/fineManagementService.js` | T001 | FR-FE09-003/004/005, BR-FE09-005/006/007/008 | amount = overdue days × 5,000; zero days → no fine | DONE |
| T003 | Duplicate-fine prevention | service + repo | T001,T002 | FR-FE09-006, BR-FE09-009 | Re-calculate returns existing fine, no duplicate | DONE |
| T004 | Record collection (PAID iff fully collected) | service + repo | T001 | FR-FE09-007, INV-4/5 | 0 ≤ collectedAmount ≤ amount; PAID only when full | DONE |
| T005 | Mark paid + waive/cancel (admin) with reason | service + repo | T001 | FR-FE09-008, Q-FE09-005, BR-FE09-012 | UNPAID→PAID/WAIVED/CANCELLED, terminal guards | DONE |
| T006 | View fines: member `/me`, staff list, owner/staff by id | service + controller | T001 | FR-FE09-001/002, NFR-FE09-SEC-002 | Member sees only own; staff can filter | DONE |
| T007 | Authorization on collection/paid/waive | service + routes | T002-T006 | FR-FE09-009, BR-FE09-004 | Member blocked from collect/paid; admin-only waive/cancel | DONE |
| T008 | Audit logs for calculate/collect/paid/waive/cancel | service | T002-T005 | NFR-FE09-LOG-001, INV-8 | Each action writes an audit entry | DONE |
| T009 | Routes + app wiring (keep legacy CRUD) | `fineRoutes.js`, `app.js` | T001-T008 | SPEC §11 | New endpoints live; prototype CRUD unchanged | DONE |
| T010 | Tests (in-memory repository double) | `tests/fineManagementRoutes.test.js`, `tests/helpers/inMemoryFineRepositories.js` | T001-T009 | AC-FE09-001..010 | 11 tests pass | DONE |
| T011 | SQL `Fines` CHECK includes `CANCELLED` | `database/Librarymanagement.sql` | - | §10.3 state model | CHECK allows UNPAID/PAID/WAIVED/CANCELLED | DONE |
| T012 | Align frontend `FineManagement.jsx` to new API | `frontend/src/page/FineManagement.jsx` | T009 | TD-004 | Follow-up — not in this iteration | NOT STARTED |

## Out of this iteration

- T012 frontend alignment (TD-004).
- Real SQL-Server-backed integration test (TD-021).
