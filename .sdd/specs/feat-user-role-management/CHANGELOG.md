# CHANGELOG.md - FE11 Quản lý người dùng và vai trò

## 2026-08-01 - Kích hoạt audit nguyên tử cho metadata Quản trị (v0.6.14)

- Khóa action/target allowlist, context tác nhân, transaction và lỗi not-found cho `/api/admin/library/*`.
- Kích hoạt `FE11-CAT01`; chưa ghi nhận bằng chứng triển khai sản phẩm.

## 2026-07-28 - Giới hạn thao tác Quản trị với người dùng hiện có vào vai trò và vô hiệu hóa (v0.6.13)

- Loại thao tác `Chỉnh sửa` khỏi hàng, thẻ và chi tiết người dùng.
- Giữ `Phân quyền` nguyên tử và `Vô hiệu hóa` đủ điều kiện.
- Ngừng `PUT /api/users/{userId}` và đường thay đổi hồ sơ frontend/backend/
  OpenAPI của nó.
- Giữ FE03 là chủ sở hữu sửa hồ sơ đã xác thực và FE02 là chủ sở hữu mọi thay
  đổi email đã xác minh trong tương lai.
- Thêm bao phủ hồi quy cho UI Sửa vắng mặt và route đã ngừng.

## 2026-07-27 - Khóa ranh giới vai trò metadata thư viện Quản trị (v0.6.12)

- Làm vai trò hiện tại đơn là chuẩn cho quản lý tham chiếu catalog.
- Giữ thay đổi tác giả/nhà xuất bản/thể loại dưới route Quản trị
  `/api/admin/library/*`.
- Giữ quyền truy cập Thủ thư chỉ đọc qua lựa chọn metadata hoạt động FE05 và
  từ chối truy cập Thủ thư/Thành viên trước lưu Quản trị.

## 2026-07-27 - Kết nối vòng đời vai trò/tài khoản với FE07 (v0.6.8)

- Chặn thay vai trò Member và vô hiệu hóa tài khoản khi có yêu cầu FE07 đang chờ
  hoặc lượt mượn hoạt động, dùng khóa giao dịch thành viên dùng chung.
- Thêm blocker phê duyệt an toàn cho vai trò/tài khoản chủ cũ và bản sao vật lý
  không khả dụng.
- Chỉ vô hiệu hóa phê duyệt yêu cầu legacy đã biết không hợp lệ và giữ đường dọn
  dẹp từ chối có lý do bắt buộc.

## 2026-07-27 - Đối soát quyết định yêu cầu Quản trị với FE07 (v0.6.7)

- Thêm trạng thái bản sao vật lý chuẩn vào chi tiết yêu cầu Quản trị an toàn.
- Tải lại danh sách/chi tiết sau thành công hoặc xung đột duyệt/từ chối.
- Làm rõ lý do từ chối bắt buộc và giải phóng claim đang chờ logic.
- Giữ FE07 là chủ sở hữu nghiệp vụ duyệt/từ chối duy nhất.

## 2026-07-27 - Giữ email và username dễ đọc trong bảng người dùng

- Sửa độ rộng cột bảng người dùng desktop từ tổng bị ràng buộc quá mức thành
  chính xác 100%.
- Tăng không gian danh tính và username, cho phép email/username dài xuống dòng
  thay vì ẩn sau dấu ba chấm.

## 2026-07-27 - Kết nối sửa người dùng với thay vai trò

- Hiển thị vai trò duy nhất hiện tại trong hộp thoại sửa người dùng được quản lý.
- Thêm thao tác `Đổi vai trò` rõ ràng, chuyển sang modal vai trò chuẩn dùng
  radio mà không trộn thay đổi hồ sơ và vai trò.
- Giữ shortcut `Phân quyền` hàng/chi tiết hiện có và hợp đồng thay thế backend
  nguyên tử.

## 2026-07-27 - Củng cố thay thế vai trò đơn và hội tụ phiên

- Áp dụng migration `UX_UserRoles_UserId` hiện có lên cơ sở dữ liệu đã cấu hình
  sau khi xác nhận không có ánh xạ trùng.
- Hạn chế yêu cầu thay thế thành đúng một `roleId` số dương và thêm xác thực
  ID/danh mục phía client.
- Thu hồi credential refresh/session hoạt động của tài khoản mục tiêu trong
  giao dịch thay vai trò để FE02, điều hướng và API do vai trò sở hữu hội tụ sau
  xác thực lại.
- Thêm bao phủ hồi quy route, repository, API-adapter và modal tập trung.

## 2026-07-27 - Mở rộng ranh giới audience vai trò đơn tới FE09

- Hạn chế tự phục vụ tiền phạt của Member vào vai trò `MEMBER` đơn.
- Giữ Librarian/Admin trong workspace tiền phạt staff và giữ quyền waive/cancel
  chỉ Quản trị.

## 2026-07-27 - Ép đúng một vai trò mỗi tài khoản

- Thay gán/thu hồi vai trò riêng bằng `PUT /api/users/{userId}/role` nguyên tử.
- Thêm `UX_UserRoles_UserId` vào baseline và migration lũy đẳng fail-safe cho
  cơ sở dữ liệu hiện có.
- Đổi modal vai trò Quản trị từ checkbox đa chọn thành một lựa chọn radio.
- Kết nối FE01, FE02, FE07, FE08, FE11, điều hướng dùng chung và nội dung quyền
  với bất biến vai trò đơn.
- Giữ bảo vệ Quản trị hoạt động cuối và mảng tương thích `roles` đúng một mục.
- Xác thực tự động bắt buộc; review con người vẫn chờ.

## 2026-07-27 - Xác định audience đa vai trò ưu tiên staff (đã thay thế)

- Xác định `ADMIN -> LIBRARIAN -> non-staff MEMBER` là thứ tự ưu tiên audience
  hiệu dụng cho điều hướng và phân quyền liên tính năng.
- Làm rõ thêm `MEMBER` vào tài khoản staff không trao tự phục vụ mượn FE07 hay
  đặt chỗ FE08.
- Giữ quyền vận hành staff do FE07/FE08 sở hữu và căn chỉnh route frontend trực
  tiếp với backend guard.
- Xác thực: bao phủ backend/frontend đa vai trò, backend đầy đủ 1018/1018,
  frontend đầy đủ 227/227, lint/build frontend và truy vết đạt.

## 2026-07-25 - Sửa hồ sơ được quản lý dùng chung được phê duyệt và triển khai

- Thay editor department/specialization chỉ Thủ thư bằng một editor Quản trị cho
  `fullName`, `phone` và `address` xuyên vai trò Member, Librarian và Admin.
- Giữ email tài khoản hiện có chỉ đọc dưới quyền sở hữu xác minh FE02.
- Loại department/specialization và thông báo quyền sở hữu cá nhân lỗi thời khỏi
  UI Quản trị.
- Kết nối FE11 và FE03 qua cùng persistence `Users`/`UserProfiles` và phiên
  bản optimistic-concurrency hiệu dụng mới nhất.
- Cập nhật allowlist API, đường audit giao dịch, hợp đồng OpenAPI/dùng chung,
  kiểm thử tập trung và tài liệu Q-FE11-028.

## 2026-07-23 - Quyền sở hữu cá nhân và tích hợp tư cách thành viên Quản trị được triển khai cục bộ

- Ép ranh giới quyền sở hữu người dùng hiện có đã phê duyệt: Quản trị FE11 chỉ
  cập nhật `department` và `specialization` của Thủ thư hiện tại; payload cá
  nhân, email, không rõ và trộn bị từ chối nguyên tử.
- Thu hẹp nội dung trình bày `USER_UPDATE` thành trường công việc Thủ thư và căn
  chỉnh hợp đồng OpenAPI/API/frontend.
- Thêm mục Admin Console thứ tám `Duyệt hội viên` và nhúng workflow danh
  sách/duyệt/từ chối FE04 chuẩn không có alias API Quản trị.
- Ghi bằng chứng hồi quy cục bộ đầy đủ: backend 952/952, frontend 215/215, lint
  frontend và production build đạt; trình duyệt đáp ứng, Azure Staging và chấp
  nhận con người vẫn mở.

## 2026-07-22 - Ranh giới quyền sở hữu dữ liệu cá nhân được phê duyệt

- Giao cập nhật tự phục vụ đã xác thực `fullName`, `phone` và `address` cho
  FE03; Quản trị FE11 có thể xem các trường này nhưng không thể sửa sau khi tạo
  tài khoản.
- Giữ email tài khoản hiện có chỉ đọc trong Giai đoạn 1; mọi thay đổi tương lai
  cần luồng xác minh FE02 được phê duyệt rõ ràng.
- Hạn chế hợp đồng cập nhật người dùng hiện có FE11 chuẩn vào `department` và
  `specialization` chỉ cho mục tiêu Thủ thư hiện tại.
- Thay yêu cầu cập nhật cá nhân/email Quản trị rộng và bằng chứng chấp nhận lịch
  sử của chúng; thêm `FE11-PDO01..PDO04` cho đối soát hợp đồng, ép backend, căn
  chỉnh UI Quản trị và xác thực mới.
- Mục này chỉ ghi thay đổi đặc tả và kế hoạch. Đường cập nhật sản phẩm hiện tại
  vẫn rộng hơn cho đến khi `FE11-PDO02..PDO04` được triển khai và xác minh.

## 2026-07-22 - Tích hợp Rà soát tư cách thành viên Quản trị được phê duyệt

- Phê duyệt mục sidebar Quản trị thứ tám, `Duyệt hội viên`, sau Quản lý người
  dùng, đồng thời giữ Permissions đã loại và Manage Roles khả dụng từ Quản lý
  người dùng.
- Giao quyền sở hữu shell/điều hướng cho FE11 và giữ quyền sở hữu dữ liệu/thay
  đổi danh sách/rà soát trong FE04 mà không thêm alias API Quản trị.
- Ghi thiết kế module nhúng đáp ứng; triển khai và xác thực chưa khởi động.

## 2026-07-22 - Căn chỉnh shell Quản trị và đơn giản hóa nhật ký hoạt động

- Dùng lại application shell Member/Librarian dùng chung, header tài khoản,
  sidebar đáp ứng, brand và kiểu điều hướng cho Admin Console.
- Loại mọi điều khiển tìm kiếm và lọc hiển thị khỏi Activity Logs; giữ bảng chỉ
  đọc, phân trang máy chủ, làm mới, phân quyền và DTO đã che an toàn.
- Cập nhật yêu cầu, nhiệm vụ FE11 và hợp đồng hồi quy frontend để khớp sửa đã
  phê duyệt.
- Nhúng workspace quản lý sách FE05 chuẩn trong Admin Library để thao tác Quản
  trị không còn điều hướng đến route Thủ thư.
- Xác minh bộ lọc tìm kiếm/trạng thái Admin Library được chuyển tiếp tới backend
  và thêm bao phủ hồi quy cho giá trị query chuẩn hóa.
- Cập nhật selector chấp nhận trình duyệt FE11 cho sidebar ứng dụng dùng chung,
  loại kỳ vọng tìm kiếm/lọc Audit lỗi thời.

## 2026-07-22 - Sửa trình bày Quản trị đã xác thực được xác thực cục bộ

- Chỉ loại destination Permissions độc lập khỏi sidebar Quản trị; quản lý vai
  trò vẫn khả dụng trong Quản lý người dùng.
- Đổi Quản lý người dùng sang thẻ đáp ứng tại 1440px và thấp hơn để trang không
  cần kéo ngang trước khi bảng thích ứng.
- Giữ năm bộ lọc Audit chuẩn, thêm gợi ý thao tác tiếng Việt dễ đọc và thu gọn
  chi tiết an toàn từng hàng trong cột dễ đọc hữu hạn.
- Không đổi API, schema, xác thực, phân quyền, policy vai trò, phân trang hay
  hành vi che audit.
- Xác thực cục bộ mới đạt frontend 192/192, lint, build, trace FE11 95%,
  Chromium tập trung 1/1 và kiểm tra trực quan đáp ứng tại 1440/1366/1280/390.
- Workflow Azure Staging `29873466035` triển khai `8627508` thành công;
  backend, frontend, smoke, health và kiểm tra SPA `/admin/users` trực tiếp đạt.
- `FE11-UXR08` vẫn mở chờ chấp nhận con người đã xác thực làm mới.

## 2026-07-22 - Tái cấu trúc module Admin Console được triển khai và xác thực cục bộ

- Thay monolith Quản trị lịch sử bằng shell bảo vệ, đáp ứng và các module
  Dashboard, Users, Requests, Permissions, Audit, Library, Circulation riêng
  trong khi giữ `/admin/users`.
- Thêm parity bảng desktop/thẻ mobile, điều hướng mobile có thể truy cập, thao
  tác có nhãn, trình bày an toàn bản địa hóa, trạng thái trống/lỗi/đang tải rõ
  ràng và hợp đồng reduced-motion/focus.
- Giữ ranh giới quyền sở hữu FE05, FE07, FE11 và FE12; chỉ loại mã
  membership/payment Quản trị không thể tới; không API, schema, phân quyền hay
  quy tắc nghiệp vụ đổi.
- Cắt entry legacy thành compatibility export một dòng chính xác và cập nhật hợp
  đồng frontend/E2E theo chủ module mới.
- Xác thực cục bộ mới đạt frontend 191/191, backend 926/926, system 10/10,
  deployment 8/8, trace FE11 95%, lint, build và E2E trình duyệt 4/4.
- Workflow Azure Staging `29871576856` triển khai `903a1a2` thành công;
  backend, frontend, smoke, health và kiểm tra SPA `/admin/users` trực tiếp đạt.
- `FE11-UXR01..FE11-UXR06` hoàn tất. Phê duyệt staging desktop/mobile con người
  đã xác thực rõ ràng vẫn thuộc `FE11-UXR07`.

## 2026-07-22 - Loại Permissions khỏi sidebar Quản trị

- Loại mục `Phân quyền` hiển thị khỏi sidebar Quản trị, còn bảy mục điều hướng
  đã phê duyệt.
- Giữ API quyền, policy, ép phân quyền và triển khai permission-view nội bộ hiện
  có.
- Cập nhật yêu cầu điều hướng FE11, truy vết nhiệm vụ và bao phủ hồi quy
  frontend.

## 2026-07-22 - Đơn giản hóa bộ lọc Nhật ký kiểm toán Quản trị

- Loại đầu vào action `AUTH_LOGIN_SUCCESS` riêng và đầu vào actor-ID kề bên khỏi
  toolbar Nhật ký kiểm toán Quản trị.
- Giữ tìm kiếm văn bản, lọc khoảng ngày, phân trang, che dữ liệu và hợp đồng
  query backend `action`/`actorId` không đổi.
- Cập nhật yêu cầu FE11, truy vết nhiệm vụ và bao phủ hồi quy frontend cho
  toolbar đơn giản.

## 2026-07-21 - Thay xuất CSV Quản trị bằng DOCX

- Thay điều khiển CSV Library, Borrowing và Request Management bằng tải xuống
  Word `.docx` hợp lệ.
- Giữ xuất yêu cầu mọi trang theo frozen-filter và phép chiếu yêu cầu an toàn đã
  phê duyệt.
- Giữ email tài khoản Quản trị dài trên một dòng với dấu ba chấm và tooltip đầy
  đủ giá trị.
- Định dạng bảng DOCX ở chế độ landscape với độ rộng tỷ lệ cố định, ô gọn, trạng
  thái bản địa hóa và ngày ngắn để tránh biến dạng cột hẹp.

## 2026-07-20 - Trạng thái governance hậu tích hợp

- PR #54 merge là `c988af1` với CI foundation thành công; cách diễn đạt
  H2-Ready phía dưới là ảnh chụp candidate lịch sử.
- `main@cce59d0` hiện tại gồm follow-up PR #57/#58 đã merge; bằng chứng CI và
  staging current-head được ghi trong
  `.sdd/reviews/final-governance-closeout-validation-2026-07-20.md`.
- `v1.0.2` đã công bố vẫn là baseline gắn tag; `main@cce59d0` hiện tại là
  baseline ứng dụng không tag, không phải candidate `v1.0.3` được phê duyệt
  trước. Mọi `v1.0.3` tương lai phải dùng SHA `main` hậu đối soát đã review
  muộn hơn sau H2, H3 và CI hậu merge chính xác.

## 2026-07-20 - Bản địa hóa UI tiếng Việt và typography

- Bản địa hóa nhãn, trạng thái, tên accessibility và phản hồi lỗi an toàn do
  frontend tạo cho tính năng này.
- Giữ hợp đồng API, giá trị enum thô, quyền, quy tắc nghiệp vụ và dữ liệu
  catalog/hồ sơ do người dùng sở hữu.
- Áp dụng hợp đồng typography body `Be Vietnam Pro` và heading `Noto Serif`
  dùng chung với fallback hỗ trợ Unicode.

## 2026-07-20 - Final Governance Closeout sẵn sàng H2

- Khôi phục điều khiển lọc `action` và `actorId` số Nhật ký kiểm toán Quản trị đã
  phê duyệt trong khi giữ query builder FE11 và API backend chuẩn.
- Thêm bao phủ hồi quy frontend RED-GREEN ánh xạ tới `BR-FE11-018`,
  `BR-FE11-026`, `FR-FE11-033` và `AC-FE11-018`.
- Đối soát commit direct-main `f10e7f4` qua design đã phê duyệt, kế hoạch triển
  khai, bằng chứng truy vết hiện tại và gói xác thực closeout bốn tầng.
- Không đổi API, schema, phân quyền, quyền vai trò, phân trang, che dữ liệu hay
  hành vi cơ sở dữ liệu.
- Thay đổi closeout được tạo vẫn chưa commit chờ review H2; H3, merge, CI hậu
  merge chính xác và tag `v1.0.2` vẫn là bước tích hợp.

## 2026-07-19 - Closeout thoát Giai đoạn 2

- feat-user-role-management được chấp nhận trong đối soát FE01-FE12 Giai đoạn 2
  hoàn tất do PR #40/#41 ghi; ranh giới xác thực và tồn dư được hợp nhất trong
  `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Giới hạn phạm vi hoãn và tương lai vẫn rõ ràng, không bị closeout này mở rộng.

## 2026-07-19 - Finalization Wave B đã triển khai và sẵn sàng H2

- Thêm chấp nhận Playwright riêng FE11 cho bằng chứng Dashboard Quản trị và
  phân trang máy chủ Request Management, lọc, chi tiết chuẩn, CSV mọi hàng đã
  lọc, điều khiển pending, hành vi completed chỉ đọc và ép `409` trạng thái kết
  thúc FE07.
- Mở rộng harness E2E cô lập với thiết lập Quản trị tùy chọn, đọc yêu cầu Quản
  trị gắn FE07/auth, đọc danh mục người dùng an toàn và app tích hợp mới mỗi
  kiểm thử.
- RED-GREEN cho thấy cả fixture Quản trị thiếu và nhiễm trạng thái dùng chung
  xuyên kiểm thử trước khi thay đổi harness được chấp nhận.
- Bằng chứng tập trung mới đạt backend 80/80, frontend 48/48, system integration
  10/10, Playwright 2/2 và truy vết FE11 100%.
- `FE11-REQ01..FE11-REQ03` đã triển khai. CI PR nháp #40 `29679154327` đạt trên
  commit tích hợp `422246b`; `FE11-ACC01`, `TD-025`, H2/H3 và chấp nhận tích
  hợp con người vẫn mở.

## 2026-07-19 - Finalization Wave A đã triển khai và sẵn sàng H2

- Thêm migration FE11 lũy đẳng có guard, `UX_Users_Email` xác định, lưu email
  người dùng/thông báo chuẩn 255 ký tự, `DeactivatedAt` nullable và trường Thủ
  thư nullable 100 ký tự.
- Thêm kiểm tra Quản trị thực hiện tạo/gửi lại theo giao dịch chuẩn, xung đột
  trùng an toàn xác định, persistence tạo/đọc/cập nhật Thủ thư và phiên bản DTO
  hiệu dụng `COALESCE(UpdatedAt, CreatedAt)`.
- Thêm cập nhật người dùng được quản lý optimistic/no-op và vô hiệu hóa
  ACTIVE/LOCKED nguyên tử với phân biệt pending-activation, guard lượt mượn
  hoạt động, thu hồi REFRESH hoạt động, siêu dữ liệu audit an toàn và rollback.
- Căn chỉnh phê duyệt FE07 với thứ tự khóa member-first đã phê duyệt và thêm bao
  phủ kiểm thử SQL race bật thay đổi mà không đổi quyền sở hữu FE07 hay quy tắc
  mượn.
- Loại quyền Quản trị phát triển ngầm; cập nhật/vô hiệu hóa hiện gửi phiên bản
  hiệu dụng đã tải, hỗ trợ trường Thủ thư và tải lại trạng thái chuẩn.
- Review diff cuối thêm ba hồi quy RED-GREEN: ép kiểu/nullability migration, ưu
  tiên tác nhân chuẩn theo giao dịch trước lộ email trùng và từ chối hoàn tất
  thiết lập cho tài khoản có `DeactivatedAt` khác null.
- Wave A vẫn chưa commit chờ H2. `FE11-LIFE06`, chấp nhận trình duyệt Wave B,
  bằng chứng merge/CI cuối và closeout B7 toàn tính năng vẫn mở.
- Áp dụng migration FE11 hai lần và qua suite concurrency/system SQL live dùng
  chung trên SQL Server disposable; bằng chứng cleanup ghi trong review Live SQL
  full reconciliation.

## 2026-07-19 - Governance Batch hoàn tất được kích hoạt

- Nâng `SPEC.md` lên 0.4.3 và kích hoạt Batch hoàn tất Hybrid SDD+ADD
  Full-depth đã phê duyệt; triển khai sản phẩm chưa bắt đầu.
- Đồng bộ FE02/FE03/FE10/FE11, ADR-002 và hợp đồng API dùng chung cho lưu email
  255 ký tự, trường Thủ thư/hồ sơ 100 ký tự và quyền sở hữu migration lũy đẳng.
- Khóa `UserManagementView.updatedAt` thành
  `COALESCE(Users.UpdatedAt, Users.CreatedAt)`, từ chối vô hiệu hóa
  pending-activation, kiểm tra lại Quản trị thực hiện tạo/gửi lại có giao dịch và
  xung đột email trùng xác định.
- Kích hoạt `FE11-FIN01..FE11-FIN02`, mục tiêu xác thực Wave A/Wave B và trạng
  thái nợ TD-012/014/015/016/017/025 trong khi giữ mọi nhiệm vụ mới chưa chọn.
- Giữ bằng chứng B7 thiết lập tài khoản lịch sử trong khi đánh dấu
  AC-FE11-003/010/021 là `PARTIAL` chỉ cho củng cố Quản trị thực hiện và trường
  Thủ thư đã phê duyệt mới mà Wave A phải chứng minh.
- Giữ FE07 là chủ sở hữu thay đổi duyệt/từ chối duy nhất và khóa danh sách/chi
  tiết yêu cầu Quản trị chuẩn, phân trang máy chủ, CSV, bằng chứng Dashboard và
  phạm vi chấp nhận trình duyệt.
- Công việc sản phẩm bị chặn cho đến khi PR governance qua kiểm tra, nhận H3 và
  merge vào `main`.

## 2026-07-19 - Điều hướng và quyền Quản trị đã tích hợp (B7)

- H2 và H3 phê duyệt ngày 2026-07-19 cho diff triển khai không đổi và review tích
  hợp PR cuối.
- PR #37 qua `foundation-checks` `29654621448` và merge vào `main` là
  `356130e4905a59d219bae8e9b369f7690348cba2`.
- CI `main` hậu merge chính xác `29655548150` qua backend/system tests,
  coverage, lint/tests/build frontend, E2E trình duyệt và import health backend.
- Đóng `FE11-PERM01..FE11-PERM06` và giải quyết `TD-023` mà không đổi hành vi
  production FE04, FE12, schema, thay quyền hay CRUD vai trò.
- `TD-025` vẫn mở và toàn FE11 vẫn `Implementation State: DEFERRED`.

## 2026-07-19 - Điều hướng và quyền Quản trị sẵn sàng H2

- Thêm quyền sở hữu FE11 bất biến với policy Giai đoạn 1 đúng ba vai trò, 15
  quyền và DTO service allowlist mới.
- Thêm `GET /api/admin/permissions` ưu tiên Quản trị với bao phủ route
  401/403/200 tập trung, không phụ thuộc repository hay thay đổi.
- Căn chỉnh Admin Console thành đúng tám mục sidebar đã phê duyệt và thay ma
  trận mã hóa cứng bằng dữ liệu FE11 cộng số `usersByRole` FE12 độc lập.
- Thêm bao phủ module động, ô ma trận, trạng thái retry/lỗi độc lập, tài liệu
  API/OpenAPI nghiêm ngặt và kiểm thử suy dẫn frontend tập trung.
- Bằng chứng RED-GREEN hoàn tất; xác thực đầy đủ đạt backend 606/606 và
  frontend 120/120 cùng coverage, lint, build, OpenAPI, health, truy vết và hồi
  quy trình duyệt.
- Triển khai vẫn chưa commit chờ H2. `TD-023` giữ `IN PROGRESS`,
  `FE11-PERM06` giữ mở, `TD-025` giữ mở và toàn FE11 vẫn hoãn.

## 2026-07-19 - Lát cắt điều hướng và quyền Quản trị được phê duyệt

- Phê duyệt design và kế hoạch triển khai Hybrid SDD + ADD Standard-depth cho
  `TD-023`.
- Khóa sidebar Admin Console đúng tám mục, `GET /api/admin/permissions` chỉ
  Quản trị, policy FE11 chuẩn 15 hàng và số vai trò FE12 độc lập.
- Kích hoạt `FE11-PERM01..FE11-PERM06` và đánh dấu `TD-023` đang tiến hành
  nhưng không khẳng định triển khai sản phẩm.
- Giữ FE04 Membership, TD-025 và toàn tính năng
  `Implementation State: DEFERRED`.

## 2026-07-18 - Fast-Track Batch 1 đã tích hợp (B7)

- Đóng `TD-024` qua PR #33 (`3c88e432`) với CI hậu merge `29651173195`.
- Đóng `TD-026` qua PR #34 (`411fa25a`) với CI hậu merge `29652243809`.
- Đóng `TD-027` qua PR #35 (`c286cd9b`) với CI hậu merge `29652617587`.
- Đánh dấu `FE11-AUD01`, `FE11-ENV01` và `FE11-META01` hoàn tất, chuyển ba bản
  ghi nợ sang truy vết đã giải quyết.
- Giữ `TD-023` và `TD-025` mở, toàn FE11 ở
  `Implementation State: DEFERRED`.

## 2026-07-18 - Triển khai Nhật ký kiểm toán Quản trị chuẩn sẵn sàng H2

- Thêm `GET /api/admin/audit-logs` chỉ Quản trị với xác thực query chuẩn cho
  `page`, `limit`, `q`, `action`, `actorId`, `from` và `to`; xác thực và phân
  quyền chạy trước xác thực chi tiết.
- Thay phân trang audit prototype bằng lọc SQL có tham số kiểu, tìm kiếm LIKE
  escape, phạm vi data/count dùng chung, thứ tự `CreatedAt DESC, LogId DESC`
  ổn định và `totalPages: 0` khi kết quả rỗng.
- Thêm phép chiếu default-deny nhận biết action theo ma trận action liên tính
  năng đã phê duyệt; metadata thô, user agent, khái niệm credential,
  note/reason/path thô và identifier không liên quan không được trả.
- Di chuyển UI Quản trị sang `adminApi.auditLogs`, DTO actor/target/details lồng
  nhau chuẩn, điều khiển lọc, phân trang limit 20 và render chi tiết an toàn
  chỉ-văn-bản React.
- Ngừng `GET /api/users/audit-logs` dưới dạng `404 NOT_FOUND` vô điều kiện,
  không xác thực hay gọi service; không còn alias tương thích.
- Bằng chứng RED-GREEN: lỗi hợp đồng route, repository, service và frontend
  được quan sát trước triển khai; backend tập trung 246/246, backend đầy đủ
  598/598 và frontend 111/111 đạt.
- Coverage là 92.51% statement, 82.46% branch, 97.1% function và 92.44% line;
  lint, build, parse OpenAPI, truy vết, diff, phạm vi và quét dữ liệu nhạy cảm
  đạt.
- Triển khai sẵn sàng H2 và chưa commit. `TD-024` giữ `IN PROGRESS`,
  `FE11-AUD01` giữ chưa chọn và toàn FE11 vẫn hoãn đến bằng chứng H2/H3/merge/
  hậu merge.

## 2026-07-18 - Fast-Track Batch 1 được kích hoạt

- Phê duyệt H1-001..H1-006 cho TD-024, TD-026 và TD-027.
- Sửa thẩm quyền H1/H2/H3 và yêu cầu PR tài liệu kích hoạt qua kiểm tra và H3
  trước merge.
- Khóa Audit Logs vào tên query SPEC và phép chiếu default-deny nhận biết action.
- Chọn `/api/reports/users` FE12 cho bộ đếm Quản trị và giữ vỏ danh sách FE11.
- Phê duyệt ma trận TD-027 ô hiện có chính xác và quyền sở hữu SPEC hậu TD-026
  nối tiếp.
- Triển khai sản phẩm vẫn chờ cổng H2/H3 từng lát cắt; toàn FE11 vẫn hoãn.

## 2026-07-18 - Hợp đồng UI vai trò Quản trị đã tích hợp (B7)

- PR #30 merge vào `main` là commit
  `c20d3251254467a1543355f18c705590724f5b55`.
- Lượt CI PR `29643619999` và GitHub Actions hậu merge `29644292781` qua
  `foundation-checks`, gồm backend/system tests, coverage, lint/tests/build
  frontend, E2E trình duyệt và import health backend.
- Tích hợp B7 hoàn tất cho `FE11-UIR01..UIR05`; `TD-022` được giải quyết.
- `Implementation State: DEFERRED` toàn tính năng và mọi công việc FE11 không
  liên quan không đổi.

## 2026-07-18 - Hợp đồng UI vai trò Quản trị đã triển khai và sẵn sàng xác thực

- Cập nhật adapter API vai trò frontend để gửi `roleId` số trong body gán chuẩn
  và đường thu hồi.
- Thêm xác thực danh mục dương/duy nhất đầy đủ cho `ADMIN`, `LIBRARIAN` và
  `MEMBER`, không fallback ID mã hóa cứng hay thay đổi tên vai trò.
- Thêm lập kế hoạch preflight xác định, gán trước thu hồi, giữ vai trò không thể
  sửa và lưu no-op không yêu cầu.
- Thêm đối soát lỗi đầu tiên, tải lại mục tiêu chuẩn vào modal mở và vô hiệu Lưu
  khi đối soát cũng thất bại.
- Bằng chứng RED-GREEN: 12/12 frontend tập trung; bằng chứng xác thực: 101/101
  frontend đầy đủ và 105/105 kiểm thử vai trò backend tập trung,
  lint/build/truy vết/diff/bảo mật ĐẠT.
- Review triển khai con người, merge và CI hậu merge vẫn chờ; `FE11-UIR05` và
  `TD-022` chưa đóng.
- Hành vi vai trò backend, `SPEC.md`, schema và mọi công việc FE11 không liên
  quan không đổi và hoãn.

## 2026-07-18 - Lát cắt hợp đồng UI vai trò Quản trị được phê duyệt

- Phê duyệt design và kế hoạch triển khai `TD-022` hữu hạn cho ánh xạ lựa chọn
  vai trò Quản trị sang ID vai trò số từ danh mục vai trò FE11 đã xác thực.
- Yêu cầu xác thực danh mục trước thay đổi, gán trước thu hồi, không ID vai trò
  mã hóa cứng và tải lại người dùng mục tiêu chuẩn sau lỗi một phần.
- Thêm `FE11-UIR01..UIR05`; checkpoint kế hoạch này không khẳng định bằng
  chứng triển khai hay xác thực.
- Hành vi vai trò backend, `SPEC.md`, schema và mọi công việc FE11 không liên
  quan không đổi và hoãn.

## 2026-07-18 - Ngữ cảnh và trôi lệch Admin Console FE11 đã đối soát

- Audit thay đổi FE11/Admin Console từ base `66642b5` tới `origin/main@8da84bd`
  với review Standards và Spec riêng.
- Xác nhận hoàn tất B7 chỉ cho thiết lập tài khoản, thay vai trò backend giao
  dịch và danh sách/chi tiết người dùng an toàn; toàn tính năng
  `Implementation State: DEFERRED` không đổi.
- Phân loại lại thay đổi phân trang/hiển thị Audit Log hiện có là hành vi
  prototype một phần, không phải phù hợp với hợp đồng lọc/che
  `/api/admin/audit-logs` chuẩn.
- Ghi trôi lệch UI vai trò Quản trị, điều hướng/quyền, Audit Logs, Request
  Management, list-envelope và truy vết vào `TECH_DEBT.md`.
- Đối soát bộ nhớ dự án, trạng thái ADR, tài liệu API/kiểm thử dùng chung và lịch
  sử nhiệm vụ FE11 mà không đổi SPEC đã phê duyệt hay hành vi sản phẩm.
- Review con người xác nhận audit và đối soát chỉ-tài-liệu ngày 2026-07-18;
  `FE11-C01` đóng mà không phê duyệt lát cắt triển khai khắc phục.

## 2026-07-18 - Danh sách và chi tiết người dùng an toàn đã tích hợp (B7)

- PR #27 merge vào `main` là commit
  `ed6bd71714bf506ae838305e5946e3bbd9380102`.
- GitHub Actions hậu merge `29639933730` qua mọi `foundation-checks`, gồm
  backend/system tests, coverage, lint/tests/build frontend, E2E trình duyệt và
  import health backend.
- Tích hợp B7 hoàn tất cho `FE11-U01..U06`; công việc FE11 còn lại vẫn hoãn.

## 2026-07-18 - Danh sách và chi tiết người dùng an toàn đã triển khai và sẵn sàng xác thực

- Thêm xác thực ưu tiên Quản trị cho page, limit, status, role, search và ID
  người dùng chi tiết; giá trị cung cấp không hợp lệ bị từ chối thay vì ép ngưỡng.
- Thay phản hồi người dùng được quản lý FE11 bằng allowlist rõ ràng,
  `phoneNumber` và vai trò chữ hoa xác định; cột bổ sung thù địch bị loại.
- Hạn chế tìm kiếm danh sách vào email, họ tên và ID người dùng trong khi giữ
  thứ tự `CreatedAt DESC, UserId DESC`.
- Thêm truy vấn chi tiết có tham số cho tóm tắt `BORROWED` lưu, số dư chưa trả
  `UNPAID` và đặt chỗ `ACTIVE`/`NOTIFIED` với mặc định số không.
- Người dùng chi tiết vắng trả `404 USER_NOT_FOUND`; hành vi không tìm thấy
  cập nhật/vô hiệu hóa vẫn hoãn.
- UI Quản trị hiện bỏ giá trị `ALL`/query rỗng, tìm nạp chi tiết thực, render mọi
  tóm tắt và tải lại dữ liệu danh sách cũ sau 404 chi tiết.
- Bằng chứng tự động: backend tập trung 105/105, backend đầy đủ 434/434,
  frontend 81/81, statement 92.47%, branch 82.35%,
  lint/build/truy vết/bảo mật/diff ĐẠT.
- Review triển khai con người phê duyệt ngày 2026-07-18; `FE11-U06` hoàn tất.
- Không migration schema và `TD-012` vẫn mở; công việc FE11 còn lại vẫn hoãn.

## 2026-07-18 - Lát cắt danh sách và chi tiết người dùng an toàn được phê duyệt

- Phê duyệt allowlist `UserManagementView` rõ ràng với `phoneNumber` và
  `relatedSummary` chỉ-chi-tiết.
- Yêu cầu xác thực đầu vào danh sách/chi tiết nghiêm ngặt, trường tìm kiếm đã
  phê duyệt, thứ tự ổn định và `404 USER_NOT_FOUND` xác định.
- Khóa ngữ nghĩa tổng hợp vào `BORROWED` FE07 đã lưu, số dư chưa trả `UNPAID`
  FE09 và đặt chỗ `ACTIVE`/`NOTIFIED` FE08.
- Giữ `department`/`specialization` dưới `TD-012`; lát cắt này không thay schema
  và không trả placeholder null giả.
- Yêu cầu kiểm thử RED-GREEN route, service, repository và frontend; mục kế
  hoạch này không khẳng định bằng chứng triển khai.

## 2026-07-18 - Quản lý vai trò có giao dịch đã tích hợp (B7)

- PR #25 merge vào `main` là commit
  `0e1ef8f67e2d7a454e96b8b5d6878d31ed03eae0`.
- GitHub Actions hậu merge `29631406399` qua mọi `foundation-checks`, gồm
  backend/system tests, coverage, lint/tests/build frontend, E2E trình duyệt và
  import health backend.
- Tích hợp B7 hoàn tất cho `FE11-R01..R05`; công việc FE11 còn lại vẫn hoãn.

## 2026-07-18 - Quản lý vai trò có giao dịch đã triển khai và sẵn sàng xác thực

- Thêm xác thực số nguyên dương ưu tiên Quản trị cho endpoint gán và thu hồi vai
  trò.
- Thêm giao dịch SQL có khóa kiểm tra lại Quản trị hoạt động thực hiện, người
  dùng mục tiêu, vai trò yêu cầu, ánh xạ mục tiêu và người giữ Quản trị hoạt
  động.
- Thay vai trò và audit hiện commit hoặc rollback cùng nhau; gán trùng và thu
  hồi vắng trả lỗi xác định.
- Thêm bảo vệ vai trò người dùng cuối và Quản trị hoạt động cuối dưới
  `UPDLOCK, HOLDLOCK`.
- Thêm kiểm thử RED-GREEN route, service và repository: backend tập trung 70/70
  và backend đầy đủ 399/399 đạt.
- Coverage repository là 100% statement/line/function và 90.24% branch;
  coverage dự án và cổng truy vết đạt.
- Review triển khai con người phê duyệt ngày 2026-07-18; `FE11-R05` hoàn tất.
- Công việc FE11 còn lại vẫn hoãn.

## 2026-07-18 - Lát cắt quản lý vai trò có giao dịch được phê duyệt

- Phê duyệt design và kế hoạch triển khai gán/thu hồi vai trò FE11 hữu hạn.
- Khóa ngữ nghĩa lỗi xác định cho tác nhân/mục tiêu/vai trò thiếu, gán trùng,
  ánh xạ vắng, vai trò người dùng cuối và Quản trị hoạt động cuối.
- Yêu cầu một giao dịch SQL có tham số cho thay vai trò cộng audit với
  `UPDLOCK, HOLDLOCK`.
- Giữ công việc FE11 còn lại hoãn và thêm metadata
  `Implementation State: DEFERRED` tương thích tiến cho tính năng này; lát cắt
  vai trò theo dõi riêng là `FE11-R01..R05`.
- Mục kế hoạch này không khẳng định bằng chứng triển khai.

## 2026-07-18 - Sửa phân trang và hiển thị Nhật ký kiểm toán Quản trị

- Thêm phân trang phía máy chủ chỉ Quản trị cho audit log với thứ tự
  `CreatedAt DESC, LogId DESC` ổn định.
- Sửa thao tác làm mới Quản trị để Audit Logs tải lại dữ liệu riêng thay vì tải
  lại danh mục người dùng.
- Hạn chế join mục tiêu người dùng vào sự kiện audit người dùng/tài khoản để ID
  mục tiêu mượn, thông báo, catalog và membership không bị gán nhãn là người
  dùng.
- Cập nhật bảng audit hiển thị danh tính tác nhân, loại/ID mục tiêu, IP,
  timestamp đầy đủ, tổng bản ghi, thời điểm làm mới cuối và phân trang Quản trị
  dùng chung.
- Thêm bao phủ service và route cho chuẩn hóa phân trang và phân quyền chỉ Quản
  trị.

## 2026-07-17 - Baseline Giai đoạn 1 được phê duyệt

- Nhật phê duyệt vòng đời tài khoản FE11, vai trò, cập nhật no-op, danh sách
  người dùng, concurrency và ranh giới thiết lập tài khoản đã chuẩn hóa làm
  baseline Giai đoạn 1; triển khai còn lại hoãn như được tài liệu hóa.

## 2026-07-17 - Audit hợp đồng danh sách người dùng và no-op cuối

- Xác định hành vi cập nhật cùng-email/no-op: HTTP `200`, `UpdatedAt` không đổi
  và không audit thành công khi không có gì đổi.
- Làm rõ mặc định, giới hạn, bộ lọc, thứ tự ổn định và trường tìm kiếm an toàn
  của danh sách người dùng.

## 2026-07-17 - Củng cố concurrency vòng đời tài khoản và vai trò

- Nâng `SPEC.md` lên 0.4.2.
- Làm vô hiệu hóa nguyên tử với `deactivatedAt`, vô hiệu thông tin xác thực và
  ghi audit.
- Thêm kiểm tra Quản trị cuối tuần tự và optimistic concurrency vào vô hiệu hóa.
- Hạn chế kiểu tạo tài khoản vào `member` và `librarian`; `Users.DeactivatedAt`
  nullable yêu cầu migration cơ sở dữ liệu trước triển khai.

## 2026-07-17 - Sửa DTO an toàn và concurrency xác định

- Nâng `SPEC.md` lên 0.4.1 và giữ bản sửa `READY FOR REVIEW`.
- Thay cụm từ rộng "mọi thông tin người dùng" bằng allowlist
  `UserManagementView` rõ ràng và ranh giới trường bị cấm.
- Chuẩn hóa cập nhật vào optimistic concurrency `expectedUpdatedAt` với
  `409 STALE_USER_STATE`; loại phương án last-write-wins.
- Thêm truy vết AC-FE11-016..019 thiếu, AC-FE11-023 và ý định kiểm thử kế hoạch
  cụ thể cho mọi ánh xạ từng là `TBD`.
- Sửa trạng thái nhiệm vụ/kiểm thử: lát cắt thiết lập tài khoản hoàn tất còn mọi
  triển khai FE11 khác hoãn.

## 2026-07-15 - Lát cắt thiết lập tài khoản đã triển khai và sẵn sàng xác thực

- Tài khoản Member/Librarian do Quản trị tạo hiện commit là `INACTIVE` với hồ
  sơ, vai trò, mã thiết lập hash 24 giờ và audit trong một giao dịch.
- Gửi FE10 chạy sau commit và chỉ trả trạng thái `SENT`/`FAILED` an toàn.
- Thêm gửi lại thiết lập chỉ Quản trị với kiểm tra điều kiện hợp lệ, row lock,
  cooldown 60 giây, thu hồi mã trước, mã/sự kiện/khóa mới và audit giao dịch.
- Thêm tiêu thụ liên kết thiết lập frontend qua endpoint reset FE02 hiện có
  không có điều khiển email/OTP.
- Bằng chứng tự động Nhiệm vụ 7 đạt: backend bị ảnh hưởng 170/170, frontend
  75/75, lint, build, truy vết, quét credential và kiểm tra diff.
- Nhat xác nhận gói xác thực liên tính năng cuối; `FE11-S07` hoàn tất, công việc
  FE11 không liên quan đều hoãn.

## 2026-07-15 - Sửa hợp đồng thiết lập tài khoản

- Nâng `SPEC.md` lên 0.4.0 và đánh dấu bản sửa sẵn sàng review con người.
- Thay tạo `ACTIVE` ngay bằng vòng đời thiết lập `INACTIVE -> ACTIVE` xác định.
- Thêm tách quyền sở hữu ADR-005: FE11 phát hành/xoay `ACCOUNT_SETUP`, FE10 gửi
  nó qua requester gắn FE11 và FE02 tiêu thụ nó rồi kích hoạt tài khoản.
- Yêu cầu hash bcrypt ngẫu nhiên không thể dùng thay placeholder cố định theo
  nghĩa đen.
- Thêm ngữ nghĩa gửi sau commit an toàn và gửi lại chỉ Quản trị với xoay mã thông
  báo/cooldown 60 giây.
- Thêm BR-FE11-021..025, FR-FE11-036..038, AC-FE11-020..022, EC-FE11-019..021
  và Q-FE11-014..016.
- Thay stub plan/task FE11 bằng lát cắt thiết lập tài khoản có thể review; công
  việc FE11 còn lại vẫn hoãn.

## 2026-06-03

- Tạo cấu trúc đặc tả tính năng FE11 Quản lý người dùng và vai trò.
- Thiết lập các tệp đặc tả: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md và
  CHANGELOG.md.
- Mở rộng phạm vi bao gồm xem danh sách người dùng, tạo tài khoản
  (thành viên/thủ thư), cập nhật thông tin người dùng, vô hiệu hóa tài khoản,
  quản lý tài khoản thủ thư và quản lý vai trò.
- Thêm ID yêu cầu ổn định cho quy tắc nghiệp vụ, yêu cầu chức năng, tiêu chí chấp
  nhận, edge case và câu hỏi mở.
- Xác định rủi ro chính liên quan tới kiểm soát truy cập, khóa tài khoản và ghi
  audit.
- Làm rõ thiết lập tài khoản do Quản trị tạo an toàn: không mật khẩu do Quản trị
  nhập, không hoạt động trước thiết lập, hoàn tất thiết lập qua FE02.

## 2026-06-09

- Đặt chủ sở hữu FE11 là Dung theo bảng phân công mới nhất.
- Merge phạm vi liên quan từ draft legacy
  `.sdd/specs/feat-role-and-management` vào folder chuẩn
  `.sdd/specs/feat-user-role-management`.
- Căn chỉnh use case và feature test FE11 với bảng phân công: UC49-UC57 và
  FT50-FT58.
- Giữ luồng cập nhật/vô hiệu hóa tài khoản thủ thư từ draft legacy.
- Chuyển mở khóa tài khoản, kích hoạt lại tài khoản và đặt lại mật khẩu do Quản
  trị khởi tạo ra ngoài phạm vi phân công FE11 chính trừ khi được phê duyệt rõ
  ràng sau này.

## 2026-06-10

- Cập nhật policy hợp đồng API để cho phép phê duyệt trong `SPEC.md` trừ khi
  nhóm đưa lại tài liệu hợp đồng API dùng chung.

## 2026-06-10 - Quyết định review Giai đoạn 1 được phê duyệt

- Phê duyệt quyết định câu hỏi mở từ
  `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Cập nhật trạng thái quyết định `SPEC.md` từ draft/proposed/open thành approved
  nơi phù hợp.
- Giữ kiểm soát phạm vi Giai đoạn 1 và hạng mục công việc tương lai hoãn rõ
  ràng.

## 2026-06-15

- Cập nhật hành vi tạo tài khoản FE11 để tài khoản thành viên và thủ thư do Quản
  trị tạo có trạng thái `ACTIVE` ngay.
- Giữ thiết lập mật khẩu là luồng FE02 riêng; Quản trị vẫn không nhập hay xem mật
  khẩu người dùng.

## 2026-06-21

- Làm rõ việc xếp hàng thông báo thiết lập tài khoản do Quản trị tạo phải dung
  nạp khác biệt schema/mẫu thông báo Giai đoạn 1.
- Tài liệu hóa luồng tạo người dùng hợp lệ không được trả lỗi máy chủ nội bộ chỉ
  vì cột nội dung thông báo tùy chọn không có.

## 2026-06-25

- Nâng phiên bản 0.1.0 -> 0.2.0 (MINOR). Trạng thái không đổi (APPROVED).
- Thêm phần 7.1 với 15 yêu cầu chức năng EARS hành vi không mong muốn mới
  (FR-FE11-015 đến FR-FE11-029), nâng Alternative Flows, Business Rules, Edge
  Cases và Resolved Questions hiện có thành yêu cầu điều kiện lỗi/bất thường có
  thể truy vết.
- Bao phủ FR hành vi không mong muốn tăng từ ~21% (3 trên 14) lên ~62% (18 trên
  29), vượt mục tiêu >=30% theo hướng dẫn EARS Spec-Driven Development.
- Mỗi FR mới truy về EC/BR/AF/Q nguồn; không tạo logic mới.
- Cập nhật phần 16 Ma trận truy vết: thêm bảng Unwanted-Behavior riêng ánh xạ
  mỗi FR mới tới BR/EC/AF/Q nguồn và ca kiểm thử (TBD nơi chưa phân bổ kiểm thử),
  làm mới tổng Coverage Summary.

## 2026-06-30

- Nâng phiên bản `SPEC.md` lên 0.3.0 và cập nhật Last Updated thành 2026-06-30.
- Thêm yêu cầu admin console cho hiển thị sidebar, Dashboard, Permissions, Audit
  Logs và Request Management.
- Tài liệu hóa Confirm Payment và Confirm Borrow bị loại khỏi sidebar Quản trị
  trong prototype hiện tại.
- Làm rõ nội dung kiểu Reports Quản trị được hợp nhất vào Dashboard trong khi
  báo cáo chi tiết vẫn là FE12.
- Thêm quy tắc quản lý yêu cầu: yêu cầu đang chờ có thể hiển thị điều khiển thao
  tác; yêu cầu hoàn tất chỉ đọc.
- Thêm BR-FE11-016..020, FR-FE11-030..035, AC-FE11-016..019, EC-FE11-016..018
  và Q-FE11-011..013.

## 2026-07-22 - Tái cấu trúc frontend toàn bộ Admin Console được phê duyệt

- Phê duyệt tái cấu trúc module chỉ Shell dưới `FE11-UXR01..UXR07`.
- Giữ mọi hợp đồng backend, API, phân quyền, cơ sở dữ liệu, thay đổi FE07, quyền/
  audit FE11 và báo cáo FE12.
- Thêm thẻ người dùng đáp ứng, biểu đồ tập trung quyết định, thao tác có nhãn,
  trình bày audit bản địa hóa, quyết định quyền riêng, nhãn lọc cố định và trạng
  thái đang tải/lỗi/trống rõ ràng.
- Chỉ loại mã membership/payment Admin Console không thể tới; chức năng FE04 và
  FE09 chuẩn không đổi.

## 2026-07-22 Sửa admin console

- Loại thao tác sửa người dùng và cột chi tiết an toàn Audit; chứa bảng rộng
  trong vùng nội dung.

## 2026-07-27 - Kết nối Dashboard Quản trị

- Nâng FE11 lên v0.6.9.
- Thay tổng tư cách thành viên được phê duyệt rời rạc bằng metric tài khoản hoạt
  động từ ánh xạ `Users -> UserRoles -> Roles` chuẩn.
- Thêm số lượng tư cách thành viên FE04 và yêu cầu mượn FE07 đang chờ riêng.
- Kết nối mỗi thẻ tóm tắt Dashboard tới module Quản trị chủ sở hữu và mang bộ
  lọc vai trò/trạng thái áp dụng vào điểm đến.
- Sửa query trả-hôm-nay dùng ngày nghiệp vụ FE07 đã lưu thay vì suy ra ngày từ
  đồng hồ host SQL Server.
- Nâng FE11 lên v0.6.10 và căn chỉnh tổng hợp hoạt động với FE07: chi tiết
  `REQUESTED` chưa phê duyệt không còn làm phồng số mượn hàng đầu, mượn/trả-hôm
  nay dùng ngày nghiệp vụ Việt Nam và hoạt động ngày bằng không được hiển thị là
  số không đã xác nhận thay vì trạng thái dữ liệu rời rạc chung.
- Nâng FE11 lên v0.6.11 và khôi phục trình bày Dashboard năm thẻ/ba biểu đồ đã
  phê duyệt. Giữ đếm thành viên hoạt động chuẩn, tổng hợp mượn FE07 thực, lượt
  trả ngày nghiệp vụ Việt Nam và liên kết module; loại thẻ/biểu đồ hoạt động ngày
  bổ sung.
