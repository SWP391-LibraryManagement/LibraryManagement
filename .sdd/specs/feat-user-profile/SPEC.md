# SPEC.md - Hồ sơ người dùng FE03

# Phiên bản: 0.3.6

# Trạng thái: ĐÃ PHÊ DUYỆT - BASELINE 2026-07-17

# Chủ sở hữu: Đạt

# Cập nhật lần cuối: 2026-07-27

# ID tính năng: FE03

# Thư mục tính năng: `.sdd/specs/feat-user-profile/`

> Trạng thái phân phối hiện tại (2026-07-20): `COMPLETE` cho phạm vi Giai đoạn 1 đã được phê duyệt.
> `TASKS.md` và `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`
> là nguồn có thẩm quyền về trạng thái triển khai hiện tại. Các nhãn cũ hơn như `Not Started`,
> `PARTIAL`, `READY FOR REVIEW` hoặc đang chờ review được giữ lại bên dưới chỉ là
> ảnh chụp nhanh lịch sử về kế hoạch/bằng chứng, không phải trạng thái phân phối hiện tại.

> Nguồn sự thật cho Hồ sơ người dùng FE03. Phạm vi hồ sơ/hình đại diện đã được phê duyệt trước đó được giữ nguyên; v0.3.2 xác định tất định hành vi khi thiếu hồ sơ, xử lý trường được bảo vệ, quyền sở hữu hình đại diện, audit và hiển thị trạng thái, đồng thời đang chờ rà soát lại thủ công.

---

## 1. Tổng quan về tính năng

### 1.1 Tên tính năng

Hồ sơ người dùng

### 1.2 Bối cảnh kinh doanh

Thành viên và Thủ thư cần xem, duy trì thông tin cá nhân để thư viện có thể liên hệ và nhận dạng họ chính xác trong các quy trình thành viên, mượn sách, đặt chỗ và xử lý tiền phạt.

Quản lý hồ sơ phải bảo vệ dữ liệu cá nhân. Người dùng chỉ có thể cập nhật các trường hồ sơ đã được phê duyệt và không thể thay đổi mật khẩu, vai trò, trạng thái tài khoản hoặc phê duyệt thành viên thông qua tính năng này.

### 1.3 Mục tiêu / Kết quả

Hệ thống sẽ:

- Cho phép các thành viên và thủ thư được xác thực xem hồ sơ của chính họ.
- Cho phép các thành viên và thủ thư được xác thực cập nhật các trường hồ sơ đã được phê duyệt.
- Cho phép người dùng được xác thực tải lên hình đại diện của chính họ từ thiết bị cục bộ của họ.
- Xác thực dữ liệu hồ sơ trên máy chủ.
- Xác thực các tập tin avatar được tải lên trên máy chủ.
- Ngăn người dùng xem hoặc chỉnh sửa hồ sơ của người dùng khác.
- Ngăn cập nhật hồ sơ thay đổi thông tin xác thực, vai trò, trạng thái hoặc phê duyệt thành viên.

### 1.4 Mức độ phạm vi

- [ ] Đặc tả đầy đủ - logic nghiệp vụ cốt lõi, rủi ro cao, phải đúng ngay từ đầu
- [x] Đặc tả tiêu chuẩn - tính năng thông thường, có quy tắc nghiệp vụ và bước xác thực dữ liệu
- [ ] Đặc tả rút gọn - UI đơn giản, tài liệu hoặc tính năng ít rủi ro

---

## 2. Tác nhân và quyền

| Tác nhân | Mô tả | Quyền/Trách nhiệm |
| ----- | ----------- | --------------------------- |
| Thành viên | Người dùng thư viện đã đăng ký | Xem và cập nhật hồ sơ riêng. |
| Thủ thư | Nhân viên thư viện | Xem và cập nhật hồ sơ riêng. |
| Quản trị viên | Quản trị viên hệ thống | Có thể xem/cập nhật hồ sơ của chính mình; việc quản trị người dùng khác thuộc FE11. |
| Khách | Khách truy cập chưa được xác thực | Không có quyền truy cập hồ sơ. |

---

## 3. Điều kiện tiên quyết

Tính năng này chỉ có thể bắt đầu khi:

- PRE-FE03-001: Tác nhân đã được xác thực.
- PRE-FE03-002: Tài khoản người dùng tồn tại trong `Users`.
- PRE-FE03-003: Bản ghi hồ sơ tồn tại trong `UserProfiles`, hoặc hệ thống có quy tắc được phê duyệt để tạo nó trong lần truy cập đầu tiên.
- PRE-FE03-004: Tác nhân đang yêu cầu hồ sơ của chính mình.
- PRE-FE03-005: Các trường có thể chỉnh sửa được phép đã được nhóm phê duyệt.
- PRE-FE03-006: Chính sách lưu trữ tải lên hình đại diện, loại tệp được phép và kích thước tệp tối đa được nhóm phê duyệt (xem Q-FE03-004: hệ thống tệp cục bộ của máy chủ, JPG/JPEG/PNG/WebP, tối đa 2 MB).

---

## 4. Luồng chính

### MF-FE03-001: Xem hồ sơ

1. Người dùng được xác thực sẽ mở trang hồ sơ.
2. Hệ thống xác định người dùng hiện tại từ phiên/mã thông báo đã được xác thực.
3. Hệ thống chỉ tải dữ liệu hồ sơ của người dùng đó; nếu chưa có hàng `UserProfiles`, hệ thống tạo nguyên tử một hàng trống cho người dùng hiện tại rồi tiếp tục.
4. Hệ thống trả về các trường hồ sơ và tóm tắt tài khoản an toàn.
5. Hệ thống bao gồm tài khoản `status` dưới dạng dữ liệu hiển thị chỉ đọc và loại trừ hàm băm mật khẩu, trường quản lý vai trò và dữ liệu kiểm tra nội bộ.

### MF-FE03-002: Cập nhật hồ sơ

1. Người dùng được xác thực gửi các thay đổi đối với các trường hồ sơ được phép.
2. Hệ thống xác minh yêu cầu thuộc về người dùng hiện tại.
3. Hệ thống xác nhận từng trường được gửi.
4. Hệ thống từ chối các trường được bảo vệ như vai trò, trạng thái, hàm băm mật khẩu và phê duyệt thành viên.
5. Hệ thống lưu các thay đổi hồ sơ hợp lệ.
6. Hệ thống ghi một mục audit chứa tác nhân, tên các trường đã thay đổi và dấu thời gian, không chứa giá trị cá nhân thô trước/sau thay đổi.
7. Hệ thống trả về chế độ xem hồ sơ an toàn đã cập nhật.

### MF-FE03-003: Tải lên hình đại diện

1. Người dùng được xác thực chọn hình ảnh đại diện từ thiết bị cục bộ của họ.
2. Giao diện người dùng gửi hình ảnh dưới dạng dữ liệu biểu mẫu nhiều phần đến điểm cuối tải lên hình đại diện.
3. Hệ thống xác minh yêu cầu thuộc về người dùng được xác thực hiện tại.
4. Hệ thống xác thực loại tệp, kích thước tệp và quy tắc lưu trữ an toàn.
5. Hệ thống lưu trữ hình ảnh bằng tên tệp an toàn do máy chủ tạo.
6. Hệ thống lưu URL/đường dẫn công khai đã tạo của hình đại diện vào `UserProfiles.AvatarUrl`.
7. Hệ thống ghi mục audit hình đại diện hồ sơ mà không ghi byte tệp, đường dẫn cục bộ hoặc siêu dữ liệu bí mật.
8. Nếu giao dịch cơ sở dữ liệu hoặc audit thất bại, hệ thống xóa tệp mới lưu và giữ nguyên URL hình đại diện trước đó; sau khi commit thành công, hệ thống cố gắng dọn tệp cũ đã bị thay thế mà không làm thay đổi trạng thái hồ sơ đã commit, đồng thời ghi nhận mọi lỗi dọn dẹp theo cách an toàn.
9. Hệ thống trả về chế độ xem hồ sơ an toàn đã cập nhật.

---

## 5. Luồng thay thế

### AF-FE03-001: Thiếu bản ghi hồ sơ

1. Người dùng được xác thực sẽ mở hồ sơ.
2. Bản ghi `UserProfiles` không tồn tại.
3. Hệ thống tự động tạo một bản ghi `UserProfiles` trống cho người dùng hiện tại và trả về phản hồi hồ sơ an toàn thông thường.

### AF-FE03-002: Người dùng cố gắng truy cập hồ sơ khác

1. Người dùng được xác thực yêu cầu ID hồ sơ của người dùng khác.
2. Hệ thống phát hiện hồ sơ không thuộc về người dùng hiện tại.
3. Hệ thống từ chối yêu cầu.

### AF-FE03-003: Dữ liệu hồ sơ không hợp lệ

1. Người dùng gửi ngày, số điện thoại không hợp lệ hoặc văn bản có thể chỉnh sửa quá dài.
2. Hệ thống từ chối cập nhật.
3. Dữ liệu hồ sơ hiện có vẫn không thay đổi.

### AF-FE03-004: Đã gửi trường được bảo vệ

1. Người dùng gửi vai trò, trạng thái tài khoản, mật khẩu hoặc các trường phê duyệt thành viên.
2. Hệ thống từ chối toàn bộ bản cập nhật bằng phản hồi xác thực.
3. Dữ liệu tài khoản được bảo vệ vẫn không thay đổi.

### AF-FE03-005: Tải lên hình đại diện không hợp lệ

1. Người dùng gửi tệp bị thiếu, loại tệp không được hỗ trợ, tệp quá khổ hoặc tệp không an toàn.
2. Hệ thống từ chối tải lên.
3. Hình đại diện hiện tại không thay đổi.

---

## 6. Quy tắc kinh doanh

Sử dụng các ID ổn định này cho các nhiệm vụ và bài kiểm tra.

- BR-FE03-001: Khách không thể xem hoặc cập nhật hồ sơ.
- BR-FE03-002: Người dùng chỉ có thể xem hồ sơ của chính họ trong FE03.
- BR-FE03-003: Người dùng chỉ có thể cập nhật các trường hồ sơ được phép của riêng họ trong FE03.
- BR-FE03-004: FE03 không được trả về giá trị băm mật khẩu hoặc bí mật thông tin xác thực.
- BR-FE03-005: FE03 không được cập nhật mật khẩu, vai trò, trạng thái tài khoản hoặc phê duyệt thành viên.
- BR-FE03-006: Cập nhật hồ sơ phải được xác thực trên máy chủ.
- BR-FE03-007: Các trường có thể chỉnh sửa gồm `fullName` (cắt khoảng trắng, tối đa 100), `address` (cắt khoảng trắng, tối đa 255), `dateOfBirth` (ngày ISO hợp lệ, không ở tương lai) và `phone` (10-15 chữ số, có thể bắt đầu bằng `+`).
- BR-FE03-008: Yêu cầu cập nhật không hợp lệ không được thay đổi một phần dữ liệu hồ sơ.
- BR-FE03-009: Các thay đổi về email nằm ngoài phạm vi FE03 trừ khi hành vi xác minh FE02 được phê duyệt.
- BR-FE03-010: Dữ liệu hồ sơ phải được coi là thông tin cá nhân và chỉ được trả lại cho những người được ủy quyền.
- BR-FE03-011: Tải lên tệp avatar phải được xác thực và chỉ có thể cập nhật hồ sơ của người dùng hiện tại.
- BR-FE03-012: Nội dung tải lên hình đại diện chỉ được chấp nhận các loại tệp hình ảnh đã được phê duyệt và từ chối nội dung thực thi hoặc không được hỗ trợ.
- BR-FE03-013: Tải lên hình đại diện phải thực thi kích thước tệp tối đa đã được phê duyệt.
- BR-FE03-014: Bộ lưu trữ hình đại diện phải sử dụng tên tệp do máy chủ tạo và không được tin tưởng hay duy trì đường dẫn tệp cục bộ của người dùng.
- BR-FE03-015: Tệp hình đại diện phải được lưu trên hệ thống tệp cục bộ của máy chủ trong thư mục tải lên công khai (ví dụ: `/uploads/avatars/`); đường dẫn/URL công khai đã tạo được lưu vào `UserProfiles.AvatarUrl`. Lưu trữ đám mây/đối tượng nằm ngoài phạm vi Giai đoạn 1.
- BR-FE03-016: `avatarUrl` ở chế độ chỉ đọc trong các hợp đồng GET/PUT hồ sơ và chỉ có thể được thay đổi bởi điểm cuối tải lên hình đại diện đã được xác thực sau khi xác thực tệp.
- BR-FE03-017: Mỗi lần cập nhật trường hồ sơ hoặc hình đại diện thành công đều phải ghi một mục audit chứa tác nhân, tên trường đã thay đổi, hành động và dấu thời gian; cấm ghi giá trị cá nhân thô, nội dung tệp, đường dẫn, mã thông báo và bí mật trong siêu dữ liệu audit. Nếu lưu hình đại diện thành công nhưng giao dịch cơ sở dữ liệu/audit sau đó thất bại thì phải xóa tệp mới; sau khi commit, phải dọn tệp cũ đã bị thay thế và ghi lỗi dọn dẹp theo cách an toàn mà không hoàn tác trạng thái hồ sơ đã commit.

---

## 7. Yêu cầu chức năng

- FR-FE03-001: Khi người dùng đã xác thực mở hồ sơ, nếu hồ sơ chưa tồn tại thì hệ thống phải tạo nguyên tử một hồ sơ trống và trả về dữ liệu hồ sơ an toàn của chính người dùng.
- FR-FE03-002: Nếu khách yêu cầu dữ liệu hồ sơ thì hệ thống sẽ từ chối quyền truy cập.
- FR-FE03-003: Nếu người dùng yêu cầu hồ sơ của người dùng khác thông qua FE03 thì hệ thống sẽ từ chối quyền truy cập.
- FR-FE03-004: Khi người dùng được xác thực gửi các trường hồ sơ được phép hợp lệ, hệ thống sẽ cập nhật hồ sơ.
- FR-FE03-005: Nếu các trường hồ sơ đã gửi không hợp lệ thì hệ thống sẽ từ chối cập nhật và giữ nguyên dữ liệu hiện có.
- FR-FE03-006: Nếu bất kỳ trường được bảo vệ, không xác định hoặc chỉ đọc nào được gửi tới bản cập nhật hồ sơ, bao gồm `avatarUrl`, thì hệ thống sẽ từ chối toàn bộ yêu cầu mà không thay đổi hồ sơ hoặc dữ liệu tài khoản.
- FR-FE03-007: Khi phản hồi hồ sơ được trả về, hệ thống sẽ loại trừ hàm băm mật khẩu, mã thông báo xác thực và dữ liệu quản lý vai trò nội bộ.
- FR-FE03-008: Khi người dùng được xác thực tải lên hình ảnh đại diện hợp lệ, hệ thống sẽ lưu trữ hình ảnh đó và cập nhật `avatarUrl` của người dùng đó.
- FR-FE03-009: Nếu tải lên hình đại diện không hợp lệ thì hệ thống sẽ từ chối nó và giữ nguyên hình đại diện hiện có.
- FR-FE03-010: Khi cập nhật trường hồ sơ hoặc hình đại diện thành công, hệ thống phải ghi mục audit an toàn bắt buộc trong cùng giao dịch nguồn với thay đổi cơ sở dữ liệu; việc lưu tệp hình đại diện phải tuân theo quy tắc bù trừ và dọn dẹp sau commit trong BR-FE03-017, bao gồm ghi log an toàn nếu việc dọn tệp cũ thất bại sau commit.

---

## 8. Tiêu chí chấp nhận

- AC-FE03-001: Với thành viên đã được xác thực, khi thành viên xem hồ sơ, hệ thống chỉ trả về dữ liệu hồ sơ an toàn của thành viên đó.
- AC-FE03-002: Cho trước một Thủ thư đã xác thực, khi Thủ thư xem hồ sơ thì hệ thống chỉ trả về dữ liệu hồ sơ an toàn của Thủ thư đó.
- AC-FE03-003: Cho trước một Khách, khi Khách yêu cầu hồ sơ thì hệ thống từ chối truy cập.
- AC-FE03-004: Nếu người dùng cố gắng xem hồ sơ của người dùng khác, khi yêu cầu được xử lý, hệ thống sẽ từ chối quyền truy cập.
- AC-FE03-005: Cho trước các thay đổi hồ sơ hợp lệ, khi người dùng gửi thay đổi thì hệ thống lưu các thay đổi đó.
- AC-FE03-006: Với dữ liệu hồ sơ không hợp lệ, khi người dùng gửi thay đổi thì hệ thống sẽ từ chối cập nhật.
- AC-FE03-007: Với bất kỳ trường được bảo vệ, không xác định hoặc chỉ đọc nào trong tải trọng cập nhật, khi hệ thống xử lý trường đó thì toàn bộ yêu cầu sẽ bị từ chối và không có trường hồ sơ hoặc trường tài khoản nào thay đổi.
- AC-FE03-008: Cho trước một phản hồi hồ sơ, khi phản hồi được trả về thì không được chứa `PasswordHash`.
- AC-FE03-009: Cho trước một người dùng đã xác thực và một ảnh đại diện hợp lệ, khi người dùng tải ảnh lên thì phản hồi chứa `avatarUrl` đã cập nhật.
- AC-FE03-010: Cho trước một tệp hình đại diện không hợp lệ, khi yêu cầu được xử lý thì hệ thống từ chối tải lên và giữ nguyên `avatarUrl` cũ.
- AC-FE03-011: Cho trước một Khách, khi Khách tải ảnh đại diện lên thì hệ thống từ chối truy cập.
- AC-FE03-012: Cho một người dùng được xác thực không có hàng `UserProfiles`, khi người dùng xem hồ sơ, thì chính xác một hàng trống sẽ được tạo và phản hồi hồ sơ an toàn thông thường sẽ được trả về.
- AC-FE03-013: Cho `avatarUrl` trong tải trọng PUT của hồ sơ, khi yêu cầu được xử lý thì nó sẽ bị từ chối và hình đại diện hiện tại không thay đổi.
- AC-FE03-014: Cho trước một tệp hình đại diện đã được lưu, khi giao dịch cơ sở dữ liệu/audit thất bại thì tệp mới bị xóa và hình đại diện cũ được giữ nguyên; khi giao dịch commit, hệ thống ghi một mục audit an toàn, thử dọn tệp cũ và ghi lỗi dọn dẹp theo cách an toàn mà không hoàn tác trạng thái hồ sơ.

---

## 9. Trường hợp biên và xử lý lỗi

| ID | Trường hợp biên / Lỗi | Hành vi hệ thống mong đợi |
| -- | ----------------- | ------------------------ |
| EC-FE03-001 | Người dùng chưa được xác thực | Trả về phản hồi chưa được xác thực. |
| EC-FE03-002 | Tài khoản người dùng không tồn tại | Trả về `404 PROFILE_ACCOUNT_NOT_FOUND`; không tạo hàng hồ sơ hoặc thay đổi trạng thái tài khoản. |
| EC-FE03-003 | Thiếu bản ghi hồ sơ | Tạo nguyên tử một hồ sơ trống cho người dùng hiện tại và trả về phản hồi hồ sơ an toàn thông thường. |
| EC-FE03-004 | Người dùng yêu cầu hồ sơ của người dùng khác | Trả về phản hồi cấm truy cập. |
| EC-FE03-005 | Tên đầy đủ quá dài | Từ chối cập nhật. |
| EC-FE03-006 | Ngày sinh không hợp lệ | Từ chối cập nhật. |
| EC-FE03-007 | Ngày sinh trong tương lai | Từ chối cập nhật. |
| EC-FE03-008 | Định dạng điện thoại không hợp lệ | Từ chối cập nhật nếu điện thoại có thể chỉnh sửa được. |
| EC-FE03-009 | Tải trọng PUT bao gồm `avatarUrl` | Từ chối toàn bộ bản cập nhật; thay đổi hình đại diện chỉ được chấp nhận thông qua `POST /api/profile/me/avatar`. |
| EC-FE03-010 | Payload chứa trường mật khẩu/vai trò/trạng thái/không xác định | Từ chối toàn bộ bản cập nhật; không thay đổi hồ sơ hoặc dữ liệu được bảo vệ. |
| EC-FE03-011 | Cập nhật cơ sở dữ liệu hoặc audit thất bại sau khi lưu hình đại diện | Giữ trạng thái hồ sơ trước đó, xóa tệp mới lưu và trả về lỗi an toàn. |
| EC-FE03-012 | Tải lên avatar không có tập tin | Từ chối tải lên. |
| EC-FE03-013 | Tải lên hình đại diện không phải là loại hình ảnh được phê duyệt | Từ chối tải lên. |
| EC-FE03-014 | Tải lên avatar vượt quá kích thước tối đa | Từ chối tải lên. |
| EC-FE03-015 | Tải lên hình đại diện dùng tên tệp hoặc đường dẫn không an toàn | Bỏ qua đường dẫn/tên gốc và dùng tên tệp an toàn do máy chủ tạo. |
| EC-FE03-016 | Lưu trữ avatar không thành công | Giữ trạng thái avatar trước đó và trả về lỗi an toàn. |
| EC-FE03-017 | Không thể dọn hình đại diện cũ đã thay thế sau commit | Giữ URL hình đại diện mới đã commit, ghi lỗi dọn dẹp theo cách an toàn và không hoàn tác giao dịch hồ sơ. |

---

## 10. Yêu cầu về dữ liệu

### 10.1 Các thực thể có liên quan

| Thực thể | Mục đích trong tính năng này |
| ------ | ----------------------- |
| Users | Cung cấp danh tính tài khoản, tên người dùng, email, điện thoại, trạng thái và ngày tạo. |
| UserProfiles | Lưu trữ chi tiết hồ sơ cá nhân. |
| UserRoles | Có thể chỉ đọc đối với các ràng buộc hiển thị nhưng quản lý vai trò là FE11. |

### 10.2 Trường dữ liệu

| Trường | Kiểu | Bắt buộc | Kiểm tra hợp lệ / Ghi chú |
| ----- | ---- | -------- | ------------------ |
| userId | số nguyên | Có | Lấy từ danh tính đã xác thực; máy khách không được kiểm soát giá trị này khi cập nhật hồ sơ cá nhân. |
| username | chuỗi | Có | Chỉ hiển thị, trừ khi FE11/FE02 phê duyệt thay đổi. |
| email | chuỗi | Có | Chỉ hiển thị trừ khi luồng thay đổi email FE02 được phê duyệt. |
| phone | chuỗi | Không | Chỉ có thể chỉnh sửa nếu Q-FE03-001 được phê duyệt. |
| fullName | chuỗi | Không | Có thể chỉnh sửa; cắt khoảng trắng; tối đa 100 ký tự. |
| address | chuỗi | Không | Có thể chỉnh sửa; cắt khoảng trắng; tối đa 255 ký tự. |
| dateOfBirth | ngày | Không | Không được ở tương lai. |
| avatarUrl | chuỗi | Không | Đường dẫn/URL công khai chỉ đọc do máy chủ tạo (ví dụ `/uploads/avatars/{generated}.png`); chỉ thay đổi khi tải lên hình đại diện, không bao giờ thay đổi qua PUT hồ sơ. |
| avatarFile | tập tin | Không | Trường chỉ tải lên. Các phần mở rộng được chấp nhận: JPG, JPEG, PNG, WebP. Kích thước tối đa: 2 MB. Được lưu trữ bằng tên tệp do máy chủ tạo. |
| status | chuỗi | Không | Được đưa vào DTO hồ sơ an toàn dưới dạng trạng thái tài khoản chỉ đọc; FE03 không bao giờ được chỉnh sửa trường này. |
| department | chuỗi | Không | `UserProfiles.Department` có thể null, tối đa 100 ký tự. Chỉ quản trị viên FE11 quản lý; trường này bị loại khỏi thao tác đọc và cập nhật hồ sơ cá nhân của FE03. |
| specialization | chuỗi | Không | `UserProfiles.Specialization` có thể null, tối đa 100 ký tự. Chỉ quản trị viên FE11 quản lý; trường này bị loại khỏi thao tác đọc và cập nhật hồ sơ cá nhân của FE03. |

---

## 11. API / Hợp đồng giao diện

> Các điểm cuối và hình dạng request/response bên dưới là hợp đồng Giai đoạn 1 chuẩn cho tính năng này.

| Phương thức | Endpoint | Tác nhân | Yêu cầu | Phản hồi | Ghi chú |
| ------ | -------- | ----- | ------- | -------- | ----- |
| GET | `/api/profile/me` | Member/Librarian/Admin | - | Hồ sơ an toàn DTO | Chỉ hồ sơ của người dùng hiện tại. |
| PUT | `/api/profile/me` | Member/Librarian/Admin | `{ fullName?, address?, dateOfBirth?, phone? }` | DTO hồ sơ an toàn đã cập nhật | Nếu có trường không xác định/được bảo vệ/chỉ đọc, bao gồm `avatarUrl`, hệ thống từ chối toàn bộ yêu cầu. |
| POST | `/api/profile/me/avatar` | Member/Librarian/Admin | Dữ liệu biểu mẫu nhiều phần có tệp `avatar` | DTO hồ sơ an toàn đã cập nhật | Tải ảnh đại diện từ thiết bị cục bộ của người dùng và lưu URL/đường dẫn đã tạo vào `avatarUrl`. |

---

## 12. Yêu cầu phi chức năng

### 12.1 Bảo mật

- NFR-FE03-SEC-001: Điểm cuối hồ sơ phải yêu cầu xác thực.
- NFR-FE03-SEC-002: Người dùng không được truy cập hồ sơ của người dùng khác thông qua FE03.
- NFR-FE03-SEC-003: Phản hồi không được bao gồm hàm băm mật khẩu, mã thông báo, dữ liệu ủy quyền nội bộ hoặc bí mật.
- NFR-FE03-SEC-004: Mọi dữ liệu đầu vào của hồ sơ phải được kiểm tra hợp lệ ở phía máy chủ.
- NFR-FE03-SEC-005: Tải lên hình đại diện phải xác thực loại MIME, đuôi tệp, kích thước tệp và đường dẫn lưu trữ an toàn phía máy chủ.
- NFR-FE03-SEC-006: Tải lên hình đại diện không được lưu trữ đường dẫn tệp cục bộ của máy khách hoặc tin cậy vào tên tệp gốc.

### 12.2 Tính toàn vẹn giao dịch

- NFR-FE03-TXN-001: Cập nhật hồ sơ phải nguyên tử; trường không hợp lệ không được gây thay đổi một phần dữ liệu hồ sơ.
- NFR-FE03-TXN-002: Tệp hình đại diện không hợp lệ không được làm thay đổi `avatarUrl` hiện có; nếu cơ sở dữ liệu/audit thất bại sau khi lưu tệp thì phải xóa tệp mới và giữ nguyên URL trước đó.
- NFR-FE03-TXN-003: Khi thay hình đại diện, URL hồ sơ và audit phải được commit theo cách nguyên tử; việc dọn tệp cũ diễn ra sau commit và không được làm thay đổi trạng thái hồ sơ đã commit.

### 12.3 Hiệu năng

- NFR-FE03-PERF-001: Thao tác GET hồ sơ chỉ được đọc hàng `Users` của người dùng đã xác thực và tối đa một hàng `UserProfiles`; không được phép quét toàn bộ tập dữ liệu.

### 12.4 Ghi log và audit

- NFR-FE03-LOG-001: Lỗi cập nhật hồ sơ phải được ghi lại một cách an toàn mà không lưu trữ tải trọng nhạy cảm.
- NFR-FE03-LOG-002: Mọi cập nhật trường hồ sơ hoặc hình đại diện thành công đều phải được audit với tác nhân, hành động, tên trường đã thay đổi và dấu thời gian; không được ghi giá trị cá nhân thô hoặc bí mật về tệp/đường dẫn.

### 12.5 Khả năng sử dụng

- NFR-FE03-UX-001: Lỗi xác thực phải xác định rõ trường không hợp lệ.
- NFR-FE03-UX-002: Chế độ xem hồ sơ phải tách biệt rõ ràng các trường hồ sơ có thể chỉnh sửa khỏi các trường tài khoản được quản lý ở nơi khác.
- NFR-FE03-UX-003: Lỗi tải lên hình đại diện phải xác định liệu xác thực kích thước tệp hoặc loại tệp có thất bại hay không.
- NFR-FE03-UX-004: Thành viên phải tiếp tục truy cập được `/profile` qua menu hình đại diện/tài khoản dùng chung; thanh bên Thành viên không được lặp lại đích này thành một mục `Thông tin cá nhân` riêng hoặc một nhóm `Tài khoản` trống.

---

## 13. Ngoài phạm vi

Tính năng này không bao gồm:

- Đăng nhập, đăng xuất, đăng ký, thay đổi mật khẩu, quên mật khẩu hoặc đặt lại mật khẩu.
- Quy trình xác minh email hoặc thay đổi email trừ khi FE02 phê duyệt.
- Tạo/vô hiệu hóa người dùng hoặc thay đổi trạng thái tài khoản.
- Phân công vai trò hoặc quản lý quyền.
- Phê duyệt hoặc từ chối đơn đăng ký thành viên.
- Lịch sử mượn, đặt chỗ hoặc tiền phạt.
- Quản trị viên chỉnh sửa hồ sơ của người dùng khác trừ khi phạm vi FE11 được thay đổi.

---

## 14. Sự phụ thuộc

| Phụ thuộc | Loại | Ghi chú |
| ---------- | ---- | ----- |
| Xác thực FE02 | Nội bộ | Cung cấp danh tính được xác thực và các luồng thông tin xác thực. |
| Quản lý thành viên FE04 | Nội bộ | Sở hữu tư cách thành viên; FE03 không hiển thị hoặc thay đổi trạng thái thành viên trong Giai đoạn 1. |
| FE11 Quản lý vai trò và người dùng | Nội bộ | Sở hữu trạng thái người dùng và quản lý vai trò. |
| Cơ sở dữ liệu máy chủ SQL | Kỹ thuật | Tập lệnh SQL hiện tại có `Users` và `UserProfiles`. |

---

## 15. Câu hỏi đã được giải quyết

| ID | Quyết định phê duyệt | Nguồn | Trạng thái |
| -- | ----------------- | ------ | ------ |
| Q-FE03-001 | FE03 có thể cập nhật `Users.Phone`. | Gói review 2026-06-10 | APPROVED |
| Q-FE03-002 | FE03 không thể cập nhật email; thay đổi email phải trải qua quá trình xác minh FE02. | Gói review 2026-06-10 | APPROVED |
| Q-FE03-003 | Bản ghi hồ sơ bị thiếu được tự động tạo ở lần xem đầu tiên. | Gói review 2026-06-10 | APPROVED |
| Q-FE03-004 | Giai đoạn 1 hỗ trợ tải ảnh đại diện từ thiết bị cục bộ của người dùng. Ảnh được lưu trên hệ thống tệp cục bộ của máy chủ, trong thư mục tải lên công khai (ví dụ: `/uploads/avatars/`) với tên tệp do máy chủ tạo; đường dẫn/URL công khai đã tạo được lưu vào `UserProfiles.AvatarUrl`. Loại được phép: JPG/JPEG/PNG/WebP; kích thước tối đa 2 MB. Lưu trữ đám mây/đối tượng nằm ngoài phạm vi Giai đoạn 1. | Quyết định của người dùng 2026-06-25 | APPROVED |
| Q-FE03-005 | Cập nhật trường hồ sơ và hình đại diện phải ghi log audit an toàn chứa tác nhân, hành động, tên trường đã thay đổi và dấu thời gian, không chứa giá trị cá nhân thô hoặc bí mật về tệp/đường dẫn. | Gói review 2026-06-10; chuẩn hóa 2026-07-17 | APPROVED |
| Q-FE03-006 | DTO hồ sơ an toàn chứa `status` của tài khoản dưới dạng dữ liệu hiển thị chỉ đọc. | Chuẩn hóa đặc tả 2026-07-17 | APPROVED |
| Q-FE03-007 | `avatarUrl` chỉ được thay đổi bởi endpoint tải tệp lên; hệ thống từ chối việc sửa trực tiếp qua PUT hồ sơ. | Chuẩn hóa đặc tả 2026-07-17 | APPROVED |

---

## 16. Ma trận truy vết

| ID yêu cầu | Trường hợp sử dụng liên quan | Trường hợp thử nghiệm liên quan | Trạng thái |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE03-001 | UC11 | Các ca xác thực GET/hình đại diện trong `profileRoutes.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| BR-FE03-002 | UC11 | Hợp đồng route `/me` chỉ dành cho người dùng hiện tại trong `profileRoutes.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| BR-FE03-003 | UC12 | Các ca cập nhật của người dùng đã xác thực trong `profileRoutes.test.js`, `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| BR-FE03-004 | UC11, UC12 | Ca DTO an toàn trong `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| BR-FE03-005 | UC12 | Các ca từ chối trường được bảo vệ trong `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| BR-FE03-006 | UC12 | Các ca dữ liệu không hợp lệ và kiểm tra ở cấp trường trong `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| BR-FE03-007 | UC12 | Các ca trường được phép, điện thoại, ngày và độ dài trong `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| BR-FE03-008 | UC12 | Các ca không ghi một phần và rollback trong `profileService.test.js`, `profileRepository.test.js` | Kiểm thử tự động đạt; đang chờ SQL/review thủ công |
| BR-FE03-009 | UC12 | Các ca từ chối email/trường được bảo vệ trong `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| BR-FE03-010 | UC11 | Các ca DTO an toàn của hồ sơ cá nhân trong `profileService.test.js`, `profileRoutes.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| BR-FE03-011 | UC12 | Các ca quyền sở hữu hình đại diện đã xác thực trong `profileRoutes.test.js`, `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| BR-FE03-012 | UC12 | Các ca MIME, đuôi tệp và chữ ký byte trong `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| BR-FE03-013 | UC12 | Ca hình đại diện quá kích thước trong `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| BR-FE03-014 | UC12 | Ca tên tệp do hệ thống tạo và quản lý trong `avatarStorage.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| BR-FE03-015 | UC12 | Các ca URL/lưu trữ cục bộ được quản lý trong `avatarStorage.test.js`, `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| BR-FE03-016 | UC12 | Các ca danh sách trường PUT cho phép trong `profileService.test.js`, `profileFrontend.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| BR-FE03-017 | UC12 | `profileRepository.test.js`, `profileService.test.js`, `avatarStorage.test.js` | Kiểm thử tự động đạt; đang chờ SQL/review thủ công |
| FR-FE03-001 | UC11 | Các ca thiếu hồ sơ trong `profileService.test.js`, `profileRepository.test.js` | Kiểm thử tự động đạt; đang chờ SQL/review thủ công |
| FR-FE03-002 | UC11 | Ca GET chưa xác thực trong `profileRoutes.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| FR-FE03-003 | UC11 | Hợp đồng `/me` chỉ dành cho người dùng hiện tại trong `profileRoutes.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| FR-FE03-004 | UC12 | Các ca cập nhật hợp lệ trong `profileRoutes.test.js`, `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| FR-FE03-005 | UC12 | Các ca cập nhật không hợp lệ/không ghi một phần trong `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| FR-FE03-006 | UC12 | Các ca từ chối trường được bảo vệ/không xác định/chỉ đọc trong `profileService.test.js`, `profileFrontend.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| FR-FE03-007 | UC11 | Ca DTO an toàn trong `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| FR-FE03-008 | UC12 | Các ca hình đại diện hợp lệ trong `profileRoutes.test.js`, `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| FR-FE03-009 | UC12 | Các ca hình đại diện không hợp lệ trong `profileRoutes.test.js`, `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| FR-FE03-010 | UC12 | Các ca audit/bù trừ trong `profileRepository.test.js`, `profileService.test.js` | Kiểm thử tự động đạt; đang chờ SQL/review thủ công |
| AC-FE03-001 | UC11 | Hành vi hồ sơ cá nhân của Thành viên trong `profileRoutes.test.js`, `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| AC-FE03-002 | UC11 | Hành vi hồ sơ cá nhân đã xác thực trong `profileRoutes.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| AC-FE03-003 | UC11 | Ca GET chưa xác thực trong `profileRoutes.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| AC-FE03-004 | UC11 | Hợp đồng không có ID hồ sơ do máy khách kiểm soát trong `profileRoutes.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| AC-FE03-005 | UC12 | Ca cập nhật/audit hợp lệ trong `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| AC-FE03-006 | UC12 | Các ca kiểm tra cấp trường không hợp lệ trong `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| AC-FE03-007 | UC12 | Các ca từ chối trường được bảo vệ/không xác định trong `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| AC-FE03-008 | UC11 | Ca loại trừ trường bí mật/nội bộ trong `profileService.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| AC-FE03-009 | UC12 | Các ca hình đại diện hợp lệ trong `profileRoutes.test.js`, `profileService.test.js` | Kiểm thử tự động và trình duyệt của tác nhân đạt; đang chờ review thủ công |
| AC-FE03-010 | UC12 | Ca hình đại diện không hợp lệ giữ nguyên URL hiện tại trong `profileService.test.js` | Kiểm thử tự động và trình duyệt của tác nhân đạt; đang chờ review thủ công |
| AC-FE03-011 | UC12 | Ca từ chối hình đại diện của Khách trong `profileRoutes.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| AC-FE03-012 | UC11 | Các ca tự động tạo có khóa trong `profileRepository.test.js`, `profileService.test.js` | Kiểm thử tự động đạt; đang chờ SQL/review thủ công |
| AC-FE03-013 | UC12 | Từ chối trực tiếp `avatarUrl` trong `profileService.test.js`, `profileFrontend.test.js` | Kiểm thử tự động đạt; đang chờ review thủ công |
| AC-FE03-014 | UC12 | Các ca bù trừ và dọn dẹp trong `profileRepository.test.js`, `profileService.test.js`, `avatarStorage.test.js` | Kiểm thử tự động đạt; đang chờ SQL/review thủ công |

Phạm vi áp dụng: 17/17 BR, 10/10 FR và 14/14 AC có ánh xạ mục đích thử nghiệm và trường hợp sử dụng rõ ràng.

---

## 17. Danh sách kiểm tra đánh giá

Danh sách kiểm tra phê duyệt giai đoạn 1 (hoàn thành trên 2026-06-10):

- [x] Các trường hồ sơ có thể chỉnh sửa được phê duyệt.
- [x] Quyền sở hữu điện thoại và email được xác nhận với FE02/FE11.
- [x] Hành vi thiếu hồ sơ đã được phê duyệt.
- [x] Bản sửa đổi chính sách lưu trữ tải lên hình đại diện đã được xem xét và phê duyệt (Q-FE03-004: hệ thống tệp cục bộ, 2026-06-25 đã được phê duyệt).
- [x] Các quy tắc DTO về quyền riêng tư và phản hồi được xem xét.
- [x] Mọi tiêu chí chấp nhận đều có thể trở thành một bài kiểm tra.
- [x] Các cột `department` và `specialization` thuộc sở hữu của FE11 được loại trừ khỏi danh sách cho phép DTO và PUT an toàn FE03.
