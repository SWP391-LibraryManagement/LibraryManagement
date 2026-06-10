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

Request:

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

Notes: response must avoid email enumeration.

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

Notes: response must avoid email enumeration.

### POST `/api/auth/reset-password`

Actor: Guest

Request:

```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewPassword1!"
}
```

Response `200`:

```json
{
  "message": "Password reset successful"
}
```

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
| role | string | No | `ADMIN`, `LIBRARIAN`, `MEMBER`, `GUEST` |
| search | string | No | username/email/full name search |

Response `200`:

```json
{
  "items": [
    {
      "userId": 1,
      "username": "demo_admin",
      "email": "demo.admin@example.test",
      "status": "ACTIVE",
      "roles": ["ADMIN"]
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

### GET `/api/users/{userId}`

Response `200`:

```json
{
  "userId": 1,
  "username": "demo_admin",
  "email": "demo.admin@example.test",
  "phone": "0900000001",
  "status": "ACTIVE",
  "roles": ["ADMIN"],
  "profile": {
    "fullName": "Demo Admin",
    "address": "Hanoi",
    "dateOfBirth": "2000-01-01"
  }
}
```

Notes: must never return password hash, reset tokens, refresh tokens, or raw token values.

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
  "message": "User created. Account setup email sent when notification provider is available."
}
```

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

---

## Implementation Notes For Week 4

- This file is a planning contract, not implementation approval by itself.
- FE02 and FE11 still require approved `PLAN.md` and `TASKS.md` before coding.
- Backend tests must cover validation, authorization, and security-sensitive error behavior.
