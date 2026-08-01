# CONTEXT.md - FE08 Quản lý đặt chỗ

# Phiên bản: 0.6.0

# Trạng thái: HOÀN THÀNH; PR #89 ĐÃ HỢP NHẤT; CI VÀ AZURE ĐÃ CHẠY THÀNH CÔNG TRÊN ĐÚNG COMMIT

# Chủ sở hữu: Nhat

# Cập nhật lần cuối: 2026-08-01

# Thư mục tính năng: `.sdd/specs/feat-reservation-management/`

---

## 1. Mục đích tính năng

Quản lý đặt chỗ cho phép thành viên chờ các sách không khả dụng theo thứ tự công bằng, có thể truy vết.

Tính năng ngăn các danh sách chờ thủ công tùy tiện và giúp thủ thư biết ai cần được thông báo trước khi một bản sao trở nên khả dụng.

---

## 2. Quy trình thực tế

1. Thành viên muốn một sách hiện không khả dụng.
2. Thành viên tạo một lượt đặt chỗ.
3. Hệ thống đưa lượt đặt chỗ vào hàng đợi.
4. Một bản sao sau đó trở nên khả dụng, thường sau khi trả.
5. Thủ thư/quản trị viên chọn thủ công lượt đặt chỗ hợp lệ tiếp theo cho một bản sao khả dụng cụ thể.
6. Hệ thống kích hoạt yêu cầu thông báo sách khả dụng.
7. Thành viên mượn sách trong thời gian cho phép hoặc lượt đặt chỗ hết hạn/hủy.

---

## 3. Ranh giới tính năng

FE08 bao gồm:

- Đặt chỗ sách.
- Tìm kiếm và chọn bản sao vật lý có thể đặt chỗ theo cách an toàn cho Thành viên.
- Hủy đặt chỗ.
- Xem danh sách đặt chỗ.
- Xử lý hàng đợi đặt chỗ.
- Kích hoạt yêu cầu thông báo sách khả dụng.

FE08 không bao gồm:

- Triển khai phê duyệt mượn/trả. Phần này thuộc FE07.
- Triển khai giao thông báo. Phần này thuộc FE10.
- Tính tiền phạt. Phần này thuộc FE09.
- Đặt chỗ ngồi học. Phần này ngoài phạm vi.

---

## 4. Ghi chú về mô hình dữ liệu hiện tại

Tập lệnh SQL hiện tại có:

- `Reservations(ReservationId, UserId, CopyId, ReservedAt, Status)`
- `BookCopies(CopyId, BookId, Barcode, Status, Location)`

Vấn đề tiềm năng cần rà soát:

- Giai đoạn 1 cố ý đặt chỗ theo `CopyId` vật lý; đặt chỗ ở cấp sách được hoãn lại.
- Schema hiện tại có `QueuePosition`, `ExpiresAt`, `NotifiedAt`, `CancelledAt` và `Status`; dấu thời gian thông báo/hết hạn vẫn là lịch sử bất biến sau chuyển đổi kết thúc, `CancelledAt` chỉ dành cho hủy và hoàn tất dùng `Status = FULFILLED` không có trường `FulfilledAt` riêng.
- Schema hiện tại không có trường lý do hủy.

---

## 5. Ca sử dụng chính từ bảng phân công

| ID ca sử dụng | Tên ca sử dụng | Chủ sở hữu |
| ------------- | -------------- | ---------- |
| UC36 | Đặt chỗ sách | Nhat |
| UC37 | Hủy đặt chỗ | Nhat |
| UC38 | Xem danh sách đặt chỗ | Nhat |
| UC39 | Xử lý hàng đợi đặt chỗ | Nhat |
| UC40 | Kích hoạt thông báo sách khả dụng | Nhat |

## 6. Kiểm thử tính năng từ bảng phân công

| ID kiểm thử | Tên kiểm thử | Chủ sở hữu |
| ----------- | ------------ | ---------- |
| FT37 | Đặt chỗ sách | Nhat |
| FT38 | Hủy đặt chỗ | Nhat |
| FT39 | Xem danh sách đặt chỗ | Nhat |
| FT40 | Xử lý hàng đợi đặt chỗ | Nhat |
| FT41 | Kích hoạt thông báo sách khả dụng | Nhat |

---

## 7. Rủi ro chính

- Thứ tự hàng đợi có thể trở nên không công bằng nếu thứ tự đặt chỗ không rõ ràng.
- Đặt chỗ ở cấp bản sao là ràng buộc có chủ ý của Giai đoạn 1; đặt bất kỳ bản sao nào của một sách được hoãn lại.
- Bản sao được giữ được bảo vệ bởi kiểm tra ưu tiên FE07 và chỉ chủ sở hữu đặt chỗ đã thông báo mới có thể mượn.
- Gia hạn trong FE07 có thể xung đột với đặt chỗ đang hoạt động nếu chính sách không được xác định.
- Lỗi thông báo có thể khiến thành viên không biết sách đã khả dụng.

---

## 8. Phụ thuộc

| Phụ thuộc | Lý do quan trọng |
| ---------- | ---------------- |
| FE02 Xác thực | Xác định tác nhân hiện tại. |
| FE04 Quản lý thành viên | Xác nhận thành viên có đủ điều kiện đặt chỗ hay không. |
| FE06 Quản lý tồn kho / bản sao sách | Cung cấp trạng thái bản sao sách. |
| FE07 Quản lý mượn sách | Luồng trả có thể giải phóng bản sao vào hàng đợi đặt chỗ. |
| FE10 Quản lý thông báo | Gửi thông báo sách khả dụng. |
| FE11 Quản lý người dùng & vai trò | Cung cấp quyền theo vai trò. |

---

## 9. Câu hỏi đã được giải quyết cho nhóm / giảng viên

| ID | Quyết định đã phê duyệt | Nguồn | Trạng thái |
| -- | ----------------------- | ------ | ---------- |
| Q-FE08-001 | Lượt đặt chỗ nhắm tới CopyId bản sao vật lý trong Giai đoạn 1. | Gói rà soát 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE08-002 | Thành viên không thể đặt chỗ khi một bản sao hiện đang khả dụng. | Gói rà soát 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE08-003 | Tối đa 3 lượt đặt chỗ đang hoạt động cho mỗi thành viên. | Gói rà soát 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE08-004 | Lượt đặt chỗ đã thông báo giữ hiệu lực trong 2 ngày dương lịch. | Gói rà soát 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE08-005 | Xử lý hàng đợi do thủ thư thực hiện thủ công trong Giai đoạn 1; kích hoạt tự động là công việc tương lai. | Gói rà soát 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE08-006 | Lượt đặt chỗ đang hoạt động không đủ điều kiện bị bỏ qua trong lần chạy hiện tại và vẫn hoạt động để thử lại thủ công sau. | Rà soát chuẩn hóa Nhat 2026-07-17 | ĐÃ PHÊ DUYỆT |
| Q-FE08-007 | Không có mục hàng đợi hợp lệ thì không chọn gì và giữ trạng thái bản sao/đặt chỗ không đổi. | Rà soát chuẩn hóa Nhat 2026-07-17 | ĐÃ PHÊ DUYỆT |
| Q-FE08-008 | Lỗi thông báo FE10 giữ lượt đặt chỗ đã commit và ghi kiểm toán thất bại; không có tiến trình xử lý nền thử lại tự động trong Giai đoạn 1. | Rà soát chuẩn hóa Nhat 2026-07-17 | ĐÃ PHÊ DUYỆT |
| Q-FE08-009 | Dấu thời gian thông báo/hết hạn tồn tại qua chuyển đổi kết thúc; chỉ hàng đã hủy có `CancelledAt`. | Chuẩn hóa đặc tả 2026-07-17 | ĐÃ PHÊ DUYỆT |
| Q-FE08-011 | Phương án A: API danh sách bản sao có thể đặt chỗ được bảo vệ và chỉ dành cho Thành viên trả về bảy trường an toàn cho mỗi bản sao `BORROWED`/`RESERVED` của sách đang hoạt động, gồm `hasActiveReservation` theo phạm vi Thành viên; máy chủ xử lý tìm kiếm và phân trang, bản sao đã đặt chỗ vẫn hiển thị nhưng thao tác trùng lặp bị vô hiệu hóa và `POST /api/reservations { copyId }` vẫn là API chính thức. | Phê duyệt thiết kế FE08 2026-07-19; làm rõ UI thành viên 2026-07-21 | ĐÃ PHÊ DUYỆT |

---

## 10. Ghi chú cho việc triển khai sau này

- `SPEC.md` v0.4.4 đã được phê duyệt làm mốc cơ sở; vòng đời chuẩn và phạm vi triển khai danh sách bản sao có thể đặt chỗ an toàn cho Thành viên đã được kiểm tra tự động, còn chờ rà soát tích hợp của con người.
- `PLAN.md` và `TASKS.md` ghi riêng phạm vi triển khai B7 lịch sử với các tác vụ đối soát v0.4.3/v0.4.4.
- Xử lý hàng đợi nên theo giao dịch.
- Thành viên không bao giờ được hủy đặt chỗ của thành viên khác.

## 11. Bối cảnh đợt FE07-FE12 2026-07-29

- FE08 tiếp tục chịu trách nhiệm cho FIFO, lượt đặt chỗ, hết hạn và trạng thái đặt chỗ.
- FE07 chỉ điều hướng nhân viên tới giao diện quyết định; không tự thay đổi dữ liệu FE08.
- Nút hành động mượn bản sao đang được giữ chỉ dành cho chủ sở hữu `NOTIFIED`
  và chỉ truyền `copyId`.
- FE10 chạy sau khi commit; lỗi được trả về dưới dạng cảnh báo an toàn và không
  hoàn tác trạng thái giữ bản sao.
- Phạm vi thuộc `SL-004`, phụ thuộc `SL-001`, `SL-002` và bàn giao `SL-003`.
