# Xác thực sửa UX Quản trị viên đã xác thực - 2026-07-22

## Quyết định

Phần sửa trình bày Quản trị viên đã xác thực được triển khai và xác thực cục bộ
tại `157b59b`. Đây là phần sửa chỉ dành cho Khung theo `FE11-UXR08`:
thanh bên không còn cung cấp đích Quyền riêng, Quản lý
người dùng chuyển sang thẻ trước khi bảng máy tính để bàn có thể gây
cuộn ngang cấp trang và Kiểm toán giữ mọi bộ lọc chuẩn trong khi làm cho
thao tác và chi tiết hàng an toàn dễ đọc hơn.

Không có hợp đồng backend, API, lược đồ, xác thực, phân quyền, chính sách vai trò, vòng đời,
phân trang hoặc che dữ liệu kiểm toán nào thay đổi. Việc triển khai Azure Staging đã
đạt. `FE11-UXR08` và phần cha `FE11-UXR07` vẫn còn mở đến khi một
người đánh giá đã xác thực chấp thuận phần trình bày máy tính để bàn/di động đã triển khai.

## Ranh giới trình bày đã sửa

- Thanh bên Quản trị viên cung cấp chính xác bảy mục và chỉ bỏ đích
  `permissions` riêng.
- Quản lý vai trò người dùng vẫn có thể truy cập qua thao tác `Phân quyền` trong
  Quản lý người dùng; luồng thay đổi vai trò FE11 không bị xóa hoặc viết lại.
- Quản lý người dùng dùng bảng trên 1440px và thẻ đáp ứng ở 1440px
  trở xuống, ngăn thao tác kéo ngang cấp trang được báo khi đánh giá.
- Kiểm toán giữ đầu vào truy vấn `q`, `action`, `actorId`, `from` và `to`.
- Mục nhập thao tác Kiểm toán chấp nhận giá trị thô chuẩn và cung cấp gợi ý
  tiếng Việt dễ đọc mà không thay đổi giá trị gửi tới API.
- Chi tiết kiểm toán an toàn được thu gọn theo hàng và bảng dùng các cột ngữ nghĩa
  giới hạn, cắt ngắn văn bản tác nhân/đích dài và trình bày ngày/giờ gọn.

## Bằng chứng kiểm thử trước

Hợp đồng ĐỎ trọng tâm thất bại do thiếu hợp đồng điều hướng bảy mục,
thiếu điểm ngắt bảng-sang-thẻ 1440px, thiếu lựa chọn thao tác Kiểm toán
và thiếu phần công khai chi tiết theo hàng. Các hợp đồng XANH tương ứng
hiện đạt và được đưa vào toàn bộ bộ frontend.

## Xác thực tự động cục bộ mới

| Lệnh | Kết quả |
| --- | --- |
| `npm.cmd --prefix frontend test` | PASS - 192/192 |
| `npm.cmd --prefix frontend run lint` | PASS - không có phát hiện |
| `npm.cmd --prefix frontend run build` | PASS - bản dựng Vite production |
| `npm.cmd run trace:enforce` | PASS - mọi tính năng đã triển khai trên ngưỡng; FE11 có 36/38 thẻ FR (95%) |
| `fe11-admin-request-management.spec.js` trọng tâm với cổng cô lập | PASS - 1/1 Chromium |
| `git diff --check` | PASS - không có lỗi khoảng trắng |

Lần chạy trình duyệt cô lập dùng cổng frontend `48173` và cổng backend `43100`
để không sửa các tiến trình Vite cục bộ có từ trước.

## Bằng chứng đáp ứng và hình ảnh

Độ bao phủ trình duyệt đã xác thực chứng minh tài liệu không
tràn ngang và phần trình bày Quản lý người dùng dự kiến hoạt động tại mỗi
chiều rộng đánh giá:

- `output/playwright/admin-user-management-1440.png` - thẻ;
- `output/playwright/admin-user-management-1366.png` - thẻ;
- `output/playwright/admin-user-management-1280.png` - thẻ;
- `output/playwright/admin-user-management-390.png` - thẻ di động;
- `output/playwright/admin-audit-1366.png` - bộ lọc được giữ lại, cột dễ đọc
  và phần công khai chi tiết an toàn theo hàng.

Xác nhận thanh bên cũng chứng minh chính xác bảy mục không có đích Quyền,
trong khi xác nhận Quản lý người dùng chứng minh nút quản lý vai trò
vẫn khả dụng.

## Xác thực bốn lớp

- **L1 Triển khai:** PASS - nguồn, hợp đồng trọng tâm, toàn bộ kiểm thử frontend,
  lint và bản dựng đều đạt.
- **L2 Truy vết:** PASS - phần sửa ánh xạ tới BR-FE11-016..018,
  FR-FE11-030/032/033, AC-FE11-016..018 và Q-FE11-011.
- **L3 An toàn ranh giới:** PASS - thay đổi production được giới hạn ở các tệp
  trình bày Quản trị viên; quyền sở hữu API và hành vi bảo mật không đổi.
- **L4 Tích hợp:** TỰ ĐỘNG ĐẠT - Chromium đã xác thực, ảnh
  đáp ứng, triển khai Azure, kiểm tra nhanh, tình trạng và tuyến SPA trực tiếp đạt.
  Phê duyệt hình ảnh rõ ràng của con người vẫn đang chờ.

## Azure Staging và chấp thuận của con người

Quy trình [29873466035](https://github.com/SWP391-LibraryManagement/LibraryManagement/actions/runs/29873466035)
triển khai `8627508e729f91deb74279bf7b47cd764c078934` thành công:

- `deploy-backend`, `deploy-frontend` và `smoke-test` đều kết thúc với `success`;
- `GET https://app-library-api-staging-nhat714.azurewebsites.net/health`
  trả về HTTP 200 với `status: ok`;
- `GET https://lemon-wave-04db51100.7.azurestaticapps.net/admin/users`
  trả về HTTP 200 với gốc SPA.

Vẫn đang chờ: đánh giá của con người đã xác thực đối với Quản lý người dùng và Kiểm toán ở các
chiều rộng máy tính để bàn/di động đã triển khai. Bằng chứng tự động không thay thế chấp thuận
hình ảnh đó.
