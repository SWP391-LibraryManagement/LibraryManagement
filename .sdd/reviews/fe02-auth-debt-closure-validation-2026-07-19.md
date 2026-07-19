# FE02 Authentication Debt Closure Validation - 2026-07-19

Status: FULL LOCAL BACKEND PASS; PR CI AND HUMAN ACCEPTANCE PENDING

Scope: `TD-018`, `TD-019`, and `TD-020` in draft PR #40.

## Contract Decisions

- `TD-018` was a test-evidence gap. The approved FE02 API already supports canonical `{ email, otp }` verification/reset and rejects duplicate registration and weak passwords.
- `TD-019` requires no implementation. `Q-FE02-005`, `BR-FE02-008`, and `NFR-FE02-SEC-005` approve known-account lockout for Phase 1 and explicitly state that IP-wide login limiting is not implemented.
- `TD-020` was a public authentication defect. `BR-FE02-007` and `NFR-FE02-SEC-010` require login responses not to disclose whether an email is registered, while `AC-FE02-007` requires only that inactive login be rejected.

## RED Evidence

Command:

```powershell
npm.cmd test -- --runInBand --runTestsByPath tests/authRoutes.test.js
```

Initial focused result after adding the regressions: 29 passed, 1 failed.

- Inactive login returned `403 ACCOUNT_INACTIVE`.
- Unknown login returned `401 INVALID_CREDENTIALS`.
- The response parity assertion failed exactly at the enumeration boundary.

## Minimal Production Change

`backend/src/services/authService.js` retains the internal `AUTH_LOGIN_INACTIVE` audit event but returns the generic `401 INVALID_CREDENTIALS` public envelope used by unknown email and invalid password branches.

Locked-account behavior remains unchanged because `FR-FE02-017` and `AC-FE02-008` explicitly require the account-lock message.

No route, schema, dependency, credential, token lifetime, lock threshold, or frontend behavior changed.

## GREEN Evidence

Focused result: **1/1 suite, 30/30 tests passed**.

New API evidence proves:

- duplicate registration returns `409 EMAIL_ALREADY_REGISTERED` without another user, token, notification request, notification, or direct email;
- weak registration returns `400 WEAK_PASSWORD` without auth-state persistence;
- canonical email/OTP verification activates the account and consumes the verification OTP;
- canonical email/OTP reset updates the password and consumes the reset OTP;
- weak canonical reset changes neither password nor reset credential;
- inactive and unknown logins return the same `401 INVALID_CREDENTIALS` response.

Fresh affected/full evidence:

- backend regression: 52/52 suites, 893/893 tests;
- backend coverage gate: 92.69% statements, 81.79% branches, 96.55% functions, 92.62% lines;
- system integration: 1/1 suite, 10/10 tests;
- FE01-FE12 traceability: every feature 100%, enforcement PASS;
- JavaScript syntax, high-confidence secret scan, and diff hygiene: PASS.

## Remaining Gate

Run draft PR CI on the committed head. Final FE01-FE12 human integration acceptance remains required by the project Definition of Done.
