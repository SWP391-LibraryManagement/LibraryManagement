# Xác thực SQL trực tiếp cho đối soát toàn bộ - 2026-07-19

Trạng thái: PASS

Phạm vi: xác thực đối soát FE01-FE12 dựa trên SQL ở SQL Server cục bộ.

Ranh giới chạy lại cuối: lặp lại thành công sau khi sửa tranh chấp giao dịch FE06 và đặt trước còn mở FE08.

## Môi trường chạy cô lập

- Cơ sở dữ liệu dùng một lần: `LibraryManagementDB`, chỉ được tạo cho tiến trình kiểm thử vì tập lệnh đường cơ sở chuẩn sở hữu tên cơ sở dữ liệu đó
- Đăng nhập SQL dùng một lần: đăng nhập chỉ dành cho đối soát được tạo
- Bí mật xác thực: chỉ được tạo trong bộ nhớ tiến trình; không bao giờ ghi vào tệp hoặc đầu ra lệnh
- Cơ sở dữ liệu ứng dụng: không được dùng hoặc thay đổi

## Xác thực lược đồ

Đường cơ sở chuẩn `database/Librarymanagement.sql` được áp dụng cho cơ sở dữ liệu dùng một lần.
Sau đó các phần di chuyển này được áp dụng hai lần theo thứ tự để chứng minh khả năng thực thi lặp lại:

1. `database/migrations/2026-07-19-fe04-membership-concurrency.sql`
2. `database/migrations/2026-07-19-fe05-book-rowversion.sql`
3. `database/migrations/2026-07-19-fe06-bookcopy-rowversion.sql`
4. `database/migrations/2026-07-19-fe10-otp-templates.sql`
5. `database/migrations/2026-07-19-fe11-finalization.sql`

Kết quả: đường cơ sở PASS; lượt di chuyển 1/2 PASS; lượt di chuyển 2/2 PASS.

## Các bộ dựa trên SQL

Ranh giới lệnh: Jest `**/*.sqltest.js` với cờ thay đổi tính năng chỉ được bật cho tiến trình cơ sở dữ liệu dùng một lần.

| Bộ | Kết quả |
| --- | --- |
| `backend/tests/sql/publicBrowseAvailability.sqltest.js` | PASS |
| `backend/tests/sql/profileConcurrency.sqltest.js` | PASS |
| `backend/tests/sql/membershipConcurrency.sqltest.js` | PASS |
| `backend/tests/sql/bookConcurrency.sqltest.js` | PASS |
| `backend/tests/sql/inventoryConcurrency.sqltest.js` | PASS |
| `backend/tests/sql/borrowingConcurrency.sqltest.js` | PASS |
| `backend/tests/sql/reservationCandidates.sqltest.js` | PASS |
| `backend/tests/sql/fineConcurrency.sqltest.js` | PASS |
| `backend/tests/sql/systemIntegration.sqltest.js` | PASS |

Kết quả tổng hợp: **9/9 bộ, 69/69 kiểm thử đạt**.

## Lỗi được phát hiện trong xác thực trực tiếp

1. Đường cơ sở dùng tên vật lý `BookCopies.RowVersion` trong khi liên kết FE06 chuẩn yêu cầu `BookCopies.Version`.
2. SQL động trong phần di chuyển FE11 đã cố nối `QUOTENAME` bên trong `EXEC`; phần di chuyển hiện tạo biến câu lệnh và thực thi qua `sys.sp_executesql`.
3. Các xác nhận SQL hệ thống FE12 kỳ vọng trường tải trọng cũ và đã được căn chỉnh theo hợp đồng tất định.
4. Rào cản đồng thời FE07 xung đột với `sp_getapplock` được chủ ý giới hạn theo Thành viên; kiểm thử hiện chỉ chấp nhận kết quả tuần tự hóa đã phê duyệt.
5. FE05 so sánh chuỗi hex rowversion chuẩn 16 ký tự với chuỗi nhị phân 8 byte do trình điều khiển `mssql` trả về cho `CONVERT(VARCHAR, RowVersion, 2)`, nên mọi thao tác cập nhật/vô hiệu hóa/kích hoạt lại hợp lệ đều bị phân loại là cũ. FE05 hiện đọc vùng đệm rowversion thô và chuẩn hóa cả hai toán hạng so sánh qua một bộ mã hóa hex.
6. Bộ ứng viên FE08 ban đầu giả định đường cơ sở ứng viên trống, nhưng dữ liệu mồi chuẩn đã chứa một bản sao được mượn. Truy vấn dữ liệu cố định hiện được giới hạn bằng khóa tìm kiếm đã tạo để xác thực phép chiếu, lọc, số lượng, thứ tự và phân trang mà không coi ứng viên đường cơ sở hợp lệ là hàng thuộc kiểm thử.
7. Các kiểm tra trước của dịch vụ FE06 không có thẩm quyền trước thay đổi trạng thái xảy ra trước khóa thay đổi. SQL trực tiếp hiện chứng minh các thay đổi mượn, đặt trước và sách cha được đưa vào sau kiểm tra trước bị từ chối trước khi thay đổi bản sao/tạo mới.

## Bằng chứng dọn dẹp

Dọn dẹp chạy trong ranh giới `finally` sau các bộ:

- Trạng thái cơ sở dữ liệu: `DB_CLEAN`
- Trạng thái đăng nhập: `LOGIN_CLEAN`
- Tệp môi trường hoặc thông tin xác thực đã lưu: không có

## Ranh giới còn lại

Bản ghi này chứng minh cổng tự động dựa trên lược đồ và SQL đã liệt kê. Nó không thay thế chấp thuận trình duyệt theo tính năng, hồi quy toàn kho mã, đánh giá diff cuối, liên kết CI hoặc chấp thuận tích hợp của con người.
