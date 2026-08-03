# Giai đoạn 3 Thiết kế hoàn thiện và bàn giao

Ngày: 2026-07-19

Quyết định: Hybrid SDD + ADD, Chiều sâu đầy đủ.

## Mục tiêu

Kết thúc Giai đoạn 3 của lộ trình (tuần 13-15) cho phạm vi FE01-FE12 đã được chấp nhận: chứng minh
việc triển khai giai đoạn hiện tại, thu thập bằng chứng hiệu suất và kiểm thử của người dùng, đồng
thời cung cấp tài liệu cuối cùng, bản trình bày và các tạo phẩm diễn tập mà không phát minh ra bằng
chứng bên ngoài.

## ranh giới

Hành vi cốt lõi vẫn là hợp đồng Giai đoạn 2 đã được phê duyệt. Công việc này có thể thay đổi cấu
hình triển khai, tài liệu vận hành, công cụ đo lường và nội dung trình bày. Nó không được thay đổi
các quy tắc nghiệp vụ chức năng, lược đồ SQL, quyền sở hữu API, ngữ nghĩa xác thực hoặc ủy quyền vai
trò mà không có đặc tả chức năng được phê duyệt riêng và ADR.

Môi trường môi trường tiền sản xuất là Azure Static Web Apps + Azure App Service + Azure SQL. Quy
trình làm việc vẫn được gửi thủ công và phải vượt qua cổng chất lượng, cả công việc triển khai và
kiểm thử nhanh. App Service nằm phía sau một proxy, vì vậy các yêu cầu xác thực sản xuất yêu cầu
`TRUST_PROXY=true` cho phần mềm trung gian thực thi HTTPS hiện có để tuân thủ chính xác giao thức
được chuyển tiếp.

## Sản phẩm bàn giao giai đoạn 3

1. Bằng chứng triển khai hiện tại gắn liền với `main` SHA chính xác, bao gồm cả
chạy quy trình công việc, kiểm tra điểm cuối, CORS nghiêm ngặt, từ chối tuyến đường được bảo vệ và
chỉnh sửa cấu hình thời gian chạy được ghi lại trong hướng dẫn môi trường tiền sản xuất.
2. Một báo cáo hiệu suất có thể tái tạo bao gồm gói giao diện người dùng sản xuất,
xác định cục bộ API/thời gian phiên, các ranh giới NFR đã biết và bất kỳ sự hoàn thiện hợp lý nào.
Phân phối SMTP, SQL CI được chia sẻ và bộ lưu trữ hình đại diện lâu bền vẫn chưa được chứng minh rõ
ràng trừ khi được quan sát riêng.
3. Bản ghi chấp nhận/kiểm tra người dùng giúp phân biệt trình duyệt tự động
quan sát, quan sát kiểm thử nhanh theo giai đoạn và kiểm tra yêu cầu con người có tài khoản môi trường tiền
sản xuất tổng hợp được xác thực.
4. Tài liệu phát hành được cập nhật không có phần giữ chỗ hoạt động chưa được giải quyết
cho các URL hoặc bằng chứng đã được xác minh. Các tạo phẩm bên ngoài không có sẵn phải được gắn nhãn
là không có sẵn, không bao giờ được thay thế bằng liên kết giả tạo.
5. Một bản trình bày cuối cùng và một bản ghi lại buổi diễn tập được tính thời gian dựa trên
   luồng nghiệp vụ chuẩn tất định và bằng chứng dự phòng của nó.

## Hợp đồng xác nhận

Tất cả bốn lớp xác thực Kết hợp đều được yêu cầu:

- Tự động: kiểm tra khả năng truy vết/triển khai, phạm vi bảo hiểm máy chủ và hệ thống
  tích hợp, kiểm thử/lint/bản dựng trình duyệt, giao diện E2E và kiểm thử nhanh môi trường tiền sản xuất.
- đặc tả: mọi xác nhận quyền sở hữu đều ánh xạ tới lộ trình, `plan.md`, thông số chức năng được phê duyệt,
  quy trình triển khai hoặc bản ghi bằng chứng Giai đoạn 3 này.
- An toàn/Hiến pháp: không có bí mật, mã thông báo, thông tin xác thực, OTP thô hoặc PII thực
nhập các tập tin được theo dõi; hướng dẫn môi trường tiền sản xuất chỉ ghi lại những cái tên không
bí mật và kết quả được quan sát.
- Chấp nhận: quan sát luồng nghiệp vụ chuẩn của trình duyệt, điểm cuối môi trường tiền sản xuất chính xác
quan sát, đo lường hiệu suất, đánh giá bản trình bày được hiển thị và danh sách rõ ràng các bước
kiểm tra chỉ dành cho con người vẫn đang mở.

## Mục tiêu phi mục tiêu và rủi ro tồn đọng

Giai đoạn này không yêu cầu gửi email thực qua SMTP nếu chưa có quan sát ở cấp nhà cung cấp,
tạo dịch vụ SQL Server dùng chung trong GitHub Actions, thêm lưu trữ avatar bền vững hoặc
hứa hẹn cung cấp SLA sản xuất cho môi trường môi trường tiền sản xuất tín dụng sinh viên. Cảnh báo
của người chạy Hành động Azure hiện tại về Node.js 24 ​​bắt buộc không bị chặn và sẽ được ghi lại
dưới dạng ghi chú bảo trì quy trình làm việc thay vì âm thầm thay đổi các phiên bản hành động trong
quá trình phân phối.
