# FE10 Notification Inbox Expansion Design

**Status:** LOCAL IMPLEMENTATION CANDIDATE - H2 PENDING

**Design approved:** 2026-07-27

**Written review approved:** 2026-07-27

**Implementation plan/H1 approved:** 2026-07-28

**Approver:** User in the active task

**Delivery method:** SDD first, Full depth for Core notification data, API,
authorization, and migration; bounded ADD may later implement the approved UI
shell.

**Implementation baseline:** governance PR #70 merged to `main` as
`25c09ec5f90d21e4ab0228cccd838b3548d4d90d`; the local candidate was then
rebased onto approved upstream `main@db97f1760d4dd37bd37fa979fb46c4e600f82e3f`
and mechanically synchronized with non-overlapping regression-test-only
`main@f3ebe95ed00cef5119d2b6788ebccd72c5cda190`.
FE10-I01 through FE10-I08 are implemented and fresh post-drift
local/SQL/browser validation is green; fresh H2, Azure staging, H3, merge, and
post-merge CI remain unclaimed.

**H1 deployment addendum approved 2026-07-28:** preserve upstream CI-gated
automatic staging deployment plus manual reruns. Both paths fail closed unless
the exact checked-out FE10 migration SHA-256 matches
`FE10_INBOX_MIGRATION_SHA256` in the GitHub `staging` Environment; manual runs
also require `fe10_inbox_migration_confirmed=true`. Backend still precedes
frontend and smoke, and the migration proof must exist before H3/merge.

**H1 Core-drift addendum approved 2026-07-28:** reconcile with
`main@5a3c84b` while preserving the newly packaged
`add_change_password_otp_token_type.sql` startup migration, its readiness
guide/tests, and the canonical Vietnamese account-verification seed. Reapply
the FE10 migration preflight/order without weakening either upstream contract,
then run complete validation and obtain a new H2 fingerprint.

**Second H1 Core-drift addendum approved 2026-07-28:** reconcile with
`main@db97f17` while preserving its Vietnamese default reservation-cancellation
reason, responsive return/reservation controls, and all other round-two
FE07/FE08/FE10/FE12 corrections. Retain the FE10 inbox client and scoped
notification styles, then run complete validation and obtain a new H2
fingerprint.

## 1. Outcome And Scope

This revision adds a safe personal notification inbox to the existing FE10
email-delivery feature. Every authenticated `MEMBER`, `LIBRARIAN`, and `ADMIN`
account can view only its own non-sensitive notifications, see an unread badge,
mark one or all notifications as read, and follow a server-approved link to the
related business screen.

The inbox is a second presentation surface for the existing non-sensitive
notification record. It does not create a second notification, introduce an
`IN_APP` delivery channel, or change the email lifecycle. One accepted source
event still owns one notification record and one idempotency key.

Included:

- an authenticated header bell with unread count and five-item preview;
- a paginated `/notifications` page with all/unread/read filters;
- personal list, unread-count, mark-one-read, and mark-all-read APIs;
- nullable read state on the current `Notifications` record;
- allowlisted action paths derived by the backend;
- migration/backfill that treats historical rows as already read;
- automated, SQL integration, and browser acceptance coverage.

Out of scope:

- user deletion, archive, or retention cleanup;
- global Admin/Librarian notification-log screens;
- manual retry or template-management UI;
- WebSocket, Server-Sent Events, mobile push, SMS, or marketing messages;
- caller-supplied action URLs or a new delivery channel;
- exposing sensitive authentication/setup notifications in the inbox.

## 2. Approved Decisions

| ID | Question | Approved decision | Rationale |
| --- | --- | --- | --- |
| BD-001 | Who receives an inbox? | Every authenticated `MEMBER`, `LIBRARIAN`, and `ADMIN`; each sees only records whose `UserId` is its own. | One consistent personal boundary avoids role-specific leaks and keeps the UI reusable. |
| BD-002 | Which records appear? | Every non-sensitive business notification appears in both email processing and the web inbox. | Reuses the current source event and avoids divergent channel decisions. |
| BD-003 | What happens on click? | Mark the record read, then navigate to a backend-derived allowlisted business route. | Gives an actionable inbox without accepting open-redirect input. |
| BD-004 | How is history retained? | Keep all rows, paginate them, and expose no delete/archive operation. | Preserves traceability and avoids a second lifecycle in this bounded revision. |
| BD-005 | Where is read state stored? | Add nullable `ReadAt` to `Notifications`; do not create a projection table. | Each notification has one recipient, so a separate inbox table adds unnecessary dual-write risk. |
| BD-006 | How are old rows handled? | Backfill eligible existing rows with `ReadAt = CreatedAt`. | Deployment must not turn the complete historical queue into unread alerts. |
| BD-007 | Is real-time transport required? | No. Load at authenticated shell start, refresh on focus and mutations, and poll every 60 seconds. | Meets the user outcome without introducing another runtime service. |

## 3. Actor And Ownership Contract

| Actor | May do | Must not do | Failure behavior |
| --- | --- | --- | --- |
| Authenticated account | List, count, and mark read its own non-sensitive notifications. | Read another user's row, query sensitive types, change email status, delete history, or supply an action URL. | Unowned, sensitive, or missing IDs return the same safe `404`. |
| Guest | None of the inbox operations. | Read a personal inbox before authentication. | Safe `401`. |
| Source feature | Continue creating one canonical FE10 request. | Decide inbox read state or provide a navigation URL. | Existing source failure-isolation contract remains unchanged. |
| FE10 | Own delivery status, read state, safe DTO projection, and action mapping. | Expose sensitive content or decide FE04/FE07/FE08/FE09 outcomes. | Safe validation/internal errors with no secret-bearing fields. |
| Email worker/provider | Continue the current delivery lifecycle. | Change `ReadAt`. | Delivery failure remains independent of web visibility and source state. |

## 4. Orthogonal State Model

Email delivery state and inbox read state are independent:

- delivery: `PENDING -> PROCESSING -> SENT` or
  `PENDING -> PROCESSING -> FAILED`;
- inbox: `UNREAD (ReadAt = NULL) -> READ (ReadAt = server timestamp)`.

Only non-sensitive records with a persisted non-null `UserId` are
inbox-eligible. Email-only records addressed without a user identity have no
personal owner and therefore remain outside the web inbox. A read mutation never changes
`Status`, `SentAt`, `AttemptCount`, `NotificationAttempts`, source state, or
idempotency data. Repeating a read mutation returns the same final record and
does not create an audit/delivery attempt.

## 5. Data Design And Migration

Add `Notifications.ReadAt DATETIME2 NULL`. New non-sensitive records start with
`ReadAt = NULL`. Sensitive records remain excluded regardless of `ReadAt`.

The idempotent migration shall:

1. add `ReadAt` only when it does not exist;
2. set `ReadAt = CreatedAt` for rows that existed before the migration and are
   inbox-eligible;
3. leave sensitive rows excluded instead of converting them into inbox items;
4. add an index supporting `(UserId, ReadAt, CreatedAt DESC)` queries;
5. run twice with the same schema and data result;
6. use the required SQL Server session options for filtered/indexed objects.

Inbox eligibility requires a non-null `UserId` and exactly one of these types:

- `GENERAL_SYSTEM` with canonical `MEMBERSHIP_RESULT`;
- `RESERVATION_AVAILABLE` with canonical `RESERVATION_READY`;
- `DUE_DATE_REMINDER`;
- `OVERDUE_NOTICE`;
- `FINE_NOTICE`.

`ACCOUNT_VERIFICATION`, `PASSWORD_RESET`, and `ACCOUNT_SETUP` never enter list,
count, or read queries.

## 6. Safe Action Mapping

The backend returns an `actionPath` derived from the persisted canonical type
and source metadata:

| Canonical notification | Action path |
| --- | --- |
| Membership result | `/membership` |
| Reservation ready | `/reservations/mine` |
| Due-date reminder or overdue notice | `/borrowing/history` |
| Fine notice | `/fines/mine` |

Unknown or incompatible mappings return `actionPath: null`. No request,
template, payload, database row, or frontend query parameter can override this
allowlist. Only relative application paths are returned.

## 7. API Contract

### 7.1 List Personal Notifications

`GET /api/notifications/mine?page=1&limit=20&readState=all&type=...`

- authenticated `MEMBER`, `LIBRARIAN`, or `ADMIN`;
- default `page=1`, `limit=20`, maximum `limit=100`;
- `readState` is `all`, `unread`, or `read`;
- optional `type` must be inbox-eligible;
- newest `CreatedAt` first, then `NotificationId` descending;
- filtering and pagination occur in SQL.

Response:

```json
{
  "notifications": [
    {
      "notificationId": 123,
      "type": "DUE_DATE_REMINDER",
      "title": "Library due date reminder",
      "message": "Please review your borrowing due date.",
      "createdAt": "2026-07-27T10:00:00.000Z",
      "readAt": null,
      "actionPath": "/borrowing/history"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

The DTO never returns recipient email, safe payload, idempotency key, template
data, source metadata, provider identifiers/errors, attempts, or sensitive
content.

### 7.2 Unread Count

`GET /api/notifications/mine/unread-count`

Returns `200 { "unreadCount": <non-negative integer> }` for the current user
and inbox-eligible rows only.

### 7.3 Mark One Read

`PATCH /api/notifications/{notificationId}/read`

The guarded update requires the current `UserId`, an inbox-eligible type, and
`ReadAt IS NULL`. It returns the safe item summary. Missing, sensitive, and
other-user rows return the same safe `404`. Repeating the request is idempotent.

### 7.4 Mark All Read

`PATCH /api/notifications/mine/read-all`

The update affects only the current user's unread, inbox-eligible rows and uses
one server timestamp. It returns `200 { "updated": <count> }`; repeating it
returns `updated: 0`.

## 8. Frontend Design

The authenticated app shell displays a bell for every login role:

- badge value is the unread count, displayed as `99+` above 99;
- opening the bell loads the five newest unread items;
- loading, empty, and safe-error states are explicit;
- `Xem tất cả` routes to `/notifications`.

The `/notifications` page provides `Tất cả`, `Chưa đọc`, and `Đã đọc` filters,
20-row pagination, newest-first ordering, a read/unread visual state, and
`Đánh dấu tất cả đã đọc`. It exposes no delete/archive control.

Clicking an item attempts the read mutation and then navigates to the returned
`actionPath`. A read-update failure must not block access to the business
screen; the item remains unread and the shared shell shows a safe non-blocking
warning.

The shell refreshes unread count after authentication, on window focus, after
read mutations, and every 60 seconds while mounted. This revision adds no
WebSocket or service worker.

## 9. Error And Security Contract

| Condition | Result |
| --- | --- |
| Missing/invalid authentication | `401` |
| Invalid page, limit, read state, or type | `400` |
| Missing, sensitive, or other-user notification ID | indistinguishable `404` |
| Repository/provider/internal failure | safe `500`, no stack/provider detail |

All authorization is server-side. Repository queries include `UserId` and the
inbox-eligible allowlist before materialization. The frontend role guard is
only a usability aid and is not an authorization boundary.

## 10. Acceptance And Verification

Required evidence:

1. route/service/repository tests for authentication, ownership, IDOR, safe
   projection, filters, pagination, count, and both idempotent read mutations;
2. tests proving all three sensitive types are absent from list/count/read;
3. FE04/FE07/FE08 integration cases proving one source event creates one email
   record that is also visible in the recipient inbox;
4. frontend tests for badge cap, preview, list states, filters, pagination,
   mark-all, click navigation, and non-blocking read failure;
5. disposable SQL Server migration executed twice, with legacy backfill and
   index/postcondition evidence;
6. browser E2E for `MEMBER`, `LIBRARIAN`, and `ADMIN`, plus cross-user negative
   API evidence;
7. full backend/frontend/deployment/traceability gates;
8. backend-first then frontend deployment, readiness, smoke, and browser
   verification on Azure staging.

## 11. Rollout And Reversibility

Deploy the additive migration and backend API before the frontend shell. The
old frontend remains compatible because existing FE10 routes and DTOs do not
change. The new frontend must treat an unavailable inbox endpoint as a safe
error state, not as anonymous access or an empty successful inbox.

Rollback may remove the frontend entry points and stop using the new API while
leaving nullable `ReadAt` in place. Destructive column removal is not required
for application rollback.

## 12. Required Documentation Fan-Out

Before implementation planning, update and human-review:

- `.sdd/specs/feat-notification-management/SPEC.md`;
- `.sdd/specs/feat-notification-management/CONTEXT.md`;
- `.sdd/specs/feat-notification-management/CHANGELOG.md`;
- FE10 `PLAN.md` and `TASKS.md` only after written SPEC approval;
- current agent/test-planning memory in `.agents/CLAUDE.md` and
  `docs/testing/master-test-plan.md`;
- schema, migration, OpenAPI/API contract, architecture map, user manual, and
  traceability artifacts during implementation.

No product-code, schema, or public-API implementation is authorized by this
design document alone.
