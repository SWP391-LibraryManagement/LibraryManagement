# Phụ lục H2 về hash staging của hộp thư thông báo cá nhân FE10

- Ngày: 2026-07-28
- Nhánh: `codex/feat-fe10-personal-notification-inbox`
- Head cục bộ đã review trước commit addendum:
  `47efcd20c834dfe34e73ae1aa60ba388a0e8c822`
- Mốc cơ sở hiện tại: `main@804b6957b9e71591eb00fa2ad84d3175e63ffbff`
- PR: #75
- Trạng thái: **ADDENDUM H2 ĐÃ PHÊ DUYỆT**

Phụ lục này bao phủ đợt khắc phục được khoanh vùng, được phát hiện bởi lần
triển khai Azure staging đầu tiên tại exact head. Nó không mở lại hợp đồng
nghiệp vụ hộp thư FE10 đã được phê duyệt theo fingerprint H2 vòng thứ hai
`2b53d7ecd2247aa72e7ae3c43bab5bd00ab48f0e5a97662455fa8d3db736b40c`.

## 1. Định danh phụ lục

- Mục phụ lục: **9** tệp đã sửa đổi.
- Fingerprint phụ lục:
  `f78e0cc9ac7ca5f2f89cb2fe50fe6224c4f02f96fd0492d4674b2e713927f541`.
- Tệp cached/đã stage tại thời điểm fingerprint: **0**.
- Đường dẫn chưa merge: **0**.
- Commit FE10 cục bộ được rebase một cách cơ học từ `b11b59e` qua
  `main@2c0b169` không chồng lấn rồi `main@804b695` thành `47efcd2`.
- Các thay đổi upstream chỉ ảnh hưởng các tệp đăng nhập/khoá tài khoản/đăng ký
  FE02 và không chồng lấn chín tệp phụ lục. `main@2c0b169` trung gian đã đạt
  lần chạy CI `30304860723`; `main@804b695` hiện tại đã đạt lần chạy CI
  `30306335582`.
- Biên bản bằng chứng này được loại trừ khỏi fingerprint để trường quyết định
  của nó có thể cập nhật mà không làm thay đổi phụ lục đã được rà soát.

Thuật toán fingerprint:

1. Đọc `git status --porcelain=v1 -z --untracked-files=all`.
2. Chỉ loại trừ biên bản bằng chứng phụ lục này.
3. Tạo
   `<two-character-status>|<lowercase-file-sha256>|<normalized-path>` cho mọi
   tệp còn lại.
4. Sắp xếp theo đường dẫn phân biệt hoa-thường, nối bằng LF kèm một LF cuối,
   mã hoá UTF-8 không BOM và tính SHA-256.

## 2. Bằng chứng phát hành trước khi phát hiện

- H2 vòng thứ hai đã phê duyệt ứng viên FE10 gồm 49 mục.
- Commit `b11b59ed37c6666e9b459e457517e440d5135565` đã được push lên PR #75.
- Lần chạy CI PR tại exact head `30304661463` đã đạt `foundation-checks` trong
  3m35s.
- PR #75 chỉ được chuyển từ nháp sang sẵn sàng review sau khi CI đó đạt.

## 3. Bằng chứng migration Azure

Các byte migration đã review do operator Windows áp dụng có SHA-256:

```text
6e8b6b4d857170be215ef721d9c3d3d25ff16bbaf7d006821fbba33110d2d114
```

Database staging chính xác đã thay đổi từ không có đối tượng schema FE10 nào
sang schema bắt buộc và migration đã chạy hai lần:

```text
PRE_READAT_COLUMNS=0
PRE_SUPPORTING_INDEXES=0
TOTAL_NOTIFICATIONS_BEFORE=42
ELIGIBLE_HISTORICAL_BEFORE=17
EXCLUDED_BEFORE=25
MIGRATION_RUN_1=PASS
READAT_COLUMNS=1
SUPPORTING_INDEXES=1
HISTORICAL_BACKFILLED=17
ELIGIBLE_STILL_UNREAD_AFTER_RUN1=0
EXCLUDED_STILL_UNREAD_AFTER_RUN1=25
PROTECTED_AGGREGATES_AFTER_RUN1=UNCHANGED
POST_RUN1_PROBE_INSERTED_UNREAD=1
MIGRATION_RUN_2=PASS
POST_RUN1_PROBE_STILL_UNREAD=1
READAT_COLUMNS_AFTER_RUN2=1
SUPPORTING_INDEXES_AFTER_RUN2=1
HISTORICAL_BACKFILLED_AFTER_RUN2=17
POST_RUN1_PROBE_REMOVED=1
FINAL_PROTECTED_AGGREGATES=UNCHANGED
CODEX_FE10_FIREWALL_RULES_REMAINING=0
```

So sánh số liệu tổng hợp bao phủ số dòng notification, số lượng delivery-status, số
lượng `SentAt`, tổng `AttemptCount`, số dòng notification-attempt và số lượng
idempotency-key khác null. Không recipient, nội dung notification, danh tính
người dùng, credential, token hay chi tiết provider nào được ghi log.

## 4. Phát hiện staging và nguyên nhân gốc

Lần triển khai thủ công tại exact head `30305596861` đã checkout `b11b59e`,
nhận `fe10_inbox_migration_confirmed=true` và đọc đúng hash đã lưu dự kiến. Nó
đã từ chối an toàn ở preflight trước khi triển khai backend hoặc frontend.

Cùng văn bản migration UTF-8 không đổi có các hash byte theo nền tảng sau:

```text
LF    143cd8e4c9a1d4f84f8ea3d0fa9dff2effb4edb0128ee51f6a1b60da98e0a43d
CRLF  6e8b6b4d857170be215ef721d9c3d3d25ff16bbaf7d006821fbba33110d2d114
```

Operator Windows đã áp dụng và ghi nhận các byte CRLF. Runner GitHub Ubuntu đã
checkout các byte LF. Vì vậy cổng so sánh raw-byte ban đầu đã từ chối nội dung
không đổi. Đây là lỗi proof đa nền tảng, không phải lỗi migration SQL, lỗi
credential hay khác biệt nội dung.

## 5. Khắc phục tập trung

- Preflight giải mã UTF-8 nghiêm ngặt mà không phát BOM.
- Nó chuẩn hoá văn bản đã checkout thành LF, suy ra biểu diễn CRLF chính xác
  tương ứng và tính SHA-256 cho cả hai chuỗi byte.
- Hash operator đã lưu phải bằng chính xác một trong hai giá trị đó.
- Mọi thay đổi nội dung vẫn bị từ chối; một probe mutation runtime không tạo ra
  hash nào được chấp nhận.
- Hướng dẫn operator tiếp tục yêu cầu băm các byte thực tế đã áp dụng và nay
  ghi lại ranh giới LF/CRLF.
- Tài liệu trạng thái FE10 hiện tại ghi nhận PR, CI, migration, failed-deploy
  và trạng thái addendum thực tế mà không khẳng định staging thành công.

Addendum này không thay đổi API hộp thư, DTO, truy vấn SQL, câu lệnh migration,
component frontend, business rule, dependency, credential hay tài nguyên Azure.

## 6. Bằng chứng TDD và regression

RED:

- Chính sách triển khai: **15/16 đạt, 1 không đạt** vì workflow không suy ra
  hash LF và CRLF.

GREEN sau thay đổi tập trung và rebase không chồng lấn:

| Cổng | Kết quả |
| --- | --- |
| Chính sách triển khai | 16/16 |
| Backend | 69/69 suite, 1114/1114 kiểm thử |
| Tích hợp hệ thống | 10/10 |
| Frontend | 259/259; ESLint đạt; Vite build đạt |
| Chromium E2E | 11/11, gồm FE10 3/3 |
| Trạng thái truy vết | 3/3 |
| Truy vết được ép | ĐẠT; FE10 14/16 = 88% |
| Khoảng trắng diff | ĐẠT |
| Kiểm tra runtime hash | CRLF đã lưu được chấp nhận; LF được chấp nhận; mutation nội dung bị từ chối |

CI PR tại exact head đã cập nhật và triển khai lại staging vẫn được cố ý ghi là
chưa có bằng chứng cho tới khi phụ lục này được phê duyệt, commit và push.

## 7. Các hạng mục vận hành ngoài phụ lục này

- Azure App Service được quan sát có `httpsOnly=false`; phát hiện vận hành này
  đã được đóng sau fingerprint mà không đổi nội dung ứng viên. App staging tại
  exact head hiện báo `httpsOnly=true`, HTTPS `/health` và `/health/ready` trả về
  200, còn HTTP `/health` trả về 301 đến HTTPS.
- `https://www.thuvienhub.io.vn` là URL frontend staging đã cấu hình và trả về
  200. Apex `thuvienhub.io.vn` không có bản ghi địa chỉ trong preflight; nó
  không phải đích workflow đã cấu hình và không được khẳng định.

## 8. Danh sách tệp phụ lục

```text
 M|6f18590e8c6a7a026b6417673a6bba1c6ed6a3bb05001a3634e1f91b5f655672|.github/workflows/deploy-staging.yml
 M|22107ba34aba87dfaa847071714e36183c28938aaf7e1f24c8585f7bf0d8ee6d|.sdd/specs/feat-notification-management/CHANGELOG.md
 M|dd879baf5bdb7973b2511cc091761dd762fff17e8572c8d0e2c26443b8fe3ea3|.sdd/specs/feat-notification-management/CONTEXT.md
 M|0874cf24d4752fe43c30503ea513c9cac95264c05b10e00f63ffeddd12dd3606|.sdd/specs/feat-notification-management/PLAN.md
 M|327ca48ca7c6cb2f348acdda026eea51c4590e83f0b82e1a3af4395b6f250a9b|.sdd/specs/feat-notification-management/SPEC.md
 M|5cb51057dfe69ca581edd0ce27230ac5cef018fe1556b47e258a155b6b5331bb|.sdd/specs/feat-notification-management/TASKS.md
 M|1432ec850fd4aa97da15e48bae68279d66fed3ef3aba1145933ffa32742f7772|.sdd/specs/feat-notification-management/TEST_PLAN.md
 M|54e0f5f138bc1776804cf318eb80a2c924d1efec3268d726822bcda99ccbd9fe|docs/deployment/azure-staging-guide.md
 M|3ca62a39e1ec720a3723285c6b24cf7df8a03cba7a5b7906ec4cb6f513abdfd6|tests/deployment/stagingWorkflowPolicy.test.js
```

## 9. Quyết định phụ lục H2 của người duyệt

Người dùng đã phê duyệt chính xác phụ lục này trong task đang hoạt động vào
2026-07-28:

```text
duyệt H2 addendum fingerprint f78e0cc9ac7ca5f2f89cb2fe50fe6224c4f02f96fd0492d4674b2e713927f541
```

Quyết định: **ĐÃ PHÊ DUYỆT**.

Phê duyệt chính xác này cho phép stage chín tệp này cùng biên bản quyết định bị
loại trừ, commit chúng trên head FE10 `47efcd2` đã rebase, force-push có lease
lên PR #75 và chạy lại CI cùng triển khai Azure staging tại exact head.
