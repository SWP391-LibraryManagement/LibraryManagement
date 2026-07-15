# ADR-004: Authentication OTP Notification Boundary

Status: APPROVED FOR SPECIFICATION
Date: 2026-07-15
Decision owner: Nhat
Affected features: FE02 Authentication, FE10 Notification Management

## Context

FE02 uses six-digit OTP credentials for account verification and password reset. It currently creates a partial notification record and sends the OTP directly through `emailService`.

FE10 instead defines sensitive authentication templates around `verificationLink` and `resetLink`. Its protected staff HTTP endpoint also accepts `ACCOUNT_VERIFICATION` and `PASSWORD_RESET`, allowing an authenticated staff caller to supply sensitive authentication content that should only originate from FE02.

This creates two delivery owners, an OTP-versus-link contract conflict, and an unsafe HTTP boundary.

## Decision

### Ownership

- FE02 owns OTP generation, hashing, expiry, revocation, and validation.
- FE10 owns rendering, email delivery, notification status, attempts, and safe notification audit metadata.
- FE10 must not generate, persist, validate, log, audit, or return a raw OTP.
- FE02 public HTTP responses must not expose raw verification/reset OTPs, including test-only debug fields. Tests capture deterministic OTPs through injected dependencies rather than route responses.

### Internal Request Contract

FE02 uses `createSourceNotificationRequester('FE02')` with:

```json
{
  "type": "ACCOUNT_VERIFICATION | PASSWORD_RESET",
  "channel": "EMAIL",
  "userId": 123,
  "recipientEmail": "member@example.test",
  "templateKey": "ACCOUNT_VERIFICATION | PASSWORD_RESET",
  "templateData": {
    "otp": "123456",
    "expiresInMinutes": 15
  },
  "sourceEntityType": "AuthToken",
  "sourceEntityId": 456,
  "idempotencyKey": "FE02:ACCOUNT_VERIFICATION:456"
}
```

The exact idempotency formats are `FE02:ACCOUNT_VERIFICATION:<tokenId>` and `FE02:PASSWORD_RESET:<tokenId>`. They use the persisted `AuthTokens.TokenId`, never the OTP value. A resend creates a new token and therefore a new notification event/key.

### Security Boundary

- Only the requester bound to `FE02` may submit `ACCOUNT_VERIFICATION` or `PASSWORD_RESET`.
- Staff HTTP requests and requesters bound to `FE07`, `FE08`, `FE09`, or `SYSTEM` must receive `403 SENSITIVE_NOTIFICATION_INTERNAL_ONLY` with message `Sensitive authentication notifications must be requested internally.` for either sensitive type.
- HTTP callers may not provide `sourceFeature`; FE10 returns `400 SOURCE_FEATURE_HTTP_FORBIDDEN` with message `Notification source cannot be supplied through HTTP.` Source identity is construction-bound for internal requesters and absent for manual HTTP requests.

### Delivery And Persistence

- Authentication templates require `otp` and `expiresInMinutes`.
- FE10 renders and sends sensitive authentication messages synchronously through the configured email-provider adapter; tests use an injected mock provider.
- FE10 persists safe source metadata, `SENT` or `FAILED`, attempt history, timestamps, and a fixed safe failure summary.
- FE10 persists no raw OTP and no rendered sensitive subject/body.

### Failure Policy

- Notification failure does not roll back account creation, OTP creation, or password-reset request handling.
- FE02 catches safe requester failures and preserves its existing public response semantics.
- A failed sensitive notification cannot be retried from stored content; FE02 must issue a new OTP/token event.

## Scope Boundaries

In scope:

- Account verification OTP notification.
- Password reset OTP notification.
- Staff/internal source restrictions for those two notification types.
- Removal of FE02's duplicate notification-record and direct-email paths for those two flows.

Out of scope:

- `CHANGE_PASSWORD_OTP`, which remains an FE02 direct-email flow until a separate FE10 type/use case is approved.
- Legacy verification/reset token acceptance in FE02; canonical FE11 account setup is governed by ADR-005.
- FE09 caller integration, retry UI, inbox UI, SMS, push notifications, and template editing.

## Verification Contract

Implementation must prove:

1. Staff HTTP cannot submit either sensitive authentication type.
2. Non-FE02 internal requesters cannot submit either sensitive authentication type.
3. FE02 can submit both canonical OTP templates.
4. The provider receives the OTP while persistence, audit, logs, and responses do not.
5. FE02 performs one delivery request per newly created OTP token and no direct duplicate send.
6. Provider/requester failure does not roll back the FE02 source flow.
7. Resend creates a new token ID and idempotency key.

## Consequences

- FE10 becomes the single delivery owner for UC45 and UC46.
- FE02 and FE10 specifications become consistent with the implemented six-digit OTP UX.
- Sensitive authentication delivery is no longer exposed through the staff HTTP boundary.
- A real configured provider may deliver FE10 messages in deployed environments while tests remain deterministic through dependency injection.
