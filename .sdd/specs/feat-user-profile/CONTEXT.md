# CONTEXT.md - Hồ sơ người dùng FE03

# Phiên bản: 0.2.1

# Trạng thái: APPROVED - BASELINE 2026-07-17

# Chủ sở hữu: Dat

# Cập nhật lần cuối: 2026-07-19

# Thư mục tính năng: `.sdd/specs/feat-user-profile/`

---

## 1. Mục đích tính năng

Hồ sơ người dùng cho phép Thành viên và Thủ thư đã xác thực xem và duy trì thông tin hồ sơ cá nhân của mình.

Tính năng này phải tách biệt ba nội dung:

- Thông tin xác thực tài khoản và xác thực thuộc FE02.
- Dữ liệu hồ sơ cá nhân thuộc FE03.
- Quản lý người dùng/vai trò mang tính quản trị thuộc FE11.

FE03 là tính năng Đặc tả tiêu chuẩn vì chứa dữ liệu cá nhân do người dùng sở hữu và yêu cầu xác thực ở server, nhưng không quản lý quy tắc xác thực hoặc phân quyền.

---

## 2. Quy trình thực tế

Quy trình hồ sơ điển hình:

1. Thành viên hoặc Thủ thư đăng nhập.
2. Người dùng mở trang hồ sơ của mình.
3. Hệ thống tải thông tin tóm tắt tài khoản và chi tiết hồ sơ.
4. Người dùng chỉnh sửa các trường hồ sơ được phép.
5. Hệ thống xác thực dữ liệu đã gửi.
6. Hệ thống lưu thay đổi hồ sơ.
7. Hệ thống giữ các trường tài khoản được bảo vệ như vai trò, trạng thái và mật khẩu ngoài phạm vi thay đổi của FE03.

---

## 3. Ranh giới tính năng

FE03 bao gồm:

- Xem hồ sơ của chính mình.
- Cập nhật các trường hồ sơ được phép của chính mình.
- Duy trì các trường hồ sơ như họ tên, địa chỉ, ngày sinh, avatar và số điện thoại khi được phê duyệt.
- Tải ảnh avatar từ thiết bị cục bộ của người dùng khi việc tải avatar được phê duyệt.
- Xác thực dữ liệu hồ sơ ở server.

FE03 không bao gồm:

- Đăng nhập, đăng xuất, thay đổi mật khẩu, đặt lại mật khẩu hoặc xác minh email. Các nội dung này thuộc FE02.
- Tạo, hủy kích hoạt hoặc gán vai trò cho người dùng. Nội dung đó thuộc FE11.
- Nộp và phê duyệt đơn thành viên. Nội dung đó thuộc FE04.
- Lịch sử mượn. Nội dung đó thuộc FE07.
- Lịch sử tiền phạt. Nội dung đó thuộc FE09.

---

## 4. Ghi chú về mô hình dữ liệu hiện tại

Script SQL hiện tại bao gồm:

- `Users(UserId, Username, Email, PasswordHash, Phone, Status, CreatedAt)`
- `UserProfiles(ProfileId, UserId, FullName, Address, DateOfBirth, AvatarUrl)`
- `UserRoles(UserId, RoleId)`

Các vấn đề cần rà soát:

- `Phone` hiện nằm trong `Users`, trong khi đa số trường hồ sơ nằm trong `UserProfiles`; nhóm cần quyết định FE03 có thể cập nhật số điện thoại hay không.
- Email có thể là trường định danh tài khoản và có thể yêu cầu xác minh FE02 trước khi thay đổi.
- Tải/lưu avatar hiện được đề xuất trong bản sửa đổi Giai đoạn 1. Phương án ưu tiên là lưu tệp đã tải lên ở backend như static asset và lưu public path được tạo vào `UserProfiles.AvatarUrl`.
- Thành viên và Thủ thư chỉ được chỉnh sửa hồ sơ của mình, trừ khi FE11 cấp rõ ràng quyền quản lý hồ sơ của quản trị viên.
- Dữ liệu hồ sơ là thông tin cá nhân và không được lộ cho người dùng khác.

Những nội dung này không chặn việc soạn thảo, nhưng phải được giải quyết trước khi triển khai.

---

## 5. Các use case chính từ bảng phân công

| ID use case | Tên use case | Chủ sở hữu |
| ----------- | ------------- | ----- |
| UC11 | Xem hồ sơ | Dat |
| UC12 | Cập nhật hồ sơ | Dat |

---

## 6. Các kiểm thử tính năng từ bảng phân công

| ID kiểm thử | Tên kiểm thử | Chủ sở hữu |
| ------- | --------- | ----- |
| FT12 | Xem hồ sơ | Dat |
| FT13 | Cập nhật hồ sơ | Dat |

---

## 7. Rủi ro chính

- Người dùng có thể truy cập hồ sơ cá nhân của người khác nếu thiếu kiểm tra phân quyền.
- Cập nhật hồ sơ có thể vô tình thay đổi thông tin xác thực tài khoản, vai trò hoặc trạng thái thành viên.
- Dữ liệu số điện thoại/ngày tháng không hợp lệ hoặc thay đổi trực tiếp `avatarUrl` có thể vượt qua ranh giới trường được phê duyệt và ranh giới tải tệp nếu server không từ chối.
- Tệp avatar được tải lên có thể tạo rủi ro bảo mật nếu loại tệp, kích thước, đường dẫn hoặc nội dung thực thi không được xác thực.
- Hành vi thay đổi email có thể xung đột với xác minh FE02.
- Response hồ sơ có thể làm lộ hash mật khẩu hoặc dữ liệu vai trò nếu DTO không được kiểm soát.

---

## 8. Phụ thuộc

| Phụ thuộc | Lý do quan trọng |
| ---------- | -------------- |
| Xác thực FE02 | Cung cấp danh tính người dùng đã xác thực hiện tại và các luồng thông tin xác thực mật khẩu/email. |
| Quản lý người dùng và vai trò FE11 | Sở hữu trạng thái và vai trò người dùng do quản trị viên kiểm soát. |
| Quản lý thành viên FE04 | Sở hữu trạng thái thành viên, có thể được hiển thị nhưng không được thay đổi tại đây. |
| Cơ sở dữ liệu SQL Server | Lưu `Users` và `UserProfiles`. |

---

## 9. Câu hỏi đã giải quyết

| ID | Quyết định đã phê duyệt | Nguồn | Trạng thái |
| -- | ----------------- | ------ | ------ |
| Q-FE03-001 | FE03 có thể cập nhật `Users.Phone`. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE03-002 | FE03 không thể cập nhật email; thay đổi email thực hiện qua xác minh FE02. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE03-003 | Bản ghi hồ sơ thiếu được tự động tạo ở lần xem đầu tiên. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE03-004 | Giai đoạn 1 hỗ trợ tải tệp avatar cục bộ với `avatarUrl` do backend tạo, lưu trữ cục bộ do server quản lý, JPG/JPEG/PNG/WebP và giới hạn 2 MB. | Quyết định người dùng 2026-06-25 | APPROVED |
| Q-FE03-005 | Cập nhật hồ sơ ghi log audit. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE03-006 | Hồ sơ thiếu được tự động tạo, trường được bảo vệ/không xác định bị từ chối, trạng thái chỉ đọc và thay đổi avatarUrl chỉ thực hiện qua tải tệp. | Chuẩn hóa đặc tả 2026-07-17 | APPROVED |

## 9.1 Ghi chú sửa đổi về tải avatar

- Người dùng có thể tải ảnh avatar của chính mình từ máy cục bộ.
- Việc tải tệp phải được xác thực và chỉ thuộc phạm vi của người dùng hiện tại.
- Frontend gửi request multipart form-data chứa một tệp ảnh.
- Backend xác thực tệp trước khi lưu.
- Backend chỉ lưu đường dẫn/URL được tạo trong `UserProfiles.AvatarUrl`; không bao giờ được lưu đường dẫn máy cục bộ gốc.
- DTO response hồ sơ hiện có tiếp tục trả về `avatarUrl` để hiển thị.

## 10. Ghi chú cho việc triển khai sau này

- Không triển khai cho đến khi `SPEC.md` được rà soát và phê duyệt.
- `PLAN.md` và `TASKS.md` giữ `NOT STARTED` cho đến khi được phê duyệt.
- Không trả về `PasswordHash`.
- Không cho phép FE03 thay đổi vai trò, trạng thái hoặc mật khẩu.
- Xác thực mọi trường hồ sơ ở server.
- Giữ quyền truy cập hồ sơ trong phạm vi người dùng đã xác thực, trừ khi đặc tả được thay đổi rõ ràng.
