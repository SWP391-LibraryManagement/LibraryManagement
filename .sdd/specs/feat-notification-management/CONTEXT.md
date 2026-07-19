# CONTEXT.md - FE10 Notification Management

# Version: 0.2.0

# Status: APPROVED - BASELINE 2026-07-17

# Owner: Nhat

# Last Updated: 2026-07-15

# Feature folder: `.sdd/specs/feat-notification-management/`

---

## 1. Feature Purpose

Notification Management exists to deliver system messages to users at the right time and through approved channels.

This feature must keep four things consistent:

- Notification requests created by other features.
- Notification content rendered from approved templates.
- Delivery status for email and in-app notifications.
- Safe delivery records for failed or skipped delivery attempts.
- Construction-bound ownership for FE02 OTP, FE04 membership-result, and FE11 account-setup delivery.

FE10 is a Standard Spec feature because it supports many workflows, but it should not own the business decision of when an account, reservation, loan, or fine changes state.

---

## 2. Real-World Workflow

The typical library notification workflow:

1. A source feature detects that a notification should be sent.
2. The source feature sends FE10 a notification request with recipient, type, channel, template key, and template data.
3. FE10 validates the request and checks recipient/channel availability.
4. FE10 renders the message from an approved template.
5. FE10 creates a notification record with status `PENDING`.
6. FE10 sends the email or creates an in-app notification.
7. FE10 updates status to `SENT`, `DELIVERED`, `FAILED`, or `SKIPPED` depending on the channel and result.
8. If sending fails, FE10 records a safe failure reason.

---

## 3. Feature Boundary

FE10 includes:

- Receiving notification requests from approved construction-bound internal features.
- Sending account verification, password reset, reservation, due date, overdue, and fine notifications.
- Creating in-app notifications.
- Sending email notifications through a configured provider adapter or injected mock provider.
- Using approved notification templates and required template variables.
- Tracking notification status and failed delivery reasons.

FE10 does not include:

- Creating authentication tokens. That belongs to FE02 Authentication.
- Validating password reset tokens. That belongs to FE02 Authentication.
- Deciding reservation queue eligibility. That belongs to FE08 Reservation Management.
- Calculating overdue fines. That belongs to FE09 Fine Management.
- Approving borrow/return workflows. That belongs to FE07 Borrowing Management.
- SMS, push notification, or marketing campaign delivery.
- Online payment notifications.
- User notification inbox/list UI.
- Marking in-app notifications as read.
- Admin/librarian notification log screens.
- Manual retry management screens.
- Template editor UI.
- Real external email-provider credentials in source code.

---

## 4. Current Data Model Notes

The approved SQL design is implemented in `database/Librarymanagement.sql` for:

- `NotificationTemplates` with canonical template code, subject, body, status, and timestamps.
- `Notifications` with type/template, recipient, delivery status, safe source metadata, all-status idempotency key, redacted payload, attempt count, and safe failure summary.
- `NotificationAttempts` with attempt timestamp/status, safe error message, and provider message ID.
- `UserNotificationPreferences` remains future work because notification preferences and in-app state are outside the current FE10 slice.

Potential issues to review:

- Email addresses live in `Users.Email`; FE10 must not duplicate user account data unnecessarily.
- Email provider secrets must come from environment/configuration, not committed files.
- FE02 owns OTP/token generation and validation; FE10 receives raw OTP template data only through the requester bound to `FE02`, uses it only in provider memory, and persists no OTP or rendered sensitive content.
- Staff HTTP callers cannot submit sensitive auth notifications; only FE02 may submit verification/reset, only FE04 may submit membership result, and only FE11 may submit account setup through their bound requesters.
- FE10 should be idempotent enough to avoid duplicate messages for the same source event.
- Failed sends should not roll back already-completed business transactions in FE02/FE07/FE08/FE09.
- In-app notification read/unread state is out of the current assignment scope unless the team adds it later.

The approved SPEC and FE10-H01 through FE10-H09 resolved the implementation blockers above; future-scope items remain explicitly deferred.

---

## 5. Main Use Cases From Assignment Sheet

| Use Case ID | Use Case Name | Owner |
| ----------- | ------------- | ----- |
| UC45 | Send Account Verification Notification | Nhat |
| UC46 | Send Password Reset Notification | Nhat |
| UC47 | Send Book Reservation Notification | Nhat |
| UC48 | Send Due Date Or Fine Notification | Nhat |

---

## 6. Feature Tests From Assignment Sheet

| Test ID | Test Name | Owner |
| ------- | --------- | ----- |
| FT46 | Account verification notification sent | Nhat |
| FT47 | Password reset notification sent | Nhat |
| FT48 | Book reservation notification sent | Nhat |
| FT49 | Due date or fine notification sent | Nhat |

---

## 7. Key Risks

- Duplicate notifications confuse members and create support work.
- Failed email delivery may hide important account, reservation, due date, or fine events.
- Notification content may expose sensitive tokens or internal error details if templates are not controlled.
- Missing delivery records makes delivery issues hard to troubleshoot.
- FE10 may accidentally take over business decisions that belong to FE02, FE07, FE08, or FE09.
- Email provider credentials may be leaked if hardcoded.

---

## 8. Dependencies

| Dependency | Why It Matters |
| ---------- | -------------- |
| FE02 Authentication | Creates verification/reset OTP tokens and requests their delivery through the requester bound to `FE02`. |
| FE04 Membership Management | Requests `MEMBERSHIP_RESULT` after approval/rejection through the requester bound to `FE04`. |
| FE07 Borrowing Management | May request due date reminders and borrow/return status notifications. |
| FE08 Reservation Management | Requests book available and reservation status notifications. |
| FE09 Fine Management | Requests overdue and fine notifications. |
| SQL Server database | Stores notification templates, records, and attempts. |
| Configured email provider adapter or injected mock provider | Delivers email notifications in deployed and test environments. |

---

## 9. Resolved Questions For Team / Teacher

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE10-001 | Phase 1 required channel is email through a configured provider adapter; tests use an injected mock provider. | Review packet 2026-06-10; ADR-004 approval 2026-07-15 | APPROVED |
| Q-FE10-002 | In-app notification is optional/future work in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-003 | Required canonical templates cover verification, password reset, account setup, reservation ready, due reminder, overdue notice, fine notice, and membership result. | Review packet 2026-06-10; normalization through 2026-07-17 | APPROVED |
| Q-FE10-004 | Store notification send attempts and status. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-005 | Retry failed sends manually only in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-006 | Notification failure must not block source business flow. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-008 | FE11-owned `ACCOUNT_SETUP` is delivered only through the FE11-bound requester and persists no raw setup token/link. | ADR-005; Nhat approval 2026-07-15 | APPROVED |
| Q-FE10-007 | System/Scheduler may trigger notifications internally; not a login role. | Review packet 2026-06-10 | APPROVED |

---

## 10. Current Hardening Status

- `SPEC.md` version 0.4.1 incorporates ADR-004 OTP ownership, ADR-005 account setup, and the FE04 membership-result source boundary.
- FE10-H01 through FE10-H09 remain completed historical work; the new FE10-S01 through FE10-S05 follow-up is specification-ready and awaits implementation review.
- Use environment variables or deployment configuration for email provider credentials.
- Do not log raw tokens, full reset links, or provider secrets.
- Keep FE10 APIs role-protected and server-side validated.
- Keep verification/reset internal to `FE02`, membership result internal to `FE04`, and account setup internal to `FE11`; HTTP and non-owning sources receive safe `403`.
- Use idempotency keys or source event identifiers to prevent duplicate notification records.
- Keep message rendering centralized so templates are testable.
