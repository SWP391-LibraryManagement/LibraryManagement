# TASKS.md - FE11 User & Role Management

Status: NOT STARTED - ACCOUNT SETUP SLICE READY FOR REVIEW

Date: 2026-07-15

Owner: Dung

## Account Setup Tasks

- [x] **FE11-S01 - Draft the cross-feature account-setup contract.**
  - Maps to: BR-FE11-005, BR-FE11-021..025; FR-FE11-003, 009, 036..038; AC-FE11-003, 006, 010, 020..022; ADR-005.
  - DoD: FE02, FE10, FE11, API, state, transaction, delivery, failure, and resend semantics use one deterministic contract; implementation files remain unchanged.
  - Review state: drafted, awaiting Nhat review.

- [ ] **FE11-S02 - Add RED FE11 creation tests.**
  - Files: `backend/tests/userManagementService.test.js`, `backend/tests/userManagementRoutes.test.js`, test helpers.
  - DoD: failing tests prove `INACTIVE` creation, valid unusable bcrypt hash, atomic user/profile/role/token/audit rollback, no credential response, and safe delivery status.

- [ ] **FE11-S03 - Add RED FE10 account-setup boundary tests.**
  - Files: `backend/tests/notificationRoutes.test.js`, notification helpers.
  - DoD: failing tests prove only the FE11-bound requester accepts `ACCOUNT_SETUP`, required variables are enforced, staff HTTP/non-FE11 sources are rejected, and no token/link/rendered content persists or returns.

- [ ] **FE11-S04 - Implement transactional inactive account creation and FE10 delivery.**
  - Dependencies: FE11-S02, FE11-S03.
  - Files: user-management service/repositories, notification service/config, SQL template/type contract.
  - DoD: source state commits atomically; delivery runs after commit; response reports safe `SENT`/`FAILED`; no literal placeholder or credential exposure remains.

- [ ] **FE11-S05 - Add RED FE02 setup-completion tests and implement atomic activation.**
  - Maps to: FE02 account-setup requirements and ADR-005.
  - Files: `backend/tests/authRoutes.test.js`, `backend/src/services/authService.js`, auth/user/token/audit repositories.
  - DoD: valid token atomically stores the password, sets email verified/active, marks token used, and audits; expired/used/revoked/concurrent tokens cannot activate or partially update.

- [ ] **FE11-S06 - Add RED resend tests and implement Admin resend.**
  - Files: user-management route/validator/service/repositories and tests.
  - DoD: only eligible incomplete accounts pass; prior active tokens are revoked; 60-second cooldown is enforced; each resend uses a new token ID/event/key; delivery failure stays safe/non-blocking.

- [ ] **FE11-S07 - Pass the account-setup validation gate.**
  - Dependencies: FE11-S02..S06.
  - DoD: focused and affected integration tests pass; traceability, secret scans, and `git diff --check` pass; Nhat confirms human review.

## Deferred FE11 Work

All user-list, update, deactivation, role-management, audit-log, admin-console, and remaining FE11 debt stays outside this slice until a separately reviewed plan/task group is approved.
