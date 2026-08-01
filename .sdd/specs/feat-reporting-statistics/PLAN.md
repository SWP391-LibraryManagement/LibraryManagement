# PLAN.md - FE12 Báo cáo và thống kê

Trạng thái: COMPLETE; PR #89 ĐÃ MERGE; CI VÀ AZURE DEPLOY EXACT-HEAD ĐẠT

Chủ sở hữu: Nhat

Cập nhật: 2026-08-01

Trạng thái workflow hiện tại: baseline Giai đoạn 2 vẫn hoàn tất. Đối soát
FE07-FE12 đã merge qua PR #63 thành `29b4eb0`; prerequisite v0.2.1 đã merge
qua PR #81 thành `main@0d064b5`. Governance activation v0.3.0 đã merge qua
PR #80 thành `cd865e3`, operations summary đã merge qua PR #82 thành
`2645a00`, và batch liên hoàn được H3 phê duyệt ở head `08e472f` rồi tích hợp
qua `ba29dc0`. Closeout `6189b1a` đã merge qua PR #89 thành
`main@39092fb`; CI `30675444178` và Azure staging `30675744992` đều đạt
exact-head.

---

## 1. Phạm vi

Triển khai lát cắt backend Giai đoạn 2 cho FE12 từ `SPEC.md` đã phê duyệt.

Bao gồm:

- Metric báo cáo mượn từ dữ liệu FE07.
- Metric báo cáo kho từ dữ liệu FE06 / sách và bản sao.
- Thống kê người dùng từ dữ liệu FE11 / người dùng và vai trò.
- Endpoint chỉ đọc được bảo vệ theo vai trò.
- Xác thực bộ lọc và xử lý kết quả bằng không.
- Ghi audit cho lượt xem báo cáo thành công và lỗi truy cập báo cáo an toàn.
- Bảo vệ route frontend và trạng thái tải, rỗng, lỗi trung thực.

Không bao gồm:

- Xuất CSV/PDF.
- Dashboard.
- Màn hình báo cáo có thể sửa.
- Tích hợp kho dữ liệu / BI.

---

## 2. Quyết định đã phê duyệt được dùng

| Quyết định | Tác động kế hoạch |
| --- | --- |
| Thủ thư và Quản trị có thể xem báo cáo | Endpoint báo cáo yêu cầu vai trò staff. |
| Metric mượn là lượt mượn hoạt động, quá hạn, số theo kỳ và sách được mượn nhiều nhất | Phản hồi tổng hợp mượn hiển thị các số đó; hoạt động theo kỳ/sách hàng đầu loại `REQUESTED` và chỉ đếm trạng thái chi tiết khoản mượn thực. |
| Metric kho là tổng sách/bản sao, số theo trạng thái và sách ít/không còn sẵn có | Phản hồi tổng hợp kho hiển thị các số đó và coi 0-2 bản sao sẵn có là tồn thấp. |
| Thống kê người dùng là tổng thành viên, người dùng hoạt động/không hoạt động và thành viên mới theo kỳ | Phản hồi thống kê người dùng giữ tổng hợp; bộ lọc ngày tác động `newMembersByPeriod` theo `Members.ApprovedAt`, không tác động tổng toàn cục. |
| Ngày báo cáo dùng hợp đồng `date` OpenAPI | Backend chấp nhận chính xác `YYYY-MM-DD` và từ chối timestamp hoặc ngày bất khả thi. |
| Xuất CSV/PDF ngoài phạm vi | Không thêm route xuất. |
| Truy cập báo cáo ghi audit | Lượt xem thành công và lỗi truy cập an toàn được audit mà không có token, giá trị query hay lỗi nội bộ. |
| ID không rõ có định dạng hợp lệ | Trả tổng bằng không và hàng rỗng; ID sai định dạng vẫn là lỗi xác thực. |
| Trạng thái nguồn không rõ | Nhóm là `UNKNOWN` và giữ trong tổng tái lập được. |
| Hàng chi tiết | Dùng trang 1, giới hạn 20, tối đa 100 và thứ tự ổn định riêng báo cáo trong `SPEC.md`. |

---

## 3. Kế hoạch triển khai

### 3.1 Báo cáo mượn

- Xác thực bộ lọc khoảng ngày, trạng thái, sách và người dùng.
- Trả metric lượt mượn hoạt động/quá hạn chuẩn cùng hàng chi tiết có phân trang.
- Nhóm số khoản mượn thực theo kỳ và sách được mượn nhiều nhất mà không đếm chi
  tiết `REQUESTED` đang chờ.
- Tuần tự hóa ngày hàng mượn thành giá trị `YYYY-MM-DD` chính xác và áp dụng thứ
  tự `BorrowDate DESC, BorrowDetailId DESC` ổn định.

### 3.2 Báo cáo kho

- Xác thực bộ lọc thể loại, sách, trạng thái và vị trí.
- Tổng hợp metric chuẩn tổng sách, tổng bản sao và bản sao theo trạng thái.
- Đánh dấu sách có hai hoặc ít hơn bản sao sẵn có là ít/không còn sẵn có, dùng
  mọi bản sao của sách được chọn bởi bộ lọc trạng thái/vị trí để lượng sẵn có
  không bị méo bởi bộ lọc.
- Yêu cầu bộ lọc trạng thái/vị trí kết hợp khớp cùng một bản sao trong khi giữ
  lượng sẵn có hiệu dụng toàn sách.

### 3.3 Thống kê người dùng

- Xác thực bộ lọc vai trò, trạng thái, trạng thái tư cách thành viên và ngày.
- Tổng hợp tổng thành viên, người dùng theo trạng thái/vai trò và tư cách thành
  viên theo trạng thái.
- Nhóm người dùng theo trạng thái và vai trò.
- Giữ số tổng/trạng thái/vai trò độc lập với bộ lọc ngày.
- Trả thành viên mới theo `Members.ApprovedAt` trong khoảng ngày bao hàm tùy chọn
  mà không lộ trường cá nhân.
- Đánh giá predicate ngày kỳ phê duyệt trong SQL, giữ nó ngoài phạm vi `WHERE`
  người dùng toàn cục.

### 3.4 Kiểm thử

- Thêm kiểm thử route với report repository in-memory.
- Thêm kiểm thử repository tập trung và hợp đồng OpenAPI cho ranh giới tổng hợp
  và bộ lọc.
- Thêm kiểm thử frontend cho guard route báo cáo, tính toàn vẹn trạng thái lỗi và
  bộ lọc thể loại kho.
- Bao phủ metric mượn, metric kho, thống kê người dùng, xử lý kết quả bằng không,
  kiểm soát truy cập, xác thực nghiêm ngặt chỉ-ngày, phản hồi lỗi OpenAPI, ngưỡng
  tồn thấp và quyền riêng tư audit.
- Thêm kiểm thử deterministic envelope, ID/trạng thái không rõ, phân trang/thứ
  tự, audit thành công an toàn, không xuất, bộ lọc kho cùng-bản-sao và hợp đồng
  hàng chỉ-ngày.

---

## 4. Ghi chú review

- Lát cắt chỉ đọc và không thay đổi dữ liệu nguồn.
- Xuất hoàn toàn ngoài Giai đoạn 1; triển khai/xác minh policy xác định chỉ theo
  sau review v0.1.5.

## 5. Trạng thái xác thực B6 và tích hợp B7

Xác thực tự động và trình duyệt hoàn tất trên `feat/fe12-validation`, sau đó
review độc lập xác định phát hiện theo dõi về tính đúng đắn, hợp đồng và parity
test-double. Các phát hiện đã được khắc phục, xác minh đầy đủ mới hoàn tất và
re-review độc lập cuối sạch. Nhat xác nhận review con người trong task Codex.
Commit `58747bc10657ed1accb44950ae0c5edbd178a242` sau đó fast-forward merge
vào `main`, push lên `origin/main`, và GitHub Actions CI `29249491818` đạt cho
cùng commit. Bằng chứng B7 chi tiết ghi trong
`.sdd/reviews/fe12-b7-integration-review-closeout-2026-07-13.md`.

## 6. Trạng thái theo dõi policy xác định

Hợp đồng xác định v0.1.6 được đối soát trên `feat/fe12-deterministic-policy`
dùng độ sâu Hybrid/Standard: API báo cáo, phân quyền, bộ lọc, metadata audit và
ngữ nghĩa dữ liệu nguồn giữ Core; tiêu thụ phản hồi frontend vẫn là công việc
Shell hữu hạn.

- Triển khai B5 hoàn tất cho FE12-N02 đến FE12-N05.
- B6 tự động hoàn tất: kiểm thử FE12 tập trung, suite backend/frontend đầy đủ,
  lint, build, truy vết và vệ sinh diff đạt.
- Tích hợp hệ thống SQL-backed đạt trên runtime SQL Server reconciliation dùng
  một lần; baseline/migration, scenario SQL dùng chung và cleanup được ghi trong
  `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Chấp nhận Playwright mới đạt cho màn hình mượn/kho/người dùng chuẩn, lọc kết
  quả bằng không, tràn mobile, từ chối Member và chuyển hướng Guest.
- Review tích hợp con người và mọi quyết định commit/push/merge vẫn chờ; bằng
  chứng B7 lịch sử 2026-07-13 không đóng phần theo dõi xác định này.

Bằng chứng hiện tại ghi trong
`.sdd/reviews/fe12-deterministic-policy-validation-2026-07-19.md`.

## 7. Ranh giới allowlist query chính xác V0.2.0

Kế hoạch thực thi chi tiết:
`docs/superpowers/plans/2026-07-27-fe07-fe10-fe12-business-rule-alignment.md`.

1. Thêm hồi quy route RED theo bảng dữ liệu cho `?bogus=runtime-secret-value`
   trên báo cáo mượn, kho và người dùng.
2. Xác minh `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` an toàn, không giá trị
   không rõ trong phản hồi và không gọi report-service/repository.
3. Thêm factory middleware khóa chính xác dùng lại được trong
   `backend/src/validators/reportValidators.js` và đặt middleware riêng endpoint
   đầu tiên trong mỗi mảng validator.
4. Giữ mọi xác thực giá trị khóa đã phê duyệt, báo cáo rỗng ID không rõ có định
   dạng hợp lệ, SQL có tham số, phân trang/thứ tự, quyền riêng tư audit và hành
   vi chỉ đọc.
5. Chạy kiểm thử FE12 tập trung/đầy đủ, truy vết, vệ sinh diff và một yêu cầu
   HTTP runtime thực trước H2.

## 8. Prerequisite ngày nghiệp vụ báo cáo mượn v0.2.1 - Đã hoàn tất

1. RED: cố định service clock tại ranh giới ngày `Asia/Ho_Chi_Minh`, tái hiện
   SIT-002/SIT-008 và thêm ca thiếu/sai `businessDate` cho SQL/in-memory.
2. GREEN: service đọc clock đúng một lần, tạo `businessDate` bằng
   `formatBusinessDate` và truyền tường minh cho repository.
3. SQL và in-memory repository bắt buộc `businessDate` hợp lệ chính xác
   `YYYY-MM-DD`; thiếu, sai định dạng hoặc ngày bất khả thi phải fail-fast trước
   khi SQL/fixture được đọc.
4. Mọi direct-repository test truyền ngày cố định; không dùng fake global clock
   và không đổi expected `BORROWED` thành `OVERDUE` để che drift.
5. Chạy focused/full backend, coverage, frontend, E2E, deployment, traceability
   và vệ sinh diff trước H2/H3.

Hoàn tất qua PR #81, merge `main@0d064b5`; không lặp lại FE12-N12/N13 trong
phạm vi operations summary.

## 9. Kế hoạch operations summary v0.3.0

1. `SL-001`: merge governance activation trước product work.
2. `SL-005` RED: tái sử dụng service clock và `businessDate` đã triển khai để
   thêm repository/service/route contract cho operations summary.
3. `SL-005` GREEN: operations summary nhận cùng `businessDate`; SQL repository
   dùng `@BusinessDate`, in-memory repository nhận cùng argument và không
   repository nào tự gọi `new Date()` để phân loại quá hạn.
4. `availableCopies` chỉ đếm cặp sách/bản sao
   `Books.Status = 'ACTIVE'` và `BookCopies.Status = 'AVAILABLE'`;
   `lowStockBooks` chỉ xét sách `ACTIVE` có 0..2 bản sao `AVAILABLE`.
5. Frontend staff dashboard gọi một snapshot FE12 và hiển thị KPI lỗi/thiếu là
   `Không tải được`, không phải `0`.
6. `SL-006`: full integration, desktop Chromium, L1-L4; product diff giữ
   uncommitted đến H2 và H3 bắt buộc trước merge.
