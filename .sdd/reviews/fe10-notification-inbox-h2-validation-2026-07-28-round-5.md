# Xác thực H2 Hộp thư thông báo cá nhân FE10 - Vòng 5

- Ngày: 2026-07-28
- Nhánh: `codex/feat-fe10-personal-notification-inbox`
- Baseline: `main@a240705fbd486304464b073cbd3caec77a1fa135`
- Head đã commit hiện tại: `3f9f23a0bc8705590a977e31b03b05a6d2845628`
- Trạng thái: **H2 ĐÃ PHÊ DUYỆT**

Phụ lục hữu hạn này tồn tại vì H3 vòng hai phát hiện một mâu thuẫn chỉ vòng đời
sau khi candidate đã được phê duyệt vòng 4 được commit, công bố, kiểm thử và
triển khai. Nó không thay đổi runtime, API, cơ sở dữ liệu, migration, phân
quyền, CSS hay hành vi kiểm thử. Nó chỉ thay cách diễn đạt trước-H2/trạng thái
hiện tại bằng các sự kiện chính xác hiện đã xảy ra.

## 1. Danh tính candidate

- Mục candidate: **10** tệp tài liệu đã sửa.
- Fingerprint candidate:
  `6f12878cf3f68bf3d84cf22d4489328da1bd2ef6a54f8725570713430521c6f7`.
- Baseline candidate và `origin/main`:
  `a240705fbd486304464b073cbd3caec77a1fa135`.
- Tệp cached/staged tại thời điểm fingerprint: **0**.
- Bản ghi quyết định vòng 5 này được loại có chủ ý khỏi fingerprint candidate để
  quyết định con người có thể được ghi mà không đổi văn bản closeout đã review.

Thuật toán fingerprint:

1. Đọc `git status --porcelain=v1 --untracked-files=all`.
2. Chỉ loại
   `.sdd/reviews/fe10-notification-inbox-h2-validation-2026-07-28-round-5.md`.
3. Với mỗi tệp còn lại, tạo
   `<two-character-status>|<lowercase-file-sha256>|<normalized-path>`.
4. Sắp mục theo đường dẫn chuẩn hóa phân biệt hoa/thường.
5. Ghép mục bằng LF, gồm một LF cuối, mã hóa UTF-8 không BOM và tính SHA-256.

## 2. Phạm vi đã review

- Ghi fingerprint H2 vòng 4 `f41dbf50...` là đã phê duyệt.
- Ghi PR head chính xác `3f9f23a`, CI exact-head `30313721511` và triển khai
  Azure staging `30313949983` là đã đạt.
- Ghi health frontend/backend công khai, inbox được bảo vệ `401`, CORS đã phê
  duyệt, cardinality `ReadAt`/index Azure SQL chính xác và bằng chứng cleanup.
- Giữ bằng chứng trực tiếp ba vai trò lịch sử trên `28c4f80` mà không trình bày
  sai là lượt đã xác thực exact-head mới.
- Đánh dấu H3 lặp lại, phê duyệt H3 rõ ràng, merge và giám sát hậu merge vẫn
  chờ.

## 3. Manifest candidate

```text
 M|e91ab6bebc16b10cdf8bc2fff71ba0b20e9fa9c12849ab48fb8b59b4239e6c70|.agents/CLAUDE.md
 M|dc41c9092f8459bc98f160e35d47dd82e9991603476185207748adbf50cdd275|.sdd/reviews/fe10-notification-inbox-staging-h3-closeout-2026-07-27.md
 M|70a4ea1e6411dbe2f4f10482ee284a8b8e5263e42b7ec768b2ee9e8bcb1cb280|.sdd/specs/feat-notification-management/CHANGELOG.md
 M|523dc8ee81888ac140d199814d0b809b7954759f3cc51ab40a013291312529c7|.sdd/specs/feat-notification-management/CONTEXT.md
 M|0780cd415ec9e835854dccebfa8c303fe01303775358fc5a4a58315991ae4c61|.sdd/specs/feat-notification-management/PLAN.md
 M|14bce06f0f21888bc66ddd64f1cd205ed5f253bfa9ec2b46c447366749706b32|.sdd/specs/feat-notification-management/SPEC.md
 M|481b2509aa1e7ae09182cd87ea701546389555690baec5ae007eac46112b6079|.sdd/specs/feat-notification-management/TASKS.md
 M|e9467383641aba94908aee6f484d58c74aa5dec789fd69abc40af0b61849318d|.sdd/specs/feat-notification-management/TEST_PLAN.md
 M|b191650a110a16c3fb32fc294415db048b8d4c8f50fff7704ac5e9d0802b2f0c|docs/superpowers/specs/2026-07-27-fe10-notification-inbox-expansion-design.md
 M|114277568d500c31dacbb446e06f07d1677df482844fbfbc55e54c837c4ceeb1|docs/testing/master-test-plan.md
```

## 4. Quyết định H2 của con người

Phê duyệt chính xác bắt buộc là:

```text
duyệt H2 fingerprint 6f12878cf3f68bf3d84cf22d4489328da1bd2ef6a54f8725570713430521c6f7
```

Người dùng đã phê duyệt candidate chính xác trong task đang hoạt động:

```text
duyệt H2 fingerprint 6f12878cf3f68bf3d84cf22d4489328da1bd2ef6a54f8725570713430521c6f7
```

Quyết định: **ĐÃ PHÊ DUYỆT**.

Sau phê duyệt, candidate 10 mục chính xác này cùng bản ghi quyết định bị loại có
thể được stage, commit, push và gửi qua CI exact-head trước H3 lặp lại. Mọi thay
đổi nội dung candidate làm mất hiệu lực thẩm quyền.
