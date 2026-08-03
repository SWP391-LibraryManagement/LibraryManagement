# FE07-FE08-FE10-FE12 Kế hoạch triển khai an toàn-đánh giá mã sạch

> **Đối với nhân viên đại lý:** BẮT BUỘC SUB-SKILL: Sử dụng `executing-plans` để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Cải thiện khả năng xem xét của FE07, FE08, FE10 và FE12 mà không thay đổi hành vi kinh
doanh, hợp đồng API, lược đồ SQL, tuyến giao diện người dùng hoặc cấu hình thời gian chạy Azure.

**Kiến trúc:** Chỉ trích xuất logic truy cập, ánh xạ, dọn dẹp và trình chiếu báo cáo thuần túy từ
các dịch vụ/kho lưu trữ lớn. Giữ SQL, các giao dịch, điều phối, chuyển đổi trạng thái và xuất khẩu
công khai trong chủ sở hữu hiện tại của chúng. Ổn định trình tải FE08 bằng ranh giới gọi lại/ref
giúp loại bỏ cảnh báo hook hiện có mà không cần thêm vòng lặp tải lại.

**Tech bộ công nghệ:** Node.js 22, phần máy chủ CommonJS, Express, Jest, React 19, Vite, ESLint, các kiểm
thử giao diện người dùng tích hợp Node.

## Ràng buộc toàn cầu

- mốc cơ sở là `origin/main@7dc563a95ff178239a90e47fe1899e21c24a49ef`.
- Giữ nguyên tất cả các hình dạng yêu cầu/phản hồi FE07/FE08/FE10/FE12 API và mã lỗi.
- Giữ nguyên văn bản truy vấn SQL, khóa, thứ tự giao dịch, thứ tự kiểm tra, lược đồ và cấu hình Azure.
- Giữ nguyên ngữ nghĩa ngày làm việc của `Asia/Ho_Chi_Minh`.
- Duy trì hành vi thông báo sau cam kết của FE10 và hành vi chuyển giao cũ của FE08.
- Không thêm phần phụ thuộc và không thực hiện định dạng không liên quan hoặc trình tái cấu trúc lớp bao chung.
- Theo dõi RED-GREEN cho mỗi lần trích xuất sản xuất.
- Không cam kết các thay đổi sản xuất đã tạo cho đến khi khác biệt hoàn chỉnh vượt qua H2.

---

### Nhiệm vụ 1: Trích xuất ranh giới truy cập chức năng dùng chung

**Tệp:**

- Tạo: `backend/src/utils/featureAccess.js`
- Tạo: `backend/tests/featureAccess.test.js`
- Sửa đổi: `backend/src/services/borrowingService.js`
- Sửa đổi: `backend/src/services/reservationService.js`
- Sửa đổi: `backend/src/services/notificationService.js`
- Sửa đổi: `backend/src/services/reportService.js`

**Giao diện:**

- Sản xuất: `normalizeRole(role)`, `hasAnyRole(user, allowedRoles)` và `toPositiveInteger(value, fieldName)`.
- Người tiêu dùng giữ danh sách vai trò hiện tại của họ và xử lý lỗi.
- `toPositiveInteger` giữ mã lỗi `INVALID_ID` và thông báo tiếng Anh hiện có.

- [ ] **Bước 1: Viết kiểm thử tiện ích không thành công**

```js
const {
  normalizeRole,
  hasAnyRole,
  toPositiveInteger,
} = require('../src/utils/featureAccess');

describe('featureAccess', () => {
  test('normalizes roles without changing the caller role policy', () => {
    expect(normalizeRole(' librarian ')).toBe(' LIBRARIAN ');
    expect(hasAnyRole({ roles: ['member', 'LIBRARIAN'] }, ['admin', 'librarian'])).toBe(true);
    expect(hasAnyRole({ roles: ['MEMBER'] }, ['ADMIN', 'LIBRARIAN'])).toBe(false);
  });

  test('keeps the canonical positive ID validation error', () => {
    expect(toPositiveInteger('12', 'copyId')).toBe(12);
    try {
      toPositiveInteger(0, 'copyId');
      throw new Error('Expected invalid ID rejection.');
    } catch (error) {
      expect(error).toMatchObject({ statusCode: 400, code: 'INVALID_ID' });
      expect(error.message).toBe('copyId must be a positive integer.');
    }
  });
});
```

- [ ] **Bước 2: Xác minh RED**

Chạy: `npm --prefix backend test -- --runInBand tests/featureAccess.test.js`

Dự kiến: THẤT BẠI vì `backend/src/utils/featureAccess.js` không tồn tại.

- [ ] **Bước 3: Thêm tiện ích tối thiểu**

```js
const errors = require('./safeErrors');

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

function hasAnyRole(user, allowedRoles) {
  const currentRoles = Array.isArray(user?.roles) ? user.roles.map(normalizeRole) : [];
  return allowedRoles.map(normalizeRole).some((role) => currentRoles.includes(role));
}

function toPositiveInteger(value, fieldName) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw errors.badRequest('INVALID_ID', `${fieldName} must be a positive integer.`);
  }
  return numberValue;
}

module.exports = { normalizeRole, hasAnyRole, toPositiveInteger };
```

Chỉ xóa các định nghĩa cục bộ giống hệt nhau. Nhập `hasAnyRole`/`toPositiveInteger` vào FE07 và
FE08; nhập `hasAnyRole` trong FE10 và FE12.

- [ ] **Bước 4: Xác minh GREEN và ủy quyền chức năng**

Chạy:

```powershell
npm --prefix backend test -- --runInBand tests/featureAccess.test.js tests/borrowingRoutes.test.js tests/reservationRoutes.test.js tests/notificationRoutes.test.js tests/reportRoutes.test.js
```

Dự kiến: tất cả các bộ đã chọn ĐẠT với xác nhận vai trò/lỗi không thay đổi.

- [ ] **Bước 5: Xem lại điểm kiểm tra**

Chạy: `git diff --check`

Dự kiến: không có lỗi khoảng trắng. Để lại sự khác biệt của sản phẩm không được cam kết.

### Nhiệm vụ 2: Trích xuất dự báo vay FE07

**Tệp:**

- Tạo: `backend/src/utils/borrowingProjection.js`
- Tạo: `backend/tests/borrowingProjection.test.js`
- Sửa đổi: `backend/src/repositories/borrowingRepository.js`

**Giao diện:**

- Sản xuất: `mapCopy`, `mapBorrowability`, `mapMember`, `toDateOnly`,
  `toExclusiveNextDay`, `mapBorrowDetail` và `mapBorrowRequests`.
- FE07 xuất kho lưu trữ, SQL, phương thức giao dịch và các trường JSON được trả về
  vẫn không thay đổi.

- [ ] **Bước 1: Viết kiểm thử trình chiếu không thành công**

```js
const {
  mapBorrowability,
  mapBorrowDetail,
  mapBorrowRequests,
  toExclusiveNextDay,
} = require('../src/utils/borrowingProjection');

const row = {
  RequestId: 10,
  UserId: 3,
  RequestStatus: 'APPROVED',
  BorrowDetailId: 20,
  CopyId: 30,
  BookId: 40,
  Barcode: 'BC-30',
  CopyStatus: 'BORROWED',
  BookStatus: 'ACTIVE',
  DetailStatus: 'BORROWED',
  BorrowDate: '2026-07-01T00:00:00.000Z',
  DueDate: '2026-07-15T00:00:00.000Z',
  HasMemberRole: 1,
  ActiveReservationId: 50,
};

test('maps FE07 rows without inventing fields', () => {
  expect(mapBorrowability(row)).toMatchObject({
    copyId: 30,
    bookId: 40,
    hasActiveReservation: true,
  });
  expect(mapBorrowDetail(row)).toMatchObject({
    borrowDetailId: 20,
    borrowDate: '2026-07-01',
    dueDate: '2026-07-15',
    status: 'BORROWED',
  });
  expect(mapBorrowRequests([row])).toHaveLength(1);
});

test('keeps FE07 exclusive end-date calculation in UTC', () => {
  expect(toExclusiveNextDay('2026-07-15T00:00:00.000Z').toISOString())
    .toBe('2026-07-16T00:00:00.000Z');
});
```

- [ ] **Bước 2: Xác minh RED**

Chạy: `npm --prefix backend test -- --runInBand tests/borrowingProjection.test.js`

Dự kiến: THẤT BẠI vì mô-đun trình chiếu không tồn tại.

- [ ] **Bước 3: Di chuyển nguyên văn các hàm thuần túy hiện có**

Di chuyển bảy chức năng hiện có từ `borrowingRepository.js` sang `borrowingProjection.js`. Giữ chú
thích `// @spec FR-FE07-029` hiện tại trên `mapBorrowDetail`. Xuất bảy tên và nhập chúng ở đầu kho:

```js
function mapCopy(row) {
  if (!row || !row.CopyId) return null;
  return {
    copyId: row.CopyId,
    bookId: row.BookId,
    barcode: row.Barcode,
    status: row.CopyStatus,
    bookStatus: row.BookStatus,
    location: row.Location,
    title: row.Title,
    author: row.AuthorName,
  };
}

function mapBorrowability(row) {
  const copy = mapCopy(row);
  if (!copy) return null;
  return {
    ...copy,
    hasActiveReservation: Boolean(row.ActiveReservationId),
    notifiedReservationId: row.NotifiedReservationId || null,
    notifiedReservationUserId: row.NotifiedReservationUserId || null,
  };
}

function mapMember(row) {
  return {
    userId: row.UserId,
    username: row.Username,
    fullName: row.FullName,
    email: row.Email,
    phone: row.Phone,
    memberId: row.MemberId,
    status: row.UserStatus,
    hasMemberRole: Boolean(row.HasMemberRole),
  };
}

function toDateOnly(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : null;
}

function toExclusiveNextDay(value) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

// @spec FR-FE07-029
function mapBorrowDetail(row) {
  if (!row || !row.BorrowDetailId) return null;
  return {
    borrowDetailId: row.BorrowDetailId,
    requestId: row.RequestId,
    userId: row.UserId,
    copyId: row.CopyId,
    borrowDate: toDateOnly(row.BorrowDate),
    dueDate: toDateOnly(row.DueDate),
    returnDate: toDateOnly(row.ReturnDate),
    renewalCount: row.RenewalCount,
    requestStatus: row.RequestStatus,
    status: row.DetailStatus,
    requestDate: row.RequestDate,
    approvedAt: row.ApprovedAt,
    rejectedAt: row.RejectedAt,
    processedAt: row.ProcessedAt,
    requestCreatedAt: row.RequestCreatedAt,
    requestUpdatedAt: row.RequestUpdatedAt,
    createdAt: row.DetailCreatedAt,
    updatedAt: row.DetailUpdatedAt,
    member: mapMember(row),
    copy: mapCopy(row),
  };
}

function mapBorrowRequests(rows) {
  const requestsById = new Map();
  for (const row of rows) {
    if (!requestsById.has(row.RequestId)) {
      requestsById.set(row.RequestId, {
        requestId: row.RequestId,
        userId: row.UserId,
        requestDate: row.RequestDate,
        status: row.RequestStatus,
        createdBy: row.CreatedBy,
        approvedBy: row.ApprovedBy,
        approvedAt: row.ApprovedAt,
        rejectedAt: row.RejectedAt,
        processedAt: row.ProcessedAt,
        createdAt: row.RequestCreatedAt,
        updatedAt: row.RequestUpdatedAt,
        member: mapMember(row),
        details: [],
      });
    }
    const detail = mapBorrowDetail(row);
    if (detail) requestsById.get(row.RequestId).details.push(detail);
  }
  return Array.from(requestsById.values());
}

module.exports = {
  mapCopy,
  mapBorrowability,
  mapMember,
  toDateOnly,
  toExclusiveNextDay,
  mapBorrowDetail,
  mapBorrowRequests,
};
```

Sau đó nhập kho lưu trữ của người tiêu dùng:

```js
const {
  mapBorrowability,
  mapBorrowDetail,
  mapBorrowRequests,
  toExclusiveNextDay,
} = require('../utils/borrowingProjection');
```

Chỉ nhập các chức năng được kho lưu trữ sử dụng trực tiếp; các chức năng chiếu nội bộ vẫn ở chế độ
riêng tư đối với tiện ích mới nếu có thể.

- [ ] **Bước 4: Xác minh GREEN và hoạt động của kho lưu trữ**

Chạy:

```powershell
npm --prefix backend test -- --runInBand tests/borrowingProjection.test.js tests/borrowingRepository.test.js tests/borrowingRoutes.test.js
```

Dự kiến: tất cả các dãy được chọn ĐẠT.

- [ ] **Bước 5: Xem lại điểm kiểm tra**

Chạy: `git diff --check`

Dự kiến: không có lỗi khoảng trắng. Để lại sự khác biệt của sản phẩm không được cam kết.

### Nhiệm vụ 3: Trích xuất chính sách thông báo FE10

**Tệp:**

- Tạo: `backend/src/utils/notificationPolicy.js`
- Tạo: `backend/tests/notificationPolicy.test.js`
- Sửa đổi: `backend/src/services/notificationService.js`

**Giao diện:**

- Sản xuất: `normalizePayloadKey`, `containsSensitivePayloadKey`,
`sanitizePayload`, `normalizeSourceFeature`, `isValidRecipientEmail`,
`isSensitiveQueueNotification`, `extractVariables`, `validateStoredTemplateDefinition` và
`renderTemplate`.
- `notificationService.js` tiếp tục xuất `sanitizePayload`.
- Các giao diện phân phối, kiên trì, thử lại, kiểm tra và dịch vụ của nhà máy vẫn còn
  không thay đổi.

- [ ] **Bước 1: Viết các kiểm thử chính sách không thành công**

```js
const {
  containsSensitivePayloadKey,
  sanitizePayload,
  validateStoredTemplateDefinition,
  renderTemplate,
} = require('../src/utils/notificationPolicy');

test('detects and redacts nested sensitive notification data', () => {
  const payload = { profile: { reset_token: 'secret', name: '<b>Nhat</b>' } };
  expect(containsSensitivePayloadKey(payload)).toBe(true);
  expect(sanitizePayload(payload)).toEqual({
    profile: { reset_token: '[REDACTED]', name: 'bNhat/b' },
  });
});

test('rejects unsafe stored templates and renders safe text', () => {
  try {
    validateStoredTemplateDefinition({
      subject: 'Hello',
      body: '<script>alert(1)</script>',
    });
    throw new Error('Expected unsafe template rejection.');
  } catch (error) {
    expect(error).toMatchObject({
      statusCode: 400,
      code: 'UNSAFE_TEMPLATE_DEFINITION',
    });
  }
  expect(renderTemplate('Hello {{ name }}', { name: '<Nhat>' })).toBe('Hello Nhat');
});
```

- [ ] **Bước 2: Xác minh RED**

Chạy: `npm --prefix backend test -- --runInBand tests/notificationPolicy.test.js`

Dự kiến: THẤT BẠI vì mô-đun chính sách không tồn tại.

- [ ] **Bước 3: Di chuyển nguyên văn chính sách thuần tuý**

Di chuyển `sensitiveQueueIdentifiers`, `sensitiveKeyFragments` và chín chức năng giao diện từ
`notificationService.js` sang `notificationPolicy.js`. Giữ `safeInternalError` và
`isUniqueConstraintViolation` trong dịch vụ vì chúng thuộc về điều phối dịch vụ.

Tạo chính sách với hành vi hiện có chính xác:

```js
const errors = require('./safeErrors');

const sensitiveQueueIdentifiers = new Set([
  'ACCOUNT_VERIFICATION',
  'PASSWORD_RESET',
  'ACCOUNT_SETUP',
  'EMAIL_VERIFY',
]);
const sensitiveKeyFragments = [
  'token',
  'otp',
  'password',
  'verificationlink',
  'resetlink',
  'setuplink',
];

function sanitizeString(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/[<>]/g, '');
}

function normalizePayloadKey(key) {
  return String(key || '').toLowerCase().replace(/[_\-\s]/g, '');
}

function isSensitivePayloadKey(key) {
  const normalizedKey = normalizePayloadKey(key);
  return sensitiveKeyFragments.some((fragment) => normalizedKey.includes(fragment));
}

function containsSensitivePayloadKey(payload) {
  if (Array.isArray(payload)) return payload.some(containsSensitivePayloadKey);
  if (!payload || typeof payload !== 'object') return false;
  return Object.entries(payload).some(
    ([key, value]) => isSensitivePayloadKey(key) || containsSensitivePayloadKey(value)
  );
}

function sanitizePayload(payload) {
  if (Array.isArray(payload)) return payload.map(sanitizePayload);
  if (!payload || typeof payload !== 'object') {
    return typeof payload === 'string' ? sanitizeString(payload) : payload;
  }
  const result = {};
  for (const [key, value] of Object.entries(payload)) {
    result[key] = isSensitivePayloadKey(key) ? '[REDACTED]' : sanitizePayload(value);
  }
  return result;
}

function normalizeSourceFeature(sourceFeature) {
  return String(sourceFeature || '').trim().toUpperCase();
}

function isValidRecipientEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

function isSensitiveQueueNotification(notification) {
  return [notification?.type, notification?.templateKey].some((identifier) =>
    sensitiveQueueIdentifiers.has(String(identifier || '').toUpperCase())
  );
}

function extractVariables(templateText) {
  const variables = new Set();
  const pattern = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
  let match = pattern.exec(templateText || '');
  while (match) {
    variables.add(match[1]);
    match = pattern.exec(templateText || '');
  }
  return Array.from(variables);
}

function containsUnsafeTemplateDefinition(value) {
  const definition = String(value ?? '');
  return /<\/?[a-z][^>]*>/i.test(definition)
    || /\bon[a-z]+\s*=/i.test(definition)
    || /\bjavascript\s*:/i.test(definition);
}

// @spec BR-FE10-010, FR-FE10-005, FR-FE10-009
function validateStoredTemplateDefinition(template) {
  if (
    containsUnsafeTemplateDefinition(template?.subject)
    || containsUnsafeTemplateDefinition(template?.body)
  ) {
    throw errors.badRequest(
      'UNSAFE_TEMPLATE_DEFINITION',
      'Notification template definition is unsafe.'
    );
  }
}

function renderTemplate(templateText, templateData) {
  return sanitizeString(
    String(templateText || '').replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) =>
      templateData[key] === undefined || templateData[key] === null ? '' : templateData[key]
    )
  );
}

module.exports = {
  normalizePayloadKey,
  containsSensitivePayloadKey,
  sanitizePayload,
  normalizeSourceFeature,
  isValidRecipientEmail,
  isSensitiveQueueNotification,
  extractVariables,
  validateStoredTemplateDefinition,
  renderTemplate,
};
```

Ở đầu dịch vụ, nhập tên chính sách chính xác:

```js
const {
  normalizePayloadKey,
  containsSensitivePayloadKey,
  sanitizePayload,
  normalizeSourceFeature,
  isValidRecipientEmail,
  isSensitiveQueueNotification,
  extractVariables,
  validateStoredTemplateDefinition,
  renderTemplate,
} = require('../utils/notificationPolicy');
```

- [ ] **Bước 4: Xác minh hành vi GREEN và FE10**

Chạy:

```powershell
npm --prefix backend test -- --runInBand tests/notificationPolicy.test.js tests/notificationRoutes.test.js tests/notificationInboxRepository.test.js
```

Dự kiến: tất cả các bộ đã chọn ĐẠT với các hợp đồng biên tập và lỗi FE10 không thay đổi.

- [ ] **Bước 5: Xem lại điểm kiểm tra**

Chạy: `git diff --check`

Dự kiến: không có lỗi khoảng trắng. Để lại sự khác biệt của sản phẩm không được cam kết.

### Nhiệm vụ 4: Trích xuất các phép chiếu báo cáo FE12

**Tệp:**

- Tạo: `backend/src/utils/reportProjection.js`
- Tạo: `backend/tests/reportProjection.test.js`
- Sửa đổi: `backend/src/repositories/reportRepository.js`
- Sửa đổi: `backend/src/services/reportService.js`

**Giao diện:**

- Sản xuất: `toDateKey`, `normalizeStatus`, `pagination`, `buildReport`,
  `getResultset`, `toCountMap` và `toExclusiveNextDay`.
- FE12 phong bì báo cáo vẫn còn `{ metrics, rows, page, limit, totalRows }`.
- Trình bao bọc `requireAdminOrApprovedStaff` trùng lặp bị xóa; cả bốn
  báo cáo đọc tiếp tục gọi chính sách vai trò `requireStaff` tương tự.

- [ ] **Bước 1: Viết kiểm thử trình chiếu không thành công**

```js
const {
  pagination,
  buildReport,
  getResultset,
  toCountMap,
  toExclusiveNextDay,
} = require('../src/utils/reportProjection');

test('keeps FE12 pagination and report envelopes stable', () => {
  expect(pagination({ page: 2, limit: 25 })).toEqual({ page: 2, limit: 25, offset: 25 });
  expect(buildReport({ total: 1 }, [{ id: 1 }], { page: 2, limit: 25 }, 51))
    .toEqual({
      metrics: { total: 1 },
      rows: [{ id: 1 }],
      page: 2,
      limit: 25,
      totalRows: 51,
    });
});

test('keeps FE12 resultset, count, and UTC date projections stable', () => {
  expect(getResultset({ recordsets: [[{ id: 1 }]] }, 0, 0)).toEqual([{ id: 1 }]);
  expect(toCountMap([{ Status: 'active', Count: 2 }], 'Status', 'Count', new Set(['ACTIVE'])))
    .toEqual({ ACTIVE: 2 });
  expect(toExclusiveNextDay('2026-07-15T00:00:00.000Z').toISOString())
    .toBe('2026-07-16T00:00:00.000Z');
});
```

- [ ] **Bước 2: Xác minh RED**

Chạy: `npm --prefix backend test -- --runInBand tests/reportProjection.test.js`

Dự kiến: THẤT BẠI vì mô-đun trình chiếu không tồn tại.

- [ ] **Bước 3: Di chuyển nguyên văn các hàm thuần túy hiện có**

Di chuyển bảy chức năng chiếu hiện có từ `reportRepository.js` sang `reportProjection.js`, giữ lại
`// @spec FR-FE12-010` trên `buildReport`. Nhập tất cả bảy ở đầu kho lưu trữ. Chỉ xóa
`requireAdminOrApprovedStaff` khỏi `reportService.js` và gọi `requireStaff` từ `getUserStatistics`.

Tạo mô-đun chiếu:

```js
function toDateKey(value) {
  if (value == null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function normalizeStatus(value, allowedStatuses) {
  if (value == null) return null;
  const normalized = String(value).toUpperCase();
  return allowedStatuses.has(normalized) ? normalized : 'UNKNOWN';
}

function pagination(filters = {}) {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  return { page, limit, offset: (page - 1) * limit };
}

// @spec FR-FE12-010
function buildReport(metrics, rows, filters = {}, totalRows = rows.length) {
  const { page, limit } = pagination(filters);
  return { metrics, rows, page, limit, totalRows };
}

function getResultset(result, index, pageIndex) {
  if (Array.isArray(result.recordsets)) return result.recordsets[index] || [];
  return index === pageIndex ? result.recordset || [] : [];
}

function toCountMap(rows, keyName, countName, allowedStatuses) {
  const counts = {};
  for (const row of rows) {
    const key = allowedStatuses
      ? normalizeStatus(row[keyName], allowedStatuses)
      : toDateKey(row[keyName]);
    if (key) counts[key] = (counts[key] || 0) + Number(row[countName] || 0);
  }
  return counts;
}

function toExclusiveNextDay(value) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

module.exports = {
  toDateKey,
  normalizeStatus,
  pagination,
  buildReport,
  getResultset,
  toCountMap,
  toExclusiveNextDay,
};
```

- [ ] **Bước 4: Xác minh hành vi GREEN và FE12**

Chạy:

```powershell
npm --prefix backend test -- --runInBand tests/reportProjection.test.js tests/reportRepository.test.js tests/reportInMemoryParity.test.js tests/reportRoutes.test.js
```

Dự kiến: tất cả các bộ đã chọn ĐẠT với các lỗi vai trò và phong bì FE12 không thay đổi.

- [ ] **Bước 5: Xem lại điểm kiểm tra**

Chạy: `git diff --check`

Dự kiến: không có lỗi khoảng trắng. Để lại sự khác biệt của sản phẩm không được cam kết.

### Nhiệm vụ 5: Ổn định bộ tải đặt chỗ FE08

**Tệp:**

- Sửa đổi: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`
- Sửa đổi: `frontend/test/reservationFrontend.test.js`

**Giao diện:**

- `loadReservations()` vẫn là trình xử lý tải ban đầu, làm mới thủ công,
  tải lại xung đột, tải lại thông báo và quy trình làm việc hết hạn.
- Trình tải đọc bản sao hàng đợi được chọn mới nhất thông qua
  `queueCopyIdRef.current`.
- Hiệu ứng tải ban đầu phụ thuộc vào lệnh gọi lại ổn định và không chạy trong
  thay đổi lựa chọn hàng đợi thông thường.

- [ ] **Bước 1: Thêm hợp đồng nguồn bị lỗi**

```js
test('FE08 loader has a stable hook boundary without queue-selection reloads', () => {
  const source = read('src/page/reservation/ReservationsLibrarianPage.jsx');
  const loaderStart = source.indexOf('const loadReservations = useCallback');
  const loaderEnd = source.indexOf('\n\n  useEffect(() => {', loaderStart);
  const loaderSource = source.slice(loaderStart, loaderEnd);

  assert.match(source, /useCallback/);
  assert.match(source, /const queueCopyIdRef = useRef\(initialQueueCopyId\)/);
  assert.match(loaderSource, /const loadReservations = useCallback\(async \(\) =>/);
  assert.match(loaderSource, /currentCopyId: queueCopyIdRef\.current/);
  assert.match(loaderSource, /\}, \[\]\);/);
  assert.match(source, /\}, \[loadReservations\]\);/);
});
```

- [ ] **Bước 2: Xác minh RED**

Chạy:

```powershell
npm --prefix frontend test -- --test-name-pattern "stable hook boundary"
```

Dự kiến: THẤT BẠI vì `loadReservations` hiện là hàm cục bộ không ổn định và phần phụ thuộc hiệu ứng trống.

- [ ] **Bước 3: Triển khai ranh giới gọi lại/ref ổn định**

Sử dụng hình dạng bộ tải hoàn chỉnh sau:

```jsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const [queueCopyId, setQueueCopyId] = useState(initialQueueCopyId);
const queueCopyIdRef = useRef(initialQueueCopyId);

useEffect(() => {
  queueCopyIdRef.current = queueCopyId;
}, [queueCopyId]);

const loadReservations = useCallback(async () => {
  setLoading(true);
  setLoadError('');
  try {
    const allReservations = [];
    let page = 1;
    let totalApiPages = 1;

    do {
      const data = await reservationApi.listAll({
        page,
        limit: RESERVATION_API_PAGE_SIZE,
      });
      allReservations.push(...(data.reservations || []));
      totalApiPages = Number(data.pagination?.totalPages || 0);
      page += 1;
    } while (page <= totalApiPages);

    const mapped = allReservations.map(mapReservation);
    setRows(mapped);
    setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
    const handoffState = resolveReservationQueueHandoff({
      pendingCopyId: pendingHandoffCopyId.current,
      currentCopyId: queueCopyIdRef.current,
      reservations: mapped,
    });
    setQueueCopyId(handoffState.queueCopyId);
    setQueueNotice(handoffState.notice);
    if (handoffState.consumePendingHandoff) {
      pendingHandoffCopyId.current = null;
    }
  } catch (error) {
    setRows([]);
    setLoadError(error.message || 'Không thể tải dữ liệu đặt chỗ.');
    setLastUpdated('');
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  const timer = window.setTimeout(loadReservations, 0);
  return () => window.clearTimeout(timer);
}, [loadReservations]);
```

- [ ] **Bước 4: Xác minh hành vi GREEN, kiểm tra mã và FE08**

Chạy:

```powershell
npm --prefix frontend test -- --test-name-pattern "stable hook boundary|handoff|reservation"
npm --prefix frontend run lint
```

Dự kiến: các kiểm thử tập trung đạt và ESLint không báo cáo cảnh báo nào.

- [ ] **Bước 5: Xem lại điểm kiểm tra**

Chạy: `git diff --check`

Dự kiến: không có lỗi khoảng trắng. Để lại sự khác biệt của sản phẩm không được cam kết.

### Nhiệm vụ 6: Xác minh đầy đủ và chuyển giao H2

**Tệp:** Chỉ xác minh; chỉ cập nhật các hộp kiểm/bằng chứng của kế hoạch này nếu quản trị kho lưu
trữ yêu cầu nó trước H2.

**Giao diện:** Không có giao diện thời gian chạy mới.

- [ ] **Bước 1: Chạy kiểm thử chức năng mục tiêu tập trung**

```powershell
npm --prefix backend test -- --runInBand tests/featureAccess.test.js tests/borrowingProjection.test.js tests/borrowingRepository.test.js tests/borrowingRoutes.test.js tests/reservationRoutes.test.js tests/notificationPolicy.test.js tests/notificationRoutes.test.js tests/notificationInboxRepository.test.js tests/reportProjection.test.js tests/reportRepository.test.js tests/reportInMemoryParity.test.js tests/reportRoutes.test.js
npm --prefix frontend test -- --test-name-pattern "FE07|FE08|FE10|FE12|borrowing|reservation|notification|report"
```

Dự kiến: tất cả các kiểm thử tập trung ĐẠT.

- [ ] **Bước 2: Chạy cổng kho đầy đủ**

```powershell
npm --prefix backend test -- --runInBand
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
npm run test:secrets
npm run test:deployment
npm run trace:enforce
git diff --check
```

Dự kiến: tất cả các lệnh đều thoát khỏi `0`, phần máy chủ còn lại ít nhất 1.127 lượt kiểm tra, giao
diện người dùng còn lại ít nhất 271 lượt kiểm tra và kiểm tra mã không có cảnh báo nào.

- [ ] **Bước 3: Xác minh phạm vi và hợp đồng**

Chạy:

```powershell
git status --short
git diff --stat
git diff --name-only
```

Dự kiến: chỉ có các tiện ích, dịch vụ, kho lưu trữ FE07/FE08/FE10/FE12 đã được phê duyệt, trang/kiểm
tra FE08 và bằng chứng thiết kế/kế hoạch. Không có bộ điều khiển, tuyến đường, bộ chuyển đổi API,
SQL, di chuyển, `.env`, quy trình công việc hoặc thay đổi tệp Azure.

- [ ] **Bước 4: Chuẩn bị bằng chứng H2**

Chỉ tính toán dấu vân tay khác biệt theo giai đoạn sau khi xem xét khác biệt hoàn toàn không được
cam kết. Không cam kết, đẩy, xuất bản PR, hợp nhất hoặc triển khai trước cổng H2/H3 được yêu cầu.
