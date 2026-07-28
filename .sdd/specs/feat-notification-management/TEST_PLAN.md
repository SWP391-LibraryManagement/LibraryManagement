# Kế hoạch kiểm thử FE10 - Quản lý thông báo

Phiên bản: 0.6.0
Trạng thái: H1 GOVERNANCE ACTIVATION - CHỜ THỰC THI
Cập nhật lần cuối: 2026-07-29

Đặc tả nguồn: `.sdd/specs/feat-notification-management/SPEC.md`
ID tính năng: `BR-FE10-*`, `FR-FE10-*`, `AC-FE10-*`
Ánh xạ AC↔kiểm thử chuẩn: `SPEC.md` §16 Ma trận truy vết (tệp này là chiến
lược, không phải danh sách ca).

---

## 1. Phạm vi kiểm thử

Yêu cầu thông báo, quyền sở hữu nguồn/loại, gửi nhạy cảm trong bộ nhớ, xác thực
mẫu, lưu bền an toàn, tính lũy đẳng, xử lý xếp hàng, thử lại và hành vi hộp thư
thông báo cá nhân/trạng thái đã đọc đã được phê duyệt.

## 2. Mục tiêu kiểm thử đơn vị

- Kiểm tra hợp lệ yêu cầu thông báo.
- Kiểm tra hợp lệ biến mẫu.
- Quy tắc payload an toàn/che dữ liệu.
- Quyền sở hữu người nhận và khả năng hiển thị theo vai trò.
- Quy tắc chuyển đổi thử lại/trạng thái cho thông báo đang chờ/đã xử lý/thất bại.
- Quyền sở hữu chỉ FE02 cho xác minh/đặt lại và chỉ FE11 cho thiết lập tài khoản.
- Không lưu bền, ghi log, ghi kiểm toán hoặc phản hồi OTP/liên kết thiết lập/
  nội dung nhạy cảm đã kết xuất.

## 3. Mục tiêu kiểm thử API / tích hợp

- `POST /notifications/requests`: luồng thành công, mẫu không hợp lệ, thiếu
  người nhận, bị cấm.
- Trình yêu cầu FE02 trong tiến trình: thành công/thất bại OTP xác minh/đặt lại,
  biến, tính lũy đẳng và không gửi trùng.
- Trình yêu cầu FE11 trong tiến trình: thành công/thất bại thiết lập tài khoản,
  biến, quyền sở hữu nguồn và ngữ nghĩa gửi lại bằng mã thông báo mới.
- `POST /notifications/process-pending`: luồng thành công, không có bản ghi
  chờ, xử lý gửi thất bại, không được ủy quyền.
- `GET /notifications/mine`: xác thực, ba vai trò được cho phép, bộ lọc/phân
  trang/thứ tự phía SQL, phép chiếu an toàn, ranh giới bản ghi của chính mình
  và trang trống.
- `GET /notifications/mine/unread-count`: chỉ các hàng chưa đọc đủ điều kiện
  của chính mình.
- `PATCH /notifications/{id}/read`: tính lũy đẳng cùng `404` không thể phân
  biệt cho hàng không tồn tại, nhạy cảm và của người dùng khác.
- `PATCH /notifications/mine/read-all`: một dấu thời gian máy chủ, chỉ hàng đủ
  điều kiện của chính mình và số lượng phát lại bằng không.
- Fan-in FE04/FE07/FE08 chứng minh một bản ghi email đã lưu bền cũng chính là
  hàng hộp thư.

## 4. Luồng chấp nhận E2E / thủ công

- Thông điệp đăng ký/đặt lại/thiết lập tài khoản đến hộp thư kiểm thử/nhà cung
  cấp mô phỏng đã cấu hình.
- Thông tin xác thực nhạy cảm và nội dung nhạy cảm đã kết xuất không bao giờ
  xuất hiện trên bề mặt API/kiểm toán/quản trị.
- Lỗi nhà cung cấp giữ luồng nguồn ở trạng thái hoàn tất với trạng thái an toàn.
- Mỗi MEMBER, LIBRARIAN và ADMIN đều thấy chuông dùng chung và chỉ hộp
  thư của chính họ.
- Giới hạn huy hiệu, phần xem trước năm mục chưa đọc, bộ lọc, phân trang 20 mục,
  đánh dấu tất cả và điều hướng do backend suy ra hoạt động như đặc tả.
- Một thay đổi trạng thái đọc thất bại giữ hàng ở trạng thái chưa đọc, hiển thị
  phản hồi an toàn và không chặn một tuyến nghiệp vụ đã có trong danh sách cho
  phép.

## 5. Bằng chứng hiện tại

- `backend/tests/notificationInboxMigration.test.js` bao phủ `ReadAt` có thể
  null, điền lùi bản ghi đủ điều kiện chỉ ở lần chạy đầu, điều kiện loại/mẫu
  chính xác, tạo chỉ mục có thể lặp lại và hợp đồng giao dịch/lỗi Azure SQL.
- Bằng chứng tập trung FE10-I01: 4 kiểm thử hợp đồng migration đạt; migration,
  hồi quy repository hiện có và ma trận migration OTP đạt 11/11; chuẩn bị schema
  Azure hoàn tất mà không có câu lệnh tạo/chuyển cơ sở dữ liệu.
- Lần diễn tập SQL Server dùng một lần được chỉ định lần đầu phát hiện lỗi biên
  dịch `ReadAt` trong cùng một lô. Một kiểm thử hồi quy RED đã được thêm, cập
  nhật/chỉ mục được chuyển phía sau `sys.sp_executesql`, và lần diễn tập nghiêm
  ngặt hai lượt sau đó đã đạt: 1 cột có thể null, 1 chỉ mục, 5 hàng lịch sử đủ
  điều kiện đã điền lùi, 6 hàng bị loại vẫn chưa đọc, hàng sau lượt chạy đầu vẫn
  chưa đọc, các tổng hợp được bảo vệ không đổi và cơ sở dữ liệu dùng một lần đã
  bị xóa.
- `backend/tests/notificationInboxRepository.test.js` và bộ kiểm thử route mở
  rộng bao phủ phép chiếu an toàn chính xác, danh sách cho phép thao tác, quyền
  sở hữu/bộ lọc SQL, cả ba vai trò đăng nhập, xác thực, `404` an toàn trước IDOR,
  đánh dấu một/đánh dấu tất cả có tính lũy đẳng và trung lập với trạng thái gửi.
  Bằng chứng tập trung đạt 154/154.
- Cổng bao phủ backend đầy đủ sau rebase `main@12faead` đã được phê duyệt đạt
  69/69 bộ và 1116/1116 kiểm thử với 91.84% câu lệnh, 80.70% nhánh, 97.59% hàm
  và 91.76% dòng.
- Bằng chứng frontend FE10-I04..I06 đạt 259/259 kiểm thử Node, ESLint và bản
  dựng production Vite. Nó bao phủ bốn phương thức client được ủy quyền, làm mới
  số lượng theo tiêu điểm/60 giây không chồng lấp, danh sách cho phép thao tác
  chính xác, phần xem trước năm mục dễ tiếp cận, trang được bảo vệ, bộ lọc và
  phân trang máy chủ.
- Kiểm toán ranh giới H2 cuối thay đổi liên kết SQL `@Offset` từ `INT` thành
  `BIGINT`; kiểm thử hồi quy repository đạt 5/5 và SQL Server chấp nhận probe
  offset hợp đồng tối đa (`214748364600`) mà không tràn.
- Hồi quy fan-in nguồn FE10-I07 đạt 5/5 bộ và 285/285 kiểm thử trên FE04, FE07,
  FE08, FE10 và tích hợp hệ thống. Khẳng định tích hợp chứng minh đúng một hàng
  email đủ điều kiện cho mỗi kết quả nguồn, liệt kê của chính người dùng, `404`
  không thể phân biệt giữa người dùng, phát lại thao tác đọc và trạng thái gửi
  không đổi.
- `tests/e2e/fe10-notification-inbox.spec.js` đạt 3/3 ca Chromium tập trung
  cho MEMBER/LIBRARIAN/ADMIN, `99+`, loại trừ nhạy cảm/không người dùng/khác
  người dùng, phát lại đánh dấu một/đánh dấu tất cả, lỗi đọc không chặn và không
  tràn tại 390x844.
- Toàn bộ bộ Chromium đạt 11/11 sau khi fixture xác thực tổng hợp FE09 được
  cập nhật để cô lập yêu cầu đếm chưa đọc nền mới. Chính sách triển khai đạt
  20/20, tích hợp hệ thống đạt 10/10, trạng thái traceability đạt 3/3 và
  traceability thực thi đạt với FE10 có 14/16 thẻ FR (88%, trên cổng 70%).
- Head PR chính xác `28c4f80` đạt CI `30306805399` và triển khai Azure staging
  `30307855616`. Xác minh Azure trực tiếp bao phủ quyền sở hữu
  MEMBER/LIBRARIAN/ADMIN, loại trừ nhạy cảm, phát lại đánh dấu một/đánh dấu tất
  cả, bộ lọc, điều hướng an toàn, HTTPS/CORS, điều kiện hậu migration, tổng hợp
  được bảo vệ và dọn dẹp probe/firewall.
- Các phát hiện giao diện H3 vòng một hiện có phạm vi RED/GREEN tập trung cho
  việc làm mới một mục đã đọc thành công không điều hướng, giữ đánh dấu tất cả
  độc lập với trang đang được lọc và nâng popover không đổi kích thước lên trên
  mọi tầng bố cục hiện tại chỉ khi mở.
- Kiểm tra bảo mật mới sau `main@12faead` phát hiện không có lỗ hổng dependency
  backend, bí mật độ tin cậy cao được thêm, conflict marker, mâu thuẫn hộp thư
  bị trì hoãn lỗi thời hoặc trường phản hồi không an toàn. Cổng kiểm toán
  frontend repository chỉ chấp nhận GHSA-qwww-vcr4-c8h2 vì ứng dụng dùng
  `BrowserRouter` khai báo và không dùng API RSC không ổn định được advisory đề
  cập.
- Bài đánh giá fail-closed cuối bổ sung hồi quy repository RED/GREEN yêu cầu cả
  hai bộ chọn SQL pending loại trừ `ACCOUNT_SETUP` cùng các loại nhạy cảm khác.
  RED chỉ thất bại với helper `listPending` cũ; GREEN tập trung đạt 3 bộ/161
  kiểm thử và bao phủ backend đầy đủ sau đó đạt 69 bộ/1114 kiểm thử.
- Upstream `main@f3ebe95` sau đó chỉ bổ sung ba tệp kiểm thử hồi quy FE07/FE08
  không chồng lấp; candidate đã đồng bộ chúng không xung đột và chạy lại toàn bộ
  frontend đạt 258/258 trước khi tạo fingerprint.
- Rebase `main@a240705` đã được phê duyệt giữ nguyên việc loại bỏ thao tác chỉnh
  sửa FE11 độc lập ở upstream. Các cổng mới đạt backend 69/69 bộ và 1084/1084
  kiểm thử, frontend 259/259 cùng lint/build, triển khai 20/20, hệ thống 10/10,
  trạng thái traceability 3/3, traceability FE10 14/16 (88%), Chromium 11/11,
  kiểm toán dependency, chuẩn bị schema Azure và vệ sinh diff. Số lượng backend
  giảm chỉ vì upstream đã loại bỏ các kiểm thử chỉnh sửa FE11 lỗi thời.
- Baseline trước triển khai trên `main@25c09ec`: backend 67 bộ / 1091 kiểm thử
  đạt và frontend 234/234 kiểm thử đạt.

Bằng chứng giao hàng v0.4.x lịch sử được giữ bên dưới:

- `backend/tests/notificationRoutes.test.js` bao phủ quyền sở hữu chuẩn, gửi
  OTP/thiết lập tài khoản trong bộ nhớ nhà cung cấp, ranh giới lưu bền/kiểm toán/
  phản hồi an toàn, tính lũy đẳng, xếp hàng, xử lý, thử lại và lỗi xác thực.
- `backend/tests/integration.test.js` bao gồm bằng chứng fan-in hộp thư cá nhân
  FE04/FE07/FE08.
- `backend/tests/fe10OtpTemplateMigration.test.js`
- Traceability: bao phủ `@spec` FR **100%** (`npm run trace:enforce`).
- Cổng ranh giới OTP mới: 4 bộ / 170 kiểm thử đạt.
- Cổng hồi quy backend đầy đủ: 53 bộ / 916 kiểm thử đạt.
- Bao phủ: 92.68% câu lệnh, 81.66% nhánh, 96.59% hàm, 92.61% dòng.
- Bằng chứng quyền sở hữu mở rộng bao phủ cả hai loại nhạy cảm FE02 đối với mọi
  trình yêu cầu trong danh sách cho phép khác, lỗi ghi đè nguồn HTTP chính xác
  và xoay vòng sự kiện mã thông báo đặt lại lặp lại.

## 6. Khoảng trống

- `database/Librarymanagement.sql`, các độ rộng dùng chung do FE11 sở hữu và
  migration OTP FE10 đã được đồng bộ; migration đã qua hai lần thực thi SQL
  Server dùng một lần.
- Tích hợp trình yêu cầu FE02 FE10-S04 và tích hợp kết quả tư cách thành viên
  FE04 FE10-S09 đã được fan-in vào worktree này.
- Xác thực tập trung FE02/FE10/tích hợp đạt 170/170. Chấp nhận của con người,
  tích hợp PR và CI `main` hậu merge chính xác đạt cho phạm vi nhà cung cấp
  được chèn; việc gửi qua nhà cung cấp thực vẫn ngoài phạm vi.

## 7. Lệnh / bằng chứng bắt buộc trước khi merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```

## 8. Trạng thái bằng chứng hiện tại v0.5.0

- Migration cục bộ, API/repository/frontend tập trung, fan-in, quyền riêng tư,
  backend/frontend đầy đủ, triển khai, hệ thống, traceability, quét diff/bảo
  mật và bằng chứng E2E Chromium đầy đủ đều hoàn tất.
- H2 đã phê duyệt commit `b11b59e`; CI PR của commit này và migration Azure hai
  lượt chính xác đã đạt. Lượt triển khai thủ công `30305596861` đã fail-closed
  ở preflight vì Windows CRLF và Linux LF tạo hash thô khác nhau.
- Một kiểm thử chính sách triển khai RED tái hiện ranh giới đa nền tảng còn
  thiếu. GREEN hiện suy ra hash byte LF và CRLF chính xác từ nội dung UTF-8
  không thay đổi, chỉ chấp nhận hash do operator lưu khi khớp một trong hai và
  từ chối thay đổi nội dung. Chính sách triển khai đạt 16/16.
- Phụ lục hash staging đã được H2 phê duyệt và công bố trên head PR #75
  `28c4f80`; CI exact-head `30306805399`, triển khai Azure ưu tiên backend
  `30307855616` và xác minh trực tiếp ba vai trò đã đạt.
- H3 vòng một thất bại do phát hiện ADR/trạng thái hiện tại và trạng thái giao
  diện/xếp chồng có giới hạn; biện pháp khắc phục tập trung đã đạt toàn bộ ma
  trận. Sau rebase chỉ tài liệu `main@30f936d`, H2 đã phê duyệt fingerprint
  `e123345be05b59a9e519d182b301ab5464160e8fc32aed8d17d3c463e28e0a15`.
  Head PR #75 `778e0a470d8a1083bf571a8007b3c058eee4bb22` đạt CI exact-head
  `30317424995` và Azure staging `30317621429`, sau đó H3 hai trục sạch và
  phê duyệt rõ ràng. Nó merge thành
  `b75776b10d6cf4b6868d2ba51eb3268073483b8b`; CI hậu merge `30341279111`
  và Azure staging tự động `30341540847` đã đạt.

## 9. Ma trận kiểm thử template FE07 v0.6.0

- Canonical pair theo template/source, không cho type-only ownership.
- Bốn template FE07, idempotent replay và duplicate prevention.
- Personal inbox eligibility và fixed `/borrowing/history`.
- Sensitive-field scan cho rejection reason/email/token/OTP/stack/provider.
- FE10 failure isolation trong integration FE07/FE08 và desktop navigation.

Migration contract phải chứng minh seed Azure SQL additive và rerun-safe.
