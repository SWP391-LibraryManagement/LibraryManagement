# Xác thực Đợt hoàn thiện B của FE11 - 2026-07-19

Trạng thái: PASS - PHẦN TRIỂN KHAI SẴN SÀNG H2; TÍCH HỢP B7 ĐANG CHỜ

Phạm vi: `FE11-REQ01`, `FE11-REQ02`, `FE11-REQ03` và bằng chứng trước tích hợp cho `FE11-ACC01`.

## Độ bao phủ yêu cầu

- `FR-FE11-031`: Bảng điều khiển Quản trị viên tải dữ liệu tóm tắt vận hành chỉ đọc trước khi tương tác Quản lý yêu cầu.
- `FR-FE11-034`: Quản lý yêu cầu của Quản trị viên dùng phân trang danh sách máy chủ chuẩn, bộ lọc, chi tiết có thẩm quyền và xuất CSV an toàn cho mọi hàng đã lọc.
- `FR-FE11-035` / `AC-FE11-019`: yêu cầu đang chờ cung cấp thao tác thuộc sở hữu FE07; yêu cầu đã hoàn thành chỉ được xem và các lần thử phê duyệt/từ chối trực tiếp trả về `409 BORROW_REQUEST_NOT_PENDING`.

## Bằng chứng ĐỎ-XANH

1. ĐỎ: kiểm thử chấp thuận Playwright mới thất bại vì `__e2e__/setup` không tạo tác nhân Quản trị viên; phản hồi chỉ chứa ID Thành viên và Thủ thư.
2. XANH: bộ kiểm thử E2E có thêm thiết lập Quản trị viên tùy chọn và các dịch vụ đọc Quản trị viên/Người dùng trong bộ nhớ dựa trên trạng thái FE07/xác thực dùng chung. Sau đó ca trình duyệt FE11 trọng tâm đạt 1/1.
3. ĐỎ hồi quy: chạy ca FE11 cùng luồng chuẩn hiện có làm lộ nhiễm trạng thái dùng chung vì các yêu cầu FE11 đang chờ vẫn hiển thị cho kiểm thử thứ hai.
4. XANH hồi quy: `__e2e__/setup` hiện tạo ứng dụng tích hợp mới cho mỗi kiểm thử. Kiểm thử chấp thuận FE11 và luồng chuẩn hệ thống cùng đạt 2/2 với một tiến trình thực thi.

Lát cắt chấp thuận trình duyệt này không thay đổi endpoint, dịch vụ, kho dữ liệu, lược đồ hoặc quy tắc nghiệp vụ production nào.

## Chấp thuận trình duyệt

Môi trường chạy cô lập:

- Frontend: `http://127.0.0.1:4185`
- Backend: `http://127.0.0.1:3101`
- Cổng `4173` và PID `13432` hiện có: không bị tác động

Kiểm thử FE11 tạo một yêu cầu đã hoàn thành và 21 yêu cầu đang chờ thông qua API FE07 đã xác thực, rồi chứng minh:

- Đăng nhập Quản trị viên tới `/admin/users` và hiển thị tóm tắt Bảng điều khiển dựa trên máy chủ.
- Trang 1 trả về 20 trong 22 bản ghi; trang 2 trả về hai bản ghi còn lại.
- Bộ lọc máy chủ `PENDING` báo cáo 21 bản ghi.
- Chi tiết đang chờ được tải từ `/api/admin/requests/{requestId}`, gồm mã vạch `BC2` và cung cấp `Duyệt yêu cầu` / `Từ chối`.
- Bản xuất CSV chứa cả 21 yêu cầu đang chờ đã lọc, gồm bản ghi từ cả hai trang UI và loại yêu cầu đã hoàn thành.
- Bộ lọc máy chủ `COMPLETED` báo cáo một bản ghi; chi tiết có thẩm quyền của nó gồm mã vạch `BC1` và không có điều khiển thao tác.
- Các lần thử phê duyệt và từ chối FE07 trực tiếp đối với yêu cầu đã hoàn thành đều trả về `409 BORROW_REQUEST_NOT_PENDING`.

Kết quả: **2/2 kiểm thử Playwright đạt** (`E2E-FE11-ACC01` cùng `E2E-SYS-001`).

## Bằng chứng tự động hỗ trợ

- Hồi quy backend trọng tâm về Yêu cầu Quản trị viên, trạng thái kết thúc mượn và bảo mật bảng điều khiển: **5/5 bộ, 80/80 kiểm thử đạt**.
- Hợp đồng frontend trọng tâm về Yêu cầu Quản trị viên, khung Quản trị viên, API và trang: **48/48 kiểm thử đạt**.
- Tích hợp hệ thống: **1/1 bộ, 10/10 kiểm thử đạt**.
- Thực thi truy vết: mọi tính năng FE01-FE12 vẫn ở **100%**, gồm `38/38` ID FR của FE11.
- Bằng chứng SQL trực tiếp vẫn là **8/8 bộ, 61/61 kiểm thử đạt**, với `DB_CLEAN` và `LOGIN_CLEAN`.

## Ranh giới còn lại

- `FE11-REQ01..FE11-REQ03` có bằng chứng triển khai cục bộ theo tên và sẵn sàng để đánh giá.
- `FE11-ACC01` vẫn còn mở đến khi ghi nhận H2/H3, kiểm tra PR nháp, CI liên kết chính xác và chấp thuận tích hợp của con người.
- `TD-021` không còn khoảng trống thực thi SQL hoặc trình duyệt; nó chỉ giữ trạng thái một phần đến khi ghi nhận liên kết PR/CI cuối.
- `TD-025` vẫn còn mở qua các cổng tích hợp bắt buộc và không được chuyển sang Đã giải quyết trước khi tổng kết FE11 cuối.
