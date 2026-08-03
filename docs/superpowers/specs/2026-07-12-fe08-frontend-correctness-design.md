# FE08 Thiết kế chính xác của giao diện

Trạng thái: ĐÃ ĐƯỢC PHÊ DUYỆT

Chủ sở hữu: Nhật

Ngày: 2026-07-12

## 1. Mục tiêu

Điều chỉnh giao diện đặt chỗ FE08 hiện tại phù hợp với vòng đời đặt chỗ và hợp đồng máy chủ đã được
phê duyệt. Thay đổi này khắc phục hành vi giao diện người dùng gây hiểu lầm mà không cần thêm các
khả năng đặt chỗ hoặc hợp đồng máy chủ mới.

## 2. Phạm vi

Bao gồm:

- Ánh xạ mọi trạng thái đặt chỗ FE08 sang trạng thái UI dự kiến, bao gồm `NOTIFIED` là `Ready to pick up` và các trạng thái đầu cuối là trạng thái không hoạt động.
- Cung cấp các lỗi API dành riêng cho tiếng Việt mà không thay đổi hành vi lỗi đối với việc mượn, báo cáo, kiểm kê hoặc các API chức năng khác.
- Hiển thị điểm cuối hết hạn giữ nhân viên hiện có thông qua `reservationApi`.
- Cho phép thủ thư kích hoạt hết hạn giữ, xem số lượng đã hết hạn và được thăng cấp, đồng thời tải lại danh sách đặt chỗ từ máy chủ.
- Xóa các điều khiển yêu cầu thực hiện hoặc xóa đặt chỗ trong khi chỉ thay đổi trạng thái React cục bộ.
- Cập nhật tài liệu lập kế hoạch, truy vết và nhật ký thay đổi của FE08 để phản ánh phần giao diện người dùng đã triển khai.

Đã loại trừ:

- FE07 hành vi vay mượn hoặc thực hiện.
- Phân trang đặt chỗ phía máy chủ.
- Điểm cuối máy chủ mới, giá trị trạng thái, thay đổi cơ sở dữ liệu hoặc hết hạn theo lịch trình tự động.
- FE10 thay đổi gửi thông báo.
- Thiết kế lại giao diện người dùng rộng rãi hoặc tái cấu trúc không liên quan.

## 3. Thiết kế

### 3.1 Ánh xạ trạng thái đặt chỗ

`statusToUi()` vẫn là ranh giới chuyển đổi trạng thái được chia sẻ. Nó sẽ ánh xạ rõ ràng bộ trạng thái FE08:

| Trạng thái máy chủ | Trạng thái giao diện người dùng |
| --- | --- |
| `ACTIVE` | `Waiting` |
| `NOTIFIED` | `Ready to pick up` |
| `FULFILLED` | `Completed` |
| `CANCELLED` | `Cancelled` |
| `EXPIRED` | `Expired` |

Việc xử lý cũ hiện có của `ACTIVE` với `notifiedAt` vẫn tương thích, nhưng trạng thái `NOTIFIED`
chuẩn không còn rơi vào `Unknown` nữa. Hàng đợi thủ thư sẽ chỉ bao gồm các hàng `Waiting` vì chỉ có
thể chọn đặt chỗ `ACTIVE` máy chủ. `Ready to pick up` vẫn hiển thị trong danh sách tất cả đặt chỗ
dưới dạng trạng thái giao diện người dùng cho `NOTIFIED`, nhưng không thể nhận các hành động xếp
hàng.

### 3.2 Cách ly lỗi đặt chỗ

Trình giải quyết `getReservationErrorMessage(error, fallbackMessage)` chuyên dụng sẽ hoạt động bên
cạnh các trình giải quyết lỗi chức năng hiện có. Nó sẽ dịch các mã lỗi máy chủ FE08 đã biết và sử
dụng bản dự phòng tiếng Việt được cung cấp cho các phản hồi không xác định hoặc không có sẵn.

Chỉ `reservationApi` mới gọi `authorizedRequest()` thông qua trình bao bọc dành riêng cho đặt chỗ.
Các mô-đun API khác giữ nguyên trình giải quyết lỗi hiện tại, ngăn chặn từ ngữ FE08 rò rỉ vào FE07
hoặc các yêu cầu được chia sẻ. Hành vi làm mới xác thực và xóa mã thông báo vẫn không thay đổi.

### 3.3 Giữ luồng hết hạn

`reservationApi.expireHolds()` sẽ gọi:

```text
POST /api/reservations/expire-holds
```

Trang thủ thư sẽ hiển thị một lệnh nhân viên rõ ràng cho hoạt động máy chủ hiện có này. Khi thành công nó sẽ:

1. Đọc `expiredCount` và độ dài của `promoted` từ phản hồi.
2. Tải lại các đặt chỗ từ phần máy chủ thay vì dự đoán các thay đổi trạng thái cục bộ.
3. Hiển thị thông báo thành công bằng tiếng Việt với cả hai lần đếm chỉ sau khi tải lại chuẩn thành công.

Nếu yêu cầu hết hạn hoặc tải lại chuẩn không thành công, trang sẽ hiển thị lỗi cụ thể dành riêng,
giữ nguyên các hàng hiện tại và tránh thông báo thành công sai. Lệnh sẽ bị vô hiệu hóa trong khi
đang tiến hành tải lại yêu cầu hoặc danh sách để tránh gửi trùng lặp.

### 3.4 Hành động không được hỗ trợ

Các điều khiển `Đã giao` và `Xóa` sẽ bị xóa khỏi hàng đợi thủ thư. Trình xử lý hiện tại của họ chỉ
xóa các hàng khỏi trạng thái cục bộ và do đó ngụ ý sai về quá trình chuyển đổi phía máy chủ thành
công.

FE08 sẽ không phát minh ra điểm cuối thực hiện hoặc xóa. Việc đặt chỗ sẽ trở thành `FULFILLED` thông
qua quy trình mượn FE07 đã được phê duyệt, nằm ngoài thay đổi này.

### 3.5 Luồng dữ liệu

```text
Hành động của Thủ thư
  -> reservationApi.expireHolds()
  -> existing POST /api/reservations/expire-holds
-> máy chủ làm hết hạn các lượt giữ NOTIFIED quá hạn và đưa các đặt chỗ đủ điều kiện lên trước
-> GET /api/reservations tải lại trạng thái máy chủ chuẩn
-> mapReservation()/statusToUi() hiển thị các trạng thái vòng đời đã cập nhật
-> giao diện báo cáo số lượng sau khi tải lại trạng thái chuẩn thành công
```

Không có thao tác ghi lạc quan nào được sử dụng để hết hạn, thực hiện hoặc xóa. Phản hồi máy chủ và tải
lại vẫn là nguồn chuẩn.

## 4. Chiến lược kiểm thử

Các kiểm thử sẽ được viết trước khi thực hiện nếu thực tế.

- Thêm vùng phủ sóng đơn vị giao diện người dùng tập trung chứng minh ánh xạ `NOTIFIED` vào bản đồ trạng thái thiết bị đầu cuối `Ready to pick up` và FE08 một cách nhất quán.
- Thêm các kiểm tra lỗi API chứng minh các mã đặt chỗ đã biết nhận được thông báo tiếng Việt và các yêu cầu API không liên quan vẫn giữ nguyên hành vi giải quyết hiện có của chúng.
- Thêm phạm vi trang/API tập trung cho số lượng yêu cầu và phản hồi `expire-holds` nếu được cấu trúc kiểm tra giao diện người dùng hiện có hỗ trợ.
- Giữ lộ trình đặt chỗ máy chủ hiện có và các kiểm thử tích hợp làm phạm vi hồi quy cho hành vi hết hạn và khuyến mại.

Các lệnh xác minh sẽ bao gồm:

- Kiểm tra giao diện người dùng.
- giao diện kiểm tra mã.
- Xây dựng sản xuất giao diện.
- Kiểm tra máy chủ.
- FE08 kiểm tra tính nhất quán của tài liệu/khả năng truy vết.

## 5. Cập nhật tài liệu

- Sửa đổi `.sdd/specs/feat-reservation-management/PLAN.md` để không còn tuyên bố rằng chức năng này chỉ dành cho phần máy chủ hoặc loại trừ giao diện người dùng đã được triển khai.
- Thêm các nhiệm vụ về tính chính xác và bằng chứng xác thực hiện tại vào `.sdd/specs/feat-reservation-management/TASKS.md` mà không xóa công việc đã hoàn thành trước đây.
- Ghi lại thay đổi về độ chính xác của giao diện người dùng FE08 trong `.sdd/specs/feat-reservation-management/CHANGELOG.md`.

`SPEC.md` không yêu cầu thay đổi hành vi vì các yêu cầu về vòng đời trạng thái và thời gian giữ hết
hạn đã được phê duyệt đã mô tả hành vi mục tiêu.

## 6. Tiêu chí chấp nhận

- đặt chỗ máy chủ có trạng thái `NOTIFIED` hiển thị là sẵn sàng để nhận, không bao giờ là `Unknown`.
- Chỉ các đặt chỗ `Waiting` mới xuất hiện trong hàng đợi thủ thư đang hoạt động; `Ready to pick up` vẫn hiển thị trong danh sách tất cả đặt chỗ nhưng bị loại khỏi hành động xếp hàng.
- Thủ thư có thể gọi điểm cuối tạm dừng hết hạn hiện có và nhận được số lượng đã hết hạn/được thăng cấp rõ ràng.
- Trang tải lại trạng thái máy chủ chuẩn sau khi chạy hết hạn thành công.
- Không có kiểm soát hữu hình nào yêu cầu thực hiện hoặc xóa đặt chỗ mà không cần thao tác máy chủ.
- Lỗi đặt chỗ được bản địa hóa bằng tiếng Việt và vẫn được cách ly với `reservationApi`.
- Không có việc thực hiện, phân trang, lược đồ hoặc mở rộng hợp đồng máy chủ FE07 nào được giới thiệu.
- Các thẻ xác minh giao diện người dùng và máy chủ có liên quan.
