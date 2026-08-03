# FE08 Thiết kế tích hợp vay-dự trữ

Ngày: 2026-07-15

Trạng thái: ĐƯỢC PHÊ DUYỆT BỞI NHAT FOR WRITTEN REVIEW

nhánh: `docs/fe08-borrowing-reservation-integration`

## 1. Mục tiêu

Thu hẹp khoảng cách vòng đời Giai đoạn 1 giữa Vay FE07 và đặt chỗ FE08 để thành viên có đặt chỗ
`NOTIFIED` có thể mượn bản sao đã lưu giữ, trong khi mọi thành viên khác vẫn bị chặn theo mức độ ưu
tiên của hàng đợi đặt chỗ.

Giải pháp phải duy trì FE07 với tư cách là chủ sở hữu của việc tạo và phê duyệt lượt mượn, duy trì
FE08 với tư cách là chủ sở hữu của trạng thái đặt chỗ và duy trì quá trình xử lý hàng đợi thủ thư
của thủ thư.

## 2. Quyết định phê duyệt sản phẩm

Nhật đã chọn phương pháp thực hiện đơn hàng do FE07 sở hữu:

1. Thành viên được thông báo tạo yêu cầu mượn FE07 bình thường cho bản sao được giữ.
2. FE07 chỉ chấp nhận bản sao `RESERVED` khi phần đặt chỗ `NOTIFIED` của nó thuộc về thành viên đó.
3. Sự phê duyệt của Librarian/admin thay đổi nguyên bản yêu cầu mượn/chi tiết/bản sao và đặt chỗ phù hợp về trạng thái đã hoàn thành của chúng.
4. Không có điểm cuối thực hiện dành riêng cho FE08 và không có chức năng vay tự động nào được đưa vào.

## 3. Chế độ lỗi hiện tại

Các hợp đồng hiện tại để lại hai khoảng trống từ đầu đến cuối:

- FE08 tuyên bố `NOTIFIED -> FULFILLED` khi bản sao đang giữ được mượn, nhưng FE07 chỉ chấp nhận `BookCopies.Status = AVAILABLE`. Do đó, một bản sao `RESERVED` bị giữ không thể tiếp cận `FULFILLED` thông qua luồng mượn đã được phê duyệt.
- FE07 thường trả bản sao về `AVAILABLE`, trong khi xử lý hàng đợi FE08 là thủ công. Nếu FE07 không kiểm tra đặt chỗ, một yêu cầu mượn đang chờ khác có thể được phê duyệt trước khi hàng đợi được xử lý.

## 4. Phạm vi

### Trong phạm vi

- Xác thực yêu cầu mượn theo yêu cầu đặt chỗ trong FE07.
- Xác thực phê duyệt lượt mượn nhận biết đặt chỗ theo khóa cơ sở dữ liệu.
- Chuyển đổi `NOTIFIED -> FULFILLED` nguyên tử trong quá trình phê duyệt FE07.
- Bảo vệ ưu tiên hàng đợi trong khi tồn tại đặt chỗ `ACTIVE`.
- Khớp hành vi trong bộ nhớ và kho lưu trữ SQL.
- Kiểm tra siêu dữ liệu để thực hiện đặt chỗ.
- Các kiểm thử đặc tả, kế hoạch, nhiệm vụ, hợp đồng, lộ trình, dịch vụ, kho lưu trữ và đồng thời của FE07/FE08 được yêu cầu bởi hành vi này.

### Ngoài phạm vi

- Bảng hoặc cột cơ sở dữ liệu mới.
- Điểm cuối HTTP thực hiện đơn hàng mới.
- Tự động xử lý hàng đợi sau khi trả về.
- Hết hạn giữ theo lịch trình.
- Phê duyệt một phần các yêu cầu mượn nhiều bản sao.
- Thay đổi tính toán tinh tế FE09 hoặc gửi thông báo FE10.
- Đặt chỗ ở cấp độ sách; Giai đoạn 1 vẫn ở cấp độ sao chép của `CopyId`.

## 5. Ranh giới sở hữu

| Trách nhiệm | Chủ sở hữu |
| --- | --- |
| Tư cách thành viên, hạn chế vay, hạn mức vay, tạo yêu cầu, phê duyệt, ngày đến hạn | FE07 |
| Thứ tự xếp hàng đặt chỗ, lựa chọn giữ, hết hạn giữ, vòng đời đặt chỗ | FE08 |
| Sao chép trạng thái | Dữ liệu FE06, chỉ được thay đổi thông qua các giao dịch FE07/FE08 đã được phê duyệt |
| Thông báo sẵn sàng đặt chỗ | Yêu cầu FE10 được kích hoạt bởi FE08 |
| Tính khoản phạt | FE09 |

FE07 chỉ có thể cập nhật đặt chỗ lên `FULFILLED` như một phần của phê duyệt vay thành công cho cùng
một thành viên và sao chép. Nó không chọn các mục hàng đợi, hết hạn lưu giữ hoặc quyết định thứ tự
ưu tiên đặt chỗ.

## 6. Hợp đồng vay

FE07 phân loại mọi bản sao được yêu cầu cho thành viên yêu cầu trước khi tạo yêu cầu và một lần nữa
trong quá trình phê duyệt.

| Sao chép trạng thái | Trạng thái đặt chỗ cho bản sao | Yêu cầu thành viên | Kết quả |
| --- | --- | --- | --- |
| `AVAILABLE` | Không đặt chỗ `ACTIVE` hoặc `NOTIFIED` | Bất kỳ thành viên đủ điều kiện | `NORMAL_AVAILABLE` - được phép |
| `AVAILABLE` | Một hoặc nhiều đặt chỗ `ACTIVE` | Bất kỳ thành viên nào | Từ chối `RESERVATION_QUEUE_PRIORITY` |
| `RESERVED` | Việc đặt chỗ `NOTIFIED` thuộc về người yêu cầu | Chủ đặt chỗ | `HELD_FOR_MEMBER` - được phép |
| `RESERVED` | Đặt chỗ `NOTIFIED` thuộc về thành viên khác | Thành viên khác | Từ chối `COPY_NOT_AVAILABLE` |
| `RESERVED` | Không có đặt chỗ `NOTIFIED` phù hợp | Bất kỳ thành viên nào | Từ chối `RESERVATION_STATE_CONFLICT` |
| `BORROWED`, `DAMAGED`, `LOST`, `INACTIVE` | Bất kỳ | Bất kỳ thành viên nào | Từ chối `COPY_NOT_AVAILABLE` |

Đối với yêu cầu nhiều bản sao hoàn toàn hoặc không có gì, mọi bản sao phải được phân loại là
`NORMAL_AVAILABLE` hoặc `HELD_FOR_MEMBER`. Một bản sao bị chặn sẽ từ chối toàn bộ thao tác tạo hoặc
phê duyệt.

`ADMIN` và `LIBRARIAN` không bỏ qua quyền sở hữu hàng đợi. Nhân viên có thể phê duyệt yêu cầu nhưng
lượt đặt chỗ được giữ phải thuộc về thành viên sở hữu yêu cầu mượn.

## 7. Quy trình tạo yêu cầu

`POST /api/borrow-requests` vẫn là điểm cuối yêu cầu mượn của thành viên duy nhất.

1. Xác thực thành viên và chuẩn hóa `copyIds` duy nhất.
2. Xác thực tài khoản, thành viên, nợ quá hạn, khoản phạt chưa thanh toán và hạn mức vay.
3. Tải trạng thái sao chép cộng với mọi yêu cầu đặt chỗ `ACTIVE`/`NOTIFIED`.
4. Áp dụng hợp đồng mượn sách.
5. Tạo yêu cầu mượn `PENDING` và chi tiết `REQUESTED` qua transaction FE07 hiện có.

Việc tạo yêu cầu không làm thay đổi trạng thái sao chép hoặc đặt chỗ. Giao dịch phê duyệt vẫn là
thẩm quyền cho việc bàn giao cuối cùng.

## 8. Giao dịch phê duyệt

`PATCH /api/borrow-requests/{requestId}/approve` giữ hình dạng phản hồi và điểm cuối hiện có.

Giao dịch SQL sử dụng thứ tự khóa này:

1. Hàng `BorrowRequests` đang chờ xử lý.
2. Hàng thành viên/người dùng và các phụ thuộc về tính đủ điều kiện.
3. Chặn khoản phạt và chi tiết vay quá hạn.
4. Các hàng `BorrowDetails` được yêu cầu.
5. Các hàng `BookCopies` theo thứ tự `CopyId` tăng dần bằng cách sử dụng `UPDLOCK, HOLDLOCK`.
6. Các hàng `Reservations` cho các bản sao đó sử dụng `UPDLOCK, HOLDLOCK` và cùng thứ tự sao chép.
7. Số lượng bản sao được mượn đang hoạt động.

Sau khi tất cả các lần kiểm tra đều vượt qua, giao dịch:

1. Thay đổi yêu cầu thành `APPROVED`.
2. Các thay đổi được yêu cầu chi tiết đối với `BORROWED` và chỉ định ngày mượn/đến hạn.
3. Thay đổi từng bản sao thành `BORROWED`.
4. Thay đổi mọi đặt chỗ `NOTIFIED` do người yêu cầu sở hữu phù hợp thành `FULFILLED`.
5. Bảo tồn `NotifiedAt` và `ExpiresAt` làm bằng chứng lưu giữ lịch sử; `UpdatedAt` ghi lại thời gian thực hiện.
6. Viết kiểm tra phê duyệt lượt mượn hiện có và kiểm tra `RESERVATION_FULFILL` cho mỗi lần đặt chỗ đã hoàn thành.
7. Chỉ cam kết sau mỗi lần cập nhật và kiểm tra thành công.

Mọi thao tác kiểm tra hoặc ghi không thành công sẽ cuộn lại yêu cầu, chi tiết, trạng thái sao chép,
trạng thái đặt chỗ và nhật ký kiểm toán cùng nhau.

## 9. trả sách và chuyển bàn giao đợi thủ công

FE07 tiếp tục đặt một bản sao được trả về bình thường thành `AVAILABLE`. FE08 vẫn ở chế độ thủ công
ở Giai đoạn 1.

Ưu tiên hàng đợi được bảo vệ như sau:

- Mặc dù có bất kỳ đặt chỗ `ACTIVE` nào cho bản sao đó, FE07 từ chối việc tạo và phê duyệt yêu cầu thông thường với `RESERVATION_QUEUE_PRIORITY`.
- Librarian/admin chạy hành động xếp hàng FE08 hiện có, hành động này sẽ thay đổi về cơ bản phần đặt chỗ đã chọn thành `NOTIFIED` và bản sao thành `RESERVED`.
- Sau đó, thành viên được chọn có thể tạo yêu cầu mượn bản sao được giữ đó.
- Hết hạn/hủy bỏ có thể giải phóng bản sao sang `AVAILABLE`; nếu một mục nhập hàng đợi `ACTIVE` khác vẫn còn, FE07 tiếp tục chặn việc vay thông thường cho đến khi nhân viên xử lý mục nhập hàng đợi tiếp theo.

Thao tác này sẽ kết thúc cuộc đua quay lại hàng đợi mà không thay đổi chính sách xếp hàng thủ công
đã được phê duyệt.

## 10. Quy tắc đồng thời

- Mọi giao dịch thay đổi cả trạng thái sao chép và đặt chỗ đều sử dụng cùng một thứ tự khóa `BookCopies -> Reservations`. Việc giữ hàng đợi hiện tại đã tuân theo thứ tự này; hết hạn hủy và giữ phải được căn chỉnh theo nó trước khi phê duyệt bắt đầu cập nhật đặt chỗ.
- Nếu quá trình xử lý hàng đợi thắng trước, phê duyệt sẽ đọc lại `RESERVED` cộng với chủ sở hữu `NOTIFIED` đã chọn và áp dụng hợp đồng vay.
- Nếu quá trình phê duyệt nhìn thấy mục nhập hàng đợi `ACTIVE` trước khi lựa chọn, nó sẽ trả về `RESERVATION_QUEUE_PRIORITY` và không thay đổi gì.
- Hai phê duyệt cho cùng một bản sao được giữ không thể cùng thành công vì lần đầu tiên thay đổi bản sao thành `BORROWED` và đặt chỗ thành `FULFILLED` bị khóa.
- Việc phê duyệt hoặc hết hạn/hủy giữ được sắp xếp theo thứ tự bằng khóa sao chép. Nếu phê duyệt thành công, hành động phát hành sau đó sẽ đọc lại `FULFILLED` và trả về xung đột an toàn. Nếu việc phát hành thành công, việc phê duyệt sẽ chạy lại hợp đồng mượn hoàn chỉnh đối với bản sao đã phát hành và mọi hàng đợi đang hoạt động còn lại; nó chỉ có thể tiến hành như một phê duyệt bản sao có sẵn thông thường khi không còn ưu tiên đặt chỗ.

## 11. Hợp đồng lỗi

| Mã | HTTP | Ý nghĩa |
| --- | --- | --- |
| `RESERVATION_QUEUE_PRIORITY` | `409` | Hàng đợi đặt chỗ đang hoạt động phải được xử lý trước khi vay thông thường. |
| `COPY_NOT_AVAILABLE` | `409` | Thành viên này không thể mượn bản sao ở trạng thái hiện tại. |
| `RESERVATION_STATE_CONFLICT` | `409` | Bản sao là `RESERVED` không có đặt chỗ `NOTIFIED` do người yêu cầu sở hữu phù hợp. |
| `BORROW_REQUEST_NOT_PENDING` | `409` | Xung đột trạng thái phê duyệt FE07 hiện có. |

Lỗi không hiển thị danh tính thành viên từ một đặt phòng khác. Khách hàng chỉ nhận được lý do chặn
cần thiết để tiếp tục an toàn.

## 12. API và tác động của lược đồ

- Không có điểm cuối mới.
- Không cần phản hồi mở rộng DTO.
- `POST /api/borrow-requests` tiếp tục chấp nhận `{ copyIds: number[] }`.
- Phê duyệt tiếp tục sử dụng điểm cuối hiện có và các ghi chú tùy chọn.
- Không di chuyển lược đồ. `Reservations.Status = FULFILLED` và `BookCopies.Status = RESERVED/BORROWED` hiện có là đủ.

## 13. Yêu cầu thay đổi đặc tả

FE07 phải cho phép rõ ràng:

- `AVAILABLE` không có yêu cầu xếp hàng; hoặc
- `RESERVED` có đặt chỗ `NOTIFIED` do người yêu cầu sở hữu.

FE07 phải chặn rõ ràng các bản sao `AVAILABLE` bằng hàng đợi đặt chỗ đang hoạt động và phải thực
hiện việc đặt chỗ phù hợp trong quá trình phê duyệt.

FE08 phải xác định rõ ràng:

- FE07 phê duyệt làm trình kích hoạt cho `NOTIFIED -> FULFILLED`.
- Chủ sở hữu đặt chỗ được thông báo là thành viên duy nhất được phép mượn bản giữ.
- Ưu tiên hàng đợi thủ công làm trình chặn cho các hành động tạo/phê duyệt FE07 khác.
- Việc hủy được cho phép từ `ACTIVE` và `NOTIFIED`.
- `CopyId` cấp độ sao chép là mục tiêu API cuối cùng của Giai đoạn 1.

## 14. Thiết kế kiểm thử

### Kiểm tra tuyến đường và dịch vụ

- Thành viên thông thường không thể tạo yêu cầu bản sao `AVAILABLE` với hàng đợi đặt chỗ `ACTIVE`.
- Chủ sở hữu được thông báo có thể tạo yêu cầu bản sao `RESERVED` của họ.
- Thành viên khác không thể tạo yêu cầu cho bản sao đó.
- Phê duyệt yêu cầu của chủ sở hữu được thông báo thay đổi đặt chỗ thành `FULFILLED` và sao chép sang `BORROWED`.
- Việc phê duyệt cho một thành viên khác sẽ bị từ chối mà không làm lộ thông tin của chủ sở hữu đặt chỗ.
- Quá trình phê duyệt nhiều bản sao sẽ quay trở lại khi một bản sao có mức độ ưu tiên hàng đợi.
- Kiểm toán thất bại sẽ hủy bỏ việc vay mượn và thực hiện đặt chỗ.

### Kiểm tra đồng thời SQL

- Xử lý hàng đợi so với phê duyệt thông thường sẽ duy trì mức độ ưu tiên đặt chỗ.
- Hai sự chấp thuận đối với một bản sao được giữ lại chỉ cho phép một thành công.
- Giữ hàng đợi, hủy bỏ, hết hạn và phê duyệt mượn đều sử dụng lệnh khóa `BookCopies -> Reservations` mà không bị bế tắc.
- Phê duyệt so với việc hết hạn/hủy bỏ sẽ phân loại lại bản sao sau khi phát hành và duy trì mọi ưu tiên hàng đợi còn lại.
- Giao dịch thất bại khiến yêu cầu `PENDING`, chi tiết `REQUESTED`, sao chép `RESERVED` hoặc `AVAILABLE` như đã đọc ban đầu và đặt chỗ `NOTIFIED` hoặc `ACTIVE` như đã đọc ban đầu.

### Kiểm tra hợp đồng

- OpenAPI và trình xác thực giữ lại các điểm cuối và hình dạng tải trọng hiện có.
- Trình giải quyết lỗi ánh xạ `RESERVATION_QUEUE_PRIORITY` và `RESERVATION_STATE_CONFLICT` tới bản sao tiếng Việt có thể sử dụng được.

## 15. Tiêu chí chấp nhận

- AC-INT-FE07-FE08-001: Đưa ra một bản sao có hàng đặt chỗ đang hoạt động, khi một thành viên khác tạo hoặc phê duyệt yêu cầu mượn, thì thao tác sẽ trả về `409 RESERVATION_QUEUE_PRIORITY` và không thay đổi bản ghi nào.
- AC-INT-FE07-FE08-002: Đưa ra một đặt chỗ `NOTIFIED` và một bản sao `RESERVED`, khi chủ sở hữu đặt chỗ tạo một yêu cầu mượn thì FE07 sẽ chấp nhận yêu cầu mà không thay đổi trạng thái lưu giữ.
- AC-INT-FE07-FE08-003: Đưa ra yêu cầu đang chờ xử lý của chủ sở hữu đặt chỗ, khi nhân viên phê duyệt yêu cầu đó, sau đó yêu cầu/chi tiết/copy/reservation/audits cam kết nguyên tử và đặt chỗ trở thành `FULFILLED`.
- AC-INT-FE07-FE08-004: Khi xác thực thất bại, có thay đổi trạng thái đồng thời hoặc ghi kiểm toán thất bại trong quá trình phê duyệt, mọi hồ sơ mượn và đặt chỗ vẫn nhất quán với trạng thái trước transaction.
- AC-INT-FE07-FE08-005: Nếu việc hủy hoặc hết hạn sẽ giải phóng một bản sao bị giữ trong khi một mục hàng đợi đang hoạt động khác vẫn còn, khi một thành viên bình thường cố gắng mượn nó trước khi xử lý hàng đợi thì FE07 sẽ duy trì mức độ ưu tiên của hàng đợi.

## 16. Đánh giá kết quả

Thiết kế này đóng cả hai trình chặn FE07-FE08 đã được xác định trong khi vẫn duy trì hàng đợi thủ
công Giai đoạn 1 đã được phê duyệt, việc vay hoàn toàn hoặc không có gì, các điểm cuối hiện có và
ranh giới quyền sở hữu chức năng.
