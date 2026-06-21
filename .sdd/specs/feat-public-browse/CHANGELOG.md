# CHANGELOG.md - FE01 Public / Browse

## 2026-06-10

- Created FE01 Public / Browse feature specification structure.
- Established specification files: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md, and CHANGELOG.md.
- Aligned owner and assignment scope with the latest assignment sheet: UC01-UC04 and FT01-FT04 owned by Dung.
- Defined FE01 as a read-only public browsing feature and separated it from FE05 catalog management and FE06 copy management.
- Clarified API contract policy so REST endpoints may stay in SPEC.md unless the team reintroduces a shared API contract file.

## 2026-06-10 - Phase 1 Review Decisions Approved

- Approved open-question decisions from `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Updated `SPEC.md` decision status from draft/proposed/open to approved where applicable.
- Preserved Phase 1 scope controls and deferred future-work items explicitly.

## 2026-06-21

- Aligned FE01 API contract with the current prototype routes: public browse uses `/api/books` and `/api/books/{bookId}`.
- Kept `/api/public/*` routes as optional future aliases rather than the required implementation path.
