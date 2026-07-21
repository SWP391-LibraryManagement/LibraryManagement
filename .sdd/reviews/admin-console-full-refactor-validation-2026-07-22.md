# Admin Console Full Frontend Refactor Validation - 2026-07-22

## Decision

The approved Shell-only Admin Console refactor is implemented and locally
validated at `5925ec08924569c72bae61a74ad1e9b3937702b6`. The route remains
`/admin/users`, the default section remains User Management, and all Core API,
schema, authorization, role, lifecycle, audit-redaction, and cross-feature
ownership contracts remain unchanged.

`FE11-UXR01..FE11-UXR06` are complete. `FE11-UXR07` remains open until Azure
Staging deployment evidence and an authenticated human desktop/mobile visual
approval are both recorded. Automated responsive checks are not treated as
human visual signoff.

## Implemented Boundary

- Replaced the 3,146-line `UserManagement.jsx` implementation with a one-line
  compatibility export to `admin/AdminConsolePage`.
- Split the Admin Console into guarded shell, shared presentation primitives,
  and Dashboard, Users, Requests, Permissions, Audit, Library, and Circulation
  modules.
- Kept the exact eight approved navigation entries and a single
  `/admin/users` URL.
- Kept FE07 as the request/return/renew mutation owner, FE11 as the user,
  permission, and audit owner, FE12 as the user-statistics owner, FE05 as the
  canonical book-mutation owner, and FE04/FE09 outside the Admin Console.
- Removed only unreachable membership/payment code from the historical Admin
  monolith.

## Test-First Evidence

Each implementation slice started with a focused RED contract for the missing
presentation owner, component, section, or compatibility entry. The final
cutover RED proved that the legacy entry was not yet the exact one-line modular
export. GREEN evidence then covered the pure presentation helpers, guarded
shell, every Admin section, module ownership boundaries, responsive
table-to-card behavior, and the compatibility entry.

## Fresh Local Automated Validation

| Command | Result |
| --- | --- |
| `npm.cmd --prefix frontend test` | PASS - 191/191 |
| `npm.cmd --prefix frontend run lint` | PASS - no findings |
| `npm.cmd --prefix frontend run build` | PASS - Vite production build |
| `npm.cmd --prefix backend test -- --runInBand` | PASS - 54/54 suites, 926/926 tests |
| `npm.cmd run trace:enforce` | PASS - all 12 implemented features above threshold; FE11 36/38 FR tags (95%) |
| `npm.cmd run test:deployment` | PASS - 8/8 |
| `npm.cmd run test:system` | PASS - 10/10 |
| `npm.cmd run test:e2e` with explicit isolated frontend URL/port | PASS - 4/4 Chromium |
| Focused `fe11-admin-request-management.spec.js` | PASS - 1/1 Chromium |
| Scoped `git diff --check` before evidence edits | PASS - no whitespace errors |

The full E2E rerun used an isolated frontend port and explicitly supplied
matching `E2E_FRONTEND_URL` and `E2E_BACKEND_URL` values. Earlier attempts that
changed only the port variables exercised the pre-existing server/default URL
instead of the isolated test server; those environment failures did not
exercise the candidate application. The correctly aligned run passed 4/4.

## Responsive And Browser Evidence

`E2E-FE11-ACC01` passed against authenticated Admin data and proves:

- 1366x768: User Management table visible, mobile cards hidden, no document
  overflow.
- 390x844: table hidden, user cards visible, labeled `Chỉnh sửa` action
  reachable, no document overflow.
- Admin Dashboard summary remains API-backed.
- Request pagination, filters, DOCX export, authoritative detail, pending
  actions, and terminal-state immutability remain intact.

Source-level responsive contracts also prove the accessible mobile menu, focus
styles, reduced-motion behavior, desktop table, and mobile card presentation.

## Safety And Ownership Review

- No backend, schema, migration, API adapter, authentication, or permission
  policy production file changed in this refactor.
- No duplicate FE05 book mutation was introduced.
- No FE04 membership or FE09 fine/payment workflow was moved into Admin.
- Audit rendering uses safe nested DTO fields and localized presentation
  labels; raw metadata and unsafe HTML rendering remain absent.
- User role changes still validate the complete numeric catalog, assign before
  revoke, and reconcile partial failures from authoritative server detail.

## Azure Staging And Human Acceptance

Automated staging deployment passed for
`903a1a25656b9383fa687c11239aeea33070f48f`:

- workflow [29871576856](https://github.com/SWP391-LibraryManagement/LibraryManagement/actions/runs/29871576856)
  concluded `success`;
- `deploy-backend`, `deploy-frontend`, and `smoke-test` all concluded `success`;
- `GET https://app-library-api-staging-nhat714.azurewebsites.net/health`
  returned HTTP 200 with `{"status":"ok"}`;
- `GET https://lemon-wave-04db51100.7.azurestaticapps.net/admin/users`
  returned HTTP 200 with the SPA root.

Still pending:

- authenticated staging walkthrough at 1366x768 and 390x844;
- explicit human visual approval.

`FE11-UXR07` remains open until the reviewer explicitly accepts the
authenticated desktop/mobile experience. Workflow smoke and local authenticated
Playwright evidence do not replace that human staging review.
