# Xác thực đối soát Tiền phạt FE09 - 2026-07-19

## Quyết định

- Phương pháp: SDD+ADD kết hợp. SDD/độ sâu Đầy đủ bao phủ Lõi tính tiền phạt, chuyển trạng thái, hợp đồng lược đồ/API, ranh giới giao dịch, kiểm toán và đồng thời; ADD được giới hạn ở ranh giới frontend có thể đảo ngược.
- Phạm vi: FE09-T013 đến FE09-T021, gồm phần tổng kết frontend/L4 trước đây bị hoãn, được tích hợp vào PR nháp #40.
- Trạng thái tích hợp: phần triển khai phía tác nhân, SQL trực tiếp, trình duyệt/L4 và CI PR đạt; chấp thuận cuối của con người vẫn còn mở.

## Bằng chứng mới

| Cổng | Lệnh / kiểm tra | Kết quả |
| --- | --- | --- |
| Backend trọng tâm | `npm.cmd --prefix backend test -- --runTestsByPath tests/fineManagementRoutes.test.js tests/fineRoutes.test.js tests/fineContract.test.js --silent` | 30/30 đạt |
| Hợp đồng SQL FE09 | `npm.cmd --prefix backend run test:sql:fe09 -- --silent` | 3/3 kiểm tra tĩnh đạt; bỏ qua 6 kiểm thử SQL trực tiếp vì chưa cấu hình môi trường chạy `DB_SERVER`/`DB_NAME` đã phê duyệt |
| Ranh giới frontend FE09 | `node --test frontend/test/fineManagementFrontend.test.js` | 3/3 đạt |
| Toàn bộ backend | `npm.cmd --prefix backend test -- --silent` | 618/618 đạt |
| Toàn bộ frontend | `npm.cmd --prefix frontend test` | 120/120 đạt |
| Độ bao phủ backend | `npm.cmd --prefix backend run test:coverage -- --silent` | câu lệnh 92.51%, nhánh 82.46%, hàm 97.10%, dòng 92.44% |
| Lint/bản dựng frontend | `npm.cmd --prefix frontend run lint` và `npm.cmd --prefix frontend run build` | đạt; Vite phát cảnh báo kích thước khối không chặn |
| Cú pháp backend | `node --check` cho các tệp dịch vụ/kho dữ liệu/thời gian nghiệp vụ/trợ giúp đã thay đổi | đạt |
| OpenAPI | `fineContract.test.js` cùng việc nạp `js-yaml` | đạt; cả tám thao tác chuẩn đều được ghi tài liệu |
| Truy vết | `npm.cmd run trace:enforce` | 17/17 ID FR của FE09 được gắn thẻ; thực thi đạt |
| Vệ sinh diff | `git diff --check` | đạt |

## Kiểm tra đặc tả và an toàn

- Số tiền phạt chỉ được suy ra từ dữ liệu hạn trả/ngày trả đã lưu và ngày nghiệp vụ `Asia/Ho_Chi_Minh` rõ ràng.
- Khoản phạt `UNPAID` hiện có được tính lại tại chỗ dưới khóa; lịch sử kết thúc `PAID`, `WAIVED` và `CANCELLED` được trả về mà không mở lại hoặc tạo trùng bản ghi.
- Đối soát thu tiền và đã thanh toán từ chối trường số tiền phía máy khách, yêu cầu phương thức thanh toán đã cắt khoảng trắng và đặt đầy đủ siêu dữ liệu thanh toán một cách nguyên tử.
- Miễn/hủy chỉ dành cho Quản trị viên, yêu cầu lý do dài 1..500 ký tự đã cắt khoảng trắng, duy trì bất biến siêu dữ liệu kết thúc và phát kết quả kiểm toán tất định.
- Thao tác thay đổi tính, thu, đã thanh toán, miễn và hủy cùng ghi kiểm toán dùng chung một giao dịch; lỗi kiểm toán được chèn sẽ hoàn tác trạng thái trong cả hợp đồng trong bộ nhớ và phần triển khai SQL.
- Danh sách tiền phạt xác thực bộ lọc trước khi truy cập kho dữ liệu, trả về vỏ `{ fines, page, limit, total, totalPages }`, tìm kiếm các trường ngữ cảnh đã phê duyệt và sắp xếp theo `FineId ASC`.
- Frontend gửi truy vấn `q`, `status`, `page` và `limit` chuẩn, chỉ hiển thị các hàng máy chủ trả về, sử dụng tổng/số trang của máy chủ và không có phương án dự phòng lưu trữ trình duyệt.

## Công việc tiếp nối frontend và trình duyệt L4

| Cổng | Kết quả |
| --- | --- |
| Ranh giới nguồn ĐỎ | Thất bại vì `fineListQuery.js` không tồn tại |
| Ranh giới trình duyệt ĐỎ | Hết thời gian chờ `page=1&limit=8`, chứng minh UI bỏ qua tham số phân trang máy chủ |
| Frontend trọng tâm | PASS - 6/6 kiểm thử |
| Toàn bộ frontend | PASS - 146/146 kiểm thử |
| Lint/bản dựng frontend | PASS; cảnh báo kích thước khối không chặn hiện có vẫn còn |
| Trình duyệt/L4 FE09 trên `4185/3101` | PASS - 1/1 |
| Toàn bộ bộ trình duyệt trên `4185/3101` | PASS - 3/3 |

Bằng chứng trình duyệt chứng minh yêu cầu trang đầu và trang hai, lọc trạng thái, lọc kết hợp tìm kiếm/trạng thái, tổng máy chủ chuẩn, số hàng trả về và không tràn ngang ở chiều rộng 390px.

## Bằng chứng CI của yêu cầu kéo

- Commit triển khai: `dfe45ae75da61f1ff66ac544625f8559c1a821d3`.
- PR nháp: #40.
- Lần chạy GitHub Actions: `29680600893`.
- Kết quả: PASS. Hồi quy backend, tích hợp hệ thống, độ bao phủ, lint/kiểm thử/bản dựng frontend, Playwright 3/3, truy vết và nhập tình trạng hoàn tất thành công.

## Các cổng còn mở

- Sau đó SQL trực tiếp đạt toàn bộ 9/9 ca FE09 trên môi trường chạy SQL Server dùng một lần đã phê duyệt kèm bằng chứng dọn dẹp.
- Gói backend không có cấu hình ESLint hoặc tập lệnh lint; các tệp backend đã thay đổi được kiểm tra cú pháp, trong khi lint backend dự án vẫn là cổng nợ kỹ thuật trong DoD.
- Đánh giá tích hợp B7 của con người vẫn bắt buộc trước khi hợp nhất/chấp thuận cuối.

## Xác thực lại sau đồng bộ Origin

- Tua nhanh worktree tính năng đang có thay đổi từ `62ac2d1` lên `origin/main@b2ad9b1` mà không chồng lấn, commit, cất tạm hoặc mất thay đổi cục bộ.
- Xác minh trọng tâm mới sau đồng bộ: bộ tuyến/ranh giới cũ/hợp đồng FE09 đạt 30/30.
