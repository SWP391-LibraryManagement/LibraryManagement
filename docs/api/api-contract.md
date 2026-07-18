# API Contract - Phase 1 Baseline

Status: Draft for Week 4 planning
Date: 2026-06-10

## Scope

This contract captures the Week 4 baseline REST API for Sprint 1 planning, focused on:

- FE02 Authentication
- FE11 User & Role Management

Feature specs remain the source of truth. If this contract conflicts with an approved `SPEC.md`, update this contract or the spec through review before implementation.

## Base URL

```text
/api
```

## Common Rules

- Request and response bodies use JSON.
- Protected endpoints require `Authorization: Bearer <accessToken>`.
- Server-side validation is mandatory.
- Server-side authorization is mandatory for protected actions.
- Error responses must not expose stack traces, password hashes, raw tokens, SQL details, or whether an email exists.

## Response Envelope

Successful responses may return resource-specific JSON directly.

Error response shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request.",
    "details": []
  }
}
```

Common HTTP status codes:

| Status | Meaning |
| --- | --- |
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Missing, invalid, or expired authentication |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict with unique/status rule |
| 429 | Rate limit or too many failed login attempts |
| 500 | Safe generic server error |

---

## FE02 Authentication

Source spec: `.sdd/specs/feat-auth/SPEC.md`

### POST `/api/auth/register`

Actor: Guest

Request:

```json
{
  "email": "user@example.test",
  "username": "user01",
  "password": "Password1!",
  "confirmPassword": "Password1!",
  "fullName": "Demo User",
  "phoneNumber": "0900000000"
}
```

Response `201`:

```json
{
  "userId": 1,
  "email": "user@example.test",
  "message": "Verification email sent"
}
```

Notes:

- Creates inactive/unverified user according to FE02.
- Sends or records mock verification email through FE10 integration when available.

### POST `/api/auth/verify-email`

Actor: Guest

Primary request (interactive OTP flow):

```json
{
  "email": "user@example.test",
  "otp": "123456"
}
```

Compatibility request (legacy verification link):

```json
{
  "token": "verification-token-from-email"
}
```

Response `200`:

```json
{
  "message": "Account verified. You can now login."
}
```

### POST `/api/auth/resend-verification`

Actor: Guest

Request:

```json
{
  "email": "user@example.test"
}
```

Response `200`:

```json
{
  "message": "Verification email sent"
}
```

Notes:

- Response must avoid email enumeration.
- A successful resend invalidates the previous active verification credential.
- The frontend applies a visible 60-second cooldown after a successful resend and disables duplicate requests while one is pending.

### POST `/api/auth/login`

Actor: Guest

Request:

```json
{
  "email": "user@example.test",
  "password": "Password1!"
}
```

Response `200`:

```json
{
  "userId": 1,
  "email": "user@example.test",
  "roles": ["MEMBER"],
  "accessToken": "jwt-access-token",
  "refreshToken": "refresh-token",
  "expiresIn": 900
}
```

Notes:

- Access token expires after 15 minutes.
- Refresh token expires after 7 days.
- Inactive or locked users cannot log in.
- Failed login must be auditable and rate-limited.

### POST `/api/auth/refresh-token`

Actor: Authenticated or holder of valid refresh token

Request:

```json
{
  "refreshToken": "refresh-token"
}
```

Response `200`:

```json
{
  "accessToken": "new-jwt-access-token",
  "expiresIn": 900
}
```

### POST `/api/auth/logout`

Actor: Authenticated

Request:

```json
{
  "refreshToken": "refresh-token"
}
```

Response `200`:

```json
{
  "message": "Logged out"
}
```

Notes: invalidates refresh/session token server-side.

### POST `/api/auth/change-password`

Actor: Authenticated

Request:

```json
{
  "currentPassword": "OldPassword1!",
  "newPassword": "NewPassword1!"
}
```

Response `200`:

```json
{
  "message": "Password changed"
}
```

### POST `/api/auth/forgot-password`

Actor: Guest

Request:

```json
{
  "email": "user@example.test"
}
```

Response `200`:

```json
{
  "message": "Password reset email sent"
}
```

Notes:

- Response must avoid email enumeration.
- Eligible active accounts receive a six-digit reset OTP with the configured 15-minute expiry.

### POST `/api/auth/reset-password`

Actor: Guest

Primary request (interactive OTP flow):

```json
{
  "email": "user@example.test",
  "otp": "123456",
  "newPassword": "NewPassword1!"
}
```

Compatibility request (legacy reset or FE11 setup link):

```json
{
  "token": "reset-or-setup-token-from-email",
  "newPassword": "NewPassword1!"
}
```

Response `200`:

```json
{
  "message": "Password reset successful"
}
```

Rules for canonical FE11 `ACCOUNT_SETUP` tokens:

- The target account must be `INACTIVE` and have incomplete FE11 setup-token history.
- Completion atomically updates password hash, `EmailVerifiedAt`, lock fields, status, token usage/revocation, and audit.
- Password-reset credentials cannot activate ordinary inactive accounts.

### GET `/api/auth/me`

Actor: Authenticated

Response `200`:

```json
{
  "userId": 1,
  "email": "user@example.test",
  "username": "user01",
  "roles": ["MEMBER"],
  "status": "ACTIVE"
}
```

---

## FE11 User & Role Management

Source spec: `.sdd/specs/feat-user-role-management/SPEC.md`

All FE11 endpoints require authenticated Admin role.

### GET `/api/users`

Query:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| page | number | No | Default 1 |
| limit | number | No | Default 20 |
| status | string | No | `ACTIVE`, `INACTIVE`, `LOCKED` |
| role | string | No | `ADMIN`, `LIBRARIAN`, `MEMBER`; case-insensitive input is normalized |
| search | string | No | Trimmed email/full-name/user-ID search; 1..200 characters when supplied |

Response `200`:

```json
{
  "data": [
    {
      "userId": 1,
      "username": "demo_admin",
      "email": "demo.admin@example.test",
      "phoneNumber": "0900000001",
      "fullName": "Demo Admin",
      "address": "Hanoi",
      "status": "ACTIVE",
      "roles": ["ADMIN"],
      "createdAt": "2026-07-01T08:00:00.000Z",
      "updatedAt": "2026-07-18T08:00:00.000Z",
      "lastLoginAt": "2026-07-18T07:30:00.000Z"
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

The approved list envelope contains exactly `data` and `pagination`. Global Admin counters are read independently from FE12 `GET /api/reports/users` (`totals.users`, `usersByStatus`, and `usersByRole`) and are not derived from this paginated response.

### GET `/api/users/{userId}`

Response `200`:

```json
{
  "userId": 1,
  "username": "demo_admin",
  "email": "demo.admin@example.test",
  "phoneNumber": "0900000001",
  "fullName": "Demo Admin",
  "address": "Hanoi",
  "status": "ACTIVE",
  "roles": ["ADMIN"],
  "createdAt": "2026-07-01T08:00:00.000Z",
  "updatedAt": "2026-07-18T08:00:00.000Z",
  "lastLoginAt": "2026-07-18T07:30:00.000Z",
  "relatedSummary": {
    "activeBorrowingCount": 0,
    "unpaidFineTotal": 0,
    "openReservationCount": 0
  }
}
```

Notes: `relatedSummary` is detail-only and each value defaults to numeric zero. The response must never return password hashes, raw or hashed auth tokens, refresh/session identifiers, setup/reset links, provider payloads, or secret audit metadata.

### POST `/api/users`

Request:

```json
{
  "email": "new.librarian@example.test",
  "username": "new_librarian",
  "fullName": "New Librarian",
  "type": "librarian",
  "phone": "0900000009",
  "address": "Hanoi",
  "department": "Circulation",
  "specialization": "Borrowing"
}
```

Response `201`:

```json
{
  "userId": 10,
  "email": "new.librarian@example.test",
  "status": "INACTIVE",
  "roles": ["LIBRARIAN"],
  "setupDeliveryStatus": "SENT",
  "message": "User created. Password setup email sent."
}
```

Notes:

- User, profile, role, hashed setup token, and audit commit atomically before FE10 delivery.
- Delivery failure returns `setupDeliveryStatus: "FAILED"`; the account remains `INACTIVE` and no provider detail or setup credential is returned.
- The Admin never submits or receives a password, raw token, setup link, or debug credential.

### POST `/api/users/{userId}/resend-setup`

Actor: Admin

Request:

```json
{}
```

Response `200`:

```json
{
  "userId": 10,
  "status": "INACTIVE",
  "setupDeliveryStatus": "SENT",
  "message": "Password setup email sent."
}
```

Rules:

- Only incomplete admin-created accounts are eligible.
- FE11 revokes prior active setup tokens and creates a new 24-hour token/event/key.
- A 60-second server-side cooldown applies per target account.
- Active, locked, self-registered inactive, completed-setup, or cooldown-limited accounts are rejected without issuing a credential.

### PUT `/api/users/{userId}`

Request:

```json
{
  "fullName": "Updated Name",
  "phone": "0900000010",
  "address": "Updated Address",
  "department": "Reference"
}
```

Response `200`:

```json
{
  "message": "User updated"
}
```

### PATCH `/api/users/{userId}/status`

Request:

```json
{
  "status": "INACTIVE"
}
```

Response `200`:

```json
{
  "message": "User status updated"
}
```

Rules:

- Admin cannot deactivate themselves.
- Users with active borrowings cannot be deactivated.
- Deactivation does not permanently delete data.

### POST `/api/users/{userId}/roles`

Request:

```json
{
  "roleId": 2
}
```

Response `200`:

```json
{
  "message": "Role assigned"
}
```

### DELETE `/api/users/{userId}/roles/{roleId}`

Response `200`:

```json
{
  "message": "Role revoked"
}
```

Rules:

- Roles are flat in Phase 1.
- Last remaining Admin role must not be revoked.

### GET `/api/admin/audit-logs`

Actor: authenticated Admin. Authentication and Admin authorization run before detailed query validation.

| Query | Type | Required | Contract |
| --- | --- | --- | --- |
| `page` | integer | No | Default `1`; minimum `1` |
| `limit` | integer | No | Default `20`; range `1..100` |
| `q` | string | No | Trimmed `1..100`; searches action, actor email/full name, target type, and target ID text |
| `action` | string | No | Trimmed exact action, `1..100` |
| `actorId` | integer | No | Positive user ID |
| `from` | date | No | Inclusive `YYYY-MM-DD` lower bound |
| `to` | date | No | Inclusive `YYYY-MM-DD` upper bound; must not precede `from` |

Response `200`:

```json
{
  "data": [
    {
      "logId": 10,
      "action": "USER_ROLE_ASSIGN",
      "actor": {
        "userId": 7,
        "email": "admin@example.test",
        "fullName": "Admin User"
      },
      "target": {
        "type": "USER",
        "id": 15,
        "label": "member@example.test"
      },
      "details": {
        "roleId": 2,
        "roleName": "LIBRARIAN"
      },
      "ipAddress": "203.0.113.10",
      "createdAt": "2026-07-18T10:00:00.000Z"
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

Rules:

- Rows are ordered by `CreatedAt DESC, LogId DESC`; filtering and pagination run in SQL with typed parameters.
- `details` is an action-aware allowlist. Raw `Metadata`, `UserAgent`, passwords, hashes, tokens, OTPs, sessions, credentials, setup/reset links, raw notes/reasons/emails/identifiers, raw paths, and nested objects are not returned.
- Invalid JSON, top-level arrays/scalars, unknown actions, and invalid projected field shapes return `details: {}`.
- Only targets with type `USER`, `USERS`, or `ACCOUNT` may receive a joined user label. Other target types return `label: null`.
- An empty result returns `totalPages: 0`.
- The retired `GET /api/users/audit-logs` path always returns `404 NOT_FOUND` and is not a compatibility alias.

---

## Implementation Notes For Week 4

- This file is a planning contract, not implementation approval by itself.
- FE02 and FE11 still require approved `PLAN.md` and `TASKS.md` before coding.
- Backend tests must cover validation, authorization, and security-sensitive error behavior.
