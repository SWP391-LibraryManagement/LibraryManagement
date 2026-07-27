# CHANGELOG.md - FE01 Public / Browse

## 2026-07-27 - Membership benefit card alignment

- Removed the permanent vertical stagger from even membership cards so both columns share the same row baselines.
- Preserved equal-width responsive columns, card hover feedback, and the mobile single-column layout.
- Added focused frontend regression coverage for the non-staggered grid contract.

## 2026-07-27 - Public ISBN boundary

- Removed ISBN from Guest/Member HomePage search copy, book cards, detail UI, public API DTO, and OpenAPI schema.
- Confirmed public `q` searches title/author only, while authenticated Librarian/Admin FE05 management reads and search retain ISBN.
- Updated FE01 requirements, acceptance criteria, tasks, and test strategy to connect the public boundary to FE05 and FE11 single-role authorization.

## 2026-07-27 - Homepage header simplification

- Removed the `Khám phá sách`, audience service, `Về thư viện`, and `Hỗ trợ` groups from the desktop header and mobile header menu at the request of the product owner.
- Preserved library branding, login/account controls, and the role-aware continuation actions elsewhere on HomePage.
- Removed the unused dropdown/accordion state, markup, icon, animation, and styling, and updated focused regression coverage.

## 2026-07-26 - Homepage specification synchronization

- Synchronized `CONTEXT.md`, `SPEC.md`, `PLAN.md`, `TASKS.md`, and `TEST_PLAN.md` with the current HomePage contract.
- Removed superseded statements that required Guest/Member to see `Còn sách` or `Không khả dụng`; retained server availability for internal Member routing and approved Librarian/Admin presentation.
- Clarified that Guest uses `/home`, while authenticated actors use `/homepage` to open the public library experience.
- Recorded the current navigation groups: `Khám phá sách`, audience-aware `Hội viên`/`Thư viện của tôi`/`Nghiệp vụ`, `Về thư viện`, and `Hỗ trợ`.
- Added the authoritative Homepage Role Connection Matrix and automated coverage proving every Guest/Member/Librarian/Admin destination is registered by the application router.
- Recorded the lighter footer palette and desktop single-line email presentation without changing contact destinations or policy behavior.
- Refreshed local evidence to public-browse frontend 14/14, combined focused frontend 39/39, and FE01 traceability 18/18.

## 2026-07-25 - Homepage footer contact presentation

- Replaced the legacy Library, Account, and Support link columns with the library phone, email, and physical address requested for the public footer.
- Added clickable phone/email actions and responsive contact cards without changing FE01 APIs, authentication routes, or business rules.
- Reworked phone, email, and address into borderless editorial contact groups with subtle separators, plus tablet and mobile fallbacks.
- Replaced the empty Privacy, Terms, and Cookie anchors with accessible information dialogs that close by button, backdrop, or Escape key.
- Added an on-view footer reveal, staggered contact entrance, ambient gold glow, icon/link hover feedback, and reduced-motion fallback.
- Centered the footer contact heading over the Email column and removed its decorative trailing line.
- Replaced the four placeholder-like top navigation buttons with animated desktop dropdowns and mobile accordions connected to existing Guest, Member, Librarian, and Admin destinations.
- Extended the home page with four connected topic filters, a three-step library journey, and a role-aware continuation panel for Guest, Member, Librarian, and Admin.
- Added responsive layouts, on-view reveals, hover/focus feedback, and reduced-motion handling for the new home sections.
- Unified the complete home-page visual hierarchy with distinct Hero, catalog, topic, journey, role, membership, and footer bands; added gradient dividers, richer hover/focus states, and motion-safe entrance effects.
- Changed HomePage availability presentation to staff-only: Guest/Member no longer see availability badges or revealing action labels, while Librarian/Admin retain the high-level status and Member workflow routing still uses latest availability internally.

## 2026-07-23 - Cross-role public-book actions

- Clarified that all roles may consume the public catalog while FE01 remains read-only.
- Connected Homepage actions to FE11's exactly-one-role account model so Librarian/Admin users are not routed into Member-only FE07/FE08 screens.
- Added focused frontend regression coverage for mixed Member/staff roles.

## 2026-07-20 - Vietnamese UI localization and typography

- Localized frontend-generated labels, states, accessibility names, and safe error feedback for this feature.
- Preserved API contracts, raw enum values, permissions, business rules, and user-owned catalog/profile data.
- Applied the shared `Be Vietnam Pro` body and `Noto Serif` heading typography contract with Unicode-capable fallbacks.
- Added the requestor-approved responsive HomePage shell follow-up: mobile navigation keeps the existing browse, account, and membership actions reachable without changing their routes or API behavior.

## 2026-07-19 - Phase 2 Exit Closeout

- feat-public-browse is accepted within the complete Phase 2 FE01-FE12 reconciliation recorded by PR #40/#41; validation and residual boundaries are consolidated in `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Deferred and future-scope limitations remain explicit and are not widened by this closeout.

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
