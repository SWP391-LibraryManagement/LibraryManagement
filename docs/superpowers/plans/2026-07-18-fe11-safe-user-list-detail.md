# FE11 Danh sách người dùng an toàn và kế hoạch thực hiện chi tiết

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Tạo danh sách người dùng FE11 và phản hồi chi tiết bằng cách sử dụng DTO an toàn đã
được phê duyệt, xác thực truy vấn nghiêm ngặt, tổng hợp chi tiết xác định và `404 USER_NOT_FOUND`,
với Giao diện người dùng quản trị sử dụng điểm cuối chi tiết thực.

**Kiến trúc:** Giữ nguyên luồng bộ điều khiển/dịch vụ/kho lưu trữ Express hiện có và ranh giới đọc
`userRepository.js` hiện có. Triển khai danh sách và chi tiết dưới dạng các phép chiếu an toàn riêng
biệt để các tổng hợp chỉ có chi tiết không bao giờ bị rò rỉ vào các phản hồi đọc lại danh sách hoặc
thao tác ghi; giữ chuẩn hóa truy vấn giao diện người dùng trong một trình trợ giúp thuần túy nhỏ và chỉ
tìm nạp chi tiết khi một hàng được chọn.

**bộ công nghệ công nghệ:** Node.js CommonJS, Express 5, trình xác thực nhanh 7, Jest 30, SQL Server
qua `mssql`, React 19, Vite 8, Trình chạy kiểm thử nút, Markdown tệp bàn giao SDD.

## Ràng buộc toàn cầu

- Thực thi từ một cây làm việc bị cô lập dựa trên `origin/main` tại hoặc sau `66642b5`; chỉ mang theo thiết kế đã được phê duyệt và phương án này từ `agent/spec-baseline-fe01` chứ không mang theo lịch sử truy vết không liên quan của nhánh.
- bộ công nghệ được phê duyệt vẫn là Node.js + Express.js, React + Bootstrap, SQL Server và RESTful API.
- Chỉ triển khai `BR-FE11-001`, `BR-FE11-026`, `FR-FE11-001`, `FR-FE11-002`, `FR-FE11-015`, `FR-FE11-016`, `AC-FE11-001`, `AC-FE11-002`, `NFR-FE11-SEC-001`, `NFR-FE11-SEC-002`, `NFR-FE11-SEC-004..006` và `NFR-FE11-PERF-001` cho lát cắt này.
- Giữ FE11 `Implementation State: DEFERRED`; ghi lại phần hoàn chỉnh này một cách riêng biệt vì mẫu số truy vết trên toàn đối tượng không thay đổi.
- Không thay đổi lược đồ cơ sở dữ liệu, hành vi cập nhật/hủy kích hoạt của người dùng, thiết lập tài khoản, thay đổi vai trò, bảng thông tin dành cho quản trị viên, giao diện người dùng nhật ký kiểm tra hoặc trình kiểm tra truy vết.
- Không trả sách khóa `department` hoặc `specialization` giả; `TD-012` vẫn mở.
- Khóa phản hồi của người dùng được quản lý là `phoneNumber`; tải trọng yêu cầu tạo/cập nhật tiếp tục sử dụng `phone` trong lát này.
- Danh sách các mục và đọc lại thao tác ghi không bao giờ chứa `relatedSummary`; chỉ `GET /api/users/{userId}` chứa nó.
- Xác thực và ủy quyền quyền truy cập của Quản trị viên trước khi hiển thị chi tiết xác thực đầu vào.
- Sử dụng các tham số SQL đã nhập và danh sách cho phép phản hồi rõ ràng; không bao giờ trả sách thông tin xác thực, mã thông báo, phiên, liên kết thiết lập/đặt lại, trọng tải của nhà cung cấp hoặc siêu dữ liệu kiểm tra bí mật.
- Mọi thay đổi về hành vi sản xuất trước tiên phải có một kiểm thử thất bại được quan sát.
- Bảo toàn những thay đổi không liên quan của người dùng và các tập tin không bị theo dõi; chỉ xử lý các tệp được đặt tên theo tác vụ đang hoạt động.

---

### Nhiệm vụ 1: Kích hoạt phần đọc FE11 đã được phê duyệt

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-user-role-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`

**Giao diện:**
- Tiêu thụ: thiết kế `docs/superpowers/specs/2026-07-18-fe11-safe-user-list-detail-design.md` đã được phê duyệt và hoàn thành các lát cắt vai trò giao dịch/thiết lập tài khoản FE11 trên `origin/main`.
- Tạo ra: ID nhiệm vụ `FE11-U01..U06`, phạm vi rõ ràng và các kỳ vọng bằng chứng xác thực được sử dụng bởi Nhiệm vụ 2-5.

- [ ] **Bước 1: Nối danh sách an toàn/lát chi tiết vào FE11 PLAN.md**

Cập nhật trạng thái hàng đầu thành:

```markdown
Trạng thái: ĐƯỢC PHÊ DUYỆT - CƠ SỞ 2026-07-17; ACCOUNT SETUP AND TRANSACTIONAL ROLE SLICES HOÀN THÀNH; SAFE LIST/DETAIL SLICE ĐÃ PHÊ DUYỆT FOR IMPLEMENTATION; REMAINING WORK TRÌ HOÃN
```

Nối thêm:

```markdown
## 11. Lát cắt danh sách và chi tiết người dùng an toàn

### Trong phạm vi

- Xác thực phân trang danh sách, trạng thái, vai trò, tìm kiếm và ID người dùng chi tiết.
- Chỉ trả sách danh sách cho phép `UserManagementView` rõ ràng với `phoneNumber`.
- Giới hạn tìm kiếm trong email, tên đầy đủ và ID người dùng với thứ tự ổn định.
- trả sách các bản tóm tắt lượt mượn chỉ chi tiết, khoản khoản phạt chưa thanh toán và khoản đặt chỗ mở.
- trả sách `404 USER_NOT_FOUND` cho người dùng thiếu chi tiết.
- Làm cho giao diện người dùng quản trị tìm nạp và hiển thị phản hồi chi tiết thực sự.
- Thêm các kiểm thử RED-GREEN về tuyến đường, dịch vụ, kho lưu trữ và giao diện người dùng.

### Ngoài phạm vi

- Thay đổi lược đồ và sự tồn tại của thủ thư `department`/`specialization`.
- Cập nhật/hủy kích hoạt, thiết lập tài khoản, thay đổi vai trò, nhật ký kiểm tra, bảng thông tin và hành vi quản lý yêu cầu.
- Thay đổi chính sách về trình kiểm tra truy vết trên toàn bộ chức năng.

### Cổng xác nhận

- Các giá trị danh sách/chi tiết được cung cấp không hợp lệ sẽ bị từ chối thay vì bị kẹp.
- Các cột cơ sở dữ liệu bổ sung thù địch không bao giờ xuất hiện trong DTO an toàn.
- Các mục trong danh sách không có `relatedSummary`; chi tiết có chính xác ba trường tóm tắt bằng số xác định.
- Kiểm tra giao diện người dùng và máy chủ tập trung/đầy đủ cùng với thẻ `trace:enforce`.
- Công việc FE11 còn lại vẫn bị trì hoãn và không được báo cáo là hoàn thành.
```

- [ ] **Bước 2: Thêm FE11-U01..U06 vào TASKS.md**

Chèn trước `## Deferred FE11 Work`:

```markdown
## Nhiệm vụ danh sách và chi tiết người dùng an toàn

- [ ] **FE11-U01 - Thực thi hợp đồng danh sách người dùng chuẩn.**
  - Bản đồ tới: FR-FE11-001, AC-FE11-001, NFR-FE11-SEC-004, NFR-FE11-PERF-001.
  - DoD: các giá trị bị bỏ qua sử dụng trang 1/giới hạn 20; các giá trị được cung cấp không hợp lệ sẽ bị từ chối; trạng thái/vai trò/tìm kiếm được chuẩn hóa; tìm kiếm chỉ sử dụng email, tên đầy đủ và ID người dùng; đơn hàng vẫn là `CreatedAt DESC, UserId DESC`.

- [ ] **FE11-U02 - trả sách danh sách cho phép người dùng được quản lý an toàn rõ ràng.**
  - Bản đồ tới: BR-FE11-026, FR-FE11-001, AC-FE11-001, NFR-FE11-SEC-006.
  - DoD: phản hồi danh sách/đọc lại sử dụng `phoneNumber`, vai trò viết hoa xác định và không có trường thông tin xác thực/mã thông báo/phiên/liên kết/bí mật kiểm toán.

- [ ] **FE11-U03 - Thêm truy vấn tóm tắt chỉ liên quan đến chi tiết.**
  - Bản đồ tới: FR-FE11-002, AC-FE11-002.
  - DoD: một truy vấn chi tiết được tham số hóa trả về số lượt mượn đang hoạt động, tổng số khoản phạt chưa thanh toán chưa thanh toán và số lượng đặt chỗ mở với giá trị mặc định là số 0.

- [ ] **FE11-U04 - Trả về xác thực chi tiết xác định và lỗi không tìm thấy.**
  - Ánh xạ tới: FR-FE11-015, FR-FE11-016, NFR-FE11-SEC-001/002/004.
  - DoD: Ủy quyền của quản trị viên trước khi xác thực; ID không hợp lệ trả về `400 VALIDATION_ERROR`; ID bị thiếu hợp lệ trả về `404 USER_NOT_FOUND`.

- [ ] **FE11-U05 - Sử dụng danh sách an toàn/hợp đồng chi tiết trong Giao diện người dùng quản trị.**
  - Bản đồ tới: AC-FE11-001, AC-FE11-002.
  - DoD: Giao diện người dùng bỏ qua `ALL`/tìm kiếm trống, đọc `phoneNumber`, tìm nạp chi tiết về lựa chọn hàng, hiển thị tóm tắt và tải lại danh sách cũ sau chi tiết 404.

- [ ] **FE11-U06 - Vượt qua cổng xác thực danh sách/chi tiết an toàn.**
  - Các phần phụ thuộc: FE11-U01..U05.
  - DoD: các kiểm thử tập trung/đầy đủ, phạm vi bao phủ, tìm lỗi/xây dựng giao diện người dùng, truy vết, vệ sinh khác biệt, đánh giá bảo mật, đối chiếu nợ, hồ sơ xác nhận và bằng chứng đánh giá con người đã hoàn tất.
```

Giữ dòng này không thay đổi:

```markdown
Trạng thái thực hiện: TRÌ HOÃN
```

- [ ] **Bước 3: Cập nhật TEST_PLAN.md và CHANGELOG.md**

Thêm kế hoạch thiết kế và thực hiện đã được phê duyệt vào phần Bằng chứng hiện tại. Thêm mục nhập
nhật ký thay đổi `2026-07-18 - Safe User List And Detail Slice Approved` nêu rõ danh sách cho phép
chính xác, xác thực truy vấn nghiêm ngặt, ngữ nghĩa tổng hợp, quyết định không có lược đồ, yêu cầu
TDD và chưa có bằng chứng triển khai nào được xác nhận.

- [ ] **Bước 4: Chạy kiểm tra tài liệu**

```powershell
npm.cmd run trace:enforce
git diff --check -- .sdd/specs/feat-user-role-management
```

Dự kiến: việc thực thi truy vết vẫn ĐẠT với FE11 toàn bộ chức năng `DEFERRED` và điểm khác biệt
Markdown hoàn toàn sạch. Không thêm hoặc sửa đổi các tập lệnh kiểm tra truy vết trong phần này.

- [ ] **Bước 5: Cam kết điểm kiểm tra quy hoạch**

```powershell
git add -- .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md
git commit -m "docs: activate FE11 safe user reads"
```

---

### Nhiệm vụ 2: Thực hiện lát dọc danh sách người dùng an toàn

**Tệp:**
- Tạo: `backend/tests/userRepository.test.js`
- Tạo: `frontend/src/utils/userManagementQuery.js`
- Sửa đổi: `backend/tests/userManagementRoutes.test.js`
- Sửa đổi: `backend/tests/userManagementService.test.js`
- Sửa đổi: `backend/src/validators/userManagementValidators.js`
- Sửa đổi: `backend/src/routes/userManagementRoutes.js`
- Sửa đổi: `backend/src/controllers/userManagementController.js`
- Sửa đổi: `backend/src/services/userManagementService.js`
- Sửa đổi: `backend/src/repositories/userRepository.js`
- Sửa đổi: `frontend/test/userManagementApi.test.js`
- Sửa đổi: `frontend/src/api/userManagementApi.js`
- Sửa đổi: `frontend/src/page/UserManagement.jsx`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`

**Giao diện:**
- Tiêu thụ: `handleValidationErrors` hiện có, phần mềm trung gian ưu tiên quản trị viên, `listManagedUsers({ page, limit, status, role, search })` và phong bì phân trang hiện tại.
- Sản xuất: `listUsersValidators`, `req.validatedListQuery`, bộ lọc dịch vụ chuẩn, `buildManagedUserListParams(input)` và các mục trong danh sách an toàn có `phoneNumber` và không có `relatedSummary`.

- [ ] **Bước 1: Viết kiểm thử lộ trình danh sách không thành công**

Thêm vào `backend/tests/userManagementRoutes.test.js`:

```js
test('GET /api/users normalizes the approved list query', async () => {
  const userManagementService = {
    listUsers: jest.fn(async () => ({
      data: [],
      pagination: { page: 2, limit: 50, total: 0, totalPages: 0 },
    })),
  };
  const app = makeApp({ userManagementService });

  const response = await request(app)
    .get('/api/users?page=2&limit=50&status=active&role=member&search=%20Alice%20')
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(200);
  expect(userManagementService.listUsers).toHaveBeenCalledWith({
    page: 2,
    limit: 50,
    status: 'ACTIVE',
    role: 'MEMBER',
    search: 'Alice',
  });
});

test.each([
  ['/api/users?page=0', 'page'],
  ['/api/users?page=1.5', 'page'],
  ['/api/users?page=abc', 'page'],
  ['/api/users?limit=0', 'limit'],
  ['/api/users?limit=101', 'limit'],
  ['/api/users?status=DELETED', 'status'],
  ['/api/users?role=GUEST', 'role'],
  [`/api/users?search=${'x'.repeat(201)}`, 'search'],
  ['/api/users?search=%20%20%20', 'search'],
])('GET %s rejects invalid %s', async (url, field) => {
  const userManagementService = { listUsers: jest.fn() };
  const app = makeApp({ userManagementService });

  const response = await request(app)
    .get(url)
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
  expect(response.body.error.details).toEqual(
    expect.arrayContaining([expect.objectContaining({ field })])
  );
  expect(userManagementService.listUsers).not.toHaveBeenCalled();
});

test('GET /api/users authorizes before validating the query', async () => {
  const userManagementService = { listUsers: jest.fn() };
  const app = makeApp({ roles: ['MEMBER'], userManagementService });

  const response = await request(app)
    .get('/api/users?page=0')
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(403);
  expect(response.body.error.code).toBe('ADMIN_REQUIRED');
  expect(userManagementService.listUsers).not.toHaveBeenCalled();
});
```

- [ ] **Bước 2: Viết kiểm thử danh sách dịch vụ không thành công**

Thêm dây nịt tập trung và kiểm thử vào `backend/tests/userManagementService.test.js`:

```js
function makeReadHarness(userRepositoryOverrides = {}) {
  const userRepository = {
    listManagedUsers: jest.fn(async (query) => ({
      data: [],
      pagination: { ...query, total: 0, totalPages: 0 },
    })),
    getManagedUserById: jest.fn(),
    ...userRepositoryOverrides,
  };
  const service = createUserManagementService({
    userRepository,
    userRoleRepository: {},
    authTokenRepository: {},
    auditLogRepository: {},
    accountSetupRepository: {},
    notificationRequester: { createNotificationRequest: jest.fn() },
  });
  return { service, userRepository };
}

test('listUsers applies defaults only when values are omitted', async () => {
  const { service, userRepository } = makeReadHarness();

  await service.listUsers({});

  expect(userRepository.listManagedUsers).toHaveBeenCalledWith({
    page: 1,
    limit: 20,
    status: null,
    role: null,
    search: null,
  });
});

test('listUsers normalizes approved filters before repository access', async () => {
  const { service, userRepository } = makeReadHarness();

  await service.listUsers({
    page: '2',
    limit: '50',
    status: ' active ',
    role: ' librarian ',
    search: '  user@example.test  ',
  });

  expect(userRepository.listManagedUsers).toHaveBeenCalledWith({
    page: 2,
    limit: 50,
    status: 'ACTIVE',
    role: 'LIBRARIAN',
    search: 'user@example.test',
  });
});

test.each([
  [{ page: 0 }, 'INVALID_PAGE'],
  [{ page: 1.5 }, 'INVALID_PAGE'],
  [{ limit: 101 }, 'INVALID_LIMIT'],
  [{ status: 'DELETED' }, 'INVALID_USER_STATUS'],
  [{ role: 'GUEST' }, 'INVALID_USER_ROLE'],
  [{ search: '   ' }, 'INVALID_USER_SEARCH'],
  [{ search: 'x'.repeat(201) }, 'INVALID_USER_SEARCH'],
])('listUsers rejects invalid direct input %j', async (query, code) => {
  const { service, userRepository } = makeReadHarness();

  await expect(service.listUsers(query)).rejects.toMatchObject({ statusCode: 400, code });
  expect(userRepository.listManagedUsers).not.toHaveBeenCalled();
});
```

- [ ] **Bước 3: Viết danh sách cho phép kho lưu trữ không thành công và các kiểm thử SQL**

Tạo `backend/tests/userRepository.test.js` với các xác nhận mô phỏng và liệt kê cơ sở dữ liệu:

```js
jest.mock('../src/config/db', () => ({
  sql: {
    Int: 'Int',
    NVarChar: (size) => `NVarChar(${size})`,
  },
  getPool: jest.fn(),
}));

const { getPool } = require('../src/config/db');
const userRepository = require('../src/repositories/userRepository');

function useRecordset(recordset) {
  const capture = { inputs: {}, query: '' };
  getPool.mockResolvedValue({
    request() {
      return {
        input(name, _type, value) {
          capture.inputs[name] = value;
          return this;
        },
        async query(query) {
          capture.query = query;
          return { recordset };
        },
      };
    },
  });
  return capture;
}

beforeEach(() => getPool.mockReset());

test('listManagedUsers returns only the approved base DTO', async () => {
  useRecordset([{
    UserId: 7,
    Username: 'safe.user',
    Email: 'safe@example.test',
    Phone: '0900000000',
    Status: 'ACTIVE',
    FullName: 'Safe User',
    Address: 'Shelf Street',
    LastLoginAt: null,
    CreatedAt: new Date('2026-07-01T00:00:00.000Z'),
    UpdatedAt: new Date('2026-07-18T00:00:00.000Z'),
    Roles: 'member,ADMIN',
    TotalCount: 1,
    PasswordHash: 'forbidden-hash',
    TokenHash: 'forbidden-token',
    SessionId: 'forbidden-session',
    SetupLink: 'https://forbidden.example/setup',
    AuditSecret: 'forbidden-audit',
  }]);

  const result = await userRepository.listManagedUsers({ page: 1, limit: 20 });

  expect(result.data[0]).toEqual({
    userId: 7,
    username: 'safe.user',
    email: 'safe@example.test',
    phoneNumber: '0900000000',
    status: 'ACTIVE',
    fullName: 'Safe User',
    address: 'Shelf Street',
    lastLoginAt: null,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-18T00:00:00.000Z'),
    roles: ['ADMIN', 'MEMBER'],
  });
  expect(result.data[0]).not.toHaveProperty('relatedSummary');
  expect(JSON.stringify(result.data[0])).not.toContain('forbidden-');
});

test('listManagedUsers uses only approved search fields and stable ordering', async () => {
  const capture = useRecordset([]);

  await userRepository.listManagedUsers({
    page: 2,
    limit: 20,
    status: 'ACTIVE',
    role: 'MEMBER',
    search: 'safe',
  });

  expect(capture.inputs).toMatchObject({
    Offset: 20,
    Limit: 20,
    Status: 'ACTIVE',
    Role: 'MEMBER',
    Search: '%safe%',
  });
  expect(capture.query).toContain('LOWER(u.Email) LIKE LOWER(@Search)');
  expect(capture.query).toContain('LOWER(up.FullName) LIKE LOWER(@Search)');
  expect(capture.query).toContain('CONVERT(NVARCHAR(20), u.UserId) LIKE @Search');
  expect(capture.query).not.toContain('LOWER(u.Username) LIKE LOWER(@Search)');
  expect(capture.query).not.toContain('u.Phone LIKE @Search');
  expect(capture.query).not.toContain('LOWER(up.Address) LIKE LOWER(@Search)');
  expect(capture.query).not.toContain('LOWER(roleList.Roles) LIKE LOWER(@Search)');
  expect(capture.query).toContain('ORDER BY CreatedAt DESC, UserId DESC');
});
```

- [ ] **Bước 4: Viết các kiểm thử tên trường và truy vấn giao diện người dùng không thành công**

Thay thế nhập tiện ích Nhiệm vụ 2 trong `frontend/test/userManagementApi.test.js`, sau đó nối thêm
các kiểm thử:

```js
import { buildManagedUserListParams } from '../src/utils/userManagementQuery.js';

test('FE11 list params omit UI sentinels and empty search', () => {
  assert.deepEqual(
    buildManagedUserListParams({
      page: 1,
      limit: 20,
      role: 'ALL',
      status: 'ALL',
      search: '   ',
    }),
    { page: 1, limit: 20 },
  );

  assert.deepEqual(
    buildManagedUserListParams({
      page: 2,
      limit: 50,
      role: 'member',
      status: 'active',
      search: '  Alice  ',
    }),
    { page: 2, limit: 50, role: 'MEMBER', status: 'ACTIVE', search: 'Alice' },
  );
});

test('FE11 Admin UI reads phoneNumber instead of response phone', async () => {
  const source = await readFile(new URL('../src/page/UserManagement.jsx', import.meta.url), 'utf8');

  assert.match(source, /phone:\s*user\?\.phoneNumber\s*\|\|\s*''/);
  assert.match(source, /user\.phoneNumber\s*\|\|\s*'-'/);
  assert.match(source, /selectedUser\.phoneNumber\s*\|\|\s*'-'/);
  assert.doesNotMatch(source, /user\?\.phone\s*\|\|/);
});
```

- [ ] **Bước 5: Chạy danh sách kiểm tra RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/userRepository.test.js
node --test --test-name-pattern="FE11" frontend/test/userManagementApi.test.js
```

Dự kiến: lỗi máy chủ hiển thị trình xác thực danh sách bị thiếu, kẹp dịch vụ im lặng, tìm kiếm rộng
rãi và `phone`; giao diện người dùng không thành công vì trình trợ giúp truy vấn và các lần đọc
`phoneNumber` không tồn tại.

- [ ] **Bước 6: Triển khai trình xác thực danh sách và nối tuyến đường**

Cập nhật `backend/src/validators/userManagementValidators.js`. Express 5 hiển thị `req.query` thông
qua một getter phân tích lại URL, vì vậy hãy lưu trữ kết quả đã được lọc của trình xác thực nhanh
trên một thuộc tính yêu cầu chuyên dụng:

```js
const { body, matchedData, param, query } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');

const LIST_STATUSES = ['ACTIVE', 'INACTIVE', 'LOCKED'];
const LIST_ROLES = ['MEMBER', 'LIBRARIAN', 'ADMIN'];

function uppercaseTrimmed(value) {
  return String(value).trim().toUpperCase();
}

function assignValidatedListQuery(req, res, next) {
  req.validatedListQuery = matchedData(req, { locations: ['query'] });
  return next();
}

const listUsersValidators = [
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
  query('status')
    .optional()
    .customSanitizer(uppercaseTrimmed)
    .isIn(LIST_STATUSES)
    .withMessage('Status must be ACTIVE, INACTIVE, or LOCKED.'),
  query('role')
    .optional()
    .customSanitizer(uppercaseTrimmed)
    .isIn(LIST_ROLES)
    .withMessage('Role must be MEMBER, LIBRARIAN, or ADMIN.'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search must be between 1 and 200 characters.'),
  handleValidationErrors,
  assignValidatedListQuery,
];
```

Xuất `listUsersValidators`. Đấu dây sau khi có sự cho phép của Quản trị viên:

```js
const {
  listUsersValidators,
  resendSetupValidators,
  assignRoleValidators,
  revokeRoleValidators,
} = require('../validators/userManagementValidators');

router.get('/', ...requireAdmin, listUsersValidators, controller.listUsers);
```

Cập nhật ranh giới bộ điều khiển:

```js
const result = await userManagementService.listUsers(req.validatedListQuery || req.query);
```

- [ ] **Bước 7: Triển khai phân tích cú pháp danh sách dịch vụ chuẩn**

Thêm gần đầu `backend/src/services/userManagementService.js`:

```js
const USER_LIST_STATUSES = new Set(['ACTIVE', 'INACTIVE', 'LOCKED']);
const USER_LIST_ROLES = new Set(['MEMBER', 'LIBRARIAN', 'ADMIN']);

function parseListInteger(value, { defaultValue, min, max, code, message }) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || (max !== undefined && parsed > max)) {
    throw errors.badRequest(code, message);
  }
  return parsed;
}

function normalizeListEnum(value, allowed, code, message) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim().toUpperCase();
  if (!allowed.has(normalized)) {
    throw errors.badRequest(code, message);
  }
  return normalized;
}

function normalizeListSearch(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  if (normalized.length < 1 || normalized.length > 200) {
    throw errors.badRequest(
      'INVALID_USER_SEARCH',
      'Search must be between 1 and 200 characters.'
    );
  }
  return normalized;
}
```

Thay thế `listUsers` bằng:

```js
async function listUsers(query = {}) {
  // @spec FR-FE11-001, AC-FE11-001
  return userRepository.listManagedUsers({
    page: parseListInteger(query.page, {
      defaultValue: 1,
      min: 1,
      code: 'INVALID_PAGE',
      message: 'Page must be a positive integer.',
    }),
    limit: parseListInteger(query.limit, {
      defaultValue: 20,
      min: 1,
      max: 100,
      code: 'INVALID_LIMIT',
      message: 'Limit must be an integer between 1 and 100.',
    }),
    status: normalizeListEnum(
      query.status,
      USER_LIST_STATUSES,
      'INVALID_USER_STATUS',
      'Status must be ACTIVE, INACTIVE, or LOCKED.'
    ),
    role: normalizeListEnum(
      query.role,
      USER_LIST_ROLES,
      'INVALID_USER_ROLE',
      'Role must be MEMBER, LIBRARIAN, or ADMIN.'
    ),
    search: normalizeListSearch(query.search),
  });
}
```

- [ ] **Bước 8: Triển khai danh sách kho lưu trữ cho phép và tìm kiếm được phê duyệt**

Thay thế ánh xạ vai trò được quản lý và người dùng được quản lý trong
`backend/src/repositories/userRepository.js`:

```js
function mapManagedRoles(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(',')
    .map((role) => role.trim().toUpperCase())
    .filter(Boolean)
    .sort();
}

function mapManagedUser(row) {
  if (!row) {
    return null;
  }

  return {
    userId: row.UserId,
    username: row.Username,
    email: row.Email,
    phoneNumber: row.Phone,
    status: row.Status,
    fullName: row.FullName,
    address: row.Address,
    lastLoginAt: row.LastLoginAt,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    roles: mapManagedRoles(row.Roles),
  };
}
```

Thay đổi tham số tìm kiếm và vị ngữ thành:

```js
request.input('Search', sql.NVarChar(202), `%${search}%`);
where.push(`(
  LOWER(u.Email) LIKE LOWER(@Search)
  OR LOWER(up.FullName) LIKE LOWER(@Search)
  OR CONVERT(NVARCHAR(20), u.UserId) LIKE @Search
)`);
```

Giữ phân trang SQL và thứ tự ổn định chính xác đã có sẵn. Thêm vào `listManagedUsers` ở trên:

```js
// @spec FR-FE11-001, BR-FE11-026
```

- [ ] **Bước 9: Triển khai chuẩn hóa truy vấn giao diện người dùng và đọc `phoneNumber`**

Tạo `frontend/src/utils/userManagementQuery.js`:

```js
export function buildManagedUserListParams({ page, limit, role, status, search } = {}) {
  const params = {};

  if (page !== undefined) params.page = page;
  if (limit !== undefined) params.limit = limit;

  const normalizedRole = String(role || '').trim().toUpperCase();
  const normalizedStatus = String(status || '').trim().toUpperCase();
  const normalizedSearch = String(search || '').trim();

  if (normalizedRole && normalizedRole !== 'ALL') params.role = normalizedRole;
  if (normalizedStatus && normalizedStatus !== 'ALL') params.status = normalizedStatus;
  if (normalizedSearch) params.search = normalizedSearch;

  return params;
}
```

Nhập nó vào `frontend/src/api/userManagementApi.js` và thay đổi lệnh gọi danh sách:

```js
import { buildManagedUserListParams } from '../utils/userManagementQuery';

export async function fetchUsers(params = {}) {
  try {
    const response = await authorizedRequest({
      method: 'get',
      url: '/users',
      params: buildManagedUserListParams(params),
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not load users.'), { cause: error });
  }
}
```

Thay đổi chỉ đọc phản hồi trong `UserManagement.jsx`:

```js
phone: user?.phoneNumber || '',
```

```jsx
<td>{user.phoneNumber || '-'}</td>
```

```jsx
{selectedUser.phoneNumber || '-'}
```

Giữ nguyên `form.phone` và tạo/cập nhật các trường tải trọng yêu cầu.

- [ ] **Bước 10: Chạy danh sách GREEN và kiểm tra hồi quy**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/userRepository.test.js
node --test --test-name-pattern="FE11" frontend/test/userManagementApi.test.js
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Dự kiến: vượt qua các kiểm thử backend/frontend tập trung; kiểm tra mã và thẻ xây dựng sản xuất; các kiểm
thử tạo/cập nhật tải trọng hiện có vẫn không thay đổi.

- [ ] **Bước 11: Đánh dấu hoàn thành FE11-U01/U02 và cam kết**

```powershell
git add -- backend/tests/userRepository.test.js backend/tests/userManagementRoutes.test.js backend/tests/userManagementService.test.js backend/src/validators/userManagementValidators.js backend/src/routes/userManagementRoutes.js backend/src/controllers/userManagementController.js backend/src/services/userManagementService.js backend/src/repositories/userRepository.js frontend/src/utils/userManagementQuery.js frontend/test/userManagementApi.test.js frontend/src/api/userManagementApi.js frontend/src/page/UserManagement.jsx .sdd/specs/feat-user-role-management/TASKS.md docs/superpowers/plans/2026-07-18-fe11-safe-user-list-detail.md
git commit -m "feat: enforce safe FE11 user list contract"
```

---

### Nhiệm vụ 3: Triển khai chi tiết an toàn API và các tập hợp

**Tệp:**
- Sửa đổi: `backend/tests/userManagementRoutes.test.js`
- Sửa đổi: `backend/tests/userManagementService.test.js`
- Sửa đổi: `backend/tests/userRepository.test.js`
- Sửa đổi: `backend/src/validators/userManagementValidators.js`
- Sửa đổi: `backend/src/routes/userManagementRoutes.js`
- Sửa đổi: `backend/src/services/userManagementService.js`
- Sửa đổi: `backend/src/repositories/userRepository.js`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`

**Giao diện:**
- Tiêu thụ: `mapManagedUser(row)` từ Nhiệm vụ 2 và `errors.notFound` hiện có.
- Sản xuất: `getUserValidators` và `getManagedUserDetailById(userId) -> UserManagementView & { relatedSummary }`.

- [ ] **Bước 1: Viết các kiểm thử lộ trình chi tiết không thành công**

Thêm:

```js
test('GET /api/users/:userId passes a normalized positive ID', async () => {
  const detail = {
    userId: 7,
    email: 'detail@example.test',
    relatedSummary: {
      activeBorrowingCount: 1,
      unpaidFineTotal: 5000,
      openReservationCount: 2,
    },
  };
  const userManagementService = { getUser: jest.fn(async () => detail) };
  const app = makeApp({ userManagementService });

  const response = await request(app)
    .get('/api/users/7')
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(200);
  expect(response.body).toEqual(detail);
  expect(userManagementService.getUser).toHaveBeenCalledWith(7);
});

test.each(['0', '-1', '1.5', 'not-a-user'])(
  'GET /api/users/%s rejects an invalid user ID',
  async (userId) => {
    const userManagementService = { getUser: jest.fn() };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(userManagementService.getUser).not.toHaveBeenCalled();
  }
);
```

- [ ] **Bước 2: Viết kiểm thử chi tiết dịch vụ không thành công**

```js
test('getUser returns the dedicated detail projection', async () => {
  const detail = {
    userId: 7,
    phoneNumber: '0900000000',
    roles: ['MEMBER'],
    relatedSummary: {
      activeBorrowingCount: 1,
      unpaidFineTotal: 5000,
      openReservationCount: 2,
    },
  };
  const { service, userRepository } = makeReadHarness({
    getManagedUserDetailById: jest.fn(async () => detail),
  });

  await expect(service.getUser(7)).resolves.toEqual(detail);
  expect(userRepository.getManagedUserDetailById).toHaveBeenCalledWith(7);
  expect(userRepository.getManagedUserById).not.toHaveBeenCalled();
});

test('getUser returns 404 USER_NOT_FOUND for a missing valid ID', async () => {
  const { service } = makeReadHarness({
    getManagedUserDetailById: jest.fn(async () => null),
  });

  await expect(service.getUser(404)).rejects.toMatchObject({
    statusCode: 404,
    code: 'USER_NOT_FOUND',
    message: 'User was not found.',
  });
});

test.each([0, -1, 1.5, 'not-a-user'])(
  'getUser rejects invalid direct ID %p before repository access',
  async (userId) => {
    const { service, userRepository } = makeReadHarness({
      getManagedUserDetailById: jest.fn(),
    });

    await expect(service.getUser(userId)).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_USER_ID',
    });
    expect(userRepository.getManagedUserDetailById).not.toHaveBeenCalled();
  }
);
```

- [ ] **Bước 3: Viết các kiểm thử chi tiết kho lưu trữ không thành công**

Nối vào `backend/tests/userRepository.test.js`:

```js
test('getManagedUserDetailById returns exactly three numeric summaries', async () => {
  const capture = useRecordset([{
    UserId: 7,
    Username: 'detail.user',
    Email: 'detail@example.test',
    Phone: '0900000000',
    Status: 'ACTIVE',
    FullName: 'Detail User',
    Address: 'Detail Street',
    LastLoginAt: null,
    CreatedAt: new Date('2026-07-01T00:00:00.000Z'),
    UpdatedAt: new Date('2026-07-18T00:00:00.000Z'),
    Roles: 'MEMBER',
    ActiveBorrowingCount: 2,
    UnpaidFineTotal: '15000.00',
    OpenReservationCount: 3,
    PasswordHash: 'forbidden-hash',
  }]);

  const result = await userRepository.getManagedUserDetailById(7);

  expect(capture.inputs.UserId).toBe(7);
  expect(result.relatedSummary).toEqual({
    activeBorrowingCount: 2,
    unpaidFineTotal: 15000,
    openReservationCount: 3,
  });
  expect(Object.keys(result.relatedSummary).sort()).toEqual(
    ['activeBorrowingCount', 'openReservationCount', 'unpaidFineTotal'].sort()
  );
  expect(result).not.toHaveProperty('passwordHash');
  expect(capture.query).toContain("bd.Status = 'BORROWED'");
  expect(capture.query).not.toContain("bd.Status = 'OVERDUE'");
  expect(capture.query).toContain("f.Status = 'UNPAID'");
  expect(capture.query).toContain('f.Amount - f.PaidAmount');
  expect(capture.query).toContain("r.Status IN ('ACTIVE', 'NOTIFIED')");
});

test('getManagedUserDetailById maps missing aggregates to zero and missing users to null', async () => {
  useRecordset([{
    UserId: 8,
    Username: 'zero.user',
    Email: 'zero@example.test',
    Phone: null,
    Status: 'INACTIVE',
    FullName: 'Zero User',
    Address: null,
    LastLoginAt: null,
    CreatedAt: new Date('2026-07-01T00:00:00.000Z'),
    UpdatedAt: null,
    Roles: 'MEMBER',
    ActiveBorrowingCount: null,
    UnpaidFineTotal: null,
    OpenReservationCount: null,
  }]);

  await expect(userRepository.getManagedUserDetailById(8)).resolves.toMatchObject({
    relatedSummary: {
      activeBorrowingCount: 0,
      unpaidFineTotal: 0,
      openReservationCount: 0,
    },
  });

  useRecordset([]);
  await expect(userRepository.getManagedUserDetailById(999)).resolves.toBeNull();
});
```

- [ ] **Bước 4: Chạy kiểm thử chi tiết RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/userRepository.test.js
```

Dự kiến: lỗi hiển thị phương thức kho lưu trữ/trình xác thực chi tiết bị thiếu, ID lộ trình chuỗi,
việc sử dụng đọc lại cơ sở, tổng hợp bị thiếu và hành vi thiếu người dùng `400` hiện tại.

- [ ] **Bước 5: Thực hiện xác thực ID chi tiết và nối tuyến**

Tái sử dụng `positiveIdParam` và thêm:

```js
const getUserValidators = [
  positiveIdParam('userId', 'User ID'),
  handleValidationErrors,
];
```

Xuất nó và nối dây:

```js
const {
  listUsersValidators,
  getUserValidators,
  resendSetupValidators,
  assignRoleValidators,
  revokeRoleValidators,
} = require('../validators/userManagementValidators');

router.get('/:userId', ...requireAdmin, getUserValidators, controller.getUser);
```

- [ ] **Bước 6: Triển khai trình ánh xạ chi tiết và truy vấn chuyên dụng**

Thêm vào `backend/src/repositories/userRepository.js`:

```js
function mapManagedUserDetail(row) {
  const user = mapManagedUser(row);
  if (!user) {
    return null;
  }

  return {
    ...user,
    relatedSummary: {
      activeBorrowingCount: Number(row.ActiveBorrowingCount || 0),
      unpaidFineTotal: Number(row.UnpaidFineTotal || 0),
      openReservationCount: Number(row.OpenReservationCount || 0),
    },
  };
}

// @spec FR-FE11-002, BR-FE11-026
async function getManagedUserDetailById(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT
        u.UserId,
        u.Username,
        u.Email,
        u.Phone,
        u.Status,
        u.LastLoginAt,
        u.CreatedAt,
        u.UpdatedAt,
        up.FullName,
        up.Address,
        roleList.Roles,
        COALESCE((
          SELECT COUNT(*)
          FROM BorrowRequests br
          INNER JOIN BorrowDetails bd ON bd.RequestId = br.RequestId
          WHERE br.UserId = u.UserId
            AND bd.Status = 'BORROWED'
        ), 0) AS ActiveBorrowingCount,
        COALESCE((
          SELECT SUM(f.Amount - f.PaidAmount)
          FROM Fines f
          WHERE f.UserId = u.UserId
            AND f.Status = 'UNPAID'
        ), 0) AS UnpaidFineTotal,
        COALESCE((
          SELECT COUNT(*)
          FROM Reservations r
          WHERE r.UserId = u.UserId
            AND r.Status IN ('ACTIVE', 'NOTIFIED')
        ), 0) AS OpenReservationCount
      FROM Users u
      LEFT JOIN UserProfiles up ON up.UserId = u.UserId
      OUTER APPLY (
        SELECT STUFF((
          SELECT ',' + r.RoleName
          FROM UserRoles ur
          INNER JOIN Roles r ON r.RoleId = ur.RoleId
          WHERE ur.UserId = u.UserId
          ORDER BY r.RoleName
          FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS Roles
      ) roleList
      WHERE u.UserId = @UserId
    `);

  return mapManagedUserDetail(result.recordset[0]);
}
```

Xuất `getManagedUserDetailById`. Không thay đổi `getManagedUserById`; việc đọc lại thao tác ghi phải
không có bản tóm tắt.

- [ ] **Bước 7: Triển khai xác thực chi tiết dịch vụ và ánh xạ 404**

Chỉ thay thế `getUser`:

```js
async function getUser(userId) {
  // @spec FR-FE11-002, FR-FE11-016
  const parsedUserId = parsePositiveId(
    userId,
    'INVALID_USER_ID',
    'User id is invalid.'
  );
  const user = await userRepository.getManagedUserDetailById(parsedUserId);

  if (!user) {
    throw errors.notFound('USER_NOT_FOUND', 'User was not found.');
  }

  return user;
}
```

Không thay đổi trình trợ giúp `getExistingUser` được chia sẻ vì hành vi không tìm thấy cập nhật/hủy
kích hoạt nằm ngoài phần này.

- [ ] **Bước 8: Chạy chi tiết GREEN và kiểm tra hồi quy bị ảnh hưởng**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/userRepository.test.js tests/userRoleRepository.test.js
```

Dự kiến: tất cả các kiểm thử tập trung đều đạt; thao tác ghi vai trò giao dịch vẫn đọc lại hình dạng
`getManagedUserById` không có tóm tắt.

- [ ] **Bước 9: Đánh dấu FE11-U03/U04 là hoàn thành và cam kết**

```powershell
git add -- backend/tests/userManagementRoutes.test.js backend/tests/userManagementService.test.js backend/tests/userRepository.test.js backend/src/validators/userManagementValidators.js backend/src/routes/userManagementRoutes.js backend/src/services/userManagementService.js backend/src/repositories/userRepository.js .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "feat: add safe FE11 user detail summaries"
```

---

### Nhiệm vụ 4: Tìm nạp và hiển thị chi tiết người dùng thực trong giao diện người dùng quản trị

**Tệp:**
- Tạo: `frontend/test/userManagementFrontend.test.js`
- Sửa đổi: `frontend/test/userManagementApi.test.js`
- Sửa đổi: `frontend/src/utils/userManagementQuery.js`
- Sửa đổi: `frontend/src/api/userManagementApi.js`
- Sửa đổi: `frontend/src/page/UserManagement.jsx`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`

**Giao diện:**
- Tiêu thụ: hợp đồng chi tiết `GET /api/users/{userId}` máy chủ từ Nhiệm vụ 3.
- Tạo ra: `fetchManagedUser(userId)`, `isManagedUserNotFound(error)` và kết xuất ngăn kéo chi tiết từ DTO đã tìm nạp.

- [ ] **Bước 1: Viết kiểm thử hợp đồng thành phần, phân loại lỗi và API bị lỗi**

Mở rộng `frontend/test/userManagementApi.test.js`:

```js
import {
  buildManagedUserListParams,
  isManagedUserNotFound,
} from '../src/utils/userManagementQuery.js';

test('FE11 detail 404 classifier reads the wrapped Axios cause safely', () => {
  assert.equal(
    isManagedUserNotFound({ cause: { response: { status: 404 } } }),
    true,
  );
  assert.equal(
    isManagedUserNotFound({
      cause: { response: { status: 400, data: { error: { code: 'USER_NOT_FOUND' } } } },
    }),
    true,
  );
  assert.equal(isManagedUserNotFound(new Error('network failed')), false);
});

test('FE11 detail request uses the authorized request flow', async () => {
  const source = await readFile(apiPath, 'utf8');

  assert.match(
    source,
    /export async function fetchManagedUser\(userId\)[\s\S]*?authorizedRequest\(\{[\s\S]*?url: `\/users\/\$\{userId\}`/,
  );
});
```

Tạo `frontend/test/userManagementFrontend.test.js`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pagePath = new URL('../src/page/UserManagement.jsx', import.meta.url);

test('FE11 row selection fetches detail before opening the drawer', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /async function openUserDetail\(userId\)/);
  assert.match(source, /const detail = await fetchManagedUser\(userId\)/);
  assert.match(source, /setSelectedUser\(detail\)/);
  assert.match(source, /onClick=\{\(\) => openUserDetail\(user\.userId\)\}/);
  assert.doesNotMatch(source, /onClick=\{\(\) => setSelectedUser\(user\)\}/);
});

test('FE11 drawer renders all approved related summaries', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /selectedUser\.relatedSummary\?\.activeBorrowingCount/);
  assert.match(source, /selectedUser\.relatedSummary\?\.unpaidFineTotal/);
  assert.match(source, /selectedUser\.relatedSummary\?\.openReservationCount/);
  assert.match(source, /isManagedUserNotFound\(error\)[\s\S]*?await loadUsers\(pagination\.page\)/);
});
```

- [ ] **Bước 2: Chạy giao diện người dùng RED**

```powershell
node --test --test-name-pattern="FE11" frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js
```

Dự kiến: lỗi hiển thị chi tiết bị thiếu API, trình trợ giúp 404, trình tải lựa chọn hàng và hiển thị tóm tắt.

- [ ] **Bước 3: Triển khai chi tiết API và bộ phân loại 404 an toàn**

Nối vào `frontend/src/utils/userManagementQuery.js`:

```js
export function isManagedUserNotFound(error) {
  const response = error?.cause?.response;
  return response?.status === 404 || response?.data?.error?.code === 'USER_NOT_FOUND';
}
```

Thêm vào `frontend/src/api/userManagementApi.js`:

```js
export async function fetchManagedUser(userId) {
  try {
    const response = await authorizedRequest({
      method: 'get',
      url: `/users/${userId}`,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not load user details.'), { cause: error });
  }
}
```

- [ ] **Bước 4: Thực hiện tải chi tiết và khôi phục hàng cũ**

Thêm `fetchManagedUser` vào quá trình nhập API hiện có và nhập trình phân loại:

```js
import {
  createManagedUser,
  deactivateManagedUser,
  assignManagedUserRole,
  ensureManagedUserAccess,
  fetchAuditLogs,
  fetchManagedUser,
  fetchRoles,
  fetchUsers,
  revokeManagedUserRole,
  updateManagedUser,
} from '../api/userManagementApi';
import { isManagedUserNotFound } from '../utils/userManagementQuery';
```

Thêm vào bên trong `UserManagement`:

```js
async function openUserDetail(userId) {
  setSelectedUser(null);

  try {
    const detail = await fetchManagedUser(userId);
    setSelectedUser(detail);
  } catch (error) {
    setToast({ type: 'error', message: error.message });

    if (isManagedUserNotFound(error)) {
      await loadUsers(pagination.page);
    }
  }
}
```

Thay thế nhấp chuột vào hàng bằng:

```jsx
<tr key={user.userId} onClick={() => openUserDetail(user.userId)}>
```

Trình bao bọc hành động hàng hiện có tiếp tục dừng truyền, do đó, các hành động chỉnh sửa/vai
trò/hủy kích hoạt không kích hoạt tải chi tiết.

- [ ] **Bước 5: Kết xuất ba thẻ tóm tắt**

Chèn sau `.um-detail-list` và trước các hành động của ngăn kéo:

```jsx
<div className="um-related-summary">
  <div>
    <BookCopy size={17} />
    <span>Active borrowings</span>
    <strong>{selectedUser.relatedSummary?.activeBorrowingCount ?? 0}</strong>
  </div>
  <div>
    <Banknote size={17} />
    <span>Unpaid fines</span>
    <strong>{formatCurrency(selectedUser.relatedSummary?.unpaidFineTotal ?? 0)}</strong>
  </div>
  <div>
    <ClipboardList size={17} />
    <span>Open reservations</span>
    <strong>{selectedUser.relatedSummary?.openReservationCount ?? 0}</strong>
  </div>
</div>
```

Thêm vào khối kiểu hiện có của thành phần:

```css
.um-related-summary { display: grid; gap: 8px; margin: 0 0 24px; }
.um-related-summary > div { display: grid; grid-template-columns: 20px 1fr auto; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc; color: #475569; }
.um-related-summary strong { color: #0f172a; }
```

- [ ] **Bước 6: Chạy giao diện người dùng GREEN, kiểm tra mã và bản dựng**

```powershell
node --test --test-name-pattern="FE11" frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Dự kiến: tất cả các kiểm thử giao diện người dùng đều vượt qua; kiểm tra mã và thẻ xây dựng sản xuất; không
có sự phụ thuộc mới nào được thêm vào.

- [ ] **Bước 7: Đánh dấu FE11-U05 là hoàn thành và cam kết**

```powershell
git add -- frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js frontend/src/utils/userManagementQuery.js frontend/src/api/userManagementApi.js frontend/src/page/UserManagement.jsx .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "feat: load FE11 user detail in Admin UI"
```

---

### Nhiệm vụ 5: Xác thực, đối chiếu khoản nợ và ghi lại bằng chứng

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-user-role-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Sửa đổi: `TECH_DEBT.md`
- Tạo: `.sdd/reviews/fe11-safe-user-list-detail-validation-2026-07-18.md`

**Giao diện:**
- Tiêu thụ: đã hoàn thành bằng chứng kiểm thử và triển khai FE11-U01..U05.
- Tạo ra: bản ghi xác thực FE11-U06, `TD-014`/`TD-015` được thu hẹp và chuyển giao B1-B7 sẵn sàng cho người đánh giá mà không cần yêu cầu hoàn thành toàn bộ chức năng.

- [ ] **Bước 1: Chạy kiểm tra tập trung và hoàn toàn tự động**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/userRepository.test.js tests/userRoleRepository.test.js
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```

Dự kiến: tất cả các bộ tập trung/đầy đủ đều vượt qua, ngưỡng phủ sóng hiện có vượt qua, vượt qua
kiểm tra mã/xây dựng giao diện người dùng và khả năng truy vết vẫn đạt trong khi FE11 vẫn duy trì toàn bộ
chức năng `DEFERRED`.

- [ ] **Bước 2: Chạy kiểm tra bảo mật và vệ sinh**

```powershell
rg -n "passwordHash|tokenHash|refreshToken|sessionId|setupLink|resetLink|providerPayload|auditSecret" backend/src/repositories/userRepository.js backend/src/services/userManagementService.js backend/tests/userRepository.test.js frontend/src/api/userManagementApi.js frontend/src/page/UserManagement.jsx frontend/test
git diff --check
git status --short
```

Dự kiến: việc trùng khớp tên nhạy cảm chỉ xảy ra trong các kiểm thử trường cấm rõ ràng hoặc mã thiết
lập tài khoản không liên quan có sẵn; không có người lập bản đồ phản hồi nào trả sách chúng. Kiểm
tra khác biệt là sạch sẽ. Trạng thái vẫn hiển thị các tệp không liên quan có sẵn của bất kỳ người
dùng nào, các tệp này vẫn chưa được phân loại.

- [ ] **Bước 3: Đối chiếu tài liệu FE11 và nợ kỹ thuật**

Đánh dấu `FE11-U06` chỉ hoàn thành sau mỗi lệnh có sẵn. Cập nhật trạng thái hàng đầu của PLAN để nêu
rõ rằng việc thiết lập tài khoản, quản lý vai trò giao dịch và các lát cắt chi tiết/danh sách an
toàn đã hoàn tất trong khi công việc FE11 còn lại bị trì hoãn.

Cập nhật Bằng chứng hiện tại của TEST_PLAN với:

```markdown
- `backend/tests/userRepository.test.js` để biết danh sách/chi tiết an toàn DTO, tìm kiếm được phê duyệt SQL, các vị từ tổng hợp, giá trị mặc định bằng 0 và loại trừ cột thù địch.
- `backend/tests/userManagementService.test.js` để chuẩn hóa danh sách nghiêm ngặt và chi tiết `404 USER_NOT_FOUND`.
- `backend/tests/userManagementRoutes.test.js` để xác thực chi tiết/danh sách ưu tiên quản trị viên.
- `frontend/test/userManagementApi.test.js` và `frontend/test/userManagementFrontend.test.js` để bỏ sót truy vấn, `phoneNumber`, tải chi tiết, tóm tắt và khôi phục hàng cũ.
- Thiết kế được phê duyệt: `docs/superpowers/specs/2026-07-18-fe11-safe-user-list-detail-design.md`.
- Kế hoạch triển khai được phê duyệt: `docs/superpowers/plans/2026-07-18-fe11-safe-user-list-detail.md`.
```

Cập nhật `TECH_DEBT.md` như sau:

- Giữ `TD-012` MỞ và lưu ý rõ ràng rằng lát cắt này không thêm các trường thủ thư giả mạo hoặc di chuyển lược đồ.
- Thu hẹp `TD-014` vào phạm vi cập nhật/hủy kích hoạt còn lại và các ngữ nghĩa không tìm thấy/hành động quản trị viên không chi tiết khác; ghi lại chi tiết `404 USER_NOT_FOUND` làm bằng chứng đã được giải quyết.
- Thu hẹp `TD-015` trong phạm vi dịch vụ cập nhật/hủy kích hoạt/kiểm tra còn lại; ghi lại danh sách/kiểm tra dịch vụ chi tiết làm bằng chứng hoàn chỉnh.
- Giữ nguyên `TD-016` và `TD-017`.

Thêm mục nhập nhật ký thay đổi mô tả xác thực danh sách nghiêm ngặt, DTO an toàn, `phoneNumber`, các
trường tìm kiếm được phê duyệt, tổng hợp chi tiết, mức tiêu thụ chi tiết giao diện người dùng, bằng
chứng tự động và bằng chứng môi trường SQL Server còn sót lại.

- [ ] **Bước 4: Viết bản ghi xác nhận B1-B7**

Tạo `.sdd/reviews/fe11-safe-user-list-detail-validation-2026-07-18.md` với chính xác các phần sau:

```markdown
# Xác nhận danh sách và chi tiết người dùng an toàn FE11

Ngày: 2026-07-18
Phạm vi: chỉ FE11-U01..U06

## Bằng chứng tự động L1
## L2 Tuân thủ đặc tả
## L3 Hiến chương và an toàn
## L4 Nghiệm thu và rủi ro còn lại
## Tệp đã thay đổi
## Công việc FE11 còn lại
## Cổng rà soát của con người
```

Ghi lại kết quả lệnh chính xác và số lần kiểm tra từ Bước 1-2. Nêu rõ rằng kiểm tra kho lưu trữ xác
minh SQL được tham số hóa và ánh xạ được phát ra, trong khi lượt đọc tổng hợp SQL Server thực vẫn là
kiểm tra dư lượng phụ thuộc vào môi trường nếu không có phiên bản dùng một lần. Không yêu cầu hoàn
thành toàn bộ chức năng FE11.

- [ ] **Bước 5: Cam kết bằng chứng xác thực**

```powershell
git add -- .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md TECH_DEBT.md .sdd/reviews/fe11-safe-user-list-detail-validation-2026-07-18.md
git commit -m "docs: record FE11 safe user read validation"
```

## Danh sách kiểm tra đánh giá cuối cùng

- [ ] Việc triển khai bắt đầu từ `origin/main` hiện tại cộng với chỉ các cam kết về thiết kế/kế hoạch đã được phê duyệt.
- [ ] Mọi thay đổi về hành vi sản xuất đều được thực hiện trước một kiểm thử thất bại tập trung.
- [ ] Xác thực và ủy quyền của Quản trị viên chạy trước khi xác thực danh sách/chi tiết.
- [ ] Các giá trị phân trang/bộ lọc/tìm kiếm/ID được cung cấp không hợp lệ sẽ bị từ chối thay vì bị kẹp.
- [ ] Tìm kiếm chỉ sử dụng email, tên đầy đủ và ID người dùng; đặt hàng ổn định.
- [ ] Phản hồi cơ bản của người dùng được quản lý chỉ sử dụng danh sách cho phép rõ ràng và `phoneNumber`.
- [ ] Vai trò là các chuỗi chữ hoa xác định.
- [ ] Danh sách các mục và các lần đọc lại thao tác ghi không chứa `relatedSummary`.
- [ ] Chi tiết chứa chính xác ba bản tóm tắt bằng số đã được phê duyệt với giá trị mặc định bằng 0.
- [ ] Số lượng lượt mượn đang hoạt động vẫn tồn tại `BORROWED`; số lượng đặt chỗ mở `ACTIVE`/`NOTIFIED`; tổng số chưa thanh toán sử dụng số dư chưa thanh toán `UNPAID`.
- [ ] Thiếu chi tiết trả về `404 USER_NOT_FOUND`; ID không hợp lệ trả về `400 VALIDATION_ERROR`.
- [ ] Giao diện người dùng quản trị tìm nạp chi tiết, hiển thị tóm tắt và tải lại dữ liệu danh sách cũ sau chi tiết 404.
- [ ] Không có trường thông tin xác thực, mã thông báo, phiên, liên kết, nhà cung cấp hoặc trường kiểm tra bí mật nào xuất hiện trong phản hồi.
- [ ] Không có sự di chuyển cơ sở dữ liệu hoặc trình giữ chỗ trường thủ thư giả mạo nào được đưa vào.
- [ ] Các kiểm thử giao diện người dùng và máy chủ tập trung/đầy đủ, phạm vi bảo hiểm, tìm lỗi mã nguồn, bản dựng, truy vết, quét bảo mật và kiểm tra khác biệt đều vượt qua.
- [ ] `TD-014/015` được thu hẹp mà không che giấu những khoảng trống FE11 còn lại; `TD-012` vẫn mở.
- [ ] Không có tệp người dùng không liên quan nào được môi trường tiền sản xuất hoặc cam kết.
