# môi trường tiền sản xuất thiết kế Keepalive miễn phí

**Trạng thái:** ĐÃ ĐƯỢC PHÊ DUYỆT - H1 2026-07-28

**Đã phê duyệt phương hướng thiết kế:** 28-07-2026

**Người phê duyệt:** Người dùng trong tác vụ đang hoạt động

**Đánh giá H1 bằng văn bản đã được phê duyệt:** 28-07-2026

**Cơ sở triển khai:** `origin/main` và `2c0b169cbb81421b17ad43580a8688dddffa328c`

## 1. Kết quả và phạm vi

Giữ cho phần máy chủ môi trường tiền sản xuất Azure đủ phản hồi cho nhân viên thông báo đang trong
quá trình hiện có mà không phải trả tiền cho App Service B1:

1. GitHub Actions gửi yêu cầu `GET /health` không xác thực tới
   máy chủ cứ sau 10 phút.
2. Quy trình công việc cũng có thể được chạy thủ công để xác minh việc triển khai.
3. Azure chỉ bị hạ cấp từ B1 xuống F1 sau khi quy trình làm việc tồn tại trên `main`
   và chạy thủ công thành công.
4. Nhân viên thông báo hiện tại vẫn được kích hoạt với hiện tại của nó
   Khoảng thời gian 60 giây và kích thước lô 20.

Đây là giải pháp môi trường tiền sản xuất/demo hiệu quả nhất. Quy trình làm việc theo lịch trình của
GitHub có thể bị trì hoãn và Azure F1 vẫn có thể tải ứng dụng. Nó không phải là một đảm bảo sẵn sàng
sản xuất.

Ngoài phạm vi:

- thay đổi thông tin xác thực SMTP, danh tính người gửi hoặc nội dung email;
- thay đổi các quy tắc chuyển tiếp trạng thái thông báo hoặc thử lại;
- thêm Chức năng Azure, Ứng dụng logic, hàng đợi hoặc tài nguyên trả phí;
- yêu cầu đảm bảo thời gian bàn giao hoặc thời gian hoạt động;
- thêm điểm cuối sức khỏe bí mật hoặc được xác thực;
- thay đổi mã ứng dụng giao diện hoặc máy chủ.

## 2. Các lựa chọn được xem xét

| Tùy chọn | Chi phí | Lợi ích | Hạn chế | Quyết định |
| --- | --- | --- | --- | --- |
| GitHub Hành động ping theo lịch trình | Không tính thêm phí cho kho lưu trữ công cộng hiện tại trên các trình chạy được lưu trữ tiêu chuẩn | Sử dụng kho lưu trữ hiện có, có thể xem lại, hỗ trợ gửi thủ công | Các lần chạy theo lịch trình có thể bị trì hoãn và chỉ chạy từ nhánh mặc định | Đã chọn |
| Màn hình miễn phí UptimeRobot | Cấp miễn phí | Kiểm tra năm phút và bảng điều khiển bên ngoài | Thêm tài khoản/nhà cung cấp và cấu hình khác bên ngoài kho lưu trữ | Hiện đã bị từ chối |
| Thiết kế lại đồng bộ/mã | Không có sự phụ thuộc lưu trữ duy trì cho thư hướng sự kiện | Hành vi phân phối mạnh mẽ hơn cho các sự kiện ngay lập tức | Thay đổi sản phẩm lớn hơn và không giải quyết được lời nhắc đã lên lịch khi ngủ | Ngoài phạm vi |

## 3. Hợp đồng hoạt động

### 3.1 Quy trình làm việc

Tạo `.github/workflows/staging-keepalive.yml` với:

- `schedule` vào phút `3,13,23,33,43,53` mỗi giờ;
- `workflow_dispatch` để xác minh nhà điều hành;
- quyền lưu trữ chỉ đọc;
- một công việc Ubuntu có thời gian chờ ba phút;
- `curl` chống lại
  `https://app-library-api-staging-nhat714.azurewebsites.net/health`;
- xử lý HTTP không đóng được, hết thời gian chờ yêu cầu bị giới hạn và hai lần thử lại;
- đồng thời hủy bỏ một lần chạy keepalive thay thế.

Lịch chạy phút lệch giúp giảm xung đột với tải GitHub Actions thường gặp vào đầu
giờ. Điểm cuối đã được công khai và chỉ trả về tải trọng sức khỏe chung, do đó không yêu cầu bí mật
thông tin xác thực hoặc kho lưu trữ.

### 3.2 Chuyển đổi Azure

Thứ tự chuyển tiếp an toàn là:

1. Xem xét, hợp nhất và chuyển CI cho quy trình làm việc trên `main`.
2. Chạy `Staging keepalive` theo cách thủ công và yêu cầu phản hồi thành công.
3. Đặt App Service `alwaysOn` thành `false`.
4. Chia tỷ lệ `plan-library-staging` từ B1 đến F1.
5. Xác minh kế hoạch là F1, `alwaysOn` là sai, `/health` là HTTP 200 và
   cài đặt nhân viên thông báo không thay đổi.

Azure vẫn ở B1 cho đến khi bước 1-2 thành công. Điều này ngăn việc đánh giá hoặc quy trình làm việc
không thành công ngay lập tức tạo ra khoảng trống email liên quan đến giấc ngủ.

### 3.3 Khôi phục

Nếu quy trình làm việc cố định liên tục bị lỗi hoặc quá trình môi trường tiền sản xuất trở nên không
đáng tin cậy:

1. Quy mô kế hoạch trở lại B1.
2. Đặt `alwaysOn` thành `true`.
3. Xác minh `/health`, `/api/books` và hàng đợi thông báo.

Chỉ vô hiệu hóa quy trình làm việc sẽ không khôi phục tính khả dụng trên F1.

## 4. Xử lý An toàn và Thất bại

- Quy trình làm việc không chứa mật khẩu, mã thông báo, hồ sơ xuất bản, chuỗi kết nối,
  địa chỉ người nhận hoặc giá trị SMTP.
- `curl --fail` làm cho các phản hồi không phải 2xx không thành công thay vì báo cáo
  thành công giả tạo.
- Số lần thử lại bao gồm thời gian khởi động nguội F1 ngắn nhưng vẫn bị giới hạn.
- Quy trình làm việc không gọi email, xử lý hàng đợi, đăng nhập hoặc thao tác ghi
  điểm cuối.
- Độ trễ lịch trình GitHub được ghi nhận là giới hạn môi trường tiền sản xuất được chấp nhận.
- Hạ cấp Azure là hành động của người vận hành sau khi hợp nhất, không phải là một phần của yêu cầu hợp nhất
  thi hành.

## 5. Chấp nhận kiểm thử đầu tiên

| ID | Bằng chứng RED | Bằng chứng chấp nhận |
| --- | --- | --- |
| KA-001 | Không tồn tại quy trình làm việc cố định | Quy trình làm việc có `schedule` và `workflow_dispatch` |
| KA-002 | Không có hợp đồng nào ngăn cản khoảng thời gian không an toàn hoặc điểm cuối chứa bí mật | kiểm thử triển khai yêu cầu chính xác sáu khoảng thời gian bù mười phút và HTTPS `/health` URL |
| KA-003 | Không có hợp đồng yêu cầu hành vi đóng thất bại bị giới hạn | Kiểm thử triển khai yêu cầu `curl --fail`, số lần thử lại, thời gian tối đa, thời gian chờ công việc và quyền chỉ đọc |
| KA-004 | Hướng dẫn vận hành không mô tả quá trình chuyển đổi giữ nguyên miễn phí | Hướng dẫn hợp nhất tài liệu/thứ tự chạy thủ công trước F1, giới hạn nỗ lực tối đa, xác minh và khôi phục |
| KA-005 | B1 hiện đang hoạt động | Sau khi hợp nhất và gửi thành công, Azure báo cáo F1 với `alwaysOn=false` |
| KA-006 | Bằng chứng về thời gian chạy có thể trôi đi trong quá trình thay đổi kế hoạch | Kiểm tra sau thay đổi chứng minh tình trạng, danh mục công khai, cài đặt nhân viên và trạng thái hàng đợi tổng hợp |

Tệp quy trình sản xuất không được thêm cho đến khi kiểm thử triển khai tập trung không thành công vì
lý do thiếu tệp/hợp đồng dự kiến.

## 6. Tệp được lên kế hoạch

- Tạo: `.github/workflows/staging-keepalive.yml`
- Tạo: `tests/deployment/stagingKeepalivePolicy.test.js`
- Sửa đổi: `docs/deployment/azure-staging-guide.md`
- Tạo:
  `.sdd/reviews/staging-free-keepalive-validation-2026-07-28.md`

Không có giao diện người dùng, máy chủ, cơ sở dữ liệu, phụ thuộc hoặc tệp bí mật nào nằm trong phạm vi.

## 7. Cổng xác thực

Trước H2:

```powershell
node --test tests/deployment/stagingKeepalivePolicy.test.js
npm run test:deployment
git diff --check
git diff --name-only
```

Sau khi xuất bản H2:

- yêu cầu kiểm tra yêu cầu hợp nhất vượt qua cho phần đầu chính xác;
- H3 xác nhận nhánh có thể hợp nhất và chấp thuận hợp nhất;
- các thẻ CI `main` sau hợp nhất;
- chạy `Staging keepalive` thủ công thành công.

Chỉ khi đó quá trình chuyển đổi và xác minh trực tiếp Azure B1-to-F1 mới có thể xảy ra.

## 8. Hợp đồng H1

H1 chỉ cho phép:

- bốn tệp kho lưu trữ được lên kế hoạch ở trên;
- một cây làm việc bị cô lập trên
  `codex/chore-staging-free-keepalive`;
- triển khai RED-GREEN không cam kết;
- các lệnh xác thực cục bộ được liệt kê;
- Cần kiểm tra GitHub/Azure chỉ đọc để chuẩn bị bằng chứng H2.

H1 không cho phép cam kết triển khai được tạo, đẩy nhánh, mở yêu cầu hợp nhất, hợp nhất hoặc thay
đổi gói Azure. Những hành động đó vẫn là H2, H3 và hoạt động sau hợp nhất tương ứng.
