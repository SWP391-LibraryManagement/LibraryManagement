# Xác thực keepalive miễn phí cho staging

**Trạng thái:** TRIỂN KHAI HOÀN TẤT; H2 ĐANG CHỜ REVIEW

**Ngày:** 2026-07-28

**Nhánh:** `codex/chore-staging-free-keepalive`

**Mốc cơ sở triển khai:**
`2c0b169cbb81421b17ad43580a8688dddffa328c`

**Commit quản trị H1:**
`40c1707` (`docs: approve staging free keepalive plan`)

## 1. Bằng chứng phạm vi

Các thay đổi triển khai chưa commit được giới hạn ở:

- `.github/workflows/staging-keepalive.yml`
- `tests/deployment/stagingKeepalivePolicy.test.js`
- `docs/deployment/azure-staging-guide.md`
- biên bản xác thực này

Không tệp frontend, backend, database, dependency, environment hay secret nào
được sửa đổi.

## 2. Bằng chứng RED

### Hợp đồng workflow ban đầu

Lệnh:

```powershell
node --test tests/deployment/stagingKeepalivePolicy.test.js
```

Kết quả ghi nhận: `0 passed, 4 failed`.

- Assertion về sự tồn tại workflow không đạt vì
  `.github/workflows/staging-keepalive.yml` chưa tồn tại.
- Các assertion về đặc quyền tối thiểu, request có giới hạn và endpoint không
  đạt vì nội dung workflow trống.
- Assertion hướng dẫn operator không đạt vì phần keepalive F1 chưa tồn tại.

### Regression giới hạn không hoạt động

Sau khi phát hiện ranh giới không hoạt động được GitHub ghi tài liệu cho
repository công khai, assertion hướng dẫn được mở rộng trước hướng dẫn:

```text
3 passed, 1 failed
Expected: 60 days followed by gh workflow enable staging-keepalive.yml
```

Hướng dẫn sau đó được cập nhật với giới hạn và lệnh khôi phục.

## 3. Bằng chứng GREEN

Lệnh chính sách tập trung:

```powershell
node --test tests/deployment/stagingKeepalivePolicy.test.js
```

Kết quả: `4 passed, 0 failed`.

Lệnh tiện ích triển khai đầy đủ:

```powershell
npm.cmd run test:deployment
```

Kết quả: `17 passed, 0 failed`.

Lệnh parser/formatter YAML:

```powershell
npx.cmd --yes prettier@3.6.2 --check .github/workflows/staging-keepalive.yml
```

Kết quả: `All matched files use Prettier code style!`

Lệnh diff repository:

```powershell
git diff --check
```

Kết quả: mã thoát `0`. Windows checkout chỉ báo cảnh báo chuyển đổi LF sang CRLF
trong tương lai mà repository dự kiến cho hướng dẫn Markdown.

## 4. Rà soát an toàn workflow

- Khoảng trigger chính xác là các phút `3,13,23,33,43,53`, mỗi 10 phút và tránh
  phút số không.
- Có sẵn `workflow_dispatch` thủ công.
- Quyền repository là `contents: read`.
- Một job chạy với timeout ba phút.
- `curl` lỗi với phản hồi không phải 2xx và có số lần retry, delay, connection
  và thời gian request tổng bị giới hạn.
- URL duy nhất được request là endpoint HTTPS công khai `/health`.
- Không có checkout, action triển khai, endpoint mutation, endpoint xác thực,
  endpoint database, action SMTP hay endpoint xử lý notification.
- Workflow không có biểu thức GitHub secret hoặc giá trị credential.
- Concurrency huỷ lượt keepalive đã bị thay thế.

## 5. Rà soát tài liệu

Hướng dẫn operator nay nêu:

- lịch GitHub và khả năng thức của Azure F1 là best-effort;
- lịch chạy từ nhánh mặc định;
- cần một lần chạy thủ công thành công trước khi downgrade;
- Always On bị tắt trước khi scale xuống F1;
- kiểm tra health, catalog công khai, setting worker và queue sau thay đổi là
  bắt buộc;
- workflow chạy theo lịch của repository công khai có thể bị tắt sau 60 ngày
  không có hoạt động repository và có thể bật lại bằng GitHub CLI;
- rollback là B1 cộng `alwaysOn=true`.

## 6. Bằng chứng môi trường sống hiện tại trước chuyển đổi

Kiểm tra chỉ đọc ngày 2026-07-28:

```text
App Service plan SKU = B1
App Service plan tier = Basic
alwaysOn = true
NOTIFICATION_WORKER_ENABLED = true
NOTIFICATION_WORKER_INTERVAL_MS = 60000
NOTIFICATION_WORKER_BATCH_SIZE = 20
GET /health = 200
GET /api/books = 200
GitHub repository visibility = PUBLIC
GitHub default branch = main
Current main workflows = CI, Deploy staging
```

Điều này chứng minh lớp bảo vệ an toàn còn nguyên: Azure vẫn trả phí/đang thức và
chưa workflow keepalive nào active trên `main` trước H2/H3.

## 7. Rà soát secret và dữ liệu

Triển khai đã review không chứa:

- password, token, publish profile, connection string, mailbox, địa chỉ
  recipient, nội dung email đã render hay payload notification;
- lệnh tra cứu hoặc xuất secret;
- bản ghi user hoặc notification;
- ngoài hostname App Service công khai và tên setting worker không phải secret.

Hướng dẫn triển khai hiện có vẫn nêu các biến secret bắt buộc, nhưng phần triển
khai không thêm giá trị cho bất kỳ biến nào như vậy.

## 8. Các cổng còn lại

- H2 phải review toàn bộ implementation diff cục bộ và bằng chứng này.
- Sau H2, chỉ commit và publish các tệp đã review.
- Các kiểm tra pull request bắt buộc phải đạt tại exact head.
- H3 phải phê duyệt merge.
- CI `main` sau merge và một lần chạy keepalive thủ công phải đạt.
- Chỉ sau đó operator mới được tắt Always On và scale B1 xuống F1.
- Bằng chứng môi trường sống sau chuyển đổi và rollback, nếu cần, vẫn đang chờ.
