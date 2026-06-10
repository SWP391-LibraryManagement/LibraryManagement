# CHANGELOG.md - FE09 Fine Management

## 2026-06-10

- Created FE09 Fine Management feature specification structure.
- Established specification files: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md, and CHANGELOG.md.
- Updated current owner and assignment scope after team redistribution: UC41-UC44 and FT42-FT45 owned by Dung.
- Re-aligned FE09 owner with `Library Management (5).xlsx`.
- Applied shared Phase 1 baseline decision for overdue fine: 5,000 VND per overdue day per copy, starting the day after due date.
- Kept online payment gateway out of scope and limited FE09 to fine calculation, collection recording, and paid status.
- Clarified API contract policy so REST endpoints may stay in SPEC.md unless the team reintroduces a shared API contract file.
- Resolved FE09/FE07 borrowing-block dependency: any `UNPAID` fine with amount greater than 0 blocks new borrowing and renewal in FE07.

## 2026-06-10 - Phase 1 Review Decisions Approved

- Approved open-question decisions from `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Updated `SPEC.md` decision status from draft/proposed/open to approved where applicable.
- Preserved Phase 1 scope controls and deferred future-work items explicitly.
