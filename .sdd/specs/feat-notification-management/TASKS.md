# TASKS.md - FE10 Notification Management

Status: READY FOR REVIEW

Owner: Nhat

Updated: 2026-06-10

---

## 1. Backend Tasks

- [x] FE10-T01 Add notification request and process-pending routes.
- [x] FE10-T02 Add server-side validators for type, channel, recipient, template key, source reference, idempotency, and process limit.
- [x] FE10-T03 Add notification service request validation.
- [x] FE10-T04 Add template lookup and variable rendering.
- [x] FE10-T05 Add sensitive token/link/password payload redaction.
- [x] FE10-T06 Add idempotency handling for duplicate active notifications.
- [x] FE10-T07 Add mock-provider pending processing.
- [x] FE10-T08 Record successful and failed delivery attempts.
- [x] FE10-T09 Protect notification APIs from public/member callers.
- [x] FE10-T10 Align SQL script with FE10 fields, statuses, idempotency index, and required templates.

## 2. Test Tasks

- [x] FE10-T11 Add in-memory notification repository helper.
- [x] FE10-T12 Test account verification request creation.
- [x] FE10-T13 Test duplicate idempotency key handling.
- [x] FE10-T14 Test missing template variable failure.
- [x] FE10-T15 Test password reset payload redaction.
- [x] FE10-T16 Test process-pending success and safe failure attempt logging.
- [x] FE10-T17 Test protected API access.

## 3. Validation

- [x] `npm test` in `backend`.

## 4. Traceability

| Spec ID | Covered by |
| --- | --- |
| AC-FE10-001 | FE10-T03, FE10-T04, FE10-T12 |
| AC-FE10-002 | FE10-T03, FE10-T05, FE10-T15 |
| AC-FE10-003 | FE10-T03, FE10-T04, FE10-T14 |
| AC-FE10-004 | FE10-T03, FE10-T07, FE10-T16 |
| AC-FE10-005 | FE10-T03, FE10-T07, FE10-T16 |
| AC-FE10-006 | FE10-T02, FE10-T04, FE10-T14 |
| AC-FE10-007 | FE10-T05, FE10-T15 |
| AC-FE10-008 | FE10-T06, FE10-T13 |
| AC-FE10-009 | FE10-T07, FE10-T08, FE10-T16 |

## 5. Still Outside This Slice

- Real SMTP/provider integration.
- In-app notification screens.
- Retry management UI.
