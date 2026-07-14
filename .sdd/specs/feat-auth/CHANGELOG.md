# CHANGELOG.md - FE02 Authentication

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
