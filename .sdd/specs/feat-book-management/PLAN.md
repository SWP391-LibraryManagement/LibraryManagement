# PLAN.md - FE05 Book Management

Status: NOT STARTED

This file will be written after `SPEC.md` is reviewed and approved.

## Prototype Drift Note

As of 2026-06-22, the repository contains prototype FE05 code in `backend/src/routes/bookRoutes.js`, `backend/src/controllers/bookController.js`, `backend/src/services/bookService.js`, `backend/src/repositories/bookRepository.js`, and `frontend/src/page/BookManagement.jsx`.

That code is useful for demo and discovery, but it is not yet considered spec-driven FE05 implementation because this `PLAN.md` has not been decomposed and reviewed. Before FE05 can move to `READY FOR REVIEW`, the team must reconcile the prototype against `SPEC.md`, add traceability tags/tests, and replace this placeholder with an approved execution plan.

Before planning, the team must:

- Resolve open questions in `SPEC.md`.
- Confirm database design for Books, Authors, Categories, Publishers, and related entities.
- Confirm ISBN validation and book status rules.
- Confirm API contract in `SPEC.md` or a dedicated shared API contract file if the team reintroduces one.
- Review dependencies with FE06 (Inventory Management), FE07 (Borrowing Management), FE08 (Reservation Management), and FE11 (User & Role Management).
- Decide whether soft delete or status-based deactivation will be used for books.
- Confirm search, filtering, sorting, and pagination requirements.
