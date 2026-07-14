# Library Management System UX Design

Date: 2026-07-14
Version: 0.1.0
Status: APPROVED - SLICES 1-2 COMPLETE; SLICES 3-4 PLANNED
Last Updated: 2026-07-15
Owner: Nhat
Source of truth: `spec-driven-&-agent-driven-development.pdf` plus the project
Constitution, Shared Context, and feature specs.

## 0. Playbook Traceability

This document follows the playbook instead of treating UX as an unbounded visual
refactor:

- Chapter 2, Outcome Engineer: define user outcomes and evidence, not only code output.
- Chapter 5.2, Executable Spec: capture context, actors, functional and non-functional
  requirements, data/error behavior, acceptance criteria, and out of scope.
- Chapter 5.3, EARS: express observable behavior as conditions and system responses.
- Chapter 5.5 and Chapter 6.1, SDD workflow: specify, review, plan, decompose, implement,
  and validate before calling the work complete.
- Chapter 7.2, Clarification-First Planning: keep the open decisions explicit instead of
  silently choosing product behavior.
- Chapter 7.3, Consistency Analysis Gate: check the UX design against existing specs,
  routes, RBAC, API contracts, and constraints before implementation.
- Chapter 13.1 and 13.3, Hybrid Core & Shell: use full specification discipline for
  behavior and security-sensitive flows; use guided agentic execution for presentational
  shell work.
- Chapter 13.3, Validation Gate: verify automated checks, spec compliance, constitution
  compliance, and human acceptance separately.
- Chapter 14.3, Polish & Delivery: this is polish and delivery work; it must not become a
  reason to add new product features.

The PDF is the method reference. Existing project files remain the technical and domain
source of truth when the playbook gives process guidance but not product rules.

### Core and Shell classification

Core items requiring feature-spec traceability and explicit validation:

- Auth step transitions, validation, error handling, OTP resend behavior, and safe copy.
- Role-based navigation visibility and protected-route behavior.
- API-backed state contracts where a UI decision changes user-observable behavior.
- Acceptance criteria for the registration, login, and protected workflow journeys.

Shell items eligible for guided agentic implementation after this design is approved:

- Shared layout, navigation presentation, spacing, tokens, typography, and responsive CSS.
- Reusable loading, empty, notice, table, toast, and confirmation primitives.
- Focus styling and presentation-level responsive adaptations that do not alter rules.

If a Shell change changes business behavior or a security boundary, it moves back into the
Core track and requires the related feature spec to be updated first.

## 1. Decision

Adopt a single UX system for the existing React application. Preserve the warm library
identity, but make the product calmer, denser, more predictable, and easier to use on
small screens. Work is delivered in four vertical slices:

1. Shared app shell and responsive navigation.
2. Login, registration, and email OTP flow.
3. Shared states and interaction patterns for operational pages.
4. Responsive and accessibility polish across the touched surfaces.

The first implementation target is the shared shell because every protected page depends
on it. Authentication follows because it is the first high-friction user journey.

## 2. Context and Current Findings

The current frontend has two navigation implementations: the active shell in
`frontend/src/component/layout/AppLayout.jsx` and a legacy MUI drawer in
`frontend/src/component/layout/Sidebar.jsx`. Authentication uses a separate visual
system in `frontend/src/styles/login.css`.

Observed UX risks:

- Registration presents five fields in one dense view and has no visible progress model
  before switching to OTP verification.
- OTP feedback is generic and does not provide a resend cooldown, delivery guidance, or
  a clear recovery path when the user cannot access the email.
- App shell search is rendered as a control but has no defined behavior on every page.
- Desktop and mobile navigation behavior is not unified; the shell collapses labels but
  does not provide an explicit mobile navigation interaction.
- Shared loading, empty, error, and success patterns exist in CSS but are not guaranteed
  across all feature pages.
- The warm palette and rounded surfaces are repeated with different component systems,
  making spacing and hierarchy feel inconsistent.

## 3. Goals

- Make the primary journeys understandable without explanation: browse, authenticate,
  borrow, reserve, return, and review reports.
- Preserve user-entered form data through validation and recoverable API errors.
- Make system state visible through consistent loading, empty, error, success, and
  disabled states.
- Make the protected application usable at desktop and mobile widths without hiding
  essential actions.
- Keep role-based navigation aligned with backend permissions.
- Improve keyboard focus, control labels, touch targets, and readable error copy.
- Reduce duplicated visual primitives without changing business behavior or API
  contracts.

Success indicators for this design:

- A reviewer can complete the registration-to-verification journey without asking what
  happens next.
- The shell remains usable at the four target widths in the acceptance criteria.
- Every touched API-backed surface exposes a tested state for loading, empty, error, and
  success.
- Human acceptance records no navigation, form-data-loss, focus, or overlap blocker.

## 3.1 Actors and Roles

- `Guest`: can access login, registration, forgot-password, and public entry points.
- `Member`: can use member borrowing, history, and reservation journeys.
- `Librarian`: can use borrowing operations, inventory, reservations, and reports allowed
  by the existing role contract.
- `Admin`: can use librarian capabilities plus user and role management already exposed by
  the application.
- `Email service`: delivers verification or recovery messages; the UI only shows safe
  delivery and retry states.
- `Browser`: owns focus, viewport, keyboard, and reduced-motion preferences.

## 4. Non-goals

- No change to authentication rules, borrowing rules, permissions, or API contracts.
- No new product modules or feature scope.
- No replacement of React, Bootstrap/MUI usage already required by the project, or the
  existing backend stack.
- No visual redesign of every page before the shared primitives are stable.
- No exposure of OTPs, passwords, tokens, or SMTP credentials in the client.

## 5. Experience Principles

### 5.1 One action, one outcome

Buttons use explicit verbs and keep the same wording from trigger to result. Destructive
or irreversible actions require a visible confirmation state.

### 5.2 State is part of the interface

Every API-backed surface defines loading, success, empty, error, retry, and disabled
behavior. Generic `Internal server error` text is replaced by a safe next action while
technical details remain server-side.

### 5.3 Preserve work

Validation and recoverable request failures never erase form values. Password values are
cleared only after successful account creation or an explicit security boundary.

### 5.4 Dense but calm

Operational screens favor scan-friendly spacing, clear page headers, compact filters,
and predictable tables. Decorative cards do not wrap whole page sections unnecessarily.

### 5.5 Responsive by workflow

Mobile is not only a smaller desktop layout. Essential actions remain reachable, tables
become readable list rows or stacked details, and navigation becomes an explicit drawer.

## 6. Visual System

Keep the existing library palette but consolidate it in one token layer:

- Ink: `#241D16`
- Muted ink: `#6F6456`
- Paper: `#FFFDF8`
- Canvas: `#F7F2E8`
- Line: `#DED1BA`
- Primary accent: `#A87532`
- Primary dark: `#7B5528`
- Success: `#2F8F5B`
- Warning: `#C78A3B`
- Danger: `#C1452F`
- Informational: `#3A6EA5`

Typography remains readable and intentional: a restrained serif for page headings and a
clean sans-serif for controls, tables, and body copy. Avoid adding a new font dependency
unless it is already available in the project.

Component geometry:

- Use 8-12px radii for controls and repeated items.
- Reserve larger framing only for auth surfaces and genuinely framed tools.
- Keep touch targets at least 44px where practical.
- Use one spacing scale based on 4px increments.
- Preserve visible `:focus-visible` states using the accent ring.

## 6.1 Executable UX Requirements

These requirements are intentionally observable and testable. They do not replace the
functional requirements in FE02, FE07, FE08, FE09, or FE12; they define the UX contract
around those requirements.

- `UX-FE-001`: WHEN a protected route is opened, THE system SHALL show the active route,
  the current role context, and a reachable navigation control appropriate to the viewport.
- `UX-FE-002`: WHEN a user opens the registration page, THE system SHALL show the current
  step, required fields, password guidance, and a clear primary action.
- `UX-FE-003`: WHEN registration fails validation or returns a recoverable API error, THE
  system SHALL preserve all non-secret form values and place actionable feedback beside
  the relevant field or action.
- `UX-FE-004`: WHEN registration succeeds, THE system SHALL move focus to the OTP input,
  show the masked destination email, and show the resend availability state.
- `UX-FE-005`: WHEN a resend request is pending or rate-limited, THE system SHALL disable
  the resend action and show the next available action without allowing duplicate requests.
- `UX-FE-006`: WHEN an API-backed page is loading, empty, successful, or failed, THE system
  SHALL render a state-specific surface without collapsing the page layout.
- `UX-FE-007`: WHEN a user activates a navigation item, THE system SHALL update the route,
  active state, and mobile drawer state together.
- `UX-FE-008`: WHEN an overlay menu or drawer closes, THE system SHALL restore focus to the
  control that opened it unless navigation has moved to another page.
- `NFR-UX-001`: At viewport widths 1440px, 1024px, 768px, and 390px, no primary action,
  label, table value, or dialog control SHALL overlap or become unreachable.
- `NFR-UX-002`: All interactive controls SHALL have a visible keyboard focus state and an
  accessible name; icon-only controls SHALL have a tooltip or accessible label.
- `NFR-UX-003`: Presentation transitions SHALL complete within 200ms where used and SHALL
  respect `prefers-reduced-motion`.

## 6.2 Data and Dependency Boundary

- No database migration or API contract change is part of this UX design.
- Existing API responses are adapted at the existing API/view-model boundary; components
  do not invent business state or duplicate authorization rules.
- Auth tokens, password values, OTP values, SMTP settings, and database credentials never
  enter visual state, screenshots, logs, or user-facing error copy.
- Existing feature specs remain authoritative for borrowing, reservation, fine,
  notification, reporting, and role-management data.

## 7. Slice 1: Shared App Shell

### Navigation

- Make `AppLayout` the single source of truth for protected navigation.
- Remove or isolate legacy `Sidebar` usage rather than maintaining two navigation models.
- Keep role groups and active route state derived from the current location.
- Add a mobile menu button with an accessible drawer or off-canvas panel.
- Close the mobile navigation after route selection and restore focus to the menu button.
- Keep logout as a clear action with a pending state and local fallback.

### Header

- Keep the profile trigger and role label.
- Remove the global search control from the shared header because no cross-system search
  contract is approved. Keep search controls local to pages that own searchable data.
- Do not render empty user names while profile data is loading; show a stable placeholder
  or the stored account identifier.

### Page frame

- Use one page header pattern with title, supporting text, and actions.
- On narrow widths, stack actions below the title and make primary actions full width only
  when necessary.
- Keep content width readable while allowing tables and reports to scroll intentionally.

## 8. Slice 2: Authentication and OTP

### Registration

- Add a visible two-step indicator: `1. Account details` and `2. Verify email`.
- Group fields into logical sections and show password requirements before submission.
- Use inline field errors for format and matching errors; use a page-level notice for API
  failures or account conflicts.
- Keep all non-secret fields after a failed request.
- Disable the submit action while pending and show a determinate label such as
  `Creating account...`.
- Explain that verification requires a real inbox without exposing provider internals.

### OTP verification

- Focus the OTP input when the verification step opens.
- Use a numeric, fixed-length OTP field with a visible example and paste support.
- Show the masked destination email and a short expiry message.
- Add resend cooldown with a visible remaining time and a clear `Resend code` action.
- Offer `Change email` or `Back to account details` without losing safe form data.
- On success, show one clear next action: `Go to sign in`.

### Login and recovery

- Reuse the same field, alert, pending, and link patterns as registration.
- Explain invalid credentials without revealing account existence.
- Ensure the forgot-password path has a clear completion state and does not dead-end.

## 9. Slice 3: Operational Page Patterns

Create or reuse shared primitives instead of page-specific variants:

- `PageHeader`: title, context, actions.
- `StatusNotice`: info, warning, error, and success with optional retry.
- `LoadingBlock`: stable skeleton or progress state that does not shift layout.
- `EmptyState`: explains why the list is empty and offers a relevant next action.
- `DataToolbar`: search, filters, tabs, and reset behavior.
- `DataTable`: desktop table with a mobile row/card presentation.
- `ConfirmAction`: explicit confirmation for approval, return, cancellation, and payment.
- `Toast`: short-lived confirmation for completed actions, paired with inline state when
  the result matters for the current page.

Apply these patterns first to borrowing, reservations, inventory, fines, and reports.
Do not change business calculations or role checks while applying presentation patterns.

## 10. Slice 4: Responsive and Accessibility Pass

- Verify 1440px, 1024px, 768px, and 390px widths for auth and protected shell.
- Verify no text, buttons, table content, or dialogs overlap or overflow unexpectedly.
- Verify keyboard order, visible focus, escape behavior for menus/dialogs, and focus
  restoration after closing overlays.
- Verify labels and accessible names for icon buttons and navigation controls.
- Verify reduced-motion behavior for decorative transitions and skeletons.
- Verify error messages are associated with the relevant form controls.

## 11. Data and Error Handling

- Keep API error normalization in the existing API layer.
- Map known validation, conflict, authorization, and network errors to user-facing copy.
- Keep unknown server failures generic but actionable: retry, check connection, or
  contact a librarian depending on the context.
- Never render raw stack traces, SQL messages, SMTP errors, tokens, or credentials.
- Do not use optimistic updates for borrow, return, reservation, fine, or role actions
  unless rollback behavior is explicitly implemented.

## 12. Acceptance Criteria

Each criterion is a human-verifiable acceptance test, following the playbook's
Given-When-Then guidance:

- `AC-UX-001`: Given a new user with a real inbox, when they submit valid registration
  details, then the UI shows step 2, focuses the OTP field, and retains the masked email.
- `AC-UX-002`: Given invalid details or a recoverable registration error, when submission
  fails, then safe form values remain and the message tells the user what to do next.
- `AC-UX-003`: Given an OTP step, when the user submits an invalid code or requests a
  resend, then the UI shows the result, prevents duplicate resend actions, and preserves
  the verification context.
- `AC-UX-004`: Given a 390px viewport, when a user opens a protected page, then the menu,
  page title, primary action, and page content remain reachable without horizontal overlap.
- `AC-UX-005`: Given a page backed by an API, when it is loading, empty, successful, or
  failed, then the matching state is visible and the layout remains stable.
- `AC-UX-006`: Given a role with restricted navigation, when the user opens the shell,
  then only permitted navigation is visible and the active item matches the URL.
- `AC-UX-007`: Given keyboard-only interaction, when the user moves through navigation,
  forms, menus, dialogs, and actions, then focus is visible and the controls are operable.
- `AC-UX-008`: Given the final diff and test artifacts, when the validation gate runs, then
  no secrets, tokens, or new personal data are introduced and existing API/business
  contracts remain unchanged.

## 13. Verification Plan

- Run targeted frontend tests for each changed surface.
- Run frontend lint after implementation.
- Use the existing browser smoke coverage for direct routes and protected route guards.
- Capture manual checks for auth, shell navigation, mobile layout, and one representative
  borrowing workflow.
- Use `git diff --check` and inspect the final diff before commit.

## 14. Rollout Order

1. Shared tokens and app shell.
2. Auth registration, OTP, login, and recovery.
3. Shared data states and operational page cleanup.
4. Responsive and keyboard QA.
5. Staging deploy and human acceptance review.

## 15. Open Decisions

The clarification gate resolved the initial open decisions on 2026-07-14:

- `DEC-UX-001`: Remove the non-functional global header search. Search remains local to
  the page that owns its data.
- `DEC-UX-002`: `/home` is role-aware: Member sees personal borrowing/reservation
  information; Librarian/Admin sees operational queues and KPI information permitted by
  the existing role contract.
- `DEC-UX-003`: Protected pages use Vietnamese labels consistently. API identifiers,
  source code identifiers, and test names remain English.
