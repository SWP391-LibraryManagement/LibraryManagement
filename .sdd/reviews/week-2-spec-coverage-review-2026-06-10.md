# Đánh giá độ bao phủ Bản nháp đặc tả Tuần 2

Ngày: 2026-06-10
Nguồn: `C:/Users/admin/Downloads/Library Management (4).xlsx`
Phạm vi: So sánh danh sách phân công UC/FT trong Excel với `.sdd/specs/*/SPEC.md`.

## Kết luận

Bản nháp đặc tả Tuần 2 nhìn chung đã hoàn thành: mọi mục UC/FT trong Excel đều có yêu cầu hoặc tiêu chí chấp thuận có khả năng khớp theo tên trong các đặc tả tính năng đã phê duyệt.

Phần dọn dẹp còn lại trước khi đóng Tuần 2: thêm hoặc chuẩn hóa ID UC/FT rõ ràng trong các đặc tả nơi có tên nhưng thiếu ID Excel chính xác.

## Tóm tắt

| Tính năng | Mục Excel | ID UC/FT chính xác đã tìm thấy | Tìm thấy tên khớp | Trạng thái |
|---|---:|---:|---:|---|
| FE01 | 8 | 8 | 8 | OK |
| FE02 | 13 | 7 | 13 | OK |
| FE03 | 4 | 4 | 4 | OK |
| FE04 | 8 | 8 | 8 | OK |
| FE05 | 16 | 16 | 16 | OK |
| FE06 | 8 | 8 | 8 | OK |
| FE07 | 14 | 14 | 14 | OK |
| FE08 | 10 | 10 | 10 | OK |
| FE09 | 8 | 8 | 8 | OK |
| FE10 | 8 | 4 | 8 | OK |
| FE11 | 18 | 9 | 18 | OK |
| FE12 | 6 | 6 | 6 | OK |

## Cần dọn dẹp ID chính xác

| Tính năng | ID | Tên trong Excel | Chủ sở hữu | Điểm khớp tên | Đặc tả |
|---|---|---|---|---:|---|
| FE02 | UC05 | Đăng ký tài khoản | Đạt | 1.00 | `.sdd/specs/feat-auth/SPEC.md` |
| FE02 | UC06 | Đăng nhập | Đạt | 1.00 | `.sdd/specs/feat-auth/SPEC.md` |
| FE02 | UC07 | Đăng xuất | Đạt | 1.00 | `.sdd/specs/feat-auth/SPEC.md` |
| FE02 | UC08 | Đổi mật khẩu | Đạt | 1.00 | `.sdd/specs/feat-auth/SPEC.md` |
| FE02 | UC09 | Quên mật khẩu | Đạt | 1.00 | `.sdd/specs/feat-auth/SPEC.md` |
| FE02 | UC10 | Đặt lại mật khẩu | Đạt | 1.00 | `.sdd/specs/feat-auth/SPEC.md` |
| FE10 | UC45 | Gửi thông báo xác minh tài khoản | Nhật | 1.00 | `.sdd/specs/feat-notification-management/SPEC.md` |
| FE10 | UC46 | Gửi thông báo đặt lại mật khẩu | Nhật | 1.00 | `.sdd/specs/feat-notification-management/SPEC.md` |
| FE10 | UC47 | Gửi thông báo đặt trước sách | Nhật | 1.00 | `.sdd/specs/feat-notification-management/SPEC.md` |
| FE10 | UC48 | Gửi thông báo hạn trả hoặc tiền phạt | Nhật | 1.00 | `.sdd/specs/feat-notification-management/SPEC.md` |
| FE11 | UC49 | Xem danh sách người dùng | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |
| FE11 | UC50 | Xem thông tin người dùng | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |
| FE11 | UC51 | Tạo tài khoản người dùng | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |
| FE11 | UC52 | Cập nhật thông tin người dùng | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |
| FE11 | UC53 | Vô hiệu hóa tài khoản người dùng | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |
| FE11 | UC54 | Tạo tài khoản Thủ thư | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |
| FE11 | UC55 | Cập nhật tài khoản Thủ thư | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |
| FE11 | UC56 | Vô hiệu hóa tài khoản Thủ thư | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |
| FE11 | UC57 | Quản lý vai trò | Dũng | 1.00 | `.sdd/specs/feat-user-role-management/SPEC.md` |

## Hành động tổng kết Tuần 2 được khuyến nghị

1. Chủ sở hữu trong nhóm đánh giá bảng dọn dẹp ID và quyết định đặc tả có phải ghi rõ ID UC/FT trong Excel hay không.
2. Nếu có, chỉ cập nhật ma trận truy vết SPEC.md liên quan; không thay đổi hành vi nghiệp vụ.
3. Sau khi chủ sở hữu xác nhận, đánh dấu Bản nháp đặc tả Tuần 2 là đã đóng và tiếp tục đến các cổng đánh giá/hoàn thiện Tuần 3.

