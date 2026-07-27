# Rà soát H1 Lô 1 Fast-Track FE11

Trạng thái: ĐƯỢC CON NGƯỜI PHÊ DUYỆT - 2026-07-18

Ngày: 2026-07-18

Đường cơ sở: `origin/main@1eb426196ebbc80339e2aed4558270967cd7269e`

Phạm vi lô: `TD-024`, `TD-026`, `TD-027`

Chỉ dự báo, ngoài Lô 1: `TD-023`, `TD-025`

## Các bản sửa trước H1 được bao gồm

- Cách diễn đạt rà soát Hiến chương giờ phân biệt rà soát đầu ra AI cục bộ trước commit với rà soát tích hợp PR cuối cùng sau kiểm tra.
- Tên truy vấn kiểm toán vẫn căn chỉnh với SPEC FE11: `q`, `action`, `actorId`, `from`, `to`, `page` và `limit`.
- Siêu dữ liệu kiểm toán dùng phép chiếu từ chối mặc định có nhận biết hành động trên các bên ghi liên tính năng hiện tại; siêu dữ liệu thô và văn bản tự do không bao giờ được trả về.
- Bộ đếm người dùng tái sử dụng mô hình đọc FE12 `/api/reports/users` đã hoàn tất; không đưa vào điểm cuối `/api/admin/user-summary`.
- TD-027 chỉ nhắm các ô `Test Case` và `Status` hiện có, đồng thời tuần tự hóa lần sửa `SPEC.md` thực tế sau khi TD-026 merge.
- Kích hoạt lô yêu cầu PR tài liệu quản trị, các kiểm tra bắt buộc, H3 và merge vào `main`.

## Các quyết định H1

| ID | Quyết định | Đề xuất |
| --- | --- | --- |
| H1-001 | Áp dụng mô hình thẩm quyền H1/H2/H3 đã sửa và cách diễn đạt Hiến chương | APPROVE |
| H1-002 | Áp dụng `GET /api/admin/audit-logs` chuẩn với tên truy vấn SPEC, phạm vi hàng liên tính năng, phép chiếu có nhận biết hành động và loại bỏ `404 NOT_FOUND` cũ | APPROVE |
| H1-003 | Áp dụng Phương án C TD-026: giữ `{ data, pagination }`, xóa `summary` danh sách và tái sử dụng FE12 `/api/reports/users` cho bộ đếm Quản trị viên | APPROVE |
| H1-004 | Chỉ dùng ma trận TD-027 đã sửa cho các ô trạng thái kiểm thử/bằng chứng hiện có | APPROVE |
| H1-005 | Thứ tự lô là `TD-024 -> TD-026 -> TD-027`; `TD-023` và `TD-025` vẫn là dự báo phần phụ thuộc chưa được cấp quyền | APPROVE |
| H1-006 | Công bố chính xác phần khác biệt kích hoạt quản trị dưới dạng PR tài liệu; chỉ kích hoạt trạng thái tác vụ/nợ sau kiểm tra bắt buộc, H3 và merge | APPROVE |

## Core và Shell

- Core: thẩm quyền cổng, quyền sở hữu phân quyền/truy vấn/che dữ liệu/API Kiểm toán, quyền sở hữu mô hình đọc FE11/FE12, tính trung thực bằng chứng SPEC và quyền sở hữu tệp dùng chung tuần tự.
- Shell: điều khiển/kết xuất bộ lọc Kiểm toán, bộ chuyển đổi điểm cuối cơ học, ánh xạ thẻ bảng điều khiển và định dạng bằng chứng.

## Phần khác biệt kích hoạt quản trị

H1 rà soát và cho phép chính xác tập kích hoạt chỉ gồm tài liệu:

- `.sdd/constitution.md`
- `.agents/AGENTS.md`
- `.agents/CLAUDE.md`
- `docs/superpowers/specs/2026-07-18-fast-track-hybrid-delivery-mode-design.md`
- `docs/superpowers/plans/2026-07-18-fast-track-hybrid-delivery-mode.md`
- `docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md`
- `docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md`
- `.sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md`
- `.sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md`
- `.sdd/reviews/auth-account-setup-boundary-validation-review-2026-07-15.md`
- `.sdd/specs/feat-user-role-management/PLAN.md`
- `.sdd/specs/feat-user-role-management/TASKS.md`
- `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- `TECH_DEBT.md`

Không tệp backend, frontend, cơ sở dữ liệu, lược đồ, phần phụ thuộc hay cấu hình thời gian chạy nào thuộc PR kích hoạt.

## Quyền sở hữu tệp sau kích hoạt

### Các tệp thuộc sở hữu Builder TD-024

- `.sdd/specs/feat-user-role-management/SPEC.md` chỉ để làm rõ API/chi tiết H1 yêu cầu
- `docs/api/api-contract.md`
- `backend/src/docs/openapi.yaml`
- `backend/src/routes/adminRoutes.js`
- `backend/src/routes/userManagementRoutes.js`
- `backend/src/controllers/adminController.js`
- `backend/src/controllers/userManagementController.js`
- `backend/src/services/adminService.js`
- `backend/src/services/userManagementService.js`
- `backend/src/repositories/auditLogRepository.js`
- `backend/src/validators/adminValidators.js` (mới)
- `backend/tests/adminAuditLogRoutes.test.js` (mới)
- `backend/tests/adminAuditLogService.test.js` (mới)
- `backend/tests/auditLogRepository.test.js` (mới)
- `backend/tests/userManagementRoutes.test.js`
- `backend/tests/userManagementService.test.js`
- `frontend/src/api/adminApi.js`
- `frontend/src/api/userManagementApi.js`
- `frontend/src/page/UserManagement.jsx`
- `frontend/test/adminApi.test.js` (mới)
- `frontend/test/userManagementApi.test.js`
- `frontend/test/userManagementFrontend.test.js`

### Các tệp thuộc sở hữu Builder TD-026

- `.sdd/specs/feat-user-role-management/SPEC.md` chỉ khi tài liệu cấu trúc bao danh sách cần làm rõ
- `docs/api/api-contract.md`
- `backend/src/docs/openapi.yaml`
- `backend/src/repositories/userRepository.js`
- `backend/src/services/userManagementService.js` chỉ khi nó chuyển tiếp trạng thái tổng hợp của kho lưu trữ
- `backend/tests/userRepository.test.js`
- `backend/tests/userManagementService.test.js`
- `backend/tests/userManagementRoutes.test.js`
- `frontend/src/page/UserManagement.jsx`
- `frontend/test/userManagementApi.test.js`
- `frontend/test/userManagementFrontend.test.js`

TD-026 không sở hữu tệp backend Quản trị viên, tệp production FE12 hay điểm cuối tổng hợp mới.

### Các tệp của Trưởng nhóm Tích hợp TD-027

- `.sdd/specs/feat-user-role-management/SPEC.md` chỉ các ô `Test Case` và `Status` hiện có
- `.sdd/specs/feat-user-role-management/PLAN.md` chỉ văn bản trạng thái lát cắt lỗi thời
- `.sdd/specs/feat-user-role-management/TASKS.md` chỉ văn bản trạng thái lát cắt lỗi thời
- `.sdd/specs/feat-user-role-management/TEST_PLAN.md` chỉ văn bản bằng chứng lỗi thời
- `.sdd/specs/feat-user-role-management/CHANGELOG.md` chỉ khi cần bằng chứng tích hợp mới; mục lịch sử vẫn không thay đổi
- `.sdd/reviews/auth-account-setup-boundary-validation-review-2026-07-15.md`
- `TECH_DEBT.md`
- `.agents/CLAUDE.md`

Việc chuẩn bị ma trận TD-027 có thể chạy song song. Lần sửa `SPEC.md` thực tế chỉ chạy sau khi TD-026 merge, trong cửa sổ Trưởng nhóm Tích hợp tuần tự và nhận luồng PR H2/H3 riêng.

## Các cổng xác thực

- L1: kiểm thử bị ảnh hưởng tập trung/đầy đủ, lint/bản dựng khi bị ảnh hưởng, truy vết, vệ sinh phần khác biệt, quét bí mật/bảo mật và CI PR bắt buộc.
- L2: ánh xạ yêu cầu tới tác vụ/mã/kiểm thử/bằng chứng với ID hàng chính xác.
- L3: phân quyền ưu tiên Quản trị viên, xác thực có kiểu, che dữ liệu từ chối mặc định, không mở rộng bí mật/lược đồ/xác thực và tính nhất quán cổng Hiến chương.
- L4: luồng đọc/lọc Kiểm toán Quản trị viên, hành vi danh sách FE11/thống kê FE12 độc lập và rà soát chấp nhận trạng thái bằng chứng.

## Quy tắc trạng thái kích hoạt

- Trước khi PR kích hoạt quản trị merge, `TD-024`, `TD-026` và `TD-027` vẫn có trạng thái `OPEN` có thẩm quyền trên `main`.
- Phần khác biệt PR kích hoạt đổi chúng thành `IN PROGRESS`; trạng thái đó chỉ có thẩm quyền khi PR tới `main`.
- `FE11-FT01` hoàn tất sau merge kích hoạt. `FE11-AUD01`, `FE11-ENV01` và `FE11-META01` vẫn là nhóm tác vụ mở.
- `TD-023` và `TD-025` vẫn `OPEN`.
- Toàn bộ FE11 vẫn ở `Implementation State: DEFERRED`.
- `TD-027` chỉ thành `RESOLVED` sau khi PR siêu dữ liệu SPEC chính xác sau đó của nó đạt H2, kiểm tra bắt buộc, H3, merge và bằng chứng tích hợp.

## Quy tắc dừng

- Dừng nếu H1 thay đổi bất kỳ hợp đồng hay ranh giới sở hữu đã phê duyệt nào.
- Dừng khi có sai lệch Core chồng lấn sau khi gói này được phê duyệt.
- Dừng nếu hành động Kiểm toán hiện tại không thể được bộ chiếu đã phê duyệt biểu diễn mà không có văn bản tự do thô hay trường nhạy cảm.
- Dừng nếu FE12 `/api/reports/users` không còn cung cấp số lượng đã phê duyệt hoặc chủ sở hữu từ chối tái sử dụng.
- Dừng khi mở rộng quyền/lược đồ/xác thực, làm lộ bí mật, kiểm tra bắt buộc thất bại hoặc giả định tác nhân không tương thích.

## Hiệu lực phê duyệt H1

Phê duyệt cho phép:

- Thay thế trạng thái cơ học từ `H1 REVIEW READY` thành `APPROVED BY HUMAN - 2026-07-18` trong ba sản phẩm H1 và gói này.
- Thay thế trạng thái thiết kế Fast-Track cơ học từ `APPROVED CONCEPT - H1 REVISION REVIEW READY` thành `APPROVED BY HUMAN - 2026-07-18`.
- Chính xác các lần sửa kích hoạt tài liệu quản trị/FE11 được xác định trong kế hoạch thực thi.
- Commit và công bố PR kích hoạt chỉ gồm tài liệu.
- Tự động tạo kế hoạch triển khai TD-024 chi tiết trong worktree tài liệu riêng khi kiểm tra PR kích hoạt chạy.

Phê duyệt không cho phép:

- Commit hay push mã sản phẩm backend/frontend.
- Triển khai sản phẩm trước khi PR kích hoạt merge vào `main`.
- Merge bất kỳ PR nào không có H3.
- Triển khai TD-023 hay TD-025.

## Phê duyệt bởi con người

Được phê duyệt vào 2026-07-18. H1-001..H1-006 bị khóa cho Lô 1.

## Danh sách kiểm tra rà soát bởi con người

1. Phê duyệt hoặc từ chối từ H1-001 đến H1-006 như một gói đã khóa.
2. Xác nhận Kiểm toán dùng `q/from/to`, mọi hàng đã lưu, chi tiết từ chối mặc định có nhận biết hành động và `404 NOT_FOUND` cũ.
3. Xác nhận TD-026 tái sử dụng FE12 và không tạo điểm cuối tổng hợp.
4. Xác nhận TD-027 chỉ sửa các ô bằng chứng/trạng thái hiện có trong cửa sổ tuần tự sau TD-026.
5. Xác nhận kích hoạt yêu cầu kiểm tra PR tài liệu, H3 và merge trước khi trạng thái công việc có thẩm quyền.
