# SPEC.md - Quản lý thông báo FE10

# Phiên bản: 0.4.5

# Trạng thái: APPROVED - KHẮC PHỤC VIỆC GỬI EMAIL TRÊN MÔI TRƯỜNG TIỀN SẢN XUẤT 2026-07-27

# Chủ sở hữu: Nhat

# Cập nhật lần cuối: 2026-07-27

# ID tính năng: FE10

# Thư mục tính năng: `.sdd/specs/feat-notification-management/`

> Trạng thái bàn giao hiện tại (2026-07-20): `COMPLETE` cho phạm vi Giai đoạn 1 đã được phê duyệt.
> `TASKS.md` và `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`
> là nguồn chuẩn cho trạng thái triển khai hiện tại. Các nhãn cũ `Not Started`,
> `PARTIAL`, `READY FOR REVIEW` hoặc đang chờ rà soát được giữ lại bên dưới chỉ là
> ảnh chụp nhanh kế hoạch/bằng chứng lịch sử, không phải trạng thái bàn giao hiện tại.

> Nguồn chuẩn cho Quản lý thông báo FE10. Bản sửa đổi ranh giới OTP, thiết lập tài khoản và kết quả thành viên được phê duyệt làm mốc cơ sở 2026-07-17.
>
> Các quyết định ban đầu của Giai đoạn 1 đã được phê duyệt ngày 2026-06-10. G1-G7 được phê duyệt ngày 2026-07-13. G8-G10 và ADR-004 được Nhat phê duyệt ngày 2026-07-15 và thay thế hợp đồng OTP/liên kết từng bị trì hoãn.
>
> ADR-005 bổ sung quy trình gửi thông báo thiết lập tài khoản FE11 chuẩn. Nhat đã phê duyệt mốc cơ sở FE10 hợp nhất ngày 2026-07-17; phần triển khai đã phê duyệt, nghiệm thu của con người, tích hợp PR và CI chính xác trên `main` sau khi hợp nhất đều đã hoàn tất cho phạm vi Giai đoạn 1.
>
> Biện pháp khắc phục an toàn gửi ngày 2026-07-23 bổ sung trạng thái bền vững
> `PROCESSING` đã được phê duyệt, để quyền sở hữu xử lý được cam kết trước I/O của nhà cung cấp và một
> lần gửi có kết quả không chắc chắn sẽ không bao giờ tự động được gửi lần thứ hai.
>
> Bản sửa đổi v0.4.4 tách việc kiểm tra an toàn định nghĩa mẫu đáng tin cậy khỏi thao tác
> thoát giá trị khi chạy: mã đánh dấu không an toàn đã lưu bị từ chối trước khi kết xuất,
> lưu bền hoặc gửi; các giá trị khi chạy vẫn được thoát/làm sạch.
> Nhat đã phê duyệt bản sửa đổi bằng văn bản này ngày 2026-07-27. Phê duyệt chỉ cho phép
> chuẩn bị PLAN/TASKS; chưa được tuyên bố đã triển khai cho đến khi
> hoàn tất bằng chứng RED-GREEN và các cổng nghiệm thu.
>
> Bản sửa đổi v0.4.5 khôi phục ba nghĩa vụ gửi đã được phê duyệt trước đó:
> cơ sở dữ liệu hiện có nhận mẫu `ACCOUNT_SETUP` chuẩn thông qua một
> bản di trú có tính lũy đẳng; lần gửi nhạy cảm thành công chỉ giữ lại
> ID thông điệp của nhà cung cấp trong lịch sử lần thử; và một tiến trình SYSTEM tùy chọn xử lý các bản ghi
> `PENDING` không nhạy cảm đã xếp hàng khi phần phụ trợ còn hoạt động. Điểm cuối thủ công
> được bảo vệ và chính sách chỉ thử lại thủ công vẫn không đổi. Trên gói
> F1 của môi trường tiền sản xuất, lịch này được xác định rõ là chỉ thực hiện trong khả năng tốt nhất vì Always On bị tắt.
> Người dùng đã phê duyệt thiết kế và hợp đồng bằng văn bản ngày 2026-07-27.

---

## 1. Tổng quan về tính năng

### 1.1 Tên tính năng

Quản lý thông báo

### 1.2 Bối cảnh nghiệp vụ

Hệ thống quản lý thư viện phải thông báo cho người dùng về các sự kiện đã được phê duyệt: xác minh tài khoản, đặt lại mật khẩu, thiết lập tài khoản, đặt chỗ đã sẵn sàng, sắp đến hạn trả, quá hạn, tiền phạt và kết quả tư cách thành viên. Nếu không có thông báo đáng tin cậy, Thành viên có thể bỏ lỡ thời hạn quan trọng, Thủ thư có thể phải giải đáp nhiều câu hỏi thủ công hơn và các luồng khôi phục tài khoản có thể bị chặn.

Quản lý thông báo cung cấp một nơi tập trung để tạo, gửi, lưu trữ và theo dõi các thông điệp này, đồng thời giữ các quyết định nghiệp vụ trong những tính năng nguồn tạo yêu cầu thông báo.

### 1.3 Mục tiêu / Kết quả

Hệ thống sẽ:

- Chấp nhận yêu cầu thông báo từ các tính năng nội bộ đã được phê duyệt.
- Gửi đồng bộ email OTP xác thực nhạy cảm qua bộ điều hợp nhà cung cấp đã cấu hình, dùng đối tượng mô phỏng được chèn trong kiểm thử và không lưu bền nội dung nhạy cảm đã kết xuất.
- Xếp hàng các thông báo email không nhạy cảm để tiến trình xử lý.
- Theo dõi việc gửi trong Giai đoạn 1 bằng `PENDING`, `PROCESSING`, `SENT` và `FAILED`; các giá trị tương thích `DELIVERED`, `SKIPPED` và `CANCELLED` không có chuyển đổi nào trong Giai đoạn 1.
- Giữ nội dung không nhạy cảm và mọi lần thử gửi ở trạng thái có thể truy vết mà không lưu bền, ghi nhật ký, ghi kiểm toán hoặc trả về bí mật hay nội dung xác thực nhạy cảm đã kết xuất.
- Hỗ trợ tám cặp loại/mẫu chuẩn của Giai đoạn 1 cho xác minh, đặt lại mật khẩu, thiết lập tài khoản, đặt chỗ sẵn sàng, nhắc hạn trả, thông báo quá hạn, thông báo tiền phạt và kết quả tư cách thành viên.

### 1.4 Mức đặc tả

- [ ] Đặc tả đầy đủ - logic nghiệp vụ cốt lõi, rủi ro cao, phải đúng ngay từ đầu
- [x] Đặc tả tiêu chuẩn - chức năng thông thường có quy tắc nghiệp vụ và kiểm tra hợp lệ
- [ ] Đặc tả rút gọn - giao diện đơn giản, tài liệu hoặc chức năng ít rủi ro

---

## 2. Tác nhân và quyền

| Tác nhân | Mô tả | Quyền / Trách nhiệm |
| ----- | ----------- | --------------------------- |
| Thành viên | Người dùng thư viện đã đăng ký | Nhận thông báo qua email liên quan đến đặt chỗ, ngày đến hạn, các khoản quá hạn và tiền phạt. |
| Thủ thư | Nhân viên thư viện | Có thể nhận thông báo vận hành nếu tính năng nguồn yêu cầu. |
| Quản trị viên | Quản trị viên hệ thống | Có thể nhận thông báo về tài khoản hoặc vận hành nếu tính năng nguồn yêu cầu. |
| Tính năng nguồn | Tính năng hệ thống nội bộ | Tạo yêu cầu qua trình yêu cầu được ràng buộc với `FE02`, `FE07`, `FE08`, `FE09`, `FE11` hoặc `SYSTEM`. FE02 sở hữu xác minh/đặt lại; FE11 sở hữu thiết lập tài khoản. |
| Trình yêu cầu nguồn nội bộ | Ranh giới FE10 trong tiến trình | Ràng buộc một nguồn thuộc danh sách cho phép khi khởi tạo, từ chối ghi đè nguồn, áp dụng chính sách quyền sở hữu nguồn/loại và không phải vai trò đăng nhập. |
| Tiến trình xử lý thông báo | Thành phần hệ thống | Gửi các thông báo không nhạy cảm đã xếp hàng và ghi lại các lần thử. |
| Nhà cung cấp email | Bộ điều hợp đã cấu hình hoặc nhà cung cấp mô phỏng được chèn | Gửi email trong môi trường triển khai và các kiểm thử có tính xác định. |
| Khách | Khách truy cập chưa xác thực | Không có quyền quản lý thông báo nhưng có thể nhận email xác minh/đặt lại tài khoản. |

---

## 3. Điều kiện tiên quyết

Tính năng này chỉ có thể bắt đầu khi:

- PRE-FE10-001: Tính năng nguồn đã xác định rằng cần phải có thông báo và gửi yêu cầu thông qua ranh giới FE10 đã được phê duyệt.
- PRE-FE10-002: Người dùng nhận thông báo tồn tại hoặc tính năng nguồn cung cấp email an toàn của Khách cho các luồng liên quan đến tài khoản.
- PRE-FE10-003: Loại thông báo và khóa mẫu tạo thành một cặp chuẩn được phê duyệt.
- PRE-FE10-004: Kênh bắt buộc trong Giai đoạn 1 là `EMAIL`; gửi trong ứng dụng vẫn là công việc tương lai.
- PRE-FE10-005: Thiết lập nhà cung cấp email đã cấu hình nằm ngoài mã nguồn hoặc kiểm thử được cung cấp một nhà cung cấp mô phỏng được chèn.
- PRE-FE10-006: Các API HTTP thông báo được bảo vệ do người dùng `LIBRARIAN` hoặc `ADMIN` đã xác thực gọi cho loại thông báo không nhạy cảm, hoặc người gọi nội bộ dùng trình yêu cầu nguồn được ràng buộc khi khởi tạo. Xác minh/đặt lại yêu cầu quyền sở hữu FE02; thiết lập tài khoản yêu cầu quyền sở hữu FE11.

---

## 4. Luồng chính

### MF-FE10-001: Gửi thông báo xác minh tài khoản

1. FE02 tạo OTP xác minh gồm sáu chữ số, chỉ lưu hàm băm của OTP trong `AuthTokens` và nhận `tokenId` đã được lưu bền.
2. FE02 yêu cầu gửi `ACCOUNT_VERIFICATION` qua trình yêu cầu được ràng buộc với `FE02`, kèm email người nhận, mẫu chuẩn `ACCOUNT_VERIFICATION`, `otp`, `expiresInMinutes`, `sourceEntityType: AuthToken`, `sourceEntityId: tokenId` và khóa lũy đẳng suy ra từ ID mã thông báo.
3. FE10 kiểm tra người nhận, kênh email, cặp loại/mẫu chuẩn, quyền sở hữu nguồn, tham chiếu nguồn dạng số nguyên, khóa lũy đẳng và dữ liệu mẫu OTP bắt buộc.
4. FE10 xác nhận rằng hệ thống không chịu trách nhiệm tạo hoặc xác thực OTP.
5. FE10 lưu bền siêu dữ liệu nguồn an toàn ở trạng thái `PROCESSING` trước I/O của nhà cung cấp, nhưng tuyệt đối không lưu OTP hay tiêu đề/nội dung nhạy cảm đã kết xuất.
6. FE10 kết xuất và gửi đồng bộ thông điệp qua bộ điều hợp nhà cung cấp đã cấu hình, chỉ dùng dữ liệu thô trong bộ nhớ, sau đó ghi `SENT` hoặc `FAILED` cùng lần thử.
7. FE10 trả về `{ notificationId, status }`, trong đó trạng thái là `SENT` hoặc `FAILED`.

### MF-FE10-002: Gửi thông báo đặt lại mật khẩu

1. FE02 tạo OTP đặt lại mật khẩu gồm sáu chữ số, chỉ lưu hàm băm của OTP trong `AuthTokens` và nhận `tokenId` đã được lưu bền.
2. FE02 yêu cầu gửi `PASSWORD_RESET` qua trình yêu cầu được ràng buộc với `FE02`, kèm email người nhận, mẫu chuẩn `PASSWORD_RESET`, `otp`, `expiresInMinutes`, `sourceEntityType: AuthToken`, `sourceEntityId: tokenId` và khóa lũy đẳng suy ra từ ID mã thông báo.
3. FE10 kiểm tra người nhận, kênh email, cặp loại/mẫu chuẩn, quyền sở hữu nguồn, tham chiếu nguồn dạng số nguyên, khóa lũy đẳng và dữ liệu mẫu OTP bắt buộc.
4. FE10 xác nhận rằng FE02 sở hữu việc tạo và xác thực OTP.
5. FE10 lưu bền siêu dữ liệu nguồn an toàn ở trạng thái `PROCESSING` trước I/O của nhà cung cấp, nhưng tuyệt đối không lưu OTP hay tiêu đề/nội dung nhạy cảm đã kết xuất.
6. FE10 kết xuất và gửi đồng bộ thông điệp qua bộ điều hợp nhà cung cấp đã cấu hình, chỉ dùng dữ liệu thô trong bộ nhớ, sau đó ghi `SENT` hoặc `FAILED` cùng lần thử.
7. FE10 trả về `{ notificationId, status }`, trong đó trạng thái là `SENT` hoặc `FAILED`.

### MF-FE10-003: Gửi thông báo đặt sách

1. FE08 Quản lý đặt chỗ yêu cầu gửi thông báo đặt chỗ khi trạng thái đặt chỗ thay đổi hoặc một cuốn sách đã đặt trước trở nên sẵn có.
2. FE10 kiểm tra người nhận, kênh email, cặp `RESERVATION_AVAILABLE -> RESERVATION_READY` chuẩn và dữ liệu mẫu đặt trước.
3. FE10 xác nhận rằng FE08 sở hữu hàng đợi đặt chỗ và quyết định về tình trạng sẵn có.
4. FE10 từ chối đệ quy các khóa giống bí mật trong dữ liệu xếp hàng và tạo thông báo `PENDING` không nhạy cảm có nội dung đã kết xuất.
5. Tiến trình xử lý thông báo nhận bản ghi một cách nguyên tử dưới trạng thái `PROCESSING`, cam kết quyền nhận xử lý đó rồi mới gọi bộ điều hợp nhà cung cấp đã cấu hình.
6. FE10 ghi `SENT` hoặc `FAILED` cùng lần thử gửi mà không thay đổi trạng thái FE08.

### MF-FE10-004: Gửi thông báo ngày đến hạn hoặc tiền phạt

1. FE07 Quản lý mượn sách hoặc FE09 Quản lý tiền phạt yêu cầu gửi thông báo sắp đến hạn, quá hạn hoặc tiền phạt.
2. FE10 kiểm tra người nhận, kênh email, cặp loại/mẫu chuẩn và dữ liệu mẫu hạn trả/tiền phạt.
3. FE10 xác nhận FE07 sở hữu các quyết định về hạn trả/mượn sách và FE09 sở hữu việc tính tiền phạt.
4. FE10 từ chối đệ quy các khóa giống bí mật trong dữ liệu xếp hàng và tạo thông báo `PENDING` không nhạy cảm có nội dung đã kết xuất.
5. Tiến trình xử lý thông báo nhận bản ghi một cách nguyên tử dưới trạng thái `PROCESSING`, cam kết quyền nhận xử lý đó rồi mới gọi bộ điều hợp nhà cung cấp đã cấu hình.
6. FE10 ghi `SENT` hoặc `FAILED` cùng lần thử gửi mà không thay đổi trạng thái nguồn. Việc tích hợp người gọi FE09 vẫn được trì hoãn cho đến khi thực sự có người gọi.

### MF-FE10-005: Gửi thông báo thiết lập tài khoản do quản trị viên tạo

1. FE11 tạo mã thông báo `ACCOUNT_SETUP` an toàn về mặt mật mã, chỉ lưu hàm băm của mã thông báo trong `AuthTokens` và nhận ID mã thông báo đã được lưu bền.
2. FE11 yêu cầu gửi `ACCOUNT_SETUP` qua trình yêu cầu được ràng buộc với `FE11`, kèm email người nhận, mẫu chuẩn `ACCOUNT_SETUP`, `setupLink`, `expiresInHours`, `sourceEntityType: AuthToken`, `sourceEntityId: tokenId` và khóa lũy đẳng `FE11:ACCOUNT_SETUP:<tokenId>`.
3. FE10 kiểm tra quyền sở hữu FE11, cặp chuẩn, biến bắt buộc, ID nguồn dạng số nguyên và tính lũy đẳng.
4. FE10 chỉ lưu bền siêu dữ liệu nguồn an toàn ở trạng thái `PROCESSING` trước I/O của nhà cung cấp, còn liên kết thiết lập chỉ tồn tại trong bộ nhớ của yêu cầu/nhà cung cấp.
5. FE10 kết xuất và gửi đồng bộ qua bộ điều hợp nhà cung cấp đã cấu hình, sau đó ghi `SENT` hoặc `FAILED`, bản tóm tắt lỗi chung khi áp dụng và dữ liệu lần thử.
6. FE10 trả về `{ notificationId, status }` mà không trả về mã thông báo thiết lập, liên kết, tiêu đề/nội dung đã kết xuất hoặc chi tiết nhà cung cấp.

### MF-FE10-006: Xếp hàng thông báo kết quả tư cách thành viên

1. FE04 cam kết quyết định phê duyệt hoặc từ chối rồi yêu cầu `GENERAL_SYSTEM -> MEMBERSHIP_RESULT` qua trình yêu cầu được ràng buộc với `FE04`.
2. FE10 kiểm tra quyền sở hữu FE04, người nhận, tham chiếu nguồn của hồ sơ đăng ký dạng số nguyên, cặp chuẩn, dữ liệu mẫu không nhạy cảm bắt buộc và khóa lũy đẳng.
3. FE10 tạo đúng một thông báo `PENDING` cho khóa lũy đẳng mới và trả về `{ notificationId, status }`.
4. Sau đó, tiến trình xử lý cam kết `PROCESSING` trước I/O của nhà cung cấp rồi ghi `SENT` hoặc `FAILED` cùng lần thử gửi an toàn; lỗi gửi không bao giờ thay đổi quyết định FE04 đã cam kết.

---

## 5. Luồng thay thế

### AF-FE10-001: Người nhận bị thiếu hoặc không hợp lệ

1. Tính năng nguồn gửi yêu cầu thông báo mà không có dữ liệu người nhận hợp lệ.
2. FE10 trả về lỗi kiểm tra hợp lệ 4xx an toàn.
3. FE10 không tạo bản ghi thông báo hoặc lần thử gửi.

### AF-FE10-002: Sự kiện nguồn trùng lặp

1. Tính năng nguồn gửi cùng một khóa lũy đẳng nhiều lần.
2. FE10 trả về `200 { notificationId, status }` cho bản ghi hiện có, bất kể trạng thái, thay vì tạo hoặc gửi bản trùng.

### AF-FE10-003: Thiếu mẫu, không hoạt động hoặc không an toàn

1. Tính năng nguồn yêu cầu một khóa mẫu không tồn tại, không hoạt động hoặc có tiêu đề/nội dung đã lưu chứa mã đánh dấu có thể thực thi không an toàn.
2. FE10 trả về lỗi kiểm tra hợp lệ/mẫu 4xx an toàn trước khi kết xuất hoặc tạo bản ghi thông báo.
3. FE10 không lưu bền nội dung yêu cầu không hợp lệ; trạng thái `FAILED` đã lưu chỉ dành cho yêu cầu được chấp nhận nhưng nhà cung cấp gửi thất bại.
4. Cặp loại/mẫu không khớp luôn bị từ chối trước khi gửi hoặc lưu bền vào hàng đợi; cờ hay bí danh do người gọi cung cấp không bao giờ được dùng để chuyển đổi cặp đó.
5. FE10 không làm sạch một định nghĩa mẫu đã lưu không an toàn để biến nó thành mẫu được chấp nhận. Các giá trị khi chạy được chèn vào một định nghĩa vốn an toàn vẫn được thoát hoặc làm sạch.

### AF-FE10-004: Nhà cung cấp email không khả dụng

1. FE10 hoặc tiến trình xử lý thông báo cố gửi email.
2. Nhà cung cấp không khả dụng hoặc trả về lỗi.
3. FE10 ghi `FAILED`, một lần thử và lý do lỗi an toàn khi chuyển đổi sang trạng thái cuối được cam kết; không lưu bền hay trả về bí mật hoặc chi tiết nhà cung cấp.
4. Thông báo không nhạy cảm đã xếp hàng nhưng gửi thất bại có thể được thử lại thủ công trên cùng bản ghi. Thông báo xác thực nhạy cảm gửi thất bại phải do nguồn phát hành lại và điểm cuối thử lại trả về `409 REISSUE_REQUIRED`.
5. Giao dịch nghiệp vụ ban đầu trong tính năng nguồn vẫn hoàn tất.
6. Nếu I/O của nhà cung cấp hoàn tất nhưng không thể lưu bền chuyển đổi sang trạng thái cuối, bản ghi vẫn ở `PROCESSING`; cả xử lý tự động và thử lại thủ công đều không được gửi lại, đồng thời thử lại thủ công trả về `409 DELIVERY_STATE_UNCERTAIN`.

### AF-FE10-005: Đã tắt thông báo tùy chọn

1. Tùy chọn nhận thông báo và cơ chế ngăn gửi thông báo nằm ngoài phạm vi Giai đoạn 1.
2. FE10 không đánh giá `UserNotificationPreferences` và không tạo bản ghi `SKIPPED` trong Giai đoạn 1.

### AF-FE10-006: Loại xác thực nhạy cảm được gửi sai ranh giới

1. Người gọi HTTP của nhân viên gửi `ACCOUNT_VERIFICATION`, `PASSWORD_RESET` hoặc `ACCOUNT_SETUP`; người yêu cầu không phải FE02 gửi loại thuộc sở hữu của FE02; hoặc người yêu cầu không phải FE11 gửi `ACCOUNT_SETUP`.
2. FE10 trả về `403 SENSITIVE_NOTIFICATION_INTERNAL_ONLY` kèm thông báo `Sensitive authentication notifications must be requested internally.` trước khi kết xuất mẫu, lưu bền hoặc gửi qua nhà cung cấp.
3. Không tạo bản ghi thông báo hoặc lần thử gửi nào.

---

## 6. Quy tắc nghiệp vụ

Dùng các ID ổn định này cho nhiệm vụ và kiểm thử.

- BR-FE10-001: FE10 không được quyết định sự kiện nghiệp vụ nguồn; tính năng nguồn quyết định khi nào cần thông báo.
- BR-FE10-002: FE10 phải kiểm tra người nhận, kênh `EMAIL`, tham chiếu nguồn dạng số nguyên, dữ liệu mẫu bắt buộc và cặp loại/mẫu chuẩn do máy chủ thực thi trước khi tạo hoặc gửi thông báo. Các cặp chuẩn là `ACCOUNT_VERIFICATION -> ACCOUNT_VERIFICATION`, `PASSWORD_RESET -> PASSWORD_RESET`, `ACCOUNT_SETUP -> ACCOUNT_SETUP`, `RESERVATION_AVAILABLE -> RESERVATION_READY`, `DUE_DATE_REMINDER -> DUE_DATE_REMINDER`, `OVERDUE_NOTICE -> OVERDUE_NOTICE`, `FINE_NOTICE -> FINE_NOTICE` và `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`.
- BR-FE10-003: FE10 không được tạo hoặc xác thực OTP dùng cho xác thực hay mã thông báo xác minh/đặt lại kiểu cũ.
- BR-FE10-004: FE10 không được lưu bền, ghi nhật ký, ghi kiểm toán hoặc trả về mã thông báo thô, giá trị OTP, mật khẩu, liên kết xác minh/đặt lại/thiết lập, tiêu đề/nội dung xác thực nhạy cảm đã kết xuất, thông tin xác thực/chi tiết của nhà cung cấp hoặc dấu vết ngăn xếp nội bộ. `templateData` không nhạy cảm đã xếp hàng và `safePayload` đã lưu phải duyệt đệ quy qua đối tượng/mảng, đồng thời chuẩn hóa khóa bằng cách chuyển thành chữ thường và bỏ `_`, `-` cùng khoảng trắng. Yêu cầu xếp hàng bị từ chối khi khóa đã chuẩn hóa chứa `token`, `otp`, `password`, `verificationlink`, `resetlink` hoặc `setuplink`; các khóa tương tự bị che khỏi `safePayload`.
- BR-FE10-005: Mọi yêu cầu nguồn trong tiến trình phải chứa `sourceFeature`, `sourceEntityType`, `sourceEntityId` dạng số nguyên và một khóa lũy đẳng; người gọi không thể ghi đè siêu dữ liệu đã ràng buộc. Yêu cầu HTTP dùng hợp đồng được bảo vệ riêng và không thể cung cấp `sourceFeature`.
- BR-FE10-006: Một khóa lũy đẳng ánh xạ tới một bản ghi thông báo xuyên suốt mọi trạng thái. Yêu cầu trùng phải phát lại bản tóm tắt bản ghi hiện có và không được tạo hoặc gửi bản trùng.
- BR-FE10-007: FE10 phải hỗ trợ tám cặp loại/mẫu Giai đoạn 1 đã phê duyệt, gồm `ACCOUNT_SETUP -> ACCOUNT_SETUP` và `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`; không hỗ trợ bí danh hay cặp không được lập tài liệu.
- BR-FE10-008: Lần gửi thông báo thất bại phải được ghi cùng lý do lỗi an toàn và số lần thử. Chỉ thông báo không nhạy cảm đã xếp hàng nhưng gửi thất bại mới được thử lại thủ công trên cùng bản ghi; việc gửi thông báo xác thực nhạy cảm thất bại yêu cầu sự kiện nguồn mới. Bản ghi `PROCESSING` có kết quả nhà cung cấp không chắc chắn và không được tự động hay thủ công nhận lại hoặc thử lại.
- BR-FE10-009: Thông tin xác thực của nhà cung cấp email phải được lưu trữ bên ngoài mã nguồn.
- BR-FE10-010: Mẫu thông báo phải khai báo biến bắt buộc, thực thi cặp chuẩn và không được âm thầm kết xuất khi thiếu dữ liệu bắt buộc. Định nghĩa Giai đoạn 1 là văn bản thuần cộng các mã `{{variable}}`. Trước khi kết xuất bất kỳ yêu cầu nào, FE10 phải từ chối tiêu đề/nội dung đã lưu có cú pháp thẻ HTML thô (bao gồm `<script>`), thuộc tính xử lý sự kiện nội tuyến hoặc URL `javascript:`, thay vì làm sạch định nghĩa đó thành một mẫu được chấp nhận. Các giá trị mẫu khi chạy được chèn vào một định nghĩa vốn an toàn vẫn được thoát hoặc làm sạch. Cả `ACCOUNT_VERIFICATION` và `PASSWORD_RESET` đều yêu cầu `otp` cùng `expiresInMinutes`; `ACCOUNT_SETUP` yêu cầu `setupLink` và `expiresInHours`.
- BR-FE10-011: Các điểm cuối HTTP thông báo phải được bảo vệ khỏi người gọi công khai/Thành viên và chỉ cho phép `LIBRARIAN`/`ADMIN` đối với loại không nhạy cảm. Người gọi HTTP không thể cung cấp `sourceFeature` và phải nhận lỗi an toàn `403 SENSITIVE_NOTIFICATION_INTERNAL_ONLY` cho `ACCOUNT_VERIFICATION`, `PASSWORD_RESET` hoặc `ACCOUNT_SETUP`. Yêu cầu nguồn trong tiến trình dùng `createSourceNotificationRequester(sourceFeature)` với danh sách cho phép `FE02`, `FE04`, `FE07`, `FE08`, `FE09`, `FE11`, `SYSTEM`; chỉ FE02 được gửi xác minh/đặt lại, chỉ FE04 được gửi `MEMBERSHIP_RESULT` và chỉ FE11 được gửi thiết lập tài khoản; `SYSTEM` không phải vai trò đăng nhập.
- BR-FE10-012: Lỗi gửi thông báo không được tự động hoàn tác giao dịch nghiệp vụ nguồn.
- BR-FE10-013: Thay đổi trạng thái thông báo và bản ghi kiểm toán yêu cầu nguồn phải có khả năng truy vết bằng siêu dữ liệu an toàn. Bản ghi kiểm toán nguồn dùng `userId: null` cùng siêu dữ liệu nguồn đã ràng buộc; thao tác thử lại giữ nguyên ID thông báo, khóa lũy đẳng và lịch sử lần thử. Việc nhận xử lý phải cam kết nguyên tử `PENDING -> PROCESSING` trước I/O của nhà cung cấp, còn chuyển đổi sang trạng thái cuối phải được bảo vệ từ `PROCESSING`.
- Kết quả thành công của nhà cung cấp chỉ lưu bền giá trị đã chuẩn hóa
  `providerMessageId` trong `NotificationAttempts`; không sao chép toàn bộ phản hồi của nhà cung cấp,
  nội dung nhạy cảm đã kết xuất, mã thông báo, OTP, liên kết thiết lập hoặc nội dung của người nhận
  vào bản ghi kiểm toán, nhật ký, HTTP hay nội dung thông báo.
- Xử lý SYSTEM tự động được ràng buộc khi khởi tạo và ghi siêu dữ liệu kiểm toán tổng hợp
  với `UserId = NULL`; nó không bao giờ giả mạo một Quản trị viên hoặc Thủ thư.

---

## 7. Yêu cầu chức năng

- FR-FE10-001: Khi trình yêu cầu được ràng buộc với `FE02` gửi dữ liệu OTP xác minh tài khoản chuẩn gồm `otp`, `expiresInMinutes` và tham chiếu nguồn `AuthToken`, FE10 phải chỉ lưu bền siêu dữ liệu nguồn an toàn dưới trạng thái `PROCESSING` trước I/O của nhà cung cấp, kết xuất/gửi đồng bộ qua bộ điều hợp nhà cung cấp đã cấu hình, ghi bản tóm tắt `SENT` hoặc `FAILED` đã che dữ liệu cùng lần thử khi chuyển đổi trạng thái cuối được cam kết, rồi trả về `{ notificationId, status }` mà không tạo, xác thực, lưu bền, ghi nhật ký, ghi kiểm toán hoặc trả về OTP.
- FR-FE10-002: Khi trình yêu cầu được ràng buộc với `FE02` gửi dữ liệu OTP đặt lại mật khẩu chuẩn gồm `otp`, `expiresInMinutes` và tham chiếu nguồn `AuthToken`, FE10 phải chỉ lưu bền siêu dữ liệu nguồn an toàn dưới trạng thái `PROCESSING` trước I/O của nhà cung cấp, kết xuất/gửi đồng bộ qua bộ điều hợp nhà cung cấp đã cấu hình, ghi bản tóm tắt `SENT` hoặc `FAILED` đã che dữ liệu cùng lần thử khi chuyển đổi trạng thái cuối được cam kết, rồi trả về `{ notificationId, status }` mà không làm lộ nội dung nhạy cảm thô hay đã kết xuất.
- FR-FE10-003: Khi FE04 yêu cầu gửi kết quả tư cách thành viên chuẩn hoặc FE08 yêu cầu gửi thông báo đặt chỗ sẵn sàng chuẩn bằng dữ liệu không nhạy cảm hợp lệ, FE10 phải tạo một thông báo `PENDING` đã xếp hàng mà không quyết định kết quả nghiệp vụ của tính năng nguồn; tiến trình xử lý sẽ xử lý thông báo sau.
- FR-FE10-004: Khi FE07 hoặc người gọi FE09 trong tương lai yêu cầu gửi thông báo chuẩn về hạn trả, quá hạn hoặc tiền phạt bằng dữ liệu không nhạy cảm hợp lệ, FE10 phải tạo một thông báo `PENDING` đã xếp hàng mà không tính tiền phạt hay thay đổi trạng thái mượn. Việc tích hợp người gọi FE09 vẫn được trì hoãn.
- FR-FE10-005: Khi kiểm tra trường bắt buộc, tham chiếu nguồn dạng số nguyên, ánh xạ chuẩn, người nhận, quyền sở hữu nguồn/loại, ghi đè nguồn qua HTTP, độ an toàn của dữ liệu xếp hàng hoặc độ an toàn của định nghĩa mẫu đã lưu không đạt, FE10 phải từ chối yêu cầu an toàn trước khi kết xuất, lưu bền hoặc gửi.
- FR-FE10-006: Trước khi gọi nhà cung cấp đã cấu hình, FE10 phải cam kết yêu cầu đã chấp nhận hoặc quyền nhận xử lý của tiến trình dưới trạng thái `PROCESSING`. Khi nhà cung cấp chấp nhận gửi, FE10 phải bảo vệ chuyển đổi `PROCESSING -> SENT`, đặt `sentAt` bằng dấu thời gian máy chủ và ghi lần thử thành công; Giai đoạn 1 không bao giờ chuyển bản ghi sang `DELIVERED`.
- FR-FE10-007: Khi gửi thất bại, FE10 phải bảo vệ chuyển đổi `PROCESSING -> FAILED` và ghi chi tiết lần thử cùng lý do an toàn mà không hoàn tác luồng nguồn. Thử lại thủ công chỉ chuyển một bản ghi không nhạy cảm đã xếp hàng nhưng thất bại từ `FAILED` sang `PENDING`; thử lại thông báo nhạy cảm trả về lỗi an toàn `409 REISSUE_REQUIRED`; thử lại bản ghi `PROCESSING` trả về lỗi an toàn `409 DELIVERY_STATE_UNCERTAIN`.
- FR-FE10-008: Khi sự kiện nguồn trùng được gửi với cùng khóa lũy đẳng, FE10 phải trả về `200 { notificationId, status }` cho bản ghi hiện có ở bất kỳ trạng thái nào và không được tạo hoặc gửi bản trùng.
- FR-FE10-009: FE10 phải nhận biết đủ tám cặp chuẩn, gồm `ACCOUNT_SETUP -> ACCOUNT_SETUP` và `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`. Mẫu bị thiếu/không hoạt động, định nghĩa mẫu đã lưu không an toàn, biến nhạy cảm bắt buộc bị thiếu, cặp không khớp, nguồn nhạy cảm không được cấp quyền, ghi đè nguồn qua HTTP hoặc khóa giống bí mật trong dữ liệu xếp hàng được phát hiện đệ quy phải trả về lỗi 4xx an toàn trước khi kết xuất hoặc lưu bền mà không làm lộ giá trị đã gửi.
- FR-FE10-010: Khi trình yêu cầu được ràng buộc với `FE11` gửi dữ liệu thiết lập tài khoản chuẩn gồm `setupLink`, `expiresInHours` và tham chiếu nguồn `AuthToken`, FE10 phải lưu bền siêu dữ liệu nguồn an toàn dưới trạng thái `PROCESSING` trước I/O của nhà cung cấp, kết xuất/gửi đồng bộ, ghi trạng thái cuối và siêu dữ liệu lần thử an toàn khi chuyển đổi được cam kết, rồi trả về `{ notificationId, status }` mà không làm lộ nội dung thiết lập thô hay đã kết xuất.

---

## 8. Tiêu chí chấp nhận

- AC-FE10-001: Với việc trình yêu cầu được ràng buộc với `FE02` gửi dữ liệu OTP xác minh tài khoản chuẩn, khi FE10 gửi đồng bộ thì hệ thống trả về `{ notificationId, status }` với `SENT` hoặc `FAILED`, lưu bền siêu dữ liệu nguồn `AuthToken` an toàn và không lưu bền OTP hay nội dung nhạy cảm đã kết xuất.
- AC-FE10-002: Với việc trình yêu cầu được ràng buộc với `FE02` gửi dữ liệu OTP đặt lại mật khẩu chuẩn, khi FE10 gửi đồng bộ thì hệ thống trả về `{ notificationId, status }` với `SENT` hoặc `FAILED`, lưu bền siêu dữ liệu nguồn `AuthToken` an toàn và không lưu bền OTP hay nội dung nhạy cảm đã kết xuất.
- AC-FE10-003: Với việc FE04 gửi dữ liệu kết quả tư cách thành viên chuẩn hoặc FE08 gửi dữ liệu đặt chỗ sẵn sàng chuẩn, khi FE10 chấp nhận thì đúng một thông báo `PENDING` không nhạy cảm được xếp hàng mà FE10 không quyết định hay thay đổi kết quả nghiệp vụ nguồn.
- AC-FE10-004: Với việc FE07 gửi dữ liệu hạn trả chuẩn, khi FE10 chấp nhận thì một lời nhắc `PENDING` không nhạy cảm được xếp hàng mà FE10 không thay đổi trạng thái mượn.
- AC-FE10-005: Với việc người gọi FE09 trong tương lai gửi dữ liệu quá hạn/tiền phạt chuẩn, khi FE10 chấp nhận thì một thông báo `PENDING` không nhạy cảm được xếp hàng mà FE10 không tính tiền phạt; việc tích hợp người gọi FE09 hiện tại vẫn được trì hoãn.
- AC-FE10-006: Với từng cặp trong tám cặp chuẩn, gồm `ACCOUNT_SETUP -> ACCOUNT_SETUP` và `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`, khi FE10 kiểm tra một yêu cầu đầy đủ từ ranh giới được cấp quyền cùng định nghĩa mẫu đã lưu an toàn, thì kiểm tra ánh xạ đạt và các giá trị khi chạy được thoát/làm sạch. Với người nhận/biến bị thiếu, ID nguồn dạng chuỗi, cặp không khớp, mẫu không rõ/không hoạt động, định nghĩa mẫu đã lưu không an toàn, ghi đè nguồn qua HTTP, nguồn nhạy cảm không được cấp quyền hoặc khóa bí mật lồng nhau trong dữ liệu xếp hàng, việc kiểm tra trả về lỗi 4xx an toàn trước khi kết xuất, lưu bền, tạo lần thử hoặc gửi.
- AC-FE10-007: Với việc FE02 cung cấp OTP qua trình yêu cầu đã ràng buộc, khi FE10 gửi thì OTP cùng tiêu đề/nội dung nhạy cảm đã kết xuất không xuất hiện trong dữ liệu lưu bền, nhật ký, bản ghi kiểm toán hay phản hồi HTTP.
- AC-FE10-008: Với một khóa lũy đẳng đã tồn tại ở bất kỳ trạng thái nào, khi FE10 nhận yêu cầu trùng thì hệ thống trả về `200 { notificationId, status }` cho bản ghi đó và không gửi trùng.
- AC-FE10-009: Với lỗi gửi từ nhà cung cấp, khi FE10 ghi nhận lỗi thì luồng nguồn vẫn hoàn tất; bản ghi không nhạy cảm đã xếp hàng nhưng thất bại có thể thử lại trên cùng lịch sử, còn thử lại thông báo nhạy cảm trả về lỗi an toàn `409 REISSUE_REQUIRED`. Với trường hợp I/O của nhà cung cấp hoàn tất nhưng lưu bền trạng thái cuối thất bại, hàng vẫn ở `PROCESSING`, thao tác phát lại trùng không gửi và thử lại trả về lỗi an toàn `409 DELIVERY_STATE_UNCERTAIN`.
- AC-FE10-010: Với việc trình yêu cầu được ràng buộc với `FE11` gửi dữ liệu thiết lập tài khoản chuẩn, khi FE10 gửi đồng bộ thì hệ thống trả về bản tóm tắt `SENT`/`FAILED` an toàn, lưu bền siêu dữ liệu `AuthToken` an toàn và không lưu bền hay trả về mã thông báo/liên kết/nội dung thiết lập đã kết xuất.

---

## 9. Trường hợp biên và xử lý lỗi

| ID | Trường hợp biên / Lỗi | Hành vi hệ thống dự kiến |
| -- | ----------------- | ------------------------ |
| EC-FE10-001 | Người dùng nhận thông báo không tồn tại | Trả về lỗi an toàn `404`; không tạo thông báo hay lần thử. |
| EC-FE10-002 | Người nhận không có email cho kênh email | Trả về lỗi an toàn `400`; không tạo thông báo hay lần thử. |
| EC-FE10-003 | Định dạng email không hợp lệ | Trả về lỗi an toàn `400` trước khi gửi; không tạo thông báo hay lần thử. |
| EC-FE10-004 | Loại không được hỗ trợ hoặc khóa mẫu không khớp/không chuẩn, gồm `EMAIL_VERIFY` hoặc `DUE_OR_FINE_NOTICE` | Trả về lỗi an toàn `400`; cờ của người gọi không thể bỏ qua ánh xạ chuẩn; không tạo thông báo hay lần thử. |
| EC-FE10-005 | Kênh không được hỗ trợ | Trả về lỗi an toàn `400`; không tạo thông báo hay lần thử. |
| EC-FE10-006 | Khóa mẫu bị thiếu, không rõ hoặc không hoạt động | Trả về lỗi an toàn `400`; không tạo thông báo hay lần thử. |
| EC-FE10-007 | Thiếu biến mẫu bắt buộc | Trả về lỗi an toàn `400`; không tạo thông báo hay lần thử. |
| EC-FE10-008 | Khóa lũy đẳng bị trùng ở bất kỳ trạng thái nào | Trả về `200 { notificationId, status }` cho bản ghi hiện có mà không gửi trùng. |
| EC-FE10-009 | Nhà cung cấp email hết thời gian chờ | Ghi `FAILED` cùng một lần thử và lý do an toàn; nội dung nhạy cảm vẫn chỉ tồn tại trong bộ nhớ của nhà cung cấp. |
| EC-FE10-010 | Tiêu đề/nội dung mẫu đã lưu chứa cú pháp thẻ HTML thô (gồm `<script>`), thuộc tính xử lý sự kiện nội tuyến hoặc URL `javascript:` | Từ chối định nghĩa mẫu bằng lỗi kiểm tra hợp lệ an toàn trước khi kết xuất, lưu bền thông báo/lần thử hoặc gửi qua nhà cung cấp; không được âm thầm làm sạch rồi chấp nhận định nghĩa. Các giá trị khi chạy trong mẫu văn bản thuần cộng biến vốn an toàn vẫn được thoát/làm sạch. |
| EC-FE10-011 | Giao dịch nguồn hoàn tất nhưng gửi thất bại hoặc trình yêu cầu ném lỗi | Giữ giao dịch nguồn ở trạng thái hoàn tất; ghi nhận/xử lý an toàn lỗi FE10. Chỉ bản ghi không nhạy cảm đã xếp hàng nhưng thất bại mới được thử lại về `PENDING`. |
| EC-FE10-012 | Nhà cung cấp trả về các chi tiết nhạy cảm, người gọi ghi đè nguồn bị ràng buộc hoặc yêu cầu thử lại nhạy cảm | Chỉ lưu trữ một bản tóm tắt đã được làm sạch; từ chối ghi đè nguồn; thử lại nhạy cảm sẽ trả về `409 REISSUE_REQUIRED`. |
| EC-FE10-013 | Nhân viên qua HTTP hoặc trình yêu cầu không có quyền sở hữu gửi thông báo xác thực nhạy cảm | Trả về lỗi an toàn `403 SENSITIVE_NOTIFICATION_INTERNAL_ONLY`; FE02 sở hữu riêng việc xác minh/đặt lại và FE11 sở hữu riêng việc thiết lập tài khoản. |
| EC-FE10-014 | Lần gửi lại của FE02 phát hành mã thông báo OTP mới | Dùng `AuthTokens.TokenId` mới trong khóa lũy đẳng mới; không phát lại thông báo OTP trước đó. |
| EC-FE10-015 | Người gọi HTTP cung cấp `sourceFeature` | Trả về `400 SOURCE_FEATURE_HTTP_FORBIDDEN` với thông báo `Notification source cannot be supplied through HTTP.`; không tạo thông báo hay lần thử. |
| EC-FE10-016 | Gửi lại FE11 tạo mã thông báo thiết lập mới | Sử dụng khóa `AuthTokens.TokenId` và `FE11:ACCOUNT_SETUP:<tokenId>` mới; không bao giờ phát lại liên kết thiết lập trước đó. |
| EC-FE10-017 | Có kết quả từ nhà cung cấp nhưng lưu bền trạng thái cuối/lần thử thất bại | Giữ hàng đã cam kết ở `PROCESSING`; không tự động nhận lại hoặc gửi lại; phát lại trùng trả về cùng bản tóm tắt và thử lại thủ công trả về `409 DELIVERY_STATE_UNCERTAIN`. |

---

## 10. Yêu cầu về dữ liệu

### 10.1 Các thực thể có liên quan

| Thực thể | Mục đích trong tính năng này |
| ------ | ----------------------- |
| Users | Lưu danh tính và địa chỉ email của người nhận. |
| NotificationTemplates | Lưu các mẫu email đã phê duyệt và biến bắt buộc. Tiêu đề/nội dung đã lưu phải đạt kiểm tra an toàn định nghĩa mẫu trước mỗi lần kết xuất. |
| Notifications | Lưu tham chiếu nguồn, trạng thái, dữ liệu an toàn, nội dung không nhạy cảm đã kết xuất và bản tóm tắt nhạy cảm đã che dữ liệu. |
| NotificationAttempts | Lưu các lần thử gửi và chi tiết lỗi an toàn. |
| UserNotificationPreferences | Dành cho công việc tùy chọn/ưu tiên trong ứng dụng ở tương lai; không được dùng trong hạng mục tăng cường an toàn này. |

### 10.2 Trường dữ liệu

| Trường | Kiểu | Bắt buộc | Kiểm tra hợp lệ / Ghi chú |
| ----- | ---- | -------- | ------------------ |
| notificationId | integer | Có | Khóa chính. |
| userId | integer | Không | Bắt buộc với thông báo trong ứng dụng và dành riêng cho Thành viên. |
| recipientEmail | string | Có điều kiện | Bắt buộc để gửi email và được lưu bền dưới dạng `Notifications.RecipientEmail NVARCHAR(255) NOT NULL` nhằm khớp độ rộng email FE02/FE11. |
| type | enum | Có | Các giá trị: `ACCOUNT_VERIFICATION`, `PASSWORD_RESET`, `ACCOUNT_SETUP`, `RESERVATION_AVAILABLE`, `DUE_DATE_REMINDER`, `OVERDUE_NOTICE`, `FINE_NOTICE`, `GENERAL_SYSTEM`. |
| channel | enum | Có | Hạng mục tăng cường an toàn Giai đoạn 1 chấp nhận `EMAIL`; `IN_APP` vẫn là công việc tương lai. |
| templateKey | string | Có | Phải hoạt động và khớp ánh xạ loại/mẫu chuẩn. |
| title | string | Không | Chỉ là tiêu đề đã kết xuất của thông báo không nhạy cảm đã xếp hàng; tiêu đề xác thực nhạy cảm không được lưu bền. |
| body | string | Không | Chỉ là nội dung đã kết xuất của thông báo không nhạy cảm đã xếp hàng; nội dung xác thực nhạy cảm không được lưu bền. Không được chứa mã lệnh không an toàn. |
| safePayload | object | Không | Chỉ chứa siêu dữ liệu an toàn đã che dữ liệu đệ quy; các khóa đã chuẩn hóa giống bí mật bị loại bỏ/che theo cùng quy tắc kiểm tra yêu cầu xếp hàng. Bản ghi xác thực nhạy cảm không chứa OTP và chỉ có thể giữ một dấu hiệu đã che dữ liệu. |
| status | enum | Có | Vòng đời Giai đoạn 1 dùng `PENDING`, `PROCESSING`, `SENT` và `FAILED`. Việc tạo thông báo nhạy cảm lưu bền `PROCESSING` trước I/O của nhà cung cấp; thông báo không nhạy cảm bắt đầu ở `PENDING` và quyền nhận xử lý của tiến trình cam kết `PROCESSING`; chuyển đổi trạng thái cuối được bảo vệ từ `PROCESSING`; thử lại chỉ cho phép thông báo không nhạy cảm chuyển `FAILED -> PENDING`. `DELIVERED`, `SKIPPED` và `CANCELLED` chỉ được giữ làm giá trị tương thích cơ sở dữ liệu và không có chuyển đổi nào trong Giai đoạn 1. |
| sourceFeature | string | Bắt buộc với yêu cầu trong tiến trình | Các giá trị nội bộ đã ràng buộc: `FE02`, `FE04`, `FE07`, `FE08`, `FE09`, `FE11`, `SYSTEM`; người gọi HTTP không thể cung cấp trường này. Xác minh/đặt lại dùng FE02; kết quả tư cách thành viên dùng FE04; thiết lập tài khoản dùng FE11. |
| sourceEntityType | string | Bắt buộc với yêu cầu trong tiến trình | Ví dụ: `AuthToken`, `Reservation`, `Fine`, `BorrowDetail`. Yêu cầu xác thực nhạy cảm bắt buộc dùng `AuthToken`. |
| sourceEntityId | integer | Bắt buộc với yêu cầu trong tiến trình | Tham chiếu dương của Giai đoạn 1 tới bản ghi nguồn; giá trị bị thiếu và chuỗi đều bị từ chối. Yêu cầu xác thực nhạy cảm dùng `AuthTokens.TokenId` đã lưu bền. |
| idempotencyKey | string | Không | Ánh xạ một sự kiện nguồn tới một bản ghi thông báo xuyên suốt mọi trạng thái. FE02 suy ra khóa nhạy cảm từ loại cộng `AuthTokens.TokenId`, tuyệt đối không từ OTP. Thử lại dùng lại cùng khóa. |
| createdAt | datetime | Có | Dấu thời gian tạo thông báo. |
| sentAt | datetime | Không | Dấu thời gian máy chủ được đặt khi nhà cung cấp email Giai đoạn 1 chấp nhận lần gửi và chuyển đổi trạng thái cuối có bảo vệ được cam kết; là null khi ở `PENDING`/`PROCESSING` và sau lần thử thất bại. |
| attemptNo | integer | Không | Số thứ tự lần thử gửi. |
| errorMessage | string | Không | Chỉ chứa lý do lỗi đã làm sạch; không chứa chi tiết nhà cung cấp hay giá trị nhạy cảm đã gửi. |

### 10.3 Ánh xạ loại và mẫu chuẩn

| Loại thông báo | Khóa mẫu bắt buộc | Chế độ gửi |
| --- | --- | --- |
| `ACCOUNT_VERIFICATION` | `ACCOUNT_VERIFICATION` với `{{otp}}` và `{{expiresInMinutes}}` | Nhạy cảm đồng bộ, chỉ người yêu cầu FE02 |
| `PASSWORD_RESET` | `PASSWORD_RESET` với `{{otp}}` và `{{expiresInMinutes}}` | Nhạy cảm đồng bộ, chỉ người yêu cầu FE02 |
| `ACCOUNT_SETUP` | `ACCOUNT_SETUP` với `{{setupLink}}` và `{{expiresInHours}}` | Nhạy cảm đồng bộ, chỉ người yêu cầu FE11 |
| `RESERVATION_AVAILABLE` | `RESERVATION_READY` | Xếp hàng không nhạy cảm |
| `DUE_DATE_REMINDER` | `DUE_DATE_REMINDER` | Xếp hàng không nhạy cảm |
| `OVERDUE_NOTICE` | `OVERDUE_NOTICE` | Xếp hàng không nhạy cảm |
| `FINE_NOTICE` | `FINE_NOTICE` | Xếp hàng không nhạy cảm |
| `GENERAL_SYSTEM` | `MEMBERSHIP_RESULT` | Xếp hàng không nhạy cảm |

Mọi cặp khác đều bị từ chối. `EMAIL_VERIFY` và `DUE_OR_FINE_NOTICE` không phải là bí danh.

### 10.4 Vòng đời trạng thái Giai đoạn 1

- Thông báo không nhạy cảm: `PENDING -> PROCESSING -> SENT` hoặc `PENDING -> PROCESSING -> FAILED`.
- Thông báo không nhạy cảm gửi thất bại: `FAILED -> PENDING` chỉ qua điểm cuối thử lại thủ công được bảo vệ, sau đó áp dụng vòng đời nhận xử lý thông thường.
- Thông báo xác thực/thiết lập nhạy cảm: `[*] -> PROCESSING -> SENT` hoặc `[*] -> PROCESSING -> FAILED`; thử lại luôn yêu cầu sự kiện nguồn mới và khóa lũy đẳng mới.
- Một hàng còn ở `PROCESSING` sau I/O của nhà cung cấp có trạng thái gửi không chắc chắn. Hàng đó bị loại khỏi các lượt nhận xử lý của tiến trình và mọi đường thử lại để FE10 không thể gửi trùng.
- `DELIVERED`, `SKIPPED` và `CANCELLED` không được luồng Giai đoạn 1 tạo hay chuyển tới. Việc dùng chúng trong tương lai yêu cầu một bản sửa đổi SPEC đã được rà soát.

---

## 11. API / Hợp đồng giao diện

> Các điểm cuối và cấu trúc yêu cầu/phản hồi dưới đây là hợp đồng chuẩn của Giai đoạn 1 cho tính năng này.

| Phương thức | Điểm cuối | Tác nhân | Yêu cầu | Phản hồi | Ghi chú |
| ------ | -------- | ----- | ------- | -------- | ----- |
| POST | `/api/notifications/requests` | `LIBRARIAN`, `ADMIN` | `{ type, channel, userId?, recipientEmail?, templateKey, templateData, sourceEntityType?, sourceEntityId?, idempotencyKey? }` | Yêu cầu mới: `201 { notificationId, status }`; phát lại lũy đẳng: `200 { notificationId, status }`; loại nhạy cảm: lỗi an toàn `403` | Ranh giới HTTP cho thông báo không nhạy cảm được bảo vệ bằng vai trò. Không chấp nhận `sourceFeature`. Mọi loại xác thực nhạy cảm đều trả về `SENSITIVE_NOTIFICATION_INTERNAL_ONLY`. Tuyệt đối không trả về toàn bộ nội dung hoặc `safePayload`. |
| POST | `/api/notifications/process-pending` | `LIBRARIAN`, `ADMIN` | `{ limit?: number }` | `200 { processed, failed }` | Chỉ xử lý các bản ghi `PENDING` không nhạy cảm; không công khai. |
| POST | `/api/notifications/{id}/retry` | `LIBRARIAN`, `ADMIN` | Không có | Thành công: `200 { notificationId, status }`; xung đột: an toàn `409` | Chỉ các bản ghi xếp hàng không nhạy cảm bị lỗi mới quay trở lại `PENDING`. Xác thực nhạy cảm trả về `409 { code: "REISSUE_REQUIRED", message: "Create a new notification from the source event." }`. |
| Trong tiến trình | `createSourceNotificationRequester(sourceFeature)` | `FE02`, `FE04`, `FE07`, `FE08`, `FE09`, `FE11`, `SYSTEM` | Cùng yêu cầu thông báo nhưng không có `sourceFeature` do người gọi kiểm soát | Cùng ngữ nghĩa bản tóm tắt tối thiểu | Quyền sở hữu được ràng buộc khi khởi tạo: FE02 xác minh/đặt lại, FE04 kết quả tư cách thành viên, FE11 thiết lập tài khoản. Bản ghi kiểm toán nguồn dùng `userId: null`. |

Lỗi kiểm tra hợp lệ và lỗi mẫu dùng nội dung phản hồi 4xx an toàn. Trạng thái thử lại không hợp lệ dùng nội dung phản hồi `409` an toàn. Không phản hồi nào chứa nội dung đã kết xuất, bí mật đầu vào thô, chi tiết nhà cung cấp hoặc dấu vết ngăn xếp nội bộ.

Lỗi ranh giới nhạy cảm là `403 { error: { code: "SENSITIVE_NOTIFICATION_INTERNAL_ONLY", message: "Sensitive authentication notifications must be requested internally." } }`. Lỗi ghi đè `sourceFeature` qua HTTP là `400 { error: { code: "SOURCE_FEATURE_HTTP_FORBIDDEN", message: "Notification source cannot be supplied through HTTP." } }`.

---

## 12. Yêu cầu phi chức năng

### 12.1 Bảo mật

- NFR-FE10-SEC-001: Mọi API thông báo phải kiểm tra đầu vào ở máy chủ.
- NFR-FE10-SEC-002: API được bảo vệ phải thực thi quyền truy cập dựa trên vai trò trên máy chủ.
- NFR-FE10-SEC-003: Thông tin xác thực của nhà cung cấp email không được ghi cứng hoặc đưa vào kho mã.
- NFR-FE10-SEC-004: FE10 không được lưu bền, ghi nhật ký, ghi kiểm toán hoặc trả về mã thông báo thô, OTP, mật khẩu, liên kết đặt lại/xác minh/thiết lập, nội dung xác thực nhạy cảm đã kết xuất, thông tin xác thực/chi tiết của nhà cung cấp hoặc dấu vết ngăn xếp nội bộ.
- NFR-FE10-SEC-005: Kiểm tra an toàn định nghĩa mẫu và kết xuất giá trị khi chạy là hai cổng bảo mật riêng. FE10 phải từ chối cú pháp thẻ HTML thô, thuộc tính xử lý sự kiện nội tuyến và URL `javascript:` trong tiêu đề/nội dung mẫu đã lưu trước khi kết xuất, lưu bền hoặc gửi; hệ thống phải thoát hoặc làm sạch các giá trị khi chạy được chèn vào một định nghĩa văn bản thuần cộng biến vốn an toàn.
- NFR-FE10-SEC-006: Các điểm cuối thông báo HTTP phải yêu cầu `LIBRARIAN`/`ADMIN`, từ chối `sourceFeature` do người gọi kiểm soát và từ chối loại xác thực nhạy cảm bằng lỗi an toàn `403`; yêu cầu trong tiến trình phải dùng danh sách nguồn cho phép đã ràng buộc cố định, từ chối ghi đè nguồn, thực thi quyền sở hữu FE02 đối với xác minh/đặt lại và quyền sở hữu FE11 đối với thiết lập tài khoản.

### 12.2 Độ tin cậy

- NFR-FE10-REL-001: Lần gửi thất bại phải ghi số thứ tự lần thử, dấu thời gian và lý do lỗi an toàn.
- NFR-FE10-REL-002: Không được hoàn tác giao dịch nghiệp vụ nguồn chỉ vì gửi thông báo thất bại.
- NFR-FE10-REL-003: Sự kiện nguồn trùng phải phát lại một bản ghi xuyên suốt mọi trạng thái. Thử lại thủ công thông báo không nhạy cảm phải giữ nguyên ID thông báo, khóa lũy đẳng và lịch sử lần thử. I/O của nhà cung cấp chỉ được thực hiện sau khi quyền nhận xử lý `PROCESSING` đã được lưu bền, và hàng `PROCESSING` có kết quả không chắc chắn tuyệt đối không được tự động nhận lại.

### 12.3 Hiệu năng

- NFR-FE10-PERF-001: Việc tạo thông báo không nhạy cảm đã xếp hàng phải phản hồi trong vòng 500 ms tại p95 ở môi trường hiệu năng cục bộ/phát triển được dự án lập tài liệu. Việc gửi xác thực nhạy cảm đồng bộ không chịu mục tiêu chỉ dành cho hàng đợi này và bị giới hạn bởi độ trễ của nhà cung cấp đã cấu hình.
- NFR-FE10-PERF-002: Tra cứu thông báo phải áp dụng bộ lọc trạng thái, loại, tính năng nguồn và ngày tạo ngay trong truy vấn cơ sở dữ liệu trước khi hiện thực hóa các hàng; không cho phép lọc toàn bộ lịch sử ở tầng ứng dụng.

### 12.4 Ghi nhật ký và kiểm toán

- NFR-FE10-LOG-001: Mọi lần thử gửi thất bại phải được ghi vào `NotificationAttempts`.
- NFR-FE10-LOG-002: Nhật ký và bản ghi kiểm toán phải lưu bản tóm tắt an toàn, không lưu bí mật, nội dung xác thực nhạy cảm đã kết xuất hay phản hồi thô của nhà cung cấp. Bản ghi kiểm toán nguồn nội bộ dùng `userId: null` cùng siêu dữ liệu nguồn đã ràng buộc.

### 12.5 Khả năng sử dụng

- NFR-FE10-UX-001: Thông điệp thông báo phải rõ ràng, ngắn gọn và hướng tới hành động.
- NFR-FE10-UX-002: Thông báo lỗi hiển thị cho người dùng phải dễ hiểu và không làm lộ chi tiết kỹ thuật nội bộ.

---

## 13. Ngoài phạm vi

Tính năng này không bao gồm:

- Thông báo qua SMS.
- Thông báo đẩy di động.
- Các chiến dịch tiếp thị hoặc bản tin.
- Thông báo thanh toán trực tuyến.
- Tạo hoặc xác thực mã thông báo dùng cho xác thực.
- Tính tiền phạt.
- Quyết định xếp hàng đặt chỗ.
- Quyết định phê duyệt mượn/trả sách.
- Giao diện hộp thư/danh sách thông báo của người dùng.
- Đánh dấu thông báo trong ứng dụng là đã đọc.
- Màn hình nhật ký thông báo dành cho Quản trị viên/Thủ thư.
- Màn hình quản lý thử lại thủ công.
- Giao diện chỉnh sửa mẫu.
- Xây dựng trình soạn thảo thiết kế email đầy đủ.
- Lưu trữ thông tin xác thực của nhà cung cấp email thực trong kho lưu trữ.
- Nội dung xác thực nhạy cảm được xếp hàng đợi bằng văn bản gốc hoặc được mã hóa.
- Việc gửi `CHANGE_PASSWORD_OTP` FE02 chỉ để tương thích; nội dung này nằm ngoài hợp đồng FE10 Giai đoạn 1 chuẩn cho đến khi một loại thông báo/trường hợp sử dụng, thời hạn hết hiệu lực, phản hồi và hợp đồng thử lại riêng được phê duyệt.
- Trình gọi hoặc tích hợp thông báo FE09 mới.
- Siêu dữ liệu hết hiệu lực, giao diện thử lại hoặc các đợt tái cấu trúc giao diện/phần phụ trợ không liên quan.

---

## 14. Phụ thuộc

| Phụ thuộc | Loại | Ghi chú |
| ---------- | ---- | ----- |
| Xác thực FE02 | Nội bộ | Sở hữu việc tạo và xác thực OTP/mã thông báo, sau đó yêu cầu gửi OTP xác minh tài khoản và đặt lại mật khẩu qua trình yêu cầu được ràng buộc với `FE02`. Việc chấp nhận mã thông báo kiểu cũ và `CHANGE_PASSWORD_OTP` chỉ để tương thích vẫn thuộc FE02. |
| Quản lý mượn sách FE07 | Nội bộ | Có thể yêu cầu lời nhắc hạn trả và thông báo trạng thái mượn/trả. |
| Quản lý đặt chỗ FE08 | Nội bộ | Yêu cầu thông báo đặt chỗ đã sẵn sàng. |
| Quản lý tư cách thành viên FE04 | Nội bộ | Sở hữu sự kiện nguồn `MEMBERSHIP_RESULT` và dùng trình yêu cầu được ràng buộc với FE04 sau khi cam kết quyết định rà soát. |
| Quản lý tiền phạt FE09 | Nội bộ | Được phê duyệt/đưa vào danh sách cho phép đối với thông báo quá hạn và tiền phạt, nhưng hạng mục này chưa triển khai tích hợp người gọi hiện tại. |
| Quản lý người dùng và vai trò FE11 | Nội bộ | Sở hữu việc phát hành/gửi lại mã thông báo thiết lập do Quản trị viên tạo và yêu cầu `ACCOUNT_SETUP` chuẩn qua trình yêu cầu được ràng buộc với `FE11`. |
| Cơ sở dữ liệu SQL Server | Kỹ thuật | Lưu bản ghi thông báo, mẫu, lần thử và tùy chọn. |
| Bộ điều hợp nhà cung cấp email đã cấu hình hoặc nhà cung cấp mô phỏng được chèn | Kỹ thuật | Gửi thông báo email; môi trường triển khai dùng thiết lập nhà cung cấp đã cấu hình, còn kiểm thử chèn một đối tượng mô phỏng có tính xác định. |
| Bộ lập lịch/tiến trình xử lý | Kỹ thuật | Dùng ranh giới nguồn nội bộ `SYSTEM` và chỉ xử lý thông báo `PENDING` không nhạy cảm. |

---

## 15. Câu hỏi đã được giải quyết

| ID | Quyết định phê duyệt | Nguồn | Trạng thái |
| -- | ----------------- | ------ | ------ |
| Q-FE10-001 | Kênh bắt buộc của Giai đoạn 1 là email qua bộ điều hợp nhà cung cấp đã cấu hình; kiểm thử dùng nhà cung cấp mô phỏng được chèn. | Gói rà soát 2026-06-10; phê duyệt ADR-004 2026-07-15 | APPROVED |
| Q-FE10-002 | Thông báo trong ứng dụng là công việc tùy chọn/tương lai của Giai đoạn 1. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE10-003 | Các mẫu bắt buộc: xác minh, đặt lại mật khẩu, thiết lập tài khoản, nhắc hạn trả, thông báo quá hạn, thông báo tiền phạt, đặt chỗ sẵn sàng, kết quả tư cách thành viên. | Gói rà soát 2026-06-10; phê duyệt G1/G7 2026-07-13; ADR-005 2026-07-15 | APPROVED |
| Q-FE10-004 | Lưu các lần thử gửi thông báo và trạng thái. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE10-005 | Chỉ thử lại thủ công bản ghi không nhạy cảm đã xếp hàng nhưng thất bại trên cùng bản ghi/lịch sử; xác thực nhạy cảm yêu cầu nguồn phát hành lại và trả về `REISSUE_REQUIRED`. | Phê duyệt G5/G6 2026-07-13 | APPROVED |
| Q-FE10-006 | Lỗi thông báo không được chặn luồng nghiệp vụ nguồn. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE10-007 | Hệ thống/Bộ lập lịch có thể kích hoạt qua trình yêu cầu được ràng buộc với `SYSTEM`; nguồn nội bộ thuộc danh sách cho phép và không phải vai trò đăng nhập. | Phê duyệt G3 2026-07-13 | APPROVED |
| Q-FE10-008 | `ACCOUNT_SETUP` là thao tác gửi nhạy cảm thuộc FE11; chỉ trình yêu cầu được ràng buộc với FE11 mới được gửi và FE10 không lưu bền mã thông báo/liên kết/nội dung đã kết xuất của quá trình thiết lập. | ADR-005; Nhat phê duyệt 2026-07-15 | APPROVED |
| Q-FE10-009 | `MEMBERSHIP_RESULT` thuộc FE04; FE04 gửi qua trình yêu cầu được ràng buộc với FE04 sau khi quyết định tư cách thành viên được cam kết. | Kiểm toán liên tính năng FE04 2026-07-17 | APPROVED |
| Q-FE10-010 | Các trạng thái thông báo Giai đoạn 1 là `PENDING`, `PROCESSING`, `SENT` và `FAILED`; quyền nhận xử lý/chấp nhận thông báo nhạy cảm cam kết `PROCESSING` trước I/O của nhà cung cấp, còn các trạng thái tương thích không có chuyển đổi trong Giai đoạn 1. | Chuẩn hóa vòng đời thông báo 2026-07-17; biện pháp khắc phục an toàn gửi được phê duyệt 2026-07-23 | APPROVED |
| Q-FE10-011 | FE04 sử dụng `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`; FE08 sử dụng `RESERVATION_AVAILABLE -> RESERVATION_READY`; người gọi phải gửi cả hai trường chuẩn. | Chuẩn hóa hợp đồng nguồn 2026-07-17 | APPROVED |
| Q-FE10-012 | FE10 làm sạch hay từ chối một định nghĩa mẫu đã lưu không an toàn? | Nhat, 2026-07-27 | APPROVED: từ chối định nghĩa đã lưu trước khi kết xuất/lưu bền/gửi; tiếp tục thoát hoặc làm sạch giá trị khi chạy. |
| Q-FE10-013 | Môi trường tiền sản xuất dùng một tiến trình SYSTEM trong tiến trình có cơ chế bật tùy chọn, khoảng lặp mặc định 60 giây và kích thước lô 20. Tiến trình chạy một lần sau khi khởi động, ngăn các lượt chạy cục bộ chồng lấp, chỉ xử lý hàng `PENDING` không nhạy cảm và dừng cùng máy chủ HTTP. Điểm cuối nhân viên hiện có vẫn được bảo vệ và việc thử lại `FAILED` vẫn chỉ thủ công. Trạng thái ngủ của F1 tạm dừng tiến trình. | Phê duyệt của người dùng và thiết kế bằng văn bản 2026-07-27 | APPROVED |

---

## 15.1 Quyết định thiết kế được phê duyệt

Các quyết định ban đầu được phê duyệt trong gói rà soát Giai đoạn 1 ngày 2026-06-10. G1-G7 được Nhat phê duyệt ngày 2026-07-13 và thay thế mọi cách diễn đạt cũ còn mơ hồ.

| Quyết định | Câu trả lời được phê duyệt | Trạng thái |
| -------- | --------------- | ------ |
| Q-FE10-001 | Kênh bắt buộc của Giai đoạn 1 là email qua bộ điều hợp nhà cung cấp đã cấu hình; kiểm thử dùng nhà cung cấp mô phỏng được chèn. | APPROVED |
| Q-FE10-002 | Thông báo trong ứng dụng là công việc tùy chọn/tương lai của Giai đoạn 1. | APPROVED |
| Q-FE10-003 | Các mẫu bắt buộc gồm xác minh, đặt lại mật khẩu, thiết lập tài khoản, nhắc hạn trả, thông báo quá hạn, thông báo tiền phạt, đặt chỗ sẵn sàng và kết quả tư cách thành viên. | APPROVED |
| Q-FE10-004 | Lưu các lần thử gửi thông báo và trạng thái. | APPROVED |
| Q-FE10-005 | Chỉ thử lại bản ghi không nhạy cảm đã xếp hàng nhưng thất bại; xác thực nhạy cảm yêu cầu nguồn phát hành lại. | APPROVED |
| Q-FE10-006 | Lỗi thông báo không được chặn luồng nghiệp vụ nguồn. | APPROVED |
| Q-FE10-007 | Hệ thống/Bộ lập lịch dùng trình yêu cầu nội bộ đã ràng buộc và không phải vai trò đăng nhập. | APPROVED |
| Q-FE10-008 | Thiết lập tài khoản là thao tác gửi nhạy cảm đồng bộ thuộc quyền sở hữu của trình yêu cầu được ràng buộc với FE11. | APPROVED |
| Q-FE10-013 | Tiến trình SYSTEM bật tùy chọn chạy lúc khởi động và mặc định cứ 60 giây một lần, với kích thước lô 20, ngăn chạy cục bộ chồng lấp, dừng theo vòng đời, giữ nguyên phân quyền HTTP của nhân viên, chỉ thử lại lỗi thủ công và có giới hạn thực hiện trong khả năng tốt nhất rõ ràng trên F1. | APPROVED 2026-07-27 |
| G1 | Thông báo xác thực nhạy cảm được gửi đồng bộ mà không lưu bền nội dung đã kết xuất; thông báo không nhạy cảm vẫn được xếp hàng với cơ chế đệ quy bảo vệ khóa bí mật đã chuẩn hóa và che dữ liệu `safePayload` tương ứng. | APPROVED 2026-07-13 |
| G2 | Các thao tác tạo/phát lại/xử lý/thử lại chỉ trả về DTO tối thiểu đã phê duyệt. | APPROVED 2026-07-13 |
| G3 | `createSourceNotificationRequester(sourceFeature)` ràng buộc một nguồn trong `FE02`, `FE04`, `FE07`, `FE08`, `FE09`, `FE11`, `SYSTEM`; HTTP vẫn dùng `LIBRARIAN`/`ADMIN`. | APPROVED 2026-07-13; được mở rộng bởi ADR-005 2026-07-15 và kiểm toán FE04 2026-07-17 |
| G4 | `sourceEntityId` chỉ có số nguyên trong Giai đoạn 1. | APPROVED 2026-07-13 |
| G5 | Thử lại thủ công được bảo vệ và chỉ áp dụng cho bản ghi không nhạy cảm đã xếp hàng nhưng thất bại; thử lại thông báo nhạy cảm trả về `REISSUE_REQUIRED`. | APPROVED 2026-07-13 |
| G6 | Mỗi khóa lũy đẳng có một bản ghi xuyên suốt mọi trạng thái; thao tác thử lại dùng lại cùng lịch sử. | APPROVED 2026-07-13 |
| G7 | Các khóa xác thực chuẩn là `ACCOUNT_VERIFICATION` và `PASSWORD_RESET`; không có bí danh `EMAIL_VERIFY`. Việc trì hoãn FE02 ban đầu của quyết định này được G8-G10 thay thế. | APPROVED 2026-07-13; được thay thế một phần 2026-07-15 |
| G8 | FE02 tạo và xác thực OTP gồm sáu chữ số; FE10 kết xuất và gửi `otp` cùng `expiresInMinutes` qua trình yêu cầu được ràng buộc với `FE02` mà không lưu bền hay làm lộ OTP. | APPROVED 2026-07-15 |
| G9 | Nhân viên qua HTTP và trình yêu cầu nguồn không phải FE02 không thể gửi `ACCOUNT_VERIFICATION` hoặc `PASSWORD_RESET`; HTTP không thể cung cấp `sourceFeature`; vi phạm trả về lỗi an toàn `403 SENSITIVE_NOTIFICATION_INTERNAL_ONLY`. | APPROVED 2026-07-15 |
| G10 | Tính lũy đẳng và khả năng truy vết nguồn cho thông báo nhạy cảm dùng `AuthTokens.TokenId`; FE02 loại bỏ việc ghi thông báo xác minh/đặt lại trùng và gửi trực tiếp, đồng thời lỗi vẫn không chặn luồng và gửi lại sẽ tạo sự kiện nguồn mới. | APPROVED 2026-07-15 |
| G11 | FE11 sở hữu sự kiện nguồn `ACCOUNT_SETUP`; FE10 kiểm tra `setupLink`/`expiresInHours`, gửi đồng bộ, chỉ lưu siêu dữ liệu/trạng thái/lần thử an toàn và yêu cầu mã thông báo/sự kiện/khóa mới để gửi lại. | APPROVED 2026-07-15; ADR-005 |
| G12 | FE04 sở hữu sự kiện nguồn `MEMBERSHIP_RESULT`; FE10 chỉ chấp nhận từ trình yêu cầu được ràng buộc với FE04 và giữ lỗi gửi ở trạng thái không chặn luồng. | APPROVED 2026-07-17 |
| Q-FE10-010 | Các trạng thái Giai đoạn 1 là `PENDING`, `PROCESSING`, `SENT` và `FAILED`; `PROCESSING` được lưu bền trước I/O của nhà cung cấp và không bao giờ được tự động nhận lại. | APPROVED; sửa đổi 2026-07-23 |
| Q-FE10-011 | FE04 sử dụng `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`; FE08 sử dụng `RESERVATION_AVAILABLE -> RESERVATION_READY`. | APPROVED |
| Q-FE10-012 | Định nghĩa mẫu đã lưu không an toàn bị từ chối trước khi kết xuất/lưu bền/gửi; giá trị khi chạy vẫn được thoát/làm sạch. | APPROVED 2026-07-27 |

---

## 16. Ma trận truy vết

| ID AC | Tiêu chí chấp nhận | FR liên quan | BR liên quan | Kiểm thử bài tập | Nhiệm vụ tăng cường | Trạng thái |
| ----- | -------------------- | ---------- | ---------- | --------------- | -------------- | ------ |
| AC-FE10-001 | OTP xác minh tài khoản từ trình yêu cầu ràng buộc với FE02 được gửi đồng bộ bằng siêu dữ liệu nguồn an toàn và không lưu bền nội dung nhạy cảm | FR-FE10-001 | BR-FE10-001 đến BR-FE10-004, BR-FE10-005, BR-FE10-007 đến BR-FE10-011 | FT46 | FE10-S01 đến FE10-S04 | Đã phê duyệt để triển khai |
| AC-FE10-002 | OTP đặt lại mật khẩu từ trình yêu cầu ràng buộc với FE02 được gửi đồng bộ bằng siêu dữ liệu nguồn an toàn và không lưu bền nội dung nhạy cảm | FR-FE10-002 | BR-FE10-003 đến BR-FE10-005, BR-FE10-007 đến BR-FE10-011 | FT47 | FE10-S01 đến FE10-S04 | Đã phê duyệt để triển khai |
| AC-FE10-003 | Thông báo kết quả tư cách thành viên FE04 và đặt chỗ sẵn sàng FE08 được xếp hàng mà FE10 không thay đổi kết quả nguồn | FR-FE10-003 | BR-FE10-001, BR-FE10-002, BR-FE10-007, BR-FE10-011, BR-FE10-012 | FT48 cùng trường hợp trình yêu cầu FE04 đã lên kế hoạch | FE10-H02, FE10-H05, FE10-H07, G12 | Đã phê duyệt để triển khai |
| AC-FE10-004 | Thông báo hạn trả FE07 được xếp hàng mà không thay đổi trạng thái mượn | FR-FE10-004 | BR-FE10-001, BR-FE10-002, BR-FE10-007, BR-FE10-012 | FT49 | FE10-H02, FE10-H05, FE10-H06 | Đã phê duyệt để triển khai |
| AC-FE10-005 | Hợp đồng quá hạn/tiền phạt FE09 được phê duyệt mà FE10 không tính tiền phạt; tích hợp người gọi được trì hoãn | FR-FE10-004 | BR-FE10-001, BR-FE10-002, BR-FE10-007, BR-FE10-012 | FT49 | FE10-H01, FE10-H02, FE10-H05 | Đã phê duyệt; tích hợp được trì hoãn |
| AC-FE10-006 | Cả tám cặp chuẩn và định nghĩa an toàn đều đạt kiểm tra; người nhận, biến, ID nguồn hoặc ánh xạ không hợp lệ, mẫu không an toàn/bị thiếu/không hoạt động, quyền sở hữu nguồn, ghi đè nguồn HTTP hoặc bí mật trong dữ liệu xếp hàng được phát hiện đệ quy đều trả về lỗi 4xx an toàn trước khi kết xuất/lưu bền/gửi | FR-FE10-005, FR-FE10-009 | BR-FE10-002, BR-FE10-004, BR-FE10-007, BR-FE10-010, BR-FE10-011 | FT46 đến FT49 cùng ma trận định nghĩa lưu trữ không an toàn trong `notificationRoutes.test.js` | FE10-H02, FE10-H04, FE10-S02, FE10-S06, FE10-S11 | Bằng chứng tự động hoàn tất; H2 tích hợp đã được phê duyệt; CI của PR đã đạt; khắc phục H3 chỉ liên quan tài liệu đang chờ H2 mới |
| AC-FE10-007 | OTP xác thực và nội dung nhạy cảm đã kết xuất không bao giờ vượt qua ranh giới lưu bền/nhật ký/kiểm toán/HTTP | FR-FE10-001, FR-FE10-002 | BR-FE10-003, BR-FE10-004, BR-FE10-008, BR-FE10-013 | FT46, FT47 | FE10-H03, FE10-H04, FE10-S03 | Đã phê duyệt để triển khai |
| AC-FE10-008 | Khóa trùng phát lại cùng một bản ghi xuyên suốt mọi trạng thái bằng DTO `200` tối thiểu | FR-FE10-008 | BR-FE10-006, BR-FE10-013 | FT46 đến FT49 | FE10-H08 | Đã phê duyệt để triển khai |
| AC-FE10-009 | Lỗi được xử lý an toàn/không chặn; FE02 phát hành lại sự kiện OTP/mã thông báo mới, thao tác thử lại `FAILED` không nhạy cảm dùng lại lịch sử, còn `PROCESSING` không chắc chắn tuyệt đối không được gửi lại | FR-FE10-007 | BR-FE10-004, BR-FE10-008, BR-FE10-012, BR-FE10-013 | Các trường hợp nhà cung cấp/chuyển đổi/thử lại trong `backend/tests/notificationRoutes.test.js` | FE10-H03, FE10-H08, FE10-S04, FE10-S10 | Có bằng chứng tự động; đang chờ rà soát H2 |
| AC-FE10-010 | Thiết lập tài khoản từ trình yêu cầu ràng buộc với FE11 được gửi đồng bộ bằng siêu dữ liệu nguồn an toàn và không lưu bền thông tin xác thực/nội dung thiết lập | FR-FE10-010 | BR-FE10-002, BR-FE10-004 đến BR-FE10-008, BR-FE10-010 đến BR-FE10-013 | FT52, FT55 | FE10-S06 đến FE10-S08 | Đã phê duyệt để triển khai |

### Tóm tắt độ bao phủ

- Tổng AC: 10 (AC-FE10-001 đến AC-FE10-010) - tất cả đều được ánh xạ.
- Tổng FR: 10 (FR-FE10-001 đến FR-FE10-010) - tất cả đều được ánh xạ.
- Tổng BR: 13 (BR-FE10-001 đến BR-FE10-013) - tất cả đều được ánh xạ.
- Các kiểm thử bài tập vẫn là FT46 đến FT49. Phần triển khai tăng cường được truy vết tới FE10-H02 đến FE10-H08 và được FE10-H09 xác nhận.

### Truy vết BR/FR bổ sung

| ID yêu cầu | Ý định thử nghiệm | Trạng thái |
| -------------- | ----------- | ------ |
| BR-FE10-009 | Quét nguồn/cấu hình thông tin xác thực của nhà cung cấp | Đã lên kế hoạch |
| FR-FE10-003 | Yêu cầu kết quả tư cách thành viên FE04 và đặt chỗ sẵn sàng FE08 tạo một bản ghi đang chờ mà không thay đổi kết quả nguồn | Đã lên kế hoạch các trường hợp trình yêu cầu FE04 và hàng đợi đặt chỗ |
| FR-FE10-006 | Việc nhà cung cấp chấp nhận đặt `SENT`, `sentAt` và một lần thử thành công | Đã lên kế hoạch |
| BR-FE10-011 / Q-FE10-009 | Quyền sở hữu kết quả thành viên được ràng buộc bởi FE04 và ranh giới HTTP được bảo vệ | Đã lên kế hoạch |
| BR-FE10-010 / FR-FE10-005 / FR-FE10-009 | `notificationRoutes.test.js` từ chối ba lớp định nghĩa đã lưu không an toàn mà không gọi kết xuất/lưu bền/nhà cung cấp, đồng thời vẫn làm sạch giá trị khi chạy | Hoàn thành |


### Truy vết bài tập bên ngoài (ID UC trong Excel)

| ID UC bài tập | Trường hợp sử dụng trong Excel | Luồng chính / Yêu cầu liên quan | Kiểm thử liên quan |
| ---------------- | -------------- | ------------------------------- | ------------ |
| UC45 | Gửi thông báo xác minh tài khoản | MF-FE10-001; FR-FE10-001 | FT46 |
| UC46 | Gửi thông báo đặt lại mật khẩu | MF-FE10-002; FR-FE10-002 | FT47 |
| UC47 | Gửi thông báo đặt sách | MF-FE10-003; FR-FE10-003 | FT48 |
| UC48 | Gửi thông báo hạn trả hoặc tiền phạt | MF-FE10-004; FR-FE10-004 | FT49 |

---

## 17. Danh sách kiểm tra rà soát

Danh sách kiểm tra phê duyệt Giai đoạn 1 (hoàn thành ngày 2026-06-10):

- [x] ID tính năng và thư mục khớp với Danh sách tính năng chính.
- [x] Phạm vi nằm trong Quản lý thông báo FE10.
- [x] Nhóm phê duyệt các quyết định được đề xuất trong Phần 15.1.
- [x] Chiến lược kênh được xác nhận: email, trong ứng dụng hoặc cả hai.
- [x] Chiến lược dùng bộ điều hợp nhà cung cấp đã cấu hình và đối tượng mô phỏng được chèn trong kiểm thử đã được xác nhận.
- [x] Lược đồ thông báo được rà soát với chủ sở hữu cơ sở dữ liệu.
- [x] Các phụ thuộc FE02, FE07, FE08, FE09 và FE11 đã được kiểm tra xung đột.
- [x] Hợp đồng API được phê duyệt trong SPEC.md này hoặc được sao chép vào tệp hợp đồng API chuyên dụng nếu nhóm giới thiệu lại một tệp.
- [x] Không lưu/ghi nhật ký bí mật, thông tin xác thực của nhà cung cấp, mã thông báo/OTP thô hoặc nội dung xác thực nhạy cảm đã kết xuất.
- [x] Mọi tiêu chí chấp nhận đều có thể trở thành một kiểm thử.

Danh sách kiểm tra hợp đồng tăng cường (được Nhat phê duyệt ngày 2026-07-13):

- [x] Các cặp loại/mẫu chuẩn là chính xác và cờ của người gọi không thể bỏ qua chúng.
- [x] Thông báo xác thực nhạy cảm được gửi đồng bộ và nội dung nhạy cảm đã kết xuất chỉ tồn tại trong bộ nhớ của nhà cung cấp.
- [x] Dữ liệu không nhạy cảm đã xếp hàng dùng kiểm tra đệ quy đối tượng/mảng, từ chối khóa bí mật đã chuẩn hóa và che dữ liệu `safePayload` tương ứng.
- [x] Các thao tác tạo/phát lại/xử lý/thử lại chỉ dùng DTO tối thiểu.
- [x] `sourceEntityId` chỉ có số nguyên.
- [x] Danh sách cho phép của trình yêu cầu nguồn đã ràng buộc và ranh giới HTTP `LIBRARIAN`/`ADMIN` được nêu rõ.
- [x] Tính lũy đẳng áp dụng xuyên suốt mọi trạng thái.
- [x] Thử lại thủ công sẽ giữ lại lịch sử không nhạy cảm và thử lại nhạy cảm sẽ trả về `REISSUE_REQUIRED`.
- [x] Tích hợp trình yêu cầu OTP xác minh/đặt lại FE02 được phê duyệt qua ADR-004; `CHANGE_PASSWORD_OTP` và việc tích hợp người gọi FE09 vẫn được trì hoãn rõ ràng.
- [x] Nhân viên qua HTTP bị từ chối với mọi loại xác thực nhạy cảm; trình yêu cầu không sở hữu bị từ chối với xác minh/đặt lại FE02 và thiết lập tài khoản FE11.
- [x] G1-G7 truy vết tới hợp đồng BR/FR/AC/API/NFR đã sửa đổi và FE10-H01 đến FE10-H09.

### Cổng an toàn mẫu của bản sửa đổi v0.4.4

- [x] Tách việc từ chối định nghĩa mẫu đã lưu khỏi thao tác thoát giá trị khi chạy.
- [x] Bảo toàn cặp chuẩn, khóa giống bí mật, tải trọng an toàn, DTO tối thiểu và các quy tắc sở hữu nguồn.
- [x] Yêu cầu từ chối an toàn trước khi kết xuất, lưu bền thông báo/lần thử hoặc gửi qua nhà cung cấp.
- [x] Nhat đã trực tiếp rà soát và phê duyệt SPEC v0.4.4 bằng văn bản ngày 2026-07-27; PLAN/TASKS có thể tiếp tục, còn việc triển khai vẫn bị chặn trong khi chờ phê duyệt kế hoạch.
