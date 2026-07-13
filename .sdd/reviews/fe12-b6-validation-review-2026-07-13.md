# FE12 B6 Validation Review - 2026-07-13

Status: B6 COMPLETE - HUMAN REVIEW CONFIRMED, INDEPENDENT RE-REVIEW CLEAN

Branch: `feat/fe12-validation`

## Purpose

Record the FE12 validation hardening evidence before human review and any integration decision.
This review stays inside the approved borrowing, inventory, and user-statistics report scope.

## Correctness Findings Addressed

| Finding | Resolution | Evidence |
| --- | --- | --- |
| Joined borrow details duplicated request status counts | Deduplicate rows by `RequestId` before request aggregation | `backend/tests/reportRepository.test.js` |
| Date-only `toDate` excluded activity after midnight | Use an exclusive next-day boundary | `backend/tests/reportRepository.test.js` |
| New-member periods used account creation time | Select and aggregate `Members.ApprovedAt` | `backend/tests/reportRepository.test.js` |
| Category counts represented copies and low-stock rows lacked totals | Count unique books and expose `totalCopies`/`availableCopies` | `backend/tests/reportRepository.test.js` |
| Failed report access was not safely audited | Add route-scoped failure auditing with code, status, method, and path only | `backend/tests/reportRoutes.test.js` |
| OpenAPI omitted or misnamed FE12 filters | Document the implemented query parameters for all three endpoints | `backend/tests/reportContract.test.js` |
| OpenAPI omitted FE12 success schemas and exact runtime enums | Add reusable response schemas and compare documented enums with exported validator enums | `backend/tests/reportContract.test.js` |
| FE12 frontend routes and API failures could show unauthorized or fabricated data | Add staff route guards and truthful loading/empty/error states | `frontend/test/reportAccess.test.js` |
| Inventory category options read the wrong response shape | Read `response.data.categories` from the production controller envelope | `frontend/test/reportAccess.test.js` |
| Report layouts overflowed horizontally at desktop/mobile widths | Allow flex content to shrink, preserve responsive split rules, and stack date filters on mobile | `frontend/test/reportAccess.test.js` |
| Network errors still claimed the UI used demo fallback data | Add an FE12-specific truthful error resolver | `frontend/test/apiErrorMessages.test.js` |
| Successful report audits stored raw filter values | Omit success metadata while retaining safe failure diagnostics | `backend/tests/reportRoutes.test.js` |
| User date filters changed global totals through `Users.CreatedAt` | Keep global totals and filter only `newMembersByPeriod` by `Members.ApprovedAt` | `backend/tests/reportRepository.test.js`, `backend/tests/reportRoutes.test.js` |
| Inventory/User OpenAPI operations omitted validation responses | Add `400` responses and contract assertions for every FE12 endpoint | `backend/tests/reportContract.test.js` |
| Borrowing/User pages imposed fixed sample dates | Start unfiltered and build params from non-blank dates only | `frontend/test/reportAccess.test.js`, `frontend/test/reportFilters.test.js` |
| Date validators accepted timestamps despite `format: date` | Accept only real calendar dates in exact `YYYY-MM-DD` form | `backend/tests/reportRoutes.test.js` |
| Backend low-stock set differed from the UI | Use `availableCopies <= 2` in production and in-memory report repositories | `backend/tests/reportRepository.test.js`, `backend/tests/reportRoutes.test.js` |
| Status/location filters distorted low-stock availability | Select matching books/copies for filtered totals while calculating low stock from each selected book's full copy set, including zero-copy books | `backend/tests/reportRepository.test.js` |
| Inventory chart described book counts as copy counts | Rename the chart to `Đầu sách theo thể loại` | `frontend/test/reportAccess.test.js` |
| Borrowing date-range integration test had no source data | Create a borrow request before asserting a future range returns empty and apply date filters in the in-memory repository | `backend/tests/reportRoutes.test.js` |
| In-memory borrowing and user filters diverged from production SQL semantics | Aggregate from production-equivalent selected rows and cover role/status/membership/book/date parity | `backend/tests/reportInMemoryParity.test.js` |
| In-memory low-stock rows omitted production/OpenAPI fields | Include `categoryName`, `copies`, `totalCopies`, and `availableCopies` | `backend/tests/reportInMemoryParity.test.js` |
| Pending `REQUESTED` details appeared as borrow-period/top-book activity | Count only actual-loan statuses: `BORROWED`, `RETURNED`, `LOST`, `DAMAGED`, and `OVERDUE` | `backend/tests/reportRepository.test.js`, `backend/tests/reportInMemoryParity.test.js` |
| User-statistics spec named the wrong runtime membership source | Align the source of membership status and approval periods to `Members` | `.sdd/specs/feat-reporting-statistics/SPEC.md` |

## Automated Evidence

| Check | Result |
| --- | --- |
| Focused FE12 backend tests after review remediation | PASS - 4 suites, 31 tests |
| Focused FE12 frontend access/filter tests | PASS - 9 tests |
| Full backend suite | PASS - 18 suites, 236 tests |
| Full frontend suite | PASS - 24 tests |
| Frontend lint | PASS |
| Frontend production build | PASS |
| Traceability enforcement | PASS; FE12 8/8 FR tags, 100% |

## Manual Browser Evidence

The frontend and temporary in-memory backend harness ran at `http://127.0.0.1:5173`
and `http://127.0.0.1:3000`.

- Guest access to `/reports/borrowing` redirected to `/login`.
- Member access to `/reports/users` redirected to `/forbidden` with the 403 page.
- Admin loaded borrowing, inventory, and user statistics from the real report endpoints.
- The original in-memory browser harness exposed `Software Engineering`; selecting category ID `1`
  remained selected after applying the filter. A later review found that its metadata envelope did
  not match production, so the production `response.data.categories` path was fixed and regression-tested.
- Desktop `1265x720`: document, body, main, and content widths did not overflow.
- Mobile `390x844`: document, main, content, report split, and date filter all had
  `scrollWidth === clientWidth`; the report split resolved to one column. Wide tables
  remained scrollable only inside `.lib-table-wrap`.
- Loading and low-inventory empty states were visible.
- After stopping the temporary backend, the report removed loaded metrics and displayed
  `Không kết nối được backend. Vui lòng kiểm tra kết nối và thử lại.` without demo data.

The browser screenshot command timed out, so no image artifact is claimed. The evidence
above comes from browser DOM snapshots, route URLs, selected control state, and measured
layout values. The temporary backend harness was stopped and removed after validation.

## Follow-up Outside FE12

The shared `AppLayout` sidebar Logout button currently navigates to `/login` without clearing
stored authentication. Guest validation used the existing Home-page logout flow, which does
clear storage. This pre-existing auth-shell issue was not changed on the FE12 branch.

## Scope Control

- No export, dashboard, BI, schema, dependency, or unrelated feature work was added.
- Unrelated untracked paths were left untouched: `.superpowers/`, `backend/coverage/`,
  and `docs/briefing-thuyet-trinh-du-an-vi.docx`.
- The branch is not pushed or merged by this validation step.

## Final Independent Re-review

The final read-only re-review found no remaining Critical or Important FE12 issues.
It confirmed the explicit category mapping, production-valid copy statuses, production/in-memory
aggregation parity, actual-loan metrics, low-stock semantics, metadata envelope, authorization,
audit privacy, OpenAPI contract, frontend states, tests, documentation, and scope controls.

Verdict: **Ready for human review: Yes**.

## Human Review

Nhat explicitly confirmed `đã review` in this Codex task after the final clean independent
re-review. This records the human review gate only; no PR, commit, push, merge, or separate
reviewer identity is inferred.

## Remaining Gate

1. Choose the B7 integration path: local merge, push/PR, or keep the branch for later.
