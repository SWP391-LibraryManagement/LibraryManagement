# FE02 Test Plan - Authentication

Version: 0.3.8
Status: RECONCILIATION IN PROGRESS - BASELINE EVIDENCE RECORDED; GAPS OPEN
Last Updated: 2026-07-23

Source Spec: `.sdd/specs/feat-auth/SPEC.md`
Feature IDs: `BR-FE02-*`, `FR-FE02-*`, `AC-FE02-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Registration, email verification, login, token refresh/logout, current-user lookup, forgot/reset password, and change password behavior.

## 2. Unit Test Targets

- Password hashing and password comparison.
- Token creation, verification, and expiry handling.
- OTP/reset token validation.
- FE11 account-setup token validation and atomic activation.
- Invalid email/password format validation.
- Account status checks (inactive/locked/auto-unlock).

## 3. API / Integration Test Targets

- `POST /auth/register`: happy path, duplicate email with no additional persistence/delivery, weak password with no persistence, invalid input.
- FE02/FE10 OTP boundary: registration and password-reset flows submit exactly one FE02-bound requester call with `AuthToken` source ID and token-ID idempotency; direct duplicate delivery is rejected while `CHANGE_PASSWORD_OTP` remains FE02-owned.
- `POST /auth/verify-email`: canonical email/OTP and legacy-token happy paths, invalid OTP, expired OTP, and credential consumption.
- `POST /auth/resend-verification`: happy path, invalid user/state.
- `POST /auth/login`: happy path, wrong password, inactive/unknown public-envelope parity, locked account, and automatic unlock.
- `POST /auth/refresh-token`: happy path, expired token, invalid token.
- Registration role assignment: self-registration creates exactly one `Member` assignment and cannot create Librarian/Admin roles.
- Authorization and transport: protected actions use current `UserRoles`; deployed HTTP auth requests are redirected or rejected before credential processing.
- Protected-request current state: tokens issued before a user becomes `INACTIVE` or `LOCKED` are rejected before business processing while active linked sessions continue to work.
- HTTPS transport: plain HTTP auth requests are rejected before body/auth dispatch, trusted proxy HTTPS is accepted, and an explicit canonical-host redirect mode is tested.
- `POST /auth/logout`: happy path, invalid token.
- `POST /auth/change-password` (+ `/request-otp`, `/confirm`): happy path, wrong old password, reused password, invalid OTP, unauthenticated.
- `POST /auth/forgot-password`, `/reset-password`: generic request semantics; canonical email/OTP and legacy-token success; invalid/expired/reused credential; weak-password no-mutation behavior.
- `POST /auth/reset-password` with `ACCOUNT_SETUP`: atomic activation, invalid/used/revoked/ineligible/concurrent token rejection, and no reset-purpose activation.
- `GET /auth/me`: authenticated happy path, unauthenticated error.
- FE02 frontend recovery: one refresh attempt after 401, replacement access-token persistence in the selected storage, no retry loop, and auth-state clearing/redirect after failed recovery.
- Transaction failure injection: required user/token/audit changes roll back together for registration, login/session creation, password change, and password reset.
- Performance: valid-login response under 1 second and access-token validation under 50 ms at p95 using a repeatable environment and sample definition.

## 4. E2E / Manual Acceptance Flow

- Register → verify email → login → view current account → change password → forgot/reset password.

## 5. Current Evidence

- `backend/tests/authRoutes.test.js`
- `backend/tests/authUtils.test.js`
- Focused API evidence: the latest FE02-T043 record reports 33/33 focused backend auth tests, including login validation hardening; earlier TD-018/TD-020 regressions cover repeated reset-token event/idempotency rotation and malformed Bearer-header rejection.
- Focused transport evidence: `backend/tests/httpsEnforcement.test.js` passes `3/3`.
- FE02-T043 records a historical snapshot of 924/924 full backend tests and 209/209 full frontend tests; the historical FE02/FE10 focused slice passed 170/170 before later auth regressions were added. These counts are not current verification results for the open reconciliation.
- Traceability: FR `@spec` coverage **100%** (`npm run trace:enforce`).

## 6. Gaps

- Configured Jest global coverage thresholds pass for statements, branches, functions, and lines.
- Human acceptance, PR integration, and exact post-merge `main` CI passed for the injected FE10 delivery boundary; real SMTP delivery was later observed PASS in live run `c6e0c46421f0`.
- Add an explicit AC-FE02-023 regression proving client role claims cannot override current server-side `UserRoles`.
- Record or link the dedicated H3 integration closeout for FE02-T043.
- Add dedicated backend regressions for valid, expired, used, and wrong-user `CHANGE_PASSWORD_OTP` request/confirm behavior (FE02-T045).
- Record repeatable evidence for NFR-FE02-PERF-001 and NFR-FE02-PERF-004, or approve a documented exception (FE02-T048).
- Add protected-request regressions for a user deactivated or locked after token issuance (FE02-T050).
- Add failure-injection evidence for required auth state/token/audit transaction boundaries (FE02-T052).

Gap ownership:

- FE02-T045: change-password OTP integration evidence.
- FE02-T046: current `UserRoles` authorization evidence.
- FE02-T048: login/token-validation performance evidence.
- FE02-T049: H3 link and human reconciliation approval.
- FE02-T050: current persisted account-state enforcement.
- FE02-T052: authentication transaction/audit atomicity.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
