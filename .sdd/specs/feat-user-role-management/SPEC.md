# SPEC.md - FE11 Quản lý vai trò và người dùng

# Phiên bản: 0.6.15

# Trạng thái: ĐÃ TRIỂN KHAI RANH GIỚI QUẢN TRỊ TÀI KHOẢN QUẢN TRỊ - ĐANG CHỜ CON NGƯỜI RÀ SOÁT

# Chủ sở hữu: Dung

# Cập nhật lần cuối: 2026-08-02

# ID tính năng: FE11

# Thư mục tính năng: `.sdd/specs/feat-user-role-management/`

> Trạng thái bàn giao PR B: Core FE11 và ma trận quyền nhúng đã có bằng chứng
> tự động, SQL disposable và trình duyệt cục bộ. Exact-SHA staging hậu merge,
> review tích hợp và chuyển `Implementation State: COMPLETE` vẫn đang chờ PR D.

> Bản sửa đổi thay thế được phê duyệt ngày 2026-07-28 (`Q-FE11-029`): đối với
> tài khoản hiện có, Quản trị viên có thể xem chi tiết an toàn nhưng chỉ được
> thay đổi vai trò duy nhất của tài khoản hoặc vô hiệu hóa tài khoản. UI Quản trị
> viên không cung cấp thao tác Chỉnh sửa hồ sơ và FE11 không cung cấp tuyến thay
> đổi hồ sơ `PUT /api/users/{userId}`. Người dùng đã xác thực tự sửa các trường
> hồ sơ được phê duyệt qua FE03; email đã xác minh vẫn thuộc FE02. Quyết định này
> thay thế Q-FE11-028 và mọi tuyên bố cập nhật hồ sơ được quản lý/trường công việc
> xung đột được giữ lại làm bằng chứng lịch sử.

> Nguồn chuẩn cho Quản lý người dùng và vai trò FE11. Đặc tả này được phê duyệt để lập kế hoạch Giai đoạn 2. Tài liệu được viết chi tiết có chủ đích vì FE11 rất quan trọng đối với quản trị và kiểm soát quyền truy cập hệ thống.
>
> Các quyết định trong đặc tả này đã được rà soát và phê duyệt ngày 2026-06-10. Xem `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
>
> Bản sửa đổi thiết lập tài khoản do Quản trị viên tạo được phê duyệt qua `ADR-005-admin-created-account-setup-boundary.md`. Hợp đồng quản trị Lô hoàn thiện FE11 được phê duyệt ngày 2026-07-19; phần triển khai sản phẩm Đợt A/Đợt B đã được rà soát qua PR #59 H2/H3 và hợp nhất thành `eed2688`. Nghiệm thu bản phát hành trên nhánh chính hiện tại vẫn được theo dõi riêng.
>
> Lớp điều hướng bổ sung ngày 2026-07-22 đã được phê duyệt: thanh bên Quản trị thêm mục Rà soát tư cách thành viên FE04 sau Tất cả người dùng. FE11 chỉ sở hữu mục khung/điều hướng; FE04 giữ quyền sở hữu API danh sách/rà soát và nghiệp vụ. Xem `docs/superpowers/specs/2026-07-22-admin-membership-review-integration-design.md`.
>
> Bản sửa đổi quyền sở hữu dữ liệu cá nhân ngày 2026-07-22 đã được phê duyệt: FE03 sở hữu thay đổi tự phục vụ đối với `fullName`, `phone` và `address`; thay đổi email đã xác minh thuộc FE02 và vẫn nằm ngoài Giai đoạn 1 cho đến khi một luồng rõ ràng được phê duyệt. Quản trị viên FE11 có thể xem các trường đó nhưng chỉ được cập nhật trường công việc của Thủ thư (`department`, `specialization`). Phần triển khai cập nhật rộng của Quản trị viên trước đây không còn là bằng chứng nghiệm thu và phải được giới hạn theo `FE11-PDO01..PDO04` trước khi bản sửa đổi này hoàn tất.
>
> Bản sửa đổi lịch sử ngày 2026-07-25 (`Q-FE11-028`, được Q-FE11-029 thay thế): Quản trị viên FE11 có thể cập nhật
> `fullName`, `phone` và `address` cho mọi tài khoản Thành viên, Thủ thư hoặc Quản trị viên
> được quản lý. FE03 giữ quyền tự phục vụ đối với cùng các trường hồ sơ được lưu bền,
> và cả hai luồng dùng chung phiên bản đồng thời lạc quan hiệu lực mới nhất của `Users`/`UserProfiles`.
> Email của tài khoản hiện có vẫn chỉ đọc theo quyền sở hữu xác minh của FE02.
> `department` và `specialization` bị loại khỏi giao diện Quản trị viên FE11
> và hợp đồng cập nhật người dùng hiện có. Đoạn này thay thế mọi tuyên bố xung đột
> ngày 2026-07-22 về quyền sở hữu/trường công việc được giữ bên dưới làm bằng chứng lịch sử.
>
> Bản sửa đổi v0.6.8 kết nối vòng đời tài khoản với FE07: việc xóa `MEMBER` hoặc
> vô hiệu hóa tài khoản bị chặn khi còn yêu cầu đang chờ hoặc lượt mượn đang hoạt động.
> Chi tiết Yêu cầu của Quản trị viên hiển thị các điều kiện chặn phê duyệt đã biết và chỉ vô hiệu hóa
> thao tác phê duyệt; thao tác từ chối vẫn khả dụng cho yêu cầu cũ không hợp lệ.

---

## 0.1 Đối soát xung đột closeout PR B

| ID | Quyết định đã phê duyệt | Kết quả đối soát |
| --- | --- | --- |
| CF-001 / BD-003 | Chọn lại vai trò duy nhất hiện tại là no-op lũy đẳng, trả DTO an toàn chuẩn và không ghi audit thay vai trò. | Giữ nguyên yêu cầu chuẩn FR-FE11-025; sửa hàng truy vết lỗi thời “bị từ chối”. |
| CF-002 / BD-004 | Thay vai trò nguyên tử toàn bộ ánh xạ để còn đúng một vai trò được duyệt; không phục hồi gán/thu hồi độc lập. | FR-FE11-026/027 dùng ngữ nghĩa chuẩn hóa zero/multiple mapping và bất biến `UX_UserRoles_UserId`. |
| CF-003 / BD-005 | Giữ đúng tám mục sidebar Admin và mở ma trận quyền chỉ đọc từ bề mặt Quản lý người dùng/vai trò hiện có. | FR-FE11-032 dùng nút `Xem ma trận quyền`/`Ẩn ma trận quyền`; không có mục sidebar thứ chín. |
| CF-004 | Chỉ thêm truy vết khi mã nguồn và kiểm thử thật chứng minh đúng yêu cầu. | Characterization Core 186/186 và SQL disposable 9/9 đạt; nguồn FE11 đạt 43/43 nhưng trạng thái vẫn `PARTIAL`. |

---

## 1. Tổng quan về tính năng

### 1.1 Tên tính năng

Quản lý người dùng và vai trò

### 1.2 Bối cảnh nghiệp vụ

Quản lý người dùng và vai trò cho phép Quản trị viên tạo, xem và vô hiệu hóa tài khoản người dùng (Thành viên, Thủ thư, Quản trị viên), quản lý việc gán vai trò và duy trì các trường công việc của Thủ thư. Dữ liệu hồ sơ cá nhân vẫn thuộc người dùng sau khi tạo tài khoản. Tính năng này bảo đảm chỉ nhân sự được cấp quyền mới truy cập được chức năng hệ thống và người dùng được quản lý nhất quán trong suốt vòng đời tài khoản.

Đây là tính năng cốt lõi vì dữ liệu người dùng/vai trò không chính xác có thể phá vỡ kiểm soát truy cập, cho phép hành động trái phép, làm lộ dữ liệu nhạy cảm và tạo trách nhiệm kiểm toán.

### 1.3 Mục tiêu / Kết quả

Hệ thống sẽ:

- Cho phép Quản trị viên xem danh sách tất cả người dùng với chức năng lọc và tìm kiếm.
- Cho phép Quản trị viên xem thông tin chi tiết của người dùng.
- Cho phép Quản trị viên tạo tài khoản Thành viên mới.
- Cho phép Quản trị viên tạo tài khoản Thủ thư mới.
- Giữ các thay đổi hồ sơ cá nhân (`fullName`, `phone`, `address`) trong chế độ tự phục vụ FE03 và giữ thay đổi email đã xác minh thuộc quyền sở hữu của FE02.
- Giữ thông tin hồ sơ của người dùng hiện có ở chế độ chỉ đọc đối với Quản trị viên; việc sửa hồ sơ thuộc về chủ tài khoản thông qua FE03.
- Cho phép Quản trị viên vô hiệu hóa tài khoản người dùng.
- Cho phép Quản trị viên vô hiệu hóa tài khoản Thủ thư.
- Cho phép Quản trị viên thay thế nguyên tử vai trò duy nhất của người dùng.
- Cung cấp điều hướng bảng điều khiển Quản trị gồm Trang chủ, Bảng điều khiển, Thư viện, Quản lý mượn sách, Quản lý yêu cầu, Tất cả người dùng, Rà soát tư cách thành viên và Nhật ký kiểm toán; giữ thao tác thay thế nguyên tử vai trò trong Tất cả người dùng thay vì hiển thị mục Quyền riêng trên thanh bên.
- Cung cấp các chế độ xem chỉ đọc về quyền/báo cáo để tóm tắt người dùng, vai trò, quy tắc truy cập và hoạt động kiểm toán mà không trùng phạm vi báo cáo FE12.
- Giữ mọi hành động quản lý người dùng ở trạng thái có thể truy vết để kiểm toán.

### 1.4 Mức đặc tả

- [x] Đặc tả đầy đủ - logic nghiệp vụ cốt lõi, rủi ro cao, phải đúng ngay từ đầu
- [ ] Đặc tả tiêu chuẩn - chức năng thông thường có quy tắc nghiệp vụ và kiểm tra hợp lệ
- [ ] Đặc tả rút gọn - giao diện đơn giản, tài liệu hoặc chức năng ít rủi ro

---

## 2. Tác nhân và quyền

| Tác nhân | Mô tả | Quyền / Trách nhiệm |
| ----- | ----------- | --------------------------- |
| Quản trị viên | Quản trị viên hệ thống | Có thể xem chi tiết tài khoản an toàn, tạo tài khoản, thay thế vai trò duy nhất, gửi lại email thiết lập đủ điều kiện và vô hiệu hóa tài khoản; không thể sửa các trường hồ sơ/định danh tài khoản của người dùng hiện có. |
| Thủ thư | Nhân viên thư viện (không phải quản trị viên) | Không thể quản lý người dùng. Có thể xem và cập nhật các trường hồ sơ FE03 được phép của riêng mình; thay đổi email yêu cầu luồng xác minh FE02 được phê duyệt riêng. |
| Thành viên | Người dùng thư viện (không phải nhân viên) | Không thể quản lý người dùng. Chỉ có thể tự phục vụ việc mượn/đặt chỗ khi tài khoản không có `LIBRARIAN` hay `ADMIN`; có thể xem và cập nhật các trường hồ sơ FE03 được phép của riêng mình; thay đổi email yêu cầu luồng xác minh FE02 được phê duyệt riêng. |
| Khách | Khách truy cập không được xác thực | Không thể truy cập quản lý người dùng. |
| Bộ ghi nhật ký kiểm toán | Thành phần hệ thống | Ghi mọi hành động quản lý người dùng (tạo, cập nhật, vô hiệu hóa, gán vai trò). |

---

## 3. Điều kiện tiên quyết

Tính năng này chỉ có thể bắt đầu khi:

- PRE-FE11-001: Người dùng thực hiện hành động quản lý người dùng được xác thực là Quản trị viên.
- PRE-FE11-002: Các bảng Users, Roles và UserRoles tồn tại trong cơ sở dữ liệu.
- PRE-FE11-003: Người dùng mới được tạo có một địa chỉ email duy nhất. FE11 không thay đổi email của người dùng hiện tại.
- PRE-FE11-004: Định nghĩa vai trò (Thành viên, Thủ thư, Quản trị viên) được cấu hình sẵn trong bảng Roles.
- PRE-FE11-005: Bảng AuditLogs tồn tại để ghi lại các thao tác quản lý người dùng.

---

## 4. Luồng chính

### MF-FE11-001: Xem danh sách người dùng

1. Quản trị viên điều hướng đến phần quản lý người dùng.
2. Hệ thống hiển thị danh sách tất cả người dùng với thông tin cơ bản (ID, email, tên, trạng thái, vai trò).
3. Hệ thống trả về người dùng theo thứ tự ổn định `CreatedAt DESC, UserId DESC` và áp dụng hợp đồng phân trang chuẩn.
4. Hệ thống hỗ trợ lọc theo `status` (`ACTIVE`, `INACTIVE` hoặc `LOCKED`) và `role` (`member`, `librarian` hoặc `admin`).
5. Hệ thống hỗ trợ giá trị `search` đã loại khoảng trắng đầu/cuối để tìm theo email, tên hoặc ID người dùng.
6. Quản trị viên có thể nhấp vào người dùng để xem thông tin chi tiết.

### MF-FE11-002: Xem thông tin người dùng

1. Quản trị viên mở danh sách người dùng hoặc tìm kiếm một người dùng cụ thể.
2. Quản trị viên nhấp vào hồ sơ người dùng để xem thông tin chi tiết.
3. Hệ thống trả về DTO `UserManagementView` an toàn được định nghĩa trong Mục 10.3: ID, email, tên người dùng, họ tên, số điện thoại, địa chỉ, trạng thái, vai trò, ngày tạo, ngày cập nhật gần nhất, ngày đăng nhập gần nhất và các trường Thủ thư đã phê duyệt khi áp dụng.
4. Phản hồi chi tiết gồm `relatedSummary` với `activeBorrowingCount`, `unpaidFineTotal` và `openReservationCount`; bản ghi nguồn bị thiếu cho giá trị bằng không. Tuyệt đối không trả về hàm băm thông tin xác thực, mã thông báo thô, hàm băm mã thông báo, mã định danh phiên, liên kết đặt lại/thiết lập hay siêu dữ liệu kiểm toán bí mật.

### MF-FE11-003: Tạo tài khoản người dùng

1. Quản trị viên mở biểu mẫu tạo người dùng mới.
2. Quản trị viên chọn chính xác một loại người dùng được hỗ trợ: `member` hoặc `librarian`.
3. Quản trị viên nhập các trường bắt buộc: email, họ tên, điện thoại (tùy chọn), địa chỉ (tùy chọn).
4. Hệ thống kiểm tra và chuẩn hóa yêu cầu tại ranh giới tuyến.
5. Trong một giao dịch, hệ thống khóa và kiểm tra lại Quản trị viên thực hiện đang hoạt động, kiểm tra tính duy nhất của email/tên người dùng đã chuẩn hóa, tạo bản ghi người dùng mới với trạng thái `INACTIVE`, gán vai trò Thành viên, lưu hàm băm bcrypt không thể sử dụng của một giá trị do máy chủ tạo rồi loại bỏ, tạo mã thông báo `ACCOUNT_SETUP` đã băm có thời hạn 24 giờ và ghi mục kiểm toán FE11.
6. Sau khi giao dịch nguồn được cam kết, FE11 yêu cầu gửi `ACCOUNT_SETUP` qua trình yêu cầu được ràng buộc với `FE11`, dùng siêu dữ liệu nguồn `AuthToken` và khóa lũy đẳng `FE11:ACCOUNT_SETUP:<tokenId>`.
7. FE10 kết xuất và gửi liên kết thiết lập mà không lưu bền hay trả về mã thông báo thô, liên kết hoặc nội dung nhạy cảm đã kết xuất.
8. Đăng nhập dựa trên mật khẩu vẫn không khả dụng khi tài khoản là `INACTIVE`.
9. Nếu gửi thất bại, tài khoản vẫn ở `INACTIVE` và phản hồi chỉ báo cáo trạng thái gửi an toàn; Quản trị viên có thể dùng luồng gửi lại đã phê duyệt.
10. Hệ thống hiển thị ID người dùng mới, vai trò đã gán, trạng thái tài khoản và trạng thái gửi thiết lập an toàn.

### MF-FE11-004: Duy trì thông tin hồ sơ được quản lý

1. Quản trị viên mở chi tiết người dùng để rà soát vận hành.
2. FE11 hiển thị các giá trị tài khoản/hồ sơ an toàn trong danh sách cho phép ở chế độ chỉ đọc.
3. Các thay đổi duy nhất đối với tài khoản hiện có mà tính năng này cung cấp cho Quản trị viên là thay thế vai trò nguyên tử và vô hiệu hóa.
4. Người dùng đã xác thực tự sửa các trường hồ sơ được phê duyệt qua FE03 `/api/profile/me`.
5. FE11 không cung cấp `PUT /api/users/{userId}`; yêu cầu trực tiếp tới đường dẫn đó trả về `404`.
6. Thay đổi email vẫn nằm ngoài Giai đoạn 1 và yêu cầu luồng xác minh FE02 được phê duyệt rõ ràng.

### MF-FE11-005: Vô hiệu hóa tài khoản người dùng

1. Quản trị viên mở thao tác vô hiệu hóa từ hàng người dùng hoặc chi tiết người dùng.
2. Quản trị viên nhấp nút "Vô hiệu hóa tài khoản" và gửi phiên bản hiệu lực `expectedUpdatedAt` đã tải.
3. Hệ thống từ chối tài khoản `INACTIVE` đang chờ kích hoạt bằng `409 ACCOUNT_PENDING_ACTIVATION`; chỉ tài khoản đã vô hiệu hóa có `deactivatedAt` khác null mới là thao tác không thay đổi có tính lũy đẳng.
4. Hệ thống kiểm tra lượt mượn đang hoạt động và chặn vô hiệu hóa khi còn lượt mượn đang hoạt động.
5. Quản trị viên xác nhận vô hiệu hóa tài khoản `ACTIVE` hoặc `LOCKED`.
6. Hệ thống đặt trạng thái người dùng thành `INACTIVE` và ghi lại dấu thời gian của máy chủ `deactivatedAt`.
7. Hệ thống giữ nguyên dữ liệu người dùng (không xóa).
8. Trong cùng giao dịch, hệ thống vô hiệu hóa mọi thông tin xác thực làm mới/phiên đang hoạt động của người dùng đó.
9. Hệ thống ghi mục nhật ký kiểm toán trong cùng giao dịch; nếu vô hiệu hóa thông tin xác thực hoặc lưu bền bản ghi kiểm toán thất bại thì toàn bộ thao tác vô hiệu hóa được hoàn tác.
10. Hệ thống hiển thị thông báo thành công.

### MF-FE11-006: Tạo tài khoản thủ thư

1. Quản trị viên mở biểu mẫu tạo người dùng mới.
2. Quản trị viên chọn loại người dùng: Thủ thư.
3. Quản trị viên nhập các trường bắt buộc: email, họ tên, bộ phận (tùy chọn), chuyên môn (tùy chọn).
4. Hệ thống kiểm tra và chuẩn hóa yêu cầu tại ranh giới tuyến.
5. Trong một giao dịch, hệ thống khóa và kiểm tra lại Quản trị viên thực hiện đang hoạt động, kiểm tra tính duy nhất của email/tên người dùng đã chuẩn hóa, tạo bản ghi người dùng mới với trạng thái `INACTIVE`, lưu bền `department`/`specialization` có thể null sau khi loại khoảng trắng đầu/cuối, gán vai trò Thủ thư, lưu hàm băm bcrypt không thể sử dụng của một giá trị do máy chủ tạo rồi loại bỏ, tạo mã thông báo `ACCOUNT_SETUP` đã băm có thời hạn 24 giờ và ghi mục kiểm toán FE11.
6. Sau khi giao dịch nguồn được cam kết, FE11 yêu cầu gửi `ACCOUNT_SETUP` qua trình yêu cầu được ràng buộc với `FE11`, dùng siêu dữ liệu nguồn `AuthToken` và khóa lũy đẳng `FE11:ACCOUNT_SETUP:<tokenId>`.
7. FE10 kết xuất và gửi liên kết thiết lập mà không lưu bền hay trả về mã thông báo thô, liên kết hoặc nội dung nhạy cảm đã kết xuất.
8. Đăng nhập dựa trên mật khẩu vẫn không khả dụng khi tài khoản là `INACTIVE`.
9. Nếu gửi thất bại, tài khoản vẫn ở `INACTIVE` và phản hồi chỉ báo cáo trạng thái gửi an toàn; Quản trị viên có thể dùng luồng gửi lại đã phê duyệt.
10. Hệ thống hiển thị ID người dùng mới, vai trò đã gán, trạng thái tài khoản và trạng thái gửi thiết lập an toàn.

### MF-FE11-007: Thực Thi Ranh Giới Hồ Sơ Chỉ Đọc Của Người Dùng Hiện Có

1. Quản trị viên mở tài khoản Thành viên, Thủ thư hoặc Quản trị viên hiện có.
2. Hệ thống hiển thị các giá trị hồ sơ/tài khoản an toàn để tham chiếu vận hành.
3. Hệ thống không cung cấp thao tác Chỉnh sửa hồ sơ hoặc trường công việc.
4. Thay thế vai trò mở lệnh vai trò nguyên tử riêng.
5. Vô hiệu hóa đủ điều kiện mở lệnh vòng đời riêng.
6. Yêu cầu trực tiếp `PUT /api/users/{userId}` trả về `404` và không thực hiện ghi.

### MF-FE11-008: Vô hiệu hóa tài khoản thủ thư

1. Quản trị viên mở tài khoản thủ thư hiện có.
2. Quản trị viên xác nhận vô hiệu hóa và gửi phiên bản hiệu lực `expectedUpdatedAt` đã tải.
3. Hệ thống từ chối trường hợp đang chờ kích hoạt, trạng thái cũ, tự nhắm mục tiêu, còn yêu cầu mượn đang chờ hoặc lượt mượn đang hoạt động mà không thay đổi dữ liệu.
4. Đối với thủ thư `ACTIVE` hoặc `LOCKED`, hệ thống đặt trạng thái thành `INACTIVE` và ghi lại dấu thời gian của máy chủ `deactivatedAt`.
5. Trong cùng giao dịch, hệ thống vô hiệu hóa mọi thông tin xác thực làm mới/phiên đang hoạt động của Thủ thư đó.
6. Hệ thống ghi mục nhật ký kiểm toán trong cùng giao dịch; nếu thất bại thì hoàn tác thao tác vô hiệu hóa.
7. Hệ thống hiển thị DTO an toàn có tính chuẩn.

### MF-FE11-009: Quản lý vai trò

1. Quản trị viên mở trang chi tiết người dùng.
2. Quản trị viên xem các vai trò hiện tại được gán cho người dùng.
3. Quản trị viên chọn chính xác một vai trò thay thế.
4. Hệ thống khóa ánh xạ vai trò bị ảnh hưởng, đếm người giữ vai trò Quản trị viên đang hoạt động trong cùng giao dịch và từ chối thay thế nếu thao tác đó khiến không còn người giữ vai trò Quản trị viên đang hoạt động.
5. Nếu thay `MEMBER` bằng vai trò khác, hệ thống tuần tự hóa với FE07 và từ chối khi còn yêu cầu đang chờ hoặc lượt mượn đang hoạt động.
6. Hệ thống xóa nguyên tử ánh xạ hiện tại, chèn ánh xạ đã chọn và ghi một mục nhật ký kiểm toán chứa vai trò trước và vai trò mới.
7. Chọn vai trò hiện tại là thao tác không thay đổi có tính lũy đẳng và không ghi bản kiểm toán thành công.
8. Hệ thống trả về DTO người dùng an toàn có tính chuẩn, với mảng `roles` chứa đúng một mục.

### MF-FE11-014: Gửi lại email thiết lập mật khẩu

1. Quản trị viên mở tài khoản do quản trị viên tạo mà thiết lập mật khẩu chưa hoàn tất.
2. Quản trị viên yêu cầu email thiết lập mới.
3. Trong một giao dịch, trước tiên hệ thống khóa và kiểm tra lại Quản trị viên thực hiện đang hoạt động, sau đó xác nhận tài khoản đích là `INACTIVE`, có lịch sử mã thông báo `ACCOUNT_SETUP`, chưa hoàn tất thiết lập và đã qua khoảng chờ phát hành 60 giây.
4. Trong giao dịch đó, FE11 thu hồi các mã thông báo thiết lập đang hoạt động trước đó, tạo mã thông báo `ACCOUNT_SETUP` mới đã băm có thời hạn 24 giờ và ghi mục kiểm toán gửi lại.
5. FE11 yêu cầu gửi `ACCOUNT_SETUP` mới qua trình yêu cầu được ràng buộc với `FE11`, dùng ID mã thông báo mới và khóa lũy đẳng.
6. Hệ thống trả về trạng thái gửi an toàn `SENT` hoặc `FAILED` mà không trả về mã thông báo hay liên kết thiết lập.

### MF-FE11-010: Xem bảng điều khiển Quản trị và điều hướng

1. Quản trị viên mở bảng điều khiển Quản trị.
2. Hệ thống hiển thị các thẻ tóm tắt và biểu đồ vận hành bằng dữ liệu chỉ đọc từ nguồn sách, mượn sách, yêu cầu, người dùng-vai trò và tư cách thành viên.
3. Số lượng vai trò của tài khoản đang hoạt động dùng ánh xạ đơn chuẩn `Users -> UserRoles -> Roles`; trạng thái hồ sơ đăng ký tư cách thành viên FE04 vẫn là chỉ số quy trình riêng và không được xem là vai trò đăng nhập `MEMBER`.
4. Mỗi thẻ tóm tắt mở mô-đun Quản trị viên sở hữu thẻ với bộ lọc vai trò hoặc trạng thái quy trình tương ứng khi áp dụng.
5. Thanh bên hiển thị các mục Quản trị đã phê duyệt: Trang chủ, Bảng điều khiển, Thư viện, Quản lý mượn sách, Quản lý yêu cầu, Tất cả người dùng, Rà soát tư cách thành viên và Nhật ký kiểm toán.
6. Hệ thống không hiển thị các mục nhập thanh bên `Permissions`, `Confirm Payment` hoặc `Confirm Borrow` đã bị xóa.
7. Hệ thống giữ thao tác thay thế vai trò duy nhất trong Tất cả người dùng và không hiển thị mục Quyền riêng trên thanh bên.
8. Bảng điều khiển Quản trị dùng chung khung ứng dụng, đầu trang, thanh bên thích ứng, kiểu chữ và hệ màu kem/nâu với các trang Thành viên và Thủ thư.
9. Thư viện Quản trị mở chức năng quản lý danh mục bên trong bảng điều khiển Quản trị và không chuyển Quản trị viên tới tuyến Thủ thư; không gian làm việc nhúng tiếp tục dùng API FE05 chuẩn và quy tắc phân quyền.

### MF-FE11-011: Xem quyền

1. Quản trị viên mở Quyền.
2. Hệ thống hiển thị tóm tắt vai trò và ma trận phân quyền cho Quản trị viên, Thủ thư và Thành viên.
3. Hệ thống dùng vai trò FE11 làm nguồn chuẩn và không cho phép người dùng không phải Quản trị viên chỉnh sửa quyền.

### MF-FE11-012: Xem nhật ký kiểm toán

1. Quản trị viên mở Nhật ký kiểm toán.
2. Hệ thống liệt kê các hành động quản trị/hệ thống quan trọng cùng tác nhân, hành động, đối tượng đích, dấu thời gian và chi tiết an toàn.
3. Giao diện Quản trị viên hiển thị trực tiếp danh sách hoạt động được phân trang mà không có điều khiển tìm kiếm hay lọc.
4. Nhật ký kiểm toán ở chế độ chỉ đọc trên giao diện.

### MF-FE11-013: Quản lý chế độ rà soát yêu cầu của Quản trị viên

1. Quản trị viên mở Quản lý yêu cầu.
2. Hệ thống liệt kê bản ghi mượn/yêu cầu bằng dữ liệu yêu cầu FE07 cùng các điều khiển tìm kiếm/lọc/xuất.
3. Quản trị viên có thể xem chi tiết yêu cầu.
4. Các yêu cầu có trạng thái `PENDING` / `Chờ xác nhận` có thể được xử lý theo quy trình mượn đã được phê duyệt.
5. Các yêu cầu có trạng thái `COMPLETED` / `Hoàn thành` ở dạng chỉ đọc và không thể chỉnh sửa từ chế độ xem này.

---

## 5. Luồng thay thế

### AF-FE11-001: Email đã tồn tại

1. Quản trị viên cố gắng tạo người dùng mới bằng email đã được sử dụng.
2. Hệ thống phát hiện email trùng lặp.
3. Hệ thống trả về lỗi: "Email đã được đăng ký. Sử dụng email khác hoặc liên hệ với chủ tài khoản; Quản trị viên không thể thay đổi email của người dùng hiện tại."

### AF-FE11-002: Người dùng có khoản vay đang hoạt động

1. Quản trị viên cố gắng vô hiệu hóa người dùng đang mượn sách.
2. Hệ thống phát hiện các khoản vay đang hoạt động.
3. Hệ thống từ chối vô hiệu hóa và báo cáo: "Người dùng này có [N] mục đang được mượn."
4. Quản trị viên phải xử lý xong vòng đời mượn đang hoạt động trước khi thử vô hiệu hóa lại.

### AF-FE11-003: Không thể xóa quản trị viên cuối cùng

1. Quản trị viên cố gắng xóa vai trò Quản trị viên khỏi người dùng quản trị viên cuối cùng còn lại.
2. Hệ thống phát hiện đây là quản trị viên cuối cùng.
3. Hệ thống từ chối hành động: "Không thể xóa vai trò quản trị viên khỏi người dùng quản trị viên cuối cùng."

### AF-FE11-004: Quản trị viên cố gắng thay đổi thông tin cá nhân

1. Quản trị viên gửi bản cập nhật của người dùng hiện tại có chứa `fullName`, `phone`, `address` hoặc `email`.
2. Hệ thống nhận biết FE11 không có tuyến cập nhật hồ sơ người dùng hiện có.
3. Hệ thống trả về `404` và không lưu bền trường đã gửi, thay đổi phiên bản hoặc bản kiểm toán thành công.

## 6. Quy tắc nghiệp vụ

Dùng các ID ổn định này cho nhiệm vụ và kiểm thử.

- BR-FE11-001: Chỉ người dùng Quản trị viên được xác thực mới có thể truy cập các tính năng quản lý người dùng.
- BR-FE11-002: Chỉ người dùng Quản trị viên được xác thực mới có thể tạo người dùng mới.
- BR-FE11-003: Không thể xóa vĩnh viễn người dùng; chỉ được vô hiệu hóa (đặt thành `INACTIVE` cùng `deactivatedAt` do máy chủ ghi). Tài khoản đã vô hiệu hóa không thể được kích hoạt lại trong Giai đoạn 1.
- BR-FE11-004: Mỗi người dùng phải có một địa chỉ email duy nhất trong hệ thống.
- BR-FE11-005: Khi Quản trị viên tạo người dùng, tài khoản phải bắt đầu với trạng thái `INACTIVE` và không thể xác thực cho đến khi FE02 hoàn tất thiết lập mật khẩu và kích hoạt nó một cách nguyên tử.
- BR-FE11-006: Khi tài khoản người dùng bị vô hiệu hóa, thay đổi trạng thái, `deactivatedAt`, việc vô hiệu hóa mọi thông tin xác thực làm mới/phiên đang hoạt động và nhật ký kiểm toán phải được cam kết nguyên tử.
- BR-FE11-007: Mỗi tài khoản được lưu bền phải được gán đúng một vai trò: Thành viên, Thủ thư hoặc Quản trị viên.
- BR-FE11-008: Các vai trò tài khoản loại trừ lẫn nhau. Thay đổi vai trò phải thay thế ánh xạ hiện tại và thu hồi nguyên tử thông tin xác thực làm mới/phiên đang hoạt động của tài khoản đích; tuyệt đối không được tạo ánh xạ thứ hai hoặc để tài khoản không có vai trò. Người dùng phải xác thực lại trước khi dùng vai trò thay thế.
- BR-FE11-009: Hệ thống tuyệt đối không được cho phép thay thế vai trò của Quản trị viên đang hoạt động cuối cùng. Việc đếm Quản trị viên còn lại và thay thế vai trò phải được kiểm tra dưới khóa giao dịch để thay đổi đồng thời không thể vượt qua quy tắc này.
- BR-FE11-010: Mọi hành động quản lý người dùng thuộc FE11 (tạo, gửi lại thiết lập, vô hiệu hóa, thay đổi vai trò) phải có khả năng kiểm toán.
- BR-FE11-011: Người dùng thành viên không thể tạo hoặc quản lý người dùng khác.
- BR-FE11-012: Người dùng thủ thư không thể tạo hoặc quản lý người dùng.
- BR-FE11-013: Quản trị viên không bao giờ trực tiếp nhập, xem hoặc tạo mật khẩu. Thiết lập mật khẩu sẽ tạo liên kết mã thông báo một lần được gửi qua email và người dùng đặt mật khẩu của riêng họ thông qua FE02.
- BR-FE11-014: Sau khi tạo tài khoản, các trường hồ sơ/định danh tài khoản của người dùng hiện có chỉ đọc trong FE11. Chủ tài khoản dùng FE03 cho các thay đổi hồ sơ tự phục vụ đã phê duyệt; thay đổi email của tài khoản hiện có thuộc về luồng FE02 đã xác minh và vẫn nằm ngoài Giai đoạn 1.
- BR-FE11-015: Các mục tiêu Thành viên, Thủ thư và Quản trị viên cung cấp cùng hai thao tác vòng đời cho Quản trị viên: thay thế vai trò duy nhất và vô hiệu hóa khi đủ điều kiện. Không vai trò mục tiêu nào cung cấp thao tác Chỉnh sửa hồ sơ cho Quản trị viên.
- BR-FE11-016: Thanh bên Quản trị là bề mặt truy cập do FE11 kiểm soát; chỉ được hiển thị tám mục đã phê duyệt, gồm Rà soát tư cách thành viên FE04 sau Tất cả người dùng, và không được chứa `Permissions`, `Confirm Payment` hay `Confirm Borrow`. Quản lý vai trò vẫn khả dụng từ Tất cả người dùng.
- BR-FE11-017: Giao diện Quyền là bản tóm tắt/ma trận vai trò chỉ đọc, trừ khi một thao tác sửa vai trò riêng được thực hiện rõ ràng trong Quản lý vai trò.
- BR-FE11-018: Nhật ký kiểm toán chỉ đọc đối với Quản trị viên và không được làm lộ hàm băm mật khẩu, mã thông báo hay dữ liệu cá nhân không cần thiết.
- BR-FE11-019: Quản lý yêu cầu quản trị viên có thể hiển thị dữ liệu yêu cầu FE07 nhưng các yêu cầu đã hoàn thành ở dạng chỉ đọc; chỉ những yêu cầu đang chờ xử lý mới có thể hiển thị các điều khiển hành động.
- BR-FE11-020: Bảng điều khiển Quản trị có thể tổng hợp số liệu/biểu đồ vận hành, nhưng tạo báo cáo chi tiết vẫn thuộc Báo cáo và thống kê FE12.
- BR-FE11-021: FE11 sở hữu việc phát hành và thu hồi mã thông báo `ACCOUNT_SETUP` do Quản trị viên tạo; FE02 sở hữu việc sử dụng mã thông báo, băm mật khẩu và kích hoạt; FE10 sở hữu kết xuất và gửi liên kết thiết lập.
- BR-FE11-022: FE11 chỉ được yêu cầu gửi thiết lập qua `createSourceNotificationRequester('FE11')`, dùng cặp chuẩn `ACCOUNT_SETUP -> ACCOUNT_SETUP`, `sourceEntityType: AuthToken`, ID mã thông báo đã lưu bền và khóa lũy đẳng `FE11:ACCOUNT_SETUP:<tokenId>`.
- BR-FE11-023: Mã thông báo và liên kết thiết lập thô chỉ được tồn tại trong bộ nhớ tiến trình của yêu cầu đang hoạt động và tuyệt đối không xuất hiện trong dữ liệu lưu bền, nhật ký, bản ghi kiểm toán, phản hồi Quản trị viên hoặc trường HTTP chỉ dành cho kiểm thử.
- BR-FE11-024: Việc tạo người dùng, hồ sơ, vai trò ban đầu, mã thông báo thiết lập và bản ghi kiểm toán FE11 phải cùng được cam kết hoặc hoàn tác sau khi giao dịch khóa, kiểm tra lại Quản trị viên thực hiện đang hoạt động và kiểm tra chuẩn tính duy nhất của email/tên người dùng đã chuẩn hóa; việc gửi qua nhà cung cấp FE10 chỉ diễn ra sau giao dịch nguồn này và vẫn không chặn luồng.
- BR-FE11-025: Chỉ cho phép Quản trị viên gửi lại sau khi giao dịch nguồn khóa, kiểm tra lại Quản trị viên thực hiện đang hoạt động và xác nhận một tài khoản `INACTIVE` do Quản trị viên tạo có lịch sử mã thông báo thiết lập chưa hoàn tất; mỗi lần gửi lại thu hồi mã thông báo thiết lập đang hoạt động trước đó và tạo mã thông báo/sự kiện/khóa mới sau khoảng chờ 60 giây.
- BR-FE11-026: Phản hồi danh sách/chi tiết người dùng phải dùng DTO `UserManagementView` đã phê duyệt và không bao giờ làm lộ hàm băm mật khẩu, thông tin xác thực thô hoặc đã băm, mã định danh phiên, liên kết thiết lập/đặt lại hoặc siêu dữ liệu kiểm toán bí mật.
- BR-FE11-027: Việc vô hiệu hóa phải dùng `updatedAt` khác null đã tải, được định nghĩa là dấu thời gian hiệu lực mới nhất giữa `Users` và `UserProfiles`; thao tác dùng trạng thái cũ trả về HTTP `409` với mã `STALE_USER_STATE` và không lưu thay đổi vòng đời hoặc bản kiểm toán thành công.
- BR-FE11-028: Vai trò duy nhất của tài khoản xác định nhóm người dùng của tài khoản trên FE01, FE07, FE08, FE09 và điều hướng chung. Chỉ `MEMBER` có quyền tự phục vụ của Thành viên về mượn/đặt chỗ/xem tiền phạt của mình; `LIBRARIAN` và `ADMIN` dùng các tuyến dành cho nhân viên.
- BR-FE11-029: Quản lý yêu cầu Quản trị viên FE11 là bề mặt kết hợp/đọc trên FE07. Nó phải hiển thị trạng thái bản sao vật lý hiện tại trong DTO chi tiết an toàn, chỉ dùng lệnh phê duyệt/từ chối FE07 và tải lại trạng thái yêu cầu chuẩn sau cả thành công lẫn xung đột; không được tạo vòng đời yêu cầu Quản trị viên riêng.
- BR-FE11-030: FE11 không được vô hiệu hóa tài khoản hay thay thế vai trò `MEMBER` khi FE07 báo còn yêu cầu mượn đang chờ hoặc chi tiết mượn đang hoạt động. Thao tác vòng đời và thao tác tạo/phê duyệt FE07 dùng cùng khóa giao dịch theo Thành viên.
- BR-FE11-031: Với yêu cầu cũ đang chờ có chủ sở hữu đã biết là không hoạt động/không phải Thành viên hoặc bản sao không sẵn có, Quản lý yêu cầu Quản trị viên vô hiệu hóa thao tác phê duyệt kèm điều kiện chặn có hướng xử lý nhưng vẫn cho phép từ chối; FE07 vẫn là nguồn chuẩn tại thời điểm thực thi lệnh.
- BR-FE11-032: Số liệu Thành viên trên Bảng điều khiển Quản trị đếm tài khoản `ACTIVE` qua ánh xạ đơn chuẩn `UserRoles`. Biểu đồ mượn chỉ đếm chi tiết FE07 đã cam kết `BorrowDate`; biểu đồ trả trong ngày dùng ngày nghiệp vụ `Asia/Ho_Chi_Minh` dùng chung với FE07. Phần trình bày đã phê duyệt vẫn gồm năm thẻ tóm tắt và ba biểu đồ. Thẻ bảng điều khiển chuyển tới mô-đun sở hữu và giữ bộ lọc trạng thái tương ứng.
- BR-FE11-033: Vai trò hiện tại duy nhất của tài khoản kiểm soát quyền truy cập dữ liệu tham chiếu danh mục: `ADMIN` có thể liệt kê/tạo/cập nhật/vô hiệu hóa tác giả, nhà xuất bản và danh mục qua `/api/admin/library/*`; mọi mutation được phép phải ghi actor và audit catalog trong cùng giao dịch. `LIBRARIAN` chỉ được đọc lựa chọn đang hoạt động qua FE05 `/api/books/metadata`; `MEMBER` và Khách không được thực hiện hai nhóm thao tác này.

---

## 7. Yêu cầu chức năng

- FR-FE11-001: Khi Quản trị viên mở danh sách người dùng, hệ thống phải hiển thị danh sách `UserManagementView` được phân trang với giá trị mặc định `page = 1`/`limit = 20`, giới hạn `limit = 1..100`, thứ tự ổn định `CreatedAt DESC, UserId DESC` và các bộ lọc trạng thái/vai trò/tìm kiếm đã phê duyệt.
- FR-FE11-002: Khi Quản trị viên xem chi tiết người dùng, hệ thống phải trả về DTO `UserManagementView` an toàn với `relatedSummary` bắt buộc gồm ba trường và giá trị mặc định bằng không có tính xác định, đồng thời loại trừ mọi trường thông tin xác thực, mã thông báo, phiên, liên kết và kiểm toán bí mật được liệt kê trong Mục 10.3.
- FR-FE11-003: Khi Quản trị viên tạo tài khoản người dùng mới bằng dữ liệu hợp lệ, hệ thống phải kiểm tra lại Quản trị viên thực hiện đang hoạt động và tính duy nhất đã chuẩn hóa trong giao dịch nguồn; tạo nguyên tử người dùng `INACTIVE`, hồ sơ, vai trò đã phê duyệt, mã thông báo thiết lập đã băm và mục kiểm toán; sau đó yêu cầu một lần gửi thiết lập FE10 và trả về trạng thái gửi an toàn.
- FR-FE11-004: Hệ thống không được cung cấp lệnh cho Quản trị viên sửa các trường hồ sơ/định danh tài khoản của người dùng hiện có. `PUT /api/users/{userId}` không thuộc hợp đồng FE11 và phải trả về `404`.
- FR-FE11-005: Khi Quản trị viên gửi biểu mẫu tạo người dùng có email đã chuẩn hóa bị trùng, gồm cả xung đột đồng thời được chỉ mục tất định `UX_Users_Email` thực thi, hệ thống phải trả về `409 EMAIL_ALREADY_EXISTS`, không lưu bền trạng thái tài khoản/thiết lập/kiểm toán một phần và không yêu cầu FE10 gửi.
- FR-FE11-006: Hệ thống không bao giờ yêu cầu quản trị viên nhập mật khẩu khi tạo người dùng; thiết lập mật khẩu phải diễn ra thông qua luồng mã thông báo FE02 một lần.
- FR-FE11-007: Với mỗi người dùng hiện có, UI Quản trị viên phải cung cấp thao tác thay thế vai trò và vô hiệu hóa đủ điều kiện, đồng thời không cung cấp thao tác Chỉnh sửa hồ sơ. FE03 tự phục vụ tiếp tục sở hữu các chỉnh sửa hồ sơ cá nhân đã phê duyệt.
- FR-FE11-008: Khi Quản trị viên vô hiệu hóa tài khoản người dùng `ACTIVE` hoặc `LOCKED` có phiên bản hiệu lực `expectedUpdatedAt` khớp, hệ thống phải nguyên tử đặt trạng thái thành `INACTIVE`, đặt `deactivatedAt`, vô hiệu hóa mọi thông tin xác thực làm mới/phiên đang hoạt động và ghi bản kiểm toán; tài khoản đang chờ kích hoạt trả về `409 ACCOUNT_PENDING_ACTIVATION` mà không thay đổi dữ liệu.
- FR-FE11-009: Khi Quản trị viên tạo tài khoản Thủ thư mới bằng dữ liệu hợp lệ, hệ thống phải kiểm tra lại Quản trị viên thực hiện đang hoạt động và tính duy nhất đã chuẩn hóa trong giao dịch nguồn; tạo nguyên tử người dùng `INACTIVE`, hồ sơ có `department`/`specialization` đã loại khoảng trắng đầu/cuối và có thể null, vai trò Thủ thư, mã thông báo thiết lập đã băm cùng mục kiểm toán; sau đó yêu cầu một lần gửi thiết lập FE10 và trả về trạng thái gửi an toàn.
- FR-FE11-010: Bề mặt Quản trị viên FE11 phải hiển thị dữ liệu hồ sơ/công việc hiện có của Thủ thư ở chế độ chỉ đọc và không cung cấp lệnh cập nhật riêng cho Thủ thư.
- FR-FE11-011: Khi Quản trị viên vô hiệu hóa tài khoản Thủ thư `ACTIVE` hoặc `LOCKED` có phiên bản hiệu lực `expectedUpdatedAt` khớp, hệ thống phải nguyên tử đặt trạng thái thành `INACTIVE`, đặt `deactivatedAt`, vô hiệu hóa mọi thông tin xác thực làm mới/phiên đang hoạt động và ghi bản kiểm toán; tài khoản đang chờ kích hoạt trả về `409 ACCOUNT_PENDING_ACTIVATION` mà không thay đổi dữ liệu.
- FR-FE11-012: Khi Quản trị viên thay đổi vai trò người dùng, hệ thống phải thay mọi ánh xạ UserRoles hiện tại bằng đúng một vai trò hợp lệ đã chọn, thu hồi thông tin xác thực làm mới/phiên đang hoạt động của tài khoản đích và ghi mục kiểm toán trong một giao dịch.
- FR-FE11-013: API quản lý vai trò phải cung cấp một thao tác thay thế nguyên tử và không được cung cấp thao tác gán/thu hồi độc lập có thể tạo số lượng ánh xạ trung gian không hợp lệ.
- FR-FE11-014: Khi Quản trị viên thay thế vai trò, hệ thống phải khóa ánh xạ bị ảnh hưởng, đánh giá số Quản trị viên đang hoạt động còn lại trong cùng giao dịch và từ chối mọi thay đổi khiến không còn người giữ vai trò Quản trị viên đang hoạt động.
- FR-FE11-030: Khi Quản trị viên mở bảng điều khiển, hệ thống phải hiển thị tám mục thanh bên đã phê duyệt với Rà soát tư cách thành viên sau Tất cả người dùng; ẩn các mục điều hướng Quyền / Xác nhận thanh toán / Xác nhận mượn đã bị loại; dùng khung ứng dụng chung của Thành viên/Thủ thư; và giữ thao tác Thư viện Quản trị trong bảng điều khiển Quản trị mà không chuyển tới tuyến Thủ thư.
- FR-FE11-031: Khi Quản trị viên mở Bảng điều khiển, hệ thống phải hiển thị chế độ xem vận hành chỉ đọc gồm năm thẻ và ba biểu đồ đã phê duyệt từ các chủ sở hữu tính năng đã phê duyệt, gồm số Thành viên đang hoạt động chuẩn, số tác giả, sách thực tế đã mượn và lượt trả trong ngày nghiệp vụ hiện tại của Việt Nam; chọn thẻ tóm tắt phải mở mô-đun Quản trị viên sở hữu thẻ với bộ lọc tương ứng.
- FR-FE11-032: Khi Quản trị viên mở ma trận quyền chỉ đọc từ bề mặt Quản lý người dùng/vai trò, hệ thống phải hiển thị tóm tắt vai trò và ma trận quyền cho Quản trị viên, Thủ thư và Thành viên mà không thêm mục Quyền thứ chín vào sidebar.
- FR-FE11-033: Khi Quản trị viên mở Nhật ký kiểm toán, hệ thống phải hiển thị các mục kiểm toán chỉ đọc được phân trang mà không có điều khiển tìm kiếm hay lọc hiển thị.
- FR-FE11-034: Khi Quản trị viên mở Quản lý yêu cầu, hệ thống phải liệt kê bản ghi yêu cầu với điều khiển tìm kiếm/lọc/xuất DOCX và xem chi tiết; tệp xuất phải gồm mọi trang máy chủ khớp các bộ lọc đã cố định và chỉ chứa phép chiếu yêu cầu đã phê duyệt.
- FR-FE11-035: NẾU yêu cầu đã ở `COMPLETED`, hệ thống phải tắt điều khiển chỉnh sửa/thao tác và chỉ cho phép xem.
- FR-FE11-036: Khi Quản trị viên yêu cầu gửi lại thiết lập cho tài khoản chưa hoàn tất đủ điều kiện sau khoảng chờ, FE11 phải kiểm tra lại Quản trị viên thực hiện đang hoạt động trong giao dịch nguồn, thu hồi các mã thông báo thiết lập đang hoạt động trước đó, tạo ID mã thông báo mới, ghi mục kiểm toán và chỉ yêu cầu một lần gửi `ACCOUNT_SETUP` FE10 mới sau khi cam kết.
- FR-FE11-037: NẾU gửi thiết lập FE10 thất bại khi tạo hoặc gửi lại, FE11 phải giữ trạng thái tài khoản/mã thông báo `INACTIVE` đã cam kết và chỉ trả về trạng thái gửi an toàn `FAILED`.
- FR-FE11-038: NẾU quá trình gửi lại thiết lập nhắm mục tiêu tài khoản không đủ điều kiện hoặc xảy ra trong vòng 60 giây kể từ lần phát hành mã thông báo thiết lập mới nhất, FE11 sẽ từ chối yêu cầu mà không cấp hoặc tiết lộ thông tin xác thực mới.
- FR-FE11-039: Khi Quản trị viên mở chi tiết yêu cầu mượn, phép chiếu FE11 an toàn phải gồm trạng thái chi tiết FE07 chuẩn của từng mục và trạng thái bản sao vật lý FE06 hiện tại mà không làm lộ trường kho hay thông tin xác thực nội bộ.
- FR-FE11-040: Khi lệnh phê duyệt/từ chối của Quản trị viên thành công hoặc xung đột, Quản lý yêu cầu phải tải lại danh sách và chi tiết chuẩn. Từ chối phải yêu cầu lý do đã loại khoảng trắng đầu/cuối dài 1..500 ký tự và giải thích rằng từ chối yêu cầu đang chờ sẽ giải phóng quyền giữ bản sao logic của yêu cầu.
- FR-FE11-041: NẾU Quản trị viên cố gắng vô hiệu hóa người dùng có yêu cầu mượn đang chờ xử lý, FE11 sẽ trả về `409 PENDING_BORROW_REQUESTS_EXIST`; NẾU Quản trị viên cố gắng thay thế `MEMBER` trong khi tồn tại các yêu cầu đang chờ xử lý hoặc khoản vay đang hoạt động, FE11 sẽ trả lại `409 MEMBER_BORROWING_WORKFLOW_EXISTS`.
- FR-FE11-042: KHI Quản trị viên mở yêu cầu cũ đang chờ được xác định là không thể phê duyệt, chi tiết phải liệt kê thông báo điều kiện chặn an toàn, chỉ vô hiệu hóa phê duyệt và vẫn cho phép từ chối.
- FR-FE11-043: NẾU Thủ thư, Thành viên hoặc Khách gọi bất kỳ điểm cuối `/api/admin/library/{authors|publishers|categories}` nào, máy chủ phải từ chối yêu cầu trước khi gọi tầng lưu bền siêu dữ liệu. KHI Quản trị viên đã xác thực tạo/cập nhật/vô hiệu hóa dữ liệu tham chiếu, mutation và audit catalog phải cùng commit/rollback; cập nhật ID không tồn tại hoặc vô hiệu hóa ID không tồn tại/không còn hoạt động trả `404 ADMIN_RESOURCE_ITEM_NOT_FOUND` mà không ghi audit thành công.

### 7.1 Yêu cầu hành vi không mong muốn (Lỗi / Điều kiện bất thường)

Các yêu cầu EARS về hành vi không mong muốn này nâng các nhánh lỗi/bất thường hiện có (Luồng thay thế, Quy tắc nghiệp vụ, Trường hợp biên, Câu hỏi đã giải quyết) thành yêu cầu chức năng có thể truy vết.

- FR-FE11-015: NẾU người dùng không phải quản trị viên (Thành viên, Thủ thư hoặc Khách) cố gắng truy cập bất kỳ tính năng quản lý người dùng nào, hệ thống sẽ từ chối yêu cầu kèm theo lỗi ủy quyền. (Nguồn: BR-FE11-001, BR-FE11-011, BR-FE11-012)
- FR-FE11-016: NẾU Quản trị viên yêu cầu chi tiết, vô hiệu hóa hoặc thay đổi vai trò cho ID người dùng không tồn tại, hệ thống phải trả về lỗi không tìm thấy. (Nguồn: EC-FE11-002)
- FR-FE11-017: NẾU thiếu người dùng Quản trị viên thực hiện trong khi tạo, gửi lại thiết lập, vô hiệu hóa hoặc thay đổi vai trò, hệ thống phải trả về `404 ADMIN_NOT_FOUND` và không được thay đổi nguồn hay ghi bản kiểm toán thành công; tác nhân không hoạt động hoặc không phải Quản trị viên nhận `403 ADMIN_REQUIRED`. (Nguồn: EC-FE11-001)
- FR-FE11-018: NẾU quản trị viên cố gắng vô hiệu hóa tài khoản của chính họ, hệ thống sẽ từ chối hành động đó. (Nguồn: Q-FE11-001, EC-FE11-006)
- FR-FE11-019: NẾU quản trị viên cố gắng vô hiệu hóa người dùng đang có khoản vay đang hoạt động, hệ thống sẽ chặn việc hủy kích hoạt và báo cáo số lượng mục đã mượn đang hoạt động. (Nguồn: AF-FE11-002, Q-FE11-002, MF-FE11-005 bước 3)
- FR-FE11-020: NẾU Quản trị viên cố gọi đường dẫn cập nhật hồ sơ người dùng hiện có đã ngừng sử dụng, hệ thống phải trả về `404` mà không thay đổi dữ liệu; mọi khả năng thay đổi email trong tương lai phải dùng luồng xác minh FE02 được phê duyệt rõ ràng. (Nguồn: BR-FE11-014, Q-FE11-029)
- FR-FE11-021: NẾU email gửi khi tạo tài khoản FE11 sai định dạng, chứa dữ liệu tấn công chèn SQL hoặc dài hơn 255 ký tự, hệ thống phải làm sạch đầu vào, từ chối yêu cầu và trả về lỗi kiểm tra hợp lệ. (Nguồn: EC-FE11-003, EC-FE11-004)
- FR-FE11-022: NẾU lỗi cơ sở dữ liệu xảy ra khi tạo người dùng, hệ thống phải hoàn tác giao dịch và trả về lỗi mà không tạo bản ghi người dùng một phần. (Nguồn: EC-FE11-008, NFR-FE11-TXN-001)
- FR-FE11-023: KHI `expectedUpdatedAt` của thao tác vô hiệu hóa không bằng phiên bản hiệu lực mới nhất của `Users`/`UserProfiles`, hệ thống phải từ chối thay đổi bằng HTTP `409` với mã `STALE_USER_STATE`, giữ nguyên bản ghi hiện có và không ghi bản kiểm toán thành công. (Nguồn: EC-FE11-007, BR-FE11-027)
- FR-FE11-024: NẾU Quản trị viên chọn một vai trò không tồn tại hoặc không phải là một trong `MEMBER`, `LIBRARIAN`, `ADMIN`, hệ thống sẽ trả về lỗi không tìm thấy và sẽ không sửa đổi ánh xạ UserRoles. (Nguồn: EC-FE11-010)
- FR-FE11-025: NẾU Quản trị viên chọn vai trò duy nhất hiện tại của người dùng, hệ thống phải trả về DTO an toàn có tính chuẩn như một thao tác không thay đổi có tính lũy đẳng và không ghi bản kiểm toán thay đổi vai trò. (Nguồn: EC-FE11-011)
- FR-FE11-026: NẾU dữ liệu kiểu cũ không có hoặc có nhiều ánh xạ hiện tại, một thao tác thay thế hợp lệ rõ ràng phải chuẩn hóa dữ liệu thành đúng một ánh xạ trong giao dịch, có áp dụng bảo vệ Quản trị viên đang hoạt động cuối cùng. (Nguồn: EC-FE11-012)
- FR-FE11-027: Cơ sở dữ liệu phải thực thi tối đa một hàng UserRoles cho mỗi UserId qua `UX_UserRoles_UserId`; tạo tài khoản và thay thế vai trò phải bảo đảm có ít nhất một ánh xạ. (Nguồn: EC-FE11-013, BR-FE11-007)
- FR-FE11-028: NẾU Quản trị viên bỏ qua UI và yêu cầu `PUT /api/users/{userId}` với bất kỳ payload hồ sơ nào, đường dẫn đã ngừng sử dụng phải trả về `404` và không được ghi vào repository hồ sơ hoặc ghi bản kiểm toán thành công.
- FR-FE11-029: NẾU người dùng cố gắng hoàn tất thiết lập mật khẩu bằng mã thông báo đã hết hạn hoặc đã được sử dụng, hệ thống sẽ từ chối yêu cầu và sẽ không kích hoạt đăng nhập dựa trên mật khẩu. (Nguồn: trường dữ liệu `passwordSetupToken`/`passwordSetupTokenExpiresAt` trong phần 10.2, BR-FE11-013)

---

## 8. Tiêu chí chấp nhận

- AC-FE11-001: Với quyền truy cập Quản trị viên, khi xem danh sách người dùng thì hệ thống hiển thị danh sách phân trang an toàn với giá trị mặc định/giới hạn, thứ tự ổn định, bộ lọc trạng thái/vai trò, tìm kiếm email/tên/ID người dùng đã loại khoảng trắng đầu/cuối và các giá trị email, tên người dùng dễ đọc, không chồng lấp.
- AC-FE11-002: Với quyền truy cập Quản trị viên, khi xem trang chi tiết người dùng thì DTO `UserManagementView` an toàn và các tóm tắt liên quan đã phê duyệt được hiển thị mà không chứa thông tin xác thực, dữ liệu mã thông báo/phiên, liên kết thiết lập/đặt lại hay siêu dữ liệu kiểm toán bí mật.
- AC-FE11-003: Với dữ liệu người dùng hợp lệ, khi Quản trị viên tạo tài khoản người dùng mới thì người dùng không hoạt động, vai trò đã phê duyệt, mã thông báo thiết lập đã băm và mục kiểm toán được cam kết cùng nhau, đồng thời một lần gửi thiết lập FE10 được yêu cầu.
- AC-FE11-004: Cho trước tài khoản hiện có, khi Quản trị viên xem các thao tác trong danh sách/chi tiết thì chỉ có thay thế vai trò và vô hiệu hóa đủ điều kiện; không hiển thị thao tác Chỉnh sửa và yêu cầu trực tiếp `PUT /api/users/{userId}` trả về `404` mà không thay đổi dữ liệu.
- AC-FE11-005: Với email đã chuẩn hóa bị trùng, khi Quản trị viên tạo người dùng mới thì hệ thống trả về `409 EMAIL_ALREADY_EXISTS`, không lưu bền trạng thái nguồn một phần và không yêu cầu gửi thiết lập.
- AC-FE11-006: Với việc Quản trị viên tạo Thành viên hoặc Thủ thư mới, không trường mật khẩu/mã thông báo/liên kết nào được yêu cầu hay hiển thị, tài khoản vẫn ở `INACTIVE` và không thể đăng nhập cho đến khi hoàn tất thiết lập FE02.
- AC-FE11-007: Với người dùng `ACTIVE` hoặc `LOCKED` và phiên bản hiệu lực `expectedUpdatedAt` khớp, khi Quản trị viên vô hiệu hóa tài khoản thì trạng thái chuyển thành `INACTIVE`; tài khoản đang chờ kích hoạt trả về `409 ACCOUNT_PENDING_ACTIVATION` mà không thay đổi dữ liệu.
- AC-FE11-008: Cho trước bất kỳ tài khoản hiện có nào, khi Quản trị viên cố thay đổi email qua đường dẫn cập nhật hồ sơ đã ngừng sử dụng thì hệ thống trả về `404` và giữ nguyên email.
- AC-FE11-009: Với người dùng có phiên đang hoạt động, khi Quản trị viên vô hiệu hóa tài khoản thì phiên bị vô hiệu.
- AC-FE11-010: Với dữ liệu Thủ thư hợp lệ, khi Quản trị viên tạo tài khoản Thủ thư mới thì người dùng không hoạt động, vai trò Thủ thư, mã thông báo thiết lập đã băm và mục kiểm toán được cam kết cùng nhau, đồng thời một lần gửi thiết lập FE10 được yêu cầu.
- AC-FE11-011: Cho trước tài khoản Thủ thư hiện có, khi Quản trị viên xem các thao tác thì áp dụng cùng ranh giới chỉ thay thế vai trò/vô hiệu hóa và không cung cấp trình chỉnh sửa hồ sơ/trường công việc riêng cho Thủ thư.
- AC-FE11-012: Với tài khoản Thủ thư `ACTIVE` hoặc `LOCKED` và phiên bản hiệu lực `expectedUpdatedAt` khớp, khi Quản trị viên vô hiệu hóa thì trạng thái chuyển thành `INACTIVE` và các phiên đang hoạt động bị vô hiệu.
- AC-FE11-013: Cho trước tài khoản Thành viên có phiên hoạt động, khi Quản trị viên mở quản lý vai trò và thay thế vai trò bằng Thủ thư thì chỉ còn đúng một ánh xạ Thủ thư, thông tin xác thực refresh/session đang hoạt động bị thu hồi, một bản kiểm toán thay thế được commit và yêu cầu được bảo vệ tiếp theo yêu cầu xác thực theo vai trò mới.
- AC-FE11-014: Với tài khoản Quản trị viên không phải là Quản trị viên hoạt động cuối cùng, khi Quản trị viên thay thế vai trò của mình bằng Thành viên thì vẫn còn lại chính xác một ánh xạ Thành viên.
- AC-FE11-015: Với tài khoản Quản trị viên đang hoạt động cuối cùng, khi Quản trị viên cố thay vai trò Quản trị viên thì hệ thống từ chối mà không thay đổi ánh xạ hay bản kiểm toán.
- AC-FE11-016: Với việc Quản trị viên mở bảng điều khiển, tám mục đã phê duyệt hiển thị đúng thứ tự với Rà soát tư cách thành viên sau Tất cả người dùng, các quy trình đã loại bị ẩn và quản lý danh mục mở trong Thư viện Quản trị mà không chuyển hướng sang tuyến Thủ thư.
- AC-FE11-017: Với việc Quản trị viên mở Quyền, số lượng vai trò và ma trận quyền được hiển thị bằng dữ liệu vai trò FE11.
- AC-FE11-018: Với việc Quản trị viên mở Nhật ký kiểm toán, các hàng nhật ký có thể được rà soát mà không làm lộ trường thông tin xác thực/mã thông báo nhạy cảm.
- AC-FE11-019: Với việc Quản trị viên mở Quản lý yêu cầu, yêu cầu đang chờ có thể hiển thị các điều khiển thao tác đã phê duyệt, còn yêu cầu đã hoàn tất chỉ cho phép xem.
- AC-FE11-020: Với lỗi gửi thiết lập xảy ra sau khi cam kết tạo tài khoản, tài khoản vẫn ở `INACTIVE`, không thông tin xác thực nào bị lộ và phản hồi báo cáo trạng thái an toàn `FAILED`.
- AC-FE11-021: Với tài khoản chưa hoàn tất thiết lập đủ điều kiện và đã qua khoảng chờ, khi Quản trị viên gửi lại thiết lập thì mã thông báo đang hoạt động trước đó bị thu hồi và sự kiện FE10 mới dùng ID mã thông báo/khóa lũy đẳng mới.
- AC-FE11-022: Với tài khoản đang hoạt động, bị khóa, không hoạt động do tự đăng ký, đã hoàn tất thiết lập hoặc chưa qua khoảng chờ, khi Quản trị viên yêu cầu gửi lại thiết lập thì hệ thống từ chối mà không tạo thông tin xác thực.
- AC-FE11-023: Cho trước Quản trị viên gửi thao tác vô hiệu hóa bằng `expectedUpdatedAt` hiệu lực cũ, khi bản ghi người dùng hiện tại đã thay đổi thì hệ thống trả về `409 STALE_USER_STATE` và không lưu thay đổi vòng đời, thu hồi thông tin xác thực hoặc bản kiểm toán thành công.
- AC-FE11-024: Với việc Quản trị viên mở yêu cầu đang chờ, mỗi mã vạch được yêu cầu được ghép với trạng thái bản sao vật lý hiện tại; sau xung đột phê duyệt, trạng thái đã làm mới vẫn đúng sự thật và thao tác từ chối kèm lý do hợp lệ vẫn khả dụng.
- AC-FE11-025: Khi Quản trị viên mở Bảng điều khiển, năm thẻ tóm tắt và ba biểu đồ đã phê duyệt vẫn hiển thị; số Thành viên đang hoạt động khớp `Users -> UserRoles -> Roles`; số tác giả khớp tác giả danh mục đang hoạt động; danh sách mượn nhiều nhất loại trừ chi tiết `REQUESTED` chưa phê duyệt; biểu đồ trả trong ngày dùng ngày FE07 của ngày nghiệp vụ hiện tại tại Việt Nam; và chọn thẻ mở mô-đun tương ứng với bộ lọc áp dụng.
- AC-FE11-026: Với các tài khoản mang vai trò Quản trị viên, Thủ thư và Thành viên, khi từng tài khoản yêu cầu quản lý siêu dữ liệu Quản trị viên thì chỉ Quản trị viên tới được dịch vụ siêu dữ liệu; Thủ thư chỉ giữ quyền đọc lựa chọn đang hoạt động riêng của FE05.

---

## 9. Trường hợp biên và xử lý lỗi

| ID | Trường hợp biên / Lỗi | Hành vi hệ thống dự kiến |
| -- | ----------------- | ------------------------ |
| EC-FE11-001 | Quản trị viên thực hiện không tồn tại, không hoạt động hoặc không còn vai trò Quản trị viên | Xác thực lại trong các giao dịch tạo/gửi lại/vô hiệu hóa/vai trò; trả về `404 ADMIN_NOT_FOUND` hoặc `403 ADMIN_REQUIRED` trước khi thay đổi dữ liệu. |
| EC-FE11-002 | ID người dùng mục tiêu không tồn tại | Trả về lỗi không tìm thấy. |
| EC-FE11-003 | Email chứa payload SQL injection | Làm sạch đầu vào và xác thực định dạng email; từ chối nếu không hợp lệ. |
| EC-FE11-004 | Địa chỉ email có ký tự đặc biệt | Xác thực nghiêm ngặt định dạng email theo tiêu chuẩn RFC. |
| EC-FE11-005 | Giá trị thiết lập mật khẩu dài hơn 255 ký tự | FE02 từ chối yêu cầu thiết lập do lỗi xác thực trường; FE11 không bao giờ nhận hoặc lưu trữ mật khẩu. |
| EC-FE11-006 | Cố gắng tự vô hiệu hóa (quản trị viên) | Từ chối hành động. |
| EC-FE11-007 | Vô hiệu hóa đồng thời cùng một người dùng | So sánh `expectedUpdatedAt` với `COALESCE(UpdatedAt, CreatedAt)`; từ chối giá trị không khớp bằng `409 STALE_USER_STATE`, không lưu thay đổi vòng đời/thông tin xác thực và không ghi bản kiểm toán thành công. |
| EC-FE11-008 | Cập nhật cơ sở dữ liệu thất bại trong quá trình tạo người dùng | Rollback giao dịch; trả lỗi cho người dùng. |
| EC-FE11-009 | Vô hiệu hóa phiên của người dùng bị vô hiệu hóa thất bại | Rollback trạng thái, `deactivatedAt` và thay đổi nhật ký kiểm toán; trả về lỗi an toàn và giữ tài khoản hoạt động. |
| EC-FE11-010 | Vai trò không tồn tại khi gán | Trả về lỗi không tìm thấy. |
| EC-FE11-011 | Người dùng đã có vai trò đang được gán | Từ chối bằng thông báo: "Người dùng đã có vai trò này." |
| EC-FE11-012 | Cố gắng thu hồi vai trò không tồn tại | Trả về lỗi không tìm thấy. |
| EC-FE11-013 | Thay đổi sẽ tạo ra không có hoặc có nhiều vai trò | Từ chối hoặc rollback; trạng thái thành công phải chứa chính xác một ánh xạ. |
| EC-FE11-014 | Quản trị viên gửi bất kỳ trường hồ sơ nào của người dùng hiện có, kể cả email hiện tại không đổi | Trả về `404` vì FE11 không cung cấp tuyến cập nhật hồ sơ người dùng hiện có; không lưu bền dữ liệu. |
| EC-FE11-015 | Quản trị viên cố chỉnh sửa trường công việc riêng của Thủ thư | Không cung cấp trình chỉnh sửa hoặc tuyến cập nhật; trả về `404` cho đường dẫn hồ sơ đã ngừng sử dụng. |
| EC-FE11-016 | Mục đã bị xóa khỏi thanh bên quản trị được yêu cầu trực tiếp | Trả về `404 Not Found`; không hiển thị hoặc chuyển hướng tới quy trình đã bị xóa. |
| EC-FE11-017 | Cố thực hiện hành động trên yêu cầu đã hoàn tất từ giao diện yêu cầu của quản trị viên | Từ chối hành động và giữ nguyên yêu cầu. |
| EC-FE11-018 | Chi tiết nhật ký kiểm toán chứa các trường token/password nhạy cảm | Che các trường đó trước khi phản hồi/hiển thị. |
| EC-FE11-019 | Nhà cung cấp phân phối thiết lập thất bại sau khi giao dịch nguồn đã commit | Giữ tài khoản `INACTIVE`; trả về `FAILED` an toàn; cho phép Quản trị viên gửi lại sau thời gian chờ. |
| EC-FE11-020 | Yêu cầu gửi lại thiết lập cho tài khoản tự đăng ký hoặc đã hoàn tất thiết lập | Từ chối bằng `ACCOUNT_SETUP_NOT_ELIGIBLE`; không tạo token/thông báo. |
| EC-FE11-021 | Yêu cầu gửi lại thiết lập trong vòng 60 giây | Từ chối bằng `ACCOUNT_SETUP_RESEND_COOLDOWN`; chỉ cung cấp thông tin thời điểm thử lại an toàn. |
| EC-FE11-022 | Vô hiệu hóa tài khoản `INACTIVE` có `deactivatedAt` là null | Từ chối bằng `409 ACCOUNT_PENDING_ACTIVATION`; Giai đoạn 1 không chuyển trạng thái đang chờ kích hoạt thành trạng thái đã vô hiệu hóa. |

---

## 10. Yêu cầu về dữ liệu

### 10.1 Các thực thể liên quan

| Thực thể | Mục đích trong tính năng này |
| ------ | ----------------------- |
| Users | Lưu dữ liệu tài khoản người dùng: email, mã băm mật khẩu, tên, điện thoại, địa chỉ, trạng thái và dấu thời gian. |
| Roles | Định nghĩa các vai trò hiện có: Thành viên, Thủ thư, Quản trị viên. |
| UserRoles | Lưu chính xác một ánh xạ vai trò cho mỗi người dùng; `UX_UserRoles_UserId` thực thi tính duy nhất theo UserId. |
| AuthTokens / bản ghi phiên | Cơ chế phía máy chủ bắt buộc để vô hiệu hóa thông tin xác thực phiên/refresh đang hoạt động khi vô hiệu hóa và khi có thay đổi tài khoản nhạy cảm với vai trò. |
| AuditLogs | Ghi lại tất cả các hành động quản lý người dùng. |

### 10.2 Các trường dữ liệu

| Trường | Kiểu | Bắt buộc | Xác thực / Ghi chú |
| ----- | ---- | -------- | ------------------ |
| userId | integer | Có | Khóa chính, tự tăng. |
| email | string | Có | Duy nhất, đúng định dạng email, tối đa 255 ký tự. FE11 chỉ được đặt trường này khi tạo tài khoản; mọi thay đổi tài khoản hiện có trong tương lai phải đi qua luồng email đã xác minh và được phê duyệt của FE02. |
| username | string | Không | Trường đăng nhập thay thế, không bắt buộc. |
| passwordHash | string | Có | Mã băm bcrypt, không bao giờ là văn bản thuần. Trước khi thiết lập, lưu mã băm bcrypt không thể sử dụng của một giá trị ngẫu nhiên do máy chủ tạo rồi loại bỏ ngay; cấm dùng giá trị placeholder cố định. |
| fullName | string | Có | Tên hiển thị của người dùng, đã trim, tối đa 100 ký tự để khớp FE03 và `UserProfiles.FullName`; sau khi tạo, trường này thuộc quyền sở hữu của người dùng thông qua FE03. |
| phoneNumber | string | Không | Số điện thoại của người dùng; sau khi tạo, trường này thuộc quyền sở hữu của người dùng thông qua FE03. |
| address | string | Không | Địa chỉ của người dùng; sau khi tạo, trường này thuộc quyền sở hữu của người dùng thông qua FE03. |
| department | string | Không | `UserProfiles.Department` có thể null, đã trim, tối đa 100 ký tự; chỉ Quản trị viên FE11 quản lý và chỉ trả về cho vai trò Thủ thư hiện tại. |
| specialization | string | Không | `UserProfiles.Specialization` có thể null, đã trim, tối đa 100 ký tự; chỉ Quản trị viên FE11 quản lý và chỉ trả về cho vai trò Thủ thư hiện tại. |
| status | enum | Có | Các giá trị: `ACTIVE`, `INACTIVE`, `LOCKED`, khớp với ràng buộc hiện tại của bảng Users. |
| createdAt | datetime | Có | Dấu thời gian tạo tài khoản. |
| updatedAt | datetime | Có | Giá trị phản hồi/đồng thời của FE11 là `COALESCE(Users.UpdatedAt, Users.CreatedAt)` không null; `Users.UpdatedAt` trong lưu trữ vẫn có thể null đối với các hàng cũ. |
| lastLoginAt | datetime | Không | Dấu thời gian đăng nhập thành công gần nhất. |
| lastPasswordChangedAt | datetime | Không | Dấu thời gian đổi mật khẩu gần nhất. |
| deactivatedAt | datetime | Không | Dấu thời gian máy chủ đặt khi tài khoản hiện có bị vô hiệu hóa; null với tài khoản đang hoạt động hoặc đang chờ thiết lập. |
| setupTokenId | integer | Có điều kiện | `AuthTokens.TokenId` được lưu cho loại token `ACCOUNT_SETUP`; dùng để truy vết nguồn và bảo đảm idempotency. |
| setupTokenHash | string | Có điều kiện | Chỉ lưu mã băm mật mã; token thô không bao giờ được lưu. |
| setupTokenExpiresAt | datetime | Có điều kiện | Hết hạn 24 giờ sau khi phát hành. |
| setupTokenUsedAt | datetime | Không | Được FE02 đặt khi thiết lập mật khẩu hoàn tất thành công. |
| setupTokenRevokedAt | datetime | Không | Được đặt khi FE11 gửi lại thiết lập hoặc thu hồi thông tin xác thực chưa hoàn tất. |
| lockedUntil | datetime | Không | Dấu thời gian tài khoản sẽ tự động mở khóa (nếu đang bị khóa). |

### 10.3 DTO quản lý người dùng an toàn

`UserManagementView` là biểu diễn người dùng duy nhất được các endpoint danh sách, chi tiết, tạo và cập nhật công việc Thủ thư của FE11 trả về. Việc một trường xuất hiện trong DTO đọc này không trao cho Quản trị viên quyền thay đổi trường đó.

| Trường được bao gồm | Quy tắc |
| -------------- | ---- |
| `userId`, `email`, `username`, `fullName`, `phoneNumber`, `address`, `status` | Chỉ trả lại cho Quản trị viên đã được xác thực. |
| `roles` | Trả về ID/tên vai trò từ `UserRoles`; không bao giờ suy ra vai trò từ đầu vào phía client. |
| `createdAt`, `updatedAt`, `lastLoginAt` | Trả về dưới dạng dấu thời gian do máy chủ tạo; `updatedAt` là giá trị đồng thời lạc quan `COALESCE(Users.UpdatedAt, Users.CreatedAt)` không null. |
| `department`, `specialization` | Chỉ trả lại khi áp dụng cho tài khoản Thủ thư. |
| `relatedSummary` | Chỉ bắt buộc trong phản hồi chi tiết: `activeBorrowingCount`, `unpaidFineTotal`, `openReservationCount`; mỗi trường bằng không khi không có dữ liệu nguồn tương ứng. |

DTO phải loại trừ `passwordHash`, mật khẩu thô, token xác thực thô hoặc đã băm, ID token dùng làm thông tin xác thực, mã định danh refresh/session, liên kết setup/reset, payload nhà cung cấp và siêu dữ liệu kiểm toán bí mật. Muốn thêm trường khác phải có thay đổi đặc tả FE11 đã được duyệt.

---

## 11. Hợp đồng API / Giao diện

> Các endpoint và cấu trúc request/response dưới đây là hợp đồng chuẩn của Giai đoạn 1 cho tính năng này.

| Phương thức | Endpoint | Actor | Yêu cầu | Phản hồi | Ghi chú |
| ------ | -------- | ----- | ------- | -------- | ----- |
| GET | `/api/users` | Quản trị viên | Query: `page=1, limit=20, status?, role?, search?` | `UserManagementView[]` có phân trang | `page >= 1`, `limit = 1..100`, `search` được trim và dài 1..200 ký tự khi cung cấp; giá trị không hợp lệ bị từ chối. Sắp xếp theo `CreatedAt DESC, UserId DESC`; chỉ trả về DTO an toàn. |
| GET | `/api/users/{userId}` | Quản trị viên | - | `UserManagementView` có `relatedSummary` bắt buộc | Chỉ gồm ba trường tổng hợp đã được phê duyệt, với giá trị mặc định bằng không mang tính xác định. |
| POST | `/api/users` | Quản trị viên | `{ email: string, username?: string, fullName: string, type: "member"\|"librarian", phone?: string, address?: string, department?: string, specialization?: string }` | `201 { userId, email, status: "INACTIVE", roles, setupDeliveryStatus, message }` | Xác thực đầu vào tại biên; giao dịch nguồn xác thực lại Quản trị viên đang hoạt động và tính duy nhất, rồi chỉ yêu cầu FE10 phân phối sau khi commit; không bao giờ trả về mật khẩu/token/liên kết. |
| PATCH | `/api/users/{userId}/status` | Quản trị viên | `{ status: "INACTIVE", expectedUpdatedAt: datetime }` | `UserManagementView` đã cập nhật | Chỉ cho phép chuyển từ `ACTIVE`/`LOCKED`. Tài khoản đang chờ kích hoạt trả về `409 ACCOUNT_PENDING_ACTIVATION`; trạng thái đã vô hiệu hóa có tính idempotent. |
| PUT | `/api/users/{userId}/role` | Quản trị viên | `{ roleId: number }` | Người dùng chuẩn xác với chính xác một vai trò | Thay thế nguyên tử vai trò hiện tại; chọn lại vai trò hiện tại là thao tác không làm thay đổi dữ liệu. |
| POST | `/api/users/{userId}/resend-setup` | Quản trị viên | `{}` | `200 { userId, status: "INACTIVE", setupDeliveryStatus, message }` | Giao dịch nguồn xác thực lại Quản trị viên đang hoạt động trước khi đọc lịch sử mục tiêu; chỉ tài khoản chưa hoàn tất đủ điều kiện; thu hồi token đang hoạt động trước đó và thực thi thời gian chờ 60 giây. |
| GET | `/api/admin/dashboard` | Quản trị viên | - | Dữ liệu tóm tắt/thẻ/biểu đồ của dashboard | Tổng hợp chỉ đọc; báo cáo chi tiết thuộc FE12. |
| GET | `/api/admin/permissions` | Quản trị viên | - | Tóm tắt vai trò và ma trận quyền | Ma trận chỉ đọc; việc thay thế vai trò được thực hiện từ Tất cả người dùng. |
| GET | `/api/admin/audit-logs` | Quản trị viên | Query: `q?, action?, actorId?, from?, to?, page?, limit?` | Danh sách nhật ký kiểm toán | Che các trường nhạy cảm. |
| GET | `/api/admin/requests` | Quản trị viên | Query: `page?, limit?, q?, status?, from?, to?` | Chính xác `{ data, pagination }` | Đọc dữ liệu yêu cầu FE07 cho UI duyệt của Quản trị viên theo hợp đồng chuẩn bên dưới. |
| GET | `/api/admin/requests/{requestId}` | Quản trị viên | - | Chi tiết yêu cầu | Yêu cầu đã hoàn tất chỉ được xem. |
| GET | `/api/admin/library/{resource}` | Quản trị viên | Tham số đường dẫn `resource`: `authors`, `publishers` hoặc `categories`; query `q?` | `{ data: MetadataRecord[] }` | Trả về `id`, `name`, `status` và `createdAt` đã lưu; Thủ thư dùng FE05 `/api/books/metadata` thay thế. |
| POST | `/api/admin/library/{resource}` | Quản trị viên | `{ name }` | `201 { data: MetadataRecord }` | Tạo một bản ghi tham chiếu đang hoạt động; bị từ chối đối với mọi vai trò không phải Quản trị viên. |
| PUT | `/api/admin/library/{resource}/{id}` | Quản trị viên | `{ name }` | `{ data }` | Cập nhật tên tham chiếu mà không thay đổi vai trò hoặc quyền sở hữu sách. |
| PATCH | `/api/admin/library/{resource}/{id}/deactivate` | Quản trị viên | - | `{ deactivated: true, data: { id, status: "INACTIVE" } }` | Vô hiệu hóa mềm bản ghi tham chiếu; giữ nguyên các quan hệ sách hiện có. |

### 11.1 Hợp đồng đọc chuẩn cho yêu cầu của Quản trị viên

- `page` mặc định là 1; `limit` mặc định là 20 và được giới hạn ở 1..100.
- `q` được trim và dài 1..100 ký tự khi cung cấp; `status` là một trong `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED` hoặc `CANCELLED`; `from`/`to` là các giá trị `YYYY-MM-DD` tính cả hai đầu và phải thỏa `from <= to`.
- Xác thực danh tính và phân quyền Quản trị viên chạy trước xác thực chi tiết. Giá trị được hỗ trợ phải lấy từ dữ liệu đã xác thực, không lấy từ query/params thô.
- Các dòng danh sách được sắp xếp theo `RequestDate DESC, RequestId DESC` và chỉ chứa `requestId`, `requestDate`, `status`, `member` an toàn, `itemCount`, `bookTitles` có thứ tự và `categories` duy nhất theo lần xuất hiện đầu tiên.
- Phân trang áp dụng cho các header yêu cầu riêng biệt trước khi join chi tiết; count/data dùng cùng phạm vi bộ lọc. Dấu phẩy hợp lệ trong tiêu đề/danh mục không được tái tạo bằng cách tách chuỗi SQL phân cách bằng dấu phẩy.
- Chi tiết chỉ trả về `requestId`, `requestDate`, `status`, `createdAt`, `updatedAt`, `member` an toàn, `items` an toàn và `lifecycle`. ID không hợp lệ trả về `400 VALIDATION_ERROR`; yêu cầu không tồn tại trả về `404 BORROW_REQUEST_NOT_FOUND`.
- FE11 đọc thông qua ranh giới repository yêu cầu của FE07. Chỉ FE07 sở hữu `/api/borrow-requests/{requestId}/approve` và `/reject`; không thêm alias thay đổi dữ liệu nào cho Quản trị viên, và thao tác trực tiếp trên yêu cầu không ở trạng thái `PENDING` trả về `409 BORROW_REQUEST_NOT_PENDING` mà không ghi dữ liệu/nhật ký kiểm toán thành công.

---

## 12. Yêu cầu phi chức năng

### 12.1 Bảo mật

- NFR-FE11-SEC-001: Tất cả endpoint quản lý người dùng phải yêu cầu xác thực và vai trò Quản trị viên.
- NFR-FE11-SEC-002: Kiểm soát truy cập dựa trên vai trò phải được thực thi trên máy chủ.
- NFR-FE11-SEC-003: Hoàn tất thiết lập mật khẩu phải dùng quy tắc băm bcrypt của FE02 (cost >= 10).
- NFR-FE11-SEC-004: Mọi dữ liệu đầu vào thuộc quyền sở hữu FE11 phải được đưa vào danh sách cho phép, kiểm tra hợp lệ và làm sạch trên máy chủ: các trường tạo tài khoản, giá trị đồng thời vòng đời, mã định danh gửi lại thiết lập và ID vai trò. FE11 không được cung cấp tuyến cập nhật hồ sơ người dùng hiện có.
- NFR-FE11-SEC-005: Phải ngăn SQL injection bằng truy vấn tham số hóa.
- NFR-FE11-SEC-006: Quản trị viên không được xem mã băm mật khẩu hoặc chi tiết nhạy cảm không cần thiết của quản trị viên khác.
- NFR-FE11-SEC-007: Phải so sánh trường email không phân biệt hoa thường khi kiểm tra tính duy nhất.

### 12.2 Tính toàn vẹn giao dịch

- NFR-FE11-TXN-001: Tạo người dùng phải có tính nguyên tử: xác thực lại Quản trị viên đang hoạt động, kiểm tra tính duy nhất có thẩm quyền, bản ghi người dùng, hồ sơ, vai trò mặc định, token thiết lập đã băm và nhật ký kiểm toán phải cùng thành công hoặc cùng rollback.
- NFR-FE11-TXN-002: Vô hiệu hóa người dùng phải có tính nguyên tử: trạng thái người dùng, `deactivatedAt`, vô hiệu hóa thông tin xác thực và nhật ký kiểm toán phải cùng thành công hoặc cùng rollback.
- NFR-FE11-TXN-003: Gán vai trò phải có tính nguyên tử: cập nhật UserRoles và nhật ký kiểm toán phải cùng thành công hoặc cùng rollback.
- NFR-FE11-TXN-004: FE10 phân phối thiết lập sau giao dịch nguồn FE11; lỗi provider/requester không được rollback tài khoản hoặc token và chỉ được trả về trạng thái phân phối an toàn.
- NFR-FE11-TXN-005: Việc xác thực lại Quản trị viên thực hiện gửi lại thiết lập, thu hồi token, tạo token mới và ghi nhật ký kiểm toán phải cùng commit hoặc cùng rollback.
- NFR-FE11-TXN-006: Thay thế vai trò phải khóa hàng `UserRoles` bị ảnh hưởng và số lượng vai trò Quản trị viên đang hoạt động trước khi thay đổi; các thao tác đồng thời phải được tuần tự hóa để mỗi tài khoản có chính xác một vai trò và luôn còn ít nhất một Quản trị viên đang hoạt động.
- NFR-FE11-TXN-007: Tạo, cập nhật hoặc vô hiệu hóa tác giả/nhà xuất bản/thể loại và bản ghi audit tương ứng phải dùng cùng một giao dịch SQL.

### 12.3 Hiệu năng

- NFR-FE11-PERF-001: Truy vấn danh sách người dùng phải áp dụng phân trang trước khi hiện thực hóa các hàng và không được tải toàn bộ bảng người dùng vào bộ nhớ ứng dụng.
- NFR-FE11-PERF-002: Tra cứu người dùng theo email hoặc ID người dùng phải dùng khóa cơ sở dữ liệu hoặc chỉ mục duy nhất tương ứng.
- NFR-FE11-PERF-003: Tra cứu vai trò phải dùng các khóa `UserRoles`/`Roles` và không được quét không giới hạn cho từng người dùng được trả về.

### 12.4 Ghi nhật ký và kiểm toán

- NFR-FE11-LOG-001: Các thao tác tạo, gửi lại thiết lập, vô hiệu hóa và thay thế vai trò có hiệu lực phải ghi mục nhật ký kiểm toán; thay đổi vai trò bị từ chối hoặc không làm thay đổi dữ liệu không được ghi bản kiểm toán thành công.
- NFR-FE11-LOG-002: Nhật ký kiểm toán phải gồm: loại hành động, ID quản trị viên, ID người dùng mục tiêu, dấu thời gian và chi tiết thay đổi.
- NFR-FE11-LOG-003: Audit mutation dữ liệu tham chiếu catalog phải dùng `CATALOG_METADATA_CREATE`, `CATALOG_METADATA_UPDATE` hoặc `CATALOG_METADATA_DEACTIVATE`, chứa ID Quản trị viên, IP, user-agent, target type/ID và metadata theo allowlist; không chứa body thô hoặc credential.

### 12.5 Khả năng sử dụng

- NFR-FE11-UX-001: Lỗi xác thực phải rõ ràng và giải thích nguyên nhân (ví dụ: "Email đã tồn tại", "Mật khẩu quá yếu").
- NFR-FE11-UX-002: Phải hiển thị hộp thoại xác nhận trước các hành động có tính phá hủy (vô hiệu hóa hoặc thay thế vai trò Quản trị viên).
- NFR-FE11-UX-003: Danh sách người dùng phải hiển thị các cột: email, tên, trạng thái, vai trò, lần đăng nhập gần nhất và ngày tạo.
- NFR-FE11-UX-004: Email tài khoản trong thanh bên Quản trị viên phải nằm trên một dòng, có dấu ba chấm và tooltip chứa đầy đủ giá trị; dữ liệu xuất của Quản trị viên phải dùng tệp `.docx` hợp lệ thay vì tải CSV. Bảng xuất phải dùng trang ngang, độ rộng cột tỷ lệ cố định, văn bản gọn dễ đọc, trạng thái đã bản địa hóa và ngày tiếng Việt dạng ngắn.

---

## 13. Ngoài phạm vi

Tính năng này không bao gồm:

- Quản trị viên chỉnh sửa `fullName`, `phone` hoặc `address` của người dùng hiện tại; những thay đổi tự phục vụ đó thuộc về FE03.
- Thay đổi email tài khoản hiện tại; mọi khả năng trong tương lai đều thuộc về luồng FE02 đã được xác minh và nằm ngoài Giai đoạn 1.
- Người dùng tự đặt lại mật khẩu (thuộc Xác thực FE02).
- Đặt lại mật khẩu do quản trị viên thực hiện cho người dùng hiện tại trừ khi được FE02/FE11 thêm rõ ràng sau đó.
- Mở khóa tài khoản sau khi khóa đăng nhập không thành công trừ khi được FE02/FE11 thêm rõ ràng sau đó.
- Kích hoạt lại các tài khoản đã bị vô hiệu hóa trừ khi được phê duyệt rõ ràng dưới dạng một luồng riêng biệt sau này.
- Xóa người dùng vĩnh viễn (chỉ hỗ trợ hủy kích hoạt).
- Thao tác import/hàng loạt người dùng qua CSV.
- Báo cáo hoạt động dựa trên vai trò.
- Người dùng tự đăng ký (thuộc FE02).
- Đồng bộ hóa người dùng Thư mục LDAP/Active.
- Tích hợp đăng nhập một lần (SSO).

---

## 14. Phụ thuộc

| Phụ thuộc | Loại | Ghi chú |
| ---------- | ---- | ----- |
| Xác thực FE02 | Nội bộ | Thông tin người dùng/vai trò được dùng để kiểm soát truy cập; mọi thay đổi email tài khoản hiện có trong tương lai đều phải do FE02 xác minh và sở hữu. |
| Hồ sơ người dùng FE03 | Nội bộ | FE03 sở hữu các thay đổi tự phục vụ đã được xác thực đối với `fullName`, `phone` và `address`; FE11 có thể đọc nhưng không được thay đổi các trường đó sau khi tạo. |
| Quản lý thành viên FE04 | Tích hợp UI nội bộ | FE11 hiển thị mục trong shell Quản trị viên; FE04 sở hữu dữ liệu danh sách/duyệt thành viên được nhúng, các thao tác thay đổi, phân quyền, kiểm toán và thông báo kết quả. |
| Quản lý thông báo FE10 | Nội bộ | Chỉ requester gắn với `FE11` mới kết xuất và phân phối các liên kết `ACCOUNT_SETUP` chuẩn bằng siêu dữ liệu nguồn `AuthToken` an toàn. |
| Cơ sở dữ liệu SQL Server | Kỹ thuật | Lưu trạng thái nguồn FE11; Wave A phải đồng bộ `Users.Email`, `Users.DeactivatedAt`, `UserProfiles.Department`, `UserProfiles.Specialization`, `Notifications.RecipientEmail` và `UX_Users_Email` xác định thông qua migration tạm thời đã được phê duyệt. |

---

## 15. Câu hỏi đã được giải quyết

| ID | Quyết định đã phê duyệt | Nguồn | Trạng thái |
| -- | ----------------- | ------ | ------ |
| Q-FE11-001 | Quản trị viên không thể tự vô hiệu hóa. | Gói đánh giá 2026-06-10 | APPROVED |
| Q-FE11-002 | Ngăn vô hiệu hóa người dùng có lượt mượn đang hoạt động. | Gói đánh giá 2026-06-10 | APPROVED |
| Q-FE11-003 | Thiết lập mật khẩu dùng cùng quy tắc độ phức tạp mật khẩu của FE02. | Gói đánh giá 2026-06-10 | APPROVED |
| Q-FE11-004 | Email không phân biệt hoa thường khi đăng nhập và kiểm tra tính duy nhất. | Gói đánh giá 2026-06-10 | APPROVED |
| Q-FE11-005 | FE11 luôn yêu cầu FE10 phân phối liên kết thiết lập dùng một lần sau khi nguồn commit; bản triển khai đã cấu hình dùng adapter nhà cung cấp và kiểm thử dùng mock. Phân phối có thể trả về `FAILED` một cách an toàn. | Gói đánh giá 2026-06-10; tinh chỉnh ADR-005 2026-07-15 | APPROVED |
| Q-FE11-006 | Không xóa vĩnh viễn dữ liệu người dùng đã vô hiệu hóa trong Giai đoạn 1. | Gói đánh giá 2026-06-10 | APPROVED |
| Q-FE11-007 | Không có phân cấp vai trò trong Giai đoạn 1; các vai trò ngang hàng. | Gói đánh giá 2026-06-10 | APPROVED |
| Q-FE11-008 | Quản trị viên không thể xem các trường tài khoản nhạy cảm như mã băm mật khẩu, token đặt lại và token refresh. | Gói đánh giá 2026-06-10 | APPROVED |
| Q-FE11-009 | Thông báo vô hiệu hóa người dùng là công việc tùy chọn/tương lai; Giai đoạn 1 không bắt buộc thông báo. | Gói đánh giá 2026-06-10 | APPROVED |
| Q-FE11-010 | Phân phối tài khoản do quản trị viên tạo có thể thất bại an toàn sau khi nguồn commit; tài khoản vẫn `INACTIVE` cùng token thiết lập và có thể được gửi lại qua luồng đã phê duyệt. | Hiệu chỉnh của người dùng 2026-06-21; tinh chỉnh ADR-005 2026-07-15 | APPROVED |
| Q-FE11-011 | Thanh bên quản trị bao gồm Trang chủ, Trang tổng quan, Thư viện, Quản lý khoản vay, Quản lý yêu cầu, Tất cả người dùng, Đánh giá tư cách thành viên và Nhật ký kiểm tra. Đánh giá tư cách thành viên nhúng FE04 sau Tất cả người dùng; Quyền vẫn bị xóa trong khi Quản lý vai trò vẫn ở Tất cả người dùng; Xác nhận thanh toán và Xác nhận vay vẫn bị xóa. | Chỉnh sửa của người dùng 2026-07-22 | APPROVED |
| Q-FE11-012 | Nội dung Báo cáo của quản trị viên được hợp nhất vào Trang tổng quan cho nguyên mẫu này; báo cáo chi tiết vẫn là FE12. | Chỉnh sửa của người dùng 2026-06-30 | APPROVED |
| Q-FE11-013 | Quản lý yêu cầu của Quản trị viên chỉ đọc với yêu cầu đã hoàn tất và chỉ cho phép hành động với yêu cầu đang chờ/chờ xác nhận. | Hiệu chỉnh của người dùng 2026-06-30 | APPROVED |
| Q-FE11-026 | Các tác vụ Thư viện của Quản trị viên vẫn nằm trong giao diện Quản trị viên. Không gian làm việc sách được nhúng tái sử dụng FE05 thay vì điều hướng đến `/librarian/books` hoặc sao chép API thay đổi sách. | Hiệu chỉnh của người dùng 2026-07-22 | APPROVED |
| Q-FE11-014 | Tài khoản do quản trị viên tạo bắt đầu ở `INACTIVE` và chỉ trở thành `ACTIVE` sau khi hoàn tất hợp lệ thiết lập mật khẩu FE02. | Xác nhận của Nhat 2026-07-15 | APPROVED |
| Q-FE11-015 | FE11 phát hành `ACCOUNT_SETUP`; FE10 chỉ phân phối qua requester gắn với `FE11`; FE02 tiêu thụ token và kích hoạt tài khoản. | Xác nhận của Nhat 2026-07-15; ADR-005 | APPROVED |
| Q-FE11-016 | Thao tác gửi lại chỉ dành cho Quản trị viên sẽ thu hồi thông tin xác thực thiết lập trước, tạo token/event/key mới và thực thi thời gian chờ máy chủ 60 giây. | Xác nhận của Nhat 2026-07-15; ADR-005 | APPROVED |
| Q-FE11-017 | Phản hồi FE11 sử dụng danh sách cho phép `UserManagementView` rõ ràng; các trường không được chỉ định hoặc mang thông tin xác thực sẽ bị loại trừ. | Chuẩn hóa đặc tả 2026-07-17 | APPROVED |
| Q-FE11-018 | Quyết định lịch sử về đồng thời trường công việc; phần cập nhật được Q-FE11-029 thay thế trong khi vô hiệu hóa vẫn dùng `UpdatedAt`. | Chuẩn hóa đặc tả 2026-07-17; được thay thế một phần ngày 2026-07-28 | PARTIALLY SUPERSEDED |
| Q-FE11-019 | Vô hiệu hóa dùng `INACTIVE` cùng `deactivatedAt`, vô hiệu hóa thông tin xác thực một cách nguyên tử và không có luồng kích hoạt lại trong Giai đoạn 1. | Chuẩn hóa vòng đời liên tính năng 2026-07-17 | APPROVED |
| Q-FE11-020 | Thay thế vai trò Quản trị viên tuần tự hóa ánh xạ bị ảnh hưởng và số Quản trị viên đang hoạt động, để mỗi tài khoản giữ chính xác một vai trò và luôn còn ít nhất một Quản trị viên đang hoạt động. | Chuẩn hóa một vai trò 2026-07-27 | APPROVED |
| Q-FE11-021 | Đồng thời lạc quan của người dùng được quản lý hiển thị và so sánh `COALESCE(Users.UpdatedAt, Users.CreatedAt)` không null mà không cần migration điền bù. | Phê duyệt Lô hoàn thiện FE11 2026-07-19 | APPROVED |
| Q-FE11-022 | `fullName` vẫn tối đa 100 ký tự và trở thành trường do người dùng sở hữu qua FE03 sau khi tạo; `department` và `specialization` có thể null, tối đa 100 ký tự và là các trường hồ sơ người dùng hiện có duy nhất mà Quản trị viên FE11 có thể thay đổi cho mục tiêu đang là Thủ thư. | Phê duyệt Lô hoàn thiện FE11 2026-07-19; sửa đổi quyền sở hữu dữ liệu cá nhân 2026-07-22 | APPROVED |
| Q-FE11-023 | `INACTIVE` với `deactivatedAt` null nghĩa là đang chờ kích hoạt và thao tác vô hiệu hóa trả về `409 ACCOUNT_PENDING_ACTIVATION`; chỉ `deactivatedAt` khác null mới là đã vô hiệu hóa theo cách idempotent. | Phê duyệt Lô hoàn thiện FE11 2026-07-19 | APPROVED |
| Q-FE11-024 | Tạo tài khoản và gửi lại thiết lập trong FE11 đều xác thực lại Quản trị viên thực hiện đang hoạt động bên trong từng giao dịch nguồn; kiểm tra email trùng khi tạo có thẩm quyền ở giao dịch và an toàn. | Phê duyệt Lô hoàn thiện FE11 2026-07-19 | APPROVED |
| Q-FE11-025 | Các thao tác đọc yêu cầu của Quản trị viên dùng chính xác `page`, `limit`, `q`, `status`, `from`, `to`, `{ data, pagination }` và một endpoint chi tiết an toàn chuyên biệt; FE07 vẫn là chủ sở hữu duy nhất của thao tác thay đổi. | Phê duyệt Lô hoàn thiện FE11 2026-07-19 | APPROVED |
| Q-FE11-027 | Quản trị viên có thể xem nhưng không được sửa `fullName`, `phone`, `address` hoặc `email` của người dùng hiện có. FE03 sở hữu thay đổi hồ sơ cá nhân tự phục vụ; đổi email tài khoản hiện có cần luồng FE02 đã xác minh trong tương lai; FE11 chỉ có thể cập nhật `department` và `specialization` cho Thủ thư hiện tại. | Phê duyệt của người dùng 2026-07-22 | APPROVED |
| Q-FE11-028 | Quyết định lịch sử về chỉnh sửa hồ sơ được quản lý; được Q-FE11-029 thay thế. | Người dùng phê duyệt ngày 2026-07-25 | SUPERSEDED |
| Q-FE11-029 | Với tài khoản hiện có, Quản trị viên có thể xem dữ liệu an toàn nhưng chỉ được thay đổi vai trò duy nhất hoặc vô hiệu hóa tài khoản. FE11 không cung cấp thao tác Chỉnh sửa hồ sơ hoặc tuyến hồ sơ `PUT /api/users/{userId}`; việc tự sửa thuộc FE03 và email đã xác minh vẫn thuộc FE02. | Người dùng phê duyệt ngày 2026-07-28 | APPROVED |

---

## 15.1 Các quyết định thiết kế đã được phê duyệt

Các quyết định sau đã được phê duyệt trong gói đánh giá Giai đoạn 1 vào 2026-06-10 và hiện là một phần của đặc tả này.

| Quyết định | Câu trả lời được phê duyệt | Trạng thái |
| -------- | --------------- | ------ |
| Q-FE11-001 | Quản trị viên không thể tự vô hiệu hóa. | APPROVED |
| Q-FE11-002 | Ngăn vô hiệu hóa người dùng có lượt mượn đang hoạt động. | APPROVED |
| Q-FE11-003 | Thiết lập mật khẩu dùng cùng quy tắc độ phức tạp mật khẩu của FE02. | APPROVED |
| Q-FE11-004 | Email không phân biệt hoa thường khi đăng nhập và kiểm tra tính duy nhất. | APPROVED |
| Q-FE11-005 | FE11 yêu cầu FE10 phân phối liên kết thiết lập sau khi nguồn commit; kiểm thử dùng mock nhà cung cấp và cho phép thất bại an toàn. | APPROVED |
| Q-FE11-006 | Không xóa vĩnh viễn dữ liệu người dùng đã vô hiệu hóa trong Giai đoạn 1. | APPROVED |
| Q-FE11-007 | Không có phân cấp vai trò trong Giai đoạn 1; các vai trò ngang hàng. | APPROVED |
| Q-FE11-008 | Quản trị viên không thể xem các trường tài khoản nhạy cảm như mã băm mật khẩu, token đặt lại và token refresh. | APPROVED |
| Q-FE11-009 | Thông báo vô hiệu hóa người dùng là công việc tùy chọn/tương lai; Giai đoạn 1 không bắt buộc thông báo. | APPROVED |
| Q-FE11-014 | Tài khoản do quản trị viên tạo bắt đầu ở `INACTIVE` cho đến khi FE02 hoàn tất thiết lập. | APPROVED |
| Q-FE11-015 | FE11 phát hành token thiết lập, FE10 phân phối `ACCOUNT_SETUP` và FE02 tiêu thụ/kích hoạt. | APPROVED |
| Q-FE11-016 | Gửi lại thiết lập chỉ dành cho Quản trị viên, xoay token/event/key và dùng thời gian chờ 60 giây. | APPROVED |
| Q-FE11-017 | FE11 chỉ cung cấp DTO `UserManagementView` trong danh sách cho phép. | APPROVED |
| Q-FE11-018 | Phần cập nhật trường công việc lịch sử đã được thay thế; vô hiệu hóa vẫn dùng đồng thời lạc quan `UpdatedAt` với `409 STALE_USER_STATE`. | PARTIALLY SUPERSEDED |
| Q-FE11-019 | Vô hiệu hóa dùng `INACTIVE` cùng `deactivatedAt`, vô hiệu hóa thông tin xác thực một cách nguyên tử và không có luồng kích hoạt lại trong Giai đoạn 1. | APPROVED |
| Q-FE11-020 | Thay thế vai trò Quản trị viên tuần tự hóa ánh xạ bị ảnh hưởng và số Quản trị viên đang hoạt động, để mỗi tài khoản giữ chính xác một vai trò và luôn còn ít nhất một Quản trị viên đang hoạt động. | APPROVED |
| Q-FE11-021 | Cơ chế đồng thời của người dùng được quản lý dùng `COALESCE(UpdatedAt, CreatedAt)` không null. | APPROVED |
| Q-FE11-022 | `fullName` thuộc quyền sở hữu của người dùng qua FE03 sau khi tạo; FE11 chỉ sở hữu các trường công việc Thủ thư `department` và `specialization` dài 100 ký tự. | APPROVED |
| Q-FE11-023 | Đang chờ kích hoạt không phải là trạng thái vô hiệu hóa có tính idempotent. | APPROVED |
| Q-FE11-024 | Tạo/gửi lại xác thực lại Quản trị viên đang hoạt động trong giao dịch và ánh xạ email trùng một cách an toàn. | APPROVED |
| Q-FE11-025 | Thao tác đọc danh sách/chi tiết yêu cầu của Quản trị viên dùng hợp đồng hoàn thiện chuẩn, còn FE07 sở hữu các thao tác thay đổi. | APPROVED |
| Q-FE11-027 | Các trường cá nhân chỉ đọc trong FE11; FE03 sở hữu thay đổi hồ sơ tự phục vụ, FE02 sở hữu mọi thay đổi email đã xác minh trong tương lai và Quản trị viên FE11 chỉ sở hữu các trường công việc Thủ thư. | APPROVED |
| Q-FE11-028 | Quyết định lịch sử về chỉnh sửa hồ sơ được quản lý; được Q-FE11-029 thay thế. | SUPERSEDED |
| Q-FE11-029 | Thao tác của Quản trị viên đối với người dùng hiện có chỉ gồm thay thế vai trò duy nhất và vô hiệu hóa đủ điều kiện; UI và API FE11 không có chức năng chỉnh sửa hồ sơ. | APPROVED |

---

## 16. Ma trận truy vết

### Từ tiêu chí chấp nhận FE11 đến yêu cầu và kiểm thử

| ID AC | Tiêu chí chấp nhận | FR liên quan | BR liên quan | Trường hợp thử nghiệm | Trạng thái |
| ----- | -------------------- | ---------- | ---------- | --------- | ------ |
| AC-FE11-001 | Quản trị viên truy cập danh sách người dùng -> danh sách phân trang an toàn dùng giá trị mặc định/giới hạn, thứ tự ổn định, bộ lọc trạng thái/vai trò và nội dung tìm kiếm đã trim | FR-FE11-001 | BR-FE11-001, BR-FE11-010 | FE11-U01..U06; fe11-safe-user-list-detail-validation-2026-07-18.md | COMPLETE (B7) |
| AC-FE11-002 | Quản trị viên truy cập chi tiết người dùng -> trả về UserManagementView an toàn và các bản tóm tắt đã phê duyệt, loại trừ trường nhạy cảm | FR-FE11-002 | BR-FE11-001, BR-FE11-018, BR-FE11-026 | FE11-U01..U06; fe11-safe-user-list-detail-validation-2026-07-18.md | COMPLETE (B7) |
| AC-FE11-003 | Dữ liệu người dùng hợp lệ -> commit người dùng không hoạt động/vai trò/token thiết lập/nhật ký kiểm toán và yêu cầu một lần phân phối thiết lập an toàn | FR-FE11-003 | BR-FE11-002, BR-FE11-004, BR-FE11-005, BR-FE11-007, BR-FE11-021..024 | Bằng chứng nguồn/phân phối FE11-S01..S07 hiện có cùng phần gia cố tác nhân/tuyến FE11-LIFE02 đang chờ | PARTIAL |
| AC-FE11-004 | Thao tác với người dùng hiện có chỉ cung cấp thay thế vai trò/vô hiệu hóa; không có Chỉnh sửa và PUT hồ sơ đã ngừng sử dụng trả về 404 | FR-FE11-004, FR-FE11-007 | BR-FE11-014, BR-FE11-015 | `frontend/test/userManagementFrontend.test.js`; `frontend/test/adminConsoleStructure.test.js`; `backend/tests/userManagementRoutes.test.js` | COMPLETE (TỰ ĐỘNG CỤC BỘ); TRÌNH DUYỆT/CON NGƯỜI ĐANG CHỜ |
| AC-FE11-005 | Gửi email trùng khi tạo người dùng -> hệ thống từ chối kèm thông báo lỗi | FR-FE11-005 | BR-FE11-004 | `accountSetupRepository.test.js`; `userManagementService.test.js`; `userManagementRoutes.test.js`; `fe11Core.sqltest.js` | COMPLETE (TỰ ĐỘNG/SQL CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| AC-FE11-006 | Quản trị viên tạo người dùng -> không hiển thị mật khẩu/token/liên kết; tài khoản vẫn không hoạt động đến khi hoàn tất thiết lập FE02 | FR-FE11-006 | BR-FE11-005, BR-FE11-013, BR-FE11-023 | FE11-S01..S07; auth-account-setup-boundary-validation-review-2026-07-15.md | COMPLETE (B7) |
| AC-FE11-007 | Người dùng ACTIVE/LOCKED bị quản trị viên vô hiệu hóa -> trạng thái thay đổi thành INACTIVE; đang chờ kích hoạt bị từ chối | FR-FE11-008 | BR-FE11-003, BR-FE11-006, BR-FE11-010 | `userLifecycleRepository.test.js`; `userManagementService.test.js`; `fe11Core.sqltest.js` | COMPLETE (TỰ ĐỘNG/SQL CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| AC-FE11-008 | Quản trị viên cố thay đổi email người dùng hiện có qua tuyến hồ sơ đã ngừng sử dụng -> 404 và không thay đổi dữ liệu | FR-FE11-020 | BR-FE11-014 | `backend/tests/userManagementRoutes.test.js` | COMPLETE (TỰ ĐỘNG CỤC BỘ); TRÌNH DUYỆT/CON NGƯỜI ĐANG CHỜ |
| AC-FE11-009 | Người dùng có phiên hoạt động bị quản trị viên vô hiệu hóa -> phiên bị vô hiệu | FR-FE11-008 | BR-FE11-006 | `userLifecycleRepository.test.js`; `fe11Core.sqltest.js` | COMPLETE (TỰ ĐỘNG/SQL CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| AC-FE11-010 | Dữ liệu thủ thư hợp lệ -> commit thủ thư không hoạt động/vai trò/token thiết lập/nhật ký kiểm toán và yêu cầu một lần phân phối thiết lập an toàn | FR-FE11-009 | BR-FE11-002, BR-FE11-004, BR-FE11-005, BR-FE11-007, BR-FE11-015, BR-FE11-021..024 | `accountSetupRepository.test.js`; `userManagementService.test.js`; bằng chứng FE11-S01..S07 | COMPLETE (TỰ ĐỘNG CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| AC-FE11-011 | Mục tiêu Thủ thư cung cấp cùng các thao tác chỉ gồm vai trò/vô hiệu hóa và không có trình chỉnh sửa trường công việc | FR-FE11-004, FR-FE11-007 | BR-FE11-014, BR-FE11-015 | `frontend/test/userManagementFrontend.test.js` | COMPLETE (TỰ ĐỘNG CỤC BỘ); TRÌNH DUYỆT/CON NGƯỜI ĐANG CHỜ |
| AC-FE11-012 | Tài khoản thủ thư đang hoạt động bị quản trị viên vô hiệu hóa -> trạng thái đổi thành INACTIVE và các phiên bị vô hiệu | FR-FE11-011 | BR-FE11-003, BR-FE11-006, BR-FE11-010, BR-FE11-015 | `userLifecycleRepository.test.js`; `fe11Core.sqltest.js` | COMPLETE (TỰ ĐỘNG/SQL CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| AC-FE11-013 | Vai trò Thành viên được thay bằng Thủ thư -> commit chính xác một ánh xạ và nhật ký kiểm toán | FR-FE11-012 | BR-FE11-007, BR-FE11-008, BR-FE11-010 | `userRoleRepository.test.js`; `userManagementService.test.js`; `fe11Core.sqltest.js` | COMPLETE (TỰ ĐỘNG/SQL CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| AC-FE11-014 | Quản trị viên không phải người cuối cùng được thay bằng Thành viên -> vẫn còn chính xác một ánh xạ | FR-FE11-013 | BR-FE11-007, BR-FE11-010 | `userRoleRepository.test.js`; `fe11SchemaMigration.test.js`; `fe11Core.sqltest.js` | COMPLETE (TỰ ĐỘNG/SQL CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| AC-FE11-015 | Thay thế vai trò của Quản trị viên đang hoạt động cuối cùng -> bị từ chối, không thay đổi dữ liệu | FR-FE11-014 | BR-FE11-009, BR-FE11-010 | `userRoleRepository.test.js`; `userManagementService.test.js` | COMPLETE (TỰ ĐỘNG CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| AC-FE11-016 | Giao diện Quản trị viên hiển thị chính xác tám phần đã phê duyệt, Đánh giá tư cách thành viên đứng sau Tất cả người dùng, ẩn quy trình đã xóa và giữ quản lý danh mục trong khu vực Quản trị viên | FR-FE11-030 | BR-FE11-016 | `frontend/test/userManagementFrontend.test.js`, `frontend/test/adminConsoleStructure.test.js`, `frontend/test/membershipFrontend.test.js` | COMPLETE (MÃ NGUỒN/TỰ ĐỘNG CỤC BỘ); TRÌNH DUYỆT THÍCH ỨNG/AZURE/CON NGƯỜI ĐANG CHỜ |
| AC-FE11-017 | Bề mặt Quản lý người dùng/vai trò mở được ma trận quyền chỉ đọc, giữ đúng tám mục sidebar và hiển thị dữ liệu FE11 | FR-FE11-032 | BR-FE11-017 | `adminPermissionService.test.js`; `adminPermissionRoutes.test.js`; `userManagementFrontend.test.js`; `fe11-admin-request-management.spec.js` | COMPLETE (TỰ ĐỘNG/TRÌNH DUYỆT CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| AC-FE11-018 | Giao diện nhật ký kiểm toán là danh sách chỉ đọc có phân trang, không có điều khiển tìm kiếm/lọc và che các trường nhạy cảm | FR-FE11-033 | BR-FE11-018, BR-FE11-026 | FE11-AUD01; `frontend/test/userManagementFrontend.test.js`; lô hiệu chỉnh 2026-07-22 | COMPLETE |
| AC-FE11-019 | Yêu cầu đang chờ xử lý chỉ hiển thị các hành động đã được phê duyệt; yêu cầu đã hoàn thành vẫn ở chế độ chỉ xem | FR-FE11-034, FR-FE11-035 | BR-FE11-019 | FE11-REQ02/REQ03; fe11-finalization-wave-b-validation-2026-07-19.md | SẴN SÀNG ĐỂ ĐÁNH GIÁ |
| AC-FE11-020 | Lỗi phân phối thiết lập khiến tài khoản đã cam kết không hoạt động và không hiển thị thông tin xác thực | FR-FE11-037 | BR-FE11-023, BR-FE11-024 | FE11-S01..S07; auth-account-setup-boundary-validation-review-2026-07-15.md | COMPLETE (B7) |
| AC-FE11-021 | Quản trị viên đủ điều kiện gửi lại sẽ xoay token/event/key thiết lập sau thời gian chờ | FR-FE11-036 | BR-FE11-021, BR-FE11-022, BR-FE11-025 | Bằng chứng xoay/phân phối FE11-S01..S07 hiện có cùng phần xác thực lại actor FE11-LIFE02 đang chờ | PARTIAL |
| AC-FE11-022 | Gửi lại không đủ điều kiện/bị giới hạn thời gian chờ sẽ bị từ chối mà không tạo thông tin xác thực | FR-FE11-038 | BR-FE11-023, BR-FE11-025 | FE11-S01..S07; auth-account-setup-boundary-validation-review-2026-07-15.md | COMPLETE (B7) |
| AC-FE11-023 | expectedUpdatedAt cũ khi vô hiệu hóa -> 409 STALE_USER_STATE và không lưu thay đổi/bản kiểm toán thành công | FR-FE11-023 | BR-FE11-027 | `userManagementRoutes.test.js`; `userManagementService.test.js`; `userLifecycleRepository.test.js`; `fe11Core.sqltest.js` | COMPLETE (TỰ ĐỘNG/SQL CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| AC-FE11-025 | Dashboard giữ nguyên năm thẻ/ba biểu đồ, dùng đúng chủ sở hữu chuẩn và các thẻ mở mô-đun đã lọc tương ứng | FR-FE11-031 | BR-FE11-020, BR-FE11-032 | `backend/tests/adminDashboardRepository.test.js`, `frontend/test/adminConsoleStructure.test.js` | TỰ ĐỘNG CỤC BỘ; CON NGƯỜI ĐANG ĐÁNH GIÁ |
| AC-FE11-026 | Chỉ Quản trị viên truy cập quản lý tác giả/nhà xuất bản/danh mục; mutation được phép ghi audit nguyên tử và ID không tồn tại trả 404; Thủ thư vẫn dùng lựa chọn chỉ đọc của FE05 | FR-FE11-043 | BR-FE11-033 | `backend/tests/adminLibraryRoleBoundary.test.js`; `backend/tests/adminCatalogMetadataService.test.js`; `backend/tests/adminCatalogMetadataRepository.test.js`; `backend/tests/adminAuditLogService.test.js` | COMPLETE - FE11-CAT01; PR #95; CI `30711057582`; staging `30711210037` |

### Từ yêu cầu hành vi không mong muốn FE11 đến nguồn và kiểm thử

| ID FR | Hành vi không mong muốn | BR liên quan | Liên quan EC / AF / Q | Trường hợp thử nghiệm | Trạng thái |
| ----- | ----------------- | ---------- | ------------------- | --------- | ------ |
| FR-FE11-015 | Người không phải Quản trị viên cố truy cập quản lý người dùng -> bị từ chối với lỗi phân quyền | BR-FE11-001, BR-FE11-011, BR-FE11-012 | - | FE11-U01..U06 và FE11-R01..R05 phân quyền Quản trị viên trước tiên ở tuyến | COMPLETE (B7) |
| FR-FE11-016 | Hành động nhắm tới ID người dùng không tồn tại -> lỗi không tìm thấy | BR-FE11-010 | EC-FE11-002 | `userManagementRoutes.test.js`; `userManagementService.test.js`; kiểm thử repository FE11 | COMPLETE (TỰ ĐỘNG CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| FR-FE11-017 | ID Quản trị viên thực hiện không tồn tại -> lỗi không tìm thấy, không hành động | BR-FE11-001 | EC-FE11-001 | `accountSetupRepository.test.js`; `userManagementService.test.js`; `userLifecycleRepository.test.js`; `userRoleRepository.test.js`; `fe11Core.sqltest.js` | COMPLETE (TỰ ĐỘNG/SQL CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| FR-FE11-018 | Quản trị viên cố vô hiệu hóa tài khoản của mình -> bị từ chối | BR-FE11-003 | Q-FE11-001, EC-FE11-006 | `userLifecycleRepository.test.js`; `userManagementService.test.js`; `fe11Core.sqltest.js` | COMPLETE (TỰ ĐỘNG/SQL CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| FR-FE11-019 | Vô hiệu hóa người dùng có lượt mượn đang hoạt động -> bị chặn, báo cáo số lượng | BR-FE11-003 | AF-FE11-002, Q-FE11-002 | `userLifecycleRepository.test.js`; `userManagementService.test.js`; `fe11Core.sqltest.js` | COMPLETE (TỰ ĐỘNG/SQL CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| FR-FE11-020 | Quản trị viên gọi tuyến hồ sơ tài khoản hiện có đã ngừng sử dụng -> 404 và không thay đổi dữ liệu | BR-FE11-014 | Q-FE11-029 | `backend/tests/userManagementRoutes.test.js` | COMPLETE (TỰ ĐỘNG CỤC BỘ); TRÌNH DUYỆT/CON NGƯỜI ĐANG CHỜ |
| FR-FE11-021 | Email tạo tài khoản sai định dạng/chứa payload injection/quá dài -> được làm sạch và bị từ chối | BR-FE11-004 | EC-FE11-003, EC-FE11-004 | `userManagementRoutes.test.js`; `userManagementService.test.js` | COMPLETE (TỰ ĐỘNG CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| FR-FE11-022 | Lỗi DB khi tạo người dùng -> rollback, không có bản ghi một phần | BR-FE11-010 | EC-FE11-008 | Phạm vi rollback khi tạo tài khoản FE11-S01..S07 | COMPLETE (B7) |
| FR-FE11-023 | expectedUpdatedAt cũ khi vô hiệu hóa -> 409 STALE_USER_STATE, không cập nhật một phần | BR-FE11-027 | EC-FE11-007 | `userManagementRoutes.test.js`; `userManagementService.test.js`; `userLifecycleRepository.test.js`; `fe11Core.sqltest.js` | COMPLETE (TỰ ĐỘNG/SQL CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| FR-FE11-024 | Gán vai trò không tồn tại -> lỗi không tìm thấy, ánh xạ không đổi | BR-FE11-007 | EC-FE11-010 | FE11-R01..R05 bao phủ kết quả vai trò xác định | COMPLETE (B7) |
| FR-FE11-025 | Chọn lại vai trò duy nhất hiện tại -> trả DTO an toàn chuẩn như no-op lũy đẳng, không thay mapping/token/audit | BR-FE11-008 | EC-FE11-011, BD-003 | `userRoleRepository.test.js`; `userManagementService.test.js`; `fe11Core.sqltest.js` | COMPLETE (TỰ ĐỘNG/SQL CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| FR-FE11-026 | Tài khoản legacy có zero/multiple mapping -> thao tác thay thế hợp lệ chuẩn hóa thành đúng một mapping trong giao dịch | BR-FE11-007 | EC-FE11-012, BD-004 | `userRoleRepository.test.js`; `fe11Core.sqltest.js` | COMPLETE (TỰ ĐỘNG/SQL CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| FR-FE11-027 | Thay thế vai trò phải để lại đúng một mapping và `UX_UserRoles_UserId` từ chối mapping thứ hai | BR-FE11-007 | EC-FE11-013, BD-004 | `userRoleRepository.test.js`; `fe11SchemaMigration.test.js`; `fe11Core.sqltest.js` | COMPLETE (TỰ ĐỘNG/SQL CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| FR-FE11-028 | Bất kỳ payload hồ sơ nào được gửi tới đường dẫn PUT FE11 đã ngừng sử dụng -> 404 và không ghi repository | BR-FE11-014, BR-FE11-015 | EC-FE11-014, Q-FE11-029 | `backend/tests/userManagementRoutes.test.js` | COMPLETE (TỰ ĐỘNG CỤC BỘ) |
| FR-FE11-029 | Token thiết lập mật khẩu đã hết hạn/đã dùng -> bị từ chối, đăng nhập không được kích hoạt | BR-FE11-013 | phần trường token 10.2 | FE11-S01..S07 bao phủ token thiết lập không hợp lệ, hết hạn, đã dùng, đã thu hồi và không đủ điều kiện | COMPLETE (B7) |
| FR-FE11-030 | Hiển thị khung Quản trị viên gồm tám mục đã phê duyệt, ẩn mục đã xóa, Đánh giá tư cách thành viên đứng sau Tất cả người dùng và các hành động Thư viện của Quản trị viên vẫn ở khu vực Quản trị viên | BR-FE11-016 | Q-FE11-011, Q-FE11-026, EC-FE11-016 | `frontend/test/userManagementFrontend.test.js`, `frontend/test/adminConsoleStructure.test.js`, `frontend/test/membershipFrontend.test.js` | COMPLETE (MÃ NGUỒN/TỰ ĐỘNG CỤC BỘ); TRÌNH DUYỆT THÍCH ỨNG/AZURE/CON NGƯỜI ĐANG CHỜ |
| FR-FE11-031 | Dashboard Quản trị viên hiển thị bản tóm tắt vai trò/quy trình chuẩn và mở các mô-đun đã lọc của đúng chủ sở hữu | BR-FE11-020, BR-FE11-032 | Q-FE11-012, MF-FE11-010 | `backend/tests/adminDashboardRepository.test.js`, `frontend/test/adminConsoleStructure.test.js` | TỰ ĐỘNG CỤC BỘ; CON NGƯỜI ĐANG ĐÁNH GIÁ |
| FR-FE11-032 | Bề mặt Quản lý người dùng/vai trò mở ma trận quyền chỉ đọc mà không thêm mục sidebar thứ chín | BR-FE11-017 | MF-FE11-011, BD-005 | `adminPermissionService.test.js`; `adminPermissionRoutes.test.js`; `userManagementFrontend.test.js`; `fe11-admin-request-management.spec.js` | COMPLETE (TỰ ĐỘNG/TRÌNH DUYỆT CỤC BỘ); STAGING HẬU MERGE ĐANG CHỜ |
| FR-FE11-033 | Nhật ký kiểm toán là danh sách chỉ đọc có phân trang, không có điều khiển tìm kiếm/lọc trên UI và đã che dữ liệu nhạy cảm | BR-FE11-018, BR-FE11-026 | EC-FE11-018 | FE11-AUD01; `frontend/test/userManagementFrontend.test.js`; lô hiệu chỉnh 2026-07-22 | COMPLETE |
| FR-FE11-034 | Danh sách/chi tiết Quản lý yêu cầu hỗ trợ tìm kiếm/lọc/xuất/xem | BR-FE11-019 | MF-FE11-013 | FE11-REQ01/REQ02; xác thực Wave B | SẴN SÀNG ĐỂ ĐÁNH GIÁ |
| FR-FE11-035 | Hành động trên yêu cầu đã hoàn tất bị vô hiệu hóa/từ chối | BR-FE11-019 | Q-FE11-013, EC-FE11-017 | FE11-REQ03; xác thực Wave B | SẴN SÀNG ĐỂ ĐÁNH GIÁ |
| FR-FE11-037 | Lỗi phân phối thiết lập FE10 giữ nguyên trạng thái nguồn không hoạt động và trả về trạng thái an toàn | BR-FE11-023, BR-FE11-024 | EC-FE11-019, Q-FE11-015 | FE11-S01..S07 bao phủ lỗi phân phối an toàn và điều kiện/thời gian chờ gửi lại | COMPLETE (B7) |
| FR-FE11-038 | Gửi lại thiết lập không đủ điều kiện hoặc bị giới hạn thời gian chờ không tạo thông tin xác thực | BR-FE11-025 | EC-FE11-020, EC-FE11-021, Q-FE11-016 | FE11-S01..S07 bao phủ lỗi phân phối an toàn và điều kiện/thời gian chờ gửi lại | COMPLETE (B7) |
| FR-FE11-043 | Ranh giới role metadata và mutation/audit nguyên tử | BR-FE11-033 | AC-FE11-026 | FE11-CAT01 và các kiểm thử metadata Admin tập trung | COMPLETE - FE11-CAT01; PR #95; CI `30711057582`; staging `30711210037` |

### Tóm tắt độ bao phủ (FE11)

- **Tổng số AC**: 26 (AC-FE11-001 đến AC-FE11-026).
- **Tổng số FR**: 43 (FR-FE11-001 đến FR-FE11-043).
- **Tổng số BR**: 33 (BR-FE11-001 đến BR-FE11-033).
- **Kiểm thử theo bài tập**: FT50 đến FT58 vẫn là đường cơ sở bên ngoài; bắt buộc có kiểm thử service/tích hợp tập trung cho thiết lập tài khoản trước khi có thể kết thúc triển khai.

### Truy vết bài tập bên ngoài (ID UC trong Excel)

| ID UC bài tập | Use Case trong Excel | Luồng chính / Yêu cầu liên quan | Kiểm thử liên quan |
| ---------------- | -------------- | ------------------------------- | ------------ |
| UC49 | Xem danh sách người dùng | MF-FE11-001; FR-FE11-001 | FT50 |
| UC50 | Xem thông tin người dùng | MF-FE11-002; FR-FE11-002 | FT51 |
| UC51 | Tạo tài khoản người dùng | MF-FE11-003; FR-FE11-003, FR-FE11-005, FR-FE11-006 | FT52 |
| UC52 | Cập nhật thông tin người dùng | Được phân bổ lại: FE03 sở hữu thay đổi cá nhân tự phục vụ của người dùng; FE11 thực thi ranh giới chỉ đọc của Quản trị viên qua MF-FE11-004, FR-FE11-004, FR-FE11-007, FR-FE11-020 | FT53 được phân bổ lại; FE11-PDO01..PDO04 |
| UC53 | Vô hiệu hóa tài khoản người dùng | MF-FE11-005; FR-FE11-008 | FT54 |
| UC54 | Tạo tài khoản thủ thư | MF-FE11-006; FR-FE11-009 | FT55 |
| UC55 | Cập nhật thông tin công việc Thủ thư | Được Q-FE11-029 phân bổ lại/đưa ra ngoài phạm vi tài khoản hiện có của FE11; không có trình chỉnh sửa hoặc tuyến hồ sơ/trường công việc cho Quản trị viên | FT56 được phân bổ lại cho kiểm thử hồi quy ranh giới |
| UC56 | Vô hiệu hóa tài khoản thủ thư | MF-FE11-008; FR-FE11-011 | FT57 |
| UC57 | Quản lý vai trò | MF-FE11-009; FR-FE11-012 đến FR-FE11-014 | FT58 |

---

## 17. Danh sách kiểm tra rà soát

Tất cả quyết định trong phần 15.1 đã được phê duyệt trong gói đánh giá Giai đoạn 1 vào 2026-06-10.

Danh sách kiểm tra phê duyệt Giai đoạn 1 (hoàn tất vào 2026-06-10):

- [x] Đã ghi nhận các quyết định được phê duyệt: tất cả quyết định đề xuất trong Phần 15.1 (Quản trị viên tự vô hiệu hóa, xử lý lượt mượn đang hoạt động, email không phân biệt hoa thường, lưu giữ dữ liệu đã vô hiệu hóa, phân cấp vai trò, thông báo vô hiệu hóa) đều được Nhóm/Chủ sở hữu phê duyệt rõ ràng.
- [x] Các quyết định bảo mật (Q-FE11-005: thiết lập mật khẩu dựa trên token, Q-FE11-008: Quản trị viên không bao giờ thấy mã băm mật khẩu hoặc token) được Bảo mật/Kiến trúc sư rà soát và phê duyệt.
- [x] Q-FE11-009 (thông báo vô hiệu hóa) được đánh dấu rõ là "Ngoài phạm vi Giai đoạn 1" hoặc chuyển sang kế hoạch tương lai.
- [x] Yêu cầu độ phức tạp của mật khẩu được phê duyệt.
- [x] Chính sách vô hiệu hóa Quản trị viên được làm rõ.
- [x] Phân biệt chữ hoa chữ thường cho tính duy nhất của email được quyết định.
- [x] Đã xác nhận các vai trò ngang hàng, loại trừ lẫn nhau và mỗi tài khoản có chính xác một vai trò.
- [x] Chính sách lưu giữ dữ liệu người dùng sau khi hủy kích hoạt được xác định.
- [x] Lược đồ cơ sở dữ liệu cho Users, Roles, UserRoles và `Users.DeactivatedAt` có thể null được xác nhận bằng migration hoàn thiện FE11 đã merge và bằng chứng thoát Giai đoạn 2.
- [x] Hợp đồng API được phê duyệt trong SPEC.md này hoặc được sao chép sang tệp hợp đồng API dùng chung chuyên biệt nếu nhóm tạo lại tệp đó.
- [x] Các phần phụ thuộc FE02, FE03 được kiểm tra xung đột.
- [x] Quyền sở hữu dữ liệu cá nhân đã được phê duyệt: FE03 sở hữu `fullName`/`phone`/`address` tự phục vụ, FE02 sở hữu mọi thay đổi email đã xác minh trong tương lai và thay đổi tài khoản hiện có của Quản trị viên FE11 chỉ gồm thay thế vai trò và vô hiệu hóa đủ điều kiện.
- [x] Mọi tiêu chí chấp nhận đều có thể trở thành một bài kiểm tra.
- [x] Các yêu cầu bảo mật (chi phí bcrypt, ngăn chặn tiêm SQL) đã được xem xét.
## Hiệu chỉnh giao diện quản trị 2026-07-22

- Giao diện Quản trị viên tái sử dụng `app-shell`, header trên cùng, thanh bên thích ứng, cách thể hiện thương hiệu và thành phần điều hướng dùng chung với trang Thành viên và Thủ thư.
- Nhật ký kiểm toán hiển thị trực tiếp danh sách hoạt động chỉ đọc có phân trang; UI Quản trị viên không hiển thị điều khiển tìm kiếm hoặc lọc.
- Quản lý người dùng của Quản trị viên tập trung vào xem/tạo/vai trò/vô hiệu hóa; nút sửa thông tin người dùng không xuất hiện trong hàng/chi tiết và không còn tuyến tương thích cập nhật hồ sơ ở backend.
- Bảng Nhật ký kiểm toán chỉ hiển thị Hành động, Tác nhân, Mục tiêu, IP và Thời gian. Phép chiếu chi tiết an toàn vẫn là ranh giới bảo mật backend nhưng không được hiển thị thành cột bổ sung.
- Bảng Quản trị viên rộng được cuộn trong vùng nội dung riêng và không được buộc toàn bộ giao diện cuộn ngang.
