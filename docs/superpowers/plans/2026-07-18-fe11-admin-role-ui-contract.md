# FE11 Kế hoạch thực hiện hợp đồng giao diện người dùng vai trò quản trị viên

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Thực hiện phương thức vai trò Quản trị viên FE11 gọi hợp đồng chuyển nhượng/thu hồi
số-`roleId` đã được phê duyệt và khôi phục an toàn khi lưu nhiều biến đổi không thành công một phần.

**Kiến trúc:** Giữ nguyên giao dịch vai trò máy chủ hoàn chỉnh B7. Giao diện người dùng tải danh mục
`{ roleId, roleName }` có thẩm quyền, giữ trạng thái hộp kiểm làm tên vai trò, xác thực kế hoạch đột
biến tên thành ID hoàn chỉnh trước yêu cầu đầu tiên, chỉ định trước khi thu hồi và tải lại người
dùng mục tiêu sau bất kỳ lỗi một phần nào.

**Tech bộ công nghệ:** React 19, Vite 7, trình bao bọc yêu cầu được ủy quyền của Axios, trình chạy kiểm thử
tích hợp Node.js, kiểm thử hồi quy máy chủ ESLint 9, Express/Jest, tạo phẩm Markdown SDD.

## Ràng buộc toàn cầu

- Chỉ triển khai `TD-022` và đường dẫn chấp nhận giao diện người dùng cho `FR-FE11-012..014`, `FR-FE11-024..027` và `AC-FE11-013..015`.
- Bảo quản API đã được phê duyệt: `POST /api/users/{userId}/roles` với `{ roleId: number }` và `DELETE /api/users/{userId}/roles/{roleId}`.
- Không sửa đổi `SPEC.md`, hành vi vai trò máy chủ, lược đồ SQL, phân cấp vai trò, Quyền, Nhật ký kiểm tra, điều hướng, Quản lý yêu cầu, cập nhật hoặc hành vi hủy kích hoạt.
- Lấy mọi ID vai trò từ `GET /api/users/roles` đã được xác thực; không bao giờ mã hóa ID hoặc gửi tên vai trò qua ranh giới thao tác ghi.
- Giữ nguyên các vai trò hiện tại không thể chỉnh sửa/không xác định; chỉ `ADMIN`, `LIBRARIAN` và `MEMBER` mới có thể chỉnh sửa được ở chế độ này.
- Xác thực toàn bộ kế hoạch thao tác ghi trước yêu cầu đầu tiên, thực hiện các nhiệm vụ trước khi thu hồi và không bao giờ mô tả việc lưu nhiều yêu cầu dưới dạng nguyên tử.
- Trong lần thao tác ghi đầu tiên không thành công, hãy dừng, tải lại người dùng mục tiêu, giữ chế độ mở và vô hiệu hóa các nỗ lực Lưu tiếp theo nếu quá trình đối chiếu có thẩm quyền cũng không thành công.
- Mọi thay đổi về hành vi sản xuất đều phải được kiểm tra RED trước khi triển khai.
- Giữ nguyên `Implementation State: DEFERRED` cho toàn bộ chức năng FE11 và để ngỏ khoản nợ không liên quan.
- Giữ nguyên những thay đổi không liên quan của người dùng và các tập tin không bị theo dõi.

---

### Nhiệm vụ 1: Kích hoạt Phần giao diện người dùng vai trò quản trị FE11 đã được phê duyệt

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-user-role-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Sửa đổi: `TECH_DEBT.md`

**Giao diện:**
- Tiêu thụ: thiết kế `docs/superpowers/specs/2026-07-18-fe11-admin-role-ui-contract-design.md` đã được phê duyệt và hoàn thành các nhiệm vụ vai trò máy chủ `FE11-R01..R05`.
- Tạo ra: ID tác vụ `FE11-UIR01..UIR05`, lệnh xác thực và trạng thái `TD-022` được sử dụng bởi tất cả các tác vụ sau này.

- [ ] **Bước 1: Đổi tên nhánh thiết kế cục bộ để triển khai**

Nhánh hiện tại chứa thiết kế và kế hoạch đã được xem xét nhưng cũng sẽ có bản sửa lỗi được giới hạn.
Đổi tên nó trước khi mã sản phẩm hoạt động:

```powershell
git branch -m fix/fe11-admin-role-ui-contract
```

Dự kiến: `git branch --show-current` in `fix/fe11-admin-role-ui-contract`.

- [ ] **Bước 2: Thêm lát cắt giới hạn vào FE11 PLAN.md**

Nối sau phần Chi tiết và Danh sách Người dùng An toàn:

```markdown
## 12. Lát cắt hợp đồng giao diện vai trò quản trị

### Trong phạm vi

- Tải `{ roleId, roleName }` từ danh mục vai trò FE11 đã được xác thực.
- Giữ trạng thái hộp kiểm theo tên vai trò trong khi ánh xạ mọi thao tác ghi sang ID vai trò số dương.
- Gửi yêu cầu chuyển nhượng/thu hồi chuẩn mực, kèm theo các yêu cầu chuyển nhượng trước khi thu hồi.
- Chặn các danh mục không hợp lệ trước khi thao tác ghi và điều chỉnh vai trò của người dùng có thẩm quyền sau khi bị lỗi một phần.
- Thêm các kiểm thử RED-GREEN giao diện người dùng tập trung và kiểm tra hồi quy bị ảnh hưởng.

### Ngoài phạm vi

- Giao dịch/trình xác thực vai trò máy chủ, thay đổi lược đồ, tạo/chỉnh sửa vai trò và chỉnh sửa quyền.
- Điều hướng, Quyền, Nhật ký kiểm tra, Quản lý yêu cầu, cập nhật, hủy kích hoạt và tất cả khoản nợ FE11 khác.

### Cổng xác nhận

- Các kiểm thử bộ điều hợp API chứng minh rằng không có tên vai trò nào đưa ra yêu cầu thao tác ghi.
- Kiểm tra hợp đồng giao diện người dùng chứng minh tính hợp lệ của danh mục, chuyển nhượng trước khi thu hồi, hành vi không hoạt động và đối chiếu lỗi một phần.
- Giao diện người dùng đầy đủ tests/lint/build, tập trung vào hồi quy vai trò máy chủ, truy vết và vượt qua vệ sinh khác biệt.
- Công việc FE11 còn lại vẫn bị trì hoãn và cần có sự đánh giá của con người trước khi hợp nhất.
```

- [ ] **Bước 3: Thêm FE11-UIR01..UIR05 vào TASKS.md**

Chèn trước `## Deferred FE11 Work`:

```markdown
## Nhiệm vụ hợp đồng giao diện vai trò quản trị

- [ ] **FE11-UIR01 - Gửi ID vai trò số từ bộ chuyển đổi API giao diện người dùng.**
  - Bản đồ tới: FR-FE11-012..013; AC-FE11-013..014; FE11 API §11.
  - DoD: nhiệm vụ gửi `{ roleId }`, việc thu hồi sử dụng `/{roleId}` và các kiểm thử RED-GREEN tập trung loại trừ các yêu cầu thao tác ghi tên vai trò.

- [ ] **FE11-UIR02 - Xác thực và sử dụng danh mục vai trò có thẩm quyền.**
  - Bản đồ tới: PRE-FE11-004; NFR-FE11-SEC-004; TD-022.
  - Phụ thuộc vào: FE11-UIR01.
  - DoD: chỉ các ID dương cho Quản trị viên/Thủ thư/MEMBER mới kích hoạt phương thức; dữ liệu danh mục không hợp lệ/bị thiếu sẽ không gửi thao tác ghi và không tồn tại dự phòng mã hóa cứng.

- [ ] **FE11-UIR03 - Thực hiện các khác biệt về vai trò xác định và lưu không hoạt động.**
  - Bản đồ tới: BR-FE11-007..009; FR-FE11-012..014, FR-FE11-027; AC-FE11-013..015.
  - Phụ thuộc vào: FE11-UIR02.
  - DoD: sự khác biệt hoàn toàn được xác thực trước khi yêu cầu, các phép gán trước khi thu hồi, các vai trò không thể chỉnh sửa được giữ nguyên và các bản lưu no-op không gửi thao tác ghi.

- [ ] **FE11-UIR04 - Điều chỉnh lỗi một phần với trạng thái máy chủ.**
  - Bản đồ tới: BR-FE11-010; FR-FE11-024..027; NFR-FE11-UX-001.
  - Phụ thuộc vào: FE11-UIR03.
  - DoD: thao tác ghi thất bại đầu tiên dừng chuỗi; chi tiết mục tiêu được tải lại vào phương thức mở; việc hòa giải không thành công sẽ vô hiệu hóa Lưu và không bao giờ báo cáo thành công.

- [ ] **FE11-UIR05 - Vượt qua cổng tích hợp và xác thực giao diện người dùng với vai trò Quản trị viên.**
  - Phụ thuộc vào: FE11-UIR01..UIR04.
  - DoD: giao diện người dùng tập trung/đầy đủ, tìm lỗi mã nguồn/xây dựng, hồi quy vai trò máy chủ tập trung, truy vết, đánh giá khác biệt/bảo mật, tài liệu, đánh giá con người, hợp nhất và bằng chứng CI sau hợp nhất đã hoàn tất.
```

Giữ dòng này không thay đổi:

```markdown
Trạng thái thực hiện: TRÌ HOÃN
```

- [ ] **Bước 4: Cập nhật TEST_PLAN.md và CHANGELOG.md**

Thêm các mục tiêu kiểm thử này vào `TEST_PLAN.md`:

```markdown
- Người trợ giúp API có vai trò quản trị viên chỉ gửi các giá trị `roleId` dạng số từ danh mục vai trò đã xác thực.
- Phương thức vai trò xác thực một danh mục hoàn chỉnh có thể chỉnh sửa trước khi thao tác ghi, gán trước khi thu hồi và duy trì các vai trò không thể chỉnh sửa.
- Lỗi thao tác ghi một phần sẽ dừng các yêu cầu sau đó và tải lại vai trò có thẩm quyền của người dùng mục tiêu vào phương thức mở.
```

Thêm mục nhập `CHANGELOG.md` ghi ngày tháng cho biết rằng nhóm nhiệm vụ và thiết kế hợp đồng giao
diện người dùng đã được phê duyệt, bằng chứng triển khai chưa được yêu cầu và tất cả công việc FE11
không liên quan vẫn bị hoãn lại.

- [ ] **Bước 5: Đang đánh dấu TD-022**

Chỉ thay đổi ô trạng thái `TD-022` từ `OPEN` thành `IN PROGRESS`. Không chỉnh sửa hoặc đóng `TD-023..TD-027`.

- [ ] **Bước 6: Chạy kiểm tra tài liệu**

Chạy:

```powershell
npm.cmd run trace:enforce
git diff --check -- .sdd/specs/feat-user-role-management TECH_DEBT.md
```

Dự kiến: `trace:enforce` báo cáo ĐẠT; tài liệu khác biệt không có lỗi khoảng trắng.

- [ ] **Bước 7: Cam kết lát đã kích hoạt**

```powershell
git add -- .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md TECH_DEBT.md
git commit -m "docs: activate FE11 admin role UI contract"
```

---

### Nhiệm vụ 2: Gửi ID vai trò số từ Bộ điều hợp giao diện API

**Tệp:**
- Sửa đổi: `frontend/test/userManagementApi.test.js`
- Sửa đổi: `frontend/src/api/userManagementApi.js`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`

**Giao diện:**
- Tiêu thụ: `authorizedRequest`, `userId` số và `roleId` số do điều phối trang cung cấp.
- Sản xuất: `assignManagedUserRole(userId, roleId)` và `revokeManagedUserRole(userId, roleId)` phù hợp với FE11 API §11.

- [ ] **Bước 1: Thêm kiểm thử hợp đồng API không thành công**

Nối vào `frontend/test/userManagementApi.test.js`:

```js
test('FE11 role mutations send numeric role IDs through the canonical contract', async () => {
  const source = await readFile(apiPath, 'utf8');

  assert.match(
    source,
    /export async function assignManagedUserRole\(userId, roleId\)[\s\S]*?url: `\/users\/\$\{userId\}\/roles`[\s\S]*?data: \{ roleId \}/,
  );
  assert.match(
    source,
    /export async function revokeManagedUserRole\(userId, roleId\)[\s\S]*?url: `\/users\/\$\{userId\}\/roles\/\$\{roleId\}`/,
  );
  assert.doesNotMatch(
    source,
    /export async function (?:assign|revoke)ManagedUserRole\(userId, roleName\)/,
  );
  assert.doesNotMatch(source, /data: \{ roleName \}/);
});
```

- [ ] **Bước 2: Chạy RED và xác nhận hợp đồng tên vai trò hiện tại không thành công**

Chạy:

```powershell
node --test test/userManagementApi.test.js
```

Thư mục làm việc: `frontend`.

Dự kiến: THẤT BẠI vì những người trợ giúp hiện tại chấp nhận `roleName`, gửi `{ roleName }` và nội
suy tên vào đường dẫn DELETE.

- [ ] **Bước 3: Thay thế cả hai trình trợ giúp thao tác ghi**

Trong `frontend/src/api/userManagementApi.js`, thay thế các trợ giúp hiện có bằng:

```js
export async function assignManagedUserRole(userId, roleId) {
  try {
    const response = await authorizedRequest({
      method: 'post',
      url: `/users/${userId}/roles`,
      data: { roleId },
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not assign role.'), { cause: error });
  }
}

export async function revokeManagedUserRole(userId, roleId) {
  try {
    const response = await authorizedRequest({
      method: 'delete',
      url: `/users/${userId}/roles/${roleId}`,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not revoke role.'), { cause: error });
  }
}
```

- [ ] **Bước 4: Chạy GREEN**

Chạy:

```powershell
node --test test/userManagementApi.test.js
```

Thư mục làm việc: `frontend`.

Dự kiến: tất cả các kiểm thử `userManagementApi` ĐẠT.

- [ ] **Bước 5: Đánh dấu FE11-UIR01 là hoàn thành và cam kết**

Cập nhật hộp kiểm nhiệm vụ và thêm bằng chứng RED/GREEN được quan sát, sau đó chạy:

```powershell
git add -- frontend/test/userManagementApi.test.js frontend/src/api/userManagementApi.js .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "fix(fe11): send numeric role IDs from admin API"
```

---

### Nhiệm vụ 3: Xác thực danh mục vai trò trước khi mở hoặc lưu

**Tệp:**
- Sửa đổi: `frontend/test/userManagementFrontend.test.js`
- Sửa đổi: `frontend/src/page/UserManagement.jsx`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`

**Giao diện:**
- Tiêu thụ: Phản hồi `fetchRoles()` `{ data: Array<{ roleId, roleName }> }` và `editableRoles = ['ADMIN', 'LIBRARIAN', 'MEMBER']`.
- Sản xuất: `normalizeEditableRoleCatalog(roleCatalog)` và `buildRoleMutationPlan(currentRoleNames, selectedRoleNames, roleCatalog)`; cả hai đều đưa ra lỗi danh mục an toàn trước bất kỳ thao tác ghi nào khi danh mục không đầy đủ hoặc không hợp lệ.

- [ ] **Bước 1: Thêm các kiểm thử hợp đồng nguồn không thành công để đảm bảo tính toàn vẹn của danh mục**

Nối vào `frontend/test/userManagementFrontend.test.js`:

```js
test('FE11 role editing requires a complete numeric role catalog', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /function normalizeEditableRoleCatalog\(roleCatalog = \[\]\)/);
  assert.match(source, /Number\.isInteger\(roleId\) && roleId > 0/);
  assert.match(source, /seenIds\.has\(roleId\)/);
  assert.match(source, /normalized\.length !== editableRoles\.length/);
  assert.match(source, /async function loadRoles\(\)/);
  assert.match(source, /async function openRoleModal\(user\)[\s\S]*?await loadRoles\(\)/);
  assert.doesNotMatch(source, /editableRoles\.map\(\(roleName\) => \(\{ roleName \}\)\)/);
});

test('FE11 role mutation plan preserves names for UI and emits catalog IDs', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /function buildRoleMutationPlan\(currentRoleNames, selectedRoleNames, roleCatalog\)/);
  assert.match(source, /assignments\.push\(\{ roleName, roleId \}\)/);
  assert.match(source, /revocations\.push\(\{ roleName, roleId \}\)/);
});
```

- [ ] **Bước 2: Chạy RED**

Chạy:

```powershell
node --test test/userManagementFrontend.test.js
```

Thư mục làm việc: `frontend`.

Dự kiến: THẤT BẠI vì xác thực danh mục, `loadRoles` có thể thử lại và trình trợ giúp kế hoạch đột
biến không tồn tại; dự phòng chỉ có tên hiện tại vẫn tồn tại.

- [ ] **Bước 3: Thêm chuẩn hóa danh mục và lập kế hoạch thao tác ghi**

Thêm sau `editableRoles` trong `frontend/src/page/UserManagement.jsx`:

```js
const ROLE_CATALOG_ERROR = 'Không thể tải danh mục vai trò. Vui lòng thử lại.';

function normalizeEditableRoleCatalog(roleCatalog = []) {
  const seenNames = new Set();
  const seenIds = new Set();
  const normalized = [];

  for (const role of roleCatalog) {
    const roleName = String(role?.roleName || '').trim().toUpperCase();
    if (!editableRoles.includes(roleName)) continue;

    const roleId = Number(role?.roleId);
    if (
      !(Number.isInteger(roleId) && roleId > 0)
      || seenNames.has(roleName)
      || seenIds.has(roleId)
    ) {
      throw new Error(ROLE_CATALOG_ERROR);
    }

    seenNames.add(roleName);
    seenIds.add(roleId);
    normalized.push({ roleId, roleName });
  }

  if (normalized.length !== editableRoles.length) {
    throw new Error(ROLE_CATALOG_ERROR);
  }

  return normalized;
}

function buildRoleMutationPlan(currentRoleNames, selectedRoleNames, roleCatalog) {
  const editableCatalog = normalizeEditableRoleCatalog(roleCatalog);
  const currentRoles = new Set(currentRoleNames || []);
  const selectedRoles = new Set(selectedRoleNames || []);
  const assignments = [];
  const revocations = [];

  for (const { roleId, roleName } of editableCatalog) {
    if (selectedRoles.has(roleName) && !currentRoles.has(roleName)) {
      assignments.push({ roleName, roleId });
    }
    if (currentRoles.has(roleName) && !selectedRoles.has(roleName)) {
      revocations.push({ roleName, roleId });
    }
  }

  return { assignments, revocations };
}
```

Chỉ những tên trong danh mục có thể chỉnh sửa mới tham gia vào phần khác biệt, vì vậy các vai trò
không thể chỉnh sửa hiện tại vẫn được giữ nguyên.

- [ ] **Bước 4: Thay thế dự phòng chỉ có tên bằng trạng thái danh mục có thể thử lại**

Thêm bên cạnh trạng thái `roles` hiện có:

```js
const [rolesError, setRolesError] = useState('');
const [rolesLoading, setRolesLoading] = useState(false);
const [roleSyncBlocked, setRoleSyncBlocked] = useState(false);
```

Thêm chức năng trang này trước `openRoleModal`:

```js
async function loadRoles() {
  setRolesLoading(true);
  setRolesError('');

  try {
    const result = await fetchRoles();
    const catalog = normalizeEditableRoleCatalog(result.data || []);
    setRoles(catalog);
    return catalog;
  } catch (error) {
    setRoles([]);
    setRolesError(ROLE_CATALOG_ERROR);
    throw new Error(ROLE_CATALOG_ERROR, { cause: error });
  } finally {
    setRolesLoading(false);
  }
}
```

Thay thế hiệu ứng tải vai trò hiện tại bằng:

```js
useEffect(() => {
  loadRoles().catch(() => {});
// loadRoles is intentionally the page-owned catalog boundary for this mount.
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

Thay thế `openRoleModal` bằng:

```js
async function openRoleModal(user) {
  if (!(await requireAdminSession())) return;

  try {
    if (rolesError || roles.length === 0) {
      await loadRoles();
    } else {
      normalizeEditableRoleCatalog(roles);
    }
    setRoleSyncBlocked(false);
    setRoleUser(user);
  } catch (error) {
    setToast({ type: 'error', message: error.message });
  }
}
```

Xóa hoàn toàn dự phòng này:

```js
editableRoles.map((roleName) => ({ roleName }))
```

Trong `RoleModal`, chỉ sử dụng prop `roles` đã được xác thực:

```js
const availableRoles = roles;
```

Chuyển trạng thái tải/chặn thông qua lệnh gọi phương thức hiện có để cả hai trạng thái đều được sử
dụng trước khi Nhiệm vụ 5 thêm hành vi thực thi:

```jsx
<RoleModal
  user={roleUser}
  roles={roles}
  savingBlocked={rolesLoading || roleSyncBlocked}
  onClose={() => setRoleUser(null)}
  onSave={saveRoles}
/>
```

- [ ] **Bước 5: Chạy GREEN và tìm lỗi trang đã thay đổi**

Chạy:

```powershell
node --test test/userManagementFrontend.test.js
npm.cmd run lint
```

Thư mục làm việc: `frontend`.

Dự kiến: các kiểm thử tập trung đạt và ESLint báo cáo không có lỗi.

- [ ] **Bước 6: Đánh dấu hoàn thành FE11-UIR02 và cam kết**

```powershell
git add -- frontend/test/userManagementFrontend.test.js frontend/src/page/UserManagement.jsx .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "fix(fe11): require numeric admin role catalog"
```

---

### Nhiệm vụ 4: Thực hiện các nhiệm vụ trước khi thu hồi và xử lý các trường hợp không hoạt động

**Tệp:**
- Sửa đổi: `frontend/test/userManagementFrontend.test.js`
- Sửa đổi: `frontend/src/page/UserManagement.jsx`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`

**Giao diện:**
- Tiêu thụ: `buildRoleMutationPlan(...)`, trình trợ giúp API dạng số từ Nhiệm vụ 2 và danh mục `roles` đã được xác thực từ Nhiệm vụ 3.
- Tạo ra: hành vi `saveRoles(nextRoles)` xác định với xác thực trước, thứ tự chuyển nhượng trước khi thu hồi và xử lý không yêu cầu hoạt động.

- [ ] **Bước 1: Thêm các kiểm thử thứ tự không thành công và nguồn không hoạt động**

Nối thêm:

```js
test('FE11 role saves validate the full plan and assign before revoking', async () => {
  const source = await readFile(pagePath, 'utf8');
  const saveRoles = source.match(/async function saveRoles\(nextRoles\)[\s\S]*?\n  }\n\n  return \(/)?.[0] || '';

  assert.match(saveRoles, /buildRoleMutationPlan\(roleUser\.roles \|\| \[\], nextRoles, roles\)/);
  assert.match(saveRoles, /for \(const \{ roleId \} of assignments\)/);
  assert.match(saveRoles, /assignManagedUserRole\(roleUser\.userId, roleId\)/);
  assert.match(saveRoles, /for \(const \{ roleId \} of revocations\)/);
  assert.match(saveRoles, /revokeManagedUserRole\(roleUser\.userId, roleId\)/);
  assert.ok(saveRoles.indexOf('of assignments') < saveRoles.indexOf('of revocations'));
  assert.match(saveRoles, /assignments\.length === 0 && revocations\.length === 0/);
});
```

- [ ] **Bước 2: Chạy RED**

Chạy:

```powershell
node --test test/userManagementFrontend.test.js
```

Dự kiến: THẤT BẠI vì `saveRoles` vẫn gửi tên trực tiếp và không có nhánh không hoạt động theo kế hoạch.

- [ ] **Bước 3: Thay thế phần thân thao tác ghi thành công**

Thay thế `saveRoles` bằng phiên bản này; Nhiệm vụ 5 sẽ điền vào phần bắt đối chiếu trong khi vẫn duy
trì đường dẫn thành công:

```js
async function saveRoles(nextRoles) {
  if (!roleUser) return;

  if (!(await requireAdminSession())) {
    throw new Error('Admin login required.');
  }

  const { assignments, revocations } = buildRoleMutationPlan(
    roleUser.roles || [],
    nextRoles,
    roles,
  );

  if (assignments.length === 0 && revocations.length === 0) {
    setRoleUser(null);
    setRoleSyncBlocked(false);
    return;
  }

  try {
    for (const { roleId } of assignments) {
      await assignManagedUserRole(roleUser.userId, roleId);
    }

    for (const { roleId } of revocations) {
      await revokeManagedUserRole(roleUser.userId, roleId);
    }

    setToast({ type: 'success', message: 'Đã cập nhật vai trò người dùng.' });
    setRoleUser(null);
    setRoleSyncBlocked(false);
    setSelectedUser(null);
    await loadUsers();
  } catch (error) {
    throw error;
  }
}
```

Kế hoạch hoàn chỉnh được xây dựng trước một trong hai vòng lặp; do đó một danh mục không hợp lệ sẽ
bị loại bỏ trước bất kỳ yêu cầu nào.

- [ ] **Bước 4: Chạy GREEN**

Chạy:

```powershell
node --test test/userManagementFrontend.test.js
```

Dự kiến: các kiểm thử lối vào tập trung ĐẠT.

- [ ] **Bước 5: Đánh dấu FE11-UIR03 là hoàn thành và cam kết**

```powershell
git add -- frontend/test/userManagementFrontend.test.js frontend/src/page/UserManagement.jsx .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "fix(fe11): sequence admin role mutations safely"
```

---

### Nhiệm vụ 5: Điều chỉnh các lỗi một phần và khóa các lần lưu không đồng bộ

**Tệp:**
- Sửa đổi: `frontend/test/userManagementFrontend.test.js`
- Sửa đổi: `frontend/src/page/UserManagement.jsx`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`

**Giao diện:**
- Tiêu thụ: `fetchManagedUser(userId)`, `roleUser`, `selectedUser` và chuỗi thao tác ghi từ Nhiệm vụ 4.
- Tạo ra: trạng thái vai trò phương thức được làm mới sau khi thất bại, bảo vệ `roleSyncBlocked` khi làm mới không thành công và các lỗi an toàn phương thức-cục bộ.

- [ ] **Bước 1: Thêm các kiểm thử đối chiếu không thành công và khóa phương thức**

Nối thêm:

```js
test('FE11 partial role failure reloads the target and keeps the modal authoritative', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /catch \(error\) \{[\s\S]*?await fetchManagedUser\(roleUser\.userId\)/);
  assert.match(source, /setRoleUser\(refreshedUser\)/);
  assert.match(source, /setRoleSyncBlocked\(true\)/);
  assert.match(source, /useEffect\(\(\) => \{[\s\S]*?setSelectedRoles\(new Set\(user\.roles \|\| \[\]\)\)/);
  assert.match(source, /\}, \[user\]\);/);
  assert.match(source, /savingBlocked=\{rolesLoading \|\| roleSyncBlocked\}/);
  assert.match(source, /catch \(error\) \{\s*setError\(error\.message\)/);
});
```

- [ ] **Bước 2: Chạy RED**

Chạy:

```powershell
node --test test/userManagementFrontend.test.js
```

Dự kiến: THẤT BẠI vì không có chức năng đối chiếu lỗi một phần, đồng bộ hóa lựa chọn cục bộ và hành
vi Lưu bị chặn.

- [ ] **Bước 3: Đồng bộ hóa RoleModal với trạng thái người dùng được làm mới**

Thay đổi thiết lập chữ ký và trạng thái:

```js
function RoleModal({ user, roles, savingBlocked, onClose, onSave }) {
  const [selectedRoles, setSelectedRoles] = useState(() => new Set(user.roles || []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const availableRoles = roles;

  useEffect(() => {
    setSelectedRoles(new Set(user.roles || []));
    setError('');
  }, [user]);
```

Thay thế `handleSave` bằng:

```js
async function handleSave(event) {
  event.preventDefault();

  if (savingBlocked) {
    setError('Không thể lưu cho đến khi trạng thái vai trò được tải lại.');
    return;
  }

  if (selectedRoles.size === 0) {
    setError('Every user must keep at least one role.');
    return;
  }

  setSaving(true);
  setError('');
  try {
    await onSave(Array.from(selectedRoles));
  } catch (error) {
    setError(error.message);
  } finally {
    setSaving(false);
  }
}
```

Bảo vệ đóng và lưu trong khi công việc đang hoạt động:

```jsx
<div className="um-modal-backdrop" onMouseDown={() => { if (!saving) onClose(); }}>
```

```jsx
<button type="button" className="um-icon-button" disabled={saving} onClick={onClose} aria-label="Close">
```

```jsx
<button type="button" className="um-secondary-button" disabled={saving} onClick={onClose}>
```

```jsx
<button type="submit" className="um-primary-button" disabled={saving || savingBlocked}>
```

- [ ] **Bước 4: Điều chỉnh mục tiêu chính thức sau khi thao tác ghi thất bại**

Thay thế phần bắt trong `saveRoles` bằng:

```js
  } catch (error) {
    try {
      const refreshedUser = await fetchManagedUser(roleUser.userId);
      setRoleUser(refreshedUser);
      setRoleSyncBlocked(false);
      if (selectedUser?.userId === refreshedUser.userId) {
        setSelectedUser(refreshedUser);
      }
    } catch {
      setRoleSyncBlocked(true);
    }
    throw error;
  }
```

Vượt qua trạng thái khối và chỉ xóa nó khi cố ý đóng:

```jsx
<RoleModal
  user={roleUser}
  roles={roles}
  savingBlocked={rolesLoading || roleSyncBlocked}
  onClose={() => {
    setRoleUser(null);
    setRoleSyncBlocked(false);
  }}
  onSave={saveRoles}
/>
```

- [ ] **Bước 5: Chạy GREEN, kiểm tra giao diện người dùng đầy đủ và tìm lỗi mã nguồn/bản dựng**

Chạy từ `frontend`:

```powershell
node --test test/userManagementFrontend.test.js test/userManagementApi.test.js
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Dự kiến: các kiểm thử giao diện người dùng tập trung và đầy đủ ĐẠT, ESLint báo cáo không có lỗi và
quá trình xây dựng sản xuất Vite thành công. Lời khuyên về kích thước gói hiện tại có thể vẫn không
bị chặn.

- [ ] **Bước 6: Đánh dấu hoàn thành FE11-UIR04 và cam kết**

```powershell
git add -- frontend/test/userManagementFrontend.test.js frontend/src/page/UserManagement.jsx .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "fix(fe11): reconcile partial admin role updates"
```

---

### Nhiệm vụ 6: Vượt qua cổng xác thực và chuẩn bị đánh giá con người

**Tệp:**
- Tạo: `.sdd/reviews/fe11-admin-role-ui-contract-validation-2026-07-18.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Sửa đổi: `TECH_DEBT.md`

**Giao diện:**
- Tiêu thụ: đã hoàn thành mã/kiểm tra `FE11-UIR01..UIR04` và bằng chứng vai trò B7 máy chủ hiện có.
- Tạo ra: bằng chứng xác thực bốn lớp và một nhánh sẵn sàng cho con người đánh giá; `TD-022` vẫn là `IN PROGRESS` cho đến khi hợp nhất và CI sau hợp nhất.

- [ ] **Bước 1: Chạy hồi quy vai trò máy chủ tập trung**

Chạy từ `backend`:

```powershell
npm.cmd test -- --runTestsByPath tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/userRoleRepository.test.js
```

Dự kiến: 3 bộ và các kiểm thử vai trò FE11 tập trung hiện tại ĐẠT; không có tập tin máy chủ thay đổi.

- [ ] **Bước 2: Chạy xác thực toàn bộ giao diện người dùng**

Chạy từ `frontend`:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Dự kiến: tất cả các kiểm thử giao diện người dùng đều ĐẠT, tìm lỗi mã nguồn không có lỗi và quá
trình xây dựng sản xuất thành công.

- [ ] **Bước 3: Chạy kiểm tra dự án**

Chạy từ kho lưu trữ gốc:

```powershell
npm.cmd run trace:enforce
git diff --check origin/main...HEAD
git status --short
```

Dự kiến: khả năng truy vết đạt, không có lỗi khoảng trắng và chỉ các tệp tài liệu/giao diện người
dùng/FE11 dự định được thay đổi.

- [ ] **Bước 4: Thực hiện đánh giá bốn lớp**

Tạo `.sdd/reviews/fe11-admin-role-ui-contract-validation-2026-07-18.md` với các phần chính xác sau:

```markdown
# Xác nhận hợp đồng giao diện vai trò quản trị FE11

Ngày: 2026-07-18
Phạm vi: chỉ FE11-UIR01..UIR05 / TD-022

## Bằng chứng tự động L1
## L2 Tuân thủ đặc tả
## L3 Hiến chương và an toàn
## L4 Nghiệm thu và rủi ro còn lại
## Tệp đã thay đổi
## Cổng rà soát của con người
## Trạng thái tích hợp
```

Ghi lại kết quả và số lượng lệnh, ánh xạ luồng thành công tới `FR-FE11-012..014` và
`AC-FE11-013..015`, đồng thời nêu rõ:

- ID vai trò chỉ đến từ danh mục đã được xác thực.
- Ủy quyền máy chủ, xác thực và hành vi giao dịch không thay đổi.
- Việc lưu giao diện người dùng theo nhiều yêu cầu không phải là nguyên tử; đối chiếu là ranh giới thu hồi được phê duyệt.
- Trình duyệt E2E vẫn giữ nguyên bằng chứng hồi quy CI thay vì kiểm thử tương tác theo vai trò cụ thể mới.
- Tất cả công việc FE11 không liên quan vẫn bị trì hoãn.

- [ ] **Bước 5: Cập nhật các bản ghi sẵn sàng xác thực**

Trong `TASKS.md`, hãy bỏ chọn `FE11-UIR05` cho đến khi có sự đánh giá của con người. Thêm bằng chứng
tự động bên dưới nó.

Trong `TEST_PLAN.md`, di chuyển khoảng trống giao diện người dùng vai trò vào Bằng chứng hiện tại và
giữ lại các ghi chú môi trường/trình duyệt SQL còn sót lại.

Trong `CHANGELOG.md`, hãy thêm mục nhập sẵn sàng xác thực mà không cần yêu cầu hợp nhất hoặc tích hợp B7.

Giữ `TD-022` là `IN PROGRESS`; không đánh dấu nó đã được giải quyết trước CI sau hợp nhất.

- [ ] **Bước 6: Cam kết gói xác thực**

```powershell
git add -- .sdd/reviews/fe11-admin-role-ui-contract-validation-2026-07-18.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md TECH_DEBT.md
git commit -m "docs: record FE11 admin role UI validation"
```

- [ ] **Bước 7: Dừng lại để con người đánh giá việc triển khai**

Trình bày các tệp đã thay đổi, bằng chứng RED/GREEN, bốn lớp xác thực và rủi ro còn sót lại. Không
đẩy, mở PR hoặc đánh dấu hoàn thành `FE11-UIR05` cho đến khi người dùng phê duyệt rõ ràng việc xem
xét triển khai.

---

### Nhiệm vụ 7: Tích hợp và đóng TD-022 sau CI sau hợp nhất

**Tệp:**
- Sửa đổi: `.sdd/reviews/fe11-admin-role-ui-contract-validation-2026-07-18.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Sửa đổi: `TECH_DEBT.md`
- Sửa đổi: `.agents/CLAUDE.md`

**Giao diện:**
- Tiêu thụ: phê duyệt triển khai rõ ràng của con người, PR CI thành công, cam kết hợp nhất và CI `main` sau hợp nhất thành công.
- Tạo ra: Bằng chứng tích hợp B7, `FE11-UIR05` đã hoàn thành, `TD-022` đã giải quyết và bộ nhớ dự án được cập nhật.

- [ ] **Bước 1: Ghi lại đánh giá của con người trước khi xuất bản**

Sau khi phê duyệt rõ ràng, hãy đánh dấu Cổng đánh giá con người trong bản ghi xác thực và thêm ngày
đánh giá bên dưới `FE11-UIR05`. Cam kết:

```powershell
git add -- .sdd/reviews/fe11-admin-role-ui-contract-validation-2026-07-18.md .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "docs: record FE11 admin role UI review"
```

- [ ] **Bước 2: Nhấn và mở bản PR nháp**

```powershell
git push -u origin fix/fe11-admin-role-ui-contract
@'
## Nội dung đã thay đổi

- Align FE11 Admin role assignment/revocation with the approved numeric `roleId` contract.
- Validate the authenticated role catalog before mutation.
- Assign before revoking and reconcile the modal after partial failure.

## Ánh xạ đặc tả

- FR-FE11-012..014, FR-FE11-024..027
- AC-FE11-013..015
- TD-022 only

## Xác nhận

- Focused and full frontend tests, lint, and build PASS.
- Focused backend FE11 role regression PASS.
- `trace:enforce` and diff hygiene PASS.

No backend, schema, or FE11 SPEC change is included.
'@ | gh pr create --draft --base main --head fix/fe11-admin-role-ui-contract --title "fix(fe11): align admin role UI contract" --body-file -
```

Cơ quan PR phải nêu rõ các ID, tệp SPEC chính xác, bằng chứng RED/GREEN, không có thay đổi
backend/schema và ranh giới nguyên tử đa yêu cầu còn lại.

- [ ] **Bước 3: Yêu cầu PR CI trước khi hợp nhất**

Chạy:

```powershell
$prNumber = gh pr view --json number --jq .number
gh pr checks $prNumber --watch
```

Dự kiến: `foundation-checks` đạt. Đánh dấu sẵn sàng và chỉ hợp nhất sau khi người dùng cho phép tích hợp.

- [ ] **Bước 4: Yêu cầu CI chính sau hợp nhất**

Xác định lần chạy đẩy `main` cho cam kết hợp nhất và chạy:

```powershell
$mergeSha = gh pr view $prNumber --json mergeCommit --jq .mergeCommit.oid
$runId = gh run list --branch main --workflow CI --event push --limit 20 --json databaseId,headSha --jq ".[] | select(.headSha == `"$mergeSha`") | .databaseId" | Select-Object -First 1
if (-not $runId) { throw "Post-merge CI run was not found for $mergeSha" }
gh run watch $runId --exit-status
```

Dự kiến: đạt `foundation-checks` sau hợp nhất.

- [ ] **Bước 5: Tạo thay đổi tài liệu khóa B7**

Trên nhánh tài liệu mới từ cam kết hợp nhất thành công:

- Đánh dấu `FE11-UIR05` hoàn chỉnh với PR, cam kết hợp nhất và ID chạy CI.
- Thay đổi `TD-022` từ `IN PROGRESS` thành `RESOLVED` và thêm bằng chứng PR/cam kết đóng.
- Thêm mục tích hợp B7 vào FE11 `CHANGELOG.md`.
- Đặt trạng thái tích hợp bản ghi xác thực thành hoàn tất.
- Cập nhật `.agents/CLAUDE.md` để TD-022 không còn được liệt kê là chưa được giải quyết; hoãn lại `TD-023..TD-027`.

Xác thực và cam kết:

```powershell
npm.cmd run trace:enforce
git diff --check
git add -- .agents/CLAUDE.md .sdd/reviews/fe11-admin-role-ui-contract-validation-2026-07-18.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/CHANGELOG.md TECH_DEBT.md
git commit -m "docs: close FE11 admin role UI B7"
```

Xuất bản bản kết thúc nhỏ này thông qua luồng PR/CI/hợp nhất được xem xét thông thường. Toàn bộ chức
năng FE11 vẫn là `Implementation State: DEFERRED`.
