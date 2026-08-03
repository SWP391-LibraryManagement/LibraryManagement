# Full Project Closeout PR C - FE04/FE02 Validation

Date: 2026-08-03

Status: IN PROGRESS - H2 ROUND 2 PASS; EXACT-HEAD CI AND FINAL H3 REQUIRED

## Scope

This record tracks PR C evidence for FE04 staging acceptance and FE02 closeout reconciliation. FE04 and FE02 are complete at feature scope after H3 round 1; H2 round 2, exact-head CI and final H3 remain separate PR integration gates.

## Exact baseline

- Baseline SHA: `850b01b55e4e9091751402a7ef8678906159f173`.
- Main CI: run [`30779430709`](https://github.com/SWP391-LibraryManagement/LibraryManagement/actions/runs/30779430709), success on the exact SHA.
- Staging deployment: run [`30779592574`](https://github.com/SWP391-LibraryManagement/LibraryManagement/actions/runs/30779592574), success on the exact SHA.
- Frontend: `https://www.thuvienhub.io.vn`.
- Backend: `https://app-library-api-staging-nhat714.azurewebsites.net`.
- Azure target: `rg-library-staging/app-library-api-staging-nhat714`, database `LibraryManagementStaging` on `sql-library-staging-ea-nhat714.database.windows.net`.

## Read-only preflight

- `npm.cmd run smoke:staging`: PASS after setting the approved frontend/API environment URLs.
- Frontend `/login`: HTTP 200.
- Backend `/health`: HTTP 200 with `status=ok`.
- App Service: Running, `NODE_ENV=production`, expected host and SQL target.
- Kudu base Node is `18.17.1`; the former Oryx Node 22 path is absent.
- The amended harness pins official Linux Node `22.22.2`, verifies SHA256 `88fd1ce767091fd8d4a99fdb2356e98c819f93f3b1f8663853a2dee9b438068a`, and uses the deployed `migration-runtime/node_modules/mssql` only inside the temporary runtime.
- Harness contract before the architecture amendment: 11/11 PASS; both temporary JavaScript files pass `node --check`.

## Staging attempt 1

- Run ID: `lms-fe04-acceptance-20260803-8b923a37`.
- Synthetic users: Member `134`, Librarian `135`, Admin `136`; no real PII was used.
- Server authorization/list assertions executed before the business transition without failure: anonymous `401`, Member `403`, Librarian/Admin list `200`.
- Application `32` was submitted and then rejected by Admin `136`.
- Observed application audit actions: `MEMBERSHIP_APPLICATION_SUBMITTED`, `MEMBERSHIP_APPLICATION_REJECTED`.
- The product transition committed successfully. The harness then timed out because it waited for the non-canonical exact toast text `Đã từ chối đơn hội viên.` while the UI contract renders `Đã từ chối đơn đăng ký hội viên.` or its notification-warning variant.
- Resubmission, approval, terminal replay and four-viewport acceptance were not executed in this attempt.

## Cleanup evidence

The automatic cleanup initially could not recover the manifest because fixture lookup used the full run ID while synthetic usernames/emails persisted only the eight-character suffix. The cleanup fixture was corrected under RED-GREEN contract coverage and used only to remediate the same run.

- Retained synthetic users: 3.
- Active users: 0.
- Active refresh/setup tokens: 0.
- Active/PENDING members: 0.
- PENDING membership applications: 0.
- Temporary runtime VFS status: 404.
- Temporary cleanup helper VFS status: 404.
- Cleanup result: CLEANED.

The original raw passwords and retained access token were intentionally cleared when attempt 1 stopped, so post-cleanup password-login/token-replay checks cannot be reconstructed for this run. The zero active user/token counts are the authoritative cleanup evidence for attempt 1.

## Harness remediation

- Manifest recovery now resolves the exact suffix and still requires exactly one MEMBER, LIBRARIAN and ADMIN ID.
- Decision feedback now matches the canonical `Đã từ chối đơn...` and `Đã duyệt đơn...` prefixes, including FE10 warning variants.
- Membership navigation is not re-clicked while already active, preventing a hidden mobile sidebar control from blocking responsive verification.
- Current contract result after the first remediation: 10/10 PASS.

## Staging attempt 2

- Run ID: `lms-fe04-acceptance-20260803-fef1cff6`.
- Synthetic users: Member `137`, Librarian `138`, Admin `139`.
- Application `33` was submitted and rejected with the intended synthetic reason.
- Application `34` was created by Member resubmission and remained PENDING until mandatory cleanup terminalized it.
- Audit evidence contains two `MEMBERSHIP_APPLICATION_SUBMITTED` actions and one `MEMBERSHIP_APPLICATION_REJECTED` action. No approval action was recorded.
- Notification `104` for application `33` remained `PENDING`; notification delivery did not roll back the committed rejection.
- The canonical fixture snapshot proved application `34` existed, but the already-mounted Admin membership directory kept its empty post-rejection state and did not render the new row. The harness timed out before responsive review and approval.
- Cleanup completed in the same run: users/member became INACTIVE, active token count was 0, no pending application remained, and the temporary runtime was removed.

## Harness remediation after attempt 2

- The harness now polls the canonical Admin membership API until the resubmitted PENDING application is visible server-side.
- It reloads the Admin shell after server truth is confirmed, matching the existing local E2E pattern that starts a fresh Admin view after resubmission.
- Current contract result: 11/11 PASS; both temporary scripts parse cleanly.

## Staging attempt 3

- Run ID: `lms-fe04-acceptance-20260803-418d15cc`.
- The run reached Member resubmission and canonical Admin API polling without an authorization or business-transition assertion failure.
- After canonical readiness, the harness reloaded the existing Admin page with `waitUntil: 'domcontentloaded'` and immediately called `verifyAdminNavigation()`.
- The navigation locator count was still `0` while the expected count was `8`, producing `Expected values to be strictly equal: 0 !== 8`.
- Source evidence: `orchestrate.js` counted `.app-nav-item` immediately in `verifyAdminNavigation()` and invoked it immediately after reload; React had not rendered the sidebar yet.
- This is a harness synchronization/context-reuse failure, not evidence that FE04 product navigation, resubmission or approval behavior is incorrect.
- Responsive review, approval, terminal replay and post-cleanup credential replay were not completed in this attempt.

## Cleanup and post-failure preflight for attempt 3

- Mandatory cleanup completed successfully.
- Active synthetic users, tokens, active/PENDING members and PENDING membership applications were all verified at `0`.
- Temporary Node runtime and cleanup helper were removed; read-only VFS verification found no remote residue.
- A fresh read-only preflight passed after cleanup.

## Approved architecture amendment

The three-attempt deterministic stop condition was reached. The user approved the recommended architecture change in chat on 2026-08-03, subject to written design review before implementation:

1. Use a fresh Admin browser context for rejection and a different fresh Admin browser context for approval.
2. Wait for the Admin navigation landmark to become visible and for the eighth navigation item to become visible before asserting exact count/order.
3. Use canonical API polling only to establish that application B is ready; keep both reject and approve as real UI actions.
4. Do not reload or reuse the first Admin directory state after Member resubmission.
5. Add a RED contract assertion for context isolation/readiness waiting before changing the ignored harness.
6. After written review, authorize exactly one new run ID. Any failure must cleanup and stop; no automatic fifth attempt is allowed.

The written amendment was committed as `2272ed654e10ba0536ea803380e04c551011eb7f` and approved by the user before implementation.

## Pre-mutation runtime setup interruption

- Setup run ID: `lms-fe04-acceptance-20260803-dbf6e600`.
- Kudu reported a non-zero exit during Node archive extraction even though the pinned archive passed checksum verification and the extracted `node` binary subsequently returned `v22.22.2`.
- The mutation marker was absent and `runAcceptance()`/seed had not started; no synthetic database state was created.
- The exact temporary runtime/helper residue was removed and verified at `404/404`.
- A RED-GREEN contract added false-negative recovery only when the exact Node 22 binary is executable, plus automatic cleanup for failures before the mutation marker.

## Successful amended staging acceptance

- Run ID: `lms-fe04-acceptance-20260803-90ac1d5b`.
- Deployed application SHA: `850b01b55e4e9091751402a7ef8678906159f173`.
- Synthetic actors: exactly one Member, Librarian and Admin using `.invalid` identities and distinct runtime-only passwords; no real PII was used or retained.
- Final harness contract: 14/14 PASS; `orchestrate.js` and `fixture.js` both pass `node --check`.
- Server authorization matrix passed before the business flow: anonymous list/review `401`, Member list/review `403`, Librarian/Admin canonical list `200`; Member status response passed privacy assertions.
- UI flow passed with separate Admin contexts: application A was submitted and rejected, the Member observed the rejection reason and resubmitted application B, and application B was approved.
- Final state assertions passed: A remained `REJECTED`, B became `APPROVED`, canonical Member state became `APPROVED`, audit counts were submit x2/reject x1/approve x1, and terminal replay returned `409` without extra audit/notification effects.
- Responsive review passed at `1440x900`, `1366x768`, `1280x720` and `390x844`; the Admin navigation contained exactly eight approved entries in order and document overflow remained false.
- Browser console/page error collection was empty.

## Successful cleanup and post-cleanup verification

- Cleanup event: `cleanup_verified`, count `0`.
- Active refresh/setup tokens: 0.
- Active synthetic users: 0.
- Active/PENDING synthetic members: 0.
- PENDING synthetic membership applications: 0.
- All three old passwords were rejected with `401`; the retained pre-cleanup bearer token was rejected by `/api/auth/me` with `401`.
- Temporary runtime VFS status: 404.
- Temporary cleanup helper VFS status: 404.
- A fresh read-only preflight passed after cleanup on the same exact staging SHA.
- No raw password, bearer token, connection string, publishing credential, real account or screenshot artifact was persisted in the durable diff.

## Local and cross-feature evidence

- Existing closeout baseline: backend FE04 + system integration 31/31 PASS; frontend FE04/Admin 36/36 PASS; Playwright FE04 + FE11 2/2 PASS with clean exit in 31.5 seconds.
- Current focused owner run: `borrowingRoutes`, `reservationService`, `membershipRoutes`, `reportContract`, `reportInMemoryParity` and `systemIntegration` all passed: 6 suites, 162/162 tests.
- FE07 contract: canonical FE04 `APPROVED` selects the five-copy daily tier; other FE04 states select the three-copy tier and do not independently block an active `MEMBER` account.
- FE08 contract: FE04 status does not block reservation; role `MEMBER` plus active FE02 account status owns eligibility.
- FE10 contract: membership notification requester failure is non-blocking after the FE04 decision commits.
- FE12 contract: membership status is read for reporting/filtering; FE12 does not own FE04 transitions.

## FE02-T049 reconciliation candidate (historical checkpoint)

- Implementation commit: [`241907d09760055022393bdc9176da85bbeff3f4`](https://github.com/SWP391-LibraryManagement/LibraryManagement/commit/241907d09760055022393bdc9176da85bbeff3f4), `fix: harden login validation feedback`.
- Historical PR: [#60](https://github.com/SWP391-LibraryManagement/LibraryManagement/pull/60), head `50e9091362777d3892d5d4e048a21118326b2dd9`, merge commit `c052b5051deb1e29b66cde2668bca612cc27dc35`.
- Exact-head CI: [`29875668029`](https://github.com/SWP391-LibraryManagement/LibraryManagement/actions/runs/29875668029), success on PR head.
- Post-merge CI: [`29875885463`](https://github.com/SWP391-LibraryManagement/LibraryManagement/actions/runs/29875885463), success on merge commit.
- Post-merge staging: [`29876046500`](https://github.com/SWP391-LibraryManagement/LibraryManagement/actions/runs/29876046500), success on merge commit.
- GitHub currently returns an empty `reviews` array for PR #60. No historical H3 record is claimed.
- Source-to-requirement review remains consistent: backend login validation accepts identifiers through 255 characters and rejects invalid boundaries; frontend field validation handles blank/overlength values, prevents duplicate pending submissions and maps stable safe error codes without account enumeration or raw backend messages.
- Current focused evidence: backend auth/HTTPS 3 suites, 68/68 PASS; frontend auth UX/login 17/17 PASS.
- At this checkpoint, the proposed resolution was a current retrospective Standards + Spec review in H3 round 1. That resolution was later accepted at PR #107 comment `5162255705`; no historical H3 is claimed.

## L1 full-gate evidence before H2 round 1

- `trace:enforce`: PASS; FE02 27/27, FE04 14/14 and FE11 43/43, with all three correctly remaining `PARTIAL` at this checkpoint.
- Secret scanner: 5/5 contract tests PASS and tracked-tree scan PASS.
- Root/backend audit: 0 vulnerabilities; frontend high-audit guard accepted only the pinned React Router RSC advisory for unused unstable APIs.
- Backend full: 75/75 suites, 1202/1202 tests PASS.
- Backend system integration: 11/11 PASS.
- Backend coverage: statements 91.98%, branches 81.28%, functions 97.08%, lines 91.94%; configured thresholds PASS.
- Frontend: 281/281 tests PASS; ESLint PASS; Vite production build PASS.
- Playwright Chromium: 16/16 PASS with clean process exit, including FE04 Admin membership review and connected FE07/FE08/FE10/FE12 flow.
- Deployment contracts: 20/20 PASS.
- `git diff --check`: PASS; ignored staging harness is not tracked.

## H2 round 1

- Decision: APPROVED by Nhat in Codex chat on 2026-08-03.
- Reviewed diff fingerprint: `8cef30463f1e4cd2f4ee80862cca282c297f902a`.
- Reviewed scope: 12 durable FE04/FE02/PR C documentation files; no product code, test source, workflow, dependency or lockfile changes; temporary staging harness remains ignored/untracked.
- H2 authorizes the mechanical status updates recording H2, the reviewed documentation commit, branch push, Draft PR publication and ready-for-review transition after exact-head checks pass.
- H2 does not approve FE04 manual acceptance, FE02 retrospective H3 resolution, merge or final completion.

## H3 round 1

- Decision permalink: [PR #107 comment `5162255705`](https://github.com/SWP391-LibraryManagement/LibraryManagement/pull/107#issuecomment-5162255705).
- Reviewed exact head: `5130850b14fd96aa5d90bd30a662ec2f22390a2a`; exact-head CI `30783858342` passed `foundation-checks` before the decision.
- Decision 1: FE02-T043 commit/PR/CI/deploy history is accepted as accurate.
- Decision 2: Current FE02-T043 implementation is accepted as conforming to Standards and FE02 Spec.
- Decision 3: The current retrospective H3 may resolve `CG-FE02-003`; no historical H3 is claimed.
- Decision 4: FE04 staging, L1, cleanup, responsive and manual/owner evidence is sufficient to mark FE04 complete.
- Result: FE02-T049 and CG-FE02-003 are closed; FE02 and FE04 move to `COMPLETE` in this minimal documentation amendment.
- Boundary: the amended head requires L1 rerun, H2 round 2, exact-head CI and final H3 before merge.

## L1 amendment rerun before H2 round 2

- `trace:enforce`: PASS; FE02 27/27 and FE04 14/14 are `COMPLETE` at 100% coverage; no feature is below its required threshold.
- Secret scanner: 5/5 contract tests PASS and tracked-tree scan PASS.
- Frontend high-audit guard: PASS with only the pinned, non-applicable React Router RSC advisory accepted.
- Backend full: 75/75 suites and 1202/1202 tests PASS.
- Frontend full: 281/281 tests PASS; ESLint PASS; Vite production build PASS.
- Playwright Chromium: 16/16 PASS with clean process exit.
- Deployment contracts: 20/20 PASS.
- `git diff --check`: PASS; the staging harness remains ignored and untracked.

## H2 round 2

- Decision: APPROVED by Nhat in Codex chat on 2026-08-03.
- Reviewed diff fingerprint: `fab52b79aa47c724fb44c3f5b687e5822cb62bad`.
- Reviewed scope: exactly 12 durable FE04/FE02/PR C documentation files; no product code, test source, workflow, dependency, lockfile or tracked harness changes.
- H2 authorizes only this mechanical decision record, the reviewed documentation commit and branch push.
- H2 does not authorize merge; exact-head CI and final H3 remain mandatory.

## Open gates

- FE04 and FE02 feature scopes are complete according to H3 round 1.
- H2 round 2 approved the final amendment fingerprint and its mechanical decision record.
- Exact-head CI and final H3 are required before merge.
