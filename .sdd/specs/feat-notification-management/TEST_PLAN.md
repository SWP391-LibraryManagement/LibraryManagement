# FE10 Test Plan - Notification Management

Version: 0.5.0
Status: V0.5.0 IMPLEMENTED - POST-DRIFT H2/H3 IN PROGRESS
Last Updated: 2026-07-28

Source Spec: `.sdd/specs/feat-notification-management/SPEC.md`
Feature IDs: `BR-FE10-*`, `FR-FE10-*`, `AC-FE10-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Notification requests, source/type ownership, sensitive in-memory delivery,
template validation, safe persistence, idempotency, queued processing, retry,
and the approved personal notification inbox/read-state behavior.

## 2. Unit Test Targets

- Notification request validation.
- Template variable validation.
- Safe payload/redaction rules.
- Recipient ownership and role visibility.
- Retry/status transition rules for pending/processed/failed notifications.
- FE02-only verification/reset and FE11-only account-setup ownership.
- No OTP/setup-link/rendered-sensitive-content persistence, logs, audits, or responses.

## 3. API / Integration Test Targets

- `POST /notifications/requests`: happy path, invalid template, missing recipient, forbidden.
- In-process FE02 requester: verification/reset OTP success/failure, variables, idempotency, and no duplicate delivery.
- In-process FE11 requester: account-setup success/failure, variables, source ownership, and new-token resend semantics.
- `POST /notifications/process-pending`: happy path, no pending, failed send handling, unauthorized.
- `GET /notifications/mine`: authentication, three allowed roles, SQL-side
  filters/pagination/order, safe projection, own-record boundary, and empty page.
- `GET /notifications/mine/unread-count`: own eligible unread rows only.
- `PATCH /notifications/{id}/read`: idempotence plus indistinguishable `404`
  for missing, sensitive, and other-user rows.
- `PATCH /notifications/mine/read-all`: one server timestamp, own eligible rows
  only, and replay count zero.
- FE04/FE07/FE08 fan-in proves one persisted email record is also the inbox row.

## 4. E2E / Manual Acceptance Flow

- Registration/reset/account-setup messages reach the configured test mailbox/provider mock.
- Sensitive credentials and rendered sensitive content never appear in API/audit/admin surfaces.
- Provider failure leaves source flow completed with safe status.
- MEMBER, LIBRARIAN, and ADMIN each see the shared bell and only their own inbox.
- Badge cap, five-unread preview, filters, 20-item pagination, mark-all, and
  backend-derived navigation behave as specified.
- A failed read mutation leaves the row unread, shows safe feedback, and does
  not block an already allowlisted business route.

## 5. Current Evidence

- `backend/tests/notificationInboxMigration.test.js` covers nullable `ReadAt`,
  first-run-only eligible backfill, exact type/template eligibility, repeatable
  index creation, and the Azure SQL transaction/error contract.
- FE10-I01 focused evidence: 4 migration-contract tests passed; the migration,
  existing repository regression, and OTP migration matrix passed 11/11; Azure
  schema preparation completed without create/switch-database statements.
- The named disposable SQL Server rehearsal first exposed same-batch `ReadAt`
  compilation failure. A RED regression test was added, the update/index were
  moved behind `sys.sp_executesql`, and the strict two-run rehearsal then passed:
  1 nullable column, 1 index, 5 historical eligible rows backfilled, 6 excluded
  rows still unread, the post-first-run row still unread, protected aggregates
  unchanged, and the disposable database removed.
- `backend/tests/notificationInboxRepository.test.js` and the expanded route
  suite cover exact safe projection, action allowlist, SQL ownership/filtering,
  all three login roles, validation, IDOR-safe `404`, idempotent mark-one and
  mark-all, and delivery-state neutrality. Focused evidence passed 154/154.
- Full backend coverage gate after the approved `main@12faead` rebase passed 69/69
  suites and 1116/1116
  tests at 91.84% statements, 80.70% branches, 97.59% functions, and 91.76% lines.
- FE10-I04..I06 frontend evidence passed 259/259 Node tests, ESLint, and the
  Vite production build. It covers the four authorized client methods,
  non-overlapping 60-second/focus count refresh, exact action allowlist,
  accessible five-item preview, guarded page, filters, and server pagination.
- The final H2 boundary audit changed the SQL `@Offset` binding from `INT` to
  `BIGINT`; its repository regression test passed 5/5 and SQL Server accepted
  the maximum-contract offset probe (`214748364600`) without overflow.
- FE10-I07 source-fan-in regression passed 5/5 suites and 285/285 tests across
  FE04, FE07, FE08, FE10, and system integration. The integration assertion
  proves exactly one eligible email row per source outcome, own-user listing,
  indistinguishable cross-user `404`, read replay, and unchanged delivery state.
- `tests/e2e/fe10-notification-inbox.spec.js` passed 3/3 focused Chromium cases for
  MEMBER/LIBRARIAN/ADMIN, `99+`, sensitive/userless/cross-user exclusion,
  mark-one/mark-all replay, non-blocking read failure, and 390x844 no-overflow.
- The complete Chromium suite passed 11/11 after the FE09 synthetic-auth fixture
  was updated to isolate the new background unread-count request. Deployment policy passed 20/20,
  system integration passed 10/10, traceability state passed 3/3, and enforced
  traceability passed with FE10 at 14/16 FR tags (88%, above the 70% gate).
- Exact PR head `28c4f80` passed CI `30306805399` and Azure staging deployment
  `30307855616`. Live Azure verification covered MEMBER/LIBRARIAN/ADMIN
  ownership, sensitive exclusion, mark-one/mark-all replay, filters, safe
  navigation, HTTPS/CORS, migration postconditions, protected aggregates, and
  probe/firewall cleanup.
- H3 round-one UI findings now have focused RED/GREEN coverage for refreshing
  a successfully read no-navigation item, keeping mark-all independent from
  the current filtered page, and elevating the unchanged-size popover above
  every current layout layer only while it is open.
- Fresh security checks after `main@12faead` found zero backend dependency
  vulnerabilities, no added high-confidence secret, conflict marker, stale
  inbox-deferred contradiction, or unsafe response field. The repository
  frontend audit gate accepted only GHSA-qwww-vcr4-c8h2 because the application
  uses declarative `BrowserRouter` and none of the advisory's unstable RSC APIs.
- Final fail-closed review added a RED/GREEN repository regression requiring
  both SQL pending selectors to exclude `ACCOUNT_SETUP` together with the
  other sensitive types. RED failed only for the legacy `listPending` helper;
  focused GREEN passed 3 suites/161 tests and full backend coverage then passed
  69 suites/1114 tests.
- Upstream `main@f3ebe95` then added only three non-overlapping FE07/FE08
  regression-test files; the candidate synchronized them without conflict and
  reran the full frontend suite at 258/258 before fingerprinting.
- The approved `main@a240705` rebase preserves the independent upstream FE11
  edit-action removal. Fresh gates passed backend 69/69 suites and 1084/1084
  tests, frontend 259/259 plus lint/build, deployment 20/20, system 10/10,
  traceability state 3/3, FE10 traceability 14/16 (88%), Chromium 11/11,
  dependency audits, Azure schema preparation, and diff hygiene. The backend
  count decreased only because upstream removed obsolete FE11 edit tests.
- Pre-implementation baseline on `main@25c09ec`: backend 67 suites / 1091 tests
  passed and frontend 234/234 tests passed.

Historical v0.4.x delivery evidence retained below:

- `backend/tests/notificationRoutes.test.js` covers canonical ownership, OTP/account-setup
  provider-memory delivery, safe persistence/audit/response boundaries, idempotency, queueing,
  processing, retry, and validation failures.
- `backend/tests/integration.test.js` includes the FE04/FE07/FE08 personal-inbox fan-in proof.
- `backend/tests/fe10OtpTemplateMigration.test.js`
- Traceability: FR `@spec` coverage **100%** (`npm run trace:enforce`).
- Fresh OTP boundary gate: 4 suites / 170 tests passed.
- Full backend regression gate: 53 suites / 916 tests passed.
- Coverage: 92.68% statements, 81.66% branches, 96.59% functions, 92.61% lines.
- Expanded ownership evidence covers both FE02-sensitive types against every other allowlisted requester, exact HTTP source-override errors, and repeated reset-token event rotation.

## 6. Gaps

- `database/Librarymanagement.sql`, FE11-owned shared widths, and the FE10 OTP migration are synchronized; the migration passed two disposable SQL Server executions.
- FE10-S04 FE02 requester integration and FE10-S09 FE04 membership-result integration are fanned into this worktree.
- Focused FE02/FE10/integration validation passes 170/170. Human acceptance, PR integration, and exact post-merge `main` CI pass for the injected-provider scope; real provider delivery remains out of scope.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```

## 8. V0.5.0 Current Evidence State

- Local migration, focused API/repository/frontend, fan-in, privacy, full
  backend/frontend, deployment, system, traceability, diff/security scans, and
  complete Chromium E2E evidence are complete.
- H2 approved commit `b11b59e`; its PR CI and the exact
  two-run Azure migration passed. Manual deploy `30305596861` failed closed at
  preflight because Windows CRLF and Linux LF produced different raw hashes.
- A RED deployment-policy test reproduced the missing cross-platform boundary.
  GREEN now derives exact LF and CRLF byte hashes from unchanged UTF-8 content,
  accepts the stored operator hash only when it equals one, and rejects a
  content mutation. Deployment policy passes 16/16.
- The staging-hash addendum was H2-approved and published on PR #75 head
  `28c4f80`; exact-head CI `30306805399`, backend-first Azure deployment
  `30307855616`, and three-role live verification passed.
- H3 round one failed on ADR/current-state and bounded UI-state/stacking
  findings. The focused remediation passed its complete matrix. Later PR #75
  head `cf0a236` passed exact-head CI `30315046007`, Azure deployment
  `30315273298`, public transport/protected-route checks, Azure SQL
  schema/index verification, cleanup, and final two-axis H3 with no actionable
  finding. The user then approved documentation-only `main@30f936d`; the
  conflict-free rebase preserves runtime behavior but requires fresh H2,
  exact-head CI/Azure, repeated H3, merge, and post-merge gates.
