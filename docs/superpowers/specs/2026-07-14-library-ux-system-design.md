# Hệ thống quản lý thư viện Thiết kế UX

Ngày: 2026-07-14 Phiên bản: 0.1.0 Trạng thái: ĐÃ ĐƯỢC PHÊ DUYỆT - SLICES 1-2 HOÀN THÀNH; SLICES 3-4
PLANNED Cập nhật lần cuối: 2026-07-15 Chủ sở hữu: Nhật Nguồn chuẩn:
`spec-driven-&-agent-driven-development.pdf` cộng với Hiến pháp dự án, Bối cảnh chung và thông số
chức năng.

## 0. truy vết cẩm nang

Tài liệu này tuân theo cẩm nang thay vì coi UX như một công cụ tái cấu trúc hình ảnh không giới hạn:

- Chương 2, Kỹ sư kết quả: xác định kết quả và bằng chứng của người dùng, không chỉ đầu ra mã.
- Chương 5.2, Thông số thực thi: nắm bắt bối cảnh, tác nhân, chức năng và phi chức năng
  yêu cầu, hành vi dữ liệu/lỗi, tiêu chí chấp nhận và ngoài phạm vi.
- Chương 5.3, EARS: thể hiện hành vi có thể quan sát được dưới dạng điều kiện và phản hồi của hệ thống.
- Chương 5.5 và Chương 6.1, quy trình làm việc của SDD: chỉ định, xem xét, lập kế hoạch, phân tách, triển khai,
  và xác nhận trước khi gọi công việc là hoàn thành.
- Chương 7.2, Lập kế hoạch làm rõ trước tiên: đưa ra các quyết định mở một cách rõ ràng thay vì
  âm thầm lựa chọn hành vi sản phẩm.
- Chương 7.3, Cổng phân tích tính nhất quán: kiểm tra thiết kế UX dựa trên các đặc tả hiện có,
  các tuyến đường, hợp đồng RBAC, API và các ràng buộc trước khi triển khai.
- Chương 13.1 và 13.3, Hybrid lõi & lớp bao: sử dụng nguyên tắc đặc tả đầy đủ cho
các luồng nhạy cảm về hành vi và bảo mật; sử dụng thực thi tác nhân có hướng dẫn cho công việc trình
bày trình bao.
- Chương 13.3, Cổng xác thực: xác minh kiểm tra tự động, tuân thủ đặc tả, hiến pháp
  sự tuân thủ và sự chấp nhận của con người một cách riêng biệt.
- Chương 14.3, hoàn thiện & bàn giao: đây là công việc hoàn thiện và bàn giao; nó không được trở thành một
  lý do để thêm các chức năng sản phẩm mới.

PDF là tài liệu tham khảo phương pháp. Các tệp dự án hiện tại vẫn là nguồn thông tin đáng tin cậy về
mặt kỹ thuật và miền khi sổ tay hướng dẫn quy trình chứ không đưa ra các quy tắc về sản phẩm.

### Phân loại lõi và vỏ

Các mục cốt lõi yêu cầu truy vết đặc tả và xác thực rõ ràng:

- Chuyển tiếp bước xác thực, xác thực, xử lý lỗi, hành vi gửi lại OTP và sao chép an toàn.
- Khả năng hiển thị điều hướng dựa trên vai trò và hành vi tuyến đường được bảo vệ.
- Hợp đồng trạng thái được API hỗ trợ trong đó quyết định giao diện người dùng thay đổi hành vi mà người dùng có thể quan sát được.
- Tiêu chí chấp nhận cho hành trình đăng ký, đăng nhập và quy trình làm việc được bảo vệ.

Các hạng mục vỏ đủ điều kiện thực hiện tác nhân hướng dẫn sau khi thiết kế này được phê duyệt:

- Bố cục được chia sẻ, bản trình bày điều hướng, khoảng cách, mã thông báo, kiểu chữ và CSS phản hồi.
- Có thể tái sử dụng các nguyên hàm tải, trống, thông báo, bảng, bánh mì nướng và xác nhận.
- Kiểu dáng tập trung và các điều chỉnh đáp ứng ở cấp độ trình bày không làm thay đổi các quy tắc.

Nếu thay đổi lớp bao làm thay đổi hành vi kinh doanh hoặc ranh giới bảo mật, thay đổi đó sẽ quay trở
lại phần lõi và yêu cầu cập nhật thông số chức năng liên quan trước tiên.

## 1. Quyết định

Áp dụng một hệ thống UX duy nhất cho ứng dụng React hiện có. Giữ nguyên bản sắc ấm áp của thư viện
nhưng làm cho sản phẩm nhẹ nhàng hơn, dày đặc hơn, dễ đoán hơn và dễ sử dụng hơn trên màn hình nhỏ.
Công việc được phân phối thành bốn lát dọc:

1. Vỏ ứng dụng được chia sẻ và điều hướng đáp ứng.
2. Luồng đăng nhập, đăng ký và gửi email OTP.
3. Các trạng thái được chia sẻ và các mẫu tương tác cho các trang hoạt động.
4. hoàn thiện đáp ứng và khả năng tiếp cận trên các bề mặt được chạm vào.

Mục tiêu triển khai đầu tiên là lớp bao được chia sẻ vì mọi trang được bảo vệ đều phụ thuộc vào nó.
Quá trình xác thực diễn ra sau đó vì đây là hành trình đầu tiên của người dùng có độ ma sát cao.

## 2. Bối cảnh và những phát hiện hiện tại

Giao diện người dùng hiện tại có hai cách triển khai điều hướng: lớp vỏ hoạt động trong
`frontend/src/component/layout/AppLayout.jsx` và ngăn kéo MUI cũ trong
`frontend/src/component/layout/Sidebar.jsx`. Xác thực sử dụng hệ thống trực quan riêng biệt trong
`frontend/src/styles/login.css`.

Rủi ro UX được quan sát:

- Đăng ký trình bày năm trường trong một chế độ xem dày đặc và không có mô hình tiến trình rõ ràng
  trước khi chuyển sang xác minh OTP.
- Phản hồi của OTP mang tính chung chung và không cung cấp thời gian hồi chiêu gửi lại, hướng dẫn gửi hoặc
  đường dẫn khôi phục rõ ràng khi người dùng không thể truy cập email.
- Tìm kiếm vỏ ứng dụng được hiển thị dưới dạng điều khiển nhưng không có hành vi được xác định trên mỗi trang.
- Hành vi điều hướng trên máy tính để bàn và thiết bị di động không thống nhất; vỏ sụp đổ nhãn nhưng
  không cung cấp tương tác điều hướng di động rõ ràng.
- Các mẫu tải chia sẻ, trống, lỗi và thành công tồn tại trong CSS nhưng không được đảm bảo
  trên tất cả các trang chức năng.
- Bảng màu ấm và bề mặt tròn được lặp lại với các hệ thống thành phần khác nhau,
  làm cho khoảng cách và thứ bậc có cảm giác không nhất quán.

## 3. Bàn thắng

- Làm cho các hành trình chính trở nên dễ hiểu mà không cần giải thích: duyệt qua, xác thực,
  mượn, dự trữ, trả sách và xem xét các báo cáo.
- Bảo toàn dữ liệu biểu mẫu do người dùng nhập thông qua xác thực và các lỗi API có thể phục hồi.
- Làm cho trạng thái hệ thống hiển thị thông qua tải nhất quán, trống, lỗi, thành công và
  các bang khuyết tật.
- Làm cho ứng dụng được bảo vệ có thể sử dụng được ở độ rộng máy tính để bàn và thiết bị di động mà không bị ẩn
  những hành động thiết yếu.
- Giữ điều hướng dựa trên vai trò phù hợp với quyền máy chủ.
- Cải thiện tiêu điểm bàn phím, nhãn điều khiển, mục tiêu cảm ứng và bản sao lỗi có thể đọc được.
- Giảm các nguyên gốc trực quan trùng lặp mà không thay đổi hành vi kinh doanh hoặc API
  hợp đồng.

Các chỉ số thành công cho thiết kế này:

- Người đánh giá có thể hoàn tất hành trình đăng ký đến xác minh mà không cần hỏi điều gì
  xảy ra tiếp theo.
- lớp bao vẫn có thể sử dụng được ở bốn độ rộng mục tiêu trong tiêu chí chấp nhận.
- Mỗi bề mặt được hỗ trợ API được chạm vào sẽ hiển thị trạng thái được kiểm tra về tải, trống, lỗi và
  thành công.
- Hồ sơ chấp nhận của con người không có trình điều hướng, mất dữ liệu biểu mẫu, tập trung hoặc chặn chồng chéo.

## 3.1 Diễn viên và vai trò

- `Guest`: có thể truy cập các điểm đăng nhập, đăng ký, quên mật khẩu và các điểm truy cập công khai.
- `Member`: có thể sử dụng hành trình mượn, lịch sử và đặt chỗ của thành viên.
- `Librarian`: có thể sử dụng các hoạt động mượn, tồn kho, đặt chỗ và báo cáo được phép
  theo hợp đồng vai trò hiện có.
- `Admin`: có thể sử dụng các khả năng của thủ thư cộng với quản lý vai trò và người dùng đã được cung cấp bởi
  ứng dụng.
- `Email service`: gửi tin nhắn xác minh hoặc khôi phục; giao diện người dùng chỉ hiển thị an toàn
  trạng thái bàn giao và thử lại.
- `Browser`: sở hữu các tùy chọn lấy nét, khung nhìn, bàn phím và giảm chuyển động.

## 4. Không có mục tiêu

- Không có thay đổi đối với quy tắc xác thực, quy tắc mượn, quyền hoặc hợp đồng API.
- Không có mô-đun sản phẩm mới hoặc phạm vi chức năng.
- Không thay thế việc sử dụng React, Bootstrap/MUI mà dự án đã yêu cầu hoặc
  bộ công nghệ máy chủ hiện có.
- Không có thiết kế lại trực quan của mỗi trang trước khi các nguyên mẫu được chia sẻ ổn định.
- Không để lộ OTP, mật khẩu, mã thông báo hoặc thông tin xác thực SMTP trong ứng dụng khách.

## 5. Nguyên tắc kinh nghiệm

### 5.1 Một hành động, một kết quả

Các nút sử dụng các động từ rõ ràng và giữ nguyên cách diễn đạt từ khi kích hoạt đến khi kết quả.
Các hành động phá hoại hoặc không thể đảo ngược yêu cầu trạng thái xác nhận rõ ràng.

### 5.2 Trạng thái là một phần của giao diện

Mọi bề mặt được hỗ trợ API đều xác định hành vi tải, thành công, trống, lỗi, thử lại và bị vô hiệu
hóa. Văn bản `Internal server error` chung được thay thế bằng hành động tiếp theo an toàn trong khi
các chi tiết kỹ thuật vẫn ở phía máy chủ.

### 5.3 Bảo quản công việc

Các lỗi yêu cầu xác thực và có thể phục hồi không bao giờ xóa các giá trị của biểu mẫu. Giá trị mật
khẩu chỉ bị xóa sau khi tạo tài khoản thành công hoặc có ranh giới bảo mật rõ ràng.

### 5.4 Dày đặc nhưng bình tĩnh

Màn hình hoạt động ưu tiên khoảng cách thân thiện với việc quét, tiêu đề trang rõ ràng, bộ lọc nhỏ
gọn và bảng có thể dự đoán được. Thẻ trang trí không bao bọc toàn bộ phần trang một cách không cần
thiết.

### 5.5 Đáp ứng theo quy trình làm việc

Điện thoại di động không chỉ là một bố cục máy tính để bàn nhỏ hơn. Các hành động thiết yếu vẫn có
thể truy cập được, các bảng trở thành các hàng danh sách có thể đọc được hoặc các chi tiết được xếp
chồng lên nhau và điều hướng trở thành một ngăn kéo rõ ràng.

## 6. Hệ thống thị giác

Giữ bảng thư viện hiện có nhưng hợp nhất nó thành một lớp mã thông báo:

- Mực: `#241D16`
- Mực tắt tiếng: `#6F6456`
- Giấy: `#FFFDF8`
- Vải: `#F7F2E8`
- Dòng: `#DED1BA`
- Giọng chính: `#A87532`
- Bóng tối sơ cấp: `#7B5528`
- Thành công: `#2F8F5B`
- Cảnh báo: `#C78A3B`
- Nguy hiểm: `#C1452F`
- Thông tin: `#3A6EA5`

Kiểu chữ vẫn có thể đọc được và có chủ ý: một serif hạn chế cho tiêu đề trang và một sans-serif rõ
ràng cho các điều khiển, bảng và bản sao nội dung. Tránh thêm phần phụ thuộc phông chữ mới trừ khi
nó đã có sẵn trong dự án.

Hình học thành phần:

- Sử dụng bán kính 8-12px cho các điều khiển và các mục lặp lại.
- Chỉ dành khung lớn hơn cho các bề mặt xác thực và các công cụ được đóng khung thực sự.
- Giữ mục tiêu cảm ứng ít nhất là 44px nếu có thể.
- Sử dụng một thang đo khoảng cách dựa trên mức tăng 4px.
- Bảo toàn các trạng thái `:focus-visible` hiển thị bằng cách sử dụng vòng nhấn.

## 6.1 Yêu cầu UX có thể thực thi

Những yêu cầu này có thể được quan sát và kiểm tra một cách có chủ ý. Chúng không thay thế các yêu
cầu chức năng trong FE02, FE07, FE08, FE09 hoặc FE12; họ xác định hợp đồng UX xung quanh các yêu cầu
đó.

- `UX-FE-001`: WHEN một tuyến được bảo vệ được mở, hệ thống THE SHALL hiển thị tuyến đang hoạt động,
  bối cảnh vai trò hiện tại và điều khiển điều hướng có thể truy cập phù hợp với khung nhìn.
- `UX-FE-002`: WHEN người dùng mở trang đăng ký, hệ thống THE SHALL hiển thị hiện tại
  bước, các trường bắt buộc, hướng dẫn mật khẩu và hành động chính rõ ràng.
- `UX-FE-003`: Đăng ký WHEN không xác thực được hoặc trả về lỗi API có thể phục hồi, THE
hệ thống SHALL bảo toàn tất cả các giá trị biểu mẫu không bí mật và đặt phản hồi có thể thực hiện
được bên cạnh trường hoặc hành động có liên quan.
- `UX-FE-004`: Đăng ký WHEN thành công, hệ thống THE SHALL chuyển tiêu điểm sang đầu vào OTP,
  hiển thị email đích được che giấu và hiển thị trạng thái sẵn sàng gửi lại.
- `UX-FE-005`: WHEN yêu cầu gửi lại đang chờ xử lý hoặc bị giới hạn tốc độ, hệ thống THE SHALL bị vô hiệu hóa
  hành động gửi lại và hiển thị hành động khả dụng tiếp theo mà không cho phép các yêu cầu trùng lặp.
- `UX-FE-006`: WHEN một trang được hỗ trợ bởi API đang tải, trống, thành công hoặc không thành công, hệ thống THE
  SHALL hiển thị bề mặt theo trạng thái cụ thể mà không thu gọn bố cục trang.
- `UX-FE-007`: WHEN người dùng kích hoạt mục điều hướng, hệ thống THE SHALL cập nhật tuyến đường,
  trạng thái hoạt động và trạng thái ngăn kéo di động cùng nhau.
- `UX-FE-008`: WHEN một menu lớp phủ hoặc ngăn kéo đóng lại, hệ thống THE SHALL khôi phục tiêu điểm cho
  điều khiển đã mở nó trừ khi điều hướng đã chuyển sang một trang khác.
- `NFR-UX-001`: Ở chiều rộng khung nhìn 1440px, 1024px, 768px và 390px, không có hành động chính,
  nhãn, giá trị bảng hoặc điều khiển hộp thoại SHALL chồng chéo hoặc không thể truy cập được.
- `NFR-UX-002`: Tất cả các điều khiển tương tác SHALL đều có trạng thái tiêu điểm bàn phím hiển thị và
  tên có thể truy cập được; các điều khiển chỉ có biểu tượng SHALL có chú giải công cụ hoặc nhãn có
  thể truy cập được.
- `NFR-UX-003`: Quá trình chuyển đổi bản trình bày SHALL hoàn thành trong vòng 200 mili giây khi được sử dụng và SHALL
  tôn trọng `prefers-reduced-motion`.

## 6.2 Ranh giới dữ liệu và phụ thuộc

- Không có sự di chuyển cơ sở dữ liệu hoặc thay đổi hợp đồng API nào là một phần của thiết kế UX này.
- Các phản hồi API hiện tại được điều chỉnh theo ranh giới API/mô hình khung nhìn hiện có; thành phần
  không phát minh ra trạng thái kinh doanh hoặc các quy tắc ủy quyền trùng lặp.
- Mã thông báo xác thực, giá trị mật khẩu, giá trị OTP, cài đặt SMTP và thông tin xác thực cơ sở dữ liệu không bao giờ
  nhập trạng thái trực quan, ảnh chụp màn hình, nhật ký hoặc bản sao lỗi mà người dùng gặp phải.
- đặc tả chức năng hiện tại vẫn có thẩm quyền để mượn, đặt chỗ, khoản phạt,
  dữ liệu thông báo, báo cáo và quản lý vai trò.

## 7. Phần 1: Vỏ ứng dụng dùng chung

### Điều hướng

- Biến `AppLayout` thành nguồn thông tin chính xác duy nhất cho việc điều hướng được bảo vệ.
- Loại bỏ hoặc tách biệt việc sử dụng `Sidebar` cũ thay vì duy trì hai mô hình điều hướng.
- Giữ các nhóm vai trò và trạng thái tuyến đường hoạt động bắt nguồn từ vị trí hiện tại.
- Thêm nút menu di động với ngăn kéo hoặc bảng điều khiển ngoài canvas có thể truy cập được.
- Đóng điều hướng di động sau khi chọn tuyến đường và khôi phục tiêu điểm vào nút menu.
- Giữ đăng xuất dưới dạng hành động rõ ràng với trạng thái chờ xử lý và dự phòng cục bộ.

### tiêu đề

- Giữ kích hoạt hồ sơ và nhãn vai trò.
- Xóa điều khiển tìm kiếm chung khỏi tiêu đề được chia sẻ vì không có tìm kiếm trên nhiều hệ thống
  hợp đồng được phê duyệt. Giữ các điều khiển tìm kiếm cục bộ cho các trang sở hữu dữ liệu có thể
  tìm kiếm được.
- Không hiển thị tên người dùng trống trong khi đang tải dữ liệu hồ sơ; hiển thị một trình giữ chỗ ổn định
  hoặc mã định danh tài khoản được lưu trữ.

### trang khung

- Sử dụng một mẫu tiêu đề trang có tiêu đề, văn bản hỗ trợ và hành động.
- Trên chiều rộng hẹp, xếp chồng các hành động bên dưới tiêu đề và chỉ đặt các hành động chính có chiều rộng đầy đủ
  khi cần thiết.
- Giữ độ rộng nội dung có thể đọc được trong khi cho phép các bảng và báo cáo cuộn có chủ ý.

## 8. Phần 2: Xác thực và OTP

### Đăng ký

- Thêm chỉ báo hai bước hiển thị: `1. Account details` và `2. Verify email`.
- Nhóm các trường thành các phần hợp lý và hiển thị các yêu cầu về mật khẩu trước khi gửi.
- Sử dụng lỗi trường nội tuyến cho lỗi định dạng và lỗi khớp; sử dụng thông báo cấp trang cho API
  thất bại hoặc xung đột tài khoản.
- Giữ tất cả các trường không bí mật sau khi yêu cầu không thành công.
- Vô hiệu hóa hành động gửi trong khi chờ xử lý và hiển thị nhãn xác định, chẳng hạn như
  `Creating account...`.
- Giải thích rằng việc xác minh yêu cầu hộp thư đến thực sự mà không để lộ thông tin nội bộ của nhà cung cấp.

### Xác minh OTP

- Tập trung đầu vào OTP khi bước xác minh mở ra.
- Sử dụng trường OTP dạng số, có độ dài cố định với ví dụ hiển thị và hỗ trợ dán.
- Hiển thị email đích bị che và thông báo hết hạn ngắn.
- Thêm thời gian hồi chiêu gửi lại với thời gian còn lại hiển thị và hành động `Resend code` rõ ràng.
- Cung cấp `Change email` hoặc `Back to account details` mà không làm mất dữ liệu biểu mẫu an toàn.
- Khi thành công, hãy hiển thị một hành động tiếp theo rõ ràng: `Go to sign in`.

### Đăng nhập và phục hồi

- Sử dụng lại cùng một trường, mẫu cảnh báo, mẫu đang chờ xử lý và mẫu liên kết khi đăng ký.
- Giải thích thông tin xác thực không hợp lệ mà không tiết lộ sự tồn tại của tài khoản.
- Đảm bảo đường dẫn quên mật khẩu có trạng thái hoàn thành rõ ràng và không đi vào ngõ cụt.

## 9. Phần 3: Các mẫu trang hoạt động

Tạo hoặc sử dụng lại các nguyên thủy được chia sẻ thay vì các biến thể dành riêng cho trang:

- `PageHeader`: tiêu đề, bối cảnh, hành động.
- `StatusNotice`: thông tin, cảnh báo, lỗi và thành công với tùy chọn thử lại.
- `LoadingBlock`: khung ổn định hoặc trạng thái tiến trình không thay đổi bố cục.
- `EmptyState`: giải thích lý do tại sao danh sách trống và đưa ra hành động tiếp theo có liên quan.
- `DataToolbar`: hành vi tìm kiếm, bộ lọc, tab và đặt lại.
- `DataTable`: bàn để bàn có hàng/thẻ trình bày di động.
- `ConfirmAction`: xác nhận rõ ràng về việc phê duyệt, trả sách, hủy và thanh toán.
- `Toast`: xác nhận ngắn hạn cho các hành động đã hoàn thành, được ghép nối với trạng thái nội tuyến khi
  kết quả quan trọng đối với trang hiện tại.

Trước tiên, hãy áp dụng những mô hình này vào việc vay mượn, đặt chỗ, kiểm kê, khoản phạt và báo
cáo. Không thay đổi tính toán kinh doanh hoặc kiểm tra vai trò trong khi áp dụng các mẫu trình bày.

## 10. Phần 4: Thẻ đáp ứng và khả năng tiếp cận

- Xác minh chiều rộng 1440px, 1024px, 768px và 390px cho lớp vỏ xác thực và được bảo vệ.
- Xác minh rằng không có văn bản, nút, nội dung bảng hoặc hộp thoại nào chồng chéo hoặc tràn bất ngờ.
- Xác minh thứ tự bàn phím, tiêu điểm hiển thị, hành vi thoát cho menu/hộp thoại và tiêu điểm
  phục hồi sau khi đóng lớp phủ.
- Xác minh nhãn và tên có thể truy cập cho các nút biểu tượng và điều khiển điều hướng.
- Xác minh hành vi giảm chuyển động cho các chuyển tiếp trang trí và khung xương.
- Xác minh thông báo lỗi được liên kết với các điều khiển biểu mẫu có liên quan.

## 11. Xử lý dữ liệu và lỗi

- Giữ chuẩn hóa lỗi API trong lớp API hiện có.
- Ánh xạ các lỗi xác thực, xung đột, ủy quyền và mạng đã biết tới bản sao hướng tới người dùng.
- Giữ các lỗi máy chủ không xác định chung nhưng có thể xử lý được: thử lại, kiểm tra kết nối hoặc
  liên hệ với thủ thư tùy theo ngữ cảnh.
- Không bao giờ hiển thị dấu vết bộ công nghệ thô, thông báo SQL, lỗi SMTP, mã thông báo hoặc thông tin xác thực.
- Không sử dụng các cập nhật lạc quan cho các hành động mượn, trả sách, đặt chỗ, khoản phạt hoặc đóng vai trò
  trừ khi hành vi hoàn tác được thực hiện rõ ràng.

## 12. Tiêu chí chấp nhận

Mỗi tiêu chí là một kiểm thử chấp nhận có thể xác minh được của con người, tuân theo hướng dẫn Cho
trước khi nào của cẩm nang:

- `AC-UX-001`: Cấp cho người dùng mới có hộp thư đến thực khi họ gửi đăng ký hợp lệ
  chi tiết, thì giao diện người dùng sẽ hiển thị bước 2, tập trung vào trường OTP và giữ lại email bị ẩn.
- `AC-UX-002`: Cung cấp thông tin chi tiết không hợp lệ hoặc lỗi đăng ký có thể khôi phục được khi gửi
  không thành công thì các giá trị biểu mẫu an toàn vẫn giữ nguyên và thông báo cho người dùng biết
  phải làm gì tiếp theo.
- `AC-UX-003`: Đưa ra bước OTP, khi người dùng gửi mã không hợp lệ hoặc yêu cầu
gửi lại thì giao diện người dùng sẽ hiển thị kết quả, ngăn các hành động gửi lại trùng lặp và duy
trì bối cảnh xác minh.
- `AC-UX-004`: Với khung nhìn 390px, khi người dùng mở một trang được bảo vệ thì menu,
  tiêu đề trang, hành động chính và nội dung trang vẫn có thể truy cập được mà không bị chồng chéo
  theo chiều ngang.
- `AC-UX-005`: Cho một trang được hỗ trợ bởi API, khi nó đang tải, trống, thành công hoặc
  không thành công thì trạng thái khớp sẽ hiển thị và bố cục vẫn ổn định.
- `AC-UX-006`: Được cung cấp một vai trò có điều hướng hạn chế, khi người dùng mở lớp bao,
  khi đó chỉ điều hướng được phép mới hiển thị và mục hoạt động khớp với URL.
- `AC-UX-007`: Chỉ tương tác bằng bàn phím, khi người dùng di chuyển qua điều hướng,
  biểu mẫu, menu, hộp thoại và hành động, sau đó tiêu điểm sẽ hiển thị và các điều khiển có thể hoạt
  động được.
- `AC-UX-008`: Với các tạo phẩm kiểm thử và khác biệt cuối cùng, khi cổng xác thực chạy, sau đó
không có bí mật, mã thông báo hoặc dữ liệu cá nhân mới nào được giới thiệu và hợp đồng kinh
doanh/API hiện tại không thay đổi.

## 13. Kế hoạch xác minh

- Chạy kiểm thử giao diện người dùng được nhắm mục tiêu cho từng bề mặt đã thay đổi.
- Chạy giao diện kiểm tra mã sau khi triển khai.
- Sử dụng độ bao phủ kiểm thử nhanh hiện có của trình duyệt cho các tuyến truy cập trực tiếp và bộ bảo vệ tuyến được bảo vệ.
- Ghi lại các bước kiểm tra thủ công để xác thực, điều hướng lớp bao, bố cục trên thiết bị di động và một đại diện
  quy trình làm việc mượn.
- Sử dụng `git diff --check` và kiểm tra sự khác biệt cuối cùng trước khi cam kết.

## 14. Lệnh triển khai

1. Mã thông báo được chia sẻ và vỏ ứng dụng.
2. Đăng ký xác thực, OTP, đăng nhập và khôi phục.
3. Trạng thái dữ liệu được chia sẻ và dọn dẹp trang hoạt động.
4. QA đáp ứng và bàn phím.
5. Triển khai theo từng giai đoạn và đánh giá sự chấp nhận của con người.

## 15. Quyết định mở

Cổng làm rõ đã giải quyết các quyết định mở ban đầu vào ngày 14-07-2026:

- `DEC-UX-001`: Xóa tìm kiếm tiêu đề chung không hoạt động. Tìm kiếm vẫn còn cục bộ
  trang sở hữu dữ liệu của nó.
- `DEC-UX-002`: `/home` nhận thức được vai trò: Thành viên thấy lượt mượn cá nhân/reservation
thông tin; Thủ thư/Quản trị viên nhìn thấy hàng đợi hoạt động và thông tin KPI được hợp đồng vai trò
hiện tại cho phép.
- `DEC-UX-003`: Các trang được bảo vệ sử dụng nhãn tiếng Việt một cách nhất quán. Số nhận dạng API,
  mã định danh mã nguồn và tên kiểm tra vẫn là tiếng Anh.
