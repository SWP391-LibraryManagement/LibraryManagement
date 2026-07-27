# Xác thực đối soát quản trị và phát hành - 2026-07-20

Trạng thái: HOÀN TẤT CỤC BỘ ĐƯỢC H2 PHÊ DUYỆT; H3 ĐÃ PHÊ DUYỆT PR #59; ĐANG CHỜ QUYẾT ĐỊNH H3 VÀ PHÁT HÀNH MỚI

## Quyết định

Lần hoàn tất này dùng Hybrid SDD + ADD ở độ sâu Đầy đủ. Xác thực FE02 và
quyền sở hữu gửi OTP nhạy cảm là Core; siêu dữ liệu phát hành, danh mục kiểm thử,
hoàn tất bản địa hóa, phần trình bày đáp ứng và bộ nhớ dự án là
các sản phẩm Shell có thể hoàn nguyên.

Lô PR #59 trước đó không thay đổi backend, lược đồ, API, phân quyền,
quyền, phần phụ thuộc hay cấu hình triển khai. Ứng viên hoàn tất cục bộ sau đó
thêm bảo trì kiểm toán tệp khóa/gói đã rà soát, cổng kiểm toán CI và
hai bản sửa trình bày chỉ dành cho di động cùng hồi quy hộp giới hạn. Ứng viên không thay đổi
lược đồ, API, phân quyền, quyền hay hành vi nghiệp vụ.
Phê duyệt H2 bởi con người đã được nhận trong tác vụ Codex vào 2026-07-20 cho phần
đối soát đã công bố cùng bản sửa HomePage đáp ứng (`962ceb1` và
`daaeea6`). Sau đó PR #59 được merge thành `eed2688` sau rà soát H3 và CI xanh.
Lô sản phẩm main hiện tại sau đó cần lần rà soát phát hành cuối riêng.
Phê duyệt H2 bởi con người cho toàn bộ phần khác biệt hoàn tất cục bộ đã được nhận trong
tác vụ Codex vào 2026-07-21. Phê duyệt đó cho phép tập commit đã rà soát này và
việc công bố nhánh/PR sau đó, nhưng không cho phép merge H3 hay thẻ phát hành.

## Phạm vi thay đổi

- Đã đối soát FE02 v0.6.4 với ADR-004 và ranh giới bên yêu cầu FE10 đã merge:
  FE02 sở hữu thông tin xác thực OTP; FE10 sở hữu kết xuất xác minh/đặt lại, việc gửi,
  trạng thái, lần thử và siêu dữ liệu thông báo an toàn.
- Đã giữ khả năng tương thích token xác minh/đặt lại cũ, lỗi không gây chặn,
  tính lũy đẳng theo ID token và đường dẫn FE02 trực tiếp `CHANGE_PASSWORD_OTP`.
- Đã làm mới danh mục kế hoạch kiểm thử chuẩn và ảnh chụp mức sẵn sàng FE01-FE12.
- Đã phân biệt `v1.0.2@c988af1` được công bố với `main@a8729f9` hiện tại; mọi
  `v1.0.3` tương lai phải trỏ tới SHA đã được con người phê duyệt và rà soát sau lô
  main hiện tại sau đó.
- Đã thêm bằng chứng quản trị sau tích hợp và bản địa hóa tiếng Việt mà không
  bịa đặt phê duyệt H2/H3 hay thẻ phát hành.
- Đã sửa các nhãn trình bày tiếng Việt còn sót trên bề mặt quản lý người dùng,
  kho và mượn trong khi giữ nguyên mọi giá trị API/trạng thái, đồng thời
  mở rộng hồi quy bản địa hóa cấp mã nguồn để ngăn tái diễn.
- Đã thêm trình đơn di động HomePage có thể truy cập cùng quy tắc bố cục đáp ứng cho điều hướng, CTA,
  thẻ lợi ích và chân trang; hành động điều hướng/xác thực hiện có vẫn
  không thay đổi.
- Đã cập nhật cách phân giải phần phụ thuộc có lỗ hổng và thêm cổng kiểm toán mức cao
  ở gốc/backend/frontend vào CI; cả ba lần kiểm toán production báo cáo không có
  lỗ hổng.
- Đã thêm bản sửa giới hạn thẻ di động FE08 và khoảng cách thanh trên Quản trị viên FE11 cùng
  khẳng định hình học Playwright và ảnh chụp `390px` đã sửa.

## L1 - Kiểm tra tự động

Xác thực cục bộ mới trên phần khác biệt sửa đáp ứng hiện tại:

| Lệnh | Kết quả |
| --- | --- |
| `npm.cmd run trace:enforce` | PASS; 12/12 tính năng, 243/243 thẻ FR, 100% |
| `npm.cmd run test:traceability-state` | PASS; 3/3 |
| `npm.cmd --prefix backend run test:coverage:ci` | PASS; 53/53 bộ, 917/917 kiểm thử; câu lệnh 92.68%, nhánh 81.66%, hàm 96.59%, dòng 92.61% |
| `npm.cmd --prefix backend run test:integration:system` | PASS; 10/10 |
| `npm.cmd --prefix frontend test` | PASS; 173/173 (CI từ xa `29712597463` vẫn là đường cơ sở 171/171 trước đó) |
| `npm.cmd --prefix frontend run lint` | PASS |
| `npm.cmd --prefix frontend run build` | PASS |
| `npm.cmd run test:deployment` | PASS; 8/8 |
| `npm.cmd run test:e2e` | PASS; 4/4 trong 31.0 giây |
| Lần chạy CI PR #59 `29719151571` | PASS; foundation-checks hoàn tất thành công sau các commit `962ceb1` và `daaeea6` |
| Rà soát Playwright đáp ứng H3 tập trung | PASS (tự động); 1/1 ở 1440px và 390px; ảnh chụp trong `output/playwright/h3-visual/` |
| Phân tích OpenAPI | PASS; `OPENAPI_PARSE_OK` |
| Nhập backend | PASS; `BACKEND_IMPORT_OK` |
| `git diff --check` | PASS cho các tệp được theo dõi; không có lỗi khoảng trắng |
| `git status --short` và `git diff --stat` | PASS; bộ kiểm thử trực quan tạm thời đã bị xóa sau khi thu bằng chứng |

## L2 - Đặc tả và truy vết

- FE02 không còn mô tả việc gửi xác minh/đặt lại qua đường dẫn
  `emailService` trực tiếp hay kho thông báo trùng lặp.
- FE02, FE10, ADR-004, TASKS, TEST_PLAN và phần triển khai giờ thống nhất về
  bên yêu cầu bị ràng buộc với FE02, tính lũy đẳng `AuthTokens.TokenId` và không có trường phản hồi
  OTP gỡ lỗi công khai.
- Tiêu đề trạng thái hiện tại FE01, FE04, FE05, FE06, FE07, FE08, FE09 và FE12 giờ
  báo cáo phạm vi Giai đoạn 2 đã hoàn tất và xác định rõ văn bản cổng mở được giữ
  là lịch sử/bị thay thế. FE08 báo cáo truy vết 29/29 và siêu dữ liệu FE11
  về lược đồ/hoàn thiện trỏ tới bằng chứng đã merge. FE10 ghi lại quan sát nhà cung cấp trực tiếp
  trong khi giữ việc hoãn UI hộp thư đến và bên gọi FE09.
- Cổng truy vết được thực thi vẫn đạt 100% cho cả mười hai tính năng.

## L3 - Hiến chương và an toàn

- Phần khác biệt đã rà soát giới hạn ở sản phẩm SDD/phát hành/kế hoạch/rà soát/bộ nhớ tác nhân,
  sáu tệp trình bày frontend có giới hạn và hai kiểm thử hồi quy frontend.
- Không tệp mã nguồn sản phẩm backend, lược đồ, hợp đồng API, quyền, phần phụ thuộc,
  quy trình hay triển khai nào thay đổi. Lần sửa frontend chỉ bản địa hóa nhãn hiển thị
  và không thay đổi giá trị trạng thái thô, payload yêu cầu, phép so sánh,
  khóa lớp hay hành vi nghiệp vụ/bảo mật.
- Không thêm bí mật, thông tin xác thực, giá trị token, payload nhà cung cấp hay PII thật.
- OTP xác minh/đặt lại thô tiếp tục bị cấm trong lưu trữ, nhật ký, kiểm toán
  và phản hồi HTTP công khai; kiểm thử thu chúng qua phần phụ thuộc được chèn.

## L4 - Xác minh chấp nhận

| Hạng mục chấp nhận | Trạng thái | Bằng chứng |
| --- | --- | --- |
| Nguồn chân lý FE02 khớp hành vi gửi đã merge | PASS | So sánh ADR-004/FE10, kiểm thử xác thực, truy vết |
| Danh mục kiểm thử dự án chuẩn khớp các cổng hiện tại | PASS | Kết quả L1 mới bên trên |
| Bản phát hành đã công bố và mã nguồn sau phát hành được phân biệt | PASS | Kiểm tra Git/thẻ cục bộ và bằng chứng phát hành GitHub |
| Phần triển khai bản địa hóa có gói L1-L4 riêng | PASS | `.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md` |
| Con người rà soát H2 toàn bộ phần khác biệt đối soát | PASS | Được phê duyệt trong tác vụ Codex vào 2026-07-20; các commit `962ceb1` và `daaeea6` chứa bản sửa đáp ứng/bằng chứng đã rà soát |
| Rà soát đáp ứng máy tính/di động tự động | PASS | Playwright tập trung 1/1 với kiểm tra trình đơn/chân trang/CTA và ảnh chụp; lần chạy ghi `GET /api/books` `INTERNAL_ERROR` nên nội dung thẻ sách/chi tiết công khai vẫn chưa được xác minh |
| Con người rà soát trực quan main hiện tại trên máy tính/di động | PASS | Người rà soát dự án xác nhận rà soát vào 2026-07-21 bằng 12 ảnh chụp được giữ trong `output/ui-ux-audit-2026-07-20/` |
| Rà soát tích hợp H3 PR #59 | PASS | Commit merge `eed2688` ghi nhận phê duyệt H3 sau CI xanh và rà soát bằng chứng đáp ứng |
| Con người rà soát H2 ứng viên hoàn tất cục bộ | PASS | Người dùng phê duyệt H2 trong tác vụ Codex vào 2026-07-21 sau bằng chứng RED/GREEN, hồi quy đầy đủ theo phạm vi, ảnh chụp đã sửa và rà soát toàn bộ phần khác biệt |
| Quyết định phát hành main hiện tại bởi con người | PENDING | `main@a8729f9` hiện tại được xác thực bằng CI/triển khai nhưng việc tạo thẻ nằm ngoài phê duyệt này |

## Các ranh giới còn lại

- Bộ kiểm thử tập trung trước không thể xác minh nội dung thẻ sách/chi tiết công khai
  vì backend E2E của nó trả về `INTERNAL_ERROR` cho `GET /api/books`; các ảnh chụp
  kiểm toán UI hiện tại được giữ sau đó đã được người rà soát
  dự án chấp nhận vào 2026-07-21.
- Video/liên kết trình diễn vẫn chưa được công bố.
- Kiểm toán phần phụ thuộc main hiện tại giờ được thực thi cục bộ và trong CI; gói
  phát hành cuối phải giữ bằng chứng kiểm toán không có lỗ hổng.
- CI mặc định không có dịch vụ SQL Server dùng chung dùng một lần; kiểm thử E2E/hệ thống
  hiện tại dùng bộ kiểm thử xác định, còn bằng chứng SQL trực tiếp trong lịch sử vẫn
  nằm trong gói đối soát Giai đoạn 2.
- ESLint backend không được cấu hình làm kịch bản/cổng CI; không có mã backend nào thay đổi
  trong lô này.

## Phần bổ sung hoàn tất tự động — 2026-07-21

Bản làm việc hiện tại được fast-forward tới `main@a8729f9`, các phần phụ thuộc được
cài lại từ tệp khóa cuối cùng và các cổng cục bộ sau đã đạt:

| Cổng | Kết quả |
| --- | --- |
| `npm.cmd run trace:enforce` | PASS; 12/12 tính năng, 243/243 thẻ FR, 100% |
| `npm.cmd --prefix backend test` | PASS; 54 bộ, 923/923 kiểm thử |
| `npm.cmd --prefix backend run test:integration:system` | PASS; 10/10 |
| `npm.cmd --prefix backend run test:coverage:ci` | PASS; câu lệnh 92.61%, nhánh 81.55%, hàm 96.68%, dòng 92.54% |
| `npm.cmd --prefix frontend test` | PASS; 178/178 |
| lint và bản dựng frontend | PASS |
| `npm.cmd run test:deployment` | PASS; 8/8 |
| `npm.cmd run test:e2e` | PASS; 4/4 |
| `npm audit --audit-level=high` (gốc/backend/frontend) | PASS; 0 lỗ hổng trong mỗi workspace |
| `git diff --check` | PASS; không có lỗi khoảng trắng |

Quy trình CI giờ thực thi kiểm toán mức cao cho cả ba workspace.
Chấp nhận trực quan máy tính/di động bởi con người đã được ghi; việc công bố
video trình diễn và quyết định của con người về gắn thẻ bản phát hành mới vẫn chủ ý để mở.

Vệ sinh sản phẩm: đã xóa các ZIP/thư mục kết xuất triển khai chưa được theo dõi
(`backend/.zip`, `backend/.env.zip` và `output/azure-mail-20260721-145625*`),
đồng thời chỉ giữ 12 ảnh chụp kiểm toán UI trong
`output/ui-ux-audit-2026-07-20/` làm bằng chứng rà soát.

## Phần bổ sung phê duyệt H2 cục bộ — 2026-07-21

Quyết định: **PASS — ĐƯỢC PHÉP COMMIT**

- L1 tự động: các khẳng định hình học FE08 và FE11 được quan sát RED trước
  bản sửa và GREEN sau đó; 178/178 kiểm thử frontend, lint, bản dựng production,
  4/4 luồng Playwright, truy vết 12/12 tính năng và 243/243 FR cùng
  `git diff --check` đều đạt.
- L2 đặc tả: phần triển khai vẫn nằm trong khắc phục trực quan di động Tác vụ 7
  đã phê duyệt và kế hoạch đối soát hoàn tất phát hành.
- L3 hiến chương/an toàn: không có mã nguồn sản phẩm backend, lược đồ, API, quyền,
  phân quyền hay quy tắc nghiệp vụ nào thay đổi; thay đổi phần phụ thuộc bị giới hạn ở
  khắc phục kiểm toán đã rà soát; không bao gồm bí mật hay PII thật.
- L4 chấp nhận: ảnh chụp FE08 và FE11 đã sửa được kiểm tra ở `390px`,
  với điều khiển nằm gọn và bảng Quản trị viên giữ cuộn bên trong.

Quyết định H2 này cho phép tập commit cục bộ đã rà soát. Push nhánh, công bố
PR, phê duyệt merge H3 và mọi thẻ `v1.0.3` vẫn là hành động riêng biệt.
