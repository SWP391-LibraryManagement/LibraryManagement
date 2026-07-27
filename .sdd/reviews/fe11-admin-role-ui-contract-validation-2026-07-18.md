# Xác thực hợp đồng UI Vai trò Quản trị viên FE11

Ngày: 2026-07-18

Phạm vi: chỉ FE11-UIR01..UIR05 / TD-022

Trạng thái: TÍCH HỢP B7 HOÀN THÀNH

## Bằng chứng tự động L1

| Kiểm tra | Kết quả |
| --- | --- |
| Frontend trọng tâm | PASS - 12/12 kiểm thử xuyên hợp đồng API FE11 và trang Quản trị viên |
| Toàn bộ frontend | PASS - 101/101 kiểm thử |
| Lint frontend | PASS |
| Bản dựng frontend production | PASS; khuyến cáo kích thước gói hiện có vẫn không chặn |
| Hồi quy vai trò backend trọng tâm | PASS - 3 bộ, 105/105 kiểm thử |
| Thực thi truy vết | PASS |
| Kiểm tra diff | PASS so với `origin/main...HEAD` |
| Kiểm tra phạm vi | PASS - backend, cơ sở dữ liệu, `SPEC.md` FE11 và các phụ thuộc không đổi |
| Quét bảo mật | PASS - không thêm phép gán bí mật, vật liệu khóa, ID vai trò mã hóa cứng hoặc phương án dự phòng thay đổi theo tên vai trò |
| Lần chạy CI PR #30 `29643619999` | PASS - `foundation-checks` hoàn tất thành công trước hợp nhất |
| Lần chạy CI `main` sau hợp nhất `29644292781` | PASS - `foundation-checks` hoàn tất thành công trên commit hợp nhất `c20d3251` |

Bằng chứng ĐỎ-XANH quan sát được:

- `FE11-UIR01`: ĐỎ làm lộ yêu cầu gán/thu hồi `roleName` cũ; XANH đạt 6/6 kiểm thử API trọng tâm với `roleId` dạng số.
- `FE11-UIR02`: ĐỎ tạo ra hai lỗi hợp đồng danh mục; XANH đạt 4/4 kiểm thử trang Quản trị viên trọng tâm với xác thực danh mục dương/duy nhất đầy đủ.
- `FE11-UIR03`: ĐỎ làm lộ các vòng lặp tên vai trò trực tiếp và nhánh không thao tác còn thiếu; XANH đạt 5/5 kiểm thử trang Quản trị viên trọng tâm với lập kế hoạch trước và thứ tự gán trước thu hồi.
- `FE11-UIR04`: ĐỎ làm lộ việc thiếu tải lại đích và đồng bộ hộp thoại; XANH đạt 6/6 kiểm thử trang Quản trị viên trọng tâm với đối soát và khóa Lưu khi chưa đồng bộ.

Lệnh xác thực:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/userRoleRepository.test.js
node --test frontend/test/userManagementFrontend.test.js frontend/test/userManagementApi.test.js
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check origin/main...HEAD
```

## Tuân thủ đặc tả L2

- `FR-FE11-012` / `AC-FE11-013`: việc gán hiện chỉ đi qua ranh giới API frontend dưới dạng `{ roleId: number }`, với ID được phân giải từ dữ liệu `GET /api/users/roles` đã xác thực.
- `FR-FE11-013` / `AC-FE11-014`: việc thu hồi hiện dùng đoạn đường dẫn `roleId` dạng số và không bao giờ nội suy tên vai trò.
- `FR-FE11-014` / `AC-FE11-015`: quy tắc Quản trị viên cuối có khóa ở backend hiện có không đổi và vượt qua hồi quy vai trò trọng tâm gồm 105 kiểm thử.
- `FR-FE11-024..027`: xác thực backend và kết quả vai trò tất định vẫn có thẩm quyền; hộp thoại hiển thị lỗi an toàn đã ánh xạ và tải lại đích sau thao tác thay đổi thất bại đầu tiên.
- `BR-FE11-007..009`: diff có thể chỉnh sửa đầy đủ được xác thực trước yêu cầu, việc gán chạy trước thu hồi, lưu không thao tác không gửi thay đổi và vai trò hiện có không thể chỉnh sửa được giữ nguyên.
- `PRE-FE11-004`: chỉ danh mục đầy đủ cho `ADMIN`, `LIBRARIAN` và `MEMBER` với ID dương duy nhất mới bật luồng vai trò; dữ liệu danh mục không hợp lệ hoặc còn thiếu chặn thay đổi mà không có phương án dự phòng mã hóa cứng.
- `Implementation State: DEFERRED` của toàn tính năng không đổi và không tuyên bố hành vi FE11 không liên quan nào hoàn thành.

## Hiến chương và an toàn L3

- ID vai trò chỉ đến từ danh mục vai trò đã xác thực và được chuẩn hóa thành số nguyên dương duy nhất trước khi thay đổi.
- `requireAdminSession` frontend vẫn là bộ bảo vệ khả năng sử dụng; phân quyền backend, xác thực, hành vi giao dịch có khóa và quyền sở hữu kiểm toán vẫn là nguồn thẩm quyền bảo mật và không đổi.
- Việc gán, thu hồi, đọc danh mục và đọc đối soát tiếp tục qua vỏ yêu cầu được cho phép.
- Kế hoạch tên-sang-ID đầy đủ được tạo trước yêu cầu đầu tiên, ngăn công việc một phần do danh mục cục bộ không hợp lệ gây ra.
- Lỗi API an toàn được hiển thị dưới dạng văn bản React; không đưa vào dấu vết ngăn xếp, chi tiết SQL, thông tin xác thực hoặc dữ liệu token.
- Không bao gồm thay đổi backend, lược đồ, phụ thuộc, cấu hình production, `SPEC.md` FE11, bí mật hoặc thông tin xác thực.
- Đánh giá bảo mật không tìm thấy vấn đề cần xử lý trong diff giới hạn.

## Chấp thuận và rủi ro còn lại L4

- Đường dẫn thành công đáp ứng hợp đồng gán/thu hồi dạng số đã phê duyệt và chuỗi gán trước thu hồi tất định.
- Việc lưu UI nhiều yêu cầu không nguyên tử. Ranh giới khôi phục đã phê duyệt là dừng ở lỗi đầu tiên, tải lại đích có thẩm quyền, giữ hộp thoại mở và tắt Lưu nếu lần tải lại đó cũng thất bại.
- Kiểm thử Node frontend xác minh hợp đồng điều phối nguồn/API; không thêm kiểm thử tương tác trình duyệt riêng theo vai trò mới. E2E trình duyệt hiện có vẫn là bằng chứng hồi quy CI.
- Thực thi Quản trị viên cuối đồng thời trên SQL Server thật vẫn phụ thuộc môi trường; hồi quy kho dữ liệu/dịch vụ/tuyến backend không đổi vẫn là ranh giới tự động cho lát cắt này.
- Bản dựng Vite giữ khuyến cáo khối lớn có từ trước; nó không liên quan TD-022.
- Điều hướng, Quyền, Nhật ký kiểm toán, Quản lý yêu cầu, cập nhật/vô hiệu hóa, sai lệch vỏ danh sách và mọi nợ FE11 khác vẫn bị hoãn.

## Các tệp đã thay đổi

- Kế hoạch/bằng chứng FE11: `PLAN.md`, `TASKS.md`, `TEST_PLAN.md`, `CHANGELOG.md`, `TECH_DEBT.md`, thiết kế/kế hoạch triển khai đã phê duyệt và bản ghi xác thực này.
- API frontend: `frontend/src/api/userManagementApi.js` và kiểm thử hợp đồng trọng tâm của nó.
- Luồng vai trò Quản trị viên: `frontend/src/page/UserManagement.jsx` và các kiểm thử danh mục/thứ tự/đối soát trọng tâm của nó.
- Không có tệp backend, cơ sở dữ liệu, lược đồ, phụ thuộc hoặc `SPEC.md` FE11 nào thay đổi.

## Cổng đánh giá của con người

Được phê duyệt vào 2026-07-18. Người đánh giá đã phê duyệt phần triển khai, bằng chứng tự động, phạm vi giới hạn và rủi ro đối soát nhiều yêu cầu đã ghi tài liệu. PR #30 và CI sau hợp nhất hiện đáp ứng cổng tích hợp còn lại, nên `FE11-UIR05` đã hoàn thành.

## Trạng thái tích hợp

Hoàn thành. PR #30 được hợp nhất vào `main` dưới dạng `c20d3251254467a1543355f18c705590724f5b55`; lần chạy CI sau hợp nhất `29644292781` đạt toàn bộ `foundation-checks`. `TD-022` được giải quyết cho lát cắt giới hạn này. `Implementation State: DEFERRED` của toàn tính năng và nợ FE11 không liên quan không đổi.
