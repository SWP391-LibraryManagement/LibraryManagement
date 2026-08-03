# FE07/FE08/FE10/FE12 Thiết kế khắc phục xác minh cuối cùng

**Trạng thái:** ĐƯỢC PHÊ DUYỆT BỞI USER

**Đã phê duyệt:** 2026-07-23

**Phạm vi:** Sửa các phát hiện cuối cùng về quy tắc nghiệp vụ và chế độ lỗi được tìm thấy sau đợt
khắc phục đầu tiên cho FE07, FE08, FE10 và FE12.

## 1. Bàn thắng

- Sử dụng ngày làm việc `Asia/Ho_Chi_Minh` cho FE07 trả sách các ứng viên tốt và
  kiểm tra trước khi gia hạn.
- Giữ trạng thái vòng đời của FE08 và bản ghi kiểm tra bắt buộc của nó trong cùng một SQL
  giao dịch.
- Yêu cầu tài liệu tham khảo nguồn đầy đủ cho mọi yêu cầu trong quá trình FE10.
- Ngăn FE10 tự động gửi cùng một tin nhắn hai lần sau một
  nhà cung cấp không chắc chắn/SQL bị lỗi một phần.
- Giữ các kho kiểm tra trong bộ nhớ FE12 và FE07 giống hệt về mặt ngữ nghĩa với
  kho sản xuất.
- Loại bỏ những mâu thuẫn về đặc tả FE07/FE08 còn lại và sửa chữa FE12
  tổng số truy vết.

## 2. FE10 Quyết định của bang bàn giao

Người dùng đã phê duyệt trạng thái `PROCESSING` bền bỉ.

### 2.1 Vòng đời

```text
Non-sensitive:
PENDING -> PROCESSING -> SENT
                      -> FAILED

Sensitive:
new -> PROCESSING -> SENT
                  -> FAILED
```

- Yêu cầu thay đổi `PENDING` thành `PROCESSING` và cam kết trước I/O của nhà cung cấp.
- Quá trình chuyển đổi thiết bị đầu cuối được bảo vệ ghi `SENT`/`FAILED` và
  Hàng `NotificationAttempts` trong một giao dịch.
- Hai công nhân không thể yêu cầu cùng một hàng `PENDING`.
- Nếu nhà cung cấp có thể đã chấp nhận bàn giao nhưng quá trình chuyển đổi SQL của thiết bị đầu cuối
  không thành công, bản ghi vẫn là `PROCESSING`.
- `PROCESSING` không được tự động thu hồi hoặc tự động thử lại vì
kết quả của nhà cung cấp là không chắc chắn. Điều này ủng hộ việc không phân phối trùng lặp tự động
thay vì phân phối lại ít nhất một lần trong im lặng.
- Một bản phát lại bình thường trả về cùng một bản tóm tắt `PROCESSING` và không bao giờ gửi
  một lần nữa.
- Thử lại thủ công chỉ chấp nhận `FAILED` không nhạy cảm; `PROCESSING` trả sách két sắt
  `409 DELIVERY_STATE_UNCERTAIN`.
- Việc phát hành lại nhạy cảm vẫn yêu cầu một sự kiện nguồn mới và khóa tạm thời.

### 2.2 Kiên trì

- Thêm `PROCESSING` vào ràng buộc, mô hình và trạng thái thông báo chuẩn
  FE10 đặc tả.
- Thêm một quá trình di chuyển SQL Server bình thường chỉ thay thế các di chuyển đã biết
  ràng buộc kiểm tra trạng thái thông báo sau khi xác thực các giá trị hiện có.
- Không có phản hồi, thông tin xác thực, OTP, mã thông báo, liên kết thiết lập hoặc kết xuất của nhà cung cấp
  nội dung nhạy cảm vẫn tồn tại.

### 2.3 Ràng buộc nguồn

Mọi yêu cầu nội bộ liên quan đến xây dựng phải chứa:

- ràng buộc `sourceFeature`;
- `sourceEntityType` hợp lệ không trống;
- số nguyên dương `sourceEntityId`;
- `idempotencyKey` hợp lệ không trống.

Quá trình xác thực diễn ra trước khi kết xuất, lưu giữ hoặc phân phối nhà cung cấp.

## 3. FE08 Thiết kế giao dịch và phản hồi

- Đặt chỗ tạo, hủy, giữ và hết hạn vượt qua quá trình kiểm tra vòng đời của chúng
  tham gia vào giao dịch kho lưu trữ.
- Nếu chèn kiểm tra vòng đời không thành công, thao tác ghi trạng thái liên quan sẽ quay trở lại.
- Hết hạn chỉ quảng bá mục hàng đợi tiếp theo sau khi giao dịch hết hạn
  cam kết thành công.
- Yêu cầu thông báo vẫn còn sau cam kết theo yêu cầu của FE08 hiện tại
  hợp đồng; lỗi thông báo không bao giờ khôi phục lại khoản giữ đã cam kết.
- `RESERVATION_NOTIFY_FAILED` là nỗ lực kiểm tra sau cam kết bắt buộc. Nếu đó
ghi kiểm tra cũng không thành công, dịch vụ không được nuốt nó: nó trả về cảnh báo an toàn rõ ràng
trong kết quả xử lý hàng đợi và phát ra nhật ký vận hành an toàn mà không có dữ liệu người nhận hoặc
thông tin chi tiết về nhà cung cấp.
- Hộp thoại xác nhận của thủ thư mô tả hàng đợi bản sao/hiện tại vật lý,
không phải là thành viên được lưu trữ. Chỉ thành viên được máy chủ chọn mới có thể xuất hiện trong
thông báo thành công.

## 4. FE07 Thiết kế tương đương thời gian kinh doanh và kiểm thử

- Thay thế các phép tính ngày theo lịch của máy chủ cục bộ bằng
  `overdueDaysBetween(..., 'Asia/Ho_Chi_Minh')`.
- Sử dụng cùng ngày làm việc cho việc kiểm tra trước gia hạn và giấy tờ có thẩm quyền
  cuộc gọi kho lưu trữ.
- Kho lưu trữ trả về trong bộ nhớ phải trả về `BORROW_STATE_CONFLICT` trừ khi
  cả chi tiết và bản sao vật lý hiện đang được mượn.
- Cập nhật các kỳ vọng của SQL dùng một lần lên tính đủ điều kiện dựa trên vai trò hiện tại và
  kết quả xung đột đồng thời rõ ràng.

## 5. FE12 Thiết kế kiểm tra chẵn lẻ và truy vết

- Báo cáo người dùng trong bộ nhớ áp dụng `q` cho cùng các trường được phê duyệt như SQL.
- `newMembersByPeriod` tính mọi phê duyệt lịch sử không có giá trị trong phạm vi,
  bất kể trạng thái thành viên/tài khoản hiện tại.
- Thứ tự chi tiết người dùng vẫn là `userId ASC`.
- FE12 khả năng truy vết bao gồm BR-FE12-016, FR-FE12-011 và AC-FE12-011, với
  tổng số vùng phủ sóng là `16 BR / 11 FR / 11 AC`.

## 6. Xác minh

Việc triển khai tuân theo các kiểm thử RED-GREEN và sau đó chạy:

- các kiểm thử máy chủ FE07/FE08/FE10/FE12 tập trung;
- kiểm tra đặt chỗ lối vào tập trung;
- bộ máy chủ và giao diện người dùng đầy đủ;
- giao diện kiểm tra mã và xây dựng sản xuất;
- thực thi truy vết và `git diff --check`;
- FE07/FE08 SQL chỉ kiểm tra trên cơ sở dữ liệu SQL Server cục bộ dùng một lần;
- bộ tích hợp hệ thống SQL trên cơ sở dữ liệu cục bộ dùng một lần;
- bảo mật và xem xét đặc tả/tiêu chuẩn cuối cùng trước H2.

môi trường tiền sản xuất Azure ở chế độ chỉ đọc để xác minh kiểm thử nhanh và không bao giờ được sử dụng cho
các kiểm thử SQL có thể thay đổi.

## 7. Phụ lục khắc phục H3

**Đã phê duyệt:** 2026-07-23

Đánh giá tích hợp H3 đầu tiên đã phát hiện thấy một lỗi trong quá trình truyền phản hồi, một khoảng
cách về tính tương đương của kiểm thử và bằng chứng quản trị/triển khai cũ. Phụ lục này giữ lại hành
vi kinh doanh ban đầu và thu hẹp việc điều chỉnh những phát hiện đó.

### 7.1 FE08 Hợp đồng cảnh báo hết hạn khuyến mãi

- `processQueue` giữ `notificationWarning` cấp cao nhất hiện có
  phản hồi.
- `expireHolds` giữ `expiredCount`, `expired` và `promoted` hiện có
các trường phản hồi và chỉ thêm `notificationWarnings` cấp cao nhất khi ít nhất một khoản giữ được
thăng cấp không thể duy trì quá trình kiểm tra thông báo lỗi được yêu cầu.
- Mỗi mục `notificationWarnings` chỉ chứa `reservationId`, `copyId`,
`code` và `message` an toàn. Nó không được chứa danh tính thành viên, dữ liệu người nhận, chi tiết
nhà cung cấp, nội dung thông báo được hiển thị hoặc bộ công nghệ lỗi.
- đặt chỗ DTO được quảng cáo vẫn là hợp lệ và không nhận được
trường cảnh báo có thể đếm được. Do đó, nhiều chương trình khuyến mãi có thể báo cáo nhiều cảnh báo
mà không thay đổi hình dạng vật phẩm `promoted` hiện có.

### 7.2 FE12 Hợp đồng kiểm thử ngang bằng SQL `LIKE`

- SQL sản xuất giữ nguyên hành vi `LIKE` được tham số hóa hiện tại; cái này
  biện pháp khắc phục không thoát hoặc từ chối đầu vào ký tự đại diện.
- Kho lưu trữ báo cáo người dùng trong bộ nhớ khớp với SQL không phân biệt chữ hoa chữ thường hiện tại
hành vi dành cho `%`, `_`, các lớp/phạm vi khung, các lớp khung phủ định và các ký tự bằng chữ trong
mẫu `%${q}%` hiệu quả.
- Tính chẵn lẻ chỉ áp dụng cho các giá trị có thể tìm kiếm được phê duyệt: ID người dùng, tài khoản
  trạng thái, trạng thái thành viên và tên vai trò.
- Kiểm tra hồi quy bao gồm đầu vào ký tự đại diện và giữ lại nghĩa đen hiện có,
  trường hợp hỗn hợp, lọc, phê duyệt lịch sử và trường hợp thứ tự xác định.

### 7.3 Ranh giới xác minh di chuyển Azure

- Mọi di chuyển có thể thay đổi, bao gồm
`2026-07-23-fe10-processing-status.sql`, trước tiên phải chạy hai lần trên cơ sở dữ liệu SQL Server
cục bộ dùng một lần có tên để chứng minh tính bình thường.
- Quá trình di chuyển được đánh giá sẽ chạy một lần trên cơ sở dữ liệu môi trường tiền sản xuất Azure dự định.
- Sau đó, việc chấp nhận giai đoạn sẽ sử dụng các truy vấn lược đồ/ràng buộc chỉ đọc và
bộ kiểm thử nhanh ứng dụng chỉ đọc hiện có. Việc phân giai đoạn không được sử dụng để chứng minh tính bình
thường của di cư.
- Quyền truy cập tường lửa của nhà điều hành tạm thời phải chính xác, tồn tại trong thời gian ngắn và bị xóa
  ngay sau khi di chuyển được xem xét.

### 7.4 Nhà nước quản trị

- Việc thực hiện và cam kết tài liệu đã hoàn thành đã vượt qua H2 và
phụ lục H2; hồ sơ nhiệm vụ không còn được phép nói rằng những đánh giá đó đang chờ xử lý.
- Biện pháp khắc phục H3 này đưa nhánh trở lại triển khai. Sự khác biệt RED-GREEN của nó
  yêu cầu đánh giá H2 mới, cam kết, đẩy và chạy CI trước khi H3 có thể được lặp lại.
- Việc hợp nhất vẫn bị cấm cho đến khi quá trình xem xét H3 lặp đi lặp lại vượt qua
  `main` mới nhất.

### 7.5 Xác minh

- Thêm hồi quy dịch vụ/tuyến đường chứng minh `expire-holds` tuần tự hóa mọi két an toàn
  cảnh báo khuyến mãi.
- Thêm các trường hợp chẵn lẻ của báo cáo trong bộ nhớ cho hành vi ký tự đại diện SQL.
- Chạy kiểm thử FE08/FE12 tập trung, kiểm thử tiện ích triển khai, truy vết, đầy đủ
Xác minh backend/frontend, kiểm tra bảo mật/khác biệt và bộ CI kho lưu trữ trước H3 lặp lại.

## 8. Phụ lục khắc phục H3 lặp lại

**Đã phê duyệt:** 2026-07-23

Quá trình xem xét H3 lặp đi lặp lại đã vượt qua quá trình truyền phản hồi FE08 đã triển khai, các
trường hợp ký tự đại diện cơ sở FE12, quy trình Azure, hợp nhất ảo và các ranh giới bảo mật, nhưng
đã tìm thấy bốn khoảng trống giới hạn về tính đầy đủ. Phụ lục này bảo lưu tất cả các hoạt động sản
xuất đã được phê duyệt và giới hạn biện pháp khắc phục không được cam kết tiếp theo đối với những
phát hiện đó.

### 8.1 Hoàn thành SQL `LIKE` Tính chẵn lẻ của lớp khung

- SQL sản xuất và liên kết `%${q}%` được tham số hóa của nó vẫn không thay đổi.
- Trình biên dịch trong bộ nhớ phải xử lý dấu ngoặc vuông ngay sau `[` hoặc
  `[^` với tư cách là thành viên của lớp khung và tiếp tục đến khung đóng sau này.
- Trình biên dịch phải bảo toàn `%`, `_`, phạm vi, phủ định đã được phê duyệt
  các lớp, chữ thông thường và hành vi dự phòng không hợp lệ/không đóng khung.
- Các trường hợp chẵn lẻ RED-GREEN bao gồm cả một lớp khớp với `]` (`[]]`) và một
  lớp phủ định loại trừ `]` (`[^]]`).
- Không phụ thuộc, trường có thể tìm kiếm mới, thao tác ghi cơ sở dữ liệu hoặc sản xuất API
  hành vi được giới thiệu.

### 8.2 Chứng minh nhiều cảnh báo khuyến mãi FE08

- Thêm hồi quy dịch vụ và tuyến đường với ít nhất hai bản sao đã hết hạn, hai
  các khoản giữ được thăng cấp và hai lần kiểm tra lỗi thông báo-lỗi độc lập.
- Khẳng định `notificationWarnings[]` chứa đựng mọi cảnh báo trong chương trình khuyến mãi
đặt hàng và mỗi mục chỉ chứa `reservationId`, `copyId`, `code` và thông báo an toàn.
- Khẳng định đầu ra được tuần tự hóa không chứa danh tính người nhận, chi tiết nhà cung cấp,
  nội dung thông báo được hiển thị hoặc văn bản lỗi nội bộ.
- Việc triển khai hiện tại có thể không thay đổi khi các hồi quy mới
  chứng minh vòng lặp đã thỏa mãn hợp đồng này.

### 8.3 Hoàn thành Hợp đồng OpenAPI cảnh báo số ít

- Ghi lại phản hồi `POST /api/reservations/process-queue` `200` dưới dạng
đối tượng có `selectedReservation` được yêu cầu và `notificationWarning` tùy chọn.
- Cảnh báo số ít chỉ chứa `code` và `message`;
  `additionalProperties: false` ngăn chặn việc vô tình mở rộng hợp đồng.
- Bảo quản `expire-holds.notificationWarnings[]` được ghi tài liệu riêng
  hình dạng với `reservationId` và `copyId`.

### 8.4 Làm cho bằng chứng quản trị hiện hành

- Ghi lại cam kết mới được phê duyệt H2
`b931e005e50dc9c0ec9c177f2874f88a1df943b0`, PR #62 đã sẵn sàng và có thể hợp nhất, đồng thời CI chạy
`30019439505` đã được chuyển cho phần chính xác đó.
- Ghi lại H3 lặp lại sau đó trả về tập tìm kiếm thứ hai bị chặn này.
- Đánh dấu các mục trong danh sách kiểm tra H2, cam kết/đẩy và CI đã hoàn thành là hoàn chỉnh trong khi
  để lại H3 lặp lại, hợp nhất, CI sau hợp nhất và xác minh theo giai đoạn.
- Cập nhật bốn bản ghi nhiệm vụ chức năng và kế hoạch thực hiện để lịch sử
Bằng chứng H2 là chính xác và sự khác biệt mới không được cam kết này rõ ràng yêu cầu một H2 mới
khác, CI cập nhật và H3 lặp lại.

### 8.5 Xác minh và cổng

- Trước tiên hãy chạy các kiểm thử FE08/FE12 tập trung, sau đó là L1-L4 tương đương với kho lưu trữ
bộ phần mềm, kiểm tra phần phụ thuộc, truy vết, phân tích cú pháp OpenAPI, đánh giá bảo mật, hợp
nhất ảo chính mới nhất và vệ sinh khác biệt.
- Giữ mọi thay đổi từ phụ lục này ở trạng thái sẵn sàng cho đến khi có bản đánh giá H2 mới.
- Không hợp nhất PR #62, thay đổi Azure SQL hoặc triển khai lại giai đoạn trước khi lặp lại
  H3 chuyển sang đầu được xem xét tiếp theo.
