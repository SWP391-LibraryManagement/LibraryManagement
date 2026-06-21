# CHANGELOG.md - FE12 Reporting & Statistics

## 2026-06-10

- Created FE12 Reporting & Statistics feature specification structure.
- Established specification files: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md, and CHANGELOG.md.
- Updated current owner and assignment scope after team redistribution: UC58-UC60 and FT59-FT61 owned by Nhat.
- Defined FE12 as a read-only reporting feature for borrowing reports, inventory reports, and user statistics.
- Clarified API contract policy so REST endpoints may stay in SPEC.md unless the team reintroduces a shared API contract file.

## 2026-06-10 - Phase 1 Review Decisions Approved

- Approved open-question decisions from `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Updated `SPEC.md` decision status from draft/proposed/open to approved where applicable.
- Preserved Phase 1 scope controls and deferred future-work items explicitly.

## 2026-06-10 - Backend Slice Ready For Review

- Added the FE12 plan and task checklist for Nhat's reporting scope.
- Added read-only borrowing, inventory, and user statistics report endpoints.
- Added filter validation, zero-result handling, role protection, and audit logs for successful report access.
- Added backend tests for report metrics, zero-result behavior, personal-data suppression, invalid ranges, and access control.

## 2026-06-20 - Frontend UI Implemented and Accessibility Validated

- Implemented borrowing report, inventory report, and user statistics screens with date filters, category filters, and chart components.
- Wired all frontend screens to backend APIs using axios and React hooks.
- Added table captions, column header scopes, accessible labels for date inputs, selects, and pagination buttons.
- Added loading, empty, and error states on all reviewed screens.
- Validated: `npm.cmd --prefix frontend run lint`, `npm.cmd --prefix frontend run build`, `npm.cmd --prefix backend test`.
- Merged via PR #7 into `feat/fe07-fe08-fe10-fe12-ui-polish`.
