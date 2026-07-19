# CHANGELOG.md - FE11 User & Role Management

## 2026-07-19 - Phase 2 Exit Closeout

- feat-user-role-management is accepted within the complete Phase 2 FE01-FE12 reconciliation recorded by PR #40/#41; validation and residual boundaries are consolidated in `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Deferred and future-scope limitations remain explicit and are not widened by this closeout.

## 2026-07-19 - Finalization Wave B Implemented And H2-Ready

- Added feature-specific FE11 Playwright acceptance for Admin Dashboard evidence and Request Management server pagination, filtering, authoritative detail, all-filtered-row CSV, pending controls, completed read-only behavior, and FE07 terminal-state `409` enforcement.
- Extended the isolated E2E harness with optional Admin setup, FE07/auth-backed Admin request reads, safe user-directory reads, and a fresh integration app per test.
- RED-GREEN exposed both the missing Admin fixture and cross-test shared-state contamination before the harness changes were accepted.
- Fresh focused evidence passes 80/80 backend, 48/48 frontend, 10/10 system integration, 2/2 Playwright, and 100% FE11 traceability.
- `FE11-REQ01..FE11-REQ03` are implemented. Draft PR #40 CI run `29679154327` passes on integrated commit `422246b`; `FE11-ACC01`, `TD-025`, H2/H3, and human integration acceptance remain open.

## 2026-07-19 - Finalization Wave A Implemented And H2-Ready

- Added the guarded idempotent FE11 migration, deterministic `UX_Users_Email`, canonical 255-character user/notification email persistence, nullable `DeactivatedAt`, and nullable 100-character Librarian fields.
- Added transaction-authoritative create/resend acting-Admin checks, safe deterministic duplicate conflicts, Librarian create/read/update persistence, and the effective `COALESCE(UpdatedAt, CreatedAt)` DTO version.
- Added optimistic/no-op managed-user updates and atomic ACTIVE/LOCKED deactivation with pending-activation distinction, active-borrowing guard, active REFRESH revocation, safe audit metadata, and rollback.
- Aligned FE07 approval to the approved member-first lock order and added mutation-enabled SQL race-test coverage without changing FE07 ownership or borrowing rules.
- Removed implicit development Admin access; update/deactivation now send the loaded effective version, support Librarian fields, and reload authoritative state.
- Final diff review added three RED-GREEN regressions: migration type/nullability enforcement, transaction-authoritative actor priority before duplicate-email disclosure, and rejection of setup completion for accounts with non-null `DeactivatedAt`.
- Wave A remains uncommitted pending H2. `FE11-LIFE06`, Wave B browser acceptance, final merge/CI evidence, and whole-feature B7 closeout remain open.
- Applied the FE11 migration twice and passed the shared live SQL concurrency/system suites on a disposable SQL Server runtime; cleanup evidence is recorded in the full-reconciliation Live SQL review.

## 2026-07-19 - Finalization Batch Governance Activated

- Bumped `SPEC.md` to 0.4.3 and activated the approved Full-depth Hybrid SDD+ADD Finalization Batch; product implementation has not started.
- Synchronized FE02/FE03/FE10/FE11, ADR-002, and the shared API contract for 255-character email persistence, 100-character Librarian/profile fields, and idempotent migration ownership.
- Locked `UserManagementView.updatedAt` to `COALESCE(Users.UpdatedAt, Users.CreatedAt)`, pending-activation deactivation rejection, transactional create/resend acting-Admin revalidation, and deterministic duplicate-email conflicts.
- Activated `FE11-FIN01..FE11-FIN02`, Wave A/Wave B validation targets, and debt states for TD-012/014/015/016/017/025 while keeping every new task unchecked.
- Preserved historical account-setup B7 evidence while marking AC-FE11-003/010/021 `PARTIAL` only for the newly approved acting-Admin and Librarian-field hardening that Wave A must prove.
- Preserved FE07 as the sole approve/reject mutation owner and locked canonical Admin request list/detail, server pagination, CSV, Dashboard evidence, and browser acceptance scope.
- Product work remains blocked until the governance PR passes checks, receives H3, and merges into `main`.

## 2026-07-19 - Admin Navigation And Permissions Integrated (B7)

- H2 and H3 were approved on 2026-07-19 for the unchanged implementation diff and final PR integration review.
- PR #37 passed `foundation-checks` run `29654621448` and merged into `main` as `356130e4905a59d219bae8e9b369f7690348cba2`.
- Exact post-merge `main` CI run `29655548150` passed backend/system tests, coverage, frontend lint/tests/build, browser E2E, and backend health import.
- Closed `FE11-PERM01..FE11-PERM06` and resolved `TD-023` without changing FE04, FE12 production behavior, schema, permission mutation, or role CRUD.
- `TD-025` remains open and whole FE11 remains `Implementation State: DEFERRED`.

## 2026-07-19 - Admin Navigation And Permissions H2-Ready

- Added immutable FE11 ownership of the exact three-role, 15-permission Phase 1 policy and fresh allowlisted service DTOs.
- Added Admin-first `GET /api/admin/permissions` with focused 401/403/200 route coverage and no repository or mutation dependency.
- Aligned the Admin Console to the exact eight approved sidebar entries and replaced the hardcoded matrix with FE11 data plus independent FE12 `usersByRole` counts.
- Added dynamic module coverage, matrix cells, independent retry/error state, strict API/OpenAPI docs, and focused frontend derivation tests.
- RED-GREEN evidence is complete; full validation passes 606/606 backend and 120/120 frontend tests plus coverage, lint, build, OpenAPI, health, traceability, and browser regression.
- Implementation remains uncommitted pending H2. `TD-023` stays `IN PROGRESS`, `FE11-PERM06` stays open, `TD-025` stays open, and whole FE11 remains deferred.

## 2026-07-19 - Admin Navigation And Permissions Slice Approved

- Approved Hybrid SDD + ADD Standard-depth design and implementation plan for `TD-023`.
- Locked the exact eight-entry Admin Console sidebar, Admin-only `GET /api/admin/permissions`, canonical 15-row FE11 policy, and independent FE12 role counts.
- Activated `FE11-PERM01..FE11-PERM06` and marked `TD-023` in progress without claiming product implementation.
- Preserved FE04 Membership, TD-025, and whole-feature `Implementation State: DEFERRED`.

## 2026-07-18 - Fast-Track Batch 1 Integrated (B7)

- Closed `TD-024` through PR #33 (`3c88e432`) with post-merge CI `29651173195`.
- Closed `TD-026` through PR #34 (`411fa25a`) with post-merge CI `29652243809`.
- Closed `TD-027` through PR #35 (`c286cd9b`) with post-merge CI `29652617587`.
- Marked `FE11-AUD01`, `FE11-ENV01`, and `FE11-META01` complete and moved the three debt records to resolved traceability.
- Preserved `TD-023` and `TD-025` as open and kept whole FE11 at `Implementation State: DEFERRED`.

## 2026-07-18 - Canonical Admin Audit Log Implementation H2-Ready

- Added Admin-only `GET /api/admin/audit-logs` with canonical query validation for `page`, `limit`, `q`, `action`, `actorId`, `from`, and `to`; authentication and authorization run before detailed validation.
- Replaced prototype audit pagination with typed parameterized SQL filtering, escaped LIKE search, shared data/count scope, stable `CreatedAt DESC, LogId DESC` ordering, and `totalPages: 0` for empty results.
- Added action-aware default-deny projection across the approved cross-feature action matrix; raw metadata, user agent, credential concepts, raw notes/reasons/paths, and unrelated identifiers are not returned.
- Migrated the Admin UI to `adminApi.auditLogs`, canonical nested actor/target/details DTOs, filter controls, limit 20 pagination, and React text-only safe detail rendering.
- Retired `GET /api/users/audit-logs` as unconditional `404 NOT_FOUND` without authentication or service invocation; no compatibility alias remains.
- RED-GREEN evidence: route, repository, service, and frontend contract failures were observed before implementation; 246/246 focused backend, 598/598 full backend, and 111/111 frontend tests pass.
- Coverage is 92.51% statements, 82.46% branches, 97.1% functions, and 92.44% lines; lint, build, OpenAPI parse, traceability, diff, scope, and sensitive-data scans pass.
- Implementation is H2-ready and remains uncommitted. `TD-024` stays `IN PROGRESS`, `FE11-AUD01` stays unchecked, and whole FE11 remains deferred until H2/H3/merge/post-merge evidence.

## 2026-07-18 - Fast-Track Batch 1 Activated

- Approved H1-001..H1-006 for TD-024, TD-026, and TD-027.
- Corrected H1/H2/H3 authority and required the activation docs PR to pass checks and H3 before merge.
- Locked Audit Logs to SPEC query names and action-aware default-deny projection.
- Selected FE12 `/api/reports/users` for Admin counters and preserved the FE11 list envelope.
- Approved the exact existing-cell TD-027 matrix and serial post-TD-026 SPEC ownership.
- Product implementation remains pending per-slice H2 and H3 gates; whole FE11 remains deferred.

## 2026-07-18 - Admin Role UI Contract Integrated (B7)

- PR #30 merged into `main` as commit `c20d3251254467a1543355f18c705590724f5b55`.
- PR CI run `29643619999` and post-merge GitHub Actions run `29644292781` passed `foundation-checks`, including backend/system tests, coverage, frontend lint/tests/build, browser E2E, and backend health import.
- B7 integration is complete for `FE11-UIR01..UIR05`; `TD-022` is resolved.
- Whole-feature `Implementation State: DEFERRED` and all unrelated FE11 work remain unchanged.

## 2026-07-18 - Admin Role UI Contract Implemented And Validation Ready

- Updated the frontend role API adapter to send numeric `roleId` in the canonical assignment body and revocation path.
- Added complete positive/unique catalog validation for `ADMIN`, `LIBRARIAN`, and `MEMBER` with no hardcoded ID or role-name mutation fallback.
- Added deterministic preflight planning, assignments before revocations, preserved non-editable roles, and zero-request no-op saves.
- Added first-failure reconciliation that reloads the authoritative target into the open modal and disables Save when reconciliation also fails.
- RED-GREEN evidence: 12/12 focused frontend tests; validation evidence: 101/101 full frontend and 105/105 focused backend role tests, lint/build/traceability/diff/security PASS.
- Human implementation review, merge, and post-merge CI remain pending; `FE11-UIR05` and `TD-022` are not closed.
- Backend role behavior, `SPEC.md`, schema, and all unrelated FE11 work remain unchanged and deferred.

## 2026-07-18 - Admin Role UI Contract Slice Approved

- Approved the bounded `TD-022` design and implementation plan for mapping Admin role selections to numeric role IDs from the authenticated FE11 role catalog.
- Required catalog validation before mutation, assignments before revocations, no hardcoded role IDs, and authoritative target-user reload after partial failure.
- Added `FE11-UIR01..UIR05`; no implementation or validation evidence is claimed by this planning checkpoint.
- Backend role behavior, `SPEC.md`, schema, and all unrelated FE11 work remain unchanged and deferred.

## 2026-07-18 - FE11 Admin Console Context And Drift Reconciled

- Audited FE11/Admin Console changes from base `66642b5` to `origin/main@8da84bd` with separate Standards and Spec reviews.
- Confirmed B7 completion only for account setup, transactional backend role mutation, and safe user list/detail; whole-feature `Implementation State: DEFERRED` remains unchanged.
- Reclassified the existing Audit Log pagination/display change as partial prototype behavior, not conformance with the canonical `/api/admin/audit-logs` filter/redaction contract.
- Recorded Admin role UI, navigation/permissions, Audit Logs, Request Management, list-envelope, and traceability drift in `TECH_DEBT.md`.
- Reconciled project memory, ADR status, shared API/test documentation, and FE11 task history without changing the approved SPEC or product behavior.
- Human review confirmed the audit and documentation-only reconciliation on 2026-07-18; `FE11-C01` is closed without approving a remediation implementation slice.

## 2026-07-18 - Safe User List And Detail Integrated (B7)

- PR #27 merged into `main` as commit `ed6bd71714bf506ae838305e5946e3bbd9380102`.
- Post-merge GitHub Actions run `29639933730` passed all `foundation-checks`, including backend/system tests, coverage, frontend lint/tests/build, browser E2E, and backend health import.
- B7 integration is complete for `FE11-U01..U06`; remaining FE11 work stays deferred.

## 2026-07-18 - Safe User List And Detail Implemented And Validation Ready

- Added Admin-first validation for page, limit, status, role, search, and detail user IDs; invalid supplied values are rejected instead of clamped.
- Replaced FE11 managed-user responses with the explicit allowlist, `phoneNumber`, and deterministic uppercase roles; hostile extra columns are excluded.
- Restricted list search to email, full name, and user ID while preserving `CreatedAt DESC, UserId DESC` ordering.
- Added a detail-only parameterized query for persisted `BORROWED`, `UNPAID` outstanding balance, and `ACTIVE`/`NOTIFIED` reservation summaries with numeric zero defaults.
- Missing detail users now return `404 USER_NOT_FOUND`; update/deactivation not-found behavior remains deferred.
- Admin UI now omits `ALL`/empty query values, fetches real detail, renders all summaries, and reloads stale list data after detail 404.
- Automated evidence: 105/105 focused backend, 434/434 full backend, 81/81 frontend, 92.47% statements, 82.35% branches, lint/build/traceability/security/diff checks PASS.
- Human implementation review was approved on 2026-07-18; `FE11-U06` is complete.
- No schema migration occurred and `TD-012` remains open; remaining FE11 work stays deferred.

## 2026-07-18 - Safe User List And Detail Slice Approved

- Approved the explicit `UserManagementView` allowlist with `phoneNumber` and detail-only `relatedSummary`.
- Required strict list/detail input validation, approved search fields, stable ordering, and deterministic `404 USER_NOT_FOUND`.
- Locked aggregate semantics to persisted FE07 `BORROWED`, FE09 `UNPAID` outstanding balance, and FE08 `ACTIVE`/`NOTIFIED` reservations.
- Kept `department`/`specialization` under `TD-012`; this slice has no schema change and returns no fake null placeholders.
- Required route, service, repository, and frontend RED-GREEN tests; no implementation evidence is claimed by this planning entry.

## 2026-07-18 - Transactional Role Management Integrated (B7)

- PR #25 merged into `main` as commit `0e1ef8f67e2d7a454e96b8b5d6878d31ed03eae0`.
- Post-merge GitHub Actions run `29631406399` passed all `foundation-checks`, including backend/system tests, coverage, frontend lint/tests/build, browser E2E, and backend health import.
- B7 integration is complete for `FE11-R01..R05`; remaining FE11 work stays deferred.

## 2026-07-18 - Transactional Role Management Implemented And Validation Ready

- Added Admin-first positive-integer validation for role assignment and revocation endpoints.
- Added a locked SQL transaction that revalidates the active acting Admin, target user, requested role, target mappings, and active Admin holders.
- Role mutation and audit now commit or roll back together; duplicate assignment and absent revocation return deterministic errors.
- Added last-user-role and last-active-Admin protection under `UPDLOCK, HOLDLOCK`.
- Added route, service, and repository RED-GREEN tests: 70/70 focused and 399/399 full backend tests pass.
- Repository coverage is 100% statements/lines/functions and 90.24% branches; project coverage and traceability gates pass.
- Human implementation review was approved on 2026-07-18; `FE11-R05` is complete.
- Remaining FE11 work stays deferred.

## 2026-07-18 - Transactional Role Management Slice Approved

- Approved the bounded FE11 role assignment/revocation design and implementation plan.
- Locked deterministic error semantics for missing actor/target/role, duplicate assignment, absent mapping, final user role, and last active Admin.
- Required one parameterized SQL transaction for role mutation plus audit with `UPDLOCK, HOLDLOCK`.
- Kept remaining FE11 work deferred and added forward-compatible `Implementation State: DEFERRED` metadata for this feature; the role slice is tracked separately as `FE11-R01..R05`.
- No implementation evidence is claimed by this planning entry.

## 2026-07-18 - Admin Audit Log Pagination And Display Fix

- Added Admin-only server-side pagination for audit logs with stable `CreatedAt DESC, LogId DESC` ordering.
- Fixed the Admin refresh action so Audit Logs reloads its own data instead of reloading the user directory.
- Restricted user-target joins to user/account audit events so borrowing, notification, catalog, and membership target IDs are not mislabeled as users.
- Updated the audit table to show actor identity, target type/ID, IP, full timestamp, total records, last refresh time, and shared Admin pagination.
- Added service and route coverage for pagination normalization and Admin-only authorization.

## 2026-07-17 - Phase 1 Baseline Approved

- Nhật approved the normalized FE11 account lifecycle, role, no-op update, user-list, concurrency, and account-setup boundary as the Phase 1 baseline; remaining implementation is deferred where documented.

## 2026-07-17 - Final User List And No-Op Contract Audit

- Defined same-email/no-op update behavior: HTTP `200`, unchanged `UpdatedAt`, and no success audit when nothing changes.
- Made user-list defaults, bounds, filters, stable order, and safe search fields explicit.

## 2026-07-17 - Account Lifecycle And Role Concurrency Hardening

- Bumped `SPEC.md` to 0.4.2.
- Made deactivation atomic with `deactivatedAt`, credential invalidation, and audit logging.
- Added serialized last-Admin checks and optimistic concurrency to deactivation.
- Restricted account creation types to `member` and `librarian`; nullable `Users.DeactivatedAt` requires a database migration before implementation.

## 2026-07-17 - Safe DTO And Deterministic Concurrency Revision

- Bumped `SPEC.md` to 0.4.1 and kept the revision `READY FOR REVIEW`.
- Replaced broad "all user information" wording with the explicit `UserManagementView` allowlist and forbidden-field boundary.
- Standardized updates on `expectedUpdatedAt` optimistic concurrency with `409 STALE_USER_STATE`; removed the last-write-wins alternative.
- Added missing AC-FE11-016..019 traceability, AC-FE11-023, and concrete planned test intent for every previously `TBD` mapping.
- Corrected task/test status: the account-setup slice is complete while all other FE11 implementation remains deferred.

## 2026-07-15 - Account Setup Slice Implemented And Validation Ready

- Admin-created Member/Librarian accounts now commit as `INACTIVE` with profile, role, hashed 24-hour setup token, and audit in one transaction.
- FE10 delivery runs after commit and returns only safe `SENT`/`FAILED` status.
- Added Admin-only setup resend with eligibility checks, row locks, 60-second cooldown, prior-token revocation, new token/event/key, and transactional audit.
- Added frontend setup-link consumption through the existing FE02 reset endpoint without email/OTP controls.
- Task 7 automated evidence passed: 170/170 affected backend tests, 75/75 frontend tests, lint, build, traceability, credential scan, and diff checks.
- Nhat confirmed the final cross-feature validation packet; `FE11-S07` is complete and all unrelated FE11 work remains deferred.

## 2026-07-15 - Account Setup Contract Revision

- Bumped `SPEC.md` to 0.4.0 and marked the revision ready for human review.
- Replaced immediate `ACTIVE` creation with deterministic `INACTIVE -> ACTIVE` setup lifecycle.
- Added ADR-005 ownership split: FE11 issues/rotates `ACCOUNT_SETUP`, FE10 delivers it through the FE11-bound requester, and FE02 consumes it and activates the account.
- Required a random unusable bcrypt hash instead of a fixed literal placeholder.
- Added safe post-commit delivery semantics and Admin-only resend with token rotation and 60-second cooldown.
- Added BR-FE11-021..025, FR-FE11-036..038, AC-FE11-020..022, EC-FE11-019..021, and Q-FE11-014..016.
- Replaced the FE11 plan/task stubs with a reviewable account-setup slice; remaining FE11 work stays deferred.

## 2026-06-03

- Created FE11 User & Role Management feature specification structure.
- Established specification files: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md, and CHANGELOG.md.
- Expanded scope to include user list viewing, account creation (members/librarians), user information updates, account deactivation, librarian account management, and role management.
- Added stable requirement IDs for business rules, functional requirements, acceptance criteria, edge cases, and open questions.
- Identified key risks related to access control, account lockout, and audit logging.
- Clarified secure admin-created account setup: no admin-entered passwords, inactive before setup, setup completed through FE02.

## 2026-06-09

- Set FE11 owner to Dung according to the latest assignment sheet.
- Merged relevant scope from the legacy `.sdd/specs/feat-role-and-management` draft into the canonical `.sdd/specs/feat-user-role-management` folder.
- Aligned FE11 use cases and feature tests with the assignment sheet: UC49-UC57 and FT50-FT58.
- Kept update/deactivate librarian account flows from the legacy draft.
- Moved account unlock, account reactivation, and admin-initiated password reset out of the main FE11 assignment scope unless explicitly approved later.

## 2026-06-10

- Updated API contract policy to allow approval in `SPEC.md` unless the team reintroduces a shared API contract document.

## 2026-06-10 - Phase 1 Review Decisions Approved

- Approved open-question decisions from `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Updated `SPEC.md` decision status from draft/proposed/open to approved where applicable.
- Preserved Phase 1 scope controls and deferred future-work items explicitly.

## 2026-06-15

- Updated FE11 create-account behavior so admin-created member and librarian accounts are created with `ACTIVE` status immediately.
- Kept password setup as a separate FE02 flow; admin still does not enter or view user passwords.

## 2026-06-21

- Clarified that admin-created account setup notification queuing must tolerate Phase 1 notification schema/template differences.
- Documented that a valid create-user flow must not return an internal server error solely because optional notification content columns are unavailable.

## 2026-06-25

- Bumped version 0.1.0 -> 0.2.0 (MINOR). Status unchanged (APPROVED).
- Added section 7.1 with 15 new EARS Unwanted-behavior functional requirements (FR-FE11-015 to FR-FE11-029) promoting existing Alternative Flows, Business Rules, Edge Cases, and Resolved Questions into traceable error/abnormal-condition requirements.
- Coverage of Unwanted-behavior FRs raised from ~21% (3 of 14) to ~62% (18 of 29), exceeding the >=30% target per Spec-Driven Development EARS guidance.
- Each new FR traces back to its source EC/BR/AF/Q; no new logic invented.
- Updated section 16 Traceability Matrix: added a dedicated Unwanted-Behavior table mapping each new FR to its source BR/EC/AF/Q and test case (TBD where no test is allocated yet), and refreshed the Coverage Summary totals.

## 2026-06-30

- Bumped `SPEC.md` version to 0.3.0 and updated Last Updated to 2026-06-30.
- Added admin console requirements for sidebar visibility, Dashboard, Permissions, Audit Logs, and Request Management.
- Documented that Confirm Payment and Confirm Borrow are removed from the admin sidebar in the current prototype.
- Clarified that admin Reports-style content is consolidated into Dashboard while detailed reporting remains FE12.
- Added request-management rule: pending requests may expose action controls; completed requests are view-only.
- Added BR-FE11-016..020, FR-FE11-030..035, AC-FE11-016..019, EC-FE11-016..018, and Q-FE11-011..013.
