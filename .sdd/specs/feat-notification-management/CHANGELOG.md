# CHANGELOG.md - FE10 Notification Management

## 2026-07-19 - OTP Integration B7 Closeout

- FE10-S05 is complete through B7: PR #42 merged as `34d9180`, PR CI `29688102867` passed, and exact post-merge `main` CI `29688222757` passed.
- FE02/FE10 ownership, source rejection, secret-boundary, failure, idempotency, and reset-event evidence is complete. Real provider delivery, inbox UI, and FE09 caller integration remain deferred.

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
