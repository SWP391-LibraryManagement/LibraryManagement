# Hợp đồng API - mốc cơ sở giai đoạn 1

Trạng thái: PHASE 1 BASELINE; FE07-FE12 CONNECTED DEMO H1 APPROVED - AWAITING H3/MERGE
Ngày: 2026-06-10
Cập nhật lần cuối: 2026-08-03

## Phạm vi

Hợp đồng này nắm bắt cơ sở REST API của Tuần 4 để lập kế hoạch cho Sprint 1, tập trung vào:

- FE02 Xác thực
- FE11 Quản lý người dùng và vai trò

đặc tả chức năng vẫn là nguồn chuẩn. Nếu hợp đồng này xung đột với `SPEC.md` đã được phê
duyệt, hãy cập nhật hợp đồng này hoặc đặc tả thông qua việc xem xét trước khi triển khai.

## URL gốc

```text
/api
```

## Quy tắc chung

- Nội dung yêu cầu và phản hồi sử dụng JSON.
- Điểm cuối được bảo vệ yêu cầu `Authorization: Bearer <accessToken>`.
- Xác thực phía máy chủ là bắt buộc.
- Ủy quyền phía máy chủ là bắt buộc đối với các hành động được bảo vệ.
- Phản hồi lỗi không được để lộ dấu vết bộ công nghệ, băm mật khẩu, mã thông báo thô hoặc chi tiết SQL. Đăng nhập không được tiết lộ sự tồn tại của tài khoản đối với số nhận dạng không xác định hoặc mật khẩu không chính xác; phản hồi xác minh đang chờ xử lý FE02 chỉ được phép sau khi xác minh mật khẩu chính xác.

## Phong bì phản hồi

Phản hồi thành công có thể trả về trực tiếp JSON dành riêng cho tài nguyên.

Hình dạng phản hồi lỗi:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request.",
    "details": []
  }
}
```

Mã trạng thái HTTP phổ biến:

| Trạng thái | Ý nghĩa |
| --- | --- |
| 200 | Thành công |
| 201 | Đã tạo |
| 400 | Lỗi xác thực |
| 401 | Xác thực bị thiếu, không hợp lệ hoặc hết hạn |
| 403 | Đã xác thực nhưng không được ủy quyền hoặc thông tin xác thực chính xác yêu cầu xác minh email trước khi có thể phát hành phiên |
| 404 | Không tìm thấy tài nguyên |
| 409 | Xung đột với quy tắc unique/trạng thái |
| 429 | Giới hạn tỷ lệ hoặc đăng nhập thất bại quá nhiều lần |
| 500 | Lỗi máy chủ chung an toàn |

---

## FE02 Xác thực

Đặc tả nguồn: `.sdd/specs/feat-auth/SPEC.md`

### POST `/api/auth/register`

Tác nhân: Khách mời

Yêu cầu:

```json
{
  "email": "user@example.test",
  "username": "user01",
  "password": "Password1!",
  "confirmPassword": "Password1!",
  "fullName": "Demo User",
  "phoneNumber": "0900000000"
}
```

Phản hồi `201`:

```json
{
  "userId": 1,
  "email": "user@example.test",
  "message": "Verification email sent"
}
```

Ghi chú:

- Tạo người dùng chưa kích hoạt/chưa xác minh theo FE02.
- Gửi hoặc ghi lại email xác minh mô phỏng thông qua tích hợp FE10 khi khả dụng.
- Các yêu cầu username/email trùng lặp, bao gồm các cuộc đua chỉ mục duy nhất đồng thời, trả về `409 USERNAME_ALREADY_REGISTERED` hoặc `409 EMAIL_ALREADY_REGISTERED` mà không có thêm người dùng, mã thông báo xác minh hoặc trạng thái phân phối OTP.

### POST `/api/auth/verify-email`

Tác nhân: Khách mời

Yêu cầu chính (luồng OTP tương tác):

```json
{
  "email": "user@example.test",
  "otp": "123456"
}
```

Yêu cầu tương thích (liên kết xác minh kế thừa):

```json
{
  "token": "verification-token-from-email"
}
```

Phản hồi `200`:

```json
{
  "message": "Account verified. You can now login."
}
```

Chỉ có thể kích hoạt tài khoản tự đăng ký đang chờ xử lý đủ điều kiện. OTP và các yêu cầu mã thông
báo kế thừa cho một tài khoản đã bị vô hiệu hóa hoặc không đủ điều kiện sẽ không thành công nếu
không sử dụng thông tin xác thực.

### POST `/api/auth/resend-verification`

Tác nhân: Khách mời

Yêu cầu:

```json
{
  "email": "user@example.test"
}
```

Phản hồi `200`:

```json
{
  "message": "Verification email sent"
}
```

Ghi chú:

- Phản hồi phải tránh liệt kê email.
- Việc gửi lại thành công được giới hạn ở tài khoản tự đăng ký đủ điều kiện đang chờ xử lý và làm mất hiệu lực thông tin xác thực hoạt động trước đó của tài khoản đó; tài khoản thiết lập đã bị vô hiệu hóa và do quản trị viên tạo vẫn giữ lại phản hồi chung mà không cần mã thông báo xác minh mới.
- Giao diện người dùng áp dụng thời gian hồi chiêu 60 giây hiển thị sau khi gửi lại thành công và vô hiệu hóa các yêu cầu trùng lặp trong khi một yêu cầu đang chờ xử lý.

### POST `/api/auth/login`

Tác nhân: Khách mời

Yêu cầu:

```json
{
  "email": "user@example.test",
  "password": "Password1!"
}
```

Phản hồi `200`:

```json
{
  "userId": 1,
  "email": "user@example.test",
  "roles": ["MEMBER"],
  "accessToken": "jwt-access-token",
  "refreshToken": "refresh-token",
  "expiresIn": 900
}
```

Phản hồi `403` sau khi xác minh mật khẩu chính xác cho tài khoản tự đăng ký đủ điều kiện đang chờ xử lý:

```json
{
  "error": {
    "code": "EMAIL_VERIFICATION_REQUIRED",
    "message": "Email verification is required before login.",
    "details": {
      "email": "user@example.test"
    }
  }
}
```

Ghi chú:

- Mã thông báo truy cập hết hạn sau 15 phút.
- Mã thông báo làm mới sẽ hết hạn sau 7 ngày.
- Đang chờ tự đăng ký nhận được phản hồi khôi phục 403 và không có phiên; khách hàng mở `/verify-email` bằng email đã đăng ký.
- Mã định danh không xác định, mật khẩu sai, tài khoản bị vô hiệu hóa, tài khoản thiết lập do quản trị viên tạo và người dùng bị khóa sẽ không nhận được tín hiệu xác minh đang chờ xử lý.
- Đăng nhập thất bại phải được kiểm tra và giới hạn tỷ lệ.

### POST `/api/auth/refresh-token`

Tác nhân: Đã được xác thực hoặc nắm giữ mã thông báo làm mới hợp lệ

Yêu cầu:

```json
{
  "refreshToken": "refresh-token"
}
```

Phản hồi `200`:

```json
{
  "accessToken": "new-jwt-access-token",
  "refreshToken": "refresh-token",
  "expiresIn": 900
}
```

### POST `/api/auth/logout`

Tác nhân: Khách hàng trình bày mã thông báo làm mới

Yêu cầu:

```json
{
  "refreshToken": "refresh-token"
}
```

Phản hồi `200`:

```json
{
  "message": "Logged out"
}
```

Lưu ý: vô hiệu hóa phía máy chủ mã thông báo refresh/session.

### POST `/api/auth/change-password`

Tác nhân: Đã xác thực

Yêu cầu:

```json
{
  "currentPassword": "OldPassword1!",
  "newPassword": "NewPassword1!"
}
```

Phản hồi `200`:

```json
{
  "message": "Password changed"
}
```

### POST `/api/auth/forgot-password`

Tác nhân: Khách mời

Yêu cầu:

```json
{
  "email": "user@example.test"
}
```

Phản hồi `200`:

```json
{
  "message": "Password reset email sent"
}
```

Ghi chú:

- Phản hồi phải tránh liệt kê email.
- Các tài khoản đang hoạt động đủ điều kiện sẽ nhận được OTP đặt lại gồm sáu chữ số với thời hạn sử dụng được định cấu hình là 15 phút.

### POST `/api/auth/reset-password`

Tác nhân: Khách mời

Yêu cầu chính (luồng OTP tương tác):

```json
{
  "email": "user@example.test",
  "otp": "123456",
  "newPassword": "NewPassword1!"
}
```

Yêu cầu tương thích (đặt lại kế thừa hoặc liên kết thiết lập FE11):

```json
{
  "token": "reset-or-setup-token-from-email",
  "newPassword": "NewPassword1!"
}
```

Phản hồi `200`:

```json
{
  "message": "Password reset successful"
}
```

Quy tắc dành cho mã thông báo FE11 `ACCOUNT_SETUP` chuẩn:

- Tài khoản mục tiêu phải là `INACTIVE` và có lịch sử mã thông báo thiết lập FE11 chưa đầy đủ.
- Quá trình hoàn tất cập nhật nguyên tử hàm băm mật khẩu, `EmailVerifiedAt`, trường khóa, trạng thái, mã thông báo usage/revocation và kiểm tra.
- Thông tin xác thực đặt lại mật khẩu không thể kích hoạt các tài khoản không hoạt động thông thường.

### GET `/api/auth/me`

Tác nhân: Đã xác thực

Phản hồi `200`:

```json
{
  "userId": 1,
  "email": "user@example.test",
  "username": "user01",
  "roles": ["MEMBER"],
  "status": "ACTIVE"
}
```

---

## FE11 Quản lý người dùng và vai trò

Đặc tả nguồn: `.sdd/specs/feat-user-role-management/SPEC.md`

Tất cả các điểm cuối FE11 đều yêu cầu vai trò Quản trị viên được xác thực.

### GET `/api/users`

Truy vấn:

| Tên | Loại | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| trang | số | Không | Mặc định 1 |
| giới hạn | số | Không | Mặc định 20 |
| trạng thái | chuỗi | Không | `ACTIVE`, `INACTIVE`, `LOCKED` |
| vai trò | chuỗi | Không | `ADMIN`, `LIBRARIAN`, `MEMBER`; đầu vào không phân biệt chữ hoa chữ thường được chuẩn hóa |
| tìm kiếm | chuỗi | Không | Đã cắt bớt tìm kiếm email/đầy đủ-name/người dùng-ID; 1..200 ký tự khi được cung cấp |

Phản hồi `200`:

```json
{
  "data": [
    {
      "userId": 1,
      "username": "demo_admin",
      "email": "demo.admin@example.test",
      "phoneNumber": "0900000001",
      "fullName": "Demo Admin",
      "address": "Hanoi",
      "status": "ACTIVE",
      "roles": ["ADMIN"],
      "createdAt": "2026-07-01T08:00:00.000Z",
      "updatedAt": "2026-07-18T08:00:00.000Z",
      "lastLoginAt": "2026-07-18T07:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Phong bì danh sách được phê duyệt chứa chính xác `data` và `pagination`. Bộ đếm quản trị toàn cầu
được đọc độc lập với FE12 `GET /api/reports/users` (`totals.users`, `usersByStatus` và
`usersByRole`) và không bắt nguồn từ phản hồi được phân trang này. `updatedAt` là phiên bản hiệu quả
mới nhất trên `Users` và `UserProfiles`, do đó, các bản cập nhật tự phục vụ của FE03 và các bản cập
nhật dành cho Quản trị viên FE11 đều tham gia vào cùng một ranh giới lạc quan-đồng thời.

### GET `/api/users/{userId}`

Phản hồi `200`:

```json
{
  "userId": 1,
  "username": "demo_admin",
  "email": "demo.admin@example.test",
  "phoneNumber": "0900000001",
  "fullName": "Demo Admin",
  "address": "Hanoi",
  "status": "ACTIVE",
  "roles": ["ADMIN"],
  "createdAt": "2026-07-01T08:00:00.000Z",
  "updatedAt": "2026-07-18T08:00:00.000Z",
  "lastLoginAt": "2026-07-18T07:30:00.000Z",
  "relatedSummary": {
    "activeBorrowingCount": 0,
    "unpaidFineTotal": 0,
    "openReservationCount": 0
  }
}
```

Lưu ý: `relatedSummary` chỉ có thông tin chi tiết và mỗi giá trị được mặc định là số 0. `updatedAt`
là phiên bản hiệu quả mới nhất trên `Users` và `UserProfiles`. Phản hồi không bao giờ được trả về
giá trị băm mật khẩu, mã thông báo xác thực thô hoặc băm, số nhận dạng refresh/session, liên kết
setup/đặt lại, tải trọng của nhà cung cấp hoặc siêu dữ liệu kiểm tra bí mật.

### POST `/api/users`

Yêu cầu:

```json
{
  "email": "new.librarian@example.test",
  "username": "new_librarian",
  "fullName": "New Librarian",
  "type": "librarian",
  "phone": "0900000009",
  "address": "Hanoi"
}
```

Phản hồi `201`:

```json
{
  "userId": 10,
  "email": "new.librarian@example.test",
  "status": "INACTIVE",
  "roles": ["LIBRARIAN"],
  "setupDeliveryStatus": "SENT",
  "message": "User created. Password setup email sent."
}
```

Ghi chú:

- Người dùng, hồ sơ, vai trò, mã thông báo thiết lập đã băm và cam kết kiểm tra nguyên tử trước khi phân phối FE10.
- Ủy quyền xác thực/quản trị viên và đầu vào chuẩn hóa được xác thực trước lệnh gọi kho lưu trữ; `email` tối đa là 255 và `fullName` tối đa là 100.
- Giao dịch nguồn xác nhận lại Quản trị viên đang hoạt động và thực hiện kiểm tra tính duy nhất email/username được chuẩn hóa có thẩm quyền trước khi chèn.
- Email được chuẩn hóa trùng lặp sẽ trả về `409 EMAIL_ALREADY_EXISTS`, không tồn tại trạng thái nguồn một phần và không yêu cầu gửi FE10.
- bàn giao thất bại trả về `setupDeliveryStatus: "FAILED"`; tài khoản vẫn là `INACTIVE` và không có thông tin chi tiết về nhà cung cấp hoặc thông tin xác thực thiết lập nào được trả về.
- Quản trị viên không bao giờ gửi hoặc nhận mật khẩu, mã thông báo thô, liên kết thiết lập hoặc thông tin xác thực gỡ lỗi.

### POST `/api/users/{userId}/resend-setup`

Tác nhân: Quản trị viên

Yêu cầu:

```json
{}
```

Phản hồi `200`:

```json
{
  "userId": 10,
  "status": "INACTIVE",
  "setupDeliveryStatus": "SENT",
  "message": "Password setup email sent."
}
```

Quy tắc:

- Chỉ những tài khoản do quản trị viên tạo chưa hoàn chỉnh mới đủ điều kiện.
- Giao dịch nguồn xác nhận lại Quản trị viên đang hoạt động trước khi khóa lịch sử thiết lập mục tiêu.
- FE11 thu hồi mã thông báo thiết lập hoạt động trước đó và tạo token/event/key. mới 24 giờ
- Thời gian hồi chiêu phía máy chủ là 60 giây áp dụng cho mỗi tài khoản mục tiêu.
- Các tài khoản đang hoạt động, bị khóa, tự đăng ký không hoạt động, đã thiết lập xong hoặc bị giới hạn thời gian hồi chiêu đều bị từ chối mà không cấp thông tin xác thực.

### PUT `/api/users/{userId}`

Yêu cầu:

```json
{
  "expectedUpdatedAt": "2026-07-18T08:00:00.000Z",
  "fullName": "Nguyễn Văn An",
  "phone": "0900000000",
  "address": "Hà Nội"
}
```

Phản hồi `200`:

Mục tiêu có thể có vai trò `MEMBER`, `LIBRARIAN` hoặc `ADMIN`. Quản trị viên có thể cập nhật
`fullName` (bắt buộc khi được cung cấp, tối đa 100), `phone` có thể rỗng (tối đa 20, xác thực ký tự
điện thoại) và `address` có thể rỗng (tối đa 255); ít nhất một trường có thể chỉnh sửa phải được
cung cấp. Phản hồi là `UserManagementView` được cập nhật có thẩm quyền. Lệnh ngừng hoạt động sẽ trả
về DTO hiện tại với `updatedAt` hiệu quả không thay đổi và không có cuộc kiểm tra thành công nào.
Yêu cầu cũ trả về `409 STALE_USER_STATE`.

FE03 tự phục vụ và điểm cuối Quản trị viên FE11 này viết các trường hồ sơ giống nhau và chia sẻ
phiên bản đồng thời hiệu quả mới nhất. Email tài khoản hiện tại vẫn ở chế độ chỉ đọc cho đến khi
luồng thay đổi FE02 đã được xác minh được phê duyệt. Nếu điểm cuối này nhận được `email`,
`department`, `specialization`, một trường không xác định hoặc một tải trọng trộn với một trường
được phép, thì nó sẽ trả về nguyên tử `403 MANAGED_USER_UPDATE_FORBIDDEN`; không có trường, phiên
bản hiệu quả hoặc thay đổi kiểm tra thành công.

### PATCH `/api/users/{userId}/status`

Yêu cầu:

```json
{
  "status": "INACTIVE",
  "expectedUpdatedAt": "2026-07-18T08:00:00.000Z"
}
```

Phản hồi `200`:

Phản hồi là `UserManagementView` có thẩm quyền.

Quy tắc:

- Quản trị viên không thể tự hủy kích hoạt.
- Chỉ các tài khoản `ACTIVE` và `LOCKED` mới chuyển sang `INACTIVE`.
- `INACTIVE` có giá trị rỗng `deactivatedAt` trả về `409 ACCOUNT_PENDING_ACTIVATION`; trạng thái đã ngừng hoạt động là trạng thái không hoạt động bình thường.
- `expectedUpdatedAt` được so sánh với `COALESCE(Users.UpdatedAt, Users.CreatedAt)`; trạng thái cũ trả về `409 STALE_USER_STATE` mà không có thao tác ghi về vòng đời, thông tin xác thực hoặc kiểm tra.
- Người dùng có lượt mượn đang hoạt động không thể bị vô hiệu hóa.
- Việc hủy kích hoạt sẽ thiết lập nguyên tử `deactivatedAt`, thu hồi thông tin xác thực `REFRESH` đang hoạt động, ghi kiểm tra và không xóa vĩnh viễn dữ liệu.

### PUT `/api/users/{userId}/role`

Yêu cầu:

```json
{
  "roleId": 2
}
```

Phản hồi `200`: DTO quản lý người dùng an toàn có thẩm quyền. Mảng `roles` tương thích của nó chứa
chính xác một vai trò.

Quy tắc:

- Vai trò không thay đổi trong Giai đoạn 1.
- Mỗi tài khoản được duy trì đều có chính xác một vai trò loại trừ lẫn nhau.
- Nội dung yêu cầu chấp nhận chính xác một số dương `roleId`; các trường không xác định, bị thiếu hoặc không đúng định dạng trả về `400 VALIDATION_ERROR`.
- Thay thế sẽ xóa ánh xạ hiện tại, chèn ánh xạ đã chọn, thu hồi thông tin xác thực `REFRESH` đang hoạt động của tài khoản đích và ghi kiểm tra vào một giao dịch.
- Tài khoản đích phải xác thực lại trước khi sử dụng vai trò thay thế; API được bảo vệ tải lại vai trò duy nhất hiện tại thông qua FE02.
- Việc chọn vai trò duy nhất hiện tại là không hoạt động bình thường và không có kiểm tra thay đổi vai trò.
- Vai trò Quản trị viên hoạt động gần đây nhất không được thay thế.

### GET `/api/admin/permissions`

Tác nhân: Quản trị viên được xác thực. Xác thực và ủy quyền quản trị viên thực hiện trước khi xử lý
bộ điều khiển. Điểm cuối không chấp nhận tham số nội dung hoặc truy vấn và không thực hiện thao tác ghi.

Phản hồi `200` có chính xác hai trường cấp cao nhất:

- `roles`: đặt hàng `ADMIN`, `LIBRARIAN`, `MEMBER`; mỗi đối tượng chỉ chứa `roleName` và `label`.
- `permissions`: 15 quy tắc Giai đoạn 1 được sắp xếp dưới đây; mỗi đối tượng chỉ chứa `permissionKey`, `label`, `moduleKey`, `moduleLabel` và `allowedRoles`.

Các giá trị vai trò được phép là `ADMIN`, `LIBRARIAN` và `MEMBER`; mảng có tính xác định và không
chứa bản sao. FE12 `GET /api/reports/users` vẫn là chủ sở hữu số lượng `usersByRole` toàn cầu và
giao diện người dùng chỉ tham gia hai phản hồi bằng `roleName`.

| Mô-đun | Khóa cấp phép | Nhãn | Vai trò được phép |
| --- | --- | --- | --- |
| Người dùng & Vai trò | `USER_VIEW` | Xem người dùng | ADMIN |
| Người dùng & Vai trò | `USER_CREATE` | Tạo tài khoản | ADMIN |
| Người dùng & Vai trò | `USER_UPDATE` | Cập nhật các trường hồ sơ người dùng được quản lý | ADMIN |
| Người dùng & Vai trò | `USER_DEACTIVATE` | Vô hiệu hóa tài khoản | ADMIN |
| Người dùng & Vai trò | `ROLE_MANAGE` | Quản lý vai trò | ADMIN |
| Người dùng & Vai trò | `AUDIT_VIEW` | Xem nhật ký kiểm toán | ADMIN |
| Thư viện | `CATALOG_MANAGE` | Quản lý danh mục thư viện | ADMIN, LIBRARIAN |
| Thư viện | `METADATA_MANAGE` | Quản lý authors/publishers/categories | ADMIN |
| mượn sách/trả sách | `BORROW_APPROVE_REJECT` | Yêu cầu mượn phê duyệt/từ chối | ADMIN, LIBRARIAN |
| mượn sách/trả sách | `RETURN_RENEW_PROCESS` | Quy trình trả sách và gia hạn | ADMIN, LIBRARIAN |
| Khoản phạt | `FINE_CALCULATE_COLLECT` | Tính và thu khoản phạt | ADMIN, LIBRARIAN |
| Khoản phạt | `FINE_WAIVE_CANCEL` | Miễn hoặc hủy bỏ khoản phạt | ADMIN |
| Báo cáo | `REPORT_VIEW` | Xem báo cáo | ADMIN, LIBRARIAN |
| Mượn/trả sách | `BORROW_REQUEST_CREATE` | Tạo yêu cầu mượn | MEMBER |
| Mượn/trả sách | `BORROW_HISTORY_VIEW_OWN` | Xem lịch sử mượn của chính mình | MEMBER |

Lỗi: `401` dành cho xác thực missing/invalid và `403` dành cho người gọi không phải Quản trị viên đã
được xác thực.

### GET `/api/admin/audit-logs`

Tác nhân: Quản trị viên được xác thực. Xác thực và ủy quyền quản trị viên chạy trước khi xác thực
truy vấn chi tiết.

| Truy vấn | Loại | Bắt buộc | Hợp đồng |
| --- | --- | --- | --- |
| `page` | số nguyên | Không | `1` mặc định; tối thiểu `1` |
| `limit` | số nguyên | Không | `20` mặc định; phạm vi `1..100` |
| `q` | chuỗi | Không | Đã cắt `1..100`; hành động tìm kiếm, tên tác nhân email/đầy đủ, loại mục tiêu và văn bản ID mục tiêu |
| `action` | chuỗi | Không | Cắt tỉa hành động chính xác, `1..100` |
| `actorId` | số nguyên | Không | ID người dùng tích cực |
| `from` | ngày | Không | Bao gồm giới hạn dưới `YYYY-MM-DD` |
| `to` | ngày | Không | Bao gồm giới hạn trên `YYYY-MM-DD`; không được đặt chỗ `from` |

Phản hồi `200`:

```json
{
  "data": [
    {
      "logId": 10,
      "action": "USER_ROLE_ASSIGN",
      "actor": {
        "userId": 7,
        "email": "admin@example.test",
        "fullName": "Admin User"
      },
      "target": {
        "type": "USER",
        "id": 15,
        "label": "member@example.test"
      },
      "details": {
        "roleId": 2,
        "roleName": "LIBRARIAN"
      },
      "ipAddress": "203.0.113.10",
      "createdAt": "2026-07-18T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Quy tắc:

- Các hàng được sắp xếp theo `CreatedAt DESC, LogId DESC`; chạy lọc và phân trang trong SQL với các tham số đã nhập.
- `details` là danh sách cho phép nhận biết hành động. `Metadata`, `UserAgent` thô, mật khẩu, hàm băm, mã thông báo, OTP, phiên, thông tin xác thực, liên kết setup/đặt lại, notes/reasons/emails/identifiers thô, đường dẫn thô và các đối tượng lồng nhau không được trả về.
- JSON không hợp lệ, arrays/scalars cấp cao nhất, hành động không xác định và hình dạng trường được chiếu không hợp lệ trả về `details: {}`.
- Chỉ các mục tiêu có loại `USER`, `USERS` hoặc `ACCOUNT` mới có thể nhận được nhãn người dùng đã tham gia. Các loại mục tiêu khác trả về `label: null`.
- Kết quả trống trả về `totalPages: 0`.
- Đường dẫn `GET /api/users/audit-logs` đã ngừng hoạt động luôn trả về `404 NOT_FOUND` và không phải là bí danh tương thích.

### GET `/api/admin/requests`

Tác nhân: Quản trị viên được xác thực. Xác thực và ủy quyền quản trị viên chạy trước khi xác thực
truy vấn chi tiết.

| Truy vấn | Loại | Bắt buộc | Hợp đồng |
| --- | --- | --- | --- |
| `page` | số nguyên | Không | `1` mặc định; tối thiểu `1` |
| `limit` | số nguyên | Không | `20` mặc định; phạm vi `1..100` |
| `q` | chuỗi | Không | Đã cắt `1..100`; chỉ tìm kiếm tên sách, tên đầy đủ của thành viên và email thành viên |
| `status` | chuỗi | Không | `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED` hoặc `CANCELLED` |
| `from` | ngày | Không | Bao gồm `YYYY-MM-DD` giới hạn dưới trên `RequestDate` |
| `to` | ngày | Không | Bao gồm giới hạn trên `YYYY-MM-DD`; không được đặt chỗ `from` |

Phản hồi `200` chứa chính xác `data` và `pagination`:

```json
{
  "data": [
    {
      "requestId": 25,
      "requestDate": "2026-07-19T08:00:00.000Z",
      "status": "PENDING",
      "member": {
        "userId": 10,
        "fullName": "Member Name",
        "email": "member@example.test",
        "phoneNumber": "0900000000"
      },
      "itemCount": 2,
      "bookTitles": ["Book A", "Book B"],
      "categories": ["Category A"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Quy tắc:

- Các hàng được sắp xếp theo `RequestDate DESC, RequestId DESC`; truy vấn số lượng và dữ liệu có cùng phạm vi bộ lọc được nhập và thoát.
- Phân trang áp dụng cho các tiêu đề `BorrowRequests` riêng biệt trước khi các hàng chi tiết con được nối.
- `bookTitles` duy trì một tiêu đề không rỗng cho mỗi chi tiết theo thứ tự `BorrowDetailId ASC`; `categories` chứa các tên không null duy nhất theo thứ tự xuất hiện lần đầu.
- Dấu phẩy hợp lệ trong titles/categories không được phân tích cú pháp bằng cách tách đầu ra `STRING_AGG`.
- Giao diện người dùng sử dụng phân trang máy chủ và `from`/`to` chuẩn; `fromDate`/`toDate` kế thừa và việc phân chia khách hàng không phải là một phần của hợp đồng.

### GET `/api/admin/requests/{requestId}`

Tác nhân: Quản trị viên được xác thực. Việc ủy ​​quyền chạy trước khi xác thực đường dẫn số nguyên
dương. ID không hợp lệ trả về `400 VALIDATION_ERROR`; yêu cầu bị thiếu trả về `404
BORROW_REQUEST_NOT_FOUND`.

Phản hồi `200`:

```json
{
  "requestId": 25,
  "requestDate": "2026-07-19T08:00:00.000Z",
  "status": "PENDING",
  "createdAt": "2026-07-19T08:00:00.000Z",
  "updatedAt": null,
  "member": {
    "userId": 10,
    "memberId": 7,
    "fullName": "Member Name",
    "email": "member@example.test",
    "phoneNumber": "0900000000",
    "status": "ACTIVE"
  },
  "items": [
    {
      "borrowDetailId": 80,
      "copyId": 44,
      "barcode": "BC-0044",
      "title": "Book A",
      "author": "Author A",
      "location": "Shelf A",
      "status": "REQUESTED"
    }
  ],
  "lifecycle": {
    "approvedAt": null,
    "rejectedAt": null,
    "processedAt": null
  }
}
```

FE11 chiếu DTO này từ ranh giới đọc FE07 và không thêm chi tiết yêu cầu trùng lặp SQL hoặc logic đột
biến. Mật khẩu, mã thông báo, phiên, thông tin xác thực, siêu dữ liệu kiểm tra thô và các trường hồ
sơ không liên quan đều bị cấm.

Các thao tác ghi yêu cầu vẫn thuộc sở hữu độc quyền của FE07:

- `PATCH /api/borrow-requests/{requestId}/approve`
- `PATCH /api/borrow-requests/{requestId}/reject`

Không tồn tại bí danh `/api/admin/requests/{requestId}/approve` hoặc `/reject`. Chỉ các yêu cầu
`PENDING` mới hiển thị các điều khiển; mọi thao tác ghi trực tiếp không phải `PENDING` đều trả về `409
BORROW_REQUEST_NOT_PENDING` mà không có thay đổi trạng thái thành công hoặc kiểm tra.

---

## Ghi chú thực hiện cho tuần 4

- tệp này là hợp đồng quy hoạch chứ không phải là bản phê duyệt thực hiện.
- FE11 Khóa sổ thiết kế/kế hoạch/tasks được phê duyệt để quản trị; công việc sản phẩm vẫn bị chặn cho đến khi PR quản trị vượt qua kiểm tra, nhận H3 và hợp nhất.
- Kiểm tra máy chủ phải bao gồm xác thực, ủy quyền và hành vi lỗi nhạy cảm về bảo mật.

## FE07-Lô trình diễn liên hoàn FE12

Lô: `BATCH-FE07-FE12-CONNECTED-DEMO-2026-07-29`.

### Thành viên trả sách phụ gia FE07

Phản hồi trả về chuẩn có thể bao gồm:

```json
{
  "reservationQueueAction": {
    "copyId": 123,
    "hasActiveQueue": true,
    "actionPath": "/librarian/reservations"
  }
}
```

Thành viên này ở chế độ chỉ đọc. Nó không xử lý hoặc thay đổi hàng đợi FE08.

### Mẫu kết quả mượn sách FE10

FE10 chấp nhận các yêu cầu nguồn FE07 chuẩn cho `BORROW_REQUEST_APPROVED`,
`BORROW_REQUEST_REJECTED`, `BORROW_RENEWED` và `BORROW_RETURNED`. Mỗi khóa nguồn là bình thường. Các
hàng trong hộp thư đến cá nhân chỉ sử dụng đường dẫn hành động cố định `/borrowing/history`; người
gọi không thể cung cấp URL và tải trọng không thể bao gồm lý do từ chối hoặc dữ liệu
nhạy cảm/nhà cung cấp.

### GET `/api/reports/operations-summary`

Vai trò: `LIBRARIAN`, `ADMIN`. Danh sách cho phép truy vấn: trống.

```json
{
  "pendingBorrowRequests": 1,
  "activeLoans": 2,
  "overdueLoans": 1,
  "openReservations": 2,
  "availableCopies": 3,
  "lowStockBooks": 2,
  "generatedAt": "2026-07-29T03:00:00.000Z"
}
```

Query key không xác định trả về `400` an toàn trước khi service/repository chạy.
Thành viên nhận `403`; thiếu xác thực nhận `401`. Service lấy `businessDate` và `generatedAt` từ một
lần đọc clock có kiểm soát rồi truyền ngày rõ ràng tới cả SQL và in-memory report repositories.
`availableCopies` chỉ đếm hàng có `Books.Status = 'ACTIVE'` và
`BookCopies.Status = 'AVAILABLE'`; `lowStockBooks` chỉ đếm sách đang hoạt động có 0..2 bản sẵn có.

## FE01 Tiếp tục luồng lưu thông công khai

`GET /api/books` và `GET /api/books/{bookId}` giữ summary công khai an toàn hiện có và bổ sung field
`circulationAction` bắt buộc.

| Field | Values | Consumer |
| --- | --- | --- |
| `availabilityStatus` | `AVAILABLE`, `UNAVAILABLE` | Trình bày trạng thái vật lý cấp cao hiện có, đặc biệt cho nhân viên |
| `circulationAction` | `BORROW`, `RESERVE`, `WAIT`, `UNAVAILABLE` | Chỉ dùng cho luồng tiếp tục của Thành viên |

`BORROW` nghĩa là có ít nhất một bản sao của sách đang hoạt động ở trạng thái `AVAILABLE` và không có
claim FE07 `PENDING + REQUESTED` hoặc claim FE08 `ACTIVE`/`NOTIFIED` đang mở. `RESERVE` nghĩa là chưa
có bản sao mượn ngay nhưng bản sao `BORROWED`/`RESERVED` có thể vào FE08. `WAIT` nghĩa là chỉ còn
trạng thái claim/hàng đợi đang xử lý. `UNAVAILABLE` là fallback fail-closed.

Field này ở cấp đầu sách. Phản hồi công khai không được chứa `copyId`, barcode, location, chủ sở hữu
đặt chỗ, vị trí hàng đợi, danh tính Thành viên, số lượng bản sao hoặc raw workflow rows. Thay đổi chỉ
mang tính bổ sung; không đổi route, query allowlist, schema, status enum, borrowing limit hoặc
candidate endpoint.
