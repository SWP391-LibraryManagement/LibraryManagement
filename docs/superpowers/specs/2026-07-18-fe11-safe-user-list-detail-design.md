# FE11 Danh sách người dùng an toàn và thiết kế chi tiết

Trạng thái: ĐƯỢC PHÊ DUYỆT BỞI HUMAN - 2026-07-18

chức năng: Quản lý vai trò và người dùng FE11

## 1. Quyết định

Sử dụng SDD Độ sâu đầy đủ cho một lát cắt chi tiết người dùng và danh sách người dùng FE11 được giới
hạn. Giữ ranh giới `userRepository.js` hiện có, thay thế ánh xạ phản hồi của người dùng được quản lý
bằng danh sách cho phép `UserManagementView` rõ ràng, thêm xác thực yêu cầu chi tiết/danh sách
nghiêm ngặt và tải các bản tóm tắt chỉ liên quan đến chi tiết trong một truy vấn SQL được tham số
hóa.

Phần này là hành vi cốt lõi vì các điểm cuối hiển thị dữ liệu cá nhân và xác định hợp đồng API chỉ
dành cho Quản trị viên. Trình ánh xạ rộng, xử lý truy vấn dễ dãi hoặc phản hồi không tìm thấy không
nhất quán có thể làm lộ thông tin xác thực, phá vỡ ứng dụng khách hoặc ẩn trạng thái thư mục người
dùng cũ.

## 2. Yêu cầu nguồn

Thiết kế thực hiện hoặc nâng cao các yêu cầu FE11 đã được phê duyệt này:

- `BR-FE11-001`, `BR-FE11-026`: Quyền truy cập chỉ dành cho quản trị viên và ranh giới phản hồi an toàn rõ ràng.
- `FR-FE11-001`, `AC-FE11-001`: mặc định, giới hạn, bộ lọc, trường tìm kiếm và thứ tự ổn định của danh sách được phân trang.
- `FR-FE11-002`, `AC-FE11-002`: chi tiết an toàn DTO, các tóm tắt liên quan đến xác định và loại trừ trường cấm.
- `FR-FE11-015`, `FR-FE11-016`: từ chối ủy quyền và hành vi không tìm thấy.
- `NFR-FE11-SEC-001`, `NFR-FE11-SEC-002`, `NFR-FE11-SEC-004..006`: RBAC phía máy chủ, xác thực ranh giới, SQL được tham số hóa và loại trừ trường nhạy cảm.
- `NFR-FE11-PERF-001`: áp dụng phân trang trong SQL thay vì cụ thể hóa bảng người dùng đầy đủ.

Nguồn chính: `.sdd/specs/feat-user-role-management/SPEC.md`.

Ngữ nghĩa tổng hợp nhiều chức năng đến từ:

- FE07: lượt mượn đang hoạt động là bản ghi `BorrowDetails.Status = BORROWED` hiện tại.
- FE08: đặt chỗ mở có trạng thái `ACTIVE` hoặc `NOTIFIED`.
- FE09: số dư chưa thanh toán thuộc về khoản khoản phạt có trạng thái `UNPAID`; Giai đoạn 1 không có trạng thái thanh toán một phần hợp lệ.

## 3. Vấn đề hiện tại

Trình ánh xạ người dùng được quản lý hiện tại bỏ qua thông tin xác thực nhưng trả về `phone` thay vì
trường `phoneNumber` đã được phê duyệt. Tìm kiếm danh sách bao gồm tên người dùng, số điện thoại,
địa chỉ và vai trò mặc dù FE11 giới hạn tìm kiếm ở email, tên đầy đủ và ID người dùng. Dịch vụ âm
thầm ngăn chặn phân trang không hợp lệ thay vì từ chối đầu vào không hợp lệ, các tuyến danh sách/chi
tiết không có trình xác thực tập trung và bản ghi chi tiết bị thiếu trả về `400 USER_NOT_FOUND` thay
vì `404`.

Kho lưu trữ chi tiết hiện tại trả về hình dạng hàng danh sách giống nhau và không có
`relatedSummary`. Giao diện người dùng sử dụng trực tiếp hàng danh sách đã chọn làm chi tiết, mong
đợi `phone` và không bao giờ gọi điểm cuối chi tiết.

Những khoảng trống này là các phần danh sách/chi tiết của `TD-014` và `TD-015`. `TD-012` vẫn mở vì
cơ sở dữ liệu đã được phê duyệt không có sự tồn tại lâu dài đối với thủ thư `department` hoặc
`specialization`.

## 4. Phạm vi

### Trong phạm vi

- Thay thế ánh xạ phản hồi của người dùng được quản lý bằng danh sách cho phép `UserManagementView` rõ ràng.
- Trả về `phoneNumber` thay vì `phone` trong phản hồi của người dùng được quản lý.
- Giữ các vai trò dưới dạng chuỗi tên vai trò viết hoa theo thứ tự bảng chữ cái xác định.
- Xác thực phân trang danh sách, trạng thái, vai trò và tìm kiếm tại ranh giới HTTP và ranh giới dịch vụ.
- Hạn chế tìm kiếm danh sách ở email, tên đầy đủ và ID người dùng.
- Giữ ổn định danh sách đặt hàng `CreatedAt DESC, UserId DESC`.
- Thêm một lần đọc kho lưu trữ chỉ chi tiết để trả về DTO an toàn cùng với ba trường tổng hợp bắt buộc.
- Trả về các giá trị số 0 xác định khi không có hàng nguồn tổng hợp.
- Trả về `404 USER_NOT_FOUND` cho ID người dùng tích cực hợp lệ không tồn tại.
- Cập nhật giao diện người dùng để loại bỏ các điểm kiểm soát giao diện người dùng khỏi các truy vấn danh sách, sử dụng `phoneNumber`, tìm nạp dữ liệu chi tiết thực và hiển thị các bản tóm tắt.
- Thêm các kiểm thử tuyến đường, dịch vụ, kho lưu trữ và giao diện người dùng thông qua RED-GREEN TDD.
- Cập nhật kế hoạch FE11, khả năng truy vết, chiến lược kiểm thử, nhật ký thay đổi và hồ sơ nợ kỹ thuật trong quá trình triển khai.

### Ngoài phạm vi

- Thay đổi lược đồ cơ sở dữ liệu.
- Phần giữ chỗ `department: null` hoặc `specialization: null` giả. Các trường đó vẫn vắng mặt cho đến khi `TD-012` được triển khai thông qua thay đổi lược đồ đã được phê duyệt.
- Hành vi cập nhật thông tin người dùng, đồng thời lạc quan và xử lý cập nhật không hoạt động.
- Vô hiệu hóa tài khoản và vô hiệu hóa thông tin xác thực.
- Tạo tài khoản, thiết lập gửi lại và hành vi thay đổi vai trò.
- Màn hình bảng điều khiển dành cho quản trị viên, quyền, nhật ký kiểm tra và quản lý yêu cầu.
- Những thay đổi đối với heuristic trạng thái truy vết trên toàn bộ chức năng.

## 5. Kiến trúc

Luồng yêu cầu phân lớp hiện tại vẫn còn:

```text
route validator
  -> userManagementController
  -> userManagementService
  -> userRepository
-> truy vấn SQL Server được tham số hóa
```

Không có kho lưu trữ hoặc phụ thuộc mới nào được giới thiệu. `userRepository.js` vẫn là chủ sở hữu
quyền đọc vì danh sách và chi tiết là các phép chiếu có liên quan chặt chẽ với nhau trên cùng một
bảng người dùng, hồ sơ và vai trò.

Kho lưu trữ tách biệt hành vi danh sách/đọc lại với hành vi chi tiết:

- `listManagedUsers` trả về danh sách DTO được phân trang mà không có `relatedSummary`.
- `getManagedUserById` vẫn là phương pháp đọc lại không chi tiết an toàn được sử dụng bởi các luồng thao tác ghi hiện có.
- Đọc chi tiết chuyên dụng trả về DTO an toàn cộng với `relatedSummary`, ngăn các trường chỉ chi tiết rò rỉ vào các phản hồi tạo, cập nhật hoặc thay đổi vai trò.

## 6. Hợp đồng UserManagementView

Mục danh sách và đối tượng chi tiết cơ sở chỉ chứa:

```text
userId
email
username
fullName
phoneNumber
address
status
roles
createdAt
updatedAt
lastLoginAt
```

Trình ánh xạ xây dựng trường đối tượng này theo trường. Nó không trải rộng một hàng cơ sở dữ liệu và
không ánh xạ một đối tượng người dùng rộng rãi trước khi xóa các thuộc tính nhạy cảm.

Câu trả lời không bao giờ được chứa:

```text
passwordHash
raw password
mã thông báo xác thực thô hoặc đã băm
ID mã thông báo thông tin xác thực
định danh làm mới hoặc phiên
liên kết thiết lập hoặc đặt lại
provider payload
siêu dữ liệu kiểm toán bí mật
```

`department` và `specialization` không được trả về trong lát cắt này vì không có cột lược đồ được
phê duyệt nào lưu trữ chúng. API không phát minh ra các phần giữ chỗ trống cho dữ liệu không có sẵn.

## 7. Liệt kê hợp đồng API

Điểm cuối: `GET /api/users`

| Truy vấn | Hợp đồng |
| --- | --- |
| `page` | Không bắt buộc. Mặc định là `1` chỉ khi bị bỏ qua. Khi được cung cấp, nó phải là số nguyên lớn hơn hoặc bằng `1`. |
| `limit` | Không bắt buộc. Mặc định là `20` chỉ khi bị bỏ qua. Khi được cung cấp, nó phải là số nguyên từ `1` đến `100`. |
| `status` | Không bắt buộc. Được chuẩn hóa theo trường hợp thành một trong các `ACTIVE`, `INACTIVE` hoặc `LOCKED`. |
| `role` | Không bắt buộc. Được chuẩn hóa theo trường hợp thành một trong các `MEMBER`, `LIBRARIAN` hoặc `ADMIN`. |
| `search` | Không bắt buộc. Được cắt bớt các ký tự `1..200` khi được cung cấp. Chỉ tìm kiếm email, tên đầy đủ hoặc ID người dùng văn bản. |

Giá trị được cung cấp không hợp lệ trả về `400 VALIDATION_ERROR`; chúng không bị kẹp, thay thế bằng
giá trị mặc định hoặc được coi là không có bộ lọc. Hệ thống canh gác `ALL` chỉ dành cho giao diện
người dùng và chuỗi tìm kiếm trống bị giao diện người dùng bỏ qua thay vì được gửi đến máy chủ.

Kho lưu trữ sử dụng các tham số đã nhập cho tất cả các giá trị bộ lọc. Thứ tự kết quả luôn là:

```sql
ORDER BY CreatedAt DESC, UserId DESC
```

Phản hồi giữ nguyên phong bì phân trang hiện có:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

`relatedSummary` không bao giờ xuất hiện trên các mục trong danh sách.

## 8. Chi tiết API và hợp đồng tổng hợp

Điểm cuối: `GET /api/users/{userId}`

Tuyến đường chỉ chấp nhận số nguyên dương `userId`. Hình dạng ID không hợp lệ trả về `400
VALIDATION_ERROR`. ID hợp lệ không có kết quả trả về của người dùng phù hợp:

```text
HTTP 404
code: USER_NOT_FOUND
message: Không tìm thấy người dùng.
```

Kho lưu trữ thực hiện một truy vấn chi tiết. Truy vấn đọc các trường và vai trò an toàn cơ sở, sau
đó tính toán các truy vấn con tổng hợp sau đây cho cùng một người dùng:

| Lĩnh vực | Định nghĩa |
| --- | --- |
| `activeBorrowingCount` | Đếm `BorrowDetails` đã tham gia thông qua `BorrowRequests` của người dùng trong đó `BorrowDetails.Status = 'BORROWED'`. `OVERDUE` có nguồn gốc từ FE07 và không phải là trạng thái liên tục. |
| `unpaidFineTotal` | Tổng `Amount - PaidAmount` cho `Fines.Status = 'UNPAID'`. Theo bất biến FE09 Giai đoạn 1, các khoản khoản phạt chưa thanh toán hợp lệ có `PaidAmount = 0`; phép trừ giữ nguyên ý nghĩa số dư chưa thanh toán cho các hàng kế thừa. |
| `openReservationCount` | Đếm `Reservations` với trạng thái là `ACTIVE` hoặc `NOTIFIED`. |

SQL `COALESCE` cung cấp số 0 khi không tồn tại hàng phù hợp. Phản hồi chi tiết JSON bổ sung chính xác:

```json
{
  "relatedSummary": {
    "activeBorrowingCount": 0,
    "unpaidFineTotal": 0,
    "openReservationCount": 0
  }
}
```

Không có tổng hợp nào được tải cho điểm cuối danh sách.

## 9. Trách nhiệm dịch vụ và xác nhận

Xác thực tuyến chạy sau khi xác thực và ủy quyền của Quản trị viên. Điều này duy trì hành vi hiện có
trong đó người gọi không được xác thực hoặc không phải Quản trị viên nhận được `401` hoặc `403`
trước khi chi tiết về hình dạng yêu cầu bị lộ.

Dịch vụ sẽ:

- Áp dụng các giá trị mặc định và danh sách cho phép tương tự khi được gọi trực tiếp bên ngoài tuyến HTTP.
- Từ chối các đầu vào dịch vụ trực tiếp không hợp lệ thay vì âm thầm chuẩn hóa chúng thành các giá trị hợp lệ.
- Chỉ chuyển các bộ lọc đã chuẩn hóa vào kho lưu trữ.
- Gọi đọc chi tiết chuyên dụng cho `getUser`.
- Ánh xạ kết quả chi tiết bị thiếu tới `404 USER_NOT_FOUND`.

Lát cắt này không thay đổi hành vi không tìm thấy của các hoạt động cập nhật hoặc hủy kích hoạt;
những khoản đó vẫn được hoãn lại riêng biệt.

## 10. Hành vi lối vào

`userManagementApi.js` thêm yêu cầu chi tiết tập trung cho `GET /users/{userId}`. Trình tạo yêu cầu
danh sách bỏ qua `role`, `status` và `search` khi giá trị giao diện người dùng của chúng có nghĩa là
không có bộ lọc.

`UserManagement.jsx` sẽ:

- Đọc `phoneNumber` để biết bảng, khởi tạo biểu mẫu chỉnh sửa và hiển thị chi tiết trong khi tiếp tục gửi trường yêu cầu `phone` hiện có để tạo/cập nhật điểm cuối.
- Gọi điểm cuối chi tiết khi Quản trị viên chọn hàng người dùng.
- Chỉ mở ngăn chi tiết sau khi phản hồi chi tiết thành công.
- Hiển thị ba giá trị `relatedSummary` trong ngăn kéo.
- Trên `404`, hãy đóng ngăn kéo, hiển thị thông báo an toàn và tải lại danh sách hiện tại vì hàng danh sách đã chọn đã cũ.
- Đối với các lỗi khác, hãy đóng ngăn kéo và hiển thị thông báo dự phòng an toàn hiện có.

Yêu cầu chi tiết không thêm hành vi chỉnh sửa, hủy kích hoạt hoặc quản lý vai trò mới.

## 11. Hợp đồng lỗi và bảo mật

| Tình trạng | HTTP | Mã |
| --- | ---: | --- |
| Thiếu xác thực | 401 | Mã xác thực hiện có |
| Được xác thực không phải quản trị viên | 403 | `ADMIN_REQUIRED` |
| Truy vấn danh sách hoặc ID người dùng không hợp lệ | 400 | `VALIDATION_ERROR` |
| Chi tiết không tìm thấy ID người dùng hợp lệ | 404 | `USER_NOT_FOUND` |
| Lỗi cơ sở dữ liệu không mong muốn | 500 | Lỗi nội bộ chung hiện có |

Các lỗi được trả về máy khách không bao gồm văn bản SQL, dấu vết bộ công nghệ, trường thông tin xác
thực hoặc siêu dữ liệu kho lưu trữ. Tất cả các giá trị SQL vẫn được nhập tham số; không có đầu vào
truy vấn nào được nối vào SQL.

## 12. Chiến lược kiểm thử

Việc triển khai tuân theo RED-GREEN TDD nghiêm ngặt.

### Kiểm tra lộ trình

- Chấp nhận các tham số danh sách bị bỏ qua và chuyển tiếp các giá trị mặc định chuẩn.
- Chấp nhận từng giá trị trạng thái và vai trò được phê duyệt.
- Từ chối các giá trị phân trang không hợp lệ, bằng 0, âm, phân số, quá khổ và không phải số.
- Từ chối các giá trị trạng thái/vai trò không được phê duyệt và tìm kiếm các giá trị bên ngoài `1..200` sau khi cắt bớt.
- Từ chối ID chi tiết không hợp lệ mà không gọi dịch vụ.
- Giữ nguyên quyền ưu tiên xác thực và ủy quyền của Quản trị viên so với xác thực.

### Kiểm tra dịch vụ

- Chỉ áp dụng giá trị mặc định cho các giá trị bị bỏ qua.
- Bình thường hóa tìm kiếm trạng thái/vai trò đã được phê duyệt và cắt bớt tìm kiếm.
- Từ chối đầu vào dịch vụ trực tiếp không hợp lệ trước khi truy cập kho lưu trữ.
- Chỉ chuyển tiếp hợp đồng danh sách chuẩn.
- trả sách chi tiết DTO khi thành công và ánh xạ chi tiết còn thiếu vào `404 USER_NOT_FOUND`.

### Kiểm tra kho lưu trữ

- Chỉ trả sách danh sách cho phép rõ ràng và sử dụng `phoneNumber`.
- Giữ vai trò viết hoa và sắp xếp theo thứ tự bảng chữ cái.
- Giữ thứ tự danh sách ổn định và giới hạn tìm kiếm trong email, tên đầy đủ và ID người dùng.
- Giữ `relatedSummary` vắng mặt trong danh sách/phản hồi đọc lại.
- Trả về tất cả ba tập hợp chi tiết với giá trị mặc định bằng 0 xác định.
- Xác minh các vị từ trạng thái tổng hợp khớp với ngữ nghĩa FE07, FE08 và FE09.
- Tạo hoặc mô phỏng một hàng chứa các trường mật khẩu, mã thông báo, phiên, liên kết thiết lập và bí mật kiểm tra và chứng minh rằng không có trường nào xuất hiện trong phản hồi được ánh xạ.
- Xác minh đầu vào truy vấn được tham số hóa.

### Kiểm tra giao diện người dùng

- Bỏ qua bộ lọc `ALL` và tìm kiếm trống khỏi các yêu cầu danh sách.
- Kết xuất `phoneNumber` trong bảng và ngăn chi tiết.
- Yêu cầu chi tiết khi một hàng được chọn và hiển thị tất cả các giá trị tóm tắt.
- Giữ ngăn kéo đóng lại khi thất bại.
- Tải lại danh sách sau một chi tiết `404`.

### Xác thực hồi quy

- Các kiểm thử máy chủ và giao diện người dùng FE11 tập trung.
- Bộ kiểm tra máy chủ đầy đủ và phạm vi bảo hiểm.
- giao diện kiểm tra mã, kiểm thử và xây dựng sản xuất.
- Thực thi truy vết.
- `git diff --check` và xem xét mẫu thông tin xác thực.
- Xác minh tổng hợp được hỗ trợ bởi SQL khi SQL Server khả dụng; nếu không thì hãy ghi lại nó dưới dạng bằng chứng tích hợp còn sót lại thay vì tuyên bố nó đã được thông qua.

## 13. Tài liệu và truy vết

Khi bắt đầu triển khai:

- Thêm nhóm nhiệm vụ chi tiết/danh sách có thể xem lại riêng vào FE11 `PLAN.md` và `TASKS.md`.
- Giữ trạng thái triển khai toàn bộ chức năng chính xác; lát cắt giới hạn này không hoàn thành FE11.
- Cập nhật FE11 `TEST_PLAN.md` và `CHANGELOG.md`.
- Thêm thẻ `@spec` cho `FR-FE11-001`, `FR-FE11-002`, `FR-FE11-015` và `FR-FE11-016` tại các nhánh xác thực, dịch vụ và kho lưu trữ có liên quan.
- Thu hẹp `TD-014` và `TD-015` chỉ dành cho danh sách/bằng chứng chi tiết thực sự đã hoàn thành.
- Giữ `TD-012` mở và tuyên bố rõ ràng rằng không có sự di chuyển lược đồ trường thủ thư nào xảy ra.
- Không mở rộng lát cắt này thành thay đổi chính sách của trình kiểm tra truy vết.

## 14. Rủi ro và giảm thiểu

| Rủi ro | Giảm nhẹ |
| --- | --- |
| Ánh xạ hàng rộng hiển thị cột thông tin xác thực trong tương lai | Xây dựng DTO từ danh sách cho phép trường rõ ràng và kiểm tra các cột bổ sung thù địch. |
| Tổng hợp chi tiết làm cho mỗi hàng danh sách trở nên đắt đỏ | Chỉ giữ các thông tin tổng hợp chi tiết và sử dụng một truy vấn cho một người dùng đã chọn. |
| Giao diện người dùng gửi `ALL` hoặc tìm kiếm trống và xác thực nghiêm ngặt sẽ phá vỡ hành vi hiện tại | Bỏ qua các điểm kiểm soát giao diện người dùng trước khi thực hiện yêu cầu. |
| Người tiêu dùng hiện tại vẫn đọc `phone` | Di chuyển mọi khởi tạo danh sách/chi tiết/chỉnh sửa FE11 sang `phoneNumber`; giữ nguyên việc đặt tên tải trọng yêu cầu. |
| Các bản tóm tắt chỉ chi tiết bị rò rỉ khi đọc lại thao tác ghi | Sử dụng thao tác kho lưu trữ chi tiết chuyên dụng thay vì thay đổi hình dạng đọc lại chung. |
| FE07 tồn tại/trôi trạng thái dẫn xuất khiến số lượng không chính xác | Số lượng chỉ tồn tại `BORROWED`, phù hợp với định nghĩa FE07 đã được phê duyệt. |
| Các trường thủ thư bị thiếu được trình bày không chính xác | Bỏ qua chúng và giữ lại `TD-012`; không tạo ra các phần giữ chỗ rỗng. |
| SQL Server không có sẵn trong CI | Các hợp đồng truy vấn/ ánh xạ kiểm thử đơn vị và ghi lại xác thực tổng hợp được hỗ trợ bởi SQL dưới dạng khoảng trống còn lại rõ ràng. |

## 15. Định nghĩa xong

Phần này chỉ hoàn thành khi:

- Điểm cuối danh sách và chi tiết chỉ trả về các trường an toàn đã được phê duyệt.
- `phoneNumber` thay thế `phone` trong phản hồi của người dùng và người tiêu dùng được quản lý FE11.
- Danh sách/chi tiết đầu vào không hợp lệ sẽ bị từ chối thay vì được kẹp hoặc mở rộng.
- Danh sách tìm kiếm và đặt hàng phù hợp với hợp đồng FE11 đã được phê duyệt.
- Chi tiết trả về ba tập hợp xác định và người dùng bị thiếu trả về `404 USER_NOT_FOUND`.
- Giao diện người dùng tìm nạp và hiển thị dữ liệu chi tiết thực.
- Các kiểm thử RED-GREEN về tuyến đường, dịch vụ, kho lưu trữ và giao diện người dùng đã vượt qua.
- Kiểm tra hồi quy, truy vết, khác biệt và thông tin xác thực đầy đủ hoặc bất kỳ bằng chứng SQL không có sẵn nào đều được báo cáo rõ ràng.
- FE11 lập kế hoạch, trạng thái nhiệm vụ, kế hoạch kiểm thử, nhật ký thay đổi và nợ kỹ thuật được đồng bộ hóa.
- Một con người đánh giá việc thực hiện và bằng chứng xác nhận.
