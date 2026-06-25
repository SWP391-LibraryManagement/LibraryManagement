# FE02 Test Plan - Authentication

Version: 0.2.0
Status: READY FOR REVIEW
Last Updated: 2026-06-25

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
- Invalid email/password format validation.
- Account status checks (inactive/locked/auto-unlock).

## 3. API / Integration Test Targets

- `POST /auth/register`: happy path, duplicate email, invalid input.
- `POST /auth/verify-email`: happy path, invalid OTP, expired OTP.
- `POST /auth/resend-verification`: happy path, invalid user/state.
- `POST /auth/login`: happy path, wrong password, unverified user, inactive user, locked account.
- `POST /auth/refresh-token`: happy path, expired token, invalid token.
- `POST /auth/logout`: happy path, invalid token.
- `POST /auth/change-password` (+ `/request-otp`, `/confirm`): happy path, wrong old password, reused password, invalid OTP, unauthenticated.
- `POST /auth/forgot-password`, `/reset-password`: happy path, invalid/expired token.
- `GET /auth/me`: authenticated happy path, unauthenticated error.

## 4. E2E / Manual Acceptance Flow

- Register → verify email → login → view current account → change password → forgot/reset password.

## 5. Current Evidence

- `backend/tests/authRoutes.test.js`
- `backend/tests/authUtils.test.js`
- Traceability: FR `@spec` coverage **100%** (`npm run trace:enforce`).

## 6. Gaps

- No enforced Jest line/branch coverage threshold yet (Week 11 target).
- TD-018: add API tests for duplicate email (FR-FE02-015) and weak password (FR-FE02-019) and for the OTP verify/reset branches.
- TD-019/020: confirm IP-based rate limiting need and the `ACCOUNT_INACTIVE` enumeration message.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
