# Xác thực điều hướng và quyền Quản trị viên FE11 - 2026-07-19

Trạng thái: HOÀN TẤT TÍCH HỢP B7

Phạm vi: chỉ `FE11-PERM01..FE11-PERM06` / `TD-023`

Quyết định: Hybrid SDD + ADD, độ sâu Tiêu chuẩn. Core là phân quyền ưu tiên Quản trị viên, quyền sở hữu chính xác chính sách/API, quyền sở hữu FE11/FE12 và cô lập lỗi; Shell là phần trình bày đáp ứng chỉ đọc.

## L1 - Bằng chứng tự động

### Đường cơ sở sạch

| Lệnh | Kết quả |
| --- | --- |
| `npm.cmd test` trong `backend/` | 36 bộ, 600/600 kiểm thử PASS |
| `npm.cmd test` trong `frontend/` | 113/113 kiểm thử PASS |

### RED quan sát được

- RED dịch vụ: 2/2 kiểm thử thất bại với `TypeError: adminService.getPermissions is not a function`.
- RED tuyến: 4/4 kiểm thử thất bại với HTTP 404 vì `/api/admin/permissions` không tồn tại.
- RED ranh giới frontend: sáu lỗi làm lộ việc thiếu bộ chuyển đổi API Quản trị viên, thiếu mô-đun tiện ích, điều hướng Tư cách thành viên lỗi thời, trạng thái Quyền không thể truy cập và ma trận được mã hóa cứng.
- RED trình trợ giúp frontend: sau khi có ranh giới nhập, 3/3 khẳng định thất bại đối với tổng hợp vai trò, độ bao phủ mô-đun và suy ra ô ma trận.

### GREEN và hồi quy

| Lệnh | Kết quả |
| --- | --- |
| Lệnh tập trung cho Dịch vụ cùng Dịch vụ Kiểm toán | 2 bộ, 132/132 kiểm thử PASS |
| Lệnh tập trung cho dịch vụ/tuyến Quyền cùng Kiểm toán/bảo mật | 4 bộ, 28/28 kiểm thử PASS |
| Lệnh tập trung cho API/trình trợ giúp/trang/App Shell frontend | 38/38 kiểm thử PASS |
| `npm.cmd --prefix backend test` | 38 bộ, 606/606 kiểm thử PASS |
| `npm.cmd --prefix frontend test` | 120/120 kiểm thử PASS |
| `npm.cmd --prefix backend run test:coverage:ci` | 38 bộ, 606/606 kiểm thử PASS |
| `npm.cmd --prefix frontend run lint` | PASS với không có cảnh báo |
| `npm.cmd --prefix frontend run build` | PASS; cảnh báo hiện có và không gây chặn về kích thước gói vẫn còn |
| Phân tích YAML OpenAPI | `OpenAPI OK` |
| Nhập kiểm tra sức khỏe backend | `Backend app import OK` |
| `npm.cmd run trace:enforce` | PASS |
| `npm.cmd run test:e2e` | Luồng chuẩn Chromium 1/1 PASS |
| `git diff --check` | PASS |
| So sánh phạm vi chính xác | PASS; chính xác 21 tệp TD-023 đã phê duyệt |
| Quét sai lệch sản phẩm | PASS; không có ma trận mã hóa cứng, mục Tư cách thành viên ở thanh bên, phần vai trò hay điểm cuối tổng hợp trùng lặp |
| Quét thuật ngữ nhạy cảm với độ tin cậy cao | PASS sau rà soát; kết quả khớp chỉ là tài liệu phân quyền, tuyên bố an toàn phủ định, thiết lập JWT kiểm thử ngẫu nhiên và tiêu đề bearer giả |

Độ bao phủ:

- Câu lệnh: 92.51% (791/855)
- Nhánh: 82.46% (536/650)
- Hàm: 97.1% (134/138)
- Dòng: 92.44% (783/847)

## L2 - Tuân thủ đặc tả

| Yêu cầu | Ranh giới mã | Bằng chứng kiểm thử |
| --- | --- | --- |
| `FR-FE11-030`, `AC-FE11-016`, `BR-FE11-016` | `Sidebar` chính xác gồm tám mục trong `UserManagement.jsx` | Kiểm thử hợp đồng mã nguồn có thứ tự chính xác cùng hồi quy App Shell |
| `FR-FE11-032`, `AC-FE11-017`, `BR-FE11-017` | Chính sách bất biến, DTO dịch vụ mới, tuyến/bộ điều khiển Quản trị viên, bộ chuyển đổi/khung nhìn frontend | Kiểm thử dịch vụ chính xác 15 hàng, kiểm thử tuyến, kiểm thử bộ chuyển đổi/trình trợ giúp/trang |
| `FR-FE11-015`, `NFR-FE11-SEC-001/002` | `authenticate` rồi `requireAnyRole('ADMIN')` trước bộ điều khiển | Thiếu token trả 401 và Thành viên/Thủ thư nhận 403 mà không gọi dịch vụ |
| Quyết định quyền sở hữu TD-026 | `reportApi.users()` hiện có của FE12 cung cấp `usersByRole` | Kiểm thử hợp đồng mã nguồn trang và trình trợ giúp tổng hợp vai trò |
| Cô lập lỗi | Trạng thái/trình tải/bắt lỗi/nút thử lại riêng cho quyền và thống kê | Kiểm thử hợp đồng mã nguồn trang và rà soát mã |

Không có yêu cầu FE04, FE12 production, lược đồ, chỉnh sửa quyền, CRUD vai trò hay TD-025 nào được triển khai bởi phần khác biệt này.

## L3 - Hiến chương và an toàn

- Xác thực và phân quyền Quản trị viên thực thi trước bộ điều khiển; bên gọi không phải Quản trị viên không thể quan sát dữ liệu chính sách.
- Điểm cuối không chấp nhận đầu vào nghiệp vụ, không truy cập cơ sở dữ liệu và không gọi kho lưu trữ hay phương thức ghi.
- Dịch vụ trả về các khóa DTO trong danh sách cho phép rõ ràng cùng đối tượng lồng mới; bên gọi không thể chỉnh sửa chính sách đóng băng dùng chung.
- Vai trò được phép giới hạn ở `ADMIN`, `LIBRARIAN` và `MEMBER`, theo thứ tự xác định và không trùng lặp.
- Phản hồi không chứa dữ liệu thông tin xác thực, token, phiên, cá nhân, kiểm toán, nhà cung cấp hay hàm nội bộ.
- React hiển thị nhãn qua nút văn bản thông thường; không đưa vào đường dẫn chèn HTML hay `dangerouslySetInnerHTML`.
- Không đưa vào thay đổi lược đồ, phần phụ thuộc, triển khai xác thực, CORS, giới hạn tốc độ, bí mật hay môi trường.

## L4 - Bằng chứng chấp nhận

- Kiểm thử hợp đồng mã nguồn chứng minh thanh bên chứa chính xác Trang chủ, Bảng điều khiển, Thư viện, Quản lý Mượn, Quản lý Yêu cầu, Tất cả Người dùng, Quyền và Nhật ký Kiểm toán theo thứ tự.
- Mục Tư cách thành viên trên thanh bên không còn, trong khi mọi phần nhập, trạng thái, trình tải, thành phần và tuyến FE04 vẫn nguyên vẹn.
- Khung nhìn Quyền có thể truy cập và tải độc lập `adminApi.permissions()` cùng `reportApi.users()` của FE12.
- Số lượng vai trò dùng giá trị mặc định số không và chỉ dùng `usersByRole` của FE12; không dùng các hàng người dùng đã phân trang.
- Độ bao phủ mô-đun và ô ma trận chỉ được suy ra từ `allowedRoles` của FE11; không còn định nghĩa quyền frontend.
- Lỗi FE11 hoặc FE12 sau đó giữ lại dữ liệu thành công gần nhất tương ứng và hiển thị điều khiển thử lại độc lập.
- Hồi quy luồng chuẩn Chromium đạt trên máy tính/di động. Tương tác trình duyệt Quyền riêng cho tính năng sau khi đăng nhập vẫn là kiểm tra H2 thủ công còn lại.

## Bằng chứng tích hợp

- H2 đã phê duyệt phần khác biệt được rà soát và không thay đổi vào 2026-07-19; hàm băm phần khác biệt đóng băng: `8616b3624ce792d42693903d42a5f3396f54db65`.
- PR triển khai: https://github.com/SWP391-LibraryManagement/LibraryManagement/pull/37.
- Lần chạy `foundation-checks` của PR `29654621448` đã đạt với đầu nhánh `216f4cc5c0d54c6092852e2a9ecf7541f5ed393a`.
- H3 đã phê duyệt tích hợp cuối cùng và merge vào 2026-07-19.
- PR #37 được merge vào `main` thành `356130e4905a59d219bae8e9b369f7690348cba2`.
- Lần chạy CI `main` chính xác sau merge `29655548150` đã hoàn tất thành công.

## Rủi ro còn lại

- Bộ kiểm thử trình duyệt phát ra lỗi cấu hình SQL `/api/profile/me` đã tồn tại vì thiếu biến SQL Server cục bộ; luồng chuẩn vẫn đạt 1/1 và TD-023 không truy cập SQL.
- Bản dựng production frontend vẫn giữ cảnh báo hiện có và không gây chặn về kích thước phân đoạn.
- Luồng trình duyệt tự động hiện tại không mở phần Quyền mới; hợp đồng mã nguồn tập trung, toàn bộ kiểm thử frontend, lint và bản dựng bao phủ lát cắt này cục bộ.
- GitHub Actions báo cáo chú thích ngừng hỗ trợ thời gian chạy tác vụ Node.js 20 không gây chặn; quy trình bị buộc dùng Node.js 24 và đã đạt.

## Ranh giới hoàn tất B7

- `FE11-PERM01..FE11-PERM06` đã hoàn tất và `TD-023` được xử lý thông qua PR triển khai đã ghi nhận cùng bằng chứng CI sau merge.
- Lần hoàn tất này chỉ thay đổi bản ghi kế hoạch, tác vụ, kiểm thử, nhật ký thay đổi, xác thực và nợ FE11; không có thay đổi mã sản phẩm hay yêu cầu đã phê duyệt.
- Toàn bộ FE11 vẫn ở `Implementation State: DEFERRED` và `TD-025` vẫn mở.
