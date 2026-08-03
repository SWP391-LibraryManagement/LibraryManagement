# FE07/FE08/FE10/FE12 Kế hoạch thực hiện khắc phục quy tắc nghiệp vụ

> **Đối với nhân viên đại lý:** BẮT BUỘC SUB-SKILL: Sử dụng `executing-plans` để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi. Quy tắc H2 của kho lưu trữ cấm thực hiện các thay đổi triển khai được tạo ra trước khi con người xem xét.

**Mục tiêu:** Điều hòa hành vi mượn, đặt chỗ, thông báo và báo cáo với các hợp đồng FE07, FE08, FE10
và FE12 đã được phê duyệt.

**Kiến trúc:** Giữ ranh giới dịch vụ/kho lưu trữ Express hiện có. Di chuyển các quyết định nhạy cảm
đồng thời vào các giao dịch SQL với thứ tự khóa ổn định, yêu cầu nhân viên FE10 xác nhận các hàng
trước khi phân phối, chỉ hiển thị lệnh hàng đợi FE08 chuẩn và tạo cơ sở dữ liệu phân trang FE12 từ
đầu đến cuối.

**bộ công nghệ công nghệ:** Node.js, Express.js, Jest, React, SQL Server, T-SQL được tham số hóa,
trình chạy kiểm thử nút.

## Ràng buộc toàn cầu

- Bảo tồn kiến trúc Node.js + Express.js, React, SQL Server và REST đã được phê duyệt.
- `MEMBER` đang hoạt động với `Users.Status = ACTIVE` có thể sử dụng FE07/FE08 mà không cần sự chấp thuận của FE04; Trạng thái FE04 chỉ chọn cấp hàng ngày FE07.
- FE07 Thứ tự khóa sao chép được chia sẻ là `member lock -> BookCopies -> BorrowRequests/BorrowDetails -> Reservations`.
- FE08 nhận dạng hàng đợi và mục tiêu xử lý là `CopyId` vật lý; điểm cuối xử lý Giai đoạn 1 duy nhất là `POST /api/reservations/process-queue`.
- Mọi yêu cầu FE10 trong quá trình đều mang theo siêu dữ liệu nguồn bị ràng buộc và khóa tạm thời; chỉ FE04 mới sở hữu `MEMBERSHIP_RESULT`.
- FE12 các bộ lọc, đầu vào tổng hợp, thứ tự ổn định và phân trang hàng chi tiết thực thi trong SQL trước khi các hàng được trả về.
- Không thêm phần phụ thuộc, tiết lộ bí mật/PII, cam kết, đẩy hoặc triển khai trước cổng H2/H3 của kho lưu trữ.

---

### Nhiệm vụ 1: Xác định quyền sở hữu nguồn và phân phối FE10

**Tệp:**
- Sửa đổi: `backend/tests/notificationRoutes.test.js`
- Tạo: `backend/tests/notificationRepository.test.js`
- Sửa đổi: `backend/src/services/notificationService.js`
- Sửa đổi: `backend/src/repositories/notificationRepository.js`
- Sửa đổi: `backend/src/services/borrowingService.js`
- Sửa đổi: `backend/src/services/reservationService.js`

**Giao diện:**
- Tiêu thụ: `createSourceNotificationRequester(sourceFeature)` và `processPendingNotifications({ limit }, actor)`.
- Sản xuất: `claimNextPending()` trả về một hàng được xác nhận quyền sở hữu độc quyền; được bảo vệ `markClaimSent`/`markClaimFailed`; quyền sở hữu nguồn xác định và các yêu cầu FE07/FE08 bình thường.

- [x] **Bước 1: Viết các kiểm thử quyền sở hữu và đồng thời công nhân không thành công.**

Thêm kiểm thử chứng minh:

```js
await expect(
  service.createSourceNotificationRequester('FE07').createNotificationRequest(
    membershipResultInput
  )
).rejects.toMatchObject({ code: 'NOTIFICATION_SOURCE_OWNER_MISMATCH' });

await Promise.all([
  service.processPendingNotifications({ limit: 20 }, ADMIN),
  service.processPendingNotifications({ limit: 20 }, ADMIN),
]);
expect(emailProvider.send).toHaveBeenCalledTimes(1);
```

Đồng thời khẳng định các yêu cầu đến hạn của FE07 và các yêu cầu sẵn sàng đặt chỗ FE08 bao gồm các
khóa bình thường của sự kiện nguồn ổn định.

- [x] **Bước 2: Chạy các kiểm thử tập trung và xác minh RED.**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js tests/notificationRepository.test.js
```

Dự kiến: quyền sở hữu chấp nhận FE07 không chính xác, các nhân viên đồng thời gửi hai lần và các yêu
cầu nguồn FE07/FE08 bỏ qua các khóa tạm thời.

- [x] **Bước 3: Thực hiện hành vi sở hữu, xác nhận và phát lại FE10 ở mức tối thiểu.**

Sử dụng bản đồ chủ sở hữu rõ ràng cho tất cả các cặp chuẩn thuộc sở hữu nguồn:

```js
const notificationTypeOwners = {
  ACCOUNT_VERIFICATION: 'FE02',
  PASSWORD_RESET: 'FE02',
  ACCOUNT_SETUP: 'FE11',
  GENERAL_SYSTEM: 'FE04',
};
```

Yêu cầu các bản ghi được xếp hàng đợi giao dịch trước khi nhà cung cấp phân phối, sử dụng SQL được
tham số hóa và chuyển đổi trạng thái ngăn nhân viên thứ hai nhận cùng một hàng. Đặt `markSent` và
`markFailed` chỉ cập nhật trạng thái xử lý được yêu cầu. Nếu một phần chèn bình thường duy nhất thua
cuộc đua, hãy tải và phát lại hàng hiện có thay vì trả về lỗi nội bộ.

- [x] **Bước 4: Chạy các kiểm thử tập trung và xác minh GREEN.**

Lặp lại Bước 2. Dự kiến: tất cả các kiểm thử FE10 đều vượt qua khi một nhà cung cấp gửi theo các
lệnh gọi đồng thời của nhân viên.

---

### Nhiệm vụ 2: Thực thi FE08 cấp độ sao chép FIFO và tạo dự trữ nguyên tử

**Tệp:**
- Sửa đổi: `backend/tests/reservationRoutes.test.js`
- Sửa đổi: `backend/tests/reservationService.test.js`
- Tạo: `backend/tests/reservationRepository.test.js`
- Sửa đổi: `backend/src/routes/reservationRoutes.js`
- Sửa đổi: `backend/src/controllers/reservationController.js`
- Sửa đổi: `backend/src/services/reservationService.js`
- Sửa đổi: `backend/src/repositories/reservationRepository.js`
- Sửa đổi: `backend/src/validators/reservationValidators.js`
- Sửa đổi: `backend/src/docs/openapi.yaml`
- Sửa đổi: `frontend/src/api/libraryFeatureApi.js`
- Sửa đổi: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`
- Sửa đổi: `frontend/src/page/reservation/MyReservationsPage.jsx`
- Sửa đổi: `frontend/test/reservationFrontend.test.js`

**Giao diện:**
- Tiêu thụ: `POST /api/reservations/process-queue { copyId }`.
- Tạo ra: một kết quả `createReservation({ userId, copyId })` nguyên tử và hàng đợi giao diện người dùng dành riêng cho bản sao.

- [x] **Bước 1: Viết các kiểm thử FIFO không thành công, đồng thời và hợp đồng giao diện người dùng.**

Thêm kiểm thử chứng minh:

```js
expect(routeSource).not.toContain('/:reservationId/process');
expect(librarianPageSource).toContain('reservationApi.processQueue(notifyTarget.copyId)');
expect(librarianPageSource).not.toContain('reservationApi.process(notifyTarget.reservationId');
```

Thêm các kiểm thử kho lưu trữ/dịch vụ trong đó hai lần thử tạo đồng thời bắt đầu từ hai dự trữ mở;
chỉ một người thành công và tổng số cam kết vẫn là ba. Thêm xác nhận giao diện người dùng rằng các
khóa nhóm sử dụng `copyId` chứ không phải `title` và lệnh gọi danh sách bao gồm phân trang máy chủ.

- [x] **Bước 2: Chạy kiểm thử tập trung và xác minh RED.**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reservationRoutes.test.js tests/reservationService.test.js tests/reservationRepository.test.js
node --test frontend/test/reservationFrontend.test.js
```

Dự kiến: tuyến xử lý trực tiếp vẫn còn, giao diện người dùng gọi nó và tạo các bước kiểm tra nằm
ngoài giao dịch kho lưu trữ.

- [x] **Bước 3: Triển khai hàng đợi chuẩn và đường dẫn tạo giao dịch.**

Loại bỏ phương pháp định tuyến/bộ điều khiển/API trực tiếp. Trong một giao dịch SQL:

```text
khóa phạm vi thành viên -> khóa Users/UserRoles -> khóa các đặt chỗ đang mở của người dùng
-> khóa BookCopies/Books mục tiêu -> từ chối xung đột trùng lặp/giới hạn/trạng thái
-> khóa hàng đợi đặt chỗ mục tiêu -> chèn đặt chỗ ACTIVE
```

Trả về kết quả kho lưu trữ rõ ràng cho các xung đột không hoạt động/không phải thành viên, trùng
lặp, giới hạn và trạng thái sao chép; ánh xạ chúng tới mã 4xx an toàn hiện có trong dịch vụ. Nhóm
hàng đợi thủ thư theo `copyId` và gọi `processQueue(copyId)`.

- [x] **Bước 4: Chạy kiểm thử tập trung và xác minh GREEN.**

Lặp lại Bước 2. Dự kiến: tất cả các kiểm thử FE08 backend/frontend đều vượt qua.

---

### Nhiệm vụ 3: Đối chiếu tính đủ điều kiện của FE07 và thứ tự khóa giao dịch

**Tệp:**
- Sửa đổi: `backend/tests/borrowingRoutes.test.js`
- Sửa đổi: `backend/tests/borrowingRepository.test.js`
- Sửa đổi: `backend/tests/sql/borrowingConcurrency.sqltest.js`
- Sửa đổi: `backend/src/services/borrowingService.js`
- Sửa đổi: `backend/src/repositories/borrowingRepository.js`

**Giao diện:**
- Tiêu thụ: mượn các lệnh tạo/phê duyệt/trả sách/gia hạn dịch vụ.
- Tạo ra: kết quả kho lưu trữ chỉ được tính toán sau khi vai trò, cấp độ, số lượng, bản sao, chi tiết và trạng thái đặt chỗ bị khóa theo thứ tự chuẩn.

- [x] **Bước 1: Viết các kiểm thử vai trò, cấp độ và thứ tự khóa không thành công.**

Thêm các kiểm thử chứng minh việc phê duyệt từ chối người dùng có vai trò `MEMBER` đã bị xóa, tính
toán lại cấp 3/5 hàng ngày từ `Members.Status` bị khóa và nguồn kho lưu trữ thu được các khóa sao
chép trước khi khóa yêu cầu/chi tiết/reservation. Thêm kiểm thử trả sách chứng minh khóa giao dịch
`BookCopies -> BorrowDetails -> Reservations`.

- [x] **Bước 2: Chạy kiểm thử tập trung và xác minh RED.**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js
```

Dự kiến: các trường hợp loại bỏ vai trò và cấp độ cũ được chấp nhận và xác nhận thứ tự nguồn không thành công.

- [x] **Bước 3: Triển khai tính đủ điều kiện bị khóa và thứ tự chuẩn.**

Giải quyết khóa thành viên của yêu cầu, lấy khóa ứng dụng thành viên, sau đó khóa các bản sao được
yêu cầu trước khi yêu cầu/chi tiết và đặt chỗ. Tham gia `UserRoles/Roles` trong khi xác thực người
dùng bị khóa và lấy `dailyLimit` trong giao dịch. trả sách sử dụng hậu tố chung `BookCopies ->
BorrowDetails -> Reservations` trước khi cập nhật trạng thái. Bảo tồn SQL được tham số hóa và ánh xạ
lỗi dịch vụ an toàn hiện có.

- [x] **Bước 4: Chạy kiểm thử tập trung và xác minh GREEN.**

Lặp lại Bước 2. Chỉ chạy bộ SQL trực tiếp khi có sẵn cơ sở dữ liệu kiểm thử dùng một lần rõ ràng và
`FE07_SQL_TEST_ALLOW_MUTATION=true`; nếu không thì báo cáo nó như một cổng dư.

---

### Nhiệm vụ 4: Di chuyển phân trang báo cáo FE12 vào SQL và hiển thị điều hướng

**Tệp:**
- Sửa đổi: `backend/tests/reportRepository.test.js`
- Sửa đổi: `backend/tests/reportRoutes.test.js`
- Sửa đổi: `backend/tests/reportDeterministicPolicy.test.js`
- Sửa đổi: `backend/tests/reportInMemoryParity.test.js`
- Sửa đổi: `backend/src/repositories/reportRepository.js`
- Sửa đổi: `frontend/src/page/report/BorrowingReportPage.jsx`
- Sửa đổi: `frontend/src/page/report/InventoryReportPage.jsx`
- Sửa đổi: `frontend/src/page/report/UserStatisticsPage.jsx`
- Sửa đổi: `frontend/test/reportOperationalFrontend.test.js`
- Sửa đổi: `frontend/test/reportFilters.test.js`

**Giao diện:**
- Tiêu thụ: bộ lọc truy vấn báo cáo hiện có cùng với `page` và `limit`.
- Tạo ra: `{ metrics, rows, page, limit, totalRows }` trong đó SQL trả về các hàng và số liệu được phân trang ổn định sử dụng bộ nguồn được lọc hoàn chỉnh.

- [x] **Bước 1: Viết các kiểm thử phân trang, tăng trưởng lịch sử và điều hướng giao diện người dùng SQL không thành công.**

Xác nhận SQL được tạo chứa `OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY`, số liệu đến từ các tập
hợp được lọc không phân trang và thành viên `INACTIVE` có `ApprovedAt` không rỗng vẫn còn trong
`newMembersByPeriod`. Xác nhận cả ba trang gửi `page/limit` và hiển thị các điều khiển trước/tiếp
theo.

- [x] **Bước 2: Chạy kiểm thử tập trung và xác minh RED.**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reportRepository.test.js tests/reportRoutes.test.js tests/reportDeterministicPolicy.test.js tests/reportInMemoryParity.test.js
node --test frontend/test/reportOperationalFrontend.test.js frontend/test/reportFilters.test.js
```

Dự kiến: kho lưu trữ vẫn cắt các hàng trong bộ nhớ, các phê duyệt không hoạt động trước đây bị bỏ
qua và các trang không có trạng thái điều hướng.

- [x] **Bước 3: Triển khai trạng thái trang tổng hợp/phân trang và giao diện người dùng SQL.**

Sử dụng CTE được lọc theo tham số hoặc các truy vấn tương đương. Tính toán số liệu/`totalRows` từ bộ
đã lọc đầy đủ và tìm nạp các hàng chi tiết bằng cách sử dụng thứ tự ổn định đã được phê duyệt cộng
thêm:

```sql
OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
```

Đếm `newMembersByPeriod` từ `Members.ApprovedAt` không null trong phạm vi bất kể trạng thái thành
viên hiện tại. Thêm trạng thái `page` được kiểm soát vào từng trang báo cáo và đặt lại về trang 1
khi bộ lọc thay đổi.

- [x] **Bước 4: Chạy kiểm thử tập trung và xác minh GREEN.**

Lặp lại Bước 2. Dự kiến: tất cả các kiểm thử FE12 backend/frontend đều vượt qua và các trang có thể
tiếp cận các hàng sau 20 kiểm thử đầu tiên.

---

### Nhiệm vụ 5: Hòa hợp hợp đồng và chạy cổng L1-L4

**Tệp:**
- Sửa đổi khi cần thiết: `.sdd/specs/feat-borrowing-management/{SPEC,PLAN,TASKS}.md`
- Sửa đổi khi cần thiết: `.sdd/specs/feat-reservation-management/{SPEC,PLAN,TASKS}.md`
- Sửa đổi khi cần thiết: `.sdd/specs/feat-notification-management/{SPEC,PLAN,TASKS}.md`
- Sửa đổi khi cần thiết: `.sdd/specs/feat-reporting-statistics/{SPEC,PLAN,TASKS}.md`
- Ôn tập: tất cả các tập tin đã được thay đổi bởi Nhiệm vụ 1-4

- [x] **Bước 1: Chỉ xóa những mâu thuẫn trong hợp đồng đã được xác nhận.**

Căn chỉnh từ ngữ trường hợp cạnh FE07/FE08 cũ với quy tắc hoạt động-`MEMBER`/tài khoản đang hoạt
động đã được phê duyệt, cập nhật các hàng API/theo dõi để xử lý trực tiếp FE08 đã loại bỏ và ghi lại
bằng chứng hồi quy mới mà không thay đổi phạm vi không liên quan.

- [x] **Bước 2: Chạy xác minh tự động.**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
```

Dự kiến: mọi lệnh đều thoát `0`; không có kiểm thử nào bị bỏ qua để che giấu một lỗi xác định.

- [x] **Bước 3: Xem xét tính bảo mật và tuân thủ đặc tả.**

Xác nhận quyền sở hữu vai trò/nguồn, lỗi an toàn, SQL được tham số hóa, không có thay đổi bí
mật/PII, hành vi của nhân viên một lần gửi, điểm cuối chuẩn, phân trang ổn định và khả năng truy vết
trực tiếp theo yêu cầu FE07/08/10/12.

- [x] **Bước 4: Dừng ở H2.**

Trình bày sự khác biệt cục bộ hoàn chỉnh, bằng chứng L1-L4 chính xác, giới hạn kiểm tra SQL nếu có
và các quyết định còn lại. Không cam kết, đẩy, triển khai hoặc hợp nhất mà không có cổng con người
cần thiết.

---

## Biện pháp khắc phục kiểm toán cuối cùng

Quá trình kiểm tra sau H2 đã tìm thấy các lỗ hổng đồng thời và mô hình đọc mà tập kiểm thử đầu tiên
chưa bao quát. Người dùng đã phê duyệt đợt khắc phục này bằng câu “triển khai đi”. Các Nhiệm vụ
6-9 thay thế kết luận đạt trước đó; lô chưa hoàn thành cho đến khi những
nhiệm vụ vượt qua đánh giá H2 mới.

### Nhiệm vụ 6: Làm cho các quyết định tạo, trả sách và gia hạn FE07 trở thành giao dịch

**Tệp:**
- Sửa đổi: `backend/tests/borrowingRepository.test.js`
- Sửa đổi: `backend/tests/borrowingRoutes.test.js`
- Sửa đổi: `backend/tests/fineContract.test.js`
- Sửa đổi: `backend/tests/helpers/inMemoryBorrowingRepositories.js`
- Sửa đổi: `backend/tests/sql/borrowingConcurrency.sqltest.js`
- Sửa đổi: `backend/src/services/borrowingService.js`
- Sửa đổi: `backend/src/repositories/borrowingRepository.js`
- Sửa đổi: `backend/src/utils/libraryBusinessTime.js`

**Giao diện:**
- Tiêu thụ: `businessDateUtcBounds(referenceDate)`,
`createBorrowRequest({ userId, copyIds, requestDate, businessDate, businessDayStartUtc,
businessDayEndUtc, auditLogRepository, auditEntry })`, `approveBorrowRequest({ requestId,
approvedBy, approvalDate, borrowDate, dueDate, businessDayStartUtc, businessDayEndUtc,
auditLogRepository, auditEntry })`, `returnBorrowDetail(...)` và `renewBorrowDetail({
borrowDetailId, userId, hôm nay, newDueDate, auditLogRepository, auditEntry })`.
- Sản xuất: giới hạn UTC `[start, end)` chính xác cho một doanh nghiệp `Asia/Ho_Chi_Minh`
ngày, các giá trị `BorrowDate`/`DueDate` được phê duyệt liên tục bắt nguồn từ ngày kinh doanh đó và
các kết quả lưu trữ với các giá trị `outcome` rõ ràng được lấy theo khóa; tạo thành công trả về `{
kết quả: 'CREATED', borrowRequest }`; gia hạn thành công sẽ trả về `{ kết quả: 'RENEWED',
borrowDetail }`.

- [x] **Bước 1: Viết các kiểm thử giao dịch thất bại và vai trò cũ.**

Thêm các xác nhận thứ tự nguồn chứng minh việc tạo có được khóa ứng dụng thành viên FE07 trước
`Users/UserRoles`, `BookCopies` được sắp xếp, bộ đếm mượn và `Reservations`; trả sách lấy khóa ứng
dụng trong phạm vi yêu cầu trước bất kỳ khóa sao chép nào; gia hạn lấy khóa thành viên FE07 và kiểm
tra lại vai trò `MEMBER` hiện tại, tài khoản đang hoạt động, khoản phạt chưa thanh toán, lượt mượn
quá hạn, chi tiết hiện tại và mức độ ưu tiên đặt chỗ trước `UPDATE` của nó. Thêm các kiểm thử tuyến
đường loại bỏ vai trò thành viên sau khi kiểm thử dịch vụ và mong đợi `403 MEMBER_ROLE_REQUIRED`
được tạo và gia hạn mà không bị thao tác ghi. Thêm kiểm thử ranh giới chứng minh ánh xạ ngày làm việc
tại Việt Nam tới `17:00Z` đến `17:00Z` tiếp theo, cùng với hồi quy yêu cầu/phê duyệt vượt qua nửa
đêm UTC trong khi vẫn duy trì trong một ngày làm việc tại Việt Nam.

- [x] **Bước 2: Chạy kiểm thử tập trung và xác minh RED.**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRepository.test.js tests/borrowingRoutes.test.js
```

Dự kiến: các xác nhận thứ tự khóa/nguồn mới và xác nhận tuyến đường có vai trò cũ không thành công.

- [x] **Bước 3: Thực hiện các quyết định về kho lưu trữ nguyên tử.**

Để tạo, chỉ giải quyết các khóa sao chép ổn định, thu thập `FE07-BORROW-MEMBER-${userId}`, đọc lại
người dùng/vai trò/cấp hiện tại trong `UPDLOCK, HOLDLOCK`, khóa các bản sao được sắp xếp và sau đó
kiểm tra khoản phạt, các hàng mượn quá hạn/đang hoạt động/hàng ngày và các hàng đặt chỗ trước khi
chèn yêu cầu/chi tiết/kiểm tra. Sử dụng khoảng `requestDate` do ứng dụng cung cấp và khoảng UTC
`[businessDayStartUtc, businessDayEndUtc)` để tính số lượng yêu cầu có thẩm quyền. Để phê duyệt, hãy
đếm các hàng chi tiết thông qua `BorrowRequests.ApprovedAt` bằng cách sử dụng cùng khoảng thời gian
UTC, trong khi vẫn giữ nguyên `BorrowDate` là ngày kinh doanh tại Việt Nam và `DueDate` đúng 14 ngày
theo lịch sau đó. Để trả sách, hãy lấy `FE07-RETURN-REQUEST-${requestId}` trước khi khóa bản sao/chi
tiết để hai chi tiết khác nhau của một yêu cầu không thể giữ mỗi chi tiết một và bế tắc khi quét
trên toàn yêu cầu. Để gia hạn, hãy lặp lại tất cả các quyết định về thành viên, chi tiết, khoản
phạt, quá hạn và đặt chỗ trong giao dịch và trả sách một trong:

```js
{ outcome: 'MEMBER_ROLE_REQUIRED' }
{ outcome: 'MEMBER_ACCOUNT_INACTIVE' }
{ outcome: 'BORROW_DETAIL_NOT_BORROWED' }
{ outcome: 'RENEWAL_LIMIT_REACHED' }
{ outcome: 'BORROW_DETAIL_OVERDUE' }
{ outcome: 'UNPAID_FINE_BLOCKS_BORROWING' }
{ outcome: 'OVERDUE_LOAN_BLOCKS_BORROWING' }
{ outcome: 'RESERVATION_BLOCKS_RENEWAL' }
{ outcome: 'RENEWED', borrowDetail }
```

Ánh xạ những kết quả đó tới các lỗi HTTP an toàn hiện có trong dịch vụ. Giữ kiểm tra trước chỉ đọc dưới
dạng phản hồi nhanh; giao dịch có thẩm quyền.

- [x] **Bước 4: Chạy kiểm thử tập trung và xác minh GREEN.**

Lặp lại Bước 2. Dự kiến: tất cả các kiểm thử tuyến đường và kho lưu trữ FE07 đều vượt qua.

---

### Nhiệm vụ 7: Căn chỉnh khóa hàng đợi FE08, vị trí xuất phát và phản hồi của nhân viên

**Tệp:**
- Sửa đổi: `backend/tests/reservationRepository.test.js`
- Sửa đổi: `backend/tests/helpers/inMemoryReservationRepositories.js`
- Sửa đổi: `backend/tests/sql/borrowingConcurrency.sqltest.js`
- Sửa đổi: `backend/src/repositories/reservationRepository.js`
- Sửa đổi: `frontend/test/reservationFrontend.test.js`
- Sửa đổi: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`

**Giao diện:**
- Tiêu thụ: `holdReservation({ reservationId, userId, copyId, notifiedAt, expiresAt })`
  và `reservationApi.processQueue(copyId)`.
- Sản xuất: đơn hàng FE08 chung
`member application lock -> Users/UserRoles -> BookCopies -> Reservations`; kết quả liệt kê/đọc lấy
`queuePosition` từ các hàng `ACTIVE` hiện tại được sắp xếp theo `(ReservedAt, ReservationId)`; trang
chỉ có tên thành viên do máy chủ chọn.

- [x] **Bước 1: Viết các kiểm thử lỗi khóa, vị trí và phản hồi giao diện người dùng.**

Khẳng định `holdReservation` mua lại `FE08-RESERVATION-MEMBER-${userId}` và các hàng thành viên hiện
tại trước khi khóa bản sao của nó. Khẳng định `reservationSelect` sử dụng `COUNT(*)` tương quan trên
`Status = 'ACTIVE'` với bộ ngắt kết nối `(ReservedAt, ReservationId)` thay vì chọn
`r.QueuePosition`. Khẳng định `confirmNotify` lưu trữ phản hồi `processQueue`, phân nhánh trên
`selectedReservation` và không sử dụng `notifyTarget.member` trong thông báo thành công.

- [x] **Bước 2: Chạy kiểm thử tập trung và xác minh RED.**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reservationRepository.test.js
node --test frontend/test/reservationFrontend.test.js
```

Dự kiến: giữ vẫn khóa bản sao trước, vị trí hàng đợi được điều khiển theo trạng thái liên tục và
trang luôn báo cáo mục tiêu phương thức là thành công.

- [x] **Bước 3: Triển khai khóa chuẩn và phản hồi dựa trên phản hồi.**

Sử dụng `userId` được cung cấp để lấy khóa ứng dụng thành viên tương tự được sử dụng để tạo đặt chỗ,
khóa/kiểm tra lại `Users/UserRoles`, sau đó khóa bản sao và đặt chỗ. Chỉ ghi cột `QueuePosition` cũ
để tương thích với lược đồ nhưng không bao giờ coi đó là sự thật trong kinh doanh. Trong trang:

```js
const result = await reservationApi.processQueue(notifyTarget.copyId);
await loadReservations();
if (!result.selectedReservation) {
  showToast('Không có thành viên đủ điều kiện trong hàng chờ.', 'info');
} else {
  const selected = mapReservation(result.selectedReservation);
  showToast(`Đã giữ sách và tạo thông báo cho ${selected.member}.`, 'success');
}
```

- [x] **Bước 4: Chạy kiểm thử tập trung và xác minh GREEN.**

Lặp lại Bước 2. Dự kiến: Kho lưu trữ FE08 đã vượt qua các kiểm thử giao diện người dùng và kho lưu trữ.

---

### Nhiệm vụ 8: Tích lũy các nhóm chưa biết chuẩn hóa FE12

**Tệp:**
- Sửa đổi: `backend/tests/reportRepository.test.js`
- Sửa đổi: `backend/src/repositories/reportRepository.js`

**Giao diện:**
- Tiêu thụ: các hàng SQL được nhóm lại được chuyển đến `toCountMap(...)`.
- Tạo ra: các khóa chuẩn hóa có số lượng được tích lũy, bao gồm một số khóa thô
  tất cả các giá trị được chuẩn hóa thành `UNKNOWN`.

- [x] **Bước 1: Viết kiểm thử tổng hợp không thành công.**

Trả về hai trạng thái người dùng không được hỗ trợ, chẳng hạn như `SUSPENDED = 2` và `DELETED = 3`
từ tập kết quả được nhóm và xác nhận:

```js
expect(report.metrics.usersByStatus.UNKNOWN).toBe(5);
```

- [x] **Bước 2: Chạy kiểm thử tập trung và xác minh RED.**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reportRepository.test.js
```

Dự kiến: `UNKNOWN` chỉ bằng nhóm thô cuối cùng (`3`).

- [x] **Bước 3: Triển khai chuẩn hóa phụ gia.**

Thay thế ngữ nghĩa ghi đè bằng:

```js
counts[key] = (counts[key] || 0) + Number(row[countName] || 0);
```

- [x] **Bước 4: Chạy kiểm thử tập trung và xác minh GREEN.**

Lặp lại Bước 2. Dự kiến: tất cả các kiểm thử kho lưu trữ báo cáo đều vượt qua.

---

### Nhiệm vụ 9: Chạy lại cổng, lấy H2 mới và cập nhật dự thảo PR

**Tệp:**
- Ôn tập: mọi tập tin được thay đổi bởi Nhiệm vụ 6-8
- Cập nhật các hộp kiểm: kế hoạch này

**Giao diện:**
- Tiêu thụ: đã hoàn thành việc khắc phục FE07/FE08/FE12.
- Tạo ra: bằng chứng L1-L4 hiện tại, cam kết được H2 xem xét và bản cập nhật được đẩy lên
  dự thảo PR hiện có; hợp nhất/triển khai vẫn bị chặn cho đến H3.

- [x] **Bước 1: Chạy xác minh tập trung và đầy đủ.**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
```

Chỉ chạy bộ đồng thời SQL có thể thay đổi với cơ sở dữ liệu SQL Server và
`FE07_SQL_TEST_ALLOW_MUTATION=true` dùng một lần rõ ràng; không bao giờ trỏ nó vào Môi trường tiền
sản xuất Azure được
chia sẻ.

- [x] **Bước 2: Thực hiện đánh giá bảo mật và khác biệt.**

Xác nhận tất cả SQL mới vẫn được tham số hóa, tài nguyên khóa chỉ lấy từ ID số nguyên đã xác thực,
kiểm tra vai trò/tài khoản xảy ra phía máy chủ, thông báo lỗi không hiển thị nội bộ, không có thay
đổi lược đồ/phụ thuộc/bí mật/PII nào tồn tại và thư mục `output/audit-librarian-2026-07-22/` không
bị theo dõi vẫn còn nguyên.

- [x] **Bước 3: Nhận đánh giá H2 mới.**

Chạy các đánh giá Tiêu chuẩn và đặc tả độc lập đối với sự khác biệt hoàn toàn có sẵn và bằng chứng
mới. Khắc phục mọi phát hiện hợp lệ và chạy lại các bước kiểm tra bị ảnh hưởng. H2 phải vượt qua
trước khi môi trường tiền sản xuất hoặc cam kết.

- [x] **Bước 4: Cam kết và thúc đẩy phạm vi được xem xét.**

Chỉ thực hiện kế hoạch, tệp sản xuất và kiểm tra hồi quy từ Nhiệm vụ 6-8, cam kết với thông báo
`fix:` trong phạm vi, đẩy nhánh hiện tại và xác minh các bản kiểm tra PR dự thảo hiện có. Không hợp
nhất hoặc triển khai; H3 vẫn được yêu cầu.

---

### Nhiệm vụ 10: Giữ cho vật cố định FE11 phân trang E2E tương thích với các giới hạn FE07

**Tệp:**
- Sửa đổi: `tests/e2e/fe11-admin-request-management.spec.js`
- Sửa đổi: `tests/e2e/support/systemTestServer.js`

**Giao diện:**
- Tiêu thụ: chỉ dùng thử
  `POST /__e2e__/seed-pending-borrow-requests { userId, copyId, count }`.
- Tạo ra: các hàng yêu cầu/chi tiết đang chờ xử lý trong bộ nhớ cho phân trang FE11
bảo hiểm mà không gửi 21 yêu cầu không hợp lệ trong cùng ngày thông qua lệnh FE07 công khai.

- [x] **Bước 1: Tái tạo lỗi CI cục bộ.**

Chạy kịch bản trình duyệt FE11 và xác nhận thiết lập `POST /api/borrow-requests` công khai lặp lại
của nó hiện nhận chính xác `409 BORROW_DAILY_LIMIT_EXCEEDED`.

- [x] **Bước 2: Chuyển khối lượng phân trang sang thiết lập chỉ dành cho kiểm thử.**

Thêm điểm cuối kiểm soát E2E được giới hạn để xác thực người dùng hiện có và sao chép, sau đó chỉ
tạo các trường yêu cầu/chi tiết mà mô hình đọc quản trị viên FE11 sử dụng. Giữ tất cả các tuyến sản
xuất và bất biến hàng ngày của FE07 không thay đổi.

- [x] **Bước 3: Xác minh bộ trình duyệt tập trung và đầy đủ.**

Kịch bản FE11 tập trung phải đạt 1/1 và bộ Chrome hoàn chỉnh phải đạt 4/4.

- [x] **Bước 4: Lấy H2 mới, cam kết, đẩy và kiểm tra lại CI.**

Xem lại ba tệp khác biệt tiếp theo một cách độc lập cho Tiêu chuẩn và đặc tả, chỉ cam kết sau khi H2
vượt qua, đẩy nhánh PR Dự thảo tương tự và chờ chạy `foundation-checks` thay thế. Không hợp nhất
hoặc triển khai mà không có H3.

---

## Biện pháp khắc phục xác minh cuối cùng

Người dùng đã phê duyệt thiết kế FE10 `PROCESSING` bền bỉ vào ngày 23-07-2026. Nhiệm vụ 11-15 thực
hiện các phát hiện được ghi trong
`docs/superpowers/specs/2026-07-23-fe07-fe08-fe10-fe12-final-verification-remediation-design.md`.

### Nhiệm vụ 11: Làm cho quá trình chuyển đổi phân phối và liên kết nguồn FE10 trở nên xác định

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-notification-management/{SPEC,PLAN,TASKS,CHANGELOG}.md`
- Sửa đổi: `.sdd/rfcs/ADR-002-database-design.md`
- Sửa đổi: `database/Librarymanagement.sql`
- Tạo: `database/migrations/2026-07-23-fe10-processing-status.sql`
- Sửa đổi: `backend/src/models/Notification.js`
- Sửa đổi: `backend/src/services/notificationService.js`
- Sửa đổi: `backend/src/repositories/notificationRepository.js`
- Sửa đổi: `backend/tests/notificationRoutes.test.js`
- Sửa đổi: `backend/tests/notificationRepository.test.js`

- [x] Viết các kiểm thử RED để tìm các tài liệu tham khảo nguồn nội bộ bị thiếu, nhạy cảm
lỗi chuyển đổi, phát lại trùng lặp trong khi `PROCESSING` và lỗi xác nhận/Khóa sổ của hai công nhân.
- [x] Thêm `PROCESSING` vào vòng đời đặc tả/lược đồ đã được xem xét.
- [x] Cam kết các yêu cầu trước I/O của nhà cung cấp và bảo vệ quá trình chuyển đổi thiết bị đầu cuối từ
  `PROCESSING`.
- [x] Giữ các hàng không chắc chắn `PROCESSING`, loại trừ chúng khỏi thử lại tự động và
  trả sách `DELIVERY_STATE_UNCERTAIN` an toàn để thử lại theo cách thủ công.
- [x] Chạy các kiểm thử FE10 tập trung và di chuyển tạm thời hai lần trên thiết bị dùng một lần
  cơ sở dữ liệu.

### Nhiệm vụ 12: Thực hiện kiểm tra vòng đời FE08 theo phản hồi nguyên tử và nhân viên một cách trung thực

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-reservation-management/{SPEC,PLAN,TASKS,CHANGELOG}.md`
- Sửa đổi: `backend/src/services/reservationService.js`
- Sửa đổi: `backend/src/repositories/reservationRepository.js`
- Sửa đổi: `backend/tests/reservationRoutes.test.js`
- Sửa đổi: `backend/tests/reservationService.test.js`
- Sửa đổi: `backend/tests/reservationRepository.test.js`
- Sửa đổi: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`
- Sửa đổi: `frontend/test/reservationFrontend.test.js`

- [x] Viết các kiểm thử khôi phục RED để phát hiện các lỗi kiểm tra tạo/hủy/giữ/hết hạn và
  kiểm tra cảnh báo kiểm tra thông báo sau cam kết.
- [x] Chèn các mục kiểm tra vòng đời bên trong các giao dịch thao tác ghi của chúng.
- [x] Duy trì cam kết giữ lại lỗi thông báo trong khi hiển thị một bảng an toàn
  cảnh báo nếu không thể tiếp tục kiểm tra lỗi theo yêu cầu.
- [x] Xóa tên thành viên được lưu trong bộ nhớ cache khỏi hộp thoại xác nhận trước.
- [x] Chạy các kiểm thử FE08 backend/frontend tập trung.

### Nhiệm vụ 13: Chỉnh sửa thời gian kinh doanh của FE07, tăng gấp đôi và kỳ vọng của SQL

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-borrowing-management/{SPEC,TASKS,CHANGELOG}.md`
- Sửa đổi: `backend/src/services/borrowingService.js`
- Sửa đổi: `backend/tests/borrowingRoutes.test.js`
- Sửa đổi: `backend/tests/helpers/inMemoryBorrowingRepositories.js`
- Sửa đổi: `backend/tests/sql/borrowingConcurrency.sqltest.js`

- [x] Viết RED Việt Nam vào lúc nửa đêm và kiểm tra xung đột sao chép trong bộ nhớ.
- [x] Sử dụng công cụ trợ giúp thời gian kinh doanh FE07 được chia sẻ để trả sách và gia hạn.
- [x] Căn chỉnh kho lưu trữ trong bộ nhớ với các bước kiểm tra trạng thái sao chép sản xuất.
- [x] Thay thế các kỳ vọng SQL cũ bằng khả năng đủ điều kiện dựa trên vai trò và rõ ràng
  kết quả xung đột.
- [x] Chạy kiểm thử đơn vị FE07 tập trung và SQL dùng một lần.

### Nhiệm vụ 14: Khôi phục tính chẵn lẻ và truy vết của FE12

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/{SPEC,TASKS,CHANGELOG}.md`
- Sửa đổi: `backend/tests/helpers/inMemoryReportRepositories.js`
- Sửa đổi: `backend/tests/reportInMemoryParity.test.js`

- [x] Viết các kiểm thử tính chẵn lẻ RED cho `q`, các phê duyệt lịch sử không hoạt động và ổn định
  người dùng đặt hàng.
- [x] Khớp ngữ nghĩa của báo cáo SQL sản xuất trong kho lưu trữ trong bộ nhớ.
- [x] Thêm BR-FE12-016, FR-FE12-011 và AC-FE12-011 vào truy vết và cập nhật
  tổng cộng là `16/11/11`.
- [x] Chạy các kiểm thử FE12 tập trung và thực thi truy vết.

### Nhiệm vụ 15: Hoàn thành xác minh L1-L4 và H2

- [x] Chạy tất cả các kiểm thử tập trung từ Nhiệm vụ 11-14.
- [x] Chạy kiểm thử backend/frontend đầy đủ, kiểm tra mã, bản dựng, E2E, tiện ích triển khai,
  truy vết và vệ sinh khác nhau.
- [x] Chỉ chạy các bộ SQL có thể thay đổi trên cơ sở dữ liệu cục bộ dùng một lần được đặt tên và
  loại bỏ chúng sau đó.
- [x] Thực hiện đánh giá bảo mật, tiêu chuẩn và đặc tả cuối cùng đối với toàn bộ sự khác biệt.
- [x] H2 và phụ lục H2 đã phê duyệt các cam kết được rà soát; PR #62 CI đã được thông qua,
Giai đoạn Azure đã nhận được quá trình di chuyển và triển khai sản phẩm FE10 đã được đánh giá, đồng
thời đánh giá H3 đầu tiên đã trả sách các phát hiện giới hạn được đề cập bên dưới.

---

## Cách khắc phục H3

Người dùng đã phê duyệt phụ lục khắc phục H3 trong
`docs/superpowers/specs/2026-07-23-fe07-fe08-fe10-fe12-final-verification-remediation-design.md` vào
ngày 23-07-2026. Nhiệm vụ 16-19 chỉ sửa những phát hiện H3 đầu tiên. Những thay đổi về bằng chứng và
triển khai đã tạo vẫn chưa được cam kết cho đến khi có bản đánh giá H2 mới.

### Nhiệm vụ 16: Bảo quản cảnh báo hết hạn khuyến mãi FE08

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-reservation-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/CHANGELOG.md`
- Sửa đổi: `backend/src/docs/openapi.yaml`
- Sửa đổi: `backend/src/services/reservationService.js`
- Sửa đổi: `backend/tests/reservationService.test.js`
- Sửa đổi: `backend/tests/reservationRoutes.test.js`

**Giao diện:**
- Tiêu thụ: nội bộ không thể đếm được
  `processedReservation.notificationWarning` được sản xuất bởi `holdReservation`.
- Bảo tồn: phản hồi `processQueue`
  `{ selectedReservation, notificationWarning? }`.
- Tạo ra: phản hồi `expireHolds`
  `{ expiredCount, expired, promoted, notificationWarnings? }`.
- Mỗi mục `notificationWarnings` đều chính xác
  `{ reservationId, copyId, code, message }`; DTO `promoted` không thay đổi.

- [x] **Bước 1: Thêm hồi quy dịch vụ bị lỗi cho cảnh báo bị mất.**

Mở rộng phạm vi hết hạn `FR-FE08-019`/`FR-FE08-021` hiện có trong
`backend/tests/reservationService.test.js`. Sắp xếp một lần giữ đã hết hạn, một lần đặt chỗ đủ điều
kiện tiếp theo, một người yêu cầu FE10 không thành công và một lần ghi kiểm tra
`RESERVATION_NOTIFY_FAILED` không thành công. Khẳng định rằng chương trình khuyến mãi đã cam kết vẫn
tồn tại và cảnh báo được trả sách riêng biệt:

```js
await expect(service.expireHolds(LIBRARIAN, {})).resolves.toEqual({
  expiredCount: 1,
  expired,
  promoted: [heldReservation],
  notificationWarnings: [{
    reservationId: heldReservation.reservationId,
    copyId: heldReservation.copyId,
    code: 'RESERVATION_NOTIFY_AUDIT_FAILED',
    message: 'The reservation hold was created, but notification failure auditing was unavailable.',
  }],
});
expect(Object.keys(heldReservation)).not.toContain('notificationWarning');
```

Chạy:

```powershell
$env:TZ = 'UTC'
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reservationService.test.js
```

Dự kiến: xác nhận mới không thành công vì `expireHolds` hiện chỉ trả về `expiredCount`, `expired` và
`promoted`.

- [x] **Bước 2: Thêm hồi quy tuần tự hóa tuyến đường bị lỗi.**

Trong `backend/tests/reservationRoutes.test.js`, tạo hai bản đặt chỗ cho một bản sao. Để thông báo
hàng đợi đầu tiên thành công, sau đó thực hiện cuộc gọi thứ hai của người yêu cầu không thành công
khi hết hạn thăng cấp thành viên tiếp theo. Chỉ ghi lỗi kiểm tra thất bại phù hợp. Khẳng định:

```js
expect(expireResponse.status).toBe(200);
expect(expireResponse.body.promoted).toHaveLength(1);
expect(expireResponse.body.notificationWarnings).toEqual([{
  reservationId: expireResponse.body.promoted[0].reservationId,
  copyId: 1,
  code: 'RESERVATION_NOTIFY_AUDIT_FAILED',
  message: 'The reservation hold was created, but notification failure auditing was unavailable.',
}]);
expect(JSON.stringify(expireResponse.body)).not.toContain('provider unavailable');
expect(JSON.stringify(expireResponse.body)).not.toContain('audit unavailable');
expect(JSON.stringify(expireResponse.body)).not.toContain('hold.second@example.test');
```

Chạy:

```powershell
$env:TZ = 'UTC'
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reservationRoutes.test.js
```

Dự kiến: nội dung tuyến đường không có trường `notificationWarnings` trước khi sửa lỗi dịch vụ.

- [x] **Bước 3: Thu thập cảnh báo an toàn mà không thay đổi DTO được quảng cáo.**

Trong `expireHolds`, tích lũy siêu dữ liệu cảnh báo trong khi vẫn có thể truy cập được thuộc tính
không thể đếm được bên trong:

```js
const promoted = [];
const notificationWarnings = [];

for (const item of expired) {
  const held = await processNextEligibleReservation(item.copyId, actor, context);
  if (held) {
    promoted.push(held);
    if (held.notificationWarning) {
      notificationWarnings.push({
        reservationId: held.reservationId,
        copyId: held.copyId,
        code: held.notificationWarning.code,
        message: held.notificationWarning.message,
      });
    }
  }
}

const result = { expiredCount: expired.length, expired, promoted };
if (notificationWarnings.length > 0) {
  result.notificationWarnings = notificationWarnings;
}
return result;
```

Không đặt `notificationWarning` ở chế độ có thể đếm được và không thêm dữ liệu người nhận, thành
viên, nhà cung cấp, nội dung được hiển thị hoặc bộ công nghệ.

- [x] **Bước 4: Cập nhật hợp đồng FE08 đã được phê duyệt và truy vết.**

Cập nhật `FR-FE08-021`, hàng bảng API hết hạn, kế hoạch triển khai, nhiệm vụ `FE08-T040` và nhật ký
thay đổi để phân biệt `processQueue.notificationWarning` số ít với
`expireHolds.notificationWarnings[]` tùy chọn. Trong `backend/src/docs/openapi.yaml`, ghi lại phản
hồi `200` với `expiredCount`, `expired` và `promoted` được yêu cầu, cùng với các mục cảnh báo tùy
chọn có:

```yaml
type: object
additionalProperties: false
required: [reservationId, copyId, code, message]
properties:
  reservationId: { type: integer }
  copyId: { type: integer }
  code:
    type: string
    enum: [RESERVATION_NOTIFY_AUDIT_FAILED]
  message: { type: string }
```

- [x] **Bước 5: Chạy lát FE08 tập trung hoàn chỉnh.**

```powershell
$env:TZ = 'UTC'
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reservationService.test.js tests/reservationRoutes.test.js tests/reservationRepository.test.js
npm.cmd --prefix frontend test -- --runInBand test/reservationFrontend.test.js
```

Dự kiến: tất cả các kiểm thử dịch vụ, tuyến đường, kho lưu trữ và giao diện người dùng FE08 tập
trung đều vượt qua.

### Nhiệm vụ 17: So khớp tìm kiếm trong bộ nhớ FE12 với SQL `LIKE`

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/CHANGELOG.md`
- Sửa đổi: `backend/tests/helpers/inMemoryReportRepositories.js`
- Sửa đổi: `backend/tests/reportInMemoryParity.test.js`

**Giao diện:**
- Bảo tồn: liên kết tham số `reportRepository` sản xuất
  `Search = %${filters.q}%` và tất cả các DTO yêu cầu/phản hồi FE12 công khai.
- Tạo ra: tính chẵn lẻ phù hợp chỉ kiểm thử cho `%`, `_`, `[x-y]`, `[^x-y]` và
các ký tự chữ thông thường chỉ trên ID người dùng, trạng thái tài khoản, trạng thái thành viên và tên vai trò.

- [x] **Bước 1: Thêm các trường hợp chẵn lẻ ký tự đại diện RED.**

Mở rộng `backend/tests/reportInMemoryParity.test.js` với các trường hợp khác với `String.includes`
theo nghĩa đen:

```js
test.each([
  ['%MEMBER%', [3, 4]],
  ['L_BRARIAN', [2, 4]],
  ['[1-2]', [1, 2]],
  ['[^A-Z0-9]', []],
])('user q preserves SQL LIKE semantics for %s', async (q, expectedUserIds) => {
  const report = await makeReportRepository().getUserStatistics({ q });
  expect(report.rows.map((row) => row.userId)).toEqual(expectedUserIds);
});
```

Giữ lại trường hợp `inactive` hiện có và thêm một xác nhận bằng chữ hỗn hợp để tìm kiếm thông thường
không phân biệt chữ hoa chữ thường vẫn được bảo vệ.

Chạy:

```powershell
$env:TZ = 'UTC'
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reportInMemoryParity.test.js
```

Dự kiến: `%MEMBER%`, `L_BRARIAN` và `[1-2]` không thành công khi triển khai `includes` theo nghĩa
đen hiện tại.

- [x] **Bước 2: Thêm trình biên dịch SQL-LIKE-to-RegExp nhỏ trong trình trợ giúp kiểm tra.**

Thêm người trợ giúp riêng gần các chức năng chuẩn hóa hiện có trong
`backend/tests/helpers/inMemoryReportRepositories.js`:

```js
function escapeRegexLiteral(character) {
  return character.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

function sqlLikePatternToRegExp(pattern) {
  let source = '^';

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === '%') {
      source += '.*';
    } else if (character === '_') {
      source += '.';
    } else if (character === '[') {
      const closingIndex = pattern.indexOf(']', index + 1);
      const negated = pattern[index + 1] === '^';
      const contentStart = index + (negated ? 2 : 1);
      if (closingIndex > contentStart) {
        const classBody = pattern
          .slice(contentStart, closingIndex)
          .replace(/\\/g, '\\\\')
          .replace(/\^/g, '\\^');
        source += `[${negated ? '^' : ''}${classBody}]`;
        index = closingIndex;
      } else {
        source += '\\[';
      }
    } else {
      source += escapeRegexLiteral(character);
    }
  }

  return new RegExp(`${source}$`, 'iu');
}

function matchesSqlLike(value, query) {
  const pattern = `%${String(query).trim()}%`;
  return sqlLikePatternToRegExp(pattern).test(String(value ?? ''));
}
```

Giữ `-` không thoát bên trong lớp khung hợp lệ để phạm vi hoạt động. Hãy coi `[` không được
đóng/trống như một nghĩa đen. Không thay đổi sản xuất SQL hoặc giới thiệu một phần phụ thuộc.

- [x] **Bước 3: Chỉ thay thế so sánh nguyên văn trong báo cáo của người dùng.**

Sử dụng trình trợ giúp trên danh sách giá trị được phê duyệt hiện có:

```js
if (filters.q) {
  const searchableValues = [
    user.userId,
    user.status,
    memberStatus,
    ...roles,
  ];
  if (!searchableValues.some((value) => matchesSqlLike(value, filters.q))) {
    return [];
  }
}
```

Không thêm tên người dùng, email hoặc các trường khác vào tìm kiếm báo cáo người dùng FE12.

- [x] **Bước 4: Ghi lại quy tắc chẵn lẻ chính xác trong tài liệu FE12.**

Sửa đổi `BR-FE12-016` và nhiệm vụ `FE12-N10` để nêu rõ rằng quá trình sản xuất giữ nguyên ngữ nghĩa
SQL `LIKE` được tham số hóa và kho lưu trữ trong bộ nhớ mô phỏng hành vi ký tự đại diện tương tự cho
các trường được phê duyệt. Thêm dấu đầu dòng nhật ký thay đổi mô tả việc sửa lỗi chẵn lẻ kiểm thử mà
không yêu cầu thay đổi API sản xuất.

- [x] **Bước 5: Chạy kiểm thử hợp đồng kho lưu trữ và FE12 tập trung.**

```powershell
$env:TZ = 'UTC'
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reportInMemoryParity.test.js tests/reportRoutes.test.js tests/reportRepository.test.js
```

Dự kiến: tất cả các kiểm thử tính chẵn lẻ, tuyến đường và hợp đồng nguồn FE12 đều vượt qua.

### Nhiệm vụ 18: Sửa Azure và bằng chứng quản trị

**Tệp:**
- Sửa đổi: `docs/deployment/azure-staging-guide.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/TASKS.md`
- Sửa đổi: `docs/superpowers/plans/2026-07-23-fe07-fe08-fe10-fe12-business-rule-remediation.md`
- Tạo: `.sdd/reviews/fe07-fe08-fe10-fe12-h3-remediation-validation-2026-07-23.md`

**Giao diện:**
- Bảo tồn: quá trình di chuyển và triển khai Azure đã được xem xét.
- Tạo ra: quy trình ổn định cục bộ/phân giai đoạn một lần an toàn cho người vận hành, chỉ đọc
  bằng chứng ràng buộc và trạng thái H2/H3 trung thực.

- [x] **Bước 1: Di chuyển bằng chứng idempotence ra khỏi giai đoạn chia sẻ.**

Thay thế lệnh hiện tại để thực hiện chuỗi di chuyển hai lần trong giai đoạn bằng ranh giới này:

1. Chạy mỗi lần di chuyển ứng viên hai lần trên SQL Server cục bộ dùng một lần có tên
   cơ sở dữ liệu và xóa cơ sở dữ liệu đó sau khi chứng minh.
2. Xem lại chính xác SQL và cơ sở dữ liệu đích.
3. Thực hiện trình tự đã được phê duyệt một lần trên `LibraryManagementStaging`.
4. Chạy các truy vấn đích/lược đồ/ràng buộc chỉ đọc.
5. Loại bỏ quy tắc tường lửa tạm thời chính xác ngay lập tức.

Không hướng dẫn người vận hành sử dụng giai đoạn cho các kiểm thử bình thường có thể thay đổi.

- [x] **Bước 2: Thêm kiểm tra ràng buộc FE10 chỉ đọc.**

Mở rộng truy vấn xác minh hiện có của hướng dẫn:

```sql
CASE WHEN EXISTS (
  SELECT 1
  FROM sys.check_constraints
  WHERE parent_object_id = OBJECT_ID(N'dbo.Notifications')
    AND name = N'CK_Notifications_Status'
    AND definition LIKE N'%PROCESSING%'
) THEN 1 ELSE 0 END AS NotificationProcessingAllowed
```

Dự kiến: `DatabaseName = LibraryManagementStaging`, `TableCount = 20`, mỗi độ dài cột đối
chiếu/phiên bản hàng được liệt kê là `8` và `NotificationProcessingAllowed = 1`.

- [x] **Bước 3: Sửa các câu lệnh cổng tác vụ cũ.**

Đối với `FE07-T046`, `FE08-T040`, `FE10-S10` và `FE12-N10`, hãy ghi:

- phụ lục H2 ban đầu và phụ lục H2 đã được thông qua;
- cam kết thực hiện `97aca62` và PR CI chạy `30014066260` đã được thông qua;
- đánh giá H3 đầu tiên đã tìm thấy các mục phụ lục có giới hạn;
- biện pháp khắc phục này yêu cầu H2 mới, PR CI cập nhật và H3 lặp lại;
- chưa có chức năng nào có thể yêu cầu hoàn thành hợp nhất/sau hợp nhất.

Không viết lại hồ sơ hoàn thành Giai đoạn 2 lịch sử.

- [x] **Bước 4: Tạo bản ghi xác nhận biện pháp khắc phục.**

Ghi lại bằng chứng nhánh/PR/SHA chính xác, lệnh/kết quả RED và GREEN, ranh giới hợp đồng đã thay
đổi, bằng chứng Azure hiện tại, `origin/main` mới nhất, đánh giá bảo mật và khác biệt cũng như các
cổng H2/H3 còn lại. Phát biểu rằng:

- quá trình di chuyển FE10 đã được chứng minh hai lần tại địa phương và được áp dụng một lần cho
  môi trường tiền sản xuất;
- sản phẩm dàn SHA `9b02c7e` được triển khai bằng `30012925318`;
- việc khắc phục này không yêu cầu thực hiện lại quá trình di chuyển;
- Việc chấp nhận môi trường tiền sản xuất sau hợp nhất là lược đồ chỉ đọc cộng với kiểm thử nhanh ứng dụng.

Không sử dụng thông tin xác thực, chuỗi kết nối, dữ liệu thành viên hoặc giá trị IP tường lửa.

- [x] **Bước 5: Xác minh tài liệu triển khai và vệ sinh khác biệt.**

```powershell
npm.cmd run test:deployment
rg -n "second time|twice|H2 review remains pending|H2 remains before" docs/deployment/azure-staging-guide.md .sdd/specs/feat-borrowing-management/TASKS.md .sdd/specs/feat-reservation-management/TASKS.md .sdd/specs/feat-notification-management/TASKS.md .sdd/specs/feat-reporting-statistics/TASKS.md
git diff --check
```

Dự kiến: vượt qua các kiểm thử tiện ích triển khai; mọi tham chiếu `twice` còn lại chỉ trỏ đến cơ sở
dữ liệu cục bộ dùng một lần có tên; không có cụm từ H2 đang chờ xử lý theo lô hiện tại cũ; kiểm tra
khác biệt là sạch sẽ.

### Nhiệm vụ 19: Xác minh lại, lấy H2 và chuẩn bị H3 lặp lại

**Tệp:**
- Sửa đổi: `.sdd/reviews/fe07-fe08-fe10-fe12-h3-remediation-validation-2026-07-23.md`
- Chỉ kiểm tra: tất cả các tệp đã thay đổi liên quan đến `97aca62`

**Giao diện:**
- Tiêu thụ: Nhiệm vụ 16-18 và `origin/main` mới nhất.
- Tạo ra: một cam kết mới được H2 xem xét và cập nhật PR #62 với dòng điện đã qua
kiểm tra hợp nhất-ref. Triển khai hợp nhất và sau hợp nhất vẫn bị chặn trên H3 lặp lại.

- [x] **Bước 1: Chạy kiểm tra tập trung và truy vết.**

```powershell
$env:TZ = 'UTC'
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reservationService.test.js tests/reservationRoutes.test.js tests/reservationRepository.test.js
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reportInMemoryParity.test.js tests/reportRoutes.test.js tests/reportRepository.test.js
npm.cmd --prefix frontend test -- --runInBand test/reservationFrontend.test.js
npm.cmd run test:deployment
npm.cmd run trace:enforce
git diff --check
```

Dự kiến: mọi lệnh đều thoát khỏi `0`.

- [x] **Bước 2: Chạy bộ L1-L4 tương đương với kho lưu trữ.**

```powershell
$env:TZ = 'UTC'
npm.cmd audit --audit-level=high
npm.cmd --prefix backend audit --audit-level=high
npm.cmd --prefix frontend audit --audit-level=high
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:integration:system
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
npm.cmd run test:deployment
node -e "const app = require('./backend/src/index'); if (!app || typeof app.listen !== 'function') throw new Error('Express app export is invalid');"
```

Dự kiến: tất cả các cuộc kiểm tra và kiểm tra tự động đều thoát khỏi `0`; phạm vi bảo hiểm máy chủ
vẫn ở mức hoặc cao hơn ngưỡng kho lưu trữ; Crom E2E đạt đầy đủ.

- [x] **Bước 3: Xem xét tính bảo mật, phạm vi và khả năng tương thích chính mới nhất.**

```powershell
git fetch origin main
git status --short
git diff --stat 97aca62
git diff --check 97aca62
git diff --name-only 97aca62
git merge-tree --write-tree origin/main 97aca62
git diff -- backend/src/services/reservationService.js backend/tests/helpers/inMemoryReportRepositories.js backend/src/docs/openapi.yaml docs/deployment/azure-staging-guide.md
```

Xác nhận quá trình hợp nhất ảo đã sạch, tất cả SQL vẫn được tham số hóa, các cảnh báo là PII/nhà
cung cấp-safe, không có sự mở rộng quyền/lược đồ/phụ thuộc nào tồn tại và thư mục
`output/audit-librarian-2026-07-22/` do người dùng sở hữu vẫn không bị theo dõi và không bị ảnh
hưởng. Kiểm tra lại mọi phần `backend/src/docs/openapi.yaml` dựa trên thay đổi FE11 mới nhất trên
`origin/main`.

- [x] **Bước 4: Dừng H2 mới trước khi môi trường tiền sản xuất hoặc cam kết.**

Trình bày toàn bộ khác biệt có sẵn và bản ghi xác thực để đánh giá Tiêu chuẩn và đặc tả độc lập.
Khắc phục mọi phát hiện hợp lệ và chạy lại các kiểm tra bị ảnh hưởng. Không thực hiện giai đoạn, cam
kết, đẩy, chạy Azure SQL có thể thay đổi, triển khai lại hoặc hợp nhất trước khi phê duyệt H2 rõ
ràng.

- [x] **Bước 5: Sau H2, chỉ phân đoạn phạm vi được xem xét và đẩy PR #62.**

```powershell
git add -- `
  .sdd/specs/feat-borrowing-management/TASKS.md `
  .sdd/specs/feat-reservation-management/SPEC.md `
  .sdd/specs/feat-reservation-management/PLAN.md `
  .sdd/specs/feat-reservation-management/TASKS.md `
  .sdd/specs/feat-reservation-management/CHANGELOG.md `
  .sdd/specs/feat-notification-management/TASKS.md `
  .sdd/specs/feat-reporting-statistics/SPEC.md `
  .sdd/specs/feat-reporting-statistics/TASKS.md `
  .sdd/specs/feat-reporting-statistics/CHANGELOG.md `
  .sdd/reviews/fe07-fe08-fe10-fe12-h3-remediation-validation-2026-07-23.md `
  backend/src/docs/openapi.yaml `
  backend/src/services/reservationService.js `
  backend/tests/reservationService.test.js `
  backend/tests/reservationRoutes.test.js `
  backend/tests/helpers/inMemoryReportRepositories.js `
  backend/tests/reportInMemoryParity.test.js `
  docs/deployment/azure-staging-guide.md `
  docs/superpowers/specs/2026-07-23-fe07-fe08-fe10-fe12-final-verification-remediation-design.md `
  docs/superpowers/plans/2026-07-23-fe07-fe08-fe10-fe12-business-rule-remediation.md
git diff --cached --check
git status --short
git commit -m "fix: close FE08 and FE12 H3 findings"
git push origin HEAD
```

Dự kiến: chỉ các tệp được xem xét mới được sắp xếp; `output/` không có trong chỉ mục; cam kết và đẩy
thành công trên `codex/fe07-fe08-fe10-fe12-business-rules`.

- [x] **Bước 6: Yêu cầu kiểm tra PR hiện tại và dừng đối với H3 lặp lại.**

```powershell
gh pr checks 62 --watch
gh pr ready 62
gh pr view 62 --json headRefOid,baseRefOid,isDraft,mergeable,mergeStateStatus,statusCheckRollup,url
```

Dự kiến: các bước kiểm tra bắt buộc phải vượt qua đối với phần đầu mới và tham chiếu hợp nhất `main`
hiện tại, PR đã sẵn sàng và GitHub báo cáo rằng nó có thể hợp nhất. Lặp lại Tiêu chuẩn và Thông số
H3 trên mức chênh lệch PR chính xác. Dừng để phê duyệt H3 rõ ràng; không hợp nhất trên kết quả CI cũ
hoặc nếu `main` di chuyển không tương thích.

- [ ] **Bước 7: Chỉ hợp nhất và xác minh Môi trường tiền sản xuất Azure sau khi phê duyệt H3 nhiều lần.**

Sau khi phê duyệt H3 rõ ràng, hãy hợp nhất PR #62 bằng phương pháp hợp nhất thông thường của kho lưu
trữ, đợi CI `main` sau hợp nhất chính xác và triển khai Môi trường tiền sản xuất Azure tự động, sau
đó chạy bộ kiểm thử nhanh môi
trường tiền sản xuất chỉ đọc hiện có và truy vấn lược đồ/ràng buộc chỉ đọc từ Nhiệm vụ 18. Không
phát lại quá trình di chuyển FE10 trừ khi kiểm tra chỉ đọc chứng minh ràng buộc được xem xét không
có và một nhà điều hành mới xem xét rõ ràng cho phép sửa chữa riêng biệt đó.

### Nhiệm vụ 20: Kết thúc các phát hiện về tính đầy đủ của H3 lặp đi lặp lại

**Tệp:**
- Sửa đổi: `backend/tests/reportInMemoryParity.test.js`
- Sửa đổi: `backend/tests/helpers/inMemoryReportRepositories.js`
- Sửa đổi: `backend/tests/reservationService.test.js`
- Sửa đổi: `backend/tests/reservationRoutes.test.js`
- Sửa đổi: `backend/src/docs/openapi.yaml`
- Sửa đổi: `.sdd/reviews/fe07-fe08-fe10-fe12-h3-remediation-validation-2026-07-23.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/TASKS.md`
- Sửa đổi: `docs/superpowers/specs/2026-07-23-fe07-fe08-fe10-fe12-final-verification-remediation-design.md`
- Sửa đổi: `docs/superpowers/plans/2026-07-23-fe07-fe08-fe10-fe12-business-rule-remediation.md`

**Giao diện:**
- Tiêu thụ: Đầu được đánh giá H2
`b931e005e50dc9c0ec9c177f2874f88a1df943b0`, CI chạy `30019439505` và các báo cáo Tiêu chuẩn/đặc tả H3 lặp lại.
- Bảo tồn: FE12 SQL được tham số hóa sản xuất, các trường báo cáo được phê duyệt,
FE08 DTO phản hồi dịch vụ, vai trò/quyền, lược đồ cơ sở dữ liệu, các phần phụ thuộc, trạng thái chạy
thử của Azure và thư mục `output/` do người dùng sở hữu.
- Tạo ra: chẵn lẻ SQL `LIKE` khung đóng, hồi quy FE08 đa cảnh báo
bằng chứng, hợp đồng OpenAPI cảnh báo hoàn chỉnh và bằng chứng quản trị hiện tại. Tất cả các thay
đổi vẫn có sẵn cho đến khi có H2 mới.

- [x] **Bước 1: Thêm các trường hợp chẵn lẻ khung đóng RED SQL `LIKE`.**

Cho phép nhà máy kiểm thử-cục bộ ghi đè các giá trị vai trò mà không thay đổi lịch thi đấu mặc định:

```js
function makeReportRepository({ borrowDetails, roleOverrides = [] } = {}) {
  const rolesByUserId = new Map([
    [1, ['ADMIN']],
    [2, ['LIBRARIAN']],
    [3, ['MEMBER']],
    [4, ['LIBRARIAN', 'MEMBER']],
  ]);
  for (const [userId, roles] of roleOverrides) {
    rolesByUserId.set(userId, roles);
  }

  const authState = {
    users: [
      { userId: 4, status: 'LOCKED' },
      { userId: 1, status: 'ACTIVE' },
      { userId: 3, status: 'ACTIVE' },
      { userId: 2, status: 'INACTIVE' },
    ],
    rolesByUserId,
  };
}
```

Mở rộng ma trận ký tự đại diện và thêm trường hợp thành viên khung phải dương:

```js
test.each([
  ['%MEMBER%', [3, 4]],
  ['L_BRARIAN', [2, 4]],
  ['[1-2]', [1, 2]],
  ['[^A-Z0-9]', []],
  ['[^]]', [1, 2, 3, 4]],
])('user q preserves SQL LIKE semantics for %s', async (q, expectedUserIds) => {
  const report = await makeReportRepository().getUserStatistics({ q });
  expect(report.rows.map((row) => row.userId)).toEqual(expectedUserIds);
});

test('user q treats a leading closing bracket as a SQL LIKE class member', async () => {
  const report = await makeReportRepository({
    roleOverrides: [[4, ['LIBRARIAN', 'MEMBER', ']']]],
  }).getUserStatistics({ q: '[]]' });

  expect(report.rows.map((row) => row.userId)).toEqual([4]);
});
```

Chạy:

```powershell
$env:TZ = 'UTC'
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reportInMemoryParity.test.js
```

Dự kiến: chính xác các trường hợp `[^]]` và `[]]` mới không thành công so với trình phân tích cú
pháp `]` đầu tiên hiện tại; 18 trường hợp hiện có vẫn còn xanh.

- [x] **Bước 2: Thực hiện chỉnh sửa trình biên dịch lớp khung nhỏ nhất.**

Trong `sqlLikePatternToRegExp`, coi dấu ngoặc phải ở vị trí thành viên lớp đầu tiên là nội dung, tìm
dấu kết thúc sau và thoát khỏi thành viên đó cho biểu thức chính quy JavaScript:

```js
const negated = pattern[index + 1] === '^';
const contentStart = index + (negated ? 2 : 1);
const closingSearchStart =
  pattern[contentStart] === ']' ? contentStart + 1 : contentStart;
const closingIndex = pattern.indexOf(']', closingSearchStart);

if (closingIndex > contentStart) {
  const classBody = pattern
    .slice(contentStart, closingIndex)
    .replace(/\\/g, '\\\\')
    .replace(/\]/g, '\\]')
    .replace(/\^/g, '\\^');
  source += `[${negated ? '^' : ''}${classBody}]`;
  index = closingIndex;
} else {
  source += '\\[';
}
```

Giữ `-` không thoát để phạm vi SQL vẫn giữ nguyên phạm vi. Giữ dự phòng theo nghĩa đen hiện có cho
các lớp trống hoặc không được tiết lộ. Không thay đổi
`backend/src/repositories/reportRepository.js`.

Chạy:

```powershell
$env:TZ = 'UTC'
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reportInMemoryParity.test.js tests/reportRoutes.test.js tests/reportRepository.test.js
```

Dự kiến: 3 bộ kiểm thử; tệp chẵn lẻ có 20 kiểm thử đạt và không có lỗi nào.

- [x] **Bước 3: Chứng minh mọi cảnh báo khuyến mãi hết hạn FE08 đều được trả sách.**

Thay thế hồi quy dịch vụ cảnh báo đơn bằng hai bản sao đã hết hạn và hai bản đặt chỗ được giữ lại riêng biệt:

```js
test('returns every safe promotion warning in expiration order', async () => {
  const expired = [
    { reservationId: 50, copyId: 7 },
    { reservationId: 60, copyId: 8 },
  ];
  const nextByCopy = new Map([
    [7, reservation({ reservationId: 51, userId: 101, copyId: 7 })],
    [8, reservation({ reservationId: 61, userId: 102, copyId: 8 })],
  ]);
  const heldByCopy = new Map([
    [7, reservation({
      reservationId: 51,
      userId: 101,
      copyId: 7,
      status: 'NOTIFIED',
      notifiedAt: FIXED_NOW,
      expiresAt: new Date('2026-07-25T00:00:00.000Z'),
    })],
    [8, reservation({
      reservationId: 61,
      userId: 102,
      copyId: 8,
      status: 'NOTIFIED',
      notifiedAt: FIXED_NOW,
      expiresAt: new Date('2026-07-25T00:00:00.000Z'),
    })],
  ]);
  const auditLogRepository = {
    create: jest.fn(async (entry) => {
      if (entry.action === 'RESERVATION_NOTIFY_FAILED') {
        throw new Error('audit unavailable');
      }
    }),
  };
  const notificationRequest = jest.fn(async () => {
    throw new Error('provider unavailable');
  });
  const { service } = makeService({
    auditLogRepository,
    notificationRequest,
    repository: {
      expireOverdueHolds: jest.fn(async () => expired),
      findNextActiveReservationForCopy: jest.fn(async (copyId) => nextByCopy.get(copyId)),
      holdReservation: jest.fn(async ({ copyId }) => heldByCopy.get(copyId)),
    },
  });

  const result = await service.expireHolds(LIBRARIAN, {});

  expect(result.promoted).toEqual([heldByCopy.get(7), heldByCopy.get(8)]);
  expect(result.notificationWarnings).toEqual([
    {
      reservationId: 51,
      copyId: 7,
      code: 'RESERVATION_NOTIFY_AUDIT_FAILED',
      message: 'The reservation hold was created, but notification failure auditing was unavailable.',
    },
    {
      reservationId: 61,
      copyId: 8,
      code: 'RESERVATION_NOTIFY_AUDIT_FAILED',
      message: 'The reservation hold was created, but notification failure auditing was unavailable.',
    },
  ]);
  expect(Object.keys(heldByCopy.get(7))).not.toContain('notificationWarning');
  expect(Object.keys(heldByCopy.get(8))).not.toContain('notificationWarning');
});
```

Mở rộng hồi quy tuyến đường hiện có bằng cách sử dụng các bản sao `1` và `3`:

```js
const createNotificationRequest = jest
  .fn()
  .mockResolvedValueOnce({ notificationId: 1, status: 'PENDING' })
  .mockResolvedValueOnce({ notificationId: 2, status: 'PENDING' })
  .mockRejectedValueOnce(new Error('provider one unavailable'))
  .mockRejectedValueOnce(new Error('provider two unavailable'));

const queueMembers = [];
for (const copyId of [1, 3]) {
  const firstEmail = `expire.warning.first.${copyId}@example.test`;
  const secondEmail = `expire.warning.second.${copyId}@example.test`;
  const first = await createVerifiedUser({
    app,
    authDependencies,
    reservationDependencies,
    email: firstEmail,
  });
  const second = await createVerifiedUser({
    app,
    authDependencies,
    reservationDependencies,
    email: secondEmail,
  });
  queueMembers.push({ copyId, first, second, secondEmail });

  for (const member of [first, second]) {
    await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId })
      .expect(201);
  }
  reservationDependencies.state.copies.find(
    (copy) => copy.copyId === copyId
  ).status = 'AVAILABLE';
  await request(app)
    .post('/api/reservations/process-queue')
    .set('Authorization', authHeader(librarian.accessToken))
    .send({ copyId })
    .expect(200);
  reservationDependencies.state.reservations.find(
    (item) => item.userId === first.userId && item.copyId === copyId
  ).expiresAt = new Date(Date.now() - 60 * 1000);
}

const expireResponse = await request(app)
  .post('/api/reservations/expire-holds')
  .set('Authorization', authHeader(librarian.accessToken));

expect(expireResponse.status).toBe(200);
expect(expireResponse.body.promoted).toHaveLength(2);
expect(expireResponse.body.notificationWarnings).toEqual(
  expireResponse.body.promoted.map((promoted) => ({
    reservationId: promoted.reservationId,
    copyId: promoted.copyId,
    code: 'RESERVATION_NOTIFY_AUDIT_FAILED',
    message: 'The reservation hold was created, but notification failure auditing was unavailable.',
  }))
);
expect(requester.createNotificationRequest).toHaveBeenCalledTimes(4);
const serializedWarnings = JSON.stringify(expireResponse.body.notificationWarnings);
for (const forbidden of [
  'provider one unavailable',
  'provider two unavailable',
  'audit unavailable',
  ...queueMembers.map(({ secondEmail }) => secondEmail),
]) {
  expect(serializedWarnings).not.toContain(forbidden);
}
```

Phát hiện đã được phê duyệt là thiếu độ sâu hồi quy, không phải lỗi sản phẩm đã biết. Nếu các kiểm
thử này vượt qua vòng lặp dịch vụ hiện tại, đừng thay đổi mã dịch vụ sản xuất chỉ để tạo ra trạng
thái RED.

Chạy:

```powershell
$env:TZ = 'UTC'
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reservationService.test.js tests/reservationRoutes.test.js tests/reservationRepository.test.js
```

Dự kiến: tất cả các kiểm thử FE08 tập trung đều vượt qua; cả đầu ra dịch vụ và tuyến nối tiếp đều
chứa hai cảnh báo được sắp xếp và không có chi tiết bị cấm.

- [x] **Bước 4: Ghi lại phản hồi cảnh báo hàng đợi quy trình đơn lẻ.**

Thay thế tốc ký `process-queue` `200` trong `backend/src/docs/openapi.yaml` bằng:

```yaml
'200':
  description: Next eligible reservation held (NOTIFIED), no eligible reservation, or a safe notification-audit warning
  content:
    application/json:
      schema:
        type: object
        required: [selectedReservation]
        properties:
          selectedReservation:
            type: object
            nullable: true
          message: { type: string }
          notificationWarning:
            type: object
            additionalProperties: false
            required: [code, message]
            properties:
              code:
                type: string
                enum: [RESERVATION_NOTIFY_AUDIT_FAILED]
              message: { type: string }
```

Giữ `expire-holds.notificationWarnings[]` không thay đổi. Phân tích tài liệu OpenAPI hoàn chỉnh:

```powershell
python -c "import yaml; yaml.safe_load(open('backend/src/docs/openapi.yaml', encoding='utf-8')); print('OPENAPI_OK')"
```

Dự kiến: `OPENAPI_OK`.

- [x] **Bước 5: Làm cho bằng chứng H2/H3 trở thành trung thực.**

Cập nhật bản ghi xác thực thành:

- trạng thái sử dụng `IN PROGRESS - REPEATED H3 FINDINGS UNDER REMEDIATION`;
- thêm đầu được H2 phê duyệt
  `b931e005e50dc9c0ec9c177f2874f88a1df943b0`;
- ghi PR #62 là Sẵn sàng, `MERGEABLE` / `CLEAN`;
- ghi lại CI chạy `30019439505` thành công cho chính xác cái đầu đó;
- bản ghi lặp lại H3 trả về tính chẵn lẻ của khung đóng, nhiều cảnh báo
  hồi quy, OpenAPI số ít và các phát hiện bằng chứng cũ;
- kiểm tra các mục nhập danh sách kiểm tra H2 mới, cam kết/đẩy và cập nhật CI trước đó;
- để lại H2 mới, CI cập nhật, H3 lặp lại, hợp nhất,
  Đã bỏ chọn CI sau hợp nhất, triển khai và xác minh giai đoạn chỉ đọc.

Đối với `FE07-T046`, `FE08-T040`, `FE10-S10` và `FE12-N10`, hãy thay thế câu cổng hiện tại cũ bằng
trạng thái này:

```text
Bản ghi Git b931e00 đã được H2 mới phê duyệt và lượt CI 30019439505 của PR đã đạt. Lần rà soát
H3 lặp lại trả về các phát hiện hoàn thiện vòng hai trong phạm vi; phần khắc phục mới chưa được ghi
nhận cần một H2 mới khác, CI của PR được cập nhật và lặp lại H3 trước khi hợp nhất.
```

Đánh dấu Nhiệm vụ 19 Bước 5 và 6 đã hoàn thành, giữ nguyên Nhiệm vụ 19 Bước 7 mở và ghi lại Nhiệm vụ
20 này làm biện pháp khắc phục tích cực duy nhất. Không yêu cầu hoàn thành việc hợp nhất, CI sau hợp
nhất hoặc hoàn thành giai đoạn Azure.

- [x] **Bước 6: Chạy xác minh tập trung và tương đương với kho lưu trữ.**

```powershell
$env:TZ = 'UTC'
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reservationService.test.js tests/reservationRoutes.test.js tests/reservationRepository.test.js tests/reportInMemoryParity.test.js tests/reportRoutes.test.js tests/reportRepository.test.js
npm.cmd --prefix frontend test -- --runInBand test/reservationFrontend.test.js
npm.cmd run test:deployment
npm.cmd run trace:enforce
python -c "import yaml; yaml.safe_load(open('backend/src/docs/openapi.yaml', encoding='utf-8')); print('OPENAPI_OK')"
git diff --check

npm.cmd audit --audit-level=high
npm.cmd --prefix backend audit --audit-level=high
npm.cmd --prefix frontend audit --audit-level=high
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:integration:system
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
npm.cmd run test:deployment
node -e "const app = require('./backend/src/index'); if (!app || typeof app.listen !== 'function') throw new Error('Express app export is invalid'); console.log('BACKEND_IMPORT_OK');"
```

Dự kiến: mọi lệnh đều thoát `0`; số lượng kiểm toán vẫn bằng 0 ở ngưỡng cao; phạm vi bảo hiểm vẫn ở
trên ngưỡng kho lưu trữ; E2E vượt qua đầy đủ.

- [x] **Bước 7: Xem lại phạm vi, tính bảo mật và khả năng tương thích chính mới nhất; dừng lại ở H2.**

```powershell
git fetch origin main
git status --short
git diff --stat b931e00
git diff --name-only b931e00
git diff --check b931e00
git merge-tree --write-tree origin/main HEAD
git diff b931e00 -- `
  backend/tests/helpers/inMemoryReportRepositories.js `
  backend/tests/reportInMemoryParity.test.js `
  backend/tests/reservationService.test.js `
  backend/tests/reservationRoutes.test.js `
  backend/src/docs/openapi.yaml `
  .sdd/reviews/fe07-fe08-fe10-fe12-h3-remediation-validation-2026-07-23.md
```

Xác nhận:

- sản xuất FE12 SQL vẫn được tham số hóa và không thay đổi;
- FE08 cảnh báo không chứa người nhận, nhà cung cấp, nội dung được hiển thị, bộ công nghệ hoặc
  dữ liệu bí mật;
- không tồn tại lược đồ, quyền, vai trò, sự phụ thuộc, giao diện người dùng hoặc thao tác ghi Azure;
- chỉ các tệp Nhiệm vụ 20 đã được phê duyệt mới được thay đổi;
- `output/audit-librarian-2026-07-22/` vẫn không bị theo dõi và không bị ảnh hưởng;
- việc hợp nhất ảo với `origin/main` mới nhất là rõ ràng.

Dừng lại với sự khác biệt hoàn toàn không được cam kết và bằng chứng mới. Không tạo giai đoạn, cam
kết, đẩy, hợp nhất, chạy Azure SQL có thể thay đổi hoặc triển khai trước H2 mới rõ ràng.

Quá trình xác minh vòng hai hoàn tất vào ngày 23/07/2026: phần máy chủ tập trung 6 bộ/107 kiểm thử,
phần máy chủ đầy đủ 61 bộ/1.013 kiểm thử, tích hợp hệ thống 10 kiểm thử, 212 kiểm thử giao diện
người dùng cùng với kiểm tra mã/bản dựng, Chrome E2E 4/4, tiện ích triển khai 8/8, cả ba lần kiểm
tra ngưỡng cao tại 0 lỗ hổng, thực thi truy vết, Phân tích cú pháp OpenAPI, nhập máy chủ và vệ sinh
khác biệt đã được thông qua. Phần đầu cam kết hiện tại đã hợp nhất hoàn toàn với `origin/main` dưới
dạng cây `e22a848b1f806a4988092581e78e3e76501805c6`; áp dụng bản vá vòng hai hoàn chỉnh trước khi
cập nhật bằng chứng quản trị cuối cùng cho cây đó cũng thành công với tên gọi
`9fecfa6dfd5e99dd7476c731163f3be2a7c38fa2`. Đây là trạng thái đóng băng trước H2. Fresh H2 đã phê
duyệt gói vòng hai vào ngày 23/07/2026 và ủy quyền cho cam kết/thúc đẩy được xem xét; PR CI đã cập
nhật và H3 lặp lại vẫn là bắt buộc trước khi hợp nhất.
