# CHANGELOG.md - FE02 Authentication

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

## 2026-06-19 - FE02 Auth Fix Review

- Fixed failed-login lock handling so accounts are marked `LOCKED` when the configured threshold is reached.
- Adjusted logout so a valid refresh token can be revoked without requiring a still-valid access token.
- Updated auth route tests and in-memory repository behavior for the lock/logout fixes.
