# PLAN.md - FE10 Notification Management

Status: READY FOR REVIEW

Owner: Nhat

Updated: 2026-06-10

---

## 1. Scope

Implement the Phase 2 backend slice for FE10 from the approved `SPEC.md`.

Included:

- Internal protected API to create notification requests.
- Email-only Phase 1 channel with mock provider.
- Template lookup and simple variable rendering.
- Safe payload handling for token/reset-link data.
- Idempotency key handling to avoid duplicate active notifications.
- Pending notification processing with success/failure attempts.
- Database script alignment for status, attempts, rendered content, and idempotency.

Not included:

- Real email provider credentials.
- In-app notification UI.
- Manual retry screens.
- Template editor UI.
- Token generation or validation.

---

## 2. Approved Decisions Used

| Decision | Plan impact |
| --- | --- |
| Phase 1 channel is email with mock provider | Only `EMAIL` is accepted; sending is mocked. |
| In-app notification is future work | No inbox/read-state UI is added. |
| Required templates are fixed | Seed templates include verification, password reset, reservation ready, due reminder, overdue, fine, and membership result. |
| Attempts and status are stored | `Notifications` and `NotificationAttempts` track processing results. |
| Failure must not roll back source flow | Pending processing records failure safely and returns counts. |
| Internal/system actor is not a login role | Protected API uses librarian/admin role in this backend slice. |

---

## 3. Implementation Plan

### 3.1 Request Creation

- Add `/api/notifications/requests`.
- Validate type, channel, recipient, template key, source reference, template data, and idempotency key.
- Resolve recipient from user ID or safe email.
- Reject missing/inactive templates.
- Render subject/body using approved template variables.
- Redact sensitive token/link/password fields from stored payload and API response.

### 3.2 Pending Processing

- Add `/api/notifications/process-pending`.
- Load pending notifications by oldest first.
- Send through mock provider.
- Mark success as `SENT` with `SentAt`.
- Mark failures as `FAILED` with safe error message.
- Insert one delivery attempt per processed notification.

### 3.3 Tests

- Cover account verification, password reset redaction, reservation/due/fine template validation, duplicate idempotency, success/failure attempts, and API protection.

---

## 4. Review Notes

- FE10 does not decide FE02, FE07, FE08, or FE09 business events.
- Existing FE02/FE07/FE08 code can create notification rows without waiting for external email.
