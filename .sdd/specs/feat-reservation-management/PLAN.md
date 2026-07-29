# PLAN.md - FE08 Quản lý đặt chỗ

Trạng thái: ĐÃ MERGE VÀO MAIN; CI HẬU MERGE ĐẠT; AZURE STAGING BỊ CHẶN DO AZURE SQL PAUSED/QUOTA

Chủ sở hữu: Nhat

Cập nhật: 2026-07-29

Trạng thái quy trình: Mốc cơ sở Giai đoạn 2 vẫn hoàn tất. `main` sở hữu
`FE08-T041` đến `FE08-T046`; ranh giới hồi quy căn chỉnh quy tắc là
`FE08-T047`. Nhat đã phê duyệt phụ lục H2 `8d0059b` vào 2026-07-27; kết quả
đã rà soát được commit là `f346ae0`, đẩy lên PR nháp #63 và lượt chạy CI
`30244750250` đã đạt. Lần rà soát H3 đầu tiên không phát hiện lỗi mã hay quy
tắc nghiệp vụ FE08 mà chỉ trả về diễn đạt quản trị cũ. Việc khắc phục chỉ tài
liệu vẫn chưa được commit, đang chờ H2 mới và H3 lặp lại.

---

## 1. Phạm vi

Duy trì lát cắt đặt chỗ backend và frontend FE08 Giai đoạn 1 đã phê duyệt từ `SPEC.md`.

Bao gồm:

- API đặt chỗ thành viên và nhân sự hiện có cùng màn hình frontend.
- Trình bày chính tắc vòng đời đặt chỗ FE08 đã phê duyệt.
- Lỗi API tiếng Việt riêng cho đặt chỗ.
- Xử lý hàng đợi nhân sự thủ công và xử lý hết hạn giữ chỗ thủ công.
- Làm mới dựa trên máy chủ sau khi giữ chỗ hết hạn.
- Bàn giao FE07 giữ ưu tiên hàng đợi và hoàn tất lượt giữ của chủ sở hữu đã thông báo trong khi phê duyệt mượn.
- Phân trang danh sách đặt chỗ xác định và thứ tự danh sách/hàng đợi ổn định.
- Tìm kiếm và phân trang ứng viên đặt chỗ an toàn cho thành viên được bảo vệ, dựa trên trạng thái SQL.
- Loại danh mục `DEMO_RESERVABLE` mã cứng.

Không bao gồm:

- Tự động hóa trả FE07 hoặc triển khai mượn chung ngoài bàn giao đặt chỗ đã phê duyệt.
- Thay đổi worker giao email FE10.
- Xử lý hàng đợi hoặc job hết hạn giữ chỗ tự động.

---

## 2. Quyết định đã phê duyệt được dùng

| Quyết định | Tác động tới kế hoạch |
| --- | --- |
| Mục tiêu đặt chỗ là `CopyId` | `POST /api/reservations` và xử lý hàng đợi yêu cầu `copyId`. |
| Bản sao khả dụng không thể đặt chỗ | Yêu cầu bản sao khả dụng trả xung đột và hướng người dùng sang mượn. |
| Tối đa 3 lượt đặt chỗ đang hoạt động | Service từ chối lượt đặt chỗ đang hoạt động thứ tư của cùng thành viên. |
| Cửa sổ giữ chỗ là 2 ngày dương lịch | Xử lý hàng đợi đặt `ExpiresAt` bằng hiện tại + 2 ngày. |
| Xử lý hàng đợi thủ công trong Giai đoạn 1 | Nhân sự kích hoạt `/api/reservations/process-queue`. |
| Nguồn ứng viên thành viên là API FE08 được bảo vệ | `GET /api/reservations/candidates` trả một hàng đã che bớt cho mỗi bản sao `BORROWED`/`RESERVED` của sách đang hoạt động; hợp đồng FE01 và FE06 không đổi. |
| Bàn giao sách đã chọn FE01 vẫn an toàn theo bản sao | `/reservations/mine?bookId=...` phân giải tiêu đề công khai và khởi tạo tìm kiếm ứng viên FE08; Thành viên vẫn chọn `copyId` được bảo vệ có thẩm quyền trước thay đổi. |

---

## 3. Kế hoạch triển khai

### 3.1 API và kiểm soát truy cập

- Dùng route `/api/reservations` hiện có dưới Express.
- Tái sử dụng xác thực token FE02.
- Thực thi thao tác chỉ thành viên cho tạo, danh sách riêng và hủy.
- Thực thi thao tác chỉ thủ thư/quản trị viên cho liệt kê tất cả và xử lý hàng đợi.

### 3.2 Tạo đặt chỗ

- Xác thực `copyId`.
- Xác nhận actor tự phục vụ thành viên đang hoạt động, có `MEMBER` và không có `LIBRARIAN` cũng không có `ADMIN`; không yêu cầu phê duyệt FE04.
- Từ chối bản sao khả dụng, hỏng, mất hoặc không hoạt động.
- Từ chối đặt chỗ đang hoạt động trùng lặp cho cùng bản sao.
- Từ chối khi thành viên đã có 3 lượt đặt chỗ đang hoạt động.
- Chèn đặt chỗ `ACTIVE` và giữ thứ tự hàng đợi theo `ReservedAt` / `QueuePosition`.

### 3.3 Thao tác đặt chỗ thành viên

- Chỉ trả lượt đặt chỗ của thành viên hiện tại từ `/api/reservations/me`.
- Chỉ cho phép hủy bởi chủ sở hữu khi đặt chỗ là `ACTIVE` hoặc `NOTIFIED`.
- Đánh dấu bản ghi hủy là `CANCELLED` cùng `CancelledAt`; hủy đặt chỗ `NOTIFIED` giải phóng bản sao được giữ nguyên tử.

### 3.4 Thao tác hàng đợi nhân sự

- Trả danh sách đặt chỗ có chi tiết thành viên và sách/bản sao.
- Chọn lượt đặt chỗ `ACTIVE` hợp lệ sớm nhất cho bản sao.
- Giữ bản sao bằng cách đặt `BookCopies.Status = RESERVED`.
- Đặt `NotifiedAt` và `ExpiresAt`.
- Tạo yêu cầu thông báo `RESERVATION_READY` cho FE10.

### 3.5 Kiểm thử

- Thêm kiểm thử cấp route dùng repository trong bộ nhớ.
- Bao phủ tạo, trùng lặp, từ chối bản sao khả dụng, giới hạn đang hoạt động, hủy chỉ chủ sở hữu, danh sách nhân sự, thứ tự hàng đợi, yêu cầu thông báo và bảo vệ một vai trò.
- Chạy bộ Jest backend trước bàn giao.

### 3.6 Tính đúng đắn frontend

- Ánh xạ `NOTIFIED` thành sẵn sàng nhận sách và `FULFILLED` thành hoàn thành.
- Chỉ giữ lượt đặt chỗ `Waiting` (`ACTIVE`) trong hàng đợi thủ thư; chỉ hiển thị `Ready to pick up` (`NOTIFIED`) trong danh sách mọi đặt chỗ.
- Dùng bộ phân giải lỗi tiếng Việt chỉ cho đặt chỗ.
- Công khai endpoint hết hạn giữ chỗ hiện có cho nhân sự, tải lại trạng thái máy chủ chính tắc và chỉ báo thành công sau khi lần tải lại đó thành công.
- Không công khai điều khiển hoàn tất hoặc xóa chỉ cục bộ.

### 3.7 Bàn giao mượn FE07

- Giữ quyền sở hữu FE08 về thứ tự hàng đợi, xử lý hàng đợi, hủy và hết hạn.
- Công khai yêu cầu đặt chỗ `ACTIVE` và `NOTIFIED` cho xác thực tạo/phê duyệt FE07.
- Coi phê duyệt FE07 cho cùng thành viên và bản sao là kích hoạt `NOTIFIED -> FULFILLED` duy nhất.
- Dùng thứ tự khóa dùng chung `BookCopies -> Reservations` cho các chuyển đổi giữ, hủy, hết hạn và hoàn tất.
- Giữ xử lý hàng đợi thủ công và không thêm endpoint, trường schema hay job tự động.

### 3.8 Chuẩn hóa v0.4.2

- Giữ `CopyId` là mục tiêu đặt chỗ Giai đoạn 1 duy nhất; từ chối `bookId` trong payload tạo/xử lý-hàng-đợi.
- Làm mục hàng đợi không đủ điều kiện có tính xác định: bỏ qua trong lần chạy hiện tại, giữ `ACTIVE` và giữ bản sao không đổi.
- Làm hàng đợi rỗng có tính xác định: không chọn gì và không thay đổi trạng thái bản sao/đặt chỗ.
- Làm lỗi FE10 có tính xác định: giữ lượt giữ đã commit và ghi `RESERVATION_NOTIFY_FAILED`; không có worker thử lại tự động.
- Thêm `page = 1`, `limit = 20`, giới hạn `page >= 1`, `limit = 1..100` và thứ tự danh sách/hàng đợi ổn định.
- Đối soát `QueuePosition`, `NotifiedAt`, `ExpiresAt` và `CancelledAt` với ngữ nghĩa lịch sử thông báo bất biến: dấu thời gian thông báo/hết hạn tồn tại qua chuyển đổi kết thúc, trong khi `CancelledAt` chỉ tồn tại ở hàng đã hủy.
- Giữ thứ tự khóa dùng chung `BookCopies -> Reservations` cho hàng đợi, hủy, hết hạn và hoàn tất FE07.

### 3.9 Danh mục ứng viên đặt chỗ v0.4.4

- Thêm `GET /api/reservations/candidates` chỉ thành viên có `q`, `page` và `limit` tùy chọn.
- Trả chính xác `copyId`, `bookId`, `title`, `authorName` nullable, `copyStatus` và `activeReservationCount` trong `{ data, pagination }`.
- Lọc tới sách đang hoạt động và bản sao vật lý ở `BORROWED` hoặc `RESERVED`; sắp xếp theo tiêu đề, ID sách rồi ID bản sao.
- Giữ đường đọc có tham số, chỉ đọc, không audit và độc lập với duyệt công khai FE01 và tồn kho nhân sự FE06.
- Giữ `POST /api/reservations { copyId }` có thẩm quyền cho điều kiện hợp lệ thành viên, trùng lặp, giới hạn và kiểm tra xung đột bản sao cũ.
- Thay `DEMO_RESERVABLE` bằng trạng thái ứng viên máy chủ; tìm kiếm và phân trang do máy chủ sở hữu, UI không tạo ETA hay số lượng khả dụng.

---

## 4. Ghi chú rà soát

- Kế hoạch này bao phủ lát cắt đặt chỗ backend và frontend đã phê duyệt.
- Trình bày vòng đời frontend, ngữ nghĩa hàng đợi, cô lập lỗi và xử lý hết hạn giữ chỗ được căn chỉnh với `SPEC.md`.
- Phê duyệt FE07 chỉ có thể hoàn tất lượt đặt chỗ đã thông báo khớp; xử lý hàng đợi tự động sau trả vẫn ngoài Giai đoạn 1.
- Các tác vụ đối soát v0.4.2/v0.4.3 được triển khai và giữ ranh giới bằng chứng lịch sử.
- Hợp đồng ứng viên v0.4.4 đã được phê duyệt rõ ràng và đạt cổng tự động tập trung/đầy đủ; H3 cuối, merge và CI `main` sau merge vẫn đang mở.

## 5. Bằng chứng hoàn tất B7

- Commit `236043864304627f3577baafa9b8648c13c7a691` nằm trong `main`.
- Lượt chạy GitHub Actions CI `29217437981` đã hoàn thành thành công cho commit đó.
- Bản ghi tích hợp/rà soát theo phạm vi là `.sdd/reviews/fe08-b7-integration-review-closeout-2026-07-13.md`.

## 6. Cổng xác minh v0.4.2

| Cổng | Lệnh | Kết quả mong đợi |
| --- | --- | --- |
| Backend FE08 | `npm.cmd --prefix backend test -- --runTestsByPath tests/reservationRoutes.test.js tests/integration.test.js` | Các ca hàng đợi xác định, phân trang, audit lỗi và vòng đời đạt. |
| Frontend FE08 | `node --test frontend/test/reservationFrontend.test.js` | Các ca vòng đời chính tắc, cô lập lỗi và làm mới máy chủ đạt khi tệp tập trung tồn tại. |
| Truy vết | `npm.cmd run trace:enforce` | Các tệp FE08 thay đổi thỏa ngưỡng truy vết. |
| Vệ sinh diff | `git diff --check` | Không có lỗi khoảng trắng. |
| Backend ứng viên FE08 | `npm.cmd --prefix backend test -- --runTestsByPath tests/reservationRoutes.test.js` | Các ca vai trò, xác thực, tìm kiếm, phân trang, che bớt, thứ tự và không thay đổi đạt. |
| SQL ứng viên FE08 | `npm.cmd --prefix backend test -- --runTestsByPath tests/sql/reservationCandidates.sqltest.js` | Lọc SQL thực, số đếm đang hoạt động, thứ tự, phân trang và projection an toàn đạt trên SQL Server dùng một lần. |
| Trình duyệt ứng viên FE08 | Playwright cô lập `tests/e2e/fe08-reservation-candidate-catalog.spec.js` | Luồng danh mục/tìm kiếm/tạo/làm mới thành viên đạt mà không lộ siêu dữ liệu được bảo vệ. |

## 7. Cổng rà soát và triển khai mốc cơ sở v0.4.3

- [x] Nhat xác nhận hợp đồng process-queue chỉ `CopyId` vào 2026-07-17.
- [x] Nhat xác nhận chính sách bỏ qua/hàng đợi rỗng/không thử lại thông báo vào 2026-07-17.
- [x] Nhat xác nhận phân trang và thứ tự ổn định vào 2026-07-17.
- [x] Nhat xác nhận hoàn tất FE07 vẫn là kích hoạt `NOTIFIED -> FULFILLED` duy nhất vào 2026-07-17.

## 8. Cổng rà soát và triển khai ứng viên v0.4.4

- [x] Người dùng phê duyệt Phương án A TD-028 vào 2026-07-19.
- [x] Người dùng phê duyệt `docs/superpowers/specs/2026-07-19-fe08-reservation-candidate-catalog-design.md` vào 2026-07-19.
- [x] Kế hoạch triển khai được ghi tại `docs/superpowers/plans/2026-07-19-fe08-reservation-candidate-catalog.md`.
- [x] Triển khai và bằng chứng FE08-T035 đến FE08-T039 đạt.
- [x] Cổng quyết định A ghi nhận hợp đồng Phương án A đã phê duyệt.
- [ ] Cổng quyết định B / H3 được cập nhật theo đầu PR xanh cuối và CI sau walkthrough của con người.

## 9. Khắc phục audit vòng đời nguyên tử và lan truyền cảnh báo v0.5.3

1. Truyền từng audit vòng đời tạo/hủy/giữ/hết hạn vào giao dịch repository sở hữu và hoàn tác cả trạng thái lẫn audit khi một trong hai thất bại.
2. Giữ giao thông báo FE10 sau commit giữ chỗ. Bảo toàn lượt giữ khi thông báo thất bại và ghi `RESERVATION_NOTIFY_FAILED` riêng.
3. Nếu audit lỗi sau commit đó không sẵn có, trả metadata cảnh báo `RESERVATION_NOTIFY_AUDIT_FAILED` an toàn mà không hoàn tác lượt giữ.
4. Loại danh tính thành viên cache khỏi xác nhận nhân sự; xác định bản sao vật lý và giải thích việc chọn lại điều kiện hợp lệ phía máy chủ.
5. Giữ cảnh báo `process-queue` đơn lẻ hiện có và thu một mục `{ reservationId, copyId, code, message }` an toàn cho mỗi lượt nâng `expire-holds` bị ảnh hưởng trong `notificationWarnings[]` tùy chọn cấp cao nhất; giữ DTO đặt chỗ đã nâng không đổi.
6. Xác minh thứ tự giao dịch repository, hành vi service/route, nội dung xác nhận frontend và hồi quy đầy đủ trước H2.

## 10. Trình bày trạng thái hiện tại và lịch sử thành viên v0.5.6

1. Giữ `GET /api/reservations/me` làm nguồn chính tắc và giữ mọi bản ghi vòng đời.
2. Trình bày `ACTIVE` và `NOTIFIED` là lượt đặt chỗ hiện tại; trình bày `FULFILLED`, `CANCELLED` và `EXPIRED` trong phần lịch sử riêng.
3. Suy ra nhãn tiếng Việt hiển thị và sắc độ badge được hỗ trợ từ trạng thái vòng đời FE08 thô.
4. Phản ánh lượt đặt chỗ hiện tại khớp trong thao tác ứng viên là `Đang đặt chỗ` hoặc `Đến lượt bạn`.
5. Tải lại lượt đặt chỗ và ứng viên thành viên chính tắc sau tạo/hủy mà không đổi hợp đồng hàng đợi Thủ thư/Quản trị viên hay quyền sở hữu hoàn tất FE07.

## 11. Cửa sổ nhận sách đã thông báo và bàn giao FE07 v0.5.7

1. Dùng giá trị `NotifiedAt` và `ExpiresAt` chính tắc của FE08 làm cửa sổ nhận sách Thành viên; không thêm ngày nhập thủ công thứ hai.
2. Chỉ hiển thị thông báo rõ ràng sẵn sàng nhận sách cho lượt đặt chỗ `NOTIFIED`.
3. Truyền chính xác `bookId` và `copyId` được giữ cho FE07 để Thành viên tạo yêu cầu mượn đang chờ bình thường cho bản sao vật lý đó.
4. Giữ xử lý hàng đợi Thủ thư/Quản trị viên trong FE08 và phê duyệt mượn/hoàn tất đặt chỗ nguyên tử trong FE07.
5. Giữ assertion chấp nhận Chromium FE08 trên nhãn `Đang đặt chỗ` hiện tại.

## 12. Loại trừ khoản mượn cùng sách hiện tại v0.5.8

1. Coi `BorrowDetails.Status = BORROWED` FE07 được join qua `BookId` của bản sao vật lý là tín hiệu khoản mượn hiện tại có thẩm quyền.
2. Loại mọi bản sao cùng sách khỏi danh mục ứng viên FE08 của Thành viên yêu cầu.
3. Xác thực lại trong giao dịch tạo và trả `409 BOOK_ALREADY_BORROWED` để lời gọi API trực tiếp không thể vượt danh mục.
4. Xác thực lại điều kiện hợp lệ hàng đợi khi Thủ thư/Quản trị viên xử lý bản sao đã trả; giữ đặt chỗ cũ `ACTIVE` và bản sao không đổi trong khi tiếp tục sang Thành viên hợp lệ tiếp theo.
5. Chia sẻ khóa lưu hành thành viên FE07 trước khóa thay đổi FE08 để phê duyệt mượn và tạo/giữ đặt chỗ không thể race cùng Thành viên.

## 13. Làm rõ vị trí hàng đợi theo phạm vi bản sao v0.5.9

1. Giữ tính toán hàng đợi FE08 chính tắc cho mỗi `CopyId`; không thêm chuỗi đặt chỗ Thành viên toàn cục.
2. Thay copy “Vị trí hàng đợi” mơ hồ bằng “Vị trí của bản sách” cho Thành viên và nhân sự.
3. Hiển thị vị trí thuộc sách/bản sao hiện tại và giữ giá trị bằng nhau trên các hàng đợi khác nhau.
4. Giữ vị trí chính tắc thiếu là null và hiển thị `Chưa xác định`; không bao giờ tạo `#1` hay chuyển null thành chuỗi.

## 14. Ranh giới tích hợp main mới nhất v0.5.10

1. Không thêm thay đổi mã production, schema, API, vòng đời hay chính sách hàng đợi FE08 ngoài trình bày an toàn null theo FR-FE08-035.
2. Giữ `FE08-T041` đến `FE08-T046` từ `main` và dùng `FE08-T047` cho xác minh chỉ hồi quy của batch này.
3. Thêm kiểm thử hợp đồng frontend thất bại cho vị trí hàng đợi Thành viên/nhân sự null, sau đó thực hiện sửa trình bày nhỏ nhất.
4. Chạy lại kiểm thử requester đặt chỗ tập trung chứng minh FE08 tạo yêu cầu FE10 `RESERVATION_AVAILABLE -> RESERVATION_READY` chính tắc.
5. Chạy lại `SIT-003` chứng minh giữ hàng đợi cộng tạo thông báo và `SIT-004` chứng minh ưu tiên FE08 vẫn chặn gia hạn FE07 mà không thay đổi.
6. Coi mọi lỗi FE08 là blocker cần chẩn đoán/quyết định đặc tả mới; không mở rộng batch này một cách im lặng.

## 15. Kế hoạch batch liên hoàn v0.6.0

1. `SL-001`: merge governance activation.
2. `SL-004` RED/GREEN: owner-only held-copy CTA, staff decision surface, safe
   notification warning và stale `409` refresh.
3. Duy trì xử lý FIFO thủ công dưới transaction; FE07 chỉ handoff/điều hướng.
4. Chạy reservation service/routes/frontend focused tests, race integration và
   `SL-006` desktop E2E.
5. Core builder duy nhất sửa production; product diff uncommitted đến H2.
