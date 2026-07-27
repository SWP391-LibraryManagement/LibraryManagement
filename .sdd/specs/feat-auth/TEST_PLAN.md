# FE02 Test Plan - Authentication

Version: 0.3.15
Status: RECONCILIATION IN PROGRESS - BASELINE EVIDENCE RECORDED; GAPS OPEN
Last Updated: 2026-07-28

Source Spec: `.sdd/specs/feat-auth/SPEC.md`
Feature IDs: `BR-FE02-*`, `FR-FE02-*`, `AC-FE02-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Registration, email verification, login, token refresh/logout, current-user lookup, forgot/reset password, and change password behavior.

## 2. Unit Test Targets

- Password hashing and password comparison.
- Token creation, verification, and expiry handling.
- Staging startup reconciliation for the `CHANGE_PASSWORD_OTP` token-type constraint.
- Exact 30-second JWT clock-skew tolerance.
- OTP/reset token validation.
- FE11 account-setup token validation and atomic activation.
- Invalid email/password format validation.
- Account status checks (inactive/locked/auto-unlock).

## 3. API / Integration Test Targets

- `POST /auth/register`: happy path; duplicate username/email including concurrent unique-index races with no additional persistence/delivery; weak password with no persistence; invalid input.
- FE02/FE10 OTP boundary: registration and password-reset flows submit exactly one FE02-bound requester call with `AuthToken` source ID and token-ID idempotency; direct duplicate delivery is rejected while `CHANGE_PASSWORD_OTP` remains FE02-owned.
- `POST /auth/verify-email`: canonical email/OTP and legacy-token happy paths, invalid/expired credentials, atomic activation/token/audit completion, and rejection of terminally deactivated accounts without credential consumption.
- `POST /auth/resend-verification`: eligible pending self-registration, unknown user, deactivated account, and admin-created setup account.
- `POST /auth/login`: happy path, wrong password, exact rolling 15-minute failure window, password-proven pending-verification recovery, generic handling for unknown/deactivated/admin-created setup accounts including deactivated pending self-registration, locked account, guarded automatic unlock, concurrent deactivation during failed/successful login, and safe reason/lock audit events.
- `POST /auth/refresh-token`: happy path, expired token, invalid token.
- Registration role assignment: self-registration creates exactly one `Member` assignment and cannot create Librarian/Admin roles.
- Authorization and transport: protected actions use current `UserRoles`; deployed HTTP auth requests are redirected or rejected before credential processing.
- Protected-request current state: tokens issued before a user becomes `INACTIVE` or `LOCKED` are rejected before business processing while active linked sessions continue to work.
- Protected-token failures: debug logging contains only the stable error code, never the submitted token, and is disabled unless explicitly configured.
- HTTPS transport: plain HTTP auth requests are rejected before body/auth dispatch, trusted proxy HTTPS is accepted, and an explicit canonical-host redirect mode is tested.
- `POST /auth/logout`: happy path, invalid token.
- `POST /auth/change-password` (+ `/request-otp`, `/confirm`): happy path, wrong old password, reused password, invalid OTP, unauthenticated.
- `POST /auth/forgot-password`, `/reset-password`: generic request semantics; canonical email/OTP and legacy-token success; invalid/expired/reused credential; weak-password no-mutation behavior.
- `POST /auth/reset-password` with `ACCOUNT_SETUP`: atomic activation, invalid/used/revoked/ineligible/concurrent token rejection, and no reset-purpose activation.
- `GET /auth/me`: authenticated happy path, unauthenticated error.
- FE02 frontend recovery: one refresh attempt after 401, replacement access-token persistence in the selected storage, no retry loop, auth-state clearing/redirect after failed recovery, and `/verify-email` navigation after the stable pending-verification login response.
- Transaction failure injection: required user/token/audit changes roll back together for registration, login/session creation, password change, and password reset.
- Performance: valid-login response under 1 second and access-token validation under 50 ms at p95 using a repeatable environment and sample definition.

## 4. E2E / Manual Acceptance Flow

- Register → verify email → login → view current account → change password → forgot/reset password.

## 5. Current Evidence

- `backend/tests/authRoutes.test.js`
- `backend/tests/authUtils.test.js`
- Focused FE02 evidence: 62/62 auth route/repository tests pass on 2026-07-28, including existing and concurrent duplicate username/email rejection before verification state, current-state login writes, stale auto-unlock rejection, terminal-deactivation verification guards, required-audit rollback, safe auth logging, and exact rolling lockout.
- Frontend evidence: 242/242 tests, lint, and production build pass on 2026-07-28; registration keeps duplicate username/email feedback before the OTP step, while login still navigates eligible pending self-registration to `/verify-email`.
- Cross-feature inactive-account evidence: FE04/FE07/FE08 focused suites pass 114/114 with FE02's pre-handler `401 INVALID_TOKEN` contract.
- Full backend rerun: 60/61 suites and 1048/1050 tests pass; all FE02 suites pass, and only the two pre-existing `dbConfig.test.js` DNS/mock-isolation assertions against `sql.example.test` fail.
- Focused transport evidence: `backend/tests/httpsEnforcement.test.js` passes `3/3`.
- FE02-T043 records a historical snapshot of 924/924 full backend tests and 209/209 full frontend tests; the historical FE02/FE10 focused slice passed 170/170 before later auth regressions were added. These counts are not current verification results for the open reconciliation.
- Traceability: all 27 FE02 FR IDs have `@spec` coverage (**100%**) under `npm run trace:enforce`.
- Performance evidence: `npm.cmd run phase3:performance` on 2026-07-27 passes NFR-FE02-PERF-001/004 in the documented local deterministic environment: 30 valid-login samples at p95 `61.46 ms` and 50 `/api/auth/me` samples at p95 `1.52 ms`, with bcrypt cost 10; the harness tests pass 3/3 and its SQL/network limitations remain documented.

## 6. Gaps

- Configured Jest global coverage thresholds pass for statements, branches, functions, and lines.
- Human acceptance, PR integration, and exact post-merge `main` CI passed for the injected FE10 delivery boundary; real SMTP delivery was later observed PASS in live run `c6e0c46421f0`.
- Record or link the dedicated H3 integration closeout for FE02-T043.

Gap ownership:

- FE02-T049: H3 link and human reconciliation approval.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
