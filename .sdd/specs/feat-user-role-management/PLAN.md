# PLAN.md - FE11 Quản lý người dùng và vai trò

Trạng thái: ĐÃ TRIỂN KHAI - XÁC THỰC TỰ ĐỘNG CỤC BỘ HOÀN TẤT

Ngày: 2026-07-28

Phần mở rộng hiện tại: Q-FE11-029 loại bỏ việc sửa hồ sơ người dùng hiện có khỏi
FE11; Quản trị vẫn thay vai trò và vô hiệu hóa khi đủ điều kiện. Xác thực tự
động cục bộ và chấp nhận trên trình duyệt/con người được theo dõi bên dưới.

Phần mở rộng đồng thời: Rà soát tư cách thành viên trong Admin Console đã triển
khai theo quyền sở hữu FE04 chuẩn và đã kiểm thử hồi quy cục bộ; trình duyệt đáp
ứng, Azure Staging và chấp nhận con người vẫn mở.

Chủ sở hữu: Dung

## 1. Mục đích

Giữ bằng chứng lát cắt FE11 đã hoàn tất trong khi sửa quyền sở hữu dữ liệu cá
nhân. Phần 3-20 giữ các ảnh chụp kế hoạch và tích hợp lịch sử; Phần 21 là ranh
giới triển khai quyền sở hữu dữ liệu cá nhân hiện tại.

Baseline FE11 Giai đoạn 1 đã được phê duyệt trước đó hoàn tất qua B7. Quyết định
quyền sở hữu sau ngày 2026-07-22 chỉ thay thế hợp đồng cập nhật người dùng hiện
có rộng và phải được triển khai trước khi phạm vi FE11 đã sửa có thể được gọi là
hoàn tất. Bằng chứng hoàn tất lịch sử không chứng minh Phần 21.

## 2. Tài liệu nguồn

- `.sdd/specs/feat-user-role-management/SPEC.md`
- `.sdd/specs/feat-auth/SPEC.md`
- `.sdd/specs/feat-notification-management/SPEC.md`
- `.sdd/rfcs/ADR-003-authentication-approach.md`
- `.sdd/rfcs/ADR-004-auth-otp-notification-boundary.md`
- `.sdd/rfcs/ADR-005-admin-created-account-setup-boundary.md`
- `docs/api/api-contract.md`
- `database/Librarymanagement.sql`
- `.sdd/constraints/safety.md`
- `docs/superpowers/specs/2026-07-19-fe11-finalization-batch-design.md`
- `docs/superpowers/plans/2026-07-19-fe11-finalization-batch.md`

## 3. Phạm vi lát cắt

### Trong phạm vi

- Tạo tài khoản Thành viên/Thủ thư là `INACTIVE`.
- Lưu hash bcrypt không thể dùng của giá trị ngẫu nhiên đã loại bỏ khi thiết lập
  chưa hoàn tất.
- Tạo nguyên tử người dùng, hồ sơ, vai trò ban đầu, mã thông báo `ACCOUNT_SETUP`
  đã hash và sự kiện kiểm toán FE11.
- Gửi `ACCOUNT_SETUP` chuẩn qua requester FE10 gắn với `FE11`.
- Trả trạng thái gửi thiết lập an toàn `SENT`/`FAILED`.
- Thêm gửi lại thiết lập chỉ Quản trị với xoay vòng mã thông báo và cooldown 60
  giây.
- Hoàn tất thiết lập qua endpoint mã thông báo FE02 hiện có, kích hoạt tài khoản
  một cách nguyên tử.
- Thêm kiểm thử service, route, repository và tích hợp tập trung.

### Ngoài phạm vi

- Nợ CRUD/Admin Console FE11 còn lại không liên quan đến thiết lập tài khoản.
- Gửi lại thiết lập công khai.
- Quản trị đặt lại mật khẩu cho tài khoản hoạt động.
- Kích hoạt lại tài khoản đã vô hiệu hóa.
- Thay đổi quyền sở hữu OTP xác minh/đặt lại FE02 từ ADR-004.

## 4. Hợp đồng đã phê duyệt

| Khu vực | Quyết định |
| --- | --- |
| Trạng thái ban đầu | `INACTIVE` |
| Chủ sở hữu mã thông báo thiết lập | FE11 |
| Chủ sở hữu hoàn tất thiết lập | FE02 |
| Chủ sở hữu gửi | requester FE10 gắn với `FE11` |
| Cặp thông báo | `ACCOUNT_SETUP -> ACCOUNT_SETUP` |
| Biến mẫu | `setupLink`, `expiresInHours` |
| Lưu mã thông báo | Hash SHA-256 trong `AuthTokens`, hết hạn 24 giờ |
| Tham chiếu nguồn | `AuthToken` cùng ID mã thông báo đã lưu |
| Tính lũy đẳng | `FE11:ACCOUNT_SETUP:<tokenId>` |
| Lỗi gửi | Không chặn; tài khoản giữ `INACTIVE` |
| Gửi lại | Chỉ Quản trị; thu hồi mã thông báo cũ đang hoạt động, tạo sự kiện mới, cooldown 60 giây |

## 5. Ranh giới giao dịch

- Giao dịch nguồn FE11: `Users` + `UserProfiles` + `UserRoles` + `AuthTokens` +
  `AuditLogs`.
- Gửi nhà cung cấp FE10 chỉ bắt đầu sau commit nguồn và dùng giao dịch gửi riêng.
- Giao dịch hoàn tất FE02: hash mật khẩu + `EmailVerifiedAt` + `Status=ACTIVE` +
  mã thông báo thiết lập `UsedAt` + kiểm toán xác thực.
- Không có giao dịch phân tán nào trải qua FE11 và FE10.

## 6. Thay đổi API

| Phương thức | Endpoint | Hành vi |
| --- | --- | --- |
| POST | `/api/users` | Tạo tài khoản `INACTIVE` và trả trạng thái gửi thiết lập an toàn. |
| POST | `/api/users/{userId}/resend-setup` | Xoay mã thông báo thiết lập cho tài khoản chưa hoàn tất đủ điều kiện và yêu cầu gửi mới. |
| POST | `/api/auth/reset-password` | Hình dạng mã thông báo hiện có tiêu thụ `ACCOUNT_SETUP` FE11 chuẩn và kích hoạt nguyên tử. |

## 7. Tệp triển khai dự kiến

```text
backend/src/services/userManagementService.js
backend/src/services/authService.js
backend/src/services/notificationService.js
backend/src/repositories/userRepository.js
backend/src/repositories/authTokenRepository.js
backend/src/repositories/auditLogRepository.js
backend/src/routes/userManagementRoutes.js
backend/src/validators/userManagementValidators.js
backend/tests/userManagementService.test.js
backend/tests/userManagementRoutes.test.js
backend/tests/authRoutes.test.js
backend/tests/notificationRoutes.test.js
backend/tests/helpers/inMemoryAuthRepositories.js
backend/tests/helpers/inMemoryNotificationRepositories.js
database/Librarymanagement.sql
```

## 8. Thứ tự kiểm thử trước

1. Thêm kiểm thử RED cho tạo không hoạt động, placeholder bcrypt hợp lệ, rollback
   nguồn đầy đủ và không có phản hồi thông tin xác thực.
2. Thêm kiểm thử RED FE10 cho `ACCOUNT_SETUP` chỉ FE11, biến mẫu, lưu an toàn và
   kết quả nhà cung cấp.
3. Thêm kiểm thử RED FE02 cho hoàn tất thiết lập nguyên tử và hành vi mã thông
   báo dùng một lần.
4. Thêm kiểm thử RED gửi lại cho điều kiện hợp lệ, cooldown, xoay mã thông báo,
   lỗi an toàn và tính lũy đẳng.
5. Triển khai thay đổi nhỏ nhất cần thiết để qua từng nhóm tập trung.
6. Chạy kiểm thử tích hợp bị ảnh hưởng, truy vết, quét bí mật và review con
   người.

## 9. Cổng xác thực

- Không tài khoản nào `ACTIVE` trước khi hoàn tất thiết lập.
- Không còn hash mật khẩu placeholder theo nghĩa đen.
- Không mã thông báo/liên kết thiết lập thô nào xuất hiện trong DB, audit, log,
  HTTP, snapshot hoặc trường debug.
- FE10 từ chối yêu cầu `ACCOUNT_SETUP` HTTP/không-phải-FE11.
- Tạo và hoàn tất thiết lập qua kiểm thử rollback.
- Gửi lại chứng minh ngữ nghĩa cooldown và mã thông báo/sự kiện/idempotency mới.
- Hành vi OTP xác minh/đặt lại FE02 từ ADR-004 không thay đổi.
- Nhat hoàn tất review con người trước commit/merge.

## 10. Lát cắt quản lý vai trò có giao dịch

### Trong phạm vi

- Xác thực ID mục tiêu và vai trò là số nguyên dương.
- Kiểm tra lại Quản trị hoạt động thực hiện thao tác trong giao dịch SQL.
- Thay mọi ánh xạ hiện tại bằng đúng một vai trò được chọn.
- Bảo vệ Quản trị hoạt động cuối dưới `UPDLOCK, HOLDLOCK`.
- Commit xóa/chèn và audit cùng nhau; chọn vai trò hiện tại là no-op.
- Thêm kiểm thử route, service và repository.

### Ngoài phạm vi

- Cập nhật/vô hiệu hóa người dùng, trường Thủ thư, đối soát DTO chi tiết an toàn
  và UI Quản trị.
- Tạo/sửa vai trò, sửa quyền và phân cấp vai trò.

### Cổng xác thực

- Kiểm thử RED-GREEN tập trung chứng minh từng kết quả repository và ánh xạ API.
- Kiểm thử backend đầy đủ và `trace:enforce` đạt.
- Công việc FE11 còn lại vẫn hoãn; bằng chứng lát cắt vai trò hoàn tất được ghi
  riêng.

## 11. Lát cắt danh sách và chi tiết người dùng an toàn

### Trong phạm vi

- Xác thực phân trang danh sách, trạng thái, vai trò, tìm kiếm và ID người dùng
  chi tiết.
- Chỉ trả danh sách cho phép `UserManagementView` rõ ràng với `phoneNumber`.
- Hạn chế tìm kiếm vào email, họ tên và ID người dùng với thứ tự ổn định.
- Trả bản tóm tắt chỉ-chi-tiết về lượt mượn, tiền phạt chưa trả và đặt chỗ mở.
- Trả `404 USER_NOT_FOUND` khi không có người dùng chi tiết.
- Làm UI Quản trị tìm nạp và render phản hồi chi tiết thực.
- Thêm kiểm thử RED-GREEN route, service, repository và frontend.

### Ngoài phạm vi

- Thay đổi schema và lưu `department`/`specialization` của Thủ thư.
- Cập nhật/vô hiệu hóa, thiết lập tài khoản, thay vai trò, nhật ký kiểm toán,
  dashboard và hành vi quản lý yêu cầu.
- Thay đổi chính sách trình kiểm tra truy vết toàn tính năng.

### Cổng xác thực

- Giá trị danh sách/chi tiết được cung cấp không hợp lệ bị từ chối thay vì bị
  ép vào ngưỡng.
- Cột cơ sở dữ liệu bổ sung thù địch không bao giờ xuất hiện trong DTO an toàn.
- Mục danh sách không có `relatedSummary`; chi tiết có chính xác ba trường tóm
  tắt số xác định.
- Kiểm tra backend/frontend tập trung/đầy đủ cùng `trace:enforce` đạt.
- Công việc FE11 còn lại vẫn hoãn và không được báo cáo là hoàn tất.

## 12. Lát cắt hợp đồng UI vai trò Quản trị

### Trong phạm vi

- Tải `{ roleId, roleName }` từ danh mục vai trò FE11 đã xác thực.
- Giữ một lựa chọn radio theo tên vai trò trong khi ánh xạ thay thế tới ID vai
  trò số dương.
- Gửi một yêu cầu `PUT /users/{userId}/role` chuẩn.
- Chặn danh mục không hợp lệ trước thay đổi và đối soát trạng thái người dùng
  chuẩn sau lỗi.
- Thêm kiểm thử RED-GREEN frontend tập trung và các kiểm tra hồi quy bị ảnh
  hưởng.

### Ngoài phạm vi

- Tạo/sửa vai trò và sửa quyền.
- Điều hướng, Permissions, Audit Logs, Request Management, cập nhật, vô hiệu
  hóa và mọi nợ FE11 khác.

### Cổng xác thực

- Kiểm thử adapter API chứng minh không tên vai trò nào đi vào yêu cầu thay đổi.
- Kiểm thử hợp đồng UI chứng minh kiểm tra danh mục, thay thế một yêu cầu, hành
  vi no-op và đối soát lỗi.
- Kiểm thử frontend đầy đủ/lint/build, hồi quy vai trò backend tập trung, truy
  vết và vệ sinh diff đạt.
- Review con người, PR #30 và CI hậu merge `29644292781` đã đạt; công việc FE11
  còn lại vẫn hoãn.

## 13. Fast-Track Batch 1

Trạng thái tích hợp: HOÀN TẤT QUA B7

### Phạm vi và thứ tự

1. `TD-024` / `FE11-AUD01`: ranh giới đọc Nhật ký kiểm toán Quản trị chuẩn.
2. `TD-026` / `FE11-ENV01`: khôi phục `{ data, pagination }` và dùng lại
   `/api/reports/users` FE12 cho bộ đếm.
3. `TD-027` / `FE11-META01`: áp dụng ma trận bằng chứng đã phê duyệt sau khi
   TD-026 merge.

Khi Batch 1 đóng, `TD-023` và `TD-025` ngoài batch đó. Phần 14 sau đó hoàn tất
`TD-023`; Phần 15 hiện kích hoạt `TD-025` và phạm vi hoàn tất FE11 còn lại.

### Cổng

- H1 khóa Batch 1 và diff kích hoạt governance chính xác.
- H2 bắt buộc trước khi mọi diff triển khai hoặc bằng chứng SPEC được tạo được
  commit và push.
- H3 bắt buộc sau kiểm tra và trước mọi merge PR.
- Phân tích TD-027 có thể chạy song song, nhưng sửa `SPEC.md` được tuần tự hóa
  sau TD-026.

### Bằng chứng tích hợp

- `TD-024` / `FE11-AUD01`: PR #33, merge `3c88e432`, CI hậu merge
  `29651173195`.
- `TD-026` / `FE11-ENV01`: PR #34, merge `411fa25a`, CI hậu merge
  `29652243809`.
- `TD-027` / `FE11-META01`: PR #35, merge `c286cd9b`, CI hậu merge
  `29652617587`.
- Batch 1 không cho phép `TD-023` hoặc `TD-025`; Phần 14 hoàn tất riêng
  `TD-023` và Phần 15 hiện quản trị `TD-025` cùng công việc hoàn tất còn lại.

## 14. Lát cắt điều hướng và quyền Quản trị

Trạng thái tích hợp: HOÀN TẤT QUA B7

### Trong phạm vi

- Căn chỉnh sidebar Admin Console thành tám mục đã phê duyệt.
- Thêm `GET /api/admin/permissions` chỉ Quản trị với chính sách Giai đoạn 1
  chuẩn 15 hàng.
- Kết hợp dữ liệu quyền FE11 với số lượng `usersByRole` FE12 độc lập ở
  frontend.
- Suy ra bao phủ module và ô ma trận từ `allowedRoles`; giữ chế độ xem chỉ đọc.

### Ngoài phạm vi

- Sửa quyền, phân cấp/CRUD vai trò, thay đổi schema, loại bỏ FE04, thay đổi FE12
  production và TD-025.

### Cổng xác thực

- Kiểm thử policy/service/route backend chứng minh DTO chính xác, đối tượng mới
  và phân quyền ưu tiên Quản trị.
- Kiểm thử frontend chứng minh thứ tự sidebar chính xác, dùng API chuẩn, không
  fallback ma trận mã hóa cứng, số lượng FE12, bao phủ suy ra và retry/lỗi cô lập.
- Kiểm thử đầy đủ, coverage, lint, build, E2E trình duyệt, parse OpenAPI, import
  health, truy vết, vệ sinh diff, quét phạm vi và quét bí mật đạt.
- H2 trước commit/push; H3 trước merge; TD-023 chỉ đóng sau CI main hậu merge và
  bằng chứng closeout.

### Bằng chứng tích hợp

- H2 phê duyệt diff triển khai không đổi ngày 2026-07-19; H3 phê duyệt PR #37
  để merge ngày 2026-07-19.
- PR #37 đã qua `foundation-checks` trong lượt `29654621448` và merge vào
  `main` là `356130e4905a59d219bae8e9b369f7690348cba2`.
- CI `main` hậu merge chính xác `29655548150` qua mọi `foundation-checks`.
- Khi lát cắt hữu hạn này đóng, `TD-023` được giải quyết còn `TD-025` và toàn
  bộ FE11 vẫn hoãn; Phần 15 hiện thay trạng thái hoãn đó bằng kích hoạt chỉ
  governance.

## 15. Batch hoàn tất FE11

Trạng thái triển khai: WAVE A VÀ WAVE B ĐÃ TÍCH HỢP; BẢN GHI BATCH LỊCH SỬ

### Nguồn đã phê duyệt

- `docs/superpowers/specs/2026-07-19-fe11-finalization-batch-design.md`
- `docs/superpowers/plans/2026-07-19-fe11-finalization-batch.md`
- `.sdd/rfcs/ADR-002-database-design.md`
- Hợp đồng đồng bộ FE02/FE03/FE10/FE11 và `docs/api/api-contract.md`

### Hình dạng bàn giao

1. PR kích hoạt governance: chỉ hợp đồng, nhiệm vụ, lệnh xác thực và trạng thái
   nợ.
2. Wave A: đồng bộ schema/email, trường Thủ thư, củng cố tạo/gửi lại có giao
   dịch, cập nhật optimistic/no-op, vô hiệu hóa nguyên tử, phụ thuộc tuần tự FE07
   và củng cố quyền truy cập Quản trị.
3. Wave B: đọc danh sách/chi tiết yêu cầu Quản trị chuẩn, phân trang máy chủ,
   thao tác kết thúc do FE07 sở hữu, xuất DOCX, bằng chứng Dashboard và chấp nhận
   FE11 trên trình duyệt.
4. Closeout tài liệu: bằng chứng PR/merge/CI main chính xác và trạng thái B7
   toàn tính năng.

### Hợp đồng cốt lõi

- `Users.Email` và `Notifications.RecipientEmail` là `NVARCHAR(255)`.
- `UserProfiles.Department` và `UserProfiles.Specialization` là
  `NVARCHAR(100)` có thể null và chỉ FE11-admin quản lý.
- `fullName` giữ tối đa 100 ký tự.
- `UserManagementView.updatedAt` là `COALESCE(Users.UpdatedAt, Users.CreatedAt)`
  và cùng giá trị được so sánh khi cập nhật/vô hiệu hóa.
- Tạo FE11 và gửi lại thiết lập kiểm tra lại Quản trị đang hoạt động trong giao
  dịch nguồn; email trùng do giao dịch quyết định và an toàn.
- `INACTIVE` cùng `DeactivatedAt` null là đang chờ kích hoạt và trả
  `409 ACCOUNT_PENDING_ACTIVATION` từ vô hiệu hóa.
- FE07 vẫn là chủ sở hữu thay đổi duyệt/từ chối duy nhất; FE11 chỉ sở hữu DTO
  đọc và trình bày yêu cầu Quản trị.
- Truy vấn yêu cầu Quản trị là `page`, `limit`, `q`, `status`, `from` và `to`;
  phản hồi danh sách chứa đúng `data` và `pagination`.

### Cổng

- Cổng lịch sử: công việc sản phẩm bị chặn cho đến khi PR governance qua kiểm
  tra, nhận H3 và merge vào `main`.
- Cổng lịch sử: thay đổi tạo Wave A và Wave B chưa commit cho đến review H2.
- Cổng lịch sử: mỗi PR yêu cầu H3 sau kiểm tra và trước merge.
- PR #54 thay ảnh chụp kích hoạt và chuyển phạm vi FE11 đã phê duyệt qua tích
  hợp; bằng chứng hiện tại được ghi trong
  `.sdd/reviews/final-governance-closeout-validation-2026-07-20.md`.

## 16. Closeout governance cuối

Trạng thái triển khai: HOÀN TẤT - PR #54 ĐÃ TÍCH HỢP; PR #59 ĐƯỢC H2/H3 PHÊ
DUYỆT VÀ MERGE DƯỚI DẠNG `eed2688`

### Phạm vi

- Khôi phục điều khiển `action` và `actorId` số của Nhật ký kiểm toán Quản trị
  FE11, vốn nuôi query builder chuẩn đã phê duyệt.
- Thêm hồi quy frontend tập trung ánh xạ tới `BR-FE11-018`, `BR-FE11-026`,
  `FR-FE11-033` và `AC-FE11-018`.
- Đối soát siêu dữ liệu truy vết hiện tại trong khi giữ các ảnh chụp kế hoạch
  lịch sử.
- Không đổi API, schema, quyền vai trò, phân quyền, phân trang, che dữ liệu hay
  hành vi backend.

### Lệnh xác thực

```powershell
npm.cmd run trace:enforce
npm.cmd run test:deployment
npm.cmd --prefix backend run test:coverage:ci
npm.cmd run test:system
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
npm.cmd run phase3:performance
npm.cmd run smoke:staging
```

### Ranh giới review

- H2 con người phê duyệt commit đối soát đã công bố và sửa HomePage đáp ứng
  `962ceb1` và `daaeea6` với bằng chứng L1-L4 ngày 2026-07-20.
- H3 vẫn bắt buộc trước merge.
- H3, merge và CI `main` hậu merge chính xác được theo dõi bởi PR #59; `v1.0.2`
  đã phát hành tại `c988af1`. Mọi `v1.0.3` tương lai phải dùng SHA `main` đã
  review muộn hơn sau các cổng phát hành riêng.

## 18. Lát cắt tái cấu trúc frontend toàn bộ Admin Console

Quyết định: ĐƯỢC CON NGƯỜI PHÊ DUYỆT - 2026-07-22.

Tái cấu trúc chỉ Shell này giữ `/admin/users`, mọi hợp đồng API và quyền sở hữu
FE11/FE07/FE12, phân quyền máy chủ, DTO an toàn và trạng thái cơ sở dữ liệu. Nó
tách Admin Console thành shell được bảo vệ, các primitive trình bày dùng chung,
và các module Dashboard, Library, Circulation, Requests, Users, Permissions và
Audit độc lập.

Thứ tự triển khai: governance -> RED/GREEN trình bày thuần -> shell dùng chung
-> Dashboard -> Users -> Requests -> Permissions -> Audit -> Library/Circulation
-> loại bỏ legacy -> xác thực đầy đủ và chấp nhận Azure Staging.

## 19. Lát cắt sửa UX Quản trị đã xác thực

Quyết định: ĐƯỢC CON NGƯỜI PHÊ DUYỆT - 2026-07-22.

Sửa Hybrid hữu hạn này cập nhật hợp đồng sidebar FE11 từ tám xuống bảy mục hiển
thị trong khi vẫn giữ Manage Roles ở User Management và không đổi API/policy
quyền. Công việc Shell chuyển danh mục người dùng sang chế độ xem thẻ hiện có
trước khi bảng 1040px bị tràn, giữ mọi bộ lọc Audit chuẩn, trình bày thao tác đã
ánh xạ có thể truy cập và di chuyển siêu dữ liệu chi tiết an toàn sau disclosure
từng hàng.

Thứ tự triển khai: đối soát spec/design -> kiểm thử RED tập trung -> sửa điều
hướng -> breakpoint người dùng đáp ứng -> sửa bộ lọc/chi tiết Audit -> xác thực
frontend đầy đủ -> chấp nhận trình duyệt đáp ứng -> review Azure Staging.

## 20. Tích hợp rà soát tư cách thành viên Admin Console

Quyết định: ĐƯỢC CON NGƯỜI PHÊ DUYỆT - 2026-07-22.

Tích hợp được phê duyệt sau thay thế duy nhất số mục điều hướng bảy và ranh giới
FE04-bên-ngoài-Admin ở trên. FE11 thêm mục shell thứ tám `Duyệt hội viên` sau
All Users; FE04 sở hữu dữ liệu và thay đổi danh sách/rà soát nhúng. Kế hoạch thực
thi là
`docs/superpowers/plans/2026-07-22-admin-membership-review-integration.md`;
Permissions vẫn vắng mặt và không cho phép thay đổi production backend/API/schema.

## 21. Sửa quyền sở hữu dữ liệu cá nhân

Quyết định: ĐƯỢC NGƯỜI DÙNG PHÊ DUYỆT - 2026-07-22.

Trạng thái triển khai: SẢN PHẨM VÀ HỢP ĐỒNG ĐÃ TRIỂN KHAI; XÁC THỰC TỰ ĐỘNG CỤC
BỘ HOÀN TẤT; CHỜ CHẤP NHẬN TRÌNH DUYỆT/CON NGƯỜI.

### Mục tiêu và quyền sở hữu

- FE03 vẫn là chủ sở hữu Giai đoạn 1 duy nhất cho thay đổi tự phục vụ đã xác
  thực đối với `fullName`, `phone` và `address`.
- Email tài khoản hiện có vẫn chỉ đọc trong Giai đoạn 1; mọi thay đổi tương lai
  phải dùng luồng xác minh FE02 được phê duyệt rõ ràng.
- Quản trị FE11 có thể xem trường cá nhân nhưng không được sửa sau khi tạo tài
  khoản.
- Quản trị FE11 chỉ có thể cập nhật `department` và `specialization` cho mục
  tiêu hiện có vai trò Thủ thư.
- Đầu vào tạo tài khoản không đổi vì Quản trị phải cung cấp danh tính/thông tin
  liên hệ ban đầu trước khi người dùng mới có thể hoàn tất thiết lập.

### Tệp và trách nhiệm

| Tệp | Trách nhiệm trong sửa này |
| --- | --- |
| `backend/tests/userManagementRoutes.test.js` | Chứng minh ranh giới HTTP từ chối trường cá nhân/không rõ và giữ phân quyền ưu tiên Quản trị. |
| `backend/tests/userManagementService.test.js` | Chứng minh chỉ trường công việc của Thủ thư hiện tại đến repository và ánh xạ thử cá nhân bị cấm thành `403 PERSONAL_PROFILE_ADMIN_FORBIDDEN`. |
| `backend/tests/userRepository.test.js` | Chứng minh cập nhật trường công việc được phép giữ ngữ nghĩa optimistic concurrency/no-op/audit và không thể ghi cột cá nhân. |
| `backend/src/validators/userManagementValidators.js` | Thay allowlist cập nhật rộng bằng `expectedUpdatedAt`, `department` và `specialization`; từ chối trường cá nhân/không rõ một cách xác định. |
| `backend/src/services/userManagementService.js` | Ép quyền sở hữu vai trò mục tiêu và ánh xạ thử trường cá nhân mà không gọi repository cập nhật. |
| `backend/src/repositories/userRepository.js` | Thu hẹp SQL cập nhật và siêu dữ liệu audit chỉ còn trường công việc Thủ thư. |
| `frontend/test/userManagementApi.test.js` | Chứng minh adapter Quản trị chỉ gửi hình dạng yêu cầu trường công việc đã sửa. |
| `frontend/test/userManagementFrontend.test.js` | Chứng minh giá trị cá nhân hiện có chỉ đọc và chỉ Thủ thư hiện tại hiển thị sửa trường công việc. |
| `frontend/src/page/admin/users/AdminUsersSection.jsx` | Tách payload tạo khỏi cập nhật công việc Thủ thư hiện có. |
| `frontend/src/page/admin/users/UserEditorModal.jsx` | Render trường cá nhân chỉ đọc ở chế độ sửa và chỉ hiển thị trường công việc có thể sửa cho Thủ thư hiện tại. |
| `frontend/src/page/admin/users/userPresentation.js` | Xác thực trường tạo riêng với cập nhật trường công việc Thủ thư. |
| `frontend/src/api/userManagementApi.js` | Gửi thân `PUT` chuẩn không có trường cá nhân. |
| `backend/src/docs/openapi.yaml`, `docs/api/api-contract.md` | Công bố cùng hợp đồng yêu cầu/lỗi đã thu hẹp sau triển khai. |

### Thay đổi API chuẩn

`PUT /api/users/{userId}` chấp nhận chính xác:

```json
{
  "expectedUpdatedAt": "2026-07-22T00:00:00.000Z",
  "department": "Circulation",
  "specialization": "Reader services"
}
```

Cả hai trường công việc là chuỗi nullable tùy chọn có độ dài tối đa 100. Mục
tiêu phải hiện có vai trò Thủ thư. Bất kỳ `fullName`, `phone`, `address`,
`email` hoặc trường không rõ nào đều làm toàn bộ yêu cầu thất bại với HTTP
`403` và mã `PERSONAL_PROFILE_ADMIN_FORBIDDEN`; không trường, phiên bản hiệu
dụng hay audit thành công nào được đổi.

### Thứ tự triển khai kiểm thử trước

1. Thêm ca RED route cho từng trường cá nhân bị cấm, payload trộn được phép/bị
   cấm, trường không rõ, mục tiêu không phải Thủ thư và hình dạng chỉ-công-việc
   Thủ thư được phép. Kết quả ban đầu kỳ vọng: validator/service rộng hiện tại
   chấp nhận ít nhất các ca trường cá nhân.
2. Thêm ca RED service/repository chứng minh đầu vào bị cấm không gọi
   repository, trường công việc là khóa cập nhật duy nhất, hành vi stale/no-op
   không đổi và chi tiết audit không chứa trường cá nhân.
3. Thu hẹp hành vi validator, service và repository đến khi kiểm thử backend
   tập trung đạt.
4. Thêm ca RED frontend chứng minh điều khiển cá nhân chỉ đọc ở chế độ người
   dùng hiện có, mục tiêu Member/Admin không có thao tác Lưu trường công việc và
   Thủ thư hiện tại chỉ gửi `expectedUpdatedAt`, `department` và
   `specialization`.
5. Tách xác thực/dựng payload tạo-sửa, sau đó làm kiểm thử frontend tập trung
   đạt.
6. Đồng bộ OpenAPI/tài liệu API dùng chung và chạy kiểm tra backend, frontend,
   E2E, truy vết, bảo mật và diff đầy đủ.

### Cổng hoàn tất

- Mọi lần thử trường cá nhân người dùng hiện có bị từ chối phía máy chủ, gồm
  payload HTTP trực tiếp và trộn.
- UI Quản trị không chứa điều khiển tên, điện thoại, địa chỉ hoặc email người
  dùng hiện có có thể sửa.
- Chỉ thay đổi department/specialization của Thủ thư hiện tại có thể tăng
  `UpdatedAt` hoặc ghi audit cập nhật thành công.
- Hành vi hồ sơ tự phục vụ FE03 và hồi quy thiết lập tài khoản/xác thực FE02 vẫn
  xanh.
- `FE11-PDO02..PDO04` hoàn tất với bằng chứng tự động mới; chỉ bằng chứng
  FE11-LIFE03 lịch sử không được chấp nhận.

## 2026-07-25 Sửa chỉnh sửa hồ sơ được quản lý

Bản sửa này thay thế việc sửa chỉ-trường-công-việc ở trên cho hành vi hiện tại
nhưng giữ nó là bằng chứng lịch sử.

- Hiển thị một thao tác Sửa cho mọi tài khoản Member, Librarian và Admin được
  quản lý.
- Sửa `fullName`, `phone` và `address`; giữ email chỉ đọc.
- Loại department/specialization và thông báo quyền sở hữu lỗi thời khỏi UI
  Quản trị.
- Lưu qua bản ghi `Users` và `UserProfiles` chuẩn do FE03 dùng.
- Dùng timestamp mới nhất trên `Users` và `UserProfiles` làm phiên bản
  optimistic-concurrency dùng chung để một lần sửa tự phục vụ làm form Quản trị
  cũ thất bại.
- Từ chối email, department, specialization, trường trộn và trường không rõ một
  cách nguyên tử bằng `MANAGED_USER_UPDATE_FORBIDDEN`.
- Giữ hành vi no-op, rollback, đọc lại chuẩn và audit `USER_UPDATE`.

Thứ tự xác thực: hợp đồng frontend/backend tập trung, kiểm thử backend đầy đủ
và coverage, kiểm thử frontend đầy đủ/lint/build, parse OpenAPI, truy vết và vệ
sinh diff.

## 2026-07-27 Sửa trạng thái yêu cầu Quản trị

- Giữ FE11 là chủ sở hữu kết hợp/đọc Quản trị và FE07 là chủ sở hữu nghiệp vụ
  duyệt/từ chối duy nhất.
- Thêm trạng thái bản sao vật lý hiện tại vào phép chiếu chi tiết yêu cầu Quản
  trị an toàn.
- Tải lại danh sách/chi tiết sau quyết định thành công hoặc xung đột để Quản trị
  không bao giờ thao tác trên trạng thái bịa đặt hoặc cũ.
- Giữ từ chối khả dụng cho yêu cầu đang chờ cũ không thể duyệt và làm rõ hành vi
  lý do bắt buộc/giải phóng claim của nó.
- Xác thực kiểm thử Admin/FE07/FE06 tập trung, hồi quy đầy đủ, lint/build, truy
  vết và review con người.

## 2026-07-27 Sửa bảo vệ vòng đời FE07

- Tuần tự vô hiệu hóa và thay vai trò Member với khóa thành viên của FE07.
- Từ chối các thay đổi vòng đời đó khi có yêu cầu đang chờ hoặc khoản mượn hoạt
  động.
- Chiếu blocker phê duyệt đã biết trong chi tiết Quản trị, chỉ vô hiệu hóa phê
  duyệt và giữ từ chối FE07 để dọn legacy.

## 2026-07-27 Sửa kết nối Dashboard Quản trị

1. Thêm bao phủ repository RED cho số lượng tài khoản hoạt động từ ánh xạ
   `Users -> UserRoles -> Roles` chuẩn và số lượng đang chờ FE04/FE07 riêng.
2. Sửa tổng hợp trả-hôm-nay để gồm lượt trả có timestamp xuyên suốt ngày lịch
   hiện tại đầy đủ.
3. Thay ô tóm tắt tĩnh bằng liên kết module có thể truy cập.
4. Mang ngữ cảnh vai trò/trạng thái vào Users, Circulation và Requests; giữ rà
   soát tư cách thành viên FE04 trên chế độ xem đang chờ chuẩn.
5. Chạy kiểm thử backend/frontend tập trung, hồi quy đầy đủ, lint/build, truy
   vết, vệ sinh diff và review con người.
6. Đối soát biểu đồ hoạt động FE07 để việc mượn lịch sử yêu cầu `BorrowDate`
   đã commit, gắn truy vấn trả-hôm-nay vào ngày nghiệp vụ Việt Nam dùng chung
   thay vì ngày host SQL Server và giữ trình bày năm thẻ/ba biểu đồ đã phê duyệt.

## 2026-07-28 Sửa ranh giới quản trị tài khoản Quản trị

1. Loại thao tác `Chỉnh sửa` người dùng hiện có khỏi hàng desktop, thẻ di động
   và ngăn kéo chi tiết trong khi giữ `Phân quyền` và `Vô hiệu hóa` đủ điều kiện.
2. Giữ tạo tài khoản là luồng onboarding riêng và FE03 là chủ sở hữu sửa hồ sơ
   tự phục vụ đã xác thực.
3. Ngừng `PUT /api/users/{userId}` và loại route, controller, validator, service,
   repository, client adapter và hợp đồng OpenAPI của nó.
4. Giữ hợp đồng thay vai trò nguyên tử và vô hiệu hóa độc lập.
5. Thêm kiểm thử hồi quy chứng minh UI không có đường Sửa và yêu cầu hồ sơ trực
   tiếp đã ngừng trả `404` mà không tới service ghi.
6. Chạy kiểm thử backend/frontend FE11 tập trung, parse OpenAPI, lint/build và
   truy vết; hoàn tất review trình duyệt/con người đã xác thực riêng.

## 2026-08-01 Củng cố mutation metadata Quản trị

1. Giữ role đơn hiện tại làm nguồn ủy quyền duy nhất.
2. Truyền actor/IP/user-agent từ request đã xác thực, không từ body/query.
3. Ghi ba action catalog allowlist trong cùng transaction với mutation.
4. Ánh xạ update/deactivate không có hàng sang `404 ADMIN_RESOURCE_ITEM_NOT_FOUND` và không ghi audit thành công.
