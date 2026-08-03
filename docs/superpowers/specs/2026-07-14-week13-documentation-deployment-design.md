# Tài liệu tuần 13 và thiết kế môi trường tiền sản xuất Azure

**Ngày:** 2026-07-14 **Tình trạng:** Phương hướng đã được phê duyệt; thiết kế bằng văn bản đang chờ
xem xét tài liệu của con người **nhánh:** `docs/week13-documentation-deployment`

## 1. Mục tiêu

Hoàn thành các sản phẩm của Tuần 13 trong cẩm nang mà không cần thêm các chức năng của sản phẩm:

- đóng gói bằng chứng chấp nhận cho sáu chức năng đã triển khai;
- xuất bản bộ tài liệu kỹ thuật và hướng dẫn sử dụng mạch lạc;
- cung cấp môi trường staging Azure bằng subscription Azure for Students;
- thêm workflow triển khai GitHub Actions có kiểm soát;
- triển khai và kiểm tra kiểm thử giao diện môi trường tiền sản xuất đang hoạt động, cơ sở dữ liệu API và Azure SQL.

Sản phẩm mục tiêu có thể phân phối là URL môi trường tiền sản xuất được ghi lại, API URL đang hoạt
động, bản nháp tài liệu kỹ thuật, kho lưu trữ hoàn chỉnh README, hướng dẫn sử dụng và bằng chứng
triển khai/kiểm thử nhanh có thể lặp lại.

## 2. Phạm vi

### Trong phạm vi

- FE02 Xác thực
- FE07 Quản lý mượn sách
- FE08 Quản lý đặt chỗ
- FE09 máy chủ phù hợp với sản xuất API
- FE10 Quản lý thông báo
- FE12 Báo cáo và Thống kê
- Các tuyến public/book/profile/admin/inventory hiện có chỉ theo yêu cầu để ghi lại hoặc triển khai chúng
- môi trường tiền sản xuất giao diện người dùng Azure Static Web Apps
- môi trường tiền sản xuất máy chủ Azure App Service
- Azure SQL môi trường tiền sản xuất cơ sở dữ liệu
- GitHub Triển khai hành động và tự động hóa kiểm thử nhanh

### Ngoài phạm vi

- chức năng sản phẩm mới
- FE09 căn chỉnh giao diện người dùng kế thừa
- Các chức năng đóng hiện được đánh dấu `NOT STARTED` hoặc `DRAFT`
- Triển khai sản xuất tự động
- thao tác ghi lược đồ cơ sở dữ liệu tự động từ CI
- Tài nguyên Azure trả phí ngoài tín dụng Azure for Students khi chưa có phê duyệt rõ ràng của con người
- Di chuyển từ SQL Server sang cơ sở dữ liệu khác

## 3. Kiến trúc Azure đã chọn

### 3.1 Linh kiện

| Thành phần | Dịch vụ Azure | Trách nhiệm |
| --- | --- | --- |
| Giao diện người dùng | Azure Static Web Apps Miễn phí | Phục vụ bản dựng sản xuất Vite trên HTTPS. |
| máy chủ | Azure App Service cho Node.js | Chạy Express API với `NODE_ENV=production`. |
| Cơ sở dữ liệu | Cơ sở dữ liệu Azure SQL | Lưu trữ bản sao môi trường tiền sản xuất của `LibraryManagement`. |
| Nguồn và tự động hóa | GitHub + GitHub Actions | Chạy quality gates, triển khai commit đã phê duyệt và thực hiện smoke test. |
| Bí mật | GitHub Bí mật môi trường + Cấu hình App Service | Lưu trữ mã thông báo triển khai, thông tin xác thực cơ sở dữ liệu, bí mật JWT, cài đặt SMTP và URL. |

Chính sách chi phí:

- App Service bắt đầu với gói F1 Free. Nếu phím F1 không có hoặc không chạy được ứng dụng thì dừng
  trước khi chọn B1 hoặc gói trả phí khác và yêu cầu phê duyệt rõ ràng.
- Azure SQL chỉ được tạo khi ước tính chi phí cổng thông tin xác định trợ cấp miễn phí hoặc xác nhận
rằng cấu hình đã chọn được bao gồm trong tín dụng Azure for Students. Ước
tính được ghi lại
trước khi tạo.
- Static Web Apps vẫn nằm trong gói Miễn phí trong Tuần 13.

Vùng mặc định:

- App Service: Malaysia West, khu vực gần nhất được subscription Azure for Students cho phép
  chính sách được tuân thủ trong quá trình cung cấp.
- Azure SQL: Đông Á. Giới hạn miễn phí API đã từ chối Malaysia West trong quá trình cung cấp mặc dù
  cổng thông tin hiển thị ưu đãi miễn phí.
- Static Web Apps: Đông Á khi Đông Nam Á không được cung cấp gói miễn phí.

Tên tài nguyên sử dụng tiền tố dự án ổn định cộng với hậu tố duy nhất ngắn:

```text
rg-library-staging
swa-library-staging-<suffix>
app-library-api-staging-<suffix>
sql-library-staging-<suffix>
LibraryManagementStaging
```

Hậu tố được chọn một lần trong quá trình cung cấp và được ghi lại trong bằng chứng triển khai. Nó
không được nhúng vào nguồn ứng dụng.

### 3.2 Luồng yêu cầu

```text
Browser
  -> Azure Static Web Apps (React/Vite)
  -> HTTPS API request using VITE_API_BASE_URL
  -> Azure App Service (Express)
  -> encrypted SQL connection
  -> Azure SQL Database
```

Giao diện người dùng và máy chủ có các URL riêng biệt. App Service `CORS_ORIGINS` chỉ chứa nguồn gốc
môi trường tiền sản xuất Static Web Apps. Các công cụ và yêu cầu có cùng nguồn gốc không có tiêu đề
Nguồn gốc vẫn được hỗ trợ.

## 4. Cổng tiếp nhận

Cổng tự động Tuần 11 và Tuần 12 đã hoàn tất, nhưng kế hoạch kiểm thử dự án vẫn đánh dấu việc chấp
nhận chức năng cốt lõi của Tuần 10 là đang được tiến hành. Tuần 13 bắt đầu bằng việc tập hợp một bản
ghi chấp nhận cho sáu chức năng đã triển khai.

Hồ sơ phải:

- liên kết từng chức năng với `SPEC.md`, `TASKS.md`, `TEST_PLAN.md` đã được phê duyệt và xem xét bằng chứng;
- phân biệt bằng chứng L1-L3 tự động với sự chấp nhận L4 của con người;
- tái sử dụng luồng nghiệp vụ chuẩn Playwright và bằng chứng tích hợp hệ thống;
- xác định căn chỉnh trình duyệt FE09 và giao diện người dùng hộp thư đến FE10 là các hạn chế được ghi lại;
- sử dụng `READY FOR HUMAN ACCEPTANCE` cho đến khi con người ghi lại kết quả hình ảnh/bản demo;
- không bao giờ đánh dấu quan sát thủ công là ĐẠT chỉ dựa trên đầu ra của tác nhân.

Không có trạng thái chức năng nào được nâng cấp chỉ vì tài liệu Tuần 13 tồn tại.

## 5. Bộ tài liệu

### 5.1 Gốc README

`README.md` gốc trở thành điểm vào và bao gồm:

- mục đích hệ thống và phạm vi thực hiện;
- bộ công nghệ kiến trúc và công nghệ;
- bản đồ kho lưu trữ;
- điều kiện tiên quyết và thiết lập cục bộ;
- cấu hình môi trường an toàn bằng cách sử dụng các tệp mẫu được theo dõi;
- phát triển cục bộ, kiểm tra, xây dựng, truy vết, các lệnh E2E và SQL;
- Kiến trúc môi trường tiền sản xuất Azure và liên kết đến tài liệu triển khai;
- những hạn chế hiện tại và ghi chú bảo mật;
- liên kết đến tài liệu tham khảo API, hướng dẫn sử dụng, bằng chứng chấp nhận và sổ tay trình bày.

### 5.2 Tài liệu kỹ thuật

Tạo hoặc hợp nhất:

- `docs/architecture/system-architecture.md`: thành phần thời gian chạy, ranh giới tin cậy, luồng dữ liệu,
  cấu trúc liên kết triển khai và liên kết đến bản đồ tích hợp chức năng hiện có.
- `docs/deployment/azure-staging-guide.md`: Tài nguyên, cấu hình, bí mật, cơ sở dữ liệu của Azure
  khởi tạo, thiết lập môi trường GitHub, triển khai lần đầu, khôi phục, dọn dẹp và giới hạn chi phí.
- `docs/release/week13-acceptance-record.md`: ma trận chấp nhận sáu chức năng và khu vực đăng xuất của con người.
- `backend/src/docs/openapi.yaml` hiện tại vẫn là tham chiếu API có thể đọc được bằng máy; README và
  liên kết hướng dẫn triển khai tới `/api-docs` và tệp nguồn.

### 5.3 Hướng dẫn sử dụng

Tạo `docs/user-manual.md` cho quy trình làm việc của Khách, Thành viên, Thủ thư và Quản trị viên. Nó
chỉ được mô tả hành vi được thực hiện và bao gồm luồng trình bày quan trọng:

- đăng nhập;
- duyệt/chọn một bản sao;
- tạo và phê duyệt yêu cầu mượn sách;
- trả sách một món đồ quá hạn;
- tính toán và lập hồ sơ phạt qua ranh giới API liên kết sản xuất;
- xem báo cáo mượn sách;
- khôi phục từ các lỗi xác thực, vai trò, API và kết nối thông thường.

Ảnh chụp màn hình có thể được chụp từ môi trường Playwright cục bộ xác định hoặc triển khai giai
đoạn cuối. Chúng chỉ được chứa dữ liệu tổng hợp và không được hiển thị mật khẩu, mã thông báo, nội
dung thông báo, chuỗi kết nối hoặc nội dung `.env` cục bộ.

## 6. Hợp đồng môi trường

Các mẫu được theo dõi chỉ chứa phần giữ chỗ:

```text
backend/.env.example
frontend/.env.example
```

Cài đặt môi trường tiền sản xuất máy chủ bắt buộc:

```text
NODE_ENV=production
PORT=8080
JWT_SECRET=<App Service secret>
DB_SERVER=<azure-sql-server>.database.windows.net
DB_NAME=LibraryManagementStaging
DB_USER=<App Service secret>
DB_PASSWORD=<App Service secret>
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
CORS_ORIGINS=https://<static-web-app-host>
FRONTEND_BASE_URL=https://<static-web-app-host>
```

Các biến SMTP tùy chọn không được đặt trừ khi nhóm định cấu hình nhà cung cấp thư theo giai đoạn. Sự
vắng mặt của SMTP không được coi là gửi email thành công.

Cài đặt xây dựng giao diện người dùng bắt buộc:

```text
VITE_API_BASE_URL=https://<app-service-host>/api
```

Không có giá trị môi trường được cam kết. Bí mật triển khai GitHub tồn tại trong Môi trường
`staging` được bảo vệ; bí mật thời gian chạy nằm trong cấu hình App Service.

## 7. Triển khai cơ sở dữ liệu

`database/Librarymanagement.sql` vẫn là nguồn lược đồ. Việc khởi tạo cơ sở dữ liệu theo giai đoạn
đầu tiên là một hành động rõ ràng của người vận hành thông qua Trình soạn thảo truy vấn Azure, SSMS
hoặc `sqlcmd` sau khi máy chủ đích và cơ sở dữ liệu được xác nhận.

Lan có thể:

- CI không tự động thực thi lược đồ SQL.
- Người vận hành ghi lại máy chủ đích và tên cơ sở dữ liệu trước khi thực hiện.
- Nhà điều hành xem xét khác biệt SQL và xác nhận không có cơ sở dữ liệu sản xuất/chia sẻ nào được chọn.
- Chỉ các tài khoản và dữ liệu môi trường tiền sản xuất tổng hợp mới được sử dụng.
- Thông tin xác thực cơ sở dữ liệu được nhập tương tác hoặc được lưu trữ trong cấu hình Azure, không bao giờ có trong Git.
- Truy cập tường lửa Azure SQL bị giới hạn ở các địa chỉ gửi đi App Service và địa chỉ của nhà điều hành
  địa chỉ hành chính tạm thời; không có quy tắc toàn Internet vĩnh viễn nào được chấp nhận.
- Bằng chứng triển khai ghi lại quá trình khởi tạo lược đồ và kiểm tra kết nối chỉ đọc, không phải
  các giá trị thông tin xác thực.

## 8. Thiết kế CI/CD

Thêm `.github/workflows/deploy-staging.yml` bằng trình kích hoạt `workflow_dispatch` thủ công. Việc
triển khai tự động từ mỗi lần đẩy được trì hoãn có chủ ý cho đến khi lần triển khai giai đoạn đầu
tiên được xác minh.

Công việc đường ống:

1. `quality-gate`
   - cài đặt các phụ thuộc gốc, máy chủ và giao diện người dùng;
   - chạy kiểm thử máy chủ và ngưỡng bảo hiểm;
   - chạy kiểm thử giao diện người dùng, tìm lỗi mã nguồn và xây dựng;
   - tiến hành thực thi truy vết.
2. `deploy-backend`
   - triển khai gói `backend/` cho App Service có tên bằng cách sử dụng hồ sơ xuất bản trong phạm vi ứng dụng web
     được lưu trữ trong Môi trường GitHub `staging`;
   - dựa vào tự động hóa xây dựng App Service để cài đặt các phần phụ thuộc sản xuất;
   - không bao gồm `.env`, các kiểm thử, mức độ bao phủ, nội dung tải lên hoặc các tạo phẩm cục bộ.
3. `deploy-frontend`
   - xây dựng `frontend/` với dàn API URL;
   - triển khai `frontend/dist` bằng mã thông báo triển khai Static Web Apps được lưu trữ trong GitHub
     Môi trường `staging`.
4. `smoke-test`
   - chỉ chạy sau khi cả hai lần triển khai đều thành công;
   - gọi giao diện người dùng môi trường tiền sản xuất và URL API bằng cách sử dụng tập lệnh kiểm thử nhanh của kho lưu trữ;
   - quy trình làm việc không thành công trên giao diện người dùng không khả dụng, API không lành mạnh, phản hồi CORS dễ dãi hoặc
     điểm cuối được bảo vệ không từ chối yêu cầu không được xác thực.

Quy trình sử dụng thông tin xác thực triển khai ở phạm vi tối thiểu và không in giá trị bí mật.

## 9. Giao diện kiểm thử nhanh

Thêm tập lệnh Node.js bằng lệnh này:

```powershell
$env:STAGING_FRONTEND_URL='https://<static-web-app-host>'
$env:STAGING_API_URL='https://<app-service-host>'
npm.cmd run smoke:staging
```

Kiểm tra:

1. Root giao diện người dùng trả về HTTP 200 và HTML.
2. `GET <api>/health` trả về HTTP 200 với `status: "ok"`.
3. Yêu cầu nguồn gốc được phép nhận được nguồn gốc CORS được định cấu hình chính xác.
4. Yêu cầu nguồn gốc không đáng tin cậy không nhận được tiêu đề nguồn gốc cho phép.
5. `GET <api>/api/auth/me` không có mã thông báo Bearer trả về HTTP 401.

Kịch bản chỉ đọc. Nó không tạo ra người dùng, lượt mượn, khoản phạt, thông báo hoặc báo cáo.

## 10. Xử lý lỗi và khôi phục

- Lỗi cổng chất lượng sẽ ngăn cản việc triển khai.
- Lỗi triển khai máy chủ ngăn cản việc kiểm thử nhanh và rời khỏi phiên bản App Service trước đó
  có sẵn thông qua lịch sử triển khai Azure.
- Lỗi triển khai giao diện người dùng không làm thay đổi cơ sở dữ liệu máy chủ đã định cấu hình.
- Lỗi kiểm thử nhanh đánh dấu quy trình làm việc không thành công và chặn bản ghi chấp nhận môi trường tiền sản xuất.
- hoàn tác triển khai lại cam kết Git tốt được biết đến cuối cùng; Việc khôi phục cơ sở dữ liệu là thủ công vì CI không
  lược đồ thao tác ghi.
- Nếu Azure đề xuất SKU không miễn phí hoặc chi phí ngoài tín dụng sinh viên, việc cung cấp sẽ dừng trước khi
  tài nguyên được tạo và quyết định chi phí sẽ được trả sách cho người dùng.

## 11. Chiến lược xác minh

Trước lần triển khai đầu tiên:

- chương trình máy chủ, phạm vi bảo hiểm, giao diện người dùng, bản dựng hiện có, tích hợp E2E, SQL, kiểm tra phụ thuộc và
  bằng chứng truy vết vẫn còn xanh;
- mẫu môi trường không chứa bí mật;
- các liên kết tài liệu và lệnh được xem xét từ quá trình kiểm tra rõ ràng;
- tập lệnh kiểm thử nhanh được chạy kiểm thử trên các thiết bị HTTP cục bộ;
- thay đổi quy trình làm việc vượt qua đánh giá cú pháp và `git diff --check`.

Sau khi triển khai:

- chạy tập lệnh kiểm thử nhanh môi trường tiền sản xuất tự động;
- thực hiện một lần đăng nhập của con người và kiểm tra trực quan luồng quan trọng bằng cách sử dụng dữ liệu môi trường tiền sản xuất tổng hợp;
- ghi lại giao diện người dùng URL, API URL, cam kết đã triển khai, dấu thời gian kiểm thử nhanh và kết quả đánh giá của con người;
- tiến hành buổi diễn tập thuyết trình kéo dài năm phút dựa trên sự môi trường tiền sản xuất, với địa phương xác định hiện có
  bằng chứng làm dự phòng.

## 12. Tiêu chí hoàn thành

Tuần 13 chỉ hoàn thành khi:

- hồ sơ chấp nhận sáu chức năng đã sẵn sàng và được con người xem xét;
- README, tài liệu kiến trúc, hướng dẫn triển khai và hướng dẫn sử dụng được cam kết;
- các mẫu môi trường được theo dõi mà không có thông tin xác thực;
- bí mật triển khai và môi trường môi trường tiền sản xuất GitHub được định cấu hình;
- Tài nguyên môi trường tiền sản xuất Azure Static Web Apps, App Service và Azure SQL tồn tại trong phạm vi tín dụng được phê duyệt;
- lược đồ cơ sở dữ liệu được khởi tạo dựa trên cơ sở dữ liệu môi trường tiền sản xuất đã được xác nhận;
- GitHub Actions triển khai thành công commit đã chọn;
- tập lệnh kiểm thử nhanh đi ngược lại các URL môi trường tiền sản xuất công khai;
- bằng chứng môi trường tiền sản xuất ghi lại URL, cam kết, kết quả kiểm tra, giới hạn và hướng dẫn khôi phục.
