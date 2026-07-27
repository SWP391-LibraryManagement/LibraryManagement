# Rà soát xác thực B6 FE12 - 2026-07-13

Trạng thái: B6 HOÀN TẤT - ĐÃ XÁC NHẬN RÀ SOÁT BỞI CON NGƯỜI, RÀ SOÁT LẠI ĐỘC LẬP SẠCH

Nhánh: `feat/fe12-validation`

## Mục đích

Ghi lại bằng chứng tăng cường xác thực FE12 trước khi con người rà soát và trước mọi quyết định tích hợp.
Bản rà soát này nằm trong phạm vi báo cáo mượn, kho và thống kê người dùng đã phê duyệt.

## Các phát hiện về tính đúng đắn đã xử lý

| Phát hiện | Cách xử lý | Bằng chứng |
| --- | --- | --- |
| Chi tiết mượn đã nối làm trùng số lượng trạng thái yêu cầu | Loại trùng hàng theo `RequestId` trước khi tổng hợp yêu cầu | `backend/tests/reportRepository.test.js` |
| `toDate` chỉ có ngày loại bỏ hoạt động sau nửa đêm | Dùng ranh giới loại trừ của ngày kế tiếp | `backend/tests/reportRepository.test.js` |
| Khoảng thời gian thành viên mới dùng thời điểm tạo tài khoản | Chọn và tổng hợp `Members.ApprovedAt` | `backend/tests/reportRepository.test.js` |
| Số lượng theo thể loại đại diện cho bản sao và hàng sắp hết thiếu tổng số | Đếm sách duy nhất và hiển thị `totalCopies`/`availableCopies` | `backend/tests/reportRepository.test.js` |
| Truy cập báo cáo thất bại chưa được kiểm toán an toàn | Thêm kiểm toán lỗi theo phạm vi tuyến chỉ với mã, trạng thái, phương thức và đường dẫn | `backend/tests/reportRoutes.test.js` |
| OpenAPI bỏ sót hoặc đặt sai tên bộ lọc FE12 | Ghi tài liệu các tham số truy vấn đã triển khai cho cả ba điểm cuối | `backend/tests/reportContract.test.js` |
| OpenAPI bỏ sót lược đồ thành công FE12 và enum chính xác lúc chạy | Thêm lược đồ phản hồi tái sử dụng và so sánh enum trong tài liệu với enum bộ xác thực được xuất | `backend/tests/reportContract.test.js` |
| Tuyến frontend FE12 và lỗi API có thể hiển thị dữ liệu trái phép hoặc bịa đặt | Thêm chốt bảo vệ tuyến nhân viên và trạng thái tải/rỗng/lỗi trung thực | `frontend/test/reportAccess.test.js` |
| Tùy chọn thể loại kho đọc sai hình dạng phản hồi | Đọc `response.data.categories` từ cấu trúc bao của bộ điều khiển production | `frontend/test/reportAccess.test.js` |
| Bố cục báo cáo tràn ngang ở chiều rộng máy tính/di động | Cho phép nội dung flex co lại, giữ quy tắc chia đáp ứng và xếp chồng bộ lọc ngày trên di động | `frontend/test/reportAccess.test.js` |
| Lỗi mạng vẫn tuyên bố UI dùng dữ liệu demo dự phòng | Thêm bộ phân giải lỗi trung thực dành riêng cho FE12 | `frontend/test/apiErrorMessages.test.js` |
| Kiểm toán báo cáo thành công lưu giá trị bộ lọc thô | Bỏ siêu dữ liệu thành công trong khi giữ chẩn đoán lỗi an toàn | `backend/tests/reportRoutes.test.js` |
| Bộ lọc ngày người dùng thay đổi tổng toàn cục qua `Users.CreatedAt` | Giữ tổng toàn cục và chỉ lọc `newMembersByPeriod` theo `Members.ApprovedAt` | `backend/tests/reportRepository.test.js`, `backend/tests/reportRoutes.test.js` |
| Thao tác OpenAPI Kho/Người dùng bỏ sót phản hồi xác thực | Thêm phản hồi `400` và khẳng định hợp đồng cho mọi điểm cuối FE12 | `backend/tests/reportContract.test.js` |
| Trang Mượn/Người dùng áp đặt ngày mẫu cố định | Bắt đầu không lọc và chỉ dựng tham số từ ngày không để trống | `frontend/test/reportAccess.test.js`, `frontend/test/reportFilters.test.js` |
| Bộ xác thực ngày chấp nhận dấu thời gian dù có `format: date` | Chỉ chấp nhận ngày lịch thực theo đúng dạng `YYYY-MM-DD` | `backend/tests/reportRoutes.test.js` |
| Tập sắp hết hàng backend khác với UI | Dùng `availableCopies <= 2` trong kho báo cáo production và trong bộ nhớ | `backend/tests/reportRepository.test.js`, `backend/tests/reportRoutes.test.js` |
| Bộ lọc trạng thái/vị trí làm sai lệch khả dụng sắp hết hàng | Chọn sách/bản sao khớp cho tổng đã lọc, đồng thời tính sắp hết hàng từ toàn bộ tập bản sao của từng sách được chọn, kể cả sách không có bản sao | `backend/tests/reportRepository.test.js` |
| Biểu đồ kho mô tả số lượng sách là số lượng bản sao | Đổi tên biểu đồ thành `Đầu sách theo thể loại` | `frontend/test/reportAccess.test.js` |
| Kiểm thử tích hợp khoảng ngày mượn không có dữ liệu nguồn | Tạo yêu cầu mượn trước khi khẳng định khoảng tương lai trả về rỗng và áp dụng bộ lọc ngày trong kho lưu trữ trong bộ nhớ | `backend/tests/reportRoutes.test.js` |
| Bộ lọc mượn và người dùng trong bộ nhớ sai khác ngữ nghĩa SQL production | Tổng hợp từ các hàng được chọn tương đương production và bao phủ tính tương đương vai trò/trạng thái/thành viên/sách/ngày | `backend/tests/reportInMemoryParity.test.js` |
| Hàng sắp hết trong bộ nhớ bỏ sót trường production/OpenAPI | Bao gồm `categoryName`, `copies`, `totalCopies` và `availableCopies` | `backend/tests/reportInMemoryParity.test.js` |
| Chi tiết `REQUESTED` đang chờ xuất hiện như hoạt động theo kỳ mượn/sách hàng đầu | Chỉ đếm các trạng thái khoản mượn thực tế: `BORROWED`, `RETURNED`, `LOST`, `DAMAGED` và `OVERDUE` | `backend/tests/reportRepository.test.js`, `backend/tests/reportInMemoryParity.test.js` |
| Đặc tả thống kê người dùng đặt sai tên nguồn tư cách thành viên lúc chạy | Căn chỉnh nguồn trạng thái thành viên và khoảng phê duyệt theo `Members` | `.sdd/specs/feat-reporting-statistics/SPEC.md` |

## Bằng chứng tự động

| Kiểm tra | Kết quả |
| --- | --- |
| Kiểm thử backend FE12 tập trung sau khi khắc phục qua rà soát | PASS - 4 bộ, 31 kiểm thử |
| Kiểm thử truy cập/bộ lọc frontend FE12 tập trung | PASS - 9 kiểm thử |
| Toàn bộ bộ kiểm thử backend | PASS - 18 bộ, 236 kiểm thử |
| Toàn bộ bộ kiểm thử frontend | PASS - 24 kiểm thử |
| Lint frontend | PASS |
| Bản dựng frontend production | PASS |
| Thực thi truy vết | PASS; FE12 8/8 thẻ FR, 100% |

## Bằng chứng trình duyệt thủ công

Frontend và bộ kiểm thử backend tạm thời trong bộ nhớ chạy tại `http://127.0.0.1:5173`
và `http://127.0.0.1:3000`.

- Khách truy cập `/reports/borrowing` được chuyển hướng tới `/login`.
- Thành viên truy cập `/reports/users` được chuyển hướng tới `/forbidden` với trang 403.
- Quản trị viên tải thống kê mượn, kho và người dùng từ các điểm cuối báo cáo thật.
- Bộ kiểm thử trình duyệt trong bộ nhớ ban đầu hiển thị `Software Engineering`; việc chọn ID thể loại `1`
  vẫn được giữ sau khi áp dụng bộ lọc. Rà soát sau đó phát hiện cấu trúc bao siêu dữ liệu của nó
  không khớp production, nên đường dẫn production `response.data.categories` đã được sửa và kiểm thử hồi quy.
- Máy tính `1265x720`: chiều rộng tài liệu, thân, phần chính và nội dung không tràn.
- Di động `390x844`: tài liệu, phần chính, nội dung, vùng chia báo cáo và bộ lọc ngày đều có
  `scrollWidth === clientWidth`; vùng chia báo cáo chuyển thành một cột. Bảng rộng
  chỉ tiếp tục cuộn được bên trong `.lib-table-wrap`.
- Trạng thái đang tải và trạng thái rỗng khi kho thấp đều hiển thị.
- Sau khi dừng backend tạm thời, báo cáo xóa số liệu đã tải và hiển thị
  `Không kết nối được backend. Vui lòng kiểm tra kết nối và thử lại.` mà không có dữ liệu demo.

Lệnh chụp màn hình trình duyệt hết thời gian chờ nên không tuyên bố có sản phẩm hình ảnh. Bằng chứng
bên trên đến từ ảnh chụp DOM trình duyệt, URL tuyến, trạng thái điều khiển đã chọn và các giá trị
bố cục đã đo. Bộ kiểm thử backend tạm thời đã được dừng và xóa sau khi xác thực.

## Theo dõi ngoài FE12

Nút Đăng xuất trên thanh bên `AppLayout` dùng chung hiện điều hướng tới `/login` mà không xóa
xác thực đã lưu. Xác thực cho Khách dùng luồng đăng xuất Trang chủ hiện có, vốn
xóa kho lưu trữ. Sự cố vỏ xác thực đã tồn tại này không được thay đổi trên nhánh FE12.

## Kiểm soát phạm vi

- Không bổ sung công việc xuất dữ liệu, bảng điều khiển, BI, lược đồ, phần phụ thuộc hay tính năng không liên quan.
- Các đường dẫn không liên quan và chưa được theo dõi được giữ nguyên: `.superpowers/`, `backend/coverage/`
  và `docs/briefing-thuyet-trinh-du-an-vi.docx`.
- Nhánh không được push hay merge bởi bước xác thực này.

## Rà soát lại độc lập cuối cùng

Lần rà soát lại cuối cùng chỉ đọc không tìm thấy sự cố FE12 Nghiêm trọng hay Quan trọng nào còn lại.
Lần này xác nhận ánh xạ thể loại rõ ràng, trạng thái bản sao hợp lệ cho production, tính tương đương tổng hợp
production/trong bộ nhớ, số liệu khoản mượn thực, ngữ nghĩa sắp hết hàng, cấu trúc bao siêu dữ liệu, phân quyền,
quyền riêng tư kiểm toán, hợp đồng OpenAPI, trạng thái frontend, kiểm thử, tài liệu và kiểm soát phạm vi.

Kết luận: **Sẵn sàng để con người rà soát: Có**.

## Rà soát bởi con người

Nhat đã xác nhận rõ `đã review` trong tác vụ Codex này sau lần rà soát lại độc lập cuối cùng
sạch. Nội dung này chỉ ghi nhận cổng rà soát bởi con người; không suy luận PR, commit, push, merge hay danh tính
người rà soát riêng.

## Cổng còn lại

1. Chọn đường tích hợp B7: merge cục bộ, push/PR hoặc giữ nhánh lại cho sau này.
