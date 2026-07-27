# Đánh giá tuân thủ phương pháp SDD+ADD Kết hợp

Ngày: 2026-06-22
Người đánh giá: Nhat (có sự hỗ trợ của AI)
Trạng thái: ĐÁNH GIÁ HOÀN THÀNH — HẠNG MỤC HÀNH ĐỘNG CÒN MỞ

## Phạm vi

Đối chiếu hiện trạng dự án `library-management-system` với phương pháp **Phát triển Kết hợp dựa trên Đặc tả và Tác nhân** mô tả trong cẩm nang (LinhNDM, v1.0 — 03/2026). Đánh giá này không đổi logic nghiệp vụ; nó chấm mức độ tuân thủ quy trình và chỉ ra các khoảng trống cần xử lý.

Tham chiếu: [`constitution.md`](../constitution.md), [`../../.agents/AGENTS.md`](../../.agents/AGENTS.md), [`../../.agents/CLAUDE.md`](../../.agents/CLAUDE.md).

## Tổng kết

Mức độ tuân thủ tổng thể: **~8/10**. Nền tảng tài liệu SDD rất mạnh và gần như khớp mẫu chương 13.4 của sách. Rủi ro chính là **Sai lệch Đặc tả-Mã** (ch. 7.3) và **Mất ngữ cảnh** (ch. 13.6) ở khâu nối tài liệu ↔ mã.

## Đối chiếu theo trụ cột playbook

| Trụ cột (chương) | Hiện trạng | Đánh giá |
|---|---|---|
| Hiến chương 3 lớp (7.1, 13.5) | `.sdd/constitution.md`: Quy tắc Lõi, Kiến trúc, Sử dụng AI, DoD, cổng CI | ✓ Đạt |
| AGENTS.md = hiến pháp (4.1) | 14 mục đầy đủ: Vai trò, Thứ tự đọc, Nguồn chân lý, Kiểm soát phạm vi, Bảo mật, DoD | ✓ Đạt |
| CLAUDE.md = bộ nhớ ngữ cảnh (4.2) | Mở rộng AGENTS.md đúng phân cấp | ✓ Đạt (đã cập nhật 2026-06-22) |
| Đặc tả có thể thực thi + 8 thành phần + EARS (5) | `SPEC.md` chuẩn Đặc tả Đầy đủ, FR dạng `WHEN…SHALL…`, BR có ID ổn định, Ngoài phạm vi tường minh, Mức phạm vi | ✓ Đạt |
| Quy trình 5 pha (6) | Mỗi tính năng đủ `CONTEXT → SPEC → PLAN → TASKS → CHANGELOG` | ✓ Đạt |
| Làm rõ trước (7.2) | SPEC có Câu hỏi đã giải quyết + gói đánh giá 2026-06-10 | ✓ Đạt |
| Cổng nhất quán / Đánh giá (7.3) | `.sdd/reviews/` có tổng kết, độ bao phủ, đánh giá khoảng trống | ◑ Một phần (thiếu kiểm tra tự động mã↔đặc tả — xem AI-001) |
| Khám phá song song → ADR (7.4) | `.sdd/rfcs/ADR-001..003` | ✓ Đạt |
| Ma trận truy vết (5, 8) | Ma trận AC→FR→BR→Kiểm thử trong SPEC | ◑ Có trong tài liệu, trước đánh giá này mã chưa gắn thẻ |
| CI là cổng nền tảng (13–14) | `.github/workflows/ci.yml`: cài đặt + kiểm thử + lint + dựng + tình trạng | ✓ Đạt |
| Ranh giới tầng (hiến chương L2) | Backend tách `controller/service/repository/model` | ✓ Đạt |
| Hook trước commit (4.1, 11.4) | Không có `.husky`/`.githooks` | ✗ Thiếu (xem AI-003) |

## Trạng thái SPEC / PLAN / TASKS (12 tính năng)

| Tính năng | Chủ sở hữu | SPEC | PLAN | TASKS | Có mã? |
|---|---|---|---|---|---|
| FE02 feat-auth | Dat | APPROVED | READY FOR REVIEW | READY FOR REVIEW | Có |
| FE07 feat-borrowing-management | Nhat | APPROVED | READY FOR REVIEW | READY FOR REVIEW | Có |
| FE08 feat-reservation-management | Nhat | APPROVED | READY FOR REVIEW | READY FOR REVIEW | Có |
| FE10 feat-notification-management | Nhat | APPROVED | READY FOR REVIEW | READY FOR REVIEW | Có |
| FE12 feat-reporting-statistics | Nhat | APPROVED | READY FOR REVIEW | READY FOR REVIEW | Có |
| FE05 feat-book-management | Dung | APPROVED | NOT STARTED | NOT STARTED | Có nguyên mẫu ⚠ |
| FE09 feat-fine-management | Dung | APPROVED | NOT STARTED | NOT STARTED | Có nguyên mẫu ⚠ |
| FE01 feat-public-browse | Dung | APPROVED | NOT STARTED | NOT STARTED | Một phần |
| FE03 feat-user-profile | Dat | APPROVED | NOT STARTED | NOT STARTED | Một phần |
| FE04 feat-membership-management | Dat | APPROVED | NOT STARTED | NOT STARTED | Một phần |
| FE06 feat-inventory-book-copy | Dat | APPROVED | NOT STARTED | NOT STARTED | Một phần |
| FE11 feat-user-role-management | Dung | APPROVED | NOT STARTED | NOT STARTED | Một phần |

## Phát hiện (hạng mục hành động)

### AI-001 — Thiếu truy vết mã ↔ đặc tả (mức độ: CAO)
Trước đánh giá này, `git grep` các ID `BR-/FR-/AC-` trong `backend/` và `frontend/` cho **0 kết quả**. Ma trận truy vết trong SPEC.md không được xác minh ở phía mã.

**Đã xử lý một phần:**
- Thêm trình kiểm tra [`scripts/check-traceability.js`](../../scripts/check-traceability.js) đo độ bao phủ FR có thẻ `@spec` trong nguồn; chạy ở chế độ báo cáo trong CI (`npm run trace`), có `npm run trace:enforce` để bật cổng ≥70% khi sẵn sàng.
- Gắn thẻ `@spec` cho 4 tính năng của Nhật (FE07, FE08, FE10, FE12) ở tầng bộ điều khiển → **độ bao phủ FR 100%** cho cả 4.

**Còn lại:** FE02 (xác thực) đang 0% thẻ dù đã triển khai; các chủ sở hữu khác cần gắn thẻ cho phần của mình; cân nhắc gắn thêm thẻ `BR-` ở tầng dịch vụ (nơi thực thi quy tắc nghiệp vụ) ngoài `FR-` ở bộ điều khiển.

### AI-002 — Mất ngữ cảnh: CLAUDE.md lỗi thời (mức độ: TRUNG BÌNH)
`CLAUDE.md` trước đây mô tả "khung backend, xác thực là phần giữ chỗ, PLAN/TASKS chưa bắt đầu, Tuần 3" trong khi mã đã đi xa hơn nhiều qua các PR #7/#10/#11.

**Đã xử lý:** cập nhật `CLAUDE.md` lên v0.2.0 — Phát triển Lõi Giai đoạn 2, liệt kê đúng 5 tính năng đã triển khai và 7 tính năng NOT STARTED.

**Khuyến nghị:** áp cách sửa phản mẫu của ch.13.6 — cập nhật AGENTS.md/CLAUDE.md **trong cùng PR** với mã thay đổi hành vi.

### AI-003 — Thiếu hook trước commit cục bộ (mức độ: TRUNG BÌNH)
Có CI từ xa nhưng chưa có cổng chặn cục bộ (lint + quét bí mật + kiểm thử) theo Danh sách kiểm tra 16.6. Khuyến nghị thêm `husky` + `lint-staged` chạy lint/kiểm thử nhanh và quét bí mật trước commit.

### AI-004 — Trạng thái PLAN/TASKS không khớp mã thực (mức độ: TRUNG BÌNH)
Sách FE05 và tiền phạt FE09 có mã nguyên mẫu (bộ điều khiển + trang frontend) trong khi PLAN/TASKS = NOT STARTED → Sai lệch Im lặng/Hồi quy (ch.7.3). Cần hoặc (a) phân rã PLAN/TASKS rồi đánh dấu đúng trạng thái, hoặc (b) ghi rõ mã đó là nguyên mẫu chưa dựa trên đặc tả.

### AI-005 — Tài liệu lõi vẫn DRAFT (mức độ: THẤP)
`constitution.md` và `AGENTS.md` vẫn `Status: DRAFT / v0.1.0` dù đã dùng để chốt nhiều SPEC APPROVED. Cân nhắc "khóa + tạo phiên bản" theo nghi thức ch.5.5.3.

## Điểm mạnh cần giữ
- Bộ tài liệu `.sdd/` + `.agents/` là một ví dụ mẫu mực của khung Kết hợp.
- SPEC.md (đặc biệt FE02, FE07) chất lượng cao: EARS, BR có ID ổn định, Ngoài phạm vi, Câu hỏi đã giải quyết, Ma trận truy vết.
- Cổng nền tảng CI đã hoạt động; kiến trúc backend phân lớp rõ ràng.

## Đề xuất thứ tự xử lý
1. (AI-001) Các chủ sở hữu còn lại gắn `@spec` cho mã của mình; bật `trace:enforce` khi đủ phủ.
2. (AI-004) Đồng bộ trạng thái PLAN/TASKS của FE05/FE09 với mã.
3. (AI-003) Thêm hook trước commit.
4. (AI-005) Khóa + tăng phiên bản tài liệu lõi.
