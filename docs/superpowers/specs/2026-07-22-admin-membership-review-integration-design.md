# Đánh giá thành viên quản trị viên Thiết kế tích hợp

Trạng thái: ĐƯỢC PHÊ DUYỆT BỞI HUMAN - 22-2026-07-07

Ngày: 22-07-2026

## 1. Quyết định

Sử dụng Hybrid SDD + ADD ở độ sâu Tiêu chuẩn. Trạng thái đánh giá tư cách thành viên FE04, ủy quyền,
chuyển đổi nguyên tử, tính bền bỉ kiểm tra và phân phối kết quả FE10 vẫn là Cốt lõi. Điều hướng của
Quản trị viên, danh sách/thẻ phản hồi, phương thức và trình bày phản hồi là lớp bao.

Bảng điều khiển dành cho quản trị viên sẽ thêm phần `Duyệt hội viên` thực sau `Quản lý người dùng`.
Việc chọn nó sẽ hiển thị quy trình đánh giá FE04 bên trong giao diện Quản trị hiện tại thay vì điều
hướng đến không gian làm việc `/membership` riêng biệt.

## 2. Vấn đề và mốc cơ sở hiện tại

FE04 đã hiển thị các điểm cuối của nhân viên được phê duyệt và không gian làm việc `/membership`
chuẩn hỗ trợ đánh giá của cả Thủ thư và Quản trị viên. Trình tái cấu trúc mô-đun của Bảng điều khiển
dành cho quản trị viên đã cố tình xóa đường dẫn hiển thị thành viên cũ không thể truy cập được và
khóa thanh bên ở bảy mục. Sau đó, đánh giá đã được xác thực cho thấy rằng người dùng Quản trị viên
mong đợi một cách hợp lý sự chấp thuận tư cách thành viên trong Bảng điều khiển dành cho quản trị
viên.

Thiết kế này chỉ thay thế các quyết định trước đó đã loại trừ FE04 khỏi Bảng điều khiển dành cho
quản trị viên và sửa thanh bên đã sửa ở bảy mục nhập. Nó không khôi phục mục Quyền đã xóa, quy trình
thanh toán, dữ liệu demo hoặc khối nguyên khối Quản trị viên cũ.

## 3. Phạm vi

### Trong phạm vi

- Thêm `Duyệt hội viên` sau `Quản lý người dùng` trong quản trị viên trên máy tính để bàn và thiết bị di động
  điều hướng.
- Hiển thị danh sách ứng dụng FE04 gốc dành cho quản trị viên, các bộ lọc, phân trang, chi tiết,
  phê duyệt và từ chối luồng bên trong `AdminConsolePage`.
- Duy trì hoạt động của máy chủ FE04 chuẩn, bao gồm các chuyển đổi chỉ đang chờ xử lý,
  lý do từ chối bắt buộc, kiểm tra tính nguyên tử và phân phối FE10 không chặn.
- Cung cấp tải, trống, lỗi, thử lại, xung đột và kết quả thông báo an toàn
  phản hồi.
- Sử dụng bản trình bày bảng trên màn hình rộng và thẻ ở độ phân giải 1440px trở xuống.
- Giữ lại không gian làm việc của Thành viên/Thư viện `/membership` hiện có và API của nó.

### Ngoài phạm vi

- Cơ sở dữ liệu, di chuyển, thay đổi máy trạng thái API, DTO hoặc FE04 công khai.
- Hết hạn thành viên, gia hạn, thanh toán, số thành viên hoặc xem xét hàng loạt.
- Phân công vai trò là một tác dụng phụ của việc phê duyệt thành viên.
- Di chuyển quy trình làm việc của Thủ thư hoặc Thành viên vào Bảng điều khiển dành cho quản trị viên.
- Khôi phục mục thanh bên Quyền độc lập.

## 4. Quyền sở hữu và kiến trúc

FE11 sở hữu lớp bao Quản trị và mục điều hướng của nó. FE04 sở hữu tất cả dữ liệu đánh giá thành viên
và các thao tác ghi. Mô-đun Quản trị sử dụng trực tiếp `membershipApi`; nó không tạo bí danh
`/api/admin/membership` hoặc sao chép các quy tắc nghiệp vụ vào giao diện người dùng.

Các đơn vị trình bày dự kiến:

- `admin/membership/AdminMembershipSection.jsx`: điều phối, bộ lọc,
  phân trang, tải lại có thẩm quyền và yêu cầu nâng cốc.
- `admin/membership/AdminMembershipReviewModal.jsx`: chi tiết người nộp đơn chỉ đọc,
  xác nhận phê duyệt và đầu vào từ chối có giới hạn.
- `admin/membership/adminMembershipPresentation.js`: chuẩn hóa thuần túy và
  người trợ giúp trình bày trạng thái/thông báo an toàn.
- `adminNavigation.js` và `AdminConsolePage.jsx`: điều hướng và phần
  chỉ thành phần.

`MembershipPage.jsx` hiện tại vẫn là không gian làm việc chuẩn không thuộc lớp bao quản trị. Quyền sở
hữu miền API được chia sẻ; các thành phần lớp bao trực quan không được chia sẻ khi làm như vậy sẽ trộn
lẫn hệ thống thiết kế AppLayout và Quản trị viên.

## 5. Hợp đồng điều hướng

Thanh bên Quản trị sẽ chứa chính xác tám mục theo thứ tự sau:

1. Trang chủ
2. Tổng quan
3. Thư viện
4. Quản lý mượn trả
5. Quản lý yêu cầu
6. Quản lý người dùng
7. Duyệt Thành viên
8. Nhật ký hoạt động

`Phân quyền`, `Xác nhận thanh toán` và `Xác nhận mượn` vẫn vắng mặt. Quản lý vai trò vẫn có sẵn từ
Quản lý người dùng.

## 6. Đánh giá kinh nghiệm

Phần mở ra với `PENDING` được chọn và hiển thị:

- tìm kiếm máy chủ theo ID ứng dụng, tên, tên người dùng hoặc email;
- bộ lọc trạng thái cho `PENDING`, `APPROVED`, `REJECTED` hoặc tất cả;
- phân trang máy chủ với giới hạn 10;
- ID đơn đăng ký, danh tính/thông tin liên hệ của người nộp đơn, ngày nộp đơn, trạng thái và hành động;
- bảng gốc dành cho quản trị viên có kích thước trên 1440px và thẻ phản hồi ở/dưới 1440px.

Việc chọn một hàng sẽ mở ra một phương thức. Chỉ một hàng `PENDING` hiển thị các điều khiển quyết
định. Phê duyệt yêu cầu xác nhận rõ ràng. Từ chối yêu cầu đầu vào được cắt bớt 1..500 ký tự. Các ứng
dụng cuối cùng vẫn ở chế độ chỉ xem.

## 7. Luồng dữ liệu và xử lý lỗi

1. Tải `GET /api/membership/applications` với các giá trị được áp dụng cố định cho `q`,
   `status`, `page` và `limit`.
2. Phê duyệt bằng `PATCH /api/membership/applications/{id}/approve` hoặc từ chối bằng
   `PATCH /api/membership/applications/{id}/reject` và `{ reason }`.
3. Đừng bao giờ lạc quan hoàn thành một hàng. Sau khi thành công hoặc `409
   MEMBERSHIP_APPLICATION_NOT_PENDING`, tải lại dữ liệu máy chủ có thẩm quyền.
4. Khi quyết định thành công, hãy đóng phương thức và hiển thị thành công. Nếu
`notificationStatus = FAILED`, hiển thị cảnh báo không chặn rằng quyết định đã thành công nhưng
thông báo kết quả không được gửi. `PENDING`, `SENT`, `FAILED` và `NOT_CONFIGURED` là các trạng thái
trình bày an toàn duy nhất.
5. Hiển thị phản hồi cục bộ an toàn cho `400`, `401`, `403`, `404`, `409` và
   lỗi mạng/máy chủ. Không bao giờ hiển thị bộ công nghệ thô hoặc lỗi của nhà cung cấp.

## 8. Hợp đồng đáp ứng và tiếp cận

- Không tràn ngang cấp tài liệu ở 1440, 1366, 1280 hoặc 390 pixel.
- Tiêu đề bảng, điều khiển, tiêu đề phương thức, nhãn từ chối và nút có
  những cái tên có thể truy cập được.
- Người dùng bàn phím có thể tìm kiếm bằng Enter, đóng phương thức và đưa ra cả hai quyết định
  điều khiển theo trình tự logic.
- Trạng thái tải ngăn chặn các thao tác ghi trùng lặp; điều khiển hiển thị trạng thái bị vô hiệu hóa.
- Tiêu điểm quay lại hành động hàng đã mở phương thức sau khi phương thức đóng.
- Giảm chuyển động và các hợp đồng hiển thị tập trung vào Quản trị viên hiện tại được giữ nguyên.

## 9. An ninh và An toàn Kinh doanh

- Xác thực FE04 phía máy chủ và ủy quyền `ADMIN`/`LIBRARIAN` vẫn được duy trì
  có thẩm quyền.
- Chỉ các ứng dụng `PENDING` mới có thể chuyển đổi.
- Lý do từ chối được xác thực trên cả máy khách và máy chủ, với máy chủ
  có thẩm quyền.
- Ứng dụng, phép chiếu thành viên chuẩn, siêu dữ liệu của người đánh giá và mục nhập kiểm tra
  tiếp tục cam kết nguyên tử.
- FE10 việc phân phối vẫn duy trì sau cam kết và không bị chặn.
- Giao diện người dùng chỉ sử dụng phản hồi đánh giá/danh sách FE04 an toàn và không đưa ra
  HTML hoặc các trường thông tin xác thực không an toàn.

## 10. Chiến lược kiểm thử

Việc triển khai kiểm thử đầu tiên sẽ chứng minh:

- thứ tự điều hướng chính xác gồm tám mục có sự hiện diện của Đánh giá tư cách thành viên và
  Quyền vắng mặt;
- Thành phần phần quản trị sử dụng `membershipApi` và không có bí danh thao tác ghi Quản trị viên;
- `q`, `status`, `page` và `limit` vẫn thuộc sở hữu của máy chủ;
- chỉ các hàng đang chờ xử lý mới hiển thị các hành động phê duyệt/từ chối;
- giới hạn xác nhận phê duyệt và lý do từ chối;
- tải lại có thẩm quyền sau khi thành công và xem xét xung đột;
- cảnh báo FE10 `FAILED` an toàn mà không báo cáo quyết định là thất bại;
- đang tải, trống, lỗi, thử lại, bảng trên máy tính để bàn, thẻ phản hồi và không có trang
  tràn ở mức 1440/1366/1280/390;
- các kiểm thử `/membership` của Thành viên/Thư viện hiện tại vẫn xanh;
- các kiểm thử chuyển tiếp/ủy quyền máy chủ FE04 tập trung vẫn có màu xanh.

## 11. Tiêu chí chấp nhận

- Cung cấp một Quản trị viên được xác thực trên `/admin/users`, khi `Duyệt hội viên` được
được chọn, sau đó phần đánh giá FE04 tích hợp sẽ mở ra mà không cần rời khỏi giao diện Quản trị.
- Với các ứng dụng đang chờ xử lý, khi Quản trị viên tìm kiếm, lọc hoặc thay đổi trang,
  thì kết quả sẽ đến từ điểm cuối danh sách FE04 chuẩn.
- Với một ứng dụng đang chờ xử lý, khi Quản trị viên xác nhận phê duyệt hoặc gửi đơn đăng ký
lý do từ chối hợp lệ thì thao tác ghi FE04 chuẩn sẽ chạy một lần và danh sách sẽ tải lại từ máy chủ.
- Cho một người đánh giá khác hoàn thiện đơn đăng ký trước, khi Quản trị viên hành động,
  sau đó giao diện người dùng báo cáo xung đột và làm mới mà không xác nhận thành công.
- Đưa ra quyết định cam kết nhưng việc gửi thông báo không thành công thì giao diện người dùng
  báo cáo quyết định là thành công và hiển thị cảnh báo gửi không bị chặn.
- Với một ứng dụng được phê duyệt/từ chối thì phương thức này chỉ ở chế độ xem.
- Với khung xem đánh giá trên máy tính để bàn, máy tính xách tay hoặc thiết bị di động thì phần này vẫn giữ nguyên
  có thể sử dụng mà không cần cuộn ngang cấp tài liệu.

## 12. Các giả định được phê duyệt

- Nhãn thanh bên là `Duyệt hội viên` và tuân theo Quản lý người dùng.
- Quản trị viên nhận được một mô-đun nhúng; Thủ thư và Thành viên giữ `/membership`.
- FE04 API và lược đồ hiện tại là đủ.
- Không có thay đổi vai trò nào xảy ra trong quá trình phê duyệt thành viên.
