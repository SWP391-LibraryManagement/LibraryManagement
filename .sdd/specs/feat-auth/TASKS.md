# TASKS.md - FE02 Authentication

Status: RECONCILIATION IN PROGRESS - CONTEXT GAPS TRACKED
Implementation State: PARTIAL
Baseline Note: Approved implementation baseline complete; reconciliation tasks FE02-T048 and FE02-T049 remain open.
Date: 2026-07-23
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

This evidence closes the Authentication/OTP UX task group only. The separate FE02/FE10 OTP delivery slice is complete through B7; real provider delivery and unrelated FE02 follow-up remain outside this slice.

## FE02/FE10 OTP Delivery Follow-up Tasks

- [x] **FE02-T029 - Normalize the approved OTP delivery contract.**
  - Maps to: BR-FE02-020 to BR-FE02-022; FR-FE02-002, FR-FE02-011, FR-FE02-022, FR-FE02-023; AC-FE02-001, AC-FE02-014, AC-FE02-019; ADR-004.
  - Files: `.sdd/specs/feat-auth/CONTEXT.md`, `SPEC.md`, `PLAN.md`, `TASKS.md`, `CHANGELOG.md`, `.sdd/rfcs/ADR-004-auth-otp-notification-boundary.md`.
  - DoD: FE02 and FE10 agree on OTP variables, source ownership, token-ID idempotency, single delivery ownership, non-blocking failure, resend semantics, and `CHANGE_PASSWORD_OTP` exclusion; no implementation files change.

- [x] **FE02-T030 - Add RED requester-integration tests.**
  - Maps to: BR-FE02-020, BR-FE02-021; FR-FE02-002, FR-FE02-011, FR-FE02-022; AC-FE02-001, AC-FE02-014.
  - Files: `backend/tests/authRoutes.test.js`, `backend/tests/helpers/inMemoryAuthRepositories.js`.
  - DoD: failing tests prove register, resend verification, and forgot password make exactly one FE10 requester call containing `otp`, `expiresInMinutes`, `AuthToken`, token ID, and token-ID idempotency; tests reject direct notification writes, direct verification/reset email sends, and `debugOtp`/`debugVerificationToken`/`debugResetToken` HTTP fields.

- [x] **FE02-T031 - Migrate verification/reset delivery to FE10.**
  - Maps to: BR-FE02-020, BR-FE02-021; FR-FE02-002, FR-FE02-011, FR-FE02-022.
  - Dependencies: FE10-S02 and FE10-S03.
  - Files: `backend/src/services/authService.js`, `backend/src/repositories/authTokenRepository.js`, `backend/tests/helpers/inMemoryAuthRepositories.js`, `backend/tests/authRoutes.test.js`.
  - DoD: `createOtpToken` returns the persisted token record; verification/reset call only the requester bound to `FE02`; duplicate direct notification/email paths and HTTP debug-token fields are removed; tests capture OTPs through injected dependencies; legacy token acceptance and direct `CHANGE_PASSWORD_OTP` email remain unchanged.
  - Evidence: the FE10 schema/OpenAPI fan-in is present and the current FE02/FE10 focused cross-feature gate passes as part of 4 suites/154 tests.

- [x] **FE02-T032 - Lock non-blocking failure and resend behavior.**
  - Maps to: BR-FE02-022; FR-FE02-023; AC-FE02-019; EC-FE02-009.
  - Files: `backend/tests/authRoutes.test.js`, `backend/src/services/authService.js`.
  - DoD: FE10 `FAILED` status or safe exception does not roll back user/token state or alter generic forgot-password semantics; no OTP reaches logs/audits/responses; resend creates a new token ID and notification key.
  - Evidence: requester failure/resend behavior, token-ID idempotency, no debug credential fields, and unchanged `CHANGE_PASSWORD_OTP` ownership pass in the current FE02/FE10 focused gate.

- [x] **FE02-T033 - Pass the cross-feature validation gate.**
  - Maps to: ADR-004 verification contract and all FE02 follow-up requirements.
  - Dependencies: FE02-T030 to FE02-T032; FE10-S02 to FE10-S04.
  - Files: `.sdd/specs/feat-auth/TASKS.md`, `.sdd/specs/feat-auth/CHANGELOG.md`; implementation files change only for review fixes.
  - DoD: focused FE02/FE10 tests and affected integration tests pass; traceability and secret scans pass; `git diff --check` passes; human review confirms `CHANGE_PASSWORD_OTP` and legacy-token behavior were not widened.
  - Status: COMPLETE THROUGH B7.
  - Evidence: focused cross-feature tests pass 170/170; full backend passes 916/916 with configured coverage; FE02 traceability is 26/26; frontend, system, deployment, browser E2E, OpenAPI/import, leakage, and diff checks pass. PR #42 merged as `34d9180`; PR CI `29688102867` and exact post-merge `main` CI `29688222757` passed. Expanded tests cover every allowlisted non-FE02 requester for both sensitive types, exact HTTP source-override errors, and repeated password-reset token-ID/idempotency rotation. No production correction was required.

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

- [x] **FE02-T039 - Close the API and canonical OTP evidence gap.**
  - Maps to: FR-FE02-003, FR-FE02-012, FR-FE02-015, FR-FE02-019; AC-FE02-002, AC-FE02-016, AC-FE02-018.
  - Files: `backend/tests/authRoutes.test.js`, `TEST_PLAN.md`, `CHANGELOG.md`, `TECH_DEBT.md`.
  - DoD: API tests prove duplicate registration and weak registration/reset passwords persist no unauthorized state; canonical `{ email, otp }` verification/reset activates or updates only the eligible account and consumes the purpose-bound OTP.
  - Evidence: focused auth validation passes 30/30; `TD-018` is resolved by `0040e0f`, and PR CI run `29680011551` passes.

- [x] **FE02-T040 - Reconcile Phase 1 login abuse and enumeration policy.**
  - Maps to: BR-FE02-007, BR-FE02-008, NFR-FE02-SEC-005, NFR-FE02-SEC-010, Q-FE02-005; AC-FE02-005, AC-FE02-007, AC-FE02-008.
  - Files: `backend/src/services/authService.js`, `backend/tests/authRoutes.test.js`, `TEST_PLAN.md`, `CHANGELOG.md`, `TECH_DEBT.md`.
  - DoD: known-account lockout remains the approved Phase 1 control; IP-wide limiting is not claimed; inactive and unknown accounts return the same generic public login error while locked accounts retain their approved lock message.
  - Evidence: the RED parity regression failed on `403 ACCOUNT_INACTIVE`; GREEN passes with `401 INVALID_CREDENTIALS`, the internal inactive audit event remains, and PR CI run `29680011551` passes on `0040e0f`.

- [x] **FE02-T041 - Enforce HTTPS before authentication credential processing.**
  - Maps to: AC-FE02-024, BR-FE02-017, NFR-FE02-SEC-003.
  - Files: `backend/src/middleware/httpsEnforcement.js`, `backend/src/app.js`, `backend/tests/httpsEnforcement.test.js`, `TEST_PLAN.md`, `CHANGELOG.md`.
  - RED: deployed plain-HTTP auth requests reached the auth service and returned `200`; redirect policy was also absent.
  - GREEN: production auth requests reject with `400 HTTPS_REQUIRED` before JSON/auth dispatch, trusted `X-Forwarded-Proto: https` passes, and explicit `308` redirect policy uses only a validated `HTTPS_CANONICAL_HOST`.
  - Validation: focused transport suite `3/3`; full backend and traceability remain merge-gate checks.

- [x] **FE02-T042 - Reduce email-verification OTP lifetime to 15 minutes.**
  - Maps to: BR-FE02-020, BR-FE02-021, BR-FE02-027; FR-FE02-002; AC-FE02-001, AC-FE02-003; NFR-FE02-SEC-008.
  - Files: `backend/src/config/env.js`, `backend/src/services/authService.js`, `backend/.env.example`, `backend/tests/authRoutes.test.js`, `backend/tests/envConfig.test.js`, FE02 specification/change records.
  - DoD: registration and resend issue exact 15-minute verification OTPs; canonical minute configuration is validated; legacy hour configuration temporarily remains compatible; focused/full tests, traceability, leakage checks, Azure health, and a Gmail-rendered 15-minute expiry pass.
  - Evidence: RED failed 5 assertions against the 24-hour implementation; GREEN focused validation passes 35/35, full backend coverage passes 920/920, FE02 traceability remains 26/26, Azure `/health` returns 200, and the post-restart Gmail message renders a 15-minute expiry.

## Login Validation And Feedback Hardening

- [x] **FE02-T043 - Harden login presentation validation and safe localized errors.**
  - Maps to: AC-FE02-004 to AC-FE02-008; BR-FE02-007; NFR-FE02-SEC-010, NFR-FE02-SEC-011, NFR-FE02-UX-001, NFR-FE02-UX-002, NFR-FE02-UX-008.
  - Files: `frontend/src/utils/authUx.js`, `frontend/src/component/login/LoginForm.jsx`, `frontend/src/component/login/AuthCard.jsx`, `frontend/src/page/LoginPage.jsx`, `frontend/src/api/authApi.js`, `backend/src/validators/authValidators.js`, focused frontend/backend tests, and FE02 records.
  - DoD: blank/whitespace and overlength login values receive field-level Vietnamese feedback; pending submissions cannot duplicate; unknown/inactive accounts remain generic; locked accounts receive approved recovery guidance; network feedback is environment-neutral; identifiers up to 255 characters pass server validation; focused and full validation gates pass.
  - Evidence: TDD RED reproduced missing helpers/wiring, the 100-character backend rejection, native browser validation bypassing Vietnamese field feedback, and an unreachable overlength branch at the HTML boundary. GREEN validation passes 209/209 full frontend tests, 33/33 focused backend auth tests, 924/924 full backend tests, frontend lint/build, and `trace:enforce`; headless Chromium confirms blank and 256-character submissions render the approved field-level Vietnamese messages and invalid-credential feedback remains generic and clears on edit.

## Context Consistency Reconciliation

- [x] **FE02-T044 - Align FE02 documentation with the approved context.**
  - Maps to: `CONTEXT.md`; MF-FE02-006; FR-FE02-010; AC-FE02-012, AC-FE02-013.
  - Files: FE02 context/spec/plan/tasks/test/changelog documents.
  - DoD: direct and OTP-confirmed change-password paths, artifact status, endpoint inventory, password policy, known-account lockout terminology, and open evidence gaps are consistent.

- [x] **FE02-T045 - Add dedicated change-password OTP integration regressions.**
  - Maps to: FR-FE02-010; AC-FE02-012, AC-FE02-013; CG-FE02-004.
  - Dependencies: FE02-T044.
  - DoD: backend tests cover request/confirm success plus incorrect current password and invalid, expired, used, and wrong-user OTP rejection without password mutation.
  - Evidence: `backend/tests/authRoutes.test.js` covers every named rejection and the successful one-time password change; focused FE02 tests pass 47/47 on 2026-07-27.

- [x] **FE02-T046 - Prove server-side current-role authorization.**
  - Maps to: FR-FE02-014; AC-FE02-023; CG-FE02-002.
  - Dependencies: FE02-T044.
  - DoD: an explicit regression proves client role claims cannot override current `UserRoles`.
  - Evidence: `backend/tests/authRoutes.test.js` changes persisted roles after access-token issuance and proves protected authentication returns the current server-side roles.

- [x] **FE02-T047 - Align and verify the exact account-lock duration.**
  - Maps to: BR-FE02-008, BR-FE02-009; FR-FE02-006; AC-FE02-008; CG-FE02-001.
  - Dependencies: FE02-T044.
  - DoD: repository/deployment defaults use 30 minutes and focused tests prove the exact duration after five qualifying failures in the rolling 15-minute window.
  - Evidence: `backend/.env.example` and `backend/src/config/env.js` default to 30 minutes; `envConfig.test.js` and `authRoutes.test.js` verify the default and exact `lockedUntil` duration.

- [ ] **FE02-T048 - Record performance evidence or an approved exception.**
  - Maps to: NFR-FE02-PERF-001, NFR-FE02-PERF-004; CG-FE02-005.
  - Dependencies: FE02-T044.
  - DoD: repeatable measurements demonstrate valid login under 1 second and token validation under 50 ms at p95, or a reviewer-approved exception updates the contract.

- [x] **FE02-T050 - Enforce current account state on protected requests.**
  - Maps to: FR-FE02-008, FR-FE02-009; AC-FE02-009, AC-FE02-010; CG-FE02-006.
  - Dependencies: FE02-T044.
  - DoD: authentication rejects a token holder whose persisted user is no longer `ACTIVE`, while retaining linked-session and current-role checks; focused regressions cover deactivation/lock after token issuance.
  - Evidence: `authenticateToken` now rejects non-`ACTIVE` persisted users; focused regressions cover both `INACTIVE` and `LOCKED` transitions after token issuance.

- [x] **FE02-T051 - Align FE02 frontend session recovery.**
  - Maps to: NFR-FE02-UX-009; CG-FE02-007.
  - Dependencies: FE02-T044.
  - DoD: FE02 protected profile/change-password requests use the selected storage, retry at most once after 401, save the replacement access token, and clear auth state plus redirect to login when recovery fails.
  - Evidence: `frontend/src/api/profileApi.js` now applies the shared one-refresh flow to profile and change-password requests; `frontend/test/profileFrontend.test.js` covers retry, token persistence, cleanup, and redirect behavior.

- [x] **FE02-T052 - Close authentication transaction and audit atomicity gaps.**
  - Maps to: NFR-FE02-TXN-001 to NFR-FE02-TXN-004; CG-FE02-008.
  - Dependencies: FE02-T044.
  - DoD: registration credential creation, login/session creation, password change/OTP consumption, password reset/token consumption, and required audit state commit or roll back according to the approved contract, with focused failure regressions or an explicitly approved bounded exception.
  - Evidence: FE02 mutations now share SQL transactions for the four NFR-FE02-TXN-001..004 boundaries; focused in-memory failure regressions prove rollback on verification-token creation, refresh-session creation, required password-change audit, and password-reset token invalidation. Focused FE02 tests pass 47/47 on 2026-07-27.

- [ ] **FE02-T049 - Complete reconciliation review and closeout.**
  - Maps to: Definition of Done; CG-FE02-003; SPEC.md v0.6.14.
  - Dependencies: FE02-T045 to FE02-T048, FE02-T050 to FE02-T052.
  - DoD: automated gates pass, the FE02-T043 H3 closeout is linked, all conformance gaps are closed or explicitly deferred, and human review approves the reconciled artifacts.

## Phase 1: Convergence

- [x] **FE02-T053 - Enforce the rolling failed-login window.**
  - Maps to: BR-FE02-008; FR-FE02-006; NFR-FE02-SEC-005.
  - Dependencies: FE02-T047.
  - DoD: only failed attempts occurring within the rolling 15-minute window contribute to the five-attempt lock threshold; an older attempt starts a new count, and focused regressions prove both paths.
  - Evidence: `LoginFailureAttempts` records known-account failures; the repository counts the exact 15-minute window transactionally, and the focused regression proves an expired failure is excluded before five current failures lock the account for 30 minutes.

- [x] **FE02-T054 - Generate authentication OTPs cryptographically securely.**
  - Maps to: BR-FE02-010; BR-FE02-014; NFR-FE02-SEC-007.
  - Dependencies: FE02-T044.
  - DoD: the default OTP generator uses a cryptographically secure source, preserves the six-digit contract including leading zeroes, and a focused regression guards the implementation.
  - Evidence: the default generator uses Node.js `crypto.randomInt`; `backend/tests/authUtils.test.js` proves the secure call boundary and `000042` leading-zero result.

## Phase 2: Convergence

- [x] **FE02-T055 - Recover interrupted self-registration from login.**
  - Maps to: BR-FE02-004, BR-FE02-007, BR-FE02-025; AC-FE02-007; approved interrupted-registration case.
  - Dependencies: FE02-T011, FE02-T012, FE02-T022.
  - DoD: when correct credentials belong to a self-registered account still awaiting email verification, login returns a stable verification-required signal and the frontend navigates to `/verify-email` with the registered email; unknown users, wrong passwords, deactivated users, and admin-created `ACCOUNT_SETUP` users retain safe non-verification behavior; resend verification is limited to eligible self-registration accounts; focused backend/frontend regressions pass.
  - Evidence: login returns `403 EMAIL_VERIFICATION_REQUIRED` only after correct password proof and eligible self-registration provenance, issues no refresh session, and `LoginPage` routes to `/verify-email`; focused backend tests pass 48/48, frontend tests pass 220/220, lint/build pass, and FE02 traceability passes 27/27. Full backend remains 57/61 suites and 1034/1039 tests because of the recorded unrelated DNS/mock-isolation and cross-feature inactive-response expectations.

## Phase 3: Convergence

- [x] **FE02-T056 - Exclude deactivated accounts from self-registration verification recovery.**
  - Maps to: BR-FE02-028; Q-FE02-017; AC-FE02-026 (`contradicts`).
  - DoD: repository user mapping exposes `deactivatedAt`; login and resend verification reject a deactivated pending self-registration account without issuing a session or verification token; a focused regression proves the boundary.
  - Evidence: `userRepository` maps `DeactivatedAt`, the shared recovery predicate rejects it, and focused repository/login/resend regressions pass in the 58/58 FE02 gate.

- [x] **FE02-T057 - Apply the approved JWT clock-skew tolerance.**
  - Maps to: EC-FE02-015 (`missing`).
  - DoD: access-token validation uses exactly 30 seconds of clock tolerance and a focused utility regression guards the option.
  - Evidence: `verifyAccessToken` passes `clockTolerance: 30` to `jsonwebtoken`; the focused utility regression passes.

- [x] **FE02-T058 - Complete safe authentication failure logging.**
  - Maps to: NFR-FE02-LOG-001, NFR-FE02-LOG-005, NFR-FE02-LOG-006; INV-FE02-006 (`partial`).
  - DoD: failed logins record the submitted identifier and safe reason, the transition to `LOCKED` records a distinct lock event, and protected-token validation failures emit code-only debug output outside production without logging credentials; focused regressions pass.
  - Evidence: login outcome audits carry identifier/reason, threshold transition writes `AUTH_ACCOUNT_LOCKED`, and injected debug logging receives only `INVALID_TOKEN`; focused FE02 tests pass 58/58.

- [x] **FE02-T059 - Reconcile FE02 artifacts with implemented contracts and evidence.**
  - Maps to: SPEC Section 10/11/16/17; PLAN Sections 4/5/16 (`contradicts`).
  - DoD: artifacts record `LoginFailureAttempts`, the implemented `expiresIn` response shape and refresh-token logout contract, current AC-FE02-009/010/012/013/023 evidence, completed reconciliation checks, and current validation counts without changing approved behavior.
  - Evidence: SPEC v0.6.14, CONTEXT v0.2.6, PLAN, TEST_PLAN v0.3.11, TASKS, CHANGELOG, and shared API contract now agree with current code and evidence.

- [x] **FE02-T060 - Align cross-feature inactive-account integration expectations with FE02 authentication.**
  - Maps to: FR-FE02-009; AC-FE02-010 (`contradicts`).
  - DoD: FE04/FE07/FE08 integration regressions expect FE02's `401 INVALID_TOKEN` before their business handlers for a user deactivated after token issuance; feature rejection behavior remains intact and focused suites pass.
  - Evidence: the three expectations now follow FR-FE02-009 and the affected membership/borrowing/reservation suites pass 114/114; full backend improves to 60/61 suites and 1040/1042 tests with only `dbConfig.test.js` failing.
