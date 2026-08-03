# Kế hoạch thực hiện kiểm tra tích hợp hệ thống

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Xây dựng bằng chứng tích hợp hệ thống có thể lặp lại cho các quy trình làm việc FE07,
FE08, FE09, FE10 và FE12 đã hoàn thành, cùng với đường dẫn demo xác định ngắn để trình bày dự án.

**Kiến trúc:** Sử dụng hai lớp xác minh. Lớp A mở rộng khai thác tích hợp trong bộ nhớ
Express/Supertest hiện có để xác định nhanh API và kiểm tra luồng vai trò trong CI. Lớp B sử dụng bộ
SQL Server có kiểm soát thao tác ghi để chứng minh rằng các mô-đun mượn, đặt chỗ, phạt, thông báo và báo
cáo tuân theo cùng các bản ghi liên tục mà không cần dựa vào các cầu nối trạng thái chỉ kiểm tra. Sổ
tay demo thủ công sử dụng lại cùng một ID kịch bản và kết quả mong đợi.

**Tech bộ công nghệ:** Node.js 22, Express, Jest, Supertest, React/Vite, SQL Server, GitHub hành động, các
trình trợ giúp kho lưu trữ trong bộ nhớ hiện có.

## Ràng buộc toàn cầu

- Hãy coi các tệp FE07, FE08, FE09, FE10 và FE12 `SPEC.md` đã được phê duyệt là nguồn hành vi chính xác.
- Giữ nguyên các giá trị chính sách của Giai đoạn 1: 5 bản sao hiện hành, lượt mượn 14 ngày theo lịch, 1 lần gia hạn và 5.000 VND mỗi ngày quá hạn.
- FE07 hiển thị dữ liệu trả sách và quá hạn; FE09 tự mình tạo và giải quyết các bản ghi tốt.
- FE08 ưu tiên đặt chỗ chặn việc gia hạn FE07 và thành viên khác không thể mượn bản sao đã giữ.
- FE10 nhận được yêu cầu thông báo bình thường; các kiểm thử sử dụng nhà cung cấp email giả hiện có và không bao giờ gửi email thực.
- FE12 vẫn ở chế độ chỉ đọc và không được thay đổi trạng thái mượn, đặt chỗ, phạt, thông báo, người dùng hoặc tồn kho.
- Không thêm cổng thanh toán, bộ lập lịch, thay đổi sơ đồ sản xuất, giá trị trạng thái mới hoặc phần phụ thuộc giao diện người dùng.
- Các kiểm thử thao tác ghi SQL yêu cầu `SYSTEM_SQL_TEST_ALLOW_MUTATION=true` và `SYSTEM_SQL_TEST_ENV_FILE` rõ ràng.
- Chỉ sử dụng các tài khoản tổng hợp kết thúc bằng `@example.test`; không bao giờ lưu trữ thông tin xác thực hoặc dữ liệu cá nhân.
- Bảo toàn các tệp không bị theo dõi không liên quan, bao gồm `.superpowers/`, `backend/coverage/` và `docs/briefing-thuyet-trinh-du-an-vi.docx`.
- Sử dụng nhánh `test/system-integration`; không tạo nhánh chứa `codex`.

---

## Cấu trúc tệp

- Tạo `backend/tests/helpers/systemIntegrationHarness.js`: application factory dùng chung, tác nhân, đồng hồ cố định và cầu nối trạng thái trong bộ nhớ.
- Tạo `backend/tests/systemIntegration.test.js`: các trường hợp API cấp SIT xác định `SIT-001` đến `SIT-009`.
- Tạo trường hợp trạng thái chia sẻ được hỗ trợ `backend/tests/sql/systemIntegration.sqltest.js`: SQL `SIT-SQL-001` với chức năng dọn dẹp được bảo vệ.
- Tạo `docs/testing/system-integration-demo-runbook.md`: quy trình thủ công sẵn sàng cho bản trình bày, danh sách kiểm tra lịch thi đấu, đường dẫn dự phòng và các bước đặt lại.
- Tạo `.sdd/reviews/system-integration-evidence-2026-07-14.md`: bằng chứng thực thi chỉ được điền bằng kết quả thực tế.
- Sửa đổi `backend/package.json`: thêm tập lệnh tập trung vào bộ nhớ và SQL SIT.
- Sửa đổi `package.json`: thêm lệnh `test:system` cấp dự án.
- Sửa đổi `.github/workflows/ci.yml`: chạy bộ SIT trong bộ nhớ sau khi kiểm tra máy chủ.
- Sửa đổi `docs/architecture/feature-integration-map.md`: thay thế các khoảng trống SIT hiện tại bằng ID trường hợp và đường dẫn bằng chứng mới.

---

## Ma trận kiểm tra hệ thống

| ID | Luồng chức năng chéo | Kết quả mong đợi |
| --- | --- | --- |
| SIT-001 | Xác thực FE02 và RBAC trên FE07/08/09/10/12 | Khách nhận được `401`; Thành viên nhận được `403` trên API nhân viên; Thủ thư/Quản trị viên có thể truy cập API của nhân viên. |
| SIT-002 | Phê duyệt vay FE07 -> FE10 -> FE12 | Phê duyệt đặt chi tiết/bản sao vào `BORROWED`, ngày đến hạn là +14 ngày, tạo một thông báo FE07 và tăng hoạt động báo cáo lượt mượn. |
| SIT-003 | Hàng đợi FE08 -> FE10 -> FE07 bảo vệ bản sao được giữ | Xử lý hàng đợi đặt chỗ `NOTIFIED`, sao chép `RESERVED`, tạo một thông báo FE08 và thành viên khác không thể mượn bản sao. |
| SIT-004 | Xung đột bảo lưu FE08 -> Gia hạn FE07 | Việc đặt chỗ tích cực của thành viên khác sẽ trả về `409 RESERVATION_BLOCKS_RENEWAL`; ngày đến hạn và số lần gia hạn không thay đổi. |
| SIT-005 | FE07 trả sách quá hạn -> FE09 phạt | Ngày đến hạn/trả sách được lưu trữ tạo ra một khoản phạt `UNPAID` do máy chủ tính toán ở mức 5.000 VND/ngày; số tiền của khách hàng bị bỏ qua. |
| SIT-006 | Vòng đời chưa thanh toán/đã thanh toán của FE09 -> Điều kiện mượn FE07 | Khoản phạt chưa thanh toán chặn lượt mượn mới; đánh dấu khoản phạt đã thanh toán loại bỏ điều kiện chặn và yêu cầu mượn hợp lệ tiếp theo thành công. |
| SIT-007 | FE10 bình thường và xử lý | Yêu cầu nguồn được phát lại sẽ trả về cùng một thông báo; quá trình xử lý tạo ra một lần thử và không tiết lộ nội dung thư hoặc bí mật. |
| SIT-008 | Tổng hợp chỉ đọc FE12 | Các báo cáo phản ánh các lượt mượn thực tế, bỏ qua `REQUESTED` dưới dạng hoạt động cho vay, thực thi quyền truy cập của nhân viên và giữ nguyên trạng thái nguồn theo từng byte. |
| SIT-009 | Cách ly lỗi yêu cầu FE10 | Yêu cầu thông báo FE10 không thành công sẽ không khôi phục lượt mượn FE07 đã được phê duyệt thành công. |
| SIT-SQL-001 | luồng nghiệp vụ chuẩn trạng thái chia sẻ SQL thực sự | Trả về FE07 được hiển thị trong phép tính FE09 và báo cáo mượn FE12 thông qua cùng một cơ sở dữ liệu; tất cả các hàng được gieo hạt sẽ bị loại bỏ sau đó. |

---

### Nhiệm vụ 1: Trích xuất Khai thác tích hợp hệ thống dùng chung

**Tệp:**
- Tạo: `backend/tests/helpers/systemIntegrationHarness.js`
- Sửa đổi: `backend/tests/integration.test.js`
- Kiểm tra: `backend/tests/systemIntegration.test.js`

**Giao diện:**
- Tiêu thụ: trình trợ giúp `makeInMemory*Dependencies()` hiện có và nội dung phụ thuộc `createApp()`.
- Sản xuất: `makeSystemIntegrationApp()`, `createVerifiedActor()`, `authHeader()`, `syncFineSourceFromBorrowing()`, `syncFineBlockersToBorrowing()` và `syncCopyStatus()`.

- [ ] **Bước 1: Viết kiểm thử hợp đồng khai thác không thành công**

Tạo `backend/tests/systemIntegration.test.js`:

```js
process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const { makeSystemIntegrationApp } = require('./helpers/systemIntegrationHarness');

describe('System integration', () => {
  test('SIT-000 wires every completed service into one Express app', () => {
    const setup = makeSystemIntegrationApp();

    expect(setup.app).toBeTruthy();
    expect(setup.services).toEqual(expect.objectContaining({
      authService: expect.any(Object),
      borrowingService: expect.any(Object),
      reservationService: expect.any(Object),
      fineManagementService: expect.any(Object),
      notificationService: expect.any(Object),
      reportService: expect.any(Object),
    }));
  });
});
```

- [ ] **Bước 2: Chạy hợp đồng và xác minh RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/systemIntegration.test.js
```

Dự kiến: THẤT BẠI với `Cannot find module './helpers/systemIntegrationHarness'`.

- [ ] **Bước 3: Triển khai nhà máy ứng dụng dùng chung**

Tạo `backend/tests/helpers/systemIntegrationHarness.js` với các ranh giới nhập khẩu và nhà máy sau:

```js
const request = require('supertest');
const { createApp } = require('../../src/app');
const { createAuthService } = require('../../src/services/authService');
const { createBorrowingService } = require('../../src/services/borrowingService');
const { createReservationService } = require('../../src/services/reservationService');
const { createFineManagementService } = require('../../src/services/fineManagementService');
const { createNotificationService } = require('../../src/services/notificationService');
const { createReportService } = require('../../src/services/reportService');
const { makeInMemoryAuthDependencies } = require('./inMemoryAuthRepositories');
const { makeInMemoryBorrowingDependencies } = require('./inMemoryBorrowingRepositories');
const { makeInMemoryReservationDependencies } = require('./inMemoryReservationRepositories');
const { makeInMemoryFineDependencies } = require('./inMemoryFineRepositories');
const { makeInMemoryNotificationDependencies } = require('./inMemoryNotificationRepositories');
const { makeInMemoryReportDependencies } = require('./inMemoryReportRepositories');

const FIXED_NOW = new Date('2026-07-14T00:00:00.000Z');

function authHeader(accessToken) {
  return `Bearer ${accessToken}`;
}

function syncCopyStatus(sourceState, targetState, copyId) {
  const source = sourceState.copies.find((copy) => copy.copyId === Number(copyId));
  const target = targetState.copies.find((copy) => copy.copyId === Number(copyId));
  if (!source || !target) throw new Error(`Missing shared copy ${copyId}.`);
  target.status = source.status;
}

function makeSystemIntegrationApp({ borrowingNotificationError = null } = {}) {
  const authDependencies = makeInMemoryAuthDependencies();
  const borrowingDependencies = makeInMemoryBorrowingDependencies(authDependencies.state);
  const reservationDependencies = makeInMemoryReservationDependencies(authDependencies.state);
  const fineDependencies = makeInMemoryFineDependencies();
  const notificationDependencies = makeInMemoryNotificationDependencies(authDependencies.state);
  const reportDependencies = makeInMemoryReportDependencies(
    authDependencies.state,
    borrowingDependencies.state,
  );

  const authService = createAuthService(authDependencies);
  const notificationService = createNotificationService({
    notificationRepository: notificationDependencies.notificationRepository,
    templateRepository: notificationDependencies.templateRepository,
    userRepository: authDependencies.userRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    emailProvider: { send: async () => ({ success: true }) },
    clock: () => FIXED_NOW,
  });
  const borrowingNotificationService = borrowingNotificationError
    ? {
        createSourceNotificationRequester: () => ({
          createNotificationRequest: async () => {
            throw borrowingNotificationError;
          },
        }),
      }
    : notificationService;
  const borrowingService = createBorrowingService({
    borrowingRepository: borrowingDependencies.borrowingRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    notificationService: borrowingNotificationService,
    clock: () => FIXED_NOW,
  });
  const reservationService = createReservationService({
    reservationRepository: reservationDependencies.reservationRepository,
    bookCopyRepository: reservationDependencies.bookCopyRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    notificationService,
    clock: () => FIXED_NOW,
  });
  const fineManagementService = createFineManagementService({
    fineRepository: fineDependencies.fineRepository,
    auditLogRepository: fineDependencies.auditLogRepository,
    clock: () => FIXED_NOW,
  });
  const reportService = createReportService({
    reportRepository: reportDependencies.reportRepository,
    auditLogRepository: authDependencies.auditLogRepository,
  });
  const services = {
    authService,
    borrowingService,
    reservationService,
    fineManagementService,
    notificationService,
    reportService,
  };

  return {
    app: createApp(services),
    services,
    dependencies: {
      authDependencies,
      borrowingDependencies,
      reservationDependencies,
      fineDependencies,
      notificationDependencies,
      reportDependencies,
    },
  };
}

module.exports = { FIXED_NOW, authHeader, makeSystemIntegrationApp, syncCopyStatus };
```

- [ ] **Bước 4: Thêm tác nhân và chức năng cầu nối trạng thái tốt**

Nối và xuất các hàm này từ cùng một trình trợ giúp:

```js
async function createVerifiedActor({ setup, email, role = 'MEMBER', approveMember = true }) {
  const password = 'Password1!';
  const registered = await request(setup.app).post('/api/auth/register').send({
    email,
    password,
    confirmPassword: password,
    fullName: email.split('@')[0],
  });
  if (registered.status !== 201) throw new Error(`Registration failed for ${email}.`);

  const userId = registered.body.userId;
  await request(setup.app)
    .post('/api/auth/verify-email')
    .send({ token: registered.body.debugVerificationToken })
    .expect(200);
  setup.dependencies.authDependencies.state.rolesByUserId.set(userId, [role]);

  if (role === 'MEMBER' && approveMember) {
    setup.dependencies.borrowingDependencies.approveMember(userId);
    setup.dependencies.reservationDependencies.approveMember(userId);
  }

  const login = await request(setup.app).post('/api/auth/login').send({ email, password });
  if (login.status !== 200) throw new Error(`Login failed for ${email}.`);
  return { userId, accessToken: login.body.accessToken };
}

function syncFineSourceFromBorrowing(setup) {
  const { borrowingDependencies, fineDependencies, authDependencies } = setup.dependencies;
  const mapped = borrowingDependencies.state.borrowDetails.map((detail) => {
    const requestRow = borrowingDependencies.state.borrowRequests.find(
      (item) => item.requestId === detail.requestId,
    );
    const copy = borrowingDependencies.state.copies.find((item) => item.copyId === detail.copyId);
    const book = borrowingDependencies.state.books.find((item) => item.bookId === copy?.bookId);
    const user = authDependencies.state.users.find((item) => item.userId === requestRow?.userId);
    return {
      borrowDetailId: detail.borrowDetailId,
      userId: requestRow.userId,
      copyId: detail.copyId,
      dueDate: detail.dueDate,
      returnDate: detail.returnDate,
      detailStatus: detail.status,
      barcode: copy?.barcode || null,
      bookTitle: book?.title || null,
      email: user?.email || null,
      username: user?.username || null,
    };
  });
  fineDependencies.state.borrowDetails.splice(0, fineDependencies.state.borrowDetails.length, ...mapped);
}

function syncFineBlockersToBorrowing(setup) {
  const { borrowingDependencies, fineDependencies } = setup.dependencies;
  borrowingDependencies.state.fines.splice(
    0,
    borrowingDependencies.state.fines.length,
    ...fineDependencies.state.fines.map((fine) => ({
      fineId: fine.fineId,
      userId: fine.userId,
      amount: fine.amount,
      status: fine.status,
    })),
  );
}

module.exports = {
  FIXED_NOW,
  authHeader,
  createVerifiedActor,
  makeSystemIntegrationApp,
  syncCopyStatus,
  syncFineBlockersToBorrowing,
  syncFineSourceFromBorrowing,
};
```

- [ ] **Bước 5: Chạy hợp đồng khai thác và bộ tích hợp hiện có**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/systemIntegration.test.js tests/integration.test.js
```

Dự kiến: cả hai bộ đạt và hành vi tích hợp hiện tại vẫn không thay đổi.

- [ ] **Bước 6: Cam kết ranh giới khai thác**

```powershell
git add backend/tests/helpers/systemIntegrationHarness.js backend/tests/systemIntegration.test.js
git commit -m "test: add shared system integration harness"
```

---

### Nhiệm vụ 2: Thêm luồng xác thực, mượn, thông báo và báo cáo

**Tệp:**
- Sửa đổi: `backend/tests/systemIntegration.test.js`

**Giao diện:**
- Tiêu thụ: `makeSystemIntegrationApp()`, `createVerifiedActor()` và `authHeader()` từ Nhiệm vụ 1.
- Tạo ra: bằng chứng tự động cho `SIT-001`, `SIT-002`, `SIT-007` và `SIT-008`.

- [ ] **Bước 1: Thêm kiểm thử luồng nghiệp vụ chuẩn không thành công**

Thay thế việc nhập kiểm thử mở đầu bằng:

```js
const request = require('supertest');
const {
  authHeader,
  createVerifiedActor,
  makeSystemIntegrationApp,
} = require('./helpers/systemIntegrationHarness');
```

Sau đó, thêm kiểm thử thực hiện các bước API chính xác sau:

```js
test('SIT-002 FE07 approval creates FE10 data and FE12 activity', async () => {
  const setup = makeSystemIntegrationApp();
  const member = await createVerifiedActor({
    setup,
    email: 'sit.borrower@example.test',
  });
  const librarian = await createVerifiedActor({
    setup,
    email: 'sit.librarian@example.test',
    role: 'LIBRARIAN',
    approveMember: false,
  });

  const created = await request(setup.app)
    .post('/api/borrow-requests')
    .set('Authorization', authHeader(member.accessToken))
    .send({ copyIds: [1] })
    .expect(201);
  const approved = await request(setup.app)
    .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/approve`)
    .set('Authorization', authHeader(librarian.accessToken))
    .send({})
    .expect(200);

  expect(approved.body.borrowRequest).toMatchObject({
    status: 'APPROVED',
    details: [expect.objectContaining({ status: 'BORROWED', dueDate: '2026-07-28' })],
  });
  expect(setup.dependencies.notificationDependencies.state.notifications).toEqual(
    expect.arrayContaining([expect.objectContaining({
      userId: member.userId,
      sourceFeature: 'FE07',
      type: 'DUE_DATE_REMINDER',
    })]),
  );

  const report = await request(setup.app)
    .get('/api/reports/borrowing?fromDate=2026-07-01&toDate=2026-07-31')
    .set('Authorization', authHeader(librarian.accessToken))
    .expect(200);
  expect(report.body.totals.requests).toBe(1);
  expect(report.body.totals.activeLoans).toBe(1);
  expect(report.body.requestStatusCounts.APPROVED).toBe(1);
});
```

- [ ] **Bước 2: Thêm xác nhận RBAC trước luồng nghiệp vụ chuẩn**

Thêm xác nhận `SIT-001` cho quyền truy cập không được xác thực và Thành viên vào:

```text
GET /api/borrow-requests
POST /api/reservations/process-queue
POST /api/fines/calculate
POST /api/notifications/process-pending
GET /api/reports/borrowing
```

Dự kiến: không có mã thông báo nào trả về `401`; mã thông báo Thành viên trả về `403`; mã thông báo
Thủ thư đạt được xác thực hoặc thành công thay vì lỗi ủy quyền.

- [ ] **Bước 3: Thêm chức năng phát lại thông báo và báo cáo các xác nhận về tính bất biến**

Đối với `SIT-007`, hãy gửi cùng một yêu cầu thông báo hai lần bằng khóa tạm thời `sit-fe07-1`; khẳng
định phản hồi thứ hai trả về cùng một `notificationId`. Xử lý các thông báo đang chờ xử lý và xác
nhận `{ processed: 1, failed: 0 }` mà không có thuộc tính `notifications`.

Đối với `SIT-008`, chụp nhanh các mảng này trước và sau cả ba điểm cuối báo cáo:

```js
const before = JSON.stringify({
  requests: setup.dependencies.borrowingDependencies.state.borrowRequests,
  details: setup.dependencies.borrowingDependencies.state.borrowDetails,
  copies: setup.dependencies.borrowingDependencies.state.copies,
  fines: setup.dependencies.fineDependencies.state.fines,
  notifications: setup.dependencies.notificationDependencies.state.notifications,
});
```

Dự kiến: ảnh chụp nhanh được tuần tự hóa giống hệt nhau sau các cuộc gọi báo cáo, trong khi chi tiết
`REQUESTED` không làm tăng số liệu cho vay thực tế.

- [ ] **Bước 4: Thêm trường hợp cách ly lỗi thông báo**

Tạo thiết lập với `makeSystemIntegrationApp({ borrowingNotificationError: new Error('Provider unavailable') })`,
sau đó tạo và phê duyệt yêu cầu mượn hợp lệ.

Dự kiến:

```text
phản hồi phê duyệt = 200
BorrowRequest.Status = APPROVED
BorrowDetail.Status = BORROWED
BookCopy.Status = BORROWED
không có bản ghi thông báo FE07 nào bị xác nhận sai là đã gửi
```

Giữ các kiểm thử khôi phục kiểm toán FE07 SQL hiện có làm bằng chứng giao dịch cấp chức năng riêng
biệt; `SIT-009` chỉ bao gồm ranh giới lỗi FE07/FE10 đa chức năng.

- [ ] **Bước 5: Chạy các trường hợp SIT tập trung**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/systemIntegration.test.js
```

Dự kiến: `SIT-001`, `SIT-002`, `SIT-007`, `SIT-008` và phần thông báo lỗi của `SIT-009` đạt.

- [ ] **Bước 6: Cam kết lát hệ thống đầu tiên**

```powershell
git add backend/tests/systemIntegration.test.js
git commit -m "test: cover auth borrow notification report flow"
```

---

### Nhiệm vụ 3: Thêm mức độ ưu tiên đặt chỗ và luồng xung đột gia hạn

**Tệp:**
- Sửa đổi: `backend/tests/systemIntegration.test.js`

**Giao diện:**
- Tiêu thụ: các tác nhân được chia sẻ và cầu nối trạng thái sao chép từ Nhiệm vụ 1.
- Tạo ra: bằng chứng tự động cho `SIT-003` và `SIT-004`.

- [ ] **Bước 1: Thêm kiểm thử tích hợp bản sao lưu giữ**

Sử dụng Thành viên A để đặt chỗ bản sao `1` đã mượn, đặt bản sao FE08 thành `AVAILABLE` và gọi:

```http
POST /api/reservations/process-queue
{ "copyId": 1 }
```

Xác nhận đặt chỗ đã chọn là `NOTIFIED`, trạng thái sao chép FE08 là `RESERVED` và chính xác một
thông báo có `sourceFeature: FE08` cộng với `templateKey: RESERVATION_READY`. Gọi
`syncCopyStatus(reservationState, borrowingState, 1)`, sau đó xác nhận Thành viên B nhận được `409
COPY_NOT_AVAILABLE` từ `POST /api/borrow-requests`.

- [ ] **Bước 2: Thêm kiểm thử tích hợp gia hạn-xung đột**

Mượn và phê duyệt bản sao `2` cho Thành viên A. Chèn một phần đặt chỗ đang hoạt động thuộc sở hữu
của Thành viên B vào trạng thái xung đột đặt chỗ FE07, sau đó gọi:

```http
PATCH /api/borrow-details/{borrowDetailId}/renew
```

Dự kiến: `409 RESERVATION_BLOCKS_RENEWAL`; `dueDate` và `renewalCount` bằng giá trị trước cuộc gọi của chúng.

- [ ] **Bước 3: Chạy các trường hợp đặt chỗ với phạm vi tích hợp hiện có**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/systemIntegration.test.js tests/integration.test.js tests/reservationRoutes.test.js
```

Dự kiến: tất cả các bộ ĐẠT mà không có thông báo hàng đợi trùng lặp hoặc phân kỳ trạng thái sao chép.

- [ ] **Bước 4: Cam kết ranh giới đặt chỗ**

```powershell
git add backend/tests/systemIntegration.test.js
git commit -m "test: cover reservation borrowing integration"
```

---

### Nhiệm vụ 4: Thêm vòng đời phạt quá hạn và chặn tiền vay

**Tệp:**
- Sửa đổi: `backend/tests/systemIntegration.test.js`

**Giao diện:**
- Tiêu thụ: `syncFineSourceFromBorrowing()` và `syncFineBlockersToBorrowing()` từ Nhiệm vụ 1.
- Tạo ra: bằng chứng tự động cho `SIT-005` và `SIT-006`.

- [ ] **Bước 1: Viết tờ khai quá hạn và tính phạt**

Mượn và phê duyệt bản sao `1`, sau đó đặt ngày đến hạn được lưu trữ thành `2026-06-30`. trả sách
trên `2026-07-14`, gọi `syncFineSourceFromBorrowing(setup)` và gửi:

```http
POST /api/fines/calculate
{ "borrowDetailId": 1, "amount": 999999 }
```

Sử dụng `borrowDetailId` được trả về thực tế chứ không phải ID mẫu theo nghĩa đen. Dự kiến: một
`UNPAID` phạt, `overdueDays: 14` và `amount: 70000`; số tiền của khách hàng bị bỏ qua.

- [ ] **Bước 2: Chứng minh các khối tốt và sau đó mở khóa FE07**

Gọi `syncFineBlockersToBorrowing(setup)`, sau đó yêu cầu một bản sao khác có sẵn cho cùng một thành
viên. Dự kiến: `409 UNPAID_FINE_BLOCKS_BORROWING` và không có hàng yêu cầu mới.

Đánh dấu số khoản phạt đã nộp qua:

```http
PATCH /api/fines/{fineId}/paid
{ "paymentMethod": "CASH" }
```

Gọi lại `syncFineBlockersToBorrowing(setup)` và lặp lại yêu cầu mượn với bản sao `2`. Dự kiến: `201 PENDING`.

- [ ] **Bước 3: Xác minh quyền sở hữu khoản phạt và tính toán trùng lặp**

Dự kiến:

```text
GET /api/fines/me với tư cách chủ sở hữu -> một khoản phạt
GET /api/fines/me với tư cách thành viên khác -> không có khoản phạt
POST /api/fines/calculate lần thứ hai -> created=false và cùng fineId
Thành viên PATCH /api/fines/{fineId}/paid -> 403
```

- [ ] **Bước 4: Chạy hồi quy FE07 và FE09 cùng nhau**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/systemIntegration.test.js tests/borrowingRoutes.test.js tests/fineManagementRoutes.test.js
```

Dự kiến: tất cả các bộ ĐẠT.

- [ ] **Bước 5: Cam kết vòng đời tốt**

```powershell
git add backend/tests/systemIntegration.test.js
git commit -m "test: cover fine borrowing blocker lifecycle"
```

---

### Nhiệm vụ 5: Thêm bằng chứng trạng thái chia sẻ được hỗ trợ bởi SQL

**Tệp:**
- Tạo: `backend/tests/sql/systemIntegration.sqltest.js`
- Sửa đổi: `backend/package.json`

**Giao diện:**
- Tiêu thụ: sản xuất các kho lưu trữ và dịch vụ SQL thông qua cơ sở dữ liệu được cấu hình bởi `SYSTEM_SQL_TEST_ENV_FILE`.
- Tạo ra: `SIT-SQL-001` chứng minh khả năng hiển thị trạng thái FE07 -> FE09 -> FE12 mà không cần cầu nối trong bộ nhớ.

- [ ] **Bước 1: Thêm trình bảo vệ thao tác ghi và đăng ký hạt giống xác định**

Bắt đầu bộ SQL với:

```js
const dotenv = require('dotenv');
if (process.env.SYSTEM_SQL_TEST_ENV_FILE) {
  dotenv.config({ path: process.env.SYSTEM_SQL_TEST_ENV_FILE, quiet: true });
}
if (process.env.SYSTEM_SQL_TEST_ALLOW_MUTATION !== 'true') {
  throw new Error('System SQL test requires SYSTEM_SQL_TEST_ALLOW_MUTATION=true.');
}

const seed = {
  key: `sit${Date.now()}${process.pid}`,
  userIds: [],
  copyIds: [],
  requestIds: [],
  detailIds: [],
  fineIds: [],
  notificationIds: [],
};
```

- [ ] **Bước 2: Triển khai một luồng nghiệp vụ chuẩn cho cơ sở dữ liệu thực**

kiểm thử phải thực hiện các hoạt động này thông qua API dịch vụ sản xuất/kho lưu trữ:

```text
1. Chèn người dùng Thành viên và Thủ thư tổng hợp, cùng một bản ghi `Members` đã được phê duyệt.
2. Chèn một bản sao AVAILABLE bằng một `BookId` hiện có.
3. FE07 tạo và phê duyệt một yêu cầu; xác nhận chi tiết ở trạng thái BORROWED và bản sao cũng ở trạng thái BORROWED.
4. Đặt ngày đến hạn là 2026-06-30 và trả sách vào 2026-07-14; xác nhận `fineCandidate` của FE07 có 14 ngày quá hạn.
5. FE09 tính từ `BorrowDetail` đã lưu; xác nhận có một khoản phạt UNPAID trị giá 70.000 VND.
6. Báo cáo mượn sách tháng 7 của FE12 bao gồm yêu cầu và hoạt động mượn thực tế.
7. Truy vấn `AuditLogs` và `Notifications` cho các bản ghi nguồn FE07 mà không làm lộ dữ liệu gửi bí mật.
```

- [ ] **Bước 3: Thực hiện dọn dẹp theo thứ tự phụ thuộc ngược lại**

Sử dụng `afterEach` và `afterAll` để chỉ xóa các ID được ghi trong `seed`, theo thứ tự sau:

```text
NotificationAttempts -> Notifications -> AuditLogs -> Fines -> BorrowDetails -> BorrowRequests
-> Reservations -> BookCopies -> Members -> UserRoles -> Users
```

Sau khi dọn dẹp, khẳng định:

```sql
SELECT
  (SELECT COUNT(*) FROM Users WHERE Username LIKE @SeedPrefix) AS TestUsers,
  (SELECT COUNT(*) FROM BookCopies WHERE Barcode LIKE @SeedPrefix) AS TestCopies;
```

Dự kiến: `TestUsers = 0` và `TestCopies = 0`.

- [ ] **Bước 4: Thêm tập lệnh SQL tập trung**

Thêm vào `backend/package.json`:

```json
"test:sql:system": "jest --runInBand --runTestsByPath tests/sql/systemIntegration.sqltest.js"
```

- [ ] **Bước 5: Chạy bộ SQL trong môi trường rõ ràng**

```powershell
$env:SYSTEM_SQL_TEST_ALLOW_MUTATION = 'true'
$env:SYSTEM_SQL_TEST_ENV_FILE = 'D:\SWP391\library-management-system\backend\.env'
npm.cmd --prefix backend run test:sql:system
```

Dự kiến: `SIT-SQL-001` đạt và số lần dọn dẹp đều bằng 0.

- [ ] **Bước 6: Cam kết lớp bằng chứng SQL**

```powershell
git add backend/tests/sql/systemIntegration.sqltest.js backend/package.json backend/package-lock.json
git commit -m "test: add SQL system integration proof"
```

---

### Nhiệm vụ 6: Thêm sổ tay trình diễn, lệnh CI và bản ghi bằng chứng

**Tệp:**
- Tạo: `docs/testing/system-integration-demo-runbook.md`
- Tạo: `.sdd/reviews/system-integration-evidence-2026-07-14.md`
- Sửa đổi: `package.json`
- Sửa đổi: `backend/package.json`
- Sửa đổi: `.github/workflows/ci.yml`
- Sửa đổi: `docs/architecture/feature-integration-map.md`

**Giao diện:**
- Tiêu thụ: ID trường hợp SIT và chuyển đầu ra từ Nhiệm vụ 1-5.
- Tạo ra: một lệnh CI, một danh sách kiểm tra trình bày và một bản ghi bằng chứng lâu dài.

- [ ] **Bước 1: Thêm tập lệnh tập trung**

Thêm vào `backend/package.json`:

```json
"test:integration:system": "jest --runInBand --runTestsByPath tests/systemIntegration.test.js"
```

Thêm vào root `package.json`:

```json
"test:system": "npm --prefix backend run test:integration:system"
```

- [ ] **Bước 2: Thêm bộ SIT trong bộ nhớ vào CI**

Sau `Backend tests` trong `.github/workflows/ci.yml`, hãy thêm:

```yaml
      - name: System integration tests
        run: npm run test:integration:system
        working-directory: backend
```

Không chạy bộ thao tác ghi SQL trong CI được chia sẻ cho đến khi kho lưu trữ có dịch vụ SQL Server riêng
biệt và thông tin đăng nhập dùng một lần.

- [ ] **Bước 3: Tạo sổ tay vận hành demo thuyết trình**

Sổ tay chạy phải sử dụng quy trình dài 5 phút này:

```text
Kiểm tra trước: máy chủ /health -> đăng nhập giao diện -> bản sao AVAILABLE -> không có khoản phạt chưa thanh toán.
1. Thành viên tạo yêu cầu mượn.
2. Thủ thư phê duyệt; hiển thị trạng thái BORROWED và ngày đến hạn sau 14 ngày.
3. Hiển thị bản ghi thông báo ngày đến hạn của FE10 hoặc phản hồi API.
4. Trả dữ liệu kiểm thử quá hạn/hư hỏng; hiển thị `fineCandidate`, sau đó hiển thị khoản phạt do FE09 tính.
5. Hiển thị khoản phạt chưa thanh toán đang chặn lượt mượn tiếp theo; đánh dấu đã thanh toán và thử lại thành công.
6. Mở báo cáo mượn sách FE12 và hiển thị hoạt động tích hợp.
```

Bao gồm đường dẫn dự phòng sử dụng phản hồi và ảnh chụp màn hình API nếu email, SQL Server hoặc khởi
động giao diện người dùng không khả dụng. Bao gồm kiểm tra đặt lại trạng thái sao chép, thông báo
đang chờ xử lý, khoản phạt và người dùng tổng hợp.

- [ ] **Bước 4: Chỉ ghi lại bằng chứng quan sát được**

Tạo `.sdd/reviews/system-integration-evidence-2026-07-14.md` bằng một hàng cho mỗi ID SIT và các cột sau:

```markdown
|ID|Trạng thái|Lệnh/hành động|Kết quả quan sát|Dọn dẹp|
| --- | --- | --- | --- | --- |
```

Sử dụng `NOT RUN` cho đến khi lệnh tương ứng thực sự hoàn thành. Không bao giờ điền trước `PASS`.

- [ ] **Bước 5: Cập nhật bản đồ tích hợp**

Trong `docs/architecture/feature-integration-map.md` Phần 7, ánh xạ từng luồng đã hoàn thành tới
`backend/tests/systemIntegration.test.js` hoặc `backend/tests/sql/systemIntegration.sqltest.js`.
Luôn mở tính khả dụng của FE01/FE05 và các khoảng trống trong bảng điều khiển dành cho quản trị viên
FE11 vì chúng nằm ngoài kế hoạch này.

- [ ] **Bước 6: Chạy cổng xác minh hoàn chỉnh**

```powershell
npm.cmd run test:system
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
```

Dự kiến: tất cả các lệnh thoát `0`. Ghi lại số lượng bộ/kiểm tra chính xác và lời khuyên Vite hiện
có tách biệt với các lỗi.

- [ ] **Bước 7: Chạy thử demo thủ công**

Chạy luồng demo hai lần:

```text
Diễn tập 1: thực hiện với nhịp độ bình thường, xác minh mọi trạng thái rồi đặt lại dữ liệu.
Diễn tập 2: trình bày trong năm phút, sử dụng ảnh chụp màn hình hoặc bằng chứng API dự phòng.
```

Dự kiến: không có lỗi tràn cấp trang, không có bản demo giả thành công, không có vai trò xác thực cũ
và tất cả các nội dung kiểm thử đều bị xóa hoặc khôi phục.

- [ ] **Bước 8: Cam kết cổng tích hợp**

```powershell
git add package.json backend/package.json backend/package-lock.json .github/workflows/ci.yml docs/testing/system-integration-demo-runbook.md docs/architecture/feature-integration-map.md .sdd/reviews/system-integration-evidence-2026-07-14.md
git commit -m "test: establish system integration gate"
```

---

## Tiêu chí thoát

- [ ] Vượt qua `SIT-001` đến `SIT-009` trong bộ Supertest xác định.
- [ ] `SIT-SQL-001` chuyển sang SQL Server đã định cấu hình và quá trình dọn dẹp sẽ trả về 0 hàng.
- [ ] CI chạy bộ SIT trong bộ nhớ theo yêu cầu hợp nhất và `main`.
- [ ] Sổ tay chạy thủ công hoàn thành hai lần và có đường dẫn dự phòng đang hoạt động.
- [ ] Không có thay đổi về yêu cầu sản xuất, lược đồ, trạng thái, sự phụ thuộc hoặc ranh giới ủy quyền.
- [ ] Bằng chứng ánh xạ từng luồng từ thông số chức năng và bản đồ tích hợp tới mã, lệnh, kết quả được quan sát và dọn dẹp.

## Lệnh thi hành bài thuyết trình ngày mai

1. Thực hiện Nhiệm vụ 1 và Nhiệm vụ 2 trước; chúng cung cấp bằng chứng trình diễn mượn sách/thông báo/báo cáo an toàn nhất.
2. Thực hiện Nhiệm vụ 4 tiếp theo; nó cung cấp câu chuyện về quy tắc nghiệp vụ rõ ràng nhất: phạt quá hạn sẽ chặn lượt mượn cho đến khi được thanh toán.
3. Tạo sổ tay demo Nhiệm vụ 6 ngay sau luồng tự động màu xanh lá cây đầu tiên.
4. Thực hiện các trường hợp đặt chỗ Nhiệm vụ 3 nếu vẫn còn thời gian trước buổi diễn tập.
5. Chỉ thực hiện bằng chứng SQL của Nhiệm vụ 5 với cơ sở dữ liệu dùng một lần có thể truy cập và đủ thời gian để xác minh việc dọn dẹp.
