# FE11 Kế hoạch triển khai quyền và điều hướng của quản trị viên

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Đóng `TD-023` bằng cách hiển thị tám mục đã được phê duyệt trong Bảng điều khiển dành
cho quản trị viên và ma trận quyền FE11 chỉ đọc, chỉ dành cho quản trị viên được tạo ở giao diện
người dùng với số lượng vai trò FE12 độc lập.

**Kiến trúc:** FE11 sở hữu chính sách cấp phép Giai đoạn 1 xác định trong mô-đun chính sách máy chủ
và hiển thị các DTO mới được đưa vào danh sách cho phép thông qua `GET /api/admin/permissions`. Bảng
điều khiển dành cho quản trị viên React sử dụng API mà không có ma trận mã hóa cứng, lấy phạm vi
mô-đun từ `allowedRoles` và kết hợp số lượng vai trò từ phản hồi FE12 `/api/reports/users` hiện có
của `roleName`; Trạng thái tải/lỗi FE11 và FE12 vẫn độc lập.

**Tech bộ công nghệ:** Node.js, Express.js, Jest, Supertest, React 19, Vite, Trình chạy thử Node, Bảng điều
khiển dành cho quản trị viên hiện có tương thích với Bootstrap CSS, OpenAPI 3.0 YAML.

## Ràng buộc toàn cầu

- Chế độ quyết định là Hybrid SDD + ADD ở Độ sâu tiêu chuẩn: ủy quyền/API/chính sách/quyền sở hữu/cách ly lỗi là lõi; trình bày là lớp bao.
- Chỉ triển khai `TD-023`, `FR-FE11-030`, `FR-FE11-032`, `AC-FE11-016` và `AC-FE11-017`.
- Thanh bên của Bảng điều khiển dành cho quản trị viên chứa chính xác `home`, `dashboard`, `library`, `circulation`, `requests`, `users`, `permissions` và `audit` theo thứ tự đó.
- `membership`, Xác nhận thanh toán và Xác nhận lượt mượn không phải là các mục nhập trong thanh bên của Bảng điều khiển dành cho quản trị viên; Các tuyến, API, thành phần và hành vi sản phẩm của FE04 vẫn không bị ảnh hưởng.
- Chỉ thêm `GET /api/admin/permissions` chỉ dành cho quản trị viên; xác thực và ủy quyền quản trị viên thực thi trước bộ điều khiển.
- Các khóa cấp cao nhất phản hồi chính xác là `roles` và `permissions`; Các khóa đối tượng vai trò và quyền khớp chính xác với thiết kế đã được phê duyệt.
- Phần máy chủ là chủ sở hữu mã sản phẩm duy nhất của ma trận cấp phép Giai đoạn 1 gồm 15 hàng.
- FE12 `GET /api/reports/users` vẫn là chủ sở hữu duy nhất của số lượng `usersByRole` toàn cầu; không thêm `/api/admin/user-summary` hoặc lấy số lượng từ người dùng được phân trang.
- FE11 ma trận và số lượng yêu cầu FE12 tải, thất bại, thử lại và duy trì các giá trị thành công cuối cùng của chúng một cách độc lập.
- Không thêm chỉnh sửa quyền, phân cấp vai trò, vai trò CRUD, thay đổi lược đồ cơ sở dữ liệu, phụ thuộc, thay đổi sản xuất FE12, thay đổi sản xuất FE04 hoặc hành vi `TD-025`.
- Giữ `.sdd/specs/feat-user-role-management/TASKS.md` ở mức `Implementation State: DEFERRED` đầy đủ chức năng trong suốt lát cắt giới hạn này.
- Thêm khả năng truy vết `@spec FR-FE11-032` vào ranh giới dịch vụ/tuyến đường máy chủ và duy trì các kỳ vọng về khả năng truy vết của giao diện `FR-FE11-030` hiện có.
- Các thay đổi về sản phẩm/kiểm thử/tài liệu đã tạo vẫn có sẵn cho đến khi có sự đánh giá của con người H2. H3 vẫn bắt buộc sau khi kiểm tra PR và trước khi hợp nhất.

---

## Bản đồ tệp

### Tạo

- `backend/src/policies/adminPermissionPolicy.js` - định nghĩa về quyền và vai trò chuẩn bất biến; không có hành vi dịch vụ, kho lưu trữ hoặc vận chuyển.
- `backend/tests/adminPermissionService.test.js` - DTO chính xác, kiểm tra thứ tự, danh sách cho phép, tính duy nhất và đối tượng mới.
- `backend/tests/adminPermissionRoutes.test.js` - xác thực, ủy quyền ưu tiên quản trị viên, ủy quyền bộ điều khiển và kiểm tra phản hồi chính xác.
- `frontend/src/utils/adminPermissions.js` - trình trợ giúp dẫn xuất mô-đun, mô-đun và tóm tắt vai trò thuần túy; không chứa định nghĩa quyền.
- `frontend/test/adminPermissions.test.js` - các kiểm thử có thể thực thi đối với các giá trị mặc định bằng số 0 và dẫn xuất `allowedRoles`.
- `.sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md` - Bản ghi bằng chứng L1-L4 H2/B7.

### sửa đổi

- `.sdd/specs/feat-user-role-management/PLAN.md` - kích hoạt và sau đó đóng phần điều hướng/quyền được giới hạn.
- `.sdd/specs/feat-user-role-management/TASKS.md` - thêm `FE11-PERM01..FE11-PERM06` trong khi vẫn giữ lại toàn bộ chức năng `DEFERRED`.
- `.sdd/specs/feat-user-role-management/TEST_PLAN.md` - thêm mục tiêu tập trung và bằng chứng quan sát được.
- `.sdd/specs/feat-user-role-management/CHANGELOG.md` - phê duyệt bản ghi, sẵn sàng H2 và tích hợp B7 sau này mà không phóng đại toàn bộ FE11.
- `TECH_DEBT.md` - di chuyển `TD-023` từ `OPEN` sang `IN PROGRESS`, sau đó sang Đã giải quyết chỉ sau khi hợp nhất và CI sau hợp nhất.
- `backend/src/services/adminService.js` - sao chép chính sách bất biến vào DTO phản hồi mới.
- `backend/src/controllers/adminController.js` - thêm trình xử lý quyền chỉ đọc.
- `backend/src/routes/adminRoutes.js` - đăng ký lộ trình ưu tiên quản trị viên.
- `frontend/src/api/adminApi.js` - thêm `adminApi.permissions()`.
- `frontend/src/page/UserManagement.jsx` - thanh bên chính xác, trạng thái Quyền/tải/thử lại/kết xuất, độ bao phủ động và trạng thái FE11/FE12 độc lập.
- `frontend/test/adminApi.test.js` - khóa đường dẫn bộ điều hợp chuẩn.
- `frontend/test/userManagementFrontend.test.js` - khóa điều hướng chính xác, tải API, không dự phòng ma trận, dẫn xuất động và cách ly lỗi.
- `frontend/test/appShellFrontend.test.js` - thay thế kỳ vọng cũ của thanh bên Thành viên bằng kỳ vọng về Quyền đã được phê duyệt.
- `docs/api/api-contract.md` - ghi lại điểm cuối và phản hồi chính xác.
- `backend/src/docs/openapi.yaml` - thêm các lược đồ nghiêm ngặt và tài liệu điểm cuối.

## Giao diện bị khóa

```js
// backend/src/services/adminService.js
function getPermissions(): {
  roles: Array<{ roleName: 'ADMIN' | 'LIBRARIAN' | 'MEMBER', label: string }>,
  permissions: Array<{
    permissionKey: string,
    label: string,
    moduleKey: string,
    moduleLabel: string,
    allowedRoles: Array<'ADMIN' | 'LIBRARIAN' | 'MEMBER'>,
  }>,
}
```

```js
// frontend/src/utils/adminPermissions.js
buildPermissionRoleSummary(roles, usersByRole): Array<{ roleName, label, count }>
buildPermissionModuleCoverage(roles, permissions): Array<{ moduleKey, moduleLabel, counts }>
roleAllowsPermission(permission, roleName): boolean
```

```js
// frontend/src/api/adminApi.js
adminApi.permissions(): Promise<{ roles, permissions }>
```

## Lựa chọn chính xác ở cấp độ kế hoạch

- Các giá trị `moduleKey` bị khóa trong gói này dưới dạng `USER_ROLE`, `LIBRARY`, `BORROW_RETURN`, `FINE` và `REPORTS`; Giá trị `moduleLabel` vẫn là nhãn mà con người có thể đọc được đã được phê duyệt.
- Thứ tự bao phủ mô-đun là thứ tự xuất hiện đầu tiên của danh sách quyền chuẩn: Người dùng & Vai trò, Thư viện, Vay/trả sách, khoản phạt, Báo cáo.
- Điểm cuối không sử dụng giá trị nội dung/truy vấn. Không có nhánh xác thực/lỗi mới nào được thêm vào cho đầu vào GET chưa sử dụng; bộ điều khiển luôn gọi `getPermissions()` mà không có đối số.
- Thẻ vai trò Quyền là các phần tử `<article>` không tương tác. Quản lý vai trò vẫn chỉ khả dụng từ luồng hành động Tất cả người dùng hiện có.
- Mã thành viên FE04 hiện tại vẫn còn trong `UserManagement.jsx` mặc dù không thể truy cập được từ thanh bên của Bảng điều khiển dành cho quản trị viên nữa; việc loại bỏ/tái cấu trúc nằm ngoài TD-023.

---

### Nhiệm vụ 1: Kích hoạt Phần quản trị TD-023 đã được phê duyệt

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-user-role-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Sửa đổi: `TECH_DEBT.md`

**Giao diện:**
- Tiêu thụ: thiết kế `docs/superpowers/specs/2026-07-19-fe11-admin-navigation-permissions-design.md` đã được phê duyệt và kế hoạch triển khai đã được xem xét này.
- Tạo ra: ID tác vụ đang hoạt động `FE11-PERM01..FE11-PERM06`, quyền sở hữu tệp rõ ràng và `TD-023: IN PROGRESS` trước khi triển khai sản phẩm.

- [ ] **Bước 1: Tạo cây thực thi riêng biệt**

Sử dụng kỹ năng `using-git-worktrees` trước khi thực hiện. Dựa trên nhánh chức năng trên
`docs/fe11-admin-permissions-contract` để bao gồm thiết kế đã được phê duyệt và kế hoạch đã cam kết:

```powershell
git worktree add .worktrees/fe11-admin-navigation-permissions -b feat/fe11-admin-navigation-permissions docs/fe11-admin-permissions-contract
```

Dự kiến: một cây làm việc sạch trên `feat/fe11-admin-navigation-permissions` chứa cam kết thiết kế
`dbd59f1` và cam kết kế hoạch được tạo từ tài liệu này.

- [ ] **Bước 2: Xác minh các phần phụ thuộc và phạm vi trước khi chỉnh sửa**

```powershell
git fetch origin main
git merge-base --is-ancestor 411fa25 origin/main
git merge-base --is-ancestor c286cd9 origin/main
git status --short --branch
rg -n "TD-023|TD-025|Implementation State: DEFERRED|FE11-ENV01" TECH_DEBT.md .sdd/specs/feat-user-role-management
```

Dự kiến: cả hai lệnh tổ tiên đều thoát `0`; `TD-023` và `TD-025` là `OPEN`; toàn bộ FE11 là
`DEFERRED`; cây công việc thực thi mới sạch sẽ.

- [ ] **Bước 3: Thêm lát cắt giới hạn vào FE11 PLAN và TASKS**

Nối phần PLAN chính xác này sau luồng nhanh Lô 1:

```markdown
## 14. Phần điều hướng và quyền của quản trị viên

Trạng thái tích hợp: ĐANG TIẾN HÀNH

### Trong phạm vi

- Căn chỉnh thanh bên của Bảng điều khiển dành cho quản trị viên với tám mục nhập đã được phê duyệt.
- Thêm `GET /api/admin/permissions` chỉ dành cho quản trị viên với chính sách Giai đoạn 1 chuẩn 15 hàng.
- Soạn dữ liệu quyền FE11 với số lượng FE12 `usersByRole` độc lập ở giao diện người dùng.
- Lấy vùng phủ mô-đun và các ô ma trận từ `allowedRoles`; giữ chế độ xem chỉ đọc.

### Ngoài phạm vi

- Chỉnh sửa quyền, phân cấp vai trò/CRUD, thay đổi lược đồ, xóa FE04, thay đổi sản xuất FE12 và TD-025.

### Cổng xác nhận

- Các kiểm thử chính sách/dịch vụ/tuyến đường máy chủ chứng minh DTO chính xác, đối tượng mới và quyền ưu tiên của Quản trị viên.
- Các kiểm thử giao diện người dùng chứng minh thứ tự thanh bên chính xác, cách sử dụng API chuẩn, không có ma trận dự phòng được mã hóa cứng, số lượng FE12, mức độ bao phủ xuất phát và các lần thử lại/lỗi riêng lẻ.
- Kiểm tra đầy đủ, phạm vi bảo hiểm, tìm lỗi mã nguồn, bản dựng, trình duyệt E2E, phân tích cú pháp OpenAPI, nhập tình trạng, truy vết, vệ sinh khác biệt, quét phạm vi và thẻ quét bí mật.
- H2 đứng trước cam kết/đẩy; H3 đi trước hợp nhất; TD-023 chỉ đóng sau CI chính sau hợp nhất và bằng chứng khóa.
```

Chèn nhóm TASKS chính xác này trước `## Deferred FE11 Work`:

```markdown
## Nhiệm vụ điều hướng và quyền quản trị

- [ ] **FE11-PERM01 - Kích hoạt hợp đồng TD-023 đã được phê duyệt.**
  - Bản đồ tới: TD-023; FR-FE11-030/032; AC-FE11-016/017.
  - DoD: PLAN/TASKS/TEST_PLAN/CHANGELOG và đặt tên trạng thái nợ trong phạm vi giới hạn; toàn bộ FE11 vẫn được hoãn lại.

- [ ] **FE11-PERM02 - Thêm chính sách cấp phép chuẩn và dịch vụ mới DTO.**
  - Bản đồ tới: FR-FE11-032; BR-FE11-017; AC-FE11-017.
  - DoD: backend sở hữu chính xác 3 vai trò và 15 quyền; mọi lệnh gọi đều trả về các đối tượng độc lập trong danh sách cho phép với thứ tự ổn định.

- [ ] **FE11-PERM03 - Chỉ dành cho quản trị viên GET /api/admin/permissions.**
  - Bản đồ tới: BR-FE11-001/011/012/017; FR-FE11-015/032; AC-FE11-017; NFR-FE11-SEC-001/002.
  - DoD: xác thực và ủy quyền quản trị viên chạy trước khi gọi bộ điều khiển; Quản trị viên nhận được chính xác `{ roles, permissions }`.

- [ ] **FE11-PERM04 - Căn chỉnh điều hướng của Quản trị viên và sử dụng quyền API.**
  - Bản đồ tới: BR-FE11-016/017; FR-FE11-030/032; AC-FE11-016/017.
  - DoD: thanh bên có chính xác tám mục được phê duyệt; Quyền có thể truy cập được; Tư cách thành viên vẫn còn nguyên bên ngoài thanh bên; không còn hằng số ma trận giao diện người dùng.

- [ ] **FE11-PERM05 - Soạn các quyền FE11 với số lượng FE12 độc lập.**
  - Bản đồ tới: FR-FE11-032; AC-FE11-017; Quyết định sở hữu TD-026.
  - DoD: thẻ vai trò sử dụng FE12 `usersByRole`; vùng phủ sóng/ô lấy từ FE11 `allowedRoles`; những thất bại độc lập sẽ bảo toàn thành công cuối cùng và đưa ra các biện pháp kiểm soát thử lại.

- [ ] **FE11-PERM06 - Vượt qua H2/H3/B7 và đóng TD-023.**
  - Phụ thuộc vào: FE11-PERM01..FE11-PERM05.
  - DoD: Bằng chứng L1-L4, đánh giá của con người, hợp nhất PR triển khai, CI chính sau hợp nhất, PR kết thúc và CI chính cuối cùng được ghi lại; TD-023 được giải quyết trong khi TD-025 và toàn bộ FE11 vẫn bị trì hoãn.
```

- [ ] **Bước 4: Đánh dấu khoản nợ và kiểm thử chiến lược là đang hoạt động mà không cần yêu cầu triển khai**

Chỉ thay đổi ô trạng thái `TD-023` từ `OPEN` thành `IN PROGRESS` và cập nhật `Last Updated` thành
`2026-07-19`.

Thêm phần TEST_PLAN này sau các mục tiêu hiện tại của luồng nhanh Lô 1:

```markdown
## 3.2 Mục tiêu hiện tại của TD-023

- Thanh bên Bảng điều khiển dành cho quản trị viên có tám mục chính xác và phần Quyền có thể truy cập.
- `GET /api/admin/permissions` ưu tiên quản trị viên với các khóa DTO có vai trò/quyền chính xác và 15 hàng chuẩn.
- Các đối tượng phản hồi mới, mảng vai trò hợp lệ/loại bỏ trùng lặp và không có phần phụ thuộc vào kho lưu trữ/ghi.
- FE12 Số lượng `usersByRole` được tạo độc lập với dữ liệu ma trận FE11.
- Phạm vi mô-đun/ô ma trận có nguồn gốc, các lỗi riêng biệt có thể thử lại và không có dự phòng ma trận giao diện người dùng được mã hóa cứng.
```

Thêm mục nhập CHANGELOG này:

```markdown
## 2026-07-19 - Phần điều hướng và quyền của quản trị viên đã được phê duyệt

- Đã phê duyệt Kế hoạch triển khai và thiết kế theo chiều sâu tiêu chuẩn Hybrid SDD + ADD cho `TD-023`.
- Đã khóa chính xác thanh bên Bảng điều khiển dành cho quản trị viên gồm 8 mục, `GET /api/admin/permissions` chỉ dành cho quản trị viên, chính sách FE11 15 hàng chuẩn và số lượng vai trò FE12 độc lập.
- Đã kích hoạt `FE11-PERM01..FE11-PERM06` và đánh dấu `TD-023` đang được tiến hành mà không xác nhận việc triển khai sản phẩm.
- Tư cách thành viên FE04 được bảo tồn, TD-025 và `Implementation State: DEFERRED` toàn bộ chức năng.
```

- [ ] **Bước 5: Xác minh chênh lệch kích hoạt quản trị**

```powershell
rg -n "FE11-PERM01|FE11-PERM06|TD-023.*IN PROGRESS|Implementation State: DEFERRED|TD-025.*OPEN" .sdd/specs/feat-user-role-management TECH_DEBT.md
git diff --check
```

Dự kiến: tất cả sáu ID nhiệm vụ đều tồn tại; `TD-023` đang được tiến hành; `TD-025` vẫn mở; toàn bộ
FE11 vẫn được hoãn lại; vượt qua kiểm tra khác biệt.

Không cam kết khác biệt quản trị được tạo này trước H2.

---

### Nhiệm vụ 2: Thêm Chính sách máy chủ chuẩn và Dịch vụ mới DTO

**Tệp:**
- Tạo: `backend/src/policies/adminPermissionPolicy.js`
- Tạo: `backend/tests/adminPermissionService.test.js`
- Sửa đổi: `backend/src/services/adminService.js`

**Giao diện:**
- Tiêu thụ: không có cơ sở dữ liệu hoặc kho lưu trữ; chính sách chính xác từ thiết kế TD-023 đã được phê duyệt.
- Sản xuất: `adminPermissionPolicy` và `adminService.getPermissions()` bất biến trả về DTO mới.

- [ ] **Bước 1: Viết các kiểm thử hợp đồng dịch vụ không thành công**

Tạo `backend/tests/adminPermissionService.test.js`:

```js
jest.mock('../src/repositories/adminRepository', () => ({
  getResourceConfig: jest.fn(),
  getDashboard: jest.fn(),
  listBooks: jest.fn(),
  listResource: jest.fn(),
  createResource: jest.fn(),
  updateResource: jest.fn(),
  deactivateResource: jest.fn(),
  listBorrowings: jest.fn(),
  listRequests: jest.fn(),
}));
jest.mock('../src/repositories/auditLogRepository', () => ({
  listAuditLogs: jest.fn(),
}));

const adminRepository = require('../src/repositories/adminRepository');
const auditLogRepository = require('../src/repositories/auditLogRepository');
const adminService = require('../src/services/adminService');

const EXPECTED_PERMISSIONS = [
  { permissionKey: 'USER_VIEW', label: 'View users', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'USER_CREATE', label: 'Create accounts', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'USER_UPDATE', label: 'Update accounts', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'USER_DEACTIVATE', label: 'Deactivate accounts', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'ROLE_MANAGE', label: 'Manage roles', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'AUDIT_VIEW', label: 'View audit logs', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'CATALOG_MANAGE', label: 'Manage library catalog', moduleKey: 'LIBRARY', moduleLabel: 'Library', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'METADATA_MANAGE', label: 'Manage authors/publishers/categories', moduleKey: 'LIBRARY', moduleLabel: 'Library', allowedRoles: ['ADMIN'] },
  { permissionKey: 'BORROW_APPROVE_REJECT', label: 'Approve/reject borrow requests', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'RETURN_RENEW_PROCESS', label: 'Process returns and renewals', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'FINE_CALCULATE_COLLECT', label: 'Calculate and collect fines', moduleKey: 'FINE', moduleLabel: 'Fine', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'FINE_WAIVE_CANCEL', label: 'Waive or cancel fines', moduleKey: 'FINE', moduleLabel: 'Fine', allowedRoles: ['ADMIN'] },
  { permissionKey: 'REPORT_VIEW', label: 'View reports', moduleKey: 'REPORTS', moduleLabel: 'Reports', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'BORROW_REQUEST_CREATE', label: 'Create borrow request', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['MEMBER'] },
  { permissionKey: 'BORROW_HISTORY_VIEW_OWN', label: 'View own borrowing history', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['MEMBER'] },
];

test('getPermissions returns the exact deterministic allowlisted contract', () => {
  const result = adminService.getPermissions();

  expect(Object.keys(result)).toEqual(['roles', 'permissions']);
  expect(result.roles).toEqual([
    { roleName: 'ADMIN', label: 'Admin' },
    { roleName: 'LIBRARIAN', label: 'Librarian' },
    { roleName: 'MEMBER', label: 'Member' },
  ]);
  expect(result.permissions).toEqual(EXPECTED_PERMISSIONS);

  for (const role of result.roles) {
    expect(Object.keys(role)).toEqual(['roleName', 'label']);
  }
  for (const permission of result.permissions) {
    expect(Object.keys(permission)).toEqual([
      'permissionKey',
      'label',
      'moduleKey',
      'moduleLabel',
      'allowedRoles',
    ]);
    expect(new Set(permission.allowedRoles).size).toBe(permission.allowedRoles.length);
    expect(permission.allowedRoles.every((roleName) => (
      ['ADMIN', 'LIBRARIAN', 'MEMBER'].includes(roleName)
    ))).toBe(true);
  }
  for (const repositoryMethod of Object.values(adminRepository)) {
    expect(repositoryMethod).not.toHaveBeenCalled();
  }
  expect(auditLogRepository.listAuditLogs).not.toHaveBeenCalled();
});

test('getPermissions returns fresh nested objects on every call', () => {
  const first = adminService.getPermissions();
  first.roles[0].label = 'Changed';
  first.permissions[0].label = 'Changed';
  first.permissions[0].allowedRoles.push('MEMBER');
  first.permissions.reverse();

  const second = adminService.getPermissions();
  expect(second.roles[0]).toEqual({ roleName: 'ADMIN', label: 'Admin' });
  expect(second.permissions[0]).toMatchObject({
    permissionKey: 'USER_VIEW',
    label: 'View users',
    allowedRoles: ['ADMIN'],
  });
  expect(second.permissions).toEqual(EXPECTED_PERMISSIONS);
});
```

- [ ] **Bước 2: Chạy kiểm thử dịch vụ để quan sát RED**

Chạy từ `backend/`:

```powershell
npm.cmd test -- --runTestsByPath tests/adminPermissionService.test.js
```

Dự kiến: THẤT BẠI vì `adminService.getPermissions` không tồn tại.

- [ ] **Bước 3: Tạo mô-đun chính sách bất biến**

Tạo `backend/src/policies/adminPermissionPolicy.js`:

```js
function freezePermission(permission) {
  return Object.freeze({
    ...permission,
    allowedRoles: Object.freeze([...permission.allowedRoles]),
  });
}

const adminPermissionPolicy = Object.freeze({
  roles: Object.freeze([
    Object.freeze({ roleName: 'ADMIN', label: 'Admin' }),
    Object.freeze({ roleName: 'LIBRARIAN', label: 'Librarian' }),
    Object.freeze({ roleName: 'MEMBER', label: 'Member' }),
  ]),
  permissions: Object.freeze([
    { permissionKey: 'USER_VIEW', label: 'View users', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'USER_CREATE', label: 'Create accounts', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'USER_UPDATE', label: 'Update accounts', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'USER_DEACTIVATE', label: 'Deactivate accounts', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'ROLE_MANAGE', label: 'Manage roles', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'AUDIT_VIEW', label: 'View audit logs', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'CATALOG_MANAGE', label: 'Manage library catalog', moduleKey: 'LIBRARY', moduleLabel: 'Library', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
    { permissionKey: 'METADATA_MANAGE', label: 'Manage authors/publishers/categories', moduleKey: 'LIBRARY', moduleLabel: 'Library', allowedRoles: ['ADMIN'] },
    { permissionKey: 'BORROW_APPROVE_REJECT', label: 'Approve/reject borrow requests', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
    { permissionKey: 'RETURN_RENEW_PROCESS', label: 'Process returns and renewals', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
    { permissionKey: 'FINE_CALCULATE_COLLECT', label: 'Calculate and collect fines', moduleKey: 'FINE', moduleLabel: 'Fine', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
    { permissionKey: 'FINE_WAIVE_CANCEL', label: 'Waive or cancel fines', moduleKey: 'FINE', moduleLabel: 'Fine', allowedRoles: ['ADMIN'] },
    { permissionKey: 'REPORT_VIEW', label: 'View reports', moduleKey: 'REPORTS', moduleLabel: 'Reports', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
    { permissionKey: 'BORROW_REQUEST_CREATE', label: 'Create borrow request', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['MEMBER'] },
    { permissionKey: 'BORROW_HISTORY_VIEW_OWN', label: 'View own borrowing history', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['MEMBER'] },
  ].map(freezePermission)),
});

module.exports = { adminPermissionPolicy };
```

- [ ] **Bước 4: Thêm dịch vụ mới DTO**

Ở đầu `backend/src/services/adminService.js` thêm:

```js
const { adminPermissionPolicy } = require('../policies/adminPermissionPolicy');
```

Thêm vào trước `getDashboard`:

```js
// @spec FR-FE11-032, BR-FE11-017, AC-FE11-017
function getPermissions() {
  return {
    roles: adminPermissionPolicy.roles.map(({ roleName, label }) => ({ roleName, label })),
    permissions: adminPermissionPolicy.permissions.map((permission) => ({
      permissionKey: permission.permissionKey,
      label: permission.label,
      moduleKey: permission.moduleKey,
      moduleLabel: permission.moduleLabel,
      allowedRoles: [...permission.allowedRoles],
    })),
  };
}
```

Thêm `getPermissions` vào `module.exports` trước `getDashboard`.

- [ ] **Bước 5: Chạy GREEN và hồi quy dịch vụ bị ảnh hưởng**

```powershell
npm.cmd test -- --runTestsByPath tests/adminPermissionService.test.js tests/adminAuditLogService.test.js
```

Dự kiến: cả hai dãy ĐẠT; các kiểm thử quyền chứng minh hình dạng/thứ tự chính xác và các mảng lồng nhau mới.

Không cam kết trước H2.

---

### Nhiệm vụ 3: Hiển thị Lộ trình cấp quyền ưu tiên của quản trị viên

**Tệp:**
- Tạo: `backend/tests/adminPermissionRoutes.test.js`
- Sửa đổi: `backend/src/controllers/adminController.js`
- Sửa đổi: `backend/src/routes/adminRoutes.js`

**Giao diện:**
- Tiêu thụ: `adminService.getPermissions()` từ Nhiệm vụ 2.
- Tạo ra: `GET /api/admin/permissions` chỉ dành cho quản trị viên đã được xác thực mà không cần thông tin đầu vào yêu cầu và thông qua phản hồi dịch vụ chính xác.

- [ ] **Bước 1: Viết các kiểm thử lộ trình thất bại**

Tạo `backend/tests/adminPermissionRoutes.test.js`:

```js
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');

const request = require('supertest');
const { createApp } = require('../src/app');

function makeApp({ roles = ['ADMIN'], adminService } = {}) {
  const authService = {
    authenticateToken: jest.fn(async () => ({
      userId: 99,
      email: 'admin@example.test',
      roles,
    })),
  };

  return createApp({
    authService,
    adminService,
    userManagementService: {},
  });
}

const payload = {
  roles: [
    { roleName: 'ADMIN', label: 'Admin' },
    { roleName: 'LIBRARIAN', label: 'Librarian' },
    { roleName: 'MEMBER', label: 'Member' },
  ],
  permissions: [
    {
      permissionKey: 'USER_VIEW',
      label: 'View users',
      moduleKey: 'USER_ROLE',
      moduleLabel: 'User & Role',
      allowedRoles: ['ADMIN'],
    },
  ],
};

test('GET /api/admin/permissions requires authentication before the controller', async () => {
  const adminService = { getPermissions: jest.fn(() => payload) };
  const response = await request(makeApp({ adminService }))
    .get('/api/admin/permissions');

  expect(response.status).toBe(401);
  expect(response.body.error.code).toBe('UNAUTHORIZED');
  expect(adminService.getPermissions).not.toHaveBeenCalled();
});

test.each([['MEMBER'], ['LIBRARIAN']])(
  'GET /api/admin/permissions rejects %s before the controller',
  async (roleName) => {
    const adminService = { getPermissions: jest.fn(() => payload) };
    const response = await request(makeApp({ roles: [roleName], adminService }))
      .get('/api/admin/permissions')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ROLE_REQUIRED');
    expect(adminService.getPermissions).not.toHaveBeenCalled();
  }
);

test('GET /api/admin/permissions returns the exact service payload to Admin', async () => {
  const adminService = { getPermissions: jest.fn(() => payload) };
  const response = await request(makeApp({ adminService }))
    .get('/api/admin/permissions')
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(200);
  expect(adminService.getPermissions).toHaveBeenCalledWith();
  expect(response.body).toEqual(payload);
});
```

- [ ] **Bước 2: Chạy kiểm thử lộ trình để quan sát RED**

```powershell
npm.cmd test -- --runTestsByPath tests/adminPermissionRoutes.test.js
```

Dự kiến: THẤT BẠI với `404` vì `/api/admin/permissions` vắng mặt.

- [ ] **Bước 3: Thêm bộ điều khiển và tuyến đường**

Thêm trình xử lý này vào đối tượng được trả về bởi `createAdminController`:

```js
permissions: async (req, res, next) => {
  try {
    return res.status(200).json(await service.getPermissions());
  } catch (error) {
    return next(error);
  }
},
```

Đăng ký tuyến đường này ngay sau `/audit-logs` trong `backend/src/routes/adminRoutes.js`:

```js
// @spec FR-FE11-032, BR-FE11-017, AC-FE11-017
router.get('/permissions', ...requireAdmin, controller.permissions);
```

- [ ] **Bước 4: Chạy chương trình máy chủ tập trung GREEN**

```powershell
npm.cmd test -- --runTestsByPath tests/adminPermissionService.test.js tests/adminPermissionRoutes.test.js tests/adminAuditLogRoutes.test.js tests/securityRegression.test.js
```

Dự kiến: cả bốn dãy ĐẠT; hồi quy bảo mật tiếp tục chứng minh rằng các tuyến Quản trị viên yêu cầu
xác thực khi các giá trị mặc định của môi trường không an toàn.

Không cam kết trước H2.

---

### Tác vụ 4: Căn chỉnh điều hướng và hiển thị chế độ xem quyền động

**Tệp:**
- Tạo: `frontend/src/utils/adminPermissions.js`
- Tạo: `frontend/test/adminPermissions.test.js`
- Sửa đổi: `frontend/src/api/adminApi.js`
- Sửa đổi: `frontend/src/page/UserManagement.jsx`
- Sửa đổi: `frontend/test/adminApi.test.js`
- Sửa đổi: `frontend/test/userManagementFrontend.test.js`
- Sửa đổi: `frontend/test/appShellFrontend.test.js`

**Giao diện:**
- Tiêu thụ: FE11 `{ roles, permissions }` và FE12 `{ usersByRole }` hiện có.
- Tạo ra: thanh bên chính xác, phần Quyền chỉ đọc có thể truy cập, thẻ vai trò số, phạm vi mô-đun/ô ma trận dẫn xuất và hành vi thử lại/lỗi độc lập.

- [ ] **Bước 1: Viết các kiểm thử đạo hàm thuần túy và API thất bại**

Nối vào `frontend/test/adminApi.test.js`:

```js
test('FE11 Permissions use the canonical Admin endpoint and authorized wrapper', async () => {
  const source = await readFile(apiPath, 'utf8');
  assert.match(
    source,
    /permissions\(\)[\s\S]*?authorizedRequest\([\s\S]*?url: '\/admin\/permissions'/,
  );
});
```

Tạo `frontend/test/adminPermissions.test.js`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPermissionModuleCoverage,
  buildPermissionRoleSummary,
  roleAllowsPermission,
} from '../src/utils/adminPermissions.js';

const roles = [
  { roleName: 'ADMIN', label: 'Admin' },
  { roleName: 'LIBRARIAN', label: 'Librarian' },
  { roleName: 'MEMBER', label: 'Member' },
];
const permissions = [
  { permissionKey: 'USER_VIEW', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'CATALOG_MANAGE', moduleKey: 'LIBRARY', moduleLabel: 'Library', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'BORROW_REQUEST_CREATE', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['MEMBER'] },
];

test('role summary joins FE12 counts by roleName with numeric zero defaults', () => {
  assert.deepEqual(buildPermissionRoleSummary(roles, {
    ADMIN: '2',
    LIBRARIAN: 4,
    MEMBER: 'invalid',
  }), [
    { roleName: 'ADMIN', label: 'Admin', count: 2 },
    { roleName: 'LIBRARIAN', label: 'Librarian', count: 4 },
    { roleName: 'MEMBER', label: 'Member', count: 0 },
  ]);
});

test('module coverage is derived from allowedRoles in first-seen module order', () => {
  assert.deepEqual(buildPermissionModuleCoverage(roles, permissions), [
    { moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', counts: { ADMIN: 1, LIBRARIAN: 0, MEMBER: 0 } },
    { moduleKey: 'LIBRARY', moduleLabel: 'Library', counts: { ADMIN: 1, LIBRARIAN: 1, MEMBER: 0 } },
    { moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', counts: { ADMIN: 0, LIBRARIAN: 0, MEMBER: 1 } },
  ]);
});

test('matrix cells read only the server allowedRoles array', () => {
  assert.equal(roleAllowsPermission(permissions[1], 'ADMIN'), true);
  assert.equal(roleAllowsPermission(permissions[1], 'LIBRARIAN'), true);
  assert.equal(roleAllowsPermission(permissions[1], 'MEMBER'), false);
});
```

- [ ] **Bước 2: Thêm các kiểm thử hợp đồng nguồn không thành công để điều hướng và cách ly chính xác**

Nối vào `frontend/test/userManagementFrontend.test.js`:

```js
test('FE11 Admin sidebar exposes exactly the approved eight entries in order', async () => {
  const source = await readFile(pagePath, 'utf8');
  const sidebar = source.match(/function Sidebar\([^]*?\n}\r?\n\r?\nfunction AdminLineChart/)?.[0] || '';
  const entries = [...sidebar.matchAll(/\{ id: '([^']+)'[^\n]+label: '([^']+)'/g)]
    .map((match) => [match[1], match[2]]);

  assert.deepEqual(entries, [
    ['home', 'Trang chủ'],
    ['dashboard', 'Tổng quan'],
    ['library', 'Thư viện'],
    ['circulation', 'Quản lý mượn trả'],
    ['requests', 'Quản lý yêu cầu'],
    ['users', 'Quản lý người dùng'],
    ['permissions', 'Phân quyền'],
    ['audit', 'Nhật ký hoạt động'],
  ]);
  assert.doesNotMatch(sidebar, /membership|Confirm Payment|Confirm Borrow/);
});

test('FE11 Permissions loads FE11 matrix and FE12 counts independently', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /async function loadPermissions\(\{ announce = false \} = \{\}\)/);
  assert.match(source, /const result = await adminApi\.permissions\(\)/);
  assert.match(source, /if \(activeSection !== 'permissions'\) return/);
  assert.match(source, /loadPermissions\(\)/);
  assert.match(source, /loadUserStatistics\(\)/);
  assert.match(source, /setPermissionsError\(error\.message\)/);
  assert.match(source, /setUserStatsError\(error\.message\)/);

  const permissionsCatch = source.match(/async function loadPermissions\([^]*?\n {2}\}/)?.[0] || '';
  assert.doesNotMatch(permissionsCatch, /catch \(error\)[^]*?setPermissionPolicy\(/);
  const statisticsBlock = source.match(/async function loadUserStatistics\([^]*?\n {2}\}/)?.[0] || '';
  assert.doesNotMatch(statisticsBlock, /catch \(error\)[^]*?setUserStats\(/);
});

test('FE11 Permissions derives the view from server data without a hardcoded matrix fallback', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /buildPermissionRoleSummary\(permissionPolicy\.roles, userStats\.usersByRole\)/);
  assert.match(source, /buildPermissionModuleCoverage\(permissionPolicy\.roles, permissionPolicy\.permissions\)/);
  assert.match(source, /roleAllowsPermission\(permission, role\.roleName\)/);
  assert.match(source, /permissionPolicy\.permissions\.map/);
  assert.doesNotMatch(source, /const permissionRows =/);
  assert.doesNotMatch(source, /const permissionModules =/);
});
```

Trong `frontend/test/appShellFrontend.test.js`, thay thế mục nhập mảng nhãn cũ `'Quản lý hội viên'`
bằng `'Phân quyền'`, sau đó thêm:

```js
assert.doesNotMatch(source, /\{ id: 'membership'[^\n]+label: 'Quản lý hội viên'/);
```

- [ ] **Bước 3: Chạy giao diện người dùng RED**

Chạy từ `frontend/`:

```powershell
node --test test/adminApi.test.js test/adminPermissions.test.js test/userManagementFrontend.test.js test/appShellFrontend.test.js
```

Dự kiến: THẤT BẠI vì tiện ích và bộ chuyển đổi không tồn tại, Tư cách thành viên vẫn ở thanh bên,
Quyền vẫn không thể truy cập được và trang vẫn sở hữu `permissionRows`/`permissionModules`.

- [ ] **Bước 4: Triển khai tiện ích phái sinh thuần túy**

Tạo `frontend/src/utils/adminPermissions.js`:

```js
function toNonNegativeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

export function buildPermissionRoleSummary(roles = [], usersByRole = {}) {
  return roles.map(({ roleName, label }) => ({
    roleName,
    label,
    count: toNonNegativeCount(usersByRole?.[roleName]),
  }));
}

export function buildPermissionModuleCoverage(roles = [], permissions = []) {
  const modules = new Map();

  for (const permission of permissions) {
    if (!modules.has(permission.moduleKey)) {
      modules.set(permission.moduleKey, {
        moduleKey: permission.moduleKey,
        moduleLabel: permission.moduleLabel,
        counts: Object.fromEntries(roles.map(({ roleName }) => [roleName, 0])),
      });
    }

    const module = modules.get(permission.moduleKey);
    for (const { roleName } of roles) {
      if (permission.allowedRoles.includes(roleName)) {
        module.counts[roleName] += 1;
      }
    }
  }

  return [...modules.values()];
}

export function roleAllowsPermission(permission, roleName) {
  return permission.allowedRoles.includes(roleName);
}
```

- [ ] **Bước 5: Thêm bộ điều hợp Quản trị API và thanh bên chính xác**

Thêm vào `frontend/src/api/adminApi.js` trước `auditLogs`:

```js
permissions() {
  return authorizedRequest(
    { method: 'get', url: '/admin/permissions' },
    'Khong the tai ma tran phan quyen.'
  );
},
```

Trong `UserManagement.jsx`, nhập ba chức năng tiện ích và thay thế các mục thanh bên bằng:

```js
// @spec FR-FE11-030, BR-FE11-016, AC-FE11-016
const items = [
  { id: 'home', icon: Home, label: 'Trang chủ', path: '/home' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { id: 'library', icon: Library, label: 'Thư viện' },
  { id: 'circulation', icon: BookCopy, label: 'Quản lý mượn trả' },
  { id: 'requests', icon: ClipboardList, label: 'Quản lý yêu cầu' },
  { id: 'users', icon: Users, label: 'Quản lý người dùng' },
  { id: 'permissions', icon: Shield, label: 'Phân quyền' },
  { id: 'audit', icon: ClipboardList, label: 'Nhật ký hoạt động' },
];
```

Chỉ xóa hai hằng số sản phẩm giao diện người dùng bắt đầu từ `const permissionRows =` và `const
permissionModules =`. Không xóa các mục nhập Thành viên, trạng thái, bộ tải, thành phần hoặc các
tuyến FE04.

Thay thế khóa siêu dữ liệu của phần `roles` bằng:

```js
permissions: { eyebrow: 'Kiểm soát truy cập', title: 'Phân quyền' },
```

- [ ] **Bước 6: Thêm trạng thái độc lập, trình tải và mô hình khung nhìn dẫn xuất**

Thêm trạng thái thành phần bên cạnh trạng thái thống kê người dùng hiện có:

```js
const [permissionPolicy, setPermissionPolicy] = useState({ roles: [], permissions: [] });
const [permissionsLoading, setPermissionsLoading] = useState(false);
const [permissionsError, setPermissionsError] = useState('');
const [permissionsUpdatedAt, setPermissionsUpdatedAt] = useState(null);
```

Thêm các giá trị dẫn xuất bên cạnh các khối `useMemo` hiện có:

```js
const permissionRoleSummary = useMemo(
  () => buildPermissionRoleSummary(permissionPolicy.roles, userStats.usersByRole),
  [permissionPolicy.roles, userStats.usersByRole]
);
const permissionModuleCoverage = useMemo(
  () => buildPermissionModuleCoverage(permissionPolicy.roles, permissionPolicy.permissions),
  [permissionPolicy.roles, permissionPolicy.permissions]
);
```

Thêm trình tải trước `loadUserStatistics`:

```js
async function loadPermissions({ announce = false } = {}) {
  setPermissionsLoading(true);
  setPermissionsError('');

  try {
    const result = await adminApi.permissions();
    setPermissionPolicy({
      roles: result.roles || [],
      permissions: result.permissions || [],
    });
    setPermissionsUpdatedAt(new Date());
    if (announce) {
      setToast({ type: 'success', message: 'Đã làm mới ma trận phân quyền.' });
    }
  } catch (error) {
    setPermissionsError(error.message);
    if (announce) setToast({ type: 'error', message: error.message });
  } finally {
    setPermissionsLoading(false);
  }
}
```

Thêm hiệu ứng chuyên dụng để cả hai chủ sở hữu bắt đầu độc lập khi Quyền mở:

```js
useEffect(() => {
  if (activeSection !== 'permissions') return;
  const timer = setTimeout(() => {
    loadPermissions();
    loadUserStatistics();
  }, 0);

  return () => clearTimeout(timer);
// Each loader owns its own state and retry lifecycle.
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeSection]);
```

Thêm `permissions: permissionsLoading || userStatsLoading` vào tính toán tải phần hoạt động được
thanh trên cùng sử dụng. Trong trình xử lý làm mới thêm:

Thay thế các biểu thức tải nội tuyến lặp lại bằng giá trị chính xác này sau khi
`userDirectoryLoading` được xác định:

```js
const activeSectionLoading = {
  users: userDirectoryLoading,
  dashboard: dashboardLoading,
  library: libraryLoading,
  circulation: borrowingsLoading,
  requests: requestsLoading,
  membership: membershipLoading,
  permissions: permissionsLoading || userStatsLoading,
  audit: auditLoading,
}[activeSection] || false;
```

Sử dụng `activeSectionLoading` cho thuộc tính `disabled` của nút làm mới, lớp biểu tượng quay và
nhãn `Đang tải...`. Trong trình xử lý làm mới thêm:

```js
else if (activeSection === 'permissions') {
  loadPermissions({ announce: true });
  loadUserStatistics();
}
```

- [ ] **Bước 7: Thay thế phần được mã hóa cứng không thể truy cập bằng kết xuất chỉ đọc động**

Thay thế `activeSection === 'roles'` bằng `activeSection === 'permissions'` và kết xuất:

```jsx
{activeSection === 'permissions' && (
  <section className="um-admin-section">
    <div className="um-permission-status-grid" aria-live="polite">
      <article>
        <strong>Ma trận FE11</strong>
        <span>
          {permissionsUpdatedAt
            ? `Cập nhật lúc ${permissionsUpdatedAt.toLocaleTimeString('vi-VN')}`
            : permissionsLoading ? 'Đang tải...' : 'Chưa tải dữ liệu.'}
        </span>
        {permissionsError && (
          <button type="button" className="um-secondary-button" onClick={() => loadPermissions()}>
            Thử lại ma trận
          </button>
        )}
      </article>
      <article>
        <strong>Thống kê FE12</strong>
        <span>{userStatsLoading ? 'Đang tải...' : userStatsError || 'Đã tải số lượng vai trò.'}</span>
        {userStatsError && (
          <button type="button" className="um-secondary-button" onClick={() => loadUserStatistics()}>
            Thử lại thống kê
          </button>
        )}
      </article>
    </div>

    <div className="um-permission-cards">
      {permissionRoleSummary.map((role) => (
        <article key={role.roleName}>
          <RoleBadge role={role.roleName} />
          <strong>{role.count}</strong>
          <span>{role.label} accounts</span>
        </article>
      ))}
    </div>

    <section className="um-panel-grid permissions">
      <div className="um-panel">
        <h2>Module Coverage</h2>
        <table className="um-permission-table compact">
          <thead>
            <tr>
              <th>Module</th>
              {permissionPolicy.roles.map((role) => <th key={role.roleName}>{role.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {permissionModuleCoverage.map((module) => (
              <tr key={module.moduleKey}>
                <td>{module.moduleLabel}</td>
                {permissionPolicy.roles.map((role) => (
                  <td key={role.roleName}>{module.counts[role.roleName] || 0} rules</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="um-panel">
        <h2>Permission Matrix</h2>
        <table className="um-permission-table">
          <thead>
            <tr>
              <th>Permission</th>
              {permissionPolicy.roles.map((role) => <th key={role.roleName}>{role.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {permissionPolicy.permissions.map((permission) => (
              <tr key={permission.permissionKey}>
                <td>{permission.label}</td>
                {permissionPolicy.roles.map((role) => (
                  <td key={role.roleName}>
                    {roleAllowsPermission(permission, role.roleName) ? 'Yes' : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  </section>
)}
```

Cập nhật bộ chọn CSS hiện có từ `.um-permission-cards button` lên `.um-permission-cards article`,
xóa `cursor: pointer`, đưa bộ chọn bài viết vào quy tắc viền chủ đề ấm áp và thêm:

```css
.um-permission-status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.um-permission-status-grid article {
  padding: 14px;
  display: grid;
  gap: 8px;
  border: 1px solid var(--um-line);
  border-radius: 12px;
  background: var(--um-surface);
}
@media (max-width: 900px) {
  .um-permission-status-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Bước 8: Chạy giao diện người dùng GREEN và hồi quy**

```powershell
node --test test/adminApi.test.js test/adminPermissions.test.js test/userManagementFrontend.test.js test/appShellFrontend.test.js
npm.cmd run lint
npm.cmd run build
```

Dự kiến: các kiểm thử tập trung đạt, ESLint đạt và xây dựng đạt sản xuất. Cảnh báo kích thước gói
không chặn hiện tại có thể vẫn còn.

Không cam kết trước H2.

---

### Nhiệm vụ 5: Đồng bộ hóa các hợp đồng API và tập hợp bằng chứng H2

**Tệp:**
- Sửa đổi: `docs/api/api-contract.md`
- Sửa đổi: `backend/src/docs/openapi.yaml`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`
- Tạo: `.sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md`

**Giao diện:**
- Tiêu thụ: hoàn thành quá trình triển khai không cam kết và bằng chứng RED/GREEN được quan sát.
- Tạo ra: hợp đồng con người/OpenAPI nghiêm ngặt, gói L1-L4 H2 và trạng thái quản trị đang diễn ra chính xác.

- [ ] **Bước 1: Thêm hợp đồng API mà con người có thể đọc được**

Thêm trước phần Nhật ký kiểm tra trong `docs/api/api-contract.md`:

```markdown
### GET `/api/admin/permissions`

Tác nhân: Quản trị viên được xác thực. Xác thực và ủy quyền quản trị viên thực hiện trước khi xử lý bộ điều khiển. Điểm cuối không chấp nhận tham số nội dung hoặc truy vấn và không thực hiện thao tác ghi.

Phản hồi `200` có chính xác hai trường cấp cao nhất:

- `roles`: đặt hàng `ADMIN`, `LIBRARIAN`, `MEMBER`; mỗi đối tượng chỉ chứa `roleName` và `label`.
- `permissions`: 15 quy tắc Giai đoạn 1 được đặt hàng từ thiết kế TD-023 đã được phê duyệt; mỗi đối tượng chỉ chứa `permissionKey`, `label`, `moduleKey`, `moduleLabel` và `allowedRoles`.

Các giá trị vai trò được phép là `ADMIN`, `LIBRARIAN` và `MEMBER`; mảng có tính xác định và không chứa bản sao. FE12 `GET /api/reports/users` vẫn là chủ sở hữu số lượng `usersByRole` toàn cầu và giao diện người dùng chỉ tham gia hai phản hồi bằng `roleName`.

Lỗi: `401` dành cho xác thực bị thiếu/không hợp lệ và `403` dành cho người gọi không phải Quản trị viên đã được xác thực.
```

Sao chép toàn bộ bảng 15 hàng từ thiết kế đã được phê duyệt ngay sau văn bản này để tài liệu và
thiết kế API được chia sẻ vẫn giống hệt nhau.

```markdown
|mô-đun|Khóa quyền|Nhãn|Vai trò được phép|
| --- | --- | --- | --- |
|Người dùng & Vai trò| `USER_VIEW` |Xem người dùng| ADMIN |
|Người dùng & Vai trò| `USER_CREATE` |Tạo tài khoản| ADMIN |
|Người dùng & Vai trò| `USER_UPDATE` |Cập nhật tài khoản| ADMIN |
|Người dùng & Vai trò| `USER_DEACTIVATE` |Vô hiệu hóa tài khoản| ADMIN |
|Người dùng & Vai trò| `ROLE_MANAGE` |Quản lý vai trò| ADMIN |
|Người dùng & Vai trò| `AUDIT_VIEW` |Xem nhật ký kiểm tra| ADMIN |
|Thư viện| `CATALOG_MANAGE` |Quản lý danh mục thư viện| ADMIN, LIBRARIAN |
|Thư viện| `METADATA_MANAGE` |Quản lý tác giả/nhà xuất bản/danh mục| ADMIN |
|Mượn/trả sách| `BORROW_APPROVE_REJECT` |Phê duyệt/từ chối yêu cầu mượn sách| ADMIN, LIBRARIAN |
|Mượn/trả sách| `RETURN_RENEW_PROCESS` |Quy trình trả sách và gia hạn| ADMIN, LIBRARIAN |
|Khoản phạt| `FINE_CALCULATE_COLLECT` |Tính và thu khoản phạt| ADMIN, LIBRARIAN |
|Khoản phạt| `FINE_WAIVE_CANCEL` |Miễn hoặc hủy bỏ khoản phạt| ADMIN |
|Báo cáo| `REPORT_VIEW` |Xem báo cáo| ADMIN, LIBRARIAN |
|Mượn/trả sách| `BORROW_REQUEST_CREATE` |Tạo yêu cầu mượn| MEMBER |
|Mượn/trả sách| `BORROW_HISTORY_VIEW_OWN` |Xem lịch sử mượn của mình| MEMBER |
```

- [ ] **Bước 2: Thêm lược đồ và đường dẫn OpenAPI nghiêm ngặt**

Thêm thẻ `Admin Permissions` và các lược đồ thành phần sau:

```yaml
    AdminPermissionRole:
      type: object
      additionalProperties: false
      required: [roleName, label]
      properties:
        roleName: { type: string, enum: [ADMIN, LIBRARIAN, MEMBER] }
        label: { type: string }
    AdminPermissionRule:
      type: object
      additionalProperties: false
      required: [permissionKey, label, moduleKey, moduleLabel, allowedRoles]
      properties:
        permissionKey: { type: string }
        label: { type: string }
        moduleKey: { type: string }
        moduleLabel: { type: string }
        allowedRoles:
          type: array
          minItems: 1
          uniqueItems: true
          items: { type: string, enum: [ADMIN, LIBRARIAN, MEMBER] }
    AdminPermissionsResponse:
      type: object
      additionalProperties: false
      required: [roles, permissions]
      properties:
        roles:
          type: array
          minItems: 3
          maxItems: 3
          items: { $ref: '#/components/schemas/AdminPermissionRole' }
        permissions:
          type: array
          minItems: 15
          maxItems: 15
          items: { $ref: '#/components/schemas/AdminPermissionRule' }
```

Thêm đường dẫn trước `/api/admin/audit-logs`:

```yaml
  /api/admin/permissions:
    get:
      tags: [Admin Permissions]
      summary: Read the canonical FE11 Phase 1 permission matrix (FR-FE11-032)
      security: [{ bearerAuth: [] }]
      responses:
        '200':
          description: Canonical read-only roles and permission policy
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AdminPermissionsResponse' }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '403': { $ref: '#/components/responses/Forbidden' }
```

- [ ] **Bước 3: Chạy tất cả các lớp xác thực tự động**

Từ kho lưu trữ gốc:

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
npm.cmd run trace:enforce
```

Từ `backend/`:

```powershell
node -e "require('yamljs').load('src/docs/openapi.yaml'); console.log('OpenAPI OK')"
node -e "require('./src/app'); console.log('Backend app import OK')"
```

Dự kiến: các kiểm thử backend/frontend đầy đủ và phạm vi bảo hiểm ĐẠT; kiểm tra mã/xây dựng đạt; trình
duyệt E2E đạt trên luồng nghiệp vụ chuẩn trên máy tính để bàn/thiết bị di động; OpenAPI in `OpenAPI
OK`; nhập máy chủ in `Backend app import OK`; truy vết đạt.

- [ ] **Bước 4: Chạy kiểm tra khác biệt, phạm vi và vệ sinh bí mật**

```powershell
git diff --check
git status --short
git diff --name-only
git ls-files --others --exclude-standard
rg -n "const permissionRows =|const permissionModules =|/api/admin/user-summary|id: 'membership'.*Quản lý hội viên|activeSection === 'roles'" frontend backend
```

Dự kiến: chỉ các tệp trong gói này mới được thay đổi/không bị theo dõi; `rg` không trả về kết quả
khớp mã sản phẩm nào cho các mẫu trôi dạt đã bị loại bỏ.

Xem lại các kết quả phù hợp với thuật ngữ nhạy cảm có độ tin cậy cao:

```powershell
$matches = git diff -U0 | rg -n "(?i)(password|passwd|token|otp|authorization|cookie|secret|session|credential|api[-_]?key|setup[-_]?link|reset[-_]?link)"
if ($LASTEXITCODE -eq 0) { $matches }
elseif ($LASTEXITCODE -ne 1) { exit $LASTEXITCODE }
```

Dự kiến: các kết quả trùng khớp được giới hạn ở các tài liệu/kiểm tra an toàn hiện có hoặc các xác
nhận tiêu cực; không có giá trị bí mật, trường thông tin xác thực, tải trọng mã thông báo hoặc PII
thực nào được giới thiệu.

- [ ] **Bước 5: Ghi lại bằng chứng H2 chính xác mà không cần đóng phần **

Tạo `.sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md` với các phần này và số
lượng/kết quả lệnh được quan sát:

```markdown
# Xác nhận điều hướng và quyền quản trị FE11 - 2026-07-19

Trạng thái: H2 REVIEW SẴN SÀNG

Phạm vi: chỉ `FE11-PERM01..FE11-PERM05` / `TD-023`

Quyết định: Hybrid SDD + ADD, Độ sâu tiêu chuẩn. Cốt lõi là ủy quyền ưu tiên của quản trị viên, chính sách chính xác/quyền sở hữu API, quyền sở hữu FE11/FE12 và cách ly lỗi; lớp bao là bản trình bày đáp ứng chỉ đọc.

## L1 - Bằng chứng tự động

## L2 - Tuân thủ đặc tả

## L3 - Hiến chương và an toàn

## L4 - Bằng chứng nghiệm thu

## Rủi ro còn lại

## Ranh giới rà soát H2
```

Ghi lại lý do RED được quan sát cho mỗi nhóm kiểm thử mới, kết quả GREEN/lệnh đầy đủ chính xác, phạm
vi bao phủ, OpenAPI/sức khỏe/truy vết/khác biệt/phạm vi/kết quả bí mật và bằng chứng trình duyệt. Nêu rõ
rằng `TD-023`, `FE11-PERM06`, hợp nhất và B7 vẫn mở.

Cập nhật TASKS để `FE11-PERM01..FE11-PERM05` chỉ được kiểm tra sau khi DoD và bằng chứng tồn tại; bỏ
chọn `FE11-PERM06`. Thêm mục CHANGELOG có tiêu đề `Admin Navigation And Permissions H2-Ready` và giữ
`TD-023` `IN PROGRESS`.

- [ ] **Bước 6: Cố định và trình bày khác biệt H2 hoàn chỉnh có sẵn**

Hiển thị các tệp mới với `git diff` mà không sắp xếp nội dung của chúng:

```powershell
git add -N -- backend/src/policies/adminPermissionPolicy.js backend/tests/adminPermissionService.test.js backend/tests/adminPermissionRoutes.test.js frontend/src/utils/adminPermissions.js frontend/test/adminPermissions.test.js .sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md
git diff --binary | git hash-object --stdin
```

Ghi lại hàm băm vào tệp xác thực, chạy lại `git diff --check` và hiển thị sai khác chính xác có sẵn
cho H2. Dừng lại trước khi cam kết hoặc đẩy.

---

### Nhiệm vụ 6: Xuất bản Triển khai đã được đánh giá H2 và chỉ tích hợp sau H3

**Tệp:**
- Cam kết: chính xác các tệp được H2 xem xét từ Nhiệm vụ 1-5
- Mục tiêu PR: `main`

**Giao diện:**
- Tiêu thụ: phê duyệt H2 rõ ràng, hàm băm khác biệt không thay đổi và bằng chứng L1-L4 cục bộ màu xanh lục.
- Tạo ra: PR triển khai có thể xem xét được với việc vượt qua các bước kiểm tra bắt buộc; không hợp nhất trước H3 rõ ràng.

- [ ] **Bước 1: Xác nhận rằng khác biệt đã xem xét không thay đổi**

```powershell
git diff --binary | git hash-object --stdin
git diff --check
```

Dự kiến: hàm băm bằng bản ghi H2. Bất kỳ sự không phù hợp nào đều cần phải xem xét lại H2.

- [ ] **Bước 2: Tạo bộ cam kết đã được đánh giá**

```powershell
git add -- backend/src/policies/adminPermissionPolicy.js backend/src/services/adminService.js backend/src/controllers/adminController.js backend/src/routes/adminRoutes.js backend/tests/adminPermissionService.test.js backend/tests/adminPermissionRoutes.test.js
git commit -m "feat(fe11): add admin permissions read boundary"

git add -- frontend/src/api/adminApi.js frontend/src/page/UserManagement.jsx frontend/src/utils/adminPermissions.js frontend/test/adminApi.test.js frontend/test/adminPermissions.test.js frontend/test/userManagementFrontend.test.js frontend/test/appShellFrontend.test.js
git commit -m "feat(fe11): align admin permissions console"

git add -- docs/api/api-contract.md backend/src/docs/openapi.yaml .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md .sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md TECH_DEBT.md
git commit -m "docs: record FE11 permissions validation"
```

Dự kiến: ba lần cam kết, không có thay đổi nội dung nào giữa phê duyệt H2 và cam kết.

- [ ] **Bước 3: Đẩy và mở PR triển khai**

```powershell
git push -u origin feat/fe11-admin-navigation-permissions
gh pr create --base main --head feat/fe11-admin-navigation-permissions --draft --title "feat(fe11): align admin navigation and permissions" --body "Implements TD-023 / FE11-PERM01..FE11-PERM05 from the approved FE11 Admin Navigation And Permissions design and plan. Adds Admin-only GET /api/admin/permissions, the exact eight-entry Admin sidebar, FE12-backed role counts, derived read-only coverage/matrix rendering, tests, contracts, and H2 evidence. Excludes FE04 removal, permission mutation, schema changes, FE12 production changes, TD-025, and whole-feature FE11 completion."
```

Chỉnh sửa phần PR để xác định `SPEC.md`, kế hoạch này, `FE11-PERM01..FE11-PERM06`, `TD-023`, bằng
chứng L1-L4 và các loại trừ rõ ràng. Chỉ đánh dấu sẵn sàng sau khi vượt qua các bước kiểm tra bắt
buộc.

- [ ] **Bước 4: Chờ kiểm tra và yêu cầu H3**

```powershell
gh pr checks --watch
gh pr view --json number,state,isDraft,mergeable,statusCheckRollup,url
```

Dự kiến: tất cả các bước kiểm tra bắt buộc ĐẠT và PR có thể hợp nhất được. Trình bày sự khác biệt
PR, kiểm tra kết quả, bằng chứng đặc tả/an toàn/chấp nhận, rủi ro còn sót lại và xác nhận rằng toàn
bộ FE11/TD-025 vẫn được hoãn lại. Dừng để phê duyệt H3 rõ ràng.

- [ ] **Bước 5: Chỉ hợp nhất sau H3 và xác minh CI chính**

```powershell
gh pr merge --merge --delete-branch
git fetch origin main
$mergeSha = gh pr view --json mergeCommit --jq .mergeCommit.oid
gh run list --branch main --commit $mergeSha --limit 5
gh run watch (gh run list --branch main --commit $mergeSha --limit 1 --json databaseId --jq '.[0].databaseId')
```

Dự kiến: PR triển khai được hợp nhất và cam kết hợp nhất chính xác sẽ nhận được lần chạy CI `main`
thành công. Không đánh dấu `TD-023` đã được giải quyết cho đến khi kết thúc Nhiệm vụ 7 được hợp
nhất.

---

### Nhiệm vụ 7: Đóng TD-023 với bằng chứng B7 chính xác

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-user-role-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Sửa đổi: `.sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md`
- Sửa đổi: `TECH_DEBT.md`

**Giao diện:**
- Tiêu thụ: số PR triển khai, hợp nhất SHA, kiểm tra PR, phê duyệt H3 và chạy CI chính chính xác sau hợp nhất.
- Tạo ra: `FE11-PERM06` hoàn chỉnh, `TD-023` đã giải quyết và giới hạn bằng chứng B7 mà không thay đổi mã sản phẩm hoặc trạng thái toàn bộ chức năng.

- [ ] **Bước 1: Tạo nhánh kết thúc từ nhánh chính thành công**

```powershell
git fetch origin main
git worktree add .worktrees/fe11-admin-permissions-closeout -b docs/fe11-admin-permissions-closeout origin/main
```

Dự kiến: làm sạch sơ đồ công việc kết thúc khi hợp nhất triển khai thành công.

- [ ] **Bước 2: Chỉ áp dụng các chuyển đổi bằng chứng chính xác**

Cập nhật trạng thái bản ghi xác thực thành `B7 INTEGRATION COMPLETE` và thêm:

- Ngày phê duyệt H2 và H3.
- số PR thực hiện và URL.
- triển khai hợp nhất SHA.
- kết quả kiểm tra PR cần thiết.
- ID và kết quả chạy CI `main` sau hợp nhất chính xác.

Thay đổi PLAN phần 14 thành `Integration State: COMPLETE THROUGH B7`. Kiểm tra `FE11-PERM06` và thêm
bằng chứng tích hợp của nó. Thêm tổng số kiểm thử được quan sát vào bằng chứng hiện tại của
TEST_PLAN. Thêm mục nhập B7 CHANGELOG vào trước.

Chuyển `TD-023` từ Nợ mở sang Đã giải quyết bằng một bản tóm tắt ngắn gọn và triển khai hợp nhất SHA
ngắn. Giữ `TD-025` `OPEN`, giữ nguyên tất cả các khoản nợ không liên quan và giữ toàn bộ FE11
`Implementation State: DEFERRED`.

- [ ] **Bước 3: Xác minh phạm vi và thông tin khóa sổ**

```powershell
git diff --check
git diff --name-only
rg -n "FE11-PERM06|TD-023|TD-025|Implementation State: DEFERRED|B7 INTEGRATION COMPLETE" .sdd/specs/feat-user-role-management .sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md TECH_DEBT.md
$implementationPr = gh pr list --state merged --head feat/fe11-admin-navigation-permissions --json number --jq '.[0].number'
$implementationMerge = gh pr view $implementationPr --json mergeCommit --jq '.mergeCommit.oid'
$mainRun = gh run list --branch main --commit $implementationMerge --limit 1 --json databaseId --jq '.[0].databaseId'
gh pr view $implementationPr --json state,mergeCommit,statusCheckRollup,url
gh run view $mainRun --json conclusion,headSha,url
```

Dự kiến: chỉ có sáu tài liệu khóa sổ được thay đổi; GitHub báo cáo việc triển khai PR đã được hợp
nhất và việc hợp nhất chính xác hoạt động chính của SHA đã thành công.

- [ ] **Bước 4: Lấy H2/H3 khóa sổ và hợp nhất**

Trình bày sự khác biệt chính xác chỉ có trong tài liệu cho H2. Sau khi phê duyệt:

```powershell
git add -- .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md .sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md TECH_DEBT.md
git commit -m "docs: close FE11 admin permissions slice"
git push -u origin docs/fe11-admin-permissions-closeout
gh pr create --base main --head docs/fe11-admin-permissions-closeout --title "docs: close FE11 admin permissions slice"
gh pr checks --watch
```

Yêu cầu H3 rõ ràng sau khi kiểm tra. Sau H3:

```powershell
gh pr merge --merge --delete-branch
```

Ghi lại quá trình hợp nhất kết thúc và CI `main` cuối cùng trong lần chuyển giao cuối cùng. Không
còn công việc cần thiết nào cho `TD-023`; `TD-025` và phần còn lại của FE11 bị trì hoãn vẫn là tác
phẩm độc lập tiếp theo.

---

## Kết quả tự đánh giá

- Phạm vi đặc tả: Nhiệm vụ 1-7 bao gồm điều hướng chính xác (`FR-FE11-030`, `AC-FE11-016`), ranh giới chỉ đọc của quản trị viên, chính sách 15 hàng, DTO mới, quyền sở hữu số lượng FE12, phạm vi/ô dẫn xuất, lỗi/thử lại độc lập (`FR-FE11-032`, `AC-FE11-017`), tài liệu, L1-L4, H2/H3, hợp nhất và đóng cửa B7.
- Phạm vi phạm vi: Tệp sản phẩm FE04, tệp sản phẩm FE12, SQL/lược đồ, triển khai xác thực, thao tác ghi quyền và TD-025 không có trong bản đồ tệp và bộ cam kết.
- Quét giữ chỗ: các bước triển khai cung cấp đường dẫn chính xác, chữ ký, mã kiểm tra, hàng chính sách, lược đồ phản hồi, lệnh, hành vi RED/GREEN dự kiến và chuyển tiếp cổng. ID chỉ tích hợp được truy xuất từ ​​GitHub trước khi khóa và được ghi dưới dạng bằng chứng quan sát được.
- Tính nhất quán của loại: máy chủ sử dụng `getPermissions`, giao diện người dùng sử dụng `adminApi.permissions`, các trường chính sách là `permissionKey`, `label`, `moduleKey`, `moduleLabel`, `allowedRoles` và tất cả các phép nối đều sử dụng `roleName`.
- Tính nhất quán của trạng thái: `permissionPolicy` và `userStats` có bộ cài đặt tải/lỗi riêng biệt; không bắt lại chủ sở hữu khác hoặc giá trị thành công cuối cùng của chính nó.
- Tính nhất quán trong quản trị: `FE11-PERM01..FE11-PERM05` có thể sẵn sàng cho H2; chỉ `FE11-PERM06` và `TD-023` đóng sau khi hợp nhất triển khai, CI sau hợp nhất và tích hợp kết thúc. Toàn bộ FE11 vẫn được hoãn lại.
