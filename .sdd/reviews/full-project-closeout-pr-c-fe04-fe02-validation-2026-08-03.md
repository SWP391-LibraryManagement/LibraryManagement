# Full Project Closeout PR C - FE04/FE02 Validation

Date: 2026-08-03

Status: IN PROGRESS - ARCHITECTURE AMENDMENT WRITTEN REVIEW REQUIRED

## Scope

This record tracks PR C evidence for FE04 staging acceptance and FE02 closeout reconciliation. It does not mark FE04 or FE02 complete while required acceptance and H2/H3 gates remain open.

## Exact baseline

- Baseline SHA: `850b01b55e4e9091751402a7ef8678906159f173`.
- Main CI: run `30779430709`, success on the exact SHA.
- Staging deployment: run `30779592574`, success on the exact SHA.
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

## Open gates

- Commit and review `docs/superpowers/specs/2026-08-03-pr-c-fe04-acceptance-context-isolation-amendment-design.md` before changing the harness or running another mutation.
- After written review, the amendment permits exactly one additional staging mutation with a fresh run ID; it does not erase or relabel the three failed attempts.
- FE04 remains PARTIAL until reject -> resubmit -> approve, responsive evidence, post-cleanup login/token rejection and H2/manual acceptance pass on one complete run.
- FE02-T049 and CG-FE02-003 remain open; no FE02 completion state changed across these attempts.
