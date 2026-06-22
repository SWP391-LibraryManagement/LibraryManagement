# PLAN.md - FE09 Fine Management

Status: NOT STARTED

This file will be written after `SPEC.md` is reviewed and approved.

## Prototype Drift Note

As of 2026-06-22, the repository contains prototype FE09 code in `backend/src/routes/fineRoutes.js`, `backend/src/controllers/fineController.js`, `backend/src/services/fineService.js`, and `frontend/src/page/FineManagement.jsx`.

That code is useful for demo continuity, but it is not yet considered spec-driven FE09 implementation because this `PLAN.md` has not been decomposed and reviewed. Before FE09 can move to `READY FOR REVIEW`, the team must reconcile the prototype against `SPEC.md`, ensure overdue fine calculation and persistence are server-side, add traceability tags/tests, and replace this placeholder with an approved execution plan.

Before planning, the team must:

- Resolve open questions in `SPEC.md`.
- Confirm fine statuses and overdue calculation policy.
- Confirm borrowing-block rule with FE07.
- Confirm collection/payment schema.
- Confirm whether lost/damaged fines are in Phase 1.
- Confirm API contract in `SPEC.md` or a shared API contract document.
