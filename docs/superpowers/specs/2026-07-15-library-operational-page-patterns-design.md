# Thiết kế mẫu trang hoạt động của thư viện

Trạng thái: ĐÃ ĐƯỢC PHÊ DUYỆT - HUMAN DESIGN GATE ĐÃ ĐẠT

Ngày: 2026-07-15

nhánh: `docs/ux-slice3-operational-patterns`

## 1. Mục đích

Xác định hợp đồng UX có thể thực thi cho Phần 3 của chương trình UX Hệ thống quản lý thư viện. Phần
này chuẩn hóa các tiêu đề trang vận hành, trạng thái dữ liệu, thanh công cụ, bảng, xác nhận và phản
hồi hoàn thành mà không thay đổi hành vi kinh doanh.

Thiết kế tuân theo quy trình làm việc theo hướng thông số kết hợp và hướng tác nhân:

1. Phân tích tính nhất quán được ghi lại trong `.sdd/reviews/library-ux-slice3-operational-consistency-analysis-2026-07-15.md`.
2. Nhật phê duyệt ranh giới chỉ trình chiếu cho FE06 và FE09.
3. Nhất phê duyệt thiết kế nguyên thủy dùng chung và thiết kế FE07 vào ngày 15/07/2026.
4. Kế hoạch thực hiện và những thay đổi trong sản xuất vẫn được giữ lại ở các cổng xem xét riêng biệt.

## 2. Yêu cầu nguồn

Thiết kế này tinh chỉnh nhưng không thay thế thiết kế UX chính đã được phê duyệt:

- `UX-FE-006`: Các trang được API hỗ trợ hiển thị các trạng thái tải, trống, thành công và không thành công mà không thay đổi bố cục không ổn định.
- `NFR-UX-001`: Các hành động chính, thông báo trạng thái và nội dung trang vẫn có thể truy cập được ở độ rộng khung nhìn được phê duyệt.
- `NFR-UX-002`: Điều khiển tương tác có tên dễ truy cập và tiêu điểm bàn phím hiển thị.
- `NFR-UX-003`: Chuyển động của bản trình bày ngắn và tôn trọng các tùy chọn giảm chuyển động.
- `AC-UX-004`: Nội dung trang được bảo vệ vẫn có thể truy cập được ở 390px.
- `AC-UX-005`: Trạng thái dữ liệu phù hợp hiển thị và ổn định.
- `AC-UX-007`: Điều hướng, hộp thoại, biểu mẫu và hành động vẫn có thể sử dụng được bằng bàn phím.
- `AC-UX-008`: API, các hợp đồng kinh doanh, bảo mật và quyền riêng tư không thay đổi.

Các yêu cầu UX dành riêng cho chức năng vẫn có hiệu lực:

- FE06: `NFR-FE06-UX-001` và `NFR-FE06-UX-002`.
- FE07: `NFR-FE07-UX-001` và các tác vụ giao diện người dùng `FE07-T20` đến `FE07-T27`.
- FE08: `NFR-FE08-UX-001` và `NFR-FE08-UX-002`.
- FE09: `NFR-FE09-UX-001`, `NFR-FE09-UX-002` và tác vụ giao diện người dùng bị trì hoãn `FE09-T012`.
- FE12: `NFR-FE12-UX-001` và `NFR-FE12-UX-002`.

## 3. Bàn thắng

- Cung cấp cho các trang vận hành một cấu trúc dễ nhận biết cho tiêu đề, hành động, tải, lỗi, kết quả trống, bộ lọc, bảng, xác nhận và phản hồi hoàn thành.
- Tái sử dụng giao diện ứng dụng hiện tại và hệ thống hình ảnh thư viện ấm áp thay vì giới thiệu một ngôn ngữ thiết kế khác.
- Thiết lập FE07 mượn sách làm công cụ theo dõi trước khi di chuyển các trang hoạt động khác.
- Giữ nguyên các lệnh gọi API thuộc sở hữu của trang, xem mô hình, tính toán kinh doanh và ủy quyền tuyến đường.
- Làm cho Hàng tồn kho FE06 và khoản phạt FE09 nhất quán về mặt trực quan trong khi vẫn duy trì các giới hạn và nguồn dữ liệu nguyên mẫu hiện tại của chúng.
- Giữ giải pháp đủ nhỏ để nhóm sinh viên có thể hiểu, xem xét và duy trì.

## 4. Không có mục tiêu

- Không có máy chủ, hợp đồng API, lược đồ cơ sở dữ liệu hoặc thay đổi quy tắc nghiệp vụ.
- Không có thay đổi nào về cách tính khoản phạt, tính đủ điều kiện vay, quy tắc gia hạn, thứ tự xếp hàng đặt chỗ, số liệu báo cáo hoặc chuyển đổi trạng thái hàng tồn kho.
- Không có vai trò khách hàng mới hoặc hành vi ủy quyền máy chủ.
- Không có yêu cầu phân phối hoặc hoàn thành nhiệm vụ FE06 API trong khi `PLAN.md` và `TASKS.md` của nó vẫn chưa bắt đầu.
- Không có giao diện FE09 liên kết API; đó vẫn là `FE09-T012`.
- Không thay thế Bootstrap, MUI, React Router, Axios hoặc thư viện biểu tượng hiện có.
- Không có đáp ứng đầy đủ và chấp nhận khả năng tiếp cận; vẫn là phần việc 4, mặc dù các nguyên thủy mới phải được thiết kế để hỗ trợ nó.
- Không thiết kế lại các trang công khai, xác thực, hồ sơ, quản lý người dùng hoặc quản lý sách không liên quan.

## 5. Phương pháp được lựa chọn

Sử dụng cấu trúc nguyên thủy được chia sẻ với nội dung và hành vi do trang sở hữu.

- Các thành phần được chia sẻ có bố cục, ngữ nghĩa, trạng thái trực quan, hành vi tập trung và ngăn chặn hành động trùng lặp.
- Các trang chức năng tiếp tục sở hữu các yêu cầu API, ánh xạ mô hình chế độ xem, bộ lọc, hàng đã chọn và trình xử lý thao tác ghi.
- Bảng chia sẻ có tính chất tổng hợp chứ không phải là khung lưới dữ liệu dựa trên lược đồ. Các trang giữ quyền kiểm soát việc hiển thị hàng và ô.
- Các bản xuất hiện có vẫn có sẵn trong quá trình di chuyển để tránh việc đổi tên toàn bộ kho lưu trữ trong một lần xác nhận.

Cách tiếp cận này đã được chọn thay vì chuẩn hóa chỉ CSS vì CSS không thể thực thi các hợp đồng
trạng thái hoặc xác nhận. Nó được chọn qua việc viết lại trang đồng thời vì năm mô-đun mục tiêu có
thời hạn phân phối và rủi ro khác nhau.

## 6. Kiến trúc thành phần

### 6.1 `PageHeader`

Trách nhiệm:

- Hiển thị một tiêu đề trang, bối cảnh hỗ trợ tùy chọn và các hành động chính/phụ tùy chọn.
- Giữ vị trí hành động ổn định trên máy tính để bàn và xếp chồng các hành động bên dưới tiêu đề trên màn hình hẹp.
- Giữ lại một `h1` cho trang.

Tích hợp:

- `AppLayout` tổng hợp `PageHeader` từ các đạo cụ `title`, `subtitle` và `actions` hiện tại của nó.
- Các trang không hiển thị tiêu đề cấp trang thứ hai trong nội dung của chúng.
- Các trang web cuộc gọi `AppLayout` hiện tại vẫn tương thích.

### 6.2 `StatusNotice`

Trách nhiệm:

- Hiển thị trạng thái `info`, `warning`, `error` hoặc `success` liên tục.
- Chấp nhận tiêu đề, nội dung và hành động tùy chọn, chẳng hạn như thử lại.
- Sử dụng ngữ nghĩa cảnh báo cho các lỗi và ngữ nghĩa trạng thái cho các thông báo không có lỗi.
- Mô tả kết quả của người dùng và hành động tiếp theo chứ không phải chi tiết triển khai hoặc tên điểm cuối.

Khả năng tương thích:

- `DataNotice` vẫn là bản xuất hoặc trình bao bọc tương thích tạm thời trong quá trình di chuyển.

### 6.3 `LoadingBlock`

Trách nhiệm:

- Dự trữ vùng nội dung ổn định trong khi dữ liệu đang tải.
- Hiển thị nhãn bận có thể truy cập.
- Hỗ trợ một tập hợp nhỏ các biến thể đếm hàng thay vì triển khai khung theo trang cụ thể.
- Dừng hoạt ảnh trang trí theo tùy chọn giảm chuyển động.

### 6.4 `EmptyState`

Trách nhiệm:

- Phân biệt tập dữ liệu trống với trạng thái không có kết quả được lọc.
- Hiển thị biểu tượng, tiêu đề ngắn, giải thích tùy chọn và hành động tiếp theo có liên quan tùy chọn.
- Tránh ngõ cụt chung khi người dùng có thể xóa bộ lọc, thử lại hoặc bắt đầu quy trình làm việc.

### 6.5 `DataToolbar`

Trách nhiệm:

- Cung cấp các vị trí cấu trúc cho tìm kiếm, tab, bộ lọc, tóm tắt kết quả, đặt lại và hành động dữ liệu cấp trang.
- Giữ các điều khiển có thể sử dụng được khi gói thành nhiều hàng.
- Đặt tên cho các điều khiển đặt lại có thể truy cập được và tắt chúng khi không có bộ lọc nào hoạt động.

Hạn chế:

- Thành phần này không sở hữu các yêu cầu trạng thái truy vấn, logic lọc, phân trang hoặc API.
- Mỗi trang đều vượt qua các điều khiển mà nó cần; những vùng không sử dụng sẽ bị bỏ qua.

### 6.6 `DataTable`

Trách nhiệm:

- Cung cấp trình bao bọc bảng ngữ nghĩa với các vùng chú thích, tiêu đề, nội dung, tải và trạng thái trống.
- Giữ nguyên kết xuất hàng thuộc sở hữu của trang và hành vi hàng có thể chọn bằng bàn phím hiện có.
- Hỗ trợ trình bày hàng/thẻ trên thiết bị di động thông qua các lớp phản hồi được chia sẻ và nhãn ô do trang cung cấp.
- Giữ các cột số và trạng thái có thể đọc được mà không thay đổi thứ tự sắp xếp hoặc giá trị dữ liệu.

Hạn chế:

- Không giới thiệu công cụ sắp xếp, lựa chọn, ảo hóa hoặc phân trang máy chủ chung chung.
- Không ẩn các cột chứa ngữ cảnh hoạt động cần thiết.
- Tràn ngang có thể vẫn là giải pháp dự phòng cho nội dung rộng bất thường nhưng bản trình bày chính trên thiết bị di động sử dụng các hàng/thẻ được gắn nhãn.

### 6.7 `ConfirmAction`

Trách nhiệm:

- Soạn thảo `Modal` có thể truy cập hiện có để phê duyệt, từ chối, trả sách, gia hạn, hủy đặt chỗ, thu khoản phạt, hoàn thành thanh toán và các hành động tiếp theo khác.
- Hiển thị bối cảnh hành động cụ thể, hủy văn bản, xác nhận văn bản và tông màu trực quan.
- Tắt xác nhận trùng lặp trong khi thao tác ghi đang chờ xử lý.
- Giữ nguyên khả năng khôi phục tiêu điểm và bẫy bàn phím từ phương thức hiện có.
- Giữ hộp thoại mở và hiển thị phản hồi có thể thực hiện được khi thao tác ghi không thành công.

Hạn chế:

- Thành phần này không tự thực hiện thao tác ghi API.
- Trình xử lý trang vẫn chịu trách nhiệm về kết quả của máy chủ chuẩn và cập nhật trạng thái cục bộ.

### 6.8 `Toast`

Trách nhiệm:

- Xác nhận hoàn thành thao tác ghi trong thời gian ngắn hoặc hiển thị lỗi thao tác ghi có thể phục hồi.
- Tránh thay thế trạng thái nội tuyến liên tục khi trang hiện tại vẫn bị lỗi hoặc chưa hoàn thiện.
- Sử dụng móc và kiểu dáng được chia sẻ hiện có; FE09 loại bỏ việc triển khai trùng lặp trong quá trình di chuyển.

## 7. Mô hình trạng thái hoạt động

Mỗi bộ sưu tập hoặc bề mặt báo cáo được hỗ trợ bởi API đều sử dụng một trạng thái chính hiển thị:

1. `loading`: hiển thị `LoadingBlock`; giữ tiêu đề trang và tải lại hành động ổn định.
2. `error`: hiển thị `StatusNotice` với bản sao an toàn và hành động thử lại; không hiển thị dữ liệu cũ dưới dạng chuẩn trừ khi nó được gắn nhãn rõ ràng là dự phòng demo.
3. `empty`: hiển thị `EmptyState` để phản hồi thành công mà không có bản ghi.
4. `success`: hiển thị thanh công cụ, trình bày dữ liệu và trạng thái nội tuyến có liên quan.

Các bộ sưu tập được lọc cũng phân biệt:

- Tập dữ liệu trống: không có bản ghi nào tồn tại cho người dùng hoặc mô-đun hiện tại.
- Không có kết quả nào: bản ghi tồn tại nhưng tìm kiếm hoặc bộ lọc đang hoạt động không khớp; đề nghị thiết lập lại khi thích hợp.

thao tác ghi sử dụng một trạng thái riêng biệt:

1. `idle`: hành động khả dụng khi trạng thái doanh nghiệp cho phép.
2. `pending`: hành động xác nhận bị vô hiệu hóa và được gắn nhãn là đang xử lý.
3. `success`: hộp thoại đóng sau khi cập nhật trạng thái chuẩn; chúc mừng ngắn gọn.
4. `error`: hộp thoại vẫn khả dụng hoặc trả sách tiêu điểm cho điều khiển bị lỗi; hiển thị phản hồi an toàn có thể hành động mà không giả vờ hành động đã thành công.

## 8. Ứng dụng chức năng

### 8.1 FE07 Vay - theo dõi

Trước tiên hãy áp dụng bộ nguyên thủy hoàn chỉnh:

- Yêu cầu mượn: thanh công cụ/tìm kiếm được chia sẻ và trạng thái trống; giữ nguyên nguồn danh mục hiện tại và tạo yêu cầu API.
- Lịch sử mượn: thanh công cụ dùng chung, tab, bảng dữ liệu, vỏ phân trang, xác nhận gia hạn và trạng thái chờ thao tác ghi.
- Yêu cầu mượn của nhân viên: bảng dữ liệu dùng chung và xác nhận phê duyệt/từ chối rõ ràng; duy trì hành vi của hàng có thể chọn.
- Xử lý trả về: thanh công cụ và bảng dữ liệu dùng chung; yêu cầu xác nhận trước khi gửi thao tác ghi trả về hiện có.
- Chi tiết mượn của thành viên: thanh công cụ tra cứu được chia sẻ và cả ba trạng thái bảng.

Không có thay đổi nào về phương thức FE07 API, quy tắc đủ điều kiện, tính toán ngày, bảo vệ vai trò
hoặc chức năng ánh xạ trong phần này.

### 8.2 FE08 Đặt chỗ

- Sử dụng thanh công cụ dùng chung, bảng dữ liệu, thông báo trạng thái, trạng thái trống, xác nhận và mẫu bánh mì nướng.
- Giữ nguyên các API tạo, hủy, xử lý hàng đợi, hết hạn lưu giữ và thông báo.
- Giữ nguyên hành vi dự phòng demo hiện tại trong lát bản trình bày này nhưng liên tục gắn nhãn nó là không chuẩn và tắt các hành động chỉ dành cho máy chủ khi được yêu cầu.
- Không thay đổi thứ tự hàng đợi, quy tắc giữ, hành vi thông báo hoặc ủy quyền tuyến đường.

### 8.3 FE06 Khoảng không quảng cáo - chỉ dành cho bản trình bày

- Giữ `InventoryPage` bên trong `AppLayout` và xóa tiêu đề trang bên trong trùng lặp.
- Thay thế bảng dành riêng cho trang, trạng thái trống, bố cục bộ lọc và cách trình bày theo phương thức bằng các mẫu được chia sẻ nếu tương thích.
- Giữ nguyên `MOCK_BOOKS`, `MOCK_COPIES`, hành vi chỉnh sửa hiện tại và trạng thái trong bộ nhớ hiện có.
- Rõ ràng hãy tránh mọi tuyên bố rằng màn hình là triển khai FE06 API chuẩn.
- Không tạo, cập nhật, vô hiệu hóa hoặc chuyển trạng thái bản ghi bản sao sách thực trong lát cắt này.

### 8.4 FE09 khoản phạt - chỉ trình bày

- Di chuyển không gian làm việc tốt hiện có vào `AppLayout` và xóa bản trình bày điều hướng/lớp bao toàn cầu trùng lặp của nó.
- Giữ nguyên điều hướng quy trình làm việc cục bộ dưới dạng tab cấp trang hoặc dạng xem hoạt động được phân đoạn.
- Tái sử dụng các mẫu thanh công cụ, bảng, trạng thái, trống, xác nhận và bánh mì nướng được chia sẻ.
- Bảo toàn hành vi localStorage/dữ liệu mẫu hiện có cho đến khi `FE09-T012` được lên kế hoạch và phê duyệt riêng.
- Giữ nguyên hoạt động tính toán và thu thập hiện có; không trình bày nó dưới dạng xử lý chính tắc phía máy chủ.
- Duy trì quyền truy cập vào mọi không gian làm việc quản lý sách hiện được nhúng trong quá trình di chuyển bản trình bày này; không thiết kế lại mô-đun đó.

### 8.5 FE12 Báo cáo

- Hợp nhất các bố cục bộ lọc ngày/danh mục lặp lại trong `DataToolbar`.
- Sử dụng các bảng được chia sẻ cho những cuốn sách hay nhất, lượng tồn kho thấp và bản tóm tắt role/membership.
- Giữ nguyên các trình bảo vệ báo cáo, trình tạo tham số bộ lọc, dữ liệu biểu đồ, số liệu và ngữ nghĩa chỉ đọc.
- Thay thế bản sao thành công hướng đến điểm cuối bằng phản hồi hướng đến kết quả.

## 9. Tích hợp điều hướng

- Thêm Hàng tồn kho và khoản phạt vào nhóm điều hướng nhân viên hiện có bằng cách sử dụng quy tắc hiển thị `LIBRARIAN` và `ADMIN` đã được phê duyệt.
- Lấy trạng thái điều hướng đang hoạt động từ các tuyến đường hiện có của họ.
- Không thêm vai trò, mở rộng khả năng hiển thị hoặc thay thế ủy quyền máy chủ.
- Giữ các tab quy trình làm việc cục bộ bên trong nội dung trang; không giới thiệu lớp bao ứng dụng thứ hai.

## 10. Quy tắc lỗi và sao chép

- Các trang hoạt động được bảo vệ sử dụng nhãn tiếng Việt một cách nhất quán cho người dùng.
- Mã định danh API, mã định danh nguồn, tên kiểm tra và ID đặc tả vẫn là tiếng Anh.
- Không hiển thị dấu vết bộ công nghệ thô, thông báo SQL, mã thông báo, chi tiết SMTP hoặc thông báo kết nối điểm cuối.
- Thông báo xác thực và xung đột giải thích lý do chặn khi hợp đồng chức năng được phê duyệt cung cấp nó.
- Các lỗi không xác định vẫn chung chung và có thể xử lý được: thử lại, kiểm tra phiên/kết nối hoặc liên hệ với thủ thư tùy theo ngữ cảnh.
- Lời chúc mừng không yêu cầu hoàn thành cho đến khi thao tác ghi chuẩn thành công.

## 11. Chiến lược kiểm thử

Sử dụng kiểu kiểm tra Nút hiện tại của kho lưu trữ và tránh các phụ thuộc kiểm tra mới.

- Thêm các hợp đồng nguồn thành phần được chia sẻ tập trung cho ngữ nghĩa, xuất khả năng tương thích, hành vi xác nhận đang chờ xử lý và móc bảng phản hồi.
- Trước tiên, hãy mở rộng các kiểm thử FE07 để chứng minh việc áp dụng công cụ theo dõi mà không thay đổi lệnh gọi API, bộ bảo vệ tuyến đường hoặc ánh xạ chuẩn.
- Thêm các kiểm thử áp dụng tập trung cho FE08, FE06, FE09 và FE12 khi mỗi mô-đun di chuyển.
- Giữ nguyên tiện ích chức năng và các kiểm thử API.
- Chạy kiểm thử giao diện người dùng có mục tiêu trong mỗi tác vụ, sau đó tìm lỗi mã nguồn cho giao diện người dùng và xây dựng tại cổng xác thực lát cắt.
- Sử dụng `git diff --check` và kiểm tra khác biệt lần cuối trước mỗi lần cam kết đánh giá.
- Trì hoãn bằng chứng chấp nhận toàn bộ khung nhìn và bàn phím cho phần việc 4, đồng thời ngăn chặn các trình chặn cấu trúc đã biết trong phần việc 3.

## 12. Tiêu chí chấp nhận

- `AC-UX-S3-001`: Với một trang hoạt động, khi nó hiển thị trong lớp bao được bảo vệ thì nó có một tiêu đề trang với tiêu đề, ngữ cảnh và các hành động có thể truy cập.
- `AC-UX-S3-002`: Với bề mặt được hỗ trợ bởi API, khi nó đang tải, bị lỗi, trống, bị lọc không có kết quả hoặc thành công thì sẽ hiển thị chính xác trạng thái liên quan và hành động khôi phục.
- `AC-UX-S3-003`: Đưa ra một hành động mang tính hệ quả, khi người dùng xác nhận hành động đó thì việc gửi trùng lặp sẽ bị ngăn chặn trong khi đang chờ xử lý và thành công chỉ được hiển thị sau khi trình xử lý thành công.
- `AC-UX-S3-004`: Với một bảng dữ liệu có chiều rộng di động, khi các hàng hiển thị, ngữ cảnh ô bắt buộc vẫn có thể hiểu được thông qua việc trình bày hàng/thẻ được gắn nhãn chung mà không có sự chồng chéo không mạch lạc.
- `AC-UX-S3-005`: Với các trang theo dõi FE07, khi áp dụng các mẫu chia sẻ, thì các lệnh gọi API hiện có, xem mô hình, bảo vệ tuyến đường và kết quả kinh doanh sẽ không thay đổi.
- `AC-UX-S3-006`: Với dự phòng demo FE08, khi yêu cầu máy chủ không thành công thì dự phòng rõ ràng là không chuẩn và các hành động chỉ dành cho máy chủ vẫn bị hạn chế như trước.
- `AC-UX-S3-007`: Với Kho lưu trữ FE06, khi quá trình di chuyển bản trình bày hoàn tất, thì tiêu đề trùng lặp và bản trình bày trạng thái/bảng theo trang cụ thể sẽ được thay thế trong khi dữ liệu mô phỏng và hành vi trong bộ nhớ không thay đổi.
- `AC-UX-S3-008`: Đưa ra các mức phạt FE09, khi quá trình di chuyển bản trình bày hoàn tất, nó sẽ sử dụng vỏ ứng dụng dùng chung và các mẫu phản hồi trong khi localStorage/hành vi dữ liệu mẫu không thay đổi và `FE09-T012` vẫn mở.
- `AC-UX-S3-009`: Đưa ra các Báo cáo FE12, khi áp dụng các mẫu chia sẻ thì các bộ lọc, giá trị báo cáo, bộ bảo vệ và hành vi chỉ đọc sẽ không thay đổi.
- `AC-UX-S3-010`: Với sự khác biệt cuối cùng của phần việc 3, khi được xem xét, nó không chứa các thay đổi về API/lược đồ, các thay đổi về tính toán kinh doanh, mở rộng vai trò, các bí mật hoặc các phần phụ thuộc sản xuất mới.

## 13. Cổng triển khai và đánh giá

Trình tự thực hiện vẫn như sau:

1. Lớp nguyên thủy và lớp tương thích được chia sẻ.
2. FE07 Máy theo dõi mượn.
3. FE08 Đặt chỗ.
4. FE06 Di chuyển chỉ trình bày khoảng không quảng cáo.
5. FE09 khoản phạt di chuyển chỉ trình bày.
6. FE12 Báo cáo.
7. Xác nhận có mục tiêu và đánh giá của con người.

Mỗi giai đoạn phải luôn được xem xét và theo dõi. Giai đoạn sau sẽ không bắt đầu nếu giai đoạn trước
cho thấy sự thoái lui trong hợp đồng kinh doanh hoặc yêu cầu mở rộng phạm vi không được phê duyệt.

## 14. Quyết định đã được giải quyết

- `DEC-UX-S3-001`: Sử dụng các nguyên hàm tổng hợp được chia sẻ, không phải chuẩn hóa chỉ CSS hoặc khung lưới dữ liệu chung.
- `DEC-UX-S3-002`: FE07 Vay là lát đánh dấu.
- `DEC-UX-S3-003`: FE06 và FE09 nhận di chuyển chỉ dành cho bản trình bày; chức năng/phân phối API của họ vẫn riêng biệt.
- `DEC-UX-S3-004`: Giữ dữ liệu thuộc sở hữu của trang và logic thao tác ghi.
- `DEC-UX-S3-005`: Duy trì khả năng xuất tương thích trong khi các trang di chuyển tăng dần.
- `DEC-UX-S3-006`: Thêm Hàng tồn kho và khoản phạt vào điều hướng nhân viên hiện có mà không thay đổi quy tắc vai trò.

## 15. Hồ sơ phê duyệt

Nhật đã phê duyệt ranh giới chỉ trình bày được đề xuất cho FE06/FE09 và phê duyệt thiết kế theo dõi
nguyên thủy chung này, FE07 trong nhiệm vụ Codex vào ngày 15 tháng 7 năm 2026.

Sự phê duyệt này cho phép viết kế hoạch thực hiện sau khi thiết kế đã cam kết nhận được đánh giá
bằng văn bản. Nó không cho phép triển khai sản xuất, hợp nhất hoặc thay đổi ngoài phạm vi trên.
