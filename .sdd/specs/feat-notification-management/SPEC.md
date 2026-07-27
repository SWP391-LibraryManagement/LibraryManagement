# SPEC.md - FE10 Notification Management

# Version: 0.5.0

# Status: V0.5.0 WRITTEN SPEC APPROVED - IMPLEMENTATION PLAN REVIEW PENDING

# Owner: Nhat

# Last Updated: 2026-07-27

# Feature ID: FE10

# Feature folder: `.sdd/specs/feat-notification-management/`

> Current delivery status (2026-07-20): `COMPLETE` for the approved Phase 1 scope.
> `TASKS.md` and `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`
> are authoritative for current implementation state. Older `Not Started`,
> `PARTIAL`, `READY FOR REVIEW`, or pending-review labels retained below are
> historical planning/evidence snapshots, not the current delivery state.

> Source of truth for FE10 Notification Management. The OTP, account-setup, and membership-result boundary revision is approved as the 2026-07-17 baseline.
>
> Initial Phase 1 decisions were approved on 2026-06-10. G1-G7 were approved on 2026-07-13. G8-G10 and ADR-004 were approved by Nhat on 2026-07-15 and supersede the deferred OTP/link contract.
>
> ADR-005 adds canonical FE11 account-setup delivery. Nhat approved the combined FE10 baseline on 2026-07-17; the approved implementation, human acceptance, PR integration, and exact post-merge `main` CI are complete for the Phase 1 scope.
>
> The 2026-07-23 delivery-safety remediation adds the approved durable
> `PROCESSING` state so claim ownership commits before provider I/O and an
> uncertain delivery is never sent automatically a second time.
>
> Revision v0.4.4 separates trusted template-definition validation from runtime
> value escaping: unsafe stored markup is rejected before rendering,
> persistence, or delivery; runtime values remain escaped/sanitized.
> Nhat approved this written revision on 2026-07-27. Approval authorizes
> PLAN/TASKS preparation only; implementation remains unclaimed until
> RED-GREEN evidence and acceptance gates are completed.
>
> Revision v0.4.5 restores three previously approved delivery obligations:
> existing databases receive the canonical `ACCOUNT_SETUP` template through an
> idempotent migration; successful sensitive sends retain only the provider
> message ID in attempt history; and an opt-in SYSTEM worker processes queued
> non-sensitive `PENDING` records while the backend is awake. The protected
> manual endpoint and manual-only retry policy remain unchanged. On the staging
> F1 plan this schedule is explicitly best-effort because Always On is disabled.
> The user approved the design and written contract on 2026-07-27.
>
> Revision v0.5.0 adds the personal notification inbox contract. The user
> approved the section-by-section design and the consolidated written SPEC on
> 2026-07-27. That approval authorizes PLAN/TASKS preparation only; product
> implementation remains `NOT_STARTED` until the implementation plan is
> reviewed and the repository's implementation gates are opened.
>
> Revision v0.5.0 proposes the user-approved personal notification inbox
> expansion documented in
> `docs/superpowers/specs/2026-07-27-fe10-notification-inbox-expansion-design.md`.
> Every authenticated account may list and mark read only its own non-sensitive
> notifications. Email delivery state remains independent, sensitive
> authentication/setup records remain excluded, and navigation is derived from
> a server allowlist. The design is approved; this written SPEC requires a fresh
> human review before PLAN/TASKS or implementation may proceed.

---

## 1. Feature Overview

### 1.1 Feature Name

Notification Management

### 1.2 Business Context

The Library Management System must notify users about the approved account-verification, password-reset, account-setup, reservation-ready, due-date, overdue, fine, and membership-result events. Without reliable notifications, members may miss important deadlines, librarians may receive more manual questions, and account recovery flows may be blocked.

Notification Management provides a central place to create, send, store, and track these messages while keeping business decisions in the source features that create notification requests.

### 1.3 Goal / Outcome

The system shall:

- Accept notification requests from approved internal features.
- Send sensitive authentication OTP email synchronously through the configured provider adapter, with injected mocks in tests, without persisting rendered sensitive content.
- Queue non-sensitive email notifications for worker processing.
- Track Phase 1 delivery with `PENDING`, `PROCESSING`, `SENT`, and `FAILED`; compatibility values `DELIVERED`, `SKIPPED`, and `CANCELLED` have no Phase 1 transition.
- Keep non-sensitive content and all delivery attempts traceable without persisting, logging, auditing, or returning secrets or rendered sensitive authentication content.
- Support the eight canonical Phase 1 type/template pairs for verification, password reset, account setup, reservation readiness, due-date reminders, overdue notices, fine notices, and membership results.
- Present each eligible non-sensitive notification in a personal authenticated
  web inbox without creating another notification or delivery channel.
- Track personal read state independently from email delivery state and provide
  safe allowlisted navigation to the related business screen.

### 1.4 Scope Level

- [x] Full Spec - core business logic, high risk, must be correct from the beginning
- [ ] Standard Spec - normal feature with business rules and validations
- [ ] Light Spec - simple UI, documentation, or low-risk feature

---

## 2. Actors and Permissions

| Actor | Description | Permission / Responsibility |
| ----- | ----------- | --------------------------- |
| Member | Registered library user | Receive email notifications and list/count/mark read only the member's own eligible non-sensitive inbox records. |
| Librarian | Library staff | May receive operational notifications and list/count/mark read only the librarian's own eligible non-sensitive inbox records. |
| Admin | System administrator | May receive account or operational notifications and list/count/mark read only the admin's own eligible non-sensitive inbox records; no global notification-log permission is added. |
| Source Feature | Internal system feature | Creates requests through a requester bound to `FE02`, `FE07`, `FE08`, `FE09`, `FE11`, or `SYSTEM`. FE02 owns verification/reset; FE11 owns account setup. |
| Internal Source Requester | In-process FE10 boundary | Binds an allowlisted source at construction, rejects source override, applies source/type ownership policy, and is not a login role. |
| Notification Worker | System component | Sends queued non-sensitive notifications and records attempts. |
| Email Provider | Configured adapter or injected mock | Delivers email messages in deployed environments and deterministic tests. |
| Guest | Unauthenticated visitor | No inbox permission, but may receive account verification/reset emails. |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE10-001: The source feature has determined that a notification is required and submits a request through an approved FE10 boundary.
- PRE-FE10-002: The recipient user exists, or the source feature provides a safe guest email for account-related flows.
- PRE-FE10-003: The notification type and template key form an approved canonical pair.
- PRE-FE10-004: The requested Phase 1 delivery channel is `EMAIL`. The web
  inbox is a presentation surface for the same eligible non-sensitive record,
  not an `IN_APP` channel or a duplicate delivery record.
- PRE-FE10-005: Configured email-provider settings are available outside source code, or an injected mock provider is supplied for tests.
- PRE-FE10-006: Protected notification HTTP APIs are called by authenticated `LIBRARIAN` or `ADMIN` users for non-sensitive notification types, or an internal caller uses a construction-bound source requester. Verification/reset require FE02 ownership; account setup requires FE11 ownership.
- PRE-FE10-007: Personal inbox APIs are called by an authenticated `MEMBER`,
  `LIBRARIAN`, or `ADMIN` and derive ownership only from the access token's
  `UserId`.

---

## 4. Main Flows

### MF-FE10-001: Send Account Verification Notification

1. FE02 creates a six-digit verification OTP, stores only its hash in `AuthTokens`, and receives the persisted `tokenId`.
2. FE02 requests `ACCOUNT_VERIFICATION` delivery through the requester bound to `FE02` with recipient email, canonical template `ACCOUNT_VERIFICATION`, `otp`, `expiresInMinutes`, `sourceEntityType: AuthToken`, `sourceEntityId: tokenId`, and an idempotency key derived from the token ID.
3. FE10 validates the recipient, email channel, canonical type/template pair, source ownership, integer source reference, idempotency key, and required OTP template data.
4. FE10 confirms that it is not responsible for generating or validating the OTP.
5. FE10 persists safe source metadata in `PROCESSING` before provider I/O, but never the OTP or rendered sensitive title/body.
6. FE10 renders and sends the message synchronously through the configured provider adapter using raw data only in memory, then records `SENT` or `FAILED` and the attempt.
7. FE10 returns `{ notificationId, status }`, where status is `SENT` or `FAILED`.

### MF-FE10-002: Send Password Reset Notification

1. FE02 creates a six-digit password-reset OTP, stores only its hash in `AuthTokens`, and receives the persisted `tokenId`.
2. FE02 requests `PASSWORD_RESET` delivery through the requester bound to `FE02` with recipient email, canonical template `PASSWORD_RESET`, `otp`, `expiresInMinutes`, `sourceEntityType: AuthToken`, `sourceEntityId: tokenId`, and an idempotency key derived from the token ID.
3. FE10 validates the recipient, email channel, canonical type/template pair, source ownership, integer source reference, idempotency key, and required OTP template data.
4. FE10 confirms that FE02 owns OTP generation and validation.
5. FE10 persists safe source metadata in `PROCESSING` before provider I/O, but never the OTP or rendered sensitive title/body.
6. FE10 renders and sends the message synchronously through the configured provider adapter using raw data only in memory, then records `SENT` or `FAILED` and the attempt.
7. FE10 returns `{ notificationId, status }`, where status is `SENT` or `FAILED`.

### MF-FE10-003: Send Book Reservation Notification

1. FE08 Reservation Management requests reservation notification delivery when a reservation status changes or a reserved book becomes available.
2. FE10 validates the recipient, email channel, canonical `RESERVATION_AVAILABLE -> RESERVATION_READY` pair, and reservation template data.
3. FE10 confirms that FE08 owns reservation queue and availability decisions.
4. FE10 recursively rejects secret-like queued keys and creates a non-sensitive `PENDING` notification with rendered content.
5. The notification worker atomically claims the record as `PROCESSING`, commits that claim, and only then calls the configured provider adapter.
6. FE10 records `SENT` or `FAILED` plus the delivery attempt without changing FE08 state.

### MF-FE10-004: Send Due Date Or Fine Notification

1. FE07 Borrowing Management or FE09 Fine Management requests due date, overdue, or fine notification delivery.
2. FE10 validates the recipient, email channel, canonical type/template pair, and due date/fine template data.
3. FE10 confirms that FE07 owns due date/borrowing decisions and FE09 owns fine calculation.
4. FE10 recursively rejects secret-like queued keys and creates a non-sensitive `PENDING` notification with rendered content.
5. The notification worker atomically claims the record as `PROCESSING`, commits that claim, and only then calls the configured provider adapter.
6. FE10 records `SENT` or `FAILED` plus the delivery attempt without changing source state. FE09 caller integration remains deferred until an actual caller exists.

### MF-FE10-005: Send Admin-Created Account Setup Notification

1. FE11 creates a cryptographically secure `ACCOUNT_SETUP` token, stores only its hash in `AuthTokens`, and receives the persisted token ID.
2. FE11 requests `ACCOUNT_SETUP` delivery through the requester bound to `FE11` with recipient email, canonical template `ACCOUNT_SETUP`, `setupLink`, `expiresInHours`, `sourceEntityType: AuthToken`, `sourceEntityId: tokenId`, and idempotency key `FE11:ACCOUNT_SETUP:<tokenId>`.
3. FE10 validates FE11 ownership, the canonical pair, required variables, integer source ID, and idempotency.
4. FE10 persists only safe source metadata in `PROCESSING` before provider I/O while the setup link remains request/provider-memory-only.
5. FE10 renders and sends synchronously through the configured provider adapter, then records `SENT` or `FAILED`, the generic failure summary when applicable, and attempt data.
6. FE10 returns `{ notificationId, status }` without returning the setup token, link, rendered title/body, or provider detail.

### MF-FE10-006: Queue Membership Result Notification

1. FE04 commits an approval or rejection decision and requests `GENERAL_SYSTEM -> MEMBERSHIP_RESULT` through the requester bound to `FE04`.
2. FE10 validates FE04 ownership, recipient, integer application source reference, canonical pair, required non-sensitive template data, and idempotency key.
3. FE10 creates exactly one `PENDING` notification for a new idempotency key and returns `{ notificationId, status }`.
4. The worker later commits `PROCESSING` before provider I/O, then records `SENT` or `FAILED` and a safe delivery attempt; delivery failure never changes the committed FE04 decision.

### MF-FE10-007: View Personal Notification Inbox

1. An authenticated `MEMBER`, `LIBRARIAN`, or `ADMIN` opens the header bell or
   `/notifications`.
2. FE10 derives the current `UserId` from the authenticated actor and validates
   pagination, read-state, and optional eligible-type filters.
3. The repository applies ownership, the non-sensitive eligibility allowlist,
   filters, newest-first ordering, and pagination in SQL.
4. FE10 returns only the safe inbox DTO and a backend-derived allowlisted
   `actionPath`; it returns no recipient email, safe payload, source metadata,
   idempotency key, provider detail, attempt, or sensitive content.

### MF-FE10-008: Mark Personal Notifications Read

1. The authenticated actor selects one inbox item or chooses to mark all as
   read.
2. FE10 updates only unread, eligible records whose `UserId` equals the current
   actor's `UserId`, using a server timestamp.
3. Mark-one returns the safe item summary; mark-all returns the number of rows
   changed.
4. Repeating either operation is idempotent and never changes email delivery
   status, attempts, source state, or idempotency metadata.

---

## 5. Alternative Flows

### AF-FE10-001: Missing Or Invalid Recipient

1. Source feature submits a notification request without valid recipient data.
2. FE10 returns a safe 4xx validation error.
3. FE10 creates no notification record or delivery attempt.

### AF-FE10-002: Duplicate Source Event

1. Source feature sends the same idempotency key more than once.
2. FE10 returns `200 { notificationId, status }` for the existing record, regardless of its status, instead of creating or sending a duplicate.

### AF-FE10-003: Template Missing, Inactive, Or Unsafe

1. Source feature requests a template key that does not exist, is inactive, or whose stored title/body contains unsafe executable markup.
2. FE10 returns a safe 4xx validation/template error before rendering or creating a notification record.
3. FE10 does not persist invalid request content; persisted `FAILED` is reserved for accepted requests whose provider delivery fails.
4. A type/template mismatch is always rejected before delivery or queued persistence; it is never converted by a caller flag or alias.
5. FE10 does not sanitize an unsafe stored template definition into an accepted template. Runtime values inserted into an otherwise safe definition remain escaped or sanitized.

### AF-FE10-004: Email Provider Unavailable

1. FE10 or the notification worker attempts to send an email.
2. The provider is unavailable or returns an error.
3. FE10 records `FAILED`, an attempt, and a safe failure reason when the terminal transition commits; no secret or provider detail is persisted or returned.
4. A failed non-sensitive queued notification may be retried manually on the same record. A failed sensitive authentication notification must be reissued by its source and returns `409 REISSUE_REQUIRED` from the retry endpoint.
5. The original business transaction in the source feature remains completed.
6. If provider I/O completed but the terminal transition cannot be persisted, the record remains `PROCESSING`; automatic processing and manual retry must not send it again, and manual retry returns `409 DELIVERY_STATE_UNCERTAIN`.

### AF-FE10-005: Optional Notification Disabled

1. Optional notification preferences and notification suppression are out of scope for Phase 1.
2. FE10 does not evaluate `UserNotificationPreferences` and does not create a `SKIPPED` record in Phase 1.

### AF-FE10-006: Sensitive Authentication Type Submitted Through The Wrong Boundary

1. A staff HTTP caller submits `ACCOUNT_VERIFICATION`, `PASSWORD_RESET`, or `ACCOUNT_SETUP`; a non-FE02 requester submits a FE02-owned type; or a non-FE11 requester submits `ACCOUNT_SETUP`.
2. FE10 returns `403 SENSITIVE_NOTIFICATION_INTERNAL_ONLY` with message `Sensitive authentication notifications must be requested internally.` before template rendering, persistence, or provider delivery.
3. No notification record or delivery attempt is created.

### AF-FE10-007: Inbox Ownership Or Sensitivity Violation

1. An authenticated actor requests a missing notification, another user's
   notification, or a sensitive authentication/setup notification.
2. FE10 returns the same safe `404` response for every case and reveals no
   existence, recipient, type, content, or source metadata.
3. No read state or delivery state changes.

### AF-FE10-008: Read Update Unavailable During Navigation

1. The frontend cannot persist a read update because the API or network is
   unavailable.
2. The notification remains unread and the shell shows a safe non-blocking
   warning.
3. The user may still navigate to the already allowlisted business screen; the
   failed read update never blocks the source feature.

---

## 6. Business Rules

Use these stable IDs for tasks and tests.

- BR-FE10-001: FE10 must not decide source business events; source features decide when a notification is needed.
- BR-FE10-002: FE10 must validate recipient, `EMAIL` channel, integer source reference, required template data, and the server-enforced canonical type/template pair before creating or sending a notification. The canonical pairs are `ACCOUNT_VERIFICATION -> ACCOUNT_VERIFICATION`, `PASSWORD_RESET -> PASSWORD_RESET`, `ACCOUNT_SETUP -> ACCOUNT_SETUP`, `RESERVATION_AVAILABLE -> RESERVATION_READY`, `DUE_DATE_REMINDER -> DUE_DATE_REMINDER`, `OVERDUE_NOTICE -> OVERDUE_NOTICE`, `FINE_NOTICE -> FINE_NOTICE`, and `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`.
- BR-FE10-003: FE10 must not generate or validate authentication OTPs or legacy verification/reset tokens.
- BR-FE10-004: FE10 must not persist, log, audit, or return raw tokens, OTP values, passwords, verification/reset/setup links, rendered sensitive authentication title/body, provider credentials/details, or internal stack traces. Queued non-sensitive `templateData` and stored `safePayload` must recursively traverse objects/arrays and normalize keys by lowercasing and removing `_`, `-`, and whitespace. A queued request is rejected when a normalized key contains `token`, `otp`, `password`, `verificationlink`, `resetlink`, or `setuplink`; the same keys are redacted from `safePayload`.
- BR-FE10-005: Every in-process source request shall include construction-bound `sourceFeature`, `sourceEntityType`, integer `sourceEntityId`, and an idempotency key; callers cannot override bound metadata. HTTP requests use the separate protected contract and cannot provide `sourceFeature`.
- BR-FE10-006: One idempotency key maps to one notification record across all statuses. A duplicate request must replay the existing record summary and must not create or send a duplicate.
- BR-FE10-007: FE10 must support the eight approved Phase 1 type/template pairs, including `ACCOUNT_SETUP -> ACCOUNT_SETUP` and `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`; no undocumented alias or pair is supported.
- BR-FE10-008: Failed notification delivery must be recorded with safe failure reason and attempt count. Only failed non-sensitive queued notifications may be manually retried on the same record; failed sensitive authentication delivery requires a new source event. A `PROCESSING` record has uncertain provider outcome and must not be reclaimed or retried automatically or manually.
- BR-FE10-009: Email provider credentials must be stored outside source code.
- BR-FE10-010: Notification templates must define required variables, enforce the canonical pair, and must not render missing required data silently. Phase 1 definitions are plain text plus `{{variable}}` tokens. Before rendering any request, FE10 must reject a stored title/body containing raw HTML tag syntax (including `<script>`), inline event-handler attributes, or `javascript:` URLs instead of sanitizing that definition into an accepted template. Runtime template values inserted into an otherwise safe definition remain escaped or sanitized. `ACCOUNT_VERIFICATION` and `PASSWORD_RESET` each require `otp` and `expiresInMinutes`; `ACCOUNT_SETUP` requires `setupLink` and `expiresInHours`.
- BR-FE10-011: Notification HTTP endpoints must remain protected from public/member callers and allow only `LIBRARIAN`/`ADMIN` for non-sensitive types. HTTP callers cannot provide `sourceFeature` and must receive safe `403 SENSITIVE_NOTIFICATION_INTERNAL_ONLY` for `ACCOUNT_VERIFICATION`, `PASSWORD_RESET`, or `ACCOUNT_SETUP`. In-process source requests use `createSourceNotificationRequester(sourceFeature)` with allowlist `FE02`, `FE04`, `FE07`, `FE08`, `FE09`, `FE11`, `SYSTEM`; only FE02 may submit verification/reset, only FE04 may submit `MEMBERSHIP_RESULT`, and only FE11 may submit account setup; `SYSTEM` is not a login role.
- BR-FE10-012: Notification delivery failure must not automatically roll back the source business transaction.
- BR-FE10-013: Notification status changes and source-request audits must be traceable with safe metadata. Source audits use `userId: null` plus bound source metadata; retry preserves the same notification ID, idempotency key, and attempt history. Claiming must atomically commit `PENDING -> PROCESSING` before provider I/O, and terminal transitions must be guarded from `PROCESSING`.
- A successful provider result persists only its normalized
  `providerMessageId` in `NotificationAttempts`; no full provider response,
  rendered sensitive content, token, OTP, setup link, or recipient content is
  copied into audit, logs, HTTP, or notification content.
- Automatic SYSTEM processing is construction-bound and writes aggregate audit
  metadata with `UserId = NULL`; it never fabricates an Admin or Librarian.
- BR-FE10-014: Every authenticated `MEMBER`, `LIBRARIAN`, and `ADMIN` may list,
  count, and mark read only eligible notifications whose `UserId` matches the
  authenticated actor. Guests have no inbox access and Admin/Librarian receive
  no global log permission from this revision.
- BR-FE10-015: Inbox eligibility requires a persisted non-null `UserId` and a
  non-sensitive canonical type. `ACCOUNT_VERIFICATION`, `PASSWORD_RESET`, and
  `ACCOUNT_SETUP` must be excluded at the database query boundary from inbox
  list, unread count, preview, mark-one, and mark-all operations regardless of
  stored status or `ReadAt`. Email-only rows without `UserId` have no personal
  inbox owner and are also excluded.
- BR-FE10-016: Inbox read state is `ReadAt IS NULL` for unread and a server
  timestamp for read. Updating `ReadAt` must not alter delivery `Status`,
  `SentAt`, attempts, source state, or idempotency data and must be idempotent.
- BR-FE10-017: FE10 shall derive `actionPath` only from the canonical persisted
  type/template/source combination and a fixed relative-path allowlist. No
  source caller, template, payload, database content field, or frontend input
  may supply or override a navigation URL.
- BR-FE10-018: Personal notification history is retained and paginated. This
  revision exposes no user delete, archive, retention-cleanup, or global
  staff-log operation.
- BR-FE10-019: The additive migration shall mark inbox-eligible rows that
  existed before deployment as read with `ReadAt = CreatedAt`; only eligible
  notifications created after the migration start unread.
- BR-FE10-020: Personal list and unread-count queries shall apply `UserId`,
  sensitivity eligibility, filters, deterministic newest-first ordering, and
  pagination/counting in SQL before materializing rows.

---

## 7. Functional Requirements

- FR-FE10-001: When the requester bound to `FE02` submits canonical account-verification OTP data with `otp`, `expiresInMinutes`, and an `AuthToken` source reference, FE10 shall persist only safe source metadata as `PROCESSING` before provider I/O, synchronously render/send through the configured provider adapter, record a redacted `SENT` or `FAILED` summary and attempt when the terminal transition commits, and return `{ notificationId, status }` without generating, validating, persisting, logging, auditing, or returning the OTP.
- FR-FE10-002: When the requester bound to `FE02` submits canonical password-reset OTP data with `otp`, `expiresInMinutes`, and an `AuthToken` source reference, FE10 shall persist only safe source metadata as `PROCESSING` before provider I/O, synchronously render/send through the configured provider adapter, record a redacted `SENT` or `FAILED` summary and attempt when the terminal transition commits, and return `{ notificationId, status }` without exposing raw or rendered sensitive content.
- FR-FE10-003: When FE04 requests canonical membership-result delivery or FE08 requests canonical reservation-ready delivery with valid non-sensitive data, FE10 shall create one queued `PENDING` notification without deciding the source feature's business outcome; the worker later processes it.
- FR-FE10-004: When FE07 or a future FE09 caller requests canonical due date, overdue, or fine delivery with valid non-sensitive data, FE10 shall create a queued `PENDING` notification without calculating fines or changing borrowing state. FE09 caller integration remains deferred.
- FR-FE10-005: When required fields, integer source reference, canonical mapping, recipient, source/type ownership, HTTP source override, queued-payload safety checks, or stored template-definition safety checks fail, FE10 shall reject the request safely before rendering, persistence, or delivery.
- FR-FE10-006: Before calling the configured provider, FE10 shall commit the accepted request or worker claim as `PROCESSING`. When the provider accepts the send, FE10 shall guard `PROCESSING -> SENT`, set `sentAt` to the server timestamp, and record the successful attempt; Phase 1 never transitions the record to `DELIVERED`.
- FR-FE10-007: When delivery fails, FE10 shall guard `PROCESSING -> FAILED` and record attempt details plus a safe reason without rolling back source flow. Manual retry changes only a failed non-sensitive queued record from `FAILED` to `PENDING`; sensitive retry returns safe `409 REISSUE_REQUIRED`; retry of `PROCESSING` returns safe `409 DELIVERY_STATE_UNCERTAIN`.
- FR-FE10-008: When a duplicate source event is submitted with the same idempotency key, FE10 shall return `200 { notificationId, status }` for the existing record across any status and shall not create or send a duplicate.
- FR-FE10-009: FE10 shall recognize all eight canonical pairs, including `ACCOUNT_SETUP -> ACCOUNT_SETUP` and `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`. A missing/inactive template, unsafe stored template definition, missing required sensitive variable, mismatched pair, unauthorized sensitive source, HTTP source override, or recursively detected secret-like queued key shall return a safe 4xx before rendering or persistence without leaking the submitted value.
- FR-FE10-010: When the requester bound to `FE11` submits canonical account-setup data with `setupLink`, `expiresInHours`, and an `AuthToken` source reference, FE10 shall persist safe source metadata as `PROCESSING` before provider I/O, synchronously render/send, record safe terminal status/attempt metadata when the transition commits, and return `{ notificationId, status }` without exposing raw or rendered setup content.
- FR-FE10-011: When an authenticated `MEMBER`, `LIBRARIAN`, or `ADMIN` requests
  personal notifications, FE10 shall return only that actor's eligible
  non-sensitive rows using validated `page`, `limit`, `readState`, and optional
  type filters, deterministic newest-first ordering, and the approved safe DTO.
- FR-FE10-012: When an authenticated actor requests the unread count, FE10 shall
  count only that actor's eligible rows with `ReadAt IS NULL` and return
  `{ unreadCount }`.
- FR-FE10-013: When an authenticated actor marks one owned eligible
  notification read, FE10 shall set `ReadAt` once and return its safe summary;
  a missing, sensitive, or unowned ID shall return an indistinguishable `404`,
  and replay shall be idempotent.
- FR-FE10-014: When an authenticated actor marks all personal notifications
  read, FE10 shall set one server timestamp only on that actor's eligible unread
  rows and return `{ updated }`; replay shall return `updated: 0`.
- FR-FE10-015: When FE10 projects an eligible notification, it shall derive a
  relative `actionPath` from the fixed canonical allowlist or return null; no
  caller-controlled or persisted content URL is accepted.
- FR-FE10-016: The authenticated application shell shall show a bell with a
  `99+`-capped unread badge, five-item unread preview, and `/notifications`
  link. The page shall provide all/unread/read filters, 20-item pagination,
  mark-all, loading/empty/error states, and non-blocking navigation when a read
  mutation fails. The count refreshes after authentication, window focus, read
  mutations, and every 60 seconds while the shell is mounted.

---

## 8. Acceptance Criteria

- AC-FE10-001: Given the requester bound to `FE02` submits canonical account-verification OTP data, when FE10 sends synchronously, then it returns `{ notificationId, status }` with `SENT` or `FAILED`, persists safe `AuthToken` source metadata, and persists no OTP or rendered sensitive content.
- AC-FE10-002: Given the requester bound to `FE02` submits canonical password-reset OTP data, when FE10 sends synchronously, then it returns `{ notificationId, status }` with `SENT` or `FAILED`, persists safe `AuthToken` source metadata, and persists no OTP or rendered sensitive content.
- AC-FE10-003: Given FE04 submits canonical membership-result data or FE08 submits canonical reservation-ready data, when FE10 accepts it, then exactly one non-sensitive `PENDING` notification is queued without FE10 deciding or changing the source business outcome.
- AC-FE10-004: Given FE07 submits canonical due-date data, when FE10 accepts it, then one non-sensitive `PENDING` reminder is queued without FE10 changing borrowing state.
- AC-FE10-005: Given a future FE09 caller submits canonical overdue/fine data, when FE10 accepts it, then one non-sensitive `PENDING` notification is queued without FE10 calculating fines; current FE09 caller integration remains deferred.
- AC-FE10-006: Given each of the eight canonical pairs, including `ACCOUNT_SETUP -> ACCOUNT_SETUP` and `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`, when FE10 validates a complete request from an authorized boundary and a safe stored template definition, then mapping validation succeeds and runtime values are escaped/sanitized. Given a missing recipient/variable, string source ID, mismatched pair, unknown/inactive template, unsafe stored template definition, HTTP source override, unauthorized sensitive source, or queued nested secret key, validation returns a safe 4xx before rendering, persistence, attempt creation, or delivery.
- AC-FE10-007: Given FE02 provides an OTP through its bound requester, when FE10 sends it, then the OTP and rendered sensitive title/body do not appear in persistence, logs, audits, or HTTP responses.
- AC-FE10-008: Given an idempotency key already exists in any status, when FE10 receives the duplicate request, then it returns `200 { notificationId, status }` for that record and performs no duplicate send.
- AC-FE10-009: Given provider delivery failure, when FE10 records it, then the source flow remains completed; a failed non-sensitive queued record may retry on the same history, while sensitive retry returns safe `409 REISSUE_REQUIRED`. Given provider I/O finishes but terminal persistence fails, the row remains `PROCESSING`, duplicate replay performs no send, and retry returns safe `409 DELIVERY_STATE_UNCERTAIN`.
- AC-FE10-010: Given the requester bound to `FE11` submits canonical account-setup data, when FE10 sends synchronously, then it returns safe `SENT`/`FAILED` summary, persists safe `AuthToken` metadata, and persists or returns no setup token/link/rendered content.
- AC-FE10-011: Given any authenticated login role has eligible notifications,
  when it lists its inbox with valid filters, then only its own non-sensitive
  rows are returned newest first with safe fields and correct pagination; Guest
  receives `401`.
- AC-FE10-012: Given unread eligible rows for multiple users plus sensitive
  rows, when one user requests the unread count, then only that user's eligible
  unread rows are counted.
- AC-FE10-013: Given an owned eligible notification, when the user marks it
  read twice, then the same notification remains read with no email/status/
  attempt mutation. Missing, sensitive, and cross-user IDs all return the same
  safe `404` and create no side effect.
- AC-FE10-014: Given multiple eligible unread rows for one user and rows for
  another user, when mark-all runs, then only the current user's eligible rows
  receive one server read timestamp; replay returns `updated: 0`.
- AC-FE10-015: Given every eligible canonical type, when FE10 returns an inbox
  item, then `actionPath` equals the approved relative route. Unknown or
  incompatible metadata returns null, and no submitted URL can override it.
- AC-FE10-016: Given the authenticated shell and inbox page, when notifications
  load and read actions occur, then badge, preview, filters, pagination,
  mark-all, empty/error states, and navigation match the API. A read-update
  failure leaves the item unread, shows safe feedback, and does not block the
  business route.

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
| EC-FE10-010 | Stored template title/body contains raw HTML tag syntax (including `<script>`), an inline event-handler attribute, or a `javascript:` URL | Reject the template definition before rendering, notification/attempt persistence, or provider delivery with a safe validation error; do not silently sanitize and accept the definition. Runtime values in a safe plain-text-plus-variables template remain escaped/sanitized. |
| EC-FE10-011 | Source transaction completed but delivery failed or requester throws | Keep source transaction completed; record/catch FE10 failure safely. Only failed non-sensitive queued records may retry to `PENDING`. |
| EC-FE10-012 | Provider returns sensitive details, caller overrides bound source, or sensitive retry is requested | Store only a sanitized summary; reject source override; sensitive retry returns `409 REISSUE_REQUIRED`. |
| EC-FE10-013 | Staff HTTP or a requester without ownership submits a sensitive authentication notification | Return safe `403 SENSITIVE_NOTIFICATION_INTERNAL_ONLY`; FE02 exclusively owns verification/reset and FE11 exclusively owns account setup. |
| EC-FE10-014 | FE02 resend issues a new OTP token | Use the new `AuthTokens.TokenId` in a new idempotency key; do not replay the previous OTP notification. |
| EC-FE10-015 | HTTP caller supplies `sourceFeature` | Return `400 SOURCE_FEATURE_HTTP_FORBIDDEN` with message `Notification source cannot be supplied through HTTP.`; create no notification or attempt. |
| EC-FE10-016 | FE11 resend creates a new setup token | Use the new `AuthTokens.TokenId` and `FE11:ACCOUNT_SETUP:<tokenId>` key; never replay the prior setup link. |
| EC-FE10-017 | Provider outcome exists but terminal status/attempt persistence fails | Keep the committed row `PROCESSING`; do not auto-reclaim or resend it; duplicate replay returns the same summary and manual retry returns `409 DELIVERY_STATE_UNCERTAIN`. |
| EC-FE10-018 | Guest calls a personal inbox endpoint | Return safe `401`; expose no count or item metadata. |
| EC-FE10-019 | Authenticated user requests another user's notification ID | Return the same safe `404` used for a missing ID; do not reveal ownership or mutate `ReadAt`. |
| EC-FE10-020 | Authenticated user requests a sensitive authentication/setup notification ID | Return the same safe `404`; sensitive content and existence remain undisclosed. |
| EC-FE10-021 | Invalid page, limit, read-state, or inbox-ineligible type filter | Return safe `400`; execute no unbounded fallback query. |
| EC-FE10-022 | Mark-one or mark-all is replayed | Preserve the first read timestamp; return the same safe read item or `updated: 0`; create no delivery attempt. |
| EC-FE10-023 | Persisted metadata has no approved navigation mapping | Return `actionPath: null`; never construct a path from title, body, payload, or arbitrary input. |
| EC-FE10-024 | Read mutation fails while the user opens the related workflow | Keep the record unread, show safe non-blocking feedback, and allow navigation to the already allowlisted route. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Users | Stores recipient identity and email address. |
| NotificationTemplates | Stores approved email templates and required variables. A stored title/body must pass template-definition safety validation before every render. |
| Notifications | Stores source references, delivery status, safe payload, non-sensitive rendered content, redacted sensitive summaries, and nullable personal read state. |
| NotificationAttempts | Stores delivery attempts and safe failure details. |
| UserNotificationPreferences | Reserved for future preference work; not used by the inbox expansion. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| notificationId | integer | Yes | Primary key. |
| userId | integer | No | Required for in-app and member-specific notifications. |
| recipientEmail | string | Conditional | Required for email delivery and persisted as `Notifications.RecipientEmail NVARCHAR(255) NOT NULL` to match FE02/FE11 email width. |
| type | enum | Yes | Values: `ACCOUNT_VERIFICATION`, `PASSWORD_RESET`, `ACCOUNT_SETUP`, `RESERVATION_AVAILABLE`, `DUE_DATE_REMINDER`, `OVERDUE_NOTICE`, `FINE_NOTICE`, `GENERAL_SYSTEM`. |
| channel | enum | Yes | Delivery remains `EMAIL`. The web inbox projects the same eligible record and does not add an `IN_APP` channel. |
| templateKey | string | Yes | Must be active and match the canonical type/template map. |
| title | string | No | Rendered title for non-sensitive queued notifications only; sensitive auth title is not persisted. |
| body | string | No | Rendered body for non-sensitive queued notifications only; sensitive auth body is not persisted. Must not contain unsafe script. |
| safePayload | object | No | Recursively redacted safe metadata only; normalized secret-like keys are removed/redacted using the same rule as queued request validation. Sensitive authentication records contain no OTP and may retain only a redaction marker. |
| status | enum | Yes | Phase 1 lifecycle uses `PENDING`, `PROCESSING`, `SENT`, and `FAILED`. Sensitive create persists `PROCESSING` before provider I/O; non-sensitive create starts `PENDING` and worker claim commits `PROCESSING`; terminal transitions are guarded from `PROCESSING`; retry permits only non-sensitive `FAILED -> PENDING`. `DELIVERED`, `SKIPPED`, and `CANCELLED` are retained only as database compatibility values and have no Phase 1 transition. |
| sourceFeature | string | Required for in-process requests | Bound internal values: `FE02`, `FE04`, `FE07`, `FE08`, `FE09`, `FE11`, `SYSTEM`; HTTP callers cannot provide this field. Verification/reset use FE02; membership result uses FE04; account setup uses FE11. |
| sourceEntityType | string | Required for in-process requests | Example: `AuthToken`, `Reservation`, `Fine`, `BorrowDetail`. Sensitive authentication requests require `AuthToken`. |
| sourceEntityId | integer | Required for in-process requests | Positive Phase 1 reference to source record; missing values and strings are rejected. Sensitive authentication requests use the persisted `AuthTokens.TokenId`. |
| idempotencyKey | string | No | Maps one source event to one notification record across all statuses. FE02 derives sensitive keys from type plus `AuthTokens.TokenId`, never from the OTP. Retry reuses the same key. |
| createdAt | datetime | Yes | Notification creation timestamp. |
| sentAt | datetime | No | Server timestamp set when the Phase 1 email provider accepts the send and the guarded terminal transition commits; null while `PENDING`/`PROCESSING` and after a failed attempt. |
| readAt | datetime | No | Nullable personal inbox state for rows with non-null `userId` and an eligible non-sensitive type. New eligible notifications start null; the first successful read mutation sets one server timestamp. Existing eligible rows are backfilled to `createdAt`; sensitive and email-only userless rows are never inbox-visible. |
| attemptNo | integer | No | Delivery attempt count. |
| errorMessage | string | No | Sanitized failure reason only; no provider detail or submitted sensitive value. |

### 10.3 Canonical Type And Template Map

| Notification type | Required template key | Delivery mode |
| --- | --- | --- |
| `ACCOUNT_VERIFICATION` | `ACCOUNT_VERIFICATION` with `{{otp}}` and `{{expiresInMinutes}}` | Synchronous sensitive, FE02 requester only |
| `PASSWORD_RESET` | `PASSWORD_RESET` with `{{otp}}` and `{{expiresInMinutes}}` | Synchronous sensitive, FE02 requester only |
| `ACCOUNT_SETUP` | `ACCOUNT_SETUP` with `{{setupLink}}` and `{{expiresInHours}}` | Synchronous sensitive, FE11 requester only |
| `RESERVATION_AVAILABLE` | `RESERVATION_READY` | Queued non-sensitive |
| `DUE_DATE_REMINDER` | `DUE_DATE_REMINDER` | Queued non-sensitive |
| `OVERDUE_NOTICE` | `OVERDUE_NOTICE` | Queued non-sensitive |
| `FINE_NOTICE` | `FINE_NOTICE` | Queued non-sensitive |
| `GENERAL_SYSTEM` | `MEMBERSHIP_RESULT` | Queued non-sensitive |

Every other pair is rejected. `EMAIL_VERIFY` and `DUE_OR_FINE_NOTICE` are not aliases.

### 10.4 Phase 1 Status Lifecycle

- Non-sensitive notification: `PENDING -> PROCESSING -> SENT` or `PENDING -> PROCESSING -> FAILED`.
- Failed non-sensitive notification: `FAILED -> PENDING` only through the protected manual retry endpoint, then the normal claim lifecycle applies.
- Sensitive authentication/setup notification: `[*] -> PROCESSING -> SENT` or `[*] -> PROCESSING -> FAILED`; retry always requires a new source event and new idempotency key.
- A row left `PROCESSING` after provider I/O has uncertain delivery state. It is excluded from worker claims and every retry path so FE10 cannot duplicate delivery.
- `DELIVERED`, `SKIPPED`, and `CANCELLED` are not created or transitioned by Phase 1 flows. Their future use requires a reviewed SPEC revision.

---

## 11. API / Interface Contract

> The endpoints and request/response shapes below are the canonical Phase 1 contract for this feature.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| POST | `/api/notifications/requests` | `LIBRARIAN`, `ADMIN` | `{ type, channel, userId?, recipientEmail?, templateKey, templateData, sourceEntityType?, sourceEntityId?, idempotencyKey? }` | New request: `201 { notificationId, status }`; idempotent replay: `200 { notificationId, status }`; sensitive type: safe `403` | Role-protected non-sensitive HTTP boundary. `sourceFeature` is not accepted. All sensitive auth types return `SENSITIVE_NOTIFICATION_INTERNAL_ONLY`. Never returns full content or `safePayload`. |
| POST | `/api/notifications/process-pending` | `LIBRARIAN`, `ADMIN` | `{ limit?: number }` | `200 { processed, failed }` | Processes only non-sensitive `PENDING` records; not public. |
| POST | `/api/notifications/{id}/retry` | `LIBRARIAN`, `ADMIN` | None | Success: `200 { notificationId, status }`; conflict: safe `409` | Only failed non-sensitive queued records return to `PENDING`. Sensitive auth returns `409 { code: "REISSUE_REQUIRED", message: "Create a new notification from the source event." }`. |
| In-process | `createSourceNotificationRequester(sourceFeature)` | `FE02`, `FE04`, `FE07`, `FE08`, `FE09`, `FE11`, `SYSTEM` | Same notification request without caller-controlled `sourceFeature` | Same minimal summary semantics | Construction-bound ownership: FE02 verification/reset, FE04 membership result, FE11 account setup. Source audit uses `userId: null`. |
| GET | `/api/notifications/mine` | Authenticated `MEMBER`, `LIBRARIAN`, `ADMIN` | Query: `page?`, `limit?`, `readState?=all|unread|read`, eligible `type?` | `200 { notifications: SafeInboxItem[], pagination }` | Own eligible non-sensitive rows only; default page 1/limit 20, maximum 100; newest first. |
| GET | `/api/notifications/mine/unread-count` | Authenticated `MEMBER`, `LIBRARIAN`, `ADMIN` | None | `200 { unreadCount }` | Counts only own eligible rows with `ReadAt IS NULL`. |
| PATCH | `/api/notifications/{id}/read` | Authenticated `MEMBER`, `LIBRARIAN`, `ADMIN` | None | `200 SafeInboxItem`; missing/sensitive/unowned: safe `404` | Idempotent; cannot change delivery state or attempts. |
| PATCH | `/api/notifications/mine/read-all` | Authenticated `MEMBER`, `LIBRARIAN`, `ADMIN` | None | `200 { updated }` | One server timestamp for own eligible unread rows; replay returns zero. |

Validation and template errors use safe 4xx bodies. Invalid retry states use safe `409` bodies. No response includes rendered content, raw input secrets, provider details, or internal stack traces.

The sensitive-boundary error is `403 { error: { code: "SENSITIVE_NOTIFICATION_INTERNAL_ONLY", message: "Sensitive authentication notifications must be requested internally." } }`. HTTP `sourceFeature` override is `400 { error: { code: "SOURCE_FEATURE_HTTP_FORBIDDEN", message: "Notification source cannot be supplied through HTTP." } }`.

`SafeInboxItem` contains only `notificationId`, canonical `type`, non-sensitive
`title`, non-sensitive `message`, `createdAt`, `readAt`, and a backend-derived
relative `actionPath`. It excludes recipient email, `SafePayload`, template
data, idempotency key, source metadata, provider identifiers/errors, and
attempt history.

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE10-SEC-001: All notification APIs must validate input on the server.
- NFR-FE10-SEC-002: Protected APIs must enforce role-based access on the server.
- NFR-FE10-SEC-003: Email provider credentials must not be hardcoded or committed.
- NFR-FE10-SEC-004: FE10 must not persist, log, audit, or return raw tokens, OTPs, passwords, reset/verification/setup links, rendered sensitive authentication content, provider credentials/details, or internal stack traces.
- NFR-FE10-SEC-005: Template-definition validation and runtime-value rendering are separate security gates. FE10 must reject raw HTML tag syntax, inline event-handler attributes, and `javascript:` URLs in a stored template title/body before rendering, persistence, or delivery; it must escape or sanitize runtime values inserted into an otherwise safe plain-text-plus-variables definition.
- NFR-FE10-SEC-006: HTTP notification endpoints must require `LIBRARIAN`/`ADMIN`, reject caller-controlled `sourceFeature`, and reject sensitive authentication types with safe `403`; in-process requests must use the fixed bound-source allowlist, reject source override, enforce FE02 ownership for verification/reset, and enforce FE11 ownership for account setup.
- NFR-FE10-SEC-007: Personal inbox authorization must be enforced in the
  backend repository/service query using the authenticated `UserId`; client
  role guards and hidden controls are not authorization boundaries.
- NFR-FE10-SEC-008: List, count, and read queries must exclude all sensitive
  types before materialization and use an indistinguishable `404` for missing,
  sensitive, and unowned IDs. Action paths must be relative and allowlisted.

### 12.2 Reliability

- NFR-FE10-REL-001: Failed sends must record attempt number, timestamp, and safe failure reason.
- NFR-FE10-REL-002: Source business transactions must not be rolled back only because notification delivery failed.
- NFR-FE10-REL-003: Duplicate source events must replay one record across all statuses. Manual non-sensitive retry must preserve notification ID, idempotency key, and attempt history. Provider I/O must occur only after a durable `PROCESSING` claim, and uncertain `PROCESSING` rows must never be automatically reclaimed.
- NFR-FE10-REL-004: Read mutations must be idempotent, preserve the first
  successful `ReadAt`, and remain independent of provider delivery and source
  transactions. A read failure must not block navigation to an approved source
  workflow.

### 12.3 Performance

- NFR-FE10-PERF-001: Creating a queued non-sensitive notification must return within 500 ms at p95 in the project's documented local/dev performance environment. Synchronous sensitive authentication delivery is exempt from this queue-only target and is bounded by configured-provider latency.
- NFR-FE10-PERF-002: Notification lookup must apply status, type, source-feature, and created-date filters in the database query before materializing rows; application-layer full-history filtering is not permitted.
- NFR-FE10-PERF-003: Personal list and unread-count requests shall complete
  within 500 ms at p95 in the documented local/dev performance environment
  with the approved ownership/read/date index, a default list limit of 20, and
  a maximum limit of 100.

### 12.4 Logging and Audit

- NFR-FE10-LOG-001: Every failed delivery attempt must be logged in `NotificationAttempts`.
- NFR-FE10-LOG-002: Logs and audits must store safe summaries, not secrets, rendered sensitive authentication content, or raw provider responses. Internal source audits use `userId: null` plus bound source metadata.

### 12.5 Usability

- NFR-FE10-UX-001: Notification messages must be clear, concise, and action-oriented.
- NFR-FE10-UX-002: Failure messages shown to users must be understandable and not expose technical internals.
- NFR-FE10-UX-003: The authenticated shell shall expose a keyboard-accessible
  bell, `99+` badge cap, five-item preview, explicit loading/empty/error states,
  and a full Vietnamese inbox page. Read state must not rely on color alone.

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
- Admin/librarian notification log screens.
- User deletion, archive, or retention cleanup for notification history.
- WebSocket, Server-Sent Events, service-worker push, or a separate `IN_APP`
  delivery channel.
- Caller-supplied or persisted-content-derived notification navigation URLs.
- Manual retry management screens.
- Template editor UI.
- Building a full email design editor.
- Storing real email provider credentials in the repository.
- Plaintext or encrypted queued sensitive authentication content.
- Compatibility-only FE02 `CHANGE_PASSWORD_OTP` delivery; it is outside the canonical Phase 1 FE10 contract until a separate notification type/use case, expiry, response, and retry contract is approved.
- A new FE09 notification caller or integration.
- Expiry metadata, retry UI, or unrelated frontend/backend refactors.

---

## 14. Dependencies

| Dependency | Type | Notes |
| ---------- | ---- | ----- |
| FE02 Authentication | Internal | Owns OTP/token generation and validation, then requests account-verification and password-reset OTP delivery through the requester bound to `FE02`. Legacy token acceptance and compatibility-only `CHANGE_PASSWORD_OTP` remain FE02-owned. |
| FE07 Borrowing Management | Internal | May request due date reminders and borrow/return status notifications. |
| FE08 Reservation Management | Internal | Requests reservation available notifications. |
| FE04 Membership Management | Internal | Owns `MEMBERSHIP_RESULT` source events and uses the FE04-bound requester after review commit. |
| FE09 Fine Management | Internal | Approved/allowlisted for overdue and fine notifications, but no current caller integration is implemented in this slice. |
| FE11 User & Role Management | Internal | Owns admin-created setup-token issuance/resend and requests canonical `ACCOUNT_SETUP` through the requester bound to `FE11`. |
| SQL Server database | Technical | Stores notification records, templates, attempts, and preferences. |
| Configured email provider adapter or injected mock provider | Technical | Sends email notifications; deployed environments use configured provider settings while tests inject a deterministic mock. |
| Scheduler/worker | Technical | Uses the `SYSTEM` internal source boundary and processes only non-sensitive `PENDING` notifications. |
| Authenticated application shell | Technical | Hosts the personal bell, preview, unread polling, and `/notifications` route for every login role. |
| FE04/FE07/FE08/FE09 application routes | Internal | Receive only backend-allowlisted relative navigation from eligible personal inbox items. |

---

## 15. Resolved Questions

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE10-001 | Phase 1 required channel is email through a configured provider adapter; tests use an injected mock provider. | Review packet 2026-06-10; ADR-004 approval 2026-07-15 | APPROVED |
| Q-FE10-002 | The original Phase 1 inbox deferral is superseded by v0.5.0: every authenticated role receives a personal view of existing non-sensitive notification records; delivery remains `EMAIL` and no second channel/record is created. | User-approved inbox design and written SPEC 2026-07-27 | APPROVED |
| Q-FE10-003 | Required templates: verification, password reset, account setup, due reminder, overdue notice, fine notice, reservation ready, membership result. | Review packet 2026-06-10; G1/G7 approval 2026-07-13; ADR-005 2026-07-15 | APPROVED |
| Q-FE10-004 | Store notification send attempts and status. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-005 | Retry manually only for failed non-sensitive queued records on the same record/history; sensitive auth requires source reissue and returns `REISSUE_REQUIRED`. | G5/G6 approval 2026-07-13 | APPROVED |
| Q-FE10-006 | Notification failure must not block source business flow. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-007 | System/Scheduler may trigger through a requester bound to `SYSTEM`; internal sources are allowlisted and are not login roles. | G3 approval 2026-07-13 | APPROVED |
| Q-FE10-008 | `ACCOUNT_SETUP` is FE11-owned sensitive delivery; only the FE11-bound requester may submit it and FE10 persists no setup token/link/rendered content. | ADR-005; Nhat approval 2026-07-15 | APPROVED |
| Q-FE10-009 | `MEMBERSHIP_RESULT` is FE04-owned; FE04 submits it through the FE04-bound requester after the membership decision commits. | FE04 cross-feature audit 2026-07-17 | APPROVED |
| Q-FE10-010 | Phase 1 notification statuses are `PENDING`, `PROCESSING`, `SENT`, and `FAILED`; claim/sensitive acceptance commits `PROCESSING` before provider I/O, and compatibility statuses have no Phase 1 transitions. | Notification lifecycle normalization 2026-07-17; delivery-safety remediation approved 2026-07-23 | APPROVED |
| Q-FE10-011 | FE04 uses `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`; FE08 uses `RESERVATION_AVAILABLE -> RESERVATION_READY`; callers must send both canonical fields. | Source contract normalization 2026-07-17 | APPROVED |
| Q-FE10-012 | Does FE10 sanitize an unsafe stored template definition or reject it? | Nhat, 2026-07-27 | APPROVED: reject the stored definition before rendering/persistence/delivery; continue escaping or sanitizing runtime values. |
| Q-FE10-013 | Staging uses an opt-in in-process SYSTEM worker with a 60-second default interval and batch size 20. It runs once after startup, prevents overlapping local passes, processes only non-sensitive `PENDING` rows, and stops with the HTTP server. The existing staff endpoint remains protected and `FAILED` retry remains manual. F1 sleep pauses the worker. | User approval and written design 2026-07-27 | APPROVED |
| Q-FE10-014 | All authenticated `MEMBER`, `LIBRARIAN`, and `ADMIN` accounts may use the same personal inbox and may see only rows for their own `UserId`; no global staff log is added. | User-approved inbox design and written SPEC 2026-07-27 | APPROVED |
| Q-FE10-015 | Every eligible non-sensitive notification appears through current email processing and the web inbox; source features do not choose channels. | User-approved inbox design and written SPEC 2026-07-27 | APPROVED |
| Q-FE10-016 | Clicking an item marks it read and navigates to a backend-derived allowlisted route; read failure remains non-blocking. | User-approved inbox design and written SPEC 2026-07-27 | APPROVED |
| Q-FE10-017 | Notification history is retained and paginated with no delete/archive operation. | User-approved inbox design and written SPEC 2026-07-27 | APPROVED |
| Q-FE10-018 | Existing eligible rows are backfilled as read, while only new eligible rows after migration begin unread. | User-approved inbox design and written SPEC 2026-07-27 | APPROVED |

---

## 15.1 Approved Design Decisions

The initial decisions were approved in the Phase 1 review packet on 2026-06-10. G1-G7 were approved by Nhat on 2026-07-13 and supersede any older ambiguous wording.

| Decision | Approved Answer | Status |
| -------- | --------------- | ------ |
| Q-FE10-001 | Phase 1 required channel is email through a configured provider adapter; tests use an injected mock provider. | APPROVED |
| Q-FE10-002 | v0.5.0 supersedes the inbox deferral with a personal projection of existing eligible non-sensitive records; delivery remains email-only. | APPROVED 2026-07-27 |
| Q-FE10-003 | Required templates include verification, password reset, account setup, due reminder, overdue notice, fine notice, reservation ready, and membership result. | APPROVED |
| Q-FE10-004 | Store notification send attempts and status. | APPROVED |
| Q-FE10-005 | Retry only failed non-sensitive queued records; sensitive auth requires source reissue. | APPROVED |
| Q-FE10-006 | Notification failure must not block source business flow. | APPROVED |
| Q-FE10-007 | System/Scheduler uses the bound internal requester and is not a login role. | APPROVED |
| Q-FE10-008 | Account setup is synchronous sensitive delivery owned by the FE11-bound requester. | APPROVED |
| Q-FE10-013 | The opt-in SYSTEM worker runs at startup and every 60 seconds by default, with batch size 20, local overlap prevention, lifecycle stop, unchanged staff HTTP authorization, manual-only failed retry, and an explicit F1 best-effort limitation. | APPROVED 2026-07-27 |
| G1 | Sensitive auth sends synchronously without persisted rendered content; non-sensitive delivery remains queued with recursive normalized secret-key protection and matching `safePayload` redaction. | APPROVED 2026-07-13 |
| G2 | Create/replay/process/retry return only the approved minimal DTOs. | APPROVED 2026-07-13 |
| G3 | `createSourceNotificationRequester(sourceFeature)` binds one source from `FE02`, `FE04`, `FE07`, `FE08`, `FE09`, `FE11`, `SYSTEM`; HTTP remains `LIBRARIAN`/`ADMIN`. | APPROVED 2026-07-13; extended by ADR-005 2026-07-15 and FE04 audit 2026-07-17 |
| G4 | `sourceEntityId` is integer-only in Phase 1. | APPROVED 2026-07-13 |
| G5 | Manual retry is protected and applies only to failed non-sensitive queued records; sensitive retry returns `REISSUE_REQUIRED`. | APPROVED 2026-07-13 |
| G6 | One record exists per idempotency key across all statuses; retry reuses the same history. | APPROVED 2026-07-13 |
| G7 | Canonical auth keys are `ACCOUNT_VERIFICATION` and `PASSWORD_RESET`; no `EMAIL_VERIFY` alias. Its original FE02 deferral is superseded by G8-G10. | APPROVED 2026-07-13; superseded in part 2026-07-15 |
| G8 | FE02 creates and validates six-digit OTPs; FE10 renders and delivers `otp` plus `expiresInMinutes` through the requester bound to `FE02`, with no OTP persistence or exposure. | APPROVED 2026-07-15 |
| G9 | Staff HTTP and non-FE02 source requesters cannot submit `ACCOUNT_VERIFICATION` or `PASSWORD_RESET`; HTTP cannot provide `sourceFeature`; violations return safe `403 SENSITIVE_NOTIFICATION_INTERNAL_ONLY`. | APPROVED 2026-07-15 |
| G10 | Sensitive idempotency and source traceability use `AuthTokens.TokenId`; FE02 removes duplicate verification/reset notification writes and direct sends, while failure remains non-blocking and resend creates a new source event. | APPROVED 2026-07-15 |
| G11 | FE11 owns `ACCOUNT_SETUP` source events; FE10 validates `setupLink`/`expiresInHours`, sends synchronously, stores only safe metadata/status/attempts, and requires new token/event/key for resend. | APPROVED 2026-07-15; ADR-005 |
| G12 | FE04 owns `MEMBERSHIP_RESULT` source events; FE10 accepts them only from the FE04-bound requester and keeps delivery failure non-blocking. | APPROVED 2026-07-17 |
| Q-FE10-010 | Phase 1 statuses are `PENDING`, `PROCESSING`, `SENT`, and `FAILED`; `PROCESSING` is durable before provider I/O and is never automatically reclaimed. | APPROVED; revised 2026-07-23 |
| Q-FE10-011 | FE04 uses `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`; FE08 uses `RESERVATION_AVAILABLE -> RESERVATION_READY`. | APPROVED |
| Q-FE10-012 | Unsafe stored template definitions are rejected before rendering/persistence/delivery; runtime values remain escaped/sanitized. | APPROVED 2026-07-27 |
| Q-FE10-014 | Every authenticated login role has the same own-record-only inbox boundary; no global staff log. | APPROVED 2026-07-27 |
| Q-FE10-015 | Eligible non-sensitive events appear in email processing and the web inbox without duplicate records or caller-selected channels. | APPROVED 2026-07-27 |
| Q-FE10-016 | Click marks read and follows a backend allowlisted route; read failure does not block navigation. | APPROVED 2026-07-27 |
| Q-FE10-017 | History is retained and paginated; delete/archive remains out of scope. | APPROVED 2026-07-27 |
| Q-FE10-018 | Migration backfills historical eligible rows as read. | APPROVED 2026-07-27 |

---

## 16. Traceability Matrix

| AC ID | Acceptance Criterion | Related FR | Related BR | Assignment Test | Hardening Task | Status |
| ----- | -------------------- | ---------- | ---------- | --------------- | -------------- | ------ |
| AC-FE10-001 | FE02-bound account-verification OTP sends synchronously with safe source metadata and no persisted sensitive content | FR-FE10-001 | BR-FE10-001 to BR-FE10-004, BR-FE10-005, BR-FE10-007 to BR-FE10-011 | FT46 | FE10-S01 to FE10-S04 | Approved for implementation |
| AC-FE10-002 | FE02-bound password-reset OTP sends synchronously with safe source metadata and no persisted sensitive content | FR-FE10-002 | BR-FE10-003 to BR-FE10-005, BR-FE10-007 to BR-FE10-011 | FT47 | FE10-S01 to FE10-S04 | Approved for implementation |
| AC-FE10-003 | FE04 membership-result and FE08 reservation-ready notifications are queued without FE10 changing source outcomes | FR-FE10-003 | BR-FE10-001, BR-FE10-002, BR-FE10-007, BR-FE10-011, BR-FE10-012 | FT48 plus planned FE04 requester case | FE10-H02, FE10-H05, FE10-H07, G12 | Approved for implementation |
| AC-FE10-004 | FE07 due-date notification is queued without changing borrowing state | FR-FE10-004 | BR-FE10-001, BR-FE10-002, BR-FE10-007, BR-FE10-012 | FT49 | FE10-H02, FE10-H05, FE10-H06 | Approved for implementation |
| AC-FE10-005 | FE09 overdue/fine contract is approved without FE10 calculating fines; caller integration is deferred | FR-FE10-004 | BR-FE10-001, BR-FE10-002, BR-FE10-007, BR-FE10-012 | FT49 | FE10-H01, FE10-H02, FE10-H05 | Approved; integration deferred |
| AC-FE10-006 | All eight canonical pairs and safe definitions validate; invalid recipient, variable, source ID, mapping, unsafe/missing/inactive template, source ownership, HTTP source override, or recursively detected queued secret returns safe 4xx before rendering/persistence/delivery | FR-FE10-005, FR-FE10-009 | BR-FE10-002, BR-FE10-004, BR-FE10-007, BR-FE10-010, BR-FE10-011 | FT46 to FT49 plus `notificationRoutes.test.js` unsafe stored-definition matrix | FE10-H02, FE10-H04, FE10-S02, FE10-S06, FE10-S11 | Automated evidence complete; integrated H2 approved; PR CI passed; documentation-only H3 remediation pending fresh H2 |
| AC-FE10-007 | Authentication OTPs and rendered sensitive content never cross persistence/log/audit/HTTP boundaries | FR-FE10-001, FR-FE10-002 | BR-FE10-003, BR-FE10-004, BR-FE10-008, BR-FE10-013 | FT46, FT47 | FE10-H03, FE10-H04, FE10-S03 | Approved for implementation |
| AC-FE10-008 | Duplicate key replays the same record across all statuses with minimal `200` DTO | FR-FE10-008 | BR-FE10-006, BR-FE10-013 | FT46 to FT49 | FE10-H08 | Approved for implementation |
| AC-FE10-009 | Failure is safe/non-blocking; FE02 reissues a new OTP/token event, non-sensitive `FAILED` retry reuses history, and uncertain `PROCESSING` is never resent | FR-FE10-007 | BR-FE10-004, BR-FE10-008, BR-FE10-012, BR-FE10-013 | `backend/tests/notificationRoutes.test.js` provider/transition/retry cases | FE10-H03, FE10-H08, FE10-S04, FE10-S10 | Automated evidence; H2 review pending |
| AC-FE10-010 | FE11-bound account setup sends synchronously with safe source metadata and no persisted setup credential/content | FR-FE10-010 | BR-FE10-002, BR-FE10-004 to BR-FE10-008, BR-FE10-010 to BR-FE10-013 | FT52, FT55 | FE10-S06 to FE10-S08 | Approved for implementation |
| AC-FE10-011 | Authenticated personal list returns only owned eligible non-sensitive safe DTOs with SQL filters, newest-first ordering, and pagination | FR-FE10-011 | BR-FE10-014, BR-FE10-015, BR-FE10-020 | FE10-I02, FE10-I03, FE10-I07 | Planned; implementation not started | Approved v0.5.0 |
| AC-FE10-012 | Unread count includes only the authenticated user's eligible unread records | FR-FE10-012 | BR-FE10-014 to BR-FE10-016, BR-FE10-020 | FE10-I02, FE10-I03, FE10-I07 | Planned; implementation not started | Approved v0.5.0 |
| AC-FE10-013 | Mark-one is own-record-only, sensitive-safe, idempotent, and independent of email delivery | FR-FE10-013 | BR-FE10-014 to BR-FE10-016 | FE10-I02, FE10-I03, FE10-I07 | Planned; implementation not started | Approved v0.5.0 |
| AC-FE10-014 | Mark-all changes only current-user eligible unread rows with one timestamp and replay returns zero | FR-FE10-014 | BR-FE10-014 to BR-FE10-016 | FE10-I02, FE10-I03, FE10-I06 | Planned; implementation not started | Approved v0.5.0 |
| AC-FE10-015 | Eligible items receive only the canonical backend allowlisted relative action path | FR-FE10-015 | BR-FE10-017 | FE10-I02, FE10-I03, FE10-I05 | Planned; implementation not started | Approved v0.5.0 |
| AC-FE10-016 | Bell, preview, inbox filters/pagination, read actions, safe states, and non-blocking navigation match the API contract | FR-FE10-016 | BR-FE10-014 to BR-FE10-018 | FE10-I04 to FE10-I07 | Planned; implementation not started | Approved v0.5.0 |

### Coverage Summary

- Total AC: 16 (AC-FE10-001 to AC-FE10-016) - all mapped; AC-FE10-011 to AC-FE10-016 have an approved written contract and planned FE10-I01..I08 implementation slices, but remain unimplemented.
- Total FR: 16 (FR-FE10-001 to FR-FE10-016) - all mapped.
- Total BR: 20 (BR-FE10-001 to BR-FE10-020) - all mapped.
- Assignment tests remain FT46 to FT49. Hardening implementation is traced to FE10-H02 through FE10-H08 and validated by FE10-H09.

### Supplemental BR/FR Traceability

| Requirement ID | Test Intent | Status |
| -------------- | ----------- | ------ |
| BR-FE10-009 | Provider credential source/configuration scan | Planned |
| FR-FE10-003 | FE04 membership-result and FE08 reservation-ready requests create one pending record without changing source outcomes | Planned FE04 requester and reservation queue cases |
| FR-FE10-006 | Provider acceptance sets `SENT`, `sentAt`, and a successful attempt | Planned |
| BR-FE10-011 / Q-FE10-009 | FE04-bound membership-result ownership and protected HTTP boundary | Planned |
| BR-FE10-010 / FR-FE10-005 / FR-FE10-009 | `notificationRoutes.test.js` rejects three unsafe stored-definition classes with zero render/persistence/provider calls while preserving runtime-value sanitization | Complete |
| BR-FE10-014 to BR-FE10-020 / FR-FE10-011 to FR-FE10-016 | Personal inbox ownership, sensitivity exclusion, safe projection, read state, action allowlist, migration/backfill, and UI acceptance | Planned only after written v0.5.0 review |


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
- [x] Configured provider adapter and injected test-mock strategy is confirmed.
- [x] Notification schema is reviewed with database owner.
- [x] FE02, FE07, FE08, FE09, and FE11 dependencies are checked for conflicts.
- [x] API contract is approved in this SPEC.md or copied to a dedicated API contract file if the team reintroduces one.
- [x] No secrets, provider credentials, raw tokens/OTPs, or rendered sensitive authentication content are stored/logged.
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
- [x] FE02 verification/reset OTP requester integration is approved through ADR-004; `CHANGE_PASSWORD_OTP` and FE09 caller integration remain explicitly deferred.
- [x] Staff HTTP is denied all sensitive authentication types; non-owning requesters are denied FE02 verification/reset and FE11 account setup.
- [x] G1-G7 trace to the revised BR/FR/AC/API/NFR contract and FE10-H01 to FE10-H09.

### Revision v0.4.4 Template-Safety Gate

- [x] Separate stored template-definition rejection from runtime-value escaping.
- [x] Preserve canonical pair, secret-like key, safe-payload, minimal DTO, and source-ownership rules.
- [x] Require safe rejection before rendering, notification/attempt persistence, or provider delivery.
- [x] Nhat human-reviewed and approved the written v0.4.4 SPEC on 2026-07-27; PLAN/TASKS may proceed, while implementation remains blocked pending plan approval.

### Revision v0.5.0 Personal Notification Inbox

- [x] User approved one personal inbox for every authenticated login role, with
  strict own-`UserId` ownership and no global staff log.
- [x] User approved dual presentation of each eligible non-sensitive record in
  email processing and the web inbox without a new channel or duplicate row.
- [x] User approved mark-read plus backend-allowlisted navigation, retained
  paginated history, and no user delete/archive operation.
- [x] User approved nullable `ReadAt` on `Notifications` and historical eligible
  backfill to `ReadAt = CreatedAt`.
- [x] Sensitive authentication/setup types are excluded from list, count,
  preview, mark-one, and mark-all at the query boundary.
- [x] Safe DTO fields, `401`/`400`/indistinguishable `404`, idempotent mutations,
  polling, error fallback, migration, rollout, and test obligations are explicit.
- [ ] Human has reviewed and approved the written v0.5.0 SPEC and design file.
- [ ] PLAN.md and TASKS.md have been revised from this approved written contract.
- [ ] No inbox product-code, schema, public API, or deployment completion is
  claimed by this documentation revision.
