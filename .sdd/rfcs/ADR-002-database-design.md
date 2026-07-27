# ADR-002: Thiết kế cơ sở dữ liệu

Trạng thái: ĐÃ PHÊ DUYỆT - MIGRATION HOÀN THIỆN FE11 ĐANG HOẠT ĐỘNG; ĐANG CHỜ TRIỂN KHAI
Ngày: 2026-06-10
Cập nhật lần cuối: 2026-07-23

## Bối cảnh

Cơ sở dữ liệu đã được phê duyệt là SQL Server. Script baseline hiện tại là `database/Librarymanagement.sql`.

Đặc tả tính năng là nguồn chuẩn cho hành vi nghiệp vụ. Script SQL là hiện vật thiết kế baseline và phải được rà soát đối chiếu với các đặc tả đã phê duyệt trước khi triển khai tính năng.

## Quyết định

Dùng SQL Server với các bảng quan hệ cho người dùng, vai trò, sách, bản sao, mượn, đặt chỗ, tiền phạt, thông báo, dữ liệu nguồn báo cáo và nhật ký kiểm toán.

Ứng dụng phải truy cập cơ sở dữ liệu bằng package Node.js `mssql` với truy vấn tham số hóa. Cấm nội suy chuỗi trực tiếp trong SQL.

## Quyền sở hữu bảng baseline

| Khu vực | Bảng dự kiến | Tính năng sở hữu |
| --- | --- | --- |
| Người dùng và vai trò | `Users`, `Roles`, `UserRoles` | FE02, FE11 |
| Hồ sơ và tư cách thành viên | `UserProfiles`, `Members`, các bảng tư cách thành viên/đơn đăng ký nếu có | FE03, FE04 |
| Sách | `Books`, `Categories`, `Authors`, `Publishers` nếu có | FE01, FE05 |
| Tồn kho/bản sao | `BookCopies` hoặc bảng tồn kho bản sao tương đương | FE06 |
| Mượn | `BorrowRequests`, `BorrowTransactions`, `BorrowDetails` hoặc tương đương | FE07 |
| Đặt chỗ | `Reservations` hoặc bảng hàng đợi/giữ sách tương đương | FE08 |
| Tiền phạt | `Fines`, bản ghi thanh toán/thu tiền phạt nếu có | FE09 |
| Thông báo | `Notifications`, `NotificationTemplates`, `NotificationAttempts` nếu có | FE10 |
| Kiểm toán | `AuditLogs` | Liên tính năng, đặc biệt FE02, FE05, FE07, FE09, FE11 |
| Báo cáo | Truy vấn chỉ đọc trên các bảng nguồn | FE12 |

## Các mục bắt buộc rà soát lược đồ

Trước khi triển khai, kiểm tra `database/Librarymanagement.sql` theo các quy tắc đã phê duyệt sau:

- Người dùng phải hỗ trợ trạng thái hoạt động/không hoạt động và gán vai trò.
- Phải lưu mã băm mật khẩu, không bao giờ lưu mật khẩu văn bản thuần.
- Tính duy nhất của email/tên người dùng phải khớp quy tắc FE02/FE11 đã phê duyệt.
- Nếu phần triển khai lưu token, token refresh/đặt lại/thiết lập không được lưu như bí mật thô; lưu token đã băm khi khả thi.
- Tính sẵn có của sách phải được suy ra từ dữ liệu bản sao/trạng thái đã phê duyệt, không chỉ từ một trường hiển thị rời rạc.
- Danh mục, tác giả và nhà xuất bản lưu dấu thời gian `CreatedAt` do cơ sở dữ liệu tạo để các thao tác đọc quản lý danh mục được bảo vệ không tự tạo ngày khởi tạo.
- Danh mục, tác giả và nhà xuất bản dùng trạng thái `ACTIVE`/`INACTIVE` thay vì xóa vật lý; giữ nguyên các tham chiếu sách hiện có.
- Trạng thái bản sao phải khớp các trạng thái Giai đoạn 1 đã phê duyệt: `AVAILABLE`, `BORROWED`, `RESERVED`, `DAMAGED`, `LOST`, `INACTIVE`.
- Lượt mượn phải ghi thành viên, bản sao/sách, ngày mượn, hạn trả, trạng thái và người tạo.
- Phép tính tiền phạt phải truy vết được: số ngày quá hạn, mức phạt, số tiền, lượt mượn/bản sao liên quan và ngày tính.
- Lần thử thông báo không được lưu token đặt lại thô hoặc liên kết nhạy cảm trong nhật ký.
- Nhật ký kiểm toán phải ghi tác nhân, hành động, mục tiêu, dấu thời gian và siêu dữ liệu an toàn.
- FE07 lưu `BorrowRequests.Status` là `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED` hoặc `CANCELLED`; lưu `BorrowDetails.Status` là `REQUESTED`, `BORROWED`, `RETURNED`, `LOST` hoặc `DAMAGED`. `BorrowDetails.DueDate` có thể null với chi tiết `REQUESTED` và luồng phê duyệt bắt buộc phải đặt giá trị trước khi chuyển sang `BORROWED`. `OVERDUE` được FE09/FE12 suy ra từ `BORROWED` cùng `DueDate < today`, nên bị loại khỏi `CK_BorrowDetails_Status`.

## Chính sách migration

- Không âm thầm thay đổi lược đồ cơ sở dữ liệu.
- Mọi thay đổi lược đồ ảnh hưởng hành vi phải cập nhật `SPEC.md` hoặc ADR liên quan trước khi triển khai.
- Trong Giai đoạn 1 có thể dùng script SQL thay cho framework migration, nhưng mọi bản sửa đổi lược đồ phải có thể rà soát.
- CI không được kết nối cơ sở dữ liệu hoặc thực thi thay đổi lược đồ. Triển khai staging vẫn thực hiện thủ công.
  Migration thường được áp dụng bởi người vận hành được ủy quyền qua đường quản trị
  cơ sở dữ liệu đã phê duyệt. Ngoại lệ khởi động duy nhất của Giai đoạn 1 là
  `2026-07-22-library-metadata-compatibility.sql`: backend áp dụng script tương thích có giao dịch,
  có tính idempotent và đã được rà soát này trước khi lắng nghe, vì nếu không thì lược đồ staging
  legacy khiến API siêu dữ liệu Quản trị viên không thể sử dụng. Khi khởi động, hệ thống xác minh hậu điều kiện và
  đóng an toàn khi thất bại; `/health/ready` vẫn chỉ đọc.
- Dữ liệu seed không được chứa dữ liệu cá nhân thực, mật khẩu, token hoặc bí mật.

## Quyết định tài khoản một vai trò FE11

Mỗi tài khoản được lưu có chính xác một hàng `UserRoles`. `MEMBER`, `LIBRARIAN` và `ADMIN` là các vai trò đăng nhập loại trừ lẫn nhau; thay đổi vai trò xóa ánh xạ hiện tại và chèn ánh xạ đã chọn trong một giao dịch có khóa cùng mục kiểm toán. Trường phản hồi tương thích `roles` vẫn là mảng nhưng có chính xác một phần tử.

Lược đồ baseline dùng chỉ mục duy nhất mang tính xác định `UX_UserRoles_UserId`. Các môi trường hiện có dùng migration có tính idempotent, có thể rà soát `database/migrations/2026-07-27-fe11-single-role-per-account.sql`. Migration thất bại an toàn nếu người dùng nào đã có nhiều hơn một ánh xạ; Quản trị viên phải xử lý rõ các tài khoản đó trước khi thử lại để quá trình triển khai không bao giờ tự đoán quyền nào cần giữ.

## Quyết định claim phân phối bền vững FE10

Vòng đời FE10 đã phê duyệt gồm `PENDING`, `PROCESSING`, `SENT` và
`FAILED`. `DELIVERED`, `SKIPPED` và `CANCELLED` vẫn là các giá trị tương thích
không có chuyển đổi trong Giai đoạn 1.

- Worker hàng đợi chuyển một hàng đủ điều kiện từ `PENDING` sang `PROCESSING` trong
  một giao dịch có khóa và commit trước I/O của nhà cung cấp.
- Yêu cầu nhạy cảm đồng bộ được chèn ở trạng thái `PROCESSING` trước I/O của nhà cung cấp,
  còn thông tin xác thực đã kết xuất chỉ nằm trong bộ nhớ.
- `PROCESSING -> SENT` và `PROCESSING -> FAILED` đều dùng một giao dịch ngắn mới,
  đồng thời chèn hàng `NotificationAttempts` tương ứng.
- Nếu I/O của nhà cung cấp hoàn tất nhưng lưu bền trạng thái cuối thất bại, hàng bền vững
  vẫn ở `PROCESSING`. Hàng này không được tự động thu hồi và không thể dùng endpoint
  thử lại thủ công vì việc phân phối có thể đã xảy ra.

Ràng buộc chuẩn được đồng bộ bằng migration có tính idempotent, có thể rà soát
`database/migrations/2026-07-23-fe10-processing-status.sql`. Việc rà soát yêu cầu
tính tương đương tĩnh giữa model/baseline/OpenAPI cùng hai lần thực thi thành công trên một
cơ sở dữ liệu SQL Server cục bộ dùng một lần có tên trước khi triển khai Azure.

## Quyết định migration hoàn thiện FE11

Lô hoàn thiện FE11 đã phê duyệt kích hoạt một script SQL Server có tính idempotent, có thể rà soát tại
`database/migrations/2026-07-19-fe11-finalization.sql`. Việc triển khai sản phẩm chưa bắt đầu tại
điểm kiểm soát quản trị này.

Migration phải đồng bộ năm cột của bảng hiện có sau với lược đồ baseline và
hợp đồng ứng dụng:

| Bảng | Cột | Định nghĩa mục tiêu |
| --- | --- | --- |
| `Users` | `Email` | `NVARCHAR(255) NOT NULL` |
| `Users` | `DeactivatedAt` | `DATETIME NULL` |
| `UserProfiles` | `Department` | `NVARCHAR(100) NULL` |
| `UserProfiles` | `Specialization` | `NVARCHAR(100) NULL` |
| `Notifications` | `RecipientEmail` | `NVARCHAR(255) NOT NULL` |

`Users.Email` dùng chỉ mục duy nhất mang tính xác định `UX_Users_Email`. Trước khi thay đổi, script phải
thất bại an toàn nếu email nào dài quá 255 ký tự hoặc tồn tại giá trị trùng không phân biệt hoa thường.
Script phải giữ nguyên dữ liệu, dùng tên đối tượng mang tính xác định, không chứa danh tính seed hoặc thông tin xác thực,
và an toàn khi thực thi hai lần mà không tạo cột, ràng buộc, chỉ mục trùng hoặc thay đổi dữ liệu.

Việc rà soát yêu cầu kiểm tra hợp đồng tĩnh cùng hai lần thực thi thành công trên một cơ sở dữ liệu SQL
Server dùng một lần khi môi trường đó sẵn có. Nếu không có SQL Server trực tiếp, chỉ bằng chứng
thực thi này được phép còn ghi dưới `TD-021`; script, baseline, model, binding và
kiểm tra idempotency tĩnh vẫn bắt buộc.

Các bằng chứng SQL Server dùng một lần bắt buộc đã đạt vào 2026-07-19: baseline chuẩn và cả
năm migration đối soát đã thực thi thành công, các migration đạt ở lần thực thi thứ hai,
và cơ sở dữ liệu/thông tin đăng nhập đã được xóa sau đó. Xem
`.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.

Nâng cấp staging Azure Giai đoạn 3 cho thấy một khác biệt lược đồ legacy mà baseline chuẩn
dùng một lần không có: `Books.ISBN` vẫn có chỉ mục duy nhất có lọc
`UX_Books_ISBN_NotNull` trong khi độ rộng cần đối soát. Vì vậy migration FE05 chỉ xóa
chỉ mục có tên đó bên trong nhánh thay đổi độ rộng, thay đổi `ISBN` và tạo lại cùng chỉ mục duy nhất
có lọc trong giao dịch. Lược đồ mục tiêu và hợp đồng FE05 không thay đổi; điều này giúp
migration đã phê duyệt an toàn cho cả cơ sở dữ liệu Tuần 13 hiện có lẫn baseline chuẩn.

## Quyết định migration đồng thời tư cách thành viên FE04

FE04 sở hữu chỉ mục duy nhất có lọc
`UX_MembershipApplications_User_Pending` trên `MembershipApplications(UserId)` khi
`Status = 'PENDING'`. Điều này giữ lịch sử phê duyệt/từ chối bất biến, đồng thời biến quy tắc mỗi người dùng chỉ có một
đơn đang chờ thành bất biến cơ sở dữ liệu thay vì bước kiểm tra trước chỉ ở service.

Migration có tính idempotent, có thể rà soát là
`database/migrations/2026-07-19-fe04-membership-concurrency.sql`. Nó phải thất bại an toàn khi dữ liệu
hiện có đã chứa các hàng đang chờ trùng lặp, không tạo dữ liệu seed và an toàn khi thực thi hai lần.
Các thao tác thay đổi đơn và rà soát phải giữ phép chiếu `Members` chuẩn cùng mục kiểm toán tương ứng
trong cùng giao dịch SQL; thao tác đọc để rà soát cuối dùng `UPDLOCK, HOLDLOCK` và thao tác cập nhật giữ
điều kiện `Status = 'PENDING'`.

## Cấu hình

Giá trị kết nối cơ sở dữ liệu phải lấy từ biến môi trường, ví dụ:

- `DB_SERVER`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_ENCRYPT`
- `DB_TRUST_SERVER_CERTIFICATE`

Không được commit thông tin xác thực cơ sở dữ liệu.

## Hệ quả

- Tuần 4 nên có đợt rà soát khoảng cách lược đồ trước khi triển khai repository backend.
- Phương thức repository phải được viết theo tên bảng/cột đã phê duyệt sau khi rà soát lược đồ.
- Báo cáo FE12 phải đọc từ bảng nguồn và giữ chế độ chỉ đọc.

## Kết quả smoke test Tuần 4

`database/Librarymanagement.sql` đã được sửa sau đợt rà soát khoảng cách cơ sở dữ liệu Tuần 4 và được smoke test trên SQL Server cục bộ.

Lệnh:

```powershell
sqlcmd -S localhost -E -b -i database\Librarymanagement.sql
```

Kết quả:

- PASS trên `MSSQLSERVER` cục bộ.
- Cơ sở dữ liệu đã tạo: `LibraryManagementDB`.
- Số bảng đã tạo: 20.
- Đã xác nhận các bảng Tuần 4 chính: `AuthTokens`, `NotificationTemplates`, `Notifications`, `NotificationAttempts`, `Members`, `AuditLogs`.

Vẫn cần nhóm rà soát trước khi merge vì lược đồ cơ sở dữ liệu là hiện vật Cốt lõi.

## Cổng lược đồ Tuần 4

Trước khi bắt đầu triển khai Tuần 5:

- [x] Lập bản rà soát khoảng cách cơ sở dữ liệu theo mọi đặc tả đã phê duyệt.
- [x] Quyết định `Librarymanagement.sql` là baseline Giai đoạn 1 hay cần sửa.
- [x] Ghi lại thay đổi lược đồ bắt buộc qua bản rà soát khoảng cách cơ sở dữ liệu Tuần 4 và ADR này.
- [x] Xác nhận các bảng token/phiên/kiểm toán cho FE02 và FE11 trước khi triển khai xác thực.
- [ ] Nhóm rà soát script SQL đã sửa trước khi merge.
## Đối soát siêu dữ liệu đã triển khai 2026-07-22

Một số cơ sở dữ liệu ở môi trường staging trước mốc cơ sở có `Authors`, `Publishers` và `Categories` nhưng thiếu các cột chuẩn `Status` và `CreatedAt`. Tầng truy cập dữ liệu thư viện dành cho Quản trị viên đã phụ thuộc vào các trường đó để liệt kê/xuất/vô hiệu hóa, vì vậy triển khai chỉ mã có thể sinh `INTERNAL_ERROR` ngay cả khi gói frontend là phiên bản hiện tại.

Script đối soát có giao dịch, có tính idempotent và có thể rà soát là `database/migrations/2026-07-22-library-metadata-compatibility.sql`. Script chỉ thêm cột còn thiếu với giá trị mặc định chuẩn, giữ nguyên các hàng hiện có và xác thực giá trị trạng thái được hỗ trợ. Gói triển khai chứa chính xác tệp này; khi khởi động, backend áp dụng script và xác minh các cột kết quả trước khi mở HTTP listener. Khi thất bại, ứng dụng sẽ không khả dụng thay vì phục vụ API siêu dữ liệu Quản trị viên bị lỗi.

Cùng đợt rà soát staging cho thấy các bảng `BorrowRequests` cũ có thể xuất hiện trước các dấu thời gian phê duyệt/từ chối chuẩn. `database/migrations/2026-07-22-borrow-request-workflow-columns.sql` thêm có tính idempotent các cột còn thiếu `ApprovedAt`, `RejectedAt`, `ProcessedAt` và `UpdatedAt` để các giao dịch phê duyệt/từ chối FE07 có thể chạy trên cơ sở dữ liệu đã nâng cấp.
