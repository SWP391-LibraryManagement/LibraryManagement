# FE10 Test Plan - Notification Management

Version: 0.2.0
Status: READY FOR REVIEW
Last Updated: 2026-06-25

Source Spec: `.sdd/specs/feat-notification-management/SPEC.md`
Feature IDs: `BR-FE10-*`, `FR-FE10-*`, `AC-FE10-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Notification requests, template validation, safe payload behavior, pending processing, and notification inbox/user visibility.

## 2. Unit Test Targets

- Notification request validation.
- Template variable validation.
- Safe payload/redaction rules.
- Recipient ownership and role visibility.
- Retry/status transition rules for pending/processed/failed notifications.

## 3. API / Integration Test Targets

- `POST /notifications/requests`: happy path, invalid template, missing recipient, forbidden.
- `POST /notifications/process-pending`: happy path, no pending, failed send handling, unauthorized.
- Inbox/list/read endpoints if exposed by backend: own-notification-only access, mark-read behavior, empty inbox.

## 4. E2E / Manual Acceptance Flow

- User sees notification inbox UI.
- Reservation/borrow/fine event creates visible notification.
- Sensitive tokens or internal payloads are not shown.
- Empty/loading/error states are visible.

## 5. Current Evidence

- `backend/tests/notificationRoutes.test.js` (10 tests: create/idempotency, template-data missing,
  unsupported type/channel, unknown template, recipient required/not-found, userId resolve + audit,
  payload sanitize/redaction, process-pending success/failure/empty, RBAC 401/403).
- `backend/tests/integration.test.js`
- Traceability: FR `@spec` coverage **100%** (`npm run trace:enforce`).

## 6. Gaps

- If a frontend notification inbox exists, add manual UI evidence and/or a future E2E test for inbox states.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
