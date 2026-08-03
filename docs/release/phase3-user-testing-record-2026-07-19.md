# Hồ sơ kiểm thử và diễn tập của người dùng giai đoạn 3 - 19-07-2026

## Ranh giới bằng chứng

Chỉ những kết quả được quan sát mới được đánh dấu `PASS`. Quy trình làm việc được xác thực cục bộ sử
dụng danh tính tổng hợp mới và máy chủ E2E trong bộ nhớ xác định. Một đợt chạy trực tiếp riêng biệt
(`c6e0c46421f0`) cũng đã xác minh các luồng vai trò Azure đã được xác thực và phân phối SMTP thực
với các thiết bị cố định tạm thời. Thông tin xác thực, mã thông báo, phản hồi của nhà cung cấp và
nội dung thư không được giữ lại trong hồ sơ này.

## Môi trường kiểm thử

| Mục | Giá trị |
| --- | --- |
| nhánh | `docs/phase3-polish-delivery` |
| Nguồn gốc kiểm tra giao diện | `http://127.0.0.1:4273` |
| Nguồn gốc kiểm tra máy chủ | `http://127.0.0.1:3200` |
| Trình duyệt | Playwright Crom |
| Dữ liệu | Người dùng `example.test` tổng hợp; được tạo lại bởi điểm cuối thiết lập E2E |
| Lệnh | `npm.cmd run test:e2e` với các biến cổng thay thế được ghi lại |
| Bằng chứng Azure trực tiếp | Chạy `c6e0c46421f0`; dữ liệu kiểm thử tổng hợp được làm sạch sau khi quan sát |

## Kết quả luồng người dùng tự động

| Kịch bản | Kết quả mong đợi | Kết quả quan sát | Trạng thái |
| --- | --- | --- | --- |
| Danh mục ứng viên FE08 và đặt chỗ | Thành viên nhìn thấy các ứng cử viên có hình dạng SQL an toàn và tạo một đặt chỗ thực sự được máy chủ hỗ trợ. | Tìm kiếm ứng viên, phân trang và tạo đặt chỗ đã hoàn tất. | ĐẠT |
| Không gian làm việc khoản phạt FE09 | Tìm kiếm nhân viên, bộ lọc trạng thái và phân trang sử dụng API chuẩn của backend. | Phản hồi backend điều khiển danh sách hiển thị; không dùng dữ liệu dự phòng từ bộ nhớ trình duyệt. | ĐẠT |
| FE11 Quản lý yêu cầu quản trị viên | Quản trị list/detail, xuất, kiểm soát trạng thái đầu cuối và phân trang vẫn có thẩm quyền. | Luồng trình duyệt đã hoàn thành với dữ liệu yêu cầu/detail do máy chủ sở hữu. | ĐẠT |
| Đăng nhập hệ thống | Thành viên tổng hợp và Thủ thư có thể đăng nhập và tiếp cận các tuyến đường phù hợp với vai trò. | Thành viên đạt `/home`; Thủ thư đến không gian làm việc của nhân viên. | ĐẠT |
| Yêu cầu mượn | Thành viên đủ điều kiện tạo một yêu cầu. | Yêu cầu và chi tiết được tạo với trạng thái `PENDING`/`REQUESTED`. | ĐẠT |
| Phê duyệt của thủ thư | Thủ thư phê duyệt và phân bổ bản sao. | Yêu cầu đã được chấp thuận và copy/detail đã được mượn. | ĐẠT |
| trả sách quá hạn và phạt | Mười bốn ngày quá hạn tính đúng 70.000 VND. | trả sách tạo ra sự chuyển giao tốt đẹp; FE09 đã tạo `UNPAID` 70.000 VND và sau đó ghi `PAID`. | ĐẠT |
| Báo cáo FE12 | Hoạt động mượn sách xuất hiện và báo cáo vẫn ở chế độ chỉ đọc. | Một bản ghi tích hợp xuất hiện trong báo cáo. | ĐẠT |
| Báo cáo đáp ứng | Chế độ xem 390x844 không chặn tràn ngang. | Xác nhận của trình duyệt trả về không có tài liệu tràn. | ĐẠT |

Kết quả trình duyệt tổng hợp: **4/4 kiểm thử Playwright đã vượt qua trong 24,4 giây**.

## Đánh giá trực quan

Các ảnh chụp màn hình mới sau đây đã được kiểm tra sau khi thay đổi tải từng phần ở cấp độ tuyến đường:

- [`manual-login.png`](../assets/user-manual/manual-login.png): hình thức đăng nhập là
  có thể đọc được, tập trung và không chứa giá trị chứng chỉ kiểm tra.
- [`manual-librarian-approval.png`](../assets/user-manual/manual-librarian-approval.png):
  yêu cầu list/detail và trạng thái thành công vẫn nhất quán.
- [`system-golden-path-desktop.png`](../assets/phase3/system-golden-path-desktop.png):
  thẻ báo cáo, điều khiển bộ lọc và điều hướng không trùng nhau.
- [`system-golden-path-mobile.png`](../assets/phase3/system-golden-path-mobile.png):
  điều khiển di động xếp chồng chính xác và trang không bị tràn ngang.

Quyết định trực quan: **ĐẠT cho dòng chảy cục bộ tổng hợp đã được kiểm tra**. Đây là bằng chứng của
người vận hành tác nhân, không phải là tuyên bố rằng người dùng cuối bên ngoài đã kiểm thử Môi
trường tiền sản xuất Azure.

## Giai đoạn chấp nhận

| Kịch bản | Trạng thái | Bằng chứng |
| --- | --- | --- |
| Giao diện người dùng HTML | ĐẠT | Giai đoạn 3 sáu giai đoạn kiểm thử nhanh. |
| Sức khỏe máy chủ | ĐẠT | `/health` trả về `200` sau khi khởi động App Service. |
| Danh mục công cộng Azure SQL | ĐẠT | `/api/books?page=1&limit=1` đã trả sách phong bì chuẩn sau khi đối chiếu quá trình di chuyển. |
| CORS nghiêm ngặt | ĐẠT | Nguồn gốc lối vào chính xác được cho phép; nguồn gốc không đáng tin cậy bị chặn. |
| Tuyến đường được bảo vệ ẩn danh | ĐẠT | `/api/auth/me` trả về `401`. |
| Luồng thành viên/thủ thư Azure đã được xác thực | ĐẠT | Chạy trực tiếp `c6e0c46421f0` đăng nhập vai trò đã được xác minh, đọc được bảo vệ, yêu cầu mượn, phê duyệt và trả sách. |
| bàn giao SMTP thật | ĐẠT | Thông báo `8` là `SENT` trong một lần thử; sự chấp nhận của nhà cung cấp và tìm kiếm Gmail IMAP đã được quan sát. |

Bằng chứng hoạt động đầy đủ: [`phase3-staging-evidence-2026-07-19.md`](phase3-staging-evidence-2026-07-19.md).

## Kết quả diễn tập

| Diễn tập | Kết quả | Duration/bằng chứng |
| --- | --- | --- |
| Luồng trình duyệt bình thường | ĐẠT | Bốn kịch bản trình duyệt tổng hợp hoàn thành trong 24,4 giây kèm theo ảnh chụp màn hình và xác nhận trạng thái. |
| Dự phòng năm phút | ĐẠT | `npm.cmd run test:system` vẫn là dự phòng API mang tính quyết định; bộ tập trung hiện tại chạy tốt dưới năm phút. |
| Triển khai trước | ĐẠT | môi trường tiền sản xuất smoke xác minh giao diện người dùng, tình trạng, danh mục SQL, CORS và xác thực ẩn danh trước khi trình bày. |
| Hiệu suất chiếu trước | ĐẠT | `npm.cmd run phase3:performance` ghi lại kích thước gói sản xuất và thời gian xác thực bcrypt-cost-10. |

## Đặt lại và xác minh quyền riêng tư

- Máy chủ E2E tạo lại trạng thái trong bộ nhớ cho mỗi lần thiết lập và chấm dứt sau
  cuộc chạy; không có hàng SQL chia sẻ nào bị bộ trình duyệt thay đổi.
- Tất cả danh tính hiển thị đều sử dụng `example.test`; không có dữ liệu cá nhân thực sự được sử dụng.
- Mã thông báo truy cập vẫn còn trong quy trình browser/kiểm thử bị cô lập và không được ghi
  vào tài liệu, ảnh chụp màn hình hoặc đầu ra lệnh.
- Quy tắc tường lửa của nhà điều hành Azure SQL tạm thời được sử dụng để xác thực di chuyển
  đã được gỡ bỏ và kiểm tra lại.
- Các thiết bị quan sát trực tiếp đã được gỡ bỏ và kiểm tra lại: `AuthFixtures=0`,
  `BookFixtures=0` và `NotificationFixtures=0`.
- Không còn quy tắc tường lửa `phase3-live-observation*` SQL nào sau khi dọn dẹp.
- Nội dung SMTP, giá trị OTP thô, phản hồi của nhà cung cấp, mật khẩu cơ sở dữ liệu và
  chuỗi kết nối không có trong bản ghi này.

## Quyết định hoàn thiện dựa trên bằng chứng

1. Đã thêm `TRUST_PROXY=true` vì việc chấm dứt Azure TLS đã gây ra sự cố
   phản hồi `HTTPS_REQUIRED` sai.
2. Đã thêm chức năng kiểm thử nhanh danh mục được hỗ trợ bởi SQL vì chỉ riêng `/health` đã ẩn lược đồ
   trôi dạt.
3. Tăng cường di chuyển FE05 sau khi chỉ mục ISBN được lọc cũ đã chặn
   Nâng cấp Môi trường tiền sản xuất Azure.
4. Các trang cấp cao nhất được tải chậm sau khi xây dựng cơ sở hiển thị 999.203 byte
   gói đầu vào; mục nhập mới là 320.688 byte.

Không có chức năng kinh doanh hoặc quy tắc vai trò bổ sung nào được đưa ra từ những phát hiện này.
