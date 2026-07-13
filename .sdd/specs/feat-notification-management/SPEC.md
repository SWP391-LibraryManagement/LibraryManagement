# SPEC.md - FE10 Notification Management

# Version: 0.2.0

# Status: APPROVED

# Owner: Nhat

# Last Updated: 2026-07-13

# Feature ID: FE10

# Feature folder: `.sdd/specs/feat-notification-management/`

> Source of truth for FE10 Notification Management. This spec is approved for B5 hardening implementation.
>
> Initial Phase 1 decisions were approved on 2026-06-10. The G1-G7 hardening contract was approved by Nhat on 2026-07-13 and is recorded in `PLAN.md`.

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
- Send sensitive authentication email synchronously through the mock provider without persisting rendered sensitive content.
- Queue non-sensitive email notifications for worker processing.
- Track notification status: `PENDING`, `SENT`, `DELIVERED`, `FAILED`, or `SKIPPED`.
- Keep non-sensitive content and all delivery attempts traceable without persisting, logging, auditing, or returning secrets or rendered sensitive authentication content.
- Support the four assigned Phase 1 notification use cases: account verification, password reset, book reservation, and due date/fine notification.

### 1.4 Scope Level

- [ ] Full Spec - core business logic, high risk, must be correct from the beginning
- [x] Standard Spec - normal feature with business rules and validations
- [ ] Light Spec - simple UI, documentation, or low-risk feature

---

## 2. Actors and Permissions

| Actor | Description | Permission / Responsibility |
| ----- | ----------- | --------------------------- |
| Member | Registered library user | Receive email notifications related to reservations, due dates, overdue items, and fines. |
| Librarian | Library staff | May receive operational notifications if source features request them. |
| Admin | System administrator | May receive account or operational notifications if source features request them. |
| Source Feature | Internal system feature | Creates requests through a requester bound to an approved source: `FE02`, `FE07`, `FE08`, `FE09`, or `SYSTEM`. |
| Internal Source Requester | In-process FE10 boundary | Binds an allowlisted source at construction, rejects source override, applies the same policy as HTTP, and is not a login role. |
| Notification Worker | System component | Sends queued non-sensitive notifications and records attempts. |
| Email Provider | External or mocked service | Delivers email messages. |
| Guest | Unauthenticated visitor | No notification management permission, but may receive account verification/reset emails. |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE10-001: The source feature has determined that a notification should be sent.
- PRE-FE10-002: The recipient user exists, or the source feature provides a safe guest email for account-related flows.
- PRE-FE10-003: The notification type and template key form an approved canonical pair.
- PRE-FE10-004: The requested Phase 1 channel is `EMAIL`; in-app delivery remains future work.
- PRE-FE10-005: Email provider or mock provider configuration is available outside source code.
- PRE-FE10-006: Protected notification HTTP APIs are called by authenticated `LIBRARIAN` or `ADMIN` users, or an internal caller uses a construction-bound source requester.

---

## 4. Main Flows

### MF-FE10-001: Send Account Verification Notification

1. FE02 Authentication requests `ACCOUNT_VERIFICATION` delivery with recipient email, canonical template `ACCOUNT_VERIFICATION`, and `verificationLink` data.
2. FE10 validates the recipient, email channel, canonical type/template pair, and required template data.
3. FE10 confirms that it is not responsible for generating or validating the verification token.
4. FE10 renders and sends the message synchronously through the mock provider using raw data only in memory.
5. FE10 persists a redacted summary, status, and attempt, but never the raw link or rendered sensitive title/body.
6. FE10 returns `201 { notificationId, status }`, where status is `SENT` or `FAILED`.

### MF-FE10-002: Send Password Reset Notification

1. FE02 Authentication requests `PASSWORD_RESET` delivery with recipient email, canonical template `PASSWORD_RESET`, and `resetLink` data.
2. FE10 validates the recipient, email channel, canonical type/template pair, and required template data.
3. FE10 confirms that FE02 owns token generation and validation.
4. FE10 renders and sends the message synchronously through the mock provider using raw data only in memory.
5. FE10 persists a redacted summary, status, and attempt, but never the raw link or rendered sensitive title/body.
6. FE10 returns `201 { notificationId, status }`, where status is `SENT` or `FAILED`.

### MF-FE10-003: Send Book Reservation Notification

1. FE08 Reservation Management requests reservation notification delivery when a reservation status changes or a reserved book becomes available.
2. FE10 validates the recipient, email channel, canonical `RESERVATION_AVAILABLE -> RESERVATION_READY` pair, and reservation template data.
3. FE10 confirms that FE08 owns reservation queue and availability decisions.
4. FE10 recursively rejects secret-like queued keys and creates a non-sensitive `PENDING` notification with rendered content.
5. The notification worker processes the queued record through the mock provider.
6. FE10 records `SENT` or `FAILED` plus the delivery attempt without changing FE08 state.

### MF-FE10-004: Send Due Date Or Fine Notification

1. FE07 Borrowing Management or FE09 Fine Management requests due date, overdue, or fine notification delivery.
2. FE10 validates the recipient, email channel, canonical type/template pair, and due date/fine template data.
3. FE10 confirms that FE07 owns due date/borrowing decisions and FE09 owns fine calculation.
4. FE10 recursively rejects secret-like queued keys and creates a non-sensitive `PENDING` notification with rendered content.
5. The notification worker processes the queued record through the mock provider.
6. FE10 records `SENT` or `FAILED` plus the delivery attempt without changing source state. FE09 caller integration remains deferred until an actual caller exists.

---

## 5. Alternative Flows

### AF-FE10-001: Missing Or Invalid Recipient

1. Source feature submits a notification request without valid recipient data.
2. FE10 returns a safe 4xx validation error.
3. FE10 creates no notification record or delivery attempt.

### AF-FE10-002: Duplicate Source Event

1. Source feature sends the same idempotency key more than once.
2. FE10 returns `200 { notificationId, status }` for the existing record, regardless of its status, instead of creating or sending a duplicate.

### AF-FE10-003: Template Missing Or Inactive

1. Source feature requests a template key that does not exist or is inactive.
2. FE10 returns a safe 4xx validation/template error before creating a notification record.
3. FE10 does not persist invalid request content; persisted `FAILED` is reserved for accepted requests whose provider delivery fails.
4. A type/template mismatch is always rejected before delivery or queued persistence; it is never converted by a caller flag or alias.

### AF-FE10-004: Email Provider Unavailable

1. FE10 or the notification worker attempts to send an email.
2. The provider is unavailable or returns an error.
3. FE10 records `FAILED`, an attempt, and a safe failure reason; no secret or provider detail is persisted or returned.
4. A failed non-sensitive queued notification may be retried manually on the same record. A failed sensitive authentication notification must be reissued by its source and returns `409 REISSUE_REQUIRED` from the retry endpoint.
5. The original business transaction in the source feature remains completed.

### AF-FE10-005: Optional Notification Disabled

1. Source feature requests an optional notification.
2. Recipient preference disables that type/channel.
3. FE10 records the request as `SKIPPED` or does not create it, depending on approved policy.

---

## 6. Business Rules

Use these stable IDs for tasks and tests.

- BR-FE10-001: FE10 must not decide source business events; source features decide when a notification is needed.
- BR-FE10-002: FE10 must validate recipient, `EMAIL` channel, integer source reference, required template data, and the server-enforced canonical type/template pair before creating or sending a notification. The canonical pairs are `ACCOUNT_VERIFICATION -> ACCOUNT_VERIFICATION`, `PASSWORD_RESET -> PASSWORD_RESET`, `RESERVATION_AVAILABLE -> RESERVATION_READY`, `DUE_DATE_REMINDER -> DUE_DATE_REMINDER`, `OVERDUE_NOTICE -> OVERDUE_NOTICE`, `FINE_NOTICE -> FINE_NOTICE`, and `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`.
- BR-FE10-003: FE10 must not generate or validate authentication or password reset tokens.
- BR-FE10-004: FE10 must not persist, log, audit, or return raw tokens, OTP values, passwords, verification/reset links, rendered sensitive authentication title/body, provider credentials/details, or internal stack traces. Queued non-sensitive `templateData` and stored `safePayload` must recursively traverse objects/arrays and normalize keys by lowercasing and removing `_`, `-`, and whitespace. A queued request is rejected when a normalized key contains `token`, `otp`, `password`, `verificationlink`, or `resetlink`; the same keys are redacted from `safePayload`.
- BR-FE10-005: A notification request should include a source feature and source entity reference when available; `sourceEntityId`, when supplied in Phase 1, must be an integer. Internal requesters bind `sourceFeature` at construction and callers cannot override it.
- BR-FE10-006: One idempotency key maps to one notification record across all statuses. A duplicate request must replay the existing record summary and must not create or send a duplicate.
- BR-FE10-007: FE10 must support the seven approved Phase 1 type/template pairs, including `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`; no undocumented alias or pair is supported.
- BR-FE10-008: Failed notification delivery must be recorded with safe failure reason and attempt count. Only failed non-sensitive queued notifications may be manually retried on the same record; failed sensitive authentication delivery requires a new source event.
- BR-FE10-009: Email provider credentials must be stored outside source code.
- BR-FE10-010: Notification templates must define required variables, enforce the canonical pair, and must not render missing required data silently. `ACCOUNT_VERIFICATION` requires `verificationLink`; `PASSWORD_RESET` requires `resetLink`.
- BR-FE10-011: Notification HTTP endpoints must remain protected from public/member callers and allow only `LIBRARIAN`/`ADMIN`. In-process source requests use `createSourceNotificationRequester(sourceFeature)` with allowlist `FE02`, `FE07`, `FE08`, `FE09`, `SYSTEM`; `SYSTEM` is not a login role.
- BR-FE10-012: Notification delivery failure must not automatically roll back the source business transaction.
- BR-FE10-013: Notification status changes and source-request audits must be traceable with safe metadata. Source audits use `userId: null` plus bound source metadata; retry preserves the same notification ID, idempotency key, and attempt history.

---

## 7. Functional Requirements

- FR-FE10-001: When FE02 requests canonical account verification delivery with valid `verificationLink` data, FE10 shall synchronously render/send through the mock provider, persist only a redacted `SENT` or `FAILED` summary plus attempt, and return `201 { notificationId, status }` without generating or validating the token.
- FR-FE10-002: When FE02 requests canonical password reset delivery with valid `resetLink` data, FE10 shall synchronously render/send through the mock provider, persist only a redacted `SENT` or `FAILED` summary plus attempt, and return `201 { notificationId, status }` without exposing raw or rendered sensitive content.
- FR-FE10-003: When FE08 requests canonical book reservation delivery with valid non-sensitive data, FE10 shall create a queued `PENDING` notification without deciding reservation eligibility; the worker later processes it.
- FR-FE10-004: When FE07 or a future FE09 caller requests canonical due date, overdue, or fine delivery with valid non-sensitive data, FE10 shall create a queued `PENDING` notification without calculating fines or changing borrowing state. FE09 caller integration remains deferred.
- FR-FE10-005: When required fields, integer source reference, canonical mapping, recipient, or queued-payload safety checks fail, FE10 shall reject the request safely before persisting queued content.
- FR-FE10-006: When a notification is delivered successfully, the system shall update delivery status and timestamp.
- FR-FE10-007: When delivery fails, FE10 shall record attempt details and a safe reason without rolling back source flow. Manual retry changes only a failed non-sensitive queued record from `FAILED` to `PENDING`; sensitive retry returns safe `409 REISSUE_REQUIRED`.
- FR-FE10-008: When a duplicate source event is submitted with the same idempotency key, FE10 shall return `200 { notificationId, status }` for the existing record across any status and shall not create or send a duplicate.
- FR-FE10-009: FE10 shall recognize all seven canonical pairs, including `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`. A missing/inactive template, missing required variable, mismatched pair, or recursively detected secret-like queued key shall return a safe 4xx before persistence without leaking the submitted value.

---

## 8. Acceptance Criteria

- AC-FE10-001: Given canonical account verification data, when FE10 sends synchronously, then it returns `201 { notificationId, status }` with `SENT` or `FAILED` and persists no raw link or rendered sensitive content.
- AC-FE10-002: Given canonical password reset data, when FE10 sends synchronously, then it returns `201 { notificationId, status }` with `SENT` or `FAILED` and persists no raw link or rendered sensitive content.
- AC-FE10-003: Given FE08 submits canonical reservation-ready data, when FE10 accepts it, then one non-sensitive `PENDING` notification is queued without FE10 deciding reservation eligibility.
- AC-FE10-004: Given FE07 submits canonical due-date data, when FE10 accepts it, then one non-sensitive `PENDING` reminder is queued without FE10 changing borrowing state.
- AC-FE10-005: Given a future FE09 caller submits canonical overdue/fine data, when FE10 accepts it, then one non-sensitive `PENDING` notification is queued without FE10 calculating fines; current FE09 caller integration remains deferred.
- AC-FE10-006: Given each of the seven canonical pairs, including `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`, when FE10 validates a complete request, then mapping validation succeeds. Given a missing recipient/variable, string source ID, mismatched pair, unknown template, or queued nested key such as `OTP`, `reset_token`, or `verification-link`, validation returns a safe 4xx before any request content is persisted.
- AC-FE10-007: Given FE02 provides a verification/reset link, when FE10 sends it, then raw values and rendered sensitive title/body do not appear in persistence, logs, audits, or HTTP responses.
- AC-FE10-008: Given an idempotency key already exists in any status, when FE10 receives the duplicate request, then it returns `200 { notificationId, status }` for that record and performs no duplicate send.
- AC-FE10-009: Given provider delivery failure, when FE10 records it, then the source flow remains completed; a failed non-sensitive queued record may retry on the same history, while sensitive retry returns safe `409 REISSUE_REQUIRED`.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
| -- | ----------------- | ------------------------ |
| EC-FE10-001 | Recipient user does not exist | Return safe `404`; create no notification or attempt. |
| EC-FE10-002 | Recipient has no email for email channel | Return safe `400`; create no notification or attempt. |
| EC-FE10-003 | Invalid email format | Return safe `400` before sending; create no notification or attempt. |
| EC-FE10-004 | Unsupported type or mismatched/non-canonical template key, including `EMAIL_VERIFY` or `DUE_OR_FINE_NOTICE` | Return safe `400`; caller flags cannot bypass the canonical map; create no notification or attempt. |
| EC-FE10-005 | Unsupported channel | Return safe `400`; create no notification or attempt. |
| EC-FE10-006 | Missing, unknown, or inactive template key | Return safe `400`; create no notification or attempt. |
| EC-FE10-007 | Missing required template variable | Return safe `400`; create no notification or attempt. |
| EC-FE10-008 | Duplicate idempotency key in any status | Return `200 { notificationId, status }` for the existing record without duplicate send. |
| EC-FE10-009 | Email provider timeout | Record `FAILED` plus an attempt and safe reason; sensitive content remains provider-memory-only. |
| EC-FE10-010 | Template contains unsafe HTML/script | Reject template or sanitize rendered output. |
| EC-FE10-011 | Source transaction completed but delivery failed or requester throws | Keep source transaction completed; record/catch FE10 failure safely. Only failed non-sensitive queued records may retry to `PENDING`. |
| EC-FE10-012 | Provider returns sensitive details, caller overrides bound source, or sensitive retry is requested | Store only a sanitized summary; reject source override; sensitive retry returns `409 REISSUE_REQUIRED`. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Users | Stores recipient identity and email address. |
| NotificationTemplates | Stores approved email templates and required variables. |
| Notifications | Stores source references, status, safe payload, non-sensitive rendered content, and redacted sensitive summaries. |
| NotificationAttempts | Stores delivery attempts and safe failure details. |
| UserNotificationPreferences | Reserved for future optional/in-app preference work; not used by the hardening slice. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| notificationId | integer | Yes | Primary key. |
| userId | integer | No | Required for in-app and member-specific notifications. |
| recipientEmail | string | No | Required for guest/account email flows if no user ID is available. |
| type | enum | Yes | Values: `ACCOUNT_VERIFICATION`, `PASSWORD_RESET`, `RESERVATION_AVAILABLE`, `DUE_DATE_REMINDER`, `OVERDUE_NOTICE`, `FINE_NOTICE`, `GENERAL_SYSTEM`. |
| channel | enum | Yes | Phase 1 hardening accepts `EMAIL`; `IN_APP` remains future work. |
| templateKey | string | Yes | Must be active and match the canonical type/template map. |
| title | string | No | Rendered title for non-sensitive queued notifications only; sensitive auth title is not persisted. |
| body | string | No | Rendered body for non-sensitive queued notifications only; sensitive auth body is not persisted. Must not contain unsafe script. |
| safePayload | object | No | Recursively redacted safe metadata only; normalized secret-like keys are removed/redacted using the same rule as queued request validation. |
| status | enum | Yes | Values: `PENDING`, `SENT`, `DELIVERED`, `FAILED`, `SKIPPED`. Sensitive create ends `SENT`/`FAILED`; non-sensitive create starts `PENDING`; retry permits only non-sensitive `FAILED -> PENDING`. |
| sourceFeature | string | No | Bound internal values: `FE02`, `FE07`, `FE08`, `FE09`, `SYSTEM`; HTTP values must be validated. |
| sourceEntityType | string | No | Example: `Reservation`, `Fine`, `BorrowDetail`. |
| sourceEntityId | integer | No | Phase 1 reference to source record; strings are rejected. |
| idempotencyKey | string | No | Maps one source event to one notification record across all statuses. Retry reuses the same key. |
| createdAt | datetime | Yes | Notification creation timestamp. |
| sentAt | datetime | No | Email send timestamp or in-app delivery timestamp. |
| attemptNo | integer | No | Delivery attempt count. |
| errorMessage | string | No | Sanitized failure reason only; no provider detail or submitted sensitive value. |

### 10.3 Canonical Type And Template Map

| Notification type | Required template key | Delivery mode |
| --- | --- | --- |
| `ACCOUNT_VERIFICATION` | `ACCOUNT_VERIFICATION` with `{{verificationLink}}` | Synchronous sensitive |
| `PASSWORD_RESET` | `PASSWORD_RESET` with `{{resetLink}}` | Synchronous sensitive |
| `RESERVATION_AVAILABLE` | `RESERVATION_READY` | Queued non-sensitive |
| `DUE_DATE_REMINDER` | `DUE_DATE_REMINDER` | Queued non-sensitive |
| `OVERDUE_NOTICE` | `OVERDUE_NOTICE` | Queued non-sensitive |
| `FINE_NOTICE` | `FINE_NOTICE` | Queued non-sensitive |
| `GENERAL_SYSTEM` | `MEMBERSHIP_RESULT` | Queued non-sensitive |

Every other pair is rejected. `EMAIL_VERIFY` and `DUE_OR_FINE_NOTICE` are not aliases.

---

## 11. API / Interface Contract

> Endpoint names are proposed for RESTful API. Final contract may stay in this SPEC.md unless the team reintroduces a dedicated API contract document.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| POST | `/api/notifications/requests` | `LIBRARIAN`, `ADMIN` | `{ type, channel, userId?, recipientEmail?, templateKey, templateData, sourceFeature?, sourceEntityType?, sourceEntityId?, idempotencyKey? }` | New request: `201 { notificationId, status }`; idempotent replay: `200 { notificationId, status }` | Role-protected HTTP boundary. Never returns a full notification, content, array, or `safePayload`. |
| POST | `/api/notifications/process-pending` | `LIBRARIAN`, `ADMIN` | `{ limit?: number }` | `200 { processed, failed }` | Processes only non-sensitive `PENDING` records; not public. |
| POST | `/api/notifications/{id}/retry` | `LIBRARIAN`, `ADMIN` | None | Success: `200 { notificationId, status }`; conflict: safe `409` | Only failed non-sensitive queued records return to `PENDING`. Sensitive auth returns `409 { code: "REISSUE_REQUIRED", message: "Create a new notification from the source event." }`. |
| In-process | `createSourceNotificationRequester(sourceFeature)` | `FE02`, `FE07`, `FE08`, `FE09`, `SYSTEM` | Same notification request without caller-controlled `sourceFeature` | Same minimal summary semantics | Construction-bound allowlist; applies the same validation, mapping, security, idempotency, and delivery rules as HTTP. Source audit uses `userId: null`. |

Validation and template errors use safe 4xx bodies. Invalid retry states use safe `409` bodies. No response includes rendered content, raw input secrets, provider details, or internal stack traces.

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE10-SEC-001: All notification APIs must validate input on the server.
- NFR-FE10-SEC-002: Protected APIs must enforce role-based access on the server.
- NFR-FE10-SEC-003: Email provider credentials must not be hardcoded or committed.
- NFR-FE10-SEC-004: FE10 must not persist, log, audit, or return raw tokens, OTPs, passwords, reset/verification links, rendered sensitive authentication content, provider credentials/details, or internal stack traces.
- NFR-FE10-SEC-005: Template rendering must escape or sanitize unsafe HTML/script content.
- NFR-FE10-SEC-006: HTTP notification endpoints must require `LIBRARIAN`/`ADMIN`; in-process requests must use the fixed bound-source allowlist and reject source override.

### 12.2 Reliability

- NFR-FE10-REL-001: Failed sends must record attempt number, timestamp, and safe failure reason.
- NFR-FE10-REL-002: Source business transactions must not be rolled back only because notification delivery failed.
- NFR-FE10-REL-003: Duplicate source events must replay one record across all statuses. Manual non-sensitive retry must preserve notification ID, idempotency key, and attempt history.

### 12.3 Performance

- NFR-FE10-PERF-001: Creating a queued non-sensitive notification should return within 500ms p95 in normal local/dev conditions. Synchronous sensitive authentication delivery is exempt from this queue-only target and is bounded by mock-provider latency.
- NFR-FE10-PERF-002: Notification lookup by status, type, source feature, and created date should use indexed fields where practical.

### 12.4 Logging and Audit

- NFR-FE10-LOG-001: Every failed delivery attempt must be logged in `NotificationAttempts`.
- NFR-FE10-LOG-002: Logs and audits must store safe summaries, not secrets, rendered sensitive authentication content, or raw provider responses. Internal source audits use `userId: null` plus bound source metadata.

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
- Plaintext or encrypted queued sensitive authentication content.
- FE02 facade migration and FE02 OTP-versus-link or `EMAIL_VERIFY` reconciliation.
- A new FE09 notification caller or integration.
- Expiry metadata, retry UI, or unrelated frontend/backend refactors.

---

## 14. Dependencies

| Dependency | Type | Notes |
| ---------- | ---- | ----- |
| FE02 Authentication | Internal | Owns tokens/auth and the unresolved OTP/link plus `EMAIL_VERIFY` drift. FE10 follows the approved link-template contract but does not migrate FE02 in this slice. |
| FE07 Borrowing Management | Internal | May request due date reminders and borrow/return status notifications. |
| FE08 Reservation Management | Internal | Requests reservation available notifications. |
| FE09 Fine Management | Internal | Approved/allowlisted for overdue and fine notifications, but no current caller integration is implemented in this slice. |
| SQL Server database | Technical | Stores notification records, templates, attempts, and preferences. |
| Email provider or mock provider | Technical | Sends email notifications. |
| Scheduler/worker | Technical | Uses the `SYSTEM` internal source boundary and processes only non-sensitive `PENDING` notifications. |

---

## 15. Resolved Questions

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE10-001 | Phase 1 required channel is email with mock provider. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-002 | In-app notification is optional/future work in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-003 | Required templates: verification, password reset, due reminder, overdue notice, fine notice, reservation ready, membership result. | Review packet 2026-06-10; G1/G7 approval 2026-07-13 | APPROVED |
| Q-FE10-004 | Store notification send attempts and status. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-005 | Retry manually only for failed non-sensitive queued records on the same record/history; sensitive auth requires source reissue and returns `REISSUE_REQUIRED`. | G5/G6 approval 2026-07-13 | APPROVED |
| Q-FE10-006 | Notification failure must not block source business flow. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-007 | System/Scheduler may trigger through a requester bound to `SYSTEM`; internal sources are allowlisted and are not login roles. | G3 approval 2026-07-13 | APPROVED |

---

## 15.1 Approved Design Decisions

The initial decisions were approved in the Phase 1 review packet on 2026-06-10. G1-G7 were approved by Nhat on 2026-07-13 and supersede any older ambiguous wording.

| Decision | Approved Answer | Status |
| -------- | --------------- | ------ |
| Q-FE10-001 | Phase 1 required channel is email with mock provider. | APPROVED |
| Q-FE10-002 | In-app notification is optional/future work in Phase 1. | APPROVED |
| Q-FE10-003 | Required templates: verification, password reset, due reminder, overdue notice, fine notice, reservation ready, membership result. | APPROVED |
| Q-FE10-004 | Store notification send attempts and status. | APPROVED |
| Q-FE10-005 | Retry only failed non-sensitive queued records; sensitive auth requires source reissue. | APPROVED |
| Q-FE10-006 | Notification failure must not block source business flow. | APPROVED |
| Q-FE10-007 | System/Scheduler uses the bound internal requester and is not a login role. | APPROVED |
| G1 | Sensitive auth sends synchronously without persisted rendered content; non-sensitive delivery remains queued with recursive normalized secret-key protection and matching `safePayload` redaction. | APPROVED 2026-07-13 |
| G2 | Create/replay/process/retry return only the approved minimal DTOs. | APPROVED 2026-07-13 |
| G3 | `createSourceNotificationRequester(sourceFeature)` binds one source from `FE02`, `FE07`, `FE08`, `FE09`, `SYSTEM`; HTTP remains `LIBRARIAN`/`ADMIN`. | APPROVED 2026-07-13 |
| G4 | `sourceEntityId` is integer-only in Phase 1. | APPROVED 2026-07-13 |
| G5 | Manual retry is protected and applies only to failed non-sensitive queued records; sensitive retry returns `REISSUE_REQUIRED`. | APPROVED 2026-07-13 |
| G6 | One record exists per idempotency key across all statuses; retry reuses the same history. | APPROVED 2026-07-13 |
| G7 | Canonical auth keys are `ACCOUNT_VERIFICATION` and `PASSWORD_RESET`; no `EMAIL_VERIFY` alias; FE02 reconciliation remains owner-deferred. | APPROVED 2026-07-13 |

---

## 16. Traceability Matrix

| AC ID | Acceptance Criterion | Related FR | Related BR | Assignment Test | Hardening Task | Status |
| ----- | -------------------- | ---------- | ---------- | --------------- | -------------- | ------ |
| AC-FE10-001 | Account verification sends synchronously with minimal status and no persisted sensitive content | FR-FE10-001 | BR-FE10-001 to BR-FE10-004, BR-FE10-007 to BR-FE10-010 | FT46 | FE10-H02, FE10-H03, FE10-H04 | Approved for implementation |
| AC-FE10-002 | Password reset sends synchronously with minimal status and no persisted sensitive content | FR-FE10-002 | BR-FE10-003, BR-FE10-004, BR-FE10-007 to BR-FE10-010 | FT47 | FE10-H02, FE10-H03, FE10-H04 | Approved for implementation |
| AC-FE10-003 | FE08 reservation notification is queued without FE10 deciding eligibility | FR-FE10-003 | BR-FE10-001, BR-FE10-002, BR-FE10-007, BR-FE10-012 | FT48 | FE10-H02, FE10-H05, FE10-H07 | Approved for implementation |
| AC-FE10-004 | FE07 due-date notification is queued without changing borrowing state | FR-FE10-004 | BR-FE10-001, BR-FE10-002, BR-FE10-007, BR-FE10-012 | FT49 | FE10-H02, FE10-H05, FE10-H06 | Approved for implementation |
| AC-FE10-005 | FE09 overdue/fine contract is approved without FE10 calculating fines; caller integration is deferred | FR-FE10-004 | BR-FE10-001, BR-FE10-002, BR-FE10-007, BR-FE10-012 | FT49 | FE10-H01, FE10-H02, FE10-H05 | Approved; integration deferred |
| AC-FE10-006 | All seven canonical pairs validate; invalid recipient, variable, source ID, mapping, template, or recursively detected queued secret returns safe 4xx before persistence | FR-FE10-005, FR-FE10-009 | BR-FE10-002, BR-FE10-004, BR-FE10-007, BR-FE10-010 | FT46 to FT49 | FE10-H02, FE10-H04 | Approved for implementation |
| AC-FE10-007 | Verification/reset links and rendered sensitive content never cross persistence/log/audit/HTTP boundaries | FR-FE10-001, FR-FE10-002 | BR-FE10-003, BR-FE10-004, BR-FE10-008, BR-FE10-013 | FT46, FT47 | FE10-H03, FE10-H04 | Approved for implementation |
| AC-FE10-008 | Duplicate key replays the same record across all statuses with minimal `200` DTO | FR-FE10-008 | BR-FE10-006, BR-FE10-013 | FT46 to FT49 | FE10-H08 | Approved for implementation |
| AC-FE10-009 | Failure is safe/non-blocking; non-sensitive retry reuses history and sensitive retry requires reissue | FR-FE10-007 | BR-FE10-004, BR-FE10-008, BR-FE10-012, BR-FE10-013 | FT46 to FT49 | FE10-H03, FE10-H08 | Approved for implementation |

### Coverage Summary

- Total AC: 9 (AC-FE10-001 to AC-FE10-009) - all mapped.
- Total FR: 9 (FR-FE10-001 to FR-FE10-009) - all mapped.
- Total BR: 13 (BR-FE10-001 to BR-FE10-013) - all mapped.
- Assignment tests remain FT46 to FT49. Hardening implementation is traced to FE10-H02 through FE10-H08 and validated by FE10-H09.


### External Assignment Traceability (Excel UC IDs)

| Assignment UC ID | Excel Use Case | Related Main Flow / Requirement | Related Test |
| ---------------- | -------------- | ------------------------------- | ------------ |
| UC45 | Send Account Verification Notification | MF-FE10-001; FR-FE10-001 | FT46 |
| UC46 | Send Password Reset Notification | MF-FE10-002; FR-FE10-002 | FT47 |
| UC47 | Send Book Reservation Notification | MF-FE10-003; FR-FE10-003 | FT48 |
| UC48 | Send Due Date Or Fine Notification | MF-FE10-004; FR-FE10-004 | FT49 |

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

Hardening contract checklist (approved by Nhat on 2026-07-13):

- [x] Canonical type/template pairs are exact and caller flags cannot bypass them.
- [x] Sensitive auth delivery is synchronous and rendered sensitive content remains provider-memory-only.
- [x] Queued non-sensitive data uses recursive object/array inspection, normalized secret-key rejection, and matching `safePayload` redaction.
- [x] Create/replay/process/retry use only minimal DTOs.
- [x] `sourceEntityId` is integer-only.
- [x] Bound source requester allowlist and HTTP `LIBRARIAN`/`ADMIN` boundary are explicit.
- [x] Idempotency applies across all statuses.
- [x] Manual retry preserves non-sensitive history and sensitive retry returns `REISSUE_REQUIRED`.
- [x] FE02 reconciliation/migration and FE09 caller integration are explicitly deferred.
- [x] G1-G7 trace to the revised BR/FR/AC/API/NFR contract and FE10-H01 to FE10-H09.
