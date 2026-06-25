# FE02 Test Plan - Authentication

Version: 0.1.0
Status: DRAFT - pending team review
Last Updated: 2026-06-22

Source Spec: `.sdd/specs/feat-auth/SPEC.md`
Feature IDs: `BR-FE02-*`, `FR-FE02-*`, `AC-FE02-*`

---

## 1. Test Scope

Registration, email verification, login, token refresh/logout, current-user lookup, forgot/reset password, and change password behavior.

## 2. Unit Test Targets

- Password hashing and password comparison.
- Token creation, verification, and expiry handling.
- OTP/reset token validation.
- Invalid email/password format validation.
- Account status checks.

## 3. API / Integration Test Targets

- `POST /auth/register`: happy path, duplicate email, invalid input.
- `POST /auth/verify-email`: happy path, invalid OTP, expired OTP.
- `POST /auth/resend-verification`: happy path, invalid user/state.
- `POST /auth/login`: happy path, wrong password, unverified user, inactive user.
- `POST /auth/refresh-token`: happy path, expired token, invalid token.
- `POST /auth/logout`: happy path, invalid token.
- `POST /auth/change-password`: happy path, wrong old password, unauthenticated.
- `POST /auth/change-password/request-otp`: happy path, unauthenticated.
- `POST /auth/change-password/confirm`: happy path, invalid OTP.
- `POST /auth/forgot-password`: happy path, invalid email format.
- `POST /auth/reset-password`: happy path, invalid/expired token.
- `GET /auth/me`: authenticated happy path, unauthenticated error.

## 4. E2E / Manual Acceptance Flow

- User registers.
- User verifies email.
- User logs in.
- User views current account.
- User changes password.
- User performs forgot/reset password flow.

## 5. Current Evidence

- `backend/tests/authRoutes.test.js`
- `backend/tests/authUtils.test.js`

## 6. Gaps

- Coverage threshold is not enforced yet.
- Week 11 Test Engine must confirm every auth endpoint has happy and error path coverage.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
node scripts/check-traceability.js
```
