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
