# FE07 B6 Validation Review - 2026-07-14

Status: B6 COMPLETE - HUMAN REVIEW CONFIRMED

Branch: `feat/fe07-validation`

## Purpose

Record FE07 B6 validation evidence before Nhat's required human review and any commit, push, or merge decision.

## Findings Addressed

| Finding | Resolution | Evidence |
| --- | --- | --- |
| FE07 routes did not consistently enforce member/staff access | Added a shared borrowing route guard to every FE07 route | `frontend/test/borrowingFrontend.test.js` |
| API failures could leave demo rows or simulated mutation success visible | Use empty canonical state and real backend mutations on all API-backed FE07 pages | `frontend/test/borrowingFrontend.test.js` |
| Shared dialogs collided with Bootstrap's hidden `.modal` class | Namespaced the dialog structure and styles as `lib-modal*` | `frontend/test/borrowingFrontend.test.js` |
| Wide FE07 layouts could overflow at desktop/mobile widths | Allow split children to shrink and confine table scrolling to `.lib-table-wrap` | `frontend/test/borrowingFrontend.test.js`, browser measurements |
| Derived overdue rows appeared in both active and history sections | Partition overdue borrowed rows into the active collection only | `frontend/test/borrowingFrontend.test.js` |
| Member lookup displayed fabricated KPI/detail data | Render only records returned by the selected-member API | `frontend/test/borrowingFrontend.test.js` |
| Unknown member lookup returned a plausible empty member | Return `404 MEMBER_NOT_FOUND` per EC-FE07-001 and document it in OpenAPI | `backend/tests/borrowingRoutes.test.js`, `backend/tests/borrowingContract.test.js` |
| Return UI derived a calendar date through UTC | Omit `returnDate` so the server applies its canonical date | `frontend/test/borrowingFrontend.test.js` |
| Approval UI persisted an invented note and displayed unsupported eligibility checks | Submit no invented note and show only actual copy state while the server revalidates | `frontend/test/borrowingFrontend.test.js` |
| Concurrent rejection could return `200` with a null request | Map a lost pending-update race to `409 BORROW_REQUEST_NOT_PENDING` | `backend/tests/borrowingRoutes.test.js` |
| Pending requests inflated active-loan metrics | Split pending, active, and historical rows into separate collections/tables | `frontend/test/borrowingFrontend.test.js` |
| Shared modal lacked accessible naming and focus management | Add `aria-labelledby`, initial focus, focus trap, Escape handling, and focus restoration | `frontend/test/borrowingFrontend.test.js` |

## Automated Evidence

| Check | Result |
| --- | --- |
| Frontend tests | PASS - 37/37 |
| Frontend lint | PASS |
| Frontend production build | PASS; existing chunk-size warning only |
| Backend full suite | PASS - 20 suites, 273/273 tests |
| Live FE07 SQL suite | PASS - 14/14; cleanup confirmed TestUsers=0 and TestCopies=0 |
| Traceability enforcement | PASS - FE07 22/22 FR tags, 100% |
| Backend dependency audit | PASS - 0 vulnerabilities during L3 |
| Diff whitespace/conflict check | PASS - line-ending warnings only |

## Browser Evidence

- Guest FE07 routes redirected to `/login`.
- Member access to staff FE07 routes redirected to `/forbidden`.
- Real request `1253` completed approval, renewal to 2026-08-11, and normal return; the final record displayed as returned.
- With the backend unavailable, FE07 showed the real connection error and an empty canonical table without demo data.
- Dialogs rendered above their backdrops using the namespaced classes.
- Desktop `1280x720` had no page-level horizontal overflow.
- Mobile `390x844` had no page-level horizontal overflow; the wide table scrolled only inside `.lib-table-wrap`.
- Temporary browser fixtures were removed and copy `1` was restored to `AVAILABLE`.

## Review Outcome

The independent reviewer returned seven Important findings after the initial evidence pass. All seven were remediated with focused regression coverage, followed by the recorded full automated and SQL gates.

## Human Review

Nhat explicitly confirmed `đã review` in this Codex task on 2026-07-14. This closes the required human review gate only; no commit, push, merge, or separate clean re-review is inferred.

## Residual Risks

- The create-request page still uses the documented temporary catalog because production FE01/FE06 copy browsing is outside FE07 scope.
- The frontend production bundle remains larger than Vite's 500 kB advisory threshold.
- Frontend dependency audit still reports the previously identified high-severity `form-data` advisory through `axios`; dependency remediation is outside this FE07 validation branch.

## Scope Control

- No FE09 fine creation, FE10 delivery worker, FE01/FE06 catalog integration, dependency upgrade, or unrelated redesign was added.
- No commit, push, or merge has been performed.

Verdict: **B6 validation complete and ready for integration decision: Yes.**

## Remaining Gate

1. Choose the commit/push/merge path.
