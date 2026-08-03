# Danh sách tác nhân

## 1. Mục đích

Tài liệu này xác định các tác nhân tương tác với Hệ thống Quản lý Thư viện. Mỗi tác nhân đại diện cho
một vai trò người dùng hoặc một hệ thống bên ngoài trao đổi thông tin với hệ thống.

Trách nhiệm của tác nhân phải nhất quán với Danh sách chức năng tổng thể trong
[`07_master_feature_list.md`](07_master_feature_list.md).

## 2. Danh sách tác nhân

| Tác nhân | Loại | Vai trò / Trách nhiệm |
| --- | --- | --- |
| Khách | Tác nhân con người | Khách truy cập có thể tìm kiếm, xem thông tin sách công khai và đăng ký tài khoản. |
| Thành viên | Tác nhân con người | Người dùng thư viện đã đăng ký có thể mượn sách, đặt chỗ sách không có sẵn, gia hạn lượt mượn, xem lịch sử mượn và khoản phạt. |
| Thủ thư | Tác nhân con người | Nhân viên thư viện quản lý sách, bản sao sách, thành viên, hoạt động mượn/trả, đặt chỗ và khoản phạt. |
| Quản trị viên | Tác nhân con người | Quản trị hệ thống, quản lý người dùng, vai trò, chính sách mượn/phạt, báo cáo và nhật ký kiểm toán. |
| Dịch vụ thông báo | Hệ thống bên ngoài | Dịch vụ gửi thông báo xác minh tài khoản, đặt lại mật khẩu, hạn trả, quá hạn, đặt chỗ sách và khoản phạt. |

## 3. Chi tiết tác nhân

### 3.1 Khách

Khách là người dùng chưa đăng nhập hoặc chưa đăng ký làm thành viên.

Tương tác chính:

- Tìm kiếm sách
- Lọc và duyệt sách
- Xem chi tiết sách
- Đăng ký tài khoản

Hạn chế:

- Không thể mượn sách
- Không thể đặt chỗ sách
- Không thể gia hạn lượt mượn
- Không thể xem lịch sử mượn hoặc khoản phạt

### 3.2 Thành viên

Thành viên là người dùng đã đăng ký của thư viện.

Tương tác chính:

- Đăng nhập
- Cập nhật hồ sơ cá nhân
- Đăng ký tư cách thành viên
- Xem trạng thái tư cách thành viên
- Tìm kiếm, lọc và duyệt sách
- Xem chi tiết sách
- Yêu cầu mượn sách
- Đặt chỗ sách không có sẵn
- Hủy lượt đặt chỗ của mình khi được phép
- Gia hạn sách đã mượn
- Xem lịch sử mượn
- Xem thông tin khoản phạt
- Nhận thông báo

### 3.3 Thủ thư

Thủ thư chịu trách nhiệm về các hoạt động hằng ngày của thư viện.

Tương tác chính:

- Đăng nhập
- Cập nhật hồ sơ cá nhân
- Quản lý thông tin sách
- Quản lý bản sao sách
- Quản lý thể loại, tác giả và nhà xuất bản khi chức năng quản lý sách yêu cầu
- Quản lý thông tin thành viên
- Phê duyệt hoặc từ chối đơn đăng ký tư cách thành viên
- Xử lý yêu cầu mượn sách
- Xác nhận trả sách
- Xử lý sách quá hạn, mất hoặc hư hỏng
- Quản lý khoản phạt
- Ghi nhận việc thu khoản phạt
- Quản lý hàng đợi đặt chỗ sách
- Xem hồ sơ mượn sách của thành viên

### 3.4 Quản trị viên

Quản trị viên chịu trách nhiệm quản lý và giám sát ở cấp hệ thống.

Tương tác chính:

- Đăng nhập
- Quản lý người dùng
- Quản lý tài khoản Thủ thư
- Quản lý vai trò và quyền
- Cấu hình chính sách mượn sách
- Cấu hình chính sách khoản phạt
- Xem báo cáo và thống kê
- Xuất dữ liệu báo cáo nếu được hỗ trợ
- Xem nhật ký kiểm toán

### 3.5 Dịch vụ thông báo

Dịch vụ thông báo là hệ thống bên ngoài được Hệ thống Quản lý Thư viện sử dụng để gửi thông báo.

Tương tác chính:

- Nhận yêu cầu gửi thông báo từ hệ thống
- Gửi thông báo xác minh tài khoản
- Gửi thông báo đặt lại mật khẩu
- Gửi lời nhắc hạn trả
- Gửi thông báo quá hạn
- Gửi kết quả yêu cầu mượn sách
- Gửi cập nhật về lượt đặt chỗ sách
- Gửi thông báo khoản phạt
- Trả trạng thái gửi về hệ thống

## 4. Ghi chú

Các mục sau không phải là tác nhân:

- Sách
- Bản sao sách
- Lượt mượn
- Lượt đặt chỗ
- Khoản phạt
- Thể loại
- Tác giả
- Nhà xuất bản
- Báo cáo

Đây là các thực thể hệ thống hoặc đối tượng dữ liệu, không phải người dùng hoặc hệ thống bên ngoài.

Hệ thống không cần tác nhân "Người quản lý" riêng vì Quản trị viên và Thủ thư đã bao phủ các trách
nhiệm quản lý.

Đặt chỗ chỗ ngồi học tập nằm ngoài phạm vi phiên bản hiện tại của dự án và không được biểu diễn như
một trách nhiệm của tác nhân.
