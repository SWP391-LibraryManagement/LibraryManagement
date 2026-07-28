# PLAN.md - FE06 Quản lý tồn kho / bản sao sách

Trạng thái: ĐÃ HOÀN TẤT - ĐÃ GHI NHẬN BẰNG CHỨNG CHỐT GIAI ĐOẠN 2

Chủ sở hữu: Dat

Cập nhật: 2026-07-19

Trạng thái quy trình: đã hoàn tất cho phạm vi Giai đoạn 2 đã phê duyệt; H3, merge và CI `main` chính xác sau merge được ghi tại `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`. Các phát biểu cổng đang chờ/mở bên dưới là ảnh chụp thực thi lịch sử đã được bằng chứng đó thay thế.

> **Dành cho agent triển khai:** Thực hiện `TASKS.md` theo thứ tự. Mọi thay đổi bản sao thủ công phải được chứng minh bằng kiểm thử RED/GREEN tập trung, `If-Match` khớp, kiểm tra xung đột trong giao dịch và một lần ghi audit nguyên tử.

---

## 1. Mục tiêu

Đối soát prototype FE06 với hợp đồng vòng đời bản sao xác định đã được phê duyệt, để các lượt đọc tồn kho, siêu dữ liệu bản sao vật lý, chuyển trạng thái thủ công, tính khả dụng hiệu lực, đồng thời và lịch sử audit luôn nhất quán với FE05, FE07 và FE08.

## 2. Tài liệu nguồn

- `.sdd/specs/feat-inventory-book-copy/SPEC.md` v0.4.2.
- `.sdd/specs/feat-inventory-book-copy/CONTEXT.md` v0.2.1.
- `.sdd/specs/feat-inventory-book-copy/TEST_PLAN.md`.
- `.sdd/rfcs/ADR-002-database-design.md`.
- Các đặc tả đã được phê duyệt của FE05, FE07 và FE08 về quyền sở hữu sách cha, mượn và đặt trước.
- `database/Librarymanagement.sql`.
- `.sdd/constraints/safety.md`.

## 3. Sai lệch mốc cơ sở đã đối soát

| Hợp đồng đã phê duyệt | Triển khai đã đối soát |
| --- | --- |
| Các thay đổi bản sao hiện có yêu cầu SQL `rowversion` và `If-Match` | `BookCopies.Version` và `If-Match` bắt buộc được triển khai cho cập nhật/trạng thái/ngừng kích hoạt. |
| Kiểm tra xung đột và ghi audit diễn ra trong giao dịch thay đổi | Repository khóa và kiểm tra lại trạng thái quy trình/sách cha; bản sao và audit cùng commit hoặc hoàn tác. |
| Thứ tự khóa là `BookCopies -> BorrowDetails -> Reservations` | Nguồn SQL và kiểm thử race trực tiếp xác minh thứ tự đã phê duyệt và các lần kiểm tra lại có thẩm quyền. |
| Tạo/chuyển trạng thái sang `AVAILABLE` yêu cầu `Books.Status = ACTIVE` của sách cha | Các thay đổi tạo và trạng thái khóa/kiểm tra lại sách cha trong giao dịch. |
| Lý do trạng thái là bắt buộc, được cắt khoảng trắng 1..500 | Ranh giới và UI yêu cầu lý do đã cắt khoảng trắng dài 1..500 ký tự. |
| Ngừng kích hoạt trùng lặp là idempotent với `changed = false` | Ngừng kích hoạt trùng lặp ở phiên bản hiện tại trả về trạng thái không đổi mà không có audit thứ hai. |
| Tồn kho trả về số đếm và phân trang xác định | API trả về `{ items, page, limit, totalItems, totalPages, countsByStatus }`. |
| Frontend dựa trên máy chủ | Màn hình tồn kho tải trạng thái máy chủ chính tắc và giữ hành vi phiên bản/lý do/xung đột. |

## 4. Phạm vi

### Trong phạm vi

- Các endpoint danh sách tồn kho, chi tiết bản sao, tra cứu mã vạch, tạo/cập nhật/trạng thái/ngừng kích hoạt bản sao được bảo vệ.
- Xác thực mã vạch và vị trí, phân trang xác định, trường phản hồi an toàn và số đếm theo trạng thái.
- Các chuyển đổi thủ công đã phê duyệt giữa `AVAILABLE`, `DAMAGED`, `LOST` và `INACTIVE`; thay đổi trực tiếp `BORROWED`/`RESERVED` vẫn bị cấm.
- Bảo vệ sách cha đang hoạt động cho các chuyển đổi do FE06 sở hữu sang `AVAILABLE`.
- SQL `rowversion`, `If-Match`, kiểm tra lại mượn/đặt trước trong giao dịch, thứ tự khóa cố định và audit log nguyên tử.
- Ngừng kích hoạt trùng lặp idempotent cùng lỗi xung đột đặt trước/mượn rõ ràng.
- Frontend vận hành dựa trên máy chủ, kiểm thử tập trung, tài liệu API và truy vết.

### Ngoài phạm vi

- Cập nhật siêu dữ liệu danh mục FE05.
- Triển khai mượn/trả FE07 và giữ/giải phóng FE08.
- Tạo tiền phạt, tích hợp phần cứng RFID/mã vạch, nhập/xuất hàng loạt hoặc trường tình trạng bản sao.
- Xóa vật lý bản sao.
- PII của người mượn/chủ sở hữu đặt trước trong phản hồi FE06.

## 5. Bản đồ tệp và giao diện

| Khu vực | Tệp | Trách nhiệm |
| --- | --- | --- |
| Hợp đồng SQL | `database/Librarymanagement.sql`, `.sdd/rfcs/ADR-002-database-design.md` | Thêm rowversion `BookCopies` và ghi lại quy tắc khóa/quyền sở hữu thay đổi. |
| Ranh giới HTTP | `backend/src/routes/inventoryRoutes.js`, `backend/src/controllers/inventoryController.js`, `backend/src/validators/inventoryValidators.js` | RBAC, `If-Match`, ID, bộ lọc, siêu dữ liệu, trạng thái và xác thực lý do. |
| Quy tắc nghiệp vụ | `backend/src/services/inventoryService.js` | Ma trận chuyển đổi đã phê duyệt, bảo vệ sách cha, kết quả xung đột, hợp đồng phản hồi an toàn và tính idempotent. |
| Lưu trữ | `backend/src/repositories/inventoryRepository.js`, `backend/src/repositories/auditLogRepository.js` | Khóa hàng giao dịch, so sánh phiên bản, kiểm tra lại xung đột, thay đổi, truy vấn số đếm và audit. |
| Mô hình/tài liệu | `backend/src/models/BookCopy.js`, `backend/src/docs/openapi.yaml` | Siêu dữ liệu phiên bản và schema/lỗi API đã phê duyệt. |
| Kiểm thử backend | `backend/tests/inventoryRoutes.test.js`, tạo `backend/tests/helpers/inMemoryInventoryRepositories.js`, tạo `backend/tests/sql/inventoryConcurrency.sqltest.js` | Bằng chứng route, chuyển đổi, hoàn tác, ghi cũ, khóa/xung đột, phân trang và lộ dữ liệu. |
| Frontend | `frontend/src/page/InventoryPage.jsx`, `frontend/src/component/inventory/InventoryManagement.jsx`, `frontend/src/component/inventory/BookCopies.jsx`, `frontend/src/component/inventory/Filter.jsx`, `frontend/src/component/inventory/StatusBadge.jsx`, `frontend/src/api/libraryFeatureApi.js` | Tồn kho dựa trên máy chủ, truyền phiên bản, lý do, xác nhận và trạng thái chính tắc. |
| Kiểm thử frontend | `frontend/test/inventoryOperationalFrontend.test.js` | Thay các assertion về quyền sở hữu mock bằng assertion API/trạng thái v0.4.0. |

## 6. Giao diện đã phê duyệt

| Phương thức | Endpoint | Hành vi bắt buộc |
| --- | --- | --- |
| `GET` | `/api/inventory` | Thủ thư/Quản trị viên; bộ lọc được xác thực và phản hồi trang/số đếm xác định. |
| `GET` | `/api/book-copies/{copyId}` | Chi tiết bản sao an toàn được bảo vệ với tóm tắt sách liên quan và phiên bản. |
| `GET` | `/api/book-copies/barcode/{barcode}` | Tra cứu mã vạch được bảo vệ hoặc `404`. |
| `POST` | `/api/books/{bookId}/copies` | `AVAILABLE` do máy chủ kiểm soát; yêu cầu sách cha đang hoạt động và mã vạch duy nhất. |
| `PUT` | `/api/book-copies/{copyId}` | `If-Match` khớp; chỉ mã vạch/vị trí, không trạng thái. |
| `PATCH` | `/api/book-copies/{copyId}/status` | `If-Match` khớp; `{ status, reason }`; chỉ chuyển đổi FE06 được phê duyệt. |
| `DELETE` | `/api/book-copies/{copyId}` | `If-Match` khớp; `{ reason }`; chỉ ngừng kích hoạt mềm. |

Mọi phản hồi thay đổi bản sao hiện có đều gồm phiên bản opaque đã tăng. Phiên bản thiếu/cũ trả về `409 STALE_COPY_STATE` mà không thay đổi trạng thái hoặc audit.

## 7. Chiến lược triển khai theo thứ tự

### 7.1 Khóa v0.4.0 bằng kiểm thử RED

- Mở rộng kiểm thử route cho dạng phản hồi, từ chối phân trang, trường an toàn, sách cha không hoạt động, ký tự điều khiển trong vị trí, xác thực trạng thái/lý do, mã xung đột và ngừng kích hoạt idempotent.
- Thêm kiểm thử SQL cho hai phiên bản cạnh tranh, hoàn tác giao dịch và trạng thái mượn/đặt trước thay đổi giữa lượt đọc và thay đổi.
- Thay các kiểm thử frontend cố ý giữ quyền sở hữu mock.

### 7.2 Đối soát schema và primitive thay đổi

- Thêm SQL `rowversion` vào `BookCopies`, công khai phiên bản opaque và ghi lại thay đổi trong ADR/model/OpenAPI.
- Xây dựng một primitive thay đổi repository khóa `BookCopies`, so sánh phiên bản, sau đó khóa/kiểm tra lại `BorrowDetails` và `Reservations` theo thứ tự đã phê duyệt trước khi ghi trạng thái bản sao và audit.

### 7.3 Đối soát lượt đọc và xác thực

- Trả về item đã lọc và số đếm từ cùng một hợp đồng bộ lọc đã commit.
- Từ chối page/limit được cung cấp không hợp lệ mà không chuẩn hóa hoặc thực hiện truy vấn.
- Giữ tra cứu mã vạch có chỉ mục và phản hồi không chứa dữ liệu người dùng/phạt/audit không liên quan.
- Xác thực mã vạch, vị trí tùy chọn, trạng thái, lý do, ID và `If-Match` tại ranh giới.

### 7.4 Đối soát các lệnh tạo/siêu dữ liệu/trạng thái

- Chỉ tạo bản sao `AVAILABLE` dưới sách đang hoạt động; trạng thái ban đầu không do client kiểm soát.
- Cập nhật siêu dữ liệu chỉ thay đổi mã vạch/vị trí.
- Lệnh trạng thái thủ công tuân theo ma trận trạng thái chính xác và bảo vệ sách cha đang hoạt động cho các chuyển đổi sang `AVAILABLE`.
- Ngừng kích hoạt chỉ mềm; ngừng kích hoạt trùng lặp với phiên bản hiện tại trả về `changed = false` và không có audit chuyển đổi thứ hai.

### 7.5 Đối soát frontend và bằng chứng

- Tải dữ liệu tồn kho/bản sao thực và loại bỏ quyền sở hữu vận hành mock.
- Giữ phiên bản đã thấy gần nhất, gửi `If-Match`, yêu cầu lý do chuyển đổi và tải lại khi thành công/xung đột cũ.
- Giải thích xung đột do FE07/FE08 sở hữu mà không đưa ra cơ chế ghi đè bị cấm.
- Thêm thẻ `@spec` và bằng chứng tập trung trước cổng merge đầy đủ.

## 8. Thứ tự phụ thuộc

1. Kiểm thử RED route/SQL/frontend.
2. SQL rowversion, ADR/model và hợp đồng API.
3. Validator và đối soát phản hồi đọc.
4. Triển khai tạo/cập nhật/trạng thái/ngừng kích hoạt có giao dịch.
5. Frontend dựa trên máy chủ.
6. Truy vết, xác minh tập trung, sau đó rà soát của con người.

Hợp đồng khóa và trạng thái FE06 phải duy trì tương thích với giao dịch phê duyệt/trả FE07 và giữ/giải phóng FE08.

## 10. Phụ lục yêu cầu đang chờ của FE07

- Coi yêu cầu FE07 `PENDING + REQUESTED` là một yêu cầu quy trình, không phải
  `BookCopies.Status` mới.
- Khóa/kiểm tra lại yêu cầu đó trong cùng giao dịch thay đổi FE06 dùng cho các xung đột
  mượn và đặt trước đang hoạt động.
- Trả về `PENDING_BORROW_REQUEST_CONFLICT` và hướng dẫn nhân sự đến Quản lý yêu cầu;
  không bao giờ cung cấp ghi đè thủ công làm mất hiệu lực yêu cầu đang chờ của thành viên.
- Xác thực hành vi route, hồi quy đầy đủ, truy vết và rà soát của con người.

## 9. Cổng xác minh

| Cổng | Lệnh | Kết quả mong đợi |
| --- | --- | --- |
| Backend FE06 | `npm.cmd --prefix backend test -- --runTestsByPath tests/inventoryRoutes.test.js` | Các ca route, xác thực, chuyển đổi, phản hồi và RBAC đạt. |
| Đồng thời SQL FE06 | `npm.cmd --prefix backend test -- --runTestsByPath tests/sql/inventoryConcurrency.sqltest.js` | Các ca phiên bản cũ, khóa/kiểm tra lại, idempotent và hoàn tác đạt khi cấu hình SQL sẵn có. |
| Frontend FE06 | `node --test frontend/test/inventoryOperationalFrontend.test.js` | Các assertion dữ liệu dựa trên máy chủ, phiên bản, lý do và trạng thái xung đột đạt. |
| Truy vết | `npm.cmd run trace:enforce` | Các tệp triển khai FE06 thay đổi thỏa ngưỡng kho mã. |
| Vệ sinh diff | `git diff --check` | Không có lỗi khoảng trắng. |

## 10. Cổng rà soát của con người

- [x] Xác nhận mã hóa rowversion SQL và xử lý phản hồi/yêu cầu `If-Match`.
- [x] Xác nhận thứ tự khóa repository và kiểm tra xung đột trong cùng giao dịch khớp với FE07/FE08.
- [x] Xác nhận ngừng kích hoạt trùng lặp không ghi audit chuyển đổi thứ hai.
- [x] Xác nhận phản hồi FE06 loại trừ dữ liệu người mượn/chủ sở hữu đặt trước.
- [x] Phê duyệt thứ tự và ánh xạ `TASKS.md` trước khi triển khai bắt đầu.
