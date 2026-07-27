# Gói giải quyết câu hỏi mở Giai đoạn 1

Ngày: 2026-06-10
Trạng thái: ĐÃ RÀ SOÁT - CÂU HỎI MỞ ĐƯỢC PHÊ DUYỆT
Bản rà soát nguồn: `.sdd/reviews/review-phase-1-specs-2026-06-10.md`
Mục đích: Dùng tệp này trong cuộc họp rà soát nhóm để phê duyệt, thay đổi hoặc hoãn mọi câu hỏi mở trước khi chuyển đặc tả sang Lập kế hoạch Giai đoạn 2.

Ghi chú rà soát: Các hàng được đánh dấu `APPROVED` đã được lần rà soát này phê duyệt. Không còn hàng câu hỏi mở `PENDING` trong gói này.


## Quy tắc cuộc họp

Một câu hỏi chỉ được giải quyết khi nhóm ghi một trong các kết quả sau:

- `APPROVED`: chấp nhận quyết định đề xuất.
- `CHANGED`: thay quyết định đề xuất bằng quy tắc khác.
- `DEFERRED`: chuyển rõ câu hỏi ra ngoài phạm vi Giai đoạn 1.

Không đổi trạng thái `SPEC.md` của bất kỳ tính năng nào thành `APPROVED` cho đến khi các câu hỏi bên dưới của nó được giải quyết và sao chép lại vào `SPEC.md` / `CHANGELOG.md` liên quan.

---

## 1. Các quyết định liên tính năng cần phê duyệt trước

| ID | Tính năng bị ảnh hưởng | Quyết định đề xuất | Kết quả | Ghi chú |
| --- | --- | --- | --- | --- |
| X-001 | FE01, FE05 | FE01 sở hữu duyệt/tìm kiếm/chi tiết công khai; FE05 sở hữu CRUD sách cho nhân viên và quản lý sách nội bộ. Khung nhìn công khai ẩn sách không hoạt động. | APPROVED |  |
| X-002 | FE02, FE10, FE11 | Email thiết lập mật khẩu thuộc sở hữu FE02/FE11; FE10 chỉ cung cấp việc gửi thông báo tái sử dụng khi các tính năng đó gọi. | APPROVED |  |
| X-003 | FE03, FE11 | FE03 cập nhật trường hồ sơ của chính người dùng; FE11 cập nhật trường/trạng thái/vai trò tài khoản do quản trị viên quản lý; thay đổi email đi qua xác minh FE02. | APPROVED |  |
| X-004 | FE04, FE11 | Phê duyệt thành viên chỉ thay đổi đơn/trạng thái thành viên; việc gán vai trò vẫn thuộc FE11. | APPROVED |  |
| X-005 | FE06, FE07, FE08 | Trạng thái bản sao Giai đoạn 1 là `AVAILABLE`, `BORROWED`, `RESERVED`, `DAMAGED`, `LOST`, `INACTIVE`. FE07 sở hữu `BORROWED`; FE08 sở hữu `RESERVED`; FE06 không thể ghi đè thủ công lượt mượn/đặt chỗ đang hoạt động. | APPROVED |  |
| X-006 | FE07, FE09 | Mọi số tiền phạt chưa trả > 0 đều chặn mượn/gia hạn. Giai đoạn 1 chỉ hỗ trợ tiền phạt quá hạn. FE09 sở hữu việc tính/tạo tiền phạt. | APPROVED |  |
| X-007 | FE07, FE08 | Đặt chỗ đang hoạt động/bản sao được giữ cho thành viên khác chặn gia hạn. Đặt chỗ Giai đoạn 1 nhắm `CopyId`. | APPROVED |  |
| X-008 | FE07, FE09, FE10 | Nhắc hạn trả được kích hoạt thủ công/bởi bộ lập lịch trong Giai đoạn 1; thông báo thất bại không hoàn tác luồng mượn/trả/phạt. | APPROVED |  |
| X-009 | FE06, FE07, FE09, FE11, FE12 | Báo cáo FE12 phải dùng giá trị trạng thái nguồn đã phê duyệt từ FE06/FE07/FE09/FE11 và giữ chế độ chỉ đọc. | APPROVED |  |

---

## 2. Quyết định câu hỏi theo tính năng

### FE01 Công khai / Duyệt - Chủ sở hữu: Dung

| Câu hỏi | Quyết định đề xuất | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| Q-FE01-001 | Ẩn sách không hoạt động/đã vô hiệu hóa khỏi mọi khung nhìn tìm kiếm/chi tiết công khai. | APPROVED |  |
| Q-FE01-002 | Khách chỉ thấy khả dụng đơn giản: `Available` / `Unavailable`, không thấy số bản sao chính xác. | APPROVED |  |
| Q-FE01-003 | Bộ lọc Giai đoạn 1: từ khóa, tựa sách, tác giả, thể loại; bắt buộc phân trang. | APPROVED |  |
| Q-FE01-004 | ISBN hiển thị cho khách khi có. | APPROVED |  |
| Q-FE01-005 | Trang chủ hiển thị điều hướng/tìm kiếm và sách gần đây; sách nổi bật là tùy chọn/ngoài phạm vi trừ khi được cấu hình thủ công. | APPROVED |  |

### FE02 Xác thực - Chủ sở hữu: Dat

| Câu hỏi | Quyết định đề xuất | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| Q-FE02-001 | Mật khẩu yêu cầu ít nhất 8 ký tự, 1 chữ hoa, 1 chữ số, 1 ký tự đặc biệt. | APPROVED |  |
| Q-FE02-002 | Token truy cập hết hạn sau 15 phút; token làm mới hết hạn sau 7 ngày. | APPROVED | APPROVED - mặc định bảo mật hợp lý cho Giai đoạn 1; cập nhật quy tắc token/phiên FE02. |
| Q-FE02-003 | Bắt buộc xác minh email nếu nhà cung cấp email/giả lập khả dụng; nếu không thì đánh dấu là giả lập/đã lập kế hoạch cho Giai đoạn 1. | APPROVED |  |
| Q-FE02-004 | Cho phép nhiều phiên đồng thời trong Giai đoạn 1. | APPROVED |  |
| Q-FE02-005 | Lần đăng nhập thất bại bị giới hạn tốc độ theo IP/email bằng quy tắc phía máy chủ đơn giản. | APPROVED |  |
| Q-FE02-006 | Token đặt lại mật khẩu hết hạn sau 15 phút. | APPROVED |  |
| Q-FE02-007 | Ghi nhật ký lần thử đổi mật khẩu và lần đăng nhập thất bại. | APPROVED |  |
| Q-FE02-008 | Người dùng không hoạt động không thể đăng nhập; không có tác vụ tự động khóa trong Giai đoạn 1. | APPROVED |  |
| Q-FE02-009 | Dùng token truy cập JWT cùng token làm mới. | APPROVED |  |
| Q-FE02-010 | Đặt lại mật khẩu chỉ yêu cầu quyền sở hữu email đã xác minh qua token đặt lại; không có kiểm tra khôi phục bổ sung trong Giai đoạn 1. | APPROVED |  |

### FE03 Hồ sơ Người dùng - Chủ sở hữu: Dat

| Câu hỏi | Quyết định đề xuất | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| Q-FE03-001 | FE03 có thể cập nhật `Users.Phone`. | APPROVED |  |
| Q-FE03-002 | FE03 không thể cập nhật email; thay đổi email phải đi qua xác minh FE02. | APPROVED |  |
| Q-FE03-003 | Bản ghi hồ sơ bị thiếu được tự động tạo ở lần xem đầu tiên. | APPROVED |  |
| Q-FE03-004 | Giai đoạn 1 chỉ hỗ trợ văn bản URL ảnh đại diện, không tải tệp lên. | APPROVED |  |
| Q-FE03-005 | Cập nhật hồ sơ ghi nhật ký kiểm toán cho trường đã thay đổi, tác nhân và dấu thời gian. | APPROVED |  |

### FE04 Quản lý Tư cách Thành viên - Chủ sở hữu: Dat

| Câu hỏi | Quyết định đề xuất | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| Q-FE04-001 | Người dùng bị từ chối có thể nộp lại sau khi sửa thông tin. | APPROVED |  |
| Q-FE04-002 | Bắt buộc có lý do từ chối. | APPROVED |  |
| Q-FE04-003 | Tư cách thành viên không hết hạn trong Giai đoạn 1. | APPROVED |  |
| Q-FE04-004 | Phê duyệt thành viên chỉ thay đổi trạng thái đơn/thành viên, không thay đổi vai trò người dùng. | APPROVED |  |
| Q-FE04-005 | Thủ thư và Quản trị viên có thể phê duyệt/từ chối. | APPROVED | APPROVED - FE04 hiện tại đã dùng mô hình quyền Thủ thư/Quản trị viên. |
| Q-FE04-006 | Phê duyệt/từ chối kích hoạt thông báo FE10 khi nhà cung cấp thông báo khả dụng; lỗi không hoàn tác phê duyệt/từ chối. | APPROVED |  |

### FE05 Quản lý Sách - Chủ sở hữu: Dung

| Câu hỏi | Quyết định đề xuất | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| Q-FE05-001 | ISBN là tùy chọn nhưng phải duy nhất khi được cung cấp. | APPROVED |  |
| Q-FE05-002 | Nhiều sách có thể có cùng tựa. | APPROVED |  |
| Q-FE05-003 | Sách đã vô hiệu hóa bị ẩn khỏi tìm kiếm công khai nhưng hiển thị trong khung nhìn quản lý nhân viên/quản trị viên. | APPROVED |  |
| Q-FE05-004 | Bắt buộc xóa mềm/vô hiệu hóa; không xóa vật lý trong Giai đoạn 1. | APPROVED |  |
| Q-FE05-005 | Một sách thuộc một thể loại trong Giai đoạn 1. | APPROVED | APPROVED - lược đồ SQL hiện tại có một `CategoryId`; quan hệ nhiều-nhiều là công việc tương lai. |
| Q-FE05-006 | Ảnh bìa được lưu dưới dạng văn bản URL/đường dẫn, không phải nội dung nhị phân trong cơ sở dữ liệu. | APPROVED |  |
| Q-FE05-007 | Việc vô hiệu hóa bị chặn khi các bản sao đang hoạt động được mượn hoặc đặt chỗ. | APPROVED |  |

### FE06 Quản lý Kho / Bản sao Sách - Chủ sở hữu: Dat

| Câu hỏi | Quyết định đề xuất | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| Q-FE06-001 | Trạng thái bản sao được phép: `AVAILABLE`, `BORROWED`, `RESERVED`, `DAMAGED`, `LOST`, `INACTIVE`. | APPROVED |  |
| Q-FE06-002 | Nhân viên không thể đặt thủ công `BORROWED` hay `RESERVED`; chúng chỉ đến từ luồng FE07/FE08. | APPROVED |  |
| Q-FE06-003 | `DELETE /api/book-copies/{id}` vô hiệu hóa thay vì xóa vật lý. | APPROVED |  |
| Q-FE06-004 | `Location` là tùy chọn trong Giai đoạn 1. | APPROVED |  |
| Q-FE06-005 | Tình trạng bản sao không tách biệt với trạng thái trong Giai đoạn 1. | APPROVED |  |
| Q-FE06-006 | Hành động tạo/cập nhật/vô hiệu hóa/đổi trạng thái ghi `AuditLogs`. | APPROVED |  |

### FE08 Quản lý Đặt chỗ - Chủ sở hữu: Nhat

| Câu hỏi | Quyết định đề xuất | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| Q-FE08-001 | Đặt chỗ nhắm bản sao vật lý `CopyId` trong Giai đoạn 1. | APPROVED |  |
| Q-FE08-002 | Thành viên không thể đặt chỗ khi một bản sao hiện đang khả dụng. | APPROVED |  |
| Q-FE08-003 | Tối đa 3 đặt chỗ đang hoạt động cho mỗi thành viên. | APPROVED | APPROVED - giới hạn Giai đoạn 1 đơn giản; thêm quy tắc nghiệp vụ và kiểm thử. |
| Q-FE08-004 | Đặt chỗ đã thông báo giữ hiệu lực trong 2 ngày lịch. | APPROVED | APPROVED - khoảng giữ Giai đoạn 1 đơn giản; thêm quy tắc hết hạn. |
| Q-FE08-005 | Hàng đợi được thủ thư xử lý thủ công trong Giai đoạn 1; kích hoạt tự động là công việc tương lai. | APPROVED |  |

### FE09 Quản lý Tiền phạt - Chủ sở hữu: Dung

| Câu hỏi | Quyết định đề xuất | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| Q-FE09-001 | Giai đoạn 1 chỉ hỗ trợ tiền phạt quá hạn; phạt do mất/hư hỏng nằm ngoài phạm vi. | APPROVED |  |
| Q-FE09-003 | Không thanh toán một phần trong Giai đoạn 1. | APPROVED |  |
| Q-FE09-004 | Lưu ID người thu và ghi chú cùng bản ghi/bảng thanh toán tiền phạt nếu có theo dõi thanh toán; nếu không thì lưu trên bản ghi tiền phạt trong Giai đoạn 1. | APPROVED |  |
| Q-FE09-005 | Quản trị viên có thể miễn/hủy tiền phạt với lý do bắt buộc và nhật ký kiểm toán. | APPROVED | APPROVED - hành động nhạy cảm chỉ dành cho quản trị viên; yêu cầu lý do và nhật ký kiểm toán. |
| Q-FE09-006 | Việc tính tiền phạt chạy khi trả và cũng có thể được thủ thư/quản trị viên chạy thủ công; tác vụ hằng ngày được lập lịch là công việc tương lai. | APPROVED |  |

### FE10 Quản lý Thông báo - Chủ sở hữu: Nhat

| Câu hỏi | Quyết định đề xuất | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| Q-FE10-001 | Kênh bắt buộc của Giai đoạn 1 là email với nhà cung cấp giả lập. | APPROVED |  |
| Q-FE10-002 | Thông báo trong ứng dụng là tùy chọn/công việc tương lai trong Giai đoạn 1. | APPROVED |  |
| Q-FE10-003 | Mẫu bắt buộc: xác minh, đặt lại mật khẩu, nhắc hạn trả, báo quá hạn, đặt chỗ sẵn sàng, kết quả thành viên. | APPROVED |  |
| Q-FE10-004 | Lưu lần thử gửi thông báo và trạng thái. | APPROVED |  |
| Q-FE10-005 | Chỉ thử lại lượt gửi thất bại theo cách thủ công trong Giai đoạn 1. | APPROVED |  |
| Q-FE10-006 | Thông báo thất bại không được chặn luồng nghiệp vụ nguồn. | APPROVED |  |
| Q-FE10-007 | Hệ thống/Bộ lập lịch có thể kích hoạt thông báo nội bộ; không phải vai trò đăng nhập. | APPROVED |  |

### FE11 Quản lý Người dùng và Vai trò - Chủ sở hữu: Dung

| Câu hỏi | Quyết định đề xuất | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| Q-FE11-001 | Quản trị viên không thể tự vô hiệu hóa chính mình. | APPROVED |  |
| Q-FE11-002 | Ngăn vô hiệu hóa người dùng có khoản mượn đang hoạt động. | APPROVED | APPROVED - an toàn hơn cảnh báo; ngăn vòng đời mượn không hợp lệ. |
| Q-FE11-003 | Thiết lập mật khẩu dùng cùng quy tắc độ phức tạp mật khẩu FE02. | APPROVED |  |
| Q-FE11-004 | Email không phân biệt hoa thường khi đăng nhập và kiểm tra tính duy nhất. | APPROVED |  |
| Q-FE11-005 | Người dùng do Quản trị viên tạo nhận liên kết thiết lập mật khẩu dùng một lần khi FE10/email giả lập khả dụng. | APPROVED |  |
| Q-FE11-006 | Không xóa vĩnh viễn dữ liệu người dùng đã vô hiệu hóa trong Giai đoạn 1. | APPROVED |  |
| Q-FE11-007 | Không có phân cấp vai trò trong Giai đoạn 1; vai trò là ngang hàng. | APPROVED |  |
| Q-FE11-008 | Quản trị viên không thể xem trường tài khoản nhạy cảm như hàm băm mật khẩu, token đặt lại, token làm mới. | APPROVED |  |
| Q-FE11-009 | Thông báo vô hiệu hóa người dùng là tùy chọn/công việc tương lai trừ khi phạm vi FE10 chấp nhận. | APPROVED | APPROVED - tùy chọn/công việc tương lai; không có thông báo Giai đoạn 1 bắt buộc. |

### FE12 Báo cáo và Thống kê - Chủ sở hữu: Nhat

| Câu hỏi | Quyết định đề xuất | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| Q-FE12-001 | Thủ thư và Quản trị viên có thể xem báo cáo; Thành viên/Khách không thể. | APPROVED |  |
| Q-FE12-002 | Số liệu mượn: khoản mượn đang hoạt động, khoản mượn quá hạn, số lượt mượn theo kỳ, sách được mượn nhiều nhất. | APPROVED |  |
| Q-FE12-003 | Số liệu kho: tổng số sách, tổng số bản sao, bản sao theo trạng thái, sách có ít/không có khả dụng. | APPROVED |  |
| Q-FE12-004 | Thống kê người dùng: tổng thành viên, người dùng hoạt động/không hoạt động, thành viên mới theo kỳ. | APPROVED |  |
| Q-FE12-005 | Xuất CSV/PDF nằm ngoài phạm vi trừ khi nhóm yêu cầu. | APPROVED |  |
| Q-FE12-006 | Truy cập báo cáo ghi nhật ký kiểm toán cho lượt xem báo cáo của Quản trị viên/Thủ thư. | APPROVED |  |

---

## 3. Danh sách kiểm tra phê duyệt

Ghi chú kiểm toán: các mục bên dưới được kiểm tra lại theo các tệp `SPEC.md` đã phê duyệt, tệp `CHANGELOG.md` tính năng và phần hoàn tất Tuần 3. Xác nhận của nhóm được ghi cho đường cơ sở đặc tả Giai đoạn 1.

- [x] Các quyết định liên tính năng từ X-001 đến X-009 được phê duyệt/thay đổi/hoãn.
- [x] Mỗi chủ sở hữu rà soát quyết định tính năng của mình.
- [x] Quyết định đã thay đổi được sao chép vào các tệp `SPEC.md` bị ảnh hưởng.
- [x] Quyết định bị hoãn được thêm vào phần `Out of Scope` / `Open Questions` của từng tính năng.
- [x] Mỗi `CHANGELOG.md` bị ảnh hưởng ghi nhận cập nhật phê duyệt.
- [x] Các tệp `SPEC.md` tính năng đã phê duyệt đổi trạng thái từ `DRAFT` thành `APPROVED`.
- [x] `PLAN.md` chỉ được mở rộng sau khi `SPEC.md` liên quan được phê duyệt.
- [x] `TASKS.md` chỉ được mở rộng sau khi `PLAN.md` liên quan được phê duyệt.
- [x] Người rà soát xác nhận. (Xác nhận rà soát nhóm được ghi vào 2026-06-10.)

## 4. Chương trình rà soát đề xuất

1. Phê duyệt các quyết định liên tính năng trước.
2. Rà soát tính năng theo thứ tự phần phụ thuộc: FE02, FE11, FE03, FE04, FE05, FE06, FE08, FE09, FE10, FE12, FE01.
3. Với mỗi hàng, ghi `APPROVED`, `CHANGED` hoặc `DEFERRED`.
4. Giao một chủ sở hữu cập nhật đặc tả và nhật ký thay đổi sau cuộc họp.
5. Chạy lại rà soát trước khi đổi bất kỳ trạng thái nào thành `APPROVED`.
