# CHANGELOG.md - FE04 Membership Management

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
