# Rà soát khoảng trống cơ sở dữ liệu Tuần 4

Ngày: 2026-06-10
Trạng thái: RÀ SOÁT HOÀN TẤT - CẦN SỬA LƯỢC ĐỒ TRƯỚC KHI TRIỂN KHAI TUẦN 5

## Phạm vi

Rà soát `database/Librarymanagement.sql` theo các đặc tả Giai đoạn 1 đã phê duyệt và `.sdd/rfcs/ADR-002-database-design.md`.

Bản rà soát này không thay đổi lược đồ cơ sở dữ liệu. Bản này xác định các khoảng trống phải được giải quyết trước khi triển khai kho lưu trữ/dịch vụ backend.

## Các bảng hiện tại được phát hiện

| Bảng | Cột | Khóa ngoại |
|---|---|---|
| `Roles` | RoleId, RoleName | - |
| `Users` | UserId, Username, Email, PasswordHash, Phone, Status, CreatedAt | - |
| `UserRoles` | UserId, RoleId | FOREIGN KEY (UserId) REFERENCES Users(UserId)<br>FOREIGN KEY (RoleId) REFERENCES Roles(RoleId) |
| `UserProfiles` | ProfileId, UserId, FullName, Address, DateOfBirth, AvatarUrl | FOREIGN KEY (UserId) REFERENCES Users(UserId) |
| `MembershipApplications` | ApplicationId, UserId, Status, AppliedAt, ApprovedAt | FOREIGN KEY (UserId) REFERENCES Users(UserId) |
| `Categories` | CategoryId, CategoryName | - |
| `Authors` | AuthorId, AuthorName | - |
| `Publishers` | PublisherId, PublisherName | - |
| `Books` | BookId, Title, ISBN, CategoryId, AuthorId, PublisherId, PublishYear, Description, CoverUrl | FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId)<br>FOREIGN KEY (AuthorId) REFERENCES Authors(AuthorId)<br>FOREIGN KEY (PublisherId) REFERENCES Publishers(PublisherId) |
| `BookCopies` | CopyId, BookId, Barcode, Status, Location | FOREIGN KEY (BookId) REFERENCES Books(BookId) |
| `BorrowRequests` | RequestId, UserId, RequestDate, Status | FOREIGN KEY (UserId) REFERENCES Users(UserId) |
| `BorrowDetails` | BorrowDetailId, RequestId, CopyId, DueDate, ReturnDate, Status | FOREIGN KEY (RequestId) REFERENCES BorrowRequests(RequestId)<br>FOREIGN KEY (CopyId) REFERENCES BookCopies(CopyId) |
| `Reservations` | ReservationId, UserId, CopyId, ReservedAt, Status | FOREIGN KEY (UserId) REFERENCES Users(UserId)<br>FOREIGN KEY (CopyId) REFERENCES BookCopies(CopyId) |
| `Fines` | FineId, UserId, BorrowDetailId, Amount, Reason, Status, PaidAt | FOREIGN KEY (UserId) REFERENCES Users(UserId)<br>FOREIGN KEY (BorrowDetailId) REFERENCES BorrowDetails(BorrowDetailId) |
| `AuditLogs` | LogId, UserId, Action, CreatedAt | FOREIGN KEY (UserId) REFERENCES Users(UserId) |

## Độ bao phủ tính năng

| Khu vực | Được đặc tả/ADR yêu cầu | Trạng thái | Phát hiện |
|---|---|---|---|
| Người dùng/Vai trò FE02/FE11 | Users, Roles, UserRoles với trạng thái hoạt động/không hoạt động, tên người dùng/email duy nhất, hàm băm mật khẩu, gán vai trò | PARTIAL | Users/Roles/UserRoles tồn tại; Users có Status và PasswordHash. Thiếu bảng token/phiên, trường khóa/giới hạn tốc độ, trường xác minh email, UpdatedAt. Dữ liệu khởi tạo dùng giá trị không an toàn giống mật khẩu. |
| Hồ sơ Người dùng FE03 | UserProfiles với trường hồ sơ riêng và FK người dùng | PARTIAL | UserProfiles tồn tại với FullName, Address, DateOfBirth, AvatarUrl. Phone nằm trong Users, điều này có thể chấp nhận nhưng cần được xác nhận khi lập kế hoạch FE03/FE11. |
| Thành viên FE04 | Đơn/trạng thái thành viên và liên kết tới người dùng/thành viên | PARTIAL | MembershipApplications tồn tại. Thiếu bảng trạng thái tư cách thành viên/thành viên rõ ràng đã rà soát nếu FE04 cần trạng thái thành viên đã phê duyệt tách biệt với trạng thái đơn. |
| Sách FE01/FE05 | Books, Categories, Authors, Publishers; trạng thái sách hoạt động/không hoạt động; siêu dữ liệu có thể tìm kiếm | PARTIAL | Các bảng Core tồn tại. Books thiếu Status/IsActive và ràng buộc duy nhất ISBN; quy tắc duyệt công khai cần ẩn sách không hoạt động. |
| Kho FE06 | BookCopies với mã vạch, vị trí, trạng thái đã phê duyệt | PARTIAL | BookCopies tồn tại. Status là văn bản tự do, không có ràng buộc CHECK cho AVAILABLE/BORROWED/RESERVED/DAMAGED/LOST/INACTIVE. |
| Mượn FE07 | Bản ghi yêu cầu/chi tiết mượn với thành viên, bản sao, ngày mượn, hạn trả, ngày trả, trạng thái, người tạo/xử lý | PARTIAL | BorrowRequests/BorrowDetails tồn tại. Thiếu ApprovedAt/BorrowDate/CreatedBy/ProcessedBy và tên rõ ràng cho bên yêu cầu/thành viên. BorrowDetails Status mặc định BORROWED ngay cả trước khi phê duyệt có thể gây mơ hồ. |
| Đặt chỗ FE08 | Reservations với người dùng, bản sao, hàng đợi/trạng thái, dữ liệu hết hạn/giữ | PARTIAL | Reservations tồn tại. Thiếu ExpiresAt/QueuePosition/NotifiedAt hoặc trường hạn giữ từ hành vi hàng đợi đặt chỗ. |
| Tiền phạt FE09 | Dấu vết tính tiền phạt: số ngày quá hạn, mức phí, số tiền, khoản mượn/bản sao liên quan, ngày tính, chi tiết đã trả/thu | PARTIAL | Fines tồn tại. Thiếu OverdueDays, RatePerDay, CalculatedAt, CreatedBy, phương thức/tham chiếu thanh toán/thu và trường miễn nếu cần. |
| Thông báo FE10 | Thông báo/mẫu/lần thử không có bí mật thô | MISSING | Không tìm thấy bảng thông báo. FE10 cần bản ghi/mẫu/lần thử hoặc quyết định lưu trữ chỉ giả lập được ghi tài liệu. |
| Nhật ký Kiểm toán | Tác nhân/hành động/mục tiêu/dấu thời gian/siêu dữ liệu an toàn | PARTIAL | AuditLogs tồn tại nhưng chỉ có UserId, Action, CreatedAt. Thiếu TargetType, TargetId, Metadata, IpAddress/ngữ cảnh yêu cầu nếu cần. |
| Báo cáo FE12 | Báo cáo chỉ đọc trên các bảng nguồn | OK | Không cần bảng báo cáo riêng trong Giai đoạn 1; bảng nguồn tồn tại một phần nhưng phụ thuộc vào các bản sửa khoảng trống bên trên. |

## Các yếu tố chặn trước Tuần 5

| ID | Mức độ | Vấn đề | Hành động bắt buộc |
|---|---|---|---|
| DB-BLOCKER-001 | Cao | Dữ liệu khởi tạo chèn giá trị `PasswordHash` là `123`, vi phạm quy tắc không có giá trị khởi tạo dạng văn bản thuần/giống mật khẩu. | Thay bằng hàm băm demo không thể đăng nhập hoặc xóa người dùng khởi tạo trước khi triển khai. Không commit thông tin xác thực thật. |
| DB-BLOCKER-002 | Cao | Không tồn tại mô hình lưu trữ token làm mới, token đặt lại mật khẩu, token xác minh email hay token thiết lập tài khoản. | Thêm bảng token/phiên đã rà soát hoặc ghi thiết kế phi trạng thái/giả lập trong ADR/đặc tả trước khi triển khai FE02. |
| DB-BLOCKER-003 | Cao | Không tồn tại bảng thông báo cho FE10 dù FE10 yêu cầu bản ghi/mẫu/lần thử. | Thêm `Notifications`, `NotificationTemplates`, `NotificationAttempts` hoặc giới hạn rõ Giai đoạn 1 FE10 chỉ giả lập không lưu trữ và cập nhật đặc tả/ADR. |
| DB-BLOCKER-004 | Cao | Bản ghi mượn không ghi nhận đầy đủ phê duyệt/người tạo/ngày mượn cần cho truy vết. | Sửa các bảng mượn với trường ngày/người dùng/trạng thái phê duyệt trước kho lưu trữ FE07. |
| DB-BLOCKER-005 | Cao | Bảng tiền phạt không thể truy vết đầy đủ cách tính tiền phạt. | Thêm số ngày quá hạn, mức phí, dấu thời gian tính và siêu dữ liệu thu trước khi triển khai FE09. |
| DB-BLOCKER-006 | Trung bình | Trạng thái sách và bản sao là văn bản tự do không có ràng buộc; Books thiếu trạng thái hoạt động/không hoạt động. | Thêm ràng buộc CHECK hoặc chiến lược tra cứu được kiểm soát và trường trạng thái sách. |
| DB-BLOCKER-007 | Trung bình | Bảng AuditLogs quá sơ sài để truy vết hành động quản trị. | Thêm loại/id mục tiêu và trường siêu dữ liệu an toàn. |

## Các tác vụ sửa lược đồ được đề xuất

1. Tạo `database/schema-review-notes.md` hoặc cập nhật `ADR-002` với các quyết định bảng cuối cùng.
2. Chỉ sửa `database/Librarymanagement.sql` sau khi nhóm phê duyệt các yếu tố chặn bên trên.
3. Ưu tiên lược đồ FE02/FE11 trước vì Sprint 1 Tuần 5 bắt đầu với Xác thực và Người dùng.
4. Thêm bảng token/phiên/kiểm toán trước khi viết kho lưu trữ xác thực.
5. Thêm lưu trữ thông báo hoặc phê duyệt rõ lưu trữ thông báo chỉ giả lập trước khi lập kế hoạch FE10.
6. Giữ dữ liệu khởi tạo an toàn: không email thật, không mật khẩu thô, không thông tin xác thực quản trị viên mặc định có thể dùng.

## Kết quả cổng Tuần 4

PASS SAU KHI SỬA. Kịch bản SQL hiện tại đã được sửa và kiểm thử smoke cục bộ. Vẫn cần nhóm rà soát trước khi merge vì lược đồ cơ sở dữ liệu là sản phẩm Core.

## Xác minh sửa lược đồ

Trạng thái: ĐÃ ĐẠT KIỂM THỬ SMOKE SQLCMD CỤC BỘ

Sau lần rà soát khoảng trống ban đầu, `database/Librarymanagement.sql` đã được sửa để xử lý các yếu tố chặn Tuần 4:

- Đã thêm lưu trữ token xác thực qua `AuthTokens`.
- Đã thêm các bảng lưu trữ thông báo.
- Đã thêm trường xác thực/trạng thái người dùng.
- Đã thêm bảng trạng thái thành viên.
- Đã thêm ràng buộc sách/bản sao/trạng thái.
- Đã thêm trường truy vết mượn, đặt chỗ, tiền phạt và kiểm toán.
- Đã thay giá trị mật khẩu khởi tạo không an toàn bằng hàm băm giữ chỗ demo không dùng cho production.
- Đã thêm `SET QUOTED_IDENTIFIER ON` và `SET ANSI_NULLS ON` để hỗ trợ chỉ mục lọc SQL Server.

Lệnh xác minh cục bộ:

```powershell
sqlcmd -S localhost -E -b -i database\Librarymanagement.sql
```

Kết quả: PASS trên SQL Server cục bộ `MSSQLSERVER`.

Kiểm tra sau khi chạy tìm thấy 20 bảng, gồm `AuthTokens`, `NotificationTemplates`, `Notifications` và `NotificationAttempts`.

## Phát hiện bổ sung về căn chỉnh trạng thái từ kiểm toán Giai đoạn 1

Trạng thái: CẦN HÀNH ĐỘNG TRƯỚC KHI TRIỂN KHAI TÍNH NĂNG

Kịch bản SQL đạt kiểm thử smoke cục bộ, nhưng lần kiểm toán SPEC Giai đoạn 1 sau đó phát hiện khoảng trống căn chỉnh enum/trạng thái phải được giải quyết trước khi triển khai kho lưu trữ và dịch vụ:

| ID | Mức độ | Khu vực | Yêu cầu SPEC | Khoảng trống SQL hiện tại | Hành động bắt buộc |
| --- | --- | --- | --- | --- | --- |
| DB-FOLLOWUP-001 | Cao | Mượn FE07 | `BorrowDetails.Status` phải hỗ trợ các trạng thái vòng đời được yêu cầu và hư hỏng/mất/đã trả. | `CK_BorrowDetails_Status` cho phép `BORROWED`, `RETURNED`, `OVERDUE`, `LOST`; không cho phép `REQUESTED` hay `DAMAGED`. | Thêm các giá trị trạng thái chi tiết FE07 đã phê duyệt trước khi triển khai FE07. |
| DB-FOLLOWUP-002 | Cao | Mượn FE07 | `BorrowRequests.Status` phải hỗ trợ `COMPLETED` khi mọi chi tiết ở trạng thái cuối. | `CK_BorrowRequests_Status` cho phép `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`; không cho phép `COMPLETED`. | Thêm `COMPLETED` trước khi triển khai quy trình trả FE07. |
| DB-FOLLOWUP-003 | Cao | Mượn FE07 | `BorrowDetails.DueDate` chỉ bắt buộc khi chi tiết mượn được phê duyệt/đã mượn. | `DueDate` là `NOT NULL`, mâu thuẫn với chi tiết được yêu cầu tạo trước khi phê duyệt. | Cho phép `DueDate` có thể rỗng đến khi phê duyệt hoặc sửa quy tắc dữ liệu FE07 đã phê duyệt. |
| DB-FOLLOWUP-004 | Trung bình | Đặt chỗ FE08 | Giá trị trạng thái đặt chỗ gồm `ACTIVE`, `CANCELLED`, `NOTIFIED`, `FULFILLED` và `EXPIRED`. | `CK_Reservations_Status` cho phép `ACTIVE`, `FULFILLED`, `CANCELLED`, `EXPIRED`; không cho phép `NOTIFIED`. | Thêm `NOTIFIED` hoặc cập nhật SPEC FE08 trước khi triển khai FE08. |
| DB-FOLLOWUP-005 | Trung bình | Thông báo FE10 | Giá trị trạng thái thông báo gồm `PENDING`, `SENT`, `DELIVERED`, `FAILED` và `SKIPPED`. | `CK_Notifications_Status` cho phép `PENDING`, `SENT`, `FAILED`, `CANCELLED`; không cho phép `DELIVERED` hay `SKIPPED`, đồng thời thêm `CANCELLED`. | Căn chỉnh giá trị trạng thái SQL và SPEC FE10 trước khi triển khai FE10. |

Đây không phải yếu tố chặn SPEC Giai đoạn 1 nhưng là yếu tố chặn Tuần 4/triển khai.
