# SPEC.md - FE12 Báo cáo & Thống kê

# Phiên bản: 0.3.0

# Trạng thái: HOÀN THÀNH (`COMPLETE`); PR #89 ĐÃ HỢP NHẤT; CI VÀ AZURE ĐÚNG COMMIT ĐẠT

# Chủ sở hữu: Nhat

# Cập nhật lần cuối: 2026-08-01

# ID tính năng: FE12

# Thư mục tính năng: `.sdd/specs/feat-reporting-statistics/`

> Trạng thái phân phối hiện tại (2026-08-01): `COMPLETE` cho phạm vi Giai đoạn
> 1, điều kiện tiên quyết ngày nghiệp vụ v0.2.1 đã hợp nhất qua PR #81, phần phê
> duyệt kích hoạt v0.3.0 đã hợp nhất qua PR #80 và tổng quan vận hành đã hợp nhất
> qua PR #82. Đợt liên
> hoàn sau đó đã được H3 phê duyệt và tích hợp vào `main` tại `ba29dc0`.
> Hoàn tất `6189b1a` đã hợp nhất qua PR #89 thành `main@39092fb`; CI
> `30675444178` và môi trường thử nghiệm Azure `30675744992` đều đạt đúng commit.
> `TASKS.md` và `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`
> là nguồn thông tin chính thức về trạng thái triển khai hiện tại. Các nhãn `Not Started` cũ hơn,
> `PARTIAL`, `READY FOR REVIEW` hoặc đang chờ đánh giá được giữ lại bên dưới là
> ảnh chụp nhanh lịch sử về kế hoạch/bằng chứng, không phải trạng thái phân phối hiện tại.

> Nguồn chuẩn cho Báo cáo & Thống kê FE12. v0.1.5 giữ nguyên phạm vi báo cáo đã phê duyệt, đồng thời quy định rõ hành vi truy cập, bộ lọc trống, trạng thái không xác định, phân trang, kiểm toán và xuất; bắt buộc con người đánh giá lại.
>
> Bản sửa đổi v0.1.9 ghi nhận hành vi SQL `LIKE` tham số hóa hiện có cho
> tìm kiếm báo cáo và yêu cầu các tầng truy cập dữ liệu kiểm thử trong bộ nhớ giữ nguyên
> hành vi đó thay vì coi ký tự đại diện là ký tự chữ.
>
> Bản sửa đổi v0.2.0 biến danh sách cho phép tham số truy vấn của từng API thành ranh giới bắt buộc:
> mọi khóa không xác định đều trả về `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` an toàn trước khi
> thực thi tầng dịch vụ hoặc tầng truy cập dữ liệu báo cáo.
> Nhat đã phê duyệt bản sửa đổi bằng văn bản này vào 2026-07-27. Phê duyệt chỉ cho phép
> chuẩn bị PLAN/TASKS; chưa được tuyên bố là đã triển khai cho đến khi
> hoàn tất bằng chứng trước và sau khi sửa và các cổng nghiệm thu.
>
> Bản sửa đổi v0.2.1 triển khai do tầng dịch vụ quản lý `businessDate`, từ chối ngay và
> SQL/tính đồng nhất với bản trong bộ nhớ qua PR #81. Bản sửa đổi v0.3.0 tái sử dụng hợp đồng đó
> cho tổng quan vận hành; không mở lại hoặc nhân đôi điều kiện tiên quyết đã hoàn tất.

---

## 1. Tổng quan về tính năng

### 1.1 Tên tính năng

Báo cáo & Thống kê

### 1.2 Bối cảnh kinh doanh

Thủ thư và quản trị viên cần thông tin tóm tắt để hiểu hoạt động thư viện: khối lượng mượn, tài liệu đã trả/quá hạn, trạng thái tồn kho và thống kê người dùng/thành viên. Báo cáo hỗ trợ quyết định vận hành mà không buộc nhân viên kiểm tra thủ công các bản ghi cơ sở dữ liệu thô.

Báo cáo phải ở dạng chỉ đọc. Các tính năng nguồn vẫn chịu trách nhiệm tạo và cập nhật dữ liệu kinh doanh; FE12 chỉ tổng hợp và trình bày các số liệu đã được phê duyệt.

### 1.3 Mục tiêu / Kết quả

Hệ thống sẽ:

- Cho phép người dùng được phân quyền xem báo cáo mượn sách.
- Cho phép các tác nhân được ủy quyền xem báo cáo hàng tồn kho.
- Cho phép các tác nhân được ủy quyền xem số liệu thống kê của người dùng.
- Xác thực bộ lọc báo cáo.
- Tổng hợp dữ liệu từ các bảng nguồn mà không sửa đổi bản ghi nguồn.
- Bảo vệ báo cáo khỏi bị truy cập trái phép và để lộ dữ liệu cá nhân quá mức.

### 1.4 Mức phạm vi

- [ ] Đặc tả đầy đủ - logic nghiệp vụ cốt lõi, rủi ro cao, phải đúng ngay từ đầu
- [x] Đặc tả tiêu chuẩn - tính năng thông thường có quy tắc nghiệp vụ và xác thực
- [ ] Đặc tả nhẹ - UI đơn giản, tài liệu hoặc tính năng rủi ro thấp

---

## 2. Tác nhân và phân quyền

| Tác nhân | Mô tả | Quyền / Trách nhiệm |
| ----- | ----------- | --------------------------- |
| Thủ thư | Nhân viên thư viện | Xem cả ba báo cáo Giai đoạn 1: chỉ số mượn sách, tồn kho và người dùng. |
| Quản trị viên | Quản trị viên hệ thống | Xem cả ba báo cáo Giai đoạn 1: chỉ số mượn sách, tồn kho và người dùng. |
| Thành viên | Người dùng thư viện đã đăng ký | Không có quyền truy cập báo cáo dành cho nhân viên trong FE12. |
| Khách | Khách truy cập không được xác thực | Không có quyền truy cập báo cáo. |
| Các tính năng nguồn | Nguồn cung cấp dữ liệu nội bộ | Cung cấp dữ liệu nguồn qua các bản ghi cơ sở dữ liệu. |

---

## 3. Điều kiện tiên quyết

Tính năng này chỉ có thể bắt đầu khi:

- PRE-FE12-001: Tác nhân được xác thực.
- PRE-FE12-002: Tác nhân có vai trò được phép xem báo cáo được yêu cầu.
- PRE-FE12-003: Bảng nguồn báo cáo tồn tại và định nghĩa trạng thái được phê duyệt.
- PRE-FE12-004: Mọi khóa truy vấn báo cáo được cung cấp đều nằm trong danh sách cho phép chính xác của API ở Phần 11 và mọi giá trị đều đáp ứng quy tắc xác thực trong Phần 6 và 10.2.
- PRE-FE12-005: Báo cáo ở dạng chỉ đọc và không cập nhật dữ liệu nguồn.

---

## 4. Luồng chính

### MF-FE12-001: Xem báo cáo mượn

1. Thủ thư/quản trị viên mở báo cáo mượn.
2. Tác nhân chọn không có hoặc có nhiều bộ lọc đã phê duyệt: `q`, `fromDate`, `toDate`, `status`, `bookId`, `userId`, `page` hoặc `limit`.
3. Hệ thống từ chối các khóa truy vấn không xác định, sau đó xác thực các giá trị bộ lọc đã được phê duyệt trước khi thực hiện báo cáo.
4. Hệ thống đọc `BorrowRequests`, `BorrowDetails`, `BookCopies`, `Books` và dữ liệu thành viên liên quan.
5. Hệ thống tính các chỉ số mượn sách đã được phê duyệt.
6. Hệ thống hiển thị báo cáo mà không thay đổi dữ liệu mượn.

### MF-FE12-002: Xem báo cáo tồn kho

1. Thủ thư/quản trị viên mở báo cáo tồn kho.
2. Tác nhân chọn không có hoặc có nhiều bộ lọc đã phê duyệt: `q`, `categoryId`, `bookId`, `status`, `location`, `page` hoặc `limit`.
3. Hệ thống từ chối các khóa truy vấn không xác định, sau đó xác thực các giá trị bộ lọc đã được phê duyệt trước khi thực hiện báo cáo.
4. Hệ thống đọc `Books`, `BookCopies`, danh mục, tác giả và nhà xuất bản.
5. Hệ thống tính toán số liệu tồn kho được phê duyệt.
6. Hệ thống hiển thị số lượng hàng tồn kho và tóm tắt trạng thái.

### MF-FE12-003: Xem thống kê người dùng

1. Thủ thư/quản trị viên mở thống kê người dùng.
2. Tác nhân chọn không có hoặc có nhiều bộ lọc đã phê duyệt: `q`, `roleId`, `status`, `membershipStatus`, `fromDate`, `toDate`, `page` hoặc `limit`.
3. Hệ thống từ chối các khóa truy vấn không xác định, sau đó xác thực các giá trị bộ lọc được phê duyệt trước khi thực hiện báo cáo.
4. Hệ thống đọc `Users`, `UserRoles`, `Roles` và `Members`; trạng thái thành viên thời gian chạy và ngày phê duyệt đến từ `Members`.
5. Hệ thống tính các chỉ số người dùng/thành viên đã được phê duyệt.
6. Hệ thống hiển thị số liệu thống kê tổng hợp mà không để lộ các chi tiết cá nhân không cần thiết.

---

## 5. Luồng thay thế

### AF-FE12-001: Truy cập báo cáo trái phép

1. Khách, thành viên hoặc tác nhân trái phép yêu cầu báo cáo.
2. Hệ thống kiểm tra quyền của vai trò.
3. Hệ thống từ chối truy cập.

### AF-FE12-002: Bộ lọc không hợp lệ

1. Tác nhân gửi khóa truy vấn không xác định hoặc phạm vi ngày, trạng thái, vai trò, ID, tìm kiếm hoặc giá trị phân trang không hợp lệ.
2. Hệ thống từ chối khóa không xác định bằng `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` an toàn; giá trị sai định dạng, giá trị enum không được hỗ trợ và phạm vi không hợp lệ nhận phản hồi xác thực an toàn hiện có. ID dương đúng định dạng nhưng không có bản ghi nguồn khớp sẽ theo AF-FE12-003.
3. Tầng dịch vụ và tầng truy cập dữ liệu báo cáo không được thực thi.

### AF-FE12-003: Không có dữ liệu cho báo cáo

1. Tác nhân chọn các bộ lọc không khớp với bản ghi nào.
2. Hệ thống trả về báo cáo trống với số lượng bằng không.
3. Hệ thống không trả về lỗi.

### AF-FE12-004: Dữ liệu nguồn chưa đầy đủ

1. Bản ghi nguồn báo cáo thiếu các trường tùy chọn.
2. Hệ thống trả về `null` cho các trường hiển thị tùy chọn bị thiếu và nhóm trạng thái nguồn không được nhận dạng thành `UNKNOWN`; nó không âm thầm xóa bản ghi nguồn khỏi tổng số có thể lặp lại.
3. Hệ thống không thay đổi hồ sơ nguồn.

---

## 6. Quy tắc kinh doanh

Sử dụng các ID ổn định này cho các nhiệm vụ và bài kiểm tra.

- BR-FE12-001: Báo cáo ở dạng chỉ đọc và không được sửa đổi dữ liệu nguồn.
- BR-FE12-002: Khách và thành viên không thể truy cập báo cáo của nhân viên.
- BR-FE12-003: Quyền truy cập báo cáo phải được bảo vệ theo vai trò trên máy chủ; cả Thủ thư và Quản trị viên đều có thể truy cập báo cáo mượn, tồn kho và thống kê người dùng, còn Thành viên và Khách không được truy cập.
- BR-FE12-004: Báo cáo mượn phải dùng bản ghi mượn FE07 làm nguồn chuẩn. Các chỉ số theo kỳ mượn và sách được mượn nhiều nhất chỉ tính `BorrowDetails` ở trạng thái `BORROWED`, `RETURNED`, `LOST`, `DAMAGED` hoặc `OVERDUE`; `REQUESTED` chưa phải lượt mượn đã bàn giao nên không được tính. Mọi phép suy ra quá hạn phải dùng một ngày nghiệp vụ `Asia/Ho_Chi_Minh` do tầng dịch vụ tạo từ đồng hồ có kiểm soát và truyền tường minh xuống tầng truy cập dữ liệu; tầng truy cập dữ liệu không được tự đọc ngày hiện tại của máy chủ.
- BR-FE12-005: Báo cáo tồn kho phải dùng trạng thái FE06/BookCopies làm nguồn chuẩn.
- BR-FE12-006: Thống kê người dùng phải dùng dữ liệu FE11/Users/Roles làm nguồn chuẩn.
- BR-FE12-007: Thống kê tư cách thành viên, nếu hiển thị, phải dùng dữ liệu thành viên FE04 làm nguồn chuẩn.
- BR-FE12-008: FE12 phải thực thi chính xác danh sách cho phép tham số truy vấn của API trước khi chạy tầng dịch vụ hoặc tầng truy cập dữ liệu báo cáo. Báo cáo mượn chỉ chấp nhận `q`, `fromDate`, `toDate`, `status`, `bookId`, `userId`, `page`, `limit`; báo cáo tồn kho chỉ chấp nhận `q`, `categoryId`, `bookId`, `status`, `location`, `page`, `limit`; báo cáo người dùng chỉ chấp nhận `q`, `roleId`, `status`, `membershipStatus`, `fromDate`, `toDate`, `page`, `limit`. Mọi khóa khác trả về `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` an toàn mà không phản chiếu giá trị của khóa. Sau đó phải xác thực cú pháp của khóa đã phê duyệt, tư cách thành viên trong enum, ngày, tìm kiếm, ID và phân trang trước khi thực thi truy vấn; ID bộ lọc dương, đúng định dạng nhưng không khớp bản ghi nguồn là hợp lệ và tạo báo cáo trống.
- BR-FE12-009: Bộ lọc phạm vi ngày phải dùng giá trị `YYYY-MM-DD` hợp lệ với ngày bắt đầu <= ngày kết thúc. Với thống kê người dùng, phạm vi ngày chỉ giới hạn `newMembersByPeriod` theo `Members.ApprovedAt` khác null; một lần phê duyệt lịch sử vẫn được tính kể cả khi trạng thái tư cách thành viên/tài khoản hiện tại sau đó trở thành không hoạt động, còn số lượng tổng/trạng thái/vai trò vẫn là toàn cục nhưng chịu các bộ lọc không theo ngày.
- BR-FE12-010: Báo cáo phải dùng định nghĩa trạng thái đã phê duyệt từ các tính năng nguồn; trạng thái nguồn đã lưu nhưng không được nhận diện phải được nhóm vào `UNKNOWN` và vẫn tính trong tổng số có thể tái tạo.
- BR-FE12-011: Số liệu thống kê người dùng không được để lộ dữ liệu cá nhân không cần thiết.
- BR-FE12-012: Số lượng tổng hợp phải được tái tạo từ bản ghi nguồn.
- BR-FE12-013: Xuất CSV, PDF, bảng tính và các định dạng báo cáo khác hoàn toàn nằm ngoài phạm vi Giai đoạn 1; FE12 không cung cấp API hoặc điều khiển xuất.
- BR-FE12-014: Mỗi lần Thủ thư/Quản trị viên xem báo cáo thành công phải ghi một sự kiện kiểm toán an toàn, xác định tác nhân, loại báo cáo, dấu thời gian và kết quả thành công nhưng không chứa giá trị bộ lọc/truy vấn thô hay các hàng báo cáo đã trả về.
- BR-FE12-015: Các bản ghi chi tiết dùng `page=1`, `limit=20`, với `page>=1` và `limit=1..100`; thứ tự ổn định là mượn `BorrowDate DESC, BorrowDetailId DESC`, tồn kho `Title ASC, BookId ASC, CopyId ASC` và người dùng `UserId ASC`.
- BR-FE12-016: Mỗi báo cáo chấp nhận `q` tùy chọn, đã trim và tối đa 200 ký tự. Môi trường môi trường thực tế bind mẫu hiệu lực `%${q}%` làm giá trị SQL `LIKE` tham số hóa và không escape hoặc từ chối `%`, `_`, lớp/khoảng trong ngoặc vuông hay lớp ngoặc vuông phủ định; tầng truy cập dữ liệu báo cáo trong bộ nhớ phải mô phỏng các ngữ nghĩa không phân biệt hoa thường đó. Tìm kiếm mượn khớp tiêu đề sách, mã vạch, tên người dùng, email hoặc ID người dùng; tìm kiếm tồn kho khớp tiêu đề, mã vạch, vị trí hoặc ID sách; tìm kiếm người dùng khớp ID người dùng, vai trò, trạng thái tài khoản hoặc trạng thái tư cách thành viên. Tìm kiếm và các bộ lọc đã chọn được áp dụng trước khi tổng hợp và phân trang.

---

## 7. Yêu cầu chức năng

- FR-FE12-001: Khi tác nhân được ủy quyền xem báo cáo mượn, hệ thống phải trả về chính xác các chỉ số mượn và trường dữ liệu hàng được định nghĩa trong Phần 10.3. Tầng dịch vụ phải đọc đồng hồ đúng một lần cho yêu cầu, tạo `businessDate` dạng `YYYY-MM-DD` và truyền giá trị hợp lệ bắt buộc này cho cả tầng truy cập dữ liệu SQL và tầng truy cập dữ liệu trong bộ nhớ.
- FR-FE12-002: Khi tác nhân được ủy quyền xem báo cáo tồn kho, hệ thống phải trả về chính xác các chỉ số tồn kho và trường dữ liệu được định nghĩa trong Phần 10.3, đồng thời xác định các đầu sách có mức sẵn có thấp, tức còn không quá hai bản sao sẵn sàng để mượn.
- FR-FE12-003: Khi tác nhân được ủy quyền xem thống kê người dùng, hệ thống phải trả về chính xác các chỉ số và trường dữ liệu hàng của người dùng/thành viên được định nghĩa trong Phần 10.3, với bộ lọc ngày chỉ áp dụng cho mức tăng trưởng trong kỳ phê duyệt.
- FR-FE12-004: Nếu tác nhân không được ủy quyền thì hệ thống sẽ từ chối quyền truy cập báo cáo.
- FR-FE12-005: Nếu yêu cầu báo cáo chứa khóa truy vấn ngoài danh sách cho phép của API đã chọn, hệ thống phải trả về `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` an toàn trước khi chạy tầng dịch vụ hoặc tầng truy cập dữ liệu báo cáo. Nếu khóa được phê duyệt có cú pháp, tư cách thành viên trong enum, phạm vi ngày, độ dài tìm kiếm, ID, trang hoặc giới hạn không hợp lệ, hệ thống phải trả về lỗi xác thực an toàn hiện có trước khi thực thi truy vấn báo cáo.
- FR-FE12-006: Nếu các bộ lọc hợp lệ không khớp dữ liệu nào, kể cả ID nguồn không tồn tại nhưng đúng định dạng, hệ thống sẽ trả về các chỉ số tổng hợp bằng không và danh sách chi tiết trống.
- FR-FE12-007: Khi báo cáo được tạo, hệ thống sẽ không cập nhật dữ liệu nguồn.
- FR-FE12-008: Khi số liệu thống kê người dùng được tạo, hệ thống sẽ trả về dữ liệu tổng hợp theo mặc định thay vì chi tiết cá nhân thô.
- FR-FE12-009: Khi yêu cầu báo cáo được ủy quyền thành công, hệ thống phải ghi sự kiện kiểm toán xem báo cáo an toàn theo BR-FE12-014.
- FR-FE12-010: Khi trả về danh sách chi tiết, hệ thống sẽ áp dụng các giá trị mặc định, giới hạn phân trang đã được phê duyệt và thứ tự ổn định riêng cho từng báo cáo theo BR-FE12-015.
- FR-FE12-011: Khi nhân viên tìm kiếm hoặc lọc một báo cáo, hệ thống sẽ kết hợp `q` với tất cả các bộ lọc dành riêng cho báo cáo được cung cấp, tải lại các hàng và chỉ số máy chủ chuẩn, đồng thời tránh biểu ngữ tải thành công dư thừa.

---

## 8. Tiêu chí chấp nhận

- AC-FE12-001: Với Thủ thư hoặc Quản trị viên, khi xem báo cáo mượn, hệ thống hiển thị tổng số lượt mượn và số lượng theo trạng thái. Với cùng dữ liệu và `businessDate` cố định trước/sau hạn trả, SQL và trong bộ nhớ phải phân loại `BORROWED`/`OVERDUE` giống nhau; thiếu, sai định dạng hoặc ngày bất khả thi phải từ chối ngay trước khi truy vấn.
- AC-FE12-002: Với Thủ thư hoặc Quản trị viên, khi xem báo cáo tồn kho, hệ thống hiển thị số bản sao theo trạng thái và sách/danh mục tương ứng với bộ lọc; các đầu sách có 0-2 bản sao sẵn có xuất hiện trong danh sách mức sẵn có thấp. Bộ lọc trạng thái/vị trí chọn các sách và tổng số bản sao tương ứng nhưng phép tính mức sẵn có thấp vẫn phải xét toàn bộ bản sao sẵn có của những sách đã chọn.
- AC-FE12-003: Với Thủ thư hoặc Quản trị viên, khi xem thống kê người dùng trong một phạm vi ngày, số lượng tổng/trạng thái/vai trò vẫn là toàn cục và `newMembersByPeriod` chỉ gồm các lần phê duyệt trong phạm vi đó.
- AC-FE12-004: Với Khách hoặc Thành viên, khi yêu cầu báo cáo dành cho nhân viên, quyền truy cập bị từ chối.
- AC-FE12-005: Với bất kỳ một trong ba API báo cáo nhận `?bogus=1` hoặc khóa truy vấn không xác định khác, khi gửi yêu cầu, hệ thống trả về `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` an toàn và cả tầng dịch vụ lẫn tầng truy cập dữ liệu báo cáo đều không chạy. Với khóa đã phê duyệt có giá trị sai định dạng/không được hỗ trợ hoặc phạm vi phân trang/ngày không hợp lệ, lỗi xác thực an toàn hiện có được trả về trước khi truy vấn.
- AC-FE12-006: Với các bộ lọc hợp lệ không có dữ liệu khớp hoặc ID không xác định nhưng đúng định dạng, khi tạo báo cáo, hệ thống trả về số liệu tổng hợp bằng không và các hàng trống.
- AC-FE12-007: Với một yêu cầu báo cáo, khi báo cáo hoàn tất, không có bản ghi nghiệp vụ nguồn nào bị sửa đổi.
- AC-FE12-008: Dựa vào số liệu thống kê của người dùng, khi kết quả được trả về, các chi tiết hồ sơ cá nhân không cần thiết sẽ không bị lộ.
- AC-FE12-009: Với lần Thủ thư/Quản trị viên xem báo cáo thành công, khi phản hồi hoàn tất, một sự kiện kiểm toán an toàn ghi lại tác nhân, loại báo cáo, dấu thời gian và kết quả thành công mà không chứa bộ lọc thô hay hàng báo cáo.
- AC-FE12-010: Với các hàng báo cáo chi tiết không chỉ định phân trang, khi trả về, hệ thống áp dụng `page=1`, `limit=20` và thứ tự ổn định riêng của báo cáo; giới hạn không hợp lệ bị từ chối.
- AC-FE12-011: Với Thủ thư/Quản trị viên nhập văn bản tìm kiếm và bộ lọc báo cáo, khi áp dụng, việc lọc diễn ra trước tổng hợp/phân trang, các hàng người dùng được sắp xếp theo `userId` tăng dần và không hiển thị thông báo thành công “Đã tải dữ liệu”.

---

## 9. Trường hợp biên và xử lý lỗi

| ID | Trường hợp biên / Lỗi | Hành vi hệ thống dự kiến |
| -- | ----------------- | ------------------------ |
| EC-FE12-001 | Khách yêu cầu báo cáo | Trả về phản hồi chưa xác thực. |
| EC-FE12-002 | Thành viên yêu cầu báo cáo dành cho nhân viên | Trả về phản hồi bị cấm. |
| EC-FE12-003 | Phạm vi ngày không hợp lệ | Từ chối yêu cầu. |
| EC-FE12-004 | Bộ lọc trạng thái không được hỗ trợ | Từ chối yêu cầu. |
| EC-FE12-005 | ID danh mục/sách/thành viên/vai trò dương, đúng định dạng nhưng không có bản ghi nguồn khớp | Trả về số liệu tổng hợp bằng không và các hàng trống; không coi ID không xác định là sai định dạng. |
| EC-FE12-006 | Không có bản ghi khớp | Trả về số lượng bằng không và các hàng trống. |
| EC-FE12-007 | Giá trị trạng thái nguồn đã lưu không được nhận diện | Nhóm vào `UNKNOWN` và giữ bản ghi trong tổng số có thể tái tạo. |
| EC-FE12-008 | Truy vấn báo cáo hết thời gian | Trả về lỗi an toàn và ghi nhật ký an toàn. |
| EC-FE12-009 | Khoảng ngày hợp lệ nhưng lớn | Trả về chỉ số tổng hợp và danh sách chi tiết có phân trang theo giá trị mặc định/giới hạn đã phê duyệt; không thay thế bằng phản hồi chỉ có cảnh báo. |
| EC-FE12-010 | Thiếu trường nguồn tùy chọn | Sử dụng dự phòng an toàn trong hiển thị báo cáo. |
| EC-FE12-011 | Yêu cầu chứa một hoặc nhiều khóa truy vấn ngoài danh sách cho phép của API đã chọn | Trả về `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` an toàn trước khi chạy tầng dịch vụ/tầng truy cập dữ liệu; lỗi có thể nêu tên khóa nhưng không được đưa lại giá trị của khóa vào phản hồi. |

---

## 10. Yêu cầu về dữ liệu

### 10.1 Các thực thể liên quan

| Thực thể | Mục đích trong tính năng này |
| ------ | ----------------------- |
| Users | Nguồn thống kê người dùng và số lượng thành viên/nhân viên. |
| UserRoles | Nguồn thống kê người dùng theo vai trò. |
| Roles | Cung cấp tên vai trò. |
| Members | Nguồn đếm trạng thái hội viên tại thời điểm chạy và các kỳ tăng trưởng theo `ApprovedAt`. |
| Books | Nguồn siêu dữ liệu sách cho báo cáo tồn kho và mượn. |
| Categories | Nguồn nhóm tồn kho. |
| BookCopies | Nguồn để đếm trạng thái hàng tồn kho. |
| BorrowRequests | Nguồn đếm yêu cầu mượn và trạng thái. |
| BorrowDetails | Nguồn đếm tài liệu đã mượn/đã trả/quá hạn. |
| Fines | Không dùng trong ba báo cáo Giai đoạn 1 đã phê duyệt; mọi phần mở rộng báo cáo tiền phạt đều cần một bản sửa đổi đặc tả FE12 sau này. |

### 10.2 Các trường dữ liệu

| Trường | Kiểu | Bắt buộc | Xác thực / Ghi chú |
| ----- | ---- | -------- | ------------------ |
| fromDate | date | Không | Chính xác `YYYY-MM-DD`; phải <= `toDate` khi cung cấp cả hai. Với thống kê người dùng, chỉ áp dụng cho mức tăng trưởng `Members.ApprovedAt`. |
| toDate | date | Không | Chính xác `YYYY-MM-DD`; phải >= `fromDate` khi cung cấp cả hai và bao gồm toàn bộ ngày đã chọn. Với thống kê người dùng, chỉ áp dụng cho mức tăng trưởng `Members.ApprovedAt`. |
| status | string | Không | Phải là trạng thái đã phê duyệt cho loại báo cáo được chọn. |
| membershipStatus | string | Không | Chỉ dùng cho thống kê người dùng và phải là trạng thái tư cách thành viên FE04 đã phê duyệt. |
| categoryId | integer | Không | Dùng cho báo cáo tồn kho. |
| bookId | integer | Không | Dùng cho báo cáo mượn/tồn kho. |
| userId | integer | Không | Bộ lọc chỉ dành cho nhân viên khi được phê duyệt. |
| roleId | integer | Không | Dùng cho thống kê người dùng. |
| location | string | Không | Chỉ dùng cho báo cáo tồn kho; được xác thực theo hợp đồng bộ lọc tồn kho đã phê duyệt. |
| page | integer | Không | Mặc định là 1; phải là số nguyên từ 1 trở lên đối với danh sách chi tiết. |
| limit | integer | Không | Mặc định là 20; phải là số nguyên từ 1 đến 100. |
| q | string | Không | Tìm kiếm văn bản tự do đã trim, tối đa 200 ký tự, dùng các trường riêng của báo cáo trong BR-FE12-016. |

---

### 10.3 Hợp đồng phản hồi báo cáo

Cả ba API báo cáo đều trả về `{ metrics, rows, page, limit, totalRows }`. `rows` là các bản ghi chi tiết sau khi lọc; `metrics` được tính từ toàn bộ tập nguồn đã lọc trước khi phân trang.

| Báo cáo | Hợp đồng chỉ số | Các trường của danh sách chi tiết |
| ------ | ---------------- | --------------------- |
| Mượn | `activeLoans` đếm các chi tiết `BORROWED`; `overdueLoans` đếm các chi tiết `BORROWED` có hạn trả trước ngày nghiệp vụ `Asia/Ho_Chi_Minh` do tầng dịch vụ truyền xuống; `borrowCountByPeriod` nhóm các chi tiết lượt mượn thực tế đủ điều kiện theo `BorrowDate` (`YYYY-MM-DD`); `topBorrowedBooks` trả về tối đa 10 sách, sắp xếp theo số lượt mượn giảm dần, tiêu đề tăng dần, rồi `BookId` tăng dần. | `borrowDetailId`, `requestId`, `userId`, `bookId`, `copyId`, `status`, `borrowDate`, `dueDate`, `returnDate`. `OVERDUE` là trạng thái hiển thị suy ra cho một chi tiết `BORROWED` đã quá hạn. |
| Tồn kho | `totalBooks` đếm các sách riêng biệt trong phạm vi sách đã lọc; `totalCopies` đếm các bản sao đã lọc; `copiesByStatus` nhóm các bản sao đã lọc theo trạng thái FE06 được phê duyệt; `lowStockBooks` liệt kê các sách riêng biệt có 0..2 bản sao `AVAILABLE` hiệu lực, dùng toàn bộ mức sẵn có của từng sách đã chọn ngay cả khi bộ lọc trạng thái/vị trí thu hẹp các hàng. | `bookId`, `title`, `copyId`, `barcode`, `location`, `status`, `effectiveAvailability`. |
| Người dùng | `totalMembers` đếm người dùng có vai trò `Member`; `usersByStatus` nhóm người dùng theo trạng thái FE02 đã phê duyệt; `usersByRole` nhóm người dùng theo vai trò FE11; `membershipByStatus` nhóm trạng thái thành viên FE04 chuẩn; `newMembersByPeriod` nhóm mọi `Members.ApprovedAt` lịch sử khác null theo `YYYY-MM-DD` trong phạm vi yêu cầu, bất kể trạng thái tư cách thành viên/tài khoản hiện tại. | `userId`, `status`, `roles`, `membershipStatus`, `createdAt`, `approvedAt`; không có địa chỉ hồ sơ, số điện thoại, mật khẩu, token hoặc trường cá nhân không cần thiết. |

Bộ lọc ngày cho báo cáo mượn áp dụng cho `BorrowDate`; bộ lọc ngày cho thống kê người dùng chỉ áp dụng cho `newMembersByPeriod`; báo cáo hàng tồn kho không có bộ lọc ngày trong Giai đoạn 1.

---

## 11. Hợp đồng API / Giao diện

> Các API và cấu trúc yêu cầu/response dưới đây là hợp đồng chuẩn của Giai đoạn 1 cho tính năng này.

| Phương thức | API | Tác nhân | Yêu cầu | Phản hồi | Ghi chú |
| ------ | -------- | ----- | ------- | -------- | ----- |
| GET | `/api/reports/borrowing` | Thủ thư/Quản trị viên | Query: `q?, fromDate?, toDate?, status?, bookId?, userId?, page=1, limit=20` | `BorrowingReportResponse` từ Phần 10.3 | Thứ tự hàng ổn định: `BorrowDate DESC, BorrowDetailId DESC`. |
| GET | `/api/reports/inventory` | Thủ thư/Quản trị viên | Query: `q?, categoryId?, bookId?, status?, location?, page=1, limit=20` | `InventoryReportResponse` từ Phần 10.3 | Thứ tự hàng ổn định: `Title ASC, BookId ASC, CopyId ASC`. |
| GET | `/api/reports/users` | Thủ thư/Quản trị viên | Query: `q?, roleId?, status?, membershipStatus?, fromDate?, toDate?, page=1, limit=20` | `UserReportResponse` từ Phần 10.3 | Thứ tự hàng ổn định: `UserId ASC`; không có chi tiết hồ sơ cá nhân thô. |

Các trường truy vấn hiển thị cho mỗi API là danh sách cho phép chính xác, không phải ví dụ.
Trước mọi lệnh gọi tầng dịch vụ hoặc tầng truy cập dữ liệu báo cáo, khóa không xác định sẽ trả về
`400 { error: { code: "UNSUPPORTED_REPORT_QUERY_PARAMETER", message: "Unsupported report query parameter." } }`.
Lỗi an toàn có thể xác định khóa không được hỗ trợ trong chi tiết xác thực
có cấu trúc nhưng không được đưa lại giá trị của khóa vào phản hồi.

---

## 12. Yêu cầu phi chức năng

### 12.1 Bảo mật

- NFR-FE12-SEC-001: Các API báo cáo phải yêu cầu xác thực.
- NFR-FE12-SEC-002: Các API báo cáo phải thực thi quyền truy cập theo vai trò trên máy chủ.
- NFR-FE12-SEC-003: Thống kê người dùng phải tránh làm lộ dữ liệu cá nhân không cần thiết.
- NFR-FE12-SEC-004: Tên khóa truy vấn báo cáo phải khớp chính xác danh sách cho phép của API và các giá trị đã phê duyệt phải được xác thực trước khi chạy tầng dịch vụ/tầng truy cập dữ liệu, nhằm ngăn hành vi chưa được rà soát, truyền vào và truy vấn quá mức. Giá trị SQL vẫn phải được tham số hóa.

### 12.2 Tính toàn vẹn chỉ đọc

- NFR-FE12-INT-001: Việc tạo báo cáo không được tạo, cập nhật hoặc xóa bản ghi nghiệp vụ nguồn.
- NFR-FE12-INT-002: Chỉ số báo cáo phải truy vết được tới bảng nguồn và định nghĩa trạng thái đã phê duyệt.

### 12.3 Hiệu năng

- NFR-FE12-PERF-001: Truy vấn báo cáo phải áp dụng trong cơ sở dữ liệu mọi bộ lọc đã phê duyệt được cung cấp trước khi tổng hợp và phân trang; không được lọc toàn bộ nguồn ở tầng ứng dụng.
- NFR-FE12-PERF-002: Các hàng báo cáo chi tiết phải sử dụng `page=1`, `limit=20`, giới hạn `page>=1`, `limit=1..100` và thứ tự ổn định được xác định bởi BR-FE12-015.
- NFR-FE12-PERF-003: Các phép join và bộ lọc báo cáo phải dùng đường dẫn khóa chính/khóa ngoại đã phê duyệt cùng các trường trạng thái/ngày đã có chỉ mục; không được lặp tra cứu từng hàng không giới hạn.

### 12.4 Ghi nhật ký và kiểm toán

- NFR-FE12-LOG-001: Lỗi truy cập báo cáo phải được ghi nhật ký an toàn.
- NFR-FE12-LOG-002: Mọi lần Thủ thư/Quản trị viên xem báo cáo thành công phải được kiểm toán mà không chứa giá trị truy vấn/bộ lọc thô, hàng báo cáo, token hoặc lỗi nội bộ.

### 12.5 Khả năng sử dụng

- NFR-FE12-UX-001: Bộ lọc báo cáo và trạng thái kết quả bằng không phải dễ hiểu.
- NFR-FE12-UX-002: Các số liệu phải sử dụng nhãn và đơn vị rõ ràng.

---

## 13. Ngoài phạm vi

Tính năng này không bao gồm:

- Chỉnh sửa bản ghi mượn, tồn kho, người dùng, thành viên, tiền phạt hoặc đặt chỗ.
- Xử lý mượn/trả.
- Quản lý bản sao sách.
- Quản lý người dùng/vai trò.
- Tính hoặc thu tiền phạt.
- Công cụ BI bên ngoài hoặc kho phân tích.
- Xuất CSV/PDF/bảng tính hoặc định dạng báo cáo khác trong Giai đoạn 1.
- Trang tổng quan thời gian thực trừ khi được phê duyệt.

---

## 14. Phụ thuộc

| Phụ thuộc | Loại | Ghi chú |
| ---------- | ---- | ----- |
| FE06 Quản lý tồn kho / Bản sao sách | Nội bộ | Cung cấp trạng thái bản sao và dữ liệu nguồn tồn kho. |
| FE07 Quản lý mượn | Nội bộ | Cung cấp dữ liệu nguồn mượn và trả. |
| FE09 Quản lý tiền phạt | Nội bộ | Cung cấp dữ liệu tiền phạt nếu được đưa vào phạm vi báo cáo sau này. |
| FE11 Quản lý người dùng & vai trò | Nội bộ | Cung cấp dữ liệu người dùng/vai trò và quyền báo cáo. |
| FE04 Quản lý tư cách thành viên | Nội bộ | Cung cấp dữ liệu đơn đăng ký/trạng thái tư cách thành viên. |
| Cơ sở dữ liệu SQL Server | Kỹ thuật | Lưu dữ liệu nguồn báo cáo. |

---

## 15. Câu hỏi đã được giải quyết

| ID | Quyết định đã phê duyệt | Nguồn | Trạng thái |
| -- | ----------------- | ------ | ------ |
| Q-FE12-001 | Thủ thư và Quản trị viên có thể xem cả ba báo cáo (mượn, tồn kho, người dùng); Thành viên/Khách không thể xem báo cáo FE12 nào. | Gói đánh giá 2026-06-10; chuẩn hóa 2026-07-17 | APPROVED |
| Q-FE12-002 | Chỉ số mượn: lượt mượn đang hoạt động, lượt mượn quá hạn, số lượt mượn theo kỳ, sách được mượn nhiều nhất. Chỉ số theo kỳ mượn và sách đứng đầu loại trừ `REQUESTED` và chỉ tính các trạng thái lượt mượn thực tế: `BORROWED`, `RETURNED`, `LOST`, `DAMAGED` và `OVERDUE`. | Gói đánh giá 2026-06-10; khắc phục đánh giá cuối 2026-07-13 | APPROVED |
| Q-FE12-003 | Chỉ số tồn kho: tổng số sách, tổng số bản sao, bản sao theo trạng thái và đầu sách có mức sẵn có thấp, được định nghĩa là còn 0-2 bản sao sẵn có. | Gói đánh giá 2026-06-10; làm rõ B6 2026-07-13 | APPROVED |
| Q-FE12-004 | Thống kê người dùng: tổng số thành viên, người dùng hoạt động/không hoạt động và thành viên mới theo `Members.ApprovedAt`; phạm vi ngày chỉ ảnh hưởng kỳ thành viên mới. | Gói đánh giá 2026-06-10; làm rõ B6 2026-07-13 | APPROVED |
| Q-FE12-005 | Xuất CSV/PDF/bảng tính và mọi định dạng báo cáo khác hoàn toàn nằm ngoài phạm vi Giai đoạn 1. | Gói đánh giá 2026-06-10; chuẩn hóa 2026-07-17 | APPROVED |
| Q-FE12-006 | Truy cập báo cáo ghi nhật ký kiểm toán cho các lần Quản trị viên/Thủ thư xem báo cáo mà không lưu giá trị truy vấn/bộ lọc thô. | Gói đánh giá 2026-06-10; làm rõ B6 2026-07-13 | APPROVED |
| Q-FE12-007 | ID bộ lọc không xác định được định dạng đúng sẽ trả về một báo cáo trống; ID không đúng định dạng là lỗi xác thực. | Chuẩn hóa đặc tả 2026-07-17 | APPROVED |
| Q-FE12-008 | Các trạng thái nguồn liên tục không xác định được nhóm thành `UNKNOWN` và được giữ lại trong tổng số. | Chuẩn hóa đặc tả 2026-07-17 | APPROVED |
| Q-FE12-009 | Danh sách chi tiết dùng phân trang và thứ tự ổn định riêng cho từng báo cáo; khoảng ngày hợp lệ nhưng lớn không trả về phương án thay thế chỉ có cảnh báo. | Chuẩn hóa đặc tả 2026-07-17 | APPROVED |
| Q-FE12-010 | Phản hồi báo cáo dùng chính xác các chỉ số và trường dữ liệu trong Phần 10.3; danh sách sách được mượn nhiều nhất giới hạn ở 10 sách với quy tắc xếp hạng ổn định khi bằng điểm. | Chuẩn hóa hợp đồng báo cáo 2026-07-17 | APPROVED |
| Q-FE12-011 | Xử lý khóa truy vấn báo cáo không xác định như thế nào? | Nhat, 2026-07-27 | APPROVED: từ chối bằng `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` an toàn trước khi chạy tầng dịch vụ/tầng truy cập dữ liệu báo cáo; danh sách cho phép của API là chính xác. |

---

## 16. Ma trận truy vết

| ID yêu cầu | Trường hợp sử dụng liên quan | Trường hợp thử nghiệm liên quan | Trạng thái |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE12-001 | UC58, UC59, UC60 | FT59, FT60, FT61 | Hoàn thành |
| BR-FE12-002 | UC58, UC59, UC60 | FT59, FT60, FT61 | Hoàn thành |
| BR-FE12-003 | UC58, UC59, UC60 | FT59, FT60, FT61 | Hoàn thành |
| BR-FE12-004 | UC58 | FT59 | Hoàn thành |
| BR-FE12-005 | UC59 | FT60 | Hoàn thành |
| BR-FE12-006 | UC60 | FT61 | Hoàn thành |
| BR-FE12-007 | UC60 | FT61 | Hoàn thành |
| BR-FE12-008 | UC58, UC59, UC60 | Ma trận khóa chính xác trong `reportRoutes.test.js` cùng kiểm tra ranh giới HTTP trên Chromium | Hoàn thành |
| BR-FE12-009 | UC58, UC59, UC60 | FT59, FT60, FT61 | Hoàn thành |
| BR-FE12-010 | UC58, UC59, UC60 | FT59, FT60, FT61 | Hoàn thành |
| BR-FE12-011 | UC60 | FT61 | Hoàn thành |
| BR-FE12-012 | UC58, UC59, UC60 | FT59, FT60, FT61 | Hoàn thành |
| BR-FE12-013 | UC58, UC59, UC60 | `backend/tests/reportDeterministicPolicy.test.js` kiểm tra không có tuyến API/OpenAPI/giao diện xuất | Hoàn thành |
| BR-FE12-014 | UC58, UC59, UC60 | Các trường hợp kiểm toán lượt xem thành công an toàn trong `backend/tests/reportService.test.js`, `backend/tests/reportRoutes.test.js` | Hoàn thành |
| BR-FE12-015 | UC58, UC59, UC60 | Các trường hợp phân trang/thứ tự trong `backend/tests/reportDeterministicPolicy.test.js`, `backend/tests/reportRepository.test.js` | Hoàn thành |
| BR-FE12-016 | UC58, UC59, UC60 | Các trường hợp kết hợp `q`/bộ lọc và tương đương trường người dùng trong `backend/tests/reportRoutes.test.js`, `backend/tests/reportInMemoryParity.test.js` | Hoàn thành |
| FR-FE12-001 | UC58 | FT59 | Hoàn thành |
| FR-FE12-002 | UC59 | FT60 | Hoàn thành |
| FR-FE12-003 | UC60 | FT61 | Hoàn thành |
| FR-FE12-004 | UC58, UC59, UC60 | FT59, FT60, FT61 | Hoàn thành |
| FR-FE12-005 | UC58, UC59, UC60 | `reportRoutes.test.js` xác minh `UNSUPPORTED_REPORT_QUERY_PARAMETER` an toàn, không gọi tầng truy cập dữ liệu và giữ xác thực giá trị hiện có | Hoàn thành |
| FR-FE12-006 | UC58, UC59, UC60 | FT59, FT60, FT61 | Hoàn thành |
| FR-FE12-007 | UC58, UC59, UC60 | FT59, FT60, FT61 | Hoàn thành |
| FR-FE12-008 | UC60 | FT61 | Hoàn thành |
| FR-FE12-009 | UC58, UC59, UC60 | `backend/tests/reportService.test.js`, `backend/tests/reportRoutes.test.js` | Hoàn thành |
| FR-FE12-010 | UC58, UC59, UC60 | `backend/tests/reportDeterministicPolicy.test.js`, `backend/tests/reportRepository.test.js`, `backend/tests/reportContract.test.js` | Hoàn thành |
| FR-FE12-011 | UC58, UC59, UC60 | `backend/tests/reportRoutes.test.js`, `backend/tests/reportInMemoryParity.test.js`, `frontend/test/reportFrontend.test.js` | Hoàn thành |
| AC-FE12-001 | UC58 | FT59 | Hoàn thành |
| AC-FE12-002 | UC59 | FT60 | Hoàn thành |
| AC-FE12-003 | UC60 | FT61 | Hoàn thành |
| AC-FE12-004 | UC58, UC59, UC60 | FT59, FT60, FT61 | Hoàn thành |
| AC-FE12-005 | UC58, UC59, UC60 | Ma trận tuyến API của ba API cùng kiểm tra HTTP thực với `?bogus=runtime-secret-value` | Hoàn thành |
| AC-FE12-006 | UC58, UC59, UC60 | FT59, FT60, FT61 | Hoàn thành |
| AC-FE12-007 | UC58, UC59, UC60 | FT59, FT60, FT61 | Hoàn thành |
| AC-FE12-008 | UC60 | FT61 | Hoàn thành |
| AC-FE12-009 | UC58, UC59, UC60 | `backend/tests/reportService.test.js`, `backend/tests/reportRoutes.test.js` | Hoàn thành |
| AC-FE12-010 | UC58, UC59, UC60 | `backend/tests/reportDeterministicPolicy.test.js`, `backend/tests/reportRepository.test.js`, `backend/tests/reportContract.test.js` | Hoàn thành |
| AC-FE12-011 | UC58, UC59, UC60 | `backend/tests/reportInMemoryParity.test.js` kiểm tra tương đương tìm kiếm/lịch sử/thứ tự người dùng; `frontend/test/reportFrontend.test.js` kiểm tra hành vi không hiện thông báo thành công dư thừa | Hoàn thành |

### 16.1 Tóm tắt độ bao phủ

| Loại yêu cầu | Tổng số ID | ID được ánh xạ | Độ bao phủ |
| ---------------- | --------- | ---------- | -------- |
| Quy tắc kinh doanh (BR-FE12-*) | 16 | 16 | 100% |
| Yêu cầu chức năng (FR-FE12-*) | 11 | 11 | 100% |
| Tiêu chí chấp nhận (AC-FE12-*) | 11 | 11 | 100% |
| **Tổng** | **38** | **38** | **100%** |

> BR-FE12-013 được ánh xạ tới một kiểm tra hợp đồng ngoài phạm vi: chính việc không có API và điều khiển xuất được xác minh mà không triển khai hành vi xuất.

---

## 17. Danh sách kiểm tra rà soát

Danh sách kiểm tra phê duyệt Giai đoạn 1 (hoàn tất vào 2026-06-10):

- [x] Vai trò của người xem báo cáo đã được phê duyệt.
- [x] Các chỉ số mượn sách bắt buộc đã được phê duyệt.
- [x] Các chỉ số tồn kho bắt buộc đã được phê duyệt.
- [x] Số liệu thống kê người dùng cần thiết đã được phê duyệt.
- [x] Phạm vi xuất được phê duyệt hoặc được xác định rõ là ngoài phạm vi.
- [x] Hợp đồng API được phê duyệt trong SPEC.md hoặc được sao chép sang tệp hợp đồng API dùng chung chuyên biệt nếu nhóm tạo lại tệp đó.
- [x] Mọi tiêu chí chấp nhận đều có thể trở thành một bài kiểm tra.
## Hiệu chỉnh giao diện nhân viên 2026-07-22

- Các điều khiển tìm kiếm và lọc trên cả ba trang FE12 dùng hợp đồng truy vấn báo cáo chuẩn và chỉ hiển thị `metrics`, `rows` và `totalRows` được trả về; cấm dữ liệu dự phòng demo/biểu đồ.
- Các trang báo cáo sử dụng khoảng cách dưới cùng nhỏ gọn để nội dung có thể cuộn không kết thúc bằng một vùng trống quá khổ.

### Cổng danh sách cho phép tham số truy vấn v0.2.0

- [x] Xác định danh sách cho phép tham số truy vấn chính xác cho từng API báo cáo.
- [x] Xác định `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` an toàn trước khi thực thi tầng dịch vụ/tầng truy cập dữ liệu.
- [x] Duy trì xác thực giá trị đã phê duyệt, báo cáo trống cho ID không xác định, SQL tham số hóa và hành vi chỉ đọc.
- [x] Nhat đã trực tiếp đánh giá và phê duyệt bản SPEC v0.2.0 bằng văn bản vào 2026-07-27; PLAN/TASKS có thể tiếp tục, còn triển khai vẫn bị chặn trong khi chờ phê duyệt kế hoạch.

## 18. Phụ lục tổng quan vận hành và nguồn thời gian nhất quán v0.3.0

Đợt: `BATCH-FE07-FE12-CONNECTED-DEMO-2026-07-29`.

### 18.1 Quy tắc kinh doanh

- BR-FE12-017: Tổng quan vận hành là một bản tổng hợp chỉ đọc đã phân quyền, không
  được ghép từ danh sách phân trang ở frontend.
- BR-FE12-018: Sáu KPI dùng các trạng thái nguồn đã được quy định: yêu cầu `PENDING`, chi
  tiết `BORROWED`, `BORROWED` quá hạn, reservation `ACTIVE|NOTIFIED`, bản sao
  khả dụng hiệu lực có `Books.Status = 'ACTIVE'` và
  `BookCopies.Status = 'AVAILABLE'`, cùng sách `ACTIVE` có 0..2 bản sao
  `AVAILABLE`. Sách không hoạt động bị loại khỏi `availableCopies` và
  `lowStockBooks`.
- BR-FE12-019: KPI thiếu hoặc lỗi không được hiển thị thành số `0`.
- BR-FE12-020: Mọi phép phân loại quá hạn FE12 phải dùng một `businessDate`
  được tầng dịch vụ tạo từ đồng hồ có kiểm soát theo `Asia/Ho_Chi_Minh` và truyền rõ
  cho SQL/trong bộ nhớ tầng truy cập dữ liệu; tầng truy cập dữ liệu không được tự gọi `new Date()`.

### 18.2 Yêu cầu chức năng

- FR-FE12-012: Cung cấp `GET /api/reports/operations-summary`.
- FR-FE12-013: API chỉ cho `LIBRARIAN|ADMIN`, từ chối Member/Guest và có
  danh sách cho phép truy vấn rỗng.
- FR-FE12-014: Trả sáu KPI cùng `generatedAt`; `generatedAt` và `businessDate`
  được suy ra từ cùng một lần đọc đồng hồ. Tầng dịch vụ truyền `businessDate` rõ ràng
  cho cả báo cáo mượn hiện hành và tổng quan vận hành; SQL tầng truy cập dữ liệu và
  trong bộ nhớ tầng truy cập dữ liệu phải có cùng chữ ký/ngữ nghĩa.
- FR-FE12-015: Trang tổng quan dùng liên kết xem chi tiết cố định tới FE07/FE08/các báo cáo FE12
  hiện có và không tự tính KPI.

### 18.3 Tiêu chí chấp nhận và truy vết

- AC-FE12-012: Librarian/Admin nhận đúng sáu KPI bản tổng hợp và liên kết xem chi tiết cố định,
  ánh xạ `AT-010`.
- AC-FE12-013: Member/Guest không nhận dữ liệu tổng quan vận hành, ánh xạ
  `AT-011`.
- AC-FE12-014: KPI lỗi/thiếu hiển thị trạng thái không tải được, không phải
  `0`.
- AC-FE12-015: Luồng chính trên màn hình 1440x900 phản ánh trạng thái đã commit, ánh
  xạ `AT-012`.
- AC-FE12-016: Với đồng hồ tầng dịch vụ cố định trước/sau hạn trả, hợp đồng SQL,
  kết quả trong bộ nhớ và phản hồi HTTP phân loại quá hạn giống nhau, không phụ
  thuộc ngày thật của máy chủ, ánh xạ `AT-013`.

Triển khai phải đi qua `SL-005` và `SL-006`; phát hiện mốc chuẩn SIT-002/SIT-008
chỉ được sửa bằng đồng hồ truyền vào theo `BR-FE12-020`, không đổi trạng thái mong đợi
để che sai lệch.
