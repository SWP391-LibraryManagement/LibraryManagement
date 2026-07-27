# ADR-004: Ranh giới thông báo OTP xác thực

Trạng thái: ĐÃ PHÊ DUYỆT CHO ĐẶC TẢ
Ngày: 2026-07-15
Chủ sở hữu quyết định: Nhat
Tính năng bị ảnh hưởng: Xác thực FE02, Quản lý thông báo FE10

## Bối cảnh

FE02 dùng thông tin xác thực OTP sáu chữ số để xác minh tài khoản và đặt lại mật khẩu. Hiện tại, tính năng này tạo một bản ghi thông báo chưa đầy đủ và gửi OTP trực tiếp qua `emailService`.

Trong khi đó, FE10 định nghĩa các mẫu xác thực nhạy cảm dựa trên `verificationLink` và `resetLink`. Endpoint HTTP được bảo vệ dành cho nhân viên cũng chấp nhận `ACCOUNT_VERIFICATION` và `PASSWORD_RESET`, cho phép một nhân viên đã xác thực cung cấp nội dung xác thực nhạy cảm vốn chỉ được phép bắt nguồn từ FE02.

Điều này tạo ra hai chủ sở hữu phân phối, xung đột hợp đồng giữa OTP và liên kết, cùng một ranh giới HTTP không an toàn.

## Quyết định

### Quyền sở hữu

- FE02 sở hữu việc tạo, băm, hết hạn, thu hồi và xác thực OTP.
- FE10 sở hữu việc kết xuất, phân phối email, trạng thái thông báo, các lần thử và siêu dữ liệu kiểm toán thông báo an toàn.
- FE10 không được tạo, lưu bền, xác thực, ghi nhật ký, kiểm toán hoặc trả về OTP thô.
- Phản hồi HTTP công khai của FE02 không được làm lộ OTP xác minh/đặt lại thô, kể cả trong trường debug chỉ dùng cho kiểm thử. Kiểm thử thu OTP mang tính xác định qua phụ thuộc được inject thay vì qua phản hồi route.

### Hợp đồng yêu cầu nội bộ

FE02 dùng `createSourceNotificationRequester('FE02')` với:

```json
{
  "type": "ACCOUNT_VERIFICATION | PASSWORD_RESET",
  "channel": "EMAIL",
  "userId": 123,
  "recipientEmail": "member@example.test",
  "templateKey": "ACCOUNT_VERIFICATION | PASSWORD_RESET",
  "templateData": {
    "otp": "123456",
    "expiresInMinutes": 15
  },
  "sourceEntityType": "AuthToken",
  "sourceEntityId": 456,
  "idempotencyKey": "FE02:ACCOUNT_VERIFICATION:456"
}
```

Định dạng idempotency chính xác là `FE02:ACCOUNT_VERIFICATION:<tokenId>` và `FE02:PASSWORD_RESET:<tokenId>`. Chúng dùng `AuthTokens.TokenId` đã lưu bền, không bao giờ dùng giá trị OTP. Gửi lại tạo một token mới, vì vậy cũng tạo sự kiện/khóa thông báo mới.

### Ranh giới bảo mật

- Chỉ requester gắn với `FE02` được gửi `ACCOUNT_VERIFICATION` hoặc `PASSWORD_RESET`.
- Yêu cầu HTTP của nhân viên và bên yêu cầu được gắn với `FE07`, `FE08`, `FE09` hoặc `SYSTEM` phải nhận `403 SENSITIVE_NOTIFICATION_INTERNAL_ONLY` kèm thông báo `Sensitive authentication notifications must be requested internally.` cho cả hai loại nhạy cảm.
- Bên gọi HTTP không được cung cấp `sourceFeature`; FE10 trả về `400 SOURCE_FEATURE_HTTP_FORBIDDEN` kèm thông báo `Notification source cannot be supplied through HTTP.` Danh tính nguồn được ràng buộc khi khởi tạo bên yêu cầu nội bộ và không tồn tại với yêu cầu HTTP thủ công.

### Phân phối và lưu bền

- Mẫu xác thực yêu cầu `otp` và `expiresInMinutes`.
- FE10 kết xuất và gửi đồng bộ thông báo xác thực nhạy cảm qua adapter nhà cung cấp email đã cấu hình; kiểm thử dùng nhà cung cấp mock được inject.
- FE10 lưu bền siêu dữ liệu nguồn an toàn, `SENT` hoặc `FAILED`, lịch sử lần thử, dấu thời gian và bản tóm tắt lỗi an toàn cố định.
- FE10 không lưu bền OTP thô hoặc tiêu đề/nội dung nhạy cảm đã kết xuất.

### Chính sách lỗi

- Lỗi thông báo không rollback việc tạo tài khoản, tạo OTP hoặc xử lý yêu cầu đặt lại mật khẩu.
- FE02 bắt lỗi requester an toàn và giữ nguyên ngữ nghĩa phản hồi công khai hiện có.
- Không thể thử lại thông báo nhạy cảm thất bại từ nội dung đã lưu; FE02 phải phát hành sự kiện OTP/token mới.

## Ranh giới phạm vi

Trong phạm vi:

- Thông báo OTP xác minh tài khoản.
- Thông báo OTP đặt lại mật khẩu.
- Hạn chế nguồn nhân viên/nội bộ cho hai loại thông báo đó.
- Loại bỏ đường tạo bản ghi thông báo trùng lặp và gửi email trực tiếp của FE02 cho hai luồng đó.

Ngoài phạm vi:

- `CHANGE_PASSWORD_OTP`, vẫn là luồng email trực tiếp của FE02 cho đến khi một loại/ca sử dụng FE10 riêng được phê duyệt.
- Chấp nhận token xác minh/đặt lại legacy trong FE02; thiết lập tài khoản FE11 chuẩn chịu sự điều chỉnh của ADR-005.
- Tích hợp bên gọi FE09, UI thử lại, UI hộp thư đến, SMS, thông báo đẩy và chỉnh sửa mẫu.

## Hợp đồng xác minh

Phần triển khai phải chứng minh:

1. HTTP của nhân viên không thể gửi bất kỳ loại xác thực nhạy cảm nào.
2. Requester nội bộ không thuộc FE02 không thể gửi bất kỳ loại xác thực nhạy cảm nào.
3. FE02 có thể gửi cả hai mẫu OTP chuẩn.
4. Nhà cung cấp nhận OTP, còn nơi lưu bền, kiểm toán, nhật ký và phản hồi thì không.
5. FE02 thực hiện một yêu cầu phân phối cho mỗi token OTP mới tạo và không gửi trực tiếp trùng lặp.
6. Lỗi nhà cung cấp/requester không rollback luồng nguồn FE02.
7. Gửi lại tạo ID token và khóa idempotency mới.

## Hệ quả

- FE10 trở thành chủ sở hữu phân phối duy nhất cho UC45 và UC46.
- Đặc tả FE02 và FE10 nhất quán với UX OTP sáu chữ số đã triển khai.
- Việc phân phối xác thực nhạy cảm không còn bị lộ qua ranh giới HTTP dành cho nhân viên.
- Nhà cung cấp thực đã cấu hình có thể phân phối thông báo FE10 trong môi trường triển khai, còn kiểm thử vẫn mang tính xác định nhờ dependency injection.
