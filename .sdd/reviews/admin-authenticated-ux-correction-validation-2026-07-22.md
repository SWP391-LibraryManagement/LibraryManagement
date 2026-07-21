# Admin Authenticated UX Correction Validation - 2026-07-22

## Decision

The authenticated Admin presentation correction is implemented and locally
validated at `157b59b`. This is a Shell-only correction under `FE11-UXR08`:
the sidebar no longer exposes a separate Permissions destination, User
Management changes to cards before the desktop table can force page-level
horizontal scrolling, and Audit preserves every canonical filter while making
actions and safe row details easier to read.

No backend, API, schema, authentication, authorization, role policy, lifecycle,
pagination, or audit-redaction contract changed. `FE11-UXR08` and the parent
`FE11-UXR07` remain open until this commit is deployed to Azure Staging and an
authenticated human reviewer accepts the desktop/mobile presentation.

## Corrected Presentation Boundary

- The Admin sidebar exposes exactly seven entries and omits only the separate
  `permissions` destination.
- User role management remains reachable through the `Phân quyền` action in
  User Management; the FE11 role mutation flow was not removed or rewritten.
- User Management uses the table above 1440px and responsive cards at 1440px
  and below, preventing the page-level horizontal drag reported during review.
- Audit retains `q`, `action`, `actorId`, `from`, and `to` query inputs.
- Audit action entry accepts canonical raw values and provides readable
  Vietnamese suggestions without changing the value sent to the API.
- Safe audit details are collapsed per row and the table uses bounded semantic
  columns, truncated long actor/target text, and compact date/time presentation.

## Test-First Evidence

Focused RED contracts failed for the absent seven-entry navigation contract,
the missing 1440px table-to-card breakpoint, the missing Audit action choices,
and the missing per-row details disclosure. The corresponding GREEN contracts
now pass and are included in the full frontend suite.

## Fresh Local Automated Validation

| Command | Result |
| --- | --- |
| `npm.cmd --prefix frontend test` | PASS - 192/192 |
| `npm.cmd --prefix frontend run lint` | PASS - no findings |
| `npm.cmd --prefix frontend run build` | PASS - Vite production build |
| `npm.cmd run trace:enforce` | PASS - all implemented features above threshold; FE11 36/38 FR tags (95%) |
| Focused `fe11-admin-request-management.spec.js` with isolated ports | PASS - 1/1 Chromium |
| `git diff --check` | PASS - no whitespace errors |

The isolated browser run used frontend port `48173` and backend port `43100`
so pre-existing local Vite processes were not modified.

## Responsive And Visual Evidence

Authenticated browser coverage proves that the document has no horizontal
overflow and that the intended User Management presentation is active at each
review width:

- `output/playwright/admin-user-management-1440.png` - cards;
- `output/playwright/admin-user-management-1366.png` - cards;
- `output/playwright/admin-user-management-1280.png` - cards;
- `output/playwright/admin-user-management-390.png` - mobile cards;
- `output/playwright/admin-audit-1366.png` - retained filters, readable columns,
  and per-row safe-detail disclosure.

The sidebar assertion also proves exactly seven entries with no Permissions
destination, while the User Management assertion proves the role-management
button remains available.

## Four-Layer Validation

- **L1 Implementation:** PASS - source, focused contracts, full frontend tests,
  lint, and build are green.
- **L2 Traceability:** PASS - the correction maps to BR-FE11-016..018,
  FR-FE11-030/032/033, AC-FE11-016..018, and Q-FE11-011.
- **L3 Boundary safety:** PASS - production changes are limited to Admin
  presentation files; API ownership and security behavior are unchanged.
- **L4 Integration:** LOCAL PASS - authenticated Chromium and responsive images
  pass. Azure Staging deployment and explicit human visual approval are pending.

## Azure Staging And Human Acceptance

Pending deployment and authenticated human review. Automated browser evidence
does not replace visual acceptance on the deployed environment.
