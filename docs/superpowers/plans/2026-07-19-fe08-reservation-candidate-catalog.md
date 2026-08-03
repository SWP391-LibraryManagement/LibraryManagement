# FE08 Kế hoạch triển khai danh mục ứng viên đặt chỗ

> **Đối với nhân viên đại lý:** BẮT BUỘC SUB-SKILL: Sử dụng `superpowers:executing-plans` để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Thay thế danh mục `DEMO_RESERVABLE` được mã hóa cứng của FE08 bằng một ứng cử viên SQL
được API hỗ trợ chỉ dành cho thành viên trong khi vẫn duy trì hợp đồng thao tác ghi `POST
/api/reservations { copyId }` đã được phê duyệt.

**Kiến trúc:** Thêm tuyến `/api/reservations/candidates` chỉ đọc thông qua bộ công nghệ trình xác
thực/bộ điều khiển/dịch vụ/kho lưu trữ FE08 hiện có. Kho lưu trữ trả về một phép chiếu an toàn cho
mỗi bản sao `BORROWED` hoặc `RESERVED` thuộc về một cuốn sách đang hoạt động, với chức năng tìm kiếm
và phân trang do máy chủ sở hữu. Trang thành viên sử dụng phong bì đó; thao tác ghi tạo hiện tại vẫn có
thẩm quyền để kiểm tra tính đủ điều kiện và chủng tộc.

**bộ công nghệ công nghệ:** Node.js, Express, `express-validator`, `mssql`, Jest/Supertest, React,
Axios, Trình chạy kiểm thử nút, Playwright, SQL Server.

## Ràng buộc toàn cầu

- Giữ mục tiêu `POST /api/reservations` làm `CopyId` vật lý; không thêm hỗ trợ thao tác ghi `bookId`.
- Việc đọc ứng viên yêu cầu xác thực và vai trò `MEMBER`; Trình duyệt công khai FE01 và số lần đọc bản sao của nhân viên FE06 không thay đổi.
- Chỉ trả sách `copyId`, `bookId`, `title`, `authorName`, `copyStatus` và `activeReservationCount`.
- Không bao giờ trả sách giá trị mã vạch, vị trí, chủ sở hữu, email, dấu thời gian hoặc phiên bản.
- Chỉ trả sách các bản sao sách đang hoạt động có trạng thái là `BORROWED` hoặc `RESERVED`.
- Sử dụng SQL được tham số hóa, không di chuyển lược đồ, không ghi kiểm tra, không ghi thông báo và không khóa thao tác ghi trong đường dẫn đọc ứng viên.
- Sử dụng mặc định truy vấn `q = ''`, `page = 1`, `limit = 20`; thực thi `page >= 1` và `1 <= limit <= 100`.
- Đặt hàng theo `Book.Title ASC`, `Book.BookId ASC`, `BookCopy.CopyId ASC`.
- Bảo tồn các phong bì chung `401`, `403` và `400` chung an toàn hiện có.
- Giữ nguyên `DEMO_BORROW_CATALOG`; chỉ xóa `DEMO_RESERVABLE`.
- Không đánh dấu `TD-028` đã được giải quyết cho đến khi các kiểm thử tập trung, xác thực SQL, chấp nhận trình duyệt, truy vết, kiểm tra an toàn và tài liệu bằng chứng đã vượt qua.

---

## Nhiệm vụ 1: Khóa các yêu cầu và truy vết của FE08

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-reservation-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/CHANGELOG.md`

**Giao diện:**
- Tạo ID ổn định được sử dụng bởi các kiểm thử triển khai: `FR-FE08-029`, `AC-FE08-015`, `AC-FE08-016`, `NFR-FE08-SEC-004` và `NFR-FE08-PERF-003`.

- [x] **Bước 1: Thêm hợp đồng ứng viên vào SPEC.md.**

Thêm điểm cuối vào bảng API và thêm các yêu cầu ổn định này mà không thay đổi các quy tắc vòng đời
FE08 hiện có:

```markdown
| FR-FE08-029 |Thành viên đọc danh mục ứng viên được phân trang từ các hàng GET /api/reservations/candidates; chứa một bản sao BORROWED/RESERVED của sách đang hoạt động và siêu dữ liệu sách an toàn, trong khi POST /api/reservations vẫn có thẩm quyền.|
| AC-FE08-015 |Một thành viên chỉ nhìn thấy copyId, bookId, tiêu đề, authorName, copyStatus và activeReservationCount; không có mã vạch, vị trí, chủ sở hữu, email, dấu thời gian và phiên bản.|
| AC-FE08-016 |Trang thành viên sử dụng điểm cuối ứng cử viên để tìm kiếm và lựa chọn và không nhập hoặc hiển thị DEMO_RESERVABLE.|
| NFR-FE08-SEC-004 |Các lần đọc của ứng viên chỉ dành cho thành viên và không hiển thị siêu dữ liệu bản sao chỉ dành cho nhân viên hoặc chủ sở hữu đặt chỗ.|
| NFR-FE08-PERF-003 |Ứng viên đọc mặc định ở trang 1 và giới hạn 20, thực thi trang >= 1 và giới hạn 1..100, đồng thời sử dụng thứ tự tiêu đề xác định/book/copy.|
```

Ghi lại phong bì phản hồi `{ data, pagination }`, các trạng thái đủ điều kiện, dự báo an toàn, tính
nhất quán của lời khuyên và ranh giới không di chuyển lược đồ.

- [x] **Bước 2: Cập nhật PLAN.md, TASKS.md và CHANGELOG.md.**

Thêm phạm vi danh mục ứng viên, tệp triển khai chính xác, lệnh xác thực tập trung, nhiệm vụ nguyên
tử, phê duyệt của người dùng ngày 19 tháng 7 năm 2026 và xóa `DEMO_RESERVABLE`.

- [x] **Bước 3: Xác minh khả năng truy vết của tài liệu.**

Chạy:

```powershell
git diff --check
rg -n "FR-FE08-029|AC-FE08-015|AC-FE08-016|NFR-FE08-SEC-004|NFR-FE08-PERF-003" .sdd/specs/feat-reservation-management
```

Dự kiến: không có lỗi khoảng trắng; mọi ID mới đều xuất hiện trong SPEC và khả năng truy vết
PLAN/TASKS của nó.

- [x] **Bước 4: Cam kết cập nhật nguồn gốc.**

```powershell
git add .sdd/specs/feat-reservation-management/SPEC.md .sdd/specs/feat-reservation-management/PLAN.md .sdd/specs/feat-reservation-management/TASKS.md .sdd/specs/feat-reservation-management/CHANGELOG.md
git commit -m "docs: specify FE08 reservation candidate catalog"
```

---

## Nhiệm vụ 2: Viết các kiểm thử hợp đồng máy chủ RED và mở rộng kho lưu trữ trong bộ nhớ

**Tệp:**
- Sửa đổi: `backend/tests/helpers/inMemoryReservationRepositories.js`
- Sửa đổi: `backend/tests/reservationRoutes.test.js`

**Giao diện:**
- Sử dụng thiết lập xác thực `createReservationService`, `createApp` và FE08 hiện có.
- Tạo `reservationRepository.listReservationCandidates({ q, page, limit })` trả về `{ rows, total }` chỉ với các trường an toàn.

- [x] **Bước 1: Mở rộng trạng thái ứng viên trong bộ nhớ.**

Thêm `status: 'ACTIVE'` và `authorName` vào sách mặc định. Triển khai phương pháp kho lưu trữ để lọc
các sách đang hoạt động và các bản sao `BORROWED`/`RESERVED`, tìm kiếm tựa đề/author, sắp xếp theo
tựa đề/book/copy, tính toán số lượng đặt chỗ hiện hoạt, cắt trang được yêu cầu và trả về `{ rows,
total }`. Bản đồ chính xác:

```javascript
{
  copyId,
  bookId,
  title,
  authorName,
  copyStatus,
  activeReservationCount
}
```

Không để lộ các trường mã vạch/vị trí của người trợ giúp thông qua phương pháp này.

- [x] **Bước 2: Thêm các kiểm thử tuyến đường RED được gắn thẻ ID mới.**

Thành viên bảo hiểm thành công, `401` khách, `403` không phải thành viên, `q/page/limit` không hợp
lệ, kết quả trống, lọc sách/trạng thái đang hoạt động, thứ tự xác định, số lượng hàng đợi chỉ hoạt
động, phân trang, khóa được sắp xếp lại và không có thao tác ghi đặt chỗ/kiểm tra. Khẳng định cốt lõi
phải tương đương với:

```javascript
const response = await request(app)
  .get('/api/reservations/candidates?q=clean&page=1&limit=1')
  .set('Authorization', authHeader(member.accessToken))
  .expect(200);

expect(response.body.data[0]).toEqual({
  copyId: expect.any(Number),
  bookId: expect.any(Number),
  title: 'Clean Code',
  authorName: 'Robert C. Martin',
  copyStatus: expect.stringMatching(/^(BORROWED|RESERVED)$/),
  activeReservationCount: expect.any(Number),
});
expect(Object.keys(response.body.data[0]).sort()).toEqual([
  'activeReservationCount', 'authorName', 'bookId', 'copyId', 'copyStatus', 'title',
]);
```

- [x] **Bước 3: Chạy RED.**

```powershell
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reservationRoutes.test.js
```

Dự kiến: chỉ các trường hợp ứng viên mới không thành công vì các phương thức tuyến/dịch vụ/kho lưu
trữ không tồn tại.

- [x] **Bước 4: Cam kết hợp đồng RED.**

```powershell
git add backend/tests/helpers/inMemoryReservationRepositories.js backend/tests/reservationRoutes.test.js
git commit -m "test: define FE08 reservation candidate contract"
```

---

## Nhiệm vụ 3: Triển khai đường dẫn đọc máy chủ được bảo vệ và OpenAPI

**Tệp:**
- Sửa đổi: `backend/src/validators/reservationValidators.js`
- Sửa đổi: `backend/src/routes/reservationRoutes.js`
- Sửa đổi: `backend/src/controllers/reservationController.js`
- Sửa đổi: `backend/src/services/reservationService.js`
- Sửa đổi: `backend/src/repositories/reservationRepository.js`
- Sửa đổi: `backend/src/docs/openapi.yaml`

**Giao diện:**
- Trình xác thực tạo ra `req.query` được chuẩn hóa.
- Dịch vụ tiêu thụ `listReservationCandidates(filters, actor)` và trả về `{ data, pagination }`.
- Kho lưu trữ tiêu thụ `{ q, page, limit }` và trả về `{ rows, total }`.

- [x] **Bước 1: Thêm trình xác thực truy vấn.**

Thêm và xuất `listReservationCandidatesValidators` với `q.trim().isLength({ max: 200 })`,
`page.isInt({ min: 1 }).toInt().default(1)`, `limit.isInt({ min: 1, max: 100 }).toInt().default(20)`
và `handleValidationErrors` hiện có.

- [x] **Bước 2: Gắn tuyến đường và bộ điều khiển.**

Gắn tuyến đường này trước tuyến `GET '/'` của nhân viên:

```javascript
router.get(
  '/candidates',
  authenticate,
  requireAnyRole('MEMBER'),
  listReservationCandidatesValidators,
  controller.listCandidates
);
```

Thêm `controller.listCandidates` gọi `reservationService.listReservationCandidates(req.truy vấn,
req.người dùng)` và trả về trạng thái 200.

- [x] **Bước 3: Thêm phương thức dịch vụ.**

Triển khai bảo vệ thành viên và phong bì chuẩn:

```javascript
async function listReservationCandidates(filters = {}, actor) {
  requireMember(actor);
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const result = await reservationRepository.listReservationCandidates({
    q: typeof filters.q === 'string' ? filters.q.trim() : '',
    page,
    limit,
  });
  const total = Number(result.total || 0);
  return {
    data: result.rows,
    pagination: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
  };
}
```

Không gọi các phương thức kiểm tra, thông báo hoặc thao tác ghi.

- [x] **Bước 4: Thêm phương thức kho lưu trữ SQL được tham số hóa.**

Sử dụng phép chiếu an toàn tương đương với:

```sql
SELECT
  bc.CopyId AS copyId,
  bc.BookId AS bookId,
  b.Title AS title,
  a.AuthorName AS authorName,
  bc.Status AS copyStatus,
  (
    SELECT COUNT(*)
    FROM Reservations ar
    WHERE ar.CopyId = bc.CopyId
      AND ar.Status = 'ACTIVE'
  ) AS activeReservationCount,
  COUNT(*) OVER() AS totalRows
FROM BookCopies bc
INNER JOIN Books b ON b.BookId = bc.BookId
LEFT JOIN Authors a ON a.AuthorId = b.AuthorId
WHERE b.Status = 'ACTIVE'
  AND bc.Status IN ('BORROWED', 'RESERVED')
  AND (@Search IS NULL OR b.Title LIKE @Search ESCAPE '\\'
       OR COALESCE(a.AuthorName, '') LIKE @Search ESCAPE '\\')
ORDER BY b.Title ASC, b.BookId ASC, bc.CopyId ASC
OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
```

Liên kết `Search`, `Offset` và `Limit` thông qua `mssql`. Thoát siêu ký tự LIKE trước khi liên kết.
Trả về `total = 0` khi tập bản ghi trống và chỉ ánh xạ sáu trường hợp đồng.

- [x] **Bước 5: Tài liệu OpenAPI.**

Thêm các lược đồ `ReservationCandidate`, `ReservationCandidatePagination` và
`ReservationCandidateListResponse` với `additionalProperties: false`. Thêm điểm cuối với bảo mật
đường truyền, phản hồi `q/page/limit` và `200/400/401/403`.

- [x] **Bước 6: Chạy kiểm thử máy chủ GREEN.**

```powershell
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reservationRoutes.test.js
```

Dự kiến: tất cả các kiểm thử tuyến đường FE08 hiện có và mới đều vượt qua.

- [x] **Bước 7: Cam kết triển khai máy chủ.**

```powershell
git add backend/src/validators/reservationValidators.js backend/src/routes/reservationRoutes.js backend/src/controllers/reservationController.js backend/src/services/reservationService.js backend/src/repositories/reservationRepository.js backend/src/docs/openapi.yaml
git commit -m "feat: add member reservation candidate catalog"
```

---

## Nhiệm vụ 4: Thêm xác thực ứng viên SQL Server thực

**Tệp:**
- Tạo: `backend/tests/sql/reservationCandidates.sqltest.js`

**Giao diện:**
- Sử dụng môi trường SQL dùng một lần hiện có, bộ bảo vệ thao tác ghi, `getPool` và phương thức lưu trữ.
- Tạo ra các hàng ứng cử viên tổng hợp và bằng chứng dọn dẹp.

- [x] **Bước 1: Thêm thiết lập và dọn dẹp được bảo vệ.**

Làm theo mẫu `backend/tests/sql/*.sqltest.js` trong phạm vi chức năng hiện có: tải
`FE08_SQL_TEST_ENV_FILE` trước khi nhập DB, yêu cầu `FE08_SQL_TEST_ALLOW_MUTATION=true`, tạo hậu tố
gốc duy nhất trong bộ nhớ, theo dõi mọi ID được chèn và xóa tất cả các hàng tổng hợp trong đường dẫn
dọn dẹp tương đương với `finally`.

- [x] **Bước 2: Chọn tất cả các trạng thái liên quan.**

Chèn các sách hiện hoạt và không hoạt động, các bản sao hiện hoạt ở các trạng thái `AVAILABLE`,
`BORROWED`, `RESERVED`, `DAMAGED`, `LOST` và `INACTIVE`, cùng với một đặt chỗ hiện hoạt và một thiết
bị đầu cuối cho một bản sao đề cử. Chỉ sử dụng các phần chèn được tham số hóa.

- [x] **Bước 3: Xác nhận lọc, đếm, sắp xếp, phân trang và biên tập.**

Khẳng định có bản sao đã mượn/đặt chỗ của sách đang hoạt động, tất cả các trạng thái khác đều vắng
mặt, số lượng đặt chỗ đang hoạt động không bao gồm các hàng đầu cuối, công việc tìm kiếm và
trang/giới hạn, thứ tự là xác định và mỗi hàng được trả về có chính xác sáu khóa an toàn.

- [x] **Bước 4: Chạy bộ SQL tập trung.**

```powershell
npm.cmd --prefix backend test -- --runInBand --testMatch "**/reservationCandidates.sqltest.js"
```

Dự kiến: tất cả các trường hợp SQL ứng cử viên đều vượt qua và việc dọn dẹp khiến `DB_CLEAN`/các
hàng tổng hợp sạch sẽ.

- [x] **Bước 5: Xác nhận xác thực SQL.**

```powershell
git add backend/tests/sql/reservationCandidates.sqltest.js
git commit -m "test: validate FE08 candidate catalog on SQL Server"
```

---

## Nhiệm vụ 5: Di chuyển trang thành viên sang máy chủ ứng viên

**Tệp:**
- Sửa đổi: `frontend/src/api/libraryFeatureApi.js`
- Sửa đổi: `frontend/src/page/reservation/MyReservationsPage.jsx`
- Sửa đổi: `frontend/src/utils/libraryFeatureViewModels.js`
- Sửa đổi: `frontend/test/reservationFrontend.test.js`
- Sửa đổi: `frontend/test/borrowingFrontend.test.js`

**Giao diện:**
- Phương pháp API: `reservationApi.listCandidates(params = {})`.
- Giao diện người dùng sử dụng `{ data, pagination }` và gọi `reservationApi.create(candidate.copyId)` hiện có.

- [x] **Bước 1: Thêm phương pháp API và kiểm tra nguồn RED.**

Thêm:

```javascript
listCandidates(params = {}) {
  return authorizedReservationRequest(
    { method: 'get', url: '/reservations/candidates', params },
    'Không thể tải danh sách sách có thể đặt chỗ.',
  );
},
```

Mở rộng các kiểm thử nguồn giao diện người dùng để yêu cầu phương pháp này, ứng viên URL và trình
phân giải đặt chỗ; cập nhật `borrowingFrontend.test.js` để chỉ giữ lại `DEMO_BORROW_CATALOG`; thêm
xác nhận không thành công rằng `DEMO_RESERVABLE` không có trong `MyReservationsPage.jsx`.

- [x] **Bước 2: Chạy kiểm thử giao diện người dùng RED.**

```powershell
npm.cmd --prefix frontend test -- --test-name-pattern="reservation API|candidate|DEMO_RESERVABLE"
```

Dự kiến: xác nhận ứng viên mới không thành công trước khi di chuyển trang.

- [x] **Bước 3: Thay thế trạng thái danh mục cục bộ.**

Trong `MyReservationsPage.jsx`, thay thế nhập `DEMO_RESERVABLE` và lọc `useMemo` bằng trạng thái máy
chủ `candidates`, `candidatePagination`, `candidateLoading` và `candidateError`. Triển khai
`loadCandidates({ q, page })` gọi `reservationApi.listCandidates({ q: q.trim(), page, limit: 20 })`,
xử lý các trạng thái trống/lỗi/tải và hủy bộ đếm thời gian tìm kiếm của nó trong quá trình dọn dẹp
hiệu ứng.

- [x] **Bước 4: Hiển thị các trường an toàn và duy trì ngữ nghĩa thao tác ghi.**

Hiển thị tiêu đề, tác giả, trạng thái sao chép và số lượng đặt chỗ hiện hoạt. Xóa các giá trị
`availableCopies` và ETA được phát minh. Gọi `reservationApi.create(candidate.copyId)`; sau khi
thành công tải lại cả đặt chỗ và ứng viên. Khi xảy ra xung đột, hãy tải lại ứng viên để các hàng cũ
biến mất. Đừng biến đổi danh mục ứng viên địa phương thành nguồn thông tin chính xác.

- [x] **Bước 5: Xóa xuất tĩnh.**

Chỉ xóa `DEMO_RESERVABLE` khỏi `libraryFeatureViewModels.js`. Giữ `DEMO_BORROW_CATALOG` không thay
đổi. Thêm các kiểm tra nguồn chứng minh trang không còn nhập bản xuất đã xóa nữa.

- [x] **Bước 6: Chạy kiểm tra giao diện người dùng tập trung.**

```powershell
npm.cmd --prefix frontend test -- --test-name-pattern="reservation API|candidate|DEMO_RESERVABLE"
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Dự kiến: các kiểm thử tập trung, kiểm tra mã và bản dựng đạt; cảnh báo đoạn không chặn đã biết có thể vẫn còn.

- [x] **Bước 7: Cam kết di chuyển giao diện người dùng.**

```powershell
git add frontend/src/api/libraryFeatureApi.js frontend/src/page/reservation/MyReservationsPage.jsx frontend/src/utils/libraryFeatureViewModels.js frontend/test/reservationFrontend.test.js frontend/test/borrowingFrontend.test.js
git commit -m "feat: connect FE08 member candidates to server state"
```

---

## Nhiệm vụ 6: Thêm sự chấp nhận của trình duyệt

**Tệp:**
- Tạo: `tests/e2e/fe08-reservation-candidate-catalog.spec.js`
- Sửa đổi: `tests/e2e/support/systemTestServer.js` chỉ khi thiết lập xác định hiện có không thể tạo bản sao không có sẵn.

**Giao diện:**
- Tiêu thụ Playwright `FRONTEND_URL`, `BACKEND_URL`, `/__e2e__/setup` hiện có và đăng nhập thành viên.
- Sản xuất `E2E-FE08-ACC01`.

- [x] **Bước 1: Thiết lập thành viên bị cô lập.**

Sử dụng `randomUUID()`, mật khẩu tổng hợp, `request.post('/__e2e__/setup')` và nhãn đăng nhập hiện
có. Điều hướng đến `/reservations/mine`.

- [x] **Bước 2: Xác nhận yêu cầu của ứng viên và biên tập.**

Đợi `GET /api/reservations/candidates?page=1&limit=20`, xác nhận `200`, xác nhận các hàng phản hồi
chứa chính xác sáu trường an toàn và xác nhận trang hiển thị tiêu đề/trạng thái/số hàng đợi mà không
có mã vạch/vị trí.

- [x] **Bước 3: Xác nhận tìm kiếm máy chủ và thao tác ghi thực sự.**

Điền vào `Tìm sách để đặt...`, xác nhận yêu cầu tiếp theo bao gồm `q` được mã hóa, nhấp vào `Đặt
chỗ`, xác nhận `POST /api/reservations` gửi `copyId` số và xác nhận tải lại danh sách đặt chỗ chuẩn.

- [x] **Bước 4: Chạy chấp nhận trình duyệt tập trung.**

```powershell
$env:E2E_FRONTEND_PORT='4185'
$env:E2E_BACKEND_PORT='3101'
npm.cmd run test:e2e -- tests/e2e/fe08-reservation-candidate-catalog.spec.js
```

Dự kiến: `E2E-FE08-ACC01` vượt qua mà không có hiện tượng tràn ngang di động.

- [x] **Bước 5: Cam kết chấp nhận trình duyệt.**

```powershell
git add tests/e2e/fe08-reservation-candidate-catalog.spec.js tests/e2e/support/systemTestServer.js
git commit -m "test: add FE08 reservation candidate browser acceptance"
```

---

## Nhiệm vụ 7: Đối chiếu bằng chứng, nợ và xác nhận đầy đủ

**Tệp:**
- Sửa đổi: `TECH_DEBT.md`
- Tạo: `.sdd/reviews/fe08-reservation-candidate-catalog-validation-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/full-reconciliation-human-acceptance-packet-2026-07-19.md`

- [x] **Bước 1: Chạy cổng tập trung.**

```powershell
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reservationRoutes.test.js
npm.cmd --prefix backend test -- --runInBand --testMatch "**/reservationCandidates.sqltest.js"
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
```

Ghi lại số lượng chính xác và kết quả dọn dẹp SQL dùng một lần.

- [x] **Bước 2: Chạy các cổng cục bộ hoàn chỉnh.**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix backend run test:integration:system
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:deployment
npm.cmd run trace:enforce
$env:E2E_FRONTEND_URL='http://127.0.0.1:4185'
$env:E2E_BACKEND_URL='http://127.0.0.1:3101'
npm.cmd run test:e2e
```

Chạy lại cổng SQL Server tổng hợp dùng một lần, bao gồm bộ ứng viên mới mà không có thao tác ghi cơ sở
dữ liệu ứng dụng.

- [x] **Bước 3: Cập nhật bằng chứng tập trung.**

Ghi lại các lệnh, số lượng, xác nhận chiếu an toàn, kết quả ủy quyền, dọn dẹp SQL, cổng trình duyệt,
chạy CI, tính nhất quán của tư vấn và rủi ro còn sót lại. Không bao giờ ghi lại thông tin xác thực,
mã thông báo, OTP thô hoặc chuỗi kết nối.

- [x] **Bước 4: Chỉ đóng TD-028 sau khi tất cả bằng chứng đã được thông qua.**

Di chuyển TD-028 từ `OPEN` sang bảng Đã giải quyết với cam kết triển khai và bản ghi xác thực tập
trung. Giữ khoản nợ đánh giá con người không liên quan ở trạng thái mở cho đến khi người đánh giá ký
vào gói.

- [x] **Bước 5: Cập nhật gói chấp nhận.**

Điền vào Cổng quyết định A với tham chiếu Tùy chọn A đã được phê duyệt, cập nhật head/CI cuối cùng
và bỏ chọn Cổng B cho đến khi người đánh giá có tên là con người hoàn thành hướng dẫn FE01-FE12 và
phê duyệt hợp nhất một cách rõ ràng.

- [x] **Bước 6: Cam kết và đưa ra bằng chứng.**

```powershell
git add TECH_DEBT.md .sdd/reviews/fe08-reservation-candidate-catalog-validation-2026-07-19.md .sdd/reviews/full-reconciliation-human-acceptance-packet-2026-07-19.md
git commit -m "docs: close FE08 candidate catalog validation debt"
git push origin feat/full-reconciliation
```

---

## Tự xem xét kế hoạch

- **Phạm vi bao gồm đặc tả:** quyền truy cập, xác thực truy vấn, trạng thái đủ điều kiện, dự đoán an toàn, tính nhất quán trong tư vấn, di chuyển giao diện người dùng, xác thực SQL, chấp nhận trình duyệt, khả năng truy vết và các mục tiêu không phải là mục tiêu được đề cập trong Nhiệm vụ 1-7.
- **Tính đầy đủ:** mọi tác vụ đều đặt tên cho các tệp, giao diện, lệnh và kết quả mong đợi; không còn bước nào chưa xác định.
- **Tính nhất quán của loại:** kho lưu trữ trả về `{ rows, total }`; dịch vụ trả về `{ data, pagination }`; giao diện người dùng tiêu thụ `data.data` và `data.pagination`; tạo tiêu thụ số `copyId`.
- **Phạm vi:** không bao gồm lược đồ, phần phụ thuộc, duyệt công khai, khoảng không quảng cáo của nhân viên, hàng đợi tự động, thông báo hoặc thay đổi mục tiêu thao tác ghi.
- **An toàn:** SQL vẫn được tham số hóa và tất cả các thiết bị cố định được hỗ trợ bởi SQL đều được tổng hợp và làm sạch.
