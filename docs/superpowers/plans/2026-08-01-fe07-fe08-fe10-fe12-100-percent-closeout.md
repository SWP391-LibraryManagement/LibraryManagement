# FE07 FE08 FE10 FE12 Kế hoạch thực hiện khóa 100 phần trăm

> **Đối với nhân viên đại lý:** BẮT BUỘC SUB-SKILL: Sử dụng `executing-plans` để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Làm cho việc triển khai FE07, FE08, FE10 và FE12 đã được phê duyệt hiện tại có thể
thực thi được ở khả năng truy vết FR nguồn sản xuất 100% mà không làm thay đổi hành vi kinh doanh,
sau đó tạo ra bằng chứng chấp nhận mới tại địa phương và báo cáo chặn giai đoạn chính xác bên ngoài.

**Kiến trúc:** Hành vi kinh doanh hiện tại không thay đổi vì các FR được kiểm tra đã được triển khai
và bao phủ bởi các kiểm thử máy chủ, giao diện người dùng và trình duyệt. Lô này bổ sung thêm các
thẻ yêu cầu tại ranh giới sản xuất sở hữu, tăng cường cổng truy vết để các chức năng của `COMPLETE`
yêu cầu 100%, điều chỉnh bốn tiêu đề nhiệm vụ và xác thực hành vi không thay đổi từ cấp đơn vị thông
qua luồng trình duyệt được kết nối. thao tác ghi và xuất bản Azure vẫn nằm sau cổng con người H2/H3 của
kho lưu trữ.

**bộ công nghệ công nghệ:** Node.js 22, Express, React/Vite, SQL Server 2022, Trình chạy kiểm thử
nút, Jest, Playwright, GitHub hành động, Azure CLI.

## Ràng buộc toàn cầu

- Nguồn xác thực đã được phê duyệt vẫn là `.sdd/specs/feat-*/SPEC.md` của mỗi chức năng; không có yêu cầu, API, lược đồ, vai trò, chuyển đổi trạng thái hoặc hành vi giao diện người dùng sẽ được thêm vào theo đợt này.
- Hành vi kinh doanh cốt lõi và ranh giới bảo mật phải không thay đổi; các chỉnh sửa sản xuất được giới hạn ở các chú thích `@spec` tại các điểm sở hữu đã được kiểm thử.
- Siêu dữ liệu triển khai `COMPLETE` yêu cầu 100% thẻ FR trong `backend/src` và `frontend/src`; `PARTIAL` giữ mức sàn tối thiểu được cấu hình.
- Không có bí mật, thông tin xác thực, chi tiết nhà cung cấp hoặc PII thực nào có thể được ghi vào nguồn, kiểm tra, nhật ký hoặc bằng chứng kế hoạch.
- Các kiểm thử thao tác ghi SQL chỉ có thể chạy trên cơ sở dữ liệu cục bộ dùng một lần được đặt tên và không được nhắm mục tiêu vào cơ sở dữ liệu môi trường tiền sản xuấth cho nhà phát triển hoặc cơ sở dữ liệu dùng chung.
- Không có cam kết, đẩy, xuất bản PR, tiếp tục/triển khai hoặc hợp nhất Azure xảy ra trước cổng H2/H3 của con người.

---

### Nhiệm vụ 1: Thực thi truy vết 100% cho các chức năng HOÀN THÀNH

**Tệp:**
- Sửa đổi: `scripts/traceability-state.test.js`
- Sửa đổi: `scripts/traceability-state.js`
- Sửa đổi: `scripts/check-traceability.js`
- Sửa đổi: `.github/workflows/ci.yml`

**Giao diện:**
- Tiêu thụ: `parseImplementationState(taskText)` và tầng chức năng một phần `--min=<number>` hiện có.
- Tạo ra: `requiredCoverage(state, partialMinimum)` trả về `100` cho `COMPLETE`, mức tối thiểu được định cấu hình cho `PARTIAL` và `null` cho trạng thái không hoạt động.

- [x] **Bước 1: Viết kiểm thử ngưỡng không đạt**

```js
test('requires full traceability for COMPLETE features while preserving the PARTIAL floor', () => {
  assert.equal(requiredCoverage('COMPLETE', 70), 100);
  assert.equal(requiredCoverage('PARTIAL', 70), 70);
  assert.equal(requiredCoverage('NOT_STARTED', 70), null);
  assert.equal(requiredCoverage('DEFERRED', 70), null);
});
```

- [x] **Bước 2: Chạy kiểm tra ngưỡng và xác minh RED**

Chạy: `npm run test:traceability-state`

Dự kiến: THẤT BẠI vì `requiredCoverage` không được xuất.

- [x] **Bước 3: Thực hiện ngưỡng cho mỗi trạng thái**

```js
function requiredCoverage(state, partialMinimum) {
  if (state === 'COMPLETE') return 100;
  if (state === 'PARTIAL') return partialMinimum;
  return null;
}
```

Cập nhật `check-traceability.js` để mỗi hàng ghi lại `required`, không thành công khi `pct <
bắt buộc` và báo cáo yêu cầu trên mỗi hàng. Đổi tên bước CI thành `Spec cổng truy vết (HOÀN THÀNH
= 100%, MỘT PHẦN >= 70%)`.

- [x] **Bước 4: Chạy kiểm tra ngưỡng và xác minh GREEN**

Chạy: `npm run test:traceability-state`

Dự kiến: tất cả các kiểm thử trạng thái truy nguyên đều ĐẠT.

### Nhiệm vụ 2: Đóng truy vết sản xuất FE07 và FE08

**Tệp:**
- Sửa đổi: `scripts/traceability-state.test.js`
- Sửa đổi: `backend/src/services/borrowingService.js`
- Sửa đổi: `frontend/src/api/apiErrorMessages.js`
- Sửa đổi: `backend/src/repositories/reservationRepository.js`
- Sửa đổi: `frontend/src/page/reservation/MyReservationsPage.jsx`
- Sửa đổi: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`

**Giao diện:**
- Tiêu thụ: hành vi `FR-FE07-040/041/042/044` và `FR-FE08-007/036/037/038` đã được phê duyệt đã được thực hiện bằng cách mượn, đặt chỗ, giao diện người dùng, hợp đồng và các kiểm thử E2E được kết nối.
- Sản xuất: một chủ sở hữu `@spec` nguồn sản xuất cho mỗi FR được liệt kê mà không thay đổi mã thời gian chạy.

- [x] **Bước 1: Viết xác nhận phạm vi bao phủ chức năng mục tiêu không thành công**

Thêm một kiểm thử để đọc bốn thông số mục tiêu, chỉ quét các dòng `backend/src` và `frontend/src`
chứa `@spec` và xác nhận mọi FR mục tiêu đã khai báo đều được gắn thẻ.

```js
for (const featureDirectory of targetFeatureDirectories) {
  const missing = declaredFeatureRequirements(featureDirectory)
    .filter((requirementId) => !productionTags.has(requirementId));
  assert.deepEqual(missing, [], `${featureDirectory} missing production tags`);
}
```

- [x] **Bước 2: Chạy xác nhận phạm vi bảo hiểm và xác minh RED**

Chạy: `npm run test:traceability-state`

Dự kiến: KHÔNG Liệt kê các ID bị thiếu FE07 và FE08 cùng với các ID FE10/FE12 đã đóng trong Nhiệm vụ 3.

- [x] **Bước 3: Thêm chú thích FE07/FE08 tối thiểu tại các điểm sở hữu**

Chỉ thêm nhận xét:

```js
// @spec FR-FE07-040 - approved/rejected requests create an idempotent FE10 result notification.
// @spec FR-FE07-041 - renew/return commits are followed by a non-blocking FE10 result notification.
// @spec FR-FE07-042 - return exposes a fixed FE08 queue handoff without mutating reservations.
// @spec FR-FE07-044 - stale/blocker error codes map to truthful reload or next-action guidance.
// @spec FR-FE08-007 - the winning queue hold atomically changes the physical copy to RESERVED.
// @spec FR-FE08-036 - only the owner of a NOTIFIED reservation receives the exact-copy FE07 CTA.
// @spec FR-FE08-037, FR-FE08-038 - staff explicitly triggers processing and receives only safe warning data.
```

- [x] **Bước 4: Chạy hồi quy FE07/FE08 tập trung**

Chạy:

```powershell
npm --prefix backend test -- --runInBand --runTestsByPath tests/borrowingRoutes.test.js tests/reservationRoutes.test.js tests/reservationService.test.js tests/borrowingContract.test.js
npm --prefix frontend test -- test/borrowingFrontend.test.js test/reservationFrontend.test.js
```

Dự kiến: tất cả các kiểm thử đã chọn ĐẠT với phản hồi và hành vi giao diện người dùng không thay đổi.

### Nhiệm vụ 3: Đóng khả năng truy vết FE10 và FE12 và đối chiếu siêu dữ liệu triển khai

**Tệp:**
- Sửa đổi: `backend/src/services/notificationService.js`
- Sửa đổi: `backend/src/utils/notificationInbox.js`
- Sửa đổi: `frontend/src/context/NotificationInboxContext.jsx`
- Sửa đổi: `frontend/src/page/dashboard/RoleDashboardPage.jsx`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/TASKS.md`
- Sửa đổi: bốn tệp `CHANGELOG.md` phù hợp

**Giao diện:**
- Tiêu thụ: `FR-FE10-015..020`, `FR-FE12-015` đã được phê duyệt, bằng chứng tích hợp/trình duyệt đã hợp nhất và cổng HOÀN THÀNH mạnh hơn từ Nhiệm vụ 1.
- Tạo ra: khả năng truy vết FR mục tiêu 100% và `Implementation State: COMPLETE` cho bốn phạm vi triển khai đã được phê duyệt trong khi vẫn duy trì dòng chặn theo giai đoạn Azure riêng biệt.

- [x] **Bước 1: Thêm chú thích FE10/FE12 tối thiểu tại các điểm sở hữu**

```js
// @spec FR-FE10-017 - FE10 accepts the four FE07 result templates owned by FE07.
// @spec FR-FE10-018 - an idempotency key replays the existing notification across normal and unique-key race paths.
// @spec FR-FE10-015, FR-FE10-019, FR-FE10-020 - inbox projection uses eligible rows and server-owned fixed action paths.
// @spec FR-FE10-016 - authenticated roles receive the canonical inbox refresh/read workflow.
// @spec FR-FE12-015 - staff KPI cards render the FE12 snapshot and use fixed approved drill-down paths.
```

- [x] **Bước 2: Đối chiếu siêu dữ liệu và nhật ký thay đổi TASKS mục tiêu**

Thay đổi chính xác một dòng siêu dữ liệu cho mỗi tệp mục tiêu:

```text
Implementation State: COMPLETE
```

Thêm mục nhập nhật ký thay đổi `2026-08-01` giải thích rằng việc đóng cửa không thêm hành vi sản
phẩm nào và việc chấp nhận Azure vẫn bị chặn riêng cho đến khi cơ sở dữ liệu bị tạm dừng có thể được
tiếp tục lại.

- [x] **Bước 3: Chạy trạng thái truy nguyên nguồn gốc và cổng truy vết bắt buộc**

Chạy:

```powershell
npm run test:traceability-state
npm run trace:enforce
```

Dự kiến: tất cả bốn chức năng mục tiêu đều hiển thị 100% và `COMPLETE`; các chức năng MỘT PHẦN khác
giữ lại mức sàn 70%.

- [x] **Bước 4: Chạy hồi quy FE10/FE12 tập trung**

Chạy:

```powershell
npm --prefix backend test -- --runInBand --runTestsByPath tests/notificationRoutes.test.js tests/notificationInboxRepository.test.js tests/reportRoutes.test.js tests/reportService.test.js
npm --prefix frontend test -- test/notificationInboxFrontend.test.js test/reportOperationalFrontend.test.js
```

Dự kiến: tất cả các kiểm thử đã chọn ĐẠT với quyền riêng tư, tính tạm thời, báo cáo và hành vi chi
tiết không thay đổi.

### Nhiệm vụ 4: Đưa ra bằng chứng địa phương đầy đủ và dừng lại ở cổng ngoài

**Tệp:**
- Tạo: `.sdd/reviews/fe07-fe08-fe10-fe12-100-percent-closeout-2026-08-01.md`

**Giao diện:**
- Tiêu thụ: độ khác biệt chính xác không được cam kết và tất cả kết quả đầu ra xác thực từ Nhiệm vụ 1-3.
- Tạo ra: gói đánh giá phù hợp với H2, tiếp theo là H3/hợp nhất/triển khai chỉ sau khi có sự chấp thuận rõ ràng của con người.

- [x] **Bước 1: Chạy xác minh hoàn toàn tự động**

Chạy:

```powershell
npm --prefix backend test
npm --prefix backend run test:integration:system
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build
npm run test:e2e -- --project=chromium
npm run test:deployment
npm run test:secrets
npm run trace:enforce
git diff --check
```

Dự kiến: mọi lệnh đều thoát `0`; khả năng truy vết mục tiêu là 100%.

- [x] **Bước 2: Chỉ chạy bộ thao tác ghi SQL trên cơ sở dữ liệu cục bộ dùng một lần**

Tạo cơ sở dữ liệu cục bộ được đặt tên duy nhất, áp dụng `database/Librarymanagement.sql` thông qua
đường dẫn chuẩn bị lược đồ Azure hiện có, định cấu hình đăng nhập SQL có đặc quyền tối thiểu tạm
thời chỉ cho cơ sở dữ liệu đó, chạy bộ FE07 và hệ thống SQL với cả hai cờ thao tác ghi được đặt, sau đó
loại bỏ cơ sở dữ liệu dùng một lần chính xác và đăng nhập sau khi thu thập bằng chứng.

Dự kiến: cả bộ SQL được bảo vệ đạt và các tài nguyên dùng một lần được đặt tên đều bị xóa.

- [x] **Bước 3: Chạy chấp nhận trình duyệt**

Chạy:

```powershell
npx playwright test tests/e2e/fe07-fe12-connected-demo-flow.spec.js tests/e2e/fe08-reservation-candidate-catalog.spec.js tests/e2e/fe10-notification-inbox.spec.js tests/e2e/system-golden-path.spec.js --project=chromium
```

Dự kiến: sáu kịch bản Chrome ĐẠT mà không có lỗi trình duyệt.

- [x] **Bước 4: Ghi lại trạng thái Azure chính xác mà không làm thay đổi nó**

Chạy truy vấn chỉ đọc Azure CLI cho Ứng dụng web và trạng thái `LibraryManagementStaging`. Ghi lại
chính xác `Running`, `Paused`, lỗi hạn ngạch hoặc các giá trị trực tiếp khác. Không tiếp tục, triển
khai hoặc chi tiêu hạn ngạch trước khi được cấp phép H2/H3.

- [x] **Bước 5: Viết gói đánh giá H2**

Ghi lại sổ cái nguồn, ranh giới tác nhân, độ khác biệt chính xác, ánh xạ yêu cầu mục tiêu, lệnh và
số lượng, bằng chứng dọn dẹp SQL, trạng thái Azure, trình chặn bên ngoài chưa được giải quyết và các
quyết định bắt buộc của con người. Không dán nhãn hoàn tất chấp nhận Azure trong khi cơ sở dữ liệu
bị tạm dừng.

- [x] **Bước 6: Dừng trước khi cam kết/xuất bản**

Trình bày dấu vân tay khác biệt chính xác và yêu cầu H2. Chỉ sau H2, các tệp được xem xét mới có thể
được cam kết và đẩy; H3 vẫn là bắt buộc trước khi hợp nhất và xác minh triển khai Azure.
