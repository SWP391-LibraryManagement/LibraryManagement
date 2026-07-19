# TASKS.md - FE01 Public / Browse

Status: APPROVED - FE01 IMPLEMENTED AND AUTOMATED-VALIDATED; HUMAN INTEGRATION PENDING

Owner: Dung

Updated: 2026-07-17

Workflow State: FE01-T001 through FE01-T007 are agent-side complete; FE01-T008 final review remains open

---

## Task Rules

- Execute tasks in numeric order and begin each behavior task with its named RED tests.
- FE01 is read-only. No task may write `Books`, `BookCopies`, borrow, reservation, fine, membership, user, or audit business records.
- Keep FE01 public-safe projections separate from FE05 staff/catalog projections in shared backend files.
- Use only the canonical endpoints `/api/books` and `/api/books/{bookId}`; do not add `/api/public/*` aliases or a category endpoint.
- Add `@spec` tags to changed implementation files for the mapped BR/FR IDs.
- Do not mark a task complete because prototype code already exists; record fresh focused evidence.

## Ordered Tasks

- [x] **FE01-T001 - Add RED public browse contract tests.**
  - Maps to: BR-FE01-001 through BR-FE01-014; FR-FE01-001 through FR-FE01-013; AC-FE01-001 through AC-FE01-013; NFR-FE01-SEC-001 through NFR-FE01-SEC-004; NFR-FE01-PERF-001/002.
  - Files: create `backend/tests/publicBrowseRoutes.test.js`, create `backend/tests/publicBrowseRepository.test.js`, create `backend/tests/sql/publicBrowseAvailability.sqltest.js`, create `frontend/test/publicBrowseFrontend.test.js`.
  - Dependency: FE05 owner confirms the shared public response envelope and FE06 owner confirms the availability fixture contract.
  - RED: assert unauthenticated `GET /api/books` and `GET /api/books/{bookId}`, exact query-field allowlist, q length 1..200, positive ID filters, page/limit bounds, stable order, empty search defaults, inactive/not-found behavior, public-safe fields, null optional metadata, latest availability, and no FE01 mutation.
  - Verify RED: focused commands fail only on the missing v0.3.1 public behavior or missing dedicated test fixtures, not on malformed test setup.
  - DoD: every BR/FR/AC is represented by an assertion or an explicit integration test mapping, including SQL latest-commit availability and frontend unavailable/null states.

- [x] **FE01-T002 - Reconcile canonical public route and validation boundary.**
  - Maps to: BR-FE01-001 through BR-FE01-007, BR-FE01-013; FR-FE01-001 through FR-FE01-007, FR-FE01-011/012; AC-FE01-001 through AC-FE01-007, AC-FE01-010/011/012; NFR-FE01-SEC-001/003.
  - Files: `backend/src/routes/bookRoutes.js`, `backend/src/controllers/bookController.js`, `backend/src/services/bookService.js`, `backend/src/docs/openapi.yaml`, `backend/tests/publicBrowseRoutes.test.js`.
  - Dependency: FE01-T001 and FE05 shared-route boundary approval.
  - GREEN: expose only the canonical public GET contracts; accept exactly `q`, `categoryId`, `authorId`, `publisherId`, `page`, and `limit`; reject unknown query fields, invalid positive IDs, q values over 200 characters, page below 1, and limit outside 1..100 before repository execution.
  - Verify: focused route tests assert `200`, `400`, `404`, and safe generic `500` responses, no authentication requirement, no stack traces, and no public access to mutation routes.
  - DoD: `/api/public/*` aliases and FE01-owned `/api/books/categories` behavior are absent from the FE01 contract; shared FE05 management routes remain intact.

- [x] **FE01-T003 - Reconcile database-side public filtering, pagination, and availability.**
  - Maps to: BR-FE01-003, BR-FE01-005, BR-FE01-006, BR-FE01-008, BR-FE01-011 through BR-FE01-013; FR-FE01-002/003/008/009/011; AC-FE01-002/003/009/010/011; NFR-FE01-PERF-001/002.
  - Files: `backend/src/repositories/bookRepository.js`, `backend/src/services/bookService.js`, `backend/tests/publicBrowseRepository.test.js`, `backend/tests/sql/publicBrowseAvailability.sqltest.js`.
  - Dependency: FE01-T001 and FE01-T002.
  - GREEN: filter only active books; match q against title or author name case-insensitively; apply positive ID filters in SQL; use default `page=1`, `limit=20`; order by `Title ASC, BookId ASC`; calculate availability from current `BookCopies.Status = AVAILABLE` without exposing copy counts or writing copy rows.
  - Verify: repository tests inspect parameterized predicates, `OFFSET/FETCH`, stable ordering, empty search, missing optional joins, zero/one available-copy cases, and no full-catalog application filtering.
  - DoD: the query reflects the latest committed database state on every request and never uses a hardcoded or stale UI-only availability value.

- [x] **FE01-T004 - Implement public-safe list/detail projection and error behavior.**
  - Maps to: BR-FE01-004, BR-FE01-007, BR-FE01-010, BR-FE01-014; FR-FE01-004 through FR-FE01-006, FR-FE01-010/013; AC-FE01-004 through AC-FE01-008, AC-FE01-012/013; NFR-FE01-SEC-002/003/004.
  - Files: `backend/src/controllers/bookController.js`, `backend/src/services/bookService.js`, `backend/src/repositories/bookRepository.js`, `backend/src/docs/openapi.yaml`, `backend/tests/publicBrowseRoutes.test.js`.
  - Dependency: FE01-T002 and FE01-T003.
  - GREEN: return only title, ISBN, category/author/publisher names, publish year, description, cover URL, and `AVAILABLE`/`UNAVAILABLE`; return `null` for missing optional metadata; return safe `404` for missing/inactive books; sanitize or escape public display content and hide status, barcodes, locations, borrower data, reservation data, fines, and audit data.
  - Verify: route tests assert exact public field allowlists, null preservation, hidden-book behavior, malformed-versus-missing ID behavior, and generic database failure responses.
  - DoD: no public response contains internal copy counts, staff fields, protected records, SQL details, or stack traces.

- [x] **FE01-T005 - Add the public browse API client and server-backed HomePage data flow.**
  - Maps to: FR-FE01-001 through FR-FE01-005, FR-FE01-008 through FR-FE01-013; AC-FE01-001 through AC-FE01-005, AC-FE01-009/010/013; NFR-FE01-UX-001/002.
  - Files: `frontend/src/api/libraryFeatureApi.js`, `frontend/src/page/HomePage.jsx`, `frontend/test/publicBrowseFrontend.test.js`.
  - Dependency: FE01-T004 and the approved public response envelope.
  - RED: assert the page calls only `/books` and `/books/{bookId}`, sends approved query names, does not request `/books/categories`, renders server availability, and does not report fake local borrow success.
  - GREEN: add a small public browse API wrapper, load paginated public data, pass q/ID/page/limit parameters, load public detail through the canonical endpoint, and preserve guest access without an access token.
  - Verify: frontend tests inspect request URLs/parameters, list/detail loading, refresh after query changes, and safe handling of API errors.
  - DoD: HomePage no longer treats local mock arrays, local fake borrow completion, or legacy category fetches as FE01 data sources.

- [x] **FE01-T006 - Complete public browse loading, empty, unavailable, and null-metadata states.**
  - Maps to: BR-FE01-002, BR-FE01-004, BR-FE01-008, BR-FE01-014; FR-FE01-001, FR-FE01-003 through FR-FE01-005, FR-FE01-010/013; AC-FE01-001, AC-FE01-003 through AC-FE01-005, AC-FE01-009/013; NFR-FE01-UX-001/002.
  - Files: `frontend/src/page/HomePage.jsx`, `frontend/test/publicBrowseFrontend.test.js`.
  - Dependency: FE01-T005.
  - RED: assert loading, no-results, unavailable, missing-cover, missing-author/category/publisher, and not-found detail states before implementation.
  - GREEN: show `Còn sách` only for `AVAILABLE`, show `Không khả dụng` otherwise, preserve books with null optional fields, render the safe no-cover fallback, show understandable empty/error states, and route member-only actions to their owning authentication/membership/borrowing flows without implementing those flows in FE01.
  - Verify: focused frontend tests cover a public guest, empty search, no matches, unavailable book, null metadata, missing detail, and safe generic error.
  - DoD: no public UI exposes copy counts, borrower data, internal locations, or a false success message for borrowing/reservation actions.

- [x] **FE01-T007 - Close API documentation, test plan, and traceability.**
  - Maps to: all FE01 BR/FR/AC/NFR IDs and the Definition of Done.
  - Files: `backend/src/docs/openapi.yaml`, `.sdd/specs/feat-public-browse/TEST_PLAN.md`, `.sdd/specs/feat-public-browse/CHANGELOG.md`, `.sdd/specs/feat-public-browse/SPEC.md` only if the shared response envelope is formally clarified before implementation.
  - Dependency: FE01-T001 through FE01-T006.
  - GREEN: document the canonical public endpoints, query allowlist, pagination defaults/bounds, safe fields, availability values, error statuses, no-auth rule, and focused test commands; update every FE01 traceability row from `Not Started` only when its evidence exists.
  - Verify: `rg` confirms every FE01 BR/FR/AC ID maps to a task and test; no `/api/public/*`, category-endpoint, exact-copy-count, or stale `Đã mượn` contract remains in active FE01 docs.
  - DoD: documentation never claims implementation or test completion without recorded evidence.

- [~] **FE01-T008 - Pass focused validation and human review.**
  - Maps to: all FE01 requirements and project Definition of Done.
  - Files: all FE01 implementation/test files changed by T001-T007 and `.sdd/specs/feat-public-browse/CHANGELOG.md`.
  - Dependency: FE01-T007.
  - Verify: run `npm.cmd --prefix backend test -- --runTestsByPath tests/publicBrowseRoutes.test.js tests/publicBrowseRepository.test.js`, run the SQL test when SQL configuration is available, run `node --test frontend/test/publicBrowseFrontend.test.js`, run `npm.cmd run trace:enforce`, and run `git diff --check`.
  - DoD: focused evidence passes, public read-only ownership is reviewed by FE05/FE06 owners, Nhat reviews the final diff against SPEC v0.3.1, and no full merge claim is made until the repository merge gate is satisfied.

## Requirement-To-Task Coverage

| Requirement IDs | Planned tasks |
| --- | --- |
| BR-FE01-001 through BR-FE01-007 | FE01-T001, FE01-T002, FE01-T004 |
| BR-FE01-008 through BR-FE01-014 | FE01-T001, FE01-T003, FE01-T004, FE01-T006 |
| FR-FE01-001 through FR-FE01-007 | FE01-T001, FE01-T002, FE01-T004, FE01-T005 |
| FR-FE01-008 through FR-FE01-013 | FE01-T001, FE01-T003, FE01-T004, FE01-T005, FE01-T006 |
| AC-FE01-001 through AC-FE01-008 | FE01-T001, FE01-T002, FE01-T004, FE01-T005, FE01-T006 |
| AC-FE01-009 through AC-FE01-013 | FE01-T001, FE01-T003, FE01-T004, FE01-T006 |
| NFR-FE01-SEC-001 through NFR-FE01-004 | FE01-T002, FE01-T004 |
| NFR-FE01-PERF-001/002 | FE01-T001, FE01-T003 |
| NFR-FE01-LOG-001/002 | FE01-T002, FE01-T004, FE01-T007 |
| NFR-FE01-UX-001/002 | FE01-T005, FE01-T006 |

### Explicit Cross-Boundary Mappings

| Requirement ID | Planned tasks |
| --- | --- |
| BR-FE01-009 | FE01-T001, FE01-T002, FE01-T004, FE01-T006 |
| BR-FE01-012 | FE01-T001, FE01-T003, FE01-T004 |
| FR-FE01-009 | FE01-T001, FE01-T003, FE01-T005, FE01-T006 |
| FR-FE01-012 | FE01-T001, FE01-T002, FE01-T004 |
| AC-FE01-006 | FE01-T001, FE01-T002, FE01-T004, FE01-T006 |
| AC-FE01-011 | FE01-T001, FE01-T002, FE01-T003, FE01-T006 |

## Completion Gate

- [~] FE01-T001 through FE01-T007 are complete; FE01-T008 awaits human integration review.
- [x] Focused backend, SQL, frontend, traceability, and diff checks pass.
- [ ] FE05 owner confirms shared public catalog response compatibility.
- [ ] FE06 owner confirms availability aggregation and no copy mutation.
- [ ] Nhat confirms final public-safe DTO, guest UX states, and read-only boundary.
