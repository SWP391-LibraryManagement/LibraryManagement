# TASKS.md - FE11 User & Role Management

Status: APPROVED - BASELINE 2026-07-17; ACCOUNT SETUP SLICE COMPLETE; TRANSACTIONAL ROLE SLICE AUTOMATED VALIDATION PASS; HUMAN REVIEW PENDING; REMAINING WORK DEFERRED
Implementation State: DEFERRED

Date: 2026-07-15

Owner: Dung

## Account Setup Tasks

- [x] **FE11-S01 - Draft the cross-feature account-setup contract.**
  - Maps to: BR-FE11-005, BR-FE11-021..025; FR-FE11-003, 009, 036..038; AC-FE11-003, 006, 010, 020..022; ADR-005.
  - DoD: FE02, FE10, FE11, API, state, transaction, delivery, failure, and resend semantics use one deterministic contract; implementation files remain unchanged.
  - Review state: Nhat reviewed the approved contract before implementation.

- [x] **FE11-S02 - Add RED FE11 creation tests.**
  - Files: `backend/tests/userManagementService.test.js`, `backend/tests/userManagementRoutes.test.js`, test helpers.
  - DoD: failing tests prove `INACTIVE` creation, valid unusable bcrypt hash, atomic user/profile/role/token/audit rollback, no credential response, and safe delivery status.
  - Evidence: implemented through TDD in `ff885b7`.

- [x] **FE11-S03 - Add RED FE10 account-setup boundary tests.**
  - Files: `backend/tests/notificationRoutes.test.js`, notification helpers.
  - DoD: failing tests prove only the FE11-bound requester accepts `ACCOUNT_SETUP`, required variables are enforced, staff HTTP/non-FE11 sources are rejected, and no token/link/rendered content persists or returns.
  - Evidence: implemented through TDD in `547f986`.

- [x] **FE11-S04 - Implement transactional inactive account creation and FE10 delivery.**
  - Dependencies: FE11-S02, FE11-S03.
  - Files: user-management service/repositories, notification service/config, SQL template/type contract.
  - DoD: source state commits atomically; delivery runs after commit; response reports safe `SENT`/`FAILED`; no literal placeholder or credential exposure remains.
  - Evidence: provider boundary `3e25875`; transactional account creation `ff885b7`.

- [x] **FE11-S05 - Add RED FE02 setup-completion tests and implement atomic activation.**
  - Maps to: FE02 account-setup requirements and ADR-005.
  - Files: `backend/tests/authRoutes.test.js`, `backend/src/services/authService.js`, auth/user/token/audit repositories.
  - DoD: valid token atomically stores the password, sets email verified/active, marks token used, and audits; expired/used/revoked/concurrent tokens cannot activate or partially update.
  - Evidence: implemented through TDD in `57068d2`.

- [x] **FE11-S06 - Add RED resend tests and implement Admin resend.**
  - Files: user-management route/validator/service/repositories and tests.
  - DoD: only eligible incomplete accounts pass; prior active tokens are revoked; 60-second cooldown is enforced; each resend uses a new token ID/event/key; delivery failure stays safe/non-blocking.
  - Evidence: implemented through TDD in `d80b8f2`; frontend setup-link consumption added in `fa63acc`.

- [x] **FE11-S07 - Pass the account-setup validation gate.**
  - Dependencies: FE11-S02..S06.
  - DoD: focused and affected integration tests pass; traceability, secret scans, and `git diff --check` pass; Nhat confirms human review.
  - Validation state: PASS on 2026-07-15; Nhat confirmed the final Task 7 human review.

- [x] **FE11-S08 - Normalize the remaining FE11 specification contract.**
  - Maps to: BR-FE11-026..027; FR-FE11-002, FR-FE11-023; AC-FE11-002, AC-FE11-004, AC-FE11-016..019, AC-FE11-023; Q-FE11-017..018.
  - DoD: list/detail/update responses use an explicit safe DTO, stale updates deterministically return `409 STALE_USER_STATE`, every AC is traceable, and no test mapping remains `TBD`.
  - Review state: documentation complete and human review confirmed by Nhat on 2026-07-17. This task does not start deferred implementation.

## Transactional Role Management Tasks

- [x] **FE11-R01 - Validate role mutation request IDs.**
  - Maps to: NFR-FE11-SEC-004; FR-FE11-012..013, FR-FE11-024..026.
  - DoD: authenticated Admin requests receive normalized positive integer IDs; invalid IDs return `400 VALIDATION_ERROR` before the service is called.
  - Evidence: 25/25 focused route tests pass after the observed RED failures for missing validators and string IDs.

- [x] **FE11-R02 - Add RED transactional repository tests.**
  - Maps to: BR-FE11-007..010; FR-FE11-014, FR-FE11-017, FR-FE11-024..027; NFR-FE11-TXN-003/006.
  - DoD: failing tests cover actor/target/role lookup, duplicate/missing mapping, final-role guards, locked Admin count, atomic audit, and rollback.
  - Evidence: RED observed because `userRoleRepository.js` did not exist; the suite could not resolve the required module.

- [x] **FE11-R03 - Implement transactional role mutation.**
  - Dependencies: FE11-R02.
  - DoD: one parameterized SQL transaction returns deterministic outcomes, uses required lock hints, and commits or rolls back mapping plus audit together.
  - Evidence: 14/14 repository tests pass, including lock-hint, parameterization, deterministic outcome, and audit-rollback cases.

- [x] **FE11-R04 - Map repository outcomes through the FE11 service.**
  - Dependencies: FE11-R03.
  - DoD: service-level RED-GREEN tests prove safe status/code/message mapping and successful safe-user readback without a second audit.
  - Evidence: RED exposed the old `userRepository.findRoleById` path; 70/70 focused route/service/repository tests now pass through the transactional outcome contract.

- [ ] **FE11-R05 - Pass the transactional role-management validation gate.**
  - Dependencies: FE11-R01..R04.
  - DoD: focused/full backend tests, traceability, diff hygiene, security review, documentation, debt reconciliation, and human review evidence are complete.
  - Automated evidence: 70/70 focused tests; 399/399 full backend tests; repository coverage 100% statements/lines/functions and 90.24% branches; project coverage and traceability gates pass.
  - Review state: human implementation review is pending.

## Deferred FE11 Work

All user-list, update, deactivation, role-management, audit-log, admin-console, and remaining FE11 debt stays outside this slice until a separately reviewed plan/task group is approved.
