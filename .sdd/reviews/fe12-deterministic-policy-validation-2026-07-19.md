# Xác thực chính sách xác định FE12 - 2026-07-19

Trạng thái: ĐÃ HOÀN TẤT B6 TỰ ĐỘNG VÀ CHẤP NHẬN TRÊN TRÌNH DUYỆT BỞI TÁC NHÂN; B7/L4 DỰA TRÊN SQL VÀ CON NGƯỜI ĐANG CHỜ

Nhánh: `feat/fe12-deterministic-policy`

## Quyết định

Sử dụng phát triển Hybrid ở mức độ sâu Tiêu chuẩn. Hợp đồng phản hồi/API, phân quyền báo cáo,
ngữ nghĩa bộ lọc, quyền riêng tư kiểm toán, chuẩn hóa trạng thái nguồn và thứ tự xác định là phần Core
và tuân theo SDD. Ba thành phần React sử dụng báo cáo là công việc Shell có giới hạn, được triển khai
theo hợp đồng Core đã phê duyệt.

## Phạm vi

Đợt này chỉ đối soát từ FE12-N02 đến FE12-N06. Đợt này không bổ sung xuất dữ liệu, bảng điều khiển, BI,
thay đổi lược đồ, phần phụ thuộc hay chỉnh sửa bản ghi nguồn.

## Các phát hiện đã xử lý

| Phát hiện | Cách xử lý | Bằng chứng |
| --- | --- | --- |
| Backend và frontend vẫn dùng các trường báo cáo cũ | Dùng chính xác cấu trúc bao `{ metrics, rows, page, limit, totalRows }` ở mọi nơi | `backend/tests/reportContract.test.js`, `frontend/test/reportOperationalFrontend.test.js` |
| Giới hạn/giá trị mặc định phân trang chưa được thực thi nhất quán | Xác thực `page>=1`, `limit=1..100`; trả về giá trị mặc định 1/20 | `backend/tests/reportDeterministicPolicy.test.js` |
| ID đúng định dạng nhưng không xác định và trạng thái đã lưu chưa có tính xác định | Trả về báo cáo rỗng chuẩn; chuẩn hóa giá trị đã lưu thành `UNKNOWN` | `backend/tests/reportDeterministicPolicy.test.js`, `backend/tests/reportInMemoryParity.test.js` |
| Siêu dữ liệu kiểm toán của lượt xem thành công có thể sai lệch hoặc làm lộ bộ lọc | Chỉ phát loại báo cáo, kết quả thành công và dấu thời gian cùng các trường tác nhân/ngữ cảnh tiêu chuẩn | `backend/tests/reportService.test.js`, `backend/tests/reportRoutes.test.js` |
| Bộ lọc trạng thái/vị trí kho có thể khớp với các bản sao khác nhau | Áp dụng cả hai điều kiện cho cùng một hàng `bc` và tính riêng khả dụng của toàn bộ sách | `backend/tests/reportRepository.test.js` |
| Việc lọc người dùng theo thời kỳ phê duyệt chỉ được đánh giá trong Node.js | Đánh giá điều kiện ngày trong SQL mà không thêm vào phạm vi `WHERE` người dùng toàn cục | `backend/tests/reportRepository.test.js` |
| Ngày trong hàng mượn không khớp với `format: date` của OpenAPI | Tuần tự hóa ngày mượn/hạn trả/ngày trả thành `YYYY-MM-DD` trong kho lưu trữ production và trong bộ nhớ | `backend/tests/reportRepository.test.js`, `backend/tests/reportDeterministicPolicy.test.js` |
| Lọc SQL quá hạn suy ra phụ thuộc vào ngày của máy chủ cơ sở dữ liệu thay vì múi giờ thư viện đã phê duyệt | Gắn cùng ngày nghiệp vụ `Asia/Ho_Chi_Minh` do ứng dụng tính và dùng khi tổng hợp vào `@BusinessDate`; loại bỏ phụ thuộc vào `GETDATE()` | `backend/tests/reportRepository.test.js` |
| `BorrowDate` bị thiếu được ngầm gán thành `RequestDate` trong số liệu theo kỳ | Chỉ nhóm theo `BorrowDate` chuẩn; loại các ngày bị thiếu khỏi `borrowCountByPeriod` trong production và test double trong bộ nhớ | `backend/tests/reportRepository.test.js`, `backend/tests/reportInMemoryParity.test.js` |
| Bộ lọc `OVERDUE` trong bộ nhớ không phản chiếu hành vi suy ra quá hạn ở production | Áp dụng cùng quy tắc `BORROWED` cộng với ngày nghiệp vụ đã quá hạn trước khi dựng báo cáo test double | `backend/tests/reportInMemoryParity.test.js` |
| Các nguồn kiểm thử liên tính năng và dựa trên SQL khẳng định payload cũ | Căn chỉnh các khẳng định theo cấu trúc bao xác định | `backend/tests/integration.test.js`, `backend/tests/systemIntegration.test.js`, `backend/tests/sql/systemIntegration.sqltest.js` |
| Các trang báo cáo không thể hiển thị hàng chi tiết chuẩn | Hiển thị số liệu phản hồi, bảng hàng, tổng số lượng và siêu dữ liệu trang mà không có trường hồ sơ cá nhân | `frontend/test/reportOperationalFrontend.test.js` |
| Fixture frontend không còn dùng vẫn lưu giữ cấu trúc bao FE12 cũ | Xóa phần xuất `DEMO_REPORTS` không dùng và khẳng định nó không thể xuất hiện lại | `frontend/test/reportAccess.test.js` |
| Việc không hỗ trợ xuất dữ liệu đã được ghi tài liệu nhưng chưa thể kiểm thử thực thi | Khẳng định không tồn tại tuyến xuất báo cáo, đường dẫn OpenAPI hay điều khiển frontend nào | `backend/tests/reportDeterministicPolicy.test.js` |

## Bằng chứng tự động

| Kiểm tra | Kết quả |
| --- | --- |
| Cổng backend FE12 tập trung | PASS - 6 bộ, 46 kiểm thử |
| Cổng frontend FE12 tập trung | PASS - 12 kiểm thử |
| Toàn bộ bộ kiểm thử backend | PASS - 39 bộ, 615 kiểm thử |
| Ngưỡng độ bao phủ backend | PASS - 92.54% câu lệnh, 82.33% nhánh, 97.14% hàm, 92.47% dòng |
| Toàn bộ bộ kiểm thử frontend | PASS - 121 kiểm thử |
| Kiểm tra lint frontend | PASS |
| Bản dựng frontend cho production | PASS; cảnh báo hiện có về kích thước gói vẫn không gây chặn |
| Thực thi truy vết | PASS - FE12 10/10 thẻ FR, 100% |
| Vệ sinh phần khác biệt | PASS - `git diff --check` |
| Luồng chuẩn hệ thống bằng Playwright | PASS - 1/1 trước khi khắc phục kho lưu trữ; bằng chứng toàn luồng chuẩn được giữ lại |
| Chấp nhận bằng CLI Playwright cô lập theo phần khác biệt chính xác | PASS - Thủ thư xem cả ba báo cáo, số liệu/hàng chuẩn, trạng thái không dữ liệu, thiết bị di động không tràn, Thành viên `/forbidden`, Khách `/login` trên cổng 4184 |

Các lệnh xác minh:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reportRoutes.test.js tests/reportRepository.test.js tests/reportContract.test.js tests/reportInMemoryParity.test.js tests/reportService.test.js tests/reportDeterministicPolicy.test.js
node --test frontend/test/reportAccess.test.js frontend/test/reportFilters.test.js frontend/test/reportOperationalFrontend.test.js
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
npm.cmd run test:e2e -- --project=chromium
```

## Các lớp xác thực

| Lớp | Trạng thái | Bằng chứng / Khoảng trống |
| --- | --- | --- |
| L1 Tự động | PASS đối với các kiểm tra không dùng SQL đã cấu hình | Kiểm thử tập trung/toàn bộ, lint, bản dựng, truy vết và vệ sinh phần khác biệt đều đạt |
| L2 Tuân thủ đặc tả | PASS sau khi khắc phục qua rà soát; đang chờ con người rà soát lại | Ngày nghiệp vụ, `BorrowDate` chuẩn, tính tương đương của quá hạn suy ra, hợp đồng xác định và các trường hợp BR/FR/AC bị ảnh hưởng đều ánh xạ tới mã/kiểm thử |
| L3 Hiến chương/an toàn | PASS cho phần khác biệt hiện tại | Chỉ đọc, RBAC máy chủ, xác thực, SQL tham số hóa, siêu dữ liệu kiểm toán an toàn, không thay đổi xuất dữ liệu/phần phụ thuộc/lược đồ |
| L4 Chấp nhận | PARTIAL | Trình diễn trên trình duyệt do tác nhân thực hiện đã đạt; chưa ghi nhận chấp nhận rõ ràng từ con người |

## Các cổng còn lại

- Tích hợp hệ thống dựa trên SQL chưa được thực thi vì `DB_SERVER`, `DB_NAME` và một môi trường cho phép
  chỉnh sửa `SYSTEM_SQL_TEST_ALLOW_MUTATION=true` đã phê duyệt chưa được cấu hình trong worktree này.
- Các kiểm tra mới trên trình duyệt bao phủ việc Thủ thư thành công, từ chối Thành viên/Khách, cả ba màn
  hình số liệu/hàng chuẩn, trạng thái không có dữ liệu mượn và bố cục máy tính/di động. Lần theo dõi phần khác biệt chính xác dùng cổng cô lập
  `4184` vì `4173` thuộc worktree FE03 và không bị tái sử dụng hay dừng. Quyền truy cập của Quản trị viên
  và hành vi trạng thái lỗi vẫn được bao phủ bằng kiểm thử tuyến/frontend tự động thay vì một luồng tác nhân mới
  trên trình duyệt.
- Rà soát tích hợp bởi con người phải xác nhận độ phù hợp với hệ thống và quyết định commit, push, merge hay
  giữ lại nhánh. Bằng chứng B7 FE12 trong lịch sử không hoàn tất đợt xác định này.

## Kiểm soát phạm vi

- Không có commit, push, merge hay PR nào được tạo.
- Checkout chính đang có thay đổi và các worktree không liên quan không bị chỉnh sửa hay hoàn nguyên.
- Công việc lược đồ FE04/FE09 vẫn được hoãn trong khi worktree lược đồ FE11 chồng lấn các tệp đó.
