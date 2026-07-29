# CONTEXT.md - FE07 Quản lý mượn sách

# Phiên bản: 0.9.0

# Trạng thái: ĐÃ MERGE VÀO MAIN; CI HẬU MERGE ĐẠT; AZURE STAGING BỊ CHẶN DO AZURE SQL PAUSED/QUOTA

# Chủ sở hữu: Nhat

# Cập nhật lần cuối: 2026-07-29

# Thư mục tính năng: `.sdd/specs/feat-borrowing-management/`

---

## 1. Mục đích tính năng

Quản lý mượn sách dùng để kiểm soát sự di chuyển của các bản sao sách vật lý từ thư viện đến thành viên và trở lại thư viện.

Tính năng này phải giữ nhất quán ba yếu tố:

- Trạng thái mượn của thành viên.
- Trạng thái bản sao vật lý trong tồn kho.
- Lịch sử giao dịch được dùng sau này cho phạt, báo cáo và audit.

Vì mượn sách là trung tâm của hoạt động thư viện hằng ngày, tính năng này được xem là một tính năng Đặc tả đầy đủ.

---

## 2. Quy trình thực tế

Quy trình thư viện nhỏ/trung bình điển hình:

1. Thành viên muốn mượn một hoặc nhiều sách.
2. Hệ thống hoặc thủ thư kiểm tra thành viên có được phép mượn hay không.
3. Hệ thống kiểm tra từng bản sao vật lý được yêu cầu có khả dụng hay không.
4. Một yêu cầu mượn được tạo.
5. Thủ thư phê duyệt hoặc từ chối yêu cầu.
6. Khi phê duyệt, hệ thống ghi nhận siêu dữ liệu phê duyệt/mượn và hạn trả, đánh dấu bản sao là đã mượn, đồng thời hoàn tất bất kỳ lượt giữ chỗ đã thông báo thuộc người yêu cầu nào khớp một cách nguyên tử.
7. Sau đó, thành viên trả lại một hoặc nhiều bản sao.
8. Thủ thư ghi nhận tình trạng trả: bình thường, hỏng hoặc mất.
9. Hệ thống cập nhật trạng thái bản sao và công khai dữ liệu quá hạn/mất/hỏng cho Quản lý phạt.
10. Thành viên và thủ thư có thể xem lịch sử mượn.

---

## 3. Ranh giới tính năng

FE07 bao gồm:

- Tạo yêu cầu mượn.
- Phê duyệt/từ chối yêu cầu mượn.
- Xử lý bàn giao bản sao đã mượn.
- Xử lý trả sách.
- Gia hạn mục đã mượn.
- Xem lịch sử mượn của thành viên.
- Xem thông tin mượn dành cho thủ thư/quản trị viên.

FE07 không bao gồm:

- Quyền sở hữu hàng đợi đặt trước. Phần này thuộc FE08.
- Quyền sở hữu tính tiền phạt. Phần này thuộc FE09.
- Quyền sở hữu gửi thông báo. Phần này thuộc FE10.
- Quản lý tài khoản/vai trò người dùng. Phần này thuộc FE11.

---

## 4. Ghi chú về mô hình dữ liệu hiện tại

Tập lệnh SQL hiện tại bao gồm:

- `BorrowRequests(RequestId, UserId, RequestDate, Status)`
- `BorrowDetails(BorrowDetailId, RequestId, CopyId, DueDate, ReturnDate, Status)`
- `BookCopies(CopyId, BookId, Barcode, Status, Location)`
- `Fines(FineId, UserId, BorrowDetailId, Amount, Reason, Status, PaidAt)`
- `AuditLogs(LogId, UserId, Action, CreatedAt)`

Các điểm cần đối soát khi triển khai:

- Các mục đang chờ dùng `BorrowDetails.Status = REQUESTED`; không thêm bảng chi tiết yêu cầu riêng trong Giai đoạn 1.
- Lý do từ chối là bắt buộc trong siêu dữ liệu audit; FE07 không yêu cầu cột lý do từ chối mới trong `BorrowRequests`.
- Prototype/schema phải cung cấp hợp đồng số lần gia hạn đã phê duyệt, `CreatedBy`, `ApprovedAt`, `ApprovedBy` và `BorrowDate` theo từng chi tiết.
- Phê duyệt phải triển khai bảo vệ năm bản sao theo phạm vi thành viên và thứ tự khóa dùng chung từ `SPEC.md` v0.5.0.
- Ngày nghiệp vụ mượn, đến hạn, trả và quá hạn dùng `Asia/Ho_Chi_Minh`.

Các quyết định này được phản ánh trong `SPEC.md` v0.5.0 và phải được đối soát với triển khai hiện có trước khi FE07 có thể được xem là hoàn thành theo bản sửa đổi.

---

## 5. Ca sử dụng chính từ bảng phân công

| ID ca sử dụng | Tên ca sử dụng | Chủ sở hữu |
| ------------- | -------------- | ---------- |
| UC29 | Tạo yêu cầu mượn | Nhat |
| UC30 | Xem lịch sử mượn | Nhat |
| UC31 | Gia hạn sách đã mượn | Nhat |
| UC32 | Xử lý yêu cầu mượn | Nhat |
| UC33 | Xử lý yêu cầu trả | Nhat |
| UC34 | Xem thông tin mượn của thành viên | Nhat |
| UC35 | Phê duyệt yêu cầu mượn | Nhat |

## 6. Kiểm thử tính năng từ bảng phân công

| ID kiểm thử | Tên kiểm thử | Chủ sở hữu |
| ----------- | ------------ | ---------- |
| FT30 | Tạo yêu cầu mượn | Nhat |
| FT31 | Xem lịch sử mượn | Nhat |
| FT32 | Gia hạn sách đã mượn | Nhat |
| FT33 | Xử lý yêu cầu mượn | Nhat |
| FT34 | Xử lý yêu cầu trả | Nhat |
| FT35 | Xem thông tin mượn của thành viên | Nhat |
| FT36 | Phê duyệt yêu cầu mượn | Nhat |

---

## 7. Rủi ro chính

- Việc mượn có thể làm hỏng tồn kho nếu trạng thái bản sao không được cập nhật theo giao dịch.
- Việc mượn có thể làm hỏng logic phạt/báo cáo nếu hạn trả và ngày trả thiếu hoặc sai.
- Thành viên có thể mượn vượt giới hạn cho phép nếu các bản sao đang mượn không được đếm chính xác.
- Phê duyệt đồng thời có thể gán một bản sao vật lý cho nhiều thành viên nếu tính khả dụng không được kiểm tra lại tại thời điểm phê duyệt.
- Gia hạn có thể xung đột với đặt trước nếu thành viên khác đang chờ sách.

---

## 8. Phụ thuộc

| Phụ thuộc | Lý do quan trọng |
| ---------- | ---------------- |
| FE02 Xác thực | Xác định actor hiện tại. |
| FE04 Quản lý thành viên | Xác nhận người dùng có phải thành viên đã được phê duyệt hay không. |
| FE06 Quản lý tồn kho / bản sao sách | Sở hữu trạng thái bản sao vật lý. |
| FE08 Quản lý đặt trước | Sở hữu trạng thái hàng đợi/giữ chỗ; FE07 thực thi ưu tiên, kiểm tra xung đột gia hạn và hoàn tất lượt giữ chỗ đã thông báo khớp trong khi phê duyệt. |
| FE09 Quản lý phạt | Dùng dữ liệu quá hạn/trả và các khoản phạt dương chưa thanh toán chặn mượn/gia hạn. |
| FE10 Quản lý thông báo | Gửi thông báo kết quả mượn, trả và gia hạn. |
| FE11 Quản lý người dùng & vai trò | Cung cấp quyền theo vai trò. |

---

## 9. Câu hỏi đã được giải quyết cho nhóm / giảng viên

| ID | Câu hỏi | Chủ sở hữu | Trạng thái |
| -- | ------- | ---------- | ---------- |
| Q-FE07-001 | Số bản sao đang mượn tối đa cho mỗi thành viên? | Nhóm/Giảng viên | Đã giải quyết: 5 bản sao đang mượn cho mỗi thành viên (DEC-GEN-001). |
| Q-FE07-002 | Thời hạn mượn mặc định tính theo ngày? | Nhóm/Giảng viên | Đã giải quyết: 14 ngày dương lịch từ ngày phê duyệt mượn (DEC-GEN-002). |
| Q-FE07-003 | Giới hạn gia hạn cho mỗi bản sao đã mượn? | Nhóm/Giảng viên | Đã giải quyết: 1 lần gia hạn mỗi `BorrowDetail`, cộng 14 ngày dương lịch từ hạn trả hiện tại. |
| Q-FE07-004 | Khoản phạt chưa thanh toán có chặn mượn không? | Nhóm/Giảng viên | Đã giải quyết: bất kỳ khoản phạt `UNPAID` nào có số tiền lớn hơn 0 đều chặn mượn mới và gia hạn. |
| Q-FE07-005 | Thành viên tự tạo yêu cầu hay thủ thư tạo yêu cầu tại quầy? | Nhóm/Giảng viên | Đã giải quyết: thành viên tự tạo yêu cầu mượn; thủ thư/quản trị viên phê duyệt, từ chối, trả, gia hạn và xem lịch sử. |
| Q-FE07-009 | Lịch sử dùng `status?`, `fromDate?`, `toDate?`, `page?`, `limit?`; trang 1/giới hạn 20, tối đa 100, ngày nghiệp vụ bao gồm hai đầu, xác thực trước truy vấn và thứ tự BorrowDate/BorrowDetailId ổn định. | Chuẩn hóa đặc tả 2026-07-17 | ĐÃ PHÊ DUYỆT |
| Q-FE07-006 | Chi tiết yêu cầu đang chờ nên dùng trạng thái `REQUESTED` hay bảng khác? | Nhóm/Chủ sở hữu DB | Đã giải quyết: dùng `BorrowDetails.Status = REQUESTED`; không có bảng chi tiết yêu cầu bổ sung trong Giai đoạn 1. |
| Q-FE07-007 | Trạng thái yêu cầu có tự thành `COMPLETED` khi mọi chi tiết đã trả/mất/hỏng không? | Nhóm | Đã giải quyết: có, đánh dấu `BorrowRequests.Status = COMPLETED` khi mọi chi tiết ở trạng thái kết thúc. |
| Q-FE07-008 | Việc trả hỏng/mất có tạo bản ghi phạt ngay hay chỉ công khai dữ liệu cho FE09? | Nhóm/Giảng viên | Đã giải quyết: FE07 chỉ ghi nhận dữ liệu trả hỏng/mất; FE09 sở hữu việc tạo khoản phạt. |

---

## 10. Ghi chú cho việc triển khai sau này

- `SPEC.md` v0.5.0 của FE07 đã được rà soát bởi con người vào 2026-07-16 và sẵn sàng cho đối soát triển khai.
- `PLAN.md`, `TASKS.md`, mã và kiểm thử hiện có vẫn là bằng chứng lịch sử cho đến khi chúng được mở rộng cho các yêu cầu v0.5.0.
- Dùng các giao dịch và thứ tự khóa đã phê duyệt cho luồng phê duyệt và trả.
- Mọi endpoint API phải xác thực vai trò và đầu vào trên máy chủ.

## 11. Bối cảnh batch FE07-FE12 2026-07-29

- FE07 tiếp tục sở hữu transaction mượn/trả/gia hạn và sự kiện nguồn.
- FE10 chỉ nhận yêu cầu thông báo sau commit; lỗi thông báo không rollback FE07.
- FE07 chỉ công khai handoff hàng đợi chỉ đọc cho FE08; Librarian vẫn phải xác
  nhận xử lý thủ công.
- Timeline và blocker copy chỉ trình bày state/timestamp/error code chính tắc.
- Scope thuộc `SL-003`, phụ thuộc governance `SL-001` và template FE10 `SL-002`.
