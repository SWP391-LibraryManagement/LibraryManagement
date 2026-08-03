# Thiết kế sửa dữ liệu Unicode trên Azure staging

- Ngày: 2026-08-03
- Baseline: `origin/main@724dc2353f3b3a336d6c9d1cda457408c6fa61a3`
- Nhánh thiết kế: `fix/borrowing-notification-ui`
- Phạm vi: FE01/FE05/FE06 catalog data, FE07 borrowing presentation và FE10 notification data
- Trạng thái: phương án 2 đã được người dùng duyệt trong chat; chờ duyệt văn bản trước khi lập kế hoạch triển khai

## 1. Kết quả mong muốn

Sau batch này, toàn bộ chuỗi hiển thị tiếng Việt liên quan phải đúng từ nguồn dữ liệu đến giao diện:

```text
UTF-8 migration/operator input
  -> SQL Server NVARCHAR
  -> REST API response
  -> React renders the stored string unchanged
```

Các trang catalog, mượn sách và hộp thư thông báo không được chứa logic giải mã mojibake. Bản sửa phải khôi phục dữ liệu staging hiện có, ngăn thao tác `sqlcmd` tiếp tục ghi sai encoding và bổ sung kiểm tra chính xác giá trị Unicode thay vì chỉ kiểm tra số lượng hoặc hash file.

## 2. Bằng chứng và nguyên nhân gốc

- React đang hiển thị trực tiếp chuỗi từ API; không có bằng chứng CSS hoặc font làm biến đổi dữ liệu.
- `Books` có các mô tả hỏng tại `BookId` 34-40 do byte UTF-8 bị diễn giải theo CP437.
- `BookCopies` có vị trí hỏng tại `CopyId` 60-64; giá trị đúng lần lượt là `Kệ demo A1`, `Kệ demo A2`, `Kệ demo A3`, `Kệ demo B1`, `Kệ demo C1`.
- Bốn mẫu FE10 tại `TemplateId` 9-12 bị diễn giải theo Windows-1252, trong khi migration nguồn ngày 29/07 chứa đúng chuỗi tiếng Việt dạng `N'...'`.
- Có 17 thông báo lịch sử thuộc các khóa đã biết: 9 `BORROW_REQUEST_APPROVED`, 7 `BORROW_RETURNED`, 1 `BORROW_RENEWED`.
- Hướng dẫn staging gọi `sqlcmd -i` nhưng thiếu `-f 65001`; deployment gate hiện xác minh hash migration nhưng chưa xác minh chuỗi Unicode đã được lưu đúng trong SQL Server.

## 3. Phương án được chọn

| Phương án | Lợi ích | Rủi ro | Quyết định |
| --- | --- | --- | --- |
| Chỉ sửa dữ liệu staging | Khôi phục giao diện nhanh | Lần chạy `sqlcmd` sau có thể làm hỏng lại | Không chọn |
| Sửa dữ liệu và ngăn tái diễn | Khôi phục hiện trạng, có regression gate và quy trình UTF-8 rõ ràng | Phạm vi gồm dữ liệu, migration, test và runbook | Được duyệt |
| Giải mã tại frontend | Không cần sửa SQL ngay | Che dữ liệu hỏng, tạo heuristic khó kiểm soát và làm sai các API consumer khác | Loại bỏ |

## 4. Phạm vi và phần không làm

### 4.1 Trong phạm vi

- Sửa đúng các hàng staging đã xác định trong `Books`, `BookCopies`, `NotificationTemplates` và `Notifications`.
- Thêm migration FE10 idempotent để chuẩn hóa bốn template và các thông báo lịch sử khớp chữ ký mojibake đã biết.
- Bắt buộc `sqlcmd -f 65001` cho mọi lệnh áp dụng migration UTF-8 được tài liệu hóa.
- Mở rộng deployment proof/gate để migration repair đi cùng exact deployment head.
- Thêm test kiểm tra chính xác subject/body tiếng Việt, transaction safety, idempotence và runbook encoding.
- Cập nhật TASKS/CHANGELOG FE10 với bằng chứng đúng phạm vi.

### 4.2 Không nằm trong phạm vi

- Không thay font, CSS, component layout hoặc thêm bộ giải mã vào frontend.
- Không thay schema, endpoint, response envelope, role hoặc quy tắc mượn/đặt chỗ.
- Không sửa hàng ngoài allowlist hoặc dùng truy vấn cập nhật theo wildcard rộng.
- Không ghi credential, connection string, token, địa chỉ IP hoặc dữ liệu cá nhân vào Git/log.
- Không tuyên bố toàn bộ catalog sạch nếu chỉ các hàng đã quan sát được kiểm chứng.

## 5. Thiết kế sửa dữ liệu staging

### 5.1 Preflight và manifest

Operator phải xác nhận chính xác Azure resource group, SQL logical server, database staging và deployed revision trước khi mutation. Một manifest chỉ nằm trong bộ nhớ ghi các ID mục tiêu, giá trị trước sửa, giá trị đúng dự kiến và số hàng mong đợi.

Giá trị đúng được tạo bằng phép đảo codec xác định: mô tả sách dùng `UTF8.decode(CP437.encode(currentValue))`; template và notification dùng `UTF8.decode(Windows1252.encode(currentValue))`. Kết quả chỉ được chấp nhận khi phép đổi ngược tạo lại chính xác preimage và chuỗi mới là Unicode hợp lệ. Mỗi update có điều kiện đồng thời theo primary key và giá trị mojibake ban đầu; nếu preimage hoặc số hàng không khớp, toàn bộ transaction dừng thay vì đoán.

### 5.2 Transaction repair

Một kết nối `mssql` dùng parameterized queries và transaction để:

1. khóa và xác minh `Books.BookId IN (34,35,36,37,38,39,40)` trước khi ghi mô tả đúng;
2. khóa và đặt vị trí chuẩn cho `BookCopies.CopyId IN (60,61,62,63,64)`;
3. chuẩn hóa bốn template theo `TemplateCode`, không phụ thuộc riêng vào ID staging;
4. sửa đúng 17 thông báo lịch sử theo `NotificationId`, `TemplateCode` và preimage; giữ nguyên ID, người nhận, trạng thái, số lần thử và timestamp;
5. đọc lại exact strings trong cùng transaction trước khi commit.

Không có `DELETE`. Bất kỳ mismatch nào đều rollback toàn bộ. Chạy lại sau khi thành công phải tạo zero semantic changes.

### 5.3 Firewall và bí mật

Nếu Azure SQL cần firewall tạm, rule chỉ cho đúng public IP hiện tại và có tên riêng cho run. Rule được xóa trong `finally`, sau đó truy vấn lại để chứng minh không còn rule tạm. Credential chỉ đi qua environment variables của process và không được in ra terminal.

## 6. Migration và deployment guard

Migration mới tại `database/migrations/2026-08-03-fe10-unicode-repair.sql` phải:

- dùng `SET XACT_ABORT ON`, `TRY/CATCH`, transaction và `N'...'` cho Unicode literals;
- đặt bốn template về subject/body chuẩn từ migration ngày 29/07;
- chỉ sửa notification history có template key và chữ ký mojibake đã biết;
- không xóa hoặc thay đổi notification không liên quan;
- dùng so sánh nhị phân/exact-value ở cuối transaction và `THROW` nếu dữ liệu lưu không khớp chuỗi chuẩn;
- an toàn khi chạy hai lần và an toàn khi dữ liệu đã đúng.

Workflow staging phải đóng gói migration mới và kiểm tra hash LF/CRLF tương tự migration FE10 hiện hành. Guide phải dùng `sqlcmd -b -f 65001` ở cả lần chạy chính và lần chạy idempotence.

Deployment gate không chỉ kiểm tra file tồn tại. Migration tự kiểm tra chính xác bốn `TemplateCode`, `Subject`, `Body`, `Status` trước khi commit; guide chạy lại query read-only làm bằng chứng hậu migration. Sai một dấu tiếng Việt làm `sqlcmd -b` thất bại trước khi deploy backend/frontend.

## 7. Xử lý lỗi

| Tình huống | Phản ứng bắt buộc |
| --- | --- |
| Sai server/database/environment | Dừng trước mutation |
| Target ID hoặc preimage khác manifest | Rollback và điều tra drift |
| Số notification không phải 17 ở staging hiện tại | Không cập nhật rộng; đọc lại và xin review phạm vi |
| Migration hoặc exact-string verification thất bại | Không deploy application |
| API vẫn trả mojibake sau SQL repair | Giữ dữ liệu, điều tra tầng repository/serialization; không thêm frontend decoder |
| Browser còn lỗi nhưng API đúng | Kiểm tra cache/font/rendering riêng với bằng chứng mới |
| Xóa firewall tạm thất bại | Báo blocker và exact rule name; không tuyên bố hoàn tất |

## 8. Kiểm thử và xác minh

Triển khai tuân theo RED-GREEN:

1. Thêm test đỏ yêu cầu migration repair có transaction, Unicode literals, bốn template chuẩn, target history guard và không có `DELETE`.
2. Thêm test đỏ yêu cầu mọi lệnh `sqlcmd` migration trong guide có `-b -f 65001`.
3. Thêm test đỏ yêu cầu workflow đóng gói và xác minh migration repair theo exact head/hash.
4. Viết migration/runbook/workflow tối thiểu để các test xanh.
5. Chạy backend notification tests, deployment tests, frontend tests, traceability, secret scan và `git diff --check`.
6. Sau merge, chạy direct SQL exact-string checks và API checks cho catalog/inbox.
7. Kiểm tra giao diện desktop/mobile tại catalog, tạo yêu cầu mượn và hộp thư thông báo; frontend phải chỉ render dữ liệu đúng từ API.
8. Xác nhận không còn temporary firewall rule.

Baseline trước thay đổi đã đạt: deployment 20/20, backend notification repository 7/7 và frontend 281/281.

## 9. File dự kiến thay đổi

- `database/migrations/2026-08-03-fe10-unicode-repair.sql`
- `.github/workflows/deploy-staging.yml`
- `docs/deployment/azure-staging-guide.md`
- `tests/deployment/stagingWorkflowPolicy.test.js`
- `backend/tests/notificationRepository.test.js`
- `.sdd/specs/feat-notification-management/TASKS.md`
- `.sdd/specs/feat-notification-management/CHANGELOG.md`

Frontend source không nằm trong danh sách dự kiến. Chỉ bổ sung frontend regression nếu runtime evidence chứng minh API đúng nhưng React hiển thị sai.

## 10. Cổng review và Definition of Done

1. Commit thiết kế riêng và người dùng duyệt văn bản này.
2. Lập implementation plan với exact tests, migration order, staging target và rollback.
3. Tạo RED evidence trước implementation; review toàn bộ diff trước commit/push.
4. PR chỉ merge sau required CI và final integration review.
5. Chỉ sau merge mới áp dụng exact reviewed repair lên staging và chạy hậu kiểm.

Batch hoàn tất khi:

- các hàng mục tiêu trả về đúng Unicode qua SQL và API;
- giao diện không còn chuỗi mojibake trong các luồng đã kiểm tra;
- migration chạy hai lần không làm phát sinh thay đổi sai;
- guide và test bắt buộc UTF-8 input cho `sqlcmd`;
- CI, traceability và secret checks đạt;
- temporary firewall rule đã được xóa;
- không có frontend decoding workaround hoặc thay đổi ngoài phạm vi.
