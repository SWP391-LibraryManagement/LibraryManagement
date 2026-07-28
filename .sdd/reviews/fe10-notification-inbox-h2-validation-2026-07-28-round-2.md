# Xác thực H2 Hộp thư thông báo cá nhân FE10 - Vòng 2

- Ngày: 2026-07-28
- Nhánh: `codex/feat-fe10-personal-notification-inbox`
- Baseline: `main@f3ebe95ed00cef5119d2b6788ebccd72c5cda190`
- Trạng thái: **H2 ĐÃ PHÊ DUYỆT**

Bản ghi này thay thế xác thực H2 đầu sau khi candidate được rebase lên hai
baseline Core-drift đã phê duyệt rồi được đồng bộ cơ học với commit upstream
chỉ-kiểm-thử không chồng lấp sau đó. Không tệp đã review nào được stage hay
commit, và chưa có gì được push dưới fingerprint này.

## 1. Danh tính candidate

- Mục candidate: **49** tệp đã sửa hoặc mới.
- Fingerprint candidate:
  `2b53d7ecd2247aa72e7ae3c43bab5bd00ab48f0e5a97662455fa8d3db736b40c`.
- SHA-256 migration:
  `6e8b6b4d857170be215ef721d9c3d3d25ff16bbaf7d006821fbba33110d2d114`.
- Baseline candidate và `origin/main`:
  `f3ebe95ed00cef5119d2b6788ebccd72c5cda190`.
- Ahead/behind baseline candidate: **0/0**.
- Tệp cached/staged tại thời điểm fingerprint: **0**.
- Đường dẫn chưa merge và conflict marker: **0**.
- Bản ghi xác thực vòng 2 này bị loại có chủ ý khỏi fingerprint candidate để
  quyết định con người có thể được ghi mà không đổi candidate sản phẩm/spec đã
  review.

Thuật toán fingerprint:

1. Đọc `git status --porcelain=v1 -z --untracked-files=all`.
2. Chỉ loại
   `.sdd/reviews/fe10-notification-inbox-h2-validation-2026-07-28-round-2.md`.
3. Với mỗi tệp còn lại, tạo
   `<two-character-status>|<lowercase-file-sha256>|<normalized-path>`.
4. Sắp mục theo đường dẫn phân biệt hoa/thường.
5. Ghép mục bằng LF, gồm một LF cuối, mã hóa UTF-8 không BOM và tính SHA-256.

## 2. Đối soát H1 và phạm vi

- Người dùng phê duyệt thiết kế FE10 v0.5.0, SPEC bằng văn bản và kế hoạch triển
  khai FE10-I01..I08.
- Governance PR #70 merge là `25c09ec`.
- Candidate lần đầu đối soát với phụ lục trôi H1 đã phê duyệt
  `main@5a3c84b`, rồi với phụ lục trôi H1 đã phê duyệt `main@db97f17`.
- Đồng bộ `main@f3ebe95` sau đó chỉ đổi ba tệp kiểm thử frontend upstream ngoài
  đường dẫn candidate và áp dụng không xung đột.
- Cả hợp đồng upstream và FE10 vẫn hiện diện trong API frontend dùng chung và
  stylesheet shell.
- Không thêm xóa, archive, dọn dẹp retention, notification log toàn cục, URL
  action tùy ý, mục inbox authentication/setup nhạy cảm hay tính tiền phạt FE09.

## 3. Review bốn tầng

### L1 - Hợp đồng và truy vết

**ĐẠT**

- SPEC v0.5.0, PLAN, TASKS, CONTEXT, TEST_PLAN, CHANGELOG, kiến trúc, OpenAPI,
  hướng dẫn triển khai, hướng dẫn người dùng và trạng thái triển khai thống nhất.
- Phạm vi cục bộ FE10-I01..I08 được triển khai và xác thực; H2, Azure staging,
  H3, merge và bằng chứng hậu merge được giữ không khẳng định rõ ràng.
- Truy vết được ép đạt FE10 **14/16 FR tag = 88%**, trên cổng 70% repository.
  Kiểm thử trạng thái truy vết đạt **3/3**.

### L2 - Chất lượng tự động

**ĐẠT**

| Cổng | Kết quả quan sát |
| --- | --- |
| Coverage backend | 69/69 suite, 1114/1114 kiểm thử |
| Coverage | 91.84% statement, 80.70% branch, 97.59% function, 91.76% line |
| Frontend | 258/258 kiểm thử; ESLint đạt; Vite production build đạt |
| Backend inbox và fan-in tập trung | 8/8 suite, 300/300 kiểm thử trước sửa nhất quán bảo mật cuối |
| Frontend inbox và shell tập trung | 39/39 kiểm thử |
| Policy triển khai | 15/15 kiểm thử |
| Tích hợp hệ thống | 10/10 kiểm thử |
| Chromium E2E | 11/11; riêng FE10 3/3 |
| Git whitespace | Kiểm tra candidate sản phẩm/spec đạt; xem ghi chú bản ghi governance bên dưới |
| Audit phụ thuộc backend | 0 lỗ hổng |
| Quét secret thêm có độ tin cậy cao | 0 phát hiện thật trên 49 tệp candidate |

Ba khớp văn bản secret-scan là fixture kiểm thử `Password1!` tổng hợp; không cái
nào là secret được thêm. Audit frontend báo `GHSA-qwww-vcr4-c8h2` cho phiên bản
React Router đã pin, nhưng advisory chính thức giới hạn vấn đề ở API RSC không ổn
định. Ứng dụng này chỉ dùng Declarative Mode (`BrowserRouter`, `Routes` và
`Route`), và policy `audit:high` fail-closed của repository đạt trong khi cũng
assert không API RSC nào được đưa vào.

Sau stage, `git diff --cached --check` đầy đủ chỉ báo ba GFM hard-break có chủ ý
trong bản ghi H2 ngày 2026-07-27 đã bị thay thế. Bản ghi bất biến đó là một phần
fingerprint đã phê duyệt. Cùng kiểm tra loại hai bản ghi governance H2 đạt với
exit code `0`; không dòng sản phẩm, kiểm thử, workflow, SPEC hay hướng dẫn vận
hành nào có lỗi whitespace.

### L3 - Nghiệp vụ và bảo mật

**ĐẠT**

- Liệt kê, đếm, đánh dấu một và đánh dấu tất cả gắn `UserId` đã xác thực và dùng
  allowlist inbox type/template dương chính xác trong SQL.
- `ACCOUNT_VERIFICATION`, `PASSWORD_RESET`, `EMAIL_VERIFY`, `ACCOUNT_SETUP`,
  hàng không người dùng, hàng người dùng khác và hàng type/template không khớp
  vẫn ngoài inbox.
- ID đánh dấu một thiếu, nhạy cảm và khác người dùng dùng cùng `404` an toàn.
- DTO phản hồi có đúng bảy trường an toàn và không lộ recipient, payload,
  idempotency, provider, attempt, delivery-error hay metadata nguồn.
- `actionPath` do backend suy ra dùng allowlist relative cố định; frontend kiểm
  tra cùng allowlist trước điều hướng.
- Đầu vào SQL có tham số, bộ lọc ownership áp dụng trong SQL và offset
  maximum-contract được gắn SQL `BIGINT`.
- `ReadAt` trực giao trạng thái gửi, thời điểm gửi, lần thử, kết quả nguồn và
  idempotency. Replay đánh dấu một và đánh dấu tất cả là lũy đẳng.
- Yêu cầu đếm dùng chung không chồng lấp, làm mới sau chuyển route/auth, focus,
  thay đổi storage, thay đổi đọc và mỗi 60 giây.
- Lỗi thay đổi đọc hiển thị phản hồi an toàn nhưng không chặn business route đã
  allowlist.

Review bảo mật cuối phát hiện helper SQL `listPending` legacy bỏ `ACCOUNT_SETUP`
khỏi bộ lọc type nhạy cảm phủ định, trong khi đường `claimNextPending` hoạt động
và triển khai in-memory đã loại nó. Kiểm thử RED tái hiện sự không nhất quán.
Sửa production nhỏ nhất thêm `ACCOUNT_SETUP` vào loại trừ cả type và template;
kết quả tập trung là **3/3 suite, 161/161 kiểm thử**, sau đó backend đầy đủ
**69/69 suite, 1114/1114 kiểm thử**. Không còn phát hiện bảo mật chặn.

### L4 - An toàn migration và phát hành

**CỤC BỘ ĐẠT; CỔNG BÊN NGOÀI CHỜ THEO THIẾT KẾ**

- Migration dùng SQL Server SET option bắt buộc, giao dịch, `XACT_ABORT`, compile
  động sau thêm `ReadAt`, backfill lượt đầu chính xác và tạo index lũy đẳng.
- Cơ sở dữ liệu SQL Server dùng một lần thực thi migration chính xác hai lần và
  trả:

```text
ReadAtColumns=1
SupportingIndexes=1
HistoricalBackfilled=5
PostRunStillUnread=1
ExcludedStillUnread=6
RowsAfterRun2=12
AttemptsAfterRun2=13
KeysAfterRun2=12
ProtectedAggregatesUnchanged=1
DisposableDatabasesRemaining=0
```

- Đường staging tự động và thủ công fail-closed trừ khi SHA-256 migration
  checkout bằng `FE10_INBOX_MIGRATION_SHA256`.
- Triển khai thủ công bổ sung yêu cầu
  `fe10_inbox_migration_confirmed=true`.
- Thứ tự triển khai là preflight, backend, frontend rồi smoke.
- Azure migration thực, staging deployment exact-branch, xác minh trực tiếp ba
  vai trò, H3, merge, CI hậu merge và triển khai main tự động cố ý chờ đến sau
  phê duyệt H2 và công bố.

## 4. Phát hiện đã đóng trước H2 vòng 2

| ID | Mức độ | Phát hiện | Cách giải quyết |
| --- | --- | --- | --- |
| H2-FE10-001 | High | SQL Server compile cập nhật `ReadAt` lịch sử trong cùng batch trước khi cột mới tồn tại. | Thêm bao phủ RED, chuyển compile cập nhật/index sau `sys.sp_executesql`; rehearsal hai lượt nghiêm ngặt đạt. |
| H2-FE10-002 | Medium | Token tổng hợp FE09 nhận 401 từ yêu cầu đếm nền mới và chuyển route E2E sang login. | Chỉ mock endpoint nền mới trong fixture FE09; Chromium đầy đủ đạt mà không làm yếu xử lý 401 thực. |
| H2-FE10-003 | Medium | Trang tối đa hợp đồng hợp lệ có thể tạo offset lớn hơn SQL `INT`. | Thêm assertion repository RED, chỉ gắn `@Offset` là SQL `BIGINT` và xác minh offset tối đa trên SQL Server. |
| H2-FE10-004 | Low | Nội dung trạng thái hiện tại vẫn nói I01..I07 hoặc triển khai chưa bắt đầu. | Đồng bộ truy vết và tài liệu trạng thái hiện tại không đổi hành vi. |
| H2-FE10-005 | Medium | `listPending` legacy không loại `ACCOUNT_SETUP` nhất quán với selector hoạt động. | Thêm kiểm thử nhất quán bảo mật RED và loại `ACCOUNT_SETUP` theo cả type lẫn template; backend đầy đủ đạt. |

Không phát hiện Critical, High, Medium hay Low mở nào còn trong candidate cục bộ
đã review.

Giới hạn phát hành đã biết được nêu rõ thay vì coi là hoàn tất:

- Azure staging chưa chạy cho candidate chưa commit này.
- F1 producer worker vẫn best-effort theo thiết kế.
- Advisory router frontend đã pin chỉ được chấp nhận dưới ràng buộc
  Declarative-Mode/no-RSC được ép bên trên.

## 5. Manifest candidate

```text
 M|5155db679c33485fb377ce9c42bd6f395b87d8ae8232ec6945acccfe8361f0db|.agents/CLAUDE.md
 M|30b6bb6d86ce10953f9a101ea183486ba32d177bc8e517d357a5a953c7db487f|.github/workflows/deploy-staging.yml
??|e979d3632c601d5496fa537999344ef5bd799a62d0845bd56b09afe0c1a159f7|.sdd/reviews/fe10-notification-inbox-h2-validation-2026-07-27.md
 M|80595f9e499499ab49a58ecc7a97091828c5af2df790a45b583b3596d4189a60|.sdd/specs/feat-notification-management/CHANGELOG.md
 M|27dc8f4d0811d4b16da1379da5fd0d9db455d4f364e1a9d1c7200ce87fde8d63|.sdd/specs/feat-notification-management/CONTEXT.md
 M|f56e8680241f3591ea066d11f400faca19a1df9ab3974bd5bb805a8273d463af|.sdd/specs/feat-notification-management/PLAN.md
 M|097f4e177b4dfde106b7d19fa8651a73006dd2182704f8fd817b5b5d0bd0075c|.sdd/specs/feat-notification-management/SPEC.md
 M|674eec9a7979cb496d5273469425dd3d72ff44bc7e8d7991ad0e9d6208d02148|.sdd/specs/feat-notification-management/TASKS.md
 M|f6f567fa0656cbb1b13ffacc11dc668dda36e4ea5d17b0e194cbd6d76476e49f|.sdd/specs/feat-notification-management/TEST_PLAN.md
 M|f8935cbbe6aeef5929551e76c9269a850164a61867d0b54819d73c51518f9e87|backend/src/controllers/notificationController.js
 M|1a660891081188914b75c2675cd78ff242645ebb0bce30295cff844a8a104532|backend/src/docs/openapi.yaml
 M|45e0985ff360934561c435108129e7eef3aca761dfa2bfd2ec4012b632db8497|backend/src/models/Notification.js
 M|69431b35de2a2184a6bb324b00c7dfbf32d2c43e6993e06bf722c7b20b038e75|backend/src/repositories/notificationRepository.js
 M|481a58fbd8827543540e681d6c891eb586fefdf36bd1c7e2a49690e02eb1b7f2|backend/src/routes/notificationRoutes.js
 M|7cf429d8749d3ebb41dbdec7c4163ebceb2f3e335716265582e76a012a899d80|backend/src/services/notificationService.js
??|976bfe83f49644a3b6a681905f7ae3238b41b2c6103f0f227f552dc64fdcaf71|backend/src/utils/notificationInbox.js
 M|876ed4e7ec783e688705d7198e51fa8147421581ccb0843720c7db8a6bea7714|backend/src/validators/notificationValidators.js
 M|da9da91d5a1cbd692f42ae07caf6d1b61409247ae86ff826b7c10a59bcbf5d5a|backend/tests/helpers/inMemoryNotificationRepositories.js
 M|92afeaf998ec82e56279646c7951a78502f3c2d2bff7aa7a1976ca0ec8fc904d|backend/tests/helpers/systemIntegrationHarness.js
 M|a4fad5081a5281bf378888689f84d0748ae9a750912b279af01ff18c6b172523|backend/tests/integration.test.js
??|5a7937a8a395a3446cb90b5c1de255242b25114b79a6ac80b0af28400ffe1b39|backend/tests/notificationInboxMigration.test.js
??|7bb3b0680648515691fd01766d73446ffd31bab918265e3dae0b65843d2abc8d|backend/tests/notificationInboxRepository.test.js
 M|d95b65f07b15396226e2a623c909777a105a439e7ca8b0fbcffb1adf38902faf|backend/tests/notificationRepository.test.js
 M|d9edebf005b03079f8155f10076faa4f69564f717cd2fe11faa76cbe59bb2457|backend/tests/notificationRoutes.test.js
 M|8d741a26f05d443fe74090c0eb766dd691cd45947126333908e2c68dd49bf611|database/Librarymanagement.sql
??|6e8b6b4d857170be215ef721d9c3d3d25ff16bbaf7d006821fbba33110d2d114|database/migrations/2026-07-27-fe10-personal-inbox-read-state.sql
 M|a3bc88af7f4e98ba660a84587100f70d1a7a5883cda431d3594e484d2434b129|docs/architecture/feature-integration-map.md
 M|fa78dcace20b3822d0af2a6b7caa769b6e1dc35621f6d07d2ec38760edfea2e1|docs/architecture/system-architecture.md
 M|b5e731a88618526939f575be3585b646e60be089ca7089fdae4cee6b5bcbcd18|docs/deployment/azure-staging-guide.md
 M|0dd836091a2afaa50fa3c8555942c23c95e789e2ebf8b860a6d7bc86f3909f21|docs/superpowers/plans/2026-07-27-fe10-personal-notification-inbox.md
 M|d2f2e031fe195d449b6431dceeefb28ed319a2847bce6d46dfb1f9c6c9fbd372|docs/superpowers/specs/2026-07-27-fe10-notification-inbox-expansion-design.md
 M|b5dc1404258a486dfe465497f8e8e36b6024257c4bc254eaf30bff3fbd02025d|docs/testing/master-test-plan.md
 M|18493952907f00d2cc4a72acbf1088c063b6ed103f6482504a1bb600479e0837|docs/user-manual.md
 M|4b6a961dd83521d3edcbb6499fb0b08bc4c6b679b8a26c0e7aa06c1061234a35|frontend/src/api/apiErrorMessages.js
 M|8f89b50ad97c8d24bad40bd6db089f4ca5151eadd6cc11a3586cbfc701fb1b2f|frontend/src/api/libraryFeatureApi.js
 M|005be9c2d1b9279562f06ecea93ca7e0efb8222be404cb31f496e7fc86550241|frontend/src/App.jsx
??|ef7c2ac784a8bf0f48cdd3ff8593af6891b45a1733d06214d2f4494eac4b52e2|frontend/src/component/auth/AuthenticatedRouteGuard.jsx
 M|d9323f38beda03679ef97d1dda24dcacbc4012bee8cf465a02d5ffe042a481f4|frontend/src/component/layout/Header.jsx
??|f672f3ef820343431b091f5f8fabc17f7e74b18501fa563e28274ce90fed493a|frontend/src/component/notification/NotificationBell.jsx
??|620271d2b7319cebb8e9be609eca63af822811ce5001655f0569b0e7c713e3a7|frontend/src/context/NotificationInboxContext.jsx
??|e39fcf6982b488c9b8df54ba9ec17826a6bf51e9fb886f60502d6dc94df7d502|frontend/src/page/notification/NotificationsPage.jsx
 M|67f36d22ffb99894e89ad09e4268d0697b62646d0964c263ef0d419b7d8bbfa0|frontend/src/styles/app-shell.css
??|fce2174bbe273a43142dbfc1f55a811a5d9acf83ccf60b8fcf2ef2229acbd3c4|frontend/src/utils/notificationInboxViewModel.js
 M|07c999eac3208cb07c3ef1299619f1855847e7c2290772535d065ac80a3bc1cf|frontend/test/appShellFrontend.test.js
??|3840d9b20450799689678e5a6f881d10cb0dc954538a7d8b05ad46228f5e1758|frontend/test/notificationInboxFrontend.test.js
 M|4dc4d17d9970d5f8acfa1d7af94fe2ac784bc67ba1175549b3a61b0f4824a7c7|tests/deployment/stagingWorkflowPolicy.test.js
 M|e1fc71ff5769b60ceb986eb8480d456c313bd9e7584992dd23024a959ede32c5|tests/e2e/fe09-fine-management.spec.js
??|d5be78f15340be11782f90dfb75df74062e743323dc953348b6d2fb9cee1d6eb|tests/e2e/fe10-notification-inbox.spec.js
 M|7d71c0c33860b7a1bb5f9ca5889e6c0525444f581b0e2338e0ff9ae511ad2600|tests/e2e/support/systemTestServer.js
```

## 6. Quyết định H2 của con người

Người dùng đã phê duyệt candidate chính xác này trong task đang hoạt động ngày
2026-07-28:

```text
duyệt H2 fingerprint 2b53d7ecd2247aa72e7ae3c43bab5bd00ab48f0e5a97662455fa8d3db736b40c
```

Quyết định: **ĐÃ PHÊ DUYỆT**.

Phê duyệt chính xác này cho phép stage candidate đã review cùng bản ghi quyết
định bị loại này, commit, push nhánh và công bố pull request. Mọi thay đổi nội
dung candidate sau phê duyệt làm mất hiệu lực thẩm quyền và cần quyết định H2
mới.
