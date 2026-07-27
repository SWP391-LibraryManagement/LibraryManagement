# Xác thực hoàn tất quản trị cuối cùng - 2026-07-20

> Gói ứng viên lịch sử của PR #54: cách diễn đạt trước merge bên dưới mô tả
> ảnh chụp ứng viên. Trạng thái có thẩm quyền sau tích hợp được ghi trong
> phần bổ sung ở cuối tệp này.

## Quyết định

Lần hoàn tất này dùng Hybrid SDD + ADD ở độ sâu Tiêu chuẩn. Hợp đồng Nhật ký Kiểm toán FE11
về trình bày là thay đổi có giới hạn liền kề Core; siêu dữ liệu quản trị,
ghi chú trạng thái hiện tại, quy tắc bỏ qua và tham chiếu phát hành là các thay đổi Shell
có thể hoàn nguyên. Ứng viên cục bộ đáp ứng bốn lớp xác thực được mô tả
bên dưới và sẵn sàng để con người rà soát H2. Ứng viên vẫn chưa được commit.

## Phạm vi thay đổi

- Đã khôi phục điều khiển `action` và `actorId` dạng số của Nhật ký Kiểm toán Quản trị viên FE11 trong
  `frontend/src/page/UserManagement.jsx`.
- Đã thêm độ bao phủ hồi quy mã nguồn RED-GREEN trong
  `frontend/test/userManagementFrontend.test.js`.
- Đã đối soát cách hiểu về hoàn tất hiện tại trên cả mười hai tính năng
  qua các tệp `SPEC.md` và hoàn tất các hàng FE11 cho `FR-FE11-033` và
  `AC-FE11-018` cùng tác vụ `FE11-CLOSE01`.
- Đã nâng tiêu đề Hiến chương, hợp đồng tác nhân và ràng buộc hiện có thành
  siêu dữ liệu đã phê duyệt mà không thay đổi quy tắc chuẩn tắc của chúng.
- Chỉ thêm `.worktrees/` và `.superpowers/` vào `.gitignore`.
- Đã căn chỉnh tham chiếu phát hành chuẩn trong tương lai thành `v1.0.2`. Việc tạo thẻ vẫn
  bị chặn đến khi H3 phê duyệt, merge vào `main` và CI chính xác sau merge đạt.
- Không thay đổi hành vi backend, điểm cuối hay hình dạng yêu cầu API, lược đồ cơ sở dữ liệu, quyền
  vai trò, phân quyền, phân trang kiểm toán hay quy tắc che dữ liệu.

## L1 - Kiểm tra tự động

Tất cả lệnh đã chạy tuần tự trong worktree
`docs/final-governance-closeout` cô lập.

| Lệnh | Kết quả quan sát được |
| --- | --- |
| `npm.cmd run trace:enforce` | PASS; 12/12 tính năng, độ bao phủ FR 100%, không có mục dưới ngưỡng. |
| `npm.cmd run test:deployment` | PASS; 8/8 kiểm thử tiện ích triển khai. |
| `npm.cmd --prefix backend run test:coverage:ci` | PASS; 916/916 kiểm thử trong 53 bộ; câu lệnh 92.68%, nhánh 81.66%, hàm 96.59%, dòng 92.61%. |
| `npm.cmd run test:system` | PASS; 10/10 kiểm thử tích hợp hệ thống. |
| `npm.cmd --prefix frontend test` | PASS; 152/152 kiểm thử, gồm hồi quy bộ lọc FE11 mới. |
| `npm.cmd --prefix frontend run lint` | PASS. |
| `npm.cmd --prefix frontend run build` | PASS; 57 tài nguyên JavaScript và một tài nguyên đầu vào 320,688 byte. |
| `E2E_FRONTEND_PORT=4473 E2E_BACKEND_PORT=3400 E2E_FRONTEND_URL=http://127.0.0.1:4473 E2E_BACKEND_URL=http://127.0.0.1:3400 npm.cmd run test:e2e` | PASS; 4/4 kiểm thử Playwright trong 31.4 giây. |
| `npm.cmd run phase3:performance` | PASS; p95 đăng nhập 70.24 ms, p95 xác thực phiên 1.94 ms, chi phí bcrypt 10. |
| `npm.cmd audit --omit=dev --audit-level=high` ở gốc, backend và frontend | PASS; 0 lỗ hổng trong mỗi cây phần phụ thuộc production. |
| Phân tích YAML OpenAPI | PASS; `OPENAPI_PARSE_OK`. |
| Nhập ứng dụng backend | PASS; `BACKEND_IMPORT_OK`. |
| `git diff --check` | PASS; không có lỗi khoảng trắng. |

## L2 - Tuân thủ đặc tả và truy vết

- Các điều khiển được khôi phục ánh xạ tới `BR-FE11-018`, `BR-FE11-026`,
  `FR-FE11-033` và `AC-FE11-018`.
- `FE11-CLOSE01` ánh xạ các ID yêu cầu đã phê duyệt tới điều khiển React,
  hồi quy frontend và bản ghi xác thực này.
- Đầu vào hành động và tác nhân cấp dữ liệu cho trạng thái `auditFilters` hiện có và
  `buildAuditLogParams`; giá trị trống tiếp tục bị bỏ qua còn giá trị không trống tiếp tục
  tuân theo hợp đồng máy chủ hiện có.
- Gói của cả mười hai tính năng giờ phân biệt trạng thái Giai đoạn 1 `COMPLETE` hiện tại
  với ảnh chụp lập kế hoạch và rà soát trong lịch sử.
- Cổng truy vết được thực thi vẫn đạt 12/12 tính năng ở mức 100%.

## L3 - Tuân thủ hiến chương và an toàn

- Ngăn xếp đã phê duyệt vẫn là Node.js + Express.js, React + Bootstrap, SQL
  Server và các API REST.
- Kiểm tra phạm vi Git cho thấy không có thay đổi trong `backend/`, `database/`,
  `docs/api/`, quy trình triển khai hay cấu hình triển khai.
- Phân quyền Quản trị viên, xác thực phía máy chủ, SQL tham số hóa, phép chiếu DTO kiểm toán
  an toàn và che trường nhạy cảm vẫn không thay đổi.
- Điều khiển hành động được giới hạn ở 100 ký tự. Điều khiển tác nhân dạng số
  với giá trị tối thiểu `1` và bước `1`; máy chủ hiện có vẫn có thẩm quyền
  xác thực.
- Ba lần kiểm toán phần phụ thuộc production báo cáo không có lỗ hổng. Không thêm
  bí mật, thông tin xác thực, token, payload nhà cung cấp hay PII thật.
- Thay đổi quản trị chỉ thuộc siêu dữ liệu; không có quy tắc Hiến chương hay ràng buộc
  chuẩn tắc nào bị làm yếu hoặc viết lại.

## L4 - Xác minh chấp nhận

| Hạng mục chấp nhận | Trạng thái | Bằng chứng |
| --- | --- | --- |
| Bộ lọc hành động FE11 hiển thị và được liên kết với trạng thái chuẩn | PASS (cục bộ) | Hồi quy mã nguồn frontend cùng bộ 152/152 frontend. |
| Bộ lọc tác nhân FE11 hiển thị, có dạng số và được liên kết với trạng thái chuẩn | PASS (cục bộ) | Hồi quy mã nguồn frontend cùng bản dựng production. |
| Hành vi truy vấn kiểm toán FE11 hiện có vẫn nguyên vẹn | PASS | Kiểm thử hồi quy trình dựng truy vấn và làm mới/phân trang đạt. |
| Kết xuất kiểm toán an toàn hiện có vẫn nguyên vẹn | PASS | Hồi quy kết xuất DTO an toàn lồng nhau đạt; không có phần khác biệt backend/che dữ liệu. |
| Luồng chuẩn hệ thống vẫn nguyên vẹn | PASS | 4/4 kiểm thử Playwright trên các cổng cô lập. |
| Chấp nhận staging công khai | PASS sau một lần chạy lại chẩn đoán | Sáu kiểm tra đạt: frontend, sức khỏe, danh mục SQL, CORS được phép, CORS bị chặn và tuyến được bảo vệ. |

Lần thử smoke staging công khai đầu tiên quan sát HTTP `500` từ danh mục
dựa trên SQL trong khi frontend và sức khỏe vẫn khả dụng. Chẩn đoán chỉ đọc sau đó
quan sát frontend `200`, sức khỏe `200` và ba phản hồi danh mục chuẩn
`200` liên tiếp. Một lần chạy lại smoke đã đạt cả sáu kiểm tra. Không có thay đổi backend,
cơ sở dữ liệu hay triển khai cục bộ nào trong lô này nên sự kiện được ghi nhận
là ranh giới staging tạm thời thay vì bị che giấu hoặc quy cho phần khác biệt FE11
này.

## Các ranh giới còn lại

- Các điều khiển chưa commit chưa được triển khai lên staging công khai; kiểm thử cục bộ,
  bản dựng và chấp nhận cấp mã nguồn là bằng chứng trình bày FE11 hiện tại.
- Người rà soát H2 phải kiểm tra toàn bộ phần khác biệt và xác nhận sự phù hợp UI/hệ thống
  trước khi tạo bất kỳ commit triển khai nào được sinh.
- Rà soát H3, merge, CI `main` chính xác sau merge và tạo thẻ `v1.0.2`
  vẫn là các bước con người/tích hợp.
- Lưu trữ ảnh đại diện bền vững, CI SQL dùng chung dùng một lần, UI hộp thư thông báo và
  SLA production vẫn là các hạn chế ngoài phạm vi đã ghi trước đó.

## Ranh giới rà soát H2

H2 có thể rà soát toàn bộ phần khác biệt cục bộ và gói L1-L4 này. Phê duyệt H2 sẽ
cho phép tập commit đã rà soát, push nhánh và công bố PR theo hợp đồng
Fast-Track của kho mã. Việc xác thực này không cho phép H3, merge,
thay thế CI sau merge, tạo bản phát hành hay tạo thẻ.

## Cập nhật sau tích hợp - 2026-07-20

- PR #54 được merge thành `c988af1`; `v1.0.2` đã được công bố và CI nền tảng của nó đã đạt.
- PR #57 được merge thành `562bb5d`; PR #58 được merge thành `cce59d0`.
- CI đường cơ sở ứng dụng `29712597463` đã đạt truy vết (12/12 tính năng, 243/243 thẻ FR), 917/917 kiểm thử backend với độ bao phủ đã cấu hình, tích hợp hệ thống 10/10, 171/171 kiểm thử frontend, lint, bản dựng, Playwright 4/4 và sức khỏe nhập backend.
- Quy trình staging theo đường cơ sở ứng dụng `29712612188` đã đạt cổng chất lượng, triển khai backend/frontend và sáu kiểm tra smoke (`frontend`, `health`, `sql-catalog`, `allowed-cors`, `blocked-cors`, `protected-route`).
- `cce59d0` là đường cơ sở ứng dụng sau phát hành đã xác thực. Mọi `v1.0.3` tương lai phải trỏ tới SHA `main` được rà soát sau này khi một PR đối soát/phát hành mới hoàn tất H2/H3 và CI chính xác sau merge của chính nó; phần bổ sung này không cấp thẩm quyền đó.
