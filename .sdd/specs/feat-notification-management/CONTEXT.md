# CONTEXT.md - FE10 Quản lý thông báo

# Phiên bản: 0.6.0

# Trạng thái: HOÀN THÀNH; PR #89 ĐÃ HỢP NHẤT; CI VÀ AZURE ĐÃ CHẠY THÀNH CÔNG TRÊN ĐÚNG COMMIT

# Chủ sở hữu: Nhat

# Cập nhật lần cuối: 2026-08-01

# Thư mục tính năng: `.sdd/specs/feat-notification-management/`

---

## 1. Mục đích tính năng

Quản lý thông báo tồn tại để gửi thông điệp hệ thống cho người dùng đúng thời
điểm và qua các kênh đã được phê duyệt.

Tính năng này phải xử lý nhất quán các nội dung sau:

- Các yêu cầu thông báo do tính năng khác tạo ra.
- Nội dung thông báo được tạo từ các mẫu đã được phê duyệt.
- Trạng thái gửi cho các thông báo email.
- Khả năng hiển thị hộp thư thông báo cá nhân của chính người dùng và trạng
  thái đã đọc trên web cho các bản ghi thông báo không nhạy cảm đủ điều kiện.
- Lịch sử gửi an toàn cho các lần gửi thất bại hoặc bị bỏ qua.
- Quyền sở hữu được ràng buộc khi khởi tạo cho việc gửi OTP FE02, kết quả tư
  cách thành viên FE04 và thiết lập tài khoản FE11.

Trước đây FE10 sử dụng Đặc tả Tiêu chuẩn. Bản sửa đổi v0.5.0 được xem là Đặc
tả Đầy đủ vì bổ sung cấu trúc cơ sở dữ liệu, API bản ghi của chính người dùng đã xác thực và
phân quyền phía máy chủ, đồng thời giữ quy tắc rằng FE10 không quyết định khi
tài khoản, đặt chỗ, khoản mượn hoặc tiền phạt thay đổi trạng thái.

---

## 2. Quy trình thực tế

Quy trình thông báo thư viện điển hình:

1. Một tính năng nguồn phát hiện rằng cần gửi thông báo.
2. Tính năng nguồn gửi cho FE10 một yêu cầu thông báo với người nhận, loại,
   kênh, khóa mẫu và dữ liệu mẫu.
3. FE10 kiểm tra hợp lệ yêu cầu và kiểm tra khả dụng của người nhận/kênh.
4. FE10 tạo thông điệp từ một mẫu đã được phê duyệt.
5. FE10 lưu yêu cầu gửi nhạy cảm đã được chấp nhận ở trạng thái `PROCESSING`
   trước khi gọi nhà cung cấp, trong khi yêu cầu gửi không nhạy cảm
   đã xếp hàng bắt đầu ở `PENDING`.
6. Các bản ghi không nhạy cảm đủ điều kiện hiển thị trong hộp thư web cá nhân
   của người nhận mà không tạo bản ghi thứ hai hoặc kênh gửi thứ hai.
7. Tiến trình xử lý gửi email đã xếp hàng và cập nhật trạng thái gửi độc lập;
   trạng thái đã đọc cá nhân chỉ thay đổi qua API hộp thư đã xác thực.
8. Nếu gửi thất bại, FE10 ghi nhận lý do thất bại an toàn mà không loại bỏ bản
   ghi hộp thư hoặc hoàn tác sự kiện nghiệp vụ nguồn.

---

## 3. Ranh giới tính năng

FE10 bao gồm:

- Nhận yêu cầu thông báo từ các tính năng nội bộ đã được ràng buộc khi khởi tạo
  và phê duyệt.
- Gửi thông báo xác minh tài khoản, đặt lại mật khẩu, đặt chỗ, hạn trả, quá hạn
  và tiền phạt.
- Chiếu các bản ghi không nhạy cảm đủ điều kiện vào hộp thư web cá nhân của
  người nhận đã xác thực mà không tạo thông báo hoặc kênh khác.
- Theo dõi `ReadAt` có thể null độc lập với việc gửi email và suy ra điều hướng
  nghiệp vụ an toàn từ danh sách cho phép backend cố định.
- Gửi thông báo email qua bộ điều hợp nhà cung cấp đã cấu hình hoặc nhà cung
  cấp mô phỏng được truyền vào.
- Sử dụng mẫu thông báo đã được phê duyệt và các biến mẫu bắt buộc.
- Theo dõi trạng thái thông báo và lý do gửi thất bại.

FE10 không bao gồm:

- Tạo mã thông báo xác thực. Việc đó thuộc Xác thực FE02.
- Xác thực mã thông báo đặt lại mật khẩu. Việc đó thuộc Xác thực FE02.
- Quyết định điều kiện hợp lệ hàng đợi đặt chỗ. Việc đó thuộc Quản lý đặt chỗ
  FE08.
- Tính tiền phạt quá hạn. Việc đó thuộc Quản lý tiền phạt FE09.
- Phê duyệt quy trình mượn/trả. Việc đó thuộc Quản lý mượn sách FE07.
- Gửi SMS, thông báo đẩy hoặc chiến dịch tiếp thị.
- Thông báo thanh toán trực tuyến.
- Kênh gửi `IN_APP` thứ hai hoặc bảng/bản ghi hộp thư trùng lặp.
- Màn hình nhật ký thông báo toàn cục cho Quản trị viên/Thủ thư.
- Xóa, lưu trữ, dọn dẹp theo thời hạn lưu giữ hoặc quản lý tùy chọn thông báo.
- Màn hình quản lý thử lại thủ công.
- Giao diện chỉnh sửa mẫu.
- Thông tin xác thực nhà cung cấp email bên ngoài thực trong mã nguồn.

---

## 4. Ghi chú về mô hình dữ liệu hiện tại

Thiết kế SQL hiện có được triển khai trong `database/Librarymanagement.sql`;
phần mở rộng v0.5.0 đã được phê duyệt bổ sung hợp đồng trạng thái đọc cá nhân:

- `NotificationTemplates` có mã mẫu chuẩn, tiêu đề, nội dung, trạng thái và
  dấu thời gian.
- `Notifications` có loại/mẫu, người nhận, trạng thái gửi, siêu dữ liệu nguồn
  an toàn, khóa chống gửi trùng xuyên suốt mọi trạng thái, dữ liệu đã che dữ liệu, số
  lần thử, bản tóm tắt lỗi an toàn và trường `ReadAt` có thể null của v0.5.0.
- `NotificationAttempts` có dấu thời gian/trạng thái lần thử, thông báo lỗi an
  toàn và ID thông điệp nhà cung cấp.
- `UserNotificationPreferences` vẫn là công việc tương lai. Hộp thư web cá
  nhân đã được phê duyệt tái sử dụng `Notifications` và không cần bảng tùy chọn
  hay bảng chiếu.

Các vấn đề tiềm ẩn cần rà soát:

- Địa chỉ email nằm trong `Users.Email`; FE10 không được sao chép dữ liệu tài
  khoản người dùng một cách không cần thiết.
- Bí mật của nhà cung cấp email phải đến từ môi trường/cấu hình, không phải tệp
  được commit.
- FE02 sở hữu việc tạo và xác thực OTP/mã thông báo; FE10 chỉ nhận dữ liệu mẫu
  OTP thô qua thành phần gửi yêu cầu ràng buộc với `FE02`, chỉ dùng trong bộ nhớ nhà cung
  cấp và không lưu vào cơ sở dữ liệu OTP hay nội dung nhạy cảm đã tạo từ mẫu.
- Người gọi HTTP là nhân viên không thể gửi thông báo xác thực nhạy cảm; chỉ
  FE02 có thể gửi xác minh/đặt lại, chỉ FE04 có thể gửi kết quả tư cách thành
  viên và chỉ FE11 có thể gửi thiết lập tài khoản qua các thành phần gửi yêu cầu đã được
  ràng buộc của họ.
- Khi cùng một sự kiện nguồn được gửi lại, FE10 phải xử lý an toàn và không tạo
  thông điệp trùng lặp.
- Việc gửi thất bại không được hoàn tác giao dịch nghiệp vụ đã hoàn tất trong
  FE02/FE07/FE08/FE09.
- Truy vấn hộp thư cá nhân phải lọc theo `UserId` đã xác thực và danh sách cho
  phép chính xác các loại không nhạy cảm đủ điều kiện trước khi các hàng được
  hiện thực hóa; hàng nhạy cảm và hàng không có người dùng không bao giờ vào
  các thao tác liệt kê, đếm hoặc đọc.

SPEC đã được phê duyệt và FE10-H01 đến FE10-H09 đã giải quyết các điểm chặn
triển khai ở trên; các hạng mục phạm vi tương lai vẫn được trì hoãn rõ ràng.

---

## 5. Các trường hợp sử dụng chính từ bảng phân công

| ID trường hợp sử dụng | Tên trường hợp sử dụng | Chủ sở hữu |
| ----------- | ------------- | ----- |
| UC45 | Gửi thông báo xác minh tài khoản | Nhat |
| UC46 | Gửi thông báo đặt lại mật khẩu | Nhat |
| UC47 | Gửi thông báo đặt chỗ sách | Nhat |
| UC48 | Gửi thông báo hạn trả hoặc tiền phạt | Nhat |

---

## 6. Kiểm thử tính năng từ bảng phân công

| ID kiểm thử | Tên kiểm thử | Chủ sở hữu |
| ------- | --------- | ----- |
| FT46 | Đã gửi thông báo xác minh tài khoản | Nhat |
| FT47 | Đã gửi thông báo đặt lại mật khẩu | Nhat |
| FT48 | Đã gửi thông báo đặt chỗ sách | Nhat |
| FT49 | Đã gửi thông báo hạn trả hoặc tiền phạt | Nhat |

---

## 7. Rủi ro chính

- Thông báo trùng lặp gây nhầm lẫn cho thành viên và tạo thêm công việc hỗ trợ.
- Gửi email thất bại có thể che khuất sự kiện quan trọng về tài khoản, đặt chỗ,
  hạn trả hoặc tiền phạt.
- Nội dung thông báo có thể làm lộ mã thông báo nhạy cảm hoặc chi tiết lỗi nội
  bộ nếu mẫu không được kiểm soát.
- Thiếu bản ghi gửi khiến sự cố gửi khó khắc phục.
- FE10 có thể vô tình tiếp quản các quyết định nghiệp vụ thuộc FE02, FE07, FE08
  hoặc FE09.
- Thông tin xác thực của nhà cung cấp email có thể bị lộ nếu bị mã hóa cứng.

---

## 8. Phụ thuộc

| Phụ thuộc | Lý do quan trọng |
| ---------- | -------------- |
| Xác thực FE02 | Tạo mã OTP xác minh/đặt lại và yêu cầu gửi qua thành phần gửi yêu cầu ràng buộc với `FE02`. |
| Quản lý tư cách thành viên FE04 | Yêu cầu `MEMBERSHIP_RESULT` sau khi phê duyệt/từ chối qua thành phần gửi yêu cầu ràng buộc với `FE04`. |
| Quản lý mượn sách FE07 | Có thể yêu cầu lời nhắc hạn trả và thông báo trạng thái mượn/trả. |
| Quản lý đặt chỗ FE08 | Yêu cầu thông báo sách sẵn có và trạng thái đặt chỗ. |
| Quản lý tiền phạt FE09 | Yêu cầu thông báo quá hạn và tiền phạt. |
| Cơ sở dữ liệu SQL Server | Lưu mẫu, bản ghi và lần thử thông báo. |
| Bộ điều hợp nhà cung cấp email đã cấu hình hoặc nhà cung cấp mô phỏng được truyền vào | Gửi thông báo email trong môi trường triển khai và kiểm thử. |

---

## 9. Câu hỏi đã được giải quyết cho nhóm/giảng viên

| ID | Quyết định đã phê duyệt | Nguồn | Trạng thái |
| -- | ----------------- | ------ | ------ |
| Q-FE10-001 | Kênh bắt buộc của Giai đoạn 1 là email qua bộ điều hợp nhà cung cấp đã cấu hình; kiểm thử dùng nhà cung cấp mô phỏng được truyền vào. | Gói rà soát 2026-06-10; phê duyệt ADR-004 2026-07-15 | APPROVED |
| Q-FE10-002 | Kênh gửi `IN_APP` riêng vẫn là công việc tương lai. Hộp thư web v0.5.0 là phần trình bày bổ sung của bản ghi đủ điều kiện hiện có được hỗ trợ bởi email, không phải kênh mới. | Gói rà soát 2026-06-10; phê duyệt thiết kế v0.5.0 2026-07-27 | APPROVED |
| Q-FE10-003 | Các mẫu chuẩn bắt buộc bao gồm xác minh, đặt lại mật khẩu, thiết lập tài khoản, đặt chỗ sẵn sàng, nhắc hạn trả, thông báo quá hạn, thông báo tiền phạt và kết quả tư cách thành viên. | Gói rà soát 2026-06-10; chuẩn hóa đến 2026-07-17 | APPROVED |
| Q-FE10-004 | Lưu các lần gửi thông báo và trạng thái. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE10-005 | Chỉ thử lại thủ công các lần gửi thất bại trong Giai đoạn 1. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE10-006 | Lỗi thông báo không được chặn luồng nghiệp vụ nguồn. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE10-008 | `ACCOUNT_SETUP` do FE11 sở hữu chỉ được gửi qua thành phần gửi yêu cầu ràng buộc với FE11 và không lưu vào cơ sở dữ liệu mã thông báo/liên kết thiết lập thô. | ADR-005; Nhat phê duyệt 2026-07-15 | APPROVED |
| Q-FE10-007 | Hệ thống/Bộ lập lịch có thể kích hoạt thông báo nội bộ; không phải vai trò đăng nhập. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE10-014 | Mọi `MEMBER`, `LIBRARIAN` và `ADMIN` đã xác thực nhận hộp thư cá nhân chỉ chứa bản ghi của chính mình cho thông báo không nhạy cảm đủ điều kiện; nhật ký nhân viên toàn cục vẫn ngoài phạm vi. | Thiết kế v0.5.0 và phê duyệt SPEC bằng văn bản 2026-07-27 | APPROVED |

---

## 10. Trạng thái củng cố hiện tại

- `SPEC.md` v0.5.0, thiết kế hộp thư cá nhân và kế hoạch FE10-I01..I08 đã được
  H1 phê duyệt; PR #70 về quản trị đã hợp nhất thành `25c09ec`.
- FE10-I01 đến FE10-I08, biện pháp khắc phục mã băm bản cập nhật cơ sở dữ liệu và biện pháp khắc
  phục H3 vòng một có giới hạn đã được tích hợp qua PR #75. Commit đã được rà soát
  chính xác `778e0a470d8a1083bf571a8007b3c058eee4bb22` đã đạt CI
  `30317424995` và môi trường thử nghiệm Azure `30317621429`; H3 hai trục không có phát hiện
  có thể hành động và đã nhận phê duyệt rõ ràng.
- H3 vòng một đối với `main@a5fcbb9...28c4f80` thất bại do thiếu tài liệu trạng
  thái đọc ADR-002, văn bản nguồn chuẩn vòng đời lỗi thời, hai điều khiển trạng
  thái đọc `/notifications` có giới hạn và lỗi xếp chồng popover được trình
  duyệt báo cáo. ADR-002, tài liệu vòng đời, trạng thái trang, khả dụng đánh dấu
  tất cả và xếp chồng popover đang mở hiện đã được khắc phục bằng kiểm thử tập
  trung.
- Các cổng mới sau `main@a240705` đã đạt: backend 69/69 bộ và 1084/1084 kiểm
  thử; frontend 259/259 cùng kiểm tra mã/bản dựng; triển khai 20/20; hệ thống 10/10;
  trạng thái truy vết 3/3 và FE10 14/16 (88%); Chromium 11/11; kiểm toán,
  chuẩn bị cấu trúc cơ sở dữ liệu Azure và vệ sinh phần thay đổi.
- Phần chênh lệch chỉ tài liệu được người dùng phê duyệt qua
  `main@30f936d` đã giữ bản dịch SDD tiếng Việt mà không xung đột khi chạy.
  Mã đối chiếu nội dung H2 mới `e123345be05b59a9e519d182b301ab5464160e8fc32aed8d17d3c463e28e0a15`,
  CI/Azure đúng commit và H3 lặp lại đều hoàn tất trước khi PR #75 hợp nhất.
- PR #75 đã hợp nhất thành `b75776b10d6cf4b6868d2ba51eb3268073483b8b`. CI hậu
  hợp nhất chính xác `30341279111` và môi trường thử nghiệm Azure tự động `30341540847` đã đạt,
  bao gồm kiểm tra trước, backend, frontend và kiểm tra nhanh. Azure tiếp tục thực thi cổng
  bản cập nhật cơ sở dữ liệu; không có thay đổi cơ sở dữ liệu bổ sung nào được tuyên bố bởi đợt
  đóng tài liệu này.
- Phụ lục triển khai H1 ngày 2026-07-28 giữ môi trường thử nghiệm tự động có cổng CI từ
  phần triển khai trước trong khi yêu cầu bằng chứng mã băm bản cập nhật cơ sở dữ liệu chính xác cho cả lượt
  tự động và thủ công; lượt thủ công giữ thêm đầu vào xác nhận của con người.
- Phụ lục chênh lệch phần nghiệp vụ cốt lõi H1 ngày 2026-07-28 giữ hợp đồng bản cập nhật cơ sở dữ liệu/khả năng
  sẵn sàng khởi động `CHANGE_PASSWORD_OTP` đóng gói ở phần triển khai trước và dữ liệu mẫu email
  xác minh tiếng Việt, đồng thời giữ cổng bản cập nhật cơ sở dữ liệu FE10.
- Phụ lục chênh lệch phần nghiệp vụ cốt lõi H1 thứ hai ngày 2026-07-28 giữ các chỉnh sửa UI vòng
  hai FE07/FE08/FE10/FE12 ở phần triển khai trước qua `main@db97f17`, bao gồm lý do hủy của
  thành viên bằng tiếng Việt và các điều khiển trả/đặt chỗ đáp ứng, đồng thời
  giữ API và kiểu dáng hộp thư FE10.
- FE10-H01 đến FE10-H09 và FE10-S01 đến FE10-S16 vẫn là công việc giao hàng
  lịch sử đã hoàn tất; FE10-I01 đến FE10-I08 là các nhiệm vụ hộp thư cá nhân
  mới có giới hạn.
- Dùng biến môi trường hoặc cấu hình triển khai cho thông tin xác thực nhà cung
  cấp email.
- Không ghi log mã thông báo thô, liên kết đặt lại đầy đủ hoặc bí mật nhà cung
  cấp.
- Giữ các API FE10 được bảo vệ theo vai trò và kiểm tra hợp lệ phía máy chủ.
- Giữ xác minh/đặt lại nội bộ trong `FE02`, kết quả tư cách thành viên nội bộ
  trong `FE04` và thiết lập tài khoản nội bộ trong `FE11`; HTTP và nguồn không
  sở hữu nhận `403` an toàn.
- Dùng khóa chống gửi trùng hoặc mã định danh sự kiện nguồn để ngăn bản ghi thông báo
  trùng lặp.
- Giữ việc tạo thông điệp tập trung để các mẫu có thể kiểm thử.

## 11. Bối cảnh đợt FE07-FE12 2026-07-29

- FE07 sở hữu bốn sự kiện kết quả mượn; FE10 chịu trách nhiệm lưu dữ liệu, gửi
  thông báo và hiển thị hộp thư.
- `GENERAL_SYSTEM` chỉ hợp lệ khi khóa mẫu và loại thực thể nguồn thuộc cặp đã
  được phê duyệt.
- Backend ánh xạ cố định đường dẫn thao tác; bên gọi không được truyền URL.
- Dữ liệu gửi kết quả không chứa lý do từ chối hoặc dữ liệu nhạy cảm.
- Phạm vi thuộc `SL-002`; bản cập nhật cơ sở dữ liệu chỉ bổ sung mẫu, không thêm
  bảng hoặc kênh gửi.
