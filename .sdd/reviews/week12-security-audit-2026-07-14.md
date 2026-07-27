# Bằng chứng kiểm toán bảo mật Tuần 12

**Ngày:** 2026-07-14
**Nhánh:** `test/week11-quality-sprint`
**Phạm vi:** phần phụ thuộc production, bí mật được theo dõi, tuyến được bảo vệ, xác thực phía máy chủ,
phản hồi 5xx an toàn, payload thông báo, CORS và cách dựng truy vấn SQL.

## 1. Kết quả

**PASS:** không còn lỗ hổng production mức Nghiêm trọng hay Cao chưa được xử lý sau các bản sửa bên dưới.
Các rủi ro Trung bình/Thấp còn lại được ghi trong Phần 7 cùng chủ sở hữu và hành động theo dõi.

## 2. Kiểm toán phần phụ thuộc production

| Workspace | Phần phụ thuộc production | Kết quả ban đầu | Kết quả cuối cùng |
| --- | ---: | --- | --- |
| Gốc | 2 | 0 lỗ hổng | 0 lỗ hổng |
| Backend | 166 | 0 lỗ hổng | 0 lỗ hổng |
| Frontend | 115 | 1 mức Cao: chèn CRLF trong `form-data` | 0 lỗ hổng |

Phát hiện frontend là gián tiếp: `axios@1.17.0 -> form-data@4.0.5`. Axios loại bộ chuyển đổi HTTP Node
và phần triển khai FormData Node khỏi bản dựng trình duyệt nên mã bị ảnh hưởng không thể
truy cập từ gói trình duyệt Vite. Phát hiện mức Cao vẫn được loại bỏ vì cổng Tuần 12
không chấp nhận phần phụ thuộc production chưa được vá. `frontend/package-lock.json` giờ phân giải
phạm vi tương thích hiện có thành `form-data@4.0.6`; không thêm phần phụ thuộc trực tiếp hay ép
cập nhật phiên bản lớn.

Các lệnh:

```powershell
npm.cmd audit --omit=dev --json
npm.cmd --prefix backend audit --omit=dev --json
npm.cmd --prefix frontend audit --omit=dev --json
npm.cmd --prefix frontend ls axios form-data --all
```

## 3. Quét bí mật và thông tin xác thực

- Các tệp đang được theo dõi: không có khóa riêng, khóa AWS, token GitHub, token Slack hay giá trị có dạng JWT.
- Lịch sử Git: không có mẫu bí mật độ tin cậy cao và không có `.env`, PEM, khóa, P12/PFX hay
  đường dẫn tệp thông tin xác thực được theo dõi.
- `.gitignore` bao phủ `.env`, `.env.*`, `*.secret`, `secrets/` và `credentials/`.
- Quét phạm vi bài tập rộng hơn tìm thấy 34 chuỗi trông giống mật khẩu/token. Mọi kết quả khớp đều là fixture
  kiểm thử tổng hợp đã che dữ liệu trong `backend/tests/` hoặc ví dụ trong kế hoạch tích hợp hệ thống; không xác định được
  thông tin xác thực production hay dữ liệu cá nhân thật.

Phép quét chỉ báo cáo tệp, dòng và loại phát hiện. Phép quét không in giá trị `.env` cục bộ.

## 4. Danh mục RBAC và xác thực

| Khu vực | Kiểm soát phía máy chủ quan sát được |
| --- | --- |
| Xác thực FE02 | `express-validator` trên đầu vào xác thực; xác thực Bearer trên điểm cuối được bảo vệ; kiểm tra khóa tài khoản và hết hạn token trong dịch vụ. |
| Hồ sơ FE03 | Xác thực trên mọi tuyến; dịch vụ từ chối trường được bảo vệ, xác thực độ dài/ngày/URL và kiểm tra MIME, phần mở rộng, kích thước cùng chữ ký tệp ảnh đại diện. |
| Sách FE05 | Chỉ duyệt/chi tiết công khai; điểm cuối quản lý yêu cầu Thủ thư/Quản trị viên; dịch vụ chuẩn hóa ID, văn bản, URL, trạng thái, phân trang và tham chiếu. |
| Kho FE06 | Middleware Thủ thư/Quản trị viên cùng bộ xác thực tuyến cho ID, bộ lọc, mã vạch, trạng thái, vị trí, trang và giới hạn. |
| Mượn FE07 | Middleware Thành viên hoặc nhân viên theo từng hành động cùng bộ xác thực tuyến; dịch vụ lặp lại kiểm tra vai trò và quy tắc nghiệp vụ. |
| Đặt chỗ FE08 | Middleware Thành viên/nhân viên theo từng hành động cùng bộ xác thực tuyến cho ID, trạng thái, lý do và xử lý hàng đợi. |
| Tiền phạt FE09 | Xác thực trên mọi tuyến; dịch vụ thực thi phân quyền chủ sở hữu/nhân viên/quản trị viên và xác thực ID, số tiền, trạng thái thanh toán cùng lý do xử lý. |
| Thông báo FE10 | Middleware Thủ thư/Quản trị viên, xác thực tuyến và ranh giới dịch vụ, danh sách mẫu chuẩn cho phép, lưu trữ payload an toàn cùng lỗi nhà cung cấp an toàn. |
| Người dùng/Quản trị viên FE11 | Middleware Quản trị viên trên mọi tuyến; dịch vụ xác thực ID, thay đổi vai trò/trạng thái, văn bản, phân trang và ràng buộc mượn đang hoạt động. |
| Báo cáo FE12 | Middleware Thủ thư/Quản trị viên và bộ xác thực tuyến cho ngày, ID, trạng thái, vai trò cùng bộ lọc thành viên. |

Rà soát kho lưu trữ phát hiện các giá trị SQL được truyền qua `mssql.Request.input`. Các đoạn SQL động là
mệnh đề cố định hoặc định danh được chọn từ danh sách cho phép thuộc sở hữu mã, chẳng hạn ánh xạ tài nguyên quản trị viên;
không có giá trị do người dùng kiểm soát nào được nối vào truy vấn.

## 5. Các phát hiện đã hoàn tất

| ID | Mức độ | Phát hiện | Khắc phục và bằng chứng |
| --- | --- | --- | --- |
| W12-DEP-001 | Cao | Tệp khóa frontend phân giải `form-data@4.0.5` có lỗ hổng. | Chỉ cập nhật mục khóa bắc cầu thành 4.0.6; kiểm toán production frontend hiện báo cáo không có lỗ hổng. |
| W12-AUTH-001 | Cao | Tuyến sách, quản trị và quản lý người dùng cấp người dùng đặc quyền tổng hợp bất cứ khi nào `NODE_ENV` chưa đặt hoặc không phải production. Vì vậy, `npm start` đơn thuần có nguy cơ cho phép truy cập đặc quyền chưa xác thực. | Đã xóa mọi lối tắt phát triển ngầm; tuyến được bảo vệ giờ luôn chạy middleware xác thực và RBAC. Ba kiểm thử hồi quy bao phủ khi chưa đặt `NODE_ENV`. |
| W12-ERR-001 | Trung bình | Lỗi 5xx mang thuộc tính `details` trả đối tượng nội bộ đó cho máy khách. | Chi tiết lỗi giờ chỉ được bao gồm dưới trạng thái 500; kiểm thử hồi quy xác minh chính xác cấu trúc bao 5xx chung. |
| W12-CORS-001 | Trung bình | Production dùng `cors()` không hạn chế và trả về `Access-Control-Allow-Origin: *`. | Production giờ dùng danh sách cho phép `CORS_ORIGINS` phân tách bằng dấu phẩy và đóng an toàn với yêu cầu khác nguồn chưa cấu hình; hành vi cùng nguồn và phát triển cục bộ vẫn khả dụng. Hai kiểm thử hồi quy bao phủ nguồn được phép và bị từ chối. |

## 6. Bằng chứng lỗi và thông báo an toàn

- Phản hồi 5xx không xác định và nội bộ chỉ trả về `INTERNAL_ERROR` và `Internal server error.`;
  dấu vết ngăn xếp và chi tiết nội bộ không được trả cho máy khách.
- Phản hồi HTTP thông báo chỉ hiển thị ID, trạng thái và số lượng tổng hợp.
- Bản ghi thông báo xác minh/đặt lại nhạy cảm lưu `title: null`, `body: null` và
  `safePayload: { redacted: true }`; giá trị lũy đẳng được suy ra bằng HMAC.
- Chuỗi payload xếp hàng không nhạy cảm được làm sạch, khóa lồng nhạy cảm bị từ chối và
  lỗi nhà cung cấp lưu thông báo cố định `Notification delivery failed.`.
- Lần chạy Jest tập trung vào bảo mật đạt 135/135 kiểm thử trên xác thực, phân quyền tiền phạt,
  an toàn thông báo, phân quyền quản lý người dùng và các kiểm thử hồi quy bảo mật mới.

## 7. Rủi ro Trung bình/Thấp được chấp nhận

| ID | Mức độ | Rủi ro được chấp nhận | Chủ sở hữu | Theo dõi |
| --- | --- | --- | --- | --- |
| W12-RISK-001 | Trung bình | Token truy cập và làm mới được lưu trong `localStorage` hoặc `sessionStorage`, nên lỗi XSS tương lai có thể làm lộ chúng. ADR hiện tại để việc lưu trữ phía máy khách cho kế hoạch frontend. | Nhóm FE02/frontend (Nhật điều phối) | Trước khi triển khai công khai, chuyển token làm mới sang cookie Secure, HttpOnly, SameSite và giữ token truy cập thời hạn ngắn trong bộ nhớ khi khả thi. |
| W12-RISK-002 | Trung bình | Việc thực thi HTTPS được giao cho môi trường triển khai; kho mã này không chứa chính sách reverse-proxy/TLS production. | Chủ sở hữu triển khai / trưởng nhóm | Yêu cầu HTTPS tại proxy lưu trữ, cấu hình tiêu đề proxy đáng tin và xác minh chuyển hướng/từ chối HTTP trước khi phát hành. |
| W12-RISK-003 | Trung bình | Có khóa tài khoản nhưng không có middleware giới hạn tốc độ đăng nhập rõ ràng theo IP. | Chủ sở hữu backend FE02 | Thêm và kiểm thử bộ giới hạn tốc độ theo IP/người dùng trước khi cung cấp đăng nhập trên Internet công khai. |
| W12-RISK-004 | Thấp | Swagger UI khả dụng không cần xác thực và làm lộ siêu dữ liệu API. | Chủ sở hữu backend | Tắt hoặc hạn chế `/api-docs` trong production nếu bản triển khai không chủ đích cung cấp tài liệu API công khai. |

## 8. Danh sách kiểm tra rà soát bởi con người

- Xác nhận việc xóa lối tắt xác thực phát triển ngầm có thể chấp nhận với mọi quy trình cục bộ.
- Xác nhận nguồn frontend production được liệt kê trong `CORS_ORIGINS` khi frontend/backend được lưu trữ
  riêng.
- Xác nhận các rủi ro được chấp nhận và chủ sở hữu trong Phần 7 với trưởng nhóm trước khi phát hành công khai.
- Rà soát `backend/tests/securityRegression.test.js` và cập nhật một mục trong tệp khóa frontend.

## 9. Cổng chất lượng cuối cùng

| Kiểm tra | Kết quả quan sát được |
| --- | --- |
| Jest backend | PASS: 307/307 kiểm thử, 24/24 bộ |
| Cổng độ bao phủ backend | PASS: câu lệnh 93.02%, nhánh 83.22%, hàm 96.37%, dòng 92.94% |
| Tích hợp hệ thống SQL | PASS: 1/1 kiểm thử điều phối có chốt chỉnh sửa trên môi trường SQL cục bộ rõ ràng |
| Frontend tests | PASS: 38/38 |
| Frontend lint | PASS |
| Bản dựng production frontend | PASS: 14,327 mô-đun; chỉ còn cảnh báo kích thước phân đoạn 952.62 kB hiện có |
| Chromium Playwright | PASS: 1/1 luồng chuẩn trong 17.6 giây |
| Thực thi truy vết | PASS: 6 tính năng đã triển khai, không có tính năng nào dưới 70% |
| Sản phẩm được tạo/cục bộ | PASS: độ bao phủ, dist frontend, báo cáo/kết quả Playwright và `.env` cục bộ được bỏ qua và không theo dõi |
| Kiểm tra khoảng trắng Git | PASS: `git diff --check` thoát với mã 0 |
