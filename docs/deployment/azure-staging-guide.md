# Hướng dẫn triển khai môi trường tiền sản xuất Azure

## Mục đích

Hướng dẫn này triển khai release candidate Tuần 13 lên môi trường staging dùng Azure for Students
bằng các tài nguyên frontend, backend và cơ sở dữ liệu riêng biệt. Đây là triển khai staging, không
phải triển khai production.

Người vận hành phải dừng lại trước khi tạo hoặc thay đổi kích thước bất kỳ tài nguyên nào không được
bao gồm rõ ràng trong hạn mức miễn phí hoặc tín dụng Azure for Students đã được phê duyệt.

## Rào chắn chi phí

- Sử dụng Azure Static Web Apps miễn phí.
- Tạo gói App Service với F1 Free. Không thử lại với B1 hoặc SKU trả phí khác mà không rõ ràng
  phê duyệt của đội.
- Chỉ tạo Azure SQL sau khi trang định giá cổng thông tin hiển thị cơ sở dữ liệu đã chọn nằm trong một cơ sở dữ liệu miễn phí
  hạn mức hoặc tín dụng Azure for Students.
- Xem lại Quản lý chi phí Azure sau khi cung cấp và xem lại sau lần triển khai đầu tiên.
- Xóa nhóm tài nguyên khi môi trường tiền sản xuất không còn cần thiết nữa; xóa nhóm tài nguyên sẽ xóa
  tất cả các tài nguyên trong hướng dẫn này.

## Tên tài nguyên và khu vực

| Tài nguyên | Tên | Region/SKU |
| --- | --- | --- |
| Nhóm tài nguyên | `rg-library-staging` | Đông Nam Á |
| Gói App Service | `plan-library-staging` | Tây Malaysia, Linux, F1 miễn phí |
| Ứng dụng web máy chủ | `app-library-api-staging-nhat714` | Tây Malaysia, Node.js 22 LTS |
| Ứng dụng web tĩnh | `swa-library-staging-nhat714` | Đông Á, Miễn phí |
| Máy chủ logic SQL | `sql-library-staging-ea-nhat714` | Đông Á |
| Cơ sở dữ liệu SQL | `LibraryManagementStaging` | Cấu hình free/student-credit đã được cổng thông tin xác nhận |
| Quản trị viên SQL | `libraryadmin` | Mật khẩu do nhà điều hành nhập riêng |

Tên tài nguyên Azure như ứng dụng web và máy chủ SQL là duy nhất trên toàn cầu. Nếu Azure báo cáo
rằng một trong các tên không có sẵn, hãy dừng và ghi lại hậu tố thay thế trước khi thay đổi giá trị
quy trình làm việc hoặc tài liệu.

## Cài đặt và đăng nhập vào Azure CLI

Azure CLI không có mặt trong quá trình kiểm tra thiết kế Tuần 13. Cài đặt và xác thực từ thiết bị
đầu cuối PowerShell tương tác:

```powershell
winget install --exact --id Microsoft.AzureCLI
az login --use-device-code
az account list --output table
az account show --output table
```

Xác nhận subscription đã chọn là `Azure for Students`. Nếu subscription khác được
chọn, hãy sử dụng:

```powershell
az account set --subscription 'Azure for Students'
az account show --output table
```

Không tiếp tục cho đến khi đăng ký chính xác được kích hoạt.

## Tạo nhóm tài nguyên và App Service F1

```powershell
az group create --name rg-library-staging --location southeastasia

az appservice plan create `
  --name plan-library-staging `
  --resource-group rg-library-staging `
  --location malaysiawest `
  --is-linux `
  --sku F1

az webapp create `
  --name app-library-api-staging-nhat714 `
  --resource-group rg-library-staging `
  --plan plan-library-staging `
  --runtime "NODE:22-lts"

az webapp config set `
  --name app-library-api-staging-nhat714 `
  --resource-group rg-library-staging `
  --startup-file "npm start"
```

Xác minh kế hoạch trước khi tiếp tục:

```powershell
az appservice plan show `
  --name plan-library-staging `
  --resource-group rg-library-staging `
  --query '{name:name,sku:sku.name,tier:sku.tier,kind:kind}' `
  --output table
```

SKU dự kiến: `F1`. Dừng thay vì tự động thay đổi kích thước.

## Tạo Azure Static Web Apps miễn phí

Trong Cổng thông tin Azure:

1. Tạo ứng dụng web tĩnh `swa-library-staging-nhat714` trong `rg-library-staging`.
2. Chọn gói miễn phí và Đông Á.
3. Chọn `Other` làm nguồn triển khai để quy trình làm việc của kho lưu trữ kiểm soát việc triển khai.
4. Ghi lại `https://*.azurestaticapps.net` URL được tạo.
5. Sao chép mã thông báo triển khai trực tiếp vào bí mật Môi trường GitHub `staging` có tên
   `AZURE_STATIC_WEB_APPS_API_TOKEN`.

Không lưu trữ mã thông báo triển khai trong tệp cục bộ, hồ sơ lớp bao, tài liệu, ảnh chụp màn hình
hoặc trò chuyện.

## Tạo Azure SQL Tín dụng nội bộ sinh viên

Sử dụng Cổng thông tin Azure để người vận hành có thể xem lại chi phí được hiển thị trước khi tạo:

1. Tạo máy chủ SQL `sql-library-staging-ea-nhat714` tại `rg-library-staging`, Đông Á. miễn phí
   limit API đã từ chối Malaysia West trong quá trình cung cấp mặc dù cổng thông tin đã hiển thị ưu đãi.
2. Đặt tên người dùng quản trị viên SQL thành `libraryadmin` và tạo mật khẩu chỉ dành cho môi trường tiền sản xuất mới.
3. Tạo cơ sở dữ liệu `LibraryManagementStaging`.
4. Trên trang compute/storage, chọn trợ cấp miễn phí khi Azure cung cấp. Nếu không hãy xác nhận
   chi phí ước tính được bao gồm trong tín dụng Azure for Students còn lại.
5. Dừng lại nếu ước tính không rõ ràng hoặc vượt quá mức tín dụng được phê duyệt.
6. Chỉ ghi lại quyết định SKU và free/credit đã chọn trong bằng chứng triển khai, không bao giờ ghi lại mật khẩu.

## Định cấu hình tường lửa Azure SQL

Nhận các địa chỉ gửi đi máy chủ:

```powershell
az webapp show `
  --name app-library-api-staging-nhat714 `
  --resource-group rg-library-staging `
  --query outboundIpAddresses `
  --output tsv
```

Trong mạng Azure SQL:

- thêm quy tắc cho các địa chỉ gửi đi App Service;
- chỉ thêm IP hiện tại của nhà điều hành khi khởi tạo hoặc xem lại cơ sở dữ liệu;
- loại bỏ quy tắc toán tử tạm thời khi không còn cần thiết nữa;
- không để lại quy tắc `0.0.0.0` đến `255.255.255.255` hoặc phạm vi toàn Internet khác.

## Chuẩn bị và thực thi lược đồ tương thích Azure

Tạo tập lệnh triển khai bắt nguồn từ lược đồ chuẩn:

```powershell
npm.cmd run schema:azure:prepare
```

Tệp được tạo là `tmp/azure/LibraryManagementStaging.sql`. Nó bị Git bỏ qua và loại bỏ các lô `CREATE
DATABASE` và `USE` cục bộ trong khi vẫn giữ lại các bảng ứng dụng và các ràng buộc.

Trước khi thực hiện:

1. Xem lại SQL đã tạo.
2. Trước khi chạm vào giai đoạn, hãy thực hiện mỗi lần di chuyển ứng viên hai lần trên một tên cụ thể,
cơ sở dữ liệu SQL Server cục bộ dùng một lần, giữ lại kết quả dưới dạng bằng chứng bình thường và
xóa cơ sở dữ liệu đó.
3. Nếu cần có quyền truy cập của nhà điều hành, hãy thêm một quy tắc tường lửa tạm thời chính xác cho quyền truy cập hiện tại của nhà điều hành
   IP. Đừng mở rộng phạm vi.
4. Xác nhận cơ sở dữ liệu được kết nối là `LibraryManagementStaging`.
5. Thực thi thông qua Trình soạn thảo truy vấn Azure, SSMS hoặc `sqlcmd`: sử dụng lược đồ được tạo một lần cho một khoảng trống
cơ sở dữ liệu hoặc thực hiện các quá trình di chuyển do nhà điều hành sở hữu sau đây một lần và theo
thứ tự cho cơ sở dữ liệu đã được điều chỉnh trước hiện có:

Quản lý Sách sẽ trả về phản hồi `INTERNAL_ERROR`/`Không thể xử lý yêu cầu` an toàn khi cột
`Books.RowVersion` hoặc siêu dữ liệu `Status` không có. Yêu cầu gửi FE10 không thể chuyển sang trạng
thái `PROCESSING` lâu bền cho đến khi hạn chế trạng thái thông báo được nâng cấp. Hầu hết các quá
trình di chuyển SQL vẫn do nhà điều hành áp dụng. Một ngoại lệ được ghi lại là
`2026-07-22-library-metadata-compatibility.sql`: gói máy chủ mang tập lệnh bình thường, đã được xem
xét này và áp dụng nó trước khi mở trình nghe HTTP để các bảng tác giả, nhà xuất bản và danh mục kế
thừa không thể khiến trang Thư viện quản trị viên đã triển khai bị hỏng.

```text
database/migrations/2026-07-19-fe04-membership-concurrency.sql
database/migrations/2026-07-19-fe05-book-rowversion.sql
database/migrations/2026-07-19-fe06-bookcopy-rowversion.sql
database/migrations/2026-07-19-fe10-otp-templates.sql
database/migrations/2026-07-19-fe11-finalization.sql
database/migrations/2026-07-22-borrow-request-workflow-columns.sql
database/migrations/2026-07-23-fe10-processing-status.sql
database/migrations/2026-07-27-fe10-personal-inbox-read-state.sql
database/migrations/2026-07-29-fe10-borrowing-result-templates.sql
```

Không chạy `2026-07-22-library-metadata-compatibility.sql` theo cách thủ công. Cổng khởi động máy
chủ sở hữu một gói di chuyển được đóng gói đó và áp dụng nó trước khi trình nghe HTTP mở ra.

6. Xác minh các cột mục tiêu, số lượng bảng và đối chiếu:

```sql
SELECT
  DB_NAME() AS DatabaseName,
  (SELECT COUNT(*) FROM sys.tables) AS TableCount,
  COL_LENGTH(N'dbo.Books', N'RowVersion') AS BooksRowVersionBytes,
  COL_LENGTH(N'dbo.BookCopies', N'Version') AS BookCopiesVersionBytes,
  COL_LENGTH(N'dbo.Users', N'DeactivatedAt') AS UsersDeactivatedAtBytes,
  CASE WHEN EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.Notifications')
      AND name = N'CK_Notifications_Status'
      AND definition LIKE N'%PROCESSING%'
  ) THEN 1 ELSE 0 END AS NotificationProcessingAllowed;
```

Expected database: `LibraryManagementStaging`, table count `21`; độ dài mỗi cột đối chiếu được
liệt kê `8`; `NotificationProcessingAllowed` phải là `1`. CI không được tự động thực thi lược đồ
này.

7. Xóa quy tắc tường lửa tạm thời chính xác của nhà điều hành ngay sau khi di chuyển được xem xét và
   kiểm tra chỉ đọc. Không được sử dụng giai đoạn để chứng minh tính không có khả năng di chuyển.

Nếu quá trình triển khai không thể bắt đầu hoặc báo cáo `API lược đồ readiness kiểm tra không đạt với HTTP
503`, đừng xóa hoặc bỏ qua bước kiểm tra mức độ sẵn sàng. Kiểm tra nhật ký khởi động App Service để
tìm thông báo `Backend startup failed` an toàn. Xác nhận rằng cơ sở dữ liệu chính của ứng dụng được
định cấu hình có thể thay đổi `Authors`, `Publishers` và `Categories`; cổng khởi động chỉ được thêm
các cột `Status`/`CreatedAt` bị thiếu thông qua quá trình di chuyển được xem xét đóng gói. Không để
lộ Azure SQL cho dải IP của GitHub-hosted runner hoặc mở rộng phạm vi tường lửa.

Sau khi khởi động thành công, xác minh `GET /health/ready` trả HTTP `200` với
`checks.catalogMetadata = "ok"`. Một successful `main` CI run tự động khởi chạy workflow staging cho
đúng commit; `workflow_dispatch` vẫn cho phép người vận hành chạy lại. Cả hai đường dẫn đều fail-closed
theo exact migration file hash được lưu trong GitHub Environment `staging`. Workflow không kết nối
hoặc thực thi SQL; schema reconciliation chạy bằng application identity của backend trước khi mở
listener. Gói triển khai chứa migration tương thích metadata catalog, migration tương thích loại token
`CHANGE_PASSWORD_OTP`, script template kết quả mượn FE10 và Unicode repair đã review. Các script FE10
vẫn do người vận hành sở hữu, chỉ được đóng gói làm bằng chứng phát hành và không chạy khi startup.

### FE10 Cổng di chuyển

Cả ba migration FE10 đều do người vận hành sở hữu và phải hoàn tất trước khi triển khai ứng dụng:
`database/migrations/2026-07-27-fe10-personal-inbox-read-state.sql`,
`database/migrations/2026-07-29-fe10-borrowing-result-templates.sql`, sau đó là
`database/migrations/2026-08-03-fe10-unicode-repair.sql`. Apply each migration twice bằng
`sqlcmd -b -f 65001`. Lần chạy thứ hai kiểm tra idempotence; migration inbox không được backfill
notification tạo sau lần chạy đầu. Unicode repair cũng phải đạt binary exact-value assertions.

1. Giải quyết IP công cộng hiện tại của nhà điều hành mà không cần thông tin đăng nhập.
2. Thêm một temporary firewall rule của Azure SQL có giá trị bắt đầu và kết thúc là IP chính xác.
3. Đặt máy chủ đích, cơ sở dữ liệu và danh tính nhà điều hành được phê duyệt trong trình bao tương tác. Giữ
   mật khẩu trong môi trường quy trình an toàn hoặc lời nhắc tương tác; không bao giờ lưu nó vào kho lưu trữ.
4. Chạy quá trình di chuyển hai lần, dừng ở lỗi SQL đầu tiên:

```powershell
$fe10InboxMigration = Resolve-Path 'database/migrations/2026-07-27-fe10-personal-inbox-read-state.sql'
$fe10ResultTemplatesMigration = Resolve-Path 'database/migrations/2026-07-29-fe10-borrowing-result-templates.sql'
$fe10UnicodeRepairMigration = Resolve-Path 'database/migrations/2026-08-03-fe10-unicode-repair.sql'

foreach ($fe10Migration in @(
  $fe10InboxMigration,
  $fe10ResultTemplatesMigration,
  $fe10UnicodeRepairMigration
)) {
  sqlcmd -S $env:FE10_SQL_SERVER -d $env:FE10_SQL_DATABASE -b -f 65001 `
    -U $env:FE10_SQL_USER -P $env:FE10_SQL_PASSWORD -i $fe10Migration
  if ($LASTEXITCODE -ne 0) { throw "Migration failed: $fe10Migration" }

  sqlcmd -S $env:FE10_SQL_SERVER -d $env:FE10_SQL_DATABASE -b -f 65001 `
    -U $env:FE10_SQL_USER -P $env:FE10_SQL_PASSWORD -i $fe10Migration
  if ($LASTEXITCODE -ne 0) { throw "Idempotence check failed: $fe10Migration" }
}
```

5. Chỉ truy vấn aggregate postconditions: một cột `ReadAt` nullable; một
   `IX_Notifications_User_ReadAt_CreatedAt` index; eligible historical rows backfilled to
   `CreatedAt`; sensitive, userless, and post-first-run rows still unread; and unchanged row count,
   delivery status, attempt count, and idempotency-key count. Confirm exactly one active template
   for each of `BORROW_REQUEST_APPROVED`, `BORROW_REQUEST_REJECTED`, `BORROW_RENEWED`, and
   `BORROW_RETURNED`. The following exact-value query must return zero rows:

```sql
WITH Expected (TemplateCode, Subject, Body) AS (
    SELECT N'BORROW_REQUEST_APPROVED', N'Yêu cầu mượn đã được duyệt',
           N'Yêu cầu mượn #{{requestId}} đã được duyệt. Hạn trả: {{dueDate}}.'
    UNION ALL
    SELECT N'BORROW_REQUEST_REJECTED', N'Yêu cầu mượn đã bị từ chối',
           N'Yêu cầu mượn #{{requestId}} đã bị từ chối.'
    UNION ALL
    SELECT N'BORROW_RENEWED', N'Khoản mượn đã được gia hạn',
           N'Khoản mượn #{{borrowDetailId}} đã được gia hạn đến {{dueDate}}.'
    UNION ALL
    SELECT N'BORROW_RETURNED', N'Đã ghi nhận trả sách',
           N'Khoản mượn #{{borrowDetailId}} đã được ghi nhận trả với trạng thái {{returnStatus}}.'
)
SELECT expected.TemplateCode
FROM Expected AS expected
LEFT JOIN dbo.NotificationTemplates AS actual
    ON actual.TemplateCode = expected.TemplateCode
WHERE actual.TemplateId IS NULL
   OR actual.Subject COLLATE Latin1_General_100_BIN2
        <> expected.Subject COLLATE Latin1_General_100_BIN2
   OR actual.Body COLLATE Latin1_General_100_BIN2
        <> expected.Body COLLATE Latin1_General_100_BIN2
   OR actual.Status <> N'ACTIVE';
```

6. Xóa temporary firewall rule chính xác ngay lập tức, kể cả khi lệnh thất bại.
7. Tính SHA-256 cho mỗi migration đã review và lưu dưới dạng các biến không bí mật của GitHub
   Environment `staging`: `FE10_INBOX_MIGRATION_SHA256`,
   `FE10_BORROWING_RESULT_TEMPLATES_SHA256` và `FE10_UNICODE_REPAIR_SHA256`. Các giá trị này chứng
   minh exact migration file hash đã áp dụng; không đặt hoặc cập nhật trước khi bước 1-6 đạt.

Ghi lại hash of the bytes actually applied. Git có thể hiển thị cùng một văn bản UTF-8 với LF trên
runner Linux và CRLF trên Windows. Bước preflight tạo LF and CRLF byte renderings chính xác của văn
bản đã checkout và chỉ chấp nhận hàm băm được lưu trữ khi nó khớp với
một trong hai kết xuất đó. Nó không chấp nhận bất kỳ thay đổi nội dung di chuyển nào.

```powershell
$fe10InboxMigrationHash = (Get-FileHash -Algorithm SHA256 $fe10InboxMigration).Hash.ToLowerInvariant()
$fe10ResultTemplatesMigrationHash = (Get-FileHash -Algorithm SHA256 $fe10ResultTemplatesMigration).Hash.ToLowerInvariant()
$fe10UnicodeRepairMigrationHash = (Get-FileHash -Algorithm SHA256 $fe10UnicodeRepairMigration).Hash.ToLowerInvariant()
gh variable set FE10_INBOX_MIGRATION_SHA256 `
  --env staging `
  --repo SWP391-LibraryManagement/LibraryManagement `
  --body $fe10InboxMigrationHash
gh variable set FE10_BORROWING_RESULT_TEMPLATES_SHA256 `
  --env staging `
  --repo SWP391-LibraryManagement/LibraryManagement `
  --body $fe10ResultTemplatesMigrationHash
gh variable set FE10_UNICODE_REPAIR_SHA256 `
  --env staging `
  --repo SWP391-LibraryManagement/LibraryManagement `
  --body $fe10UnicodeRepairMigrationHash
```

8. Trước H3, chạy thủ công `Deploy staging` cho đúng nhánh PR với
   `fe10_inbox_migration_confirmed=true` and
   `fe10_borrowing_result_templates_confirmed=true` and
   `fe10_unicode_repair_confirmed=true`. Các boolean là xác nhận bổ sung của người vận hành; preflight
   vẫn so sánh mọi migration file đã checkout với biến staging Environment tương ứng.

Triển khai theo thứ tự cố định: preflight, backend, frontend, fail-closed smoke và browser
verification. Gói backend chạy `npm ci --omit=dev` trong `deploy/backend` trước OneDeploy để artifact
chứa production dependencies; `SCM_DO_BUILD_DURING_DEPLOYMENT=false` ngăn OneDeploy gọi thêm một Oryx
build và không thay thế dependency-install gate. Xác minh backend `/health`, `/health/ready` và inbox
ẩn danh `401` trước khi kiểm tra bell/page frontend hoặc hành vi trình duyệt trên custom domain.

## Định cấu hình cài đặt thời gian chạy App Service

Đặt các giá trị không bí mật với Azure CLI:

```powershell
az webapp config appsettings set `
  --name app-library-api-staging-nhat714 `
  --resource-group rg-library-staging `
  --settings `
    NODE_ENV=production `
    TRUST_PROXY=true `
    PORT=8080 `
    DB_SERVER=sql-library-staging-ea-nhat714.database.windows.net `
    DB_NAME=LibraryManagementStaging `
    DB_PORT=1433 `
    DB_ENCRYPT=true `
    DB_TRUST_SERVER_CERTIFICATE=false `
    SCM_DO_BUILD_DURING_DEPLOYMENT=false
```

`TRUST_PROXY=true` được yêu cầu trên Azure App Service vì TLS kết thúc tại proxy Azure. Phần máy chủ
sử dụng giao thức được chuyển tiếp khi thực thi HTTPS cho `/api/auth/*`; không có cài đặt này, yêu
cầu HTTPS thực có thể được hiểu là bước nhảy HTTP nội bộ và trả về `400 HTTPS_REQUIRED` thay vì đạt
được xác thực và trả về `401` dự kiến ​​cho một yêu cầu ẩn danh.

Sử dụng App Service -> Cấu hình để nhập các giá trị bí mật:

- `JWT_SECRET`
- `DB_USER=libraryadmin`
- `DB_PASSWORD`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `MAIL_FROM`

Cần có SMTP để đăng ký theo giai đoạn, xác minh/đặt lại OTP và phân phối thiết lập tài khoản. Việc
triển khai mã thành công không tạo hoặc thay thế các cài đặt App Service này. Đối với Gmail SMTP,
hãy sử dụng tài khoản có xác minh hai bước và Mật khẩu ứng dụng chuyên dụng; không bao giờ sử dụng
hoặc commit mật khẩu hộp thư thông thường. `MAIL_FROM` phải là địa chỉ mà tài khoản SMTP đã định
cấu hình được phép gửi dưới dạng.

Tạo `JWT_SECRET` cục bộ:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Dán trực tiếp vào cấu hình Azure. Đừng lưu hoặc in lại.

Sau khi Static Web Apps tồn tại, hãy định cấu hình URL chính xác của nó:

```powershell
$staticUrl = Read-Host 'Paste the exact Azure Static Web Apps URL'

az webapp config appsettings set `
  --name app-library-api-staging-nhat714 `
  --resource-group rg-library-staging `
  --settings `
    "CORS_ORIGINS=$staticUrl" `
    "FRONTEND_BASE_URL=$staticUrl"
```

Khởi động lại ứng dụng web sau khi thay đổi cài đặt thời gian chạy:

```powershell
az webapp restart `
  --name app-library-api-staging-nhat714 `
  --resource-group rg-library-staging
```

## Định cấu hình các biến và bí mật môi trường GitHub

Trong Cài đặt kho lưu trữ GitHub -> Môi trường, tạo `staging`.

Biến:

```text
AZURE_WEBAPP_NAME=app-library-api-staging-nhat714
STAGING_API_URL=https://app-library-api-staging-nhat714.azurewebsites.net
FE10_INBOX_MIGRATION_SHA256=<lowercase SHA-256 set only after the verified migration>
FE10_BORROWING_RESULT_TEMPLATES_SHA256=<lowercase SHA-256 set only after the verified migration>
FE10_UNICODE_REPAIR_SHA256=<lowercase SHA-256 set only after the verified migration>
```

Tạo `STAGING_FRONTEND_URL` bằng cách sử dụng Azure chính xác do Static Web Apps URL tạo ra.

Bí mật:

```text
AZURE_WEBAPP_PUBLISH_PROFILE
AZURE_STATIC_WEB_APPS_API_TOKEN
```

Tải xuống hồ sơ xuất bản máy chủ từ App Service và dán trực tiếp vào bí mật đầu tiên. Dán mã thông
báo triển khai Static Web Apps trực tiếp vào mã thứ hai. Cho phép phê duyệt cần thiết của người đánh
giá đối với môi trường khi gói kho lưu trữ hỗ trợ nó.

## CI-Gated Continuous Deployment (Triển khai liên tục qua cổng CI)

Quy trình staging chỉ triển khai sau một successful `main` CI run và bước kiểm tra sẵn sàng cho
migration dữ liệu thành công. Bằng chứng migration phải khớp exact migration file hash. Đối với FE10,
migration do người vận hành sở hữu phải được chứng minh trước khi hợp nhất vì CI thành công trên
`main` có thể triển khai tự động:

1. Đợi exact-head PR CI đạt.
2. Apply all FE10 migrations twice, xác minh aggregate và exact Unicode postconditions, rồi xóa
   temporary firewall rule chính xác.
3. Đặt `FE10_INBOX_MIGRATION_SHA256`, `FE10_BORROWING_RESULT_TEMPLATES_SHA256` và
   `FE10_UNICODE_REPAIR_SHA256` theo exact migration file hash tương ứng.
4. Chạy thủ công `Deploy staging` cho đúng nhánh PR với
   `fe10_inbox_migration_confirmed=true` and
   `fe10_borrowing_result_templates_confirmed=true` and
   `fe10_unicode_repair_confirmed=true`.
5. Xác nhận preflight; backend startup đối soát catalog và auth-token migration đã đóng gói;
   `/health/ready` trả `200`; frontend, smoke và kiểm tra browser MEMBER/LIBRARIAN/ADMIN đạt trước H3.
6. Sau H3, merge head đã phê duyệt vào `main`.
7. GitHub Actions hoàn tất `CI` cho commit kết quả trên `main`; `Deploy staging` tự động checkout đúng
   commit đó.
8. Xác nhận preflight tự động khớp migration hash đã lưu, backend hoàn tất trước, frontend chỉ bắt đầu
   sau khi backend thành công và fail-closed smoke đạt.

CI thất bại không triển khai. `workflow_dispatch` vẫn cho phép người vận hành chạy lại sau khi áp dụng
migration bắt buộc. Migration hash thiếu hoặc không khớp chặn cả triển khai tự động và thủ công mà
không thay đổi Azure SQL. Nếu Azure SQL đang pause hoặc bị chặn quota, không đặt hash hay kích hoạt
deployment; chỉ tiếp tục khi truy cập được database và mọi kiểm tra idempotence đã hoàn tất.

Sau khi thay đổi cài đặt App Service, hãy để phiên bản F1 khởi động trước khi đánh giá kết quả kiểm thử nhanh.
Yêu cầu đầu tiên có thể trả về `503` trong khi ứng dụng khởi động lại. Chạy lại kiểm thử nhanh chỉ
đọc sau khi `/health` trả về `200`; đừng che giấu `503` liên tục khi khởi động.

## Free-Tier Staging Keepalive (Keepalive cho staging free-tier)

Workflow GitHub Actions `Staging keepalive` gửi yêu cầu chỉ đọc đến endpoint `/health` của backend
chủ công khai cứ sau 10 phút. Nó cũng hỗ trợ `workflow_dispatch` để kiểm tra người vận hành. Quy
trình công việc không cần bí mật kho lưu trữ và không được gọi xác thực, xử lý thông báo hoặc điểm
cuối thao tác ghi khác.

Đây là cơ chế best-effort cho môi trường staging/demo. GitHub có thể trì hoãn việc chạy quy
trình làm việc theo
lịch trình và Azure App Service F1 có thể dỡ bỏ một ứng dụng không hoạt động. Không mô tả cấu hình
này là thời gian hoạt động được đảm bảo hoặc thời gian thông báo được đảm bảo. GitHub cũng vô hiệu
hóa các quy trình công việc đã lên lịch trong kho lưu trữ công cộng sau 60 days (60 ngày) không có hoạt động
trong kho lưu trữ. Kiểm tra và kích hoạt lại quy trình làm việc này khi khôi phục môi trường chạy
thử không hoạt động:

```powershell
gh workflow view staging-keepalive.yml
gh workflow enable staging-keepalive.yml
```

Giữ phần máy chủ trên B1 với chức năng Luôn bật cho đến khi quy trình làm việc được hợp nhất vào
nhánh mặc định. Quy trình làm việc theo lịch trình không bảo vệ việc môi trường tiền sản xuất trong
khi chúng chỉ tồn tại trên một nhánh chức năng. Sử dụng thứ tự chuyển tiếp này:

1. Hợp nhất quy trình công việc đã xem xét vào `main` và yêu cầu chạy CI `main` chính xác
   để vượt qua.
2. Bắt đầu quy trình làm việc theo cách thủ công:

   ```powershell
   gh workflow run staging-keepalive.yml --ref main
   gh run list --workflow staging-keepalive.yml --limit 1
   ```

3. Chỉ tiếp tục khi manual `Staging keepalive` run succeeds.
4. Vô hiệu hóa Luôn bật:

   ```powershell
   az webapp config set `
     --name app-library-api-staging-nhat714 `
     --resource-group rg-library-staging `
     --always-on false
   ```

5. Xác nhận `alwaysOn=false`, sau đó chia tỷ lệ `plan-library-staging` thành F1:

   ```powershell
   az appservice plan update `
     --name plan-library-staging `
     --resource-group rg-library-staging `
     --sku F1
   ```

6. Xác minh trạng thái trực tiếp mà không in cài đặt bí mật:

   ```powershell
   az appservice plan show `
     --name plan-library-staging `
     --resource-group rg-library-staging `
     --query '{sku:sku.name,tier:sku.tier}' `
     --output table

   az webapp config show `
     --name app-library-api-staging-nhat714 `
     --resource-group rg-library-staging `
     --query '{alwaysOn:alwaysOn}' `
     --output table

   az webapp config appsettings list `
     --name app-library-api-staging-nhat714 `
     --resource-group rg-library-staging `
     --query "[?starts_with(name, 'NOTIFICATION_WORKER_')].[name,value]" `
     --output table

   Invoke-WebRequest `
     -Uri 'https://app-library-api-staging-nhat714.azurewebsites.net/health' `
     -UseBasicParsing

   Invoke-WebRequest `
     -Uri 'https://app-library-api-staging-nhat714.azurewebsites.net/api/books' `
     -UseBasicParsing
   ```

Cài đặt dự kiến là `NOTIFICATION_WORKER_ENABLED=true`, `NOTIFICATION_WORKER_INTERVAL_MS=60000` và
`NOTIFICATION_WORKER_BATCH_SIZE=20`. Chỉ ghi lại số lượng hàng đợi thông báo tổng hợp; không bao gồm
người nhận, nội dung được hiển thị, mã thông báo, thông tin xác thực hoặc chuỗi kết nối trong bằng
chứng triển khai.

Nếu keepalive liên tục thất bại hoặc staging trở nên không đáng tin cậy, scale the plan back to B1
rồi set `alwaysOn=true`, sau đó lặp lại kiểm tra tình trạng, danh mục công khai, cài
đặt của nhân viên và hàng đợi tổng hợp. Chỉ vô hiệu hóa quy trình làm việc sẽ không khôi phục tính
khả dụng trên F1.

## Chạy kiểm thử nhanh

Chạy kiểm tra cục bộ độc lập sau khi GitHub Actions thành công:

```powershell
$env:STAGING_FRONTEND_URL = Read-Host 'Paste the exact Azure Static Web Apps URL'
$env:STAGING_API_URL='https://app-library-api-staging-nhat714.azurewebsites.net'
npm.cmd run smoke:staging
```

Tập lệnh kiểm thử nhanh ở chế độ chỉ đọc và kiểm tra giao diện người dùng HTML, tình trạng API,
allowed/blocked CORS và từ chối ẩn danh từ `/api/auth/me`.

## Fixture demo ứng viên mượn có bảo vệ

The backend staging artifact packages `scripts/stagingBorrowCandidates.js` for
manual operator use. Deployment and application startup never invoke it.

Fixture ownership is limited to:

- ISBNs `STAGING-BORROW-DEMO1` and `STAGING-BORROW-DEMO2` (ownership prefix
  `STAGING-BORROW-DEMO`, respecting the 20-character ISBN column);
- barcode prefix `STG-BORROW-DEMO-`; and
- location `STAGING-DEMO`.

From the deployed backend root, inspect read-only state first:

```bash
npm run staging:borrow-candidates -- status
```

`status` requires `DB_NAME=LibraryManagementStaging` but no mutation flag. It
prints synthetic identifiers, counts and statuses only.

Reset requires a configured synthetic Member email plus an explicit flag in the
current operator session:

```bash
test -n "$STAGING_DEMO_MEMBER_EMAIL" || { echo 'STAGING_DEMO_MEMBER_EMAIL is required.' >&2; exit 1; }
export STAGING_DEMO_ALLOW_MUTATION=true
npm run staging:borrow-candidates -- reset
unset STAGING_DEMO_ALLOW_MUTATION
unset STAGING_DEMO_MEMBER_EMAIL
```

Never persist `STAGING_DEMO_ALLOW_MUTATION=true` in App Service settings. Reset
must stop without mutation for the wrong database, missing flag, missing active
Admin, ineligible Member, mixed tagged/untagged request, damaged/lost fixture or
any unexpected state. It uses parameterized SQL and one transaction, preserves
unrelated rows, leaves audit markers and restores exactly two distinct available
fixture titles. A non-zero exit requires manual review; do not bypass the guard
with ad hoc bulk SQL.

## Khôi phục

- Backend: triển khai lại commit ổn định gần nhất hoặc sử dụng lịch sử triển khai App Service.
- Frontend: chạy lại workflow từ commit ổn định gần nhất.
- Cơ sở dữ liệu: CI không thực hiện thao tác ghi lược đồ. Ngoại lệ khởi động máy chủ chỉ thêm chuẩn
các cột tương thích siêu dữ liệu thông qua tập lệnh bình thường được xem xét; bất kỳ việc khôi phục
cơ sở dữ liệu nào vẫn là một hành động rõ ràng của người vận hành.
- FE10 khôi phục hộp thư đến không phá hủy: giữ `Notifications.ReadAt` và chỉ mục của nó, sau đó tắt hoặc
  triển khai lại chỉ sử dụng hộp thư đến API/giao diện. Không xóa lịch sử đọc hoặc khôi phục các hàng
  gửi email.
- Lỗi kiểm thử nhanh: không đánh dấu giai đoạn được chấp nhận; kiểm tra nhật ký App Service và đầu ra công việc GitHub mà không cần
  in cài đặt bí mật.

## Tài nguyên Stop/Delete

Dừng phần máy chủ tạm thời:

```powershell
az webapp stop `
  --name app-library-api-staging-nhat714 `
  --resource-group rg-library-staging
```

Chỉ xóa toàn bộ môi trường môi trường tiền sản xuất sau khi xác nhận không còn bằng chứng hoặc dữ
liệu cần thiết nào:

```powershell
az group delete --name rg-library-staging
```

Azure yêu cầu xác nhận. Việc xóa nhóm tài nguyên là không thể đảo ngược và sẽ xóa ứng dụng web, Ứng
dụng web tĩnh, máy chủ SQL và cơ sở dữ liệu.
