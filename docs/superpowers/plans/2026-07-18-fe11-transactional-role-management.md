# FE11 Kế hoạch thực hiện quản lý vai trò giao dịch

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Làm cho việc phân công và thu hồi vai trò FE11 mang tính xác định, an toàn đồng thời
và được kiểm tra nguyên tử mà không cần mở rộng sang công việc FE11 bị trì hoãn còn lại.

**Kiến trúc:** Thêm `userRoleRepository` tập trung sở hữu giao dịch SQL bị khóa và trả về kết quả
kinh doanh. Giữ xác thực HTTP ở ranh giới tuyến đường, ánh xạ kết quả tới các lỗi an toàn trong
`userManagementService` và chỉ đọc lại DTO của người dùng được quản lý an toàn hiện có sau khi cam
kết thành công.

**bộ công nghệ công nghệ:** Node.js CommonJS, Express 5, trình xác thực nhanh, Jest 30, SQL Server
thông qua các tạo phẩm `mssql`, Markdown SDD.

## Ràng buộc toàn cầu

- bộ công nghệ được phê duyệt vẫn là Node.js + Express.js, React + Bootstrap, SQL Server và RESTful API.
- Chỉ triển khai `BR-FE11-001`, `BR-FE11-007..010`, `FR-FE11-012..017`, `FR-FE11-024..027`, `AC-FE11-013..015`, `NFR-FE11-SEC-001..005`, `NFR-FE11-TXN-003` và `NFR-FE11-TXN-006` cho lát này.
- Trì hoãn công việc còn lại của FE11 và ghi riêng phần đã hoàn thành này. Không sửa đổi trình kiểm tra truy vết trên toàn kho lưu trữ trong gói chỉ dành cho FE11 này.
- Không thay đổi lược đồ cơ sở dữ liệu, đường dẫn điểm cuối công khai, phân cấp vai trò, hành vi cập nhật/hủy kích hoạt của người dùng, trường thủ thư hoặc Giao diện người dùng quản trị.
- Xác thực và ủy quyền trước khi tiết lộ chi tiết xác thực đầu vào.
- Chỉ sử dụng SQL được tham số hóa; không bao giờ tồn tại hoặc trả sách thông tin xác thực, mã thông báo, phiên hoặc liên kết thiết lập.
- Mọi thay đổi về hành vi sản xuất trước tiên phải có một kiểm thử thất bại được quan sát.
- Giữ nguyên những thay đổi không liên quan của người dùng và các tập tin không bị theo dõi.

---

### Nhiệm vụ 1: Kích hoạt Phần vai trò FE11 đã được phê duyệt

**Tệp:**
- Sửa đổi: `docs/superpowers/specs/2026-07-18-fe11-transactional-role-management-design.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`

**Giao diện:**
- Tiêu thụ: thiết kế FE11 đã được phê duyệt và nhóm nhiệm vụ thiết lập tài khoản hiện tại `FE11-S01..S08`.
- Tạo ra: ID nhiệm vụ được phê duyệt `FE11-R01..R05` và những kỳ vọng bằng chứng rõ ràng được sử dụng bởi các nhiệm vụ sau này.

- [ ] **Bước 1: Đánh dấu thiết kế bằng văn bản đã được phê duyệt và ghi lại ngoại lệ siêu dữ liệu**

Đảm bảo trạng thái thiết kế là:

```markdown
Trạng thái: ĐƯỢC PHÊ DUYỆT BỞI HUMAN - 2026-07-18
```

Phần truy vết của nó phải nêu rõ rằng công việc toàn bộ chức năng còn lại vẫn bị trì hoãn và trình
kiểm tra `main` hiện tại vẫn sử dụng phương pháp phỏng đoán trạng thái hàng đầu hiện có của nó.

- [ ] **Bước 2: Thêm lát vai trò giới hạn vào FE11 PLAN.md**

Nối phạm vi này sau kế hoạch thiết lập tài khoản:

```markdown
## 10. Lát cắt quản lý vai trò theo giao dịch

### Trong phạm vi

- Xác thực ID vai trò và mục tiêu số nguyên dương.
- Xác nhận lại quyền Quản trị viên đang hoạt động trong giao dịch SQL.
- Chỉ định/thu hồi ánh xạ vai trò có lỗi trùng lặp/thiếu xác định.
- Bảo vệ vai trò người dùng cuối cùng và Quản trị viên hoạt động cuối cùng trong `UPDLOCK, HOLDLOCK`.
- Cam kết thay đổi vai trò và kiểm toán cùng nhau.
- Thêm các kiểm thử tuyến đường, dịch vụ và kho lưu trữ.

### Ngoài phạm vi

- Cập nhật/hủy kích hoạt người dùng, trường thủ thư, đối chiếu chi tiết an toàn DTO và Giao diện người dùng quản trị.
- Thay đổi lược đồ, tạo/chỉnh sửa vai trò, chỉnh sửa quyền và phân cấp vai trò.

### Cổng xác nhận

- Các kiểm thử RED-GREEN tập trung chứng minh từng kết quả của kho lưu trữ và ánh xạ API.
- Kiểm tra máy chủ đầy đủ và vượt qua `trace:enforce`.
- Công việc FE11 còn lại vẫn bị trì hoãn; bằng chứng lát vai trò đã hoàn thành được ghi lại riêng biệt.
```

Cập nhật trạng thái hàng đầu để đề cập rằng quá trình thiết lập tài khoản đã hoàn tất, phần vai trò
giao dịch được phê duyệt để triển khai và công việc FE11 còn lại bị hoãn lại.

- [ ] **Bước 3: Thêm nhóm nhiệm vụ FE11-R01..R05**

Chèn trước `## Deferred FE11 Work`:

```markdown
## Nhiệm vụ quản lý vai trò theo giao dịch

- [ ] **FE11-R01 - Xác thực ID yêu cầu thay đổi vai trò.**
  - Bản đồ tới: NFR-FE11-SEC-004; FR-FE11-012..013, FR-FE11-024..026.
  - DoD: Yêu cầu quản trị viên đã được xác thực nhận ID số nguyên dương được chuẩn hóa; ID không hợp lệ trả về `400 VALIDATION_ERROR` trước khi dịch vụ được gọi.

- [ ] **FE11-R02 - Thêm các kiểm thử kho lưu trữ giao dịch RED.**
  - Bản đồ tới: BR-FE11-007..010; FR-FE11-014, FR-FE11-017, FR-FE11-024..027; NFR-FE11-TXN-003/006.
  - DoD: các kiểm thử không thành công bao gồm tra cứu tác nhân/mục tiêu/vai trò, ánh xạ trùng lặp/thiếu, bảo vệ vai trò cuối cùng, số lượng Quản trị viên bị khóa, kiểm tra nguyên tử và khôi phục.

- [ ] **FE11-R03 - Thực hiện thao tác ghi vai trò giao dịch.**
  - Phụ thuộc: FE11-R02.
  - DoD: một giao dịch SQL được tham số hóa trả về kết quả xác định, sử dụng các gợi ý khóa bắt buộc và cam kết hoặc khôi phục ánh xạ cùng với kiểm tra cùng nhau.

- [ ] **FE11-R04 - Kết quả bản đồ kho lưu trữ thông qua dịch vụ FE11.**
  - Phụ thuộc: FE11-R03.
  - DoD: các kiểm thử RED-GREEN cấp dịch vụ chứng minh ánh xạ trạng thái/mã/thông báo an toàn và khả năng đọc lại thành công của người dùng an toàn mà không cần kiểm tra lần thứ hai.

- [ ] **FE11-R05 - Vượt qua cổng xác thực quản lý vai trò giao dịch.**
  - Các phần phụ thuộc: FE11-R01..R04.
  - DoD: các kiểm thử máy chủ tập trung/đầy đủ, truy vết, vệ sinh khác biệt, đánh giá bảo mật, tài liệu, đối chiếu nợ và bằng chứng đánh giá con người đã hoàn tất.
```

Giữ chính xác dòng hiện có:

```markdown
Trạng thái thực hiện: TRÌ HOÃN
```

- [ ] **Bước 4: Cập nhật TEST_PLAN.md và CHANGELOG.md**

Thêm phần vai trò đã được phê duyệt vào Bằng chứng/Khoảng trống hiện tại và thêm mục nhập nhật ký
thay đổi ghi ngày tháng cho biết rằng thiết kế và lập kế hoạch nhiệm vụ đã được phê duyệt nhưng bằng
chứng triển khai vẫn chưa được xác nhận.

- [ ] **Bước 5: Chạy kiểm tra tài liệu**

Chạy:

```powershell
npm.cmd run trace:enforce
git diff --check -- docs/superpowers/specs/2026-07-18-fe11-transactional-role-management-design.md .sdd/specs/feat-user-role-management
```

Dự kiến: truy vết báo cáo phạm vi bao phủ FE11 và vẫn ĐẠT theo phương pháp phỏng đoán trạng thái
`main` hiện tại; Kiểm tra khác biệt Markdown sạch sẽ.

- [ ] **Bước 6: Cam kết điểm kiểm tra quy hoạch đã được phê duyệt**

```powershell
git add -- docs/superpowers/specs/2026-07-18-fe11-transactional-role-management-design.md .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md
git commit -m "docs: plan transactional FE11 role management"
```

---

### Nhiệm vụ 2: Xác thực đầu vào thao tác ghi vai trò tại ranh giới tuyến đường

**Tệp:**
- Sửa đổi: `backend/tests/userManagementRoutes.test.js`
- Sửa đổi: `backend/src/validators/userManagementValidators.js`
- Sửa đổi: `backend/src/routes/userManagementRoutes.js`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`

**Giao diện:**
- Tiêu thụ: `handleValidationErrors` hiện có và phần mềm trung gian tuyến đầu tiên dành cho quản trị viên.
- Sản xuất: `assignRoleValidators` và `revokeRoleValidators`; bộ điều khiển nhận ID số và nội dung gán `{ roleId: number }`.

- [ ] **Bước 1: Viết kiểm thử lộ trình chuyển nhượng và thu hồi không thành công**

Thêm các trường hợp chuẩn hóa thành công:

```js
test('POST /api/users/:userId/roles passes normalized IDs and Admin context', async () => {
  const updatedUser = { userId: 7, roles: ['LIBRARIAN', 'MEMBER'] };
  const userManagementService = { assignRole: jest.fn(async () => updatedUser) };
  const app = makeApp({ userManagementService });

  const response = await request(app)
    .post('/api/users/7/roles')
    .set('Authorization', 'Bearer token')
    .send({ roleId: 3 });

  expect(response.status).toBe(200);
  expect(response.body).toEqual(updatedUser);
  expect(userManagementService.assignRole).toHaveBeenCalledWith(
    7,
    { roleId: 3 },
    expect.objectContaining({ adminUserId: 99 })
  );
});

test('DELETE /api/users/:userId/roles/:roleId passes normalized IDs and Admin context', async () => {
  const updatedUser = { userId: 7, roles: ['MEMBER'] };
  const userManagementService = { revokeRole: jest.fn(async () => updatedUser) };
  const app = makeApp({ userManagementService });

  const response = await request(app)
    .delete('/api/users/7/roles/3')
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(200);
  expect(response.body).toEqual(updatedUser);
  expect(userManagementService.revokeRole).toHaveBeenCalledWith(
    7,
    3,
    expect.objectContaining({ adminUserId: 99 })
  );
});
```

Thêm các trường hợp không hợp lệ dựa trên bảng cho các giá trị `userId` `0`, `-1`, `not-a-user`, ID
vai trò nội dung gán `0`, `-1`, `missing` và các giá trị tham số vai trò thu hồi `0`, `-1`,
`not-a-role`. Mỗi cuộc kiểm tra phải yêu cầu `400`, mã `VALIDATION_ERROR`, thông tin chi tiết theo
trường cụ thể và không có cuộc gọi dịch vụ.

- [ ] **Bước 2: Chạy RED**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementRoutes.test.js
```

Dự kiến: các kiểm thử ID không hợp lệ mới không thành công do các tuyến vai trò không có trình xác
thực và bộ điều khiển nhận tham số chuỗi.

- [ ] **Bước 3: Triển khai trình xác thực tập trung**

Cập nhật mô-đun xác thực:

```js
const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');

function positiveIdParam(name, label) {
  return param(name)
    .isInt({ min: 1 })
    .withMessage(`${label} must be a positive integer.`)
    .toInt();
}

const assignRoleValidators = [
  positiveIdParam('userId', 'User ID'),
  body('roleId')
    .exists({ values: 'null' })
    .withMessage('Role ID is required.')
    .bail()
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer.')
    .toInt(),
  handleValidationErrors,
];

const revokeRoleValidators = [
  positiveIdParam('userId', 'User ID'),
  positiveIdParam('roleId', 'Role ID'),
  handleValidationErrors,
];
```

Giữ lại `resendSetupValidators` bằng cách sử dụng cùng một trình trợ giúp. Xuất cả ba mảng trình xác thực.

Các tuyến dây sau khi xác thực Quản trị viên/authorization:

```js
router.post('/:userId/roles', ...requireAdmin, assignRoleValidators, controller.assignRole);
router.delete(
  '/:userId/roles/:roleId',
  ...requireAdmin,
  revokeRoleValidators,
  controller.revokeRole
);
```

- [ ] **Bước 4: Chạy GREEN và kiểm tra lộ trình hồi quy**

Chạy lệnh tập trung từ Bước 2.

Dự kiến: tất cả các kiểm thử `userManagementRoutes.test.js` đều vượt qua; các kiểm thử không được
xác thực/không phải của quản trị viên vẫn trả về `401`/`403` trước chi tiết xác thực.

- [ ] **Bước 5: Đánh dấu FE11-R01 là hoàn thành và cam kết**

```powershell
git add -- backend/tests/userManagementRoutes.test.js backend/src/validators/userManagementValidators.js backend/src/routes/userManagementRoutes.js .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "fix: validate FE11 role mutation inputs"
```

---

### Nhiệm vụ 3: Xây dựng kho lưu trữ vai trò giao dịch

**Tệp:**
- Tạo: `backend/tests/userRoleRepository.test.js`
- Tạo: `backend/src/repositories/userRoleRepository.js`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`

**Giao diện:**
- Tiêu thụ: các bảng `getPool`, `sql.Transaction`, `sql.Request` và SQL các bảng `Users`, `Roles`, `UserRoles`, `AuditLogs`.
- Sản xuất: `mutateUserRole({ operation, adminUserId, userId, roleId, ipAddress, userAgent, now }) -> { outcome, role? }`.

- [ ] **Bước 1: Tạo khai thác giao dịch SQL mô phỏng**

Trong `userRoleRepository.test.js`, mô phỏng `../src/config/db` bằng `Transaction` ghi lại
`commitCount` và `rollbackCount`, và `Request` ghi lại các đầu vào đã nhập sau đó ủy quyền từng
chuỗi SQL cho `pool.transactionQuery(query, inputs)`.

Sử dụng trình trợ giúp hàng đợi:

```js
function useTransactionResults(results) {
  const calls = [];
  getPool.mockResolvedValue({
    async transactionQuery(query, inputs) {
      calls.push({ query, inputs });
      const next = results.shift();
      if (next instanceof Error) throw next;
      return { recordset: next || [] };
    },
  });
  return calls;
}
```

Đặt lại `getPool` và `sql.Transaction.instances` trước mỗi lần kiểm tra.

- [ ] **Bước 2: Viết kết quả RED và kiểm tra tính nguyên tử**

Thêm kiểm thử cho:

```js
test('assigns a missing mapping and audits in one committed transaction', async () => {
  const calls = useTransactionResults([
    [{ UserId: 99, Status: 'ACTIVE', IsAdmin: 1 }],
    [{ UserId: 7 }],
    [{ RoleId: 3, RoleName: 'LIBRARIAN' }],
    [],
    [],
    [],
  ]);

  await expect(userRoleRepository.mutateUserRole({
    operation: 'ASSIGN', adminUserId: 99, userId: 7, roleId: 3,
    ipAddress: '127.0.0.1', userAgent: 'jest', now: FIXED_NOW,
  })).resolves.toEqual({
    outcome: 'ASSIGNED', role: { roleId: 3, roleName: 'LIBRARIAN' },
  });

  expect(calls.some(({ query }) => query.includes('INSERT INTO UserRoles'))).toBe(true);
  expect(calls.some(({ query }) => query.includes('INSERT INTO AuditLogs'))).toBe(true);
  expect(sql.Transaction.instances.at(-1).commitCount).toBe(1);
  expect(sql.Transaction.instances.at(-1).rollbackCount).toBe(0);
});
```

Thêm thu hồi thành công tương ứng. Thêm kết quả dự kiến ​​theo bảng cho `ADMIN_NOT_FOUND`,
`ADMIN_REQUIRED`, `USER_NOT_FOUND`, `ROLE_NOT_FOUND`, `USER_ALREADY_HAS_ROLE`,
`USER_ROLE_NOT_FOUND`, `LAST_USER_ROLE` và `LAST_ADMIN_ROLE`. Kết quả kinh doanh dự kiến ​​phải khôi
phục các giao dịch chỉ đọc và không được thực hiện thao tác ghi/kiểm tra SQL.

Thêm một trường hợp lỗi chèn kiểm tra có thể xảy ra lỗi ban đầu, `commitCount = 0` và `rollbackCount
= 1` sau khi thử ánh xạ SQL.

Xác nhận lựa chọn được bảo vệ SQL chứa `UPDLOCK` và `HOLDLOCK`, đồng thời xác nhận các giá trị đầu
vào có trong sơ đồ đầu vào đã nhập đã ghi thay vì được nội suy vào SQL.

- [ ] **Bước 3: Chạy RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userRoleRepository.test.js
```

Dự kiến: THẤT BẠI vì `userRoleRepository.js` không tồn tại.

- [ ] **Bước 4: Thực hiện giao dịch và kết quả xác định**

Tạo kho lưu trữ với giao dịch hoàn chỉnh bên dưới:

```js
const { sql, getPool } = require('../config/db');

const OPERATIONS = new Set(['ASSIGN', 'REVOKE']);

async function rollbackWith(transaction, outcome) {
  await transaction.rollback();
  return { outcome };
}

async function mutateUserRole({
  operation,
  adminUserId,
  userId,
  roleId,
  ipAddress,
  userAgent,
  now = new Date(),
}) {
  if (!OPERATIONS.has(operation)) {
    throw new TypeError('Role mutation operation must be ASSIGN or REVOKE.');
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const actorResult = await new sql.Request(transaction)
      .input('AdminUserId', sql.Int, adminUserId)
      .query(`
        SELECT
          u.UserId,
          u.Status,
          CASE WHEN EXISTS (
            SELECT 1
            FROM UserRoles ur WITH (UPDLOCK, HOLDLOCK)
            INNER JOIN Roles r WITH (UPDLOCK, HOLDLOCK) ON r.RoleId = ur.RoleId
            WHERE ur.UserId = u.UserId
              AND UPPER(r.RoleName) = 'ADMIN'
          ) THEN 1 ELSE 0 END AS IsAdmin
        FROM Users u WITH (UPDLOCK, HOLDLOCK)
        WHERE u.UserId = @AdminUserId
      `);

    const actor = actorResult.recordset[0];
    if (!actor) return rollbackWith(transaction, 'ADMIN_NOT_FOUND');
    if (actor.Status !== 'ACTIVE' || !actor.IsAdmin) {
      return rollbackWith(transaction, 'ADMIN_REQUIRED');
    }

    const targetResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT UserId
        FROM Users WITH (UPDLOCK, HOLDLOCK)
        WHERE UserId = @UserId
      `);
    if (!targetResult.recordset[0]) {
      return rollbackWith(transaction, 'USER_NOT_FOUND');
    }

    const roleResult = await new sql.Request(transaction)
      .input('RoleId', sql.Int, roleId)
      .query(`
        SELECT RoleId, RoleName
        FROM Roles WITH (UPDLOCK, HOLDLOCK)
        WHERE RoleId = @RoleId
      `);
    const roleRow = roleResult.recordset[0];
    if (!roleRow) return rollbackWith(transaction, 'ROLE_NOT_FOUND');

    const role = { roleId: roleRow.RoleId, roleName: roleRow.RoleName };
    const mappingResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT ur.RoleId, r.RoleName
        FROM UserRoles ur WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN Roles r WITH (UPDLOCK, HOLDLOCK) ON r.RoleId = ur.RoleId
        WHERE ur.UserId = @UserId
      `);
    const targetRoles = mappingResult.recordset;
    const existingMapping = targetRoles.some((item) => item.RoleId === roleId);

    if (operation === 'ASSIGN' && existingMapping) {
      return rollbackWith(transaction, 'USER_ALREADY_HAS_ROLE');
    }

    if (operation === 'REVOKE' && !existingMapping) {
      return rollbackWith(transaction, 'USER_ROLE_NOT_FOUND');
    }

    if (operation === 'REVOKE' && targetRoles.length <= 1) {
      return rollbackWith(transaction, 'LAST_USER_ROLE');
    }

    if (operation === 'REVOKE' && String(role.roleName).toUpperCase() === 'ADMIN') {
      const adminsResult = await new sql.Request(transaction).query(`
        SELECT ur.UserId
        FROM UserRoles ur WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN Roles r WITH (UPDLOCK, HOLDLOCK) ON r.RoleId = ur.RoleId
        INNER JOIN Users u WITH (UPDLOCK, HOLDLOCK) ON u.UserId = ur.UserId
        WHERE UPPER(r.RoleName) = 'ADMIN'
          AND u.Status = 'ACTIVE'
      `);

      if (adminsResult.recordset.length <= 1) {
        return rollbackWith(transaction, 'LAST_ADMIN_ROLE');
      }
    }

    if (operation === 'ASSIGN') {
      await new sql.Request(transaction)
        .input('UserId', sql.Int, userId)
        .input('RoleId', sql.Int, roleId)
        .input('Now', sql.DateTime, now)
        .query(`
          INSERT INTO UserRoles (UserId, RoleId, CreatedAt)
          VALUES (@UserId, @RoleId, @Now)
        `);
    } else {
      await new sql.Request(transaction)
        .input('UserId', sql.Int, userId)
        .input('RoleId', sql.Int, roleId)
        .query(`
          DELETE FROM UserRoles
          WHERE UserId = @UserId AND RoleId = @RoleId
        `);
    }

    const action = operation === 'ASSIGN' ? 'USER_ROLE_ASSIGN' : 'USER_ROLE_REVOKE';
    await new sql.Request(transaction)
      .input('AdminUserId', sql.Int, adminUserId)
      .input('Action', sql.NVarChar(255), action)
      .input('TargetId', sql.Int, userId)
      .input(
        'Metadata',
        sql.NVarChar(sql.MAX),
        JSON.stringify({ roleId: role.roleId, roleName: role.roleName })
      )
      .input('IpAddress', sql.NVarChar(50), ipAddress || null)
      .input('UserAgent', sql.NVarChar(255), userAgent || null)
      .input('Now', sql.DateTime, now)
      .query(`
        INSERT INTO AuditLogs
          (UserId, Action, TargetType, TargetId, Metadata, IpAddress, UserAgent, CreatedAt)
        VALUES
          (@AdminUserId, @Action, 'USER', @TargetId, @Metadata,
           @IpAddress, @UserAgent, @Now)
      `);

    await transaction.commit();
    return { outcome: operation === 'ASSIGN' ? 'ASSIGNED' : 'REVOKED', role };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { mutateUserRole };
```

Thêm thẻ theo dõi phía trên hàm thao tác ghi:

```js
// @spec BR-FE11-007, BR-FE11-009, BR-FE11-010, FR-FE11-012, FR-FE11-013, FR-FE11-014
// @spec FR-FE11-017, FR-FE11-024, FR-FE11-025, FR-FE11-026, FR-FE11-027
```

- [ ] **Bước 5: Chạy GREEN**

Chạy lệnh kho lưu trữ tập trung. Dự kiến: tất cả các kiểm thử kho lưu trữ đều vượt qua mà không có
cảnh báo trên bảng điều khiển.

- [ ] **Bước 6: Đánh dấu FE11-R02/R03 là hoàn thành và cam kết**

```powershell
git add -- backend/tests/userRoleRepository.test.js backend/src/repositories/userRoleRepository.js .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "feat: add transactional FE11 role mutations"
```

---

### Nhiệm vụ 4: Lập bản đồ kết quả giao dịch trong dịch vụ

**Tệp:**
- Sửa đổi: `backend/tests/userManagementService.test.js`
- Sửa đổi: `backend/src/services/userManagementService.js`
- Sửa đổi: `backend/src/repositories/userRepository.js`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`

**Giao diện:**
- Tiêu thụ: Kết quả `userRoleRepository.mutateUserRole` từ Nhiệm vụ 3.
- Tạo ra: `assignRole(userId, { roleId }, context)` và `revokeRole(userId, roleId, context)` với ánh xạ `AppException` xác định và khả năng đọc lại an toàn cho người dùng.

- [ ] **Bước 1: Viết kiểm thử kết quả và khai thác dịch vụ RED**

Thêm dây nịt tập trung:

```js
function makeRoleHarness(outcome) {
  const updatedUser = {
    userId: 7,
    email: 'staff@example.test',
    roles: outcome === 'REVOKED' ? ['MEMBER'] : ['LIBRARIAN', 'MEMBER'],
  };
  const userRepository = {
    getManagedUserById: jest.fn(async () => updatedUser),
  };
  const userRoleRepository = {
    mutateUserRole: jest.fn(async () => ({
      outcome,
      role: { roleId: 3, roleName: 'LIBRARIAN' },
    })),
  };
  const service = createUserManagementService({
    userRepository,
    userRoleRepository,
    authTokenRepository: {},
    auditLogRepository: {},
    accountSetupRepository: {},
    notificationRequester: { createNotificationRequest: jest.fn() },
  });
  return { service, userRepository, userRoleRepository, updatedUser };
}
```

Viết các kiểm thử thành công chứng minh `operation`, ID số, ngữ cảnh của Quản trị viên và đọc lại.
Thêm xác nhận kết quả theo bảng:

```js
test.each([
  ['ADMIN_NOT_FOUND', 404, 'ADMIN_NOT_FOUND', 'Acting admin was not found.'],
  ['ADMIN_REQUIRED', 403, 'ADMIN_REQUIRED', 'Admin access is required.'],
  ['USER_NOT_FOUND', 404, 'USER_NOT_FOUND', 'User was not found.'],
  ['ROLE_NOT_FOUND', 404, 'ROLE_NOT_FOUND', 'Role was not found.'],
  ['USER_ALREADY_HAS_ROLE', 409, 'USER_ALREADY_HAS_ROLE', 'User already has this role.'],
  ['USER_ROLE_NOT_FOUND', 404, 'USER_ROLE_NOT_FOUND', 'User does not have this role.'],
  ['LAST_USER_ROLE', 400, 'LAST_USER_ROLE', 'Every user must keep at least one role.'],
  ['LAST_ADMIN_ROLE', 400, 'LAST_ADMIN_ROLE', 'Cannot remove the last Admin role.'],
])('maps %s to a safe service error', async (outcome, statusCode, code, message) => {
  const { service, userRepository } = makeRoleHarness(outcome);
  await expect(
    service.assignRole(7, { roleId: 3 }, { adminUserId: 99 })
  ).rejects.toMatchObject({ statusCode, code, message });
  expect(userRepository.getManagedUserById).not.toHaveBeenCalled();
});
```

Thêm các kiểm thử đầu vào trực tiếp cho mục tiêu, vai trò và ID quản trị viên hoạt động không hợp
lệ; họ phải từ chối trước khi truy cập kho lưu trữ.

- [ ] **Bước 2: Chạy RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementService.test.js
```

Dự kiến: các kiểm thử vai trò mới không thành công do nhà máy không sử dụng `userRoleRepository` và
các phương thức vai trò cũ âm thầm biến đổi thông qua `userRepository`.

- [ ] **Bước 3: Triển khai đưa dịch vụ vào và lập bản đồ kết quả**

Thêm `userRoleRepository` vào phần phụ thuộc của nhà máy và mặc định là `../repositories/userRoleRepository`.

Thêm trình trợ giúp ID tích cực và trình ánh xạ kết quả:

```js
function parsePositiveId(value, code, message, errorFactory = errors.badRequest) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw errorFactory(code, message);
  }
  return parsed;
}

function throwRoleMutationError(outcome) {
  const mappings = {
    ADMIN_NOT_FOUND: () => errors.notFound('ADMIN_NOT_FOUND', 'Acting admin was not found.'),
    ADMIN_REQUIRED: () => errors.forbidden('ADMIN_REQUIRED', 'Admin access is required.'),
    USER_NOT_FOUND: () => errors.notFound('USER_NOT_FOUND', 'User was not found.'),
    ROLE_NOT_FOUND: () => errors.notFound('ROLE_NOT_FOUND', 'Role was not found.'),
    USER_ALREADY_HAS_ROLE: () => errors.conflict('USER_ALREADY_HAS_ROLE', 'User already has this role.'),
    USER_ROLE_NOT_FOUND: () => errors.notFound('USER_ROLE_NOT_FOUND', 'User does not have this role.'),
    LAST_USER_ROLE: () => errors.badRequest('LAST_USER_ROLE', 'Every user must keep at least one role.'),
    LAST_ADMIN_ROLE: () => errors.badRequest('LAST_ADMIN_ROLE', 'Cannot remove the last Admin role.'),
  };
  const createError = mappings[outcome];
  if (!createError) throw errors.internal();
  throw createError();
}
```

Thực hiện chuyển nhượng/thu hồi thông qua một người trợ giúp dịch vụ riêng. Nó phải phân tích cú
pháp `adminUserId`, `userId` và `roleId`, gọi `mutateUserRole`, ánh xạ các kết quả không thành công
và chỉ gọi `getManagedUserById` sau `ASSIGNED`/`REVOKED`.

Loại bỏ những người trợ giúp trước chuyến bay theo vai trò cụ thể và tách các cuộc gọi kiểm tra khỏi
các phương pháp cũ. Sau khi `rg` xác nhận không còn người tiêu dùng nào, hãy xóa các bản xuất và
triển khai `findRoleById`, `findRoleByName`, `assignRole`, `revokeRole`, `countUsersByRole` và
`countRolesByUserId` lỗi thời khỏi `userRepository.js`.

- [ ] **Bước 4: Chạy GREEN và các kiểm thử bị ảnh hưởng**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementService.test.js tests/userRoleRepository.test.js tests/userManagementRoutes.test.js
```

Dự kiến: tất cả các kiểm thử tập trung đều đạt; các kiểm thử tạo/gửi lại thiết lập tài khoản vẫn có màu xanh.

- [ ] **Bước 5: Đánh dấu FE11-R04 là hoàn thành và cam kết**

```powershell
git add -- backend/tests/userManagementService.test.js backend/src/services/userManagementService.js backend/src/repositories/userRepository.js .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "fix: enforce deterministic FE11 role errors"
```

---

### Nhiệm vụ 5: Xác thực, đối chiếu khoản nợ và ghi lại bằng chứng

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Sửa đổi: `TECH_DEBT.md`
- Tạo: `.sdd/reviews/fe11-transactional-role-management-validation-2026-07-18.md`

**Giao diện:**
- Tiêu thụ: đã hoàn thành bằng chứng kiểm thử và triển khai FE11-R01..R04.
- Tạo ra: bản ghi xác thực FE11-R05, thu hẹp nợ kỹ thuật và chuyển giao sẵn sàng cho người đánh giá.

- [ ] **Bước 1: Chạy kiểm tra tập trung và hoàn toàn tự động**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userRoleRepository.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd run trace:enforce
```

Dự kiến: vượt qua bộ máy chủ tập trung và đầy đủ; ngưỡng bảo hiểm hiện có vượt qua; truy vết báo cáo
các FR được gắn thẻ của FE11 và vẫn duy trì ĐẠT theo phương pháp phỏng đoán trạng thái `main` hiện
tại.

- [ ] **Bước 2: Chạy kiểm tra bảo mật và vệ sinh khác**

```powershell
rg -n "password|token|secret|api[_-]?key|private[_-]?key" backend/src/repositories/userRoleRepository.js backend/src/services/userManagementService.js backend/tests/userRoleRepository.test.js backend/tests/userManagementService.test.js
git diff --check
git status --short
```

Dự kiến: mọi kết quả trùng khớp chỉ là tên trường hoặc mã thiết lập tài khoản hiện có; không có giá
trị thông tin nào được giới thiệu. Kiểm tra khác biệt là sạch sẽ. Trạng thái vẫn hiển thị những thay
đổi không liên quan đã tồn tại trước đó của người dùng và không được thực hiện theo giai đoạn.

- [ ] **Bước 3: Đối chiếu tài liệu và công nợ FE11**

Đánh dấu `FE11-R05` chỉ hoàn thành sau khi tất cả bằng chứng được thông qua. Cập nhật Bằng chứng
hiện tại của TEST_PLAN bằng các tệp tuyến đường/dịch vụ/kho lưu trữ và lưu ý rằng việc thiếu kiểm
thử đồng thời SQL Server dùng một lần như một khoảng trống còn sót lại.

Thêm mục nhập nhật ký thay đổi mô tả các lỗi xác định, kiểm tra giao dịch, khóa Quản trị viên cuối
cùng và bằng chứng kiểm tra.

Cập nhật `TECH_DEBT.md`:

- Đánh dấu `TD-013` đã được giải quyết bằng cam kết/bằng chứng thực hiện.
- Thu hẹp `TD-014` vào các hành động không có vai trò còn lại mà ngữ nghĩa của quyền quản trị viên/không tìm thấy vẫn chưa được đối chiếu.
- Thu hẹp `TD-015` thành các quy tắc dịch vụ FE11 còn lại; xóa xác nhận cũ rằng `userManagementService.test.js` bị thiếu.
- Giữ nguyên `TD-012`, `TD-016` và mọi mối lo ngại thực sự còn lại về `TD-017` trừ khi được chứng minh là lỗi thời.

- [ ] **Bước 4: Viết bản ghi xác nhận B1-B7**

Tạo đánh giá với các phần sau:

```markdown
# Xác nhận quản lý vai trò theo giao dịch FE11

Ngày: 2026-07-18
Phạm vi: chỉ FE11-R01..R05

## Bằng chứng tự động L1
## L2 Tuân thủ đặc tả
## L3 Hiến chương và an toàn
## L4 Nghiệm thu và rủi ro còn lại
## Tệp đã thay đổi
## Công việc FE11 còn lại
```

Ghi lại số lượng lệnh/kết quả chính xác. Nêu rõ rằng hành vi khóa SQL đã được kiểm tra đơn vị thông
qua SQL và các nhánh giao dịch được phát ra nhưng việc chấp nhận SQL Server đồng thời thực sự vẫn là
một khoảng trống môi trường còn sót lại. Không yêu cầu hoàn thành toàn bộ chức năng FE11.

- [ ] **Bước 5: Cam kết bằng chứng xác thực**

```powershell
git add -- .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md TECH_DEBT.md .sdd/reviews/fe11-transactional-role-management-validation-2026-07-18.md
git commit -m "docs: record FE11 role management validation"
```

## Danh sách kiểm tra đánh giá cuối cùng

- [ ] Thiết kế bằng văn bản vẫn được con người phê duyệt và ghi lại quyết định siêu dữ liệu `DEFERRED`.
- [ ] Mọi thay đổi trong sản xuất đều được thực hiện trước một cuộc kiểm thử thất bại tập trung.
- [ ] Xác thực và ủy quyền quản trị viên chạy trước khi xác thực vai trò đầu vào.
- [ ] Quyền Quản trị viên, người dùng mục tiêu, vai trò được yêu cầu, ánh xạ mục tiêu và chủ sở hữu Quản trị viên đang hoạt động đều bị khóa và xác thực trong một giao dịch.
- [ ] Việc gán trùng lặp và sự vắng mặt của việc thu hồi sẽ trả về các lỗi xác định mà không cần kiểm tra hoặc thao tác ghi.
- [ ] Không thể thu hồi vai trò người dùng cuối cùng và Quản trị viên hoạt động cuối cùng.
- [ ] Lập bản đồ thao tác ghi và cam kết kiểm toán hoặc quay lại với nhau.
- [ ] Dịch vụ chỉ trả về thông tin đọc lại của người dùng được quản lý an toàn.
- [ ] Các kiểm thử máy chủ tập trung/đầy đủ, phạm vi bao phủ, truy vết, quét bảo mật và kiểm tra khác biệt đều vượt qua.
- [ ] `TD-013` đã đóng; `TD-014/015` được thu hẹp mà không che giấu những khoảng trống FE11 còn lại.
- [ ] Không có tệp người dùng không liên quan nào được môi trường tiền sản xuất hoặc cam kết.
