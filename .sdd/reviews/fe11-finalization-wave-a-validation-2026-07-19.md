# Xác thực Đợt A hoàn thiện FE11 - 2026-07-19

Trạng thái: SẴN SÀNG H2 - CHƯA COMMIT

Phạm vi: `FE11-FIN01`, `FE11-LIFE01..FE11-LIFE05`; `FE11-LIFE06` vẫn mở đến khi H3, merge và CI `main` chính xác sau merge.

Quyết định: Hybrid SDD + ADD, độ sâu Đầy đủ. Lược đồ, phân quyền, tương tranh lạc quan, vô hiệu hóa thông tin xác thực, tính nguyên tử kiểm toán và tuần tự hóa FE07 là Core; biểu mẫu Quản trị viên và phần trình bày tuyến là Shell.

## Điều kiện tiên quyết về quản trị

- Thiết kế và kế hoạch Lô Hoàn thiện đã được phê duyệt trước công việc sản phẩm.
- PR quản trị #39 đã đạt lần chạy `foundation-checks` `29658802446`, được merge thành `62ac2d1a990af52d5f70f2a1da3e188639bd685a` và lần chạy CI `main` chính xác sau merge `29658912068` đã đạt.
- Đợt A bắt đầu từ `origin/main@62ac2d1` trong nhánh cô lập `feat/fe11-finalization-wave-a`.

## Lịch sử RED-GREEN

### RED Đợt A đã lập kế hoạch

- RED lược đồ làm lộ việc thiếu di chuyển lũy đẳng và độ rộng lưu trữ email 100 ký tự lỗi thời.
- RED thiết lập tài khoản và đọc an toàn làm lộ việc thiếu lưu trữ/chiếu Thủ thư, thiếu `updatedAt` hiệu lực, thiếu xác thực khi tạo và thiếu kiểm tra Quản trị viên thực hiện trong giao dịch.
- RED vòng đời làm lộ việc thiếu kho lưu trữ có giao dịch cho cập nhật lạc quan/không thao tác, vô hiệu hóa nguyên tử, thu hồi token làm mới, hoàn tác kiểm toán và tuần tự hóa FE07 ưu tiên thành viên.
- RED frontend làm lộ lối tắt Quản trị viên khi phát triển, thiếu payload phiên bản hiệu lực, thiếu trường Thủ thư và điều khiển vô hiệu hóa chỉ dành cho ACTIVE.

### RED được thúc đẩy bởi rà soát

Trong lần rà soát phần khác biệt production cuối cùng, hai kiểm thử hồi quy bổ sung được thêm trước khi sửa:

| Lệnh | RED quan sát được |
| --- | --- |
| `npm.cmd test -- --runTestsByPath tests/fe11SchemaMigration.test.js tests/userManagementService.test.js` trong `backend/` | 2 bộ thất bại; 2 kiểm thử thất bại và 74 đạt. Di chuyển kiểm tra độ rộng byte mà chưa thực thi đầy đủ kiểu SQL/khả năng rỗng, còn bước kiểm tra trước trùng lặp của dịch vụ làm lộ `EMAIL_ALREADY_EXISTS` trước kết quả tác nhân `ADMIN_REQUIRED` có thẩm quyền từ giao dịch. |
| `npm.cmd test -- --runTestsByPath tests/accountSetupRepository.test.js tests/authRoutes.test.js` trong `backend/` | 2 bộ thất bại; 2 kiểm thử thất bại và 28 đạt. Hoàn tất thiết lập chấp nhận tài khoản `INACTIVE` có `DeactivatedAt` khác null, cho phép trạng thái thiết lập cũ chưa dùng kích hoạt lại một lần vô hiệu hóa cuối Giai đoạn 1. |

Các bản sửa tối thiểu khiến giao dịch nguồn có thẩm quyền đối với quyết định tác nhân/trùng lặp khi tạo, khiến di chuyển sửa kiểu `nvarchar` cùng khả năng rỗng thay vì chỉ độ rộng byte và yêu cầu hoàn tất thiết lập chỉ chấp nhận tài khoản đang chờ kích hoạt có `DeactivatedAt` là null.

### GREEN tập trung

| Lệnh | Kết quả |
| --- | --- |
| `npm.cmd test -- --runTestsByPath tests/userManagementService.test.js` trong `backend/` | 1 bộ, 73/73 kiểm thử PASS |
| `npm.cmd test -- --runTestsByPath tests/fe11SchemaMigration.test.js` trong `backend/` | 1 bộ, 3/3 kiểm thử PASS |
| `npm.cmd test -- --runTestsByPath tests/fe11SchemaMigration.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js tests/accountSetupRepository.test.js tests/userLifecycleRepository.test.js` trong `backend/` | 5 bộ, 181/181 kiểm thử PASS |
| `npm.cmd test -- --runTestsByPath tests/accountSetupRepository.test.js tests/authRoutes.test.js` trong `backend/` | 2 bộ, 30/30 kiểm thử PASS sau chốt bảo vệ thiết lập tài khoản đã vô hiệu hóa |
| `npm.cmd test -- --runTestsByPath tests/fe11SchemaMigration.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js tests/accountSetupRepository.test.js tests/userLifecycleRepository.test.js tests/authRoutes.test.js` trong `backend/` | 6 bộ, 201/201 kiểm thử PASS |

## L1 - Bằng chứng tự động

| Lệnh | Kết quả |
| --- | --- |
| `npm.cmd --prefix backend test` | 41 bộ, 701/701 kiểm thử PASS |
| `npm.cmd --prefix backend run test:coverage:ci` | 41 bộ, 701/701 kiểm thử PASS; câu lệnh 92.51%, nhánh 82.46%, hàm 97.1%, dòng 92.44% |
| `npm.cmd --prefix frontend test` | 124/124 kiểm thử PASS |
| `npm.cmd --prefix frontend run lint` | PASS với không có lỗi hay cảnh báo được báo cáo |
| `npm.cmd --prefix frontend run build` | PASS; cảnh báo hiện có và không gây chặn về phân đoạn lớn vẫn còn |
| `npm.cmd run trace:enforce` | PASS; FE11 có 25/38 ID FR được gắn thẻ và việc hoàn tất toàn tính năng vẫn mở |
| `node -e "require('./backend/node_modules/yamljs').load('backend/src/docs/openapi.yaml'); console.log('openapi ok')"` | PASS - `openapi ok` |
| `node -e "require('./backend/src/app'); console.log('backend import ok')"` | PASS - `backend import ok` |
| Bản tương đương cô lập của `npm.cmd run test:e2e` dùng hợp đồng đặc tả luồng chuẩn không đổi với frontend `4183` và backend `3100` | Luồng chuẩn hệ thống Chromium 1/1 PASS; cấu hình/đặc tả tạm thời đã bị xóa sau khi thực thi |
| `node --check backend/tests/sql/borrowingConcurrency.sqltest.js` | PASS |
| Quét sai lệch sản phẩm, bí danh chỉnh sửa Quản trị viên, nội dung nhạy cảm trong di chuyển và phạm vi phần phụ thuộc | PASS |
| `git diff --check` | PASS |

## L2 - Tuân thủ đặc tả

| Tác vụ / hợp đồng | Ranh giới production | Bằng chứng kiểm thử |
| --- | --- | --- |
| `FE11-FIN01` | Thiết kế/kế hoạch độ sâu Đầy đủ đã phê duyệt và kích hoạt quản trị đã merge | PR #39 và bằng chứng CI chính xác sau merge bên trên |
| `FE11-LIFE01` | Di chuyển lũy đẳng, `UX_Users_Email` xác định, độ rộng đường cơ sở/mô hình/liên kết chuẩn | `fe11SchemaMigration.test.js`; kiểm tra tĩnh di chuyển; phân tích OpenAPI |
| `FE11-LIFE02` | Trường tạo/đọc/cập nhật Thủ thư; xác thực lại tạo/gửi lại của Quản trị viên hoạt động; kết quả trùng lặp an toàn | các bộ kiểm thử kho thiết lập tài khoản, kho người dùng, dịch vụ và tuyến |
| `FE11-LIFE03` | Tác nhân/mục tiêu/vai trò đã khóa, phiên bản hiệu lực, không thao tác, email trùng, danh sách kiểm toán cho phép đã sắp xếp, hoàn tác | `userLifecycleRepository.test.js`, kiểm thử ánh xạ dịch vụ/tuyến |
| `FE11-LIFE04` | Phân biệt đang chờ/đã vô hiệu hóa, vô hiệu hóa ACTIVE/LOCKED, chốt mượn đang hoạt động, thu hồi REFRESH, kiểm toán nguyên tử, thứ tự khóa FE07 | kiểm thử kho vòng đời, hồi quy kho mượn, mã nguồn kiểm thử tranh chấp SQL |
| `FE11-LIFE05` | Trạng thái Quản trị viên có xác thực đã lưu trong mọi chế độ Vite; payload phiên bản hiệu lực; tải lại có thẩm quyền; trường biểu mẫu Thủ thư | kiểm thử hợp đồng API/trang frontend, toàn bộ kiểm thử frontend, lint, bản dựng, hồi quy trình duyệt |

Chi tiết hợp đồng đã xác minh:

- `Users.Email` và `Notifications.RecipientEmail` là `NVARCHAR(255)`.
- `UserProfiles.Department` và `UserProfiles.Specialization` là `NVARCHAR(100)` có thể rỗng.
- `fullName`, `department` và `specialization` dùng ranh giới 100 ký tự.
- `updatedAt` của người dùng được quản lý là `COALESCE(Users.UpdatedAt, Users.CreatedAt)` và được tái sử dụng khi chỉnh sửa.
- Tạo/gửi lại khóa và xác thực lại Quản trị viên thực hiện đang hoạt động bên trong giao dịch nguồn tương ứng.
- Hoàn tất thiết lập từ chối tài khoản `INACTIVE` có `DeactivatedAt` khác null; chỉ tài khoản đang chờ kích hoạt có thể chuyển sang `ACTIVE`.
- `INACTIVE` cộng với `DeactivatedAt` null trả về `409 ACCOUNT_PENDING_ACTIVATION`.
- Vô hiệu hóa chỉ thu hồi thông tin xác thực `REFRESH` đang hoạt động và kiểm toán trong cùng giao dịch.
- FE07 vẫn là chủ sở hữu chỉnh sửa phê duyệt/từ chối duy nhất; Đợt A chỉ đổi thứ tự khóa tối thiểu cần cho tuần tự hóa.

## L3 - Hiến chương và an toàn

- Xác thực và phân quyền Quản trị viên thực thi trước xác thực chi tiết khi tạo/cập nhật/vô hiệu hóa.
- Tạo, gửi lại, cập nhật và vô hiệu hóa xác thực lại Quản trị viên thực hiện đang hoạt động dưới `UPDLOCK, HOLDLOCK` trước khi chỉnh sửa nguồn.
- Mọi truy cập cơ sở dữ liệu thay đổi đều dùng tham số `mssql` có kiểu; giá trị yêu cầu không được nối vào SQL.
- Giao dịch nguồn khi tạo có thẩm quyền đối với kết quả tác nhân và trùng lặp, ngăn bên gọi lỗi thời/không phải Quản trị viên biết trạng thái email trùng qua bước kiểm tra trước của dịch vụ.
- Siêu dữ liệu kiểm toán cập nhật chỉ chứa `changedFields` đã sắp xếp; siêu dữ liệu kiểm toán vô hiệu hóa chỉ chứa trạng thái trước/mới.
- Trạng thái vô hiệu hóa, `DeactivatedAt`, `UpdatedAt`, thu hồi REFRESH đang hoạt động và kiểm toán cùng commit hoặc hoàn tác.
- Việc sử dụng thiết lập kiểm tra `Status = INACTIVE` và `DeactivatedAt IS NULL` trong cùng giao dịch đã khóa, ngăn kích hoạt lại tài khoản đã vô hiệu hóa.
- Phản hồi người dùng được quản lý vẫn là danh sách cho phép rõ ràng; trường Thủ thư bị bỏ qua với mục tiêu không phải Thủ thư.
- Không đưa vào token/liên kết thiết lập thô, mật khẩu, thông tin xác thực, bí mật, người dùng khởi tạo, PII thật, phần phụ thuộc mới, bảng phiên, CRUD vai trò, chỉnh sửa quyền hay thay đổi production FE12.

## L4 - Bằng chứng chấp nhận

- Kiểm thử tuyến/dịch vụ/kho tự động bao phủ kết quả tạo, gửi lại, cập nhật, không thao tác, trạng thái lỗi thời, email trùng, trường chỉ dành cho Thủ thư, chờ kích hoạt, tự nhắm mục tiêu, khoản mượn đang hoạt động, vô hiệu hóa ACTIVE/LOCKED, thu hồi token làm mới, kiểm toán và hoàn tác.
- Kiểm thử tuyến FE02 và kho SQL bao phủ việc từ chối tài khoản đã vô hiệu hóa ngay cả khi tồn tại token `ACCOUNT_SETUP` chưa dùng.
- Kiểm thử frontend bao phủ chuyển hướng đăng nhập/trang chủ, xóa truy cập Quản trị viên phát triển ngầm, payload phiên bản hiệu lực, trường biểu mẫu Thủ thư, điều khiển ACTIVE/LOCKED và thông báo chờ kích hoạt an toàn.
- Luồng chuẩn hệ thống Chromium hiện có là ranh giới hồi quy trình duyệt cho Đợt A và đạt 1/1 qua bản frontend tương đương cô lập `4183`.
- Mã tranh chấp SQL trực tiếp chỉ chấp nhận: phê duyệt thắng và vô hiệu hóa bị chặn, hoặc vô hiệu hóa thắng và phê duyệt quan sát thành viên không hoạt động. Trạng thái cuối bất khả thi là người dùng INACTIVE có yêu cầu mới APPROVED.

## Bằng chứng SQL trực tiếp sau đó

- Phần SQL còn lại chỉ do môi trường đã được xử lý sau đó vào 2026-07-19 bằng cơ sở dữ liệu và thông tin đăng nhập SQL Server cục bộ dùng một lần.
- Đường cơ sở chuẩn cùng cả năm lần di chuyển đối soát đã đạt hai lần thực thi; cả 8/8 bộ SQL và 61/61 kiểm thử đều đạt, gồm giao dịch hồ sơ FE03, chỉnh sửa rowversion FE05 và tuần tự hóa phê duyệt/vòng đời FE07.
- Dọn dẹp cơ sở dữ liệu/đăng nhập trả về `DB_CLEAN` và `LOGIN_CLEAN`; chi tiết nằm trong `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Kiểm tra tĩnh di chuyển/tính lũy đẳng, kiểm thử thứ tự khóa SQL được phát, kiểm thử giao dịch kho lưu trữ và kiểm tra cú pháp JavaScript vẫn là một phần của cổng bắt buộc.
- Cổng frontend Playwright tiêu chuẩn `4173` bị PID `13432` có sẵn chiếm; tiến trình không bị dừng hay tái sử dụng. Cùng hợp đồng luồng chuẩn đã đạt 1/1 trên cổng cô lập `4183` và mọi tệp trình chạy tạm thời đã bị xóa.
- Máy chủ E2E cục bộ có thể ghi lỗi cấu hình SQL `/api/profile/me` đã biết khi thiếu biến môi trường SQL; nội dung này được ghi riêng với kết quả luồng chuẩn Chromium.
- Bản dựng production frontend có thể giữ cảnh báo hiện có và không gây chặn về phân đoạn lớn.

## Ranh giới H2

- Mọi thay đổi triển khai và bằng chứng vẫn chưa được commit.
- `FE11-FIN01` và `FE11-LIFE01..FE11-LIFE05` có thể được đánh dấu hoàn tất từ bằng chứng trong bản ghi này.
- `FE11-LIFE06` vẫn chưa được đánh dấu đến khi phần khác biệt không đổi đã được H2 rà soát được commit, kiểm tra PR đạt, H3 phê duyệt tích hợp, PR được merge và lần chạy CI `main` chính xác sau merge thành công.
- Quản lý Yêu cầu Đợt B (`FE11-REQ01..FE11-ACC01`) và hoàn tất B7 toàn tính năng FE11 nằm ngoài phần khác biệt này.
