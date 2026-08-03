# CHANGELOG.md - Quản lý thành viên FE04

## 2026-08-03 - Candidate chốt Azure Staging cho Admin Membership Review

- Ghi nhận local Playwright FE04 + FE11 đạt 2/2 và thoát sạch, thay thế giới hạn teardown Windows cũ.
- Ghi nhận Azure Staging run `lms-fe04-acceptance-20260803-90ac1d5b` trên `850b01b` đạt phân quyền 401/403/200, từ chối -> nộp lại -> phê duyệt, bốn viewport và terminal conflict.
- Xác minh cleanup active token/user/member/pending application bằng 0, ba login và token cũ bị từ chối, runtime/helper 404/404; không lưu PII/secret/artifact thô.
- Ghi nhận suite liên tính năng FE04/FE07/FE08/FE10/FE12 đạt 162/162 và làm rõ FE07 dùng tier 5/3 trong khi FE08 không bị trạng thái FE04 chặn.
- Ghi nhận H2 vòng 1 được duyệt trên fingerprint `8cef30463f1e4cd2f4ee80862cca282c297f902a`; `FE04-T009` hoàn tất.
- Giữ Implementation State `PARTIAL`; `FE04-ADM05` và `FE04-CONV-002` vẫn chờ nghiệm thu thủ công/xác nhận owner.

## 2026-08-03 - H3/manual-owner acceptance hoàn tất FE04

- H3 vòng 1 PR #107 chấp nhận bằng chứng staging, L1, cleanup, responsive và manual/owner tại permalink `#issuecomment-5162255705`.
- Đóng `FE04-ADM05`, `FE04-CONV-002` và chuyển Implementation State FE04 sang `COMPLETE`.
- Giữ H2 vòng 2, exact-head CI và H3 cuối là cổng tích hợp của amendment PR C, không phải khoảng trống hành vi FE04.

## 2026-07-25 - Kiểm tra lại trạng thái FE04

- Kiểm tra lại nguồn FE04 hiện tại, kiểm thử tập trung, traceability và các nhiệm vụ mở rộng; không tìm thấy sai lệch hợp đồng/mã nguồn mới.
- Giữ việc thoát sạch trình duyệt, Azure Staging, H2 và nghiệm thu thủ công là bằng chứng phát hành đang mở thay vì đánh dấu FE04 đã phát hành hoàn toàn.

## 2026-07-24 - Đối soát trạng thái hợp đồng/mã nguồn FE04

- Đồng bộ tài liệu FE04 đã phê duyệt với phần triển khai Admin Console hiện tại: độ bao phủ nguồn cục bộ là `14/14 FR`, suite frontend là `219/219` và suite backend FE04 tập trung là `30/30`.
- Ghi nhận riêng kịch bản trình duyệt FE04 đã xác thực và giới hạn teardown webServer Windows còn lại, tách khỏi Azure Staging, H2 và các cổng nghiệm thu thủ công vẫn mở.

## 2026-07-23 - Triển khai cục bộ rà soát thành viên trong Admin Console

- Nhúng review FE04 vào Admin Console FE11 trong khi giữ FE04 sở hữu bộ lọc danh sách, phân trang, mutation phê duyệt/từ chối, phân quyền, audit, thông báo và workspace `/membership` hiện có.
- Thêm quyết định chỉ dành cho đơn đang chờ, lý do từ chối bắt buộc 1..500 ký tự, tải lại có thẩm quyền sau quyết định/conflict và phản hồi không chặn luồng cho quyết định đã commit nhưng FE10 gửi thất bại.
- Thêm hợp đồng nguồn bảng/thẻ responsive và ghi nhận toàn bộ frontend 219/219, lint, production build vượt qua; trình duyệt responsive đã xác thực, Azure Staging và nghiệm thu thủ công vẫn đang mở.

## 2026-07-22 - Phê duyệt tích hợp rà soát thành viên trong Admin Console

- Phê duyệt một phần review FE04 gốc Admin được nhúng sau User Management trong khi vẫn giữ workspace Thành viên/Thủ thư `/membership` hiện có.
- Giữ API FE04 chuẩn, chuyển đổi trạng thái chỉ khi đang chờ, phân quyền ở server, hành vi audit nguyên tử và gửi kết quả FE10 không chặn luồng.
- Thêm `FR-FE04-014`, `AC-FE04-013` cùng yêu cầu trình bày responsive/thông báo; việc triển khai và xác thực chưa bắt đầu.

## 2026-07-22 - Yêu cầu hồ sơ đầy đủ trước khi nộp đơn

- Yêu cầu họ tên, số điện thoại, ngày sinh và địa chỉ không trống trước khi tạo đơn thành viên; avatar vẫn tùy chọn.
- Thêm thực thi ở server cùng hướng dẫn trường thiếu cho thành viên và liên kết đến `/profile`.

## 2026-07-21 - Kết nối phê duyệt với hạn mức mượn

- Giữ việc mượn khả dụng cho tài khoản `MEMBER` đang hoạt động không có phê duyệt FE04 với giới hạn 3 bản sao mỗi ngày.
- Xác định thành viên `APPROVED` chuẩn là quyền hưởng hạn mức 5 bản sao mỗi ngày mà FE07 sử dụng.
- Cập nhật trạng thái và lợi ích đơn hướng thành viên để hiển thị rõ hạn mức 3 hoặc 5 bản sao mỗi ngày hiện tại.

## 2026-07-21 - Tách đơn thành viên khỏi phân quyền lưu thông

- Làm cho trạng thái đơn FE04 độc lập với điều kiện mượn FE07 và đặt chỗ FE08.
- Tài khoản đang hoạt động có vai trò `MEMBER` có thể sử dụng quy trình lưu thông không cần phê duyệt FE04.

## 2026-07-20 - Bản địa hóa UI tiếng Việt và typography

- Bản địa hóa nhãn, trạng thái, tên hỗ trợ khả năng truy cập và phản hồi lỗi an toàn do frontend tạo cho tính năng này.
- Giữ hợp đồng API, giá trị enum thô, quyền, quy tắc nghiệp vụ và dữ liệu catalog/hồ sơ thuộc người dùng.
- Áp dụng hợp đồng typography dùng chung với `Be Vietnam Pro` cho phần thân và `Noto Serif` cho heading cùng font fallback hỗ trợ Unicode.

## 2026-07-19 - Chốt thoát Giai đoạn 2

- feat-membership-management được chấp nhận trong đợt đối soát đầy đủ FE01-FE12 của Giai đoạn 2 ghi nhận bởi PR #40/#41; kết quả xác thực và ranh giới còn lại được hợp nhất tại `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Các giới hạn hoãn lại và thuộc phạm vi tương lai vẫn được nêu rõ, không bị mở rộng bởi lần chốt này.

## 2026-07-19 - Đối soát thành viên chuẩn

- Thêm unique index chỉ dành cho đơn đang chờ, metadata model, quyết định ADR và migration FE04 idempotent trong khi giữ lịch sử đơn đã phê duyệt/bị từ chối.
- Làm cho mutation nộp đơn/review/thành viên/audit nguyên tử, tuần tự hóa tranh chấp in-memory, khóa review SQL và trả về envelope trạng thái an toàn cho người nộp đơn chuẩn.
- Thêm hành vi bên yêu cầu `MEMBERSHIP_RESULT` sau commit chính xác cùng trạng thái gửi an toàn không chặn luồng và không làm lộ lỗi provider.
- Đối soát UI thành viên với trường server chuẩn, trạng thái lỗi đúng sự thật, tìm kiếm phía server, hành vi làm mới sau mutation và giới hạn từ chối 500 ký tự.
- Ghi nhận bằng chứng không-SQL mới: backend 619/619, frontend 122/122, ngưỡng coverage, lint, build, import, trace FE04 12/12 và vệ sinh diff đều vượt qua.
- Áp dụng migration FE04 hai lần trên SQL Server disposable và vượt qua tất cả 10/10 trường hợp SQL FE04; dọn dẹp được ghi tại `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Nghiệm thu thủ công ở trình duyệt/liên tính năng vẫn đang chờ.

## 2026-07-18 - Tích hợp UI Thành viên và Thủ thư

- Hiển thị workspace review FE04 hiện có trong điều hướng Thủ thư, đồng thời giữ tích hợp review Admin Console.
- Loại đơn thành viên bịa đặt khi API thất bại và hiển thị trạng thái lỗi FE04 chuẩn thay vào đó.
- Đồng bộ UI nộp đơn thành viên với hợp đồng body trống đã phê duyệt và làm mới layout Thành viên responsive.

## 2026-07-18 - Đồng bộ danh sách review Admin

- Thêm tìm kiếm dựa trên cơ sở dữ liệu theo ID đơn, tên người nộp đơn, username hoặc email.
- Thêm metadata `total` và `totalPages` chuẩn vào response danh sách review được bảo vệ.
- Đồng bộ refresh, trạng thái tải, bộ lọc, phân trang và nội dung review tiếng Việt của Admin với quy trình FE04.

## 2026-07-17 - Phê duyệt baseline Giai đoạn 1

- Nhật phê duyệt vòng đời thành viên FE04 đã chuẩn hóa, projection thành viên chuẩn, timestamp phê duyệt và ranh giới FE10 làm baseline Giai đoạn 1; công việc tiếp theo về triển khai vẫn đang chờ.

## 2026-07-17 - Khả năng truy vết timestamp phê duyệt

- Yêu cầu timestamp server khớp nhau cho `MembershipApplications.ApprovedAt` và `Members.ApprovedAt` khi phê duyệt.
- Yêu cầu `Members.ApprovedAt = null` khi từ chối và mở rộng mục tiêu trace/kiểm thử liên quan.

## 2026-07-17 - Hợp đồng timestamp phê duyệt và thông báo chuẩn

- Phân biệt `MembershipApplications.ApprovedAt` với `Members.ApprovedAt` chuẩn.
- Chuẩn hóa request thông báo FE04 thành `GENERAL_SYSTEM -> MEMBERSHIP_RESULT` và bắt buộc request gửi nhưng không chặn luồng.

## 2026-07-17 - Sửa đổi ranh giới bên yêu cầu FE04/FE10

- Tăng `SPEC.md` lên v0.2.1 và đồng bộ `TASKS.md` thành `READY FOR REVIEW`.
- Xác nhận FE04 sở hữu `MEMBERSHIP_RESULT` và phải dùng bên yêu cầu FE04 gắn với cấu tạo sau khi quyết định thành viên commit.
- Cập nhật allowlist nguồn nội bộ và hợp đồng traceability của FE10 để bao gồm FE04 mà không thay đổi quyền HTTP.

## 2026-07-16 - Phê duyệt rà soát thủ công về lập kế hoạch

- Nhat phê duyệt kế hoạch triển khai FE04 và phân rã nhiệm vụ theo thứ tự.
- Đánh dấu `PLAN.md` và `TASKS.md` là `APPROVED`; nhiệm vụ triển khai vẫn chưa đánh dấu và chưa bắt đầu.

## 2026-07-16 - Phân rã lập kế hoạch triển khai

- Thay `PLAN.md` và `TASKS.md` placeholder bằng kế hoạch đối soát prototype `READY FOR REVIEW` cho SPEC v0.2.0 đã phê duyệt.
- Thêm nhiệm vụ RED/GREEN theo thứ tự cho điều kiện `Members` chuẩn, lịch sử đơn bất biến, đồng thời SQL, ghi audit nguyên tử, `MEMBERSHIP_RESULT` FE10 và trạng thái frontend dựa trên server.
- Ánh xạ toàn bộ 41 yêu cầu BR/FR/AC tới nhiệm vụ triển khai, tệp, phụ thuộc, lệnh và cổng rà soát thủ công cụ thể.

## 2026-07-16 - Phê duyệt rà soát thủ công

- Nhat xác nhận rà soát thủ công bản sửa đổi v0.2.0.
- Đánh dấu `SPEC.md` và `CONTEXT.md` là `APPROVED` và hoàn tất cổng rà soát bản sửa đổi.

## 2026-07-15 - Hợp đồng thành viên chuẩn (v0.2.0)

- Đặt `Members.Status` làm nguồn điều kiện chuẩn cho FE07/FE08 trong khi giữ `MembershipApplications` là lịch sử bất biến.
- Xác định cập nhật application/member/audit nguyên tử, chọn đơn gần nhất có tính xác định và quy tắc đồng thời cho một đơn đang chờ.
- Làm cho lý do từ chối và metadata audit bắt buộc, loại `EXPIRED` khỏi Giai đoạn 1 và đặc tả việc người dùng bị từ chối nộp lại đơn.
- Thêm việc gửi `MEMBERSHIP_RESULT` FE10 không chặn luồng sau khi quyết định review commit.
- Xác định response `membershipStatusView = NONE` không được lưu cho người dùng chưa nộp đơn và đồng bộ các hàng `Members` tùy chọn trước khi nộp đơn.
- Mở rộng traceability BR/FR/AC với mục đích kiểm thử dự kiến cụ thể và loại ánh xạ `TBD` còn lại.

## 2026-06-25

- Hoàn tất Ma trận traceability để bao phủ mọi ID BR/FR/AC.

## 2026-06-10

- Tạo cấu trúc đặc tả tính năng Quản lý thành viên FE04.
- Thiết lập các tệp đặc tả: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md và CHANGELOG.md.
- Đồng bộ chủ sở hữu và phạm vi phân công với bảng phân công mới nhất: UC13-UC16 và FT14-FT17 do Dat sở hữu.
- Xác định ranh giới FE04 với Xác thực FE02, Hồ sơ người dùng FE03, Mượn FE07, Đặt chỗ FE08 và Quản lý người dùng và vai trò FE11.
- Làm rõ chính sách hợp đồng API để REST endpoint có thể ở trong SPEC.md trừ khi nhóm giới thiệu lại tệp hợp đồng API dùng chung.

## 2026-06-10 - Phê duyệt quyết định rà soát Giai đoạn 1

- Phê duyệt quyết định câu hỏi mở từ `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Cập nhật trạng thái quyết định `SPEC.md` từ draft/proposed/open thành approved khi phù hợp.
- Giữ rõ các biện pháp kiểm soát phạm vi Giai đoạn 1 và hạng mục công việc tương lai được hoãn.
## 2026-07-22

- Ẩn điều hướng chỉ dành cho Thành viên khỏi tác nhân nhân viên và làm phản hồi từ chối trung lập.
