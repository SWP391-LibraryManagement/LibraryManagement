# System Integration Evidence - 2026-07-14

Branch: `test/system-integration`

Plan: `docs/superpowers/plans/2026-07-14-system-integration-test-plan.md`

Only observed results are marked `PASS`. The presentation rehearsals below used the automated fallback without a browser, so a final human visual check of the live UI is still recommended before presenting.

| ID | Status | Command / action | Observed result | Cleanup |
| --- | --- | --- | --- | --- |
| SIT-000 | PASS | `npm.cmd run test:system` | All six completed production-aligned services were wired into one Express application. | In-memory state is recreated per harness. |
| SIT-001 | PASS | `npm.cmd run test:system` | Authentication and role boundaries were enforced across FE07/FE08/FE09/FE10/FE12. | In-memory state is recreated per harness. |
| SIT-002 | PASS | `npm.cmd run test:system` | FE07 approval produced FE10 due-date notification data and FE12 loan activity. | In-memory state is recreated per harness. |
| SIT-003 | PASS | `npm.cmd run test:system` | FE08 queue processing held the copy, notified the member, and blocked another FE07 borrow. | In-memory state is recreated per harness. |
| SIT-004 | PASS | `npm.cmd run test:system` | Reservation priority blocked renewal without mutating the active loan. | In-memory state is recreated per harness. |
| SIT-005 | PASS | `npm.cmd run test:system` | A 14-day overdue return produced a 70,000 VND `UNPAID` fine. | In-memory state is recreated per harness. |
| SIT-006 | PASS | `npm.cmd run test:system` | The unpaid fine blocked borrowing; marking it paid allowed the next valid request. | In-memory state is recreated per harness. |
| SIT-007 | PASS | `npm.cmd run test:system` | Notification requests remained idempotent and exposed only safe response data. | In-memory state is recreated per harness. |
| SIT-008 | PASS | `npm.cmd run test:system` | FE12 remained read-only and excluded `REQUESTED` details from actual loan activity. | In-memory state is recreated per harness. |
| SIT-009 | PASS | `npm.cmd run test:system` | FE10 request failure did not roll back the approved FE07 borrowing state. | In-memory state is recreated per harness. |
| SIT-SQL-001 | PASS | `$env:SYSTEM_SQL_TEST_ALLOW_MUTATION='true'; $env:SYSTEM_SQL_TEST_ENV_FILE='D:\SWP391\library-management-system\backend\.env'; npm.cmd --prefix backend run test:sql:system` | 1 suite passed, 1 test passed. FE07 approval/return was visible to FE10, FE09 calculated 14 days = 70,000 VND, and FE12 reported the activity. | Cleanup assertions returned `TestUsers=0` and `TestCopies=0`; temporary notification template and seeded rows were removed. |

## Verification Gates

| Gate | Status | Observed result |
| --- | --- | --- |
| Full backend test suite | PASS | `npm.cmd --prefix backend test`: 21 suites passed, 282 tests passed. |
| Full frontend test suite | PASS | `npm.cmd --prefix frontend test`: 37 tests passed. |
| Focused system integration gate | PASS | `npm.cmd run test:system`: 1 suite passed, 9 tests passed. SMTP-not-configured warnings were advisory only. |
| SQL shared-state gate | PASS | `npm.cmd --prefix backend run test:sql:system`: 1 suite passed, 1 test passed with cleanup assertions. |
| Frontend lint | PASS | `npm.cmd --prefix frontend run lint` exited 0 with no lint errors. |
| Frontend build | PASS | `npm.cmd --prefix frontend run build` exited 0; Vite reported an advisory that the 952.61 kB JS chunk exceeds 500 kB. |
| Traceability enforcement | PASS | `npm.cmd run trace:enforce`: 6 implemented features, 0 below the 70% threshold. |
| Diff whitespace check | PASS | `git diff --check` exited 0; only line-ending conversion warnings were printed. |

## Presentation Rehearsals

| Rehearsal | Status | Required observation |
| --- | --- | --- |
| Normal pace | PASS | Automated fallback ran with verbose case names: SIT 9/9 and SQL 1/1 passed in 6.62 seconds; SQL cleanup assertions passed. No browser or live UI claim was used. |
| Timed five-minute fallback | PASS | Automated fallback completed in 6.67 seconds, below the 300-second limit; SIT 9/9 and SQL 1/1 passed with cleanup. |
