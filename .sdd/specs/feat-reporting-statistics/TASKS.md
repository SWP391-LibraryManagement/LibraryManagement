# TASKS.md - FE12 Báo cáo và thống kê

Trạng thái: H1 GOVERNANCE ACTIVATION - ĐÃ PHÊ DUYỆT; CHỜ H3/MERGE
Implementation State: PARTIAL

Chủ sở hữu: Nhat

Cập nhật: 2026-07-29

Trạng thái workflow: baseline Giai đoạn 2 vẫn hoàn tất. Nhat phê duyệt PLAN/
TASKS FE12-N11 và phụ lục H2 tích hợp `8d0059b` ngày 2026-07-27. Kết quả đã
review được commit thành `f346ae0`, push lên PR nháp #63 và lượt CI
`30244750250` đạt. Prerequisite v0.2.1 đã hoàn tất H2/H3, merge qua PR #81
thành `main@0d064b5`; CI exact-head `30403316655` và CI hậu merge
`30403632044` đều đạt. Azure đã upload backend/frontend nhưng smoke bị chặn bởi
quota F1 `WP stop requests`, không phải finding code. Phạm vi hiện tại là
governance activation v0.3.0 đã được H1 phê duyệt và đang chờ H3/merge PR #80.

---

## 1. Nhiệm vụ backend

- [x] FE12-T01 Thêm route báo cáo mượn, kho và người dùng.
- [x] FE12-T02 Thêm validator cho bộ lọc báo cáo và thứ tự khoảng ngày.
- [x] FE12-T03 Thêm service báo cáo chỉ đọc với kiểm tra vai trò.
- [x] FE12-T04 Thêm query và metric tổng hợp mượn.
- [x] FE12-T05 Thêm query và metric tổng hợp kho.
- [x] FE12-T06 Thêm query và metric tổng hợp thống kê người dùng.
- [x] FE12-T07 Thêm audit log cho truy cập báo cáo thành công.
- [x] FE12-T08 Giữ phản hồi báo cáo chỉ tổng hợp và không có dữ liệu cá nhân
  không cần thiết.

## 2. Nhiệm vụ kiểm thử

- [x] FE12-T09 Thêm helper report repository in-memory.
- [x] FE12-T10 Kiểm thử metric báo cáo mượn và xử lý kết quả bằng không.
- [x] FE12-T11 Kiểm thử metric báo cáo kho.
- [x] FE12-T12 Kiểm thử thống kê người dùng và loại dữ liệu cá nhân.
- [x] FE12-T13 Kiểm thử khoảng không hợp lệ và bảo vệ vai trò.

## 3. Nhiệm vụ frontend

- [x] FE12-T14 Triển khai màn hình báo cáo mượn với bộ lọc ngày và biểu đồ.
- [x] FE12-T15 Triển khai màn hình báo cáo kho với bộ lọc thể loại và biểu đồ.
- [x] FE12-T16 Triển khai màn hình thống kê người dùng với bộ lọc ngày và biểu
  đồ.
- [x] FE12-T17 Nối màn hình frontend với API backend.
- [x] FE12-T18 Thêm accessibility: caption bảng, scope header, nhãn biểu mẫu,
  hỗ trợ bàn phím.
- [x] FE12-T19 Thêm trạng thái tải, rỗng và lỗi trên mọi màn hình.

## 4. Xác thực lát cắt base lịch sử (2026-07-13)

Các kết quả này mô tả lát cắt base đã tích hợp trước đó và chỉ còn là bằng chứng
lịch sử; bằng chứng wave xác định được ghi ở Phần 9.1.

- [x] `npm.cmd --prefix backend test` đạt: 18 suite, 236 kiểm thử.
- [x] `npm.cmd --prefix frontend test` đạt: 24 kiểm thử.
- [x] `npm.cmd --prefix frontend run lint` đạt.
- [x] `npm.cmd --prefix frontend run build` đạt.
- [x] `npm.cmd run trace:enforce` đạt; FE12 có 8/8 FR được tag (100%).
- [x] Xác minh trình duyệt mới đạt tại `http://127.0.0.1:5173`: Quản trị thành
  công cho mượn/kho/người dùng, Guest chuyển hướng đến `/login`, Member chuyển
  hướng đến `/forbidden`, lọc thể loại kho, trạng thái lỗi/rỗng trung thực và
  kiểm tra layout đáp ứng.

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

## 6. Vẫn ngoài lát cắt này

- Xuất CSV/PDF.
- Dashboard.
- Tích hợp kho BI.

## 7. Củng cố xác thực B6 FE12

Trạng thái triển khai B5: HOÀN TẤT. Xác thực trình duyệt tự động/thủ công B6 ban
đầu đã hoàn tất, sau đó review độc lập mở phát hiện theo dõi. Khắc phục và xác
minh đầy đủ mới đạt, re-review độc lập cuối sạch và Nhat xác nhận review con
người.

- [x] FE12-H01 Thêm kiểm thử hồi quy cho khử trùng lặp yêu cầu, bộ lọc chỉ-ngày
  bao hàm, kỳ phê duyệt tư cách thành viên, số thể loại kho và tổng bản sao tồn
  thấp.
- [x] FE12-H02 Sửa hành vi tổng hợp repository và ranh giới ngày.
- [x] FE12-H03 Thêm bản ghi audit an toàn cho truy cập báo cáo thất bại và căn
  chỉnh mọi bộ lọc OpenAPI.
- [x] FE12-H04 Bảo vệ mọi route frontend FE12 và loại dữ liệu fallback demo bịa
  đặt.
- [x] FE12-H05 Khôi phục tùy chọn thể loại kho từ payload metadata được ủy quyền.
- [x] FE12-H06 Chạy xác thực tự động tập trung và đầy đủ.
- [x] FE12-H07 Ghi bằng chứng trình duyệt staff/member/guest mới, đo đáp ứng,
  hành vi bộ lọc kho và trạng thái tải/rỗng/lỗi.
- [x] FE12-H08 Loại giá trị query thô khỏi metadata audit báo cáo thành công.
- [x] FE12-H09 Chỉ áp dụng khoảng ngày người dùng cho `newMembersByPeriod` theo
  `Members.ApprovedAt`.
- [x] FE12-H10 Thêm xác thực chỉ-ngày nghiêm ngặt và phản hồi `400` OpenAPI đầy
  đủ.
- [x] FE12-H11 Mặc định bộ lọc ngày báo cáo là trống và bỏ tham số query rỗng.
- [x] FE12-H12 Căn chỉnh hành vi tồn thấp production/kiểm thử thành
  `availableCopies <= 2`.
- [x] FE12-H13 Nhận re-review độc lập sạch sau xác thực đầy đủ mới.
- [x] FE12-H14 Nhận review con người của Nhat trước commit/push/merge.

Bằng chứng chi tiết được ghi trong
`.sdd/reviews/fe12-b6-validation-review-2026-07-13.md`.

## 8. Tích hợp B7 lịch sử và closeout review

- [x] Nhat xác nhận cổng review con người và chọn merge cục bộ.
- [x] Commit `58747bc10657ed1accb44950ae0c5edbd178a242` tới `main` và
  `origin/main`.
- [x] GitHub Actions CI `29249491818` đạt cho cùng commit.
- [x] CI bao phủ ép truy vết, kiểm thử backend, lint/kiểm thử/build frontend và
  kiểm tra import health backend.
- [x] Bằng chứng chi tiết được ghi trong
  `.sdd/reviews/fe12-b7-integration-review-closeout-2026-07-13.md`.

## 9. Theo dõi policy xác định

- [x] FE12-N01 Chuẩn hóa tài liệu về truy cập mọi báo cáo, hành vi ID/trạng thái
  không rõ, phân trang/thứ tự, audit, phạm vi xuất và truy vết.
- [x] FE12-N02 Căn chỉnh truy cập, xác thực, envelope metric/hàng chuẩn, policy
  ID/trạng thái không rõ, thứ tự ổn định, audit thành công an toàn và tuần tự hóa
  hàng chỉ-ngày với hợp đồng xác định đã phê duyệt.
- [x] FE12-N03 Thêm kiểm thử hợp đồng tập trung cho ID không rõ, nhóm trạng thái
  `UNKNOWN`, giới hạn page/limit, thứ tự ổn định, audit thành công, hàng mượn
  chỉ-ngày và không có bề mặt xuất.
- [x] FE12-N04 Căn chỉnh cả ba consumer báo cáo frontend và assertion tích hợp
  liên tính năng với `{ metrics, rows, page, limit, totalRows }` không có trường
  phản hồi legacy.
- [x] FE12-N05 Áp dụng `status` và `location` kho vào cùng hàng bản sao SQL, giữ
  lượng sẵn có toàn sách cho tính toán tồn thấp và đánh giá ranh giới ngày kỳ
  phê duyệt người dùng trong SQL mà không đổi tổng toàn cục.
- [x] FE12-N06 Chạy xác thực tự động tập trung/đầy đủ, lint, build, truy vết và
  vệ sinh diff; ghi bằng chứng wave xác định.
- [x] FE12-N07 Chạy chấp nhận trình duyệt mới cho màn hình mượn/kho/người dùng
  chuẩn, lọc kết quả bằng không, layout mobile và từ chối Member/Guest.
- [ ] FE12-N08 Nhận review tích hợp con người trước commit, push, merge hoặc
  closeout B7 wave xác định.
- [x] FE12-N09 Thêm tìm kiếm chuẩn và bộ lọc báo cáo đầy đủ, loại banner tải
  thành công và sắp hàng người dùng tăng dần theo `UserId`.

### 9.1 Bằng chứng tự động wave xác định

- [x] Cổng backend FE12 tập trung đạt: 6 suite, 46 kiểm thử.
- [x] Suite backend đầy đủ đạt: 39 suite, 615 kiểm thử.
- [x] Ngưỡng coverage backend đạt: 92.54% statement, 82.33% branch, 97.14%
  function, 92.47% line.
- [x] Cổng frontend FE12 tập trung đạt: 12 kiểm thử; suite frontend đầy đủ đạt:
  121 kiểm thử.
- [x] Lint frontend và production build đạt.
- [x] Ép truy vết đạt với FE12 có 10/10 FR được tag (100%).
- [x] `git diff --check` đạt.
- [x] Golden path hệ thống Playwright đạt: 1/1 trước khắc phục review repository;
  sau đó chấp nhận Playwright CLI cô lập exact-diff xác minh lại cả ba màn hình
  báo cáo xác định, hành vi kết quả bằng không, tràn mobile, Member 403 và chuyển
  hướng đăng nhập Guest trên cổng 4184 mà không dùng lại cổng FE03 4173 đang
  chiếm.
- [x] Tích hợp hệ thống SQL-backed đạt trong
  `backend/tests/sql/systemIntegration.sqltest.js` trên cơ sở dữ liệu
  reconciliation dùng một lần, có bằng chứng cleanup.
- [ ] Chấp nhận B7/L4 con người vẫn chờ.

Bằng chứng tự động chi tiết được ghi trong
`.sdd/reviews/fe12-deterministic-policy-validation-2026-07-19.md`.

## 2026-07-22 Batch sửa

- [x] Xác nhận lại bộ lọc báo cáo mượn, kho và người dùng ánh xạ tới tham số
  query máy chủ.
- [x] Xác nhận lại biểu đồ tiêu thụ metric backend xác định không có fallback
  giả.
- [x] Giảm khoảng trắng đáy chỉ-báo-cáo và giữ kiểm thử layout đáp ứng.
- [~] **FE12-N10 - Khôi phục parity report in-memory và truy vết.**
  - Ánh xạ tới: BR-FE12-009, BR-FE12-015/016, FR-FE12-003/011, AC-FE12-003/011.
  - RED: `q` người dùng không khớp ID/trạng thái/tư cách thành viên/vai trò và
    mẫu wildcard SQL, phê duyệt lịch sử không hoạt động biến mất khỏi metric tăng
    trưởng và thứ tự fixture rò vào hàng chi tiết.
  - GREEN: repository in-memory khớp tìm kiếm SQL `LIKE` có tham số production,
    gồm `%`, `_`, khoảng bracket và lớp phủ định trên trường đã phê duyệt, cùng
    ngữ nghĩa `ApprovedAt` lịch sử và `UserId ASC`; truy vết giữ `16/11/11`.
  - Xác minh: phụ lục H2 và H2 đầu qua; commit `97aca62` và CI PR
    `30014066260` đạt. H2 mới sau đó phê duyệt commit khắc phục `b931e00`, CI PR
    `30019439505` đạt. Review H3 lặp lại phát hiện edge parity dấu đóng-bracket
    SQL `LIKE` hợp lệ cộng khoảng trống bằng chứng liên tính năng hữu hạn. H2
    mới phê duyệt gói vòng hai ngày 2026-07-23 và cho phép commit/push đã review;
    CI PR cập nhật và H3 lặp lại vẫn bắt buộc trước merge.

## 11. Ranh giới allowlist query V0.2.0

- [x] **FE12-N11 - Từ chối khóa query báo cáo không được hỗ trợ trước thực thi.**
  - Ánh xạ tới: BD-005, BR-FE12-008, FR-FE12-005, AC-FE12-005, EC-FE12-011,
    NFR-FE12-SEC-004.
  - RED: `?bogus=runtime-secret-value` trả `200` và đến phương thức báo cáo đã
    chọn.
  - GREEN: middleware khóa chính xác riêng endpoint trả an toàn
    `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` trước thực thi service/repository
    và không bao giờ echo giá trị không rõ.
  - Bằng chứng: cả ba ca RED trả `200`; GREEN tập trung đạt 3/3, FE12 đầy đủ đạt
    14/14 và golden path cục bộ quan sát HTTP `400` an toàn.
  - Tệp: `backend/tests/reportRoutes.test.js`,
    `backend/src/validators/reportValidators.js`.
  - Bảo toàn: validator giá trị đã phê duyệt hiện có, hành vi báo cáo chỉ đọc,
    quyền riêng tư audit, SQL có tham số, ngữ nghĩa ID rỗng, phân trang và thứ tự
    không đổi.
  - Cổng: phụ lục H2 sản phẩm phê duyệt commit `f346ae0` và CI PR
    `30244750250` đạt. Khắc phục H3 chỉ-tài-liệu cần H2 mới và H3 lặp lại trước
    merge.

## 12. Prerequisite ngày nghiệp vụ báo cáo mượn v0.2.1 - Đã hoàn tất

- [x] **FE12-N12 - Sửa clock drift ở service boundary.**
  - Ánh xạ: BR-FE12-004/012, FR-FE12-001, AC-FE12-001,
    NFR-FE12-INT-002.
  - RED: SIT-002/SIT-008 phân loại theo ngày thật của host thay vì clock của
    harness.
  - GREEN: service đọc clock một lần, truyền `businessDate` cho SQL/in-memory
    repository; system integration không dùng fake global clock.
- [x] **FE12-N13 - Fail-fast và parity cho `businessDate`.**
  - SQL/in-memory từ chối thiếu, sai `YYYY-MM-DD` hoặc ngày bất khả thi trước
    khi đọc dữ liệu.
  - Direct-repository tests dùng ngày cố định; cùng fixture trước/sau hạn trả
    cho kết quả `BORROWED`/`OVERDUE` giống nhau.
  - Bằng chứng cục bộ: RED 14 ca lỗi như dự kiến; GREEN tập trung 5 suite,
    73/73 kiểm thử.

H2 remediation fingerprint
`c4216068a3aafbbfeaddd47ef2398a84555746c35b290e4f1a040d370d9612ed`
đã được phê duyệt. H3 hai trục và CI exact-head đạt; PR #81 đã merge thành
`main@0d064b5` và CI hậu merge `30403632044` đạt.

## 13. Operations summary v0.3.0

- [ ] **FE12-N14 - Operations summary endpoint và role/query contract.**
  - Ánh xạ: BR-FE12-017/018, FR-FE12-012..014, AC-FE12-012/013.
  - Tái sử dụng service-owned `businessDate` đã hoàn tất ở FE12-N12/N13.
  - `availableCopies`/`lowStockBooks` chỉ xét sách `ACTIVE`; bản sao khả dụng
    phải có `BookCopies.Status = 'AVAILABLE'`.
- [ ] **FE12-N15 - Dashboard snapshot và missing-KPI UX.**
  - Ánh xạ: BR-FE12-019, FR-FE12-015, AC-FE12-014/015.
- [ ] **FE12-N16 - Integration/desktop/full-gate evidence.**
  - Ánh xạ: `SL-005`, `SL-006`, `AT-010..AT-013`.

Không sửa expected `BORROWED` thành `OVERDUE` để che drift. Product work bắt
đầu sau governance activation merge và giữ uncommitted đến H2.
