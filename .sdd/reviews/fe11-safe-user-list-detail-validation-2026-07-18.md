# Xác thực Danh sách và chi tiết người dùng an toàn FE11

Ngày: 2026-07-18

Phạm vi: chỉ FE11-U01..U06

Trạng thái: TÍCH HỢP B7 HOÀN THÀNH

## Bằng chứng tự động L1

| Kiểm tra | Kết quả |
| --- | --- |
| Backend trọng tâm | PASS - 4 bộ, 105/105 kiểm thử |
| Toàn bộ backend | PASS - 30 bộ, 434/434 kiểm thử |
| Độ bao phủ backend | PASS - câu lệnh 92.47%, nhánh 82.35%, hàm 97.10%, dòng 92.40% |
| Toàn bộ frontend | PASS - 81/81 kiểm thử |
| Lint frontend | PASS |
| Bản dựng frontend production | PASS; khuyến cáo kích thước gói hiện có vẫn không chặn |
| Thực thi truy vết | PASS; số FR FE11 được gắn thẻ tăng từ 13 lên 16 trong khi trạng thái toàn tính năng vẫn bị hoãn |
| Kiểm tra diff | PASS |
| Đánh giá tên nhạy cảm | PASS; kết quả khớp là mã xác thực/thiết lập có từ trước hoặc xác nhận trường bị cấm rõ ràng |
| Lần chạy GitHub Actions `29639933730` trên commit hợp nhất `ed6bd717` | PASS; `foundation-checks` hoàn tất thành công, gồm kiểm thử backend, tích hợp hệ thống, độ bao phủ, lint/kiểm thử/bản dựng frontend, E2E trình duyệt và nhập tình trạng backend |

Lệnh trọng tâm:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/userRepository.test.js tests/userRoleRepository.test.js
```

Các lệnh toàn bộ:

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
```

## Tuân thủ đặc tả L2

- `FR-FE11-001` / `AC-FE11-001`: mặc định chỉ áp dụng khi bị bỏ qua; giá trị không hợp lệ được cung cấp bị từ chối; trạng thái/vai trò/tìm kiếm được chuẩn hóa; tìm kiếm giới hạn ở email, họ tên và ID người dùng; thứ tự SQL vẫn ổn định.
- `BR-FE11-026`: danh sách, đọc lại sau thay đổi và các trường cơ sở chi tiết dùng danh sách trắng rõ ràng có `phoneNumber`; vai trò là chuỗi viết hoa tất định; các cột thông tin xác thực/token/phiên/liên kết/bí mật kiểm toán không an toàn bị bỏ qua.
- `FR-FE11-002` / `AC-FE11-002`: chi tiết dùng phép chiếu một truy vấn chuyên biệt và trả về chính xác `activeBorrowingCount`, `unpaidFineTotal` và `openReservationCount` với mặc định số không.
- `FR-FE11-015`: phần mềm trung gian ưu tiên Quản trị viên hiện có vẫn nằm trước xác thực danh sách/chi tiết.
- `FR-FE11-016`: ID không hợp lệ trả về `400 VALIDATION_ERROR`; ID chi tiết hợp lệ nhưng còn thiếu trả về `404 USER_NOT_FOUND`.
- `TD-012`: `department` và `specialization` vẫn không có vì chưa tồn tại cách lưu lược đồ được phê duyệt; không thêm phần giữ chỗ null giả.

## Hiến chương và an toàn L3

- Xác thực phía máy chủ và thực thi vai trò Quản trị viên không đổi và đi trước chi tiết xác thực.
- Express-validator áp dụng quy tắc phân trang, trạng thái, vai trò, tìm kiếm và ID dương theo danh sách trắng.
- Dữ liệu truy vấn Express 5 đã làm sạch được sao chép từ `matchedData` vào `req.validatedListQuery`; chuỗi truy vấn thô không bỏ qua xác thực dịch vụ.
- SQL kho dữ liệu dùng tham số `mssql` có kiểu; không giá trị yêu cầu nào được nối vào SQL.
- DTO an toàn được tạo từng trường và không trải một hàng cơ sở dữ liệu.
- Lỗi máy khách vẫn an toàn và không chứa văn bản SQL, dấu vết ngăn xếp hoặc siêu dữ liệu thông tin xác thực.
- Không đưa vào thay đổi phụ thuộc, lược đồ, bí mật, thông tin xác thực hoặc cấu hình production.

## Chấp thuận và rủi ro còn lại L4

- Kiểm thử tự động chứng minh hợp đồng tuyến/dịch vụ/kho dữ liệu/frontend và các lỗi ĐỎ ban đầu đã được quan sát trước thay đổi production.
- Việc thực thi ba truy vấn con tổng hợp trên SQL Server thật không khả dụng trong đường cơ sở CI/cục bộ dùng một lần; kiểm thử kho dữ liệu xác minh SQL được phát, đầu vào có kiểu, ánh xạ và hành vi số không.
- Kiểm thử Node frontend xác minh hợp đồng nguồn và công cụ hỗ trợ thuần; không thêm kiểm thử tương tác cấp trình duyệt mới cho ngăn kéo.
- Bản dựng Vite giữ khuyến cáo khối lớn có từ trước; nó không liên quan đến lát cắt giới hạn này.
- Hành vi không tìm thấy khi cập nhật/vô hiệu hóa, lưu trường Thủ thư và công việc bảng điều khiển Quản trị viên FE11 còn lại vẫn bị hoãn.

## Các tệp đã thay đổi

- Kế hoạch SDD, nhiệm vụ, kế hoạch kiểm thử, nhật ký thay đổi, sổ nợ, thiết kế, kế hoạch triển khai FE11 và bản đánh giá này.
- Bộ xác thực, tuyến, bộ điều khiển, dịch vụ, kho dữ liệu quản lý người dùng backend và kiểm thử trọng tâm.
- Công cụ hỗ trợ truy vấn quản lý người dùng, API, trang Quản trị viên frontend và kiểm thử trọng tâm.

## Công việc FE11 còn lại

- `TD-012`: lưu và xác thực `department`/`specialization` của Thủ thư.
- Phần còn lại của `TD-014`: cập nhật/vô hiệu hóa và ngữ nghĩa không tìm thấy/Quản trị viên đang thao tác không thuộc chi tiết khác.
- Phần còn lại của `TD-015`: độ bao phủ dịch vụ cập nhật/vô hiệu hóa/kiểm toán.
- `TD-016`: nợ hợp đồng và đồng thời tạo/cập nhật còn lại.
- `TD-017`: rủi ro cấu hình bỏ qua trong phát triển.
- Các lát cắt bảng điều khiển Quản trị viên, quyền, nhật ký kiểm toán, quản lý yêu cầu, cập nhật và vô hiệu hóa.

## Cổng đánh giá của con người

Đánh giá triển khai của con người được phê duyệt vào 2026-07-18. Người đánh giá xác nhận DTO an toàn, ngữ nghĩa tổng hợp, hành vi frontend, ranh giới phạm vi và rủi ro còn lại đã ghi tài liệu; `FE11-U06` hoàn thành cho lát cắt giới hạn này.

PR #27 được hợp nhất vào `main` dưới dạng `ed6bd71714bf506ae838305e5946e3bbd9380102`. Lần chạy CI sau hợp nhất `29639933730` đạt, nên tích hợp B7 hoàn thành cho lát cắt giới hạn này.
