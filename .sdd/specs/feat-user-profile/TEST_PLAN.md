# Kế hoạch kiểm thử FE03 - Hồ sơ người dùng

Phiên bản: 0.2.4
Trạng thái: COMPLETE - ĐÃ GHI NHẬN BẰNG CHỨNG CHỐT GIAI ĐOẠN 2
Cập nhật lần cuối: 2026-07-27

Đặc tả nguồn: `.sdd/specs/feat-user-profile/SPEC.md`
ID tính năng: `BR-FE03-*`, `FR-FE03-*`, `AC-FE03-*`
Ánh xạ AC↔kiểm thử có thẩm quyền: Ma trận traceability tại §16 của `SPEC.md` (tệp này mô tả chiến lược, không phải danh sách test case).

---

## 1. Phạm vi kiểm thử

Xem hồ sơ người dùng đã xác thực, cập nhật hồ sơ được phép và hành vi tải avatar.

## 2. Mục tiêu kiểm thử unit

- Xác thực dữ liệu trường có thể chỉnh sửa.
- Chuẩn hóa trường số điện thoại/email/hiển thị nếu được triển khai.
- Xác thực tệp avatar: loại tệp được phép, kích thước, tệp thiếu, an toàn đường dẫn lưu trữ.
- Quy tắc cập nhật hồ sơ không thể thay đổi vai trò, trạng thái thành viên, mật khẩu hoặc trường tài khoản được bảo vệ.
- Sidebar Thành viên bỏ mục/nhóm hồ sơ trùng lặp trong khi menu avatar/tài khoản dùng chung vẫn mở `/profile`.

## 3. Mục tiêu kiểm thử API/integration

- `GET /profile/me`: happy path đã xác thực, lỗi chưa xác thực.
- `PUT /profile/me`: happy path với các trường đã phê duyệt.
- `PUT /profile/me`: từ chối trường bị cấm.
- `PUT /profile/me`: từ chối số điện thoại/tên không hợp lệ, body trống, trường được bảo vệ/không xác định và `avatarUrl` trực tiếp.
- Hồ sơ thiếu: chính xác một hàng hồ sơ trống được tự động tạo và trả về qua DTO thông thường.
- Cập nhật cơ sở dữ liệu hồ sơ/avatar thành công: bắt buộc có audit entry an toàn và loại trừ giá trị cá nhân thô cùng secret tệp/đường dẫn.
- `POST /profile/me/avatar`: happy path.
- `POST /profile/me/avatar`: tệp thiếu, loại không hợp lệ, vượt kích thước, chưa xác thực.

## 4. Luồng nghiệm thu E2E/thủ công

- Người dùng mở hồ sơ.
- Người dùng chỉnh sửa trường được phép và thấy trạng thái đã lưu.
- Người dùng tải avatar thành công.
- Trạng thái lỗi avatar hiển thị và dễ hiểu.
- Người dùng chưa xác thực bị chuyển hướng hoặc chặn.

## 5. Bằng chứng hiện tại

- `backend/tests/profileRoutes.test.js`
- `backend/tests/profileService.test.js`
- `backend/tests/profileRepository.test.js`
- `backend/tests/avatarStorage.test.js`
- `backend/tests/securityRegression.test.js`
- `frontend/test/profileFrontend.test.js`
- `.sdd/reviews/fe03-deterministic-profile-validation-2026-07-19.md`
- Traceability nguồn: FR-FE03 `10/10` đã gắn tag sau đối soát.
- Cổng tập trung mới của đợt đối soát: backend 5 suite / 48 kiểm thử; frontend 3/3.
- Nghiệm thu Playwright CLI cô lập theo exact-diff trên cổng `4185`: tải hợp lệ, loại tệp không hợp lệ,
  tệp vượt kích thước, allowlist PUT chính xác và 0 lỗi/cảnh báo console đều vượt qua. Ảnh chụp bằng chứng:
  `output/playwright/fe03-exact-profile-updated.png`.

## 6. Khoảng trống

- Nghiệm thu UI thủ công cho hồ sơ/avatar vẫn là hạng mục bằng chứng phát hành; phần triển khai và bằng chứng tự động/trình duyệt agent đã hoàn tất.
- `backend/tests/sql/profileConcurrency.sqltest.js` vượt qua 6/6 trên SQL Server disposable, chứng minh việc tuần tự hóa một hàng ở lần xem đầu tiên cùng rollback audit hồ sơ/avatar. Bằng chứng SQL tổng hợp và dọn dẹp được ghi tại `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.

## 7. Lệnh/bằng chứng bắt buộc trước khi merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
