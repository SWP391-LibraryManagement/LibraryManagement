# CHANGELOG.md - FE01 Public / Browse

## 2026-07-19 - Public Browse Reconciliation Implemented

- Added canonical unauthenticated list/detail reads with exact filters, server pagination, stable ordering, inactive-book hiding, and public-safe DTOs.
- Derived `AVAILABLE`/`UNAVAILABLE` from current FE06 copy state without exposing copy counts or retaining the legacy categories route.
- Replaced HomePage fallback/fake actions with canonical public API state and safe null/unavailable/error rendering.
- Passed FE01 backend 9/9, frontend 4/4, traceability 13/13, diff hygiene, and disposable SQL availability evidence; human integration remains open.

## 2026-07-19 - Public Safety Reconciliation In Progress

- Replaced the copy-state-revealing `Đã mượn` label with the approved public-safe `Không khả dụng` label.
- Removed fake homepage login behavior and routed authenticated borrowing-history links to the real role-protected workflow.
- Public pagination, safe DTO projection, API adapter, and focused FE01 task evidence remain pending.

## 2026-07-18 - Authenticated Homepage Navigation

- Added a dedicated `Home` sidebar item for Member/Librarian/Admin users that opens the authenticated public library homepage at `/homepage`.
- Preserved `/home` as the role-aware `Tổng quan` dashboard so the two navigation destinations remain distinct.

## 2026-07-17 - Phase 1 Baseline Approved

- Nhật approved the normalized FE01 public visibility, search, pagination, safe-detail, and availability contract as the Phase 1 baseline; plan and task decomposition remain pending.

## 2026-07-17 - Implementation Planning Decomposition

- Added the approved FE01 implementation plan and FE01-T001 through FE01-T008 task sequence.
- Defined the FE01/FE05 shared public-read boundary, FE06 availability ownership, dedicated test evidence, and explicit frontend/API drift reconciliation.
- Updated `TEST_PLAN.md` to the canonical query, pagination, safe-field, and availability contract; implementation remains pending.

## 2026-07-17 - Final Browse Contract Audit

- Made recent public books part of the home-page contract while keeping featured content out of scope.
- Removed optional highlights behavior and made search filtering/database handling deterministic.

## 2026-07-17 - Public Filter Scope Hardening

- Defined the exact Phase 1 query fields and `q` matching semantics.
- Removed optional `/api/public/*` aliases from the canonical API contract.

## 2026-07-17 - Deterministic Browse Contract

- Bumped `SPEC.md` to 0.3.1 and kept the revision `READY FOR REVIEW`.
- Empty search now returns the default first page; pagination defaults/bounds and stable ordering are explicit.
- Distinguished validation errors for malformed IDs/query values from `404` for well-formed missing/hidden books.
- Missing optional catalog metadata now returns `null` with a UI fallback instead of excluding the book.
- Completed BR/FR/AC traceability with explicit planned test intent.

## 2026-07-15 - Read-Only Availability Ownership (v0.3.0)

- Removed the FE01 dependency on FE05 manual copy-status updates.
- Clarified that FE06/FE07/FE08 own copy transitions and FE01/FE05 only read the latest committed availability summary.
- Standardized the simple public display as `Còn sách` / `Không khả dụng`, removed stale conditional wording, and kept exact copy counts private.

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

## 2026-06-30

- Bumped `SPEC.md` version to 0.2.0 and updated Last Updated to 2026-06-30.
- Added the FE05/FE06 -> FE01 availability sync rule so `/home`, public search, and book detail display the latest `BookCopies.Status` summary.
- Clarified that public browse shows only simple availability (`Còn sách` / `Đã mượn`) and never exposes copy barcodes, borrower data, locations, fines, or staff-only inventory fields.
- Added BR-FE01-011..012, FR-FE01-009..010, AC-FE01-009, EC-FE01-011, and Q-FE01-007.
