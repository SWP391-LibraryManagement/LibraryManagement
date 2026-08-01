# TASKS.md - FE08 Quản lý đặt chỗ

Trạng thái: HOÀN THÀNH; PR #89 ĐÃ HỢP NHẤT; CI VÀ AZURE ĐÃ CHẠY THÀNH CÔNG TRÊN ĐÚNG COMMIT
Trạng thái triển khai: COMPLETE

Chủ sở hữu: Nhat

Cập nhật: 2026-08-01

Trạng thái quy trình hiện tại: Mốc cơ sở Giai đoạn 2 vẫn hoàn tất. `main` sở
hữu `FE08-T041` đến `FE08-T046`; tác vụ chỉ hồi quy căn chỉnh quy tắc là
`FE08-T047`. Đối soát FE07-FE12 đã hợp nhất qua PR #63 thành `29b4eb0` sau H3
và CI. Đợt liên hoàn v0.6.0 được H3 phê duyệt ở commit `08e472f` và tích hợp
vào `main` qua `ba29dc0`. Bản hoàn tất `6189b1a` tiếp tục được phê duyệt
H3 trong nhiệm vụ, hợp nhất qua PR #89 thành `main@39092fb`; CI `30675444178` và
Azure staging `30675744992` đều đạt trên đúng commit.

---

## 1. Tác vụ backend

- [x] FE08-T01 Thêm tuyến API đặt chỗ dưới `/api/reservations`.
- [x] FE08-T02 Thêm validator yêu cầu cho tạo, liệt kê, hủy, xử lý và xử lý hàng đợi.
- [x] FE08-T03 Thêm middleware bảo vệ vai trò cho thao tác thành viên/thủ thư/quản trị viên.
- [x] FE08-T04 Thêm quy tắc tầng dịch vụ đặt chỗ cho điều kiện hợp lệ, đặt chỗ đang hoạt động trùng lặp, từ chối bản sao khả dụng và giới hạn đang hoạt động tối đa.
- [x] FE08-T05 Thêm phương thức tầng truy cập dữ liệu SQL cho tra cứu bản sao, CRUD đặt chỗ, danh sách nhân sự và giữ hàng đợi.
- [x] FE08-T06 Thêm endpoint thành viên: tạo đặt chỗ, liệt kê lượt đặt chỗ của tôi, hủy đặt chỗ `ACTIVE` hoặc `NOTIFIED` của tôi.
- [x] FE08-T07 Thêm endpoint nhân sự: liệt kê đặt chỗ, xử lý một đặt chỗ, xử lý mục hàng đợi kế tiếp.
- [x] FE08-T08 Tạo yêu cầu thông báo `RESERVATION_READY` FE10 khi xử lý hàng đợi.
- [x] FE08-T09 Ghi nhật ký kiểm toán cho thao tác tạo, hủy và xử lý.

## 2. Tác vụ kiểm thử

- [x] FE08-T10 Thêm helper kiểm thử tầng truy cập dữ liệu đặt chỗ trong bộ nhớ.
- [x] FE08-T11 Kiểm thử tạo đặt chỗ, từ chối trùng lặp, từ chối bản sao khả dụng và giới hạn 3 hoạt động.
- [x] FE08-T12 Kiểm thử hủy chỉ chủ sở hữu và xử lý hủy lặp lại.
- [x] FE08-T13 Kiểm thử danh sách nhân sự và xử lý hàng đợi hợp lệ sớm nhất.
- [x] FE08-T14 Kiểm thử tạo yêu cầu thông báo khi bản sao được giữ.
- [x] FE08-T15 Kiểm thử bảo vệ xác thực và vai trò.

## 3. Tác vụ frontend

- [x] FE08-T16 Triển khai màn hình lượt đặt chỗ của tôi cho thành viên.
- [x] FE08-T17 Triển khai màn hình quản lý đặt chỗ của thủ thư.
- [x] FE08-T18 Triển khai màn hình xử lý hàng đợi đặt chỗ của thủ thư.
- [x] FE08-T19 Nối màn hình frontend với API backend.
- [x] FE08-T20 Thêm khả năng tiếp cận: caption bảng, phạm vi tiêu đề cột, nhãn biểu mẫu, hỗ trợ bàn phím.
- [x] FE08-T21 Thêm trạng thái tải, rỗng và lỗi trên mọi màn hình.

## 4. Tác vụ tính đúng đắn frontend

- [x] FE08-T22 Ánh xạ `NOTIFIED` và `FULFILLED` tới trạng thái UI chuẩn.
- [x] FE08-T23 Chỉ giữ lượt đặt chỗ `Waiting` (`ACTIVE`) trong hàng đợi thủ thư và loại `NOTIFIED` cùng trạng thái kết thúc khỏi thao tác hàng đợi.
- [x] FE08-T24 Thêm lỗi API tiếng Việt riêng cho đặt chỗ mà không ảnh hưởng API khác.
- [x] FE08-T25 Kết nối xử lý hết hạn giữ chỗ nhân sự với `POST /api/reservations/expire-holds`.
- [x] FE08-T26 Loại điều khiển hoàn tất và xóa chỉ cục bộ.
- [x] FE08-T27 Thêm kiểm thử hồi quy frontend tập trung cho vòng đời, cô lập lỗi và hợp đồng trang.

## 4.1 Tác vụ tích hợp FE07-FE08

- [x] FE08-T025 Căn chỉnh thứ tự khóa hủy/hết hạn và bàn giao hoàn tất FE07. Truy vết: BR-FE08-015/016; AC-FE08-011/012. Phụ thuộc: FE07-T029/T030. Hoàn thành khi kiểm thử đồng thời đạt không deadlock.

## 4.2 Tác vụ chuẩn hóa v0.4.3

- [x] **FE08-T028 - Khóa hành vi API và phân trang xác định.**
  - Ánh xạ tới: FR-FE08-027, AC-FE08-013, NFR-FE08-PERF-001/002.
  - Tệp: `backend/src/routes/reservationRoutes.js`, `backend/src/validators/reservationValidators.js`, `backend/src/controllers/reservationController.js`, `backend/src/services/reservationService.js`, `backend/src/repositories/reservationRepository.js`, `backend/src/docs/openapi.yaml`, `backend/tests/reservationRoutes.test.js`.
  - Phụ thuộc: FE08-T01 đến FE08-T15 lịch sử.
  - RED: thêm kiểm thử cho `process-queue` yêu cầu `copyId` nhân sự, từ chối `bookId`, mặc định page/limit, từ chối giá trị được cung cấp không hợp lệ và thứ tự `ReservedAt ASC, ReservationId ASC` ổn định.
  - GREEN: căn chỉnh validator, tầng dịch vụ, tầng truy cập dữ liệu và tài liệu API với SPEC v0.4.2.
  - Tiêu chí hoàn thành: giá trị query/body không hợp lệ bị từ chối không chuẩn hóa hoặc truy vấn tầng truy cập dữ liệu.

- [x] **FE08-T029 - Khóa kết quả hàng đợi xác định.**
  - Ánh xạ tới: FR-FE08-018, FR-FE08-020, FR-FE08-021; AC-FE08-006/007/009; Q-FE08-006/007/008.
  - Tệp: `backend/src/services/reservationService.js`, `backend/src/repositories/reservationRepository.js`, `backend/tests/reservationRoutes.test.js`.
  - Phụ thuộc: FE08-T028.
  - RED: thêm ca chứng minh đặt chỗ đang hoạt động không đủ điều kiện vẫn `ACTIVE`, hàng đợi rỗng không chọn gì với trạng thái bản sao không đổi và lỗi thông báo giữ lượt đặt chỗ trong khi ghi `RESERVATION_NOTIFY_FAILED`.
  - GREEN: loại phương án chính sách và giữ các chuyển đổi trạng thái đã phê duyệt có tính xác định.
  - Tiêu chí hoàn thành: không thêm tiến trình xử lý nền thử lại thông báo tự động hoặc dữ liệu chủ sở hữu ẩn.

- [x] **FE08-T030 - Đối soát trường dữ liệu đặt chỗ và bất biến trạng thái.**
  - Ánh xạ tới: BR-FE08-008 đến BR-FE08-013, BR-FE08-017; FR-FE08-006 đến FR-FE08-009, FR-FE08-019, FR-FE08-022, FR-FE08-028; AC-FE08-006 đến AC-FE08-009, AC-FE08-014; NFR-FE08-TXN-001/002, NFR-FE08-LOG-001.
  - Tệp: `database/Librarymanagement.sql`, `backend/src/models/Reservation.js`, `backend/src/repositories/reservationRepository.js`, `backend/tests/models.test.js`, `backend/tests/reservationRoutes.test.js`.
  - Phụ thuộc: FE08-T029.
  - RED: thêm ca giữ dấu thời gian hoàn tất, hết hạn, hủy đã thông báo và hủy chưa từng thông báo.
  - GREEN: bảo đảm dấu thời gian thông báo là lịch sử bất biến, `CancelledAt` chỉ dành cho hủy và ghi hàng đợi/hủy/hết hạn/hoàn tất dùng khóa `BookCopies -> Reservations` cùng kiểm toán nhất quán.
  - Tiêu chí hoàn thành: đặt chỗ đã thông báo giữ dấu thời gian ban đầu ở trạng thái kết thúc, hàng chưa từng thông báo giữ null, chỉ hàng đã hủy có `CancelledAt` và nhiều nhất một lượt đặt chỗ đã thông báo mỗi bản sao.

- [x] **FE08-T031 - Đối soát ranh giới hoàn tất và ưu tiên FE07.**
  - Ánh xạ tới: BR-FE08-011, BR-FE08-014 đến BR-FE08-016; FR-FE08-023 đến FR-FE08-026; AC-FE08-008, AC-FE08-011/012.
  - Tệp: `backend/src/services/borrowingService.js`, `backend/src/repositories/borrowingRepository.js`, `backend/src/services/reservationService.js`, `backend/tests/borrowingRoutes.test.js`, `backend/tests/reservationRoutes.test.js`, `backend/tests/sql/borrowingConcurrency.sqltest.js`.
  - Phụ thuộc: FE08-T030 và FE07-T031 đến FE07-T036 đã phê duyệt.
  - GREEN: chỉ phê duyệt FE07 cùng thành viên/cùng bản sao mới hoàn tất `NOTIFIED`; hàng đợi đang hoạt động và lượt đặt chỗ của thành viên khác chặn mượn/gia hạn thông thường mà không lộ dữ liệu chủ sở hữu.
  - Tiêu chí hoàn thành: hậu tố khóa dùng chung và bằng chứng hoàn tác giao dịch vẫn căn chỉnh với FE07.

- [x] **FE08-T032 - Đối soát vòng đời frontend và bằng chứng làm mới máy chủ.**
  - Ánh xạ tới: AC-FE08-001 đến AC-FE08-013; NFR-FE08-UX-001/002.
  - Tệp: `frontend/src/page/reservation/*`, `frontend/src/api/libraryFeatureApi.js`, `frontend/test/reservationFrontend.test.js`.
  - Phụ thuộc: FE08-T028 đến FE08-T031.
  - RED: thêm assertion tập trung cho nhãn `ACTIVE`/`NOTIFIED`/`FULFILLED`, hiển thị hàng đợi, phân trang, cô lập lỗi và làm mới sau hết hạn/hủy/xử lý.
  - GREEN: frontend chỉ hiển thị trạng thái máy chủ chuẩn và không bao giờ cung cấp điều khiển hoàn tất/xóa cục bộ hoặc thử lại tự động.
  - Tiêu chí hoàn thành: tệp kiểm thử frontend tập trung tồn tại và lệnh của nó được ghi trong `TEST_PLAN.md`.

- [x] **FE08-T033 - Hoàn tất truy vết yêu cầu và kế hoạch kiểm thử.**
  - Ánh xạ tới: mọi ID FE08 BR/FR/AC/NFR, gồm FR-FE08-027/028 và AC-FE08-013/014.
  - Tệp: `.sdd/specs/feat-reservation-management/SPEC.md`, `TEST_PLAN.md`, `CHANGELOG.md`, `TASKS.md`.
  - Phụ thuộc: FE08-T028 đến FE08-T032.
  - Tiêu chí hoàn thành: không còn `TBD`, phương án chính sách hay hàng yêu cầu thiếu; kết quả B7 lịch sử và bằng chứng v0.4.3 được tách biệt.

- [x] **FE08-T034 - Chuẩn hóa ngữ nghĩa dấu thời gian kết thúc trong tài liệu.**
  - Ánh xạ tới: BR-FE08-017, FR-FE08-028, AC-FE08-014, Q-FE08-009, INV-FE08-009..010.
  - Tiêu chí hoàn thành: SPEC, PLAN, TASKS, TEST_PLAN và CHANGELOG thống nhất rằng dấu thời gian thông báo là lịch sử bất biến và `CancelledAt` chỉ dành cho hủy; các tệp triển khai không đổi.
  - Trạng thái rà soát: tài liệu hoàn tất và Nhat xác nhận rà soát con người vào 2026-07-17.

- [x] **FE08-T035 - Phê duyệt và truy vết hợp đồng ứng viên an toàn cho thành viên.**
  - Ánh xạ tới: FR-FE08-029, AC-FE08-015/016, NFR-FE08-SEC-004, NFR-FE08-PERF-003, Q-FE08-011.
  - Tệp: `SPEC.md`, `PLAN.md`, `TASKS.md`, `CHANGELOG.md` FE08; thiết kế ứng viên và kế hoạch triển khai.
  - Tiêu chí hoàn thành: Phương án A và thiết kế viết được phê duyệt rõ ràng bởi con người; truy vấn, dữ liệu hiển thị, vai trò, thứ tự và mục tiêu không thực hiện là rõ ràng.

- [x] **FE08-T036 - Triển khai và xác thực API ứng viên backend.**
  - Ánh xạ tới: FR-FE08-029, AC-FE08-015, NFR-FE08-SEC-004, NFR-FE08-PERF-003.
  - Tệp: validator/tuyến API/bộ điều khiển/tầng dịch vụ/tầng truy cập dữ liệu FE08, OpenAPI, helper trong bộ nhớ, kiểm thử tuyến API và `backend/tests/sql/reservationCandidates.sqltest.js`.
  - RED: các ca vai trò, query, khóa an toàn, trạng thái, tìm kiếm, thứ tự, phân trang, số đếm đang hoạt động và không thay đổi thất bại trước khi tuyến API tồn tại.
  - GREEN: dữ liệu hiển thị `{ data, pagination }` chỉ thành viên đạt bộ Jest tập trung và SQL Server dùng một lần.
  - Xác thực: hợp đồng backend ứng viên `23/23`; SQL tập trung `2/2`; SQL tổng hợp `9/9` bộ và `69/69` kiểm thử.

- [x] **FE08-T037 - Thay `DEMO_RESERVABLE` bằng ứng viên máy chủ chuẩn.**
  - Ánh xạ tới: FR-FE08-029, AC-FE08-015/016, NFR-FE08-PERF-003.
  - Tệp: `frontend/src/api/libraryFeatureApi.js`, `frontend/src/page/reservation/MyReservationsPage.jsx`, `frontend/src/utils/libraryFeatureViewModels.js`, `frontend/test/reservationFrontend.test.js`.
  - RED: kiểm thử nguồn thất bại khi trang import danh mục demo hoặc thiếu `reservationApi.listCandidates`.
  - GREEN: trạng thái tìm kiếm/trang máy chủ, tải/rỗng/lỗi, thay đổi `copyId` thực và làm mới sau thay đổi đạt mà không tạo ETA hay số đếm khả dụng.
  - Xác thực: frontend đầy đủ hiện tại `149/149`, lint PASS, build PASS và không còn tham chiếu `DEMO_RESERVABLE`.

- [x] **FE08-T038 - Thêm chấp nhận trình duyệt cô lập cho chọn ứng viên.**
  - Ánh xạ tới: FR-FE08-029, AC-FE08-015/016.
  - Tệp: `tests/e2e/fe08-reservation-candidate-catalog.spec.js` và hỗ trợ E2E xác định chỉ khi cần.
  - Tiêu chí hoàn thành: danh mục thành viên, truy vấn tìm kiếm, dữ liệu an toàn, tạo đặt chỗ thực, làm mới chuẩn và tràn di động đạt trên cổng cô lập.
  - Xác thực: trình duyệt FE08 tập trung `1/1`; Playwright đầy đủ `4/4` trên `4185/3101`.

- [x] **FE08-T039 - Đóng TD-028 bằng bằng chứng xác thực đầy đủ.**
  - Ánh xạ tới: mọi ID ứng viên v0.4.4.
  - Tệp: `TECH_DEBT.md`, rà soát xác thực tập trung, gói chấp nhận đầy đủ và bằng chứng PR.
  - Tiêu chí hoàn thành: cổng backend/frontend/bao phủ/tích hợp/SQL/E2E/truy vết/an toàn tập trung và đầy đủ đạt; TD-028 chuyển sang RESOLVED; H3 cuối vẫn nêu rõ.
  - Xác thực: bằng chứng được ghi tại `.sdd/reviews/fe08-reservation-candidate-catalog-validation-2026-07-19.md`; H3 và CI `main` sau hợp nhất vẫn là cổng con người.

## 5. Xác thực

- [x] `npm.cmd --prefix frontend test` - 14/14 kiểm thử đạt.
- [x] `npm.cmd --prefix frontend run lint` - đạt với 0 lỗi ESLint.
- [x] `npm.cmd --prefix frontend run build` - Vite 8.0.16 build môi trường triển khai thực tế đạt sau khi biến đổi 14,323 module; Vite báo cảnh báo kích thước chunk không gây thất bại.
- [x] `npm.cmd --prefix backend test` - 15/15 bộ Jest và 123/123 kiểm thử đạt; 0 ảnh chụp trạng thái.
- [x] Bản ghi sau hợp nhất B7 - commit `236043864304627f3577baafa9b8648c13c7a691` nằm trong `main`; GitHub Actions CI `29217437981` đạt.

### 5.1 Xác thực v0.4.2 đang chờ

- [x] Kiểm thử tập trung FE08-T028 đến FE08-T032 đạt: backend/ranh giới dùng chung 77/77 và frontend 9/9.
- [x] `npm.cmd run trace:enforce` đạt với bao phủ FE08 29/29.
- [x] `git diff --check` đạt.
- [x] Nhat xác nhận rà soát con người của hợp đồng chuẩn hóa vào 2026-07-17.

### 5.2 Xác thực ứng viên v0.4.4 đã hoàn thành

- [x] Kiểm thử tuyến API backend và SQL FE08-T036 đạt: backend tập trung `23/23`; SQL tổng hợp `9/9` bộ, `69/69` kiểm thử.
- [x] Kiểm thử frontend hiện tại FE08-T037 `149/149`, lint và build đạt, không có tham chiếu `DEMO_RESERVABLE`.
- [x] Chấp nhận trình duyệt cô lập FE08-T038 đạt: tập trung `1/1`; Playwright đầy đủ `4/4` trên `4185/3101`.
- [x] Hồi quy, truy vết, an toàn và cổng bằng chứng đầy đủ FE08-T039 đạt; H3 cuối, hợp nhất và CI `main` sau hợp nhất được ghi tại `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.

## 6. Truy vết

| ID đặc tả | Được bao phủ bởi |
| --- | --- |
| BR-FE08-001 | FE08-T03, FE08-T15 |
| BR-FE08-002 | FE08-T03, FE08-T04, FE08-T11 |
| BR-FE08-003 | FE08-T06, FE08-T12 |
| BR-FE08-004 | FE08-T03, FE08-T07, FE08-T13 |
| BR-FE08-005 | FE08-T04, FE08-T11 |
| BR-FE08-006 | FE08-T04, FE08-T11 |
| BR-FE08-008 | FE08-T07, FE08-T13 |
| BR-FE08-009 | FE08-T06, FE08-T12, FE08-T13 |
| BR-FE08-012 | FE08-T08, FE08-T14 |
| FR-FE08-004 | FE08-T06, FE08-T12 |
| FR-FE08-005 | FE08-T07, FE08-T13 |
| FR-FE08-008 | FE08-T08, FE08-T14 |
| FR-FE08-010 | FE08-T06, FE08-T12 |
| BR-FE08-015/016; AC-FE08-011/012 | FE08-T025 |

### 6.1 Truy vết bổ sung về tính đúng đắn frontend

| ID đặc tả | Được bao phủ bởi |
| --- | --- |
| FR-FE08-005 | FE08-T17, FE08-T19, FE08-T23 |
| FR-FE08-007 | FE08-T18, FE08-T22, FE08-T23 |
| FR-FE08-009 | FE08-T22, FE08-T23, FE08-T27 |
| FR-FE08-017 | FE08-T12, FE08-T24, FE08-T27 |
| FR-FE08-019 | FE08-T25, FE08-T27; `backend/tests/integration.test.js` và bao phủ nâng expire-holds của `backend/tests/reservationRoutes.test.js` |
| NFR-FE08-UX-001 | FE08-T21, FE08-T22, FE08-T24, FE08-T27 |
| FR-FE08-018/020/021/027 | FE08-T028, FE08-T029 |
| AC-FE08-013 | FE08-T028, FE08-T032 |
| FR-FE08-029 | FE08-T035, FE08-T036, FE08-T037, FE08-T038, FE08-T039 |
| FR-FE08-030 | FE08-T041 |
| FR-FE08-031 | FE08-T042 |
| FR-FE08-032 | FE08-T043 |
| FR-FE08-033 | FE08-T044 |
| AC-FE08-015 | FE08-T035, FE08-T036, FE08-T037, FE08-T038 |
| AC-FE08-016 | FE08-T035, FE08-T037, FE08-T038 |
| AC-FE08-017 | FE08-T041 |
| AC-FE08-018 | FE08-T042 |
| AC-FE08-019 | FE08-T043 |
| AC-FE08-020 | FE08-T044 |
| NFR-FE08-SEC-004 | FE08-T035, FE08-T036, FE08-T039 |
| NFR-FE08-PERF-003 | FE08-T035, FE08-T036, FE08-T037, FE08-T039 |

## 7. Vẫn ngoài phạm vi triển khai này

- Tích hợp trả-sang-hàng-đợi FE07 tự động.
- Tiến trình xử lý nền giao FE10.
- Job hết hạn tự động.

## 8. Khắc phục kiểm toán vòng đời nguyên tử và lan truyền cảnh báo v0.5.3

- [x] **FE08-T040 - Commit trạng thái vòng đời và kiểm toán cùng nhau.**
  - Ánh xạ tới: BR-FE08-013, FR-FE08-001, FR-FE08-004, FR-FE08-021, NFR-FE08-TXN-001/002, NFR-FE08-LOG-001, NFR-FE08-UX-002.
  - RED: kiểm thử tầng truy cập dữ liệu yêu cầu kiểm toán-trước-commit cho tạo/hủy/giữ/hết hạn; kiểm thử tầng dịch vụ/tuyến API yêu cầu hoàn tác, cảnh báo an toàn sau commit và tuần tự hóa cảnh báo nâng hết hạn; kiểm thử frontend từ chối xác nhận thành viên cache.
  - GREEN: ghi kiểm toán vòng đời tham gia giao dịch thay đổi; lỗi thông báo vẫn sau commit; kiểm toán lỗi không sẵn có trả `process-queue.notificationWarning` đơn lẻ hoặc một mục `expire-holds.notificationWarnings[]` an toàn cho mỗi lượt nâng bị ảnh hưởng; xác nhận nhân sự chỉ chứa ngữ cảnh bản sao cùng giải thích chọn lại máy chủ.
  - Xác minh: H2 ban đầu và phụ lục H2 đã đạt; commit `97aca62` và lượt chạy PR CI `30014066260` đã đạt. H2 mới sau đó phê duyệt commit khắc phục `b931e00`, và lượt chạy PR CI `30019439505` đã đạt. Phát hiện H3 vòng hai đã được khắc phục, rà soát lại và tích hợp; hoàn tất cuối được xác nhận qua PR #89, CI và Azure đúng commit.

## 9. 2026-07-27 - Mốc cơ sở một vai trò và trình bày thành viên

- [x] **FE08-T041 - Thực thi truy cập một vai trò cho các luồng đặt chỗ thành viên.**
  - Ánh xạ tới: BR-FE08-018, FR-FE08-030, AC-FE08-017; BR-FE11-028.
  - Thay bảo vệ thành viên-bất-kỳ-vai-trò tại tuyến API ứng viên/tạo/danh sách riêng/hủy bằng bảo vệ thành viên không phải nhân sự dùng chung.
  - Chuyển hướng mảng vai trò cũ/không hợp lệ chứa cả Member và nhân sự khỏi tuyến API frontend thành viên trong khi giữ thao tác danh sách/hàng đợi nhân sự.
  - Xác minh các ca mảng tương thích phòng thủ `MEMBER + LIBRARIAN` và `MEMBER + ADMIN` mà không coi chúng là tài khoản đã lưu được hỗ trợ.

- [x] **FE08-T042 - Kết nối bàn giao đặt chỗ sách được chọn FE01.**
  - Ánh xạ tới: FR-FE08-031, AC-FE08-018; BR-FE01-015/016, FR-FE01-014/018.
  - Đọc deep link `bookId` FE01, phân giải tiêu đề công khai của nó và khởi tạo tìm kiếm ứng viên FE08 được bảo vệ.
  - Giữ chọn `copyId` ứng viên và `POST /api/reservations` chính thức bên trong FE08; không mở rộng dữ liệu công khai FE01.
  - Xác minh nhãn/tuyến API thao tác FE01 tập trung và khởi tạo ứng viên sách được chọn FE08.

- [x] **FE08-T043 - Tách lượt đặt chỗ Thành viên hiện tại khỏi lịch sử.**
  - Ánh xạ tới: FR-FE08-010/032, AC-FE08-010/019, NFR-FE08-UX-001.
  - Giữ bản ghi danh sách riêng chuẩn, nhóm `ACTIVE`/`NOTIFIED` tách khỏi lịch sử kết thúc và hiển thị mọi trạng thái vòng đời thô với badge được hỗ trợ rõ ràng.
  - Kết nối thao tác ứng viên với lượt đặt chỗ hiện tại khớp để bản sao được giữ nói `Đến lượt bạn` thay vì trông như đã hủy hoặc cũ.
  - Giữ thứ tự hàng đợi Thủ thư/Quản trị viên và quyền sở hữu chuyển trạng thái FE07.

- [x] **FE08-T044 - Hiển thị cửa sổ nhận sách và kết nối bản sao được giữ tới FE07.**
  - Ánh xạ tới: FR-FE08-033, AC-FE08-020; FR-FE07-024/033, AC-FE07-016/027.
  - Hiển thị `NotifiedAt` qua `ExpiresAt` cho bản ghi `NOTIFIED` chuẩn và giải thích lượt đặt chỗ hết hạn sau hạn chót.
  - Liên kết chính xác `bookId`/`copyId` được giữ tới trang yêu cầu FE07 Thành viên; giữ quyền sở hữu phê duyệt Thủ thư/Quản trị viên và hoàn tất FE07.
  - Cập nhật kỳ vọng Chromium FE08 từ nhãn `Đã đặt chỗ` đã bị thay thế thành `Đang đặt chỗ`.

- [x] **FE08-T045 - Ngăn đặt chỗ khi Thành viên hiện đang mượn cùng sách.**
  - Ánh xạ tới: BR-FE08-019, FR-FE08-034, AC-FE08-021; BR-FE07-032.
  - Loại ứng viên cùng `BookId`, từ chối tạo trực tiếp bằng `BOOK_ALREADY_BORROWED` và xác thực lại mục hàng đợi cũ trong khi Thủ thư/Quản trị viên xử lý.
  - Phối hợp phê duyệt mượn FE07 và tạo/giữ FE08 qua khóa lưu hành Thành viên.
  - Xác minh nguồn tầng truy cập dữ liệu, ánh xạ tầng dịch vụ, hành vi tuyến API, hành vi hàng đợi và ánh xạ lỗi tiếng Việt.
  - Nguồn: được phê duyệt phần triển khai trước và triển khai trên `main` tại `e99daf5`; đây không phải khẳng định RED mới từ nhánh căn chỉnh quy tắc.

- [x] **FE08-T046 - Làm rõ vị trí hàng đợi theo phạm vi bản sao.**
  - Ánh xạ tới: BR-FE08-020, FR-FE08-035, AC-FE08-022.
  - Giữ vị trí theo `CopyId`, gắn nhãn bảng Thành viên/Thủ thư với phạm vi bản sao và loại dự phòng mô hình hiển thị tạo `#1`.
  - Hiển thị `Chưa xác định` cho vị trí chuẩn null thay vì `#null` hoặc `#undefined`.
  - Xác minh vị trí bằng nhau xuyên sách khác nhau và vị trí null trong hợp đồng trình bày Thành viên và nhân sự.

## 10. 2026-07-27 - Ranh giới hồi quy tích hợp FE07/FE10

- [x] **FE08-T047 - Xác minh bàn giao FE07 và FE10 không đổi sau tích hợp main mới nhất.**
  - Ánh xạ tới: BD-006, SL-006, AT-006 và FR-FE08-008/024 hiện có.
  - Phạm vi: chỉ bằng chứng hồi quy sau hiệu chỉnh trình bày an toàn null FE08-T046 có giới hạn.
  - Bằng chứng lịch sử với hợp nhất `e20fdc3` trước đó chỉ là mốc cơ sở.
  - Bằng chứng mới với hợp nhất `8d0059b` đang mở: RED/GREEN vị trí hàng đợi
    `1/1`, backend FE09 `22/22`, frontend FE08/FE09 `17/17`, requester và
    bao phủ SIT trong cổng liên tính năng 7 bộ `295/295`, backend đầy đủ
    và bao phủ `1,052/1,052`, frontend `232/232` và chấp nhận Chromium
    `2/2`.
  - Cổng tích hợp: phụ lục H2 sản phẩm phê duyệt commit `f346ae0` và lượt chạy PR
    CI `30244750250` đã đạt. Khắc phục chỉ tài liệu H3 yêu cầu H2 mới và H3 lặp lại trước hợp nhất.
  - Quy tắc khi thất bại: dừng và chẩn đoán; mọi quy tắc FE08 mới yêu cầu bản sửa đổi SPEC riêng.

## 2026-07-29 - Đợt FE07-FE12 v0.6.0

- [x] **FE08-T048 - Nút hành động chỉ dành cho chủ sở hữu bản sao đang được giữ và bàn giao đúng `copyId`.**
  - Ánh xạ: BR-FE08-021, FR-FE08-036, AC-FE08-024.
- [x] **FE08-T049 - Giao diện quyết định hàng đợi cho nhân viên, giữ cách xử lý thủ công.**
  - Ánh xạ: FR-FE08-037, AC-FE08-023.
- [x] **FE08-T050 - Cảnh báo thông báo an toàn và tải lại sau lỗi thời `409`.**
  - Ánh xạ: BR-FE08-022, FR-FE08-038/039, AC-FE08-025.
- [x] **FE08-T051 - Bằng chứng tranh chấp đồng thời, tích hợp và màn hình máy tính.**
  - Ánh xạ: `SL-004`, `SL-006`, `AT-005`, `AT-007..AT-009`, `AT-012`.
  - Bằng chứng H2 cục bộ: tầng dịch vụ và tuyến API có 2 bộ với 55 ca kiểm thử;
    nhóm frontend FE07/FE08 đạt 56/56; tích hợp hệ thống đạt 11/11; Chromium liên hoàn 1/1 chứng
    minh `ACTIVE -> NOTIFIED -> FULFILLED`, cảnh báo an toàn và bàn giao đúng
    `copyId`.

Phần thay đổi của sản phẩm vẫn giữ chưa được commit cho tới khi H2 phê duyệt.
