# Xác thực tái cấu trúc toàn bộ frontend Bảng điều khiển Quản trị viên - 2026-07-22

## Quyết định

Phần tái cấu trúc Bảng điều khiển Quản trị viên chỉ thuộc Shell đã phê duyệt được triển khai và
xác thực cục bộ tại `5925ec08924569c72bae61a74ad1e9b3937702b6`. Tuyến vẫn là
`/admin/users`, phần mặc định vẫn là Quản lý Người dùng và mọi hợp đồng về API Core,
lược đồ, phân quyền, vai trò, vòng đời, che dữ liệu kiểm toán và quyền sở hữu
liên tính năng vẫn không thay đổi.

`FE11-UXR01..FE11-UXR06` đã hoàn tất. `FE11-UXR07` vẫn mở cho đến khi cả bằng chứng
triển khai Azure Staging và phê duyệt trực quan trên máy tính/di động có xác thực
bởi con người đều được ghi nhận. Kiểm tra đáp ứng tự động không được xem là
xác nhận trực quan bởi con người.

## Ranh giới đã triển khai

- Đã thay phần triển khai `UserManagement.jsx` dài 3,146 dòng bằng một dòng
  xuất tương thích tới `admin/AdminConsolePage`.
- Đã tách Bảng điều khiển Quản trị viên thành shell được bảo vệ, thành phần trình bày nguyên thủy dùng chung
  cùng các mô-đun Bảng điều khiển, Người dùng, Yêu cầu, Quyền, Kiểm toán, Thư viện và Lưu hành
  riêng biệt.
- Đã giữ chính xác tám mục điều hướng được phê duyệt và một URL
  `/admin/users` duy nhất.
- Đã giữ FE07 làm chủ chỉnh sửa yêu cầu/trả/gia hạn, FE11 làm chủ người dùng,
  quyền và kiểm toán, FE12 làm chủ thống kê người dùng, FE05 làm chủ chỉnh sửa sách
  chuẩn, đồng thời giữ FE04/FE09 ngoài Bảng điều khiển Quản trị viên.
- Chỉ xóa mã thành viên/thanh toán không thể truy cập khỏi khối Quản trị viên
  nguyên khối trong lịch sử.

## Bằng chứng kiểm thử trước

Mỗi lát cắt triển khai bắt đầu bằng hợp đồng RED tập trung cho phần còn thiếu:
chủ sở hữu trình bày, thành phần, mục hoặc điểm tương thích. RED chuyển đổi cuối cùng
chứng minh điểm vào cũ chưa phải phần xuất mô-đun một dòng
chính xác. Sau đó, bằng chứng GREEN bao phủ trình trợ giúp trình bày thuần, shell được bảo vệ,
mọi mục Quản trị viên, ranh giới sở hữu mô-đun, hành vi đáp ứng chuyển
bảng thành thẻ và điểm tương thích.

## Xác thực tự động cục bộ mới

| Lệnh | Kết quả |
| --- | --- |
| `npm.cmd --prefix frontend test` | PASS - 191/191 |
| `npm.cmd --prefix frontend run lint` | PASS - không có phát hiện |
| `npm.cmd --prefix frontend run build` | PASS - bản dựng Vite production |
| `npm.cmd --prefix backend test -- --runInBand` | PASS - 54/54 bộ, 926/926 kiểm thử |
| `npm.cmd run trace:enforce` | PASS - cả 12 tính năng đã triển khai đều trên ngưỡng; FE11 có 36/38 thẻ FR (95%) |
| `npm.cmd run test:deployment` | PASS - 8/8 |
| `npm.cmd run test:system` | PASS - 10/10 |
| `npm.cmd run test:e2e` với URL/cổng frontend cô lập rõ ràng | PASS - 4/4 Chromium |
| Tập trung `fe11-admin-request-management.spec.js` | PASS - 1/1 Chromium |
| `git diff --check` theo phạm vi trước khi sửa bằng chứng | PASS - không có lỗi khoảng trắng |

Lần chạy lại E2E đầy đủ dùng cổng frontend cô lập và cung cấp rõ ràng
các giá trị `E2E_FRONTEND_URL` cùng `E2E_BACKEND_URL` khớp nhau. Những lần thử trước
chỉ đổi biến cổng đã chạy trên URL máy chủ/mặc định có sẵn
thay vì máy chủ kiểm thử cô lập; các lỗi môi trường đó không
thực thi ứng dụng ứng viên. Lần chạy được căn chỉnh đúng đã đạt 4/4.

## Bằng chứng đáp ứng và trình duyệt

`E2E-FE11-ACC01` đã đạt với dữ liệu Quản trị viên có xác thực và chứng minh:

- 1366x768: bảng Quản lý Người dùng hiển thị, thẻ di động ẩn, tài liệu không
  tràn.
- 390x844: bảng ẩn, thẻ người dùng hiển thị, hành động có nhãn `Chỉnh sửa`
  có thể tiếp cận, tài liệu không tràn.
- Phần tổng hợp Bảng điều khiển Quản trị viên vẫn dựa trên API.
- Phân trang yêu cầu, bộ lọc, xuất DOCX, chi tiết có thẩm quyền, hành động
  đang chờ và tính bất biến của trạng thái cuối vẫn nguyên vẹn.

Hợp đồng đáp ứng cấp mã nguồn cũng chứng minh trình đơn di động có thể truy cập, kiểu
tiêu điểm, hành vi giảm chuyển động, bảng máy tính và phần trình bày thẻ di động.

## Rà soát an toàn và quyền sở hữu

- Không có tệp production về backend, lược đồ, di chuyển, bộ chuyển đổi API, xác thực hay chính sách
  quyền nào thay đổi trong lần tái cấu trúc này.
- Không đưa vào chỉnh sửa sách FE05 trùng lặp.
- Không chuyển quy trình thành viên FE04 hay phạt/thanh toán FE09 vào Quản trị viên.
- Kết xuất kiểm toán dùng trường DTO lồng an toàn và nhãn trình bày
  đã bản địa hóa; siêu dữ liệu thô và kết xuất HTML không an toàn vẫn không xuất hiện.
- Thay đổi vai trò người dùng vẫn xác thực toàn bộ danh mục dạng số, gán trước khi
  thu hồi và đối soát lỗi một phần từ chi tiết máy chủ có thẩm quyền.

## Azure Staging và chấp nhận bởi con người

Triển khai staging tự động đã đạt cho
`903a1a25656b9383fa687c11239aeea33070f48f`:

- quy trình [29871576856](https://github.com/SWP391-LibraryManagement/LibraryManagement/actions/runs/29871576856)
  kết thúc với `success`;
- `deploy-backend`, `deploy-frontend` và `smoke-test` đều kết thúc với `success`;
- `GET https://app-library-api-staging-nhat714.azurewebsites.net/health`
  trả về HTTP 200 cùng `{"status":"ok"}`;
- `GET https://lemon-wave-04db51100.7.azurestaticapps.net/admin/users`
  trả về HTTP 200 cùng gốc SPA.

Vẫn đang chờ:

- quy trình duyệt staging có xác thực ở 1366x768 và 390x844;
- phê duyệt trực quan rõ ràng bởi con người.

`FE11-UXR07` vẫn mở cho đến khi người rà soát chấp nhận rõ ràng
trải nghiệm máy tính/di động có xác thực. Smoke quy trình và bằng chứng Playwright
có xác thực cục bộ không thay thế lần rà soát staging bởi con người đó.
