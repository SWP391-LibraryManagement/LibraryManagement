# Đánh giá xác thực ranh giới Thiết lập tài khoản Xác thực - 2026-07-15

Trạng thái: TÍCH HỢP B7 HOÀN THÀNH

Nhánh: `fix/auth-account-setup-boundary`

## Phạm vi

Ghi nhận cổng xác thực Nhiệm vụ 7 cho vòng đời thiết lập tài khoản ADR-005 dùng chung bởi Xác thực FE02, Quản lý thông báo FE10 và Quản lý người dùng & vai trò FE11.

Các commit triển khai:

- `547f986` - quyền sở hữu nguồn thông báo nhạy cảm.
- `3e25875` - bộ điều hợp nhà cung cấp FE10 đã cấu hình.
- `ff885b7` - tạo tài khoản không hoạt động có giao dịch.
- `57068d2` - hoàn tất thiết lập FE02 nguyên tử.
- `d80b8f2` - gửi lại thiết lập của Quản trị viên.
- `fa63acc` - luồng khôi phục liên kết thiết lập frontend.

## Hành vi đã xác thực

- Tài khoản do Quản trị viên tạo vẫn là `INACTIVE` đến khi FE02 tiêu thụ một token `ACCOUNT_SETUP` FE11 hợp lệ.
- Việc tạo người dùng/hồ sơ/vai trò/token thiết lập/kiểm toán commit hoặc hoàn tác cùng nhau.
- FE10 chỉ chấp nhận `ACCOUNT_SETUP` từ bên yêu cầu được ràng buộc với `FE11`, dùng khả năng truy vết ID token `AuthToken` và không lưu thông tin xác thực thiết lập thô hoặc nội dung nhạy cảm đã kết xuất.
- Việc hoàn tất thiết lập FE02 cập nhật nguyên tử mật khẩu, xác minh email, trường khóa, trạng thái tài khoản, sử dụng/thu hồi token và trạng thái kiểm toán.
- Thông tin xác thực đặt lại mật khẩu không thể kích hoạt tài khoản không hoạt động.
- Gửi lại của Quản trị viên từ chối đích bị thiếu, đang hoạt động, bị khóa, bị xóa, tự đăng ký, đã hoàn tất và bị giới hạn thời gian chờ mà không phát thông tin xác thực.
- Lần gửi lại đủ điều kiện thu hồi các token thiết lập đang hoạt động trước đó, tạo token/sự kiện/khóa 24 giờ mới, kiểm toán trong giao dịch và coi lỗi nhà cung cấp là không chặn.
- Luồng truy vấn token frontend chỉ hiển thị điều khiển mật khẩu và xác nhận, gửi `{ token, newPassword }` và hiển thị thông báo liên kết không hợp lệ/hết hạn an toàn.

## Bằng chứng tự động

| Kiểm tra | Kết quả |
| --- | --- |
| Kiểm thử tích hợp trọng tâm FE02/FE10/FE11 cùng phần bị ảnh hưởng | PASS - 6 bộ, 170/170 kiểm thử |
| Kiểm thử frontend | PASS - 75/75 |
| Lint tệp frontend đã chạm | PASS |
| Bản dựng frontend production | PASS; chỉ có cảnh báo khối 982.35 kB hiện hữu |
| Thực thi truy vết | PASS; không tính năng bị thực thi nào dưới 70% |
| Quét thông tin xác thực/bí mật trên dòng đã đổi | PASS; không ghi/lưu thông tin xác thực hoặc thêm bí mật độ tin cậy cao |
| Quét phần giữ chỗ | PASS; kết quả khớp `ACCOUNT_SETUP_PENDING` duy nhất được thêm là xác nhận hồi quy phủ định |
| Kiểm tra khoảng trắng/xung đột diff nhánh | PASS |
| Trạng thái worktree trước chỉnh sửa bằng chứng | SẠCH |

Lệnh backend:

```text
npm.cmd test -- authRoutes.test.js notificationRoutes.test.js userManagementService.test.js userManagementRoutes.test.js integration.test.js systemIntegration.test.js --runInBand
```

Không chạy bộ SQL trực tiếp hoặc bộ SQL toàn bộ không liên quan, phù hợp với phạm vi Nhiệm vụ 7 đã phê duyệt.

## Đánh giá bảo mật

- SQL mới dùng đầu vào tham số hóa và giao dịch có khóa cho việc tạo, hoàn tất và gửi lại thiết lập.
- Token/liên kết thiết lập thô chỉ tồn tại trong bộ nhớ yêu cầu và đầu vào nhà cung cấp FE10; kiểm thử chứng minh chúng không được lưu hoặc trả về.
- Frontend suy ra token từ `useSearchParams` và không đặt nó vào trạng thái thành phần, nội dung trang, nơi lưu trình duyệt hoặc nhật ký.
- Các lần thử thiết lập không hợp lệ, hết hạn, đã dùng, bị thu hồi, không đủ điều kiện và đồng thời trả về lỗi an toàn mà không kích hoạt một phần.
- Các trường `debugOtp` chế độ kiểm thử/trường gỡ lỗi cũ FE02 có từ trước vẫn nằm ngoài lát cắt thiết lập tài khoản ADR-005. Không có hoặc không thêm `debugSetupToken`; phần tổng kết OTP ADR-004 vẫn được theo dõi riêng bởi FE02-T030..T033 và FE10-S02..S05.

## Lịch sử đánh giá của con người

Nhat đánh giá phần triển khai tăng dần đến Nhiệm vụ 6 và xác nhận rõ `đã review` cho gói Nhiệm vụ 7 này vào 2026-07-15. Việc này đóng FE02-T037, FE10-S08 và FE11-S07; bản thân nó không chọn tùy chọn hợp nhất hoặc đẩy.

## Bằng chứng tích hợp B7

- Ranh giới thiết lập tài khoản được hợp nhất vào `main` dưới dạng `c7f78213a62a83a133e9571c149468a054e48219`.
- Commit main `e8f467c7f53e75d36c2834429b92beafca819919` chứa phần hợp nhất đó.
- Lần chạy GitHub Actions CI `29392143926` hoàn tất thành công trên `e8f467c7f53e75d36c2834429b92beafca819919`.

Việc này hoàn tất bằng chứng tích hợp B7 cho lát cắt thiết lập tài khoản giới hạn. Nó không tuyên bố toàn bộ tính năng FE02, FE10 hoặc FE11 hoàn thành.

## Rủi ro còn lại

- Hành vi Azure SQL trực tiếp không được chạy lại trong Nhiệm vụ 7; ngữ nghĩa giao dịch được bao phủ bởi kiểm thử hoàn tác/đồng thời trọng tâm và đánh giá SQL, nhưng kiểm tra nhanh cơ sở dữ liệu đã triển khai vẫn là rủi ro tích hợp.
- Việc gửi SMTP thật phụ thuộc biến môi trường triển khai và tính khả dụng của nhà cung cấp; xác thực dùng hợp đồng bộ điều hợp đã cấu hình và hành vi nhà cung cấp được chèn thay vì gửi email thật.
- Vite báo khuyến cáo khối JavaScript 982.35 kB hiện có; điều này không chặn luồng thiết lập nhưng vẫn là nợ hiệu năng frontend.
- Nợ danh sách/cập nhật/vô hiệu hóa/quản lý vai trò người dùng FE11 vẫn bị hoãn rõ ràng ngoài lát cắt thiết lập tài khoản này.

## Danh sách kiểm tra dành cho Nhat

1. Xác nhận tài khoản do Quản trị viên tạo vẫn là `INACTIVE` trước thiết lập và chỉ trở thành `ACTIVE` sau khi hoàn tất liên kết thiết lập hợp lệ.
2. Xác nhận phản hồi tạo/gửi lại và UI không bao giờ hiển thị mật khẩu, token thiết lập, liên kết thiết lập hoặc chi tiết nhà cung cấp.
3. Xác nhận gửi lại từ chối tài khoản không đủ điều kiện và thực thi thời gian chờ 60 giây.
4. Xác nhận liên kết thiết lập không hợp lệ/hết hạn/đã dùng hiển thị lỗi frontend an toàn và không kích hoạt tài khoản.
5. Xác nhận hành vi OTP xác minh/đặt lại và `CHANGE_PASSWORD_OTP` hiện có không bị mở rộng bởi công việc ADR-005.

Kết luận: **Xác thực Nhiệm vụ 7, đánh giá của con người, hợp nhất và CI sau hợp nhất đã hoàn thành đến B7 cho lát cắt thiết lập tài khoản giới hạn.**
