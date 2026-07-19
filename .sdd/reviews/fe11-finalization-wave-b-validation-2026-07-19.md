# FE11 Finalization Wave B Validation - 2026-07-19

Status: PASS - IMPLEMENTATION H2 READY; B7 INTEGRATION PENDING

Scope: `FE11-REQ01`, `FE11-REQ02`, `FE11-REQ03`, and pre-integration evidence for `FE11-ACC01`.

## Requirement Coverage

- `FR-FE11-031`: the Admin Dashboard loads read-only operational summary data before Request Management interaction.
- `FR-FE11-034`: Admin Request Management uses canonical server list pagination, filters, authoritative detail, and safe all-filtered-row CSV export.
- `FR-FE11-035` / `AC-FE11-019`: pending requests expose FE07-owned actions; completed requests are view-only and direct approve/reject attempts return `409 BORROW_REQUEST_NOT_PENDING`.

## RED-GREEN Evidence

1. RED: the new Playwright acceptance failed because `__e2e__/setup` did not create an Admin actor; the response contained only Member and Librarian IDs.
2. GREEN: the E2E harness gained optional Admin setup and in-memory Admin/User read services backed by the shared FE07/auth state. The focused FE11 browser case then passed 1/1.
3. Regression RED: running the FE11 case with the existing golden path exposed shared-state contamination because pending FE11 requests remained visible to the second test.
4. Regression GREEN: `__e2e__/setup` now creates a fresh integration app for every test. The FE11 acceptance and system golden path pass together 2/2 with one worker.

No production endpoint, service, repository, schema, or business rule was changed by this browser-acceptance slice.

## Browser Acceptance

Isolated runtime:

- Frontend: `http://127.0.0.1:4185`
- Backend: `http://127.0.0.1:3101`
- Existing port `4173` and PID `13432`: untouched

The FE11 test creates one completed request and 21 pending requests through authenticated FE07 APIs, then proves:

- Admin login lands on `/admin/users` and renders the server-backed Dashboard summary.
- Page 1 returns 20 of 22 records; page 2 returns the remaining two records.
- The `PENDING` server filter reports 21 records.
- Pending detail is loaded from `/api/admin/requests/{requestId}`, includes barcode `BC2`, and exposes `Duyệt yêu cầu` / `Từ chối`.
- CSV export contains all 21 filtered pending requests, including records from both UI pages, and excludes the completed request.
- The `COMPLETED` server filter reports one record; its authoritative detail includes barcode `BC1` and has no action controls.
- Direct FE07 approve and reject attempts against the completed request both return `409 BORROW_REQUEST_NOT_PENDING`.

Result: **2/2 Playwright tests passed** (`E2E-FE11-ACC01` plus `E2E-SYS-001`).

## Supporting Automated Evidence

- Focused backend Admin Request, borrowing terminal-state, and dashboard security regression: **5/5 suites, 80/80 tests passed**.
- Focused frontend Admin Request, Admin shell, API, and page contracts: **48/48 tests passed**.
- System integration: **1/1 suite, 10/10 tests passed**.
- Traceability enforcement: every FE01-FE12 feature remains at **100%**, including FE11 `38/38` FR IDs.
- Live SQL evidence remains **8/8 suites, 61/61 tests passed**, with `DB_CLEAN` and `LOGIN_CLEAN`.

## Residual Boundary

- `FE11-REQ01..FE11-REQ03` have their named local implementation evidence and are ready for review.
- `FE11-ACC01` remains open until H2/H3, draft PR checks, exact associated CI, and human integration acceptance are recorded.
- `TD-021` has no remaining SQL or browser execution gap; it stays partial only until final PR/CI association is recorded.
- `TD-025` remains open through the required integration gates and must not be moved to Resolved before FE11 final closeout.
