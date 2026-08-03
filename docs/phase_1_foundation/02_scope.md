# Phạm vi dự án

## 1. Mục đích

Tài liệu này xác định phạm vi của Hệ thống quản lý thư viện. Nó xác định những chức năng nào được
đưa vào dự án và những chức năng nào bị loại trừ để tránh phạm vi sai sót trong quá trình phát
triển.

Nguồn chức năng chính thức của sự thật là [`07_master_feature_list.md`](07_master_feature_list.md).

## 2. Trong phạm vi

Hệ thống bao gồm các chức năng sau.

### 2.1 FE01 - Công khai / Duyệt sách

Hệ thống cho phép khách và thành viên tìm kiếm, duyệt và xem thông tin sách công khai.

Các chức năng đi kèm:

- Xem trang chủ
- Tìm kiếm sách
- Duyệt qua danh mục sách
- Xem thông tin sách
- Xem chi tiết sách

### 2.2 FE02 - Xác thực

Hệ thống hỗ trợ xác thực tài khoản.

Các chức năng đi kèm:

- Đăng ký tài khoản
- Đăng nhập
- Đăng xuất
- Thay đổi mật khẩu
- Quên mật khẩu
- Đặt lại mật khẩu

### 2.3 FE03 - Hồ sơ người dùng

Hệ thống cho phép thành viên và thủ thư quản lý hồ sơ cá nhân của mình.

Các chức năng đi kèm:

- Xem hồ sơ
- Cập nhật hồ sơ

### 2.4 FE04 - Quản lý thành viên

Hệ thống hỗ trợ đăng ký thành viên và quản lý trạng thái thành viên.

Các chức năng đi kèm:

- Đăng ký thành viên
- Phê duyệt đơn đăng ký thành viên
- Từ chối đơn đăng ký thành viên
- Xem trạng thái thành viên

### 2.5 FE05 - Quản lý sách

Hệ thống cho phép thủ thư quản lý thông tin sách.

Các chức năng đi kèm:

- Xem danh sách sách
- Thêm sách
- Cập nhật thông tin sách
- Vô hiệu hóa sách
- Xem chi tiết sách
- Tìm kiếm sách theo khách hoặc thành viên

Lưu ý: Hệ thống không xóa sách vĩnh viễn. Nó chỉ hủy kích hoạt hoặc thay đổi trạng thái sổ sách để
duy trì lịch sử mượn và khoản phạt.

### 2.6 FE06 - Quản lý kho / bản sao sách

Hệ thống quản lý các bản sao sách vật lý.

Các chức năng đi kèm:

- Xem hàng tồn kho
- Kiểm tra trạng thái bản sao sách
- Cập nhật tính khả dụng của bản sao sách
- Quản lý bản sao sách, mã vạch, vị trí và trạng thái

### 2.7 FE07 - Quản lý mượn sách

Hệ thống hỗ trợ yêu cầu mượn, trả sách, gia hạn và lịch sử mượn.

Các chức năng đi kèm:

- Tạo yêu cầu mượn
- Xem lịch sử mượn
- Gia hạn sách đã mượn
- Xử lý yêu cầu mượn
- Xử lý yêu cầu trả sách
- Xem thông tin mượn của thành viên
- Phê duyệt yêu cầu mượn

### 2.8 FE08 - Quản lý đặt chỗ

Hệ thống cho phép thành viên đặt chỗ những cuốn sách hiện không có sẵn.

Các chức năng đi kèm:

- Đặt chỗ sách
- Hủy đặt chỗ
- Xem danh sách đặt chỗ
- Xử lý hàng đợi đặt chỗ
- Thông báo kích hoạt sách có sẵn

### 2.9 FE09 - Quản lý khoản phạt

Hệ thống quản lý các khoản phạt liên quan đến sách quá hạn, thất lạc, hư hỏng.

Các chức năng đi kèm:

- Xem thông tin khoản phạt
- Tính khoản phạt
- Ghi nhận việc thu khoản phạt
- Đánh dấu phạt là đã thanh toán

Lưu ý: Việc tích hợp cổng thanh toán trực tuyến thực sự nằm ngoài phạm vi. Hệ thống chỉ ghi lại
trạng thái thu khoản phạt và đã thanh toán.

### 2.10 FE10 - Quản lý thông báo

Hệ thống sẽ gửi email cơ bản hoặc thông báo trong ứng dụng.

Các loại thông báo bao gồm:

- Thông báo xác minh tài khoản
- Thông báo đặt lại mật khẩu
- Thông báo đặt sách
- Thông báo ngày đáo hạn
- Thông báo phạt

### 2.11 FE11 - Quản lý người dùng và vai trò

Hệ thống cho phép quản trị viên quản lý người dùng, thủ thư và vai trò.

Các chức năng đi kèm:

- Xem danh sách người dùng
- Xem thông tin người dùng
- Tạo tài khoản người dùng
- Cập nhật thông tin người dùng
- Vô hiệu hóa tài khoản người dùng
- Tạo tài khoản thủ thư
- Cập nhật tài khoản thủ thư
- Vô hiệu hóa tài khoản thủ thư
- Quản lý vai trò

Lưu ý: Hệ thống không xóa vĩnh viễn người dùng. Nó chỉ hủy kích hoạt tài khoản hoặc thay đổi trạng
thái người dùng.

### 2.12 FE12 - Báo cáo và thống kê

Hệ thống cung cấp các báo cáo, số liệu thống kê cơ bản cho người quản trị.

Các báo cáo đi kèm:

- báo cáo mượn sách
- Báo cáo tồn kho
- Thống kê người dùng

## 3. Ngoài phạm vi

Các chức năng sau không được bao gồm trong dự án này:

- Ứng dụng di động
- Tích hợp phần cứng RFID hoặc QR
- Cổng thanh toán trực tuyến thực sự
- Đề xuất sách AI
- Máy đọc sách điện tử
- Quản lý thư viện đa ngành phức tạp
- Đăng nhập xã hội bằng Facebook hoặc Google
- Đặt phòng
- Đặt chỗ học
- Quản lý bản đồ chỗ ngồi trực quan
- Đăng ký chỗ ngồi QR/RFID
- Phần cứng kiểm soát truy cập phòng hoặc chỗ ngồi
- Kế toán tài chính nâng cao
- Bảng điều khiển phân tích dữ liệu nâng cao

## 4. Ghi chú phạm vi

Dự án tập trung vào các hoạt động cốt lõi của thư viện: duyệt công khai, xác thực, hồ sơ người dùng,
quản lý thành viên, quản lý sách, kiểm kê bản sao sách, mượn, đặt chỗ, quản lý khoản phạt, thông
báo, quản lý vai trò và người dùng cũng như báo cáo cơ bản.

Quản lý mượn sách và quản lý đặt chỗ được tách biệt một cách có chủ ý:

- FE07 Quản lý mượn sách xử lý yêu cầu mượn, trả sách, gia hạn và lịch sử mượn.
- FE08 Quản lý đặt chỗ xử lý việc đặt chỗ, hủy và quản lý hàng đợi đặt chỗ.

Bất kỳ chức năng mới nào ngoài FE01-FE12 trước tiên phải được thêm vào Danh sách chức năng chính và
được phê duyệt trước khi đặc tả hoặc triển khai.
