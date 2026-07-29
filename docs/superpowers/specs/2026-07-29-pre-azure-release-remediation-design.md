# Thiết kế addendum — Khắc phục trước khi Azure SQL hồi quota

**Ngày:** 2026-07-29  
**Batch:** `PRE-AZURE-RELEASE-REMEDIATION-2026-07-29`  
**Trạng thái:** H1 đã được phê duyệt bằng câu trả lời “Duyệt A”; chờ review văn bản trước khi lập kế hoạch triển khai  
**Baseline:** `main@ba29dc00903626e7b0319e727597ca0182e380bc`

## 1. Mục tiêu và ranh giới

Batch này xử lý những điểm có thể hoàn tất khi Azure SQL staging đang `Paused`:

1. Xoay credential kết nối SQL staging mà không ghi giá trị bí mật vào repo hoặc output.
2. Sửa handoff FE07 → FE08 để chỉ trả hành động xử lý khi bản sao trả bình thường và còn hàng đợi hợp lệ.
3. Giữ nguyên `copyId` handoff của FE07 khi FE08 tải lại; không tự chuyển sang một bản sao khác nếu handoff đã lỗi thời.
4. Chuẩn bị migration FE10 ngày 29/07 trong workflow và tài liệu triển khai, nhưng không chạy migration trên Azure trong batch này.
5. Đồng bộ trạng thái SDD của FE07/FE08/FE10/FE12 với merge và CI hiện tại.
6. Bổ sung kiểm tra secret ở mức file được Git theo dõi và bật branch protection phù hợp với quy trình PR.

Không nằm trong batch:

- Bật tính phí Azure SQL, chờ quota reset, resume database hoặc chạy `sqlcmd`.
- Deploy App Service/Static Web Apps hoặc chạy golden flow có đăng nhập trên staging.
- Thay đổi vòng đời reservation, tự động hủy/chuyển reservation cho sách `DAMAGED/LOST`.
- Tạo release tag mới trước khi staging được nghiệm thu.

## 2. Nguồn chuẩn và phân loại bằng chứng

### Yêu cầu đã được phê duyệt

- `BR-FE07-012` quy định trả bình thường mới chuyển bản sao sang `AVAILABLE` và giữ quyền sở hữu hàng đợi.
- `BR-FE07-013` quy định bản sao mất hoặc hỏng không được tự động cung cấp.
- `FR-FE08-039` quy định trạng thái lỗi thời phải trả `409` hoặc buộc UI tải lại trạng thái chuẩn.
- Thiết kế luồng liên hoàn quy định FE07 chỉ tạo read-only handoff; FE08 mới thực hiện mutation.

### Hành vi quan sát được cần khắc phục

- Backend hiện vẫn đặt `hasActiveQueue = true` cho lượt trả `DAMAGED/LOST`.
- UI FE08 fallback sang bản sao active đầu tiên khi `copyId` handoff không còn tồn tại.
- Workflow và Azure guide mới chỉ kiểm tra migration inbox ngày 27/07.
- Các đầu tài liệu FE07/FE08/FE10/FE12 vẫn ghi trạng thái chờ H3/merge dù merge `main` đã hoàn tất.
- Azure SQL đang tạm dừng nên không có bằng chứng runtime mới cho database.

## 3. Thiết kế được chọn

### 3.1 Handoff trả sách

`borrowingRepository.returnBorrowDetail()` tiếp tục giữ reservation `ACTIVE` trong cùng transaction, nhưng `reservationQueueAction.hasActiveQueue` chỉ bằng `true` khi:

```text
detailStatus = RETURNED
AND copyStatus = AVAILABLE
AND tồn tại reservation ACTIVE
```

Với `DAMAGED` hoặc `LOST`, reservation không bị xóa hoặc tự động chuyển trạng thái; FE07 chỉ không phát ra CTA có thể dẫn tới thao tác không hợp lệ. Đây là thay đổi nhỏ nhất để tuân thủ đồng thời `BR-FE07-012` và `BR-FE07-013`.

### 3.2 Handoff lỗi thời ở FE08

FE08 giữ nguyên `copyId` được truyền trong `location.state` cho lần tải đầu tiên:

- Nếu bản sao đó còn hàng đợi active: mở đúng hàng đợi.
- Nếu bản sao không còn hàng đợi active: không chọn bản sao khác; hiển thị cảnh báo trạng thái đã thay đổi và cho phép nhân viên chuyển về danh sách/chọn thủ công.
- Các lần tải sau do nhân viên chọn thủ công vẫn có thể giữ lựa chọn hiện tại hoặc chọn bản sao active đầu tiên khi không có handoff.

Không có mutation tự động trong lúc điều hướng.

### 3.3 Credential và Azure preparation

- Tạo credential mới trong phiên PowerShell chỉ dùng trong bộ nhớ.
- Cập nhật SQL logical server admin password, App Service `DB_PASSWORD` và secret tương ứng nếu secret đó tồn tại.
- Không in giá trị, không ghi vào `.env`, không commit vào repo.
- Thêm migration ngày 29/07 vào preflight/hash gate và deployment guide; gate chỉ xác nhận file/hash, không tự chạy SQL.

### 3.4 Governance và tài liệu

- Cập nhật trạng thái đầu file và phần closeout của bốn feature thành:
  `Merged on main; post-merge CI passed; Azure staging blocked by paused SQL quota`.
- Không đánh dấu Azure acceptance là đạt.
- Branch protection yêu cầu PR, CI exact-head và conversation resolution; không yêu cầu số review ngoài nếu điều đó làm khóa nhóm.
- Secret check chỉ quét file được Git theo dõi, dùng pattern an toàn và loại các fixture mật khẩu tổng hợp đã được đánh dấu.

## 4. Actor và ownership

| Actor/feature | Được khởi tạo | Không được làm | State sở hữu | Handoff | Lỗi bắt buộc |
| --- | --- | --- | --- | --- | --- |
| Member | Yêu cầu/đặt chỗ của mình, đọc thông báo | Duyệt, trả, xử lý queue, xem report staff | Không sở hữu transaction | FE07/FE08 → FE10 | `401/403/404/409` an toàn |
| Librarian/Admin | Duyệt/từ chối, trả, gia hạn, xử lý queue, xem report | Bỏ qua eligibility hoặc tự chọn người thắng | Cho phép FE07/FE08 mutation | FE07 → FE08 → FE10 → FE12 | Stale state tải lại, không giả lập thành công |
| FE07 | Borrow request, approval, return, renewal | Chọn người trong queue hoặc gửi thông báo trực tiếp | `BorrowRequests`, `BorrowDetails`, copy state | Read-only queue handoff | Rollback lỗi transaction; FE10 warning không rollback |
| FE08 | FIFO, hold, expire, queue ownership | Duyệt/trả sách hoặc gửi mail trực tiếp | `Reservations`, hold state | FE08 → FE10 | Race chỉ một transaction thắng |
| FE10 | Nhận source request và hiển thị inbox | Quyết định state mượn/đặt chỗ | `Notifications`, attempts, read state | Action path allowlist | Failure isolation, idempotency |
| FE12 | Đọc aggregate/report đã phân quyền | Mutation hoặc tính KPI từ danh sách frontend | Không có state transition | Drill-down read-only | KPI lỗi hiển thị lỗi, không biến thành `0` |

## 5. Kế hoạch kiểm thử và Definition of Done

### L1 — Tự động

- Regression backend cho trả `NORMAL`, `DAMAGED`, `LOST` có reservation.
- Regression frontend cho handoff đúng `copyId`, handoff lỗi thời không fallback sang copy khác.
- Backend suite, frontend suite, deployment tests, lint/build và traceability.
- Secret check không phát hiện credential trong tracked files/diff.

### L2 — Tuân thủ SPEC

- Mỗi thay đổi code gắn `@spec` tương ứng.
- `BR-FE07-012/013`, `FR-FE08-039` và acceptance connected-flow có test hoặc evidence.
- Migration 29/07 xuất hiện trong workflow/guide nhưng được ghi rõ là chưa apply trên Azure.

### L3 — Hiến chương và an toàn

- Không secret trong file, log, fixture hoặc commit.
- Không mở rộng schema/API.
- Không thay đổi actor boundary hoặc transaction ownership.

### L4 — Acceptance

- Có thể kiểm tra local desktop flow sau khi code hoàn tất.
- Azure authenticated acceptance vẫn `BLOCKED` cho tới khi database hết `Paused`; batch này không tuyên bố staging pass.

## 6. Files dự kiến

- Backend: `backend/src/repositories/borrowingRepository.js`, `backend/tests/borrowingRoutes.test.js`, `backend/tests/borrowingRepository.test.js`
- Frontend: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`, test FE08 hiện hành
- Release: `.github/workflows/deploy-staging.yml`, `docs/deployment/azure-staging-guide.md`
- Governance: `.github/workflows/ci.yml`, branch protection settings, secret-check script/test
- SDD: `SPEC.md`, `PLAN.md`, `TASKS.md`, `TEST_PLAN.md`, `CONTEXT.md`, `CHANGELOG.md` của FE07/FE08/FE10/FE12

## 7. Rủi ro còn lại

- Azure SQL vẫn có thể tiếp tục `Paused`; việc xoay password không chứng minh được kết nối cho tới khi database hoạt động.
- Secret check dạng pattern không thay thế được lịch sử credential rotation hoặc provider scanning.
- Handoff FE08 lỗi thời cần reviewer xác nhận copy cụ thể trước mutation, đúng với baseline stale-state contract.
