# Xác thực đăng nhập và lỗi Phản hồi Thiết kế cứng rắn

## Phạm vi

Bảo vệ màn hình đăng nhập FE02 hiện có mà không thay đổi các quy tắc xác thực, trạng thái tài khoản,
mã thông báo hoặc khóa.

Sự thay đổi bao gồm:

- Xác thực bản trình bày phía máy khách cho trường email/tên người dùng và mật khẩu kết hợp.
- Phản hồi bằng tiếng Việt an toàn đối với thông tin xác thực không hợp lệ, tài khoản bị khóa, hình dạng yêu cầu không hợp lệ, thực thi HTTPS và lỗi mạng.
- Căn chỉnh độ dài mã nhận dạng đăng nhập phía máy chủ với hợp đồng email 255 ký tự đã được phê duyệt.
- Kiểm tra hồi quy cho người trợ giúp giao diện người dùng, kết nối biểu mẫu và luồng đăng nhập email dài máy chủ.

## Thiết kế

`frontend/src/utils/authUx.js` sở hữu hai chức năng thuần túy:

- `validateLoginFields(values)` trả về lỗi trình bày tiếng Việt theo trường. Nó chỉ cắt bớt mã định danh, yêu cầu cả hai trường và thực thi ranh giới 255 ký tự của máy chủ. Nó không thực thi cú pháp email vì trường này cũng chấp nhận tên người dùng và nó không thực thi độ phức tạp của mật khẩu trong khi đăng nhập.
- `getLoginErrorMessage(error)` ánh xạ mã API an toàn ổn định sang bản tiếng Việt. Lỗi máy chủ không xác định sử dụng một dự phòng chung và lỗi mạng không bao giờ đề cập đến localhost hoặc hiển thị API URL đã định cấu hình.

`LoginForm.jsx` sử dụng `validateLoginFields` trước khi gọi lại lệnh gọi lại trang, vô hiệu hóa xác
thực biểu mẫu gốc để các lỗi trường MUI được bản địa hóa vẫn có hiệu lực, giới hạn bộ đệm đầu vào ở
mức 256 để có thể quan sát được nhánh trên 255, xóa các lỗi trường cũ trong khi chỉnh sửa, ngăn việc
gửi trùng lặp trong khi chờ xử lý và gửi một mã định danh đã được cắt bớt. `LoginPage.jsx` xóa phản
hồi API cũ khi người dùng chỉnh sửa thông tin đăng nhập.

`authApi.js` ủy quyền trình bày lỗi đăng nhập cho `getLoginErrorMessage`. Nó không bao giờ hiển thị
các thông báo máy chủ thô, chi tiết xác thực, dấu vết bộ công nghệ, thông tin xác thực, mã thông báo
hoặc thông tin tồn tại tài khoản.

`authValidators.js` giữ lại xác thực phía máy chủ bắt buộc và thay đổi mã định danh kết hợp tối đa
từ 100 đến 255 ký tự, phù hợp với yêu cầu dữ liệu `Users.Email` và FE02.

## Bất biến bảo mật

- Các tài khoản không xác định và không hoạt động vẫn không thể phân biệt được thông qua `INVALID_CREDENTIALS`.
- Chỉ `ACCOUNT_LOCKED` mới nhận được hướng dẫn dành riêng cho trạng thái tài khoản vì FE02 yêu cầu thông báo khóa một cách rõ ràng.
- Không có mật khẩu, mã thông báo, lỗi Axios thô, dấu vết bộ công nghệ hoặc chi tiết triển khai máy chủ nào được ghi lại hoặc hiển thị.
- Xác thực ứng dụng khách cải thiện phản hồi nhưng không bao giờ thay thế xác thực máy chủ.
- Giá trị mật khẩu không được cắt bớt hoặc chuẩn hóa.

## Chiến lược kiểm thử

- Kiểm tra giao diện người dùng thuần túy bao gồm các mã định danh trống/khoảng trắng, trường quá dài, giá trị hợp lệ, ánh xạ mã lỗi an toàn, lỗi chung không xác định và phản hồi mạng trung lập với môi trường.
- Các xác nhận tích hợp nguồn chứng minh `LoginForm` gọi trình trợ giúp và hiển thị các lỗi trường, trong khi `authApi` sử dụng trình ánh xạ an toàn.
- Tích hợp máy chủ chứng tỏ một email dài hơn 100 nhưng không dài quá 255 ký tự có thể đăng ký, xác minh và đăng nhập.
- Kiểm tra giao diện người dùng đầy đủ, kiểm tra xác thực máy chủ tập trung, tìm lỗi mã nguồn/xây dựng giao diện người dùng và kiểm tra khác biệt/bí mật tạo thành cổng hoàn thành.

## Ngoài phạm vi

- Thay đổi ngưỡng hoặc thời gian khóa.
- Tiết lộ trạng thái tài khoản không hoạt động, ngừng hoạt động hoặc không xác định.
- Thêm kiểm tra độ mạnh mật khẩu để đăng nhập.
- Di chuyển mã thông báo từ chiến lược lưu trữ hiện có.
- Tái cấu trúc các luồng xác thực, đăng ký hoặc khôi phục không liên quan.
