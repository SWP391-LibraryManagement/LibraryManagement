# TASKS.md - FE02 Authentication

Status: APPROVED - BASELINE 2026-07-17; IMPLEMENTATION FOLLOW-UP PENDING
Date: 2026-07-15
Owner: Dat

## Task Rules

- Implement only FE02 Authentication behavior from `SPEC.md` and `PLAN.md`.
- Do not implement FE11 admin user management in these tasks.
- Each task must keep raw passwords/tokens out of logs and source control.
- Backend validation and authorization are mandatory.
- Tests are required for core auth behavior.

## Tasks

| ID | Task | Spec Mapping | Dependencies | DoD |
| --- | --- | --- | --- | --- |
| FE02-T001 | Create backend architecture folders for FE02 (`routes`, `controllers`, `services`, `repositories`, `validators`, `middleware`, `config`, `utils`). | ADR-001 | None | Folders exist; app still imports and `/health` works. |
| FE02-T002 | Add environment/config module for JWT, bcrypt cost, token expiry, DB config, and safe defaults. | NFR-FE02-SEC | FE02-T001 | No secrets hardcoded; missing required config fails safely outside test mode. |
| FE02-T003 | Add SQL Server DB connection helper using `mssql`. | ADR-002 | FE02-T002 | Connection module uses env vars and exposes query/transaction helpers. |
| FE02-T004 | Implement common error handler and safe error response helper. | SAFE-005, NFR-FE02-SEC | FE02-T001 | Controllers return safe errors without stack traces. |
| FE02-T005 | Implement password policy utility and tests. | BR-FE02-001, BR-FE02-006 | FE02-T001 | Tests cover valid password and missing uppercase/number/special/min length. |
| FE02-T006 | Implement token utility for random tokens, token hashing, JWT access token signing/verification. | BR-FE02-010, BR-FE02-014 | FE02-T002 | Unit tests cover expiry config, hash compare, invalid token behavior. |
| FE02-T007 | Implement repositories: `userRepository`, `authTokenRepository`, `auditLogRepository`. | FR-FE02-001 to FR-FE02-014 | FE02-T003 | All SQL uses parameterized queries; no raw token lookup except hashed token. |
| FE02-T008 | Implement optional/mock notification repository/service adapter for verification/reset emails. | FR-FE02-003, FR-FE02-011; FE10 dependency | FE02-T007 | Creates safe notification record or no-op mock; raw token is not logged. |
| FE02-T009 | Implement auth validators with `express-validator`. | FR-FE02-001, FR-FE02-004, FR-FE02-010 to FR-FE02-012 | FE02-T001 | Invalid requests return 400 with safe validation errors. |
| FE02-T010 | Implement registration service and controller. | UC05; AC-FE02-001 to AC-FE02-003, AC-FE02-022 | FE02-T005, FE02-T007, FE02-T008, FE02-T009 | Valid self-registration creates an inactive Member, hashes the password, creates the verification token, and returns 201. |
| FE02-T011 | Implement email verification and resend verification. | UC05; FR-FE02-003; AC-FE02-002, AC-FE02-003 | FE02-T010 | Valid token activates account; expired/used token fails safely; resend avoids enumeration. |
| FE02-T012 | Implement login service/controller with failed-login counter and lock handling. | UC06; AC-FE02-004 to AC-FE02-010 | FE02-T006, FE02-T007, FE02-T009 | Valid active user receives access/refresh token; invalid/inactive/locked cases fail safely. |
| FE02-T013 | Implement auth middleware and `/api/auth/me`. | FR-FE02-008, FR-FE02-009; AC-FE02-009, AC-FE02-010 | FE02-T006, FE02-T012 | Valid access token sets `req.user`; missing/expired token returns 401. |
| FE02-T014 | Implement refresh token endpoint. | BR-FE02-010; API contract | FE02-T006, FE02-T007, FE02-T012 | Valid refresh token returns new access token; expired/revoked token fails. |
| FE02-T015 | Implement logout endpoint. | UC07; FR-FE02-007; AC-FE02-011 | FE02-T014 | Refresh token is revoked; repeated logout is safe. |
| FE02-T016 | Implement change password endpoint. | UC08; FR-FE02-010; AC-FE02-012, AC-FE02-013 | FE02-T013, FE02-T005, FE02-T007 | Requires valid current password; updates hash; audits attempt/result. |
| FE02-T017 | Implement forgot password endpoint. | UC09; FR-FE02-011; AC-FE02-014, AC-FE02-015 | FE02-T007, FE02-T008, FE02-T009 | Always returns generic success; creates reset token only for eligible account. |
| FE02-T018 | Implement reset password endpoint. | UC10; FR-FE02-012; AC-FE02-016 to AC-FE02-018 | FE02-T017, FE02-T005 | Valid token resets password and marks token used; expired/used token rejected. |
| FE02-T019 | Wire auth routes into Express app. | API contract | FE02-T010 to FE02-T018 | All `/api/auth/*` endpoints are reachable; existing `/health` still works. |
| FE02-T020 | Add integration tests for register, verify, login, refresh, logout, change password, forgot/reset, and `/me`. | FT05 to FT11 | FE02-T019 | Jest/Supertest tests pass locally; failures block merge. |
| FE02-T021 | Add frontend API client stubs for auth endpoints. | API contract; UI integration | FE02-T019 | `frontend/src/api/authApi.js` exports endpoint functions; frontend build passes. |
| FE02-T022 | Connect existing login/register/forgot password pages to auth API behind minimal user feedback. | UC05, UC06, UC09 | FE02-T021 | Forms call API; no sensitive values logged; frontend build passes. |
| FE02-T023 | Update FE02 CHANGELOG and implementation notes. | Definition of Done | FE02-T020 | Changelog records implementation scope, tests, and remaining risks. |
| FE02-T024 | Align FE02 and API documentation with the implemented six-digit OTP plus legacy token compatibility. | FR-FE02-002, FR-FE02-003, FR-FE02-011, FR-FE02-012; Q-FE02-011 | FE02-T023 | SPEC, PLAN, TASKS, CHANGELOG, and API examples agree with the implemented request shapes. |
| FE02-T025 | Add pure frontend auth UX helpers and regression tests. | NFR-FE02-UX-002, NFR-FE02-UX-005 to NFR-FE02-UX-007 | FE02-T024 | Email masking, password guidance, field errors, six-digit OTP normalization, and 60-second cooldown are tested. |
| FE02-T026 | Implement two-step registration and email verification UX. | AC-FE02-001 to AC-FE02-003; UX-FE-002 to UX-FE-005 | FE02-T025 | Safe values survive recoverable failures; OTP receives focus; resend prevents duplicates and shows cooldown. |
| FE02-T027 | Align login and forgot/reset password UX with the shared auth patterns. | AC-FE02-004 to AC-FE02-008, AC-FE02-014 to AC-FE02-018 | FE02-T025 | Login routes through `/home`; recovery keeps generic feedback, masked email, OTP focus, password guidance, and completion action. |
| FE02-T028 | Run the Authentication/OTP validation and human-review gate. | Definition of Done; AC-UX-001 to AC-UX-003, AC-UX-007, AC-UX-008 | FE02-T026, FE02-T027 | Targeted tests, lint, build, source checks, responsive review, and human acceptance are recorded. |

`FE02-T008` is retained as historical evidence for the initial mock/direct-delivery slice. ADR-004 and the follow-up tasks below supersede it for account-verification and password-reset OTP delivery.

## Suggested Implementation Order

1. FE02-T001 to FE02-T009: foundation, config, validation, repositories, utilities.
2. FE02-T010 to FE02-T012: register/verify/login.
3. FE02-T013 to FE02-T018: middleware, tokens, logout, password flows.
4. FE02-T019 to FE02-T020: route wiring and integration tests.
5. FE02-T021 to FE02-T022: frontend API integration.
6. FE02-T023: documentation closeout.
7. FE02-T024 to FE02-T028: approved Authentication/OTP UX hardening and validation.

## Minimum Sprint 1 Completion Slice

If time is limited, complete this secure vertical slice first:

- FE02-T001 to FE02-T013
- FE02-T019
- Integration tests for register -> verify -> login -> `/me`

Password reset and frontend integration may follow only if the team explicitly scopes Sprint 1 that way.

## Authentication/OTP UX B7 Evidence

- [x] `FE02-T024` through `FE02-T028` completed implementation and targeted validation.
- [x] Nhat confirmed the App Shell and Authentication/OTP human review gates.
- [x] Merge commit `01c66ef` reached `main` and `origin/main`.
- [x] E2E remediation commit `232ee4c` aligned the golden path with the approved `/home` and accessible login contracts.
- [x] Final `main` commit `6eee459` passed GitHub Actions CI run `29358045198`.
- [x] B7 evidence is recorded in `.sdd/reviews/library-ux-b7-integration-closeout-2026-07-15.md`.

This evidence closes the Authentication/OTP UX task group only; the FE02 baseline is approved while OTP delivery implementation follow-up remains pending.

## FE02/FE10 OTP Delivery Follow-up Tasks

- [x] **FE02-T029 - Normalize the approved OTP delivery contract.**
  - Maps to: BR-FE02-020 to BR-FE02-022; FR-FE02-002, FR-FE02-011, FR-FE02-022, FR-FE02-023; AC-FE02-001, AC-FE02-014, AC-FE02-019; ADR-004.
  - Files: `.sdd/specs/feat-auth/CONTEXT.md`, `SPEC.md`, `PLAN.md`, `TASKS.md`, `CHANGELOG.md`, `.sdd/rfcs/ADR-004-auth-otp-notification-boundary.md`.
  - DoD: FE02 and FE10 agree on OTP variables, source ownership, token-ID idempotency, single delivery ownership, non-blocking failure, resend semantics, and `CHANGE_PASSWORD_OTP` exclusion; no implementation files change.

- [ ] **FE02-T030 - Add RED requester-integration tests.**
  - Maps to: BR-FE02-020, BR-FE02-021; FR-FE02-002, FR-FE02-011, FR-FE02-022; AC-FE02-001, AC-FE02-014.
  - Files: `backend/tests/authRoutes.test.js`, `backend/tests/helpers/inMemoryAuthRepositories.js`.
  - DoD: failing tests prove register, resend verification, and forgot password make exactly one FE10 requester call containing `otp`, `expiresInMinutes`, `AuthToken`, token ID, and token-ID idempotency; tests reject direct notification writes, direct verification/reset email sends, and `debugOtp`/`debugVerificationToken`/`debugResetToken` HTTP fields.

- [ ] **FE02-T031 - Migrate verification/reset delivery to FE10.**
  - Maps to: BR-FE02-020, BR-FE02-021; FR-FE02-002, FR-FE02-011, FR-FE02-022.
  - Dependencies: FE10-S02 and FE10-S03.
  - Files: `backend/src/services/authService.js`, `backend/src/repositories/authTokenRepository.js`, `backend/tests/helpers/inMemoryAuthRepositories.js`, `backend/tests/authRoutes.test.js`.
  - DoD: `createOtpToken` returns the persisted token record; verification/reset call only the requester bound to `FE02`; duplicate direct notification/email paths and HTTP debug-token fields are removed; tests capture OTPs through injected dependencies; legacy token acceptance and direct `CHANGE_PASSWORD_OTP` email remain unchanged.

- [ ] **FE02-T032 - Lock non-blocking failure and resend behavior.**
  - Maps to: BR-FE02-022; FR-FE02-023; AC-FE02-019; EC-FE02-009.
  - Files: `backend/tests/authRoutes.test.js`, `backend/src/services/authService.js`.
  - DoD: FE10 `FAILED` status or safe exception does not roll back user/token state or alter generic forgot-password semantics; no OTP reaches logs/audits/responses; resend creates a new token ID and notification key.

- [ ] **FE02-T033 - Pass the cross-feature validation gate.**
  - Maps to: ADR-004 verification contract and all FE02 follow-up requirements.
  - Dependencies: FE02-T030 to FE02-T032; FE10-S02 to FE10-S04.
  - Files: `.sdd/specs/feat-auth/TASKS.md`, `.sdd/specs/feat-auth/CHANGELOG.md`; implementation files change only for review fixes.
  - DoD: focused FE02/FE10 tests and affected integration tests pass; traceability and secret scans pass; `git diff --check` passes; human review confirms `CHANGE_PASSWORD_OTP` and legacy-token behavior were not widened.

## FE02/FE11 Account Setup Tasks

- [x] **FE02-T034 - Draft the canonical setup-consumption contract.**
  - Maps to: BR-FE02-023..025; FR-FE02-024..025; AC-FE02-020..021; ADR-005.
  - DoD: FE02, FE10, and FE11 agree on inactive initial state, ownership, atomic completion, failure, resend, and credential exposure; implementation files remain unchanged.
  - Review state: Nhat reviewed the approved contract before implementation.

- [x] **FE02-T035 - Add RED setup-completion tests.**
  - Files: `backend/tests/authRoutes.test.js`, auth test repositories/helpers.
  - DoD: failing tests prove valid atomic activation and rejection of expired, used, revoked, ineligible, reset-purpose, and concurrently consumed credentials.
  - Evidence: RED coverage was implemented with the atomic completion slice and committed in `57068d2`.

- [x] **FE02-T036 - Implement atomic setup completion.**
  - Dependencies: FE02-T035, FE11-S04.
  - Files: auth service and user/token/audit repositories.
  - DoD: one transaction updates password, verification/status/lock fields, token usage/revocation, and audit; password-reset behavior cannot activate inactive accounts.
  - Evidence: implementation commit `57068d2`; affected backend validation passed 170/170 tests.

- [x] **FE02-T037 - Validate the account-setup boundary.**
  - Dependencies: FE02-T036, FE11-S03..S06.
  - DoD: focused cross-feature tests, traceability, secret scans, and `git diff --check` pass; Nhat completes human review.
  - Validation state: PASS on 2026-07-15; Nhat confirmed the final Task 7 human review.

- [x] **FE02-T038 - Normalize the FE02 business contract for cross-feature review.**
  - Maps to: BR-FE02-014, BR-FE02-015, BR-FE02-017; FR-FE02-013, FR-FE02-014; AC-FE02-022..024; Q-FE02-014..016.
  - DoD: self-registration is Member-only, FE11 owns staff/admin creation, account setup expiry is exactly 24 hours, refresh-token exchange does not require an access token, and every normalized rule has deterministic traceability.
  - Review state: documentation complete and human review confirmed by Nhat on 2026-07-17.
