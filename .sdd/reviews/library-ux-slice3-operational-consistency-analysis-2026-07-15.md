# Library UX Slice 3 Operational Consistency Analysis - 2026-07-15

Status: COMPLETE - DESIGN INPUT ONLY

Branch: `docs/ux-slice3-operational-patterns`

## Scope

Evaluate the approved Slice 3 operational-page UX direction against the current feature specifications, delivery status, routes, shared frontend components, and tests before drafting an executable design.

This analysis does not approve implementation, change business behavior, alter API contracts, modify role checks, or claim completion for FE06 or FE09 frontend work.

## Sources Reviewed

- `.sdd/constitution.md`, `.sdd/shared_context.md`, and project constraints.
- `docs/superpowers/specs/2026-07-14-library-ux-system-design.md`, especially Slice 3, `UX-FE-006`, and `AC-UX-005`.
- FE06, FE07, FE08, FE09, and FE12 `CONTEXT.md`, `SPEC.md`, `PLAN.md`, and `TASKS.md` files.
- `frontend/src/App.jsx`, `frontend/src/utils/appNavigation.js`, shared layout and feedback components, operational pages, API clients, styles, and focused frontend tests.
- Recent integration history through main commit `e9b9c44`.

## Shared Primitive Baseline

| Approved pattern | Current implementation | Consistency result |
| --- | --- | --- |
| `PageHeader` | `AppLayout` renders the `.ph` title, subtitle, and actions region. | Reusable behavior exists but is embedded in the layout instead of having an explicit component contract. |
| `StatusNotice` | `DataNotice` supports info, warning, error, and success states. | Functionally close; naming and retry/action support are not standardized. |
| `LoadingBlock` | Shared `LoadingBlock` exists with an accessible busy label and stable skeleton rows. | Reusable baseline exists. |
| `EmptyState` | Shared `EmptyState` exists, but some pages still render custom empty markup. | Reusable baseline exists but adoption is incomplete and next actions are not standardized. |
| `DataToolbar` | Shared CSS classes exist; each page composes search, tabs, filters, and reset controls independently. | No executable component contract; reset and result-count behavior vary by page. |
| `DataTable` | Shared `.lib-table` styles exist. Tables are page-owned and use horizontal overflow on small screens. | No reusable component contract and no approved mobile row/card presentation. |
| `ConfirmAction` | Shared `Modal` provides focus management and dialog semantics. Each page owns confirmation copy, pending state, and destructive-action rules. | Accessible overlay exists; action safety and pending behavior are inconsistent. |
| `Toast` | Shared `Toast` and `useToast` exist. FE09 defines a second toast implementation. | Shared baseline exists but is not used consistently. |

## Feature Consistency Matrix

| Feature | Spec delivery state | Current UX baseline | Main inconsistencies | Slice 3 boundary |
| --- | --- | --- | --- | --- |
| FE07 Borrowing | `SPEC`, `PLAN`, `TASKS`, and test plan complete. | Five protected pages use `AppLayout`, real FE07 APIs, and most shared feedback primitives. | Toolbars and tables are duplicated; mobile tables only scroll; `BorrowRequestPage` uses custom empty markup and a demo catalog; confirmation buttons lack a shared pending contract. | Best tracer slice. Standardize presentation and interaction states without changing borrowing calculations, eligibility, API calls, or guards. |
| FE08 Reservations | `SPEC` approved; `PLAN`, `TASKS`, and test plan ready for review. | Member and staff pages use `AppLayout`, reservation APIs, tables, filters, modal confirmation, toast, and loading state. | API failures fall back to demo records, so failure and canonical empty states can be obscured; route-level client guards are inconsistent with FE07/FE12; toolbar/table behavior is page-specific. | Standardize visible data states and components. Preserve server authorization and do not redesign queue policy. Client guard changes require separate security scope. |
| FE06 Inventory | `SPEC` approved; `PLAN` and `TASKS` not started. | `InventoryPage` uses `AppLayout`, but `InventoryManagement` is a mock-data prototype with a second page header, Bootstrap/MUI styling, inline styles, and custom modal/table behavior. | No canonical API-backed state flow; duplicated heading; mixed visual systems; no shared loading/error/toast behavior; feature implementation is not spec-driven yet. | Presentation-only adaptation is possible. Do not wire APIs, add copy workflows, or claim FE06 completion until its plan/tasks are approved. |
| FE09 Fines | `SPEC` approved; backend plan/tasks ready for review; `FE09-T012` frontend API alignment is not started. | `FineManagement.jsx` is a large standalone localStorage/sample-data workspace with its own shell, navigation, toast, empty state, table, and styles. | It bypasses `AppLayout`, duplicates shared primitives, contains mixed Vietnamese/English UI copy, and does not use the approved FE09 API workflow. | Shared-shell and presentation cleanup can be designed separately from `FE09-T012`. Do not imply that local calculations or payment state are canonical backend behavior. |
| FE12 Reports | `SPEC`, `PLAN`, `TASKS`, and test plan complete. | Three protected API-backed pages already use `AppLayout`, report guards, shared notices, loading, empty states, charts, filters, and tables. | Repeated date/category toolbar composition; tables have no mobile row/card contract; success notices expose endpoint-oriented wording. | Low-risk final application target after the tracer patterns stabilize. Preserve read-only report semantics and filter contracts. |

## Cross-Cutting Findings

1. The shared foundations are partially implemented already. Slice 3 should consolidate and adopt them instead of replacing the visual system.
2. FE07 is the safest tracer because its business feature and frontend task group are complete and already have focused regression tests.
3. FE06 and FE09 cannot be treated as equivalent to FE07/FE12. Their current screens are prototypes with unresolved spec-delivery or API-alignment work.
4. Inventory and fines are not present in `APP_NAV_GROUPS`; FE09 compensates with a second custom shell. Navigation consistency can be designed, but role authorization behavior must remain unchanged.
5. Shared tables currently rely on horizontal scrolling. This does not yet satisfy the Slice 3 `DataTable` mobile row/card intent; responsive verification remains a later Slice 4 gate.
6. Empty, loading, error, and success copy varies in whether it describes the user outcome or implementation details such as endpoint connectivity.
7. Existing modal focus management is a good base for `ConfirmAction`, but submitting state, duplicate-action prevention, and destructive copy need an explicit contract.

## Recommended Design Boundary

- Build and validate shared operational patterns against FE07 first.
- Apply the stable patterns next to FE08, then FE06, FE09, and FE12 in the approved order, while using presentation-only adapters for incomplete prototypes.
- Treat FE06 API delivery and FE09 frontend API alignment as separately traceable feature work, not hidden work inside the UX slice.
- Keep all business calculations, API request/response shapes, database schema, server authorization, and existing route-role decisions outside this Slice 3 design.
- Add focused frontend contract tests for shared state primitives and each migrated page; reuse the already-passing broader test evidence until implementation begins.

## Design Decision Required

The Slice 3 design must explicitly choose how far to migrate FE06 and FE09:

- Presentation-only migration: adopt the shared shell and operational patterns while preserving the current data source and clearly retaining prototype limitations.
- Deferred migration: complete FE07, FE08, and FE12 now, then revisit FE06/FE09 after their feature-specific planning gates.
- Expanded feature delivery: combine UX work with FE06 implementation and FE09 API alignment. This is not recommended because it crosses approved scope and would require separate specs/plans.

## Analysis Outcome

Verdict: **Slice 3 design may proceed, using FE07 Borrowing as the tracer. FE06 and FE09 require an explicit human-approved boundary before the executable design is written.**
