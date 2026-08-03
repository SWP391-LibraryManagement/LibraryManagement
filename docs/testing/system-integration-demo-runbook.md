# Sổ tay Trình diễn Tích hợp Hệ thống

Ngày: 2026-07-14; cập nhật luồng kết nối: 29-07-2026

Khán giả: Trình bày dự án SWP391

Thời lượng mục tiêu: năm phút

## 1. Ranh giới bằng chứng

Sử dụng các trang FE07, FE08, FE10 và FE12 để biết quy trình làm việc được kết nối rõ ràng. Cơ sở dữ
liệu môi trường tiền sản xuất có thẩm quyền là Azure SQL. Phản hồi `/health` màu xanh lá cây chỉ
chứng tỏ rằng quy trình máy chủ có thể truy cập được; nó không chứng minh được bốn chuyển đổi trạng
thái chức năng hoặc dữ liệu kinh doanh Azure SQL là chính xác.

Không sử dụng các hàng mẫu lưu trữ cục bộ làm bằng chứng tích hợp cơ sở dữ liệu. Không hiển thị mật
khẩu, mã thông báo, nội dung thông báo, `SafePayload`, chuỗi kết nối hoặc nội dung `.env`.

## 2. Kiểm tra trước

- Chạy cổng môi trường tiền sản xuất chỉ đọc hiện tại và giữ sáu tên kiểm tra của nó hiển thị:

```powershell
$env:STAGING_FRONTEND_URL='https://lemon-wave-04db51100.7.azurestaticapps.net'
$env:STAGING_API_URL='https://app-library-api-staging-nhat714.azurewebsites.net'
npm.cmd run smoke:staging
```

- Chạy `npm.cmd run phase3:performance` và xác nhận số liệu thời gian với hệ số bcrypt 10 cùng gói
  đầu vào được tạo mà không chứa danh tính hoặc mã thông báo.
- Khởi động cả hai ứng dụng với `npm.cmd run dev`.
- Xác minh `Invoke-RestMethod http://localhost:3000/health` trả về trạng thái tốt.
- Mở URL giao diện do Vite in ra và xác nhận đăng nhập hoạt động cho hai tài khoản Thành viên đã được
  phê duyệt (A/B) và một tài khoản Thủ thư.
- Ghi lại một `copyId` tổng hợp có trạng thái là `AVAILABLE`.
- Xác nhận cả hai thành viên là `ACTIVE`, thành viên là `APPROVED`, mỗi thành viên có ít hơn
  hơn năm lượt mượn đang hoạt động, không có lượt mượn quá hạn đang hoạt động và không có khoản phạt `UNPAID`.
- Giữ một bảng trạng thái nhỏ với `memberAUserId`, `memberBUserId`,
`librarianUserId`, `copyId`, cả hai giá trị `requestId`, `borrowDetailId`, `reservationId` và bốn
giá trị `notificationId` dự kiến.
- Không bao giờ đặt mật khẩu tài khoản hoặc mã thông báo ghi tên vào tệp hoặc trang trình bày này.

## 3. Luồng năm phút

| Thời gian | Hành động | Bằng chứng cho thấy |
| --- | --- | --- |
| 0:00-0:25 | Hiển thị `/health`, đặt tên ranh giới Azure SQL và đăng nhập với tư cách Thành viên A. | Khả năng tiếp cận chỉ là một kiểm thử trước; bản sao được chọn là `AVAILABLE`. |
| 0:25-0:55 | A mở `/borrowing/new` và tạo yêu cầu. | Yêu cầu FE07 là `PENDING`; chi tiết là `REQUESTED`. |
| 0:55-1:25 | Thủ thư mở `/librarian/borrow-requests` và phê duyệt. | Yêu cầu/chi tiết/bản sao FE07 trở thành `APPROVED`/`BORROWED`/`BORROWED`; tồn tại một thông báo `BORROW_REQUEST_APPROVED`. |
| 1:25-1:50 | A mở mục chuông. | FE10 đánh dấu nó đã đọc, mở `/borrowing/history` và dòng thời gian FE07 sử dụng dấu thời gian chuẩn. |
| 1:50-2:20 | B mở `/reservations/mine` và đặt chỗ bản sao đang được mượn. | Lượt đặt chỗ FE08 là `ACTIVE`; vị trí hàng đợi thuộc phạm vi bản sao. |
| 2:20-3:05 | Thủ thư trả bản sao của A và chọn **Xử lý hàng đợi đặt chỗ**. | FE07 trở thành `RETURNED`; `reservationQueueAction` chỉ đọc mở đúng hàng đợi FE08 mà không thay đổi dữ liệu. |
| 3:05-3:35 | Thủ thư chọn **Giữ sách & thông báo**. | FE08 chọn người đầu hàng đợi FIFO; đặt chỗ/bản sao trở thành `NOTIFIED`/`RESERVED`; FE10 chứa một thông báo `RESERVATION_READY`. |
| 3:35-4:15 | B mở **Đặt chỗ sẵn sàng**, kiểm tra hạn nhận và chọn **Tạo yêu cầu mượn**. | Liên kết sâu chứa `bookId` của sách được giữ và đúng `copyId`; yêu cầu FE07 thứ hai là `PENDING`. |
| 4:15-4:40 | Thủ thư phê duyệt yêu cầu của B. | Chi tiết/bản sao thứ hai trở thành `BORROWED`; đặt chỗ FE08 trở thành `FULFILLED`. |
| 4:40-5:00 | Thủ thư mở `/home`. | Sáu giá trị KPI FE12 khớp ảnh chụp trạng thái máy chủ hiện tại; số yêu cầu chờ/đặt chỗ mở là `0`, lượt mượn đang hoạt động là `1`. |

Đừng biến nút quay lại FE07 thành thao tác ghi hàng đợi FE08 tự động. Việc xác nhận riêng biệt thể hiện
trách nhiệm và ranh giới kiểm toán. Nếu yêu cầu FE10 sau cam kết không thành công, hãy hiển thị cảnh
báo an toàn và giữ trạng thái nguồn FE07/FE08 đã được cam kết.

## 4. Dự phòng API

Chỉ sử dụng mã thông báo được nhóm phê duyệt trong phiên cuối hiện tại:

```powershell
$memberHeaders = @{ Authorization = "Bearer $memberToken" }
$staffHeaders = @{ Authorization = "Bearer $librarianToken" }

$created = Invoke-RestMethod -Method Post `
  -Uri 'http://localhost:3000/api/borrow-requests' `
  -Headers $memberHeaders -ContentType 'application/json' `
  -Body (@{ copyIds = @($copyId) } | ConvertTo-Json)

$requestId = $created.borrowRequest.requestId
$borrowDetailId = $created.borrowRequest.details[0].borrowDetailId

$approved = Invoke-RestMethod -Method Patch `
  -Uri "http://localhost:3000/api/borrow-requests/$requestId/approve" `
  -Headers $staffHeaders -ContentType 'application/json' `
  -Body (@{ notes = 'Presentation approval' } | ConvertTo-Json)

$returned = Invoke-RestMethod -Method Patch `
  -Uri "http://localhost:3000/api/borrow-details/$borrowDetailId/return" `
  -Headers $staffHeaders -ContentType 'application/json' `
  -Body (@{ condition = 'NORMAL'; returnDate = '2026-07-14' } | ConvertTo-Json)

$calculated = Invoke-RestMethod -Method Post `
  -Uri 'http://localhost:3000/api/fines/calculate' `
  -Headers $staffHeaders -ContentType 'application/json' `
  -Body (@{ borrowDetailId = $borrowDetailId } | ConvertTo-Json)

$fineId = $calculated.fine.fineId
Invoke-RestMethod -Method Patch `
  -Uri "http://localhost:3000/api/fines/$fineId/paid" `
  -Headers $staffHeaders -ContentType 'application/json' `
  -Body (@{ paymentMethod = 'CASH'; note = 'Presentation fixture' } | ConvertTo-Json)

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/reports/borrowing?fromDate=2026-07-01&toDate=2026-07-31&userId=$memberUserId" `
  -Headers $staffHeaders
```

Nếu giao diện hoặc API không thể khởi động, hãy sử dụng bằng chứng tự động xác định:

```powershell
npm.cmd run test:system
npx.cmd playwright test tests/e2e/fe07-fe12-connected-demo-flow.spec.js --project=chromium

$env:SYSTEM_SQL_TEST_ALLOW_MUTATION = 'true'
$env:SYSTEM_SQL_TEST_ENV_FILE = 'D:\SWP391\library-management-system\backend\.env'
npm.cmd --prefix backend run test:sql:system
```

Kiểm tra hệ thống và kiểm tra Chrome được kết nối chứng minh FE07 -> FE10 -> FE08 -> FE07 -> FE12
với người dùng tổng hợp xác định. Bộ SQL tùy chọn chứng minh đường dẫn được hỗ trợ SQL được ghi lại
riêng biệt và xác minh việc dọn dẹp trước khi thoát.

Nếu cổng `4173` đã được sử dụng bởi một phiên cục bộ khác, hãy giữ nguyên quy trình đó và chạy bằng
chứng trình duyệt trên các cổng bị cô lập:

```powershell
$env:E2E_FRONTEND_PORT='4273'
$env:E2E_BACKEND_PORT='3200'
$env:E2E_FRONTEND_URL='http://127.0.0.1:4273'
$env:E2E_BACKEND_URL='http://127.0.0.1:3200'
npm.cmd run test:e2e
```

## 5. Truy vấn FE10 an toàn

Chỉ chọn siêu dữ liệu. Không chọn chi tiết `Body`, `SafePayload`, mã thông báo hoặc nhà cung cấp.

```sql
SELECT
  NotificationId,
  Status,
  SourceFeature,
  SourceEntityType,
  SourceEntityId,
  CreatedAt
FROM Notifications
WHERE SourceFeature = 'FE07'
  AND (
    (SourceEntityType = 'BorrowRequest' AND SourceEntityId = @RequestId)
    OR
    (SourceEntityType = 'BorrowDetail' AND SourceEntityId = @BorrowDetailId)
  );
```

## 6. Dự phòng thất bại

| Thất bại | Dự phòng |
| --- | --- |
| giao diện không bắt đầu | Hiển thị phản hồi API từ Phần 4 và đầu ra SIT đi qua. |
| SQL Server không có sẵn | Chạy `npm.cmd run test:system`; nói rõ rằng đây là bằng chứng tích hợp trong bộ nhớ mang tính quyết định. |
| Việc gửi email không khả dụng | Hiển thị siêu dữ liệu thông báo FE10 được xếp hàng đợi; việc phân phối không bắt buộc phải chứng minh yêu cầu chức năng chéo. |
| Phiên đăng nhập có vai trò sai | Xóa phiên cũ, đăng nhập lại và hiển thị vai trò trước khi tiếp tục. |
| Lịch thi đấu trực tiếp không nhất quán | Dừng thao tác ghi trực tiếp và sử dụng bằng chứng SQL tự động hoặc ảnh chụp màn hình được chụp trước. Đừng ứng biến với dữ liệu được chia sẻ. |

## 7. Đặt lại danh sách kiểm tra

- Bản sao được khôi phục về `AVAILABLE`, trừ khi nhóm cố tình giữ lại lượt mượn trình diễn đã hoàn thành.
- ID yêu cầu/detail mượn được ghi lại và để ở trạng thái đầu cuối dễ hiểu hoặc bị chủ sở hữu thiết bị xóa.
- Không có thông báo demo nào bất ngờ `PENDING`; không xóa các thông báo không liên quan.
- khoản phạt là `PAID` hoặc khoản phạt tổng hợp được loại bỏ bằng cách dọn dẹp vật cố định của nó.
- Các hàng thành viên/thủ thư tổng hợp và `UserRoles` tổng hợp sẽ bị xóa khi sử dụng tài khoản dùng một lần.
- Phiên trình duyệt hiện tại đã bị đăng xuất và không còn mã thông báo mang nào trong lịch sử hoặc trang trình bày thiết bị đầu cuối được chia sẻ.
- `SIT-SQL-001` kết thúc bằng `TestUsers=0` và `TestCopies=0` thông qua các xác nhận của nó.

## 8. Bản ghi diễn tập

Kết quả lịch sử vẫn còn trong `.sdd/reviews/system-integration-evidence-2026-07-14.md`. Bằng chứng
về trình duyệt, giai đoạn, hiệu suất, hình ảnh và thiết lập lại Giai đoạn 3 hiện tại được ghi lại
trong `docs/release/phase3-user-testing-record-2026-07-19.md`.

Chạy hai lần trước buổi bảo vệ:

1. Tốc độ bình thường: xác minh mọi chuyển đổi trạng thái và thiết lập lại.
2. Tốc độ theo thời gian: hoàn thành trong vòng năm phút bằng cách sử dụng bằng chứng dự phòng khi cần thiết.
