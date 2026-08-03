# Kế hoạch triển khai kết thúc tích hợp FE10 OTP giai đoạn 2

> **Đối với nhân viên đại lý:** BẮT BUỘC SUB-SKILL: Sử dụng siêu năng lực:thực thi các kế hoạch để thực hiện kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Đóng `FE10-S05` với bằng chứng xác minh ADR-004 hoàn chỉnh, bổ sung phạm vi bảo hiểm
có mục tiêu, trạng thái SDD được đồng bộ hóa, bằng chứng PR đã hợp nhất và CI `main` sau hợp nhất
chính xác.

**Cấu trúc:** Bảo toàn trình yêu cầu thông báo trong quá trình gắn với FE02 hiện có và kiến trúc
phân phối bộ nhớ của nhà cung cấp FE10. Thêm bằng chứng mô tả đặc tính cho các trường hợp ranh giới
hiện chưa được xác định rõ, chỉ thay đổi mã sản xuất nếu một xác nhận mới cho thấy sự không tuân
thủ, sau đó sử dụng luồng hai PR để kho lưu trữ ghi lại cả sự kiện kết thúc triển khai và tích hợp
sau hợp nhất.

**bộ công nghệ công nghệ:** Node.js, Express.js, Jest, SQL Server đồ đạc hợp đồng, GitHub hành động,
GitHub CLI, Markdown SDD tệp bàn giao.

## Ràng buộc toàn cầu

- Sử dụng Hybrid SDD+ADD ở Độ sâu đầy đủ để có quyền sở hữu/bảo mật OTP và Độ sâu nhẹ để khóa chỉ bằng bằng chứng.
- FE02 sở hữu việc tạo, băm, hết hạn, thu hồi và xác thực OTP; FE10 sở hữu kết xuất, phân phối nhà cung cấp, trạng thái an toàn, số lần thử và siêu dữ liệu an toàn.
- OTP thô và nội dung nhạy cảm được hiển thị không bao giờ được phép lưu trữ lâu dài, kiểm tra, ghi nhật ký, phản hồi HTTP hoặc bằng chứng đã lưu.
- Giữ `CHANGE_PASSWORD_OTP`, chấp nhận mã thông báo cũ, thiết lập FE11, kết quả thành viên FE04, tích hợp người gọi FE09, giao diện người dùng giao diện người dùng, thông tin xác thực SMTP thực, bảng/chỉ mục lược đồ và các phần phụ thuộc mới nằm ngoài phạm vi.
- Sử dụng nhánh cây làm việc hiện tại `feat/phase2-fe10-otp-integration` dựa trên `origin/main@e89c10b`.
- Quy tắc H2 của kho lưu trữ ghi đè hướng dẫn chung về cam kết thường xuyên: giữ nguyên các thay đổi kiểm tra/bằng chứng đã tạo cho đến khi bằng chứng xác thực và khác biệt hoàn chỉnh được xem xét.
- Phê duyệt thường trực ngày 19 tháng 7 năm 2026 của người dùng cho phép thực thi nội tuyến và tất cả các hành động xem xét/hợp nhất/đóng, nhưng mọi cổng phạm vi và tự động vẫn phải vượt qua trước khi tích hợp.

---

### Nhiệm vụ 1: Khóa thiết kế đã được phê duyệt và thiết lập kiểm tra yêu cầu

**Tệp:**
- Sửa đổi: `docs/superpowers/specs/2026-07-19-phase2-fe10-otp-integration-closeout-design.md`
- Tạo: `docs/superpowers/plans/2026-07-19-phase2-fe10-otp-integration-closeout.md`

**Giao diện:**
- Tiêu thụ: Hợp đồng xác minh ADR-004 và FE10 `PLAN.md`/`TASKS.md` được phê duyệt.
- Sản xuất: thiết kế đã được phê duyệt và kế hoạch thực thi này.

- [ ] **Bước 1: Ghi nhận phê duyệt thiết kế**

Đặt trạng thái thiết kế thành `APPROVED BY USER - 2026-07-19` và ghi lại phê duyệt thường trực mà
không tuyên bố rằng quá trình xác thực hoặc tích hợp đã được thông qua.

- [ ] **Bước 2: Tự xem xét thiết kế và kế hoạch**

Chạy:

```powershell
$placeholderMatches = rg -n -i "TBD|TODO|implement later|fill in details|similar to task" docs/superpowers/specs/2026-07-19-phase2-fe10-otp-integration-closeout-design.md docs/superpowers/plans/2026-07-19-phase2-fe10-otp-integration-closeout.md | Where-Object { $_ -notmatch 'placeholderMatches|Placeholder scan' }
if ($placeholderMatches) { $placeholderMatches; throw 'Plan contains placeholders.' }
git diff --check
```

Dự kiến: không có phần giữ chỗ phù hợp và không có lỗi khác biệt.

- [ ] **Bước 3: Cam kết các nội dung quy hoạch đã được phê duyệt**

```powershell
git add -- docs/superpowers/specs/2026-07-19-phase2-fe10-otp-integration-closeout-design.md docs/superpowers/plans/2026-07-19-phase2-fe10-otp-integration-closeout.md
git commit -m "docs: approve phase2 FE10 OTP plan"
```

Dự kiến: cam kết chỉ dành cho tài liệu; cây làm việc sạch sẽ.

---

### Nhiệm vụ 2: Mở rộng quyền sở hữu FE10 và bằng chứng ranh giới HTTP

**Tệp:**
- Sửa đổi: `backend/tests/notificationRoutes.test.js`
- Kiểm tra: `backend/tests/notificationRoutes.test.js`

**Giao diện:**
- Tiêu thụ: `createSourceNotificationRequester(sourceFeature)` và `POST /api/notifications/requests`.
- Tạo ra: bằng chứng trực tiếp cho mục xác minh ADR-004 1 và 2.

- [ ] **Bước 1: Tăng cường xác nhận ghi đè nguồn HTTP**

Thay thế kiểm thử `sourceFeature` HTTP chỉ có trạng thái hiện tại bằng phản hồi chính xác và xác
nhận không có tác dụng phụ:

```js
test('rejects an allowlisted sourceFeature supplied through HTTP', async () => {
  const { app, authDependencies, notificationDependencies, emailProviderMessages } = makeTestApp();
  const admin = await createVerifiedUser({
    app,
    authDependencies,
    email: 'notif.http-source-normalization@example.test',
    role: 'ADMIN',
  });
  const auditCountBefore = authDependencies.state.auditLogs.length;

  const response = await request(app)
    .post('/api/notifications/requests')
    .set('Authorization', authHeader(admin.accessToken))
    .send({
      type: 'DUE_DATE_REMINDER',
      recipientEmail: 'reader@example.test',
      templateKey: 'DUE_DATE_REMINDER',
      templateData: { dueDate: '2026-07-20' },
      sourceFeature: ' fe07 ',
    });

  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    error: {
      code: 'SOURCE_FEATURE_HTTP_FORBIDDEN',
      message: 'Notification source cannot be supplied through HTTP.',
    },
  });
  expect(notificationDependencies.state.notifications).toHaveLength(0);
  expect(notificationDependencies.state.attempts).toHaveLength(0);
  expect(emailProviderMessages).toHaveLength(0);
  expect(authDependencies.state.auditLogs).toHaveLength(auditCountBefore);
});
```

- [ ] **Bước 2: Mở rộng phạm vi áp dụng của người yêu cầu không thuộc FE02 sang toàn bộ sản phẩm chéo trong danh sách cho phép**

Thay thế tham số hóa hai hàng hiện tại bằng:

```js
const nonFe02Sources = ['FE04', 'FE07', 'FE08', 'FE09', 'FE11', 'SYSTEM'];
const fe02SensitiveTypes = ['ACCOUNT_VERIFICATION', 'PASSWORD_RESET'];

test.each(
  fe02SensitiveTypes.flatMap((type) =>
    nonFe02Sources.map((sourceFeature) => [type, sourceFeature])
  )
)('rejects %s from the requester bound to %s', async (type, sourceFeature) => {
  const { notificationService, notificationDependencies, authDependencies, emailProviderMessages } =
    makeTestApp();
  const requester = notificationService.createSourceNotificationRequester(sourceFeature);

  await expect(
    requester.createNotificationRequest(
      makeSensitiveRequestInput({
        type,
        recipientEmail: 'reader@example.test',
        templateData: { otp: '234567', expiresInMinutes: type === 'PASSWORD_RESET' ? 15 : 1440 },
        sourceEntityId: 302,
      })
    )
  ).rejects.toMatchObject({
    statusCode: 403,
    code: 'SENSITIVE_NOTIFICATION_INTERNAL_ONLY',
    message: 'Sensitive authentication notifications must be requested internally.',
  });
  expect(notificationDependencies.state.notifications).toHaveLength(0);
  expect(notificationDependencies.state.attempts).toHaveLength(0);
  expect(authDependencies.state.auditLogs).toHaveLength(0);
  expect(emailProviderMessages).toHaveLength(0);
});
```

- [ ] **Bước 3: Chạy kiểm thử bằng chứng tập trung**

Chạy:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js
```

Dự kiến: ĐẠT. Đây là đặc điểm của hành vi đã được thực hiện; không tạo ra khác biệt sản xuất nếu nó
là GREEN có sẵn.

- [ ] **Bước 4: Nếu xác nhận không thành công, hãy thực hiện RED-GREEN**

Chỉ khi Bước 3 cho thấy sự không tuân thủ, hãy thực hiện thay đổi nhỏ nhất trong
`backend/src/services/notificationService.js` hoặc
`backend/src/validators/notificationValidators.js`, chạy lại kiểm thử lỗi chính xác, sau đó chạy lại
tệp tập trung đầy đủ. Không làm suy yếu xác nhận hoặc mở rộng API.

---

### Nhiệm vụ 3: Chứng minh việc đặt lại mật khẩu nhiều lần sẽ tạo ra sự kiện nguồn mới

**Tệp:**
- Sửa đổi: `backend/tests/authRoutes.test.js`
- Kiểm tra: `backend/tests/authRoutes.test.js`

**Giao diện:**
- Tiêu thụ: Kho lưu trữ mã thông báo FE02 `forgotPassword`, OTP và người yêu cầu FE10 được chèn vào.
- Tạo ra: bằng chứng xác minh ADR-004 trực tiếp cho ID/mã thông báo mới và không có phân phối trực tiếp trùng lặp.

- [ ] **Bước 1: Thêm kiểm thử đặc tính quên mật khẩu lặp lại**

Chèn sau kiểm thử phân phối thiết lập lại duy nhất hiện có:

```js
// @spec BR-FE02-020 BR-FE02-021 FR-FE02-011 FR-FE02-022 AC-FE02-014
test('repeated forgot-password creates a new token event and requester key without direct delivery', async () => {
  const { app, dependencies } = makeTestApp();
  const user = await dependencies.userRepository.createRegisteredUser({
    username: 'requester-reset-repeat',
    email: 'requester-reset-repeat@example.test',
    passwordHash: await bcrypt.hash('Password1!', 4),
    phoneNumber: null,
    fullName: 'Requester Reset Repeat',
  });
  await dependencies.userRepository.markEmailVerified(user.userId);

  await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: user.email })
    .expect(200);
  await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: user.email })
    .expect(200);

  const resetTokens = dependencies.state.tokens.filter(
    (item) => item.tokenType === 'PASSWORD_RESET'
  );
  expect(resetTokens).toHaveLength(2);
  expect(resetTokens[0].revokedAt).toEqual(expect.any(Date));
  expect(resetTokens[1].tokenId).not.toBe(resetTokens[0].tokenId);
  expect(dependencies.state.notificationRequests).toEqual([
    expect.objectContaining({
      type: 'PASSWORD_RESET',
      sourceEntityId: resetTokens[0].tokenId,
      idempotencyKey: `FE02:PASSWORD_RESET:${resetTokens[0].tokenId}`,
    }),
    expect.objectContaining({
      type: 'PASSWORD_RESET',
      sourceEntityId: resetTokens[1].tokenId,
      idempotencyKey: `FE02:PASSWORD_RESET:${resetTokens[1].tokenId}`,
    }),
  ]);
  expect(dependencies.state.directEmails).toHaveLength(0);
});
```

- [ ] **Bước 2: Chạy kiểm thử xác thực tập trung**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/authRoutes.test.js
```

Dự kiến: ĐẠT như hành vi đã có từ trước. Nếu thất bại, hãy giữ lại kiểm thử dưới dạng RED và chỉ
thực hiện chỉnh sửa tối thiểu do FE02 sở hữu trong `backend/src/services/authService.js` hoặc trình
trợ giúp kho lưu trữ mã thông báo của nó.

- [ ] **Bước 3: Chạy cổng tập trung vào nhiều chức năng**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js tests/authRoutes.test.js tests/integration.test.js tests/fe10OtpTemplateMigration.test.js
```

Dự kiến: tất cả các bộ và kiểm thử ĐẠT mà không có ảnh chụp nhanh hoặc lỗi bị bỏ qua.

---

### Nhiệm vụ 4: Đối chiếu bằng chứng trước khi tích hợp FE10-S05

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-auth/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-auth/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-auth/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-auth/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/CHANGELOG.md`
- Sửa đổi: `.sdd/reviews/fe10-otp-security-reconciliation-validation-2026-07-19.md`
- Sửa đổi: `docs/superpowers/specs/2026-07-19-phase2-fe10-otp-integration-closeout-design.md`

**Giao diện:**
- Tiêu thụ: Đầu ra kiểm thử của Nhiệm vụ 2-3, bằng chứng SQL cơ bản đã được hợp nhất trong PR #40 và sự chấp thuận thường trực của người dùng.
- Tạo ra: Bằng chứng sẵn sàng cho H2/H3 mà không yêu cầu sớm CI hợp nhất hoặc CI sau hợp nhất.

- [ ] **Bước 1: Cập nhật chính xác trạng thái trước khi tích hợp**

Sử dụng các ranh giới sau:

- `PLAN.md`: `FE10-S05 HUMAN ACCEPTANCE APPROVED; PR/MAIN CI PENDING`.
- `TASKS.md`: không chọn nhiệm vụ hoặc `[~]`, nhưng thay thế `FINAL HUMAN CLOSEOUT PENDING` bằng `HUMAN ACCEPTANCE APPROVED; PR/MAIN CI PENDING`.
- FE02 `PLAN.md`/`TASKS.md`: thay thế các câu lệnh đang chờ triển khai phân phối/đóng con người OTP cũ bằng `HUMAN ACCEPTANCE APPROVED; PR/MAIN CI PENDING`, trong khi vẫn giữ nguyên các ranh giới làm mới không liên quan, HTTPS, mã thông báo cũ và phạm vi tương lai.
- FE02 `CHANGELOG.md`: thêm bằng chứng tập trung và hồ sơ phê duyệt thường trực tương tự mà không yêu cầu tích hợp.
- FE02/FE10 `TEST_PLAN.md`: thay thế các tuyên bố về bộ/số lượng/khoảng trống lỗi thời bằng bằng chứng 170/916 mới và ranh giới PR/CI chính còn lại.
- `CHANGELOG.md`: thêm mục nhập 2026-07-19 mô tả bằng chứng về quyền sở hữu/sự kiện đặt lại mở rộng và sự chấp thuận thường trực.
- Đánh giá xác thực: thay thế số lượng 131/623 lỗi thời và các câu lệnh thiếu lược đồ/FE02/SQL cũ bằng các lệnh/kết quả mới; đặt L4 thành phê duyệt cho phạm vi nhà cung cấp được đưa vào trong khi vẫn đang chờ tích hợp.
- Thiết kế: ghi lại kết quả kiểm tra yêu cầu cuối cùng và mọi khoảng trống trong sản xuất hoặc kết luận `no product correction required`.

- [ ] **Bước 2: Chạy quét mâu thuẫn và rò rỉ**

```powershell
rg -n -i "shared schema.*pending|FE02 fan-in.*pending|SQL.*pending|human review pending|FINAL HUMAN CLOSEOUT PENDING|OTP delivery implementation follow-up remains pending" .sdd/specs/feat-auth .sdd/specs/feat-notification-management .sdd/reviews/fe10-otp-security-reconciliation-validation-2026-07-19.md
rg -n "verificationLink|resetLink" backend/src database/Librarymanagement.sql
rg -n "ACCOUNT_VERIFICATION|PASSWORD_RESET|EMAIL_VERIFY" backend/src/services/authService.js backend/src/services/notificationService.js database/Librarymanagement.sql
git diff --check
```

Dự kiến: không có câu lệnh cổng cũ nào đang hoạt động; mọi trận đấu `verificationLink`/`resetLink`
đều không được sản xuất; `EMAIL_VERIFY` chỉ còn lại loại mã thông báo FE02 hoặc loại trừ di sản
phòng vệ rõ ràng, không bao giờ là bí danh mẫu thông báo.

---

### Nhiệm vụ 5: Chạy xác thực H2 và xuất bản PR tích hợp

**Tệp:** Tất cả các tệp đã thay đổi từ Nhiệm vụ 2-4 cùng với các cam kết về thiết kế/kế hoạch đã
được phê duyệt.

**Giao diện:**
- Tiêu thụ: hoàn thành kiểm thử/bằng chứng khác biệt có sẵn.
- Tạo ra: một cam kết tích hợp và PR đã được xem xét.

- [ ] **Bước 1: Chạy xác thực L1 hoàn chỉnh**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
npm.cmd run test:system
npm.cmd run test:deployment
npm.cmd run test:e2e
Push-Location backend
node -e "require('yamljs').load('src/docs/openapi.yaml'); console.log('openapi ok')"
node -e "require('./src/app'); console.log('backend import ok')"
Pop-Location
git diff --check
```

Chạy trình duyệt E2E trên các cổng bị cô lập nếu mặc định bị chiếm bởi một cây làm việc khác:

```powershell
$env:E2E_FRONTEND_PORT = '4187'
$env:E2E_BACKEND_PORT = '3102'
$env:E2E_FRONTEND_URL = 'http://127.0.0.1:4187'
$env:E2E_BACKEND_URL = 'http://127.0.0.1:3102'
npm.cmd run test:e2e
```

Dự kiến: tất cả các bộ được cấu hình và kiểm tra ĐẠT. Lời khuyên về đoạn Vite không chặn đã biết có
thể vẫn còn.

- [ ] **Bước 2: Chạy kiểm tra phạm vi L2/L3**

```powershell
git diff --name-only
git diff --stat
git diff -- backend/src backend/tests .sdd/specs/feat-auth .sdd/specs/feat-notification-management .sdd/reviews docs/superpowers
rg -n -i "password\s*=|api[_-]?key|private[_-]?key|client[_-]?secret|authorization:\s*bearer" $(git diff --name-only)
```

Dự kiến: chỉ các tệp bằng chứng và kiểm thử FE10/FE02 theo kế hoạch; không có thông tin xác thực, mã
sản phẩm giao diện người dùng, trình gọi FE09, phần phụ thuộc, bảng/chỉ mục lược đồ hoặc thay đổi
hành vi của `CHANGE_PASSWORD_OTP`.

- [ ] **Bước 3: Ghi lại đánh giá H2 và xác nhận sự khác biệt chính xác**

Ghi lại kết quả băm và xác thực khác biệt trong gói đánh giá. Sau đó:

```powershell
git add -- backend/tests/notificationRoutes.test.js backend/tests/authRoutes.test.js .sdd/specs/feat-auth/PLAN.md .sdd/specs/feat-auth/TASKS.md .sdd/specs/feat-auth/TEST_PLAN.md .sdd/specs/feat-auth/CHANGELOG.md .sdd/specs/feat-notification-management/PLAN.md .sdd/specs/feat-notification-management/TASKS.md .sdd/specs/feat-notification-management/TEST_PLAN.md .sdd/specs/feat-notification-management/CHANGELOG.md .sdd/reviews/fe10-otp-security-reconciliation-validation-2026-07-19.md docs/superpowers/specs/2026-07-19-phase2-fe10-otp-integration-closeout-design.md docs/superpowers/plans/2026-07-19-phase2-fe10-otp-integration-closeout.md
git commit -m "test(fe10): close OTP integration evidence"
git push -u origin feat/phase2-fe10-otp-integration
```

- [ ] **Bước 4: Mở PR, chờ kiểm tra và hợp nhất dưới sự phê duyệt thường trực của H3**

Tạo bản nháp PR tóm tắt độ bao phủ của ADR-004 và không mở rộng phạm vi. Đánh dấu sẵn sàng sau khi
vượt qua các bước kiểm tra được yêu cầu. Xác minh đầu chính xác SHA không thay đổi, sau đó hợp nhất
với `--match-head-commit`. Ghi lại số PR, đầu cuối cùng, lần chạy PR CI, hợp nhất SHA và lần chạy CI
`main` sau hợp nhất chính xác.

---

### Nhiệm vụ 6: Xuất bản Bản kết thúc FE10-S05 cơ khí

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-auth/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-auth/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-auth/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-auth/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/CHANGELOG.md`
- Sửa đổi: `.sdd/reviews/fe10-otp-security-reconciliation-validation-2026-07-19.md`
- Sửa đổi: `.agents/CLAUDE.md` chỉ khi câu đang chờ xử lý FE10 của nó vẫn cũ sau Nhiệm vụ 5.

**Giao diện:**
- Tiêu thụ: PR tích hợp hợp nhất và `main` CI thành công chính xác.
- Tạo ra: trạng thái hoàn thành B7 gốc của kho lưu trữ cho FE10-S05.

- [ ] **Bước 1: Tạo một sơ đồ kết thúc rõ ràng từ `origin/main` đã hợp nhất**

```powershell
git fetch origin main
git -C D:\SWP391\library-management-system worktree add D:\SWP391\library-management-system\.worktrees\phase2-fe10-otp-closeout -b docs/phase2-fe10-otp-closeout origin/main
```

Xác minh `.worktrees/` vẫn bị bỏ qua và cây làm việc mới sạch sẽ.

- [ ] **Bước 2: Áp dụng các thay thế bằng chứng chính xác**

- Đánh dấu `FE10-S05` `[x] COMPLETE THROUGH B7`.
- Đánh dấu hoàn thành nhiệm vụ xác thực theo dõi phân phối FE02 OTP thông qua B7 và chỉ xóa các câu lệnh đang chờ phân phối OTP cũ.
- Đặt trạng thái hàng đầu của FE10 `PLAN.md`/`TASKS.md` thành hoàn tất cho OTP/FE02/FE04/điều chỉnh lược đồ mà không yêu cầu SMTP thực hoặc giao diện người dùng hộp thư đến.
- Ghi lại số PR tích hợp, đầu cuối SHA, PR CI, hợp nhất SHA, `main` CI sau hợp nhất, số lượng kiểm tra, truy vết, chấp nhận thường trực và các ranh giới còn lại.
- Chỉ cập nhật `.agents/CLAUDE.md` để xóa tuyên bố cũ rằng việc triển khai ADR-004/G8-G10 vẫn đang chờ xử lý.

- [ ] **Bước 3: Xác minh việc đóng máy**

```powershell
git diff --check
git diff --name-only
rg -n -i "FE10-S05|G8-G10.*pending|human.*pending|merge.*pending|main CI.*pending" .agents/CLAUDE.md .sdd/specs/feat-notification-management .sdd/reviews/fe10-otp-security-reconciliation-validation-2026-07-19.md
```

Dự kiến: không có trạng thái chờ xử lý FE10-S05/G8-G10 cũ; Các ranh giới thực tế của SMTP/hộp thư đến/FE09
bị trì hoãn vẫn rõ ràng.

- [ ] **Bước 4: Cam kết, xuất bản, hợp nhất và xác minh CI chính cuối cùng**

Cam kết dưới dạng `docs: close phase2 FE10 OTP integration`, đẩy `docs/phase2-fe10-otp-closeout`, mở
PR chỉ dành cho tài liệu, chờ kiểm tra bắt buộc, hợp nhất theo phê duyệt thường trực và giám sát
chính xác CI `main` cuối cùng. Thêm nhận xét PR liên tục có chứa ID chạy SHA và CI hợp nhất.

---

## Kết quả tự đánh giá

- Phạm vi đặc tả: Nhiệm vụ 2-3 bao gồm trực tiếp tất cả bảy mục xác minh ADR-004; các kiểm thử rò rỉ của nhà cung cấp hiện tại vẫn có hiệu lực và được thực hiện lại trong Nhiệm vụ 3 và 5.
- Phạm vi: không có kênh phân phối mới, thông tin xác thực của nhà cung cấp, bảng/chỉ mục lược đồ, giao diện người dùng, người gọi FE09, hành vi FE11/FE04 hoặc thay đổi `CHANGE_PASSWORD_OTP` được lên kế hoạch.
- Tính nhất quán của loại: Các loại/mẫu yêu cầu FE02 là các giá trị thông báo chuẩn; loại mã thông báo FE02 nội bộ `EMAIL_VERIFY` vẫn riêng biệt và không được coi là bí danh mẫu thông báo.
- Tích hợp đầy đủ: Nhiệm vụ 5 chứng minh và hợp nhất các khác biệt bằng chứng; Nhiệm vụ 6 ngăn trạng thái kho lưu trữ ở trạng thái chờ xử lý sai sau khi hợp nhất.
- Quét giữ chỗ: kế hoạch không chứa các bước điền TBD/TODO/trong tương lai; mọi hành động đều đặt tên chính xác cho các tệp, lệnh, kết quả mong đợi và hành vi cổng.

## Bàn giao thực thi

Người dùng đã phê duyệt thiết kế và được cấp phê duyệt thường trực vào ngày 19-07-2026. Thực thi nội
tuyến với `executing-plans`; không sinh ra các tác nhân phụ. Chỉ dừng lại khi xảy ra lỗi xác định
sau ngân sách thử lại cho phép, lộ bí mật hoặc xung đột hợp đồng không thể giải quyết được từ các
nguồn đã được phê duyệt.
