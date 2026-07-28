# CONTEXT.md - FE11 Quản lý người dùng và vai trò

# Phiên bản: 0.3.1

# Trạng thái: ĐÃ PHÊ DUYỆT - RANH GIỚI QUẢN TRỊ TÀI KHOẢN QUẢN TRỊ 2026-07-28

# Chủ sở hữu: Dung

# Cập nhật lần cuối: 2026-07-28

# Thư mục tính năng: `.sdd/specs/feat-user-role-management/`

---

## 1. Mục đích tính năng

Quản lý người dùng và vai trò tồn tại để cho phép quản trị viên tạo và xem tài
khoản, quản lý vòng đời tài khoản và vai trò. Trường hồ sơ/cá nhân của người
dùng hiện có chỉ đọc trong FE11; người dùng đã xác thực tự duy trì trường hồ sơ
đã được phê duyệt của họ qua FE03.

Tính năng này phải giữ nhất quán ba điều:

- Ranh giới giữa thông tin tài khoản Quản trị viên có thể xem và thông tin hồ
  sơ cá nhân do người dùng sở hữu.
- Phân công vai trò và quyền người dùng.
- Vòng đời trạng thái người dùng (`INACTIVE` trong khi thiết lập tài khoản do
  quản trị tạo, `ACTIVE` sau khi thiết lập, và các trạng thái vô hiệu hóa/khóa
  sau đó).

Vì dữ liệu người dùng/vai trò kiểm soát quyền truy cập vào mọi tính năng khác,
tính năng này được xem là tính năng Đặc tả Đầy đủ.

---

## 2. Quy trình thực tế

Quy trình quản trị thư viện nhỏ/trung bình điển hình:

1. Quản trị viên cần thêm một thành viên mới vào hệ thống.
2. Quản trị viên truy cập giao diện quản lý người dùng.
3. Quản trị viên tạo tài khoản người dùng mới có email và chi tiết thành viên,
   không nhập mật khẩu.
4. Hệ thống kiểm tra email là duy nhất và gán vai trò Thành viên.
5. Hệ thống giữ tài khoản không hoạt động cho đến khi hoàn tất thiết lập mật
   khẩu.
6. Hệ thống gửi liên kết thiết lập mật khẩu dùng một lần đến email người dùng;
   Quản trị viên không bao giờ thấy mật khẩu hoặc mã thông báo.
7. Sau đó, một thủ thư cần thêm đặc quyền; Quản trị viên đổi vai trò từ Thủ thư
   sang Thủ thư+Quản trị viên.
8. Người dùng tự cập nhật tên, điện thoại hoặc địa chỉ qua FE03; Quản trị viên
   thấy kết quả ở chế độ chỉ đọc.
9. Khi người dùng rời đi, Quản trị viên vô hiệu hóa tài khoản (không xóa).
10. Với tài khoản hiện có, Quản trị viên chỉ có thể đổi vai trò hoặc vô hiệu hóa;
    việc sửa hồ sơ thuộc chủ sở hữu tài khoản đã xác thực qua FE03.
11. Quản trị viên có thể xem nhật ký kiểm toán của mọi thao tác quản lý người
    dùng.

---

## 3. Ranh giới tính năng

FE11 bao gồm:

- Xem danh sách mọi người dùng cùng lọc, sắp xếp và tìm kiếm.
- Xem chi tiết người dùng trong danh sách cho phép an toàn, không gồm mật khẩu,
  hash thông tin xác thực/mã thông báo, mã định danh phiên, liên kết thiết lập/
  đặt lại hoặc siêu dữ liệu kiểm toán bí mật.
- Xem thông tin người dùng chi tiết.
- Tạo tài khoản thành viên.
- Tạo tài khoản thủ thư.
- Giữ mọi trường cá nhân/hồ sơ của tài khoản hiện có ở chế độ chỉ đọc trong
  FE11.
- Vô hiệu hóa tài khoản người dùng.
- Vô hiệu hóa tài khoản thủ thư.
- Thay thế nguyên tử vai trò tài khoản đơn của mỗi người dùng.
- Khởi tạo email thiết lập mật khẩu cho người dùng mới tạo mà không để lộ mật
  khẩu hoặc mã thông báo cho Quản trị viên.
- Gửi lại email thiết lập tài khoản chưa hoàn tất do quản trị tạo qua thao tác
  chỉ Quản trị viên.

FE11 không bao gồm:

- Quản trị viên chỉnh sửa tên, điện thoại hoặc địa chỉ của người dùng hiện có.
  Chỉnh sửa tự phục vụ đã xác thực thuộc FE03.
- Đổi email tài khoản hiện có. Mọi khả năng trong tương lai cần luồng FE02 đã
  xác minh và nằm ngoài Giai đoạn 1.
- Người dùng tự đăng ký/đăng ký tài khoản. Việc đó thuộc Xác thực FE02.
- Người dùng tự đặt lại mật khẩu. Việc đó thuộc Xác thực FE02.
- Mở khóa tài khoản sau khóa đăng nhập thất bại trừ khi FE02/FE11 bổ sung rõ
  ràng sau này.
- Kích hoạt lại tài khoản đã vô hiệu hóa trừ khi được phê duyệt rõ là luồng riêng
  sau này.
- Quản trị viên khởi tạo đặt lại mật khẩu cho người dùng hiện có trừ khi
  FE02/FE11 bổ sung rõ sau này.
- Xóa vĩnh viễn người dùng. Chỉ hỗ trợ vô hiệu hóa.
- Nhập/xuất người dùng hoặc thao tác hàng loạt.
- Báo cáo hoặc phân tích hoạt động theo vai trò.
- Đồng bộ người dùng LDAP/Active Directory.
- Tích hợp OAuth hoặc SSO.

---

## 4. Ghi chú về mô hình dữ liệu hiện tại

Script SQL hiện tại cần bao gồm:

- `Users(UserId, Email, Username, PasswordHash, FullName, PhoneNumber, Address, Status, CreatedAt, UpdatedAt, LastLoginAt)`
- `Roles(RoleId, RoleName, Description)`
- `UserRoles(UserId, RoleId)` - ánh xạ người dùng tới vai trò
- `AuditLogs(LogId, UserId, Action, TargetUserId, Details, CreatedAt)`

Các vấn đề tiềm ẩn cần rà soát:

- Người dùng do quản trị tạo bắt đầu `INACTIVE`; FE02 chỉ chuyển họ thành
  `ACTIVE` sau khi tiêu thụ thành công mã thông báo thiết lập.
- Bảng `Users` cần `LastLoginAt` để theo dõi người dùng hoạt động.
- Bảng `Users` cần trường `FailedLoginCount` và `LockedUntil` để quản lý khóa
  tài khoản.
- Người dùng do quản trị tạo phải dùng luồng thiết lập mật khẩu FE02. Nếu SQL
  giữ `PasswordHash NOT NULL`, FE11 lưu hash bcrypt không thể dùng của giá trị
  ngẫu nhiên đã bỏ; cấm placeholder literal cố định.
- FE11 chỉ lưu hash của mã thông báo `ACCOUNT_SETUP` 24 giờ trong `AuthTokens`
  và dùng ID mã thông báo cho traceability/lũy đẳng nguồn FE10.
- `UserRoles` lưu đúng một vai trò mỗi tài khoản và `UX_UserRoles_UserId` thực
  thi lực lượng đó. Việc đổi vai trò thay thế nguyên tử ánh xạ hiện tại; mảng
  tương thích `roles` chứa đúng một mục.
- `AuditLogs` phải ghi lại điều gì thay đổi và ai thay đổi; văn bản hành động
  đơn giản không đủ.
- Cần ngăn loại vai trò Quản trị viên nếu chỉ còn một quản trị viên.
- Ràng buộc duy nhất email phải không phân biệt hoa/thường.
- Cần trường `Department` và `Specialization` cho tài khoản thủ thư.
- FE11 phải từ chối thay đổi `fullName`, `phone`, `address` và `email` của
  người dùng hiện có ở phía máy chủ; ẩn điều khiển trong UI Quản trị viên là
  không đủ.
- Không được hiển thị mật khẩu dùng chung cho Quản trị viên.

Đây không phải điểm chặn cho việc soạn thảo, nhưng phải được giải quyết trước
khi triển khai.

---

## 5. Các trường hợp sử dụng chính từ bảng phân công

| ID trường hợp sử dụng | Tên trường hợp sử dụng | Chủ sở hữu |
| ----------- | ------------- | ----- |
| UC49 | Xem danh sách người dùng | Dung |
| UC50 | Xem thông tin người dùng | Dung |
| UC51 | Tạo tài khoản người dùng | Dung |
| UC52 | Cập nhật thông tin người dùng - phân bổ lại cho tự phục vụ FE03; FE11 thực thi ranh giới Quản trị viên chỉ đọc | Dung |
| UC53 | Vô hiệu hóa tài khoản người dùng | Dung |
| UC54 | Tạo tài khoản thủ thư | Dung |
| UC55 | Cập nhật thông tin công việc Thủ thư - phân bổ lại/ngoài phạm vi tài khoản hiện có FE11 bởi Q-FE11-029 | Dung |
| UC56 | Vô hiệu hóa tài khoản thủ thư | Dung |
| UC57 | Quản lý vai trò | Dung |

---

## 6. Kiểm thử tính năng từ bảng phân công

| ID kiểm thử | Tên kiểm thử | Chủ sở hữu |
| ------- | --------- | ----- |
| FT50 | Xem danh sách người dùng | Dung |
| FT51 | Xem thông tin người dùng | Dung |
| FT52 | Tạo tài khoản người dùng | Dung |
| FT53 | Cập nhật thông tin người dùng - phân bổ lại cho FE03 cộng từ chối ranh giới FE11 | Dung |
| FT54 | Vô hiệu hóa tài khoản người dùng | Dung |
| FT55 | Tạo tài khoản thủ thư | Dung |
| FT56 | Xác minh mục tiêu Thủ thư vẫn chỉ đọc trong FE11 | Dung |
| FT57 | Vô hiệu hóa tài khoản thủ thư | Dung |
| FT58 | Quản lý vai trò | Dung |

---

## 7. Rủi ro chính

- Dữ liệu người dùng bị hỏng nếu tạo tài khoản không có giao dịch (tạo người
  dùng nhưng gán vai trò thất bại).
- Vi phạm kiểm soát truy cập nếu người dùng không được vô hiệu hóa hoặc vai trò
  không bị thu hồi đúng.
- Leo thang đặc quyền nếu không thể thu hồi vai trò quản trị từ quản trị viên
  cuối cùng.
- Mất toàn vẹn dữ liệu nếu vô tình vô hiệu hóa mọi quản trị viên mà không có
  đường phục hồi.
- Không thực thi duy nhất email cho phép tài khoản trùng với cùng email.
- Thay vai trò đồng thời có thể tạo trạng thái không nhất quán nếu ánh xạ, kiểm
  tra Quản trị viên cuối và kiểm toán không được tuần tự trong một giao dịch.
- Vô hiệu hóa mà không vô hiệu hóa phiên đang hoạt động cho phép người dùng đã
  vô hiệu hóa tiếp tục truy cập hệ thống.
- Nhật ký kiểm toán có thể không đầy đủ nếu thao tác quản lý người dùng không
  được ghi đầy đủ.
- Thiết lập mật khẩu không kiểm tra hợp lệ đúng có thể cho phép chiếm đoạt tài
  khoản trái phép.
- Thay đổi dữ liệu cá nhân không được ủy quyền có thể ghi đè thông tin do người
  dùng sở hữu, bỏ qua xác minh danh tính và làm lịch sử kiểm toán sai lệch.

---

## 8. Phụ thuộc

| Phụ thuộc | Lý do quan trọng |
| ---------- | -------------- |
| Xác thực FE02 | Dùng thông tin xác thực người dùng và thực thi đăng nhập; gán vai trò xác định quyền truy cập tính năng; sở hữu mọi thay đổi email tài khoản hiện có đã xác minh trong tương lai. |
| Hồ sơ người dùng FE03 | Sở hữu cập nhật tự phục vụ đã xác thực cho tên, điện thoại và địa chỉ; FE11 đọc nhưng không thay đổi các trường này sau khi tạo. |
| Quản lý mượn sách FE07 | Tài khoản thành viên tạo trong FE11 có thể mượn sách trong FE07. |
| Quản lý tiền phạt FE09 | Có thể truy vấn trạng thái người dùng để xác định người dùng có tiền phạt chưa thanh toán có thể bị vô hiệu hóa hay không. |
| Quản lý thông báo FE10 | Kết xuất và gửi `ACCOUNT_SETUP` chỉ cho trình yêu cầu ràng buộc với `FE11`; không lưu mã thông báo/liên kết thiết lập. |

---

## 9. Câu hỏi đã được giải quyết cho nhóm/giảng viên

| ID | Quyết định đã phê duyệt | Nguồn | Trạng thái |
| -- | ----------------- | ------ | ------ |
| Q-FE11-001 | Quản trị viên không thể tự vô hiệu hóa mình. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE11-002 | Ngăn vô hiệu hóa người dùng có lượt mượn đang hoạt động. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE11-003 | Thiết lập mật khẩu dùng cùng quy tắc độ phức tạp mật khẩu FE02. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE11-004 | Email không phân biệt hoa/thường khi đăng nhập và kiểm tra duy nhất. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE11-005 | FE11 yêu cầu gửi liên kết thiết lập dùng một lần qua FE10 sau khi commit nguồn; môi trường triển khai dùng nhà cung cấp đã cấu hình và kiểm thử dùng mô phỏng. | Gói rà soát 2026-06-10; tinh chỉnh ADR-005 2026-07-15 | APPROVED |
| Q-FE11-006 | Không xóa vĩnh viễn dữ liệu người dùng đã vô hiệu hóa trong Giai đoạn 1. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE11-007 | Không có phân cấp vai trò trong Giai đoạn 1; vai trò phẳng. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE11-008 | Quản trị viên không thể xem trường tài khoản nhạy cảm như hash mật khẩu, mã thông báo đặt lại, mã thông báo làm mới. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE11-009 | Thông báo vô hiệu hóa người dùng là công việc tùy chọn/tương lai; không có thông báo Giai đoạn 1 bắt buộc. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE11-014 | Tài khoản do quản trị tạo bắt đầu `INACTIVE` và chỉ kích hoạt sau khi FE02 hoàn tất thiết lập. | Nhat xác nhận 2026-07-15 | APPROVED |
| Q-FE11-015 | FE11 phát hành mã thông báo thiết lập, FE10 gửi `ACCOUNT_SETUP` chuẩn và FE02 tiêu thụ/kích hoạt. | Nhat xác nhận 2026-07-15; ADR-005 | APPROVED |
| Q-FE11-016 | Gửi lại chỉ Quản trị viên xoay vòng mã thông báo/sự kiện/khóa thiết lập và thực thi thời gian chờ 60 giây. | Nhat xác nhận 2026-07-15; ADR-005 | APPROVED |
| Q-FE11-027 | Quản trị viên có thể xem nhưng không chỉnh sửa tên, điện thoại, địa chỉ hoặc email của người dùng hiện có; FE03 sở hữu cập nhật cá nhân tự phục vụ, FE02 sở hữu mọi thay đổi email đã xác minh trong tương lai, FE11 chỉ sở hữu cập nhật Department/Specialization Thủ thư hiện tại. | Người dùng phê duyệt 2026-07-22 | APPROVED |
| Q-FE11-028 | Quyết định lịch sử tạm thời cho phép Quản trị viên chỉnh sửa hồ sơ được quản lý; bị Q-FE11-029 thay thế. | Người dùng phê duyệt 2026-07-25 | SUPERSEDED |
| Q-FE11-029 | Thay thế Q-FE11-028: với tài khoản hiện có, Quản trị viên FE11 có thể xem dữ liệu tài khoản/hồ sơ an toàn nhưng chỉ thay đổi vai trò đơn của tài khoản hoặc vô hiệu hóa tài khoản. FE11 không có thao tác Chỉnh sửa hồ sơ hay route thay đổi hồ sơ `PUT /api/users/{userId}`. Người dùng đã xác thực tự sửa trường đã phê duyệt qua FE03; email đã xác minh vẫn thuộc FE02. | Người dùng phê duyệt 2026-07-28 | APPROVED |

---

## 10. Ghi chú để triển khai sau

- Xử lý phần triển khai cập nhật Quản trị viên rộng trước đây chỉ là bằng chứng
  lịch sử; nó không đáp ứng hợp đồng quyền sở hữu dữ liệu cá nhân đã sửa.
- Dùng giao dịch cơ sở dữ liệu cho tạo người dùng và gán vai trò.
- Vô hiệu hóa mọi phiên đang hoạt động khi người dùng bị vô hiệu hóa.
- Thực thi duy nhất email bằng ràng buộc không phân biệt hoa/thường.
- Mọi endpoint API phải kiểm tra vai trò (chỉ Quản trị viên) và đầu vào ở máy
  chủ.
- Ghi log thao tác do FE11 sở hữu thành công (tạo, gửi lại thiết lập, vô hiệu
  hóa, đổi vai trò) cùng ID Quản trị viên và dấu thời gian; route hồ sơ đã loại
  không được tạo ghi hoặc audit thành công.
- Không công khai `PUT /api/users/{userId}` để thay đổi hồ sơ người dùng hiện
  có. Giữ thay vai trò và vô hiệu hóa là lệnh chỉ Quản trị viên riêng biệt.
- Triển khai hash mật khẩu mạnh (bcrypt) cho mật khẩu người dùng.
