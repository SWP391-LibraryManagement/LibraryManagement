# CHANGELOG.md - FE12 Báo cáo và thống kê

## 2026-08-01 - Chuẩn hóa văn phong tiếng Việt

- Viết lại câu chữ trong `CONTEXT.md`, `SPEC.md`, `PLAN.md`, `TASKS.md`,
  `TEST_PLAN.md` và `CHANGELOG.md` để dễ đọc, giảm cách diễn đạt nặng tính kỹ
  thuật và thống nhất thuật ngữ tiếng Việt.
- Không thay đổi quy tắc nghiệp vụ, quyền hạn, API, cấu trúc dữ liệu, mã định
  danh, trạng thái, số liệu kiểm thử hoặc bằng chứng triển khai của FE12.

## 2026-08-01 - Đóng truy vết triển khai 100%

- Trang tổng quan dùng bản tổng hợp FE12 và liên kết xem chi tiết cố định đã
  được triển khai vào `FR-FE12-015` trên đúng môi trường thực tế.
- Đổi siêu dữ liệu triển khai sang `COMPLETE`; không thay đổi KPI, truy vấn, API,
  tầng truy cập dữ liệu, đồng hồ nghiệp vụ hoặc quyền truy cập báo cáo.
- Bản hoàn tất `6189b1a` đã hợp nhất qua PR #89 thành `main@39092fb`; CI
  `30675444178` và môi trường thử nghiệm Azure `30675744992` đều đạt đúng commit.

## 2026-07-29 - Đồng bộ trạng thái phát hành sau hợp nhất (v0.3.1)

- Xác nhận phạm vi FE12 đã hợp nhất vào `main` và CI sau hợp nhất đạt.
- Ghi rõ môi trường thử nghiệm Azure chưa thể chấp nhận do Azure SQL đang `Paused` sau khi hết quota;
  không xem đây là bằng chứng triển khai thành công.

## 2026-07-29 - Kích hoạt tổng quan vận hành và nguồn thời gian nhất quán (v0.3.0)

- Thêm BR-FE12-017..020, FR-FE12-012..015 và AC-FE12-012..016.
- Chốt bản tổng hợp chỉ đọc gồm sáu KPI và liên kết cố định từ trang tổng quan
  đến màn hình chi tiết.
- Chốt cách tính số bản có thể mượn: chỉ sách `ACTIVE` và bản sao `AVAILABLE` được
  tính vào `availableCopies`; `lowStockBooks` chỉ xét sách `ACTIVE`.
- Ghi phát hiện ở mốc SIT-002/SIT-008: tầng truy cập dữ liệu dùng đồng hồ máy
  chủ làm sai lệch phân loại quá hạn. Bản sửa bắt buộc là để tầng dịch vụ quản
  lý `businessDate` cho SQL và
  tính đồng nhất với bản trong bộ nhớ, không đổi trạng thái mong đợi.
- Điều kiện tiên quyết ngày nghiệp vụ đã hợp nhất qua PR #81; phần v0.3.0 chỉ còn mở rộng
  tổng quan vận hành trên hợp đồng đã triển khai.
- Chưa thay đổi mã nguồn sản phẩm/cấu trúc dữ liệu cho tổng quan vận hành; H1 đã duyệt và
  activation đang chờ H3/hợp nhất.

## 2026-07-29 - Điều kiện tiên quyết ngày nghiệp vụ báo cáo mượn (v0.2.1)

- Làm rõ tầng dịch vụ sở hữu một `businessDate` `Asia/Ho_Chi_Minh` cho mỗi yêu cầu.
- Bắt buộc SQL/trong bộ nhớ tầng truy cập dữ liệu nhận ngày hợp lệ tường minh và từ chối ngay
  trước khi truy vấn nếu thiếu/sai.
- Loại phụ thuộc vào đồng hồ máy chủ hoặc đồng hồ toàn cục giả khỏi bằng chứng SIT-002/SIT-008.
- Hợp nhất PR #81 thành `main@0d064b5`; CI đúng commit và CI sau hợp nhất đều đạt.

## 2026-07-27 - Đặc tả danh sách cho phép truy vấn báo cáo chính xác (v0.2.0)

- Xác định danh sách cho phép khóa truy vấn chính xác riêng cho API mượn, kho và thống
  kê người dùng.
- Yêu cầu khóa không rõ trả an toàn
  `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` trước khi tầng dịch vụ hoặc tầng truy cập dữ liệu báo
  cáo thực thi.
- Giữ xác thực hiện có cho giá trị đã phê duyệt, báo cáo rỗng ID không rõ có định
  dạng hợp lệ, SQL có tham số, phân trang/thứ tự ổn định và hành vi chỉ đọc.
- Thêm trường truy vấn `membershipStatus` và `location` trước đó ngầm định vào hợp
  đồng trường dữ liệu.
- Nhat phê duyệt SPEC bằng văn bản ngày 2026-07-27, chỉ cho phép chuẩn bị PLAN/
  TASKS; mục này không khẳng định mã hay kiểm thử.

## 2026-07-23 - Đưa phân trang chi tiết vào ảnh chụp SQL

- Materialize mỗi nguồn báo cáo đã lọc một lần mỗi yêu cầu, tính tổng và chỉ số
  nhóm trong SQL, trả trang chi tiết ổn định bằng `OFFSET/FETCH`.
- Chỉ trả resultset tổng hợp hữu hạn cùng trang chi tiết yêu cầu thay vì chuyển
  toàn bộ ảnh chụp đã lọc tới Node.
- Đếm ngày phê duyệt tư cách thành viên lịch sử khác null trong chỉ số tăng
  trưởng ngay cả khi tư cách thành viên hoặc trạng thái tài khoản hiện tại không
  hoạt động.
- Căn chỉnh report tầng truy cập dữ liệu trong bộ nhớ với SQL cho đối sánh `q` người dùng
  trên ID/vai trò/trạng thái tài khoản/tư cách thành viên và thứ tự chi tiết
  `UserId ASC` ổn định.
- Khớp ngữ nghĩa ký tự đại diện của `LIKE` SQL có tham số trong tầng truy cập dữ liệu báo cáo
  kiểm thử trong bộ nhớ người dùng mà không đổi API môi trường thực tế hay trường truy vấn.
- Thêm hàng truy vết BR-FE12-016, FR-FE12-011 và AC-FE12-011 còn thiếu, sửa tổng
  độ bao phủ thành `16/11/11`.

## 2026-07-21 - Hoàn tất tìm kiếm và bộ lọc báo cáo

- Thêm tìm kiếm `q` phía máy chủ cho cả ba báo cáo nhân viên và hiển thị bộ lọc đã
  phê duyệt trong UI Librarian/Admin.
- Đổi thứ tự chi tiết người dùng thành `UserId` tăng dần, loại thông báo tải
  thành công dư.
- Thêm yêu cầu và kiểm thử FE12 cho hành vi tìm kiếm/lọc kết hợp và dữ liệu báo
  cáo liên tính năng chuẩn.

## 2026-07-20 - Bản địa hóa UI tiếng Việt và typography

- Bản địa hóa nhãn, trạng thái, tên accessibility và phản hồi lỗi an toàn do
  frontend tạo cho tính năng này.
- Giữ hợp đồng API, giá trị enum thô, quyền, quy tắc nghiệp vụ và dữ liệu
  catalog/hồ sơ do người dùng sở hữu.
- Áp dụng hợp đồng typography body `Be Vietnam Pro` và commiting `Noto Serif`
  dùng chung với dự phòng hỗ trợ Unicode.

## 2026-07-19 - Hoàn tất thoát Giai đoạn 2

- feat-reporting-statistics được chấp nhận trong đối soát FE01-FE12 Giai đoạn 2
  hoàn tất do PR #40/#41 ghi; ranh giới xác thực và tồn dư được hợp nhất trong
  `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Giới hạn phạm vi hoãn và tương lai vẫn rõ ràng, không bị hoàn tất này mở rộng.

## 2026-07-19 - Đối soát triển khai quy tắc cho kết quả ổn định

- Thay dữ liệu gửi báo cáo cũ bằng hợp đồng `{ metrics, rows, page, limit, totalRows }`
  chính xác xuyên backend, OpenAPI, phần sử dụng frontend và kiểm thử liên tính
  năng.
- Thêm xác thực page/limit, thứ tự ổn định riêng báo cáo, hành vi ID/trạng thái
  không rõ theo quy tắc đã duyệt và tuần tự hóa trường ngày không kèm giờ của bản ghi mượn.
- Cho phép cả Librarian và Admin xem cả ba báo cáo, làm mọi lượt xem thành công
  ghi siêu dữ liệu an toàn không có bộ lọc hay hàng.
- Áp dụng bộ lọc trạng thái/vị trí kho vào cùng bản sao trong khi giữ lượng sẵn
  có hiệu dụng toàn sách cho tính toán tồn thấp.
- Đánh giá ranh giới ngày kỳ phê duyệt người dùng trong SQL mà không thu hẹp
  chỉ số người dùng/trạng thái/vai trò toàn cục.
- Thêm kiểm thử hồi quy cho quy tắc tạo kết quả ổn định, tầng truy cập dữ liệu, cấu trúc phản hồi frontend và
  không-xuất; bộ tự động đầy đủ, lint, build, truy vết và vệ sinh phần thay đổi đạt.
- Gắn lọc quá hạn vào cùng ngày nghiệp vụ `Asia/Ho_Chi_Minh` do ứng dụng tính,
  dùng bởi tổng hợp báo cáo, loại dự phòng `RequestDate` không hợp lệ khi thiếu
  `BorrowDate` và căn chỉnh bộ lọc `OVERDUE` trong bộ nhớ với hành vi
  trạng thái dẫn xuất trong môi trường thực tế.
- Loại dữ liệu kiểm thử cũ `DEMO_REPORTS` không dùng để công việc báo cáo tương lai
  không thể âm thầm dùng lại dữ liệu gửi lỗi thời.
- Chấp nhận Playwright mới đạt trên cả ba màn hình báo cáo chuẩn, lọc kết quả
  bằng không, tràn điện thoại, từ chối Member và chuyển hướng Guest.
- Tích hợp hệ thống SQL-backed hiện đạt trên SQL Server dùng một lần có bằng
  chứng dọn dẹp; rà soát lại con người và mọi quyết định commit/push/hợp nhất vẫn
  chờ.

## 2026-07-17 - Mốc chuẩn Giai đoạn 1 được phê duyệt

- Nhật phê duyệt bộ lọc báo cáo FE12, phản hồi ổn định, xử lý phía cơ sở dữ liệu,
  kiểm toán và quy tắc xuất ngoài phạm vi đã chuẩn hóa làm mốc chuẩn Giai đoạn 1; phần
  theo dõi triển khai vẫn chờ.

## 2026-07-17 - Rà soát hợp đồng bộ lọc và truy vấn cuối

- Thay ví dụ bộ lọc mở bằng trường truy vấn chính xác cho từng báo cáo.
- Làm rõ lọc phía cơ sở dữ liệu và ghi lỗi an toàn là yêu cầu performance/logging
  rõ ràng.

## 2026-07-17 - Hợp đồng phản hồi báo cáo xác định - v0.1.6

- Thêm cấu trúc dữ liệu chỉ số chính xác và danh sách chi tiết cho báo cáo mượn, kho và người
  dùng.
- Xác định ngữ nghĩa ngày, giới hạn/quy tắc phân hạng sách hàng đầu và cấu trúc phản hồi
  báo cáo.

## 2026-07-17 - Quy tắc báo cáo xác định - v0.1.5

- Đổi `SPEC.md` thành `READY FOR REVIEW` trong khi giữ phạm vi nền hoàn tất làm
  bằng chứng lịch sử.
- Xác nhận cả Librarian và Admin có thể truy cập báo cáo mượn, kho và thống kê
  người dùng.
- Chuẩn hóa ID không rõ có định dạng hợp lệ thành báo cáo rỗng và trạng thái đã
  lưu không rõ thành nhóm `UNKNOWN`.
- Thêm phân trang/thứ tự chi tiết xác định và làm kiểm toán lượt xem báo cáo thành
  công bắt buộc.
- Khóa mọi xuất báo cáo hoàn toàn ngoài Giai đoạn 1, thay mục truy vết `TBD` bằng
  kiểm thử hợp đồng ngoài phạm vi.

## 2026-07-13 - Tích hợp B7 và hoàn tất rà soát

- Nhat xác nhận cổng rà soát con người và chọn hợp nhất cục bộ sau rà soát lại FE12
  sạch.
- Commit `58747bc10657ed1accb44950ae0c5edbd178a242` tới `main` và được push lên
  `origin/main`.
- GitHub Actions CI `29249491818` đạt cho cùng commit, gồm truy vết, kiểm thử
  backend, kiểm tra mã/kiểm thử/bản dựng frontend và kiểm tra khả năng nạp ứng
  dụng backend.
- Thêm `.sdd/reviews/fe12-b7-integration-review-closeout-2026-07-13.md` với
  bằng chứng tích hợp, kiểm soát phạm vi, tài liệu và theo dõi còn lại.
- Xuất CSV/PDF, trang tổng quan, tích hợp BI và lỗi đăng xuất trong khung ứng
  dụng dùng chung vẫn ngoài FE12.

## 2026-07-13 - Khắc phục rà soát cuối

- Đọc thể loại kho từ cấu trúc phản hồi bộ điều khiển siêu dữ liệu được ủy quyền.
- Khớp hàng tồn thấp trong bộ nhớ với phản hồi môi trường thực tế có siêu dữ liệu thể loại và
  chi tiết bản sao.
- Sửa dữ liệu kiểm thử tính đồng nhất, dùng bản ghi thể loại rõ ràng và trạng thái bản sao sách hợp
  lệ trong môi trường thực tế.
- Loại chi tiết `REQUESTED` khỏi chỉ số hoạt động kỳ-mượn/sách hàng đầu trong
  khi đếm mọi trạng thái khoản mượn thực.
- Tài liệu hóa `Members` là nguồn khi chạy cho dữ liệu trạng thái tư cách thành
  viên và thống kê người dùng `ApprovedAt`.
- Cập nhật `SPEC.md` lên phiên bản 0.1.4.

## 2026-07-13 - Khắc phục rà soát độc lập

- Căn chỉnh hàm hỗ trợ báo cáo mượn trong bộ nhớ với ngữ nghĩa lọc và tổng hợp hàng join
  môi trường thực tế.
- Căn chỉnh tổng hợp vai trò, trạng thái và tư cách thành viên của người dùng
  được chọn với ngữ nghĩa hàng SQL môi trường thực tế.
- Tài liệu hóa cấu trúc dữ liệu dữ liệu gửi thành công báo cáo FE12 và enum trạng thái bộ lọc
  khi chạy chính xác trong OpenAPI.
- Cập nhật siêu dữ liệu đặc tả FE12 lên phiên bản 0.1.3.

## 2026-06-10

- Tạo cấu trúc đặc tả tính năng FE12 Báo cáo và thống kê.
- Thiết lập các tệp đặc tả: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md và
  CHANGELOG.md.
- Cập nhật chủ sở hữu và phạm vi phân công hiện tại sau phân công lại đội:
  UC58-UC60 và FT59-FT61 do Nhat sở hữu.
- Xác định FE12 là tính năng báo cáo chỉ đọc cho báo cáo mượn, báo cáo kho và
  thống kê người dùng.
- Làm rõ quy tắc hợp đồng API để API REST có thể ở lại SPEC.md trừ khi đội
  đưa lại tệp hợp đồng API dùng chung.

## 2026-06-10 - Quyết định rà soát Giai đoạn 1 được phê duyệt

- Phê duyệt quyết định câu hỏi mở từ
  `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Cập nhật trạng thái quyết định `SPEC.md` từ draft/proposed/open thành approved
  nơi phù hợp.
- Giữ kiểm soát phạm vi Giai đoạn 1 và hạng mục công việc tương lai hoãn rõ
  ràng.

## 2026-06-10 - Phạm vi backend sẵn sàng rà soát

- Thêm checklist kế hoạch và nhiệm vụ FE12 cho phạm vi báo cáo Nhat.
- Thêm API báo cáo mượn, kho và thống kê người dùng chỉ đọc.
- Thêm xác thực bộ lọc, xử lý kết quả bằng không, bảo vệ vai trò và kiểm toán log
  cho truy cập báo cáo thành công.
- Thêm kiểm thử backend cho chỉ số báo cáo, hành vi kết quả bằng không, loại dữ
  liệu cá nhân, khoảng không hợp lệ và kiểm soát truy cập.

## 2026-06-25 - Ma trận truy vết hoàn tất

- Hoàn tất Ma trận truy vết bao phủ mọi ID BR/FR/AC (thêm ánh xạ AC).

## 2026-06-20 - UI frontend đã triển khai và accessibility đã xác thực

- Triển khai màn hình báo cáo mượn, kho và thống kê người dùng với bộ lọc ngày,
  bộ lọc thể loại và component biểu đồ.
- Nối mọi màn hình frontend với API backend dùng axios và React hook.
- Thêm chú thích bảng, thuộc tính `scope` cho tiêu đề cột, nhãn hỗ trợ công cụ
  trợ năng cho ô ngày, danh sách chọn và nút phân trang.
- Thêm trạng thái tải, rỗng và lỗi trên mọi màn hình đã rà soát.
- Xác thực: `npm.cmd --prefix frontend run lint`,
  `npm.cmd --prefix frontend run build`, `npm.cmd --prefix backend test`.
- Hợp nhất qua PR #7 vào `feat/fe07-fe08-fe10-fe12-ui-polish`.

## 2026-07-10 - Hoàn tất bộ lọc thể loại kho

- Thêm selector thể loại còn thiếu vào màn hình báo cáo kho và tải tùy chọn từ
  API siêu dữ liệu sách hiện có.
- Áp dụng `categoryId` đã chọn vào `GET /api/reports/inventory`, có điều khiển
  đặt lại để trả về mọi thể loại.
- Thêm kiểm thử frontend tập trung cho tham số truy vấn báo cáo kho.

## 2026-07-13 - Củng cố xác thực B6

- Sửa cách đếm trạng thái yêu cầu mượn để phép join danh sách chi tiết không nhân bản tổng yêu
  cầu.
- Làm bộ lọc `toDate` chỉ gồm ngày bao gồm cả ngày đã chọn bằng ranh giới loại trừ của ngày kế tiếp
  loại trừ.
- Dựa kỳ thành viên mới vào `Members.ApprovedAt` thay vì thời điểm tạo tài
  khoản.
- Đếm thể loại kho theo sách duy nhất, hiển thị tổng/bản sao sẵn có cho hàng tồn
  thấp.
- Thêm ghi kiểm toán an toàn cho truy cập FE12 thất bại và căn chỉnh OpenAPI với bộ
  lọc đã triển khai.
- Thêm guard tuyến API báo cáo frontend, loại thống kê dự phòng demo bịa đặt và khôi
  phục tùy chọn thể loại từ dữ liệu gửi siêu dữ liệu được ủy quyền.
- Thêm quy tắc bố cục báo cáo đáp ứng cho nội dung flex thu nhỏ, split báo cáo
  điện thoại một cột và bộ lọc ngày an toàn trên điện thoại.
- Thêm thông báo lỗi API riêng FE12 để lỗi backend không bao giờ khẳng định dữ
  liệu dự phòng demo.
- Thêm kiểm thử hồi quy backend/frontend tập trung và ghi bằng chứng xác thực tự
  động B6.
- Hoàn tất xác thực trình duyệt mới cho truy cập Admin/Member/Guest, cả ba màn
  hình báo cáo, lọc kho, trạng thái tải/rỗng/lỗi và hành vi tràn máy tính/điện thoại.
- Loại giá trị truy vấn/filter thô khỏi mục kiểm toán báo cáo thành công.
- Làm rõ ngữ nghĩa ngày báo cáo người dùng: tổng toàn cục không đổi trong khi
  tăng trưởng thành viên dùng `Members.ApprovedAt` trong khoảng ngày bao hàm tùy
  chọn.
- Ép ngày báo cáo `YYYY-MM-DD` chính xác và tài liệu hóa phản hồi `400` cho mọi
  API FE12.
- Loại mặc định ngày mẫu cố định, bỏ tham số truy vấn ngày trống trên trang báo cáo.
- Căn chỉnh hành vi tồn thấp qua backend, UI và test double tại hai hoặc ít hơn
  bản sao sẵn có.
- Giữ lượng sẵn có toàn bản sao cho tính toán tồn thấp khi bộ lọc trạng thái/vị
  trí chọn sách và bao gồm sách không có bản sao vật lý.
- Sửa nhãn biểu đồ thể loại kho để mô tả số sách duy nhất.
- Củng cố kiểm thử tích hợp khoảng ngày mượn với dữ liệu nguồn thực và hành vi
  lọc trong bộ nhớ khớp.

## 2026-07-22

- Xác minh mọi bộ lọc/biểu đồ báo cáo vẫn do backend sở hữu và giảm khoảng cách
  đáy chỉ-báo-cáo.

## 2026-07-29 - Điểm kết thúc báo cáo của luồng liên hoàn v0.9.0

- Giữ FE12 là điểm quan sát chỉ đọc: không thêm chuyển đổi nghiệp vụ mới và không sao chép logic FE07/FE08/FE10 vào frontend.
- Xác minh bảng tổng quan vận hành sau chuỗi phê duyệt, đặt chỗ, trả, giữ và mượn đúng bản sao bằng cả UI lẫn bản tổng hợp API gồm đủ sáu KPI.
- Bằng chứng cục bộ: SIT 11/11; luồng Playwright liên hoàn 1/1; trace FE12 đạt 14/15 (93%).
- Phần thay đổi sản phẩm vẫn chưa được đưa vào vùng chờ, commit hoặc đẩy lên
  kho mã; đang chờ duyệt H2.
