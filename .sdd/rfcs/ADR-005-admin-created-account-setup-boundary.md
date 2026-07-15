# ADR-005: Admin-Created Account Setup Boundary

Status: PROPOSED - AWAITING HUMAN REVIEW

Date: 2026-07-15

Affected features: FE02 Authentication, FE10 Notification Management, FE11 User & Role Management

## Context

FE11 allows an Admin to create Member and Librarian accounts without entering or seeing a password. The current documents and prototype disagree about the account state and delivery boundary:

- FE02 and the shared API contract treat an admin-created account as `INACTIVE` until password setup completes.
- FE11 `SPEC.md` and the current repository implementation create the account as `ACTIVE` immediately.
- FE11 creates an `ACCOUNT_SETUP` token but queues an `ACCOUNT_VERIFICATION` notification from source `FE11` without the setup link.
- ADR-004 permits only the requester bound to `FE02` to submit `ACCOUNT_VERIFICATION` or `PASSWORD_RESET`, so FE11 must not reuse either type.

The project needs one deterministic lifecycle that preserves access control, avoids exposing setup credentials, and provides a recovery path when delivery fails or the token expires.

## Decision

### Ownership

- FE11 owns Admin-authorized account creation, initial role assignment, `ACCOUNT_SETUP` token issuance, resend authorization, and account-setup audit events.
- FE02 owns password-policy enforcement, `ACCOUNT_SETUP` token validation/consumption, password hashing, and the final `INACTIVE -> ACTIVE` transition.
- FE10 owns `ACCOUNT_SETUP` template validation, in-memory rendering, provider delivery, delivery status/attempt records, and safe delivery audit metadata.

### Initial Account State

- Admin-created Member and Librarian accounts start with `Status = INACTIVE`.
- Password-based login is unavailable while the account is `INACTIVE`.
- The required `PasswordHash` value is an unusable bcrypt hash of a server-generated random value that is discarded immediately. A fixed literal placeholder is forbidden.
- Successful FE02 setup completion stores the user's chosen bcrypt hash, sets `EmailVerifiedAt` when absent, marks the setup token used, and atomically changes the account to `ACTIVE`.

### Setup Token

- FE11 generates a cryptographically secure opaque `ACCOUNT_SETUP` token.
- FE11 stores only its hash in `AuthTokens` with a 24-hour expiry and receives the persisted `TokenId`.
- The raw token may exist only in process memory while FE11 requests FE10 delivery.
- The notification source reference is `sourceEntityType: AuthToken` and `sourceEntityId: <TokenId>`.
- The exact idempotency key is `FE11:ACCOUNT_SETUP:<tokenId>`.

### FE10 Delivery Boundary

- FE10 adds the canonical pair `ACCOUNT_SETUP -> ACCOUNT_SETUP`.
- The template requires `setupLink` and `expiresInHours`.
- Only `createSourceNotificationRequester('FE11')` may submit `ACCOUNT_SETUP`.
- Staff HTTP callers and requesters bound to any other source receive `403 SENSITIVE_NOTIFICATION_INTERNAL_ONLY`.
- FE10 renders and sends synchronously through the configured provider adapter.
- FE10 must not persist, log, audit, or return the raw setup token, setup link, or rendered sensitive title/body.
- FE10 persists only safe `AuthToken` source metadata, status, generic failure summary, and delivery attempt data.

### Creation And Delivery Failure

- User, profile, initial role, `ACCOUNT_SETUP` token, and FE11 audit entry are one source transaction.
- FE10 provider delivery occurs after that source transaction commits; no distributed transaction is introduced.
- FE10 delivery failure does not delete or activate the account. The account remains `INACTIVE` and the create response reports `setupDeliveryStatus: FAILED` without provider details.
- A successful send reports `setupDeliveryStatus: SENT`.

### Admin Resend

- FE11 provides `POST /api/users/{userId}/resend-setup` for authenticated Admin users.
- Resend is allowed only when the target account is `INACTIVE` and has prior `ACCOUNT_SETUP` token history that has not been completed.
- Resend is rejected for self-registered inactive accounts, active accounts, locked accounts, deleted accounts, and previously completed setup accounts.
- FE11 revokes prior active `ACCOUNT_SETUP` tokens, creates a new token and token ID, and requests a new FE10 notification using a new idempotency key.
- A server-side 60-second cooldown applies between setup-token issuance events for the same user.
- Delivery failure remains non-blocking and the Admin may retry after the cooldown.

## API Summary

Create response:

```json
{
  "userId": 10,
  "email": "new.user@example.test",
  "status": "INACTIVE",
  "roles": ["MEMBER"],
  "setupDeliveryStatus": "SENT",
  "message": "User created. Password setup email sent."
}
```

Resend response:

```json
{
  "userId": 10,
  "status": "INACTIVE",
  "setupDeliveryStatus": "SENT",
  "message": "Password setup email sent."
}
```

Neither response includes a token, link, notification body, or debug credential.

## Consequences

### Positive

- Account state has one meaning across FE02, FE10, FE11, API docs, tests, and SQL behavior.
- An account cannot authenticate before the user proves email access and sets a password.
- Setup notification ownership no longer conflicts with ADR-004's FE02-only OTP boundary.
- Failed delivery has a deterministic Admin recovery path.

### Costs

- FE10 needs one additional sensitive notification type/template and FE11 source ownership rule.
- FE11 needs transactional token creation, delivery integration, resend behavior, and focused service/route tests.
- FE02 setup completion tests must prove atomic activation and single-use token handling.

## Verification

1. Admin-created accounts are persisted as `INACTIVE` with the requested role and an unusable bcrypt hash.
2. No raw setup token/link appears in persistence, logs, audits, HTTP responses, or test-only debug fields.
3. Only the FE11-bound requester can submit `ACCOUNT_SETUP`.
4. Valid setup completion atomically updates the password, email verification timestamp, token usage, and account status.
5. Delivery failure leaves the account `INACTIVE` and exposes only safe status.
6. Admin resend revokes the previous active token, enforces cooldown, and creates a new token/event/idempotency key.
7. Concurrent creation, setup completion, and resend attempts preserve one valid lifecycle without duplicate activation or reusable tokens.

## Out Of Scope

- Admin-initiated password reset for an already active account.
- Public self-service resend for FE11 account setup.
- Reactivating a deactivated account.
- Reusing `ACCOUNT_VERIFICATION` or `PASSWORD_RESET` for account setup.
