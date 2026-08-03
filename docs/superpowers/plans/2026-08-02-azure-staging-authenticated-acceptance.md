# Kế hoạch triển khai chấp nhận được xác thực theo giai đoạn Azure

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Chứng minh hành vi lưu thông chéo, được xác thực của hệ thống môi trường tiền sản xuất
đã triển khai bằng bốn tài khoản tổng hợp dùng một lần, sau đó thu hồi/hủy kích hoạt mọi thiết bị cố
định trong khi vẫn lưu giữ lịch sử kiểm tra.

**Kiến trúc:** Khai thác toán tử cục bộ tạm thời tải lên tiện ích cố định Node tồn tại trong thời
gian ngắn thông qua API lệnh/API Kudu VFS đã được xác thực. Hành vi của sản phẩm được thực hiện
thông qua giao diện người dùng môi trường tiền sản xuất thực tế; SQL được giới hạn ở hạt giống,
thiết lập ngày đến hạn, kiểm tra ID chính xác và dọn dẹp. Không có khai thác, thông tin xác thực,
điểm cuối, quy trình làm việc hoặc thiết bị cố định nào vẫn hoạt động sau khi chạy.

**bộ công nghệ công nghệ:** Azure CLI, Azure App Service Kudu, Node.js 22, `mssql`, `bcrypt`,
Playwright/Chromium, React/Giao diện người dùng môi trường tiền sản xuất Vite, Express dàn API, SQL
Server, PowerShell trên Windows.

## Ràng buộc toàn cầu

- SHA cơ sở/đã triển khai phải là `e01585a9aa7d603daf932f7ac6459eaa0752746c`; thiết kế được phê duyệt là cam kết `944c584c4867cc1d8abfd992537d089e04468638`.
- Giao diện môi trường tiền sản xuất là `https://www.thuvienhub.io.vn`; API là `https://app-library-api-staging-nhat714.azurewebsites.net`.
- Mục tiêu Azure là nhóm tài nguyên `rg-library-staging`, ứng dụng `app-library-api-staging-nhat714`, máy chủ SQL `sql-library-staging-ea-nhat714`, cơ sở dữ liệu `LibraryManagementStaging`.
- Sử dụng chính xác bốn tài khoản `.invalid` tổng hợp: Thành viên A, Thành viên B, Thủ thư và Quản trị viên; mọi tài khoản đều nhận được một mật khẩu ngẫu nhiên trong thời gian chạy riêng biệt.
- Không bao giờ in, lưu giữ, chụp màn hình, cam kết hoặc gửi mật khẩu thô, mã thông báo, cookie, chuỗi kết nối, thông tin xác thực xuất bản hoặc tiêu đề ủy quyền. Băm mật khẩu chỉ có thể tồn tại trong hàng người dùng cơ sở dữ liệu và đầu vào hạt giống tồn tại trong thời gian ngắn sẽ bị xóa ngay sau hạt giống; họ không bao giờ nhập nhật ký, ảnh chụp màn hình, bằng chứng hoặc Git.
- Sử dụng một cuốn sách/bản sao dành riêng cho từng lần chạy. Các thao tác ghi SQL phải được tham số hóa và giới hạn ở ID tệp kê khai.
- Không có quyền truy cập sản xuất, điểm cuối ứng dụng mới, lược đồ, di chuyển, quy trình làm việc, vai trò, sự phụ thuộc hoặc hành vi sản phẩm.
- Quá trình dọn dẹp chạy trong `finally`; việc dọn dẹp chưa hoàn tất sẽ chặn việc đóng nhiệm vụ và bất kỳ lần chạy lại nào.
- thao tác ghi giai đoạn và khai thác tạm thời yêu cầu sự chấp thuận H1 của người dùng đối với kế hoạch này trước khi thực hiện.
- Không cam kết thay đổi bằng chứng/nhiệm vụ được tạo ra trước khi xem xét H2 kết hợp.

---

## Trạng thái thực thi — 2026-08-02

- Trạng thái: `STOPPED_BEFORE_STAGING_MUTATION`; kịch bản đã xác thực không được thực thi và không có tác vụ chấp nhận trực tiếp nào đủ điều kiện để kết thúc.
- Ba lần thử khởi động xác định đã được thực hiện. Hai cái đầu tiên dừng lại vì quá trình Windows Node không thể khởi chạy miếng chêm Azure CLI. Lệnh thứ ba dừng trước yêu cầu Kudu đầu tiên vì Azure trả về SCM URI chứa thông tin người dùng và trình tạo yêu cầu đã từ chối nó.
- Thông tin đăng nhập xuất bản chỉ được hiển thị ở đầu ra của công cụ tác vụ cục bộ trong quá trình xây dựng yêu cầu bị từ chối đó. Nó ngay lập tức được luân chuyển bằng hành động App Service `newpassword` và thông tin xác thực thay thế đã được xác minh mà không in giá trị của nó.
- Giờ đây, dây nịt sẽ loại bỏ các thành phần tên người dùng/mật khẩu khỏi SCM URI trước khi xây dựng bất kỳ yêu cầu nào. Kiểm tra sau sự cố chỉ đọc đã xác nhận ứng dụng web là `Running`, HTTPS-chỉ, `/health` là `ok` và `/home/data/staging-acceptance` không có (`404`).
- Không có người dùng tổng hợp, tư cách thành viên, cuốn sách, bản sao, lượt mượn, đặt chỗ, khoản phạt, thông báo, lịch kiểm tra, thời gian chạy Kudu hoặc tệp đầu vào hạt giống nào được tạo bởi những nỗ lực này.
- Cần phải có đánh giá H1 mới trước một lần thử thao tác ghi theo giai đoạn khác vì đã hết giới hạn ba lần thử được phê duyệt. Cho đến lúc đó, FE04-ADM05, FE04-CONV-002, FE11-UXR07, FE11-UXR08, FE11-UXR09, và FE11-PDO04 vẫn mở.

### Kết quả thử lại H1 mới

- Người dùng đã cấp H1 mới cho một lần thử chấp nhận giai đoạn bổ sung.
- Kiểm tra trước chỉ đọc đã đạt sau khi Azure SQL không máy chủ tiếp tục hoạt động bất đồng bộ: SHA `e01585a9aa7d603daf932f7ac6459eaa0752746c` đã triển khai, kiểm thử nhanh công khai `PASS`, cơ sở dữ liệu `Online`, Kudu Node `v18.17.1` và URL SCM đã được loại bỏ thông tin người dùng.
- Quá trình xác minh trước thao tác ghi đã ghi lại một lỗi kiểm tra phần máy chủ không thể tái tạo (`1174/1175`), sau đó bộ sở hữu bị cô lập đã vượt qua `73/73` và một lỗi cho phép chạy lại toàn bộ đã vượt qua phần máy chủ `1175/1175` cùng với giao diện người dùng `273/273` mà không cần thay đổi nguồn.
- Chạy `lms-acceptance-20260802-72e4f014` đã dừng trong `prepareRemoteRuntime`: Kudu trả về HTTP `504` trong khi giải nén `node_modules.tar.gz` đã triển khai. Tập lệnh cố định không được tải lên, `preflight`/`seed` không được gọi và không có hàng cơ sở dữ liệu tổng hợp nào được tạo.
- Trình trợ giúp dọn dẹp trong thời gian chạy không thể hoàn thành sau lệnh hết thời gian. Trình trợ giúp mục tiêu cố định được đặt riêng chỉ loại bỏ `/home/data/staging-acceptance`; cả đường dẫn thời gian chạy đó và trình trợ giúp bên ngoài đều trả về `404`. App Service vẫn là `Running`, cơ sở dữ liệu vẫn là `Online`, `/health` trả về `200` và một cuốn sách công khai đã đọc trả về `200`.
- Lệnh Playwright cục bộ tập trung cho FE04/FE11 đã thoát hoàn toàn với việc chuyển `2/2`. Điều này cung cấp bằng chứng thoát khỏi cục bộ mới nhưng không thay thế cho việc chấp nhận Môi trường tiền sản xuất Azure đã được xác thực.
- Không có nhiệm vụ chấp nhận Azure nào đủ điều kiện để kết thúc. Một lần thử trực tiếp khác yêu cầu một phương pháp thực thi được đánh giá mới nhằm tránh việc trích xuất toàn bộ kho lưu trữ đồng bộ thông qua thời gian chờ của lệnh Kudu.
- Chẩn đoán chỉ đọc đã xác nhận tồn tại `/home/site/wwwroot/migration-runtime/node_modules/mssql/package.json`. Khai thác bị bỏ qua đã được chuẩn bị bằng cách đặt `NODE_PATH` cho thời gian chạy đã triển khai đó và xóa bước trích xuất kho lưu trữ.

### Kết quả thử lại H1 không trích xuất

- Người dùng đã cấp một lần thử H1 cho phương pháp không trích xuất. Kiểm tra trước đã thành công: SHA đã triển khai khớp, Azure SQL tự động tiếp tục thành `Online`, kiểm thử nhanh công khai đạt và đường dẫn thời gian chạy/trợ giúp trước đó trả về `404`.
- mốc cơ sở cục bộ mới đã vượt qua `1175/1175` máy chủ, `273/273` giao diện người dùng và kiểm tra hợp đồng khai thác bị bỏ qua.
- Chạy `lms-acceptance-20260802-b4f7910a` đã chuẩn bị thời gian chạy không trích xuất, sau đó dừng trong quá trình cố định `preflight`; `seed` chưa bao giờ được gọi. Trình trợ giúp bên ngoài đã xóa thời gian chạy và chính nó, với cả hai đường dẫn đều trả về `404`.
- Nguyên nhân cốt lõi là khả năng tương thích thời gian chạy: Nút mặc định của Kudu là `v18.17.1`, trong khi `mssql 12.5.5` được triển khai yêu cầu Nút `>=18.19.0` và không thành công với `dc.tracingChannel is not a function`. Kiểm tra SQL chỉ đọc được tham số hóa đã trả về 0 người dùng và 0 bản sao cho ID chạy.
- Chẩn đoán chỉ đọc đã tìm thấy App Service Oryx Node `v22.22.2` và chứng minh rằng nó tải `mssql` đã triển khai. Giờ đây, bộ khai thác bị bỏ qua sẽ phát hiện ra mã nhị phân tương thích đó và sử dụng nó cho các pha cố định; các cuộc kiểm tra hợp đồng đã vượt qua `5/5` và các chuyến bay trước khi vận chuyển. Đường dẫn đã chuẩn bị này chưa được thực thi trực tiếp. Đừng chạy lại mà không có H1 mới.

### Kết quả thử lại Oryx Node 22 H1

- Người dùng đã cấp một lần thử H1 cho đường dẫn Oryx Node 22 đã chuẩn bị. Kiểm tra trước chỉ đọc đã đạt: nhánh chứa mốc cơ sở đã triển khai, không có khác biệt về sản phẩm/phụ thuộc, hợp đồng khai thác đạt `5/5`, App Service ở trạng thái `Running` và chỉ dùng HTTPS, Azure SQL tiếp tục thành `Online`, SHA đã triển khai khớp, kiểm thử nhanh công khai đạt, Node `v22.22.2` tải được `mssql` đã triển khai và cả hai đường dẫn từ xa trước đó đều trả về `404`.
- Chạy `lms-acceptance-20260802-d6ecf326` đã chuẩn bị thời gian chạy và tạo chính xác bốn người dùng tổng hợp cộng với một cuốn sách/bản sao. Tất cả bốn lần đăng nhập của tác nhân và cả việc gửi đơn đăng ký thành viên đều hoàn tất trước khi bước đánh giá tư cách thành viên của Quản trị viên dừng lại khi hết thời gian chờ của bộ định vị.
- Timeout do locator responsive không khớp: mọi actor context đều dùng viewport `1440x900`, trong khi CSS áp dụng `@media (max-width: 1440px)` và ẩn `.admin-membership-table` để hiển thị `.admin-membership-cards`. Locator nhắm vào `<tr>` đúng dữ liệu nhưng phần tử vẫn bị ẩn. Lần chạy này không cho thấy lỗi nghiệp vụ đánh giá tư cách thành viên.
- Việc dọn dẹp bắt buộc đã trả về `CLEANED`: giữ lại 4 người dùng nhưng không còn người dùng đang hoạt động, mã thông báo, tư cách thành viên, lượt mượn mở, đặt chỗ mở, sách đang hoạt động hoặc bản sao đang hoạt động; bản sao dành riêng cho lượt chạy chỉ được giữ dưới dạng lịch sử không hoạt động. Cả bốn thông tin đăng nhập tổng hợp đều trả về `401`, mã thông báo cũ được giữ lại trả về `401` và đường dẫn thời gian chạy/trợ giúp trả về `404`.
- Các lần kiểm tra mới sau khi chạy chỉ đọc cho thấy App Service `Running`, Azure SQL `Online`, `/health=200`, `/api/books=200` và dư lượng từ xa `404/404`. Lần thử H1 duy nhất đã bị tiêu tốn; không chạy lại cho đến khi bộ định vị dây đai được xem xét theo H1 mới. Không có nhiệm vụ chấp nhận trực tiếp nào đủ điều kiện để kết thúc.

### Kết quả thử lại H1 của bộ định vị đáp ứng

- Người dùng đã cấp một H1 để sửa chữa bộ định vị tư cách thành viên đáp ứng bằng kiểm thử hồi quy và thực hiện thêm một lần thử trực tiếp. TDD đã ghi lại hợp đồng mới không thành công đối với bộ chọn chỉ trong bảng, sau đó vượt qua `6/6` sau khi khai thác bị bỏ qua đã chọn hàng trong bảng hiển thị hoặc thẻ phản hồi. Không có sự khác biệt về sản phẩm/phụ thuộc nào được giới thiệu.
- Kiểm tra trước mới đã đạt: FE04/FE11 Playwright tập trung `2/2` với mã thoát quy trình sạch, kiểm thử nhanh công khai `PASS`, SHA đã triển khai khớp, App Service là `Running` và chỉ cho phép HTTPS, Azure SQL là `Online`, Node `v22.22.2` tải được `mssql` đã triển khai và kiểm tra dữ liệu còn sót từ xa trả về `404/404`.
- Chạy `lms-acceptance-20260802-6ee409c5` đã vượt qua công cụ định vị Quản trị viên đã sửa chữa, phê duyệt cả hai đơn đăng ký thành viên, vượt qua tám mục điều hướng Quản trị viên/kiểm tra tràn phản hồi, tạo và phê duyệt yêu cầu mượn của Thành viên A, tạo đặt chỗ hoạt động của Thành viên B và BorrowDetail `59` cũ.
- Quá trình chạy đã dừng trước khi thao tác ghi quay trở lại vì dây nịt dự kiến là `Quá hạn 3 ngày`. Tại thời điểm thực hiện, ngày kinh doanh tại Việt Nam là `2026-08-02` trong khi UTC là `2026-08-01`; lịch thi đấu `age` sử dụng `DATEADD(DAY, -3, CAST(GETDATE() AS DATE))`, tạo ra ngày đáo hạn `2026-07-29`. Trình trợ giúp trạng thái phù hợp `Asia/Ho_Chi_Minh` được triển khai sẽ ánh xạ xác định ngày đó tới `Quá hạn 4 ngày`. Đây là sự cố không khớp về ngày làm việc chứ không phải lỗi về trạng thái của sản phẩm.
- Việc dọn dẹp bắt buộc đã trả về `CLEANED`: 4 người dùng được giữ lại nhưng không có người dùng đang hoạt động/mã thông báo/members/open cho vay/đặt chỗ mở/sách đang hoạt động/bản sao đang hoạt động, với bản sao dành riêng cho lần chạy chỉ được giữ lại dưới dạng lịch sử không hoạt động. Bốn lần đăng nhập trả về `401`, mã thông báo cũ trả về `401` và đường dẫn thời gian chạy/trợ giúp trả về `404`.
- Các lần kiểm tra mới sau khi chạy cho thấy App Service `Running`, Azure SQL `Online`, `/health=200`, `/api/books=200`, `404/404` dư lượng từ xa và không có bản kê khai/tạo phẩm chạy cục bộ. Lần thử H1 duy nhất đã bị tiêu tốn; không sửa hoặc chạy lại mà không có H1 mới. Không có nhiệm vụ chấp nhận trực tiếp nào đủ điều kiện để kết thúc.

### Kết quả thử lại lịch thi đấu ngày làm việc H1

- Người dùng đã cấp một H1 để thay thế lịch cũ của máy chủ SQL bằng thông tin đầu vào ngày làm việc chính xác của `Asia/Ho_Chi_Minh`, thêm hồi quy ranh giới UTC/Việt Nam và thực hiện thêm một lần thử trực tiếp.
- TDD đã ghi lại sáu hợp đồng hiện có đã được thông qua trong khi kiểm thử ranh giới mới không thành công do người trợ giúp không tồn tại. Sau khi khai thác bị bỏ qua đã thêm trình trợ giúp và đầu vào `sql.Date` được tham số hóa, kiểm tra cú pháp và tất cả các hợp đồng đều vượt qua `7/7`. Hồi quy ánh xạ `2026-08-01T21:20Z` tới ngày `2026-08-02` của Việt Nam và trừ ba ngày cho `2026-07-30`.
- Kiểm tra trước mới đã đạt: FE04/FE11 Playwright tập trung `2/2` trong `27.0s` với mã thoát quy trình sạch, kiểm thử nhanh công khai `PASS`, SHA đã triển khai khớp, App Service là `Running` và chỉ cho phép HTTPS, Azure SQL là `Online`, Node `v22.22.2` tải được `mssql` đã triển khai và kiểm tra dữ liệu còn sót từ xa trả về `404/404`.
- Chạy `lms-acceptance-20260802-2e3a025d` đã tạo ra chính xác bốn người dùng tổng hợp cùng với một cuốn sách/bản sao, lặp lại các cột mốc thành viên/Quản trị viên/borrow/reservation đã được chứng minh và BorrowDetail `60` được lão hóa. Giao diện người dùng trực tiếp hiển thị `Quá hạn 3 ngày` theo đúng nghĩa đen ở ba vị trí hiển thị.
- Quá trình chạy đã dừng trước thao tác ghi trả về vì `getByText(/Quá hạn 3 ngày/i)` trên toàn trang đã phân giải thành huy hiệu hàng đã chọn, huy hiệu chi tiết trả về và phần tử tóm tắt mạnh mẽ; Chế độ nghiêm ngặt của Playwright yêu cầu một kết quả khớp duy nhất. Điều này chứng tỏ bản sửa lỗi ngày làm việc đang hoạt động và xác định trình chặn bộ chọn khai thác bị bỏ qua mới chứ không phải lỗi sản phẩm.
- Việc dọn dẹp bắt buộc đã trả về `CLEANED`: 4 người dùng được giữ lại nhưng không có người dùng đang hoạt động/mã thông báo/members/open cho vay/đặt chỗ mở/sách đang hoạt động/bản sao đang hoạt động, với bản sao dành riêng cho lần chạy chỉ được giữ lại dưới dạng lịch sử không hoạt động. Bốn lần đăng nhập trả về `401`, mã thông báo cũ trả về `401` và đường dẫn thời gian chạy/trợ giúp trả về `404`.
- Các lần kiểm tra mới sau khi chạy cho thấy App Service `Running`, Azure SQL `Online`, `/health=200`, `/api/books=200` và cặn vận chuyển `404/404`. Lần thử H1 duy nhất đã bị tiêu tốn; không sửa hoặc chạy lại mà không có H1 mới. Không có nhiệm vụ chấp nhận trực tiếp nào đủ điều kiện để kết thúc.

### Kết quả thử lại công cụ định vị nhãn quá hạn H1

- Người dùng đã cấp một H1 để xác định phạm vi xác nhận quá hạn cho một vùng chi tiết trả về duy nhất, thêm hồi quy cho ba nhãn hiển thị trùng lặp và thực hiện thêm một lần thử trực tiếp.
- TDD đã ghi lại bảy hợp đồng hiện có được thông qua trong khi hợp đồng định vị mới không thành công so với xác nhận trên toàn trang. Sau khi khai thác bị bỏ qua, `.return-detail .return-dates` đã sử dụng với văn bản chính xác, kiểm tra cú pháp và tất cả các hợp đồng đều vượt qua `8/8`. Không có sự khác biệt về sản phẩm/phụ thuộc nào được giới thiệu.
- Kiểm tra trước mới đã đạt: FE04/FE11 Playwright tập trung `2/2` trong `23.7s` với mã thoát quy trình sạch, kiểm thử nhanh công khai `PASS`, SHA đã triển khai khớp, App Service là `Running` và chỉ cho phép HTTPS, Azure SQL là `Online`, Node `v22.22.2` tải được `mssql` đã triển khai và kiểm tra dữ liệu còn sót từ xa trả về `404/404`.
- Chạy `lms-acceptance-20260802-9a3f0f98` đã gieo mầm chính xác bốn người dùng tổng hợp cộng với một cuốn sách/bản sao, lặp lại các mốc thành viên/Quản trị viên/mượn/reservation, BorrowDetail `61` cũ, đã vượt qua xác nhận `Quá hạn 3 ngày` chính xác, cam kết trả sách, hiển thị chuyển bàn giao đợi và điều hướng đến không gian làm việc đặt chỗ.
- Quá trình chạy đã dừng trước khi có thao tác ghi tốt vì tên có thể truy cập được của nút quy trình làm việc FE09 là `2 Tính tiền phạt`, trong khi dây nịt yêu cầu tên chính xác là `Tính tiền phạt`. Đầu dò khả năng truy cập Playwright cục bộ chỉ đọc trả về số lượng tên chính xác `0` và số lượng tên hậu tố `1`. Đây là lỗi định vị bộ khai thác bị bỏ qua mang tính xác định, không phải lỗi FE09 của sản phẩm.
- Việc dọn dẹp bắt buộc đã trả về `CLEANED`: 4 người dùng được giữ lại nhưng không có người dùng đang hoạt động/mã thông báo/members/open cho vay/đặt chỗ mở/sách đang hoạt động/bản sao đang hoạt động, với bản sao dành riêng cho lần chạy chỉ được giữ lại dưới dạng lịch sử không hoạt động. Bốn lần đăng nhập trả về `401`, mã thông báo cũ trả về `401` và đường dẫn thời gian chạy/trợ giúp trả về `404`.
- Các lần kiểm tra mới sau khi chạy cho thấy App Service `Running`, Azure SQL `Online`, `/health=200`, `/api/books=200`, cặn vận chuyển `404/404`, độ khác biệt của sản phẩm `0` và số lượng tạo tác chạy cục bộ `0`. Lần thử H1 duy nhất đã bị tiêu tốn; không sửa hoặc chạy lại mà không có H1 mới. Không có nhiệm vụ chấp nhận trực tiếp nào đủ điều kiện để kết thúc.

### FE09 kết quả thử lại định vị tab quy trình công việc H1

- Người dùng đã cấp một H1 để khớp với tab FE09 được đánh số theo hậu tố tên có thể truy cập ổn định của nó, thêm hồi quy khả năng truy cập và thực hiện một lần thử trực tiếp bổ sung.
- TDD đã ghi lại tám hợp đồng hiện có được thông qua trong khi hợp đồng thứ chín không thành công so với công cụ định vị tên chính xác cũ. Sau khi khai thác bị bỏ qua trong phạm vi tab trong `Quy trình quản lý tiền phạt` và sử dụng `/Tính tiền phạt$/`, kiểm tra cú pháp và tất cả các hợp đồng đều vượt qua `9/9`. Không có sự khác biệt về sản phẩm/phụ thuộc nào được giới thiệu.
- Kiểm tra trước mới đã đạt: FE04/FE11 Playwright tập trung `2/2` trong `23.9s` với mã thoát quy trình sạch, kiểm thử nhanh công khai `PASS`, SHA đã triển khai khớp với `e01585a9aa7d603daf932f7ac6459eaa0752746c`, App Service là `Running` và chỉ cho phép HTTPS, Azure SQL là `Online`, Node `v22.22.2` tải được `mssql` đã triển khai và kiểm tra dữ liệu còn sót từ xa trả về `404/404`.
- Chạy `lms-acceptance-20260802-e941b470` đã gieo mầm chính xác bốn người dùng tổng hợp cộng với một cuốn sách/bản sao, lặp lại các cột mốc thành viên/Quản trị viên/mượn/reservation, BorrowDetail `62` cũ, đã vượt qua xác nhận `Quá hạn 3 ngày` chính xác, đã cam kết trả sách, đã vượt qua tab FE09 được đánh số, nâng cao thông qua tính toán tinh tế và điều hướng đến không gian làm việc đặt chỗ.
- Quá trình chạy đã dừng trước thao tác ghi hàng đợi FE08 do dây nịt đã lọc `.reservation-queue-card` chung theo tên sách dành riêng cho lần chạy. Thẻ không hiển thị tiêu đề đó dưới dạng văn bản thẻ; nó chỉ xuất hiện trong tùy chọn bộ chọn sao chép. Luồng kết nối chuẩn E2E định vị nút `Giữ sách & thông báo` duy nhất ngay sau khi chuyển giao. Đây là lỗi định vị bộ khai thác bị bỏ qua mang tính xác định, không phải là lỗi FE08 của sản phẩm đã được chứng minh.
- Việc dọn dẹp bắt buộc đã trả về `CLEANED`: 4 người dùng được giữ lại nhưng không có người dùng đang hoạt động/mã thông báo/members/open cho vay/đặt chỗ mở/sách đang hoạt động/bản sao đang hoạt động, với bản sao dành riêng cho lần chạy chỉ được giữ lại dưới dạng lịch sử không hoạt động. Bốn lần đăng nhập trả về `401`, mã thông báo cũ trả về `401` và đường dẫn thời gian chạy/trợ giúp trả về `404`.
- Các lần kiểm tra mới sau khi chạy cho thấy App Service `Running`, Azure SQL `Online`, `/health=200`, `/api/books=200`, dư lượng vận chuyển `404/404`, hợp đồng cú pháp và khai thác `9/9`, khác biệt về sản phẩm `0` và số lượng tạo phẩm chạy cục bộ `0`. Lần thử H1 duy nhất đã bị tiêu tốn; không được phép chạy lại hoặc đóng cổng L1-L4 đầy đủ từ việc chấp nhận L4 không thành công này. Không có nhiệm vụ chấp nhận trực tiếp nào đủ điều kiện để kết thúc.

### FE08 kết quả thử lại của bộ định vị hàng đợi đặt chỗ H1

- Người dùng đã cấp một H1 để chọn bản sao lịch thi đấu chính xác thay vì lọc thẻ hàng đợi chung theo tên sách, thêm hồi quy phù hợp với giao diện người dùng hàng đợi và thực hiện một lần thử trực tiếp bổ sung.
- TDD đã ghi nhận chín hợp đồng hiện có được thông qua trong khi hợp đồng thứ mười không thành công trước bộ lọc thẻ `bookTitle` cũ. Sau khi khai thác bị bỏ qua đã chọn `seed.copyId`, đợi đầu hàng đợi mang `ACC-${runId}` và đưa `Giữ sách & thông báo` vào đầu đó, kiểm tra cú pháp và tất cả các hợp đồng đều vượt qua `10/10`. Không có sự khác biệt về sản phẩm/phụ thuộc nào được giới thiệu.
- Kiểm tra trước mới đã đạt: FE04/FE11 Playwright tập trung `2/2` trong `23.3s` với mã thoát quy trình sạch, kiểm thử nhanh công khai `PASS`, SHA đã triển khai khớp với `e01585a9aa7d603daf932f7ac6459eaa0752746c`, App Service là `Running` và chỉ cho phép HTTPS, Azure SQL là `Online`, các tên cài đặt `DB_*` bắt buộc không có giá trị, Node `v22.22.2` tải được `mssql` đã triển khai và kiểm tra dữ liệu còn sót từ xa trả về `404/404`.
- Chạy `lms-acceptance-20260802-372b4ded` đã gieo mầm chính xác bốn người dùng tổng hợp cộng với sách `29`/sao chép `53`, lặp lại các cột mốc thành viên/Quản trị viên/borrow/reservation, BorrowDetail `63` cũ, đã vượt qua tính toán trả sách và tính phạt, xử lý hàng đợi FE08 sao chép chính xác và quan sát huy hiệu thông báo Thành viên B tiếp theo.
- Quá trình chạy đã dừng khi báo cáo FE12 sẵn sàng vì dây nịt yêu cầu tiêu đề `/Báo cáo mượn sách/i`, trong khi `BorrowingReportPage` hiển thị `Báo cáo mượn/trả`. luồng nghiệp vụ chuẩn của hệ thống chuẩn E2E xác minh `Tổng bản ghi` KPI thay vì tiêu đề cũ đó. Đây là lỗi định vị bộ khai thác bị bỏ qua mang tính xác định, không phải là lỗi FE12 của sản phẩm đã được chứng minh.
- Việc dọn dẹp bắt buộc đã trả về `CLEANED`: 4 người dùng được giữ lại nhưng không có người dùng đang hoạt động/mã thông báo/members/open cho vay/đặt chỗ mở/sách đang hoạt động/bản sao đang hoạt động, với bản sao dành riêng cho lần chạy chỉ được giữ lại dưới dạng lịch sử không hoạt động. Bốn lần đăng nhập trả về `401`, mã thông báo cũ trả về `401` và đường dẫn thời gian chạy/trợ giúp trả về `404`.
- Các lần kiểm tra mới sau khi chạy cho thấy App Service `Running`, Azure SQL `Online`, `/health=200`, `/api/books=200`, dư lượng vận chuyển `404/404`, hợp đồng cú pháp và khai thác `10/10`, khác biệt về sản phẩm `0` và số lượng tạo phẩm chạy cục bộ `0`. Lần thử H1 duy nhất đã bị tiêu tốn; không được phép chạy lại hoặc đóng cổng L1-L4 đầy đủ từ việc chấp nhận L4 không thành công này. Không có nhiệm vụ chấp nhận trực tiếp nào đủ điều kiện để kết thúc.

### FE12 báo cáo vay mượn kết quả thử lại công cụ định vị KPI H1

- Người dùng đã cấp một H1 để thay thế bộ định vị tiêu đề FE12 cũ bằng `Tổng bản ghi` KPI chuẩn, thêm một hồi quy và thực hiện một lần thử trực tiếp bổ sung.
- TDD ghi nhận 10 hợp đồng hiện có được thông qua trong khi hợp đồng thứ 11 thất bại trước `/Báo cáo mượn sách/i`. Sau khi khai thác bị bỏ qua, hãy đợi báo cáo `.kpi-card` chứa `Tổng bản ghi` và từ chối bộ định vị cũ, kiểm tra cú pháp và tất cả các hợp đồng đều vượt qua `11/11`. Không có sự khác biệt về sản phẩm/phụ thuộc nào được giới thiệu.
- Kiểm tra trước mới đã đạt: FE04/FE11 Playwright `2/2` trong `20.9s` với mã thoát quy trình sạch, kiểm thử nhanh công khai `PASS`, lượt triển khai `30711210037` thành công cho đúng SHA `e01585a9aa7d603daf932f7ac6459eaa0752746c`, App Service là `Running` và chỉ cho phép HTTPS, Azure SQL là `Online`, các tên cài đặt `DB_*` bắt buộc không có giá trị, Node `v22.22.2` tải được `mssql` đã triển khai và kiểm tra dữ liệu còn sót từ xa trả về `404/404`.
- Chạy ID người dùng được tạo hạt giống `lms-acceptance-20260802-3ea0d609` `118-121`, đặt `30` và sao chép `54`; tuổi BorrowDetail `64`; đã vượt qua mọi ranh giới của bộ định vị trước đó, xử lý hàng đợi sao chép chính xác, thông báo Thành viên B, mức độ sẵn sàng của FE12 KPI, tải kiểm tra của quản trị viên và tất cả các xác nhận ủy quyền phủ định/không thay đổi theo kế hoạch.
- Việc kiểm tra cuối cùng thất bại trong ba ngày khoản phạt bất biến. Lịch sử SQL được giữ lại chính xác sau khi dọn dẹp là `FineId=6`, `UserId=118`, `BorrowDetailId=64`, `OverdueDays=2`, `Amount=10000`, `Status=CANCELLED`, `DueDate=2026-07-30` và `ReturnDate=2026-08-01`. Giao diện người dùng trả sách trực tiếp đã hiển thị chính xác `Quá hạn 3 ngày` vào ngày giao dịch `2026-08-02` tại Việt Nam.
- Truy tìm nguyên nhân gốc chỉ đọc cho thấy `borrowingService.returnBorrow` tính toán `returnBusinessDate` nhưng chuyển UTC `returnDate=clock()` thô sang `borrowingRepository.returnBorrowDetail`, liên kết nó dưới dạng `sql.Date`. FE09 tính toán chính xác từ `detail.returnDate` vẫn tồn tại, vì vậy đây là lỗi tồn tại trong ngày làm việc của FE07 chính hãng đã bộc lộ ở phía dưới trong FE09.
- Việc dọn dẹp bắt buộc đã trả sách `CLEANED`: bốn người dùng được giữ lại nhưng không có người dùng đang hoạt động/mã thông báo/members/open cho vay/đặt chỗ mở/sách đang hoạt động/bản sao đang hoạt động, với một bản sao dành riêng cho lần chạy chỉ được giữ lại dưới dạng lịch sử không hoạt động. Bốn lần đăng nhập và mã thông báo cũ đã trả về `401`; dư lượng từ xa là `404/404`; số lượng tạo tác cục bộ và độ khác biệt của sản phẩm là `0`.
- Lần thử H1 duy nhất được tiêu thụ. Không chạy lại, thay đổi mã sản phẩm, thực hiện đầy đủ các cổng đóng L1-L4 hoặc đóng các tác vụ trong H1 này. Việc khắc phục sản phẩm cần một H1 được đánh giá mới với hồi quy theo ngày liên tục, xác minh FE07/FE09 tập trung và chấp nhận giai đoạn rõ ràng sau đó.

---

## Bản đồ trách nhiệm nộp hồ sơ

### Tạm thời và bị bỏ qua - không bao giờ cam kết

- `tmp/staging-acceptance/orchestrate.js`: chỉ giữ thông tin đăng nhập xuất bản Kudu trong bộ nhớ và sở hữu một vòng đời quy trình cho runId, mật khẩu thô, hạt giống, tự động hóa trình duyệt và dọn dẹp bắt buộc.
- `tmp/staging-acceptance/fixture.js`: triển khai `preflight`, `seed`, `inspect`, `age`, `cleanup` và `verify-cleanup` dựa trên cấu hình môi trường tiền sản xuất đã triển khai.
- Việc triển khai tạm thời có chủ đích giữ cho trình chạy và trình duyệt chạy trong một quy trình Node bị bỏ qua để mật khẩu thô không bao giờ vượt qua ranh giới quy trình hoặc tệp.
- `output/playwright/staging-acceptance/<runId>/*.png`: ảnh chụp màn hình được biên tập lại; bị loại khỏi Git.

### Bằng chứng liên tục - đủ điều kiện để cam kết sau H2

- `.sdd/reviews/release-closeout-staging-acceptance-2026-08-02.md`: nguồn duy nhất của bằng chứng xử lý và chấp nhận trực tiếp.
- `.sdd/specs/feat-membership-management/{PLAN,TASKS,CHANGELOG}.md`: chỉ cập nhật các mục FE04 được bao gồm đầy đủ trong lần chạy và H2 sau này.
- `.sdd/specs/feat-user-role-management/{TASKS,CHANGELOG}.md`: chỉ cập nhật các mục chấp nhận FE11 được bao gồm đầy đủ trong lần chạy và H2 sau này.
- `.sdd/traceability.yaml`: chỉ thay đổi nếu tất cả bằng chứng bắt buộc đều thay đổi trạng thái đối tượng theo các quy tắc hiện có của nó.

### Nhiệm vụ 1: Azure đóng lỗi và kiểm tra trước kho lưu trữ

**Tệp:**

- Đọc: `docs/deployment/azure-staging-guide.md`
- Đọc: `.github/workflows/deploy-staging.yml`
- Đọc: `database/Librarymanagement.sql`
- Đọc: `backend/src/config/db.js`
- Đọc: `backend/src/routes/{membership,borrowing,reservation,notification,report,fine}Routes.js`

**Giao diện:**

- Tiêu thụ: đăng nhập Azure, tên tài nguyên chính xác, bằng chứng hợp nhất/triển khai, nhánh thiết kế cục bộ sạch sẽ.
- Tạo ra: `PRECHECK_PASS` hoặc hủy bỏ trước bất kỳ thao tác ghi giai đoạn nào.

- [ ] **Bước 1: Xác nhận nhánh địa phương và mốc cơ sở**

```powershell
git status --short --branch
git rev-parse e01585a9aa7d603daf932f7ac6459eaa0752746c
git merge-base --is-ancestor e01585a9aa7d603daf932f7ac6459eaa0752746c HEAD
```

Dự kiến: nhánh hiện tại chứa mốc cơ sở; chỉ những tài liệu kế hoạch đã được phê duyệt mới có thể
được cung cấp.

- [ ] **Bước 2: Xác nhận mục tiêu Azure trực tiếp mà không cần đọc các giá trị bí mật**

```powershell
az account show --query "{subscription:id,tenant:tenantId}" -o json
az webapp show --resource-group rg-library-staging --name app-library-api-staging-nhat714 --query "{state:state,host:defaultHostName,httpsOnly:httpsOnly}" -o json
az sql db show --resource-group rg-library-staging --server sql-library-staging-ea-nhat714 --name LibraryManagementStaging --query "{status:status,name:name}" -o json
az webapp config appsettings list --resource-group rg-library-staging --name app-library-api-staging-nhat714 --query "[?starts_with(name,'DB_')].name" -o tsv
```

Dự kiến: tồn tại ID đăng ký/đối tượng thuê dự định, ứng dụng web `Running`, máy chủ chính xác,
`httpsOnly=true`, cơ sở dữ liệu `Online` và tên cài đặt DB bắt buộc. Không thêm các trường nhận dạng
tài khoản Azure hoặc xóa các phép chiếu truy vấn; một trong hai thay đổi sẽ làm lộ PII hoặc các bí
mật.

- [ ] **Bước 3: Xác nhận SHA đã triển khai và public smoke**

```powershell
gh run view 30711210037 --json headSha,conclusion,url
$env:STAGING_FRONTEND_URL='https://www.thuvienhub.io.vn'
$env:STAGING_API_URL='https://app-library-api-staging-nhat714.azurewebsites.net'
npm run smoke:staging
```

Dự kiến: SHA đã triển khai là mốc cơ sở chính xác và kiểm thử nhanh kết thúc với mã `0`. Xóa hai biến URL không
bí mật sau đợt.

- [ ] **Bước 4: Xác nhận không có dư lượng chấp nhận trước đó khớp với điểm đánh dấu lần chạy mới**

Tạo ID chạy không bí mật trong bộ nhớ:

```powershell
$acceptanceRunId = 'lms-acceptance-20260802-' + ([guid]::NewGuid().ToString('N').Substring(0,8))
```

Giai đoạn `preflight` của lịch thi đấu phải truy vấn chính xác tên người dùng/email, tiêu đề và mã
vạch được chuẩn hóa cho ID lần chạy này và trả về 0 hàng. Mọi va chạm đều bị hủy bỏ.

---

### Nhiệm vụ 2: Xây dựng và xác nhận khai thác vận hành tạm thời

**Tệp:**

- Tạo tạm thời: `tmp/staging-acceptance/kudu-runner.ps1`
- Tạo tạm thời: `tmp/staging-acceptance/orchestrate.ps1`
- Tạo tạm thời: `tmp/staging-acceptance/fixture.js`
- Tạo tạm thời: `tmp/staging-acceptance/acceptance.spec.js`
- Tạo tạm thời: `tmp/staging-acceptance/playwright.config.js`

**Giao diện:**

- Tiêu thụ: tên tài nguyên `runId`, Azure, `backend/src/config/db.js` đã triển khai, `bcrypt` cục bộ, thông tin xác thực Kudu được lưu trong bộ nhớ.
- Tạo ra: ID tệp kê khai, biến môi trường mật khẩu Playwright riêng biệt, kết quả giai đoạn, xác minh dọn dẹp.

- [ ] **Bước 1: Tạo thư mục bị bỏ qua và chứng minh Git bỏ qua nó**

Tạo tệp bằng `apply_patch`, không phải chuyển hướng lớp bao. Sau đó chạy:

```powershell
git check-ignore -v tmp/staging-acceptance/kudu-runner.ps1
git check-ignore -v tmp/staging-acceptance/orchestrate.ps1
git check-ignore -v tmp/staging-acceptance/fixture.js
git check-ignore -v tmp/staging-acceptance/acceptance.spec.js
git check-ignore -v tmp/staging-acceptance/playwright.config.js
```

Dự kiến: tất cả năm đường dẫn đều bị bỏ qua bởi quy tắc `tmp/` gốc.

- [ ] **Bước 2: Thực hiện hợp đồng Kudu runner**

`orchestrate.ps1` phải chạy tạo thông tin xác thực, hạt giống, kịch bản Playwright, kiểm tra, dọn
dẹp, xác minh mã thông báo/đăng nhập và xóa môi trường trong một quy trình PowerShell. Nó chấp nhận
một tham số không bí mật:

```powershell
param(
  [Parameter(Mandatory=$true)]
  [ValidatePattern('^lms-acceptance-20260802-[0-9a-f]{8}$')]
  [string]$RunId
)
```

Cấu trúc cấp cao nhất của nó được cố định:

```powershell
$ErrorActionPreference = 'Stop'
$scenarioStatus = 'NOT_RUN'
$cleanupStatus = 'NOT_RUN'
try {
  # Generate four credentials in memory, seed, and execute the acceptance spec.
  $scenarioStatus = 'PASS'
} catch {
  $scenarioStatus = 'FAIL'
  throw
} finally {
  # Run exact-ID cleanup when a manifest exists, verify cleanup, remove remote files,
  # clear browser/auth environment variables, and null every secret-bearing variable.
}
```

Các bình luận nêu rõ nội dung được phép duy nhất của hai khối đó; việc triển khai phải sử dụng các
lệnh và bất biến chính xác trong Nhiệm vụ 2-4. Nó không bao giờ được quay lại trước `finally`.

`kudu-runner.ps1` phải hiển thị các thông số chính xác sau:

```powershell
param(
  [ValidateSet('preflight','seed','inspect','age','cleanup','verify-cleanup')]
  [string]$Phase,
  [Parameter(Mandatory=$true)][string]$RunId,
  [string]$ManifestPath,
  [string]$BorrowDetailId
)
```

Nó phải:

1. gọi `az webapp deployment list-publishing-credentials` và gán trực tiếp JSON cho đối tượng PowerShell;
2. xây dựng tiêu đề Cơ bản trong bộ nhớ mà không cần ghi hoặc hiển thị nó;
3. tải `fixture.js` lên `/home/site/wwwroot/tmp-staging-acceptance/fixture.js` thông qua Kudu VFS;
4. đối với `seed`, hãy tải lên JSON đầu vào chỉ chứa runId, giá trị email/tên người dùng/hồ sơ tài khoản, băm mật khẩu và tên vai trò;
5. đối với `inspect`, `age`, `cleanup` và `verify-cleanup`, hãy tải tệp kê khai không bí mật cục bộ lên đường dẫn đầu vào từ xa dành riêng cho lần chạy và xóa nó sau giai đoạn;
6. gọi Kudu `/api/command` bằng `node /home/site/wwwroot/tmp-staging-acceptance/fixture.js <phase>` và một thư mục làm việc cố định;
7. phân tích thiết bị xuất chuẩn dưới dạng JSON và từ chối mọi đầu ra không phải JSON;
8. xóa tệp đầu vào hạt giống từ xa ngay sau hạt giống;
9. xóa tập lệnh cố định từ xa sau `verify-cleanup` hoặc do lỗi;
10. ghi đè các biến thông tin xác thực bằng `$null` trong `finally`;
11. không bao giờ sử dụng `Write-Host`, `Write-Output`, `ConvertTo-Json` hoặc các bãi chứa ngoại lệ trên các vật thể mang bí mật.

Đầu ra của pha dự kiến ​​là đường bao không bí mật sau:

```json
{
  "runId": "lms-acceptance-20260802-1234abcd",
  "phase": "seed",
  "status": "PASS",
  "ids": {
    "memberAUserId": 1,
    "memberBUserId": 2,
    "librarianUserId": 3,
    "adminUserId": 4,
    "bookId": 1,
    "copyId": 1
  }
}
```

- [ ] **Bước 3: Triển khai hợp đồng SQL**

`fixture.js` phải sử dụng `sql.Transaction`, `new sql.Request(transaction)` và `.input(...)` cho mọi
giá trị động. Các giai đoạn của nó là chính xác:

```text
preflight:
  assert DB_NAME() = LibraryManagementStaging
  xác nhận các bảng/cột bắt buộc và vai trò ADMIN/LIBRARIAN/MEMBER đều tồn tại
  xác nhận không có xung đột tên đăng nhập/email/tiêu đề/mã vạch đã chuẩn hóa cho runId

seed (one transaction):
  chèn bốn Users ở trạng thái ACTIVE, đã xác minh email, bằng bốn giá trị băm bcrypt được cung cấp
  chèn bốn UserProfiles đầy đủ (FullName, Address, DateOfBirth)
  gán đúng một vai trò cho mỗi User qua UserRoles
  chọn một Category, Author, Publisher ACTIVE hiện có hoặc dừng
  chèn một Book ACTIVE có tiêu đề chứa runId và CreatedBy=adminUserId
  chèn một BookCopy AVAILABLE có mã vạch chứa runId
  chỉ trả về các ID; không tạo Members hoặc MembershipApplications

inspect:
  chọn chính xác Users/UserRoles/Members/MembershipApplications trong bảng kê khai
  chọn chính xác Book/BookCopy/BorrowRequests/BorrowDetails/Reservations/Fines
  chọn Notifications và AuditLogs liên kết với ID người dùng/thực thể trong bảng kê khai
  chỉ trả về số lượng/trạng thái; che nội dung siêu dữ liệu và địa chỉ người nhận

age:
  yêu cầu BorrowDetailId thuộc Thành viên A và CopyId trong bảng kê khai
  require Status='BORROWED'
  yêu cầu dueDate là giá trị YYYY-MM-DD hợp lệ do bộ công cụ vận hành suy ra
    từ ngày nghiệp vụ Asia/Ho_Chi_Minh hiện tại trừ ba ngày lịch
  gắn dueDate dưới dạng giá trị sql.Date được tham số hóa
  chỉ đặt DueDate=@dueDate và UpdatedAt=GETDATE()

cleanup (one transaction):
  chuyển các Reservations đang active/notified của người dùng/bản sao trong bảng kê khai thành CANCEL
  đưa BorrowDetails và BorrowRequests đang mở của người dùng/bản sao trong bảng kê khai về trạng thái kết thúc
  đặt các Fines chưa thanh toán của dữ liệu kiểm thử thành CANCELLED với lý do acceptance-cleanup
  thu hồi mọi AuthToken đang hoạt động của bốn ID người dùng
  đặt Members.Status='INACTIVE'
  đặt BookCopies.Status='INACTIVE' và Books.Status='INACTIVE'
  đặt Users.Status='INACTIVE', DeactivatedAt=GETDATE(), UpdatedAt=GETDATE()
  không xóa lịch sử Notifications, AuditLogs, đơn đăng ký, lượt mượn, đặt chỗ hoặc khoản phạt

verify-cleanup:
  xác nhận không còn Users/AuthTokens/lượt mượn mở/đặt chỗ mở/bản ghi danh mục đang hoạt động
  xác nhận cả bốn bản ghi User và lịch sử sách/bản sao vẫn tồn tại
  trả về CLEANED, PARTIAL_CLEANUP hoặc FAILED_CLEANUP theo ID đối tượng
```

Tập lệnh phải từ chối các ID giai đoạn/đầu vào không thuộc tệp kê khai chạy chính xác. Nó phải gọi
`transaction.rollback()` trong mỗi giai đoạn thao tác ghi không thành công và đóng nhóm trong `finally`.

- [ ] **Bước 4: Tạo bốn thông tin xác thực riêng biệt trong bộ nhớ**

Sử dụng Node/bcrypt cục bộ từ các phần phụ thuộc máy chủ đã cài đặt; ghi thiết bị xuất chuẩn vào
biến PowerShell và không bao giờ lặp lại nó:

```powershell
$credentialJson = node -e "const c=require('crypto');const b=require('./backend/node_modules/bcrypt');(async()=>{const names=['memberA','memberB','librarian','admin'];const o={};for(const n of names){const p='Acc-'+c.randomBytes(24).toString('base64url')+'!Aa1';o[n]={password:p,hash:await b.hash(p,12)}}process.stdout.write(JSON.stringify(o))})().catch(()=>process.exit(1))"
$acceptanceCredentials = $credentialJson | ConvertFrom-Json
$credentialJson = $null
```

Dự kiến: 4 mật khẩu không giống nhau, 4 hàm băm bắt đầu bằng `$2` và không có đầu ra thông tin xác
thực. Đầu vào hạt giống chỉ nhận được giá trị băm; Playwright chỉ nhận mật khẩu thông qua môi trường
xử lý.

Sử dụng các danh tính tổng hợp chính xác này; `<suffix>` là tám ký tự cuối cùng của
`$acceptanceRunId` và không phải là giá trị dạng tự do:

```text
memberA: username=acc_member_a_<suffix>; email=member-a.<suffix>@lms.invalid; fullName=Acceptance Member A
memberB: username=acc_member_b_<suffix>; email=member-b.<suffix>@lms.invalid; fullName=Acceptance Member B
librarian: username=acc_librarian_<suffix>; email=librarian.<suffix>@lms.invalid; fullName=Acceptance Librarian
admin: username=acc_admin_<suffix>; email=admin.<suffix>@lms.invalid; fullName=Acceptance Admin
all profiles: Address=Staging synthetic fixture; DateOfBirth=2000-01-01; Phone is null
book: Title=Acceptance Book <runId>; ISBN is null
copy: Barcode=ACC-<runId>; Location=STAGING-ACCEPTANCE
```

- [ ] **Bước 5: Xác thực các tệp tạm thời trước khi thực thi Azure**

Tạo `playwright.config.js` với nội dung chính xác này:

```javascript
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: 'acceptance.spec.js',
  timeout: 180000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
});
```

```powershell
node --check tmp/staging-acceptance/fixture.js
node --check tmp/staging-acceptance/acceptance.spec.js
node --check tmp/staging-acceptance/playwright.config.js
$parseErrors = $null
[System.Management.Automation.Language.Parser]::ParseFile(
  (Resolve-Path 'tmp/staging-acceptance/kudu-runner.ps1'),
  [ref]$null,
  [ref]$parseErrors
) | Out-Null
if ($parseErrors.Count) { throw 'Temporary Kudu runner has PowerShell parse errors.' }
$parseErrors = $null
[System.Management.Automation.Language.Parser]::ParseFile(
  (Resolve-Path 'tmp/staging-acceptance/orchestrate.ps1'),
  [ref]$null,
  [ref]$parseErrors
) | Out-Null
if ($parseErrors.Count) { throw 'Temporary acceptance orchestrator has PowerShell parse errors.' }
git status --short
```

Dự kiến: quá trình kiểm tra cú pháp đã vượt qua và các tệp tạm thời bị bỏ qua không xuất hiện ở
trạng thái Git.

---

### Nhiệm vụ 3: Chọn, xác thực và thực thi kịch bản giao diện người dùng trực tiếp

**Tệp:**

- Thực hiện tạm thời: `tmp/staging-acceptance/acceptance.spec.js`
- Viết các tạo phẩm bị bỏ qua: `output/playwright/staging-acceptance/<runId>/*.png`
- Cập nhật bảng kê khai bị bỏ qua: `tmp/staging-acceptance/run/<runId>/manifest.json`

**Giao diện:**

- Tiêu thụ: ID tệp kê khai được tạo hạt giống và bốn biến môi trường mật khẩu thời gian chạy.
- Tạo ra: các quan sát role/auth/UI/API/state cho lần chạy chính xác.

- [ ] **Bước 1: Chạy kiểm tra trước và gieo hạt**

Gọi runner tạm thời theo thứ tự sau:

```powershell
& tmp/staging-acceptance/kudu-runner.ps1 -Phase preflight -RunId $acceptanceRunId
& tmp/staging-acceptance/kudu-runner.ps1 -Phase seed -RunId $acceptanceRunId
```

Dự kiến: cả hai giai đoạn đều trả về `PASS`; hạt giống trả về chính xác sáu ID tích cực. Chỉ ghi các
ID, dấu thời gian, SHA cơ sở, tên máy chủ và trạng thái giai đoạn đó vào bảng kê khai cục bộ.

Xác định tệp kê khai và môi trường xử lý Playwright mà không in các giá trị:

```powershell
$manifestDirectory = Join-Path 'tmp/staging-acceptance/run' $acceptanceRunId
$manifestPath = Join-Path $manifestDirectory 'manifest.json'
$suffix = $acceptanceRunId.Substring($acceptanceRunId.Length - 8)
$env:STAGING_FRONTEND_URL = 'https://www.thuvienhub.io.vn'
$env:STAGING_API_URL = 'https://app-library-api-staging-nhat714.azurewebsites.net'
$env:STAGING_MEMBER_A_EMAIL = "member-a.$suffix@lms.invalid"
$env:STAGING_MEMBER_B_EMAIL = "member-b.$suffix@lms.invalid"
$env:STAGING_LIBRARIAN_EMAIL = "librarian.$suffix@lms.invalid"
$env:STAGING_ADMIN_EMAIL = "admin.$suffix@lms.invalid"
$env:STAGING_MEMBER_A_PASSWORD = $acceptanceCredentials.memberA.password
$env:STAGING_MEMBER_B_PASSWORD = $acceptanceCredentials.memberB.password
$env:STAGING_LIBRARIAN_PASSWORD = $acceptanceCredentials.librarian.password
$env:STAGING_ADMIN_PASSWORD = $acceptanceCredentials.admin.password
```

Thư mục tệp kê khai và JSON được tạo bằng `apply_patch`/khai thác toán tử, không bao giờ chuyển
hướng lớp bao. JSON loại trừ tất cả tám trường mật khẩu/băm.

Chạy thông số chấp nhận từ xa mà không cần máy chủ web cục bộ:

```powershell
npx playwright test --config tmp/staging-acceptance/playwright.config.js --workers=1
```

Dự kiến: thu thập đúng một kiểm kiểm thử thu tạm thời. Lỗi xác nhận kiểm tra được ghi lại dưới dạng
kịch bản `FAIL` và vẫn kích hoạt quá trình dọn dẹp Nhiệm vụ 4.

- [ ] **Bước 2: Thực thi vai trò/auth và hành vi thành viên thông qua giao diện người dùng**

Thông số Playwright phải sử dụng các URL được triển khai chính xác và thực hiện:

```text
Thành viên A đăng nhập -> /home -> /membership -> Gửi đơn đăng ký -> PENDING
Thành viên A đăng xuất; ngữ cảnh giao diện được bảo vệ trước đó không còn hoạt động
Thành viên B đăng nhập -> /membership -> Gửi đơn đăng ký -> PENDING -> đăng xuất
Quản trị viên đăng nhập -> /admin/users -> Duyệt hội viên
  -> phê duyệt Thành viên A và Thành viên B qua các hộp thoại rà soát
  -> xác minh cả hai bản ghi/trạng thái thành viên đều là APPROVED
Giao diện Quản trị viên ở 1440x900, 1366x768, 1280x720, 390x844:
  -> có đúng tám mục thanh bên
  -> Duyệt hội viên nằm sau Tất cả người dùng
  -> không có mục Quyền hạn
  -> thẻ người dùng và thành viên xuất hiện trước khi có tràn ngang
  -> nhãn hành động kiểm toán bằng tiếng Việt và chi tiết bản ghi vẫn theo danh sách cho phép/chỉ đọc
```

Chỉ chụp ảnh màn hình sau khi đảm bảo các trường thông tin xác thực, mã thông báo, cookie, email và
siêu dữ liệu kiểm tra thô không hiển thị.

- [ ] **Bước 3: Thực hiện kiểm tra ủy quyền máy chủ phủ định**

Chỉ thu thập mã thông báo truy cập bên trong quy trình Playwright và xác nhận:

```text
chưa xác thực GET /api/admin/audit-logs -> 401
Thành viên A GET /api/admin/audit-logs -> 403
Thành viên A GET /api/users?page=1 -> 403
Thủ thư GET /api/users?page=1 -> 403
Thành viên A POST /api/reservations/process-queue -> 403
Quản trị viên PUT /api/users/<synthetic-librarian-id> với fullName + expectedUpdatedAt chính xác -> 404 và hồ sơ không thay đổi, khớp với tuyến đã ngừng dùng trong Q-FE11-029/FR-FE11-028 đã phê duyệt
```

Chỉ ghi lại phương thức/đường dẫn/trạng thái. Không bao giờ đính kèm tiêu đề hoặc nội dung yêu cầu
có chứa mã thông báo.

- [ ] **Bước 4: Thực hiện quy trình tuần hoàn giữa các vai trò**

Sử dụng các hành động/bộ chọn giao diện người dùng này và các chuyển đổi dự kiến:

```text
Thành viên A /borrowing/new
  -> chọn tiêu đề/bản sao dành riêng cho lượt chạy
  -> click Gửi yêu cầu mượn
  -> success Yêu cầu #<id> đã được tạo

Thủ thư /librarian/borrow-requests
  -> tìm yêu cầu dành riêng cho lượt chạy
  -> Duyệt -> Duyệt và cấp sách
  -> success Đã duyệt yêu cầu

Thành viên B /reservations/mine
  -> tìm ứng viên dành riêng cho lượt chạy
  -> Đặt chỗ
  -> thành công và hàng đợi ở trạng thái ACTIVE
```

Chạy `inspect`, trích xuất chính xác Thành viên A `BorrowDetailId`, sau đó chạy `age` cho ID đó. Làm
mới `/librarian/returns` và xác nhận hàng đã quá hạn.

```powershell
$inspection = & tmp/staging-acceptance/kudu-runner.ps1 -Phase inspect -RunId $acceptanceRunId -ManifestPath $manifestPath
$borrowDetailId = [int](($inspection | ConvertFrom-Json).ids.memberABorrowDetailId)
if ($borrowDetailId -le 0) { throw 'Member A borrow detail was not found in the exact manifest.' }
& tmp/staging-acceptance/kudu-runner.ps1 -Phase age -RunId $acceptanceRunId -ManifestPath $manifestPath -BorrowDetailId $borrowDetailId
```

Tiếp tục thông qua giao diện người dùng:

```text
Thủ thư /librarian/returns
  -> Xác nhận trả sách -> Ghi nhận trả sách
  -> trả sách thành công và thao tác bàn giao hàng đợi hiển thị

Thủ thư /librarian/fines
  -> Tính tiền phạt
  -> nhập chính xác BorrowDetailId
  -> Tính từ dữ liệu mượn trả
  -> một khoản phạt UNPAID có overdueDays và số tiền lớn hơn 0

Thủ thư /librarian/reservations
  -> Giữ sách & thông báo -> Xác nhận giữ sách
  -> đặt chỗ của Thành viên B chuyển thành NOTIFIED/sẵn sàng

Thành viên B /notifications
  -> thông báo đặt chỗ sẵn sàng thuộc về Thành viên B
  -> liên kết mở /reservations/mine và bản ghi dành riêng cho lượt chạy ở trạng thái sẵn sàng

Thủ thư /reports/borrowing và /home
  -> các thẻ báo cáo/vận hành phản ánh trạng thái máy chủ mà không có lỗi trình duyệt

Quản trị viên /admin/users -> Kiểm toán
  -> các tác nhân/hành động thành viên và lưu thông dự kiến xuất hiện mà không có trường bí mật
```

- [ ] **Bước 5: Khẳng định bất biến của bảng kê khai**

Chạy `inspect` và yêu cầu:

```text
Tư cách thành viên của Thành viên A và Thành viên B = APPROVED
BorrowDetail của Thành viên A = RETURNED
bản sao dành riêng cho lượt chạy = RESERVED sau khi xử lý hàng đợi
đặt chỗ của Thành viên B = NOTIFIED
đúng một khoản phạt của dữ liệu kiểm thử = UNPAID với số tiền > 0
Thành viên B có thông báo đặt chỗ sẵn sàng
cả bốn người dùng giữ đúng một vai trò dự kiến
không có bản ghi ngoài các ID trong bảng kê khai bị báo cáo là đã thay đổi bởi các giai đoạn dữ liệu kiểm thử
lỗi bảng điều khiển/trang trình duyệt = []
```

Bất kỳ sự không khớp nào sẽ đánh dấu kịch bản `FAIL` nhưng vẫn tiến hành dọn dẹp Nhiệm vụ 4.

---

### Nhiệm vụ 4: Dọn dẹp cuối cùng và chứng minh việc hủy kích hoạt

**Tệp:**

- Thực hiện tạm thời: `tmp/staging-acceptance/{kudu-runner.ps1,fixture.js}`
- Cập nhật bảng kê khai bị bỏ qua: trạng thái dọn dẹp trên mỗi ID đối tượng chính xác.

**Giao diện:**

- Tiêu thụ: ID tệp kê khai chính xác cho dù Nhiệm vụ 3 đã thành công hay thất bại.
- Tạo ra: `CLEANED`, `PARTIAL_CLEANUP` hoặc `FAILED_CLEANUP` cùng với các bước kiểm tra xác thực sau khi dọn dẹp.

- [ ] **Bước 1: Đăng xuất mọi bối cảnh trình duyệt và xóa trạng thái xác thực cục bộ**

Khối Playwright `finally` phải gọi luồng đăng xuất sản phẩm ở nơi có thể truy cập, sau đó xóa
cookie, localStorage và sessionStorage cho mọi ngữ cảnh. Nó chỉ được giữ lại một mã thông báo đã
phát hành trước đó trong bộ nhớ để xác nhận thu hồi.

- [ ] **Bước 2: Chạy chức năng dọn dẹp và xác minh ID chính xác**

```powershell
& tmp/staging-acceptance/kudu-runner.ps1 -Phase cleanup -RunId $acceptanceRunId -ManifestPath $manifestPath
& tmp/staging-acceptance/kudu-runner.ps1 -Phase verify-cleanup -RunId $acceptanceRunId -ManifestPath $manifestPath
```

Dự kiến: mọi trạng thái đối tượng là `CLEANED`; không có thao tác dọn dẹp ký tự đại diện và không có
thao tác xóa vật lý nào xảy ra.

- [ ] **Bước 3: Chứng minh thông tin đăng nhập và mã thông báo không còn hoạt động**

Thông qua ngữ cảnh yêu cầu Playwright/API:

```text
đăng nhập bằng từng tài khoản trong bốn tài khoản -> 401 INVALID_CREDENTIALS
GET /api/auth/me bằng mã thông báo cũ được giữ lại -> 401
GET /api/books không hiển thị sách không hoạt động dành riêng cho lượt chạy
```

Chỉ ghi lại trạng thái/mã lỗi.

- [ ] **Bước 4: Xóa tất cả trạng thái tạm thời chứa bí mật**

Xóa `$acceptanceCredentials` và tất cả các biến `STAGING_*_PASSWORD`, xóa chính xác đầu vào/tập lệnh
từ xa thông qua Kudu, sau đó xóa các tệp nguồn tạm thời cục bộ bằng `apply_patch`. Chỉ giữ bản kê
khai không bí mật cho đến khi hồ sơ xem xét hoàn tất; sau đó xóa nó sau khi xác minh hồ sơ liên tục
chứa tất cả bằng chứng cần thiết.

Xóa các biến môi trường một cách rõ ràng:

```powershell
$acceptanceCredentials = $null
@(
  'STAGING_MEMBER_A_PASSWORD','STAGING_MEMBER_B_PASSWORD',
  'STAGING_LIBRARIAN_PASSWORD','STAGING_ADMIN_PASSWORD'
) | ForEach-Object { Remove-Item -LiteralPath "Env:$_" -ErrorAction SilentlyContinue }
```

Nếu việc dọn dẹp không phải là `CLEANED`, hãy dừng: không chạy lại, không xóa bảng kê khai và không
đóng bất kỳ tác vụ chấp nhận trực tiếp nào.

---

### Nhiệm vụ 5: Viết dẫn chứng và đối chiếu có điều kiện tình trạng nhiệm vụ

**Tệp:**

- Tạo: `.sdd/reviews/release-closeout-staging-acceptance-2026-08-02.md`
- Sửa đổi có điều kiện: `.sdd/specs/feat-membership-management/{PLAN,TASKS,CHANGELOG}.md`
- Sửa đổi có điều kiện: `.sdd/specs/feat-user-role-management/{TASKS,CHANGELOG}.md`
- Sửa đổi có điều kiện: `.sdd/traceability.yaml`

**Giao diện:**

- Tiêu thụ: ma trận kịch bản được sắp xếp lại, SHA/URL chạy chính xác, bằng chứng dọn dẹp, quyết định H2.
- Tạo ra: bằng chứng trung thực liên tục và chỉ hỗ trợ các thay đổi về hộp kiểm/trạng thái.

- [ ] **Bước 1: Tạo bản ghi đánh giá với cấu trúc phần chính xác**

Trước khi viết quyết định kết thúc trực tiếp, hãy chạy lại hai bộ trình duyệt cục bộ tập trung sở
hữu lỗ hổng phân tích lịch sử của Windows:

```powershell
npx playwright test tests/e2e/fe04-admin-membership-review.spec.js tests/e2e/fe11-admin-request-management.spec.js --project=chromium --workers=1
```

Dự kiến: các xác nhận đã vượt qua và quy trình Playwright thoát khỏi `0` mà không hết thời gian chờ
phân tách webServer. Bảo toàn kết quả thoát và bằng chứng ảnh chụp màn hình/tràn đáp ứng; không đánh
dấu khoảng trống cục bộ là hoàn thành nếu quá trình bị treo hoặc hết thời gian.

```markdown
# Nghiệm thu tiền sản xuất khi kết thúc phát hành - 2026-08-02

## Quyết định
## Mốc cơ sở và mục tiêu đã triển khai
## Hợp đồng dữ liệu kiểm thử tổng hợp
## Ma trận vai trò đã xác thực
## Ma trận kịch bản liên vai trò
## Ma trận trải nghiệm máy tính/di động
## Ma trận từ chối ủy quyền
## Bằng chứng bất biến do máy chủ suy ra
## Bằng chứng dọn dẹp và thu hồi mã thông báo
## Bảng quyết định kết thúc nhiệm vụ
## Rủi ro còn lại và người sở hữu
```

Mỗi hàng ma trận bao gồm tác nhân, tuyến giao diện người dùng, phương thức/đường dẫn API, trạng thái
dự kiến, trạng thái thực tế, đạt/không đạt và tên tạo tác được xử lý lại. Không bao gồm thông tin xác
thực, giá trị mã thông báo/cookie/tiêu đề, siêu dữ liệu kiểm tra thô hoặc email tổng hợp đầy đủ.

- [ ] **Bước 2: Áp dụng chính xác bảng quyết định khóa sổ**

```text
FE04-ADM05:
  chỉ đủ điều kiện sau khi FE04-ADM04 và FE04-CONV-001 đủ điều kiện, kịch bản PASS, dọn dẹp CLEANED, máy tính/di động PASS và H2 tổng hợp được phê duyệt.

FE04-CONV-001:
  chỉ đủ điều kiện nếu lệnh Playwright cục bộ tập trung FE04/FE11 thoát với mã 0, không lặp lại lỗi hết thời gian dừng webServer trên Windows và vẫn có bằng chứng ảnh chụp/tràn giao diện thích ứng.

FE04-ADM04:
  chỉ đủ điều kiện với cùng bằng chứng Playwright cục bộ tập trung, thoát sạch như FE04-CONV-001.

FE04-CONV-002:
  vẫn để mở trừ khi cùng bộ bằng chứng có xác nhận rõ ràng của chủ sở hữu liên chức năng và phê duyệt phát hành cuối cùng của con người.

FE11-UXR07:
  đủ điều kiện sau khi Azure có xác thực trên máy tính/di động PASS + dọn dẹp CLEANED + H2 tổng hợp được phê duyệt.

FE11-UXR08:
  chỉ đủ điều kiện nếu các xác nhận về thanh bên đủ tám mục, không có Quyền hạn, người dùng thích ứng, mật độ/bộ lọc/danh sách cho phép kiểm toán và bốn kích thước khung nhìn đều PASS.

FE11-UXR09:
  chỉ đủ điều kiện nếu FE04-ADM05 cũng đủ điều kiện và Duyệt hội viên được chứng minh trong lớp bao Quản trị viên tám mục gốc ở cả bốn kích thước khung nhìn.

FE11-PDO04:
  chỉ đủ điều kiện nếu bằng chứng mã nguồn/kiểm thử hiện có được xác minh lại, giao diện Quản trị viên trực tiếp không có hành động sửa hồ sơ và yêu cầu trực tiếp tới tuyến hồ sơ cá nhân đã ngừng dùng trả về 404 mà không thay đổi dữ liệu.
```

Các mục bị lỗi hoặc không được phát hiện sẽ giữ `[ ]`; thêm văn bản bằng chứng mà không cần chuyển
đổi chúng để hoàn thành.

- [ ] **Bước 3: Chạy xác thực bốn lớp**

```powershell
npm --prefix backend test -- --runInBand
npm --prefix backend run test:coverage:ci
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run audit:high
npm run test:system
npm run test:e2e
npm run test:deployment
npm run trace:enforce
npm run test:secrets
git diff --check
```

Dự kiến: mọi cổng được định cấu hình đều thoát khỏi `0`; Kiểm tra giao diện người dùng chỉ có thể in
lời khuyên về Bộ định tuyến React đã được kiểm soát và phần bảo vệ của nó phải vượt qua.

- [ ] **Bước 4: Dừng để xem xét H2 tổng hợp**

Trình bày sự khác biệt liên tục, số lượng xác thực chính xác, quyết định kịch bản, quyết định dọn
dẹp và danh sách các nhiệm vụ được giữ mở. Không cam kết, đẩy, mở PR, hợp nhất hoặc xóa bằng chứng
còn lại cho đến khi người dùng cấp H2.
