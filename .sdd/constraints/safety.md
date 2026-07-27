# Ràng Buộc An Toàn — Hệ Thống Quản Lý Thư Viện

# Phiên bản: 0.1.1

# Trạng thái: ĐÃ PHÊ DUYỆT

# Cập nhật lần cuối: 2026-07-20

> Các quy tắc bảo mật cấp cao. Những quy tắc này được ưu tiên hơn sự tiện lợi hoặc tốc độ. Các quy tắc an toàn chi tiết (kiểm toán, xử lý PII, chính sách dependency) sẽ được bổ sung trong những tuần sau.

## Quy Tắc Bảo Mật Cấp Cao

- SAFE-001: Không được commit thông tin bí mật. Khóa API, mật khẩu, token, khóa riêng và thông tin xác thực cơ sở dữ liệu tuyệt đối không được xuất hiện trong mã nguồn, fixture hoặc lịch sử commit.
- SAFE-002: Không được mã hóa cứng thông tin xác thực, bao gồm tài khoản quản trị, mật khẩu mặc định hoặc token được seed sẵn.
- SAFE-003: Mọi dữ liệu đầu vào của người dùng phải được kiểm tra hợp lệ trên server. Chỉ kiểm tra ở phía client là không đủ.
- SAFE-004: Kiểm soát truy cập dựa trên vai trò phải được thực thi đối với mọi hành động được bảo vệ. Quyền truy cập phải được kiểm tra trên server, không chỉ trên giao diện người dùng.
- SAFE-005: Không được để lộ stack trace lỗi nội bộ và thông báo của framework cho người dùng cuối; phải trả về phản hồi lỗi chung, an toàn.
