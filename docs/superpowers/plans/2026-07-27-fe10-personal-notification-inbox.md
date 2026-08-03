# FE10 Kế hoạch triển khai Hộp thư thông báo cá nhân

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Thêm hộp thư thông báo cá nhân an toàn cho các tài khoản `MEMBER`, `LIBRARIAN` và
`ADMIN` đã xác thực trong khi vẫn duy trì bản ghi gửi email hiện có, ranh giới nội dung nhạy cảm và
sự an toàn trong quá trình tổ chức Azure.

**Kiến trúc:** Mở rộng `Notifications` với `ReadAt` có thể rỗng, chỉ truy vấn các hàng không nhạy
cảm đủ điều kiện của người dùng hiện tại trong SQL, ánh xạ các hàng tới DTO an toàn cố định và danh
sách cho phép hành động thuộc sở hữu máy chủ, hiển thị bốn điểm cuối đã xác thực, sau đó sử dụng
chúng thông qua ngữ cảnh hộp thư đến React chung, chuông lớp bao và phân trang Trang `/notifications`.
Triển khai di chuyển bổ sung và máy chủ trước giao diện người dùng.

**bộ công nghệ công nghệ:** SQL Server/Azure SQL, Node.js 22, Express 5, `mssql`, Jest/Supertest,
React 19, React Bộ định tuyến 7, Axios, Trình chạy kiểm thử nút, Playwright, Azure App Service,
Azure Static Web Apps.

**Kế hoạch/H1 đã được phê duyệt:** 2026-07-28 bởi người dùng trong tác vụ đang hoạt động.

## Ràng buộc toàn cầu

- Hợp đồng nguồn được phê duyệt là `.sdd/specs/feat-notification-management/SPEC.md` v0.5.0 và thiết kế được phê duyệt là `docs/superpowers/specs/2026-07-27-fe10-notification-inbox-expansion-design.md`.
- Chỉ hoạt động trong `codex/docs-fe10-notification-inbox-spec` cho đến khi nhánh/cây công việc triển khai được xem xét được chọn. Giữ nguyên các thay đổi cây gốc không liên quan.
- Chỉ bắt đầu triển khai sản phẩm sau khi quản trị được phê duyệt H1 này
  kích hoạt đạt tới `main`, theo yêu cầu của quy tắc Theo dõi nhanh của kho lưu trữ.
- Sử dụng RED -> GREEN -> xác minh tập trung cho mọi tác vụ. Đừng làm suy yếu xác nhận không thành công chỉ để có được GREEN.
- Mỗi lần đọc hoặc thao tác ghi kho lưu trữ phải bao gồm `UserId` đã được xác thực và thuộc tính đủ điều kiện chính xác trong hộp thư đến trước khi trả về dữ liệu.
- Không bao giờ tiết lộ hoặc bao gồm `ACCOUNT_VERIFICATION`, `PASSWORD_RESET`, `ACCOUNT_SETUP`, `EMAIL_VERIFY`, hàng không có người dùng, email người nhận, `SafePayload`, dữ liệu tạm thời, dữ liệu nhà cung cấp, lỗi gửi, lần thử hoặc siêu dữ liệu nguồn trong phản hồi hộp thư đến.
- `ReadAt` trực giao với `Status`, `SentAt`, `AttemptCount`, `NotificationAttempts`, trạng thái nguồn và trạng thái chuẩn hóa. Hoạt động đọc không được gửi, thử lại, yêu cầu hoặc thay đổi việc phân phối.
- Các tuyến hành động chỉ là ánh xạ máy chủ cố định: `/membership`, `/reservations/mine`, `/borrowing/history`, `/fines/mine`. Các hàng không xác định/không tương thích trả về `actionPath: null`.
- Không có WebSocket, nhân viên dịch vụ, kênh thông báo mới, bảng chiếu trùng lặp, hành vi ghi nhật ký nhân viên toàn cầu, xóa hoặc lưu trữ.
- Quá trình di chuyển có tính chất bổ sung, giao dịch, có thể lặp lại, tương thích với Azure SQL và được xác minh hai lần trên cơ sở dữ liệu dùng một lần trước khi tiến hành.
- Triển khai di chuyển/máy chủ trước giao diện người dùng. Việc khôi phục ứng dụng sẽ để lại `ReadAt` có thể vô hiệu hóa.

---

## Nhiệm vụ 1: Thêm Lược đồ trạng thái đọc chính tắc và di chuyển có thể lặp lại (FE10-I01)

**Tệp:**

- Tạo: `database/migrations/2026-07-27-fe10-personal-inbox-read-state.sql`
- Tạo: `backend/tests/notificationInboxMigration.test.js`
- Sửa đổi: `database/Librarymanagement.sql`
- Sửa đổi: `backend/src/models/Notification.js`
- Sửa đổi: `.sdd/specs/feat-notification-management/TEST_PLAN.md`

- [ ] **Bước 1: Viết kiểm thử hợp đồng di chuyển RED**

Thêm các xác nhận rằng cả lược đồ chuẩn và quá trình di chuyển đều chứa `ReadAt DATETIME2 NULL`,
rằng quá trình di chuyển là giao dịch/bình thường và việc chèn lấp đó chỉ chạy trong cùng một nhánh
chạy đầu tiên có thêm cột.

```js
expect(migration).toMatch(/COL_LENGTH\('dbo\.Notifications', 'ReadAt'\) IS NULL/i);
expect(migration).toMatch(/ALTER TABLE dbo\.Notifications ADD ReadAt DATETIME2 NULL/i);
expect(migration).toMatch(/SET ReadAt = CreatedAt/i);
expect(migration).toMatch(/IX_Notifications_User_ReadAt_CreatedAt/i);
expect(migration).toMatch(/BEGIN TRANSACTION/i);
expect(migration).toMatch(/ROLLBACK TRANSACTION/i);
expect(migration).toMatch(/THROW/i);
```

kiểm thử cũng phải khẳng định rằng tính đủ điều kiện của SQL chỉ bao gồm:

```text
GENERAL_SYSTEM + MEMBERSHIP_RESULT
RESERVATION_AVAILABLE + RESERVATION_READY
DUE_DATE_REMINDER
OVERDUE_NOTICE
FINE_NOTICE
```

và loại trừ cả ba loại nhạy cảm chuẩn cộng với `EMAIL_VERIFY` cũ.

- [ ] **Bước 2: Chạy kiểm thử tập trung và chụp RED**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationInboxMigration.test.js
```

Dự kiến: THẤT BẠI vì tệp di chuyển và hợp đồng mô hình/lược đồ `ReadAt` chưa tồn tại.

- [ ] **Bước 3: Triển khai lược đồ/mô hình di chuyển và chuẩn**

Quá trình di chuyển sẽ kích hoạt cài đặt phiên đối tượng được lập chỉ mục SQL Server, sử dụng
`XACT_ABORT` và giữ chèn lấp lần chạy đầu tiên bên trong nhánh thêm cột để lần chạy lặp lại không
đánh dấu thông báo được tạo sau khi di chuyển là đã đọc.

```sql
IF COL_LENGTH('dbo.Notifications', 'ReadAt') IS NULL
BEGIN
    ALTER TABLE dbo.Notifications ADD ReadAt DATETIME2 NULL;

    UPDATE dbo.Notifications
    SET ReadAt = CAST(CreatedAt AS DATETIME2)
    WHERE UserId IS NOT NULL
      AND (
        (NotificationType = 'GENERAL_SYSTEM' AND TemplateKey = 'MEMBERSHIP_RESULT')
        OR (NotificationType = 'RESERVATION_AVAILABLE' AND TemplateKey = 'RESERVATION_READY')
        OR (NotificationType = 'DUE_DATE_REMINDER' AND TemplateKey = 'DUE_DATE_REMINDER')
        OR (NotificationType = 'OVERDUE_NOTICE' AND TemplateKey = 'OVERDUE_NOTICE')
        OR (NotificationType = 'FINE_NOTICE' AND TemplateKey = 'FINE_NOTICE')
      );
END;
```

Chỉ tạo `IX_Notifications_User_ReadAt_CreatedAt` khi vắng mặt, với các cột chính `(UserId, ReadAt,
CreatedAt DESC)` và `NotificationId`, `NotificationType`, `TemplateKey`, `Title` và `Body` được bao
gồm cho truy vấn hộp thư đến. Thêm `{ attribute: 'readAt', name: 'ReadAt', type: 'DATETIME2',
nullable: true }` vào mô hình.

- [ ] **Bước 4: Chạy kiểm thử hồi quy lược đồ và GREEN tập trung**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationInboxMigration.test.js tests/notificationRepository.test.js tests/fe10OtpTemplateMigration.test.js
npm.cmd run schema:azure:prepare
```

Dự kiến: tất cả các kiểm thử Jest đã chọn đạt và việc chuẩn bị lược đồ Azure đều báo cáo một lược
đồ được tạo mà không có câu lệnh tạo/chuyển đổi cơ sở dữ liệu.

- [ ] **Bước 5: Cam kết lát lược đồ bị chặn**

```powershell
git add database/Librarymanagement.sql database/migrations/2026-07-27-fe10-personal-inbox-read-state.sql backend/src/models/Notification.js backend/tests/notificationInboxMigration.test.js .sdd/specs/feat-notification-management/TEST_PLAN.md
git commit -m "feat(fe10): add personal inbox read state schema"
```

---

## Nhiệm vụ 2: Thêm truy vấn hộp thư đến do SQL sở hữu và chiếu an toàn (FE10-I02)

**Tệp:**

- Tạo: `backend/src/utils/notificationInbox.js`
- Tạo: `backend/tests/notificationInboxRepository.test.js`
- Sửa đổi: `backend/src/repositories/notificationRepository.js`
- Sửa đổi: `backend/tests/helpers/inMemoryNotificationRepositories.js`
- Sửa đổi: `backend/tests/notificationRoutes.test.js`

- [ ] **Bước 1: Viết các kiểm thử kho lưu trữ và tiện ích RED**

Bìa:

- khóa chính xác DTO an toàn: `notificationId`, `type`, `title`, `message`, `createdAt`, `readAt`, `actionPath`;
- ánh xạ hành động loại/mẫu chính xác và `null` để phát hiện các thông tin không khớp;
- Các vị từ SQL bao gồm `UserId`, tính đủ điều kiện, trạng thái đọc, loại tùy chọn, `CreatedAt DESC, NotificationId DESC`, `OFFSET` và `FETCH NEXT`;
- số lượng áp dụng cùng một vị từ quyền sở hữu/đủ điều kiện;
- mark-one duy trì dấu thời gian `ReadAt` đầu tiên khi phát lại;
- mark-tất cả sử dụng một dấu thời gian của máy chủ và trả về 0 khi phát lại;
- các hồ sơ nhạy cảm, không có người dùng và người dùng khác không bao giờ thành hiện thực.

```js
expect(toSafeInboxItem(row)).toEqual({
  notificationId: row.notificationId,
  type: 'DUE_DATE_REMINDER',
  title: row.title,
  message: row.body,
  createdAt: row.createdAt,
  readAt: null,
  actionPath: '/borrowing/history',
});
expect(Object.keys(toSafeInboxItem(row)).sort()).toEqual([
  'actionPath', 'createdAt', 'message', 'notificationId', 'readAt', 'title', 'type',
]);
```

- [ ] **Bước 2: Chạy RED tập trung**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationInboxRepository.test.js tests/notificationRoutes.test.js
```

Dự kiến: THẤT BẠI vì tiện ích hộp thư đến/hoạt động kho lưu trữ không tồn tại.

- [ ] **Bước 3: Thực hiện hợp đồng tiện ích cố định**

Chỉ xuất những người trợ giúp ổn định cần thiết cho dịch vụ/kiểm tra:

```js
const INBOX_TYPES = Object.freeze([
  'GENERAL_SYSTEM',
  'RESERVATION_AVAILABLE',
  'DUE_DATE_REMINDER',
  'OVERDUE_NOTICE',
  'FINE_NOTICE',
]);

function getInboxActionPath(notification) { /* exact type/template switch */ }
function toSafeInboxItem(notification) { /* exact seven-field DTO */ }
```

Không lấy tuyến đường từ `title`, `body`, `safePayload`, tham số yêu cầu hoặc giá trị nguồn tùy ý.

- [ ] **Bước 4: Thực hiện các thao tác với kho lưu trữ**

Thêm và xuất:

```js
listInboxForUser({ userId, page, limit, readState, type })
countUnreadForUser(userId)
markInboxReadForUser({ notificationId, userId })
markAllInboxReadForUser(userId)
```

`listInboxForUser` trả về `{ notifications, total }`; dịch vụ tính toán `totalPages`. chức năng lọc
và phân trang vẫn được duy trì bên trong SQL. `markInboxReadForUser` sử dụng `COALESCE(ReadAt,
SYSUTCDATETIME())` trên hàng đủ điều kiện được sở hữu để việc phát lại sẽ trả về cùng một dấu thời
gian. `markAllInboxReadForUser` ghi lại một giá trị `SYSUTCDATETIME()` và chỉ cập nhật các hàng
`ReadAt IS NULL` đủ điều kiện.

Phản ánh ngữ nghĩa tương tự trong kho lưu trữ trong bộ nhớ để các kiểm thử định tuyến/tích hợp thực
hiện quyền sở hữu và quyền bình thường chứ không phải là giả mạo cho phép.

- [ ] **Bước 5: Chạy GREEN tập trung**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationInboxRepository.test.js tests/notificationRoutes.test.js tests/notificationRepository.test.js
```

Dự kiến: tất cả các kiểm thử đã chọn ĐẠT; các kiểm thử yêu cầu bàn giao hiện tại vẫn còn xanh.

- [ ] **Bước 6: Cam kết lát kho lưu trữ**

```powershell
git add backend/src/utils/notificationInbox.js backend/src/repositories/notificationRepository.js backend/tests/helpers/inMemoryNotificationRepositories.js backend/tests/notificationInboxRepository.test.js backend/tests/notificationRoutes.test.js
git commit -m "feat(fe10): add owned notification inbox repository"
```

---

## Nhiệm vụ 3: Hiển thị các API hộp thư đến đã xác thực có lỗi IDOR-Safe (FE10-I03)

**Tệp:**

- Sửa đổi: `backend/src/validators/notificationValidators.js`
- Sửa đổi: `backend/src/services/notificationService.js`
- Sửa đổi: `backend/src/controllers/notificationController.js`
- Sửa đổi: `backend/src/routes/notificationRoutes.js`
- Sửa đổi: `backend/src/docs/openapi.yaml`
- Sửa đổi: `backend/tests/notificationRoutes.test.js`

- [ ] **Bước 1: Thêm trường hợp dịch vụ/tuyến đường RED**

Thêm các kiểm thử dựa trên bảng cho `MEMBER`, `LIBRARIAN` và `ADMIN`, cùng với:

- `401` ẩn danh và `403` có vai trò không được hỗ trợ đã xác thực;
- bộ lọc trang/giới hạn/trạng thái đọc/loại mặc định và rõ ràng;
- trang không hợp lệ, giới hạn, trạng thái đọc, loại nhạy cảm và loại không xác định trả về `400 VALIDATION_ERROR`;
- ID người dùng chéo, nhạy cảm và ID đánh dấu bị thiếu trả về cùng một nội dung `404`;
- danh sách/số lượng loại trừ tất cả các hàng nhạy cảm và không có người sử dụng;
- phát lại đánh dấu một bảo tồn `readAt`;
- đánh dấu tất cả các bản cập nhật chỉ sở hữu các hàng chưa đọc đủ điều kiện và phát lại trả về `{ updated: 0 }`;
- không có phản hồi nào chứa siêu dữ liệu bị cấm hoặc thay đổi trạng thái/lần thử gửi.

Sử dụng một phản hồi không tìm thấy chính xác cho tất cả các trường hợp đối tượng được bảo vệ:

```js
{
  error: {
    code: 'NOTIFICATION_NOT_FOUND',
    message: 'Notification was not found.',
  },
}
```

- [ ] **Bước 2: Chạy lộ trình RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js
```

Dự kiến: các trường hợp hộp thư đến mới THẤT BẠI với tuyến `404` hoặc thiếu phương thức dịch vụ.

- [ ] **Bước 3: Thêm trình xác nhận và tuyến đường theo thứ tự an toàn khi va chạm**

Nhập `query` từ `express-validator`. Xác thực trang mặc định `1`, giới hạn mặc định `20`, giới hạn
tối đa `100`, `readState` trong `all|unread|read` và `type` trong năm loại đủ điều kiện. Đăng ký
đường dẫn `/mine/*` tĩnh trước `/:id/read`.

```js
router.get('/mine', authenticate, requireAnyRole('MEMBER', 'LIBRARIAN', 'ADMIN'), listMineValidators, controller.listMine);
router.get('/mine/unread-count', authenticate, requireAnyRole('MEMBER', 'LIBRARIAN', 'ADMIN'), controller.unreadCount);
router.patch('/mine/read-all', authenticate, requireAnyRole('MEMBER', 'LIBRARIAN', 'ADMIN'), controller.markAllRead);
router.patch('/:id/read', authenticate, requireAnyRole('MEMBER', 'LIBRARIAN', 'ADMIN'), markReadValidators, controller.markRead);
```

- [ ] **Bước 4: Thêm bộ điều khiển mỏng và phương pháp ranh giới dịch vụ**

Thêm phương thức dịch vụ:

```js
listMyNotifications(input, actor)
countMyUnreadNotifications(actor)
markMyNotificationRead(notificationId, actor)
markAllMyNotificationsRead(actor)
```

Dịch vụ này kiểm tra lại các vai trò đăng nhập được phép, luôn lấy `userId` từ `actor`, ánh xạ các
hàng trong kho lưu trữ thông qua `toSafeInboxItem`, tính toán phân trang và đưa ra lỗi
`NOTIFICATION_NOT_FOUND` an toàn duy nhất khi đánh dấu một trả về hàng đủ điều kiện không thuộc sở
hữu. Nó không bao giờ chấp nhận `userId` hoặc `actionPath` từ đầu vào HTTP.

- [ ] **Bước 5: Ghi lại các lược đồ và hoạt động OpenAPI chính xác**

Thêm các lược đồ `SafeInboxItem`, `NotificationInboxPage`, `UnreadCount` và `MarkAllReadSummary` với
`additionalProperties: false`. Ghi lại tất cả bốn đường dẫn, ràng buộc truy vấn, vai trò được phép,
phản hồi `400/401/403/404/500` an toàn và loại trừ DTO bảy trường.

- [ ] **Bước 6: Chạy GREEN tập trung và cổng phủ sóng**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js tests/notificationInboxRepository.test.js
npm.cmd --prefix backend run test:coverage:ci
```

Dự kiến: các kiểm thử tập trung đạt và ngưỡng phủ sóng được cấu hình toàn cầu vẫn đáp ứng được.

- [ ] **Bước 7: Cam kết lát API**

```powershell
git add backend/src/validators/notificationValidators.js backend/src/services/notificationService.js backend/src/controllers/notificationController.js backend/src/routes/notificationRoutes.js backend/src/docs/openapi.yaml backend/tests/notificationRoutes.test.js
git commit -m "feat(fe10): expose personal notification inbox api"
```

---

## Nhiệm vụ 4: Thêm ứng dụng khách giao diện, Xem mô hình và bối cảnh hộp thư đến chung (FE10-I04)

**Tệp:**

- Tạo: `frontend/src/utils/notificationInboxViewModel.js`
- Tạo: `frontend/src/context/NotificationInboxContext.jsx`
- Tạo: `frontend/test/notificationInboxFrontend.test.js`
- Sửa đổi: `frontend/src/api/libraryFeatureApi.js`
- Sửa đổi: `frontend/src/api/apiErrorMessages.js`
- Sửa đổi: `frontend/src/App.jsx`

- [ ] **Bước 1: Viết kiểm thử hợp đồng giao diện người dùng RED**

Sử dụng kiểu kiểm tra Node hiện có. Nhập trình trợ giúp mô hình chế độ xem thuần túy và kiểm tra
nguồn JSX/API để biết:

- bốn phương pháp điểm cuối chính xác;
- giá trị huy hiệu `0 -> null`, `1 -> "1"`, `99 -> "99"`, `100 -> "99+"`;
- cố định danh sách cho phép hành động chặt chẽ ở giao diện người dùng;
- nhà cung cấp kết thúc các tuyến đường, thăm dò mọi `60000`, làm mới trên `focus` và ngăn các yêu cầu đếm chồng chéo;
- số lần làm mới đọc thành công;
- việc đọc không thành công sẽ đưa ra cảnh báo an toàn nhưng vẫn điều hướng khi `actionPath` được đưa vào danh sách cho phép.

```js
assert.equal(formatUnreadBadge(0), null);
assert.equal(formatUnreadBadge(99), '99');
assert.equal(formatUnreadBadge(100), '99+');
assert.equal(isAllowedNotificationActionPath('https://evil.test'), false);
```

- [ ] **Bước 2: Chạy giao diện người dùng RED**

```powershell
node --test frontend/test/notificationInboxFrontend.test.js
```

Dự kiến: THẤT BẠI vì mô hình/bối cảnh máy khách/chế độ xem không tồn tại.

- [ ] **Bước 3: Thêm phương thức khách hàng được ủy quyền**

Tái sử dụng `authorizedRequest` trong `libraryFeatureApi.js` để hoạt động của mã thông báo làm mới
vẫn nhất quán.

```js
export const notificationInboxApi = {
  listMine(params = {}) { /* GET /notifications/mine */ },
  unreadCount() { /* GET /notifications/mine/unread-count */ },
  markRead(notificationId) { /* PATCH /notifications/{id}/read */ },
  markAllRead() { /* PATCH /notifications/mine/read-all */ },
};
```

Thêm thông báo lỗi an toàn tiếng Việt để xác thực, xác thực, không tìm thấy, lỗi mạng. Không hiển
thị thông tin chi tiết về bộ công nghệ/nhà cung cấp máy chủ.

- [ ] **Bước 4: Thêm trình trợ giúp mô hình khung nhìn thuần túy**

Xuất `formatUnreadBadge`, `isAllowedNotificationActionPath` và hằng số bộ lọc trạng thái đọc ổn
định. Giữ phê duyệt URL độc lập với dữ liệu API.

- [ ] **Bước 5: Thêm nhà cung cấp được chia sẻ**

Gắn `NotificationInboxProvider` bên trong bối cảnh bộ định tuyến và nội dung tuyến đường bên ngoài
trong `App.jsx`. Nhà cung cấp sở hữu số lượng chưa đọc, một lần làm mới không chồng chéo, làm mới
tiêu điểm/60 giây, hành vi đọc và điều hướng cũng như thông báo cảnh báo được chia sẻ. Nó kiểm tra
xác thực/vai trò được lưu trữ trước khi gọi FE10 và đặt lại số lượng khi đăng xuất.

Không coi lỗi API là hộp thư đến thành công trống. Không chuyển hướng đến đăng nhập chỉ vì điểm cuối
hộp thư đến bị lỗi; hành vi làm mới xác thực hiện tại vẫn có thẩm quyền.

- [ ] **Bước 6: Chạy giao diện người dùng GREEN, kiểm tra mã và bản dựng**

```powershell
node --test frontend/test/notificationInboxFrontend.test.js
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Dự kiến: các kiểm thử tập trung ĐẠT; ESLint thoát 0; Quá trình xây dựng Vite hoàn tất.

- [ ] **Bước 7: Cam kết lát trạng thái giao diện người dùng được chia sẻ**

```powershell
git add frontend/src/api/libraryFeatureApi.js frontend/src/api/apiErrorMessages.js frontend/src/utils/notificationInboxViewModel.js frontend/src/context/NotificationInboxContext.jsx frontend/src/App.jsx frontend/test/notificationInboxFrontend.test.js
git commit -m "feat(fe10): add shared notification inbox state"
```

---

## Nhiệm vụ 5: Thêm Chuông lớp bao được xác thực và bản xem trước năm mục (FE10-I05)

**Tệp:**

- Tạo: `frontend/src/component/notification/NotificationBell.jsx`
- Sửa đổi: `frontend/src/component/layout/Header.jsx`
- Sửa đổi: `frontend/src/styles/app-shell.css`
- Sửa đổi: `frontend/test/notificationInboxFrontend.test.js`
- Sửa đổi: `frontend/test/appShellFrontend.test.js`

- [ ] **Bước 1: Thêm xác nhận lớp bao RED**

Xác nhận rằng Tiêu đề hiển thị `NotificationBell`, thành phần sử dụng số lượng ngữ cảnh, giới hạn
huy hiệu thông qua `formatUnreadBadge`, chỉ tìm nạp `readState: 'unread', page: 1, limit: 5` khi
được mở, hiển thị trạng thái tải/trống/lỗi rõ ràng và bao gồm `Xem tất cả` -> `/notifications`.

Đồng thời khẳng định các điều khiển ngữ nghĩa:

- nút chuông có tên có thể truy cập được và `aria-expanded`;
- cửa sổ bật lên có vùng/menu được gắn nhãn;
- các mục chưa đọc là các nút chứ không phải là các neo không an toàn;
- không tồn tại văn bản hoặc phương thức xóa/lưu trữ/nhật ký toàn cầu.

- [ ] **Bước 2: Chạy lớp bao RED**

```powershell
node --test frontend/test/notificationInboxFrontend.test.js frontend/test/appShellFrontend.test.js
```

Dự kiến: THẤT BẠI vì Tiêu đề không có chuông thông báo/xem trước.

- [ ] **Bước 3: Thực hiện chuông và xem trước**

Sử dụng Lucide `Bell`. Tìm nạp bản xem trước khi chuyển đổi đã đóng -> mở, không phải trên mỗi kết
xuất. Hiển thị tối đa năm mục an toàn chưa đọc mới nhất và ủy quyền hành vi nhấp chuột cho ngữ cảnh
được chia sẻ. Đóng cửa sổ bật lên khi nhấp chuột bên ngoài, `Escape`, điều hướng tuyến đường và `Xem
tất cả`; khôi phục tiêu điểm vào chuông sau khi tắt bàn phím.

Đặt chuông trước trình kích hoạt tài khoản trong `.app-topbar-actions`. Giữ nguyên hành vi đăng xuất
và dự phòng hồ sơ hiện tại.

- [ ] **Bước 4: Thêm kiểu đáp ứng, dễ tiếp cận**

Thêm các lớp `.notification-*` có phạm vi vào `app-shell.css`. Xác minh rằng cửa sổ bật lên vừa với
máy tính để bàn và chiều rộng 390px trên thiết bị di động mà không bị tràn ngang, huy hiệu vẫn rõ
ràng ở `99+`, phần nhấn mạnh chưa đọc không chỉ có màu và các vòng tiêu điểm vẫn hiển thị.

- [ ] **Bước 5: Chạy lớp bao GREEN, kiểm tra mã và bản dựng**

```powershell
node --test frontend/test/notificationInboxFrontend.test.js frontend/test/appShellFrontend.test.js
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Dự kiến: kiểm tra đạt, kiểm tra mã thoát 0, xây dựng thành công.

- [ ] **Bước 6: Cam kết lát vỏ**

```powershell
git add frontend/src/component/notification/NotificationBell.jsx frontend/src/component/layout/Header.jsx frontend/src/styles/app-shell.css frontend/test/notificationInboxFrontend.test.js frontend/test/appShellFrontend.test.js
git commit -m "feat(fe10): add notification bell and preview"
```

---

## Nhiệm vụ 6: Thêm trang `/notifications` được bảo vệ (FE10-I06)

**Tệp:**

- Tạo: `frontend/src/component/auth/AuthenticatedRouteGuard.jsx`
- Tạo: `frontend/src/page/notification/NotificationsPage.jsx`
- Sửa đổi: `frontend/src/App.jsx`
- Sửa đổi: `frontend/src/styles/app-shell.css`
- Sửa đổi: `frontend/test/notificationInboxFrontend.test.js`

- [ ] **Bước 1: Thêm xác nhận trang và lộ trình RED**

Bìa:

- tuyến đường `/notifications` lười biếng được bao bọc bởi người bảo vệ đã được xác thực;
- chuyển hướng không được xác thực đến `/login` và không có loại trừ vai trò cụ thể cho Thành viên/Thủ thư/Quản trị viên;
- Bản đồ `Tất cả`, `Chưa đọc`, `Đã đọc` tới `all`, `unread`, `read`;
- mọi lệnh gọi danh sách sẽ gửi `page`, `limit: 20` và `readState`;
- thay đổi bộ lọc quay lại trang 1;
- trạng thái tải rõ ràng, trống, lỗi, chưa đọc/đọc;
- `Đánh dấu tất cả đã đọc` gọi API, làm mới số lượng/danh sách và tắt trong khi chờ xử lý;
- nhấp vào gọi chức năng đọc và điều hướng được chia sẻ;
- không có kiểm soát xóa/lưu trữ/log toàn cầu.

- [ ] **Bước 2: Chạy trang RED**

```powershell
node --test frontend/test/notificationInboxFrontend.test.js
```

Dự kiến: THẤT BẠI vì tuyến đường, bảo vệ và trang không tồn tại.

- [ ] **Bước 3: Triển khai tuyến bảo vệ được xác thực và tuyến lười biếng**

Trình bảo vệ chỉ kiểm tra mã thông báo truy cập/làm mới được lưu trữ cho UX. Ủy quyền máy chủ vẫn là
ranh giới bảo mật. Nó chấp nhận bất kỳ phiên xác thực nào và không sử dụng lại bộ bảo vệ mượn chỉ
dành cho thành viên.

- [ ] **Bước 4: Triển khai trang với các nguyên mẫu được chia sẻ hiện có**

Sử dụng `AppLayout`, `DataToolbar`, `Pagination`, `LoadingBlock`/tải bảng, `EmptyState`,
`DataNotice` và hành vi ngữ cảnh/bánh mì nướng được chia sẻ. Giữ thứ tự và phân trang của máy chủ;
không sắp xếp ứng dụng khách hoặc tìm nạp toàn bộ lịch sử.

`markAllRead` chỉ cập nhật thông qua API. Khi thành công, tải lại trang hiện tại và số lượng chưa
đọc; nếu trang hiện tại trống sau khi lọc, hãy chuyển đến trang hợp lệ cuối cùng thông qua yêu cầu
máy chủ mới.

- [ ] **Bước 5: Chạy trang GREEN và hồi quy giao diện người dùng**

```powershell
node --test frontend/test/notificationInboxFrontend.test.js
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Dự kiến: tất cả các kiểm thử giao diện người dùng đều ĐẠT, kiểm tra mã thoát 0, quá trình xây dựng thành công.

- [ ] **Bước 6: Cam kết lát trang**

```powershell
git add frontend/src/component/auth/AuthenticatedRouteGuard.jsx frontend/src/page/notification/NotificationsPage.jsx frontend/src/App.jsx frontend/src/styles/app-shell.css frontend/test/notificationInboxFrontend.test.js
git commit -m "feat(fe10): add personal notifications page"
```

---

## Nhiệm vụ 7: Chứng minh hành vi trình duyệt đa chức năng và ba vai trò của người hâm mộ (FE10-I07)

**Tệp:**

- Sửa đổi: `backend/tests/membershipRoutes.test.js`
- Sửa đổi: `backend/tests/borrowingRoutes.test.js`
- Sửa đổi: `backend/tests/reservationRoutes.test.js`
- Sửa đổi: `backend/tests/integration.test.js`
- Sửa đổi: `backend/tests/helpers/systemIntegrationHarness.js`
- Sửa đổi: `tests/e2e/support/systemTestServer.js`
- Tạo: `tests/e2e/fe10-notification-inbox.spec.js`
- Sửa đổi: `.sdd/specs/feat-notification-management/TEST_PLAN.md`

- [ ] **Bước 1: Thêm xác nhận tích hợp nhiều chức năng RED**

Đối với kết quả thành viên FE04, lời nhắc đến hạn của FE07 và chức năng đặt chỗ FE08:

1. tạo sự kiện nguồn thông qua chức năng API/service hiện có;
2. xác nhận chính xác một bản ghi FE10 với người nhận `userId` và kênh email hiện có;
3. liệt kê hộp thư đến của người nhận và xác nhận cùng một `notificationId` xuất hiện một lần;
4. khẳng định người dùng khác không thể liệt kê/đọc nó;
5. khẳng định trạng thái phân phối/số lần thử không thay đổi do thao tác ghi đọc.

Không thực hiện cuộc gọi thông báo thứ hai hoặc sửa đổi kết quả kinh doanh của chức năng nguồn.

- [ ] **Bước 2: Chạy chức năng chéo RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/membershipRoutes.test.js tests/borrowingRoutes.test.js tests/reservationRoutes.test.js tests/integration.test.js
```

Dự kiến: các xác nhận trong hộp thư đến mới KHÔNG THÀNH CÔNG cho đến khi khai thác hệ thống hiển thị
trạng thái kho lưu trữ hộp thư đến/API đã triển khai một cách nhất quán.

- [ ] **Bước 3: Chỉ hoàn thành dây kết nối/dây tích hợp giới hạn cần thiết cho GREEN**

Cập nhật các phần phụ thuộc được chia sẻ trong bộ nhớ thay vì thêm các nhánh sản phẩm chỉ dành cho
kiểm thử. Nếu người gọi FE04/FE07/FE08 hiện có bỏ qua `userId`, hãy sửa người gọi đó bằng xác nhận
RED tập trung; nếu không thì giữ nguyên dòng nguồn sản xuất.

- [ ] **Bước 4: Thêm các điều khiển thiết lập E2E và vỏ trình duyệt**

Mở rộng `POST /__e2e__/setup` để trả về cả ba ID tác nhân khi `adminEmail` được cung cấp. Thêm một
tùy chọn kiểm soát chỉ dành cho kiểm thử để đưa trực tiếp các hàng đủ điều kiện, nhạy cảm, không có
người dùng và nhiều người dùng vào kho lưu trữ thông báo trong bộ nhớ được chia sẻ; thêm chức năng
kiểm soát lỗi đọc một lần để chứng minh chức năng điều hướng vẫn khả dụng.

Thông số Playwright phải bao gồm:

- MEMBER chuông/đếm/xem trước/trang/bộ lọc/đánh dấu một/điều hướng;
- Truy cập chuông/trang LIBRARIAN và ADMIN;
- Huy hiệu `99+` sử dụng 100 hàng thuộc sở hữu chưa đọc;
- sự vắng mặt nhạy cảm/không có người dùng/người dùng chéo;
- người dùng chéo trực tiếp `PATCH` trả về `404` an toàn tương tự như bị thiếu;
- đánh dấu tất cả và phát lại;
- đọc cảnh báo lỗi và điều hướng đến trang doanh nghiệp có trong danh sách cho phép;
- Khung nhìn 390x844 không bị tràn ngang.

- [ ] **Bước 5: Chạy tích hợp và E2E GREEN**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/membershipRoutes.test.js tests/borrowingRoutes.test.js tests/reservationRoutes.test.js tests/integration.test.js tests/notificationRoutes.test.js
npm.cmd exec -- playwright test tests/e2e/fe10-notification-inbox.spec.js --project=chromium
```

Dự kiến: tất cả các trường hợp kiểm tra máy chủ đã chọn ĐẠT và FE10 Playwright ĐẠT mà không có rò rỉ
nhạy cảm/người dùng chéo.

- [ ] **Bước 6: Cam kết phần tích hợp/trình duyệt**

```powershell
git add backend/tests/membershipRoutes.test.js backend/tests/borrowingRoutes.test.js backend/tests/reservationRoutes.test.js backend/tests/integration.test.js backend/tests/helpers/systemIntegrationHarness.js tests/e2e/support/systemTestServer.js tests/e2e/fe10-notification-inbox.spec.js .sdd/specs/feat-notification-management/TEST_PLAN.md
git commit -m "test(fe10): verify inbox fan-in and role flows"
```

---

## Nhiệm vụ 8: Tài liệu hoàn chỉnh, Cổng đầy đủ, H2 và Phân loại Azure (FE10-I08)

**Tệp:**

- Sửa đổi: `docs/architecture/system-architecture.md`
- Sửa đổi: `docs/architecture/feature-integration-map.md`
- Sửa đổi: `docs/user-manual.md`
- Sửa đổi: `docs/testing/master-test-plan.md`
- Sửa đổi: `docs/deployment/azure-staging-guide.md`
- Sửa đổi: `.github/workflows/deploy-staging.yml`
- Sửa đổi: `tests/deployment/stagingWorkflowPolicy.test.js`
- Sửa đổi: `.sdd/specs/feat-notification-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/CONTEXT.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/CHANGELOG.md`
- Sửa đổi: `.agents/CLAUDE.md`
- Tạo sau khi xác minh: `.sdd/reviews/fe10-notification-inbox-h2-validation-2026-07-27.md`
- Tạo sau khi môi trường tiền sản xuất/H3: `.sdd/reviews/fe10-notification-inbox-staging-h3-closeout-2026-07-27.md`

- [ ] **Bước 1: Viết xác nhận chính sách triển khai RED**

Yêu cầu người vận hành xác nhận rõ ràng rằng quá trình di chuyển FE10 đã vượt qua giai đoạn kiểm
thử, yêu cầu `deploy-backend` phụ thuộc vào ánh sáng trước và yêu cầu `deploy-frontend` phụ thuộc
vào việc triển khai máy chủ thành công. Duy trì kiểm thử nhanh đóng không thành công và hợp đồng
triển khai kiểm soát CI ngược dòng mới hơn được mô tả trong phụ lục bên dưới.

Phụ lục triển khai H1 được phê duyệt ngày 28 tháng 07 năm 2026: `main@41282b4` thượng nguồn đã giới
thiệu triển khai môi trường tiền sản xuất tự động theo cổng CI trong khi đang tiến hành triển khai.
Giữ nguyên hợp đồng mới hơn thay vì khôi phục chế độ chỉ thủ công. Cả chạy tự động và thủ công đều
phải kiểm tra quá trình di chuyển chính xác SHA-256 được lưu trữ trong Môi trường GitHub `staging`;
chạy thủ công cũng yêu cầu xác nhận boolean. Do đó, bằng chứng di chuyển FE10 phải tồn tại trước
H3/hợp nhất.

Phụ lục H1 lõi-drift được phê duyệt ngày 28-07-2026: khởi động lại `main@5a3c84b` và duy trì quá
trình di chuyển khởi động `add_change_password_otp_token_type.sql` được đóng gói, hướng dẫn/kiểm tra
tính sẵn sàng và hạt giống email xác minh bằng tiếng Việt. Giữ lại quá trình di chuyển FE10 trước và
ra lệnh triển khai, sau đó chạy lại tất cả các cổng và lấy dấu vân tay H2 mới trước khi xuất bản.

Phụ lục H1 lõi-drift thứ hai được phê duyệt ngày 28-07-2026: khởi động lại `main@db97f17` và giữ
nguyên lý do hủy đặt chỗ mặc định ở Việt Nam, các điều khiển return/reservation đáp ứng và tất cả
các chỉnh sửa FE07/FE08/FE10/FE12 vòng hai khác. Giữ lại ứng dụng khách hộp thư đến FE10 và các kiểu
thông báo trong phạm vi, sau đó chạy lại tất cả các cổng và lấy dấu vân tay H2 mới trước khi xuất
bản.

```js
assert.match(workflow, /fe10_inbox_migration_confirmed/);
assert.match(workflow, /deploy-backend:[\s\S]*needs: preflight/);
assert.match(workflow, /deploy-frontend:[\s\S]*needs: deploy-backend/);
```

- [ ] **Bước 2: Chạy triển khai RED**

```powershell
npm.cmd run test:deployment
```

Dự kiến: kiểm thử đặt hàng/xác nhận FAILS mới dựa trên quy trình triển khai song song.

- [ ] **Bước 3: Cập nhật thứ tự triển khai và hướng dẫn vận hành**

Tiếp tục ngược dòng `workflow_run` để có `main` CI thành công và đường dẫn `workflow_dispatch` thủ
công. Thêm đầu vào boolean bắt buộc `fe10_inbox_migration_confirmed` và thực hiện kiểm tra trước quá
trình di chuyển đã kiểm xuất SHA-256 so với `FE10_INBOX_MIGRATION_SHA256` trong Môi trường GitHub
`staging`. Chạy thủ công cũng không thành công khi boolean sai. `deploy-backend.needs: preflight`,
`deploy-frontend.needs: deploy-backend` và kiểm thử nhanh tiếp tục phụ thuộc vào cả hai ứng dụng được triển
khai.

Ghi lại thứ tự môi trường tiền sản xuất chính xác:

1. mở quy tắc tường lửa Azure SQL Azure chính xác tạm thời;
2. áp dụng `database/migrations/2026-07-27-fe10-personal-inbox-read-state.sql` hai lần với `sqlcmd -b` bằng cách sử dụng danh tính nhà điều hành đã được phê duyệt;
3. cột truy vấn/chỉ mục/chèn lấp/hậu điều kiện loại trừ nhạy cảm;
4. loại bỏ quy tắc tường lửa tạm thời;
5. phân đoạn công văn với xác nhận di chuyển đúng;
6. xác minh mức độ sẵn sàng của chương trình máy chủ/API trước khi kiểm tra frontend/browser.

Không bao giờ đặt tên máy chủ, mật khẩu, mã thông báo, hồ sơ xuất bản hoặc chuỗi kết nối vào kho lưu
trữ hoặc tệp bằng chứng.

- [ ] **Bước 4: Cập nhật kiến trúc, bản đồ tích hợp, hướng dẫn người dùng và bộ nhớ dự án đang hoạt động**

Tài liệu:

- bản ghi email -> chiếu hộp thư đến riêng -> trạng thái đọc;
- FE04/FE07/FE08 có quạt vào và loại trừ FE02/FE11 nhạy cảm;
- bốn hoạt động API và ranh giới tác nhân;
- chuông, xem trước, bộ lọc, phân trang, đánh dấu tất cả, điều hướng an toàn và hành vi lỗi;
- khôi phục giữ `ReadAt` và vô hiệu hóa/xóa chỉ sử dụng frontend/API.
- FE10 `CONTEXT.md`, `.agents/CLAUDE.md` và kế hoạch kiểm tra tổng thể phân biệt
mốc cơ sở phân phối lịch sử đã hoàn thành từ hộp thư đến phiên bản 0.5.0 đã triển khai và không còn
mô tả hộp thư đến là bị trì hoãn hoặc nằm ngoài phạm vi nữa.

- [ ] **Bước 5: Chạy di chuyển SQL dùng một lần hai lần**

Sử dụng cơ sở dữ liệu SQL cục bộ dùng một lần được đặt tên, chọn một hàng đủ điều kiện lịch sử, một
hàng nhạy cảm, một hàng không có người dùng và một hàng tương lai/hàng chưa đọc mới giữa lần chạy 1
và lần chạy 2. Áp dụng di chuyển hai lần. Khẳng định:

- một cột `ReadAt`;
- một chỉ mục được đặt tên;
- hàng đủ điều kiện lịch sử `ReadAt = CreatedAt`;
- các hàng nhạy cảm và không có người sử dụng vẫn bị loại trừ;
- hàng được chèn sau lần chạy 1 vẫn chưa được đọc sau lần chạy 2;
- không có số lượng thông báo, trạng thái gửi, lần thử hoặc thay đổi về trạng thái tạm thời.

Chỉ ghi lại bằng chứng tổng hợp không nhạy cảm, sau đó chỉ loại bỏ cơ sở dữ liệu dùng một lần được
đặt tên rõ ràng.

- [ ] **Bước 6: Chạy ma trận xác minh cục bộ đầy đủ**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:deployment
npm.cmd run test:system
npm.cmd run trace:enforce
npm.cmd run test:traceability-state
npm.cmd exec -- playwright test --project=chromium
git diff --check
git status --short
```

Dự kiến: mọi lệnh đều thoát 0; truy vết bao gồm FR-FE10-001..016; không có bí mật được tạo, tạo phẩm
xây dựng hoặc tệp người dùng không liên quan nào được tổ chức.

- [ ] **Bước 7: Thực hiện quét xung đột và bảo mật tập trung**

```powershell
rg -n "recipientEmail|safePayload|idempotencyKey|providerMessageId|lastErrorMessage|sourceFeature|sourceEntity" frontend/src backend/src/controllers/notificationController.js backend/src/docs/openapi.yaml
rg -n "ACCOUNT_VERIFICATION|PASSWORD_RESET|ACCOUNT_SETUP|EMAIL_VERIFY" backend/src/utils/notificationInbox.js backend/src/repositories/notificationRepository.js backend/tests/notificationRoutes.test.js
rg -n -i "delete notification|archive notification|global notification log|written review pending|draft v0\.5" .sdd/specs/feat-notification-management docs/superpowers/specs/2026-07-27-fe10-notification-inbox-expansion-design.md
rg -n -i "inbox UI.*deferred|User notification inbox/list UI|Inbox UI out of Phase 1 scope unless spec changes" .sdd/specs/feat-notification-management/CONTEXT.md .agents/CLAUDE.md docs/testing/master-test-plan.md
```

Dự kiến: các trường DTO bị cấm không có trong mã phản hồi frontend/inbox; số nhận dạng nhạy cảm chỉ
xuất hiện trong loại trừ rõ ràng tests/predicates; không còn mâu thuẫn phê duyệt v0.5 cũ.

- [ ] **Bước 8: Ghi lại bằng chứng và yêu cầu H2**

Cập nhật FE10 PLAN/TASKS/CHANGELOG và tạo bản ghi xác thực H2 với cam kết, lệnh, số lượt chuyển,
điều kiện sau di chuyển, kết quả bảo mật, các giới hạn đã biết và khôi phục chính xác. Không yêu cầu
môi trường tiền sản xuất hoặc H3 trước khi chúng xảy ra.

Chỉ cam kết sau khi được phê duyệt H2:

```powershell
git add docs/architecture/system-architecture.md docs/architecture/feature-integration-map.md docs/user-manual.md docs/testing/master-test-plan.md docs/deployment/azure-staging-guide.md .github/workflows/deploy-staging.yml tests/deployment/stagingWorkflowPolicy.test.js .sdd/specs/feat-notification-management/PLAN.md .sdd/specs/feat-notification-management/TASKS.md .sdd/specs/feat-notification-management/CONTEXT.md .sdd/specs/feat-notification-management/CHANGELOG.md .agents/CLAUDE.md .sdd/reviews/fe10-notification-inbox-h2-validation-2026-07-27.md
git commit -m "docs(fe10): close personal inbox h2 validation"
```

- [ ] **Bước 9: Triển khai và xác minh Môi trường tiền sản xuất Azure theo thứ tự đã được phê duyệt**

Sau khi phê duyệt CI đẩy/đầu chính xác:

1. áp dụng và xác minh quá trình di chuyển hai lần mà không có đầu ra PII/bí mật;
2. loại bỏ mọi quy tắc tường lửa tạm thời được tạo cho tác vụ;
3. đặt `FE10_INBOX_MIGRATION_SHA256` thành hàm băm tệp được xem xét chính xác;
4. gửi quy trình làm việc thủ công cho nhánh PR chính xác với xác nhận đúng;
5. xác minh `/health`, `/health/ready` và hộp thư đến ẩn danh `401`;
6. đăng nhập với tư cách là dàn MEMBER, LIBRARIAN và ADMIN và xác minh chuông/trang;
7. xác minh hai người dùng khác nhau không thể truy cập ID thông báo của nhau;
8. xác minh các hàng nhạy cảm không bao giờ liệt kê/đếm/đọc;
9. xác minh các hoạt động đọc không thay đổi tổng hợp hàng đợi/phân phối;
10. xác minh miền tùy chỉnh và nguồn gốc API CORS được trình duyệt sử dụng.

- [ ] **Bước 10: Chạy H3 dựa trên đầu được triển khai chính xác và chỉ hợp nhất khi được phê duyệt**

H3 phải so sánh việc triển khai với SPEC v0.5.0, xem xét các bộ lọc quyền sở hữu SQL và khả năng lặp
lại quá trình di chuyển, xác nhận không thể chèn đường dẫn hành động, kiểm tra hành vi lỗi giao diện
người dùng và đối chiếu bằng chứng cục bộ/CI/tổ chức. Ghi lại chính xác đầu SHA và chạy ID trong tệp
kết thúc. Chỉ hợp nhất sau khi phê duyệt H3 và thành công CI chính xác. Sau khi hợp nhất, hãy giám
sát chính xác cả CI `main` sau hợp nhất và quy trình làm việc theo giai đoạn di chuyển theo cổng băm
được kích hoạt tự động.

---

## Danh sách kiểm tra tự đánh giá cuối cùng

- [ ] Mỗi BR-FE10-014..020, FR-FE10-011..016 và AC-FE10-011..016 ánh xạ tới ít nhất một tác vụ và kiểm thử thực thi.
- [ ] Không có `TBD`, `TODO`, `PLACEHOLDER`, điểm cuối được phát minh, kênh/bảng thứ hai, xóa/lưu trữ hoặc nhật ký nhân viên toàn cầu xuất hiện trong kế hoạch này.
- [ ] Tên phương thức, tuyến đường, tên trường, cặp loại/mẫu, mã trạng thái và hình dạng phản hồi nhất quán trên SPEC, gói, máy chủ, giao diện người dùng, OpenAPI và các kiểm thử.
- [ ] Các loại nhạy cảm và `EMAIL_VERIFY` cũ không được đóng ở ranh giới danh sách, số lượng và đọc.
- [ ] Khả năng lặp lại quá trình di chuyển không chèn lấp các thông báo được tạo sau lần di chuyển đầu tiên.
- [ ] Phần máy chủ và di chuyển trước khi triển khai giao diện người dùng; hoàn tác là không phá hủy.
- [ ] Việc hoàn thành chỉ được yêu cầu từ đầu ra lệnh mới, bằng chứng trình duyệt, bằng chứng môi trường tiền sản xuất Azure, H2 và H3.
