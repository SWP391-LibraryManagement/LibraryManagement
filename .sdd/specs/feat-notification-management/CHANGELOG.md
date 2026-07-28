# CHANGELOG.md - FE10 Quản lý thông báo

## 2026-07-28 - Hoàn tất giao hàng hộp thư thông báo cá nhân FE10

- H2 sau `main@30f936d` đã phê duyệt fingerprint
  `e123345be05b59a9e519d182b301ab5464160e8fc32aed8d17d3c463e28e0a15`.
- Head PR #75 `778e0a470d8a1083bf571a8007b3c058eee4bb22` đã đạt CI exact-head
  `30317424995` và Azure staging `30317621429`; review H3 theo trục Tiêu chuẩn
  và Đặc tả không có finding có thể hành động, người dùng phê duyệt H3 rõ ràng.
- PR #75 đã merge thành `b75776b10d6cf4b6868d2ba51eb3268073483b8b`. CI hậu
  merge chính xác `30341279111` và Azure staging tự động `30341540847` đã đạt,
  bao gồm preflight migration, backend, frontend và smoke.
- Closeout này chỉ ghi nhận bằng chứng/trạng thái. Nó không thay đổi quy tắc
  nghiệp vụ FE10, API, schema, hành vi UI, cấu hình Azure hoặc dữ liệu cơ sở
  dữ liệu.

## 2026-07-28 - Đối soát chênh lệch SDD tiếng Việt qua main@30f936d

- Người dùng phê duyệt đối soát chênh lệch H1 qua `main@30f936d`. PR #77 đến
  dịch tài liệu SDD sang tiếng Việt, không đổi runtime, API, migration, UI hoặc
  hành vi kiểm thử FE10.
- CI upstream chính xác `30315665010` và Azure staging tự động `30315842152`
  đã đạt. Nhánh FE10 rebase không xung đột runtime; nội dung SPEC FE10 đã dịch
  được giữ và đối soát với trạng thái giao hàng v0.5.0 đã triển khai.
- Head lịch sử PR #75 `cf0a236` đạt CI `30315046007`, Azure staging
  `30315273298` và H3 hai trục cuối không có finding có thể hành động.
- H2 vòng 7 phê duyệt candidate chỉ thay đổi khoảng trắng nhưng bị thay thế trước
  staging bởi lượt fetch bắt buộc của `main@30f936d`; quyền đó không được dùng
  để commit hoặc push. Candidate fingerprint/H2 mới và cổng exact-head là bắt
  buộc trước H3 lặp lại và merge.

## 2026-07-28 - Khắc phục các finding H3 vòng một của hộp thư FE10

- H2 vòng 4 phê duyệt fingerprint
  `f41dbf50680d9c5601ae00d3c53651a7bb782ff81724ca641ef49b7cd88844e4`.
  Biện pháp khắc phục được công bố là runtime head PR #75 `3f9f23a`; CI
  exact-head `30313721511` và Azure staging `30313949983` đạt. Kiểm tra vận
  chuyển công khai, định tuyến hộp thư được bảo vệ, schema/chỉ mục Azure SQL
  và dọn dẹp đạt. Closeout chỉ bằng chứng có giới hạn cùng cổng head mới nhất
  vẫn bắt buộc trước H3 lặp lại, phê duyệt H3 rõ ràng, merge và cổng hậu merge.
- Người dùng phê duyệt đối soát chênh lệch H1 qua `main@a5fcbb9`. Head PR #75
  `28c4f80` vẫn sạch/có thể merge; CI exact-head `30306805399` và triển khai
  Azure staging `30307855616` đã đạt.
- Người dùng sau đó phê duyệt đối soát chênh lệch H1 qua `main@12faead`. Thay
  đổi đến chỉ xóa artifact `document/` đã ngừng dùng, không chồng lấp đường dẫn
  hay hợp đồng LÕI với biện pháp khắc phục này và rebase không xung đột. Azure
  staging hiện tại phục vụ `main` đó, nên biện pháp khắc phục cần triển khai
  head chính xác mới sau H2 và công bố.
- Xác minh Azure trực tiếp bao phủ điều kiện hậu migration/chỉ mục, bảo toàn
  tổng hợp được bảo vệ, quyền sở hữu MEMBER/LIBRARIAN/ADMIN, loại trừ nhạy cảm,
  phát lại đọc, bộ lọc, điều hướng an toàn, HTTPS/CORS và dọn dẹp probe/firewall
  đầy đủ.
- H3 vòng một phát hiện thiếu tài liệu trạng thái đọc ADR-002, văn bản nguồn
  chuẩn vòng đời lỗi thời, trạng thái mục lỗi thời sau một lần đọc thành công
  không điều hướng và đánh dấu tất cả bị vô hiệu sai bởi trang lọc hiện tại.
- Ảnh chụp người dùng còn chứng minh popover thông báo có thể được vẽ dưới nội
  dung trang vì topbar bị làm mờ tạo ngữ cảnh xếp chồng thấp hơn. Phạm vi
  RED/GREEN tập trung nay sửa hai lỗi trạng thái trang và nâng topbar chỉ khi
  popover mở. Popover giữ kích thước đã phê duyệt và nằm trên mọi tầng bố cục
  hiện tại.
- Ở checkpoint trước đó, biện pháp khắc phục có giới hạn vẫn cục bộ; H2 vòng 4,
  công bố `3f9f23a`, CI exact-head và triển khai lại Azure từ đó đã đóng các
  cổng trung gian đó.
- Cổng đầy đủ mới trên candidate đã rebase đạt: backend 69/69 bộ và 1116/1116
  kiểm thử; frontend 259/259 cùng lint/build; triển khai 20/20; hệ thống 10/10;
  trạng thái traceability 3/3 và FE10 14/16 (88%); Chromium 11/11; kiểm toán,
  chuẩn bị schema Azure, vệ sinh diff và quét mâu thuẫn.
- Người dùng phê duyệt fingerprint H2 `e1143e6a...`, nhưng lượt fetch tiền
  staging bắt buộc tìm thấy `main@a240705` nên không tệp nào được stage, commit
  hoặc push theo quyền đó. Sau đó người dùng phê duyệt
  `H1 drift addendum main@a240705`. Đối soát giữ việc upstream loại bỏ thao tác
  chỉnh sửa Quản trị FE11, CI main chính xác `30311801599` và triển khai Azure
  `30311973740`; nhánh rebase không xung đột và cần ma trận/fingerprint/H2 mới.
- Xác thực mới trên `main@a240705` đạt backend 69/69 bộ và 1084/1084 kiểm thử,
  frontend 259/259 cùng lint/build, triển khai 20/20, hệ thống 10/10, trạng
  thái traceability 3/3, FE10 14/16 (88%), Chromium 11/11, kiểm toán, chuẩn bị
  schema Azure và vệ sinh diff.

## 2026-07-28 - Khắc phục cổng hash migration staging đa nền tảng

- H2 phê duyệt fingerprint `2b53d7e`; FE10 được công bố là commit `b11b59e`
  trên PR #75 và lượt CI exact-head `30304661463` đã đạt.
- Azure staging nhận migration đã review hai lần. Nó tạo một cột `ReadAt` có
  thể null và một chỉ mục hỗ trợ, điền lùi 17 hàng lịch sử đủ điều kiện, giữ 25
  hàng bị loại chưa đọc, giữ probe sau lượt một chưa đọc ở lượt hai, bảo toàn
  tổng hợp giao hàng/lần thử/lũy đẳng và xóa probe cùng mọi quy tắc firewall
  FE10 tạm thời.
- Lượt triển khai thủ công `30305596861` fail-closed trước triển khai vì hash
  byte CRLF Windows do operator áp dụng là `6e8b6b4...`, trong khi hash byte LF
  của checkout Linux không đổi là `143cd8e...`.
- Phạm vi chính sách triển khai RED/GREEN nay yêu cầu preflight suy ra cả hai
  bản dựng byte LF và CRLF chính xác của cùng nội dung UTF-8 nghiêm ngặt. Hash
  đã lưu phải khớp một trong chúng; mọi thay đổi nội dung vẫn fail-closed.
- Chính sách triển khai đạt 16/16. Biện pháp khắc phục sau H2 này vẫn cục bộ cho
  tới khi phụ lục H2 mới cho phép commit/push và triển khai lại exact-head.

## 2026-07-28 - Đồng bộ kiểm thử hồi quy upstream không chồng lấp

- Upstream tiến từ `main@db97f17` lên `main@f3ebe95` với một commit chỉ kiểm thử
  bổ sung bảo vệ hồi quy ARIA-tablist và toast-FIFO FE07/FE08.
- Không tệp nào trong ba tệp đã đổi chồng lấp candidate FE10 48 mục, nên nhánh
  fast-forward cơ học không có quyết định hợp đồng LÕI mới, xung đột, tệp được
  stage hoặc thay đổi code sản phẩm.
- Toàn bộ bộ kiểm thử frontend đạt 258/258 trên baseline đã đồng bộ chính xác
  trước khi tạo fingerprint H2 mới.

## 2026-07-28 - Phê duyệt phụ lục đối soát chênh lệch Core thứ hai

- Ngay sau đối soát `main@5a3c84b` được phê duyệt, upstream tiến thêm ba commit
  qua `main@db97f17`.
- Phần chồng lấp giới hạn ở `frontend/src/api/libraryFeatureApi.js` và
  `frontend/src/styles/app-shell.css`; không tệp candidate nào được stage hoặc
  commit.
- Người dùng phê duyệt `H1 drift addendum main@db97f17`. Candidate giờ giữ lý
  do hủy của thành viên bằng tiếng Việt ở upstream, điều khiển trả/đặt chỗ đáp
  ứng và mọi chỉnh sửa upstream vòng hai khác, cùng API hộp thư FE10 và kiểu
  thông báo theo phạm vi.
- Xác thực đầy đủ sau chênh lệch và fingerprint H2 mới vẫn bắt buộc trước công
  bố.
- Bằng chứng mới sau chênh lệch đạt: bao phủ backend 69/69 bộ và 1114/1114 kiểm
  thử, frontend 258/258 cùng lint/build, triển khai 15/15, hệ thống 10/10, trace
  state 3/3, trace FE10 14/16 (88%) và Chromium 11/11.
- Migration chính xác đạt hai lần với một cột `ReadAt`, một chỉ mục hỗ trợ,
  điền lùi chỉ lịch sử, tổng hợp được bảo vệ không đổi và không còn cơ sở dữ liệu
  dùng một lần. Kiểm toán dependency backend báo không lỗ hổng; cổng kiểm toán
  frontend repository chỉ chấp nhận advisory React Router RSC không ổn định
  không áp dụng cho ứng dụng `BrowserRouter` khai báo này.
- TDD security-review cuối bổ sung hồi quy repository cho danh sách cho phép
  pending nhạy cảm đầy đủ. RED chứng minh `listPending` cũ bỏ sót
  `ACCOUNT_SETUP`; bản sửa predicate SQL nhỏ nhất căn chỉnh nó với worker hoạt
  động và bộ chọn trong bộ nhớ, GREEN tập trung đạt 161/161 và bao phủ backend
  đầy đủ đạt 1114/1114.

## 2026-07-28 - Phê duyệt phụ lục đối soát chênh lệch Core

- Một lượt fetch sau H2 bắt buộc tìm thấy bốn commit upstream mới kết thúc tại
  `main@5a3c84b` với thay đổi workflow triển khai, schema, hướng dẫn operator
  và kiểm thử triển khai chồng lấp; không tệp đã review nào được stage hoặc
  commit.
- Người dùng phê duyệt phụ lục chênh lệch H1 mới để giữ hợp đồng khởi động/
  readiness `add_change_password_otp_token_type.sql` đóng gói và seed xác minh
  tài khoản tiếng Việt cùng preflight migration FE10 và triển khai có thứ tự.
- Candidate được rebase lên `main@5a3c84b`; xác thực đầy đủ sau chênh lệch và
  fingerprint H2 mới bắt buộc trước công bố.

## 2026-07-28 - Phê duyệt phụ lục triển khai có cổng CI

- Đối soát candidate với upstream `main@41282b4`, nơi đưa vào triển khai staging
  tự động sau CI `main` thành công.
- Giữ triển khai tự động và thủ công trong khi làm cả hai fail-closed theo bằng
  chứng `FE10_INBOX_MIGRATION_SHA256` chính xác trong Môi trường GitHub
  `staging`; lượt chạy thủ công cũng yêu cầu xác nhận boolean đã phê duyệt.
- Giữ thứ tự preflight -> backend -> frontend -> smoke và yêu cầu bằng chứng
  migration cùng staging thủ công exact-head trước H3/merge.
- Người dùng phê duyệt phụ lục H1 này rõ ràng ngày 2026-07-28. Nó chỉ thay đổi
  điều phối triển khai, không đổi hành vi hay phân quyền hộp thư FE10.

## 2026-07-28 - Triển khai candidate hộp thư thông báo cá nhân (v0.5.0)

- Bổ sung migration `Notifications.ReadAt` có thể null lặp lại, điền lùi hàng
  lịch sử đủ điều kiện, chỉ mục của chính người dùng hỗ trợ, schema/model chuẩn
  và kiểm thử hợp đồng migration/repository.
- Bổ sung thao tác SQL liệt kê của chính người dùng, đếm chưa đọc, đánh dấu một
  và đánh dấu tất cả với cặp loại/mẫu đủ điều kiện cố định, DTO an toàn chính
  xác, đường dẫn thao tác do backend sở hữu, đọc lũy đẳng và hành vi `404` an
  toàn trước IDOR.
- Bổ sung context hộp thư đã xác thực dùng chung, làm mới 60 giây không chồng
  lấp, chuông có huy hiệu `99+` và xem trước năm mục chưa đọc, bộ lọc/phân trang
  `/notifications`, điều hướng an toàn không chặn sau lỗi đọc.
- Bổ sung bằng chứng fan-in FE04/FE07/FE08 cùng E2E Chromium
  MEMBER/LIBRARIAN/ADMIN bao phủ trường hợp âm quyền riêng tư, hành vi đọc, bố
  cục đáp ứng và ngữ nghĩa lỗi. Bản ghi FE02/FE11 nhạy cảm và bản ghi cũ/không
  người dùng vẫn bị loại trừ.
- Bổ sung cổng workflow staging fail-closed yêu cầu migration SQL operator hai
  lượt trước khi xác minh backend, frontend, smoke và trình duyệt theo thứ tự.
- Lần diễn tập SQL thực đầu tiên phát hiện phân giải tên trong cùng lô cho tham
  chiếu `ReadAt` mới. Kiểm thử hồi quy RED nay yêu cầu biên dịch hoãn;
  `sys.sp_executesql` sửa migration, lần diễn tập nghiêm ngặt hai lượt đạt với
  tổng hợp được bảo vệ không đổi và cơ sở dữ liệu dùng một lần bị xóa.
- FE10-I01 đến FE10-I07 và ma trận xác thực cục bộ FE10-I08 đều xanh. H2, công
  bố, Azure staging, H3, merge và CI hậu merge vẫn đang chờ và chưa được tuyên
  bố.
- Kiểm toán H2 cuối đã đóng ranh giới tràn phân trang SQL bằng cách liên kết
  offset trang đã kiểm tra hợp lệ là `BIGINT` và cô lập fixture E2E xác thực
  tổng hợp FE09 khỏi yêu cầu đếm chưa đọc nền mới; cổng tập trung và đầy đủ đạt
  sau cả hai sửa.

## 2026-07-28 - Phê duyệt kế hoạch H1 và kích hoạt governance

- Ghi nhận phê duyệt của người dùng cho kế hoạch triển khai FE10-I01..I08 chi
  tiết theo H1.
- Giữ triển khai sản phẩm `NOT_STARTED` cho đến khi kích hoạt governance này vào
  `main`, khớp cổng Fast-Track của repository.
- Review tiền H3 loại bỏ văn bản phê duyệt thời kỳ bản nháp lỗi thời, khôi phục
  cột kiểm thử/nhiệm vụ ma trận chấp nhận v0.5.0, đồng bộ bối cảnh tính năng/tác
  nhân/kiểm thử đang hoạt động và ghi baseline rebase `main` không chồng lấp mới
  nhất. Biện pháp khắc phục này không đổi hành vi đã phê duyệt hay trạng thái
  triển khai sản phẩm.

## 2026-07-27 - Phê duyệt mở rộng hộp thư thông báo cá nhân (v0.5.0)

- Ghi nhận phê duyệt của người dùng cho thiết kế và SPEC hợp nhất bằng văn bản.
- Cho phép chuẩn bị PLAN/TASKS chi tiết; triển khai sản phẩm vẫn bị chặn cho đến
  khi kế hoạch triển khai được review.

- Đề xuất một hộp thư cá nhân cho mọi `MEMBER`, `LIBRARIAN` và `ADMIN` đã xác
  thực, giới hạn ở bản ghi không nhạy cảm của chính tác nhân.
- Tái sử dụng mỗi thông báo email đủ điều kiện hiện có làm bản ghi hộp thư web;
  không đưa vào kênh gửi `IN_APP` hoặc thông báo trùng lặp.
- Đặc tả `ReadAt` có thể null, điền lùi hàng lịch sử đủ điều kiện, API danh
  sách cá nhân/đếm chưa đọc, thao tác đánh dấu một/đánh dấu tất cả có tính lũy
  đẳng, DTO an toàn và điều hướng danh sách cho phép do backend suy ra.
- Thêm chuông đã xác thực, xem trước năm mục, trang `/notifications`, bộ lọc
  tất cả/chưa đọc/đã đọc, phân trang, polling và hành vi lỗi đọc không chặn vào
  hợp đồng được đề xuất.
- Giữ bản ghi xác thực/thiết lập nhạy cảm, nhật ký nhân viên toàn cục, xóa/lưu
  trữ, WebSocket/đẩy, giao diện thử lại và URL do người gọi cung cấp ngoài phạm
  vi.
- Người dùng phê duyệt quyết định thiết kế tương tác và thiết kế/SPEC hợp nhất
  bằng văn bản ngày 2026-07-27; kế hoạch chi tiết được phê duyệt ngày
  2026-07-28.
- Đánh dấu trạng thái triển khai v0.5.0 hoạt động `NOT_STARTED` trong khi giữ
  lịch sử nhiệm vụ v0.4.5 đã hoàn tất, để traceability chỉ báo cáo cho đến khi
  hợp đồng bằng văn bản được phê duyệt và nhiệm vụ mới kích hoạt.

## 2026-07-27 - Triển khai cục bộ biện pháp khắc phục gửi email staging

- Bổ sung migration update-or-insert mẫu `ACCOUNT_SETUP` có giao dịch, lặp lại
  được mà không dọn dẹp phá hủy.
- Giữ ID thông điệp bộ điều hợp SMTP cho các lần gửi xác minh/đặt lại FE02 và
  thiết lập tài khoản FE11 thành công mà không lưu nội dung nhạy cảm.
- Bổ sung worker SYSTEM theo khả năng tốt nhất có thể bật, mặc định an toàn,
  tắt theo vòng đời, chặn chồng lấp, ghi log lỗi mã cố định và chặn kiểm toán
  polling rỗng.
- Giữ route xử lý thủ công được bảo vệ, thử lại thất bại chỉ thủ công, gửi đồng
  bộ nhạy cảm, DTO công khai hiện có và ranh giới vai trò.
- Bằng chứng cục bộ mới đạt 165 kiểm thử tập trung, 1.079 kiểm thử backend,
  232 kiểm thử frontend, 9 kiểm thử triển khai, 10 kiểm thử tích hợp hệ thống,
  lint, build, thực thi trace và review diff/bảo mật.
- H2 phê duyệt candidate đầy đủ ngày 2026-07-27. Commit sản phẩm đã review là
  `7920d4b`, `2134d44` và `ccb590c`; công bố/CI, thực thi migration, thiết lập
  worker, triển khai, bằng chứng staging an toàn, H3 và merge chưa được tuyên
  bố.
- CI PR #65 và lượt triển khai staging đầu tiên đã đạt, migration mẫu đạt hai
  lần. Bằng chứng hàng đợi trực tiếp sau đó phát hiện lỗi SQL Server 650 từ gợi
  ý nhận `READPAST` cộng `HOLDLOCK`; worker bị tắt và sửa
  `READCOMMITTEDLOCK` đã probe Azure được phê duyệt trong phụ lục H2, commit
  thành `a98f459`.
- CI cập nhật `30274110435` và deploy `30274367534` đã đạt. Sau khi bật lại
  worker đã sửa, toàn bộ 15 hàng pending không nhạy cảm thành SENT với 15 ID
  nhà cung cấp, không phát hiện vi phạm lưu bền nhạy cảm hay kiểm toán SYSTEM
  rỗng, mọi quy tắc firewall do nhiệm vụ tạo đã bị xóa. H3 và merge còn chờ.

## 2026-07-27 - Phê duyệt biện pháp khắc phục gửi email staging (v0.4.5)

- Yêu cầu upsert lũy đẳng cơ sở dữ liệu hiện có cho mẫu `ACCOUNT_SETUP` hoạt
  động chuẩn.
- Yêu cầu các lần gửi nhạy cảm thành công chỉ giữ ID thông điệp nhà cung cấp
  SMTP trong lịch sử lần thử.
- Phê duyệt worker SYSTEM theo vòng đời, có thể bật cho hàng `PENDING` không
  nhạy cảm với mặc định 60 giây và 20 hàng.
- Giữ xử lý thủ công được bảo vệ, thử lại thất bại chỉ thủ công, gửi đồng bộ
  nhạy cảm, DTO tối thiểu và thông tin xác thực chỉ trong bộ nhớ nhà cung cấp.
- Ghi nhận Azure App Service F1 tạm dừng worker khi ứng dụng ngủ.
- Người dùng phê duyệt thiết kế và hợp đồng bằng văn bản ngày 2026-07-27; triển
  khai chưa được tuyên bố trong khi chờ bằng chứng RED/GREEN và H2.

## 2026-07-27 - Đặc tả xác thực mẫu đã lưu fail-closed (v0.4.4)

- Yêu cầu cú pháp thẻ HTML thô, thuộc tính xử lý sự kiện nội tuyến và URL
  `javascript:` trong tiêu đề/nội dung mẫu đã lưu bị từ chối trước khi kết xuất,
  lưu bền thông báo/lần thử hoặc gửi nhà cung cấp.
- Giữ giá trị mẫu khi chạy được escape/làm sạch và bảo toàn quy tắc từ chối khóa
  giống bí mật đệ quy cùng che `safePayload` hiện có.
- Đối soát mơ hồ trước đó giữa từ chối EC-FE10-010 và cách diễn đạt làm sạch
  NFR-FE10-SEC-005.
- Nhat phê duyệt SPEC bằng văn bản ngày 2026-07-27, chỉ cho phép chuẩn bị
  PLAN/TASKS; mục này không tuyên bố code hoặc kiểm thử.

## 2026-07-23 - Làm quyền sở hữu và nhận gửi đã xếp hàng có tính xác định

- Thực thi quyền sở hữu tính năng chuẩn cho mọi loại thông báo đã xếp hàng và
  yêu cầu khóa lũy đẳng tại mọi ranh giới nguồn trong tiến trình.
- Phát lại thông báo đã lưu sau một race khóa duy nhất lũy đẳng thay vì hiển thị
  lỗi nội bộ.
- Yêu cầu mọi yêu cầu trong tiến trình cung cấp loại thực thể nguồn không rỗng
  và ID thực thể nguồn số nguyên dương.
- Bổ sung `PROCESSING` bền vững: nhận hàng đợi và chấp nhận nhạy cảm nay commit
  trước I/O nhà cung cấp, trong khi hoàn tất gửi/thất bại được bảo vệ dùng giao
  dịch ngắn mới.
- Giữ hàng không chắc chắn ở `PROCESSING` sau lỗi lưu bền kết thúc, loại chúng
  khỏi gửi lại tự động và trả `DELIVERY_STATE_UNCERTAIN` an toàn cho thử lại thủ
  công.
- Đồng bộ schema chuẩn, model, OpenAPI, ADR và migration lũy đẳng với vòng đời
  đã sửa.

## 2026-07-20 - Bản địa hóa giao diện tiếng Việt và kiểu chữ

- Bản địa hóa nhãn frontend dùng chung, tên hỗ trợ tiếp cận và phản hồi lỗi an
  toàn dùng quanh các bề mặt liên quan đến thông báo.
- Giữ payload mẫu thông báo, hành vi gửi, hợp đồng API, giá trị enum thô, quyền
  và quy tắc nghiệp vụ.
- Áp dụng hợp đồng kiểu chữ dùng chung `Be Vietnam Pro` cho nội dung và
  `Noto Serif` cho tiêu đề cùng phông thay thế hỗ trợ Unicode.

## 2026-07-19 - Hoàn tất kết thúc Giai đoạn 2

- feat-notification-management được chấp thuận trong đối soát đầy đủ FE01-FE12
  Giai đoạn 2 được ghi bởi PR #40/#41; ranh giới xác thực và tồn dư được tổng
  hợp trong `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Phần theo dõi gửi OTP FE02/FE10 cũng được đóng qua PR #42/#43/#44 với bằng
  chứng CI `main` hậu merge chính xác.
- Các giới hạn bị hoãn và phạm vi tương lai vẫn rõ ràng, không bị mở rộng bởi
  closeout này.

## 2026-07-19 - Hoàn tất tích hợp OTP B7

- FE10-S05 hoàn tất qua B7: PR #42 merge thành `34d9180`, PR CI
  `29688102867` đạt và CI `main` hậu merge chính xác `29688222757` đạt.
- Bằng chứng về quyền sở hữu FE02/FE10, từ chối nguồn, ranh giới bí mật, lỗi,
  lũy đẳng và sự kiện đặt lại đã hoàn tất tại checkpoint lịch sử đó. Gửi qua nhà
  cung cấp thực, hộp thư cá nhân khi đó là tương lai và tích hợp người gọi FE09
  bị hoãn; mục v0.5.0 ở trên chỉ thay thế phần ranh giới hộp thư cá nhân.

## 2026-07-19 - Mở rộng bằng chứng và chấp nhận con người cho tích hợp OTP

- Mở rộng bằng chứng quyền sở hữu ADR-004 qua cả hai loại nhạy cảm và mọi trình
  yêu cầu trong danh sách cho phép không phải FE02, với assertion ghi đè nguồn
  HTTP an toàn chính xác và không tác dụng phụ.
- Thêm bao phủ sự kiện đặt lại mật khẩu FE02 lặp lại, chứng minh lũy đẳng ID mã
  thông báo mới mà không gửi trực tiếp trùng.
- Xác thực FE02/FE10 tập trung đạt 170/170; toàn bộ backend đạt 916/916 với bao
  phủ đã cấu hình; cổng frontend, hệ thống, triển khai, traceability,
  OpenAPI/import và browser E2E cổng cô lập đều đạt.
- Không cần sửa sản phẩm vì ranh giới đã được phê duyệt vốn đã tuân thủ. Người
  dùng cấp chấp nhận con người thường trực; PR tích hợp và CI `main` hậu merge
  chính xác vẫn bắt buộc.

## 2026-07-19 - Fan-in OTP, FE02, FE04 và schema

- Đồng bộ baseline chuẩn và mẫu OTP FE10 với độ rộng schema dùng chung do FE11
  sở hữu; migration đạt hai lần thực thi SQL Server dùng một lần.
- Fan-in gửi xác minh/đặt lại FE02 vào trình yêu cầu nhạy cảm ràng buộc FE02
  không gửi trùng hoặc lưu nội dung OTP.
- Bổ sung ranh giới nguồn `MEMBERSHIP_RESULT` chỉ FE04 với ngữ nghĩa gửi không
  chặn sau commit.
- Cổng FE02/FE10/tích hợp tập trung đạt 154/154 với traceability FE10/FE02 đầy
  đủ; nhà cung cấp thực và closeout con người cuối còn mở.

## 2026-07-19 - Đối soát ranh giới nhà cung cấp OTP

- Triển khai ranh giới quyền sở hữu OTP xác minh/đặt lại chỉ FE02 với kết xuất
  trong bộ nhớ nhà cung cấp, biến OTP chuẩn, siêu dữ liệu nguồn an toàn và không
  lưu bền hoặc phản hồi nội dung nhạy cảm thô/đã kết xuất.
- Bổ sung migration mẫu OTP lũy đẳng, tách OpenAPI giữa HTTP nhân viên và yêu
  cầu FE02 nội bộ cùng bao phủ hồi quy tập trung/tích hợp.
- Ghi bằng chứng mới ở 131/131 kiểm thử tập trung, 623/623 kiểm thử backend đầy
  đủ, ngưỡng bao phủ đạt và 10/10 thẻ FR nguồn FE10.
- S03/S04 sau đó được fan-in vào worktree đối soát đầy đủ; ghi chú lịch sử này
  ghi trạng thái cô lập trước đó.

## 2026-07-19 - Kích hoạt đồng bộ độ rộng email người nhận

- Nâng `SPEC.md` lên 0.4.2 và đặt hợp đồng `recipientEmail` đã lưu là 255 ký tự
  để giao hàng thiết lập tài khoản FE11 không cắt ngắn email người dùng hợp lệ.
- Giữ quyền sở hữu gửi FE10, danh sách cho phép nguồn nhạy cảm, lũy đẳng, kết
  xuất và ngữ nghĩa lỗi không chặn.
- Đồng bộ schema/model/repository vẫn chờ FE11 Finalization Wave A.

## 2026-07-17 - Baseline Giai đoạn 1 được phê duyệt

- Nhật phê duyệt vòng đời FE10 chuẩn hóa, quyền sở hữu nguồn nhạy cảm, ranh giới
  OTP, ranh giới kết quả tư cách thành viên và phạm vi tích hợp bị hoãn làm
  baseline Giai đoạn 1.
- Đồng bộ `PLAN.md` và `TASKS.md` FE10 với hợp đồng OTP, biến mẫu chuẩn và
  trạng thái thực thi G12 đã phê duyệt.

## 2026-07-17 - Hợp đồng vòng đời và tư cách thành viên cuối

- Giới hạn trạng thái Giai đoạn 1 ở `PENDING`, `SENT` và `FAILED` và xác định
  `sentAt` cho việc nhà cung cấp chấp nhận thành công.
- Bổ sung luồng hàng đợi `MEMBERSHIP_RESULT` FE04 và làm yêu cầu hiệu năng/bộ
  lọc Giai đoạn 1 có tính xác định.

## 2026-07-17 - Củng cố hợp đồng nguồn và vòng đời trạng thái

- Xác định vòng đời trạng thái Giai đoạn 1 và loại nhánh `SKIPPED`/tùy chọn chưa
  giải quyết.
- Chuẩn hóa hợp đồng người gọi FE04 và FE08 trên cặp loại/mẫu thông báo chuẩn.

## 2026-07-17 - Ranh giới kết quả tư cách thành viên FE04

- Thêm FE04 vào danh sách cho phép trình yêu cầu nguồn ràng buộc khi khởi tạo
  cho `MEMBERSHIP_RESULT`.
- Bổ sung cổng tài liệu/triển khai đang chờ cho quyền sở hữu FE04; quyền thông
  báo HTTP không đổi.

## 2026-07-15 - Triển khai và xác thực gửi thiết lập tài khoản FE11

- Thực thi quyền sở hữu chỉ FE11 cho giao hàng
  `ACCOUNT_SETUP -> ACCOUNT_SETUP` chuẩn trong khi giữ quyền sở hữu FE02 cho
  loại OTP xác minh/đặt lại.
- Bổ sung gửi qua nhà cung cấp đã cấu hình chỉ có siêu dữ liệu nguồn
  `AuthToken` an toàn và lũy đẳng chính xác `FE11:ACCOUNT_SETUP:<tokenId>`.
- Giữ mã thông báo thiết lập thô, liên kết và nội dung nhạy cảm đã kết xuất khỏi
  lưu bền, kiểm toán, log và phản hồi HTTP.
- Xác minh lỗi gửi không chặn khi tạo tài khoản và Quản trị gửi lại.
- Bằng chứng tự động Nhiệm vụ 7 đạt trên FE02/FE10/FE11 và kiểm thử tích hợp bị
  ảnh hưởng; Nhat xác nhận gói cuối và `FE10-S08` hoàn tất.

## 2026-07-15 - Bản sửa đổi gửi thiết lập tài khoản FE11

- Nâng `SPEC.md` lên 0.4.0 và đánh dấu bản sửa OTP/thiết lập tài khoản kết hợp
  sẵn sàng review.
- Bổ sung cặp nhạy cảm chuẩn `ACCOUNT_SETUP -> ACCOUNT_SETUP` với `setupLink`
  và `expiresInHours`.
- Thêm FE11 vào danh sách cho phép trình yêu cầu nội bộ trong khi giữ quyền sở
  hữu chỉ FE02 của OTP xác minh/đặt lại.
- Yêu cầu quyền sở hữu nguồn chỉ FE11, traceability ID mã thông báo `AuthToken`,
  lũy đẳng `FE11:ACCOUNT_SETUP:<tokenId>`, gửi đồng bộ qua nhà cung cấp và
  không lưu thông tin xác thực/nội dung thiết lập.
- Bổ sung MF-FE10-005, FR-FE10-010, AC-FE10-010, EC-FE10-016, Q-FE10-008, G11
  và FE10-S06..S08.

## 2026-07-15 - Hợp đồng ranh giới bảo mật OTP được phê duyệt

- Nâng `SPEC.md` từ phiên bản `0.2.0` lên `0.3.0` và ghi ADR-004 cùng phê duyệt
  G8-G10 của Nhat.
- Thay hợp đồng liên kết xác minh/đặt lại bị hoãn bằng hợp đồng OTP sáu chữ số
  FE02 đã triển khai: `otp`, `expiresInMinutes` và traceability nguồn
  `AuthTokens.TokenId`.
- Giới hạn `ACCOUNT_VERIFICATION` và `PASSWORD_RESET` cho trình yêu cầu ràng
  buộc với `FE02`; HTTP nhân viên và trình yêu cầu nguồn khác trả
  `403 SENSITIVE_NOTIFICATION_INTERNAL_ONLY` an toàn.
- Loại `sourceFeature` do người gọi kiểm soát khỏi hợp đồng yêu cầu HTTP.
- Xác định FE10 là chủ sở hữu duy nhất về kết xuất/gửi/trạng thái cho UC45/UC46
  trong khi FE02 vẫn sở hữu việc tạo/xác thực OTP.
- Giữ OTP và nội dung nhạy cảm đã kết xuất khỏi lưu bền, log, kiểm toán và phản
  hồi; lỗi gửi không chặn và gửi lại tạo sự kiện mã thông báo mới.
- Giữ `CHANGE_PASSWORD_OTP`, chấp nhận mã thông báo cũ, tích hợp người gọi
  FE09, công việc frontend và giao diện thử lại ngoài phần theo dõi này.

## 2026-06-09

- Tạo cấu trúc đặc tả tính năng Quản lý thông báo FE10.
- Thiết lập các tệp đặc tả: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md và
  CHANGELOG.md.
- Xác định ranh giới thông báo giữa FE10 và các tính năng nguồn FE02, FE07, FE08,
  FE09 và FE11.
- Bổ sung quy tắc nghiệp vụ, yêu cầu chức năng, tiêu chí chấp nhận, trường hợp
  biên, câu hỏi mở và ma trận traceability ổn định.
- Xác định rủi ro chính về thông báo trùng, gửi thất bại, rò rỉ mã thông báo,
  thông tin xác thực nhà cung cấp và truy cập thông báo không được ủy quyền.

## 2026-06-10

- Căn chỉnh trường hợp sử dụng và kiểm thử tính năng FE10 với bảng phân công
  mới nhất: UC45-UC48 và FT46-FT49.
- Loại chồng lấp phạm vi phân công với FE11 bằng cách thay ánh xạ kiểm thử cũ
  chồng lấp FE11.
- Chuyển hộp thư thông báo người dùng, đánh dấu đã đọc, màn hình nhật ký
  quản trị/thủ thư, màn hình thử lại thủ công và giao diện chỉnh sửa mẫu ra khỏi
  phạm vi FE10 chính.
- Cập nhật PLAN.md và TASKS.md để kế hoạch sau này không tạo nhiệm vụ ngoài phạm
  vi phân công FE10 hiện tại.

## 2026-06-10 - Các quyết định review Giai đoạn 1 được phê duyệt

- Duyệt các quyết định câu hỏi mở từ
  `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Cập nhật trạng thái quyết định `SPEC.md` từ draft/proposed/open thành approved
  khi phù hợp.
- Giữ rõ kiểm soát phạm vi Giai đoạn 1 và hạng mục công việc tương lai bị hoãn.

## 2026-06-10 - Lát cắt backend sẵn sàng review

- Bổ sung danh sách kiểm tra kế hoạch và nhiệm vụ FE10 cho phạm vi thông báo của
  Nhat.
- Bổ sung API yêu cầu thông báo và process-pending được bảo vệ với hành vi nhà
  cung cấp email mô phỏng.
- Bổ sung xử lý lũy đẳng, kết xuất mẫu, che payload an toàn, cập nhật trạng thái
  và ghi log lần thử.
- Căn chỉnh script SQL với trường, trạng thái, chỉ mục lũy đẳng và mẫu bắt buộc
  FE10.
- Bổ sung kiểm thử backend cho tạo yêu cầu, sự kiện trùng, che mã thông báo đặt
  lại, xác thực mẫu, lần gửi và kiểm soát truy cập.

Mục này mô tả lát cắt ban đầu lịch sử. Tra cứu trùng chỉ hoạt động, xử lý
safe-payload nông, phản hồi controller bản ghi đầy đủ và giả định nhạy cảm đã
xếp hàng của nó được thay thế bởi hợp đồng củng cố đã phê duyệt ngày 2026-07-13
bên dưới.

## 2026-07-13 - Hợp đồng củng cố FE10-H01 được phê duyệt

- Ghi nhận phê duyệt G1-G7 của Nhat và cập nhật `SPEC.md` lên phiên bản `0.2.0`
  để triển khai B5.
- Tách gửi theo cặp loại/mẫu chuẩn do máy chủ thực thi:
  `ACCOUNT_VERIFICATION -> ACCOUNT_VERIFICATION`,
  `PASSWORD_RESET -> PASSWORD_RESET`,
  `RESERVATION_AVAILABLE -> RESERVATION_READY`,
  `DUE_DATE_REMINDER -> DUE_DATE_REMINDER`,
  `OVERDUE_NOTICE -> OVERDUE_NOTICE`, `FINE_NOTICE -> FINE_NOTICE` và
  `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`.
- Yêu cầu gửi nhà cung cấp mô phỏng đồng bộ cho thông điệp xác minh tài khoản/
  đặt lại mật khẩu nhạy cảm, giữ liên kết thô và tiêu đề/nội dung nhạy cảm đã
  kết xuất khỏi lưu bền, log, kiểm toán và phản hồi HTTP.
- Giữ thông báo không nhạy cảm đã xếp hàng và yêu cầu kiểm tra đối tượng/mảng
  đệ quy với từ chối khóa bí mật chuẩn hóa cùng che `safePayload` tương ứng.
- Phê duyệt DTO tạo/phát lại/xử lý/thử lại tối thiểu, `sourceEntityId` chỉ số
  nguyên, route HTTP được bảo vệ và danh sách cho phép trình yêu cầu ràng buộc
  khi khởi tạo `FE02`, `FE07`, `FE08`, `FE09`, `SYSTEM`.
- Đổi lũy đẳng thành một bản ghi cho mỗi khóa xuyên suốt mọi trạng thái và xác
  định thử lại thủ công chỉ cho bản ghi không nhạy cảm đã xếp hàng thất bại;
  thử lại nhạy cảm trả `409 REISSUE_REQUIRED` an toàn.
- Giữ đối soát OTP/liên kết FE02 và `EMAIL_VERIFY` cùng migration FE02 cho chủ
  sở hữu FE02; hoãn tích hợp người gọi FE09 vì hiện không có người gọi.
- Cập nhật ngữ nghĩa BR/FR/AC ổn định, yêu cầu API/NFR, traceability và danh
  sách kiểm tra review. Không có tệp triển khai, kiểm thử, cơ sở dữ liệu hoặc
  OpenAPI thay đổi trong FE10-H01.

## 2026-07-13 - Đã triển khai củng cố FE10-H02 đến FE10-H08

- Thực thi cặp loại/mẫu chuẩn, từ chối khóa nhạy cảm đệ quy chuẩn hóa, che
  safe-payload tương ứng và ID thực thể nguồn chỉ số nguyên.
- Gửi thông báo xác minh tài khoản và đặt lại mật khẩu đồng bộ qua nhà cung cấp
  mô phỏng trong khi giữ liên kết thô và nội dung nhạy cảm đã kết xuất khỏi lưu
  bền, log, kiểm toán và phản hồi HTTP.
- Rút gọn phản hồi tạo, phát lại, xử lý và thử lại thành DTO đã phê duyệt, giữ
  route HTTP thông báo được bảo vệ.
- Bổ sung trình yêu cầu nguồn ràng buộc khi khởi tạo, sau đó chỉ migration thông
  báo mượn sách FE07 và đặt chỗ FE08 với hành vi luồng nguồn không chặn.
- Thực thi một bản ghi thông báo cho mỗi khóa lũy đẳng xuyên suốt mọi trạng thái
  và thêm thử lại cùng bản ghi được bảo vệ cho thông báo không nhạy cảm thất bại;
  thử lại nhạy cảm trả `409 REISSUE_REQUIRED`.
- Hoàn tất triển khai qua commit `105e51c` đến `7c88223`; migration FE02, tích
  hợp người gọi FE09, công việc frontend, nhà cung cấp thực và thay đổi
  dependency vẫn ngoài phạm vi.

## 2026-07-13 - Bản sửa xác thực và review FE10-H09

- Xác thực FE10/FE07/FE08/tích hợp tập trung đạt sau bản sửa review: 4 bộ và
  136 kiểm thử.
- Toàn bộ backend đạt sau bản sửa review: 15 bộ và 212 kiểm thử.
- Traceability thực thi đạt với FE10 có 9/9 yêu cầu chức năng (100%) và không
  tính năng triển khai nào dưới ngưỡng 70%.
- Quét độc lập đầu tiên phát hiện siêu dữ liệu nguồn HTTP có thể bỏ qua xác thực
  service nghiêm ngặt và văn bản `safeMessage` do nhà cung cấp cung cấp có thể
  tới lưu bền lỗi đã xếp hàng.
- Commit `a04b64b` bổ sung xác thực danh sách cho phép/loại thực thể nguồn theo
  kiểm thử trước ở ranh giới HTTP và service, thay văn bản lỗi nhà cung cấp bằng
  bản tóm tắt chung cố định `Notification delivery failed.`.
- Cách diễn đạt trạng thái dừng B5 lỗi thời trong `PLAN.md` và `CONTEXT.md`
  được căn chỉnh với B5 đã triển khai và trạng thái B6 đang review.
- Review tập trung `a04b64b` phê duyệt cả tuân thủ đặc tả và chất lượng code,
  không finding.
- Review toàn nhánh cuối `a613604..eb82b1d` không báo finding và phê duyệt
  nhánh sau khi độc lập chạy lại toàn bộ backend (15 bộ, 212 kiểm thử), thực thi
  traceability và `git diff --check`.
- FE10-H09 và cổng xác thực B6 đã hoàn tất. Đối soát FE02 và migration người
  gọi FE09 vẫn bị hoãn rõ ràng.

## 2026-07-13 - Tích hợp B7 và kết thúc review

- Nhat xác nhận cổng tích hợp con người và chọn merge cục bộ sau review nhánh
  FE10 cuối.
- Commit `9185a9a91f41e444e0c4e6bd8c0605a281272ee9` đã vào `main` và được push
  tới `origin/main`.
- Lượt CI GitHub Actions `29236572558` đạt cho cùng commit, bao gồm
  traceability, kiểm thử backend, lint/kiểm thử/build frontend và kiểm tra import
  health backend.
- Bổ sung `.sdd/reviews/fe10-b7-integration-review-closeout-2026-07-13.md` với
  bằng chứng độ phù hợp hệ thống, kiến trúc, tác động tương lai và tài liệu.
- Đối soát FE02 và tích hợp người gọi FE09 vẫn hoãn rõ ràng và không được
  closeout này tuyên bố.
