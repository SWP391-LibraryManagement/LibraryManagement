# Kế hoạch triển khai luồng trình diễn liên hoàn FE07/FE08/FE10/FE12

> **Đối với tác nhân thực thi:** BẮT BUỘC DÙNG KỸ NĂNG PHỤ: Sử dụng `executing-plans` để triển khai
> kế hoạch này theo từng nhiệm vụ. Không gửi đại lý phụ trừ khi người dùng rõ ràng
> yêu cầu ủy quyền. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Xây dựng một luồng trình diễn web trên máy tính liên hoàn từ yêu cầu mượn, đặt chỗ,
thông báo đến tổng quan vận hành mà không thay đổi giới hạn nghiệp vụ hiện hành,
không thêm bảng dữ liệu và không tự động xử lý hàng đợi.

**Kiến trúc:** FE07 và FE08 tiếp tục sở hữu giao dịch nguồn; FE10 nhận các
yêu cầu thông báo lũy đẳng sau khi giao dịch được ghi nhận và ánh xạ đường dẫn hành động ở máy chủ; FE12 đọc
một ảnh chụp trạng thái tổng hợp trực tiếp từ SQL Server. Giao diện chỉ trình bày trạng thái
chuẩn, hiển thị bàn giao thủ công và không tự tính KPI từ danh sách phân trang.

**Bộ công nghệ:** Node.js 22, Express 5, SQL Server/Azure SQL, Jest 30, React 19,
React Router 7, Bootstrap/CSS hiện hữu, trình chạy kiểm thử Node.js và Playwright Chromium.

## Ràng buộc toàn cầu

- ID lô: `BATCH-FE07-FE12-CONNECTED-DEMO-2026-07-29`.
- Khung nhìn chấp nhận máy tính để bàn: `1440x900`.
- Múi giờ kinh doanh: `Asia/Ho_Chi_Minh`.
- Giới hạn mượn: tối đa `5` bản sao đang mượn.
- Giới hạn mượn hằng ngày: `5` với FE04 `APPROVED`, `3` với tài khoản `MEMBER` hoạt
  động khác.
- Thời hạn mượn: `14` ngày theo lịch; giới hạn gia hạn: `1`.
- Giới hạn đặt chỗ mở: `3`; thời gian giữ để nhận sách: `2` ngày; thứ tự hàng đợi: FIFO.
- Mỗi tài khoản lưu trữ có đúng một vai trò.
- Không thêm bảng, kênh thông báo, bộ lập lịch, WebSocket, SSE, thông báo đẩy hoặc SMS.
- Không tự động xử lý FE08 khi FE07 trả sách; thủ thư phải xác nhận.
- FE10 không đạt không hoàn tác giao dịch FE07/FE08.
- FE12 chỉ đọc và không hiển thị KPI thiếu/lỗi thành số `0`.
- FE12 chỉ tính bản sao khả dụng hiệu lực khi `Books.Status = 'ACTIVE'` và
  `BookCopies.Status = 'AVAILABLE'`; sách không hoạt động không được tính vào
  `availableCopies` hoặc `lowStockBooks`.
- Không nhận hành động URL từ caller; máy chủ chỉ trả fixed relative danh sách cho phép.
- Không đưa lý do từ chối, email, token, OTP, bộ công nghệ hoặc nhà cung cấp detail vào
  tải trọng thông báo/hộp thư đến.
- Product mã nguồn của lô phải để uncommitted đến khi H2 duyệt toàn bộ khác biệt cùng
  L1-L4 bằng chứng. Chỉ quản trị activation khác biệt được bản ghi Git sau H1.
- Không stage hoặc sửa các thay đổi cục bộ có trước lô nếu chúng không nằm
  trong danh sách tệp của Nhiệm vụ hiện tại.

---

## Cấu trúc tệp

### Quản trị

- Sửa đổi: `.sdd/specs/feat-borrowing-management/{SPEC,CONTEXT,PLAN,TASKS,TEST_PLAN,CHANGELOG}.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/{SPEC,CONTEXT,PLAN,TASKS,TEST_PLAN,CHANGELOG}.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/{SPEC,CONTEXT,PLAN,TASKS,TEST_PLAN,CHANGELOG}.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/{SPEC,CONTEXT,PLAN,TASKS,TEST_PLAN,CHANGELOG}.md`
- Sửa đổi: `docs/architecture/feature-integration-map.md`
- Sửa đổi: `docs/api/api-contract.md`
- Sửa đổi: `docs/testing/master-test-plan.md`

### FE10 hợp đồng thông báo

- Tạo: `database/migrations/2026-07-29-fe10-borrowing-result-templates.sql`
- Sửa đổi: `database/Librarymanagement.sql`
- Sửa đổi: `backend/src/services/notificationService.js`
- Sửa đổi: `backend/src/utils/notificationInbox.js`
- Sửa đổi: `backend/src/repositories/notificationRepository.js`
- Sửa đổi: `backend/tests/helpers/inMemoryNotificationRepositories.js`
- Kiểm tra: `backend/tests/notificationRoutes.test.js`
- Kiểm tra: `backend/tests/notificationRepository.test.js`
- Kiểm tra: `backend/tests/notificationInboxRepository.test.js`
- Kiểm tra: `backend/tests/notificationInboxMigration.test.js`
- Kiểm tra: `frontend/test/notificationInboxFrontend.test.js`

### FE07 hành trình mượn và bàn giao

- Sửa đổi: `backend/src/services/borrowingService.js`
- Sửa đổi: `backend/src/repositories/borrowingRepository.js`
- Kiểm tra: `backend/tests/borrowingRoutes.test.js`
- Kiểm tra: `backend/tests/borrowingRepository.test.js`
- Tạo: `frontend/src/component/borrowing/BorrowingJourneyTimeline.jsx`
- Tạo: `frontend/src/utils/borrowingJourney.js`
- Sửa đổi: `frontend/src/utils/libraryFeatureViewModels.js`
- Sửa đổi: `frontend/src/page/borrowing/BorrowingHistoryPage.jsx`
- Sửa đổi: `frontend/src/page/borrowing/ProcessReturnsPage.jsx`
- Sửa đổi: `frontend/src/api/apiErrorMessages.js`
- Sửa đổi: `frontend/src/styles/app-shell.css`
- Tạo: `frontend/test/borrowingJourneyFrontend.test.js`
- Kiểm tra: `frontend/test/borrowingFrontend.test.js`
- Kiểm tra: `frontend/test/apiErrorMessages.test.js`

### FE08 bề mặt hàng đợi trung thực

- Sửa đổi: `backend/src/services/reservationService.js`
- Kiểm tra: `backend/tests/reservationService.test.js`
- Kiểm tra: `backend/tests/reservationRoutes.test.js`
- Sửa đổi: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`
- Sửa đổi: `frontend/src/utils/notificationFeedback.js`
- Kiểm tra: `frontend/test/reservationFrontend.test.js`

### FE12 tóm tắt hoạt động

- Sửa đổi: `backend/src/repositories/reportRepository.js`
- Sửa đổi: `backend/src/services/reportService.js`
- Sửa đổi: `backend/src/controllers/reportController.js`
- Sửa đổi: `backend/src/routes/reportRoutes.js`
- Sửa đổi: `backend/src/validators/reportValidators.js`
- Sửa đổi: `backend/tests/helpers/inMemoryReportRepositories.js`
- Sửa đổi: `backend/tests/helpers/systemIntegrationHarness.js`
- Kiểm tra: `backend/tests/reportRepository.test.js`
- Kiểm tra: `backend/tests/reportService.test.js`
- Kiểm tra: `backend/tests/reportRoutes.test.js`
- Kiểm tra: `backend/tests/reportContract.test.js`
- Sửa đổi: `frontend/src/api/libraryFeatureApi.js`
- Sửa đổi: `frontend/src/page/dashboard/dashboardViewModel.js`
- Sửa đổi: `frontend/src/page/dashboard/RoleDashboardPage.jsx`
- Kiểm tra: `frontend/test/appShellFrontend.test.js`
- Kiểm tra: `frontend/test/reportOperationalFrontend.test.js`

### Bằng chứng đa chức năng

- Sửa đổi liên tục trong các tác vụ của sản phẩm: `backend/src/docs/openapi.yaml`.
- Sửa đổi: `backend/tests/systemIntegration.test.js`
- Sửa đổi: `tests/e2e/support/systemTestServer.js`
- Tạo: `tests/e2e/fe07-fe12-connected-demo-flow.spec.js`
- Sửa đổi: `docs/user-manual.md`
- Sửa đổi: `docs/testing/system-integration-demo-runbook.md`
- Sửa đổi: bốn tệp chức năng `TEST_PLAN.md`, `TASKS.md` và `CHANGELOG.md`
  được liệt kê trong Quản trị với bằng chứng chính xác sau khi thực hiện.

---

### Nhiệm vụ 1: Kích hoạt thiết kế đã được phê duyệt trong SDD và đạt H1

**Tệp:**

- Sửa đổi: tất cả các tệp Quản trị được liệt kê ở trên.
- Sửa đổi: `docs/superpowers/specs/2026-07-29-fe07-fe08-fe10-fe12-connected-demo-flow-design.md`

**Giao diện:**

- Tiêu thụ: bản sửa đổi thiết kế đã được phê duyệt được xuất bản trong PR #80 trên nhánh
  `codex/impl-fe07-fe12-connected-demo-flow`.
- Sản xuất: các phiên bản được phê duyệt FE07 `0.9.0`, FE08 `0.6.0`, FE10 `0.6.0`,
FE12 `0.3.0`; hợp đồng lô `BATCH-FE07-FE12-CONNECTED-DEMO-2026-07-29`.

- [x] **Bước 1: Phân bổ ID yêu cầu ổn định và ghi phân xuất SPEC**

  Thêm các ID và định nghĩa chính xác sau:

  ```text
  FE07
  BR-FE07-035 thông báo kết quả mượn sau giao dịch có tính lũy đẳng và không chặn luồng chính
  BR-FE07-036 phản hồi trả sách chỉ được cung cấp bàn giao FE08 thủ công ở chế độ chỉ đọc
  BR-FE07-037 dòng thời gian hành trình chỉ dùng trạng thái/dấu thời gian chuẩn
  FR-FE07-040 thông báo yêu cầu được phê duyệt/từ chối
  FR-FE07-041 thông báo gia hạn/trả sách
  FR-FE07-042 DTO trả về `reservationQueueAction`
  FR-FE07-043 dòng thời gian hành trình thành viên
  FR-FE07-044 hướng dẫn khi dữ liệu cũ hoặc có điều kiện chặn
  AC-FE07-033..036 ánh xạ tới AT-002, AT-003, AT-004, AT-009

  FE08
  BR-FE08-021 chỉ chủ sở hữu lượt giữ `NOTIFIED` mới thấy nút mượn bản sao đang được giữ
  BR-FE08-022 lỗi thông báo được hiển thị trung thực mà không hoàn tác lượt giữ
  FR-FE08-036 nút mượn bản sao đang giữ và bàn giao đúng bản sao
  FR-FE08-037 màn hình quyết định cho nhân viên và xử lý thủ công
  FR-FE08-038 DTO cảnh báo thông báo
  FR-FE08-039 làm mới dữ liệu khi gặp phản hồi 409 do trạng thái cũ
  AC-FE08-023..025 ánh xạ tới AT-005, AT-007, AT-008/AT-009

  FE10
  BR-FE10-021 quyền sở hữu `GENERAL_SYSTEM` được kiểm tra theo từng mẫu, không chỉ theo loại
  BR-FE10-022 các bản ghi kết quả mượn trong hộp thư chỉ ánh xạ tới `/borrowing/history`
  BR-FE10-023 dữ liệu gửi của kết quả mượn không chứa lý do từ chối hoặc dữ liệu nhạy cảm
  FR-FE10-017 chấp nhận bốn mẫu `GENERAL_SYSTEM` của FE07
  FR-FE10-018 lưu/phát lại mỗi khóa nguồn đúng một lần
  FR-FE10-019 đưa bốn mẫu vào điều kiện hiển thị của hộp thư cá nhân
  FR-FE10-020 trả về đường dẫn hành động mượn cố định
  AC-FE10-017..020 ánh xạ tới AT-002, AT-003, AT-006, AT-009

  FE12
  BR-FE12-017 bản tóm tắt vận hành là một ảnh chụp nhanh chỉ đọc đã được cấp quyền
  BR-FE12-018 sáu định nghĩa KPI khớp với các trạng thái nguồn chuẩn
  BR-FE12-019 KPI bị thiếu/lỗi không bao giờ được hiển thị thành số không
  BR-FE12-020 mọi phép chiếu quá hạn dùng cùng một ngày nghiệp vụ do dịch vụ sở hữu
  FR-FE12-012 GET /api/reports/operations-summary
  FR-FE12-013 thực thi vai trò nhân viên và danh sách cho phép truy vấn rỗng
  FR-FE12-014 phép chiếu KPI xác định, `generatedAt` và ngày nghiệp vụ được truyền vào
  FR-FE12-015 đường dẫn xem chi tiết cố định từ bảng điều khiển
  AC-FE12-012..016 ánh xạ tới AT-010..AT-013 và hành vi khi KPI bị lỗi
  ```

- [x] **Bước 2: Đồng bộ hóa CONTEXT, CHANGELOG, bản đồ tích hợp và hợp đồng API**

Ghi lại điểm cuối và phản hồi chính xác trong SDD và `docs/api/api-contract.md`. Không xuất bản
đường dẫn mới trong thời gian chạy OpenAPI cho đến khi Nhiệm vụ 6 triển khai tuyến đường phù hợp;
lược đồ trả về FE07 được thêm vào OpenAPI với Nhiệm vụ 3.

  ```yaml
  /api/reports/operations-summary:
    get:
      security: [{ bearerAuth: [] }]
      parameters: []
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                required:
                  - pendingBorrowRequests
                  - activeLoans
                  - overdueLoans
                  - openReservations
                  - availableCopies
                  - lowStockBooks
                  - generatedAt
  ```

  Ghi lại thành viên trả về FE07 phụ gia:

  ```json
  {
    "reservationQueueAction": {
      "copyId": 123,
      "hasActiveQueue": true,
      "actionPath": "/librarian/reservations"
    }
  }
  ```

- [x] **Bước 3: Viết ranh giới PLAN/TASKS và hợp đồng H1**

  Sử dụng các lát cắt và quyền sở hữu này:

  ```text
  SL-001 kích hoạt quản trị
  SL-002 hợp đồng và mẫu FE10
  SL-003 sự kiện nguồn FE07, dòng thời gian và bàn giao sau khi trả sách
  SL-004 giao diện hàng đợi/nhận sách trung thực của FE08
  SL-005 bản tóm tắt vận hành FE12
  SL-006 bằng chứng trình duyệt liên chức năng và môi trường tiền sản xuất Azure
  ```

Đặt một làn đường xây dựng cốt lõi duy nhất. Các làn khác vẫn ở chế độ chỉ đọc trừ khi người dùng
yêu cầu ủy quyền một cách rõ ràng.

- [x] **Bước 4: Chạy xác thực quản trị**

  Chạy:

  ```powershell
  npm run trace:enforce
  npm run test:traceability-state
  git diff --check
  ```

Dự kiến: cả hai lệnh theo dõi đều thoát `0`; kiểm tra khác biệt trống; xem xét tài liệu thủ công
không tìm thấy nội dung yêu cầu nào chưa được giải quyết.

- [x] **Bước 5: Dừng để xem xét H1 của con người**

H1 và phụ lục được xem xét của nó đã được Nhật phê duyệt vào ngày 29-07-2026. Công việc sản phẩm vẫn
bị chặn cho đến khi PR kích hoạt này hợp nhất.

- [x] **Bước 6: Cam kết và chỉ xuất bản kích hoạt quản trị đã được H1 xem xét**

  Sáu H1:

  ```powershell
  git add -- .sdd/specs/feat-borrowing-management .sdd/specs/feat-reservation-management .sdd/specs/feat-notification-management .sdd/specs/feat-reporting-statistics docs/architecture/feature-integration-map.md docs/api/api-contract.md docs/testing/master-test-plan.md docs/superpowers/specs/2026-07-29-fe07-fe08-fe10-fe12-connected-demo-flow-design.md docs/superpowers/plans/2026-07-29-fe07-fe08-fe10-fe12-connected-demo-flow.md
  git diff --cached --check
  git commit -m "docs: activate connected circulation demo batch"
  ```

PR #80 chỉ dành cho quản trị đã được xuất bản. Biện pháp khắc phục H3 loại bỏ cam kết chỉ dành cho
kiểm thử trái phép, sửa lỗi sai lệch nguồn gốc sự thật và yêu cầu phụ lục sai lệch H1 được xem xét
trước khi cam kết thay thế của nó được đẩy.

---

### Nhiệm vụ 2: Mở rộng FE10 với các mẫu kết quả vay do FE07 sở hữu

**Tệp:**

- Tạo/Sửa đổi/Kiểm tra: Các tệp FE10 được liệt kê trong Cấu trúc tệp.

**Giao diện:**

- Tiêu thụ:
  `notificationService.createSourceNotificationRequester('FE07')`.
- Sản xuất:

  ```js
  GENERAL_SYSTEM_TEMPLATES = new Set([
    'MEMBERSHIP_RESULT',
    'BORROW_REQUEST_APPROVED',
    'BORROW_REQUEST_REJECTED',
    'BORROW_RENEWED',
    'BORROW_RETURNED',
  ]);
  ```

  Mỗi hàng mới thuộc sở hữu của FE07 trả về `actionPath: '/borrowing/history'`.

- [x] **Bước 1: Viết các kiểm thử quyền sở hữu nguồn và cặp chuẩn không thành công**

  Thêm các trường hợp điều khiển theo bảng vào `backend/tests/notificationRoutes.test.js`:

  ```js
  test.each([
    'BORROW_REQUEST_APPROVED',
    'BORROW_REQUEST_REJECTED',
    'BORROW_RENEWED',
    'BORROW_RETURNED',
  ])('accepts FE07 GENERAL_SYSTEM template %s exactly once', async (templateKey) => {
    const requester = notificationService.createSourceNotificationRequester('FE07');
    const payload = {
      type: 'GENERAL_SYSTEM',
      templateKey,
      userId: member.userId,
      sourceEntityType: 'BorrowRequest',
      sourceEntityId: 91,
      idempotencyKey: `FE07:${templateKey}:91`,
      templateData: templateDataFor(templateKey),
    };
    const first = await requester.createNotificationRequest(payload);
    const replay = await requester.createNotificationRequest(payload);
    expect(replay.notificationId).toBe(first.notificationId);
  });
  ```

Thêm các trường hợp tiêu cực chứng minh FE04 không thể gửi bốn mẫu FE07, FE07 không thể gửi
`MEMBERSHIP_RESULT` và HTTP công khai không thể cung cấp nguồn `GENERAL_SYSTEM` bị ràng buộc.

- [x] **Bước 2: Chạy kiểm thử RED FE10**

  Chạy:

  ```powershell
  npm --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js tests/notificationRepository.test.js tests/notificationInboxRepository.test.js
  ```

  Dự kiến: THẤT BẠI vì các mẫu mới không chuẩn/được chọn/đủ điều kiện.

- [x] **Bước 3: Triển khai quyền sở hữu chuẩn theo từng mẫu**

  Tái cấu trúc các hằng số FE10 để duy trì quyền sở hữu chính xác:

  ```js
  const canonicalTemplateKeys = {
    ACCOUNT_VERIFICATION: new Set(['ACCOUNT_VERIFICATION']),
    PASSWORD_RESET: new Set(['PASSWORD_RESET']),
    ACCOUNT_SETUP: new Set(['ACCOUNT_SETUP']),
    RESERVATION_AVAILABLE: new Set(['RESERVATION_READY']),
    DUE_DATE_REMINDER: new Set(['DUE_DATE_REMINDER']),
    OVERDUE_NOTICE: new Set(['OVERDUE_NOTICE']),
    FINE_NOTICE: new Set(['FINE_NOTICE']),
    GENERAL_SYSTEM: new Set([
      'MEMBERSHIP_RESULT',
      'BORROW_REQUEST_APPROVED',
      'BORROW_REQUEST_REJECTED',
      'BORROW_RENEWED',
      'BORROW_RETURNED',
    ]),
  };

  const generalSystemTemplateOwners = {
    MEMBERSHIP_RESULT: 'FE04',
    BORROW_REQUEST_APPROVED: 'FE07',
    BORROW_REQUEST_REJECTED: 'FE07',
    BORROW_RENEWED: 'FE07',
    BORROW_RETURNED: 'FE07',
  };
  ```

  Thay thế đẳng thức vô hướng bằng:

  ```js
  if (!canonicalTemplateKeys[type]?.has(templateKey)) {
    throw errors.badRequest(
      'CANONICAL_TEMPLATE_MISMATCH',
      'Notification type and template key do not match.'
    );
  }

  if (type === 'GENERAL_SYSTEM') {
    const owner = generalSystemTemplateOwners[templateKey];
    if (!isInternal || effectiveSourceFeature !== owner) {
      throw errors.forbidden(
        'NOTIFICATION_SOURCE_OWNER_MISMATCH',
        'Notification template is not owned by this source.'
      );
    }
  }
  ```

- [x] **Bước 4: Thêm tính đủ điều kiện của hộp thư đến và ánh xạ hành động cố định**

  Thêm bốn mục `ACTION_MAPPINGS`:

  ```js
  ...[
    'BORROW_REQUEST_APPROVED',
    'BORROW_REQUEST_REJECTED',
    'BORROW_RENEWED',
    'BORROW_RETURNED',
  ].map((templateKey) => ({
    type: 'GENERAL_SYSTEM',
    templateKey,
    sourceFeatures: ['FE07'],
    actionPath: '/borrowing/history',
  }))
  ```

Thêm các cặp chính xác tương tự vào `INBOX_ELIGIBILITY_SQL` và `inboxTypeTemplatePairs` trong bộ nhớ.

- [x] **Bước 5: Thêm di chuyển mẫu Azure SQL idempotent và hạt giống cơ sở**

  Việc di chuyển phải nâng cao các định nghĩa chính xác sau:

  ```sql
  VALUES
    ('BORROW_REQUEST_APPROVED', N'Yêu cầu mượn đã được duyệt',
      N'Yêu cầu mượn #{{requestId}} đã được duyệt. Hạn trả: {{dueDate}}.'),
    ('BORROW_REQUEST_REJECTED', N'Yêu cầu mượn đã bị từ chối',
      N'Yêu cầu mượn #{{requestId}} đã bị từ chối.'),
    ('BORROW_RENEWED', N'Khoản mượn đã được gia hạn',
      N'Khoản mượn #{{borrowDetailId}} đã được gia hạn đến {{dueDate}}.'),
    ('BORROW_RETURNED', N'Đã ghi nhận trả sách',
      N'Khoản mượn #{{borrowDetailId}} đã được ghi nhận trả với trạng thái {{returnStatus}}.');
  ```

Sử dụng một giao dịch, `SET XACT_ABORT ON` và cập nhật hoặc chèn cho mỗi `TemplateCode`. Thêm các
hàng tương tự vào `database/Librarymanagement.sql`.

- [x] **Bước 6: Chạy GREEN FE10 và kiểm tra di chuyển**

  Chạy:

  ```powershell
  npm --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js tests/notificationRepository.test.js tests/notificationInboxRepository.test.js tests/notificationInboxMigration.test.js
  node --test --test-name-pattern="notification" frontend/test/*.test.js
  git diff --check
  ```

Dự kiến: vượt qua các kiểm thử FE10 backend/frontend tập trung; xác nhận phát lại di chuyển đã vượt
qua; kiểm tra khác biệt trống rỗng.

- [x] **Bước 7: Ghi điểm kiểm tra lát bánh mà không cần nhập mã sản phẩm**

Lưu lệnh RED/GREEN và xuất ra trong FE10 `TEST_PLAN.md`/`TASKS.md`. Để lại các thay đổi sản phẩm
không được cam kết cho H2.

---

### Nhiệm vụ 3: Phát ra thông báo kết quả FE07 và chuyển giao trả sách có thẩm quyền

**Tệp:**

- Sửa đổi/Kiểm tra: Các tệp máy chủ FE07 được liệt kê trong Cấu trúc tệp.

**Giao diện:**

- Tiêu thụ: Hợp đồng mẫu FE10 của Nhiệm vụ 2.
- Sản xuất:

  ```js
  {
    borrowRequest,
    notificationWarning?: { code, message }
  }

  {
    borrowDetail,
    fineCandidate,
    reservationQueueAction: {
      copyId: number,
      hasActiveQueue: boolean,
      actionPath: '/librarian/reservations'
    },
    notificationWarning?: { code, message }
  }
  ```

- [x] **Bước 1: Viết kiểm thử dịch vụ/tuyến đường không thành công cho cả bốn sự kiện nguồn**

  Ghi lại cuộc gọi của người yêu cầu và khẳng định:

  ```js
  expect(notificationRequests).toContainEqual(expect.objectContaining({
    type: 'GENERAL_SYSTEM',
    templateKey: 'BORROW_REQUEST_APPROVED',
    sourceEntityType: 'BorrowRequest',
    sourceEntityId: requestId,
    idempotencyKey: `FE07:BORROW_REQUEST_APPROVED:${requestId}`,
  }));
  ```

Lặp lại cho từ chối, gia hạn và trả sách. Xác nhận tải trọng bị từ chối không bao gồm `reason`;
khiến người yêu cầu loại bỏ và chứng minh trạng thái nguồn đã cam kết được giữ nguyên trong khi phản
hồi chứa `notificationWarning` an toàn.

- [x] **Bước 2: Viết kiểm thử kho lưu trữ không thành công để tìm bằng chứng về hàng đợi bị khóa**

Xác nhận giao dịch trả sách đọc `Reservations` theo `UPDLOCK, HOLDLOCK` và chỉ ánh xạ `trạng thái =
'ACTIVE'` tới `authoritativeReturn.hasActiveQueue`.

- [x] **Bước 3: Chạy kiểm thử máy chủ RED FE07**

  Chạy:

  ```powershell
  npm --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js
  ```

Dự kiến: THẤT BẠI khi thiếu yêu cầu kết quả FE07 và thiếu `reservationQueueAction`.

- [x] **Bước 4: Triển khai một trình trợ giúp người yêu cầu sau cam kết an toàn**

  Thêm:

  ```js
  async function requestBorrowingResultNotification({
    templateKey,
    userId,
    recipientEmail,
    sourceEntityType,
    sourceEntityId,
    idempotencyKey,
    templateData,
  }) {
    try {
      await notificationRequester.createNotificationRequest({
        type: 'GENERAL_SYSTEM',
        channel: 'EMAIL',
        templateKey,
        userId,
        recipientEmail,
        sourceEntityType,
        sourceEntityId,
        idempotencyKey,
        templateData,
      });
      return null;
    } catch {
      return {
        code: 'BORROW_NOTIFICATION_REQUEST_FAILED',
        message: 'Nghiệp vụ đã hoàn tất nhưng thông báo chưa được tạo.',
      };
    }
  }
  ```

  Chỉ gọi nó sau khi thao tác ghi kho lưu trữ được giải quyết thành công.

- [x] **Bước 5: Lưu giữ bằng chứng xếp hàng bên trong giao dịch hoàn trả**

  Thay thế truy vấn khóa đặt chỗ bị loại bỏ bằng:

  ```js
  const reservationQueueResult = await new sql.Request(transaction)
    .input('CopyId', sql.Int, lockedDetail.CopyId)
    .query(`
      SELECT ReservationId, Status
      FROM Reservations WITH (UPDLOCK, HOLDLOCK)
      WHERE CopyId = @CopyId
        AND Status IN ('ACTIVE', 'NOTIFIED');
    `);

  authoritativeReturn.hasActiveQueue = reservationQueueResult.recordset
    .some((row) => row.Status === 'ACTIVE');
  ```

  Chiếu phản hồi của dịch vụ bằng đường dẫn do máy chủ sở hữu:

  ```js
  reservationQueueAction: {
    copyId: authoritativeReturn.copyId,
    hasActiveQueue: Boolean(authoritativeReturn.hasActiveQueue),
    actionPath: '/librarian/reservations',
  }
  ```

- [x] **Bước 6: Chạy kiểm thử máy chủ GREEN FE07**

  Chạy:

  ```powershell
  npm --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js tests/notificationRoutes.test.js
  git diff --check
  ```

Dự kiến: tất cả các dãy tập trung đều đạt; thao tác ghi thành công tồn tại thất bại thông báo; không có
lý do từ chối nào xuất hiện trong tải trọng liên tục/yêu cầu.

- [x] **Bước 7: Ghi điểm kiểm tra lát bánh mà không cần nhập mã sản phẩm**

  Cập nhật bằng chứng FE07 `TEST_PLAN.md`/`TASKS.md` và để lại mã không được cam kết.

---

### Nhiệm vụ 4: Thêm dòng thời gian hành trình trên máy tính để bàn FE07 và chuyển giao quay lại hàng đợi

**Tệp:**

- Tạo/Sửa đổi/Kiểm tra: Các tệp giao diện FE07 được liệt kê trong Cấu trúc tệp.

**Giao diện:**

- Tiêu thụ: DTO phản hồi của Nhiệm vụ 3.
- Sản xuất:

  ```js
  buildBorrowingJourney(row) -> Array<{
    key: string,
    label: string,
    state: 'complete' | 'current' | 'pending',
    at: string | null
  }>
  ```

- [x] **Bước 1: Viết các kiểm thử mô hình chế độ xem thuần túy thất bại**

  Thêm trường hợp:

  ```js
  assert.deepEqual(
    buildBorrowingJourney({
      requestStatus: 'REJECTED',
      rawStatus: 'REQUESTED',
      requestDate: '2026-07-29T01:00:00Z',
      processedAt: '2026-07-29T02:00:00Z',
    }).map(({ label, state }) => ({ label, state })),
    [
      { label: 'Đã gửi yêu cầu', state: 'complete' },
      { label: 'Đã từ chối', state: 'current' },
    ],
  );
  ```

  Thêm các trường hợp BORROWED và RETURNED và xác nhận dấu thời gian bị thiếu vẫn là `null`.

- [x] **Bước 2: Chạy kiểm thử giao diện người dùng RED**

  Chạy:

  ```powershell
  node --test --test-name-pattern="borrowing journey|return queue handoff" frontend/test/*.test.js
  ```

  Dự kiến: THẤT BẠI vì trình trợ giúp/thành phần hành trình và giao diện người dùng chuyển giao không tồn tại.

- [x] **Bước 3: Triển khai thành phần dòng thời gian và phép chiếu hàng chuẩn**

  Bảo toàn các thành viên thô này trong `mapBorrowDetailsToHistoryRows`:

  ```js
  rawStatus: String(detail.status || '').toUpperCase(),
  requestStatus: String(detail.requestStatus || '').toUpperCase(),
  requestDate: detail.requestDate || detail.createdAt || null,
  approvedAt: detail.approvedAt || null,
  processedAt: detail.processedAt || null,
  createdAt: detail.createdAt || null,
  updatedAt: detail.updatedAt || null,
  ```

  Render an ordered list với `aria-label={`Hành trình ${row.title}`}`. Do not
  tổng hợp dấu thời gian hoặc suy ra một bước đã hoàn thành từ thời gian của khách hàng.

- [x] **Bước 4: Thực hiện cảnh báo chuyển giao trả sách và thông báo trung thực**

  Trong `ProcessReturnsPage`:

  ```js
  const navigate = useNavigate();
  const [queueHandoff, setQueueHandoff] = useState(null);

  const handoff = result.reservationQueueAction;
  setQueueHandoff(handoff?.hasActiveQueue ? handoff : null);

  if (result.notificationWarning) {
    showToast(result.notificationWarning.message, 'warning');
  }
  ```

  Hiển thị bảng điều khiển sau thành công liên tục bằng nút:

  ```jsx
  <button
    type="button"
    className="btn btn-primary"
    onClick={() => navigate(queueHandoff.actionPath, {
      state: { copyId: queueHandoff.copyId },
    })}
  >
    Xử lý hàng đợi đặt chỗ
  </button>
  ```

  Xác thực đường dẫn máy chủ theo chữ cố định trước khi điều hướng.

- [x] **Bước 5: Mở rộng bản sao chặn và hướng dẫn cũ**

Thêm `BORROW_STATE_CONFLICT` và cập nhật các thông báo xung đột FE07 để mỗi thông báo 409 yêu cầu
người dùng tải lại, từ chối yêu cầu cũ, giải quyết các khoản phạt/mục quá hạn hoặc xử lý hàng đợi
FE08 nếu thích hợp. Không bao giờ hiển thị tin nhắn thô máy chủ.

- [x] **Bước 6: Thêm máy tính để bàn CSS**

  Sử dụng các lớp tập trung:

  ```css
  .borrow-journey { display: flex; align-items: flex-start; gap: 10px; min-width: 320px; }
  .borrow-journey__step { min-width: 0; flex: 1; }
  .return-queue-handoff { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  ```

Không thay đổi độ rộng/chỉ mục z của cửa sổ bật lên thông báo hoặc thêm thiết kế lại dành riêng cho
thiết bị di động trong đợt này.

- [x] **Bước 7: Chạy kiểm thử giao diện người dùng GREEN FE07**

  Chạy:

  ```powershell
  node --test --test-name-pattern="borrowing|api error" frontend/test/*.test.js
  npm --prefix frontend run lint
  npm --prefix frontend run build
  git diff --check
  ```

  Dự kiến: các kiểm thử tập trung, kiểm tra mã và bản dựng sản xuất đã vượt qua.

- [x] **Bước 8: Ghi điểm kiểm tra lát bánh mà không cần nhập mã sản phẩm**

  Cập nhật tệp bằng chứng FE07; không cam kết thực hiện.

---

### Nhiệm vụ 5: Làm cho quá trình xử lý hàng đợi FE08 trở nên trung thực trong trạng thái cảnh báo và cũ

**Tệp:**

- Sửa đổi/Kiểm tra: Các tệp FE08 được liệt kê trong Cấu trúc tệp.

**Giao diện:**

- Tiêu thụ: `processQueue(copyId)` hiện có và CTA được giữ lại.
- Sản xuất:

  ```js
  {
    selectedReservation,
    notificationWarning?: {
      code: 'RESERVATION_NOTIFICATION_REQUEST_FAILED'
          | 'RESERVATION_NOTIFY_AUDIT_FAILED',
      message: string
    }
  }
  ```

- [x] **Bước 1: Viết các kiểm thử cách ly cảnh báo máy chủ không thành công**

  Làm cho người yêu cầu ném đi trong khi kiểm tra thành công và khẳng định:

  ```js
  expect(result.selectedReservation.status).toBe('NOTIFIED');
  expect(result.notificationWarning).toEqual({
    code: 'RESERVATION_NOTIFICATION_REQUEST_FAILED',
    message: 'The reservation hold was created, but the notification request failed.',
  });
  ```

  Duy trì cảnh báo lỗi kiểm tra mạnh mẽ hơn khi cả hai thao tác đều thất bại.

- [x] **Bước 2: Viết các kiểm thử cảnh báo/cũ ở giao diện người dùng không thành công**

  Khẳng định `ReservationsLibrarianPage`:

  ```js
  if (result.notificationWarning) {
    showToast(result.notificationWarning.message, 'warning');
  }
  if (error?.cause?.response?.status === 409) {
    await loadReservations();
  }
  ```

  Đồng thời giữ lại tình trạng CTA hiện có:

  ```jsx
  item.rawStatus === 'NOTIFIED' && item.bookId
  ```

  và liên kết chính xác với cả `bookId` và `copyId`.

- [x] **Bước 3: Chạy kiểm thử RED FE08**

  Chạy:

  ```powershell
  npm --prefix backend test -- --runTestsByPath tests/reservationService.test.js tests/reservationRoutes.test.js
  node --test --test-name-pattern="reservation" frontend/test/*.test.js
  ```

Dự kiến: kiểm tra cảnh báo không thành công vì lỗi yêu cầu hiện bị ẩn khi kiểm tra thành công; xác
nhận tải lại cũ không thành công.

- [x] **Bước 4: Thực hiện vô số cảnh báo an toàn**

Luôn đặt cảnh báo lỗi yêu cầu sau khi cam kết giữ. Nếu kiểm tra cũng không thành công, hãy thay thế
nó bằng `RESERVATION_NOTIFY_AUDIT_FAILED`. Giữ cảnh báo bên ngoài `selectedReservation`; chỉ phơi
bày nó ở phong bì phản hồi.

- [x] **Bước 5: Triển khai cảnh báo giao diện người dùng và làm mới 409**

Sau khi giữ thành công, chỉ hiển thị thành công khi không có cảnh báo nào tồn tại. Khi có cảnh báo,
hãy nói rằng việc giữ đã thành công nhưng thông báo chưa được tạo. Trên 409, tải lại dữ liệu đặt chỗ
chuẩn trước khi đóng xác nhận.

- [x] **Bước 6: Chạy kiểm thử GREEN FE08**

  Chạy:

  ```powershell
  npm --prefix backend test -- --runTestsByPath tests/reservationService.test.js tests/reservationRoutes.test.js
  node --test --test-name-pattern="reservation|notification feedback" frontend/test/*.test.js
  git diff --check
  ```

Dự kiến: các bộ FE08 tập trung đã vượt qua và không có lỗi thông báo khôi phục trạng thái giữ `NOTIFIED`.

- [x] **Bước 7: Ghi điểm kiểm tra lát bánh mà không cần nhập mã sản phẩm**

  Cập nhật tệp bằng chứng FE08; không cam kết thực hiện.

---

### Nhiệm vụ 6: Thêm bản tóm tắt hoạt động chỉ đọc và bảng điều khiển trên máy tính để bàn của FE12

**Tệp:**

- Sửa đổi/Kiểm tra: Các tệp FE12 được liệt kê trong Cấu trúc tệp.

**Giao diện:**

- Tiêu thụ: bảng SQL chuẩn và `formatBusinessDate(clock())`.
- Sản xuất:

  ```js
  getOperationsSummary(businessDate) -> {
    pendingBorrowRequests: number,
    activeLoans: number,
    overdueLoans: number,
    openReservations: number,
    availableCopies: number,
    lowStockBooks: number
  }
  ```

  HTTP thêm `generatedAt` từ đồng hồ dịch vụ.

- [x] **Bước 1: Viết các kiểm thử kho lưu trữ/dịch vụ/tuyến đường bị lỗi**

  Khẳng định nội dung chính xác:

  ```js
  expect(response.body).toEqual({
    pendingBorrowRequests: 1,
    activeLoans: 2,
    overdueLoans: 1,
    openReservations: 2,
    availableCopies: 3,
    lowStockBooks: 2,
    generatedAt: '2026-07-29T03:00:00.000Z',
  });
  ```

Thêm ma trận vai trò cho `LIBRARIAN=200`, `ADMIN=200`, `MEMBER=403`, `401` chưa được xác thực. Thêm
`?bogus=secret` => `400` trước lệnh gọi kho lưu trữ và chứng minh các nguồn cố định vẫn không thay
đổi từng byte. Trước tiên, hãy thêm hồi quy cơ sở: với đồng hồ dịch vụ bị đóng băng ở `2026-07-14`,
ngày đáo hạn của `2026-07-28` vẫn là `BORROWED` trong cả các dự báo báo cáo trong bộ nhớ và hợp đồng
SQL ngay cả khi ngày lưu trữ muộn hơn.

- [x] **Bước 2: Chạy kiểm thử máy chủ RED FE12**

  Chạy:

  ```powershell
  npm --prefix backend test -- --runTestsByPath tests/reportRepository.test.js tests/reportService.test.js tests/reportRoutes.test.js tests/reportContract.test.js
  ```

  Dự kiến: THẤT BẠI vì các phương thức điểm cuối/kho lưu trữ/dịch vụ không tồn tại.

- [x] **Bước 3: Triển khai ảnh chụp nhanh SQL chỉ đọc được tham số hóa**

  Thêm một truy vấn kho lưu trữ bằng `@BusinessDate`:

  ```sql
  SELECT
    (SELECT COUNT_BIG(*) FROM BorrowRequests WHERE Status = 'PENDING')
      AS PendingBorrowRequests,
    (SELECT COUNT_BIG(*) FROM BorrowDetails WHERE Status = 'BORROWED')
      AS ActiveLoans,
    (SELECT COUNT_BIG(*) FROM BorrowDetails
      WHERE Status = 'BORROWED' AND DueDate < @BusinessDate)
      AS OverdueLoans,
    (SELECT COUNT_BIG(*) FROM Reservations
      WHERE Status IN ('ACTIVE', 'NOTIFIED'))
      AS OpenReservations,
    (SELECT COUNT_BIG(*)
      FROM BookCopies bc
      JOIN Books b ON b.BookId = bc.BookId
      WHERE b.Status = 'ACTIVE' AND bc.Status = 'AVAILABLE')
      AS AvailableCopies,
    (SELECT COUNT_BIG(*)
      FROM Books b
      WHERE b.Status = 'ACTIVE'
        AND (
        SELECT COUNT_BIG(*)
        FROM BookCopies bc
        WHERE bc.BookId = b.BookId AND bc.Status = 'AVAILABLE'
      ) BETWEEN 0 AND 2)
      AS LowStockBooks;
  ```

  Ánh xạ tất cả các giá trị SQL `BIGINT` thông qua `Number(...)`. Không chấp nhận bộ lọc thô.

- [x] **Bước 4: Thêm dịch vụ/bộ điều khiển/tuyến/trình xác thực**

  Dịch vụ:

  ```js
  async function getOperationsSummary(actor, context = {}) {
    requireStaff(actor);
    const generatedAt = clock();
    const summary = await reportRepository.getOperationsSummary(
      formatBusinessDate(generatedAt)
    );
    await writeAudit(context, 'REPORT_OPERATIONS_SUMMARY_VIEW', {
      userId: actor.userId,
      metadata: successMetadata('OPERATIONS_SUMMARY'),
    });
    return { ...summary, generatedAt: generatedAt.toISOString() };
  }
  ```

Áp dụng cùng một quy tắc đồng hồ một lần đọc cho báo cáo mượn hiện có: `getBorrowingReport()` phải
tính toán `businessDate` trong dịch vụ và chuyển nó một cách rõ ràng đến kho lưu trữ của nó. Mặc
định kho lưu trữ dựa trên `new Date()` bị cấm phân loại quá hạn.

  Lộ trình:

  ```js
  router.get(
    '/operations-summary',
    ...staffOnly,
    operationsSummaryValidators,
    controller.operationsSummary
  );
  ```

  Trình xác nhận phải chính xác:

  ```js
  const operationsSummaryValidators = [
    rejectUnsupportedQueryParameters([]),
    handleValidationErrors,
  ];
  ```

- [x] **Bước 5: Triển khai tính chẵn lẻ trong bộ nhớ**

  Mở rộng chữ ký của người trợ giúp mà không vi phạm các kiểm thử chỉ báo cáo:

  ```js
  function makeInMemoryReportDependencies(
    authState,
    borrowingState,
    reservationState = { reservations: [] }
  ) {
  ```

Đếm từ cùng một `borrowingState` và `reservationState` do `systemIntegrationHarness.js` cung cấp.
Không sao chép rồi thay đổi đồ đạc; trả về một đối tượng đơn giản mới. Cả báo cáo vay mượn hiện tại
và tóm tắt hoạt động đều phải sử dụng đối số `businessDate` rõ ràng để tính chẵn lẻ trong bộ nhớ
không thể trôi theo đồng hồ máy chủ.

- [x] **Bước 6: Chạy kiểm thử máy chủ GREEN FE12**

  Chạy:

  ```powershell
  npm --prefix backend test -- --runTestsByPath tests/reportRepository.test.js tests/reportService.test.js tests/reportRoutes.test.js tests/reportContract.test.js tests/reportInMemoryParity.test.js
  ```

  Dự kiến: tất cả các bộ báo cáo tập trung đều đạt.

- [x] **Bước 7: Viết các kiểm thử tóm tắt giao diện người dùng không thành công**

  Xác nhận API và xem mô hình:

  ```js
  assert.match(apiSource, /operationsSummary\\(\\)/);
  assert.deepEqual(buildStaffSummary({
    pendingBorrowRequests: 1,
    activeLoans: 2,
    overdueLoans: 1,
    openReservations: 3,
    availableCopies: 4,
    lowStockBooks: 2,
  }).map((item) => item.value), [1, 2, 1, 3, 4, 2]);
  ```

  Thêm trường hợp thiếu trường có giá trị thẻ là `null`, không bao giờ là `0`.

- [x] **Bước 8: Thay thế phân bổ bảng điều khiển nhân viên bằng bản tóm tắt FE12**

  Giữ nguyên hành vi của trang tổng quan Thành viên. Đối với nhân viên:

  ```js
  const request = audience === 'member'
    ? Promise.all([borrowingApi.listMine(), reservationApi.listMine()])
    : reportApi.operationsSummary();
  ```

  Xây dựng sáu thẻ cố định:

  ```js
  [
    ['Yêu cầu chờ duyệt', 'pendingBorrowRequests', '/librarian/borrow-requests'],
    ['Đang mượn', 'activeLoans', '/reports/borrowing'],
    ['Quá hạn', 'overdueLoans', '/reports/borrowing'],
    ['Đặt chỗ đang mở', 'openReservations', '/librarian/reservations'],
    ['Bản sao sẵn có', 'availableCopies', '/reports/inventory'],
    ['Sắp hết', 'lowStockBooks', '/reports/inventory'],
  ]
  ```

Kết xuất `Không tải được` cho giá trị `null` và cung cấp chức năng thử lại trên mỗi thẻ bằng cách
tải lại một ảnh chụp nhanh. Không lấy số đếm từ các hàng được phân trang.

- [x] **Bước 9: Chạy kiểm thử giao diện người dùng GREEN FE12**

  Chạy:

  ```powershell
  node --test --test-name-pattern="report|dashboard|app shell" frontend/test/*.test.js
  npm --prefix frontend run lint
  npm --prefix frontend run build
  git diff --check
  ```

  Dự kiến: kiểm tra giao diện người dùng tập trung, tìm lỗi mã nguồn và xây dựng.

- [x] **Bước 10: Ghi điểm kiểm tra lát bánh mà không cần nhập mã sản phẩm**

  Cập nhật tệp bằng chứng FE12; không cam kết thực hiện.

---

### Nhiệm vụ 7: Chứng minh luồng được kết nối bằng các kiểm thử tích hợp và trình duyệt trên máy tính để bàn

**Tệp:**

- Sửa đổi/Tạo: Các tệp bằng chứng đa chức năng được liệt kê trong Cấu trúc Tệp.

**Giao diện:**

- Tiêu thụ: Nhiệm vụ 2-6.
- Tạo ra: một lịch thi đấu xác định và đường dẫn trình duyệt:

  ```text
  FE07 PENDING
  -> FE07 BORROWED + FE10 BORROW_REQUEST_APPROVED
  -> FE08 ACTIVE
  -> FE07 RETURNED + reservationQueueAction
  -> FE08 NOTIFIED + FE10 RESERVATION_READY
  -> FE07 BORROWED + FE08 FULFILLED
  -> bản tóm tắt vận hành FE12 khớp với trạng thái nguồn cuối cùng
  ```

- [x] **Bước 1: Viết kiểm thử tích hợp đa chức năng máy chủ không thành công**

Mở rộng `backend/tests/systemIntegration.test.js` để sử dụng Thành viên A, Thành viên B và Thủ thư.
Xác nhận trạng thái nguồn và số lượng thông báo sau mỗi lần chuyển đổi. Chụp nhanh thân máy FE12
trước và sau; khẳng định không có thông báo trùng lặp sau khi phát lại yêu cầu nguồn giống hệt nhau.

- [x] **Bước 2: Chạy kiểm thử hệ thống RED**

  Chạy:

  ```powershell
  npm --prefix backend run test:integration:system
  ```

Dự kiến: trường hợp kết nối mới không thành công cho đến khi tất cả các lát cắt được nối vào khai
thác trong bộ nhớ dùng chung.

- [x] **Bước 3: Mở rộng dây nịt E2E xác định**

  Chỉ thêm người trợ giúp thiết lập trong `/__e2e__/` cho:

  ```js
  {
    memberAUserId,
    memberBUserId,
    librarianUserId,
    copyId,
    bookId
  }
  ```

Sử dụng các lộ trình sản xuất cho mọi thao tác ghi kinh doanh. Các điểm cuối chỉ khai thác có thể chọn
ngày tháng hoặc kiểm tra trạng thái; họ không được thực hiện thao tác ghi đang được kiểm tra.

- [x] **Bước 4: Viết dòng vàng Playwright lên desktop**

  Đặt:

  ```js
  await page.setViewportSize({ width: 1440, height: 900 });
  ```

  Xác minh:

  ```text
  Thành viên A tạo yêu cầu mượn.
  Thủ thư phê duyệt.
  Thành viên A mở kết quả FE10 và được dẫn tới `/borrowing/history`.
  Thành viên B đặt chỗ bản sao đang được mượn.
  Thủ thư trả bản sao và dùng thao tác bàn giao hàng đợi đang hiển thị.
  Thủ thư xử lý hàng đợi FIFO.
  Thành viên B mở `RESERVATION_READY`, thấy thời hạn `NOTIFIED` và tạo yêu cầu mượn đúng bản sao.
  Thủ thư phê duyệt yêu cầu đó; đặt chỗ chuyển thành `FULFILLED`.
  Trang `/home` của Thủ thư hiển thị các KPI FE12 khớp với ảnh chụp nhanh cuối cùng từ máy chủ.
  documentElement.scrollWidth <= documentElement.clientWidth.
  bảng điều khiển trình duyệt không có lỗi ngoài dự kiến.
  ```

- [x] **Bước 5: Chạy kiểm thử trình duyệt và tích hợp GREEN**

  Chạy:

  ```powershell
  npm --prefix backend run test:integration:system
  npx playwright test tests/e2e/fe07-fe12-connected-demo-flow.spec.js --project=chromium
  ```

  Dự kiến: cả hai đều đạt `1440x900`.

- [x] **Bước 6: Cập nhật tài liệu người dùng/bản demo**

  Thêm các tuyến đường, vai trò, dữ liệu thiết lập, số lần nhấp chuột và chuyển đổi trạng thái dự
  kiến chính xác vào:

  ```text
  docs/user-manual.md
  docs/testing/system-integration-demo-runbook.md
  ```

Nêu rõ rằng Môi trường tiền sản xuất Azure sử dụng Azure SQL và chỉ riêng `/health` không phải là
bằng chứng về luồng kinh doanh.

- [x] **Bước 7: Chạy cổng xác minh cục bộ đầy đủ**

  Chạy:

  ```powershell
  npm --prefix backend test
  npm --prefix backend run test:coverage:ci
  npm --prefix frontend test
  npm --prefix frontend run lint
  npm --prefix frontend run build
  npm run test:system
  npm run test:deployment
  npm run test:traceability-state
  npm run trace:enforce
  npm run schema:azure:prepare
  git diff --check
  ```

Dự kiến: mọi lệnh đều thoát `0`; phạm vi bảo hiểm máy chủ vẫn ở trên các nhánh/chức năng/dòng/câu
lệnh `80%` toàn cầu; khả năng truy vết vẫn ở mức hoặc cao hơn `70%`; Lược đồ tương thích Azure được
tạo mà không cần tạo/chuyển đổi cơ sở dữ liệu.

- [x] **Bước 8: Ghi lại bằng chứng L1-L4 đầy đủ và dừng xét nghiệm H2**

Ghi lại số lượng chính xác, đầu ra lệnh, đường dẫn ảnh chụp màn hình trình duyệt, hàm băm di chuyển
và khác biệt cục bộ hoàn chỉnh. Không thực hiện giai đoạn hoặc cam kết triển khai sản phẩm trước khi
người dùng phê duyệt H2.

---

### Nhiệm vụ 8: Cam kết H2, PR, hợp nhất H3 và xác minh Môi trường tiền sản xuất Azure

**Tệp:**

- Sửa đổi: chỉ chức năng `TASKS.md`, `TEST_PLAN.md`, `CHANGELOG.md` chính xác
  thay thế bằng chứng được cho phép bởi H3.

**Giao diện:**

- Tiêu thụ: bằng chứng L1-L4 và khác biệt cục bộ được H2 xem xét đầy đủ.
- Tạo ra: PR chính xác, `main` được hợp nhất, CI sau hợp nhất chính xác và môi trường tiền sản xuất Azure
  bằng chứng chống lại Azure SQL.

- [x] **Bước 1: Trình bày gói H2**

  Bao gồm:

  ```text
  nhánh và bản ghi Git cơ sở
  danh sách đầy đủ các tệp đã thay đổi
  git diff --check result
  lệnh và số lượng RED/GREEN theo từng lát triển khai
  kết quả đầy đủ của máy chủ/giao diện/độ bao phủ/lint/bản dựng/hệ thống
  kết quả kiểm tra khả năng truy vết
  SHA-256 của tệp di chuyển dữ liệu
  bằng chứng Playwright ở kích thước 1440x900
  xác nhận các giới hạn đã biết và nội dung ngoài phạm vi
  ```

- [ ] **Bước 2: Giai đoạn chỉ xem xét các tệp lô sau khi được phê duyệt H2**

  Chạy:

  ```powershell
  git add -- backend/src backend/tests frontend/src frontend/test database docs .sdd tests/e2e
  git diff --cached --check
  git diff --cached --name-only
  ```

Xóa mọi tệp có sẵn không liên quan khỏi chỉ mục trước khi xác nhận. Dự kiến: danh sách theo giai
đoạn khớp chính xác với gói H2.

- [ ] **Bước 3: Cam kết và đẩy mức chênh lệch chính xác được H2 đánh giá**

  Chạy:

  ```powershell
  git commit -m "feat: connect borrowing reservation notifications and reporting"
  git push -u origin feat/connected-circulation-flow
  ```

Mở một PR dự thảo, đợi CI được yêu cầu, sau đó chỉ đánh dấu sẵn sàng khi phần đầu chính xác không
thay đổi và các bước kiểm tra đã vượt qua.

- [ ] **Bước 4: Dừng để xem xét tích hợp H3**

Xem lại các trục Tiêu chuẩn và đặc tả, khả năng hợp nhất PR, kiểm tra bắt buộc, hướng dẫn di chuyển
lược đồ, quét bí mật và đầu chính xác SHA. Không hợp nhất cho đến khi người dùng chấp thuận rõ ràng
H3.

- [ ] **Bước 5: Hợp nhất và theo dõi CI sau hợp nhất chính xác**

  Sáu H3:

  ```text
  hợp nhất PR đã được rà soát
  ghi lại SHA hợp nhất
  chờ CI chạy trên đúng SHA của `main`
  chờ triển khai môi trường tiền sản xuất trên đúng SHA của `main`
  ```

  Đừng coi hoạt động xanh của một cam kết khác là bằng chứng.

- [ ] **Bước 6: Áp dụng/xác minh quy trình di chuyển và môi trường tiền sản xuất Azure SQL**

Sử dụng quá trình di chuyển tạm thời đã được đánh giá dựa trên cơ sở dữ liệu môi trường tiền sản
xuất Azure SQL đã được định cấu hình thông qua quy trình triển khai hiện có. Xác minh di chuyển hai
lần, sau đó chạy:

  ```powershell
  npm run smoke:staging
  ```

Thực thi luồng vai trò trực tiếp được giới hạn trên giao diện Azure Static Web Apps và máy chủ Azure
App Service. Xác nhận các hàng trong hộp thư đến FE10, chuyển bàn giao đợi thủ công FE08 và các giá
trị FE12 KPI từ Azure SQL; `/health` chỉ là cổng vào.

- [ ] **Bước 7: Chỉ đóng bằng chứng sau khi môi trường tiền sản xuất thành công chính xác**

Ghi lại số PR, phê duyệt H2/H3, người đứng đầu triển khai, hợp nhất SHA, chạy CI chính xác, chạy
Azure chính xác, hàm băm di chuyển và xác minh trực tiếp có giới hạn. Nếu bất kỳ bước kiểm tra bắt
buộc hoặc bước kinh doanh trực tiếp nào không thành công, hãy giữ lô ở trạng thái mở và báo cáo ranh
giới thất bại chính xác.

---

## Tự xem xét

### Phạm vi bảo hiểm đặc tả

- AT-001/AT-002/AT-003: Nhiệm vụ 2-4.
- AT-004: Nhiệm vụ 3-4.
- AT-005/AT-006/AT-007/AT-008/AT-009: Nhiệm vụ 2, 3 và 5.
- AT-010/AT-011: Nhiệm vụ 6.
- AT-012: Nhiệm vụ 7.
- Azure SQL và môi trường tiền sản xuất sự thật: Nhiệm vụ 8.

### Quét giữ chỗ

Kế hoạch chỉ định đường dẫn tệp chính xác, tên API, ID yêu cầu, lệnh, thành viên phản hồi, khóa mẫu,
đường dẫn hành động và kết quả mong đợi. Nó không chứa điểm đánh dấu triển khai bị trì hoãn.

### Tính nhất quán của loại

- `reservationQueueAction.copyId` là số nguyên dương nối đầu.
- `reservationQueueAction.hasActiveQueue` là boolean.
- `reservationQueueAction.actionPath` luôn là
  `/librarian/reservations`.
- FE10 đường dẫn hành động cho tất cả bốn mẫu kết quả FE07 luôn
  `/borrowing/history`.
- FE12 Các trường KPI là các số ở ranh giới máy chủ và chỉ `number | null`
trong mô hình chế độ xem giao diện người dùng để thể hiện các trường không hợp lệ/bị thiếu mà không
có số 0 sai.
- `generatedAt` là dấu thời gian của máy chủ ISO-8601.
