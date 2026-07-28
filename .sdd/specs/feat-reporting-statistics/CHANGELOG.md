# CHANGELOG.md - FE12 Báo cáo và thống kê

## 2026-07-29 - Prerequisite ngày nghiệp vụ báo cáo mượn (v0.2.1)

- Làm rõ service sở hữu một `businessDate` `Asia/Ho_Chi_Minh` cho mỗi request.
- Bắt buộc SQL/in-memory repository nhận ngày hợp lệ tường minh và fail-fast
  trước khi truy vấn nếu thiếu/sai.
- Loại phụ thuộc host clock/fake global clock khỏi bằng chứng SIT-002/SIT-008.

## 2026-07-27 - Đặc tả allowlist query báo cáo chính xác (v0.2.0)

- Xác định allowlist khóa query chính xác riêng cho endpoint mượn, kho và thống
  kê người dùng.
- Yêu cầu khóa không rõ trả an toàn
  `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` trước khi service hoặc repository báo
  cáo thực thi.
- Giữ xác thực hiện có cho giá trị đã phê duyệt, báo cáo rỗng ID không rõ có định
  dạng hợp lệ, SQL có tham số, phân trang/thứ tự ổn định và hành vi chỉ đọc.
- Thêm trường query `membershipStatus` và `location` trước đó ngầm định vào hợp
  đồng trường dữ liệu.
- Nhat phê duyệt SPEC bằng văn bản ngày 2026-07-27, chỉ cho phép chuẩn bị PLAN/
  TASKS; mục này không khẳng định mã hay kiểm thử.

## 2026-07-23 - Đưa phân trang chi tiết vào ảnh chụp SQL

- Materialize mỗi nguồn báo cáo đã lọc một lần mỗi yêu cầu, tính tổng và metric
  nhóm trong SQL, trả trang chi tiết ổn định bằng `OFFSET/FETCH`.
- Chỉ trả resultset tổng hợp hữu hạn cùng trang chi tiết yêu cầu thay vì chuyển
  toàn bộ ảnh chụp đã lọc tới Node.
- Đếm ngày phê duyệt tư cách thành viên lịch sử khác null trong metric tăng
  trưởng ngay cả khi tư cách thành viên hoặc trạng thái tài khoản hiện tại không
  hoạt động.
- Căn chỉnh report repository in-memory với SQL cho đối sánh `q` người dùng
  trên ID/vai trò/trạng thái tài khoản/tư cách thành viên và thứ tự chi tiết
  `UserId ASC` ổn định.
- Khớp ngữ nghĩa wildcard `LIKE` SQL có tham số hiện có trong report repository
  kiểm thử in-memory người dùng mà không đổi API production hay trường query.
- Thêm hàng truy vết BR-FE12-016, FR-FE12-011 và AC-FE12-011 còn thiếu, sửa tổng
  coverage thành `16/11/11`.

## 2026-07-21 - Hoàn tất tìm kiếm và bộ lọc báo cáo

- Thêm tìm kiếm `q` phía máy chủ cho cả ba báo cáo staff và hiển thị bộ lọc đã
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
- Áp dụng hợp đồng typography body `Be Vietnam Pro` và heading `Noto Serif`
  dùng chung với fallback hỗ trợ Unicode.

## 2026-07-19 - Closeout thoát Giai đoạn 2

- feat-reporting-statistics được chấp nhận trong đối soát FE01-FE12 Giai đoạn 2
  hoàn tất do PR #40/#41 ghi; ranh giới xác thực và tồn dư được hợp nhất trong
  `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Giới hạn phạm vi hoãn và tương lai vẫn rõ ràng, không bị closeout này mở rộng.

## 2026-07-19 - Đối soát triển khai policy xác định

- Thay payload báo cáo legacy bằng hợp đồng `{ metrics, rows, page, limit, totalRows }`
  chính xác xuyên backend, OpenAPI, consumer frontend và kiểm thử liên tính
  năng.
- Thêm xác thực page/limit, thứ tự ổn định riêng báo cáo, hành vi ID/trạng thái
  không rõ chuẩn và tuần tự hóa hàng mượn chỉ-ngày.
- Cho phép cả Librarian và Admin xem cả ba báo cáo, làm mọi lượt xem thành công
  ghi metadata an toàn không có bộ lọc hay hàng.
- Áp dụng bộ lọc trạng thái/vị trí kho vào cùng bản sao trong khi giữ lượng sẵn
  có hiệu dụng toàn sách cho tính toán tồn thấp.
- Đánh giá ranh giới ngày kỳ phê duyệt người dùng trong SQL mà không thu hẹp
  metric người dùng/trạng thái/vai trò toàn cục.
- Thêm bao phủ hồi quy policy xác định, repository, frontend-envelope và
  không-xuất; suite tự động đầy đủ, lint, build, truy vết và vệ sinh diff đạt.
- Gắn lọc quá hạn vào cùng ngày nghiệp vụ `Asia/Ho_Chi_Minh` do ứng dụng tính,
  dùng bởi tổng hợp báo cáo, loại fallback `RequestDate` không hợp lệ khi thiếu
  `BorrowDate` và căn chỉnh bộ lọc `OVERDUE` in-memory với hành vi
  derived-status production.
- Loại fixture legacy `DEMO_REPORTS` không dùng để công việc báo cáo tương lai
  không thể âm thầm dùng lại payload lỗi thời.
- Chấp nhận Playwright mới đạt trên cả ba màn hình báo cáo chuẩn, lọc kết quả
  bằng không, tràn mobile, từ chối Member và chuyển hướng Guest.
- Tích hợp hệ thống SQL-backed hiện đạt trên SQL Server dùng một lần có bằng
  chứng cleanup; re-review con người và mọi quyết định commit/push/merge vẫn
  chờ.

## 2026-07-17 - Baseline Giai đoạn 1 được phê duyệt

- Nhật phê duyệt bộ lọc báo cáo FE12, phản hồi xác định, xử lý phía cơ sở dữ liệu,
  audit và policy xuất ngoài phạm vi đã chuẩn hóa làm baseline Giai đoạn 1; phần
  theo dõi triển khai vẫn chờ.

## 2026-07-17 - Audit hợp đồng bộ lọc và query cuối

- Thay ví dụ bộ lọc mở bằng trường query chính xác cho từng báo cáo.
- Làm rõ lọc phía cơ sở dữ liệu và ghi lỗi an toàn là yêu cầu performance/logging
  rõ ràng.

## 2026-07-17 - Hợp đồng phản hồi báo cáo xác định - v0.1.6

- Thêm schema metric chính xác và hàng chi tiết cho báo cáo mượn, kho và người
  dùng.
- Xác định ngữ nghĩa ngày, giới hạn/giải hòa sách hàng đầu và envelope phản hồi
  báo cáo.

## 2026-07-17 - Policy báo cáo xác định - v0.1.5

- Đổi `SPEC.md` thành `READY FOR REVIEW` trong khi giữ lát cắt base hoàn tất làm
  bằng chứng lịch sử.
- Xác nhận cả Librarian và Admin có thể truy cập báo cáo mượn, kho và thống kê
  người dùng.
- Chuẩn hóa ID không rõ có định dạng hợp lệ thành báo cáo rỗng và trạng thái đã
  lưu không rõ thành nhóm `UNKNOWN`.
- Thêm phân trang/thứ tự chi tiết xác định và làm audit lượt xem báo cáo thành
  công bắt buộc.
- Khóa mọi xuất báo cáo hoàn toàn ngoài Giai đoạn 1, thay mục truy vết `TBD` bằng
  kiểm thử hợp đồng ngoài phạm vi.

## 2026-07-13 - Tích hợp B7 và closeout review

- Nhat xác nhận cổng review con người và chọn merge cục bộ sau re-review FE12
  sạch.
- Commit `58747bc10657ed1accb44950ae0c5edbd178a242` tới `main` và được push lên
  `origin/main`.
- GitHub Actions CI `29249491818` đạt cho cùng commit, gồm truy vết, kiểm thử
  backend, lint/kiểm thử/build frontend và kiểm tra import health backend.
- Thêm `.sdd/reviews/fe12-b7-integration-review-closeout-2026-07-13.md` với
  bằng chứng tích hợp, kiểm soát phạm vi, tài liệu và theo dõi còn lại.
- Xuất CSV/PDF, dashboard, tích hợp BI và lỗi logout-shell dùng chung vẫn ngoài
  FE12.

## 2026-07-13 - Khắc phục review cuối

- Đọc thể loại kho từ envelope controller metadata được ủy quyền.
- Khớp hàng tồn thấp in-memory với phản hồi production có metadata thể loại và
  chi tiết bản sao.
- Sửa fixture parity dùng bản ghi thể loại rõ ràng và trạng thái bản sao sách hợp
  lệ trong production.
- Loại chi tiết `REQUESTED` khỏi metric hoạt động kỳ-mượn/sách hàng đầu trong
  khi đếm mọi trạng thái khoản mượn thực.
- Tài liệu hóa `Members` là nguồn runtime cho dữ liệu trạng thái tư cách thành
  viên và thống kê người dùng `ApprovedAt`.
- Cập nhật `SPEC.md` lên phiên bản 0.1.4.

## 2026-07-13 - Khắc phục review độc lập

- Căn chỉnh helper báo cáo mượn in-memory với ngữ nghĩa lọc và tổng hợp hàng join
  production.
- Căn chỉnh tổng hợp vai trò, trạng thái và tư cách thành viên của người dùng
  được chọn với ngữ nghĩa hàng SQL production.
- Tài liệu hóa schema payload thành công báo cáo FE12 và enum trạng thái bộ lọc
  runtime chính xác trong OpenAPI.
- Cập nhật metadata đặc tả FE12 lên phiên bản 0.1.3.

## 2026-06-10

- Tạo cấu trúc đặc tả tính năng FE12 Báo cáo và thống kê.
- Thiết lập các tệp đặc tả: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md và
  CHANGELOG.md.
- Cập nhật chủ sở hữu và phạm vi phân công hiện tại sau phân công lại đội:
  UC58-UC60 và FT59-FT61 do Nhat sở hữu.
- Xác định FE12 là tính năng báo cáo chỉ đọc cho báo cáo mượn, báo cáo kho và
  thống kê người dùng.
- Làm rõ policy hợp đồng API để endpoint REST có thể ở lại SPEC.md trừ khi đội
  đưa lại tệp hợp đồng API dùng chung.

## 2026-06-10 - Quyết định review Giai đoạn 1 được phê duyệt

- Phê duyệt quyết định câu hỏi mở từ
  `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Cập nhật trạng thái quyết định `SPEC.md` từ draft/proposed/open thành approved
  nơi phù hợp.
- Giữ kiểm soát phạm vi Giai đoạn 1 và hạng mục công việc tương lai hoãn rõ
  ràng.

## 2026-06-10 - Lát cắt backend sẵn sàng review

- Thêm checklist kế hoạch và nhiệm vụ FE12 cho phạm vi báo cáo Nhat.
- Thêm endpoint báo cáo mượn, kho và thống kê người dùng chỉ đọc.
- Thêm xác thực bộ lọc, xử lý kết quả bằng không, bảo vệ vai trò và audit log
  cho truy cập báo cáo thành công.
- Thêm kiểm thử backend cho metric báo cáo, hành vi kết quả bằng không, loại dữ
  liệu cá nhân, khoảng không hợp lệ và kiểm soát truy cập.

## 2026-06-25 - Ma trận truy vết hoàn tất

- Hoàn tất Ma trận truy vết bao phủ mọi ID BR/FR/AC (thêm ánh xạ AC).

## 2026-06-20 - UI frontend đã triển khai và accessibility đã xác thực

- Triển khai màn hình báo cáo mượn, kho và thống kê người dùng với bộ lọc ngày,
  bộ lọc thể loại và component biểu đồ.
- Nối mọi màn hình frontend với API backend dùng axios và React hook.
- Thêm caption bảng, scope header cột, nhãn có thể truy cập cho đầu vào ngày,
  select và nút phân trang.
- Thêm trạng thái tải, rỗng và lỗi trên mọi màn hình đã review.
- Xác thực: `npm.cmd --prefix frontend run lint`,
  `npm.cmd --prefix frontend run build`, `npm.cmd --prefix backend test`.
- Merge qua PR #7 vào `feat/fe07-fe08-fe10-fe12-ui-polish`.

## 2026-07-10 - Hoàn tất bộ lọc thể loại kho

- Thêm selector thể loại còn thiếu vào màn hình báo cáo kho và tải tùy chọn từ
  endpoint metadata sách hiện có.
- Áp dụng `categoryId` đã chọn vào `GET /api/reports/inventory`, có điều khiển
  đặt lại để trả về mọi thể loại.
- Thêm kiểm thử frontend tập trung cho tham số query báo cáo kho.

## 2026-07-13 - Củng cố xác thực B6

- Sửa số trạng thái yêu cầu mượn để hàng chi tiết join không nhân bản tổng yêu
  cầu.
- Làm bộ lọc `toDate` chỉ-ngày gồm cả ngày đã chọn qua ranh giới ngày kế tiếp
  loại trừ.
- Dựa kỳ thành viên mới vào `Members.ApprovedAt` thay vì thời điểm tạo tài
  khoản.
- Đếm thể loại kho theo sách duy nhất, hiển thị tổng/bản sao sẵn có cho hàng tồn
  thấp.
- Thêm ghi audit an toàn cho truy cập FE12 thất bại và căn chỉnh OpenAPI với bộ
  lọc đã triển khai.
- Thêm guard route báo cáo frontend, loại thống kê fallback demo bịa đặt và khôi
  phục tùy chọn thể loại từ payload metadata được ủy quyền.
- Thêm quy tắc layout báo cáo đáp ứng cho nội dung flex thu nhỏ, split báo cáo
  mobile một cột và bộ lọc ngày an toàn trên mobile.
- Thêm thông báo lỗi API riêng FE12 để lỗi backend không bao giờ khẳng định dữ
  liệu fallback demo.
- Thêm kiểm thử hồi quy backend/frontend tập trung và ghi bằng chứng xác thực tự
  động B6.
- Hoàn tất xác thực trình duyệt mới cho truy cập Admin/Member/Guest, cả ba màn
  hình báo cáo, lọc kho, trạng thái tải/rỗng/lỗi và hành vi tràn desktop/mobile.
- Loại giá trị query/filter thô khỏi mục audit báo cáo thành công.
- Làm rõ ngữ nghĩa ngày báo cáo người dùng: tổng toàn cục không đổi trong khi
  tăng trưởng thành viên dùng `Members.ApprovedAt` trong khoảng ngày bao hàm tùy
  chọn.
- Ép ngày báo cáo `YYYY-MM-DD` chính xác và tài liệu hóa phản hồi `400` cho mọi
  endpoint FE12.
- Loại mặc định ngày mẫu cố định, bỏ tham số query ngày trống trên trang báo cáo.
- Căn chỉnh hành vi tồn thấp qua backend, UI và test double tại hai hoặc ít hơn
  bản sao sẵn có.
- Giữ lượng sẵn có toàn bản sao cho tính toán tồn thấp khi bộ lọc trạng thái/vị
  trí chọn sách và bao gồm sách không có bản sao vật lý.
- Sửa nhãn biểu đồ thể loại kho để mô tả số sách duy nhất.
- Củng cố kiểm thử tích hợp khoảng ngày mượn với dữ liệu nguồn thực và hành vi
  lọc in-memory khớp.

## 2026-07-22

- Xác minh mọi bộ lọc/biểu đồ báo cáo vẫn do backend sở hữu và giảm khoảng cách
  đáy chỉ-báo-cáo.
