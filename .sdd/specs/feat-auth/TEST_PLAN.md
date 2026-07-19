# FE02 Test Plan - Authentication

Version: 0.3.1
Status: READY FOR REVIEW - DEBT RECONCILIATION COMPLETE
Last Updated: 2026-07-19

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
- `POST /auth/verify-email`: canonical email/OTP and legacy-token happy paths, invalid OTP, expired OTP, and credential consumption.
- `POST /auth/resend-verification`: happy path, invalid user/state.
- `POST /auth/login`: happy path, wrong password, inactive/unknown public-envelope parity, locked account, and automatic unlock.
- `POST /auth/refresh-token`: happy path, expired token, invalid token.
- Registration role assignment: self-registration creates exactly one `Member` assignment and cannot create Librarian/Admin roles.
- Authorization and transport: protected actions use current `UserRoles`; deployed HTTP auth requests are redirected or rejected before credential processing.
- `POST /auth/logout`: happy path, invalid token.
- `POST /auth/change-password` (+ `/request-otp`, `/confirm`): happy path, wrong old password, reused password, invalid OTP, unauthenticated.
- `POST /auth/forgot-password`, `/reset-password`: generic request semantics; canonical email/OTP and legacy-token success; invalid/expired/reused credential; weak-password no-mutation behavior.
- `POST /auth/reset-password` with `ACCOUNT_SETUP`: atomic activation, invalid/used/revoked/ineligible/concurrent token rejection, and no reset-purpose activation.
- `GET /auth/me`: authenticated happy path, unauthenticated error.

## 4. E2E / Manual Acceptance Flow

- Register → verify email → login → view current account → change password → forgot/reset password.

## 5. Current Evidence

- `backend/tests/authRoutes.test.js`
- `backend/tests/authUtils.test.js`
- Focused API evidence: `backend/tests/authRoutes.test.js` passes 30/30, including TD-018 and TD-020 regressions.
- Traceability: FR `@spec` coverage **100%** (`npm run trace:enforce`).

## 6. Gaps

- No enforced Jest line/branch coverage threshold yet (Week 11 target).
- Final FE01-FE12 human integration acceptance remains outside this focused FE02 automated gate.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
