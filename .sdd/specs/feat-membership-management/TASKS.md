# TASKS.md - Quản lý thành viên FE04

Trạng thái: COMPLETE - PHẠM VI CỐT LÕI; ADMIN EXTENSION H2 PASS, MANUAL PENDING
Implementation State: PARTIAL

Chủ sở hữu: Dat

Cập nhật: 2026-08-03

Trạng thái quy trình: COMPLETE cho phạm vi Giai đoạn 2 đã phê duyệt; H3, merge và CI `main` chính xác sau merge được ghi tại `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`. Các phát biểu cổng đang chờ/mở bên dưới là snapshot thực thi lịch sử đã được bằng chứng đó thay thế.

Trạng thái mở rộng: `FE04-ADM01..ADM04`, L1 đầy đủ và H2 vòng 1 đã đạt; Azure Staging run `lms-fe04-acceptance-20260803-90ac1d5b` đã cleanup sạch; `FE04-ADM05` và `FE04-CONV-002` vẫn chờ nghiệm thu thủ công/xác nhận owner.

---

## Quy tắc nhiệm vụ

- Thực hiện nhiệm vụ theo thứ tự số trừ khi trường phụ thuộc cho phép rõ ràng công việc song song.
- Bắt đầu mọi nhiệm vụ hành vi bằng kiểm thử thất bại được nêu; không đánh dấu hoàn tất chỉ vì mã prototype tồn tại.
- Giữ lịch sử `MembershipApplications` bất biến và `Members.Status` là chuẩn.
- Không gán vai trò, triển khai mượn/đặt chỗ hoặc thêm hành vi hết hạn/thanh toán.
- Thêm tag `@spec` vào các tệp triển khai đã thay đổi cho ID FR/BR được ánh xạ.

## Các nhiệm vụ theo thứ tự

- [x] **FE04-T001 - Thêm kiểm thử RED cho hợp đồng và tính đồng thời của thành viên.**
  - Ánh xạ tới: BR-FE04-001 đến BR-FE04-018; FR-FE04-001 đến FR-FE04-012; AC-FE04-001 đến AC-FE04-011.
  - Tệp: `backend/tests/membershipRoutes.test.js`, `backend/tests/helpers/inMemoryMembershipRepositories.js`, tạo `backend/tests/sql/membershipConcurrency.sqltest.js`.
  - Phụ thuộc: không có.
  - RED: thêm các trường hợp được đặt tên cho quyền truy cập người nộp đơn đang hoạt động, `NONE` chuẩn, đơn đang chờ trùng lặp, chặn đã phê duyệt, nộp lại đơn bị từ chối, tranh chấp review, rollback nguyên tử, trạng thái riêng tư, lý do bắt buộc và việc gửi FE10 không chặn luồng/idempotent.
  - Xác minh RED: `npm.cmd --prefix backend test -- --runTestsByPath tests/membershipRoutes.test.js tests/sql/membershipConcurrency.sqltest.js` chỉ thất bại ở hành vi v0.2.0 còn thiếu.
  - DoD: mỗi AC đã phê duyệt có ít nhất một assertion cụ thể và lỗi được inject chứng minh không có trạng thái dở dang.

- [x] **FE04-T002 - Đối soát hợp đồng SQL và persistence.**
  - Ánh xạ tới: BR-FE04-003, BR-FE04-014 đến BR-FE04-017; FR-FE04-001 đến FR-FE04-005, FR-FE04-010, FR-FE04-011; AC-FE04-001 đến AC-FE04-004, AC-FE04-006, AC-FE04-009; NFR-FE04-TXN-001/002.
  - Tệp: `database/Librarymanagement.sql`, `.sdd/rfcs/ADR-002-database-design.md`, `backend/src/models/Member.js`, `backend/src/models/MembershipApplication.js`, `backend/src/repositories/membershipRepository.js`.
  - Phụ thuộc: FE04-T001.
  - GREEN: thực thi tối đa một đơn đang chờ trong khi giữ lịch sử; cung cấp phương thức transaction cho nộp/phê duyệt/từ chối với kết quả conflict xác định.
  - Xác minh: kiểm thử SQL từ FE04-T001 vượt qua cho trường hợp nộp đơn trùng lặp, review cạnh tranh và rollback.
  - DoD: không giới thiệu trạng thái `EXPIRED` hoặc xóa vật lý lịch sử; mọi SQL dùng tham số.
  - Bằng chứng: kiểm tra baseline/model/ADR vượt qua; migration chạy hai lần và cả bốn static case cùng sáu mutable SQL case vượt qua trong lần chạy SQL Server disposable được ghi tại `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.

- [x] **FE04-T003 - Đối soát xác thực, phân quyền, xác thực dữ liệu và hợp đồng API.**
  - Ánh xạ tới: BR-FE04-001, BR-FE04-002, BR-FE04-006 đến BR-FE04-011, BR-FE04-017; FR-FE04-006 đến FR-FE04-008; AC-FE04-005 đến AC-FE04-008; NFR-FE04-SEC-001 đến NFR-FE04-SEC-004.
  - Tệp: `backend/src/routes/membershipRoutes.js`, `backend/src/controllers/membershipController.js`, `backend/src/validators/membershipValidators.js`, `backend/src/services/membershipService.js`, `backend/src/docs/openapi.yaml`.
  - Phụ thuộc: FE04-T001.
  - GREEN: cho phép người dùng `MEMBER` đang hoạt động đã xác thực nộp đơn/xem trạng thái của chính mình mà không yêu cầu projection thành viên trước đó; từ chối vai trò không phải thành viên; giữ các chốt review Thủ thư/Quản trị viên; xác thực ID, trạng thái, phân trang và lý do.
  - Xác minh: kiểm thử route tập trung trả về `401`, `403`, `400`, `404` hoặc `409` theo nhánh đã phê duyệt và không bao giờ làm lộ stack trace.
  - DoD: cả năm endpoint và hợp đồng response/lỗi được ghi trong OpenAPI.
  - Bằng chứng: ranh giới từ chối nộp đơn/trạng thái cho người không phải thành viên và người nộp đơn `MEMBER` đang hoạt động vượt qua; toàn bộ suite route vượt qua hành vi nguyên tử, response, đồng thời, audit và thông báo đã đối soát.

- [x] **FE04-T004 - Triển khai hành vi nộp đơn, nộp lại đơn và trạng thái của chính mình chuẩn.**
  - Ánh xạ tới: BR-FE04-002 đến BR-FE04-005, BR-FE04-011, BR-FE04-012, BR-FE04-014 đến BR-FE04-017; FR-FE04-001 đến FR-FE04-003, FR-FE04-007, FR-FE04-009, FR-FE04-010; AC-FE04-001, AC-FE04-002, AC-FE04-007 đến AC-FE04-009, AC-FE04-011.
  - Tệp: `backend/src/services/membershipService.js`, `backend/src/repositories/membershipRepository.js`, `backend/tests/membershipRoutes.test.js`, `backend/tests/helpers/inMemoryMembershipRepositories.js`.
  - Phụ thuộc: FE04-T002, FE04-T003.
  - GREEN: việc nộp đơn tạo nguyên tử một đơn bất biến mới và cập nhật/tạo hàng thành viên chuẩn; trạng thái của chính mình trả về `{ membershipStatusView, memberStatus, currentApplication }` theo thứ tự đơn gần nhất có tính xác định.
  - Xác minh: `npm.cmd --prefix backend test -- --runTestsByPath tests/membershipRoutes.test.js` vượt qua các trường hợp nộp đơn/trạng thái/nộp lại đơn.
  - DoD: `NONE` chỉ được suy ra khi cả thành viên lẫn đơn đều không có; lịch sử đơn không bao giờ ghi đè điều kiện chuẩn.
  - Bằng chứng: suite thành viên tập trung vượt qua envelope chuẩn, conflict một đơn đang chờ, chặn đã phê duyệt chuẩn, lịch sử gần nhất có tính xác định và các trường hợp nộp lại đơn bị từ chối.

- [x] **FE04-T005 - Triển khai phê duyệt và từ chối nguyên tử.**
  - Ánh xạ tới: BR-FE04-006 đến BR-FE04-010, BR-FE04-013 đến BR-FE04-015; FR-FE04-004 đến FR-FE04-006, FR-FE04-008, FR-FE04-011; AC-FE04-003 đến AC-FE04-006; NFR-FE04-LOG-001.
  - Tệp: `backend/src/services/membershipService.js`, `backend/src/repositories/membershipRepository.js`, `backend/src/repositories/auditLogRepository.js`, `backend/tests/membershipRoutes.test.js`, `backend/tests/sql/membershipConcurrency.sqltest.js`.
  - Phụ thuộc: FE04-T002, FE04-T003.
  - GREEN: đơn, thành viên chuẩn, người rà soát/timestamp/lý do và audit cập nhật trong một transaction; chỉ một chuyển đổi cuối cùng cạnh tranh thành công.
  - Xác minh: kiểm thử route và SQL tập trung vượt qua các trường hợp phê duyệt, từ chối, trạng thái không hợp lệ, độ dài lý do, rollback và tranh chấp.
  - DoD: metadata audit định danh tác nhân, đơn, thành viên, timestamp, kết quả và lý do từ chối an toàn.
  - Bằng chứng: các trường hợp in-memory và sáu mutable SQL case vượt qua nộp đơn trùng lặp, review cuối cạnh tranh, timestamp dùng chung, lịch sử nộp lại đơn và rollback audit nộp đơn/review.

- [x] **FE04-T006 - Thêm việc gửi kết quả thành viên FE10 sau commit.**
  - Ánh xạ tới: BR-FE04-018; FR-FE04-012; AC-FE04-003, AC-FE04-004, AC-FE04-010.
  - Tệp: `backend/src/services/membershipService.js`, `backend/src/services/notificationService.js`, `backend/src/app.js`, `backend/tests/membershipRoutes.test.js`.
  - Phụ thuộc: FE04-T005 và interface bên yêu cầu FE10 đã phê duyệt.
  - RED: kiểm thử assertion một lần gọi gắn với FE04 cùng đơn nguồn/trạng thái cuối và khóa `FE04:MEMBERSHIP_RESULT:<applicationId>:<finalStatus>`; lỗi bên yêu cầu vẫn giữ quyết định đã commit.
  - GREEN: chỉ gọi FE10 sau commit và trả về kết quả gửi an toàn không chứa lỗi provider thô.
  - Xác minh: kiểm thử route tập trung vượt qua các trường hợp thành công, idempotency trùng lặp và lỗi bên yêu cầu.
  - DoD: không ghi thông báo trong transaction thành viên và không lỗi gửi nào thay đổi trạng thái thành viên.
  - Bằng chứng: kiểm thử bên yêu cầu FE04 được inject vượt qua type/template/source/idempotency chính xác, thứ tự sau commit, ngăn trùng lặp, `PENDING` an toàn và `FAILED` không chặn luồng; việc kết nối ứng dụng dùng chung đã đối soát được bao phủ bởi harness integration hiện tại.

- [x] **FE04-T007 - Đối soát danh sách nhân viên và trường response an toàn cho người nộp đơn.**
  - Ánh xạ tới: BR-FE04-011 đến BR-FE04-014; FR-FE04-007, FR-FE04-009; AC-FE04-007, AC-FE04-011; NFR-FE04-PERF-001, NFR-FE04-UX-001/002.
  - Tệp: `backend/src/repositories/membershipRepository.js`, `backend/src/services/membershipService.js`, `backend/tests/membershipRoutes.test.js`, `backend/src/docs/openapi.yaml`.
  - Phụ thuộc: FE04-T004, FE04-T005.
  - GREEN: danh sách nhân viên có phân trang/lọc theo trạng thái vẫn được bảo vệ; trạng thái của chính mình làm lộ lý do từ chối đã lưu nhưng không lộ dữ liệu người rà soát/nội bộ được bảo vệ.
  - Xác minh: kiểm thử route bao phủ thứ tự xác định, hành vi page/filter, quyền truy cập nhân viên và quyền riêng tư thành viên.
  - DoD: FE07/FE08 có thể sử dụng tài khoản đang hoạt động cùng thành viên đã phê duyệt chuẩn mà không đọc lịch sử đơn.
  - Bằng chứng: route tập trung vượt qua phân trang/tìm kiếm/lọc trạng thái có tính xác định, còn trạng thái của chính mình chỉ trả về `{ membershipStatusView, memberStatus, currentApplication }` không có nội bộ người rà soát.

- [x] **FE04-T008 - Đối soát frontend thành viên với sự thật server.**
  - Ánh xạ tới: AC-FE04-001 đến AC-FE04-010; NFR-FE04-UX-001/002.
  - Tệp: `frontend/src/page/MembershipPage.jsx`, `frontend/src/component/membership/MembershipApplicationForm.jsx`, `frontend/src/component/membership/MembershipApplicationsTable.jsx`, `frontend/src/component/membership/MembershipReviewModal.jsx`, `frontend/src/component/membership/MyMembershipStatus.jsx`, `frontend/src/component/membership/membershipStatus.js`, `frontend/src/api/libraryFeatureApi.js`, tạo `frontend/test/membershipFrontend.test.js`.
  - Phụ thuộc: FE04-T003 đến FE04-T007.
  - RED: kiểm thử cấp nguồn thất bại khi còn bản ghi demo fallback, cấu trúc trạng thái cũ hoặc input từ chối không giới hạn.
  - GREEN: sử dụng trường chuẩn, hiển thị lỗi API/trạng thái trống rõ ràng, giữ quy tắc nộp lại đơn và làm mới từ server sau mutation.
  - Xác minh: `node --test frontend/test/membershipFrontend.test.js` vượt qua.
  - DoD: lỗi mạng không bao giờ bịa đặt trạng thái thành viên hoặc đơn nhân viên.
  - Bằng chứng: 5/5 kiểm thử frontend tập trung vượt qua việc sử dụng response chuẩn, lỗi đúng sự thật, tìm kiếm server, làm mới mutation, không bịa đặt demo/`NONE` và giới hạn lý do từ chối 500 ký tự.

- [x] **FE04-T009 - Chốt bằng chứng traceability và xác thực.**
  - Ánh xạ tới: mọi ID BR/FR/AC FE04 và Định nghĩa hoàn tất.
  - Tệp: phần triển khai/kiểm thử FE04 đã thay đổi, `.sdd/specs/feat-membership-management/TEST_PLAN.md`, `.sdd/specs/feat-membership-management/CHANGELOG.md`.
  - Phụ thuộc: FE04-T001 đến FE04-T008.
  - Xác minh: backend, SQL, frontend tập trung, `npm.cmd run trace:enforce` và `git diff --check` đều vượt qua; toàn bộ suite chỉ chạy ở cổng merge.
  - DoD: bằng chứng ghi chính xác số lượng/kết quả kiểm thử, rủi ro phụ thuộc bên ngoài còn lại và trạng thái rà soát thủ công mà không tuyên bố các kiểm tra chưa chạy.
  - Bằng chứng: trace FE04 là 14/14; SQL Server disposable vượt qua 10/10; backend full 75 suite/1202 test và coverage gate đạt; frontend 281/281, lint/build đạt; Playwright 16/16; deployment 20/20; staging run `lms-fe04-acceptance-20260803-90ac1d5b` và cleanup đạt; suite liên tính năng FE04/FE07/FE08/FE10/FE12 đạt 162/162; H2 vòng 1 được duyệt trên fingerprint `8cef30463f1e4cd2f4ee80862cca282c297f902a`.

- [x] **FE04-T010 - Yêu cầu hồ sơ cá nhân đầy đủ trước khi nộp đơn.**
  - Ánh xạ tới: BR-FE04-019, FR-FE04-013, AC-FE04-012, NFR-FE04-UX-004.
  - Tệp: service/repository FE04, UI nộp đơn thành viên và kiểm thử backend/frontend tập trung.
  - GREEN: yêu cầu `fullName`, `phone`, `dateOfBirth` và `address` không trống ở server; vô hiệu hóa submission và liên kết người dùng chưa hoàn thiện đến `/profile`; giữ avatar tùy chọn và request body trống.
  - Xác minh: kiểm thử backend/frontend FE04 tập trung, lint frontend và vệ sinh diff vượt qua.

## Độ bao phủ yêu cầu–nhiệm vụ

| ID yêu cầu | Nhiệm vụ dự kiến |
| --- | --- |
| BR-FE04-001 đến BR-FE04-005 | FE04-T001, FE04-T003, FE04-T004 |
| BR-FE04-006 đến BR-FE04-010 | FE04-T001, FE04-T003, FE04-T005 |
| BR-FE04-011 đến BR-FE04-017 | FE04-T002, FE04-T004, FE04-T005, FE04-T007 |
| BR-FE04-018 | FE04-T006 |
| BR-FE04-019 | FE04-T010 |
| FR-FE04-001 đến FR-FE04-003 | FE04-T004 |
| FR-FE04-004 đến FR-FE04-006 | FE04-T005 |
| FR-FE04-007 đến FR-FE04-009 | FE04-T003, FE04-T004, FE04-T007 |
| FR-FE04-010, FR-FE04-011 | FE04-T002, FE04-T004, FE04-T005 |
| FR-FE04-012 | FE04-T006 |
| FR-FE04-013 | FE04-T010 |
| FR-FE04-014 | FE04-ADM01..FE04-ADM05 |
| AC-FE04-001, AC-FE04-002 | FE04-T004 |
| AC-FE04-003 đến AC-FE04-006 | FE04-T005, FE04-T006 |
| AC-FE04-007, AC-FE04-008 | FE04-T003, FE04-T004, FE04-T007 |
| AC-FE04-009 | FE04-T004 |
| AC-FE04-010 | FE04-T006 |
| AC-FE04-011 | FE04-T007 |
| AC-FE04-012 | FE04-T010 |
| AC-FE04-013 | FE04-ADM01..FE04-ADM05 |

## Cổng hoàn tất

- [x] FE04-T001 đến FE04-T009 hoàn tất và được rà soát độc lập.
- [x] Backend, SQL, frontend, traceability và kiểm tra diff tập trung vượt qua.
- [x] Toàn bộ suite cổng merge không-SQL đã cấu hình vượt qua cục bộ; chạy lại sau thay đổi SQL/fan-in.
- [x] Không thêm secret, thông tin xác thực thông báo thô hoặc dữ liệu cá nhân thực.
- [ ] Dat và chủ sở hữu liên tính năng FE07/FE08 xác nhận hợp đồng điều kiện chuẩn.
## batch khắc phục 2026-07-22

- [x] Sử dụng phản hồi trung lập cho việc từ chối thành viên đã hoàn tất.
- [x] Ẩn quy trình sidebar chỉ dành cho Thành viên khỏi tác nhân Thủ thư/Quản trị viên chỉ có một vai trò.

## Nhiệm vụ tích hợp rà soát thành viên trong Admin Console

- [x] **FE04-ADM01 - Khóa hợp đồng chính xác về điều hướng và trình bày thành viên Admin thuần.**
  - Ánh xạ tới: FR-FE04-014, AC-FE04-013; BR-FE11-016, AC-FE11-016.
  - DoD: RED-GREEN chứng minh sidebar chính xác tám mục, chuẩn hóa danh sách FE04 chuẩn, nhận diện trạng thái đang chờ và phản hồi quyết định/thông báo đã commit an toàn.
- [x] **FE04-ADM02 - Xây dựng danh mục thành viên Admin do server sở hữu.**
  - Phụ thuộc: FE04-ADM01.
  - DoD: Admin Console kết xuất kết quả `q`, `status`, `page`, `limit` FE04 với trạng thái tải/lỗi/trống, bảng/thẻ và không dùng alias API Admin.
- [x] **FE04-ADM03 - Thêm phê duyệt, từ chối, tải lại khi conflict và phản hồi FE10.**
  - Phụ thuộc: FE04-ADM02.
  - DoD: chỉ hàng `PENDING` hiển thị quyết định; lý do từ chối dài 1..500 ký tự; thành công/thất bại tải lại sự thật server; việc gửi `FAILED` là cảnh báo sau quyết định đã commit.
- [x] **FE04-ADM04 - Vượt qua nghiệm thu trình duyệt responsive đã xác thực.**
  - Phụ thuộc: FE04-ADM03.
  - Bằng chứng: local Playwright FE04 + FE11 đạt 2/2 và thoát sạch; staging run `lms-fe04-acceptance-20260803-90ac1d5b` đạt reject -> resubmit -> approve, sidebar tám mục và không tràn ở 1440/1366/1280/390.
  - DoD: từ chối FE04 thực, nộp lại đơn và phê duyệt vượt qua trong shell Admin; bằng chứng bảng/thẻ và không tràn vượt qua; lệnh tập trung thoát sạch.
- [~] **FE04-ADM05 - Vượt qua L1-L4, H2, Azure Staging và nghiệm thu thủ công.**
  - Phụ thuộc: FE04-ADM01..FE04-ADM04.
  - Bằng chứng candidate: L1 đầy đủ, Azure Staging, kiểm tra HTTP/auth/responsive/cleanup và H2 vòng 1 đã đạt; đang chờ phê duyệt thủ công desktop/mobile và xác nhận owner.
  - DoD: kiểm thử tập trung/đầy đủ, lint/build/trace/browser, commit đã rà soát, lần triển khai, kiểm tra HTTP và phê duyệt thủ công desktop/mobile đã xác thực rõ ràng được ghi nhận.

## Giai đoạn 3: Hội tụ

- [x] **FE04-CONV-001 - Ghi nhận việc thoát sạch khi nghiệm thu trình duyệt Windows.**
  - Ánh xạ tới: FR-FE04-014, AC-FE04-013, FE04-ADM04.
  - Bằng chứng: FE04 + FE11 Playwright tập trung đạt 2/2 và tiến trình thoát sạch trong 31,5 giây; staging acceptance độc lập cũng đạt bốn viewport.
  - DoD: chạy lại spec trình duyệt FE04 và FE11 tập trung với kết thúc sạch, đồng thời lưu bằng chứng screenshot/overflow.

- [~] **FE04-CONV-002 - Hoàn tất nghiệm thu FE04 bên ngoài và bằng chứng phát hành.**
  - Ánh xạ tới: mọi tiêu chí nghiệm thu FE04, FE04-ADM05 và Định nghĩa hoàn tất.
  - Bằng chứng candidate: exact CI/deploy `850b01b`, staging acceptance, cleanup, L1 đầy đủ và H2 vòng 1 đạt; suite liên tính năng đạt 162/162. Xác nhận chủ sở hữu và phê duyệt thủ công vẫn mở.
  - DoD: ghi SHA đã triển khai, kiểm tra HTTP, quyết định người rà soát và phê duyệt rõ ràng trước khi đánh dấu FE04 hoàn tất.
