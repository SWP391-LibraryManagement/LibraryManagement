# CONTEXT.md - FE10 Notification Management

# Version: 0.1.0

# Status: DRAFT

# Owner: FE10 Assignee

# Last Updated: 2026-06-09

# Feature folder: `.sdd/specs/feat-notification-management/`

---

## 1. Feature Purpose

Notification Management exists to deliver system messages to users at the right time and through approved channels.

This feature must keep four things consistent:

- Notification requests created by other features.
- Notification content rendered from approved templates.
- Delivery status for email and in-app notifications.
- Retry and audit information for failed delivery attempts.

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
7. FE10 updates status to `SENT`, `DELIVERED`, `READ`, or `FAILED` depending on the channel and result.
8. If sending fails, FE10 records the failure reason and retries according to policy.
9. Users can view and mark in-app notifications as read.
10. Librarians/admins can view notification logs for troubleshooting.

---

## 3. Feature Boundary

FE10 includes:

- Receiving notification requests from approved internal features.
- Sending account verification, password setup, password reset, reservation, due date, overdue, and fine notifications.
- Creating in-app notifications.
- Sending email notifications through a configured provider or mock provider.
- Managing notification templates and required template variables.
- Tracking notification status and failed delivery reasons.
- Retrying failed notifications according to approved retry policy.
- Allowing users to view and mark their own in-app notifications as read.
- Allowing librarians/admins to view notification logs.

FE10 does not include:

- Creating authentication tokens. That belongs to FE02 Authentication.
- Validating password reset/setup tokens. That belongs to FE02 Authentication.
- Deciding reservation queue eligibility. That belongs to FE08 Reservation Management.
- Calculating overdue fines. That belongs to FE09 Fine Management.
- Approving borrow/return workflows. That belongs to FE07 Borrowing Management.
- SMS, push notification, or marketing campaign delivery.
- Online payment notifications.
- Real external email-provider credentials in source code.

---

## 4. Current Data Model Notes

The current SQL script does not yet define notification tables. Before implementation, the team should confirm whether to add:

- `NotificationTemplates(TemplateId, TemplateKey, Channel, SubjectTemplate, BodyTemplate, IsActive, CreatedAt, UpdatedAt)`
- `Notifications(NotificationId, UserId, Type, Channel, Title, Body, Status, SourceFeature, SourceEntityType, SourceEntityId, CreatedAt, SentAt, ReadAt)`
- `NotificationAttempts(AttemptId, NotificationId, AttemptNo, Status, ErrorMessage, AttemptedAt)`
- `UserNotificationPreferences(UserId, EmailEnabled, InAppEnabled, DueReminderEnabled, FineNotificationEnabled)`

Potential issues to review:

- Email addresses live in `Users.Email`; FE10 must not duplicate user account data unnecessarily.
- Email provider secrets must come from environment/configuration, not committed files.
- FE02 owns token generation; FE10 only receives links or safe template data to deliver.
- FE10 should be idempotent enough to avoid duplicate messages for the same source event.
- Failed sends should not roll back already-completed business transactions in FE02/FE07/FE08/FE09.
- In-app notifications require a read/unread state.

These are not blockers for drafting, but they must be resolved before implementation.

---

## 5. Main Use Cases From Assignment Sheet

| Use Case ID | Use Case Name | Owner |
| ----------- | ------------- | ----- |
| UC44 | Send account verification notification | FE10 Assignee |
| UC45 | Send password setup/reset notification | FE10 Assignee |
| UC46 | Send reservation available notification | FE10 Assignee |
| UC47 | Send due date reminder notification | FE10 Assignee |
| UC48 | Send overdue/fine notification | FE10 Assignee |
| UC49 | View user notifications | FE10 Assignee |
| UC50 | Mark notification as read | FE10 Assignee |
| UC51 | View notification delivery log | FE10 Assignee |
| UC52 | Retry failed notification | FE10 Assignee |

---

## 6. Feature Tests From Assignment Sheet

| Test ID | Test Name | Owner |
| ------- | --------- | ----- |
| FT50 | Create notification request with valid data | FE10 Assignee |
| FT51 | Reject notification request with missing recipient | FE10 Assignee |
| FT52 | Send account verification email request | FE10 Assignee |
| FT53 | Send reservation available notification | FE10 Assignee |
| FT54 | Send due date reminder notification | FE10 Assignee |
| FT55 | Send overdue/fine notification | FE10 Assignee |
| FT56 | View own in-app notifications | FE10 Assignee |
| FT57 | Mark notification as read | FE10 Assignee |
| FT58 | Retry failed notification | FE10 Assignee |
| FT59 | Prevent unauthorized access to another user's notifications | FE10 Assignee |

---

## 7. Key Risks

- Duplicate notifications confuse members and create support work.
- Failed email delivery may hide important account, reservation, due date, or fine events.
- Notification content may expose sensitive tokens or internal error details if templates are not controlled.
- Missing retry/audit records makes delivery issues hard to troubleshoot.
- FE10 may accidentally take over business decisions that belong to FE02, FE07, FE08, or FE09.
- Email provider credentials may be leaked if hardcoded.
- In-app notification access control bugs may expose another user's messages.

---

## 8. Dependencies

| Dependency | Why It Matters |
| ---------- | -------------- |
| FE02 Authentication | Provides account verification, password reset/setup links and auth for protected notification APIs. |
| FE07 Borrowing Management | May request due date reminders and borrow/return status notifications. |
| FE08 Reservation Management | Requests book available and reservation status notifications. |
| FE09 Fine Management | Requests overdue and fine notifications. |
| FE11 User & Role Management | May request admin-created account setup emails and uses roles for admin log access. |
| SQL Server database | Stores notification templates, records, attempts, and read states. |
| Email provider or mock provider | Delivers email notifications. |

---

## 9. Open Questions For Team / Teacher

| ID | Question | Owner | Status |
| -- | -------- | ----- | ------ |
| Q-FE10-001 | Which channels are required for Phase 1: email only, in-app only, or both? | Team/Teacher | Open |
| Q-FE10-002 | Which email provider or mock strategy will be used in development? | Team/Tech Lead | Open |
| Q-FE10-003 | Should members be able to disable optional reminders, or are all notifications mandatory? | Team/Teacher | Open |
| Q-FE10-004 | How many retry attempts should failed email notifications receive? | Team/Teacher | Open |
| Q-FE10-005 | How long should notification logs be retained? | Team/Teacher | Open |
| Q-FE10-006 | Should due date reminders be scheduled automatically, and how many days before due date? | Team/Teacher | Open |
| Q-FE10-007 | Should notification templates be editable by Admin, or fixed in code/database seed? | Team/Teacher | Open |
| Q-FE10-008 | Should failed notification delivery block the source business flow? | Team/Teacher | Open |

---

## 10. Notes For Implementation Later

- Do not implement until `SPEC.md` is reviewed and approved.
- `PLAN.md` and `TASKS.md` stay `NOT STARTED` until approval.
- Use environment variables or deployment configuration for email provider credentials.
- Do not log raw tokens, full reset links, or provider secrets.
- Keep FE10 APIs role-protected and server-side validated.
- Use idempotency keys or source event identifiers to prevent duplicate notification records.
- Keep message rendering centralized so templates are testable.
