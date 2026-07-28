# CONTEXT.md - FE09 Quản lý tiền phạt

# Phiên bản: 0.2.0

# Trạng thái: ĐÃ PHÊ DUYỆT - MỐC CƠ SỞ 2026-07-17

# Chủ sở hữu: Dung

# Cập nhật lần cuối: 2026-07-17

# Thư mục tính năng: `.sdd/specs/feat-fine-management/`

---

## 1. Mục đích tính năng

Quản lý tiền phạt dùng để tính và theo dõi khoản phạt cho các kết quả mượn quá hạn, mất, hỏng hoặc vi phạm chính sách khác.

Tính năng này phải giữ nhất quán ba yếu tố:

- Việc tính tiền phạt phải có thể truy vết và kiểm thử.
- Trạng thái thanh toán/thu tiền phạt phải được ghi rõ ràng.
- Quy trình mượn và tồn kho vẫn do FE07 và FE06 sở hữu.

FE09 là tính năng Đặc tả đầy đủ vì tính sai tiền phạt ảnh hưởng điều kiện hợp lệ thành viên, hồ sơ tài chính, hạn chế mượn và báo cáo.

---

## 2. Quy trình thực tế

Quy trình phạt điển hình:

1. FE07 xác định bản sao đã trả hoặc đang mượn bị quá hạn, mất hoặc hỏng.
2. FE09 tính số tiền phạt theo chính sách đã phê duyệt.
3. FE09 tạo hoặc cập nhật bản ghi phạt.
4. Thành viên hoặc thủ thư xem thông tin phạt.
5. Thủ thư ghi nhận thu tiền phạt nếu tiền được thu ngoại tuyến.
6. Thủ thư/quản trị viên đánh dấu khoản phạt là đã thanh toán khi việc thu hoàn tất.
7. FE10 có thể thông báo thành viên về thông tin quá hạn/phạt.
8. FE07 có thể đọc trạng thái phạt chưa thanh toán để quyết định điều kiện mượn.

---

## 3. Ranh giới tính năng

FE09 bao gồm:

- Xem thông tin phạt.
- Tính phạt quá hạn.
- Ghi nhận thu tiền phạt.
- Đánh dấu tiền phạt đã thanh toán.
- Lưu lý do, số tiền, trạng thái và dấu thời gian thanh toán phạt.

FE09 không bao gồm:

- Phê duyệt mượn/trả và gán hạn trả. Phần này thuộc FE07.
- Quản lý trạng thái bản sao vật lý. Phần này thuộc FE06.
- Cổng thanh toán trực tuyến. Ngoài phạm vi giai đoạn dự án này.
- Gửi thông báo. Phần này thuộc FE10.
- Dashboard báo cáo. Phần này thuộc FE12, dù FE12 đọc dữ liệu phạt.

---

## 4. Ghi chú về mô hình dữ liệu hiện tại

Tập lệnh SQL hiện tại bao gồm:

- `Fines(FineId, UserId, BorrowDetailId, OverdueDays, RatePerDay, Amount, PaidAmount, Reason, Status, CalculatedAt, PaidAt, CreatedBy, CollectedBy, PaymentMethod, CreatedAt, UpdatedAt)`
- `BorrowDetails(BorrowDetailId, RequestId, CopyId, DueDate, ReturnDate, Status)`
- `BorrowRequests(RequestId, UserId, RequestDate, Status)`
- `BookCopies(CopyId, BookId, Barcode, Status, Location)`
- `Users(UserId, Username, Email, Phone, Status, CreatedAt)`

Các quyết định mốc cơ sở dự án gồm:

- Phạt quá hạn là 5.000 VND cho mỗi ngày quá hạn trên mỗi bản sao.
- Tiền phạt bắt đầu từ ngày sau hạn trả.
- Thời hạn mượn mặc định là 14 ngày dương lịch, do FE07 sở hữu.
- Thành viên có bất kỳ khoản phạt `UNPAID` nào có số tiền lớn hơn 0 bị hạn chế mượn mới và gia hạn trong FE07.

Các vấn đề tiềm năng cần rà soát:

- SQL hiện tại lưu `PaidAmount`, `CollectedBy` và `PaymentMethod`; không có cột ghi chú thu tiền riêng.
- SQL hiện tại không xác định chính sách phạt hỏng/mất.
- SQL hiện tại không ngăn bản ghi phạt trùng lặp cho cùng chi tiết mượn.
- Nguồn ngày tính phạt là ngày nghiệp vụ máy chủ trong `Asia/Ho_Chi_Minh`, không phải input client.
- Giá trị trạng thái là `UNPAID`, `PAID`, `WAIVED` và `CANCELLED`; mọi trạng thái trừ `UNPAID` là kết thúc.
- Giai đoạn 1 không có thanh toán một phần: thu ngoại tuyến đầy đủ đặt `PaidAmount = Amount`, `CollectedBy`, `PaymentMethod`, `PaidAt` và `Status = PAID` nguyên tử.
- Ghi chú thu tiền là siêu dữ liệu audit vì schema hiện tại không có cột ghi chú thu tiền.

Các quyết định này được chốt trong SPEC v0.4.0 và phải được đối soát với prototype phía máy chủ hiện có trước khi triển khai được xem là hoàn thành.

---

## 5. Ca sử dụng chính từ bảng phân công

Cột chủ sở hữu phản ánh việc phân công lại hiện tại của nhóm.

| ID ca sử dụng | Tên ca sử dụng | Chủ sở hữu |
| ------------- | -------------- | ---------- |
| UC41 | Xem thông tin phạt | Dung |
| UC42 | Tính tiền phạt | Dung |
| UC43 | Ghi nhận thu tiền phạt | Dung |
| UC44 | Đánh dấu tiền phạt đã thanh toán | Dung |

---

## 6. Kiểm thử tính năng từ bảng phân công

Cột chủ sở hữu phản ánh việc phân công lại hiện tại của nhóm.

| ID kiểm thử | Tên kiểm thử | Chủ sở hữu |
| ----------- | ------------ | ---------- |
| FT42 | Xem thông tin phạt | Dung |
| FT43 | Tính tiền phạt | Dung |
| FT44 | Ghi nhận thu tiền phạt | Dung |
| FT45 | Đánh dấu tiền phạt đã thanh toán | Dung |

---

## 7. Rủi ro chính

- Số tiền phạt có thể sai nếu số ngày quá hạn được tính không chính xác.
- Bản ghi phạt trùng lặp có thể khiến thành viên bị tính hai lần cho cùng chi tiết mượn.
- Thu tiền có thể được ghi mà không có ủy quyền phù hợp.
- Trạng thái chưa thanh toán/đã thanh toán có thể không nhất quán nếu thu tiền và đánh dấu đã thanh toán tách biệt.
- Ngày hoặc số tiền do client cung cấp có thể cho phép giả mạo.
- Thiếu dữ liệu phạt có thể khiến FE07 cho phép mượn khi phạt chưa thanh toán lẽ ra phải chặn.

---

## 8. Phụ thuộc

| Phụ thuộc | Lý do quan trọng |
| ---------- | ---------------- |
| FE07 Quản lý mượn sách | Cung cấp hạn trả, ngày trả, trạng thái chi tiết mượn và dữ liệu mượn thành viên. |
| FE06 Quản lý tồn kho / bản sao sách | Cung cấp tình trạng/trạng thái bản sao cho ca mất hoặc hỏng. |
| FE10 Quản lý thông báo | Gửi thông báo quá hạn/phạt khi được yêu cầu. |
| FE11 Quản lý người dùng & vai trò | Cung cấp quyền thủ thư/quản trị viên cho thu tiền và trạng thái đã thanh toán. |
| FE12 Báo cáo & thống kê | Đọc dữ liệu phạt cho báo cáo. |
| Cơ sở dữ liệu SQL Server | Lưu dữ liệu phạt và mượn. |

---

## 9. Câu hỏi đã được giải quyết cho nhóm / giảng viên

| ID | Quyết định đã phê duyệt | Nguồn | Trạng thái |
| -- | ----------------------- | ------ | ---------- |
| Q-FE09-001 | Giai đoạn 1 chỉ hỗ trợ phạt quá hạn; phạt mất/hỏng ngoài phạm vi. | Gói rà soát 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE09-002 | Bất kỳ khoản phạt UNPAID nào có số tiền lớn hơn 0 đều chặn mượn mới và gia hạn. | Gói rà soát 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE09-003 | Không có thanh toán một phần trong Giai đoạn 1. | Gói rà soát 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE09-004 | Lưu ID người thu và ghi chú cùng bản ghi/bảng thanh toán phạt nếu theo dõi thanh toán tồn tại; nếu không thì lưu trên bản ghi phạt trong Giai đoạn 1. | Gói rà soát 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE09-005 | Quản trị viên có thể miễn/hủy phạt với lý do và audit log bắt buộc. | Gói rà soát 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE09-006 | Tính phạt chạy khi trả và có thể chạy thủ công bởi thủ thư/quản trị viên; job hằng ngày là công việc tương lai. | Gói rà soát 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE09-007 | UI prototype có thể lưu bản ghi phạt cục bộ để liên tục demo, nhưng hành vi FE09 cuối phải dùng tính toán và lưu phía máy chủ. | Sửa đổi người dùng 2026-06-21 | ĐÃ PHÊ DUYỆT |
| Q-FE09-008 | Thu tiền phạt thủ thư Giai đoạn 1 giải quyết trực tiếp phạt quá hạn đã thanh toán ngoại tuyến đầy đủ; không cần bước thanh toán một phần hoặc xác nhận/từ chối quản trị. | Sửa đổi người dùng 2026-06-30 | ĐÃ PHÊ DUYỆT |
| Q-FE09-009 | Danh sách phạt thủ thư mặc định theo thứ tự FineId tăng dần ổn định. | Sửa đổi người dùng 2026-06-30 | ĐÃ PHÊ DUYỆT |
| Q-FE09-010 | Tính ngày quá hạn dùng ngày nghiệp vụ máy chủ hiện tại trong `Asia/Ho_Chi_Minh`. | Rà soát chuẩn hóa Nhat 2026-07-17 | ĐÃ PHÊ DUYỆT |

---

## 10. Ghi chú cho việc triển khai sau này

- `SPEC.md` v0.4.0 được phê duyệt làm mốc cơ sở; triển khai phải theo kế hoạch/tác vụ đã đối soát và vẫn đang chờ.
- Dùng ngày nghiệp vụ máy chủ `Asia/Ho_Chi_Minh` cho tính toán.
- Không tin số tiền hoặc giá trị ngày quá hạn do client cung cấp.
- Tránh phạt đang hoạt động trùng lặp cho cùng chi tiết mượn và lý do dưới khóa cơ sở dữ liệu.
- Chỉ ghi nhận thu ngoại tuyến đầy đủ; thanh toán một phần không phải trạng thái Giai đoạn 1.
- Giữ thanh toán trực tuyến ngoài phạm vi.
