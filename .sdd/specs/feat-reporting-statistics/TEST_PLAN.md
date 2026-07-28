# Kế hoạch kiểm thử FE12 - Báo cáo và thống kê

Phiên bản: 0.3.0
Trạng thái: H1 GOVERNANCE ACTIVATION - CHỜ THỰC THI
Cập nhật lần cuối: 2026-07-29

Đặc tả nguồn: `.sdd/specs/feat-reporting-statistics/SPEC.md`
ID tính năng: `BR-FE12-*`, `FR-FE12-*`, `AC-FE12-*`
Ánh xạ AC↔kiểm thử chuẩn: `SPEC.md` §16 Ma trận truy vết (tệp này là chiến
lược, không phải danh sách ca).

---

## 1. Phạm vi kiểm thử

Báo cáo mượn, kho và người dùng/thống kê chỉ đọc cho staff được ủy quyền.

Phần theo dõi chuẩn hóa bao phủ quyền truy cập Thủ thư vào cả ba báo cáo, ID
không rõ có định dạng hợp lệ trả báo cáo rỗng, nhóm trạng thái `UNKNOWN`, phân
trang/thứ tự xác định, audit lượt xem thành công bắt buộc và không có endpoint/
điều khiển xuất.

Nó cũng bao phủ hợp đồng frontend `{ metrics, rows, page, limit, totalRows }`
chính xác, trường hàng mượn chỉ-ngày, bộ lọc trạng thái/vị trí kho cùng-bản-sao
và predicate kỳ phê duyệt tư cách thành viên được đánh giá trong cơ sở dữ liệu
không thu hẹp tổng người dùng toàn cục.

## 2. Mục tiêu kiểm thử đơn vị

- Phép tính tổng hợp cho mượn, kho và người dùng.
- Xác thực ngày `YYYY-MM-DD` nghiêm ngặt và khoảng biên bao hàm.
- Khoảng ngày người dùng tác động tăng trưởng kỳ phê duyệt mà không đổi tổng
  toàn cục.
- Phân loại tồn thấp tại 0-2 bản sao sẵn có.
- Báo cáo không dữ liệu.
- Bảo đảm chỉ đọc: báo cáo không thay đổi dữ liệu nguồn.
- Quy tắc riêng tư: báo cáo không lộ dữ liệu cá nhân không cần thiết.

## 3. Mục tiêu kiểm thử API / tích hợp

- `GET /reports/borrowing`: luồng thành công, khoảng ngày không hợp lệ, vai trò
  bị cấm.
- `GET /reports/inventory`: luồng thành công, ngưỡng tồn thấp, kho rỗng, bộ lọc
  không hợp lệ, vai trò bị cấm.
- `GET /reports/users`: luồng thành công, ngữ nghĩa khoảng ngày phê duyệt, bộ
  lọc không hợp lệ, vai trò bị cấm.
- Endpoint báo cáo chỉ đọc và chỉ staff.
- Audit báo cáo thành công bỏ giá trị query thô; audit lỗi chỉ giữ trường chẩn
  đoán an toàn.
- OpenAPI tài liệu hóa phản hồi xác thực `400`, enum trạng thái chính xác và
  schema payload thành công cho mọi endpoint FE12.
- Repository báo cáo production và in-memory giữ cùng ngữ nghĩa bộ lọc, tổng hợp
  và hình dạng phản hồi.

## 4. Luồng chấp nhận E2E / thủ công

- Staff mở báo cáo mượn.
- Staff mở báo cáo kho.
- Staff mở báo cáo thống kê người dùng.
- Member/non-staff không thể truy cập báo cáo.

## 5. Bằng chứng hiện tại

- `backend/tests/reportRepository.test.js` (12 kiểm thử ranh giới tổng hợp/
  ngày tập trung, gồm predicate quá hạn library-business-date bị ràng buộc và
  hành vi thiếu `BorrowDate`).
- `backend/tests/reportContract.test.js` (4 kiểm thử hợp đồng bộ lọc, enum,
  phản hồi và lỗi OpenAPI).
- `backend/tests/reportRoutes.test.js` (11 kiểm thử tích hợp, gồm quyền riêng
  tư audit, ngày nghiêm ngặt, ngữ nghĩa kỳ người dùng và tồn thấp).
- `backend/tests/reportInMemoryParity.test.js` (10 kiểm thử parity production
  cho tổng hợp mượn, kho và người dùng, gồm lọc derived-overdue và hành vi thiếu
  `BorrowDate`).
- `backend/tests/reportDeterministicPolicy.test.js` (4 kiểm thử policy xác định
  bao phủ giới hạn phân trang, ID/trạng thái không rõ, thứ tự ổn định, hàng
  chỉ-ngày và không có bề mặt xuất).
- `backend/tests/reportService.test.js` (metadata audit lượt xem thành công an
  toàn và quyền truy cập mọi staff).
- `backend/tests/integration.test.js` và
  `backend/tests/systemIntegration.test.js` (envelope FE12 chuẩn trong luồng
  liên tính năng).
- `frontend/test/reportAccess.test.js` (6 kiểm thử guard route, trạng thái lỗi
  trung thực, metadata, đáp ứng và mặc định không lọc).
- `frontend/test/reportFilters.test.js` (3 kiểm thử query-builder).
- `frontend/test/reportOperationalFrontend.test.js` (3 kiểm thử hợp đồng
  shared-pattern/API/envelope xác định).
- Suite backend FE12 tập trung: **6 suite / 46 kiểm thử đạt**.
- Suite backend đầy đủ: **39 suite / 615 kiểm thử đạt**.
- Ngưỡng coverage backend đạt: **92.54% statement, 82.33% branch, 97.14%
  function, 92.47% line**.
- Kiểm thử frontend FE12 tập trung: **12 kiểm thử đạt**; suite frontend đầy đủ:
  **121 kiểm thử đạt**.
- Lint frontend và production build đạt.
- Ép truy vết đạt với FE12 có **10/10 FR được tag (100%)**.
- `git diff --check` đạt.
- Golden path hệ thống Playwright đạt **1/1** cho màn hình báo cáo mượn/kho/
  người dùng chuẩn, lọc kết quả bằng không mượn, tràn mobile, từ chối Member và
  chuyển hướng Guest.
- Sau khắc phục review repository, chấp nhận Playwright CLI cô lập exact-diff
  đạt lại trên cổng frontend `4184`: Librarian tải cả ba màn hình chuẩn,
  mobile `390x844` không tràn tài liệu, Member tới `/forbidden` và Guest tới
  `/login`. Cổng `4173` không bị chạm vì thuộc worktree FE03.

## 6. Bằng chứng trình duyệt

Bằng chứng trong phần này thuộc lát cắt base lịch sử. Nó chưa chứng minh
envelope phản hồi xác định v0.1.6 hoặc bảng hàng chi tiết mới trong worktree
hiện tại.

Bằng chứng trình duyệt wave xác định mới ngày 2026-07-19:

- Librarian hoàn tất golden path hệ thống và tải cả ba trang báo cáo chuẩn.
- Mượn hiển thị metric/hàng xác định và khoảng ngày tương lai tạo trạng thái
  chi tiết kết quả bằng không trung thực.
- Bảng chi tiết kho và thống kê người dùng render từ envelope chuẩn.
- Mobile `390x844` không tràn ngang ở cấp tài liệu.
- Quyền Member chuyển hướng tới `/forbidden`; quyền Guest chuyển hướng tới
  `/login`.
- Screenshot được ghi dưới `output/playwright/`; kiểm thử đạt dù có harness
  noise đã biết từ service `/api/profile/me` và `/api/books/metadata` không
  thuộc FE12 vẫn cần SQL Server.
- Chấp nhận follow-up exact-diff dùng phiên Playwright CLI cô lập tại
  `http://127.0.0.1:4184`; nó xác nhận lại quyền truy cập mượn/kho/người dùng
  của Librarian, bảng metric/chi tiết chuẩn, không tràn mobile, từ chối Member
  và chuyển hướng đăng nhập Guest. Screenshot mobile là
  `output/playwright/fe12-isolated-user-statistics-mobile.png`.

- Admin tải báo cáo mượn, kho và người dùng từ harness backend in-memory.
- Guest được chuyển hướng tới `/login`; Member được chuyển hướng tới
  `/forbidden`.
- Harness trình duyệt gốc hiển thị thể loại `Software Engineering` được ủy
  quyền và giữ bộ lọc đã chọn.
- Một review sau phát hiện payload harness không phản chiếu envelope controller
  metadata production; đường `response.data.categories` production hiện được
  bao phủ bởi kiểm thử hồi quy tập trung.
- Kiểm tra desktop `1265x720` và mobile `390x844` không có tràn trang, main,
  content, filter hay split; bảng rộng vẫn cuộn cục bộ trong
  `.lib-table-wrap`.
- Quan sát trạng thái tải, kho ít rỗng và lỗi backend không khả dụng. Trạng thái
  lỗi xóa dữ liệu báo cáo và không khẳng định dữ liệu fallback demo.
- Chụp screenshot trình duyệt bị timeout, nên bằng chứng được ghi từ DOM snapshot
  và giá trị layout đo thay vì image artifact.

## 7. Khoảng trống

- Re-review tích hợp con người đang chờ; chấp nhận trình duyệt do agent thực
  hiện hiện có nhưng không thay thế phê duyệt B7/L4 con người.
- Tích hợp hệ thống SQL-backed đạt với
  `SYSTEM_SQL_TEST_ALLOW_MUTATION=true` trên cơ sở dữ liệu reconciliation dùng
  một lần; cleanup được ghi trong
  `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Re-review lát cắt base lịch sử và chấp nhận con người không đóng phần theo dõi
  v0.1.6.
- Logout `AppLayout` dùng chung hiện điều hướng tới `/login` mà không xóa auth
  storage; lỗi authentication-shell có sẵn này ngoài FE12 và nên xử lý riêng.

## 8. Bằng chứng tích hợp B7

- Commit `58747bc10657ed1accb44950ae0c5edbd178a242` nằm trong `main` và
  `origin/main`.
- GitHub Actions CI `29249491818` đạt cho cùng commit.
- Job CI thành công bao phủ ép truy vết, kiểm thử backend, lint/kiểm thử/build
  frontend và kiểm tra import health backend.
- Bằng chứng chi tiết được ghi trong
  `.sdd/reviews/fe12-b7-integration-review-closeout-2026-07-13.md`.

## 9. Lệnh xác minh

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```

## 10. Theo dõi tìm kiếm và lọc

- Xác minh cả ba endpoint báo cáo chấp nhận `q` đã trim có tham số và kết hợp nó
  với bộ lọc riêng báo cáo.
- Xác minh tìm kiếm mượn bao phủ tiêu đề, barcode, danh tính tài khoản và ID
  người dùng không nội suy SQL.
- Xác minh tìm kiếm kho bao phủ tiêu đề, barcode, vị trí và ID sách trong khi giữ
  phép tính tồn thấp.
- Xác minh tìm kiếm người dùng bao phủ identifier/trường trạng thái an toàn
  không-PII và hàng chi tiết dùng `UserId ASC`.
- Xác minh tải thành công không render thông báo “Đã tải dữ liệu” dư trong khi
  lỗi vẫn hiển thị.

## 11. Ma trận kiểm thử operations summary và clock xác định

- AC-FE12-012/013: exact six-KPI body, staff role matrix và empty query allowlist.
- AC-FE12-014/015: missing KPI không thành `0`, fixed drill-down và desktop
  1440x900.
- AC-FE12-016: frozen-clock boundary trước/sau due date ở service, SQL contract,
  in-memory parity và system integration.
- Baseline regression giữ SIT-002/SIT-008 là `BORROWED` khi clock fixture là
  2026-07-14, bất kể host date.
- Read-only fixture snapshot phải byte-for-byte không đổi.

Không được sửa expected state để làm test xanh; RED phải chứng minh host-clock
leak trước GREEN clock injection.
