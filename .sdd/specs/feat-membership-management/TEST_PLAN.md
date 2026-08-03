# Kế hoạch kiểm thử FE04 - Quản lý thành viên

Phiên bản: 0.2.2
Trạng thái: COMPLETE - PHẠM VI CỐT LÕI VÀ ADMIN EXTENSION
Cập nhật lần cuối: 2026-08-03

Đặc tả nguồn: `.sdd/specs/feat-membership-management/SPEC.md`
ID tính năng: `BR-FE04-*`, `FR-FE04-*`, `AC-FE04-*`
Ánh xạ AC↔kiểm thử có thẩm quyền: Ma trận traceability tại §16 của `SPEC.md` (tệp này mô tả chiến lược, không phải danh sách test case).

---

## 1. Phạm vi kiểm thử

Đơn thành viên, phê duyệt/từ chối, trạng thái thành viên và tích hợp với điều kiện mượn/đặt chỗ.

## 2. Mục tiêu kiểm thử unit

- Điều kiện đủ để nộp đơn thành viên.
- Quy tắc chuyển đổi trạng thái: `PENDING`, `APPROVED`, `REJECTED` và trạng thái thành viên chuẩn `INACTIVE`.
- Ngăn đơn đang hoạt động/đang chờ trùng lặp.
- FE07 dùng trạng thái FE04 chuẩn để chọn hạn mức 5/3; FE08 chỉ yêu cầu tài khoản `MEMBER` hoạt động và không bị FE04 chặn.

## 3. Mục tiêu kiểm thử API/integration

- Happy path Thành viên nộp đơn thành viên.
- Đơn trùng lặp bị từ chối.
- Thủ thư/quản trị viên phê duyệt đơn.
- Thủ thư/quản trị viên từ chối đơn.
- Người dùng không được phép không thể phê duyệt/từ chối.
- Thành viên có thể xem trạng thái thành viên của chính mình.
- Chuyển đổi trạng thái không hợp lệ trả về lỗi an toàn.

## 4. Luồng nghiệm thu E2E/thủ công

- Người dùng đã đăng ký nộp đơn thành viên.
- Nhân viên phê duyệt yêu cầu.
- Thành viên FE04 `APPROVED` nhận hạn mức FE07 5 bản/ngày; trạng thái khác nhận hạn mức 3 nếu tài khoản `MEMBER` vẫn hoạt động.
- FE08 cho phép tài khoản `MEMBER` hoạt động đặt chỗ bất kể trạng thái FE04; tài khoản không hoạt động bị chặn theo FE02.

## 5. Bằng chứng hiện tại

- `backend/tests/membershipRoutes.test.js`: 18/18 vượt qua cho quyền truy cập người nộp đơn đang hoạt động, response/quyền riêng tư chuẩn, nộp/nộp lại đơn, danh sách nhân viên, xác thực dữ liệu, rollback nguyên tử, đồng thời, audit và hành vi gửi FE10.
- `backend/tests/sql/membershipConcurrency.sqltest.js`: 10/10 trường hợp SQL static và mutable vượt qua trên runtime SQL Server disposable.
- `frontend/test/membershipFrontend.test.js`: 5/5 vượt qua về sự thật server chuẩn, nộp đơn body trống, lỗi đúng sự thật, tìm kiếm ở server, làm mới mutation và ranh giới từ chối.
- Toàn bộ backend: 38 suite / 619 kiểm thử vượt qua. Độ bao phủ: 92.51% statement, 82.46% branch, 97.10% function, 92.44% line.
- Backend tập trung hiện tại: 30/30 kiểm thử vượt qua cho route FE04 và kết nối hệ thống.
- Toàn bộ frontend hiện tại: 219/219 kiểm thử vượt qua; ESLint và Vite production build vượt qua.
- Traceability FE04 hiện tại: 14/14 FR; `git diff --check` vượt qua.
- Local closeout baseline: backend FE04 + system integration 31/31, frontend FE04/Admin 36/36 và Playwright FE04 + FE11 2/2 thoát sạch trong 31,5 giây.
- Harness amendment: 14/14 contract PASS; hai script tạm `node --check` PASS; preflight trước và sau cleanup PASS.
- Azure Staging `850b01b`, run `lms-fe04-acceptance-20260803-90ac1d5b`: anonymous 401, Member 403, Librarian/Admin 200; application A `REJECTED`, application B `APPROVED`; 1440/1366/1280/390 không overflow; cleanup active token/user/member/pending = 0, login/token cũ bị từ chối và runtime/helper = 404/404.
- Suite liên tính năng FE04/FE07/FE08/FE10/FE12: 6 suite, 162/162 PASS.
- L1 amendment trước H2 vòng 2: backend 75 suite/1202 test PASS; frontend 281/281, lint/build PASS; Playwright 16/16; deployment 20/20; secret/audit/trace/diff gates PASS. Bằng chứng system integration 11/11 và coverage 91.98% statement, 81.28% branch, 97.08% function, 91.94% line thuộc L1 đầy đủ trước H2 vòng 1.

## 6. Khoảng trống

- Bằng chứng SQL Server disposable đã hoàn tất: migration FE04 chạy hai lần, toàn bộ sáu mutable case vượt qua và việc dọn dẹp database/login được ghi tại `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- L1 amendment đã chạy lại sau H3 vòng 1; mọi gate tối thiểu trước H2 vòng 2 đều đạt.
- H3/manual-owner acceptance đã xác nhận điều kiện và tính phù hợp của hệ thống tại PR #107; chỉ còn cổng tích hợp PR C (H2 vòng 2, CI và H3 cuối).

## 7. Lệnh/bằng chứng bắt buộc trước khi merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:sql:fe04
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
```

## 8. Mục tiêu tích hợp rà soát thành viên trong Admin Console

Trạng thái hoàn tất (2026-08-03): nguồn/local browser/Azure Staging/L1/H2 vòng 1 và H3/manual-owner acceptance đều đạt trên exact SHA `850b01b`.

- Điều hướng Admin chính xác tám mục, có Membership Review sau All Users và không có Permissions.
- Tham số danh sách FE04 chuẩn `q`, `status`, `page`, `limit=10`; không có alias `/api/admin/membership`.
- Hành động review chỉ với trạng thái đang chờ, lý do từ chối 1..500, tải lại có thẩm quyền sau thành công/conflict và cảnh báo `FAILED` FE10 an toàn.
- Bảng Admin trên 1440px và thẻ tại/dưới 1440px; không tràn tài liệu ở 1440/1366/1280/390.
- Từ chối Admin đã xác thực thực tế, thành viên bị từ chối nộp lại đơn và phê duyệt trong `tests/e2e/fe04-admin-membership-review.spec.js` cùng độ bao phủ hồi quy `/membership` và FE11 hiện có.
- Rà soát thủ công/owner đã chấp nhận acceptance staging và bằng chứng responsive tại H3 vòng 1 PR #107.
