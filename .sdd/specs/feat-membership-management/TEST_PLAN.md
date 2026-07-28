# Kế hoạch kiểm thử FE04 - Quản lý thành viên

Phiên bản: 0.2.1
Trạng thái: COMPLETE - PHẠM VI GIAI ĐOẠN 2 CỐT LÕI; ĐANG CHỜ MỞ RỘNG QUẢN TRỊ
Cập nhật lần cuối: 2026-07-25

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
- Tác động của trạng thái thành viên đến điều kiện mượn/đặt chỗ.

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
- Thành viên được phê duyệt có thể tiếp tục luồng mượn/đặt chỗ.
- Thành viên bị từ chối/chưa phê duyệt bị chặn khỏi luồng chỉ dành cho thành viên nơi đặc tả yêu cầu.

## 5. Bằng chứng hiện tại

- `backend/tests/membershipRoutes.test.js`: 18/18 vượt qua cho quyền truy cập người nộp đơn đang hoạt động, response/quyền riêng tư chuẩn, nộp/nộp lại đơn, danh sách nhân viên, xác thực dữ liệu, rollback nguyên tử, đồng thời, audit và hành vi gửi FE10.
- `backend/tests/sql/membershipConcurrency.sqltest.js`: 10/10 trường hợp SQL static và mutable vượt qua trên runtime SQL Server disposable.
- `frontend/test/membershipFrontend.test.js`: 5/5 vượt qua về sự thật server chuẩn, nộp đơn body trống, lỗi đúng sự thật, tìm kiếm ở server, làm mới mutation và ranh giới từ chối.
- Toàn bộ backend: 38 suite / 619 kiểm thử vượt qua. Độ bao phủ: 92.51% statement, 82.46% branch, 97.10% function, 92.44% line.
- Backend tập trung hiện tại: 30/30 kiểm thử vượt qua cho route FE04 và kết nối hệ thống.
- Toàn bộ frontend hiện tại: 219/219 kiểm thử vượt qua; ESLint và Vite production build vượt qua.
- Traceability FE04 hiện tại: 14/14 FR; `git diff --check` vượt qua.

## 6. Khoảng trống

- Bằng chứng SQL Server disposable đã hoàn tất: migration FE04 chạy hai lần, toàn bộ sáu mutable case vượt qua và việc dọn dẹp database/login được ghi tại `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Hội tụ FE04 vào cùng baseline schema sau FE11 với FE10/FE02 và chạy lại kiểm thử liên tính năng.
- `tests/e2e/fe04-admin-membership-review.spec.js` bao phủ thiết lập người nộp đơn đã đăng ký, từ chối Admin, thành viên nộp lại đơn, phê duyệt và kiểm tra tràn responsive; teardown Playwright webServer Windows đã cấu hình vẫn timeout trước khi tiến trình thoát sạch.
- Chủ sở hữu Dat/FE07/FE08 và người rà soát thủ công cuối cùng phải xác nhận điều kiện và tính phù hợp của hệ thống.

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

Trạng thái nguồn/tự động cục bộ (2026-07-24): đã triển khai và được bao phủ bởi toàn bộ frontend vượt qua 219/219 cùng backend FE04 tập trung 30/30. Trình duyệt responsive đã xác thực có độ bao phủ assertion, nhưng việc thoát tiến trình Windows, Azure Staging và các cổng thủ công bên dưới vẫn đang mở.

- Điều hướng Admin chính xác tám mục, có Membership Review sau All Users và không có Permissions.
- Tham số danh sách FE04 chuẩn `q`, `status`, `page`, `limit=10`; không có alias `/api/admin/membership`.
- Hành động review chỉ với trạng thái đang chờ, lý do từ chối 1..500, tải lại có thẩm quyền sau thành công/conflict và cảnh báo `FAILED` FE10 an toàn.
- Bảng Admin trên 1440px và thẻ tại/dưới 1440px; không tràn tài liệu ở 1440/1366/1280/390.
- Từ chối Admin đã xác thực thực tế, thành viên bị từ chối nộp lại đơn và phê duyệt trong `tests/e2e/fe04-admin-membership-review.spec.js` cùng độ bao phủ hồi quy `/membership` và FE11 hiện có.
- Rà soát Azure Staging thủ công vẫn tách biệt với ảnh chụp tự động.
