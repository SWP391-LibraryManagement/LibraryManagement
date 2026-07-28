# TASKS.md - FE09 Quản lý tiền phạt

Trạng thái: ĐÃ HOÀN TẤT - ĐÃ GHI NHẬN BẰNG CHỨNG CHỐT GIAI ĐOẠN 2
Implementation State: COMPLETE

Chủ sở hữu: Dung

Cập nhật: 2026-07-21

Trạng thái quy trình: đã hoàn tất cho phạm vi Giai đoạn 2 đã phê duyệt; H3, merge và CI `main` chính xác sau merge được ghi tại `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`. Các phát biểu cổng đang chờ/mở bên dưới là ảnh chụp thực thi lịch sử đã được bằng chứng đó thay thế.

---

## Tác vụ phía máy chủ lịch sử

Các tác vụ đã chọn bên dưới là bằng chứng triển khai TD-001/002/003 lịch sử. Chúng không phải bằng chứng hoàn tất v0.4.1.

| ID | Tác vụ lịch sử | Trạng thái |
| --- | --- | --- |
| FE09-T001 | Repository phạt: tra cứu chi tiết mượn, CRUD phạt và nền tảng giao dịch | [x] HOÀN TẤT |
| FE09-T002 | Tính quá hạn phía máy chủ từ ngày đã lưu | [x] HOÀN TẤT |
| FE09-T003 | Ngăn phạt trùng lặp | [x] HOÀN TẤT |
| FE09-T004 | Quy trình thu tiền lịch sử | [x] HOÀN TẤT - được đối soát bởi hợp đồng không thanh toán một phần v0.4.1 |
| FE09-T005 | Đường service đánh dấu đã thanh toán và miễn/hủy quản trị | [x] HOÀN TẤT - được đối soát bởi hợp đồng v0.4.1 |
| FE09-T006 | Hiển thị phạt và truy cập chủ sở hữu/nhân sự | [x] HOÀN TẤT - mở rộng bởi FE09-T018 |
| FE09-T007 | Ủy quyền cho thu/thanh toán/miễn | [x] HOÀN TẤT |
| FE09-T008 | Audit log cho thao tác phạt | [x] HOÀN TẤT - tính nguyên tử mở rộng bởi FE09-T016/017 |
| FE09-T009 | Route lịch sử và nối app | [x] HOÀN TẤT - route thay đổi cũ bị loại khỏi ranh giới production v0.4.1 bởi FE09-T014 |
| FE09-T010 | Kiểm thử route phía máy chủ trong bộ nhớ | [x] HOÀN TẤT - ca v0.4.1 được mở rộng bởi FE09-T013 |
| FE09-T011 | Cập nhật kiểm tra trạng thái SQL `Fines` | [x] HOÀN TẤT |
| FE09-T012 | Căn chỉnh frontend | [x] HOÀN TẤT - truy vấn/phân trang máy chủ chính tắc và trình duyệt/L4 hoàn tất bởi FE09-T021 |

## Tác vụ đối soát v0.4.0

- [x] **FE09-T013 - Thêm kiểm thử RED cho hợp đồng, múi giờ, trạng thái kết thúc và đồng thời.**
  - Ánh xạ tới: BR-FE09-001 đến BR-FE09-019; FR-FE09-001 đến FR-FE09-017; AC-FE09-001 đến AC-FE09-015.
  - Tệp: `backend/tests/fineManagementRoutes.test.js`, tạo `backend/tests/fineContract.test.js`, tạo `backend/tests/sql/fineConcurrency.sqltest.js`, tạo `backend/tests/helpers/inMemoryFineRepositories.js`.
  - Phụ thuộc: FE09-T001 đến FE09-T011 lịch sử.
  - RED: thêm kiểm thử cho không số tiền một phần, siêu dữ liệu thanh toán đầy đủ, biên múi giờ, danh sách phân trang/thứ tự, miễn/hủy Quản trị, lý do/query không hợp lệ, xung đột kết thúc và audit nguyên tử thất bại.
  - Xác minh RED: lệnh backend/SQL tập trung chỉ thất bại trên hành vi v0.4.1 chưa được lát cắt lịch sử bao phủ.
  - Tiêu chí hoàn thành: mọi tiêu chí chấp nhận v0.4.1 có assertion cụ thể.

- [x] **FE09-T014 - Đối soát schema, mô hình, API và ranh giới cũ.**
  - Ánh xạ tới: BR-FE09-010, BR-FE09-016 đến BR-FE09-019; FR-FE09-002, FR-FE09-007, FR-FE09-010, FR-FE09-011, FR-FE09-014 đến FR-FE09-016; AC-FE09-002, AC-FE09-006, AC-FE09-011, AC-FE09-013/014.
  - Tệp: `database/Librarymanagement.sql`, `backend/src/models/Fine.js`, `backend/src/routes/fineRoutes.js`, `backend/src/controllers/fineManagementController.js`, `backend/src/docs/openapi.yaml`, `backend/tests/fineContract.test.js`.
  - Phụ thuộc: FE09-T013.
  - GREEN: công khai route danh sách, miễn và hủy phía máy chủ; loại `collectedAmount` khỏi hợp đồng production; giữ thay đổi create/update/delete cũ không đăng ký với kiểm thử `404` rõ ràng.
  - Xác minh: kiểm thử hợp đồng xác nhận actor, payload, mã trạng thái, phân trang và lỗi an toàn chính xác.
  - Tiêu chí hoàn thành: trường schema/mô hình khớp siêu dữ liệu thanh toán đã phê duyệt, thao tác OpenAPI chính tắc được ghi và route thay đổi cũ không thể bị nhầm với hành vi production.

- [x] **FE09-T015 - Đối soát tính toán và ngăn trùng lặp.**
  - Ánh xạ tới: BR-FE09-005 đến BR-FE09-009, BR-FE09-019; FR-FE09-003 đến FR-FE09-006, FR-FE09-017; AC-FE09-003 đến AC-FE09-005, AC-FE09-015; NFR-FE09-SEC-004, NFR-FE09-TXN-001, NFR-FE09-PERF-002.
  - Tệp: tạo `backend/src/utils/libraryBusinessTime.js`, `backend/src/services/fineManagementService.js`, `backend/src/repositories/fineRepository.js`, `backend/tests/fineManagementRoutes.test.js`, `backend/tests/sql/fineConcurrency.sqltest.js`.
  - Phụ thuộc: FE09-T013, FE09-T014.
  - GREEN: tính bằng ngày đã lưu và `Asia/Ho_Chi_Minh`; dùng `overdueDays * 5000`; trả phạt đang hoạt động hiện có không đổi; khóa phát hiện trùng lặp.
  - Xác minh: kiểm thử route/SQL đạt các ca đúng hạn, quá hạn, thiếu ngày, giả mạo client, biên múi giờ và trùng lặp đồng thời.
  - Tiêu chí hoàn thành: không phạt đã lưu nào có số tiền không dương; phạt `UNPAID` được tính lại tại chỗ và lịch sử kết thúc bất biến.

- [x] **FE09-T016 - Đối soát chuyển đổi thu đầy đủ và đã thanh toán nguyên tử.**
  - Ánh xạ tới: BR-FE09-004, BR-FE09-012, BR-FE09-013, BR-FE09-017; FR-FE09-007 đến FR-FE09-009, FR-FE09-012/013; AC-FE09-006 đến AC-FE09-010, AC-FE09-012; NFR-FE09-TXN-002.
  - Tệp: `backend/src/services/fineManagementService.js`, `backend/src/repositories/fineRepository.js`, `backend/src/repositories/auditLogRepository.js`, `backend/tests/fineManagementRoutes.test.js`, `backend/tests/sql/fineConcurrency.sqltest.js`.
  - Phụ thuộc: FE09-T015.
  - GREEN: đối soát thu và đã thanh toán từ chối `collectedAmount`, đặt `PaidAmount = Amount`, `CollectedBy`, `PaymentMethod`, `PaidAt`, `PAID` và audit trong một giao dịch.
  - Xác minh: kiểm thử chứng minh từ chối thành viên, thu đầy đủ, xung đột thử lại kết thúc, bên thắng thanh toán đồng thời và hoàn tác khi audit thất bại.
  - Tiêu chí hoàn thành: `PAID` chỉ có thể có với siêu dữ liệu thanh toán đầy đủ và không tồn tại trạng thái một phần.

- [x] **FE09-T017 - Đối soát chuyển đổi kết thúc miễn/hủy Quản trị.**
  - Ánh xạ tới: BR-FE09-011, BR-FE09-015; FR-FE09-014/015; AC-FE09-013/014; NFR-FE09-SEC-003, NFR-FE09-TXN-002, NFR-FE09-LOG-001.
  - Tệp: `backend/src/services/fineManagementService.js`, `backend/src/repositories/fineRepository.js`, `backend/src/routes/fineRoutes.js`, `backend/tests/fineManagementRoutes.test.js`, `backend/tests/sql/fineConcurrency.sqltest.js`.
  - Phụ thuộc: FE09-T014, FE09-T016.
  - GREEN: chỉ Quản trị chuyển `UNPAID` sang `WAIVED`/`CANCELLED`; lý do được cắt khoảng trắng 1..500; trạng thái và audit commit nguyên tử; thử lại kết thúc trả `409 FINE_NOT_RESOLVABLE`.
  - Xác minh: kiểm thử route/SQL tập trung bao phủ hành vi vai trò, lý do, trạng thái, audit và đồng thời.
  - Tiêu chí hoàn thành: phạt đã giải quyết vẫn hiển thị và không còn chặn điều kiện hợp lệ FE07.

- [x] **FE09-T018 - Đối soát lượt đọc phạt và hợp đồng tích hợp FE07/FE12.**
  - Ánh xạ tới: BR-FE09-001 đến BR-FE09-003, BR-FE09-010 đến BR-FE09-014, BR-FE09-018; FR-FE09-001/002/010/011; AC-FE09-001/002/009/010/011; NFR-FE09-SEC-001/002, NFR-FE09-PERF-001, NFR-FE09-UX-001/002.
  - Tệp: `backend/src/services/fineManagementService.js`, `backend/src/repositories/fineRepository.js`, `backend/src/controllers/fineManagementController.js`, `backend/tests/fineManagementRoutes.test.js`, `backend/tests/fineContract.test.js`, `backend/tests/borrowingRoutes.test.js`.
  - Phụ thuộc: FE09-T014 đến FE09-T017.
  - GREEN: route `/api/fines` tới danh sách phía máy chủ, thực thi cô lập chủ sở hữu/nhân sự, áp dụng bộ lọc page/limit/trạng thái/người dùng, sắp `FineId ASC` và công khai trạng thái đã giải quyết/chưa thanh toán nhất quán cho FE07/FE12.
  - Xác minh: kiểm thử tập trung bao phủ vai trò khách/thành viên/nhân sự, ID không rõ, bộ lọc không hợp lệ, phân trang, thứ tự và đọc lại yếu tố chặn mượn.
  - Tiêu chí hoàn thành: route thay đổi cũ trả `404` và không thể bị nhầm với hợp đồng danh sách production.

- [x] **FE09-T019 - Ghi ranh giới migration frontend.**
  - Ánh xạ tới: BR-FE09-016, AC-FE09-001 đến AC-FE09-012, NFR-FE09-UX-001/002.
  - Tệp: `frontend/src/page/FineManagement.jsx`, `frontend/src/api/libraryFeatureApi.js`, tạo `frontend/test/fineManagementFrontend.test.js`, `.sdd/specs/feat-fine-management/TEST_PLAN.md`.
  - Phụ thuộc: FE09-T018.
  - RED: tài liệu/kiểm thử thất bại nếu UI lưu trữ trình duyệt cũ được trình bày là hoàn tất production hoặc nhận thanh toán một phần.
  - GREEN: quyền sở hữu API chính tắc và không fallback lưu trữ trình duyệt được xác minh; trình bày danh sách do máy chủ kiểm soát đầy đủ vẫn hoãn dưới TD-004.
  - Tiêu chí hoàn thành: tác vụ này không khẳng định UI hoãn; nó làm ranh giới rõ ràng cho chủ sở hữu.

- [x] **FE09-T020 - Hoàn tất bằng chứng truy vết và xác minh.**
  - Ánh xạ tới: mọi ID FE09 BR/FR/AC/NFR và Định nghĩa hoàn thành.
  - Tệp: `.sdd/specs/feat-fine-management/SPEC.md`, `PLAN.md`, `TASKS.md`, `TEST_PLAN.md`, `CHANGELOG.md`.
  - Phụ thuộc: FE09-T013 đến FE09-T019.
  - Xác minh: kiểm tra backend/SQL/hợp đồng/ranh giới frontend tập trung, `npm.cmd run trace:enforce` và `git diff --check` đạt; bộ đầy đủ vẫn là cổng merge.
  - Tiêu chí hoàn thành: không còn `TBD`, “optional if supported”, chính sách thanh toán một phần hay truy vết triển khai thiếu; cổng L4/con người vẫn nêu rõ là mở.

- [x] **FE09-T021 - Hoàn tất danh sách frontend do máy chủ kiểm soát và chấp nhận trình duyệt/L4.**
  - Ánh xạ tới: BR-FE09-018; FR-FE09-002, FR-FE09-011, FR-FE09-016; AC-FE09-002, AC-FE09-011; NFR-FE09-PERF-001, NFR-FE09-UX-001/002.
  - Tệp: `frontend/src/page/FineManagement.jsx`, `frontend/src/utils/fineListQuery.js`, `frontend/test/fineManagementFrontend.test.js`, `frontend/test/fineOperationalFrontend.test.js`, `tests/e2e/fe09-fine-management.spec.js`.
  - RED: kiểm thử nguồn thất bại vì thiếu query builder; chấp nhận trình duyệt hết thời gian vì `/api/fines` thiếu tham số `page`/`limit` chính tắc.
  - GREEN: UI gửi `q` đã cắt khoảng trắng, trạng thái không phải `ALL` tùy chọn, trang và giới hạn; chỉ hiển thị hàng máy chủ trả về; dùng `total`/`totalPages`; gắn nhãn KPI theo phạm vi trang trung thực.
  - Xác minh: frontend tập trung 6/6, Playwright FE09 1/1, frontend đầy đủ 146/146, lint/build, bộ trình duyệt cô lập hoàn chỉnh 3/3 và lượt chạy PR CI `29680600893` đạt trên `dfe45ae`.
  - Tiêu chí hoàn thành: `TD-004` được giải quyết không thay đổi thay đổi phạt, hợp đồng backend, schema hay chính sách Giai đoạn 1.

- [x] **FE09-T022 - Kết nối lựa chọn quy trình phạt của Thủ thư.**
  - Ánh xạ tới: FR-FE09-018, AC-FE09-016, NFR-FE09-UX-001/002.
  - Tệp: `frontend/src/page/FineManagement.jsx`, `frontend/src/styles/fine-management.css`, `frontend/test/fineManagementFrontend.test.js`, tệp đặc tả/bằng chứng FE09.
  - GREEN: loại thông báo xử lý dư thừa; mang một phạt chính tắc từ tính/chọn danh sách vào thu hoặc đối soát thanh toán; từ chối bước thanh toán không có lựa chọn `UNPAID`; giữ trạng thái trả về do thay đổi qua ranh giới phân trang/lọc danh sách.
  - Tiêu chí hoàn thành: bốn phần phạt Thủ thư hoạt động trên cùng vòng đời phạt do máy chủ sở hữu và giữ tích hợp trạng thái FE07/FE12.

- [x] **FE09-T023 - Đơn giản hóa trình bày sách phạt Thủ thư.**
  - Giữ mã vạch trong DTO phạt và hợp đồng tìm kiếm do máy chủ sở hữu, nhưng chỉ hiển thị tiêu đề sách trong danh sách Thủ thư và thẻ sách phạt đã chọn.
  - Xác minh header bảng, markup hàng, thẻ chi tiết và prompt tìm kiếm không trình bày mã vạch là trường sách hiển thị.

- [x] **FE09-T024 - Kết nối phạt Thành viên với ngữ cảnh mượn và truy cập một vai trò.**
  - Ánh xạ tới: BR-FE09-020, FR-FE09-019, AC-FE09-017; BR-FE07-006 và BR-FE11-028.
  - Bảo vệ `/api/fines/me` chỉ cho Thành viên, gồm hạn trả/trả/trạng thái mượn từ FE07 và giữ trình bày Thành viên chỉ đọc.
  - Giải thích yếu tố chặn mượn/gia hạn phạt chưa thanh toán và liên kết Thành viên tới lịch sử mượn chính tắc.
  - Giữ quyền sở hữu thu tiền Thủ thư/Quản trị và miễn/hủy chỉ Quản trị.

- [~] **FE09-T025 - Ẩn mã định danh chi tiết mượn nội bộ khỏi phạt Thành viên.**
  - Ánh xạ tới: FR-FE09-019, AC-FE09-017.
  - Loại header `Mã mượn`, ô hàng và fallback sách dựa trên mã định danh khỏi bảng phạt Thành viên.
  - Giữ `borrowDetailId` trong DTO API/cơ sở dữ liệu chính tắc và mọi quy trình tính, đối soát và audit của Thủ thư/Quản trị.
  - Xác minh kiểm thử phạt Thành viên tập trung, kiểm thử frontend đầy đủ, lint/build, truy vết và vệ sinh diff; rà soát của con người vẫn bắt buộc.

- [~] **FE09-T026 - Công khai tạo phạt có thẩm quyền máy chủ từ lượt trả quá hạn.**
  - Ánh xạ tới: FR-FE09-020, AC-FE09-018; FR-FE07-039, AC-FE07-032.
  - Tái sử dụng `POST /api/fines/calculate` từ không gian trả Thủ thư/Quản trị chỉ với `borrowDetailId` quá hạn đã chọn.
  - Giữ ủy quyền hiện có, tính ngày đã lưu, chính sách 5.000 VND/ngày, chống trùng lặp phạt đang hoạt động, hành vi trạng thái kết thúc và giao dịch audit.
  - Xác minh kiểm thử frontend FE07/FE09 tập trung, kiểm thử frontend đầy đủ, lint/build, truy vết và vệ sinh diff; rà soát của con người vẫn bắt buộc.

## Trạng thái xác thực

- Bằng chứng TD-001/002/003 lịch sử vẫn trong changelog và không đóng FE09-T013 đến FE09-T020.
- [x] Xác thực tập trung FE09-T013 đến FE09-T019 đạt phía agent.
- [x] Truy vết và `git diff --check` đạt.
- [x] SQL trực tiếp đạt 9/9 ca FE09 trên SQL Server dùng một lần cùng bằng chứng dọn dẹp.
- [x] Chấp nhận trình duyệt/L4 đạt trên cổng cô lập `4185/3101`.
- [ ] Cổng chấp nhận B7 con người đạt.
- [x] Rà soát con người SPEC v0.4.0 và kế hoạch đối soát được Nhat xác nhận vào 2026-07-17; cập nhật ranh giới production v0.4.1 đã phê duyệt từ `origin/main@3f63a13` được tích hợp.

## Ngoài vòng lặp này

- Cổng thanh toán trực tuyến, thanh toán một phần, scheduler tự động và chính sách phạt mất/hỏng vẫn ngoài phạm vi.
