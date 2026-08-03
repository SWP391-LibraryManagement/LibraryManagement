# FE11 Thiết kế điều hướng và quyền của quản trị viên

Trạng thái: ĐƯỢC PHÊ DUYỆT BỞI HUMAN - 2026-07-19

Ngày: 2026-07-19

Phạm vi: `TD-023`; `FR-FE11-030`, `FR-FE11-032`, `AC-FE11-016`, `AC-FE11-017`

## 1. Quyết định

Sử dụng Hybrid SDD + ADD ở độ sâu Tiêu chuẩn.

- Cốt lõi: điều hướng của Quản trị viên đã được phê duyệt, ranh giới chỉ đọc của Quản trị viên, ma trận quyền chuẩn, quyền sở hữu FE11/FE12 và cách ly lỗi.
- lớp bao: nhãn thanh bên, thẻ, bảng, trình bày tải/lỗi và hiển thị phản hồi.

Kiến trúc được chọn là FE11 quyền chỉ đọc chuẩn API cộng với số lượng vai trò FE12 độc lập. Giao
diện người dùng không được sở hữu ma trận quyền được mã hóa cứng và không được lấy số lượng từ các
hàng người dùng được phân trang.

Siêu dữ liệu toàn bộ chức năng vẫn là `Implementation State: DEFERRED`.

## 2. Phạm vi được phê duyệt

### Trong phạm vi

- Căn chỉnh thanh bên của Bảng điều khiển dành cho quản trị viên theo tám phần FE11 đã được phê duyệt.
- Làm cho phần Quyền có thể truy cập được từ thanh bên.
- Thêm `GET /api/admin/permissions` chỉ dành cho quản trị viên.
- Chuyển chính sách cấp phép Giai đoạn 1 ra khỏi `UserManagement.jsx` sang mô-đun chính sách máy chủ FE11.
- Tải ma trận quyền FE11 và số lượng vai trò FE12 một cách độc lập.
- Hiển thị bản tóm tắt vai trò chỉ đọc, phạm vi mô-đun và ma trận quyền.
- Thêm các kiểm thử hợp đồng backend/frontend và hoàn thành các cổng xác thực thông thường.

### Ngoài phạm vi

- Chỉnh sửa quyền, phân cấp vai trò, tạo vai trò hoặc xóa vai trò.
- Bảng cơ sở dữ liệu `Permissions` mới hoặc bất kỳ di chuyển lược đồ nào.
- Xóa trang Thành viên FE04, lộ trình, API hoặc cách triển khai.
- Yêu cầu quản lý chi tiết/công việc bất biến được theo dõi bởi `TD-025`.
- Cập nhật/hủy kích hoạt người dùng, trường thủ thư, đồng thời lạc quan hoặc hoàn thành toàn bộ chức năng FE11.

## 3. Hợp đồng điều hướng quản trị viên

Thanh bên của Bảng điều khiển dành cho quản trị viên chứa chính xác các mục này theo thứ tự sau:

1. `home` - Trang chủ - navigates to `/home`.
2. `dashboard` - Tổng quan.
3. `library` - Thư viện.
4. `circulation` - Quản lý mượn trả.
5. `requests` - Quản lý yêu cầu.
6. `users` - Quản lý người dùng.
7. `permissions` - Phân quyền.
8. `audit` - Nhật ký hoạt động.

`membership`, `Confirm Payment` và `Confirm Borrow` không phải là mục nhập thanh bên của Bảng điều
khiển dành cho quản trị viên. Việc xóa `membership` khỏi thanh bên này sẽ không xóa hoặc sửa đổi
chức năng FE04 ở nơi khác.

Manage Roles remains an explicit người dùng hành động under Quản lý người dùng. The Permissions page
is chỉ đọc.

## 4. Hợp đồng API

### Điểm cuối

`GET /api/admin/permissions`

- Tác nhân: Chỉ có quản trị viên.
- Nội dung yêu cầu/truy vấn: không có.
- Xác thực và ủy quyền quản trị viên chạy trước bộ điều khiển.
- Phản hồi mang tính xác định, chỉ đọc và không có thao tác ghi cơ sở dữ liệu.

### phản hồi

```json
{
  "roles": [
    { "roleName": "ADMIN", "label": "Admin" },
    { "roleName": "LIBRARIAN", "label": "Librarian" },
    { "roleName": "MEMBER", "label": "Member" }
  ],
  "permissions": [
    {
      "permissionKey": "USER_VIEW",
      "label": "View users",
      "moduleKey": "USER_ROLE",
      "moduleLabel": "User & Role",
      "allowedRoles": ["ADMIN"]
    }
  ]
}
```

Các khóa cấp cao nhất chính xác là `roles` và `permissions`.

Đối tượng vai trò chứa chính xác `roleName` và `label`. Các đối tượng quyền chứa chính xác
`permissionKey`, `label`, `moduleKey`, `moduleLabel` và `allowedRoles`.

Tên vai trò được phép được giới hạn ở `ADMIN`, `LIBRARIAN` và `MEMBER`. Mảng sử dụng thứ tự xác định
và không chứa bản sao.

## 5. Ma trận kinh điển pha 1

| Mô-đun | Khóa cấp phép | Nhãn | Vai trò được phép |
| --- | --- | --- | --- |
| Người dùng & Vai trò | `USER_VIEW` | Xem người dùng | ADMIN |
| Người dùng & Vai trò | `USER_CREATE` | Tạo tài khoản | ADMIN |
| Người dùng & Vai trò | `USER_UPDATE` | Cập nhật tài khoản | ADMIN |
| Người dùng & Vai trò | `USER_DEACTIVATE` | Vô hiệu hóa tài khoản | ADMIN |
| Người dùng & Vai trò | `ROLE_MANAGE` | Quản lý vai trò | ADMIN |
| Người dùng & Vai trò | `AUDIT_VIEW` | Xem nhật ký kiểm tra | ADMIN |
| Thư viện | `CATALOG_MANAGE` | Quản lý danh mục thư viện | ADMIN, LIBRARIAN |
| Thư viện | `METADATA_MANAGE` | Quản lý tác giả/nhà xuất bản/danh mục | ADMIN |
| Mượn/trả sách | `BORROW_APPROVE_REJECT` | Phê duyệt/từ chối yêu cầu mượn sách | ADMIN, LIBRARIAN |
| Mượn/trả sách | `RETURN_RENEW_PROCESS` | Quy trình trả sách và gia hạn | ADMIN, LIBRARIAN |
| Khoản phạt | `FINE_CALCULATE_COLLECT` | Tính và thu khoản phạt | ADMIN, LIBRARIAN |
| Khoản phạt | `FINE_WAIVE_CANCEL` | Miễn hoặc hủy bỏ khoản phạt | ADMIN |
| Báo cáo | `REPORT_VIEW` | Xem báo cáo | ADMIN, LIBRARIAN |
| Mượn/trả sách | `BORROW_REQUEST_CREATE` | Tạo yêu cầu mượn | MEMBER |
| Mượn/trả sách | `BORROW_HISTORY_VIEW_OWN` | Xem lịch sử mượn của mình | MEMBER |

Mô-đun chính sách máy chủ là chủ sở hữu mã sản phẩm duy nhất của ma trận này. Giao diện người dùng
lấy số boolean của bảng và số lượng phạm vi mô-đun từ phản hồi.

## 6. Luồng dữ liệu và quyền sở hữu

1. Việc mở Quyền sẽ kích hoạt `adminApi.permissions()`.
2. FE11 trả về ma trận chỉ đọc chuẩn.
3. FE12 `reportApi.users()` hiện tại cung cấp số lượng `usersByRole` toàn cầu.
4. Giao diện người dùng kết hợp hai phản hồi của `roleName` chỉ để trình bày.
5. Phạm vi bao phủ của mô-đun được tính bằng cách đếm các quyền có `allowedRoles` chứa từng vai trò.

Hai yêu cầu vẫn độc lập:

- FE11 lỗi ma trận không xóa kết quả đếm FE12 thành công.
- FE12 lỗi thống kê không xóa kết quả ma trận FE11 thành công.
- Bộ lọc danh sách và phân trang không ảnh hưởng đến số lượng vai trò.
- Không có truy vấn `/api/admin/user-summary` hoặc số lượng trùng lặp nào được đưa ra.

## 7. Lỗi và hành vi bảo mật

- Xác thực bị thiếu/không hợp lệ trả về `401`.
- Quyền truy cập của Thành viên hoặc Thủ thư được xác thực trả về `403`.
- Ủy quyền chạy trước khi thực thi bộ điều khiển.
- Phản hồi sử dụng danh sách cho phép rõ ràng và không chứa thông tin xác thực, dữ liệu cá nhân, siêu dữ liệu kiểm tra, tên hàm nội bộ hoặc đối tượng chính sách có thể thay đổi.
- Dịch vụ trả về các đối tượng DTO mới để người gọi không thể thay đổi định nghĩa chính sách dùng chung.
- Lỗi giao diện người dùng API hiển thị lỗi có thể thử lại và không sử dụng dự phòng ma trận được mã hóa cứng.
- Việc đếm bắt đầu từ số 0 và duy trì giá trị thành công cuối cùng của chúng sau các lỗi FE12 sau này.
- Ma trận duy trì giá trị thành công cuối cùng của nó sau các lỗi FE11 sau này.

## 8. Ranh giới thực hiện

Quyền sở hữu máy chủ dự kiến:

- `backend/src/policies/adminPermissionPolicy.js`
- `backend/src/services/adminService.js`
- `backend/src/controllers/adminController.js`
- `backend/src/routes/adminRoutes.js`
- kiểm tra máy chủ tập trung
- Tài liệu API/OpenAPI trong đó tài liệu API của Quản trị viên được ghi lại

Quyền sở hữu giao diện người dùng dự kiến:

- `frontend/src/api/adminApi.js`
- `frontend/src/page/UserManagement.jsx`
- kiểm tra nguồn/hợp đồng giao diện người dùng tập trung

Cập nhật quản trị dự kiến:

- FE11 PLAN/TASKS/TEST_PLAN/CHANGELOG
- `TECH_DEBT.md`
- bản ghi xác thực TD-023

Không có kho lưu trữ, SQL, lược đồ, triển khai xác thực, tệp sản xuất FE12 hoặc tệp sản xuất FE04
thuộc sở hữu của lát này.

## 9. Chiến lược kiểm thử

### máy chủ RED-GREEN

- Tuyến từ chối người gọi không được xác thực và không phải Quản trị viên trước dịch vụ.
- Tuyến trả về chính xác `{ roles, permissions }` cho Quản trị viên.
- Dịch vụ trả về thứ tự vai trò chuẩn và tất cả 15 hàng quyền.
- Các đối tượng DTO chỉ chứa các khóa được phê duyệt, vai trò hợp lệ, thứ tự ổn định và không trùng lặp.
- Các cuộc gọi lặp lại sẽ trả về các đối tượng độc lập và không làm thay đổi nguồn chính sách.
- Không có kho lưu trữ hoặc phương thức ghi nào được gọi.

### Giao diện người dùng RED-GREEN

- Thanh bên hiển thị chính xác tám mục được phê duyệt theo thứ tự.
- Tư cách thành viên, Xác nhận thanh toán và Xác nhận lượt mượn không có trong điều hướng của Quản trị viên.
- Quyền có thể truy cập và tải thông qua `adminApi.permissions()`.
- Trang này không chứa sản phẩm dự phòng `permissionRows` hoặc `permissionModules` được mã hóa cứng.
- Thẻ vai trò sử dụng FE12 `usersByRole`, không tải hàng người dùng.
- Các ô cấp phép và phạm vi mô-đun được lấy từ phản hồi FE11.
- Ma trận và trạng thái tải/lỗi đếm vẫn độc lập và có thể thử lại.

### Cổng xác thực

- Các kiểm thử backend/frontend tập trung và đầy đủ đã vượt qua.
- Ngưỡng phạm vi máy chủ, tìm lỗi mã nguồn/xây dựng giao diện người dùng, trình duyệt E2E, nhập tình trạng, phân tích cú pháp OpenAPI, truy vết, vệ sinh khác biệt và thẻ quét bí mật có độ tin cậy cao.
- Quá trình xem xét H2 ở người diễn ra trước khi cam kết/đẩy; Đánh giá H3 của con người diễn ra sau khi kiểm tra PR và trước khi hợp nhất.
- `main` CI sau hợp nhất được ghi lại trước khi đóng `TD-023`.

## 10. Tiêu chí chấp nhận

- Quản trị viên nhìn thấy chính xác tám mục nhập thanh bên đã được phê duyệt và có thể mở Quyền.
- Tư cách thành viên vẫn hoạt động bên ngoài thanh bên của Bảng điều khiển dành cho quản trị viên.
- Quyền hiển thị số lượng Quản trị viên/Thủ thư/Thành viên toàn cầu từ FE12.
- Quyền hiển thị ma trận FE11 chuẩn và phạm vi mô-đun dẫn xuất.
- Trang này ở chế độ chỉ đọc và không hiển thị các điều khiển thao tác ghi quyền.
- Các lỗi FE11/FE12 bị cô lập mà không có dữ liệu dự phòng được phát minh.
- `TD-023` chỉ đóng sau H2, kiểm tra, H3, hợp nhất và CI sau hợp nhất.
- Toàn bộ FE11 vẫn bị trì hoãn sau lát cắt giới hạn này.
