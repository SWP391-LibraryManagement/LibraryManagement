# Week 11 Coverage Evidence - 2026-07-14

Branch: `test/week11-quality-sprint`

Scope: the completed FE07, FE08, FE10, and FE12 controller/service/route/validator files configured by `backend/package.json`.

## Baseline Command

```powershell
npm.cmd --prefix backend run test:coverage -- --coverageReporters=json-summary --coverageReporters=text
```

Observed result: 21 suites passed, 282 tests passed.

| Metric | Covered / Total | Baseline | Target | Status |
| --- | --- | --- | --- | --- |
| Statements | 735 / 817 | 89.96% | 80% | PASS |
| Branches | 454 / 596 | 76.17% | 80% | GAP |
| Functions | 131 / 138 | 94.92% | 80% | PASS |
| Lines | 726 / 808 | 89.85% | 80% | PASS |

At least 23 additional meaningful branches must be covered to reach the 80 percent global branch floor.

## Ranked Gap Matrix

| Priority | File | Branch coverage | Meaningful gap | Spec / quality link |
| --- | --- | --- | --- | --- |
| 1 | `backend/src/services/reservationService.js` | 59.37% (57/96) | list filters, cancel race, copy mismatch, missing copy/reservation, hold failure, notification and audit fallback, empty queue, expiration promotion | FE08 FR-010, FR-016/017, FR-019/020/021 and EC-FE08 error flows |
| 2 | `backend/src/services/reportService.js` | 65.95% (31/47) | missing actor/context defaults, safe 5xx code fallback, audit-disabled behavior | FE12 role boundary and NFR-FE12-LOG safe audit evidence |
| 3 | `backend/src/controllers/reservationController.js` | 0% branch (0/1), 64.51% lines | controller `next(error)` paths for list/process/expire endpoints | FE08 API error propagation |
| 4 | `backend/src/controllers/reportController.js` | 0% branch (0/1), 80% lines | controller `next(error)` paths for all three reports | FE12 API error propagation |
| 5 | `backend/src/services/borrowingService.js` | 74.83% (116/155) | remaining ID/role/date/race branches | FE07 edge cases; address only if FE08/FE12 gaps do not reach the threshold |

## Selected Closure Work

1. Add FE08 service/controller tests for the documented queue, cancellation, mismatch, and fallback branches.
2. Add FE12 service/controller tests for safe access-failure auditing and dependency-optional branches.
3. Re-run coverage after each focused group.
4. Do not add tests whose only purpose is invoking route factory defaults; threshold credit must come from observable behavior or safe failure handling.

## Closure Result

Added direct service coverage in:

- `backend/tests/reservationService.test.js`: 14 FE08 tests covering list filters, role guards, cancellation outcomes, process validation, queue outcomes, notification/audit fallback, and hold expiration promotion.
- `backend/tests/reportService.test.js`: 5 FE12 tests covering report forwarding, role guards, safe 5xx/unknown error metadata, and audit-disabled operation.

Observed after the focused additions: 23 suites passed, 301 tests passed.

| Metric | Covered / Total | Final | Target | Status |
| --- | --- | --- | --- | --- |
| Statements | 760 / 817 | 93.02% | 80% | PASS |
| Branches | 496 / 596 | 83.22% | 80% | PASS |
| Functions | 133 / 138 | 96.37% | 80% | PASS |
| Lines | 751 / 808 | 92.94% | 80% | PASS |

Key improvements:

- `reservationService.js` branch coverage: 59.37% -> 88.54%.
- `reportService.js` branch coverage: 65.95% -> 95.74%.
- No production source file changed to obtain the result.

## Enforced Gate

`backend/package.json` now requires 80 percent globally for statements, branches, functions, and lines. CI runs:

```powershell
npm.cmd --prefix backend run test:coverage:ci
```

Observed result after enabling the threshold: 23 suites passed, 301 tests passed, and all four coverage metrics remained above 80 percent. The command exited 0.

## Generated Artifacts

`backend/coverage/` is generated locally and is ignored by the repository.
