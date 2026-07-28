# Kế hoạch kiểm thử FE09 - Quản lý tiền phạt

Phiên bản: 0.3.4
Trạng thái: ĐÃ HOÀN TẤT - ĐÃ GHI NHẬN BẰNG CHỨNG CHỐT GIAI ĐOẠN 2
Cập nhật lần cuối: 2026-07-21

Đặc tả nguồn: `.sdd/specs/feat-fine-management/SPEC.md` v0.4.3
ID tính năng: `BR-FE09-*`, `FR-FE09-*`, `AC-FE09-*`
Ánh xạ AC-đến-kiểm thử có thẩm quyền: Phần 16 Ma trận truy vết trong `SPEC.md` (tệp này mô tả chiến lược, không phải danh sách ca kiểm thử).

---

## 1. Phạm vi kiểm thử

Tính phạt quá hạn phía máy chủ, ngăn trùng lặp, thu ngoại tuyến đầy đủ, trạng thái kết thúc đã thanh toán/miễn/hủy, ghi audit, đọc lại điều kiện hợp lệ FE07, danh sách phạt xác định và hiển thị được bảo vệ theo vai trò. Route CRUD `POST`/`PUT`/`DELETE /api/fines` cũ không thuộc hợp đồng production và phải không đăng ký; `fineRoutes.test.js` xác minh ranh giới đó.

FE09-T013 đến FE09-T021 hiện có bằng chứng RED/GREEN, SQL trực tiếp và trình duyệt/L4 phía agent. Chấp nhận của con người trong dự án vẫn là cổng phát hành.

## 2. Mục tiêu kiểm thử đơn vị / service

- Tính toán: 5.000 VND cho mỗi ngày quá hạn trên mỗi bản sao, bắt đầu ngày sau hạn trả đã lưu.
- Nguồn ngày: dùng ngày đến hạn/trả đã lưu và ngày nghiệp vụ `Asia/Ho_Chi_Minh`; bỏ qua số tiền, ngày quá hạn hoặc ngày do client cung cấp.
- Không quá hạn và dữ liệu chưa hoàn tất: không tạo phạt cho số ngày quá hạn bằng/nhỏ hơn 0 và từ chối dữ liệu mượn bắt buộc bị thiếu.
- Ngăn trùng lặp: trả phạt đang hoạt động hiện có không đổi và ngăn tạo trùng lặp đồng thời.
- Bất biến thanh toán: Giai đoạn 1 không nhận thanh toán một phần; `PaidAmount = 0` khi `UNPAID` và `PaidAmount = Amount` chỉ khi `PAID`.
- Thu đầy đủ và đối soát thanh toán: đặt `CollectedBy`, `PaymentMethod`, `PaidAt`, `PaidAmount` và `Status = PAID` nguyên tử.
- Trạng thái kết thúc: từ chối thử lại thu, thanh toán, miễn hoặc hủy cho `PAID`, `WAIVED` và `CANCELLED` mà không ghi đè siêu dữ liệu.
- Giải quyết Quản trị: chỉ Quản trị có thể miễn/hủy; cắt khoảng trắng và xác thực độ dài lý do 1..500; ghi trạng thái và audit nguyên tử.
- Audit và hoàn tác: tính toán và mọi thay đổi trạng thái có thể truy vết; ghi audit thất bại hoàn tác thay đổi phạt liên quan.
- Danh sách phạt: mặc định `page = 1`, `limit = 20`, giới hạn `page >= 1` và `limit = 1..100`, `FineId ASC` cố định và xác thực bộ lọc xác định.

## 3. Mục tiêu kiểm thử API / tích hợp (Phần 11 SPEC)

- `POST /api/fines/calculate`: truy cập Thủ thư/Quản trị, tính quá hạn, kết quả đúng hạn/không phạt, thiếu chi tiết mượn, thiếu hạn trả, biên múi giờ, hành vi từ chối/bỏ qua giả mạo client và idempotency.
- `GET /api/fines/me`: cô lập phạt riêng chỉ Thành viên, phân trang mặc định, lọc trạng thái và từ chối query không hợp lệ trước truy cập repository.
- Tích hợp phạt Thành viên: Khách nhận `401`; Thủ thư/Quản trị nhận `403`; hàng Thành viên công khai ngữ cảnh hạn trả/trả FE07, giải thích yếu tố chặn `UNPAID` dương, liên kết lịch sử mượn và không có điều khiển thay đổi.
- `GET /api/fines`: danh sách chỉ nhân sự, từ chối thành viên/khách, bộ lọc `q`/người dùng/trạng thái, phân trang mặc định, thứ tự `FineId ASC` cố định và từ chối page/limit/trạng thái/ID người dùng không hợp lệ.
- `GET /api/fines/:fineId`: truy cập chi tiết thành viên chỉ chủ sở hữu, truy cập nhân sự, từ chối thành viên khác và hành vi không tìm thấy an toàn.
- `POST /api/fines/:fineId/collections`: chỉ thu ngoại tuyến đầy đủ; từ chối `collectedAmount` hoặc payload thanh toán một phần; lưu mọi siêu dữ liệu thanh toán và trả `PAID` nguyên tử.
- `PATCH /api/fines/:fineId/paid`: cùng quy tắc siêu dữ liệu thanh toán đầy đủ/trạng thái kết thúc như thu; từ chối thành viên và xung đột trả hai lần.
- `PATCH /api/fines/:fineId/waive`: lý do hợp lệ chỉ Quản trị, lý do không hợp lệ, bản ghi audit, xung đột kết thúc và hiển thị phạt đã giải quyết.
- `PATCH /api/fines/:fineId/cancel`: lý do hợp lệ chỉ Quản trị, lý do không hợp lệ, bản ghi audit, xung đột kết thúc và hiển thị phạt đã giải quyết.
- Tích hợp FE07/FE12: phạt `UNPAID` dương chặn mượn/gia hạn, trong khi phạt `PAID`, `WAIVED` và `CANCELLED` không chặn và công khai trạng thái ổn định cho bên dùng.

## 4. Luồng chấp nhận E2E / thủ công

- Trả quá hạn -> Thủ thư tính phạt -> Thủ thư ghi một lần thu ngoại tuyến đầy đủ -> siêu dữ liệu thanh toán và audit được commit -> FE07 không còn chặn thành viên.
- Quản trị miễn hoặc hủy phạt chưa thanh toán với lý do hợp lệ -> phạt vẫn hiển thị, thành kết thúc và bản ghi audit commit nguyên tử.
- Nhân sự liệt kê phạt với phân trang bỏ qua -> 20 bản ghi đầu hiển thị theo thứ tự `FineId ASC`; bộ lọc không hợp lệ bị từ chối không có truy vấn dữ liệu.
- Frontend `FineManagement.jsx` gửi truy vấn tìm kiếm/trạng thái/trang/giới hạn chính tắc, dùng envelope danh sách máy chủ và hiển thị phân trang desktop/di động đáp ứng không lọc/cắt trong trình duyệt.
- Frontend giữ một phạt đã chọn chính tắc từ tính hoặc chọn danh sách xuyên thu/đối soát thanh toán, kể cả khi phạt đó nằm ngoài trang danh sách hiện hiển thị; bước thanh toán từ chối lựa chọn thiếu hoặc kết thúc.
- Thành viên mở “Tiền phạt của tôi” -> chỉ thấy phạt của mình với ngữ cảnh sách/hạn trả/trả -> thông báo chưa thanh toán giải thích hạn chế mượn và gia hạn FE07 -> lịch sử mượn mở để đối soát -> chỉ nhân sự có thể ghi thu ngoại tuyến.

## 5. Bằng chứng hiện có

- `backend/tests/fineManagementRoutes.test.js` chứa bao phủ route phía máy chủ đã đối soát (21 kiểm thử; AC-FE09-001..015 cùng ca giao dịch và xác thực).
- `backend/tests/fineRoutes.test.js` xác minh RBAC danh sách nhân sự và route thay đổi CRUD cũ trả `404`.
- `backend/tests/fineContract.test.js` bao phủ tám thao tác OpenAPI chính tắc và biên múi giờ.
- `backend/tests/sql/fineConcurrency.sqltest.js` đạt cả ba kiểm tra hợp đồng/giao dịch tĩnh và sáu ca SQL thay đổi trên runtime SQL Server dùng một lần.
- `frontend/test/fineManagementFrontend.test.js` bao phủ quyền sở hữu API chính tắc, xây truy vấn máy chủ, siêu dữ liệu phân trang máy chủ và không có lưu trữ demo.
- `frontend/test/fineOperationalFrontend.test.js` giữ bố cục vận hành dùng chung và ranh giới thay đổi an toàn.
- `tests/e2e/fe09-fine-management.spec.js` đạt luồng L4 truy vấn máy chủ, phân trang, lọc/tìm kiếm, số hàng trả về và tràn di động.

## 6. Khoảng trống

- Bằng chứng lưu trữ, tính trùng lặp, bên thắng kết thúc, điều kiện hợp lệ và hoàn tác nguyên tử đạt trên SQL Server dùng một lần; xem `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Chấp nhận tích hợp cuối của con người trong dự án vẫn đang mở.
- Thanh toán trực tuyến, thanh toán một phần, lập lịch tự động và chính sách phạt mất/hỏng vẫn ngoài Giai đoạn 1.

## 7. Bao phủ NFR

| ID NFR | Mục tiêu kiểm thử | Trạng thái bằng chứng |
| ------ | ----------------- | --------------------- |
| NFR-FE09-SEC-001 | Xác thực trên mọi endpoint phạt và tính thủ công chỉ nhân sự. | Middleware route cùng bằng chứng vai trò/quyền tập trung; L4 trình duyệt chạy với trạng thái Thủ thư đã lưu. |
| NFR-FE09-SEC-002 | Cô lập phạt riêng Thành viên cho danh sách và chi tiết. | Kiểm thử danh sách riêng và chi tiết thành viên khác tập trung đạt. |
| NFR-FE09-SEC-003 | Bảo vệ thu/thanh toán Thủ thư/Quản trị và miễn/hủy chỉ Quản trị. | Ma trận vai trò tập trung đạt. |
| NFR-FE09-SEC-004 | Tính bỏ qua số tiền, ngày quá hạn và input ngày client. | Kiểm thử giả mạo tập trung đạt. |
| NFR-FE09-SEC-005 | Xác thực ID, trạng thái, phương thức thanh toán, ghi chú, lý do và phân trang trước truy cập repository. | Ma trận xác thực tập trung đạt. |
| NFR-FE09-TXN-001 | Tạo phạt nguyên tử và phát hiện trùng dưới đồng thời. | Các ca tính trùng/hoàn tác trong bộ nhớ và SQL trực tiếp đạt. |
| NFR-FE09-TXN-002 | Cập nhật thanh toán/lý do/trạng thái/audit nguyên tử có hoàn tác và một bên thắng kết thúc. | Các ca bên thắng kết thúc/hoàn tác trong bộ nhớ và SQL trực tiếp đạt. |
| NFR-FE09-PERF-001 | Mặc định/giới hạn phân trang và thứ tự `FineId ASC` cố định. | Hợp đồng danh sách tập trung đạt. |
| NFR-FE09-PERF-002 | Tra cứu tính toán chi tiết mượn dùng truy cập dựa trên khóa. | Tra cứu repository bị giới hạn khóa chính và được bao phủ bằng rà soát nguồn. |
| NFR-FE09-LOG-001 | Tính, thu, thanh toán, miễn, hủy và thay đổi thất bại có thể truy vết. | Kiểm thử siêu dữ liệu audit và hoàn tác tập trung đạt. |
| NFR-FE09-LOG-002 | Đầu ra audit/log loại trừ dữ liệu cá nhân không cần thiết. | Siêu dữ liệu audit được allow-list tới ngữ cảnh phạt và trường ghi chú/lý do an toàn. |
| NFR-FE09-UX-001 | Hiển thị phạt gồm số tiền, lý do, trạng thái và ngữ cảnh mượn. | DTO API/OpenAPI, kiểm tra nguồn frontend và trình duyệt/L4 đạt. |
| NFR-FE09-UX-002 | Phản hồi lỗi phân biệt thiếu, không được phân quyền và xung đột kết thúc. | Assertion mã lỗi xác định đạt. |
| NFR-FE09-TIME-001 | Khoản mượn đã trả và đang hoạt động dùng ngày nghiệp vụ `Asia/Ho_Chi_Minh`. | Kiểm thử biên tập trung đạt; xác nhận môi trường trực tiếp đang chờ. |

## 8. Lệnh / bằng chứng bắt buộc trước khi merge

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/fineManagementRoutes.test.js tests/fineRoutes.test.js tests/fineContract.test.js
npm.cmd --prefix backend run test:sql:fe09
node --test frontend/test/fineManagementFrontend.test.js
$env:E2E_FRONTEND_PORT='4185'; $env:E2E_BACKEND_PORT='3101'; $env:E2E_FRONTEND_URL='http://127.0.0.1:4185'; $env:E2E_BACKEND_URL='http://127.0.0.1:3101'; npx playwright test tests/e2e/fe09-fine-management.spec.js --project=chromium
npm.cmd run trace:enforce
git diff --check
```

Các cổng kiểm thử, lint và build toàn kho vẫn bắt buộc trước merge; chúng không chạy lại trong lượt chuẩn hóa chỉ tài liệu này.
