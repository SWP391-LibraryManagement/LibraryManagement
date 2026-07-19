# FE01 Public Book Envelope Decision

Date: 2026-07-19

Status: APPROVED BY USER ON 2026-07-19

## Decision Scope

FE01-T001 and FE01-T005 require an approved response envelope for the shared
FE01/FE05 public book list. The approved specs require paginated public-safe
book summaries, but they do not currently name the top-level JSON fields.

This decision is limited to `GET /api/books`. It does not change public fields,
availability rules, query fields, pagination bounds, or FE05/FE06 ownership.

## Evidence

- FE01 PLAN section 5 requires a shared FE05 public-read envelope with
  pagination metadata.
- FE01 TASKS marks FE05 owner confirmation as a dependency of FE01-T001 and
  FE01-T005.
- FE05 SPEC describes `GET /api/books` as paginated book summaries but does not
  define the top-level JSON keys.
- The shared API contract permits resource-specific successful JSON and does
  not define a universal success wrapper.
- The approved FE11 paginated list convention uses exact top-level keys
  `data` and `pagination`.

## Recommended Contract

Approve the following exact list envelope:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Rules:

- The top level contains exactly `data` and `pagination`.
- `data` contains only the FE01 public-safe summary DTO.
- `pagination.page` and `pagination.limit` are the validated request values.
- `pagination.total` is the total number of matching active public books.
- `pagination.totalPages` is `0` when `total` is `0`; otherwise it is
  `ceil(total / limit)`.
- Legacy `success` and `message` fields are not part of this public contract.
- Exact copy counts, copy metadata, staff fields, and protected records remain
  forbidden.

## Rationale

The recommendation reuses an already approved paginated-list convention,
provides the metadata required by FE01/FE05, and avoids preserving a prototype
wrapper that is not part of the approved shared API rules.

## Approval Gate

- [x] User approved the recommended exact envelope on 2026-07-19 (`duyệt hết`).
- [x] FE01 and FE05 source-of-truth documents are clarified together before
  production implementation.
- [x] FE01-T001 RED tests lock the approved envelope after that clarification.

Implementation evidence:

- `backend/tests/publicBrowseRoutes.test.js` locks the exact query allowlist,
  `data` + `pagination` envelope, public-safe list/detail schemas, and empty-q
  browsing contract.
- `backend/tests/bookRoutes.test.js` locks exact runtime public DTO fields,
  null optional metadata, and absence of copy counts.
- `frontend/test/publicBrowseFrontend.test.js` locks canonical list/detail API
  use and removal of the local fake borrowing flow.
