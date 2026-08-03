# FE11 Thiết kế lô hoàn thiện

Trạng thái: ĐÃ PHÊ DUYỆT FOR GOVERNANCE PREPARATION

Ngày: 2026-07-19

Đế: `origin/main@f706c5457254db16401009e260dd9528aeb8c3c5`

Quyết định: Hybrid SDD + ADD, Chiều sâu đầy đủ. Lược đồ, ủy quyền, đồng thời lạc quan, vô hiệu hóa
thông tin xác thực, tính nguyên tử kiểm toán và quyền sở hữu FE07 là Cốt lõi. Bản trình bày của quản
trị viên và thành phần CSV là lớp bao.

## 1. Mục tiêu

Hoàn thành các yêu cầu Quản lý vai trò và người dùng FE11 đã được phê duyệt còn lại thông qua B7 mà
không cần mở lại các phần đã hoàn thành hoặc sao chép logic kinh doanh mượn FE07.

Lô đóng khoản nợ triển khai FE11 còn lại:

- `TD-012`: thủ thư `department` và `specialization` kiên trì.
- `TD-014`: không tìm thấy cập nhật/hủy kích hoạt chưa hoàn tất và ngữ nghĩa chuyển đổi.
- `TD-015`: thiếu độ bao phủ dịch vụ cập nhật/hủy kích hoạt tập trung.
- `TD-016`: độ dài email và độ lệch đồng thời lạc quan.
- `TD-017`: Bỏ qua sự phát triển của quản trị viên lối vào tiềm ẩn không an toàn.
- `TD-025`: danh sách/chi tiết Quản lý yêu cầu chuẩn không đầy đủ và bằng chứng trạng thái cuối.

`TD-021` vẫn chỉ là phần còn lại của nhiều chức năng khi không có môi trường CI được hỗ trợ bởi SQL
Server thực sự. Nó không cho phép ẩn mã FE11, API, bảo mật hoặc khoảng cách chấp nhận của trình
duyệt.

## 2. Ranh giới đã hoàn thành hiện tại

Lô này bảo tồn các lát FE11 hoàn chỉnh B7 đã có trên `main`:

- Thiết lập tài khoản do quản trị viên tạo và gửi lại.
- Phân công và thu hồi vai trò giao dịch.
- Danh sách người dùng an toàn và DTO chi tiết.
- Hợp đồng giao diện người dùng vai trò hành động của quản trị viên.
- Nhật ký kiểm tra quản trị chuẩn.
- Phong bì danh sách người dùng chuẩn với bộ đếm FE12 độc lập.
- Điều hướng quản trị viên và ma trận quyền chỉ đọc.

Lô không thiết kế lại các ranh giới này. Kiểm tra hồi quy phải chứng minh chúng không thay đổi.

## 3. Cơ cấu phân phối

Lô sử dụng tổng cộng bốn yêu cầu hợp nhất:

1. Kích hoạt quản trị: thiết kế này, kế hoạch thực hiện, kích hoạt nhiệm vụ/nợ, lược đồ/API
   cập nhật hợp đồng và các lệnh xác nhận.
2. Triển khai Làn sóng A: Cốt lõi vòng đời của người dùng.
3. Triển khai Sóng B: Quản lý yêu cầu và chấp nhận trình duyệt.
4. Khóa tài liệu: bằng chứng B7 cuối cùng và trạng thái hoàn thành FE11.

Một H1 chi phối toàn bộ lô. Mỗi đợt triển khai nhận được một H2 trước khi xác nhận/đẩy và một H3 sau
các bước kiểm tra bắt buộc. Quá trình kết thúc nhận được H2/H3 của chính nó vì nó thay đổi bộ nhớ dự
án có thẩm quyền.

## 4. Phạm vi

### 4.1 Sóng A - Cốt lõi vòng đời của người dùng

- Di chuyển SQL Server bình thường có thể xem lại và lược đồ cơ sở được đồng bộ hóa.
- Đồng bộ hóa liên tục email người nhận FE10 trực tiếp được yêu cầu bởi email người dùng 255 ký tự
  hợp đồng.
- Sự kiên trì của trường thủ thư khi tạo, liệt kê/chi tiết và cập nhật.
- Xác thực lại hoạt động giao dịch của quản trị viên và xử lý trùng lặp xác định đối với việc tạo và tạo FE11
  thao tác ghi thiết lập-gửi lại, duy trì ranh giới thiết lập/phân phối đã hoàn thành.
- Độ dài email chuẩn là 255 ký tự.
- Cập nhật người dùng đồng thời lạc quan và không hoạt động.
- Vô hiệu hóa người dùng nguyên tử/librarian kèm theo việc vô hiệu hóa thông tin xác thực và kiểm tra.
- Cần có sự liên kết thứ tự khóa thành viên FE07 tối thiểu để tuần tự hóa phê duyệt chống lại việc hủy kích hoạt.
- Loại bỏ quyền truy cập ngầm của Quản trị viên lối vào khi Vite không ở chế độ sản xuất.
- Đồng bộ hóa API/OpenAPI/model/kiểm thử/tài liệu cho hành vi trên.

### 4.2 Sóng B - Quản lý và chấp nhận yêu cầu

- Xác thực danh sách yêu cầu của Quản trị viên chuẩn, phân trang máy chủ ổn định và phong bì phản hồi.
- Ranh giới đọc yêu cầu chi tiết của quản trị viên chuẩn.
- FE11 dự đoán an toàn về dữ liệu yêu cầu FE07.
- FE07-sở hữu các thao tác ghi phê duyệt/từ chối với việc thực thi trạng thái đầu cuối.
- Di chuyển giao diện người dùng quản trị sang phân trang máy chủ và tải chi tiết có thẩm quyền.
- Xuất CSV hoàn chỉnh bằng bộ lọc được tạo từ API đã đọc được phân trang.
- Chấp nhận FE11 Playwright dành riêng cho chức năng.

### 4.3 Ngoài phạm vi

- Kích hoạt lại các tài khoản đã bị vô hiệu hóa trong Giai đoạn 1.
- Xóa người dùng vĩnh viễn.
- Vai trò CRUD, phân cấp vai trò hoặc chỉnh sửa quyền.
- Các quy tắc nghiệp vụ phê duyệt/từ chối FE07 mới hoặc các điểm cuối thao tác ghi trùng lặp trong `/api/admin`.
- FE04 Xóa tư cách thành viên hoặc thay đổi hành vi.
- FE12 những thay đổi về sản xuất.
- Khung di chuyển mới hoặc phần phụ thuộc.
- Một bảng phiên mới; việc hủy kích hoạt sẽ làm mất hiệu lực thông tin xác thực thông qua `AuthTokens` đã được phê duyệt
  cơ chế đã được FE02/FE11 sử dụng.
- Tái cấu trúc Bảng điều khiển dành cho quản trị viên không liên quan.

## 5. Hợp đồng lược đồ

### 5.1 Cột chuẩn

Lược đồ SQL Server Giai đoạn 1 sẽ chứa:

```text
Users.Email                    NVARCHAR(255) NOT NULL UNIQUE
Users.DeactivatedAt            DATETIME NULL
UserProfiles.Department        NVARCHAR(100) NULL
UserProfiles.Specialization    NVARCHAR(100) NULL
Notifications.RecipientEmail   NVARCHAR(255) NOT NULL
```

`Department` và `Specialization` là các trường hồ sơ Thủ thư tùy chọn. Các giá trị chỉ có khoảng
trắng được lưu trữ dưới dạng `NULL`. `DeactivatedAt` là `NULL` dành cho các tài khoản đang hoạt
động, bị khóa hoặc chưa hoàn tất thiết lập và chỉ được đặt bằng giao dịch hủy kích hoạt.
`Notifications.RecipientEmail` phải mở rộng bằng `Users.Email`; mặt khác, tài khoản FE11 có thể đáp
ứng hợp đồng người dùng 255 ký tự nhưng không thành công khi FE10 vẫn tiếp tục phân phối thiết lập.

### 5.2 Cổ vật di chuyển

Tạo tập lệnh Giai đoạn 1 bình thường có thể xem lại:

```text
database/migrations/2026-07-19-fe11-finalization.sql
```

Kịch bản sẽ:

- Phát hiện mọi cột trước khi thêm hoặc thay đổi nó.
- Giữ nguyên tính duy nhất của email trong khi mở rộng cột lên 255 ký tự.
- Sử dụng tên chỉ mục/ràng buộc xác định khi phải tạo lại một đối tượng duy nhất.
- Thất bại trước khi sửa đổi nếu dữ liệu hiện có không thể đáp ứng lược đồ đích.
- Đảm bảo an toàn khi thực thi hai lần mà không có cột trùng lặp, ràng buộc hoặc thao tác ghi dữ liệu.
- Không chứa người dùng gốc, thông tin xác thực, mã thông báo hoặc dữ liệu cá nhân thực.

Các định nghĩa cột chuẩn tương tự phải được áp dụng cho `database/Librarymanagement.sql`, siêu dữ
liệu mô hình, liên kết tham số kho lưu trữ, ADR-002 và các hợp đồng dữ liệu đặc tả
FE02/FE03/FE10/FE11 bị ảnh hưởng. Hành vi của FE03 không mở rộng: nó phải ghi lại rằng hai cột Thư
viện được quản trị viên FE11 quản lý và không nằm trong danh sách cho phép đọc/cập nhật hồ sơ cá
nhân.

## 6. Hợp đồng dữ liệu quản lý người dùng

### 6.1 DTO an toàn

`UserManagementView` vẫn là phản hồi duy nhất của người dùng FE11. Danh sách cho phép hiện tại được
giữ nguyên.

- `department` và `specialization` chỉ được trả về khi mục tiêu hiện có
  Vai trò `LIBRARIAN`.
- Chúng bị bỏ qua đối với các mục tiêu không phải là Thư viện, không được trả về dưới dạng trình giữ chỗ `null` được phát minh.
- `deactivatedAt` vẫn là trường vòng đời nội bộ trừ khi FE11 SPEC an toàn DTO được phê duyệt
  được sửa đổi rõ ràng trước khi kích hoạt quản trị.
- `updatedAt` là phiên bản đồng thời không null được hiển thị dưới dạng
`COALESCE(Users.UpdatedAt, Users.CreatedAt)`. Điều này hỗ trợ các hàng cũ và mới được tạo có cột lưu
trữ có thể rỗng chưa nhận được bản cập nhật mà không cần thêm di chuyển chèn lấp.
- Các trường thông tin xác thực, mã thông báo, phiên, nhà cung cấp, liên kết và kiểm tra bí mật vẫn bị cấm.

### 6.2 Chuẩn hóa đầu vào

- Email được cắt bớt, chuẩn hóa thành chữ thường, xác thực và giới hạn ở 255 ký tự.
- `fullName` được cắt bớt, bắt buộc và giới hạn ở 100 ký tự, khớp với FE03 và FE03 được chia sẻ
  Lược đồ `UserProfiles.FullName`. Quản trị sửa ghi chú dữ liệu 255 ký tự FE11 cũ.
- `department` và `specialization` được cắt bớt và giới hạn ở 100 ký tự mỗi ký tự.
- Tùy chọn đầu vào chỉ có khoảng trắng `phone`, `address`, `department` và `specialization` trở thành
  `null`.
- `fullName` không thể chuẩn hóa thành giá trị trống.
- Mục tiêu không phải là Thủ thư nhận được trả về `department` hoặc `specialization`
  `400 VALIDATION_ERROR`; máy chủ không bao giờ âm thầm loại bỏ các trường.
- Tất cả xác thực đều thực thi trên máy chủ trước khi lưu giữ.

### 6.3 Thiết lập tài khoản Tăng cường thao tác ghi nguồn

Ranh giới tạo và thiết lập-gửi lại FE11 hiện tại vẫn không thay đổi: FE11 cam kết trạng thái nguồn
trước, sau đó yêu cầu phân phối FE10. Các giao dịch nguồn trở nên có thẩm quyền đối với các quyết
định của tác nhân và trùng lặp:

1. Quá trình xác thực, ủy quyền của quản trị viên và xác thực ranh giới diễn ra trước lệnh gọi kho lưu trữ.
2. Giao dịch khóa và xác nhận lại quyền của người dùng và vai trò Quản trị viên hiện tại trước bất kỳ mục tiêu hoặc
   thao tác ghi nguồn thiết lập.
3. Tác nhân không tồn tại trả về `404 ADMIN_NOT_FOUND`; tác nhân không hoạt động hoặc không phải Quản trị viên trả về
   `403 ADMIN_REQUIRED`. Cả hai kết quả đều không ghi trạng thái người dùng, mã thông báo hoặc trạng
   thái kiểm tra.
4. Tạo thực hiện kiểm tra email và tên người dùng đã chuẩn hóa bị khóa trước khi chèn. Một email trùng lặp,
bao gồm xung đột đồng thời từ chỉ mục xác định `UX_Users_Email`, trả về `409 EMAIL_ALREADY_EXISTS`
mà không phân phối thiết lập. Các lỗi ràng buộc không liên quan không được phân loại sai thành xung
đột email.
5. Gửi lại chỉ khóa mục tiêu và lịch sử mã thông báo thiết lập sau khi Quản trị viên hành động vượt qua quá trình xác thực lại.
6. FE10 việc phân phối chỉ được yêu cầu sau khi tạo hoặc xoay vòng mã thông báo đã cam kết. Tác nhân, xác nhận,
   các kết quả trùng lặp, thời gian hồi chiêu, thiếu mục tiêu và không đủ điều kiện không tạo ra yêu
   cầu phân phối.

Việc tăng cường này không thay đổi mức tiêu thụ mã thông báo FE02, quyền sở hữu kết xuất/phân phối
FE10, thiết lập TTL trong 24 giờ hoặc thời gian hồi chiêu gửi lại 60 giây.

## 7. Hợp đồng cập nhật lạc quan

`PUT /api/users/{userId}` yêu cầu:

```json
{
  "expectedUpdatedAt": "2026-07-19T08:00:00.000Z",
  "fullName": "Optional Name",
  "phone": "0900000000",
  "address": "Optional Address",
  "email": "optional@example.test",
  "department": "Reference",
  "specialization": "Research Support"
}
```

Chỉ luôn cần có `expectedUpdatedAt`. Nó phải bằng phiên bản hiệu quả `updatedAt` được tải từ DTO an
toàn. Phải có ít nhất một trường có thể chỉnh sửa.

Lệnh giao dịch là:

1. Xác thực và ủy quyền của quản trị viên.
2. Xác nhận ranh giới và chuẩn hóa.
3. Khóa và xác nhận lại quyền quản trị viên đang hoạt động.
4. Khóa và tải trạng thái an toàn mục tiêu và các vai trò hiện tại.
5. Trả về `404 USER_NOT_FOUND` khi mục tiêu vắng mặt.
6. So sánh `COALESCE(Users.UpdatedAt, Users.CreatedAt)` với `expectedUpdatedAt`.
7. Trả về `409 STALE_USER_STATE` trước bất kỳ trường nào hoặc thao tác ghi kiểm tra khi cũ.
8. Xác thực các trường chỉ dành cho Thủ thư đối với các vai trò bị khóa.
9. Kiểm tra tính duy nhất của email được chuẩn hóa đối với những người dùng khác trong giao dịch.
10. Tính toán độ lệch trường hiệu quả.
11. Đối với trường hợp không hoạt động, không cam kết thao tác ghi, không viết kiểm tra thành công và trả sách DTO an toàn hiện tại.
12. Để thay đổi hiệu quả, hãy duy trì các trường người dùng/hồ sơ, nâng cao `UpdatedAt`, viết một danh sách cho phép
    kiểm tra mục nhập và cam kết nguyên tử.

Phản hồi là `UserManagementView` được cập nhật, không phải là đối tượng chỉ có tin nhắn. Email chuẩn
hóa trùng lặp sẽ trả về `409 EMAIL_ALREADY_EXISTS`. Đầu vào không hợp lệ trả về `400
VALIDATION_ERROR` với chi tiết trường an toàn. Đối tượng duy nhất của cơ sở dữ liệu vẫn là người bảo
vệ đồng thời cuối cùng; SQL Server lỗi khóa trùng lặp `2601`/`2627` được ánh xạ tới cùng một phản
hồi `409 EMAIL_ALREADY_EXISTS` an toàn.

Siêu dữ liệu kiểm tra thành công của bản cập nhật chỉ chứa danh sách cho phép `changedFields` được
sắp xếp ổn định. Nó không sao chép email, điện thoại, địa chỉ, bộ phận, chuyên môn, thông tin xác
thực hoặc các giá trị trước/sau PII vào bản ghi kiểm tra.

## 8. Hợp đồng vô hiệu hóa

`PATCH /api/users/{userId}/status` chỉ chấp nhận:

```json
{
  "status": "INACTIVE",
  "expectedUpdatedAt": "2026-07-19T08:00:00.000Z"
}
```

Kích hoạt lại không được hỗ trợ trong Giai đoạn 1.

Giao dịch vô hiệu hóa sẽ:

1. Xác thực và ủy quyền cho Quản trị viên trước khi xác thực chi tiết.
2. Xác thực ID mục tiêu khẳng định, trạng thái `INACTIVE` chính xác và `expectedUpdatedAt`.
3. Khóa và xác nhận lại quyền quản trị viên đang hoạt động.
4. Khóa và tải mục tiêu.
5. trả sách `404 USER_NOT_FOUND` cho mục tiêu vắng mặt hoặc Quản trị viên đang hoạt động.
6. Từ chối việc tự hủy kích hoạt với `400 CANNOT_DEACTIVATE_SELF`.
7. Loại bỏ trạng thái cũ bằng `409 STALE_USER_STATE` trước khi thao tác ghi.
8. Phân biệt hai chế độ `INACTIVE` logic bằng `DeactivatedAt`.
   - `INACTIVE` cộng với `DeactivatedAt IS NULL` là `PENDING_ACTIVATION`; từ chối với
     `409 ACCOUNT_PENDING_ACTIVATION` vì Giai đoạn 1 không có trạng thái chờ hủy kích hoạt được phê duyệt
     chuyển tiếp.
   - `INACTIVE` plus `DeactivatedAt IS NOT NULL` đã bị vô hiệu hóa; trả sách DTO an toàn hiện tại
     bình thường không có dấu thời gian, mã thông báo hoặc thao tác ghi kiểm tra.
9. Chỉ mục tiêu `ACTIVE` hoặc `LOCKED` mới được tiến hành. Đếm chi tiết `BORROWED` đang hoạt động trong phần
giao dịch và từ chối với `409 ACTIVE_BORROWINGS_EXIST`, chỉ bao gồm số đếm trong chi tiết lỗi an toàn.
10. Đặt `Status = 'INACTIVE'`, đặt máy chủ `DeactivatedAt` và nâng cao `UpdatedAt`.
11. Thu hồi mọi thông tin xác thực `REFRESH` đang hoạt động do mục tiêu sở hữu thông qua `AuthTokens`; quyền truy cập
    mã thông báo trở nên không sử dụng được vì các yêu cầu được xác thực yêu cầu ID phiên/làm mới hoạt động của nó.
12. Viết một mục kiểm tra `USER_DEACTIVATE` chỉ chứa `previousStatus` và
    `newStatus: "INACTIVE"`.
13. Cam kết tất cả các thay đổi cùng nhau hoặc khôi phục tất cả các thay đổi nếu có bất kỳ lỗi nào.

Việc hủy kích hoạt và phê duyệt FE07 phải tuần tự hóa trên cùng một khóa người dùng trong phạm vi
thành viên trước khi đường dẫn thay đổi trạng thái vay hoặc trạng thái tài khoản. Kế hoạch thực hiện
phải so sánh thứ tự khóa FE07 SQL hiện tại với `NFR-FE07-TXN-003` đã được phê duyệt; Sóng A chỉ bao
gồm việc điều chỉnh thứ tự khóa tối thiểu cần thiết để ngăn chặn lượt mượn đã được phê duyệt và việc
hủy kích hoạt cả hai cam kết cho cùng một người dùng. Không có thay đổi về tính đủ điều kiện hoặc
quy tắc thao tác ghi của FE07.

Giao diện người dùng tải lại mục tiêu/danh sách có thẩm quyền sau khi thành công. Nó không mô phỏng
các thay đổi trạng thái cục bộ trước phản hồi của máy chủ.

## 9. Tăng cường truy cập giao diện

Loại bỏ quy tắc ngầm:

```text
import.meta.env.MODE !== 'production' => cấp quyền truy cập Quản trị viên
```

Bảng điều khiển dành cho quản trị viên sẽ yêu cầu trạng thái vai trò và người dùng được xác thực
chuẩn giống nhau ở mọi chế độ Vite. Các kiểm thử phát triển có thể đưa trạng thái kiểm thử rõ ràng
thông qua các trình trợ giúp kiểm thử hiện có, nhưng mã sản phẩm không được chứa dự phòng tạo ra
danh tính Quản trị viên.

Danh tính bị thiếu/không hợp lệ chuyển hướng đến luồng đăng nhập/từ chối truy cập đã được phê duyệt.
Thay đổi này không làm thay đổi việc xác thực máy chủ hoặc lưu trữ mã thông báo.

## 10. Hợp đồng danh sách yêu cầu hợp quy

`GET /api/admin/requests` chỉ chấp nhận:

```text
page    số nguyên dương, mặc định 1
limit   số nguyên 1..100, mặc định 20
q       chuỗi đã cắt khoảng trắng dài 1..100 khi được cung cấp
status  PENDING | APPROVED | REJECTED | COMPLETED | CANCELLED
from    YYYY-MM-DD khi được cung cấp
to      YYYY-MM-DD khi được cung cấp và from <= to
```

Xác thực và ủy quyền quản trị viên thực hiện trước khi xác thực truy vấn. Các trường truy vấn không
xác định sẽ bị bỏ qua, phù hợp với chính sách ranh giới truy vấn `matchedData` hiện có; các trường
được hỗ trợ luôn được lấy từ dữ liệu đã xác thực thay vì `req.query` thô. `from` và `to` là các bộ
lọc ngày theo lịch bao gồm `RequestDate`.

Câu trả lời chứa chính xác:

```json
{
  "data": [
    {
      "requestId": 25,
      "requestDate": "2026-07-19T08:00:00.000Z",
      "status": "PENDING",
      "member": {
        "userId": 10,
        "fullName": "Member Name",
        "email": "member@example.test",
        "phoneNumber": "0900000000"
      },
      "itemCount": 2,
      "bookTitles": ["Book A", "Book B"],
      "categories": ["Category A"]
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

Thứ tự danh sách ổn định: `RequestDate DESC, RequestId DESC`. Tìm kiếm chỉ bao gồm tên sách, tên đầy
đủ của thành viên và email của thành viên. Cần có các tham số SQL và các mẫu `LIKE` thoát. Truy vấn
dữ liệu và số lượng phải sử dụng cùng phạm vi bộ lọc.

Phân trang được áp dụng cho các tiêu đề `BorrowRequests` riêng biệt trước khi nối các hàng chi tiết
con, do đó, một trang không bao giờ cắt bỏ một yêu cầu trên các trang. Truy vấn đếm đếm các ID yêu
cầu phù hợp riêng biệt. `bookTitles` được xây dựng từ các tiêu đề chi tiết không rỗng theo thứ tự
`BorrowDetailId ASC` và duy trì một mục nhập cho mỗi chi tiết; `categories` chứa các tên danh mục
không null duy nhất theo thứ tự xuất hiện lần đầu. Kho lưu trữ phải nhóm các hàng hoặc sử dụng biểu
diễn SQL có cấu trúc; nó không được tạo các mảng này bằng cách phân tách đầu ra `STRING_AGG` được
phân cách bằng dấu phẩy vì các tiêu đề/danh mục hợp lệ có thể chứa dấu phẩy.

Giao diện người dùng di chuyển từ `fromDate`/`toDate` và phân trang máy khách sang `from`/`to` và
phân trang máy chủ chuẩn.

## 11. Hợp đồng chi tiết yêu cầu hợp quy

Thêm `GET /api/admin/requests/{requestId}`.

- Xác thực và ủy quyền quản trị viên chạy trước khi xác thực tham số.
- ID không dương/không nguyên trả về `400 VALIDATION_ERROR`.
- Yêu cầu bị thiếu trả về `404 BORROW_REQUEST_NOT_FOUND`.
- FE11 đọc qua `borrowingRepository.findBorrowRequestById()` và chiếu một sự an toàn rõ ràng
  Quản trị DTO. Nó không trùng lặp FE07 chi tiết yêu cầu SQL hoặc logic thao tác ghi.

Câu trả lời chứa chính xác:

```json
{
  "requestId": 25,
  "requestDate": "2026-07-19T08:00:00.000Z",
  "status": "PENDING",
  "createdAt": "2026-07-19T08:00:00.000Z",
  "updatedAt": null,
  "member": {
    "userId": 10,
    "memberId": 7,
    "fullName": "Member Name",
    "email": "member@example.test",
    "phoneNumber": "0900000000",
    "status": "ACTIVE"
  },
  "items": [
    {
      "borrowDetailId": 80,
      "copyId": 44,
      "barcode": "BC-0044",
      "title": "Book A",
      "author": "Author A",
      "location": "Shelf A",
      "status": "REQUESTED"
    }
  ],
  "lifecycle": {
    "approvedAt": null,
    "rejectedAt": null,
    "processedAt": null
  }
}
```

Không cho phép mật khẩu, mã thông báo, phiên, siêu dữ liệu kiểm tra thô, ID thông tin xác thực nội
bộ hoặc trường hồ sơ không liên quan.

## 12. Yêu cầu thao tác ghi và trạng thái đầu cuối

FE07 vẫn là chủ sở hữu duy nhất của:

```text
PATCH /api/borrow-requests/{requestId}/approve
PATCH /api/borrow-requests/{requestId}/reject
```

Trang Quản trị viên FE11 tiếp tục gọi các điểm cuối đó. Không có bí danh
`/api/admin/requests/{id}/approve` hoặc `/reject` nào được thêm vào.

- Chỉ các yêu cầu `PENDING` mới hiển thị các điều khiển phê duyệt/từ chối.
- Bất kỳ thao tác ghi trực tiếp nào không phải `PENDING` đều trả về `409 BORROW_REQUEST_NOT_PENDING`.
- thao tác ghi bị từ chối vì trạng thái hiện tại không phải là `PENDING` không thay đổi
  trạng thái yêu cầu/chi tiết/sao chép và viết không kiểm tra thành công.
- Giao diện người dùng tải chi tiết có thẩm quyền khi mở phương thức.
- Một thao tác ghi thành công sẽ tải lại danh sách phân trang hiện tại và nếu phương thức vẫn mở, hãy tải lại
  chi tiết có thẩm quyền của nó trước khi hiển thị trạng thái thành công.
- Một thao tác ghi thất bại sẽ giữ cho phương thức mở, bảo toàn chi tiết thành công cuối cùng và hiển thị
  lỗi FE07 an toàn.
- Chế độ xem chi tiết `APPROVED`, `REJECTED`, `COMPLETED` và `CANCELLED` ở chế độ chỉ đọc.

## 13. Xuất khẩu CSV

Không có điểm cuối xuất hoặc phần phụ thuộc nào được thêm vào. Xuất sử dụng danh sách phân trang chuẩn API:

1. Đóng băng các bộ lọc được xác nhận hiện tại.
2. Tìm nạp tất cả các trang một cách tuần tự với `limit = 100`.
3. Dừng khi `data` trống hoặc `page >= totalPages`; cái này xử lý kết quả trống kinh điển trong đó
   `totalPages` có thể là `0`.
4. Chỉ xây dựng CSV từ danh sách danh sách cho phép DTO.
5. Sử dụng các cột ổn định `requestId`, `requestDate`, `status`, `memberUserId`, `memberName`,
`memberEmail`, `memberPhoneNumber`, `itemCount`, `bookTitles` và `categories`; nối các giá trị mảng với ` | `.
6. Thêm tiền tố một trích dẫn vào bất kỳ ô nào có ký tự không phải khoảng trắng đầu tiên là `=`, `+`, `-` hoặc `@`,
   sau đó áp dụng trích dẫn CSV tiêu chuẩn/thoát dòng mới.
7. Vô hiệu hóa các nhấp chuột xuất trùng lặp trong khi thao tác chạy.
8. Hủy bỏ và báo cáo lỗi an toàn nếu bất kỳ trang nào bị lỗi; không tải xuống một phần tập tin.

## 14. Chiến lược kiểm thử

Tất cả việc triển khai đều tuân theo RED-GREEN TDD.

### 14.1 Sóng A

- Kiểm tra tĩnh/không có hiệu lực đối với tập lệnh di chuyển và đồng bộ hóa mốc cơ sở/mô hình.
- Các kiểm thử DTO an toàn chứng minh `updatedAt` chỉ quay trở lại `createdAt` khi hết dung lượng lưu trữ `UpdatedAt`
  null và cập nhật/hủy kích hoạt lạc quan so sánh cùng một giá trị hiệu quả.
- Kiểm tra kho lưu trữ để biết trạng thái tác nhân/đích bị khóa, cập nhật cũ, email trùng lặp, không hoạt động, Thủ thư
  tính bền vững của trường, khối mượn hoạt động, thu hồi mã thông báo, kiểm tra, cam kết và khôi phục.
- Thiết lập tài khoản/gửi lại các kiểm thử hồi quy chứng minh Quản trị viên hoạt động được xác thực lại trong mỗi nguồn
  giao dịch và email trùng lặp vẫn là một xung đột mang tính quyết định an toàn.
- Một kiểm thử đồng thời để hủy kích hoạt so với phê duyệt FE07 chứng minh cả hai không thể cam kết giống nhau
  người dùng và trạng thái tài khoản cuối cùng/borrowing vẫn hợp lệ.
- Kiểm tra dịch vụ để ánh xạ lỗi an toàn xác định và danh sách cho phép DTO.
- Kiểm thử định tuyến để xác thực ranh giới và ủy quyền ưu tiên của quản trị viên.
- Kiểm tra giao diện người dùng cho `expectedUpdatedAt`, trường Thư viện, tải lại có thẩm quyền và loại bỏ
  bỏ qua quản trị ngầm.
- Kiểm tra hồi quy để thiết lập tài khoản, thay đổi vai trò, đọc an toàn, Nhật ký kiểm tra và Quyền.

### 14.2 Sóng B

- Trình xác thực danh sách yêu cầu của quản trị viên, bộ lọc, phân trang ổn định và kiểm tra số lượng/phạm vi dữ liệu phù hợp.
- Yêu cầu-xác thực chi tiết, ủy quyền, ID, 404, phép chiếu và kiểm tra trường cấm.
- FE07 kiểm tra hồi quy chứng minh việc phê duyệt/từ chối không chờ xử lý trả về `409` không có thao tác ghi thành công hoặc
  kiểm toán.
- Kiểm tra giao diện người dùng cho tên truy vấn chuẩn, phân trang máy chủ, tải chi tiết, điều khiển thiết bị đầu cuối,
  bảo quản lỗi và xuất CSV an toàn nhiều trang.
- Sự chấp nhận của quản trị viên Playwright dành riêng cho chức năng với các thiết bị cố định:
  1. Truy cập trực tiếp vào Bảng điều khiển dành cho quản trị viên mà không có danh tính sẽ chuyển hướng đến thông tin đăng nhập đã được phê duyệt/quyền truy cập bị từ chối
     luồng trong cùng chế độ Vite được CI sử dụng.
  2. Đăng nhập của quản trị viên sẽ mở Tất cả người dùng, cập nhật các trường đã được phê duyệt của Thủ thư đang hoạt động, tải lại
     chi tiết có thẩm quyền, sau đó tắt thiết bị cố định đó và quan sát `INACTIVE` có thẩm quyền.
  3. Quyền tải thông qua điểm cuối FE11 chuẩn.
  4. Quản lý yêu cầu sử dụng phân trang máy chủ, mở các chi tiết đầu cuối và chờ xử lý có thẩm quyền,
     và không đưa ra các biện pháp kiểm soát phê duyệt/từ chối đối với yêu cầu đầu cuối.
  5. Xuất CSV đi qua nhiều trang cố định và chỉ chứa các cột thoát đã được phê duyệt.

### 14.3 Cổng bắt buộc

Mỗi đợt triển khai sẽ chạy:

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
npm.cmd run test:e2e
```

Đồng thời yêu cầu phân tích OpenAPI, nhập máy chủ, `git diff --check`, so sánh phạm vi chính xác,
quét trôi sản phẩm và quét bí mật/thông tin xác thực có độ tin cậy cao.

Khi có sẵn môi trường SQL Server, hãy thực hiện di chuyển hai lần và xác nhận năm cột mục tiêu cũng
như ràng buộc duy nhất về email. Nếu không có môi trường tồn tại, hãy giữ lại phần `TD-021` được hỗ
trợ bởi SQL dưới dạng phần còn lại của nhiều chức năng rõ ràng; xác minh di chuyển tĩnh không giả vờ
là thực thi SQL trực tiếp.

## 15. Quản trị và lập bản đồ nhiệm vụ

Việc kích hoạt quản trị bổ sung thêm các nhiệm vụ bị giới hạn sau:

| Nhiệm vụ | Phạm vi | Nợ |
| --- | --- | --- |
| `FE11-FIN01` | Kích hoạt hợp đồng Lô Khóa sổ đã được phê duyệt | tất cả các khoản nợ |
| `FE11-LIFE01` | Thêm di chuyển lược đồ có thể xem lại và hợp đồng được đồng bộ hóa | TD-012, TD-016 |
| `FE11-LIFE02` | Kiên trì/trả sách các trường của Thư viện và tăng cường kiểm tra tác nhân thiết lập | TD-012, TD-014 |
| `FE11-LIFE03` | Triển khai cập nhật lạc quan/không hoạt động cho người dùng | TD-014, TD-015, TD-016 |
| `FE11-LIFE04` | Thực hiện vô hiệu hóa nguyên tử và vô hiệu hóa thông tin xác thực | TD-014, TD-015, TD-016 |
| `FE11-LIFE05` | Căn chỉnh giao diện người dùng quản trị và xóa quyền truy cập quản trị viên ngầm của nhà phát triển | TD-017 |
| `FE11-LIFE06` | Tích hợp đạt đợt A H2/H3/B7 | Sóng A |
| `FE11-REQ01` | Canonicalize danh sách yêu cầu quản trị viên và đọc chi tiết | TD-025 |
| `FE11-REQ02` | Căn chỉnh chi tiết yêu cầu, phân trang, hành động và giao diện người dùng CSV | TD-025 |
| `FE11-REQ03` | Chứng minh tính bất biến trạng thái đầu cuối FE07 | TD-025 |
| `FE11-ACC01` | Vượt qua sự chấp nhận trình duyệt FE11 và tích hợp đợt B | TD-021, TD-025 |
| `FE11-FIN02` | Đóng khoản nợ FE11 cuối cùng và công bố bằng chứng B7 | khóa sổ hàng loạt |

Quản trị chỉ chuyển `TD-012`, `TD-014`, `TD-015`, `TD-016`, `TD-017` và `TD-025` sang `IN PROGRESS`
sau khi hợp nhất PR kích hoạt. `TD-021` vẫn giữ nguyên `PARTIAL` cho đến khi có bằng chứng về chức
năng chéo còn lại của nó.

## 16. Ranh giới H1/H2/H3

H1 phê duyệt:

- Hợp đồng này, thứ tự phụ thuộc hai sóng, quyền sở hữu tệp, tên lược đồ/API và các lệnh kiểm tra.
- Một sơ đồ triển khai khác biệt về kích hoạt quản trị và tách biệt.
- RED-GREEN không được cam kết hoạt động bên trong làn sóng hoạt động sau khi hợp nhất quản trị.

H1 không chấp thuận:

- Cam kết/đẩy/hợp nhất triển khai sản phẩm.
- Bất kỳ lược đồ/API/hành vi cấp phép nào không có tên trong thiết kế này.
- Chỉnh sửa song song đối với cùng một kho lưu trữ người dùng lõi, FE11 SPEC hoặc tệp SQL cơ sở.

Cần phải có H2 trước khi mỗi khác biệt triển khai được tạo được cam kết và xuất bản. H3 được yêu cầu
sau khi kiểm tra PR và trước mỗi lần hợp nhất. Việc khóa sổ chỉ cần có tài liệu nhưng vẫn yêu cầu
H2/H3 vì nó thay đổi trạng thái nợ và hoàn thành FE11.

## 17. Quyền sở hữu tệp

Kế hoạch triển khai phải chỉ định một chủ sở hữu lõi nối tiếp cho mỗi đợt.

Các tệp lõi dự kiến ​​của đợt A:

```text
database/Librarymanagement.sql
database/migrations/2026-07-19-fe11-finalization.sql
.sdd/rfcs/ADR-002-database-design.md
.sdd/specs/feat-user-role-management/SPEC.md
docs/api/api-contract.md
backend/src/models/User.js
backend/src/models/UserProfile.js
backend/src/models/Notification.js
backend/src/docs/openapi.yaml
backend/src/validators/userManagementValidators.js
backend/src/repositories/userRepository.js
backend/src/repositories/accountSetupRepository.js
backend/src/repositories/notificationRepository.js
backend/src/repositories/borrowingRepository.js
backend/src/services/userManagementService.js
backend/src/routes/userManagementRoutes.js
frontend/src/api/userManagementApi.js
frontend/src/page/UserManagement.jsx
.sdd/specs/feat-auth/SPEC.md
.sdd/specs/feat-user-profile/SPEC.md
.sdd/specs/feat-notification-management/SPEC.md
```

Các tệp lõi dự đoán của đợt B:

```text
docs/api/api-contract.md
backend/src/docs/openapi.yaml
backend/src/validators/adminValidators.js
backend/src/repositories/adminRepository.js
backend/src/services/adminService.js
backend/src/controllers/adminController.js
backend/src/routes/adminRoutes.js
frontend/src/api/adminApi.js
frontend/src/page/UserManagement.jsx
tests/e2e/fe11-admin-console.spec.js
tests/e2e/support/systemTestServer.js
```

Các kiểm thử và tệp quản trị tuân theo ranh giới sản xuất sở hữu. Không có tệp sản xuất chức năng
nào khác có thể thay đổi trừ khi kế hoạch triển khai xác định phần phụ thuộc được phê duyệt trực
tiếp và lệnh hồi quy của nó.

## 18. Rủi ro và giảm thiểu

- Sự trôi dạt lược đồ: một lần di chuyển bình thường cộng với các kiểm thử cơ sở/mô hình/ADR được đồng bộ hóa.
- Mất cập nhật: so sánh `expectedUpdatedAt` bị khóa trước khi có bất kỳ thao tác ghi nào.
- Vô hiệu hóa một phần: một giao dịch SQL cho trạng thái, dấu thời gian, thông tin xác thực và kiểm tra.
- Sự mơ hồ đang chờ xử lý/hủy kích hoạt: sử dụng `DeactivatedAt` để từ chối kích hoạt đang chờ xử lý và chỉ thực hiện một
  tài khoản đã bị vô hiệu hóa bình thường.
- Bỏ qua đặc quyền: xóa danh tính Quản trị viên phi sản xuất ngầm định; giữ ủy quyền máy chủ.
- FE07 sao chép: tái sử dụng kho lưu trữ đọc FE07 và điểm cuối thao tác ghi; FE11 chỉ sở hữu DTO quản trị viên.
- Cắt ngắn email nhiều chức năng: mở rộng tính liên tục/ràng buộc của người nhận FE10 với `Users.Email` và
  chạy hồi quy phân phối thiết lập tài khoản ở ranh giới 255 ký tự.
- Cuộc đua phê duyệt/hủy kích hoạt: chia sẻ thứ tự khóa trong phạm vi thành viên đã được phê duyệt và chứng minh tính bất biến
  với bằng chứng đồng thời.
- Sự không nhất quán về phân trang: phạm vi bộ lọc được chia sẻ và thứ tự ngắt kết nối ổn định cho dữ liệu/số lượng.
- Nội dung CSV: các trường DTO được đưa vào danh sách cho phép cộng với lối thoát tiền tố công thức.
- PR quá khổ: ranh giới Sóng A/Sóng B cố định và một chủ sở hữu Cốt lõi tại một thời điểm.
- Áp lực về lịch trình: không có PR cho mỗi khoản nợ, không có bộ tái cấu trúc không liên quan và không có khung/phụ thuộc mới.

## 19. Định nghĩa xong

FE11 chỉ có thể chuyển từ `Implementation State: DEFERRED` sang `COMPLETE THROUGH B7` khi:

- Kích hoạt quản trị, Sóng A, Sóng B và PR kết thúc được hợp nhất.
- Mỗi cam kết hợp nhất chính xác đều có bằng chứng CI `main` thành công.
- Tất cả các tiêu chí chấp nhận FE11 đều có khả năng truy vết mã/kiểm tra hoặc bằng chứng môi trường rõ ràng.
- Các hợp đồng lược đồ/API/OpenAPI/mốc cơ sở/mô hình đều đồng ý.
- `FE11-FIN01..FE11-FIN02` và tất cả các nhiệm vụ trung gian đã hoàn thành.
- `TD-012`, `TD-014`, `TD-015`, `TD-016`, `TD-017` và `TD-025` đã được giải quyết.
- Không còn khoản nợ mã sản phẩm FE11 P1 nào chưa được giải quyết.
- `TD-021`, nếu vẫn còn một phần, chỉ nêu tên thực thi SQL Server trực tiếp không khả dụng chứ không phải là
  thiếu yêu cầu về trình duyệt hoặc mã FE11.
- Quyền sở hữu thao tác ghi FE04, FE07, hành vi sản xuất FE12 và các lát FE11 đã hoàn thành vẫn còn nguyên.

## 20. Hồ sơ phê duyệt

Con người đã chấp thuận:

- Lô hoàn thiện FE11 đầy đủ đặc tả thay vì chỉ hoàn thành bản trình bày.
- Việc di chuyển lược đồ được yêu cầu.
- Kiến trúc hai sóng được đề xuất.
- Hợp đồng dữ liệu/giao dịch, bao gồm các trường Thủ thư 100 ký tự và các trường lặp lại bình thường
  vô hiệu hóa.
- FE11 Quản trị viên đọc quyền sở hữu với quyền sở hữu thao tác ghi FE07.
- Danh sách yêu cầu chuẩn `from`/`to` cộng với căn chỉnh phân trang máy chủ.
- Trình tự phân phối bốn PR và kết thúc B7 cuối cùng.

Nhật xác nhận xem xét bằng văn bản vào ngày 19-07-2026, bao gồm các sửa lỗi tự đánh giá được phát
hiện sau khi phê duyệt phần trước: FE10 đồng bộ hóa độ rộng email người nhận, FE11 `fullName` tối đa
100 căn chỉnh với FE03, từ chối hủy kích hoạt đang chờ kích hoạt, phụ thuộc lệnh khóa FE07 tối
thiểu, phiên bản đồng thời `COALESCE(UpdatedAt, CreatedAt)` không có giá trị rỗng và xác thực lại
quyền quản trị viên thực hiện giao dịch đối với các thao tác ghi tạo/thiết lập-gửi lại FE11.
