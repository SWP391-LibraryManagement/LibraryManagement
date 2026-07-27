# Xác thực danh mục ứng viên đặt trước FE08 - 2026-07-19

## Quyết định

- Phương pháp: SDD+ADD kết hợp ở độ sâu Đầy đủ. SDD bao phủ API chỉ dành cho Thành viên, hợp đồng `CopyId` vật lý, phép chiếu SQL, phân quyền, quyền riêng tư và Lõi phân trang; ADD bao phủ việc di chuyển danh mục frontend có thể đảo ngược và bằng chứng trình duyệt.
- Phạm vi: FE08-T035 đến FE08-T039 và TD-028.
- Quyết định của con người: người yêu cầu đã phê duyệt `TD-028 - Option A` và thiết kế FE08 bằng văn bản vào 2026-07-19.
- Trạng thái tích hợp: triển khai và xác thực tự động đã hoàn thành trên `feat/full-reconciliation`; H3 cuối, hợp nhất và CI `main` sau hợp nhất vẫn còn mở.

## Bằng chứng hợp đồng

- `GET /api/reservations/candidates` chỉ dành cho Thành viên và trả về `{ data, pagination }`.
- Mỗi hàng chứa chính xác `copyId`, `bookId`, `title`, `authorName` có thể null, `copyStatus` và `activeReservationCount`.
- SQL chỉ trả về bản sao của sách đang hoạt động có trạng thái `BORROWED` hoặc `RESERVED`, sắp xếp theo tiêu đề/ID sách/bản sao và áp dụng `q`, `page`, `limit` đã tham số hóa.
- Không trả về mã vạch, vị trí, chủ sở hữu, email, dấu thời gian, phiên bản và siêu dữ liệu nhân viên.
- `POST /api/reservations` vẫn là thao tác thay đổi có thẩm quyền và tiếp tục nhận `copyId` vật lý; không còn di chuyển lược đồ hoặc phương án dự phòng `DEMO_RESERVABLE`.

## Xác thực mới

| Cổng | Lệnh / kiểm tra | Kết quả |
| --- | --- | --- |
| Backend trọng tâm | Kiểm thử hợp đồng tuyến/ứng viên đặt trước FE08 | 23/23 đạt |
| SQL FE08 | `npm.cmd --prefix backend test -- --runInBand --testMatch "**/reservationCandidates.sqltest.js"` | 2/2 đạt |
| SQL trực tiếp tổng hợp | Lần chạy dùng một lần mới nhất đã ghi với `**/*.sqltest.js` | 9/9 bộ, 69/69 kiểm thử đạt |
| Lược đồ/di chuyển SQL | Đường cơ sở chuẩn cùng năm phần di chuyển, áp dụng hai lần lên SQL Server dùng một lần | Đạt; cả hai lần di chuyển đều thành công |
| Kết nối SQL | `sqlcmd` xác thực SQL qua TCP và phép dò `mssql` Node trực tiếp | Đạt |
| Dọn dẹp SQL | Cơ sở dữ liệu/đăng nhập dùng một lần được kiểm tra trong `finally` | `DB_CLEAN`; `LOGIN_CLEAN` |
| Toàn bộ backend | `npm.cmd --prefix backend test -- --runInBand` | 53/53 bộ, 905/905 kiểm thử đạt |
| Độ bao phủ backend | `npm.cmd --prefix backend run test:coverage:ci` | câu lệnh 92.68%, nhánh 81.66%, hàm 96.59%, dòng 92.61% |
| Frontend | `npm.cmd --prefix frontend test` | 149/149 đạt |
| Chất lượng frontend | `npm.cmd --prefix frontend run lint`; `npm.cmd --prefix frontend run build` | Đạt; cảnh báo khối Vite hiện có không chặn |
| Tích hợp hệ thống | `npm.cmd --prefix backend run test:integration:system` | 10/10 đạt |
| Triển khai | `npm.cmd run test:deployment` | 7/7 đạt |
| Truy vết | `npm.cmd run trace:enforce` | FE01-FE12 100%; FE08 29/29 |
| An toàn API/nhập mô-đun | Phân tích OpenAPI và kiểm tra nhập backend | `OPENAPI_PARSE_OK`; `BACKEND_IMPORT_OK` |
| An toàn phụ thuộc | Kiểm toán production gốc/backend/frontend | 0 lỗ hổng |
| Trình duyệt trọng tâm | `tests/e2e/fe08-reservation-candidate-catalog.spec.js` | 1/1 đạt |
| Toàn bộ trình duyệt | Playwright với `E2E_FRONTEND_URL=http://127.0.0.1:4185` và `E2E_BACKEND_URL=http://127.0.0.1:3101` | 4/4 đạt |

## Các lớp xác thực

1. **L1 Tự động:** các cổng backend, độ bao phủ, frontend, lint/bản dựng, tích hợp, triển khai, SQL, truy vết, an toàn và Playwright đều đạt.
2. **L2 Tuân thủ đặc tả:** FR-FE08-029, AC-FE08-015/016, NFR-FE08-SEC-004 và NFR-FE08-PERF-003 ánh xạ xuyên suốt SPEC, PLAN, TASKS, phần triển khai và kiểm thử.
3. **L3 Hiến chương/an toàn:** duy trì ngăn xếp Node/Express/React/SQL Server đã phê duyệt; RBAC và xác thực máy chủ được thực thi; SQL được tham số hóa; thông tin xác thực tổng hợp chỉ nằm trong tiến trình; không commit bí mật hoặc PII.
4. **L4 Chấp thuận:** bằng chứng trình duyệt FE08 trọng tâm chứng minh tìm kiếm ứng viên, tải trọng an toàn, thao tác thay đổi `copyId` số thật, làm mới chuẩn và hành vi tràn trên di động; vẫn cần con người duyệt qua toàn diện hơn.

## Lỗi được phát hiện khi xác thực

Lần chạy SQL tổng hợp đầu tiên làm lộ vấn đề cô lập dữ liệu cố định: đường cơ sở chuẩn chứa một bản sao đã mượn, nên truy vấn ứng viên không giới hạn đã thêm hàng đường cơ sở đó vào danh sách kỳ vọng tổng hợp. Hợp đồng production trả về đúng mọi ứng viên đủ điều kiện. Kiểm thử SQL hiện giới hạn xác nhận đầu tiên bằng `seed.key` được tạo, duy trì tìm kiếm máy chủ và thứ tự tất định mà không thay đổi dữ liệu đường cơ sở.

## Các cổng còn lại

- Cổng quyết định B / đánh giá tích hợp H3 của con người vẫn chưa được đánh dấu trong gói chấp thuận đầy đủ.
- Công bố PR và liên kết CI đã hoàn thành trên đầu nhánh được H2 đánh giá: PR #40 / lần chạy CI `29685337907` đạt trên `d820ab7`. Phê duyệt hợp nhất, H3 của con người và bằng chứng CI `main` chính xác sau hợp nhất vẫn bắt buộc trước khi có thể đánh dấu mục tiêu dự án hoàn thành.
