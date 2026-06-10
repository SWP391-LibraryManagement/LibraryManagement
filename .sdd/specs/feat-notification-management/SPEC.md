# SPEC.md - FE10 Notification Management

# Version: 0.1.0

# Status: APPROVED

# Owner: Nhat

# Last Updated: 2026-06-10

# Feature ID: FE10

# Feature folder: `.sdd/specs/feat-notification-management/`

> Source of truth for FE10 Notification Management. This spec is approved for Phase 2 planning.
>
> Decisions in this spec were reviewed and approved on 2026-06-10. See `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.

---

## 1. Feature Overview

### 1.1 Feature Name

Notification Management

### 1.2 Business Context

The Library Management System must notify users about important account and library events such as account verification, password reset, reservation availability, upcoming due dates, overdue books, and fine status. Without reliable notifications, members may miss important deadlines, librarians may receive more manual questions, and account recovery flows may be blocked.

Notification Management provides a central place to create, send, store, and track these messages while keeping business decisions in the source features that create notification requests.

### 1.3 Goal / Outcome

The system shall:

- Accept notification requests from approved internal features.
- Send email notifications through a configured email provider or mock provider.
- Create in-app notifications for authenticated users.
- Track notification status: `PENDING`, `SENT`, `DELIVERED`, `FAILED`, or `SKIPPED`.
- Keep notification content and delivery attempts traceable without exposing secrets.
- Support the four assigned Phase 1 notification use cases: account verification, password reset, book reservation, and due date/fine notification.

### 1.4 Scope Level

- [ ] Full Spec - core business logic, high risk, must be correct from the beginning
- [x] Standard Spec - normal feature with business rules and validations
- [ ] Light Spec - simple UI, documentation, or low-risk feature

---

## 2. Actors and Permissions

| Actor | Description | Permission / Responsibility |
| ----- | ----------- | --------------------------- |
| Member | Registered library user | Receive email or in-app notifications related to reservations, due dates, overdue items, and fines. |
| Librarian | Library staff | May receive operational notifications if source features request them. |
| Admin | System administrator | May receive account or operational notifications if source features request them. |
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

### MF-FE10-001: Send Account Verification Notification

1. FE02 Authentication requests account verification delivery with recipient email and safe verification link/template data.
2. FE10 validates the recipient, channel, template key, and required template data.
3. FE10 confirms that it is not responsible for generating or validating the verification token.
4. FE10 creates a notification record and renders the approved account verification template.
5. FE10 sends the email or creates an in-app notification according to the requested channel.
6. FE10 records the delivery status and safe failure reason if delivery fails.

### MF-FE10-002: Send Password Reset Notification

1. FE02 Authentication requests password reset delivery with recipient email and safe reset link data.
2. FE10 validates the recipient, channel, template key, and required template data.
3. FE10 confirms that FE02 owns token generation and validation.
4. FE10 renders the approved password reset template.
5. FE10 sends the email or creates an in-app notification according to the requested channel.
6. FE10 records the delivery status and safe failure reason if delivery fails.

### MF-FE10-003: Send Book Reservation Notification

1. FE08 Reservation Management requests reservation notification delivery when a reservation status changes or a reserved book becomes available.
2. FE10 validates the recipient, channel, template key, and reservation template data.
3. FE10 confirms that FE08 owns reservation queue and availability decisions.
4. FE10 renders the approved reservation template.
5. FE10 sends the email or creates an in-app notification according to the requested channel.
6. FE10 records the delivery status and safe failure reason if delivery fails.

### MF-FE10-004: Send Due Date Or Fine Notification

1. FE07 Borrowing Management or FE09 Fine Management requests due date, overdue, or fine notification delivery.
2. FE10 validates the recipient, channel, template key, and due date/fine template data.
3. FE10 confirms that FE07 owns due date/borrowing decisions and FE09 owns fine calculation.
4. FE10 renders the approved due date, overdue, or fine template.
5. FE10 sends the email or creates an in-app notification according to the requested channel.
6. FE10 records the delivery status and safe failure reason if delivery fails.

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
3. FE10 records attempt failure with a safe failure reason.
4. The original business transaction in the source feature remains completed.

### AF-FE10-005: Optional Notification Disabled

1. Source feature requests an optional notification.
2. Recipient preference disables that type/channel.
3. FE10 records the request as `SKIPPED` or does not create it, depending on approved policy.

---

## 6. Business Rules

Use these stable IDs for tasks and tests.

- BR-FE10-001: FE10 must not decide source business events; source features decide when a notification is needed.
- BR-FE10-002: FE10 must validate notification type, channel, template key, recipient, and required template data before creating a notification.
- BR-FE10-003: FE10 must not generate or validate authentication or password reset tokens.
- BR-FE10-004: FE10 must not expose raw tokens, provider credentials, or internal stack traces in logs or responses.
- BR-FE10-005: A notification request should include a source feature and source entity reference when available.
- BR-FE10-006: Duplicate notification requests with the same idempotency key must not create duplicate active notifications.
- BR-FE10-007: FE10 must support account verification, password reset, reservation, due date, overdue, and fine notification types for Phase 1.
- BR-FE10-008: Failed notification delivery must be recorded with safe failure reason and attempt count.
- BR-FE10-009: Email provider credentials must be stored outside source code.
- BR-FE10-010: Notification templates must define required variables and must not render missing required data silently.
- BR-FE10-011: Internal notification request endpoints must be protected from public callers.
- BR-FE10-012: Notification delivery failure must not automatically roll back the source business transaction.
- BR-FE10-013: Notification status changes must be traceable.

---

## 7. Functional Requirements

- FR-FE10-001: When FE02 requests account verification notification with valid data, the system shall send or create the account verification notification without generating or validating the token.
- FR-FE10-002: When FE02 requests password reset notification with valid data, the system shall send or create the password reset notification without exposing raw tokens.
- FR-FE10-003: When FE08 requests book reservation notification with valid data, the system shall send or create the reservation notification without deciding queue eligibility.
- FR-FE10-004: When FE07 or FE09 requests due date, overdue, or fine notification with valid data, the system shall send or create the due date/fine notification without calculating fines or changing borrowing state.
- FR-FE10-005: When required request fields are missing or invalid, the system shall reject the notification request or mark it failed safely.
- FR-FE10-006: When a notification is delivered successfully, the system shall update delivery status and timestamp.
- FR-FE10-007: When delivery fails, the system shall record attempt details and safe failure reason.
- FR-FE10-008: When a duplicate source event is submitted with the same idempotency key, the system shall not create duplicate active notifications.
- FR-FE10-009: When template data is missing a required variable, the system shall reject or fail the notification safely.

---

## 8. Acceptance Criteria

- AC-FE10-001: Given FE02 submits account verification delivery with safe template data, when FE10 processes it, then an account verification notification is sent or created.
- AC-FE10-002: Given FE02 submits password reset delivery with safe template data, when FE10 processes it, then a password reset notification is sent or created.
- AC-FE10-003: Given FE08 submits book reservation delivery with reservation template data, when FE10 processes it, then a book reservation notification is sent or created.
- AC-FE10-004: Given FE07 submits due date reminder delivery, when FE10 processes it, then a due date reminder notification is sent or created.
- AC-FE10-005: Given FE09 submits overdue/fine delivery, when FE10 processes it, then an overdue/fine notification is sent or created.
- AC-FE10-006: Given a request with missing recipient or missing required template variable, when FE10 processes it, then the notification is rejected or failed safely.
- AC-FE10-007: Given FE02 provides a reset link, when FE10 sends the notification, then FE10 does not log or expose raw token values.
- AC-FE10-008: Given a duplicate source event idempotency key, when FE10 receives the duplicate request, then no duplicate active notification is created.
- AC-FE10-009: Given provider delivery failure, when FE10 processes the notification, then FE10 records a safe failure reason and does not roll back the source business flow.

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
| EC-FE10-009 | Email provider timeout | Record attempt failure with safe reason. |
| EC-FE10-010 | Template contains unsafe HTML/script | Reject template or sanitize rendered output. |
| EC-FE10-011 | Source business transaction completed but notification send failed | Keep source transaction completed; record FE10 failure. |
| EC-FE10-012 | Email provider returns sensitive error details | Store sanitized error summary only. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Users | Stores recipient identity and email address. |
| NotificationTemplates | Stores approved templates for email and in-app notifications. |
| Notifications | Stores notification records, source references, status, and delivery timestamps. |
| NotificationAttempts | Stores delivery attempts and safe failure details. |
| UserNotificationPreferences | Stores optional user channel preferences if approved. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| notificationId | integer | Yes | Primary key. |
| userId | integer | No | Required for in-app and member-specific notifications. |
| recipientEmail | string | No | Required for guest/account email flows if no user ID is available. |
| type | enum | Yes | Values: `ACCOUNT_VERIFICATION`, `PASSWORD_RESET`, `RESERVATION_AVAILABLE`, `DUE_DATE_REMINDER`, `OVERDUE_NOTICE`, `FINE_NOTICE`, `GENERAL_SYSTEM`. |
| channel | enum | Yes | Values: `EMAIL`, `IN_APP`. |
| templateKey | string | Yes | Must map to active template. |
| title | string | No | Rendered title or email subject. |
| body | string | No | Rendered body. Must not contain unsafe script. |
| status | enum | Yes | Values: `PENDING`, `SENT`, `DELIVERED`, `FAILED`, `SKIPPED`. |
| sourceFeature | string | No | Example: `FE02`, `FE08`, `FE09`. |
| sourceEntityType | string | No | Example: `Reservation`, `Fine`, `BorrowDetail`. |
| sourceEntityId | integer/string | No | Reference to source record. |
| idempotencyKey | string | No | Prevents duplicate notifications for same source event. |
| createdAt | datetime | Yes | Notification creation timestamp. |
| sentAt | datetime | No | Email send timestamp or in-app delivery timestamp. |
| attemptNo | integer | No | Delivery attempt count. |
| errorMessage | string | No | Sanitized failure reason only. |

---

## 11. API / Interface Contract

> Endpoint names are proposed for RESTful API. Final contract may stay in this SPEC.md unless the team reintroduces a dedicated API contract document.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| POST | `/api/notifications/requests` | Source Feature | `{ type, channel, userId?, recipientEmail?, templateKey, templateData, sourceFeature?, sourceEntityType?, sourceEntityId?, idempotencyKey? }` | `{ notificationId, status }` | Internal API to create notification request. Must be protected from public callers. |
| POST | `/api/notifications/process-pending` | Notification Worker/Internal | `{ limit?: number }` | `{ processed, failed }` | Optional internal worker endpoint or background job trigger; not public. |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE10-SEC-001: All notification APIs must validate input on the server.
- NFR-FE10-SEC-002: Protected APIs must enforce role-based access on the server.
- NFR-FE10-SEC-003: Email provider credentials must not be hardcoded or committed.
- NFR-FE10-SEC-004: FE10 must not log raw tokens, reset links, provider credentials, or internal stack traces.
- NFR-FE10-SEC-005: Template rendering must escape or sanitize unsafe HTML/script content.
- NFR-FE10-SEC-006: Internal notification request endpoint must not be publicly callable without authentication/authorization or internal service protection.

### 12.2 Reliability

- NFR-FE10-REL-001: Failed sends must record attempt number, timestamp, and safe failure reason.
- NFR-FE10-REL-002: Source business transactions must not be rolled back only because notification delivery failed.
- NFR-FE10-REL-003: Duplicate source events should be handled with idempotency key.

### 12.3 Performance

- NFR-FE10-PERF-001: Creating a notification request should return within 500ms p95 in normal local/dev conditions when asynchronous sending is available, without waiting for slow external email delivery.
- NFR-FE10-PERF-002: Notification lookup by status, type, source feature, and created date should use indexed fields where practical.

### 12.4 Logging and Audit

- NFR-FE10-LOG-001: Every failed delivery attempt must be logged in `NotificationAttempts`.
- NFR-FE10-LOG-002: Logs must store safe summaries, not secrets or raw provider responses containing sensitive data.

### 12.5 Usability

- NFR-FE10-UX-001: Notification messages must be clear, concise, and action-oriented.
- NFR-FE10-UX-002: Failure messages shown to users must be understandable and not expose technical internals.

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
- User notification inbox/list UI.
- Marking in-app notifications as read.
- Admin/librarian notification log screens.
- Manual retry management screens.
- Template editor UI.
- Building a full email design editor.
- Storing real email provider credentials in the repository.

---

## 14. Dependencies

| Dependency | Type | Notes |
| ---------- | ---- | ----- |
| FE02 Authentication | Internal | Sends account verification and password reset messages; owns tokens and auth. |
| FE07 Borrowing Management | Internal | May request due date reminders and borrow/return status notifications. |
| FE08 Reservation Management | Internal | Requests reservation available notifications. |
| FE09 Fine Management | Internal | Requests overdue and fine notifications. |
| SQL Server database | Technical | Stores notification records, templates, attempts, and preferences. |
| Email provider or mock provider | Technical | Sends email notifications. |
| Scheduler/worker | Technical | Processes pending notifications and due date reminders if approved. |

---

## 15. Resolved Questions

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE10-001 | Phase 1 required channel is email with mock provider. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-002 | In-app notification is optional/future work in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-003 | Required templates: verification, password reset, due reminder, overdue notice, reservation ready, membership result. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-004 | Store notification send attempts and status. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-005 | Retry failed sends manually only in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-006 | Notification failure must not block source business flow. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-007 | System/Scheduler may trigger notifications internally; not a login role. | Review packet 2026-06-10 | APPROVED |

---

## 15.1 Approved Design Decisions

The following decisions were approved in the Phase 1 review packet on 2026-06-10 and are now part of this spec.

| Decision | Approved Answer | Status |
| -------- | --------------- | ------ |
| Q-FE10-001 | Phase 1 required channel is email with mock provider. | APPROVED |
| Q-FE10-002 | In-app notification is optional/future work in Phase 1. | APPROVED |
| Q-FE10-003 | Required templates: verification, password reset, due reminder, overdue notice, reservation ready, membership result. | APPROVED |
| Q-FE10-004 | Store notification send attempts and status. | APPROVED |
| Q-FE10-005 | Retry failed sends manually only in Phase 1. | APPROVED |
| Q-FE10-006 | Notification failure must not block source business flow. | APPROVED |
| Q-FE10-007 | System/Scheduler may trigger notifications internally; not a login role. | APPROVED |

---

## 16. Traceability Matrix

| AC ID | Acceptance Criterion | Related FR | Related BR | Test Case | Status |
| ----- | -------------------- | ---------- | ---------- | --------- | ------ |
| AC-FE10-001 | FE02 account verification notification is sent/created without FE10 owning token generation | FR-FE10-001 | BR-FE10-001, BR-FE10-002, BR-FE10-003, BR-FE10-007 | FT46 | Not Started |
| AC-FE10-002 | FE02 password reset notification is sent/created without exposing raw token values | FR-FE10-002 | BR-FE10-003, BR-FE10-004, BR-FE10-007 | FT47 | Not Started |
| AC-FE10-003 | FE08 book reservation notification is sent/created without FE10 deciding queue eligibility | FR-FE10-003 | BR-FE10-001, BR-FE10-007 | FT48 | Not Started |
| AC-FE10-004 | FE07 due date notification is sent/created without FE10 changing borrowing state | FR-FE10-004 | BR-FE10-001, BR-FE10-007, BR-FE10-012 | FT49 | Not Started |
| AC-FE10-005 | FE09 fine/overdue notification is sent/created without FE10 calculating fines | FR-FE10-004 | BR-FE10-001, BR-FE10-007, BR-FE10-012 | FT49 | Not Started |
| AC-FE10-006 | Missing recipient or template data fails safely | FR-FE10-005, FR-FE10-009 | BR-FE10-002, BR-FE10-010 | FT46, FT47, FT48, FT49 | Not Started |
| AC-FE10-007 | Password reset token/link values are not logged or exposed by FE10 | FR-FE10-002 | BR-FE10-003, BR-FE10-004 | FT47 | Not Started |
| AC-FE10-008 | Duplicate source event does not create duplicate active notification | FR-FE10-008 | BR-FE10-006 | FT46, FT47, FT48, FT49 | Not Started |
| AC-FE10-009 | Delivery failure records safe failure reason and does not roll back source business flow | FR-FE10-007 | BR-FE10-004, BR-FE10-008, BR-FE10-012, BR-FE10-013 | FT46, FT47, FT48, FT49 | Not Started |

### Coverage Summary

- Total AC: 9 (AC-FE10-001 to AC-FE10-009) - all mapped.
- Total FR: 9 (FR-FE10-001 to FR-FE10-009) - all mapped.
- Total BR: 13 (BR-FE10-001 to BR-FE10-013) - all mapped.
- Total Tests: 4 (FT46 to FT49) - aligned with assignment sheet.


### External Assignment Traceability (Excel UC IDs)

| Assignment UC ID | Excel Use Case | Related Main Flow / Requirement | Related Test |
| ---------------- | -------------- | ------------------------------- | ------------ |
| UC45 | Send Account Verification Notification | MF-FE10-001; FR-FE10-001 | FT46 |
| UC46 | Send Password Reset Notification | MF-FE10-002; FR-FE10-002 | FT47 |
| UC47 | Send Book Reservation Notification | MF-FE10-003; FR-FE10-003 | FT48 |
| UC48 | Send Due Date Or Fine Notification | MF-FE10-004, MF-FE10-005; FR-FE10-004 | FT49 |

---

## 17. Review Checklist

Phase 1 approval checklist (completed on 2026-06-10):

- [x] Feature ID and folder match Master Feature List.
- [x] Scope stays inside FE10 Notification Management.
- [x] Team approves proposed decisions in Section 15.1.
- [x] Channel strategy is confirmed: email, in-app, or both.
- [x] Email provider or mock provider strategy is confirmed.
- [x] Notification schema is reviewed with database owner.
- [x] FE02, FE07, FE08, FE09, and FE11 dependencies are checked for conflicts.
- [x] API contract is approved in this SPEC.md or copied to a dedicated API contract file if the team reintroduces one.
- [x] No secrets, provider credentials, raw tokens, or sensitive links are stored/logged.
- [x] Every acceptance criterion can become a test.
