# PLAN.md - FE01 Public / Browse

Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED

Owner: Dung

Updated: 2026-07-17

Workflow State: COMPLETE for the approved Phase 2 scope; H3, merge, and exact post-merge `main` CI are recorded in `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`. Pending/open gate statements retained below are historical execution snapshots superseded by that evidence.

> **For implementation agents:** Execute `TASKS.md` in order. FE01 is read-only. Do not create or update books, copies, borrowing records, reservations, fines, users, or audit business records.

---

## 1. Goal

Reconcile the public home, search, and detail experience with the approved FE01 v0.3.1 contract: exact public filters, deterministic pagination/order, inactive-book hiding, safe DTOs, current FE06-owned availability, and safe guest-facing errors.

## 2. Source Documents

- `.sdd/specs/feat-public-browse/SPEC.md` v0.3.1.
- `.sdd/specs/feat-public-browse/CONTEXT.md` v0.1.0.
- `.sdd/specs/feat-public-browse/TASKS.md`.
- `.sdd/specs/feat-public-browse/TEST_PLAN.md`.
- `.sdd/specs/feat-book-management/SPEC.md` for shared public catalog ownership.
- `.sdd/specs/feat-inventory-book-copy/SPEC.md` for `BookCopies.Status` ownership.
- `.sdd/constraints/global.md`, `.sdd/constraints/business.md`, and `.sdd/constraints/safety.md`.

## 3. Existing Drift To Reconcile

| Approved contract | Current drift to reconcile |
| --- | --- |
| Public query fields are exactly `q`, `categoryId`, `authorId`, `publisherId`, `page`, and `limit`. | `getHomeBooks` currently accepts a text `category` filter and searches ISBN/category/publisher fields that are outside the FE01 query contract. |
| `q` matches title or author name case-insensitively and is limited to 1..200 characters when supplied. | The current search validation allows an empty value but caps it at 100 characters and the SQL predicate includes extra fields. |
| Public results use `page=1`, `limit=20`, bounds `page>=1`, `limit=1..100`, and `Title ASC, BookId ASC`. | The current home query returns an unpaginated list ordered by `BookId DESC`. |
| Public detail hides inactive books and returns only public-safe fields. | `getBookById` currently returns inactive rows and maps internal status/copy-count fields into the shared book DTO. |
| Availability is `AVAILABLE` when at least one current `BookCopies.Status = AVAILABLE`, otherwise `UNAVAILABLE`. | The current response exposes exact copy counts and the UI displays a legacy `ĐÃ MƯỢN` label instead of `Không khả dụng`. |
| Optional metadata remains in the response as `null`. | Current mapping replaces missing values with display strings such as `Không rõ tác giả`, `Chưa phân loại`, and a default image before the public contract is applied. |
| FE01 is read-only and uses `/api/books` plus `/api/books/{bookId}`. | `HomePage.jsx` owns direct fetches, category-endpoint usage, local mock actions, and a fake successful borrow flow that must not be presented as FE01 behavior. |
| Public behavior has dedicated evidence. | No dedicated FE01 backend/frontend contract test files exist yet. |

## 4. Ownership And Shared-File Boundary

- FE01 owns public-safe reads, public query validation, public DTO projection, and guest-facing browse states.
- FE05 owns catalog metadata mutations and staff management views. FE01 must not change FE05 mutation routes or management-only fields.
- FE06 owns physical copy state and availability transitions. FE01 may read the latest committed aggregate but must not write `BookCopies`.
- FE07 and FE08 own borrowing/reservation transitions. FE01 only reflects the committed availability result on a later read.
- Shared backend files such as `backend/src/routes/bookRoutes.js`, `backend/src/controllers/bookController.js`, `backend/src/services/bookService.js`, and `backend/src/repositories/bookRepository.js` require coordination with the FE05 owner. Public changes must be isolated from management mutation paths.
- The canonical FE01 API has no `/api/public/*` alias and no FE01-owned `/api/books/categories` endpoint. A category selector must not be added unless a separate approved contract supplies its data source; `categoryId` remains an accepted API filter.

## 5. Canonical Public Interfaces

| Method | Endpoint | Required behavior |
| --- | --- | --- |
| `GET` | `/api/books` | Guest/Member access; accept only `q`, `categoryId`, `authorId`, `publisherId`, `page`, and `limit`; return paginated public-safe summaries with deterministic order and current availability. |
| `GET` | `/api/books/{bookId}` | Guest/Member access; validate a positive integer ID; return public-safe active detail or `404` for missing/hidden books. |

The response envelope must follow the approved shared API convention used by the FE05 public read contract. It must contain pagination metadata for list responses and must never include barcodes, locations, borrower/member data, reservation rows, fine data, audit data, or staff-only fields. If the shared envelope changes, FE01 and FE05 specs must be reviewed together before implementation continues.

## 6. Scope

### In Scope

- Public list/search query validation and database-side filtering.
- Stable pagination and `Title ASC, BookId ASC` ordering.
- Public-safe list/detail projections with `null` optional metadata.
- Inactive/hidden book filtering and safe `400`/`404`/`500` behavior.
- Current availability summary derived from active book records and FE06-owned copy status.
- Guest home/search/detail loading, empty states, no-result states, unavailable label, and safe fallback rendering.
- Dedicated backend/frontend/SQL evidence and complete traceability.

### Out Of Scope

- Book create/update/deactivate/reactivate workflows.
- Category metadata endpoint or `/api/public/*` aliases.
- Physical copies, barcodes, locations, or copy-status transitions.
- Borrowing, reservation, membership, authentication, fine, review, reading-list, or payment behavior.
- Exact copy counts, borrower identity, queue position, staff inventory details, or protected records in public responses.

## 7. File And Interface Map

| Area | Files | Responsibility |
| --- | --- | --- |
| Backend public boundary | `backend/src/routes/bookRoutes.js`, `backend/src/controllers/bookController.js` | Keep canonical public GET routes and route-level safe error behavior; do not widen public access to mutation routes. |
| Backend business rules | `backend/src/services/bookService.js` | Validate FE01 query/ID rules, select public projection, and preserve read-only ownership. |
| Backend persistence | `backend/src/repositories/bookRepository.js` | Apply database-side filters, active visibility, availability aggregation, stable order, and pagination with parameterized inputs. |
| API documentation | `backend/src/docs/openapi.yaml` | Document canonical public list/detail parameters, fields, pagination, safe errors, and no authentication requirement. |
| Backend tests | Create `backend/tests/publicBrowseRoutes.test.js`, `backend/tests/publicBrowseRepository.test.js`, and `backend/tests/sql/publicBrowseAvailability.sqltest.js` | Cover route contract, public redaction, query validation, SQL filtering/order, and latest committed availability. |
| Frontend API | `frontend/src/api/libraryFeatureApi.js` | Add a small public browse API wrapper for list/detail requests without requiring an access token. |
| Frontend page | `frontend/src/page/HomePage.jsx` | Replace direct legacy browse fetches and hardcoded availability/fake browse actions with canonical server data and safe UI states. |
| Frontend tests | Create `frontend/test/publicBrowseFrontend.test.js` | Lock endpoint/query usage, public-safe rendering, unavailable label, null fallbacks, and no fake FE01 mutation. |
| Test strategy/history | `.sdd/specs/feat-public-browse/TEST_PLAN.md`, `.sdd/specs/feat-public-browse/CHANGELOG.md` | Record focused commands, evidence, and implementation status. |

## 8. Ordered Implementation Strategy

1. Add failing FE01 route, repository, SQL, and frontend contract tests.
2. Reconcile public query validation and canonical route/controller boundary.
3. Reconcile repository filtering, pagination, stable ordering, and FE06 availability aggregation.
4. Implement public-safe list/detail projection and hidden-book/error behavior.
5. Integrate the guest HomePage with the public API and remove FE01-owned fake mutation behavior.
6. Complete OpenAPI, traceability, focused validation, and human review.

## 9. Dependencies And Sequencing

1. FE05 owner confirms the shared public book response envelope and shared-file edit boundary.
2. FE06 owner confirms the availability aggregate uses only the latest committed `BookCopies.Status` values.
3. FE01-T001 through FE01-T004 complete before frontend integration.
4. FE01 frontend work may proceed after the canonical list/detail response shape is stable.
5. FE01 must be validated after FE05/FE06 public read contracts are available, or with deterministic in-memory/SQL fixtures that represent those contracts.

## 10. Verification Gates

| Gate | Command | Expected result |
| --- | --- | --- |
| FE01 backend routes | `npm.cmd --prefix backend test -- --runTestsByPath tests/publicBrowseRoutes.test.js` | Public list/detail, validation, hidden-book, redaction, and read-only cases pass. |
| FE01 repository | `npm.cmd --prefix backend test -- --runTestsByPath tests/publicBrowseRepository.test.js` | Database-side filters, pagination/order, null metadata, and availability projection cases pass. |
| FE01 SQL availability | `npm.cmd --prefix backend test -- --runTestsByPath tests/sql/publicBrowseAvailability.sqltest.js` | Latest committed copy-state reflection and inactive-book hiding pass when SQL configuration is available. |
| FE01 frontend | `node --test frontend/test/publicBrowseFrontend.test.js` | Home/search/detail API usage, safe labels, null fallbacks, and no fake mutation pass. |
| Traceability | `npm.cmd run trace:enforce` | FE01 changed implementation files satisfy the repository traceability threshold. |
| Diff hygiene | `git diff --check` | No whitespace errors. |

## 11. Human Review Gate

- [x] Nhat approved the FE01 public query fields, pagination, visibility, availability, and safe-field contract on 2026-07-17.
- [ ] FE05 owner confirms the shared public response envelope and shared-file ownership before code changes.
- [ ] FE06 owner confirms availability aggregation and latest-commit behavior before code changes.
- [x] FE01 focused backend 9/9, frontend 5/5, disposable SQL availability, traceability 14/14, full frontend 215/215, and diff checks pass.
- [ ] Dung and Nhat review the final public-safe DTO and no-mutation boundary before merge.
