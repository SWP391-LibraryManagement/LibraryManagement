# Kế hoạch triển khai khắc phục sự cố phát hành trước Azure

> **Đối với nhân viên đại lý:** BẮT BUỘC SUB-SKILL: Sử dụng `superpowers:executing-plans` để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Goal:** Hoàn tất các sửa chữa FE07/FE08, phát hành preparation, credential rotation và quản trị
không cần Azure SQL môi trường tiền sản xuất đang online.

**kiến trúc:** Giữ nguyên quyền sở hữu hiện tại: FE07 sở hữu giao dịch mượn/trả, FE08 sở hữu
queue/hold, FE10 sở hữu thông báo yêu cầu và FE12 chỉ đọc aggregate. bàn giao FE07 chỉ là
chỉ đọc dữ liệu chiếu; không thêm API hoặc lược đồ mới. quy trình chỉ xác minh di chuyển dữ
liệu/hash, còn việc
chạy SQL vẫn do operator thực hiện sau khi cơ sở dữ liệu hết `Paused`.

**bộ công nghệ công nghệ:** Node.js + Express + Jest + React/Vite + Trình chạy thử nút + Hành động
GitHub + Azure CLI + SQL Server.

## Ràng buộc toàn cầu

- lõi behavior phải tuân theo SPEC/PLAN/TASKS hiện hành của FE07/FE08/FE10/FE12.
- Không mở rộng lược đồ, API, tác nhân ranh giới hoặc giao dịch quyền sở hữu.
- `DAMAGED`/`LOST` không được phát ra queue bàn giao có thể xử lý như bản sao `AVAILABLE`.
- bàn giao FE08 lỗi thời không được tự chuyển sang `copyId` khác.
- Không ghi credential vào repo, `.env`, dữ liệu kiểm thử, log hoặc output.
- Không bật tính phí, resume cơ sở dữ liệu, chạy `sqlcmd`, deploy môi trường tiền sản xuất hoặc tạo phát hành tag trong kế hoạch này.
- Mọi thay đổi behavior phải có kiểm thử hồi quy và cập nhật CHANGELOG/SDD.

---

### Nhiệm vụ 1: Khóa FE07 trả sách bàn giao theo trạng thái bản sao

**Tệp:**
- Sửa đổi: `backend/src/repositories/borrowingRepository.js:1435-1503`
- kiểm thử: `backend/tests/borrowingRoutes.test.js` (các kiểm thử trả sách có hàng đợi đặt chỗ)
- kiểm thử: `backend/tests/borrowingRepository.test.js` (hợp đồng/nguồn assertions hiện hành)
- Sửa đổi: `backend/tests/helpers/inMemoryBorrowingRepositories.js:818-827`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/CHANGELOG.md`

**Giao diện:**
- Tiêu thụ: `returnBorrowDetail({ borrowDetailId, condition, ... })`.
- đầu ra: phản hồi `reservationQueueAction` giữ nguyên shape `{ copyId, hasActiveQueue, actionPath }`; chỉ thay đổi giá trị `hasActiveQueue`.

- [ ] **Bước 1: Thêm các xác nhận hồi quy thất bại**

Trong kiểm thử trả sách tuyến, giữ kiểm thử `NORMAL` hiện tại và thêm hai ca dùng cùng dữ liệu kiểm
thử có `ACTIVE` đặt chỗ:

```js
test.each(['DAMAGED', 'LOST'])(
  'returning a %s copy does not expose a process-queue handoff',
  async (condition) => {
    const response = await request(setup.app)
      .patch(`/api/borrow-details/${detailId}/return`)
      .set(auth)
      .send({ condition })
      .expect(200);

    expect(response.body.borrowDetail.status).toBe(condition);
    expect(response.body.reservationQueueAction).toEqual({
      copyId,
      hasActiveQueue: false,
      actionPath: '/librarian/reservations',
    });
  }
);
```

Trong in-memory kho mã nguồn kiểm thử/dữ liệu kiểm thử, bảo đảm `hasActiveQueue` được tính từ điều
kiện `detailStatus === 'RETURNED'`, để regression không chỉ phụ thuộc SQL triển khai.

- [ ] **Bước 2: Chạy kiểm thử tập trung và xác minh RED**

Chạy:

```powershell
npm --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js
```

mong đợi: kiểm thử mới không đạt vì mã nguồn hiện tại trả `hasActiveQueue: true` cho `DAMAGED/LOST`; các
kiểm thử cũ khác vẫn chạy để xác nhận không đạt cùng một root cause.

- [ ] **Bước 3: Thực hiện khắc phục nguyên nhân gốc rễ nhỏ nhất**

Trong `authoritativeReturn`, thay thế:

```js
hasActiveQueue: reservationQueueResult.recordset.some((row) => row.Status === 'ACTIVE'),
```

bằng:

```js
hasActiveQueue: detailStatus === 'RETURNED'
  && copyStatus === 'AVAILABLE'
  && reservationQueueResult.recordset.some((row) => row.Status === 'ACTIVE'),
```

Áp dụng cùng điều kiện trong `backend/tests/helpers/inMemoryBorrowingRepositories.js`. Không xóa
hoặc tự chuyển đặt chỗ.

- [ ] **Bước 4: Chạy kiểm thử tập trung và xác minh GREEN**

Chạy:

```powershell
npm --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js
```

mong đợi: tất cả focused tests đạt, gồm `NORMAL` bàn giao `true` và `DAMAGED/LOST` bàn giao `false`.

- [ ] **Bước 5: Cập nhật khả năng truy vết/thay đổi**

Ghi rõ `BR-FE07-012`, `BR-FE07-013`, `FR-FE07-007` và connected-luồng bàn giao trong changelog;
không thay đổi SPEC quy tắc.

---

### Nhiệm vụ 2: Giữ nguyên bàn giao `copyId` khi FE08 tải trạng thái lỗi thời

**Tệp:**
- Sửa đổi: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx:7-126, 390-430`
- kiểm thử: `frontend/test/*.test.js` (kiểm thử FE08 thủ thư bàn giao hiện hành)
- Sửa đổi: `.sdd/specs/feat-reservation-management/CHANGELOG.md`

**Giao diện:**
- đầu vào: `location.state.copyId` từ FE07.
- đầu ra: queue view đúng bản sao hoặc cảnh báo stale trạng thái; không thay đổi API dữ liệu gửi/thao tác ghi.

- [ ] **Bước 1: Thêm kiểm thử hồi quy cấp nguồn không thành công**

Thêm kiểm thử đọc nguồn để khóa hai hành vi:

```js
test('FE08 does not fallback from a stale FE07 handoff to another active copy', () => {
  const source = readReservationLibrarianPage();

  assert.match(source, /initialQueueCopyId/);
  assert.match(source, /Hàng đợi đã thay đổi/);
  assert.doesNotMatch(
    source,
    /return mapped\.find\(\(item\) => isActiveReservationQueueStatus\(item\.status\)\)\?\.copyId \|\| null;/
  );
});
```

Giữ nguyên kiểm thử hiện hành chứng minh bàn giao hợp lệ mở đúng `copyId`.

- [ ] **Bước 2: Chạy kiểm thử giao diện người dùng tập trung và xác minh RED**

Chạy:

```powershell
npm --prefix frontend test -- --test-name-pattern "handoff"
```

mong đợi: kiểm thử mới không đạt vì `loadReservations()` đang fallback sang bản sao đang mượn đầu tiên.

- [ ] **Bước 3: Triển khai xử lý bản sao cũ chính xác**

Thêm `useRef` để tiêu thụ bàn giao một lần:

```js
const pendingHandoffCopyId = useRef(initialQueueCopyId);
const [queueNotice, setQueueNotice] = useState('');
```

Trong `loadReservations()`:

```js
const requestedCopyId = pendingHandoffCopyId.current;
if (requestedCopyId) {
  const requestedIsActive = mapped.some((item) => (
    item.copyId === requestedCopyId && isActiveReservationQueueStatus(item.status)
  ));
  if (requestedIsActive) {
    setQueueCopyId(requestedCopyId);
  } else {
    setQueueCopyId(null);
    setQueueNotice('Hàng đợi đã thay đổi. Hãy tải lại hoặc chọn bản sao khác.');
  }
  pendingHandoffCopyId.current = null;
} else {
  setQueueCopyId((current) => (
    current && mapped.some((item) => (
      item.copyId === current && isActiveReservationQueueStatus(item.status)
    ))
      ? current
      : mapped.find((item) => isActiveReservationQueueStatus(item.status))?.copyId || null
  ));
}
```

Render `queueNotice` bằng `DataNotice` trong queue panel, cùng nút chuyển về danh sách/chọn thủ công. Không gọi `processQueue` tự động.

- [ ] **Bước 4: Chạy kiểm thử giao diện người dùng tập trung và xác minh GREEN**

Chạy:

```powershell
npm --prefix frontend test -- --test-name-pattern "handoff|queue"
```

mong đợi: bàn giao hợp lệ vẫn đúng `copyId`, bàn giao stale không đổi sang copy khác, queue tests
hiện hành đạt.

- [ ] **Bước 5: Cập nhật nhật ký thay đổi FE08**

Ghi `FR-FE08-039` và connected-luồng stale-trạng thái behavior; giữ hành động path danh sách cho
phép hiện tại.

---

### Nhiệm vụ 3: Đưa di chuyển dữ liệu FE10 mới vào phát hành cổng và đồng bộ SDD

**Tệp:**
- Sửa đổi: `.github/workflows/deploy-staging.yml:45-78, 91`
- Sửa đổi: `docs/deployment/azure-staging-guide.md:160-247, 381-390`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/{SPEC.md,PLAN.md,TASKS.md,TEST_PLAN.md,CONTEXT.md,CHANGELOG.md}`
- Sửa đổi: `.sdd/specs/feat-reservation-management/{SPEC.md,PLAN.md,TASKS.md,TEST_PLAN.md,CONTEXT.md,CHANGELOG.md}`
- Sửa đổi: `.sdd/specs/feat-notification-management/{SPEC.md,PLAN.md,TASKS.md,TEST_PLAN.md,CONTEXT.md,CHANGELOG.md}`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/{SPEC.md,PLAN.md,TASKS.md,TEST_PLAN.md,CONTEXT.md,CHANGELOG.md}`
- Kiểm tra: `backend/tests/notificationInboxMigration.test.js`
- Kiểm tra: `tests/deployment/*.test.js`

**Giao diện:**
- Tiêu thụ: `database/migrations/2026-07-29-fe10-borrowing-result-templates.sql`.
- Tạo ra: cổng SHA di chuyển xác định để triển khai trong tương lai; không thực thi cơ sở dữ liệu trong CI.

- [ ] **Bước 1: Thêm xác nhận triển khai/di chuyển không thành công**

Thêm xác nhận rằng quy trình triển khai và hướng dẫn đề cập đến việc di chuyển mới và biến SHA dự kiến:

```js
assert.match(deployWorkflow, /2026-07-29-fe10-borrowing-result-templates\.sql/);
assert.match(deployWorkflow, /FE10_BORROWING_RESULT_TEMPLATES_SHA256/);
assert.match(stagingGuide, /2026-07-29-fe10-borrowing-result-templates\.sql/);
```

Chạy:

```powershell
npm run test:deployment
```

Dự kiến: các xác nhận mới không thành công trước khi thay đổi quy trình làm việc/tài liệu.

- [ ] **Bước 2: Triển khai cổng băm di chuyển**

Mở rộng quá trình di chuyển trước hiện có để đọc tệp mới, chuẩn hóa LF/CRLF chính xác như cổng cũ,
so sánh với `FE10_BORROWING_RESULT_TEMPLATES_SHA256` và không thành công trước khi triển khai nếu
vắng mặt/không khớp. Giữ hướng dẫn “áp dụng hai lần” do nhà điều hành sở hữu; không gọi `sqlcmd` từ
quy trình làm việc.

- [ ] **Bước 3: Cập nhật hướng dẫn Azure**

Thêm di chuyển vào danh sách và tài liệu được sắp xếp:

```text
1. Áp dụng 2026-07-29-fe10-borrowing-result-templates.sql hai lần bằng sqlcmd -b.
2. Xác minh BORROW_REQUEST_APPROVED, BORROW_REQUEST_REJECTED và BORROW_RENEWED đang hoạt động.
3. Đặt FE10_BORROWING_RESULT_TEMPLATES_SHA256 thành đúng giá trị băm của tệp đã chuẩn hóa.
```

Đánh dấu bước này `BLOCKED` cho đến khi Azure SQL trực tuyến; không cho rằng nó đã được áp dụng.

- [ ] **Bước 4: Đồng bộ trạng thái chức năng**

Replace stale “CHỜ H3/hợp nhất” và “UNCOMMITTED đang chờ H2 APPROVAL” headers với a precise post-hợp
nhất trạng thái:

```text
Trạng thái: MERGED ON MAIN; POST-MERGE CI PASSED; AZURE STAGING BLOCKED BY PAUSED SQL QUOTA
```

Không chọn việc chấp nhận Azure của con người và lưu giữ các mục nhật ký thay đổi lịch sử.

- [ ] **Bước 5: Chạy kiểm tra triển khai/truy vết**

Chạy:

```powershell
npm run test:deployment
npm run test:traceability-state
npm run trace:enforce
git diff --check
```

Dự kiến: tất cả các bước kiểm tra tự động đều đạt; không có tuyên bố nào cho biết quá trình di
chuyển Azure hoặc quá trình chấp nhận giai đoạn được xác thực đã được thông qua.

---

### Nhiệm vụ 4: Thêm chức năng quét bí mật tệp được theo dõi mà không cần phụ thuộc

**Tệp:**
- Tạo: `scripts/check-tracked-secrets.js`
- Tạo: `scripts/check-tracked-secrets.test.js`
- Sửa đổi: `package.json`
- Sửa đổi: `.github/workflows/ci.yml`

**Giao diện:**
- Tiêu thụ: Đường dẫn được theo dõi Git từ `git ls-files -z`.
- Tạo ra: mã thoát `0` khi không tìm thấy mẫu bí mật có độ tin cậy cao; khác 0 chỉ có đường dẫn tệp và tên mẫu, không bao giờ có giá trị khớp.

- [ ] **Bước 1: Viết các kiểm thử máy quét không thành công**

Tạo kiểm thử với các tệp tạm thời chứa khóa AWS tổng hợp và mật khẩu cơ sở dữ liệu URL, cùng với một
thiết bị cố định an toàn:

```js
test('fails on high-confidence credential patterns without printing values', () => {
  const syntheticKey = ['AKIA', 'IOSFODNN7EXAMPLE'].join('');
  const result = runScannerWithFixture(`AWS_ACCESS_KEY_ID=${syntheticKey}`);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /AWS access key/);
  assert.doesNotMatch(result.stderr, new RegExp(syntheticKey));
});

test('allows marked synthetic test passwords', () => {
  const password = ['Phase3', 'test-only'].join('-');
  const result = runScannerWithFixture(`password=${password} // secret-scan: allow-synthetic`);
  assert.equal(result.status, 0);
});
```

- [ ] **Bước 2: Chạy kiểm thử máy quét và xác minh RED**

Chạy:

```powershell
node --test scripts/check-tracked-secrets.test.js
```

Dự kiến: không thành công vì tập lệnh quét không tồn tại.

- [ ] **Bước 3: Triển khai trình quét tối thiểu**

Chỉ sử dụng các phần mềm tích hợp sẵn của Node. Đọc các tệp được theo dõi dưới dạng bộ đệm, bỏ qua
tệp nhị phân, chuẩn hóa văn bản, chỉ phát hiện các mẫu có độ tin cậy cao (khóa truy cập AWS, tiêu đề
khóa riêng, Azure xuất bản hồ sơ bí mật XML, mật khẩu chuỗi kết nối và gán giống JWT), chỉ hỗ trợ
`secret-scan: allow-synthetic` một dòng cho dòng đó và chỉ in `path: pattern-name`.

- [ ] **Bước 4: Đấu dây máy quét vào CI**

Thêm:

```yaml
- name: Secret literal scan
  run: npm run test:secrets
```

Chạy trước khi kiểm tra phần phụ thuộc. Giữ `npm audit --audit-level=high` không thay đổi.

- [ ] **Bước 5: Xác minh máy quét và hợp đồng CI**

Chạy:

```powershell
node --test scripts/check-tracked-secrets.test.js
npm run test:deployment
git grep -n -I -E "(AKIA[0-9A-Z]{16}|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|password=.{8,})" -- ':!scripts/check-tracked-secrets.test.js' ':!docs/superpowers/plans/2026-07-29-pre-azure-release-remediation.md'
```

Dự kiến: các kiểm thử máy quét đã vượt qua, các thiết bị cố định tổng hợp đã biết được đưa vào danh
sách cho phép và grep cuối cùng không tạo ra giá trị thông tin xác thực thực sự.

---

### Nhiệm vụ 5: Xoay thông tin xác thực SQL mà không làm lộ giá trị mới

**Tệp:**
- Không có thay đổi tập tin kho lưu trữ.
- Trạng thái bên ngoài: Azure SQL mật khẩu quản trị viên máy chủ logic và App Service `DB_PASSWORD`; chỉ cập nhật Bí mật hành động GitHub nếu có bí mật phù hợp hiện có.
- Bằng chứng: `.sdd/reviews/` hoặc nhật ký tác vụ chỉ được chứa tên/trạng thái bị che, không bao giờ chứa giá trị.

**Giao diện:**
- Tiêu thụ: Nhóm tài nguyên Azure `rg-library-staging`, máy chủ `sql-library-staging-ea-nhat714`, ứng dụng `app-library-api-staging-nhat714`.
- Tạo ra: áp dụng mật khẩu mới cho máy chủ và khớp với cài đặt App Service; xác minh kết nối bị trì hoãn trong khi cơ sở dữ liệu vẫn là `Paused`.

- [ ] **Bước 1: Xác nhận tên mà không cần đọc giá trị bí mật**

Chạy:

```powershell
az sql server show --resource-group rg-library-staging --name sql-library-staging-ea-nhat714 `
  --query "{administratorLogin:administratorLogin,state:state}" -o json
az webapp config appsettings list --resource-group rg-library-staging `
  --name app-library-api-staging-nhat714 --query "[?name=='DB_PASSWORD'].name" -o tsv
gh secret list --app actions
```

Dự kiến: tên máy chủ/ứng dụng được giải quyết; không có lệnh nào in một giá trị.

- [ ] **Bước 2: Tạo và áp dụng mật khẩu chỉ dành cho bộ nhớ**

Sử dụng một quy trình PowerShell duy nhất:

```powershell
$newSqlPassword = 'Lib' + [Guid]::NewGuid().ToString('N') + '!A9'
az sql server update --resource-group rg-library-staging `
  --name sql-library-staging-ea-nhat714 --admin-password $newSqlPassword | Out-Null
az webapp config appsettings set --resource-group rg-library-staging `
  --name app-library-api-staging-nhat714 `
  --settings "DB_PASSWORD=$newSqlPassword" | Out-Null
Remove-Variable newSqlPassword
```

Không lặp lại `$newSqlPassword`, đưa nó vào bản ghi hoặc ghi nó vào `.env`.

- [ ] **Bước 3: Chỉ xác minh siêu dữ liệu**

Xác nhận tên cài đặt App Service tồn tại và cơ sở dữ liệu vẫn là `Paused`/không thay đổi; không gọi
điểm cuối tình trạng và báo cáo điểm đó là đã đạt trong khi SQL bị tạm dừng.

---

### Nhiệm vụ 6: Áp dụng quản trị và chạy xác thực không phải Azure

**Tệp:**
- Trạng thái bên ngoài: Bảo vệ nhánh GitHub cho `main`.
- Kiểm tra/bằng chứng: CI, bộ cục bộ, đầu ra truy vết, khác biệt rõ ràng.

- [ ] **Bước 1: Khám phá ngữ cảnh kiểm tra CI bắt buộc**

Chạy:

```powershell
gh api repos/SWP391-LibraryManagement/LibraryManagement/commits/main/check-runs `
  --jq '.check_runs[].name' | Sort-Object -Unique
```

Sử dụng tên công việc CI ổn định chính xác trong bảo vệ nhánh; không phát minh ra một bối cảnh.

- [ ] **Bước 2: Kích hoạt chức năng bảo vệ chính bảo thủ**

Định cấu hình các nhánh cập nhật nghiêm ngặt theo yêu cầu PR, giải pháp hội thoại, bảo vệ cưỡng
bức/xóa và kiểm tra CI được phát hiện. Không yêu cầu người đánh giá bên ngoài không có mặt hoặc bỏ
qua việc kiểm tra.

- [ ] **Bước 3: Chạy xác thực đầy đủ không phải Azure**

Chạy:

```powershell
npm --prefix backend test
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
npm run test:deployment
npm run test:traceability-state
npm run trace:enforce
git diff --check
git status --short
```

Dự kiến: tất cả các lệnh đều đạt; trình chặn chấp nhận duy nhất còn lại là Azure SQL/di chuyển/môi
trường tiền sản xuất.

- [ ] **Bước 4: Xem lại điểm khác biệt cuối cùng**

Xác nhận các tệp đã thay đổi phù hợp với kế hoạch này, không có bí mật nào xuất hiện trong phần khác
biệt và trạng thái SDD không yêu cầu chấp nhận Azure. Cam kết với:

```powershell
git add backend frontend scripts .github docs .sdd
git commit -m "fix: close pre-azure release findings"
```
