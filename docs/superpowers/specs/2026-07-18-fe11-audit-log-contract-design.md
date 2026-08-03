# FE11 Nhật ký kiểm toán Thiết kế hợp đồng

Trạng thái: ĐƯỢC PHÊ DUYỆT BỞI HUMAN - 2026-07-18

Ngày: 2026-07-18

Phạm vi: `TD-024`, `FR-FE11-033`, `AC-FE11-018`, `BR-FE11-018` và `BR-FE11-026`

## Quyết định được yêu cầu

Phê duyệt một điểm cuối chỉ đọc, do quản trị viên sở hữu trên cửa hàng `AuditLogs` có nhiều chức
năng. Di chuyển Giao diện người dùng quản trị sang điểm cuối chuẩn, ngừng tuyến quản lý người dùng
nguyên mẫu và siêu dữ liệu dự án thông qua ranh giới từ chối mặc định nhận biết hành động.

## Điểm cuối chuẩn

`GET /api/admin/audit-logs`

Xác thực và ủy quyền vai trò quản trị viên vẫn ở phía máy chủ và chạy trước khi xác thực truy vấn
chi tiết. Phần này không thêm chức năng xác thực lại trạng thái tài khoản vì ranh giới xác thực hiện
tại không cung cấp chức năng này và H1 không cho phép mở rộng xác thực.

## Phạm vi hàng

Điểm cuối trả về tất cả các hàng `AuditLogs` có chức năng chéo được duy trì theo thứ tự ổn định. Nó
không âm thầm che giấu các sự kiện xác thực, hồ sơ, tư cách thành viên, mượn, đặt chỗ, kiểm kê,
khoản phạt, thông báo, báo cáo hoặc FE11. Quản trị viên có thể thu hẹp kết quả bằng bộ lọc `action`.

## Hợp đồng truy vấn

| Lĩnh vực | Hợp đồng |
| --- | --- |
| `page` | Số nguyên dương tùy chọn; mặc định `1` |
| `limit` | Số nguyên tùy chọn `1..100`; mặc định `20` |
| `q` | Chuỗi tùy chọn đã trim, `1..100` ký tự; tìm kiếm hành động, email/tên đầy đủ của tác nhân, loại mục tiêu và văn bản ID mục tiêu |
| `action` | Chuỗi hành động chính xác được cắt bớt tùy chọn, ký tự `1..100` |
| `actorId` | Số nguyên dương tùy chọn |
| `from` | Tùy chọn ISO `YYYY-MM-DD` bao gồm giới hạn dưới |
| `to` | Giới hạn trên bao gồm ISO `YYYY-MM-DD` tùy chọn; không được đặt chỗ `from` |

Giá trị được cung cấp không hợp lệ trả về HTTP `400` với mã `VALIDATION_ERROR`. Ủy quyền đi trước
xác nhận chi tiết. Tên truy vấn vẫn được căn chỉnh chính xác với FE11 SPEC đã được phê duyệt.

## Hợp đồng phản hồi

```json
{
  "data": [
    {
      "logId": 1,
      "action": "USER_ROLE_ASSIGN",
      "actor": { "userId": 7, "email": "admin@example.com", "fullName": "Admin User" },
      "target": { "type": "USER", "id": 15, "label": "member@example.com" },
      "details": { "roleId": 2, "roleName": "LIBRARIAN" },
      "ipAddress": "203.0.113.10",
      "createdAt": "2026-07-18T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

`totalPages` là `0` khi `total` là `0`; nếu không thì đó là `ceil(total / limit)`.

## Chiếu an toàn nhận biết hành động

`Metadata` thô không bao giờ được trả sách. Dịch vụ chỉ phân tích cú pháp đối tượng JSON cấp cao
nhất và xây dựng `details` một cách rõ ràng. JSON không hợp lệ, mảng, siêu dữ liệu vô hướng, hành
động không xác định hoặc hình dạng trường không hợp lệ tạo ra `details: {}`.

| Hành động | Đã trả sách `details` |
| --- | --- |
| `AUTH_PASSWORD_CHANGE_FAILURE`, `AUTH_VERIFY_EMAIL`, `AUTH_LOGIN_LOCKED`, `AUTH_ACCOUNT_AUTO_UNLOCKED`, `AUTH_LOGIN_INACTIVE`, `AUTH_LOGIN_FAILURE`, `AUTH_LOGIN_SUCCESS`, `AUTH_REFRESH_TOKEN`, `AUTH_LOGOUT`, `AUTH_PASSWORD_CHANGE_SUCCESS`, `AUTH_CHANGE_PASSWORD_OTP_REQUESTED`, `AUTH_PASSWORD_RESET_SUCCESS`, `AUTH_REGISTER`, `AUTH_RESEND_VERIFICATION`, `AUTH_PASSWORD_RESET_REQUEST`, `AUTH_LOGIN_ATTEMPT`, `AUTH_ACCOUNT_SETUP_COMPLETE`, `USER_ACCOUNT_SETUP_RESEND` | `{}` |
| `USER_CREATE` | `{ roleName }`; email liên tục bị bỏ qua |
| `USER_UPDATE` | `{ changedFields }`; chỉ `email`, `fullName`, `phone`, `address`, `department`, `specialization` và `status` được giữ lại |
| `USER_DEACTIVATE` | `{ newStatus }` |
| `USER_ROLE_ASSIGN`, `USER_ROLE_REVOKE` | `{ roleId, roleName }` |
| `BORROW_REQUEST_CREATE` | `{ copyIds }` |
| `BORROW_REQUEST_APPROVE` | `{ memberUserId, copyIds, notesProvided }` |
| `BORROW_REQUEST_REJECT` | `{ memberUserId, reasonProvided }` |
| `BORROW_DETAIL_RETURN` | `{ requestId, memberId, copyId, condition, overdueDays, notesProvided }` |
| `BORROW_DETAIL_RENEW` | `{ requestId, memberId, copyId, newDueDate, notesProvided }` |
| `RESERVATION_FULFILL` | `{ requestId, copyId, memberUserId }` |
| `RESERVATION_CREATE`, `RESERVATION_EXPIRE` | `{ copyId }` |
| `RESERVATION_CANCEL` | `{ copyId, reasonProvided }` |
| `RESERVATION_NOTIFY_FAILED` | `{ code }` |
| `RESERVATION_PROCESS` | `{ copyId, selectedUserId, expiresAt }` |
| `FINE_CALCULATE` | `{ borrowDetailId, memberId, overdueDays, amount }` |
| `FINE_COLLECT` | `{ collectedAmount, fullyCollected, noteProvided }` |
| `FINE_MARK_PAID` | `{ amount, noteProvided }` |
| `FINE_WAIVE`, `FINE_CANCEL` | `{ reasonProvided }` |
| `BOOK_COPY_CREATE` | `{ bookId, barcode, status, location }` |
| `BOOK_COPY_UPDATE` | `{ bookId, changedFields }`, chỉ cộng thêm `previousStatus` và `newStatus` khi trạng thái thay đổi; dữ liệu `before`, `patch`, sách, tiêu đề và ISBN thô bị bỏ qua |
| `BOOK_COPY_STATUS_UPDATE` | `{ previousStatus, newStatus, reasonProvided }` |
| `BOOK_COPY_DEACTIVATE` | `{ previousStatus, newStatus }` |
| `MEMBERSHIP_APPLICATION_SUBMITTED`, `MEMBERSHIP_APPLICATION_APPROVED` | `{ userId, status }` |
| `MEMBERSHIP_APPLICATION_REJECTED` | `{ userId, status, reasonProvided }` |
| `PROFILE_UPDATE` | `{ changedFields }`; chỉ `fullName`, `address`, `dateOfBirth`, `avatarUrl` và `phone` được giữ lại |
| `REPORT_BORROWING_VIEW`, `REPORT_INVENTORY_VIEW`, `REPORT_USERS_VIEW` | `{ reportType }`, bắt nguồn từ hành động |
| `REPORT_ACCESS_DENIED` | `{ code, statusCode, method, reportType? }`; đường dẫn thô bị bỏ qua và chỉ các đường dẫn báo cáo đã biết ánh xạ tới `reportType` |
| `NOTIFICATION_REQUEST_CREATE` | `{ type, channel, sourceFeature, sourceEntityType, sourceEntityId? }`; `sourceEntityId` bị bỏ qua khi `sourceEntityType` là `AuthToken` |
| `NOTIFICATION_RETRY` | `{ previousStatus, newStatus }` |
| `NOTIFICATION_PROCESS_PENDING` | `{ processed, failed }` |

Mảng được giới hạn ở 100 giá trị. ID phải là số nguyên dương. Số lượng và giá trị tiền tệ phải là số
hữu hạn không âm. Ngày phải chuẩn hóa thành chuỗi ISO. Văn bản tự do `reason`, `notes`, `note`, tin
nhắn, email, mã định danh, đường dẫn thô và các đối tượng lồng nhau không bao giờ được trả về; chỉ
có thể phát ra boolean `reasonProvided`, `notesProvided` hoặc `noteProvided` tương ứng.

Sau khi chiếu hành động, quyền phủ quyết đệ quy sẽ loại bỏ mọi khái niệm về mật khẩu, hàm băm, mã
thông báo, OTP, ủy quyền, cookie, bí mật, phiên, thông tin xác thực, khóa API, liên kết thiết lập
hoặc liên kết lại.

## Đặt hàng và ranh giới SQL

- Thứ tự ổn định là `CreatedAt DESC, LogId DESC`.
- Phân trang và mọi bộ lọc được áp dụng trong SQL.
- Tất cả các giá trị truy vấn đều sử dụng tham số `mssql` đã nhập.
- Tìm kiếm không bao giờ ghép văn bản yêu cầu vào SQL.
- Nhãn hiển thị tác nhân và mục tiêu đến từ các kết nối được phê duyệt chứ không phải siêu dữ liệu.

## Tuyến đường kế thừa

Giao diện Quản trị viên di chuyển sang `/api/admin/audit-logs`. `GET /api/users/audit-logs` trở
thành một đường dẫn không có chức năng đã ngừng hoạt động, trả về HTTP `404` với mã `NOT_FOUND` và
không bao giờ gọi dịch vụ kiểm tra hoặc quản lý người dùng. Trình bảo vệ hưu trí rõ ràng này ngăn
đường dẫn đi qua xác thực `/:userId` động và trả về `400` không chính xác.

## Các xét nghiệm cần thiết sau H1

- Xác thực và ủy quyền quản trị viên chạy trước khi xác thực chi tiết.
- Ranh giới trang/giới hạn/q/hành động/tác nhân/ngày không hợp lệ trả về `VALIDATION_ERROR`.
- Xác thực `from <= to`.
- Ổn định phân trang/thứ tự và gõ các thông số SQL.
- `q` và mọi bộ lọc hoạt động độc lập và kết hợp.
- Mọi máy chiếu hành động hiện tại đều có độ bao phủ tích cực, hình dạng không đúng định dạng và khóa thù địch.
- Hành động không xác định và JSON không hợp lệ trả về chi tiết trống.
- Không có ghi chú thô/lý do/email/số nhận dạng/ID mã thông báo và các đối tượng lồng nhau.
- Giao diện người dùng sử dụng điểm cuối chuẩn, bỏ qua các truy vấn trống, bộ lọc dây và chỉ hiển thị các trường được chiếu.
- Tuyến kế thừa trả về `404 NOT_FOUND` và không gọi dịch vụ nào.

## Làm rõ quyền sở hữu tệp

`frontend/test/adminApi.test.js` sở hữu hợp đồng truy vấn/điểm cuối `frontend/src/api/adminApi.js`
trực tiếp. `frontend/test/userManagementApi.test.js` sở hữu việc loại bỏ lệnh gọi API quản lý người
dùng cũ. `frontend/test/userManagementFrontend.test.js` sở hữu hành vi lọc và kết xuất.

## Ngoài phạm vi

- Kiểm tra ghi, xóa/cập nhật kiểm tra, xuất, thay đổi lược đồ, phân tích trang tổng quan, thay đổi chất lượng siêu dữ liệu của người viết, trả về lý do/ghi chú văn bản tự do thô và thay đổi việc thực thi trạng thái tài khoản xác thực.

## Khuyến nghị H1

Phê duyệt hợp đồng đúng như đã viết. Bất kỳ bí danh tương thích, bộ lọc hành động mặc định ẩn, hiển
thị siêu dữ liệu/văn bản tự do thô, thay đổi tên truy vấn hoặc mở rộng xác thực đều yêu cầu bản sửa
đổi H1 rõ ràng trước khi triển khai.
