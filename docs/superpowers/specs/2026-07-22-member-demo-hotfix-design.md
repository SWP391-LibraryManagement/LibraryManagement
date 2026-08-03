# Thiết kế bản sửa nóng trình diễn Thành viên

## Trạng thái

ĐƯỢC PHÊ DUYỆT TẠI CHAT bởi Nhật vào ngày 22/07/2026 với cụm từ chính xác là `duyệt demo hotfix`.
Đánh giá thiết kế bằng văn bản đã được phê duyệt theo hướng dẫn tiếp theo `tiếp tục đi`; lập kế
hoạch triển khai và công việc RED-GREEN có thể được tiến hành.

## Hợp đồng theo lô

- ID lô: `DEMO-HOTFIX-USER-2026-07-22`
- Mục tiêu: làm cho đường dẫn giới thiệu Thành viên có giá trị cao nhất trở nên trung thực và đáng tin cậy trong khoảng thời gian hai giờ.
- Hình thức phân phối: triển khai RED-GREEN cục bộ, không cam kết sau khi thiết kế này được xem xét; không có cam kết, đẩy, hợp nhất, thay đổi lược đồ hoặc triển khai mã sản phẩm nào được tài liệu này cho phép.
- Quyền sở hữu cốt lõi: phần máy chủ vẫn có thẩm quyền ủy quyền, xác thực, quy tắc nghiệp vụ, phân trang và trạng thái được lưu trữ; giao diện người dùng hiển thị và gọi các hợp đồng đã được phê duyệt hiện có.

## Trong phạm vi

### 1. Tóm tắt bảng điều khiển thành viên

- Sử dụng phong bì lịch sử thành viên FE07 chuẩn (`borrowings`, `pagination`) thay vì khóa `borrowRequests` chỉ dành cho nhân viên.
- Hiển thị số lượng hoạt động và số lượng đã hoàn thành khác 0 cho các hàng chuẩn được điểm cuối hiện có trả về.
- Giữ thay đổi bên trong mô hình/trang xem bảng điều khiển và thêm kiểm thử hồi quy bằng cách sử dụng hình dạng phản hồi của thành viên thực.

### 2. Xử lý trạng thái thiết bị đầu cuối dành riêng

- Giữ nguyên trạng thái FE08 thô trong mô hình chế độ xem đặt chỗ.
- Chỉ coi `ACTIVE` và `NOTIFIED` là mở/có thể hủy.
- Coi `FULFILLED`, `CANCELLED` và `EXPIRED` làm thiết bị đầu cuối để kiểm tra trùng lặp và hiển thị hành động.
- Việc đặt chỗ đã hoàn tất không được hiển thị hành động hủy cũng như không chặn việc đặt chỗ sau đó cho cùng một bản sao.

### 3. Trang tốt dành cho Thành viên chỉ đọc

- Thêm `fineApi.listMine(params)` được hỗ trợ bởi điểm cuối `GET /api/fines/me` hiện có.
- Thêm tuyến Thành viên được bảo vệ và mục điều hướng cho `/fines/mine`.
- Hiển thị bảng chỉ đọc, được phân trang trên máy chủ chứa sách, lý do, ngày quá hạn, số tiền, trạng thái và mã định danh lượt mượn có liên quan.
- Không tiết lộ các hành động thu nợ, thanh toán đánh dấu, từ bỏ, hủy bỏ hoặc tính toán cho Thành viên.

### 4. Điều hướng khách

- Định tuyến mọi hành động `Đăng ký` của khách hiển thị đến `/register` và mọi hành động `Đăng nhập` tới `/login`.
- Loại bỏ các hành động tài khoản chân trang không hoạt động.
- Giữ nguyên cấu trúc hình ảnh hiện tại và bố cục đáp ứng.

### 5. Tìm kiếm công khai trống

- Việc gửi tìm kiếm trống/khoảng trắng phải gọi danh sách công khai mặc định chuẩn thay vì từ chối người dùng.
- Xóa các lỗi/kết quả tìm kiếm cũ và hiển thị danh mục mặc định được trả về.
- Không thêm điểm cuối danh mục mới hoặc phân trang danh mục đầy đủ do khách hàng sở hữu trong hộp thời gian này.

### 6. Bản sao thành viên trung thực

- Xóa các xác nhận quyền sở hữu hiển thị đối với các cấp độ trả phí, mượn không giới hạn, sách điện tử/sách nói, sự kiện riêng tư, danh sách đọc hoặc thông báo về sách mới.
- Chỉ nêu rõ quyền được phê duyệt: tài khoản `MEMBER` đang hoạt động có thể yêu cầu tối đa 3 bản sao mỗi ngày làm việc; Tư cách thành viên được FE04 phê duyệt sẽ nâng cấp hàng ngày đó lên 5, tuân theo giới hạn năm bản sao hoạt động và các trình chặn FE07 khác.
- Xóa mã phương thức gói trả phí không hoạt động khi mã đó không có quy trình làm việc được phê duyệt có thể truy cập được.

## Rõ ràng nằm ngoài phạm vi

- Thiết kế lại lựa chọn nhiều bản sao cho các yêu cầu mượn FE07.
- Thiết kế lại phân trang đầy đủ theo danh mục công cộng hoặc đặt chỗ riêng.
- Tái cấu trúc cổng thông tin thành viên, quản lý trạng thái toàn cầu hoặc hợp nhất máy khách API.
- Di chuyển cơ sở dữ liệu/lược đồ, điểm cuối máy chủ mới hoặc thay đổi quyền.
- FE11 Các tệp đánh giá tư cách thành viên của quản trị viên hiện được sửa đổi trong cây làm việc.
- Triển khai, gắn thẻ phát hành, đẩy, tạo PR hoặc hợp nhất.

## Thành phần và luồng dữ liệu

1. `RoleDashboardPage` gọi các bộ điều hợp FE07/FE08 hiện có; `dashboardViewModel` sử dụng phong bì thành viên và lấy số lượng hiển thị.
2. `MyReservationsPage` ánh xạ từng trạng thái máy chủ để hiển thị văn bản trong khi vẫn giữ lại `rawStatus` để đủ điều kiện hành động.
3. `MyFinesPage` gọi `fineApi.listMine({ status?, page, limit })`, chỉ hiển thị trang được trả về và sử dụng siêu dữ liệu phân trang của máy chủ.
4. `HomePage` giữ FE01 ở chế độ chỉ đọc, gửi tìm kiếm trống dưới dạng yêu cầu danh sách mặc định và định tuyến các hành động của tài khoản khách đến các trang xác thực hiện có.
5. Bản sao quảng cáo dành cho thành viên là bản trình bày tĩnh bắt nguồn từ các giới hạn được phê duyệt FE04/FE07; nó không thực hiện thao tác ghi kinh doanh.

## Xử lý lỗi

- chức năng làm mới mã thông báo yêu cầu được ủy quyền hiện có và ánh xạ lỗi an toàn theo chức năng cụ thể vẫn được sử dụng.
- khoản phạt thành viên hiển thị trạng thái tải, trống, lỗi và thử lại mà không cần giả mạo dữ liệu.
- thao tác ghi đặt chỗ tải lại trạng thái máy chủ chuẩn sau khi thành công hoặc xung đột.
- Tìm kiếm công khai trống sẽ xóa trạng thái lỗi cũ trước khi áp dụng kết quả mặc định.

## Chiến lược kiểm thử

Sử dụng chu trình RED-GREEN nghiêm ngặt:

1. Mở rộng `frontend/test/appShellFrontend.test.js` bằng phong bì bảng điều khiển `{ borrowings, pagination }` thực và xem chìa khóa cũ bị lỗi.
2. Mở rộng `frontend/test/reservationFrontend.test.js` để hoàn thành việc đặt chỗ lại và hiển thị trạng thái có thể hủy cũng như xem lỗi logic hiện tại.
3. Thêm các kiểm thử giao diện người dùng tốt dành cho Thành viên tập trung bao gồm bộ điều hợp URL, tuyến đường/điều hướng được bảo vệ, phân trang, hiển thị chỉ đọc và không có thao tác ghi nhân viên.
4. Mở rộng các kiểm thử lớp bao FE01/auth để tìm kiếm trống, `/register`, `/login` và xóa các yêu cầu thành viên không được hỗ trợ.
5. Chạy các kiểm thử tập trung sau mỗi lần sửa lỗi tối thiểu, sau đó chạy kiểm thử toàn bộ giao diện người dùng, tìm lỗi mã nguồn, bản dựng sản xuất, kiểm thử lộ trình máy chủ có liên quan, truy vết nếu các thẻ nguồn đã thay đổi yêu cầu và `git diff --check`.

## Tiêu chí thành công

- Sáu vấn đề demo trong phạm vi có các kiểm thử hồi quy không thành công trước khi triển khai và vượt qua sau đó.
- Đường dẫn demo Thành viên có thể điều hướng qua trang chủ, bảng điều khiển, đặt chỗ, khoản phạt riêng và các điểm nhập xác thực mà không có hành động sai hoặc tuyên bố kinh doanh sai.
- Kiểm tra giao diện người dùng đầy đủ, tìm lỗi mã nguồn và bản dựng sản xuất.
- Các kiểm thử máy chủ FE07/FE08/FE09 có liên quan đã vượt qua mà không có thay đổi về sản xuất máy chủ.
- Không có tệp cây làm việc FE11 nào được sắp xếp hoặc sửa đổi theo lô này.
