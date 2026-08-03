# Bản ghi chấp nhận chức năng cốt lõi tuần 13

Ngày: 2026-07-14

Ứng viên phát hành: Tuần 13 Môi trường tiền sản xuất Azure

Trạng thái tổng thể: SẴN SÀNG NGHIỆM THU CỦA CON NGƯỜI

Hồ sơ lịch sử: tệp này lưu giữ trạng thái ứng cử viên Tuần 13 năm 2026-07-14. Bằng chứng triển khai
Giai đoạn 3 hiện tại được ghi lại trong
[`phase3-staging-evidence-2026-07-19.md`](phase3-staging-evidence-2026-07-19.md). Các mục người dùng
trực tiếp không được chọn bên dưới vẫn không được chọn trừ khi chúng thực sự được quan sát bằng tài
khoản môi trường tiền sản xuất an toàn.

## Quy tắc chứng cứ

- Bằng chứng tự động L1 không thay thế sự chấp nhận của con người L4.
- Chỉ những kết quả quan sát được mới được đánh dấu ĐẠT.
- Trạng thái chức năng vẫn được gắn với `SPEC.md`, `TASKS.md` đã được phê duyệt và các bản ghi đánh giá.
- FE09 căn chỉnh trình duyệt và giao diện người dùng hộp thư đến FE10 vẫn còn những hạn chế rõ ràng.
- Đánh giá theo giai đoạn phải sử dụng dữ liệu tổng hợp và không được tiết lộ thông tin xác thực, mã thông báo, thông báo
  nội dung, chuỗi kết nối hoặc nội dung `.env`.

## Bằng chứng chất lượng được chia sẻ

| Bằng chứng | Kết quả quan sát |
| --- | --- |
| Tích hợp hệ thống | FE07, FE08, FE09, FE10 và FE12 chia sẻ một quy trình làm việc đã được kiểm thử và duy trì trạng thái SQL. |
| luồng nghiệp vụ chuẩn của trình duyệt | Đăng nhập -> mượn -> phê duyệt -> trả sách -> phạt API -> báo cáo được chuyển trong Chrome. |
| Cổng máy chủ | Các kiểm thử 307/307 đã vượt qua; mức độ bao phủ vẫn ở mức trên 80% cho mọi chỉ số được định cấu hình. |
| Cổng vào | Đã vượt qua các kiểm thử, kiểm tra mã và bản dựng sản xuất 38/38. |
| Cổng an ninh | Kiểm tra phần phụ thuộc sản xuất gốc, máy chủ và giao diện người dùng báo cáo không tìm thấy Critical/High. |
| Cổng truy vết | Sáu chức năng được triển khai đáp ứng ngưỡng FR `@spec` được thực thi. |

mốc cơ sở hiện tại của Giai đoạn 3 thay thế số lượng trong bảng lịch sử này: tất cả 12 gói chức năng
đều báo cáo `Implementation State: COMPLETE`, truy vết 100% FR, kiểm tra máy chủ 916/916 và kiểm tra
giao diện người dùng 149/149.

Nguồn:

- [Bằng chứng tích hợp hệ thống](../../.sdd/reviews/system-integration-evidence-2026-07-14.md)
- [Bằng chứng trình duyệt tuần 11](../../.sdd/reviews/week11-e2e-evidence-2026-07-14.md)
- [Bằng chứng độ bao phủ Tuần 11](../../.sdd/reviews/week11-coverage-evidence-2026-07-14.md)
- [Kiểm tra bảo mật tuần 12](../../.sdd/reviews/week12-security-audit-2026-07-14.md)

## Ma trận chức năng

| chức năng | Nguồn chuẩn | Bằng chứng tự động | Bằng chứng của con người | Quyết định hiện tại |
| --- | --- | --- | --- | --- |
| Xác thực FE02 | [ĐẶC TẢ](../../.sdd/specs/feat-auth/SPEC.md), [NHIỆM VỤ](../../.sdd/specs/feat-auth/TASKS.md), [KẾ HOẠCH KIỂM THỬ](../../.sdd/specs/feat-auth/TEST_PLAN.md) | `authRoutes`, `authUtils`, hồi quy bảo mật và cổng máy chủ đầy đủ | Hành vi đăng nhập, đăng xuất, mã thông báo không hợp lệ và đặt lại ở môi trường tiền sản xuất vẫn cần xem xét trực quan lần cuối | SẴN SÀNG NGHIỆM THU CỦA CON NGƯỜI |
| Mượn sách FE07 | [ĐẶC TẢ](../../.sdd/specs/feat-borrowing-management/SPEC.md), [NHIỆM VỤ](../../.sdd/specs/feat-borrowing-management/TASKS.md), [KẾ HOẠCH KIỂM THỬ](../../.sdd/specs/feat-borrowing-management/TEST_PLAN.md) | Kiểm thử tuyến/dịch vụ, tích hợp SQL và luồng nghiệp vụ chuẩn của trình duyệt | [Đánh giá B7 của con người đã được ghi lại](../../.sdd/reviews/fe07-b7-integration-review-closeout-2026-07-14.md); cần kiểm tra lại môi trường tiền sản xuất | SẴN SÀNG KIỂM TRA LẠI TIỀN SẢN XUẤT |
| Đặt chỗ FE08 | [ĐẶC TẢ](../../.sdd/specs/feat-reservation-management/SPEC.md), [NHIỆM VỤ](../../.sdd/specs/feat-reservation-management/TASKS.md), [KẾ HOẠCH KIỂM THỬ](../../.sdd/specs/feat-reservation-management/TEST_PLAN.md) | Kiểm thử tuyến/dịch vụ đặt chỗ và bằng chứng hàng đợi tích hợp hệ thống | Hành vi hàng đợi của Thành viên và nhân viên cần được xem xét ở môi trường tiền sản xuất lần cuối | SẴN SÀNG NGHIỆM THU CỦA CON NGƯỜI |
| API máy chủ FE09 | [ĐẶC TẢ](../../.sdd/specs/feat-fine-management/SPEC.md), [NHIỆM VỤ](../../.sdd/specs/feat-fine-management/TASKS.md), [KẾ HOẠCH KIỂM THỬ](../../.sdd/specs/feat-fine-management/TEST_PLAN.md) | Kiểm thử ủy quyền/tính khoản phạt, tích hợp SQL và bàn giao API qua Playwright | API phù hợp hợp đồng sản xuất cần được xem xét ở môi trường tiền sản xuất; giao diện kế thừa không phải bằng chứng nghiệm thu | SẴN SÀNG VỚI GIỚI HẠN GIAO DIỆN |
| Thông báo FE10 | [ĐẶC TẢ](../../.sdd/specs/feat-notification-management/SPEC.md), [NHIỆM VỤ](../../.sdd/specs/feat-notification-management/TASKS.md), [KẾ HOẠCH KIỂM THỬ](../../.sdd/specs/feat-notification-management/TEST_PLAN.md) | Kiểm thử an toàn thông báo và bằng chứng siêu dữ liệu tích hợp hệ thống | Siêu dữ liệu an toàn và hành vi lỗi cần được xem xét ở môi trường tiền sản xuất; giao diện hộp thư được hoãn | SẴN SÀNG VỚI GIỚI HẠN GIAO DIỆN |
| Báo cáo FE12 | [ĐẶC TẢ](../../.sdd/specs/feat-reporting-statistics/SPEC.md), [NHIỆM VỤ](../../.sdd/specs/feat-reporting-statistics/TASKS.md), [KẾ HOẠCH KIỂM THỬ](../../.sdd/specs/feat-reporting-statistics/TEST_PLAN.md) | Kiểm thử tuyến/dịch vụ báo cáo, tích hợp SQL và luồng nghiệp vụ chuẩn của trình duyệt | [Đánh giá B7 của con người đã được ghi lại](../../.sdd/reviews/fe12-b7-integration-review-closeout-2026-07-13.md); cần kiểm tra lại môi trường tiền sản xuất | SẴN SÀNG KIỂM TRA LẠI TIỀN SẢN XUẤT |

## Giới hạn chấp nhận đã biết

- FE09 `FineManagement.jsx` vẫn chứa quy trình lưu trữ cục bộ phục vụ trình diễn trên lớp. Nghiệm thu Tuần 13
  chỉ có máy chủ API phù hợp với sản xuất và chuyển giao tích hợp làm bằng chứng phát hành.
- FE10 chưa có giao diện người dùng hộp thư thông báo hoàn chỉnh. Chấp nhận Tuần 13 bao gồm yêu cầu an toàn,
  hành vi xếp hàng, thử lại, kiểm tra và siêu dữ liệu.
- Việc gửi email theo giai đoạn Azure không được coi là ĐẠT trừ khi SMTP được định cấu hình và quan sát.
- Các chức năng vẫn được đánh dấu `NOT STARTED` hoặc `DRAFT` nằm ngoài ứng cử viên phát hành này.

## Danh sách kiểm tra giai đoạn của con người

- [ ] Thành viên đăng nhập thành công và các tuyến đường được bảo vệ không được xác thực sẽ chuyển hướng hoặc trả về 401 một cách chính xác.
- [ ] Thành viên tạo yêu cầu mượn bằng dữ liệu staging tổng hợp.
- [ ] Thủ thư phê duyệt yêu cầu và xử lý việc trả sách.
- [ ] Hành vi hàng đợi đặt chỗ FE08 của Thành viên/nhân viên khớp với các chuyển đổi trạng thái đã được phê duyệt.
- [ ] FE09 API tính 14 ngày quá hạn là 70.000 VND và ghi khoản phạt là PAID.
- [ ] FE10 hiển thị siêu dữ liệu an toàn không có nội dung token/link/body thô.
- [ ] FE12 hiển thị hoạt động mượn tích hợp và vẫn ở chế độ chỉ đọc.
- [ ] Chế độ xem trên máy tính để bàn và thiết bị di động không bị chặn hoặc chồng chéo không mạch lạc.
- [ ] đặt lại/dọn dẹp không để lại trạng thái chờ tổng hợp không giải thích được.

## Đăng xuất

Người đánh giá:

Ngày:

Quyết định: SẴN SÀNG TIỀN SẢN XUẤT / CẦN THAY ĐỔI

Ghi chú:
