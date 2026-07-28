# PLAN.md - FE09 Quản lý tiền phạt

Trạng thái: ĐÃ HOÀN TẤT - ĐÃ GHI NHẬN BẰNG CHỨNG CHỐT GIAI ĐOẠN 2

Chủ sở hữu: Dung

Cập nhật: 2026-07-19

Trạng thái quy trình: đã hoàn tất cho phạm vi Giai đoạn 2 đã phê duyệt; H3, merge và CI `main` chính xác sau merge được ghi tại `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`. Các phát biểu cổng đang chờ/mở bên dưới là ảnh chụp thực thi lịch sử đã được bằng chứng đó thay thế.

> **Dành cho agent triển khai:** Thực hiện tác vụ đối soát sau rà soát lát cắt lịch sử. Coi hợp đồng phạt đã phê duyệt là nguồn sự thật: ngày máy chủ, không số tiền client, không thanh toán một phần, trạng thái kết thúc và cập nhật audit/thanh toán nguyên tử.

---

## 1. Mục tiêu

Đối soát quy trình phạt phía máy chủ FE09 hiện có và UI prototype với hợp đồng v0.4.1 xác định cho tính quá hạn, thu ngoại tuyến đầy đủ, trạng thái đã thanh toán/miễn/hủy, lọc danh sách, múi giờ, audit và hiển thị FE07/FE12.

## 2. Tài liệu nguồn

- `.sdd/specs/feat-fine-management/SPEC.md` v0.4.1.
- `.sdd/specs/feat-fine-management/CONTEXT.md` v0.2.0.
- `.sdd/specs/feat-fine-management/TEST_PLAN.md`.
- `.sdd/specs/feat-borrowing-management/SPEC.md` v0.5.0.
- `.sdd/rfcs/ADR-002-database-design.md`.
- `database/Librarymanagement.sql`.
- `.sdd/constraints/safety.md`.

## 3. Mốc cơ sở hiện có và sai lệch

| Hợp đồng đã phê duyệt | Sai lệch hiện tại cần đối soát |
| --- | --- |
| Giai đoạn 1 không có thanh toán một phần | Đã giải quyết: service từ chối số tiền client và repository luôn đặt `PaidAmount = Amount`. |
| Thu đầy đủ đặt `PaidAmount = Amount`, `CollectedBy`, `PaymentMethod`, `PaidAt` và `PAID` nguyên tử | Đã giải quyết: thay đổi và audit chia sẻ ranh giới giao dịch repository. |
| Ngày quá hạn dùng `Asia/Ho_Chi_Minh` | Đã giải quyết: `libraryBusinessTime.js` sở hữu chuyển đổi ngày nghiệp vụ rõ ràng. |
| Miễn/hủy Quản trị là một phần của mô hình trạng thái | Đã giải quyết: route chính tắc, xác thực vai trò/lý do, xung đột kết thúc và siêu dữ liệu audit được bao phủ. |
| Danh sách phạt được phân trang, lọc và cố định `FineId ASC` | Đã giải quyết trong hợp đồng máy chủ, repository và UI: `q`, `status`, `page`, `limit` do máy chủ sở hữu và UI dùng envelope chính tắc. |
| Hành vi production FE09 là phía máy chủ | Đã giải quyết: UI gọi API chính tắc, không lọc/phân trang danh sách trong trình duyệt và có bằng chứng trình duyệt/L4 tập trung. |
| Mọi thay đổi trạng thái/thanh toán nguyên tử và được audit | Đã giải quyết: tính toán, thu, thanh toán, miễn và hủy dùng một giao dịch thay đổi/audit có bằng chứng hoàn tác. |

Kết quả T001-T011 lịch sử chỉ chứng minh lát cắt phía máy chủ trước đó. Chúng không đóng tác vụ đối soát v0.4.1.

## 4. Phạm vi

### Trong phạm vi

- Xem phạt của mình, danh sách/chi tiết nhân sự và ngữ cảnh phạt được bảo vệ.
- Tính phạt quá hạn từ ngày mượn đã lưu và ngày nghiệp vụ máy chủ.
- Ngăn phạt đang hoạt động trùng lặp khi đồng thời.
- Ghi một lần thu ngoại tuyến đầy đủ hoặc đối soát thanh toán đầy đủ rõ ràng.
- Đánh dấu `PAID`, `WAIVED` hoặc `CANCELLED` với bảo vệ trạng thái kết thúc và siêu dữ liệu audit.
- Công khai trạng thái phạt nhất quán cho điều kiện mượn FE07 và báo cáo FE12.
- Xác thực và ghi tài liệu phân trang, lọc, ID, trạng thái, phương thức thanh toán và lý do quản trị.
- Kiểm thử backend/SQL/hợp đồng tập trung, truy vết, hành vi danh sách frontend do máy chủ kiểm soát và chấp nhận trình duyệt/L4.

### Ngoài phạm vi

- Thanh toán một phần hoặc trạng thái `PARTIALLY_PAID`.
- Cổng thanh toán trực tuyến, xử lý thẻ, hoàn tiền hay quy trình xác nhận/từ chối thanh toán.
- Tính phạt bản sao mất/hỏng trong Giai đoạn 1.
- Quyền sở hữu mượn/trả, thay đổi trạng thái bản sao, thông báo hoặc triển khai dashboard báo cáo.
- Scheduler phạt hằng ngày tự động.

## 5. Bản đồ tệp và giao diện

| Khu vực | Tệp | Trách nhiệm |
| --- | --- | --- |
| Dữ liệu/schema | `database/Librarymanagement.sql`, `backend/src/models/Fine.js`, `.sdd/rfcs/ADR-002-database-design.md` | Xác minh `OverdueDays`, `RatePerDay`, `PaidAmount`, `PaidAt`, `CollectedBy`, `PaymentMethod` và kiểm tra trạng thái kết thúc. |
| Ranh giới HTTP | `backend/src/routes/fineRoutes.js`, `backend/src/controllers/fineManagementController.js` | Route danh sách/chi tiết/tính/thu/thanh toán/miễn/hủy phía máy chủ; thay đổi create/update/delete cũ không đăng ký và trả `404`. |
| Quy tắc nghiệp vụ | `backend/src/services/fineManagementService.js`, tạo `backend/src/utils/libraryBusinessTime.js` | Tính có nhận biết múi giờ, thu đầy đủ, trạng thái kết thúc, xác thực vai trò/lý do và lỗi an toàn. |
| Lưu trữ | `backend/src/repositories/fineRepository.js`, `backend/src/repositories/auditLogRepository.js` | Phát hiện trùng có khóa, ghi trạng thái/thanh toán/audit nguyên tử, phân trang/lọc/thứ tự danh sách. |
| Tài liệu API | `backend/src/docs/openapi.yaml`, `.sdd/specs/feat-fine-management/SPEC.md` | Hợp đồng yêu cầu/phản hồi/lỗi chính xác. |
| Kiểm thử backend | `backend/tests/fineManagementRoutes.test.js`, `backend/tests/fineRoutes.test.js`, tạo `backend/tests/fineContract.test.js`, tạo `backend/tests/sql/fineConcurrency.sqltest.js`, `backend/tests/helpers/inMemoryFineRepositories.js` | Kiểm thử đối soát cùng bao phủ `404` thay đổi cũ rõ ràng. |
| Ranh giới frontend | `frontend/src/page/FineManagement.jsx`, `frontend/src/api/libraryFeatureApi.js`, `frontend/src/utils/fineListQuery.js`, `frontend/test/fineManagementFrontend.test.js`, `tests/e2e/fe09-fine-management.spec.js` | Xây truy vấn máy chủ chính tắc, dùng phân trang máy chủ, giữ quyền sở hữu thay đổi an toàn và chứng minh hành vi L4 desktop/di động. |

## 6. Giao diện đã phê duyệt

| Phương thức | Endpoint | Hành vi bắt buộc |
| --- | --- | --- |
| `GET` | `/api/fines/me` | Phạt của chính Thành viên; `page = 1`, `limit = 20`; không dữ liệu liên thành viên. |
| `GET` | `/api/fines` | Danh sách Thủ thư/Quản trị viên; `q`, `userId`, `status`, page/limit; cố định `FineId ASC`. |
| `GET` | `/api/fines/{fineId}` | Chi tiết chủ sở hữu hoặc Thủ thư/Quản trị viên; chỉ ngữ cảnh mượn an toàn. |
| `POST` | `/api/fines/calculate` | Thủ thư/Quản trị viên tính thủ công từ `borrowDetailId`; không có số tiền/ngày client và không actor scheduler. |
| `POST` | `/api/fines/{fineId}/collections` | Thủ thư/Quản trị viên ghi thu ngoại tuyến đầy đủ; đặt mọi trường thanh toán và `PAID` nguyên tử. |
| `PATCH` | `/api/fines/{fineId}/paid` | Đối soát thanh toán đầy đủ của Thủ thư/Quản trị viên với cùng quy tắc kết thúc/thanh toán. |
| `PATCH` | `/api/fines/{fineId}/waive` | Chuyển đổi có lý do chỉ Quản trị `UNPAID -> WAIVED`. |
| `PATCH` | `/api/fines/{fineId}/cancel` | Chuyển đổi có lý do chỉ Quản trị `UNPAID -> CANCELLED`. |

Xung đột thu tiền đã giải quyết trả `409 FINE_NOT_COLLECTIBLE`; xung đột đã thanh toán trả `409 FINE_NOT_PAYABLE`; xung đột miễn/hủy trả `409 FINE_NOT_RESOLVABLE`.

## 7. Chiến lược triển khai theo thứ tự

### 7.1 Kiểm thử hợp đồng và đồng thời RED

- Thêm kiểm thử thất bại cho không số tiền một phần, siêu dữ liệu thu đầy đủ, biên múi giờ, API miễn/hủy, lý do không hợp lệ, phân trang, thứ tự cố định và hoàn tác audit nguyên tử.
- Thêm kiểm thử đồng thời SQL chứng minh chỉ một lần tính trùng và một chuyển đổi thanh toán kết thúc thành công.

### 7.2 Đối soát schema/API

- Xác minh trường SQL hiện có và `CK_Fines_Status`; chỉ cập nhật ADR/OpenAPI cho khoảng trống hợp đồng v0.4.1 đã xác nhận.
- Điều hướng danh sách quản lý tới service phía máy chủ và giữ thay đổi create/update/delete cũ ngoài router production.

### 7.3 Hợp đồng tính toán và điều kiện hợp lệ

- Tập trung chuyển đổi ngày nghiệp vụ về `Asia/Ho_Chi_Minh`.
- Tính từ `DueDate`/`ReturnDate` đã lưu hoặc ngày nghiệp vụ hiện tại; số tiền là `overdueDays * 5000`.
- Tính lại phạt quá hạn `UNPAID` hiện có tại chỗ; bản ghi phạt kết thúc giữ nguyên.

### 7.4 Thu đầy đủ và trạng thái kết thúc

- Loại ngữ nghĩa thu một phần khỏi hợp đồng production.
- Thu/thanh toán đặt `PaidAmount = Amount`, `CollectedBy`, `PaymentMethod`, `PaidAt` và `PAID` trong một giao dịch.
- Miễn/hủy Quản trị yêu cầu lý do và cập nhật trạng thái cộng audit nguyên tử.
- Trạng thái kết thúc từ chối thu/thanh toán/giải quyết sau đó mà không ghi đè siêu dữ liệu.

### 7.5 Lượt đọc, tích hợp và ranh giới frontend

- Thêm bộ lọc danh sách/chi tiết xác định và đọc lại trạng thái FE07/FE12 an toàn.
- Chuyển hoàn toàn tìm kiếm danh sách, lọc trạng thái và phân trang sang truy vấn/envelope máy chủ chính tắc.
- Thêm kiểm thử nguồn tập trung cùng bằng chứng trình duyệt cho tham số yêu cầu, chuyển trang, tổng đã lọc và tràn đáp ứng.
- Thêm truy vết và bằng chứng tập trung trước bất kỳ cổng merge đầy đủ nào.

## 8. Thứ tự phụ thuộc

1. Kiểm thử RED backend/SQL/hợp đồng.
2. Đối soát schema/OpenAPI/mô hình.
3. Tính toán/múi giờ/ngăn trùng lặp.
4. Trạng thái thu/thanh toán/miễn/hủy đầy đủ nguyên tử.
5. Danh sách/chi tiết và đọc lại FE07/FE12.
6. Tài liệu ranh giới frontend, truy vết, xác minh tập trung, rà soát của con người.

## 9. Cổng xác minh

| Cổng | Lệnh | Kết quả mong đợi |
| --- | --- | --- |
| Backend FE09 | `npm.cmd --prefix backend test -- --runTestsByPath tests/fineManagementRoutes.test.js tests/fineRoutes.test.js tests/fineContract.test.js` | API phía máy chủ, `404` thay đổi cũ, hợp đồng, kết thúc và quyền đạt. |
| Đồng thời SQL FE09 | `npm.cmd --prefix backend test -- --runTestsByPath tests/sql/fineConcurrency.sqltest.js` | Tính trùng lặp và ca thanh toán/audit nguyên tử đạt khi cấu hình SQL sẵn có. |
| Ranh giới frontend FE09 | `node --test frontend/test/fineManagementFrontend.test.js frontend/test/fineOperationalFrontend.test.js` | Xây truy vấn chính tắc, dùng phân trang máy chủ, không fallback lưu trữ trình duyệt và thao tác kết thúc an toàn đạt. |
| Trình duyệt/L4 FE09 | Playwright trên cổng frontend/backend cô lập `4185/3101` | Yêu cầu tìm kiếm/trạng thái/trang máy chủ, số hàng trả về, tổng, điều hướng trang và tràn di động đạt. |
| Truy vết | `npm.cmd run trace:enforce` | Các tệp triển khai FE09 thay đổi thỏa ngưỡng truy vết. |
| Vệ sinh diff | `git diff --check` | Không có lỗi khoảng trắng. |

## 10. Cổng rà soát của con người

- [x] Nhat xác nhận không chấp nhận thanh toán một phần trong Giai đoạn 1 vào 2026-07-17.
- [x] Nhat xác nhận đối soát thu đầy đủ và đã thanh toán dùng cùng quy tắc siêu dữ liệu thanh toán vào 2026-07-17.
- [x] Nhat xác nhận quyền sở hữu miễn/hủy và độ dài lý do vào 2026-07-17.
- [x] Nhat xác nhận ranh giới tính toán `Asia/Ho_Chi_Minh` vào 2026-07-17.
- [x] Nhat xác nhận frontend prototype không phải bằng chứng hoàn tất production vào 2026-07-17; v0.4.1 upstream loại thay đổi create/update/delete máy chủ cũ của nó.

Triển khai phía agent và bằng chứng L4 được ghi tại `.sdd/reviews/fe09-fine-reconciliation-validation-2026-07-19.md`; bằng chứng SQL trực tiếp được ghi tại `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`. Các cổng tự động này không thay thế chấp nhận cuối của con người trong dự án.

## 11. Tích hợp phạt thành viên và vai trò v0.4.3

1. Bảo vệ `GET /api/fines/me` bằng ranh giới Thành viên một vai trò dùng chung của FE07/FE08.
2. Mở rộng DTO phạt chính tắc với hạn trả, ngày trả và trạng thái chi tiết mượn do FE07 sở hữu.
3. Giữ trang Thành viên chỉ đọc, giải thích yếu tố chặn mượn/gia hạn `UNPAID` dương FE07 và liên kết đến lịch sử mượn chính tắc.
4. Giữ tính và thu ngoại tuyến đầy đủ của Thủ thư/Quản trị viên; giữ miễn/hủy chỉ Quản trị.
5. Xác minh truy cập Khách/Thành viên/Thủ thư/Quản trị, projection ngữ cảnh mượn, hành vi chỉ đọc frontend, OpenAPI và truy vết.
6. Giữ `borrowDetailId` trong quan hệ API/cơ sở dữ liệu chính tắc trong khi ẩn mã định danh nội bộ đó khỏi bảng phạt Thành viên.
7. Cho không gian trả nhân sự FE07 gọi endpoint tính FE09 hiện có cho `borrowDetailId` quá hạn đã chọn; không thêm ngày hoặc số tiền do client kiểm soát.
