# CHANGELOG.md - FE01 Công khai / Duyệt sách

## 2026-08-03 - Hoàn tất triển khai cục bộ circulation action v0.5.0

- Bổ sung `circulationAction` public-safe với thứ tự `BORROW`/`RESERVE`/`WAIT`/
  `UNAVAILABLE`, fallback fail-closed và giữ nguyên `availabilityStatus`.
- HomePage của Thành viên chỉ điều hướng với `BORROW`/`RESERVE`; hai trạng thái còn
  lại bị vô hiệu hóa trên mọi bề mặt. Backend tập trung đạt `62/62`, frontend tập
  trung đạt `22/22`, Chromium liên FE01/FE07 đạt `4/4`.
- Full gate hiện tại đạt backend `1.196/1.196`, frontend `281/281`, deployment
  `20/20`, secrets `5/5` và trace FE01 `20/20` (`100%`); chưa commit/push và
  FE01-T017 vẫn chờ duyệt H2.

## 2026-08-03 - H1 hành động lưu thông trung thực v0.5.0

- Phê duyệt trường public-safe `circulationAction = BORROW | RESERVE | WAIT | UNAVAILABLE`
  để hành động Thành viên không còn suy diễn từ tình trạng vật lý.
- Giữ nguyên `availabilityStatus`, route, schema, enum và quyền sở hữu FE07/FE08.
- Mở FE01-T015..017 theo RED/GREEN; thay đổi sản phẩm giữ chưa commit tới H2.

## 2026-07-27 - Hành động sách rõ ràng cho Thành viên

- Thay nhãn `Tiếp tục` mơ hồ của Thành viên bằng `Mượn sách này` cho sách có sẵn và `Đặt chỗ sách này` cho sách không có sẵn trong thẻ tìm kiếm, bảng thông tin và modal chi tiết.
- Tiếp tục ẩn huy hiệu tình trạng có sẵn đối với Khách/Thành viên; Khách dùng bước tiếp tục đăng nhập chung, còn Thủ thư/Quản trị viên giữ trạng thái và hành động quản lý FE05/FE06.
- Giữ deep link theo `bookId` đã chọn kết nối tới chọn ứng viên mượn FE07 và đặt chỗ FE08.

## 2026-07-27 - Căn chỉnh thẻ lợi ích thành viên

- Loại bỏ độ so le dọc cố định khỏi các thẻ thành viên chẵn để cả hai cột có cùng đường cơ sở theo hàng.
- Giữ các cột responsive có chiều rộng bằng nhau, phản hồi hover trên thẻ và bố cục một cột trên thiết bị di động.
- Thêm độ bao phủ hồi quy frontend tập trung cho hợp đồng lưới không so le.

## 2026-07-27 - Ranh giới ISBN công khai

- Loại ISBN khỏi nội dung tìm kiếm HomePage, thẻ sách, giao diện chi tiết, DTO API công khai và schema OpenAPI của Khách/Thành viên.
- Xác nhận `q` công khai chỉ tìm tiêu đề/tác giả, trong khi thao tác đọc và tìm kiếm quản lý FE05 của Thủ thư/Quản trị viên đã xác thực vẫn giữ ISBN.
- Cập nhật yêu cầu, tiêu chí chấp nhận, nhiệm vụ và chiến lược test FE01 để kết nối ranh giới công khai với FE05 và xác thực vai trò duy nhất FE11.

## 2026-07-27 - Đơn giản hóa header Homepage

- Loại các nhóm `Khám phá sách`, dịch vụ theo đối tượng, `Về thư viện` và `Hỗ trợ` khỏi header desktop và menu header di động theo yêu cầu của chủ sản phẩm.
- Giữ thương hiệu thư viện, điều khiển đăng nhập/tài khoản và hành động tiếp tục nhận biết vai trò ở nơi khác trên HomePage.
- Loại trạng thái, markup, biểu tượng, animation và styling dropdown/accordion không dùng, đồng thời cập nhật độ bao phủ hồi quy tập trung.

## 2026-07-26 - Đồng bộ đặc tả Homepage

- Đồng bộ `CONTEXT.md`, `SPEC.md`, `PLAN.md`, `TASKS.md` và `TEST_PLAN.md` với hợp đồng HomePage hiện tại.
- Loại các tuyên bố đã bị thay thế yêu cầu Khách/Thành viên thấy `Còn sách` hoặc `Không khả dụng`; giữ tình trạng có sẵn từ máy chủ cho định tuyến nội bộ của Thành viên và cách trình bày Thủ thư/Quản trị viên đã phê duyệt.
- Làm rõ Khách dùng `/home`, còn tác nhân đã xác thực dùng `/homepage` để mở trải nghiệm thư viện công khai.
- Ghi nhận các nhóm điều hướng hiện tại: `Khám phá sách`, `Hội viên`/`Thư viện của tôi`/`Nghiệp vụ` nhận biết đối tượng, `Về thư viện` và `Hỗ trợ`.
- Thêm Ma trận kết nối vai trò Homepage có thẩm quyền và độ bao phủ tự động chứng minh mọi đích Khách/Thành viên/Thủ thư/Quản trị viên đều được bộ định tuyến ứng dụng đăng ký.
- Ghi nhận bảng màu footer nhẹ hơn và cách trình bày email một dòng trên desktop mà không thay đổi đích liên hệ hoặc hành vi chính sách.
- Làm mới bằng chứng cục bộ thành frontend duyệt công khai 14/14, frontend tập trung kết hợp 39/39 và truy vết FE01 18/18.

## 2026-07-25 - Cách trình bày liên hệ ở footer Homepage

- Thay các cột liên kết Thư viện, Tài khoản và Hỗ trợ legacy bằng số điện thoại, email và địa chỉ thực của thư viện theo yêu cầu cho footer công khai.
- Thêm hành động điện thoại/email có thể nhấp và thẻ liên hệ responsive mà không thay đổi API FE01, route xác thực hoặc quy tắc nghiệp vụ.
- Thiết kế lại điện thoại, email và địa chỉ thành các nhóm liên hệ biên tập không viền có đường phân cách tinh tế, cùng phương án dự phòng cho máy tính bảng và thiết bị di động.
- Thay anchor Quyền riêng tư, Điều khoản và Cookie trống bằng hộp thoại thông tin có khả năng truy cập, đóng được bằng nút, nền hộp thoại hoặc phím Escape.
- Thêm hiệu ứng lộ footer khi xuất hiện trong khung nhìn, xuất hiện liên hệ so le, ánh vàng môi trường, phản hồi hover biểu tượng/liên kết và phương án dự phòng giảm chuyển động.
- Căn giữa tiêu đề liên hệ footer trên cột Email và loại đường trang trí theo sau.
- Thay bốn nút điều hướng trên cùng giống chỗ giữ chỗ bằng dropdown desktop có animation và accordion di động kết nối tới đích Khách, Thành viên, Thủ thư và Quản trị viên hiện có.
- Mở rộng trang chủ bằng bốn bộ lọc chủ đề được kết nối, hành trình thư viện ba bước và bảng tiếp tục nhận biết vai trò cho Khách, Thành viên, Thủ thư và Quản trị viên.
- Thêm bố cục responsive, hiệu ứng lộ khi xuất hiện trong khung nhìn, phản hồi hover/focus và xử lý giảm chuyển động cho các phần trang chủ mới.
- Hợp nhất toàn bộ phân cấp thị giác trang chủ bằng các dải Hero, danh mục, chủ đề, hành trình, vai trò, thành viên và footer riêng biệt; thêm đường phân cách gradient, trạng thái hover/focus phong phú hơn và hiệu ứng xuất hiện an toàn với chuyển động.
- Đổi cách trình bày tình trạng có sẵn trên HomePage thành chỉ dành cho nhân viên: Khách/Thành viên không còn thấy huy hiệu tình trạng có sẵn hoặc nhãn hành động làm lộ trạng thái, còn Thủ thư/Quản trị viên giữ trạng thái cấp cao và định tuyến quy trình Thành viên vẫn dùng tình trạng có sẵn mới nhất ở nội bộ.

## 2026-07-23 - Hành động sách công khai xuyên vai trò

- Làm rõ mọi vai trò đều có thể sử dụng danh mục công khai trong khi FE01 vẫn chỉ đọc.
- Kết nối hành động Homepage với mô hình tài khoản đúng một vai trò của FE11 để người dùng Thủ thư/Quản trị viên không bị định tuyến vào màn hình FE07/FE08 chỉ dành cho Thành viên.
- Thêm độ bao phủ hồi quy frontend tập trung cho mảng tương thích Thành viên/nhân viên legacy không hợp lệ.

## 2026-07-20 - Bản địa hóa giao diện tiếng Việt và typography

- Bản địa hóa các nhãn, trạng thái, tên hỗ trợ khả năng truy cập và phản hồi lỗi an toàn do frontend tạo cho tính năng này.
- Giữ nguyên hợp đồng API, giá trị enum thô, quyền, quy tắc nghiệp vụ và dữ liệu danh mục/hồ sơ do người dùng sở hữu.
- Áp dụng hợp đồng typography dùng chung với `Be Vietnam Pro` cho nội dung và `Noto Serif` cho tiêu đề, cùng font dự phòng hỗ trợ Unicode.
- Thêm phần tiếp nối khung HomePage responsive được người yêu cầu phê duyệt: điều hướng di động giữ các hành động duyệt, tài khoản và tư cách thành viên hiện có truy cập được mà không đổi route hoặc hành vi API.

## 2026-07-19 - Hoàn tất kết thúc Giai đoạn 2

- feat-public-browse được chấp nhận trong đợt đối soát FE01-FE12 đầy đủ của Giai đoạn 2 được ghi nhận bởi PR #40/#41; ranh giới xác thực và phần tồn dư được hợp nhất trong `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Các giới hạn bị hoãn và thuộc phạm vi tương lai vẫn rõ ràng, không được mở rộng bởi lần hoàn tất này.

## 2026-07-19 - Đã triển khai đối soát duyệt công khai

- Thêm thao tác đọc danh sách/chi tiết chuẩn không cần xác thực với bộ lọc chính xác, phân trang máy chủ, thứ tự ổn định, ẩn sách không hoạt động và DTO công khai an toàn.
- Suy ra `AVAILABLE`/`UNAVAILABLE` từ trạng thái bản sao FE06 hiện tại mà không làm lộ số lượng bản sao hoặc giữ route thể loại legacy.
- Thay hành động dự phòng/giả trên HomePage bằng trạng thái API công khai chuẩn và cách kết xuất null/không khả dụng/lỗi an toàn.
- Đã đạt backend FE01 9/9, frontend 4/4, truy vết 13/13, vệ sinh diff và bằng chứng tình trạng có sẵn SQL dùng một lần; tích hợp thủ công vẫn để ngỏ.

## 2026-07-19 - Đang đối soát an toàn công khai

- Thay nhãn `Đã mượn` làm lộ trạng thái bản sao bằng nhãn công khai an toàn `Không khả dụng` đã được phê duyệt.
- Loại hành vi đăng nhập giả trên trang chủ và định tuyến liên kết lịch sử mượn đã xác thực tới quy trình thật được bảo vệ theo vai trò.
- Phân trang công khai, phép chiếu DTO an toàn, adapter API và bằng chứng nhiệm vụ FE01 tập trung vẫn đang chờ.

## 2026-07-18 - Điều hướng Homepage đã xác thực

- Thêm mục sidebar `Home` riêng cho người dùng Thành viên/Thủ thư/Quản trị viên để mở trang chủ thư viện công khai đã xác thực tại `/homepage`.
- Giữ `/home` làm dashboard `Tổng quan` nhận biết vai trò để hai đích điều hướng vẫn tách biệt.

## 2026-07-17 - Baseline Giai đoạn 1 đã được phê duyệt

- Nhật đã phê duyệt hợp đồng hiển thị công khai, tìm kiếm, phân trang, chi tiết an toàn và tình trạng có sẵn FE01 đã chuẩn hóa làm baseline Giai đoạn 1; kế hoạch và phân rã nhiệm vụ vẫn đang chờ.

## 2026-07-17 - Phân rã kế hoạch triển khai

- Thêm kế hoạch triển khai FE01 đã phê duyệt và chuỗi nhiệm vụ FE01-T001 đến FE01-T008.
- Xác định ranh giới đọc công khai dùng chung FE01/FE05, quyền sở hữu tình trạng có sẵn FE06, bằng chứng test chuyên biệt và đối soát sai lệch frontend/API rõ ràng.
- Cập nhật `TEST_PLAN.md` theo hợp đồng truy vấn, phân trang, trường an toàn và tình trạng có sẵn chuẩn; triển khai vẫn đang chờ.

## 2026-07-17 - Kiểm toán cuối cùng hợp đồng duyệt

- Đưa sách công khai gần đây vào hợp đồng trang chủ trong khi giữ nội dung nổi bật ngoài phạm vi.
- Loại hành vi điểm nhấn tùy chọn và làm cho bộ lọc tìm kiếm/xử lý cơ sở dữ liệu có tính xác định.

## 2026-07-17 - Củng cố phạm vi bộ lọc công khai

- Xác định các trường truy vấn Giai đoạn 1 chính xác và ngữ nghĩa khớp `q`.
- Loại alias `/api/public/*` tùy chọn khỏi hợp đồng API chuẩn.

## 2026-07-17 - Hợp đồng duyệt có tính xác định

- Nâng `SPEC.md` lên 0.3.1 và giữ bản sửa đổi ở trạng thái `READY FOR REVIEW`.
- Tìm kiếm trống giờ trả về trang mặc định đầu tiên; mặc định/giới hạn phân trang và thứ tự ổn định được nêu rõ.
- Phân biệt lỗi validation cho ID/giá trị truy vấn sai định dạng với `404` cho sách đúng định dạng nhưng bị thiếu/bị ẩn.
- Siêu dữ liệu danh mục tùy chọn bị thiếu giờ trả về `null` cùng giá trị dự phòng giao diện thay vì loại sách.
- Hoàn tất truy vết BR/FR/AC với ý định test đã lập kế hoạch rõ ràng.

## 2026-07-15 - Quyền sở hữu tình trạng có sẵn chỉ đọc (v0.3.0)

- Loại phụ thuộc FE01 vào cập nhật trạng thái bản sao thủ công của FE05.
- Làm rõ FE06/FE07/FE08 sở hữu các lần chuyển trạng thái bản sao và FE01/FE05 chỉ đọc tóm tắt tình trạng có sẵn đã xác nhận mới nhất.
- Chuẩn hóa cách hiển thị công khai đơn giản thành `Còn sách` / `Không khả dụng`, loại cách diễn đạt điều kiện lỗi thời và giữ số lượng bản sao chính xác ở chế độ riêng tư.

## 2026-06-10

- Tạo cấu trúc đặc tả tính năng FE01 Công khai / Duyệt sách.
- Thiết lập các tệp đặc tả: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md và CHANGELOG.md.
- Căn chỉnh người phụ trách và phạm vi phân công với bảng phân công mới nhất: UC01-UC04 và FT01-FT04 do Dung phụ trách.
- Xác định FE01 là tính năng duyệt công khai chỉ đọc và tách khỏi quản lý danh mục FE05 cùng quản lý bản sao FE06.
- Làm rõ chính sách hợp đồng API để endpoint REST có thể ở lại SPEC.md trừ khi nhóm đưa tệp hợp đồng API dùng chung trở lại.

## 2026-06-10 - Quyết định review Giai đoạn 1 đã được phê duyệt

- Phê duyệt các quyết định cho câu hỏi mở từ `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Cập nhật trạng thái quyết định trong `SPEC.md` từ bản nháp/đề xuất/để ngỏ thành đã phê duyệt ở nơi áp dụng.
- Giữ rõ ràng kiểm soát phạm vi Giai đoạn 1 và các hạng mục công việc tương lai bị hoãn.

## 2026-06-21

- Căn chỉnh hợp đồng API FE01 với route prototype hiện tại: duyệt công khai dùng `/api/books` và `/api/books/{bookId}`.
- Giữ route `/api/public/*` làm alias tương lai tùy chọn thay vì đường triển khai bắt buộc.

## 2026-06-30

- Nâng phiên bản `SPEC.md` lên 0.2.0 và cập nhật Lần cập nhật cuối thành 2026-06-30.
- Thêm quy tắc đồng bộ tình trạng có sẵn FE05/FE06 -> FE01 để `/home`, tìm kiếm công khai và chi tiết sách hiển thị tóm tắt `BookCopies.Status` mới nhất.
- Làm rõ duyệt công khai chỉ hiển thị tình trạng có sẵn đơn giản (`Còn sách` / `Đã mượn`) và không bao giờ làm lộ barcode bản sao, dữ liệu người mượn, vị trí, khoản phạt hoặc trường kho chỉ dành cho nhân viên.
- Thêm BR-FE01-011..012, FR-FE01-009..010, AC-FE01-009, EC-FE01-011 và Q-FE01-007.
