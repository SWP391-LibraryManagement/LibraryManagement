# TASKS.md - FE11 User & Role Management

Status: APPROVED - BASELINE 2026-07-17; ACCOUNT SETUP, TRANSACTIONAL ROLE, AND SAFE LIST/DETAIL SLICES COMPLETE; ADMIN ROLE UI CONTRACT SLICE ACTIVE; REMAINING WORK DEFERRED
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

- [x] **FE11-R05 - Pass the transactional role-management validation gate.**
  - Dependencies: FE11-R01..R04.
  - DoD: focused/full backend tests, traceability, diff hygiene, security review, documentation, debt reconciliation, and human review evidence are complete.
  - Automated evidence: 70/70 focused tests; 399/399 full backend tests; repository coverage 100% statements/lines/functions and 90.24% branches; project coverage and traceability gates pass.
  - Review state: human implementation review approved on 2026-07-18.
  - Integration state: PR #25 merged as `0e1ef8f`; post-merge CI run `29631406399` passed.

## Safe User List And Detail Tasks

- [x] **FE11-U01 - Enforce the canonical user-list contract.**
  - Maps to: FR-FE11-001, AC-FE11-001, NFR-FE11-SEC-004, NFR-FE11-PERF-001.
  - DoD: omitted values use page 1/limit 20; invalid supplied values are rejected; status/role/search are normalized; search uses only email, full name, and user ID; order stays `CreatedAt DESC, UserId DESC`.
  - Evidence: RED exposed missing route validators and silent service clamping; 78/78 focused backend tests pass with Admin-first validation and canonical query parsing.

- [x] **FE11-U02 - Return the explicit safe managed-user allowlist.**
  - Maps to: BR-FE11-026, FR-FE11-001, AC-FE11-001, NFR-FE11-SEC-006.
  - DoD: list/readback responses use `phoneNumber`, deterministic uppercase roles, and no credential/token/session/link/audit-secret fields.
  - Evidence: hostile-column repository tests and frontend contract tests pass; frontend full suite is 77/77 with lint/build green.

- [x] **FE11-U03 - Add the detail-only related summary query.**
  - Maps to: FR-FE11-002, AC-FE11-002.
  - DoD: one parameterized detail query returns active borrowing count, outstanding unpaid-fine total, and open reservation count with numeric zero defaults.
  - Evidence: RED proved the detail repository method was absent; repository tests now verify the three predicates, numeric conversion, zero defaults, and summary-free mutation readback boundary.

- [x] **FE11-U04 - Return deterministic detail validation and not-found errors.**
  - Maps to: FR-FE11-015, FR-FE11-016, NFR-FE11-SEC-001/002/004.
  - DoD: Admin authorization precedes validation; invalid IDs return `400 VALIDATION_ERROR`; valid missing IDs return `404 USER_NOT_FOUND`.
  - Evidence: RED exposed string route IDs and the old `400` path; 105/105 focused route/service/repository/role tests pass with dedicated detail read and `404 USER_NOT_FOUND`.

- [x] **FE11-U05 - Consume the safe list/detail contract in the Admin UI.**
  - Maps to: AC-FE11-001, AC-FE11-002.
  - DoD: UI omits `ALL`/empty search, reads `phoneNumber`, fetches detail on row selection, renders summaries, and reloads a stale list after detail 404.
  - Evidence: four frontend RED failures covered the missing detail flow; 81/81 frontend tests, lint, and production build now pass with authorized detail fetch and stale-row recovery.

- [x] **FE11-U06 - Pass the safe list/detail validation gate.**
  - Dependencies: FE11-U01..U05.
  - DoD: focused/full tests, coverage, frontend lint/build, traceability, diff hygiene, security review, debt reconciliation, validation record, and human review evidence are complete.
  - Automated evidence: 105/105 focused backend tests; 434/434 full backend tests; 92.47% statements and 82.35% branches; 81/81 frontend tests; lint, build, traceability, security scan, and diff checks pass.
  - Review state: human implementation review approved on 2026-07-18.
  - Integration state: PR #27 merged as `ed6bd717`; post-merge CI run `29639933730` passed.

## Context And Drift Reconciliation

- [x] **FE11-C01 - Audit FE11 Admin Console context drift at a fixed point.**
  - Fixed point: base `66642b5`; target `origin/main@8da84bd`.
  - Scope: FE11/User Management/Admin Console/Audit Logs only.
  - DoD: run separate Standards and Spec reviews; classify bounded B7 evidence versus deferred/non-conforming behavior; reconcile project memory, API/test records, and technical debt without changing product behavior or approved requirements.
  - Evidence: `.sdd/reviews/fe11-admin-console-context-drift-audit-2026-07-18.md`.
  - Result: documentation reconciliation complete; no Admin Console implementation slice is approved or reopened by this task.
  - Review state: human review confirmed on 2026-07-18; `FE11-C01` is closed.

## Admin Role UI Contract Tasks

- [ ] **FE11-UIR01 - Send numeric role IDs from the frontend API adapter.**
  - Maps to: FR-FE11-012..013; AC-FE11-013..014; FE11 API §11.
  - DoD: assignment sends `{ roleId }`, revocation uses `/{roleId}`, and focused RED-GREEN tests exclude role-name mutation requests.

- [ ] **FE11-UIR02 - Validate and consume the authoritative role catalog.**
  - Maps to: PRE-FE11-004; NFR-FE11-SEC-004; TD-022.
  - Depends on: FE11-UIR01.
  - DoD: only positive IDs for ADMIN/LIBRARIAN/MEMBER enable the modal; invalid/missing catalog data sends no mutation and no hardcoded fallback exists.

- [ ] **FE11-UIR03 - Execute deterministic role diffs and no-op saves.**
  - Maps to: BR-FE11-007..009; FR-FE11-012..014, FR-FE11-027; AC-FE11-013..015.
  - Depends on: FE11-UIR02.
  - DoD: the complete diff is validated before requests, assignments precede revocations, non-editable roles are preserved, and no-op saves send no mutation.

- [ ] **FE11-UIR04 - Reconcile partial failures to server state.**
  - Maps to: BR-FE11-010; FR-FE11-024..027; NFR-FE11-UX-001.
  - Depends on: FE11-UIR03.
  - DoD: the first failed mutation stops the sequence; target detail is reloaded into the open modal; failed reconciliation disables Save and never reports success.

- [ ] **FE11-UIR05 - Pass the Admin role UI validation and integration gates.**
  - Depends on: FE11-UIR01..UIR04.
  - DoD: focused/full frontend, lint/build, focused backend role regression, traceability, diff/security review, documentation, human review, merge, and post-merge CI evidence are complete.

## Deferred FE11 Work

The only completed implementation slices are account setup `FE11-S01..S07`, transactional backend role assignment/revocation `FE11-R01..R05`, and safe user list/detail `FE11-U01..U06`. The bounded Admin role-action UI contract is active only through `FE11-UIR01..UIR05`. Update/deactivation, librarian fields, Admin Console navigation/permissions/audit/request behavior, the list-summary envelope drift, and remaining FE11 debt stay deferred until a separately reviewed plan/task group is approved. Existing prototype behavior is not evidence of FE11 conformance.
