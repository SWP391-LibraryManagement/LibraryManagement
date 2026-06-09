# SPEC.md - FE10 Notification Management

# Version: 0.1.0

# Status: DRAFT (Proposed Design)

# Owner: FE10 Assignee

# Last Updated: 2026-06-09

# Feature ID: FE10

# Feature folder: `.sdd/specs/feat-notification-management/`

> Source of truth for FE10 Notification Management. This spec is a draft and must be reviewed before implementation.
>
> IMPORTANT: This spec contains proposed answers to several open questions. Proposed decisions must be approved by the team before implementation.

---

## 1. Feature Overview

### 1.1 Feature Name

Notification Management

### 1.2 Business Context

The Library Management System must notify users about important account and library events such as account verification, password setup, reservation availability, upcoming due dates, overdue books, and fine status. Without reliable notifications, members may miss important deadlines, librarians may receive more manual questions, and account setup flows may be blocked.

Notification Management provides a central place to create, send, store, and track these messages while keeping business decisions in the source features that create notification requests.

### 1.3 Goal / Outcome

The system shall:

- Accept notification requests from approved internal features.
- Send email notifications through a configured email provider or mock provider.
- Create in-app notifications for authenticated users.
- Track notification status: `PENDING`, `SENT`, `DELIVERED`, `FAILED`, `READ`.
- Support retry for failed notifications.
- Allow members, librarians, and admins to view their own in-app notifications.
- Allow librarians/admins to view notification logs for troubleshooting.
- Keep notification content and delivery attempts traceable.

### 1.4 Scope Level

- [ ] Full Spec - core business logic, high risk, must be correct from the beginning
- [x] Standard Spec - normal feature with business rules and validations
- [ ] Light Spec - simple UI, documentation, or low-risk feature

---

## 2. Actors and Permissions

| Actor | Description | Permission / Responsibility |
| ----- | ----------- | --------------------------- |
| Member | Registered library user | View own in-app notifications, mark own notifications as read, receive email notifications. |
| Librarian | Library staff | View own notifications and view notification logs related to library operations if permitted. |
| Admin | System administrator | View notification logs, retry failed notifications, manage notification templates if approved. |
| Source Feature | Internal system feature | Creates notification requests for business events. |
| Notification Worker | System component | Sends queued notifications and records attempts. |
| Email Provider | External or mocked service | Delivers email messages. |
| Guest | Unauthenticated visitor | No notification management permission, but may receive account verification/reset emails. |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE10-001: The source feature has determined that a notification should be sent.
- PRE-FE10-002: The recipient user exists, or the source feature provides a safe guest email for account-related flows.
- PRE-FE10-003: The notification type and template key are approved.
- PRE-FE10-004: The requested notification channel is supported (`EMAIL`, `IN_APP`, or both).
- PRE-FE10-005: Email provider or mock provider configuration is available outside source code.
- PRE-FE10-006: Protected notification APIs are called by authenticated users with correct roles.

---

## 4. Main Flows

### MF-FE10-001: Create Notification Request

1. A source feature sends FE10 a notification request with type, channel, recipient, template key, template data, source feature, and source entity reference.
2. FE10 validates required fields and allowed notification type.
3. FE10 validates that the template exists and is active.
4. FE10 checks whether a notification with the same idempotency key already exists.
5. FE10 creates a notification record with status `PENDING`.
6. FE10 returns the notification ID and current status to the source feature.

### MF-FE10-002: Send Email Notification

1. Notification worker picks a `PENDING` email notification.
2. FE10 renders subject and body from the approved template and data.
3. FE10 validates recipient email address.
4. FE10 sends the email using the configured provider or mock provider.
5. FE10 records a notification attempt.
6. If provider accepts the message, FE10 sets status to `SENT` or `DELIVERED` depending on provider capability.
7. If provider rejects or fails, FE10 sets status to `FAILED` or keeps it retryable according to policy.

### MF-FE10-003: Create In-App Notification

1. Notification worker processes a `PENDING` in-app notification.
2. FE10 renders title and body from the approved template and data.
3. FE10 stores the notification for the recipient user.
4. FE10 sets status to `DELIVERED`.
5. The notification appears in the user's notification list.

### MF-FE10-004: View Own Notifications

1. Authenticated user opens their notification list.
2. FE10 verifies the user's identity.
3. FE10 returns only notifications belonging to that user.
4. The user may filter by unread/read status if supported.

### MF-FE10-005: Mark Notification As Read

1. Authenticated user selects an unread notification.
2. FE10 verifies that the notification belongs to that user.
3. FE10 sets status to `READ` and records `ReadAt`.
4. FE10 returns the updated notification state.

### MF-FE10-006: View Notification Delivery Log

1. Librarian/admin opens notification log screen.
2. FE10 verifies role permission.
3. FE10 returns notification records and delivery attempts with safe error messages.
4. Actor can filter by type, status, recipient, source feature, and date range.

### MF-FE10-007: Retry Failed Notification

1. Admin selects a failed notification.
2. FE10 verifies the notification is retryable and has not exceeded retry limit.
3. FE10 resets status to `PENDING` or creates a new attempt.
4. Notification worker tries sending again.
5. FE10 records the retry result.

---

## 5. Alternative Flows

### AF-FE10-001: Missing Or Invalid Recipient

1. Source feature submits a notification request without valid recipient data.
2. FE10 rejects the request with validation error.
3. FE10 does not create a notification record unless the team approves storing rejected requests.

### AF-FE10-002: Duplicate Source Event

1. Source feature sends the same idempotency key more than once.
2. FE10 returns the existing notification record instead of creating duplicates.

### AF-FE10-003: Template Missing Or Inactive

1. Source feature requests a template key that does not exist or is inactive.
2. FE10 rejects the request or marks it `FAILED` according to source path.
3. FE10 records a safe error reason for admin troubleshooting.

### AF-FE10-004: Email Provider Unavailable

1. Notification worker attempts to send an email.
2. Email provider is unavailable or returns an error.
3. FE10 records attempt failure and schedules retry if retry limit is not reached.
4. The original business transaction in the source feature remains completed.

### AF-FE10-005: User Tries To Read Another User's Notification

1. Authenticated user requests a notification that belongs to another user.
2. FE10 denies the request with forbidden response.

### AF-FE10-006: Optional Notification Disabled

1. Source feature requests an optional notification.
2. Recipient preference disables that type/channel.
3. FE10 records the request as `SKIPPED` or does not create it, depending on approved policy.

---

## 6. Business Rules

Use these stable IDs for tasks and tests.

- BR-FE10-001: FE10 must not decide source business events; source features decide when a notification is needed.
- BR-FE10-002: FE10 must validate notification type, channel, template key, recipient, and required template data before creating a notification.
- BR-FE10-003: FE10 must not generate or validate authentication, password reset, or password setup tokens.
- BR-FE10-004: FE10 must not expose raw tokens, provider credentials, or internal stack traces in logs or responses.
- BR-FE10-005: A notification request should include a source feature and source entity reference when available.
- BR-FE10-006: Duplicate notification requests with the same idempotency key must not create duplicate active notifications.
- BR-FE10-007: In-app notifications must be visible only to the recipient user and authorized admin/librarian log viewers.
- BR-FE10-008: A user can mark only their own in-app notification as read.
- BR-FE10-009: Failed notification delivery must be recorded with safe failure reason and attempt count.
- BR-FE10-010: Failed email notifications may be retried only up to the approved retry limit.
- BR-FE10-011: Email provider credentials must be stored outside source code.
- BR-FE10-012: Notification templates must define required variables and must not render missing required data silently.
- BR-FE10-013: Account verification, password setup/reset, reservation availability, due date, overdue, and fine notifications are supported notification types for Phase 1.
- BR-FE10-014: Notification delivery failure must not automatically roll back the source business transaction.
- BR-FE10-015: Notification status changes must be traceable.

---

## 7. Functional Requirements

- FR-FE10-001: When a source feature submits a valid notification request, the system shall create a notification record with status `PENDING`.
- FR-FE10-002: If required request fields are missing or invalid, the system shall reject the notification request.
- FR-FE10-003: If an idempotency key already exists, the system shall return the existing notification instead of creating a duplicate.
- FR-FE10-004: When a pending email notification is processed, the system shall render the email template and send through the configured provider.
- FR-FE10-005: When a pending in-app notification is processed, the system shall create a readable notification for the recipient user.
- FR-FE10-006: When delivery succeeds, the system shall update notification status and delivery timestamp.
- FR-FE10-007: When delivery fails, the system shall record attempt details and safe failure reason.
- FR-FE10-008: When a failed notification is retryable, the system shall allow an authorized admin to retry it.
- FR-FE10-009: When a user views notifications, the system shall return only that user's notifications.
- FR-FE10-010: When a user marks their notification as read, the system shall update status to `READ` and set `ReadAt`.
- FR-FE10-011: When librarian/admin views delivery logs, the system shall return notification and attempt records with filters.
- FR-FE10-012: When FE02 requests account verification or password setup/reset delivery, FE10 shall send the message without owning token generation or validation.
- FR-FE10-013: When FE08 requests reservation availability delivery, FE10 shall send or create the notification using reservation template data.
- FR-FE10-014: When FE07/FE09 request due date, overdue, or fine delivery, FE10 shall send or create the notification using approved template data.
- FR-FE10-015: When template data is missing a required variable, the system shall reject or fail the notification safely.

---

## 8. Acceptance Criteria

- AC-FE10-001: Given a valid notification request, when FE10 receives it, then a `PENDING` notification record is created.
- AC-FE10-002: Given a notification request with missing recipient, when FE10 receives it, then the request is rejected.
- AC-FE10-003: Given two requests with the same idempotency key, when FE10 receives the second request, then no duplicate notification is created.
- AC-FE10-004: Given a pending email notification and valid provider config, when worker processes it, then FE10 records a send attempt and marks it `SENT` or `DELIVERED`.
- AC-FE10-005: Given email provider failure, when worker processes email notification, then FE10 records failure and does not expose provider secrets.
- AC-FE10-006: Given a pending in-app notification, when worker processes it, then the recipient can view it in their notification list.
- AC-FE10-007: Given a logged-in member, when viewing notifications, then only that member's notifications are returned.
- AC-FE10-008: Given a notification owned by another user, when a member tries to read or update it, then FE10 denies the action.
- AC-FE10-009: Given an unread notification owned by the user, when the user marks it read, then status becomes `READ` and `ReadAt` is set.
- AC-FE10-010: Given a failed retryable notification, when admin retries it, then FE10 creates a new attempt or resets it to `PENDING`.
- AC-FE10-011: Given FE02 submits account verification delivery with safe template data, when FE10 processes it, then an account verification message is sent.
- AC-FE10-012: Given FE08 submits reservation available delivery, when FE10 processes it, then a reservation notification is created/sent.
- AC-FE10-013: Given FE07 submits due date reminder delivery, when FE10 processes it, then a due date reminder notification is created/sent.
- AC-FE10-014: Given FE09 submits fine/overdue delivery, when FE10 processes it, then a fine/overdue notification is created/sent.
- AC-FE10-015: Given missing required template variable, when FE10 renders the message, then the notification fails safely and records a safe reason.
- AC-FE10-016: Given a librarian/admin with permission, when viewing logs, then notification attempts can be filtered by status, type, source feature, and date range.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
| -- | ----------------- | ------------------------ |
| EC-FE10-001 | Recipient user does not exist | Reject request or mark failed with safe reason. |
| EC-FE10-002 | Recipient has no email for email channel | Mark notification failed or skip email channel according to policy. |
| EC-FE10-003 | Invalid email format | Reject request before sending. |
| EC-FE10-004 | Unsupported notification type | Reject request. |
| EC-FE10-005 | Unsupported channel | Reject request. |
| EC-FE10-006 | Missing template key | Reject request or fail notification safely. |
| EC-FE10-007 | Missing required template variable | Fail notification safely and record safe reason. |
| EC-FE10-008 | Duplicate idempotency key | Return existing notification without duplicate send. |
| EC-FE10-009 | Email provider timeout | Record attempt failure and retry if allowed. |
| EC-FE10-010 | Retry limit exceeded | Keep status `FAILED` and require manual review. |
| EC-FE10-011 | User tries to view another user's notification | Return forbidden response. |
| EC-FE10-012 | Admin retries a non-retryable notification | Reject retry with clear reason. |
| EC-FE10-013 | Template contains unsafe HTML/script | Reject template or sanitize rendered output. |
| EC-FE10-014 | Source business transaction completed but notification send failed | Keep source transaction completed; record FE10 failure for retry. |
| EC-FE10-015 | Email provider returns sensitive error details | Store sanitized error summary only. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Users | Stores recipient identity and email address. |
| UserRoles | Supports permission checks for log/admin actions. |
| NotificationTemplates | Stores approved templates for email and in-app notifications. |
| Notifications | Stores notification records, source references, status, and read state. |
| NotificationAttempts | Stores delivery attempts and safe failure details. |
| UserNotificationPreferences | Stores optional user channel preferences if approved. |
| AuditLogs | Records important admin actions and retry actions if used. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| notificationId | integer | Yes | Primary key. |
| userId | integer | No | Required for in-app and member-specific notifications. |
| recipientEmail | string | No | Required for guest/account email flows if no user ID is available. |
| type | enum | Yes | Values: `ACCOUNT_VERIFICATION`, `PASSWORD_SETUP`, `PASSWORD_RESET`, `RESERVATION_AVAILABLE`, `DUE_DATE_REMINDER`, `OVERDUE_NOTICE`, `FINE_NOTICE`, `GENERAL_SYSTEM`. |
| channel | enum | Yes | Values: `EMAIL`, `IN_APP`. |
| templateKey | string | Yes | Must map to active template. |
| title | string | No | Rendered title or email subject. |
| body | string | No | Rendered body. Must not contain unsafe script. |
| status | enum | Yes | Values: `PENDING`, `SENT`, `DELIVERED`, `FAILED`, `READ`, `SKIPPED`. |
| sourceFeature | string | No | Example: `FE02`, `FE08`, `FE09`. |
| sourceEntityType | string | No | Example: `Reservation`, `Fine`, `BorrowDetail`. |
| sourceEntityId | integer/string | No | Reference to source record. |
| idempotencyKey | string | No | Prevents duplicate notifications for same source event. |
| createdAt | datetime | Yes | Notification creation timestamp. |
| sentAt | datetime | No | Email send timestamp or in-app delivery timestamp. |
| readAt | datetime | No | User read timestamp for in-app notifications. |
| attemptNo | integer | No | Delivery attempt count. |
| errorMessage | string | No | Sanitized failure reason only. |

---

## 11. API / Interface Contract

> Endpoint names are proposed for RESTful API. Final contract must be copied into `docs/api/api-contract.md` before implementation.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| POST | `/api/notifications/requests` | Source Feature | `{ type, channel, userId?, recipientEmail?, templateKey, templateData, sourceFeature?, sourceEntityType?, sourceEntityId?, idempotencyKey? }` | `{ notificationId, status }` | Internal API to create notification request. Must be protected from public callers. |
| GET | `/api/notifications/me` | Member/Librarian/Admin | Query: `status?, type?, page?, limit?` | Paginated own notifications | Returns only current user's notifications. |
| PATCH | `/api/notifications/{notificationId}/read` | Member/Librarian/Admin | `{}` | Updated notification | Only owner can mark own notification read. |
| GET | `/api/notifications/logs` | Librarian/Admin | Query: `status?, type?, sourceFeature?, from?, to?, page?, limit?` | Paginated notification logs | For troubleshooting and audit. |
| GET | `/api/notifications/{notificationId}` | Owner or Admin/Librarian | - | Notification detail | User can view own detail; admin/librarian log access is role-protected. |
| POST | `/api/notifications/{notificationId}/retry` | Admin | `{}` | `{ notificationId, status }` | Retries failed notification if retryable. |
| GET | `/api/notification-templates` | Admin | Query: `channel?, active?` | Template list | Optional if template management is approved. |
| PUT | `/api/notification-templates/{templateKey}` | Admin | `{ subjectTemplate?, bodyTemplate, requiredVariables, isActive }` | Updated template | Optional; may be replaced by DB seed or static templates. |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE10-SEC-001: All notification APIs must validate input on the server.
- NFR-FE10-SEC-002: Protected APIs must enforce role-based access on the server.
- NFR-FE10-SEC-003: Email provider credentials must not be hardcoded or committed.
- NFR-FE10-SEC-004: FE10 must not log raw tokens, reset/setup links, provider credentials, or internal stack traces.
- NFR-FE10-SEC-005: Users must not access another user's in-app notifications.
- NFR-FE10-SEC-006: Template rendering must escape or sanitize unsafe HTML/script content.
- NFR-FE10-SEC-007: Internal notification request endpoint must not be publicly callable without authentication/authorization or internal service protection.

### 12.2 Reliability

- NFR-FE10-REL-001: Failed sends must record attempt number, timestamp, and safe failure reason.
- NFR-FE10-REL-002: Retry behavior must be deterministic and limited by approved retry policy.
- NFR-FE10-REL-003: Source business transactions must not be rolled back only because notification delivery failed.
- NFR-FE10-REL-004: Duplicate source events should be handled with idempotency key.

### 12.3 Performance

- NFR-FE10-PERF-001: Creating a notification request should return within 500ms p95 in normal local/dev conditions when asynchronous sending is available, without waiting for slow external email delivery.
- NFR-FE10-PERF-002: User notification list should be paginated.
- NFR-FE10-PERF-003: Notification log queries should support indexed filters by status, type, source feature, and created date.

### 12.4 Logging and Audit

- NFR-FE10-LOG-001: Every failed delivery attempt must be logged in `NotificationAttempts`.
- NFR-FE10-LOG-002: Admin retry actions must be auditable.
- NFR-FE10-LOG-003: Logs must store safe summaries, not secrets or raw provider responses containing sensitive data.

### 12.5 Usability

- NFR-FE10-UX-001: Notification messages must be clear, concise, and action-oriented.
- NFR-FE10-UX-002: In-app notification list must distinguish unread and read notifications.
- NFR-FE10-UX-003: Failure messages shown to users must be understandable and not expose technical internals.

---

## 13. Out of Scope

This feature does not include:

- SMS notifications.
- Mobile push notifications.
- Marketing campaigns or newsletters.
- Online payment notifications.
- Token generation or validation for authentication.
- Fine calculation.
- Reservation queue decisions.
- Borrowing/return approval decisions.
- Building a full email design editor.
- Storing real email provider credentials in the repository.

---

## 14. Dependencies

| Dependency | Type | Notes |
| ---------- | ---- | ----- |
| FE02 Authentication | Internal | Sends account verification and password setup/reset messages; owns tokens and auth. |
| FE07 Borrowing Management | Internal | May request due date reminders and borrow/return status notifications. |
| FE08 Reservation Management | Internal | Requests reservation available notifications. |
| FE09 Fine Management | Internal | Requests overdue and fine notifications. |
| FE11 User & Role Management | Internal | May trigger admin-created account setup emails and controls admin/librarian roles. |
| SQL Server database | Technical | Stores notification records, templates, attempts, and preferences. |
| Email provider or mock provider | Technical | Sends email notifications. |
| Scheduler/worker | Technical | Processes pending notifications and due date reminders if approved. |

---

## 15. Open Questions

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

## 15.1 Proposed Design Decisions

The following answers are proposed in this spec and must be approved before implementation.

| Open Question | Proposed Answer | Implemented As | Status |
| ------------- | --------------- | -------------- | ------ |
| Q-FE10-001 | Support both email and in-app for Phase 1, but allow email provider to be mocked in development. | `channel` supports `EMAIL` and `IN_APP`. | PROPOSED |
| Q-FE10-002 | Use a mock provider in development; real provider configured later through environment variables. | NFR-FE10-SEC-003, Dependencies. | PROPOSED |
| Q-FE10-003 | Account/security notices are mandatory; optional reminders may use preferences later. | `UserNotificationPreferences` optional. | PROPOSED |
| Q-FE10-004 | Retry failed email up to 3 attempts. | BR-FE10-010, retry flow. | PROPOSED |
| Q-FE10-005 | Retain logs for the project duration unless teacher defines another policy. | Open until approved. | PROPOSED |
| Q-FE10-006 | Due date reminders should be sent 1 day before due date if scheduler is implemented. | Dependency on scheduler/FE07. | PROPOSED |
| Q-FE10-007 | Templates are fixed by seed/static configuration for Phase 1; Admin editing is optional. | Template admin API marked optional. | PROPOSED |
| Q-FE10-008 | Failed notification delivery must not block source business flow. | BR-FE10-014, NFR-FE10-REL-003. | PROPOSED |

---

## 16. Traceability Matrix

| AC ID | Acceptance Criterion | Related FR | Related BR | Test Case | Status |
| ----- | -------------------- | ---------- | ---------- | --------- | ------ |
| AC-FE10-001 | Valid request creates pending notification | FR-FE10-001 | BR-FE10-001, BR-FE10-002, BR-FE10-005 | FT50 | Not Started |
| AC-FE10-002 | Missing recipient is rejected | FR-FE10-002 | BR-FE10-002 | FT51 | Not Started |
| AC-FE10-003 | Duplicate idempotency key does not duplicate notification | FR-FE10-003 | BR-FE10-006 | FT50 | Not Started |
| AC-FE10-004 | Pending email notification is sent and attempt recorded | FR-FE10-004, FR-FE10-006 | BR-FE10-009, BR-FE10-015 | FT52 | Not Started |
| AC-FE10-005 | Email provider failure is recorded safely | FR-FE10-007 | BR-FE10-004, BR-FE10-009, BR-FE10-011 | FT58 | Not Started |
| AC-FE10-006 | Pending in-app notification becomes visible to recipient | FR-FE10-005 | BR-FE10-007 | FT56 | Not Started |
| AC-FE10-007 | User sees only own notifications | FR-FE10-009 | BR-FE10-007 | FT56, FT59 | Not Started |
| AC-FE10-008 | User cannot read/update another user's notification | FR-FE10-009, FR-FE10-010 | BR-FE10-007, BR-FE10-008 | FT59 | Not Started |
| AC-FE10-009 | User marks own notification as read | FR-FE10-010 | BR-FE10-008, BR-FE10-015 | FT57 | Not Started |
| AC-FE10-010 | Admin retries failed retryable notification | FR-FE10-008 | BR-FE10-009, BR-FE10-010, BR-FE10-015 | FT58 | Not Started |
| AC-FE10-011 | FE02 account notification is sent without FE10 owning token generation | FR-FE10-012 | BR-FE10-003, BR-FE10-013 | FT52 | Not Started |
| AC-FE10-012 | FE08 reservation available notification is sent/created | FR-FE10-013 | BR-FE10-013 | FT53 | Not Started |
| AC-FE10-013 | FE07 due date reminder notification is sent/created | FR-FE10-014 | BR-FE10-013 | FT54 | Not Started |
| AC-FE10-014 | FE09 fine/overdue notification is sent/created | FR-FE10-014 | BR-FE10-013 | FT55 | Not Started |
| AC-FE10-015 | Missing template variable fails safely | FR-FE10-015 | BR-FE10-002, BR-FE10-012 | FT51 | Not Started |
| AC-FE10-016 | Admin/librarian log viewer filters notification attempts | FR-FE10-011 | BR-FE10-015 | FT58 | Not Started |

### Coverage Summary

- Total AC: 16 (AC-FE10-001 to AC-FE10-016) - all mapped.
- Total FR: 15 (FR-FE10-001 to FR-FE10-015) - all mapped.
- Total BR: 15 (BR-FE10-001 to BR-FE10-015) - all mapped.
- Total Tests: 10 (FT50 to FT59) - coverage planned.

---

## 17. Review Checklist

Before this SPEC.md is approved:

- [ ] Feature ID and folder match Master Feature List.
- [ ] Scope stays inside FE10 Notification Management.
- [ ] Team approves proposed decisions in Section 15.1.
- [ ] Channel strategy is confirmed: email, in-app, or both.
- [ ] Email provider or mock provider strategy is confirmed.
- [ ] Retry policy is approved.
- [ ] Notification schema is reviewed with database owner.
- [ ] FE02, FE07, FE08, FE09, and FE11 dependencies are checked for conflicts.
- [ ] API contract is copied to `docs/api/api-contract.md` if approved.
- [ ] No secrets, provider credentials, raw tokens, or sensitive links are stored/logged.
- [ ] Every acceptance criterion can become a test.
