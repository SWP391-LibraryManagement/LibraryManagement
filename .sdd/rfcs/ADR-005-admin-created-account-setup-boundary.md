# ADR-005: Ranh giới thiết lập tài khoản do quản trị viên tạo

Trạng thái: ĐÃ CHẤP NHẬN - ĐÃ TRIỂN KHAI CHO LÁT CẮT THIẾT LẬP TÀI KHOẢN ĐƯỢC PHÊ DUYỆT

Ngày: 2026-07-15

Tính năng bị ảnh hưởng: Xác thực FE02, Quản lý thông báo FE10, Quản lý người dùng & vai trò FE11

Bằng chứng rà soát: con người đã phê duyệt vào 2026-07-15; `FE11-S01..S07` đã vượt qua xác thực và hành vi tích hợp vẫn là ranh giới được chấp nhận. Phần triển khai FE11 còn lại tiếp tục được hoãn.

## Bối cảnh

FE11 cho phép Quản trị viên tạo tài khoản Thành viên và Thủ thư mà không nhập hoặc nhìn thấy mật khẩu. Tài liệu và nguyên mẫu hiện tại không thống nhất về trạng thái tài khoản và ranh giới phân phối:

- FE02 và hợp đồng API dùng chung coi tài khoản do quản trị viên tạo là `INACTIVE` cho đến khi hoàn tất thiết lập mật khẩu.
- `SPEC.md` của FE11 và phần triển khai hiện tại trong repository tạo tài khoản ở trạng thái `ACTIVE` ngay lập tức.
- FE11 tạo token `ACCOUNT_SETUP` nhưng xếp hàng thông báo `ACCOUNT_VERIFICATION` từ nguồn `FE11` mà không có liên kết thiết lập.
- ADR-004 chỉ cho phép requester gắn với `FE02` gửi `ACCOUNT_VERIFICATION` hoặc `PASSWORD_RESET`, vì vậy FE11 không được tái sử dụng hai loại này.

Dự án cần một vòng đời mang tính xác định để giữ nguyên kiểm soát truy cập, tránh làm lộ thông tin xác thực thiết lập và cung cấp đường khôi phục khi phân phối thất bại hoặc token hết hạn.

## Quyết định

### Quyền sở hữu

- FE11 sở hữu việc tạo tài khoản do Quản trị viên ủy quyền, gán vai trò ban đầu, phát hành token `ACCOUNT_SETUP`, cho phép gửi lại và các sự kiện kiểm toán thiết lập tài khoản.
- FE02 sở hữu việc thực thi chính sách mật khẩu, xác thực/tiêu thụ token `ACCOUNT_SETUP`, băm mật khẩu và chuyển đổi cuối cùng `INACTIVE -> ACTIVE`.
- FE10 sở hữu xác thực mẫu `ACCOUNT_SETUP`, kết xuất trong bộ nhớ, phân phối qua nhà cung cấp, bản ghi trạng thái/lần thử phân phối và siêu dữ liệu kiểm toán phân phối an toàn.

### Trạng thái tài khoản ban đầu

- Tài khoản Thành viên và Thủ thư do quản trị viên tạo bắt đầu với `Status = INACTIVE`.
- Không thể đăng nhập bằng mật khẩu khi tài khoản ở trạng thái `INACTIVE`.
- Giá trị `PasswordHash` bắt buộc là mã băm bcrypt không thể sử dụng của một giá trị ngẫu nhiên do máy chủ tạo rồi loại bỏ ngay. Cấm dùng placeholder cố định.
- Khi hoàn tất thiết lập FE02 thành công, hệ thống lưu mã băm bcrypt do người dùng chọn, đặt `EmailVerifiedAt` nếu chưa có, đánh dấu token thiết lập đã dùng và chuyển tài khoản sang `ACTIVE` một cách nguyên tử.

### Token thiết lập

- FE11 tạo token `ACCOUNT_SETUP` opaque, an toàn về mật mã.
- FE11 chỉ lưu mã băm trong `AuthTokens` với thời hạn 24 giờ và nhận `TokenId` đã lưu bền.
- Token thô chỉ được tồn tại trong bộ nhớ tiến trình khi FE11 yêu cầu FE10 phân phối.
- Tham chiếu nguồn thông báo là `sourceEntityType: AuthToken` và `sourceEntityId: <TokenId>`.
- Khóa idempotency chính xác là `FE11:ACCOUNT_SETUP:<tokenId>`.

### Ranh giới phân phối FE10

- FE10 thêm cặp chuẩn `ACCOUNT_SETUP -> ACCOUNT_SETUP`.
- Mẫu yêu cầu `setupLink` và `expiresInHours`.
- Chỉ `createSourceNotificationRequester('FE11')` được gửi `ACCOUNT_SETUP`.
- Bên gọi HTTP dành cho nhân viên và requester gắn với nguồn khác nhận `403 SENSITIVE_NOTIFICATION_INTERNAL_ONLY`.
- FE10 kết xuất và gửi đồng bộ qua adapter nhà cung cấp đã cấu hình.
- FE10 không được lưu bền, ghi nhật ký, kiểm toán hoặc trả về token thiết lập thô, liên kết thiết lập hay tiêu đề/nội dung nhạy cảm đã kết xuất.
- FE10 chỉ lưu bền siêu dữ liệu nguồn `AuthToken` an toàn, trạng thái, bản tóm tắt lỗi chung và dữ liệu lần thử phân phối.

### Lỗi tạo và phân phối

- Người dùng, hồ sơ, vai trò ban đầu, token `ACCOUNT_SETUP` và mục kiểm toán FE11 nằm trong một giao dịch nguồn.
- Nhà cung cấp FE10 phân phối sau khi giao dịch nguồn commit; không đưa vào giao dịch phân tán.
- Lỗi phân phối FE10 không xóa hoặc kích hoạt tài khoản. Tài khoản vẫn `INACTIVE` và phản hồi tạo báo `setupDeliveryStatus: FAILED` mà không có chi tiết nhà cung cấp.
- Gửi thành công báo `setupDeliveryStatus: SENT`.

### Quản trị viên gửi lại

- FE11 cung cấp `POST /api/users/{userId}/resend-setup` cho người dùng Quản trị viên đã xác thực.
- Chỉ cho phép gửi lại khi tài khoản mục tiêu là `INACTIVE` và có lịch sử token `ACCOUNT_SETUP` trước đó chưa hoàn tất.
- Từ chối gửi lại cho tài khoản không hoạt động do tự đăng ký, tài khoản đang hoạt động, bị khóa, đã xóa và tài khoản đã hoàn tất thiết lập trước đó.
- FE11 thu hồi các token `ACCOUNT_SETUP` đang hoạt động trước đó, tạo token và ID token mới, rồi yêu cầu một thông báo FE10 mới bằng khóa idempotency mới.
- Áp dụng thời gian chờ 60 giây phía máy chủ giữa các sự kiện phát hành token thiết lập cho cùng một người dùng.
- Lỗi phân phối vẫn không chặn luồng và Quản trị viên có thể thử lại sau thời gian chờ.

## Tóm tắt API

Phản hồi tạo:

```json
{
  "userId": 10,
  "email": "new.user@example.test",
  "status": "INACTIVE",
  "roles": ["MEMBER"],
  "setupDeliveryStatus": "SENT",
  "message": "User created. Password setup email sent."
}
```

Phản hồi gửi lại:

```json
{
  "userId": 10,
  "status": "INACTIVE",
  "setupDeliveryStatus": "SENT",
  "message": "Password setup email sent."
}
```

Cả hai phản hồi đều không chứa token, liên kết, nội dung thông báo hoặc thông tin xác thực debug.

## Hệ quả

### Tích cực

- Trạng thái tài khoản có một nghĩa thống nhất trong FE02, FE10, FE11, tài liệu API, kiểm thử và hành vi SQL.
- Tài khoản không thể xác thực trước khi người dùng chứng minh quyền truy cập email và đặt mật khẩu.
- Quyền sở hữu thông báo thiết lập không còn xung đột với ranh giới OTP chỉ dành cho FE02 của ADR-004.
- Phân phối thất bại có đường khôi phục mang tính xác định cho Quản trị viên.

### Chi phí

- FE10 cần thêm một loại/mẫu thông báo nhạy cảm và quy tắc quyền sở hữu nguồn FE11.
- FE11 cần tạo token theo giao dịch, tích hợp phân phối, hành vi gửi lại và kiểm thử service/route tập trung.
- Kiểm thử hoàn tất thiết lập FE02 phải chứng minh việc kích hoạt nguyên tử và xử lý token dùng một lần.

## Xác minh

1. Tài khoản do quản trị viên tạo được lưu ở trạng thái `INACTIVE` với vai trò yêu cầu và mã băm bcrypt không thể sử dụng.
2. Không có token/liên kết thiết lập thô trong nơi lưu bền, nhật ký, bản kiểm toán, phản hồi HTTP hoặc trường debug chỉ dùng cho kiểm thử.
3. Chỉ requester gắn với FE11 được gửi `ACCOUNT_SETUP`.
4. Hoàn tất thiết lập hợp lệ cập nhật nguyên tử mật khẩu, dấu thời gian xác minh email, trạng thái sử dụng token và trạng thái tài khoản.
5. Lỗi phân phối giữ tài khoản ở `INACTIVE` và chỉ làm lộ trạng thái an toàn.
6. Quản trị viên gửi lại sẽ thu hồi token đang hoạt động trước đó, thực thi thời gian chờ và tạo token/sự kiện/khóa idempotency mới.
7. Các lần tạo, hoàn tất thiết lập và gửi lại đồng thời vẫn giữ một vòng đời hợp lệ, không kích hoạt trùng hoặc tạo token có thể tái sử dụng.

## Ngoài phạm vi

- Đặt lại mật khẩu do quản trị viên khởi tạo cho tài khoản đã hoạt động.
- Gửi lại tự phục vụ công khai cho thiết lập tài khoản FE11.
- Kích hoạt lại tài khoản đã vô hiệu hóa.
- Tái sử dụng `ACCOUNT_VERIFICATION` hoặc `PASSWORD_RESET` để thiết lập tài khoản.
