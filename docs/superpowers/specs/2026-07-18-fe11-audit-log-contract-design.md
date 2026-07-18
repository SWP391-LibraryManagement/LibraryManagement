# FE11 Audit Log Contract Design

Status: APPROVED BY HUMAN - 2026-07-18

Date: 2026-07-18

Scope: `TD-024`, `FR-FE11-033`, `AC-FE11-018`, `BR-FE11-018`, and `BR-FE11-026`

## Decision Requested

Approve one Admin-owned, read-only endpoint over the cross-feature `AuditLogs` store. Migrate the Admin UI to the canonical endpoint, retire the prototype user-management route, and project metadata through an action-aware default-deny boundary.

## Canonical Endpoint

`GET /api/admin/audit-logs`

Authentication and Admin-role authorization remain server-side and run before detailed query validation. Account-status revalidation is not added by this slice because the current authentication boundary does not provide it and H1 does not authorize an authentication expansion.

## Row Scope

The endpoint returns all persisted cross-feature `AuditLogs` rows in stable order. It does not silently hide authentication, profile, membership, borrowing, reservation, inventory, fine, notification, reporting, or FE11 events. Admin may narrow the result with the `action` filter.

## Query Contract

| Field | Contract |
| --- | --- |
| `page` | Optional positive integer; default `1` |
| `limit` | Optional integer `1..100`; default `20` |
| `q` | Optional trimmed string, `1..100` characters; searches action, actor email/full name, target type, and target ID text |
| `action` | Optional trimmed exact action string, `1..100` characters |
| `actorId` | Optional positive integer |
| `from` | Optional ISO `YYYY-MM-DD` inclusive lower bound |
| `to` | Optional ISO `YYYY-MM-DD` inclusive upper bound; must not precede `from` |

Invalid supplied values return HTTP `400` with code `VALIDATION_ERROR`. Authorization precedes detailed validation. Query names remain exactly aligned with the approved FE11 SPEC.

## Response Contract

```json
{
  "data": [
    {
      "logId": 1,
      "action": "USER_ROLE_ASSIGN",
      "actor": { "userId": 7, "email": "admin@example.com", "fullName": "Admin User" },
      "target": { "type": "USER", "id": 15, "label": "member@example.com" },
      "details": { "roleId": 2, "roleName": "LIBRARIAN" },
      "ipAddress": "203.0.113.10",
      "createdAt": "2026-07-18T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

`totalPages` is `0` when `total` is `0`; otherwise it is `ceil(total / limit)`.

## Action-Aware Safe Projection

Raw `Metadata` is never returned. The service parses only a top-level JSON object and constructs `details` explicitly. Invalid JSON, arrays, scalar metadata, unknown actions, or invalid field shapes produce `details: {}`.

| Actions | Returned `details` |
| --- | --- |
| `AUTH_PASSWORD_CHANGE_FAILURE`, `AUTH_VERIFY_EMAIL`, `AUTH_LOGIN_LOCKED`, `AUTH_ACCOUNT_AUTO_UNLOCKED`, `AUTH_LOGIN_INACTIVE`, `AUTH_LOGIN_FAILURE`, `AUTH_LOGIN_SUCCESS`, `AUTH_REFRESH_TOKEN`, `AUTH_LOGOUT`, `AUTH_PASSWORD_CHANGE_SUCCESS`, `AUTH_CHANGE_PASSWORD_OTP_REQUESTED`, `AUTH_PASSWORD_RESET_SUCCESS`, `AUTH_REGISTER`, `AUTH_RESEND_VERIFICATION`, `AUTH_PASSWORD_RESET_REQUEST`, `AUTH_LOGIN_ATTEMPT`, `AUTH_ACCOUNT_SETUP_COMPLETE`, `USER_ACCOUNT_SETUP_RESEND` | `{}` |
| `USER_CREATE` | `{ roleName }`; persisted email is omitted |
| `USER_UPDATE` | `{ changedFields }`; only `email`, `fullName`, `phone`, `address`, `department`, `specialization`, and `status` are retained |
| `USER_DEACTIVATE` | `{ newStatus }` |
| `USER_ROLE_ASSIGN`, `USER_ROLE_REVOKE` | `{ roleId, roleName }` |
| `BORROW_REQUEST_CREATE` | `{ copyIds }` |
| `BORROW_REQUEST_APPROVE` | `{ memberUserId, copyIds, notesProvided }` |
| `BORROW_REQUEST_REJECT` | `{ memberUserId, reasonProvided }` |
| `BORROW_DETAIL_RETURN` | `{ requestId, memberId, copyId, condition, overdueDays, notesProvided }` |
| `BORROW_DETAIL_RENEW` | `{ requestId, memberId, copyId, newDueDate, notesProvided }` |
| `RESERVATION_FULFILL` | `{ requestId, copyId, memberUserId }` |
| `RESERVATION_CREATE`, `RESERVATION_EXPIRE` | `{ copyId }` |
| `RESERVATION_CANCEL` | `{ copyId, reasonProvided }` |
| `RESERVATION_NOTIFY_FAILED` | `{ code }` |
| `RESERVATION_PROCESS` | `{ copyId, selectedUserId, expiresAt }` |
| `FINE_CALCULATE` | `{ borrowDetailId, memberId, overdueDays, amount }` |
| `FINE_COLLECT` | `{ collectedAmount, fullyCollected, noteProvided }` |
| `FINE_MARK_PAID` | `{ amount, noteProvided }` |
| `FINE_WAIVE`, `FINE_CANCEL` | `{ reasonProvided }` |
| `BOOK_COPY_CREATE` | `{ bookId, barcode, status, location }` |
| `BOOK_COPY_UPDATE` | `{ bookId, changedFields }`, plus `previousStatus` and `newStatus` only when status changed; raw `before`, `patch`, book, title, and ISBN data are omitted |
| `BOOK_COPY_STATUS_UPDATE` | `{ previousStatus, newStatus, reasonProvided }` |
| `BOOK_COPY_DEACTIVATE` | `{ previousStatus, newStatus }` |
| `MEMBERSHIP_APPLICATION_SUBMITTED`, `MEMBERSHIP_APPLICATION_APPROVED` | `{ userId, status }` |
| `MEMBERSHIP_APPLICATION_REJECTED` | `{ userId, status, reasonProvided }` |
| `PROFILE_UPDATE` | `{ changedFields }`; only `fullName`, `address`, `dateOfBirth`, `avatarUrl`, and `phone` are retained |
| `REPORT_BORROWING_VIEW`, `REPORT_INVENTORY_VIEW`, `REPORT_USERS_VIEW` | `{ reportType }`, derived from the action |
| `REPORT_ACCESS_DENIED` | `{ code, statusCode, method, reportType? }`; raw path is omitted and only known report paths map to `reportType` |
| `NOTIFICATION_REQUEST_CREATE` | `{ type, channel, sourceFeature, sourceEntityType, sourceEntityId? }`; `sourceEntityId` is omitted when `sourceEntityType` is `AuthToken` |
| `NOTIFICATION_RETRY` | `{ previousStatus, newStatus }` |
| `NOTIFICATION_PROCESS_PENDING` | `{ processed, failed }` |

Arrays are capped at 100 values. IDs must be positive integers. Counts and monetary values must be finite nonnegative numbers. Dates must normalize to ISO strings. Free-text `reason`, `notes`, `note`, message, email, identifier, raw path, and nested objects are never returned; only the corresponding `reasonProvided`, `notesProvided`, or `noteProvided` boolean may be emitted.

After action projection, a recursive veto removes any key matching password, hash, token, OTP, authorization, cookie, secret, session, credential, API-key, setup-link, or reset-link concepts.

## Ordering And SQL Boundary

- Stable order is `CreatedAt DESC, LogId DESC`.
- Pagination and every filter are applied in SQL.
- All query values use typed `mssql` parameters.
- Search never concatenates request text into SQL.
- Actor and target display labels come from the approved joins, not metadata.

## Legacy Route Retirement

The Admin frontend migrates to `/api/admin/audit-logs`. `GET /api/users/audit-logs` becomes a retired non-functional path that returns HTTP `404` with code `NOT_FOUND` and never invokes the user-management or audit service. This explicit retirement guard prevents the path from falling through to dynamic `/:userId` validation and returning an incorrect `400`.

## Tests Required After H1

- Authentication and Admin authorization run before detailed validation.
- Invalid page/limit/q/action/actor/date boundaries return `VALIDATION_ERROR`.
- `from <= to` validation.
- Stable pagination/order and typed SQL parameters.
- `q` and every filter work independently and in combination.
- Every current action projector has positive, malformed-shape, and hostile-key coverage.
- Unknown actions and invalid JSON return empty details.
- Raw notes/reasons/emails/identifiers/token IDs and nested objects are absent.
- Frontend uses the canonical endpoint, omits empty queries, wires filters, and renders only projected fields.
- Legacy route returns `404 NOT_FOUND` and invokes no service.

## File Ownership Clarification

`frontend/test/adminApi.test.js` owns the direct `frontend/src/api/adminApi.js` endpoint/query contract. `frontend/test/userManagementApi.test.js` owns removal of the legacy user-management API call. `frontend/test/userManagementFrontend.test.js` owns filter and rendering behavior.

## Out Of Scope

- Audit writes, audit deletion/update, export, schema changes, dashboard analytics, changing writer metadata quality, returning raw free-text reasons/notes, and changing authentication account-status enforcement.

## H1 Recommendation

Approve the contract exactly as written. Any compatibility alias, hidden default action filter, raw metadata/free-text exposure, query-name change, or authentication expansion requires an explicit H1 revision before implementation.
