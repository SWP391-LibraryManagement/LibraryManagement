# Thiết kế khắc phục gửi email môi trường tiền sản xuất

**Trạng thái:** ĐƯỢC PHÊ DUYỆT - DESIGN AND WRITTEN REVIEW 2026-07-27

**Thiết kế đã được phê duyệt:** 2026-07-27

**Người phê duyệt:** Người dùng trong tác vụ đang hoạt động

**Văn bản đã được phê duyệt:** 2026-07-27

**Phương thức phân phối:** Kết hợp, Chiều sâu đầy đủ cho các quy tắc thông báo cốt lõi

**Cơ sở triển khai:** `origin/main` và `ca69dc87badf4d1056c0a63d97e5e411fb4cbd68`

## 1. Kết quả và phạm vi

Biện pháp khắc phục FE10/FE11 bị giới hạn này sẽ khôi phục ba hợp đồng gửi email đã được phê duyệt:

1. Cơ sở dữ liệu hiện có nhận được thông báo `ACCOUNT_SETUP` chuẩn
   mẫu được yêu cầu bởi FE11.
2. Quá trình gửi đồng bộ nhạy cảm thành công vẫn duy trì ID thông báo của nhà cung cấp
   đã được bộ điều hợp SMTP định cấu hình trả về.
3. Thông báo `PENDING` không nhạy cảm được xử lý tự động bởi
   nhân viên đang trong quá trình, thuộc sở hữu của hệ thống trong khi phần máy chủ vẫn hoạt động.

Điểm cuối xử lý thủ công được bảo vệ hiện có vẫn có sẵn. Người lao động nỗ lực hết sức với gói Azure
App Service F1 hiện tại vì gói đó có `Always On = false`; nó không được trình bày dưới dạng lập lịch
được đảm bảo trong khi ứng dụng đang ở chế độ ngủ.

Ngoài phạm vi:

- thay đổi thông tin xác thực SMTP, danh tính người gửi hoặc cấu hình Gmail;
- thêm Chức năng Azure, Ứng dụng logic, hàng đợi hoặc tài nguyên Azure trả phí;
- thay đổi các tuyến thông báo công khai hoặc DTO phản hồi;
- tự động cấp lại thông tin xác thực `ACCOUNT_SETUP` đã hết hạn;
- tự động thử lại thông báo `FAILED`;
- thay đổi cách xử lý đồng bộ đã được phê duyệt đối với các thông báo nhạy cảm.

## 2. Sổ cái nguồn-sự thật

| Mã nguồn | Nguồn và vị trí | Sửa đổi/ngày | Bằng chứng nó có thể chứng minh | Cấp thẩm quyền | Chủ sở hữu | Xung đột |
| --- | --- | --- | --- | --- | --- | --- |
| S-001 | Quyết định của người dùng trong tác vụ đang hoạt động | 27-07-2026 | Phê duyệt việc sửa chữa ba phần và nhân viên nỗ lực hết mình trong 60 giây trong quá trình | Cao nhất cho biện pháp khắc phục có giới hạn này | Người dùng | Không có sau khi phê duyệt |
| S-002 | `.sdd/specs/feat-notification-management/SPEC.md` | v0.4.4, được phê duyệt 27/07/2026 | Các loại/mẫu chuẩn, phân phối nhạy cảm đồng bộ, phân phối không nhạy cảm theo hàng đợi, Tác nhân hệ thống/Nhân viên thông báo, các lần thử và siêu dữ liệu an toàn | mốc cơ sở chức năng đã được phê duyệt | Nhật | Thiếu khởi động công nhân đã triển khai |
| S-003 | `.sdd/specs/feat-user-role-management/SPEC.md` và `.sdd/rfcs/ADR-005-admin-created-account-setup-boundary.md` | Được phê duyệt/chấp nhận từ 2026-07-15 đến 2026-07-27 | `ACCOUNT_SETUP -> ACCOUNT_SETUP`, người yêu cầu chỉ dành cho FE11, mã thông báo 24 giờ và ranh giới gửi lại | mốc cơ sở đa chức năng đã được phê duyệt | Nhật | Cơ sở dữ liệu môi trường tiền sản xuất hiện tại thiếu mẫu |
| S-004 | `.sdd/rfcs/ADR-004-auth-otp-notification-boundary.md` | Phê duyệt 2026-07-15 | Thư FE02 nhạy cảm đồng bộ và duy trì dữ liệu trạng thái/lần thử an toàn | mốc cơ sở đa chức năng đã được phê duyệt | Nhật | Thời gian chạy loại bỏ ID nhà cung cấp được trả về |
| S-005 | Triển khai và kiểm tra kho lưu trữ | `origin/main` và `ca69dc8` | Hành vi có thể quan sát được: tồn tại bộ xử lý hàng đợi thủ công; không tồn tại vòng đời của công nhân; thành công nhạy cảm ghi ID nhà cung cấp null | Quan sát, không quy chuẩn | chưa được chỉ định | Xung đột với S-002/S-004 |
| S-006 | môi trường tiền sản xuất Azure cấu hình App Service | Đã kiểm tra 2026-07-27 | Kế hoạch `F1`, `Always On = false`, chạy máy chủ | Bằng chứng môi trường | chưa được chỉ định | Giới hạn bảo đảm của người lao động |
| S-007 | Azure môi trường tiền sản xuất xác minh SMTP | Đã kiểm tra 2026-07-27 | Truyền tải SMTP được định cấu hình xác minh thành công mà không để lộ thông tin đăng nhập | Bằng chứng môi trường | chưa được chỉ định | Không quan sát thấy lỗi vận chuyển SMTP |
| S-008 | Azure SQL bản ghi/mẫu thông báo môi trường tiền sản xuất | Đã kiểm tra 2026-07-27 | Không có mẫu `ACCOUNT_SETUP`; thông báo nhạy cảm gần đây là `SENT`; các hàng không nhạy cảm vẫn là `PENDING`; các nỗ lực nhạy cảm thiếu ID nhà cung cấp | Bằng chứng môi trường | chưa được chỉ định | Xác nhận sự trôi dạt của lược đồ/dữ liệu và khoảng cách giữa các nhân viên |
| S-009 | `.sdd/rfcs/ADR-002-database-design.md` và thực tiễn di chuyển hiện có | Hiện tại tại `ca69dc8` | Các môi trường hiện tại được đồng bộ hóa thông qua các quá trình di chuyển bình thường có thể xem lại; triển khai mã không tự động áp dụng chúng | Quy trình cơ sở dữ liệu được phê duyệt | Đội | Yêu cầu bước di chuyển giai đoạn rõ ràng |

## 3. Phân loại bằng chứng

| ID bằng chứng | Phân loại | Bằng chứng hiện tại | Độ phân giải bắt buộc |
| --- | --- | --- | --- |
| E-001 | `observed-behavior` | Hạt giống mốc cơ sở chuẩn có chứa `ACCOUNT_SETUP`, nhưng cơ sở dữ liệu môi trường tiền sản xuất hiện tại thì không. | Thêm và áp dụng một quá trình di chuyển bình thường có thể xem lại để bổ sung mẫu chuẩn bị thiếu. |
| E-002 | `observed-behavior` | SMTP trả về `providerMessageId` nhưng thông báo nhạy cảm thành công sẽ chuyển `null` sang `markSent`. | Lưu giữ kết quả của nhà cung cấp trong hồ sơ nỗ lực an toàn. |
| E-003 | `observed-behavior` | Các hàng không nhạy cảm vẫn giữ nguyên `PENDING` cho đến khi nhân viên gọi gọi tuyến được bảo vệ. | Bắt đầu một công cụ thuộc sở hữu của hệ thống để sử dụng lại lõi yêu cầu/gửi/chuyển tiếp hiện có. |
| E-004 | `approved-requirement` | Việc gửi `FAILED` được thử lại theo cách thủ công trong Giai đoạn 1. | Giữ nhân viên bị giới hạn ở `PENDING`; không tự động thử lại `FAILED`. |
| E-005 | `observed-behavior` | F1 vô hiệu hóa Luôn bật và có thể tạm dừng quá trình. | Nêu rõ và kiểm tra hành vi nỗ lực cao nhất; không yêu cầu lịch trình được đảm bảo. |

## 4. Nhật ký quyết định kinh doanh

| ID quyết định | ID lát | Câu hỏi | Các lựa chọn được xem xét | Quyết định phê duyệt | Cơ sở lý luận | Người phê duyệt | Ngày quyết định | Yêu cầu bị ảnh hưởng |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BD-001 | SL-001 | Cơ sở dữ liệu hiện tại sẽ nhận được mẫu thiết lập bị thiếu như thế nào? | Xây dựng lại cơ sở dữ liệu; tự động tạo thời gian chạy; di cư bình thường | Thêm một di chuyển nâng cấp `ACCOUNT_SETUP` bình thường và áp dụng nó một cách rõ ràng cho môi trường tiền sản xuất | Giữ nguyên các hàng và tuân theo thông lệ di chuyển đã được phê duyệt | Người dùng | 27-07-2026 | ADR-005; Q-FE10-003; Q-FE11-015 |
| BD-002 | SL-002 | Những gì cần được lưu trữ sau khi gửi SMTP nhạy cảm thành công? | Vô giá trị; phản hồi đầy đủ của nhà cung cấp; chỉ ID tin nhắn | Chỉ duy trì ID thông báo của nhà cung cấp đã chuẩn hóa đã được bộ chuyển đổi trả về | Khôi phục khả năng truy vết mà không làm lộ thông tin chi tiết của nhà cung cấp hoặc nội dung tin nhắn | Người dùng | 27-07-2026 | Yêu cầu về nỗ lực/truy vết FE10; ADR-004/005 |
| BD-003 | SL-003 | Quá trình môi trường tiền sản xuất nên xếp hàng đợi các thông báo không nhạy cảm như thế nào? | Chỉ bằng tay; công nhân đang trong quá trình; Dịch vụ hẹn giờ Azure | Sử dụng một nhân viên chọn tham gia trong quá trình cứ sau 60 giây, cỡ lô 20 | Không cần thêm tài nguyên Azure cho môi trường demo | Người dùng | 27-07-2026 | Luồng tác nhân hệ thống/Nhân viên thông báo FE10 |
| BD-004 | SL-003 | Danh tính nào có thể chạy xử lý tự động? | Quản trị viên giả mạo; thủ thư giả; ranh giới xây dựng chỉ có hệ thống | Thêm bộ xử lý chỉ dành cho hệ thống và giữ nguyên kiểm tra vai trò HTTP | SYSTEM là tác nhân nội bộ, không phải vai trò đăng nhập | Người dùng | 27-07-2026 | Q-FE10-007; bất biến ủy quyền |
| BD-005 | SL-003 | Sự đảm bảo nào được đưa ra trên F1? | Đảm bảo tiến độ; nỗ lực hết sức; công nhân vô hiệu hóa | Nỗ lực tốt nhất trong khi phần máy chủ vẫn hoạt động, với thẻ khởi động ngay lập tức và thẻ 60 giây sau đó | Phù hợp với vòng đời thực tế của F1 và tránh các tuyên bố vận hành gây hiểu lầm | Người dùng | 27-07-2026 | NFR-FE10-REL; hạn chế về môi trường E-005 |

## 5. Ma trận trách nhiệm của tác nhân

| Diễn viên | Mục tiêu kinh doanh | Có thể bắt đầu | Không được biểu diễn | Chuyển đổi trạng thái thuộc sở hữu | Phạm vi đọc/ghi dữ liệu | Bàn giao | Con đường thất bại |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Người yêu cầu FE11 | Cung cấp một sự kiện thiết lập tài khoản mới | chuẩn đồng bộ `ACCOUNT_SETUP` sau khi xác nhận nguồn | Xếp hàng nội dung thiết lập, hiển thị liên kết thiết lập hoặc sử dụng lại các loại FE02 | FE10 ghi `PROCESSING -> SENT/FAILED` | Thông báo an toàn/siêu dữ liệu nguồn và chỉ thử | Bộ chuyển đổi SMTP; FE02 sau đó sử dụng mã thông báo thiết lập | bàn giao thất bại khiến tài khoản `INACTIVE`; Quản trị viên có thể gửi lại sau thời gian hồi chiêu |
| Người yêu cầu FE02 | Cung cấp các sự kiện xác minh/đặt lại OTP | Các loại nhạy cảm FE02 đồng bộ chuẩn | Duy trì hoặc hiển thị nội dung OTP/được hiển thị thô | FE10 ghi `PROCESSING -> SENT/FAILED` | Siêu dữ liệu an toàn và chỉ thử | Bộ chuyển đổi SMTP | Dòng nguồn vẫn được cam kết; cần có mã thông báo nguồn mới để phát hành lại |
| Nhân viên thông báo hệ thống | Cung cấp các sự kiện không nhạy cảm được xếp hàng đợi | Thẻ khởi động nội bộ và các đợt theo lịch trình | Xử lý các hàng nhạy cảm, tự động thử lại `FAILED` hoặc mạo danh vai trò đăng nhập | Xác nhận `PENDING -> PROCESSING`, sau đó ghi lại `SENT/FAILED` | Các hàng và lần thử thông báo không nhạy cảm | Bộ chuyển đổi SMTP | Lỗi an toàn được ghi lại; lịch trình sau đó tiếp tục |
| Thủ thư/Quản trị viên | Vận hành ranh giới phục hồi thủ công | Các tuyến đường thử lại và đang chờ xử lý được bảo vệ hiện có | Sử dụng danh tính SYSTEM hoặc gửi nội dung xác thực nhạy cảm | Chỉ chuyển đổi thủ công hiện có | DTO FE10 API được ủy quyền | Dịch vụ thông báo | Hành vi 4xx/5xx an toàn hiện tại vẫn được duy trì |
| Azure App Service | Lưu trữ quá trình máy chủ | Bắt đầu/dừng/khởi động lại quá trình Node | Đảm bảo thực thi trong khi F1 đang ngủ | Không có | Chỉ xử lý vòng đời | Bắt đầu/dừng nhân viên với máy chủ | Công nhân tiếp tục với thẻ khởi động sau khi đánh thức/khởi động lại |

## 6. Hợp đồng lát cắt kinh doanh

| ID lát | Diễn viên và kết cục | Kích hoạt | Điều kiện tiên quyết | Con đường hạnh phúc | Đường dẫn thay thế/thất bại | Quy tắc/tính toán | Bất biến trạng thái | Quyền/quyền sở hữu dữ liệu | Ví dụ chấp nhận | Phân loại |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SL-001 | FE11 có thể gửi email thiết lập trong cơ sở dữ liệu đã nâng cấp | Quản trị viên tạo hoặc gửi lại thiết lập tài khoản đủ điều kiện | Di chuyển bình thường đã được áp dụng; mẫu đang hoạt động | FE10 tìm thấy mẫu chuẩn, chỉ hiển thị trong bộ nhớ, gửi đồng bộ và ghi lại trạng thái an toàn | Thiếu bản ghi nhà cung cấp/cấu hình không an toàn; token cũ hết hạn không được hồi sinh | Các biến vẫn là `setupLink`, `expiresInHours`; di chuyển có thể chạy nhiều lần | Không có mã thông báo/liên kết/nội dung thô nào được duy trì hoặc trả về | Các vấn đề về FE11; FE10 cung cấp; FE02 tiêu thụ | AT-001, AT-002 | `approved-requirement` |
| SL-002 | Người vận hành có thể tương quan với lần thử SMTP thành công | Nhà cung cấp nhạy cảm gửi giải quyết thành công | Bộ điều hợp trả về ID tin nhắn hoặc null | FE10 lưu ID chuẩn hóa trong `NotificationAttempts.ProviderMessageId` | ID bị thiếu vẫn không có giá trị; lỗi chuyển đổi vẫn là lỗi nội bộ an toàn | Chiều rộng duy trì tối đa tuân theo hợp đồng kho lưu trữ 255 ký tự hiện có | Không có phản hồi đầy đủ của nhà cung cấp, nội dung người nhận, mã thông báo, OTP hoặc liên kết được lưu trữ trong nỗ lực | FE10 sở hữu bằng chứng bàn giao | AT-003 | `approved-requirement` |
| SL-003 | Hệ thống thoát hàng đợi thư không nhạy cảm trong khi ứng dụng đang hoạt động | Chương trình máy chủ bắt đầu, sau đó mỗi khoảng thời gian được định cấu hình sẽ trôi qua | Công nhân được kích hoạt; khoảng dương và kích thước lô; quá trình máy chủ còn sống | Một lô không chồng chéo yêu cầu các hàng cũ nhất, gửi và ghi lại các lần thử | Lỗi hàng loạt được ghi lại một cách an toàn và khoảng thời gian tiếp theo vẫn được lên lịch; Giấc ngủ F1 tạm dừng thực thi | Khoảng thời gian mặc định 60.000 ms; lô mặc định 20; từng đợt một | Các hàng nhạy cảm và `FAILED` không bao giờ được xác nhận; Ủy quyền HTTP không thay đổi | SYSTEM sở hữu bộ kích hoạt tự động; FE10 sở hữu các hiệu ứng chuyển tiếp | AT-004 đến AT-009 | `approved-requirement` |

## 7. Thiết kế thành phần và vòng đời

### 7.1 Di chuyển mẫu

Thêm một di chuyển bình thường trong `database/migrations/`:

- bắt đầu giao dịch và sử dụng `XACT_ABORT ON`;
- cập nhật hàng `ACCOUNT_SETUP` hiện có thành chủ đề/nội dung hoạt động chuẩn,
  hoặc chèn nó khi vắng mặt;
- sử dụng các biến `{{setupLink}}` và `{{expiresInHours}}` đã được phê duyệt;
- không thay đổi lược đồ và không sửa đổi các mẫu không liên quan;
- có thể được áp dụng hai lần với cùng một hàng cuối cùng.

`database/Librarymanagement.sql` đã chứa hạt giống chuẩn chính xác và không thay đổi trừ khi kiểm
thử trôi dạt chứng minh điều ngược lại. Quá trình triển khai không tự động thực hiện quá trình di
chuyển, vì vậy ứng dụng chạy thử là một bước riêng biệt được ghi lại.

### 7.2 Bằng chứng nhạy cảm của nhà cung cấp

Nhánh nhạy cảm trong `notificationService` ghi lại kết quả từ `emailProvider.send()` và chuyển
`providerResult?.providerMessageId || null` tới `markSent`.

Dịch vụ tiếp tục chỉ trả sách DTO tối thiểu hiện có. Chi tiết phản hồi của nhà cung cấp không được
thêm vào HTTP, siêu dữ liệu kiểm tra, nhật ký ứng dụng hoặc nội dung thông báo.

### 7.3 Ranh giới xử lý hệ thống

Tái cấu trúc vòng lặp hàng đợi hiện có thành một hàm bó nội bộ. Hai hàm bao có thể gọi nó:

- trình bao bọc `processPendingNotifications(input, actor, context)` hiện có,
  giữ lại ủy quyền `LIBRARIAN`/`ADMIN` và người dùng kiểm tra con người;
- một bộ xử lý hệ thống gắn với xây dựng chỉ được sử dụng bởi công nhân, nó ghi
  hành động kiểm tra tổng hợp tương tự với `userId = null`.

Lộ trình công khai, trình xác nhận, bộ điều khiển và hợp đồng phản hồi không thay đổi. Công nhân
không bao giờ tạo tác nhân Quản trị viên hoặc Thủ thư giả.

### 7.4 Vòng đời công nhân

Thêm một thành phần công nhân nhỏ với bộ xử lý, bộ lập lịch và bộ ghi được chèn:

- bị vô hiệu hóa trừ khi `NOTIFICATION_WORKER_ENABLED=true`;
- xác nhận số nguyên dương
`NOTIFICATION_WORKER_INTERVAL_MS` (`60000` mặc định) và `NOTIFICATION_WORKER_BATCH_SIZE` (`20` mặc định);
- chạy một lượt không đồng bộ sau khi khởi động chương trình máy chủ, sau đó lên lịch các lượt chuyển tiếp sau đó;
- sử dụng bộ bảo vệ chồng chéo trong bộ nhớ để lần truyền chậm không bị trùng lặp bởi lần tiếp theo
  tích tắc hẹn giờ;
- phát hiện lỗi hàng loạt, chỉ ghi lại mã an toàn ổn định cộng với bối cảnh tổng hợp,
  và vẫn theo lịch trình;
- hiển thị `stop()` để xóa bộ hẹn giờ;
- được bắt đầu/dừng bởi điểm vào máy chủ với máy chủ HTTP;
- không khởi động khi `index.js` được nhập bằng các kiểm thử.

Khóa xác nhận quyền sở hữu kho lưu trữ vẫn là biện pháp bảo vệ xuyên suốt quá trình. Công nhân chỉ
thêm chức năng bảo vệ chồng chéo quy trình-cục bộ.

### 7.5 Cấu hình môi trường tiền sản xuất

Sau khi xem xét mã và quá trình di chuyển đã sẵn sàng:

```text
NOTIFICATION_WORKER_ENABLED=true
NOTIFICATION_WORKER_INTERVAL_MS=60000
NOTIFICATION_WORKER_BATCH_SIZE=20
```

Việc di chuyển được áp dụng cho cơ sở dữ liệu môi trường tiền sản xuất hiện có trước hoặc cùng với
việc triển khai chương trình máy chủ tương thích. Không có bí mật SMTP nào được đọc vào đầu ra kiểm
thử hoặc được đưa vào kho lưu trữ.

## 8. Hợp đồng về Lỗi và An toàn

- Nhà cung cấp gửi bản ghi lỗi thông báo lỗi an toàn chung hiện có.
- Sự thành công của nhà cung cấp theo sau là quá trình chuyển đổi cơ sở dữ liệu không thành công vẫn còn
  `DELIVERY_STATE_UNCERTAIN`; nó không tự động được gửi lại.
- Lỗi của nhân viên không bao giờ chấm dứt máy chủ HTTP.
- Nhật ký công nhân không chứa địa chỉ email, nội dung thư, mã thông báo, OTP, liên kết thiết lập,
  Phản hồi SMTP, chuỗi kết nối hoặc bí mật.
- Thông báo `FAILED` vẫn chỉ được thử lại theo cách thủ công.
- Các hàng nhạy cảm vẫn bị loại trừ bởi cả kiểm tra phòng vệ theo loại và theo mẫu.
- Quá trình di chuyển có tính cộng/không có giá trị và duy trì các hàng phân tầng hiện có.
- Mã thông báo `ACCOUNT_SETUP` môi trường tiền sản xuất cũ đã hết hạn không được sử dụng lại. Gửi lại FE11 mới
  phải tạo mã thông báo mới, sự kiện nguồn và khóa bình thường.

## 9. Chấp nhận và kiểm tra bằng chứng đầu tiên

| ID chấp nhận | Quyết định | Cần có bằng chứng RED trước khi triển khai | GREEN/bằng chứng chấp nhận |
| --- | --- | --- | --- |
| AT-001 | BD-001 | Kiểm tra/thăm dò di chuyển cho thấy một DB hiện có không có `ACCOUNT_SETUP` vẫn bị thiếu | Lần thực thi đầu tiên sẽ chèn hàng hoạt động chuẩn |
| AT-002 | BD-001 | Xác nhận độ lặp lại không có/không đạt | Thực hiện lần thứ hai thành công và để lại đúng một hàng chuẩn |
| AT-003 | BD-002 | Nỗ lực thành công nhạy cảm hiện chứa `providerMessageId: null` mặc dù nhà cung cấp mô phỏng trả sách ID | Cố gắng lưu trữ ID nhà cung cấp mô phỏng; phản hồi/kiểm toán của công chúng vẫn ở mức tối thiểu |
| AT-004 | BD-003/004 | Không có bộ xử lý hệ thống tự động nào tồn tại | Bộ xử lý hệ thống thoát một thông báo `PENDING` không nhạy cảm mà không có tác nhân đăng nhập |
| AT-005 | BD-004 | Worker đơn giản sẽ cần một tác nhân nhân viên giả | Worker dùng ranh giới xây dựng chỉ dành cho hệ thống; truy cập HTTP không phải nhân viên vẫn trả về `403` |
| AT-006 | BD-003 | Không có kiểm thử vòng đời công nhân nào tồn tại | Người lao động khuyết tật không làm được việc gì; nhân viên được kích hoạt chạy khi khởi động và theo lịch trình đã định cấu hình |
| AT-007 | BD-003 | Các dấu tích của bộ đếm thời gian đồng thời có thể trùng lặp trong quá trình triển khai đơn giản | Lần đầu tiên vượt qua chậm khiến đánh dấu tiếp theo bị bỏ qua; dấu tích sau đó tiếp tục |
| AT-008 | BD-003/005 | Lỗi bộ xử lý chưa được xử lý có thể ngừng lập lịch hoặc máy chủ | Lỗi được ghi lại một cách an toàn và lượt thực hiện theo lịch trình sau đó |
| AT-009 | BD-003 | Xử lý hàng đợi rộng có thể chạm vào các hàng nhạy cảm/bị lỗi | Các kiểm thử hiện tại và mới chứng minh rằng chỉ các hàng `PENDING` không nhạy cảm mới có thể xác nhận quyền sở hữu |
| AT-010 | Tất cả | Thông báo hiện tạiCác kiểm thử/auth/deployment thiết lập mốc cơ sở | Các kiểm thử tập trung, tất cả các kiểm thử máy chủ, kiểm thử giao diện người dùng, kiểm thử triển khai, kiểm tra mã/bản dựng và truy vết vẫn ở trạng thái xanh |
| AT-011 | Tất cả | Phân đoạn hiển thị mẫu bị thiếu, hàng đang chờ xử lý và ID nhà cung cấp rỗng | Mẫu tồn tại; các lần thử mới được xử lý có trạng thái an toàn/ID nhà cung cấp chính xác; số lượng đang chờ xử lý trong khi ứng dụng đang hoạt động |

Tất cả các thay đổi sản xuất đều tuân theo RED -> GREEN -> REFACTOR. Không có tệp sản xuất nào được
chỉnh sửa trước khi quá trình kiểm tra lỗi tập trung của nó được ghi lại.

## 10. Ma trận truy vết yêu cầu

| ID quyết định | ID yêu cầu | Lát/trường hợp sử dụng | Giao diện hoặc API | Địa điểm thực hiện dự kiến ​​| ID kiểm tra chấp nhận | Bằng chứng | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BD-001 | ADR-005; Q-FE10-003; Q-FE11-015 | bàn giao thiết lập tài khoản SL-001 | Người yêu cầu FE11 nội bộ | `database/migrations/2026-07-27-fe10-account-setup-template.sql` | AT-001, AT-002 | Giai đoạn trôi SQL + độ lặp lại di chuyển | Sẵn sàng sau khi xem xét bằng văn bản |
| BD-002 | FE10 nỗ lực truy vết; ADR-004/005 | SL-002 bằng chứng bàn giao nhạy cảm | Bộ điều hợp nhà cung cấp nội bộ | `backend/src/services/notificationService.js`, kiểm tra thông báo tập trung | AT-003 | ID nhà cung cấp mô phỏng và trạng thái thử | Sẵn sàng sau khi xem xét bằng văn bản |
| BD-003 | Luồng công nhân FE10; NFR-FE10-REL | SL-003 xếp hàng bàn giao | Chỉ vòng đời nội bộ | `backend/src/services/notificationWorker.js`, `backend/src/index.js`, cấu hình và kiểm tra | AT-004, AT-006..AT-009 | Bộ lập lịch/bộ xử lý giả cộng với hồi quy tích hợp | Sẵn sàng sau khi xem xét bằng văn bản |
| BD-004 | Q-FE10-007; Ủy quyền FE10 | Ranh giới hệ thống SL-003 | Điểm cuối HTTP thủ công hiện tại không thay đổi | bộ xử lý hệ thống dịch vụ thông báo và hồi quy tuyến đường | AT-004, AT-005 | Tác nhân/kiểm toán và bằng chứng ủy quyền lộ trình | Sẵn sàng sau khi xem xét bằng văn bản |
| BD-005 | Hạn chế về môi trường E-005 | Hành vi môi trường tiền sản xuất SL-003 | Cài đặt Azure App Service | Cài đặt môi trường tiền sản xuất và bản ghi xác thực | AT-011 | F1/Luôn có bằng chứng và kiểm tra SQL/API sau triển khai | Sẵn sàng sau khi xem xét bằng văn bản |

## 11. Cổng chất lượng

| ID lát | G0 | G1 | G2 | G3 | G4 | G5 | G6 | G7 | Chặn | Chủ sở hữu | Bằng chứng tiếp theo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SL-001..SL-003 | đã qua | đã qua | đã qua | đã qua | chưa bắt đầu | chưa bắt đầu | chưa bắt đầu | chưa bắt đầu | Kế hoạch thực hiện đang chờ xử lý | Codex / Người dùng | Tạo các kiểm thử PLAN/TASKS và RED |

Giải thích cổng:

- G0-G2 được chuyển từ các hợp đồng nguồn FE10/FE11/ADR đã được phê duyệt và lỗi trực tiếp
  bằng chứng.
- G3 được thông qua vì người dùng đã phê duyệt cả hướng thiết kế và chính xác
  văn bản ngày 27-07-2026.
- G4-G7 yêu cầu kế hoạch triển khai, bằng chứng TDD, xác thực tự động,
  xác nhận giai đoạn và đánh giá của con người.

## 12. Lộ trình cắt lát

| Đặt hàng | ID lát | Kết quả | Phụ thuộc | Rủi ro kinh doanh | Chủ bàn giao | Người phê duyệt doanh nghiệp | Cổng vào | Thoát bằng chứng |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | SL-001 | DB hiện có chứa mẫu thiết lập chuẩn | Đánh giá bằng văn bản; truy cập di chuyển | Người dùng do quản trị viên tạo không thể nhận liên kết thiết lập | Codex | Người dùng | G3 đã vượt qua | AT-001/AT-002 cộng với truy vấn mẫu môi trường tiền sản xuất |
| 2 | SL-002 | Những nỗ lực nhạy cảm duy trì mối tương quan giữa nhà cung cấp an toàn | SL-001 độc lập; cùng ranh giới kiểm thử FE10 | Sự tự tin sai lầm khi không truy xuất được nguồn gốc của nhà cung cấp | Codex | Người dùng | G3 đã vượt qua | AT-003 và bộ hồi quy nhạy cảm |
| 3 | SL-003 | Thư không nhạy cảm được xếp hàng chờ thoát trong khi chương trình máy chủ vẫn hoạt động | Cấu hình bộ xử lý hệ thống và nhân viên | Tồn đọng vẫn chưa được gửi hoặc ranh giới tác nhân yếu đi | Codex | Người dùng | G3 đã vượt qua | AT-004..AT-009 cộng với việc chuyển đổi số lượng đang chờ xử lý |
| 4 | môi trường tiền sản xuất tích hợp | Thiết lập mới gửi và phân phối hàng đợi hoạt động cùng nhau | SL-001..SL-003 được xem xét và triển khai | Môi trường sống trôi dạt | Codex / Người dùng | Người dùng | G6 đã vượt qua | AT-011 và xác nhận luồng/hộp thư đến của con người |

## 13. Xác minh và khôi phục

Xác minh địa phương:

- kiểm tra khả năng lặp lại di chuyển tập trung hoặc thực thi SQL dùng một lần;
- các kiểm thử độ nhạy/hàng đợi/công nhân FE10 tập trung;
- kiểm tra máy chủ và giao diện người dùng đầy đủ;
- kiểm tra triển khai, kiểm tra tìm lỗi mã nguồn, xây dựng và truy vết;
- quét nội dung bí mật và nhạy cảm qua khác biệt.

Xác minh giai đoạn:

- xác nhận cài đặt mới mà không in bí mật;
- áp dụng di chuyển bình thường và xác nhận chính xác một hoạt động
  Mẫu `ACCOUNT_SETUP`;
- triển khai phần máy chủ được xem xét;
- xác nhận kiểm tra tình trạng/kiểm thử nhanh;
- quan sát quá trình chuyển đổi hàng `PENDING` không nhạy cảm hiện có sang `SENT` hoặc an toàn
  `FAILED` khi ứng dụng đang hoạt động;
- tạo một sự kiện kiểm thử được ủy quyền mới thay vì sử dụng lại mã thông báo đã hết hạn;
- xác minh siêu dữ liệu nỗ lực an toàn có chứa ID nhà cung cấp khi được cung cấp;
- xác minh không có giá trị nhạy cảm nào xuất hiện trong hàng thông báo, hàng kiểm tra, nhật ký hoặc
  Phản hồi HTTP.

Khôi phục:

- tắt `NOTIFICATION_WORKER_ENABLED` để ngừng xử lý tự động mà không cần
  khôi phục mã;
- hoàn nguyên việc triển khai máy chủ nếu cần;
- để nguyên mẫu `ACCOUNT_SETUP` chuẩn vì nó là bắt buộc
  theo hợp đồng FE11 đã được phê duyệt;
- không xóa lịch sử nỗ lực hoặc hàng thông báo.

## 14. Ranh giới thực thi

Được ủy quyền theo thiết kế đã được phê duyệt:

- viết kế hoạch thực hiện và phụ lục FE10/FE11 SDD;
- thêm các kiểm thử RED, sau đó thay đổi di chuyển/dịch vụ/worker/cấu hình tối thiểu;
- chạy xác thực cục bộ;
- áp dụng cài đặt di chuyển và công nhân bổ sung cho môi trường tiền sản xuất;
- triển khai và thực hiện xác minh trực tiếp an toàn.

Không được ủy quyền mà không có quyết định mới:

- mua hoặc cung cấp dịch vụ lập lịch Azure mới;
- thay đổi gói F1 App Service;
- tự động gửi lại thông tin xác thực thiết lập đã hết hạn;
- đẩy, hợp nhất hoặc tiết lộ bí mật/PII;
- thiết kế lại mẫu thông báo, chính sách thử lại hoặc API công khai.
