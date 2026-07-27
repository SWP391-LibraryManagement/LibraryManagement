# ADR-003: Phương án xác thực

Trạng thái: Đã phê duyệt cho kế hoạch Tuần 4
Ngày: 2026-06-10

## Bối cảnh

Xác thực FE02 và Quản lý người dùng & vai trò FE11 là các tính năng Cốt lõi rủi ro cao. Trước khi triển khai, chúng phải có đặc tả được phê duyệt, kế hoạch rõ ràng, kiểm thử và xác nhận của người rà soát.

Các quyết định FE02 đã được phê duyệt gồm:

- Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa, 1 chữ số và 1 ký tự đặc biệt.
- Access token hết hạn sau 15 phút.
- Refresh token hết hạn sau 7 ngày.
- Token đặt lại mật khẩu hết hạn sau 15 phút.
- Dùng access token JWT cùng refresh token.
- Giai đoạn 1 cho phép nhiều phiên đồng thời.
- Người dùng không hoạt động không thể đăng nhập.
- Lần đăng nhập thất bại bị giới hạn tần suất bằng quy tắc đơn giản phía máy chủ.
- Lần thử đổi mật khẩu và đăng nhập thất bại được ghi nhật ký.

## Quyết định

Dùng cơ chế xác thực do backend quản lý với access token JWT và refresh token.

### Lưu trữ mật khẩu

- Băm mật khẩu bằng `bcrypt`.
- Không bao giờ lưu mật khẩu dạng văn bản thuần.
- Không bao giờ ghi mật khẩu vào nhật ký.
- Hệ số cost của bcrypt nên được đặt qua cấu hình hoặc ghi rõ trong kế hoạch FE02. Khuyến nghị mặc định cho Giai đoạn 1: 10 hoặc 12, tùy hiệu năng cục bộ.

### Token

| Token | Thời hạn | Lưu trữ | Ghi chú |
| --- | --- | --- | --- |
| Access token | 15 phút | Bộ nhớ hoặc nơi lưu trữ phía client do kế hoạch frontend quyết định | Gửi dưới dạng `Authorization: Bearer <token>`. |
| Refresh token | 7 ngày | Khuyến nghị có bản ghi phía máy chủ; nơi lưu phía client do kế hoạch FE02 quyết định | Phải bị vô hiệu hóa khi đăng xuất. |
| Token đặt lại mật khẩu | 15 phút | Lưu token đã băm khi khả thi | Token thô chỉ xuất hiện trong email/liên kết đặt lại, không bao giờ trong nhật ký. |
| Token thiết lập tài khoản | 24 giờ trừ khi kế hoạch FE11/FE02 chọn giá trị nghiêm ngặt hơn | Lưu token đã băm khi khả thi | Dùng cho tài khoản do quản trị viên tạo. |

### Vai trò và phân quyền

- Các vai trò ngang hàng trong Giai đoạn 1: Khách, Thành viên, Thủ thư, Quản trị viên.
- Máy chủ phải thực thi phân quyền qua middleware/guard.
- Guard route frontend chỉ cải thiện UX; không phải biện pháp kiểm soát bảo mật.
- Hành động nhạy cảm phải xác minh vai trò trên máy chủ bằng claim token đáng tin cậy và/hoặc kiểm tra cơ sở dữ liệu.

### Các endpoint xác thực

Hợp đồng API chi tiết vẫn nằm trong `SPEC.md` của FE02 cho đến khi tạo `docs/api/api-contract.md` dùng chung.

Các nhóm endpoint dự kiến:

- Đăng ký tài khoản
- Xác minh tài khoản/email
- Đăng nhập
- Làm mới token
- Đăng xuất
- Đổi mật khẩu
- Quên mật khẩu
- Đặt lại mật khẩu
- Kiểm tra người dùng/phiên hiện tại

### Kiểm toán và an toàn

Backend phải kiểm toán:

- Đăng nhập thành công/thất bại
- Đăng xuất
- Lần thử đổi mật khẩu/thành công/thất bại
- Yêu cầu và hoàn tất đặt lại mật khẩu mà không làm lộ giá trị token thô
- Kích hoạt/xác minh tài khoản
- Sự kiện thiết lập tài khoản do quản trị viên tạo khi được triển khai qua FE11

Phản hồi lỗi phải an toàn và chung chung. Luồng đăng nhập và quên mật khẩu không được tiết lộ email có tồn tại hay không.

## Ràng buộc triển khai

- Chỉ triển khai sau khi `PLAN.md` và `TASKS.md` của FE02 được phê duyệt.
- Dùng `express-validator` hoặc cơ chế xác thực biên tương đương đã được phê duyệt trong các phụ thuộc.
- Dùng `helmet` và cấu hình CORS an toàn.
- Không hardcode người dùng quản trị, mật khẩu, bí mật JWT hoặc giá trị token.
- Bí mật JWT và thông tin xác thực cơ sở dữ liệu phải lấy từ biến môi trường.
- Bắt buộc kiểm thử xác thực mật khẩu, đăng nhập thành công/thất bại, từ chối tài khoản không hoạt động, vô hiệu hóa khi đăng xuất, hành vi làm mới, thời hạn đặt lại mật khẩu và guard phân quyền.

## Hệ quả

- FE02 và FE11 phải phối hợp về token thiết lập, trạng thái người dùng, gán vai trò và email thiết lập mật khẩu.
- FE10 có thể phân phối thông báo email/mock, nhưng FE02 sở hữu việc tạo và xác thực token xác thực.
- Truy cập hồ sơ FE03 phụ thuộc vào ngữ cảnh người dùng đã xác thực.

## Cổng lập kế hoạch xác thực Tuần 4

Trước khi viết mã xác thực:

- `PLAN.md` của FE02 phải liệt kê luồng xác thực, phạm vi endpoint, mô hình lưu token, phụ thuộc cơ sở dữ liệu và kiểm thử.
- `TASKS.md` của FE02 phải phân rã công việc thành các nhiệm vụ xác thực, repository, service, controller, middleware, kiểm thử và tích hợp frontend.
- `PLAN.md` của FE11 phải định nghĩa phụ thuộc của thiết lập tài khoản do quản trị viên tạo vào FE02/FE10.
- Lược đồ cơ sở dữ liệu phải xác nhận các trường/bảng cho mã băm mật khẩu, refresh token, token đặt lại/thiết lập, trạng thái người dùng, vai trò và nhật ký kiểm toán.
