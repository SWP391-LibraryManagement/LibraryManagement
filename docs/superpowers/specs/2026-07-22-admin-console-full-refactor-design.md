# Bảng điều khiển dành cho quản trị viên Thiết kế tái cấu trúc giao diện người dùng đầy đủ

Trạng thái: ĐƯỢC PHÊ DUYỆT BỞI HUMAN - 22-2026-07-07

> Bản sửa đổi được phê duyệt ngày 22-07-2026: `2026-07-22-admin-membership-review-integration-design.md` chỉ thay thế khóa điều hướng bảy mục nhập của tài liệu này và ranh giới FE04-bên ngoài-Quản trị viên. Quyền/thanh toán vẫn bị xóa và tất cả các quyết định tái cấu trúc khác vẫn có hiệu lực.

Ngày: 22-07-2026

Phạm vi: Cấu trúc giao diện người dùng và bản trình bày Bảng điều khiển dành cho quản trị viên FE11;
`FR-FE11-030..035`, `AC-FE11-016..019`, `NFR-FE11-UX-001..004`

## 1. Quyết định

Tái cấu trúc giao diện Bảng điều khiển dành cho quản trị viên FE11 thành một ứng dụng một tuyến
mô-đun trong khi vẫn duy trì phần máy chủ đã được phê duyệt, API, ủy quyền và hợp đồng kinh doanh.

- Mục nhập công khai URL vẫn là `/admin/users`.
- Phần Quản trị mặc định vẫn là Quản lý người dùng.
- Điều hướng hiển thị bảy phần được phê duyệt sau khi được con người đánh giá xác thực; mục Quyền riêng biệt sẽ bị xóa trong khi Quản lý vai trò vẫn có sẵn trong Quản lý người dùng.
- Mỗi phần trở thành một mô-đun giao diện người dùng độc lập.
- Không có điểm cuối máy chủ, tải trọng yêu cầu, phản hồi DTO, quy tắc vai trò hoặc thay đổi lược đồ cơ sở dữ liệu.
- Trình tái cấu trúc có thể cải thiện bản sao hiển thị, cách trình bày phản hồi, trạng thái tải/lỗi/trống và khả năng truy cập mà không thay đổi những gì Quản trị viên được ủy quyền thực hiện.

Đây là công cụ tái cấu trúc lớp bao dưới Hybrid SDD + ADD. Xác thực cốt lõi, ủy quyền, vòng đời, quyền
sở hữu quyền, yêu cầu bất biến, biên tập kiểm tra và ranh giới quyền sở hữu FE07/FE12 vẫn không thay
đổi.

## 2. Mô tả vấn đề và bằng chứng

`frontend/src/page/UserManagement.jsx` hiện tại kết hợp điều hướng, tải dữ liệu, bộ lọc, bảng, biểu
đồ, phương thức, thao tác ghi, phần ẩn kế thừa và hơn 400 dòng CSS nội tuyến trong một tệp gồm hơn 3.000
dòng.

Đánh giá giai đoạn Azure trực tiếp vào ngày 22 tháng 07 năm 2026 đã tái hiện các vấn đề trình bày sau:

- Biểu đồ trang tổng quan hiển thị tất cả các danh mục được trả về, bao gồm các hàng có giá trị bằng 0, điều này tạo ra các nhãn chồng chéo và biểu đồ đường phẳng gây hiểu nhầm.
- Bảng người dùng tám cột sử dụng bố cục cố định và ngắt từ linh hoạt ở các chiều rộng phổ biến của máy tính xách tay.
- Thiết bị di động giữ chiều rộng bảng tối thiểu 980px, do đó, quy trình làm việc của người dùng chính yêu cầu cuộn ngang và ẩn các hành động.
- Hành động của người dùng chỉ mang tính biểu tượng và phụ thuộc vào tiêu đề di chuột để biết ý nghĩa.
- Các ô ma trận quyền sử dụng cùng một cách trình bày màu xanh lục cho cả giá trị được phép và bị từ chối.
- Quyền hiển thị các tên nguồn nội bộ như `FE11` và `FE12`.
- Các hàng kiểm tra hiển thị mã hành động thô và thanh bộ lọc nén tìm kiếm, hành động, tác nhân, hai ngày và hai nút thành một hàng dày đặc.
- Đánh giá đã được xác thực cho thấy cột Kiểm tra chi tiết an toàn sẽ mở rộng mọi hàng ngay cả khi chi tiết là phụ và bảng Quản lý người dùng vẫn yêu cầu cuộn ngang ở độ rộng thu phóng/máy tính xách tay phổ biến.
- Dữ liệu nhập ngày gốc không có nhãn hiển thị liên tục nên trình giữ chỗ của trình duyệt trở thành hướng dẫn ngày duy nhất.
- Đường dẫn hiển thị `membership` và `payments` ẩn vẫn tồn tại bên trong Bảng điều khiển dành cho quản trị viên mặc dù cả hai đường dẫn này đều không nằm trong điều hướng được phê duyệt.

Nguyên nhân cốt lõi là cấu trúc giao diện người dùng và quy tắc trình bày, không phải dữ liệu máy
chủ hoặc lỗi ủy quyền.

## 3. Phạm vi được phê duyệt

### Trong phạm vi

- Chia Bảng điều khiển dành cho quản trị viên thành một khung, các nguyên mẫu trình bày được chia sẻ và bảy mô-đun Quản trị được hiển thị độc lập cùng với hành động điều hướng Trang chủ.
- Di chuyển Bảng điều khiển dành cho quản trị viên CSS từ JSX nội tuyến sang biểu định kiểu chuyên dụng.
- Giữ nguyên lộ trình hiện tại và bảy mục nhập thanh bên đã được phê duyệt theo thứ tự hiện tại của chúng; chỉ xóa mục nhập thanh bên Quyền và giữ nguyên chính sách cấp phép cơ bản/API cộng với quy trình làm việc Quản lý vai trò.
- Thiết kế lại biểu đồ Trang tổng quan để trình bày tập trung vào quyết định, bao gồm năm giới hạn hàng đầu và trạng thái trống thực sự.
- Giữ một bảng dành cho người dùng trên máy tính để bàn và hiển thị danh sách thẻ người dùng trên thiết bị di động bên dưới điểm ngắt phản hồi.
- Thêm nhãn hiển thị vào các hành động trong hàng trong khi vẫn giữ nguyên chỉnh sửa, vai trò, chi tiết và hủy kích hoạt trình xử lý.
- Bản địa hóa hành động kiểm tra/trình bày chi tiết mà không thay đổi giá trị API thô.
- Thêm nhãn bộ lọc liên tục và bố cục bộ lọc đáp ứng.
- Làm cho các giá trị cho phép/từ chối quyền trở nên khác biệt về mặt trực quan và ngữ nghĩa.
- Bảo toàn dữ liệu thành công cuối cùng trong khi hiển thị trạng thái làm mới và thử lại không chặn.
- Xóa trạng thái thanh toán/thành viên Bảng điều khiển dành cho quản trị viên không thể truy cập, đường dẫn nhập và hiển thị.
- Cập nhật kế hoạch, nhiệm vụ, nhật ký thay đổi, kiểm tra và bằng chứng xác thực của FE11 cho bộ tái cấu trúc.

### Ngoài phạm vi

- Các chức năng, quyền, vai trò, tuyến đường hoặc điểm cuối máy chủ mới của Quản trị viên.
- Các thay đổi đối với vòng đời tài khoản, thứ tự thay đổi vai trò, bảo vệ Quản trị viên cuối cùng, biên tập kiểm tra, hành động yêu cầu hoặc yêu cầu bất biến ở trạng thái đầu cuối.
- Các thay đổi đối với chức năng Thành viên FE04 bên ngoài Bảng điều khiển dành cho quản trị viên.
- Các thay đổi đối với chức năng thanh toán/khoản phạt của FE09 hoặc các trang chuẩn của nó.
- Các thay đổi đối với tính toán báo cáo FE12 hoặc API FE12.
- Di chuyển cơ sở dữ liệu hoặc thay đổi lược đồ.
- Thay thế các biểu tượng React, Bootstrap, Lucide hoặc bộ công nghệ giao diện người dùng đã được phê duyệt.
- Tạo URL riêng cho từng phần Quản trị viên.

## 4. Kiến trúc

`UserManagement.jsx` trở thành mục tương thích hiển thị `AdminConsolePage`. Do đó, lộ trình ứng dụng
và chuyển hướng đăng nhập vẫn ổn định trong khi quá trình triển khai chuyển sang các tệp tập trung.

```text
frontend/src/page/admin/
├── AdminConsolePage.jsx
├── adminNavigation.js
├── components/
│   ├── AdminShell.jsx
│   ├── AdminPageHeader.jsx
│   ├── AdminFilterBar.jsx
│   ├── AdminDateField.jsx
│   ├── AdminActionButton.jsx
│   ├── AdminEmptyState.jsx
│   └── AdminPagination.jsx
├── dashboard/
│   ├── AdminDashboardSection.jsx
│   └── adminDashboardViewModel.js
├── library/AdminLibrarySection.jsx
├── circulation/AdminCirculationSection.jsx
├── requests/AdminRequestsSection.jsx
├── users/AdminUsersSection.jsx
├── permissions/AdminPermissionsSection.jsx
├── audit/
│   ├── AdminAuditSection.jsx
│   └── adminAuditPresentation.js
└── admin-console.css
```

Các tiện ích tập trung hiện tại vẫn được giữ nguyên khi chúng đã có trách nhiệm ổn định, bao gồm
thành phần quyền, xuất yêu cầu, thống kê người dùng, trình bảo vệ yêu cầu, trình trợ giúp truy vấn
người dùng và nhãn tiếng Việt được chia sẻ.

### quyền sở hữu

- `AdminConsolePage`: quyền truy cập Quản trị viên được lưu trữ, chuyển hướng không được xác thực/bị cấm, phần hoạt động, xác nhận đăng xuất, định tuyến làm mới cấp cao nhất và trạng thái cập nhật được chia sẻ.
- `AdminShell`: điều hướng đáp ứng, trình bày thương hiệu/phiên và hợp đồng thanh bên bảy mục.
- Các mô-đun phần: các cuộc gọi, bộ lọc, phân trang, lựa chọn và hiển thị API dành riêng cho từng phần.
- Các thành phần được chia sẻ: chỉ trình bày; họ không gọi API chức năng hoặc quy tắc nghiệp vụ riêng.
- Tiện ích xem mô hình/trình bày: các phép biến đổi thuần túy có thể được kiểm tra đơn vị mà không cần hiển thị React.

## 5. Hệ thống thị giác

Bộ tái cấu trúc giữ lại danh tính thư viện hiện có thay vì thay thế nó bằng một bảng thông tin chung
màu xanh lam.

### Mã màu

- Mực thư viện: `#2A2118`
- Bề mặt giấy: `#FFFDF8`
- Canvas đọc: `#FAF6EF`
- Điểm nhấn bằng đồng thau: `#A87532`
- Thành công: `#18794E`
- Nguy hiểm: `#B42318`
- Văn bản bị tắt tiếng: `#6B6153`
- Bộ chia: `#E7DDCA`

### kiểu chữ

- `var(--heading)` được chia sẻ vẫn là mặt hiển thị hạn chế cho các tiêu đề trang và bảng điều khiển.
- `var(--sans)` được chia sẻ vẫn giữ nguyên thân máy và mặt điều khiển.
- Số lượng, ngày tháng, địa chỉ IP và phân trang sử dụng các chữ số dạng bảng nếu được hỗ trợ.

### Chữ ký

Bảng điều khiển dành cho quản trị viên sử dụng mẫu sổ cái hoạt động: bề mặt giấy yên tĩnh, quy tắc
phần rõ ràng, trạng thái được gắn nhãn nhỏ gọn và các hàng dữ liệu được tối ưu hóa để quét. Thẻ
trang trí được giới hạn ở thông tin hỗ trợ quyết định.

## 6. Điều hướng và lớp bao đáp ứng

### Máy tính để bàn

- Thanh bên cố định 248px chứa thương hiệu, bảy mục nhập được phê duyệt, tài khoản hiện tại và đăng xuất.
- Nội dung chính sử dụng chiều rộng giới hạn có thể đọc được với bảng dữ liệu linh hoạt.
- Trạng thái của phần hiện tại vẫn hiển thị thông qua nền, văn bản, màu biểu tượng và ngữ nghĩa `aria-current`.

### Máy tính bảng di động và hẹp

- Thanh bên trở thành một tiêu đề nhỏ gọn với nút Menu.
- Nội dung menu mở ra dưới dạng bảng điều hướng có thể loại bỏ; tám mục không được hiển thị vĩnh viễn dưới dạng lưới hai cột.
- Việc mở và đóng menu vẫn duy trì tiêu điểm của bàn phím và hỗ trợ Escape.
- Khối người dùng/phiên vẫn có sẵn bên trong bảng điều khiển.

## 7. Thiết kế phần

### 7.1 Trang tổng quan

- Giữ năm giá trị tóm tắt hoạt động đã được phê duyệt.
- `Top sách được mượn` hiển thị tối đa năm hàng có giá trị dương.
- Biểu đồ quá hạn và trả sách hôm nay hiển thị tối đa năm hàng có giá trị dương.
- Tập dữ liệu không có giá trị dương là trạng thái trống, không phải biểu đồ đường số 0.
- Nhãn biểu đồ được cắt bớt một cách trực quan nhưng vẫn giữ lại nhãn và chú giải công cụ có thể truy cập đầy đủ.
- Danh sách bên dưới mỗi biểu đồ vẫn là bề mặt đọc giá trị chính xác; biểu đồ hỗ trợ so sánh.

### 7.2 Quản lý người dùng

- Máy tính để bàn giữ một bảng với thông tin đã được phê duyệt: danh tính/email người dùng, tên người dùng, số điện thoại, vai trò, trạng thái, ngày tạo, lần đăng nhập cuối cùng và hành động.
- Độ rộng của máy tính xách tay ưu tiên danh tính, vai trò, trạng thái, lần đăng nhập cuối cùng và hành động; các trường phụ sử dụng chức năng cắt bớt có kiểm soát thay vì ngắt từng ký tự.
- Thiết bị di động hiển thị một thẻ cho mỗi người dùng với danh tính, trạng thái, vai trò, lần đăng nhập cuối cùng và hàng hành động được gắn nhãn.
- `Chỉnh sửa`, `Phân quyền` và `Vô hiệu hóa` sử dụng biểu tượng cùng với văn bản hiển thị.
- Các hành động phá hoại bị vô hiệu hóa bao gồm tiêu đề giải thích và kiểu dáng bị vô hiệu hóa.
- Nhấp vào thẻ/hàng tiếp tục mở luồng chi tiết chính thức.

### 7.3 Yêu cầu

- Tìm kiếm, trạng thái, phạm vi ngày, Áp dụng, Đặt lại khi hoạt động và Xuất được nhóm trong thanh bộ lọc phản hồi có gắn nhãn.
- `Từ ngày` và `Đến ngày` vẫn giữ nguyên dữ liệu đầu vào ngày gốc để xác thực và trợ năng, với các nhãn hiển thị liên tục.
- Các hàng đang chờ xử lý giữ `Xử lý`; các hàng đầu cuối giữ `Chi tiết`.
- Không có điểm cuối phê duyệt/từ chối do quản trị viên sở hữu nào được giới thiệu.

### 7.4 Quyền

- Xóa mục nhập Quyền độc lập khỏi điều hướng thanh bên trên máy tính để bàn và thiết bị di động.
- Giữ nguyên thành phần quyền chỉ đọc hiện có, bộ điều hợp API, chính sách máy chủ và các kiểm thử phái sinh tập trung; việc chỉnh sửa này không làm thay đổi việc ủy ​​quyền vai trò hoặc quy trình làm việc Quản lý vai trò trong Quản lý người dùng.
- Thay thế `Ma trận FE11` bằng `Dữ liệu phân quyền`.
- Thay thế `Thống kê FE12` bằng `Thống kê tài khoản theo vai trò`.
- Giải thích rằng tổng số vai trò có thể vượt quá số tài khoản duy nhất vì một tài khoản có thể giữ nhiều vai trò.
- Các ô được phép sử dụng kiểm tra thành công và `Có`; các ô bị từ chối sử dụng dấu gạch ngang trung tính và `Không`.
- Tiêu đề bảng vẫn hiển thị trong khi quét một ma trận dài nơi trình duyệt hỗ trợ định vị cố định.
- Chế độ xem vẫn ở chế độ chỉ đọc.

### 7.5 Nhật ký kiểm tra

- Giữ trang `q`, `action`, `actorId`, `from`, `to` chuẩn và giới hạn các giá trị API.
- Trình bày các lựa chọn hành động đã biết với nhãn tiếng Việt trong khi tiếp tục gửi các giá trị hành động thô chuẩn; duy trì đầu vào chuẩn văn bản tự do cho các hành động chưa được ánh xạ.
- Ánh xạ các khóa chi tiết an toàn đã biết vào nhãn tiếng Việt trong khi vẫn giữ các khóa không xác định trong danh sách cho phép dưới dạng văn bản.
- Sử dụng nhãn nhất quán cho hành động, ID tác nhân và cả hai ngày.
- Tách các trường và hành động của bộ lọc thành bố cục hai hàng đáp ứng thay vì một hàng nén duy nhất.
- Luôn cung cấp các chi tiết an toàn thông qua tiết lộ rõ ràng trên mỗi hàng để siêu dữ liệu thứ cấp không thống trị bảng.
- Kiểm tra trạng thái tải, lỗi, trống và lọc trống vẫn khác biệt.
- Các hàng kiểm tra vẫn ở chế độ chỉ đọc và tiếp tục chỉ hiển thị DTO được lồng an toàn.

### 7.6 Thư viện và lưu hành

- Giữ nguyên ranh giới quyền sở hữu của Quản trị viên chỉ đọc hiện có.
- Sử dụng lại các mẫu tiêu đề, trạng thái, bộ lọc, bảng/thẻ, trạng thái trống và phân trang được chia sẻ.
- Không có bộ chuyển đổi thao tác ghi FE05 hoặc FE07 trùng lặp nào được thêm vào.

## 8. Các trạng thái đang tải, trống, lỗi và thao tác ghi

- Tải ban đầu không có dữ liệu sử dụng khung phần hoặc trạng thái tải ở giữa.
- Làm mới bằng dữ liệu thành công cuối cùng giúp dữ liệu hiển thị và đánh dấu phần đó là đang cập nhật.
- Lỗi làm mới sẽ bảo toàn dữ liệu thành công cuối cùng, hiển thị thông báo nội tuyến cụ thể và hiển thị `Thử lại`.
- Phản hồi trống thành công sẽ giải thích dữ liệu nào sẽ khiến phần này không trống.
- Phản hồi trống được lọc đặt tên cho bối cảnh tìm kiếm/bộ lọc đang hoạt động và cung cấp `Xóa lọc`.
- thao tác ghi giữ lại hành vi xác nhận và đối chiếu máy chủ hiện có.
- Bộ bảo vệ phản hồi cũ vẫn hoạt động cho mọi trình tải không đồng bộ.
- Không có dữ liệu demo hoặc dự phòng được phát minh nào được hiển thị sau lỗi API.

## 9. Khả năng tiếp cận và tương tác

- Tất cả các nút biểu tượng đều nhận được văn bản hiển thị hoặc nhãn có thể truy cập được; hành động phá hoại không chỉ được truyền đạt bằng màu sắc.
- Tiêu điểm của bàn phím được tạo kiểu rõ ràng cho các liên kết, nút, bộ lọc, phân trang, điều khiển menu, phương thức và ngăn kéo.
- Tương tác theo phương thức và menu di động hỗ trợ Escape và trả sách tiêu điểm cho trình kích hoạt.
- Ý nghĩa trạng thái, vai trò và quyền có sẵn dưới dạng văn bản.
- Kích thước mục tiêu tương tác tối thiểu là 40px trên bố cục cảm ứng.
- Chuyển động bị giới hạn ở mục nhập menu/phương thức và phản hồi di chuột/tiêu điểm và bị tắt trong `prefers-reduced-motion: reduce`.
- Các bảng giữ lại các tiêu đề ngữ nghĩa; thẻ di động sử dụng các trường được gắn nhãn thay vì sắp xếp lại đánh dấu bảng một cách trực quan.

## 10. Ranh giới loại bỏ di sản

Công cụ tái cấu trúc của Bảng điều khiển dành cho quản trị viên sẽ loại bỏ các nội dung nhập, trạng
thái, trình tải, siêu dữ liệu phần, khối kết xuất và logic xem xét tinh chỉnh của bộ nhớ cục bộ
không thể truy cập vào `membership` và `payments`.

Việc xóa này không xóa hoặc sửa đổi:

- FE04 thành phần thành viên, tuyến đường, API hoặc màn hình phê duyệt chuẩn.
- FE09 hồ sơ phạt, thu tiền, từ bỏ, hủy bỏ hoặc sàng lọc thanh toán.
- Bất kỳ điểm cuối máy chủ hoặc bản ghi cơ sở dữ liệu nào.

Điều hướng Quản trị viên bảy mục đã được phê duyệt vẫn là phạm vi có thẩm quyền; chính sách cấp phép
và ủy quyền Quản lý vai trò không thay đổi.

## 11. Ranh giới dữ liệu và bảo mật

- Xác thực được lưu trữ và kiểm tra vai trò vẫn cần thiết trước khi tải dữ liệu được bảo vệ.
- Ủy quyền máy chủ vẫn có thẩm quyền.
- Bộ điều hợp API hiện tại và DTO an toàn vẫn không thay đổi.
- Kiểm tra giá trị thô chỉ được chuyển đổi để hiển thị; bộ lọc vẫn gửi giá trị thô chuẩn.
- Không có bí mật, mã thông báo, hàm băm mật khẩu, giá trị phiên thô hoặc PII chưa được phê duyệt nào được thêm vào giao diện người dùng.
- Không có chuyển đổi phía khách hàng nào tạo ra hoặc thay đổi quyết định kinh doanh.

## 12. Chiến lược kiểm thử

### Kiểm tra đơn vị

- Mô hình chế độ xem bảng điều khiển giới hạn biểu đồ ở năm hàng dương và trả về tập dữ liệu trống cho đầu vào hoàn toàn bằng 0.
- Bản trình bày kiểm toán ánh xạ các mã/chi tiết đã biết trong khi vẫn bảo toàn các giá trị an toàn chưa biết.
- Việc trình bày quyền tạo ra các trạng thái được phép/từ chối riêng biệt.
- Điều hướng xuất chính xác bảy mục đã được phê duyệt theo thứ tự và không bao gồm Quyền.

### Kiểm tra hợp đồng và thành phần giao diện

- `/admin/users` vẫn hiển thị Bảng điều khiển dành cho quản trị viên và mở Quản lý người dùng theo mặc định.
- Xác thực và ủy quyền của Quản trị viên bảo vệ mọi tải được bảo vệ.
- Mỗi phần chỉ gọi chủ sở hữu API đã được phê duyệt.
- Chế độ xem trên bảng trên máy tính để bàn và trên thiết bị di động của người dùng hiển thị cùng một dữ liệu và hành động được phê duyệt.
- Không có đường dẫn quản trị thành viên/thanh toán ẩn và mã đánh giá thanh toán lưu trữ cục bộ.
- Các trạng thái đang tải, lỗi, trống, trống đã lọc, thử lại và thành công cuối cùng vẫn mang tính quyết định.
- Các kiểm thử vòng đời, vai trò, yêu cầu, kiểm tra, cấp phép, xuất và phản hồi cũ hiện tại vẫn giữ nguyên màu xanh.

### Chấp nhận trình duyệt

- Máy tính để bàn/máy tính xách tay: 1280x720, 1366x768, 1440x900 và khung nhìn máy tính để bàn lớn thông thường.
- Di động: 390x844.
- Điều hướng, Trang tổng quan, Quản lý người dùng, Yêu cầu và Kiểm tra được xem xét theo chiều rộng của máy tính để bàn/máy tính xách tay và thiết bị di động; Quản lý vai trò được thực hiện từ Quản lý người dùng.
- Xác minh không có tràn trang ngang, không có nhãn biểu đồ không thể đọc được, không có hành động chính bị ẩn, tiêu điểm bàn phím hiển thị và hỗ trợ giảm chuyển động.
- Thực hiện các phương thức tạo/chỉnh sửa/vai trò mà không gửi các thay đổi có hại trong quá trình xem xét trực quan.

### Cổng xác thực

- Các kiểm thử giao diện người dùng RED-GREEN tập trung.
- Kiểm tra giao diện người dùng đầy đủ, tìm lỗi mã nguồn và xây dựng sản xuất.
- Các kiểm thử ranh giới máy chủ tập trung cộng với bộ máy chủ đầy đủ vì quyền sở hữu API phải không thay đổi.
- truy vết, kiểm tra triển khai và vệ sinh khác biệt.
- Hướng dẫn môi trường tiền sản xuất Azure đã được xác thực sau khi triển khai.
- Đánh giá của con người vẫn tách biệt với bằng chứng giao diện thích ứng tự động.

## 13. Trình tự thực hiện

1. Thêm bản ghi quản trị/nhiệm vụ cho bộ tái cấu trúc đã được phê duyệt mà không thay đổi các yêu cầu kinh doanh của FE11.
2. Thêm các kiểm thử trình bày và mô hình xem thuần túy, đồng thời quan sát các lỗi dự kiến.
3. Thêm cấu trúc tệp mới, các nguyên gốc được chia sẻ và biểu định kiểu trong khi vẫn giữ lại lộ trình nhập cũ.
4. Di chuyển lớp bao và điều hướng.
5. Di chuyển Trang tổng quan và xác minh biểu đồ/hành vi trống.
6. Di chuyển Quản lý người dùng và xác minh tính tương đương trên máy tính để bàn/thiết bị di động.
7. Di chuyển yêu cầu, quyền và kiểm tra.
8. Di chuyển các phần Thư viện và Lưu hành chỉ đọc.
9. Xóa mã Bảng điều khiển dành cho quản trị viên/thanh toán không thể truy cập được.
10. Chạy xác thực hoàn toàn tự động, chấp nhận trình duyệt, triển khai Azure môi trường tiền sản xuất và kiểm thử nhanh được xác thực.

Mỗi bước di chuyển phải giữ cho ứng dụng có thể xây dựng được và duy trì ranh giới API hiện tại.

## 14. Rủi ro và Kiểm soát

| Rủi ro | Kiểm soát |
| --- | --- |
| Refactor thay đổi hành vi kinh doanh một cách vô tình | Bảo quản bộ điều hợp API và di chuyển mã từng phần sau các kiểm thử hợp đồng tập trung. |
| Tải ủy quyền xảy ra trước khi chuyển hướng | Duy trì các hoạt động kiểm tra quyền truy cập được lưu trữ trong `AdminConsolePage` và giữ lại các kiểm tra hồi quy tải được bảo vệ. |
| Thẻ di động và bàn để bàn khác nhau | Hiển thị cả hai từ cùng một đối tượng người dùng và trình xử lý hành động được chuẩn hóa. |
| Kiểm tra các thay đổi nội địa hóa giá trị bộ lọc | Tách các giá trị chuẩn thô khỏi nhãn trình bày. |
| Xóa Quyền khỏi điều hướng sẽ xóa quản lý vai trò | Giữ lại hành động vai trò Quản lý người dùng và các kiểm thử hiện có của nó; chỉ thay đổi hợp đồng điều hướng được chia sẻ. |
| Loại bỏ mã ẩn ảnh hưởng đến chức năng chuẩn | Chỉ xóa các tham chiếu trong Bảng điều khiển dành cho quản trị viên; chạy hồi quy giao diện người dùng FE04/FE09. |
| Việc viết lại một lần lớn sẽ không thể xem lại được | Sử dụng trình tự di chuyển tăng dần có dấu kiểm màu xanh lục sau mỗi mô-đun. |
| Hiện tại trôi dạt điều hướng đã được phê duyệt | Xuất một định nghĩa điều hướng và giữ lại kiểm thử theo thứ tự chính xác. |

## 15. Tiêu chí chấp nhận

- `/admin/users` vẫn là tuyến Bảng điều khiển dành cho quản trị viên duy nhất và mở Quản lý người dùng theo mặc định.
- Bảng điều khiển chứa chính xác bảy mục điều hướng đã được phê duyệt và không hiển thị Quyền.
- Không có thay đổi về máy chủ, API, cơ sở dữ liệu, bảo mật hoặc quy tắc nghiệp vụ.
- Trang tổng quan không bao giờ hiển thị biểu đồ dạng đường hoàn toàn bằng 0 và hiển thị không quá năm hàng được vẽ trên mỗi biểu đồ.
- Ở 1280px và 1366px, Quản lý người dùng chuyển sang bản trình bày thẻ hiện có trước khi bảng 1040px yêu cầu cuộn ngang; bảng rộng vẫn có sẵn khi vùng nội dung có thể chứa nó.
- Với kích thước 390px, Quản lý người dùng sử dụng thẻ và trang không bị tràn ngang.
- Các thao tác của người dùng đều có nhãn tiếng Việt hiển thị.
- Các quyền phân biệt rõ ràng các giá trị được phép và bị từ chối, đồng thời không hiển thị nhãn triển khai FE11/FE12.
- Kiểm toán hiển thị nhãn hành động tiếng Việt trong khi vẫn giữ nguyên giá trị chuẩn để lọc và kiểm tra kỹ thuật.
- Kiểm tra giữ `q`, `action`, `actorId`, `from` và `to`; bộ lọc của nó được bọc sạch sẽ và các chi tiết an toàn chỉ mở theo yêu cầu.
- Điều khiển bộ lọc có nhãn liên tục và xếp chồng rõ ràng trên bố cục hẹp.
- Các trạng thái đang tải, lỗi, trống, trống đã lọc, thử lại và thành công cuối cùng là khác nhau.
- Mã thanh toán/thành viên Bảng điều khiển dành cho quản trị viên ẩn bị xóa mà không thay đổi hành vi chuẩn của FE04 hoặc FE09.
- Các kiểm thử tập trung/đầy đủ, tìm lỗi mã nguồn, xây dựng, truy vết, kiểm tra triển khai, chấp nhận trình duyệt trên máy tính để bàn/thiết bị di động và các kiểm thử nhanh phân đoạn Azure đều vượt qua trước khi xác nhận hoàn thành.

## 16. Cập nhật quản trị

Việc triển khai sẽ thêm nhóm tác vụ tái cấu trúc UX của Bảng điều khiển dành cho quản trị viên FE11
được giới hạn vào `PLAN.md` và `TASKS.md`, ghi lại trình tái cấu trúc hiển thị trong `CHANGELOG.md`
và tạo bản ghi xác thực trong `.sdd/reviews/`.

Các yêu cầu kinh doanh FE11 đã được phê duyệt vẫn không thay đổi. Bất kỳ nhu cầu nào được phát hiện
để sửa đổi API, quy tắc ủy quyền, lược đồ cơ sở dữ liệu hoặc kết quả kinh doanh sẽ dừng hoạt động
tái cấu trúc này và yêu cầu thay đổi thông số cốt lõi được phê duyệt riêng.
