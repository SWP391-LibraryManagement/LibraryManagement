# Xác thực H2 Hộp thư thông báo cá nhân FE10 - Vòng 4

- Ngày: 2026-07-28
- Nhánh: `codex/feat-fe10-personal-notification-inbox`
- Baseline: `main@a240705fbd486304464b073cbd3caec77a1fa135`
- Head đã commit sau rebase: `883157124edf295f12683548754a881383431664`
- Trạng thái: **H2 ĐÃ PHÊ DUYỆT**

Bản ghi này thay thế vòng 3 sau khi fetch bắt buộc trước stage phát hiện hợp đồng
FE11 upstream mới hơn. Người dùng phê duyệt
`H1 drift addendum main@a240705`; CI upstream `30311801599` và lượt Azure
staging `30311973740` đạt, rebase hoàn tất không xung đột và không tệp candidate
nào được stage hoặc commit.

## 1. Danh tính candidate

- Mục candidate: **17** tệp đã sửa hoặc mới.
- Fingerprint candidate:
  `f41dbf50680d9c5601ae00d3c53651a7bb782ff81724ca641ef49b7cd88844e4`.
- Baseline candidate và `origin/main`:
  `a240705fbd486304464b073cbd3caec77a1fa135`.
- Nhánh đã commit ahead/behind `origin/main`: **2/0**.
- Tệp cached/staged tại thời điểm fingerprint: **0**.
- Đường dẫn chưa merge và conflict marker: **0**.
- Bản ghi xác thực vòng 4 này bị loại có chủ ý khỏi fingerprint candidate để
  quyết định con người có thể được ghi mà không đổi khắc phục đã review.

Thuật toán fingerprint:

1. Đọc `git status --porcelain=v1 --untracked-files=all`.
2. Chỉ loại
   `.sdd/reviews/fe10-notification-inbox-h2-validation-2026-07-28-round-4.md`.
3. Với mỗi tệp còn lại, tạo
   `<two-character-status>|<lowercase-file-sha256>|<normalized-path>`.
4. Sắp mục theo đường dẫn chuẩn hóa phân biệt hoa/thường.
5. Ghép mục bằng LF, gồm một LF cuối, mã hóa UTF-8 không BOM và tính SHA-256.

## 2. Đối soát H1 và phạm vi

- Thiết kế FE10 v0.5.0, SPEC và FE10-I01..I08 vẫn là hợp đồng đã phê duyệt;
  governance PR #70 merge là `25c09ec`.
- PR head trước `28c4f80` giữ bằng chứng CI/Azure/live exact-head lịch sử,
  nhưng không chứng minh khắc phục H3 này.
- `main@a240705` loại API, UI, kiểm thử và hợp đồng sửa người dùng Quản trị
  FE11. Nó không chồng đường dẫn với khắc phục FE10 17 mục. Rebase và kiểm tra
  merge-tree đã commit không xung đột.
- Tree đã rebase giữ cả hai hợp đồng độc lập: FE11 chỉ hiển thị thao tác người
  dùng tạo/vai trò/vô hiệu hóa đã phê duyệt, trong khi FE10 giữ hộp thư cá nhân,
  migration trạng thái đọc, bộ lọc ownership và loại trừ nhạy cảm.
- Khắc phục này không đổi backend, cơ sở dữ liệu, migration, workflow triển
  khai, API, phân quyền, trạng thái gửi hay hành vi bản ghi nhạy cảm.

## 3. Review bốn tầng

### L1 - Hợp đồng và truy vết

**ĐẠT**

- ADR-002 ghi `ReadAt`, điều kiện hợp lệ, index, tính lặp migration, hash triển
  khai và rollback.
- FE10 SPEC/PLAN/TASKS/CONTEXT/TEST_PLAN/CHANGELOG, ngữ cảnh agent, master test
  plan, design, lịch sử H2, lịch sử v0.4.5 và closeout H3 thống nhất.
- Kiểm thử trạng thái truy vết qua 3/3. Bao phủ FE10 được ép là 14/16 (88%),
  trên ngưỡng repository 70%; FE11 vẫn trên ngưỡng 35/43 (81%) sau loại thao tác
  sửa đã phê duyệt.

### L2 - Chất lượng tự động

**ĐẠT**

| Cổng | Kết quả mới trên `main@a240705` |
| --- | --- |
| Coverage backend | 69/69 suite, 1084/1084 kiểm thử |
| Coverage | 91.84% statement, 80.70% branch, 97.59% function, 91.76% line |
| Frontend | 259/259 kiểm thử; ESLint đạt; Vite production build đạt |
| Policy triển khai | 20/20 kiểm thử |
| Tích hợp hệ thống | 10/10 kiểm thử |
| Trạng thái truy vết | 3/3 kiểm thử |
| Chromium E2E | 11/11; riêng FE10 3/3 |
| Chuẩn bị schema Azure | PASS |
| Git whitespace | `git diff --check` PASS |
| Audit phụ thuộc backend | 0 lỗ hổng |
| Cổng high audit frontend | PASS chỉ có advisory unstable-RSC không áp dụng đã được ép |
| Quét secret thêm có độ tin cậy cao | 0 phát hiện |
| Quét mâu thuẫn cũ, marker chưa hoàn tất và xung đột | 0 phát hiện |

Số kiểm thử backend giảm từ 1116 xuống 1084 vì commit upstream đã phê duyệt xóa
kiểm thử sửa người dùng FE11 lỗi thời. Cả 69 suite vẫn chạy và bao phủ
FE10 tập trung/đầy đủ/trình duyệt vẫn tồn tại.

### L3 - Nghiệp vụ, UI và bảo mật

**ĐẠT**

- Lượt đọc thành công không điều hướng tải lại trang `/notifications` hiện tại.
- Đánh dấu tất cả vẫn khả dụng trên trang đã lọc rỗng và chỉ bị vô hiệu khi đang
  tải hoặc thay đổi.
- Popover giữ độ rộng desktop đã phê duyệt (`380px`) trong khi topbar chứa nó
  tăng lên `z-index: 100` chỉ ở trạng thái mở. Chromium xác minh điểm popover
  lấy mẫu là phần tử được vẽ trên cùng.
- Ownership, điều kiện hợp lệ dương, `404` an toàn IDOR, DTO an toàn bảy trường,
  allowlist action backend/frontend và loại trừ nhạy cảm không đổi so với triển
  khai FE10 đã deploy.
- Quét secret dòng thêm trả về không. Identifier nhạy cảm lịch sử chỉ xuất hiện
  trong loại trừ repository rõ ràng và kiểm thử phủ định.

### L4 - An toàn migration và phát hành

**KHẮC PHỤC CỤC BỘ ĐẠT; CỔNG BÊN NGOÀI CHỜ THEO THIẾT KẾ**

- Migration FE10 đã review và cổng hash Azure không đổi từng byte.
- Chuẩn bị schema tương thích Azure đạt từ checkout đã rebase.
- Azure staging hiện tại phục vụ `main@a240705`, CI và triển khai của nó đạt,
  nhưng không phục vụ khắc phục FE10 chưa commit này.
- Sau H2, exact head mới phải qua CI PR, deploy Azure và lặp xác minh Azure SQL/
  API/trình duyệt trước H3 vòng hai.

## 4. Manifest candidate

```text
 M|39effb912a54f6ca1783bd8252aa3ebf2cf4477628884770fcca72ae026c3061|.agents/CLAUDE.md
??|34760a84506fd249f0b49c6ab0081a353c68d946fe4d863c26c8385d15f8b119|.sdd/reviews/fe10-notification-inbox-h2-validation-2026-07-28-round-3.md
??|1946497e0ba8be5c98fd09bbac636e285e58d58934ec9e85bf645fa2ce3c11df|.sdd/reviews/fe10-notification-inbox-staging-h3-closeout-2026-07-27.md
 M|e1a1f12bc2890fbdc916dd0dd87e5b9bdd6acf3bd15b58f1e907b001ab1d85f6|.sdd/reviews/staging-email-delivery-remediation-validation-2026-07-27.md
 M|56d3c92ad63830b2edb5d98d91290896ce21c9b064418414d4464cde40826e6e|.sdd/rfcs/ADR-002-database-design.md
 M|46fa1da652427864564ac4a07d66dca56743928cb991610ab35f83cd3a55d44c|.sdd/specs/feat-notification-management/CHANGELOG.md
 M|f4d31ad1ff454252b179182e652e68ffb44f774918879c7bca40094cddaa7747|.sdd/specs/feat-notification-management/CONTEXT.md
 M|8c1c17d90cc71d5dcdcae2272ae75321a90f0a2eab0a536f8bfcd27dd79b6838|.sdd/specs/feat-notification-management/PLAN.md
 M|48b188b2a1d722b4cbb5d56ecdeca91f10eef6647adc181f8b8302d3751fc51d|.sdd/specs/feat-notification-management/SPEC.md
 M|92de63568b83aebd84699ddb0ce8f52f907f107a484ee42751620096bc86ba15|.sdd/specs/feat-notification-management/TASKS.md
 M|a83bf35f73ec302512d4fb5711de0fc3b47ba988cdf884c4a934e6987fd51c2b|.sdd/specs/feat-notification-management/TEST_PLAN.md
 M|30453ecb7765fe2d1e8594f2aee60b28627bb84dd024a18a405f0f81391a3fc3|docs/superpowers/specs/2026-07-27-fe10-notification-inbox-expansion-design.md
 M|de1ae17d95ba9fa4c02cdf4eaa6882f1716d3dfa1d3ffa30b971fea8959d2012|docs/testing/master-test-plan.md
 M|54ef3cfb5536a8dfe58078dd44acc4856a12b11f582ab3167bafb32bb499000b|frontend/src/page/notification/NotificationsPage.jsx
 M|d1d0457b076d898829c4070b97a6ef001f735c37e275a6733afbda74588cb823|frontend/src/styles/app-shell.css
 M|b000f739fc7af49210da7622bbae6936babaf8c0fc60754b74933523179ca22b|frontend/test/notificationInboxFrontend.test.js
 M|229763feda67501cfa27cdad3385e7805e9a27a1d9419ef1a7573577eac89c15|tests/e2e/fe10-notification-inbox.spec.js
```

## 5. Quyết định H2 của con người

Người dùng đã phê duyệt candidate chính xác trong task đang hoạt động:

```text
duyệt H2 fingerprint f41dbf50680d9c5601ae00d3c53651a7bb782ff81724ca641ef49b7cd88844e4
```

Quyết định: **ĐÃ PHÊ DUYỆT**.

Quyết định này cho phép stage candidate 17 mục chính xác này cùng bản ghi quyết
định bị loại, commit, force-push with lease protection và bắt đầu xác minh
CI/Azure exact-head. Mọi thay đổi nội dung candidate sau phê duyệt làm mất hiệu
lực thẩm quyền.
