# Giai đoạn 2 Thiết kế đóng cửa tích hợp FE10 OTP

Trạng thái: HOÀN THÀNH THROUGH B7 - 2026-07-19

Ngày: 2026-07-19

Phạm vi: `FE10-S01` đến `FE10-S05`, ADR-004 và ranh giới phân phối xác minh/đặt lại mật khẩu FE02

## 1. Quyết định

Sử dụng Hybrid SDD+ADD ở Độ sâu đầy đủ cho ranh giới thông báo-xác thực cốt lõi và Độ sâu nhẹ để
thay đổi tài liệu chỉ có bằng chứng.

Phần này sẽ xác minh việc triển khai hiện tại trên `origin/main`, thêm phạm vi kiểm tra đầu tiên cho
bất kỳ bất biến bị thiếu nào, chỉ thực hiện chỉnh sửa sản xuất nhỏ nhất được chứng minh là cần thiết
khi kiểm tra thất bại và đóng cổng tích hợp/con người FE10-S05 thông qua một PR chuyên dụng và chạy
CI `main` sau hợp nhất chính xác.

## 2. Cơ sở lý luận

Việc tạo OTP, quyền sở hữu nguồn, tính tạm thời và xử lý bí mật là Cốt lõi vì một lỗi có thể làm suy
yếu khả năng xác thực, làm lộ thông tin xác thực, phân phối trùng lặp hoặc phá vỡ hợp đồng
FE02/FE10. Các nội dung cố định kiểm thử, bản ghi xác thực và các thay đổi trạng thái kết thúc đều
là lớp bao vì chúng có thể đảo ngược và không thay đổi hành vi thời gian chạy.

mốc cơ sở tập trung hiện tại đã vượt qua 157/157 kiểm thử trên `notificationRoutes`, `authRoutes` và
`integration`. Việc vượt qua các kiểm thử là bằng chứng về hành vi hiện có chứ không phải bằng chứng
cho thấy mọi bất biến của ADR-004 đều được đề cập, vì vậy phần này bắt đầu bằng quá trình kiểm tra
theo yêu cầu để kiểm tra thay vì giả định là đã hoàn thành.

## 3. Các lựa chọn thay thế được xem xét

### A. Người yêu cầu bị ràng buộc với biện pháp khắc phục thiếu sót bằng chứng đầu tiên - đã chọn

Giữ người yêu cầu FE10 đang trong quá trình được liên kết với `FE02`. Kiểm tra mọi bất biến, viết
kiểm thử thất bại cho hành vi chưa được phát hiện hoặc không tuân thủ và chỉ vá các lỗ hổng đã được
chứng minh.

Điều này tuân theo ADR-004, bảo tồn kiến trúc hiện tại và tránh tình trạng xáo trộn sản phẩm không cần thiết.

### B. Giữ lại việc gửi email FE02 trực tiếp bên cạnh FE10 - bị từ chối

Việc phân phối kép có nguy cơ gây ra các tin nhắn trùng lặp, khóa mẫu không nhất quán và rò rỉ bí
mật ra ngoài ranh giới FE10.

### C. Giới thiệu cổng thông báo nội bộ mới HTTP - bị từ chối

Thông tin xác thực dịch vụ, hợp đồng API mới và bề mặt ủy quyền bổ sung là không cần thiết đối với
ứng dụng Express quy trình đơn hiện tại và nằm ngoài đặc tả đã được phê duyệt.

## 4. Hợp đồng cốt lõi

1. FE02 độc quyền tạo, băm, lưu trữ và xác thực OTP xác minh và đặt lại mật khẩu.
2. FE10 độc quyền hiển thị và gửi tin nhắn `ACCOUNT_VERIFICATION` và `PASSWORD_RESET` thông qua bộ điều hợp nhà cung cấp đã định cấu hình.
3. Chỉ `createSourceNotificationRequester('FE02')` mới có thể gửi hai loại nhạy cảm đó.
4. Người gọi HTTP không thể gửi các loại xác thực nhạy cảm hoặc ghi đè `sourceFeature`.
5. Các yêu cầu sử dụng các cặp loại/mẫu chuẩn và khóa bình thường chính xác bắt nguồn từ ID `AuthToken` tồn tại lâu dài.
6. OTP thô và tiêu đề/nội dung nhạy cảm được hiển thị chỉ tồn tại trong bộ nhớ. Chúng không được xuất hiện trong bản ghi thông báo, lần thử, siêu dữ liệu kiểm tra, nhật ký, phản hồi HTTP hoặc tải trọng an toàn.
7. Hồ sơ thành công của nhà cung cấp `SENT`; lỗi của nhà cung cấp ghi lại `FAILED` với lý do an toàn chung. Cả hai kết quả đều bảo toàn giao dịch nguồn FE02 và trả về thông báo tối thiểu DTO.
8. FE02 không được viết trực tiếp thông báo kiên trì hoặc gọi một đường dẫn gửi email riêng để xác minh/đặt lại.

## 5. Thành phần và quyền sở hữu

| Thành phần | Trách nhiệm | Tệp dự kiến ​​|
| --- | --- | --- |
| Dịch vụ xác thực FE02 | Tạo và duy trì thông tin xác thực OTP, gọi người yêu cầu được ràng buộc bởi FE02, duy trì luồng xác thực trên kết quả phân phối | `backend/src/services/authService.js` |
| Dịch vụ thông báo FE10 | Xác thực quyền sở hữu, các cặp chuẩn, siêu dữ liệu nguồn, tính tạm thời, hiển thị trong bộ nhớ, phân phối của nhà cung cấp và tính bền bỉ được xử lý lại | `backend/src/services/notificationService.js` |
| Ranh giới xác thực HTTP | Từ chối các yêu cầu công khai/thủ công nhạy cảm trước khi thực hiện dịch vụ | `backend/src/validators/notificationValidators.js`, `backend/src/routes/notificationRoutes.js` |
| Bộ chuyển đổi nhà cung cấp | Gửi email được chèn/cấu hình mà không cần sở hữu việc tạo hoặc lưu giữ OTP | `backend/src/services/emailService.js` và các kiểm thử của nhà cung cấp hiện có |
| Bằng chứng tự động | Chứng minh quyền sở hữu nguồn, không phân phối trùng lặp, hành vi trạng thái và các trường hợp rò rỉ tiêu cực | `backend/tests/notificationRoutes.test.js`, `backend/tests/authRoutes.test.js`, `backend/tests/integration.test.js` |
| Bằng chứng SDD | Ghi lại ánh xạ yêu cầu chính xác, lệnh, kết quả, giới hạn dư, H2/H3, hợp nhất và CI chính | FE10 `PLAN.md`, `TASKS.md`, `CHANGELOG.md` và gói đánh giá tập trung |

Không có tệp nào bên ngoài bản đồ này có thể thay đổi trừ khi kiểm thử thất bại chứng tỏ sự phụ
thuộc trực tiếp và phạm vi được xem xét trước khi chỉnh sửa.

## 6. Luồng dữ liệu

### Yêu cầu xác minh và đặt lại mật khẩu

1. FE02 xác thực yêu cầu nguồn và tạo OTP gồm sáu chữ số.
2. FE02 chỉ tồn tại hàm băm OTP và nhận ID `AuthToken` số nguyên dương.
3. FE02 gọi người yêu cầu FE10 theo giới hạn xây dựng của nó bằng email người nhận, loại/mẫu chuẩn, OTP thô, số phút hết hạn, siêu dữ liệu nguồn `AuthToken` và khóa idempotency dẫn xuất.
4. FE10 xác thực các trường quyền sở hữu và hợp đồng trước khi kết xuất.
5. FE10 hiển thị trong bộ nhớ và gọi bộ điều hợp nhà cung cấp một cách đồng bộ.
6. FE10 chỉ tồn tại tóm tắt thông báo an toàn, trạng thái gửi và siêu dữ liệu về nỗ lực an toàn.
7. FE10 trả về `{ notificationId, status }`; FE02 hoàn thành thao tác nguồn của nó mà không thực hiện phân phối khác.

### phát lại bình thường

Mã thông báo nguồn và khóa tạm thời giống nhau trả về bản tóm tắt thông báo hiện có mà không cần gửi
email thứ hai hoặc tạo bản ghi thông báo thứ hai.

## 7. Xử lý lỗi

- Quyền sở hữu nguồn không hợp lệ, loại/mẫu không khớp, ID nguồn, hết hạn hoặc khóa tạm thời không thành công trước khi kết xuất và gọi nhà cung cấp.
- Việc gửi HTTP nhạy cảm sẽ trả về lỗi máy khách an toàn mà không tiết lộ các quy tắc sở hữu nội bộ hoặc thông tin chi tiết về nhà cung cấp.
- Lỗi nhà cung cấp vẫn tồn tại `FAILED` và lý do nỗ lực an toàn chung; không có bộ công nghệ, phản hồi của nhà cung cấp, OTP hoặc nội dung được hiển thị nào bị lộ.
- FE02 hành vi thao tác ghi người dùng/mã thông báo không được khôi phục chỉ vì phân phối không thành công; người gọi quan sát trạng thái được trả về và có thể đưa ra một sự kiện nguồn mới khi luồng được phê duyệt cho phép điều đó.
- kiểm thử xác định hoặc lỗi triển khai nhận được tối đa ba lần thử trước khi sử dụng Escape Hatch được ghi lại.

## 8. Ngoài phạm vi

- Hành vi `CHANGE_PASSWORD_OTP`.
- FE11 bàn giao `ACCOUNT_SETUP`.
- FE04 cung cấp kết quả thành viên.
- FE09 tích hợp người gọi.
- Hộp thư thông báo, thử lại giao diện người dùng, SMS, đẩy hoặc trình chỉnh sửa mẫu.
- Thông tin xác thực của nhà cung cấp thực tế hoặc sự chấp nhận SMTP sản xuất.
- Các bảng, chỉ mục, phần phụ thuộc, vai trò đăng nhập mới hoặc thông tin xác thực dịch vụ HTTP nội bộ.

## 9. Xác nhận và chấp nhận

### L1 tự động

- Các kiểm thử tích hợp FE10/FE02/tích hợp tập trung.
- Bộ máy chủ đầy đủ và ngưỡng bảo hiểm được cấu hình.
- Thực thi truy vết.
- OpenAPI/kiểm tra nhập máy chủ ở những nơi bị ảnh hưởng.
- Quét rò rỉ thuật ngữ nhạy cảm trên các nguồn, kiểm thử, thiết bị cố định và bằng chứng được tạo đã thay đổi.
- `git diff --check` và đánh giá phạm vi tệp đã thay đổi chính xác.

### Tuân thủ đặc tả L2

Ánh xạ các ID ADR-004, FE10-S01 đến FE10-S05 và các ID FE02/FE10 BR/FR/AC có liên quan tới các kiểm
thử cụ thể và các dây chuyền triển khai. Chạy thử sạch mà không có ánh xạ này là không đủ.

### L3 Hiến pháp và an toàn

Xác nhận thực thi quyền sở hữu phía máy chủ, không lưu giữ/ghi nhật ký bí mật, không mở rộng vai
trò/lược đồ/phụ thuộc, lỗi an toàn, kho lưu trữ hiện có được tham số hóa và bộ công nghệ/kiến trúc
được bảo tồn.

### Chấp nhận L4

Chứng minh quá trình xác minh và phân phối đặt lại mật khẩu bằng cách sử dụng nhà cung cấp được
chèn, bao gồm thành công, thất bại an toàn, phát lại bình thường và không có phân phối trùng
lặp/trực tiếp. Ghi lại sự chấp nhận của con người đối với người đứng đầu PR cuối cùng và việc vượt
qua CI.

## 10. Định nghĩa xong

Lát cắt chỉ hoàn thành khi:

1. Mỗi mục hợp đồng cốt lõi đều có bằng chứng kiểm tra/mã trực tiếp.
2. Mọi lỗ hổng được phát hiện đều được khắc phục thông qua kiểm thử RED-GREEN được quan sát.
3. Kiểm tra tập trung và đầy đủ yêu cầu vượt qua.
4. FE10-S05 và trạng thái/bằng chứng liên quan được đối chiếu mà không mở rộng các tuyên bố về chức năng khác.
5. Sự khác biệt cuối cùng vượt qua H2 và yêu cầu kiểm tra PR.
6. Human H3 phê duyệt chính xác người đứng đầu PR cuối cùng.
7. PR được hợp nhất và quá trình chạy CI `main` sau hợp nhất chính xác đã thành công.
8. Bản ghi chấp nhận/bằng chứng chứa số PR, đầu SHA, hợp nhất SHA, ID chạy CI, lớp xác thực và các mục ngoài phạm vi còn lại.

## 11. Giả định

- Mục tiêu Giai đoạn 2 do người dùng cung cấp cho phép lát FE10/FE02 được phê duyệt này làm đơn vị phân phối giới hạn đầu tiên.
- Hành vi hiện tại của sản phẩm được giữ lại khi nó đã đáp ứng được hợp đồng đã được phê duyệt; lát cắt này không tạo ra sự khác biệt về sản xuất chỉ để có vẻ hoạt động.
- Việc phân phối SMTP thực vẫn nằm ngoài yêu cầu chấp nhận; bằng chứng xác định về nhà cung cấp dịch vụ được tiêm là có căn cứ cho lát cắt này.
- Vào ngày 19 tháng 7 năm 2026, người dùng đã phê duyệt thiết kế này và được cấp phê duyệt thường trực để thực hiện kế hoạch, xác thực, PR, hợp nhất, giám sát sau hợp nhất và kết thúc chính xác chỉ dựa trên bằng chứng mà không cần tạm dừng để nhận các lời nhắc phê duyệt bổ sung.

## 12. Kết quả kiểm tra yêu cầu

- Các mục ADR-004 từ 1 đến 7 có bằng chứng tự động trực tiếp trong `notificationRoutes.test.js` và `authRoutes.test.js`.
- Ma trận quyền sở hữu hiện bao gồm cả hai loại thông báo nhạy cảm FE02 đối với mọi người yêu cầu khác trong danh sách cho phép.
- Bằng chứng ghi đè nguồn HTTP hiện khẳng định lỗi an toàn chính xác và không có tác dụng phụ liên tục, cố gắng, nhà cung cấp và kiểm tra.
- Các yêu cầu đặt lại mật khẩu lặp đi lặp lại hiện chứng tỏ việc xoay vòng mã thông báo, khóa bình thường mới và không có phân phối FE02 trực tiếp.
- Tất cả các xác nhận bổ sung đều được thông qua so với việc triển khai hiện tại, do đó không cần phải chỉnh sửa sản xuất.
- Sự chấp nhận của con người, tích hợp PR và CI `main` sau hợp nhất chính xác đã hoàn tất cho hợp đồng nhà cung cấp được tiêm. Việc bàn giao của nhà cung cấp thực sự vẫn nằm ngoài phạm vi.

## 13. Bằng chứng tích hợp cuối cùng

- PR thực hiện: #42, đầu `e52b4ac94c9ed0f3bb799d0c0ceb4b763555a1ee`.
- Triển khai PR CI: `29688102867` - đạt.
- Hợp nhất cam kết: `34d918030580a6a36b943f187eec7fd95838a66b`.
- Chính xác sau hợp nhất `main` CI: `29688222757` - đạt.
- Lát FE10-S05/FE02-T033 hoàn thành đến B7; ranh giới SMTP bị trì hoãn, giao diện người dùng hộp thư đến và người gọi FE09 vẫn rõ ràng.
