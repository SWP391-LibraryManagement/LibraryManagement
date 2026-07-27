# FE10 Test Plan - Notification Management

Version: 0.5.0
Status: V0.5.0 INBOX TEST STRATEGY PLANNED - IMPLEMENTATION NOT_STARTED
Last Updated: 2026-07-27

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

- `backend/tests/notificationRoutes.test.js` covers canonical ownership, OTP/account-setup
  provider-memory delivery, safe persistence/audit/response boundaries, idempotency, queueing,
  processing, retry, and validation failures.
- `backend/tests/integration.test.js`
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

## 8. V0.5.0 Planned Evidence

- Static and executable migration tests, including two disposable SQL Server
  executions and legacy-row backfill/index postconditions.
- Focused repository/service/route tests for ownership, IDOR, sensitive
  exclusion, filter validation, pagination, action allowlist, and read-state
  idempotence.
- Frontend Node tests for API contracts and component/source structure plus
  pure view-model tests for badge, state, and action behavior.
- Playwright E2E covering MEMBER, LIBRARIAN, and ADMIN, a cross-user negative
  API probe, and the non-blocking read-failure path.
- Full backend/frontend/deployment/system/traceability gates and backend-first
  Azure staging smoke/browser verification.
