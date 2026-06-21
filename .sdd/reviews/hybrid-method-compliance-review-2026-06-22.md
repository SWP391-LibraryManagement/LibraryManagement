# Hybrid SDD+ADD Method Compliance Review

Date: 2026-06-22
Reviewer: Nhat (with AI assistance)
Status: REVIEW COMPLETE — ACTION ITEMS OPEN

## Scope

Đối chiếu hiện trạng dự án `library-management-system` với phương pháp **Hybrid Spec-Driven & Agent-Driven Development** mô tả trong playbook (LinhNDM, v1.0 — 03/2026). Review này không đổi business logic; nó chấm mức độ tuân thủ quy trình và chỉ ra các khoảng trống cần xử lý.

Tham chiếu: [`constitution.md`](../constitution.md), [`../../.agents/AGENTS.md`](../../.agents/AGENTS.md), [`../../.agents/CLAUDE.md`](../../.agents/CLAUDE.md).

## Tổng kết

Mức độ tuân thủ tổng thể: **~8/10**. Nền tảng tài liệu SDD rất mạnh và gần như khớp template chương 13.4 của sách. Rủi ro chính là **Spec-Code Drift** (ch. 7.3) và **Context Amnesia** (ch. 13.6) ở khâu nối tài liệu ↔ code.

## Đối chiếu theo trụ cột playbook

| Trụ cột (chương) | Hiện trạng | Đánh giá |
|---|---|---|
| Constitution 3 lớp (7.1, 13.5) | `.sdd/constitution.md`: Core Rules, Architectural, AI Usage, DoD, CI gate | ✓ Đạt |
| AGENTS.md = hiến pháp (4.1) | 14 mục đầy đủ: Role, Reading Order, Source of Truth, Scope Control, Security, DoD | ✓ Đạt |
| CLAUDE.md = bộ nhớ ngữ cảnh (4.2) | Extend AGENTS.md đúng hierarchy | ✓ Đạt (đã cập nhật 2026-06-22) |
| Executable Spec + 8 thành phần + EARS (5) | `SPEC.md` chuẩn Full Spec, FR dạng `WHEN…SHALL…`, BR có ID ổn định, Out of Scope tường minh, Scope Level | ✓ Đạt |
| Quy trình 5 pha (6) | Mỗi feature đủ `CONTEXT → SPEC → PLAN → TASKS → CHANGELOG` | ✓ Đạt |
| Clarification-First (7.2) | SPEC có Resolved Questions + review packet 2026-06-10 | ✓ Đạt |
| Consistency Gate / Reviews (7.3) | `.sdd/reviews/` có closeout, coverage, gap review | ◑ Một phần (thiếu kiểm tự động code↔spec — xem AI-001) |
| Parallel Exploration → ADR (7.4) | `.sdd/rfcs/ADR-001..003` | ✓ Đạt |
| Traceability Matrix (5, 8) | Ma trận AC→FR→BR→Test trong SPEC | ◑ Có trong tài liệu, trước review này code chưa gắn tag |
| CI là foundation gate (13–14) | `.github/workflows/ci.yml`: install + test + lint + build + health | ✓ Đạt |
| Layer Boundaries (constitution L2) | Backend tách `controller/service/repository/model` | ✓ Đạt |
| Pre-commit hook (4.1, 11.4) | Không có `.husky`/`.githooks` | ✗ Thiếu (xem AI-003) |

## Trạng thái SPEC / PLAN / TASKS (12 feature)

| Feature | Owner | SPEC | PLAN | TASKS | Có code? |
|---|---|---|---|---|---|
| FE02 feat-auth | Dat | APPROVED | READY FOR REVIEW | READY FOR REVIEW | Có |
| FE07 feat-borrowing-management | Nhat | APPROVED | READY FOR REVIEW | READY FOR REVIEW | Có |
| FE08 feat-reservation-management | Nhat | APPROVED | READY FOR REVIEW | READY FOR REVIEW | Có |
| FE10 feat-notification-management | Nhat | APPROVED | READY FOR REVIEW | READY FOR REVIEW | Có |
| FE12 feat-reporting-statistics | Nhat | APPROVED | READY FOR REVIEW | READY FOR REVIEW | Có |
| FE05 feat-book-management | Dung | APPROVED | NOT STARTED | NOT STARTED | Có prototype ⚠ |
| FE09 feat-fine-management | Dung | APPROVED | NOT STARTED | NOT STARTED | Có prototype ⚠ |
| FE01 feat-public-browse | Dung | APPROVED | NOT STARTED | NOT STARTED | Một phần |
| FE03 feat-user-profile | Dat | APPROVED | NOT STARTED | NOT STARTED | Một phần |
| FE04 feat-membership-management | Dat | APPROVED | NOT STARTED | NOT STARTED | Một phần |
| FE06 feat-inventory-book-copy | Dat | APPROVED | NOT STARTED | NOT STARTED | Một phần |
| FE11 feat-user-role-management | Dung | APPROVED | NOT STARTED | NOT STARTED | Một phần |

## Findings (action items)

### AI-001 — Thiếu traceability code ↔ spec (mức độ: CAO)
Trước review này, `git grep` các ID `BR-/FR-/AC-` trong `backend/` và `frontend/` cho **0 kết quả**. Ma trận traceability trong SPEC.md không được verify ở phía code.

**Đã xử lý một phần:**
- Thêm checker [`scripts/check-traceability.js`](../../scripts/check-traceability.js) đo coverage FR có tag `@spec` trong source; chạy ở chế độ report trong CI (`npm run trace`), có `npm run trace:enforce` để bật gate ≥70% khi sẵn sàng.
- Gắn tag `@spec` cho 4 feature của Nhật (FE07, FE08, FE10, FE12) ở tầng controller → **coverage FR 100%** cho cả 4.

**Còn lại:** FE02 (auth) đang 0% tag dù đã implement; các owner khác cần gắn tag cho phần của mình; cân nhắc gắn thêm tag `BR-` ở tầng service (nơi enforce business rule) ngoài `FR-` ở controller.

### AI-002 — Context Amnesia: CLAUDE.md lỗi thời (mức độ: TRUNG BÌNH)
`CLAUDE.md` trước đây mô tả "backend skeleton, auth là placeholder, PLAN/TASKS chưa start, Week 3" trong khi code đã đi xa hơn nhiều qua các PR #7/#10/#11.

**Đã xử lý:** cập nhật `CLAUDE.md` lên v0.2.0 — Phase 2 Core Development, liệt kê đúng 5 feature đã implement và 7 feature NOT STARTED.

**Khuyến nghị:** áp anti-pattern fix của ch.13.6 — cập nhật AGENTS.md/CLAUDE.md **trong cùng PR** với code thay đổi hành vi.

### AI-003 — Thiếu pre-commit hook local (mức độ: TRUNG BÌNH)
Có CI từ xa nhưng chưa có cổng chặn local (lint + secret-scan + test) theo Checklist 16.6. Khuyến nghị thêm `husky` + `lint-staged` chạy lint/test nhanh và quét secret trước commit.

### AI-004 — Trạng thái PLAN/TASKS không khớp code thực (mức độ: TRUNG BÌNH)
FE05 book và FE09 fine có code prototype (controller + frontend page) trong khi PLAN/TASKS = NOT STARTED → Silent/Regression Drift (ch.7.3). Cần hoặc (a) decompose PLAN/TASKS rồi đánh dấu đúng trạng thái, hoặc (b) ghi rõ code đó là prototype chưa spec-driven.

### AI-005 — Tài liệu lõi vẫn DRAFT (mức độ: THẤP)
`constitution.md` và `AGENTS.md` vẫn `Status: DRAFT / v0.1.0` dù đã dùng để chốt nhiều SPEC APPROVED. Cân nhắc "lock + version" theo nghi thức ch.5.5.3.

## Điểm mạnh cần giữ
- Bộ tài liệu `.sdd/` + `.agents/` là một ví dụ mẫu mực của Hybrid framework.
- SPEC.md (đặc biệt FE02, FE07) chất lượng cao: EARS, BR có ID ổn định, Out of Scope, Resolved Questions, Traceability Matrix.
- CI foundation gate đã hoạt động; kiến trúc backend phân lớp rõ ràng.

## Đề xuất thứ tự xử lý
1. (AI-001) Các owner còn lại gắn `@spec` cho code của mình; bật `trace:enforce` khi đủ phủ.
2. (AI-004) Đồng bộ trạng thái PLAN/TASKS của FE05/FE09 với code.
3. (AI-003) Thêm pre-commit hook.
4. (AI-005) Lock + bump version tài liệu lõi.
