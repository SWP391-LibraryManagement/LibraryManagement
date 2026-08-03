# SPEC.md - Quản lý thành viên FE04

# Phiên bản: 0.3.6

# Trạng thái: ĐÃ PHÊ DUYỆT - BASELINE 2026-07-17

# Chủ sở hữu: Dat

# Cập nhật lần cuối: 2026-08-03

# ID tính năng: FE04

# Thư mục tính năng: `.sdd/specs/feat-membership-management/`

> Trạng thái phân phối hiện tại (2026-08-03): `COMPLETE` cho phạm vi cốt lõi đã phê duyệt;
> phần mở rộng Admin Console đã vượt qua kiểm thử local và acceptance Azure Staging trên
> `850b01b`, H2 vòng 1 và H3 vòng 1 đã được phê duyệt. Nghiệm thu thủ công/xác nhận
> owner FE04 được chấp nhận tại [PR #107 H3 round 1](https://github.com/SWP391-LibraryManagement/LibraryManagement/pull/107#issuecomment-5162255705).
> Implementation State là `COMPLETE`; amendment PR C vẫn cần H2 vòng 2, CI exact-head và H3 cuối trước merge.

> Nguồn sự thật cho Quản lý thành viên FE04. Bản sửa đổi v0.2.2 đồng bộ quy trình đã được phê duyệt với baseline mã hiện tại mà không mở rộng phạm vi triển khai.

> Lớp trình bày bổ sung được phê duyệt vào 2026-07-22: Quản trị viên đã xác thực có một phần review FE04 nhúng trong Bảng điều khiển quản trị. Không gian làm việc `/membership` hiện có của Thành viên/Thủ thư, API FE04, máy trạng thái, lược đồ, phân quyền, audit và các hợp đồng thông báo đều không thay đổi. Xem `docs/superpowers/specs/2026-07-22-admin-membership-review-integration-design.md`.
>
> Phần cốt lõi của Giai đoạn 2 đã hoàn tất. Lớp bổ sung cho Bảng điều khiển quản trị đã được phê duyệt và triển khai
> cho `FR-FE04-014` và `AC-FE04-013`; kiểm thử trình duyệt local thoát sạch và run staging
> `lms-fe04-acceptance-20260803-90ac1d5b` đã chứng minh từ chối, nộp lại, phê duyệt,
> phân quyền server, bốn viewport và cleanup. H3 vòng 1 đã chấp nhận bằng chứng thủ công/owner;
> không còn hành vi FE04 nào thiếu trong phạm vi đã phê duyệt. Mức truy vết nguồn hiện tại là `14/14 FR`.

---

## 1. Tổng quan về tính năng

### 1.1 Tên tính năng

Quản lý thành viên

### 1.2 Bối cảnh kinh doanh

Thư viện lưu giữ đơn đăng ký thành viên tùy chọn và hồ sơ đánh giá để theo dõi hành chính. Ủy quyền vay và đặt trước thuộc sở hữu của FE07/FE08 và dựa trên một tài khoản đang hoạt động có vai trò `MEMBER`; Phê duyệt FE04 không phải là điều kiện tiên quyết cho những quy trình công việc đó.

Quản lý thành viên cung cấp quy trình đăng ký và đánh giá. Nó phải tách biệt với việc tạo tài khoản và phân công vai trò để việc xác thực và ủy quyền vẫn rõ ràng.

### 1.3 Mục tiêu / Kết quả

Hệ thống sẽ:

- Cho phép người dùng được xác thực với vai trò `MEMBER` đăng ký làm thành viên.
- Cho phép Thủ thư/Quản trị viên được phân quyền phê duyệt đơn đăng ký thành viên.
- Cho phép Thủ thư/Quản trị viên được phân quyền từ chối đơn đăng ký thành viên.
- Cho phép người dùng xem trạng thái thành viên của riêng họ.
- Duy trì trạng thái ứng dụng thành viên có thể theo dõi mà không thay đổi ủy quyền vai trò FE07/FE08.

### 1.4 Mức độ phạm vi

- [ ] Đặc tả đầy đủ - logic nghiệp vụ cốt lõi, rủi ro cao, phải đúng ngay từ đầu
- [x] Đặc tả tiêu chuẩn - tính năng thông thường, có quy tắc nghiệp vụ và bước xác thực dữ liệu
- [ ] Đặc tả rút gọn - UI đơn giản, tài liệu hoặc tính năng ít rủi ro

---

## 2. Tác nhân và quyền

| Tác nhân | Mô tả | Quyền/Trách nhiệm |
| ----- | ----------- | --------------------------- |
| Khách | Khách truy cập chưa được xác thực | Không được truy cập đơn đăng ký thành viên; trước tiên phải đăng ký/đăng nhập tài khoản. |
| Người nộp đơn thành viên | Người dùng được xác thực với vai trò `MEMBER` đang đăng ký làm thành viên | Gửi đơn đăng ký thành viên và xem trạng thái thành viên của riêng bạn. |
| Thành viên | Người dùng đã xác thực với vai trò `MEMBER` | Sử dụng FE07/FE08 khi tài khoản đang hoạt động; có thể tùy chọn xem/đăng ký trạng thái thành viên FE04. |
| Thủ thư | Nhân viên thư viện | Xem xét, phê duyệt hoặc từ chối đơn đăng ký thành viên. |
| Quản trị viên | Quản trị viên hệ thống | Có quyền đánh giá thành viên. |
| Dịch vụ thông báo | Tính năng nội bộ | Nhận yêu cầu `MEMBERSHIP_RESULT` an toàn sau khi thao tác phê duyệt/từ chối commit, nếu requester FE04 đã được cấu hình. |

---

## 3. Điều kiện tiên quyết

Tính năng này chỉ có thể bắt đầu khi:

- PRE-FE04-001: Người dùng đã có tài khoản trong `Users`.
- PRE-FE04-002: Tác nhân được xác thực cho các hành động thành viên được bảo vệ.
- PRE-FE04-003: Tài khoản người dùng có `Users.Status = ACTIVE`; Tài khoản `INACTIVE` và `LOCKED` không thể áp dụng.
- PRE-FE04-004: Người dùng không có tư cách thành viên được phê duyệt cũng như không có đơn đăng ký đang chờ xử lý; người dùng có tư cách thành viên chuẩn là `REJECTED` có thể tạo một ứng dụng `PENDING` mới theo BR-FE04-016.
- PRE-FE04-005: Tác nhân phê duyệt/từ chối có quyền Thủ thư hoặc Quản trị viên theo FE11.
- PRE-FE04-006: Trước khi đăng ký, hồ sơ thành viên chứa `fullName`, `phone`, `dateOfBirth` và `address` không trống; avatar vẫn là tùy chọn.

---

## 4. Luồng chính

### MF-FE04-001: Đăng ký thành viên

1. Người dùng được xác thực với vai trò `MEMBER` sẽ mở đơn đăng ký thành viên.
2. Hệ thống kiểm tra xem người dùng có đủ điều kiện đăng ký hay không và đã hoàn thành các trường hồ sơ cá nhân bắt buộc.
3. Người dùng gửi đơn đăng ký.
4. Hệ thống xác nhận các quy tắc trùng lặp và trạng thái.
5. Trong một giao dịch, hệ thống tạo bản ghi `MembershipApplications` với trạng thái `PENDING` và tạo/cập nhật phép chiếu `Members` chuẩn của người dùng thành `PENDING`.
6. Trong cùng giao dịch, hệ thống ghi mục audit của đơn đăng ký trước khi commit phép chiếu đơn đăng ký/thành viên.
7. Hệ thống lưu giữ tất cả các bản ghi ứng dụng trước đó dưới dạng lịch sử bất biến và hiển thị trạng thái đang chờ xử lý cho người dùng.

### MF-FE04-002: Phê duyệt đơn đăng ký thành viên

1. Thủ thư/Quản trị viên mở các đơn đăng ký thành viên đang chờ xử lý từ không gian làm việc chuẩn của nhân viên hoặc phần review nhúng trong Bảng điều khiển quản trị.
2. Thủ thư/Quản trị viên xem xét thông tin người nộp đơn.
3. Thủ thư/Quản trị viên chọn phê duyệt.
4. Hệ thống xác minh ứng dụng vẫn là `PENDING`.
5. Trong một giao dịch, hệ thống cập nhật đơn đăng ký thành `APPROVED`, lưu `MembershipApplications.ApprovedAt` và người review, cập nhật `Members.Status` chuẩn thành `APPROVED` và lưu cùng dấu thời gian máy chủ vào `Members.ApprovedAt`.
6. Giao dịch ghi mục audit review trước khi commit; sau đó, nếu requester đã được cấu hình, hệ thống yêu cầu một thông báo FE10 không chặn với `type = GENERAL_SYSTEM`, `templateKey = MEMBERSHIP_RESULT` và ngữ cảnh nguồn gắn với FE04. Lỗi gửi không hoàn tác quyết định phê duyệt.

### MF-FE04-003: Từ chối đơn đăng ký thành viên

1. Thủ thư/Quản trị viên mở một đơn đăng ký thành viên đang chờ xử lý.
2. Thủ thư/Quản trị viên nhập lý do từ chối.
3. Thủ thư/Quản trị viên chọn từ chối.
4. Hệ thống xác minh ứng dụng vẫn là `PENDING`.
5. Trong một giao dịch, hệ thống cập nhật đơn đăng ký thành `REJECTED`, lưu người review và lý do từ chối bắt buộc, cập nhật `Members.Status` chuẩn thành `REJECTED` và giữ `Members.ApprovedAt = null`.
6. Giao dịch ghi mục audit review trước khi commit; sau đó, nếu requester đã được cấu hình, hệ thống yêu cầu một thông báo FE10 không chặn với `type = GENERAL_SYSTEM`, `templateKey = MEMBERSHIP_RESULT` và ngữ cảnh nguồn gắn với FE04. Lỗi gửi không hoàn tác quyết định từ chối.

### MF-FE04-004: Xem trạng thái thành viên

1. Người dùng được xác thực sẽ mở trang trạng thái thành viên.
2. Nếu có hàng `Members`, hệ thống tải trạng thái thành viên chuẩn từ đó và tải đơn đăng ký hiện tại/gần nhất từ `MembershipApplications`, được sắp xếp theo `AppliedAt DESC, ApplicationId DESC`.
3. Hệ thống suy ra `membershipStatusView`: `NONE` khi không có hàng thành viên/đơn đăng ký; nếu có thì dùng giá trị `Members.Status` chuẩn (`PENDING`, `APPROVED`, `REJECTED` hoặc `INACTIVE`). Tư cách thành viên không hết hạn trong Giai đoạn 1.
4. Hệ thống không tiết lộ trạng thái thành viên của người dùng khác.

---

## 5. Luồng thay thế

### AF-FE04-001: Đơn đăng ký trùng lặp đang chờ xử lý

1. Người dùng đã có một ứng dụng đang chờ xử lý.
2. Người dùng gửi một ứng dụng khác.
3. Hệ thống từ chối trùng lặp và trả về trạng thái hiện tại.

### AF-FE04-002: Thành viên đã được phê duyệt

1. Người dùng đã được phê duyệt thành viên.
2. Người dùng cố gắng đăng ký lại.
3. Hệ thống từ chối ứng dụng mới vì renewal/expiry nằm ngoài Giai đoạn 1.

### AF-FE04-003: Hành động đánh giá trái phép

1. Thành viên hoặc khách cố gắng truy cập approve/reject một ứng dụng.
2. Hệ thống kiểm tra quyền của vai trò.
3. Hệ thống từ chối hành động.

### AF-FE04-004: Trạng thái ứng dụng đã thay đổi trước khi xem xét

1. Thủ thư mở một ứng dụng đang chờ xử lý.
2. Một tác nhân được phân quyền khác phê duyệt/từ chối trước.
3. Hệ thống kiểm tra lại trạng thái trước khi lưu.
4. Hành động thứ hai bị từ chối vì trạng thái không hợp lệ.

---

## 6. Quy tắc kinh doanh

Sử dụng các ID ổn định này cho các nhiệm vụ và bài kiểm tra.

- BR-FE04-001: Khách không thể đăng ký làm thành viên cho đến khi được xác thực với vai trò `MEMBER`.
- BR-FE04-002: Chỉ những người dùng được xác thực có vai trò `MEMBER` và `Users.Status = ACTIVE` mới có thể đăng ký.
- BR-FE04-003: Một người dùng không thể có nhiều đơn đăng ký thành viên đang chờ xử lý.
- BR-FE04-004: Người dùng có `Members.Status = APPROVED` không thể gửi đơn đăng ký khác trong Giai đoạn 1.
- BR-FE04-005: Ứng dụng mới phải bắt đầu với trạng thái `PENDING`.
- BR-FE04-006: Chỉ Thủ thư/Quản trị viên mới được phê duyệt đơn đăng ký thành viên.
- BR-FE04-007: Chỉ Thủ thư/Quản trị viên mới được từ chối đơn đăng ký thành viên.
- BR-FE04-008: Chỉ các ứng dụng `PENDING` mới có thể được phê duyệt hoặc từ chối.
- BR-FE04-009: Phê duyệt phải ghi lại dấu thời gian phê duyệt.
- BR-FE04-010: Việc từ chối phải ghi lại lý do không trống, dài tối đa 500 ký tự.
- BR-FE04-011: Người dùng được xác thực với vai trò `MEMBER` chỉ có thể xem trạng thái thành viên của chính họ.
- BR-FE04-012: Trạng thái thành viên phải có sẵn để kiểm tra tính đủ điều kiện của FE07 và FE08.
- BR-FE04-013: Hành động phê duyệt/từ chối phải truy vết được.
- BR-FE04-014: `Members.Status` là nguồn chuẩn về điều kiện thành viên cho FE07/FE08; `MembershipApplications` là lịch sử đơn đăng ký/review bất biến.
- BR-FE04-015: Kết quả tạo/review đơn đăng ký, phép chiếu thành viên chuẩn và mục audit tương ứng phải commit nguyên tử; lỗi audit phải rollback giao dịch thành viên.
- BR-FE04-016: Người dùng bị từ chối có thể đăng ký lại; đơn mới bắt đầu ở `PENDING`, các đơn trước đó không thay đổi và phép chiếu thành viên chuẩn trở về `PENDING`.
- BR-FE04-017: Tư cách thành viên không hết hạn trong Giai đoạn 1; `EXPIRED` không phải trạng thái đơn đăng ký/thành viên hợp lệ.
- BR-FE04-018: Sau khi thao tác phê duyệt/từ chối commit và ghi log audit thành công, nếu requester đã được cấu hình thì FE04 yêu cầu một thông báo FE10 với `type = GENERAL_SYSTEM`, `templateKey = MEMBERSHIP_RESULT`, siêu dữ liệu nguồn của đơn đăng ký và khóa idempotency `FE04:MEMBERSHIP_RESULT:<applicationId>:<finalStatus>`; lỗi thông báo không chặn và không được thay đổi quyết định thành viên.
- BR-FE04-019: Đơn đăng ký thành viên yêu cầu `fullName`, `phone`, `dateOfBirth` và `address` không trống từ hồ sơ FE03 của người dùng đã xác thực; hình đại diện là tùy chọn và FE04 phải từ chối hồ sơ chưa đầy đủ trước khi tạo đơn đăng ký hoặc phép chiếu thành viên.

---

## 7. Yêu cầu chức năng

- FR-FE04-001: Khi `MEMBER` được xác thực đủ điều kiện đăng ký làm thành viên, hệ thống sẽ tạo một ứng dụng đang chờ xử lý.
- FR-FE04-002: Nếu người dùng đã có ứng dụng đang chờ xử lý thì hệ thống sẽ từ chối ứng dụng trùng lặp.
- FR-FE04-003: Nếu người dùng đã có `Members.Status = APPROVED` chuẩn thì hệ thống sẽ từ chối ứng dụng mới vì Giai đoạn 1 không có luồng expiry/renewal.
- FR-FE04-004: Khi Thủ thư/Quản trị viên phê duyệt một đơn đăng ký đang chờ xử lý, hệ thống phải đánh dấu cả hai phép chiếu là đã phê duyệt, đặt `MembershipApplications.ApprovedAt` và `Members.ApprovedAt` bằng cùng một dấu thời gian máy chủ và ghi nhận người review.
- FR-FE04-005: Khi Thủ thư/Quản trị viên từ chối một đơn đăng ký đang chờ xử lý, hệ thống phải đánh dấu đơn đó là bị từ chối.
- FR-FE04-006: Nếu một tác nhân không được phân quyền thử phê duyệt/từ chối thì hệ thống phải từ chối truy cập.
- FR-FE04-007: Khi người dùng `MEMBER` đã xác thực xem trạng thái thành viên, hệ thống chỉ được trả về các trường trạng thái tất định của người đó, trạng thái thành viên chuẩn nếu có và đơn đăng ký hiện tại/gần nhất; người dùng không có hàng thành viên/đơn đăng ký nhận `membershipStatusView = NONE`.
- FR-FE04-008: Nếu ứng dụng không ở trạng thái chờ xử lý thì hệ thống sẽ từ chối các thay đổi trạng thái approve/reject.
- FR-FE04-009: FE04 phải cung cấp trạng thái đơn đăng ký/thành viên của mình cho mục đích quản trị, nhưng FE07/FE08 phải phân quyền tài khoản `MEMBER` đang hoạt động độc lập với trạng thái đó.
- FR-FE04-010: Khi người dùng bị từ chối đăng ký lại, hệ thống sẽ tạo một ứng dụng mới đang chờ xử lý, lưu giữ lịch sử trước đó và thiết lập `Members.Status = PENDING` nguyên tử.
- FR-FE04-011: Khi phê duyệt/từ chối thành công, hệ thống phải cập nhật đơn đăng ký, phép chiếu thành viên chuẩn, siêu dữ liệu người review, dấu thời gian quyết định và mục audit tương ứng trong một giao dịch; phê duyệt dùng cùng một dấu thời gian cho cả hai trường `ApprovedAt`, còn từ chối giữ `Members.ApprovedAt = null`. Bất kỳ lỗi nào cũng phải rollback giao dịch.
- FR-FE04-012: Khi phê duyệt/từ chối đã commit và ghi log audit thành công, nếu requester gắn với FE04 đã được cấu hình thì hệ thống phải yêu cầu một lần gửi FE10 có tính idempotent với `type = GENERAL_SYSTEM` và `templateKey = MEMBERSHIP_RESULT`, sau đó trả về trạng thái gửi an toàn mà không hoàn tác quyết định nếu gửi thất bại.
- FR-FE04-013: Khi thành viên gửi đơn đăng ký làm thành viên, hệ thống sẽ xác minh `fullName`, `phone`, `dateOfBirth` và `address` trên máy chủ và từ chối yêu cầu kèm theo tên trường bị thiếu nếu bất kỳ trường bắt buộc nào trống hoặc không có.
- FR-FE04-014: Khi Quản trị viên đã xác thực chọn Review tư cách thành viên trong Bảng điều khiển quản trị, hệ thống phải hiển thị quy trình chuẩn của FE04 gồm danh sách, bộ lọc, phân trang, phê duyệt và từ chối bên trong khung quản trị, không tạo bí danh API riêng cho Quản trị viên và không thay đổi không gian làm việc `/membership` hiện có của Thành viên/Thủ thư.

---

## 8. Tiêu chí chấp nhận

- AC-FE04-001: Với `MEMBER` được xác thực đủ điều kiện và không có tư cách thành viên pending/approved, khi người dùng đăng ký, ứng dụng `PENDING` sẽ được tạo.
- AC-FE04-002: Cho trước người dùng đã có đơn đăng ký đang chờ xử lý, khi người dùng đăng ký lại thì hệ thống từ chối đơn trùng lặp.
- AC-FE04-003: Cho trước một đơn đăng ký đang chờ xử lý, khi Thủ thư/Quản trị viên phê duyệt thì đơn đăng ký và `Members.Status` trở thành `APPROVED`, `MembershipApplications.ApprovedAt` bằng `Members.ApprovedAt`, siêu dữ liệu người review/phê duyệt được commit nguyên tử và, nếu đã cấu hình, hệ thống thử một yêu cầu FE10 không chặn sau commit.
- AC-FE04-004: Cho trước một đơn đăng ký đang chờ xử lý và lý do không trống, khi Thủ thư/Quản trị viên từ chối thì đơn đăng ký và `Members.Status` trở thành `REJECTED`, `Members.ApprovedAt` vẫn null, siêu dữ liệu lý do/người review được commit nguyên tử và, nếu đã cấu hình, hệ thống thử một yêu cầu FE10 không chặn sau commit.
- AC-FE04-005: Khi một thành viên cố gắng phê duyệt một ứng dụng, khi yêu cầu được xử lý thì quyền truy cập sẽ bị từ chối.
- AC-FE04-006: Cho trước một đơn đã được phê duyệt hoặc từ chối, khi thử phê duyệt/từ chối lại thì hệ thống từ chối chuyển đổi trạng thái không hợp lệ.
- AC-FE04-007: Cho trước người dùng `MEMBER` đã xác thực, khi xem trạng thái thành viên thì hệ thống chỉ trả về dữ liệu của người đó; người dùng không có hàng thành viên/đơn đăng ký nhận `membershipStatusView = NONE`, `memberStatus = null` và `currentApplication = null`.
- AC-FE04-008: Cho trước một Khách, khi xem trạng thái thành viên hoặc đăng ký thì hệ thống yêu cầu xác thực.
- AC-FE04-009: Với người dùng bị từ chối không có ứng dụng đang chờ xử lý, khi người dùng đăng ký lại, ứng dụng `PENDING` mới sẽ được tạo, lịch sử trước đó không thay đổi và `Members.Status` trở thành `PENDING`.
- AC-FE04-010: Cho trước việc gửi FE10 thất bại sau khi quyết định review đã commit, quyết định về đơn đăng ký/thành viên vẫn được giữ nguyên và phản hồi chỉ cung cấp `notificationStatus` an toàn.
- AC-FE04-011: Với một tài khoản đang hoạt động với vai trò `MEMBER`, tính đủ điều kiện của FE07/FE08 không bị chặn bởi trạng thái `NONE`, `PENDING`, `REJECTED` hoặc `INACTIVE` FE04.
- AC-FE04-012: Cho trước một Thành viên đủ điều kiện nhưng hồ sơ cá nhân chưa đầy đủ, khi Thành viên đăng ký thì API trả về `400 MEMBERSHIP_PROFILE_INCOMPLETE` kèm tên các trường bị thiếu, không tạo đơn đăng ký hoặc phép chiếu thành viên; UI vô hiệu hóa nút gửi và liên kết đến `/profile`.
- AC-FE04-013: Cho trước một Quản trị viên đã xác thực trong Bảng điều khiển quản trị, khi chọn Review tư cách thành viên thì phần FE04 nhúng phải dùng bộ lọc và thao tác thay đổi chuẩn ở máy chủ, chỉ hiển thị quyết định cho đơn `PENDING`, tải lại dữ liệu có thẩm quyền sau thành công/xung đột và vẫn sử dụng được mà không tràn ở cấp tài liệu tại 1440, 1366, 1280 và 390 pixel.

---

## 9. Trường hợp biên và xử lý lỗi

| ID | Trường hợp biên / Lỗi | Hành vi hệ thống mong đợi |
| -- | ----------------- | ------------------------ |
| EC-FE04-001 | Khách đăng ký làm thành viên | Trả về phản hồi chưa được xác thực. |
| EC-FE04-002 | Tài khoản người dùng không hoạt động | Từ chối ứng dụng. |
| EC-FE04-003 | Đơn đăng ký đang chờ trùng lặp | Từ chối trùng lặp và trả lại trạng thái hiện tại. |
| EC-FE04-004 | Tư cách thành viên đã được phê duyệt | Từ chối; Giai đoạn 1 không có luồng hết hạn/gia hạn. |
| EC-FE04-005 | Không tìm thấy ID đơn đăng ký | Trả về phản hồi không tìm thấy. |
| EC-FE04-006 | Đơn không ở trạng thái chờ xử lý nhưng bị phê duyệt/từ chối | Từ chối chuyển đổi trạng thái không hợp lệ. |
| EC-FE04-007 | Tác nhân không được phân quyền thực hiện phê duyệt/từ chối | Trả về phản hồi cấm truy cập. |
| EC-FE04-008 | Lý do từ chối bị thiếu/trống/quá dài | Từ chối yêu cầu mà không thay đổi trạng thái đơn đăng ký/thành viên. |
| EC-FE04-009 | Hai nhân viên review đồng thời | Chỉ chuyển đổi hợp lệ đầu tiên thành công. |
| EC-FE04-010 | Cập nhật cơ sở dữ liệu hoặc audit thất bại trong quá trình review | Rollback các thay đổi về trạng thái đơn đăng ký/thành viên, dấu thời gian, người review và audit. |
| EC-FE04-011 | Các yêu cầu đăng ký lại đồng thời tạo hàng chờ xử lý trùng lặp | Ràng buộc duy nhất có lọc chỉ cho trạng thái chờ cùng bước kiểm tra giao dịch chỉ cho phép một hàng chờ xử lý và trả về xung đột tất định cho yêu cầu thua cuộc. |
| EC-FE04-012 | Yêu cầu/gửi thông báo FE10 thất bại | Giữ quyết định thành viên đã commit và trả về trạng thái gửi `FAILED` an toàn. Nếu requester chưa được cấu hình, trả về `NOT_CONFIGURED`. |
| EC-FE04-013 | Trường hồ sơ cá nhân bắt buộc bị trống hoặc thiếu | Từ chối bằng `MEMBERSHIP_PROFILE_INCOMPLETE` kèm tên các trường bị thiếu trước khi thay đổi dữ liệu. |

---

## 10. Yêu cầu về dữ liệu

### 10.1 Các thực thể có liên quan

| Thực thể | Mục đích trong tính năng này |
| ------ | ----------------------- |
| Users | Lưu tài khoản của người nộp đơn và trạng thái tài khoản. |
| UserProfiles | Cung cấp thông tin hồ sơ ứng viên để xem xét nếu cần. |
| UserRoles | Kiểm tra quyền review của Thủ thư/Quản trị viên. |
| Members | Phép chiếu thành viên hiện tại chuẩn được FE07/FE08 sử dụng. |
| MembershipApplications | Lưu trạng thái và dấu thời gian của đơn đăng ký thành viên. |
| Notifications | Nhận yêu cầu `MEMBERSHIP_RESULT` không chặn qua FE10 sau khi quyết định commit, nếu requester đã được cấu hình. |
| AuditLogs | Ghi lại các hành động đối với đơn đăng ký/review. |

### 10.2 Trường dữ liệu

| Trường | Kiểu | Bắt buộc | Kiểm tra hợp lệ / Ghi chú |
| ----- | ---- | -------- | ------------------ |
| applicationId | số nguyên | Có để xem xét | Phải tồn tại trong `MembershipApplications`. |
| userId | số nguyên | Có | Phải tham khảo người dùng ứng viên. |
| applicationStatus | chuỗi | Có | Các giá trị: `PENDING`, `APPROVED`, `REJECTED`; lịch sử đơn đăng ký là bất biến sau trạng thái kết thúc. |
| memberStatus | string/null | Sau lần nộp đơn đầu tiên | `Members.Status` chuẩn: `PENDING`, `APPROVED`, `REJECTED`, `INACTIVE`; `null` trước khi tồn tại một hàng `Members`; FE07/FE08 chỉ chấp nhận `APPROVED`. |
| membershipStatusView | chuỗi | Có để phản hồi trạng thái | Giá trị dẫn xuất: `NONE`, `PENDING`, `APPROVED`, `REJECTED`, `INACTIVE`; `NONE` không bao giờ tồn tại. |
| appliedAt | ngày giờ | Có | Mặc định theo thời gian máy chủ hiện tại. |
| applicationApprovedAt | ngày giờ | Bắt buộc khi phê duyệt | Ánh xạ tới `MembershipApplications.ApprovedAt`; được đặt bằng dấu thời gian phê duyệt của máy chủ. |
| memberApprovedAt | ngày giờ | Bắt buộc khi thành viên chuẩn được phê duyệt | Ánh xạ tới `Members.ApprovedAt`; bằng dấu thời gian phê duyệt đơn đăng ký và là null với `PENDING`, `REJECTED` hoặc `INACTIVE`. |
| reviewedBy | số nguyên | Bắt buộc khi phê duyệt/từ chối | ID người dùng của người review; SQL hiện có hỗ trợ trường này. |
| rejectionReason (`ReviewNote`) | chuỗi | Bắt buộc khi từ chối | Cắt khoảng trắng, 1..500 ký tự; trường SQL `ReviewNote` hiện có lưu lý do. |

### 10.3 Tư cách thành viên chuẩn và quy tắc trạng thái

- `MembershipApplications` sở hữu lịch sử quy trình. Các chuyển đổi hợp lệ là `[*] -> PENDING`, `PENDING -> APPROVED` và `PENDING -> REJECTED`; hàng đơn đăng ký đã ở trạng thái kết thúc không bao giờ được mở lại.
- `Members` sở hữu điều kiện hiện tại. Đơn đăng ký/đăng ký lại đầu tiên đặt `PENDING`; phê duyệt đặt `APPROVED`; từ chối đặt `REJECTED`. `INACTIVE` được giữ để tương thích lược đồ nhưng không endpoint đăng ký FE04 nào trong Giai đoạn 1 chuyển sang trạng thái này.
- Một người dùng có thể có nhiều ứng dụng lịch sử. Dịch vụ từ chối một ứng dụng mới khi nó phát hiện một ứng dụng `PENDING` hoặc `APPROVED` hiện có; trước ứng dụng đầu tiên có thể không có hàng `Members` và sau khi ứng dụng đầu tiên được tạo, phải tồn tại chính xác một hàng `Members` chuẩn.
- Đơn đăng ký hiện tại/gần nhất được chọn tất định theo `AppliedAt DESC, ApplicationId DESC`; quy tắc hiển thị này không bao giờ ghi đè điều kiện chuẩn từ `Members`.
- `membershipStatusView` được suy ra là `NONE` chỉ khi cả hàng thành viên chuẩn và đơn đăng ký hiện tại đều không tồn tại; nếu không, giá trị này phản chiếu `Members.Status` chuẩn.
- Thao tác ghi đơn đăng ký/thành viên/audit dùng một giao dịch. Thông báo FE10 chỉ được yêu cầu sau commit và không thuộc giao dịch thành viên.

---

## 11. API / Hợp đồng giao diện

> Các điểm cuối và hình dạng request/response bên dưới là hợp đồng Giai đoạn 1 chuẩn cho tính năng này.

| Phương thức | Endpoint | Tác nhân | Yêu cầu | Phản hồi | Ghi chú |
| ------ | -------- | ----- | ------- | -------- | ----- |
| POST | `/api/membership/applications` | `MEMBER` đã được xác thực | `{}` | Đơn đăng ký đã tạo và trạng thái chuẩn `PENDING` | Tài khoản đang hoạt động với `fullName`, `phone`, `dateOfBirth` và `address` đầy đủ; giữ nguyên lịch sử trước đó. |
| GET | `/api/membership/status/me` | `MEMBER` đã được xác thực | - | Phản hồi trạng thái với `status`, `membershipStatusView`, `memberStatus`, `currentApplication`, `application` và `member` | Các giá trị `NONE`/`null` được trả về tất định trước đơn đăng ký đầu tiên; nếu không, trạng thái chuẩn lấy từ `Members`. |
| GET | `/api/membership/applications` | Librarian/Admin | Truy vấn: `q?, status?, page?, limit?` | `{ applications, page, limit, total, totalPages }` | Danh sách review được bảo vệ; `q` tìm theo ID đơn đăng ký, tên, tên người dùng hoặc email. |
| PATCH | `/api/membership/applications/{applicationId}/approve` | Librarian/Admin | `{}` | Đơn đăng ký đã phê duyệt + `notificationStatus` an toàn | Chỉ áp dụng khi đang chờ xử lý; đơn đăng ký/thành viên/audit commit cùng nhau, sau đó yêu cầu FE10. |
| PATCH | `/api/membership/applications/{applicationId}/reject` | Librarian/Admin | `{ reason: string }` | Đơn đăng ký đã từ chối + `notificationStatus` an toàn | Chỉ áp dụng khi đang chờ xử lý; lý do bắt buộc, cắt khoảng trắng, tối đa 500; đơn đăng ký/thành viên/audit commit cùng nhau, sau đó yêu cầu FE10. |

---

## 12. Yêu cầu phi chức năng

### 12.1 Bảo mật

- NFR-FE04-SEC-001: Endpoint thành viên phải xác thực danh tính tác nhân.
- NFR-FE04-SEC-002: Phê duyệt và từ chối phải thực thi quyền truy cập dựa trên vai trò trên máy chủ.
- NFR-FE04-SEC-003: Người dùng không được xem trạng thái thành viên của người khác qua endpoint thành viên.
- NFR-FE04-SEC-004: ID yêu cầu, giá trị trạng thái và văn bản lý do phải được xác thực.

### 12.2 Tính toàn vẹn giao dịch

- NFR-FE04-TXN-001: Đơn đăng ký, phép chiếu `Members` chuẩn, siêu dữ liệu người review và mục audit tương ứng phải cùng commit hoặc cùng rollback.
- NFR-FE04-TXN-002: Hoạt động đánh giá thực thi một chuyển đổi cuối cùng bằng cách kiểm tra lại trạng thái đang chờ xử lý bên trong giao dịch đánh giá; các hoạt động áp dụng sử dụng bộ lọc bảo vệ tính duy nhất chỉ đang chờ xử lý và kiểm tra giao dịch để ngăn chặn các hàng đang chờ xử lý trùng lặp.

### 12.3 Hiệu năng

- NFR-FE04-PERF-001: Danh sách đơn đăng ký thành viên phải thực hiện tìm kiếm, lọc trạng thái, đếm và phân trang ngay trong truy vấn cơ sở dữ liệu trước khi hiện thực hóa các hàng.

### 12.4 Ghi log và audit

- NFR-FE04-LOG-001: Thay đổi khi đăng ký, phê duyệt, từ chối và thay đổi phép chiếu chuẩn phải truy vết được theo tác nhân, đơn đăng ký, thành viên, dấu thời gian và kết quả.

### 12.5 Khả năng sử dụng

- NFR-FE04-UX-001: Người nộp đơn phải thấy trạng thái rõ ràng: không có đơn đăng ký, đang chờ xử lý, được phê duyệt, bị từ chối.
- NFR-FE04-UX-002: Trạng thái thành viên và chế độ xem ứng dụng phải giải thích rõ ràng quyền lợi FE07: tài khoản không được phê duyệt nhận được 3 bản sao mỗi ngày làm việc và tư cách thành viên `APPROVED` chuẩn nhận được 5 bản sao mỗi ngày làm việc.
- NFR-FE04-UX-003: Người nộp đơn bị từ chối phải xem được lý do từ chối đã lưu mà không làm lộ dữ liệu người review/nội bộ được bảo vệ.
- NFR-FE04-UX-004: Khi dữ liệu hồ sơ được yêu cầu không đầy đủ, ứng dụng UI phải đặt tên cho các trường bị thiếu, vô hiệu hóa việc gửi và liên kết đến `/profile`.
- NFR-FE04-UX-005: Phần review Quản trị viên nhúng phải dùng bảng màn hình rộng có khả năng truy cập và thẻ đáp ứng ở độ phân giải 1440px trở xuống, giữ cơ chế lọc/phân trang do máy chủ sở hữu và hiển thị lỗi gửi FE10 dưới dạng cảnh báo không chặn sau một quyết định đã commit.

---

## 13. Ngoài phạm vi

Tính năng này không bao gồm:

- Đăng ký tài khoản hoặc đăng nhập.
- Mật khẩu, xác minh email hoặc xử lý mã thông báo xác thực.
- Chỉnh sửa hồ sơ.
- Phân công vai trò hoặc vô hiệu hóa tài khoản người dùng.
- Mượn, trả lại, gia hạn hoặc thực hiện bảo lưu.
- Tính hoặc thanh toán tiền phạt.
- Thanh toán thành viên hoặc cổng thanh toán trực tuyến.

---

## 14. Sự phụ thuộc

| Phụ thuộc | Loại | Ghi chú |
| ---------- | ---- | ----- |
| Xác thực FE02 | Nội bộ | Cung cấp danh tính tài khoản và người dùng được xác thực. |
| Hồ sơ người dùng FE03 | Nội bộ | Cung cấp dữ liệu hồ sơ để xem xét nếu cần. |
| Quản lý mượn sách FE07 | Bên sử dụng độc lập | Dùng tài khoản đang hoạt động cùng vai trò `MEMBER`; FE04 không chặn quyền mượn, nhưng trạng thái chuẩn `APPROVED` tăng hạn mức hằng ngày từ 3 lên 5 bản. |
| Quản lý đặt chỗ FE08 | Bên sử dụng độc lập | Dùng tài khoản đang hoạt động cùng vai trò `MEMBER`; FE04 không chặn quyền đặt chỗ. |
| Quản lý thông báo FE10 | Nội bộ | Nhận yêu cầu `MEMBERSHIP_RESULT` không chặn sau khi phê duyệt/từ chối commit, nếu đã được cấu hình. |
| FE11 Quản lý vai trò và người dùng | Nội bộ | Cung cấp vai trò Thủ thư/Quản trị viên. |
| Cơ sở dữ liệu SQL Server | Kỹ thuật | Tập lệnh SQL hiện tại có `Members` và `MembershipApplications`; FE04 giữ chúng nhất quán trong giao dịch. |

---

## 15. Câu hỏi đã được giải quyết

| ID | Quyết định phê duyệt | Nguồn | Trạng thái |
| -- | ----------------- | ------ | ------ |
| Q-FE04-001 | Người dùng bị từ chối có thể đăng ký lại sau khi sửa thông tin. | Gói review 2026-06-10 | APPROVED |
| Q-FE04-002 | Lý do từ chối là bắt buộc. | Gói review 2026-06-10 | APPROVED |
| Q-FE04-003 | Tư cách thành viên không hết hạn trong Giai đoạn 1. | Gói review 2026-06-10 | APPROVED |
| Q-FE04-004 | Việc phê duyệt tư cách thành viên chỉ thay đổi trạng thái đơn đăng ký/thành viên, không thay đổi vai trò người dùng. | Gói review 2026-06-10 | APPROVED |
| Q-FE04-005 | Thủ thư và Quản trị viên có thể phê duyệt/từ chối đơn đăng ký thành viên. | Gói review 2026-06-10 | APPROVED |
| Q-FE04-006 | Sau khi phê duyệt/từ chối commit, nếu requester đã được cấu hình thì hệ thống yêu cầu thông báo FE10 chuẩn; lỗi nhà cung cấp/yêu cầu không chặn và không hoàn tác quyết định. | Gói review 2026-06-10; căn chỉnh mã 2026-07-19 | APPROVED |
| Q-FE04-007 | `Members.Status` là nguồn đủ điều kiện chuẩn; `MembershipApplications` giữ lại lịch sử đánh giá bất biến. | Nhat phê duyệt sau khi kiểm tra tính năng chéo 2026-07-15 | APPROVED |

---

## 16. Ma trận truy vết

| ID yêu cầu | Trường hợp sử dụng liên quan | Trường hợp thử nghiệm liên quan | Trạng thái |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE04-001 | UC13 | Ranh giới vai trò Thành viên trong `membershipRoutes.test.js` | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-002 | UC13 | Xác thực tài khoản đang hoạt động/vai trò trong `membershipRoutes.test.js` | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-003 | UC13 | Các ca chỉ có một đơn chờ xử lý trong `membershipRoutes.test.js`; `membershipConcurrency.sqltest.js` | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-004 | UC13 | Chặn thành viên đã được phê duyệt trong `membershipRoutes.test.js` | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-005 | UC13 | Tạo trạng thái chờ trong `membershipRoutes.test.js` | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-006 | UC14 | Phân quyền phê duyệt của nhân viên trong `membershipRoutes.test.js` | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-007 | UC15 | Phân quyền từ chối của nhân viên trong `membershipRoutes.test.js` | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-008 | UC14, UC15 | Cơ chế bảo vệ trạng thái kết thúc trong `membershipRoutes.test.js` | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-009 | UC14 | Dấu thời gian phê duyệt dùng chung trong `membershipRoutes.test.js` | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-010 | UC15 | Giới hạn lý do từ chối trong `membershipRoutes.test.js` | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-011 | UC16 | Quyền sở hữu trạng thái/quyền riêng tư trong `membershipRoutes.test.js` | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-012 | UC16, UC29, UC36 | Tích hợp điều kiện FE07/FE08 và bằng chứng SQL | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-013 | UC14, UC15 | Các xác nhận audit ở route/SQL | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-014 | UC13, UC16, UC29, UC36 | Các ca phép chiếu `Members` chuẩn | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-015 | UC13, UC14, UC15 | Các ca audit nguyên tử trong `membershipRoutes.test.js`; `membershipConcurrency.sqltest.js` | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-016 | UC13 | Kiểm thử lịch sử đăng ký lại của người bị từ chối | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-017 | UC16 | Các ca trạng thái không hết hạn trong Giai đoạn 1 | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-018 | UC14, UC15 | Kiểm thử requester `MEMBERSHIP_RESULT` không chặn | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| BR-FE04-019 | UC13 | Xác thực hồ sơ đầy đủ và các ca không ghi khi từ chối | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| FR-FE04-001 | UC13 | Luồng đăng ký thành công | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| FR-FE04-002 | UC13 | Xung đột đơn chờ xử lý trùng lặp | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| FR-FE04-003 | UC13 | Chặn thành viên đã được phê duyệt | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| FR-FE04-004 | UC14 | Các ca siêu dữ liệu/audit khi phê duyệt | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| FR-FE04-005 | UC15 | Các ca siêu dữ liệu/audit khi từ chối | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| FR-FE04-006 | UC14, UC15 | Cơ chế bảo vệ vai trò | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| FR-FE04-007 | UC16 | Trạng thái cá nhân chuẩn | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| FR-FE04-008 | UC14, UC15 | Chuyển đổi trạng thái kết thúc không hợp lệ | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| FR-FE04-009 | UC29, UC36 | Người dùng đang hoạt động + điều kiện chuẩn đã phê duyệt | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| FR-FE04-010 | UC13 | Phép chiếu/lịch sử khi đăng ký lại | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| FR-FE04-011 | UC14, UC15 | Các ca review đơn đăng ký/thành viên/audit nguyên tử | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| FR-FE04-012 | UC14, UC15 | Lỗi FE10 vẫn giữ nguyên quyết định | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| FR-FE04-013 | UC13 | Thực thi hồ sơ đầy đủ và hướng dẫn Thành viên | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| FR-FE04-014 | UC14, UC15 | Hợp đồng nguồn/trình duyệt FE04 nhúng trong Bảng điều khiển quản trị | Hoàn tất; local, Azure Staging, H2 và H3/manual acceptance đã đạt |
| AC-FE04-001 | UC13 | Luồng đăng ký thành công | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| AC-FE04-002 | UC13 | Từ chối đơn chờ xử lý trùng lặp | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| AC-FE04-003 | UC14 | Phê duyệt + thông báo | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| AC-FE04-004 | UC15 | Từ chối + thông báo | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| AC-FE04-005 | UC14, UC15 | Review không được phân quyền | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| AC-FE04-006 | UC14, UC15 | Chuyển trạng thái không hợp lệ | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| AC-FE04-007 | UC16 | Quyền riêng tư của trạng thái cá nhân | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| AC-FE04-008 | UC13, UC16 | Ranh giới xác thực/vai trò | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| AC-FE04-009 | UC13 | Đăng ký lại sau khi bị từ chối | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| AC-FE04-010 | UC14, UC15 | Lỗi thông báo vẫn giữ nguyên quyết định | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| AC-FE04-011 | UC29, UC36 | Tài khoản đang hoạt động + điều kiện chuẩn đã phê duyệt | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| AC-FE04-012 | UC13 | Từ chối hồ sơ chưa đầy đủ và luồng khôi phục qua `/profile` | Hoàn tất; kiểm thử tự động và H3/manual acceptance đã đạt |
| AC-FE04-013 | UC14, UC15 | Các ca điều hướng, review, xung đột, thông báo và đáp ứng trong Bảng điều khiển quản trị | Hoàn tất; local, Azure Staging, H2 và H3/manual acceptance đã đạt |

### 16.1 Tóm tắt độ bao phủ

| Loại yêu cầu | Tổng số ID | ID đã ánh xạ | Độ bao phủ |
| ---------------- | --------- | ---------- | -------- |
| Quy tắc kinh doanh (BR-FE04) | 19 | 19 | 100% |
| Yêu cầu chức năng (FR-FE04) | 14 | 14 | 100% |
| Tiêu chí chấp nhận (AC-FE04) | 13 | 13 | 100% |
| **Tổng** | **46** | **46** | **100%** |

---

## 17. Danh sách kiểm tra đánh giá

Danh sách kiểm tra phê duyệt giai đoạn 1 (hoàn thành trên 2026-06-10):

- [x] Chính sách đăng ký lại đã được phê duyệt.
- [x] Vai trò của người đánh giá được phê duyệt với FE11.
- [x] Lý do từ chối và nhu cầu lược đồ đã được xác nhận.
- [x] Nguồn trạng thái thành viên cho FE07/FE08 đã được xác nhận.
- [x] Hợp đồng API được phê duyệt trong SPEC.md hoặc được sao chép vào tệp hợp đồng API được chia sẻ chuyên dụng nếu nhóm giới thiệu lại một tệp.
- [x] Mọi tiêu chí chấp nhận đều có thể trở thành một bài kiểm tra.

### 17.1 Cổng Rà Soát Bản Sửa Đổi v0.2.3

- [x] Xác nhận `Members.Status` là nguồn đủ điều kiện FE07/FE08 chuẩn.
- [x] Xác nhận thao tác ghi đơn đăng ký/thành viên/audit là nguyên tử và có cơ chế bảo vệ bằng ràng buộc lọc chỉ cho trạng thái chờ khi đăng ký đồng thời.
- [x] Xác nhận lý do từ chối bắt buộc và hành vi không hết hạn ở Giai đoạn 1.
- [x] Xác nhận phân phối FE10 `MEMBERSHIP_RESULT` bình thường không chặn.
## Điều chỉnh bảng điều khiển nhân viên 2026-07-22

- Kết quả từ chối thành công được trình bày bằng thông báo thông tin trung lập (“Đã từ chối”), không dùng thông báo thành công theo kiểu phê duyệt; yêu cầu từ chối thất bại tiếp tục hiển thị lỗi và không được đóng trạng thái review.
- Điều hướng chỉ dành cho Thành viên bị ẩn với tài khoản Thủ thư/Quản trị viên và với mảng tương thích legacy không hợp lệ có chứa vai trò nhân viên; tài khoản đã lưu vẫn chỉ có một vai trò.
