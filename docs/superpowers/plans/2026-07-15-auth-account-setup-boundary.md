# Auth Account Setup Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Do not use subagents for this project.

**Goal:** Make admin-created accounts remain inactive until a single-use FE11 setup token is delivered by FE10 and atomically consumed by FE02.

**Architecture:** Add one construction-bound sensitive-notification ownership policy shared by FE02 and FE11. Put cross-table setup lifecycle transactions in a focused `accountSetupRepository`; services generate raw credentials only in memory and call FE10 after source commit. Preserve the existing `/api/auth/reset-password` compatibility endpoint and add Admin-only setup resend.

**Tech Stack:** Node.js, Express, SQL Server (`mssql`), Jest/Supertest, React/Vite, Material UI.

## Global Constraints

- Admin-created accounts start `INACTIVE`; only valid `ACCOUNT_SETUP` completion changes them to `ACTIVE`.
- FE11 issues/resends setup tokens; FE10 delivers; FE02 consumes/activates.
- Store only SHA-256 token hashes and valid bcrypt password hashes.
- Never persist, log, audit, return, or snapshot raw OTPs, setup tokens, setup links, or rendered sensitive content.
- Use exact source keys `FE02:ACCOUNT_VERIFICATION:<tokenId>`, `FE02:PASSWORD_RESET:<tokenId>`, and `FE11:ACCOUNT_SETUP:<tokenId>`.
- Source transactions and FE02 completion are atomic; provider delivery is post-commit and non-blocking.
- Work only on `fix/auth-account-setup-boundary`; do not touch cleanup/user-owned files.

---

### Task 1: FE10 Sensitive Source Ownership

**Files:**
- Modify: `backend/src/services/notificationService.js`
- Modify: `backend/src/validators/notificationValidators.js`
- Modify: `backend/src/models/Notification.js`
- Modify: `backend/tests/notificationRoutes.test.js`
- Modify: `backend/tests/helpers/inMemoryNotificationRepositories.js`
- Modify: `database/Librarymanagement.sql`

**Interfaces:**
- Produces: `createSourceNotificationRequester('FE02' | 'FE11' | existing sources)`.
- FE02 owns `ACCOUNT_VERIFICATION`/`PASSWORD_RESET`; FE11 owns `ACCOUNT_SETUP`.

- [ ] Add failing tests for HTTP rejection of all sensitive types and source override.
- [ ] Add failing tests for FE02-only OTP types and FE11-only `ACCOUNT_SETUP`.
- [ ] Add failing tests requiring `AuthToken`, positive token ID, exact idempotency key, and required template variables.
- [ ] Add failing tests proving sensitive source metadata persists while raw/rendered content does not.
- [ ] Run `npm.cmd test -- notificationRoutes.test.js` and confirm the new tests fail for missing FE11/type ownership.
- [ ] Add `ACCOUNT_SETUP` to supported/canonical/sensitive identifiers and `setuplink` redaction.
- [ ] Add `sensitiveTypeOwners = { ACCOUNT_VERIFICATION: 'FE02', PASSWORD_RESET: 'FE02', ACCOUNT_SETUP: 'FE11' }` and enforce it before persistence/provider calls.
- [ ] Persist safe `sourceFeature: owner`, `sourceEntityType: 'AuthToken'`, `sourceEntityId`, and exact token-ID idempotency key for sensitive records.
- [ ] Add SQL/model/template support for `ACCOUNT_SETUP` with `{{setupLink}}` and `{{expiresInHours}}`.
- [ ] Run the focused test and confirm PASS.
- [ ] Commit: `feat: enforce sensitive notification source ownership`.

### Task 2: Configured FE10 Provider Adapter

**Files:**
- Modify: `backend/src/services/emailService.js`
- Modify: `backend/src/services/notificationService.js`
- Test: `backend/tests/notificationRoutes.test.js`

**Interfaces:**
- Produces: `emailService.sendNotificationEmail({ to, subject, body }) -> { sent, providerMessageId?, reason? }`.

- [ ] Add a failing test proving default FE10 delivery delegates to the configured email adapter instead of the timestamp mock.
- [ ] Export `sendNotificationEmail` from `emailService`, delegating to the existing private `sendMail` with safe text/HTML.
- [ ] Make the default notification provider call `sendNotificationEmail`; keep injected providers for tests.
- [ ] Map `sent: false` to safe delivery failure without provider details.
- [ ] Run focused notification tests and confirm PASS.
- [ ] Commit: `feat: connect notifications to configured email provider`.

### Task 3: Transactional FE11 Account Creation

**Files:**
- Create: `backend/src/repositories/accountSetupRepository.js`
- Create: `backend/tests/userManagementService.test.js`
- Modify: `backend/src/services/userManagementService.js`
- Modify: `backend/src/app.js`
- Modify: `backend/tests/helpers/inMemoryAuthRepositories.js`

**Interfaces:**
- Produces: `accountSetupRepository.createPendingAccount(input) -> { user, tokenId }`.
- Consumes: FE11-bound requester from Task 1.

- [ ] Add RED service tests for `INACTIVE`, requested role, valid bcrypt placeholder, hashed 24-hour token, and one FE10 request.
- [ ] Add RED rollback tests for profile, role, token, and audit failures.
- [ ] Add RED delivery-failure test proving account remains `INACTIVE` and response is safe `FAILED`.
- [ ] Implement `createPendingAccount` with one SQL transaction inserting `Users`, `UserProfiles`, `UserRoles`, `AuthTokens`, and `AuditLogs`.
- [ ] Generate a random discarded value and hash it with FE02 bcrypt policy; remove literal `ACCOUNT_SETUP_PENDING`.
- [ ] Generate raw setup token with `generateRandomToken`, store only `hashToken`, then build `${frontendBaseUrl}/forgot-password?token=...` in memory.
- [ ] Request FE10 `ACCOUNT_SETUP` after commit with `AuthToken` metadata and `FE11:ACCOUNT_SETUP:<tokenId>`.
- [ ] Return `{ userId, email, status: 'INACTIVE', roles, setupDeliveryStatus, message }` without debug fields.
- [ ] Run `npm.cmd test -- userManagementService.test.js userManagementRoutes.test.js` and confirm PASS.
- [ ] Commit: `feat: create inactive accounts with setup tokens`.

### Task 4: Atomic FE02 Setup Completion

**Files:**
- Modify: `backend/src/repositories/accountSetupRepository.js`
- Modify: `backend/src/services/authService.js`
- Modify: `backend/tests/authRoutes.test.js`
- Modify: `backend/tests/helpers/inMemoryAuthRepositories.js`

**Interfaces:**
- Produces: `accountSetupRepository.completeSetup({ tokenHash, passwordHash, now, context })`.

- [ ] Add RED tests for valid `INACTIVE -> ACTIVE` completion with password, `EmailVerifiedAt`, lock reset, token use/revocation, and audit committed together.
- [ ] Add RED tests for expired, used, revoked, active-account, wrong-purpose, and concurrent token attempts.
- [ ] Add RED test proving password-reset credentials cannot activate inactive accounts.
- [ ] Implement one locked SQL transaction that selects the setup token/user, validates lifecycle, updates user, marks one token used, revokes siblings, and inserts audit.
- [ ] Split `authService.resetPassword` into explicit password-reset and account-setup branches while preserving the request shape.
- [ ] Run `npm.cmd test -- authRoutes.test.js` and confirm PASS.
- [ ] Commit: `feat: complete account setup atomically`.

### Task 5: Admin Setup Resend

**Files:**
- Modify: `backend/src/repositories/accountSetupRepository.js`
- Modify: `backend/src/services/userManagementService.js`
- Modify: `backend/src/controllers/userManagementController.js`
- Modify: `backend/src/routes/userManagementRoutes.js`
- Create: `backend/src/validators/userManagementValidators.js`
- Modify: `backend/tests/userManagementService.test.js`
- Modify: `backend/tests/userManagementRoutes.test.js`

**Interfaces:**
- Produces: `POST /api/users/:userId/resend-setup`.

- [ ] Add RED tests for eligible resend, old-token revocation, new token/key, 60-second cooldown, and safe provider failure.
- [ ] Add RED rejection tests for active, locked, self-registered inactive, completed-setup, missing, and non-admin targets.
- [ ] Implement `rotateSetupToken` transaction with row locks, token-history eligibility, cooldown, revocation, new token, and audit.
- [ ] Add route/controller/validator and FE10 post-commit delivery.
- [ ] Run focused FE11 tests and confirm PASS.
- [ ] Commit: `feat: add admin account setup resend`.

### Task 6: Frontend Setup-Link Flow

**Files:**
- Modify: `frontend/src/api/authApi.js`
- Modify: `frontend/src/component/forgotpassword/ForgotPasswordForm.jsx`
- Modify: `frontend/src/utils/authUx.js`
- Test: existing frontend auth UX test files under `frontend/src`.

**Interfaces:**
- Produces: `resetPasswordWithToken({ token, newPassword })`.

- [ ] Add RED tests for token-query mode, password validation, no OTP/email form, success, and safe invalid-link error.
- [ ] Parse `token` with `useSearchParams`; enter setup mode when present.
- [ ] Submit `{ token, newPassword }` through `resetPasswordWithToken` and retain the existing success/login action.
- [ ] Ensure the raw token is never logged, stored, or rendered in page copy.
- [ ] Run targeted frontend tests and lint for touched files.
- [ ] Commit: `feat: support account setup links in recovery flow`.

### Task 7: Cross-Feature Validation

**Files:**
- Modify only task/changelog/review evidence files required by the approved specs.

- [ ] Run focused FE02/FE10/FE11 backend tests.
- [ ] Run affected system integration tests, not the unrelated full SQL suite.
- [ ] Run targeted frontend tests, lint, and build only if required by changed frontend files.
- [ ] Run `node scripts/check-traceability.js --enforce`.
- [ ] Scan changed lines for `debugOtp`, `debugSetupToken`, raw token/link logs, literal placeholder hashes, and secrets.
- [ ] Run `git diff --check`.
- [ ] Record remaining risks and request Nhat's human review before merge.
