# TECH_DEBT.md — Library Management System

> Technical-debt register for the project (playbook Ch.12 "Human-Led Refactoring" + Ch.13
> anti-pattern "Context Amnesia"). Each item is a known, intentional gap with an ID, priority,
> source, and status. Resolve in priority order; update `Status` when an item is closed and add a
> link to the closing commit/PR.
>
> Most items below were surfaced by the Validation Gate runs on the CORE features (FE02, FE06–FE09,
> FE11) on 2026-06-25. Items already fixed are listed under "Resolved" for traceability.
>
> Priority: **P1** = should fix before the feature is considered "done" / Full-Spec compliant.
> **P2** = improvement or follow-up; not blocking. **Risk** notes money/security/data sensitivity.

Last Updated: 2026-07-19

> Traceability note: every implemented feature now meets the Validation-Gate L2 bar (FR `@spec`
> coverage ≥ 70%). FE07 and FE08 are at 100%, FE02 was completed to 100%, and the CI workflow now runs
> `npm run trace:enforce` (was report-only) so the gate is enforced on every PR.

---

## Open debt

| ID | Feature | Priority | Description | Source | Status |
| -- | ------- | -------- | ----------- | ------ | ------ |
| TD-004 | FE09 Fine | P2 | Align the **frontend** `FineManagement.jsx` to the new server-side API (`/calculate`, `/me`, `/{id}/collections`, `PATCH /{id}/paid`) and add pagination. Backend endpoints now exist (TD-001..003 resolved); the prototype CRUD routes are kept until the UI is migrated. | VG FE09 P1-5/P2-1 | OPEN |
| TD-005 | FE06 Inventory | P1 (deferred) | Implement the whole FE06 layer: routes + controller + service + repository + validators, with transition guards (FR-FE06-014/015/016), conflict checks, optimistic locking (FR-FE06-018), audit (FR-FE06-010) and tests. Currently only the `BookCopies` model exists. | VG FE06 (spec marked NOT IMPLEMENTED) | DEFERRED |
| TD-012 | FE11 User & Role | P1 | Persist & validate librarian fields `department`/`specialization` (FR-FE11-010/028, API §11). The safe-read slice deliberately omits these unavailable fields and adds no fake null placeholders or schema migration; AC-011 still cannot pass. | VG FE11 P1-3 | OPEN |
| TD-013 | FE11 User & Role | P1 | Resolved in the transactional role slice: duplicate assignment returns `409 USER_ALREADY_HAS_ROLE`; absent revocation returns `404 USER_ROLE_NOT_FOUND`; neither branch mutates or audits. Evidence: `0805363`, `d04ebfb`, `817039d`. | VG FE11 P1-4/5 | RESOLVED |
| TD-014 | FE11 User & Role | P1 | Role mutation has deterministic 404s for missing actor/target/role, and user detail now returns `404 USER_NOT_FOUND`. Remaining update/deactivation and other non-detail action semantics still require reconciliation. | VG FE11 P1-6/7 | PARTIAL |
| TD-015 | FE11 User & Role | P1 | Service-level coverage exists for account setup/resend, transactional role outcomes, strict user list/detail behavior, and the canonical Audit Log boundary. Update/deactivation still need focused tests. | VG FE11 P0-2; FE11 context drift audit | PARTIAL |
| TD-016 | FE11 User & Role | P2 | Account-setup source creation is now atomic and FE10 delivery is intentionally post-commit under ADR-005. Remaining debt: align email max length 100 → 255 (FR-FE11-021) and implement the approved optimistic-concurrency contract for update/deactivation (FR-FE11-023). | VG FE11 P1/P2; ADR-005 | PARTIAL |
| TD-017 | FE11 User & Role | P2 (config risk) | `allowDevUserManagementWithoutLogin` dev-bypass grants ADMIN when `NODE_ENV` is unset — guard against accidental non-production deploys. | VG FE11 L3 | OPEN |
| TD-018 | FE02 Auth | P2 | Add tests for FR-FE02-015 (duplicate email) and FR-FE02-019 (weak password) via the API, and for the OTP verify/reset branches (currently only token branch is tested). | VG FE02 P2 | OPEN |
| TD-019 | FE02 Auth | P2 | IP-based rate limiting (NFR-FE02-SEC-005) is not implemented (only per-user lockout). Confirm whether per-user is sufficient for Phase 1. | VG FE02 P2 | OPEN |
| TD-020 | FE02 Auth | P2 (decision) | Login returns `ACCOUNT_INACTIVE` (403) for existing-but-unverified accounts, which is a mild user-enumeration signal vs NFR-SEC-010. Confirm intended vs generic message. | VG FE02 P2 | OPEN |
| TD-021 | Cross-feature | P2 | **Partial.** API-level integration tests prove the in-scope cross-feature flows and the CI now runs a Playwright browser golden path. Still missing: feature-specific FE11 Admin Console browser acceptance and a SQL-Server-backed integration run (no MSSQL instance in CI). | Integration map; CI run `29639933730` | PARTIAL |
| TD-023 | FE11 Admin Console | P1 | Sidebar omits Permissions and adds Membership Management outside the approved FE11 section list. The permissions view remains unreachable and uses a hardcoded matrix; `/api/admin/permissions` is absent. TD-026 now supplies authoritative FE12 role counts, but the FE11 navigation/matrix boundary remains open. | FE11 context drift audit; FR-FE11-030/032 | IN PROGRESS |
| TD-025 | FE11 Request Management | P1 | List/search/filter/export and pending UI actions exist, but the canonical request-detail endpoint is absent and no focused acceptance test proves terminal requests are immutable at the server boundary. | FE11 context drift audit; FR-FE11-034/035 | OPEN |

---

## Resolved (kept for traceability)

| Feature | What was fixed | Commit |
| ------- | -------------- | ------ |
| FE11 | TD-024: replaced the legacy Audit Log read path with Admin-first canonical filtering, stable SQL pagination, action-aware default-deny redaction, safe frontend rendering, and legacy `404 NOT_FOUND`. PR #33; post-merge CI `29651173195`. | 3c88e43 |
| FE11 | TD-026: restored `GET /api/users` to exactly `{ data, pagination }` and moved global Admin counters to independent FE12 `/api/reports/users` statistics with numeric zero defaults. PR #34; post-merge CI `29652243809`. | 411fa25 |
| FE11 | TD-027: reconciled exactly 22 approved FE11 Test Case/Status cells while preserving requirement text, deferred rows, and whole-feature `DEFERRED` state. PR #35; post-merge CI `29652617587`. | c286cd9 |
| FE11 | TD-022: Admin role actions now use numeric IDs from the authenticated catalog, validate the full diff, assign before revoke, preserve no-op/non-editable roles, and reconcile partial failures. PR #30 merged as `c20d3251`; post-merge CI `29644292781` passed. | c20d3251 |
| FE07 | TD-006: added tests for FR-FE07-019 (no double-borrow on concurrent approve), FR-FE07-016 (unpaid-fine block), FR-FE07-020 (overdue renewal block); tagged FR-FE07-014..022 with `@spec` → 100% traceability | 16e8134 |
| FE07 | TD-008: synced `models/BorrowDetail.js` `allowedValues` + default to the SQL CHECK set (`REQUESTED..DAMAGED`) | 3ae1d82 |
| FE08 | TD-010: `cancelReservation` now returns the current reservation state (`{reservationId, status}`) alongside the 409 (`safeErrors.conflict` + errorHandler carry `details`) | 3ae1d82 |
| FE10 | Added error/edge tests (unsupported type/channel, unknown template, recipient errors, sanitize, audit, empty pending) → 10 tests | 3ae1d82 |
| FE12 | Added error/edge tests (RBAC 401/403 ×3, invalid filter/range, empty inventory, audit) → 7 tests | 3ae1d82 |
| FE07 | TD-007: decided Phase 1 = all-or-nothing borrow policy; aligned SPEC (FR-FE07-003/017/018, AF-FE07-002, new BR-FE07-022) to the existing code; per-item deferred | ba0556c |
| FE08 | TD-011: added cross-feature integration tests proving a held (RESERVED) copy blocks another member's borrow (FR-FE08-023) and an active reservation blocks renewal (FR-FE08-024) | ba0556c |
| FE08 | TD-009: added test for FR-FE08-022 (concurrent queue holds copy once); tagged FR-FE08-011..024 (incl. cross-feature 023/024 in FE07) with `@spec` → 100% traceability | 16e8134 |
| FE02 | AI-001: tagged FR-FE02-015..021 with `@spec` → 100% traceability; CI `trace:enforce` gate enabled | 16e8134 |
| FE09 | TD-001/002/003: server-side fine calculation from `BorrowDetails` (repo + DB transactions, locked dedupe), collection flow (PAID iff fully collected), and audit logs for calculate/collect/paid/waive/cancel. New SPEC §11 endpoints added alongside kept prototype; 11 tests; `@spec` → 100%. | 16e8134 |
| FE11 | RBAC hole: GET user-management routes now require Admin | 7cec354 |
| FE09 | Auth + role guard on fine routes; state-machine guards (terminal immutable, amount immutable, no double-collect); add CANCELLED | c7d245c |
| FE08 | Add NOTIFIED status + ACTIVE→NOTIFIED transition | 1729a38 |
| FE08 | Expire overdue holds → promote next; tolerate notification failure | 4c86fb2 |
| FE07 | OVERDUE clarified as derived (non-persisted) in Phase 1 (spec aligned to code) | 90a7600 |
| FE02 | Block changing password to the current one (FR-FE02-020); auto-unlock after lock window (AF-FE02-003) | 2aa4c44 |

---

## How to use this file

- When you start work that closes an item, set its `Status` to `IN PROGRESS`, then `RESOLVED` with the
  commit hash when merged (move it to the Resolved table).
- When a Validation Gate or review finds new debt, add a new `TD-###` row — do not fix silently.
- Review this file during each Demo/Retro and before the final defense (playbook ceremony calendar).
