# Xác thực Nhật ký kiểm toán FE11 - 2026-07-18

Trạng thái: TÍCH HỢP B7 HOÀN THÀNH

Phạm vi: chỉ `FE11-AUD01` / `TD-024`

Quyết định: SDD + ADD Kết hợp, độ sâu Đầy đủ cho ranh giới đọc nhạy cảm về bảo mật. Hành vi Lõi là phân quyền, xác thực, lọc/thứ tự SQL và che dữ liệu. Frontend là bên tiêu thụ Khung giới hạn của DTO chuẩn.

## L1 - Bằng chứng tự động

### ĐỎ quan sát được

- ĐỎ tuyến: 18 thất bại và 41 đạt vì tuyến Quản trị viên chuẩn không tồn tại và tuyến cũ vẫn tới hành vi xác thực/phân quyền.
- ĐỎ kho dữ liệu: 5 thất bại vì `listAuditLogs` không tồn tại.
- ĐỎ dịch vụ: 130 thất bại và 46 đạt vì `adminService.listAuditLogs` và bộ chiếu không tồn tại.
- ĐỎ frontend: 5 thất bại và 12 đạt vì thiếu API Quản trị viên, bộ tạo bộ lọc, hiển thị DTO chuẩn và loại bỏ bộ điều hợp cũ.

### XANH và hồi quy

| Lệnh | Kết quả quan sát |
| --- | --- |
| `npm.cmd test -- --runTestsByPath tests/adminAuditLogRoutes.test.js tests/userManagementRoutes.test.js` | 2 bộ, 59/59 kiểm thử PASS |
| `npm.cmd test -- --runTestsByPath tests/auditLogRepository.test.js` | 1 bộ, 5/5 kiểm thử PASS |
| `npm.cmd test -- --runTestsByPath tests/adminAuditLogService.test.js tests/userManagementService.test.js` | 2 bộ, 176/176 kiểm thử PASS |
| `node --test test/adminApi.test.js test/userManagementApi.test.js test/userManagementFrontend.test.js` | 17/17 kiểm thử PASS |
| Lệnh backend sáu bộ trọng tâm từ kế hoạch | 6 bộ, 246/246 kiểm thử PASS |
| `npm.cmd --prefix backend test` | 36 bộ, 598/598 kiểm thử PASS |
| `npm.cmd --prefix backend run test:coverage:ci` | 36 bộ, 598/598 kiểm thử PASS |
| `npm.cmd --prefix frontend test` | 111/111 kiểm thử PASS |
| `npm.cmd --prefix frontend run lint` | PASS |
| `npm.cmd --prefix frontend run build` | PASS; cảnh báo kích thước gói không chặn hiện có vẫn còn |
| OpenAPI YAML parse | `OpenAPI OK` |
| `npm.cmd run trace:enforce` | PASS |
| Vệ sinh diff được theo dõi và chưa theo dõi | PASS; Git chỉ báo cảnh báo chuyển đổi kết thúc dòng |
| Quét bí mật độ tin cậy cao | PASS |

Độ bao phủ:

- Câu lệnh: 92.51% (791/855)
- Nhánh: 82.46% (536/650)
- Hàm: 97.1% (134/138)
- Dòng: 92.44% (783/847)

## L2 - Tuân thủ đặc tả

| Yêu cầu | Ranh giới mã | Bằng chứng kiểm thử |
| --- | --- | --- |
| `FR-FE11-033` | Luồng tuyến/bộ điều khiển/dịch vụ/kho dữ liệu/frontend chuẩn | Các bộ hợp đồng tuyến, kho dữ liệu, dịch vụ và frontend |
| `AC-FE11-018` | Chế độ xem Quản trị viên chỉ đọc có thể tìm kiếm/lọc với DTO an toàn | Kiểm thử truy vấn/bộ lọc, ma trận bộ chiếu, hợp đồng nguồn frontend |
| `BR-FE11-018` | Quyền đọc chỉ dành cho Quản trị viên và che trường nhạy cảm | Kiểm thử tuyến ưu tiên Quản trị viên và kiểm thử dịch vụ mặc định từ chối |
| `BR-FE11-026` | Loại thông tin xác thực/token/phiên/liên kết và siêu dữ liệu bí mật | Kiểm thử siêu dữ liệu không an toàn, xác nhận bỏ trường DTO, quét bảo mật |
| `FE11-AUD01` / `TD-024` | Quyền sở hữu chuẩn, ngừng đường cũ, tài liệu và xác thực | Diff H2 hoàn chỉnh chưa commit và gói này |

Gói sẵn sàng H2 này không đóng hàng yêu cầu, tiêu chí chấp thuận, nhiệm vụ hoặc nợ nào.

## L3 - Hiến chương và an toàn

- Xác thực và phân quyền Quản trị viên chạy trước xác thực truy vấn chi tiết.
- Xác thực ranh giới máy chủ chỉ chuẩn hóa tên truy vấn đã phê duyệt và từ chối giới hạn/khoảng ngày không hợp lệ.
- SQL dùng tham số `mssql` có kiểu; siêu ký tự tìm kiếm được thoát và văn bản yêu cầu không được nội suy vào SQL.
- Câu lệnh dữ liệu và số lượng dùng chung đoạn bộ lọc và thứ tự `CreatedAt DESC, LogId DESC` ổn định.
- Phép chiếu nhận biết thao tác và mặc định từ chối. JSON không hợp lệ, mảng, giá trị vô hướng, thao tác không xác định và hình dạng không hợp lệ trả về `{}`.
- `Metadata` và `UserAgent` thô không bao giờ đi qua ranh giới DTO dịch vụ.
- Khái niệm nhạy cảm được giới hạn ở quy tắc từ chối và xác nhận phủ định; không thêm bí mật thật hoặc PII.
- Không mở rộng lược đồ, phụ thuộc, xác thực, ghi kiểm toán, xuất, cập nhật/xóa, TD-026, TD-023 hoặc TD-025.

## L4 - Bằng chứng chấp thuận

- Bộ lọc kết hợp `q`, `action`, `actorId`, `from` và `to` được chứng minh qua bộ kiểm thử kho dữ liệu với đầu vào có kiểu và một phạm vi dữ liệu/số lượng.
- Phân trang, hành vi trang trống và thứ tự hai cột ổn định được tự động hóa.
- Chi tiết an toàn được chứng minh cho mọi họ thao tác đã phê duyệt cùng siêu dữ liệu không an toàn, sai định dạng và không xác định.
- Đích không phải người dùng trả về `label: null`; chỉ đích người dùng/tài khoản có thể nhận nhãn đã nối.
- Đường dẫn `/api/users/audit-logs` đã ngừng trả về `404 NOT_FOUND` mà không gọi xác thực hoặc dịch vụ.
- Hợp đồng frontend chứng minh Áp dụng, Xóa, làm mới, giữ trang, các trường DTO lồng chuẩn và hiển thị chỉ văn bản React.

Khoảng trống môi trường còn lại:

- Không có thực thi truy vấn dựa trên SQL Server thật tại cổng cục bộ này; SQL được phát và hành vi liên kết có kiểu được tự động hóa.
- Không chạy tương tác trình duyệt đã đăng nhập; hợp đồng nguồn frontend, toàn bộ kiểm thử, lint và bản dựng production đều đạt.
- Kiểm tra PR GitHub, phê duyệt H3, hợp nhất và CI `main` chính xác sau hợp nhất hoàn tất thành công.

## Quét phạm vi và bảo mật

- Cả 25 tệp đã thay đổi/chưa theo dõi được giới hạn trong quyền sở hữu kế hoạch TD-024: ranh giới kiểm toán Quản trị viên, ranh giới cũ đã ngừng, kiểm thử trọng tâm, bộ điều hợp/trang/kiểm thử frontend, tài liệu API/OpenAPI, bản ghi kiểm thử/nhật ký thay đổi FE11, kế hoạch đã đánh giá và gói xác thực này.
- Kết quả khớp thuật ngữ nhạy cảm cấp diff được giới hạn trong quy tắc từ chối của bộ chiếu, tên thao tác, tài liệu, thiết lập kiểm thử bearer-token và xác nhận phủ định. Quét toàn tệp cũng báo mã thiết lập tài khoản FE11 có từ trước trong các tệp đã chạm; không thêm giá trị bí mật hoặc thông tin xác thực mới.
- `fetchAuditLogs` chỉ còn trong xác nhận frontend phủ định; `/users/audit-logs` chỉ còn trong kiểm thử/tài liệu ngừng sử dụng; không còn tham chiếu `listRecent` chức năng.

## Bằng chứng tích hợp B7

- Đánh giá H2 và H3 của con người được phê duyệt vào 2026-07-18.
- PR #33 được hợp nhất vào `main` dưới dạng `3c88e432feaeda101fb84d6d263ad83691f462ef`.
- Lần chạy CI sau hợp nhất `29651173195` hoàn tất thành công.
- `TD-024` / `FE11-AUD01` hoàn thành đến B7; toàn bộ FE11 vẫn bị hoãn.
