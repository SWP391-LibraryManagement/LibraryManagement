# Đóng hồ sơ staging và H3 của hộp thư thông báo cá nhân FE10

- Cập nhật: 2026-07-28
- PR: #75
- Mốc cơ sở vòng H3 đầu tiên: `main@a5fcbb989d730923548a67a789a1447b180de2a9`
- Head vòng H3 đầu tiên: `28c4f80ca6e249b7802caf854f9fa42cb4840158`
- Mốc cơ sở hiện tại đã được H1 phê duyệt: `main@30f936d644c2034bbbf9cb4e01ba25feab31595c`
- Head cục bộ đã commit sau rebase: `c72bc77f996a160333c2cb7ee4399f3d591fe17c`
- Head được triển khai/review đầy đủ gần nhất: `cf0a2364b9f526dae4f4e873f261764ea43da777`
- Head cuối cùng đã được H2/H3 review: `778e0a470d8a1083bf571a8007b3c058eee4bb22`
- Commit merge PR #75: `b75776b10d6cf4b6868d2ba51eb3268073483b8b`
- Trạng thái: **HOÀN TẤT — PR #75 ĐÃ MERGE; CI/AZURE SAU MERGE ĐẠT**

Biên bản này khép lại chuỗi FE10-I08 đã được phê duyệt bằng bằng chứng bất
biến. Các phần lịch sử giữ nguyên kết quả H3 đầu tiên và đường khắc phục;
phần 2 và 6 ghi nhận head cuối cùng, phê duyệt H3, merge và kết quả CI/Azure
sau merge mà không đưa ra tuyên bố hành vi mới.

## 1. Ứng viên đã được rà soát và chuỗi phê duyệt

- PR quản trị #70 đã merge với commit `25c09ec`.
- Fingerprint ứng viên vòng H2 thứ hai:
  `2b53d7ecd2247aa72e7ae3c43bab5bd00ab48f0e5a97662455fa8d3db736b40c`.
- Fingerprint addendum H2 hash migration đa nền tảng:
  `f78e0cc9ac7ca5f2f89cb2fe50fe6224c4f02f96fd0492d4674b2e713927f541`.
- Người dùng đã phê duyệt đối soát sai lệch H1 đến
  `main@a5fcbb989d730923548a67a789a1447b180de2a9`.
- Người dùng sau đó phê duyệt addendum sai lệch H1 không chồng lấn đến
  `main@12faeadb9a92fa30cc8dc16aa01467577374c8b0`. Rebase hoàn tất không xung
  đột; sai lệch đi vào chỉ xoá artifact `document/` đã ngừng dùng và không
  chồng lấn các tệp của đợt khắc phục này.
- Vòng H2 thứ 3 đã được phê duyệt nhưng dừng trước khi dùng khi fetch bắt buộc
  trước stage phát hiện `main@a240705fbd486304464b073cbd3caec77a1fa135`. Người
  dùng đã phê duyệt addendum sai lệch H1 đó; việc loại bỏ edit-action Admin
  FE11 ở upstream đã đạt CI `30311801599` và triển khai Azure `30311973740`,
  còn nhánh FE10 rebase không xung đột.
- Head lịch sử `cf0a2364b9f526dae4f4e873f261764ea43da777` sau đó đạt CI
  `30315046007`, Azure staging `30315273298` và các review H3 Standards/Spec
  riêng biệt cuối cùng mà không có phát hiện cần xử lý.
- Vòng H2 thứ 7 đã phê duyệt một chỉnh sửa ba dòng chỉ về khoảng trắng, nhưng
  fetch bắt buộc trước stage phát hiện
  `main@30f936d644c2034bbbf9cb4e01ba25feab31595c`. Người dùng đã phê duyệt
  addendum sai lệch H1 đó. Không tệp nào được stage, commit hay push theo thẩm
  quyền của vòng 7.
- `main@30f936d` dịch tài liệu SDD sang tiếng Việt và không chồng lấn runtime,
  API, migration, UI hoặc kiểm thử với FE10. CI upstream chính xác
  `30315665010` và Azure staging tự động `30315842152` đạt. Nhánh rebase không
  xung đột runtime và giữ nguyên SPEC FE10 đã dịch.
- Vòng H2 thứ 8 đã phê duyệt fingerprint
  `e123345be05b59a9e519d182b301ab5464160e8fc32aed8d17d3c463e28e0a15`.
  PR #75 sau đó publish head cuối `778e0a470d8a1083bf571a8007b3c058eee4bb22`.
- Các review H3 Standards và Spec riêng biệt trên chính xác head đó không trả
  về phát hiện cần xử lý; người dùng đã phê duyệt H3 rõ ràng. PR #75 được merge
  với commit `b75776b10d6cf4b6868d2ba51eb3268073483b8b`.

## 2. Bằng chứng CI và Azure staging tại exact head

| Cổng | Bằng chứng chính xác | Kết quả |
| --- | --- | --- |
| CI PR cuối cùng | Lần chạy `30317424995`, head `778e0a470d8a1083bf571a8007b3c058eee4bb22` | ĐẠT |
| Azure staging thủ công cuối cùng | Lần chạy `30317621429`, head `778e0a470d8a1083bf571a8007b3c058eee4bb22` | ĐẠT |
| CI sau merge | Lần chạy `30341279111`, merge `b75776b10d6cf4b6868d2ba51eb3268073483b8b` | ĐẠT |
| Azure staging tự động sau merge | Lần chạy `30341540847`, merge `b75776b10d6cf4b6868d2ba51eb3268073483b8b` | ĐẠT |
| CI PR | Lần chạy `30306805399`, head `28c4f80ca6e249b7802caf854f9fa42cb4840158` | ĐẠT |
| Azure staging thủ công | Lần chạy `30307855616`, head `28c4f80ca6e249b7802caf854f9fa42cb4840158` | ĐẠT |
| Job triển khai | Preflight, migration/backend, frontend, smoke | ĐẠT |
| Truy cập công khai | HTTPS frontend/API, chuyển hướng HTTP, CORS đã phê duyệt được cho phép, loại bỏ origin độc hại | ĐẠT |
| Vai trò thực | Luồng hộp thư riêng của MEMBER, LIBRARIAN, ADMIN | ĐẠT |

Xác minh Azure SQL đã xác lập:

- một cột `Notifications.ReadAt` nullable và một index
  `IX_Notifications_User_ReadAt_CreatedAt` sau migration lặp lại;
- các dòng lịch sử đủ điều kiện đã được backfill, trong khi probe sau lần chạy
  đầu vẫn chưa đọc;
- các dòng nhạy cảm, không có người dùng và khác người dùng bị loại trừ khỏi
  thao tác cá nhân;
- phát lại mark-one giữ timestamp đọc đầu tiên và phát lại mark-all trả về
  `updated: 0`;
- các aggregate notification/delivery/attempt được bảo vệ đã trở về giá trị
  trước probe;
- mọi người dùng tổng hợp, notification, token, audit và rule firewall Azure
  SQL tạm thời do task tạo ra đều đã bị xoá.

## 3. Kết quả vòng H3 đầu tiên

Vòng H3 đầu tiên review `main@a5fcbb9...28c4f80` theo các trục Standards và
Spec riêng biệt và trả về **KHÔNG ĐẠT**.

### Phát hiện Standards

1. `ADR-002-database-design.md` không ghi nhận cột `ReadAt` đã được phê duyệt,
   index hỗ trợ, migration hay ranh giới triển khai Azure.
2. Các tệp nguồn sự thật FE10 vẫn báo H2/redeploy đang chờ và tham chiếu các
   baseline cũ sau khi addendum, CI, triển khai Azure và kiểm tra môi trường
   sống đã đạt.

### Phát hiện Spec

1. Chưa có biên bản closeout trạng thái hiện tại bắt buộc này.
2. Một mục được đọc thành công có `actionPath: null` hoặc kết quả không điều
   hướng khác vẫn hiển thị chưa đọc vì `/notifications` không reload danh sách
   sau mutation thành công.
3. `Đánh dấu tất cả đã đọc` bị vô hiệu hoá khi trang đã lọc hiện tại trống, dù
   các dòng chưa đọc có thể tồn tại ở bộ lọc khác.

### Phát hiện giao diện do người dùng báo cáo

Ảnh chụp staging cho thấy nội dung trang được vẽ đè lên popover thông báo đang
mở. Nguyên nhân gốc là `.app-topbar` mờ tạo một stacking context mà không có
mức stack sibling tường minh; `.app-content` đến sau có thể được vẽ phía trên
popover dù bản thân popover có `z-index: 90`.

## 4. Trạng thái khắc phục cục bộ

Đợt khắc phục được khoanh vùng:

- ghi nhận quyết định schema trạng thái đã đọc cá nhân trong ADR-002;
- đối soát trạng thái vòng đời hiện tại giữa FE10 SPEC/PLAN/TASKS/CONTEXT, tài
  liệu kiểm thử/phát triển/thiết kế, biên bản closeout này và changelog;
- reload trang thông báo hiện tại sau một lần đọc thành công mà không điều
  hướng đi nơi khác;
- chỉ vô hiệu hoá mark-all khi đang tải hoặc mutation đang chờ;
- gán cho `.app-topbar` một `position: relative; z-index: 40` thông thường và
  chỉ nâng lên `z-index: 100` khi nó chứa popover thông báo đang mở. Popover giữ
  kích thước đã được phê duyệt trong khi trạng thái mở nằm trên mọi lớp layout
  hiện tại, gồm modal (`50`), điều hướng di động (`60`/`70`) và toast (`80`).

RED frontend tập trung tái hiện các hợp đồng trạng thái trang và stacking.
GREEN tập trung sau đó đạt 16/16 kiểm thử. Đây chỉ là bằng chứng cục bộ; nó
không thay thế các cổng khắc phục đầy đủ.

Các cổng cục bộ đầy đủ mới trên mốc cơ sở `main@12faead` đã H1 phê duyệt đã
đạt: backend 69/69 suite và 1116/1116 kiểm thử với độ bao phủ được cấu hình;
frontend 259/259 cùng lint/build; deployment 20/20; system 10/10; trạng thái
truy vết 3/3 và độ bao phủ FE10 bị ép 14/16 (88%); Chromium 11/11; audit
dependency, chuẩn bị schema Azure, diff hygiene và quét mâu thuẫn, unfinished
marker và conflict. Các kết quả này chỉ cho phép chuẩn bị ứng viên H2 mới.

Việc triển khai tự động sau đó của `main@a240705` tạm thời khiến Azure staging
không còn phục vụ ứng viên PR #75 chưa merge. Lần chạy lịch sử `30307855616`
vẫn hợp lệ cho head `28c4f80`; tình trạng đó sau này được khép lại bằng vòng H2
thứ 4, publish `3f9f23a` và triển khai Azure tại exact head `30313949983`.

Các cổng cục bộ đầy đủ mới sau rebase `main@a240705` đã được phê duyệt đã đạt:
backend 69/69 suite và 1084/1084 kiểm thử với độ bao phủ được cấu hình;
frontend 259/259 cùng lint/build; deployment 20/20; system 10/10; trạng thái
truy vết 3/3 và FE10 14/16 (88%); Chromium 11/11; audit, chuẩn bị schema Azure
và diff hygiene. Số lượng backend thấp hơn là kết quả dự kiến khi upstream xoá
các kiểm thử edit-action FE11 đã lỗi thời, không phải do bỏ qua kiểm thử FE10.

## 5. Bằng chứng runtime tại exact head

- Fingerprint vòng H2 thứ 4
  `f41dbf50680d9c5601ae00d3c53651a7bb782ff81724ca641ef49b7cd88844e4`
  đã được phê duyệt rõ ràng.
- Đợt khắc phục đã phê duyệt được commit và push với head PR #75
  `3f9f23a0bc8705590a977e31b03b05a6d2845628`.
- CI tại exact head `30313721511` đã đạt.
- Triển khai Azure staging thủ công `30313949983` đã đạt các job preflight,
  backend, frontend và smoke.
- `https://www.thuvienhub.io.vn` trả về `200`; health và readiness backend trả
  về `ok`; `GET /api/notifications/mine` ẩn danh trả về `401` được bảo vệ với
  CORS origin chính xác đã phê duyệt.
- Xác minh Azure SQL chỉ đọc trực tiếp tìm thấy chính xác một cột `ReadAt`
  nullable và chính xác một index `IX_Notifications_User_ReadAt_CreatedAt`.
  Các dòng probe tạm thời và rule firewall IP chính xác tạm thời đã bị xoá.
- Bằng chứng lịch sử ba vai trò về bản ghi riêng/loại trừ nhạy cảm/phát lại đọc
  trên `28c4f80` vẫn áp dụng cho hợp đồng backend FE10 không thay đổi. Chromium
  cục bộ tại remediation head chính xác bao phủ hành vi trạng thái trang và
  stacking đã đổi; frontend đã triển khai cũng được quan sát thêm trên domain
  Azure thay vì localhost.

## 6. Các cổng bắt buộc đã hoàn tất

| Cổng | Bằng chứng bất biến | Kết quả |
| --- | --- | --- |
| H2 sau sai lệch | Fingerprint `e123345be05b59a9e519d182b301ab5464160e8fc32aed8d17d3c463e28e0a15` | ĐÃ PHÊ DUYỆT |
| Chất lượng/triển khai tại exact head | CI `30317424995`; Azure staging `30317621429`; head `778e0a470d8a1083bf571a8007b3c058eee4bb22` | ĐẠT |
| H3 | Review Standards và Spec riêng biệt: không có phát hiện cần xử lý; người dùng đã phê duyệt rõ ràng exact head | ĐÃ PHÊ DUYỆT |
| Tích hợp | PR #75 được merge với commit `b75776b10d6cf4b6868d2ba51eb3268073483b8b` | ĐẠT |
| Runtime sau merge | CI `30341279111`; Azure staging tự động `30341540847` | ĐẠT |

Closeout chỉ thay đổi các trường bằng chứng/trạng thái và chuyển tiếp task đã
được phê duyệt. Biên bản này không thay đổi business rule, schema, API, hành
vi UI, cấu hình Azure hay dữ liệu database.
