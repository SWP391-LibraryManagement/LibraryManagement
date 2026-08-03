# FE07-FE08-FE10-FE12 Đánh giá mã sạch-Thiết kế an toàn

## Trạng thái

Dự thảo để xem xét bằng văn bản. Phạm vi đã được phê duyệt trong đàm thoại là “an toàn khi đánh giá
mã sạch”: cải thiện khả năng đọc và khả năng xem lại mà không thay đổi hành vi kinh doanh có thể
quan sát được.

## Mục tiêu

Làm cho việc triển khai FE07, FE08, FE10 và FE12 dễ giải thích hơn trong quá trình đánh giá mã trong
khi vẫn duy trì các hợp đồng API hiện tại, lược đồ SQL, ranh giới vai trò, tuyến giao diện người
dùng, ngữ nghĩa thông báo, cấu hình Azure và FE07 được kết nối → Luồng FE08 → FE10 → FE12.

mốc cơ sở là `origin/main@7dc563a95ff178239a90e47fe1899e21c24a49ef`. Trước thiết kế này, cây công
việc sạch đã vượt qua 1.127 kiểm thử máy chủ và 271 kiểm thử giao diện người dùng. kiểm tra mã giao diện
người dùng đã được thông qua cùng với một cảnh báo hiện có tại `ReservationsLibrarianPage.jsx:135`
về hiệu ứng `loadReservations`.

## Không có mục tiêu

- Không có quy tắc nghiệp vụ mới, điểm cuối, trường phản hồi, bảng cơ sở dữ liệu, di chuyển,
  hoặc cài đặt Azure.
- Không thiết kế lại giao diện người dùng, thay đổi bản sao, thay đổi tuyến đường hoặc mở rộng phạm vi di động.
- Không có thay đổi nào đối với quyền sở hữu khoản phạt FE09, quyền sở hữu đặt chỗ FE08 hoặc
  FE10 gửi thông báo sau cam kết.
- Không có công cụ tái cấu trúc rộng rãi của các chức năng không liên quan hoặc mã lớp bao ứng dụng dùng chung.
- Không có thay đổi nào đối với dữ liệu demo cục bộ hiện tại hoặc cài đặt phụ thuộc.

## Cách tiếp cận đã chọn

Sử dụng các trích xuất nhỏ, bảo toàn hành vi của mã thuần túy và dọn dẹp một vòng đời hook:

1. Di chuyển vai trò lặp lại và các trợ giúp ranh giới ID dương được bốn mục tiêu sử dụng
dịch vụ thành một tiện ích máy chủ nhỏ. Tiện ích này giữ chính xác các giá trị chuẩn hóa và lỗi hiện có.
2. Di chuyển các phép chiếu hàng/ngày của kho lưu trữ FE07 thành một tiện ích trình chiếu thuần túy.
Các truy vấn SQL, ranh giới giao dịch và tên phương thức kho lưu trữ vẫn ở `borrowingRepository.js`.
3. Di chuyển vệ sinh tải trọng FE10, xác thực mẫu và chính sách hàng đợi
hoạt động thành một tiện ích chính sách thông báo thuần túy. Dịch vụ tiếp tục sở hữu sự phối hợp,
tính bền bỉ, khả năng phân phối của nhà cung cấp và ghi kiểm tra.
4. Di chuyển các trình trợ giúp phân trang/kết quả/đếm báo cáo FE12 thành một trình trợ giúp thuần túy
tiện ích trình chiếu báo cáo. Cấu trúc truy vấn SQL vẫn còn trong `reportRepository.js`.
5. Ổn định FE08 `loadReservations` bằng lệnh gọi lại ổn định và giới thiệu cho
bản sao hàng đợi được chọn mới nhất để hiệu ứng ban đầu có danh sách phụ thuộc trung thực mà không
cần tải lại toàn bộ danh mục đặt chỗ trên mỗi lựa chọn hàng đợi.

Khuyến nghị là phương pháp trích xuất giới hạn này vì mỗi tiện ích mới có một trách nhiệm và có thể
được kiểm tra mà không cần SQL Server hoặc trình duyệt. Việc phân chia kho lưu trữ/dịch vụ đầy đủ sẽ
tạo ra sự khác biệt lớn hơn và khiến việc xem xét quy tắc nghiệp vụ trở nên khó khăn hơn; chỉ thay
đổi cảnh báo kiểm tra mã sẽ khiến ba chức năng còn lại không nhất quán.

## Ranh giới thành phần

### Ranh giới truy cập máy chủ

Tạo `backend/src/utils/featureAccess.js` với hành vi `normalizeRole`, `hasAnyRole` và
`toPositiveInteger` hiện có. Nhập nó từ dịch vụ mượn FE07, dịch vụ đặt chỗ FE08, dịch vụ thông báo
FE10 và dịch vụ báo cáo FE12. Tiện ích không biết các vai trò cụ thể của chức năng; người gọi tiếp
tục cung cấp danh sách vai trò được phép tương tự.

### FE07 ranh giới chiếu

Tạo `backend/src/utils/borrowingProjection.js` cho các chức năng chiếu chỉ ngày và ánh xạ hàng thuần
túy hiện có hiện cục bộ cho `borrowingRepository.js`. Giữ nguyên tất cả SQL, khóa, hành vi hoàn
trả/cam kết giao dịch, kết quả và phương thức kho lưu trữ đã xuất.

### FE08 ranh giới vòng đời

Cập nhật `frontend/src/page/reservation/ReservationsLibrarianPage.jsx` để sử dụng lệnh gọi lại
`loadReservations` ổn định. Một giới thiệu phản ánh `queueCopyId` mới nhất cho cuộc gọi lại; trình
trợ giúp `resolveReservationQueueHandoff` hiện tại vẫn là điểm quyết định chuyển giao duy nhất. Hoạt
động tải, thông báo chuyển giao cũ, phân trang, tải lại thủ công và lựa chọn hàng đợi vẫn không thay
đổi.

### FE10 ranh giới chính sách

Tạo `backend/src/utils/notificationPolicy.js` để chuẩn hóa khóa tải trọng thuần túy, phát hiện/xử lý
giá trị nhạy cảm, xác thực nguồn/loại, trích xuất biến mẫu, xác thực mẫu được lưu trữ và hiển thị
mẫu an toàn. `notificationService.js` giữ nguyên nhà máy dịch vụ công cộng và tiếp tục xuất
`sanitizePayload` để tương thích.

### FE12 ranh giới chiếu

Tạo `backend/src/utils/reportProjection.js` để chuẩn hóa ngày/trạng thái, phân trang, xây dựng phong
bì báo cáo, lựa chọn tập kết quả SQL, xây dựng bản đồ đếm và tính toán riêng cho ngày tiếp theo.
`reportRepository.js` giữ nguyên văn bản truy vấn, tham số, đường bao kết quả và phương thức xuất.

## Xử lý lỗi và trạng thái

Bộ tái cấu trúc phải bảo toàn:

- `ROLE_REQUIRED`, `INVALID_ID` hiện có và mã lỗi dành riêng cho chức năng.
- Giao dịch hiện có và yêu cầu kiểm toán.
- Tính toán ngày kinh doanh Châu Á/Ho_Chi_Minh hiện tại.
- Hành vi sau cam kết thông báo hiện có và biên tập an toàn.
- Hành vi chuyển giao FE08 cũ hiện có: chuyển giao cũ được giải quyết thành không có hàng đợi
  lựa chọn và không bao giờ quay trở lại một bản sao khác.
- Ngữ nghĩa trang FE12 hiện có, giới hạn, tổng hàng và trạng thái.

Không có khối bắt, chính sách thử lại, khóa SQL, tải trọng API hoặc chuyển đổi trạng thái có thể
được viết lại như một phần của thiết kế này.

## Hợp đồng xác minh

Thêm các kiểm thử đơn vị thuần túy tập trung cho các tiện ích máy chủ mới và mở rộng hợp đồng
nguồn/hành vi FE08 hiện có để khẳng định ranh giới hiệu ứng/gọi lại ổn định. Sau đó chạy:

- Các kiểm thử FE07, FE08, FE10 và FE12 backend/frontend tập trung.
- Bộ Jest máy chủ đầy đủ và bộ kiểm tra giao diện người dùng đầy đủ.
- giao diện kiểm tra mã và xây dựng sản xuất.
- `npm run test:secrets`, kiểm thử triển khai và `npm run trace:enforce`.
- `git diff --check`.

Quá trình triển khai chỉ được đánh giá an toàn nếu các bộ đầy đủ vẫn có màu xanh, lỗi mã nguồn không
có cảnh báo nào được đưa ra trong đợt này và không có thay đổi nào đối với tệp API/lược đồ/Azure xuất
hiện trong phần khác biệt.

## Tiêu chí chấp nhận

1. Mỗi tiện ích được trích xuất có một trách nhiệm và không có chức năng cụ thể
   sự kiên trì hoặc tác dụng phụ UI.
2. FE07 → FE08 → FE10 → Kiểm tra hành vi FE12 vẫn có màu xanh và không thay đổi
   hợp đồng yêu cầu/phản hồi.
3. Cảnh báo hook FE08 đã biến mất mà không cần thêm vòng lặp tải lại không cần thiết.
4. Sự khác biệt được giới hạn ở các tệp nguồn/kiểm tra FE07/FE08/FE10/FE12 được liệt kê và
   bằng chứng về thiết kế/kế hoạch này.
5. Đường dẫn mã có thể được giải thích là:
   `UI → API → Controller → Service/policy → Repository/projection → SQL Server`.
6. Nhánh cuối cùng được xem xét cục bộ trước H2; cam kết/đẩy/PR/hợp nhất vẫn còn
   cổng phê duyệt riêng biệt.
