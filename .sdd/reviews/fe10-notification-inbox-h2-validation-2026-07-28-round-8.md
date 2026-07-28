# Xác thực H2 Hộp thư thông báo cá nhân FE10 - Vòng 8

- Ngày: 2026-07-28
- Nhánh: `codex/feat-fe10-personal-notification-inbox`
- Baseline được H1 phê duyệt: `main@30f936d644c2034bbbf9cb4e01ba25feab31595c`
- Head đã commit sau rebase: `c72bc77f996a160333c2cb7ee4399f3d591fe17c`
- Trạng thái: **H2 ĐÃ PHÊ DUYỆT**

Fetch bắt buộc trước stage sau vòng 7 phát hiện `main@30f936d`. Người dùng phê
duyệt phụ lục trôi H1. Commit upstream đó dịch tài liệu SDD sang tiếng Việt mà
không đổi runtime, API, cơ sở dữ liệu, migration, UI, kiểm thử hay hành vi triển
khai FE10. CI upstream chính xác `30315665010` và Azure staging tự động
`30315842152` đạt.

Rebase giữ bản dịch SDD tiếng Việt và hợp đồng v0.5.0 FE10 đã triển khai.
Candidate này đối soát tài liệu nguồn-sự-thật đã dịch với trạng thái bàn giao đã
triển khai, ghi vòng 7 là bị thay thế trước khi dùng và loại ba khoảng trắng
cuối lịch sử. Nó không chứa thay đổi runtime.

## Danh tính candidate

- Mục candidate: **12**.
- Fingerprint candidate:
  `e123345be05b59a9e519d182b301ab5464160e8fc32aed8d17d3c463e28e0a15`.
- Tệp cached/staged tại thời điểm fingerprint: **0**.
- Bản ghi quyết định vòng 8 này bị loại khỏi fingerprint candidate.

Thuật toán fingerprint: trạng thái porcelain cộng SHA-256 tệp chữ thường cộng
đường dẫn chuẩn hóa, sắp theo đường dẫn, ghép LF có LF cuối, sau đó SHA-256
UTF-8.

```text
 M|fb379746b49efca62b81bde372a38493b43746db7e6c9826e1788b3ad7299898|.agents/CLAUDE.md
 M|3f40456124ef5cc1184763d2e569751b08838e48a05958d0eb9676215121a473|.sdd/reviews/fe10-notification-inbox-h2-validation-2026-07-27.md
??|087168f8466d26e20df53efa2aad59afe0aadb76ffc5cde501f9a9d81c4d6c0c|.sdd/reviews/fe10-notification-inbox-h2-validation-2026-07-28-round-7.md
 M|1f7a368bcbaf2d29e289c3f0815366235d9ce0eaea7c713c67f64fdfa15f8336|.sdd/reviews/fe10-notification-inbox-staging-h3-closeout-2026-07-27.md
 M|4891ed19f6208e76bb583597ff74f277bbda5adf61331eec692168ffb7d43ee9|.sdd/specs/feat-notification-management/CHANGELOG.md
 M|0142b25088948be2a8425d9eedfa75280dba8b3d828b7175f52d0ef573e331b1|.sdd/specs/feat-notification-management/CONTEXT.md
 M|405ef3e95a500fc3cf3bfb1490cd00e10fa892e3005fbe70348f944a7776d752|.sdd/specs/feat-notification-management/PLAN.md
 M|7613f8add3573d130322511acfc352f5429c264c35261781ef8e621bcb7534cb|.sdd/specs/feat-notification-management/SPEC.md
 M|0426a0ca2d4f3b1722f2fcb4b2079b72647af9a6d9ce749d03eaf731d29a06e8|.sdd/specs/feat-notification-management/TASKS.md
 M|6d614d9b9e887b384553814460d9621ef943f9dde1b67e66ac556d3abde93118|.sdd/specs/feat-notification-management/TEST_PLAN.md
 M|82c350dfd4aaaf824c114848f64f92f098e6dbbe46d07284019a8b0641372a0f|docs/superpowers/specs/2026-07-27-fe10-notification-inbox-expansion-design.md
 M|2401696955450ac3917a391c9742784368ac6378fc750fdcc33387de96e225bd|docs/testing/master-test-plan.md
```

## Xác minh

- So sánh runtime tree `cf0a236...c72bc77` qua `backend`, `frontend`,
  `database`, `tests`, `.github` và package manifest: IDENTICAL.
- CI upstream `main@30f936d` chính xác `30315665010`: ĐẠT.
- Azure staging tự động upstream chính xác `30315842152`: ĐẠT, gồm backend,
  frontend và smoke.
- `npm.cmd run trace:enforce`: ĐẠT; FE10 14/16 (88%), không tính năng đã triển
  khai nào dưới 70%.
- `npm.cmd run test:traceability-state`: ĐẠT, 3/3.
- `npm.cmd run test:deployment`: ĐẠT, 20/20.
- Prospective toàn nhánh `git diff --check origin/main`: ĐẠT.
- Quét conflict-marker: ĐẠT.
- Cached/staged diff: rỗng.

## Quyết định H2 của con người

Phê duyệt chính xác bắt buộc:

```text
duyệt H2 fingerprint e123345be05b59a9e519d182b301ab5464160e8fc32aed8d17d3c463e28e0a15
```

Người dùng đã phê duyệt candidate chính xác trong task đang hoạt động:

```text
duyệt H2 fingerprint e123345be05b59a9e519d182b301ab5464160e8fc32aed8d17d3c463e28e0a15
```

Quyết định: **ĐÃ PHÊ DUYỆT**.

Chỉ sau phê duyệt chính xác và fetch bắt buộc ổn định, 12 mục candidate cùng bản
ghi bị loại này mới có thể được stage, commit, force-push with lease để cập nhật
nhánh PR đã rebase và gửi qua CI/Azure exact-head.
