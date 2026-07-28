# Xác thực H2 Hộp thư thông báo cá nhân FE10 - Vòng 6

- Ngày: 2026-07-28
- Nhánh: `codex/feat-fe10-personal-notification-inbox`
- Baseline: `e41aecb557f1167e363abcd1f9d3e7fe59b6c7a7`
- Trạng thái: **H2 ĐÃ PHÊ DUYỆT**

CI `30314927440` thất bại trước kiểm thử runtime vì `TASKS.md` dùng giá trị
metadata không hỗ trợ `IMPLEMENTED - H3/MERGE PENDING`. Parser repository chỉ
cho phép `NOT_STARTED`, `PARTIAL`, `COMPLETE` hoặc `DEFERRED`.

Sửa một tệp dùng:

```text
Implementation State: COMPLETE
Delivery Gate: H3/MERGE PENDING
```

Điều này giữ trạng thái bàn giao dự định trong khi thỏa hợp đồng metadata chuẩn.
Nó không đổi runtime, API, cơ sở dữ liệu, migration, UI hay hành vi kiểm thử.

## Danh tính candidate

- Mục candidate: **1** tệp tài liệu đã sửa.
- Fingerprint candidate:
  `b31b8a9e6f57713452e407387d61da06389b2fc9448c96ec80cedcd0a09dcff6`.
- Tệp cached/staged tại thời điểm fingerprint: **0**.
- Bản ghi quyết định vòng 6 này bị loại khỏi fingerprint candidate.

Thuật toán fingerprint khớp vòng 5: status cộng SHA-256 tệp chữ thường cộng
đường dẫn chuẩn hóa, sắp theo đường dẫn, ghép LF có LF cuối, sau đó SHA-256
UTF-8.

```text
 M|bc7d765c272f7f941c90acca34a2eadb3b019929b38b1176566786bfe6386c1b|.sdd/specs/feat-notification-management/TASKS.md
```

## Xác minh

- `npm.cmd run trace:enforce`: ĐẠT; FE10 14/16 (88%), không tính năng đã triển
  khai nào dưới 70%.
- `npm.cmd run test:traceability-state`: ĐẠT, 3/3.
- `git diff --check`: ĐẠT.

## Quyết định H2 của con người

Phê duyệt chính xác bắt buộc là:

```text
duyệt H2 fingerprint b31b8a9e6f57713452e407387d61da06389b2fc9448c96ec80cedcd0a09dcff6
```

Người dùng đã phê duyệt candidate chính xác trong task đang hoạt động:

```text
duyệt H2 fingerprint b31b8a9e6f57713452e407387d61da06389b2fc9448c96ec80cedcd0a09dcff6
```

Quyết định: **ĐÃ PHÊ DUYỆT**.

Sau phê duyệt, sửa một tệp chính xác này cùng bản ghi quyết định bị loại có thể
được stage, commit, push và chạy lại qua CI exact-head.
