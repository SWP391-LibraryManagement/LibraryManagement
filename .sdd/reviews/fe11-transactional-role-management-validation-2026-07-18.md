# Xác thực Quản lý vai trò có giao dịch FE11

Ngày: 2026-07-18

Phạm vi: chỉ gán/thu hồi vai trò có giao dịch FE11-R01..R05

Phương pháp: SDD Đầy đủ, TDD ĐỎ-XANH, đánh giá bảo mật và bằng chứng B1-B7

## Quyết định

Phần triển khai giới hạn đã vượt qua xác thực tự động, đánh giá triển khai của con người, hợp nhất và CI sau hợp nhất. Bằng chứng bao phủ ranh giới tuyến, ánh xạ kết quả dịch vụ, giao dịch SQL có khóa, hành vi kiểm toán nguyên tử, toàn bộ bộ hồi quy backend, cổng độ bao phủ dự án, cổng truy vết và tích hợp vào `main`.

Công việc FE11 còn lại tiếp tục bị hoãn. Bản ghi này không tuyên bố hoàn thành chi tiết/cập nhật/vô hiệu hóa người dùng, trường Thủ thư, UI Quản trị viên, UI nhật ký kiểm toán hoặc các yêu cầu FE11 còn lại.

## Bằng chứng tự động L1

| Lệnh | Kết quả |
| --- | --- |
| `npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementService.test.js tests/userRoleRepository.test.js tests/userManagementRoutes.test.js` | PASS; 70/70 kiểm thử, 3/3 bộ |
| `npm.cmd --prefix backend test` | PASS; 399/399 kiểm thử, 29/29 bộ |
| `npm.cmd --prefix backend run test:coverage:ci` | PASS; câu lệnh 92.47%, nhánh 82.35%, hàm 97.1%, dòng 92.4% |
| Độ bao phủ Jest kho dữ liệu trọng tâm | PASS; câu lệnh 100%, nhánh 90.24%, hàm 100%, dòng 100% |
| `npm.cmd run trace:enforce` | PASS; FE11 báo cáo 13/38 FR được gắn thẻ (34%). Trình kiểm tra `main` hiện tại đọc trạng thái trên cùng là `APPROVED` và không thực thi FE11; giới hạn phỏng đoán trạng thái có từ trước đó nằm ngoài PR chỉ dành cho FE11 này. |
| `git diff --check origin/main...HEAD` | PASS |
| Lần chạy GitHub Actions `29631406399` trên commit hợp nhất `0e1ef8f` | PASS; `foundation-checks` hoàn tất thành công, gồm kiểm thử backend, tích hợp hệ thống, độ bao phủ, lint/kiểm thử/bản dựng frontend, E2E trình duyệt và nhập tình trạng backend. |

Bằng chứng ĐỎ quan sát được:

- Kiểm thử tuyến thất bại vì ID vai trò vẫn là chuỗi và ID không hợp lệ tới được dịch vụ.
- Kiểm thử kho dữ liệu thất bại vì `userRoleRepository.js` không tồn tại.
- Kiểm thử dịch vụ thất bại vì đường dẫn cũ vẫn gọi `userRepository.findRoleById` và trả về ngữ nghĩa không tất định.

## Tuân thủ đặc tả L2

- `FR-FE11-012..014`: việc gán/thu hồi hiện dùng một kho dữ liệu có giao dịch.
- `FR-FE11-017`: người dùng đang thao tác được xác thực lại là Quản trị viên đang hoạt động và tồn tại dưới khóa giao dịch.
- `FR-FE11-024..027`: các nhánh thiếu vai trò, gán trùng, thiếu ánh xạ và vai trò cuối trả về kết quả tất định mà không thay đổi.
- `BR-FE11-009` và `NFR-FE11-TXN-006`: các chủ thể giữ vai trò Quản trị viên đang hoạt động được cụ thể hóa dưới `UPDLOCK, HOLDLOCK` trước khi thu hồi Quản trị viên.
- `BR-FE11-010` và `NFR-FE11-TXN-003`: ánh xạ vai trò cùng kiểm toán commit hoặc hoàn tác cùng nhau.
- Đường dẫn endpoint công khai và việc đọc lại người dùng được quản lý an toàn không đổi.

## Hiến chương và an toàn L3

- Xác thực và phân quyền Quản trị viên chạy trước các bộ xác thực đầu vào vai trò.
- Giao dịch kiểm tra lại đặc quyền Quản trị viên đang hoạt động để vai trò token cũ không thể tự cho phép thao tác thay đổi.
- Mọi giá trị SQL dùng tham số có kiểu; giá trị yêu cầu không được nối vào SQL.
- Siêu dữ liệu kiểm toán chỉ chứa ID/tên vai trò và ngữ cảnh yêu cầu; không thêm mật khẩu, token, phiên hoặc liên kết thiết lập.
- Lỗi kho dữ liệu ngoài dự kiến được giữ lại cho bộ xử lý lỗi an toàn trung tâm; kết quả nghiệp vụ không xác định ánh xạ tới lỗi nội bộ chung.
- Không thay đổi lược đồ cơ sở dữ liệu, xử lý thông tin xác thực, hành vi frontend hoặc mã tính năng không liên quan.

## Chấp thuận và rủi ro còn lại L4

Đánh giá triển khai của con người được phê duyệt vào 2026-07-18. `FE11-R05` đã hoàn thành cho lát cắt giới hạn này.

PR #25 được hợp nhất vào `main` dưới dạng `0e1ef8f67e2d7a454e96b8b5d6878d31ed03eae0`. Lần chạy CI sau hợp nhất `29631406399` đạt, nên tích hợp B7 hoàn thành cho lát cắt giới hạn này.

Rủi ro còn lại:

- Mệnh đề khóa SQL và nhánh giao dịch được kiểm thử đơn vị, nhưng không có môi trường SQL Server dùng một lần cho kiểm thử đồng thời hai phiên thật.
- Việc đọc lại người dùng được quản lý an toàn xảy ra sau commit; lỗi đọc hiếm gặp sau commit có thể trả về lỗi sau khi thao tác thay đổi đã commit.
- Ngữ nghĩa cập nhật/vô hiệu hóa người dùng FE11 còn lại và Quản trị viên đang thao tác được theo dõi bởi `TD-012`, `TD-014` và `TD-015`.
- Rủi ro bỏ qua frontend trong phát triển vẫn được theo dõi riêng dưới `TD-017`.
- Trình kiểm tra truy vết `main` hiện tại suy ra việc thực thi từ trạng thái cấp cao nhất dễ đọc; sửa siêu dữ liệu trạng thái toàn kho mã vẫn nằm ngoài PR chỉ dành cho FE11 này.

## Các tệp đã thay đổi

- `backend/src/repositories/userRoleRepository.js`
- `backend/src/repositories/userRepository.js`
- `backend/src/services/userManagementService.js`
- `backend/src/routes/userManagementRoutes.js`
- `backend/src/validators/userManagementValidators.js`
- `backend/tests/userRoleRepository.test.js`
- `backend/tests/userManagementService.test.js`
- `backend/tests/userManagementRoutes.test.js`
- `PLAN.md`, `TASKS.md`, `TEST_PLAN.md` và `CHANGELOG.md` của FE11
- `TECH_DEBT.md`

## Công việc FE11 còn lại

Các lát cắt thiết lập tài khoản và vai trò có giao dịch có bằng chứng tự động. Đối soát DTO danh sách/chi tiết người dùng, cập nhật lạc quan, vô hiệu hóa nguyên tử, trường Thủ thư, UI bảng điều khiển/quyền/kiểm toán/yêu cầu Quản trị viên và các yêu cầu FE11 bị hoãn khác vẫn nằm ngoài xác thực này.
