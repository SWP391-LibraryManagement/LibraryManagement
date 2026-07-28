# TASKS.md - FE07 Quản lý mượn sách

Trạng thái: KHẮC PHỤC QUẢN TRỊ H3 - ĐANG CHỜ H2 MỚI
Implementation State: PARTIAL

Mở rộng hiện tại: triển khai và xác thực tự động v0.8.0 đã hoàn tất;
rà soát của con người vẫn đang chờ. Mốc cơ sở Giai đoạn 2 trước đó vẫn hoàn tất.

Chủ sở hữu: Nhat

Cập nhật: 2026-07-27

Trạng thái quy trình: Mốc cơ sở Giai đoạn 2 vẫn hoàn tất. Nhat đã phê duyệt phụ lục H2
`8d0059b` vào 2026-07-27; kết quả đã được rà soát được commit là
`f346ae0`, đẩy lên PR nháp #63 và lượt chạy CI `30244750250` đã đạt. Lần rà soát
H3 đầu tiên không phát hiện lỗi mã hay quy tắc nghiệp vụ FE07 mà chỉ trả về diễn đạt
quản trị cũ. Việc khắc phục chỉ tài liệu vẫn chưa được commit, đang chờ H2 mới và H3 lặp lại.

---

## Ghi chú sai lệch bản sửa đổi

Các tác vụ đã chọn bên dưới mô tả việc triển khai đã hoàn thành theo mốc cơ sở đã phê duyệt trước đó. Chúng không đóng các mục BR/FR/AC v0.5.0 đã phê duyệt; các tác vụ đối soát chưa chọn chuyên biệt được xác định tại Phần 3.2.

## 1. Tác vụ backend

- [x] FE07-T01 Thêm route mượn từ hợp đồng API đã phê duyệt.
- [x] FE07-T02 Thêm validator cho ID yêu cầu, ID chi tiết, ID bản sao, trạng thái, ngày, lý do từ chối, tình trạng trả và ghi chú.
- [x] FE07-T03 Thêm quy tắc service mượn cho điều kiện hợp lệ thành viên, giới hạn mượn, phạt chưa thanh toán, khoản mượn quá hạn, khả dụng bản sao và mục yêu cầu trùng lặp.
- [x] FE07-T04 Thêm phương thức repository SQL cho tạo, liệt kê, phê duyệt, từ chối, trả và gia hạn yêu cầu mượn.
- [x] FE07-T05 Thêm endpoint thành viên cho tạo yêu cầu và lịch sử của chính mình.
- [x] FE07-T06 Thêm endpoint nhân sự cho danh sách yêu cầu và thông tin mượn của thành viên.
- [x] FE07-T07 Thêm luồng phê duyệt đánh dấu chi tiết `BORROWED`, đặt hạn trả và đánh dấu bản sao `BORROWED`.
- [x] FE07-T08 Thêm luồng từ chối cho yêu cầu đang chờ.
- [x] FE07-T09 Thêm luồng trả cho lượt trả bình thường, hỏng và mất.
- [x] FE07-T10 Thêm luồng gia hạn với giới hạn một lần gia hạn và kiểm tra xung đột đặt trước FE08.
- [x] FE07-T11 Công khai dữ liệu rà soát phạt mà không tạo hàng phạt FE09.
- [x] FE07-T12 Ghi audit log cho tạo, phê duyệt, từ chối, trả và gia hạn.
- [x] FE07-T13 Căn chỉnh tập lệnh SQL với các trạng thái FE07 đã phê duyệt.

## 2. Tác vụ kiểm thử

- [x] FE07-T14 Thêm helper repository mượn trong bộ nhớ.
- [x] FE07-T15 Kiểm thử tạo yêu cầu, từ chối bản sao trùng lặp và từ chối bản sao không khả dụng.
- [x] FE07-T16 Kiểm thử phê duyệt và lịch sử chỉ thành viên.
- [x] FE07-T17 Kiểm thử xử lý trả, cập nhật yêu cầu hoàn thành và đầu ra ứng viên phạt.
- [x] FE07-T18 Kiểm thử gia hạn thành công, giới hạn gia hạn và xung đột đặt trước.
- [x] FE07-T19 Kiểm thử bảo vệ xác thực và vai trò.

## 3. Tác vụ frontend

- [x] FE07-T20 Triển khai màn hình tạo yêu cầu mượn của thành viên.
- [x] FE07-T21 Triển khai màn hình lịch sử mượn của thành viên.
- [x] FE07-T22 Triển khai màn hình phê duyệt/từ chối yêu cầu mượn của thủ thư.
- [x] FE07-T23 Triển khai màn hình xử lý trả của thủ thư.
- [x] FE07-T24 Triển khai màn hình chi tiết mượn thành viên của thủ thư.
- [x] FE07-T25 Nối màn hình frontend với API backend.
- [x] FE07-T26 Thêm khả năng tiếp cận: caption bảng, phạm vi header, nhãn biểu mẫu, hỗ trợ bàn phím.
- [x] FE07-T27 Thêm trạng thái tải, rỗng và lỗi trên mọi màn hình.

## 3.1 Tác vụ tích hợp FE07-FE08

- [x] FE07-T029 Thực thi khả năng mượn có nhận biết đặt trước khi tạo và phê duyệt. Truy vết: BR-FE07-023/024; AC-FE07-015/016. Phụ thuộc: trạng thái hàng đợi FE08. Hoàn thành khi kiểm thử route RED/GREEN đạt.
- [x] FE07-T030 Hoàn tất lượt đặt trước đã thông báo khớp trong giao dịch phê duyệt. Truy vết: BR-FE07-025; AC-FE07-017. Phụ thuộc: FE07-T029. Hoàn thành khi kiểm thử hoàn tác SQL và trong bộ nhớ đạt.

## 3.2 Tác vụ đối soát v0.5.0

- [x] **FE07-T031 - Thêm kiểm thử RED cho điều kiện hợp lệ chính tắc và sách cha.**
  - Ánh xạ tới: BR-FE07-004, BR-FE07-007, BR-FE07-008, BR-FE07-023, BR-FE07-026; FR-FE07-001, FR-FE07-004, FR-FE07-015, FR-FE07-018, FR-FE07-024, FR-FE07-026; AC-FE07-001, AC-FE07-002, AC-FE07-004, AC-FE07-005, AC-FE07-016, AC-FE07-018.
  - Tệp: `backend/tests/borrowingRoutes.test.js`, `backend/tests/helpers/inMemoryBorrowingRepositories.js`, `backend/tests/sql/borrowingConcurrency.sqltest.js`.
  - Phụ thuộc: SPEC v0.5.0 đã phê duyệt.
  - RED: thêm các ca tạo và phê duyệt cho tài khoản không hoạt động, thành viên chính tắc thiếu/chưa được phê duyệt, sách cha không hoạt động và lượt giữ chỗ đã thông báo thuộc người yêu cầu có sách cha trở nên không hoạt động trước khi phê duyệt.
  - Xác minh RED: `npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/sql/borrowingConcurrency.sqltest.js` chỉ thất bại vì hành vi v0.5.0 còn thiếu.
  - Tiêu chí hoàn thành: mọi nhánh bị chặn giữ nguyên trạng thái yêu cầu, chi tiết, bản sao, đặt trước và audit, đồng thời trả mã an toàn đã phê duyệt.

- [x] **FE07-T032 - Thêm kiểm thử đồng thời RED năm bản sao theo phạm vi thành viên.**
  - Ánh xạ tới: BR-FE07-005; FR-FE07-014, FR-FE07-019; AC-FE07-003, AC-FE07-019; NFR-FE07-TXN-001, NFR-FE07-TXN-003.
  - Tệp: `backend/tests/borrowingRepository.test.js`, `backend/tests/sql/borrowingConcurrency.sqltest.js`.
  - Phụ thuộc: FE07-T031.
  - RED: seed một thành viên có bốn chi tiết mượn đang hoạt động và hai yêu cầu đang chờ, mỗi yêu cầu một bản sao; phê duyệt đồng thời trên các bản sao khác nhau và xác nhận nhiều nhất một yêu cầu thành công, tổng đang hoạt động đã commit là năm.
  - Xác minh RED: kiểm thử mới cho thấy việc tuần tự hóa thành viên hiện còn thiếu/sai trước khi triển khai.
  - Tiêu chí hoàn thành: kiểm thử cũng xác nhận không deadlock, bên thua vẫn `PENDING` và trạng thái bản sao/đặt trước/audit của bên thua không đổi.

- [x] **FE07-T033 - Đối soát điều kiện hợp lệ chính tắc và bảo vệ sách cha.**
  - Ánh xạ tới: BR-FE07-004, BR-FE07-007, BR-FE07-008, BR-FE07-023, BR-FE07-024; FR-FE07-001, FR-FE07-004, FR-FE07-015, FR-FE07-018, FR-FE07-023, FR-FE07-024, FR-FE07-026; AC-FE07-001, AC-FE07-002, AC-FE07-004, AC-FE07-005, AC-FE07-015, AC-FE07-016, AC-FE07-018.
  - Tệp: `backend/src/services/borrowingService.js`, `backend/src/repositories/borrowingRepository.js`, `backend/tests/borrowingRoutes.test.js`, `backend/tests/sql/borrowingConcurrency.sqltest.js`.
  - Phụ thuộc: FE07-T031.
  - GREEN: phân loại điều kiện hợp lệ chỉ từ `Users` đang hoạt động cùng `Members` chính tắc đã phê duyệt; đưa `Books.Status` cha vào lượt đọc tạo và khóa/xác thực lại khi phê duyệt; giữ nguyên khả năng mượn có nhận biết đặt trước.
  - Xác minh: kiểm thử route/SQL tập trung đạt mọi ca điều kiện hợp lệ, sách cha, hàng đợi, chủ giữ chỗ và hoàn tác.
  - Tiêu chí hoàn thành: lịch sử ứng dụng không bao giờ được dùng làm điều kiện thành viên và `BOOK_INACTIVE` không thay đổi trạng thái nào.

- [x] **FE07-T034 - Triển khai khóa phê duyệt ưu tiên thành viên và siêu dữ liệu giao dịch.**
  - Ánh xạ tới: BR-FE07-005, BR-FE07-008 đến BR-FE07-010, BR-FE07-025, BR-FE07-026; FR-FE07-004, FR-FE07-005, FR-FE07-012, FR-FE07-014, FR-FE07-019, FR-FE07-022, FR-FE07-025; AC-FE07-003 đến AC-FE07-005, AC-FE07-017, AC-FE07-019; NFR-FE07-TXN-001, NFR-FE07-TXN-003.
  - Tệp: `backend/src/repositories/borrowingRepository.js`, `backend/src/repositories/auditLogRepository.js`, `backend/tests/borrowingRepository.test.js`, `backend/tests/sql/borrowingConcurrency.sqltest.js`.
  - Phụ thuộc: FE07-T032, FE07-T033.
  - GREEN: lấy khóa SQL Server theo phạm vi thành viên, sau đó khóa `BookCopies`, `BorrowRequests/BorrowDetails` và `Reservations`; tính số đang hoạt động sau khóa; lưu nguyên tử `ApprovedAt`, `ApprovedBy`, `BorrowDate`, hạn trả, trạng thái, hoàn tất đặt trước và audit.
  - Xác minh: kiểm thử SQL đạt cho cùng bản sao, cùng thành viên/bản sao khác, hoàn tất đặt trước, siêu dữ liệu và ca audit thất bại được chèn mà không deadlock.
  - Tiêu chí hoàn thành: `activeBorrowedCount + requestedDetailCount` không bao giờ vượt năm và mọi siêu dữ liệu phê duyệt đều khác null trên bản ghi đã phê duyệt được commit.

- [x] **FE07-T035 - Đối soát chính sách ngày Thành phố Hồ Chí Minh và lý do từ chối.**
  - Ánh xạ tới: BR-FE07-010, BR-FE07-011, BR-FE07-016, BR-FE07-027; FR-FE07-005 đến FR-FE07-007, FR-FE07-021, FR-FE07-027; AC-FE07-004, AC-FE07-006 đến AC-FE07-008, AC-FE07-020, AC-FE07-021; NFR-FE07-LOG-001, NFR-FE07-TIME-001.
  - Tệp: tạo `backend/src/utils/libraryBusinessTime.js`, `backend/src/validators/borrowingValidators.js`, `backend/src/services/borrowingService.js`, `backend/src/repositories/borrowingRepository.js`, `backend/tests/borrowingRoutes.test.js`, `backend/tests/sql/borrowingConcurrency.sqltest.js`.
  - Phụ thuộc: FE07-T034.
  - RED: thêm các ca ngày nghiệp vụ ở biên nửa đêm, từ chối trả tương lai/trước mượn, ngày trả mặc định, ngày mượn/hạn trả +14 và các ca lý do từ chối thiếu/rỗng/501 ký tự.
  - GREEN: suy ra ngày nghiệp vụ trong `Asia/Ho_Chi_Minh`, xác thực phạm vi trả bao gồm hai đầu và lưu lý do từ chối đã cắt khoảng trắng trong giao dịch audit từ chối.
  - Xác minh: kiểm thử route/SQL tập trung đạt và lệnh không hợp lệ giữ nguyên trạng thái yêu cầu/chi tiết/bản sao/audit.
  - Tiêu chí hoàn thành: chỉ cho phép lưu UTC khi chuyển đổi API/ngày nghiệp vụ xác định và có kiểm thử.

- [x] **FE07-T036 - Căn chỉnh schema, mô hình, OpenAPI và siêu dữ liệu truy vết.**
  - Ánh xạ tới: BR-FE07-019, BR-FE07-020, BR-FE07-026, BR-FE07-027; FR-FE07-002, FR-FE07-005, FR-FE07-006, FR-FE07-013, FR-FE07-027; AC-FE07-004, AC-FE07-013, AC-FE07-021.
  - Tệp: `database/Librarymanagement.sql`, `backend/src/models/BorrowRequest.js`, `backend/src/models/BorrowDetail.js`, `backend/src/docs/openapi.yaml`, `backend/tests/borrowingContract.test.js`, `backend/tests/models.test.js`.
  - Phụ thuộc: FE07-T034, FE07-T035.
  - RED: kiểm thử hợp đồng/mô hình xác nhận trường người tạo/người phê duyệt/ngày mượn bắt buộc, ngày trước phê duyệt nullable, enum trạng thái đã lưu, input lý do, mô tả từ chối ngày tương lai và chỉ `OVERDUE` dẫn xuất.
  - GREEN: đối soát siêu dữ liệu với cột đã được phê duyệt; chỉ đổi schema khi có sai lệch được xác minh và cập nhật ADR nếu schema đổi.
  - Xác minh: `npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingContract.test.js tests/models.test.js` đạt.
  - Tiêu chí hoàn thành: không thêm `OVERDUE` đã lưu, hành vi `CANCELLED` mới hoặc ghi phạt FE09.

- [x] **FE07-T037 - Đối soát lỗi frontend v0.5.0 và trạng thái trung thực.**
  - Ánh xạ tới: AC-FE07-002 đến AC-FE07-005, AC-FE07-015 đến AC-FE07-021; NFR-FE07-UX-001.
  - Tệp: `frontend/src/page/borrowing/*`, `frontend/src/api/libraryFeatureApi.js`, `frontend/test/borrowingFrontend.test.js`.
  - Phụ thuộc: FE07-T033 đến FE07-T036.
  - RED: kiểm thử thất bại khi `BOOK_INACTIVE`, `BORROW_LIMIT_EXCEEDED`, `INVALID_RETURN_DATE`, `REJECTION_REASON_REQUIRED`, lỗi cũ/điều kiện hợp lệ hoặc ưu tiên đặt trước thiếu phản hồi có thể hành động trong phạm vi.
  - GREEN: giữ phân giải lỗi riêng FE07 cô lập, yêu cầu lý do từ chối trong UI nhân sự, bỏ ngày trả client khi dùng mặc định máy chủ và làm mới trạng thái máy chủ chính tắc sau thay đổi.
  - Xác minh: `node --test frontend/test/borrowingFrontend.test.js` đạt.
  - Tiêu chí hoàn thành: UI không bao giờ tạo ra thành công phê duyệt/trả hoặc bằng chứng điều kiện hợp lệ giả.

- [~] **FE07-T038 - Chạy cổng xác thực tập trung và rà soát v0.5.0.**
  - Ánh xạ tới: mọi ID BR/FR/AC v0.5.0 mới/đã đối soát và Định nghĩa hoàn thành.
  - Tệp: `.sdd/specs/feat-borrowing-management/TEST_PLAN.md`, `.sdd/specs/feat-borrowing-management/CHANGELOG.md`, triển khai/kiểm thử FE07 đã thay đổi.
  - Phụ thuộc: FE07-T031 đến FE07-T037.
  - Xác minh: kiểm thử route/repository/contract/model tập trung, kiểm thử đồng thời SQL, kiểm thử frontend, `npm.cmd run trace:enforce` và `git diff --check` đạt; bộ đầy đủ chỉ chạy tại cổng merge.
  - Tiêu chí hoàn thành: bằng chứng ghi nhận kết quả mới chính xác tách biệt với kết quả B7 lịch sử và Nhat hoàn tất rà soát của con người trước tích hợp.

## 4. Xác thực lịch sử

- [x] `npm test` trong `backend`.
- [x] `npm.cmd --prefix frontend run lint` đã đạt.
- [x] `npm.cmd --prefix frontend run build` đã đạt.
- [x] Xác minh trình duyệt: bảng, caption, nhãn và điều hướng bàn phím đã được xác minh.
- [x] B6 L2.3 căn chỉnh các trạng thái FE07 đã lưu, siêu dữ liệu SQL và hợp đồng OpenAPI với runtime/đặc tả đã phê duyệt.
- [x] B6 L2.3 thêm kiểm thử mô hình/OpenAPI tập trung và bao phủ bộ lọc mượn thành viên trực tiếp của nhân sự.
- [x] B6 L3 củng cố xử lý đọc lại sau commit, điều kiện hợp lệ phê duyệt trong thời gian giao dịch, tính nguyên tử audit từ chối/gia hạn và xác thực ngày dương lịch nghiêm ngặt.
- [x] B6 L3 thêm hồi quy trong bộ nhớ và bằng chứng SQL trực tiếp cho điều kiện hợp lệ phê duyệt và hoàn tác audit từ chối/gia hạn.
- [x] B6 L4 loại bỏ trạng thái trình duyệt FE07 giả, thêm bảo vệ route hoàn chỉnh, sửa hành vi modal/đáp ứng và xác thực quy trình thành viên/nhân sự thực.
- [x] Khắc phục rà soát độc lập B6: thành viên không rõ `404`, race từ chối `409`, ngày trả do máy chủ sở hữu, UI phê duyệt/trả trung thực, phân vùng khoản mượn đang chờ, focus modal và phân trang di động.
- [x] Cổng tự động cuối B6: frontend 37/37, lint/build, backend 273/273, SQL trực tiếp 14/14 có dọn dẹp, truy vết FE07 22/22 và `git diff --check`.
- [x] Nhat xác nhận rà soát của con người vào 2026-07-14 trước commit, push hoặc merge.

### 4.1 Xác thực v0.5.0 đang chờ

- [x] Kiểm thử route/repository/contract/model mượn tập trung đạt: 66/66.
- [x] Bằng chứng đồng thời SQL trực tiếp chứng minh việc tuần tự hóa năm bản sao cùng thành viên và thứ tự khóa đã phê duyệt là một phần của lượt chạy SQL tổng hợp 61/61.
- [x] Kiểm thử hồi quy frontend v0.5.1 đạt: 18/18.
- [~] Truy vết đạt 28/28; `git diff --check` vẫn là một phần của lần chạy lại kho mã cuối.
- [ ] Nhat xác nhận rà soát con người cho triển khai đối soát.

## 5. Truy vết

| ID đặc tả | Được bao phủ bởi |
| --- | --- |
| BR-FE07-001 | FE07-T01, FE07-T19 |
| BR-FE07-002 | FE07-T03, FE07-T05, FE07-T15, FE07-T16 |
| BR-FE07-003 | FE07-T01, FE07-T06, FE07-T19 |
| BR-FE07-004 | FE07-T03, FE07-T15 |
| BR-FE07-005 | FE07-T03, FE07-T07 |
| BR-FE07-006 | FE07-T03, FE07-T10, FE07-T15, FE07-T18 |
| BR-FE07-007 | FE07-T03, FE07-T15 |
| BR-FE07-009 | FE07-T07, FE07-T16 |
| BR-FE07-011 | FE07-T09, FE07-T17 |
| BR-FE07-012 | FE07-T09, FE07-T17 |
| BR-FE07-013 | FE07-T09, FE07-T17 |
| BR-FE07-014 | FE07-T11, FE07-T17 |
| BR-FE07-015 | FE07-T10, FE07-T18 |
| BR-FE07-017 | FE07-T05, FE07-T16, FE07-T20, FE07-T21 |
| BR-FE07-018 | FE07-T10, FE07-T18 |
| BR-FE07-019 | FE07-T04, FE07-T15 |
| BR-FE07-020 | FE07-T09, FE07-T17 |
| BR-FE07-021 | FE07-T11, FE07-T17 |
| BR-FE07-022 | FE07-T03, FE07-T04, FE07-T15 |
| FR-FE07-003 | FE07-T03, FE07-T15, FE07-T029 |
| FR-FE07-008 | FE07-T09, FE07-T11, FE07-T17 |
| FR-FE07-009 | FE07-T10, FE07-T18 |
| FR-FE07-010 | FE07-T05, FE07-T16 |
| FR-FE07-011 | FE07-T06 |
| FR-FE07-013 | FE07-T09, FE07-T17 |
| FR-FE07-016 | FE07-T03, FE07-T10, FE07-T15, FE07-T18 |
| FR-FE07-017 | FE07-T03, FE07-T15 |
| FR-FE07-020 | FE07-T10, FE07-T18 |
| AC-FE07-001 đến AC-FE07-014 | Ánh xạ trực tiếp tiêu chí chấp nhận-kiểm thử trong Phần 16 SPEC.md |
| FR-FE07-022 | borrowingConcurrency.sqltest.js > Kiểm thử SQL hoàn tác audit thất bại cho tạo/phê duyệt/trả/từ chối/gia hạn |
| BR-FE07-023/024; AC-FE07-015/016 | FE07-T029 |
| BR-FE07-025; AC-FE07-017 | FE07-T030 |

### 5.1 Truy vết đối soát v0.5.0

| ID đặc tả | Tác vụ đã lập kế hoạch |
| --- | --- |
| BR-FE07-004; FR-FE07-015 | FE07-T031, FE07-T033 |
| BR-FE07-005; FR-FE07-014, FR-FE07-019; AC-FE07-003, AC-FE07-019 | FE07-T032, FE07-T034 |
| BR-FE07-007/008/023/024; FR-FE07-018/023/024/026; AC-FE07-005/015/016/018 | FE07-T031, FE07-T033 |
| BR-FE07-009/010/025/026; FR-FE07-005/012/022/025; AC-FE07-004/017 | FE07-T034, FE07-T036 |
| BR-FE07-011/027; FR-FE07-006/007/021/027; AC-FE07-006/007/008/020/021 | FE07-T035, FE07-T036, FE07-T037 |
| NFR-FE07-TXN-001/003 | FE07-T032, FE07-T034 |
| NFR-FE07-TIME-001 | FE07-T035 |
| NFR-FE07-UX-001 | FE07-T037 |
| BR-FE07-028; FR-FE07-028; AC-FE07-022 | FE07-T039, FE07-T040 |
| BR-FE07-029; FR-FE07-029; AC-FE07-023 | FE07-T041 |
| FR-FE07-033; AC-FE07-027 | FE07-T048 |

### 5.2 Tác vụ hợp đồng lịch sử v0.5.1

- [x] **FE07-T039 - Chuẩn hóa hợp đồng lịch sử mượn trong tài liệu.**
  - Ánh xạ tới: BR-FE07-028, FR-FE07-028, AC-FE07-022, Q-FE07-009, NFR-FE07-PERF-003.
  - Tiêu chí hoàn thành: cả endpoint lịch sử thành viên và nhân sự chia sẻ bộ lọc, ngữ nghĩa ngày, mặc định, giới hạn, thứ tự xác thực và thứ tự ổn định chính xác; các tệp triển khai không đổi.
  - Trạng thái rà soát: tài liệu hoàn tất và Nhat đã xác nhận rà soát của con người vào 2026-07-17.

- [x] **FE07-T040 - Căn chỉnh triển khai lịch sử và kiểm thử tập trung.**
  - Ánh xạ tới: BR-FE07-028, FR-FE07-028, AC-FE07-022.
  - Tiêu chí hoàn thành: giá trị không hợp lệ thất bại trước truy vấn, phạm vi thành viên được thực thi, phân trang mặc định/biên và bộ lọc ngày bao gồm hai đầu đạt, thứ tự ổn định được bao phủ cho endpoint thành viên và nhân sự.
  - Bằng chứng: `/me` hiện dùng bộ lọc trạng thái chi tiết và trả `{ borrowings, pagination }`; trang thành viên gửi `status/page/limit` máy chủ chính tắc, loại bỏ cắt trang phía client và ánh xạ hàng chi tiết. Backend tập trung 66/66 và frontend 18/18 đạt.

- [x] **FE07-T041 - Hiển thị đúng yêu cầu mượn bị từ chối trong lịch sử thành viên.**
  - Ánh xạ tới: BR-FE07-029, FR-FE07-029, AC-FE07-023.
  - RED: từ chối yêu cầu thành viên, tải lại `/api/borrow-requests/me` và chứng minh phản hồi thiếu `requestStatus = REJECTED`; chứng minh frontend ánh xạ hàng thành `Pending`.
  - GREEN: công khai `requestStatus` trong mô hình đọc SQL/trong bộ nhớ và chỉ ưu tiên nó để hiển thị lịch sử thành viên bị từ chối.
  - Xác minh: kiểm thử route/hợp đồng backend tập trung, kiểm thử mượn frontend, lint/build, truy vết và vệ sinh diff đạt.
  - Bằng chứng: backend tập trung 61/61, frontend FE07 21/21, backend đầy đủ 925/925, frontend đầy đủ 199/199, lint frontend, build production, truy vết FE07 29/29 và `git diff --check` đã đạt vào 2026-07-22.
  - Trạng thái rà soát: xác minh triển khai và rà soát của con người hoàn tất vào 2026-07-22; tập tệp chính xác đã rà soát được phép commit.

## 6. Vẫn ngoài lát cắt này

- Tạo khoản phạt FE09.
- Worker giao hàng FE10.
- `OVERDUE` đã lưu, hủy yêu cầu mượn và xử lý hàng đợi đặt trước tự động.

## 7. Hoàn tất tích hợp và rà soát B7

- [x] Nhat xác nhận cổng rà soát của con người trước tích hợp.
- [x] Commit triển khai `3a7b0ad1165607b8912c6c0be5f3ef2025c11b55` được push trên `feat/fe07-validation`.
- [x] PR #19 đã merge vào `main` thành `aeed0dfecb764e6cbe63d7074727f318700e59ea`.
- [x] Lượt chạy GitHub Actions CI `29308540692` đã đạt cho commit merge và bao phủ truy vết, kiểm thử backend, lint/kiểm thử/build frontend và import health backend.
- [x] Bằng chứng chi tiết được ghi tại `.sdd/reviews/fe07-b7-integration-review-closeout-2026-07-14.md`.

Đợt hoàn tất này vẫn là bằng chứng lịch sử cho mốc cơ sở đã phê duyệt trước đó. Nó không đánh dấu FE07-T031 đến FE07-T038 hoàn thành.

## 2026-07-22 - Batch hiệu chỉnh

- [x] Ổn định bố cục Xử lý trả trong khi giữ lệnh trả và hành vi chọn chính tắc.
- [x] Làm cho từng hành động hàng `Xử lý trả` mở xác nhận trả chính tắc cho chính xác khoản mượn đó.
- [x] Gắn hộp thoại phê duyệt/từ chối với mục tiêu yêu cầu rõ ràng và thêm tương thích schema BorrowRequests đã triển khai.
- [x] **FE07-T042 - Bổ sung quyết định nhân sự và ổn định input từ chối.**
  - Ánh xạ tới: BR-FE07-030, FR-FE07-030, AC-FE07-024, NFR-FE07-UX-004.
  - Tệp: `frontend/src/page/borrowing/BorrowRequestsAdminPage.jsx`, `frontend/src/component/shared/Feedback.jsx`, `frontend/src/styles/app-shell.css`, `frontend/test/borrowingFrontend.test.js`.
  - RED: yêu cầu cả hai hộp thoại quyết định hiển thị ngữ cảnh yêu cầu/thành viên/mọi bản sao chính tắc và yêu cầu quản lý focus modal dùng chung tồn tại qua các lần controlled-input render lại.
  - GREEN: tái sử dụng `RequestReviewSummary`, mở rộng/xếp chồng đáp ứng hộp thoại, cung cấp trợ giúp có thể tiếp cận cho textarea từ chối và giữ callback đóng mới nhất trong ref.
  - Theo dõi: loại bỏ banner khả dụng chung dư thừa và trường view-model tổng hợp không dùng; các trạng thái bản sao chính tắc riêng vẫn hiển thị và máy chủ vẫn xác thực lại khi phê duyệt.
  - Ranh giới: không đổi API/schema/vai trò/giao dịch; Thủ thư/Quản trị viên giữ các lệnh FE07 chính tắc như cũ.
- [~] **FE07-T043 - Xác minh và rà soát con người hiệu chỉnh v0.7.3.**
  - Ánh xạ tới: AC-FE07-024, AC-FE07-025 và các cổng kế hoạch v0.7.3.
  - Bằng chứng: frontend tập trung 24/24, frontend đầy đủ 201/201, backend FE07 66/66, tích hợp Quản trị/vai trò 25/25, Chromium E2E 4/4, lint/build frontend, truy vết FE07 31/31 và `git diff --check` đạt.
  - Cổng còn lại: rà soát của con người cho diff v0.7.3 hoàn chỉnh.
- [x] **FE07-T044 - Loại bỏ thông báo trả bình thường dư thừa.**
  - Ánh xạ tới: NFR-FE07-UX-005.
  - Loại banner khẳng định `Không có dấu hiệu...` cho lượt trả `NORMAL` đúng hạn trong khi vẫn giữ cảnh báo rà soát phạt cho kết quả quá hạn, hỏng hoặc mất.
  - Giữ nguyên lệnh trả chính tắc, chọn tình trạng, phản hồi ứng viên phạt và ranh giới sở hữu FE09.
- [x] **FE07-T045 - Đối soát thông tin trạng thái đến hạn của Xử lý trả.**
  - Ánh xạ tới: FR-FE07-031, AC-FE07-025, BR-FE07-011, NFR-FE07-TIME-001.
  - Giữ `BorrowDate`, `DueDate` và `RenewalCount` từ phản hồi chi tiết chính tắc.
  - Suy ra `Còn N ngày`, `Đến hạn hôm nay` hoặc `Quá hạn N ngày` từ ngày nghiệp vụ `Asia/Ho_Chi_Minh` và thay cách trình bày mơ hồ `Quá hạn: Đúng hạn`.
  - Giữ hợp đồng thay đổi trả/rà soát phạt không đổi.

- [~] **FE07-T046 - Làm kiểm tra thời gian nghiệp vụ và trạng thái trả có tính xác định.**
  - Ánh xạ tới: BR-FE07-011, BR-FE07-014, BR-FE07-018, FR-FE07-007/020/021, AC-FE07-006/008/010, NFR-FE07-TIME-001.
  - RED: dưới `TZ=UTC`, lượt trả theo ngày Việt Nam vượt qua ngày quá hạn kỳ vọng; chi tiết có bản sao vật lý không phải `BORROWED` phải trả `BORROW_STATE_CONFLICT`.
  - GREEN: trả/gia hạn dùng `libraryBusinessTime`; double trong bộ nhớ và SQL chia sẻ bất biến bản sao vật lý; kỳ vọng SQL dùng điều kiện hợp lệ vai trò `MEMBER` hiện tại và kết quả xung đột rõ ràng.
  - Xác minh: kiểm thử FE07 tập trung đạt dưới `TZ=UTC`; SQL dùng một lần và hồi quy đầy đủ đạt. H2 ban đầu và phụ lục H2 đã đạt; commit `97aca62` và lượt chạy PR CI `30014066260` đã đạt. H2 mới sau đó phê duyệt commit khắc phục `b931e00`, và lượt chạy PR CI `30019439505` đã đạt. Rà soát H3 lặp lại trả về phát hiện về tính hoàn chỉnh vòng hai có phạm vi giới hạn. H2 mới phê duyệt gói vòng hai vào 2026-07-23 và cho phép commit/push đã rà soát; PR CI đã cập nhật và H3 lặp lại vẫn bắt buộc trước merge.

## 2026-07-27 - Mốc cơ sở tự phục vụ thành viên một vai trò

- [x] **FE07-T047 - Thực thi truy cập một vai trò cho các luồng mượn của thành viên.**
  - Ánh xạ tới: BR-FE07-031, FR-FE07-032, AC-FE07-026; BR-FE11-028.
  - Thay bảo vệ thành viên-bất-kỳ-vai-trò tại route ứng viên/tạo/lịch sử riêng bằng bảo vệ thành viên không phải nhân sự dùng chung.
  - Chuyển hướng mảng vai trò cũ/không hợp lệ chứa cả Member và nhân sự khỏi route frontend thành viên trong khi giữ route vận hành nhân sự.
  - Xác minh các ca mảng tương thích phòng thủ `MEMBER + LIBRARIAN` và `MEMBER + ADMIN` mà không coi chúng là tài khoản đã lưu được hỗ trợ.

- [x] **FE07-T048 - Chọn trước chính xác bản sao FE08 được giữ thuộc người yêu cầu.**
  - Ánh xạ tới: FR-FE07-024/033, AC-FE07-016/027; FR-FE08-033, AC-FE08-020.
  - Đọc bàn giao `bookId`/`copyId` của FE08 và chỉ chọn chính xác bản sao từ phản hồi ứng viên mượn Thành viên chính tắc.
  - Giữ tạo yêu cầu đang chờ bình thường, xác thực lại máy chủ, phê duyệt Thủ thư/Quản trị viên và hoàn tất đặt trước nguyên tử.

## 2026-07-27 - Batch tích hợp căn chỉnh quy tắc v0.7.7

- [x] **FE07-T052 - Loại bỏ kịch bản gia hạn đa vai trò đã bị thay thế.**
  - Ánh xạ tới: DEC-GEN-005, BD-007, BR-FE07-003/031, FR-FE07-009/032, AC-FE07-009/026.
  - Quyết định: mọi tài khoản có chính xác một vai trò; kịch bản gia hạn đa vai trò trước đây không phải ca nghiệp vụ được hỗ trợ.
  - Đối soát: giữ gia hạn chỉ chủ sở hữu Thành viên và gia hạn liên thành viên của Thủ thư/Quản trị viên bằng actor một vai trò riêng; loại kiểm thử đa vai trò cục bộ nhánh và delta ủy quyền không cần thiết.
  - Tệp: `backend/tests/borrowingRoutes.test.js`, `backend/src/services/borrowingService.js`.
  - Bằng chứng: chọn bất biến một vai trò/FE11 đạt 3/3 trước dọn dẹp và 3/3 sau dọn dẹp; xác minh route/repository FE07 đầy đủ đạt 79/79.
- [x] **FE07-T049 - Trả về snapshot giao dịch có thẩm quyền.**
  - Ánh xạ tới: BD-002, BR-FE07-014/016, FR-FE07-007/008, AC-FE07-008.
  - RED: thay đổi hạn trả giữa preflight và khóa repository tạo dữ liệu quá hạn phản hồi/audit cũ.
  - GREEN: repository trả SQL và trong bộ nhớ xây bằng chứng audit từ hạn trả đã khóa và ngày trả đã commit; service xây `fineCandidate` từ cùng bằng chứng đó.
  - Tệp: `backend/tests/borrowingRoutes.test.js`, `backend/tests/borrowingRepository.test.js`, `backend/src/services/borrowingService.js`, `backend/src/repositories/borrowingRepository.js`, `backend/tests/helpers/inMemoryBorrowingRepositories.js`.
  - Bằng chứng: RED trả 12 thay vì 2 ngày quá hạn và thất bại hợp đồng nguồn repository; GREEN FE07 tập trung và đầy đủ đạt. SQL thay đổi không chạy vì không cấu hình DB dùng một lần có tên hoặc cờ thay đổi.
- [x] **FE07-T050 - Dùng phép tính lịch gia hạn dùng chung.**
  - Ánh xạ tới: BD-003, BR-FE07-015/018, FR-FE07-009/020, NFR-FE07-TIME-001.
  - RED: cùng một hạn trả kéo dài khác nhau dưới `TZ=UTC` và `TZ=America/New_York`.
  - GREEN: phần mở rộng service và mọi so sánh gia hạn-quá hạn dùng helper `libraryBusinessTime`; không còn `setDate`, `getDate` hoặc `setHours` cục bộ máy chủ trong đường gia hạn bị ảnh hưởng.
  - Tệp: `backend/tests/borrowingRoutes.test.js`, `backend/src/services/borrowingService.js`, `backend/src/repositories/borrowingRepository.js`, `backend/tests/helpers/inMemoryBorrowingRepositories.js`.
  - Bằng chứng: RED tạo `2026-03-21` tại New York thay vì `2026-03-22`; cả ma trận UTC và New York hiện đạt.
- [x] **FE07-T051 - Hoàn tất xác minh và bằng chứng FE07.**
  - Ánh xạ tới: AT-001, AT-002, AT-003 và các cổng kế hoạch v0.7.6.
  - Bằng chứng: kiểm thử route/repository tập trung, ma trận múi giờ UTC/New York,
    hồi quy backend đầy đủ, truy vết, vệ sinh diff, rà soát L2/L3 và
    chấp nhận runtime cục bộ; SQL thay đổi tùy chọn được ghi riêng.
  - Bằng chứng tích hợp cuối với merge `e20fdc3` đang mở: mốc cơ sở một vai trò
    3/3; 7 bộ tập trung/281 kiểm thử; route/repository FE07 79/79;
    cả hai ma trận múi giờ 3/3; lượt chạy bao phủ backend 61 bộ/1,047 kiểm thử
    vượt mọi ngưỡng 80%; frontend 231/231 cùng lint/build; truy vết
    và vệ sinh diff; Chromium 2/2.
  - Ranh giới SQL: SQL thay đổi tùy chọn không chạy vì `DB_NAME` và `FE07_SQL_TEST_ALLOW_MUTATION` chưa được đặt; không có khẳng định thay đổi SQL thực.
  - Cổng tích hợp: phụ lục H2 sản phẩm phê duyệt commit `f346ae0` và lượt chạy PR
    CI `30244750250` đã đạt. Khắc phục chỉ tài liệu H3 yêu cầu H2 mới và H3 lặp lại trước merge.

## 2026-07-27 - Hiệu chỉnh yêu cầu bản sao đang chờ v0.8.0

- [~] **FE07-T053 - Thực thi một yêu cầu đang chờ trên mỗi bản sao xuyên vai trò.**
  - Ánh xạ tới: BR-FE07-033, FR-FE07-034/035, AC-FE07-028/029; ranh giới yêu cầu đang chờ FE06; cấu thành Quản trị FE11.
  - Backend: SQL ứng viên loại yêu cầu đang hoạt động; giao dịch tạo khóa và
    từ chối yêu cầu xung đột bằng `COPY_PENDING_REQUEST_CONFLICT`; FE06
    trạng thái/ngừng kích hoạt từ chối `PENDING_BORROW_REQUEST_CONFLICT`.
  - Frontend: chi tiết Quản trị hiển thị trạng thái bản sao vật lý; lỗi quyết định
    của Quản trị và Thủ thư tải lại trạng thái chính tắc; trợ giúp từ chối giải thích
    lý do bắt buộc và giải phóng yêu cầu.
  - Bằng chứng: backend tập trung 123/123 và frontend tập trung 36/36; backend đầy đủ
    1,056/1,056; frontend đầy đủ 232/232; lint/build frontend; truy vết và
    vệ sinh diff đạt cục bộ.
  - Còn lại: rà soát của con người.

## 2026-07-27 - Hiệu chỉnh quy trình cùng tiêu đề v0.8.1

- [~] **FE07-T054 - Thực thi một quy trình mượn đang hoạt động cho mỗi Thành viên/tiêu đề.**
  - Ánh xạ tới: BR-FE07-034, FR-FE07-036/037, AC-FE07-030; bảo vệ vòng đời FE11.
  - Đường ứng viên và tạo dùng `BookId`; tạo/phê duyệt xác thực lại dưới khóa giao dịch theo phạm vi thành viên.
  - Yêu cầu cũ không hợp lệ vẫn có thể bị từ chối và hiện công khai xung đột phê duyệt riêng biệt về chủ sở hữu,
    tài khoản, bản sao và cùng tiêu đề.
  - Hồi quy backend/frontend tự động là bắt buộc; rà soát của con người vẫn còn.

- [~] **FE07-T055 - Đưa danh mục lưu hành Quản trị vừa khung nhìn desktop.**
  - Ánh xạ tới: FR-FE07-038, AC-FE07-031.
  - Loại các cột ID yêu cầu và mã vạch riêng khỏi danh mục lưu hành Quản trị và projection danh mục DOCX mà không xóa trường API/cơ sở dữ liệu chính tắc nào.
  - Giữ ID chi tiết mượn làm mã định danh vận hành hiển thị, căn chỉnh mọi header còn lại với giá trị hàng của nó và bọc nội dung thành viên/sách dài trong ô bố cục cố định.
  - Xác minh kiểm thử frontend Quản trị tập trung, lint/build và vệ sinh diff; rà soát của con người vẫn bắt buộc.

- [~] **FE07-T056 - Kết nối lựa chọn trả quá hạn với tạo khoản phạt FE09.**
  - Ánh xạ tới: FR-FE07-039, AC-FE07-032; FR-FE09-020, AC-FE09-018.
  - Chỉ hiển thị `Tạo phiếu phạt` cho khoản mượn đang hoạt động đã chọn có hạn trả chính tắc quá hạn trong `Asia/Ho_Chi_Minh`.
  - Gọi tính toán FE09 chỉ với `borrowDetailId`; giữ ngày, số tiền, ngăn trùng lặp, vai trò và hành vi trạng thái kết thúc do máy chủ sở hữu.
  - Xác minh kiểm thử frontend FE07/FE09 tập trung, kiểm thử frontend đầy đủ, lint/build, truy vết và vệ sinh diff; rà soát của con người vẫn bắt buộc.
