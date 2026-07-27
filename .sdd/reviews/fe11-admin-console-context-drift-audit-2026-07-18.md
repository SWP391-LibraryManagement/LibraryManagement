# Kiểm toán ngữ cảnh và sai lệch Bảng điều khiển Quản trị viên FE11

Ngày: 2026-07-18

Phương pháp: đối soát ngữ cảnh SDD/ADD Kết hợp với đánh giá Tiêu chuẩn và Đặc tả riêng

Điểm cố định:

- Cơ sở: `66642b5`
- Đích: `origin/main@8da84bd`
- Phạm vi: chỉ Quản lý người dùng FE11, Bảng điều khiển Quản trị viên, UI thao tác vai trò, Nhật ký kiểm toán và Quản lý yêu cầu

## Quyết định

Cần đối soát SDD Đầy đủ trước khi bắt đầu bất kỳ lát cắt triển khai Bảng điều khiển Quản trị viên FE11 mới nào.

Các lát cắt giới hạn sau đã hoàn thành đến B7:

- Thiết lập tài khoản: `FE11-S01..S07`
- Gán/thu hồi vai trò backend có giao dịch: `FE11-R01..R05`
- Danh sách/chi tiết người dùng an toàn: `FE11-U01..U06`

Toàn bộ tính năng vẫn là `Implementation State: DEFERRED`. Hành vi nguyên mẫu Bảng điều khiển Quản trị viên và Nhật ký kiểm toán hiện có không được chấp nhận là tuân thủ khi xung đột với `SPEC.md` hoặc được thêm mà không có nhóm nhiệm vụ đã phê duyệt.

Không có `docs/agents/issue-tracker.md`, nên `SPEC.md` FE11 cục bộ chuẩn, thiết kế/kế hoạch lát cắt đã phê duyệt, bản ghi xác thực, mã và kiểm thử là tập bằng chứng khả dụng.

## Phát hiện đánh giá Tiêu chuẩn

### Cao - Hành vi kiểm toán được triển khai ngoài nhiệm vụ FE11 đã phê duyệt

`PLAN.md` và `TASKS.md` giữ công việc Bảng điều khiển Quản trị viên/Kiểm toán ở trạng thái bị hoãn, nhưng commit `1fabe35` và `CHANGELOG.md` ghi nhận phần triển khai phân trang/hiển thị Nhật ký kiểm toán. Điều này vi phạm quy tắc kho mã rằng triển khai phải tuân theo lát cắt SPEC/PLAN/TASKS đã phê duyệt. Hành vi hiện có phải được coi là mã nguyên mẫu một phần đến khi một nhóm nhiệm vụ được đánh giá riêng xác thực nó.

### Cao - Xác thực đầu vào và che dữ liệu kiểm toán không đáp ứng quy tắc an toàn kho mã

`backend/src/services/userManagementService.js` âm thầm chuẩn hóa/giới hạn phân trang Nhật ký kiểm toán thay vì dùng bộ xác thực tại ranh giới tuyến. `backend/src/repositories/auditLogRepository.js` trả về `Metadata` thô. Điều này xung đột với quy tắc xác thực tại ranh giới và đầu ra an toàn.

### Trung bình - Bản ghi bằng chứng có thẩm quyền đã cũ

Các bảng truy vết FE11 vẫn đánh dấu hàng thiết lập tài khoản, vai trò có giao dịch và đọc an toàn đã hoàn thành là `Ready for review` hoặc `Not Started`. `TEST_PLAN.md` cũng giữ một tuyên bố đọc an toàn trước đánh giá. Những bản ghi cũ này tạo ra Mất ngữ cảnh dù đã có bằng chứng xác thực giới hạn và CI sau hợp nhất.

### Trung bình - API dùng chung và bộ nhớ tác nhân đã cũ

Tài liệu API dùng chung giữ `GUEST`, tìm kiếm tên người dùng, một vỏ danh sách lỗi thời và DTO chi tiết lồng nhau. `.agents/CLAUDE.md` chỉ đề cập thiết lập tài khoản FE11 và mô tả sai Sequelize là tầng truy cập SQL Server, trong khi ADR-002 yêu cầu truy vấn `mssql` tham số hóa.

## Phát hiện đánh giá Đặc tả

### Cao - Thao tác vai trò Quản trị viên không thể gọi hợp đồng backend đã phê duyệt

`FR-FE11-012/013`, `AC-FE11-013/014` và API chuẩn yêu cầu `roleId` dạng số. `frontend/src/api/userManagementApi.js` gửi `{ roleName }` để gán và đặt `roleName` vào đường dẫn DELETE, trong khi `backend/src/validators/userManagementValidators.js` yêu cầu ID số nguyên dương. Lát cắt vai trò backend đã hoàn thành B7, nhưng đường dẫn UI Quản trị viên không tuân thủ và vẫn bị hoãn.

### Cao - Nhật ký kiểm toán mới chỉ được triển khai một phần

Endpoint chuẩn là `GET /api/admin/audit-logs` với `q`, `action`, `actorId`, `from`, `to`, phân trang và che trường nhạy cảm. Phần triển khai cung cấp `/api/users/audit-logs`, chỉ hỗ trợ page/limit, không có điều khiển tìm kiếm/lọc UI và trả về siêu dữ liệu thô. Kiểm thử hiện có chứng minh phân quyền Quản trị viên và phân trang, không phải `FR-FE11-033` / `AC-FE11-018`.

### Trung bình - Điều hướng Quản trị viên và Quyền xung đột với bảng điều khiển đã phê duyệt

`FR-FE11-030` yêu cầu Trang chủ, Bảng điều khiển, Thư viện, Quản lý mượn, Quản lý yêu cầu, Tất cả người dùng, Quyền và Nhật ký kiểm toán. `frontend/src/page/UserManagement.jsx` bỏ Quyền và thêm Quản lý Thành viên. Nội dung quyền không thể truy cập, dùng ma trận mã hóa cứng và suy ra số lượng vai trò chỉ từ trang người dùng đã tải; không có `/api/admin/permissions`.

### Trung bình - Quản lý yêu cầu chưa hoàn thiện

Có danh sách/tìm kiếm/lọc/xuất và thao tác UI chỉ dành cho trạng thái đang chờ. Hàng kết thúc chỉ được xem trong thành phần hiện tại, nhưng không có `GET /api/admin/requests/{requestId}` và không có kiểm thử chấp thuận phía máy chủ trọng tâm nào chứng minh yêu cầu đã hoàn thành/bị từ chối/bị hủy là bất biến đối với chế độ xem Quản trị viên này.

### Trung bình - Vỏ danh sách an toàn bị sai lệch sau phạm vi xác thực đã phê duyệt

Thiết kế đọc an toàn đã phê duyệt cố định vỏ phản hồi là `data` cùng `pagination`. Commit `1fabe35` thêm `summary` cấp cao nhất trong `backend/src/repositories/userRepository.js`; hành vi này không có trong SPEC/thiết kế và thiếu xác nhận hợp đồng kho dữ liệu trọng tâm.

### Thấp - Siêu dữ liệu bằng chứng lát cắt đã đóng vẫn cũ

Mã, đánh giá xác thực, phê duyệt của con người, hợp nhất và lần chạy CI chứng minh ba lát cắt giới hạn ở trên. Các ô trạng thái trong `SPEC.md` không phản ánh bằng chứng đó. Vì SPEC là nguồn chân lý, siêu dữ liệu bằng chứng chỉ nên được đối soát trong một thay đổi bảo trì SPEC được phê duyệt riêng mà không sửa yêu cầu.

## Đối soát đã áp dụng

- Cập nhật `.agents/CLAUDE.md` với các lát cắt B7 FE11 thực tế, kiến trúc `mssql` và sai lệch Bảng điều khiển Quản trị viên chưa giải quyết.
- Sửa ADR-005 từ đang chờ đánh giá thành được chấp thuận cho lát cắt thiết lập tài khoản đã triển khai.
- Đối soát tài liệu API danh sách/chi tiết an toàn dùng chung theo hợp đồng FE11 đã phê duyệt; `summary` bổ sung trong phần triển khai vẫn được nêu rõ là ngoài hợp đồng.
- Cập nhật `TEST_PLAN.md`, `TASKS.md` và `CHANGELOG.md` với kiểm toán điểm cố định và trạng thái bằng chứng hiện tại.
- Sửa mô tả `TD-015`, `TD-016` và `TD-021` đã cũ, đồng thời đăng ký `TD-022..TD-027` cho sai lệch mới phân loại.
- Giữ nguyên `SPEC.md` và toàn bộ mã sản phẩm.

## Cổng tiếp theo

Không triển khai mọi phát hiện thành một thay đổi rộng. Chọn và phê duyệt một lát cắt khắc phục giới hạn với thiết kế, nhiệm vụ, kiểm thử ĐỎ, cổng xác thực, đánh giá của con người, hợp nhất và bằng chứng sau hợp nhất riêng. Lát cắt đầu tiên được khuyến nghị: hợp đồng UI thao tác vai trò Quản trị viên `TD-022`, vì giao dịch backend đã được xác thực và đường dẫn UI hiện tại không tương thích một cách tất định.

## Cổng đánh giá của con người

Đánh giá của con người được xác nhận vào 2026-07-18. Người đánh giá chấp thuận điểm cố định, các phát hiện Tiêu chuẩn/Đặc tả riêng, phân loại B7 giới hạn, trạng thái toàn tính năng bị hoãn và đối soát chỉ tài liệu. Phê duyệt này đóng `FE11-C01`; nó không phê duyệt lát cắt khắc phục mã sản phẩm nào.
