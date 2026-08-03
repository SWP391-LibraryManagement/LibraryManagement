# Danh sách kiểm tra đệ trình cuối cùng - 2026-07-20

## Quyết định phát hành

The published release remains `v1.0.2` at `c988af1f605e32f7207ad51c4657ea07656941b0`. Full-project closeout starts from `main@161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27` after PR #97; CI `30726791185` and staging deployment `30726924615` pass for that exact pre-batch SHA. PR A only reconciles Shell evidence. PR B-D remain required before `v1.0.3`, and PR D must use its own exact post-merge SHA rather than treating this baseline as the final release commit.

Demonstration video is `WAIVED — NOT REQUIRED` by Nhat on 2026-08-02. No URL or artifact is missing or expected, and none will be fabricated.

## Gói gửi

| Mục | Trạng thái | Bằng chứng |
| --- | --- | --- |
| Source code | PASS pre-batch baseline / `v1.0.3` NOT YET AUTHORIZED | `v1.0.2` is published at `c988af1`; the four-PR closeout starts from `main@161cc28` and requires PR B-D plus final exact-SHA evidence. |
| Requirements and design | PASS design / IMPLEMENTATION IN PROGRESS | Approved design `docs/superpowers/specs/2026-08-02-full-project-closeout-v1.0.3-design.md`; PR A-D boundaries are explicit. |
| Final release document | PASS | `document/FinalRelease.md`. |
| User documentation | PASS | `docs/user-manual.md` and system overview. |
| Phase 3 final report | PASS | `docs/release/phase3-final-report.md`. |
| Final governance closeout | ACTIVE — PR A-D REQUIRED | The 2026-07-20 reviews remain historical; the approved 2026-08-02 design and PR A plan govern the current closeout. |
| Defense presentation | NOT APPLICABLE | Các artifact DOCX/PPTX đã được xóa theo yêu cầu; nội dung dự án được giữ trong tài liệu Markdown tiếng Việt. |
| Rehearsal | PASS | `docs/release/phase3-rehearsal-record.md` and demo runbook. |
| Current-main quality | PASS pre-batch baseline | CI `30726791185` succeeded on exact SHA `161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27`. |
| Current-main staging | PASS pre-batch baseline | Deployment workflow `30726924615` succeeded on the same exact SHA. |
| Public Azure staging | PASS pre-batch baseline | Seven checks passed: frontend, health, schema readiness, SQL catalog, allowed CORS, blocked CORS, and anonymous protected route. |
| Demonstration video/link | WAIVED — NOT REQUIRED | Approved by Nhat on 2026-08-02; no external URL or artifact will be fabricated. |
| Authenticated Azure user observation | PASS | Live run `c6e0c46421f0` verified Admin/Member/Librarian login, protected reads, borrow request, approval, and return. |
| Real SMTP inbox delivery | PASS | Notification `8` was `SENT` in one attempt; provider acceptance and Gmail IMAP message search were observed. |
| Vietnamese UI localization | PASS — INTEGRATED ON CURRENT MAIN / NOT IN `v1.0.2` | PR #58 established the released baseline; later responsive corrections are included in the pre-batch `main@161cc28` candidate and covered by its CI/deployment evidence. |

## Làm mới khóa sổ tự động — 2026-07-21

Sau khi cài đặt lại sạch sẽ từ các tệp khóa cuối cùng, quá trình xác thực cục bộ đã vượt qua các
kiểm thử máy chủ 923/923 trên 54 bộ, kiểm thử giao diện người dùng 178/178, kiểm thử hệ thống 10/10,
kiểm thử triển khai 8/8 và 4/4 luồng Playwright. Độ bao phủ vẫn ở trên ngưỡng được định cấu
hình (câu lệnh 92,61%, nhánh 81,55%, chức năng 96,68%, dòng 92,54%). Kiểm tra phần phụ thuộc sản
xuất cho không gian làm việc gốc, máy chủ và giao diện được báo cáo `0` lỗ hổng;
quy trình làm việc CI hiện thực thi các cổng kiểm tra có mức độ nghiêm trọng cao tương tự cho tất cả
các phần phụ thuộc.

Quá trình theo dõi khắc phục trên thiết bị di động cục bộ đã sử dụng TDD: cả hai xác nhận mới lần
đầu tiên đều không thành công đối với hình học được quan sát, sau đó được chuyển sau khi thay đổi
CSS chỉ dành cho thiết bị di động. Cổng có phạm vi được làm mới đã vượt qua các kiểm thử giao diện
người dùng 178/178, kiểm tra mã, bản dựng sản xuất, luồng 4/4 Playwright và khả năng truy vết 12/12-chức năng
(243/243 FR). Bằng chứng trực quan được giữ lại dưới dạng
`release-member-reservations-mobile-fixed.png` và `release-admin-users-mobile-fixed.png` trong
`output/playwright/`.

## Xác minh bản phát hành `v1.0.2` đã xuất bản ngay bây giờ

Những bước kiểm tra xác minh này có thể chạy ngay lập tức. Thẻ phải phân giải thành `c988af1`:

```powershell
git fetch origin --tags
git rev-list -n 1 v1.0.2
gh release view v1.0.2 --repo SWP391-LibraryManagement/LibraryManagement
```

## Xác minh bản phát hành sau đối chiếu trong tương lai

Chạy kiểm tra đối với `origin/main` SHA được xem xét chính xác trước bất kỳ thẻ phát hành nào trong
tương lai; không sử dụng lại `cce59d0` hoặc phê duyệt các PR trước đó có hiệu lực:

```powershell
git fetch origin --tags
git rev-parse origin/main
gh run list --repo SWP391-LibraryManagement/LibraryManagement --branch main --limit 5
```

Chỉ khi nhóm xuất bản `v1.0.3` sau đó, hãy xác minh riêng bản phát hành đó:

```powershell
git rev-list -n 1 v1.0.3
gh release view v1.0.3 --repo SWP391-LibraryManagement/LibraryManagement
```

## Hạn chế còn lại

- FE10 personal inbox is integrated; a separate `IN_APP` delivery channel and global staff notification log remain outside the approved scope.
- Dedicated human desktop/mobile visual acceptance passed on 2026-07-21; later responsive corrections are integrated on the pre-batch main candidate but are not part of published `v1.0.2`.
- Demonstration video is `WAIVED — NOT REQUIRED`; this is a final submission decision, not an open limitation.
- Avatar storage on App Service is not production-durable.
- CI has no shared disposable SQL Server service.
- Student-credit staging has no production SLA.

Những hạn chế này là ranh giới phát hành được ghi lại, không phải là các xác nhận đạt chưa được xác
minh. Bất kỳ chức năng mới hoặc chương trình tăng cường sản xuất nào đều yêu cầu gói đặc tả Giai
đoạn 4 được phê duyệt riêng.
