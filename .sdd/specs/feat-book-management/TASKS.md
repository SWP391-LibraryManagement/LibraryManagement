# TASKS.md - Quản lý sách FE05

Trạng thái: ĐÃ HOÀN TẤT - ĐÃ GHI NHẬN BẰNG CHỨNG CHỐT GIAI ĐOẠN 2
Implementation State: COMPLETE

Chủ sở hữu: Dung

Cập nhật: 2026-07-19

Trạng thái quy trình: đã hoàn tất cho phạm vi Giai đoạn 2 đã phê duyệt; H3, merge và CI `main` chính xác sau merge được ghi tại `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`. Các phát biểu cổng đang chờ/mở bên dưới là snapshot thực thi lịch sử đã được bằng chứng đó thay thế.

---

## Quy tắc nhiệm vụ

- Thực hiện nhiệm vụ theo thứ tự số và bắt đầu mỗi nhiệm vụ hành vi bằng các kiểm thử RED được nêu.
- Không đánh dấu nhiệm vụ hoàn tất chỉ vì mã prototype tồn tại.
- FE05 có thể đọc `BookCopies` để xác định khả dụng nhưng không bao giờ được ghi trạng thái bản sao.
- Mutation sách hiện có yêu cầu phiên bản được bên gọi thấy gần nhất; không âm thầm chuẩn hóa query hoặc trường không hợp lệ.
- Thêm tag `@spec` vào các tệp triển khai đã thay đổi cho ID FR/BR được ánh xạ.

## Các nhiệm vụ theo thứ tự

- [x] **FE05-T001 - Thêm kiểm thử RED cho hợp đồng route, repository, SQL và frontend.**
  - Ánh xạ tới: BR-FE05-001 đến BR-FE05-018; FR-FE05-001 đến FR-FE05-026; AC-FE05-001 đến AC-FE05-017.
  - Tệp: tạo `backend/tests/bookRoutes.test.js`, tạo `backend/tests/helpers/inMemoryBookRepositories.js`, `backend/tests/bookAvailabilityRepository.test.js`, tạo `backend/tests/sql/bookConcurrency.sqltest.js`, `frontend/test/bookManagementFrontend.test.js`.
  - Phụ thuộc: không có.
  - RED: bao phủ hiển thị công khai/nhân viên, loại ISBN công khai/tìm kiếm tiêu đề-tác giả, hiển thị/tìm kiếm ISBN nhân viên, chính sách query, xác thực metadata, RBAC, khả dụng suy ra, mutation bản sao bị cấm, `If-Match` hiện tại/cũ/thiếu, xác thực lý do, chuyển đổi chỉ trạng thái và rollback audit.
  - Xác minh RED: các lệnh tập trung chỉ thất bại ở hành vi v0.5.0 còn thiếu, bao gồm kỳ vọng prototype `/availability` hiện tại.
  - DoD: mọi AC có assertion, còn kiểm thử đồng thời/rollback kiểm tra trạng thái sách, bản sao, quy trình và audit không đổi.

- [x] **FE05-T002 - Thêm SQL rowversion và ghi nhận hợp đồng dữ liệu.**
  - Ánh xạ tới: BR-FE05-005, BR-FE05-014 đến BR-FE05-016; FR-FE05-011, FR-FE05-018, FR-FE05-022, FR-FE05-023; AC-FE05-006, AC-FE05-010, AC-FE05-013, AC-FE05-014; NFR-FE05-TXN-001/002.
  - Tệp: `database/Librarymanagement.sql`, `.sdd/rfcs/ADR-002-database-design.md`, `backend/src/models/Book.js`, `backend/src/docs/openapi.yaml`.
  - Phụ thuộc: FE05-T001.
  - GREEN: thêm SQL `rowversion` cho `Books`, giữ unique index ISBN đã lọc, xác định encoding phiên bản opaque và ghi nhận header/response mutation.
  - Xác minh: kiểm thử schema smoke/SQL có thể tạo, đọc và so sánh phiên bản sách mà không thay đổi hàng bản sao.
  - DoD: không giới thiệu cột khả dụng do FE05 sở hữu hoặc đường xóa vật lý.

- [x] **FE05-T003 - Triển khai validator xác định và topology route.**
  - Ánh xạ tới: BR-FE05-001 đến BR-FE05-007, BR-FE05-016 đến BR-FE05-018; FR-FE05-001 đến FR-FE05-017, FR-FE05-023 đến FR-FE05-026; AC-FE05-001 đến AC-FE05-009, AC-FE05-014 đến AC-FE05-017; NFR-FE05-SEC-001 đến NFR-FE05-SEC-005.
  - Tệp: `backend/src/app.js`, `backend/src/routes/bookRoutes.js`, `backend/src/controllers/bookController.js`, tạo `backend/src/validators/bookValidators.js`, `backend/src/docs/openapi.yaml`.
  - Phụ thuộc: FE05-T001, FE05-T002.
  - GREEN: mở các route công khai/quản trị đã phê duyệt; xác thực ID, keyword 1..200, page/limit, sort/order, tiêu đề, ISBN, tham chiếu, năm, số trang, đánh giá, URL/path, `If-Match` và lý do.
  - Xác minh: kiểm thử route tạo response `400`, `401`, `403`, `404` và `409` xác định không chứa stack trace.
  - DoD: giá trị không hợp lệ được gửi bị từ chối, không bị clamp, ép sang chính sách khác hoặc bỏ qua.

- [x] **FE05-T004 - Đối soát thao tác đọc công khai/nhân viên và khả dụng suy ra.**
  - Ánh xạ tới: BR-FE05-001, BR-FE05-008, BR-FE05-009, BR-FE05-011 đến BR-FE05-013, BR-FE05-017; FR-FE05-001 đến FR-FE05-004, FR-FE05-009, FR-FE05-010, FR-FE05-014, FR-FE05-017, FR-FE05-019, FR-FE05-020, FR-FE05-024; AC-FE05-001 đến AC-FE05-004, AC-FE05-011, AC-FE05-015; NFR-FE05-PERF-001/002.
  - Tệp: `backend/src/services/bookService.js`, `backend/src/repositories/bookRepository.js`, `backend/tests/bookRoutes.test.js`, `backend/tests/bookAvailabilityRepository.test.js`.
  - Phụ thuộc: FE05-T003.
  - GREEN: thao tác đọc công khai ẩn sách không hoạt động, loại ISBN và chỉ khớp q với tiêu đề/tác giả; thao tác đọc nhân viên giữ ISBN/trạng thái/phiên bản và tìm kiếm ISBN; khả dụng là `AVAILABLE` chỉ với sách đang hoạt động có ít nhất một bản sao khả dụng, ngược lại là `UNAVAILABLE`.
  - Xác minh: kiểm thử route/repository tập trung vượt qua filter, sắp xếp/phân trang ổn định, chi tiết công khai `404`, chi tiết không hoạt động của nhân viên và mọi phép tổng hợp trạng thái bản sao.
  - DoD: không đường đọc nào ghi hoặc cache trạng thái khả dụng do FE05 sở hữu.

- [x] **FE05-T005 - Đối soát create nguyên tử và cập nhật metadata.**
  - Ánh xạ tới: BR-FE05-002, BR-FE05-003, BR-FE05-005 đến BR-FE05-007, BR-FE05-010, BR-FE05-016; FR-FE05-005 đến FR-FE05-007, FR-FE05-011 đến FR-FE05-016, FR-FE05-018, FR-FE05-023, FR-FE05-026; AC-FE05-005 đến AC-FE05-007, AC-FE05-009, AC-FE05-010, AC-FE05-014, AC-FE05-017.
  - Tệp: `backend/src/services/bookService.js`, `backend/src/repositories/bookRepository.js`, `backend/src/repositories/auditLogRepository.js`, `backend/tests/bookRoutes.test.js`, `backend/tests/sql/bookConcurrency.sqltest.js`.
  - Phụ thuộc: FE05-T002 đến FE05-T004.
  - GREEN: create bắt đầu `ACTIVE`; cập nhật metadata loại trường trạng thái/bản sao; ISBN duy nhất, tham chiếu, giới hạn trường, so sánh phiên bản, mutation và audit dùng một transaction.
  - Xác minh: kiểm thử route và SQL tập trung vượt qua happy path, xác thực, trùng lặp, ghi cũ và rollback khi audit thất bại.
  - DoD: cập nhật trả về phiên bản đã tăng và không bao giờ thay `Books.Status` hoặc hàng `BookCopies` nào.

- [x] **FE05-T006 - Triển khai hủy kích hoạt/kích hoạt lại và loại quyền sở hữu mutation bản sao.**
  - Ánh xạ tới: BR-FE05-004, BR-FE05-008 đến BR-FE05-010, BR-FE05-012, BR-FE05-014 đến BR-FE05-016, BR-FE05-018; FR-FE05-008, FR-FE05-014, FR-FE05-015, FR-FE05-018, FR-FE05-019, FR-FE05-021 đến FR-FE05-025; AC-FE05-008 đến AC-FE05-010, AC-FE05-012 đến AC-FE05-016.
  - Tệp: `backend/src/routes/bookRoutes.js`, `backend/src/controllers/bookController.js`, `backend/src/services/bookService.js`, `backend/src/repositories/bookRepository.js`, `backend/tests/bookRoutes.test.js`, `backend/tests/sql/bookConcurrency.sqltest.js`, `backend/src/docs/openapi.yaml`.
  - Phụ thuộc: FE05-T005.
  - RED: kiểm thử từ chối phiên bản thiếu/cũ, lý do thiếu/quá dài, chuyển đổi không hợp lệ và mọi lệnh trạng thái bản sao `/availability`.
  - GREEN: hủy kích hoạt/kích hoạt lại chỉ thay `Books.Status`, ghi audit nguyên tử, giữ mọi bản ghi liên quan và trả về phiên bản mới.
  - Xác minh: kiểm thử route/SQL so sánh trạng thái sách, bản sao, lượt mượn, đặt chỗ và audit trước/sau mỗi lệnh.
  - DoD: route `/availability` cùng phương thức controller/service/repository `updateBookAvailability` bị loại; lời gọi nhận response `404` an toàn tiêu chuẩn và không đổi trạng thái.

- [x] **FE05-T007 - Đối soát frontend quản lý sách.**
  - Ánh xạ tới: AC-FE05-003, AC-FE05-004, AC-FE05-007, AC-FE05-008, AC-FE05-011 đến AC-FE05-017; NFR-FE05-UX-001/002.
  - Tệp: `frontend/src/page/BookManagement.jsx`, `frontend/src/api/libraryFeatureApi.js`, `frontend/test/bookManagementFrontend.test.js`.
  - Phụ thuộc: FE05-T003 đến FE05-T006.
  - RED: kiểm thử thất bại khi trang gửi trạng thái bản sao, gọi `/availability`, gắn mọi sách không khả dụng là đã mượn, bỏ `If-Match` hoặc thiếu lý do/xác nhận.
  - GREEN: sử dụng response công khai/quản trị, giữ phiên bản thấy gần nhất, gửi cập nhật chỉ metadata, triển khai xác nhận hủy kích hoạt/kích hoạt lại cùng lý do và kết xuất `Không khả dụng` cho trạng thái không khả dụng suy ra.
  - Xác minh: `node --test frontend/test/bookManagementFrontend.test.js` vượt qua.
  - DoD: mọi mutation tải lại trạng thái server chuẩn và conflict ghi cũ hướng dẫn nhân viên tải lại trước khi thử lại.

- [x] **FE05-T008 - Chốt bằng chứng traceability và xác thực.**
  - Ánh xạ tới: mọi ID BR/FR/AC FE05 và Định nghĩa hoàn tất.
  - Tệp: phần triển khai/kiểm thử FE05 đã thay đổi, `.sdd/specs/feat-book-management/TEST_PLAN.md`, `.sdd/specs/feat-book-management/CHANGELOG.md`.
  - Phụ thuộc: FE05-T001 đến FE05-T007.
  - Xác minh: backend, SQL, frontend tập trung, `npm.cmd run trace:enforce` và `git diff --check` vượt qua; toàn bộ suite chỉ chạy ở cổng merge.
  - DoD: bằng chứng được ghi nêu kết quả chính xác và không dùng lại kết quả kiểm thử prototype/lịch sử cho hành vi v0.5.0 chưa xác minh.

## Độ bao phủ yêu cầu–nhiệm vụ

| ID yêu cầu | Nhiệm vụ dự kiến |
| --- | --- |
| BR-FE05-001 đến BR-FE05-007 | FE05-T003, FE05-T004, FE05-T005 |
| BR-FE05-008 đến BR-FE05-013 | FE05-T004, FE05-T006 |
| BR-FE05-014 đến BR-FE05-018 | FE05-T002, FE05-T003, FE05-T005, FE05-T006 |
| BR-FE05-019, BR-FE05-020 | FE05-T009 |
| BR-FE05-021 | FE05-T012 |
| BR-FE05-022 | FE05-T013, FE05-T014, FE05-T015 |
| FR-FE05-001 đến FR-FE05-004 | FE05-T003, FE05-T004 |
| FR-FE05-005 đến FR-FE05-010 | FE05-T004, FE05-T005, FE05-T006 |
| FR-FE05-011 đến FR-FE05-017 | FE05-T003, FE05-T005 |
| FR-FE05-018 đến FR-FE05-021 | FE05-T004, FE05-T005, FE05-T006 |
| FR-FE05-022 đến FR-FE05-026 | FE05-T002, FE05-T003, FE05-T005, FE05-T006 |
| FR-FE05-027, FR-FE05-028 | FE05-T009 |
| FR-FE05-029 | FE05-T011 |
| FR-FE05-030 | FE05-T012 |
| FR-FE05-031 | FE05-T013, FE05-T014, FE05-T015 |
| AC-FE05-001 đến AC-FE05-004 | FE05-T004 |
| AC-FE05-005 đến AC-FE05-007 | FE05-T005 |
| AC-FE05-008 đến AC-FE05-010 | FE05-T005, FE05-T006 |
| AC-FE05-011, AC-FE05-012 | FE05-T004, FE05-T006 |
| AC-FE05-013 đến AC-FE05-017 | FE05-T002, FE05-T003, FE05-T006, FE05-T007 |
| AC-FE05-018, AC-FE05-019 | FE05-T009 |
| AC-FE05-020 | FE05-T011 |
| AC-FE05-021 | FE05-T012 |
| AC-FE05-022 | FE05-T013, FE05-T014, FE05-T015 |

## Cổng hoàn tất

- [~] FE05-T001 đến FE05-T008 hoàn tất ở phía agent; rà soát integration thủ công độc lập vẫn mở.
- [x] Backend tập trung 45/45, SQL 7/7, frontend 6/6, traceability 26/26 và kiểm tra diff vượt qua.
- [ ] Toàn bộ suite cổng merge vượt qua khi nhánh triển khai sẵn sàng.
- [ ] Chủ sở hữu FE06 xác nhận FE05 không thực hiện mutation trạng thái bản sao.
- [ ] Dung xác nhận hành vi UX endpoint công khai/nhân viên và ghi cũ.
## batch khắc phục 2026-07-22

- [x] Kết nối tìm kiếm nhân viên và filter bản nháp với cùng danh sách sách Admin có phân trang và thêm độ bao phủ hồi quy.
- [x] Loại rating khỏi bề mặt danh sách, chi tiết, create và update sách của Thủ thư/Quản trị viên mà không mở rộng hợp đồng API.
- [x] Loại input lý do/xác nhận trạng thái trong khi giữ lý do audit được tạo và chốt bảo vệ `If-Match`.
- [x] Thêm metadata compatibility migration có thể rà soát cho cơ sở dữ liệu đã triển khai.
- [x] Hiển thị trạng thái catalog trong biểu mẫu cập nhật Thủ thư trong khi giữ lệnh trạng thái riêng, lý do audit được tạo và chốt bảo vệ `If-Match`.
- [x] **FE05-T009 - Thay URL ảnh bìa có thể chỉnh sửa bằng tải tệp được quản lý.**
  - Ánh xạ tới: BR-FE05-019/020, FR-FE05-027/028, AC-FE05-018/019, NFR-FE05-SEC-006, NFR-FE05-TXN-003, NFR-FE05-UX-003.
  - RED: yêu cầu create multipart, từ chối signature không hợp lệ, dọn dẹp thay thế cũ, an toàn xóa đường dẫn được quản lý và hành vi frontend bộ chọn tệp/preview.
  - GREEN: phân tích input metadata/cover multipart đã xác thực, xác thực và lưu ảnh được quản lý, bù trừ mutation thất bại, phục vụ thư mục ảnh bìa, phân giải đường dẫn asset backend và thay cả hai input văn bản URL.
  - Ranh giới: không thay đổi schema SQL; `Books.CoverUrl`, rowversion/`If-Match`, tính nguyên tử sách/audit, thao tác đọc an toàn công khai và quyền sở hữu bản sao FE06 không thay đổi.
- [~] **FE05-T010 - Xác thực và rà soát thủ công v0.6.1.**
  - Bằng chứng tự động tập trung phải bao phủ route/storage backend, hợp đồng frontend, lint/build, OpenAPI, traceability và vệ sinh diff.
  - Bằng chứng: backend FE05 tập trung 58/58, frontend FE05 tập trung 10/10, toàn bộ frontend 215/215, lint/build frontend, traceability FE05 30/30 (100%) và `git diff --check` vượt qua.
  - Cổng còn lại: rà soát thủ công diff triển khai v0.6.1 hoàn chỉnh.
- [x] **FE05-T011 - Giữ sách đã cập nhật trạng thái vẫn hiển thị.**
  - Ánh xạ tới: FR-FE05-029, AC-FE05-020, NFR-FE05-UX-004.
  - Sau khi lệnh kích hoạt/hủy kích hoạt riêng thành công, chuyển filter trạng thái quản lý sang trạng thái đích đã commit, reset về trang 1 và tải lại dữ liệu server chuẩn.
  - Giữ PUT metadata, lệnh trạng thái riêng, `If-Match` và filter/phân trang danh sách do server sở hữu.

## Điều chỉnh hợp đồng liên tính năng 2026-07-23

- [x] **FE05-T012 - Khóa ranh giới đọc dữ liệu tham chiếu đang hoạt động được bảo vệ.**
  - Ánh xạ tới: BR-FE05-021, FR-FE05-030, AC-FE05-021.
  - Thêm ranh giới `/api/books/metadata` đã triển khai vào SPEC/PLAN/TEST_PLAN và bao phủ việc từ chối Khách/Thành viên cùng kết quả chỉ đang hoạt động cho Thủ thư/Quản trị viên.
- [x] Làm rõ tính tương đương FE05 của Thủ thư/Quản trị viên và ranh giới mutation dữ liệu tham chiếu FE11 chỉ dành cho Admin.
- [x] Đối soát phạm vi ảnh bìa được quản lý và phiên bản SPEC hiện tại trong PLAN.

## Điều chỉnh về mức sẵn sàng metadata đã triển khai 2026-07-27

- [x] **FE05-T013 - Làm cho mức sẵn sàng triển khai thất bại khi schema metadata bị sai lệch.**
  - Ánh xạ tới: BR-FE05-022, FR-FE05-031, AC-FE05-022, NFR-FE05-DEP-001.
  - Thêm kiểm tra `/health/ready` chỉ đọc cho các bảng `Authors`, `Publishers`, `Categories` chuẩn cùng cột `Status`/`CreatedAt` đã lưu của chúng.
  - Giữ migration `2026-07-22-library-metadata-compatibility.sql` đã rà soát khả dụng để database operator được ủy quyền thực thi trực tiếp.
  - Mở rộng staging smoke để triển khai chỉ mã nguồn không thể vượt qua khi các tab metadata Admin còn hỏng.
  - Giữ chính sách migration: liveness không bao giờ thay đổi schema và CI không tự áp dụng SQL.
- [x] **FE05-T014 - Loại đường sửa Kudu thất bại và giữ triển khai fail-closed.**
  - Ánh xạ tới: BR-FE05-022, FR-FE05-031, AC-FE05-022, NFR-FE05-DEP-001.
  - Loại workflow `Repair staging metadata schema`, Kudu runner, runtime migration đóng gói, lệnh npm cho operator và kiểm thử/bằng chứng rà soát riêng của chúng.
  - Chuyển `Deploy staging` thành chỉ thủ công để push thông thường chạy CI mà không tự tạo triển khai staging đã biết sẽ thất bại.
  - Giữ migration SQL đã rà soát, endpoint readiness chỉ đọc, ranh giới vai trò Admin/Librarian và staging smoke fail-closed.
- [x] **FE05-T015 - Đối soát schema metadata cũ trong runtime khởi động backend.**
  - Ánh xạ tới: BR-FE05-022, FR-FE05-031, AC-FE05-022, NFR-FE05-DEP-001.
  - Đóng gói SQL compatibility metadata đã rà soát cùng backend và áp dụng theo transaction trước khi HTTP listener khởi động.
  - Xác minh postcondition, từ chối lắng nghe khi thất bại, giữ `/health/ready` chỉ đọc và duy trì workflow staging chỉ thủ công.
  - Hoãn xác thực `Status` sang dynamic SQL batch để SQL Server chỉ biên dịch sau khi các cột metadata thiếu được thêm trong cùng transaction.
  - Khóa điều chỉnh thứ tự biên dịch bằng kiểm thử hồi quy và thực thi candidate hai lần trên cơ sở dữ liệu SQL Server cục bộ disposable có tên cụ thể trước triển khai.
  - Bao phủ việc tải/áp dụng migration, thứ tự khởi động/lỗi, đóng gói triển khai, hành vi smoke và ranh giới vai trò Admin/Librarian hiện có.

## Kích hoạt CI/CD 2026-07-28

- [x] **FE05-T016 - Triển khai staging tự động sau khi CI main thành công.**
  - Ánh xạ tới: NFR-FE05-DEP-001.
  - Kích hoạt `Deploy staging` chỉ sau khi CI `main` chính xác vượt qua, đồng thời giữ việc chạy lại thủ công.
  - Checkout commit đã được CI kiểm thử, giữ migration khởi động đã đóng gói và smoke test fail-closed, đồng thời ngăn CI thất bại triển khai.
  - Bằng chứng: chính sách workflow và kiểm thử hồi quy staging smoke vượt qua cục bộ; lần chạy workflow đã push cung cấp bằng chứng triển khai trực tiếp.

- [x] **FE05-T017 - Cho phép migration tương thích tính năng được phê duyệt riêng trong cổng khởi động.**
  - Ánh xạ tới: NFR-FE05-DEP-001.
  - Giữ readiness catalog FE05 chỉ đọc trong khi cho phép cổng khởi động đóng gói, áp dụng và xác minh migration ràng buộc `CHANGE_PASSWORD_OTP` do FE02 sở hữu trước khi lắng nghe.
  - Bằng chứng: chính sách triển khai và kiểm thử hồi quy khởi động/schema tập trung xác minh cả hai migration đã rà soát vẫn được đóng gói và fail closed.

## Điều chỉnh danh sách trạng thái một sách 2026-07-28

- [~] **FE05-T018 - Giữ ngữ cảnh danh sách và kết xuất trạng thái chính xác sau lệnh trạng thái một sách.**
  - Ánh xạ tới: BR-FE05-011, FR-FE05-029, FR-FE05-032, AC-FE05-020, AC-FE05-023.
  - Giữ khả dụng chỉ đọc trong projection chi tiết và chỉ mutation `bookId` chuẩn đã chọn.
  - Giữ ngữ cảnh search/category/status/page đã áp dụng và tải lại danh sách chuẩn đó sau cả biểu mẫu cập nhật lẫn lệnh trạng thái độc lập.
  - Kết xuất cột trạng thái danh sách quản lý từ `Books.Status` chuẩn, không phải `availabilityStatus`.
  - Xác minh kiểm thử frontend tập trung, toàn bộ kiểm thử frontend, lint/build, traceability và vệ sinh diff trước khi rà soát thủ công.

## 2026-08-01 Củng cố mutation dữ liệu tham chiếu catalog

- [x] **FE05-T019 - Ghi audit nguyên tử cho mutation dữ liệu tham chiếu catalog.**
  - Ánh xạ tới: NFR-FE05-TXN-001, NFR-FE05-LOG-001; tích hợp FE11 `BR-FE11-033`, `FR-FE11-043`, `AC-FE11-026`.
  - Bằng chứng: commit `e64c636`, PR #95, foundation checks thành công, CI sau merge `30711057582` và staging deployment `30711210037` trên `e01585a`; controller/service/repository/projector RED-GREEN, backend đầy đủ/coverage, traceability, secret scan, system/E2E/deployment đạt.
  - Ranh giới: mutation và audit dùng một transaction SQL tham số hóa; update/deactivate không tồn tại không trả thành công giả; không đổi schema, endpoint, role, envelope hoặc quyền sở hữu trạng thái bản sao FE06.
