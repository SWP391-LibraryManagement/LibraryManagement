# CHANGELOG.md - FE06 Inventory / Book Copy Management

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
