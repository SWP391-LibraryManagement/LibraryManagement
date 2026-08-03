# Kế hoạch triển khai điều chỉnh quy tắc nghiệp vụ FE07/FE10/FE12

> **Đối với nhân viên đại lý:** BẮT BUỘC SUB-SKILL: Sử dụng `executing-plans` để
> thực hiện kế hoạch này theo từng nhiệm vụ. Việc ủy quyền không được ủy quyền trừ khi Nhật
> yêu cầu nó một cách rõ ràng. Sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Căn chỉnh bốn hợp đồng FE07, FE10 và FE12 lõi đang hoạt động trong khi chứng minh sự
chuyển giao FE08 không thay đổi và duy trì mọi quy trình công việc, lược đồ, vai trò và giao diện
người dùng công khai hiện có.

**Kiến trúc:** Giữ các lớp kho lưu trữ dịch vụ-bộ điều khiển tuyến đường Express hiện tại. FE07 sử
dụng mô hình ủy quyền một vai trò trên toàn dự án và lưu giữ các tính toán ngày làm việc trong dịch
vụ, trong khi kho lưu trữ trả về của nó hiển thị ảnh chụp nhanh nội bộ bị khóa giao dịch được sử
dụng bởi cả quá trình kiểm tra và xây dựng phản hồi. FE10 thêm một cổng định nghĩa được lưu trữ
riêng trước khi kết xuất. FE12 bổ sung phần mềm trung gian khóa điểm cuối chính xác trước các trình
xác thực giá trị hiện có.

**bộ công nghệ công nghệ:** Node.js, Express.js, trình xác thực nhanh, Jest, Supertest, SQL Server
đến `mssql`, React/Vite và Playwright.

## Ràng buộc toàn cầu

- Nguồn chuẩn: FE07 v0.7.6, FE10 v0.4.4 và FE12 v0.2.0 SPEC đã được phê duyệt
cộng với thiết kế
`docs/superpowers/specs/2026-07-27-fe07-fe10-fe12-business-rule-alignment-design.md` đã được phê
duyệt.
- Lệnh bàn giao là SPEC -> PLAN/TASKS -> RED -> mã tối thiểu -> GREEN ->
  L1-L4/bằng chứng thời gian chạy.
- Không có lược đồ cơ sở dữ liệu, tuyến đường công cộng, vai trò, loại thông báo, trường báo cáo,
  quy trình làm việc ở giao diện người dùng, sự phụ thuộc hoặc thay đổi kiến trúc.
- FE08 chỉ hồi quy; một hợp đồng FE08 bị lỗi sẽ chặn việc hoàn thành và thực hiện
  không cho phép thay đổi sản phẩm FE08.
- Mọi thay đổi sản xuất đều mang ID `@spec` hiện có.
- Giữ tất cả các thay đổi triển khai đã tạo ở trạng thái sẵn sàng cho đến khi hoàn tất
  bằng chứng khác biệt cục bộ và L1-L4 nhận được H2 từ Nhật.
- Không cam kết hợp nhất đang chờ xử lý, đẩy đầu đối chiếu, cập nhật bản nháp
  PR, hoặc hợp nhất trong quá trình triển khai hoặc chuẩn bị phụ lục H2.
- Chỉ chạy SQL có thể thay đổi khi `DB_NAME` được định cấu hình được xác nhận rõ ràng
  như một cơ sở dữ liệu cục bộ dùng một lần và `FE07_SQL_TEST_ALLOW_MUTATION=true`.
- Kiểm tra môi trường tiền sản xuất ở chế độ chỉ đọc. Không bao giờ sử dụng PII thực, thông tin xác thực, mã thông báo, OTP,
  hoặc môi trường tiền sản xuất dữ liệu kinh doanh có thể thay đổi làm bằng chứng.
- Một thất bại xác định nhận được tối đa ba lần thử. Một người bị nghi ngờ
  Lớp E2E có thể được chạy lại một lần với bằng chứng lỗi đầu tiên được giữ lại.

---

## Bản đồ tệp

| Trách nhiệm | Tập tin |
| --- | --- |
| Chính sách ngày làm việc và gia hạn một vai trò của FE07 | `backend/src/services/borrowingService.js` |
| Giao dịch hoàn trả có thẩm quyền FE07 | `backend/src/repositories/borrowingRepository.js` |
| FE07 chẵn lẻ giao dịch trong bộ nhớ | `backend/tests/helpers/inMemoryBorrowingRepositories.js` |
| Hồi quy kho lưu trữ và tuyến đường FE07 | `backend/tests/borrowingRoutes.test.js`, `backend/tests/borrowingRepository.test.js` |
| Tùy chọn FE07 bằng chứng SQL thực | `backend/tests/sql/borrowingConcurrency.sqltest.js` |
| Cổng định nghĩa được lưu trữ FE10 | `backend/src/services/notificationService.js` |
| Hồi quy an toàn FE10 | `backend/tests/notificationRoutes.test.js` |
| Ranh giới khóa truy vấn chính xác FE12 | `backend/src/validators/reportValidators.js` |
| Hồi quy ranh giới FE12 | `backend/tests/reportRoutes.test.js` |
| FE08 bằng chứng chuyển giao không thay đổi | `backend/tests/reservationRoutes.test.js`, `backend/tests/systemIntegration.test.js` |
| Bằng chứng thực tế về trình duyệt/thời gian chạy | `tests/e2e/system-golden-path.spec.js`, `tests/e2e/fe08-reservation-candidate-catalog.spec.js` |
| Hồ sơ bằng chứng cuối cùng | `.sdd/reviews/fe07-fe10-fe12-business-rule-alignment-validation-2026-07-27.md` |

---

### Nhiệm vụ 1: Nỗ lực gia hạn đa vai trò FE07 trong lịch sử (Đã thay thế)

**ID nhiệm vụ:** `FE07-T052` (kịch bản đa vai trò được thay thế; được điều chỉnh trong Nhiệm vụ 8)

Phần này chỉ ghi lại bằng chứng RED/GREEN ban đầu. Việc xác nhận vai đơn sau này của Nhật thay thế
tiền đề về tác nhân của nó. Không giữ lại kiểm thử đa vai trò hoặc authorization delta của nó
trong kết quả tích hợp.

**Tệp:**
- Sửa đổi: `backend/tests/borrowingRoutes.test.js`
- Sửa đổi: `backend/src/services/borrowingService.js`

**Giao diện:**
- Tiêu thụ: `hasAnyRole(actor, allowedRoles)` và
  `renewBorrowDetail(borrowDetailIdInput, input, actor, context)`.
- Tạo ra: phạm vi nhân viên độc lập với trật tự vai trò; khả năng hội đủ điều kiện của chủ sở hữu lượt mượn vẫn còn
  không thay đổi.

- [x] **Bước 1: Thêm hồi quy tuyến đường bị lỗi**

Thêm kiểm thử này bên trong `describe('FE07 borrowing management', ...)`:

```js
test('multi-role librarian renews another member loan while member-only remains owner-scoped', async () => {
  const { app, authDependencies, borrowingDependencies } = makeTestApp({
    clock: () => new Date('2026-03-07T12:00:00.000Z'),
  });
  const owner = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'renew-owner@example.test',
  });
  const memberOnly = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'renew-member-only@example.test',
  });
  const staff = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'renew-multi-role@example.test',
    role: 'LIBRARIAN',
    approveMember: false,
  });

  authDependencies.state.rolesByUserId.set(staff.userId, ['MEMBER', 'LIBRARIAN']);
  const multiRoleLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'renew-multi-role@example.test', password: 'Password1!' })
    .expect(200);

  const created = await request(app)
    .post('/api/borrow-requests')
    .set('Authorization', authHeader(owner.accessToken))
    .send({ copyIds: [1, 2] })
    .expect(201);
  const approved = await request(app)
    .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/approve`)
    .set('Authorization', authHeader(staff.accessToken))
    .send({})
    .expect(200);
  const [staffTarget, memberTarget] = approved.body.borrowRequest.details;

  const staffResponse = await request(app)
    .patch(`/api/borrow-details/${staffTarget.borrowDetailId}/renew`)
    .set('Authorization', authHeader(multiRoleLogin.body.accessToken))
    .send({});
  expect(staffResponse.status).toBe(200);
  expect(staffResponse.body.borrowDetail.renewalCount).toBe(1);

  const memberResponse = await request(app)
    .patch(`/api/borrow-details/${memberTarget.borrowDetailId}/renew`)
    .set('Authorization', authHeader(memberOnly.accessToken))
    .send({});
  expect(memberResponse.status).toBe(403);
  expect(memberResponse.body.error.code).toBe('BORROW_DETAIL_OWNER_REQUIRED');
});
```

- [x] **Bước 2: Chạy RED**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js --testNamePattern "multi-role librarian renews"
```

Dự kiến: THẤT BẠI vì yêu cầu của nhân viên trả về `403 BORROW_DETAIL_OWNER_REQUIRED`.

- [x] **Bước 3: Áp dụng thay đổi ủy quyền tối thiểu**

Thay thế khối quyền sở hữu/vai trò trong `renewBorrowDetail` bằng:

```js
const isStaff = hasAnyRole(actor, ['LIBRARIAN', 'ADMIN']);
const isMember = hasAnyRole(actor, ['MEMBER']);

// @spec BR-FE07-003, FR-FE07-009
if (!isStaff && isMember && borrowDetail.userId !== actor.userId) {
  throw errors.forbidden(
    'BORROW_DETAIL_OWNER_REQUIRED',
    'Members can renew only their own borrowed items.'
  );
}

if (!isStaff && !isMember) {
  throw errors.forbidden('ROLE_REQUIRED', 'Your role cannot perform this action.');
}
```

Không thay đổi `ensureEligibleMember(borrowDetail.userId)`,
`ensureNoBorrowingBlockers(borrowDetail.userId)`, số lần gia hạn, khoản phạt, quá hạn hoặc kiểm tra
đặt chỗ.

- [x] **Bước 4: Chạy GREEN**

Chạy lệnh từ Bước 2.

Dự kiến: ĐẠT cho cả sự thành công của nhân viên đa vai trò và sự từ chối chỉ dành cho thành viên.

- [x] **Bước 5: Điểm kiểm tra không cần cam kết**

Kiểm tra `git khác biệt -- backend/src/services/borrowingService.js
backend/tests/borrowingRoutes.test.js`. Đừng giai đoạn hoặc cam kết.

---

### Nhiệm vụ 2: Ảnh chụp nhanh trả sách có thẩm quyền FE07

**ID nhiệm vụ:** `FE07-T049`

**Tệp:**
- Sửa đổi: `backend/tests/borrowingRoutes.test.js`
- Sửa đổi: `backend/tests/borrowingRepository.test.js`
- Sửa đổi: `backend/src/services/borrowingService.js`
- Sửa đổi: `backend/src/repositories/borrowingRepository.js`
- Sửa đổi: `backend/tests/helpers/inMemoryBorrowingRepositories.js`
- Chỉ sửa đổi khi SQL dùng một lần được xác nhận:
  `backend/tests/sql/borrowingConcurrency.sqltest.js`

**Giao diện:**
- Tiêu thụ: hiện tại
Hợp đồng `returnBorrowDetail({ borrowDetailId, detailStatus, copyStatus, returnDate,
auditLogRepository, auditEntry })`.
- Tạo ra: cùng một chi tiết được ánh xạ cộng với một nội bộ
Đối tượng `authoritativeReturn` chứa `requestId`, `userId`, `copyId`, `dueDate`, `returnDate` và
`overdueDays`. Dịch vụ sẽ loại bỏ đối tượng nội bộ này trước khi trả về `borrowDetail` công khai.

- [x] **Bước 1: Thêm hồi quy RED cũ**

Thêm kiểm tra lộ trình đặt ngày đến hạn ban đầu, chỉ thay đổi ngày đến hạn khi giao dịch kho lưu trữ
bắt đầu và kiểm tra tính chẵn lẻ của phản hồi/kiểm tra:

```js
test('return response and audit use the due date locked by the repository', async () => {
  let currentTime = new Date('2026-06-01T00:00:00.000Z');
  const { app, authDependencies, borrowingDependencies } = makeTestApp({
    clock: () => currentTime,
  });
  const member = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'return-locked-owner@example.test',
  });
  const librarian = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'return-locked-librarian@example.test',
    role: 'LIBRARIAN',
    approveMember: false,
  });
  const created = await request(app)
    .post('/api/borrow-requests')
    .set('Authorization', authHeader(member.accessToken))
    .send({ copyIds: [1] })
    .expect(201);
  const approved = await request(app)
    .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/approve`)
    .set('Authorization', authHeader(librarian.accessToken))
    .send({})
    .expect(200);
  const borrowDetailId = approved.body.borrowRequest.details[0].borrowDetailId;
  const storedDetail = borrowingDependencies.state.borrowDetails.find(
    (detail) => detail.borrowDetailId === borrowDetailId
  );
  storedDetail.dueDate = '2026-06-08';
  currentTime = new Date('2026-06-20T00:00:00.000Z');

  const originalReturn = borrowingDependencies.borrowingRepository.returnBorrowDetail;
  borrowingDependencies.borrowingRepository.returnBorrowDetail = async (input) => {
    storedDetail.dueDate = '2026-06-18';
    return originalReturn.call(borrowingDependencies.borrowingRepository, input);
  };

  const response = await request(app)
    .patch(`/api/borrow-details/${borrowDetailId}/return`)
    .set('Authorization', authHeader(librarian.accessToken))
    .send({ condition: 'NORMAL', returnDate: '2026-06-20' })
    .expect(200);

  expect(response.body.borrowDetail).not.toHaveProperty('authoritativeReturn');
  expect(response.body.fineCandidate.overdueDays).toBe(2);
  const audit = authDependencies.state.auditLogs.find(
    (entry) => entry.action === 'BORROW_DETAIL_RETURN'
  );
  expect(audit.metadata).toMatchObject({
    dueDate: '2026-06-18',
    returnDate: '2026-06-20',
    overdueDays: 2,
    condition: 'NORMAL',
  });
});
```

- [x] **Bước 2: Thêm xác nhận RED hợp đồng nguồn kho lưu trữ**

Mở rộng kiểm thử thứ tự khóa trả sách hiện có trong `backend/tests/borrowingRepository.test.js`:

```js
expect(source).toContain('bd.DueDate');
expect(source).toContain('br.UserId');
expect(source).toContain('INSERTED.ReturnDate');
expect(source).toContain('buildReturnEvidence(authoritativeReturn)');
expect(source.indexOf('buildReturnEvidence(authoritativeReturn)')).toBeGreaterThan(
  detailLockIndex
);
```

- [x] **Bước 3: Chạy RED**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js --testNamePattern "due date locked|return serializes"
```

Dự kiến: báo cáo kiểm tra lộ trình `overdueDays = 12` cũ và xác nhận hợp đồng nguồn kho lưu trữ
không thành công.

- [x] **Bước 4: Gia hạn hợp đồng kho lưu trữ SQL**

Trong `backend/src/repositories/borrowingRepository.js`:

1. Chấp nhận `buildReturnEvidence` tùy chọn trong khi vẫn giữ `auditEntry` tùy chọn
   cho người gọi kho lưu trữ trực tiếp hiện có.
2. Khóa `bd.DueDate` và `br.UserId` một cách chi tiết.
3. Thêm `INSERTED.ReturnDate` vào đầu ra cập nhật chi tiết.
4. Xây dựng bằng chứng sau khi tồn tại các giá trị bị khóa và giá trị trả sách đã cam kết,
   nhưng trước khi viết kiểm toán và cam kết giao dịch.
5. Trả về chi tiết được ánh xạ bằng `authoritativeReturn` bên trong.

Sử dụng hợp đồng này:

```js
async function returnBorrowDetail({
  borrowDetailId,
  detailStatus,
  copyStatus,
  returnDate,
  auditLogRepository,
  auditEntry,
  buildReturnEvidence,
}) {
  let authoritativeReturn = null;
  let returnEvidence = null;
  // Existing transaction setup and lock order remain unchanged.

  // The locked detail query includes bd.DueDate and br.UserId.
  // The UPDATE output includes INSERTED.RequestId, INSERTED.CopyId,
  // and INSERTED.ReturnDate.
  authoritativeReturn = {
    requestId: Number(lockedDetail.RequestId),
    userId: Number(lockedDetail.UserId),
    copyId: Number(lockedDetail.CopyId),
    dueDate: lockedDetail.DueDate,
    returnDate: detail.ReturnDate,
  };
  returnEvidence = typeof buildReturnEvidence === 'function'
    ? buildReturnEvidence(authoritativeReturn)
    : null;
  const resolvedAuditEntry = returnEvidence?.auditEntry || auditEntry;

  if (auditLogRepository && resolvedAuditEntry) {
    await auditLogRepository.create({ ...resolvedAuditEntry, transaction });
  }

  // Commit, then preserve the existing post-commit readback behavior.
  const returnedDetail = await findBorrowDetailById(borrowDetailId);
  return {
    ...returnedDetail,
    authoritativeReturn: {
      ...authoritativeReturn,
      overdueDays: returnEvidence?.overdueDays ?? null,
    },
  };
}
```

Việc triển khai thực tế phải giữ lại mọi đường dẫn quay lui và xung đột hiện có; đoạn mã chỉ xác
định hợp đồng và đơn đặt hàng đã thay đổi.

- [x] **Bước 5: Phản chiếu hợp đồng vào kho lưu trữ trong bộ nhớ**

Sau khi chi tiết/bản sao được chọn và trước khi thao tác ghi, hãy gọi lệnh gọi lại `buildReturnEvidence`
tương tự với chi tiết hiện tại trong bộ nhớ:

```js
const authoritativeReturn = {
  requestId: detail.requestId,
  userId: detail.userId,
  copyId: detail.copyId,
  dueDate: detail.dueDate,
  returnDate,
};
const returnEvidence = typeof buildReturnEvidence === 'function'
  ? buildReturnEvidence(authoritativeReturn)
  : null;
const resolvedAuditEntry = returnEvidence?.auditEntry || auditEntry;
```

Sử dụng `resolvedAuditEntry` để kiểm tra và hoàn trả giao dịch:

```js
return {
  ...mapDetail(detail),
  authoritativeReturn: {
    ...authoritativeReturn,
    overdueDays: returnEvidence?.overdueDays ?? null,
  },
};
```

- [x] **Bước 6: Xây dựng phản hồi và kiểm tra từ một lệnh gọi lại dịch vụ**

Trong `backend/src/services/borrowingService.js`, hãy xóa `overdueDays` kiểm tra trước và kiểm tra hoàn
trả dựng sẵn. Vượt qua:

```js
buildReturnEvidence: ({ requestId, userId, copyId, dueDate, returnDate: committedReturnDate }) => {
  const overdueDays = overdueDaysBetween(dueDate, committedReturnDate);
  return {
    overdueDays,
    auditEntry: buildAuditEntry(context, 'BORROW_DETAIL_RETURN', {
      userId: actor.userId,
      targetType: 'BORROW_DETAIL',
      targetId: borrowDetailId,
      metadata: {
        requestId,
        memberId: userId,
        copyId,
        dueDate: formatBusinessDate(dueDate),
        returnDate: formatBusinessDate(committedReturnDate),
        condition: input.condition,
        overdueDays,
        notes: input.notes || null,
      },
    }),
  };
},
```

Sau khi xử lý xung đột, hãy loại bỏ đối tượng bên trong:

```js
const { authoritativeReturn, ...publicBorrowDetail } = returnedDetail;
const overdueDays = authoritativeReturn.overdueDays;

return {
  borrowDetail: publicBorrowDetail,
  fineCandidate: {
    userId: authoritativeReturn.userId,
    borrowDetailId,
    copyId: authoritativeReturn.copyId,
    condition: input.condition,
    overdueDays,
    needsFineReview:
      overdueDays > 0 || input.condition === 'DAMAGED' || input.condition === 'LOST',
  },
};
```

- [x] **Bước 7: Chạy GREEN**

Chạy lệnh từ Bước 3, sau đó:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js
```

Dự kiến: cả hai dãy đều đạt; phản ứng của công chúng không có trường bằng chứng nội bộ; kiểm tra và
`fineCandidate` sử dụng ngày đến hạn bị khóa.

- [ ] **Bước 8: Bằng chứng SQL thực tế tùy chọn**

Không chạy: `DB_NAME` và `FE07_SQL_TEST_ALLOW_MUTATION` đều chưa được đặt, do đó không có lệnh SQL
có thể thay đổi nào được ủy quyền.

Đầu tiên chỉ in tên cơ sở dữ liệu và xác nhận đó là dữ liệu cục bộ dùng một lần:

```powershell
Write-Output $env:DB_NAME
Write-Output $env:FE07_SQL_TEST_ALLOW_MUTATION
```

Chỉ chạy bộ SQL khi tên rõ ràng chỉ dùng một lần và cờ thao tác ghi là `true`:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/sql/borrowingConcurrency.sqltest.js --testNamePattern "return"
```

Dự kiến: trả về tính đồng thời, ảnh chụp nhanh bị khóa và kiểm tra khôi phục vượt qua. Nếu không thì
ghi lại bằng chứng SQL là không chạy; không trỏ kiểm thử vào môi trường tiền sản xuất hoặc cơ sở dữ
liệu dùng chung.

- [x] **Bước 9: Điểm kiểm tra không cần cam kết**

Kiểm tra khác biệt FE07 gồm năm tệp. Đừng giai đoạn hoặc cam kết.

---

### Nhiệm vụ 3: Số học Lịch gia hạn chung FE07

**ID nhiệm vụ:** `FE07-T050`

**Tệp:**
- Sửa đổi: `backend/tests/borrowingRoutes.test.js`
- Sửa đổi: `backend/src/services/borrowingService.js`
- Sửa đổi: `backend/src/repositories/borrowingRepository.js`
- Sửa đổi: `backend/tests/helpers/inMemoryBorrowingRepositories.js`

**Giao diện:**
- Tiêu thụ: `formatBusinessDate`, `addBusinessDays` và
  `compareBusinessDates` từ `backend/src/utils/libraryBusinessTime.js`.
- Tạo ra: `YYYY-MM-DD` `newDueDate` chính xác độc lập với múi giờ của máy chủ.

- [x] **Bước 1: Thêm hồi quy RED theo múi giờ**

```js
test('renewal extends the business due date identically across host timezones', async () => {
  const { app, authDependencies, borrowingDependencies } = makeTestApp({
    clock: () => new Date('2026-03-07T12:00:00.000Z'),
  });
  const member = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'renew-business-date@example.test',
  });
  const librarian = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'renew-business-date-staff@example.test',
    role: 'LIBRARIAN',
    approveMember: false,
  });
  const created = await request(app)
    .post('/api/borrow-requests')
    .set('Authorization', authHeader(member.accessToken))
    .send({ copyIds: [1] })
    .expect(201);
  const approved = await request(app)
    .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/approve`)
    .set('Authorization', authHeader(librarian.accessToken))
    .send({})
    .expect(200);
  const borrowDetailId = approved.body.borrowRequest.details[0].borrowDetailId;
  borrowingDependencies.state.borrowDetails.find(
    (detail) => detail.borrowDetailId === borrowDetailId
  ).dueDate = '2026-03-08';

  const response = await request(app)
    .patch(`/api/borrow-details/${borrowDetailId}/renew`)
    .set('Authorization', authHeader(member.accessToken))
    .send({})
    .expect(200);

  expect(response.body.borrowDetail.dueDate).toBe('2026-03-22');
});
```

- [x] **Bước 2: Chạy ma trận múi giờ RED**

```powershell
$env:TZ='UTC'
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js --testNamePattern "business due date identically"
$env:TZ='America/New_York'
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js --testNamePattern "business due date identically"
Remove-Item Env:TZ -ErrorAction SilentlyContinue
```

Dự kiến: quá trình triển khai máy chủ cục bộ hiện tại không thành công ở ít nhất `America/New_York`.

- [x] **Bước 3: Xóa số học dịch vụ máy chủ cục bộ**

Xóa trình trợ giúp `addDays()` cục bộ và thay thế tiện ích mở rộng gia hạn bằng:

```js
// @spec BR-FE07-015, FR-FE07-009, NFR-FE07-TIME-001
const currentDueDate = formatBusinessDate(borrowDetail.dueDate);
const newDueDate = addBusinessDays(currentDueDate, LOAN_DAYS);
```

- [x] **Bước 4: Sử dụng trình trợ giúp so sánh được chia sẻ trong tính chẵn lẻ của kho lưu trữ**

Nhập `formatBusinessDate` và `compareBusinessDates` vào kho lưu trữ SQL và trình trợ giúp trong bộ
nhớ. Thay thế các so sánh gia hạn bị ảnh hưởng bằng:

```js
compareBusinessDates(formatBusinessDate(detail.DueDate), String(today)) < 0
```

và:

```js
compareBusinessDates(formatBusinessDate(item.dueDate), String(today)) < 0
```

Sử dụng so sánh tương tự trong phương pháp `hasOverdueActiveLoans` trong bộ nhớ để ánh sáng trước
dịch vụ và giao dịch có thẩm quyền trong bộ nhớ đồng ý. Không thay đổi vị từ SQL `bd.DueDate <
@Today` vì SQL Server đã so sánh các giá trị `date` đã nhập.

- [x] **Bước 5: Chạy GREEN ở cả hai múi giờ**

Lặp lại Bước 2.

Dự kiến: cả hai lần chạy múi giờ đều có ngày đến hạn `2026-03-22`.

- [x] **Bước 6: Chạy bộ FE07 tập trung**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js
```

Dự kiến: ĐẠT mà không gia hạn, trả sách, kiểm tra hoặc hồi quy đặt chỗ.

- [x] **Bước 7: Điểm kiểm tra không cần cam kết**

Tìm kiếm đường dẫn gia hạn bị ảnh hưởng:

```powershell
rg -n "setDate|getDate|setHours" backend/src/services/borrowingService.js backend/src/repositories/borrowingRepository.js backend/tests/helpers/inMemoryBorrowingRepositories.js
```

Dự kiến: không còn số học lịch máy chủ-cục bộ nào trong logic gia hạn bị ảnh hưởng. Đừng giai đoạn
hoặc cam kết.

---

### Nhiệm vụ 4: Định nghĩa mẫu được lưu trữ không đóng được FE10

**ID nhiệm vụ:** `FE10-S11`

**Tệp:**
- Sửa đổi: `backend/tests/notificationRoutes.test.js`
- Sửa đổi: `backend/src/services/notificationService.js`

**Giao diện:**
- Tiêu thụ: mẫu `{ subject, body }` được trả về bởi
  `notificationRepository.findTemplateByCode(templateKey)`.
- Sản xuất:
`validateStoredTemplateDefinition(template): void`, ném `400 UNSAFE_TEMPLATE_DEFINITION` an toàn
trước khi kết xuất hoặc tác dụng phụ.

- [x] **Bước 1: Thêm kiểm thử RED dựa trên bảng**

```js
test.each([
  ['subject', '<script>alert(1)</script>Verify'],
  ['body', 'Click onclick=alert(1) to continue'],
  ['body', 'Open javascript:alert(1)'],
])('rejects unsafe stored template %s before persistence or delivery', async (field, value) => {
  const {
    notificationService,
    notificationDependencies,
    emailProviderMessages,
  } = makeTestApp();
  const template = notificationDependencies.state.templates.find(
    (item) => item.templateCode === 'ACCOUNT_VERIFICATION'
  );
  template[field] = value;

  await expect(
    notificationService
      .createSourceNotificationRequester('FE02')
      .createNotificationRequest(
        makeSensitiveRequestInput({
          type: 'ACCOUNT_VERIFICATION',
          recipientEmail: 'unsafe-template@example.test',
          templateData: { otp: '123456', expiresInMinutes: 15 },
          sourceEntityId: 901,
        })
      )
  ).rejects.toMatchObject({
    statusCode: 400,
    code: 'UNSAFE_TEMPLATE_DEFINITION',
  });

  expect(notificationDependencies.state.notifications).toEqual([]);
  expect(notificationDependencies.state.attempts).toEqual([]);
  expect(emailProviderMessages).toEqual([]);
});
```

- [x] **Bước 2: Chạy RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js --testNamePattern "unsafe stored template"
```

Dự kiến: các yêu cầu được chấp nhận/kết xuất thay vì từ chối bằng `UNSAFE_TEMPLATE_DEFINITION`.

- [x] **Bước 3: Thêm cổng định nghĩa được lưu trữ**

Thêm gần `renderTemplate()`:

```js
function containsUnsafeTemplateDefinition(value) {
  const definition = String(value ?? '');
  return /<\/?[a-z][^>]*>/i.test(definition)
    || /\bon[a-z]+\s*=/i.test(definition)
    || /\bjavascript\s*:/i.test(definition);
}

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
```

Gọi nó ngay sau khi tra cứu mẫu đang hoạt động và trước khi giải quyết người nhận, xác thực dữ liệu
mẫu, kết xuất, lưu giữ hoặc I/O của nhà cung cấp:

```js
validateStoredTemplateDefinition(template);
const recipient = await resolveRecipient(requestInput);
```

Giữ nguyên `sanitizeString`, `sanitizePayload` và `renderTemplate` để các giá trị thời gian chạy vẫn
được thoát/khử trùng.

- [x] **Bước 4: Chạy GREEN cộng với bảo toàn giá trị thời gian chạy**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js --testNamePattern "unsafe stored template|sanitizes script content in template data"
```

Dự kiến: các định nghĩa được lưu trữ không an toàn bị từ chối mà không có tác dụng phụ; kiểm thử dọn
dẹp giá trị thời gian chạy hiện tại vẫn vượt qua.

- [x] **Bước 5: Chạy bộ lộ trình FE10 đầy đủ**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js
```

Dự kiến: đạt với quyền sở hữu nguồn, biên tập bí mật, tính tạm thời, `PROCESSING`, thử lại và các
hợp đồng DTO không thay đổi.

- [x] **Bước 6: Điểm kiểm tra không cần cam kết**

Kiểm tra sự khác biệt của hai tệp và xác minh rằng không có nội dung mẫu hoặc giá trị bí mật nào
xuất hiện do lỗi. Đừng giai đoạn hoặc cam kết.

---

### Nhiệm vụ 5: Danh sách cho phép truy vấn điểm cuối chính xác của FE12

**ID nhiệm vụ:** `FE12-N11`

**Tệp:**
- Sửa đổi: `backend/tests/reportRoutes.test.js`
- Sửa đổi: `backend/src/validators/reportValidators.js`

**Giao diện:**
- Sản xuất:
  `rejectUnsupportedQueryParameters(allowedKeys): ExpressMiddleware`.
- Phần mềm trung gian gọi `next()` để biết chính xác các khóa được phép và các cuộc gọi khác
  `next(errors.badRequest('UNSUPPORTED_REPORT_QUERY_PARAMETER', ...))`.

- [x] **Bước 1: Thêm ma trận RED cấp tuyến**

```js
test.each([
  ['/api/reports/borrowing', 'getBorrowingReport'],
  ['/api/reports/inventory', 'getInventoryReport'],
  ['/api/reports/users', 'getUserStatistics'],
])('rejects unsupported query keys before %s executes', async (path, repositoryMethod) => {
  const { app, authDependencies, borrowingDependencies, reportDependencies } =
    makeTestApp();
  const admin = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: `report-allowlist-${repositoryMethod}@example.test`,
    role: 'ADMIN',
    approveMember: false,
  });
  const spies = [
    jest.spyOn(reportDependencies.reportRepository, 'getBorrowingReport'),
    jest.spyOn(reportDependencies.reportRepository, 'getInventoryReport'),
    jest.spyOn(reportDependencies.reportRepository, 'getUserStatistics'),
  ];

  const response = await request(app)
    .get(`${path}?bogus=runtime-secret-value`)
    .set('Authorization', authHeader(admin.accessToken));

  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('UNSUPPORTED_REPORT_QUERY_PARAMETER');
  expect(JSON.stringify(response.body)).not.toContain('runtime-secret-value');
  for (const spy of spies) {
    expect(spy).not.toHaveBeenCalled();
  }
});
```

- [x] **Bước 2: Chạy RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reportRoutes.test.js --testNamePattern "unsupported query keys"
```

Dự kiến: cả ba yêu cầu đều trả về `200` và gọi phương thức kho lưu trữ báo cáo.

- [x] **Bước 3: Thêm phần mềm trung gian khóa chính xác có thể tái sử dụng**

Nhập các lỗi an toàn và xác định danh sách cho phép chính xác:

```js
const errors = require('../utils/safeErrors');

const borrowingReportQueryKeys = [
  'q', 'fromDate', 'toDate', 'status', 'bookId', 'userId', 'page', 'limit',
];
const inventoryReportQueryKeys = [
  'q', 'categoryId', 'bookId', 'status', 'location', 'page', 'limit',
];
const userStatisticsQueryKeys = [
  'q', 'roleId', 'status', 'membershipStatus', 'fromDate', 'toDate', 'page', 'limit',
];

function rejectUnsupportedQueryParameters(allowedKeys) {
  const allowed = new Set(allowedKeys);
  return function validateReportQueryKeys(req, res, next) {
    const unsupportedKey = Object.keys(req.query || {}).find((key) => !allowed.has(key));
    if (!unsupportedKey) {
      return next();
    }
    return next(
      errors.badRequest(
        'UNSUPPORTED_REPORT_QUERY_PARAMETER',
        'Report query parameter is not supported.'
      )
    );
  };
}
```

Đặt phần mềm trung gian phù hợp đầu tiên trong mỗi mảng trình xác thực:

```js
const borrowingReportValidators = [
  rejectUnsupportedQueryParameters(borrowingReportQueryKeys),
  searchValidator,
  // Existing validators remain unchanged.
];
```

Lặp lại cho khoảng không quảng cáo và người dùng. Chỉ xuất các mảng nhà máy và khóa nếu kiểm thử đơn
vị tập trung cần chúng; hành vi tuyến đường là hợp đồng chính.

- [x] **Bước 4: Chạy GREEN**

Lặp lại Bước 2.

Dự kiến: tất cả các điểm cuối đều trả về `400` an toàn, không lặp lại giá trị và cả ba gián điệp kho
lưu trữ vẫn không bị ảnh hưởng.

- [x] **Bước 5: Chạy kiểm thử bảo quản khóa đã được phê duyệt**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reportRoutes.test.js
```

Dự kiến: các bộ lọc hiện có, ID trống, xác thực chỉ ngày, bảo vệ vai trò, quyền riêng tư kiểm tra,
phân trang và tất cả phản hồi báo cáo vẫn có màu xanh.

- [x] **Bước 6: Điểm kiểm tra không cần cam kết**

Kiểm tra sự khác biệt của hai tập tin. Xác nhận phần mềm trung gian có khóa không xác định là phần
mềm đầu tiên trong cả ba mảng trình xác thực. Đừng giai đoạn hoặc cam kết.

---

### Nhiệm vụ 6: Xác minh chuyển giao chỉ hồi quy FE08

**ID nhiệm vụ:** `FE08-T047`

**Tệp:**
- Không có thay đổi tệp sản xuất FE08.
- Xác minh: `backend/tests/reservationRoutes.test.js`
- Xác minh: `backend/tests/systemIntegration.test.js`

**Giao diện:**
- FE08 -> FE10:
`RESERVATION_AVAILABLE -> RESERVATION_READY` thông qua trình yêu cầu FE08 có giới hạn xây dựng.
- FE08 -> FE07: ưu tiên đặt chỗ hiện hoạt chặn việc gia hạn của thành viên khác
  mà không thay đổi lượt mượn.

- [x] **Bước 1: Chạy hồi quy chuẩn của người yêu cầu**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reservationRoutes.test.js --testNamePattern "binds FE08 and submits the canonical reservation-ready notification request"
```

Dự kiến: ĐẠT với một người yêu cầu gắn với FE08 và siêu dữ liệu nguồn chuẩn.

- [x] **Bước 2: Chạy chức năng chéo SIT-003 và SIT-004**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/systemIntegration.test.js --testNamePattern "SIT-003|SIT-004"
```

Dự kiến: việc giữ hàng đợi tạo ra một yêu cầu FE10 và ưu tiên đặt chỗ chặn việc gia hạn FE07 mà
không bị thao tác ghi.

- [x] **Bước 3: Dừng khi FE08 bị lỗi**

Không sửa đổi FE08. Chẩn đoán và quay lại đánh giá SPEC nếu lỗi yêu cầu thay đổi quy tắc sản phẩm.

---

### Nhiệm vụ 7: Xác thực chức năng chéo và bằng chứng thời gian chạy thực

**ID nhiệm vụ:** `FE07-T051`, `FE08-T047`, `FE10-S11`, `FE12-N11`

**Tệp:**
- Sửa đổi: `tests/e2e/system-golden-path.spec.js`
- Tạo sau khi tất cả các lệnh chạy:
  `.sdd/reviews/fe07-fe10-fe12-business-rule-alignment-validation-2026-07-27.md`
- Chỉ cập nhật các hộp kiểm/bằng chứng nhiệm vụ sau khi có kết quả quan sát được.

**Giao diện:**
- Tạo gói đánh giá H2: hoàn thành các kết quả khác biệt không được cam kết, L1-L4,
  bằng chứng thời gian chạy, khoảng trống và rủi ro còn sót lại.

- [x] **Bước 1: Chạy cổng L1 tập trung**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js tests/notificationRoutes.test.js tests/reportRoutes.test.js tests/reservationRoutes.test.js tests/systemIntegration.test.js
```

Dự kiến: cả sáu dãy đều đạt.

- [x] **Bước 2: Chạy ma trận múi giờ**

```powershell
$env:TZ='UTC'
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js --testNamePattern "business due date identically|due date locked|single-role librarian renews"
$env:TZ='America/New_York'
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js --testNamePattern "business due date identically|due date locked|single-role librarian renews"
Remove-Item Env:TZ -ErrorAction SilentlyContinue
```

Dự kiến: cả hai lần đều diễn ra với ngày và kết quả kinh doanh giống hệt nhau.

- [x] **Bước 3: Chạy kiểm tra chất lượng hoàn toàn tự động**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:traceability-state
npm.cmd run trace:enforce
git diff --check
```

Dự kiến: tất cả các lệnh thoát 0; phạm vi bảo hiểm máy chủ vẫn ở trên ngưỡng toàn cầu 80% của kho
lưu trữ; khả năng truy vết nguồn gốc FE07, FE08, FE10 và FE12 vẫn được thực thi.

- [x] **Bước 4: Chạy trình duyệt thực/chấp nhận thời gian chạy**

```powershell
npx.cmd playwright test tests/e2e/system-golden-path.spec.js tests/e2e/fe08-reservation-candidate-catalog.spec.js --project=chromium
```

Dự kiến: cả hai kịch bản Playwright đều vượt qua các máy chủ HTTP cục bộ thực tế. luồng nghiệp vụ
chuẩn chứng minh đăng nhập -> mượn -> phê duyệt -> trả sách -> phạt -> báo cáo; kịch bản FE08 chứng
minh việc tìm kiếm ứng viên và yêu cầu đặt chỗ thực sự. Giữ dấu vết/ảnh chụp màn hình lỗi; không
quảng cáo chúng như là bằng chứng vượt qua.

- [x] **Bước 5: Xác minh FE12 thông qua ranh giới HTTP đang chạy**

Trong thời gian chạy Playwright, hãy sử dụng bối cảnh yêu cầu Quản trị viên/Thư viện đã được xác
thực đã được tạo bởi quá trình kiểm tra và xác nhận:

```js
const response = await request.get(
  `${BACKEND_URL}/api/reports/borrowing?bogus=runtime-secret-value`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
expect(response.status()).toBe(400);
const payload = await response.json();
expect(payload).toMatchObject({
  error: { code: 'UNSUPPORTED_REPORT_QUERY_PARAMETER' },
});
expect(JSON.stringify(payload)).not.toContain('runtime-secret-value');
```

Thêm xác nhận này vào `tests/e2e/system-golden-path.spec.js` sau khi `accessToken` hiện có được đọc.
Đây là bằng chứng thời gian chạy chỉ dành cho kiểm thử và không thay đổi quy trình làm việc ở giao
diện người dùng.

- [x] **Bước 6: Thực hiện đánh giá L2 và L3**

Kiểm tra:

```text
L2 Spec:
- BD-007/AT-001 -> FE07-T052 -> đối soát vai trò duy nhất -> bộ bảo vệ vai trò hiện có
- BD-002/AT-002 -> FE07-T049 -> RED/GREEN cho tuyến/kho dữ liệu -> bằng chứng đã khóa
- BD-003/AT-003 -> FE07-T050 -> RED/GREEN cho hai múi giờ -> trình trợ giúp dùng chung
- BD-004/AT-004 -> FE10-S11 -> hồi quy bảo mật không có tác dụng phụ
- BD-005/AT-005 -> FE12-N11 -> cả ba điểm cuối và không gọi kho dữ liệu
- BD-006/AT-006 -> FE08-T047 -> người yêu cầu cùng SIT-003/SIT-004

L3 Constitution/Safety:
- phân quyền phía máy chủ không phụ thuộc thứ tự vai trò
- định nghĩa đã lưu không an toàn phải đóng khi lỗi
- giá trị truy vấn không xác định không bao giờ được phản chiếu lại
- không mở rộng bí mật, lược đồ, phụ thuộc, API công khai hoặc kiến trúc
- kiểm toán trả sách vẫn nằm trong giao dịch
```

Mọi khoảng trống đều quay trở lại nhiệm vụ sở hữu; không làm suy yếu SPEC.

- [x] **Bước 7: Ghi lại bằng chứng quan sát được**

Tạo `.sdd/reviews/fe07-fe10-fe12-business-rule-alignment-validation-2026-07-27.md` với:

1. nhánh chính xác và cam kết trước H2;
2. danh sách tập tin đã thay đổi;
3. Lệnh RED và quan sát thấy lỗi đối với AT-001 đến AT-005;
4. Đầu ra lệnh GREEN/tập trung/đầy đủ/phạm vi bảo hiểm/múi giờ/truy vết;
5. Tên cơ sở dữ liệu SQL và xác nhận dùng một lần hoặc "không chạy" rõ ràng
   tuyên bố không có xác nhận quyền sở hữu SQL;
6. Lệnh thời gian chạy Playwright và các kịch bản được quan sát;
7. Ma trận truy vết L2 và đánh giá an toàn L3;
8. rủi ro tồn tại và tuyên bố rõ ràng rằng việc thực hiện vẫn còn
   chưa được cam kết đang chờ xử lý H2.

Không viết đạt cho lệnh chưa chạy.

- [x] **Bước 8: Chuẩn bị H2; không cam kết**

Chạy:

```powershell
git status --short
git diff --stat
git diff --check
```

Trình bày đầy đủ sự khác biệt và bằng chứng có sẵn cho Nhật. Chỉ có phê duyệt H2 rõ ràng mới cho
phép xuất bản môi trường tiền sản xuất, cam kết, thúc đẩy hoặc PR.

---

### Nhiệm vụ 8: Đối chiếu Hợp đồng chính một vai trò

**ID nhiệm vụ:** `FE07-T052`

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-borrowing-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/TASKS.md`
- Sửa đổi: `docs/superpowers/specs/2026-07-27-fe07-fe10-fe12-business-rule-alignment-design.md`
- Sửa đổi: `docs/superpowers/plans/2026-07-27-fe07-fe10-fe12-business-rule-alignment.md`
- Sửa đổi: `backend/tests/borrowingRoutes.test.js`
- Sửa đổi: `backend/src/services/borrowingService.js`

**Giao diện:**
- Tiêu thụ: `DEC-GEN-005`, `requireMemberOnly` và hiện có
  Hợp đồng tác nhân `renewBorrowDetail()`.
- Production: một vai trò tài khoản được hỗ trợ cho mỗi tác nhân; gia hạn chỉ dành cho chủ sở hữu thành viên;
  Gia hạn nhiều thành viên Thư viện/Quản trị viên; không có trường hợp kinh doanh đa vai trò.

- [x] **Bước 1: Đối chiếu hợp đồng bằng văn bản**

Bảo tồn `FE07-T047`, `FE07-T048` và `FE08-T041` thông qua `FE08-T045` từ `main`. Ghi lại quá trình
dọn dẹp này dưới dạng `FE07-T052` và đánh số lại tác vụ FE08 chỉ hồi quy thành `FE08-T047`. Phân
loại BD-001 ban đầu là BD-001 được thay thế và ghi lại quyết định vai trò đơn đã được phê duyệt là
BD-007.

- [x] **Bước 2: Thay thế kiểm thử lộ trình lỗi thời**

Thay đổi kiểm thử gia hạn đa vai trò tại nhánh cục bộ để nó sử dụng `LIBRARIAN` một vai trò thông
thường để gia hạn nhiều thành viên và `MEMBER` một vai trò riêng biệt cho việc từ chối chủ sở hữu.
Không thay đổi `rolesByUserId` để chứa hai vai trò và không đăng nhập vào tài khoản nhiều vai trò.

- [x] **Bước 3: Xác minh mốc cơ sở một vai trò trước khi dọn dẹp**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/userRoleRepository.test.js --testNamePattern "single-role librarian renews|exactly one role|repairs legacy multiple mappings"
```

Dự kiến: ranh giới vai trò đơn và các trường hợp sửa chữa/bất biến cơ sở dữ liệu đã vượt qua. Đây là
mốc cơ sở điều chỉnh xanh chứ không phải xác nhận hành vi RED mới.

- [x] **Bước 4: Xóa delta ủy quyền thay thế**

Khôi phục hình dạng ủy quyền gia hạn một vai trò đơn giản:

```js
if (hasAnyRole(actor, ['MEMBER']) && borrowDetail.userId !== actor.userId) {
  throw errors.forbidden(
    'BORROW_DETAIL_OWNER_REQUIRED',
    'Members can renew only their own borrowed items.'
  );
}

if (!hasAnyRole(actor, ['MEMBER', 'LIBRARIAN', 'ADMIN'])) {
  throw errors.forbidden('ROLE_REQUIRED', 'Your role cannot perform this action.');
}
```

Không thay đổi khả năng hội đủ điều kiện của chủ lượt mượn, khoản phạt, quá hạn, hạn chế, số lần gia
hạn, ngày làm việc, thông báo hoặc hành vi kiểm toán.

- [x] **Bước 5: Xác minh sau khi dọn dẹp**

Lặp lại Bước 3, sau đó chạy bộ tuyến/kho lưu trữ FE07 tập trung. Dự kiến: tất cả các kiểm thử đã
chọn đều vượt qua và không còn thiết lập tài khoản đa vai trò nào trong kiểm thử căn chỉnh quy tắc.

- [x] **Bước 6: Tiếp tục xác minh đầy đủ Nhiệm vụ 7**

Chạy các cổng backend/frontend/traceability/runtime đầy đủ dựa trên kết quả đã hợp nhất và cập nhật
bản ghi xác thực. Giữ nguyên việc hợp nhất cho đến khi Nhật phê duyệt phụ lục H2.

---

### Nhiệm vụ 9: Đối chiếu phần chính trước mà không cần mở rộng FE08

**ID nhiệm vụ:** `FE08-T047`

- [x] **Bước 1: Hợp nhất `origin/main` với `e20fdc3` mà không cần cam kết**

Giữ PR #63 trên nhánh hiện tại của nó và duy trì việc hợp nhất mở để xem xét H2.

- [x] **Bước 2: Giải quyết xung đột tài liệu FE08**

Bảo tồn `FE07-T047/T048` và `FE08-T041` ngược dòng thông qua `FE08-T044`; đánh số lại các nhiệm vụ
của phần việc này thành `FE07-T049..T052` và `FE08-T047`, giữ lại cách diễn đạt một tài khoản/một vai
trò và chấp nhận chuyển giao bản sao được giữ ngược dòng mà không cần thêm hành vi FE08 khác.

- [x] **Bước 3: Điều chỉnh hợp đồng nhãn vòng đời**

Lần chạy Chrome đầu tiên là RED vì nhánh E2E mong đợi `Đã đặt chỗ` trong khi phiên bản ngược dòng
v0.5.6 hiển thị `Đang đặt chỗ` cho `ACTIVE`. Căn chỉnh kỳ vọng NFR-FE08-UX-003 và E2E với `Đang đặt
chỗ`/`Đến lượt bạn`; không thay đổi mã sản xuất.

- [x] **Bước 4: Lặp lại bằng chứng chính mới nhất**

Chạy kiểm tra một vai trò, cổng chức năng chéo 7 bộ, ma trận múi giờ, chương trình máy chủ và phạm
vi đầy đủ, khả năng truy vết frontend/lint/build, đầy đủ và cả hai kịch bản chấp nhận Chrome.

- [x] **Bước 5: Chuẩn bị phụ lục H2 mới nhất**

Cập nhật bản ghi xác thực với cơ sở chính xác, số lượng quan sát được, trình duyệt ban đầu RED,
GREEN cuối cùng, SQL/giới hạn phân giai đoạn còn lại và giữ cho việc hợp nhất không được cam kết và
không được đẩy.

---

### Nhiệm vụ 10: Tích hợp Quy tắc đặt chỗ cùng một cuốn sách ngược dòng

**ID nhiệm vụ:** ngược dòng `FE08-T045`; hồi quy nhánh `FE08-T047`

- [x] **Bước 1: Hợp nhất `origin/main` với `e99daf5` mà không cần cam kết**

Giữ nhánh PR hiện tại và duy trì hợp nhất mở cho phụ lục H2 mới.

- [x] **Bước 2: Đối chiếu hợp đồng bằng văn bản và ID nhiệm vụ**

Tích hợp FE07 v0.7.8 và FE08 v0.5.9. Giữ ngược dòng `FE08-T045` để biết quy tắc cho vay hiện tại của
cùng một cuốn sách và chuyển nhiệm vụ chuyển giao chỉ hồi quy nhánh sang `FE08-T047`. Bảo quản các
hợp đồng một tài khoản/một vai trò và bản sao chính xác.

- [x] **Bước 3: Xem xét quá trình triển khai sản xuất thượng nguồn**

Xác nhận loại trừ ứng viên, từ chối tạo trực tiếp giao dịch, bỏ qua hàng đợi cũ, khóa lưu thông
Thành viên được chia sẻ, ánh xạ `BOOK_ALREADY_BORROWED` ổn định, SQL được tham số hóa và không có
thay đổi hành vi không liên quan. Việc triển khai được phê duyệt ngược dòng này không phải là yêu
cầu RED mới từ nhánh này.

- [x] **Bước 4: Lặp lại bằng chứng tập trung và đầy đủ**

Chạy các kiểm thử kho lưu trữ/dịch vụ/tuyến đường/giao diện người dùng cùng một cuốn sách, các bộ
điều chỉnh quy tắc và vai trò đơn nhánh, tích hợp nhiều chức năng, ma trận múi giờ, khả năng truy
vết frontend/lint/build, đầy đủ của backend/coverage,, vệ sinh khác biệt và cả hai kịch bản chấp
nhận Chrome.

- [x] **Bước 5: Chuẩn bị phụ lục H2 mới**

Ghi lại số lượng mới chính xác so với `e99daf5`, tính chẵn lẻ của tệp đã thay đổi với `origin/main`,
bằng chứng thời gian chạy, giới hạn phân tầng/SQL có thể thay đổi và hoàn toàn khác biệt có sẵn.
Không cam kết hoặc thúc đẩy trước khi Nhật phê duyệt phụ lục một cách rõ ràng.

---

### Nhiệm vụ 11: Tích hợp hàng đợi có phạm vi sao chép và quyền tốt của thành viên

**ID nhiệm vụ:** ngược dòng `FE08-T046`, ngược dòng `FE09-T024`; hồi quy nhánh `FE08-T047`

- [x] **Bước 1: Hợp nhất `origin/main` với `8d0059b` mà không cần cam kết**

Giữ PR #63 trên nhánh hiện có và giữ nguyên kết quả hợp nhất cho phụ lục H2 mới.

- [x] **Bước 2: Điều chỉnh xung đột giữa SPEC, PLAN, TASKS và phiên bản**

Kết hợp FE07 v0.7.8 song song thay đổi thành v0.7.9 và FE08 v0.5.9 song song thay đổi thành v0.5.10.
Giữ ngược dòng `FE08-T046` cho các vị trí hàng đợi trong phạm vi sao chép và di chuyển bằng chứng
hồi quy nhánh sang `FE08-T047`.

- [x] **Bước 3: Chụp vị trí hàng đợi RED**

Chứng minh rằng trình ánh xạ ngược dòng trả về giá trị rỗng trong khi phần trình bày của Thành
viên/nhân viên vẫn xâu chuỗi nó. Kiểm tra giao diện người dùng tập trung phải thất bại vì không có
định dạng null-safe nào tồn tại.

- [x] **Bước 4: Áp dụng bản sửa lỗi trình bày GREEN bị chặn**

Kết xuất null dưới dạng `Chưa xác định`; duy trì các vị trí `#N` thực và phạm vi mỗi `CopyId` của
chúng trong bảng Thành viên/nhân viên, phản hồi về việc tạo và phản hồi về việc hủy.

- [x] **Bước 5: Xem lại hợp đồng dữ liệu và ủy quyền FE09**

Xác minh `/api/fines/me` là Chỉ dành cho Thành viên theo mô hình chính xác một vai trò, quyền sở hữu
thao tác ghi của nhân viên không thay đổi, SQL vẫn được tham số hóa, OpenAPI DTO khớp với đầu ra của kho
lưu trữ và Giao diện người dùng thành viên vẫn ở chế độ chỉ đọc.

- [x] **Bước 6: Lặp lại bằng chứng tập trung, chức năng chéo, đầy đủ và thời gian chạy**

Chạy các kiểm thử tập trung FE08/FE09, kiểm tra một vai trò, cổng chức năng chéo bảy bộ, ma trận múi
giờ, chương trình máy chủ và độ bao phủ đầy đủ, khả năng truy vết frontend/lint/build, đầy đủ, kiểm
tra xung đột/khác biệt và cả hai kịch bản chấp nhận Chrome. SQL có thể thay đổi vẫn bị cấm nếu không
có cờ cơ sở dữ liệu dùng một lần được phê duyệt.

- [x] **Bước 7: Chuẩn bị phụ lục `8d0059b` H2**

Cập nhật bản ghi xác thực với số lượng chính xác, đánh giá bảo mật RED/GREEN, FE09, tính chẵn lẻ của
tệp đã thay đổi, bằng chứng thời gian chạy và giới hạn phân tầng/SQL còn lại. Không cam kết, đẩy
hoặc cập nhật dự thảo PR #63 trước khi phê duyệt H2 rõ ràng.

---

### Nhiệm vụ 12: Khắc phục sai lệch bằng chứng quản trị H3

**ID nhiệm vụ:** `GOV-H3-001`

**Tệp:**
- Sửa đổi:
  `docs/superpowers/specs/2026-07-27-fe07-fe10-fe12-business-rule-alignment-design.md`
- Sửa đổi:
  `docs/superpowers/plans/2026-07-27-fe07-fe10-fe12-business-rule-alignment.md`
- Sửa đổi các trường trạng thái hiện tại trong FE07, FE08, FE10 và FE12 bị ảnh hưởng
  Các tệp `SPEC.md`, `PLAN.md` và `TASKS.md`.
- Sửa đổi:
  `.sdd/reviews/fe07-fe10-fe12-business-rule-alignment-validation-2026-07-27.md`
- Không sửa đổi mã sản xuất, kiểm tra, lược đồ, phụ thuộc, hợp đồng API,
  hoặc hướng dẫn quy trình trước H2 trước đây.

**Giao diện:**
- Tiêu thụ: phê duyệt H2 rõ ràng vào ngày 27-07-2026, cam kết hợp nhất `f346ae0`, bản nháp
  PR #63 và CI chạy `30244750250` thành công.
- Tạo ra: bằng chứng H2/H3 ở trạng thái hiện tại trung thực và một bản báo cáo mới có sẵn
  gói H2 chỉ có tài liệu.

- [x] **Bước 1: Ghi lại đánh giá H3 đầu tiên**

Ghi lại rằng quá trình xem xét Tiêu chuẩn và đặc tả không tìm thấy lỗi nào về mã sản phẩm hoặc quy
tắc nghiệp vụ. Giữ nguyên chức năng phát lại bình thường của FE10 vì `AC-FE10-008` và `EC-FE10-008`
yêu cầu đường dẫn `200` trùng lặp và nó không thực hiện kết xuất, tính bền vững mới hoặc lệnh gọi
nhà cung cấp.

- [x] **Bước 2: Đồng bộ hóa từ ngữ quản trị trạng thái hiện tại**

Cập nhật bản ghi xác thực và các trường trạng thái chức năng bị ảnh hưởng để chúng nêu rõ:

```text
- phụ lục H2 mới nhất tại 8d0059b đã được phê duyệt;
- thay đổi hợp nhất đã rà soát được ghi nhận/đẩy lên tại f346ae0;
- lượt CI 30244750250 của PR #63 đã đạt;
- lần rà soát H3 đầu tiên chỉ phát hiện cách diễn đạt quản trị đã cũ;
- phần khắc phục tài liệu chưa được ghi nhận và đang chờ H2 mới;
- vẫn bắt buộc lặp lại H3 trước khi hợp nhất.
```

Không viết lại các hướng dẫn lịch sử mô tả chính xác cách thức công việc được thực hiện trước cổng H2 ban đầu.

- [x] **Bước 3: Xác minh phạm vi chỉ dành cho tài liệu**

Xác nhận sự khác biệt về cách khắc phục không chứa tệp sản xuất, kiểm tra, lược đồ, phụ thuộc hoặc
API. Xác nhận chênh lệch PR của sản phẩm 40 tệp trước đó vẫn không thay đổi.

- [x] **Bước 4: Chạy cổng xác thực giới hạn**

Chạy:

```powershell
npm.cmd run test:traceability-state
npm.cmd run trace:enforce
npm.cmd run test:deployment
git diff --check
git diff --cached --check
```

Quét các phần trạng thái hiện tại để tìm từ ngữ H2 cũ đang chờ xử lý, hợp nhất không được cam kết
hoặc đang chờ-PLAN/TASKS. Hướng dẫn nhiệm vụ lịch sử có thể vẫn còn.

- [x] **Bước 5: Chuẩn bị H2 tươi; không cam kết**

Cập nhật bản ghi xác thực với các tệp đã thay đổi chính xác và kết quả lệnh được quan sát. Trình bày
đầy đủ tài liệu khác biệt có sẵn cho H2 mới. Không thực hiện, cam kết, đẩy, cập nhật PR #63, đánh
dấu nó là sẵn sàng hoặc hợp nhất trước khi Nhất phê duyệt rõ ràng phụ lục H2 khắc phục này.

---

### Nhiệm vụ 13: Đóng băng bằng chứng H2 mà không tự tham khảo

**ID nhiệm vụ:** `GOV-H3-002`

**Tệp:**
- Sửa đổi:
  `.sdd/reviews/fe07-fe10-fe12-business-rule-alignment-validation-2026-07-27.md`
- Sửa đổi:
  `docs/superpowers/specs/2026-07-27-fe07-fe10-fe12-business-rule-alignment-design.md`
- Sửa đổi:
  `docs/superpowers/plans/2026-07-27-fe07-fe10-fe12-business-rule-alignment.md`
- Không sửa đổi hành vi chức năng, yêu cầu SPEC, mã sản xuất, kiểm tra,
  lược đồ, phần phụ thuộc hoặc hợp đồng API.

**Giao diện:**
- Tiêu thụ: Phê duyệt nhiệm vụ 12 H2, cam kết `2d0ef78`, CI chạy `30246892241` và
  phát hiện P2 theo Tiêu chuẩn H3 được lặp lại.
- Tạo ra: ảnh chụp nhanh H2 đã đăng ký bất biến cộng với ảnh chụp nhanh không tự tham chiếu
  ranh giới công bố-bằng chứng.

- [x] **Bước 1: Ghi lại kết quả H3 lặp lại**

Ghi lại rằng đánh giá đặc tả/doanh nghiệp đã được thông qua và Tiêu chuẩn chỉ tìm thấy từ ngữ ở
trạng thái hiện tại tự tham chiếu.

- [x] **Bước 2: Xác định bất biến bằng chứng cố định**

Bằng chứng H2 đã đăng ký ghi lại sự thật về thời gian xem xét. PR #63 ghi lại H2 sau, cam kết, CI
cập nhật và các sự kiện H3 lặp lại; bản ghi khóa sổ cuối cùng hợp nhất và CI sau hợp nhất. Không đặt
SHA cam kết trong tương lai bên trong ảnh chụp nhanh trước cam kết của chính nó.

- [x] **Bước 3: Áp dụng biện pháp khắc phục ba tệp bị chặn**

Dán nhãn lại từ ngữ ở trạng thái hiện tại dưới dạng bằng chứng gói H2 bị đóng băng. Lưu giữ tất cả
các hướng dẫn quy trình lịch sử và bằng chứng sản phẩm.

- [x] **Bước 4: Chạy xác thực giới hạn và đóng băng H2**

Xác nhận chính xác ba tệp Markdown đã được thay đổi, không còn nhãn trạng thái hoạt động cũ, vượt
qua kiểm tra truy vết/triển khai và vượt qua vệ sinh khác. Trình bày ảnh chụp nhanh có sẵn cho H2.
Ghi lại các dữ kiện phê duyệt và xuất bản sau này trong PR #63 thay vì thêm trường trạng thái đăng
ký tự tham khảo khác.

---

## Cổng phê duyệt kế hoạch

- [x] Nhật phê duyệt phương án hợp nhất ban đầu và FE07-T049..T052, FE08-T047,
  FE10-S11 và FE12-N11.
- [x] Chỉ sau khi được phê duyệt, hãy bắt đầu Nhiệm vụ 1 với các kiểm thử RED.
- [x] Không suy luận phê duyệt kế hoạch từ phê duyệt SPEC trước đó.
- [x] Nhật xác nhận 1 tài khoản có đúng 1 vai trò và ủy quyền Nhiệm vụ 8
  hòa giải vào ngày 27-07-2026.
- [x] Nhật ủy quyền cho Nhiệm vụ 10 tích hợp `e99daf5` ngược dòng vào ngày 27-07-2026.
- [x] Nhật ủy quyền cho Nhiệm vụ 11 tích hợp `8d0059b` ngược dòng vào ngày 27-07-2026.
- [x] Nhật ủy quyền khắc phục H3 chỉ trong tài liệu Nhiệm vụ 12 vào ngày 27-07-2026.
- [x] Nhật phê duyệt phụ lục Nhiệm vụ 12 H2 vào ngày 27-07-2026; cam kết `2d0ef78`
  và CI chạy `30246892241` được ghi trong PR #63.
- Phê duyệt nhiệm vụ 13 H2 phải được ghi trong PR #63 trước khi xuất bản; tập tin này
cố ý không chứa hộp kiểm cam kết tương lai tự tham chiếu hoặc SHA.
