# FE05 Test Plan - Book Management

Version: 0.4.2
Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED
Last Updated: 2026-07-22

Source Spec: `.sdd/specs/feat-book-management/SPEC.md`
Feature IDs: `BR-FE05-*`, `FR-FE05-*`, `AC-FE05-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Book catalog management for authorized staff, including create, update, metadata, management listing, and deactivation.

## 2. Unit Test Targets

- Required field validation.
- ISBN/identifier uniqueness rule.
- Category/author/publisher metadata validation.
- Deactivate rule versus hard delete.
- Search/filter/sort rules for management view.
- Managed cover validation: JPG/PNG/WebP extension, MIME, byte signature, 2 MB limit, generated name, and safe cleanup.

## 3. API / Integration Test Targets

- `GET /books/metadata`: authorized manager happy path.
- `GET /books/metadata`: Guest/Member forbidden; Librarian/Admin receive only active reference choices.
- `GET /admin/books`: manager list with deterministic filters, pagination, sort, and order.
- `POST /books`: create happy path.
- `POST /books`: missing fields, duplicate ISBN/identifier, invalid metadata.
- `PUT /books/:bookId`: update happy path, not found, invalid fields.
- `PATCH /books/:bookId/deactivate`: reason, matching `If-Match`, not found, conflict.
- `PATCH /books/:bookId/reactivate`: reason, matching `If-Match`, invalid transition, conflict.
- Role check: non-manager cannot create/update/deactivate.
- Multipart create/update: serialized `metadata`, optional `cover`, stale/failure compensation, and JSON compatibility.

## 4. E2E / Manual Acceptance Flow

- Librarian/admin creates a book.
- Librarian/admin edits a book.
- Librarian/admin deactivates and reactivates a book with confirmation and reason.
- Public browse reflects active catalog data only.
- Staff selects and previews a local cover in create/update; the committed managed image renders in staff and public views.
- Staff changes catalog status in the update form; the list switches to the new status and reloads instead of hiding the updated record under the old filter.

## 5. Current Evidence

- Focused FE05 route/repository/cover-storage/OpenAPI tests: `58/58` pass, including role-guarded active-only metadata choices.
- FE05 frontend contract tests: `10/10` pass; full frontend regression passes `215/215`.
- FE11 Admin Console boundary tests: read-only Library book view and no duplicate book mutation adapter pass.
- FE05 SQL suite: `7/7` pass, including stale rowversion, atomic audit rollback, and status/copy/workflow preservation on disposable SQL Server.
- Frontend lint/build, FE05 traceability `30/30` (100%), and `git diff --check` pass for v0.6.2.

## 6. Gaps

- Live SQL exposed and fixed a driver-boundary rowversion comparison bug; two-pass migration, 7/7 FE05 SQL results, and cleanup are recorded in `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Browser acceptance and FE06 owner confirmation remain human/L4 gates.
- Full repository merge-gate suites remain pending and must not reuse focused evidence.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
