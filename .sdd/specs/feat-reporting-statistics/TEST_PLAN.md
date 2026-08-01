# Kế hoạch kiểm thử FE12 - Báo cáo và thống kê

Phiên bản: 0.3.0
Trạng thái: HOÀN THÀNH (`COMPLETE`); PR #89 ĐÃ HỢP NHẤT; CI VÀ AZURE ĐÚNG COMMIT ĐẠT
Cập nhật lần cuối: 2026-08-01

Đặc tả nguồn: `.sdd/specs/feat-reporting-statistics/SPEC.md`
ID tính năng: `BR-FE12-*`, `FR-FE12-*`, `AC-FE12-*`
Ánh xạ AC↔kiểm thử chuẩn: `SPEC.md` §16 Ma trận truy vết (tệp này là chiến
lược, không phải danh sách ca).

---

## 1. Phạm vi kiểm thử

Báo cáo mượn, kho và người dùng/thống kê chỉ đọc cho nhân viên được ủy quyền.

Phần theo dõi chuẩn hóa bao phủ quyền truy cập Thủ thư vào cả ba báo cáo, ID
không rõ có định dạng hợp lệ trả báo cáo rỗng, nhóm trạng thái `UNKNOWN`, phân
trang/thứ tự xác định, kiểm toán lượt xem thành công bắt buộc và không có API/
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
- API báo cáo chỉ đọc và chỉ nhân viên.
- Rà soát báo cáo thành công bỏ giá trị truy vấn thô; kiểm toán lỗi chỉ giữ trường chẩn
  đoán an toàn.
- OpenAPI tài liệu hóa phản hồi xác thực `400`, enum trạng thái chính xác và
  cấu trúc dữ liệu dữ liệu gửi thành công cho mọi API FE12.
- Tầng truy cập dữ liệu báo cáo môi trường thực tế và trong bộ nhớ giữ cùng ngữ nghĩa bộ lọc, tổng hợp
  và hình dạng phản hồi.

## 4. Luồng chấp nhận E2E / thủ công

- Nhân viên mở báo cáo mượn.
- Nhân viên mở báo cáo kho.
- Nhân viên mở báo cáo thống kê người dùng.
- Member/non-nhân viên không thể truy cập báo cáo.

## 5. Bằng chứng hiện tại

- `backend/tests/reportRepository.test.js` (12 kiểm thử ranh giới tổng hợp/
  ngày tập trung, gồm predicate quá hạn library-business-date bị ràng buộc và
  hành vi thiếu `BorrowDate`).
- `backend/tests/reportContract.test.js` (4 kiểm thử hợp đồng bộ lọc, enum,
  phản hồi và lỗi OpenAPI).
- `backend/tests/reportRoutes.test.js` (11 kiểm thử tích hợp, gồm quyền riêng
  tư kiểm toán, ngày nghiêm ngặt, ngữ nghĩa kỳ người dùng và tồn thấp).
- `backend/tests/reportInMemoryParity.test.js` (10 kiểm thử tính đồng nhất với môi trường thực tế
  cho tổng hợp mượn, kho và người dùng, gồm lọc derived-overdue và hành vi thiếu
  `BorrowDate`).
- `backend/tests/reportDeterministicPolicy.test.js` (4 kiểm thử quy tắc xác định
  bao phủ giới hạn phân trang, ID/trạng thái không rõ, thứ tự ổn định, hàng
  chỉ-ngày và không có chức năng xuất).
- `backend/tests/reportService.test.js` (siêu dữ liệu kiểm toán lượt xem thành công an
  toàn và quyền truy cập mọi nhân viên).
- `backend/tests/integration.test.js` và
  `backend/tests/systemIntegration.test.js` (cấu trúc phản hồi FE12 chuẩn trong luồng
  liên tính năng).
- `frontend/test/reportAccess.test.js` (6 kiểm thử guard tuyến API, trạng thái lỗi
  trung thực, siêu dữ liệu, đáp ứng và mặc định không lọc).
- `frontend/test/reportFilters.test.js` (3 kiểm thử truy vấn-builder).
- `frontend/test/reportOperationalFrontend.test.js` (3 kiểm thử hợp đồng
  shared-pattern/API/cấu trúc phản hồi xác định).
- Bộ backend FE12 tập trung: **6 bộ / 46 kiểm thử đạt**.
- Bộ backend đầy đủ: **39 bộ / 615 kiểm thử đạt**.
- Ngưỡng độ bao phủ backend đạt: **92.54% câu lệnh, 82.33% nhánh, 97.14%
  hàm, 92.47% dòng**.
- Kiểm thử frontend FE12 tập trung: **12 kiểm thử đạt**; bộ frontend đầy đủ:
  **121 kiểm thử đạt**.
- Kiểm tra mã frontend và tạo bản dựng cho môi trường thực tế đều đạt.
- Ép truy vết đạt với FE12 có **10/10 FR được tag (100%)**.
- `git diff --check` đạt.
- Luồng chính hệ thống Playwright đạt **1/1** cho màn hình báo cáo mượn/kho/
  người dùng chuẩn, lọc kết quả bằng không mượn, tràn điện thoại, từ chối Member và
  chuyển hướng Guest.
- Sau khi khắc phục phát hiện ở tầng truy cập dữ liệu, lượt kiểm thử Playwright
  CLI cô lập đúng phần thay đổi
  đạt lại trên cổng frontend `4184`: Librarian tải cả ba màn hình chuẩn,
  điện thoại `390x844` không tràn tài liệu, Member tới `/forbidden` và Guest tới
  `/login`. Cổng `4173` không bị chạm vì thuộc worktree FE03.

## 6. Bằng chứng trình duyệt

Bằng chứng trong phần này thuộc phạm vi nền lịch sử. Nó chưa chứng minh
cấu trúc phản hồi xác định v0.1.6 hoặc bảng hàng chi tiết mới trong worktree
hiện tại.

Bằng chứng trình duyệt lượt xác định mới ngày 2026-07-19:

- Librarian hoàn tất luồng chính hệ thống và tải cả ba trang báo cáo chuẩn.
- Mượn hiển thị chỉ số/hàng xác định và khoảng ngày tương lai tạo trạng thái
  chi tiết kết quả bằng không trung thực.
- Bảng chi tiết kho và thống kê người dùng được hiển thị từ cấu trúc phản hồi chuẩn.
- Điện thoại `390x844` không tràn ngang ở cấp tài liệu.
- Quyền Member chuyển hướng tới `/forbidden`; quyền Guest chuyển hướng tới
  `/login`.
- Ảnh chụp được ghi dưới `output/playwright/`; kiểm thử đạt dù có môi trường kiểm thử
  lỗi nền đã biết từ tầng dịch vụ `/api/profile/me` và `/api/books/metadata` không
  thuộc FE12 vẫn cần SQL Server.
- Lượt kiểm tra tiếp theo đúng phần thay đổi dùng phiên Playwright CLI cô lập tại
  `http://127.0.0.1:4184`; nó xác nhận lại quyền truy cập mượn/kho/người dùng
  của Librarian, bảng chỉ số/chi tiết chuẩn, không tràn điện thoại, từ chối Member
  và chuyển hướng đăng nhập Guest. Ảnh chụp điện thoại là
  `output/playwright/fe12-isolated-user-statistics-mobile.png`.

- Admin tải báo cáo mượn, kho và người dùng từ môi trường kiểm thử backend trong bộ nhớ.
- Guest được chuyển hướng tới `/login`; Member được chuyển hướng tới
  `/forbidden`.
- Môi trường kiểm thử trình duyệt gốc hiển thị thể loại `Software Engineering` được ủy
  quyền và giữ bộ lọc đã chọn.
- Một lượt rà soát sau đó phát hiện dữ liệu gửi của môi trường kiểm thử không
  phản chiếu cấu trúc phản hồi từ bộ điều khiển
  siêu dữ liệu môi trường thực tế; đường `response.data.categories` môi trường thực tế hiện được
  bao phủ bởi kiểm thử hồi quy tập trung.
- Kiểm tra máy tính `1265x720` và điện thoại `390x844` không có tràn ở trang,
  vùng nội dung chính, bộ lọc hoặc bố cục chia đôi; bảng rộng vẫn cuộn cục bộ trong
  `.lib-table-wrap`.
- Quan sát trạng thái tải, kho ít rỗng và lỗi backend không khả dụng. Trạng thái
  lỗi xóa dữ liệu báo cáo và không khẳng định dữ liệu dự phòng demo.
- Thao tác chụp ảnh trình duyệt bị quá thời gian, nên bằng chứng được ghi từ bản
  tổng hợp DOM và số đo bố cục thay vì tệp ảnh.

## 7. Trạng thái hoàn tất

- Rà soát lại tích hợp và phê duyệt B7/L4 của con người đã đóng trong H3/PR #89;
  chấp nhận tự động, SQL và trình duyệt vẫn là bằng chứng kỹ thuật bổ trợ.
- Tích hợp hệ thống SQL-backed đạt với
  `SYSTEM_SQL_TEST_ALLOW_MUTATION=true` trên cơ sở dữ liệu reconciliation dùng
  một lần; dọn dẹp được ghi trong
  `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Rà soát lại phạm vi nền lịch sử đã được thay thế bởi hoàn tất đúng commit
  `main@39092fb` và môi trường thử nghiệm Azure `30675744992`.
- Khi đăng xuất, `AppLayout` dùng chung hiện điều hướng tới `/login` mà không
  xóa dữ liệu xác thực đã lưu; lỗi có sẵn trong khung xác thực này nằm ngoài
  FE12 và nên được xử lý riêng.

## 8. Bằng chứng tích hợp B7

- Commit `58747bc10657ed1accb44950ae0c5edbd178a242` nằm trong `main` và
  `origin/main`.
- GitHub Actions CI `29249491818` đạt cho cùng commit.
- Job CI thành công bao phủ ép truy vết, kiểm thử backend, kiểm tra mã/kiểm thử/bản dựng
  frontend và kiểm tra khả năng nạp ứng dụng backend.
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

- Xác minh cả ba API báo cáo chấp nhận `q` đã trim có tham số và kết hợp nó
  với bộ lọc riêng báo cáo.
- Xác minh tìm kiếm mượn bao phủ tiêu đề, barcode, danh tính tài khoản và ID
  người dùng không nội suy SQL.
- Xác minh tìm kiếm kho bao phủ tiêu đề, barcode, vị trí và ID sách trong khi giữ
  phép tính tồn thấp.
- Xác minh tìm kiếm người dùng bao phủ identifier/trường trạng thái an toàn
  không-PII và hàng chi tiết dùng `UserId ASC`.
- Xác minh tải thành công không hiển thị thông báo “Đã tải dữ liệu” dư trong khi
  lỗi vẫn hiển thị.

## 11. Ma trận kiểm thử tổng quan vận hành và đồng hồ xác định

- AC-FE12-012/013: phản hồi đúng sáu KPI, ma trận vai trò nhân viên và danh sách
  cho phép không có tham số truy vấn.
- AC-FE12-014/015: KPI bị thiếu không thành `0`, liên kết xem chi tiết cố định và màn hình
  1440x900.
- AC-FE12-016: ranh giới đồng hồ cố định trước/sau hạn trả ở tầng dịch vụ, SQL hợp đồng,
  tính đồng nhất với bản trong bộ nhớ và kiểm thử tích hợp hệ thống.
- Kiểm thử hồi quy tại mốc chuẩn giữ SIT-002/SIT-008 là `BORROWED` khi đồng hồ
  dữ liệu kiểm thử là 2026-07-14, bất kể ngày trên máy chủ.
- Bản tổng hợp dữ liệu kiểm thử chỉ đọc phải giữ nguyên từng byte.

Không được sửa trạng thái mong đợi chỉ để kiểm thử đạt; kiểm thử trước khi sửa
phải chứng minh sai lệch do đồng hồ máy chủ, sau đó bản sửa mới truyền đồng hồ
vào rõ ràng.

## 12. Bằng chứng H2 cục bộ tổng quan vận hành v0.3.0

- Tích hợp hệ thống 11/11 chứng minh bản tổng hợp trước/sau luồng thay đổi đúng
  nguồn trạng thái và gửi lại thông báo không tạo tác dụng phụ.
- Chromium 1440x900 1/1 đối chiếu cả sáu KPI `/home` với
  `GET /api/reports/operations-summary`; không tràn ngang, không lỗi console.
- Toàn bộ backend 69 bộ/1.125 kiểm thử; frontend 269/269; kiểm tra mã/bản dựng đạt.
- Độ bao phủ: 91,89% câu lệnh, 80,72% nhánh, 97,61% hàm, 91,81%
  dòng. Truy vết FE12 14/15 (93%).
- Phần thay đổi sản phẩm của lượt này đã qua H2/H3, hợp nhất; hoàn tất sau cùng được xác nhận
  tại PR #89 cùng CI `30675444178` và Azure `30675744992`.
