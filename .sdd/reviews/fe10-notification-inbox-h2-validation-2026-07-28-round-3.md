# Xác thực H2 Hộp thư thông báo cá nhân FE10 - Vòng 3

- Ngày: 2026-07-28
- Nhánh: `codex/feat-fe10-personal-notification-inbox`
- Baseline: `main@12faeadb9a92fa30cc8dc16aa01467577374c8b0`
- Head đã commit sau rebase: `2dab81c588c3796447d84443a9c3a53aa9516dc1`
- Trạng thái: **H2 ĐÃ PHÊ DUYỆT, SAU ĐÓ BỊ THAY THẾ TRƯỚC KHI DÙNG BỞI DRIFT UPSTREAM**

Bản ghi này bao phủ khắc phục hữu hạn sau H3 vòng một. Nó cũng ghi drift không
chồng lấp được H1 phê duyệt sau đó, chỉ xóa artifact `document/` đã ngừng. Nhánh
rebase không xung đột. Không tệp candidate nào được stage hay commit. Tại
checkpoint fingerprint này, Azure staging phục vụ `main@12faead`, không phải
khắc phục chưa commit này.

Người dùng đã phê duyệt fingerprint vòng 3 chính xác này. Fetch bắt buộc ngay
trước stage phát hiện một commit upstream mới hơn,
`main@a240705fbd486304464b073cbd3caec77a1fa135`, nên thẩm quyền H2 dừng trước
khi dùng. Không tệp đã review nào được stage, commit hay push.

## 1. Danh tính candidate

- Mục candidate: **16** tệp đã sửa hoặc mới.
- Fingerprint candidate:
  `e1143e6ae35d80bbf5ae45f49ab312f84b37fc98615ea877ab39d4699658bb4c`.
- Baseline candidate và `origin/main`:
  `12faeadb9a92fa30cc8dc16aa01467577374c8b0`.
- Nhánh đã commit ahead/behind `origin/main`: **2/0**.
- Tệp cached/staged tại thời điểm fingerprint: **0**.
- Đường dẫn chưa merge và conflict marker: **0**.
- Bản ghi xác thực vòng 3 này bị loại có chủ ý khỏi fingerprint candidate để
  quyết định con người có thể được ghi mà không đổi khắc phục đã review.

Thuật toán fingerprint:

1. Đọc `git status --porcelain=v1 --untracked-files=all`.
2. Chỉ loại
   `.sdd/reviews/fe10-notification-inbox-h2-validation-2026-07-28-round-3.md`.
3. Với mỗi tệp còn lại, tạo
   `<two-character-status>|<lowercase-file-sha256>|<normalized-path>`.
4. Sắp mục theo đường dẫn chuẩn hóa phân biệt hoa/thường.
5. Ghép mục bằng LF, gồm một LF cuối, mã hóa UTF-8 không BOM và tính SHA-256.

## 2. Đối soát H1 và phạm vi

- Người dùng phê duyệt thiết kế FE10 v0.5.0, SPEC bằng văn bản và kế hoạch triển
  khai FE10-I01..I08; governance PR #70 merge là `25c09ec`.
- Candidate H2 trước `28c4f80` đạt CI `30306805399`, Azure deployment
  `30307855616` và xác minh Azure SQL/API/trình duyệt trực tiếp.
- H3 vòng một trả phát hiện hữu hạn về ADR/trạng thái hiện tại, trạng thái trang
  thông báo và popover-stacking.
- Người dùng phê duyệt `H1 drift addendum main@12faead` ngày 2026-07-28. Thay
  đổi vào xóa artifact `document/` đã ngừng, không chồng tệp hay hợp đồng Core
  với khắc phục 16 mục này.
- Candidate này không thay backend, API, SQL migration, schema cơ sở dữ liệu,
  quy tắc phân quyền, ranh giới bản ghi nhạy cảm hay hành vi gửi thông báo.

## 3. Review bốn tầng

### L1 - Hợp đồng và truy vết

**ĐẠT**

- ADR-002 hiện ghi quyết định nullable `ReadAt`, phạm vi hợp lệ chính xác, index
  hỗ trợ, ranh giới lặp, cổng hash Azure và rollback.
- FE10 SPEC/PLAN/TASKS/CONTEXT/TEST_PLAN/CHANGELOG, bộ nhớ dự án, master test
  plan, thiết kế đã phê duyệt, closeout v0.4.5 trước đó và closeout H3 mới thống
  nhất.
- Truy vết được ép đạt FE10 **14/16 FR tag = 88%**, trên cổng 70% repository.
  Kiểm thử trạng thái truy vết đạt **3/3**.

### L2 - Chất lượng tự động

**ĐẠT**

| Cổng | Kết quả mới trên `main@12faead` |
| --- | --- |
| Coverage backend | 69/69 suite, 1116/1116 kiểm thử |
| Coverage | 91.84% statement, 80.70% branch, 97.59% function, 91.76% line |
| Frontend | 259/259 kiểm thử; ESLint đạt; Vite production build đạt |
| Policy triển khai | 20/20 kiểm thử |
| Tích hợp hệ thống | 10/10 kiểm thử |
| Trạng thái truy vết | 3/3 kiểm thử |
| Chromium E2E | 11/11; riêng FE10 3/3 |
| Chuẩn bị schema Azure | PASS |
| Git whitespace | `git diff --check` PASS |
| Audit phụ thuộc backend | 0 lỗ hổng |
| Cổng high audit frontend | PASS chỉ với advisory unstable-RSC không áp dụng đã được ép |
| Quét secret thêm có độ tin cậy cao | 0 phát hiện |
| Quét mâu thuẫn cũ, marker chưa hoàn tất và xung đột | 0 phát hiện |

### L3 - Nghiệp vụ, UI và bảo mật

**ĐẠT**

- Sau đánh dấu đã đọc thành công không điều hướng, `/notifications` tải lại trang
  hiện tại để mục không còn hiển thị chưa đọc.
- Đánh dấu tất cả chỉ bị vô hiệu khi trang hoặc thay đổi đang tải, vì vậy trang
  đã lọc rỗng không thể chặn đọc thông báo tồn tại dưới bộ lọc khác.
- Topbar giữ stack level bình thường, tăng tới `z-index: 100` chỉ khi nó chứa
  popover thông báo mở. Popover giữ rộng `380px` tại viewport desktop đã kiểm
  thử, điểm lấy mẫu của nó là phần tử được vẽ trên cùng trên lớp modal, điều
  hướng, nội dung và toast.
- Schema OpenAPI hộp thư an toàn giữ đóng với thuộc tính bổ sung. Metadata phản
  hồi bị cấm vắng trong mã frontend và controller; schema OpenAPI chỉ-yêu-cầu
  lịch sử vẫn hợp lệ tài liệu hóa trường recipient/source/idempotency cho API
  gửi riêng.
- Identifier nhạy cảm trong mã repository hộp thư chỉ xuất hiện dưới dạng loại
  trừ rõ ràng và trong fixture ranh giới phủ định.

### L4 - An toàn migration và phát hành

**KHẮC PHỤC CỤC BỘ ĐẠT; CỔNG BÊN NGOÀI CHỜ THEO THIẾT KẾ**

- Khắc phục này không sửa migration đã review, schema chuẩn, repository/service/
  route backend, workflow triển khai hay cấu hình Azure.
- Chuẩn bị schema tương thích Azure đạt từ checkout đã rebase.
- Azure migration và xác minh live exact-head lịch sử vẫn là bằng chứng hợp lệ
  cho head `28c4f80`, nhưng không chứng minh khắc phục này.
- Kiểm tra Azure trước H2 mới trả frontend `200`, health backend `ok` và
  readiness `ok`. `GET /api/notifications/mine` trả `404` với
  `Access-Control-Allow-Origin: https://www.thuvienhub.io.vn` đã phê duyệt, xác
  nhận staging checkpoint khỏe nhưng phục vụ `main@12faead` không có route inbox
  FE10 chưa merge. Đó không phải bằng chứng candidate đạt.
- Sau H2, exact head mới phải qua CI PR, deploy Azure staging và lặp xác minh
  Azure SQL/API/trình duyệt trước H3 vòng hai.

## 4. Phát hiện H3 vòng một đã đóng cục bộ

| ID | Phát hiện | Cách giải quyết |
| --- | --- | --- |
| H3-FE10-001 | ADR-002 bỏ quyết định schema/index/migration `ReadAt`. | Thêm hợp đồng schema và rollout/rollback Azure đã phê duyệt. |
| H3-FE10-002 | Tài liệu trạng thái hiện tại mâu thuẫn bằng chứng H2/CI/Azure đã hoàn tất. | Đối soát mọi bản ghi nguồn-sự-thật và closeout đang hoạt động. |
| H3-FE10-003 | Đọc thành công không điều hướng để lại UI chưa đọc cũ. | Tải lại trang hiện tại sau đọc không điều hướng thành công; kiểm thử hồi quy đạt. |
| H3-FE10-004 | Đánh dấu tất cả phụ thuộc số mục trang đã lọc hiện tại. | Chỉ vô hiệu cho tải/thay đổi hoạt động; kiểm thử hồi quy đạt. |
| H3-FE10-005 | Nội dung trang có thể vẽ lên popover mở. | Nâng topbar mở thành `z-index: 100`; assertion độ rộng và lớp trên cùng trình duyệt đạt. |

Không còn phát hiện Critical, High, Medium hay Low cục bộ mở trong candidate H2
này. Azure exact-head và phát hiện H3 lặp lại vẫn không được khẳng định có chủ
ý.

## 5. Manifest candidate

```text
 M|eb01d2c8d495534a8141398d1b4e2a9a9282b47341e4d2cbd8fa0365d6a627b7|.agents/CLAUDE.md
??|0e547678958d8fe46f4d81b28b351d1c92383089cb00ea986320ca3b2f81b089|.sdd/reviews/fe10-notification-inbox-staging-h3-closeout-2026-07-27.md
 M|e1a1f12bc2890fbdc916dd0dd87e5b9bdd6acf3bd15b58f1e907b001ab1d85f6|.sdd/reviews/staging-email-delivery-remediation-validation-2026-07-27.md
 M|56d3c92ad63830b2edb5d98d91290896ce21c9b064418414d4464cde40826e6e|.sdd/rfcs/ADR-002-database-design.md
 M|55c1a0e7af49384b2e675024fe409029ca0e848ad486f0fb2b0bc19139659753|.sdd/specs/feat-notification-management/CHANGELOG.md
 M|8a1b04bd09ef047f2b552f15650e629cd51176061e5e6d1188a65cefe663b6bc|.sdd/specs/feat-notification-management/CONTEXT.md
 M|945e885da6ff3c3b6b5bb2cbdc72398d4acd72ff5dfa0dd5dec5b2c3d98cf27d|.sdd/specs/feat-notification-management/PLAN.md
 M|48b188b2a1d722b4cbb5d56ecdeca91f10eef6647adc181f8b8302d3751fc51d|.sdd/specs/feat-notification-management/SPEC.md
 M|53ab533457e1ea990e063fe064cd369c58937f149f4d78285ab3d14c891f575e|.sdd/specs/feat-notification-management/TASKS.md
 M|3f9fee42c905d5912c514e4effbb45072d1e1eb9fd8ae8a2d431ec7b1f2cd1af|.sdd/specs/feat-notification-management/TEST_PLAN.md
 M|08dbdca03ea3c78c24f76c3b1951ed99c65d09141d61cfee0fd4152b72eb73c0|docs/superpowers/specs/2026-07-27-fe10-notification-inbox-expansion-design.md
 M|de1ae17d95ba9fa4c02cdf4eaa6882f1716d3dfa1d3ffa30b971fea8959d2012|docs/testing/master-test-plan.md
 M|54ef3cfb5536a8dfe58078dd44acc4856a12b11f582ab3167bafb32bb499000b|frontend/src/page/notification/NotificationsPage.jsx
 M|d1d0457b076d898829c4070b97a6ef001f735c37e275a6733afbda74588cb823|frontend/src/styles/app-shell.css
 M|b000f739fc7af49210da7622bbae6936babaf8c0fc60754b74933523179ca22b|frontend/test/notificationInboxFrontend.test.js
 M|229763feda67501cfa27cdad3385e7805e9a27a1d9419ef1a7573577eac89c15|tests/e2e/fe10-notification-inbox.spec.js
```

## 6. Quyết định H2 của con người

Người dùng đã phê duyệt candidate chính xác bằng:

```text
duyệt H2 fingerprint e1143e6ae35d80bbf5ae45f49ab312f84b37fc98615ea877ab39d4699658bb4c
```

Quyết định: **ĐÃ PHÊ DUYỆT, SAU ĐÓ BỊ THAY THẾ TRƯỚC KHI DÙNG**.

Fetch trước stage nâng `origin/main` từ `12faead` lên `a240705`. Commit upstream
đơn đó loại thao tác sửa người dùng Quản trị FE11 qua 24 tệp. Nó không chồng
đường dẫn với khắc phục H3 16 mục, merge-tree đã commit sạch và CI `main` chính
xác `30311801599` đạt. Tuy vậy, base đổi sau fingerprint nên cần phụ lục trôi H1
mới, rebase, xác thực đầy đủ, fingerprint và quyết định H2.

Người dùng sau đó phê duyệt `H1 drift addendum main@a240705`. Azure deployment
upstream `30311973740` đạt và nhánh rebase không xung đột tới head đã commit
`8831571`. H2 vòng 3 này vẫn là lịch sử, không thể dùng lại; một matrix đầy đủ
và quyết định H2 mới vẫn bắt buộc.
