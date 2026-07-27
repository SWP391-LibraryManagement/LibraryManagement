# Phân tích tính nhất quán vận hành của Lát cắt UX Thư viện 3 - 2026-07-15

Trạng thái: HOÀN THÀNH - CHỈ LÀ ĐẦU VÀO THIẾT KẾ

Nhánh: `docs/ux-slice3-operational-patterns`

## Phạm vi

Đánh giá định hướng UX trang vận hành Lát cắt 3 đã phê duyệt so với đặc tả tính năng, trạng thái bàn giao, tuyến, thành phần frontend dùng chung và kiểm thử hiện tại trước khi soạn thiết kế có thể thực thi.

Phân tích này không phê duyệt triển khai, thay đổi hành vi nghiệp vụ, sửa hợp đồng API, sửa kiểm tra vai trò hoặc tuyên bố hoàn thành công việc frontend FE06 hay FE09.

## Nguồn đã đánh giá

- `.sdd/constitution.md`, `.sdd/shared_context.md` và các ràng buộc dự án.
- `docs/superpowers/specs/2026-07-14-library-ux-system-design.md`, đặc biệt là Lát cắt 3, `UX-FE-006` và `AC-UX-005`.
- Các tệp `CONTEXT.md`, `SPEC.md`, `PLAN.md` và `TASKS.md` của FE06, FE07, FE08, FE09 và FE12.
- `frontend/src/App.jsx`, `frontend/src/utils/appNavigation.js`, các thành phần bố cục và phản hồi dùng chung, trang vận hành, máy khách API, kiểu dáng và kiểm thử frontend trọng tâm.
- Lịch sử tích hợp gần đây đến commit main `e9b9c44`.

## Đường cơ sở thành phần nguyên thủy dùng chung

| Mẫu đã phê duyệt | Phần triển khai hiện tại | Kết quả nhất quán |
| --- | --- | --- |
| `PageHeader` | `AppLayout` hiển thị vùng tiêu đề `.ph`, tiêu đề phụ và thao tác. | Có hành vi tái sử dụng nhưng được nhúng trong bố cục thay vì có hợp đồng thành phần rõ ràng. |
| `StatusNotice` | `DataNotice` hỗ trợ trạng thái thông tin, cảnh báo, lỗi và thành công. | Gần tương đương về chức năng; cách đặt tên và hỗ trợ thử lại/thao tác chưa được chuẩn hóa. |
| `LoadingBlock` | Có `LoadingBlock` dùng chung với nhãn bận có thể tiếp cận và các hàng khung xương ổn định. | Có đường cơ sở tái sử dụng. |
| `EmptyState` | Có `EmptyState` dùng chung, nhưng một số trang vẫn hiển thị đánh dấu trống tùy chỉnh. | Có đường cơ sở tái sử dụng nhưng việc áp dụng chưa đầy đủ và thao tác tiếp theo chưa được chuẩn hóa. |
| `DataToolbar` | Có các lớp CSS dùng chung; mỗi trang tự ghép tìm kiếm, tab, bộ lọc và điều khiển đặt lại. | Không có hợp đồng thành phần có thể thực thi; hành vi đặt lại và đếm kết quả khác nhau theo trang. |
| `DataTable` | Có kiểu `.lib-table` dùng chung. Bảng thuộc sở hữu từng trang và dùng tràn ngang trên màn hình nhỏ. | Không có hợp đồng thành phần tái sử dụng và không có cách trình bày hàng/thẻ di động đã phê duyệt. |
| `ConfirmAction` | `Modal` dùng chung cung cấp quản lý tiêu điểm và ngữ nghĩa hộp thoại. Mỗi trang sở hữu nội dung xác nhận, trạng thái đang chờ và quy tắc thao tác phá hủy. | Có lớp phủ dễ tiếp cận; an toàn thao tác và hành vi đang chờ không nhất quán. |
| `Toast` | Có `Toast` và `useToast` dùng chung. FE09 định nghĩa phần triển khai thông báo nhanh thứ hai. | Có đường cơ sở dùng chung nhưng không được sử dụng nhất quán. |

## Ma trận nhất quán tính năng

| Tính năng | Trạng thái bàn giao đặc tả | Đường cơ sở UX hiện tại | Điểm không nhất quán chính | Ranh giới Lát cắt 3 |
| --- | --- | --- | --- | --- |
| FE07 Mượn sách | `SPEC`, `PLAN`, `TASKS` và kế hoạch kiểm thử đã hoàn thành. | Năm trang được bảo vệ dùng `AppLayout`, API FE07 thật và hầu hết thành phần phản hồi nguyên thủy dùng chung. | Thanh công cụ và bảng bị lặp; bảng di động chỉ cuộn; `BorrowRequestPage` dùng đánh dấu trống tùy chỉnh và danh mục trình diễn; nút xác nhận thiếu hợp đồng đang chờ dùng chung. | Lát cắt truy vết tốt nhất. Chuẩn hóa trạng thái trình bày và tương tác mà không thay đổi phép tính mượn, điều kiện đủ, lời gọi API hoặc bộ bảo vệ. |
| FE08 Đặt trước | `SPEC` đã phê duyệt; `PLAN`, `TASKS` và kế hoạch kiểm thử sẵn sàng để đánh giá. | Trang Thành viên và nhân viên dùng `AppLayout`, API đặt trước, bảng, bộ lọc, xác nhận hộp thoại, thông báo nhanh và trạng thái tải. | Lỗi API dùng bản ghi trình diễn dự phòng nên có thể che trạng thái lỗi và trống chuẩn; bộ bảo vệ máy khách cấp tuyến không nhất quán với FE07/FE12; hành vi thanh công cụ/bảng riêng theo trang. | Chuẩn hóa trạng thái dữ liệu hiển thị và thành phần. Duy trì phân quyền máy chủ và không thiết kế lại chính sách hàng đợi. Thay đổi bộ bảo vệ máy khách cần phạm vi bảo mật riêng. |
| FE06 Kho sách | `SPEC` đã phê duyệt; `PLAN` và `TASKS` chưa bắt đầu. | `InventoryPage` dùng `AppLayout`, nhưng `InventoryManagement` là nguyên mẫu dữ liệu mô phỏng với phần đầu trang thứ hai, kiểu Bootstrap/MUI, kiểu nội tuyến và hành vi hộp thoại/bảng tùy chỉnh. | Không có luồng trạng thái chuẩn dựa trên API; tiêu đề bị lặp; hệ thống hình ảnh trộn lẫn; không có hành vi tải/lỗi/thông báo nhanh dùng chung; phần triển khai tính năng chưa dựa trên đặc tả. | Có thể chỉ điều chỉnh trình bày. Không nối API, thêm quy trình bản sao hoặc tuyên bố FE06 hoàn thành đến khi kế hoạch/nhiệm vụ được phê duyệt. |
| FE09 Tiền phạt | `SPEC` đã phê duyệt; kế hoạch/nhiệm vụ backend sẵn sàng để đánh giá; căn chỉnh API frontend `FE09-T012` chưa bắt đầu. | `FineManagement.jsx` là không gian làm việc localStorage/dữ liệu mẫu độc lập lớn với khung, điều hướng, thông báo nhanh, trạng thái trống, bảng và kiểu riêng. | Nó bỏ qua `AppLayout`, lặp thành phần nguyên thủy dùng chung, chứa nội dung UI trộn tiếng Việt/Anh và không dùng quy trình API FE09 đã phê duyệt. | Có thể thiết kế việc dọn dẹp khung dùng chung và trình bày tách khỏi `FE09-T012`. Không ngụ ý phép tính cục bộ hoặc trạng thái thanh toán là hành vi backend chuẩn. |
| FE12 Báo cáo | `SPEC`, `PLAN`, `TASKS` và kế hoạch kiểm thử đã hoàn thành. | Ba trang được bảo vệ dựa trên API đã dùng `AppLayout`, bộ bảo vệ báo cáo, thông báo dùng chung, tải, trạng thái trống, biểu đồ, bộ lọc và bảng. | Việc ghép thanh công cụ ngày/danh mục bị lặp; bảng không có hợp đồng hàng/thẻ di động; thông báo thành công để lộ cách diễn đạt hướng tới endpoint. | Đích áp dụng cuối ít rủi ro sau khi các mẫu truy vết ổn định. Duy trì ngữ nghĩa báo cáo chỉ đọc và hợp đồng bộ lọc. |

## Phát hiện xuyên suốt

1. Các nền tảng dùng chung đã được triển khai một phần. Lát cắt 3 nên hợp nhất và áp dụng chúng thay vì thay thế hệ thống hình ảnh.
2. FE07 là tính năng truy vết an toàn nhất vì tính năng nghiệp vụ và nhóm nhiệm vụ frontend đã hoàn thành, đồng thời đã có kiểm thử hồi quy trọng tâm.
3. Không thể coi FE06 và FE09 tương đương FE07/FE12. Màn hình hiện tại của chúng là nguyên mẫu với công việc bàn giao đặc tả hoặc căn chỉnh API chưa giải quyết.
4. Kho sách và tiền phạt không có trong `APP_NAV_GROUPS`; FE09 bù bằng một khung tùy chỉnh thứ hai. Có thể thiết kế tính nhất quán điều hướng, nhưng hành vi phân quyền vai trò phải giữ nguyên.
5. Bảng dùng chung hiện dựa vào cuộn ngang. Điều này chưa đáp ứng ý định hàng/thẻ di động của `DataTable` trong Lát cắt 3; xác minh đáp ứng vẫn là cổng Lát cắt 4 về sau.
6. Nội dung trống, đang tải, lỗi và thành công khác nhau ở việc mô tả kết quả người dùng hay chi tiết triển khai như kết nối endpoint.
7. Quản lý tiêu điểm hộp thoại hiện có là nền tảng tốt cho `ConfirmAction`, nhưng trạng thái gửi, ngăn thao tác trùng và nội dung phá hủy cần hợp đồng rõ ràng.

## Ranh giới thiết kế được khuyến nghị

- Xây dựng và xác thực các mẫu vận hành dùng chung trên FE07 trước.
- Tiếp theo áp dụng các mẫu ổn định cho FE08, rồi FE06, FE09 và FE12 theo thứ tự đã phê duyệt, đồng thời dùng bộ điều hợp chỉ trình bày cho nguyên mẫu chưa hoàn thiện.
- Coi việc bàn giao API FE06 và căn chỉnh API frontend FE09 là công việc tính năng có truy vết riêng, không phải công việc ẩn trong lát cắt UX.
- Giữ mọi phép tính nghiệp vụ, hình dạng yêu cầu/phản hồi API, lược đồ cơ sở dữ liệu, phân quyền máy chủ và quyết định tuyến-vai trò hiện có ngoài thiết kế Lát cắt 3 này.
- Thêm kiểm thử hợp đồng frontend trọng tâm cho thành phần trạng thái nguyên thủy dùng chung và mỗi trang đã di chuyển; tái sử dụng bằng chứng kiểm thử rộng hơn đang đạt đến khi bắt đầu triển khai.

## Quyết định thiết kế bắt buộc

Thiết kế Lát cắt 3 phải chọn rõ mức độ di chuyển FE06 và FE09:

- Di chuyển chỉ trình bày: áp dụng khung và mẫu vận hành dùng chung trong khi giữ nguồn dữ liệu hiện tại và duy trì rõ các giới hạn nguyên mẫu.
- Di chuyển bị hoãn: hoàn thành FE07, FE08 và FE12 ngay, rồi xem lại FE06/FE09 sau các cổng lập kế hoạch theo tính năng.
- Mở rộng bàn giao tính năng: kết hợp công việc UX với triển khai FE06 và căn chỉnh API FE09. Không khuyến nghị vì vượt phạm vi đã phê duyệt và cần đặc tả/kế hoạch riêng.

## Kết quả phân tích

Kết luận: **Có thể tiếp tục thiết kế Lát cắt 3, dùng Mượn sách FE07 làm tính năng truy vết. FE06 và FE09 cần ranh giới rõ ràng được con người phê duyệt trước khi viết thiết kế có thể thực thi.**
