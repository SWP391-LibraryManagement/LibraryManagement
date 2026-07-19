# FE10 Test Plan - Notification Management

Version: 0.3.2
Status: OTP/FE02/FE04/SCHEMA AUTOMATED AND SQL PASS; HUMAN CLOSEOUT PENDING
Last Updated: 2026-07-19

Source Spec: `.sdd/specs/feat-notification-management/SPEC.md`
Feature IDs: `BR-FE10-*`, `FR-FE10-*`, `AC-FE10-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Notification requests, source/type ownership, sensitive in-memory delivery, template validation, safe persistence, idempotency, queued processing, and retry behavior.

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
- Inbox/list/read endpoints if exposed by backend: own-notification-only access, mark-read behavior, empty inbox.

## 4. E2E / Manual Acceptance Flow

- Registration/reset/account-setup messages reach the configured test mailbox/provider mock.
- Sensitive credentials and rendered sensitive content never appear in API/audit/admin surfaces.
- Provider failure leaves source flow completed with safe status.

## 5. Current Evidence

- `backend/tests/notificationRoutes.test.js` covers canonical ownership, OTP/account-setup
  provider-memory delivery, safe persistence/audit/response boundaries, idempotency, queueing,
  processing, retry, and validation failures.
- `backend/tests/integration.test.js`
- `backend/tests/fe10OtpTemplateMigration.test.js`
- Traceability: FR `@spec` coverage **100%** (`npm run trace:enforce`).
- Fresh OTP boundary gate: 3 suites / 131 tests passed.
- Full backend regression gate: 39 suites / 623 tests passed.
- Coverage: 92.57% statements, 82.72% branches, 97.12% functions, 92.50% lines.

## 6. Gaps

- `database/Librarymanagement.sql`, FE11-owned shared widths, and the FE10 OTP migration are synchronized; the migration passed two disposable SQL Server executions.
- FE10-S04 FE02 requester integration and FE10-S09 FE04 membership-result integration are fanned into this worktree.
- Focused FE02/FE10/integration validation passes 154/154. Real provider acceptance and final human review remain pending.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
