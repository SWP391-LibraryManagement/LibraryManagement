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
| TD-005 | FE06 Inventory | P1 | The FE06 routes, controller, service, repository, validators, transition/conflict guards, rowversion `If-Match`, transactional audit, frontend workflow, and live SQL tests are implemented. PR #40 CI run `29683107536` passes on current integrated head `199fa36`; final H2/human integration acceptance remains. | FE06 reconciliation validation; FE06 PLAN/TASKS; Live SQL review; PR #40 | IN REVIEW |
| TD-012 | FE11 User & Role | P1 | Nullable 100-character `department`/`specialization` columns and role-gated create/read/update persistence are implemented with schema/model/API tests. PR #40 CI run `29683107536` passes on current integrated head `199fa36`; H2/H3 and final closeout remain. | FE11 Wave A validation; FE11 Finalization Batch; PR #40 | IN REVIEW |
| TD-013 | FE11 User & Role | P1 | Resolved in the transactional role slice: duplicate assignment returns `409 USER_ALREADY_HAS_ROLE`; absent revocation returns `404 USER_ROLE_NOT_FOUND`; neither branch mutates or audits. Evidence: `0805363`, `d04ebfb`, `817039d`. | VG FE11 P1-4/5 | RESOLVED |
| TD-014 | FE11 User & Role | P1 | Create/resend/update/deactivation actor, target, lifecycle, pending-activation, rollback, and FE07 serialization outcomes are implemented locally and validated. H2/H3 and integration evidence remain. | FE11 Wave A validation; FE11 Finalization Batch | IN REVIEW |
| TD-015 | FE11 User & Role | P1 | Focused lifecycle repository/service/route rollback evidence and Wave B request/browser acceptance are implemented; full automated regression and PR #40 CI run `29683107536` on `199fa36` are green. H2/H3 and human acceptance remain. | FE11 Wave A/Wave B validations; PR #40 | IN REVIEW |
| TD-016 | FE11 User & Role | P2 | Canonical 255-character user/notification email persistence and effective `COALESCE(UpdatedAt, CreatedAt)` concurrency are implemented; the idempotent migration passed the disposable SQL Server gate twice. Integration closeout remains. | FE11 Wave A validation; ADR-005; ADR-002; Live SQL review | IN REVIEW |
| TD-017 | FE11 User & Role | P2 (config risk) | The implicit Vite development Admin bypass is removed; every mode now requires stored authenticated Admin state, with frontend and isolated browser regression evidence. Integration closeout remains. | FE11 Wave A/Wave B validations | IN REVIEW |
| TD-021 | Cross-feature | P2 | Disposable SQL Server validation passes 9/9 suites and 69/69 tests with two-pass migrations and cleanup; the full Playwright suite passes 4/4 on isolated ports `4185/3101`. Final H3, merge, and post-merge `main` CI remain pending. | Full-reconciliation Live SQL review; FE08/FE11 validation; PR #40 | PARTIAL |
| TD-025 | FE11 Request Management | P1 | Canonical Admin request list/detail, server pagination, safe all-filtered-row CSV, FE07-owned terminal actions, Dashboard evidence, and focused browser acceptance are implemented. `FE11-REQ01..REQ03` are H2-ready and PR #40 CI run `29683107536` passes on `199fa36`; H2/H3 and final closeout remain. | FE11 Wave B validation; FR-FE11-031/034/035; Finalization Batch; PR #40 | IN REVIEW |

---

## Resolved (kept for traceability)

| Feature | What was fixed | Commit |
| ------- | -------------- | ------ |
| FE08 | TD-028: approved Option A; added member-only `GET /api/reservations/candidates` with the six-field redacted projection, active-book `BORROWED`/`RESERVED` filtering, server search/pagination, and parameterized SQL; removed `DEMO_RESERVABLE`; focused/full backend, frontend, SQL, traceability, safety, Playwright, and PR CI gates pass. Final H3 remains separate. | `ed7376f` / PR #40; FE08 candidate validation review |
| FE09 | TD-004: moved Fine Management search, status filtering, and pagination onto the canonical server query/envelope; removed browser-side list filtering/slicing; added query-builder, source, responsive, and Playwright L4 regressions. | dfe45ae / PR #40 |
| FE02 | TD-018: added API regressions for duplicate registration and weak-password no-mutation behavior plus canonical `{ email, otp }` verification/reset consumption. Focused auth validation passes 30/30. | 0040e0f / PR #40 |
| FE02 | TD-019: closed as an approved Phase 1 policy decision. `Q-FE02-005`, `BR-FE02-008`, and `NFR-FE02-SEC-005` explicitly require known-account lockout and state that IP-wide limiting is not implemented. | 0040e0f / PR #40 |
| FE02 | TD-020: inactive-account login preserves its internal audit event but now returns the same public `401 INVALID_CREDENTIALS` envelope as an unknown email, satisfying `BR-FE02-007` and `NFR-FE02-SEC-010`. | 0040e0f / PR #40 |
| FE11 | TD-023: aligned the Admin Console to the exact eight-entry sidebar, added Admin-only `GET /api/admin/permissions` with the canonical three-role/15-permission policy, and composed independent FE12 role counts with derived read-only coverage/matrix state. PR #37; post-merge CI `29655548150`. | 356130e |
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
| FE09 | TD-001/002/003: server-side fine calculation from `BorrowDetails` (repo + DB transactions, locked dedupe), collection flow (PAID iff fully collected), and audit logs for calculate/collect/paid/waive/cancel. New SPEC §11 endpoints were added; the later v0.4.1 boundary removes legacy create/update/delete mutations; `@spec` remains 100%. | 16e8134 |
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
