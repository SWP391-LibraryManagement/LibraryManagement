# Thiết kế Batch 1 — Củng cố audit và xác thực

**Ngày:** 2026-08-01

**Baseline:** `main@2abd87b36e418ba1d1ad3d529ea864eed8f606cf`

**Batch:** `AUDIT-HARDENING-2026-08-01`

**Nhánh/worktree:** `codex/audit-hardening` tại `.worktrees/audit-hardening`

**Phương thức:** SDD đầy đủ cho Core, Fast-Track Hybrid H1/H2/H3, TDD RED-GREEN

**Trạng thái:** Hướng xử lý đã được người dùng phê duyệt bằng “duyệt”; hợp đồng H1 viết dưới đây đang chờ người dùng rà soát trước khi lập kế hoạch triển khai.

## 1. Kết quả cần đạt

Batch 1 sửa hai nhóm sai lệch có tác động trực tiếp tới tính toàn vẹn và bảo mật:

1. Mọi thao tác tạo, đổi tên và vô hiệu hóa tác giả/nhà xuất bản/thể loại do Quản trị viên thực hiện phải ghi được tác nhân và audit trong cùng giao dịch SQL; cập nhật ID không tồn tại không được trả thành công giả.
2. Cấu hình và luồng xác thực không được hạ chi phí bcrypt trong runtime ngoài kiểm thử, không được trả OTP qua HTTP, phải bảo vệ mọi API mang token bằng HTTPS trong production, và phải commit/rollback nguyên tử audit với hai chuyển đổi trạng thái phiên quan trọng là đăng nhập thành công và đăng xuất.

Batch không đổi schema, không thêm dependency, không thêm endpoint, không đổi vai trò và không đổi hình dạng phản hồi thành công hiện có ngoài việc loại bỏ trường debug vốn bị cấm.

## 2. Nguồn chuẩn và bằng chứng sai lệch

### 2.1 Nguồn chuẩn

- `.sdd/constitution.md`, mục 4: hành động Quản trị viên ảnh hưởng tới sách phải được ghi audit.
- `.sdd/shared_context.md`, `BR-GEN-010`: hành động quản trị quan trọng phải được ghi nhật ký.
- FE05 `NFR-FE05-TXN-001`, `NFR-FE05-LOG-001`: mutation và audit cùng thành công/rollback; thao tác thêm, cập nhật và vô hiệu hóa phải truy vết được.
- FE05 mục 11.1 và FE11 `BR-FE11-033`, `FR-FE11-043`: chỉ `ADMIN` được thay đổi tác giả/nhà xuất bản/thể loại qua `/api/admin/library/*`.
- FE02 `BR-FE02-005`, `NFR-FE02-SEC-001`, `NFR-FE02-PERF-003`: bcrypt cost tối thiểu 10.
- FE02 `BR-FE02-016`, `NFR-FE02-LOG-001/002`: đăng nhập và đăng xuất phải được audit.
- FE02 `BR-FE02-017`, `NFR-FE02-SEC-003`: thông tin đăng nhập, mật khẩu và token chỉ được truyền qua HTTPS.
- FE02 `BR-FE02-020`, `NFR-FE02-SEC-015`: OTP không được xuất hiện trong phản hồi HTTP, kể cả môi trường test/dev.
- FE02 `NFR-FE02-TXN-002`: đăng nhập và tạo session/token phải nguyên tử.

### 2.2 Sai lệch đã xác nhận trên baseline

- `adminController` không truyền `userId`, IP hoặc user-agent vào ba mutation metadata.
- `adminService` gọi thẳng repository, không có transaction hoặc audit.
- `adminRepository.updateResource` không kiểm tra số hàng bị ảnh hưởng và luôn trả `{ id, name }`.
- `authService.writeAudit` nuốt lỗi khi không có `required`; `AUTH_LOGIN_SUCCESS` và `AUTH_LOGOUT` đang dùng chế độ này.
- `BCRYPT_COST` chấp nhận mọi số hữu hạn.
- `requestChangePasswordOtp` có thể thêm `debugOtp` vào phản hồi.
- middleware HTTPS chỉ kiểm tra `/api/auth/*`, trong khi bearer token đi qua các endpoint `/api/*` được bảo vệ.

## 3. Quyết định kiến trúc

Triển khai theo hai lát cắt nối tiếp trong cùng Batch 1:

1. **Slice A — Admin catalog metadata correctness + atomic audit.**
2. **Slice B — Auth runtime, transport và session-audit hardening.**

Chỉ một Builder được sửa các file Core dùng chung. Không chạy lane chỉnh sửa song song trên `adminService`, `authService`, `env.js`, middleware hoặc repository. Slice B chỉ bắt đầu khi Slice A đạt kiểm thử tập trung.

Các thay đổi SDD dùng để kích hoạt task được chuẩn bị thành diff governance riêng và phải tới `main` qua review/check/H3 trước khi quyền triển khai sản phẩm của H1 được sử dụng. Code sản phẩm không được bắt đầu chỉ dựa trên tài liệu thiết kế này. Không push, mở PR hoặc merge code sản phẩm trước các cổng H2/H3 tương ứng.

## 4. Slice A — Metadata Quản trị và audit nguyên tử

### 4.1 Hợp đồng API

| Thao tác | Thành công | Không tồn tại/không còn active | Ghi chú |
| --- | --- | --- | --- |
| `POST /api/admin/library/:resource` | Giữ `201` và envelope hiện có | Không áp dụng | Mutation và audit commit cùng nhau. |
| `PUT /api/admin/library/:resource/:id` | Giữ `200` và envelope hiện có | `404 ADMIN_RESOURCE_ITEM_NOT_FOUND` | Không còn trả thành công giả. |
| `PATCH /api/admin/library/:resource/:id/deactivate` | Giữ `200` và envelope hiện có | `404 ADMIN_RESOURCE_ITEM_NOT_FOUND` | Giữ soft-deactivate, không xóa vật lý. |

`resource` tiếp tục chỉ nhận `authors`, `publishers`, `categories`. Quyền tiếp tục là `ADMIN` duy nhất; không mở rộng cho `LIBRARIAN`, `MEMBER` hoặc Guest.

### 4.2 Ngữ cảnh tác nhân

Controller truyền ngữ cảnh tối thiểu vào service:

```text
actorId = req.user.userId
ip = req.ip
userAgent = req.get('user-agent')
```

Không nhận actor từ body/query. Middleware xác thực và phép chiếu một vai trò hiện tại vẫn là nguồn duy nhất của actor.

### 4.3 Ranh giới giao dịch

Mỗi lệnh chạy theo một transaction SQL:

```text
begin
  mutate Authors/Publishers/Categories bằng query tham số hóa
  nếu không có hàng mục tiêu: throw 404
  insert AuditLogs với cùng transaction
commit
```

Nếu mutation, kiểm tra tồn tại hoặc audit lỗi thì rollback toàn bộ. Lỗi DB không an toàn được error middleware ánh xạ thành `500 INTERNAL_ERROR`, không trả nội dung SQL/stack trace.

Repository metadata nhận transaction tùy chọn và dùng `new sql.Request(transaction)` khi có. `adminRepository.withTransaction(work)` là helper cục bộ nhỏ nhất; không tạo abstraction transaction dùng chung mới trong batch này.

### 4.4 Hợp đồng audit

| Mutation | `action` | `targetType` | `targetId` | Metadata được phép |
| --- | --- | --- | --- | --- |
| Tạo | `CATALOG_METADATA_CREATE` | `AUTHOR`, `PUBLISHER` hoặc `CATEGORY` | ID vừa tạo | `{ resource }` |
| Đổi tên | `CATALOG_METADATA_UPDATE` | Như trên | ID mục tiêu | `{ resource, changedFields: ['name'] }` |
| Vô hiệu hóa | `CATALOG_METADATA_DEACTIVATE` | Như trên | ID mục tiêu | `{ resource, newStatus: 'INACTIVE' }` |

Audit luôn chứa `userId`, IP và user-agent từ request. Không ghi body thô, token, credential hoặc dữ liệu ngoài allowlist. Phép chiếu audit FE11 bổ sung đúng ba action trên; action không biết vẫn giữ default-deny `{}`.

### 4.5 Kiểm thử RED-GREEN

RED phải chứng minh:

- Controller truyền đúng actor/IP/user-agent cho cả ba mutation.
- Tạo/cập nhật/vô hiệu hóa ghi đúng action, target và metadata allowlist.
- Audit insert lỗi làm rollback mutation.
- `PUT` ID không tồn tại trả `404 ADMIN_RESOURCE_ITEM_NOT_FOUND` và không ghi audit.
- Deactivate ID không tồn tại/đã inactive vẫn trả `404` và không audit thành công.
- Query mutation dùng transaction và tham số; không dùng chuỗi đầu vào làm tên bảng ngoài allowlist hiện có.
- Audit API chỉ chiếu các chi tiết allowlist mới, không chiếu metadata tùy ý.

GREEN chỉ sửa lượng code tối thiểu cần để các kiểm thử trên đạt.

## 5. Slice B — Củng cố xác thực

### 5.1 Cấu hình bcrypt fail-fast

`BCRYPT_COST` phải là số nguyên dương. Quy tắc runtime:

- Nếu không đặt: dùng `10`.
- Nếu `NODE_ENV !== 'test'`: chỉ chấp nhận số nguyên `>= 10`; giá trị thấp hơn, phân số, âm hoặc không phải số làm tiến trình fail-fast khi tải cấu hình.
- Nếu `NODE_ENV === 'test'`: cho phép số nguyên `>= 4` để fixture/test chạy nhanh. Ngoại lệ này không thay đổi hợp đồng hash production và phải có test chứng minh production vẫn từ chối `4`.

Không bổ sung biến bypass production mới.

### 5.2 Không OTP trong phản hồi HTTP

Loại bỏ `exposeDebugTokens`, `AUTH_EXPOSE_TEST_TOKENS` và nhánh gắn `debugOtp` vào response. Phản hồi `request-change-password-otp` chỉ còn:

```json
{
  "message": "OTP đã được gửi đến email của bạn.",
  "maskedEmail": "..."
}
```

Kiểm thử lấy OTP qua `otpGenerator` được inject hoặc bộ nhớ của fake email/requester; không đọc OTP từ response. Không log OTP trong lúc sửa kiểm thử.

### 5.3 HTTPS cho API mang credential/token

Khi `ENFORCE_HTTPS=true` hoặc `NODE_ENV=production`, middleware áp dụng cho toàn bộ đường dẫn `/api/`, không chỉ `/api/auth/`.

- Request HTTPS trực tiếp được đi tiếp.
- Khi `TRUST_PROXY=true`, chỉ protocol đầu tiên trong `X-Forwarded-Proto` được dùng như hành vi hiện có; cấu hình Azure App Service tiếp tục tương thích.
- HTTP được redirect `308` chỉ khi `HTTPS_REDIRECT=true` và `HTTPS_CANONICAL_HOST` vượt allowlist hiện có; ngược lại trả `400 HTTPS_REQUIRED`.
- `/`, `/health`, `/health/ready` và static assets không thuộc middleware gate này để giữ probe/deployment contract.
- Thông báo an toàn đổi từ “authentication requests” sang “API requests”; mã lỗi giữ `HTTPS_REQUIRED`.

Không tin `Host` do client gửi để dựng redirect.

### 5.4 Đăng nhập thành công: session và audit cùng transaction

Sau khi credential đã hợp lệ:

```text
begin
  reset failed-login state + set LastLoginAt
  create hashed REFRESH token
  insert AUTH_LOGIN_SUCCESS (required) bằng cùng transaction
commit
issue signed access token và trả response
```

Nếu audit lỗi, transaction rollback trạng thái login và refresh token; request trả `500 INTERNAL_ERROR`. Không có refresh token hoạt động hoặc audit thành công một phần.

`AUTH_LOGIN_ATTEMPT`, các nhánh thất bại, khóa và tự mở khóa vẫn giữ hành vi audit hiện tại trong Batch 1. Việc biến toàn bộ các nhánh đó thành transaction/fail-closed đòi hỏi thay đổi `recordFailedLogin` và concurrency contract riêng; đây là rủi ro còn lại, không được tuyên bố đã giải quyết bởi batch này.

### 5.5 Đăng xuất: revoke và audit cùng transaction

Logout tiếp tục idempotent và trả `200 { message: 'Logged out' }` kể cả refresh token không còn active.

```text
find active refresh token by hash
begin
  nếu tìm thấy: revoke token bằng cùng transaction
  insert AUTH_LOGOUT (required) bằng cùng transaction
commit
```

Actor/target ưu tiên `context.userId`, sau đó `tokenRecord.userId`, cuối cùng `null`. Nếu audit lỗi, revoke rollback và request trả `500 INTERNAL_ERROR`. `authTokenRepository.revokeToken` nhận transaction tùy chọn; không đổi schema hay thuật toán hash token.

### 5.6 Kiểm thử RED-GREEN

RED phải chứng minh:

- Production từ chối `BCRYPT_COST=4`, phân số và giá trị không hợp lệ; test env chấp nhận `4`; mặc định vẫn là `10`.
- `debugOtp` không xuất hiện kể cả khi client/test đặt biến legacy hoặc truyền option legacy.
- HTTP tới một endpoint `/api/*` ngoài auth bị chặn trước controller; HTTPS qua trusted proxy được đi tiếp; health probe HTTP vẫn hoạt động.
- Audit lỗi ở đăng nhập thành công làm rollback refresh token và `LastLoginAt`/failed-login reset.
- Audit lỗi ở logout làm rollback revoke.
- Đăng nhập/đăng xuất thành công ghi action, actor, target, IP và user-agent đúng một lần.
- Logout với token vắng vẫn idempotent và ghi audit bắt buộc.
- Error response do lỗi audit là `500 INTERNAL_ERROR`, không lộ thông báo DB.

## 6. SDD và file ownership

### 6.1 Governance cần cập nhật trong kế hoạch triển khai

- FE05: làm rõ mutation dữ liệu tham chiếu cũng chịu `NFR-FE05-TXN-001`/`NFR-FE05-LOG-001`; thêm task remediation và changelog.
- FE11: ghi hợp đồng action/target audit cho ranh giới `/api/admin/library/*`; thêm task remediation và changelog.
- FE02: làm rõ HTTPS `/api/*` vì bearer token đi qua các API được bảo vệ; thêm task cho bcrypt/OTP/session-audit và changelog.

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

Không đổi tổng số vai trò, endpoint hoặc schema trong các SPEC.

### 6.2 File sản phẩm dự kiến

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

Có thể tạo một test service/route metadata chuyên biệt nếu việc nhồi assertion vào test hiện có làm giảm khả năng đọc. Không sửa frontend vì hợp đồng response thành công và endpoint không đổi.

## 7. Cổng xác thực

### L1 — Kiểm thử tập trung theo slice

```powershell
npm --prefix backend test -- --runTestsByPath tests/adminCatalogMetadataRepository.test.js tests/adminPermissionService.test.js tests/adminAuditLogService.test.js
npm --prefix backend test -- --runTestsByPath tests/authRoutes.test.js tests/envConfig.test.js tests/httpsEnforcement.test.js
```

Nếu thêm test metadata chuyên biệt, file đó phải nằm trong lệnh L1.

### L2 — Hồi quy backend

```powershell
npm --prefix backend test
npm --prefix backend run test:coverage:ci
```

### L3 — Governance và an toàn repository

```powershell
npm run trace:enforce
npm run test:secrets
git diff --check
```

Không giảm coverage threshold và không loại file/test để làm gate xanh.

### L4 — Tích hợp quan sát được

```powershell
npm run test:system
npm run test:e2e
npm run test:deployment
```

Không chạy SQL mutation vào Azure staging/production. Batch 1 không thêm job SQL CI và không thay migration.

## 8. Cổng H1/H2/H3

### H1 — Hợp đồng batch

Người dùng phê duyệt tài liệu này sẽ cho phép:

- lập kế hoạch triển khai chi tiết;
- chuẩn bị diff governance kích hoạt task trong đúng file đã liệt kê;
- sau khi governance activation PR đã qua H2/H3 và merge vào `main`, viết kiểm thử RED rồi triển khai GREEN chưa commit trong hai slice;
- chạy các gate tương ứng trong worktree đã chỉ định.

H1 không cho phép tự động commit/push/PR/merge code sản phẩm. Vì tài liệu này mô tả hợp đồng nhưng chưa chứa exact line diff của governance activation, diff governance thực tế vẫn phải qua review H2 riêng trước commit.

### H2 — Review local trước commit

Batch có hai lần H2 tách biệt:

1. **H2-G (governance activation):** review diff chỉ gồm SPEC/PLAN/TASKS/CHANGELOG. Sau H2-G mới được commit/push PR tài liệu; PR này vẫn cần checks và H3-G trước merge. Product RED-GREEN chỉ bắt đầu sau khi activation tới `main` và worktree được cập nhật an toàn.
2. **H2-P (product):** review diff test + code của hai slice sau khi governance đã được kích hoạt.

H2-P chỉ được yêu cầu khi:

- diff test + code của Batch 1 hoàn chỉnh và không lẫn governance chưa review;
- L1-L4 có bằng chứng mới trên worktree;
- không còn thay đổi ngoài danh sách file hoặc thay đổi ngoài phạm vi;
- review bảo mật xác nhận không lộ secret/OTP và rollback đúng.

H2-P mới cho phép commit bộ thay đổi sản phẩm đã review và chuẩn bị PR theo Fast-Track.

### H3 — Review tích hợp

Mỗi PR có H3 riêng. H3-G áp dụng cho governance activation; H3-P áp dụng cho product. H3 xảy ra sau required checks của PR, kiểm tra exact head, tính mergeable và diff cuối. Chỉ H3 tương ứng mới có thể cho phép merge. Tag release, đổi branch protection, bật GitHub secret scanning hoặc sửa cấu hình Azure không nằm trong quyền của batch này.

## 9. Stop rules và giới hạn

Dừng ngay và xin quyết định mới nếu phát hiện:

- cần đổi schema hoặc migration;
- cần đổi endpoint, role, response thành công ngoài hợp đồng trên;
- cần làm yếu HTTPS, bcrypt, audit hoặc error masking để giữ test cũ;
- transaction mới xung đột với concurrency/lock contract hiện có;
- SQL test chỉ có thể chạy bằng cách ghi vào staging/production;
- file Core cùng phạm vi bị thay đổi bởi worktree/nhánh khác;
- một lỗi xác định vẫn lặp lại sau ba lần sửa, hoặc E2E flake lặp lại sau một lần rerun có bằng chứng.

## 10. Ngoài phạm vi Batch 1

Các phát hiện sau thuộc Batch 2 riêng và chưa được H1 này cấp quyền:

- đối soát câu chữ mâu thuẫn FE04/FE08 về `MEMBER` active và tier 3/5;
- mở rộng coverage gate sang admin/auth và các module còn thiếu;
- thiết kế SQL CI trên cơ sở dữ liệu disposable (hiện FE05 `NFR-FE05-DEP-001` nói CI không kết nối DB, nên thay đổi này cần contract hạ tầng riêng);
- thay E2E sync hook bằng luồng SQL thật;
- cập nhật README/plan/release tag và số liệu release;
- thay branch protection, số review bắt buộc hoặc GitHub secret-scanning setting;
- chuyển mọi event audit đăng nhập thất bại/khóa/tự mở khóa sang transaction fail-closed.

Batch 2 phải có thiết kế/H1 riêng sau khi Batch 1 hoàn tất hoặc được đóng rõ ràng.
