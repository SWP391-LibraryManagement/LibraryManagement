# CHANGELOG.md - FE02 Authentication

## 2026-07-20 - Vietnamese UI localization and typography

- Localized frontend-generated labels, states, accessibility names, and safe error feedback for this feature.
- Preserved API contracts, raw enum values, permissions, business rules, and user-owned catalog/profile data.
- Applied the shared `Be Vietnam Pro` body and `Noto Serif` heading typography contract with Unicode-capable fallbacks.

## 2026-07-19 - Phase 2 Exit Closeout

- feat-auth is accepted within the complete Phase 2 FE01-FE12 reconciliation recorded by PR #40/#41; validation and residual boundaries are consolidated in `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- FE02/FE10 OTP delivery follow-up is additionally closed through PR #42/#43/#44 with exact post-merge `main` CI evidence.
- Deferred and future-scope limitations remain explicit and are not widened by this closeout.

## 2026-07-19 - OTP Delivery B7 Closeout

- FE02-T033 is complete through B7 after PR #42 merged as `34d9180`; PR CI `29688102867` and exact post-merge `main` CI `29688222757` passed.
- The approved FE02-bound FE10 OTP delivery boundary now has complete ownership, leakage, failure, and token-rotation evidence. Real SMTP and unrelated FE02 follow-up remain out of scope.

## 2026-07-19 - OTP Delivery Acceptance And Boundary Evidence

- Expanded ADR-004 evidence so every allowlisted non-FE02 requester is rejected for both verification and reset types with no persistence, attempt, audit, or provider side effects.
- Added repeated forgot-password coverage proving a new token ID and idempotency key are created without a direct FE02 email path.
- Focused FE02/FE10 validation passes 170/170; full backend passes 916/916 with coverage above configured thresholds; traceability remains 26/26.
- The user approved the FE10 OTP design and granted standing human acceptance for the injected-provider scope. Integration PR and exact post-merge `main` CI remain required before B7 closeout.

## 2026-07-19 - HTTPS transport enforcement

- Added a deployment-aware HTTPS middleware before JSON parsing and auth route dispatch.
- Plain HTTP authentication requests now reject with `400 HTTPS_REQUIRED` by default; optional `HTTPS_REDIRECT=true` redirects only to a validated `HTTPS_CANONICAL_HOST`.
- Trusted reverse-proxy deployments may pass `X-Forwarded-Proto: https` only when `TRUST_PROXY=true`; focused transport tests pass `3/3`.

## 2026-07-19 - API Evidence And Login Enumeration Reconciliation

- Added API regressions for duplicate registration and weak registration/reset passwords with explicit no-persistence assertions.
- Added canonical `{ email, otp }` verification and password-reset coverage, including OTP consumption and password-state assertions.
- Kept the internal `AUTH_LOGIN_INACTIVE` audit event while returning the same public `401 INVALID_CREDENTIALS` envelope for inactive and unknown accounts.
- Closed the IP-wide rate-limit question as an approved Phase 1 non-goal under `Q-FE02-005`, `BR-FE02-008`, and `NFR-FE02-SEC-005`.
- Focused `authRoutes.test.js` validation passes 30/30; full backend regression passes 893/893 with coverage, system integration, and traceability green; PR CI run `29680011551` passes on implementation commit `0040e0f`.

## 2026-07-19 - OTP Requester And Refresh Reconciliation

- Fanned the FE02 verification/reset requester into the canonical FE10 sensitive-provider boundary with token-ID idempotency and no duplicate direct delivery path.
- Preserved non-blocking provider failure, resend token rotation, legacy token acceptance, and direct `CHANGE_PASSWORD_OTP` ownership.
- Aligned refresh exchange with FR-FE02-026 by returning the submitted refresh token unchanged.
- The current FE02/FE10 focused cross-feature gate passes 154/154 with FE02 traceability 26/26; final human closeout remains open.

## 2026-07-19 - FE11 Finalization Schema Contract Activated

- Bumped `SPEC.md` to 0.6.3 and activated the shared FE11 migration dependency without changing FE02 login, registration, OTP, refresh, or setup-consumption behavior.
- Confirmed `Users.Email` at 255 characters and documented FE11's non-null managed-user concurrency version as `COALESCE(UpdatedAt, CreatedAt)` for nullable legacy rows.
- The FE11 shared schema migration subsequently passed two disposable SQL Server executions; see the full-reconciliation Live SQL review.

## 2026-07-17 - Phase 1 Baseline Approved

- Nhật approved the normalized FE02 specification and implementation contract as the Phase 1 baseline; at that historical checkpoint, OTP delivery follow-up remained implementation-pending and was later superseded by the FE02/FE10 implementation recorded on 2026-07-19.
- Clarified that the baseline review is complete while implementation changes still require focused validation and human review before merge.

## 2026-07-17 - Final Lifecycle And Contract Audit

- Restricted lock recovery to successful password reset or automatic expiry; Phase 1 has no admin-unlock action.
- Defined password-reset eligibility for `ACTIVE`/`LOCKED` accounts and documented compatibility-only `CHANGE_PASSWORD_OTP` behavior.
- Replaced non-deterministic performance and resend wording with explicit Phase 1 contract rules.

## 2026-07-17 - Auth Policy And Account Lifecycle Hardening

- Bumped `SPEC.md` to 0.6.2.
- Fixed lockout to 5 consecutive failures in 15 minutes, 10 login requests per IP in 15 minutes, and 30-minute automatic unlock.
- Defined refresh-token rotation, logout revocation, and password-change revocation of other sessions.
- Aligned persisted account statuses with SQL and introduced nullable `Users.DeactivatedAt` as a required migration for FE11 deactivation semantics.

## 2026-07-17 - Deterministic Registration, Setup, And Refresh Contract

- Bumped `SPEC.md` to 0.6.1 and kept the revision `READY FOR REVIEW`.
- Made self-registration assign exactly the `Member` role; FE11 exclusively owns Librarian/Admin account creation.
- Fixed `ACCOUNT_SETUP` expiry at exactly 24 hours and removed the stale password-reset activation transition.
- Clarified that refresh-token exchange validates the refresh token itself and does not require an access token.
- Added deterministic acceptance and traceability coverage for role assignment, server-side role checks, and HTTPS enforcement.

## 2026-07-15 - Account Setup Implementation And Validation

- Added atomic FE11 `ACCOUNT_SETUP` consumption for eligible inactive admin-created accounts.
- Setup completion now stores the chosen password, verifies/activates the account, resets lock fields, consumes one token, revokes siblings, and writes the auth audit in one transaction.
- Added the `/forgot-password?token=...` frontend mode with password-only setup, safe invalid-link feedback, and no token rendering, logging, or storage.
- Password-reset credentials remain unable to activate inactive accounts.
- Task 7 automated evidence passed: 170/170 affected backend tests, 75/75 frontend tests, touched-file lint, production build, traceability, credential scan, and diff checks.
- Nhat confirmed the final cross-feature validation packet; `FE02-T037` is complete.

## 2026-07-15 - FE11 Account Setup Consumption Revision

- Bumped `SPEC.md` to 0.6.0 and marked the combined OTP/account-setup revision ready for review.
- Separated password reset from canonical FE11 account setup while preserving the existing token request shape.
- Defined FE02 as the setup-token consumer and atomic activation owner; FE11 remains issuer/resend owner and FE10 remains delivery owner.
- Added BR-FE02-023..025, FR-FE02-024..025, AC-FE02-020..021, EC-FE02-016..017, Q-FE02-013, and NFR-FE02-TXN-005.
- Added FE02-T034..T037 for RED tests, atomic implementation, and cross-feature validation.

## 2026-07-15 - FE10 OTP Delivery Ownership Alignment

- Bumped `SPEC.md` from version `0.4.0` to `0.5.0` and aligned `CONTEXT.md` with ADR-004.
- Kept FE02 as the owner of verification/reset OTP generation, hashing, expiry, revocation, validation, and legacy-token compatibility.
- Made the FE10 requester bound to `FE02` the single delivery boundary for account-verification and password-reset OTP email.
- Defined `AuthTokens.TokenId` source traceability and idempotency; resend creates a new token ID and notification key.
- Prohibited duplicate direct email sends and direct notification-record writes for verification/reset while retaining direct FE02 email for `CHANGE_PASSWORD_OTP`.
- Prohibited `debugOtp`, `debugVerificationToken`, and `debugResetToken` HTTP response fields; implementation tests must capture deterministic OTPs through injected dependencies.
- Defined non-blocking FE10 failure semantics: user/token state and generic public responses remain valid, no OTP is exposed, and resend remains available.
- Replaced conceptual token tables/fields in the data section with the actual shared `AuthTokens` contract.

## 2026-07-15 - Authentication/OTP UX B7 Closeout

- Recorded human acceptance and merge evidence for `FE02-T024` through `FE02-T028`.
- Remediated the system golden path to use the accessible password textbox, the approved `/home` login destination, and the deterministic integration clock.
- GitHub Actions CI run `29358045198` passed on final `main` commit `6eee459`; detailed evidence is in `.sdd/reviews/library-ux-b7-integration-closeout-2026-07-15.md`.

## 2026-07-14 - OTP UX Contract Alignment

- Bumped `SPEC.md` version 0.3.0 -> 0.4.0 to document the implemented six-digit email OTP flow for registration verification and password reset.
- Preserved legacy verification/reset token payloads for compatibility and FE11 account setup.
- Approved a 60-second client resend cooldown and recorded the Authentication/OTP UX hardening plan in `docs/superpowers/plans/2026-07-14-auth-otp-ux.md`.

## 2026-06-25 - FE02 Formal State Model

- Bumped SPEC.md version 0.2.0 -> 0.3.0 (MINOR); status unchanged (APPROVED).
- Added formal State Model & Transition Rules (state diagram + valid/invalid transitions + invariants) for User account lifecycle.

## 2026-06-03

- Created FE02 Authentication feature specification structure.
- Established specification files: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md, and CHANGELOG.md.
- Prepared for detailed authentication requirements including login, logout, session management, and role-based access control.
- Ready to add stable requirement IDs for business rules, functional requirements, acceptance criteria, edge cases, and open questions.
- Clarified password setup support for FE11 admin-created inactive accounts.

## 2026-06-10

- Updated FE02 assignment mapping to match the latest Excel sheet: UC05-UC10 and FT05-FT11.
- Replaced placeholder owner in CONTEXT.md with Dat.
- Updated traceability matrix test mappings from the old FT01-FT08 range to the current FT05-FT11 range.
- Updated API contract policy to allow approval in `SPEC.md` unless the team reintroduces a shared API contract document.
- Adjusted current data model notes to match the SQL script more closely.

## 2026-06-10 - Phase 1 Review Decisions Approved

- Approved open-question decisions from `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Updated `SPEC.md` decision status from draft/proposed/open to approved where applicable.
- Preserved Phase 1 scope controls and deferred future-work items explicitly.

## 2026-06-10 - FE02 Foundation Slice Implemented

- Added backend foundation folders for config, routes, controllers, services, repositories, middleware, validators, and utils.
- Replaced the backend placeholder test script with Jest and added baseline health tests.
- Implemented FE02 vertical-slice routes for `register`, `verify-email`, `login`, and protected `/me`.
- Added server-side password policy, token helpers, safe error handling, and auth middleware.
- Added SQL Server repository scaffolding with parameterized queries for users, auth tokens, audit logs, and notifications.
- Added in-memory test repositories so the FE02 slice can run in CI without a live database.
- Updated CI to run backend tests and frontend lint before build.

## 2026-06-10 - FE02 Ready For Review

- Finished the remaining auth endpoints: resend verification, refresh token, logout, change password, forgot password, and reset password.
- Added tests for the FE02 cases from FT05 to FT11.
- Connected the current login, register, and forgot-password screens to the auth API.
- Marked FE02 `PLAN.md`, `TASKS.md`, and traceability as ready for review.

## 2026-06-25 - FE02 EARS Unwanted Requirements Hardening

- Bumped SPEC.md version 0.1.0 -> 0.2.0 (MINOR); status unchanged (APPROVED).
- Promoted error-handling branches to formal Unwanted FRs (FR-FE02-015..FR-FE02-021) to meet the EARS â‰¥30% Unwanted standard from Spec-Driven Development. No new logic introduced; each FR traces to an existing AF/EC/BR.
  - FR-FE02-015: Reject registration with already-registered email; no new user created. (AF-FE02-001, EC-FE02-003, BR-FE02-001)
  - FR-FE02-016: Reject expired/malformed verification token; keep account INACTIVE, offer resend. (AF-FE02-002, BR-FE02-004)
  - FR-FE02-017: Reject login to LOCKED account with lock message. (AF-FE02-003, BR-FE02-009)
  - FR-FE02-018: Reject already-used/expired reset token; no password change. (AF-FE02-005, BR-FE02-014)
  - FR-FE02-019: Reject password not meeting complexity policy; do not persist. (AF-FE02-007, BR-FE02-005, Q-FE02-001)
  - FR-FE02-020: Reject password change reusing current password. (AF-FE02-006)
  - FR-FE02-021: Reject protected request with malformed/invalid/expired token (401). (AF-FE02-004, EC-FE02-014, BR-FE02-012)
- Added a "7.1 Unwanted Behavior Requirements (EARS)" subsection and an Unwanted-FR traceability table in Section 16; updated Coverage Summary (Total FR 14 -> 21, Unwanted FR 7 = 33.3%).

## 2026-06-19 - FE02 Auth Fix Review

- Fixed failed-login lock handling so accounts are marked `LOCKED` when the configured threshold is reached.
- Adjusted logout so a valid refresh token can be revoked without requiring a still-valid access token.
- Updated auth route tests and in-memory repository behavior for the lock/logout fixes.
