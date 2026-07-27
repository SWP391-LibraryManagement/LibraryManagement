# Xác thực đóng nợ Xác thực FE02 - 2026-07-19

Trạng thái: TOÀN BỘ CỤC BỘ VÀ CI PR ĐẠT; CHẤP THUẬN CỦA CON NGƯỜI ĐANG CHỜ

Phạm vi: `TD-018`, `TD-019` và `TD-020` trong PR nháp #40.

## Quyết định hợp đồng

- `TD-018` là khoảng trống bằng chứng kiểm thử. API FE02 đã phê duyệt đã hỗ trợ xác minh/đặt lại `{ email, otp }` chuẩn và từ chối đăng ký trùng cùng mật khẩu yếu.
- `TD-019` không cần triển khai. `Q-FE02-005`, `BR-FE02-008` và `NFR-FE02-SEC-005` phê duyệt việc khóa tài khoản đã biết cho Giai đoạn 1 và nêu rõ không triển khai giới hạn đăng nhập trên toàn IP.
- `TD-020` là lỗi xác thực công khai. `BR-FE02-007` và `NFR-FE02-SEC-010` yêu cầu phản hồi đăng nhập không tiết lộ email đã đăng ký hay chưa, trong khi `AC-FE02-007` chỉ yêu cầu từ chối đăng nhập tài khoản không hoạt động.

## Bằng chứng ĐỎ

Lệnh:

```powershell
npm.cmd test -- --runInBand --runTestsByPath tests/authRoutes.test.js
```

Kết quả trọng tâm ban đầu sau khi thêm các hồi quy: 29 đạt, 1 thất bại.

- Đăng nhập tài khoản không hoạt động trả về `403 ACCOUNT_INACTIVE`.
- Đăng nhập không xác định trả về `401 INVALID_CREDENTIALS`.
- Xác nhận tương đương phản hồi thất bại chính xác tại ranh giới dò liệt kê.

## Thay đổi production tối thiểu

`backend/src/services/authService.js` giữ sự kiện kiểm toán nội bộ `AUTH_LOGIN_INACTIVE` nhưng trả về vỏ công khai chung `401 INVALID_CREDENTIALS` được các nhánh email không xác định và mật khẩu không hợp lệ sử dụng.

Hành vi tài khoản bị khóa không đổi vì `FR-FE02-017` và `AC-FE02-008` yêu cầu rõ thông báo khóa tài khoản.

Không có tuyến, lược đồ, phụ thuộc, thông tin xác thực, thời hạn token, ngưỡng khóa hoặc hành vi frontend nào thay đổi.

## Bằng chứng XANH

Kết quả trọng tâm: **1/1 bộ, 30/30 kiểm thử đạt**.

Bằng chứng API mới chứng minh:

- đăng ký trùng trả về `409 EMAIL_ALREADY_REGISTERED` mà không có thêm người dùng, token, yêu cầu thông báo, thông báo hoặc email trực tiếp;
- đăng ký với mật khẩu yếu trả về `400 WEAK_PASSWORD` mà không lưu trạng thái xác thực;
- xác minh email/OTP chuẩn kích hoạt tài khoản và tiêu thụ OTP xác minh;
- đặt lại email/OTP chuẩn cập nhật mật khẩu và tiêu thụ OTP đặt lại;
- đặt lại chuẩn với mật khẩu yếu không thay đổi mật khẩu lẫn thông tin xác thực đặt lại;
- đăng nhập tài khoản không hoạt động và không xác định trả về cùng phản hồi `401 INVALID_CREDENTIALS`.

Bằng chứng mới cho phần bị ảnh hưởng/toàn bộ:

- hồi quy backend: 52/52 bộ, 893/893 kiểm thử;
- cổng độ bao phủ backend: câu lệnh 92.69%, nhánh 81.79%, hàm 96.55%, dòng 92.62%;
- tích hợp hệ thống: 1/1 bộ, 10/10 kiểm thử;
- truy vết FE01-FE12: mọi tính năng 100%, thực thi PASS;
- cú pháp JavaScript, quét bí mật độ tin cậy cao và vệ sinh diff: PASS.

## Bằng chứng CI của yêu cầu kéo

- Commit triển khai: `0040e0f978b51d8e4919f89610e25cbba4139c7d`.
- PR nháp: #40, sạch và có thể hợp nhất tại ranh giới đã ghi nhận.
- Lần chạy GitHub Actions: `29680011551`.
- Kết quả: PASS. Truy vết, hồi quy backend, tích hợp hệ thống, độ bao phủ, lint/kiểm thử/bản dựng frontend, E2E hệ thống Playwright và nhập tình trạng backend đều hoàn tất thành công.

## Cổng còn lại

Chấp thuận tích hợp cuối của con người cho FE01-FE12 vẫn được Định nghĩa Hoàn thành của dự án yêu cầu.
