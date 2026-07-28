# CHANGELOG.md - Hồ sơ người dùng FE03

## 2026-07-28 - Sửa lỗi gửi avatar khi lưu hồ sơ

- Tải avatar hợp lệ đã chọn qua endpoint multipart hiện có khi người dùng submit biểu mẫu chỉnh sửa hồ sơ.
- Cập nhật kiểm thử hồi quy trình duyệt để xác minh thao tác lưu phát `POST /api/profile/me/avatar` và kết xuất avatar được trả về.

## 2026-07-28 - Sửa lỗi kết xuất avatar khác origin

- Cho phép tệp `/uploads/avatars/` được quản lý kết xuất trên frontend được host riêng sau khi tải lên.
- Thêm kiểm thử hồi quy tệp static xác minh header response `Cross-Origin-Resource-Policy: cross-origin` bắt buộc.

## 2026-07-24 - Xác minh avatar trên trình duyệt

- Thêm `tests/e2e/fe03-profile-avatar.spec.js` bao phủ tải PNG hợp lệ, từ chối loại tệp không được hỗ trợ và từ chối tệp vượt kích thước từ màn hình hồ sơ.
- Kiểm tra trình duyệt Playwright vượt qua 3/3; runner chỉ timeout khi dọn dẹp tiến trình webserver sau khi kiểm thử hoàn tất.

## 2026-07-24 - Tăng cường hội tụ

- Từ chối giá trị trường hồ sơ không phải chuỗi trước khi lưu.
- Ngăn submission ngày tháng không thay đổi tạo metadata audit sai về trường đã thay đổi.
- Khôi phục phản hồi API FE03 tiếng Việt dễ đọc và hiển thị lỗi xác thực dữ liệu ở cấp trường/avatar.
- Xác thực request hồ sơ và avatar trước khi tự động tạo hồ sơ thiếu, để request không hợp lệ không thể thay đổi trạng thái hồ sơ.
- Xóa huy hiệu thành viên FE04 ngoài phạm vi khỏi header hồ sơ FE03.
- Thêm kiểm thử hồi quy tập trung; backend 55/55, frontend hồ sơ 6/6, toàn bộ frontend 219/219, lint, build và traceability đều vượt qua.

## 2026-07-20 - Bản địa hóa UI tiếng Việt và typography

- Bản địa hóa nhãn, trạng thái, tên hỗ trợ khả năng truy cập và phản hồi lỗi an toàn do frontend tạo cho tính năng này.
- Giữ hợp đồng API, giá trị enum thô, quyền, quy tắc nghiệp vụ và dữ liệu catalog/hồ sơ thuộc người dùng.
- Áp dụng hợp đồng typography dùng chung với `Be Vietnam Pro` cho phần thân và `Noto Serif` cho heading cùng font fallback hỗ trợ Unicode.

## 2026-07-19 - Chốt thoát Giai đoạn 2

- feat-user-profile được chấp nhận trong đợt đối soát đầy đủ FE01-FE12 của Giai đoạn 2 ghi nhận bởi PR #40/#41; kết quả xác thực và ranh giới còn lại được hợp nhất tại `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Các giới hạn hoãn lại và thuộc phạm vi tương lai vẫn được nêu rõ, không bị mở rộng bởi lần chốt này.

## 2026-07-19 - Đối soát hợp đồng hồ sơ xác định

- Hoàn tất T-FE03-016 với allowlist PUT chính xác, từ chối `avatarUrl` trực tiếp, trường được bảo vệ, trường không xác định và payload trống trước thao tác ghi.
- Chuyển audit trường hồ sơ và avatar vào cùng transaction SQL với thay đổi cơ sở dữ liệu; lỗi audit hiện rollback cập nhật nguồn.
- Tuần tự hóa việc tạo hồ sơ thiếu bằng SQL lock và trả về DTO an toàn đã cập nhật trước khi báo cáo hoàn tất commit transaction cho service.
- Thêm cơ chế bù trừ khi avatar thất bại, chỉ xóa đường dẫn được quản lý, dọn dẹp tệp cũ sau commit và ghi log dọn dẹp không chứa đường dẫn/PII.
- Xóa input Avatar URL chỉ đọc và trường PUT `avatarUrl` khỏi frontend trong khi vẫn giữ thay đổi avatar chỉ qua tải tệp.
- Tăng cường ghi log 5xx dùng chung để văn bản lỗi thô, stack và dữ liệu cá nhân trong query string không bị lưu.
- Thêm bằng chứng route, service, repository, storage, security và coverage tập trung.
- Thêm và vượt qua suite SQL FE03 6/6 cho việc tuần tự hóa ở lần xem đầu tiên và rollback audit hồ sơ/avatar; nghiệm thu hồ sơ/avatar thủ công vẫn đang chờ.
- Đối soát CONTEXT/PLAN/TASKS và ma trận traceability BR/FR/AC đầy đủ với hợp đồng avatar chỉ tải lên đã phê duyệt cùng bằng chứng tự động hiện tại; độ bao phủ nguồn `@spec` hiện bao gồm toàn bộ 10 yêu cầu chức năng FE03.

## 2026-07-19 - Kích hoạt quyền sở hữu cột Thủ thư FE11

- Tăng `SPEC.md` lên 0.3.4 và ghi nhận `UserProfiles.Department` cùng `UserProfiles.Specialization` có thể null với tối đa 100 ký tự là trường do quản trị viên FE11 quản lý.
- Giữ cả hai trường ngoài DTO đọc/cập nhật hồ sơ của chính FE03 và giữ mức tối đa `fullName` hiện có là 100 ký tự.
- Việc triển khai schema/model sản phẩm vẫn chờ Đợt hoàn tất FE11 A.

## 2026-07-17 - Phê duyệt baseline Giai đoạn 1

- Nhật phê duyệt hợp đồng hồ sơ FE03 đã chuẩn hóa, trường được bảo vệ, dọn dẹp avatar, audit và bù trừ lỗi làm baseline Giai đoạn 1; công việc tiếp theo về triển khai vẫn đang chờ.

## 2026-07-17 - Hợp đồng lỗi dọn dẹp avatar

- Xác định ghi log an toàn khi dọn dẹp avatar đã thay thế sau commit thất bại.
- Làm cho phạm vi đọc hồ sơ và cách diễn đạt lỗi tải tệp có thể kiểm thử.

## 2026-07-17 - Hợp đồng bù trừ lỗi avatar - v0.3.3

- Xác định hành vi `404 PROFILE_ACCOUNT_NOT_FOUND` có tính xác định.
- Thêm cơ chế bù trừ cho thao tác ghi cơ sở dữ liệu/audit avatar thất bại và quy tắc dọn dẹp tệp cũ sau commit.

## 2026-07-17 - Hợp đồng hồ sơ xác định - v0.3.2

- Chuyển `SPEC.md` sang `READY FOR REVIEW` sau khi chuẩn hóa hành vi hồ sơ thiếu, trường được bảo vệ, audit và hiển thị trạng thái.
- Hàng hồ sơ thiếu hiện luôn được tự động tạo; trường được bảo vệ, không xác định và chỉ đọc từ chối toàn bộ cập nhật.
- Loại thay đổi `avatarUrl` trực tiếp khỏi PUT hồ sơ; chỉ endpoint tải tệp đã xác thực sở hữu thay đổi avatar.
- Làm cho ghi log audit an toàn là bắt buộc với cập nhật trường hồ sơ và avatar thành công.
- Thêm traceability rõ ràng và nhiệm vụ tiếp theo về triển khai cho code owner.

## 2026-06-25 - Hoàn tất ma trận traceability — v0.3.1

- Hoàn tất Ma trận traceability để bao phủ mọi ID BR/FR/AC.
- Tăng Phiên bản 0.3.0 -> 0.3.1; Cập nhật lần cuối 2026-06-25; Trạng thái vẫn là APPROVED.

## 2026-06-25 - Khóa đặc tả (đã phê duyệt chính sách lưu avatar) — v0.3.0

- Phê duyệt Q-FE03-004: avatar được lưu trên hệ thống tệp cục bộ của server trong thư mục uploads công khai (`/uploads/avatars/`) với tên tệp do server tạo; đường dẫn/URL công khai được lưu trong `UserProfiles.AvatarUrl`. Loại được phép là JPG/JPEG/PNG/WebP, tối đa 2 MB. Cloud/object storage nằm ngoài phạm vi Giai đoạn 1. (Khớp backend đã triển khai ngày 2026-06-20.)
- Thêm BR-FE03-015 ghi nhận vị trí lưu avatar và thêm vào Ma trận traceability.
- Cập nhật PRE-FE03-006 và ghi chú trường dữ liệu `avatarUrl` để tham chiếu chính sách lưu trữ đã phê duyệt.
- Đánh dấu hạng mục checklist rà soát "Chính sách lưu avatar".
- Đổi Trạng thái từ `DRAFT - AVATAR UPLOAD REVISION` thành `APPROVED`; tăng Phiên bản 0.2.0 -> 0.3.0; Cập nhật lần cuối 2026-06-25. Đặc tả Giai đoạn 1 hiện đã khóa.

## 2026-06-20 - Triển khai UI tải avatar ở frontend

- Thêm lời gọi API frontend cho `POST /api/profile/me/avatar` bằng multipart form-data.
- Thêm bộ chọn tệp avatar và nút tải lên trong hộp thoại chỉnh sửa hồ sơ.
- Thêm xác thực dữ liệu phía client cho JPG/JPEG/PNG/WebP và kích thước tối đa 2 MB.
- Cập nhật trạng thái hồ sơ từ response backend sau khi tải avatar thành công.
- Chạy lint frontend và production build thành công.

## 2026-06-20 - Triển khai tải avatar ở backend

- Triển khai `POST /api/profile/me/avatar` sau xác thực.
- Thêm phân tích multipart một tệp cho trường `avatar` mà không thêm dependency mới.
- Thêm xác thực avatar phía server cho JPG/JPEG/PNG/WebP, kích thước tối đa 2 MB, phần mở rộng tệp và signature ảnh.
- Thêm lưu trữ avatar do backend kiểm soát dưới `/uploads/avatars` với tên tệp được tạo.
- Thêm hỗ trợ repository/service để chỉ cập nhật `UserProfiles.AvatarUrl` sau khi tải thành công.
- Thêm kiểm thử backend cho kết nối route, từ chối Khách, từ chối tệp thiếu, tải hợp lệ, từ chối loại không hợp lệ, từ chối tệp vượt kích thước, avatar không đổi khi tải không hợp lệ và không lưu đường dẫn client cục bộ.

## 2026-06-20 - Soạn bản sửa đổi đặc tả tải avatar

- Cập nhật `CONTEXT.md`, `SPEC.md`, `PLAN.md` và `TASKS.md` FE03 để hỗ trợ tải ảnh avatar từ thiết bị cục bộ của người dùng.
- Thêm endpoint được đề xuất `POST /api/profile/me/avatar` sử dụng trường multipart form-data `avatar`.
- Thêm quy tắc xác thực dữ liệu tải avatar: chỉ JPG/JPEG/PNG/WebP, tối đa 2 MB, tên tệp do server tạo và không lưu đường dẫn client cục bộ.
- Thêm quy tắc nghiệp vụ, yêu cầu chức năng, tiêu chí nghiệm thu, trường hợp biên và nhiệm vụ có traceability cho tải avatar.
- Đánh dấu bản sửa đổi spec/plan/tasks là bản nháp đang chờ nhóm rà soát.

## 2026-06-20 - Hoàn tất triển khai backend

- Triển khai route, controller, service, repository, xác thực dữ liệu và DTO an toàn cho hồ sơ FE03 ở backend.
- Thêm `GET /api/profile/me` và `PUT /api/profile/me` sau middleware xác thực hiện có.
- Thêm kiểm thử backend cho kết nối route hồ sơ, DTO response an toàn, tự động tạo hồ sơ thiếu, xác thực dữ liệu, từ chối trường được bảo vệ, lỗi xác thực dữ liệu không ghi dở dang và audit logging.
- Đánh dấu nhiệm vụ backend FE03 hoàn tất trong `TASKS.md`.

## 2026-06-20 - Phê duyệt kế hoạch và nhiệm vụ backend

- Thay `PLAN.md` placeholder bằng kế hoạch triển khai backend được phê duyệt cho FE03.
- Thay `TASKS.md` placeholder bằng các nhiệm vụ backend được phê duyệt, ánh xạ tới ID đặc tả và kiểm thử FE03.
- Giữ phạm vi triển khai giới hạn ở API hồ sơ backend, xác thực dữ liệu, DTO, persistence và kiểm thử.

## 2026-06-10

- Tạo cấu trúc đặc tả tính năng Hồ sơ người dùng FE03.
- Thiết lập các tệp đặc tả: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md và CHANGELOG.md.
- Đồng bộ chủ sở hữu và phạm vi phân công với bảng phân công mới nhất: UC11-UC12 và FT12-FT13 do Dat sở hữu.
- Xác định ranh giới FE03 với Xác thực FE02, Quản lý thành viên FE04 và Quản lý người dùng và vai trò FE11.
- Làm rõ chính sách hợp đồng API để REST endpoint có thể ở trong SPEC.md trừ khi nhóm giới thiệu lại tệp hợp đồng API dùng chung.

## 2026-06-10 - Phê duyệt quyết định rà soát Giai đoạn 1

- Phê duyệt các quyết định câu hỏi mở FE03 từ `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Cập nhật trạng thái `SPEC.md` thành `APPROVED`.
