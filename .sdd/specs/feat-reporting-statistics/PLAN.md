# PLAN.md - FE12 Báo cáo và thống kê

Trạng thái: HOÀN THÀNH (`COMPLETE`); PR #89 ĐÃ HỢP NHẤT; CI VÀ AZURE ĐÚNG COMMIT ĐẠT

Chủ sở hữu: Nhat

Cập nhật: 2026-08-01

Trạng thái quy trình hiện tại: mốc chuẩn Giai đoạn 2 vẫn hoàn tất. Đối soát
FE07-FE12 đã hợp nhất qua PR #63 thành `29b4eb0`; điều kiện tiên quyết v0.2.1 đã hợp nhất
qua PR #81 thành `main@0d064b5`. Phê duyệt kích hoạt v0.3.0 đã hợp nhất qua
PR #80 thành `cd865e3`, tổng quan vận hành đã hợp nhất qua PR #82 thành
`2645a00`, và đợt liên hoàn được H3 phê duyệt ở commit `08e472f` rồi tích hợp
qua `ba29dc0`. Hoàn tất `6189b1a` đã hợp nhất qua PR #89 thành
`main@39092fb`; CI `30675444178` và môi trường thử nghiệm Azure `30675744992` đều đạt
đúng commit.

---

## 1. Phạm vi

Triển khai phạm vi backend Giai đoạn 2 cho FE12 từ `SPEC.md` đã phê duyệt.

Bao gồm:

- Chỉ số báo cáo mượn từ dữ liệu FE07.
- Chỉ số báo cáo kho từ dữ liệu FE06 / sách và bản sao.
- Thống kê người dùng từ dữ liệu FE11 / người dùng và vai trò.
- API chỉ đọc được bảo vệ theo vai trò.
- Xác thực bộ lọc và xử lý kết quả bằng không.
- Ghi kiểm toán cho lượt xem báo cáo thành công và lỗi truy cập báo cáo an toàn.
- Bảo vệ tuyến API frontend và trạng thái tải, rỗng, lỗi trung thực.

Không bao gồm:

- Xuất CSV/PDF.
- Trang tổng quan.
- Màn hình báo cáo có thể sửa.
- Tích hợp kho dữ liệu / BI.

---

## 2. Quyết định đã phê duyệt được dùng

| Quyết định | Tác động kế hoạch |
| --- | --- |
| Thủ thư và Quản trị có thể xem báo cáo | API báo cáo yêu cầu vai trò nhân viên. |
| Chỉ số mượn là lượt mượn hoạt động, quá hạn, số theo kỳ và sách được mượn nhiều nhất | Phản hồi tổng hợp mượn hiển thị các số đó; hoạt động theo kỳ/sách hàng đầu loại `REQUESTED` và chỉ đếm trạng thái chi tiết khoản mượn thực. |
| Chỉ số kho là tổng sách/bản sao, số theo trạng thái và sách ít/không còn sẵn có | Phản hồi tổng hợp kho hiển thị các số đó và coi 0-2 bản sao sẵn có là tồn thấp. |
| Thống kê người dùng là tổng thành viên, người dùng hoạt động/không hoạt động và thành viên mới theo kỳ | Phản hồi thống kê người dùng giữ tổng hợp; bộ lọc ngày tác động `newMembersByPeriod` theo `Members.ApprovedAt`, không tác động tổng toàn cục. |
| Ngày báo cáo dùng hợp đồng `date` OpenAPI | Backend chấp nhận chính xác `YYYY-MM-DD` và từ chối timestamp hoặc ngày bất khả thi. |
| Xuất CSV/PDF ngoài phạm vi | Không thêm tuyến API xuất. |
| Truy cập báo cáo ghi kiểm toán | Lượt xem thành công và lỗi truy cập an toàn được kiểm toán mà không có token, giá trị truy vấn hay lỗi nội bộ. |
| ID không rõ có định dạng hợp lệ | Trả tổng bằng không và hàng rỗng; ID sai định dạng vẫn là lỗi xác thực. |
| Trạng thái nguồn không rõ | Nhóm là `UNKNOWN` và giữ trong tổng tái lập được. |
| Hàng chi tiết | Dùng trang 1, giới hạn 20, tối đa 100 và thứ tự ổn định riêng báo cáo trong `SPEC.md`. |

---

## 3. Kế hoạch triển khai

### 3.1 Báo cáo mượn

- Xác thực bộ lọc khoảng ngày, trạng thái, sách và người dùng.
- Trả chỉ số lượt mượn hoạt động/quá hạn chuẩn cùng hàng chi tiết có phân trang.
- Nhóm số khoản mượn thực theo kỳ và sách được mượn nhiều nhất mà không đếm chi
  tiết `REQUESTED` đang chờ.
- Tuần tự hóa ngày hàng mượn thành giá trị `YYYY-MM-DD` chính xác và áp dụng thứ
  tự `BorrowDate DESC, BorrowDetailId DESC` ổn định.

### 3.2 Báo cáo kho

- Xác thực bộ lọc thể loại, sách, trạng thái và vị trí.
- Tổng hợp chỉ số chuẩn tổng sách, tổng bản sao và bản sao theo trạng thái.
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

- Thêm kiểm thử tuyến API với report tầng truy cập dữ liệu trong bộ nhớ.
- Thêm kiểm thử tầng truy cập dữ liệu tập trung và hợp đồng OpenAPI cho ranh giới tổng hợp
  và bộ lọc.
- Thêm kiểm thử frontend cho guard tuyến API báo cáo, tính toàn vẹn trạng thái lỗi và
  bộ lọc thể loại kho.
- Bao phủ chỉ số mượn, chỉ số kho, thống kê người dùng, xử lý kết quả bằng không,
  kiểm soát truy cập, xác thực nghiêm ngặt chỉ-ngày, phản hồi lỗi OpenAPI, ngưỡng
  tồn thấp và quyền riêng tư kiểm toán.
- Thêm kiểm thử có tính xác định cấu trúc phản hồi, ID/trạng thái không rõ, phân trang/thứ
  tự, kiểm toán thành công an toàn, không xuất, bộ lọc kho cùng-bản-sao và hợp đồng
  hàng chỉ-ngày.

---

## 4. Ghi chú rà soát

- Phạm vi chỉ đọc và không thay đổi dữ liệu nguồn.
- Xuất hoàn toàn ngoài Giai đoạn 1; triển khai/xác minh quy tắc xác định chỉ theo
  sau rà soát v0.1.5.

## 5. Trạng thái xác thực B6 và tích hợp B7

Xác thực tự động và trình duyệt hoàn tất trên `feat/fe12-validation`, sau đó
rà soát độc lập phát hiện vấn đề về tính đúng đắn, hợp đồng và độ đồng nhất với
dữ liệu mô phỏng. Các phát hiện đã được khắc phục, lượt xác minh đầy đủ mới đã
hoàn tất và rà soát độc lập cuối không còn vấn đề. Nhat xác nhận đã rà soát thủ
công trong nhiệm vụ Codex. Commit `58747bc10657ed1accb44950ae0c5edbd178a242`
sau đó được hợp nhất thẳng vào `main`, đẩy lên `origin/main`, và GitHub Actions
CI `29249491818` đạt cho
cùng commit. Bằng chứng B7 chi tiết ghi trong
`.sdd/reviews/fe12-b7-integration-review-closeout-2026-07-13.md`.

## 6. Trạng thái theo dõi quy tắc xác định

Hợp đồng xác định v0.1.6 được đối soát trên `feat/fe12-deterministic-policy`
dùng độ sâu Hybrid/Standard: API báo cáo, phân quyền, bộ lọc, siêu dữ liệu kiểm toán và
ngữ nghĩa dữ liệu nguồn giữ phần cốt lõi; tiêu thụ phản hồi frontend vẫn là công việc
phần bao ngoài hữu hạn.

- Triển khai B5 hoàn tất cho FE12-N02 đến FE12-N05.
- B6 tự động hoàn tất: kiểm thử FE12 tập trung, bộ backend/frontend đầy đủ,
  kiểm tra mã, tạo bản dựng, truy vết và vệ sinh phần thay đổi đều đạt.
- Tích hợp hệ thống dùng SQL đạt trên cơ sở dữ liệu SQL Server đối soát dùng một
  lần; mốc chuẩn, bản cập nhật cơ sở dữ liệu, kịch bản SQL dùng chung và việc
  dọn dẹp được ghi trong
  `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Chấp nhận Playwright mới đạt cho màn hình mượn/kho/người dùng chuẩn, lọc kết
  quả bằng không, tràn điện thoại, từ chối Member và chuyển hướng Guest.
- Rà soát tích hợp con người và mọi quyết định commit/push/hợp nhất vẫn chờ; bằng
  chứng B7 lịch sử 2026-07-13 không đóng phần theo dõi xác định này.

Bằng chứng hiện tại ghi trong
`.sdd/reviews/fe12-deterministic-policy-validation-2026-07-19.md`.

## 7. Ranh giới danh sách cho phép truy vấn chính xác V0.2.0

Kế hoạch thực thi chi tiết:
`docs/superpowers/plans/2026-07-27-fe07-fe10-fe12-business-rule-alignment.md`.

1. Thêm hồi quy tuyến API trước khi sửa theo bảng dữ liệu cho `?bogus=runtime-secret-value`
   trên báo cáo mượn, kho và người dùng.
2. Xác minh lỗi `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` an toàn, không phản
   chiếu giá trị không rõ và không gọi tầng dịch vụ hoặc tầng truy cập dữ liệu báo cáo.
3. Thêm hàm tạo middleware kiểm tra chính xác khóa truy vấn, có thể dùng lại, trong
   `backend/src/validators/reportValidators.js` và đặt middleware riêng API
   đầu tiên trong mỗi mảng validator.
4. Giữ mọi xác thực giá trị khóa đã phê duyệt, báo cáo rỗng ID không rõ có định
   dạng hợp lệ, SQL có tham số, phân trang/thứ tự, quyền riêng tư kiểm toán và hành
   vi chỉ đọc.
5. Chạy kiểm thử FE12 tập trung/đầy đủ, truy vết, vệ sinh phần thay đổi và một yêu cầu
   HTTP khi chạy thực trước H2.

## 8. Điều kiện tiên quyết ngày nghiệp vụ báo cáo mượn v0.2.1 - Đã hoàn tất

1. Trước khi sửa: cố định tầng dịch vụ đồng hồ tại ranh giới ngày `Asia/Ho_Chi_Minh`, tái hiện
   SIT-002/SIT-008 và thêm ca thiếu/sai `businessDate` cho SQL/trong bộ nhớ.
2. Sau khi sửa: tầng dịch vụ đọc đồng hồ đúng một lần, tạo `businessDate` bằng
   `formatBusinessDate` và truyền tường minh cho tầng truy cập dữ liệu.
3. SQL và trong bộ nhớ tầng truy cập dữ liệu bắt buộc `businessDate` hợp lệ chính xác
   `YYYY-MM-DD`; thiếu, sai định dạng hoặc ngày bất khả thi phải từ chối ngay trước
   khi SQL/dữ liệu kiểm thử được đọc.
4. Mọi kiểm thử trực tiếp tầng truy cập dữ liệu đều truyền ngày cố định; không
   dùng đồng hồ toàn cục giả và không đổi trạng thái mong đợi `BORROWED` thành
   `OVERDUE` để che sai lệch.
5. Chạy tập trung/toàn bộ backend, độ bao phủ, frontend, E2E, triển khai, truy vết
   và vệ sinh phần thay đổi trước H2/H3.

Hoàn tất qua PR #81, hợp nhất `main@0d064b5`; không lặp lại FE12-N12/N13 trong
phạm vi tổng quan vận hành.

## 9. Kế hoạch tổng quan vận hành v0.3.0

1. `SL-001`: hợp nhất phê duyệt kích hoạt trước khi sửa phần sản phẩm.
2. `SL-005` Trước khi sửa: tái sử dụng tầng dịch vụ đồng hồ và `businessDate` đã triển khai để
   thêm tầng truy cập dữ liệu/tầng dịch vụ/tuyến API hợp đồng cho tổng quan vận hành.
3. `SL-005` Sau khi sửa: tổng quan vận hành nhận cùng `businessDate`; SQL tầng truy cập dữ liệu
   dùng `@BusinessDate`, tầng truy cập dữ liệu trong bộ nhớ nhận cùng tham số và không
   tầng truy cập dữ liệu nào tự gọi `new Date()` để phân loại quá hạn.
4. `availableCopies` chỉ đếm cặp sách/bản sao
   `Books.Status = 'ACTIVE'` và `BookCopies.Status = 'AVAILABLE'`;
   `lowStockBooks` chỉ xét sách `ACTIVE` có 0..2 bản sao `AVAILABLE`.
5. Frontend nhân viên trang tổng quan gọi một bản tổng hợp FE12 và hiển thị KPI lỗi/thiếu là
   `Không tải được`, không phải `0`.
6. `SL-006`: tích hợp đầy đủ, kiểm thử Chromium trên máy tính và L1-L4; phần
   thay đổi sản phẩm chưa được commit cho đến H2, và bắt buộc có H3 trước hợp nhất.
