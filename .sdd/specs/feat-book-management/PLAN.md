# PLAN.md - FE05 Book Management

Status: APPROVED - BASELINE 2026-07-17; IMPLEMENTATION FOLLOW-UP PENDING

Owner: Dung

Updated: 2026-07-16

Workflow State: SPEC v0.5.0 and implementation plan approved; implementation not started

> **For implementation agents:** Execute `TASKS.md` in order. Preserve FE05 catalog ownership, begin each behavior task with focused failing tests, and do not mutate FE06 copy lifecycle state from FE05.

---

## 1. Goal

Reconcile the existing FE05 catalog prototype with the approved v0.5.0 contract: deterministic public/staff queries, validated metadata, atomic audited mutations, optimistic concurrency, explicit deactivate/reactivate commands, and read-only derived availability from FE06 copy state.

## 2. Source Documents

- `.sdd/specs/feat-book-management/SPEC.md` v0.5.0.
- `.sdd/specs/feat-book-management/CONTEXT.md` v0.2.0.
- `.sdd/specs/feat-book-management/TEST_PLAN.md`.
- `.sdd/rfcs/ADR-002-database-design.md`.
- `.sdd/specs/feat-inventory-book-copy/SPEC.md` for copy ownership and availability.
- `database/Librarymanagement.sql`.
- `.sdd/constraints/safety.md`.

## 3. Existing Baseline And Drift

| Approved contract | Current drift to reconcile |
| --- | --- |
| FE05 never mutates `BookCopies.Status` | Reconciled 2026-07-19: the legacy `/availability` route and repository mutation were removed, UI copy-state controls were removed, and regression tests now enforce read-only derived availability. |
| Existing-book mutations require `If-Match`/SQL `rowversion` | `Books` has no rowversion column and current update/deactivate paths accept no version. |
| Status changes use dedicated deactivate/reactivate commands with reason | Reactivation endpoint is missing; update payload may change status; deactivation has no required reason. |
| Public and staff lists use deterministic pagination/sort policy | Current filters and endpoints use prototype shapes and incomplete validation. |
| Create/update/deactivate/reactivate plus audit are atomic | Repository audit behavior is not documented or tested as a single transaction. |
| Public availability is read-only `AVAILABLE`/`UNAVAILABLE` | Frontend labels unavailable records as borrowed and collapses unrelated copy states. |
| Public and staff endpoints have distinct visibility | Prototype uses `/api/books/management` instead of the approved `/api/admin/books` contract. |

## 4. Scope

### In Scope

- Public search/detail and protected management list from `SPEC.md` section 11.
- Create and metadata-only update with required field/reference/ISBN/year/pages/rating validation.
- `ACTIVE`/`INACTIVE` deactivation and reactivation without changing copies or history.
- SQL `rowversion`, `If-Match`, `409 STALE_BOOK_STATE`, and new version responses.
- Atomic audit logging for every catalog mutation.
- Read-only availability derived from parent status and latest committed FE06 copy states.
- Backend route/repository/SQL tests, frontend regression tests, API documentation, and traceability.

### Out Of Scope

- Physical copy creation or status transitions.
- Multiple authors or many-to-many categories.
- Cover binary storage, file upload, recommendations, reviews, or ratings workflow.
- Borrowing, reservation, fine, or reporting implementation.
- Physical deletion of books.

## 5. File And Interface Map

| Area | Files | Responsibility |
| --- | --- | --- |
| SQL contract | `database/Librarymanagement.sql`, `.sdd/rfcs/ADR-002-database-design.md` | Add `Books` rowversion, retain filtered unique ISBN, document catalog/copy ownership. |
| HTTP boundary | `backend/src/app.js`, `backend/src/routes/bookRoutes.js`, `backend/src/controllers/bookController.js`, create `backend/src/validators/bookValidators.js` | Public/protected routes, `If-Match`, query/body validation, and safe errors. |
| Business rules | `backend/src/services/bookService.js` | Deterministic filters, metadata validation, status commands, and derived availability contract. |
| Persistence | `backend/src/repositories/bookRepository.js`, `backend/src/repositories/auditLogRepository.js` | Parameterized queries, copy-state aggregation, rowversion comparison, and atomic audited writes. |
| Models/docs | `backend/src/models/Book.js`, `backend/src/docs/openapi.yaml` | Rowversion metadata and approved API request/response/error schemas. |
| Backend tests | create `backend/tests/bookRoutes.test.js`, `backend/tests/bookAvailabilityRepository.test.js`, create `backend/tests/sql/bookConcurrency.sqltest.js`, create `backend/tests/helpers/inMemoryBookRepositories.js` | Public/staff behavior, validation, ownership, rollback, and stale-write evidence. |
| Frontend | `frontend/src/page/BookManagement.jsx`, `frontend/src/api/libraryFeatureApi.js` | Approved endpoint shapes, version propagation, confirmation reasons, and read-only availability. |
| Frontend tests | `frontend/test/bookManagementFrontend.test.js` | Remove prototype expectations and lock the v0.5.0 UI/API contract. |

## 6. Approved Interfaces

| Method | Endpoint | Required behavior |
| --- | --- | --- |
| `GET` | `/api/books` | Public-safe active books; deterministic filters, pagination, sort, and derived availability. |
| `GET` | `/api/books/{bookId}` | Public receives active detail or `404`; staff may receive `ACTIVE` or `INACTIVE` detail with management fields. |
| `GET` | `/api/admin/books` | Librarian/Admin paginated management list including active/inactive records. |
| `POST` | `/api/books` | Librarian/Admin creates an `ACTIVE` book and receives its version. |
| `PUT` | `/api/books/{bookId}` | Librarian/Admin metadata-only update with `If-Match`; never changes status or copies. |
| `PATCH` | `/api/books/{bookId}/deactivate` | Matching `If-Match` plus `{ reason }`; changes only `Books.Status` to `INACTIVE`. |
| `PATCH` | `/api/books/{bookId}/reactivate` | Matching `If-Match` plus `{ reason }`; changes only `Books.Status` to `ACTIVE`. |

The legacy `/api/books/{bookId}/availability` route and its controller/service/repository mutation methods must be removed. Calls to that unregistered route return the standard safe `404` response and never write `Books` or `BookCopies`.

## 7. Ordered Implementation Strategy

### 7.1 Lock V0.5.0 With RED Tests

- Add route tests for public visibility, staff list, RBAC, deterministic query rejection, field/reference/ISBN validation, `If-Match`, reasons, status commands, and copy-mutation rejection.
- Add repository tests for derived availability and SQL tests for stale competing mutations plus audit rollback.
- Replace frontend tests that currently assert the prohibited availability mutation.

### 7.2 Reconcile Schema And Concurrency

- Add SQL `rowversion` to `Books` and expose an opaque API version.
- Update ADR/model metadata before repository mutation logic.
- Compare the caller's version in the same transaction that updates the book and writes audit data.

### 7.3 Reconcile Public And Staff Reads

- Public queries include only `ACTIVE` books and public-safe fields.
- Staff management queries may include both states.
- Apply exact keyword/page/limit/sort/order rules and stable tie-breaking by `BookId`.
- Derive availability from `Books.Status` plus `BookCopies.Status = AVAILABLE`; never persist an FE05 availability column.

### 7.4 Reconcile Catalog Mutations

- Create validates title, optional unique ISBN, category/author/publisher references, year, pages, rating, description, and cover URL.
- Metadata update cannot accept status/copy fields.
- Deactivate/reactivate require current version and reason; only `Books.Status` changes.
- Every successful mutation and audit entry commits together or rolls back together.

### 7.5 Reconcile Frontend And Evidence

- Use approved public/admin endpoints and propagate last-seen version through `If-Match`.
- Replace “borrowed” fallback with the exact unavailable label `Không khả dụng`.
- Require explicit confirmation/reason for deactivate/reactivate and refresh canonical server state after each mutation.
- Add `@spec` tags and focused evidence before the full merge gate.

## 8. Dependency Order

1. RED route/repository/SQL/frontend contract tests.
2. SQL rowversion, ADR/model, and OpenAPI contract.
3. Validators and read-query reconciliation.
4. Atomic create/update/deactivate/reactivate implementation.
5. Frontend reconciliation.
6. Traceability, focused verification, then human review.

FE05 read contracts must be stable before FE06/FE07 consume parent-book status and catalog summaries.

## 9. Verification Gates

| Gate | Command | Expected result |
| --- | --- | --- |
| FE05 backend | `npm.cmd --prefix backend test -- --runTestsByPath tests/bookRoutes.test.js tests/bookAvailabilityRepository.test.js` | Public/staff, validation, ownership, and derived-availability tests pass. |
| FE05 SQL concurrency | `npm.cmd --prefix backend test -- --runTestsByPath tests/sql/bookConcurrency.sqltest.js` | Stale mutation and audit rollback cases pass when SQL test configuration is available. |
| FE05 frontend | `node --test frontend/test/bookManagementFrontend.test.js` | No copy mutation, correct unavailable label, version, and status-command checks pass. |
| Traceability | `npm.cmd run trace:enforce` | FE05 changed implementation files satisfy the repository threshold. |
| Diff hygiene | `git diff --check` | No whitespace errors. |

## 10. Human Review Gate

- [x] Confirm the `/api/admin/books` migration/compatibility approach.
- [x] Confirm `If-Match` encoding and version response shape.
- [x] Confirm the legacy availability mutation is removed without moving copy ownership into FE05.
- [x] Confirm deactivate/reactivate change only `Books.Status` and preserve all workflow records.
- [x] Approve `TASKS.md` ordering and mappings before implementation starts.
