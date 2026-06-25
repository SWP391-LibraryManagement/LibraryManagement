# FE10 Test Plan - Notification Management

Version: 0.1.0
Status: DRAFT - pending team review
Last Updated: 2026-06-22

Source Spec: `.sdd/specs/feat-notification-management/SPEC.md`
Feature IDs: `BR-FE10-*`, `FR-FE10-*`, `AC-FE10-*`

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

- `backend/tests/notificationRoutes.test.js`
- `backend/tests/integration.test.js`

## 6. Gaps

- If frontend notification inbox exists, add manual UI evidence and/or future E2E test for inbox states.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
node scripts/check-traceability.js
```
