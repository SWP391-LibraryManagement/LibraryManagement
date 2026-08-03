# Kế hoạch thực hiện khắc phục gửi email theo giai đoạn

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Khôi phục việc gửi email thiết lập tài khoản FE11, duy trì ID tin nhắn SMTP an toàn
cho các lần gửi nhạy cảm và loại bỏ các thông báo không nhạy cảm đang chờ xử lý thông qua nhân viên
chọn tham gia trong quá trình xử lý trên môi trường tiền sản xuất Azure.

**Kiến trúc:** Giữ FE10 làm chủ sở hữu phân phối duy nhất. Thêm một lần di chuyển dữ liệu tạm thời,
bảo toàn kết quả của nhà cung cấp hiện tại trong quá trình chuyển đổi thiết bị đầu cuối nhạy cảm,
tách vòng phân phối được xếp hàng đợi phía sau trình bao bọc con người và hệ thống, sau đó chạy nó
thông qua một nhân viên được quản lý vòng đời nhỏ. Điểm cuối thủ công được bảo vệ hiện tại và tất cả
các DTO công khai vẫn không thay đổi.

**bộ công nghệ công nghệ:** Node.js 22, CommonJS, Express 5, Jest 30, SQL Server T-SQL, Azure App
Dịch vụ F1, Nodemailer SMTP.

## Ràng buộc toàn cầu

- mốc cơ sở triển khai là `origin/main` tại
  `ca69dc87badf4d1056c0a63d97e5e411fb4cbd68`.
- Chỉ làm việc ở
`D:\SWP391\library-management-system\.worktrees\fix-staging-email-delivery` trên nhánh
`codex/fix-staging-email-delivery`.
- Theo dõi RED -> GREEN -> REFACTOR để biết mọi thay đổi về sản xuất.
- Giữ nguyên các thay đổi triển khai do AI tạo cho đến khi hoàn tất các thay đổi cục bộ
  Bằng chứng khác biệt và L1-L4 nhận được sự chấp thuận của con người H2.
- Không đẩy, xuất bản PR, hợp nhất hoặc thay đổi gói Azure mà không có
  cổng dự án tương ứng.
- `ACCOUNT_SETUP` vẫn đồng bộ, thuộc sở hữu của FE11 và chỉ dành cho bộ nhớ của nhà cung cấp.
- Thông báo `FAILED` vẫn chỉ được thử lại theo cách thủ công.
- Nhân viên chỉ có thể yêu cầu các hàng `PENDING` không nhạy cảm.
- SYSTEM là tác nhân nội bộ, không bao giờ là vai trò đăng nhập giả tạo.
- Giá trị mặc định của nhân viên bị vô hiệu hóa, 60.000 ms và kích thước lô 20.
- Nhân viên F1 nỗ lực hết sức trong khi phần máy chủ còn hoạt động; không yêu cầu
  lịch trình được đảm bảo.
- Chỉ duy trì `providerMessageId`, không bao giờ có phản hồi đầy đủ của nhà cung cấp.
- Không bao giờ in hoặc cam kết thông tin xác thực SMTP, chuỗi kết nối, người nhận PII,
  OTP, mã thông báo, liên kết thiết lập hoặc nội dung nhạy cảm được hiển thị.
- Giữ nguyên việc xuất ứng dụng Express trực tiếp từ `backend/src/index.js`.
- Không thêm phần phụ thuộc, tuyến đường, trường phản hồi công khai, loại thông báo,
  hoặc các đối tượng lược đồ cơ sở dữ liệu.

---

## Cấu trúc tệp

| Tập tin | Trách nhiệm |
| --- | --- |
| `.sdd/specs/feat-notification-management/SPEC.md` | Ghi lại hợp đồng nhân viên v0.4.5 đã được phê duyệt và hợp đồng bằng chứng bàn giao. |
| `.sdd/specs/feat-notification-management/PLAN.md` | Thêm kế hoạch khắc phục theo yêu cầu và ranh giới cổng. |
| `.sdd/specs/feat-notification-management/TASKS.md` | Kích hoạt FE10-S12 thông qua FE10-S16 bằng quyền sở hữu bằng chứng và kiểm thử. |
| `.sdd/specs/feat-notification-management/CHANGELOG.md` | Ghi lại hợp đồng khắc phục đã được phê duyệt mà không yêu cầu thực hiện. |
| `database/migrations/2026-07-27-fe10-account-setup-template.sql` | Hoàn toàn nâng cấp mẫu `ACCOUNT_SETUP` đang hoạt động chuẩn. |
| `backend/src/services/notificationService.js` | Bảo toàn các ID nhà cung cấp nhạy cảm và hiển thị bộ xử lý hàng đợi hệ thống có giới hạn xây dựng. |
| `backend/src/services/notificationWorker.js` | Hỗ trợ nhân viên riêng, lập kế hoạch, bảo vệ chồng chéo, xử lý lỗi an toàn và dừng hành vi. |
| `backend/src/serverRuntime.js` | Ghép nối tín hiệu khởi động/dừng máy chủ HTTP với vòng đời của nhân viên mà không thay đổi quá trình xuất Express. |
| `backend/src/config/env.js` | Phân tích cú pháp và xác thực cài đặt của nhân viên. |
| `backend/src/index.js` | Soạn công việc/thời gian chạy mặc định và giữ lại `module.exports = app`. |
| `backend/.env.example` | Tài liệu mặc định của nhân viên không bí mật. |
| `backend/tests/notificationRepository.test.js` | Xác minh hình dạng di chuyển và đồng bộ hóa mốc cơ sở chuẩn. |
| `backend/tests/notificationRoutes.test.js` | Chứng minh tính bền vững của ID nhà cung cấp, xử lý hệ thống, nhận dạng kiểm tra an toàn và ủy quyền HTTP không thay đổi. |
| `backend/tests/notificationWorker.test.js` | Chứng minh hành vi bị tắt/bật, khởi động, ngắt quãng, chồng chéo, khôi phục lỗi và dừng. |
| `backend/tests/serverRuntime.test.js` | Chứng minh nhân viên bắt đầu sau khi nghe và dừng trên SIGTERM/SIGINT. |
| `backend/tests/envConfig.test.js` | Chứng minh mặc định của nhân viên và xác thực số nguyên dương. |
| `.sdd/reviews/staging-email-delivery-remediation-validation-2026-07-27.md` | Ghi lại RED/GREEN cục bộ, toàn bộ, di chuyển theo giai đoạn, triển khai và bằng chứng thời gian chạy an toàn. |

---

### Nhiệm vụ 1: Kích hoạt Hợp đồng khắc phục FE10 đã được phê duyệt

**Tệp:**

- Sửa đổi: `.sdd/specs/feat-notification-management/SPEC.md:1-35,70-190,430-475`
- Sửa đổi: `.sdd/specs/feat-notification-management/PLAN.md:1-20,260-end`
- Sửa đổi: `.sdd/specs/feat-notification-management/TASKS.md:1-20,296-end`
- Sửa đổi: `.sdd/specs/feat-notification-management/CHANGELOG.md:1`

**Giao diện:**

- Tiêu thụ: thiết kế đã được phê duyệt
  `docs/superpowers/specs/2026-07-27-staging-email-delivery-remediation-design.md`.
- Tạo ra: SPEC v0.4.5 và ID tác vụ `FE10-S12` đến `FE10-S16`.

- [ ] **Bước 1: Cập nhật tiêu đề SPEC và quyết định được phê duyệt**

Đặt tiêu đề thành:

```markdown
# Phiên bản: 0.4.5

# Trạng thái: ĐÃ PHÊ DUYỆT - KHẮC PHỤC GỬI EMAIL TIỀN SẢN XUẤT 2026-07-27
```

Nối ghi chú sửa đổi hiện tại này trước quy tắc ngang đầu tiên:

```markdown
> Bản sửa đổi v0.4.5 khôi phục ba nghĩa vụ bàn giao đã được phê duyệt trước đó:
> cơ sở dữ liệu hiện có nhận được mẫu `ACCOUNT_SETUP` chuẩn thông qua một
> di cư bình thường; gửi nhạy cảm thành công chỉ giữ lại nhà cung cấp
> ID tin nhắn trong lịch sử thử; và một quy trình công nhân SYSTEM chọn tham gia được xếp hàng đợi
> Bản ghi `PENDING` không nhạy cảm trong khi phần máy chủ vẫn hoạt động. Được bảo vệ
> điểm cuối thủ công và chính sách thử lại chỉ thủ công vẫn không thay đổi. Trên sân khấu
> Kế hoạch F1, lịch trình này rõ ràng là nỗ lực tốt nhất vì Luôn bật bị tắt.
> Người sử dụng đã phê duyệt thiết kế và văn bản hợp đồng vào ngày 27-07-2026.
```

Thêm quyết định đã được phê duyệt này sau `Q-FE10-012` hiện có:

```markdown
|Q-FE10-013|Giai đoạn sử dụng một công cụ SYSTEM được chọn tham gia trong quá trình với khoảng thời gian mặc định là 60 giây và kích thước lô 20. Nó chạy một lần sau khi khởi động, ngăn các thẻ cục bộ chồng chéo, chỉ xử lý các hàng `PENDING` không nhạy cảm và dừng với máy chủ HTTP. Điểm cuối của nhân viên hiện tại vẫn được bảo vệ và việc thử lại `FAILED` vẫn được thực hiện thủ công. Giấc ngủ F1 tạm dừng công nhân.|Phê duyệt của người dùng và thiết kế bằng văn bản 2026-07-27|ĐÃ ĐƯỢC PHÊ DUYỆT|
```

Mở rộng văn bản phân phối/cố gắng có liên quan bằng:

```markdown
- Kết quả của nhà cung cấp thành công chỉ tồn tại ở trạng thái chuẩn hóa
  `providerMessageId` trong `NotificationAttempts`; không có phản hồi đầy đủ của nhà cung cấp,
  nội dung nhạy cảm, mã thông báo, OTP, liên kết thiết lập hoặc nội dung người nhận được hiển thị
  được sao chép vào nội dung kiểm tra, nhật ký, HTTP hoặc nội dung thông báo.
- Quá trình xử lý SYSTEM tự động được xây dựng và ghi kiểm tra tổng hợp
  siêu dữ liệu với `UserId = NULL`; nó không bao giờ tạo ra một Quản trị viên hoặc Thủ thư.
```

- [ ] **Bước 2: Thêm PLAN phần 14**

Nối thêm:

```markdown
## 14. Khắc phục gửi email tiền sản xuất V0.4.5

Thiết kế được phê duyệt:
`docs/superpowers/specs/2026-07-27-staging-email-delivery-remediation-design.md`.

1. Thêm và xác minh quá trình di chuyển bình thường cho hoạt động chính tắc
   Mẫu `ACCOUNT_SETUP`; không xây dựng lại hoặc xóa cơ sở dữ liệu hiện có.
2. Ghi lại kết quả của nhà cung cấp nhạy cảm và chỉ tồn tại
   `providerMessageId` thông qua giao dịch `markSent` được bảo vệ hiện có.
3. Trích xuất vòng phân phối được xếp hàng đợi hiện có phía sau lõi riêng chung.
   Bảo quản trình bao bọc được nhân viên ủy quyền và thêm SYSTEM có giới hạn xây dựng
   trình bao bọc có siêu dữ liệu kiểm tra tổng hợp của người dùng null.
4. Thêm nhân viên chọn tham gia với thẻ khởi động ngay lập tức, mặc định 60 giây
   khoảng thời gian, kích thước lô 20, bảo vệ chồng chéo, mã lỗi an toàn và hành vi dừng.
5. Kết nối nhân viên với vòng đời HTTP máy chủ mà không thay đổi trực tiếp
   Xuất ứng dụng Express hoặc bắt đầu tính giờ khi nhập mô-đun.
6. Duy trì việc triển khai đã tạo cho đến khi xác thực tập trung/đầy đủ,
   quét bí mật, kiểm tra an toàn theo giai đoạn và vượt qua đánh giá H2.
```

- [ ] **Bước 3: Thêm TASKS phần 14**

Nối thêm:

```markdown
## 14. Khắc phục gửi email tiền sản xuất

### FE10-S12 Kích hoạt hợp đồng khắc phục đã duyệt

- [x] Trạng thái: DESIGN AND WRITTEN CONTRACT ĐƯỢC PHÊ DUYỆT 27-07-2026
- Tệp: thiết kế đã được phê duyệt và FE10 SPEC/PLAN/TASKS/CHANGELOG.
- DoD: v0.4.5 ghi lại quá trình di chuyển, bằng chứng ID nhà cung cấp an toàn, nhân viên SYSTEM,
  giới hạn F1 nỗ lực tối đa, ủy quyền HTTP không thay đổi và thử lại thủ công.

### FE10-S13 Khôi phục mẫu thiết lập tài khoản cho cơ sở dữ liệu hiện có

- [ ] Trạng thái: CHƯA BẮT ĐẦU
- Phụ thuộc vào: FE10-S12.
- Tập tin: `database/migrations/2026-07-27-fe10-account-setup-template.sql`,
  `backend/tests/notificationRepository.test.js`.
- DoD: di chuyển là giao dịch, bình thường, bổ sung, chuẩn và vượt qua
  hai lần thực thi với chính xác một hàng `ACCOUNT_SETUP` đang hoạt động.

### FE10-S14 Bảo toàn ID thông điệp nhạy cảm của nhà cung cấp

- [ ] Trạng thái: CHƯA BẮT ĐẦU
- Phụ thuộc vào: FE10-S12.
- Tập tin: `backend/src/services/notificationService.js`,
  `backend/tests/notificationRoutes.test.js`.
- DoD: Các lần thử thành công nhạy cảm của FE02 và FE11 chỉ lưu trữ thông báo bộ điều hợp
  ID trong khi tính lưu giữ, kiểm tra, nhật ký và phản hồi vẫn không có thông tin xác thực.

### FE10-S15 Bổ sung tiến trình SYSTEM nỗ lực tối đa

- [ ] Trạng thái: CHƯA BẮT ĐẦU
- Phụ thuộc vào: FE10-S12.
- Các tập tin: dịch vụ thông báo/worker/thời gian chạy/config/index, `.env.example` và
  kiểm tra dịch vụ/công nhân/thời gian chạy/cấu hình tập trung.
- DoD: bật khởi động và chuyển khoảng thời gian không bị chồng chéo; chế độ vô hiệu hóa
  không có bộ đếm thời gian; khắc phục sự cố an toàn; dừng xóa lịch trình; chỉ
  các hàng `PENDING` không nhạy cảm được xử lý; ủy quyền HTTP thủ công là
  không thay đổi.

### FE10-S16 Đạt xác nhận H2 cục bộ và tiền sản xuất

- [ ] Trạng thái: CHƯA BẮT ĐẦU
- Phụ thuộc vào: FE10-S13..S15.
- Tập tin: FE10 TASKS/CHANGELOG và
  `.sdd/reviews/staging-email-delivery-remediation-validation-2026-07-27.md`.
- DoD: vượt qua các cổng kiểm tra tập trung và đầy đủ; quá trình di cư diễn ra hai lần; khác biệt/bảo mật
  lượt xem xét; H2 phê duyệt cam kết; mẫu môi trường tiền sản xuất/cài đặt công nhân/triển khai
  và bằng chứng xếp hàng an toàn/nhà cung cấp cố gắng được ghi lại mà không có bí mật hoặc PII.
```

- [ ] **Bước 4: Thêm mục CHANGELOG**

Thêm vào trước:

```markdown
## 2026-07-27 - Phê duyệt khắc phục gửi email tiền sản xuất (v0.4.5)

- Yêu cầu nâng cấp cơ sở dữ liệu hiện có bình thường cho hoạt động chính tắc
  Mẫu `ACCOUNT_SETUP`.
- Yêu cầu gửi nhạy cảm thành công để chỉ giữ lại tin nhắn của nhà cung cấp SMTP
  ID trong lịch sử thử.
- Đã phê duyệt nhân viên SYSTEM được quản lý vòng đời, chọn tham gia cho các hoạt động không nhạy cảm
  Các hàng `PENDING` có giá trị mặc định là 60 giây và 20 hàng.
- Bảo tồn xử lý thủ công được bảo vệ, thử lại không thành công chỉ bằng tay, nhạy cảm
  phân phối đồng bộ, DTO tối thiểu và thông tin xác thực chỉ dành cho bộ nhớ của nhà cung cấp.
- Đã ghi lại rằng Azure App Service F1 tạm dừng nhân viên trong khi ứng dụng ở chế độ ngủ.
- Người dùng đã phê duyệt thiết kế và văn bản hợp đồng vào ngày 27-07-2026; thực hiện
  vẫn chưa được xác nhận đang chờ xử lý bằng chứng RED/GREEN và H2.
```

- [ ] **Bước 5: Xác thực chênh lệch kích hoạt quản trị**

Chạy:

```powershell
rg -n "0\\.4\\.5|Q-FE10-013|FE10-S1[2-6]|NOTIFICATION_WORKER|best-effort" `
  .sdd/specs/feat-notification-management `
  docs/superpowers/specs/2026-07-27-staging-email-delivery-remediation-design.md
git diff --check
npm run trace:enforce
```

Dự kiến: tất cả ID/cài đặt mới đều được tìm thấy, `git diff --check` không báo cáo gì và việc thực
thi truy vết đã vượt qua.

- [ ] **Bước 6: Dừng để xem xét H1 và chỉ xuất bản kích hoạt quản trị đã được đánh giá**

Các tệp được xem xét dự kiến ​​chỉ có bốn tệp FE10 SDD. Sau khi H1 cho phép khác biệt chính xác:

```powershell
git add -- `
  .sdd/specs/feat-notification-management/SPEC.md `
  .sdd/specs/feat-notification-management/PLAN.md `
  .sdd/specs/feat-notification-management/TASKS.md `
  .sdd/specs/feat-notification-management/CHANGELOG.md
git commit -m "docs: activate FE10 email delivery remediation"
```

Xuất bản cam kết chỉ dành cho quản trị đối với PR dự thảo, yêu cầu kiểm tra và dừng ở H3. Sau khi
phê duyệt và hợp nhất H3 rõ ràng:

```powershell
git fetch origin main
git merge --ff-only origin/main
$activationCommit = git log --format=%H `
  --grep="docs: activate FE10 email delivery remediation" -1
git merge-base --is-ancestor $activationCommit origin/main
```

Dự kiến: lệnh cuối cùng thoát về 0. Không bắt đầu Nhiệm vụ 2 cho đến khi kích hoạt quản trị có hiệu
lực trên `origin/main`.

---

### Nhiệm vụ 2: Thêm di chuyển mẫu ACCOUNT_SETUP Idempotent

**Tệp:**

- Tạo: `database/migrations/2026-07-27-fe10-account-setup-template.sql`
- Sửa đổi: `backend/tests/notificationRepository.test.js`

**Giao diện:**

- Tiêu thụ: hạt giống chuẩn trong `database/Librarymanagement.sql`.
- Tạo ra: một quá trình di chuyển bổ sung để lại chính xác một chuẩn hoạt động
  Hàng `ACCOUNT_SETUP` khi `TemplateCode` là duy nhất.

- [ ] **Bước 1: Viết kiểm thử hợp đồng di chuyển không thành công**

Thêm:

```javascript
test('account setup template migration is canonical, transactional, and repeatable', () => {
  const root = path.join(__dirname, '..', '..');
  const baseline = fs.readFileSync(path.join(root, 'database', 'Librarymanagement.sql'), 'utf8');
  const migration = fs.readFileSync(
    path.join(
      root,
      'database',
      'migrations',
      '2026-07-27-fe10-account-setup-template.sql'
    ),
    'utf8'
  );

  for (const sqlText of [baseline, migration]) {
    expect(sqlText).toMatch(/ACCOUNT_SETUP/i);
    expect(sqlText).toMatch(/\{\{setupLink\}\}/);
    expect(sqlText).toMatch(/\{\{expiresInHours\}\}/);
  }
  expect(migration).toMatch(/SET XACT_ABORT ON/i);
  expect(migration).toMatch(/BEGIN TRANSACTION/i);
  expect(migration).toMatch(/IF EXISTS[\s\S]*TemplateCode = 'ACCOUNT_SETUP'/i);
  expect(migration).toMatch(/UPDATE NotificationTemplates[\s\S]*Status = 'ACTIVE'/i);
  expect(migration).toMatch(/INSERT INTO NotificationTemplates/i);
  expect(migration).toMatch(/COMMIT TRANSACTION/i);
  expect(migration).toMatch(/ROLLBACK TRANSACTION/i);
  expect(migration).toMatch(/THROW/i);
  expect(migration).not.toMatch(/\bDELETE\b/i);
});
```

- [ ] **Bước 2: Chạy kiểm thử tập trung và chụp RED**

Chạy:

```powershell
npx jest --runInBand --runTestsByPath tests/notificationRepository.test.js
```

Dự kiến: THẤT BẠI vì `2026-07-27-fe10-account-setup-template.sql` không tồn tại.

- [ ] **Bước 3: Thêm di chuyển tối thiểu**

Tạo:

```sql
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (
        SELECT 1
        FROM NotificationTemplates
        WHERE TemplateCode = 'ACCOUNT_SETUP'
    )
    BEGIN
        UPDATE NotificationTemplates
        SET Subject = N'Set up your library account',
            Body = N'Complete your library account setup: {{setupLink}}. This link expires in {{expiresInHours}} hours.',
            Status = 'ACTIVE',
            UpdatedAt = GETDATE()
        WHERE TemplateCode = 'ACCOUNT_SETUP';
    END
    ELSE
    BEGIN
        INSERT INTO NotificationTemplates (TemplateCode, Subject, Body, Status)
        VALUES (
            'ACCOUNT_SETUP',
            N'Set up your library account',
            N'Complete your library account setup: {{setupLink}}. This link expires in {{expiresInHours}} hours.',
            'ACTIVE'
        );
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
```

- [ ] **Bước 4: Chạy kiểm thử tập trung và chụp GREEN**

Chạy lại lệnh Bước 2.

Dự kiến: `notificationRepository.test.js` vượt qua.

- [ ] **Bước 5: Giữ nguyên việc triển khai cho H2**

Chạy:

```powershell
git diff --check
git diff -- database/migrations/2026-07-27-fe10-account-setup-template.sql `
  backend/tests/notificationRepository.test.js
```

Dự kiến: chỉ xuất hiện quá trình di chuyển và kiểm thử tập trung của nó; không có giá trị kết nối bí
mật hoặc môi trường tiền sản xuất nào xuất hiện.

---

### Nhiệm vụ 3: Lưu giữ ID tin nhắn của nhà cung cấp nhạy cảm

**Tệp:**

- Sửa đổi: `backend/tests/notificationRoutes.test.js:1340-1410,2340-2445`
- Sửa đổi: `backend/src/services/notificationService.js:698-730`

**Giao diện:**

- Tiêu thụ: `emailProvider.send(message) -> { providerMessageId: string | null }`.
- Sản xuất: `notificationRepository.markSent({ notificationId,
  providerMessageId })` không có thay đổi công khai về DTO.

- [ ] **Bước 1: Viết các xác nhận FE02 và FE11 không thành công**

Thay đổi xác nhận bảng nhạy cảm hiện có thành:

```javascript
expect(notificationDependencies.state.attempts).toEqual([
  expect.objectContaining({
    status: 'SENT',
    providerMessageId: `mock-${recipientEmail}`,
  }),
]);
```

Thêm vào kiểm thử thành công FE11 `ACCOUNT_SETUP`:

```javascript
expect(notificationDependencies.state.attempts).toEqual([
  expect.objectContaining({
    status: 'SENT',
    providerMessageId: 'mock-new.member@example.test',
  }),
]);
```

Giữ lại các bản quét hiện có để chứng minh OTP, liên kết thiết lập, chủ đề/nội dung được hiển thị và
thông tin chi tiết về lỗi của nhà cung cấp không có trong dữ liệu được lưu giữ/kiểm tra/tiếp xúc.

- [ ] **Bước 2: Chạy các kiểm thử tập trung và chụp RED**

Chạy:

```powershell
npx jest --runInBand --runTestsByPath tests/notificationRoutes.test.js `
  -t "sends .* synchronously|allows only the FE11-bound requester"
```

Dự kiến: THẤT BẠI vì các lần thử hiện chứa `providerMessageId: null`.

- [ ] **Bước 3: Ghi nhận và chuyển kết quả của nhà cung cấp**

Thay thế khối nhà cung cấp nhạy cảm bằng:

```javascript
let providerFailed = false;
let providerResult = null;

try {
  providerResult = await emailProvider.send({
    to: recipient.recipientEmail,
    subject: renderedTitle,
    body: renderedBody,
  });
} catch (error) {
  try {
    notification = await notificationRepository.markFailed({
      notificationId: notification.notificationId,
      safeErrorMessage: 'Notification delivery failed.',
    });
  } catch (markFailedError) {
    throw safeInternalError(
      'NOTIFICATION_DELIVERY_FAILURE_TRANSITION_FAILED',
      'Notification delivery failure could not be recorded.'
    );
  }
  providerFailed = true;
}

if (!providerFailed) {
  try {
    notification = await notificationRepository.markSent({
      notificationId: notification.notificationId,
      providerMessageId: providerResult?.providerMessageId || null,
    });
  } catch (error) {
    throw safeInternalError(
      'NOTIFICATION_DELIVERY_TRANSITION_FAILED',
      'Notification delivery state could not be recorded.'
    );
  }
}
```

- [ ] **Bước 4: Chạy GREEN tập trung và hồi quy nhạy cảm**

Chạy:

```powershell
npx jest --runInBand --runTestsByPath tests/notificationRoutes.test.js `
  -t "synchronously|ACCOUNT_SETUP|sensitive markSent|sensitive markFailed|provider"
```

Dự kiến: tất cả các kiểm thử đã chọn đều đạt; không có thay đổi xác nhận bí mật được lưu trữ.

- [ ] **Bước 5: Giữ nguyên việc triển khai cho H2**

Chạy:

```powershell
git diff --check
git diff -- backend/src/services/notificationService.js `
  backend/tests/notificationRoutes.test.js
```

Dự kiến: chỉ hiển thị kết quả thu được từ nhà cung cấp và hai kỳ vọng tập trung.

---

### Nhiệm vụ 4: Thêm bộ xử lý hàng đợi SYSTEM có giới hạn xây dựng

**Tệp:**

- Sửa đổi: `backend/tests/notificationRoutes.test.js:463-675`
- Sửa đổi: `backend/src/services/notificationService.js:870-930`

**Giao diện:**

- Tiêu thụ: vòng lặp yêu cầu/gửi/chuyển tiếp thiết bị đầu cuối riêng tư hiện tại.
- Sản xuất:
  `notificationService.createSystemNotificationProcessor() -> Chỉ đọc<{
  processPendingNotifications(đầu vào?: { giới hạn?: số }): Promise<Result>
  }>`.
- Bảo quản:
  `notificationService.processPendingNotifications(input, actor, context)`.

- [ ] **Bước 1: Viết kiểm thử bộ xử lý hệ thống bị lỗi**

Thêm sau các kiểm thử xử lý hàng đợi hiện có:

```javascript
test('processes queued mail through a construction-bound SYSTEM processor', async () => {
  const {
    notificationService,
    notificationDependencies,
    authDependencies,
    emailProviderMessages,
  } = makeTestApp();
  notificationDependencies.state.notifications.push({
    notificationId: 996,
    type: 'DUE_DATE_REMINDER',
    templateKey: 'DUE_DATE_REMINDER',
    recipientEmail: 'system-worker@example.test',
    title: 'Due date reminder',
    body: 'Due date: 2026-07-30',
    status: 'PENDING',
    attemptCount: 0,
  });

  const processor = notificationService.createSystemNotificationProcessor();
  const result = await processor.processPendingNotifications({ limit: 1 });

  expect(result).toMatchObject({ processed: 1, failed: 0 });
  expect(emailProviderMessages).toHaveLength(1);
  expect(notificationDependencies.state.attempts).toEqual([
    expect.objectContaining({
      status: 'SENT',
      providerMessageId: 'mock-system-worker@example.test',
    }),
  ]);
  expect(authDependencies.state.auditLogs).toEqual([
    expect.objectContaining({
      userId: null,
      action: 'NOTIFICATION_PROCESS_PENDING',
      metadata: { processed: 1, failed: 0 },
    }),
  ]);
  expect(Object.isFrozen(processor)).toBe(true);
});
```

Không thay đổi các xác nhận tuyến đường public/member `403` hiện có.

- [ ] **Bước 2: Chạy kiểm thử tập trung và chụp RED**

Chạy:

```powershell
npx jest --runInBand --runTestsByPath tests/notificationRoutes.test.js `
  -t "construction-bound SYSTEM processor"
```

Dự kiến: THẤT BẠI vì `createSystemNotificationProcessor` không phải là một hàm.

- [ ] **Bước 3: Trích xuất một lõi lô riêng**

Thay thế chức năng xử lý hiện tại bằng:

```javascript
async function processPendingNotificationBatch(
  input = {},
  { auditUserId = null, context = {} } = {}
) {
  const limit = Number(input.limit || 20);
  const result = {
    processed: 0,
    failed: 0,
    notifications: [],
  };

  for (let index = 0; index < limit; index += 1) {
    const claim = await notificationRepository.claimNextPending();
    if (!claim) {
      break;
    }

    const notification = claim.notification;
    let providerResult;

    try {
      providerResult = await emailProvider.send({
        to: notification.recipientEmail,
        subject: notification.title,
        body: notification.body,
      });
    } catch (error) {
      const updatedNotification = await notificationRepository.markClaimFailed({
        claim,
        safeErrorMessage: safeFailureMessage(error),
      });

      result.failed += 1;
      result.notifications.push(updatedNotification);
      continue;
    }

    const updatedNotification = await notificationRepository.markClaimSent({
      claim,
      providerMessageId: providerResult?.providerMessageId || null,
    });

    result.processed += 1;
    result.notifications.push(updatedNotification);
  }

  await writeAudit(context, 'NOTIFICATION_PROCESS_PENDING', {
    userId: auditUserId,
    metadata: { processed: result.processed, failed: result.failed },
  });

  return result;
}

async function processPendingNotifications(input, actor, context = {}) {
  requireInternalActor(actor);
  return processPendingNotificationBatch(input, {
    auditUserId: actor.userId,
    context,
  });
}

function createSystemNotificationProcessor() {
  return Object.freeze({
    async processPendingNotifications(input = {}) {
      return processPendingNotificationBatch(input, {
        auditUserId: null,
        context: {},
      });
    },
  });
}
```

Thêm `createSystemNotificationProcessor` vào đối tượng trả sách dịch vụ.

- [ ] **Bước 4: Chạy hệ thống và ủy quyền GREEN**

Chạy:

```powershell
npx jest --runInBand --runTestsByPath tests/notificationRoutes.test.js `
  -t "SYSTEM processor|processes queued|claims one pending|notification APIs are protected"
```

Dự kiến: bộ xử lý hệ thống, tính đồng thời của hàng đợi và các kiểm thử ủy quyền HTTP đã vượt qua.

- [ ] **Bước 5: Giữ nguyên việc triển khai cho H2**

Chạy `git diff --check` và xem lại hai tệp đã thay đổi.

Dự kiến: vòng lặp hàng đợi tồn tại một lần, trình bao bọc con người vẫn gọi `requireInternalActor`
và không có vai trò đăng nhập SYSTEM nào được đưa ra.

---

### Nhiệm vụ 5: Thêm cấu hình và lập lịch trình cho nhân viên

**Tệp:**

- Tạo: `backend/src/services/notificationWorker.js`
- Tạo: `backend/tests/notificationWorker.test.js`
- Sửa đổi: `backend/src/config/env.js:1-90`
- Sửa đổi: `backend/tests/envConfig.test.js`
- Sửa đổi: `backend/.env.example:24-45`

**Giao diện:**

- Tiêu thụ:
  `processor.processPendingNotifications({ limit }): Promise<Result>`.
- Sản xuất:
  `createNotificationWorker(tùy chọn) -> { start(): Hứa, runOnce(): Hứa,
  stop(): vô hiệu }`.
- Cấu hình:
  `notificationWorkerEnabled`, `notificationWorkerIntervalMs`,
  `notificationWorkerBatchSize`.

- [ ] **Bước 1: Viết kiểm thử cấu hình không thành công**

Bảo tồn và khôi phục các biến môi trường này trong `envConfig.test.js`:

```javascript
const workerEnvNames = [
  'NOTIFICATION_WORKER_ENABLED',
  'NOTIFICATION_WORKER_INTERVAL_MS',
  'NOTIFICATION_WORKER_BATCH_SIZE',
];
const originalWorkerEnv = Object.fromEntries(
  workerEnvNames.map((name) => [name, process.env[name]])
);
```

Thêm vòng lặp khôi phục này bên trong `afterEach` hiện có trước `jest.resetModules()`:

```javascript
for (const name of workerEnvNames) {
  if (originalWorkerEnv[name] === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = originalWorkerEnv[name];
  }
}
```

Thêm:

```javascript
test('uses safe disabled notification worker defaults', () => {
  for (const name of workerEnvNames) {
    delete process.env[name];
  }

  const env = require('../src/config/env');

  expect(env.notificationWorkerEnabled).toBe(false);
  expect(env.notificationWorkerIntervalMs).toBe(60000);
  expect(env.notificationWorkerBatchSize).toBe(20);
});

test.each([
  ['NOTIFICATION_WORKER_INTERVAL_MS', '0'],
  ['NOTIFICATION_WORKER_INTERVAL_MS', '1.5'],
  ['NOTIFICATION_WORKER_BATCH_SIZE', '-1'],
])('rejects invalid positive worker setting %s=%s', (name, value) => {
  process.env[name] = value;

  expect(() => require('../src/config/env')).toThrow(
    `Invalid positive integer environment value for ${name}`
  );
});
```

Trong `afterEach`, khôi phục tất cả `workerEnvNames` và gọi `jest.resetModules()`.

- [ ] **Bước 2: Viết các kiểm thử công nhân không thành công**

Tạo:

```javascript
const { createNotificationWorker } = require('../src/services/notificationWorker');

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function makeHarness({ enabled = true, processor } = {}) {
  const scheduled = [];
  const timer = { id: 1 };
  const clearIntervalFn = jest.fn();
  const logger = { error: jest.fn() };
  const effectiveProcessor =
    processor || { processPendingNotifications: jest.fn().mockResolvedValue({
      processed: 0,
      failed: 0,
      notifications: [],
    }) };
  const worker = createNotificationWorker({
    processor: effectiveProcessor,
    enabled,
    intervalMs: 60000,
    batchSize: 20,
    setIntervalFn(callback, intervalMs) {
      scheduled.push({ callback, intervalMs });
      return timer;
    },
    clearIntervalFn,
    logger,
  });

  return { worker, scheduled, timer, clearIntervalFn, logger, processor: effectiveProcessor };
}

test('disabled worker creates no timer and performs no work', async () => {
  const harness = makeHarness({ enabled: false });

  await harness.worker.start();

  expect(harness.scheduled).toHaveLength(0);
  expect(harness.processor.processPendingNotifications).not.toHaveBeenCalled();
});

test('enabled worker runs at startup and on its configured interval', async () => {
  const harness = makeHarness();

  await harness.worker.start();
  await harness.scheduled[0].callback();

  expect(harness.scheduled[0].intervalMs).toBe(60000);
  expect(harness.processor.processPendingNotifications).toHaveBeenNthCalledWith(1, { limit: 20 });
  expect(harness.processor.processPendingNotifications).toHaveBeenNthCalledWith(2, { limit: 20 });
});

test('overlapping passes are skipped and later passes resume', async () => {
  const first = deferred();
  const processor = {
    processPendingNotifications: jest
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue({ processed: 0, failed: 0, notifications: [] }),
  };
  const harness = makeHarness({ processor });
  const startup = harness.worker.start();

  await expect(harness.worker.runOnce()).resolves.toEqual({ skipped: true });
  first.resolve({ processed: 1, failed: 0, notifications: [] });
  await startup;
  await harness.worker.runOnce();

  expect(processor.processPendingNotifications).toHaveBeenCalledTimes(2);
});

test('safe worker failure does not stop later passes', async () => {
  const processor = {
    processPendingNotifications: jest
      .fn()
      .mockRejectedValueOnce(new Error('recipient@example.test provider-secret'))
      .mockResolvedValue({ processed: 1, failed: 0, notifications: [] }),
  };
  const harness = makeHarness({ processor });

  await harness.worker.start();
  await harness.scheduled[0].callback();

  expect(processor.processPendingNotifications).toHaveBeenCalledTimes(2);
  expect(harness.logger.error).toHaveBeenCalledWith('[notification worker]', {
    code: 'NOTIFICATION_WORKER_BATCH_FAILED',
  });
  expect(JSON.stringify(harness.logger.error.mock.calls)).not.toContain('provider-secret');
  expect(JSON.stringify(harness.logger.error.mock.calls)).not.toContain('recipient@example.test');
});

test('stop clears the active timer and prevents later work', async () => {
  const harness = makeHarness();
  await harness.worker.start();

  harness.worker.stop();
  await harness.worker.runOnce();

  expect(harness.clearIntervalFn).toHaveBeenCalledWith(harness.timer);
  expect(harness.processor.processPendingNotifications).toHaveBeenCalledTimes(1);
});
```

- [ ] **Bước 3: Chạy kiểm thử cấu hình và nhân công rồi chụp RED**

Chạy:

```powershell
npx jest --runInBand --runTestsByPath `
  tests/envConfig.test.js tests/notificationWorker.test.js
```

Dự kiến: THẤT BẠI vì mô-đun/cài đặt công nhân không tồn tại.

- [ ] **Bước 4: Thêm cấu hình nhân viên**

Thêm vào xuất khẩu `backend/src/config/env.js`:

```javascript
notificationWorkerEnabled: booleanFromEnv('NOTIFICATION_WORKER_ENABLED', false),
notificationWorkerIntervalMs: positiveIntegerFromEnv(
  'NOTIFICATION_WORKER_INTERVAL_MS',
  60000
),
notificationWorkerBatchSize: positiveIntegerFromEnv(
  'NOTIFICATION_WORKER_BATCH_SIZE',
  20
),
```

Thêm vào `backend/.env.example`:

```dotenv
# Best-effort queued notification worker. Keep disabled for local development
# unless the backend should process non-sensitive PENDING notifications.
NOTIFICATION_WORKER_ENABLED=false
NOTIFICATION_WORKER_INTERVAL_MS=60000
NOTIFICATION_WORKER_BATCH_SIZE=20
```

- [ ] **Bước 5: Thêm nhân viên tối thiểu**

Tạo:

```javascript
function createNotificationWorker({
  processor,
  enabled = false,
  intervalMs = 60000,
  batchSize = 20,
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
  logger = console,
} = {}) {
  if (!processor || typeof processor.processPendingNotifications !== 'function') {
    throw new TypeError('Notification worker requires a pending notification processor.');
  }

  let timer = null;
  let started = false;
  let running = false;

  async function runOnce() {
    if (!enabled || !started || running) {
      return { skipped: true };
    }

    running = true;
    try {
      return await processor.processPendingNotifications({ limit: batchSize });
    } catch (error) {
      logger.error('[notification worker]', {
        code: 'NOTIFICATION_WORKER_BATCH_FAILED',
      });
      return { failed: true };
    } finally {
      running = false;
    }
  }

  async function start() {
    if (!enabled || started) {
      return { started: false };
    }

    started = true;
    timer = setIntervalFn(() => runOnce(), intervalMs);
    const result = await runOnce();
    return { started: true, result };
  }

  function stop() {
    started = false;
    if (timer !== null) {
      clearIntervalFn(timer);
      timer = null;
    }
  }

  return Object.freeze({ start, runOnce, stop });
}

module.exports = {
  createNotificationWorker,
};
```

- [ ] **Bước 6: Chạy config và worker GREEN**

Chạy lại lệnh Bước 3.

Dự kiến: cả hai dãy đều vượt qua mà không có tay cầm mở.

- [ ] **Bước 7: Giữ nguyên việc triển khai cho H2**

Chạy:

```powershell
git diff --check
git diff -- backend/src/services/notificationWorker.js `
  backend/src/config/env.js backend/.env.example `
  backend/tests/notificationWorker.test.js backend/tests/envConfig.test.js
```

Dự kiến: chỉ cố định mã nhật ký an toàn; không có đối tượng lỗi, email, chi tiết SMTP hoặc bí mật
nào xuất hiện trong nhật ký sản xuất.

---

### Nhiệm vụ 6: Vòng đời của Wire Worker và Máy chủ HTTP

**Tệp:**

- Tạo: `backend/src/serverRuntime.js`
- Tạo: `backend/tests/serverRuntime.test.js`
- Sửa đổi: `backend/src/index.js:1-20`
- Kiểm tra: `backend/tests/app.test.js`

**Giao diện:**

- Tiêu thụ: Express `app`, nhân viên thông báo đã định cấu hình, tín hiệu xử lý nút.
- Sản xuất:
  `createServerRuntime({ ứng dụng, nhân viên, cổng, processRef, trình ghi nhật ký }) -> {
  start(): http.Server, stop(): void }`.
- Bảo tồn: `require('../src/index')` trả về ứng dụng Express.

- [ ] **Bước 1: Viết các kiểm thử vòng đời thời gian chạy không thành công**

Tạo:

```javascript
const { EventEmitter } = require('events');
const { createServerRuntime } = require('../src/serverRuntime');

function makeRuntime() {
  const processRef = new EventEmitter();
  const server = { close: jest.fn() };
  const app = {
    listen: jest.fn((port, callback) => {
      callback();
      return server;
    }),
  };
  const worker = {
    start: jest.fn().mockResolvedValue({ started: true }),
    stop: jest.fn(),
  };
  const logger = { info: jest.fn() };
  const runtime = createServerRuntime({
    app,
    worker,
    port: 3000,
    processRef,
    logger,
  });

  return { runtime, processRef, server, app, worker, logger };
}

test.each(['SIGTERM', 'SIGINT'])('starts worker after listen and stops on %s', (signal) => {
  const harness = makeRuntime();

  const server = harness.runtime.start();
  harness.processRef.emit(signal);

  expect(server).toBe(harness.server);
  expect(harness.app.listen).toHaveBeenCalledWith(3000, expect.any(Function));
  expect(harness.worker.start).toHaveBeenCalledTimes(1);
  expect(harness.worker.stop).toHaveBeenCalledTimes(1);
  expect(harness.server.close).toHaveBeenCalledTimes(1);
});

test('does not start the same runtime twice', () => {
  const harness = makeRuntime();

  const first = harness.runtime.start();
  const second = harness.runtime.start();

  expect(second).toBe(first);
  expect(harness.app.listen).toHaveBeenCalledTimes(1);
  expect(harness.worker.start).toHaveBeenCalledTimes(1);
});
```

- [ ] **Bước 2: Chạy kiểm thử thời gian chạy và ứng dụng rồi chụp RED**

Chạy:

```powershell
npx jest --runInBand --runTestsByPath `
  tests/serverRuntime.test.js tests/app.test.js
```

Dự kiến: THẤT BẠI vì `serverRuntime.js` không tồn tại.

- [ ] **Bước 3: Thêm thời gian chạy máy chủ**

Tạo:

```javascript
function createServerRuntime({
  app,
  worker,
  port,
  processRef = process,
  logger = console,
} = {}) {
  let server = null;
  let stopped = false;

  function stop() {
    if (stopped) {
      return;
    }
    stopped = true;
    worker.stop();
    if (server) {
      server.close();
    }
  }

  function start() {
    if (server) {
      return server;
    }

    server = app.listen(port, () => {
      logger.info(`Backend server listening on http://localhost:${port}`);
      void worker.start();
    });
    processRef.once('SIGTERM', stop);
    processRef.once('SIGINT', stop);
    return server;
  }

  return Object.freeze({ start, stop });
}

module.exports = {
  createServerRuntime,
};
```

- [ ] **Bước 4: Soạn thời gian chạy mặc định mà không có tác dụng phụ khi nhập**

Thay thế `backend/src/index.js` bằng:

```javascript
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  quiet: true,
});

const { createApp } = require('./app');
const env = require('./config/env');
const { defaultNotificationService } = require('./services/notificationService');
const { createNotificationWorker } = require('./services/notificationWorker');
const { createServerRuntime } = require('./serverRuntime');

const app = createApp();
const processor = defaultNotificationService.createSystemNotificationProcessor();
const worker = createNotificationWorker({
  processor,
  enabled: env.notificationWorkerEnabled,
  intervalMs: env.notificationWorkerIntervalMs,
  batchSize: env.notificationWorkerBatchSize,
});
const runtime = createServerRuntime({
  app,
  worker,
  port: Number(process.env.PORT || 3000),
});

if (require.main === module) {
  runtime.start();
}

module.exports = app;
```

- [ ] **Bước 5: Chạy thời gian chạy và xuất ứng dụng trực tiếp GREEN**

Chạy lệnh Bước 2, sau đó:

```powershell
node -e "const app = require('./src/index'); if (!app || typeof app.listen !== 'function') process.exit(1)"
```

Dự kiến: cả hai bộ đều đạt, kiểm tra nhập thoát về 0 và quá trình nhập không mở bộ hẹn giờ hoặc cổng.

- [ ] **Bước 6: Chạy cổng tích hợp nhân viên FE10 tập trung**

Chạy:

```powershell
npx jest --runInBand --runTestsByPath `
  tests/notificationRepository.test.js `
  tests/notificationRoutes.test.js `
  tests/notificationWorker.test.js `
  tests/serverRuntime.test.js `
  tests/envConfig.test.js `
  tests/app.test.js
```

Dự kiến: tất cả các dãy đã chọn đều vượt qua mà không có tay cầm mở nào.

- [ ] **Bước 7: Giữ nguyên việc triển khai cho H2**

Chạy `git status --short`, `git diff --check` và kiểm tra sự khác biệt hoàn chỉnh của Nhiệm vụ 2-6.

Dự kiến: không có lộ trình công khai/DTO/lược đồ/thay đổi phụ thuộc và không có tệp không liên quan.

---

### Nhiệm vụ 7: Hoàn thành xác thực, H2, xuất bản và sửa chữa môi trường tiền sản xuất

**Tệp:**

- Tạo:
  `.sdd/reviews/staging-email-delivery-remediation-validation-2026-07-27.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/CHANGELOG.md`
- Cấu hình bên ngoài: Cài đặt Azure App Service và Môi trường tiền sản xuất Azure SQL
  chỉ di chuyển sau khi xuất bản được ủy quyền H2.

**Giao diện:**

- Tiêu thụ: hoàn thành Nhiệm vụ 2-6 không được cam kết.
- Tạo ra: bằng chứng L1-L4, các cam kết được H2 xem xét, bằng chứng CI/triển khai và một
  trạng thái môi trường tiền sản xuất đã được xác minh an toàn.

- [ ] **Bước 1: Chạy xác thực tập trung L1**

Từ `backend`:

```powershell
npx jest --runInBand --runTestsByPath `
  tests/notificationRepository.test.js `
  tests/notificationRoutes.test.js `
  tests/notificationWorker.test.js `
  tests/serverRuntime.test.js `
  tests/envConfig.test.js `
  tests/app.test.js
```

Dự kiến: tất cả các dãy tập trung đều đạt.

- [ ] **Bước 2: Chạy xác thực kho lưu trữ L2**

Từ gốc cây công việc:

```powershell
npm --prefix backend test
npm --prefix frontend test
npm run test:deployment
npm --prefix backend run test:integration:system
npm run trace:enforce
npm --prefix frontend run lint
npm --prefix frontend run build
git diff --check
```

Mức tối thiểu cơ bản dự kiến: máy chủ ít nhất 1.063 kiểm thử, giao diện người dùng ít nhất 232 kiểm
thử, triển khai 9 kiểm thử; mọi lệnh đều thoát 0.

- [ ] **Bước 3: Chạy quét phạm vi và bảo mật L3**

Chạy:

```powershell
git diff --name-only
git diff | rg -n -i `
  "smtp_password|db_password|connectionstring|provider-secret|rawOtp|setupLink.*console|recipientEmail.*console"
rg -n "NOTIFICATION_WORKER|createSystemNotificationProcessor|providerMessageId" `
  backend/src backend/tests backend/.env.example
```

Dự kiến: các tập tin đã thay đổi phù hợp với kế hoạch này; quá trình quét bí mật không có giá trị
thông tin xác thực hoặc nhật ký sản xuất không an toàn; tên biến dự kiến ​​chỉ có thể xuất hiện
trong tests/contracts.

- [ ] **Bước 4: Chứng minh khả năng lặp lại di chuyển**

Sử dụng cơ sở dữ liệu SQL dùng một lần khi có sẵn. Mặt khác, sau H2 và trước khi triển khai, hãy
thực hiện quá trình di chuyển đã xem xét hai lần theo giai đoạn thông qua quy tắc tường lửa tạm thời
có IP chính xác, sau đó truy vấn:

```sql
SELECT TemplateCode, Subject, Body, Status, COUNT(*) OVER () AS MatchingRows
FROM NotificationTemplates
WHERE TemplateCode = 'ACCOUNT_SETUP';
```

Cần có sau cả hai lần thực thi: một hàng, `Status = ACTIVE`, chủ đề chuẩn và cả hai biến
`{{setupLink}}`/`{{expiresInHours}}`. Xóa quy tắc tường lửa tạm thời trong đường dẫn `finally` và
xác nhận không còn quy tắc do tác vụ tạo nào.

- [ ] **Bước 5: Viết bản ghi xác thực không bí mật hoặc PII**

Ghi lại:

```markdown
# Xác nhận khắc phục gửi email tiền sản xuất

- Cam kết cơ bản và nhánh cây công việc
- Lệnh/lỗi RED đối với FE10-S13, FE10-S14 và FE10-S15
- Tổng số GREEN tập trung
- Tổng số backend/frontend/deployment/system/lint/build/trace đầy đủ
- Thực hiện di chuyển kết quả 1/2 và 2/2
- Đánh giá khác biệt, ủy quyền, DTO, nội dung bí mật và nhạy cảm
- Quyết định H2 và bộ cam kết được xem xét chính xác
- Chỉ tên cài đặt Azure, không bao giờ có giá trị cho bí mật
- Chạy/cam kết triển khai
- Số lượng dàn tổng hợp được che dấu và chỉ hiện diện ID nhà cung cấp
- Cài đặt khôi phục và giới hạn nỗ lực tối đa của F1
```

- [ ] **Bước 6: Dừng để xem xét con người H2**

Trình bày sự khác biệt hoàn chỉnh của Nhiệm vụ 2-6 cùng với bằng chứng từ Bước 1-5. H2 phải xác nhận:

- di chuyển có tính chất cộng thêm và có thể lặp lại;
- SYSTEM không trở thành vai trò đăng nhập;
- ủy quyền điểm cuối thủ công vẫn còn;
- bằng chứng nhạy cảm của nhà cung cấp chỉ lưu trữ ID tin nhắn;
- nhân viên không thể chồng chéo cục bộ hoặc tự động thử lại `FAILED`;
- Các giới hạn của F1 được nêu chính xác;
- không có bí mật hoặc dữ liệu người nhận thực nào xuất hiện.

Không cam kết thực hiện trước khi phê duyệt H2 rõ ràng.

- [ ] **Bước 7: Chỉ cam kết bộ được H2 đánh giá**

Sau khi phê duyệt H2, hãy thực hiện các cam kết có thể xem xét:

```powershell
git add -- `
  database/migrations/2026-07-27-fe10-account-setup-template.sql `
  backend/tests/notificationRepository.test.js
git commit -m "fix: restore FE10 account setup template"

git add -- `
  backend/src/services/notificationService.js `
  backend/tests/notificationRoutes.test.js
git commit -m "fix: preserve FE10 delivery evidence"

git add -- `
  backend/src/services/notificationWorker.js `
  backend/src/serverRuntime.js `
  backend/src/config/env.js `
  backend/src/index.js `
  backend/.env.example `
  backend/tests/notificationWorker.test.js `
  backend/tests/serverRuntime.test.js `
  backend/tests/envConfig.test.js
git commit -m "fix: process queued notifications automatically"

git add -- `
  .sdd/specs/feat-notification-management/TASKS.md `
  .sdd/specs/feat-notification-management/CHANGELOG.md `
  .sdd/reviews/staging-email-delivery-remediation-validation-2026-07-27.md
git commit -m "docs: record FE10 email remediation evidence"
```

- [ ] **Bước 8: Xuất bản và yêu cầu CI trước khi môi trường tiền sản xuất**

Đẩy nhánh đã được xem xét và chỉ mở/cập nhật PR dự thảo dưới thẩm quyền của H2. Yêu cầu kiểm tra CI
của kho lưu trữ để vượt qua phần đầu được xuất bản chính xác. Không hợp nhất trước H3.

- [ ] **Bước 9: Áp dụng cài đặt di chuyển theo giai đoạn và cài đặt của nhân viên**

Áp dụng di chuyển đã xem xét, sau đó chỉ đặt:

```text
NOTIFICATION_WORKER_ENABLED=true
NOTIFICATION_WORKER_INTERVAL_MS=60000
NOTIFICATION_WORKER_BATCH_SIZE=20
```

Không thay đổi hoặc in cài đặt bí mật SMTP/SQL.

- [ ] **Bước 10: Triển khai và xác minh kết quả môi trường tiền sản xuất an toàn**

Xác minh:

```text
GET /health -> 200
deployment smoke -> PASS
mẫu ACCOUNT_SETUP -> đúng một bản ghi ACTIVE
các bản ghi PENDING không nhạy cảm -> được xử lý thành SENT hoặc FAILED an toàn khi ứng dụng đang hoạt động
lần thử mới thành công -> có providerMessageId khi SMTP cung cấp giá trị này
tiêu đề/nội dung/dữ liệu gửi an toàn của Notifications nhạy cảm -> không có OTP, mã thông báo hoặc liên kết thiết lập
truy cập điểm cuối thủ công bằng người dùng ẩn danh/thành viên -> vẫn bị từ chối
```

Chỉ sử dụng bằng chứng tổng hợp được che giấu. Không sử dụng lại mã thông báo thiết lập đã hết hạn;
việc gửi lại của Quản trị viên được ủy quyền phải tạo mã thông báo/sự kiện mới nếu yêu cầu xác thực
hộp thư đến trực tiếp.

- [ ] **Bước 11: Thực hiện đánh giá tích hợp H3**

Xác nhận nhánh vẫn có thể hợp nhất, các bước kiểm tra bắt buộc được thông qua đối với người đứng đầu
chính xác, bằng chứng môi trường tiền sản xuất phù hợp với thiết kế đã được phê duyệt và quá trình
khôi phục là `NOTIFICATION_WORKER_ENABLED=false`. Chỉ hợp nhất sau khi được phê duyệt H3 rõ ràng.
