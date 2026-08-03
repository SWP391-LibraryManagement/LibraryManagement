# FE10 Thiết kế mở rộng hộp thư đến thông báo

**Trạng thái:** HOÀN THÀNH - PR #75 MERGED, POST-MERGE CI/AZURE đạt

**Thiết kế đã được phê duyệt:** 2026-07-27

**Đánh giá bằng văn bản đã được phê duyệt:** 2026-07-27

**Kế hoạch thực hiện/H1 được phê duyệt:** 28-07-2026

**Người phê duyệt:** Người dùng trong tác vụ đang hoạt động

**Phương thức phân phối:** SDD đầu tiên, Chiều sâu đầy đủ cho dữ liệu thông báo cốt lõi, API, ủy
quyền và di chuyển; giới hạn ADD sau này có thể triển khai giao diện người dùng đã được phê duyệt.

**Cơ sở triển khai:** quản trị PR #70 đã hợp nhất với `main` dưới dạng
`25c09ec5f90d21e4ab0228cccd838b3548d4d90d`. FE10-I01 đến FE10-I08, quá trình khắc phục băm di chuyển
và khắc phục vòng một H3 bị chặn đã hoàn tất. Sau khi rebase chỉ có tài liệu thành `main@30f936d`,
dấu vân tay `e123345be05b59a9e519d182b301ab5464160e8fc32aed8d17d3c463e28e0a15` đã được H2 phê duyệt.
Đầu PR #75 `778e0a470d8a1083bf571a8007b3c058eee4bb22` đã vượt qua đầu chính xác CI `30317424995` và
Azure môi trường tiền sản xuất `30317621429`, nhận được H3 hai trục sạch và phê duyệt rõ ràng, sau
đó hợp nhất thành `b75776b10d6cf4b6868d2ba51eb3268073483b8b`. CI `30341279111` sau hợp nhất chính
xác và Môi trường tiền sản xuất Azure tự động đã vượt qua. Bằng chứng trình duyệt/API/ba vai trò
lịch sử vẫn được ghi lại
cho `28c4f80`.

**Phụ lục triển khai H1 được phê duyệt ngày 28 tháng 07 năm 2026:** duy trì hoạt động triển khai
theo giai đoạn tự động được kiểm soát bởi CI ngược dòng cùng với các lần chạy lại thủ công. Cả hai
đường dẫn đều không đóng được trừ khi quá trình di chuyển FE10 được kiểm tra chính xác SHA-256 khớp
với `FE10_INBOX_MIGRATION_SHA256` trong Môi trường GitHub `staging`; chạy thủ công cũng yêu cầu
`fe10_inbox_migration_confirmed=true`. máy chủ vẫn đứng trước máy chủ và máy chủ, đồng thời bằng
chứng di chuyển phải tồn tại trước H3/hợp nhất.

**Phụ lục H1 lõi-drift được phê duyệt ngày 28-07-2026:** phù hợp với `main@5a3c84b` trong khi vẫn
bảo toàn quá trình di chuyển khởi động `add_change_password_otp_token_type.sql` mới được đóng gói,
hướng dẫn/kiểm tra mức độ sẵn sàng của nó và hạt giống xác minh tài khoản chuẩn tiếng Việt. Áp dụng
lại lệnh/đặt hàng di chuyển FE10 mà không làm suy yếu hợp đồng ngược dòng, sau đó chạy xác thực hoàn
chỉnh và lấy dấu vân tay H2 mới.

**Phụ lục lõi-drift H1 thứ hai được phê duyệt ngày 28-07-2026:** đối chiếu với `main@db97f17` trong
khi vẫn giữ nguyên lý do hủy đặt chỗ mặc định ở Việt Nam, các điều khiển return/reservation đáp ứng
và tất cả các chỉnh sửa FE07/FE08/FE10/FE12 vòng hai khác. Giữ lại ứng dụng khách hộp thư đến FE10
và các kiểu thông báo trong phạm vi, sau đó chạy xác thực hoàn chỉnh và lấy dấu vân tay H2 mới.

**Phụ lục trôi dạt H1 thứ ba được phê duyệt ngày 28-07-2026:** đối chiếu với `main@12faead`, những
thay đổi sắp tới chỉ xóa các tạo phẩm `document/` đã ngừng hoạt động. Không có tệp FE10 hoặc chồng
chéo hợp đồng cốt lõi. Khởi động lại biện pháp khắc phục mà không thay đổi hợp đồng, chạy lại quá
trình xác thực hoàn chỉnh, lấy dấu vân tay H2 mới và triển khai lại đầu chính xác mới cho Azure
trước khi lặp lại H3 vì giai đoạn hiện tại phục vụ `main` mới hơn.

**Phụ lục trôi dạt H1 thứ tư được phê duyệt ngày 28 tháng 07 năm 2026:** đối chiếu với
`main@a240705`, loại bỏ FE11 do quản trị viên API, giao diện người dùng và các kiểm thử chỉnh sửa.
Hợp đồng FE11 độc lập với FE10 và không có đường dẫn chồng chéo với biện pháp khắc phục H3; cây hợp
nhất đã cam kết sạch sẽ. Giữ nguyên cả hai hợp đồng, chạy lại xác thực hoàn chỉnh, lấy dấu vân tay
H2 mới và triển khai lại đầu FE10 chính xác vì CI `30311801599` và Azure ngược dòng chạy
`30311973740` hiện phục vụ `main` mới hơn đó.

**Phụ lục drift H1 thứ năm được phê duyệt ngày 28-07-2026:** đối chiếu với `main@30f936d`, dịch tài
liệu SDD sang tiếng Việt mà không có các thay đổi về thời gian chạy FE10, API, di chuyển, giao diện
người dùng hoặc kiểm thử. CI `30315665010` ngược dòng chính xác và Môi trường tiền sản xuất Azure tự
động đã vượt qua.
Giữ nguyên bản dịch tiếng Việt và triển khai hợp đồng v0.5.0, vô hiệu hóa quyền H2 trước đó và yêu
cầu dấu vân tay/H2 mới cùng với CI/Azure đầu chính xác và H3 lặp lại trước khi hợp nhất. Những cổng
này sau đó đã hoàn thành thông qua PR #75 như được ghi trong mốc cơ sở thực hiện ở trên.

## 1. Kết quả và phạm vi

Bản sửa đổi này bổ sung hộp thư thông báo cá nhân an toàn vào chức năng gửi email FE10 hiện có. Mọi
tài khoản `MEMBER`, `LIBRARIAN` và `ADMIN` đã xác thực chỉ có thể xem các thông báo không nhạy cảm
của riêng mình, xem huy hiệu chưa đọc, đánh dấu một hoặc tất cả thông báo là đã đọc và đi theo liên
kết được máy chủ phê duyệt đến màn hình doanh nghiệp liên quan.

Hộp thư đến là bề mặt trình bày thứ hai cho bản ghi thông báo không nhạy cảm hiện có. Nó không tạo
thông báo thứ hai, giới thiệu kênh gửi `IN_APP` hoặc thay đổi vòng đời email. Một sự kiện nguồn được
chấp nhận vẫn sở hữu một bản ghi thông báo và một khóa tạm thời.

Bao gồm:

- chuông tiêu đề đã được xác thực với số lượng chưa đọc và bản xem trước năm mục;
- một trang `/notifications` được phân trang với các bộ lọc tất cả/chưa đọc/đã đọc;
- danh sách cá nhân, API chưa đọc, đánh dấu một lần đọc và đánh dấu tất cả đã đọc;
- trạng thái đọc không thể đọc được trên bản ghi `Notifications` hiện tại;
- đường dẫn hành động được đưa vào danh sách cho phép do chương trình máy chủ tạo ra;
- di chuyển/chèn lấp xử lý các hàng lịch sử như đã đọc;
- tự động, tích hợp SQL và phạm vi chấp nhận của trình duyệt.

Ngoài phạm vi:

- xóa người dùng, lưu trữ hoặc dọn dẹp lưu giữ;
- màn hình nhật ký thông báo Quản trị viên/Thủ thư toàn cầu;
- thử lại thủ công hoặc giao diện người dùng quản lý mẫu;
- WebSocket, Sự kiện do máy chủ gửi, thông báo đẩy trên thiết bị di động, SMS hoặc thông điệp tiếp thị;
- URL hành động do người gọi cung cấp hoặc kênh phân phối mới;
- hiển thị thông báo xác thực/thiết lập nhạy cảm trong hộp thư đến.

## 2. Quyết định được phê duyệt

| ID | Câu hỏi | Quyết định phê duyệt | Cơ sở lý luận |
| --- | --- | --- | --- |
| BD-001 | Ai nhận được hộp thư đến? | Mọi `MEMBER`, `LIBRARIAN` và `ADMIN` đã được xác thực; mỗi cái chỉ nhìn thấy các bản ghi có `UserId` của riêng nó. | Một ranh giới cá nhân nhất quán sẽ tránh rò rỉ theo vai trò cụ thể và giữ cho giao diện người dùng có thể sử dụng lại được. |
| BD-002 | Những bản ghi nào xuất hiện? | Mọi thông báo kinh doanh không nhạy cảm đều xuất hiện trong cả quá trình xử lý email và hộp thư đến trên web. | Tái sử dụng sự kiện nguồn hiện tại và tránh các quyết định kênh khác nhau. |
| BD-003 | Điều gì xảy ra khi nhấp chuột? | Đánh dấu bản ghi đã đọc, sau đó chuyển đến lộ trình kinh doanh trong danh sách cho phép bắt nguồn từ phần máy chủ. | Cung cấp hộp thư đến có thể thao tác mà không chấp nhận đầu vào chuyển hướng mở. |
| BD-004 | Lịch sử được giữ lại như thế nào? | Giữ tất cả các hàng, phân trang chúng và không hiển thị thao tác xóa/lưu trữ. | Duy trì khả năng truy vết và tránh vòng đời thứ hai trong bản sửa đổi có giới hạn này. |
| BD-005 | Trạng thái đọc được lưu trữ ở đâu? | Thêm `ReadAt` có thể vô hiệu vào `Notifications`; không tạo bảng chiếu. | Mỗi thông báo có một người nhận, do đó, bảng hộp thư đến riêng sẽ tăng thêm rủi ro ghi kép không cần thiết. |
| BD-006 | Các hàng cũ được xử lý như thế nào? | Chèn lấp các hàng hiện có đủ điều kiện bằng `ReadAt = CreatedAt`. | Việc triển khai không được biến hàng đợi lịch sử hoàn chỉnh thành cảnh báo chưa đọc. |
| BD-007 | Có cần vận chuyển theo thời gian thực không? | Không. Tải khi khởi động lớp bao đã xác thực, làm mới tiêu điểm và thao tác ghi, đồng thời thăm dò ý kiến ​​sau mỗi 60 giây. | Đáp ứng kết quả của người dùng mà không cần giới thiệu một dịch vụ thời gian chạy khác. |

## 3. Hợp đồng sở hữu và tác nhân

| Diễn viên | Có thể làm | Không được làm | Hành vi thất bại |
| --- | --- | --- | --- |
| Tài khoản được xác thực | Liệt kê, đếm và đánh dấu các thông báo không nhạy cảm đã đọc của chính nó. | Đọc hàng của người dùng khác, truy vấn các loại nhạy cảm, thay đổi trạng thái email, xóa lịch sử hoặc cung cấp hành động URL. | ID không xác định, nhạy cảm hoặc bị thiếu sẽ trả về cùng một `404` an toàn. |
| Khách | Không có thao tác nào trong hộp thư đến. | Đọc hộp thư đến cá nhân trước khi xác thực. | `401` an toàn. |
| chức năng nguồn | Tiếp tục tạo một yêu cầu FE10 chuẩn. | Quyết định trạng thái đọc hộp thư đến hoặc cung cấp điều hướng URL. | Hợp đồng cách ly lỗi nguồn hiện tại vẫn không thay đổi. |
| FE10 | Trạng thái phân phối riêng, trạng thái đọc, trình chiếu DTO an toàn và ánh xạ hành động. | Tiết lộ nội dung nhạy cảm hoặc quyết định kết quả FE04/FE07/FE08/FE09. | Xác thực an toàn/lỗi nội bộ không có trường chứa bí mật. |
| Nhân viên/nhà cung cấp email | Tiếp tục vòng đời phân phối hiện tại. | Thay đổi `ReadAt`. | Lỗi phân phối vẫn độc lập với khả năng hiển thị web và trạng thái nguồn. |

## 4. Mô hình trạng thái trực giao

Trạng thái gửi email và trạng thái đọc hộp thư đến là độc lập:

- bàn giao: `PENDING -> PROCESSING -> SENT` hoặc
  `PENDING -> PROCESSING -> FAILED`;
- hộp thư đến: `UNREAD (ReadAt = NULL) -> READ (ReadAt = server timestamp)`.

Chỉ những bản ghi không nhạy cảm có `UserId` không có giá trị tồn tại mới đủ điều kiện trong hộp thư
đến. Các bản ghi chỉ gửi qua email được xử lý mà không có danh tính người dùng thì không có chủ sở
hữu cá nhân và do đó vẫn nằm ngoài hộp thư đến trên web. thao tác ghi đọc không bao giờ thay đổi
`Status`, `SentAt`, `AttemptCount`, `NotificationAttempts`, trạng thái nguồn hoặc dữ liệu tạm thời.
Việc lặp lại thao tác ghi đọc sẽ trả về cùng một bản ghi cuối cùng và không tạo ra nỗ lực kiểm tra/phân
phối.

## 5. Thiết kế và di chuyển dữ liệu

Thêm `Notifications.ReadAt DATETIME2 NULL`. Các bản ghi không nhạy cảm mới bắt đầu bằng `ReadAt =
NULL`. Các hồ sơ nhạy cảm vẫn bị loại trừ bất kể `ReadAt`.

Việc di cư bình thường sẽ:

1. chỉ thêm `ReadAt` khi nó không tồn tại;
2. đặt `ReadAt = CreatedAt` cho các hàng tồn tại trước khi di chuyển và
   đủ điều kiện trong hộp thư đến;
3. loại trừ các hàng nhạy cảm thay vì chuyển đổi chúng thành các mục trong hộp thư đến;
4. thêm chỉ mục hỗ trợ truy vấn `(UserId, ReadAt, CreatedAt DESC)`;
5. chạy hai lần với cùng một lược đồ và kết quả dữ liệu;
6. sử dụng các tùy chọn phiên SQL Server cần thiết cho các đối tượng được lọc/lập chỉ mục.

Tính đủ điều kiện của hộp thư đến yêu cầu `UserId` không rỗng và chính xác một trong các loại sau:

- `GENERAL_SYSTEM` với `MEMBERSHIP_RESULT` chuẩn;
- `RESERVATION_AVAILABLE` với `RESERVATION_READY` chuẩn;
- `DUE_DATE_REMINDER`;
- `OVERDUE_NOTICE`;
- `FINE_NOTICE`.

`ACCOUNT_VERIFICATION`, `PASSWORD_RESET` và `ACCOUNT_SETUP` không bao giờ nhập truy vấn danh sách,
đếm hoặc đọc.

## 6. Lập bản đồ hành động an toàn

Phần máy chủ trả về `actionPath` có nguồn gốc từ siêu dữ liệu nguồn và loại chính tắc vẫn tồn tại:

| Thông báo chuẩn | Con đường hành động |
| --- | --- |
| Kết quả thành viên | `/membership` |
| Đặt phòng đã sẵn sàng | `/reservations/mine` |
| Nhắc nhở ngày đến hạn hoặc thông báo quá hạn | `/borrowing/history` |
| Thông báo phạt | `/fines/mine` |

Ánh xạ không xác định hoặc không tương thích trả về `actionPath: null`. Không có yêu cầu, mẫu, tải
trọng, hàng cơ sở dữ liệu hoặc tham số truy vấn giao diện người dùng nào có thể ghi đè danh sách cho
phép này. Chỉ các đường dẫn ứng dụng tương đối mới được trả về.

## 7. Hợp đồng API

### 7.1 Liệt kê thông báo cá nhân

`GET /api/notifications/mine?page=1&limit=20&readState=all&type=...`

- `MEMBER`, `LIBRARIAN` hoặc `ADMIN` được xác thực;
- mặc định `page=1`, `limit=20`, `limit=100` tối đa;
- `readState` là `all`, `unread` hoặc `read`;
- `type` tùy chọn phải đủ điều kiện cho hộp thư đến;
- `CreatedAt` mới nhất trước, sau đó là `NotificationId` giảm dần;
- lọc và phân trang xảy ra trong SQL.

Phản hồi:

```json
{
  "notifications": [
    {
      "notificationId": 123,
      "type": "DUE_DATE_REMINDER",
      "title": "Library due date reminder",
      "message": "Please review your borrowing due date.",
      "createdAt": "2026-07-27T10:00:00.000Z",
      "readAt": null,
      "actionPath": "/borrowing/history"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

DTO không bao giờ trả sách email người nhận, tải trọng an toàn, khóa bình thường, dữ liệu mẫu, siêu
dữ liệu nguồn, số nhận dạng/lỗi của nhà cung cấp, nỗ lực hoặc nội dung nhạy cảm.

### 7.2 Số lượng chưa đọc

`GET /api/notifications/mine/unread-count`

Trả về `200 { "unreadCount": <non-negative integer> }` chỉ cho người dùng hiện tại và các hàng đủ
điều kiện trong hộp thư đến.

### 7.3 Đánh dấu một lần đọc

`PATCH /api/notifications/{notificationId}/read`

Bản cập nhật được bảo vệ yêu cầu `UserId` hiện tại, loại đủ điều kiện cho hộp thư đến và `ReadAt IS
NULL`. Nó trả về bản tóm tắt mục an toàn. Các hàng bị thiếu, nhạy cảm và của người dùng khác trả về
cùng một `404` an toàn. Việc lặp lại yêu cầu là bình thường.

### 7.4 Đánh dấu tất cả đã đọc

`PATCH /api/notifications/mine/read-all`

Bản cập nhật chỉ ảnh hưởng đến các hàng chưa đọc, đủ điều kiện trong hộp thư đến của người dùng hiện
tại và sử dụng một dấu thời gian của máy chủ. Nó trả về `200 { "updated": <count> }`; lặp lại nó sẽ
trả về `updated: 0`.

## 8. Thiết kế giao diện người dùng

lớp bao ứng dụng đã được xác thực sẽ hiển thị chuông cho mỗi vai trò đăng nhập:

- giá trị huy hiệu là số lượng chưa đọc, được hiển thị là `99+` trên 99;
- mở chuông sẽ tải năm mục chưa đọc mới nhất;
- trạng thái tải, trống và lỗi an toàn là rõ ràng;
- `Xem tất cả` định tuyến đến `/notifications`.

Trang `/notifications` cung cấp các bộ lọc `Tất cả`, `Chưa đọc` và `Đã đọc`, phân trang 20 hàng, thứ
tự mới nhất đầu tiên, trạng thái hình ảnh đọc/chưa đọc và `Đánh dấu tất cả đã đọc`. Nó không cho
thấy sự kiểm soát xóa/lưu trữ.

Nhấp vào một mục sẽ thử thao tác ghi đọc và sau đó điều hướng đến `actionPath` được trả về. Lỗi đọc cập
nhật không được chặn quyền truy cập vào màn hình doanh nghiệp; mục này vẫn chưa được đọc và lớp bao
được chia sẻ hiển thị cảnh báo không chặn an toàn.

lớp bao làm mới số lượng chưa đọc sau khi xác thực, trên tiêu điểm cửa sổ, sau khi thao tác ghi đọc và cứ
sau 60 giây khi được gắn kết. Bản sửa đổi này không thêm WebSocket hoặc nhân viên dịch vụ.

## 9. Hợp đồng lỗi và bảo mật

| Tình trạng | Kết quả |
| --- | --- |
| Xác thực thiếu/không hợp lệ | `401` |
| Trang, giới hạn, trạng thái đọc hoặc loại không hợp lệ | `400` |
| ID thông báo bị thiếu, nhạy cảm hoặc của người dùng khác | không thể phân biệt được `404` |
| Kho lưu trữ/nhà cung cấp/lỗi nội bộ | `500` an toàn, không có thông tin chi tiết về bộ công nghệ/nhà cung cấp |

Tất cả ủy quyền là phía máy chủ. Các truy vấn kho lưu trữ bao gồm `UserId` và danh sách cho phép đủ
điều kiện trong hộp thư đến trước khi hiện thực hóa. Vai trò bảo vệ giao diện người dùng chỉ là một
công cụ hỗ trợ khả năng sử dụng và không phải là ranh giới ủy quyền.

## 10. Chấp nhận và xác minh

Bằng chứng cần thiết:

1. kiểm tra tuyến đường/dịch vụ/kho lưu trữ để xác thực, quyền sở hữu, IDOR, an toàn
   phép chiếu, bộ lọc, phân trang, đếm và cả các thao tác ghi đọc bình thường;
2. kiểm tra chứng minh cả ba loại nhạy cảm đều vắng mặt trong danh sách/đếm/đọc;
3. Các trường hợp tích hợp FE04/FE07/FE08 chứng minh một sự kiện nguồn tạo ra một email
   bản ghi cũng hiển thị trong hộp thư đến của người nhận;
4. kiểm tra giao diện người dùng cho giới hạn huy hiệu, xem trước, trạng thái danh sách, bộ lọc, phân trang,
   lỗi đánh dấu tất cả, điều hướng nhấp chuột và lỗi đọc không chặn;
5. quá trình di chuyển SQL Server dùng một lần được thực hiện hai lần, với chức năng chèn lấp cũ và
   bằng chứng chỉ số/hậu điều kiện;
6. trình duyệt E2E dành cho `MEMBER`, `LIBRARIAN` và `ADMIN`, cộng với phủ định người dùng chéo
   Bằng chứng API;
7. đầy đủ cổng backend/frontend/deployment/traceability;
8. máy chủ đầu tiên sau đó triển khai giao diện người dùng, tính sẵn sàng, kiểm thử nhanh và trình duyệt
   xác minh trên Môi trường tiền sản xuất Azure.

## 11. Triển khai và đảo ngược

Triển khai quá trình di chuyển phụ gia và phần máy chủ API trước lớp bao giao diện người dùng. Giao
diện người dùng cũ vẫn tương thích vì các tuyến và DTO FE10 hiện tại không thay đổi. Giao diện người
dùng mới phải coi điểm cuối hộp thư đến không khả dụng là trạng thái lỗi an toàn chứ không phải là
quyền truy cập ẩn danh hoặc hộp thư đến thành công trống.

Khôi phục có thể xóa các điểm nhập giao diện người dùng và ngừng sử dụng API mới trong khi vẫn giữ
nguyên `ReadAt` có thể rỗng. Việc loại bỏ cột phá hủy là không cần thiết để khôi phục ứng dụng.

## 12. Phân phát tài liệu bắt buộc

Trước khi lập kế hoạch triển khai, cập nhật và đánh giá con người:

- `.sdd/specs/feat-notification-management/SPEC.md`;
- `.sdd/specs/feat-notification-management/CONTEXT.md`;
- `.sdd/specs/feat-notification-management/CHANGELOG.md`;
- FE10 `PLAN.md` và `TASKS.md` chỉ sau khi có sự chấp thuận bằng văn bản của SPEC;
- bộ nhớ lập kế hoạch kiểm tra/tác nhân hiện tại trong `.agents/CLAUDE.md` và
  `docs/testing/master-test-plan.md`;
- lược đồ, di chuyển, hợp đồng OpenAPI/API, bản đồ kiến trúc, hướng dẫn sử dụng và
  tạo tác truy vết trong quá trình thực hiện.

Không có mã sản phẩm, lược đồ hoặc triển khai API công khai nào được cho phép chỉ bằng tài liệu thiết kế này.
