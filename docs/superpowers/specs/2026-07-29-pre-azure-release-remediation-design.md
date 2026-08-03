# Thiết kế addendum — Khắc phục trước khi Azure SQL hồi quota

**Ngày:** 2026-07-29  
**Mẻ:** `PRE-AZURE-RELEASE-REMEDIATION-2026-07-29`
**Trạng thái:** H1 đã được phê duyệt bằng câu trả lời “Duyệt A”; chờ rà soát văn bản trước khi lập kế hoạch triển khai
**mốc cơ sở:** `main@ba29dc00903626e7b0319e727597ca0182e380bc`

## 1. Mục tiêu và ranh giới

lô này xử lý những điểm có thể hoàn tất khi Azure SQL môi trường tiền sản xuất đang `Paused`:

1. Xoay credential kết nối SQL môi trường tiền sản xuất mà không ghi giá trị bí mật vào repo hoặc output.
2. Sửa bàn giao FE07 → FE08 để chỉ trả hành động xử lý khi bản sao trả bình thường và còn hàng đợi hợp lệ.
3. Giữ nguyên `copyId` bàn giao của FE07 khi FE08 tải lại; không tự chuyển sang một bản sao khác nếu bàn giao đã lỗi thời.
4. Chuẩn bị di chuyển dữ liệu FE10 ngày 29/07 trong quy trình và tài liệu triển khai, nhưng không chạy di chuyển dữ liệu trên Azure trong lô này.
5. Đồng bộ trạng thái SDD của FE07/FE08/FE10/FE12 với hợp nhất và CI hiện tại.
6. Bổ sung kiểm tra secret ở mức tệp được Git theo dõi và bật nhánh protection phù hợp với quy trình PR.

Không nằm trong lô:

- Bật tính phí Azure SQL, chờ quota đặt lại, resume cơ sở dữ liệu hoặc chạy `sqlcmd`.
- Deploy App Service/Static Web Apps hoặc chạy golden luồng có đăng nhập trên môi trường tiền sản xuất.
- Thay đổi vòng đời đặt chỗ, tự động hủy/chuyển đặt chỗ cho sách `DAMAGED/LOST`.
- Tạo phát hành tag mới trước khi môi trường tiền sản xuất được nghiệm thu.

## 2. Nguồn chuẩn và phân loại bằng chứng

### Yêu cầu đã được phê duyệt

- `BR-FE07-012` quy định trả bình thường mới chuyển bản sao sang `AVAILABLE` và giữ quyền sở hữu hàng đợi.
- `BR-FE07-013` quy định bản sao mất hoặc hỏng không được tự động cung cấp.
- `FR-FE08-039` quy định trạng thái lỗi thời phải trả `409` hoặc buộc UI tải lại trạng thái chuẩn.
- Thiết kế luồng liên hoàn quy định FE07 chỉ tạo chỉ đọc bàn giao; FE08 mới thực hiện thao tác ghi.

### Hành vi quan sát được cần khắc phục

- máy chủ hiện vẫn đặt `hasActiveQueue = true` cho lượt trả `DAMAGED/LOST`.
- UI FE08 fallback sang bản sao đang hoạt động đầu tiên khi `copyId` bàn giao không còn tồn tại.
- quy trình và Azure guide mới chỉ kiểm tra di chuyển dữ liệu hộp thư đến ngày 27/07.
- Các đầu tài liệu FE07/FE08/FE10/FE12 vẫn ghi trạng thái chờ H3/hợp nhất dù hợp nhất `main` đã hoàn tất.
- Azure SQL đang tạm dừng nên không có bằng chứng thời gian chạy mới cho cơ sở dữ liệu.

## 3. Thiết kế được chọn

### 3.1 bàn giao trả sách

`borrowingRepository.returnBorrowDetail()` tiếp tục giữ đặt chỗ `ACTIVE` trong cùng giao dịch, nhưng
`reservationQueueAction.hasActiveQueue` chỉ bằng `true` khi:

```text
detailStatus = RETURNED
AND copyStatus = AVAILABLE
AND tồn tại reservation ACTIVE
```

Với `DAMAGED` hoặc `LOST`, đặt chỗ không bị xóa hoặc tự động chuyển trạng thái; FE07 chỉ không phát
ra CTA có thể dẫn tới thao tác không hợp lệ. Đây là thay đổi nhỏ nhất để tuân thủ đồng thời
`BR-FE07-012` và `BR-FE07-013`.

### 3.2 bàn giao lỗi thời ở FE08

FE08 giữ nguyên `copyId` được truyền trong `location.state` cho lần tải đầu tiên:

- Nếu bản sao đó còn hàng đợi đang hoạt động: mở đúng hàng đợi.
- Nếu bản sao không còn hàng đợi đang hoạt động: không chọn bản sao khác; hiển thị cảnh báo trạng thái đã thay đổi và cho phép nhân viên chuyển về danh sách/chọn thủ công.
- Các lần tải sau do nhân viên chọn thủ công vẫn có thể giữ lựa chọn hiện tại hoặc chọn bản sao đang hoạt động đầu tiên khi không có bàn giao.

Không có thao tác ghi tự động trong lúc điều hướng.

### 3.3 Credential và Azure preparation

- Tạo credential mới trong phiên PowerShell chỉ dùng trong bộ nhớ.
- Cập nhật SQL logical server quản trị viên mật khẩu, App Service `DB_PASSWORD` và secret tương ứng nếu secret đó tồn tại.
- Không in giá trị, không ghi vào `.env`, không ghi nhận vào kho mã nguồn.
- Thêm di chuyển dữ liệu ngày 29/07 vào kiểm tra trước/hash cổng và deployment guide; cổng chỉ xác nhận tệp/hash, không tự chạy SQL.

### 3.4 quản trị và tài liệu

- Cập nhật trạng thái đầu tệp và phần khóa sổ của bốn chức năng thành:
  `Merged on main; post-merge CI passed; Azure staging blocked by paused SQL quota`.
- Không đánh dấu Azure acceptance là đạt.
- nhánh protection yêu cầu PR, CI đúng HEAD và conversation resolution; không yêu cầu số rà soát ngoài nếu điều đó làm khóa nhóm.
- Secret kiểm tra chỉ quét tệp được Git theo dõi, dùng pattern an toàn và loại các dữ liệu kiểm thử mật khẩu tổng hợp đã được đánh dấu.

## 4. tác nhân và quyền sở hữu

| tác nhân/chức năng | Được khởi tạo | Không được làm | trạng thái sở hữu | bàn giao | Lỗi bắt buộc |
| --- | --- | --- | --- | --- | --- |
| thành viên | Yêu cầu/đặt chỗ của mình, đọc thông báo | Duyệt, trả, xử lý queue, xem báo cáo staff | Không sở hữu giao dịch | FE07/FE08 → FE10 | `401/403/404/409` an toàn |
| thủ thư/quản trị viên | Duyệt/từ chối, trả, gia hạn, xử lý queue, xem báo cáo | Bỏ qua eligibility hoặc tự chọn người thắng | Cho phép FE07/FE08 thao tác ghi | FE07 → FE08 → FE10 → FE12 | Stale trạng thái tải lại, không giả lập thành công |
| FE07 | mượn sách yêu cầu, phê duyệt, trả sách, gia hạn | Chọn người trong queue hoặc gửi thông báo trực tiếp | `BorrowRequests`, `BorrowDetails`, copy trạng thái | chỉ đọc queue bàn giao | hoàn tác lỗi giao dịch; FE10 warning không hoàn tác |
| FE08 | FIFO, hold, expire, queue quyền sở hữu | Duyệt/trả sách hoặc gửi mail trực tiếp | `Reservations`, hold trạng thái | FE08 → FE10 | Race chỉ một giao dịch thắng |
| FE10 | Nhận nguồn yêu cầu và hiển thị hộp thư đến | Quyết định trạng thái mượn/đặt chỗ | `Notifications`, attempts, read trạng thái | hành động path danh sách cho phép | không đạt isolation, idempotency |
| FE12 | Đọc aggregate/report đã phân quyền | thao tác ghi hoặc tính KPI từ danh sách giao diện | Không có chuyển đổi trạng thái | Drill-down chỉ đọc | KPI lỗi hiển thị lỗi, không biến thành `0` |

## 5. Kế hoạch kiểm thử và Định nghĩa hoàn thành

### L1 — Tự động

- Regression máy chủ cho trả `NORMAL`, `DAMAGED`, `LOST` có đặt chỗ.
- Regression giao diện cho bàn giao đúng `copyId`, bàn giao lỗi thời không fallback sang copy khác.
- máy chủ suite, giao diện suite, deployment tests, kiểm tra mã/bản dựng và khả năng truy vết.
- Secret kiểm tra không phát hiện credential trong tracked tệp/khác biệt.

### L2 — Tuân thủ SPEC

- Mỗi thay đổi mã nguồn gắn `@spec` tương ứng.
- `BR-FE07-012/013`, `FR-FE08-039` và acceptance connected-luồng có kiểm thử hoặc bằng chứng.
- di chuyển dữ liệu 29/07 xuất hiện trong quy trình/guide nhưng được ghi rõ là chưa apply trên Azure.

### L3 — Hiến chương và an toàn

- Không secret trong tệp, log, dữ liệu kiểm thử hoặc bản ghi Git.
- Không mở rộng lược đồ/API.
- Không thay đổi tác nhân ranh giới hoặc giao dịch quyền sở hữu.

### L4 - Chấp nhận

- Có thể kiểm tra cục bộ desktop luồng sau khi mã nguồn hoàn tất.
- Azure authenticated acceptance vẫn `BLOCKED` cho tới khi cơ sở dữ liệu hết `Paused`; lô này không tuyên bố môi trường tiền sản xuất đạt.

## 6. tệp dự kiến

- máy chủ: `backend/src/repositories/borrowingRepository.js`, `backend/tests/borrowingRoutes.test.js`, `backend/tests/borrowingRepository.test.js`
- giao diện: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`, kiểm thử FE08 hiện hành
- Phát hành: `.github/workflows/deploy-staging.yml`, `docs/deployment/azure-staging-guide.md`
- Quản trị: `.github/workflows/ci.yml`, cài đặt bảo vệ nhánh, tập lệnh/kiểm tra kiểm tra bí mật
- SDD: `SPEC.md`, `PLAN.md`, `TASKS.md`, `TEST_PLAN.md`, `CONTEXT.md`, `CHANGELOG.md` của FE07/FE08/FE10/FE12

## 7. Rủi ro còn lại

- Azure SQL vẫn có thể tiếp tục `Paused`; việc xoay mật khẩu không chứng minh được kết nối cho tới khi cơ sở dữ liệu hoạt động.
- Secret kiểm tra dạng pattern không thay thế được lịch sử credential rotation hoặc nhà cung cấp scanning.
- bàn giao FE08 lỗi thời cần reviewer xác nhận copy cụ thể trước thao tác ghi, đúng với mốc cơ sở stale-trạng thái hợp đồng.
