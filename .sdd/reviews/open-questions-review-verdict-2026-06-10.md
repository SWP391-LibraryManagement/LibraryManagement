# Kết luận rà soát đặc tả - Giải quyết câu hỏi mở

Ngày: 2026-06-10
Người rà soát: Claude
Trạng thái: ĐỀ XUẤT ĐỂ NHÓM PHÊ DUYỆT
Gói đầu vào: `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`
Giới hạn: Tệp này chỉ ghi đề xuất rà soát. Tệp này không thay thế phê duyệt của nhóm.

## Kết luận điều hành

Các quyết định đề xuất trong gói giải quyết nhất quán nội bộ với:

- `.sdd/constitution.md`
- `.sdd/shared_context.md`
- `.sdd/constraints/global.md`
- `.sdd/constraints/business.md`
- `.sdd/constraints/safety.md`
- `.agents/AGENTS.md`
- Các nguyên tắc cẩm nang từ PDF SDD/ADD

Kết quả rà soát:

- `APPROVE AS PROPOSED` cho phần lớn quyết định.
- `APPROVE WITH NOTE` cho các quyết định có thể chấp nhận ở Giai đoạn 1 nhưng cần được viết cẩn thận trong `SPEC.md` liên quan.
- `KEEP TEAM DECISION` cho các hạng mục phụ thuộc vào ưu tiên dự án, ràng buộc bài tập hoặc năng lực bàn giao của nhóm.

---

## 1. Kết luận rà soát liên tính năng

| ID | Kết luận rà soát | Ghi chú |
| --- | --- | --- |
| X-001 | APPROVE AS PROPOSED | Ranh giới tốt. Ngăn chồng lấn FE01/FE05. |
| X-002 | APPROVE AS PROPOSED | Phân tách tốt: quyền sở hữu nghiệp vụ ở FE02/FE11, hỗ trợ gửi ở FE10. |
| X-003 | APPROVE AS PROPOSED | Phân chia quyền sở hữu rõ ràng giữa FE03, FE11, FE02. |
| X-004 | APPROVE AS PROPOSED | Giữ quy trình thành viên tách biệt với quản lý vai trò. |
| X-005 | APPROVE AS PROPOSED | Bắt buộc để ngăn chuyển đổi bản sao không hợp lệ và mượn trùng. |
| X-006 | APPROVE AS PROPOSED | Khớp ngữ cảnh dùng chung và giữ phạm vi Giai đoạn 1 được kiểm soát. |
| X-007 | APPROVE AS PROPOSED | Nhất quán với quy tắc gia hạn FE07 đã giải quyết. |
| X-008 | APPROVE WITH NOTE | Ghi rõ kích hoạt nhắc nhở là thủ công, bộ lập lịch hay cả hai trong từng đặc tả bị ảnh hưởng. |
| X-009 | APPROVE AS PROPOSED | Cần thiết cho tính nhất quán báo cáo FE12. |

---

## 2. Kết luận rà soát cấp tính năng

### FE01 Công khai / Duyệt

| Câu hỏi | Kết luận rà soát | Ghi chú |
| --- | --- | --- |
| Q-FE01-001 | APPROVE AS PROPOSED | Công chúng không nên thấy sách không hoạt động. |
| Q-FE01-002 | APPROVE AS PROPOSED | Khả dụng đơn giản là đủ cho Giai đoạn 1. |
| Q-FE01-003 | APPROVE AS PROPOSED | Tập bộ lọc tối thiểu tốt. |
| Q-FE01-004 | APPROVE WITH NOTE | Có thể chấp nhận nếu ISBN được xem là siêu dữ liệu thư mục, không phải dữ liệu nhạy cảm. |
| Q-FE01-005 | APPROVE AS PROPOSED | Giữ phạm vi nhỏ và có thể kiểm thử. |

### FE02 Xác thực

| Câu hỏi | Kết luận rà soát | Ghi chú |
| --- | --- | --- |
| Q-FE02-001 | APPROVE AS PROPOSED | Đáp ứng bảo mật đường cơ sở mà không thiết kế quá mức. |
| Q-FE02-002 | KEEP TEAM DECISION | 15m/7d là hợp lý nhưng nhóm có thể muốn thời hạn khác. |
| Q-FE02-003 | APPROVE WITH NOTE | Nếu email giả lập FE10 chưa sẵn sàng, đánh dấu xác minh là đã lập kế hoạch/giả lập, không âm thầm loại bỏ. |
| Q-FE02-004 | APPROVE AS PROPOSED | Phù hợp cho Giai đoạn 1. |
| Q-FE02-005 | APPROVE WITH NOTE | Đặc tả nên định nghĩa giới hạn đơn giản có thể đo, không phải giới hạn tốc độ mơ hồ. |
| Q-FE02-006 | APPROVE AS PROPOSED | 15 phút là hợp lý. |
| Q-FE02-007 | APPROVE AS PROPOSED | Tốt cho khả năng kiểm toán. |
| Q-FE02-008 | APPROVE AS PROPOSED | Rõ ràng và đơn giản. |
| Q-FE02-009 | APPROVE AS PROPOSED | Khớp ngăn xếp hiện tại và mẫu backend phổ biến. |
| Q-FE02-010 | APPROVE AS PROPOSED | Thỏa hiệp tốt cho Giai đoạn 1. |

### FE03 Hồ sơ Người dùng

| Câu hỏi | Kết luận rà soát | Ghi chú |
| --- | --- | --- |
| Q-FE03-001 | APPROVE AS PROPOSED | Nhất quán với quyền sở hữu hồ sơ. |
| Q-FE03-002 | APPROVE AS PROPOSED | Thay đổi email nên thuộc luồng xác minh FE02. |
| Q-FE03-003 | APPROVE AS PROPOSED | Giảm trường hợp biên hồ sơ rỗng. |
| Q-FE03-004 | APPROVE AS PROPOSED | Cắt phạm vi Giai đoạn 1 đúng. |
| Q-FE03-005 | APPROVE WITH NOTE | Mức chi tiết nhật ký kiểm toán nên nhẹ và không làm lộ giá trị nhạy cảm cũ khi không cần thiết. |

### FE04 Quản lý Tư cách Thành viên

| Câu hỏi | Kết luận rà soát | Ghi chú |
| --- | --- | --- |
| Q-FE04-001 | APPROVE AS PROPOSED | Hành vi vòng đời hợp lý. |
| Q-FE04-002 | APPROVE AS PROPOSED | Bắt buộc cho truy vết. |
| Q-FE04-003 | APPROVE AS PROPOSED | Kiểm soát phạm vi tốt. |
| Q-FE04-004 | APPROVE AS PROPOSED | Ngăn chồng lấn FE04/FE11. |
| Q-FE04-005 | KEEP TEAM DECISION | Thủ thư+Quản trị viên là thực tế nhưng người rà soát có thể muốn chỉ Quản trị viên để kiểm soát mạnh hơn. |
| Q-FE04-006 | APPROVE WITH NOTE | Phần phụ thuộc thông báo nên không gây chặn và rõ ràng trong FE04/FE10. |

### FE05 Quản lý Sách

| Câu hỏi | Kết luận rà soát | Ghi chú |
| --- | --- | --- |
| Q-FE05-001 | APPROVE AS PROPOSED | Thỏa hiệp thư mục tốt. |
| Q-FE05-002 | APPROVE AS PROPOSED | Quy tắc thư viện thực tế. |
| Q-FE05-003 | APPROVE AS PROPOSED | Phân chia tốt giữa khung nhìn công khai và nhân viên. |
| Q-FE05-004 | APPROVE AS PROPOSED | An toàn hơn xóa vật lý. |
| Q-FE05-005 | KEEP TEAM DECISION | Một thể loại đơn giản hơn nhưng kỳ vọng bài tập/nghiệp vụ có thể muốn quan hệ nhiều-nhiều. |
| Q-FE05-006 | APPROVE AS PROPOSED | Tốt nhất cho sự đơn giản của Giai đoạn 1. |
| Q-FE05-007 | APPROVE AS PROPOSED | Bảo vệ dữ liệu vận hành đang hoạt động. |

### FE06 Quản lý Kho / Bản sao Sách

| Câu hỏi | Kết luận rà soát | Ghi chú |
| --- | --- | --- |
| Q-FE06-001 | APPROVE AS PROPOSED | Đường cơ sở dùng chung cần thiết. |
| Q-FE06-002 | APPROVE AS PROPOSED | Ngăn nhân viên bỏ qua luồng mượn/đặt chỗ. |
| Q-FE06-003 | APPROVE AS PROPOSED | Nhất quán với chiến lược xóa mềm. |
| Q-FE06-004 | APPROVE AS PROPOSED | Vị trí tùy chọn có thể chấp nhận trong Giai đoạn 1. |
| Q-FE06-005 | APPROVE WITH NOTE | Phù hợp cho Giai đoạn 1 nhưng cần ghi rằng tách tình trạng/trạng thái là công việc tương lai. |
| Q-FE06-006 | APPROVE AS PROPOSED | Khớp yêu cầu kiểm toán trong quy tắc dùng chung. |

### FE08 Quản lý Đặt chỗ

| Câu hỏi | Kết luận rà soát | Ghi chú |
| --- | --- | --- |
| Q-FE08-001 | APPROVE AS PROPOSED | Khớp SQL hiện tại và giới hạn rủi ro thay đổi cơ sở dữ liệu. |
| Q-FE08-002 | APPROVE AS PROPOSED | Ngăn đặt chỗ khi có thể mượn ngay. |
| Q-FE08-003 | KEEP TEAM DECISION | `3` là hợp lý nhưng giới hạn này nên được nhóm phê duyệt, không phải phỏng đoán. |
| Q-FE08-004 | KEEP TEAM DECISION | `2` ngày là hợp lý nhưng vẫn là quyết định nghiệp vụ. |
| Q-FE08-005 | APPROVE AS PROPOSED | Hàng đợi thủ công phù hợp năng lực Giai đoạn 1. |

### FE09 Quản lý Tiền phạt

| Câu hỏi | Kết luận rà soát | Ghi chú |
| --- | --- | --- |
| Q-FE09-001 | APPROVE AS PROPOSED | Giữ phạm vi căn chỉnh với đường cơ sở. |
| Q-FE09-003 | APPROVE AS PROPOSED | Mô hình kế toán đơn giản hơn cho Giai đoạn 1. |
| Q-FE09-004 | APPROVE WITH NOTE | Dùng lược đồ đơn giản nhất vẫn giữ khả năng truy vết người thu và ghi chú. |
| Q-FE09-005 | KEEP TEAM DECISION | Quyền miễn/hủy là nhạy cảm; nhóm nên xác nhận. |
| Q-FE09-006 | APPROVE WITH NOTE | Làm rõ quyền sở hữu: FE09 tính tiền phạt; FE07 kích hoạt sự kiện trả; bộ lập lịch là công việc tương lai trừ khi được phê duyệt. |

### FE10 Quản lý Thông báo

| Câu hỏi | Kết luận rà soát | Ghi chú |
| --- | --- | --- |
| Q-FE10-001 | APPROVE AS PROPOSED | Phù hợp giai đoạn dự án và tránh bị khóa vào nhà cung cấp. |
| Q-FE10-002 | APPROVE AS PROPOSED | Cắt ngoài phạm vi tốt. |
| Q-FE10-003 | APPROVE WITH NOTE | Nếu nhóm không thể hoàn tất mọi mẫu, phân loại mẫu ưu tiên thấp hơn là hoãn. |
| Q-FE10-004 | APPROVE AS PROPOSED | Tốt cho khả năng quan sát. |
| Q-FE10-005 | APPROVE AS PROPOSED | Thử lại thủ công là đủ cho Giai đoạn 1. |
| Q-FE10-006 | APPROVE AS PROPOSED | Quy tắc không gây chặn quan trọng. |
| Q-FE10-007 | APPROVE AS PROPOSED | Nhất quán với ngữ cảnh dùng chung. |

### FE11 Quản lý Người dùng và Vai trò

| Câu hỏi | Kết luận rà soát | Ghi chú |
| --- | --- | --- |
| Q-FE11-001 | APPROVE AS PROPOSED | Ngăn tự khóa ngoài ý muốn. |
| Q-FE11-002 | KEEP TEAM DECISION | Ngăn hay cảnh báo là lựa chọn chính sách; ngăn an toàn hơn. |
| Q-FE11-003 | APPROVE AS PROPOSED | Tái sử dụng quy tắc mật khẩu FE02. |
| Q-FE11-004 | APPROVE AS PROPOSED | Hành vi duy nhất tiêu chuẩn và an toàn hơn. |
| Q-FE11-005 | APPROVE WITH NOTE | Nếu email giả lập FE10 không khả dụng, giữ nội dung này là đường thiết lập quản trị viên đã lập kế hoạch/thủ công. |
| Q-FE11-006 | APPROVE AS PROPOSED | Quy tắc an toàn Giai đoạn 1 tốt. |
| Q-FE11-007 | APPROVE AS PROPOSED | Vai trò ngang hàng giảm độ phức tạp. |
| Q-FE11-008 | APPROVE AS PROPOSED | Được ràng buộc an toàn yêu cầu. |
| Q-FE11-009 | KEEP TEAM DECISION | Tùy chọn là có thể chấp nhận nhưng phụ thuộc phạm vi FE10 và năng lực bàn giao. |

### FE12 Báo cáo và Thống kê

| Câu hỏi | Kết luận rà soát | Ghi chú |
| --- | --- | --- |
| Q-FE12-001 | APPROVE AS PROPOSED | Ranh giới vai trò tốt. |
| Q-FE12-002 | APPROVE AS PROPOSED | Số liệu mượn tối thiểu tốt. |
| Q-FE12-003 | APPROVE AS PROPOSED | Số liệu kho tối thiểu tốt. |
| Q-FE12-004 | APPROVE AS PROPOSED | Số liệu người dùng tối thiểu tốt. |
| Q-FE12-005 | APPROVE AS PROPOSED | Cắt phạm vi Giai đoạn 1 đúng. |
| Q-FE12-006 | APPROVE WITH NOTE | Kiểm toán nên là ghi sự kiện đơn giản, không phải phân tích nặng. |

---

## 3. Các quyết định nhóm còn lại

Các hạng mục sau vẫn cần được nhóm phê duyệt rõ vì chúng là lựa chọn chính sách nghiệp vụ thay vì lựa chọn thuần túy về tính nhất quán kỹ thuật:

- `Q-FE02-002` thời hạn phiên
- `Q-FE04-005` vai trò phê duyệt quyết định thành viên
- `Q-FE05-005` một hay nhiều thể loại cho mỗi sách
- `Q-FE08-003` số đặt chỗ đang hoạt động tối đa cho mỗi thành viên
- `Q-FE08-004` thời hạn giữ đặt chỗ
- `Q-FE09-005` chính sách quản trị viên miễn/hủy tiền phạt
- `Q-FE11-002` ngăn hay cảnh báo khi vô hiệu hóa người dùng có khoản mượn đang hoạt động
- `Q-FE11-009` yêu cầu thông báo vô hiệu hóa người dùng

Các hạng mục này không chặn thảo luận nhưng không nên bị âm thầm giả định khi chưa có xác nhận của nhóm.

---

## 4. Đề xuất của người rà soát

Bước tiếp theo được đề xuất:

1. Dùng kết luận rà soát để điền trước kết quả trong gói.
2. Tổ chức cuộc họp rà soát nhóm ngắn chỉ tập trung vào các mục trong Phần 3 bên trên.
3. Cập nhật từng `SPEC.md` và `CHANGELOG.md` bị ảnh hưởng.
4. Chỉ đổi trạng thái tính năng thành `APPROVED` sau khi hoàn tất các cập nhật đó.

Chính sách điền trước được đề xuất:

- Đánh dấu mọi mục `APPROVE AS PROPOSED` là `APPROVED`.
- Đánh dấu mọi mục `APPROVE WITH NOTE` là `APPROVED`, sau đó sao chép ghi chú vào cách diễn đạt `SPEC.md` liên quan.
- Giữ mọi mục `KEEP TEAM DECISION` ở trạng thái `PENDING` đến khi nhóm xác nhận.
