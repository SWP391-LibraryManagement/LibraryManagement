# Admin Console Full Frontend Refactor Design

Status: APPROVED BY HUMAN - 2026-07-22

> Amendment approved 2026-07-22: `2026-07-22-admin-membership-review-integration-design.md` supersedes only this document's seven-entry navigation lock and FE04-outside-Admin boundary. Permissions/payment remain removed and all other refactor decisions remain active.

Date: 2026-07-22

Scope: FE11 Admin Console presentation and frontend structure; `FR-FE11-030..035`, `AC-FE11-016..019`, `NFR-FE11-UX-001..004`

## 1. Decision

Refactor the FE11 Admin Console frontend into a modular single-route application while preserving the approved backend, API, authorization, and business contracts.

- The public entry URL remains `/admin/users`.
- The default Admin section remains User Management.
- Navigation exposes the seven sections approved after authenticated human review; the separate Permissions item is removed while Manage Roles remains available from User Management.
- Each section becomes an independent frontend module.
- No backend endpoint, request payload, response DTO, role rule, or database schema changes.
- The refactor may improve visible copy, responsive presentation, loading/error/empty states, and accessibility without changing what an Admin is authorized to do.

This is a Shell refactor under Hybrid SDD + ADD. Core authentication, authorization, lifecycle, permission ownership, request immutability, audit redaction, and FE07/FE12 ownership boundaries remain unchanged.

## 2. Problem Statement And Evidence

The current `frontend/src/page/UserManagement.jsx` combines navigation, data loading, filters, tables, charts, modals, mutations, legacy hidden sections, and more than 400 lines of inline CSS in one file of more than 3,000 lines.

Live Azure Staging review on 2026-07-22 reproduced these presentation problems:

- Dashboard charts render all returned categories, including rows whose values are all zero, which creates overlapping labels and misleading flat-line charts.
- The eight-column user table uses fixed layout and aggressive word breaking at common laptop widths.
- Mobile keeps a 980px minimum table width, so the primary user workflow requires horizontal scrolling and hides actions.
- User actions are icon-only and depend on hover titles for meaning.
- Permission matrix cells use the same green presentation for both allowed and denied values.
- Permissions exposes internal source names such as `FE11` and `FE12`.
- Audit rows expose raw action codes, and the filter bar compresses search, action, actor, two dates, and two buttons into one dense row.
- Authenticated review found that the Audit safe-detail column expands every row even when the detail is secondary, and the User Management table still requires horizontal scrolling at common laptop/zoom widths.
- Native date inputs have no persistent visible labels, so the browser placeholder becomes the only date guidance.
- Hidden `membership` and `payments` render paths remain inside the Admin Console even though neither is part of the approved navigation.

The root causes are frontend structure and presentation rules, not backend data or authorization failures.

## 3. Approved Scope

### In Scope

- Split the Admin Console into a shell, shared presentation primitives, and seven independently rendered Admin modules plus the Home navigation action.
- Move Admin Console CSS from inline JSX into a dedicated stylesheet.
- Preserve the current route and the seven approved sidebar entries in their current order; remove only the Permissions sidebar entry and keep the underlying permission policy/API plus Manage Roles workflow unchanged.
- Redesign Dashboard charts for decision-focused presentation, including top-five limits and true empty states.
- Keep a desktop table for users and render a mobile user-card list below the responsive breakpoint.
- Add visible labels to row actions while preserving the same edit, role, detail, and deactivate handlers.
- Localize Audit action/detail presentation without changing raw API values.
- Add persistent filter labels and responsive filter layouts.
- Make permission allow/deny values visually and semantically distinct.
- Preserve last-success data while showing non-blocking refresh and retry states.
- Remove unreachable Admin Console membership/payment state, imports, and render paths.
- Update FE11 planning, tasks, changelog, tests, and validation evidence for the refactor.

### Out Of Scope

- New Admin features, permissions, roles, routes, or backend endpoints.
- Changes to account lifecycle, role mutation order, last-Admin protection, audit redaction, request actions, or request terminal-state immutability.
- Changes to FE04 Membership functionality outside the Admin Console.
- Changes to FE09 fine/payment functionality or its canonical pages.
- Changes to FE12 report calculations or FE12 APIs.
- Database migrations or schema changes.
- Replacing React, Bootstrap, Lucide icons, or the approved frontend stack.
- Creating separate URLs for individual Admin sections.

## 4. Architecture

`UserManagement.jsx` becomes a compatibility entry that renders `AdminConsolePage`. The application route and login redirect therefore remain stable while the implementation moves into focused files.

```text
frontend/src/page/admin/
├── AdminConsolePage.jsx
├── adminNavigation.js
├── components/
│   ├── AdminShell.jsx
│   ├── AdminPageHeader.jsx
│   ├── AdminFilterBar.jsx
│   ├── AdminDateField.jsx
│   ├── AdminActionButton.jsx
│   ├── AdminEmptyState.jsx
│   └── AdminPagination.jsx
├── dashboard/
│   ├── AdminDashboardSection.jsx
│   └── adminDashboardViewModel.js
├── library/AdminLibrarySection.jsx
├── circulation/AdminCirculationSection.jsx
├── requests/AdminRequestsSection.jsx
├── users/AdminUsersSection.jsx
├── permissions/AdminPermissionsSection.jsx
├── audit/
│   ├── AdminAuditSection.jsx
│   └── adminAuditPresentation.js
└── admin-console.css
```

Existing focused utilities remain in place when they already have a stable responsibility, including permission composition, request export, user statistics, request guards, user-query helpers, and shared Vietnamese labels.

### Ownership

- `AdminConsolePage`: stored Admin access, unauthenticated/forbidden redirects, active section, logout confirmation, top-level refresh routing, and shared toast state.
- `AdminShell`: responsive navigation, brand/session presentation, and the seven-entry sidebar contract.
- Section modules: section-specific API calls, filters, pagination, selection, and rendering.
- Shared components: presentation only; they do not call feature APIs or own business rules.
- View-model/presentation utilities: pure transformations that can be unit tested without rendering React.

## 5. Visual System

The refactor keeps the existing library identity instead of replacing it with a generic blue dashboard.

### Color Tokens

- Library ink: `#2A2118`
- Paper surface: `#FFFDF8`
- Reading canvas: `#FAF6EF`
- Brass accent: `#A87532`
- Success: `#18794E`
- Danger: `#B42318`
- Muted text: `#6B6153`
- Divider: `#E7DDCA`

### Typography

- Shared `var(--heading)` remains the restrained display face for page and panel headings.
- Shared `var(--sans)` remains the body and control face.
- Counts, dates, IP addresses, and pagination use tabular numerals where supported.

### Signature

The Admin Console uses an operational-ledger pattern: quiet paper surfaces, clear section rules, compact labeled statuses, and data rows optimized for scanning. Decorative cards are limited to information that supports a decision.

## 6. Navigation And Responsive Shell

### Desktop

- A 248px sticky sidebar contains the brand, seven approved entries, current account, and logout.
- The main content uses a bounded readable width with fluid data panels.
- Current-section state stays visible through background, text, icon color, and `aria-current` semantics.

### Mobile And Narrow Tablet

- The sidebar becomes a compact header with a Menu button.
- Menu content opens as a dismissible navigation panel; eight entries are not permanently displayed as a two-column grid.
- Opening and closing the menu preserves keyboard focus and supports Escape.
- The user/session block remains available inside the panel.

## 7. Section Designs

### 7.1 Dashboard

- Keep the five approved operational summary values.
- `Top sách được mượn` displays at most five positive-value rows.
- Overdue and returned-today charts display at most five positive-value rows.
- A dataset with no positive value is an empty state, not a zero line chart.
- Chart labels are truncated visually but retain a full accessible label and tooltip.
- The list below each chart remains the exact-value reading surface; the chart supports comparison.

### 7.2 User Management

- Desktop keeps a table with the approved information: user identity/email, username, phone, roles, status, created date, last login, and actions.
- Laptop widths prioritize identity, roles, status, last login, and actions; secondary fields use controlled truncation instead of breaking every character.
- Mobile renders one card per user with identity, status, roles, last login, and a labeled action row.
- `Chỉnh sửa`, `Phân quyền`, and `Vô hiệu hóa` use icon plus visible text.
- Disabled destructive actions include an explanatory title and disabled styling.
- Clicking the card/row continues to open the authoritative detail flow.

### 7.3 Requests

- Search, status, date range, Apply, Reset when active, and Export are grouped in a labeled responsive filter bar.
- `Từ ngày` and `Đến ngày` remain native date inputs for validation and accessibility, with persistent visible labels.
- Pending rows keep `Xử lý`; terminal rows keep `Chi tiết`.
- No Admin-owned approve/reject endpoint is introduced.

### 7.4 Permissions

- Remove the standalone Permissions entry from desktop and mobile sidebar navigation.
- Keep the existing read-only permission component, API adapter, backend policy, and focused derivation tests unchanged; this correction does not alter role authorization or the Manage Roles workflow in User Management.
- Replace `Ma trận FE11` with `Dữ liệu phân quyền`.
- Replace `Thống kê FE12` with `Thống kê tài khoản theo vai trò`.
- Explain that role totals may exceed unique accounts because an account can hold multiple roles.
- Allowed cells use a success check and `Có`; denied cells use a neutral dash and `Không`.
- Table headers remain visible while scanning a long matrix where the browser supports sticky positioning.
- The view remains read-only.

### 7.5 Audit Logs

- Keep the canonical `q`, `action`, `actorId`, `from`, `to`, page, and limit API values.
- Present known action choices with Vietnamese labels while continuing to submit canonical raw action values; preserve free-text canonical input for actions not yet mapped.
- Map known safe detail keys to Vietnamese labels while preserving unknown allowlisted keys as text.
- Use persistent labels for action, actor ID, and both dates.
- Split filter fields and actions into a responsive two-row layout instead of a single compressed row.
- Keep safe details available through an explicit per-row disclosure so secondary metadata does not dominate the table.
- Audit loading, error, empty, and filtered-empty states remain distinct.
- Audit rows remain read-only and continue to render only the safe nested DTO.

### 7.6 Library And Circulation

- Preserve the existing read-only Admin ownership boundaries.
- Reuse the shared header, status, filter, table/card, empty-state, and pagination patterns.
- No duplicate FE05 or FE07 mutation adapter is added.

## 8. Loading, Empty, Error, And Mutation States

- Initial load with no data uses a section skeleton or centered loading state.
- Refresh with last-success data keeps the data visible and marks the section as updating.
- A refresh failure preserves last-success data, shows a specific inline message, and exposes `Thử lại`.
- A successful empty response explains what data will make the section non-empty.
- A filtered-empty response names the active search/filter context and offers `Xóa lọc`.
- Mutations keep existing confirmation and server reconciliation behavior.
- Stale-response guards remain active for every asynchronous loader.
- No demo or invented fallback data is displayed after API failure.

## 9. Accessibility And Interaction

- All icon buttons receive visible text or an accessible label; destructive actions are not communicated by color alone.
- Keyboard focus is visibly styled for links, buttons, filters, pagination, menu controls, modals, and drawers.
- Modal and mobile-menu interaction supports Escape and returns focus to the trigger.
- Status, role, and permission meaning is available as text.
- Minimum interactive target size is 40px on touch layouts.
- Motion is limited to menu/modal entry and hover/focus feedback and is disabled under `prefers-reduced-motion: reduce`.
- Tables retain semantic headers; mobile cards use labeled fields instead of visually rearranging table markup.

## 10. Legacy Removal Boundary

The Admin Console refactor removes its unreachable `membership` and `payments` imports, state, loaders, section metadata, render blocks, and local-storage fine review logic.

This removal does not delete or modify:

- FE04 membership components, routes, APIs, or canonical approval screens.
- FE09 fine records, collection, waiver, cancellation, or payment screens.
- Any backend endpoint or database record.

The approved seven-entry Admin navigation remains the authoritative scope; the permission policy and Manage Roles authorization remain unchanged.

## 11. Data And Security Boundaries

- Stored authentication and role checks remain required before protected data loads.
- Backend authorization remains authoritative.
- Existing API adapters and safe DTOs remain unchanged.
- Audit raw values are transformed only for display; filters still submit canonical raw values.
- No secret, token, password hash, raw session value, or unapproved PII is added to the UI.
- No client-side transformation creates or changes a business decision.

## 12. Test Strategy

### Unit Tests

- Dashboard view model limits charts to five positive rows and returns an empty dataset for all-zero input.
- Audit presentation maps known codes/details while preserving unknown safe values.
- Permission presentation produces distinct allowed/denied states.
- Navigation exports exactly the approved seven entries in order and excludes Permissions.

### Frontend Contract And Component Tests

- `/admin/users` still renders the Admin Console and opens User Management by default.
- Authentication and Admin authorization guard every protected load.
- Each section calls only its approved API owners.
- User desktop table and mobile card view expose the same approved data and actions.
- Hidden membership/payment Admin paths and local-storage payment review code are absent.
- Loading, error, empty, filtered-empty, retry, and last-success states remain deterministic.
- Existing lifecycle, role, request, audit, permission, export, and stale-response tests remain green.

### Browser Acceptance

- Desktop/laptop: 1280x720, 1366x768, 1440x900, and the normal large desktop viewport.
- Mobile: 390x844.
- Navigation, Dashboard, User Management, Requests, and Audit are reviewed in desktop/laptop and mobile widths; Manage Roles is exercised from User Management.
- Verify no horizontal page overflow, no unreadable chart labels, no hidden primary action, visible keyboard focus, and reduced-motion support.
- Exercise create/edit/role modals without submitting destructive changes during visual review.

### Validation Gate

- Focused RED-GREEN frontend tests.
- Full frontend tests, lint, and production build.
- Focused backend boundary tests plus the full backend suite because API ownership must remain unchanged.
- Traceability, deployment tests, and diff hygiene.
- Authenticated Azure Staging walkthrough after deployment.
- Human review remains separate from automated responsive evidence.

## 13. Implementation Sequence

1. Add governance/task records for the approved refactor without changing FE11 business requirements.
2. Add pure view-model and presentation tests and observe the expected failures.
3. Add the new file structure, shared primitives, and stylesheet while retaining the old entry route.
4. Move the shell and navigation.
5. Migrate Dashboard and verify chart/empty behavior.
6. Migrate User Management and verify desktop/mobile parity.
7. Migrate Requests, Permissions, and Audit.
8. Migrate read-only Library and Circulation sections.
9. Remove unreachable membership/payment Admin Console code.
10. Run full automated validation, browser acceptance, Azure Staging deployment, and authenticated smoke testing.

Each migration step must keep the application buildable and preserve the current API boundary.

## 14. Risks And Controls

| Risk | Control |
| --- | --- |
| Refactor changes business behavior accidentally | Preserve API adapters and move code section-by-section behind focused contract tests. |
| Authorization loads occur before redirect | Keep stored-access checks in `AdminConsolePage` and retain protected-load regression tests. |
| Mobile card and desktop table diverge | Render both from the same normalized user objects and action handlers. |
| Audit localization changes filter values | Separate raw canonical values from presentation labels. |
| Removing Permissions from navigation removes role management | Retain the User Management role action and its existing tests; change only the shared navigation contract. |
| Removing hidden code affects canonical features | Remove only Admin Console references; run FE04/FE09 frontend regressions. |
| Large one-shot rewrite becomes unreviewable | Use an incremental migration sequence with green checks after every module. |
| Existing approved navigation drifts | Export one navigation definition and retain the exact-order test. |

## 15. Acceptance Criteria

- `/admin/users` remains the single Admin Console route and opens User Management by default.
- The console contains exactly the seven approved navigation entries and does not show Permissions.
- No backend, API, database, security, or business-rule contract changes.
- Dashboard never renders an all-zero line chart and shows no more than five plotted rows per chart.
- At 1280px and 1366px, User Management switches to the existing card presentation before the 1040px table would require horizontal scrolling; the wide table remains available when the content region can contain it.
- At 390px, User Management uses cards and the page has no horizontal overflow.
- User actions have visible Vietnamese labels.
- Permissions clearly distinguishes allowed and denied values and exposes no FE11/FE12 implementation labels.
- Audit displays Vietnamese action labels while preserving canonical raw values for filtering and technical inspection.
- Audit keeps `q`, `action`, `actorId`, `from`, and `to`; its filters wrap cleanly and safe details open only on request.
- Filter controls have persistent labels and stack cleanly on narrow layouts.
- Loading, error, empty, filtered-empty, retry, and last-success states are distinct.
- Hidden Admin Console membership/payment code is removed without changing FE04 or FE09 canonical behavior.
- Focused/full tests, lint, build, traceability, deployment checks, desktop/mobile browser acceptance, and Azure Staging smoke tests pass before completion is claimed.

## 16. Governance Updates

Implementation will add a bounded FE11 Admin Console UX refactor task group to `PLAN.md` and `TASKS.md`, record the visible refactor in `CHANGELOG.md`, and create a validation record under `.sdd/reviews/`.

The approved FE11 business requirements remain unchanged. Any discovered need to modify an API, authorization rule, database schema, or business outcome stops this refactor and requires a separately approved Core spec change.
