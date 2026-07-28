# CONTEXT.md - FE06 Quản lý tồn kho / bản sao sách

# Phiên bản: 0.2.1

# Trạng thái: ĐÃ PHÊ DUYỆT - MỐC CƠ SỞ 2026-07-17

# Chủ sở hữu: Dat

# Cập nhật lần cuối: 2026-07-19

# Thư mục tính năng: `.sdd/specs/feat-inventory-book-copy/`

---

## 1. Mục đích tính năng

Quản lý tồn kho / bản sao sách dùng để theo dõi các bản sao vật lý của từng sách và khả năng sẵn sàng cho việc mượn và đặt trước.

Tính năng này phải giữ tách biệt ba cấp độ:

- FE05 sở hữu siêu dữ liệu danh mục ở cấp sách như tiêu đề, ISBN, tác giả, danh mục, nhà xuất bản và mô tả.
- FE06 sở hữu dữ liệu tồn kho ở cấp bản sao như mã vạch, vị trí, trạng thái vật lý và tính khả dụng.
- FE07/FE08 sử dụng và cập nhật trạng thái bản sao thông qua quy trình mượn và đặt trước.

FE06 là tính năng Đặc tả đầy đủ vì trạng thái bản sao sai có thể trực tiếp làm hỏng việc mượn, đặt trước, phạt và báo cáo.

---

## 2. Quy trình thực tế

Quy trình tồn kho điển hình:

1. Thủ thư xem tồn kho của một sách hoặc toàn bộ thư viện.
2. Hệ thống hiển thị các bản sao vật lý, mã vạch, vị trí và trạng thái.
3. Thủ thư kiểm tra trạng thái của một bản sao.
4. Thủ thư cập nhật trạng thái bản sao khi bản sao đổi trạng thái ngoài luồng mượn/trả thông thường.
5. Thủ thư/quản trị viên thêm, cập nhật hoặc ngừng kích hoạt các bản sao vật lý.
6. FE07 và FE08 dùng trạng thái bản sao để quyết định bản sao có thể được mượn hoặc đặt trước hay không.

---

## 3. Ranh giới tính năng

FE06 bao gồm:

- Xem tồn kho.
- Kiểm tra trạng thái bản sao sách.
- Cập nhật tính khả dụng/trạng thái bản sao sách.
- Quản lý các bản sao sách vật lý.
- Theo dõi mã vạch và giá/khu vực cho từng bản sao.

FE06 không bao gồm:

- Tạo hoặc chỉnh sửa siêu dữ liệu sách. Phần này thuộc FE05.
- Phê duyệt yêu cầu mượn hoặc xử lý trả sách. Phần này thuộc FE07.
- Xử lý hàng đợi đặt trước. Phần này thuộc FE08.
- Tính tiền phạt cho bản sao hỏng/mất/quá hạn. Phần này thuộc FE09.
- Duyệt danh mục công khai. Phần này thuộc FE01.

---

## 4. Ghi chú về mô hình dữ liệu hiện tại

Tập lệnh SQL hiện tại bao gồm:

- `Books(BookId, Title, ISBN, CategoryId, AuthorId, PublisherId, PublishYear, Description, CoverUrl, Status)`
- `BookCopies(CopyId, BookId, Barcode, Status, Location, Version, CreatedAt, UpdatedAt)`
- `BorrowDetails(BorrowDetailId, RequestId, CopyId, DueDate, ReturnDate, Status)`
- `Reservations(ReservationId, UserId, CopyId, ReservedAt, Status)`

Các điểm cần đối soát khi triển khai:

- Giá trị trạng thái bản sao được chuẩn hóa trên FE06, FE07 và FE08.
- SQL hiện tại có `CreatedAt`/`UpdatedAt`; FE06 bổ sung yêu cầu SQL `rowversion` để kiểm soát đồng thời `If-Match` một cách xác định.
- Tính duy nhất của mã vạch được xác định trong SQL và phải được giữ nguyên.
- Các cập nhật trạng thái thủ công trực tiếp không được xung đột với bản ghi mượn/đặt trước đang hoạt động.
- Tính khả dụng hiệu lực được suy ra từ `BookCopies.Status = AVAILABLE` cùng `Books.Status = ACTIVE` của sách cha; FE05/FE01 không bao giờ thay đổi trạng thái bản sao.
- Việc giải phóng đặt trước thủ công luôn bị từ chối với `RESERVATION_STATE_CONFLICT`; việc xác thực vị trí từ chối các giá trị không hợp lệ thay vì chuẩn hóa chúng.

Các quyết định này được phản ánh trong `SPEC.md` v0.4.2 và đã được triển khai với bằng chứng tự động; xác nhận chủ sở hữu liên tính năng và tích hợp cuối cùng vẫn đang mở.

---

## 5. Ca sử dụng chính từ bảng phân công

Cột chủ sở hữu phản ánh việc phân công lại hiện tại của nhóm.

| ID ca sử dụng | Tên ca sử dụng | Chủ sở hữu |
| ------------- | -------------- | ---------- |
| UC25 | Xem tồn kho | Dat |
| UC26 | Kiểm tra trạng thái bản sao sách | Dat |
| UC27 | Cập nhật tính khả dụng của bản sao sách | Dat |
| UC28 | Quản lý bản sao sách | Dat |

---

## 6. Kiểm thử tính năng từ bảng phân công

Cột chủ sở hữu phản ánh việc phân công lại hiện tại của nhóm.

| ID kiểm thử | Tên kiểm thử | Chủ sở hữu |
| ----------- | ------------ | ---------- |
| FT26 | Xem tồn kho | Dat |
| FT27 | Kiểm tra trạng thái bản sao sách | Dat |
| FT28 | Cập nhật tính khả dụng của bản sao sách | Dat |
| FT29 | Quản lý bản sao sách | Dat |

---

## 7. Rủi ro chính

- Trạng thái bản sao không đúng có thể cho phép cùng một bản sao được mượn hai lần.
- Cập nhật tính khả dụng thủ công có thể ghi đè trạng thái mượn hoặc đặt trước đang hoạt động.
- Giá trị mã vạch trùng lặp có thể làm hỏng việc định danh bản sao.
- Bản sao mất/hỏng/ngừng kích hoạt vẫn có thể hiển thị là khả dụng nếu quy tắc trạng thái không rõ ràng.
- Tổng tồn kho có thể không nhất quán với báo cáo ở cấp sách nếu số đếm suy ra sai.

---

## 8. Phụ thuộc

| Phụ thuộc | Lý do quan trọng |
| ---------- | ---------------- |
| FE05 Quản lý sách | Cung cấp bản ghi sách mà các bản sao thuộc về. |
| FE07 Quản lý mượn sách | Cập nhật trạng thái bản sao trong quy trình mượn và trả. |
| FE08 Quản lý đặt trước | Sử dụng/đặt trước bản sao và có thể đặt trạng thái đã đặt trước. |
| FE09 Quản lý phạt | Có thể dùng dữ liệu bản sao hỏng/mất/quá hạn để tạo khoản phạt. |
| FE11 Quản lý người dùng & vai trò | Cung cấp quyền của thủ thư/quản trị viên. |
| Cơ sở dữ liệu SQL Server | Lưu trữ bản sao sách và các giao dịch bản sao liên quan. |

---

## 9. Câu hỏi đã được giải quyết cho nhóm / giảng viên

| ID | Quyết định đã phê duyệt | Nguồn | Trạng thái |
| -- | ----------------------- | ------ | ---------- |
| Q-FE06-001 | Trạng thái bản sao được phép: AVAILABLE, BORROWED, RESERVED, DAMAGED, LOST, INACTIVE. | Gói rà soát 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE06-002 | Nhân sự không thể đặt thủ công BORROWED hoặc RESERVED; các trạng thái này chỉ đến từ luồng FE07/FE08. | Gói rà soát 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE06-003 | DELETE /api/book-copies/{id} ngừng kích hoạt thay vì xóa vật lý. | Gói rà soát 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE06-004 | Vị trí là tùy chọn trong Giai đoạn 1. | Gói rà soát 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE06-005 | Tình trạng bản sao không tách riêng khỏi trạng thái trong Giai đoạn 1. | Gói rà soát 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE06-006 | Các thao tác tạo/cập nhật/ngừng kích hoạt/thay đổi trạng thái ghi vào AuditLogs. | Gói rà soát 2026-06-10 | ĐÃ PHÊ DUYỆT |

---

## 10. Ghi chú cho việc triển khai sau này

- Backend/kiểm thử FE06 hiện có là các hiện vật prototype và chỉ được đối soát sau khi bản sửa đổi v0.4.0 được rà soát.
- `PLAN.md` và `TASKS.md` giữ trạng thái `NOT STARTED` cho đến khi hợp đồng đã sửa đổi được phê duyệt và phân rã.
- Tính duy nhất của mã vạch phải được thực thi.
- Chuyển trạng thái phải được kiểm tra với các bản ghi hoạt động của FE07 và FE08.
- Tính khả dụng nên được suy ra từ trạng thái bản sao, không được đoán trong UI.
