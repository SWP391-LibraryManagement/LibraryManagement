# Kế hoạch thực hiện tình trạng lượt mượn bị từ chối của thành viên

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Hiển thị `Đã từ chối` trong lịch sử mượn của thành viên sau khi nhân viên từ chối yêu
cầu vay đang chờ xử lý, trong khi vẫn duy trì `BorrowDetails.Status = REQUESTED`.

**Kiến trúc:** Thêm trạng thái yêu cầu sở hữu vào mô hình đọc chi tiết mượn hiện có dưới dạng
`requestStatus`. Trình ánh xạ lịch sử giao diện người dùng sẽ chỉ ưu tiên `REJECTED` khi yêu cầu sở
hữu bị từ chối và nếu không sẽ giữ trạng thái chi tiết hiện có và hành vi quá hạn xuất phát.

**bộ công nghệ công nghệ:** Node.js, Express.js, Jest, Supertest, SQL Server `mssql`, React, Vite,
Trình chạy thử Node, OpenAPI YAML.

## Ràng buộc toàn cầu

- Bảo tồn phần máy chủ Node.js + Express.js đã được phê duyệt, giao diện người dùng React + Bootstrap, cơ sở dữ liệu SQL Server và bộ công nghệ RESTful API.
- Không thay đổi lược đồ cơ sở dữ liệu hoặc giá trị liệt kê `BorrowDetails.Status` vẫn tồn tại.
- Giữ các bộ lọc truy vấn lịch sử được giới hạn ở `REQUESTED`, `BORROWED`, `RETURNED`, `LOST`, `DAMAGED` và `OVERDUE` dẫn xuất.
- Giữ nguyên chức năng xác thực, kiểm tra vai trò, phân trang, sắp xếp ổn định, hành vi kiểm tra từ chối và xác thực lý do từ chối.
- Không tiết lộ lý do từ chối hoặc danh tính nhân viên cho các thành viên.
- Giữ nguyên tất cả các thay đổi về cây làm việc trong bảng điều khiển quản trị và xác thực không liên quan.
- Không cam kết triển khai đã tạo cho đến khi quá trình đánh giá con người bắt buộc hoàn tất.

---

## Bản đồ tệp

| Tập tin | Trách nhiệm |
| --- | --- |
| `.sdd/specs/feat-borrowing-management/SPEC.md` | Xác định hợp đồng đọc lịch sử yêu cầu bị từ chối và tiêu chí chấp nhận. |
| `.sdd/specs/feat-borrowing-management/TASKS.md` | Ghi lại nhiệm vụ bảo trì và bằng chứng xác minh của nó. |
| `.sdd/specs/feat-borrowing-management/CHANGELOG.md` | Ghi lại sự điều chỉnh lịch sử thành viên có thể quan sát được. |
| `backend/src/repositories/borrowingRepository.js` | Ánh xạ SQL `RequestStatus` đã được chọn vào các phản hồi chi tiết về lượt mượn. |
| `backend/tests/helpers/inMemoryBorrowingRepositories.js` | Giữ hành vi kiểm tra tuyến đường trong bộ nhớ phù hợp với hành vi mô hình đọc SQL. |
| `backend/tests/borrowingRoutes.test.js` | Tái tạo hành vi lịch sử từ chối thành viên thông qua ranh giới HTTP. |
| `backend/src/docs/openapi.yaml` | Tài liệu `BorrowDetail.requestStatus`. |
| `backend/tests/borrowingContract.test.js` | Khóa hình dạng và giá trị liệt kê phản hồi OpenAPI. |
| `frontend/src/utils/libraryFeatureViewModels.js` | Giải quyết trạng thái hiển thị thành viên hiệu quả mà không thay đổi trạng thái chi tiết liên tục. |
| `frontend/test/borrowingFrontend.test.js` | Chứng minh các yêu cầu bị từ chối và vẫn đang chờ xử lý hiển thị khác nhau. |

### Nhiệm vụ 1: Căn chỉnh Hợp đồng FE07 đã được phê duyệt

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-borrowing-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/CHANGELOG.md`

**Giao diện:**
- Tiêu thụ: thiết kế `docs/superpowers/specs/2026-07-22-member-rejected-borrow-status-design.md` đã được phê duyệt.
- Tạo ra: `BR-FE07-029`, `FR-FE07-029`, `AC-FE07-023` và nhiệm vụ bảo trì `FE07-T041` để truy vết triển khai.

- [ ] **Bước 1: Thêm quy tắc chức năng và nghiệp vụ của mô hình đọc**

Đặt `Version` thành `0.7.1`, đặt `Last Updated` thành `2026-07-22` và thêm các quy tắc chính xác này
vào các vị trí tuần tự tiếp theo trong `SPEC.md`:

```markdown
- BR-FE07-029: Các hàng chi tiết lịch sử mượn phải hiển thị trạng thái yêu cầu sở hữu tách biệt với trạng thái chi tiết được lưu. Khi yêu cầu sở hữu là `REJECTED`, trạng thái hiển thị cho thành viên là bị từ chối trong khi chi tiết được lưu vẫn là `REQUESTED`.

- FR-FE07-029: Khi thành viên xem chi tiết mượn có yêu cầu sở hữu là `REJECTED`, hệ thống sẽ trả về `requestStatus = REJECTED` và giao diện người dùng sẽ hiển thị `Đã từ chối` thay vì `Chờ xử lý` mà không thay đổi `BorrowDetails.Status`.
```

- [ ] **Bước 2: Thêm tiêu chí chấp nhận và ghi chú API**

Thêm tiêu chí chấp nhận này và làm rõ cả hai endpoint lịch sử mượn trong Phần 11:

```markdown
- AC-FE07-023: Với yêu cầu mượn đang chờ của thành viên, khi nhân viên từ chối và thành viên tải lại lịch sử mượn thì mọi chi tiết thuộc yêu cầu đó hiển thị `Đã từ chối`; yêu cầu vẫn là `REJECTED` và mỗi chi tiết được lưu vẫn là `REQUESTED`.
```

Thay thế hàng `requestStatus` hiện có trong Phần 10.2 bằng phần làm rõ chính xác sau:

```markdown
| requestStatus |chuỗi|Có|Các giá trị: `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`, `CANCELLED`. Phản hồi chi tiết lịch sử mượn hiển thị trạng thái của yêu cầu sở hữu tách biệt với `detailStatus` được lưu.|
```

Thêm câu chính xác này vào ô Ghi chú cho cả hai điểm cuối lịch sử trong Phần 11:

```markdown
Mỗi chi tiết được trả về bao gồm `requestStatus` từ yêu cầu sở hữu của nó; `status` vẫn giữ nguyên trạng thái chi tiết được các bộ lọc sử dụng.
```

Thêm các hàng truy vết chính xác này vào Phần 16:

```markdown
| AC-FE07-023 | UC30 | `borrowingRoutes.test.js` > "lịch sử thành viên hiển thị yêu cầu sở hữu bị từ chối mà không thay đổi trạng thái chi tiết"; `borrowingFrontend.test.js` > "lịch sử thành viên hiển thị các yêu cầu bị từ chối mà không gắn nhãn lại các chi tiết đang chờ xử lý" | Đã lên kế hoạch |
| BR-FE07-029 | UC30 | FE07-T041 |Đã lên kế hoạch|
| FR-FE07-029 | UC30 | FE07-T041 |Đã lên kế hoạch|
```

- [ ] **Bước 3: Thêm nhiệm vụ bảo trì và mục nhật ký thay đổi**

Nối nhiệm vụ này vào `TASKS.md`:

```markdown
- [ ] **FE07-T041 - Hiển thị chính xác yêu cầu mượn bị từ chối trong lịch sử thành viên.**
  - Bản đồ tới: BR-FE07-029, FR-FE07-029, AC-FE07-023.
  - RED: từ chối yêu cầu thành viên, tải lại `/api/borrow-requests/me` và chứng minh phản hồi thiếu `requestStatus = REJECTED`; chứng minh giao diện người dùng ánh xạ hàng tới `Pending`.
  - GREEN: hiển thị `requestStatus` trong các mô hình đọc SQL/trong bộ nhớ và chỉ thích nó để hiển thị lịch sử thành viên bị từ chối.
  - Xác minh: kiểm tra hợp đồng/lộ trình máy chủ tập trung, kiểm tra mượn giao diện người dùng, tìm lỗi mã nguồn/xây dựng, truy vết và vượt qua vệ sinh khác biệt.
```

Thêm mục này vào đầu `CHANGELOG.md`:

```markdown
## 2026-07-22 - Sửa trạng thái yêu cầu bị từ chối trong lịch sử Thành viên

- Hiển thị trạng thái yêu cầu mượn sở hữu trong các hàng lịch sử chi tiết chuẩn.
- Hiển thị các yêu cầu bị từ chối dưới dạng `Đã từ chối` trong khi vẫn duy trì trạng thái chi tiết liên tục `REQUESTED` và các bộ lọc lịch sử hiện có.
```

- [ ] **Bước 4: Xác minh tính nhất quán của tài liệu**

Chạy:

```powershell
rg -n "BR-FE07-029|FR-FE07-029|AC-FE07-023|FE07-T041|requestStatus" .sdd/specs/feat-borrowing-management
git diff --check -- .sdd/specs/feat-borrowing-management
```

Dự kiến: có tất cả bốn mã nhận dạng, tên nốt API là `requestStatus` và `git diff --check` không phát
ra đầu ra.

- [ ] **Bước 5: Giữ lại tài liệu đã cam kết để con người xem xét**

Sau khi được con người xem xét, cam kết tài liệu được đề xuất là:

```powershell
git add -- .sdd/specs/feat-borrowing-management/SPEC.md .sdd/specs/feat-borrowing-management/TASKS.md .sdd/specs/feat-borrowing-management/CHANGELOG.md
git commit -m "docs: define rejected borrow history status"
```

### Nhiệm vụ 2: Thêm hồi quy mô hình đọc máy chủ

**Tệp:**
- Sửa đổi: `backend/tests/borrowingRoutes.test.js`
- Sửa đổi: `backend/src/repositories/borrowingRepository.js`
- Sửa đổi: `backend/tests/helpers/inMemoryBorrowingRepositories.js`

**Giao diện:**
- Tiêu thụ: cột `RequestStatus` hiện có được chọn bởi `borrowDetailSelect`; `BorrowDetail.status` hiện tại vẫn giữ nguyên vòng đời chi tiết.
- Tạo ra: `BorrowDetail.requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'` trong SQL và phản hồi trong bộ nhớ.

- [ ] **Bước 1: Viết kiểm thử hồi quy HTTP không thành công**

Thêm kiểm thử này vào bộ kiểm thử tuyến đường FE07 hiện có:

```javascript
// @spec FR-FE07-029, AC-FE07-023
test('member history exposes a rejected owning request without changing detail status', async () => {
  const { app, authDependencies, borrowingDependencies } = makeTestApp();
  const member = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'rejected-history.member@example.test',
  });
  const librarian = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'rejected-history.librarian@example.test',
    role: 'LIBRARIAN',
    approveMember: false,
  });

  const created = await request(app)
    .post('/api/borrow-requests')
    .set('Authorization', authHeader(member.accessToken))
    .send({ copyIds: [1] })
    .expect(201);

  await request(app)
    .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/reject`)
    .set('Authorization', authHeader(librarian.accessToken))
    .send({ reason: 'Không thể xử lý yêu cầu này.' })
    .expect(200);

  const history = await request(app)
    .get('/api/borrow-requests/me')
    .set('Authorization', authHeader(member.accessToken))
    .expect(200);

  expect(history.body.borrowings).toEqual([
    expect.objectContaining({
      requestId: created.body.borrowRequest.requestId,
      status: 'REQUESTED',
      requestStatus: 'REJECTED',
    }),
  ]);
});
```

- [ ] **Bước 2: Chạy kiểm thử và xác minh RED**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js -t "member history exposes a rejected owning request"
```

Dự kiến: THẤT BẠI vì hàng trả về không có thuộc tính `requestStatus`; bản thân việc từ chối yêu cầu
phải thành công.

- [ ] **Bước 3: Thêm ánh xạ sản xuất tối thiểu và ánh xạ trong bộ nhớ**

Trong `backend/src/repositories/borrowingRepository.js`, mở rộng `mapBorrowDetail`:

```javascript
// @spec FR-FE07-029
requestStatus: row.RequestStatus,
status: row.DetailStatus,
```

Trong `backend/tests/helpers/inMemoryBorrowingRepositories.js`, mở rộng `mapDetail` trong khi vẫn
duy trì trạng thái chi tiết liên tục:

```javascript
function mapDetail(detail) {
  if (!detail) {
    return null;
  }

  const owningRequest = borrowRequests.find(
    (request) => request.requestId === detail.requestId
  );

  return clone({
    borrowDetailId: detail.borrowDetailId,
    requestId: detail.requestId,
    userId: detail.userId,
    copyId: detail.copyId,
    borrowDate: toDateOnly(detail.borrowDate),
    dueDate: toDateOnly(detail.dueDate),
    returnDate: toDateOnly(detail.returnDate),
    renewalCount: detail.renewalCount,
    requestStatus: owningRequest?.status || null,
    status: detail.status,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    member: mapMember(detail.userId),
    copy: mapCopy(getCopy(detail.copyId)),
  });
}
```

- [ ] **Bước 4: Chạy kiểm thử máy chủ tập trung và xác minh GREEN**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js -t "member history exposes a rejected owning request|member history excludes another member request|member history includes a request later on toDate"
```

Dự kiến: ĐẠT cho trường hợp lịch sử bị từ chối mới và các trường hợp ngày/phạm vi thành viên hiện có.

- [ ] **Bước 5: Giữ cam kết máy chủ để con người xem xét**

Sau khi con người xem xét, cam kết máy chủ được đề xuất là:

```powershell
git add -- backend/tests/borrowingRoutes.test.js backend/src/repositories/borrowingRepository.js backend/tests/helpers/inMemoryBorrowingRepositories.js
git commit -m "fix: expose borrow request status in history"
```

### Nhiệm vụ 3: Khóa Hợp đồng phản hồi OpenAPI

**Tệp:**
- Sửa đổi: `backend/tests/borrowingContract.test.js`
- Sửa đổi: `backend/src/docs/openapi.yaml`

**Giao diện:**
- Tiêu thụ: `BorrowDetail.requestStatus` được tạo ra bởi Nhiệm vụ 2.
- Tạo ra: một thuộc tính phản hồi được ghi lại với giá trị liệt kê trạng thái yêu cầu FE07.

- [ ] **Bước 1: Viết xác nhận hợp đồng OpenAPI không thành công**

Thêm vào kiểm thử hợp đồng lược đồ FE07 hiện có:

```javascript
const borrowDetail = document.components.schemas.BorrowDetail;
expect(borrowDetail.required).toContain('requestStatus');
expect(borrowDetail.properties.requestStatus).toEqual({
  type: 'string',
  enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
});
```

- [ ] **Bước 2: Chạy kiểm thử hợp đồng và xác minh RED**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingContract.test.js
```

Dự kiến: THẤT BẠI vì `BorrowDetail.requestStatus` không được ghi lại.

- [ ] **Bước 3: Thêm thuộc tính OpenAPI**

Cập nhật `BorrowDetail` trong `backend/src/docs/openapi.yaml`:

```yaml
BorrowDetail:
  type: object
  required: [borrowDetailId, requestId, copyId, status, requestStatus, renewalCount]
  properties:
    borrowDetailId: { type: integer, minimum: 1 }
    requestId: { type: integer, minimum: 1 }
    copyId: { type: integer, minimum: 1 }
    borrowDate: { type: string, format: date, nullable: true }
    dueDate: { type: string, format: date, nullable: true }
    returnDate: { type: string, format: date, nullable: true }
    renewalCount: { type: integer, minimum: 0, maximum: 1 }
    requestStatus: { type: string, enum: [PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED] }
    status:
      type: string
      enum: [REQUESTED, BORROWED, RETURNED, LOST, DAMAGED]
      description: OVERDUE is derived for reporting when status is BORROWED and dueDate is before today.
```

- [ ] **Bước 4: Chạy kiểm thử hợp đồng và xác minh GREEN**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingContract.test.js
```

Dự kiến: ĐẠT.

- [ ] **Bước 5: Giữ cam kết hợp đồng để con người xem xét**

Sau khi xem xét con người, cam kết hợp đồng được đề xuất là:

```powershell
git add -- backend/tests/borrowingContract.test.js backend/src/docs/openapi.yaml
git commit -m "docs: expose borrow request status in detail responses"
```

### Nhiệm vụ 4: Hiển thị trạng thái bị từ chối trong lịch sử thành viên

**Tệp:**
- Sửa đổi: `frontend/test/borrowingFrontend.test.js`
- Sửa đổi: `frontend/src/utils/libraryFeatureViewModels.js`

**Giao diện:**
- Tiêu thụ: `{ status: DetailStatus, requestStatus: RequestStatus }` từ Nhiệm vụ 2-3.
- Tạo: các hàng `mapBorrowDetailsToHistoryRows(details)` có `status` là `Rejected` chỉ khi `requestStatus === 'REJECTED'`.

- [ ] **Bước 1: Viết hồi quy của trình ánh xạ giao diện người dùng không thành công**

Thêm kiểm thử nút này:

```javascript
test('member history displays rejected requests without relabeling pending details', async () => {
  const { mapBorrowDetailsToHistoryRows } = await loadBorrowingViewModels();
  const { getStatusLabel } = await import('../src/utils/uiLabels.js');
  const rows = mapBorrowDetailsToHistoryRows([
    {
      borrowDetailId: 51,
      requestId: 21,
      copyId: 1,
      status: 'REQUESTED',
      requestStatus: 'REJECTED',
    },
    {
      borrowDetailId: 52,
      requestId: 22,
      copyId: 2,
      status: 'REQUESTED',
      requestStatus: 'PENDING',
    },
  ]);

  assert.equal(rows[0].status, 'Rejected');
  assert.equal(getStatusLabel(rows[0].status), 'Đã từ chối');
  assert.equal(rows[1].status, 'Pending');
});
```

- [ ] **Bước 2: Chạy kiểm thử giao diện người dùng và xác minh RED**

Chạy:

```powershell
node --test --test-name-pattern "member history displays rejected requests" frontend/test/borrowingFrontend.test.js
```

Dự kiến: THẤT BẠI vì cả hai hàng hiện đang ánh xạ từ trạng thái chi tiết `REQUESTED` đến `Pending`.

- [ ] **Bước 3: Triển khai mức độ ưu tiên hiển thị hẹp**

Cập nhật `mapBorrowDetailsToHistoryRows`:

```javascript
// @spec FR-FE07-029
export function mapBorrowDetailsToHistoryRows(details = []) {
  return details.map((detail) => {
    const displayStatus = detail.requestStatus === 'REJECTED'
      ? detail.requestStatus
      : detail.status;

    return {
      id: detail.borrowDetailId || `${detail.requestId}-${detail.copyId}`,
      borrowDetailId: detail.borrowDetailId,
      requestId: detail.requestId,
      title: detail.copy?.title || `Bản sao #${detail.copyId}`,
      author: detail.copy?.author || '-',
      borrowDate: detail.borrowDate || detail.createdAt,
      dueDate: detail.dueDate,
      returnDate: detail.returnDate,
      status: statusToUi(displayStatus, { expiresAt: detail.dueDate }),
      renewalsLeft: detail.status === 'BORROWED'
        ? Math.max(0, 1 - Number(detail.renewalCount || 0))
        : 0,
    };
  });
}
```

- [ ] **Bước 4: Chạy bộ mượn giao diện người dùng và xác minh GREEN**

Chạy:

```powershell
node --test frontend/test/borrowingFrontend.test.js
```

Dự kiến: tất cả các kiểm thử đều vượt qua, bao gồm các trường hợp quá hạn, đang chờ xử lý, phân
trang và trạng thái trung thực hiện có.

- [ ] **Bước 5: Giữ cam kết giao diện người dùng để con người xem xét**

Sau khi con người xem xét, cam kết giao diện người dùng được đề xuất là:

```powershell
git add -- frontend/test/borrowingFrontend.test.js frontend/src/utils/libraryFeatureViewModels.js
git commit -m "fix: show rejected borrow requests to members"
```

### Nhiệm vụ 5: Hoàn thành xác minh và đánh giá con người

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Chỉ xác minh: mọi tệp được liệt kê trong Bản đồ tệp.

**Giao diện:**
- Tiêu thụ: phần máy chủ đã hoàn thành, OpenAPI và các phần giao diện người dùng.
- Tạo ra: bằng chứng tập trung và cấp kho lưu trữ cho FE07-T041.

- [ ] **Bước 1: Chạy kiểm thử hồi quy FE07 tập trung**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingContract.test.js
node --test frontend/test/borrowingFrontend.test.js
```

Dự kiến: cả tệp kiểm tra máy chủ và bộ công cụ mượn giao diện người dùng đều vượt qua mà không gặp lỗi nào.

- [ ] **Bước 2: Chạy cổng tĩnh và xây dựng rộng hơn**

Chạy:

```powershell
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
```

Dự kiến: vượt qua kiểm tra mã, bản dựng và truy vết; `git diff --check` không phát ra đầu ra.

- [ ] **Bước 3: Chạy bộ hồi quy máy chủ đầy đủ**

Chạy:

```powershell
npm.cmd --prefix backend test
```

Dự kiến: tất cả các bộ máy chủ đều đạt. Nếu thay đổi xác thực không liên quan/admin không thành
công, hãy ghi lại kiểm thử thất bại chính xác và chứng minh bộ FE07 tập trung vẫn đạt; không sửa đổi
các tập tin không liên quan.

- [ ] **Bước 4: Ghi lại bằng chứng chính xác và yêu cầu con người xem xét**

Chỉ thay thế điểm đánh dấu không được chọn trên `FE07-T041` bằng `[x]` sau khi ghi lại số lần vượt
qua chính xác từ Bước 1-3 bên dưới nhiệm vụ. Trình bày sự khác biệt hoàn chỉnh của FE07 để con người
xem xét trước khi môi trường tiền sản xuất các tệp triển khai.

- [ ] **Bước 5: Cam kết triển khai đã được đánh giá**

Chỉ sau khi con người xác nhận xem xét, hãy tạo các tệp FE07 chính xác và xác minh tập hợp các giai
đoạn trước khi cam kết:

```powershell
git add -- .sdd/specs/feat-borrowing-management/SPEC.md .sdd/specs/feat-borrowing-management/TASKS.md .sdd/specs/feat-borrowing-management/CHANGELOG.md backend/src/repositories/borrowingRepository.js backend/tests/helpers/inMemoryBorrowingRepositories.js backend/tests/borrowingRoutes.test.js backend/src/docs/openapi.yaml backend/tests/borrowingContract.test.js frontend/src/utils/libraryFeatureViewModels.js frontend/test/borrowingFrontend.test.js docs/superpowers/plans/2026-07-22-member-rejected-borrow-status.md
git diff --cached --name-only
git diff --cached --check
git commit -m "fix: show rejected borrow requests to members"
```

Các tệp được phân loại dự kiến: chính xác là mười một đường dẫn được đặt tên bởi `git add`; không có
tệp xác thực hoặc bảng điều khiển quản trị nào được tổ chức.
