# Xác thực H2 hộp thư thông báo cá nhân FE10

Ngày: 2026-07-28
Nhánh: `codex/feat-fe10-personal-notification-inbox`
Mốc cơ sở: `main@41282b4ebc37b327240fbef4df4dc28b7a9b617c`
Trạng thái: **H2 ĐÃ PHÊ DUYỆT, SAU ĐÓ BỊ THAY THẾ DO SAI LỆCH CORE Ở UPSTREAM**

Biên bản này lưu giữ quyết định H2 đầu tiên đối với `main@41282b4`. Một lần
fetch sau phê duyệt đã phát hiện bốn commit upstream mới hơn, kết thúc tại
`main@5a3c84b`, bao gồm các thay đổi chồng lấn về workflow triển khai, schema
chuẩn, hướng dẫn vận hành và kiểm thử triển khai. Không có tệp đã review nào
được stage hoặc commit. Người dùng đã phê duyệt
`H1 drift addendum main@5a3c84b`; sau lần rebase đó, upstream tiến thêm ba
commit đến `main@db97f17`, chồng lấn API frontend và stylesheet shell dùng
chung. Người dùng đã phê duyệt `H1 drift addendum main@db97f17`, và ứng viên
được rebase không xung đột, đồng thời giữ nguyên cả hai hợp đồng. Việc publish
vẫn cần một fingerprint mới sau rebase và một quyết định H2 mới. Một commit
upstream chỉ thay đổi kiểm thử xuất hiện sau đó, `main@f3ebe95`, không thay đổi
đường dẫn nào của ứng viên và đã được đồng bộ một cách cơ học trước fingerprint
mới đó.

## 1. Định danh ứng viên

- Mục trong ứng viên: **47** tệp đã sửa đổi hoặc mới.
- Fingerprint ứng viên:
  `4bddfb5a24175b2663184c959e73656d6f215a600e351a1fe4a7ae6fa02f4478`.
- SHA-256 migration:
  `6e8b6b4d857170be215ef721d9c3d3d25ff16bbaf7d006821fbba33110d2d114`.
- Tệp cached/đã stage tại thời điểm fingerprint: **0**.
- Đường dẫn chưa merge và dấu xung đột: **0**.
- Biên bản xác thực này được loại trừ có chủ đích khỏi fingerprint ứng viên để
  có thể ghi nhận trạng thái phê duyệt mà không thay đổi ứng viên product/spec
  đã được review.

Thuật toán fingerprint:

1. Đọc `git status --porcelain=v1 --untracked-files=all`.
2. Chỉ loại trừ biên bản xác thực này.
3. Với mỗi tệp còn lại, tạo
   `<two-character-status>|<lowercase-file-sha256>|<normalized-path>`.
4. Sắp xếp các mục theo đường dẫn phân biệt hoa-thường bằng PowerShell
   `Sort-Object`.
5. Nối các mục bằng LF, kèm một LF cuối, mã hoá thành UTF-8 không BOM và tính
   SHA-256.

## 2. Đối soát H1 và phạm vi

- Người dùng đã phê duyệt thiết kế FE10 v0.5.0, SPEC đã viết và kế hoạch triển
  khai FE10-I01..I08.
- PR quản trị #70 đã được merge với commit `25c09ec`.
- Ứng viên đã được rebase lên `main@41282b4`.
- Người dùng đã phê duyệt addendum triển khai H1, giữ cả việc triển khai
  staging tự động thành công từ `main`-CI và manual dispatch, đồng thời yêu
  cầu hash migration FE10 chính xác trong Environment `staging` của GitHub.
- Không bổ sung thao tác xoá, archive, dọn dẹp retention, nhật ký thông báo
  toàn cục, action URL tuỳ ý, mục hộp thư nhạy cảm về xác thực/thiết lập hay
  phép tính tiền phạt FE09.

## 3. Đánh giá bốn lớp

### L1 - Hợp đồng và truy vết

**ĐẠT**

- SPEC v0.5.0, PLAN, TASKS, CONTEXT, TEST_PLAN, CHANGELOG, kiến trúc, OpenAPI,
  hướng dẫn triển khai, sổ tay người dùng và trạng thái triển khai nhất quán.
- Phạm vi cục bộ FE10-I01..I08 đã được triển khai và xác thực; bằng chứng H2,
  Azure staging, H3, merge và sau merge vẫn được ghi rõ là chưa được khẳng
  định.
- Truy vết được ép đạt FE10 **14/16 thẻ FR = 88%**, cao hơn cổng 70% của
  repository.

### L2 - Chất lượng tự động

**ĐẠT**

| Cổng | Kết quả ghi nhận |
| --- | --- |
| Độ bao phủ backend | 69/69 suite, 1111/1111 kiểm thử |
| Độ bao phủ | 91.84% câu lệnh, 80.70% nhánh, 97.59% hàm, 91.76% dòng |
| Frontend | 251/251 kiểm thử; ESLint đạt; build production Vite đạt |
| Chính sách triển khai | 15/15 kiểm thử |
| Tích hợp hệ thống | 10/10 kiểm thử |
| Trạng thái truy vết | 3/3 kiểm thử |
| Chromium E2E | 11/11; riêng FE10 3/3 |
| Khoảng trắng Git | `git diff --check` đạt |
| Quét bí mật độ tin cậy cao | 0 phát hiện trên 47 tệp ứng viên |

Kiểm thử FE05 cô lập từng timeout chỉ khi độ bao phủ backend cạnh tranh với một
build frontend song song đã đạt trong 3.358 giây. Cổng backend đầy đủ sau đó
đạt tuần tự trong 73.691 giây, khép lại chẩn đoán tranh chấp tài nguyên.

### L3 - Nghiệp vụ và bảo mật

**ĐẠT**

- Liệt kê, đếm, đánh dấu một và đánh dấu tất cả gắn `UserId` đã xác thực và áp
  dụng allowlist type/template hộp thư dương tính chính xác trong SQL.
- `ACCOUNT_VERIFICATION`, `PASSWORD_RESET`, `ACCOUNT_SETUP`, các dòng không có
  người dùng, dòng của người dùng khác và dòng có type/template không khớp vẫn
  nằm ngoài hộp thư.
- ID đánh dấu một bị thiếu, nhạy cảm hoặc thuộc người dùng khác cùng trả về
  `404` an toàn.
- DTO phản hồi có đúng bảy trường an toàn và không lộ recipient, payload,
  idempotency, provider, attempt, delivery-error hay metadata nguồn.
- `actionPath` do backend suy ra dùng allowlist tương đối cố định; frontend kiểm
  tra cùng allowlist trước khi điều hướng.
- `ReadAt` độc lập với trạng thái giao, thời điểm gửi, số lần thử, kết quả nguồn
  và idempotency. Phát lại thao tác đánh dấu một và đánh dấu tất cả là
  idempotent.
- `@Offset` được bind dưới dạng SQL `BIGINT`; SQL Server đã chấp nhận probe offset
  cực đại theo hợp đồng `214748364600` mà không tràn.
- Yêu cầu đếm dùng chung không chồng chéo, làm mới sau chuyển route/auth, focus,
  thay đổi storage, read mutation và mỗi 60 giây.
- Lỗi read mutation hiển thị phản hồi an toàn nhưng không chặn route nghiệp vụ
  đã nằm trong allowlist.

### L4 - An toàn migration và phát hành

**ĐẠT CỤC BỘ; CÁC CỔNG BÊN NGOÀI ĐANG CHỜ THEO THIẾT KẾ**

- Migration dùng các tuỳ chọn SET SQL Server bắt buộc, transaction,
  `XACT_ABORT`, biên dịch động sau khi thêm `ReadAt`, backfill lần chạy đầu
  chính xác và tạo index idempotent.
- Một lần diễn tập SQL Server tạm thời đã chạy migration chính xác hai lần và
  trả về:

```text
ReadAtColumns=1
SupportingIndexes=1
HistoricalBackfilled=5
PostRunStillUnread=1
ExcludedStillUnread=6
RowsAfterRun2=12
AttemptsAfterRun2=13
KeysAfterRun2=12
DisposableDatabasesRemaining=0
```

- Các đường staging tự động và thủ công từ chối an toàn trừ khi SHA-256
  migration đã checkout bằng `FE10_INBOX_MIGRATION_SHA256`.
- Triển khai thủ công còn yêu cầu
  `fe10_inbox_migration_confirmed=true`.
- Thứ tự triển khai là preflight, backend, frontend, rồi smoke.
- Migration Azure thực, triển khai staging theo nhánh chính xác, xác minh ba
  vai trò trên môi trường sống, H3, merge, CI sau merge và triển khai main tự
  động được cố ý để chờ đến khi H2 được phê duyệt và publish.

## 4. Các phát hiện đã đóng trước H2

| ID | Mức độ | Phát hiện | Cách xử lý |
| --- | --- | --- | --- |
| H2-FE10-001 | Cao | SQL Server đã biên dịch cập nhật `ReadAt` lịch sử trong cùng batch trước khi cột mới tồn tại. | Đã thêm RED coverage và chuyển việc biên dịch update/index sau `sys.sp_executesql`; diễn tập nghiêm ngặt hai lần chạy đạt. |
| H2-FE10-002 | Trung bình | Token tổng hợp FE09 nhận 401 từ yêu cầu nền đếm chưa đọc mới, xoá fake session và chuyển route E2E của nó về đăng nhập. | Chỉ mock endpoint nền mới trong fixture FE09; FE09 tập trung và toàn bộ Chromium 11/11 đạt mà không làm yếu cách xử lý 401 thật. |
| H2-FE10-003 | Trung bình | Trang cực đại hợp lệ theo hợp đồng có thể tạo offset lớn hơn SQL `INT` và lỗi 500. | Đã thêm assertion RED tại repository, chỉ đổi `@Offset` sang SQL `BIGINT`, đạt 5/5 kiểm thử tập trung và xác minh offset cực đại trực tiếp trên SQL Server. |
| H2-FE10-004 | Thấp | Văn bản trạng thái SPEC/agent hiện tại vẫn ghi I01..I07 hoặc chưa bắt đầu triển khai sau khi các cổng cục bộ I08 đã xanh. | Đã đồng bộ truy vết SPEC và tài liệu trạng thái hiện tại mà không đổi hành vi. |

Không còn phát hiện Critical, High, Medium hoặc Low mở nào trong ứng viên cục bộ
đã được review.

## 5. Danh sách tệp ứng viên

```text
 M|74f7e0328ec6bc533bbb40373c20ddc1bcf362bc559dccb836c7e53f4841d3ce|.agents/CLAUDE.md
 M|a0f4d0d5f1bc36bc827e84044bbb81948df5be650fa722f5cdb275aa2f0cc560|.github/workflows/deploy-staging.yml
 M|405e3a962bb7a853af59b9bcb852240b64a0ff7f75f15370d70dad00e8500b89|.sdd/specs/feat-notification-management/CHANGELOG.md
 M|a7264ac71895ddc40d824c27f3cf6f61b0062ccff2840bb5e304dd850bfc74c9|.sdd/specs/feat-notification-management/CONTEXT.md
 M|c6f02ad641c516ee0c6ae75c9ae02303600d61fd9212c48af34ae22fffd5891b|.sdd/specs/feat-notification-management/PLAN.md
 M|c5fee553ecb330cf19ae7da4468dd7ed16f410dea84d83ecc7824511e2facfbd|.sdd/specs/feat-notification-management/SPEC.md
 M|0110473b2ecc9d2371dd90ed468e5a7e3a5ed694d13e3a79b321c2c2dcb0ff1e|.sdd/specs/feat-notification-management/TASKS.md
 M|2ffe4d3e22d9d65ee0e393ec2fa5e9bbc88c761d068778858ae99a96ac35729d|.sdd/specs/feat-notification-management/TEST_PLAN.md
 M|f8935cbbe6aeef5929551e76c9269a850164a61867d0b54819d73c51518f9e87|backend/src/controllers/notificationController.js
 M|1a660891081188914b75c2675cd78ff242645ebb0bce30295cff844a8a104532|backend/src/docs/openapi.yaml
 M|45e0985ff360934561c435108129e7eef3aca761dfa2bfd2ec4012b632db8497|backend/src/models/Notification.js
 M|fb60bcbaa72eccfac8e7949410535ede72515170cf82cf1a7ae6497d9698c065|backend/src/repositories/notificationRepository.js
 M|481a58fbd8827543540e681d6c891eb586fefdf36bd1c7e2a49690e02eb1b7f2|backend/src/routes/notificationRoutes.js
 M|7cf429d8749d3ebb41dbdec7c4163ebceb2f3e335716265582e76a012a899d80|backend/src/services/notificationService.js
??|976bfe83f49644a3b6a681905f7ae3238b41b2c6103f0f227f552dc64fdcaf71|backend/src/utils/notificationInbox.js
 M|876ed4e7ec783e688705d7198e51fa8147421581ccb0843720c7db8a6bea7714|backend/src/validators/notificationValidators.js
 M|da9da91d5a1cbd692f42ae07caf6d1b61409247ae86ff826b7c10a59bcbf5d5a|backend/tests/helpers/inMemoryNotificationRepositories.js
 M|92afeaf998ec82e56279646c7951a78502f3c2d2bff7aa7a1976ca0ec8fc904d|backend/tests/helpers/systemIntegrationHarness.js
 M|a4fad5081a5281bf378888689f84d0748ae9a750912b279af01ff18c6b172523|backend/tests/integration.test.js
??|5a7937a8a395a3446cb90b5c1de255242b25114b79a6ac80b0af28400ffe1b39|backend/tests/notificationInboxMigration.test.js
??|acbbbf70a951af874837d4ab24128c6ecb5f5d008a9d6774805f5acdf662bffe|backend/tests/notificationInboxRepository.test.js
 M|d9edebf005b03079f8155f10076faa4f69564f717cd2fe11faa76cbe59bb2457|backend/tests/notificationRoutes.test.js
 M|5a05ca96ef0154640254d0a1c7db17c8168dfd0368bd858374bec63ca1431577|database/Librarymanagement.sql
??|6e8b6b4d857170be215ef721d9c3d3d25ff16bbaf7d006821fbba33110d2d114|database/migrations/2026-07-27-fe10-personal-inbox-read-state.sql
 M|a3bc88af7f4e98ba660a84587100f70d1a7a5883cda431d3594e484d2434b129|docs/architecture/feature-integration-map.md
 M|fa78dcace20b3822d0af2a6b7caa769b6e1dc35621f6d07d2ec38760edfea2e1|docs/architecture/system-architecture.md
 M|b521ae4ec9b36162c571f1dab8374ea033c0df0238620c2ffb4e529276cfd7fc|docs/deployment/azure-staging-guide.md
 M|be1e51f1c803e3e2f9f5321e00f220327af2826148232f6cb18daaf288fd0f3d|docs/superpowers/plans/2026-07-27-fe10-personal-notification-inbox.md
 M|bbf9227e53801386830488d61595c0c02409c1fb1cddddc3be3992621e8b9705|docs/superpowers/specs/2026-07-27-fe10-notification-inbox-expansion-design.md
 M|70d6b30e056ec269fb89af907c296f54e23a3fda7f9eb44c8c20ba867e81f380|docs/testing/master-test-plan.md
 M|18493952907f00d2cc4a72acbf1088c063b6ed103f6482504a1bb600479e0837|docs/user-manual.md
 M|4b6a961dd83521d3edcbb6499fb0b08bc4c6b679b8a26c0e7aa06c1061234a35|frontend/src/api/apiErrorMessages.js
 M|74bcba28356285d1ac14f665b4d389166fb0eefef80e2a474d9d99ff497f5be9|frontend/src/api/libraryFeatureApi.js
 M|005be9c2d1b9279562f06ecea93ca7e0efb8222be404cb31f496e7fc86550241|frontend/src/App.jsx
??|ef7c2ac784a8bf0f48cdd3ff8593af6891b45a1733d06214d2f4494eac4b52e2|frontend/src/component/auth/AuthenticatedRouteGuard.jsx
 M|d9323f38beda03679ef97d1dda24dcacbc4012bee8cf465a02d5ffe042a481f4|frontend/src/component/layout/Header.jsx
??|f672f3ef820343431b091f5f8fabc17f7e74b18501fa563e28274ce90fed493a|frontend/src/component/notification/NotificationBell.jsx
??|620271d2b7319cebb8e9be609eca63af822811ce5001655f0569b0e7c713e3a7|frontend/src/context/NotificationInboxContext.jsx
??|e39fcf6982b488c9b8df54ba9ec17826a6bf51e9fb886f60502d6dc94df7d502|frontend/src/page/notification/NotificationsPage.jsx
 M|c7d238231c0478372fb1af89cffcf7ece6faa1fe18ef4eabd0386de41f56ad05|frontend/src/styles/app-shell.css
??|fce2174bbe273a43142dbfc1f55a811a5d9acf83ccf60b8fcf2ef2229acbd3c4|frontend/src/utils/notificationInboxViewModel.js
 M|07c999eac3208cb07c3ef1299619f1855847e7c2290772535d065ac80a3bc1cf|frontend/test/appShellFrontend.test.js
??|3840d9b20450799689678e5a6f881d10cb0dc954538a7d8b05ad46228f5e1758|frontend/test/notificationInboxFrontend.test.js
 M|e2ef4e88d50bce93ddf5273c56b1ee02dfc85515af85b3de7f16e08fc19201e2|tests/deployment/stagingWorkflowPolicy.test.js
 M|fd6f190b510a6b90254440e840428e46e56e318f8aaccd88813d0fe9c034c2d2|tests/e2e/fe09-fine-management.spec.js
??|d5be78f15340be11782f90dfb75df74062e743323dc953348b6d2fb9cee1d6eb|tests/e2e/fe10-notification-inbox.spec.js
 M|7d71c0c33860b7a1bb5f9ca5889e6c0525444f581b0e2338e0ff9ae511ad2600|tests/e2e/support/systemTestServer.js
```

## 6. Quyết định H2 của người duyệt

Người dùng đã phê duyệt chính xác ứng viên này trong task đang hoạt động vào
2026-07-28:

```text
duyệt H2 fingerprint 4bddfb5a24175b2663184c959e73656d6f215a600e351a1fe4a7ae6fa02f4478
```

Quyết định: **ĐÃ PHÊ DUYỆT**. H2 cho phép stage ứng viên đã review cùng biên
bản quyết định bị loại trừ này, commit, push nhánh, publish một PR nháp và
chuyển nó sang sẵn sàng review sau khi các kiểm tra PR bắt buộc đạt.

Sự thay thế: thẩm quyền đó đã hết hiệu lực trước khi được dùng khi remote fetch
bắt buộc phát hiện sai lệch Core chồng lấn. `CACHED_COUNT=0` và không có
commit/push nào xảy ra dưới fingerprint này.
