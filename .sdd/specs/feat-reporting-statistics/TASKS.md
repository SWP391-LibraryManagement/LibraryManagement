# TASKS.md - FE12 Báo cáo và thống kê

Trạng thái: HOÀN THÀNH (`COMPLETE`); PR #89 ĐÃ HỢP NHẤT; CI VÀ AZURE ĐÚNG COMMIT ĐẠT
Trạng thái triển khai: HOÀN THÀNH (`COMPLETE`)

Chủ sở hữu: Nhat

Cập nhật: 2026-08-01

Trạng thái quy trình hiện tại: mốc chuẩn Giai đoạn 2 vẫn hoàn tất. Đối soát
FE07-FE12 đã hợp nhất qua PR #63 thành `29b4eb0`; điều kiện tiên quyết v0.2.1 đã hợp nhất
qua PR #81 thành `main@0d064b5`. Phê duyệt kích hoạt v0.3.0 đã hợp nhất qua
PR #80 thành `cd865e3`, tổng quan vận hành đã hợp nhất qua PR #82 thành
`2645a00`, và đợt liên hoàn được H3 phê duyệt ở commit `08e472f` rồi tích hợp
qua `ba29dc0`. Bản hoàn tất `6189b1a` tiếp tục được phê duyệt H3 trong
nhiệm vụ, hợp nhất qua PR #89 thành `main@39092fb`; CI `30675444178` và môi trường thử nghiệm Azure
`30675744992` đều đạt trên đúng commit.

---

## 1. Nhiệm vụ backend

- [x] FE12-T01 Thêm tuyến API báo cáo mượn, kho và người dùng.
- [x] FE12-T02 Thêm validator cho bộ lọc báo cáo và thứ tự khoảng ngày.
- [x] FE12-T03 Thêm tầng dịch vụ báo cáo chỉ đọc với kiểm tra vai trò.
- [x] FE12-T04 Thêm truy vấn và chỉ số tổng hợp mượn.
- [x] FE12-T05 Thêm truy vấn và chỉ số tổng hợp kho.
- [x] FE12-T06 Thêm truy vấn và chỉ số tổng hợp thống kê người dùng.
- [x] FE12-T07 Thêm kiểm toán log cho truy cập báo cáo thành công.
- [x] FE12-T08 Giữ phản hồi báo cáo chỉ tổng hợp và không có dữ liệu cá nhân
  không cần thiết.

## 2. Nhiệm vụ kiểm thử

- [x] FE12-T09 Thêm hàm hỗ trợ report tầng truy cập dữ liệu trong bộ nhớ.
- [x] FE12-T10 Kiểm thử chỉ số báo cáo mượn và xử lý kết quả bằng không.
- [x] FE12-T11 Kiểm thử chỉ số báo cáo kho.
- [x] FE12-T12 Kiểm thử thống kê người dùng và loại dữ liệu cá nhân.
- [x] FE12-T13 Kiểm thử khoảng không hợp lệ và bảo vệ vai trò.

## 3. Nhiệm vụ frontend

- [x] FE12-T14 Triển khai màn hình báo cáo mượn với bộ lọc ngày và biểu đồ.
- [x] FE12-T15 Triển khai màn hình báo cáo kho với bộ lọc thể loại và biểu đồ.
- [x] FE12-T16 Triển khai màn hình thống kê người dùng với bộ lọc ngày và biểu
  đồ.
- [x] FE12-T17 Nối màn hình frontend với API backend.
- [x] FE12-T18 Bổ sung khả năng tiếp cận: chú thích bảng, thuộc tính `scope` cho
  tiêu đề cột, nhãn biểu mẫu và hỗ trợ bàn phím.
- [x] FE12-T19 Thêm trạng thái tải, rỗng và lỗi trên mọi màn hình.

## 4. Xác thực phạm vi nền lịch sử (2026-07-13)

Các kết quả này mô tả phạm vi nền đã tích hợp trước đó và chỉ còn là bằng chứng
lịch sử; bằng chứng lượt xác định được ghi ở Phần 9.1.

- [x] `npm.cmd --prefix backend test` đạt: 18 bộ, 236 kiểm thử.
- [x] `npm.cmd --prefix frontend test` đạt: 24 kiểm thử.
- [x] `npm.cmd --prefix frontend run lint` đạt.
- [x] `npm.cmd --prefix frontend run build` đạt.
- [x] `npm.cmd run trace:enforce` đạt; FE12 có 8/8 FR được tag (100%).
- [x] Xác minh trình duyệt mới đạt tại `http://127.0.0.1:5173`: Quản trị thành
  công cho mượn/kho/người dùng, Guest chuyển hướng đến `/login`, Member chuyển
  hướng đến `/forbidden`, lọc thể loại kho, trạng thái lỗi/rỗng trung thực và
  kiểm tra bố cục đáp ứng.

## 5. Truy vết base

| ID spec | Được bao phủ bởi |
| --- | --- |
| BR-FE12-001 | FE12-T03, FE12-T10, FE12-T11, FE12-T12 |
| BR-FE12-002 | FE12-T13 |
| BR-FE12-003 | FE12-T03, FE12-T13 |
| BR-FE12-004 | FE12-T04, FE12-T10 |
| BR-FE12-005 | FE12-T05, FE12-T11 |
| BR-FE12-006 | FE12-T06, FE12-T12 |
| BR-FE12-007 | FE12-T06, FE12-T12, FE12-N02, FE12-N03 |
| BR-FE12-008 | FE12-T02, FE12-T13 |
| BR-FE12-009 | FE12-T02, FE12-T13 |
| BR-FE12-010 | FE12-T04, FE12-T05, FE12-T06 |
| BR-FE12-011 | FE12-T06, FE12-T12 |
| BR-FE12-012 | FE12-T04, FE12-T05, FE12-T06 |
| BR-FE12-013 | FE12-N03 |
| BR-FE12-014 | FE12-N02, FE12-N03 |
| BR-FE12-015 | FE12-N02, FE12-N03, FE12-N04 |
| FR-FE12-001 | FE12-T10 |
| FR-FE12-002 | FE12-T11 |
| FR-FE12-003 | FE12-T12 |
| FR-FE12-004 | FE12-T13 |
| FR-FE12-005 | FE12-T02, FE12-T13 |
| FR-FE12-006 | FE12-T10 |
| FR-FE12-007 | FE12-T03, FE12-T10, FE12-T11, FE12-T12 |
| FR-FE12-008 | FE12-T06, FE12-T12 |
| FR-FE12-009 | FE12-N02, FE12-N03 |
| FR-FE12-010 | FE12-N02, FE12-N03, FE12-N04 |

## 6. Vẫn ngoài phạm vi này

- Xuất CSV/PDF.
- Trang tổng quan.
- Tích hợp kho BI.

## 7. Củng cố xác thực B6 FE12

Trạng thái triển khai B5: HOÀN TẤT. Xác thực trình duyệt tự động/thủ công B6 ban
đầu đã hoàn tất, sau đó rà soát độc lập mở phát hiện theo dõi. Khắc phục và xác
minh đầy đủ mới đạt, rà soát lại độc lập cuối sạch và Nhat xác nhận rà soát con
người.

- [x] FE12-H01 Thêm kiểm thử hồi quy cho khử trùng lặp yêu cầu, bộ lọc chỉ-ngày
  bao hàm, kỳ phê duyệt tư cách thành viên, số thể loại kho và tổng bản sao tồn
  thấp.
- [x] FE12-H02 Sửa hành vi tổng hợp tầng truy cập dữ liệu và ranh giới ngày.
- [x] FE12-H03 Thêm bản ghi kiểm toán an toàn cho truy cập báo cáo thất bại và căn
  chỉnh mọi bộ lọc OpenAPI.
- [x] FE12-H04 Bảo vệ mọi tuyến API frontend FE12 và loại dữ liệu dự phòng demo bịa
  đặt.
- [x] FE12-H05 Khôi phục tùy chọn thể loại kho từ dữ liệu gửi siêu dữ liệu được ủy quyền.
- [x] FE12-H06 Chạy xác thực tự động tập trung và đầy đủ.
- [x] FE12-H07 Ghi bằng chứng trình duyệt nhân viên/member/guest mới, đo đáp ứng,
  hành vi bộ lọc kho và trạng thái tải/rỗng/lỗi.
- [x] FE12-H08 Loại giá trị truy vấn thô khỏi siêu dữ liệu kiểm toán báo cáo thành công.
- [x] FE12-H09 Chỉ áp dụng khoảng ngày người dùng cho `newMembersByPeriod` theo
  `Members.ApprovedAt`.
- [x] FE12-H10 Thêm xác thực chỉ-ngày nghiêm ngặt và phản hồi `400` OpenAPI đầy
  đủ.
- [x] FE12-H11 Mặc định bộ lọc ngày báo cáo là trống và bỏ tham số truy vấn rỗng.
- [x] FE12-H12 Căn chỉnh hành vi tồn thấp môi trường thực tế/kiểm thử thành
  `availableCopies <= 2`.
- [x] FE12-H13 Nhận rà soát lại độc lập sạch sau xác thực đầy đủ mới.
- [x] FE12-H14 Nhận rà soát con người của Nhat trước commit/push/hợp nhất.

Bằng chứng chi tiết được ghi trong
`.sdd/reviews/fe12-b6-validation-review-2026-07-13.md`.

## 8. Tích hợp B7 lịch sử và hoàn tất rà soát

- [x] Nhat xác nhận cổng rà soát con người và chọn hợp nhất cục bộ.
- [x] Commit `58747bc10657ed1accb44950ae0c5edbd178a242` tới `main` và
  `origin/main`.
- [x] GitHub Actions CI `29249491818` đạt cho cùng commit.
- [x] CI bao phủ ép truy vết, kiểm thử backend, kiểm tra mã/kiểm thử/bản dựng
  frontend và kiểm tra khả năng nạp ứng dụng backend.
- [x] Bằng chứng chi tiết được ghi trong
  `.sdd/reviews/fe12-b7-integration-review-closeout-2026-07-13.md`.

## 9. Theo dõi quy tắc xác định

- [x] FE12-N01 Chuẩn hóa tài liệu về truy cập mọi báo cáo, hành vi ID/trạng thái
  không rõ, phân trang/thứ tự, kiểm toán, phạm vi xuất và truy vết.
- [x] FE12-N02 Căn chỉnh truy cập, xác thực, cấu trúc phản hồi chỉ số/hàng chuẩn, quy tắc
  ID/trạng thái không rõ, thứ tự ổn định, kiểm toán thành công an toàn và tuần tự hóa
  hàng chỉ-ngày với hợp đồng xác định đã phê duyệt.
- [x] FE12-N03 Thêm kiểm thử hợp đồng tập trung cho ID không rõ, nhóm trạng thái
  `UNKNOWN`, giới hạn page/limit, thứ tự ổn định, kiểm toán thành công, hàng mượn
  chỉ-ngày và không có chức năng xuất.
- [x] FE12-N04 Căn chỉnh cả ba phần sử dụng báo cáo frontend và các khẳng định kiểm thử tích hợp
  liên tính năng với `{ metrics, rows, page, limit, totalRows }` không có trường
  phản hồi cũ.
- [x] FE12-N05 Áp dụng `status` và `location` kho vào cùng hàng bản sao SQL, giữ
  lượng sẵn có toàn sách cho tính toán tồn thấp và đánh giá ranh giới ngày kỳ
  phê duyệt người dùng trong SQL mà không đổi tổng toàn cục.
- [x] FE12-N06 Chạy xác thực tự động tập trung/đầy đủ, lint, build, truy vết và
  vệ sinh phần thay đổi; ghi bằng chứng lượt xác định.
- [x] FE12-N07 Chạy chấp nhận trình duyệt mới cho màn hình mượn/kho/người dùng
  chuẩn, lọc kết quả bằng không, bố cục điện thoại và từ chối Member/Guest.
- [x] FE12-N08 Đã nhận rà soát tích hợp con người; H3, hợp nhất và hoàn tất B7
  được đóng qua PR #89 cùng CI/Azure đúng commit.
- [x] FE12-N09 Thêm tìm kiếm chuẩn và bộ lọc báo cáo đầy đủ, bỏ thông báo tải
  thành công và sắp hàng người dùng tăng dần theo `UserId`.

### 9.1 Bằng chứng tự động lượt xác định

- [x] Cổng backend FE12 tập trung đạt: 6 bộ, 46 kiểm thử.
- [x] Bộ backend đầy đủ đạt: 39 bộ, 615 kiểm thử.
- [x] Ngưỡng độ bao phủ backend đạt: 92.54% câu lệnh, 82.33% nhánh, 97.14%
  hàm, 92.47% dòng.
- [x] Cổng frontend FE12 tập trung đạt: 12 kiểm thử; bộ frontend đầy đủ đạt:
  121 kiểm thử.
- [x] Kiểm tra mã frontend và tạo bản dựng cho môi trường thực tế đều đạt.
- [x] Ép truy vết đạt với FE12 có 10/10 FR được tag (100%).
- [x] `git diff --check` đạt.
- [x] Luồng chính hệ thống Playwright đạt: 1/1 trước khắc phục rà soát tầng truy cập dữ liệu;
  sau đó dùng Playwright CLI cô lập đúng phần thay đổi để xác minh lại cả ba màn hình
  báo cáo xác định, hành vi kết quả bằng không, tràn điện thoại, Member 403 và chuyển
  hướng đăng nhập Guest trên cổng 4184 mà không dùng lại cổng FE03 4173 đang
  chiếm.
- [x] Tích hợp hệ thống SQL-backed đạt trong
  `backend/tests/sql/systemIntegration.sqltest.js` trên cơ sở dữ liệu
  reconciliation dùng một lần, có bằng chứng dọn dẹp.
- [x] Chấp nhận B7/L4 con người đã được ghi nhận trong H3 và hoàn tất PR #89.

Bằng chứng tự động chi tiết được ghi trong
`.sdd/reviews/fe12-deterministic-policy-validation-2026-07-19.md`.

## Đợt sửa ngày 2026-07-22

- [x] Xác nhận lại bộ lọc báo cáo mượn, kho và người dùng ánh xạ tới tham số
  truy vấn máy chủ.
- [x] Xác nhận lại biểu đồ tiêu thụ chỉ số backend xác định không có dự phòng
  giả.
- [x] Giảm khoảng trắng đáy chỉ-báo-cáo và giữ kiểm thử bố cục đáp ứng.
- [x] **FE12-N10 - Khôi phục tính đồng nhất của báo cáo trong bộ nhớ và truy vết.**
  - Ánh xạ tới: BR-FE12-009, BR-FE12-015/016, FR-FE12-003/011, AC-FE12-003/011.
  - Trước khi sửa: `q` người dùng không khớp ID/trạng thái/tư cách thành viên/vai trò và
    mẫu ký tự đại diện SQL; các phê duyệt lịch sử không hoạt động biến mất khỏi chỉ số tăng
    trưởng và thứ tự dữ liệu kiểm thử rò vào hàng chi tiết.
  - Sau khi sửa: tầng truy cập dữ liệu trong bộ nhớ khớp tìm kiếm SQL `LIKE` có
    tham số ở môi trường thực tế, gồm `%`, `_`, biểu thức trong ngoặc vuông và
    biểu thức phủ định trên trường đã phê duyệt, cùng
    ngữ nghĩa `ApprovedAt` lịch sử và `UserId ASC`; truy vết giữ `16/11/11`.
  - Xác minh: phụ lục H2 và H2 đầu qua; commit `97aca62` và CI PR
    `30014066260` đạt. H2 mới sau đó phê duyệt commit khắc phục `b931e00`, CI PR
    `30019439505` đạt. Rà soát H3 lặp lại phát hiện tính đồng nhất ở trường hợp biên dấu đóng-bracket
    SQL `LIKE` hợp lệ cộng khoảng trống bằng chứng liên tính năng hữu hạn. H2
    mới phê duyệt gói vòng hai ngày 2026-07-23 và cho phép commit/push đã rà soát;
    phát hiện được khắc phục, H3 lặp lại, hợp nhất và hoàn tất cuối đều đã đóng.

## 11. Ranh giới danh sách cho phép truy vấn V0.2.0

- [x] **FE12-N11 - Từ chối khóa truy vấn báo cáo không được hỗ trợ trước thực thi.**
  - Ánh xạ tới: BD-005, BR-FE12-008, FR-FE12-005, AC-FE12-005, EC-FE12-011,
    NFR-FE12-SEC-004.
  - Trước khi sửa: `?bogus=runtime-secret-value` trả `200` và đến phương thức báo cáo đã
    chọn.
  - Sau khi sửa: middleware kiểm tra chính xác khóa truy vấn của từng API trả an toàn
    `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` trước thực thi tầng dịch vụ/tầng truy cập dữ liệu
    và không bao giờ phản chiếu giá trị không rõ.
  - Bằng chứng: cả ba ca lỗi được tái hiện trước khi sửa trả `200`; sau khi sửa tập trung đạt 3/3, FE12 đầy đủ đạt
    14/14 và luồng chính cục bộ quan sát HTTP `400` an toàn.
  - Tệp: `backend/tests/reportRoutes.test.js`,
    `backend/src/validators/reportValidators.js`.
  - Bảo toàn: validator giá trị đã phê duyệt hiện có, hành vi báo cáo chỉ đọc,
    quyền riêng tư kiểm toán, SQL có tham số, ngữ nghĩa ID rỗng, phân trang và thứ tự
    không đổi.
  - Cổng: phụ lục H2 sản phẩm phê duyệt commit `f346ae0` và CI PR
    `30244750250` đạt. Khắc phục H3 chỉ-tài-liệu cần H2 mới và H3 lặp lại trước
    hợp nhất.

## 12. Điều kiện tiên quyết ngày nghiệp vụ báo cáo mượn v0.2.1 - Đã hoàn tất

- [x] **FE12-N12 - Sửa sai lệch đồng hồ tại ranh giới tầng dịch vụ.**
  - Ánh xạ: BR-FE12-004/012, FR-FE12-001, AC-FE12-001,
    NFR-FE12-INT-002.
  - Trước khi sửa: SIT-002/SIT-008 phân loại theo ngày thật của máy chủ thay vì đồng hồ của
    môi trường kiểm thử.
  - Sau khi sửa: tầng dịch vụ đọc đồng hồ một lần, truyền `businessDate` cho SQL/trong bộ nhớ
    tầng truy cập dữ liệu; kiểm thử tích hợp hệ thống không dùng đồng hồ toàn cục giả.
- [x] **FE12-N13 - Từ chối ngay dữ liệu sai và giữ tính đồng nhất cho `businessDate`.**
  - SQL/trong bộ nhớ từ chối thiếu, sai `YYYY-MM-DD` hoặc ngày bất khả thi trước
    khi đọc dữ liệu.
  - Kiểm thử trực tiếp tầng truy cập dữ liệu dùng ngày cố định; cùng dữ liệu kiểm thử trước/sau hạn trả
    cho kết quả `BORROWED`/`OVERDUE` giống nhau.
  - Bằng chứng cục bộ: trước khi sửa 14 ca lỗi như dự kiến; sau khi sửa tập trung 5 bộ,
    73/73 kiểm thử.

Mã đối chiếu nội dung H2 sau khắc phục
`c4216068a3aafbbfeaddd47ef2398a84555746c35b290e4f1a040d370d9612ed`
đã được phê duyệt. H3 hai trục và CI đúng commit đạt; PR #81 đã hợp nhất thành
`main@0d064b5` và CI sau hợp nhất `30403632044` đạt.

## 13. Tổng quan vận hành v0.3.0

- [x] **FE12-N14 - API tổng quan vận hành và hợp đồng vai trò/truy vấn.**
  - Ánh xạ: BR-FE12-017/018, FR-FE12-012..014, AC-FE12-012/013.
  - Tái sử dụng do tầng dịch vụ quản lý `businessDate` đã hoàn tất ở FE12-N12/N13.
  - `availableCopies`/`lowStockBooks` chỉ xét sách `ACTIVE`; bản sao khả dụng
    phải có `BookCopies.Status = 'AVAILABLE'`.
- [x] **FE12-N15 - Trang tổng quan bản tổng hợp và trải nghiệm khi thiếu KPI.**
  - Ánh xạ: BR-FE12-019, FR-FE12-015, AC-FE12-014/015.
- [x] **FE12-N16 - Bằng chứng tích hợp, giao diện máy tính và cổng kiểm tra đầy đủ.**
  - Ánh xạ: `SL-005`, `SL-006`, `AT-010..AT-013`.
  - Bằng chứng H2 cục bộ: tích hợp hệ thống 11/11; kiểm thử liên hoàn Chromium 1/1
    đối chiếu cả sáu KPI với bản tổng hợp API; toàn bộ backend 1.125/1.125,
    frontend 269/269, độ bao phủ thấp nhất 80,72% nhánh, truy vết FE12
    14/15 (93%).

Không sửa trạng thái mong đợi `BORROWED` thành `OVERDUE` để che sai lệch. Câu
“chưa commit tới khi H2 phê duyệt” là bản tổng hợp trước khi công bố;
FE12-N14..N16 đã được tích
hợp qua PR #82 (`2645a00`) và CI sau hợp nhất đã đạt. Hoàn tất cuối đã hợp nhất qua
PR #89 thành `main@39092fb`; Azure đúng commit `30675744992` đã đạt.
