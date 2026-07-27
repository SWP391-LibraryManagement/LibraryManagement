# CHANGELOG.md - FE10 Notification Management

## 2026-07-28 - Synchronize non-overlapping upstream regression tests

- Upstream advanced from `main@db97f17` to `main@f3ebe95` with one test-only
  commit adding FE07/FE08 ARIA-tablist and toast-FIFO regression guards.
- None of its three changed files overlapped the 48-entry FE10 candidate, so
  the branch fast-forwarded mechanically with no new Core contract decision,
  conflict, staged file, or product-code change.
- The full frontend test suite passed 258/258 on the exact synchronized
  baseline before the new H2 fingerprint is generated.

## 2026-07-28 - Approve second Core-drift reconciliation addendum

- Immediately after the approved `main@5a3c84b` reconciliation, upstream
  advanced by three commits through `main@db97f17`.
- The overlap was limited to `frontend/src/api/libraryFeatureApi.js` and
  `frontend/src/styles/app-shell.css`; no candidate file was staged or
  committed.
- The user approved `H1 drift addendum main@db97f17`. The candidate now
  preserves the upstream Vietnamese member-cancellation reason, responsive
  return/reservation controls, and all other round-two upstream corrections
  together with the FE10 inbox API and scoped notification styles.
- Complete post-drift validation and a fresh H2 fingerprint remain required
  before publication.
- Fresh post-drift evidence passed: backend coverage 69/69 suites and
  1114/1114 tests, frontend 258/258 plus lint/build, deployment 15/15, system
  10/10, trace state 3/3, FE10 trace 14/16 (88%), and Chromium 11/11.
- The exact migration passed twice with one `ReadAt` column, one supporting
  index, historical-only backfill, protected aggregates unchanged, and zero
  disposable databases remaining. Backend dependency audit reported zero
  vulnerabilities; the repository frontend audit gate accepted only the
  non-applicable unstable-RSC React Router advisory for this declarative
  `BrowserRouter` application.
- Final security-review TDD added a repository regression for the complete
  sensitive pending-selector allowlist. RED proved legacy `listPending`
  omitted `ACCOUNT_SETUP`; the minimal SQL predicate fix aligned it with the
  active worker and in-memory selector, focused GREEN passed 161/161, and full
  backend coverage passed 1114/1114.

## 2026-07-28 - Approve Core-drift reconciliation addendum

- A required post-H2 fetch found four new upstream commits ending at
  `main@5a3c84b` with overlapping deployment workflow, schema, operator guide,
  and deployment-test changes; no reviewed file had been staged or committed.
- The user approved a new H1 drift addendum to preserve the packaged
  `add_change_password_otp_token_type.sql` startup/readiness contract and
  Vietnamese account-verification seed together with the FE10 migration
  preflight and ordered deployment.
- The candidate was rebased onto `main@5a3c84b`; complete post-drift validation
  and a fresh H2 fingerprint are required before publication.

## 2026-07-28 - Approve CI-gated deployment addendum

- Reconciled the candidate with upstream `main@41282b4`, which introduced
  automatic staging deployment after successful `main` CI.
- Preserved automatic and manual deployment while making both fail closed on
  the exact `FE10_INBOX_MIGRATION_SHA256` proof in the GitHub `staging`
  Environment; manual runs also require the approved boolean confirmation.
- Preserved preflight -> backend -> frontend -> smoke ordering and required
  migration proof plus exact-head manual staging before H3/merge.
- The user explicitly approved this H1 addendum on 2026-07-28. It changes
  deployment orchestration only, not FE10 inbox behavior or authorization.

## 2026-07-28 - Implement personal notification inbox candidate (v0.5.0)

- Added the repeatable nullable `Notifications.ReadAt` migration, historical
  eligible-row backfill, supporting own-user index, canonical schema/model,
  and migration/repository contract tests.
- Added SQL-filtered own-user list, unread count, mark-one, and mark-all API
  operations with fixed eligible type/template pairs, exact safe DTOs,
  backend-owned action paths, idempotent reads, and IDOR-safe `404` behavior.
- Added the shared authenticated inbox context, non-overlapping 60-second
  refresh, bell with `99+` badge and five-unread preview, `/notifications`
  filters/pagination, and safe non-blocking navigation after read failure.
- Added FE04/FE07/FE08 fan-in evidence plus MEMBER/LIBRARIAN/ADMIN Chromium
  E2E covering privacy negatives, read behavior, responsive layout, and error
  semantics. Sensitive FE02/FE11 and legacy/userless records remain excluded.
- Added a fail-closed staging workflow gate requiring the two-run operator SQL
  migration before ordered backend, frontend, smoke, and browser verification.
- The first real SQL rehearsal exposed same-batch name resolution for the new
  `ReadAt` references. A RED regression test now requires deferred compilation;
  `sys.sp_executesql` fixed the migration, and the strict two-run rehearsal
  passed with protected aggregates unchanged and the disposable database removed.
- FE10-I01 through FE10-I07 and the FE10-I08 local validation matrix are green.
  H2, publication, Azure staging, H3, merge, and post-merge CI remain pending
  and unclaimed.
- Final H2 audit closed an SQL pagination overflow boundary by binding the
  validated page offset as `BIGINT`, and isolated the FE09 synthetic-auth E2E
  fixture from the new background unread-count request; focused and full gates
  passed after both corrections.

## 2026-07-28 - H1 plan approval and governance activation

- Recorded the user's approval of the detailed FE10-I01..I08 implementation
  plan as H1.
- Kept product implementation `NOT_STARTED` until this governance activation
  reaches `main`, matching the repository Fast-Track gate.
- Pre-H3 review removed stale draft-era approval text, restored the v0.5.0
  acceptance-matrix test/task columns, synchronized active feature/agent/test
  context, and recorded the latest non-overlapping `main` rebase baseline. This
  remediation changes no approved behavior or product implementation state.

## 2026-07-27 - Approved personal notification inbox expansion (v0.5.0)

- Recorded the user's approval of the consolidated written design and SPEC.
- Authorized detailed PLAN/TASKS preparation; product implementation remains
  blocked until the implementation plan is reviewed.

- Proposed one personal inbox for every authenticated `MEMBER`, `LIBRARIAN`,
  and `ADMIN`, restricted to the actor's own non-sensitive records.
- Reused each existing eligible email notification as the web inbox record;
  no `IN_APP` delivery channel or duplicate notification is introduced.
- Specified nullable `ReadAt`, historical eligible-row backfill, personal list
  and unread-count APIs, idempotent mark-one/mark-all operations, safe DTOs, and
  backend-derived allowlisted navigation.
- Added the authenticated bell, five-item preview, `/notifications` page,
  all/unread/read filters, pagination, polling, and non-blocking read-failure
  behavior to the proposed contract.
- Kept sensitive authentication/setup records, global staff logs, delete/
  archive, WebSocket/push, retry UI, and caller-supplied URLs out of scope.
- User approved the interactive design decisions and consolidated written
  design/SPEC on 2026-07-27; the detailed plan was approved on 2026-07-28.
- Marked the active v0.5.0 implementation state `NOT_STARTED` while retaining
  the completed v0.4.5 task history, so traceability remains report-only until
  the written contract is approved and new tasks are activated.

## 2026-07-27 - Implement staging email delivery remediation locally

- Added the transactional, repeatable `ACCOUNT_SETUP` template update-or-insert
  migration without destructive cleanup.
- Preserved the SMTP adapter message ID for successful FE02 verification/reset
  and FE11 account-setup delivery attempts without persisting sensitive content.
- Added the opt-in best-effort SYSTEM worker, safe defaults, lifecycle shutdown,
  overlap prevention, fixed-code error logging, and empty-poll audit suppression.
- Preserved the protected manual processing route, manual-only failed retry,
  sensitive synchronous delivery, existing public DTOs, and role boundaries.
- Fresh local evidence passes 165 focused tests, 1,079 backend tests, 232
  frontend tests, 9 deployment tests, 10 system integration tests, lint, build,
  trace enforcement, and diff/security review.
- H2 approved the complete candidate on 2026-07-27. Reviewed product commits
  are `7920d4b`, `2134d44`, and `ccb590c`; publication/CI, migration execution,
  worker settings, deployment, safe staging evidence, H3, and merge are not yet
  claimed.
- PR #65 CI and the first staging deploy passed, and the template migration
  passed twice. Live queue evidence then exposed SQL Server error 650 from the
  `READPAST` plus `HOLDLOCK` claim hints; the worker was disabled and an
  Azure-probed `READCOMMITTEDLOCK` correction was approved in the H2 addendum
  and committed as `a98f459`.
- Updated CI `30274110435` and deploy `30274367534` passed. After re-enabling
  the corrected worker, all 15 non-sensitive pending rows reached SENT with 15
  provider IDs, no sensitive persistence violation or empty SYSTEM audit was
  found, and every task-created firewall rule was removed. H3 and merge remain
  pending.

## 2026-07-27 - Approve staging email delivery remediation (v0.4.5)

- Required an idempotent existing-database upsert for the canonical active
  `ACCOUNT_SETUP` template.
- Required successful sensitive sends to retain only the SMTP provider message
  ID in attempt history.
- Approved an opt-in, lifecycle-managed SYSTEM worker for non-sensitive
  `PENDING` rows with defaults of 60 seconds and 20 rows.
- Preserved protected manual processing, manual-only failed retry, sensitive
  synchronous delivery, minimal DTOs, and provider-memory-only credentials.
- Recorded that Azure App Service F1 pauses the worker while the app sleeps.
- User approved the design and written contract on 2026-07-27; implementation
  remains unclaimed pending RED/GREEN evidence and H2.

## 2026-07-27 - Specify fail-closed stored template validation (v0.4.4)

- Required raw HTML tag syntax, inline event-handler attributes, and
  `javascript:` URLs in a stored template title/body to be rejected before
  rendering, notification/attempt persistence, or provider delivery.
- Kept runtime template values escaped/sanitized and preserved the existing
  recursive secret-like key rejection and `safePayload` redaction rules.
- Reconciled the previous ambiguity between EC-FE10-010 rejection and
  NFR-FE10-SEC-005 sanitization wording.
- Nhat approved the written SPEC on 2026-07-27, authorizing PLAN/TASKS
  preparation only; no code or tests are claimed by this entry.

## 2026-07-23 - Make queued delivery ownership and claiming deterministic

- Enforced canonical feature ownership for all queued notification types and required idempotency keys at every in-process source boundary.
- Replayed the persisted notification after an idempotency unique-key race instead of surfacing an internal error.
- Required every in-process request to provide a non-blank source entity type and positive source entity ID.
- Added durable `PROCESSING`: queued claims and sensitive acceptance now commit before provider I/O, while guarded sent/failed completion uses a new short transaction.
- Kept uncertain rows `PROCESSING` after terminal persistence failure, excluded them from automatic resend, and returned safe `DELIVERY_STATE_UNCERTAIN` for manual retry.
- Synchronized the canonical schema, model, OpenAPI, ADR, and idempotent migration with the revised lifecycle.

## 2026-07-20 - Vietnamese UI localization and typography

- Localized shared frontend labels, accessibility names, and safe error feedback used around notification-related surfaces.
- Preserved notification-template payloads, delivery behavior, API contracts, raw enum values, permissions, and business rules.
- Applied the shared `Be Vietnam Pro` body and `Noto Serif` heading typography contract with Unicode-capable fallbacks.

## 2026-07-19 - Phase 2 Exit Closeout

- feat-notification-management is accepted within the complete Phase 2 FE01-FE12 reconciliation recorded by PR #40/#41; validation and residual boundaries are consolidated in `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- FE02/FE10 OTP delivery follow-up is additionally closed through PR #42/#43/#44 with exact post-merge `main` CI evidence.
- Deferred and future-scope limitations remain explicit and are not widened by this closeout.

## 2026-07-19 - OTP Integration B7 Closeout

- FE10-S05 is complete through B7: PR #42 merged as `34d9180`, PR CI `29688102867` passed, and exact post-merge `main` CI `29688222757` passed.
- FE02/FE10 ownership, source rejection, secret-boundary, failure,
  idempotency, and reset-event evidence was complete at that historical
  checkpoint. Real provider delivery, the then-future personal inbox, and FE09
  caller integration were deferred; the v0.5.0 entry above supersedes only the
  personal-inbox part of that boundary.

## 2026-07-19 - OTP Integration Human Acceptance And Evidence Expansion

- Expanded ADR-004 ownership evidence across both sensitive types and every allowlisted non-FE02 requester, with exact safe HTTP source-override assertions and no side effects.
- Added repeated FE02 password-reset event coverage proving new token-ID idempotency without duplicate direct delivery.
- Focused FE02/FE10 validation passes 170/170; full backend passes 916/916 with configured coverage; frontend, system, deployment, traceability, OpenAPI/import, and isolated-port browser E2E gates pass.
- No product correction was required because the approved boundary already conforms. The user granted standing human acceptance; integration PR and exact post-merge `main` CI remain required.

## 2026-07-19 - OTP, FE02, FE04, And Schema Fan-In

- Synchronized the canonical baseline and FE10 OTP templates with the FE11-owned shared schema widths; the migration passed two disposable SQL Server executions.
- Fanned FE02 verification/reset delivery into the FE02-bound sensitive requester without duplicate delivery or persisted OTP content.
- Added the FE04-only `MEMBERSHIP_RESULT` source boundary with non-blocking post-commit delivery semantics.
- The focused FE02/FE10/integration gate passes 154/154 with full FE10/FE02 traceability; real-provider and final human closeout remain open.

## 2026-07-19 - OTP Provider Boundary Reconciliation

- Implemented the FE02-only verification/reset OTP ownership boundary with provider-memory rendering, canonical OTP variables, safe source metadata, and no raw/rendered sensitive persistence or response exposure.
- Added an idempotent OTP-template migration, OpenAPI separation of staff HTTP and internal FE02 requests, and focused/integration regression coverage.
- Recorded fresh evidence at 131/131 focused tests, 623/623 full backend tests, passing coverage thresholds, and 10/10 FE10 source FR tags.
- S03/S04 were subsequently fanned into the full reconciliation worktree; this historical note records the earlier isolated state.

## 2026-07-19 - Recipient Email Width Synchronization Activated

- Bumped `SPEC.md` to 0.4.2 and set the persisted `recipientEmail` contract to 255 characters so FE11 account-setup delivery cannot truncate a valid user email.
- Preserved FE10 delivery ownership, sensitive-source allowlists, idempotency, rendering, and non-blocking failure semantics.
- Schema/model/repository synchronization remains pending FE11 Finalization Wave A.

## 2026-07-17 - Phase 1 Baseline Approved

- Nhật approved the normalized FE10 lifecycle, sensitive-source ownership, OTP boundary, membership-result boundary, and deferred integration scope as the Phase 1 baseline.
- Synchronized FE10 `PLAN.md` and `TASKS.md` with the OTP contract, canonical template variables, and approved G12 execution status.

## 2026-07-17 - Final Lifecycle And Membership Contract

- Limited Phase 1 statuses to `PENDING`, `SENT`, and `FAILED` and defined `sentAt` for successful provider acceptance.
- Added the FE04 `MEMBERSHIP_RESULT` queue flow and made the Phase 1 performance/filter requirements deterministic.

## 2026-07-17 - Status Lifecycle And Source Contract Hardening

- Defined the Phase 1 status lifecycle and removed the unresolved `SKIPPED`/preference branch.
- Standardized FE04 and FE08 caller contracts on canonical notification type/template pairs.

## 2026-07-17 - FE04 Membership Result Boundary

- Added FE04 to the construction-bound source requester allowlist for `MEMBERSHIP_RESULT`.
- Added a pending documentation/implementation gate for FE04 ownership; HTTP notification permissions remain unchanged.

## 2026-07-15 - FE11 Account Setup Delivery Implemented And Validated

- Enforced FE11-only ownership for canonical `ACCOUNT_SETUP -> ACCOUNT_SETUP` delivery while preserving FE02 ownership of verification/reset OTP types.
- Added configured-provider delivery with only safe `AuthToken` source metadata and exact `FE11:ACCOUNT_SETUP:<tokenId>` idempotency.
- Kept raw setup tokens, links, and rendered sensitive content out of persistence, audits, logs, and HTTP responses.
- Verified non-blocking delivery failure for account creation and Admin resend.
- Task 7 automated evidence passed across FE02/FE10/FE11 and affected integration tests; Nhat confirmed the final packet and `FE10-S08` is complete.

## 2026-07-15 - FE11 Account Setup Delivery Revision

- Bumped `SPEC.md` to 0.4.0 and marked the combined OTP/account-setup revision ready for review.
- Added canonical sensitive pair `ACCOUNT_SETUP -> ACCOUNT_SETUP` with `setupLink` and `expiresInHours`.
- Added FE11 to the internal requester allowlist while preserving FE02-only ownership of verification/reset OTPs.
- Required FE11-only source ownership, `AuthToken` token-ID traceability, `FE11:ACCOUNT_SETUP:<tokenId>` idempotency, synchronous provider delivery, and no persisted setup credential/content.
- Added MF-FE10-005, FR-FE10-010, AC-FE10-010, EC-FE10-016, Q-FE10-008, G11, and FE10-S06..S08.

## 2026-07-15 - OTP Security Boundary Contract Approved

- Bumped `SPEC.md` from version `0.2.0` to `0.3.0` and recorded ADR-004 plus Nhat's approval of G8-G10.
- Replaced the deferred verification/reset link contract with the implemented FE02 six-digit OTP contract: `otp`, `expiresInMinutes`, and `AuthTokens.TokenId` source traceability.
- Restricted `ACCOUNT_VERIFICATION` and `PASSWORD_RESET` to the requester bound to `FE02`; staff HTTP and other source requesters return safe `403 SENSITIVE_NOTIFICATION_INTERNAL_ONLY`.
- Removed caller-controlled `sourceFeature` from the HTTP request contract.
- Defined FE10 as the single rendering/delivery/status owner for UC45/UC46 while FE02 remains the OTP generation/validation owner.
- Kept OTPs and rendered sensitive content out of persistence, logs, audits, and responses; delivery failure remains non-blocking and resend creates a new token event.
- Kept `CHANGE_PASSWORD_OTP`, legacy token acceptance, FE09 caller integration, frontend work, and retry UI outside this follow-up.

## 2026-06-09

- Created FE10 Notification Management feature specification structure.
- Established specification files: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md, and CHANGELOG.md.
- Defined notification boundary between FE10 and source features FE02, FE07, FE08, FE09, and FE11.
- Added stable business rules, functional requirements, acceptance criteria, edge cases, open questions, and traceability matrix.
- Identified key risks around duplicate notifications, failed delivery, token leakage, provider credentials, and unauthorized notification access.

## 2026-06-10

- Aligned FE10 use cases and feature tests with the latest assignment sheet: UC45-UC48 and FT46-FT49.
- Removed assignment-scope overlap with FE11 by replacing the old FE11-overlapping test mapping.
- Moved user notification inbox, mark-as-read, admin/librarian log screens, manual retry screens, and template editor UI out of the main FE10 scope.
- Updated PLAN.md and TASKS.md so later planning does not create tasks outside the current FE10 assignment scope.

## 2026-06-10 - Phase 1 Review Decisions Approved

- Approved open-question decisions from `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Updated `SPEC.md` decision status from draft/proposed/open to approved where applicable.
- Preserved Phase 1 scope controls and deferred future-work items explicitly.

## 2026-06-10 - Backend Slice Ready For Review

- Added FE10 plan and task checklist for Nhat's notification scope.
- Added protected notification request and process-pending APIs with email mock provider behavior.
- Added idempotency handling, template rendering, safe payload redaction, status updates, and attempt logging.
- Aligned the SQL script with FE10 fields, statuses, idempotency index, and required templates.
- Added backend tests for request creation, duplicate events, reset-token redaction, template validation, delivery attempts, and access control.

This entry describes the historical initial slice. Its active-only duplicate lookup, shallow safe-payload handling, full-record controller responses, and queued-sensitive assumptions are superseded by the approved 2026-07-13 hardening contract below.

## 2026-07-13 - FE10-H01 Hardening Contract Approved

- Recorded Nhat's approval of G1-G7 and updated `SPEC.md` to version `0.2.0` for B5 implementation.
- Split delivery by canonical server-enforced type/template pair: `ACCOUNT_VERIFICATION -> ACCOUNT_VERIFICATION`, `PASSWORD_RESET -> PASSWORD_RESET`, `RESERVATION_AVAILABLE -> RESERVATION_READY`, `DUE_DATE_REMINDER -> DUE_DATE_REMINDER`, `OVERDUE_NOTICE -> OVERDUE_NOTICE`, `FINE_NOTICE -> FINE_NOTICE`, and `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`.
- Required synchronous mock-provider delivery for sensitive account verification/password reset messages, with raw links and rendered sensitive title/body kept out of persistence, logs, audits, and HTTP responses.
- Kept non-sensitive notifications queued and required recursive object/array inspection with normalized secret-key rejection plus matching `safePayload` redaction.
- Approved minimal create/replay/process/retry DTOs, integer-only `sourceEntityId`, protected HTTP routes, and the construction-bound requester allowlist `FE02`, `FE07`, `FE08`, `FE09`, `SYSTEM`.
- Changed idempotency to one record per key across all statuses and defined manual retry only for failed non-sensitive queued records; sensitive retry returns safe `409 REISSUE_REQUIRED`.
- Kept FE02 OTP/link and `EMAIL_VERIFY` reconciliation plus FE02 migration with the FE02 owner; deferred FE09 caller integration because no caller currently exists.
- Updated stable BR/FR/AC semantics, API/NFR requirements, traceability, and review checklist. No implementation, test, database, or OpenAPI files changed in FE10-H01.

## 2026-07-13 - FE10-H02 To FE10-H08 Hardening Implemented

- Enforced canonical type/template pairs, recursive normalized sensitive-key rejection, matching safe-payload redaction, and integer-only source entity IDs.
- Delivered account verification and password reset notifications synchronously through the mock provider while keeping raw links and rendered sensitive content out of persistence, logs, audits, and HTTP responses.
- Reduced create, replay, process, and retry responses to the approved DTOs and kept notification HTTP routes protected.
- Added the construction-bound source requester, then migrated only FE07 borrowing and FE08 reservation notifications with non-blocking source-flow behavior.
- Enforced one notification record per idempotency key across all statuses and added protected same-record retry for failed non-sensitive notifications; sensitive retries return `409 REISSUE_REQUIRED`.
- Completed implementation through commits `105e51c` to `7c88223`; FE02 migration, FE09 caller integration, frontend work, real-provider work, and dependency changes remain out of scope.

## 2026-07-13 - FE10-H09 Validation And Review Fixes

- Targeted FE10/FE07/FE08/integration validation passed after the review fix: 4 suites and 136 tests.
- The full backend suite passed after the review fix: 15 suites and 212 tests.
- Enforced traceability passed with FE10 at 9/9 functional requirements (100%) and no implemented feature below the 70% threshold.
- The first independent scan found that HTTP source metadata could bypass strict service validation and provider-supplied `safeMessage` text could reach queued failure persistence.
- Commit `a04b64b` added test-first source allowlist/entity-type validation at the HTTP and service boundaries and replaced provider failure text with the fixed generic summary `Notification delivery failed.`.
- Stale B5 stop-state wording in `PLAN.md` and `CONTEXT.md` was aligned with the implemented B5 and in-review B6 state.
- Focused review of `a04b64b` approved both spec compliance and code quality with no findings.
- Final whole-branch review of `a613604..eb82b1d` reported no findings and approved the branch after independently rerunning the full backend suite (15 suites, 212 tests), traceability enforcement, and `git diff --check`.
- FE10-H09 and the B6 validation gate are complete. FE02 reconciliation and FE09 caller migration remain explicitly deferred.

## 2026-07-13 - B7 Integration And Review Closeout

- Nhat confirmed the human integration gate and selected local merge after the final FE10 branch review.
- Commit `9185a9a91f41e444e0c4e6bd8c0605a281272ee9` reached `main` and was pushed to `origin/main`.
- GitHub Actions CI run `29236572558` passed for the same commit, including traceability, backend tests, frontend lint/tests/build, and the backend health import check.
- Added `.sdd/reviews/fe10-b7-integration-review-closeout-2026-07-13.md` with system-fit, architecture, future-impact, and documentation evidence.
- FE02 reconciliation and FE09 caller integration remain explicitly deferred and are not claimed by this closeout.
