# Thiết kế kiểu chữ và bản địa hóa giao diện người dùng tiếng Việt

Ngày: 2026-07-20

Trạng thái: IMPLEMENTED - PR #58 MERGED; RESPONSIVE FOLLOW-UP H2-ĐÃ ĐƯỢC PHÊ DUYỆT, H3 ĐANG CHỜ XỬ LÝ

Bằng chứng thực hiện: `.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md`.

## 1. Mục tiêu

Đặt mặc định tất cả nội dung hướng tới người dùng do giao diện người dùng tạo bằng tiếng Việt trong
khi vẫn giữ nguyên quy trình làm việc của thư viện, quyền vai trò, hợp đồng API và quy tắc nghiệp vụ
hiện có. Cải thiện khả năng hiển thị ký tự tiếng Việt bằng cách ghép cặp phông chữ nhất quán:

- `Be Vietnam Pro` dành cho nội dung văn bản, điều khiển, bảng và điều hướng.
- `Noto Serif` dành cho tiêu đề trang và các điểm nhấn biên tập khác.

Các thuật ngữ kỹ thuật phổ biến đã được người dùng phê duyệt, bao gồm `Email`, `OTP` và `Barcode`,
vẫn không thay đổi.

## 2. Phạm vi

Bao gồm:

- Trình duyệt công khai và nội dung trang chủ.
- Đăng nhập, đăng ký, quên mật khẩu và các luồng OTP.
- Các trang điều hướng và hoạt động của thành viên, thủ thư và quản trị viên.
- Nút, tiêu đề, tiêu đề bảng, phần giữ chỗ, nhãn có thể truy cập, trạng thái trống,
trạng thái tải, thông báo thành công, hộp thoại xác nhận và thông báo lỗi do giao diện người dùng tạo ra.
- Nhãn hướng tới người dùng cho mã vai trò và trạng thái, chẳng hạn như `Admin` -> `Quản trị viên` và
  `AVAILABLE` -> `Có sẵn` mà không thay đổi mã cơ bản.
- Siêu dữ liệu ngôn ngữ tài liệu và tiêu đề trang.
- Mã thông báo phông chữ được chia sẻ và khai báo phông chữ cấp trang rải rác.

Đã loại trừ:

- Di chuyển cơ sở dữ liệu và thay đổi hợp đồng API.
- Bản dịch tên sách, tên tác giả, địa chỉ email, giá trị mã vạch hoặc bất kỳ nội dung nào
  văn bản do người dùng nhập/nội dung sở hữu.
- Thay đổi về xác thực, ủy quyền, mượn, đặt chỗ, khoản phạt, thông báo,
  hoặc báo cáo các quy tắc nghiệp vụ.
- Trình chuyển đổi ngôn ngữ thời gian chạy hoặc danh mục dịch tiếng Anh.

## 3. Kiến trúc đề xuất

### 3.1 Sao chép danh mục

Thêm một danh mục sao chép giao diện người dùng nhẹ tại `frontend/src/i18n/vi.js` để có thể sử dụng
lại các nhãn, hành động, vai trò, nhóm điều hướng và thông báo trạng thái phổ biến. Đây không phải
là một framework i18n đầy đủ vì phạm vi sản phẩm được phê duyệt chỉ dành cho tiếng Việt.

Từ ngữ dành riêng cho trang vẫn gần với thành phần của nó khi điều đó làm cho quy trình làm việc dễ
hiểu hơn nhưng các thuật ngữ lặp lại sẽ sử dụng danh mục để từ ngữ luôn nhất quán.

### 3.2 Nhãn hiển thị

Thêm `frontend/src/utils/uiLabels.js` cho ánh xạ chỉ dành cho bản trình bày. Các hàm chấp nhận giá
trị giá trị liệt kê/trạng thái thô và trả về nhãn tiếng Việt. Logic nghiệp vụ hiện tại tiếp tục so
sánh các giá
trị thô như `PENDING`, `AVAILABLE`, `BORROWED` và `INACTIVE`.

### 3.3 Lỗi API

Mở rộng trình trợ giúp lỗi API hiện có, chủ yếu là `frontend/src/api/apiErrorMessages.js`, nhờ đó
các mã lỗi máy chủ đã biết sẽ giải quyết các thông báo tiếng Việt có thể thực hiện được. Thông báo
máy chủ không xác định hoặc không an toàn sử dụng dự phòng tiếng Việt theo ngữ cảnh thay vì hiển thị
tiếng Anh kỹ thuật thô. Hành vi xác thực và xóa mã thông báo không thay đổi.

### 3.4 kiểu chữ

Cập nhật `frontend/index.html` với `lang="vi"`, tiêu đề trang tiếng Việt và khai báo tải phông chữ.
Lớp CSS sẽ xác định các biến phông chữ được chia sẻ và sử dụng các dự phòng hỗ trợ tiếng Việt nếu
không có yêu cầu phông chữ từ xa.

Thay thế các khai báo cấp trang của `Inter`, `Lato`, `Playfair Display`, `Times New Roman` và các họ
một lần tương tự nơi chúng được sử dụng cho giao diện người dùng ứng dụng. Giữ nguyên các khai báo
dấu cách đơn cho các mã định danh kỹ thuật và các giá trị giống mã.

## 4. Luồng dữ liệu và kết xuất

1. Phản hồi máy chủ tiếp tục chứa mã chuẩn và dữ liệu nguồn.
2. API giúp bình thường hóa các lỗi đã biết thành bản sao tiếng Việt cho người dùng.
3. Xem các mô hình giữ lại các giá trị trạng thái thô để lọc và đưa ra quyết định kinh doanh.
4. `uiLabels` ánh xạ các giá trị thô để hiển thị văn bản ở ranh giới trình bày.
5. Các thành phần hiển thị nhãn tiếng Việt và trạng thái dự phòng an toàn.
6. Dữ liệu do người dùng sở hữu được hiển thị như đã nhận và không bao giờ được dịch bằng máy.

Ranh giới này ngăn chặn việc bản địa hóa thay đổi hành vi hoặc quy tắc nghiệp vụ của API.

## 5. Tiêu chí chấp nhận

- `frontend/index.html` tuyên bố `lang="vi"` và tiêu đề `Quản lý thư viện`.
- Các nhãn tiếng Anh do giao diện người dùng tạo ra không còn xuất hiện ở chế độ công khai, xác thực, thành viên, thủ thư,
  hoặc luồng quản trị viên, ngoại trừ các thuật ngữ phổ biến và mã định danh kỹ thuật đã được phê duyệt.
- Tất cả các nhãn vai trò và trạng thái hiển thị đều sử dụng tiếng Việt trong khi giá trị giá trị liệt kê thô không thay đổi.
- Các lỗi API đã biết về xác thực, mượn, đặt chỗ, thành viên, kiểm kê,
  khoản phạt, báo cáo, quản lý người dùng hiển thị thông báo tiếng Việt.
- Lỗi API không xác định hiển thị thông báo dự phòng tiếng Việt an toàn và không làm lộ máy chủ
  dấu vết bộ công nghệ hoặc chi tiết kỹ thuật.
- Ứng dụng sử dụng `Be Vietnam Pro` cho văn bản giao diện người dùng và `Noto Serif` cho các tiêu đề có
  Dự phòng có khả năng Unicode.
- Điều hướng, quyền, tải trọng API hiện tại và hành vi của quy trình làm việc vẫn không thay đổi.
- Tên, tiêu đề, tên tác giả, địa chỉ email và giá trị mã vạch do người dùng nhập không được
  bị thay đổi.
- Kiểm tra giao diện người dùng, tìm lỗi mã nguồn và vượt qua bản dựng sản xuất.

### 5.1 Theo dõi chấp nhận đáp ứng H3 (2026-07-20)

Sau khi đánh giá trực quan H3 xác định hợp đồng điều hướng di động bị thiếu, người yêu cầu đã phê
duyệt phần tiếp theo vỏ phản hồi có giới hạn này để đối chiếu tương tự: `HomePage` hiển thị menu di
động có thể truy cập chứa các liên kết công khai và hành động tài khoản hiện có (bao gồm `Đăng kí
Thành viên`), các điều khiển điều hướng trên máy tính để bàn/auth bị ẩn tại điểm dừng di động và lưới
CTA, thẻ lợi ích và chân trang thu gọn tại điểm dừng hẹp. Quá trình tiếp theo sẽ duy trì các tuyến
đường, quyền, tải trọng API và ngữ nghĩa hành động hiện có; nó không thêm API, lược đồ hoặc hành vi
kinh doanh. Cần phải chấp nhận H3 trước khi hợp nhất.

## 6. Kiểm tra và xác minh

Thêm các kiểm thử lối vào tập trung cho:

- Bản sao tiếng Việt được chia sẻ và ánh xạ hiển thị vai trò/trạng thái.
- Hành vi giải quyết lỗi API và dự phòng tiếng Việt.
- Bảo toàn các giá trị trạng thái thô cho logic nghiệp vụ.
- Ngôn ngữ/tiêu đề của tài liệu và hệ thống mã thông báo phông chữ dùng chung trong đó các kiểm thử cấp nguồn là
  mô hình dự án đã thiết lập.

Chạy bộ kiểm thử giao diện người dùng, tìm lỗi mã nguồn và bản dựng hiện có. Thực hiện kiểm tra
trình duyệt đáp ứng để xác thực, duyệt công khai và một trang hoạt động được bảo vệ ở độ rộng máy
tính để bàn và thiết bị di động, đặc biệt chú ý đến dấu kết hợp tiếng Việt, ngắt dòng, độ rộng nút
và nhãn bảng.

## 7. Ngoài phạm vi và rủi ro

- Nếu không thể truy cập Google Fonts trong môi trường triển khai, phông chữ dự phòng sẽ được
  đã sử dụng; việc triển khai không được thất bại hoặc ẩn nội dung.
- Tên riêng và siêu dữ liệu danh mục có thể vẫn chứa tiếng Anh vì chúng là dữ liệu nguồn,
  không sao chép giao diện.
- Bộ chuyển đổi tiếng Anh/tiếng Việt trong tương lai sẽ yêu cầu một thiết kế riêng đã được phê duyệt và phải
  không được suy ra từ công việc này.

