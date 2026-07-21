# TASKS.md - FE11 User & Role Management

Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED
Implementation State: COMPLETE

Date: 2026-07-20

Owner: Dung

## Account Setup Tasks

- [x] **FE11-S01 - Draft the cross-feature account-setup contract.**
  - Maps to: BR-FE11-005, BR-FE11-021..025; FR-FE11-003, 009, 036..038; AC-FE11-003, 006, 010, 020..022; ADR-005.
  - DoD: FE02, FE10, FE11, API, state, transaction, delivery, failure, and resend semantics use one deterministic contract; implementation files remain unchanged.

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
  - DoD: focused and affected integration tests pass; traceability, secret scans, and `git diff --check` pass; confirms human review.
  - Validation state: PASS on 2026-07-15;

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

- [x] **FE11-UIR01 - Send numeric role IDs from the frontend API adapter.**
  - Maps to: FR-FE11-012..013; AC-FE11-013..014; FE11 API §11.
  - DoD: assignment sends `{ roleId }`, revocation uses `/{roleId}`, and focused RED-GREEN tests exclude role-name mutation requests.
  - Evidence: RED failed on the legacy `roleName` body/path; GREEN passes 6/6 focused API tests with numeric `roleId` helpers.

- [x] **FE11-UIR02 - Validate and consume the authoritative role catalog.**
  - Maps to: PRE-FE11-004; NFR-FE11-SEC-004; TD-022.
  - Depends on: FE11-UIR01.
  - DoD: only positive IDs for ADMIN/LIBRARIAN/MEMBER enable the modal; invalid/missing catalog data sends no mutation and no hardcoded fallback exists.
  - Evidence: RED failed 2 catalog-contract tests before validation/planning existed; GREEN passes 4/4 focused frontend tests and ESLint is clean.

- [x] **FE11-UIR03 - Execute deterministic role diffs and no-op saves.**
  - Maps to: BR-FE11-007..009; FR-FE11-012..014, FR-FE11-027; AC-FE11-013..015.
  - Depends on: FE11-UIR02.
  - DoD: the complete diff is validated before requests, assignments precede revocations, non-editable roles are preserved, and no-op saves send no mutation.
  - Evidence: RED exposed direct role-name loops with no preflight/no-op branch; GREEN passes 5/5 focused frontend tests with numeric assignments before numeric revocations.

- [x] **FE11-UIR04 - Reconcile partial failures to server state.**
  - Maps to: BR-FE11-010; FR-FE11-024..027; NFR-FE11-UX-001.
  - Depends on: FE11-UIR03.
  - DoD: the first failed mutation stops the sequence; target detail is reloaded into the open modal; failed reconciliation disables Save and never reports success.
  - Evidence: RED lacked mutation-failure reload and modal synchronization; GREEN passes 6/6 focused UI tests with authoritative reload, local error display, and Save lock after reconciliation failure.

- [x] **FE11-UIR05 - Pass the Admin role UI validation and integration gates.**
  - Depends on: FE11-UIR01..UIR04.
  - DoD: focused/full frontend, lint/build, focused backend role regression, traceability, diff/security review, documentation, human review, merge, and post-merge CI evidence are complete.
  - Automated evidence: 12/12 focused frontend; 101/101 full frontend; 3 suites and 105/105 focused backend role tests; lint, build, traceability, diff, scope, and security checks PASS.
  - Review state: human implementation review approved on 2026-07-18.
  - Integration state: PR #30 merged as `c20d3251`; PR CI run `29643619999` and post-merge `main` CI run `29644292781` passed.

## Fast-Track Batch 1 Tasks

- [x] **FE11-FT01 - Approve and activate Batch 1 governance.**
  - Scope: TD-024, TD-026, TD-027.
  - Evidence: `.sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md` and the merged governance activation PR.

- [x] **FE11-AUD01 - Implement the canonical Admin Audit Log boundary.**
  - Maps to: BR-FE11-018, BR-FE11-026; FR-FE11-033; AC-FE11-018; TD-024.
  - DoD: SPEC query names, Admin-first validation, cross-feature action-aware default-deny projection, stable filtered SQL pagination, frontend migration, legacy `404 NOT_FOUND`, L1-L4 evidence.
  - Integration state: PR #33 merged as `3c88e432`; post-merge CI run `29651173195` passed.

- [x] **FE11-ENV01 - Restore the canonical user-list envelope using FE12 statistics.**
  - Maps to: FR-FE11-001; AC-FE11-001; TD-026.
  - DoD: `/api/users` returns only `data` and `pagination`; Admin counters map from `/api/reports/users`; global counts are independent from page rows.
  - Integration state: PR #34 merged as `411fa25a`; post-merge CI run `29652243809` passed.

- [x] **FE11-META01 - Reconcile completed FE11 evidence metadata.**
  - Maps to: TD-027.
  - Depends on: TD-026 merge and a serial Integration Lead `SPEC.md` writer window.
  - DoD: only approved existing Test Case/Status cells change; requirements and deferred rows remain unchanged; H2, checks, H3, merge, and integration evidence pass.
  - Integration state: PR #35 merged as `c286cd9b`; post-merge CI run `29652617587` passed.

## Admin Navigation And Permissions Tasks

- [x] **FE11-PERM01 - Activate the approved TD-023 contract.**
  - Maps to: TD-023; FR-FE11-030/032; AC-FE11-016/017.
  - DoD: PLAN/TASKS/TEST_PLAN/CHANGELOG and debt state name the bounded scope; whole FE11 remains deferred.
  - Evidence: governance artifacts name the bounded slice, `TD-023` is `IN PROGRESS`, `TD-025` stays open, and whole FE11 remains deferred.

- [x] **FE11-PERM02 - Add the canonical permission policy and fresh service DTO.**
  - Maps to: FR-FE11-032; BR-FE11-017; AC-FE11-017.
  - DoD: backend owns exactly 3 roles and 15 permissions; every call returns independent allowlisted objects with stable order.
  - Evidence: service RED failed because `getPermissions` was absent; GREEN plus Audit Service regression passes 132/132 tests.

- [x] **FE11-PERM03 - Expose Admin-only GET /api/admin/permissions.**
  - Maps to: BR-FE11-001/011/012/017; FR-FE11-015/032; AC-FE11-017; NFR-FE11-SEC-001/002.
  - DoD: authentication and Admin authorization run before controller invocation; Admin receives exactly `{ roles, permissions }`.
  - Evidence: route RED returned 404 for all four cases; GREEN security-focused regression passes 28/28 tests with 401/403 before controller use.

- [x] **FE11-PERM04 - Align Admin navigation and consume the permission API.**
  - Maps to: BR-FE11-016/017; FR-FE11-030/032; AC-FE11-016/017.
  - DoD: sidebar has exactly eight approved entries; Permissions is reachable; Membership remains untouched outside the sidebar; no frontend matrix constant remains.
  - Evidence: focused frontend RED exposed the missing adapter/sidebar and hardcoded matrix; GREEN proves the exact eight-entry navigation and canonical adapter.

- [x] **FE11-PERM05 - Compose FE11 permissions with independent FE12 counts.**
  - Maps to: FR-FE11-032; AC-FE11-017; TD-026 ownership decision.
  - DoD: role cards use FE12 `usersByRole`; coverage/cells derive from FE11 `allowedRoles`; independent failures preserve last success and expose retry controls.
  - Evidence: helper RED failed 3/3 expected assertions; GREEN focused frontend passes 38/38, full frontend passes 120/120, lint/build pass.

- [x] **FE11-PERM06 - Pass H2/H3/B7 and close TD-023.**
  - Depends on: FE11-PERM01..FE11-PERM05.
  - DoD: L1-L4 evidence, human reviews, implementation PR merge, post-merge main CI, closeout PR, and final main CI are recorded; TD-023 is resolved while TD-025 and whole FE11 remain deferred.
  - Integration state: H2/H3 approved on 2026-07-19; PR #37 passed CI run `29654621448`, merged as `356130e4`, and post-merge `main` CI run `29655548150` passed. This documentation-only closeout publishes the B7 record; its merge and final CI are reported in the final handoff.

## FE11 Finalization Batch Tasks

- [x] **FE11-FIN01 - Approve and activate the FE11 Finalization Batch.**
  - Maps to: TD-012, TD-014, TD-015, TD-016, TD-017, TD-025.
  - DoD: approved design/plan, synchronized Core contracts, two-wave ownership, validation commands, and debt activation are merged before product work.
  - Evidence: PR #39 passed `foundation-checks` run `29658802446`, merged as `62ac2d1`, and exact post-merge `main` CI run `29658912068` passed.

- [x] **FE11-LIFE01 - Add the idempotent schema migration and synchronized contracts.**
  - Maps to: TD-012, TD-016; FR-FE11-010/021; FE02/FE03/FE10 shared schema dependencies.
  - DoD: five target columns, deterministic email uniqueness, models, bindings, baseline, static tests, and optional live-twice evidence agree.
  - Evidence: idempotent migration, baseline/model/binding synchronization, static schema tests, and two successful disposable SQL Server executions are recorded in the Wave A and full-reconciliation validation records.

- [x] **FE11-LIFE02 - Persist and return Librarian fields safely.**
  - Maps to: BR-FE11-015/024..026; FR-FE11-003/005/009/010/017/028; AC-FE11-005/011; TD-012/014.
  - DoD: create/read/update use 100-character nullable fields only for current Librarian targets; create/resend revalidate the active acting Admin transactionally; duplicate create conflicts are safe and deterministic.
  - Evidence: account-setup repository, safe DTO, service, route, and duplicate/actor RED-GREEN cases are recorded in the Wave A validation record.

- [x] **FE11-LIFE03 - Implement optimistic and no-op managed-user updates.**
  - Maps to: BR-FE11-004/010/014/027; FR-FE11-004/007/020/021/023; AC-FE11-004/008/023; TD-014/015/016.
  - DoD: actor/target locks, effective version, duplicate mapping, no-op behavior, safe audit allowlist, and rollback are proven.
  - Evidence: lifecycle repository/service/route tests prove locked outcomes, stale/no-op/effective updates, safe audit metadata, and rollback.

- [x] **FE11-LIFE04 - Implement atomic deactivation and credential invalidation.**
  - Maps to: BR-FE11-003/006/010/015/027; FR-FE11-008/011/016..019/023; AC-FE11-007/009/012/023; TD-014/015/016.
  - DoD: lifecycle-mode guards, active borrowing block, REFRESH revocation, audit, rollback, and FE07 approval serialization are proven.
  - Evidence: lifecycle/borrowing repository tests and the live SQL race suite prove the allowed serialized outcomes; the impossible inactive-member/newly-approved-request state does not commit.

- [x] **FE11-LIFE05 - Align the Admin UI and remove implicit development Admin access.**
  - Maps to: NFR-FE11-SEC-001/002/004; AC-FE11-004/007/011/012/023; TD-017.
  - DoD: every mode requires stored authenticated Admin state; update/deactivate send the effective version and reload authoritative state.
  - Evidence: frontend API/page tests, full frontend regression, lint/build, and browser regression are recorded in the Wave A validation record.

- [x] **FE11-LIFE06 - Pass Wave A H2/H3/B7 integration.**
  - Depends on: FE11-LIFE01..FE11-LIFE05.
  - Evidence: PR #40 H2/H3 review, merge `1555111`, post-merge CI `29685953839`, and Live SQL/browser evidence in the full reconciliation packet.

- [x] **FE11-REQ01 - Canonicalize Admin request list and detail reads.**
  - Maps to: BR-FE11-019/026; FR-FE11-034; AC-FE11-019; TD-025.
  - Evidence: canonical Admin-first route/service/repository tests pass; browser acceptance proves server pagination and authoritative detail against the shared FE07 state.

- [x] **FE11-REQ02 - Align request pagination, detail, actions, and DOCX UI.**
  - Maps to: FR-FE11-034/035; AC-FE11-019; TD-025.
  - Evidence: frontend contract tests and `E2E-FE11-ACC01` prove two-page server data, frozen-filter DOCX across all 21 matching rows, and status-specific detail controls.

- [x] **FE11-REQ03 - Prove FE07 terminal-state immutability.**
  - Maps to: BR-FE11-019; FR-FE11-035; FE07 request lifecycle invariants; TD-025.
  - Evidence: focused backend tests and browser acceptance prove completed detail is read-only and direct FE07 approve/reject attempts both return `409 BORROW_REQUEST_NOT_PENDING`.

- [x] **FE11-ACC01 - Pass FE11 browser acceptance and Wave B integration.**
  - Depends on: FE11-REQ01..FE11-REQ03.
  - Includes: evidence-only Admin Dashboard coverage for FR-FE11-031 without redesigning FE12 ownership.
  - Evidence: PR #40 merged as `1555111`; final PR CI `29685838610` and exact post-merge `main` CI `29685953839` passed; human FE01-FE12 walkthrough and H3 were approved.

- [x] **FE11-FIN02 - Publish final FE11 B7 closeout.**
  - Depends on: FE11-LIFE06, FE11-ACC01.
  - Evidence: FE11 finalization is included in the approved FE01-FE12 H3 walkthrough and full reconciliation closeout.
  - DoD: all four PRs and exact main CI runs are recorded; FE11 is complete through B7 and no SQL or browser residual remains under TD-021.

- [x] **FE11-CLOSE01 - Reconcile the final Admin Audit Log presentation contract.**
  - Maps to: BR-FE11-018, BR-FE11-026; FR-FE11-033; AC-FE11-018.
  - DoD: the Admin UI exposes canonical `q`, `action`, `actorId`, `from`, and `to` filter inputs; source-level RED-GREEN regression evidence exists; API, schema, authorization, pagination, and redaction remain unchanged.
  - Evidence: `frontend/test/userManagementFrontend.test.js`, `frontend/src/page/UserManagement.jsx`, and `.sdd/reviews/final-governance-closeout-validation-2026-07-20.md`.
  - Review state: historical pre-integration checkpoint. PR #54 and `v1.0.2` are complete; PR #59 merged the H3-reviewed commits `962ceb1` and `daaeea6` as `eed2688`. Any future `v1.0.3` remains a separate current-main release decision.

## Deferred FE11 Work

The approved Phase 2 FE11 finalization scope is complete through B7. Future enhancements that remain outside the approved release scope stay explicitly deferred; the historical prototype is not used as completion evidence.

## Admin Console Full Frontend Refactor Tasks

- [ ] **FE11-UXR01 - Add pure navigation, dashboard, permission, and audit presentation contracts.**
- [ ] **FE11-UXR02 - Build the responsive Admin shell and shared presentation primitives.**
- [ ] **FE11-UXR03 - Migrate Dashboard and User Management with desktop/mobile parity.**
- [ ] **FE11-UXR04 - Migrate Requests, Permissions, and Audit without changing API ownership.**
- [ ] **FE11-UXR05 - Migrate Library/Circulation and remove unreachable membership/payment Admin code.**
- [ ] **FE11-UXR06 - Cut over `/admin/users` and pass focused/full automated validation.**
- [ ] **FE11-UXR07 - Pass authenticated desktop/mobile Azure Staging acceptance and publish validation evidence.**
