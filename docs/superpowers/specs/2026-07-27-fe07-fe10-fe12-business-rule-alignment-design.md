# FE07/FE10/FE12 Thiết kế liên kết quy tắc nghiệp vụ

**Trạng thái:** ĐƯỢC PHÊ DUYỆT - LATEST-MAIN RECONCILIATION ADDENDUM 2026-07-27

**Thiết kế đã được phê duyệt trong cuộc thảo luận:** 2026-07-27

**Người phê duyệt bằng văn bản:** Nhật (Chủ sở hữu SPEC và người phê duyệt doanh nghiệp dự án)

**đặc tả bằng văn bản đã được phê duyệt:** 2026-07-27

**Phương thức phân phối:** Kết hợp, Chiều sâu đầy đủ cho các quy tắc cốt lõi

## 1. Quyết định và phạm vi

Lô này sửa năm hợp đồng cốt lõi bị ràng buộc:

1. FE07 tuân theo quyết định một tài khoản/một vai trò trên toàn dự án. Thành viên
gia hạn chỉ dành cho chủ sở hữu và gia hạn giữa các thành viên Thư viện/Quản trị viên vẫn là các
đường dẫn một vai trò riêng biệt; kịch bản đổi mới đa vai trò trước đây được thay thế.
2. FE07 trả sách dữ liệu đầu ra và kiểm tra sử dụng ngày đến hạn bị khóa bởi cơ quan có thẩm quyền
   giao dịch trả sách.
3. FE07 việc gia hạn sử dụng trình trợ giúp ngày làm việc `Asia/Ho_Chi_Minh` được chia sẻ cho
   đủ điều kiện và gia hạn thời hạn.
4. FE10 từ chối định nghĩa mẫu được lưu trữ không an toàn trước khi hiển thị,
kiên trì hoặc phân phối trong khi tiếp tục thoát hoặc loại bỏ các giá trị mẫu thời gian chạy.
5. FE12 từ chối mọi khóa truy vấn nằm ngoài danh sách cho phép điểm cuối chính xác trước
   báo cáo hoạt động của dịch vụ hoặc kho lưu trữ.

FE08 không có quy tắc sản phẩm mới do nhánh tác giả trong lô này. Kết quả tích hợp duy trì quy tắc
cho vay hiện tại cùng một cuốn sách ngược dòng từ `main` và FE08 vẫn là ranh giới hồi quy tích hợp
vì FE07 đọc các yêu cầu đặt chỗ và FE10 nhận được yêu cầu thông báo FE08.

Không có lược đồ cơ sở dữ liệu, tuyến đường công cộng, vai trò, loại thông báo, trường báo cáo hoặc
quy trình làm việc ở giao diện người dùng nào được thêm vào.

## 2. Sổ cái nguồn-sự thật

| Mã nguồn | Nguồn và vị trí | Sửa đổi/ngày | Bằng chứng nó có thể chứng minh | Cấp thẩm quyền | Chủ sở hữu | Xung đột |
| --- | --- | --- | --- | --- | --- | --- |
| S-001 | Quyết định của người dùng trong tác vụ đang hoạt động | 27-07-2026 | Các lựa chọn được phê duyệt cho dữ liệu ủy quyền/thời gian/giao dịch FE07, chính sách từ chối FE10, danh sách cho phép FE12 và phạm vi FE08 | Cao nhất cho lát giới hạn này | Nhật | Không có sau khi phê duyệt |
| S-002 | `.sdd/constitution.md`, `.sdd/shared_context.md`, `.sdd/constraints/*.md` | `origin/main` và `359fb25` | Luật dự án, tác nhân, bộ công nghệ, quy tắc một tài khoản/một vai trò, ủy quyền máy chủ, xác thực và an toàn | mốc cơ sở được phê duyệt trên toàn dự án | Đội | Thay thế tiền đề đa vai trò trong BD-001 gốc |
| S-003 | Các tệp FE07/FE10/FE12 `SPEC.md` | Các bản sửa đổi bằng văn bản trong `3220f10`, được phê duyệt 27-07-2026 | Hợp đồng BR/FR/AC/API ổn định cho đợt này | mốc cơ sở chức năng | Nhật | Không có |
| S-004 | Triển khai và kiểm thử FE07/FE10/FE12 hiện tại | Cơ sở sản phẩm trước `3220f10` | Chỉ hành vi được quan sát và các lỗi có thể tái tạo | Quan sát, không quy chuẩn | Đội ngũ kỹ thuật | Mâu thuẫn với các quyết định đã được phê duyệt |
| S-005 | `docs/superpowers/specs/2026-07-23-fe07-fe08-fe10-fe12-final-verification-remediation-design.md` | Phê duyệt 2026-07-23 | Giao dịch hiện tại, múi giờ, thông báo và ranh giới tương đương báo cáo | Phê duyệt thiết kế trước | Nhật | Không giải quyết được 5 lỗ hổng mới |
| S-006 | Xác nhận của người dùng trong tác vụ đang hoạt động | 27-07-2026 | Mỗi tài khoản có chính xác một vai trò; nhiều vai trò cho mỗi tài khoản không được hỗ trợ | Cao nhất cho phụ lục hòa giải | Nhật | Giải quyết xung đột `main`/mô hình vai trò nhánh |
| S-007 | FE07/FE08 ngược dòng mới nhất SPEC/PLAN/TASKS và triển khai | `origin/main` và `e20fdc3` | FE08 chuyển giao sách đã chọn/lịch sử hiện tại/nhận, lựa chọn trước sao chép chính xác FE07, ID tác vụ `FE07-T048` và `FE08-T042..T044` cũng như nhãn vòng đời | mốc cơ sở hợp nhất đã được phê duyệt | Đội | Chồng chéo ID tác vụ cục bộ của nhánh và nhãn E2E cũ trung gian |
| S-008 | FE07/FE08 ngược dòng mới nhất SPEC/PLAN/TASKS và triển khai | `origin/main` và `e99daf5` | FE07 tín hiệu cho vay hiện tại, FE08 ứng viên/tạo/loại trừ hàng đợi cùng cuốn sách, khóa lưu thông Thành viên được chia sẻ và `FE08-T045` ngược dòng | mốc cơ sở hợp nhất đã được phê duyệt | Đội | Chồng chéo ID nhiệm vụ hồi quy nhánh-cục bộ |
| S-009 | Hợp đồng và triển khai FE07/FE08/FE09/FE11 ngược dòng mới nhất | `origin/main` và `8d0059b` | FE08 vị trí hàng đợi có phạm vi sao chép, FE09 bối cảnh riêng chỉ dành cho thành viên, từ ngữ đối tượng FE11 và ID tác vụ ngược dòng `FE08-T046`/`FE09-T024` | mốc cơ sở hợp nhất đã được phê duyệt | Đội | Phiên bản song song và va chạm `FE08-T046`; khoảng cách giao diện người dùng null |

## 3. Phân loại bằng chứng và xung đột

| ID bằng chứng | Phân loại | Bằng chứng hiện tại | Độ phân giải bắt buộc |
| --- | --- | --- | --- |
| E-001 | `unresolved-conflict` được giải quyết bởi S-002/S-006 | Nhánh ban đầu theo mô hình gia hạn `MEMBER + LIBRARIAN`, trong khi `main` hiện tại thực thi một vai trò cho mỗi tài khoản. | Loại bỏ kịch bản đa vai trò và duy trì các lộ trình gia hạn Thành viên và nhân viên riêng biệt. |
| E-002 | `observed-behavior` | Việc gia hạn đồng thời có thể thay đổi ngày đến hạn bị khóa trong khi phản hồi trả về vẫn tính toán `fineCandidate.overdueDays` từ dữ liệu trước chuyến bay cũ. | Lấy siêu dữ liệu đầu ra và kiểm tra dữ liệu từ các giá trị bị khóa giao dịch. |
| E-003 | `observed-behavior` | Gia hạn ngày gia hạn khác nhau tùy theo múi giờ của máy chủ vì `Date.setDate()` trên máy chủ cục bộ được sử dụng. | Sử dụng riêng những người trợ giúp ngày làm việc được chia sẻ. |
| E-004 | `unresolved-conflict` được giải quyết bởi S-001 | FE10 EC-FE10-010 yêu cầu từ chối, trong khi NFR-FE10-SEC-005 cho phép dọn dẹp định nghĩa được lưu trữ không an toàn. | Từ chối định nghĩa được lưu trữ; thoát/khử trùng các giá trị thời gian chạy. |
| E-005 | `observed-behavior` | FE12 chấp nhận khóa truy vấn không xác định, trả về `200` và chuyển tiếp nó đến lớp báo cáo. | trả sách `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` an toàn trước khi thực hiện báo cáo. |
| E-006 | `integration-conflict` được giải quyết bởi S-006/S-007 | `main` trước đây sở hữu `FE07-T048` và `FE08-T042..T044` và sử dụng `Đang đặt chỗ`/`Đến lượt bạn`; nhánh đã sử dụng các ID nhiệm vụ chồng chéo và E2E trung gian của nó dự kiến ​​là `Đã đặt chỗ`. | Duy trì hành vi sao chép được lưu giữ ngược dòng, đánh số lại các tác vụ căn chỉnh quy tắc thành `FE07-T049..T052` và `FE08-T047`, giữ lại cách diễn đạt một vai trò và không thêm thay đổi sản xuất FE08 trùng lặp. |
| E-007 | `integration-conflict` được giải quyết bởi S-008 | `main` mới nhất chỉ định `FE08-T045` cho quy tắc cho vay hiện tại cùng sổ đã được phê duyệt, trong khi nhánh trước đây đã sử dụng ID đó để xác minh chỉ hồi quy. | Giữ nguyên `FE08-T045` ngược dòng, di chuyển ranh giới hồi quy nhánh sang `FE08-T047`, tích hợp mã ngược dòng không thay đổi và coi các kiểm thử hiện tại của nó là bằng chứng ngược dòng thay vì yêu cầu RED nhánh mới. |
| E-008 | `integration-conflict` được giải quyết bởi S-009 | `main` chỉ định `FE08-T046` cho các vị trí hàng đợi trong phạm vi sao chép trong khi nhánh sử dụng cùng một ID cho bằng chứng hồi quy; giao diện người dùng đến ánh xạ vị trí bị thiếu thành null nhưng hiển thị `#null`. | Tiếp tục ngược dòng `FE08-T046`, di chuyển bằng chứng hồi quy nhánh sang `FE08-T047`, nâng FE08 lên v0.5.10, yêu cầu `Chưa xác định` ở trạng thái rỗng và chứng minh bản trình bày giới hạn đã sửa lỗi RED-GREEN trước khi xác thực đầy đủ. |

Việc thực hiện là bằng chứng về hành vi hiện tại chứ không phải là nguồn gốc của chính sách kinh
doanh đã được phê duyệt.

## 4. Nhật ký quyết định kinh doanh

| ID quyết định | ID lát | Câu hỏi | Các lựa chọn được xem xét | Quyết định phê duyệt | Cơ sở lý luận | Người phê duyệt | Ngày quyết định | Yêu cầu bị ảnh hưởng |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BD-001 | SL-001 | Vai trò nào kiểm soát quyền sở hữu của một tác nhân đổi mới đa vai trò? | Ưu tiên thành viên; nhân viên là trên hết; từ chối mọi hành động đa vai trò của nhiều thành viên | Bị thay thế bởi BD-007 sau khi `DEC-GEN-005` đạt `main`; tài khoản đa vai trò không được hỗ trợ | Tiền đề ban đầu không còn tồn tại trong mô hình tài khoản được phê duyệt | Nhật | 27-07-2026 | Chỉ lịch sử |
| BD-002 | SL-002 | Ngày đến hạn nào là có thẩm quyền sau khi có sự thay đổi đồng thời? | Giá trị trước chuyến bay; giá trị bị khóa giao dịch | Giá trị giao dịch trả sách bị khóa thúc đẩy thao tác ghi, `fineCandidate` và siêu dữ liệu kiểm tra | Ngăn chặn phản hồi/kiểm tra trôi dạt khỏi trạng thái đã cam kết | Nhật | 27-07-2026 | BR-FE07-014, FR-FE07-007/008, AC-FE07-008 |
| BD-003 | SL-003 | Số học lịch nào chi phối việc gia hạn? | Máy chủ cục bộ `Date`; UTC; ngày kinh doanh thư viện chia sẻ | Người trợ giúp `Asia/Ho_Chi_Minh` được chia sẻ quản lý tính đủ điều kiện và `dueDate + 14` | Chính sách này dựa trên ngày dương lịch và không phụ thuộc vào máy chủ | Nhật | 27-07-2026 | BR-FE07-015, FR-FE07-009/020, NFR-FE07-TIME-001 |
| BD-004 | SL-004 | Đánh dấu mẫu được lưu trữ không an toàn nên được xử lý như thế nào? | Vệ sinh và chấp nhận; từ chối; cho phép HTML thô | Từ chối trước khi kết xuất/kiên trì/phân phối; tiếp tục thoát/làm sạch các giá trị thời gian chạy | Định nghĩa được lưu trữ là cấu hình đáng tin cậy và phải đóng không thành công | Nhật | 27-07-2026 | BR-FE10-010, FR-FE10-005/009, AC-FE10-006, NFR-FE10-SEC-005 |
| BD-005 | SL-005 | Điều gì xảy ra với các khóa truy vấn FE12 không xác định? | Phớt lờ; phía trước; từ chối | Từ chối bằng `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` an toàn trước khi thực thi dịch vụ/kho lưu trữ | Ngăn chặn sự trôi dạt API im lặng và hành vi truy vấn chưa được xem xét | Nhật | 27-07-2026 | BR-FE12-008, FR-FE12-005, AC-FE12-005 |
| BD-006 | SL-006 | Phần căn chỉnh quy tắc có yêu cầu thay đổi quy tắc sản phẩm trong FE08 không? | Sửa đổi FE08; chỉ hồi quy | Không có thay đổi hành vi FE08 độc lập nào trong lát cắt này; duy trì và xác minh các chuyển giao FE07/FE10 ngược dòng | Không có lỗi FE08 độc lập nào được phát hiện trong cuộc kiểm tra này | Nhật | 27-07-2026 | Hợp đồng tích hợp FE08 hiện có và ngược dòng |
| BD-007 | SL-001 | Ủy quyền gia hạn hoạt động thế nào sau quyết định một vai trò? | Duy trì tương thích đa vai trò; một vai trò cho mỗi tài khoản | Mỗi tài khoản có chính xác một vai trò. Thành viên chỉ gia hạn chi tiết của mình; Thủ thư/Quản trị viên có thể gia hạn chi tiết của bất kỳ thành viên nào trong khi các điều kiện chặn của chủ sở hữu lượt mượn vẫn được thực thi | Phù hợp `DEC-GEN-005` và loại bỏ mô hình tác nhân bất khả thi | Nhật | 27-07-2026 | BR-FE07-003/031, FR-FE07-009/032, AC-FE07-009/026 |

## 5. Ma trận trách nhiệm của tác nhân

Mỗi ô bên dưới là một `approved-requirement` cho lát giới hạn này và xuất phát từ các quyết định
hoạt động BD-002 đến BD-007 cộng với các hợp đồng chức năng đã được phê duyệt hiện có. BD-001 là
lịch sử và được thay thế.

| Diễn viên | Mục tiêu kinh doanh | Có thể bắt đầu | Không được biểu diễn | Chuyển đổi trạng thái thuộc sở hữu | Phạm vi đọc/ghi dữ liệu | Bàn giao | Con đường thất bại |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Tài khoản thành viên | Gia hạn lượt mượn của mình khi đủ điều kiện | Gia hạn lượt mượn của mình | Gia hạn chi tiết của thành viên khác hoặc dùng thao tác nhân viên | Không sở hữu trực tiếp state; transaction FE07 sở hữu thao tác ghi | Chỉ sở hữu hồ sơ mượn | FE07 có thể xếp hàng thông báo FE10 | Yêu cầu chéo thành viên trả về `403` do kiểm tra chủ sở hữu |
| Tài khoản thủ thư/quản trị viên | Xử lý việc gia hạn hoặc trả sách thành viên đủ điều kiện | Gia hạn và trả sách nhiều thành viên | Sử dụng các quy tắc tự phục vụ của thành viên hoặc bỏ qua tính đủ điều kiện của chủ sở hữu lượt mượn, khoản phạt, quá hạn, đặt chỗ hoặc giới hạn gia hạn | Cho phép giao dịch FE07; không sở hữu dữ liệu nguồn ngoài FE07 | Phạm vi mượn nhân viên | FE07 đọc các xác nhận quyền sở hữu FE08 và hiển thị dữ liệu trả về FE09 | Trình chặn doanh nghiệp trả về 4xx an toàn mà không bị thao tác ghi |
| Giao dịch hoàn trả FE07 | Cam kết một kết quả trả sách có thẩm quyền | thao tác ghi khóa nội bộ | Sử dụng ngày đến hạn trước chuyến bay cũ để phản hồi hoặc kiểm tra | Chi tiết/sao chép/yêu cầu/kiểm tra các thay đổi trong một giao dịch | Đã khóa hàng mượn/sao chép/reservation | Tiếp xúc `fineCandidate` với FE09 | Khôi phục tất cả trạng thái khi thất bại |
| Nguồn/công nhân FE10 | Gửi thông báo đã được phê duyệt | Chỉ hiển thị sau khi xác thực yêu cầu và mẫu | Chấp nhận định nghĩa mẫu được lưu trữ không an toàn hoặc hiển thị các giá trị giống bí mật | Chỉ vòng đời thông báo FE10 | Bản ghi thông báo/mẫu và ranh giới của nhà cung cấp | Nhận các sự kiện thuộc sở hữu của nguồn | Từ chối an toàn không tạo ra thông báo/cố gắng |
| Người xem báo cáo của Thủ thư/Quản trị viên | Đọc báo cáo đã được phê duyệt | Danh sách cho phép truy vấn điểm cuối chính xác | Thêm hành vi truy vấn tùy ý hoặc sửa đổi bản ghi nguồn | Không có; báo cáo ở chế độ chỉ đọc | Dữ liệu tổng hợp/chi tiết được phê duyệt | FE12 đọc bản ghi chức năng nguồn | Khóa không xác định trả về `400` an toàn trước khi thực hiện báo cáo |

## 6. Hợp đồng lát cắt kinh doanh

| ID lát | Diễn viên và kết cục | Kích hoạt | Điều kiện tiên quyết | Con đường hạnh phúc | Đường dẫn thay thế/thất bại | Quy tắc/tính toán | Bất biến trạng thái | Quyền/quyền sở hữu dữ liệu | Ví dụ chấp nhận | Phân loại |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SL-001 | Người đảm nhiệm một vai trò gia hạn trong phạm vi được phê duyệt | Cuộc gọi điểm cuối gia hạn | Diễn viên có đúng một vai; chi tiết được mượn | Chủ sở hữu thành viên hoặc Thủ thư/Quản trị viên vượt qua ủy quyền, sau đó tính đủ điều kiện của chủ sở hữu được kiểm tra và cam kết gia hạn | Thành viên nhắm mục tiêu chủ sở hữu khác bị từ chối; nhân viên sử dụng thành viên tự phục vụ bị từ chối | Thành viên chỉ là chủ sở hữu; nhân viên là thành viên chéo | Không có trình chặn hoặc thao tác ghi ngày đáo hạn nào bị bỏ qua | Chủ lượt mượn vẫn là đối tượng bị kiểm tra kinh doanh | AT-001 | `approved-requirement` |
| SL-002 | Nhân viên trả sách lượt mượn với dữ liệu đánh giá tốt mạch lạc | Xác nhận trả sách | Chi tiết/bản sao vẫn được mượn khi khóa | Giao dịch khóa các giá trị hiện tại, cam kết trả về, sau đó xây dựng phản hồi/kiểm tra từ ảnh chụp nhanh đó | Xung đột trạng thái đồng thời trả về lỗi an toàn và không có thao tác ghi | `overdueDays = business-day boundaries(locked dueDate, committed returnDate)` | Hàng phản hồi, kiểm tra và cam kết mô tả một kết quả | FE07 sở hữu lợi nhuận; FE09 sở hữu sự sáng tạo tinh tế | AT-002 | `approved-requirement` |
| SL-003 | Thành viên/nhân viên gia hạn với ngày xác định | Đủ điều kiện gia hạn | Chủ sở hữu không có vật cản và hàng hóa không quá hạn vào ngày kinh doanh | Thêm 14 ngày theo lịch bằng cách sử dụng trợ giúp được chia sẻ | Bất kỳ trình chặn nào đều giữ nguyên ngày đến hạn | Không có số học lịch máy chủ cục bộ | Đầu vào giống nhau tạo ra cùng một ngày ở mọi múi giờ của máy chủ | FE07 sở hữu chính sách đổi mới | AT-003 | `approved-requirement` |
| SL-004 | FE10 từ chối cấu hình mẫu được lưu trữ không an toàn | Yêu cầu thông báo đạt đến xác thực mẫu | Cặp chuẩn và bản ghi mẫu tồn tại | Tiến hành định nghĩa an toàn; các giá trị thời gian chạy được thoát/khử trùng trong quá trình kết xuất | Định nghĩa không an toàn trả về 4xx an toàn trước khi kết xuất/lưu giữ/gửi | Xác thực định nghĩa và thoát dữ liệu thời gian chạy là các cổng riêng biệt | Dữ liệu nhập bị từ chối không tạo ra thông báo hoặc nỗ lực nào | FE10 chỉ sở hữu kết xuất/phân phối | AT-004 | `approved-requirement` |
| SL-005 | Nhân viên chỉ nhận được hành vi báo cáo được ghi lại | FE12 GET với chuỗi truy vấn | Diễn viên được ủy quyền | Mọi khóa đều được đưa vào danh sách cho phép, xác thực giá trị, chạy báo cáo | Khóa không xác định đầu tiên trả về `400` an toàn trước khi thực thi dịch vụ/kho lưu trữ | Danh sách cho phép dành riêng cho điểm cuối và chính xác | Báo cáo vẫn ở chế độ chỉ đọc; đầu vào không xác định không có sự kiện kiểm tra thành công | FE12 sở hữu xác thực ranh giới | AT-005 | `approved-requirement` |
| SL-006 | Chuyển giao FE08 vẫn ổn định | Kiểm tra đặt chỗ FE07 hoặc yêu cầu thông báo FE08 | Hợp đồng vòng đời FE08 hiện tại | Hành vi hiện tại không thay đổi | Hoàn thành khối lỗi hồi quy hiện có | Không có quy tắc FE08 mới | Quyền sở hữu hàng đợi và hành vi không chặn thông báo vẫn được giữ nguyên | FE08 sở hữu trạng thái xếp hàng | AT-006 | `approved-requirement` |

## 7. Hợp đồng giao diện và lỗi

### FE07

- Mỗi tài khoản có chính xác một vai trò. Việc gia hạn `MEMBER` yêu cầu quyền sở hữu;
  Gia hạn `LIBRARIAN`/`ADMIN` cho phép phạm vi nhiều thành viên.
- Kết quả kho lưu trữ trả sách có thẩm quyền cung cấp ngày đến hạn và trả sách
  ngày được `fineCandidate` sử dụng và trả về siêu dữ liệu kiểm tra.
- Khả năng đủ điều kiện gia hạn và gia hạn thời hạn sử dụng tài khoản chung
  `Asia/Ho_Chi_Minh` trợ giúp về ngày làm việc.

### FE10

- Tiêu đề/nội dung mẫu được lưu trữ không an toàn trả về xác thực mẫu 4xx an toàn
lỗi trước khi kết xuất, duy trì thông báo, cố gắng duy trì hoặc I/O của nhà cung cấp.
- Định nghĩa mẫu giai đoạn 1 là văn bản thuần túy cộng với mã thông báo `{{variable}}`.
Cú pháp thẻ HTML thô (bao gồm `<script>`), thuộc tính xử lý sự kiện nội tuyến và URL `javascript:`
là nội dung định nghĩa không an toàn.
- Các giá trị mẫu thời gian chạy tiếp tục được loại bỏ hoặc loại bỏ.
- Việc từ chối khóa giống như bí mật và việc xử lý lại `safePayload` vẫn không thay đổi.

### FE12

- Danh sách cho phép vay: `q`, `fromDate`, `toDate`, `status`, `bookId`, `userId`,
  `page`, `limit`.
- Danh sách cho phép tồn kho: `q`, `categoryId`, `bookId`, `status`, `location`,
  `page`, `limit`.
- Danh sách cho phép người dùng: `q`, `roleId`, `status`, `membershipStatus`, `fromDate`,
  `toDate`, `page`, `limit`.
- Bất kỳ chìa khóa nào khác đều trở lại an toàn
`400 UNSUPPORTED_REPORT_QUERY_PARAMETER` trước khi dịch vụ báo cáo hoặc kho lưu trữ thực thi. Chi
tiết lỗi có thể xác định khóa không được hỗ trợ nhưng không được lặp lại giá trị của nó.

## 8. Chấp nhận và truy vết

| ID chấp nhận | ID quyết định | Mục tiêu yêu cầu | Bằng chứng RED dự kiến ​​trước khi triển khai | Bằng chứng chấp nhận sau này |
| --- | --- | --- | --- | --- |
| AT-001 | BD-007 | BR-FE07-003/031, FR-FE07-009/032, AC-FE07-009/026 | `main` và branch bất đồng về việc có tồn tại tác nhân đa vai trò hay không | Kịch bản đa vai trò bị loại bỏ; một vai trò, chủ sở hữu Thành viên, nhiều Thành viên đơn vai trò và từ chối self-service của nhân viên vẫn được bao phủ |
| AT-002 | BD-002 | BR-FE07-014, FR-FE07-007/008, AC-FE07-008 | Lịch thi đấu đổi mới/trả sách đồng thời làm lộ ra `overdueDays` cũ | Hồi quy giao dịch chứng minh phản hồi/sử dụng kiểm tra đã bị khóa ngày đáo hạn |
| AT-003 | BD-003 | BR-FE07-015, FR-FE07-009/020, NFR-FE07-TIME-001 | Đầu vào gia hạn giống nhau nhưng khác nhau tùy theo múi giờ của máy chủ | kiểm thử tập trung đạt ít nhất UTC và `America/New_York` |
| AT-004 | BD-004 | BR-FE10-010, FR-FE10-005/009, AC-FE10-006 | Định nghĩa được lưu trữ không an toàn được chấp nhận và khử trùng | 4xx an toàn, không cần kiên trì, không cần gọi đến nhà cung cấp; giá trị thời gian chạy vẫn được thoát |
| AT-005 | BD-005 | BR-FE12-008, FR-FE12-005, AC-FE12-005, EC-FE12-011 | `?bogus=1` đến dịch vụ và trả về `200` | Cả ba điểm cuối đều trả về `400` an toàn; gián điệp dịch vụ/kho lưu trữ vẫn còn nguyên |
| AT-006 | BD-006 | Yêu cầu tích hợp FE08 hiện có | mốc cơ sở tích hợp tập trung hiện có | Hồi quy thông báo và đặt chỗ FE08 vẫn giữ nguyên màu xanh |
| AT-007 | E-008/S-009 | BR-FE08-020, FR-FE08-035, AC-FE08-022 | Trình ánh xạ giữ nguyên giá trị rỗng nhưng các trang hiển thị `#null` | Null hiển thị `Chưa xác định`, vị trí thực trên mỗi bản sao không thay đổi và các cổng tập trung/đầy đủ/thời gian chạy vượt qua |

Việc truy vết phải tiếp tục sau khi được phê duyệt bằng văn bản:

```text
BD -> BR/FR/AC -> PLAN -> TASK -> mã nguồn có thẻ @spec -> kiểm thử RED/GREEN -> bằng chứng thời gian chạy
```

## 9. Lộ trình cắt lát

| Đặt hàng | ID lát | Kết quả | Phụ thuộc | Rủi ro kinh doanh | Chủ bàn giao | Người phê duyệt doanh nghiệp | Cổng vào | Thoát bằng chứng |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | SL-001 | Ủy quyền gia hạn một vai trò | Văn bản phê duyệt SPEC và `DEC-GEN-005` | Truy cập nhiều thành viên trái phép hoặc mô hình tác nhân không thể | Codex / Trưởng nhóm tích hợp | Nhật | G3 đã vượt qua | Bằng chứng ranh giới vai trò đơn vai trò AT-001 |
| 2 | SL-002 | Cam kết lợi nhuận mạch lạc, ứng viên tốt và kiểm toán | Chỉ ranh giới kiểm thử SL-001; không phụ thuộc vào mã | Dữ liệu xem xét/kiểm tra phạt không chính xác | Codex / Trưởng nhóm tích hợp | Nhật | G3 đã vượt qua | Bằng chứng giao dịch AT-002 |
| 3 | SL-003 | Kết quả ngày gia hạn độc lập với máy chủ | Tiện ích chia sẻ thời gian kinh doanh | Kết quả đến hạn/quá hạn không đúng | Codex / Trưởng nhóm tích hợp | Nhật | G3 đã vượt qua | Ma trận múi giờ AT-003 |
| 4 | SL-004 | Xác thực mẫu được lưu trữ không đóng | Ranh giới hiển thị FE10 hiện tại | Nội dung thực thi được lưu trữ | Codex / Trưởng nhóm tích hợp | Nhật | G3 đã vượt qua | Hồi quy bảo mật AT-004 |
| 5 | SL-005 | Ranh giới truy vấn báo cáo chính xác | Trình xác thực/tuyến đường báo cáo hiện có | Mở rộng API im lặng và đầu vào không được xác thực | Codex / Trưởng nhóm tích hợp | Nhật | G3 đã vượt qua | Ma trận điểm cuối AT-005 |
| 6 | SL-006 | Chuyển giao FE08 được bảo tồn và quy tắc cùng một cuốn sách ngược dòng | Triển khai SL-001 sang SL-005 cộng với S-008 | Hồi quy chéo chức năng | Codex / Trưởng nhóm tích hợp | Nhật | G6 đã vượt qua | AT-006 cộng với bằng chứng hồi quy FE08-T045 |
| 7 | SL-007 | Hàng đợi trong phạm vi bản sao đã được đối chiếu và ranh giới phạt của Thành viên | SL-001 đến SL-006 cộng với S-009 | Giao diện người dùng hàng đợi gây hiểu lầm hoặc hồi quy ranh giới vai trò | Codex / Trưởng nhóm tích hợp | Nhật | Tích hợp `8d0059b` được ủy quyền | Đánh giá bảo mật AT-007, FE09-T024 và bằng chứng L1-L4 mới |

## 10. Cổng chất lượng

Nhật đã phê duyệt phụ lục H2 mới nhất của sản phẩm `8d0059b` và bản sửa lỗi tài liệu H3 đầu tiên vào
ngày 27-07-2026. Các đầu được đánh giá đã được xuất bản dưới dạng `f346ae0` và `2d0ef78`; CI chạy
`30244750250` và `30246892241` đã đạt. Việc xem xét đặc tả H3 lặp đi lặp lại không tìm thấy vấn đề
gì. Các tiêu chuẩn đã tìm thấy một P2 còn lại: các trường đã đăng ký được gắn nhãn là "hiện tại" sẽ
trở nên cũ ngay khi gói H2 của chính chúng được cam kết. Nhiệm vụ 13 thay thế mô hình tự tham chiếu
đó bằng ảnh chụp nhanh H2 cố định cộng với bằng chứng xuất bản PR/kết thúc cuối cùng.

| ID lát | G0 | G1 | G2 | G3 | G4 | G5 | G6 | G7 | Chặn | Chủ sở hữu | Bằng chứng tiếp theo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SL-001 đến SL-007 | đã qua | đã qua | đã qua | đã qua | đã qua | đã qua | đã qua | đã qua | Phát hiện bằng chứng đông lạnh H3 lặp đi lặp lại tại `2d0ef78` | Codex / Nhật | Gói ảnh chụp nhanh nhiệm vụ 13, bản ghi H2 bên ngoài, PR CI được cập nhật và H3 lặp lại |

Các kết quả xanh trong lịch sử so với `origin/main` tại `e20fdc3` và `e99daf5` chỉ là bằng chứng cơ
bản. Bảng ghi lại quan sát H3 lặp lại tại `2d0ef78`; nó không phải là trường trạng thái nhánh trực
tiếp sau khi xuất bản sau này.

## 11. Ranh giới an ninh, an toàn

- Việc ủy quyền ở phía máy chủ và tuân theo mô hình một tài khoản/một vai trò.
- FE10 không đóng được các định nghĩa được lưu trữ không an toàn và không bao giờ làm suy yếu các định nghĩa hiện có
  phát hiện bí mật, biên tập, DTO tối thiểu hoặc các biện pháp bảo vệ chi tiết nhà cung cấp.
- FE12 xác thực cả tên và giá trị khóa trước khi cơ sở dữ liệu hoạt động; tất cả SQL vẫn còn
  được tham số hóa.
- Lỗi an toàn không để lộ dấu vết bộ công nghệ, bí mật, giá trị truy vấn, chi tiết nhà cung cấp hoặc
  dữ liệu báo cáo.
- Không có PII, thông tin xác thực, mã thông báo, OTP hoặc dữ liệu môi trường tiền sản xuất có thể thay đổi nào được sử dụng làm kiểm thử
  bằng chứng.

## 12. Ranh giới thực thi

Hoàn thiện theo gói H2 được Nhật duyệt:

- Điều chỉnh SPEC, PLAN/TASKS, ID nhiệm vụ, kiểm tra và triển khai hợp nhất.
- Loại bỏ kịch bản gia hạn đa vai trò được thay thế.
- Bảo toàn `FE08-T045`/`FE08-T046` ngược dòng và cùng vị trí sách/hàng đợi của chúng
  quy tắc trong khi di chuyển ranh giới chỉ hồi quy của nhánh này sang `FE08-T047`.
- Chạy tập trung, đầy đủ, truy vết và xác thực thời gian chạy cục bộ.
- Cam kết hợp nhất được đánh giá dưới dạng `f346ae0`, đẩy bản nháp PR #63 và chạy theo yêu cầu
  Kiểm tra PR.
- Cam kết khắc phục tài liệu H3 đầu tiên là `2d0ef78`, đẩy nó lên PR
  #63 và vượt qua CI chạy `30246892241`.

Được ủy quyền để khắc phục Nhiệm vụ 13 không cam kết:

- Thay thế từ ngữ trạng thái hiện tại tự tham chiếu bằng ảnh chụp nhanh H2 bị đóng băng
  cách diễn đạt.
- Lưu giữ các hướng dẫn lịch sử trước H2 và tất cả hoạt động của sản phẩm.
- Chạy tài liệu, truy vết, triển khai và kiểm tra khác biệt.

Quy tắc công bố nhiệm vụ 13:

- Ảnh chụp nhanh ba tệp phải nhận được H2 được ghi trong PR #63 trước nó
  được cam kết hoặc đẩy.
- PR CI đã cập nhật và H3 lặp lại vẫn là bắt buộc trước khi hợp nhất.
- Chạy SQL có thể thay đổi mà không có cơ sở dữ liệu dùng một lần được đặt tên và thao tác ghi rõ ràng
  cờ.

Không có câu hỏi kinh doanh nào chưa được giải quyết trong lát cắt giới hạn này.

## 13. Phụ lục khắc phục bằng chứng quản trị-bằng chứng H3

Đánh giá H3 đầu tiên so sánh `origin/main@8d0059b` với `f346ae07d5d2885c0d5b8131479dee764edd97ec`
sau khi CI chạy `30244750250` hoàn tất thành công.

Xem xét kết luận:

- Đánh giá tiêu chuẩn không tìm thấy cam kết trái phép. Sự chấp thuận H2 rõ ràng của Nhật
  trước cam kết và đẩy.
- Đánh giá đặc tả không tìm thấy yêu cầu nào bị thiếu, phạm vi sai hoặc sản phẩm không chính xác
  hành vi.
- Mối lo ngại về phát lại bình thường FE10 ban đầu đã bị rút lại vì
`AC-FE10-008` và `EC-FE10-008` yêu cầu các khóa trùng lặp để trả về bản ghi `200` hiện có và đường
dẫn đó không thực hiện kết xuất, lưu giữ hoặc I/O của nhà cung cấp.
- Vẫn còn một phát hiện P2 hợp lệ: xác thực trạng thái hiện tại, PLAN, TASKS và một
FE10 hàng truy vết vẫn mô tả việc hợp nhất được xem xét là chưa được cam kết hoặc H2 đang chờ xử lý.

Quyết định khắc phục:

- Chỉ cập nhật các trường quản trị trạng thái hiện tại cũ.
- Không thay đổi mã sản xuất, kiểm tra, quy tắc nghiệp vụ, hợp đồng API, lược đồ,
  phụ thuộc hoặc hướng dẫn quy trình trước H2 lịch sử.
- Ghi lại cách khắc phục dưới dạng Nhiệm vụ 12 và chuẩn bị gói H2 mới chưa được cam kết.
- Sau H2 mới, hãy cam kết và đẩy tài liệu khác biệt được xem xét chính xác, đợi
  để cập nhật PR CI và lặp lại H3 trước khi hợp nhất.

## 14. Bằng chứng đông lạnh bất biến

Bằng chứng xác thực đã đăng ký là ảnh chụp nhanh không thể thay đổi của gói được xem xét tại H2. Nó
có thể nói một cách trung thực rằng gói đã có sẵn tại thời điểm chụp nhanh, nhưng nó không được gắn
nhãn tuyên bố đó là "trạng thái hiện tại" trực tiếp của nhánh.

Thông tin xuất bản không thể tồn tại trong ảnh chụp nhanh trước khi cam kết của chính họ sẽ được ghi
lại bên ngoài:

- Phê duyệt H2 và kết quả cam kết SHA: phần cổng xem xét PR #63.
- Chạy CI bắt buộc và kết quả H3 lặp lại: PR #63.
- Hợp nhất SHA và `main` CI sau hợp nhất chính xác: bằng chứng khóa sổ cuối cùng.

Sự tách biệt này chấm dứt vòng bằng chứng tự tham chiếu mà không làm suy yếu H2 hoặc H3. Hướng dẫn
lịch sử không thay đổi và mọi khác biệt mới được tạo vẫn yêu cầu H2 trước khi xuất bản cộng với H3
trước khi hợp nhất.
