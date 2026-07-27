# Xác thực vỏ danh sách người dùng FE11

Trạng thái: TÍCH HỢP B7 HOÀN THÀNH

Ngày: 2026-07-18

Phạm vi: `TD-026` / `FE11-ENV01`

## Kiểm tra hợp đồng

- `GET /api/users` trả về chính xác `data` và `pagination`; không còn `summary` ở cấp cao nhất.
- Kho dữ liệu không còn thực thi SQL tổng hợp trạng thái/vai trò toàn cục.
- Các thẻ người dùng Quản trị viên và tóm tắt vai trò sử dụng FE12 `GET /api/reports/users` độc lập với danh sách phân trang.
- Ánh xạ FE12 dùng `totals.users`, `usersByStatus.ACTIVE`, `usersByStatus.INACTIVE` và `usersByRole.LIBRARIAN` với giá trị số không mặc định.
- Lỗi danh sách và thống kê duy trì trạng thái riêng, không xóa kết quả thành công còn lại.
- Không thêm endpoint `/api/admin/user-summary` hoặc thay đổi FE12 trên môi trường production.

## Bằng chứng tự động

| Kiểm tra | Kết quả |
| --- | --- |
| Các bộ backend trọng tâm TD-026 | PASS - 95/95 (`userRepository`, `userManagementService`, `userManagementRoutes`) |
| Toàn bộ bộ backend | PASS - 600/600 trên 36 bộ |
| Toàn bộ bộ frontend | PASS - 113/113 |
| Lint frontend | PASS |
| Bản dựng frontend cho môi trường production | PASS; chỉ có cảnh báo kích thước khối Vite hiện hữu |
| Thực thi truy vết | PASS - `node scripts/check-traceability.js --enforce --min=70` |
| Vệ sinh diff | PASS - `git diff --check` |
| Quét bí mật trong tệp đã thay đổi | PASS - không khớp literal khóa/khóa riêng/mật khẩu |

## Các tệp đã thay đổi

- `backend/src/repositories/userRepository.js`
- `backend/tests/userRepository.test.js`
- `backend/tests/userManagementService.test.js`
- `backend/tests/userManagementRoutes.test.js`
- `frontend/src/page/UserManagement.jsx`
- `frontend/test/userManagementFrontend.test.js`
- `docs/api/api-contract.md`
- `.sdd/reviews/fe11-user-list-envelope-validation-2026-07-18.md`

## Ranh giới đánh giá H2

Đánh giá H2 của con người được phê duyệt vào 2026-07-18. Mô hình đọc báo cáo FE12 vẫn là nguồn đã phê duyệt cho các bộ đếm Quản trị viên toàn cục và `TD-027` tiếp tục được tuần tự hóa đến khi lát cắt này được hợp nhất.

## Bằng chứng tích hợp B7

- Đánh giá H3 của con người được phê duyệt vào 2026-07-18.
- PR #34 được hợp nhất vào `main` dưới dạng `411fa25ab60bb38c195307d983392ce362c1d633`.
- Lần chạy CI sau hợp nhất `29652243809` hoàn tất thành công.
- `TD-026` / `FE11-ENV01` hoàn thành đến B7; không có endpoint tóm tắt mới nào được đưa vào.
