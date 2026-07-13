# CHANGELOG.md - FE10 Notification Management

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
