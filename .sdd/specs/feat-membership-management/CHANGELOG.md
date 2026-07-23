# CHANGELOG.md - FE04 Membership Management

## 2026-07-23 - Admin Console membership review implemented locally

- Embedded FE04 review in the FE11 Admin Console while retaining FE04 ownership of list filters, pagination, approve/reject mutations, authorization, audit, notification, and the existing `/membership` workspace.
- Added pending-only decisions, required 1..500-character rejection reason, authoritative reload after decisions/conflicts, and non-blocking feedback for committed decisions whose FE10 delivery failed.
- Added responsive table/card source contracts and recorded the full frontend 215/215, lint, and production build passes; authenticated responsive browser, Azure Staging, and human acceptance remain open.

## 2026-07-22 - Admin Console membership review integration approved

- Approved an embedded Admin-native FE04 review section after User Management while retaining the existing `/membership` Member/Librarian workspace.
- Preserved the canonical FE04 API, pending-only state transitions, server authorization, atomic audit behavior, and non-blocking FE10 result delivery.
- Added `FR-FE04-014`, `AC-FE04-013`, and responsive/notification presentation requirements; implementation and validation have not started.

## 2026-07-22 - Require complete profile before application

- Required non-empty full name, phone, date of birth, and address before creating a membership application; avatar remains optional.
- Added server-side enforcement plus member-facing missing-field guidance and a link to `/profile`.

## 2026-07-21 - Connect approval to borrowing allowance

- Kept borrowing available to active `MEMBER` accounts without FE04 approval at a 3-copy daily limit.
- Defined canonical `APPROVED` membership as the entitlement for a 5-copy daily limit consumed by FE07.
- Updated the member-facing status and application benefits to show the current 3-or-5-copy daily allowance explicitly.

## 2026-07-21 - Decouple membership applications from circulation authorization

- Made FE04 application status independent from FE07 borrowing and FE08 reservation eligibility.
- Active accounts with the `MEMBER` role can use circulation workflows without FE04 approval.

## 2026-07-20 - Vietnamese UI localization and typography

- Localized frontend-generated labels, states, accessibility names, and safe error feedback for this feature.
- Preserved API contracts, raw enum values, permissions, business rules, and user-owned catalog/profile data.
- Applied the shared `Be Vietnam Pro` body and `Noto Serif` heading typography contract with Unicode-capable fallbacks.

## 2026-07-19 - Phase 2 Exit Closeout

- feat-membership-management is accepted within the complete Phase 2 FE01-FE12 reconciliation recorded by PR #40/#41; validation and residual boundaries are consolidated in `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Deferred and future-scope limitations remain explicit and are not widened by this closeout.

## 2026-07-19 - Canonical Membership Reconciliation

- Added the pending-only filtered unique index, model metadata, ADR decision, and idempotent FE04
  migration while preserving approved/rejected application history.
- Made apply/review/member/audit mutations atomic, serialized in-memory races, locked SQL reviews,
  and returned the canonical applicant-safe status envelope.
- Added exact post-commit `MEMBERSHIP_RESULT` requester behavior with safe non-blocking delivery
  status and no provider-error exposure.
- Reconciled the membership UI with canonical server fields, truthful error states, server-side
  search, refresh-after-mutation behavior, and 500-character rejection limits.
- Recorded fresh non-SQL evidence: backend 619/619, frontend 122/122, coverage thresholds, lint,
  build, import, FE04 trace 12/12, and diff hygiene pass.
- Applied the FE04 migration twice on a disposable SQL Server and passed all 10/10 FE04 SQL cases;
  cleanup is recorded in `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Browser/cross-feature human acceptance remains pending.

## 2026-07-18 - Member And Librarian UI Integration

- Exposed the existing FE04 review workspace in Librarian navigation while preserving the Admin Console review integration.
- Removed fabricated membership applications on API failure and displayed the canonical FE04 error state instead.
- Aligned the member application UI with the approved empty-body contract and refreshed the responsive member layout.

## 2026-07-18 - Admin Review List Alignment

- Added database-backed search by application ID, applicant name, username, or email.
- Added canonical `total` and `totalPages` metadata to the protected review-list response.
- Aligned the admin refresh, loading, filter, pagination, and Vietnamese review copy with the FE04 workflow.

## 2026-07-17 - Phase 1 Baseline Approved

- Nhật approved the normalized FE04 membership lifecycle, canonical member projection, approval timestamps, and FE10 boundary as the Phase 1 baseline; implementation remains pending.

## 2026-07-17 - Approval Timestamp Traceability

- Required matching server timestamps for `MembershipApplications.ApprovedAt` and `Members.ApprovedAt` on approval.
- Required `Members.ApprovedAt = null` on rejection and expanded the related trace/test intent.

## 2026-07-17 - Canonical Approval Timestamp And Notification Contract

- Distinguished `MembershipApplications.ApprovedAt` from canonical `Members.ApprovedAt`.
- Standardized FE04 notification requests as `GENERAL_SYSTEM -> MEMBERSHIP_RESULT` and made delivery requests mandatory but non-blocking.

## 2026-07-17 - FE04/FE10 Requester Boundary Revision

- Bumped `SPEC.md` to v0.2.1 and aligned `TASKS.md` to `READY FOR REVIEW`.
- Confirmed that FE04 owns `MEMBERSHIP_RESULT` and must use a construction-bound FE04 requester after the membership decision commits.
- Updated FE10's internal source allowlist and traceability contract to include FE04 without changing HTTP permissions.

## 2026-07-16 - Planning Human Review Approval

- Nhat approved the FE04 implementation plan and ordered task decomposition.
- Marked `PLAN.md` and `TASKS.md` as `APPROVED`; implementation tasks remain unchecked and have not started.

## 2026-07-16 - Implementation Planning Decomposition

- Replaced placeholder `PLAN.md` and `TASKS.md` with a `READY FOR REVIEW` prototype-reconciliation plan for approved SPEC v0.2.0.
- Added ordered RED/GREEN tasks for canonical `Members` eligibility, immutable application history, SQL concurrency, atomic audit writes, FE10 `MEMBERSHIP_RESULT`, and server-backed frontend states.
- Mapped all 41 BR/FR/AC requirements to concrete implementation tasks, files, dependencies, commands, and human review gates.

## 2026-07-16 - Human Review Approval

- Nhat confirmed human review of revision v0.2.0.
- Marked `SPEC.md` and `CONTEXT.md` as `APPROVED` and completed the revision review gate.

## 2026-07-15 - Canonical Membership Contract (v0.2.0)

- Made `Members.Status` the canonical eligibility source for FE07/FE08 while preserving `MembershipApplications` as immutable history.
- Defined atomic application/member/audit updates, deterministic latest-application selection, and concurrency rules for one pending application.
- Made rejection reason and audit metadata mandatory, removed `EXPIRED` from Phase 1, and specified rejected-user re-application.
- Added non-blocking FE10 `MEMBERSHIP_RESULT` delivery after review decisions commit.
- Defined the non-persisted `membershipStatusView = NONE` response for users who have not applied and aligned optional pre-application `Members` rows.
- Expanded BR/FR/AC traceability with concrete planned test intents and removed the remaining `TBD` mapping.

## 2026-06-25

- Completed Traceability Matrix to cover all BR/FR/AC IDs.

## 2026-06-10

- Created FE04 Membership Management feature specification structure.
- Established specification files: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md, and CHANGELOG.md.
- Aligned owner and assignment scope with the latest assignment sheet: UC13-UC16 and FT14-FT17 owned by Dat.
- Defined FE04 boundary against FE02 Authentication, FE03 User Profile, FE07 Borrowing, FE08 Reservation, and FE11 User & Role Management.
- Clarified API contract policy so REST endpoints may stay in SPEC.md unless the team reintroduces a shared API contract file.

## 2026-06-10 - Phase 1 Review Decisions Approved

- Approved open-question decisions from `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Updated `SPEC.md` decision status from draft/proposed/open to approved where applicable.
- Preserved Phase 1 scope controls and deferred future-work items explicitly.
## 2026-07-22

- Suppressed member-only navigation for staff actors and made rejection feedback neutral.
