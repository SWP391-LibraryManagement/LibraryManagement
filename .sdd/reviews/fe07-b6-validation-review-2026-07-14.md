# Đánh giá xác thực B6 của FE07 - 2026-07-14

Trạng thái: B6 HOÀN THÀNH - ĐÃ XÁC NHẬN ĐÁNH GIÁ CỦA CON NGƯỜI

Nhánh: `feat/fe07-validation`

## Mục đích

Ghi nhận bằng chứng xác thực B6 của FE07 trước khi Nhat đánh giá bắt buộc và trước mọi quyết định commit, đẩy hoặc hợp nhất.

## Các phát hiện đã xử lý

| Phát hiện | Cách giải quyết | Bằng chứng |
| --- | --- | --- |
| Các tuyến FE07 không thực thi nhất quán quyền truy cập Thành viên/nhân viên | Thêm bộ bảo vệ tuyến mượn dùng chung vào mọi tuyến FE07 | `frontend/test/borrowingFrontend.test.js` |
| Lỗi API có thể để lại hàng trình diễn hoặc thành công thao tác thay đổi mô phỏng | Dùng trạng thái chuẩn trống và thao tác thay đổi backend thật trên mọi trang FE07 dựa trên API | `frontend/test/borrowingFrontend.test.js` |
| Hộp thoại dùng chung xung đột với lớp `.modal` ẩn của Bootstrap | Đặt không gian tên cho cấu trúc và kiểu hộp thoại là `lib-modal*` | `frontend/test/borrowingFrontend.test.js` |
| Bố cục FE07 rộng có thể tràn ở chiều rộng máy tính để bàn/di động | Cho phép phần tử con được chia co lại và giới hạn cuộn bảng trong `.lib-table-wrap` | `frontend/test/borrowingFrontend.test.js`, số đo trình duyệt |
| Hàng quá hạn suy ra xuất hiện ở cả phần đang hoạt động và lịch sử | Chỉ phân vùng hàng đã mượn quá hạn vào tập hợp đang hoạt động | `frontend/test/borrowingFrontend.test.js` |
| Tra cứu Thành viên hiển thị dữ liệu KPI/chi tiết bịa đặt | Chỉ hiển thị bản ghi do API Thành viên được chọn trả về | `frontend/test/borrowingFrontend.test.js` |
| Tra cứu Thành viên không xác định trả về một Thành viên trống có vẻ hợp lệ | Trả về `404 MEMBER_NOT_FOUND` theo EC-FE07-001 và ghi tài liệu trong OpenAPI | `backend/tests/borrowingRoutes.test.js`, `backend/tests/borrowingContract.test.js` |
| UI trả sách suy ra ngày lịch qua UTC | Bỏ `returnDate` để máy chủ áp dụng ngày chuẩn | `frontend/test/borrowingFrontend.test.js` |
| UI phê duyệt lưu ghi chú bịa đặt và hiển thị kiểm tra điều kiện đủ không được hỗ trợ | Không gửi ghi chú bịa đặt và chỉ hiển thị trạng thái bản sao thực trong khi máy chủ xác thực lại | `frontend/test/borrowingFrontend.test.js` |
| Từ chối đồng thời có thể trả về `200` với yêu cầu null | Ánh xạ tranh chấp cập nhật đang chờ bị mất sang `409 BORROW_REQUEST_NOT_PENDING` | `backend/tests/borrowingRoutes.test.js` |
| Yêu cầu đang chờ làm tăng sai số liệu khoản mượn đang hoạt động | Tách hàng đang chờ, đang hoạt động và lịch sử thành các tập hợp/bảng riêng | `frontend/test/borrowingFrontend.test.js` |
| Hộp thoại dùng chung thiếu tên dễ tiếp cận và quản lý tiêu điểm | Thêm `aria-labelledby`, tiêu điểm ban đầu, bẫy tiêu điểm, xử lý Escape và khôi phục tiêu điểm | `frontend/test/borrowingFrontend.test.js` |

## Bằng chứng tự động

| Kiểm tra | Kết quả |
| --- | --- |
| Kiểm thử frontend | PASS - 37/37 |
| Lint frontend | PASS |
| Bản dựng frontend production | PASS; chỉ có cảnh báo kích thước khối hiện hữu |
| Toàn bộ bộ backend | PASS - 20 bộ, 273/273 kiểm thử |
| Bộ SQL FE07 trực tiếp | PASS - 14/14; dọn dẹp xác nhận TestUsers=0 và TestCopies=0 |
| Thực thi truy vết | PASS - 22/22 thẻ FR của FE07, 100% |
| Kiểm toán phụ thuộc backend | PASS - 0 lỗ hổng trong L3 |
| Kiểm tra khoảng trắng/xung đột diff | PASS - chỉ có cảnh báo kết thúc dòng |

## Bằng chứng trình duyệt

- Tuyến FE07 dành cho Khách chuyển hướng tới `/login`.
- Thành viên truy cập tuyến FE07 dành cho nhân viên bị chuyển hướng tới `/forbidden`.
- Yêu cầu thật `1253` hoàn thành phê duyệt, gia hạn đến 2026-08-11 và trả bình thường; bản ghi cuối hiển thị là đã trả.
- Khi backend không khả dụng, FE07 hiển thị lỗi kết nối thật và bảng chuẩn trống không có dữ liệu trình diễn.
- Hộp thoại hiển thị phía trên phông nền bằng các lớp đã đặt không gian tên.
- Máy tính để bàn `1280x720` không tràn ngang cấp trang.
- Di động `390x844` không tràn ngang cấp trang; bảng rộng chỉ cuộn bên trong `.lib-table-wrap`.
- Dữ liệu cố định trình duyệt tạm thời đã bị xóa và bản sao `1` được khôi phục về `AVAILABLE`.

## Kết quả đánh giá

Người đánh giá độc lập đưa ra bảy phát hiện Quan trọng sau lượt bằng chứng ban đầu. Cả bảy đều được khắc phục với độ bao phủ hồi quy trọng tâm, sau đó là các cổng tự động toàn bộ và SQL đã ghi nhận.

## Đánh giá của con người

Nhat đã xác nhận rõ `đã review` trong tác vụ Codex này vào 2026-07-14. Việc này chỉ đóng cổng đánh giá bắt buộc của con người; không suy diễn rằng đã commit, đẩy, hợp nhất hoặc tái đánh giá sạch riêng.

## Rủi ro còn lại

- Trang tạo yêu cầu vẫn dùng danh mục tạm thời đã ghi tài liệu vì duyệt bản sao FE01/FE06 production nằm ngoài phạm vi FE07.
- Gói frontend production vẫn lớn hơn ngưỡng khuyến cáo 500 kB của Vite.
- Kiểm toán phụ thuộc frontend vẫn báo khuyến cáo `form-data` mức nghiêm trọng cao đã xác định trước đó thông qua `axios`; khắc phục phụ thuộc nằm ngoài nhánh xác thực FE07 này.

## Kiểm soát phạm vi

- Không thêm việc tạo tiền phạt FE09, tiến trình gửi FE10, tích hợp danh mục FE01/FE06, nâng cấp phụ thuộc hoặc thiết kế lại không liên quan.
- Chưa thực hiện commit, đẩy hoặc hợp nhất.

Kết luận: **Xác thực B6 đã hoàn thành và sẵn sàng cho quyết định tích hợp: Có.**

## Cổng còn lại

1. Chọn hướng commit/đẩy/hợp nhất.
