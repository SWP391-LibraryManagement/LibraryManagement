# Xác thực tích hợp Mượn và Đặt trước FE07-FE08

Ngày: 2026-07-15

Trạng thái: ĐÃ XÁC NHẬN ĐÁNH GIÁ CỦA CON NGƯỜI - SẴN SÀNG CHO QUYẾT ĐỊNH TÍCH HỢP

Nhánh: `fix/fe08-borrowing-reservation-integration`

## Mục đích

Ghi nhận bằng chứng xác thực và đánh giá của con người đã hoàn thành của Nhat cho
phần tích hợp mượn FE07 và đặt trước FE08 đã phê duyệt. Lát cắt này giữ FE07
chịu trách nhiệm tạo/phê duyệt mượn và FE08 chịu trách nhiệm xử lý hàng đợi
trong khi thực thi ưu tiên đặt trước xuyên cả hai tính năng.

## Hành vi đã xác thực

| Ranh giới | Kết quả | Bằng chứng |
| --- | --- | --- |
| Mượn thông thường | PASS | Hàng đợi đặt trước `ACTIVE` chặn việc tạo và phê duyệt FE07 thông thường bằng xung đột ưu tiên đã ghi tài liệu. |
| Bàn giao cho chủ sở hữu đã được thông báo | PASS | Chủ sở hữu của lượt đặt trước `NOTIFIED` khớp có thể mượn bản sao `RESERVED` của lượt đó. |
| Hoàn tất nguyên tử | PASS | Phê duyệt FE07 cập nhật yêu cầu mượn, chi tiết, bản sao, lượt đặt trước khớp và bản ghi kiểm toán trong một giao dịch; lượt đặt trước trở thành `FULFILLED`. |
| Đồng thời | PASS | Chuyển trạng thái bản sao/đặt trước dùng thứ tự khóa `BookCopies -> Reservations` dùng chung. |
| Quyền sở hữu hàng đợi | PASS | Xử lý hàng đợi FE08 vẫn thủ công; không thêm endpoint, bảng, cột hoặc công việc tự động. |
| Hợp đồng lỗi | PASS | Xung đột ưu tiên đặt trước được cung cấp qua backend/OpenAPI ổn định và thông báo frontend tiếng Việt. |

## Bằng chứng tự động

| Kiểm tra | Kết quả | Độ mới |
| --- | --- | --- |
| Cổng backend FE07/FE08 trọng tâm | PASS - 92/92 | Được ghi nhận trước đó trên nhánh này sau triển khai. |
| Toàn bộ bộ backend | PASS - 321/321 | Được ghi nhận trước đó trên nhánh này sau triển khai. |
| Kiểm thử frontend | PASS - 73/73 | Được ghi nhận trước đó trên nhánh này; không có mã frontend nào thay đổi sau đó. |
| Lint frontend | PASS | Được ghi nhận trước đó trên nhánh này; không có mã frontend nào thay đổi sau đó. |
| Bản dựng frontend production | PASS | Được ghi nhận trước đó trên nhánh này; chỉ còn cảnh báo kích thước khối Vite không chặn. |
| Bộ đồng thời Azure SQL | PASS - 20/20 | Được ghi nhận trên staging; không có mã SQL hoặc kho dữ liệu production nào thay đổi sau kết quả này. Không xảy ra bế tắc và việc dọn dữ liệu mồi kiểm thử trả về 0 hàng. |
| Hợp đồng thông báo lỗi | PASS - 7/7 | Được ghi nhận trước đó trên nhánh này. |
| Hợp đồng OpenAPI | PASS - 5/5 | Được ghi nhận trước đó trên nhánh này. |
| Các bộ hồi quy dữ liệu cố định | PASS - 2 bộ, 21/21 | Mới sau commit `16fa2ed`; bao phủ `systemIntegration.test.js` và `integration.test.js`. |
| Thực thi truy vết | PASS | Mới: FE07 có 24/25 thẻ FR (96%), FE08 có 23/26 thẻ FR (88%), 0 tính năng đã triển khai dưới 70%. |
| Kiểm tra diff nhánh | PASS | Mới: `git diff main...HEAD --check` thoát với mã 0. |

## Khắc phục dữ liệu cố định

Các bộ kiểm thử tích hợp và tích hợp hệ thống dùng nơi lưu FE07 trong bộ nhớ riêng
và nơi lưu FE08 để mô hình hóa một cơ sở dữ liệu SQL. Sau khi FE08 giữ một bản sao, bộ kiểm thử
hiện đồng bộ cả trạng thái bản sao và xác nhận chủ sở hữu đặt trước vào nơi lưu
FE07. Điều này giữ dữ liệu cố định trung thực với hành vi production và ngăn
`RESERVATION_STATE_CONFLICT` giả trong kịch bản xuyên tính năng.

Commit: `16fa2ed test: sync reservation claims in integration harness`

## Kiểm soát phạm vi

- `git diff main...HEAD -- database frontend/src/page frontend/src/component backend/src/routes` không có kết quả.
- Không thêm lược đồ cơ sở dữ liệu, endpoint, tuyến, trang frontend hoặc thành phần frontend.
- Thay đổi sản phẩm được giới hạn ở đặc tả FE07/FE08, kho dữ liệu và hành vi dịch vụ mượn/đặt trước, hợp đồng OpenAPI/lỗi và kiểm thử trọng tâm.
- Tự động hóa hàng đợi do trả FE07 kích hoạt, tiến trình gửi FE10, tự động hết hạn giữ chỗ và phân trang đặt trước phía máy chủ vẫn nằm ngoài lát cắt này.
- Nhánh không chứa bí mật hoặc thông tin xác thực staging.

## Các commit trong phạm vi đánh giá

- `c7a4e83 docs: define borrowing reservation integration`
- `2694778 docs: align reservation transaction lock order`
- `090b9e0 docs: plan borrowing reservation integration`
- `d5c5dfe docs: align borrowing reservation contracts`
- `2f8b753 feat: enforce reservation priority in borrowing`
- `8acf2af feat: fulfill reservations during borrow approval`
- `a6137d4 fix: serialize reservation and borrowing transitions`
- `39f9c1a docs: expose reservation priority conflicts`
- `16fa2ed test: sync reservation claims in integration harness`
- `cf08c0e docs: validate borrowing reservation integration`

## Danh sách kiểm tra của con người

- [x] Xác nhận việc tạo FE07 chặn mượn thông thường khi có hàng đợi `ACTIVE`.
- [x] Xác nhận chỉ chủ sở hữu `NOTIFIED` khớp mới có thể mượn bản sao `RESERVED` đang được giữ.
- [x] Xác nhận phê duyệt thay đổi nguyên tử lượt đặt trước khớp thành `FULFILLED`.
- [x] Xác nhận thứ tự khóa `BookCopies -> Reservations` nhất quán trong các đường dẫn giữ, hủy, hết hạn và hoàn tất.
- [x] Xác nhận xử lý hàng đợi vẫn thủ công và danh sách ngoài phạm vi không đổi.
- [x] Xác nhận thông báo lỗi/OpenAPI giải thích rõ xung đột ưu tiên đặt trước.
- [x] Phê duyệt hoặc yêu cầu thay đổi trước mọi thao tác đẩy hoặc hợp nhất.

Nhat đã xác nhận rõ `đã review` trong tác vụ Codex này vào 2026-07-15. Việc này
đóng cổng đánh giá bắt buộc của con người; nó không tự cho phép đẩy hoặc
hợp nhất.

## Cổng còn lại

Chọn đường dẫn tích hợp cho nhánh đã đánh giá. Chưa thực hiện đẩy, yêu cầu kéo hoặc
hợp nhất.

Kết luận: **Xác thực tự động và đánh giá của con người hoàn thành; sẵn sàng cho quyết định tích hợp.**
