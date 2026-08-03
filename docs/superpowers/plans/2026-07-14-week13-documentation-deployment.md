# Tài liệu Tuần 13 và Kế hoạch triển khai theo giai đoạn Azure

> **Đối với nhân viên đại lý:** BẮT BUỘC SUB-SKILL: Sử dụng siêu năng lực:thực thi các kế hoạch để thực hiện kế hoạch này theo từng nhiệm vụ. Không tạo đại lý phụ hoặc người đánh giá cho kế hoạch này.

**Mục tiêu:** Đóng gói chấp nhận sáu chức năng, hoàn thành tài liệu Tuần 13 và triển khai môi trường
một đợt chạy thử Azure đã được kiểm thử nhanh bằng Azure Static Web Apps, App Service và
Azure SQL.

**Kiến trúc:** Giữ giao diện người dùng React và máy chủ Express dưới dạng có thể triển khai riêng
biệt. Azure Static Web Apps phục vụ bản dựng Vite, Azure App Service chạy phần máy chủ và Azure SQL
lưu trữ dữ liệu môi trường tiền sản xuất. GitHub hành động thực hiện các cổng chất lượng và triển khai
môi trường tiền sản xuất thủ công; việc thực thi lược đồ cơ sở dữ liệu vẫn là một hành động rõ ràng
của người vận hành.

**bộ công nghệ công nghệ:** Node.js 22 trong CI, React/Vite, Express, SQL Server/Azure SQL,
Playwright, GitHub Hành động, Azure Cơ sở dữ liệu Static Web Apps, Azure App Service, Azure SQL.

## Ràng buộc toàn cầu

- Hoàn thành nhiệm vụ 1-7 trên `docs/week13-documentation-deployment`. Tạo
`docs/week13-staging-evidence` chỉ sau khi nhánh triển khai được hợp nhất. Không sử dụng `codex`
trong tên nhánh.
- Giữ nguyên những thay đổi không liên quan trong cây làm việc chính, đặc biệt là `docs/testing/system-integration-demo-runbook.md`, `.superpowers/` và `docs/briefing-thuyet-trinh-du-an-vi.docx`.
- Không thêm chức năng sản phẩm hoặc thay đổi các quy tắc nghiệp vụ đã được phê duyệt.
- Không căn chỉnh giao diện kế thừa FE09 trong kế hoạch này.
- Không bao giờ cam kết thông tin xác thực Azure, thông tin xác thực cơ sở dữ liệu, bí mật JWT, mã thông báo triển khai hoặc giá trị `.env`.
- Bắt đầu App Service trên F1 miễn phí. Dừng lại và yêu cầu phê duyệt trước khi chọn B1 hoặc bất kỳ gói trả phí nào.
- Chỉ tạo Azure SQL sau khi Azure Portal xác nhận cấu hình nằm trong hạn mức miễn phí hoặc tín dụng Azure for Students.
- Giữ Azure Static Web Apps ở gói miễn phí.
- Không tự động thực thi lược đồ SQL từ CI.
- Chỉ sử dụng các tài khoản và dữ liệu môi trường tiền sản xuất tổng hợp.
- Giữ hướng dẫn triển khai môi trường tiền sản xuất thông qua `workflow_dispatch` cho đến khi vượt qua lần triển khai đầu tiên và kiểm thử nhanh.
- Không yêu cầu phân phối SMTP khi SMTP không được định cấu hình.
- Sử dụng `apply_patch` để chỉnh sửa tệp thủ công và phát triển theo hướng kiểm thử cho các tập lệnh thực thi mới.

---

### Nhiệm vụ 1: Đóng gói chấp nhận sáu chức năng

**Tệp:**
- Tạo: `docs/release/week13-acceptance-record.md`
- Sửa đổi: `.sdd/test-plan.md`

**Giao diện:**
- Tiêu thụ: chức năng `SPEC.md`, `TASKS.md`, `TEST_PLAN.md`, bằng chứng Tuần 11/12, bản ghi kết thúc FE07/FE12 và bằng chứng tích hợp hệ thống.
- Tạo ra: một ma trận chấp nhận cấp độ phát hành được README sử dụng, bằng chứng triển khai và đánh giá giai đoạn của con người.

- [ ] **Bước 1: Ghi lại trạng thái chức năng hiện tại mà không cần nâng cấp chúng**

Sử dụng các trạng thái được quan sát sau:

| chức năng | Trạng thái nhiệm vụ hiện tại | Trạng thái chấp nhận tuần 13 |
| --- | --- | --- |
| Xác thực FE02 | SẴN SÀNG RÀ SOÁT | SẴN SÀNG NGHIỆM THU CỦA CON NGƯỜI |
| Mượn sách FE07 | HOÀN THÀNH | ĐÃ GHI NHẬN RÀ SOÁT CỦA CON NGƯỜI; KIỂM TRA LẠI TRÊN MÔI TRƯỜNG TIỀN SẢN XUẤT |
| Đặt chỗ FE08 | SẴN SÀNG RÀ SOÁT | SẴN SÀNG NGHIỆM THU CỦA CON NGƯỜI |
| API máy chủ FE09 | SẴN SÀNG RÀ SOÁT | SẴN SÀNG NGHIỆM THU CỦA CON NGƯỜI; GIỚI HẠN GIAO DIỆN KẾ THỪA |
| Thông báo FE10 | HOÀN THÀNH | SẴN SÀNG NGHIỆM THU CỦA CON NGƯỜI; GIỚI HẠN GIAO DIỆN HỘP THƯ |
| Báo cáo FE12 | HOÀN THÀNH | ĐÃ GHI NHẬN RÀ SOÁT CỦA CON NGƯỜI; KIỂM TRA LẠI TRÊN MÔI TRƯỜNG TIỀN SẢN XUẤT |

- [ ] **Bước 2: Tạo hồ sơ nghiệm thu**

Tạo `docs/release/week13-acceptance-record.md` với các phần sau:

```markdown
# Bản ghi nghiệm thu chức năng cốt lõi Tuần 13

Ngày: 2026-07-14
Ứng viên phát hành: Môi trường tiền sản xuất Azure Tuần 13
Trạng thái tổng thể: SẴN SÀNG NGHIỆM THU CỦA CON NGƯỜI

## Quy tắc bằng chứng

- Bằng chứng tự động L1 không thay thế nghiệm thu L4 của con người.
- Chỉ kết quả đã quan sát mới được đánh dấu ĐẠT.
- Việc căn chỉnh trình duyệt FE09 và giao diện hộp thư FE10 vẫn là các giới hạn rõ ràng.

## Ma trận chức năng

| Chức năng | Đặc tả/Nhiệm vụ | Bằng chứng tự động | Bằng chứng của con người | Quyết định hiện tại |
| --- | --- | --- | --- | --- |
| FE02 | `.sdd/specs/feat-auth/` | `authRoutes`, `authUtils`, hồi quy bảo mật, cổng máy chủ đầy đủ | Cần rà soát đăng nhập/đăng xuất/đặt lại trên môi trường tiền sản xuất | SẴN SÀNG NGHIỆM THU CỦA CON NGƯỜI |
| FE07 | `.sdd/specs/feat-borrowing-management/` | Kiểm thử FE07, tích hợp hệ thống, luồng nghiệp vụ chuẩn của trình duyệt | Đã xác nhận rà soát B7 FE07; cần kiểm tra lại môi trường tiền sản xuất | SẴN SÀNG KIỂM TRA LẠI TIỀN SẢN XUẤT |
| FE08 | `.sdd/specs/feat-reservation-management/` | Kiểm thử tuyến/dịch vụ đặt chỗ và bằng chứng tích hợp hệ thống | Cần rà soát hàng đợi Thành viên/nhân viên trên môi trường tiền sản xuất | SẴN SÀNG NGHIỆM THU CỦA CON NGƯỜI |
| FE09 | `.sdd/specs/feat-fine-management/` | Kiểm thử quản lý khoản phạt và bàn giao API qua Playwright | Cần rà soát API phù hợp hợp đồng sản xuất; giao diện kế thừa không phải bằng chứng nghiệm thu | SẴN SÀNG VỚI GIỚI HẠN GIAO DIỆN |
| FE10 | `.sdd/specs/feat-notification-management/` | Kiểm thử an toàn thông báo và bằng chứng tích hợp hệ thống | Cần rà soát siêu dữ liệu/hành vi lỗi; giao diện hộp thư được hoãn | SẴN SÀNG VỚI GIỚI HẠN GIAO DIỆN |
| FE12 | `.sdd/specs/feat-reporting-statistics/` | Kiểm thử báo cáo và luồng nghiệp vụ chuẩn của trình duyệt | Đã xác nhận rà soát B7 FE12; cần kiểm tra lại môi trường tiền sản xuất | SẴN SÀNG KIỂM TRA LẠI TIỀN SẢN XUẤT |

## Danh sách kiểm tra tiền sản xuất của con người

- [ ] Thành viên đăng nhập và chuyển hướng tuyến được bảo vệ đúng.
- [ ] Thành viên tạo yêu cầu mượn bằng dữ liệu tổng hợp.
- [ ] Thủ thư phê duyệt và trả sách.
- [ ] API FE09 tính 14 ngày quá hạn thành 70.000 VND và ghi trạng thái `PAID`.
- [ ] FE10 hiển thị siêu dữ liệu an toàn, không có nội dung/mã thông báo nhạy cảm.
- [ ] FE12 hiển thị hoạt động tích hợp mà không có điều khiển thay đổi dữ liệu.
- [ ] Chế độ xem máy tính và di động không có phần chồng lấn gây cản trở.

## Xác nhận

Người rà soát:
Ngày:
Quyết định: SẴN SÀNG TIỀN SẢN XUẤT / CẦN THAY ĐỔI
Ghi chú:
```

- [ ] **Bước 3: Cập nhật trung thực cột mốc Tuần 10**

Thay đổi `.sdd/test-plan.md` từ:

```markdown
| Tuần 10: Chức năng cốt lõi đạt nghiệm thu | Mỗi chức năng cốt lõi đã triển khai có bằng chứng nghiệm thu ánh xạ tới `SPEC.md` | Đang thực hiện (đã triển khai 6 chức năng) |
```

đến:

```markdown
| Tuần 10: Chức năng cốt lõi đạt nghiệm thu | Mỗi chức năng cốt lõi đã triển khai có bằng chứng nghiệm thu ánh xạ tới `SPEC.md` | Sẵn sàng để con người nghiệm thu trên môi trường tiền sản xuất (6 chức năng) |
```

- [ ] **Bước 4: Xác minh tài liệu tham khảo và khác biệt**

Chạy:

```powershell
$paths = @(
  '.sdd/specs/feat-auth/SPEC.md',
  '.sdd/specs/feat-borrowing-management/SPEC.md',
  '.sdd/specs/feat-reservation-management/SPEC.md',
  '.sdd/specs/feat-fine-management/SPEC.md',
  '.sdd/specs/feat-notification-management/SPEC.md',
  '.sdd/specs/feat-reporting-statistics/SPEC.md',
  '.sdd/reviews/system-integration-evidence-2026-07-14.md',
  '.sdd/reviews/week11-e2e-evidence-2026-07-14.md',
  '.sdd/reviews/week12-security-audit-2026-07-14.md'
)
$missing = $paths | Where-Object { -not (Test-Path -LiteralPath $_) }
if ($missing) { throw "Missing acceptance references: $missing" }
git diff --check
```

Dự kiến: không thiếu đường dẫn và `git diff --check` thoát 0.

- [ ] **Bước 5: Cam kết**

```powershell
git add docs/release/week13-acceptance-record.md .sdd/test-plan.md
git commit -m "docs: prepare week 13 acceptance gate"
```

---

### Nhiệm vụ 2: Thêm điểm nhập tài liệu kỹ thuật

**Tệp:**
- Tạo: `README.md`
- Tạo: `docs/architecture/system-architecture.md`
- Sửa đổi: `backend/README.md`

**Giao diện:**
- Tiêu thụ: `docs/architecture/feature-integration-map.md`, `backend/src/docs/openapi.yaml`, tập lệnh gói và thiết kế Tuần 13.
- Tạo ra: điểm nhập tài liệu/điều hướng gốc được các nhà phát triển, người đánh giá và người vận hành triển khai sử dụng.

- [ ] **Bước 1: Tạo tài liệu kiến trúc hệ thống**

Tạo `docs/architecture/system-architecture.md` với:

````markdown
# Kiến trúc hệ thống

## Tổng quan thời gian chạy

```mermaid
sơ đồ LR U[Khách / Thành viên / Thủ thư / Quản trị viên] --> F[React + Vite] F -->|HTTPS REST /api|
B[Express API] B -->|TDS được mã hóa| D[(SQL Server / Azure SQL)] B --> N[SMTP hoặc nhà cung cấp
thông báo mô phỏng] B --> A[AuditLogs]
```

## Ranh giới tin cậy

- Dữ liệu đầu vào từ trình duyệt không đáng tin cậy và phải được máy chủ xác thực lại.
- Xác thực Bearer và phân quyền theo vai trò được thực thi bằng middleware và dịch vụ Express.
- Giá trị SQL dùng `mssql.Request.input`; danh sách cho phép do mã nguồn sở hữu chọn các định danh động.
- Bí mật được lưu trong biến môi trường/cài đặt App Service, không bao giờ nằm trong giá trị bản dựng trình duyệt.
- Phản hồi và dữ liệu lưu của thông báo loại trừ nội dung đặt lại/xác minh nhạy cảm.

## Quyền sở hữu mô-đun

Liên kết FE02, FE07, FE08, FE09, FE10 và FE12 tới các thư mục `.sdd/specs/feat-*/` tương ứng, đồng thời liên kết bản đồ tích hợp đầy đủ.

## Cấu trúc liên kết cục bộ

- Giao diện: `http://localhost:5173`
- Máy chủ: `http://localhost:3000`
- SQL Server: được cấu hình bằng `backend/.env`

## Cấu trúc liên kết môi trường tiền sản xuất Azure

- Azure Static Web Apps Free: điểm cuối HTTPS của giao diện.
- Azure App Service F1: điểm cuối HTTPS của máy chủ.
- Azure SQL Database: điểm cuối cơ sở dữ liệu được mã hóa.
- Môi trường `staging` trên GitHub: bí mật triển khai và biến URL.

## Ranh giới độ tin cậy và bảo mật

Ghi rõ kiểm tra tình trạng, danh sách CORS cho phép, phản hồi 5xx an toàn, nguyên tắc không tự động thay đổi lược đồ và các rủi ro Tuần 12 đã được chấp nhận.
````

Giữ cho hàng rào Nàng tiên cá hợp lệ bằng cách sử dụng hàng rào bên ngoài bốn dấu gạch ngang trong
khi chỉnh sửa nếu cần.

- [ ] **Bước 2: Tạo gốc README**

Tạo `README.md` với các phần cấp cao nhất chính xác sau:

```markdown
# Hệ thống Quản lý Thư viện

## Tổng quan
## Phạm vi đã triển khai
## Kiến trúc
## Bộ công nghệ
## Cấu trúc kho mã nguồn
## Điều kiện tiên quyết
## Thiết lập cục bộ
## Cấu hình môi trường
## Lệnh phát triển
## Cổng kiểm thử và chất lượng
## Tài liệu API
## Môi trường tiền sản xuất Azure
## Tài liệu người dùng
## Giới hạn hiện tại
## Ghi chú bảo mật
## Quy trình làm việc của nhóm
```

Yêu cầu về nội dung:

- Nêu rõ rằng máy chủ FE02, FE07, FE08, FE09 máy chủ API, FE10 và FE12 là phạm vi phù hợp với sản xuất đã hoàn thành.
- Không khẳng định bộ nhớ trình duyệt cũ FE09 là bằng chứng sản xuất.
- Liên kết `docs/architecture/system-architecture.md`, `docs/architecture/feature-integration-map.md`,
`backend/src/docs/openapi.yaml`, `docs/user-manual.md`, `docs/deployment/azure-staging-guide.md`,
`docs/release/week13-acceptance-record.md` và `docs/testing/system-integration-demo-runbook.md`.
- Bao gồm các lệnh đã có trong tệp gói; không phát minh ra các lệnh trước khi nhiệm vụ của họ thêm chúng.
- Giải thích rằng việc triển khai Azure chỉ được thực hiện theo giai đoạn và được gửi theo cách thủ công.

- [ ] **Bước 3: Liên kết phần máy chủ README với tài liệu gốc**

Thêm gần đầu `backend/README.md`:

```markdown
Thiết lập cấp dự án, kiến trúc, cổng chất lượng và hướng dẫn môi trường tiền sản xuất Azure nằm trong thư mục gốc
[`README.md`](../README.md).
```

- [ ] **Bước 4: Xác minh các lệnh được ghi lại tồn tại**

Chạy:

```powershell
$root = Get-Content package.json -Raw | ConvertFrom-Json
$backend = Get-Content backend/package.json -Raw | ConvertFrom-Json
$frontend = Get-Content frontend/package.json -Raw | ConvertFrom-Json
@('dev','test:e2e','test:system','trace:enforce') | ForEach-Object {
  if (-not $root.scripts.$_) { throw "Missing root script: $_" }
}
@('test','test:coverage:ci','test:sql:system') | ForEach-Object {
  if (-not $backend.scripts.$_) { throw "Missing backend script: $_" }
}
@('test','lint','build') | ForEach-Object {
  if (-not $frontend.scripts.$_) { throw "Missing frontend script: $_" }
}
git diff --check
```

Dự kiến: tất cả các tập lệnh đều tồn tại và kiểm tra khác biệt sẽ thoát 0.

- [ ] **Bước 5: Cam kết**

```powershell
git add README.md docs/architecture/system-architecture.md backend/README.md
git commit -m "docs: add project technical documentation"
```

---

### Nhiệm vụ 3: Thêm mẫu môi trường an toàn và hướng dẫn triển khai Azure

**Tệp:**
- Sửa đổi: `.gitignore`
- Tạo: `backend/.env.example`
- Tạo: `frontend/.env.example`
- Tạo: `docs/deployment/azure-staging-guide.md`

**Giao diện:**
- Tiêu thụ: môi trường đọc trong các mô-đun `backend/src/config/db.js`, `backend/src/config/env.js`, `backend/src/app.js` và giao diện người dùng API.
- Sản xuất: hợp đồng cấu hình được sử dụng bởi các nhà phát triển địa phương, Azure App Service, GitHub hành động và kiểm thử nhanh.

- [ ] **Bước 1: Cho phép các tệp mẫu được theo dõi trong khi vẫn bỏ qua môi trường thực**

Ngay sau `.env.*` trong `.gitignore`, hãy thêm:

```gitignore
!.env.example
!backend/.env.example
!frontend/.env.example
```

- [ ] **Bước 2: Tạo mẫu môi trường máy chủ**

Tạo `backend/.env.example`:

```dotenv
NODE_ENV=development
PORT=3000

JWT_SECRET=
BCRYPT_COST=10
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_DAYS=7

DB_SERVER=localhost
DB_NAME=LibraryManagementDB
DB_USER=
DB_PASSWORD=
DB_PORT=1433
DB_INSTANCE_NAME=
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

CORS_ORIGINS=http://localhost:5173
FRONTEND_BASE_URL=http://localhost:5173

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=
```

- [ ] **Bước 3: Tạo mẫu môi trường lối vào**

Tạo `frontend/.env.example`:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
```

- [ ] **Bước 4: Viết hướng dẫn môi trường tiền sản xuất Azure**

Tạo `docs/deployment/azure-staging-guide.md` với các phần này và tên tài nguyên chính xác:

```markdown
# Hướng dẫn triển khai môi trường tiền sản xuất Azure

## Hàng rào kiểm soát chi phí
## Tên tài nguyên và khu vực
## Cài đặt và đăng nhập Azure CLI
## Tạo nhóm tài nguyên và App Service F1
## Tạo Azure Static Web Apps Free
## Tạo Azure SQL bằng tín dụng sinh viên
## Cấu hình tường lửa Azure SQL
## Chuẩn bị và thực thi lược đồ tương thích Azure
## Cấu hình cài đặt thời gian chạy App Service
## Cấu hình biến môi trường và bí mật GitHub
## Chạy lần triển khai thủ công đầu tiên
## Chạy kiểm thử nhanh
## Hoàn tác
## Dừng/xóa tài nguyên
```

Sử dụng những tên này:

```text
Nhóm tài nguyên: rg-library-staging
Gói App Service: plan-library-staging
Ứng dụng web máy chủ: app-library-api-staging-nhat714
Static Web App: swa-library-staging-nhat714
Máy chủ logic SQL: sql-library-staging-ea-nhat714
Cơ sở dữ liệu: LibraryManagementStaging
Vùng App Service: malaysiawest
Vùng SQL: eastasia
Vùng Static Web Apps: eastasia
Tên đăng nhập quản trị SQL: libraryadmin
```

Ghi lại các biến môi trường GitHub `staging` này:

```text
AZURE_WEBAPP_NAME=app-library-api-staging-nhat714
STAGING_API_URL=https://app-library-api-staging-nhat714.azurewebsites.net
```

Tạo `STAGING_FRONTEND_URL` với Static Web Apps URL chính xác được hiển thị bởi Azure sau khi tạo tài
nguyên. Đó là giá trị do người vận hành quan sát và không được đoán từ tên tài nguyên.

Ghi lại những bí mật GitHub này:

```text
AZURE_WEBAPP_PUBLISH_PROFILE
AZURE_STATIC_WEB_APPS_API_TOKEN
```

Ghi lại rằng thông tin xác thực cơ sở dữ liệu và `JWT_SECRET` chỉ tồn tại trong Cấu hình App Service.

- [ ] **Bước 5: Xác minh các ví dụ được theo dõi và môi trường thực vẫn bị bỏ qua**

Chạy:

```powershell
git check-ignore backend/.env frontend/.env
if ($LASTEXITCODE -ne 0) { throw 'Real env files must remain ignored.' }
git check-ignore backend/.env.example frontend/.env.example
if ($LASTEXITCODE -eq 0) { throw 'Example env files must be trackable.' }
git diff --check
```

Sau đó quét các ví dụ để tìm các bài tập bí mật không trống:

```powershell
$unsafe = Select-String -Path backend/.env.example,frontend/.env.example `
  -Pattern '^(JWT_SECRET|DB_PASSWORD|SMTP_PASSWORD)=[^\s]+$'
if ($unsafe) { throw 'Environment example contains a non-empty secret.' }
```

- [ ] **Bước 6: Cam kết**

```powershell
git add .gitignore backend/.env.example frontend/.env.example docs/deployment/azure-staging-guide.md
git commit -m "docs: add azure staging configuration guide"
```

---

### Nhiệm vụ 4: Tạo lược đồ tương thích Azure mà không cần sao chép nguồn

**Tệp:**
- Tạo: `scripts/prepare-azure-schema.js`
- Tạo: `tests/deployment/azureSchema.test.js`
- Sửa đổi: `package.json`
- Sửa đổi: `README.md`

**Giao diện:**
- Tiêu thụ: `database/Librarymanagement.sql` chuẩn.
- Tạo: `transformSchema(source: string): string` và tạo tệp `tmp/azure/LibraryManagementStaging.sql` bị bỏ qua.

- [ ] **Bước 1: Viết các kiểm thử chuyển đổi lược đồ không thành công**

Tạo `tests/deployment/azureSchema.test.js`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');

const { transformSchema } = require('../../scripts/prepare-azure-schema');

test('removes CREATE DATABASE and USE batches for an existing Azure SQL database', () => {
  const source = `
SET ANSI_NULLS ON;
GO
CREATE DATABASE LibraryManagementDB;
GO
USE LibraryManagementDB;
GO
CREATE TABLE Roles (RoleId INT PRIMARY KEY);
GO
CREATE TABLE AuditLogs (AuditLogId INT PRIMARY KEY);
GO
`;

  const result = transformSchema(source);

  assert.doesNotMatch(result, /CREATE\s+DATABASE/i);
  assert.doesNotMatch(result, /^\s*USE\s+/im);
  assert.match(result, /CREATE TABLE Roles/);
  assert.match(result, /CREATE TABLE AuditLogs/);
});

test('rejects a schema missing required application tables', () => {
  const source = `
CREATE TABLE Roles (RoleId INT);
GO
CREATE TABLE Users (UserId INT);
GO
CREATE TABLE BorrowRequests (BorrowRequestId INT);
GO
CREATE TABLE Fines (FineId INT);
GO
CREATE TABLE Notifications (NotificationId INT);
GO
`;
  assert.throws(
    () => transformSchema(source),
    /required table AuditLogs/i
  );
});
```

- [ ] **Bước 2: Chạy kiểm thử để xác minh RED**

Chạy:

```powershell
node --test tests/deployment/azureSchema.test.js
```

Dự kiến: THẤT BẠI vì `scripts/prepare-azure-schema.js` không tồn tại.

- [ ] **Bước 3: Triển khai trình biến đổi lược đồ**

Tạo `scripts/prepare-azure-schema.js`:

```javascript
const fs = require('node:fs');
const path = require('node:path');

const SOURCE_PATH = path.resolve(__dirname, '../database/Librarymanagement.sql');
const OUTPUT_PATH = path.resolve(__dirname, '../tmp/azure/LibraryManagementStaging.sql');
const REQUIRED_TABLES = ['Roles', 'Users', 'BorrowRequests', 'Fines', 'Notifications', 'AuditLogs'];

function transformSchema(source) {
  const batches = String(source)
    .split(/^\s*GO\s*;?\s*$/gim)
    .map((batch) => batch.trim())
    .filter(Boolean)
    .filter((batch) => !/^CREATE\s+DATABASE\b/i.test(batch))
    .filter((batch) => !/^USE\s+/i.test(batch));

  const result = `${batches.join('\nGO\n\n')}\nGO\n`;

  if (/CREATE\s+DATABASE/i.test(result) || /^\s*USE\s+/im.test(result)) {
    throw new Error('Azure schema must not create or switch databases.');
  }

  for (const table of REQUIRED_TABLES) {
    if (!new RegExp(`CREATE\\s+TABLE\\s+${table}\\b`, 'i').test(result)) {
      throw new Error(`Azure schema is missing required table ${table}.`);
    }
  }

  return result;
}

function prepareAzureSchema({ sourcePath = SOURCE_PATH, outputPath = OUTPUT_PATH } = {}) {
  const source = fs.readFileSync(sourcePath, 'utf8');
  const result = transformSchema(source);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, result, 'utf8');
  return outputPath;
}

if (require.main === module) {
  const outputPath = prepareAzureSchema();
  console.log(`Azure-compatible schema written to ${outputPath}`);
}

module.exports = {
  prepareAzureSchema,
  transformSchema,
};
```

- [ ] **Bước 4: Thêm tập lệnh gốc**

Thêm vào `package.json`:

```json
"schema:azure:prepare": "node scripts/prepare-azure-schema.js",
"test:deployment": "node --test tests/deployment/*.test.js"
```

Thêm `npm.cmd run schema:azure:prepare` và `npm.cmd run test:deployment` vào danh sách lệnh README
gốc sau khi tập lệnh tồn tại.

- [ ] **Bước 5: Xác minh GREEN và đầu ra được tạo**

Chạy:

```powershell
npm.cmd run test:deployment
npm.cmd run schema:azure:prepare
Select-String -Path tmp/azure/LibraryManagementStaging.sql -Pattern 'CREATE DATABASE|^USE '
if ($LASTEXITCODE -eq 0) { throw 'Generated Azure schema still contains database switching.' }
git check-ignore tmp/azure/LibraryManagementStaging.sql
```

Dự kiến: các kiểm thử đã vượt qua, không tìm thấy câu lệnh cấm nào và tệp được tạo sẽ bị bỏ qua.

- [ ] **Bước 6: Cam kết**

```powershell
git add package.json scripts/prepare-azure-schema.js tests/deployment/azureSchema.test.js
git commit -m "chore: add azure schema preparation"
```

---

### Nhiệm vụ 5: Thêm kiểm thử nhanh theo giai đoạn chỉ đọc

**Tệp:**
- Tạo: `scripts/smoke-staging.js`
- Tạo: `tests/deployment/smokeStaging.test.js`
- Sửa đổi: `package.json`
- Sửa đổi: `README.md`

**Giao diện:**
- Tiêu thụ: `STAGING_FRONTEND_URL`, `STAGING_API_URL` và phản hồi HTTP tương thích với tìm nạp.
- Tạo ra: `runStagingSmoke(options): Promise<object>` và CLI lệnh `npm run smoke:staging`.

- [ ] **Bước 1: Viết các bài kiểm thử nhanh thất bại**

Tạo `tests/deployment/smokeStaging.test.js` bằng máy chủ HTTP cục bộ:

```javascript
const http = require('node:http');
const test = require('node:test');
const assert = require('node:assert/strict');

const { runStagingSmoke } = require('../../scripts/smoke-staging');

async function startFixture({ permissiveCors = false, protectedStatus = 401 } = {}) {
  let allowedOrigin = '';
  const server = http.createServer((req, res) => {
    const origin = req.headers.origin;
    const allowOrigin = permissiveCors ? '*' : origin === allowedOrigin ? origin : null;
    if (allowOrigin) res.setHeader('Access-Control-Allow-Origin', allowOrigin);

    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<!doctype html><title>Library</title>');
      return;
    }
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }
    if (req.url === '/api/auth/me') {
      res.writeHead(protectedStatus, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }));
      return;
    }
    res.writeHead(404).end();
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  allowedOrigin = baseUrl;
  return { baseUrl, close: () => new Promise((resolve) => server.close(resolve)) };
}

test('passes for healthy frontend, API, strict CORS, and protected auth route', async () => {
  const fixture = await startFixture();
  try {
    const result = await runStagingSmoke({
      frontendUrl: fixture.baseUrl,
      apiUrl: fixture.baseUrl,
    });
    assert.equal(result.status, 'PASS');
    assert.equal(result.checks.length, 5);
  } finally {
    await fixture.close();
  }
});

test('fails when the API allows an untrusted origin', async () => {
  const fixture = await startFixture({ permissiveCors: true });
  try {
    await assert.rejects(
      runStagingSmoke({ frontendUrl: fixture.baseUrl, apiUrl: fixture.baseUrl }),
      /untrusted origin/i
    );
  } finally {
    await fixture.close();
  }
});

test('fails when a protected endpoint accepts an anonymous request', async () => {
  const fixture = await startFixture({ protectedStatus: 200 });
  try {
    await assert.rejects(
      runStagingSmoke({ frontendUrl: fixture.baseUrl, apiUrl: fixture.baseUrl }),
      /expected 401/i
    );
  } finally {
    await fixture.close();
  }
});
```

- [ ] **Bước 2: Chạy kiểm thử để xác minh RED**

```powershell
npm.cmd run test:deployment
```

Dự kiến: THẤT BẠI vì `scripts/smoke-staging.js` không tồn tại.

- [ ] **Bước 3: Tạo kiểm thử nhanh**

Tạo `scripts/smoke-staging.js`:

```javascript
const DEFAULT_TIMEOUT_MS = 15000;
const UNTRUSTED_ORIGIN = 'https://untrusted.example.test';

function normalizeUrl(value, name) {
  if (!value) throw new Error(`${name} is required.`);
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${name} must use HTTP or HTTPS.`);
  }
  return parsed.origin;
}

async function request(fetchImpl, url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function runStagingSmoke({
  frontendUrl = process.env.STAGING_FRONTEND_URL,
  apiUrl = process.env.STAGING_API_URL,
  fetchImpl = global.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  const frontend = normalizeUrl(frontendUrl, 'STAGING_FRONTEND_URL');
  const api = normalizeUrl(apiUrl, 'STAGING_API_URL');
  const checks = [];

  const frontendResponse = await request(fetchImpl, `${frontend}/`, {}, timeoutMs);
  if (frontendResponse.status !== 200 || !String(frontendResponse.headers.get('content-type')).includes('text/html')) {
    throw new Error(`Frontend check failed with HTTP ${frontendResponse.status}.`);
  }
  checks.push('frontend');

  const healthResponse = await request(fetchImpl, `${api}/health`, {}, timeoutMs);
  const health = await healthResponse.json().catch(() => ({}));
  if (healthResponse.status !== 200 || health.status !== 'ok') {
    throw new Error(`API health check failed with HTTP ${healthResponse.status}.`);
  }
  checks.push('health');

  const allowedResponse = await request(fetchImpl, `${api}/health`, {
    headers: { Origin: frontend },
  }, timeoutMs);
  if (allowedResponse.headers.get('access-control-allow-origin') !== frontend) {
    throw new Error('Configured staging frontend origin was not allowed by CORS.');
  }
  checks.push('allowed-cors');

  const untrustedResponse = await request(fetchImpl, `${api}/health`, {
    headers: { Origin: UNTRUSTED_ORIGIN },
  }, timeoutMs);
  if (untrustedResponse.headers.get('access-control-allow-origin')) {
    throw new Error('API allowed an untrusted origin.');
  }
  checks.push('blocked-cors');

  const protectedResponse = await request(fetchImpl, `${api}/api/auth/me`, {}, timeoutMs);
  if (protectedResponse.status !== 401) {
    throw new Error(`Protected endpoint expected 401 but received ${protectedResponse.status}.`);
  }
  checks.push('protected-route');

  return { status: 'PASS', frontendUrl: frontend, apiUrl: api, checks };
}

if (require.main === module) {
  runStagingSmoke()
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(`[staging smoke] ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = { runStagingSmoke };
```

- [ ] **Bước 4: Thêm tập lệnh CLI**

Thêm vào root `package.json`:

```json
"smoke:staging": "node scripts/smoke-staging.js"
```

Thêm `npm.cmd run smoke:staging` vào phần lệnh Môi trường tiền sản xuất Azure trong thư mục gốc README.

- [ ] **Bước 5: Xác minh GREEN**

```powershell
npm.cmd run test:deployment
```

Dự kiến: tất cả các kiểm thử triển khai đều vượt qua.

- [ ] **Bước 6: Cam kết**

```powershell
git add package.json scripts/smoke-staging.js tests/deployment/smokeStaging.test.js
git commit -m "test: add staging smoke checks"
```

---

### Nhiệm vụ 6: Tạo hướng dẫn sử dụng và ảnh chụp màn hình tổng hợp

**Tệp:**
- Sửa đổi: `tests/e2e/system-golden-path.spec.js`
- Tạo: `scripts/promote-doc-screenshots.js`
- Tạo: `docs/user-manual.md`
- Tạo hình ảnh được tạo theo: `docs/assets/user-manual/`
- Sửa đổi: `package.json`
- Sửa đổi: `README.md`

**Giao diện:**
- Tiêu thụ: các tác nhân Playwright mang tính quyết định và luồng nghiệp vụ chuẩn của trình duyệt hiện có.
- Tạo ra: bốn ảnh chụp màn hình tổng hợp và hướng dẫn sử dụng dựa trên vai trò.

- [ ] **Bước 1: Thêm điểm chụp ảnh màn hình xác định**

Trong `tests/e2e/system-golden-path.spec.js`, giữ nguyên các xác nhận hiện có và thêm các ảnh chụp
màn hình sau:

```javascript
await page.goto(`${FRONTEND_URL}/login`);
await page.screenshot({ path: 'output/playwright/manual-login.png', fullPage: true });
```

Thêm sau khi xác nhận thành công yêu cầu thành viên:

```javascript
await page.screenshot({ path: 'output/playwright/manual-member-borrow-request.png', fullPage: true });
```

Thêm sau khi thủ thư phê duyệt thành công:

```javascript
await page.screenshot({ path: 'output/playwright/manual-librarian-approval.png', fullPage: true });
```

Đổi tên/sao chép nguồn ảnh chụp màn hình báo cáo hiện có thành:

```javascript
await page.screenshot({ path: 'output/playwright/manual-borrowing-report.png', fullPage: true });
```

Không xóa xác nhận tràn thiết bị di động.

- [ ] **Bước 2: Thêm tập lệnh quảng cáo ảnh chụp màn hình**

Tạo `scripts/promote-doc-screenshots.js`:

```javascript
const fs = require('node:fs');
const path = require('node:path');

const names = [
  'manual-login.png',
  'manual-member-borrow-request.png',
  'manual-librarian-approval.png',
  'manual-borrowing-report.png',
];
const sourceDir = path.resolve(__dirname, '../output/playwright');
const targetDir = path.resolve(__dirname, '../docs/assets/user-manual');

fs.mkdirSync(targetDir, { recursive: true });
for (const name of names) {
  const source = path.join(sourceDir, name);
  if (!fs.existsSync(source)) throw new Error(`Missing screenshot ${source}`);
  fs.copyFileSync(source, path.join(targetDir, name));
}
console.log(`Promoted ${names.length} user-manual screenshots.`);
```

- [ ] **Bước 3: Thêm lệnh chụp màn hình**

Thêm vào root `package.json`:

```json
"docs:screenshots": "playwright test tests/e2e/system-golden-path.spec.js --project=chromium && node scripts/promote-doc-screenshots.js"
```

Thêm `npm.cmd run docs:screenshots` vào danh sách lệnh tài liệu trong thư mục gốc README.

- [ ] **Bước 4: Chạy luồng trình duyệt và tạo hình ảnh**

```powershell
npm.cmd run docs:screenshots
```

Dự kiến: Playwright đạt 1/1 và bốn tệp PNG xuất hiện trong `docs/assets/user-manual/`.

- [ ] **Bước 5: Kiểm tra mọi ảnh chụp màn hình**

Sử dụng trình xem hình ảnh cục bộ trên mỗi PNG. Xác nhận:

- chỉ xuất hiện dữ liệu `example.test` tổng hợp;
- không xuất hiện mật khẩu, mã thông báo, nội dung thông báo, `.env` hoặc chuỗi kết nối;
- không có phần tử phương thức, văn bản hoặc điều hướng nào chồng chéo nhau một cách không mạch lạc;
- ảnh chụp màn hình báo cáo hiển thị thông báo máy chủ thực và KPI được tích hợp.

- [ ] **Bước 6: Viết hướng dẫn sử dụng**

Tạo `docs/user-manual.md` với:

```markdown
# Hướng dẫn sử dụng Hệ thống Quản lý Thư viện

## Vai trò được hỗ trợ
## Đăng nhập và đăng xuất
![Đăng nhập](assets/user-manual/manual-login.png)
## Thành viên: Tạo yêu cầu mượn
![Yêu cầu mượn của thành viên](assets/user-manual/manual-member-borrow-request.png)
## Thành viên: Xem lịch sử mượn
## Thành viên: Quản lý đặt chỗ
## Thủ thư: Phê duyệt yêu cầu mượn
![Thư viện phê duyệt](assets/user-manual/manual-librarian-approval.png)
## Thủ thư: Xử lý trả sách
## Thủ thư/Quản trị viên: Ranh giới API khoản phạt
## Thủ thư/Quản trị viên: Xem báo cáo
![Báo cáo vay](assets/user-manual/manual-borrowing-report.png)
## Quản trị viên: Quản lý người dùng và vai trò
## Lỗi thường gặp và cách khôi phục
## Ghi chú bảo mật và quyền riêng tư
## Giới hạn đã biết
```

Tuyên bố rõ ràng rằng các hàng trình duyệt cũ của FE09 không phải là bằng chứng về tính bền bỉ của
Azure SQL và FE10 chưa hoàn tất việc chấp nhận giao diện người dùng hộp thư đến. Thay vào đó, hãy
tham khảo API phù hợp với quá trình sản xuất và bằng chứng môi trường tiền sản xuất.

- [ ] **Bước 7: Chạy lại E2E và xác minh đường dẫn hình ảnh**

```powershell
npm.cmd run test:e2e
$images = @(
  'docs/assets/user-manual/manual-login.png',
  'docs/assets/user-manual/manual-member-borrow-request.png',
  'docs/assets/user-manual/manual-librarian-approval.png',
  'docs/assets/user-manual/manual-borrowing-report.png'
)
$missing = $images | Where-Object { -not (Test-Path -LiteralPath $_) }
if ($missing) { throw "Missing manual images: $missing" }
git diff --check
```

- [ ] **Bước 8: Cam kết**

```powershell
git add package.json tests/e2e/system-golden-path.spec.js scripts/promote-doc-screenshots.js docs/user-manual.md docs/assets/user-manual
git commit -m "docs: add user manual and screenshots"
```

---

### Nhiệm vụ 7: Thêm quy trình triển khai môi trường tiền sản xuất Azure thủ công

**Tệp:**
- Tạo: `.github/workflows/deploy-staging.yml`

**Giao diện:**
- Tiêu thụ: Biến/bí mật GitHub `staging`, cấu hình bản dựng App Service, mã thông báo Static Web Apps và `npm run smoke:staging`.
- Sản xuất: triển khai phần máy chủ và giao diện người dùng có kiểm soát chất lượng được gửi thủ công, sau đó là kiểm thử nhanh.

- [ ] **Bước 1: Tạo quy trình làm việc**

Tạo `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy staging

on:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: library-staging
  cancel-in-progress: false

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    environment:
      name: staging
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm ci
        working-directory: backend
      - run: npm ci
        working-directory: frontend
      - run: npm run trace:enforce
      - run: npm run test:coverage:ci
        working-directory: backend
      - run: npm run test:integration:system
        working-directory: backend
      - run: npm test
        working-directory: frontend
      - run: npm run lint
        working-directory: frontend
      - run: npm run build
        working-directory: frontend
        env:
          VITE_API_BASE_URL: ${{ vars.STAGING_API_URL }}/api
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - run: npm run test:deployment

  deploy-backend:
    needs: quality-gate
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: ${{ vars.STAGING_API_URL }}
    steps:
      - uses: actions/checkout@v4
      - name: Prepare backend deployment package
        shell: pwsh
        run: |
          New-Item -ItemType Directory -Force deploy/backend | Out-Null
          Copy-Item backend/package.json,backend/package-lock.json deploy/backend/
          Copy-Item backend/src deploy/backend/src -Recurse
      - name: Deploy backend
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ vars.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: deploy/backend

  deploy-frontend:
    needs: quality-gate
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: ${{ vars.STAGING_FRONTEND_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
        working-directory: frontend
      - run: npm run build
        working-directory: frontend
        env:
          VITE_API_BASE_URL: ${{ vars.STAGING_API_URL }}/api
      - name: Deploy frontend
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: upload
          app_location: frontend/dist
          output_location: ''
          skip_app_build: true

  smoke-test:
    needs: [deploy-backend, deploy-frontend]
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: ${{ vars.STAGING_FRONTEND_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm run smoke:staging
        env:
          STAGING_FRONTEND_URL: ${{ vars.STAGING_FRONTEND_URL }}
          STAGING_API_URL: ${{ vars.STAGING_API_URL }}
```

- [ ] **Bước 2: Xác thực cú pháp YAML với phần phụ thuộc máy chủ hiện có**

```powershell
npm.cmd --prefix backend ci
Push-Location backend
node -e "require('yamljs').load('../.github/workflows/deploy-staging.yml'); console.log('workflow yaml ok')"
Pop-Location
```

Dự kiến: `workflow yaml ok`.

- [ ] **Bước 3: Xác minh biến bắt buộc và tên bí mật có nhất quán**

```powershell
$workflow = Get-Content .github/workflows/deploy-staging.yml -Raw
@('AZURE_WEBAPP_NAME','STAGING_API_URL','STAGING_FRONTEND_URL') | ForEach-Object {
  if ($workflow -notmatch [regex]::Escape($_)) { throw "Missing workflow variable $_" }
}
@('AZURE_WEBAPP_PUBLISH_PROFILE','AZURE_STATIC_WEB_APPS_API_TOKEN') | ForEach-Object {
  if ($workflow -notmatch [regex]::Escape($_)) { throw "Missing workflow secret $_" }
}
git diff --check
```

- [ ] **Bước 4: Chạy tập hợp con chất lượng cục bộ**

```powershell
npm.cmd run test:deployment
npm.cmd run trace:enforce
npm.cmd --prefix frontend run build
```

Dự kiến: tất cả các lệnh thoát 0.

- [ ] **Bước 5: Cam kết**

```powershell
git add .github/workflows/deploy-staging.yml
git commit -m "ci: add azure staging deployment"
```

---

### Nhiệm vụ 8: Cung cấp Azure, Triển khai, Smoke-kiểm thử và Ghi lại bằng chứng

**Tệp:**
- Tạo sau khi triển khai được quan sát: `.sdd/reviews/week13-staging-deployment-evidence-2026-07-14.md`
- Sửa đổi sau khi con người đánh giá: `docs/release/week13-acceptance-record.md`
- Sửa đổi sau khi hoàn thành: `.sdd/test-plan.md`

**Giao diện:**
- Đầu vào: nhánh Tuần 13 đã commit, subscription Azure for Students, cấu hình GitHub repository, schema Azure đã tạo và workflow triển khai.
- Tạo ra: URL môi trường tiền sản xuất công khai, bằng chứng kiểm thử nhanh, quyết định chấp nhận của con người và hồ sơ hoàn thành Tuần 13.

- [ ] **Bước 1: Cài đặt Azure CLI và xác thực**

Chạy từ thiết bị đầu cuối PowerShell tương tác:

```powershell
winget install --exact --id Microsoft.AzureCLI
az login --use-device-code
az account list --output table
az account show --output table
```

Dự kiến: subscription đang hoạt động là `Azure for Students`. Dừng lại
nếu đăng ký khác đang hoạt động.

- [ ] **Bước 2: Tạo nhóm tài nguyên và F1 App Service**

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

Dự kiến: mọi lệnh đều thoát 0 và kế hoạch SKU là F1. Dừng lại trước khi thử lại với SKU trả phí.

- [ ] **Bước 3: Định cấu hình cài đặt App Service không bí mật**

```powershell
az webapp config appsettings set `
  --name app-library-api-staging-nhat714 `
  --resource-group rg-library-staging `
  --settings `
    NODE_ENV=production `
    PORT=8080 `
    DB_SERVER=sql-library-staging-ea-nhat714.database.windows.net `
    DB_NAME=LibraryManagementStaging `
    DB_PORT=1433 `
    DB_ENCRYPT=true `
    DB_TRUST_SERVER_CERTIFICATE=false `
    SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

Sử dụng Cấu hình Azure Portal App Service để nhập `JWT_SECRET`, `DB_USER` và `DB_PASSWORD`. Tạo
`JWT_SECRET` cục bộ với:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Không dán giá trị được tạo vào cuộc trò chuyện, tệp nguồn, lịch sử lệnh hoặc bằng chứng.

- [ ] **Bước 4: Tạo Azure SQL bằng cách kiểm tra chi phí được quan sát**

Trong Cổng thông tin Azure:

1. Tạo máy chủ logic `sql-library-staging-ea-nhat714` tại `rg-library-staging`, Đông Á. các
giới hạn miễn phí API đã từ chối Malaysia West trong quá trình cung cấp được quan sát mặc dù cổng
thông tin đã hiển thị ưu đãi.
2. Sử dụng tên người dùng quản trị viên `libraryadmin` và mật khẩu mới được tạo.
3. Chỉ tạo cơ sở dữ liệu `LibraryManagementStaging` sau khi trang chi phí hiển thị trợ cấp miễn phí hoặc
   xác nhận phạm vi được bao phủ bởi tín dụng Azure for Students.
4. Ghi lại SKU được hiển thị và ước tính chi phí vào ghi chú của nhà điều hành tư nhân và chỉ SKU làm bằng chứng.
5. Không kích hoạt quy tắc tường lửa vĩnh viễn trên toàn Internet.

- [ ] **Bước 5: Hạn chế tường lửa SQL**

Nhận địa chỉ gửi đi App Service:

```powershell
az webapp show `
  --name app-library-api-staging-nhat714 `
  --resource-group rg-library-staging `
  --query outboundIpAddresses `
  --output tsv
```

Thêm các địa chỉ đó và IP của nhà điều hành hiện tại thông qua Mạng Azure SQL. Xóa IP toán tử sau
khi khởi tạo lược đồ nếu không còn cần thiết.

- [ ] **Bước 6: Tạo Static Web Apps miễn phí và ghi lại URL của nó**

Trong Cổng thông tin Azure:

1. Tạo `swa-library-staging-nhat714` trong `rg-library-staging` bằng gói Miễn phí và Đông Á.
2. Chọn nguồn triển khai `Other` để quy trình làm việc thuộc sở hữu của kho lưu trữ vẫn có thẩm quyền.
3. Sao chép `https://*.azurestaticapps.net` URL được tạo.
4. Sao chép mã thông báo triển khai mà không đặt nó vào một tệp.

Đặt cài đặt URL không bí mật của App Service:

```powershell
$staticUrl = Read-Host 'Paste the exact Azure Static Web Apps URL'
az webapp config appsettings set `
  --name app-library-api-staging-nhat714 `
  --resource-group rg-library-staging `
  --settings `
    "CORS_ORIGINS=$staticUrl" `
    "FRONTEND_BASE_URL=$staticUrl"
```

URL là công khai nhưng vẫn phải được sao chép chính xác từ đầu ra tài nguyên Azure.

- [ ] **Bước 7: Chuẩn bị và khởi tạo lược đồ Azure SQL**

```powershell
npm.cmd run schema:azure:prepare
```

Xem lại `tmp/azure/LibraryManagementStaging.sql`, xác nhận cơ sở dữ liệu được kết nối là
`LibraryManagementStaging`, sau đó thực thi nó bằng Azure truy vấn Editor, SSMS hoặc `sqlcmd`. Xác
minh:

```sql
SELECT
  DB_NAME() AS DatabaseName,
  COUNT(*) AS TableCount
FROM sys.tables;
```

Dự kiến: `DatabaseName = LibraryManagementStaging` và số lượng bảng khác 0. Không ghi lại thông tin
xác thực làm bằng chứng.

- [ ] **Bước 8: Định cấu hình Môi trường chạy thử GitHub**

Trong Cài đặt kho lưu trữ GitHub -> Môi trường -> Môi trường mới, tạo `staging`.

Biến:

```text
AZURE_WEBAPP_NAME=app-library-api-staging-nhat714
STAGING_API_URL=https://app-library-api-staging-nhat714.azurewebsites.net
```

Tạo `STAGING_FRONTEND_URL` với Static Web Apps URL được quan sát chính xác.

Bí mật:

```text
AZURE_WEBAPP_PUBLISH_PROFILE
AZURE_STATIC_WEB_APPS_API_TOKEN
```

Đặt bí mật đầu tiên cho hồ sơ xuất bản App Service máy chủ và bí mật thứ hai cho mã thông báo triển
khai Static Web Apps. Không dán một trong hai giá trị vào một tệp cục bộ.

Cho phép phê duyệt cần thiết của người đánh giá đối với Môi trường `staging` nếu gói kho lưu trữ hỗ trợ nó.

- [ ] **Bước 9: Xem xét, hợp nhất và đẩy nhánh triển khai Tuần 13**

Chạy cổng hợp nhất trước đầy đủ trên nhánh chức năng:

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
npm.cmd run test:deployment
npm.cmd run trace:enforce
git diff --check
```

`main` địa phương hiện đang dẫn trước `origin/main` với các cam kết chất lượng đã hoàn thành vào
Tuần 12/11. Yêu cầu xác nhận rõ ràng trước lần đẩy đầu tiên, sau đó đẩy `main` để nhánh Tuần 13 có
cơ sở từ xa chính xác:

```powershell
git -C D:\SWP391\library-management-system push origin main
```

Sử dụng `superpowers:finishing-a-development-branch` cho nhánh triển khai Tuần 13. Nên sử dụng yêu
cầu hợp nhất vì quy trình môi trường tiền sản xuất và tài liệu cần có sự xem xét của con người. Quy
trình công việc phải được hợp nhất vào `main` được đẩy trước lần chạy `workflow_dispatch` đầu tiên.

- [ ] **Bước 10: Chạy quy trình triển khai**

Trong GitHub Actions, chọn `Deploy staging`, chọn `main` và chạy workflow. Phê duyệt
triển khai Môi trường `staging` khi được nhắc.

Dự kiến:

- ĐẠT `quality-gate`;
- ĐẠT `deploy-backend`;
- ĐẠT `deploy-frontend`;
- ĐẠI DIỆN `smoke-test`.

- [ ] **Bước 11: Tiến hành kiểm thử nhanh độc lập tại địa phương**

```powershell
$env:STAGING_FRONTEND_URL = Read-Host 'Paste the exact Azure Static Web Apps URL'
$env:STAGING_API_URL='https://app-library-api-staging-nhat714.azurewebsites.net'
npm.cmd run smoke:staging
```

Dự kiến: JSON với `status: "PASS"` và năm lần kiểm tra.

- [ ] **Bước 12: Thực hiện chấp nhận môi trường tiền sản xuất của con người**

Sử dụng dữ liệu môi trường tiền sản xuất tổng hợp và hoàn thành mọi hộp kiểm trong
`docs/release/week13-acceptance-record.md`. Ghi lại người đánh giá, ngày tháng, quyết định và những
hạn chế. Không đánh dấu giao diện người dùng cũ của FE09 hoặc giao diện người dùng hộp thư đến FE10
là hoàn tất.

- [ ] **Bước 13: Tạo nhánh bằng chứng tiếp theo sau khi triển khai**

Cập nhật cây công việc chính sau khi triển khai PR/hợp nhất, sau đó tạo một nhánh bằng chứng riêng biệt:

```powershell
git -C D:\SWP391\library-management-system pull --ff-only
git -C D:\SWP391\library-management-system worktree add `
  -b docs/week13-staging-evidence `
  D:\SWP391\worktrees\library-management-system-week13-evidence `
  main
```

Thực hiện các Bước 14-16 trong sơ đồ bằng chứng đó để kết quả triển khai được quan sát không bị lẫn
vào nhánh triển khai đã được xem xét.

- [ ] **Bước 14: Ghi lại bằng chứng triển khai chỉ sử dụng các giá trị được quan sát**

Tạo `.sdd/reviews/week13-staging-deployment-evidence-2026-07-14.md` chứa:

```markdown
# Bằng chứng triển khai môi trường tiền sản xuất Azure Tuần 13

Ngày: 2026-07-14
Cam kết đã triển khai:
Giao diện người dùng URL:
API URL: https://app-library-api-staging-nhat714.azurewebsites.net
Nhóm tài nguyên Azure: rg-library-staging
Gói App Service: F1 miễn phí
Azure SQL SKU:

## Quy trình triển khai
## Kết quả kiểm thử nhanh
## Khởi tạo cơ sở dữ liệu
## Nghiệm thu của con người
## Giới hạn đã biết
## Hoàn tác
## Hàng rào kiểm soát chi phí
```

Điền vào mọi trường bằng chứng trống từ đầu ra triển khai được quan sát trước khi cam kết. Không bao
gồm thông tin xác thực, mã thông báo triển khai, chuỗi kết nối hoặc nội dung thông báo nhạy cảm.

- [ ] **Bước 15: Đánh dấu Tuần 13 chỉ hoàn thành sau khi triển khai và được con người chấp nhận**

Thêm cột mốc Tuần 13 vào `.sdd/test-plan.md`:

```markdown
|Tuần 13: Triển khai tài liệu và môi trường tiền sản xuất|URL môi trường tiền sản xuất, tài liệu kỹ thuật, hướng dẫn sử dụng, quy trình triển khai, bằng chứng kiểm thử nhanh, sự chấp nhận của con người|**Xong (2026-07-14)**|
```

Nếu việc triển khai hoặc sự chấp nhận của con người chưa hoàn tất, hãy sử dụng `In progress` và nêu
rõ trình chặn chính xác.

- [ ] **Bước 16: Cam kết bằng chứng quan sát cuối cùng**

```powershell
git add .sdd/reviews/week13-staging-deployment-evidence-2026-07-14.md docs/release/week13-acceptance-record.md .sdd/test-plan.md
git commit -m "docs: record week 13 staging deployment"
```
