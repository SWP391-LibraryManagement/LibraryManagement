# Tổng quan dự án

## 1. Tên dự án

**Hệ thống quản lý thư viện**

## 2. Mô tả vấn đề

Nhiều thư viện vẫn quản lý sách, thành viên, hồ sơ mượn, trả, giữ chỗ, khoản phạt theo cách thủ công
hoặc bằng các công cụ riêng biệt. Điều này có thể dẫn đến hồ sơ trùng lặp, khó theo dõi tình trạng
sẵn có của sách, quản lý trả sách bị chậm trễ và tính toán khoản phạt không chính xác.

Hệ thống quản lý thư viện được phát triển nhằm giúp thư viện quản lý sách, bản sao sách, thành viên,
hoạt động mượn và trả sách, đặt chỗ sách, khoản phạt, thông báo, người dùng, vai trò và báo cáo cơ
bản trong một hệ thống tập trung.

## 3. Mục tiêu dự án

Mục tiêu chính của Hệ thống quản lý thư viện là:

- Cho phép khách tìm kiếm, duyệt và xem thông tin sách.
- Hỗ trợ đăng ký tài khoản, xác thực và quản lý hồ sơ người dùng.
- Hỗ trợ việc đăng ký thành viên và quản lý trạng thái thành viên.
- Quản lý thông tin sách và bản sao sách vật lý.
- Hỗ trợ Thành viên mượn, trả, giữ, gia hạn sách.
- Giúp thủ thư xử lý các yêu cầu mượn, trả sách, đặt chỗ và khoản phạt.
- Cho phép quản trị viên quản lý người dùng, vai trò, chính sách mượn sách, chính sách phạt và báo cáo.
- Cung cấp các thông báo cơ bản về xác minh tài khoản, đặt lại mật khẩu, ngày đến hạn, sách quá hạn, đặt chỗ sách và khoản phạt.
- Giảm bớt công việc thủ công và cải thiện tính chính xác và khả năng truy vết của các hoạt động thư viện.

## 4. Người dùng mục tiêu

Hệ thống phục vụ các nhóm người dùng sau:

| Nhóm người dùng | Mô tả |
| -------------------- | ----------- |
| Khách | Một khách truy cập có thể tìm kiếm và xem thông tin sách công khai và đăng ký tài khoản. |
| Thành viên | Người dùng thư viện đã đăng ký có thể mượn sách, đặt chỗ sách, gia hạn lượt mượn, xem lịch sử mượn và xem khoản phạt. |
| Thủ thư | Một nhân viên quản lý sách, bản sao sách, thành viên, lượt mượn, trả sách, đặt chỗ và khoản phạt. |
| Quản trị viên | Quản trị viên hệ thống quản lý người dùng, vai trò, chính sách mượn sách, chính sách phạt, báo cáo và nhật ký kiểm toán. |
| Dịch vụ thông báo | Dịch vụ bên ngoài gửi thông báo xác minh tài khoản, hạn trả, quá hạn, đặt chỗ sách và khoản phạt. |

## 5. Các chức năng chính

Các chức năng chính của hệ thống được xác định trong Danh sách chức năng chính:

- FE01 Công khai / Duyệt sách
- FE02 Xác thực
- FE03 Hồ sơ người dùng
- FE04 Quản lý thành viên
- FE05 Quản lý sách
- FE06 Quản lý kho / bản sao sách
- FE07 Quản lý mượn sách
- FE08 Quản lý đặt chỗ
- FE09 Quản lý khoản phạt
- FE10 Quản lý thông báo
- FE11 Quản lý người dùng và vai trò
- FE12 Báo cáo và thống kê

Xem [`07_master_feature_list.md`](07_master_feature_list.md) để biết ID chức năng chính thức, thư
mục đặc tả, cấp độ đặc tả và ghi chú phạm vi.

## 6. Kết quả mong đợi

Sau khi hoàn thiện, hệ thống được kỳ vọng sẽ cung cấp nền tảng tập trung cho việc quản lý hoạt động
thư viện. Khách có thể tìm kiếm sách, thành viên có thể quản lý hoạt động mượn và đặt chỗ của mình,
thủ thư có thể xử lý các giao dịch thư viện hàng ngày và quản trị viên có thể giám sát dữ liệu hệ
thống và các báo cáo cơ bản.

Hệ thống phải cải thiện hiệu quả, độ chính xác và khả năng truy vết của quá trình duyệt sách, xác
thực, quản lý người dùng, quản lý sách, quản lý kho, mượn, trả sách, đặt chỗ, quản lý khoản phạt,
thông báo và báo cáo.
