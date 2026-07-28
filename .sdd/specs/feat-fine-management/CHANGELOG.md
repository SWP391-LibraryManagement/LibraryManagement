# CHANGELOG.md - FE09 Quản lý tiền phạt

## 2026-07-28 - Tạo tiền phạt từ các lượt trả quá hạn được chọn (v0.4.5)

- Kết nối không gian làm việc trả sách của Thủ thư/Quản trị viên với endpoint
  tính toán chuẩn của FE09 cho `borrowDetailId` quá hạn được chọn.
- Giữ các ngày đã lưu, cách tính 5.000 VND/ngày, xử lý trùng lặp, trạng thái
  kết thúc và hành vi audit là nguồn chân lý ở máy chủ.

## 2026-07-28 - Ẩn mã mượn nội bộ khỏi tiền phạt của Thành viên (v0.4.4)

- Loại bỏ cột `Mã mượn` và cơ chế thay thế tiêu đề dựa theo mã định danh khỏi
  bảng tiền phạt của Thành viên.
- Giữ `borrowDetailId` trong mối quan hệ chuẩn của API/cơ sở dữ liệu phục vụ
  ngăn chặn trùng lặp, tính toán, đối soát của nhân viên và audit.

## 2026-07-27 - Kết nối tiền phạt của Thành viên với mượn sách và quyền vai trò

- Giới hạn `/api/fines/me` cho riêng vai trò `MEMBER`; Thủ thư/Quản trị viên
  tiếp tục sử dụng không gian làm việc tiền phạt dành cho nhân viên.
- Bổ sung ngày đến hạn, ngày trả và trạng thái mượn do FE07 quản lý vào DTO
  tiền phạt chuẩn.
- Giữ “Tiền phạt của tôi” ở chế độ chỉ đọc, bổ sung đối soát lịch sử mượn, và
  giải thích rằng các khoản tiền phạt `UNPAID` dương sẽ chặn mượn mới và gia hạn.
- Giữ nguyên quyền thu tiền trực tiếp của Thủ thư/Quản trị viên và quyền miễn/
  hủy chỉ dành cho Quản trị viên.

## 2026-07-22 - Đơn giản hóa hiển thị sách cho Thủ thư

- Đổi cột danh sách tiền phạt của Thủ thư từ `Sách / barcode` thành `Sách` và
  loại bỏ phụ đề mã vạch khỏi cả hàng danh sách lẫn thẻ tiền phạt được chọn.
- Giữ nguyên DTO tiền phạt chuẩn và hành vi tìm kiếm phía máy chủ; đây chỉ là
  điều chỉnh phần trình bày.

## 2026-07-21 - Kết nối quy trình tiền phạt của Thủ thư

- Loại bỏ thông báo quy trình FE09 dư thừa khỏi không gian làm việc của Thủ thư.
- Giữ khoản tiền phạt chuẩn được trả về bởi các thao tác tính toán và thanh toán,
  nhờ đó việc chọn trong danh sách, thu tiền và đối soát đã thanh toán đều hoạt
  động trên cùng một khoản tiền phạt, kể cả khi vượt qua ranh giới phân trang/
  lọc phía máy chủ.
- Bổ sung thao tác trực tiếp từ chi tiết tiền phạt chưa thanh toán sang thu tiền
  hoặc đối soát đã thanh toán, đồng thời từ chối vào bước thanh toán khi chưa
  chọn khoản tiền phạt chưa thanh toán.
- Bổ sung phạm vi chấp nhận tính liên tục quy trình FE09 mà không thay đổi quyền
  phía máy chủ, chính sách thanh toán, điều kiện hợp lệ FE07 hoặc quyền sở hữu
  báo cáo FE12.

## 2026-07-20 - Bản địa hóa giao diện tiếng Việt và kiểu chữ

- Bản địa hóa các nhãn, trạng thái, tên hỗ trợ tiếp cận và phản hồi lỗi an toàn
  do frontend sinh ra cho tính năng này.
- Giữ nguyên hợp đồng API, giá trị enum thô, quyền hạn, quy tắc nghiệp vụ và
  dữ liệu danh mục/hồ sơ do người dùng sở hữu.
- Áp dụng hợp đồng kiểu chữ dùng chung `Be Vietnam Pro` cho nội dung và
  `Noto Serif` cho tiêu đề, cùng các phông chữ thay thế có hỗ trợ Unicode.

## 2026-07-19 - Hoàn tất kết thúc Giai đoạn 2

- feat-fine-management được chấp thuận trong lần đối soát đầy đủ FE01-FE12
  của Giai đoạn 2 được ghi nhận bởi PR #40/#41; ranh giới xác thực và tồn dư
  được tổng hợp trong
  `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Các giới hạn bị hoãn và phạm vi tương lai vẫn được nêu rõ, không bị mở rộng
  bởi đợt hoàn tất này.

## 2026-07-19 - Danh sách tiền phạt do máy chủ kiểm soát và hoàn tất L4

- Chuyển hoàn toàn việc tìm kiếm, lọc trạng thái và phân trang của Quản lý tiền
  phạt sang các tham số truy vấn `/api/fines` chuẩn và vỏ phản hồi
  `{ fines, page, limit, total, totalPages }`.
- Loại bỏ quyền sở hữu chuẩn hóa, lọc, sắp xếp, cắt trang và tổng số trang suy
  ra ở phía trình duyệt; chỉ giữ các chỉ số tóm tắt theo trang với nhãn rõ ràng.
- Bổ sung trình dựng truy vấn xác định, các kiểm thử nguồn tập trung, nhãn trạng
  thái/phân trang dễ tiếp cận và luồng Playwright L4 bao phủ trang 1/2, bộ lọc
  kết hợp tìm kiếm/trạng thái, tổng số phía máy chủ và tràn trên thiết bị di động.
- Các kiểm thử frontend tập trung đạt 6/6, toàn bộ frontend đạt 146/146,
  lint/build đạt, chấp nhận trình duyệt FE09 đạt 1/1, toàn bộ bộ kiểm thử trình
  duyệt cô lập đạt 3/3 và lượt chạy CI PR `29680600893` đạt trên `dfe45ae`.
- Đóng `TD-004`; việc chấp nhận tích hợp thủ công cuối cùng của toàn dự án vẫn
  còn mở.

## 2026-07-19 - Đối soát v0.4.0 phía agent

- Hoàn tất FE09-T013 đến FE09-T020 tại ranh giới máy chủ Core theo Hybrid
  SDD+ADD: kiểm thử ưu tiên hợp đồng, thời gian nghiệp vụ `Asia/Ho_Chi_Minh`
  rõ ràng, tính toán lại `UNPAID` tại chỗ, bảo toàn lịch sử ở trạng thái kết
  thúc và ngăn chặn trùng lặp đã khóa.
- Loại bỏ ngữ nghĩa thanh toán một phần khỏi thu tiền và đối soát đã thanh toán;
  cả hai chuyển đổi hiện yêu cầu phương thức thanh toán đã được trim và thiết
  lập nguyên tử toàn bộ siêu dữ liệu thanh toán.
- Bổ sung các ranh giới giao dịch dùng chung cho thay đổi tiền phạt cùng các lần
  ghi audit, hành vi rollback xác định, xử lý một bên thắng khi đồng thời ở trạng
  thái kết thúc và siêu dữ liệu audit theo danh sách cho phép
  (`amount`, `paymentMethod`, `note`, `reason`, `result`).
- Bổ sung xác thực/dạng vỏ/dò tìm/thứ tự danh sách xác định, các thao tác
  OpenAPI FE09 chuẩn, bằng chứng tĩnh/đồng thời SQL và traceability 100% FR
  của FE09.
- Đạt toàn bộ 9/9 trường hợp SQL FE09 trên SQL Server dùng một lần, gồm tính
  toán trùng lặp đồng thời, một bên thắng khi thu tiền, điều kiện hợp lệ và
  rollback audit; bằng chứng dọn dẹp được ghi trong bài đánh giá Live SQL đối
  soát đầy đủ.
- Ghi nhận ranh giới frontend: quyền sở hữu API chuẩn đã được xác thực, trong
  khi phần trình bày danh sách do máy chủ kiểm soát hoàn toàn và chấp nhận
  trình duyệt/L4 vẫn bị hoãn ở TD-004 và các cổng dự án.

## 2026-07-19 - Đang đối soát ranh giới production

- Loại bỏ các route tạo/cập nhật/xóa tiền phạt cũ khỏi router production và
  chuyển các kiểm thử của chúng sang xác nhận `404`.
- Thực thi việc thu tiền trực tiếp toàn phần của Giai đoạn 1 bằng cách từ chối
  mọi `collectedAmount` do client cung cấp.
- Đối soát `TEST_PLAN.md` cùng các quyết định cổng review v0.4.1 đã được duyệt;
  các nhiệm vụ timezone, phân trang, đồng thời, audit nguyên tử và traceability
  đầy đủ vẫn mở.

## 2026-07-18 - Khôi phục trang tiền phạt của Thủ thư

- Khôi phục mục sidebar `Quản lý tiền phạt` và trang `/librarian/fines` của Thủ
  thư sau khi làm rõ rằng chỉ không gian làm việc quản lý sách nhúng dư thừa mới
  cần bị loại bỏ.
- Giữ Quản lý sách FE05 ở route `/librarian/books` riêng.

## 2026-07-18 - Tách điều hướng tiền phạt của Thủ thư

- Giữ `/librarian/fines` là không gian làm việc FE09 chuyên dụng và giữ nguyên
  mục sidebar dành cho Thủ thư.
- Loại bỏ không gian làm việc quản lý sách FE05 nhúng khỏi trang tiền phạt vì
  FE05 hiện có route sidebar `/librarian/books` riêng.

## 2026-07-17 - Đã duyệt baseline Giai đoạn 1

- Nhật đã duyệt hợp đồng tích lũy tiền phạt, thanh toán, trạng thái kết thúc và
  ranh giới máy chủ FE09 đã được chuẩn hóa làm baseline Giai đoạn 1; phần theo
  dõi triển khai vẫn đang chờ.
- Đóng cổng review kế hoạch đối soát trong khi vẫn giữ việc di chuyển frontend
  bị hoãn và các nhiệm vụ triển khai chưa hoàn thành.

## 2026-07-17 - Hợp đồng lưu trữ thanh toán

- Chọn `Fines` làm nơi sở hữu siêu dữ liệu thanh toán của Giai đoạn 1; không cần
  bảng thanh toán riêng.
- Giữ ghi chú thu tiền trong siêu dữ liệu audit an toàn thay vì bảng `Fines`.

## 2026-07-17 - Củng cố bất biến tính tiền phạt và thanh toán

- Nâng `SPEC.md` lên phiên bản 0.4.1.
- Việc tính lại hiện cập nhật tại chỗ một khoản tiền phạt `UNPAID` hiện có thay
  vì đóng băng số tiền trước đó.
- Các khoản tiền phạt ở trạng thái kết thúc vẫn bất biến; các bất biến về
  `PaymentMethod` và siêu dữ liệu thanh toán được nêu rõ.

## 2026-07-17 - Chuẩn hóa hợp đồng xác định (v0.4.0)

- Giải quyết xung đột giữa quyết định không thanh toán một phần và
  `collectedAmount`: Giai đoạn 1 hiện ghi nhận một lần thu trực tiếp toàn bộ với
  `PaidAmount = Amount` và `PAID` theo cách nguyên tử.
- Bổ sung các hợp đồng miễn/hủy rõ ràng cho quản trị viên, phân trang/thứ tự xác
  định, chính sách ngày `Asia/Ho_Chi_Minh`, hành vi xung đột ở trạng thái kết
  thúc và traceability yêu cầu đầy đủ.
- Thay thế kế hoạch/nhiệm vụ đối soát cấp cao bằng FE09-T013 đến FE09-T020; bằng
  chứng TD-001/002/003 lịch sử vẫn tách biệt với phần hoàn thành v0.4.0.
- Cập nhật `TEST_PLAN.md` với các mục tiêu không thanh toán một phần, siêu dữ
  liệu đầy đủ, timezone, tính nguyên tử, trạng thái kết thúc, phân giải bởi quản
  trị viên, phân trang và tích hợp FE07/FE12.
- Chốt xung đột trạng thái kết thúc thành `409 FINE_NOT_COLLECTIBLE`,
  `409 FINE_NOT_PAYABLE` và `409 FINE_NOT_RESOLVABLE`; chốt xác thực lý do
  thành `REASON_REQUIRED` hoặc `REASON_TOO_LONG`.
- Loại bỏ phần diễn đạt audit/sắp xếp tùy chọn còn lại và làm rõ khả năng hiển
  thị tiền phạt đã được phân giải cùng các trạng thái kết thúc.
- Bổ sung ánh xạ kế hoạch kiểm thử rõ ràng cho toàn bộ ID NFR về bảo mật, giao
  dịch, hiệu năng, ghi log, khả dụng và thời gian nghiệp vụ của FE09.
- Sửa `CONTEXT.md` để khớp các trường siêu dữ liệu thanh toán SQL hiện tại, đồng
  thời chỉ giữ ghi chú thu tiền trong siêu dữ liệu audit.

## 2026-06-10

- Tạo cấu trúc đặc tả tính năng Quản lý tiền phạt FE09.
- Thiết lập các tệp đặc tả: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md và
  CHANGELOG.md.
- Cập nhật chủ sở hữu hiện tại và phạm vi phân công sau khi phân bổ lại nhóm:
  UC41-UC44 và FT42-FT45 do Dung sở hữu.
- Căn chỉnh lại chủ sở hữu FE09 với `Library Management (5).xlsx`.
- Áp dụng quyết định baseline dùng chung của Giai đoạn 1 cho tiền phạt quá hạn:
  5.000 VND cho mỗi ngày quá hạn trên mỗi bản sao, tính từ ngày sau ngày đến hạn.
- Giữ cổng thanh toán trực tuyến ngoài phạm vi và giới hạn FE09 ở tính toán tiền
  phạt, ghi nhận thu tiền và trạng thái đã thanh toán.
- Làm rõ chính sách hợp đồng API để các endpoint REST có thể nằm trong
  SPEC.md trừ khi nhóm đưa lại tệp hợp đồng API dùng chung.
- Giải quyết phụ thuộc chặn mượn FE09/FE07: bất kỳ khoản tiền phạt `UNPAID` nào
  có số tiền lớn hơn 0 đều chặn mượn mới và gia hạn trong FE07.

## 2026-06-10 - Đã duyệt các quyết định review Giai đoạn 1

- Duyệt các quyết định câu hỏi mở từ
  `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Cập nhật trạng thái quyết định trong `SPEC.md` từ draft/proposed/open thành
  approved ở những nơi phù hợp.
- Giữ rõ các kiểm soát phạm vi Giai đoạn 1 và hạng mục công việc tương lai bị
  hoãn.

## 2026-06-21

- Bổ sung ghi chú căn chỉnh prototype: giao diện FE09 hiện tại có thể giữ bản
  ghi tiền phạt cục bộ để đảm bảo tính liên tục của bản demo, trong khi phần
  triển khai cuối cùng phải sử dụng tính toán và lưu trữ phía máy chủ.
- Làm rõ rằng ngăn chặn trùng lặp, ghi nhận thu tiền và đánh dấu đã thanh toán
  vẫn là trách nhiệm phía máy chủ cho tính năng FE09 đã hoàn thành.

## 2026-06-22

- Bổ sung ghi chú chênh lệch prototype vào `PLAN.md` và `TASKS.md`.
- Làm rõ rằng code backend/frontend FE09 hiện có vẫn là code prototype/demo cho
  đến khi được đối soát với các nhiệm vụ đã duyệt, tính toán/lưu trữ tiền phạt
  phía máy chủ, tích hợp chặn mượn, phân quyền, thẻ traceability và kiểm thử.

## 2026-06-25

- Bổ sung mục `10.3 State Model & Transition Rules (Fine)`, chính thức hóa vòng
  đời `Fine.status` (Mermaid `stateDiagram-v2`, mô tả trạng thái, chuyển đổi
  hợp lệ/không hợp lệ và các bất biến).
- Tập trạng thái lấy trực tiếp từ các giá trị đã duyệt trong 10.2: `UNPAID`,
  `PAID`, `WAIVED`, `CANCELLED`. Không có trạng thái `PARTIALLY_PAID` theo
  Q-FE09-003 (không thanh toán một phần trong Giai đoạn 1).
- Tài liệu hóa tính idempotency / ngăn chặn trùng lặp và tính bất biến của
  `amount` như các bất biến rõ ràng và chuyển đổi bị cấm; truy vết đến
  FR/BR/AF/EC/NFR.
- Nâng phiên bản `0.1.0` → `0.2.0` (MINOR) và cập nhật `Last Updated` thành
  2026-06-25; Status giữ `APPROVED`.

## 2026-06-25 - Triển khai phía máy chủ (TD-001/002/003)

- Triển khai lớp backend FE09 phù hợp production cùng với prototype được giữ
  lại (quyết định: "Backend + keep FE", chủ sở hữu Dung; do Nhat triển khai):
  - `repositories/fineRepository.js` — truy cập DB có giao dịch và ngăn chặn
    trùng lặp đã khóa.
  - `services/fineManagementService.js` — tính tiền quá hạn phía máy chủ
    (5.000 VND/ngày từ ngày sau ngày đến hạn), ngăn chặn trùng lặp, thu tiền
    (PAID khi và chỉ khi thu đủ), đánh dấu đã thanh toán, miễn/hủy bởi quản
    trị viên và ghi log audit.
  - `controllers/fineManagementController.js` + mở rộng
    `routes/fineRoutes.js`, cung cấp các endpoint SPEC §11
    (`/calculate`, `/me`, `/{id}/collections`, `PATCH /{id}/paid`,
    waive/cancel); các route CRUD cũ được giữ cho giao diện demo.
- Số tiền được tính không còn tin dữ liệu đầu vào từ client
  (BR-FE09-007/008, NFR-FE09-SEC-004).
- Gắn thẻ FR-FE09-001..010 bằng `@spec` → traceability 100%; bổ sung
  `tests/fineManagementRoutes.test.js` (11 kiểm thử, AC-FE09-001..010) với
  repository double trong bộ nhớ.
- Cập nhật `database/Librarymanagement.sql` `CK_Fines_Status` để bao gồm
  `CANCELLED` (khớp mô hình trạng thái §10.3).
- `PLAN.md`/`TASKS.md` đã chuyển từ NOT STARTED → READY FOR REVIEW;
  TD-001/002/003 đã đóng. Căn chỉnh frontend vẫn là TD-004.

## 2026-06-30

- Nâng phiên bản `SPEC.md` lên 0.3.0 và cập nhật Last Updated thành 2026-06-30.
- Làm rõ quy trình thu tiền phạt Giai đoạn 1: thủ thư/quản trị viên ghi nhận thu
  tiền trực tiếp; thu đủ sẽ giải quyết tiền phạt thành `PAID`; không cần bước
  sidebar xác nhận/từ chối thanh toán của quản trị viên trừ khi được duyệt sau.
- Bổ sung hướng dẫn thứ tự danh sách tiền phạt ổn định: danh sách tiền phạt của
  thủ thư mặc định tăng dần theo ID tiền phạt.
- Bổ sung BR-FE09-017..018, FR-FE09-011..013, AC-FE09-011..012, EC-FE09-011 và
  Q-FE09-008..009.
- Cập nhật hợp đồng API `/api/fines` để bao gồm `q?` và `sort?` với thứ tự mặc
  định tăng dần theo ID tiền phạt.

## 2026-07-18 - Căn chỉnh bố cục Thủ thư

- Căn chỉnh thống kê tiền phạt, hướng dẫn chính sách, biểu mẫu, thẻ chi tiết và
  nút hành động với hệ thống thị giác kem-nâu dùng chung cho thủ thư.
- Cải thiện khoảng cách và phân cấp thành phần mà không thay đổi hành vi tính
  toán hoặc lưu trữ FE09.
- Thay màn hình minh họa dùng bộ nhớ trình duyệt bằng quy trình máy chủ FE09
  chuẩn và loại bỏ thông báo dữ liệu minh họa.
- Kết nối danh sách nhân viên với các trường SQL-backed về tiền phạt, thành
  viên, chi tiết mượn, sách và mã vạch, cùng thứ tự FineId tăng dần, tìm kiếm,
  lọc trạng thái, làm mới và phân trang.
- Thay thế các điều khiển sửa/xóa tùy ý bằng các chuyển đổi trạng thái có thể
  truy vết: tính toán, thu tiền trực tiếp toàn phần/đánh dấu đã thanh toán, cùng
  miễn/hủy chỉ dành cho Quản trị viên với lý do bắt buộc.
