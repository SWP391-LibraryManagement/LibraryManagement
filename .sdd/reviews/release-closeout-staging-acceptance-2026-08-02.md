# Release Closeout Staging Acceptance - 2026-08-02

## Decision

**PASS — FE07 RETURN-DATE BUSINESS-TIME PERSISTENCE AND AUTHENTICATED STAGING ACCEPTANCE VERIFIED; CLEANUP CLEAN.** Deploy workflow `30722972056` deployed exact PR head `bf4dd2268c63a00620fc262f643768c2f434894c`. Final run `lms-acceptance-20260802-b22898eb` passed the complete cross-role scenario and final server-derived snapshot: two approved membership applications, one completed/returned borrow, one notified reservation, one three-day fine, five notifications, eight audit logs, and the expected reserved-copy state.

Exact retained SQL history after cleanup is `FineId=8`, `UserId=126`, `BorrowDetailId=66`, `OverdueDays=3`, `Amount=15000`, `Status=CANCELLED`, `DueDate=2026-07-30`, `ReturnDate=2026-08-02`, and detail status `RETURNED`. Cleanup returned `CLEANED`: four retained but inactive synthetic users, zero active users/tokens/members, zero open loans/reservations, zero active fixture books/copies, and one inactive historical copy. Four login attempts and the retained old token returned `401`; the temporary runtime and helper returned `404/404`.

The immediately preceding run `lms-acceptance-20260802-6706b9ab` had already passed `validatePostFlow`, but the harness then classified the four expected `403` authorization probes and the expected retired-route `404` as browser-console failures because authenticated probes ran inside `page.evaluate`. Cleanup for that run was also `CLEANED`. RED/GREEN changed only the ignored operator harness: RED was `11/12`, GREEN was `12/12`, authenticated API probes now use operator-side Node `fetch`, and the strict assertion for genuine browser errors remains unchanged. No product, schema, API, dependency, credential, or workflow change was introduced by the harness correction.

This final decision supersedes the historical failed-run decision retained below. FE07-T061 now has its required deploy and clean L4 evidence and is eligible for H3 review; the task remains open until H3 because this run does not authorize merge or task closure.

### Post-merge closeout addendum

H3 completed on exact head `7660a6ee4f78bd87e436590f2a992d581517bff7` with zero actionable Standards findings and zero Spec findings. PR #96 merged as `e4bdfd8e7e93b4745586294afa6c4656a7159292`; post-merge CI `30725685264` and staging deploy `30725829869` both succeeded on that merge commit. Independent public smoke then returned `200` for frontend `/login`, backend `/health`, and the public catalog API. These facts satisfy the remaining H3, merge, CI, deploy, and smoke conditions for FE07-T061 closure.

The pre-H3 sentence above is retained as the immutable gate state at acceptance-run time; this addendum supersedes only its statement that H3/merge/task closure remained outstanding.

Version-label clarification: the return-date business-persistence remediation is unversioned. The phrase “approved v0.9.1 remediation” in the immutable historical block below is superseded metadata; `v0.9.1` remains assigned to the 2026-07-29 damaged/lost-return queue-handoff correction recorded in the FE07 changelog.

### Final accepted-run evidence

| Evidence | Actual | Result |
| --- | --- | --- |
| Deploy | Workflow `30722972056`, exact SHA `bf4dd2268c63a00620fc262f643768c2f434894c` | PASS |
| Harness regression | RED `11/12`; GREEN `12/12`; browser-error assertion retained | PASS |
| Final live run | `lms-acceptance-20260802-b22898eb` | PASS |
| Server-derived fine | `ReturnDate=2026-08-02`, `OverdueDays=3`, `Amount=15000` | PASS |
| Cross-role results | applications `2`, borrows `1`, reservations `1`, fines `1`, notifications `5`, audit logs `8` | PASS |
| Cleanup/auth | `CLEANED`; logins `401/401/401/401`; old token `401` | PASS |
| Runtime residue | runtime/helper `404/404` | PASS |

### Final accepted-run authenticated role matrix

The following rows are the durable, redacted role/route/API/state evidence for final run `lms-acceptance-20260802-b22898eb`.

| Actor | UI route | API method/path | Expected state | Actual state | Result | Artifact |
| --- | --- | --- | --- | --- | --- | --- |
| Member A | `/login`, `/membership`, `/borrowing/new` | `POST /api/auth/login`; `POST /api/membership/applications`; `POST /api/borrow-requests` | Approved membership; request created and ultimately returned | Application approved; final snapshot contained Member A borrow `COMPLETED / RETURNED` | PASS | Redacted `acceptance_passed` event and final SQL snapshot |
| Member B | `/login`, `/membership`, `/reservations/mine` | `POST /api/auth/login`; `POST /api/membership/applications`; `POST /api/reservations` | Approved membership; reservation promoted and notification visible | Application approved; reservation `NOTIFIED`; notification badge visible | PASS | Redacted `acceptance_passed` event |
| Librarian | `/librarian/borrow-requests`, `/librarian/returns`, `/librarian/fines`, `/librarian/reservations`, `/reports/borrowing` | `PATCH /api/borrow-requests/{id}/approve`; `PATCH /api/borrow-details/{id}/return`; `POST /api/fines/calculate`; `POST /api/reservations/process-queue`; `GET /api/reports/borrowing` | Approve loan; persist a three-day overdue return; calculate `15000`; notify exact-copy queue head; load report | Borrow returned with `ReturnDate=2026-08-02`; fine `OverdueDays=3`, `Amount=15000`; exact copy `RESERVED`; report KPI loaded | PASS | Redacted final SQL snapshot and `acceptance_passed` event |
| Admin | `/admin/users`, audit view | `PATCH /api/membership/applications/{id}/approve`; `GET /api/users`; `GET /api/admin/audit-logs`; retired `PUT /api/users/{id}` | Approve both applications; preserve responsive navigation; load redacted audit data; retired route returns `404` without mutation | Two applications approved; four viewports had no overflow; audit loaded without forbidden fields; retired route returned `404` and before/after payloads matched | PASS | Redacted authorization and responsive assertions |

### Final accepted-run cross-role scenario matrix

| Actor/phase | UI route | API method/path or operation | Expected state | Actual state | Result | Artifact |
| --- | --- | --- | --- | --- | --- | --- |
| Operator preflight | N/A — operator-only | Public smoke and read-only Kudu checks | Correct staging targets; safe Node/SQL transport; no old runtime/helper | App and SQL ready; deployed `mssql` available; runtime/helper `404/404` | PASS | Redacted `transport_preflight_passed` event |
| Operator fixture seed | N/A — operator-only | Parameterized exact-ID Kudu/SQL fixture seed | Four synthetic users and one run-specific book/copy | Seed completed with an exact run manifest | PASS | Redacted `fixture_seeded` event |
| Members A/B and Admin membership | `/membership`, `/admin/users` | `POST /api/membership/applications`; `PATCH /api/membership/applications/{id}/approve` | Two approved membership applications | Final snapshot contained two approved applications | PASS | Redacted `acceptance_passed` event |
| Member A and Librarian borrow | `/borrowing/new`, `/librarian/borrow-requests` | `POST /api/borrow-requests`; `PATCH /api/borrow-requests/{id}/approve` | Run-specific copy borrowed for Member A | Final snapshot contained one request `COMPLETED` with detail `RETURNED` after the full flow | PASS | Redacted `acceptance_passed` event and final SQL snapshot |
| Member B reservation | `/reservations/mine` | `POST /api/reservations` | Active reservation for the same run-specific copy | Reservation created and later reached `NOTIFIED` | PASS | Redacted `acceptance_passed` event |
| Operator business-date aging | N/A — operator-only | Parameterized SQL `DueDate=@dueDate`, where `dueDate=2026-07-30` was derived from the `Asia/Ho_Chi_Minh` date | Exact three-day overdue boundary | UI displayed `Quá hạn 3 ngày`; retained SQL stored `DueDate=2026-07-30` | PASS | Redacted `borrow_aged` event and retained SQL history |
| Librarian return, fine, and queue | `/librarian/returns`, `/librarian/fines`, `/librarian/reservations` | `PATCH /api/borrow-details/{id}/return`; `POST /api/fines/calculate`; `POST /api/reservations/process-queue` | Return on `2026-08-02`; fine `3 × 5000`; exact-copy reservation notified | `ReturnDate=2026-08-02`, `OverdueDays=3`, `Amount=15000`; reservation `NOTIFIED`; copy `RESERVED` | PASS | Redacted final SQL snapshot |
| Librarian/Admin/unauthenticated authorization | `/reports/borrowing`, Admin audit view | `GET /api/reports/borrowing`; `GET /api/admin/audit-logs`; protected user/queue probes; retired `PUT /api/users/{id}` | Report/audit load; planned `401/403/404`; no retired-route mutation | KPI and audit loaded; unauthenticated audit `401`; Member/Librarian probes `403`; retired route `404` with equal before/after payloads | PASS | Redacted method/path/status assertions |
| Operator final invariant | N/A — operator-only | Exact-manifest SQL inspect | Applications `2`, borrows `1`, reservations `1`, fines `1`, notifications at least `3`, audit logs at least `1` | Applications `2`, borrows `1`, reservations `1`, fines `1`, notifications `5`, audit logs `8` | PASS | Redacted `acceptance_passed` event |
| Operator cleanup and revocation | Login plus public catalog verification | Exact-manifest cleanup; `POST /api/auth/login`; `GET /api/auth/me`; public catalog read | No active synthetic state or token; fixture absent publicly; runtime/helper removed | `CLEANED`; four logins and old token `401`; public fixture absent; runtime/helper `404/404` | PASS | Redacted `cleanup_verified` and `post_cleanup_auth_verified` events |

## Historical failed-run evidence (superseded)

Every subsection in this block preserves the state and evidence of failed run `lms-acceptance-20260802-3ea0d609` and its immediate remediation checkpoint. The final decision and final-run matrices above supersede this entire block. Statements below such as “remains undeployed”, “requires a newly reviewed H1”, “acceptance incomplete”, or “H3 remains open” describe only that historical checkpoint and are not the current release state.

### Failed-run decision and root cause

**FAIL — FE07 RETURN-DATE BUSINESS-TIME PERSISTENCE DEFECT; CLEANUP CLEAN.** The FE12 borrowing-report readiness locator was repaired through RED/GREEN TDD and passed live. The scenario progressed through membership approval, Admin responsive navigation, borrow approval, reservation creation, exact three-day aging, return mutation, fine calculation, exact-copy queue processing, Member B notification, the canonical `Tổng bản ghi` KPI, Admin audit loading, and every planned negative-authorization check.

The final server-derived snapshot then failed the exact fine invariant. The run expected a three-day fine, but the retained SQL history records `OverdueDays=2`, `Amount=10000`, `DueDate=2026-07-30`, and `ReturnDate=2026-08-01`; cleanup subsequently changed the fine status to `CANCELLED`. At execution time the current `Asia/Ho_Chi_Minh` business date was `2026-08-02`, and the return UI showed `Quá hạn 3 ngày`. FE07 computed the correct business date but passed the raw UTC `clock()` value to a `sql.Date` parameter, persisting the prior calendar date. FE09 then correctly calculated two days from that persisted value. This is a product persistence defect, not a harness locator defect. Mandatory cleanup, credential/token revocation, and post-run infrastructure checks passed. No live-acceptance task is closed, and no rerun remains under this H1.

> Historical-scope note: the remaining subsections preserve immutable failed-run and pre-rerun evidence; they do not override the final PASS decision or final accepted-run matrices above.

### Baseline and deployed targets

| Evidence | Actual | Result |
| --- | --- | --- |
| Approved design | `944c584c4867cc1d8abfd992537d089e04468638` | PASS |
| Deployed SHA | `e01585a9aa7d603daf932f7ac6459eaa0752746c` | PASS |
| Frontend/API | `https://www.thuvienhub.io.vn` / App Service staging API | PASS |
| App Service | `Running`, HTTPS-only before and after the run | PASS |
| Azure SQL | `LibraryManagementStaging`, `Online` before and after cleanup | PASS |
| Public staging smoke | frontend, health, schema, catalog, CORS, protected-route checks | PASS |
| Kudu/Node transport | credential-free SCM URL; Oryx Node `v22.22.2`; deployed `mssql` available | PASS |
| Remote residue | runtime and external cleanup helper both `404` before and after the run | PASS |

### Synthetic fixture contract

Run `lms-acceptance-20260802-3ea0d609` created exactly four synthetic `.invalid` users, book `30`, and copy `54`. Passwords remained runtime-random and in memory; fixture SQL remained parameterized and exact-ID scoped.

The ignored FE12 borrowing-report readiness change had no product/dependency diff. TDD evidence:

- RED: ten existing contracts passed and the eleventh failed because the harness still required the stale `/Báo cáo mượn sách/i` heading.
- GREEN: syntax checks passed and all harness contracts passed `11/11` after readiness was aligned with the canonical `.kpi-card` containing `Tổng bản ghi`; the contract also rejects the stale heading locator.
- The prior responsive, business-date, overdue-label, FE09, and exact-copy FE08 regressions remained green, and the live run passed the FE12 KPI readiness boundary.
- Focused local browser evidence passed `2/2` in `20.9s` with a clean process exit.

No password, hash, token, cookie, authorization header, publishing credential, connection string, or full synthetic email is retained in this record.

### Authenticated role matrix

| Actor | UI route | API method/path | Expected state | Actual state | Result | Artifact |
| --- | --- | --- | --- | --- | --- | --- |
| Member A | `/login`, `/membership`, `/borrowing/new` | auth, membership, borrow creation | Approved member with pending borrow | Login/application/approval/borrow creation completed | PASS to reached boundary | Redacted process order |
| Member B | `/login`, `/membership`, `/reservations/mine` | auth, membership, reservation creation | Approved member with active reservation | Login/application/approval/reservation completed | PASS to reached boundary | Redacted process order |
| Librarian | `/login`, `/librarian/borrow-requests`, `/librarian/returns`, `/librarian/fines`, `/librarian/reservations`, `/reports/borrowing` | auth, borrow approval, return, fine workflow, queue processing, report read | Borrow approved, overdue return completed, three-day fine calculated, reservation notified, report visible | UI workflow, exact-copy queue processing, notification, and report KPI completed; persisted fine was calculated from the wrong stored return date | FAIL | Redacted final invariant and SQL history |
| Admin | `/login`, `/admin/users` | auth, membership review, audit read, retired-route check | Approve both members, pass responsive navigation, load audit, and prove retired route does not mutate | Membership, responsive navigation, audit loading, and retired-route no-mutation check completed | PASS to reached boundary | Redacted process order/statuses |

### Cross-role scenario matrix

| Actor/phase | UI route | API or operation | Expected state | Actual state | Result | Artifact |
| --- | --- | --- | --- | --- | --- | --- |
| Operator preflight | Public/Kudu | smoke plus read-only Kudu command | Safe transport ready | Smoke passed; Node 22 loaded `mssql`; residue `404/404` | PASS | Redacted preflight summary |
| Fixture seed | Kudu/SQL | exact-ID parameterized seed | Four users and one book/copy | Seed completed | PASS | Redacted seed event |
| Member/Admin membership | `/membership`, `/admin/users` | submit and approve | Two approved members | Both applications approved through visible responsive cards | PASS | Harness control-flow evidence |
| Member/Librarian borrow | borrow creation/approval routes | borrow APIs | Borrowed run-specific copy | Request created and approved | PASS | Harness control-flow evidence |
| Member reservation | `/reservations/mine` | reservation API | Active Member B reservation | Reservation created | PASS | Harness control-flow evidence |
| Fixture age | Kudu/SQL | set exact BorrowDetail overdue by three Vietnam business days | `Quá hạn 3 ngày` | BorrowDetail `64` aged to `2026-07-30`; scoped UI assertion passed on Vietnam date `2026-08-02` | PASS | Boundary regression and live UI text |
| Return/fine/queue notification | return/fine/reservation routes | circulation APIs | Returned loan, three-day fine, notified reservation | Return, fine action, exact-copy queue processing, and Member B notification badge completed; final SQL-derived fine invariant exposed the persisted-date defect | FAIL | Redacted final invariant and retained SQL history |
| Reports/Audit/negative authorization | report/Admin routes | report/audit/protected APIs | Server-derived and authorization evidence | `Tổng bản ghi` KPI loaded; Admin audit loaded; all planned 401/403/404/no-mutation assertions passed | PASS | Redacted method/path/status evidence |

Runtime and root-cause evidence:

- The FE12 regression uses `.kpi-card` with `Tổng bản ghi`, rejects the stale borrowing-report heading locator, and passed `11/11` before and after the live run.
- Run `lms-acceptance-20260802-3ea0d609` reached its final inspect. The borrow `COMPLETED/RETURNED` and Member B reservation `NOTIFIED` assertions passed before the fine assertion failed.
- Exact retained SQL history after cleanup: `FineId=6`, `UserId=118`, `BorrowDetailId=64`, `OverdueDays=2`, `Amount=10000`, `Status=CANCELLED`, `DueDate=2026-07-30`, `ReturnDate=2026-08-01`.
- `borrowingService.returnBorrow` computes `returnBusinessDate`, but passes raw `returnDate` from `clock()` to the repository. `borrowingRepository.returnBorrowDetail` binds that value as `sql.Date`, losing the Vietnam-side next calendar date at the UTC boundary.
- `fineManagementService.calculateFineFromBorrowDetail` correctly uses persisted `detail.returnDate` as its reference date. FE09 therefore exposed, rather than caused, the FE07 persistence error.

### Desktop/mobile UX matrix

| Surface | Viewports | Actual | Result |
| --- | --- | --- | --- |
| Local FE04 Admin membership review | responsive card assertions | Fresh focused Playwright passed and exited cleanly | PASS |
| Local FE11 Admin request management | Chromium desktop/responsive contract | Fresh focused Playwright passed and exited cleanly | PASS |
| Authenticated Azure Admin navigation | `1440x900`, `1366x768`, `1280x720`, `390x844` | Eight items, no `Permissions`, no document overflow | PASS |
| Authenticated Azure audit loading/API secret-field allowlist | live audit route plus Admin API response | Audit loaded without product error; forbidden secret-field names absent | PASS |
| Authenticated Azure audit density/filter detail | planned complete UI checks | Not fully asserted by this harness | NOT RUN |

### Negative authorization matrix

| Request | Expected | Actual | Result |
| --- | --- | --- | --- |
| Unauthenticated audit access | `401` | `401` | PASS |
| Member audit/user/queue access | `403` | `403 / 403 / 403` | PASS |
| Librarian user-directory access | `403` | `403` | PASS |
| Admin retired `PUT /api/users/{id}` | `404` and no mutation | `404`; before/after profile payloads equal | PASS |

### Server-derived invariant evidence

The final inspect ran but failed before the whole snapshot could be accepted. Assertions are reported only where execution proved them; later assertions are not inferred from UI milestones.

| Invariant | Expected | Actual | Result |
| --- | --- | --- | --- |
| Member A borrow | `COMPLETED / RETURNED` | Assertion passed before failure | PASS |
| Member B reservation | `NOTIFIED` | Assertion passed before failure | PASS |
| Member A fine | `UNPAID`, `OverdueDays=3`, amount `15000` | Three-day fine assertion failed; retained history is `OverdueDays=2`, amount `10000`, return date one business day early | FAIL |
| Copy, notification count, audit count | Exact post-flow invariants | Assertions occur after the failed fine check and were not executed | NOT RUN |

Cleanup verification for the exact manifest returned:

| Invariant | Actual |
| --- | --- |
| Retained synthetic users | `4` |
| Active synthetic users/tokens/members | `0 / 0 / 0` |
| Open loans/reservations | `0 / 0` |
| Active run-specific books/copies | `0 / 0` |
| Retained run-specific copies | `1` inactive historical row |

### Cleanup and token revocation evidence

| Target | Cleanup | Verification | Result |
| --- | --- | --- | --- |
| Exact run manifest | transaction-scoped terminalization/inactivation | `cleanup_verified` returned `CLEANED` | CLEANED |
| Four synthetic accounts | set inactive | four login attempts returned `401` | CLEANED |
| Retained old access token | token revocation | `/api/auth/me` returned `401` | CLEANED |
| Remote runtime/helper | fixed-target cleanup and self-removal | Kudu VFS HEAD `404/404` | CLEANED |
| Local run state | in-memory clearing and manifest removal | run artifact count `0` | CLEANED |
| App/API after cleanup | read-only state and public requests | App `Running`, SQL `Online`, `/health=200`, `/api/books=200` | PASS |

### FE07 product-remediation H1 local evidence

- The approved v0.9.1 remediation keeps the FE07 SPEC, API, schema, repository SQL, FE08 handoff, and FE09 calculation behavior unchanged. The Core fix is limited to passing the already-derived `returnBusinessDate` into the existing parameterized `sql.Date` repository input.
- Baseline FE07 route/repository verification passed `85/85`. RED then failed exactly at the persistence boundary: expected `2026-07-23`, received raw `2026-07-22T17:30:00.000Z`; the old `fineCandidate` assertion still passed and therefore reproduced the prior test gap.
- After the one-argument fix, the focused regression passed under `TZ=UTC` and `America/New_York`; FE07/FE09/repository passed `114/114`, system integration passed `11/11`, and full backend/coverage passed `1,175/1,175` across `74` suites.
- A read-only installed-driver smoke confirmed that Tedious `sql.Date` with `useUTC=true` maps canonical `2026-07-23` to that same SQL calendar date, while the former raw clock value maps to `2026-07-22`.
- Coverage passed at statements `91.98%`, branches `81.28%`, functions `97.08%`, and lines `91.94%`. Traceability enforcement passed with FE07 `44/44` (`100%`), tracked-secret tests passed `5/5`, and diff hygiene passed.
- Disposable SQL was not run because the named non-staging DB configuration and mutation flag were absent. H2 later approved the exact FE07 remediation/evidence diff for commit, push, and Draft PR, but the product change remains undeployed and no new live staging attempt was executed. FE07-T061, L4, H3, and merge remain open.

### Task closeout decision table

| Task | Decision | Reason |
| --- | --- | --- |
| FE04-ADM04 | Keep current status until H2 | Fresh focused clean-exit and responsive live evidence exist; complete closeout still awaits a passing scenario/H2 |
| FE04-CONV-001 | Keep open until H2 | Fresh Windows Playwright process exited cleanly; persistent closeout still awaits review |
| FE04-ADM05 | Keep open | Requires a successful complete Azure scenario, cleanup, desktop/mobile acceptance, and H2 |
| FE04-CONV-002 | Keep open | No external owner/final release approval |
| FE11-UXR07 | Keep open | Live scenario failed its final business invariant |
| FE11-UXR08 | Keep open | Navigation/responsive and audit-loading subsets passed, but the complete audit density/filter contract remains unproven |
| FE11-UXR09 | Keep open | FE04 integration passed to the reached boundary, but FE04-ADM05 is not eligible |
| FE11-PDO04 | Keep open | Live retired-route no-mutation check passed, but scenario closeout and H2 remain unavailable |

### Residual risks and owners

- **FE07 default return-date persistence — borrowing backend owner:** add a UTC/Vietnam-boundary regression that asserts the persisted SQL date, then pass the canonical `returnBusinessDate` to repository persistence without changing explicit-return-date behavior, audit evidence, or fine-candidate semantics. This product remediation requires a newly reviewed H1.
- **FE09 downstream calculation — fine owner:** keep calculation anchored to the persisted return date; do not mask the FE07 defect by changing FE09 to ignore committed borrowing history.
- **Authenticated Azure acceptance incomplete — project team:** report the passed role/authorization/report boundaries separately, but do not represent this as full circulation acceptance until a clean final invariant snapshot passes.
- **Gate separation — project lead:** FE07 remediation H2 authorizes only its scoped commit, push, and Draft PR. Combined release closeout H2, FE07 task closure, H3, and merge are not granted.
