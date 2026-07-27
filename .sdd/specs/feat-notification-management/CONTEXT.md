# CONTEXT.md - FE10 Notification Management

# Version: 0.5.0

# Status: V0.5.0 H2/PR CI/MIGRATION PASS - STAGING REMEDIATION H2 PENDING

# Owner: Nhat

# Last Updated: 2026-07-28

# Feature folder: `.sdd/specs/feat-notification-management/`

---

## 1. Feature Purpose

Notification Management exists to deliver system messages to users at the right time and through approved channels.

This feature must keep these concerns consistent:

- Notification requests created by other features.
- Notification content rendered from approved templates.
- Delivery status for email notifications.
- Own-user personal notification inbox visibility and read state for eligible
  non-sensitive notification records on the web.
- Safe delivery records for failed or skipped delivery attempts.
- Construction-bound ownership for FE02 OTP, FE04 membership-result, and FE11 account-setup delivery.

FE10 historically used a Standard Spec. Revision v0.5.0 is treated as Full Spec
because it adds schema, authenticated own-record APIs, and server-side
authorization while preserving the rule that FE10 does not decide when an
account, reservation, loan, or fine changes state.

---

## 2. Real-World Workflow

The typical library notification workflow:

1. A source feature detects that a notification should be sent.
2. The source feature sends FE10 a notification request with recipient, type, channel, template key, and template data.
3. FE10 validates the request and checks recipient/channel availability.
4. FE10 renders the message from an approved template.
5. FE10 persists accepted sensitive delivery as `PROCESSING` before provider
   I/O, while queued non-sensitive delivery starts as `PENDING`.
6. Eligible non-sensitive records are visible in the recipient's personal web
   inbox without creating a second record or delivery channel.
7. The worker sends queued email and updates the independent delivery status;
   personal read state changes only through the authenticated inbox API.
8. If sending fails, FE10 records a safe failure reason without removing the
   inbox record or rolling back the source business event.

---

## 3. Feature Boundary

FE10 includes:

- Receiving notification requests from approved construction-bound internal features.
- Sending account verification, password reset, reservation, due date, overdue, and fine notifications.
- Projecting eligible non-sensitive records into the authenticated recipient's
  personal web inbox without creating another notification or channel.
- Tracking nullable `ReadAt` independently from email delivery and deriving
  safe business navigation from a fixed backend allowlist.
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
- A second `IN_APP` delivery channel or duplicate inbox table/record.
- Global Admin/Librarian notification-log screens.
- Notification delete, archive, retention-cleanup, or preference management.
- Manual retry management screens.
- Template editor UI.
- Real external email-provider credentials in source code.

---

## 4. Current Data Model Notes

The existing SQL design is implemented in `database/Librarymanagement.sql`;
the approved v0.5.0 extension adds the personal read-state contract:

- `NotificationTemplates` with canonical template code, subject, body, status, and timestamps.
- `Notifications` with type/template, recipient, delivery status, safe source
  metadata, all-status idempotency key, redacted payload, attempt count, safe
  failure summary, and the v0.5.0 nullable `ReadAt` field.
- `NotificationAttempts` with attempt timestamp/status, safe error message, and provider message ID.
- `UserNotificationPreferences` remains future work. The approved personal web
  inbox reuses `Notifications` and does not require a preference or projection
  table.

Potential issues to review:

- Email addresses live in `Users.Email`; FE10 must not duplicate user account data unnecessarily.
- Email provider secrets must come from environment/configuration, not committed files.
- FE02 owns OTP/token generation and validation; FE10 receives raw OTP template data only through the requester bound to `FE02`, uses it only in provider memory, and persists no OTP or rendered sensitive content.
- Staff HTTP callers cannot submit sensitive auth notifications; only FE02 may submit verification/reset, only FE04 may submit membership result, and only FE11 may submit account setup through their bound requesters.
- FE10 should be idempotent enough to avoid duplicate messages for the same source event.
- Failed sends should not roll back already-completed business transactions in FE02/FE07/FE08/FE09.
- Personal inbox queries must filter by authenticated `UserId` and the exact
  eligible non-sensitive allowlist before rows materialize; sensitive and
  userless rows never enter list, count, or read operations.

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
| Q-FE10-002 | A separate `IN_APP` delivery channel remains future work. The v0.5.0 web inbox is an additional presentation of the existing eligible email-backed record, not a new channel. | Review packet 2026-06-10; v0.5.0 design approval 2026-07-27 | APPROVED |
| Q-FE10-003 | Required canonical templates cover verification, password reset, account setup, reservation ready, due reminder, overdue notice, fine notice, and membership result. | Review packet 2026-06-10; normalization through 2026-07-17 | APPROVED |
| Q-FE10-004 | Store notification send attempts and status. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-005 | Retry failed sends manually only in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-006 | Notification failure must not block source business flow. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-008 | FE11-owned `ACCOUNT_SETUP` is delivered only through the FE11-bound requester and persists no raw setup token/link. | ADR-005; Nhat approval 2026-07-15 | APPROVED |
| Q-FE10-007 | System/Scheduler may trigger notifications internally; not a login role. | Review packet 2026-06-10 | APPROVED |
| Q-FE10-014 | Every authenticated `MEMBER`, `LIBRARIAN`, and `ADMIN` receives an own-record-only personal inbox for eligible non-sensitive notifications; global staff logs remain out of scope. | v0.5.0 design and written SPEC approval 2026-07-27 | APPROVED |

---

## 10. Current Hardening Status

- `SPEC.md` v0.5.0, the personal inbox design, and FE10-I01..I08 plan are
  H1-approved; governance PR #70 is merged as `25c09ec`.
- FE10-I01 through FE10-I08 are implemented and rebased onto approved
  `main@db97f17`, then synchronized with non-overlapping regression-test-only
  `main@f3ebe95`. Fresh post-drift local/SQL/browser validation is green;
  fresh H2, staging, H3, merge, and post-merge CI remain pending and
  unclaimed.
- The 2026-07-28 H1 deployment addendum preserves upstream CI-gated automatic
  staging while requiring exact migration-hash proof for both automatic and
  manual runs; manual runs retain an additional human confirmation input.
- The 2026-07-28 H1 Core-drift addendum preserves the upstream packaged
  `CHANGE_PASSWORD_OTP` startup migration/readiness contract and Vietnamese
  verification-email seed while retaining the FE10 migration gate.
- The second 2026-07-28 H1 Core-drift addendum preserves upstream
  FE07/FE08/FE10/FE12 round-two UI corrections through `main@db97f17`,
  including the Vietnamese member-cancellation reason and responsive
  return/reservation controls, while retaining the FE10 inbox API and styles.
- FE10-H01 through FE10-H09 and FE10-S01 through FE10-S16 remain completed
  historical delivery work; FE10-I01 through FE10-I08 are the new bounded
  personal inbox tasks.
- Use environment variables or deployment configuration for email provider credentials.
- Do not log raw tokens, full reset links, or provider secrets.
- Keep FE10 APIs role-protected and server-side validated.
- Keep verification/reset internal to `FE02`, membership result internal to `FE04`, and account setup internal to `FE11`; HTTP and non-owning sources receive safe `403`.
- Use idempotency keys or source event identifiers to prevent duplicate notification records.
- Keep message rendering centralized so templates are testable.
