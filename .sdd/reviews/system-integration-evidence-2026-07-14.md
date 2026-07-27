# Bằng chứng tích hợp hệ thống - 2026-07-14

Nhánh: `test/system-integration`

Kế hoạch: `docs/superpowers/plans/2026-07-14-system-integration-test-plan.md`

Chỉ các kết quả đã quan sát mới được đánh dấu `PASS`. Các lần diễn tập thuyết trình dưới đây dùng phương án dự phòng tự động không có trình duyệt, vì vậy vẫn khuyến nghị con người kiểm tra trực quan lần cuối trên UI đang chạy trước khi trình bày.

| ID | Trạng thái | Lệnh / thao tác | Kết quả quan sát | Dọn dẹp |
| --- | --- | --- | --- | --- |
| SIT-000 | PASS | `npm.cmd run test:system` | Cả sáu dịch vụ đã hoàn thành và bám sát production được kết nối vào một ứng dụng Express. | Trạng thái trong bộ nhớ được tạo lại cho mỗi bộ kiểm thử. |
| SIT-001 | PASS | `npm.cmd run test:system` | Các ranh giới xác thực và vai trò được thực thi xuyên suốt FE07/FE08/FE09/FE10/FE12. | Trạng thái trong bộ nhớ được tạo lại cho mỗi bộ kiểm thử. |
| SIT-002 | PASS | `npm.cmd run test:system` | Việc phê duyệt FE07 tạo ra dữ liệu thông báo hạn trả FE10 và hoạt động khoản mượn FE12. | Trạng thái trong bộ nhớ được tạo lại cho mỗi bộ kiểm thử. |
| SIT-003 | PASS | `npm.cmd run test:system` | Xử lý hàng đợi FE08 giữ bản sao, thông báo cho Thành viên và chặn một lượt mượn FE07 khác. | Trạng thái trong bộ nhớ được tạo lại cho mỗi bộ kiểm thử. |
| SIT-004 | PASS | `npm.cmd run test:system` | Ưu tiên đặt trước chặn gia hạn mà không làm thay đổi khoản mượn đang hoạt động. | Trạng thái trong bộ nhớ được tạo lại cho mỗi bộ kiểm thử. |
| SIT-005 | PASS | `npm.cmd run test:system` | Một lượt trả quá hạn 14 ngày tạo ra khoản phạt `UNPAID` trị giá 70,000 VND. | Trạng thái trong bộ nhớ được tạo lại cho mỗi bộ kiểm thử. |
| SIT-006 | PASS | `npm.cmd run test:system` | Khoản phạt chưa thanh toán chặn việc mượn; đánh dấu đã thanh toán cho phép yêu cầu hợp lệ tiếp theo. | Trạng thái trong bộ nhớ được tạo lại cho mỗi bộ kiểm thử. |
| SIT-007 | PASS | `npm.cmd run test:system` | Các yêu cầu thông báo vẫn có tính lũy đẳng và chỉ để lộ dữ liệu phản hồi an toàn. | Trạng thái trong bộ nhớ được tạo lại cho mỗi bộ kiểm thử. |
| SIT-008 | PASS | `npm.cmd run test:system` | FE12 vẫn chỉ đọc và loại các chi tiết `REQUESTED` khỏi hoạt động mượn thực tế. | Trạng thái trong bộ nhớ được tạo lại cho mỗi bộ kiểm thử. |
| SIT-009 | PASS | `npm.cmd run test:system` | Lỗi yêu cầu FE10 không hoàn tác trạng thái mượn FE07 đã được phê duyệt. | Trạng thái trong bộ nhớ được tạo lại cho mỗi bộ kiểm thử. |
| SIT-SQL-001 | PASS | `$env:SYSTEM_SQL_TEST_ALLOW_MUTATION='true'; $env:SYSTEM_SQL_TEST_ENV_FILE='D:\SWP391\library-management-system\backend\.env'; npm.cmd --prefix backend run test:sql:system` | 1 bộ kiểm thử đạt, 1 kiểm thử đạt. Việc phê duyệt/trả FE07 được FE10 nhìn thấy, FE09 tính 14 ngày = 70,000 VND và FE12 báo cáo hoạt động. | Các xác nhận dọn dẹp trả về `TestUsers=0` và `TestCopies=0`; mẫu thông báo tạm thời và các hàng dữ liệu mồi đã được xóa. |

## Các cổng xác minh

| Cổng | Trạng thái | Kết quả quan sát |
| --- | --- | --- |
| Toàn bộ bộ kiểm thử backend | PASS | `npm.cmd --prefix backend test`: 21 bộ kiểm thử đạt, 282 kiểm thử đạt. |
| Toàn bộ bộ kiểm thử frontend | PASS | `npm.cmd --prefix frontend test`: 37 kiểm thử đạt. |
| Cổng tích hợp hệ thống trọng tâm | PASS | `npm.cmd run test:system`: 1 bộ kiểm thử đạt, 9 kiểm thử đạt. Cảnh báo SMTP chưa được cấu hình chỉ mang tính khuyến cáo. |
| Cổng trạng thái dùng chung SQL | PASS | `npm.cmd --prefix backend run test:sql:system`: 1 bộ kiểm thử đạt, 1 kiểm thử đạt cùng các xác nhận dọn dẹp. |
| Kiểm tra lint frontend | PASS | `npm.cmd --prefix frontend run lint` thoát với mã 0 và không có lỗi lint. |
| Bản dựng frontend | PASS | `npm.cmd --prefix frontend run build` thoát với mã 0; Vite đưa ra khuyến cáo rằng khối JS 952.61 kB vượt quá 500 kB. |
| Thực thi truy vết | PASS | `npm.cmd run trace:enforce`: 6 tính năng đã triển khai, 0 tính năng dưới ngưỡng 70%. |
| Kiểm tra khoảng trắng của diff | PASS | `git diff --check` thoát với mã 0; chỉ in cảnh báo chuyển đổi kết thúc dòng. |

## Diễn tập thuyết trình

| Diễn tập | Trạng thái | Quan sát bắt buộc |
| --- | --- | --- |
| Nhịp độ bình thường | PASS | Phương án dự phòng tự động chạy với tên ca chi tiết: SIT 9/9 và SQL 1/1 đạt trong 6.62 giây; các xác nhận dọn dẹp SQL đạt. Không có tuyên bố nào về trình duyệt hoặc UI trực tiếp. |
| Phương án dự phòng giới hạn năm phút | PASS | Phương án dự phòng tự động hoàn tất trong 6.67 giây, dưới giới hạn 300 giây; SIT 9/9 và SQL 1/1 đạt kèm dọn dẹp. |
