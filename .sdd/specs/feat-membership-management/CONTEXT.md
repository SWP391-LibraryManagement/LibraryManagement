# CONTEXT.md - Quản lý thành viên FE04

# Phiên bản: 0.2.0

# Trạng thái: APPROVED - BASELINE 2026-07-17

# Chủ sở hữu: Dat

# Cập nhật lần cuối: 2026-07-16

# Thư mục tính năng: `.sdd/specs/feat-membership-management/`

---

## 1. Mục đích tính năng

Quản lý thành viên dùng để ghi nhận đơn đăng ký thành viên và quyết định rà soát. Việc phê duyệt FE04 không phải cổng truy cập cho mượn hoặc đặt chỗ; các quy trình đó độc lập yêu cầu tài khoản đang hoạt động với vai trò `MEMBER`.

Tính năng này phải làm rõ bốn nội dung:

- Đăng ký tài khoản thuộc FE02.
- Đơn đăng ký và phê duyệt thành viên thuộc FE04.
- Điều kiện mượn sử dụng trạng thái thành viên nhưng không phê duyệt thành viên.
- Gán vai trò người dùng thuộc FE11.

FE04 là tính năng Đặc tả tiêu chuẩn vì kiểm soát điều kiện nghiệp vụ và yêu cầu quy trình phê duyệt/từ chối, nhưng không tự triển khai nghiệp vụ mượn.

---

## 2. Quy trình thực tế

Quy trình thành viên điển hình:

1. Người dùng đã đăng ký nộp đơn thành viên.
2. Hệ thống tạo đơn đăng ký thành viên có trạng thái `PENDING`.
3. Thủ thư/quản trị viên rà soát các đơn đang chờ.
4. Thủ thư/quản trị viên phê duyệt hoặc từ chối đơn.
5. Hệ thống cập nhật nguyên tử lịch sử đơn, projection `Members` chuẩn, metadata người rà soát và dữ liệu audit.
6. Sau commit, FE04 yêu cầu thông báo kết quả thành viên FE10 không chặn luồng.
7. Thành viên có thể xem trạng thái thành viên chuẩn cùng thông tin đơn hiện tại/gần nhất.
8. FE07 và FE08 độc lập yêu cầu `Users.Status = ACTIVE` và vai trò `MEMBER`; phê duyệt FE04 không phải điều kiện tiên quyết. `Members.Status = APPROVED` có thể ảnh hưởng đến hạn mức mỗi ngày của thành viên đã được phê duyệt mà FE07 sử dụng.

---

## 3. Ranh giới tính năng

FE04 bao gồm:

- Nộp đơn thành viên.
- Phê duyệt đơn thành viên.
- Từ chối đơn thành viên.
- Xem trạng thái thành viên.
- Duy trì lịch sử đơn bất biến và projection điều kiện `Members` hiện tại chuẩn.

FE04 không bao gồm:

- Đăng ký tài khoản, đăng nhập, đăng xuất, mật khẩu hoặc xác minh email. Các nội dung đó thuộc FE02.
- Gán vai trò hoặc kích hoạt/hủy kích hoạt tài khoản người dùng. Nội dung đó thuộc FE11.
- Chỉnh sửa hồ sơ. Nội dung đó thuộc FE03.
- Thực hiện mượn, gia hạn, trả hoặc đặt chỗ. Các nội dung đó thuộc FE07 và FE08.
- Tính tiền phạt hoặc thanh toán. Nội dung đó thuộc FE09.

---

## 4. Ghi chú về mô hình dữ liệu hiện tại

Script SQL hiện tại bao gồm:

- `Users(UserId, Username, Email, PasswordHash, Phone, Status, CreatedAt)`
- `Members(MemberId, UserId, Status, ApprovedAt, ApprovedBy, CreatedAt, UpdatedAt)`
- `MembershipApplications(ApplicationId, UserId, Status, AppliedAt, ApprovedAt, ReviewedBy, ReviewNote)`
- `UserRoles(UserId, RoleId)`

Các yêu cầu đối soát triển khai:

- Bảng hiện tại không có `RejectedAt` riêng; Giai đoạn 1 sử dụng timestamp audit bắt buộc để truy vết việc từ chối.
- Schema hiện tại không lưu riêng ngày hết hạn thành viên hoặc số thành viên.
- Người dùng có thể có nhiều đơn trong lịch sử nhưng tối đa một đơn đang chờ.
- `Members.Status` là nguồn điều kiện chuẩn; lịch sử đơn không bao giờ thay thế projection này.
- Việc từ chối sử dụng `MembershipApplications.ReviewNote`; phê duyệt/từ chối cập nhật `ReviewedBy` và ghi audit entry.

Phần triển khai phải giữ các quyết định đã phê duyệt này khi đối soát schema hiện tại và hành vi prototype.

---

## 5. Các use case chính từ bảng phân công

| ID use case | Tên use case | Chủ sở hữu |
| ----------- | ------------- | ----- |
| UC13 | Nộp đơn thành viên | Dat |
| UC14 | Phê duyệt đơn thành viên | Dat |
| UC15 | Từ chối đơn thành viên | Dat |
| UC16 | Xem trạng thái thành viên | Dat |

---

## 6. Các kiểm thử tính năng từ bảng phân công

| ID kiểm thử | Tên kiểm thử | Chủ sở hữu |
| ------- | --------- | ----- |
| FT14 | Gửi đơn thành viên | Dat |
| FT15 | Phê duyệt thành viên | Dat |
| FT16 | Từ chối thành viên | Dat |
| FT17 | Xem trạng thái thành viên | Dat |

---

## 7. Rủi ro chính

- Đơn đang chờ trùng lặp có thể tạo ra quyết định phê duyệt không nhất quán.
- FE07/FE08 phải sử dụng trực tiếp hợp đồng tài khoản đang hoạt động và vai trò; trạng thái FE04 là chuẩn cho báo cáo thành viên và quyết định hạn mức của thành viên đã phê duyệt.
- Từ chối không có lý do có thể khiến người nộp đơn và Thủ thư bối rối.
- Hành động phê duyệt/từ chối có thể do người dùng không được phép thực hiện nếu thiếu RBAC.
- Mô hình dữ liệu có thể không hỗ trợ việc hết hạn thành viên hoặc nộp lại đơn trong tương lai nếu không ghi nhận quyết định.

---

## 8. Phụ thuộc

| Phụ thuộc | Lý do quan trọng |
| ---------- | -------------- |
| Xác thực FE02 | Người dùng phải có tài khoản trước khi nộp đơn. |
| Hồ sơ người dùng FE03 | Dữ liệu hồ sơ có thể hỗ trợ việc rà soát đơn thành viên. |
| Quản lý mượn FE07 | Sử dụng tài khoản đang hoạt động với vai trò `MEMBER`; thành viên `APPROVED` có thể tăng hạn mức mỗi ngày. |
| Quản lý đặt chỗ FE08 | Sử dụng tài khoản đang hoạt động với vai trò `MEMBER`; phê duyệt FE04 không chặn việc đặt chỗ. |
| Quản lý người dùng và vai trò FE11 | Cung cấp vai trò Thủ thư/quản trị viên để phê duyệt và từ chối. |
| Cơ sở dữ liệu SQL Server | Lưu người dùng và đơn thành viên. |

---

## 9. Câu hỏi đã giải quyết cho nhóm/giảng viên

| ID | Quyết định đã phê duyệt | Nguồn | Trạng thái |
| -- | ----------------- | ------ | ------ |
| Q-FE04-001 | Người dùng bị từ chối có thể nộp lại đơn sau khi chỉnh sửa thông tin. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE04-002 | Bắt buộc có lý do từ chối. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE04-003 | Thành viên không hết hạn trong Giai đoạn 1. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE04-004 | Phê duyệt thành viên chỉ thay đổi trạng thái đơn/thành viên, không thay đổi vai trò người dùng. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE04-005 | Thủ thư và Quản trị viên có thể phê duyệt/từ chối đơn thành viên. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE04-006 | Phê duyệt/từ chối kích hoạt thông báo FE10 khi nhà cung cấp thông báo khả dụng; lỗi thông báo không rollback quyết định. | Gói rà soát 2026-06-10 | APPROVED |

---

## 10. Ghi chú cho việc triển khai sau này

- Không triển khai cho đến khi `SPEC.md` được rà soát và phê duyệt.
- `PLAN.md` và `TASKS.md` giữ `NOT STARTED` cho đến khi được phê duyệt.
- Phê duyệt/từ chối phải được bảo vệ bằng vai trò ở server.
- Tránh đơn đang hoạt động/đang chờ trùng lặp cho cùng một người dùng.
- Giữ quy tắc trạng thái FE04 dễ để FE07 và FE08 sử dụng.
