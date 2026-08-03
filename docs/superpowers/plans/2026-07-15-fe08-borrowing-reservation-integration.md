# FE08 Kế hoạch thực hiện tích hợp vay-dự trữ

> **Đối với nhân viên đại lý:** BẮT BUỘC SUB-SKILL: Sử dụng siêu năng lực:thực thi các kế hoạch để thực hiện kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi. Không sử dụng đại lý phụ cho kế hoạch này.

**Mục tiêu:** Thu hẹp khoảng cách trong vòng đời của FE07-FE08 để ưu tiên đặt chỗ chặn việc vay
thông thường, chủ sở hữu được thông báo có thể yêu cầu bản sao được lưu giữ và phê duyệt FE07 hoàn
toàn đáp ứng việc đặt chỗ phù hợp.

**Kiến trúc:** FE07 vẫn là chủ sở hữu duy nhất trong việc tạo và phê duyệt yêu cầu mượn. Khả năng
vay được phân loại từ trạng thái sao chép cộng với các yêu cầu đặt chỗ `ACTIVE`/`NOTIFIED` tại thời
điểm tạo và được xác nhận lại theo khóa SQL tại thời điểm phê duyệt. Tất cả các thao tác ghi bảo lưu bản
sao đều sử dụng thứ tự khóa `BookCopies -> Reservations` được chia sẻ; không có điểm cuối hoặc lược
đồ nào được thêm vào.

**bộ công nghệ công nghệ:** Node.js, Express.js, SQL Server đến `mssql`, Jest/Supertest, React/Vite
ánh xạ lỗi giao diện người dùng, tạo phẩm Markdown SDD.

## Ràng buộc toàn cầu

- Bảo lưu dự trữ cấp bản sao Giai đoạn 1 trước `CopyId`.
- Duy trì việc xử lý hàng đợi thủ thư thủ công.
- Bảo toàn các yêu cầu và phê duyệt nhiều bản sao của FE07.
- Bảo quản tối đa 5 bản mượn đang hoạt động, thời hạn mượn 14 ngày, một lần gia hạn, chặn quá hạn/phạt và kiểm tra vai trò.
- Không để lộ danh tính của chủ sở hữu đặt chỗ khác trong phản hồi lỗi.
- Không thêm điểm cuối thực hiện, bảng, cột, phần phụ thuộc hoặc công việc xếp hàng tự động.
- Cập nhật đặc tả trước hành vi và ghi lại mọi thay đổi sản xuất thông qua RED -> GREEN TDD.
- Sử dụng lệnh khóa `BookCopies -> Reservations` để giữ hàng đợi, hủy, hết hạn và phê duyệt mượn.
- Không sửa đổi tính toán tinh tế của FE09 hoặc hành vi phân phối FE10.

---

## Bản đồ tệp

### đặc tả và truy vết

- `.sdd/specs/feat-borrowing-management/SPEC.md`: FE07 quy tắc phê duyệt và khả năng mượn có thể nhận biết trước.
- `.sdd/specs/feat-borrowing-management/PLAN.md`: Kế hoạch giao dịch và ranh giới thực hiện FE07.
- `.sdd/specs/feat-borrowing-management/TASKS.md`: nhiệm vụ tích hợp thực thi và cổng xác thực.
- `.sdd/specs/feat-borrowing-management/CHANGELOG.md`: bản ghi thay đổi hành vi.
- `.sdd/specs/feat-reservation-management/SPEC.md`: CopyId/ngôn ngữ hủy cuối cùng và trình kích hoạt thực hiện FE07.
- `.sdd/specs/feat-reservation-management/PLAN.md`: xóa loại trừ thực hiện cũ và mô tả chuyển giao FE07.
- `.sdd/specs/feat-reservation-management/TASKS.md`: đánh dấu công việc tích hợp một cách rõ ràng.
- `.sdd/specs/feat-reservation-management/CHANGELOG.md`: bản ghi thay đổi hành vi.

### Phần máy chủ

- `backend/src/services/borrowingService.js`: phân loại khả năng mượn bản sao cho thành viên hiện tại và kết quả kho bản đồ.
- `backend/src/repositories/borrowingRepository.js`: copy/reservation mô hình đọc và thực hiện phê duyệt nguyên tử.
- `backend/src/repositories/reservationRepository.js`: sắp xếp thứ tự khóa hủy/hết hạn.
- `backend/tests/helpers/inMemoryBorrowingRepositories.js`: khả năng vay mượn phản chiếu và hành vi khôi phục nguyên tử.
- `backend/tests/borrowingRoutes.test.js`: kiểm tra hồi quy tạo/phê duyệt/khôi phục.
- `backend/tests/sql/borrowingConcurrency.sqltest.js`: kiểm tra giao dịch và khóa SQL thực.
- `backend/tests/reservationRoutes.test.js`: hành vi hủy/hết hạn sau khi căn chỉnh lệnh khóa.
- `backend/src/docs/openapi.yaml`: ghi lại hai mã xung đột an toàn mới mà không thay đổi hình dạng điểm cuối.

### Giao diện người dùng và xác thực

- `frontend/src/api/apiErrorMessages.js`: thông điệp tiếng Việt hữu ích.
- `frontend/test/apiErrorMessages.test.js`: hợp đồng nguồn cho những tin nhắn đó.
- `.sdd/reviews/fe07-fe08-borrowing-reservation-integration-validation-2026-07-15.md`: danh sách kiểm tra đánh giá và bằng chứng tự động cuối cùng.

---

### Nhiệm vụ 1: Căn chỉnh các hợp đồng nguồn gốc của FE07 và FE08

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-borrowing-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/CHANGELOG.md`

**Giao diện:**
- Tiêu thụ: thiết kế `docs/superpowers/specs/2026-07-15-fe08-borrowing-reservation-integration-design.md` đã được phê duyệt.
- Tạo ra: mã định danh `BR`/`FR`/`AC` ổn định được sử dụng bởi các nhận xét và kiểm tra mã trong Nhiệm vụ 2-5.

- [ ] **Bước 1: Cập nhật quy tắc và phiên bản FE07**

Chuyển FE07 `SPEC.md` từ `0.3.2` sang `0.4.0`, đặt `Last Updated: 2026-07-15` và thêm các yêu cầu sau:

```markdown
- BR-FE07-023: FE07 chỉ có thể chấp nhận một bản sao khi đó là `AVAILABLE` không có yêu cầu đặt chỗ `ACTIVE`/`NOTIFIED` hoặc khi đó là `RESERVED` theo đặt chỗ `NOTIFIED` thuộc sở hữu của thành viên yêu cầu.
- BR-FE07-024: Hàng đợi đặt chỗ `ACTIVE` cho một bản sao chặn việc tạo và phê duyệt yêu cầu mượn thông thường cho đến khi nhân viên xử lý hoặc giải quyết hàng đợi đó.
- BR-FE07-025: Phê duyệt yêu cầu mượn đối với đặt chỗ `NOTIFIED` do người yêu cầu sở hữu phải thay đổi nguyên tắc đặt chỗ phù hợp thành `FULFILLED` kèm theo yêu cầu mượn, chi tiết, trạng thái sao chép và nhật ký kiểm toán.

- FR-FE07-023: NẾU bản sao được yêu cầu có hàng đợi đặt chỗ `ACTIVE`, FE07 sẽ từ chối việc tạo/phê duyệt với `RESERVATION_QUEUE_PRIORITY` và sẽ không thay đổi bản ghi nào.
- FR-FE07-024: NẾU bản sao là `RESERVED` theo đặt chỗ `NOTIFIED` thuộc sở hữu của thành viên bên vay, FE07 sẽ cho phép tạo yêu cầu và sẽ xác nhận lại quyền sở hữu đó trong quá trình phê duyệt.
- FR-FE07-025: Nhân viên WHEN phê duyệt yêu cầu của chủ sở hữu đã nắm giữ, FE07 sẽ cập nhật mọi đặt chỗ `NOTIFIED` phù hợp thành `FULFILLED` trong giao dịch phê duyệt.

- AC-FE07-015: Với hàng đợi đặt chỗ đang hoạt động, khi một thành viên khác tạo hoặc phê duyệt yêu cầu mượn, thì FE07 sẽ trả về `409 RESERVATION_QUEUE_PRIORITY` và giữ nguyên tất cả trạng thái.
- AC-FE07-016: Đưa ra bản sao dành riêng và đặt chỗ được thông báo thuộc sở hữu của người yêu cầu, khi chủ sở hữu tạo yêu cầu mượn thì FE07 sẽ tạo yêu cầu đang chờ xử lý thông thường mà không giải phóng khoản giữ.
- AC-FE07-017: Đưa ra yêu cầu đang chờ xử lý, khi nhân viên phê duyệt, sau đó mượn hồ sơ, trạng thái sao chép, thực hiện đặt chỗ và cam kết kiểm tra nguyên tử.
```

Thay thế cách diễn đạt khả năng sẵn sàng tuyệt đối cũ bằng hợp đồng mượn sách đã được phê duyệt. Giữ
nguyên `OVERDUE` và giữ nguyên giới hạn năm bản sao.

- [ ] **Bước 2: Cập nhật các quy tắc FE08 và loại bỏ sự mơ hồ cũ**

Chuyển FE08 `SPEC.md` từ `0.3.1` sang `0.4.0`, đặt `Last Updated: 2026-07-15` và thêm/thay thế:

```markdown
- BR-FE08-003: Thành viên chỉ có thể hủy đặt chỗ của chính mình khi trạng thái là `ACTIVE` hoặc `NOTIFIED`.
- BR-FE08-015: Chỉ có sự chấp thuận của FE07 cho cùng một thành viên và bản sao mới có thể chuyển đổi đặt chỗ `NOTIFIED` sang `FULFILLED`.
- BR-FE08-016: Mục nhập hàng đợi `ACTIVE` cấp mức ưu tiên đặt chỗ và chặn các hành động tạo/phê duyệt FE07 thông thường cho bản sao đó cho đến khi xử lý hàng đợi hoặc giải quyết thiết bị đầu cuối.

- FR-FE08-025: WHEN FE07 phê duyệt yêu cầu mượn của chủ sở hữu đặt chỗ đã được thông báo, FE08 sẽ chuyển đổi đặt chỗ phù hợp sang `FULFILLED` trong cùng một giao dịch.
- FR-FE08-026: NẾU FE07 đánh giá một bản sao có hàng đợi đang hoạt động hoặc thông báo lưu giữ của thành viên khác, trạng thái đặt chỗ FE08 sẽ ngăn hoạt động mượn thông thường mà không làm lộ thông tin của chủ sở hữu đặt chỗ.

- AC-FE08-011: Nếu chủ sở hữu được thông báo mượn bản sao được giữ thông qua phê duyệt FE07, thì phần đặt chỗ sẽ trở thành `FULFILLED` và bản sao nguyên tử sẽ trở thành `BORROWED`.
- AC-FE08-012: Cho một bản sao có mức độ ưu tiên đặt chỗ đang hoạt động, khi một thành viên khác cố gắng mượn nó thì hoạt động sẽ bị từ chối và thứ tự hàng đợi được giữ nguyên.
```

Đặt `copyId` thành yêu cầu trong Phần 10.2 và thay đổi `POST /api/reservations` thành `{ copyId:
number }`. Xóa “nhóm có thể thay đổi” và “phụ thuộc vào quyết định của cơ sở dữ liệu”.

- [ ] **Bước 3: Cập nhật kế hoạch, nhiệm vụ và nhật ký thay đổi**

Thêm phần tích hợp vào cả hai gói. Thêm các hàng nhiệm vụ đã chọn/bỏ chọn bằng các ID sau:

```markdown
| FE07-T029 |Thực thi khả năng vay mượn nhận biết trước để tạo và phê duyệt.| BR-FE07-023/024; AC-FE07-015/016 |Trạng thái hàng đợi FE08|Đã vượt qua các kiểm thử tuyến đường RED/GREEN.|
| FE07-T030 |Thực hiện khớp các đặt chỗ đã được thông báo trong giao dịch phê duyệt.| BR-FE07-025; AC-FE07-017 | FE07-T029 |SQL và các kiểm thử khôi phục trong bộ nhớ đã vượt qua.|
| FE08-T025 |Căn chỉnh thứ tự hủy/khóa hết hạn và chuyển giao thực hiện FE07.| BR-FE08-015/016; AC-FE08-011/012 | FE07-T029/T030 |Kiểm tra đồng thời vượt qua mà không bế tắc.|
```

Ghi lại quyết định thiết kế và ranh giới không có lược đồ/không có điểm cuối trong cả hai nhật ký thay đổi.

- [ ] **Bước 4: Chạy kiểm tra tài liệu**

Chạy:

```powershell
rg -n "depends on database decision|team may change|cancel only their own active reservations|FE07 borrow/return or fulfillment implementation" .sdd/specs/feat-borrowing-management .sdd/specs/feat-reservation-management
git diff --check
```

Dự kiến: các bản quét cũ không trả về văn bản yêu cầu hiện hoạt; `git diff --check` thoát khỏi `0`.

- [ ] **Bước 5: Cam kết nhiệm vụ 1**

```powershell
git add .sdd/specs/feat-borrowing-management .sdd/specs/feat-reservation-management
git commit -m "docs: align borrowing reservation contracts"
```

---

### Nhiệm vụ 2: Thực thi ưu tiên đặt chỗ khi tạo yêu cầu mượn

**Tệp:**
- Sửa đổi: `backend/tests/borrowingRoutes.test.js`
- Sửa đổi: `backend/tests/helpers/inMemoryBorrowingRepositories.js`
- Sửa đổi: `backend/src/repositories/borrowingRepository.js`
- Sửa đổi: `backend/src/services/borrowingService.js`

**Giao diện:**
- Tạo ra: `borrowingRepository.findBorrowabilityByCopyIds(copyIds, userId)` trả về trạng thái sao chép cộng với các trường yêu cầu đặt chỗ.
- Sản xuất: `validateCopiesBorrowable(copyIds, userId)` được sử dụng bởi cả người tạo và phê duyệt.

- [ ] **Bước 1: Thêm các kiểm thử lộ trình RED**

Nối các kiểm thử tập trung với mẫu thiết lập này:

```js
test('active reservation queue blocks ordinary borrow request creation', async () => {
  const { app, authDependencies, borrowingDependencies } = makeTestApp();
  const member = await createVerifiedUser({ app, authDependencies, borrowingDependencies, email: 'queue-blocked@example.test' });
  const queueOwner = await createVerifiedUser({ app, authDependencies, borrowingDependencies, email: 'queue-owner@example.test' });

  borrowingDependencies.state.reservations.push({
    reservationId: 901,
    userId: queueOwner.userId,
    copyId: 1,
    status: 'ACTIVE',
    reservedAt: new Date('2026-06-09T00:00:00.000Z'),
  });

  const response = await request(app)
    .post('/api/borrow-requests')
    .set('Authorization', authHeader(member.accessToken))
    .send({ copyIds: [1] });

  expect(response.status).toBe(409);
  expect(response.body.error.code).toBe('RESERVATION_QUEUE_PRIORITY');
  expect(borrowingDependencies.state.borrowRequests).toHaveLength(0);
});

test('notified owner can request their reserved copy', async () => {
  const { app, authDependencies, borrowingDependencies } = makeTestApp();
  const member = await createVerifiedUser({ app, authDependencies, borrowingDependencies, email: 'held-owner@example.test' });
  borrowingDependencies.state.copies.find((copy) => copy.copyId === 1).status = 'RESERVED';
  borrowingDependencies.state.reservations.push({
    reservationId: 902,
    userId: member.userId,
    copyId: 1,
    status: 'NOTIFIED',
    notifiedAt: new Date('2026-06-09T00:00:00.000Z'),
    expiresAt: new Date('2026-06-11T00:00:00.000Z'),
  });

  const response = await request(app)
    .post('/api/borrow-requests')
    .set('Authorization', authHeader(member.accessToken))
    .send({ copyIds: [1] });

  expect(response.status).toBe(201);
  expect(response.body.borrowRequest.details[0]).toMatchObject({ copyId: 1, status: 'REQUESTED' });
  expect(borrowingDependencies.state.reservations[0].status).toBe('NOTIFIED');
});
```

Thêm kiểm thử thứ ba xác nhận một thành viên khác nhận được `COPY_NOT_AVAILABLE` cho cùng một bản
sao `RESERVED` và phản hồi không chứa email/ID người dùng của chủ sở hữu.

- [ ] **Bước 2: Xác minh RED**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runInBand borrowingRoutes.test.js -t "reservation queue|reserved copy"
```

Dự kiến: hàng đợi đang hoạt động hiện cho phép tạo và chủ sở hữu được thông báo hiện nhận được
`COPY_NOT_AVAILABLE`.

- [ ] **Bước 3: Thêm mô hình đọc kho lưu trữ**

Thay thế tra cứu bản sao FE07 riêng tư bằng:

```js
async function findBorrowabilityByCopyIds(copyIds, userId) {
  // Parameterize the existing copy ID list exactly as findCopiesByIds does.
  // OUTER APPLY one ACTIVE queue claim and one NOTIFIED hold per copy.
  // Return copyId/book/status plus hasActiveReservation,
  // notifiedReservationId, and notifiedReservationUserId.
}
```

Phép chiếu SQL phải sử dụng:

```sql
OUTER APPLY (
  SELECT TOP 1 r.ReservationId
  FROM Reservations r
  WHERE r.CopyId = bc.CopyId AND r.Status = 'ACTIVE'
  ORDER BY r.ReservedAt ASC, r.ReservationId ASC
) activeQueue
OUTER APPLY (
  SELECT TOP 1 r.ReservationId, r.UserId
  FROM Reservations r
  WHERE r.CopyId = bc.CopyId AND r.Status = 'NOTIFIED'
  ORDER BY r.NotifiedAt ASC, r.ReservationId ASC
) notifiedHold
```

Phản ánh các trường đó trong `inMemoryBorrowingRepositories.js` và bao gồm `reservations` trong
`snapshotMutationState()` / `restoreMutationState()`.

- [ ] **Bước 4: Triển khai trình phân loại dịch vụ tối thiểu**

Sử dụng một trình phân loại để tạo và phê duyệt:

```js
function classifyCopyBorrowability(copy, userId) {
  if (copy.status === 'AVAILABLE' && copy.hasActiveReservation) {
    throw errors.conflict('RESERVATION_QUEUE_PRIORITY', 'Reservation queue priority must be processed before borrowing.');
  }

  if (copy.status === 'AVAILABLE' && !copy.notifiedReservationId) {
    return 'NORMAL_AVAILABLE';
  }

  if (
    copy.status === 'RESERVED' &&
    copy.notifiedReservationId &&
    Number(copy.notifiedReservationUserId) === Number(userId)
  ) {
    return 'HELD_FOR_MEMBER';
  }

  if (copy.status === 'RESERVED' && !copy.notifiedReservationId) {
    throw errors.conflict('RESERVATION_STATE_CONFLICT', 'Reserved copy state is inconsistent.');
  }

  throw errors.conflict('COPY_NOT_AVAILABLE', 'A requested copy is not available.');
}
```

`validateCopiesBorrowable(copyIds, userId)` vẫn phải trả sách `COPY_NOT_FOUND` cho các ID bị thiếu
và phải phân loại mọi bản sao trước khi tạo yêu cầu.

- [ ] **Bước 5: Xác minh GREEN**

Chạy lệnh tập trung tương tự, sau đó:

```powershell
npm.cmd --prefix backend test -- --runInBand borrowingRoutes.test.js
```

Dự kiến: tất cả các kiểm thử lộ trình FE07 đều vượt qua.

- [ ] **Bước 6: Cam kết nhiệm vụ 2**

```powershell
git add backend/src/services/borrowingService.js backend/src/repositories/borrowingRepository.js backend/tests/helpers/inMemoryBorrowingRepositories.js backend/tests/borrowingRoutes.test.js
git commit -m "feat: enforce reservation priority in borrowing"
```

---

### Nhiệm vụ 3: Thực hiện các đặt chỗ đã được thông báo trong phê duyệt lượt mượn

**Tệp:**
- Sửa đổi: `backend/tests/borrowingRoutes.test.js`
- Sửa đổi: `backend/tests/helpers/inMemoryBorrowingRepositories.js`
- Sửa đổi: `backend/src/services/borrowingService.js`
- Sửa đổi: `backend/src/repositories/borrowingRepository.js`

**Giao diện:**
- Mở rộng: Kết quả kết quả `approveBorrowRequest(...)`.
- Sản xuất: `{ outcome: 'APPROVED', borrowRequest, fulfilledReservationIds }`.

- [ ] **Bước 1: Thêm các kiểm thử phê duyệt và khôi phục RED**

Thêm kiểm thử chứng minh:

```js
expect(approveResponse.status).toBe(200);
expect(heldReservation.status).toBe('FULFILLED');
expect(heldCopy.status).toBe('BORROWED');
expect(auditActions).toEqual(expect.arrayContaining(['BORROW_REQUEST_APPROVE', 'RESERVATION_FULFILL']));
```

Thêm trình bao bọc kho lưu trữ khôi phục chỉ gửi sau khi viết `RESERVATION_FULFILL`:

```js
const reservationAuditFailingRepository = {
  create: jest.fn(async (entry) => {
    await authDependencies.auditLogRepository.create(entry);
    if (entry.action === 'RESERVATION_FULFILL') {
      throw new Error('Reservation audit write failed.');
    }
  }),
};
```

Sau khi yêu cầu xác nhận phê duyệt không thành công `PENDING`, chi tiết `REQUESTED`, sao chép
`RESERVED`, đặt chỗ `NOTIFIED` và không có kiểm tra phê duyệt/thực hiện nào còn sót lại.

- [ ] **Bước 2: Xác minh RED**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runInBand borrowingRoutes.test.js -t "fulfills reservation|reservation audit"
```

Dự kiến: phê duyệt từ chối `RESERVED` hoặc rời khỏi `NOTIFIED`.

- [ ] **Bước 3: Cập nhật giao dịch phê duyệt trong bộ nhớ**

Đối với mỗi chi tiết được yêu cầu, hãy phân loại bản sao theo cùng một quy tắc. Thu thập các thông
tin đặt chỗ được thông báo trùng khớp, chỉ cập nhật chúng sau mỗi lần xác thực thành công và viết cả
hai loại kiểm tra trước khi quay lại. Ảnh chụp nhanh phải khôi phục các đặt chỗ và nhật ký thất bại.

Trả về kết quả kho lưu trữ chính xác như sau:

```js
{ outcome: 'RESERVATION_QUEUE_PRIORITY' }
{ outcome: 'RESERVATION_STATE_CONFLICT' }
{ outcome: 'COPY_NOT_AVAILABLE' }
{ outcome: 'APPROVED', borrowRequest, fulfilledReservationIds }
```

- [ ] **Bước 4: Cập nhật giao dịch phê duyệt SQL**

Bên trong `approveBorrowRequest`, sau khi khóa từng bản sao, hãy khóa các yêu cầu hàng đợi của nó:

```sql
SELECT ReservationId, UserId, Status
FROM Reservations WITH (UPDLOCK, HOLDLOCK)
WHERE CopyId = @CopyId
  AND Status IN ('ACTIVE', 'NOTIFIED')
ORDER BY CASE WHEN Status = 'NOTIFIED' THEN 0 ELSE 1 END,
         ReservedAt ASC,
         ReservationId ASC;
```

Áp dụng ma trận khả năng vay mượn theo các khóa đó. Sau khi cập nhật yêu cầu/chi tiết/sao chép, hãy
cập nhật mọi đặt chỗ được thông báo phù hợp:

```sql
UPDATE Reservations
SET Status = 'FULFILLED', UpdatedAt = GETDATE()
WHERE ReservationId = @ReservationId
  AND UserId = @MemberUserId
  AND CopyId = @CopyId
  AND Status = 'NOTIFIED';
```

Yêu cầu một hàng bị ảnh hưởng cho mỗi lần thực hiện dự kiến. Sự không khớp sẽ trả về
`RESERVATION_STATE_CONFLICT` sau khi khôi phục.

Đối với mỗi lần đặt chỗ đã hoàn thành, hãy sao chép cơ sở kiểm tra do dịch vụ cung cấp với:

```js
{
  action: 'RESERVATION_FULFILL',
  targetType: 'RESERVATION',
  targetId: reservationId,
  metadata: { requestId, copyId, memberUserId },
}
```

- [ ] **Bước 5: Lập bản đồ kết quả trong dịch vụ**

Thêm ánh xạ rõ ràng trước dự phòng chung:

```js
if (approvalResult?.outcome === 'RESERVATION_QUEUE_PRIORITY') {
  throw errors.conflict('RESERVATION_QUEUE_PRIORITY', 'Reservation queue priority must be processed before borrowing.');
}
if (approvalResult?.outcome === 'RESERVATION_STATE_CONFLICT') {
  throw errors.conflict('RESERVATION_STATE_CONFLICT', 'Reserved copy state changed. Reload and try again.');
}
```

- [ ] **Bước 6: Xác minh GREEN và cam kết**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runInBand borrowingRoutes.test.js borrowingRepository.test.js
git diff --check
```

Sau đó cam kết:

```powershell
git add backend/src/services/borrowingService.js backend/src/repositories/borrowingRepository.js backend/tests/helpers/inMemoryBorrowingRepositories.js backend/tests/borrowingRoutes.test.js
git commit -m "feat: fulfill reservations during borrow approval"
```

---

### Nhiệm vụ 4: Căn chỉnh thứ tự khóa đặt chỗ và thêm bằng chứng đồng thời SQL

**Tệp:**
- Sửa đổi: `backend/src/repositories/reservationRepository.js`
- Sửa đổi: `backend/tests/reservationRoutes.test.js`
- Sửa đổi: `backend/tests/sql/borrowingConcurrency.sqltest.js`

**Giao diện:**
- Bảo toàn tất cả các hình dạng điểm cuối FE08 và DTO.
- Làm cho mọi thao tác ghi bảo lưu bản sao khóa `BookCopies` trước `Reservations`.

- [ ] **Bước 1: Thêm các kiểm thử hồi quy hủy/hết hạn RED**

Giữ nguyên các kỳ vọng về tuyến đường hiện có và thêm các kiểm thử nguồn/hành vi chứng minh việc hủy
`NOTIFIED` chỉ phát hành bản sao `RESERVED` của nó, trong khi không thể hủy đặt chỗ đã hoàn thành.

```js
expect(cancelResponse.status).toBe(409);
expect(cancelResponse.body.error.code).toBe('RESERVATION_NOT_ACTIVE');
expect(state.reservations.find(({ reservationId }) => reservationId === fulfilledId).status).toBe('FULFILLED');
```

- [ ] **Bước 2: Căn chỉnh thứ tự khóa SQL**

Tái cấu trúc `cancelReservation` thành:

1. Đọc `CopyId` mà không bị thao tác ghi.
2. Bắt đầu giao dịch.
3. Khóa `BookCopies` bằng `CopyId` bằng `UPDLOCK, HOLDLOCK`.
4. Đọc lại và khóa đặt chỗ bằng `UPDLOCK, HOLDLOCK` với `Status IN ('ACTIVE','NOTIFIED')`.
5. Chỉ hủy và nhả khi trạng thái đọc lại vẫn còn hiệu lực.

Tái cấu trúc `expireOverdueHolds` để xác định ID bản sao/reservation ứng viên, sắp xếp theo
`CopyId`, khóa bản sao trước, xác thực lại mỗi lần hết hạn `NOTIFIED`, sau đó cập nhật bản đặt
chỗ/bản sao trong cùng một giao dịch.

- [ ] **Bước 3: Thêm người trợ giúp hạt giống SQL**

Mở rộng hạt giống kiểm thử SQL với `reservationIds` và:

```js
async function insertReservation(seed, { userId, copyId, status, reservedAt, notifiedAt = null, expiresAt = null }) {
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .input('CopyId', sql.Int, copyId)
    .input('Status', sql.NVarChar(20), status)
    .input('ReservedAt', sql.DateTime, reservedAt)
    .input('NotifiedAt', sql.DateTime, notifiedAt)
    .input('ExpiresAt', sql.DateTime, expiresAt)
    .query(`
      INSERT INTO Reservations (UserId, CopyId, ReservedAt, NotifiedAt, ExpiresAt, Status)
      OUTPUT INSERTED.ReservationId
      VALUES (@UserId, @CopyId, @ReservedAt, @NotifiedAt, @ExpiresAt, @Status)
    `);
  const reservationId = result.recordset[0].ReservationId;
  seed.reservationIds.push(reservationId);
  return reservationId;
}
```

Xóa kiểm tra đặt chỗ và đặt chỗ trước khi xóa bản sao/người dùng trong `cleanSeed`.

- [ ] **Bước 4: Thêm kịch bản SQL RED/GREEN**

Thêm các kiểm thử này:

- Hàng đợi đang hoạt động cộng với yêu cầu đang chờ xử lý thông thường: phê duyệt trả về `RESERVATION_QUEUE_PRIORITY`, giữ hàng đợi thành công, bản sao cuối cùng `RESERVED`, đặt chỗ `NOTIFIED`, yêu cầu `PENDING`.
- Được chủ sở hữu chấp thuận: yêu cầu cuối cùng `APPROVED`, sao chép `BORROWED`, đặt chỗ `FULFILLED`.
- Hai phê duyệt cho một bản sao được giữ: chính xác một `APPROVED`; cái còn lại vẫn là `PENDING` với kết quả xung đột an toàn.
- Hủy/hết hạn so với phê duyệt: không bế tắc; trạng thái cuối cùng khớp với thứ tự được xê-ri hóa và mọi hàng đợi `ACTIVE` còn lại vẫn chặn phê duyệt thông thường.

Chỉ chạy khi môi trường SQL an toàn thao tác ghi được định cấu hình:

```powershell
$env:FE07_SQL_TEST_ALLOW_MUTATION='true'
npm.cmd --prefix backend test -- --runTestsByPath tests/sql/borrowingConcurrency.sqltest.js
```

Dự kiến: tất cả các kiểm thử SQL được nhắm mục tiêu đều vượt qua; không có thời gian chờ/bế tắc.

- [ ] **Bước 5: Giao nhiệm vụ 4**

```powershell
git add backend/src/repositories/reservationRepository.js backend/tests/reservationRoutes.test.js backend/tests/sql/borrowingConcurrency.sqltest.js
git commit -m "fix: serialize reservation and borrowing transitions"
```

---

### Nhiệm vụ 5: Xuất bản lỗi và hợp đồng API

**Tệp:**
- Sửa đổi: `frontend/test/apiErrorMessages.test.js`
- Sửa đổi: `frontend/src/api/apiErrorMessages.js`
- Sửa đổi: `backend/src/docs/openapi.yaml`

**Giao diện:**
- Sản xuất bộ xử lý tiếng Việt cho `RESERVATION_QUEUE_PRIORITY` và `RESERVATION_STATE_CONFLICT`.
- Giữ nguyên hình dạng điểm cuối/yêu cầu/phản hồi API.

- [ ] **Bước 1: Thêm xác nhận tin nhắn giao diện người dùng RED**

Thêm vào `expectedMessages`:

```js
RESERVATION_QUEUE_PRIORITY: 'Bản sao này đang có hàng đợi đặt chỗ. Thủ thư cần xử lý hàng đợi trước khi duyệt mượn.',
RESERVATION_STATE_CONFLICT: 'Trạng thái giữ chỗ vừa thay đổi. Vui lòng tải lại dữ liệu và thử lại.',
```

Chạy:

```powershell
node --test frontend/test/apiErrorMessages.test.js
```

Dự kiến: THẤT BẠI vì các mã mới được chuyển sang bản sao máy chủ.

- [ ] **Bước 2: Thêm tin nhắn và ghi chú OpenAPI**

Thêm các mục tương tự vào `BORROWING_ERROR_MESSAGES`. Ghi lại cả hai mã `409` trên các phản hồi
tạo/phê duyệt yêu cầu mượn; không thêm điểm cuối hoặc trường.

- [ ] **Bước 3: Xác minh và cam kết**

Chạy:

```powershell
node --test frontend/test/apiErrorMessages.test.js
npm.cmd --prefix backend test -- --runInBand borrowingContract.test.js
git diff --check
```

Cam kết:

```powershell
git add frontend/src/api/apiErrorMessages.js frontend/test/apiErrorMessages.test.js backend/src/docs/openapi.yaml
git commit -m "docs: expose reservation priority conflicts"
```

---

### Nhiệm vụ 6: Cổng xác thực đầy đủ và đánh giá con người

**Tệp:**
- Tạo: `.sdd/reviews/fe07-fe08-borrowing-reservation-integration-validation-2026-07-15.md`
- Chỉ sửa đổi khi yêu cầu bằng chứng: hồ sơ từ Nhiệm vụ 1-5.

**Giao diện:**
- Tạo ra bằng chứng tự động cuối cùng; không hợp nhất hoặc đẩy.

- [ ] **Bước 1: Chạy bộ máy chủ tập trung**

```powershell
npm.cmd --prefix backend test -- --runInBand borrowingRoutes.test.js borrowingRepository.test.js reservationRoutes.test.js reservationService.test.js systemIntegration.test.js
```

Dự kiến: tất cả các bộ tập trung đều đạt với 0 lần thất bại.

- [ ] **Bước 2: Chạy các bộ đầy đủ không phải SQL**

```powershell
npm.cmd --prefix backend test -- --runInBand
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Dự kiến: tất cả các lệnh thoát `0`; cảnh báo đoạn Vite không chặn hiện có có thể vẫn còn.

- [ ] **Bước 3: Chạy SQL và cổng truy vết**

Khi có sẵn môi trường SQL an toàn thao tác ghi được định cấu hình:

```powershell
$env:FE07_SQL_TEST_ALLOW_MUTATION='true'
npm.cmd --prefix backend run test:sql:fe07
npm.cmd run trace:enforce
```

Dự kiến: không có lỗi SQL, bế tắc hoặc thiếu ID truy vết.

- [ ] **Bước 4: Xác minh phạm vi và khoảng trắng**

```powershell
git diff main...HEAD --check
git diff main...HEAD --name-only
git diff main...HEAD -- database frontend/src/page frontend/src/component backend/src/routes
```

Dự kiến: không có thay đổi về lược đồ, trang/thành phần hoặc tuyến đường; các tệp đã thay đổi vẫn
nằm trong đặc tả đã được phê duyệt, dịch vụ/kho lưu trữ/kiểm tra FE07/FE08, OpenAPI, ánh xạ lỗi giao
diện người dùng và xem xét bằng chứng.

- [ ] **Bước 5: Viết bản ghi xác nhận**

Tạo tệp đánh giá với:

```markdown
# Xác nhận tích hợp Mượn sách - Đặt chỗ FE07-FE08 - 2026-07-15

Trạng thái: SẴN SÀNG ĐỂ CON NGƯỜI RÀ SOÁT

## Bằng chứng tự động

| Kiểm tra | Kết quả |
| --- | --- |
|Kiểm tra máy chủ tập trung|ĐẠT|
|Kiểm tra máy chủ đầy đủ|ĐẠT|
|Giao diện người dùng tests/lint/build|ĐẠT|
|Đồng thời SQL|ĐẠT hoặc KHÔNG RUN với lý do chính xác về môi trường|
|truy vết|ĐẠT|
|Khoảng trắng/phạm vi khác biệt|ĐẠT|

## Danh sách rà soát của con người

- Hàng đợi đang hoạt động chặn yêu cầu mượn thông thường của thành viên.
- Chủ sở hữu được thông báo có thể yêu cầu bản sao được giữ.
- Sự chấp thuận của nhân viên thay đổi việc đặt chỗ thành đã hoàn thành và sao chép thành đã mượn.
- Việc hủy bỏ/hết hạn sẽ được giữ nguyên mà không bỏ qua hàng đợi còn lại.
- Lỗi không tiết lộ danh tính thành viên nào khác.

## Kết quả rà soát

Phán quyết: Bằng chứng tự động đã hoàn tất; Nhất phải xem xét trước khi hội nhập.
```

- [ ] **Bước 6: Cam kết bằng chứng xác thực và dừng**

```powershell
git add .sdd/reviews/fe07-fe08-borrowing-reservation-integration-validation-2026-07-15.md
git commit -m "docs: validate borrowing reservation integration"
```

Cung cấp nhánh, danh sách cam kết, đường dẫn bằng chứng và danh sách kiểm tra đánh giá. Không hợp
nhất hoặc đẩy cho đến khi Nhật yêu cầu rõ ràng.

---

## Tóm tắt truy vết

| Yêu cầu | Nhiệm vụ |
| --- | --- |
| BR-FE07-023 / FR-FE07-024 / AC-FE07-016 | 1-3 |
| BR-FE07-024 / FR-FE07-023 / AC-FE07-015 | 1-5 |
| BR-FE07-025 / FR-FE07-025 / AC-FE07-017 | 1, 3-4 |
| BR-FE08-015 / FR-FE08-025 / AC-FE08-011 | 1, 3-4 |
| BR-FE08-016 / FR-FE08-026 / AC-FE08-012 | 1-5 |
| Lệnh khóa giao dịch và khôi phục | 3-4, 6 |
| Xung đột an toàn đối với người dùng | 5-6 |
