# CHANGELOG.md - FE06 Inventory / Book Copy Management

## 2026-07-21 - Inventory Search And Error-State Correction

- Added parameterized cross-field inventory search and combined it with canonical copy filters.
- Changed the UI to apply draft filters explicitly instead of requesting on every keystroke.
- Kept rows, totals, pagination, and status counts aligned and separated backend errors from valid empty results.

## 2026-07-20 - Vietnamese UI localization and typography

- Localized frontend-generated labels, states, accessibility names, and safe error feedback for this feature.
- Preserved API contracts, raw enum values, permissions, business rules, and user-owned catalog/profile data.
- Applied the shared `Be Vietnam Pro` body and `Noto Serif` heading typography contract with Unicode-capable fallbacks.

## 2026-07-19 - Phase 2 Exit Closeout

- feat-inventory-book-copy is accepted within the complete Phase 2 FE01-FE12 reconciliation recorded by PR #40/#41; validation and residual boundaries are consolidated in `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Deferred and future-scope limitations remain explicit and are not widened by this closeout.

## 2026-07-19 - Transactional recheck and source-of-truth correction

- Added RED/GREEN regressions for borrow, reservation, and parent-book state changing after service prechecks.
- Made create and status/deactivation repository mutations enforce locked parent/workflow state before update.
- Added static and live SQL race coverage and a focused `test:sql:fe06` command.
- Reconciled `SPEC.md` v0.4.2 and `CONTEXT.md` with the implemented rowversion, atomic audit, parent guard, required reason, API, and traceability contracts.

## 2026-07-19 - Hybrid inventory reconciliation evidence

- Executed FE06-T001 through FE06-T008 from RED tests through focused and full local validation in `feat/fe06-inventory-reconciliation`.
- Added `BookCopies.Version` rowversion, optimistic `If-Match`, fixed lock order, atomic audit transactions, strict location/reason/pagination validation, and idempotent deactivation.
- Replaced mock inventory ownership with canonical server-backed list/count/copy state and truthful FE07/FE08/stale conflict guidance.
- Updated OpenAPI, ADR/model/schema/migration, traceability, and test evidence.
- Applied the FE06 migration twice and passed the complete 6/6 FE06 SQL suite on disposable SQL Server with cleanup evidence.
- Browser acceptance, cross-feature owner confirmation, and human integration remain open.

## 2026-07-17 - Phase 1 Baseline Approved

- Nhật confirmed the normalized FE06 inventory contract as the Phase 1 baseline; prototype reconciliation implementation remains pending.

## 2026-07-17 - Final Contract Audit

- Made the inventory filter set and copy-status vocabulary explicit in the main flow.
- Replaced non-verifiable lookup-performance wording with database key/filter requirements.

## 2026-07-16 - Planning Human Review Approval

- Nhat approved the FE06 prototype-reconciliation plan and ordered task decomposition.
- Marked `PLAN.md` and `TASKS.md` as `APPROVED`; implementation tasks remain unchecked and have not started.

## 2026-07-16 - Implementation Planning Decomposition

- Replaced placeholder `PLAN.md` and `TASKS.md` with a `READY FOR REVIEW` reconciliation plan for approved SPEC v0.4.0.
- Added ordered RED/GREEN tasks for `BookCopies` rowversion/`If-Match`, same-transaction conflict checks, fixed lock order, active-parent guards, mandatory reasons, atomic audits, and idempotent deactivation.
- Planned replacement of mock frontend ownership with server-backed inventory and mapped all 56 BR/FR/AC requirements to concrete files, dependencies, commands, and review gates.

## 2026-07-16 - Human Review Approval

- Nhat confirmed human review of revision v0.4.0.
- Marked `SPEC.md` and `CONTEXT.md` as `APPROVED` and completed the revision review gate.

## 2026-07-15 - Deterministic Inventory Contract (v0.4.0)

- Required parent `Books.Status = ACTIVE` for FE06 create/manual transitions into `AVAILABLE` while preserving effective availability rules for FE07/FE08 releases.
- Removed physical hard delete; DELETE is deterministic soft deactivation only.
- Replaced all reject/redirect/normalize alternatives with one response policy and made duplicate deactivation idempotent.
- Added SQL `rowversion`/`If-Match`, mandatory same-transaction conflict checks, lock order, and required audit logging.
- Fixed initial create state, location validation, API mutation ownership, and complete traceability without `TBD` test mappings.
- Corrected stale implementation metadata: FE06 prototype routes/layers/tests exist but require v0.4.0 reconciliation before completion.
- Applied the parent-book guard to every FE06-owned transition into `AVAILABLE`, removed the deferred `condition` field, and kept borrower/reservation-owner data outside FE06 responses.
- Defined deterministic inventory pagination: `page = 1`, `limit = 20`, bounds `page >= 1` and `limit = 1..100`, with invalid supplied values rejected rather than normalized.

## 2026-06-25 - Mark implementation as deferred (v0.3.1)

- Added an explicit "Implementation Status: NOT IMPLEMENTED (deferred)" note to the spec header.
- Recorded (Validation Gate finding) that no FE06 backend layer exists yet beyond the `BookCopies`
  model: API endpoints (Section 11) and transition guards/invariants (Section 10.3) are not enforced
  in code; copy status is changed only indirectly by FE07/FE08. A dedicated FE06 layer is deferred.
- No code change; spec remains APPROVED for a future implementation iteration.

## 2026-06-25 - Add Book Copy State Model & Transition Rules

- Bumped `SPEC.md` version 0.2.0 -> 0.3.0; Last Updated 2026-06-25; Status unchanged (APPROVED).
- Added section "10.3 State Model & Transition Rules (Book Copy)" formalizing the lifecycle of `BookCopy.status` over the approved state set (`AVAILABLE`, `BORROWED`, `RESERVED`, `DAMAGED`, `LOST`, `INACTIVE` per Q-FE06-001 / section 10.2). No new states introduced.
- Section gồm 5 phần: (a) sơ đồ Mermaid `stateDiagram-v2` với start/end; (b) bảng mô tả states; (c) bảng Valid Transitions kèm trigger/điều kiện/ai điều khiển (FE06 manual / FE07 / FE08) và truy vết FR/BR; (d) Invalid Transitions cấm tường minh; (e) Invariants (INV-FE06-ST-001..006).
- Phản ánh ranh giới feature: chuyển vào/ra `BORROWED`/`RESERVED` do FE07/FE08 điều khiển, không thao tác thủ công FE06 (FR-FE06-014, BR-FE06-014, Q-FE06-002); manual borrowed/reserved -> available bị chặn, phải qua FE07/FE08 (FR-FE06-015/016); không deactivate copy đang BORROWED/RESERVED; mọi đổi trạng thái ghi AuditLog và cùng commit/rollback.

## 2026-06-25 - Increase Unwanted-Behavior Requirement Coverage

- Bumped `SPEC.md` version 0.1.0 -> 0.2.0; updated Last Updated to 2026-06-25; Status unchanged (APPROVED).
- Added section "7.1 Unwanted Behavior Requirements" with 11 EARS Unwanted-behavior requirements (FR-FE06-011 through FR-FE06-021) derived from existing Alternative Flows, Business Rules, and Edge Cases. No new logic introduced; each new FR traces to its source (AF/BR/EC/NFR/Q).
- Covered abnormal/error branches: missing parent book, empty barcode, unsupported status, manual BORROWED/RESERVED setting, manual availability change on borrowed/reserved copies, duplicate deactivation, concurrent update (optimistic locking), copy+audit transaction rollback, unauthorized access, and invalid location format.
- Raised the share of Unwanted FRs from 3/10 (30%) to 14/21 (~67%).
- Expanded "16. Traceability Matrix" to add missing rows for FR-FE06-008/009/010 and one row per new FR (FR-FE06-011..021), mapping source use cases and test cases ("TBD" where no test case exists yet).

## 2026-06-10

- Created FE06 Inventory / Book Copy Management feature specification structure.
- Established specification files: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md, and CHANGELOG.md.
- Updated current owner and assignment scope after team redistribution: UC25-UC28 and FT26-FT29 owned by Dat.
- Re-aligned FE06 owner with `Library Management (5).xlsx`.
- Defined FE06 as copy-level inventory management separate from FE05 catalog metadata, FE07 borrowing, and FE08 reservation workflows.
- Clarified API contract policy so REST endpoints may stay in SPEC.md unless the team reintroduces a shared API contract file.

## 2026-06-10 - Phase 1 Review Decisions Approved

- Approved open-question decisions from `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Updated `SPEC.md` decision status from draft/proposed/open to approved where applicable.
- Preserved Phase 1 scope controls and deferred future-work items explicitly.
## 2026-07-18 - Navigation label clarification

- Renamed the librarian navigation and page title from “Quản lý kho sách” to “Quản lí kho”.
## 2026-07-22

- Added an explicit per-row copy-management action and verified canonical server filters.
