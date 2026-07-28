# Kế hoạch kiểm thử FE11 - Quản lý người dùng và vai trò

Phiên bản: 0.5.2
Trạng thái: XÁC THỰC TỰ ĐỘNG CỤC BỘ HOÀN TẤT - CHỜ CHẤP NHẬN TRÌNH DUYỆT/CON NGƯỜI
Cập nhật lần cuối: 2026-07-28

Đặc tả nguồn: `.sdd/specs/feat-user-role-management/SPEC.md`
ID tính năng: `BR-FE11-*`, `FR-FE11-*`, `AC-FE11-*`
Ánh xạ AC↔kiểm thử chuẩn: `SPEC.md` §16 Ma trận truy vết (tệp này là chiến
lược, không phải danh sách ca).

---

## 1. Phạm vi kiểm thử

Quản trị người dùng, thay vai trò đúng-một, quản lý trạng thái tài khoản và nhật
ký kiểm toán. Dữ liệu hồ sơ người dùng hiện có chỉ đọc trong FE11; FE03 sở hữu
các sửa đổi tự phục vụ đã phê duyệt.

## 2. Mục tiêu kiểm thử đơn vị

- Quy tắc lực lượng đúng-một vai trò và thay thế nguyên tử.
- Helper API vai trò Quản trị chỉ gửi giá trị `roleId` số từ danh mục vai trò đã
  xác thực.
- Modal vai trò kiểm tra danh mục có thể chỉnh sửa đầy đủ trước thay đổi, gán
  trước khi thu hồi và giữ vai trò không thể chỉnh sửa.
- Lỗi thay đổi một phần dừng yêu cầu sau và tải lại vai trò chuẩn của người dùng
  mục tiêu vào modal đang mở.
- Quy tắc chuyển đổi trạng thái tài khoản.
- Xác thực thao tác quản trị được bảo vệ.
- Tạo nhật ký kiểm toán cho thao tác quản trị quan trọng.
- Bảo vệ chống leo thang đặc quyền.
- Tạo tài khoản không hoạt động nguyên tử và phát hành mã thông báo thiết lập.
- Điều kiện hợp lệ gửi lại thiết lập, cooldown, xoay vòng mã thông báo, lỗi gửi
  và không lộ thông tin xác thực.

## 3. Mục tiêu kiểm thử API / tích hợp

- `GET /users`: liệt kê người dùng có phân quyền.
- `GET /users/roles`: liệt kê vai trò.
- `GET /admin/audit-logs`: tìm kiếm/lọc/ngày/phân trang chỉ Quản trị với che dữ
  liệu siêu dữ liệu nhạy cảm.
- `GET /users/:userId`: luồng thành công, không tìm thấy, bị cấm.
- `POST /users`: Quản trị tạo người dùng, trùng lặp, trường không hợp lệ.
- `POST /users`: trạng thái không hoạt động, hash bcrypt không thể dùng hợp lệ,
  rollback nguyên tử, trạng thái gửi an toàn FE10.
- `POST /users/:userId/resend-setup`: điều kiện hợp lệ, cooldown, xoay vòng,
  lỗi nhà cung cấp an toàn, phân quyền.
- `GET /users` và `GET /users/:userId`: chỉ trả trường `UserManagementView` và
  bản tóm tắt liên quan đã phê duyệt; không có trường thông tin xác thực/mã thông
  báo/phiên/liên kết.
- `PUT /users/:userId`: đã ngừng/không định tuyến; mọi payload hồ sơ trả `404`
  và không tới service/repository ghi hồ sơ nào.
- `PATCH /users/:userId/status`: chuyển đổi hợp lệ, chuyển đổi không hợp lệ.
- `PUT /users/:userId/role`: thay vai trò, vai trò không hợp lệ, no-op, bảo vệ
  Quản trị viên hoạt động cuối, bị cấm.

## 3.1 Mục tiêu hiện tại Fast-Track Batch 1

- Nhật ký kiểm toán Quản trị chuẩn: tên truy vấn SPEC, phân quyền ưu tiên Quản
  trị, xác thực/lọc có kiểu, thứ tự ổn định, phép chiếu default-deny nhận biết
  hành động và ngừng legacy 404.
- Vỏ danh sách người dùng: không có `summary` cấp trên; bộ đếm Quản trị dùng
  lại `/api/reports/users` FE12 với mặc định số không.
- Siêu dữ liệu bằng chứng: chỉ ô Test Case/Status hiện có đã phê duyệt thay đổi
  trong cửa sổ hậu TD-026 nối tiếp.

## 3.2 Mục tiêu hiện tại TD-023

- Baseline TD-023 lịch sử: sidebar Admin Console chính xác tám mục và phần
  Permissions có thể truy cập; sửa chỉ sidebar do Phần 3.2.1 quản lý.
- `GET /api/admin/permissions` ưu tiên Quản trị với khóa DTO vai trò/quyền chính
  xác và 15 hàng chuẩn.
- Đối tượng phản hồi mới, mảng vai trò hợp lệ/khử trùng lặp và không phụ thuộc
  repository/ghi.
- Số lượng `usersByRole` FE12 được kết hợp độc lập với dữ liệu ma trận FE11.
- Ô bao phủ module/ma trận suy ra, lỗi cô lập có thể thử lại và không có fallback
  ma trận frontend mã hóa cứng.

## 3.2.1 Mục tiêu sửa UX đã xác thực FE11-UXR08

- Baseline UXR08 lịch sử: sidebar Admin Console chính xác bảy mục không có
  Permissions; UXR09 bên dưới thay số hiện tại thành tám trong khi Quản lý người
  dùng giữ Quản lý vai trò.
- Quản lý người dùng dùng thẻ trước khi bảng cố định 1040px buộc cuộn ngang tại
  1280px và 1366px.
- Kiểm toán giữ `q`, `action`, `actorId`, `from` và `to` chuẩn; lựa chọn hành
  động đã ánh xạ hiển thị nhãn tiếng Việt nhưng gửi giá trị thô.
- Chi tiết Audit an toàn vẫn theo danh sách cho phép và chỉ đọc sau phần tiết lộ
  từng hàng; API, phân quyền, phân trang và che dữ liệu không đổi.
- Bao phủ trình duyệt đáp ứng gồm 1280x720, 1366x768, 1440x900 và 390x844.

## 3.2.2 Mục tiêu tích hợp rà soát tư cách thành viên Quản trị FE11-UXR09

- Hợp đồng sidebar hiện tại chính xác tám mục: bảy mục UXR08 cộng Rà soát tư
  cách thành viên FE04 sau Tất cả người dùng; Permissions vẫn vắng mặt.
- FE11 chỉ sở hữu điều hướng/kết hợp. Kiểm thử từ chối quyền sở hữu `adminApi`
  hoặc `/api/admin/membership` và yêu cầu lời gọi `membershipApi` chuẩn.
- Kiểm thử nguồn và trình duyệt chứng minh lọc/phân trang máy chủ, thao tác chỉ
  pending, phản hồi từ chối/thông báo an toàn, tải lại xung đột chuẩn và trình
  bày chỉ đọc trạng thái cuối.
- Chấp nhận đáp ứng bao phủ bảng trên 1440px, thẻ tại/dưới 1440px và không tràn
  trang tại 1440/1366/1280/390.
- Thao tác vai trò Quản lý người dùng hiện có, sửa Audit, `/membership` FE04 và
  Quản lý yêu cầu FE11 vẫn là cổng hồi quy.

## 3.3 Mục tiêu lịch sử Finalization Wave A

Các mục tiêu này ghi baseline 2026-07-19. Bằng chứng cập nhật cá nhân/email rộng
bị Q-FE11-027 thay thế và không thể đóng sửa quyền sở hữu hiện tại.

- Kiểm tra migration tĩnh lũy đẳng cho năm cột đã phê duyệt,
  `UX_Users_Email` xác định, đồng bộ baseline/model/binding và tùy chọn thực thi
  trực tiếp hai lần.
- `UserManagementView.updatedAt` fallback về `CreatedAt` chỉ khi `UpdatedAt`
  lưu trữ là null; cập nhật/vô hiệu hóa so sánh cùng giá trị hiệu dụng đó.
- Tạo và gửi lại thiết lập khóa/kiểm tra lại Quản trị hoạt động trong giao dịch
  nguồn; email trùng khi tạo ánh xạ an toàn và không yêu cầu gửi.
- Xác thực route tạo bao phủ kiểu/email/tên/độ dài trường tùy chọn, trường chỉ
  Thủ thư, payload chuẩn hóa và phân quyền ưu tiên Quản trị.
- Trường công việc Thủ thư lưu khi tạo/đọc/cập nhật, tối đa 100 ký tự và bỏ cho
  mục tiêu không phải Thủ thư.
- Kiểm thử cập nhật giữ lại bao phủ trạng thái cũ trường công việc Thủ thư,
  no-op, thay đổi hiệu dụng, danh sách cho phép kiểm toán và rollback; các ca
  email trùng/cập nhật cá nhân phải thay bằng Phần 3.5.
- Kiểm thử vô hiệu hóa bao phủ kích hoạt đang chờ, lũy đẳng đã vô hiệu hóa,
  `ACTIVE`/`LOCKED`, tự mục tiêu, lượt mượn đang hoạt động, thu hồi REFRESH,
  kiểm toán, rollback và tuần tự phê duyệt FE07.
- Kiểm thử frontend bao phủ `expectedUpdatedAt` hiệu dụng, trường Thủ thư, tải
  lại chuẩn, `ACCOUNT_PENDING_ACTIVATION` và loại quyền Quản trị phát triển ngầm.

## 3.4 Mục tiêu Finalization Wave B

- Xác thực danh sách/chi tiết yêu cầu ưu tiên Quản trị cho `page`, `limit`,
  `q`, `status`, `from` và `to`.
- Phân trang máy chủ header riêng, thứ tự ổn định
  `RequestDate DESC, RequestId DESC`, bộ lọc đếm/dữ liệu khớp và nhóm mảng an
  toàn không tách dấu phẩy.
- Chi tiết yêu cầu an toàn chuyên dụng với `400 VALIDATION_ERROR` và
  `404 BORROW_REQUEST_NOT_FOUND` xác định.
- FE07 vẫn là chủ sở hữu duy nhất duyệt/từ chối; mọi thay đổi trực tiếp không
  phải `PENDING` trả `409 BORROW_REQUEST_NOT_PENDING` không ghi thành công/audit.
- Phân trang máy chủ frontend, tải chi tiết chuẩn, xuất DOCX an toàn mọi trang,
  điều khiển kết thúc và bảo toàn thất bại.
- Bao phủ service/route/trình duyệt Dashboard Quản trị chỉ bằng chứng cho
  FR-FE11-031 không tái thiết kế production.
- Bao phủ Playwright riêng tính năng cho truy cập Quản trị, cập nhật/vô hiệu hóa
  Thủ thư, Permissions, hành vi phân trang/chi tiết/kết thúc yêu cầu và DOCX.

## 3.5 Mục tiêu quyền sở hữu dữ liệu cá nhân FE11-PDO

Bản sửa `Q-FE11-029` ngày 2026-07-28 thay thế mục tiêu cập nhật hồ sơ được quản
lý bên dưới. Mục tiêu hiện tại:

- Hàng người dùng, thẻ di động và ngăn kéo chi tiết không có thao tác
  `Chỉnh sửa`.
- `Phân quyền` và `Vô hiệu hóa` đủ điều kiện vẫn khả dụng.
- Client frontend không export adapter cập nhật hồ sơ người dùng hiện có.
- Route/controller/validator/service/repository backend không công khai lệnh
  cập nhật hồ sơ người dùng hiện có.
- OpenAPI không chứa thao tác hồ sơ `PUT /api/users/{userId}`.
- Yêu cầu trực tiếp đến đường dẫn đã ngừng trả `404` và không ghi dữ liệu.

- Xác thực route từ chối từng `fullName`, `phone`, `address` và `email`, bao
  gồm email hiện tại không đổi, với `403 PERSONAL_PROFILE_ADMIN_FORBIDDEN` sau
  phân quyền Quản trị.
- Payload trộn `department` hoặc `specialization` với bất kỳ trường bị cấm/
  không rõ nào bị từ chối như một yêu cầu nguyên tử; không trường được phép nào
  áp dụng một phần.
- Kiểm thử service chứng minh đầu vào cấm không bao giờ gọi repository cập nhật
  và không bao giờ tạo audit thành công.
- Kiểm thử repository chứng minh SQL cập nhật chỉ có thể ghi
  `UserProfiles.Department`, `UserProfiles.Specialization` và dấu thời gian cập
  nhật hiệu dụng cho Thủ thư hiện tại; cột cá nhân không nằm trên đường cập nhật.
- Kiểm thử trường công việc được phép giữ chuẩn hóa 100 ký tự/null, đồng thời
  lạc quan, no-op, rollback, DTO an toàn và ngữ nghĩa audit an toàn.
- Kiểm thử frontend chứng minh tên, điện thoại, địa chỉ, email người dùng hiện
  có chỉ đọc; mục tiêu Thành viên/Quản trị không có thao tác cập nhật trường
  công việc; chỉ Thủ thư hiện tại gửi `expectedUpdatedAt`, `department` và
  `specialization`.
- Hồi quy FE03 chứng minh người dùng đã xác thực vẫn có thể cập nhật `fullName`,
  `phone` và `address` của chính mình; hồi quy FE02 chứng minh email vẫn chỉ đọc
  và thiết lập/xác thực tài khoản không đổi.
- Chấp nhận trình duyệt kiểm tra trải nghiệm chi tiết/chỉnh sửa Quản trị và xác
  nhận lần thử API cấm trực tiếp thất bại ngay cả khi UI bị bỏ qua.

## 4. Luồng chấp nhận E2E / thủ công

- Quản trị viên tạo người dùng.
- Quản trị viên xác nhận thao tác danh sách/chi tiết người dùng hiện có bao gồm
  thay vai trò và vô hiệu hóa đủ điều kiện nhưng không có thao tác Chỉnh sửa hồ
  sơ.
- Quản trị viên gọi đường dẫn PUT hồ sơ đã ngừng và nhận `404` không có thay đổi
  lưu bền.
- Chủ sở hữu tài khoản đã xác thực cập nhật trường tên/điện thoại/địa chỉ được
  phê duyệt qua FE03.
- Quản trị viên gán/loại vai trò.
- Quản trị viên xem bản tóm tắt vận hành Dashboard và Quản lý yêu cầu chuẩn qua
  nhiều trang máy chủ.
- Yêu cầu đang chờ có thao tác do FE07 sở hữu; yêu cầu kết thúc chỉ xem; DOCX
  chứa mọi trang đã lọc an toàn.
- Người không phải Quản trị không thể truy cập màn hình/thao tác quản trị.
- Nhật ký kiểm toán hiển thị thao tác Quản trị.

## 5. Bằng chứng hiện tại

- `backend/tests/userManagementRoutes.test.js`
- `backend/tests/userManagementService.test.js` cho lát cắt thiết lập tài khoản
  đã hoàn tất.
- `backend/tests/userRoleRepository.test.js` cho thay vai trò có giao dịch đã
  khóa và rollback kiểm toán.
- Thiết kế lát cắt vai trò được phê duyệt:
  `docs/superpowers/specs/2026-07-18-fe11-transactional-role-management-design.md`.
- Kế hoạch lát cắt vai trò được phê duyệt:
  `docs/superpowers/plans/2026-07-18-fe11-transactional-role-management.md`.
- Bằng chứng lát cắt vai trò tự động: 70/70 kiểm thử tập trung và 399/399 kiểm
  thử backend đầy đủ.
- Thiết kế đọc an toàn được phê duyệt:
  `docs/superpowers/specs/2026-07-18-fe11-safe-user-list-detail-design.md`.
- Kế hoạch đọc an toàn được phê duyệt:
  `docs/superpowers/plans/2026-07-18-fe11-safe-user-list-detail.md`.
- `backend/tests/userRepository.test.js` cho ánh xạ DTO an toàn, SQL tìm kiếm
  đã phê duyệt, predicate tổng hợp, mặc định số không và loại cột thù địch.
- `backend/tests/userManagementService.test.js` cho chuẩn hóa danh sách nghiêm
  ngặt và chi tiết `404 USER_NOT_FOUND`.
- `backend/tests/userManagementRoutes.test.js` cho xác thực danh sách/chi tiết
  ưu tiên Quản trị.
- `frontend/test/userManagementApi.test.js` và
  `frontend/test/userManagementFrontend.test.js` cho bỏ truy vấn,
  `phoneNumber`, tải chi tiết, bản tóm tắt và phục hồi hàng cũ.
- Bằng chứng đọc an toàn tự động: 105/105 backend tập trung, 434/434 backend
  đầy đủ, 81/81 frontend, coverage/lint/build/traceability ĐẠT.
- Thiết kế UI vai trò Quản trị được phê duyệt:
  `docs/superpowers/specs/2026-07-18-fe11-admin-role-ui-contract-design.md`.
- Kế hoạch UI vai trò Quản trị được phê duyệt:
  `docs/superpowers/plans/2026-07-18-fe11-admin-role-ui-contract.md`.
- `frontend/test/userManagementApi.test.js` chứng minh thân thay thế số roleId
  và endpoint số ít không có hợp đồng thay đổi tên vai trò.
- `frontend/test/userManagementFrontend.test.js` chứng minh xác thực danh mục,
  chọn radio, thay thế một yêu cầu, hành vi no-op, đối soát và khóa Lưu.
- Bằng chứng UI vai trò Quản trị tự động: 12/12 frontend tập trung, 101/101
  frontend đầy đủ, 105/105 hồi quy vai trò backend tập trung,
  lint/build/traceability/diff/security ĐẠT.
- Thiết kế Nhật ký kiểm toán được phê duyệt:
  `docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md`.
- Kế hoạch Nhật ký kiểm toán được phê duyệt:
  `docs/superpowers/plans/2026-07-18-fe11-audit-log-contract.md`.
- `backend/tests/adminAuditLogRoutes.test.js`,
  `backend/tests/auditLogRepository.test.js` và
  `backend/tests/adminAuditLogService.test.js` chứng minh quyền sở hữu chuẩn,
  xác thực ưu tiên Quản trị, phân trang SQL đã lọc có kiểu, thứ tự ổn định và
  phép chiếu default-deny nhận biết hành động.
- `frontend/test/adminApi.test.js`, `frontend/test/userManagementApi.test.js`
  và `frontend/test/userManagementFrontend.test.js` chứng minh dùng endpoint
  Quản trị chuẩn, loại adapter cũ, dựng bộ lọc và kết xuất DTO an toàn lồng nhau.
- Bằng chứng B7 Nhật ký kiểm toán: 246/246 backend tập trung, 598/598 backend
  đầy đủ, 111/111 frontend, coverage/lint/build/OpenAPI/traceability/diff/
  security/scope kiểm tra ĐẠT; PR #33 và CI hậu merge `29651173195` đạt.
- Bằng chứng B7 vỏ danh sách người dùng: 95/95 backend tập trung, 600/600
  backend đầy đủ, 113/113 frontend, lint/build/traceability/diff/security kiểm
  tra ĐẠT; PR #34 và CI hậu merge `29652243809` đạt.
- Bằng chứng B7 siêu dữ liệu bằng chứng: đúng 22 hàng Test Case/Status được
  phê duyệt thay đổi, mọi hàng hoãn giữ `Not Started`, hồi quy/CI đầy đủ đạt;
  PR #35 và CI hậu merge `29652617587` đạt.
- Bằng chứng TD-023 sẵn sàng H2: RED-GREEN policy/service backend và kiểm thử
  route ưu tiên Quản trị; RED-GREEN sidebar/API/suy dẫn/cô lập frontend; 606/606
  backend, 120/120 frontend, coverage/lint/build/OpenAPI/health/traceability/
  hồi quy trình duyệt ĐẠT.
- Bằng chứng TD-023 B7: H2/H3 phê duyệt 2026-07-19; PR #37 đạt lượt
  `foundation-checks` `29654621448`, merge thành `356130e4` và CI `main` hậu
  merge chính xác `29655548150` đạt.
- Bằng chứng H2 Finalization Wave A: schema, củng cố thiết lập tài khoản,
  repository vòng đời, tuần tự FE07, frontend access/payload và hồi quy đầy đủ
  được ghi trong
  `.sdd/reviews/fe11-finalization-wave-a-validation-2026-07-19.md`; lượt SQL
  Server dùng một lần sau đó được ghi trong
  `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Bằng chứng H2 Finalization Wave B: Quản lý yêu cầu chuẩn và bao phủ trình
  duyệt Dashboard Quản trị được ghi trong
  `.sdd/reviews/fe11-finalization-wave-b-validation-2026-07-19.md`; kết quả
  mới là 80/80 backend tập trung, 48/48 frontend tập trung, 10/10 tích hợp hệ
  thống và 2/2 kiểm thử Playwright cô lập.
- Bằng chứng quyền sở hữu dữ liệu cá nhân chưa tồn tại. Kết quả FE11-LIFE03
  lịch sử chứng minh hợp đồng rộng hơn mà Q-FE11-027 hiện thay thế và không
  được dùng lại làm bằng chứng đạt cho FE11-PDO02..PDO04.

## 6. Khoảng trống

- Runtime hiện chứa đường cập nhật Quản trị rộng đã bị thay thế; FE11-PDO02..PDO04
  phải thêm kiểm thử thất bại, thu hẹp hành vi backend/UI và công bố bằng chứng
  chấp nhận mới.
- Cho đến khi FE11-PDO02..PDO04 đạt, phạm vi FE11 đã sửa chưa hoàn tất triển
  khai dù baseline Giai đoạn 2 trước đó và bằng chứng vẫn là sự thật lịch sử.

- Thiết lập tài khoản, thay vai trò backend có giao dịch, danh sách/chi tiết an
  toàn và UI thao tác vai trò Quản trị hoàn tất qua review con người, merge và
  CI hậu merge.
- UI thao tác vai trò Quản trị `FE11-UIR01..UIR05` hoàn tất qua B7; PR #30 và
  CI hậu merge `29644292781` đạt, `TD-022` được giải quyết.
- Fast-Track Batch 1 (`TD-024`, `TD-026`, `TD-027`) hoàn tất qua H2/H3, merge
  và CI hậu merge; `FE11-AUD01`, `FE11-ENV01` và `FE11-META01` đã đóng.
- Điều hướng/phân quyền Quản trị `FE11-PERM01..FE11-PERM06` hoàn tất qua H2/H3,
  PR #37 merge và CI hậu merge; `TD-023` được giải quyết.
- Bằng chứng Finalization Wave A và Wave B vẫn hợp lệ cho hành vi không đổi,
  nhưng bằng chứng cập nhật cá nhân/email rộng bị Q-FE11-027 thay thế rõ ràng.
- Cả phần thực thi SQL và trình duyệt FE11 riêng tính năng của `TD-021` đều đạt.
  CI PR nháp #40 `29679154327` đạt trên commit tích hợp `422246b`; chấp nhận
  tích hợp con người vẫn còn trước closeout cuối.

## 7. Lát cắt vai trò có giao dịch

- Kiểm thử route xác thực phân quyền ưu tiên Quản trị và ID người dùng/vai trò
  số nguyên dương.
- Kiểm thử service ánh xạ kết quả repository xác định thành lỗi HTTP an toàn.
- Kiểm thử repository chứng minh trạng thái tác nhân/mục tiêu/vai trò khóa,
  lỗi ánh xạ trùng/thiếu, bảo vệ vai trò cuối, kiểm toán nguyên tử và rollback.
- Bao phủ repository: 100% câu lệnh, 90.24% nhánh, 100% hàm và 100% dòng.
- Chấp nhận đồng thời trên SQL Server vẫn là phần theo dõi phụ thuộc môi trường
  rõ ràng.

## 8. Lát cắt danh sách và chi tiết người dùng an toàn

- Kiểm thử route chứng minh phân quyền ưu tiên Quản trị và xác thực danh sách/
  chi tiết nghiêm ngặt.
- Kiểm thử service chứng minh mặc định chỉ-khi-bỏ, chuẩn hóa enum/tìm kiếm, từ
  chối đầu vào trực tiếp, đọc chi tiết chuyên dụng và `404 USER_NOT_FOUND`.
- Kiểm thử repository chứng minh danh sách cho phép `UserManagementView` rõ
  ràng, `phoneNumber`, vai trò xác định, trường/thứ tự tìm kiếm đã phê duyệt,
  ba predicate tổng hợp và mặc định số không.
- Kiểm thử frontend chứng minh bỏ `ALL`/tìm kiếm rỗng, tìm nạp chi tiết được
  ủy quyền, dữ liệu ngăn kéo chi tiết thực và phục hồi hàng cũ sau 404.
- Bằng chứng đầy đủ: 434/434 backend, 81/81 frontend, bao phủ câu lệnh 92.47%,
  bao phủ nhánh 82.35%, lint/build/traceability ĐẠT.
- Thực thi tổng hợp SQL Server thực và tương tác ngăn kéo cấp trình duyệt vẫn là
  kiểm tra tồn dư phụ thuộc môi trường; SQL phát ra và hợp đồng frontend được tự
  động hóa.

## 9. Lát cắt hợp đồng UI vai trò Quản trị

- Adapter API chỉ nhận `roleId` số cho thay thế nguyên tử.
- Trang chỉ nhận ID từ danh mục đã xác thực và từ chối mục có thể chỉnh sửa
  thiếu, trùng, bằng không hoặc không hợp lệ trước thay đổi.
- Một lần lưu gửi nhiều nhất một yêu cầu thay thế; lưu no-op không gửi thay đổi.
- Lỗi thay đổi đầu tiên dừng chuỗi và tải lại mục tiêu chuẩn vào modal đang mở;
  đối soát thất bại vô hiệu hóa Lưu.
- Tương tác trình duyệt theo vai trò vẫn là kiểm tra chấp nhận tồn dư; browser
  E2E hiện có vẫn là ranh giới hồi quy CI.
- Thực thi đồng thời Quản trị viên cuối SQL Server thực vẫn phụ thuộc môi trường
  và được bao phủ cục bộ bởi kiểm thử hợp đồng backend tập trung không đổi.

## 10. Lệnh / bằng chứng bắt buộc trước merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
npm.cmd run test:e2e
node -e "require('yamljs').load('backend/src/docs/openapi.yaml'); console.log('openapi ok')"
node -e "require('./backend/src/app'); console.log('backend import ok')"
git diff --check
```

## 11. Lát cắt Nhật ký kiểm toán sẵn sàng H2

- Kiểm thử route chứng minh xác thực và phân quyền Quản trị chạy trước xác thực
  chi tiết, giá trị truy vấn chuẩn được chuẩn hóa, route quản lý người dùng đã
  ngừng luôn trả `404 NOT_FOUND` không gọi service.
- Kiểm thử repository chứng minh tham số có kiểu, tìm kiếm LIKE đã escape, một
  phạm vi lọc dùng chung, thứ tự ổn định `CreatedAt DESC, LogId DESC`, join mục
  tiêu người dùng bị hạn chế và kết quả trống trang số không.
- Kiểm thử service bao phủ ma trận hành động liên tính năng đã phê duyệt, siêu
  dữ liệu thù địch/sai định dạng, ánh xạ tác nhân/mục tiêu an toàn, nhãn không
  người dùng và bỏ trường siêu dữ liệu thô/user-agent.
- Kiểm thử frontend chứng minh áp dụng/đặt lại/làm mới bộ lọc, quyền sở hữu API
  Quản trị chuẩn và kết xuất văn bản React chỉ từ `actor`, `target` và
  `details` lồng nhau.
- Thực thi SQL Server thực và tương tác trình duyệt vẫn là mục review H2 phụ
  thuộc môi trường rõ ràng; không schema, dependency, xác thực, ghi kiểm toán
  hoặc hành vi TD-026 nào thay đổi.
