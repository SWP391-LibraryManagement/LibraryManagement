# Library Operational Page Patterns Design

Status: APPROVED - HUMAN DESIGN GATE PASSED

Date: 2026-07-15

Branch: `docs/ux-slice3-operational-patterns`

## 1. Purpose

Define the executable UX contract for Slice 3 of the Library Management System UX program. This slice standardizes operational page headers, data states, toolbars, tables, confirmations, and completion feedback without changing business behavior.

The design follows the Hybrid Spec-Driven and Agent-Driven workflow:

1. The consistency analysis is recorded in `.sdd/reviews/library-ux-slice3-operational-consistency-analysis-2026-07-15.md`.
2. Nhat approved the presentation-only boundary for FE06 and FE09.
3. Nhat approved the shared-primitives and FE07-tracer design on 2026-07-15.
4. An implementation plan and production changes remain behind separate review gates.

## 2. Source Requirements

This design refines, but does not replace, the approved master UX design:

- `UX-FE-006`: API-backed pages expose loading, empty, success, and failed states without unstable layout shifts.
- `NFR-UX-001`: Primary actions, status messages, and page content remain reachable at approved viewport widths.
- `NFR-UX-002`: Interactive controls have accessible names and visible keyboard focus.
- `NFR-UX-003`: Presentation motion is short and respects reduced-motion preferences.
- `AC-UX-004`: Protected page content remains reachable at 390px.
- `AC-UX-005`: The matching data state is visible and stable.
- `AC-UX-007`: Navigation, dialogs, forms, and actions remain keyboard operable.
- `AC-UX-008`: API, business, security, and privacy contracts remain unchanged.

Feature-specific UX requirements remain authoritative:

- FE06: `NFR-FE06-UX-001` and `NFR-FE06-UX-002`.
- FE07: `NFR-FE07-UX-001` and frontend tasks `FE07-T20` through `FE07-T27`.
- FE08: `NFR-FE08-UX-001` and `NFR-FE08-UX-002`.
- FE09: `NFR-FE09-UX-001`, `NFR-FE09-UX-002`, and deferred frontend task `FE09-T012`.
- FE12: `NFR-FE12-UX-001` and `NFR-FE12-UX-002`.

## 3. Goals

- Give operational pages one recognizable structure for titles, actions, loading, errors, empty results, filters, tables, confirmation, and completion feedback.
- Reuse the current app shell and warm library visual system instead of introducing another design language.
- Establish FE07 Borrowing as the tracer before migrating other operational pages.
- Keep page-owned API calls, view models, business calculations, and route authorization intact.
- Make FE06 Inventory and FE09 Fines visually consistent while preserving their current prototype data sources and limitations.
- Keep the solution small enough for the student team to understand, review, and maintain.

## 4. Non-Goals

- No backend, API contract, database schema, or business-rule change.
- No change to fine calculation, borrowing eligibility, renewal rules, reservation queue order, report metrics, or inventory status transitions.
- No new client role or server authorization behavior.
- No FE06 API delivery or task completion claim while its `PLAN.md` and `TASKS.md` remain not started.
- No FE09 frontend API alignment; that remains `FE09-T012`.
- No replacement of Bootstrap, MUI, React Router, Axios, or the existing icon library.
- No full responsive and accessibility acceptance pass; that remains Slice 4, although new primitives must be designed to support it.
- No redesign of unrelated public, authentication, profile, user-management, or book-management pages.

## 5. Chosen Approach

Use shared structural primitives with page-owned content and behavior.

- Shared components own layout, semantics, visual state, focus behavior, and duplicate-action prevention.
- Feature pages continue to own API requests, view-model mapping, filters, selected rows, and mutation handlers.
- The shared table is compositional rather than a schema-driven data-grid framework. Pages retain control over row and cell rendering.
- Existing exports remain available during migration to avoid a repository-wide rename in one commit.

This approach was selected over CSS-only normalization because CSS cannot enforce state or confirmation contracts. It was selected over a simultaneous page rewrite because the five target modules have different delivery maturity and risk.

## 6. Component Architecture

### 6.1 `PageHeader`

Responsibilities:

- Render one page title, optional supporting context, and optional primary/secondary actions.
- Keep action placement stable on desktop and stack actions below the title on narrow screens.
- Preserve one `h1` for the page.

Integration:

- `AppLayout` composes `PageHeader` from its current `title`, `subtitle`, and `actions` props.
- Pages do not render a second page-level heading inside their content.
- Existing `AppLayout` call sites remain compatible.

### 6.2 `StatusNotice`

Responsibilities:

- Render persistent `info`, `warning`, `error`, or `success` state.
- Accept a title, body, and optional action such as retry.
- Use alert semantics for errors and status semantics for non-error messages.
- Describe the user outcome and next action, not implementation details or endpoint names.

Compatibility:

- `DataNotice` remains as a temporary compatible export or wrapper during migration.

### 6.3 `LoadingBlock`

Responsibilities:

- Reserve a stable content region while data is loading.
- Expose an accessible busy label.
- Support a small set of row-count variants instead of page-specific skeleton implementations.
- Stop decorative animation under reduced-motion preferences.

### 6.4 `EmptyState`

Responsibilities:

- Distinguish an empty dataset from a filtered no-result state.
- Render an icon, short title, optional explanation, and optional relevant next action.
- Avoid generic dead ends when a user can clear filters, retry, or begin a workflow.

### 6.5 `DataToolbar`

Responsibilities:

- Provide structural slots for search, tabs, filters, result summary, reset, and page-level data actions.
- Keep controls usable when wrapping to multiple rows.
- Give reset controls an accessible name and disable them when no filter is active.

Constraints:

- The component does not own query state, filter logic, pagination, or API requests.
- Each page passes the controls it needs; unused regions are omitted.

### 6.6 `DataTable`

Responsibilities:

- Provide a semantic table wrapper with caption, header, body, loading, and empty-state regions.
- Preserve page-owned row rendering and existing keyboard-selectable row behavior.
- Support mobile row/card presentation through shared responsive classes and page-provided cell labels.
- Keep numeric and status columns readable without changing sort order or data values.

Constraints:

- Do not introduce a generic sorting, selection, virtualization, or server-pagination engine.
- Do not hide columns that contain required operational context.
- Horizontal overflow may remain as a fallback for unusually wide content, but the primary mobile presentation uses labeled rows/cards.

### 6.7 `ConfirmAction`

Responsibilities:

- Compose the existing accessible `Modal` for approval, rejection, return, renewal, reservation cancellation, fine collection, payment completion, and other consequential actions.
- Render action-specific context, cancel text, confirm text, and visual tone.
- Disable duplicate confirmation while the mutation is pending.
- Preserve focus restoration and keyboard trapping from the existing modal.
- Keep the dialog open and show actionable feedback when the mutation fails.

Constraints:

- The component does not perform the API mutation itself.
- Page handlers remain responsible for canonical server results and local state updates.

### 6.8 `Toast`

Responsibilities:

- Confirm short-lived mutation completion or show a recoverable mutation error.
- Avoid replacing persistent inline state when the current page remains failed or incomplete.
- Use the existing shared hook and styling; FE09 removes its duplicate implementation during migration.

## 7. Operational State Model

Every API-backed collection or report surface uses one visible primary state:

1. `loading`: show `LoadingBlock`; keep the page header and reload action stable.
2. `error`: show `StatusNotice` with safe copy and a retry action; do not display stale data as canonical unless it is explicitly labeled as demo fallback.
3. `empty`: show `EmptyState` for a successful response with no records.
4. `success`: show the toolbar, data presentation, and relevant inline status.

Filtered collections additionally distinguish:

- Dataset empty: no records exist for the current user or module.
- No results: records exist, but active search or filters match none; offer reset when appropriate.

Mutations use a separate state:

1. `idle`: action available when business state permits it.
2. `pending`: confirm action disabled and labeled as processing.
3. `success`: dialog closes after the canonical state updates; show a concise toast.
4. `error`: dialog remains available or returns focus to the failed control; show safe actionable feedback without pretending the action succeeded.

## 8. Feature Application

### 8.1 FE07 Borrowing - tracer

Apply the complete primitive set first:

- Borrow request: shared toolbar/search and empty state; preserve the current catalog source and create-request API.
- Borrowing history: shared toolbar, tabs, data table, pagination shell, renewal confirmation, and mutation pending state.
- Staff borrow requests: shared data table and explicit approve/reject confirmations; preserve selectable-row behavior.
- Return processing: shared toolbar and data table; require confirmation before submitting the existing return mutation.
- Member borrowing details: shared lookup toolbar and all three table states.

No FE07 API method, eligibility rule, date calculation, role guard, or mapping function changes in this slice.

### 8.2 FE08 Reservations

- Use the shared toolbar, data table, status notice, empty state, confirmation, and toast patterns.
- Preserve reservation creation, cancellation, queue processing, hold expiration, and notification APIs.
- Keep current demo fallback behavior during this presentation slice, but label it persistently as non-canonical and keep server-only actions disabled when required.
- Do not change queue ordering, hold rules, notification behavior, or route authorization.

### 8.3 FE06 Inventory - presentation-only

- Keep `InventoryPage` inside `AppLayout` and remove the duplicate inner page header.
- Replace page-specific table, empty state, filter layout, and modal presentation with shared patterns where compatible.
- Preserve `MOCK_BOOKS`, `MOCK_COPIES`, current edit behavior, and existing in-memory state.
- Clearly avoid any claim that the screen is the canonical FE06 API implementation.
- Do not create, update, deactivate, or transition real book-copy records as part of this slice.

### 8.4 FE09 Fines - presentation-only

- Move the existing fine workspace into `AppLayout` and remove its duplicate global shell/navigation presentation.
- Preserve the local workflow navigation as page-level tabs or segmented operational views.
- Reuse shared toolbar, table, status, empty, confirmation, and toast patterns.
- Preserve existing localStorage/sample-data behavior until `FE09-T012` is separately planned and approved.
- Keep existing calculation and collection behavior untouched; do not present it as canonical server-side fine processing.
- Preserve access to any currently embedded book-management workspace during this presentation migration; do not redesign that module.

### 8.5 FE12 Reports

- Consolidate repeated date/category filter layouts under `DataToolbar`.
- Use shared tables for top books, low inventory, and role/membership summaries.
- Preserve report guards, filter parameter builders, chart data, metrics, and read-only semantics.
- Replace endpoint-oriented success copy with outcome-oriented feedback.

## 9. Navigation Integration

- Add Inventory and Fines to the existing staff navigation group using the already-approved `LIBRARIAN` and `ADMIN` visibility rule.
- Derive active navigation state from their existing routes.
- Do not add a role, broaden visibility, or replace server authorization.
- Keep feature-local workflow tabs inside the page content; do not introduce a second application shell.

## 10. Error and Copy Rules

- Protected operational pages use Vietnamese user-facing labels consistently.
- API identifiers, source identifiers, test names, and spec IDs remain English.
- Do not show raw stack traces, SQL messages, tokens, SMTP details, or endpoint connectivity messages.
- Validation and conflict messages explain the blocking reason when the approved feature contract supplies it.
- Unknown failures remain generic and actionable: retry, check the session/connection, or contact a librarian depending on context.
- Toasts do not claim completion until the canonical mutation succeeds.

## 11. Testing Strategy

Use the repository's current Node test style and avoid new testing dependencies.

- Add focused shared-component source contracts for semantics, compatibility exports, pending confirmation behavior, and responsive table hooks.
- Extend FE07 tests first to prove tracer adoption without changing API calls, route guards, or canonical mappings.
- Add focused adoption tests for FE08, FE06, FE09, and FE12 as each module migrates.
- Keep feature utility and API tests intact.
- Run targeted frontend tests during each task, then frontend lint and build at the slice validation gate.
- Use `git diff --check` and final diff inspection before each review commit.
- Defer full viewport and keyboard acceptance evidence to Slice 4, while preventing known structural blockers in Slice 3.

## 12. Acceptance Criteria

- `AC-UX-S3-001`: Given an operational page, when it renders in the protected shell, then it has one page header with title, context, and reachable actions.
- `AC-UX-S3-002`: Given an API-backed surface, when it is loading, failed, empty, filtered to no results, or successful, then exactly the relevant state and recovery action are visible.
- `AC-UX-S3-003`: Given a consequential action, when the user confirms it, then duplicate submission is prevented while pending and success is shown only after the handler succeeds.
- `AC-UX-S3-004`: Given a data table at mobile width, when rows render, then required cell context remains understandable through shared labeled row/card presentation without incoherent overlap.
- `AC-UX-S3-005`: Given the FE07 tracer pages, when the shared patterns are applied, then existing API calls, view models, route guards, and business outcomes remain unchanged.
- `AC-UX-S3-006`: Given FE08 demo fallback, when a backend request fails, then the fallback is visibly non-canonical and server-only actions remain constrained as before.
- `AC-UX-S3-007`: Given FE06 Inventory, when presentation migration completes, then its duplicated header and page-specific state/table presentation are replaced while mock data and in-memory behavior remain unchanged.
- `AC-UX-S3-008`: Given FE09 Fines, when presentation migration completes, then it uses the shared application shell and feedback patterns while localStorage/sample-data behavior remains unchanged and `FE09-T012` remains open.
- `AC-UX-S3-009`: Given FE12 Reports, when shared patterns are applied, then filters, report values, guards, and read-only behavior remain unchanged.
- `AC-UX-S3-010`: Given the final Slice 3 diff, when reviewed, then it contains no API/schema changes, business calculation changes, role broadening, secrets, or new production dependencies.

## 13. Rollout and Review Gates

Implementation order remains:

1. Shared primitives and compatibility layer.
2. FE07 Borrowing tracer.
3. FE08 Reservations.
4. FE06 Inventory presentation-only migration.
5. FE09 Fines presentation-only migration.
6. FE12 Reports.
7. Targeted validation and human review.

Each stage must remain reviewable and traceable. A later stage does not begin if the earlier stage exposes a business-contract regression or requires an unapproved scope expansion.

## 14. Resolved Decisions

- `DEC-UX-S3-001`: Use shared compositional primitives, not CSS-only normalization or a generic data-grid framework.
- `DEC-UX-S3-002`: FE07 Borrowing is the tracer slice.
- `DEC-UX-S3-003`: FE06 and FE09 receive presentation-only migration; their feature/API delivery remains separate.
- `DEC-UX-S3-004`: Keep page-owned data and mutation logic.
- `DEC-UX-S3-005`: Preserve compatibility exports while pages migrate incrementally.
- `DEC-UX-S3-006`: Add Inventory and Fines to existing staff navigation without changing role rules.

## 15. Approval Record

Nhat approved the recommended presentation-only boundary for FE06/FE09 and approved this shared-primitives, FE07-tracer design in the Codex task on 2026-07-15.

This approval authorizes writing the implementation plan after the committed design receives written-spec review. It does not authorize production implementation, merge, or changes outside the scope above.
