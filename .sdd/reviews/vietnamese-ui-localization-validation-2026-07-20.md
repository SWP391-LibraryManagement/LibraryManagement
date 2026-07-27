# Xác thực bản địa hóa UI tiếng Việt - 2026-07-20

## Quyết định

Đây là hoạt động xác thực Hybrid SDD + ADD ở mức độ sâu Tiêu chuẩn. Thiết kế
bản địa hóa là thay đổi Shell có thể hoàn nguyên bao quanh Core FE01-FE12 đã được chấp nhận. Giá trị
trạng thái thô, hợp đồng API, quyền, ngữ nghĩa xác thực, quy tắc nghiệp vụ
và dữ liệu danh mục/hồ sơ thuộc sở hữu người dùng vẫn không thay đổi.

PR #58 đã được merge thành `cce59d0`. Sau đó PR #59 merge phần đối soát đã qua rà soát H3
thành `eed2688`; bằng chứng CI/triển khai trên main hiện tại được ghi riêng bên dưới.
Chấp nhận trực quan trên máy tính/di động bởi con người đã được người rà soát dự án xác nhận trong
phiên Codex ngày 2026-07-21 bằng các ảnh chụp màn hình kiểm toán UI được giữ lại.

## L1 - Kiểm tra tự động

Lần chạy CI theo đường cơ sở ứng dụng `29712597463` đã đạt:

- Truy vết: 12/12 tính năng, 243/243 thẻ FR.
- Backend: 53/53 bộ, 917/917 kiểm thử; câu lệnh 92.68%, nhánh 81.66%, hàm 96.59%, dòng 92.61%.
- Frontend: 171/171 kiểm thử, lint và bản dựng production.
- Chấp nhận trên trình duyệt: 4/4 bộ Playwright.
- Kiểm tra nhập backend và nền tảng triển khai.

Quy trình staging theo đường cơ sở ứng dụng `29712612188` đã đạt cổng chất lượng, triển khai backend
và frontend cùng sáu kiểm tra smoke: `frontend`, `health`,
`sql-catalog`, `allowed-cors`, `blocked-cors` và `protected-route`.

Phần đối soát sau đó bổ sung kiểm thử hồi quy bản địa hóa có giới hạn, sửa các
nhãn chỉ dùng để trình bày còn lại và bổ sung hợp đồng bố cục đáp ứng cho điều hướng HomePage,
chân trang và CTA mà không thay đổi giá trị thô hay hành vi quy trình.
Xác thực cục bộ mới đạt 173/173 kiểm thử frontend; kết quả 171/171
bên trên vẫn là kết quả lịch sử chính xác của lần chạy CI `29712597463`.

Rà soát trình duyệt đáp ứng tập trung đã đạt 1/1 ở 1440px và 390px, đồng thời
tạo ảnh chụp màn hình trong `output/playwright/h3-visual/`. Bộ kiểm thử trực quan
cũng ghi nhận một `INTERNAL_ERROR` từ `GET /api/books`, nên nội dung thẻ sách/chi tiết
không được chấp nhận làm bằng chứng trực quan trong lần chạy đó.

Theo dõi main hiện tại: `origin/main@a8729f9` đã đạt CI `29824756487` (923 kiểm thử
backend, 178 kiểm thử frontend, lint, bản dựng, kiểm tra triển khai và 4/4 E2E trình duyệt)
cùng lần triển khai staging `29824944954` (triển khai frontend/backend và smoke).
Các kết quả tự động này được bổ sung bằng chấp nhận máy tính/di động bởi con người
được ghi bên dưới.

Lần theo dõi ứng viên H2 cục bộ ngày 2026-07-21 xác định hai lỗi hồi quy hẹp ở `390px`
về trình bày mà kiểm tra tràn cấp tài liệu không phát hiện:
huy hiệu ứng viên FE08 vượt ra ngoài thẻ và hàng hành động Quản trị viên FE11
không có khoảng cách với tiêu đề trang. Các khẳng định giới hạn/khoảng cách theo hướng kiểm thử trước
đã thất bại trên bố cục ban đầu, rồi đạt sau khi khắc phục CSS chỉ dành cho di động.
Bằng chứng mới là 178/178 kiểm thử frontend, lint, bản dựng production, 4/4 luồng Playwright
và các ảnh chụp màn hình
`output/playwright/release-member-reservations-mobile-fixed.png` và
`output/playwright/release-admin-users-mobile-fixed.png`. API, hành vi quy trình,
bố cục máy tính và cuộn ngang bên trong bảng Quản trị viên không thay đổi.

## L2 - Đặc tả và truy vết

- Phạm vi thiết kế được triển khai trong `frontend/src/i18n/vi.js`,
  `frontend/src/utils/uiLabels.js`, các bề mặt trang/thành phần đã bản địa hóa và
  bộ phân giải dự phòng API tiếng Việt.
- `frontend/test/vietnameseUi.test.js` xác minh nội dung, ánh xạ hiển thị
  vai trò/trạng thái, việc giữ nguyên giá trị thô, kết nối siêu dữ liệu/phông chữ, phương án dự phòng API an toàn
  và chốt bảo vệ đã kiểm toán về việc không còn nội dung tiếng Anh.
- Nhật ký thay đổi của cả mười hai tính năng ghi nhận thay đổi trình bày liên tính năng.

## L3 - Hiến chương và an toàn

- Không có lược đồ cơ sở dữ liệu, payload API, quyền vai trò, quy tắc nghiệp vụ
  xác thực hay hợp đồng quy trình thư viện nào thay đổi trong lô bản địa hóa.
- Các giá trị kỹ thuật như `Email`, `OTP`, `Barcode`, mã enum/trạng thái thô,
  tựa sách, tên tác giả, địa chỉ email và giá trị mã vạch vẫn
  không bị chỉnh sửa tại ranh giới logic/dữ liệu.
- Lỗi backend không xác định sử dụng thông báo dự phòng tiếng Việt an toàn thay vì làm lộ
  thông báo kỹ thuật thô.

## L4 - Xác minh chấp nhận

| Hạng mục chấp nhận | Trạng thái | Bằng chứng |
| --- | --- | --- |
| Nội dung và nhãn tiếng Việt được tạo | PASS | 173/173 kiểm thử frontend cục bộ mới cùng chốt bảo vệ kiểm toán `vietnameseUi.test.js`; CI từ xa `29712597463` đã đạt đường cơ sở 171 kiểm thử trước đó |
| Giá trị thô và nội dung thuộc sở hữu người dùng được giữ nguyên | PASS | Khẳng định mã nguồn và kiểm thử quy trình hiện có |
| Kết nối siêu dữ liệu và kiểu chữ tiếng Việt | PASS | Kiểm thử mã nguồn và bản dựng production |
| Frontend/backend đang triển khai vẫn hoạt động tốt | PASS | Sáu kiểm tra smoke của quy trình staging `29712612188` |
| Ghi nhận bố cục đáp ứng trên máy tính/di động | PASS — ỨNG VIÊN CỤC BỘ ĐÃ ĐƯỢC H2 PHÊ DUYỆT | Rà soát Playwright tập trung đạt 1/1 ở 1440px và 390px; lỗi hồi quy hộp giới hạn FE08/FE11 sau đó đã đạt trên ứng viên được khắc phục; ảnh chụp đã sửa được giữ trong `output/playwright/` |
| Chấp nhận trực quan bản địa hóa chuyên biệt trên máy tính/di động | PASS — ỨNG VIÊN CỤC BỘ ĐÃ ĐƯỢC H2 PHÊ DUYỆT | Người rà soát dự án xác nhận lần rà soát 12 màn hình ban đầu ngày 2026-07-21; lần rà soát sửa lỗi còn kiểm tra đặt chỗ FE08 và người dùng Quản trị viên FE11 ở 390px sau hai bản sửa tối thiểu |

## Các ranh giới còn lại

- Siêu dữ liệu PR GitHub không chứa bản ghi rà soát riêng cho PR #58;
  mọi PR đối soát/phát hành trong tương lai phải ghi bằng chứng H2/H3 của chính nó trước khi
  tạo thẻ phát hành mới. Điều này không hồi tố rà soát PR #58.
- Chấp nhận trực quan bởi con người đã được ghi nhận; video/liên kết trình diễn vẫn chưa công bố.
- CI SQL dùng chung dùng một lần, lưu trữ ảnh đại diện bền vững và SLA production vẫn
  nằm ngoài phạm vi bản phát hành sinh viên đã phê duyệt.
