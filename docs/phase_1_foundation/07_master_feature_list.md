# Danh sách chức năng chính

## 1. Mục đích

Tài liệu này là nguồn thông tin chính thức về danh sách chức năng của Hệ thống quản lý thư viện.

Tất cả ca sử dụng, đặc tả chức năng, hợp đồng API, thay đổi cơ sở dữ liệu, kiểm thử và
phân công nhóm phải ánh xạ trở lại một trong các ID chức năng trong danh sách này.

## 2. Danh sách chức năng chính

| ID chức năng | Tên chức năng | Thư mục đặc tả | Cấp thông số | Mô tả |
| ---------- | -------------------------------- | ----------------------------- | ---------- | ----------- |
| FE01 | Công khai / Duyệt sách | feat-public-browse | Tiêu chuẩn | Cho phép khách tìm kiếm sách, duyệt danh mục sách và xem chi tiết sách. |
| FE02 | Xác thực | feat-auth | Đầy đủ | Hỗ trợ đăng ký tài khoản, đăng nhập, đăng xuất, quên mật khẩu và đặt lại mật khẩu. |
| FE03 | Hồ sơ người dùng | feat-user-profile | Tiêu chuẩn | Quản lý thông tin hồ sơ cá nhân của thành viên và thủ thư. |
| FE04 | Quản lý tư cách thành viên | feat-membership-management | Tiêu chuẩn | Hỗ trợ đăng ký, phê duyệt hoặc từ chối và quản lý trạng thái tư cách thành viên. |
| FE05 | Quản lý sách | feat-book-management | Tiêu chuẩn | Thêm, cập nhật, vô hiệu hóa và hiển thị thông tin sách trong thư viện. |
| FE06 | Quản lý kho / bản sao sách | feat-inventory-book-copy | Đầy đủ | Quản lý bản sao sách vật lý, mã vạch, vị trí, trạng thái và khả năng cho mượn. |
| FE07 | Quản lý mượn sách | feat-borrowing-management | Đầy đủ | Hỗ trợ mượn, trả, gia hạn và quản lý lịch sử mượn. |
| FE08 | Quản lý đặt chỗ | feat-reservation-management | Tiêu chuẩn | Hỗ trợ đặt chỗ, hủy đặt chỗ và quản lý hàng đợi đặt chỗ. |
| FE09 | Quản lý khoản phạt | feat-fine-management | Đầy đủ | Tính khoản phạt, ghi nhận thu phạt, đánh dấu khoản phạt đã thanh toán và theo dõi vi phạm quá hạn. |
| FE10 | Quản lý thông báo | feat-notification-management | Tiêu chuẩn | Gửi email hoặc thông báo trong ứng dụng về xác minh tài khoản, đặt chỗ, hạn trả và khoản phạt. |
| FE11 | Quản lý người dùng và vai trò | feat-user-role-management | Đầy đủ | Quản lý người dùng, thủ thư, vai trò và quyền hệ thống. |
| FE12 | Báo cáo và thống kê | feat-reporting-statistics | Tiêu chuẩn | Cung cấp số liệu thống kê về sách, lượt mượn, thành viên và hoạt động hệ thống. |

## 3. Ghi chú phạm vi

- FE07 Quản lý mượn sách và Quản lý đặt chỗ FE08 là các chức năng riêng biệt.
- FE07 ánh xạ tới luồng mượn và trả sách.
- FE08 ánh xạ tới luồng đặt chỗ và hàng đợi đặt chỗ.
- Cổng thanh toán trực tuyến nằm ngoài phạm vi. FE09 chỉ ghi lại trạng thái thu khoản phạt và đã thanh toán.
- Việc đặt chỗ học nằm ngoài phạm vi của phiên bản dự án hiện tại.
- Không được lưu giữ các ID chức năng trống như FE13-FE15 trong tài liệu lập kế hoạch trừ khi nhóm chính thức bổ sung phạm vi mới.

## 4. Quy tắc truy vết

- Mỗi trường hợp sử dụng phải tham chiếu một ID chức năng.
- Mỗi kiểm thử chức năng phải tham chiếu một ID chức năng.
- Mọi `SPEC.md` phải sử dụng giá trị `Spec Folder` tương ứng từ tài liệu này.
- Mọi thay đổi đối với danh sách này đều yêu cầu cập nhật `.sdd/shared_context.md`, các đặc tả liên quan và tài liệu chuyển nhượng.
