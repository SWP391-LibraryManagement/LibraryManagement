# CONTEXT.md - Xác thực FE02

# Phiên bản: 0.2.6

# Trạng thái: BASELINE ĐÃ PHÊ DUYỆT 2026-07-17 - ĐANG ĐỐI SOÁT

# Chủ sở hữu: Dat

# Cập nhật lần cuối: 2026-07-27

# Thư mục tính năng: `.sdd/specs/feat-auth/`

---

## 1. Mục đích tính năng

Xác thực tồn tại để xác minh danh tính của người dùng truy cập hệ thống thư viện và thiết lập các phiên bảo mật nhằm kiểm soát quyền truy cập.

Tính năng này phải duy trì tính nhất quán của ba yếu tố:

- Xác minh danh tính người dùng thông qua thông tin đăng nhập.
- Trạng thái phiên đang hoạt động và hiệu lực của token.
- Log audit của các sự kiện xác thực phục vụ bảo mật và tuân thủ.

Vì xác thực là nền tảng của mọi cơ chế kiểm soát truy cập và bảo mật trong hệ thống, tính năng này được xem là tính năng có Đặc tả đầy đủ.

### 1.1 Kết quả về bảo mật và tính nhất quán

Đây là các kết quả mục tiêu, không phải bằng chứng cho thấy phần triển khai hiện tại đã đáp ứng các kết quả đó. Các quy tắc nghiệp vụ, yêu cầu chức năng, tiêu chí nghiệm thu chi tiết và những giới hạn có chủ đích của Giai đoạn 1 trong `SPEC.md` vẫn là nguồn có thẩm quyền.

- Mật khẩu không bao giờ được lưu trữ hoặc ghi log ở dạng văn bản thuần. Mật khẩu được lưu bằng bcrypt với hệ số chi phí ít nhất là 10 và cấu hình production không được giảm mức chi phí đã phê duyệt đó.
- OTP xác minh và đặt lại mật khẩu được tạo bằng nguồn ngẫu nhiên an toàn về mặt mật mã, gồm đúng sáu chữ số, hết hạn sau 15 phút và chỉ được lưu dưới dạng hash. OTP thô không được xuất hiện trong response công khai, dữ liệu lưu trữ, log ứng dụng hoặc metadata audit.
- Access token hết hạn sau 15 phút. Thông tin xác thực refresh/phiên hết hạn sau 7 ngày, chỉ được lưu dưới dạng hash và luôn liên kết với các access token được cấp từ đó.
- Mọi request được bảo vệ đều xác thực access token, trạng thái người dùng hiện tại, thông tin xác thực refresh/phiên được liên kết, thời hạn và vai trò bắt buộc trước khi xử lý nghiệp vụ.
- Đăng xuất thu hồi ngay thông tin xác thực refresh/phiên hiện tại được gửi lên. Giai đoạn 1 vẫn cho phép nhiều phiên đồng thời; việc xử lý các phiên khác sau khi thay đổi hoặc đặt lại mật khẩu phải tuân theo hợp đồng rõ ràng trong `SPEC.md`.
- Một tài khoản đã biết sẽ bị khóa sau 5 lần nhập sai mật khẩu liên tiếp trong cửa sổ trượt 15 phút và bị khóa đúng 30 phút. Giới hạn request trên toàn IP không thuộc baseline Giai đoạn 1 hiện tại, trừ khi được phê duyệt riêng.
- Response đối với định danh không xác định, mật khẩu không đúng, gửi lại xác minh và quên mật khẩu phải tránh tiết lộ tài khoản có tồn tại hoặc không hoạt động hay không. Sau khi chứng minh đúng mật khẩu, tài khoản tự đăng ký đủ điều kiện có thể nhận response yêu cầu xác minh được định nghĩa trong `SPEC.md`. Hành vi đăng ký trùng lặp và rủi ro dò tìm tài khoản đã được thừa nhận tuân theo `SPEC.md` đã phê duyệt.
- Trạng thái người dùng, trạng thái thông tin xác thực và trạng thái audit bắt buộc không được cập nhật dở dang. Việc đăng nhập/tạo phiên, xác minh/tiêu thụ token, đặt lại mật khẩu/tiêu thụ token và thay đổi mật khẩu/audit phải sử dụng các ranh giới giao dịch được định nghĩa trong `SPEC.md`; hoàn tất `ACCOUNT_SETUP` là thao tác nguyên tử.
- Bản ghi audit xác thực bao phủ các lần thử đăng nhập, đăng nhập thành công và thất bại, sự kiện khóa/mở khóa, đăng xuất, các lần thử thay đổi mật khẩu, yêu cầu và kết quả đặt lại mật khẩu, xác minh và hoàn tất thiết lập tài khoản. Việc xử lý lỗi audit phải rõ ràng thay vì ngầm tuyên bố rằng sự kiện đã được ghi nhận.
- Request xác thực sử dụng HTTPS bên ngoài môi trường phát triển cục bộ, xác thực dữ liệu đầu vào trên server, sử dụng SQL có tham số và trả về lỗi an toàn không chứa thông tin đăng nhập, token thô, stack trace hoặc chi tiết nhà cung cấp.
- FE02 sở hữu việc tạo, hash, hết hạn, thu hồi và xác thực thông tin xác thực dùng cho xác minh/đặt lại. FE10 sở hữu việc kết xuất và gửi; lỗi gửi không được rollback giao dịch nguồn FE02 đã hoàn tất hoặc làm lộ thông tin xác thực.
- Frontend chỉ lưu token trong cơ chế lưu trữ đã chọn và được phê duyệt, gắn access token vào request được bảo vệ, làm mới access token đã hết hạn tối đa một lần cho mỗi request thất bại, xóa trạng thái phiên không hợp lệ và chuyển hướng người dùng đến trang đăng nhập một cách nhất quán khi khôi phục thất bại.

---

## 2. Quy trình thực tế

Quy trình xác thực điển hình của một thư viện quy mô nhỏ/vừa:

1. Người dùng (Khách, Thành viên, Thủ thư hoặc Quản trị viên) truy cập hệ thống.
2. Hệ thống hiển thị biểu mẫu đăng nhập.
3. Người dùng nhập thông tin đăng nhập (email/username và mật khẩu).
4. Hệ thống xác minh thông tin đăng nhập với cơ sở dữ liệu người dùng.
5. Nếu không hợp lệ, hệ thống từ chối đăng nhập và hiển thị thông báo lỗi chung.
6. Nếu mật khẩu đúng nhưng tài khoản tự đăng ký vẫn đang chờ xác minh email, hệ thống không cấp phiên và client mở `/verify-email` cùng email đã đăng ký.
7. Nếu hợp lệ và đang hoạt động, hệ thống tạo phiên/token và trả về cho client.
8. Client lưu access token và refresh token trong `localStorage` hoặc `sessionStorage` theo lựa chọn duy trì đăng nhập; cookie phiên nằm ngoài phạm vi Giai đoạn 1.
9. Với các request tiếp theo, client đưa phiên/token vào header của request.
10. Hệ thống xác thực token và cho phép hoặc từ chối truy cập dựa trên vai trò.
11. Khi người dùng đăng xuất, hệ thống vô hiệu hóa phiên/token.
12. Nếu quên mật khẩu, người dùng có thể yêu cầu OTP đặt lại gồm sáu chữ số qua email.
13. FE02 tạo OTP có thời hạn, chỉ lưu hash của OTP và yêu cầu FE10 gửi OTP thông qua bên yêu cầu gắn với `FE02`.
14. Người dùng nhập OTP đặt lại và đặt mật khẩu mới; các liên kết đặt lại mật khẩu cũ vẫn tương thích, còn liên kết thiết lập FE11 chuẩn sử dụng `ACCOUNT_SETUP`.
15. Hệ thống cập nhật mật khẩu và vô hiệu hóa OTP/token.

---

## 3. Ranh giới tính năng

FE02 bao gồm:

- Người dùng tự đăng ký có xác minh email và chỉ có vai trò `Member`; việc tạo tài khoản Thủ thư/Quản trị viên thuộc FE11.
- Người dùng đăng nhập bằng thông tin đăng nhập.
- Người dùng đăng xuất và kết thúc phiên.
- Thay đổi mật khẩu (người dùng đã xác thực).
- Yêu cầu quên mật khẩu.
- Đặt lại mật khẩu qua OTP email gồm sáu chữ số, đồng thời tương thích với liên kết đặt lại cũ.
- Hoàn tất thiết lập mật khẩu cho tài khoản do quản trị viên tạo trong FE11 thông qua token `ACCOUNT_SETUP` đã hash và chỉ dùng một lần.
- Xác thực phiên/token cho các request tiếp theo.
- Quản lý thời gian chờ của phiên.

FE02 không bao gồm:

- Quản lý dữ liệu tài khoản/hồ sơ người dùng. Nội dung đó thuộc FE03.
- Quản lý vai trò và quyền của người dùng. Nội dung đó thuộc FE11.
- Xác thực đa yếu tố (MFA). Nằm ngoài phạm vi Giai đoạn 1.
- Tích hợp OAuth/SSO. Nằm ngoài phạm vi Giai đoạn 1.
- Kết xuất/gửi thông báo xác minh tài khoản và đặt lại mật khẩu. Nội dung đó thuộc FE10; FE02 sở hữu việc tạo/xác thực OTP và chỉ giữ đường gửi trực tiếp cho `CHANGE_PASSWORD_OTP` cho đến khi một loại FE10 riêng được phê duyệt.

---

## 4. Ghi chú về mô hình dữ liệu hiện tại

Script SQL hiện tại bao gồm:

- `Users(UserId, Username, Email, PasswordHash, Phone, Status, EmailVerifiedAt, FailedLoginCount, LockedUntil, LastLoginAt, CreatedAt, UpdatedAt, DeactivatedAt)`
- `Roles(RoleId, RoleName)`
- `UserRoles(UserId, RoleId, CreatedAt)` với `UX_UserRoles_UserId`, vì vậy mỗi tài khoản được lưu có đúng một ánh xạ vai trò
- `AuthTokens(TokenId, UserId, TokenType, TokenHash, ExpiresAt, UsedAt, RevokedAt, CreatedAt, CreatedByIp)`
- `LoginFailureAttempts(AttemptId, UserId, AttemptedAt)`
- `AuditLogs(LogId, UserId, Action, TargetType, TargetId, Metadata, IpAddress, UserAgent, CreatedAt)`
- `UserProfiles(ProfileId, UserId, FullName, Address, DateOfBirth, AvatarUrl, Department, Specialization, CreatedAt, UpdatedAt)` dành cho dữ liệu hồ sơ thuộc quyền sở hữu của FE03.

Các quyết định và ghi chú đồng bộ của Giai đoạn 1:

- Mật khẩu sử dụng bcrypt với hệ số chi phí ít nhất là 10; văn bản thuần và các hash đơn giản như MD5 bị cấm.
- Xác thực sử dụng JWT access token cùng thông tin xác thực refresh được lưu trong cơ sở dữ liệu; cookie phiên nằm ngoài phạm vi.
- OTP xác minh email và đặt lại mật khẩu hết hạn sau 15 phút; token `ACCOUNT_SETUP` hết hạn sau 24 giờ.
- Một tài khoản đã biết bị khóa sau 5 lần nhập sai mật khẩu liên tiếp trong cửa sổ trượt 15 phút và tự động mở khóa sau 30 phút. Giới hạn đăng nhập trên toàn IP không được triển khai trong Giai đoạn 1.
- Tài khoản do quản trị viên tạo từ FE11 duy trì trạng thái `INACTIVE` cho đến khi FE02 hoàn tất việc thiết lập mật khẩu và kích hoạt theo cách nguyên tử.
- FE11 sở hữu việc cấp/gửi lại token thiết lập, FE10 sở hữu việc gửi liên kết thiết lập và FE02 sở hữu việc tiêu thụ token thiết lập/kích hoạt mật khẩu.
- Trạng thái người dùng được lưu gồm `ACTIVE`, `INACTIVE` và `LOCKED`; việc hủy kích hoạt của FE11 được biểu diễn bằng `INACTIVE` cùng `DeactivatedAt`.
- Lịch sử mật khẩu không được hỗ trợ và vẫn nằm ngoài phạm vi, trừ khi schema và đặc tả được phê duyệt được mở rộng.
- Bản ghi audit xác thực bao phủ các sự kiện đăng nhập, đăng xuất, thay đổi/đặt lại mật khẩu, khóa tài khoản, xác minh và thiết lập tài khoản mà không lưu thông tin xác thực thô.
- Kho mã nguồn và ví dụ triển khai đặt `LOGIN_LOCKOUT_MINUTES` mặc định là 30, khớp với thời lượng khóa đã phê duyệt; các kiểm thử hồi quy tập trung về cấu hình và đăng nhập xác minh chính xác cửa sổ này.

---

## 5. Các use case chính từ bảng phân công

| ID use case | Tên use case | Chủ sở hữu |
| ----------- | ------------- | ----- |
| UC05 | Đăng ký tài khoản | Dat |
| UC06 | Đăng nhập | Dat |
| UC07 | Đăng xuất | Dat |
| UC08 | Thay đổi mật khẩu | Dat |
| UC09 | Quên mật khẩu | Dat |
| UC10 | Đặt lại mật khẩu | Dat |

---

## 6. Các kiểm thử tính năng từ bảng phân công

| ID kiểm thử | Tên kiểm thử | Chủ sở hữu |
| ------- | --------- | ----- |
| FT05 | Đăng ký thành công | Dat |
| FT06 | Đăng nhập thành công | Dat |
| FT07 | Đăng nhập thất bại | Dat |
| FT08 | Đăng xuất thành công | Dat |
| FT09 | Thay đổi mật khẩu thành công | Dat |
| FT10 | Yêu cầu quên mật khẩu | Dat |
| FT11 | Đặt lại mật khẩu thành công | Dat |

---

## 7. Rủi ro chính

- Hash mật khẩu yếu cho phép kẻ tấn công phá thông tin xác thực ngoại tuyến.
- Việc xử lý khóa tài khoản đã biết bị thiếu hoặc sai cho phép tấn công thông tin xác thực lặp lại; Giai đoạn 1 không tuyên bố có giới hạn trên toàn IP.
- Token phiên không được xác thực trên từng request có thể cho phép truy cập trái phép.
- Không thực thi thời hạn phiên/token có thể dẫn đến chiếm đoạt tài khoản.
- Token đặt lại mật khẩu không được xác thực hoặc hết hạn đúng cách có thể cho phép thay đổi mật khẩu trái phép.
- SQL injection trong truy vấn đăng nhập có thể cho phép bỏ qua thông tin xác thực.
- Mật khẩu dạng văn bản thuần khi truyền có thể bị chặn lấy thông tin xác thực (bắt buộc sử dụng HTTPS).
- Các lần đăng nhập đồng thời có thể tạo nhiều phiên hợp lệ, làm phức tạp việc đăng xuất.
- Dò tìm người dùng qua endpoint đăng ký làm lộ email nào đã được đăng ký.
- Không thực thi xác minh email trong quá trình đăng ký có thể cho phép tạo tài khoản giả.

---

## 8. Phụ thuộc

| Phụ thuộc | Lý do quan trọng |
| ---------- | -------------- |
| Hồ sơ người dùng FE03 | Sau khi xác thực, người dùng có thể quản lý dữ liệu hồ sơ của mình. |
| Quản lý thông báo FE10 | Kết xuất và gửi OTP xác minh/đặt lại của FE02 cùng liên kết thiết lập tài khoản FE11 theo quyền sở hữu gắn với bên yêu cầu; HTTP dành cho nhân viên không thể gửi các loại FE02 nhạy cảm. |
| Quản lý người dùng và vai trò FE11 | Sử dụng thông tin vai trò sau khi xác thực và sở hữu việc tạo tài khoản/cấp và gửi lại token thiết lập do quản trị viên thực hiện. |
| Cơ sở dữ liệu (SQL Server) | Lưu thông tin xác thực người dùng và trạng thái phiên. |
| Bộ điều hợp nhà cung cấp email | FE10 sử dụng bộ điều hợp nhà cung cấp đã cấu hình để gửi xác minh/đặt lại; FE02 vẫn chỉ sử dụng email trực tiếp cho `CHANGE_PASSWORD_OTP`. |

---

## 9. Tóm tắt các câu hỏi chính đã giải quyết

Mục này tóm tắt các quyết định cần thiết để diễn giải bối cảnh này. Sổ đăng ký quyết định đầy đủ, bao gồm các quyết định liên tính năng về sau, vẫn nằm tại Mục 15 của `SPEC.md`.

| ID | Quyết định đã phê duyệt | Nguồn | Trạng thái |
| -- | ----------------- | ------ | ------ |
| Q-FE02-001 | Mật khẩu yêu cầu ít nhất 8 ký tự, 1 chữ hoa, 1 chữ số và 1 ký tự đặc biệt. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE02-002 | Access token hết hạn sau 15 phút; refresh token hết hạn sau 7 ngày. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE02-003 | Bắt buộc xác minh email. FE02 tạo OTP và FE10 gửi OTP thông qua bộ điều hợp nhà cung cấp đã cấu hình; kiểm thử inject nhà cung cấp mock. | Gói rà soát 2026-06-10; phê duyệt ADR-004 2026-07-15 | APPROVED |
| Q-FE02-004 | Giai đoạn 1 cho phép nhiều phiên đồng thời. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE02-005 | Tài khoản đã biết bị khóa sau 5 lần nhập sai mật khẩu liên tiếp trong cửa sổ trượt 15 phút; giới hạn đăng nhập trên toàn IP không được triển khai; tự động mở khóa sau 30 phút. | Chuẩn hóa chính sách xác thực 2026-07-17; đồng bộ mã nguồn 2026-07-19 | APPROVED |
| Q-FE02-006 | Token đặt lại mật khẩu hết hạn sau 15 phút. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE02-007 | Các lần thử thay đổi mật khẩu và đăng nhập thất bại được ghi log. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE02-008 | Người dùng không hoạt động không thể đăng nhập; job tự động khóa người dùng không hoạt động nằm ngoài phạm vi Giai đoạn 1. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE02-009 | Sử dụng JWT access token cùng refresh token. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE02-010 | Đặt lại mật khẩu yêu cầu xác minh quyền sở hữu email thông qua OTP đặt lại gồm sáu chữ số; token đặt lại mật khẩu cũ vẫn được chấp nhận để đảm bảo tương thích. | Gói rà soát 2026-06-10; đồng bộ OTP 2026-07-14 | APPROVED |
| Q-FE02-013 | Token `ACCOUNT_SETUP` chuẩn của FE11 được FE02 tiêu thụ; việc hoàn tất hợp lệ cập nhật nguyên tử mật khẩu, xác minh email, việc sử dụng token, audit và `INACTIVE -> ACTIVE`. | Xác nhận của Nhat 2026-07-15; ADR-005 | APPROVED |

---

## 10. Ghi chú triển khai và bảo trì

- Baseline triển khai Giai đoạn 1 đã phê duyệt đã hoàn tất; `SPEC.md`, `PLAN.md`, `TASKS.md`, các kiểm thử và bằng chứng rà soát quyết định trạng thái phân phối hiện tại.
- Việc đối soát tài liệu và phần triển khai vẫn đang mở trong khi các khoảng trống tuân thủ được ghi trong `SPEC.md`, `PLAN.md`, `TASKS.md` và `TEST_PLAN.md` chưa được giải quyết.
- `SPEC.md` vẫn là nguồn sự thật của FE02. Mọi thay đổi hành vi trong tương lai đều yêu cầu cập nhật đặc tả và nhiệm vụ được phê duyệt trước khi triển khai.
- Mật khẩu phải sử dụng bcrypt với hệ số chi phí ít nhất là 10; việc tinh chỉnh production không được giảm mức chi phí đã phê duyệt.
- Endpoint xác thực phải sử dụng HTTPS bên ngoài môi trường phát triển cục bộ; việc xử lý thông tin xác thực/token qua HTTP thuần phải bị từ chối hoặc chuyển hướng trước khi xử lý nghiệp vụ.
- Mọi endpoint được bảo vệ phải xác thực access token, trạng thái người dùng/phiên hiện tại và vai trò bắt buộc ở server trước khi xử lý.
- Khóa tài khoản đã biết tuân theo quy tắc đã phê duyệt gồm 5 lần thử, cửa sổ trượt 15 phút và khóa 30 phút; Giai đoạn 1 không tuyên bố có giới hạn trên toàn IP.
- Sự kiện xác thực phải được ghi trong `AuditLogs` mà không chứa mật khẩu, OTP thô, token thô hoặc chi tiết nhạy cảm của nhà cung cấp.
- Mọi truy cập SQL phải sử dụng truy vấn có tham số.
- FE02 sở hữu vòng đời thông tin xác thực dùng cho xác minh/đặt lại, FE10 sở hữu việc kết xuất/gửi gắn với bên yêu cầu và việc gửi trực tiếp từ FE02 vẫn chỉ giới hạn ở `CHANGE_PASSWORD_OTP`.
