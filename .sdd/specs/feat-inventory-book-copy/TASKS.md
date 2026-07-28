# TASKS.md - FE06 Quản lý tồn kho / bản sao sách

Trạng thái: ĐÃ HOÀN TẤT - ĐÃ GHI NHẬN BẰNG CHỨNG CHỐT GIAI ĐOẠN 2
Implementation State: COMPLETE

Chủ sở hữu: Dat

Cập nhật: 2026-07-19

Trạng thái quy trình: đã hoàn tất cho phạm vi Giai đoạn 2 đã phê duyệt; H3, merge và CI `main` chính xác sau merge được ghi tại `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`. Các phát biểu cổng đang chờ/mở bên dưới là ảnh chụp thực thi lịch sử đã được bằng chứng đó thay thế.

---

## Quy tắc tác vụ

- Thực hiện các tác vụ theo thứ tự số và bắt đầu mỗi tác vụ hành vi bằng các kiểm thử RED được nêu tên.
- Không khẳng định hoàn thành từ route/kiểm thử hiện có; chúng có trước v0.4.0.
- FE06 không bao giờ thực hiện các chuyển đổi quy trình FE07/FE08 vào/ra `BORROWED` hoặc `RESERVED`.
- Mọi thay đổi bản sao hiện có yêu cầu `If-Match` khớp và xử lý xung đột/audit trong cùng giao dịch.
- Thêm thẻ `@spec` vào các tệp triển khai đã thay đổi cho các ID FR/BR được ánh xạ.

## Tác vụ theo thứ tự

- [x] **FE06-T001 - Thêm kiểm thử RED cho hợp đồng route, đồng thời SQL và frontend.**
  - Ánh xạ tới: BR-FE06-001 đến BR-FE06-018; FR-FE06-001 đến FR-FE06-024; AC-FE06-001 đến AC-FE06-014.
  - Tệp: `backend/tests/inventoryRoutes.test.js`, tạo `backend/tests/helpers/inMemoryInventoryRepositories.js`, tạo `backend/tests/sql/inventoryConcurrency.sqltest.js`, `frontend/test/inventoryOperationalFrontend.test.js`.
  - Phụ thuộc: không có.
  - RED: bao phủ phản hồi danh sách/số đếm, phân trang xác định, trường an toàn, xác thực mã vạch/tham chiếu/vị trí, sách cha đang hoạt động, ma trận chuyển đổi, lý do bắt buộc, xung đột mượn/đặt trước, `If-Match`, ngừng kích hoạt idempotent, audit nguyên tử và loại bỏ quyền sở hữu frontend mock.
  - Xác minh RED: các lệnh backend/SQL/frontend tập trung chỉ thất bại vì hành vi v0.4.0 còn thiếu.
  - Tiêu chí hoàn thành: mọi AC có ít nhất một assertion và các kiểm thử hoàn tác kiểm tra trạng thái bản sao, quy trình và audit.

- [x] **FE06-T002 - Thêm rowversion BookCopies và ghi lại hợp đồng thay đổi.**
  - Ánh xạ tới: BR-FE06-010, BR-FE06-012, BR-FE06-016; FR-FE06-010, FR-FE06-017 đến FR-FE06-019; AC-FE06-006, AC-FE06-009, AC-FE06-012; NFR-FE06-TXN-001/002.
  - Tệp: `database/Librarymanagement.sql`, `.sdd/rfcs/ADR-002-database-design.md`, `backend/src/models/BookCopy.js`, `backend/src/docs/openapi.yaml`.
  - Phụ thuộc: FE06-T001.
  - GREEN: thêm SQL `rowversion`, xác định mã hóa phiên bản opaque, ghi lại `If-Match` khi cập nhật/trạng thái/xóa và giữ hành vi chỉ ngừng kích hoạt mềm.
  - Xác minh: kiểm thử SQL có thể đọc/so sánh/tăng phiên bản và cho thấy không có đường dẫn xóa vật lý.
  - Tiêu chí hoàn thành: các thay đổi schema vẫn có thể được rà soát và không làm đổi siêu dữ liệu FE05 hoặc cột quy trình FE07/FE08.

- [x] **FE06-T003 - Đối soát validator, header và phản hồi API an toàn.**
  - Ánh xạ tới: BR-FE06-001 đến BR-FE06-004, BR-FE06-011, BR-FE06-016 đến BR-FE06-018; FR-FE06-001 đến FR-FE06-005, FR-FE06-009, FR-FE06-011 đến FR-FE06-014, FR-FE06-018, FR-FE06-020, FR-FE06-021, FR-FE06-023, FR-FE06-024; AC-FE06-001 đến AC-FE06-005, AC-FE06-010, AC-FE06-012 đến AC-FE06-014; NFR-FE06-SEC-001 đến NFR-FE06-SEC-004.
  - Tệp: `backend/src/routes/inventoryRoutes.js`, `backend/src/controllers/inventoryController.js`, `backend/src/validators/inventoryValidators.js`, `backend/src/docs/openapi.yaml`.
  - Phụ thuộc: FE06-T001, FE06-T002.
  - GREEN: xác thực ID, mã vạch, vị trí tùy chọn 1..100 không có ký tự điều khiển, chính sách page/limit chính xác, trạng thái thủ công được hỗ trợ, lý do bắt buộc 1..500 và `If-Match`.
  - Xác minh: kiểm thử route trả về các phản hồi `400`, `401`, `403`, `404` và `409` an toàn, xác định.
  - Tiêu chí hoàn thành: phân trang được cung cấp không hợp lệ bị từ chối trước truy vấn repository và các trường phản hồi loại trừ dữ liệu được bảo vệ không liên quan.

- [x] **FE06-T004 - Đối soát danh sách tồn kho, số đếm và tra cứu.**
  - Ánh xạ tới: BR-FE06-003 đến BR-FE06-006, BR-FE06-009, BR-FE06-018; FR-FE06-001 đến FR-FE06-003, FR-FE06-008, FR-FE06-009, FR-FE06-024; AC-FE06-001 đến AC-FE06-003, AC-FE06-009, AC-FE06-014; NFR-FE06-PERF-001 đến NFR-FE06-PERF-003.
  - Tệp: `backend/src/services/inventoryService.js`, `backend/src/repositories/inventoryRepository.js`, `backend/tests/inventoryRoutes.test.js`.
  - Phụ thuộc: FE06-T003.
  - GREEN: trả về `{ items, page, limit, totalItems, totalPages, countsByStatus }` với bộ lọc giống hệt cho item/số đếm; chỉ công khai tóm tắt bản sao/sách và phiên bản opaque.
  - Xác minh: kiểm thử route tập trung đạt cho phân trang bỏ qua/mặc định, phân trang không hợp lệ, bộ lọc kết hợp, số đếm, mã vạch có/không khớp và các ca khả dụng không hoạt động.
  - Tiêu chí hoàn thành: chỉ bản sao `AVAILABLE` được tính là đang lưu kho khả dụng; khả năng mượn/công khai hiệu lực vẫn đồng thời yêu cầu sách cha đang hoạt động.

- [x] **FE06-T005 - Triển khai tạo nguyên tử và cập nhật siêu dữ liệu.**
  - Ánh xạ tới: BR-FE06-002, BR-FE06-003, BR-FE06-009, BR-FE06-011 đến BR-FE06-013, BR-FE06-015, BR-FE06-016; FR-FE06-004, FR-FE06-005, FR-FE06-010 đến FR-FE06-012, FR-FE06-018, FR-FE06-019, FR-FE06-021, FR-FE06-022; AC-FE06-004 đến AC-FE06-006, AC-FE06-011, AC-FE06-012.
  - Tệp: `backend/src/services/inventoryService.js`, `backend/src/repositories/inventoryRepository.js`, `backend/src/repositories/auditLogRepository.js`, `backend/tests/inventoryRoutes.test.js`, `backend/tests/sql/inventoryConcurrency.sqltest.js`.
  - Phụ thuộc: FE06-T002 đến FE06-T004.
  - GREEN: tạo `AVAILABLE` do máy chủ kiểm soát dưới sách cha đang hoạt động; cập nhật siêu dữ liệu chỉ đổi mã vạch/vị trí với phiên bản hiện tại; thay đổi và audit commit nguyên tử.
  - Xác minh: kiểm thử route/SQL tập trung đạt cho sách cha hoạt động/không hoạt động, mã vạch trùng lặp, vị trí không hợp lệ, phiên bản cũ và các ca hoàn tác khi audit thất bại.
  - Tiêu chí hoàn thành: cập nhật không thể nhận trạng thái hoặc siêu dữ liệu FE05 và trả về phiên bản đã tăng.

- [x] **FE06-T006 - Triển khai các lệnh trạng thái thủ công và ngừng kích hoạt có giao dịch.**
  - Ánh xạ tới: BR-FE06-004 đến BR-FE06-008, BR-FE06-010, BR-FE06-012, BR-FE06-014 đến BR-FE06-017; FR-FE06-006 đến FR-FE06-008, FR-FE06-010, FR-FE06-013 đến FR-FE06-020, FR-FE06-022, FR-FE06-023; AC-FE06-006 đến AC-FE06-013; NFR-FE06-TXN-001/002, NFR-FE06-LOG-001.
  - Tệp: `backend/src/services/inventoryService.js`, `backend/src/repositories/inventoryRepository.js`, `backend/src/repositories/auditLogRepository.js`, `backend/tests/inventoryRoutes.test.js`, `backend/tests/sql/inventoryConcurrency.sqltest.js`.
  - Phụ thuộc: FE06-T005.
  - RED: kiểm thử race thay đổi trạng thái mượn/đặt trước giữa lượt đọc ban đầu và thay đổi; các kiểm thử cũng bao phủ `BORROWED`/`RESERVED` thủ công bị cấm, giải phóng đã đặt trước, giải phóng đã mượn, bảo vệ sách cha đang hoạt động, lý do, phiên bản cũ và ngừng kích hoạt trùng lặp.
  - GREEN: khóa `BookCopies -> BorrowDetails -> Reservations`, so sánh phiên bản, kiểm tra lại xung đột/sách cha, áp dụng một chuyển đổi hợp lệ và ghi audit trong một giao dịch.
  - Xác minh: kiểm thử route/SQL tập trung đạt cho mọi ca ma trận trạng thái và hoàn tác mà không deadlock.
  - Bằng chứng hiệu chỉnh sau H2: bốn hồi quy race route chuyển sang RED tại `201/200`, sau đó GREEN; route `35/35`, SQL trực tiếp FE06 `10/10`, dọn dẹp `DB_CLEAN`/`LOGIN_CLEAN`.
  - Tiêu chí hoàn thành: ngừng kích hoạt trùng lặp ở phiên bản hiện tại trả về bản sao hiện tại cùng `changed = false` và không ghi audit chuyển đổi thứ hai.

- [x] **FE06-T007 - Thay quyền sở hữu tồn kho mock bằng trạng thái frontend dựa trên máy chủ.**
  - Ánh xạ tới: AC-FE06-001 đến AC-FE06-014; NFR-FE06-UX-001/002.
  - Tệp: `frontend/src/page/InventoryPage.jsx`, `frontend/src/component/inventory/InventoryManagement.jsx`, `frontend/src/component/inventory/BookCopies.jsx`, `frontend/src/component/inventory/Filter.jsx`, `frontend/src/component/inventory/StatusBadge.jsx`, `frontend/src/api/libraryFeatureApi.js`, `frontend/test/inventoryOperationalFrontend.test.js`.
  - Phụ thuộc: FE06-T003 đến FE06-T006.
  - RED: kiểm thử thất bại khi dữ liệu vận hành đến từ `MOCK_BOOKS`/`MOCK_COPIES`, các thay đổi bỏ `If-Match`/lý do, hoặc xung đột cung cấp ghi đè cục bộ.
  - GREEN: tải/lọc tồn kho thực, giữ phiên bản bản sao, yêu cầu lý do/xác nhận, gửi phiên bản hiện tại, tải lại sau khi thành công và hiển thị hướng dẫn xung đột cũ/mượn/đặt trước/sách cha.
  - Xác minh: `node --test frontend/test/inventoryOperationalFrontend.test.js` đạt.
  - Tiêu chí hoàn thành: UI phân tách rõ siêu dữ liệu sách khỏi trạng thái bản sao và không bao giờ tạo ra thay đổi bản sao thành công giả.

- [x] **FE06-T008 - Hoàn tất truy vết và bằng chứng xác minh.**
  - Ánh xạ tới: mọi ID BR/FR/AC FE06 và Định nghĩa hoàn thành.
  - Tệp: triển khai/kiểm thử FE06 đã thay đổi, `.sdd/specs/feat-inventory-book-copy/TEST_PLAN.md`, `.sdd/specs/feat-inventory-book-copy/CHANGELOG.md`.
  - Phụ thuộc: FE06-T001 đến FE06-T007.
  - Xác minh: backend, SQL, frontend tập trung, `npm.cmd run trace:enforce` và `git diff --check` đạt; bộ đầy đủ chỉ chạy tại cổng merge.
  - Tiêu chí hoàn thành: bằng chứng ghi nhận kết quả chính xác và rà soát khóa liên tính năng mà không khẳng định kiểm thử prototype/lịch sử bao phủ v0.4.0.

## Bao phủ yêu cầu theo tác vụ

| ID yêu cầu | Tác vụ đã lập kế hoạch |
| --- | --- |
| BR-FE06-001 đến BR-FE06-004 | FE06-T003, FE06-T005 |
| BR-FE06-005 đến BR-FE06-010 | FE06-T004, FE06-T006 |
| BR-FE06-011 đến BR-FE06-014 | FE06-T003, FE06-T005, FE06-T006 |
| BR-FE06-015 đến BR-FE06-018 | FE06-T002, FE06-T003, FE06-T005, FE06-T006 |
| FR-FE06-001 đến FR-FE06-005 | FE06-T003, FE06-T004, FE06-T005 |
| FR-FE06-006 đến FR-FE06-010 | FE06-T004, FE06-T006 |
| FR-FE06-011 đến FR-FE06-014 | FE06-T003, FE06-T005, FE06-T006 |
| FR-FE06-015 đến FR-FE06-020 | FE06-T002, FE06-T006 |
| FR-FE06-021 đến FR-FE06-024 | FE06-T003, FE06-T005, FE06-T006 |
| FR-FE06-025 | FE06-T009 |
| AC-FE06-001 đến AC-FE06-005 | FE06-T004, FE06-T005 |
| AC-FE06-006 đến AC-FE06-010 | FE06-T003, FE06-T006 |
| AC-FE06-011 đến AC-FE06-014 | FE06-T003, FE06-T005, FE06-T006, FE06-T007 |
| AC-FE06-015 | FE06-T009 |

## Cổng hoàn thành

- [x] FE06-T009 Hoàn tất căn chỉnh tìm kiếm/lọc phía máy chủ và trạng thái lỗi tải riêng biệt.

- [x] FE06-T001 đến FE06-T008 đã hoàn thành và được rà soát độc lập; bằng chứng tích hợp cuối cùng được ghi tại `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- [x] Backend tập trung `35/35`, SQL FE06 `10/10`, frontend `6/6`, truy vết `24/24` và kiểm tra diff đạt.
- [ ] Bộ kiểm thử cổng merge đầy đủ đạt khi nhánh triển khai sẵn sàng.
- [ ] Chủ sở hữu FE05/FE07/FE08 xác nhận quyền sở hữu trạng thái và tính tương thích thứ tự khóa.
- [ ] Dat xác nhận tồn kho dựa trên máy chủ và hành vi UX cũ/xung đột.

## Batch hiệu chỉnh 2026-07-22

- [x] Xác minh tham số tìm kiếm/lọc tồn kho vẫn dựa trên máy chủ.
- [x] Thêm hành động quản lý bản sao hiển thị trên từng hàng và phạm vi hồi quy.
- [x] Sắp xếp theo ID bản sao tăng dần và kết nối áp dụng/đặt lại/tải lại/phân trang với danh sách đã lọc chính tắc.
- [x] Join siêu dữ liệu nhà xuất bản nhất quán trong hàng tồn kho, tổng phân trang và số đếm trạng thái để tìm kiếm nhà xuất bản không thể làm hỏng bất kỳ truy vấn tổng hợp nào.
- [x] Phân giải an toàn `BookCopies.Version` chính tắc và `BookCopies.RowVersion` cũ cho lượt đọc và thay đổi tồn kho; chỉ trả về 503 có thể hành động khi không có cả hai.

## Giai đoạn 3: Hội tụ

- [x] FE06-T010 - Chuẩn hóa vị trí bản sao trống thành `null` trên xác thực tạo/cập nhật, lưu trữ và kiểm thử tập trung theo FR-FE06-021 và EC-FE06-005 (mâu thuẫn).

## Giai đoạn 4: Hội tụ

- [x] FE06-T011 - Thêm FR-FE06-025 và AC-FE06-015 vào ma trận truy vết SPEC và bao phủ Yêu cầu theo tác vụ cho hợp đồng tìm kiếm/lọc/trạng thái lỗi phía máy chủ đã triển khai (một phần).

## Giai đoạn 5: Hội tụ

- [x] FE06-T012 - Căn chỉnh assertion tĩnh đồng thời SQL với projection động `Version`/`RowVersion` cần cho batch hiệu chỉnh FE06 (mâu thuẫn).

## Tích hợp yêu cầu đang chờ FE07 ngày 2026-07-27

- [~] **FE06-T013 - Bảo vệ bản sao được yêu cầu mượn đang chờ nhận.**
  - Ánh xạ tới: FR-FE06-026, AC-FE06-016; BR-FE07-033.
  - Thêm kiểm tra trước ở service và kiểm tra lại repository có khóa giao dịch cho
    `BorrowRequests.PENDING + BorrowDetails.REQUESTED`.
  - Trả về `PENDING_BORROW_REQUEST_CONFLICT` mà không thay đổi bản sao/audit.
  - Bằng chứng: backend tập trung được bao gồm trong 123/123; backend đầy đủ
    1,056/1,056, frontend đầy đủ 232/232, lint/build, truy vết và vệ sinh diff
    đều đạt cục bộ.
  - Còn lại: rà soát của con người.
