# Thiết kế Lô 1 — Củng cố kiểm toán và xác thực

**Ngày:** 2026-08-01

**mốc cơ sở:** `main@2abd87b36e418ba1d1ad3d529ea864eed8f606cf`

**Mẻ:** `AUDIT-HARDENING-2026-08-01`

**Nhánh/cây làm việc Git:** `codex/audit-hardening` tại `.worktrees/audit-hardening`

**Phương thức:** SDD đầy đủ cho lõi, luồng nhanh Hybrid H1/H2/H3, TDD RED-GREEN

**Trạng thái:** Hướng xử lý đã được người dùng phê duyệt bằng “duyệt”; hợp đồng H1 viết dưới đây đang chờ người dùng rà soát trước khi lập kế hoạch triển khai.

## 1. Kết quả cần đạt

Lô 1 sửa hai nhóm sai lệch có tác động trực tiếp tới tính toàn vẹn và bảo mật:

1. Mọi thao tác tạo, đổi tên và vô hiệu hóa tác giả/nhà xuất bản/thể loại do Quản trị viên thực hiện phải ghi tác nhân và kiểm toán trong cùng giao dịch SQL; cập nhật ID không tồn tại không được trả thành công giả.
2. Cấu hình và luồng xác thực không được hạ chi phí bcrypt trong thời gian chạy ngoài kiểm thử, không được trả OTP qua HTTP, phải bảo vệ mọi API mang mã thông báo bằng HTTPS trong sản xuất, đồng thời phải ghi kiểm toán và hoàn tác nguyên tử đối với hai chuyển đổi trạng thái phiên quan trọng: đăng nhập thành công và đăng xuất.

Lô không đổi lược đồ, không thêm phụ thuộc, không thêm điểm cuối, không đổi vai trò và không đổi
cấu trúc phản hồi thành công hiện có ngoài việc loại bỏ trường gỡ lỗi vốn bị cấm.

## 2. Nguồn chuẩn và bằng chứng sai lệch

### 2.1 Nguồn chuẩn

- `.sdd/constitution.md`, mục 4: hành động Quản trị viên ảnh hưởng tới sách phải được ghi kiểm toán.
- `.sdd/shared_context.md`, `BR-GEN-010`: hành động quản trị quan trọng phải được ghi nhật ký.
- FE05 `NFR-FE05-TXN-001`, `NFR-FE05-LOG-001`: thao tác ghi và audit cùng thành công/hoàn tác; thao tác thêm, cập nhật và vô hiệu hóa phải truy vết được.
- FE05 mục 11.1 và FE11 `BR-FE11-033`, `FR-FE11-043`: chỉ `ADMIN` được thay đổi tác giả/nhà xuất bản/thể loại qua `/api/admin/library/*`.
- FE02 `BR-FE02-005`, `NFR-FE02-SEC-001`, `NFR-FE02-PERF-003`: bcrypt cost tối thiểu 10.
- FE02 `BR-FE02-016`, `NFR-FE02-LOG-001/002`: đăng nhập và đăng xuất phải được audit.
- FE02 `BR-FE02-017`, `NFR-FE02-SEC-003`: thông tin đăng nhập, mật khẩu và token chỉ được truyền qua HTTPS.
- FE02 `BR-FE02-020`, `NFR-FE02-SEC-015`: OTP không được xuất hiện trong phản hồi HTTP, kể cả môi trường kiểm thử/dev.
- FE02 `NFR-FE02-TXN-002`: đăng nhập và tạo session/token phải nguyên tử.

### 2.2 Sai lệch đã xác nhận trên mốc cơ sở

- `adminController` không truyền `userId`, IP hoặc người dùng-agent vào ba thao tác ghi siêu dữ liệu.
- `adminService` gọi thẳng kho mã nguồn, không có giao dịch hoặc audit.
- `adminRepository.updateResource` không kiểm tra số hàng bị ảnh hưởng và luôn trả `{ id, name }`.
- `authService.writeAudit` nuốt lỗi khi không có `required`; `AUTH_LOGIN_SUCCESS` và `AUTH_LOGOUT` đang dùng chế độ này.
- `BCRYPT_COST` chấp nhận mọi số hữu hạn.
- `requestChangePasswordOtp` có thể thêm `debugOtp` vào phản hồi.
- phần mềm trung gian HTTPS chỉ kiểm tra `/api/auth/*`, trong khi bearer token đi qua các điểm cuối `/api/*` được bảo vệ.

## 3. Quyết định kiến trúc

Triển khai theo hai lát cắt nối tiếp trong cùng lô 1:

1. **Phần A — Tính chính xác của siêu dữ liệu danh mục của quản trị viên + kiểm tra nguyên tử.**
2. **phần việc B — xác thực thời gian chạy, transport và session-audit hardening.**

Chỉ một Builder được sửa các tệp lõi dùng chung. Không chạy lane chỉnh sửa song song trên
`adminService`, `authService`, `env.js`, phần mềm trung gian hoặc kho mã nguồn. phần việc B chỉ bắt
đầu khi phần việc A đạt kiểm thử tập trung.

Các thay đổi SDD dùng để kích hoạt Nhiệm vụ được chuẩn bị thành khác biệt quản trị riêng và phải tới
`main` qua rà soát/kiểm tra/H3 trước khi quyền triển khai sản phẩm của H1 được sử dụng. mã nguồn sản
phẩm không được bắt đầu chỉ dựa trên tài liệu thiết kế này. Không đẩy lên kho từ xa, mở PR hoặc hợp
nhất mã nguồn sản phẩm trước các cổng H2/H3 tương ứng.

## 4. Phần việc A — Siêu dữ liệu quản trị và kiểm toán nguyên tử

### 4.1 Hợp đồng API

| Thao tác | Thành công | Không tồn tại/không còn đang hoạt động | Ghi chú |
| --- | --- | --- | --- |
| `POST /api/admin/library/:resource` | Giữ `201` và envelope hiện có | Không áp dụng | thao tác ghi và audit bản ghi Git cùng nhau. |
| `PUT /api/admin/library/:resource/:id` | Giữ `200` và envelope hiện có | `404 ADMIN_RESOURCE_ITEM_NOT_FOUND` | Không còn trả thành công giả. |
| `PATCH /api/admin/library/:resource/:id/deactivate` | Giữ `200` và envelope hiện có | `404 ADMIN_RESOURCE_ITEM_NOT_FOUND` | Giữ soft-vô hiệu hóa, không xóa vật lý. |

`resource` tiếp tục chỉ nhận `authors`, `publishers`, `categories`. Quyền tiếp tục là `ADMIN` duy
nhất; không mở rộng cho `LIBRARIAN`, `MEMBER` hoặc khách.

### 4.2 Ngữ cảnh tác nhân

Controller truyền ngữ cảnh tối thiểu vào service:

```text
actorId = req.user.userId
ip = req.ip
userAgent = req.get('user-agent')
```

Không nhận tác nhân từ body/truy vấn. phần mềm trung gian xác thực và phép chiếu một vai trò hiện
tại vẫn là nguồn duy nhất của tác nhân.

### 4.3 Ranh giới giao dịch

Mỗi lệnh chạy theo một giao dịch SQL:

```text
begin
  mutate Authors/Publishers/Categories bằng query tham số hóa
  nếu không có hàng mục tiêu: throw 404
  insert AuditLogs với cùng transaction
commit
```

Nếu thao tác ghi, kiểm tra tồn tại hoặc kiểm toán lỗi thì hoàn tác toàn bộ. Lỗi cơ sở dữ liệu không an
toàn được phần mềm trung gian xử lý lỗi ánh xạ thành `500 INTERNAL_ERROR`, không trả nội dung SQL,
bộ công nghệ hoặc dấu vết nội bộ.

Kho dữ liệu siêu dữ liệu nhận giao dịch tùy chọn và dùng `new sql.Request(transaction)` khi có.
`adminRepository.withTransaction(work)` là hàm hỗ trợ cục bộ nhỏ nhất; không tạo lớp trừu tượng giao dịch
dùng chung mới trong lô này.

### 4.4 Hợp đồng kiểm toán

| thao tác ghi | `action` | `targetType` | `targetId` | siêu dữ liệu được phép |
| --- | --- | --- | --- | --- |
| Tạo | `CATALOG_METADATA_CREATE` | `AUTHOR`, `PUBLISHER` hoặc `CATEGORY` | ID vừa tạo | `{ resource }` |
| Đổi tên | `CATALOG_METADATA_UPDATE` | Như trên | ID mục tiêu | `{ resource, changedFields: ['name'] }` |
| Vô hiệu hóa | `CATALOG_METADATA_DEACTIVATE` | Như trên | ID mục tiêu | `{ resource, newStatus: 'INACTIVE' }` |

Audit luôn chứa `userId`, IP và người dùng-agent từ yêu cầu. Không ghi body thô, token, credential
hoặc dữ liệu ngoài danh sách cho phép. Phép chiếu audit FE11 bổ sung đúng ba hành động trên; hành
động không biết vẫn giữ default-deny `{}`.

### 4.5 Kiểm thử RED-GREEN

RED phải chứng minh:

- Controller truyền đúng tác nhân/IP/người dùng-agent cho cả ba thao tác ghi.
- Tạo/cập nhật/vô hiệu hóa ghi đúng hành động, target và siêu dữ liệu danh sách cho phép.
- Audit insert lỗi làm hoàn tác thao tác ghi.
- `PUT` ID không tồn tại trả `404 ADMIN_RESOURCE_ITEM_NOT_FOUND` và không ghi audit.
- vô hiệu hóa ID không tồn tại/đã không hoạt động vẫn trả `404` và không audit thành công.
- truy vấn thao tác ghi dùng giao dịch và tham số; không dùng chuỗi đầu vào làm tên bảng ngoài danh sách cho phép hiện có.
- Audit API chỉ chiếu các chi tiết danh sách cho phép mới, không chiếu siêu dữ liệu tùy ý.

GREEN chỉ sửa lượng mã nguồn tối thiểu cần để các kiểm thử trên đạt.

## 5. phần việc B — Củng cố xác thực

### 5.1 Cấu hình bcrypt từ chối sớm khi không hợp lệ

`BCRYPT_COST` phải là số nguyên dương. Quy tắc thời gian chạy:

- Nếu không đặt: dùng `10`.
- Nếu `NODE_ENV !== 'test'`: chỉ chấp nhận số nguyên `>= 10`; giá trị thấp hơn, phân số, âm hoặc không phải số làm tiến trình từ chối sớm khi tải cấu hình.
- Nếu `NODE_ENV === 'test'`: cho phép số nguyên `>= 4` để dữ liệu kiểm thử chạy nhanh. Ngoại lệ này không thay đổi hợp đồng băm ở môi trường sản xuất và phải có kiểm thử chứng minh sản xuất vẫn từ chối `4`.

Không bổ sung biến bỏ qua mới cho môi trường sản xuất.

### 5.2 Không OTP trong phản hồi HTTP

Loại bỏ `exposeDebugTokens`, `AUTH_EXPOSE_TEST_TOKENS` và nhánh gắn `debugOtp` vào phản hồi. Phản
hồi `request-change-password-otp` chỉ còn:

```json
{
  "message": "OTP đã được gửi đến email của bạn.",
  "maskedEmail": "..."
}
```

Kiểm thử lấy OTP qua `otpGenerator` được inject hoặc bộ nhớ của fake email/requester; không đọc OTP
từ phản hồi. Không log OTP trong lúc sửa kiểm thử.

### 5.3 HTTPS cho API mang thông tin xác thực/mã thông báo

Khi `ENFORCE_HTTPS=true` hoặc `NODE_ENV=production`, phần mềm trung gian áp dụng cho toàn bộ đường
dẫn `/api/`, không chỉ `/api/auth/`.

- yêu cầu HTTPS trực tiếp được đi tiếp.
- Khi `TRUST_PROXY=true`, chỉ protocol đầu tiên trong `X-Forwarded-Proto` được dùng như hành vi hiện có; cấu hình Azure App Service tiếp tục tương thích.
- HTTP được redirect `308` chỉ khi `HTTPS_REDIRECT=true` và `HTTPS_CANONICAL_HOST` vượt danh sách cho phép hiện có; ngược lại trả `400 HTTPS_REQUIRED`.
- `/`, `/health`, `/health/ready` và static assets không thuộc phần mềm trung gian cổng này để giữ probe/deployment hợp đồng.
- Thông báo an toàn đổi từ “xác thực requests” sang “API requests”; mã lỗi giữ `HTTPS_REQUIRED`.

Không tin `Host` do client gửi để dựng redirect.

### 5.4 Đăng nhập thành công: phiên và kiểm toán trong cùng giao dịch

Sau khi credential đã hợp lệ:

```text
begin
đặt lại trạng thái đăng nhập thất bại + đặt LastLoginAt
tạo mã thông báo REFRESH đã băm
  insert AUTH_LOGIN_SUCCESS (required) bằng cùng transaction
commit
issue signed access token và trả response
```

Nếu audit lỗi, giao dịch hoàn tác trạng thái đăng nhập và refresh token; yêu cầu trả `500
INTERNAL_ERROR`. Không có refresh token hoạt động hoặc audit thành công một phần.

`AUTH_LOGIN_ATTEMPT`, các nhánh thất bại, khóa và tự mở khóa vẫn giữ hành vi audit hiện tại trong
lô 1. Việc biến toàn bộ các nhánh đó thành giao dịch/không đạt-closed đòi hỏi thay đổi
`recordFailedLogin` và concurrency hợp đồng riêng; đây là rủi ro còn lại, không được tuyên bố đã
giải quyết bởi lô này.

### 5.5 Đăng xuất: thu hồi và kiểm toán trong cùng giao dịch

đăng xuất tiếp tục idempotent và trả `200 { message: 'Logged out' }` kể cả refresh token không còn
đang hoạt động.

```text
tìm mã thông báo làm mới đang hoạt động theo giá trị băm
begin
  nếu tìm thấy: revoke token bằng cùng transaction
  insert AUTH_LOGOUT (required) bằng cùng transaction
commit
```

tác nhân/target ưu tiên `context.userId`, sau đó `tokenRecord.userId`, cuối cùng `null`. Nếu audit
lỗi, revoke hoàn tác và yêu cầu trả `500 INTERNAL_ERROR`. `authTokenRepository.revokeToken` nhận
giao dịch tùy chọn; không đổi lược đồ hay thuật toán hash token.

### 5.6 Kiểm thử RED-GREEN

RED phải chứng minh:

- Môi trường sản xuất từ chối `BCRYPT_COST=4`, phân số và giá trị không hợp lệ; môi trường kiểm thử chấp nhận `4`; mặc định vẫn là `10`.
- `debugOtp` không xuất hiện kể cả khi máy khách/kiểm thử đặt biến kế thừa hoặc truyền tùy chọn kế thừa.
- HTTP tới một điểm cuối `/api/*` ngoài xác thực bị chặn trước bộ điều khiển; HTTPS qua proxy tin cậy được đi tiếp; kiểm tra tình trạng HTTP vẫn hoạt động.
- Lỗi kiểm toán khi đăng nhập thành công làm hoàn tác mã làm mới và việc cập nhật `LastLoginAt`/đặt lại số lần đăng nhập thất bại.
- Lỗi kiểm toán khi đăng xuất làm hoàn tác việc thu hồi.
- Đăng nhập/đăng xuất thành công ghi hành động, tác nhân, mục tiêu, IP và tác nhân người dùng đúng một lần.
- Đăng xuất khi không có mã thông báo vẫn lũy đẳng và ghi kiểm toán bắt buộc.
- Phản hồi lỗi do kiểm toán thất bại là `500 INTERNAL_ERROR`, không lộ thông báo cơ sở dữ liệu.

## 6. SDD và tệp quyền sở hữu

### 6.1 Quản trị cần cập nhật trong kế hoạch triển khai

- FE05: làm rõ thao tác ghi dữ liệu tham chiếu cũng chịu `NFR-FE05-TXN-001`/`NFR-FE05-LOG-001`; thêm Nhiệm vụ khắc phục và changelog.
- FE11: ghi hợp đồng hành động/mục tiêu kiểm toán cho ranh giới `/api/admin/library/*`; thêm Nhiệm vụ khắc phục và nhật ký thay đổi.
- FE02: làm rõ HTTPS `/api/*` vì mã thông báo truy cập đi qua các API được bảo vệ; thêm Nhiệm vụ cho bcrypt/OTP/kiểm toán phiên và nhật ký thay đổi.

Các sửa đổi dự kiến nằm trong:

```text
.sdd/specs/feat-book-management/SPEC.md
.sdd/specs/feat-book-management/PLAN.md
.sdd/specs/feat-book-management/TASKS.md
.sdd/specs/feat-book-management/CHANGELOG.md
.sdd/specs/feat-user-role-management/SPEC.md
.sdd/specs/feat-user-role-management/PLAN.md
.sdd/specs/feat-user-role-management/TASKS.md
.sdd/specs/feat-user-role-management/CHANGELOG.md
.sdd/specs/feat-auth/SPEC.md
.sdd/specs/feat-auth/PLAN.md
.sdd/specs/feat-auth/TASKS.md
.sdd/specs/feat-auth/CHANGELOG.md
```

Không đổi tổng số vai trò, điểm cuối hoặc lược đồ trong các SPEC.

### 6.2 tệp sản phẩm dự kiến

```text
backend/src/controllers/adminController.js
backend/src/services/adminService.js
backend/src/repositories/adminRepository.js
backend/src/services/authService.js
backend/src/repositories/authTokenRepository.js
backend/src/config/env.js
backend/src/middleware/httpsEnforcement.js
backend/tests/adminCatalogMetadataRepository.test.js
backend/tests/adminPermissionService.test.js
backend/tests/adminAuditLogService.test.js
backend/tests/authRoutes.test.js
backend/tests/envConfig.test.js
backend/tests/httpsEnforcement.test.js
backend/tests/helpers/inMemoryAuthRepositories.js
```

Có thể tạo một kiểm thử service/tuyến siêu dữ liệu chuyên biệt nếu việc nhồi assertion vào kiểm thử
hiện có làm
giảm khả năng đọc. Không sửa giao diện vì hợp đồng phản hồi thành công và điểm cuối không đổi.

## 7. Cổng xác thực

### L1 — Kiểm thử tập trung theo phần việc

```powershell
npm --prefix backend test -- --runTestsByPath tests/adminCatalogMetadataRepository.test.js tests/adminPermissionService.test.js tests/adminAuditLogService.test.js
npm --prefix backend test -- --runTestsByPath tests/authRoutes.test.js tests/envConfig.test.js tests/httpsEnforcement.test.js
```

Nếu thêm kiểm thử siêu dữ liệu chuyên biệt, tệp đó phải nằm trong lệnh L1.

### L2 — Hồi quy máy chủ

```powershell
npm --prefix backend test
npm --prefix backend run test:coverage:ci
```

### L3 — quản trị và an toàn kho mã nguồn

```powershell
npm run trace:enforce
npm run test:secrets
git diff --check
```

Không giảm coverage threshold và không loại tệp/kiểm thử để làm cổng xanh.

### L4 — Tích hợp quan sát được

```powershell
npm run test:system
npm run test:e2e
npm run test:deployment
```

Không chạy SQL thao tác ghi vào Azure môi trường tiền sản xuất/production. lô 1 không thêm job SQL CI
và không thay di chuyển dữ liệu.

## 8. Cổng H1/H2/H3

### H1 — Hợp đồng lô

Người dùng phê duyệt tài liệu này sẽ cho phép:

- lập kế hoạch triển khai chi tiết;
- chuẩn bị khác biệt quản trị kích hoạt Nhiệm vụ trong đúng tệp đã liệt kê;
- sau khi quản trị activation PR đã qua H2/H3 và hợp nhất vào `main`, viết kiểm thử RED rồi triển khai GREEN chưa bản ghi Git trong hai phần việc;
- chạy các cổng tương ứng trong cây làm việc Git đã chỉ định.

H1 không cho phép tự động bản ghi Git/đẩy lên kho từ xa/PR/hợp nhất mã nguồn sản phẩm. Vì tài liệu
này mô tả hợp đồng nhưng chưa chứa chính xác line khác biệt của quản trị activation, khác biệt quản
trị thực tế vẫn phải qua rà soát H2 riêng trước khi ghi nhận thay đổi vào Git.

### H2 — rà soát cục bộ trước khi ghi nhận thay đổi vào Git

lô có hai lần H2 tách biệt:

1. **H2-G (quản trị activation):** rà soát khác biệt chỉ gồm SPEC/PLAN/TASKS/CHANGELOG. Sau H2-G mới được bản ghi Git/đẩy lên kho từ xa PR tài liệu; PR này vẫn cần kiểm tra và H3-G trước hợp nhất. Product RED-GREEN chỉ bắt đầu sau khi activation tới `main` và cây làm việc Git được cập nhật an toàn.
2. **H2-P (product):** rà soát khác biệt kiểm thử + mã nguồn của hai phần việc sau khi quản trị đã được kích hoạt.

H2-P chỉ được yêu cầu khi:

- khác biệt kiểm thử + mã nguồn của lô 1 hoàn chỉnh và không lẫn quản trị chưa rà soát;
- L1-L4 có bằng chứng mới trên cây làm việc Git;
- không còn thay đổi ngoài danh sách tệp hoặc thay đổi ngoài phạm vi;
- rà soát bảo mật xác nhận không lộ secret/OTP và hoàn tác đúng.

H2-P mới cho phép ghi nhận vào Git bộ thay đổi sản phẩm đã rà soát và chuẩn bị PR theo luồng nhanh.

### H3 — rà soát tích hợp

Mỗi PR có H3 riêng. H3-G áp dụng cho kích hoạt quản trị; H3-P áp dụng cho sản phẩm. H3 xảy ra sau
các kiểm tra bắt buộc của PR, kiểm tra chính xác đầu nhánh, khả năng hợp nhất và khác biệt cuối. Chỉ H3 tương
ứng mới có thể cho phép hợp nhất. Thẻ phát hành, đổi bảo vệ nhánh, bật quét bí mật GitHub
hoặc sửa cấu hình Azure không nằm trong quyền của lô này.

## 9. Quy tắc dừng và giới hạn

Dừng ngay và xin quyết định mới nếu phát hiện:

- cần đổi lược đồ hoặc di chuyển dữ liệu;
- cần đổi điểm cuối, vai trò, phản hồi thành công ngoài hợp đồng trên;
- cần làm yếu HTTPS, bcrypt, kiểm toán hoặc che lỗi để giữ kiểm thử cũ;
- giao dịch mới xung đột với hợp đồng đồng thời/khóa hiện có;
- kiểm thử SQL chỉ có thể chạy bằng cách ghi vào môi trường tiền sản xuất/sản xuất;
- tệp lõi cùng phạm vi bị thay đổi bởi cây làm việc Git/nhánh khác;
- một lỗi xác định vẫn lặp lại sau ba lần sửa, hoặc lỗi E2E không ổn định lặp lại sau một lần chạy lại có bằng chứng.

## 10. Ngoài phạm vi lô 1

Các phát hiện sau thuộc lô 2 riêng và chưa được H1 này cấp quyền:

- đối soát câu chữ mâu thuẫn FE04/FE08 về `MEMBER` đang hoạt động và tier 3/5;
- mở rộng độ bao phủ của cổng sang quản trị/xác thực và các mô-đun còn thiếu;
- thiết kế SQL CI trên cơ sở dữ liệu dùng một lần (hiện FE05 `NFR-FE05-DEP-001` nói CI không kết nối cơ sở dữ liệu, nên thay đổi này cần hợp đồng hạ tầng riêng);
- thay móc đồng bộ E2E bằng luồng SQL thật;
- cập nhật README/kế hoạch/phát hành tag và số liệu phát hành;
- thay bảo vệ nhánh, số lượt rà soát bắt buộc hoặc cài đặt quét bí mật GitHub;
- chuyển mọi sự kiện kiểm toán đăng nhập thất bại/khóa/tự mở khóa sang giao dịch từ chối mặc định khi lỗi.

Lô 2 phải có thiết kế/H1 riêng sau khi Lô 1 hoàn tất hoặc được đóng rõ ràng.
