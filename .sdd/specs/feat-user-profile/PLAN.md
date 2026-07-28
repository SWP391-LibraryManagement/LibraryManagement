# PLAN.md - Hồ sơ người dùng FE03

# Phiên bản: 0.2.1

# Trạng thái: COMPLETE - ĐÃ GHI NHẬN BẰNG CHỨNG CHỐT GIAI ĐOẠN 2

# Chủ sở hữu: Dat

# Cập nhật lần cuối: 2026-07-19

---

## 1. Mục tiêu triển khai

Triển khai API backend cho Hồ sơ người dùng FE03 theo `SPEC.md`.

Backend phải hỗ trợ:

- `GET /api/profile/me`
- `PUT /api/profile/me`
- `POST /api/profile/me/avatar`
- DTO response hồ sơ an toàn
- xác thực dữ liệu ở server
- xác thực tệp avatar ở server
- từ chối trường được bảo vệ
- tự động tạo bản ghi `UserProfiles` còn thiếu
- lưu tệp avatar đã tải lên trong thư mục static uploads do backend kiểm soát
- bắt buộc ghi log audit an toàn cho cập nhật trường hồ sơ và avatar thành công

Kế hoạch này bao phủ công việc backend và phần kết nối frontend tối thiểu cần thiết để người dùng tải avatar từ thiết bị của mình.

---

## 2. Ánh xạ đặc tả

| Khu vực kế hoạch | ID SPEC |
| --------- | -------- |
| Yêu cầu người dùng đã xác thực | PRE-FE03-001, BR-FE03-001, FR-FE03-002, NFR-FE03-SEC-001 |
| Chỉ truy cập hồ sơ của chính mình | PRE-FE03-004, BR-FE03-002, BR-FE03-003, FR-FE03-003 |
| DTO response an toàn | BR-FE03-004, BR-FE03-010, FR-FE03-001, FR-FE03-007, AC-FE03-008 |
| Cập nhật trường được phép | FR-FE03-004, AC-FE03-005 |
| Từ chối dữ liệu không hợp lệ | BR-FE03-006, BR-FE03-007, BR-FE03-008, FR-FE03-005, AC-FE03-006 |
| Từ chối trường được bảo vệ | BR-FE03-005, BR-FE03-009, FR-FE03-006, AC-FE03-007 |
| Tự động tạo hồ sơ thiếu | PRE-FE03-003, AF-FE03-001, EC-FE03-003, Q-FE03-003 |
| Audit cập nhật hồ sơ | Q-FE03-005 |
| Tải avatar | PRE-FE03-006, MF-FE03-003, AF-FE03-005, BR-FE03-011, BR-FE03-012, BR-FE03-013, BR-FE03-014, FR-FE03-008, FR-FE03-009, AC-FE03-009, AC-FE03-010, AC-FE03-011 |

---

## 3. Thiết kế backend

### 3.1 Lớp route

Thêm module route hồ sơ được mount dưới `/api/profile`.

Endpoint:

- `GET /api/profile/me`
- `PUT /api/profile/me`
- `POST /api/profile/me/avatar`

Mọi endpoint hồ sơ phải sử dụng middleware xác thực hiện có hoặc middleware tương thích nhỏ nhất có sẵn ở backend.

`POST /api/profile/me/avatar` phải chấp nhận `multipart/form-data` với một trường tệp tên `avatar`.

### 3.2 Lớp controller

Controller phải:

- đọc `userId` đã xác thực hiện tại từ danh tính request
- không bao giờ tin `userId` từ URL params hoặc request body
- trả về HTTP status code an toàn và lỗi server chung
- trả về lỗi xác thực dữ liệu kèm tên trường

Hành vi status dự kiến:

| Trường hợp | Status |
| ---- | ------ |
| Thiếu/xác thực không hợp lệ | `401` |
| Không tìm thấy người dùng hiện tại | `404` |
| Lỗi xác thực dữ liệu | `400` |
| Gửi trường được bảo vệ | `400` |
| Thiếu tệp avatar | `400` |
| Loại tệp avatar không được hỗ trợ | `400` |
| Tệp avatar vượt kích thước | `400` |
| Xem/cập nhật hồ sơ thành công | `200` |
| Lỗi cơ sở dữ liệu/server không mong đợi | `500` cùng thông báo an toàn |

### 3.3 Lớp service

Service phải:

- tải người dùng hiện tại và hồ sơ theo `userId` đã xác thực
- tự động tạo hàng `UserProfiles` trống khi thiếu
- xây dựng DTO an toàn loại trừ `PasswordHash`, token, nội bộ quản lý vai trò và nội bộ audit
- xác thực payload cập nhật trước mọi thao tác ghi cơ sở dữ liệu
- cập nhật nguyên tử các trường `Users.Phone` và `UserProfiles`
- lưu ảnh avatar đã xác thực với tên tệp do server tạo
- cập nhật `UserProfiles.AvatarUrl` sau khi tải avatar thành công
- ghi audit log an toàn cho mỗi lần cập nhật trường hồ sơ thành công

### 3.4 Lớp model/repository

Truy cập cơ sở dữ liệu phải sử dụng truy vấn có tham số SQL Server qua helper/pool cơ sở dữ liệu hiện có.

Các thao tác bắt buộc:

- tìm thông tin tóm tắt tài khoản người dùng theo `UserId`
- tìm hồ sơ theo `UserId`
- tạo hồ sơ trống theo `UserId`
- cập nhật `Users.Phone`
- cập nhật `UserProfiles.FullName`, `Address` và `DateOfBirth`; tại đây cấm thay đổi trực tiếp `AvatarUrl`
- chỉ cập nhật `UserProfiles.AvatarUrl` sau khi tải avatar
- tạo bản ghi audit log an toàn bắt buộc trong transaction nguồn

Kế hoạch này không bao gồm thay đổi schema cơ sở dữ liệu.

---

## 4. Quy tắc xác thực dữ liệu

Sử dụng xác thực ở server cho mọi trường được gửi.

Các trường được phép chỉnh sửa:

- `fullName`
- `address`
- `dateOfBirth`
- `phone`

Phải từ chối các trường được bảo vệ nếu chúng xuất hiện:

- `password`
- `passwordHash`
- `role`
- `roles`
- `roleId`
- `status`
- `email`
- `membershipStatus`
- `membershipApproval`
- `userId`
- `profileId`

Quy tắc trường cho Giai đoạn 1:

| Trường | Quy tắc |
| ----- | ---- |
| `fullName` | tùy chọn; chuỗi; trim; tối đa 100 ký tự |
| `address` | tùy chọn; chuỗi; trim; tối đa 255 ký tự |
| `dateOfBirth` | tùy chọn; ngày ISO hợp lệ; không được ở tương lai |
| `phone` | tùy chọn; chuỗi; trim; 10-15 chữ số, có thể có `+` ở đầu |

Nếu xác thực dữ liệu thất bại, không trường hồ sơ hoặc số điện thoại nào được thay đổi.

### 4.1 Quy tắc tải avatar

Trường tải lên đã phê duyệt:

- `avatar`

Quy tắc:

| Quy tắc | Quyết định |
| ---- | -------- |
| Phần mở rộng tệp được chấp nhận | JPG, JPEG, PNG, WebP |
| Kích thước tệp tối đa | 2 MB |
| Đường dẫn lưu trữ | Thư mục static uploads do backend kiểm soát, ví dụ `/uploads/avatars` |
| Giá trị lưu trong cơ sở dữ liệu | URL/đường dẫn công khai được tạo, lưu trong `UserProfiles.AvatarUrl` |
| Chính sách tên tệp | Tên tệp an toàn do server tạo; không tin tên tệp gốc hoặc đường dẫn cục bộ |
| Hành vi thất bại | Từ chối tải lên và giữ nguyên `avatarUrl` hiện có |

---

## 5. Kế hoạch kiểm thử

Thêm kiểm thử backend bằng Jest và Supertest tại nơi cấu trúc backend hỗ trợ kiểm thử integration.

Độ bao phủ bắt buộc:

- người dùng đã xác thực có thể xem hồ sơ an toàn của chính mình
- khách không thể xem hồ sơ
- hồ sơ thiếu được tự động tạo ở lần xem đầu tiên
- DTO an toàn loại trừ `PasswordHash`
- người dùng đã xác thực có thể cập nhật trường được phép
- trường không hợp lệ bị từ chối cập nhật
- trường được bảo vệ bị từ chối cập nhật và không thay đổi dữ liệu được bảo vệ
- cập nhật là nguyên tử khi xác thực dữ liệu thất bại
- người dùng đã xác thực có thể tải ảnh avatar hợp lệ
- khách không thể tải avatar
- loại avatar không được hỗ trợ bị từ chối
- tệp avatar vượt kích thước bị từ chối
- việc tải avatar không hợp lệ không thay đổi `avatarUrl` hiện có

Kiểm thử phải ánh xạ tới `FT12` và `FT13`.

---

## 6. Ngoài phạm vi

Không triển khai:

- đăng nhập, đăng xuất, đăng ký, đặt lại mật khẩu hoặc thay đổi mật khẩu
- thay đổi email hoặc xác minh email
- gán vai trò hoặc quản lý trạng thái tài khoản
- quản trị viên chỉnh sửa hồ sơ của người dùng khác
- thay đổi phê duyệt thành viên
- lịch sử mượn, đặt chỗ hoặc tiền phạt
- chỉnh sửa/cắt ảnh đầy đủ
- migration schema cơ sở dữ liệu trừ khi được phê duyệt riêng

---

## 7. Thứ tự triển khai

1. Xác nhận middleware xác thực backend và helper cơ sở dữ liệu hiện có.
2. Thêm DTO hồ sơ và helper xác thực dữ liệu.
3. Thêm hàm model/repository hồ sơ.
4. Thêm hàm service hồ sơ.
5. Thêm controller và route hồ sơ.
6. Mount route vào ứng dụng Express.
7. Thêm kiểm thử backend cho việc xem/cập nhật/xác thực dữ liệu hồ sơ.
8. Thêm middleware tải tệp/xử lý lưu avatar.
9. Thêm kiểm thử backend cho xác thực dữ liệu tải avatar và tải thành công.
10. Thêm input tệp avatar và lời gọi API ở frontend.
11. Chạy xác thực backend và frontend.
12. Cập nhật changelog tính năng này với ghi chú triển khai nếu hành vi thay đổi.

---

## 8. Phê duyệt

Kế hoạch chuẩn hóa này được Nhat phê duyệt làm baseline vào 2026-07-17. T-FE03-016 đồng bộ việc từ chối trực tiếp `avatarUrl`, hành vi audit bắt buộc, khóa hồ sơ thiếu, cơ chế bù trừ avatar và ghi log dọn dẹp an toàn. Kiểm thử tự động, SQL Server disposable và xác thực qua trình duyệt của agent đều vượt qua; rà soát thủ công B7/L4 vẫn đang chờ.
