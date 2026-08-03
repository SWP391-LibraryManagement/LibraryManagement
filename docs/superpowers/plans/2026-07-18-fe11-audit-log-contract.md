# FE11 Nhật ký kiểm tra Kế hoạch thực hiện hợp đồng

> **Đối với nhân viên đại lý:** BẮT BUỘC SUB-SKILLS: Sử dụng `using-git-worktrees` cho Nhiệm vụ 0, sau đó là `executing-plans` để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Triển khai `FE11-AUD01` / `TD-024` dưới dạng ranh giới Nhật ký kiểm tra chỉ đọc, có
thể tìm kiếm, có thể đọc và thuộc quyền sở hữu của Quản trị viên với phân trang SQL đã nhập, trình
chiếu siêu dữ liệu an toàn nhận biết hành động, sử dụng giao diện người dùng chuẩn và ngừng rõ ràng
lộ trình nguyên mẫu.

**Kiến trúc:** Giữ nguyên quy trình Express `routes -> controllers -> services -> repositories` hiện
có. Kho lưu trữ sở hữu chức năng lọc theo kiểu và phân trang ổn định nhưng trả về các hàng thô;
`adminService` sở hữu phép chiếu DTO từ chối mặc định; trang Quản trị React chỉ sử dụng DTO được
chiếu đến `adminApi` và không bao giờ phân tích cú pháp siêu dữ liệu thô.

**bộ công nghệ công nghệ:** Node.js CommonJS, Express 5, trình xác thực nhanh 7, Jest 30, SQL Server
qua `mssql`, React 19, Vite 8, Trình chạy kiểm thử nút, Markdown tệp bàn giao SDD.

## Ràng buộc toàn cầu

- Việc triển khai sản phẩm bị chặn cho đến khi quản trị PR #32 (`docs/fast-track-delivery-mode`) vượt qua H3 và hợp nhất với `main`; việc lập kế hoạch và xem xét kế hoạch có thể được tiến hành trước khi hợp nhất.
- Chỉ triển khai `BR-FE11-018`, `BR-FE11-026`, `FR-FE11-033`, `AC-FE11-018`, `TD-024` và nhiệm vụ `FE11-AUD01`.
- Điểm cuối chuẩn là `GET /api/admin/audit-logs`; tên truy vấn được chấp nhận chính xác là `page`, `limit`, `q`, `action`, `actorId`, `from` và `to`.
- Mặc định là `page = 1` và `limit = 20`; `limit` bị giới hạn ở `1..100`.
- Xác thực và ủy quyền quản trị viên chạy trước khi xác thực truy vấn chi tiết.
- Thứ tự ổn định là `CreatedAt DESC, LogId DESC`; mọi hoạt động lọc và phân trang đều chạy trong SQL với các tham số `mssql` đã nhập.
- `Metadata` và `UserAgent` thô không bao giờ được trả sách. JSON không hợp lệ, mảng/giá trị vô hướng cấp cao nhất, hành động không xác định và hình dạng trường không hợp lệ tạo ra `details: {}`.
- Đường dẫn `GET /api/users/audit-logs` cũ vẫn là tuyến tĩnh rõ ràng trước `/:userId`, luôn trả về `404 NOT_FOUND` và không yêu cầu dịch vụ xác thực, quản lý người dùng hoặc kiểm tra.
- Chỉ giữ lại tham gia mục tiêu người dùng đã được phê duyệt hiện tại: các mục tiêu `USER`, `USERS` và `ACCOUNT` có thể nhận được nhãn người dùng; các loại mục tiêu khác trả về `label: null` và giao diện người dùng hiển thị loại/ID.
- Không thêm lược đồ, phần phụ thuộc, xác thực, xuất, ghi kiểm tra, cập nhật/xóa, bí danh tương thích hoặc hành vi lọc hành động ẩn.
- Giữ toàn bộ FE11 `Implementation State: DEFERRED`; lát này chỉ đóng sau H2, kiểm tra bắt buộc, H3, hợp nhất và bằng chứng tích hợp sau hợp nhất.
- Mọi thay đổi về hành vi sản xuất trước tiên phải có một kiểm thử thất bại được quan sát. Quá trình triển khai đã tạo vẫn có sẵn cho đến khi được phê duyệt H2.

---

### Nhiệm vụ 0: Xóa cổng quản trị và tạo sơ đồ công việc thực hiện

**Tệp:**
- Chỉ đọc: PR #32 và `origin/main`
- Tạo cây làm việc: `.worktrees/fe11-audit-log-implementation`
- Tạo nhánh: `fix/fe11-audit-log-contract`
- Bản sao kế hoạch được đánh giá: `docs/superpowers/plans/2026-07-18-fe11-audit-log-contract.md`

**Giao diện:**
- Tiêu thụ: cam kết kích hoạt quản trị `2d93465` và phê duyệt H3 cho PR #32.
- Tạo ra: một cây công việc Builder riêng biệt dựa trên `main` được kích hoạt chính thức.

- [ ] **Bước 1: Xác minh PR #32 đã hợp nhất sau H3**

```powershell
$pr = gh pr view 32 --json state,isDraft,mergeCommit,statusCheckRollup,mergeable,url | ConvertFrom-Json
if ($pr.state -ne 'MERGED') { throw 'PR #32 must receive H3 and merge before TD-024 product implementation.' }
if (-not $pr.mergeCommit.oid) { throw 'PR #32 merge commit is missing.' }
```

Dự kiến: `state` là `MERGED`, kiểm tra bắt buộc chính xác đã thành công và tồn tại một cam kết hợp
nhất. Nếu PR vẫn mở thì dừng ở cổng H3; không tạo ra những thay đổi về mã sản phẩm.

- [ ] **Bước 2: Làm mới cơ sở có thẩm quyền và xác nhận nguồn gốc kích hoạt**

```powershell
git fetch origin main
git merge-base --is-ancestor 2d93465 origin/main
if ($LASTEXITCODE -ne 0) { throw 'Fast-Track activation commit is not present on origin/main.' }
```

Dự kiến: lệnh tổ tiên thoát khỏi `0`.

- [ ] **Bước 3: Tạo sơ đồ triển khai riêng biệt**

Từ kho lưu trữ gốc:

```powershell
git worktree add .worktrees/fe11-audit-log-implementation -b fix/fe11-audit-log-contract origin/main
```

Dự kiến: cây làm việc mới nằm trên `fix/fe11-audit-log-contract`, dựa trên trạng thái kích hoạt đã
hợp nhất và `git status --short` trống.

- [ ] **Bước 4: Chuyển kế hoạch đã rà soát vào bộ phận thực hiện**

```powershell
Copy-Item -LiteralPath `
  '.worktrees/fe11-audit-log-plan/docs/superpowers/plans/2026-07-18-fe11-audit-log-contract.md' `
  -Destination '.worktrees/fe11-audit-log-implementation/docs/superpowers/plans/2026-07-18-fe11-audit-log-contract.md'
```

Dự kiến: chỉ có kế hoạch được xem xét là không bị theo dõi. Không cam kết nó hoặc bất kỳ triển khai
nào được tạo trước H2.

---

### Nhiệm vụ 1: Khóa lộ trình quản trị chuẩn và gỡ bỏ lộ trình kế thừa

**Tệp:**
- Tạo: `backend/src/validators/adminValidators.js`
- Tạo: `backend/tests/adminAuditLogRoutes.test.js`
- Sửa đổi: `backend/src/routes/adminRoutes.js`
- Sửa đổi: `backend/src/controllers/adminController.js`
- Sửa đổi: `backend/src/routes/userManagementRoutes.js`
- Sửa đổi: `backend/src/controllers/userManagementController.js`
- Sửa đổi: `backend/tests/userManagementRoutes.test.js`

**Giao diện:**
- Sản xuất: `isDateOnly(value)`, `validateAuditDateRange(value, { req })`, `assignValidatedAuditQuery(req, res, next)`, `auditLogQueryValidators` và `controller.listAuditLogs(req, res, next)`.
- Tạo ra: đầu vào dịch vụ chuẩn hóa `{ page, limit, q?, action?, actorId?, from?, to? }` với các trường tùy chọn trống bị bỏ qua.
- Ngừng hoạt động: `userManagementController.listAuditLogs` và đường dẫn dịch vụ `/api/users/audit-logs` chức năng.

- [ ] **Bước 1: Viết các kiểm thử lộ trình chuẩn không thành công**

Tạo `backend/tests/adminAuditLogRoutes.test.js` với dây nịt này trước các thùng máy:

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
    adminService: adminService || { listAuditLogs: jest.fn() },
    userManagementService: {},
  });
}
```

Bao gồm các trường hợp chính xác:

```js
test('GET /api/admin/audit-logs requires authentication', async () => {
  const response = await request(makeApp()).get('/api/admin/audit-logs?page=0');

  expect(response.status).toBe(401);
  expect(response.body.error.code).toBe('UNAUTHORIZED');
});

test('GET /api/admin/audit-logs authorizes before validating query details', async () => {
  const adminService = { listAuditLogs: jest.fn() };
  const response = await request(makeApp({ roles: ['MEMBER'], adminService }))
    .get('/api/admin/audit-logs?page=0')
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(403);
  expect(response.body.error.code).toBe('ROLE_REQUIRED');
  expect(adminService.listAuditLogs).not.toHaveBeenCalled();
});

test('GET /api/admin/audit-logs sends the normalized canonical query to the service', async () => {
  const payload = {
    data: [],
    pagination: { page: 2, limit: 50, total: 0, totalPages: 0 },
  };
  const adminService = { listAuditLogs: jest.fn(async () => payload) };
  const response = await request(makeApp({ adminService }))
    .get('/api/admin/audit-logs?page=2&limit=50&q=%20login%20&action=%20AUTH_LOGIN_SUCCESS%20&actorId=7&from=2026-07-01&to=2026-07-18')
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(200);
  expect(adminService.listAuditLogs).toHaveBeenCalledWith({
    page: 2,
    limit: 50,
    q: 'login',
    action: 'AUTH_LOGIN_SUCCESS',
    actorId: 7,
    from: '2026-07-01',
    to: '2026-07-18',
  });
  expect(response.body).toEqual(payload);
});
```

Thêm khối xác thực theo bảng này:

```js
test.each([
  ['/api/admin/audit-logs?page=0', 'page'],
  ['/api/admin/audit-logs?page=1.5', 'page'],
  ['/api/admin/audit-logs?limit=0', 'limit'],
  ['/api/admin/audit-logs?limit=101', 'limit'],
  ['/api/admin/audit-logs?q=%20%20', 'q'],
  [`/api/admin/audit-logs?q=${'x'.repeat(101)}`, 'q'],
  ['/api/admin/audit-logs?action=%20%20', 'action'],
  [`/api/admin/audit-logs?action=${'x'.repeat(101)}`, 'action'],
  ['/api/admin/audit-logs?actorId=0', 'actorId'],
  ['/api/admin/audit-logs?actorId=1.5', 'actorId'],
  ['/api/admin/audit-logs?from=2026-02-30', 'from'],
  ['/api/admin/audit-logs?to=18-07-2026', 'to'],
  ['/api/admin/audit-logs?from=2026-07-19&to=2026-07-18', 'to'],
])('rejects invalid audit query %s', async (url, field) => {
  const adminService = { listAuditLogs: jest.fn() };
  const response = await request(makeApp({ adminService }))
    .get(url)
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
  expect(response.body.error.details).toEqual(
    expect.arrayContaining([expect.objectContaining({ field })])
  );
  expect(adminService.listAuditLogs).not.toHaveBeenCalled();
});
```

- [ ] **Bước 2: Viết các kiểm thử hưu trí kế thừa thất bại**

Cập nhật `backend/tests/userManagementRoutes.test.js`:

```js
test('GET /api/users/audit-logs is retired with NOT_FOUND and invokes no service', async () => {
  const userManagementService = {
    listAuditLogs: jest.fn(),
    getUser: jest.fn(),
  };
  const response = await request(makeApp({ userManagementService }))
    .get('/api/users/audit-logs');

  expect(response.status).toBe(404);
  expect(response.body.error.code).toBe('NOT_FOUND');
  expect(userManagementService.listAuditLogs).not.toHaveBeenCalled();
  expect(userManagementService.getUser).not.toHaveBeenCalled();
});
```

Xóa các kiểm thử ủy quyền thành công của Quản trị viên và không phải của Quản trị viên cũ cho điểm
cuối chức năng cũ. Đường dẫn đã ngừng hoạt động phải trả về cùng một `404 NOT_FOUND` không có mã
thông báo và có bất kỳ mã thông báo nào vì nó không còn là tài nguyên được xác thực.

- [ ] **Bước 3: Chạy kiểm thử lộ trình RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminAuditLogRoutes.test.js tests/userManagementRoutes.test.js
```

Dự kiến: THẤT BẠI vì `adminValidators.js`, `/admin/audit-logs` và `adminController.listAuditLogs`
không tồn tại và đường dẫn cũ vẫn gọi trình xử lý nguyên mẫu.

- [ ] **Bước 4: Triển khai ranh giới truy vấn chuẩn**

Tạo `backend/src/validators/adminValidators.js` với các bản xuất sau:

```js
const { matchedData, query } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');

function isDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateAuditDateRange(value, { req }) {
  const from = req.query.from;
  if (!from || from <= value) return true;
  throw new Error('From date must be before or equal to to date.');
}

function assignValidatedAuditQuery(req, res, next) {
  const data = matchedData(req, { locations: ['query'] });
  req.validatedAuditQuery = {
    page: data.page ?? 1,
    limit: data.limit ?? 20,
    ...(data.q ? { q: data.q } : {}),
    ...(data.action ? { action: data.action } : {}),
    ...(data.actorId ? { actorId: data.actorId } : {}),
    ...(data.from ? { from: data.from } : {}),
    ...(data.to ? { to: data.to } : {}),
  };
  return next();
}
```

Xác định phần còn lại của tệp chính xác như sau:

```js
const auditLogQueryValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100.')
    .toInt(),
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search must be between 1 and 100 characters.'),
  query('action')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Action must be between 1 and 100 characters.'),
  query('actorId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Actor ID must be a positive integer.')
    .toInt(),
  query('from')
    .optional()
    .custom(isDateOnly)
    .withMessage('From date must use YYYY-MM-DD.'),
  query('to')
    .optional()
    .custom(isDateOnly)
    .withMessage('To date must use YYYY-MM-DD.')
    .bail()
    .custom(validateAuditDateRange),
  handleValidationErrors,
  assignValidatedAuditQuery,
];

module.exports = {
  isDateOnly,
  validateAuditDateRange,
  assignValidatedAuditQuery,
  auditLogQueryValidators,
};
```

Nối tuyến đường sau phần mềm trung gian của Quản trị viên:

```js
// @spec FR-FE11-033
router.get(
  '/audit-logs',
  ...requireAdmin,
  auditLogQueryValidators,
  controller.listAuditLogs
);
```

Thêm phương thức điều khiển:

```js
listAuditLogs: async (req, res, next) => {
  try {
    return res.status(200).json(
      await service.listAuditLogs(req.validatedAuditQuery || req.query)
    );
  } catch (error) {
    return next(error);
  }
},
```

- [ ] **Bước 5: Thực hiện việc ngừng hoạt động kế thừa rõ ràng**

Trong `backend/src/routes/userManagementRoutes.js`, nhập `safeErrors` và giữ tuyến tĩnh này trước
`/:userId` mà không có `requireAdmin`:

```js
router.get('/audit-logs', (req, res, next) => (
  next(errors.notFound('NOT_FOUND', 'Resource not found.'))
));
```

Xóa `listAuditLogs` khỏi `userManagementController`. Không chuyển hướng hoặc đặt bí danh cho đường
dẫn đã ngừng hoạt động.

- [ ] **Bước 6: Chạy kiểm thử lộ trình GREEN**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminAuditLogRoutes.test.js tests/userManagementRoutes.test.js
```

Dự kiến: cả hai dãy ĐẠT; Các yêu cầu không được xác thực và không phải của Quản trị viên sẽ bị từ
chối trước khi xác thực, đầu vào hợp lệ được chuẩn hóa, đầu vào không hợp lệ trả về
`VALIDATION_ERROR` và tuyến đường cũ trả về `NOT_FOUND` mà không cần gọi dịch vụ.

---

### Nhiệm vụ 2: Triển khai phân trang SQL được lọc theo kiểu

**Tệp:**
- Tạo: `backend/tests/auditLogRepository.test.js`
- Sửa đổi: `backend/src/repositories/auditLogRepository.js`

**Giao diện:**
- Thay thế: `listRecent({ page, limit })`.
- Tạo ra: `listAuditLogs({ page, limit, q, action, actorId, from, to })` trả về các trường hàng thô cộng với `{ page, limit, total, totalPages }`.
- Giữ nguyên: `create(...)` không thay đổi đối với tất cả người viết kiểm tra.

- [ ] **Bước 1: Viết các kiểm thử kho lưu trữ không thành công**

Tạo `backend/tests/auditLogRepository.test.js` với khai thác cơ sở dữ liệu này:

```js
jest.mock('../src/config/db', () => ({
  sql: {
    Date: 'Date',
    Int: 'Int',
    MAX: 'MAX',
    NVarChar: (size) => `NVarChar(${size})`,
  },
  getPool: jest.fn(),
}));

const { getPool } = require('../src/config/db');
const auditLogRepository = require('../src/repositories/auditLogRepository');

function useRecordsets(recordsets) {
  const capture = { inputs: {}, query: '' };
  getPool.mockResolvedValue({
    request() {
      return {
        input(name, type, value) {
          capture.inputs[name] = { type, value };
          return this;
        },
        async query(statement) {
          capture.query = statement;
          return { recordsets };
        },
      };
    },
  });
  return capture;
}

beforeEach(() => getPool.mockReset());
```

Bìa:

```js
test('listAuditLogs binds typed pagination and every supplied filter', async () => {
  const capture = useRecordsets([[], [{ Total: 0 }]]);

  await auditLogRepository.listAuditLogs({
    page: 2,
    limit: 20,
    q: 'login',
    action: 'AUTH_LOGIN_SUCCESS',
    actorId: 7,
    from: '2026-07-01',
    to: '2026-07-18',
  });

  expect(capture.inputs).toMatchObject({
    Offset: { type: 'Int', value: 20 },
    Limit: { type: 'Int', value: 20 },
    Search: { type: 'NVarChar(202)', value: '%login%' },
    Action: { type: 'NVarChar(100)', value: 'AUTH_LOGIN_SUCCESS' },
    ActorId: { type: 'Int', value: 7 },
    FromDate: { type: 'Date', value: '2026-07-01' },
    ToDate: { type: 'Date', value: '2026-07-18' },
  });
});
```

Thêm các trường hợp xác nhận và ánh xạ chính xác sau:

```js
test('listAuditLogs escapes LIKE metacharacters and keeps request text out of SQL', async () => {
  const capture = useRecordsets([[], [{ Total: 0 }]]);

  await auditLogRepository.listAuditLogs({ page: 1, limit: 20, q: '50%_[' });

  expect(capture.inputs.Search.value).toBe(String.raw`%50\%\_\[%`);
  expect(capture.query).toContain("LIKE LOWER(@Search) ESCAPE '\\'");
  expect(capture.query).not.toContain('50%_[x]');
});

test('listAuditLogs applies one filter scope to data and count with stable order', async () => {
  const capture = useRecordsets([[], [{ Total: 21 }]]);

  const result = await auditLogRepository.listAuditLogs({
    page: 2,
    limit: 20,
    q: 'login',
    action: 'AUTH_LOGIN_SUCCESS',
    actorId: 7,
    from: '2026-07-01',
    to: '2026-07-18',
  });

  expect(capture.query.match(/al\.Action = @Action/g)).toHaveLength(2);
  expect(capture.query.match(/al\.UserId = @ActorId/g)).toHaveLength(2);
  expect(capture.query.match(/al\.CreatedAt >= @FromDate/g)).toHaveLength(2);
  expect(capture.query.match(/al\.CreatedAt < DATEADD\(DAY, 1, @ToDate\)/g)).toHaveLength(2);
  expect(capture.query).toContain('LOWER(al.Action) LIKE LOWER(@Search)');
  expect(capture.query).toContain("LOWER(COALESCE(actor.Email, '')) LIKE LOWER(@Search)");
  expect(capture.query).toContain("LOWER(COALESCE(actorProfile.FullName, '')) LIKE LOWER(@Search)");
  expect(capture.query).toContain("LOWER(COALESCE(al.TargetType, '')) LIKE LOWER(@Search)");
  expect(capture.query).toContain('CONVERT(NVARCHAR(20), al.TargetId) LIKE @Search');
  expect(capture.query).toContain('ORDER BY al.CreatedAt DESC, al.LogId DESC');
  expect(capture.query).toContain("IN ('USER', 'USERS', 'ACCOUNT')");
  expect(result.pagination).toEqual({ page: 2, limit: 20, total: 21, totalPages: 2 });
});

test('listAuditLogs maps raw rows and keeps metadata inside the repository boundary', async () => {
  const createdAt = new Date('2026-07-18T10:00:00.000Z');
  useRecordsets([[
    {
      LogId: 10,
      UserId: 7,
      ActorEmail: 'admin@example.test',
      ActorName: 'Admin User',
      Action: 'USER_ROLE_ASSIGN',
      TargetType: 'USER',
      TargetId: 15,
      TargetEmail: 'member@example.test',
      TargetName: 'Member User',
      Metadata: '{"roleId":2,"roleName":"LIBRARIAN"}',
      IpAddress: '203.0.113.10',
      CreatedAt: createdAt,
    },
  ], [{ Total: 1 }]]);

  const result = await auditLogRepository.listAuditLogs({ page: 1, limit: 20 });

  expect(result.data[0]).toEqual({
    logId: 10,
    userId: 7,
    actorEmail: 'admin@example.test',
    actorName: 'Admin User',
    action: 'USER_ROLE_ASSIGN',
    targetType: 'USER',
    targetId: 15,
    targetEmail: 'member@example.test',
    targetName: 'Member User',
    metadata: '{"roleId":2,"roleName":"LIBRARIAN"}',
    ipAddress: '203.0.113.10',
    createdAt,
  });
  expect(result.pagination.totalPages).toBe(1);
});

test('listAuditLogs reports zero pages for an empty result', async () => {
  useRecordsets([[], [{ Total: 0 }]]);

  await expect(auditLogRepository.listAuditLogs({ page: 1, limit: 20 })).resolves.toMatchObject({
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  });
});
```

Những trường hợp này chứng minh:

- mỗi bộ lọc hoạt động độc lập và tất cả các bộ lọc kết hợp với `AND`;
- `q` tìm kiếm hành động, email tác nhân, tên đầy đủ của tác nhân, loại mục tiêu và văn bản ID mục tiêu;
- các câu lệnh dữ liệu và số lượng chứa cùng một đoạn `WHERE` được tạo;
- đơn hàng chính xác là `ORDER BY al.CreatedAt DESC, al.LogId DESC`;
- sự tham gia của người dùng mục tiêu bị giới hạn ở `USER`, `USERS` và `ACCOUNT`;
- Siêu ký tự LIKE được thoát và văn bản yêu cầu không bao giờ xuất hiện theo nghĩa đen trong SQL;
- tổng `0` mang lại `totalPages: 0`, trong khi các tổng khác 0 sử dụng `Math.ceil(total / limit)`;
- các hàng được trả về vẫn là các hàng kho lưu trữ thô và vẫn chứa `metadata` để chiếu chỉ dành cho dịch vụ.

- [ ] **Bước 2: Chạy kiểm thử RED của kho lưu trữ**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/auditLogRepository.test.js
```

Dự kiến: THẤT BẠI vì chỉ tồn tại `listRecent` và thiếu bộ lọc chuẩn, thông tin nhập ngày tháng,
`WHERE` được chia sẻ và tổng số trang bằng 0.

- [ ] **Bước 3: Triển khai `listAuditLogs`**

Giữ `create(...)` không thay đổi. Thêm trình trợ giúp này và thay thế `listRecent` bằng cấu trúc
`listAuditLogs` sau:

```js
function escapeLikePattern(value) {
  return String(value).replace(/[\\%_\[]/g, (character) => `\\${character}`);
}

// @spec FR-FE11-033
async function listAuditLogs({
  page = 1,
  limit = 20,
  q,
  action,
  actorId,
  from,
  to,
} = {}) {
  const offset = (page - 1) * limit;
  const clauses = ['1 = 1'];

  if (q) clauses.push(`(
    LOWER(al.Action) LIKE LOWER(@Search) ESCAPE '\\'
    OR LOWER(COALESCE(actor.Email, '')) LIKE LOWER(@Search) ESCAPE '\\'
    OR LOWER(COALESCE(actorProfile.FullName, '')) LIKE LOWER(@Search) ESCAPE '\\'
    OR LOWER(COALESCE(al.TargetType, '')) LIKE LOWER(@Search) ESCAPE '\\'
    OR CONVERT(NVARCHAR(20), al.TargetId) LIKE @Search ESCAPE '\\'
  )`);
  if (action) clauses.push('al.Action = @Action');
  if (actorId) clauses.push('al.UserId = @ActorId');
  if (from) clauses.push('al.CreatedAt >= @FromDate');
  if (to) clauses.push('al.CreatedAt < DATEADD(DAY, 1, @ToDate)');

  const whereSql = clauses.join('\n        AND ');
  const request = (await getPool()).request()
    .input('Offset', sql.Int, offset)
    .input('Limit', sql.Int, limit);

  if (q) request.input('Search', sql.NVarChar(202), `%${escapeLikePattern(q)}%`);
  if (action) request.input('Action', sql.NVarChar(100), action);
  if (actorId) request.input('ActorId', sql.Int, actorId);
  if (from) request.input('FromDate', sql.Date, from);
  if (to) request.input('ToDate', sql.Date, to);

  const result = await request.query(`
    SELECT
      al.LogId,
      al.UserId,
      actor.Email AS ActorEmail,
      actorProfile.FullName AS ActorName,
      al.Action,
      al.TargetType,
      al.TargetId,
      target.Email AS TargetEmail,
      targetProfile.FullName AS TargetName,
      al.Metadata,
      al.IpAddress,
      al.CreatedAt
    FROM AuditLogs al
    LEFT JOIN Users actor ON al.UserId = actor.UserId
    LEFT JOIN UserProfiles actorProfile ON actor.UserId = actorProfile.UserId
    LEFT JOIN Users target
      ON al.TargetId = target.UserId
      AND UPPER(COALESCE(al.TargetType, '')) IN ('USER', 'USERS', 'ACCOUNT')
    LEFT JOIN UserProfiles targetProfile ON target.UserId = targetProfile.UserId
    WHERE ${whereSql}
    ORDER BY al.CreatedAt DESC, al.LogId DESC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;

    SELECT COUNT_BIG(*) AS Total
    FROM AuditLogs al
    LEFT JOIN Users actor ON al.UserId = actor.UserId
    LEFT JOIN UserProfiles actorProfile ON actor.UserId = actorProfile.UserId
    WHERE ${whereSql};
  `);

  const data = result.recordsets[0].map((row) => ({
    logId: row.LogId,
    userId: row.UserId,
    actorEmail: row.ActorEmail,
    actorName: row.ActorName,
    action: row.Action,
    targetType: row.TargetType,
    targetId: row.TargetId,
    targetEmail: row.TargetEmail,
    targetName: row.TargetName,
    metadata: row.Metadata,
    ipAddress: row.IpAddress,
    createdAt: row.CreatedAt,
  }));
  const total = Number(result.recordsets[1]?.[0]?.Total || 0);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}
```

Xuất `create` và `listAuditLogs`; không xuất `escapeLikePattern`. `whereSql` cố định được sử dụng
bởi cả hai câu lệnh SELECT.

- [ ] **Bước 4: Chạy kiểm thử GREEN của kho lưu trữ**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/auditLogRepository.test.js
```

Dự kiến: đạt với chức năng chụp tham số đã nhập, phạm vi bộ lọc giống hệt nhau trong truy vấn dữ
liệu/số lượng, thứ tự ổn định, liên kết mục tiêu bị hạn chế và phân trang tổng bằng 0 chính xác.

---

### Nhiệm vụ 3: Thêm máy chiếu từ chối mặc định nhận biết hành động

**Tệp:**
- Tạo: `backend/tests/adminAuditLogService.test.js`
- Sửa đổi: `backend/src/services/adminService.js`
- Sửa đổi: `backend/src/services/userManagementService.js`
- Sửa đổi: `backend/tests/userManagementService.test.js`

**Giao diện:**
- Sản xuất: `parseMetadataObject(rawMetadata)`, `projectAuditDetails(action, metadata)`, `projectAuditLog(row)` và `listAuditLogs(query = {})` trong `adminService`.
- Tạo ra các trợ giúp: `readPositiveInteger`, `readNonNegativeNumber`, `readIsoDate`, `readPositiveIntegerArray`, `readChangedFields`, `hasProvidedText` và `stripSensitiveKeys`.
- Loại bỏ: `userManagementService.listAuditLogs` và các bản mô phỏng/kiểm tra `listRecent` lỗi thời.

- [ ] **Bước 1: Viết kiểm thử dự báo dịch vụ không thành công**

Tạo `backend/tests/adminAuditLogService.test.js` với nhà máy sản xuất đường may và hàng này:

```js
jest.mock('../src/repositories/auditLogRepository', () => ({
  create: jest.fn(),
  listAuditLogs: jest.fn(),
}));

const auditLogRepository = require('../src/repositories/auditLogRepository');
const adminService = require('../src/services/adminService');

function rawRow(action, metadata, overrides = {}) {
  return {
    logId: 10,
    userId: 7,
    actorEmail: 'admin@example.test',
    actorName: 'Admin User',
    action,
    targetType: 'USER',
    targetId: 15,
    targetEmail: 'member@example.test',
    targetName: 'Member User',
    metadata: JSON.stringify(metadata),
    ipAddress: '203.0.113.10',
    createdAt: new Date('2026-07-18T10:00:00.000Z'),
    userAgent: 'must-not-leak',
    ...overrides,
  };
}

async function project(action, metadata, overrides) {
  auditLogRepository.listAuditLogs.mockResolvedValue({
    data: [rawRow(action, metadata, overrides)],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  });
  const result = await adminService.listAuditLogs({});
  return result.data[0];
}

beforeEach(() => auditLogRepository.listAuditLogs.mockReset());
```

Khẳng định đầu ra chuẩn:

```js
test('listAuditLogs applies defaults and returns only the canonical DTO', async () => {
  auditLogRepository.listAuditLogs.mockResolvedValue({
    data: [rawRow('USER_ROLE_ASSIGN', { roleId: 2, roleName: 'LIBRARIAN' })],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  });

  const result = await adminService.listAuditLogs({});

  expect(auditLogRepository.listAuditLogs).toHaveBeenCalledWith({
    page: 1,
    limit: 20,
    q: undefined,
    action: undefined,
    actorId: undefined,
    from: undefined,
    to: undefined,
  });
  expect(result.data[0]).toEqual({
    logId: 10,
    action: 'USER_ROLE_ASSIGN',
    actor: { userId: 7, email: 'admin@example.test', fullName: 'Admin User' },
    target: { type: 'USER', id: 15, label: 'member@example.test' },
    details: { roleId: 2, roleName: 'LIBRARIAN' },
    ipAddress: '203.0.113.10',
    createdAt: new Date('2026-07-18T10:00:00.000Z'),
  });
  expect(result.data[0]).not.toHaveProperty('metadata');
  expect(result.data[0]).not.toHaveProperty('userAgent');
});

test('non-user targets never borrow a user label', async () => {
  const row = await project('FINE_CALCULATE', {
    borrowDetailId: 4,
    memberId: 9,
    overdueDays: 2,
    amount: 10000,
  }, {
    targetType: 'FINE',
    targetId: 15,
    targetEmail: 'wrong-user@example.test',
    targetName: 'Wrong User',
  });

  expect(row.target).toEqual({ type: 'FINE', id: 15, label: null });
});
```

Thêm ma trận máy chiếu đã được phê duyệt này. Mỗi hàng là một vật cố định có thể thực thi được; các
hành động trong cùng một mảng `actions` có chung hợp đồng máy chiếu:

```js
const projectorCases = [
  { actions: ['USER_CREATE'], metadata: { roleName: 'MEMBER', email: 'omit@example.test' }, expected: { roleName: 'MEMBER' } },
  { actions: ['USER_UPDATE'], metadata: { fields: ['email', 'fullName', 'passwordHash'] }, expected: { changedFields: ['email', 'fullName'] } },
  { actions: ['USER_DEACTIVATE'], metadata: { status: 'INACTIVE' }, expected: { newStatus: 'INACTIVE' } },
  { actions: ['USER_ROLE_ASSIGN', 'USER_ROLE_REVOKE'], metadata: { roleId: 2, roleName: 'LIBRARIAN' }, expected: { roleId: 2, roleName: 'LIBRARIAN' } },
  { actions: ['BORROW_REQUEST_CREATE'], metadata: { copyIds: [1, 2] }, expected: { copyIds: [1, 2] } },
  { actions: ['BORROW_REQUEST_APPROVE'], metadata: { approvedMemberId: 9, copyIds: [1, 2], notes: 'omit' }, expected: { memberUserId: 9, copyIds: [1, 2], notesProvided: true } },
  { actions: ['BORROW_REQUEST_REJECT'], metadata: { rejectedMemberId: 9, reason: 'omit' }, expected: { memberUserId: 9, reasonProvided: true } },
  { actions: ['BORROW_DETAIL_RETURN'], metadata: { requestId: 3, memberId: 9, copyId: 1, condition: 'NORMAL', overdueDays: 0, notes: null }, expected: { requestId: 3, memberId: 9, copyId: 1, condition: 'NORMAL', overdueDays: 0, notesProvided: false } },
  { actions: ['BORROW_DETAIL_RENEW'], metadata: { requestId: 3, memberId: 9, copyId: 1, newDueDate: '2026-08-01T00:00:00.000Z', notes: 'ok' }, expected: { requestId: 3, memberId: 9, copyId: 1, newDueDate: '2026-08-01T00:00:00.000Z', notesProvided: true } },
  { actions: ['RESERVATION_FULFILL'], metadata: { requestId: 3, copyId: 1, memberUserId: 9 }, expected: { requestId: 3, copyId: 1, memberUserId: 9 } },
  { actions: ['RESERVATION_CREATE', 'RESERVATION_EXPIRE'], metadata: { copyId: 1 }, expected: { copyId: 1 } },
  { actions: ['RESERVATION_CANCEL'], metadata: { copyId: 1, reason: 'omit' }, expected: { copyId: 1, reasonProvided: true } },
  { actions: ['RESERVATION_NOTIFY_FAILED'], metadata: { code: 'NOTIFICATION_REQUEST_FAILED', message: 'omit' }, expected: { code: 'NOTIFICATION_REQUEST_FAILED' } },
  { actions: ['RESERVATION_PROCESS'], metadata: { copyId: 1, selectedUserId: 9, expiresAt: '2026-07-20T00:00:00.000Z' }, expected: { copyId: 1, selectedUserId: 9, expiresAt: '2026-07-20T00:00:00.000Z' } },
  { actions: ['FINE_CALCULATE'], metadata: { borrowDetailId: 4, memberId: 9, overdueDays: 2, amount: 10000 }, expected: { borrowDetailId: 4, memberId: 9, overdueDays: 2, amount: 10000 } },
  { actions: ['FINE_COLLECT'], metadata: { collectedAmount: 5000, fullyCollected: false, note: 'omit' }, expected: { collectedAmount: 5000, fullyCollected: false, noteProvided: true } },
  { actions: ['FINE_MARK_PAID'], metadata: { amount: 10000, note: null }, expected: { amount: 10000, noteProvided: false } },
  { actions: ['FINE_WAIVE', 'FINE_CANCEL'], metadata: { reason: 'omit' }, expected: { reasonProvided: true } },
  { actions: ['BOOK_COPY_CREATE'], metadata: { bookId: 3, barcode: 'BC-1', status: 'AVAILABLE', location: 'A1' }, expected: { bookId: 3, barcode: 'BC-1', status: 'AVAILABLE', location: 'A1' } },
  { actions: ['BOOK_COPY_UPDATE'], metadata: { before: { bookId: 3, status: 'AVAILABLE', title: 'omit', isbn: 'omit' }, patch: { location: 'B2', status: 'DAMAGED' } }, expected: { bookId: 3, changedFields: ['location', 'status'], previousStatus: 'AVAILABLE', newStatus: 'DAMAGED' } },
  { actions: ['BOOK_COPY_STATUS_UPDATE'], metadata: { oldStatus: 'AVAILABLE', newStatus: 'DAMAGED', reason: 'omit' }, expected: { previousStatus: 'AVAILABLE', newStatus: 'DAMAGED', reasonProvided: true } },
  { actions: ['BOOK_COPY_DEACTIVATE'], metadata: { oldStatus: 'AVAILABLE', newStatus: 'INACTIVE' }, expected: { previousStatus: 'AVAILABLE', newStatus: 'INACTIVE' } },
  { actions: ['MEMBERSHIP_APPLICATION_SUBMITTED', 'MEMBERSHIP_APPLICATION_APPROVED'], metadata: { userId: 9, status: 'APPROVED' }, expected: { userId: 9, status: 'APPROVED' } },
  { actions: ['MEMBERSHIP_APPLICATION_REJECTED'], metadata: { userId: 9, status: 'REJECTED', reason: 'omit' }, expected: { userId: 9, status: 'REJECTED', reasonProvided: true } },
  { actions: ['PROFILE_UPDATE'], metadata: { fields: ['fullName', 'phone', 'passwordHash'] }, expected: { changedFields: ['fullName', 'phone'] } },
  { actions: ['REPORT_ACCESS_DENIED'], metadata: { code: 'ROLE_REQUIRED', statusCode: 403, method: 'GET', path: '/api/reports/users' }, expected: { code: 'ROLE_REQUIRED', statusCode: 403, method: 'GET', reportType: 'USERS' } },
  { actions: ['NOTIFICATION_REQUEST_CREATE'], metadata: { type: 'DUE_DATE_REMINDER', channel: 'EMAIL', sourceFeature: 'FE07', sourceEntityType: 'BorrowRequest', sourceEntityId: 3 }, expected: { type: 'DUE_DATE_REMINDER', channel: 'EMAIL', sourceFeature: 'FE07', sourceEntityType: 'BorrowRequest', sourceEntityId: 3 } },
  { actions: ['NOTIFICATION_RETRY'], metadata: { fromStatus: 'FAILED', toStatus: 'PENDING' }, expected: { previousStatus: 'FAILED', newStatus: 'PENDING' } },
  { actions: ['NOTIFICATION_PROCESS_PENDING'], metadata: { processed: 4, failed: 1 }, expected: { processed: 4, failed: 1 } },
];

for (const fixture of projectorCases) {
  for (const action of fixture.actions) {
    test(`${action} returns only its approved detail fields`, async () => {
      await expect(project(action, fixture.metadata)).resolves.toMatchObject({
        details: fixture.expected,
      });
    });

    test(`${action} ignores hostile extra keys`, async () => {
      const hostile = {
        ...fixture.metadata,
        passwordHash: 'forbidden',
        tokenId: 88,
        nested: { sessionSecret: 'forbidden' },
      };
      const row = await project(action, hostile);
      expect(row.details).toEqual(fixture.expected);
      expect(JSON.stringify(row.details)).not.toContain('forbidden');
    });

    test(`${action} fails closed for a malformed required field`, async () => {
      const [requiredKey] = Object.keys(fixture.metadata);
      const malformed = { ...fixture.metadata, [requiredKey]: { invalid: true } };
      await expect(project(action, malformed)).resolves.toMatchObject({ details: {} });
    });
  }
}
```

Thêm các kiểm thử xuất phát/trống/từ chối mặc định này:

```js
const emptyDetailActions = [
  'AUTH_PASSWORD_CHANGE_FAILURE', 'AUTH_VERIFY_EMAIL', 'AUTH_LOGIN_LOCKED',
  'AUTH_ACCOUNT_AUTO_UNLOCKED', 'AUTH_LOGIN_INACTIVE', 'AUTH_LOGIN_FAILURE',
  'AUTH_LOGIN_SUCCESS', 'AUTH_REFRESH_TOKEN', 'AUTH_LOGOUT',
  'AUTH_PASSWORD_CHANGE_SUCCESS', 'AUTH_CHANGE_PASSWORD_OTP_REQUESTED',
  'AUTH_PASSWORD_RESET_SUCCESS', 'AUTH_REGISTER', 'AUTH_RESEND_VERIFICATION',
  'AUTH_PASSWORD_RESET_REQUEST', 'AUTH_LOGIN_ATTEMPT',
  'AUTH_ACCOUNT_SETUP_COMPLETE', 'USER_ACCOUNT_SETUP_RESEND',
];

test.each(emptyDetailActions)('%s always returns empty details', async (action) => {
  await expect(project(action, { tokenId: 99, email: 'omit@example.test' }))
    .resolves.toMatchObject({ details: {} });
});

test.each([
  ['REPORT_BORROWING_VIEW', 'BORROWING'],
  ['REPORT_INVENTORY_VIEW', 'INVENTORY'],
  ['REPORT_USERS_VIEW', 'USERS'],
])('%s derives reportType without exposing metadata', async (action, reportType) => {
  await expect(project(action, {})).resolves.toMatchObject({ details: { reportType } });
});

test.each(['{', '[]', '"scalar"', 'null'])('invalid metadata %s returns empty details', async (metadata) => {
  const row = await project('USER_ROLE_ASSIGN', {}, { metadata });
  expect(row.details).toEqual({});
});

test('unknown actions return empty details', async () => {
  await expect(project('UNKNOWN_ACTION', { passwordHash: 'forbidden' }))
    .resolves.toMatchObject({ details: {} });
});

test('AuthToken notification sources omit the credential identifier', async () => {
  const row = await project('NOTIFICATION_REQUEST_CREATE', {
    type: 'ACCOUNT_SETUP',
    channel: 'EMAIL',
    sourceFeature: 'FE11',
    sourceEntityType: 'AuthToken',
    sourceEntityId: 99,
  });
  expect(row.details).toEqual({
    type: 'ACCOUNT_SETUP',
    channel: 'EMAIL',
    sourceFeature: 'FE11',
    sourceEntityType: 'AuthToken',
  });
});

test('invalid IDs, numbers, dates, arrays, and nested allowed values fail closed', async () => {
  await expect(project('USER_ROLE_ASSIGN', { roleId: 0, roleName: 'ADMIN' }))
    .resolves.toMatchObject({ details: {} });
  await expect(project('FINE_CALCULATE', { borrowDetailId: 1, memberId: 2, overdueDays: -1, amount: Infinity }))
    .resolves.toMatchObject({ details: {} });
  await expect(project('BORROW_DETAIL_RENEW', { requestId: 1, memberId: 2, copyId: 3, newDueDate: 'not-a-date', notes: null }))
    .resolves.toMatchObject({ details: {} });
  await expect(project('BORROW_REQUEST_CREATE', { copyIds: [1, { token: 'nested' }] }))
    .resolves.toMatchObject({ details: {} });
});

test('projected arrays are capped at 100 values', async () => {
  const row = await project('BORROW_REQUEST_CREATE', {
    copyIds: Array.from({ length: 120 }, (_, index) => index + 1),
  });
  expect(row.details.copyIds).toHaveLength(100);
});
```

Các kiểm thử này cùng nhau khẳng định:

- JSON không đúng định dạng, mảng, đại lượng vô hướng và hành động không xác định trả về `{}`;
- mảng được giới hạn ở 100 giá trị vô hướng;
- ID phải là số nguyên dương;
- số đếm và giá trị tiền tệ phải là số hữu hạn không âm;
- ngày bình thường hóa thành chuỗi ISO;
- các trường đã thay đổi chỉ sử dụng danh sách cho phép dành riêng cho hành động;
- các giá trị đối tượng lồng nhau bị bỏ qua;
- lý do thô, ghi chú, ghi chú, email, tin nhắn, số nhận dạng, đường dẫn, ID mã thông báo và số nhận dạng `AuthToken` nguồn không có;
- các khóa đệ quy khớp với mật khẩu, hàm băm, mã thông báo, OTP, ủy quyền, cookie, bí mật, phiên, thông tin xác thực, khóa API, liên kết thiết lập hoặc liên kết đặt lại sẽ bị xóa sau khi chiếu.

- [ ] **Bước 2: Chạy kiểm thử dịch vụ RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminAuditLogService.test.js tests/userManagementService.test.js
```

Dự kiến: THẤT BẠI vì `adminService.listAuditLogs` và máy chiếu không tồn tại và ban quản lý người
dùng vẫn sở hữu các kiểm thử liệt kê nguyên mẫu.

- [ ] **Bước 3: Triển khai chuẩn hóa truy vấn phòng vệ và ánh xạ DTO**

Thêm `const auditLogRepository = require('../repositories/auditLogRepository');` bên cạnh việc nhập
kho lưu trữ hiện có. Thêm các trình trợ giúp truy vấn nội bộ này trước các chức năng dịch vụ công
cộng:

```js
function validationError(field, message) {
  return errors.badRequest('VALIDATION_ERROR', 'Invalid request.', [{ field, message }]);
}

function normalizeAuditInteger(value, { field, defaultValue, min = 1, max } = {}) {
  if (value === undefined || value === null) return defaultValue;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || (max !== undefined && parsed > max)) {
    throw validationError(field, `${field} is invalid.`);
  }
  return parsed;
}

function normalizeAuditText(value, field) {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  if (text.length < 1 || text.length > 100) {
    throw validationError(field, `${field} must be between 1 and 100 characters.`);
  }
  return text;
}

function normalizeAuditDate(value, field) {
  if (value === undefined || value === null) return undefined;
  const text = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T00:00:00.000Z`)
    : new Date(Number.NaN);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
    throw validationError(field, `${field} must use YYYY-MM-DD.`);
  }
  return text;
}

function normalizeAuditListQuery(query = {}) {
  const normalized = {
    page: normalizeAuditInteger(query.page, { field: 'page', defaultValue: 1 }),
    limit: normalizeAuditInteger(query.limit, {
      field: 'limit',
      defaultValue: 20,
      max: 100,
    }),
    q: normalizeAuditText(query.q, 'q'),
    action: normalizeAuditText(query.action, 'action'),
    actorId: normalizeAuditInteger(query.actorId, {
      field: 'actorId',
      defaultValue: undefined,
    }),
    from: normalizeAuditDate(query.from, 'from'),
    to: normalizeAuditDate(query.to, 'to'),
  };

  if (normalized.from && normalized.to && normalized.from > normalized.to) {
    throw validationError('to', 'From date must be before or equal to to date.');
  }

  return normalized;
}
```

- [ ] **Bước 4: Triển khai danh sách hành động được phép chính xác**

Thêm phần triển khai máy chiếu nội bộ sau đây sau trình trợ giúp truy vấn. Không xuất khẩu người trợ
giúp máy chiếu; các kiểm thử thực hiện chúng thông qua `listAuditLogs`.

```js
const INVALID_AUDIT_VALUE = Symbol('INVALID_AUDIT_VALUE');
const USER_TARGET_TYPES = new Set(['USER', 'USERS', 'ACCOUNT']);
const USER_CHANGED_FIELDS = new Set([
  'email', 'fullName', 'phone', 'address', 'department', 'specialization', 'status',
]);
const PROFILE_CHANGED_FIELDS = new Set([
  'fullName', 'address', 'dateOfBirth', 'avatarUrl', 'phone',
]);
const BOOK_COPY_CHANGED_FIELDS = new Set(['barcode', 'location', 'status']);
const EMPTY_DETAIL_ACTIONS = new Set([
  'AUTH_PASSWORD_CHANGE_FAILURE', 'AUTH_VERIFY_EMAIL', 'AUTH_LOGIN_LOCKED',
  'AUTH_ACCOUNT_AUTO_UNLOCKED', 'AUTH_LOGIN_INACTIVE', 'AUTH_LOGIN_FAILURE',
  'AUTH_LOGIN_SUCCESS', 'AUTH_REFRESH_TOKEN', 'AUTH_LOGOUT',
  'AUTH_PASSWORD_CHANGE_SUCCESS', 'AUTH_CHANGE_PASSWORD_OTP_REQUESTED',
  'AUTH_PASSWORD_RESET_SUCCESS', 'AUTH_REGISTER', 'AUTH_RESEND_VERIFICATION',
  'AUTH_PASSWORD_RESET_REQUEST', 'AUTH_LOGIN_ATTEMPT',
  'AUTH_ACCOUNT_SETUP_COMPLETE', 'USER_ACCOUNT_SETUP_RESEND',
]);
const REPORT_TYPES_BY_ACTION = {
  REPORT_BORROWING_VIEW: 'BORROWING',
  REPORT_INVENTORY_VIEW: 'INVENTORY',
  REPORT_USERS_VIEW: 'USERS',
};
const REPORT_TYPES_BY_PATH = {
  '/api/reports/borrowing': 'BORROWING',
  '/api/reports/inventory': 'INVENTORY',
  '/api/reports/users': 'USERS',
};
const SENSITIVE_AUDIT_KEY = /password|hash|token|otp|authorization|cookie|secret|session|credential|api[-_ ]?key|setup[-_ ]?link|reset[-_ ]?link/i;

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseMetadataObject(rawMetadata) {
  if (typeof rawMetadata !== 'string' || rawMetadata.trim() === '') return null;
  try {
    const parsed = JSON.parse(rawMetadata);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readText(value, { optional = false, max = 255 } = {}) {
  if (value === undefined || value === null) {
    return optional ? undefined : INVALID_AUDIT_VALUE;
  }
  if (typeof value !== 'string') return INVALID_AUDIT_VALUE;
  const text = value.trim();
  if (!text || text.length > max) return INVALID_AUDIT_VALUE;
  return text;
}

function readPositiveInteger(value, { optional = false } = {}) {
  if (value === undefined || value === null) {
    return optional ? undefined : INVALID_AUDIT_VALUE;
  }
  return Number.isInteger(value) && value > 0 ? value : INVALID_AUDIT_VALUE;
}

function readNonNegativeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : INVALID_AUDIT_VALUE;
}

function readBoolean(value) {
  return typeof value === 'boolean' ? value : INVALID_AUDIT_VALUE;
}

function readIsoDate(value) {
  if (typeof value !== 'string') return INVALID_AUDIT_VALUE;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? INVALID_AUDIT_VALUE : date.toISOString();
}

function readPositiveIntegerArray(value) {
  if (!Array.isArray(value)) return INVALID_AUDIT_VALUE;
  const projected = [];
  for (const item of value.slice(0, 100)) {
    const parsed = readPositiveInteger(item);
    if (parsed === INVALID_AUDIT_VALUE) return INVALID_AUDIT_VALUE;
    projected.push(parsed);
  }
  return projected;
}

function readChangedFields(value, allowedFields) {
  if (!Array.isArray(value)) return INVALID_AUDIT_VALUE;
  const projected = [];
  for (const item of value.slice(0, 100)) {
    const field = readText(item, { max: 50 });
    if (field === INVALID_AUDIT_VALUE) return INVALID_AUDIT_VALUE;
    if (allowedFields.has(field) && !projected.includes(field)) projected.push(field);
  }
  return projected;
}

function hasProvidedText(value) {
  if (value === undefined || value === null || value === '') return false;
  return typeof value === 'string' ? value.trim().length > 0 : INVALID_AUDIT_VALUE;
}

function buildAuditDetails(fields) {
  const output = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === INVALID_AUDIT_VALUE) return null;
    if (value !== undefined) output[key] = value;
  }
  return output;
}

function stripSensitiveKeys(value) {
  if (Array.isArray(value)) return value.slice(0, 100).map(stripSensitiveKeys);
  if (!isPlainObject(value)) return value;
  const output = {};
  for (const [key, item] of Object.entries(value)) {
    if (!SENSITIVE_AUDIT_KEY.test(key)) output[key] = stripSensitiveKeys(item);
  }
  return output;
}

function projectAuditDetails(action, rawMetadata) {
  if (EMPTY_DETAIL_ACTIONS.has(action)) return {};
  if (REPORT_TYPES_BY_ACTION[action]) return { reportType: REPORT_TYPES_BY_ACTION[action] };

  const metadata = parseMetadataObject(rawMetadata);
  if (!metadata) return {};
  let projected;

  switch (action) {
    case 'USER_CREATE':
      projected = buildAuditDetails({ roleName: readText(metadata.roleName, { max: 100 }) });
      break;
    case 'USER_UPDATE':
      projected = buildAuditDetails({
        changedFields: readChangedFields(
          metadata.changedFields ?? metadata.fields,
          USER_CHANGED_FIELDS
        ),
      });
      break;
    case 'USER_DEACTIVATE':
      projected = buildAuditDetails({
        newStatus: readText(metadata.newStatus ?? metadata.status, { max: 50 }),
      });
      break;
    case 'USER_ROLE_ASSIGN':
    case 'USER_ROLE_REVOKE':
      projected = buildAuditDetails({
        roleId: readPositiveInteger(metadata.roleId),
        roleName: readText(metadata.roleName, { max: 100 }),
      });
      break;
    case 'BORROW_REQUEST_CREATE':
      projected = buildAuditDetails({ copyIds: readPositiveIntegerArray(metadata.copyIds) });
      break;
    case 'BORROW_REQUEST_APPROVE':
      projected = buildAuditDetails({
        memberUserId: readPositiveInteger(metadata.memberUserId ?? metadata.approvedMemberId),
        copyIds: readPositiveIntegerArray(metadata.copyIds),
        notesProvided: hasProvidedText(metadata.notes),
      });
      break;
    case 'BORROW_REQUEST_REJECT':
      projected = buildAuditDetails({
        memberUserId: readPositiveInteger(metadata.memberUserId ?? metadata.rejectedMemberId),
        reasonProvided: hasProvidedText(metadata.reason),
      });
      break;
    case 'BORROW_DETAIL_RETURN':
      projected = buildAuditDetails({
        requestId: readPositiveInteger(metadata.requestId),
        memberId: readPositiveInteger(metadata.memberId),
        copyId: readPositiveInteger(metadata.copyId),
        condition: readText(metadata.condition, { max: 50 }),
        overdueDays: readNonNegativeNumber(metadata.overdueDays),
        notesProvided: hasProvidedText(metadata.notes),
      });
      break;
    case 'BORROW_DETAIL_RENEW':
      projected = buildAuditDetails({
        requestId: readPositiveInteger(metadata.requestId),
        memberId: readPositiveInteger(metadata.memberId),
        copyId: readPositiveInteger(metadata.copyId),
        newDueDate: readIsoDate(metadata.newDueDate),
        notesProvided: hasProvidedText(metadata.notes),
      });
      break;
    case 'RESERVATION_FULFILL':
      projected = buildAuditDetails({
        requestId: readPositiveInteger(metadata.requestId),
        copyId: readPositiveInteger(metadata.copyId),
        memberUserId: readPositiveInteger(metadata.memberUserId),
      });
      break;
    case 'RESERVATION_CREATE':
    case 'RESERVATION_EXPIRE':
      projected = buildAuditDetails({ copyId: readPositiveInteger(metadata.copyId) });
      break;
    case 'RESERVATION_CANCEL':
      projected = buildAuditDetails({
        copyId: readPositiveInteger(metadata.copyId),
        reasonProvided: hasProvidedText(metadata.reason),
      });
      break;
    case 'RESERVATION_NOTIFY_FAILED':
      projected = buildAuditDetails({ code: readText(metadata.code, { max: 100 }) });
      break;
    case 'RESERVATION_PROCESS':
      projected = buildAuditDetails({
        copyId: readPositiveInteger(metadata.copyId),
        selectedUserId: readPositiveInteger(metadata.selectedUserId),
        expiresAt: readIsoDate(metadata.expiresAt),
      });
      break;
    case 'FINE_CALCULATE':
      projected = buildAuditDetails({
        borrowDetailId: readPositiveInteger(metadata.borrowDetailId),
        memberId: readPositiveInteger(metadata.memberId),
        overdueDays: readNonNegativeNumber(metadata.overdueDays),
        amount: readNonNegativeNumber(metadata.amount),
      });
      break;
    case 'FINE_COLLECT':
      projected = buildAuditDetails({
        collectedAmount: readNonNegativeNumber(metadata.collectedAmount),
        fullyCollected: readBoolean(metadata.fullyCollected),
        noteProvided: hasProvidedText(metadata.note),
      });
      break;
    case 'FINE_MARK_PAID':
      projected = buildAuditDetails({
        amount: readNonNegativeNumber(metadata.amount),
        noteProvided: hasProvidedText(metadata.note),
      });
      break;
    case 'FINE_WAIVE':
    case 'FINE_CANCEL':
      projected = buildAuditDetails({ reasonProvided: hasProvidedText(metadata.reason) });
      break;
    case 'BOOK_COPY_CREATE':
      projected = buildAuditDetails({
        bookId: readPositiveInteger(metadata.bookId),
        barcode: readText(metadata.barcode, { max: 100 }),
        status: readText(metadata.status, { max: 50 }),
        location: readText(metadata.location, { optional: true, max: 100 }),
      });
      break;
    case 'BOOK_COPY_UPDATE': {
      if (!isPlainObject(metadata.before) || !isPlainObject(metadata.patch)) return {};
      const statusChanged = Object.prototype.hasOwnProperty.call(metadata.patch, 'status')
        && metadata.patch.status !== metadata.before.status;
      projected = buildAuditDetails({
        bookId: readPositiveInteger(metadata.before.bookId),
        changedFields: readChangedFields(Object.keys(metadata.patch), BOOK_COPY_CHANGED_FIELDS),
        previousStatus: statusChanged
          ? readText(metadata.before.status, { max: 50 })
          : undefined,
        newStatus: statusChanged
          ? readText(metadata.patch.status, { max: 50 })
          : undefined,
      });
      break;
    }
    case 'BOOK_COPY_STATUS_UPDATE':
      projected = buildAuditDetails({
        previousStatus: readText(metadata.previousStatus ?? metadata.oldStatus, { max: 50 }),
        newStatus: readText(metadata.newStatus, { max: 50 }),
        reasonProvided: hasProvidedText(metadata.reason),
      });
      break;
    case 'BOOK_COPY_DEACTIVATE':
      projected = buildAuditDetails({
        previousStatus: readText(metadata.previousStatus ?? metadata.oldStatus, { max: 50 }),
        newStatus: readText(metadata.newStatus, { max: 50 }),
      });
      break;
    case 'MEMBERSHIP_APPLICATION_SUBMITTED':
    case 'MEMBERSHIP_APPLICATION_APPROVED':
      projected = buildAuditDetails({
        userId: readPositiveInteger(metadata.userId),
        status: readText(metadata.status, { max: 50 }),
      });
      break;
    case 'MEMBERSHIP_APPLICATION_REJECTED':
      projected = buildAuditDetails({
        userId: readPositiveInteger(metadata.userId),
        status: readText(metadata.status, { max: 50 }),
        reasonProvided: hasProvidedText(metadata.reason),
      });
      break;
    case 'PROFILE_UPDATE':
      projected = buildAuditDetails({
        changedFields: readChangedFields(
          metadata.changedFields ?? metadata.fields,
          PROFILE_CHANGED_FIELDS
        ),
      });
      break;
    case 'REPORT_ACCESS_DENIED': {
      const rawPath = readText(metadata.path, { optional: true, max: 200 });
      if (rawPath === INVALID_AUDIT_VALUE) return {};
      projected = buildAuditDetails({
        code: readText(metadata.code, { max: 100 }),
        statusCode: readNonNegativeNumber(metadata.statusCode),
        method: readText(metadata.method, { optional: true, max: 20 }),
        reportType: rawPath ? REPORT_TYPES_BY_PATH[rawPath] : undefined,
      });
      break;
    }
    case 'NOTIFICATION_REQUEST_CREATE': {
      const sourceEntityType = readText(metadata.sourceEntityType, { optional: true, max: 50 });
      if (sourceEntityType === INVALID_AUDIT_VALUE) return {};
      projected = buildAuditDetails({
        type: readText(metadata.type, { max: 100 }),
        channel: readText(metadata.channel, { max: 50 }),
        sourceFeature: readText(metadata.sourceFeature, { optional: true, max: 50 }),
        sourceEntityType,
        sourceEntityId: sourceEntityType === 'AuthToken'
          ? undefined
          : readPositiveInteger(metadata.sourceEntityId, { optional: true }),
      });
      break;
    }
    case 'NOTIFICATION_RETRY':
      projected = buildAuditDetails({
        previousStatus: readText(metadata.previousStatus ?? metadata.fromStatus, { max: 50 }),
        newStatus: readText(metadata.newStatus ?? metadata.toStatus, { max: 50 }),
      });
      break;
    case 'NOTIFICATION_PROCESS_PENDING':
      projected = buildAuditDetails({
        processed: readNonNegativeNumber(metadata.processed),
        failed: readNonNegativeNumber(metadata.failed),
      });
      break;
    default:
      return {};
  }

  return projected ? stripSensitiveKeys(projected) : {};
}

function projectAuditLog(row) {
  const targetType = typeof row.targetType === 'string' ? row.targetType.trim() : null;
  const isUserTarget = USER_TARGET_TYPES.has(String(targetType || '').toUpperCase());
  return {
    logId: row.logId,
    action: row.action,
    actor: {
      userId: row.userId ?? null,
      email: row.actorEmail ?? null,
      fullName: row.actorName ?? null,
    },
    target: {
      type: targetType,
      id: row.targetId ?? null,
      label: isUserTarget ? (row.targetEmail || row.targetName || null) : null,
    },
    details: projectAuditDetails(row.action, row.metadata),
    ipAddress: row.ipAddress ?? null,
    createdAt: row.createdAt,
  };
}
```

Thêm chức năng dịch vụ công cộng và xuất nó bằng các chức năng Quản trị viên hiện có:

```js
// @spec FR-FE11-033, BR-FE11-018, BR-FE11-026, AC-FE11-018
async function listAuditLogs(query = {}) {
  const filters = normalizeAuditListQuery(query);
  const result = await auditLogRepository.listAuditLogs(filters);
  return {
    data: result.data.map(projectAuditLog),
    pagination: result.pagination,
  };
}
```

Xóa chức năng/xuất danh sách kiểm tra lỗi thời khỏi `userManagementService` và xóa tests/mocks chuẩn
hóa cũ khỏi `userManagementService.test.js` mà không làm suy yếu phạm vi thiết lập tài khoản hoặc
thay đổi vai trò.

- [ ] **Bước 5: Chạy thử dịch vụ GREEN**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminAuditLogService.test.js tests/userManagementService.test.js
```

Dự kiến: đạt cho mọi nhóm hành động được phê duyệt, siêu dữ liệu không đúng định dạng/thù địch, ánh
xạ DTO chuẩn và xóa hợp đồng danh sách quản lý người dùng lỗi thời.

---

### Nhiệm vụ 4: Di chuyển giao diện người dùng quản trị sang DTO chuẩn

**Tệp:**
- Tạo: `frontend/test/adminApi.test.js`
- Sửa đổi: `frontend/src/api/adminApi.js`
- Sửa đổi: `frontend/src/api/userManagementApi.js`
- Sửa đổi: `frontend/src/page/UserManagement.jsx`
- Sửa đổi: `frontend/test/userManagementApi.test.js`
- Sửa đổi: `frontend/test/userManagementFrontend.test.js`

**Giao diện:**
- Sản xuất: `adminApi.auditLogs(params = {})` sử dụng `GET /admin/audit-logs`.
- Tạo trình trợ giúp trang: `buildAuditLogParams(input)` và `formatAuditDetailEntries(details)`.
- Loại bỏ: `fetchAuditLogs` và mọi tham chiếu giao diện người dùng `/users/audit-logs`.

- [ ] **Bước 1: Viết các kiểm thử hợp đồng nguồn giao diện người dùng và API không thành công**

Tạo `frontend/test/adminApi.test.js`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const apiPath = new URL('../src/api/adminApi.js', import.meta.url);

test('FE11 Audit Logs use the canonical Admin endpoint and authorized wrapper', async () => {
  const source = await readFile(apiPath, 'utf8');
  assert.match(
    source,
    /auditLogs\(params = \{\}\)[\s\S]*?authorizedRequest\([\s\S]*?url: '\/admin\/audit-logs'[\s\S]*?params/,
  );
  assert.doesNotMatch(source, /\/users\/audit-logs/);
});
```

Nối vào `frontend/test/userManagementApi.test.js`:

```js
test('FE11 user-management API no longer owns Audit Logs', async () => {
  const source = await readFile(apiPath, 'utf8');
  assert.doesNotMatch(source, /export async function fetchAuditLogs/);
  assert.doesNotMatch(source, /\/users\/audit-logs/);
});
```

Nối vào `frontend/test/userManagementFrontend.test.js`:

```js
test('FE11 Audit query builder omits blanks and preserves nonblank server validation input', async () => {
  const source = await readFile(pagePath, 'utf8');
  const functionMatch = source.match(/function buildAuditLogParams\([^]*?\n}\r?\n/);
  assert.ok(functionMatch, 'buildAuditLogParams must exist');
  const buildAuditLogParams = new Function(
    `const AUDIT_TABLE_PAGE_SIZE = 20; ${functionMatch[0]}; return buildAuditLogParams;`,
  )();

  assert.deepEqual(buildAuditLogParams({
    page: 2,
    q: '  login  ',
    action: '  AUTH_LOGIN_SUCCESS  ',
    actorId: '7',
    from: '2026-07-01',
    to: '2026-07-18',
  }), {
    page: 2,
    limit: 20,
    q: 'login',
    action: 'AUTH_LOGIN_SUCCESS',
    actorId: 7,
    from: '2026-07-01',
    to: '2026-07-18',
  });
  assert.deepEqual(buildAuditLogParams({ q: ' ', action: '', actorId: '' }), {
    page: 1,
    limit: 20,
  });
  assert.equal(buildAuditLogParams({ actorId: 'invalid' }).actorId, 'invalid');
});

test('FE11 Audit controls reset pagination and refresh with applied filters', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /loadAuditLogs\(1, \{ filters: auditFilters \}\)/);
  assert.match(source, /setAuditFilters\(EMPTY_AUDIT_FILTERS\)[\s\S]*?loadAuditLogs\(1, \{ filters: EMPTY_AUDIT_FILTERS \}\)/);
  assert.match(source, /loadAuditLogs\(auditPagination\.page, \{ announce: true, filters: auditFilters \}\)/);
});

test('FE11 Audit renders only the nested safe DTO as React text', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /log\.actor\?\.fullName/);
  assert.match(source, /log\.actor\?\.email/);
  assert.match(source, /log\.target\?\.label/);
  assert.match(source, /log\.target\?\.type/);
  assert.match(source, /log\.target\?\.id/);
  assert.match(source, /formatAuditDetailEntries\(log\.details\)/);
  assert.match(source, /pageSize=\{auditPagination\.limit \|\| AUDIT_TABLE_PAGE_SIZE\}/);
  assert.doesNotMatch(source, /log\.metadata/);
  assert.doesNotMatch(source, /JSON\.stringify\(log\.details/);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(source, /log\.(?:actorName|actorEmail|targetName|targetEmail|targetType|targetId)/);
});
```

Những kiểm thử này khẳng định:

- `buildAuditLogParams` trim `q`/`action`, chuyển đổi ID tác nhân hợp lệ, giữ đầu vào không hợp lệ nhưng không rỗng để backend từ chối, giữ `from`/`to` và chỉ bỏ qua trường tùy chọn rỗng;
- Áp dụng và Xóa cuộc gọi `loadAuditLogs(1, ...)` để đặt lại phân trang;
- làm mới cuộc gọi `loadAuditLogs(auditPagination.page, { announce: true, filters: auditFilters })`;
- tác nhân đọc `log.actor?.fullName` / `log.actor?.email`;
- mục tiêu đọc `log.target?.label` / `type` / `id`;
- chi tiết sử dụng `formatAuditDetailEntries(log.details)` và không bao giờ sử dụng `JSON.stringify`, `dangerouslySetInnerHTML` hoặc `metadata` thô;
- phân trang kiểm tra sử dụng giới hạn `20`, trong khi các bảng Quản trị khác giữ kích thước trang mặc định `8`.

- [ ] **Bước 2: Chạy kiểm thử RED ở giao diện người dùng**

```powershell
node --test frontend/test/adminApi.test.js frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js
```

Dự kiến: THẤT BẠI vì API vẫn sử dụng bộ điều hợp cũ và trang hiển thị các trường nguyên mẫu phẳng mà
không có bộ lọc/chi tiết chuẩn.

- [ ] **Bước 3: Triển khai trình trợ giúp truy vấn và di chuyển API**

Thêm vào `adminApi`:

```js
auditLogs(params = {}) {
  return authorizedRequest(
    { method: 'get', url: '/admin/audit-logs', params },
    'Khong the tai nhat ky hoat dong.'
  );
},
```

Xóa `fetchAuditLogs` khỏi `userManagementApi.js` và nhập nó từ `UserManagement.jsx`.

Thêm hằng số gần trang Quản trị viên:

```js
const ADMIN_TABLE_PAGE_SIZE = 8;
const AUDIT_TABLE_PAGE_SIZE = 20;
const EMPTY_AUDIT_FILTERS = { q: '', action: '', actorId: '', from: '', to: '' };

function buildAuditLogParams({ page = 1, limit = AUDIT_TABLE_PAGE_SIZE, ...filters } = {}) {
  const params = { page, limit };
  const q = String(filters.q || '').trim();
  const action = String(filters.action || '').trim();
  const actorIdText = String(filters.actorId ?? '').trim();
  if (q) params.q = q;
  if (action) params.action = action;
  if (actorIdText) {
    params.actorId = /^\d+$/.test(actorIdText) ? Number(actorIdText) : actorIdText;
  }
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  return params;
}

function formatAuditDetailEntries(details) {
  return Object.entries(details || {}).filter(([, value]) => (
    ['string', 'number', 'boolean'].includes(typeof value)
    || (Array.isArray(value) && value.every((item) => (
      item === null || ['string', 'number', 'boolean'].includes(typeof item)
    )))
  ));
}

function formatAuditDetailValue(value) {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ');
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  return String(value);
}
```

- [ ] **Bước 4: Triển khai trạng thái bộ lọc, tải, hiển thị và phân trang**

Thêm trạng thái bên cạnh trạng thái Kiểm tra hiện có và khởi tạo phân trang với mặc định chuẩn:

```js
const [auditFilters, setAuditFilters] = useState(EMPTY_AUDIT_FILTERS);
const [auditPagination, setAuditPagination] = useState({
  page: 1,
  limit: AUDIT_TABLE_PAGE_SIZE,
  total: 0,
  totalPages: 0,
});
```

Thay đổi chữ ký của trình tải thành:

```js
async function loadAuditLogs(
  page = auditPagination.page,
  { announce = false, filters = auditFilters } = {}
) {
  if (!getStoredAdminUser()) {
    setAuditLogs([]);
    setAuditError('Vui lòng đăng nhập bằng tài khoản quản trị viên để xem nhật ký hoạt động.');
    return;
  }

  setAuditLoading(true);
  setAuditError('');
  try {
    const result = await adminApi.auditLogs(buildAuditLogParams({
      ...filters,
      page,
      limit: AUDIT_TABLE_PAGE_SIZE,
    }));
    setAuditLogs(result.data || []);
    setAuditPagination(result.pagination || {
      page,
      limit: AUDIT_TABLE_PAGE_SIZE,
      total: 0,
      totalPages: 0,
    });
    setAuditUpdatedAt(new Date());
    if (announce) setToast({ type: 'success', message: 'Đã làm mới nhật ký hoạt động.' });
  } catch (error) {
    setAuditError(error.message);
    if (announce) setToast({ type: 'error', message: error.message });
  } finally {
    setAuditLoading(false);
  }
}
```

Thay thế nhánh làm mới Kiểm toán bằng:

```js
else if (activeSection === 'audit') {
  loadAuditLogs(auditPagination.page, { announce: true, filters: auditFilters });
}
```

Thêm thanh công cụ này trước tiêu đề bảng Kiểm tra:

```jsx
<div className="um-toolbar audit">
  <div className="um-search">
    <Search size={18} />
    <input
      aria-label="Tìm nhật ký"
      value={auditFilters.q}
      maxLength={100}
      placeholder="Tìm hành động, actor hoặc đối tượng..."
      onChange={(event) => setAuditFilters((current) => ({
        ...current,
        q: event.target.value,
      }))}
      onKeyDown={(event) => {
        if (event.key === 'Enter') loadAuditLogs(1, { filters: auditFilters });
      }}
    />
  </div>
  <input
    aria-label="Lọc hành động"
    value={auditFilters.action}
    maxLength={100}
    placeholder="AUTH_LOGIN_SUCCESS"
    onChange={(event) => setAuditFilters((current) => ({
      ...current,
      action: event.target.value,
    }))}
  />
  <input
    aria-label="Actor ID"
    type="number"
    min="1"
    step="1"
    value={auditFilters.actorId}
    onChange={(event) => setAuditFilters((current) => ({
      ...current,
      actorId: event.target.value,
    }))}
  />
  <input
    aria-label="Từ ngày"
    type="date"
    value={auditFilters.from}
    onChange={(event) => setAuditFilters((current) => ({
      ...current,
      from: event.target.value,
    }))}
  />
  <input
    aria-label="Đến ngày"
    type="date"
    value={auditFilters.to}
    onChange={(event) => setAuditFilters((current) => ({
      ...current,
      to: event.target.value,
    }))}
  />
  <button
    type="button"
    className="um-secondary-button"
    disabled={auditLoading}
    onClick={() => loadAuditLogs(1, { filters: auditFilters })}
  >
    Áp dụng
  </button>
  <button
    type="button"
    className="um-secondary-button"
    disabled={auditLoading}
    onClick={() => {
      setAuditFilters(EMPTY_AUDIT_FILTERS);
      loadAuditLogs(1, { filters: EMPTY_AUDIT_FILTERS });
    }}
  >
    <FilterX size={16} /> Xóa lọc
  </button>
</div>
```

Thêm cột `Chi tiết an toàn` và chỉ hiển thị các hàng từ DTO lồng nhau:

```jsx
<td>
  <strong>{log.actor?.fullName || log.actor?.email || 'Hệ thống'}</strong>
  {log.actor?.fullName && log.actor?.email && <small>{log.actor.email}</small>}
</td>
<td>
  <strong>{log.target?.label || (log.target?.id ? `#${log.target.id}` : '-')}</strong>
  {log.target?.type && <small>{log.target.type}</small>}
</td>
<td>
  {formatAuditDetailEntries(log.details).length === 0 ? '-' : (
    <dl className="um-audit-details">
      {formatAuditDetailEntries(log.details).map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{formatAuditDetailValue(value)}</dd>
        </div>
      ))}
    </dl>
  )}
</td>
```

Không hiển thị JSON hoặc HTML thô. Việc thoát văn bản React vẫn là đường dẫn hiển thị duy nhất.

Thay đổi phân trang để bảo toàn các bảng hiện có:

```js
function AdminTablePagination({
  page,
  totalItems,
  onPageChange,
  pageSize = ADMIN_TABLE_PAGE_SIZE,
}) {
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  // existing buttons
}
```

Chỉ chuyển `pageSize={auditPagination.limit || AUDIT_TABLE_PAGE_SIZE}` cho Nhật ký kiểm tra.

- [ ] **Bước 5: Chạy kiểm thử GREEN ở giao diện người dùng**

```powershell
node --test frontend/test/adminApi.test.js frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Dự kiến: kiểm tra hợp đồng nguồn, kiểm tra mã và xây dựng sản xuất đạt; không còn điểm cuối cũ hoặc hiển
thị siêu dữ liệu không an toàn.

---

### Nhiệm vụ 5: Đồng bộ hóa hợp đồng và tập hợp gói bằng chứng H2

**Tệp:**
- Sửa đổi: `docs/api/api-contract.md`
- Sửa đổi: `backend/src/docs/openapi.yaml`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Tạo: `.sdd/reviews/fe11-audit-log-validation-2026-07-18.md`

**Giao diện:**
- Tạo ra: tài liệu con người/API được đồng bộ hóa cho `GET /api/admin/audit-logs` và gói đánh giá L1-L4 H2.
- Không đóng: `FE11-AUD01` hoặc `TD-024` trước khi tồn tại bằng chứng H2/H3/hợp nhất.

- [ ] **Bước 1: Ghi lại API chuẩn**

Nối tiểu mục FE11 này vào `docs/api/api-contract.md` trước phần ghi chú triển khai:

````markdown
### GET `/api/admin/audit-logs`

Tác nhân: Quản trị viên được xác thực. Xác thực và ủy quyền quản trị viên chạy trước khi xác thực truy vấn chi tiết.

|Truy vấn|Loại|Bắt buộc|hợp đồng|
| --- | --- | --- | --- |
| `page` |số nguyên|Không|`1` mặc định; tối thiểu `1`|
| `limit` |số nguyên|Không|`20` mặc định; phạm vi `1..100`|
| `q` |chuỗi|Không|Đã trim `1..100`; tìm kiếm hành động, email/tên đầy đủ của tác nhân, loại mục tiêu và văn bản ID mục tiêu|
| `action` |chuỗi|Không|Hành động cắt tỉa chính xác, `1..100`|
| `actorId` |số nguyên|Không|ID người dùng tích cực|
| `from` |ngày|Không|Bao gồm giới hạn dưới `YYYY-MM-DD`|
| `to` |ngày|Không|Bao gồm giới hạn trên `YYYY-MM-DD`; không được đặt chỗ `from`|

Phản hồi `200`:

```json
{ "dữ liệu": [
    {
      "logId": 10,
      "hành động": "USER_ROLE_ASSIGN",
      "actor": {
        "userId": 7,
        "email": "admin@example.test",
        "fullName": "Người dùng quản trị"
      },
      "mục tiêu": {
        "loại": "USER",
        "id": 15,
        "nhãn": "thành viên@example.test"
      },
      "chi tiết": {
        "roleId": 2,
        "roleName": "LIBRARIAN"
      },
      "ipAddress": "203.0.113.10",
      "createdAt": "2026-07-18T10:00:00.000Z"
    }
], "phân trang": {
    "trang": 1,
    "giới hạn": 20,
    "tổng cộng": 1,
    "totalPages": 1
  }
}
```

Rules:

- Các bản ghi được sắp xếp theo `CreatedAt DESC, LogId DESC`; lọc và phân trang chạy trong SQL bằng tham số có kiểu.
- `details` là danh sách cho phép theo từng hành động. Không trả về `Metadata`, `UserAgent`, mật khẩu, giá trị băm, mã thông báo, OTP, phiên, thông tin xác thực, liên kết thiết lập/đặt lại, ghi chú/lý do/email/định danh thô, đường dẫn thô hoặc đối tượng lồng nhau.
- JSON không hợp lệ, mảng/giá trị vô hướng ở cấp cao nhất, hành động không xác định và cấu trúc trường chiếu không hợp lệ đều trả về `details: {}`.
- Chỉ đối tượng có loại `USER`, `USERS` hoặc `ACCOUNT` mới có thể nhận nhãn người dùng đã nối. Các loại đối tượng khác trả về `label: null`.
- Kết quả rỗng trả về `totalPages: 0`.
- Tuyến `GET /api/users/audit-logs` đã ngừng dùng luôn trả về `404 NOT_FOUND` và không phải bí danh tương thích.
````

Cập nhật tiêu đề/mô tả OpenAPI để bao gồm FE11, thêm thẻ `Admin Audit` và thêm các lược đồ này trong
`components.schemas`:

```yaml
    AuditLogActor:
      type: object
      additionalProperties: false
      required: [userId, email, fullName]
      properties:
        userId: { type: integer, nullable: true, minimum: 1 }
        email: { type: string, nullable: true, format: email }
        fullName: { type: string, nullable: true }
    AuditLogTarget:
      type: object
      additionalProperties: false
      required: [type, id, label]
      properties:
        type: { type: string, nullable: true }
        id: { type: integer, nullable: true, minimum: 1 }
        label: { type: string, nullable: true }
    AuditLogDetails:
      type: object
      additionalProperties: false
      properties:
        roleId: { type: integer, minimum: 1 }
        roleName: { type: string }
        changedFields: { type: array, maxItems: 100, items: { type: string } }
        newStatus: { type: string }
        previousStatus: { type: string }
        copyIds: { type: array, maxItems: 100, items: { type: integer, minimum: 1 } }
        memberUserId: { type: integer, minimum: 1 }
        requestId: { type: integer, minimum: 1 }
        memberId: { type: integer, minimum: 1 }
        copyId: { type: integer, minimum: 1 }
        selectedUserId: { type: integer, minimum: 1 }
        borrowDetailId: { type: integer, minimum: 1 }
        userId: { type: integer, minimum: 1 }
        bookId: { type: integer, minimum: 1 }
        sourceEntityId: { type: integer, minimum: 1 }
        condition: { type: string }
        barcode: { type: string }
        location: { type: string }
        status: { type: string }
        code: { type: string }
        method: { type: string }
        reportType: { type: string, enum: [BORROWING, INVENTORY, USERS] }
        type: { type: string }
        channel: { type: string }
        sourceFeature: { type: string }
        sourceEntityType: { type: string }
        newDueDate: { type: string, format: date-time }
        expiresAt: { type: string, format: date-time }
        overdueDays: { type: number, minimum: 0 }
        amount: { type: number, minimum: 0 }
        collectedAmount: { type: number, minimum: 0 }
        statusCode: { type: integer, minimum: 0 }
        processed: { type: integer, minimum: 0 }
        failed: { type: integer, minimum: 0 }
        fullyCollected: { type: boolean }
        reasonProvided: { type: boolean }
        notesProvided: { type: boolean }
        noteProvided: { type: boolean }
    AuditLogEntry:
      type: object
      additionalProperties: false
      required: [logId, action, actor, target, details, ipAddress, createdAt]
      properties:
        logId: { type: integer, minimum: 1 }
        action: { type: string }
        actor: { $ref: '#/components/schemas/AuditLogActor' }
        target: { $ref: '#/components/schemas/AuditLogTarget' }
        details: { $ref: '#/components/schemas/AuditLogDetails' }
        ipAddress: { type: string, nullable: true }
        createdAt: { type: string, format: date-time }
    AuditLogPagination:
      type: object
      additionalProperties: false
      required: [page, limit, total, totalPages]
      properties:
        page: { type: integer, minimum: 1 }
        limit: { type: integer, minimum: 1, maximum: 100 }
        total: { type: integer, minimum: 0 }
        totalPages: { type: integer, minimum: 0 }
    AuditLogListResponse:
      type: object
      additionalProperties: false
      required: [data, pagination]
      properties:
        data:
          type: array
          items: { $ref: '#/components/schemas/AuditLogEntry' }
        pagination: { $ref: '#/components/schemas/AuditLogPagination' }
```

Thêm đường dẫn này trong `paths`:

```yaml
  /api/admin/audit-logs:
    get:
      tags: [Admin Audit]
      summary: Search and filter redacted cross-feature audit logs (FR-FE11-033)
      security: [{ bearerAuth: [] }]
      parameters:
        - { name: page, in: query, required: false, schema: { type: integer, minimum: 1, default: 1 } }
        - { name: limit, in: query, required: false, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
        - { name: q, in: query, required: false, schema: { type: string, minLength: 1, maxLength: 100 } }
        - { name: action, in: query, required: false, schema: { type: string, minLength: 1, maxLength: 100 } }
        - { name: actorId, in: query, required: false, schema: { type: integer, minimum: 1 } }
        - { name: from, in: query, required: false, schema: { type: string, format: date } }
        - { name: to, in: query, required: false, schema: { type: string, format: date } }
      responses:
        '200':
          description: Redacted audit-log page
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AuditLogListResponse' }
        '400': { $ref: '#/components/responses/ValidationError' }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '403': { $ref: '#/components/responses/Forbidden' }
```

Không ghi lại siêu dữ liệu thô hoặc bí danh cũ.

- [ ] **Bước 2: Chạy kiểm thử tích hợp máy chủ tập trung**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminAuditLogRoutes.test.js tests/adminAuditLogService.test.js tests/auditLogRepository.test.js tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/securityRegression.test.js
```

Dự kiến: tất cả sáu bộ kiểm thử ĐẠT.

- [ ] **Bước 3: Chạy xác thực L1 đầy đủ**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
Push-Location backend
node -e "require('yamljs').load('src/docs/openapi.yaml'); console.log('OpenAPI OK')"
Pop-Location
npm.cmd run trace:enforce
git diff --check
```

Dự kiến: tất cả các lệnh ĐẠT. Một lỗi xác định nhận được tối đa ba lần thử; mảnh E2E bị nghi ngờ có
thể được chạy lại một lần khi có bằng chứng.

- [ ] **Bước 4: Chạy quét phạm vi và quét dữ liệu nhạy cảm**

```powershell
git diff --name-only
git diff --check
git diff -U0 | rg -n "(?i)(password|passwd|token|otp|authorization|cookie|secret|session|credential|api[-_]?key|setup[-_]?link|reset[-_]?link)"
rg -n "fetchAuditLogs|/users/audit-logs|listRecent" backend frontend
```

Dự kiến: các tệp đã thay đổi vẫn thuộc quyền sở hữu của TD-024; các kết quả phù hợp với thuật ngữ
nhạy cảm được giới hạn ở các quy tắc từ chối máy chiếu và các xác nhận kiểm tra phủ định; không còn
lệnh gọi kế thừa chức năng hoặc tham chiếu `listRecent` nào.

- [ ] **Bước 5: Ghi lại bằng chứng L1-L4 cho H2**

Chỉ tạo `.sdd/reviews/fe11-audit-log-validation-2026-07-18.md` sau khi lệnh kết thúc, ghi lại chính
xác số lượng bộ/kiểm tra được quan sát và kết quả lệnh.

Gói phải chứa:

- L1: các lỗi RED được quan sát, kiểm tra tập trung GREEN, kiểm tra đầy đủ, phạm vi bảo hiểm, tìm lỗi mã nguồn, bản dựng, truy vết, kiểm tra khác biệt, quét phạm vi và quét dữ liệu nhạy cảm.
- L2: ánh xạ từ mã/kiểm tra `FE11-AUD01` tới `FR-FE11-033`, `AC-FE11-018`, `BR-FE11-018`, `BR-FE11-026` và `TD-024`.
- L3: Ủy quyền đầu tiên của quản trị viên, xác thực ranh giới, SQL được tham số hóa đã nhập, phép chiếu từ chối mặc định nhận biết hành động, không có siêu dữ liệu/bí mật thô và không mở rộng lược đồ/auth/dependency.
- L4: các kết hợp bộ lọc do người đánh giá chứng minh, phân trang/thứ tự, chi tiết an toàn, nhãn mục tiêu không dành cho người dùng, `404` cũ, luồng chỉ đọc ở giao diện người dùng và các khoảng trống môi trường còn lại.

Cập nhật `TEST_PLAN.md` và `CHANGELOG.md` để cho biết việc triển khai chỉ sẵn sàng cho H2 sau khi có
bằng chứng. Giữ `TD-024` `IN PROGRESS` và `FE11-AUD01` không được chọn cho đến khi cổng đóng được ủy
quyền.

- [ ] **Bước 6: Dừng để xem xét H2 trước khi cam kết hoặc đẩy**

Trình bày toàn bộ khác biệt có sẵn và `.sdd/reviews/fe11-audit-log-validation-2026-07-18.md` cho
người đánh giá. Phê duyệt H2 chỉ cho phép bộ cam kết được xem xét, đẩy, xuất bản PR dự thảo và
chuyển đổi sẵn sàng để xem xét sau khi vượt qua các bước kiểm tra bắt buộc; H3 vẫn cần thiết trước
khi hợp nhất.

---

### Nhiệm vụ 6: Xuất bản sau H2 và chỉ tích hợp sau H3

**Tệp:**
- Cam kết: chỉ khác biệt chính xác với TD-024 được H2 đánh giá
- nhánh xuất bản: `fix/fe11-audit-log-contract`
- Tạo PR: một PR triển khai TD-024 so với `main`
- Bằng chứng kết thúc đợt sau ở giai đoạn sau: không có PR kết thúc theo từng lát

**Giao diện:**
- Tiêu thụ: phê duyệt H2 rõ ràng, khác biệt được xem xét không thay đổi và chuyển bằng chứng L1 cục bộ.
- Tạo ra: các cam kết đã được xem xét, PR CI bắt buộc, gói quyết định H3, bằng chứng hợp nhất và bằng chứng CI sau hợp nhất cho lần kết thúc Lô 1 cuối cùng.

- [ ] **Bước 1: Xác nhận sự khác biệt được H2 xem xét không thay đổi**

Ghi lại hàm băm khác biệt H2 trước khi phê duyệt:

```powershell
git diff --binary | git hash-object --stdin
```

Ngay trước khi thực hiện, hãy chạy lại lệnh và yêu cầu hàm băm tương tự. Nếu nó khác, hãy dừng lại
và trình bày lại điểm khác biệt mới cho H2.

- [ ] **Bước 2: Tạo bộ cam kết đã được phê duyệt**

Sau khi phê duyệt H2 rõ ràng, hãy tạo các cam kết có thể xem xét này mà không thay đổi nội dung giữa chúng:

```powershell
git add -- backend/src/validators/adminValidators.js backend/src/routes/adminRoutes.js backend/src/controllers/adminController.js backend/src/routes/userManagementRoutes.js backend/src/controllers/userManagementController.js backend/src/services/adminService.js backend/src/services/userManagementService.js backend/src/repositories/auditLogRepository.js backend/tests/adminAuditLogRoutes.test.js backend/tests/adminAuditLogService.test.js backend/tests/auditLogRepository.test.js backend/tests/userManagementRoutes.test.js backend/tests/userManagementService.test.js
git commit -m "feat(fe11): add canonical admin audit log boundary"

git add -- frontend/src/api/adminApi.js frontend/src/api/userManagementApi.js frontend/src/page/UserManagement.jsx frontend/test/adminApi.test.js frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js
git commit -m "feat(fe11): migrate admin audit log UI"

git add -- docs/superpowers/plans/2026-07-18-fe11-audit-log-contract.md docs/api/api-contract.md backend/src/docs/openapi.yaml .sdd/reviews/fe11-audit-log-validation-2026-07-18.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md
git commit -m "docs: record FE11 audit log validation"
```

Dự kiến: `git status --short` trống. Không bao gồm `SPEC.md`, lược đồ, phần phụ thuộc, tệp TD-026
hoặc các thay đổi không liên quan của người dùng.

- [ ] **Bước 3: Đẩy và mở dự thảo triển khai PR**

```powershell
git push -u origin fix/fe11-audit-log-contract
@'
## Nội dung đã thay đổi

- Add canonical Admin-only `GET /api/admin/audit-logs` with `q`, `action`, `actorId`, `from`, `to`, `page`, and `limit`.
- Apply typed SQL filters/pagination and action-aware default-deny details projection.
- Migrate the Admin UI and retire `/api/users/audit-logs` with `404 NOT_FOUND`.

## Ánh xạ đặc tả

- BR-FE11-018, BR-FE11-026
- FR-FE11-033
- AC-FE11-018
- FE11-AUD01 / TD-024 only

## Xác nhận

- RED-GREEN route, repository, service, API, and frontend contract tests
- Full backend/frontend tests, coverage, lint, build, traceability, diff and sensitive-data scans
- No schema, dependency, authentication, audit-write, or TD-026 change

## Khoảng trống còn lại

- SQL Server-backed and browser interaction evidence is recorded explicitly if the local environment cannot provide it; GitHub CI remains required.
'@ | gh pr create --draft --base main --head fix/fe11-audit-log-contract --title "feat(fe11): add canonical admin audit logs" --body-file -
```

- [ ] **Bước 4: Yêu cầu kiểm tra PR và chuẩn bị bằng chứng H3**

```powershell
$prNumber = gh pr view --json number --jq .number
gh pr checks $prNumber --watch
gh pr ready $prNumber
gh pr view $prNumber --json number,url,isDraft,mergeable,mergeStateStatus,statusCheckRollup,commits,files
```

Dự kiến: yêu cầu vượt qua các bước kiểm tra, nhánh có thể hợp nhất và PR đã sẵn sàng. Trình bày
chính xác PR URL, cam kết SHA, phạm vi tệp đã thay đổi, gói L1-L4 và các rủi ro còn sót lại. Không
hợp nhất mà không có sự chấp thuận rõ ràng của H3.

- [ ] **Bước 5: Chỉ hợp nhất sau khi được phê duyệt H3 rõ ràng**

Sử dụng lệnh hợp nhất không phá hủy thông thường của kho lưu trữ sau khi người dùng phê duyệt rõ ràng H3:

```powershell
gh pr merge $prNumber --merge --delete-branch
```

Không sử dụng chức năng hợp nhất quản trị viên, bỏ qua kiểm tra, ép buộc hoặc từ bỏ CI.

- [ ] **Bước 6: Liên kết chính xác lần chạy CI `main` sau hợp nhất**

```powershell
$mergeSha = gh pr view $prNumber --json mergeCommit --jq .mergeCommit.oid
$runId = gh run list --branch main --workflow CI --event push --limit 20 --json databaseId,headSha --jq ".[] | select(.headSha == `"$mergeSha`") | .databaseId" | Select-Object -First 1
if (-not $runId) { throw "Post-merge CI run was not found for $mergeSha" }
gh run watch $runId --exit-status
```

Dự kiến: quá trình chạy `foundation-checks` sau hợp nhất sẽ đạt được hợp nhất chính xác SHA.

- [ ] **Bước 7: Bảo quản bằng chứng cho đợt kết thúc đợt 1**

Ghi lại số PR TD-024, hợp nhất SHA, chạy PR CI, chạy CI sau hợp nhất và kết quả L1-L4 cuối cùng
trong không gian làm việc kết thúc Lô 1 được xem xét trước. Không mở PR đóng TD-024 riêng biệt. Trì
hoãn toàn bộ FE11 và tiến hành tiếp theo `TD-026`; quá trình đóng Lô 1 cơ học cuối cùng chỉ xảy ra
sau khi `TD-024`, `TD-026` và `TD-027`, mỗi chiếc đã vượt qua luồng H2/H3 của riêng mình.

---

## Tự xem xét

- Phạm vi đặc tả: Nhiệm vụ 1-5 bao gồm quyền sở hữu chuẩn, xác thực ưu tiên quản trị viên, tất cả các bộ lọc truy vấn, phân trang SQL được nhập ổn định, chiếu hành động an toàn, di chuyển giao diện người dùng, gỡ bỏ kế thừa, tài liệu API và bằng chứng L1-L4.
- Tính nhất quán của loại: tên truy vấn, trường DTO, tên trợ giúp, phương thức kho lưu trữ và tên bộ điều hợp giao diện người dùng giống hệt nhau trong các tác vụ.
- Phạm vi: không bao gồm lược đồ, phần phụ thuộc, mở rộng xác thực, bí danh tương thích, xuất, ghi kiểm tra hoặc nối nhãn tên miền chéo.
- Khoảng cách chấp nhận còn lại: việc thực thi SQL Server thực và tương tác trình duyệt vẫn phụ thuộc vào môi trường nếu những môi trường đó không khả dụng; SQL được phát ra, hợp đồng nguồn và hành vi thành phần vẫn được tự động hóa.

Kế hoạch đã hoàn tất và được lưu vào `docs/superpowers/plans/2026-07-18-fe11-audit-log-contract.md`.
Chỉ thực thi nội tuyến với `executing-plans` sau khi PR #32 nhận được H3 và hợp nhất.
