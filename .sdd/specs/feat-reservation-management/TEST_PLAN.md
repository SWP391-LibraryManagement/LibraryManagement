# Kế hoạch kiểm thử FE08 - Quản lý đặt chỗ

Phiên bản: 0.6.0
Trạng thái: ĐÃ MERGE VÀO MAIN; CI HẬU MERGE ĐẠT; AZURE STAGING BỊ CHẶN DO AZURE SQL PAUSED/QUOTA
Cập nhật lần cuối: 2026-07-29

Đặc tả nguồn: `.sdd/specs/feat-reservation-management/SPEC.md` v0.6.0
ID tính năng: `BR-FE08-*`, `FR-FE08-*`, `AC-FE08-*`
Ánh xạ AC-đến-kiểm thử có thẩm quyền: Phần 16 Ma trận truy vết trong `SPEC.md` (tệp này mô tả chiến lược, không phải danh sách ca kiểm thử).

---

## 1. Phạm vi kiểm thử

Tạo đặt chỗ cho bản sao vật lý, hiển thị thành viên và nhân sự, xử lý hàng đợi xác định, hủy, hết hạn giữ chỗ, bàn giao hoàn tất FE07, lỗi thông báo FE10, ủy quyền, phân trang, thứ tự, toàn vẹn giao dịch và truy vết audit.

Các tác vụ vòng đời đã chuẩn hóa và danh mục ứng viên đã hoàn tất phía agent. Bằng chứng tự động chứng minh FE08-T028 đến FE08-T039; tích hợp của con người vẫn là cổng riêng.

## 2. Mục tiêu kiểm thử đơn vị / service

- Điều kiện hợp lệ: người dùng hoạt động, thành viên đã phê duyệt, bản sao vật lý không khả dụng, đặt chỗ đang hoạt động trùng lặp và tối đa 3 lượt đặt chỗ đang hoạt động.
- Xác thực hợp đồng: `CopyId` là mục tiêu đặt chỗ duy nhất; `bookId` bị từ chối từ `process-queue` và giá trị không hợp lệ bị từ chối trước khi truy cập repository.
- Chọn hàng đợi: phạm vi bản sao chính xác, thứ tự `ReservedAt ASC, ReservationId ASC`, loại trừ đã hủy/hết hạn và nhiều nhất một lượt giữ `NOTIFIED` mỗi bản sao.
- Trình bày hàng đợi: vị trí bằng nhau trên các bản sao khác nhau vẫn hợp lệ, nhãn xác định hàng đợi theo phạm vi bản sao và vị trí chính tắc null hiển thị `Chưa xác định` thay vì giá trị tự tạo hoặc được chuyển thành chuỗi.
- Mục hàng đợi không đủ điều kiện: bỏ qua trong lần chạy hiện tại, giữ `ACTIVE` và để bản sao không đổi.
- Khoản mượn cùng sách hiện tại: trạng thái `BORROWED` FE07 loại mọi ứng viên cùng `BookId`, tạo trực tiếp trả `BOOK_ALREADY_BORROWED`, lịch sử khoản mượn kết thúc không chặn và mục hàng đợi cũ bị bỏ qua mà không thay đổi.
- Hàng đợi rỗng: không chọn gì và giữ trạng thái bản sao/đặt chỗ không đổi.
- Tạo giữ chỗ: đặt `RESERVED`, `NotifiedAt`, `ExpiresAt` và siêu dữ liệu hàng đợi một cách nguyên tử; ghi yêu cầu thông báo và sự kiện audit.
- Lịch sử dấu thời gian kết thúc: hoàn tất, hết hạn và hủy khi đã thông báo giữ `NotifiedAt`/`ExpiresAt` ban đầu; hàng kết thúc chưa từng thông báo giữ chúng null; chỉ hàng đã hủy đặt `CancelledAt`.
- Lỗi thông báo: giữ lượt giữ `NOTIFIED`/`RESERVED` đã commit và ghi `RESERVATION_NOTIFY_FAILED`; không tạo thử lại tự động.
- Hủy: chỉ chủ sở hữu đối với `ACTIVE` hoặc `NOTIFIED`; từ chối đặt chỗ kết thúc hoặc của người khác; giải phóng bản sao được giữ nguyên tử.
- Hết hạn: hết hạn lượt giữ `NOTIFIED` quá hạn và nâng lượt đặt chỗ hợp lệ tiếp theo mà không vi phạm thứ tự hàng đợi.
- Bàn giao FE07: chỉ cùng thành viên mượn cùng bản sao đã thông báo mới có thể chuyển đặt chỗ sang `FULFILLED`; mượn/gia hạn của thành viên khác vẫn bị chặn mà không lộ chủ sở hữu.
- Audit và đồng thời: mọi thay đổi vòng đời có thể truy vết và các lần thử hàng đợi đồng thời không thể chọn cùng một lượt đặt chỗ hai lần.

## 3. Mục tiêu kiểm thử API / tích hợp

- `POST /api/reservations`: tạo thành công, tài khoản không hoạt động, thành viên chưa phê duyệt, thiếu bản sao, bản sao khả dụng, trùng lặp, từ chối giới hạn đang hoạt động và `409 BOOK_ALREADY_BORROWED` cho khoản mượn cùng sách hiện tại.
- `GET /api/reservations/me`: cô lập thành viên, mặc định `page = 1` và `limit = 20`, từ chối page/limit không hợp lệ không chuẩn hóa.
- `GET /api/reservations`: truy cập chỉ nhân sự, từ chối thành viên, bộ lọc, thứ tự `ReservedAt ASC, ReservationId ASC` ổn định, mặc định và từ chối page/limit không hợp lệ.
- `POST /api/reservations/process-queue`: truy cập chỉ nhân sự, `copyId` bắt buộc, từ chối `bookId`, đặt chỗ được chọn, hàng đợi rỗng, bỏ qua không đủ điều kiện, lỗi thông báo và chọn đồng thời.
- `POST /api/reservations/expire-holds`: hết hạn giữ chỗ quá hạn, nâng người hợp lệ tiếp theo và trạng thái không đổi khi không có giữ chỗ quá hạn.
- `PATCH /api/reservations/:reservationId/cancel`: thành công chỉ chủ sở hữu, từ chối chủ sở hữu khác, xung đột trạng thái kết thúc và giải phóng bản sao được giữ nguyên tử.
- Tích hợp FE07: hoàn tất chủ sở hữu khớp, từ chối mượn thành viên khác, ưu tiên hàng đợi đang hoạt động, từ chối gia hạn và không tiết lộ chủ sở hữu đặt chỗ.
- Danh mục ứng viên: `GET /api/reservations/candidates` chỉ Thành viên, lọc `BORROWED`/`RESERVED` của sách đang hoạt động, loại trừ khoản mượn cùng `BookId` hiện tại, che bớt bảy trường gồm `hasActiveReservation` theo phạm vi thành viên, tìm kiếm/phân trang máy chủ, thứ tự xác định, số đếm đang hoạt động, thao tác trùng lặp bị vô hiệu hóa và thay đổi `POST /api/reservations { copyId }` có thẩm quyền.

## 4. Luồng chấp nhận E2E / thủ công

- Thành viên đủ điều kiện đặt một bản sao không khả dụng -> nhân sự xử lý hàng đợi -> yêu cầu thông báo FE10 được tạo -> cùng thành viên mượn bản sao được giữ -> đặt chỗ thành `FULFILLED` và bản sao thành `BORROWED` nguyên tử.
- Hai thành viên xếp hàng cho một bản sao -> thành viên hợp lệ sớm nhất được giữ trước -> mục không đủ điều kiện bị bỏ qua không mất trạng thái -> lượt giữ hết hạn nâng thành viên hợp lệ tiếp theo.
- Nhân sự liệt kê đặt chỗ với phân trang bỏ qua -> 20 bản ghi đầu hiển thị theo thứ tự ổn định; giới hạn không hợp lệ trả lỗi xác thực.
- Thành viên tìm danh mục ứng viên -> máy chủ trả hàng an toàn, gồm sách đã được chính thành viên đó đặt chỗ; thành viên tạo đặt chỗ thực bằng `copyId` số, thao tác trùng lặp bị vô hiệu hóa và danh sách đặt chỗ chính tắc tải lại.
- Mảng tương thích cũ/không hợp lệ chứa `MEMBER + LIBRARIAN` hoặc `MEMBER + ADMIN` được phòng thủ chuyển hướng khỏi màn hình đặt chỗ thành viên và nhận `403 ROLE_REQUIRED` từ endpoint ứng viên/tạo/danh sách riêng/hủy; tài khoản đã lưu vẫn một vai trò và thao tác hàng đợi nhân sự vẫn khả dụng.
- Thành viên chọn một sách không khả dụng trên FE01 -> `/reservations/mine?bookId=...` phân giải tiêu đề công khai -> danh mục ứng viên FE08 được bảo vệ khởi tạo tới bản sao vật lý khớp -> Thành viên chọn `copyId` thực.
- Thành viên có lịch sử đã hủy cùng một lượt đặt chỗ đang hoạt động/đã thông báo mới cho cùng bản sao -> trạng thái hiện tại xuất hiện ở phần hoạt động với nhãn hiển thị và thao tác ứng viên khớp -> trạng thái đã hủy chỉ còn ở phần lịch sử.
- Thủ thư/Quản trị viên xử lý hàng đợi của bản sao đã trả -> Thành viên thấy cửa sổ nhận sách `NotifiedAt`/`ExpiresAt` chính tắc -> `bookId`/`copyId` được giữ chính xác mở FE07 -> Thành viên tạo yêu cầu đang chờ -> Thủ thư/Quản trị viên phê duyệt hoàn tất đặt chỗ.
- Thành viên hiện mượn một bản sao vật lý -> mọi ứng viên cho `BookId` đó vắng mặt -> tạo trực tiếp cho bản sao khác trả `409 BOOK_ALREADY_BORROWED` -> xử lý Thủ thư/Quản trị viên bỏ qua hàng cũ có sẵn và để nó `ACTIVE`.

## 5. Bằng chứng hiện có

- `backend/tests/reservationRoutes.test.js` chứa bao phủ route lịch sử cho tạo, hủy, thứ tự hàng đợi, yêu cầu thông báo và bảo vệ vai trò.
- `backend/tests/integration.test.js` chứa bao phủ tích hợp mượn, gia hạn và hết hạn giữ chỗ FE07/FE08 lịch sử.
- `frontend/test/reservationFrontend.test.js` chứa bao phủ vòng đời, cô lập lỗi, làm mới máy chủ và hợp đồng API/trang ứng viên.
- `backend/tests/sql/reservationCandidates.sqltest.js` xác thực projection an toàn, ranh giới trạng thái hợp lệ, số đếm đang hoạt động, tìm kiếm, thứ tự ổn định, phân trang và dọn dẹp trên SQL Server dùng một lần.
- `.sdd/reviews/fe08-reservation-candidate-catalog-validation-2026-07-19.md` ghi nhận bằng chứng FE08 tập trung/đầy đủ; cổng SQL tổng hợp đạt 9/9 bộ và 69/69 kiểm thử.
- Bằng chứng CI lịch sử: commit `236043864304627f3577baafa9b8648c13c7a691` nằm trong `main`; GitHub Actions run `29217437981` đã hoàn thành thành công.

## 6. Khoảng trống

- Bằng chứng repository/service/route cùng sách `FE08-T045` lịch sử đạt `63/63`; ánh xạ lỗi frontend đạt `7/7`.
- RED vị trí hàng đợi `FE08-T046` mới thất bại vì formatter chưa có; GREEN đạt `1/1`, cổng frontend FE08/FE09 đạt `17/17` và frontend đầy đủ đạt `232/232`.
- Bằng chứng tích hợp `FE08-T047` mới với `8d0059b`: cổng liên tính năng bảy bộ đạt `295/295`, backend đầy đủ và bao phủ đạt `1,052/1,052`, chấp nhận Chromium đạt `2/2`.
- Lệnh SQL ứng viên đạt `2/2` kiểm thử hợp đồng nguồn và bỏ qua `2` ca SQL thay đổi vì chưa cấu hình cơ sở dữ liệu dùng một lần được phê duyệt.
- FE08-T028 đến FE08-T034 đạt cổng backend/ranh giới dùng chung tập trung 77/77 và frontend 9/9; truy vết là 29/29.
- FE08-T035 đến FE08-T039 đạt: hợp đồng backend ứng viên 23/23, SQL ứng viên 2/2, frontend đầy đủ hiện tại 149/149 cùng lint/build, trình duyệt tập trung 1/1 và Playwright đầy đủ 4/4 trên các cổng cô lập.
- Các đường ưu tiên đặt trước, hoàn tất chủ giữ chỗ, race và hoàn tác FE07/FE08 đạt trong bộ mượn SQL Server dùng một lần được ghi trong rà soát SQL trực tiếp đối soát đầy đủ.
- Chấp nhận toàn kho cuối và tích hợp của con người vẫn đang mở.
- `TD-028` đã được giải quyết cho lát cắt triển khai và xác thực tự động phía agent; trang thành viên hiện dùng danh mục ứng viên được bảo vệ có SQL hỗ trợ và không còn import `DEMO_RESERVABLE`.
- Xử lý hàng đợi tự động, job hết hạn giữ chỗ tự động và worker giao FE10 vẫn ngoài Giai đoạn 1.

## 7. Bao phủ NFR

| ID NFR | Mục tiêu kiểm thử | Trạng thái bằng chứng |
| ------ | ----------------- | --------------------- |
| NFR-FE08-SEC-001 | Yêu cầu xác thực trên mọi endpoint đặt chỗ. | Ma trận route tập trung và hồi quy backend đầy đủ đạt. |
| NFR-FE08-SEC-002 | Cô lập danh sách riêng và từ chối xem/hủy đặt chỗ của người khác. | Bao phủ route lịch sử; hồi quy tập trung còn lại ở FE08-T032. |
| NFR-FE08-SEC-003 | Danh sách, xử lý và hết hạn chỉ Thủ thư/Quản trị viên. | Ma trận vai trò tập trung và hồi quy backend đầy đủ đạt. |
| NFR-FE08-TXN-001 | Giữ chỗ hàng đợi nguyên tử và hoàn tất FE07 với một bên thắng đồng thời. | Bộ mượn SQL dùng một lần và tích hợp FE07/FE08 đạt. |
| NFR-FE08-TXN-002 | Hủy/hết hạn không bao giờ làm trạng thái bản sao và đặt chỗ không nhất quán. | Bằng chứng hoàn tác route/tích hợp và đồng thời SQL đạt. |
| NFR-FE08-PERF-001 | Mặc định và giới hạn phân trang; giá trị không hợp lệ bị từ chối trước truy cập repository. | Kiểm thử validator/repository API ứng viên và FE08-T028 đạt. |
| NFR-FE08-PERF-002 | Tra cứu `CopyId`/`ACTIVE` chính xác và thứ tự `ReservedAt ASC, ReservationId ASC`. | Bằng chứng tập trung và SQL FE08-T028/T029 đạt. |
| NFR-FE08-LOG-001 | Bao phủ audit cho tạo, hủy, xử lý, lỗi thông báo, hoàn tất và hết hạn. | Ma trận audit vòng đời FE08-T029/T031 và bằng chứng hồi quy đạt. |
| NFR-FE08-UX-001 | Nhãn thành viên chính tắc cho mọi trạng thái đặt chỗ. | Bằng chứng frontend FE08-T032 đạt. |
| NFR-FE08-UX-002 | Hàng đợi thủ thư hiển thị thứ tự ổn định và trạng thái có thể hành động rõ ràng. | Bằng chứng phân trang/thứ tự xác định FE08-T032 đạt. |
| NFR-FE08-SEC-004 | Lượt đọc ứng viên yêu cầu đúng vai trò `MEMBER`, từ chối tài khoản Quản trị/Thủ thư và không công khai siêu dữ liệu bản sao hoặc chủ sở hữu chỉ nhân sự. | Bao phủ route/frontend FE08-T035/T036 cùng FE08-T041 đạt. |
| NFR-FE08-PERF-003 | Lượt đọc ứng viên dùng phân trang máy chủ có giới hạn và thứ tự tiêu đề/sách/bản sao xác định. | Bằng chứng SQL, backend và frontend FE08-T035/T036/T037 đạt. |

## 8. Lệnh / bằng chứng bắt buộc trước khi merge

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reservationRoutes.test.js tests/integration.test.js
node --test frontend/test/reservationFrontend.test.js
npm.cmd run trace:enforce
git diff --check
npm.cmd --prefix backend test -- --runInBand --testMatch "**/reservationCandidates.sqltest.js"
```

Các cổng backend/frontend, bao phủ, tích hợp, triển khai, SQL trực tiếp và Playwright toàn kho được ghi trong các rà soát đối soát đầy đủ và xác thực FE08 trước merge.

## 9. Ma trận kiểm thử batch FE07-FE12

- AC-FE08-023: FIFO/decision surface và đúng một post-commit notification request.
- AC-FE08-024: chỉ owner `NOTIFIED` thấy CTA và FE07 nhận đúng `copyId`.
- AC-FE08-025: race chỉ một winner, notification warning trung thực, stale
  `409` tải lại state chuẩn.
- Cross-feature: `AT-005`, `AT-007..AT-009`, `AT-012`.

Focused service/routes/frontend tests, concurrency integration và desktop
Chromium phải đạt trước H2.

## 10. Bằng chứng H2 cục bộ v0.6.0

- Backend FE08 service/routes: 2 suite, 55/55 kiểm thử.
- Nhóm frontend FE07/FE08: 56/56, gồm nhận FE07 handoff đúng `copyId`, warning
  sau commit và stale `409` reload.
- System integration 11/11 và Chromium 1440x900 1/1 chứng minh FIFO
  `ACTIVE -> NOTIFIED -> FULFILLED`.
- Full backend 1.125/1.125, frontend 269/269, lint/build, deployment 20/20 và
  Azure schema preparation đều đạt.
- Product diff chưa stage/commit/push và đang chờ H2.
