# TASKS.md - FE01 Công khai / Duyệt sách

Trạng thái: v0.5.0 ĐÃ QUA H2 BAN ĐẦU VÀ CI PR #102; CHỜ H2 BỔ SUNG SAU KHẮC PHỤC H3
Implementation State: COMPLETE

Người phụ trách: Dung

Cập nhật: 2026-08-03

Trạng thái quy trình: HOÀN THÀNH đối với phạm vi Giai đoạn 2 đã phê duyệt; PR #59 đã merge phần tiếp nối HomePage responsive sau review H3. FE01-T009 đến FE01-T013 đã hoàn thành cục bộ với bằng chứng tự động; nghiệm thu thủ công về giao diện, điều hướng và khả năng hiển thị theo vai trò vẫn là review cấp bản phát hành.

---

## Quy tắc thực hiện nhiệm vụ

- Thực hiện nhiệm vụ theo thứ tự số và bắt đầu mỗi nhiệm vụ hành vi bằng các test RED được nêu tên.
- FE01 chỉ đọc. Không nhiệm vụ nào được ghi các bản ghi nghiệp vụ `Books`, `BookCopies`, lượt mượn, đặt chỗ, khoản phạt, tư cách thành viên, người dùng hoặc kiểm toán.
- Giữ phép chiếu công khai an toàn FE01 tách biệt với phép chiếu nhân viên/danh mục FE05 trong các tệp backend dùng chung.
- Chỉ dùng các endpoint chuẩn `/api/books` và `/api/books/{bookId}`; không thêm alias `/api/public/*` hoặc endpoint thể loại.
- Thêm thẻ `@spec` vào các tệp triển khai đã thay đổi cho ID BR/FR được ánh xạ.
- Không đánh dấu nhiệm vụ hoàn thành chỉ vì mã prototype đã tồn tại; phải ghi nhận bằng chứng tập trung mới.

## Các nhiệm vụ theo thứ tự

- [x] **FE01-T001 - Thêm các test hợp đồng duyệt công khai RED.**
  - Ánh xạ tới: BR-FE01-001 đến BR-FE01-014; FR-FE01-001 đến FR-FE01-013; AC-FE01-001 đến AC-FE01-013; NFR-FE01-SEC-001 đến NFR-FE01-SEC-004; NFR-FE01-PERF-001/002.
  - Tệp: tạo `backend/tests/publicBrowseRoutes.test.js`, tạo `backend/tests/publicBrowseRepository.test.js`, tạo `backend/tests/sql/publicBrowseAvailability.sqltest.js`, tạo `frontend/test/publicBrowseFrontend.test.js`.
  - Phụ thuộc: người phụ trách FE05 xác nhận lớp bọc phản hồi công khai dùng chung và người phụ trách FE06 xác nhận hợp đồng fixture tình trạng có sẵn.
  - RED: xác nhận `GET /api/books` và `GET /api/books/{bookId}` không cần xác thực, allowlist trường truy vấn chính xác, q chỉ khớp tiêu đề/tác giả, độ dài q 1..200, bộ lọc ID dương, giới hạn page/limit, thứ tự ổn định, mặc định tìm kiếm trống, hành vi không hoạt động/không tìm thấy, trường công khai an toàn không có ISBN, siêu dữ liệu tùy chọn null, tình trạng có sẵn mới nhất và không có thay đổi dữ liệu FE01.
  - Xác minh RED: các lệnh tập trung chỉ thất bại do thiếu hành vi công khai v0.3.1 hoặc thiếu fixture test chuyên biệt, không phải do thiết lập test sai định dạng.
  - DoD: mọi BR/FR/AC được thể hiện bằng một assertion hoặc ánh xạ test tích hợp rõ ràng, bao gồm tình trạng có sẵn theo commit mới nhất trong SQL và trạng thái không khả dụng/null ở frontend.

- [x] **FE01-T002 - Đối soát route công khai chuẩn và ranh giới validation.**
  - Ánh xạ tới: BR-FE01-001 đến BR-FE01-007, BR-FE01-013; FR-FE01-001 đến FR-FE01-007, FR-FE01-011/012; AC-FE01-001 đến AC-FE01-007, AC-FE01-010/011/012; NFR-FE01-SEC-001/003.
  - Tệp: `backend/src/routes/bookRoutes.js`, `backend/src/controllers/bookController.js`, `backend/src/services/bookService.js`, `backend/src/docs/openapi.yaml`, `backend/tests/publicBrowseRoutes.test.js`.
  - Phụ thuộc: FE01-T001 và phê duyệt ranh giới route dùng chung FE05.
  - GREEN: chỉ làm lộ các hợp đồng GET công khai chuẩn; chấp nhận chính xác `q`, `categoryId`, `authorId`, `publisherId`, `page` và `limit`; từ chối trường truy vấn không xác định, ID dương không hợp lệ, giá trị q dài hơn 200 ký tự, page nhỏ hơn 1 và limit ngoài 1..100 trước khi thực thi repository.
  - Xác minh: test route tập trung xác nhận phản hồi `200`, `400`, `404` và `500` chung an toàn, không yêu cầu xác thực, không có stack trace và không có quyền truy cập công khai tới route thay đổi dữ liệu.
  - DoD: alias `/api/public/*` và hành vi `/api/books/categories` do FE01 sở hữu không có trong hợp đồng FE01; route quản lý FE05 dùng chung vẫn nguyên vẹn.

- [x] **FE01-T003 - Đối soát bộ lọc công khai, phân trang và tình trạng có sẵn phía cơ sở dữ liệu.**
  - Ánh xạ tới: BR-FE01-003, BR-FE01-005, BR-FE01-006, BR-FE01-008, BR-FE01-011 đến BR-FE01-013; FR-FE01-002/003/008/009/011; AC-FE01-002/003/009/010/011; NFR-FE01-PERF-001/002.
  - Tệp: `backend/src/repositories/bookRepository.js`, `backend/src/services/bookService.js`, `backend/tests/publicBrowseRepository.test.js`, `backend/tests/sql/publicBrowseAvailability.sqltest.js`.
  - Phụ thuộc: FE01-T001 và FE01-T002.
  - GREEN: chỉ lọc sách hoạt động; khớp q với tiêu đề hoặc tên tác giả không phân biệt hoa thường; áp dụng bộ lọc ID dương trong SQL; dùng mặc định `page=1`, `limit=20`; sắp xếp theo `Title ASC, BookId ASC`; tính tình trạng có sẵn từ `BookCopies.Status = AVAILABLE` hiện tại mà không làm lộ số lượng bản sao hoặc ghi hàng bản sao.
  - Xác minh: test repository kiểm tra vị từ tham số hóa, `OFFSET/FETCH`, thứ tự ổn định, tìm kiếm trống, phép join tùy chọn bị thiếu, trường hợp không có/có một bản sao có sẵn và không lọc toàn bộ danh mục ở tầng ứng dụng.
  - DoD: truy vấn phản ánh trạng thái cơ sở dữ liệu đã xác nhận mới nhất trên mọi yêu cầu và không bao giờ dùng giá trị tình trạng có sẵn hardcode hoặc chỉ có trên giao diện đã lỗi thời.

- [x] **FE01-T004 - Triển khai phép chiếu danh sách/chi tiết công khai an toàn và hành vi lỗi.**
  - Ánh xạ tới: BR-FE01-004, BR-FE01-007, BR-FE01-010, BR-FE01-014; FR-FE01-004 đến FR-FE01-006, FR-FE01-010/013; AC-FE01-004 đến AC-FE01-008, AC-FE01-012/013; NFR-FE01-SEC-002/003/004.
  - Tệp: `backend/src/controllers/bookController.js`, `backend/src/services/bookService.js`, `backend/src/repositories/bookRepository.js`, `backend/src/docs/openapi.yaml`, `backend/tests/publicBrowseRoutes.test.js`.
  - Phụ thuộc: FE01-T002 và FE01-T003.
  - GREEN: chỉ trả về tiêu đề, tên thể loại/tác giả/nhà xuất bản, năm xuất bản, mô tả, URL bìa và `AVAILABLE`/`UNAVAILABLE`; loại ISBN khỏi danh sách/chi tiết cho Khách/Thành viên trong khi giữ ISBN trong phép chiếu nhân viên FE05 đã được cấp quyền; trả về `null` cho siêu dữ liệu công khai tùy chọn bị thiếu; trả về `404` an toàn cho sách bị thiếu/không hoạt động; làm sạch hoặc escape nội dung hiển thị công khai và ẩn trạng thái, barcode, vị trí, dữ liệu người mượn, dữ liệu đặt chỗ, khoản phạt và dữ liệu kiểm toán.
  - Xác minh: test route xác nhận allowlist trường công khai chính xác, giữ nguyên null, hành vi sách bị ẩn, hành vi ID sai định dạng so với bị thiếu và phản hồi lỗi cơ sở dữ liệu chung.
  - DoD: không phản hồi công khai nào chứa số lượng bản sao nội bộ, trường nhân viên, bản ghi được bảo vệ, chi tiết SQL hoặc stack trace.

- [x] **FE01-T005 - Thêm client API duyệt công khai và luồng dữ liệu HomePage dựa trên máy chủ.**
  - Ánh xạ tới: FR-FE01-001 đến FR-FE01-005, FR-FE01-008 đến FR-FE01-013; AC-FE01-001 đến AC-FE01-005, AC-FE01-009/010/013; NFR-FE01-UX-001/002.
  - Tệp: `frontend/src/api/libraryFeatureApi.js`, `frontend/src/page/HomePage.jsx`, `frontend/test/publicBrowseFrontend.test.js`.
  - Phụ thuộc: FE01-T004 và lớp bọc phản hồi công khai đã được phê duyệt.
  - RED: xác nhận trang chỉ gọi `/books` và `/books/{bookId}`, gửi các tên truy vấn đã phê duyệt, không yêu cầu `/books/categories`, chỉ dùng tình trạng có sẵn từ máy chủ cho cách trình bày nhân viên/định tuyến nội bộ đã phê duyệt và không báo mượn cục bộ thành công giả.
  - GREEN: thêm lớp bọc API duyệt công khai nhỏ, tải dữ liệu công khai được phân trang, truyền tham số q/ID/page/limit, tải chi tiết công khai qua endpoint chuẩn và giữ quyền truy cập của Khách không cần access token.
  - Xác minh: test frontend kiểm tra URL/tham số yêu cầu, tải danh sách/chi tiết, làm mới sau thay đổi truy vấn và xử lý lỗi API an toàn.
  - DoD: HomePage không còn coi mảng mock cục bộ, hoàn tất mượn giả cục bộ hoặc lần lấy thể loại legacy là nguồn dữ liệu FE01.

- [x] **FE01-T006 - Hoàn thiện các trạng thái đang tải, trống, tình trạng có sẵn an toàn theo vai trò và siêu dữ liệu null của duyệt công khai.**
  - Ánh xạ tới: BR-FE01-002, BR-FE01-004, BR-FE01-008, BR-FE01-014; FR-FE01-001, FR-FE01-003 đến FR-FE01-005, FR-FE01-010/013; AC-FE01-001, AC-FE01-003 đến AC-FE01-005, AC-FE01-009/013; NFR-FE01-UX-001/002.
  - Tệp: `frontend/src/page/HomePage.jsx`, `frontend/test/publicBrowseFrontend.test.js`.
  - Phụ thuộc: FE01-T005.
  - RED: xác nhận các trạng thái đang tải, không có kết quả, không khả dụng, thiếu bìa, thiếu tác giả/thể loại/nhà xuất bản và chi tiết không tìm thấy trước khi triển khai.
  - GREEN: giữ sách có trường tùy chọn null, kết xuất giá trị dự phòng không có bìa an toàn, hiển thị trạng thái trống/lỗi dễ hiểu, ẩn nhãn tình trạng có sẵn khỏi Khách/Thành viên, chỉ hiển thị trạng thái cấp cao đã phê duyệt cho Thủ thư/Quản trị viên và định tuyến hành động của Thành viên tới luồng mượn/đặt chỗ sở hữu mà không triển khai các luồng đó trong FE01.
  - Xác minh: test frontend tập trung bao phủ Khách công khai, cách trình bày vai trò Thành viên/nhân viên, tìm kiếm trống, không khớp, định tuyến không khả dụng, siêu dữ liệu null, chi tiết bị thiếu và lỗi chung an toàn.
  - DoD: không giao diện công khai nào làm lộ số lượng bản sao, dữ liệu người mượn, vị trí nội bộ hoặc thông báo thành công giả cho hành động mượn/đặt chỗ; phần tiếp nối HomePage responsive giữ các route đăng nhập/đăng ký, tư cách thành viên và tài khoản hiện có truy cập được trên thiết bị di động. Triển khai cục bộ, review H2 và review tích hợp H3 của PR #59 đã hoàn thành.

- [x] **FE01-T007 - Hoàn tất tài liệu API, kế hoạch test và truy vết.**
  - Ánh xạ tới: mọi ID BR/FR/AC/NFR của FE01 và Định nghĩa hoàn thành.
  - Tệp: `backend/src/docs/openapi.yaml`, `.sdd/specs/feat-public-browse/TEST_PLAN.md`, `.sdd/specs/feat-public-browse/CHANGELOG.md`, `.sdd/specs/feat-public-browse/SPEC.md` chỉ khi lớp bọc phản hồi dùng chung được làm rõ chính thức trước khi triển khai.
  - Phụ thuộc: FE01-T001 đến FE01-T006.
  - GREEN: lập tài liệu cho endpoint công khai chuẩn, allowlist truy vấn, mặc định/giới hạn phân trang, trường an toàn, giá trị tình trạng có sẵn, trạng thái lỗi, quy tắc không cần xác thực và lệnh test tập trung; chỉ cập nhật từng hàng truy vết FE01 khỏi `Not Started` khi có bằng chứng.
  - Xác minh: `rg` xác nhận mọi ID BR/FR/AC FE01 ánh xạ tới một nhiệm vụ và test; không còn hợp đồng `/api/public/*`, endpoint thể loại, số lượng bản sao chính xác hoặc `Đã mượn` lỗi thời trong tài liệu FE01 đang hoạt động.
  - DoD: tài liệu không bao giờ tuyên bố triển khai hoặc test hoàn thành khi chưa có bằng chứng được ghi nhận.

- [x] **FE01-T008 - Vượt qua xác thực tập trung và review tích hợp.**
  - Ánh xạ tới: mọi yêu cầu FE01 và Định nghĩa hoàn thành của dự án.
  - Tệp: mọi tệp triển khai/test FE01 được T001-T007 thay đổi và `.sdd/specs/feat-public-browse/CHANGELOG.md`.
  - Phụ thuộc: FE01-T007.
  - Xác minh: chạy `npm.cmd --prefix backend test -- --runTestsByPath tests/publicBrowseRoutes.test.js tests/publicBrowseRepository.test.js`, chạy test SQL khi có cấu hình SQL, chạy `node --test frontend/test/publicBrowseFrontend.test.js`, chạy `npm.cmd run trace:enforce` và chạy `git diff --check`.
  - DoD: bằng chứng tập trung đạt và PR #59 đáp ứng cổng tích hợp H3 của kho mã. Xác nhận giao diện thủ công và phê duyệt của người phụ trách trên main hiện tại được theo dõi trong danh sách kiểm tra bản phát hành.

- [x] **FE01-T009 - Hoàn thiện liên hệ ở footer và kích hoạt điều khiển thông tin chính sách.**
  - Ánh xạ tới: FR-FE01-015, AC-FE01-015, NFR-FE01-UX-003.
  - Tệp: `frontend/src/page/HomePage.jsx`, `frontend/test/publicBrowseFrontend.test.js`, `.sdd/specs/feat-public-browse/SPEC.md`, `.sdd/specs/feat-public-browse/CHANGELOG.md`.
  - GREEN: hiển thị điện thoại, email một dòng trên desktop và địa chỉ dưới dạng ba nhóm liên hệ desktop gọn không viền, có phương án dự phòng hai cột/máy tính bảng và một cột/thiết bị di động; thay liên kết `#` trống bằng hộp thoại Quyền riêng tư, Điều khoản và lưu trữ trình duyệt có khả năng truy cập.
  - Xác minh: chạy `node --test frontend/test/publicBrowseFrontend.test.js`, `npm.cmd --prefix frontend run lint`, `npm.cmd --prefix frontend run build` và `git diff --check`.
  - DoD: điều khiển footer có nội dung hiển thị, hộp thoại đóng được bằng nút, nền hộp thoại hoặc phím Escape và bố cục không yêu cầu cuộn ngang.

- [x] **FE01-T010 - Kết nối các nhóm điều hướng công khai với đích do vai trò sở hữu.**
  - Ánh xạ tới: FR-FE01-016, AC-FE01-016, NFR-FE01-UX-004.
  - Tệp: `frontend/src/page/HomePage.jsx`, `frontend/test/publicBrowseFrontend.test.js`, `frontend/test/appShellFrontend.test.js`, `.sdd/specs/feat-public-browse/SPEC.md`, `.sdd/specs/feat-public-browse/CHANGELOG.md`.
  - GREEN: thêm dropdown desktop có animation và accordion di động cho `Khám phá sách`, nhóm nhận biết vai trò `Hội viên`/`Thư viện của tôi`/`Nghiệp vụ`, `Về thư viện` và `Hỗ trợ`; định tuyến hành động Khách/Thành viên/Thủ thư/Quản trị viên tới màn hình sở hữu hiện có với ưu tiên nhân viên trước.
  - Xác minh: chạy test frontend tập trung, xác nhận mọi đường dẫn Homepage được `App.jsx` đăng ký, chạy lint/build frontend, thực thi truy vết và `git diff --check`.
  - DoD: không mục điều hướng nào là chỗ giữ chỗ trống, hành động liên hệ là trực tiếp, dropdown đóng bằng Escape và mọi đích theo vai trò tái sử dụng route hiện có được tính năng sở hữu bảo vệ.

- [x] **FE01-T011 - Mở rộng trang chủ bằng nội dung hữu ích được kết nối.**
  - Ánh xạ tới: FR-FE01-017, AC-FE01-017, NFR-FE01-UX-005.
  - Tệp: `frontend/src/page/HomePage.jsx`, `frontend/test/publicBrowseFrontend.test.js`, `.sdd/specs/feat-public-browse/SPEC.md`, `.sdd/specs/feat-public-browse/CHANGELOG.md`.
  - GREEN: thêm bộ lọc chủ đề danh mục công khai, hành trình thư viện trung thực và bảng tiếp tục Khách/Thành viên/Thủ thư/Quản trị viên được hỗ trợ bởi route hiện có; thêm cách trình bày khi xuất hiện trong khung nhìn, hover/focus, trên thiết bị di động và giảm chuyển động.
  - Xác minh: chạy test frontend tập trung, lint/build frontend, thực thi truy vết và `git diff --check`.
  - DoD: trang chủ dài hơn không thêm số liệu hay quy trình giả, mọi hành động lọc dữ liệu hiện tại hoặc tới tính năng sở hữu và mọi phần mới vẫn dùng được trên màn hình hẹp.

- [x] **FE01-T012 - Giới hạn cách trình bày tình trạng có sẵn trên HomePage theo vai trò.**
  - Ánh xạ tới: BR-FE01-016, FR-FE01-008/009/010/018, AC-FE01-005/009/018, NFR-FE01-UX-002.
  - Tệp: `frontend/src/page/HomePage.jsx`, `frontend/test/publicBrowseFrontend.test.js`, `.sdd/specs/feat-public-browse/SPEC.md`, `.sdd/specs/feat-public-browse/CHANGELOG.md`.
  - GREEN: ẩn huy hiệu tình trạng có sẵn khỏi Khách/Thành viên; giữ bước tiếp tục của Khách ở dạng chung, làm lộ nhãn mượn FE07 hoặc đặt chỗ FE08 rõ ràng cho Thành viên và giữ trạng thái cấp cao cùng hành động quản lý của Thủ thư/Quản trị viên trên danh sách/tìm kiếm/bảng/modal.
  - Xác minh: chạy test frontend tập trung, lint/build frontend, thực thi truy vết và `git diff --check`.
  - DoD: Khách không suy ra tình trạng có sẵn; Thành viên có thể nhận biết và vào đúng quy trình mượn/đặt chỗ; ưu tiên nhân viên và định tuyến FE05/FE06 không thay đổi.

- [x] **FE01-T013 - Đồng bộ bộ đặc tả Homepage và bằng chứng hiện tại.**
  - Ánh xạ tới: FR-FE01-015 đến FR-FE01-018, AC-FE01-015 đến AC-FE01-018, NFR-FE01-UX-002 đến NFR-FE01-UX-005.
  - Tệp: `.sdd/specs/feat-public-browse/CONTEXT.md`, `SPEC.md`, `PLAN.md`, `TASKS.md`, `TEST_PLAN.md` và `CHANGELOG.md`.
  - GREEN: loại bỏ cách diễn đạt tình trạng có sẵn cho Khách/Thành viên đã bị thay thế, lập tài liệu phân biệt `/home` với `/homepage`, thêm Ma trận kết nối vai trò Homepage, ghi nhận hành vi điều hướng/footer nhận biết vai trò hiện tại và thay tổng số test/truy vết lỗi thời bằng bằng chứng mới.
  - Xác minh: chạy test frontend tập trung, thực thi truy vết, tìm kiếm tính nhất quán tài liệu và `git diff --check`.
  - DoD: tài liệu FE01 đang hoạt động mô tả một hợp đồng Homepage nhất quán và phân biệt bằng chứng baseline đã merge, bằng chứng hoàn thiện cục bộ và nghiệm thu thủ công đang chờ.

- [x] **FE01-T014 - Đơn giản hóa điều hướng header Homepage.**
  - Ánh xạ tới: BR-FE01-017, FR-FE01-016, AC-FE01-016, NFR-FE01-UX-004.
  - Tệp: `frontend/src/page/HomePage.jsx`, test frontend tập trung, `SPEC.md`, `TASKS.md` và `CHANGELOG.md`.
  - GREEN: loại các nhóm `Khám phá sách`, dịch vụ theo đối tượng, `Về thư viện` và `Hỗ trợ` khỏi điều hướng header desktop và di động trong khi giữ thương hiệu, điều khiển tài khoản và hành động tiếp tục theo vai trò ở nơi khác trên trang.
  - Xác minh: chạy test frontend tập trung, lint/build frontend, thực thi truy vết và `git diff --check`.
  - DoD: không còn nhóm nào trong bốn nhóm đã loại bỏ hoặc phần triển khai dropdown/accordion không dùng của chúng trong header.

## Độ bao phủ từ yêu cầu tới nhiệm vụ

| ID yêu cầu | Nhiệm vụ đã lập kế hoạch |
| --- | --- |
| BR-FE01-001 through BR-FE01-007 | FE01-T001, FE01-T002, FE01-T004 |
| BR-FE01-008 through BR-FE01-014 | FE01-T001, FE01-T003, FE01-T004, FE01-T006 |
| FR-FE01-001 through FR-FE01-007 | FE01-T001, FE01-T002, FE01-T004, FE01-T005 |
| FR-FE01-008 through FR-FE01-013 | FE01-T001, FE01-T003, FE01-T004, FE01-T005, FE01-T006 |
| AC-FE01-001 through AC-FE01-008 | FE01-T001, FE01-T002, FE01-T004, FE01-T005, FE01-T006 |
| AC-FE01-009 through AC-FE01-013 | FE01-T001, FE01-T003, FE01-T004, FE01-T006 |
| NFR-FE01-SEC-001 through NFR-FE01-004 | FE01-T002, FE01-T004 |
| NFR-FE01-PERF-001/002 | FE01-T001, FE01-T003 |
| NFR-FE01-LOG-001/002 | FE01-T002, FE01-T004, FE01-T007 |
| NFR-FE01-UX-001/002 | FE01-T005, FE01-T006 |
| FR-FE01-015, AC-FE01-015, NFR-FE01-UX-003 | FE01-T009, FE01-T013 |
| FR-FE01-016, AC-FE01-016, NFR-FE01-UX-004 | FE01-T010, FE01-T013, FE01-T014 |
| FR-FE01-017, AC-FE01-017, NFR-FE01-UX-005 | FE01-T011, FE01-T013 |
| BR-FE01-016, FR-FE01-018, AC-FE01-018 | FE01-T012, FE01-T013 |
| BR-FE01-017 | FE01-T014 |

### Ánh xạ xuyên ranh giới rõ ràng

| ID yêu cầu | Nhiệm vụ đã lập kế hoạch |
| --- | --- |
| BR-FE01-009 | FE01-T001, FE01-T002, FE01-T004, FE01-T006 |
| BR-FE01-012 | FE01-T001, FE01-T003, FE01-T004 |
| FR-FE01-009 | FE01-T001, FE01-T003, FE01-T005, FE01-T006 |
| FR-FE01-012 | FE01-T001, FE01-T002, FE01-T004 |
| AC-FE01-006 | FE01-T001, FE01-T002, FE01-T004, FE01-T006 |
| AC-FE01-011 | FE01-T001, FE01-T002, FE01-T003, FE01-T006 |

## Cổng hoàn thành

- [x] FE01-T001 đến FE01-T008 đã hoàn thành qua cổng merge H3 của PR #59; xác nhận giao diện thủ công/phê duyệt của người phụ trách trên main hiện tại vẫn là bằng chứng cấp bản phát hành.
- [x] Triển khai cục bộ và xác thực tự động FE01-T009 đã hoàn thành; nghiệm thu giao diện thủ công vẫn đang chờ.
- [x] Triển khai cục bộ và xác thực tự động FE01-T010 đã hoàn thành; nghiệm thu điều hướng thủ công vẫn đang chờ.
- [x] Triển khai cục bộ và xác thực tự động FE01-T011 đã hoàn thành; nghiệm thu giao diện thủ công vẫn đang chờ.
- [x] Triển khai cục bộ và xác thực tự động FE01-T012 đã hoàn thành; nghiệm thu khả năng hiển thị theo vai trò thủ công vẫn đang chờ.
- [x] Đồng bộ tài liệu và bằng chứng tự động mới FE01-T013 đã hoàn thành.
- [x] Đơn giản hóa header Homepage FE01-T014 đã được triển khai với độ bao phủ tự động tập trung.
- [x] Các kiểm tra backend, SQL, frontend, truy vết và diff tập trung đều đạt.
- [ ] Người phụ trách FE05 xác nhận khả năng tương thích của phản hồi danh mục công khai dùng chung.
- [ ] Người phụ trách FE06 xác nhận việc tổng hợp tình trạng có sẵn và không thay đổi bản sao.
- [ ] Nhat xác nhận DTO công khai an toàn cuối cùng, trạng thái UX của Khách và ranh giới chỉ đọc.

## 2026-07-23 hiệu chỉnh tích hợp vai trò

- [x] Căn chỉnh cách diễn đạt tác nhân/API FE01 cho thao tác đọc của Khách, Thành viên, Thủ thư và Quản trị viên.
- [x] Kết nối hành động sách công khai với vai trò tài khoản duy nhất của FE11; giữ xử lý phòng vệ cho mảng vai trò legacy lỗi thời.
- [x] Thêm độ bao phủ hồi quy frontend phòng vệ cho mảng tương thích legacy `MEMBER + LIBRARIAN` và `MEMBER + ADMIN` không hợp lệ.

## 2026-08-03 - Hành động lưu thông trung thực v0.5.0

- [x] **FE01-T015 - RED/GREEN read model và hợp đồng công khai.**
  - Ánh xạ: BR-FE01-018, FR-FE01-019, AC-FE01-019..022.
  - Tệp: repository/service sách, OpenAPI, repository/route contract tests và helper trong bộ nhớ.
  - DoD: bốn giá trị đúng thứ tự ưu tiên, fallback fail-closed, không lộ dữ liệu bản sao/lượt giữ.
- [x] **FE01-T016 - RED/GREEN hành động HomePage theo vai trò.**
  - Ánh xạ: FR-FE01-020, AC-FE01-019..022.
  - Tệp: `homeBookActions.js`, `HomePage.jsx` và test frontend tập trung.
  - DoD: Thành viên dùng `circulationAction`; `WAIT`/`UNAVAILABLE` không điều hướng; Khách/nhân viên giữ hành vi đã phê duyệt.
- [ ] **FE01-T017 - Truy vết, hồi quy và acceptance liên FE01/FE07.**
  - Ánh xạ: AC-BCSF-001..004, AC-BCSF-008.
  - Tệp: đặc tả FE01, API contract và `fe01-fe07-borrow-candidate-flow.spec.js`.
  - DoD: các gate backend/frontend/Chromium/trace đạt và diff được trình H2 trước commit.
  - Bằng chứng cục bộ sau khắc phục H3: backend `1.200/1.200`, frontend `281/281`, Chromium `4/4`,
    deployment `20/20`, secrets `5/5`; H2 ban đầu đã duyệt và CI PR #102 đã đạt.
    Giữ mở vì khắc phục H3 đang chờ H2 bổ sung và live acceptance vẫn thuộc FE07-T064.
