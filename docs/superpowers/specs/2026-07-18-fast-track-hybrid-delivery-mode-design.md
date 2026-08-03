# Thiết kế chế độ phân phối lai tốc độ nhanh

Trạng thái: ĐƯỢC PHÊ DUYỆT BỞI HUMAN - 2026-07-18

Ngày: 2026-07-18

mốc cơ sở: `origin/main@1eb426196ebbc80339e2aed4558270967cd7269e`

Phạm vi: Quy trình phân phối dự án cho số tồn đọng SDD/ADD còn lại; lô kích hoạt đầu tiên là FE11
`TD-024`, `TD-026` và `TD-027`, trong đó `TD-023` và `TD-025` chỉ được giữ lại làm dự báo phụ thuộc.

Ghi chú sửa đổi: Nhất phê duyệt phương hướng điều chỉnh trước H1 vào ngày 18-07-2026. Hiến pháp, hợp
đồng, quyền sở hữu và khác biệt kích hoạt chính xác vẫn phải được xem xét H1 trước khi cam kết.

## 1. Quyết định

Áp dụng chế độ phân phối luồng nhanh Hybrid với tối đa ba làn đường đồng thời, một dây dẫn tích hợp
và chỉ có ba loại cổng dành cho người.

Tính song song dựa trên giai đoạn thay vì phân tán mã không hạn chế. Chỉ một người xây dựng có thể
chỉnh sửa các tệp lõi được chia sẻ cho lát hoạt động. Trong khi nhà thầu đó thực hiện, các làn
đường khác sẽ chuẩn bị hợp đồng tiếp theo và xác minh độc lập công việc hiện tại.

Chế độ này duy trì các điều khiển Kết hợp B1-B7 trong khi loại bỏ các xác nhận lặp lại, PR kết thúc
trùng lặp và nghiên cứu nối tiếp có thể tránh được.

## 2. Nguồn và lý do

Thiết kế này áp dụng hướng dẫn trong cẩm nang từ:

- Chương 11, in trang 277-304: ranh giới đa tác nhân, trạng thái chia sẻ, hợp đồng giao diện, điều phối và điều kiện dừng.
- Chương 13, in trang 316-340: Phân loại Lõi/Vỏ, B1-B7, các lớp xác nhận, cổng người và cửa thoát hiểm.
- Chương 14, in trang 341-353: luân phiên vai trò dự án, lập kế hoạch theo đợt, công việc kiểm tra/bảo mật và nhịp độ bàn giao.

Bằng chứng kho lưu trữ gần đây cho thấy độ trễ chính là việc tuần tự hóa quy trình công việc thay vì
thời gian chạy kiểm thử:

- FE11 UI vai trò yêu cầu PR triển khai và PR kết thúc riêng biệt.
- Mỗi lần chạy CI hoàn thành trong khoảng hai phút, trong khi các phê duyệt thiết kế, xuất bản, đánh giá, hợp nhất và đóng lặp đi lặp lại đã làm tăng phần lớn độ trễ của đồng hồ treo tường.
- Phần nợ FE11 còn lại chia sẻ các mô-đun `frontend/src/page/UserManagement.jsx`, API của Quản trị viên và các lớp Quản trị viên/quản lý người dùng máy chủ, do đó, ba tác nhân mã hóa độc lập sẽ tạo ra xung đột và các giả định không tương thích.

## 3. Bàn thắng

- Xóa các xác nhận đặc biệt và chỉ sử dụng ba loại cổng rõ ràng được xác định bên dưới.
- Luôn ưu tiên bảo mật cốt lõi, API, quyền, dữ liệu và trạng thái hành vi.
- Giữ bằng chứng RED-GREEN và tất cả bốn lớp xác thực.
- Cho phép thiết kế, triển khai và đánh giá độc lập chồng chéo một cách an toàn.
- Tự động xuất bản các PR dự thảo sau khi khác biệt triển khai đã được con người đánh giá ở H2.
- Bằng chứng khóa sổ B7 cơ học hàng loạt thay vì tạo một PR khóa sổ cho mỗi lát.
- Duy trì một chủ sở hữu tích hợp chịu trách nhiệm, người có thể giải thích mọi kết quả được hợp nhất.

## 4. Không có mục tiêu

- Không hợp nhất tự động nếu không có cổng người thứ ba.
- Không có người ghi song song nào trên cùng một tệp lõi được chia sẻ.
- Không có bảo mật, lược đồ, quyền, API công khai hoặc thay đổi máy trạng thái do một yêu cầu không rõ ràng.
- Không có sự từ bỏ CI, bỏ qua kiểm thử hoặc giảm yêu cầu ủy quyền phía máy chủ.
- Không có tuyên bố nào rằng toàn bộ chức năng FE11 đã hoàn tất trong khi nợ trả chậm vẫn còn.
- Không cần viết lại quy trình làm việc CI ngay lập tức; Tối ưu hóa CI yêu cầu phần cơ sở hạ tầng được xem xét riêng.

## 5. Độ sâu rủi ro và đặc tả

| Loại công việc | Phương pháp mặc định | Độ sâu |
| --- | --- | --- |
| Xác thực, quyền, biên tập kiểm tra, API công khai, lược đồ, chuyển đổi trạng thái | SDD đầu tiên, giới hạn ADD sau khi được phê duyệt | Đầy đủ |
| quy tắc nghiệp vụ với một ranh giới tích hợp | Lai | Tiêu chuẩn hoặc Đầy đủ |
| Thành phần giao diện người dùng có thể đảo ngược, bản sao, bộ điều hợp, tài liệu chỉ có bằng chứng | ADD trong hợp đồng đã được phê duyệt | Nhẹ hoặc bê tông DoD |

Cốt lõi bao gồm ủy quyền, xác thực, biên tập, quyền sở hữu API, hợp đồng dữ liệu, quy tắc trạng thái
đầu cuối và ngữ nghĩa kiểm tra. lớp bao bao gồm bố cục, hiển thị điều hướng, bộ điều hợp cơ học và
định dạng bằng chứng.

## 6. Cấu trúc liên kết vận hành

### Ngõ 1 - Trưởng nhóm tích hợp

- Sở hữu phạm vi, đọc nguồn gốc sự thật, quyết định hợp đồng, tài liệu chung và thứ tự phụ thuộc.
- Tạo gói thiết kế/kế hoạch/nhiệm vụ theo lô.
- Chỉ định quyền sở hữu tệp và hợp đồng giao diện trước khi thực hiện công việc song song.
- Tích hợp các cam kết, giải quyết sự trôi dạt không chồng chéo, chuẩn bị bằng chứng PR và giám sát CI.
- Là làn đường duy nhất được phép thay đổi hợp đồng chung sau khi được con người chấp thuận.

### Ngõ 2 - Thợ xây

- Sở hữu triển khai RED-GREEN cho lát hoạt động trong cây làm việc bị cô lập.
- Là người viết duy nhất cho các tệp sản xuất lõi được chia sẻ trong phần đó.
- Duy trì các điểm kiểm tra bằng chứng/kiểm tra tại địa phương và báo cáo các hợp đồng đã thay đổi ngay lập tức.
- Không cam kết các thay đổi triển khai do AI tạo ra trước khi có sự đánh giá của con người H2.
- Không mở rộng phạm vi hoặc diễn giải lại các yêu cầu.

### Ngõ 3 - Người xác minh

- Đánh giá độc lập việc tuân thủ đặc tả, tiêu chuẩn, bảo mật, kiểm tra và rủi ro còn sót lại.
- Có thể chuẩn bị ma trận chỉ đọc hoặc thêm bằng chứng đánh giá không xung đột.
- Không viết lại mã sản xuất Builder đồng thời.
- Báo cáo các phát hiện cho Trưởng nhóm tích hợp để chỉnh sửa và xác thực fan-in.

Các làn đường tạo thành một đường ống:

```text
Trưởng nhóm thiết kế lát N+1
        ||
Người xây dựng triển khai lát N
        ||
Người xác minh rà soát lát N / xác thực lát N-1
```

## 7. Ba cánh cổng con người

### H1 - Phê duyệt hợp đồng theo lô

Con người phê duyệt một gói bao gồm hai hoặc ba lát giới hạn:

- Phân loại lõi/vỏ và độ sâu đặc tả.
- Hợp đồng API/dữ liệu/bảo mật và các quyết định chưa được giải quyết.
- Thứ tự phụ thuộc, quyền sở hữu tệp, kế hoạch, nhiệm vụ, kiểm tra và lệnh xác thực.
- Vai trò đại lý và cho phép làm việc song song.

H1 cấp ủy quyền thường trực cho lô đã được phê duyệt cho:

- Tạo cây làm việc và nhánh.
- Sử dụng tối đa ba làn đường đại lý.
- Viết mã RED-GREEN và kiểm tra trong phạm vi.
- Chuẩn bị đầy đủ các khác biệt cục bộ và bằng chứng xác nhận để xem xét H2.

H1 không cho phép cam kết các thay đổi triển khai đã tạo, đẩy các nhánh mã sản phẩm, hợp nhất, mở
rộng lược đồ, thay đổi hợp đồng hoặc miễn trừ bảo mật.

Khi gói H1 bao gồm khác biệt kích hoạt quản trị luồng nhanh chính xác, H1 cũng đóng vai trò là bản
đánh giá đầu ra trước khi cam kết cho khác biệt chỉ có tài liệu đó. Nó ủy quyền cho Trưởng nhóm tích
hợp cam kết và xuất bản PR kích hoạt quản trị. PR đó vẫn yêu cầu kiểm tra tự động và H3 trước khi
hợp nhất và trạng thái Lô 1 chỉ có hiệu lực sau khi PR kích hoạt đạt `main`.

Đối với một lô yêu cầu PR kích hoạt quản trị, ủy quyền tác phẩm sản phẩm thường trực của H1 chỉ có
thể sử dụng được sau khi hợp nhất PR kích hoạt đó. Việc lập kế hoạch có thể tiếp tục trong một cây
tài liệu riêng biệt trong khi chạy quá trình kiểm tra kích hoạt nhưng việc triển khai sản phẩm phải
chờ.

### H2 - Phê duyệt gói thực hiện tại địa phương

Con người đánh giá một gói đầu ra AI cục bộ hợp nhất trước khi triển khai được tạo hoặc các thay đổi
bằng chứng SPEC được cam kết:

- Các tập tin khác biệt và đã thay đổi.
- Lịch sử RED-GREEN.
- Bằng chứng tự động L1.
- Ánh xạ thông số L2.
- L3 Đánh giá về hiến pháp/an ninh.
- Bằng chứng chấp nhận L4 và rủi ro còn lại.

H2 ủy quyền cho Trưởng nhóm tích hợp tạo các cam kết đã được phê duyệt, đẩy nhánh lát cắt, mở PR dự
thảo và đánh dấu nó là sẵn sàng sau khi vượt qua các bước kiểm tra PR bắt buộc. Nó không cho phép
hợp nhất.

H2 là bản đánh giá kết quả đầu ra có cam kết trước của địa phương, không phải bản đánh giá tích hợp
PR cuối cùng của Hiến pháp. Nó có thể xảy ra trước khi PR tồn tại. Kiểm tra PR bắt buộc chạy sau khi
xuất bản và trước H3.

### H3 - Phê duyệt tích hợp cuối cùng

Con người thực hiện đánh giá tích hợp PR cuối cùng và phê duyệt việc hợp nhất sau khi vượt qua các
bước kiểm tra PR bắt buộc và nhánh vẫn có thể hợp nhất.

H3 ủy quyền cho đại lý:

- Hợp nhất PR thực hiện đã được phê duyệt.
- Giám sát chính xác quá trình chạy CI `main` sau hợp nhất.
- Chỉ điền vào các trường bằng chứng khóa sổ được xem xét trước bằng số PR, hợp nhất SHA và ID chạy CI.
- Đối với máy chủ cùng trong lô, xuất bản và hợp nhất PR đóng lô cơ học sau khi vượt qua các bước kiểm tra bắt buộc.

Bất kỳ hành vi mới, yêu cầu thay đổi, khiếu nại tài liệu phi cơ học, kiểm tra bắt buộc không thành
công hoặc rủi ro bảo mật mới đều cần có sự phê duyệt khác.

H3 áp dụng cho mọi hoạt động hợp nhất, bao gồm PR kích hoạt quản trị luồng nhanh, PR triển khai, PR
chỉ có bằng chứng TD-027 và PR kết thúc lô cơ học cuối cùng.

H1 xảy ra một lần đối với lô hai hoặc ba lát đã được phê duyệt. H2 và H3 xảy ra một lần trong mỗi
lần triển khai PR vì mỗi kết quả khác biệt và hợp nhất được tạo ra phải được xem xét độc lập. Không
có xác nhận bổ sung nào được yêu cầu đối với các kiểm thử riêng lẻ, sơ đồ công việc, lệnh, cam kết
đã được đề cập trong H2, xuất bản dự thảo hoặc giám sát sau hợp nhất.

## 8. nhánh, sơ đồ công việc và chiến lược PR

- Sử dụng một cây làm việc riêng biệt và một nhánh triển khai cho mỗi lát hoạt động.
- Xuất bản chính xác khác biệt về kích hoạt quản trị đã được H1 xem xét dưới dạng tài liệu PR; Việc kích hoạt nhiệm vụ/nợ đợt 1 chỉ có hiệu lực sau khi PR vượt qua kiểm tra, nhận H3 và hợp nhất.
- Sử dụng một PR triển khai cho mỗi lát; bao gồm thiết kế, kế hoạch, nhiệm vụ, kiểm tra, mã và bằng chứng sẵn sàng xác nhận.
- Giữ các thay đổi sản xuất/kiểm thử đã tạo ở trạng thái sẵn sàng trong cây công việc riêng biệt cho đến khi xem xét H2. Sau H2, hãy tạo bộ cam kết đã được xem xét và xuất bản PR mà không cần lời nhắc cấp phép khác.
- Không chạy các nhánh triển khai anh chị em trên cùng một tệp lõi được chia sẻ.
- Thiết kế cho phần tiếp theo có thể tiến hành trong một cây làm việc tài liệu riêng biệt trong khi phần hiện tại được triển khai.
- Chỉ khởi động lại hoặc hợp nhất `main` hiện tại khi độ trôi đến không trùng với hợp đồng lõi đã được phê duyệt. Sự trôi dạt chồng chéo sẽ dừng làn đường và quay trở lại Trưởng nhóm Tích hợp.
- Thu thập bằng chứng sau hợp nhất cho lô đã được phê duyệt trong một PR kết thúc vào cuối lô, thay vì một PR kết thúc cho mỗi lát.
- Mẫu khóa sổ được xem xét ở H3. Sau đó, chỉ những số nhận dạng bằng chứng chính xác và chuyển đổi trạng thái nợ/nhiệm vụ đã được phê duyệt mới có thể được thay thế tự động.

## 9. Mô hình xác thực

Mỗi lát triển khai đều giữ lại tất cả bốn lớp:

| Lớp | Bằng chứng nhanh chóng |
| --- | --- |
| L1 Tự động | RED-GREEN tập trung, hồi quy bị ảnh hưởng, tìm lỗi mã nguồn/xây dựng, truy vết, khác biệt, quét bí mật/bảo mật, PR CI |
| Thông số L2 | ID yêu cầu ổn định được ánh xạ tới các nhiệm vụ, mã, kiểm tra và bằng chứng chấp nhận |
| L3 Hiến pháp/An toàn | Tiêu chuẩn độc lập/đánh giá bảo mật, ranh giới ủy quyền, xác thực, bí mật, kiểm toán, phạm vi |
| Chấp nhận L4 | Luồng trình duyệt/API hoặc sự chấp nhận rõ ràng do người đánh giá chứng minh; khoảng trống môi trường còn sót lại được ghi nhận |

Kiểm tra cục bộ có thể chạy đồng thời khi chúng không ghi cùng một thư mục đầu ra. GitHub CI hiện
tại vẫn là cổng hồi quy đầy đủ cần thiết cho mã PR và `main`.

Sau khi phê duyệt H2, việc xuất bản PR dự thảo sẽ tự động khi các kiểm tra tập trung cục bộ, tìm
lỗi/xây dựng ở nơi bị ảnh hưởng, truy vết, vệ sinh khác biệt và kiểm tra phạm vi đều vượt qua.

## 10. Quy tắc thử lại và dừng

- Một lỗi xác định sẽ nhận được lần thử ban đầu cộng với tối đa hai lần thử lại để khắc phục.
- Lớp E2E bị nghi ngờ có thể được chạy lại một lần với bằng chứng dấu vết/nhật ký; lỗi thứ hai tương tự được coi là một khiếm khuyết.
- Dừng ngay lập tức nếu có hợp đồng không rõ ràng, lỗi chia sẻ/tệp lõi không mong muốn, lộ bí mật, mở rộng quyền/lược đồ/API, giả định tác nhân không tương thích hoặc kiểm tra bắt buộc không thành công.
- Không bao giờ hợp nhất với sự từ bỏ trừ khi trưởng nhóm chấp nhận nó một cách rõ ràng và kho lưu trữ ghi lại lý do.
- Khi dừng lại, hãy bảo quản trạm kiểm soát, báo cáo bằng chứng và sử dụng cửa thoát hiểm được ghi lại thay vì tiếp tục trong im lặng.

## 11. Lô theo dõi nhanh đầu tiên

### Chuẩn bị song song

- Khách hàng tiềm năng: khóa điểm cuối, bộ lọc, xác thực, danh sách cho phép biên tập và quyền sở hữu của Nhật ký kiểm tra `TD-024` chuẩn.
- Làn đường xác minh/tài liệu: chuẩn bị ma trận bằng chứng `TD-027` chỉ đọc mà không thay đổi `SPEC.md`.
- Làn phân tích: giải quyết quyết định về đường bao danh sách người dùng `TD-026` bằng cách sử dụng lại mô hình đọc thống kê người dùng FE12 và xác định tác động của nó đối với số lượng vai trò/Quyền.

### Thứ tự thực hiện tuần tự

1. Nhật ký kiểm tra `TD-024`, trước hết vì nó có tính bảo mật P1 và có thể triển khai độc lập sau khi hợp đồng của nó bị khóa.
2. Phong bì danh sách người dùng `TD-026`, bảo toàn `{ data, pagination }` và di chuyển bộ đếm Quản trị viên sang mô hình đọc FE12 `/api/reports/users` đã hoàn thành.
3. Siêu dữ liệu trạng thái/bằng chứng `TD-027`, trong cửa sổ ghi `SPEC.md` nối tiếp sau khi TD-026 hợp nhất.

Dự báo ngoài đợt 1:

4. Bảng điều khiển/Quyền dành cho quản trị viên `TD-023`, sau khi nguồn đếm vai trò được hỗ trợ bởi FE12 và quyền sở hữu ma trận quyền FE11 là rõ ràng.
5. Quản lý yêu cầu `TD-025`, chỉ sau khi quyền sở hữu FE07, hợp đồng chi tiết và thực thi trạng thái đầu cuối bị khóa.

Phân tích `TD-027` có thể chạy song song, nhưng bản chỉnh sửa `SPEC.md` thực tế của nó được tuần tự
hóa sau TD-026 và không được thay đổi các yêu cầu của FE11.

## 12. Quy tắc phụ thuộc

```text
TD-027 chuẩn bị ma trận -------------- làn bằng chứng chỉ đọc độc lập

TD-026 hợp nhất --> sửa SPEC TD-027 -- một người viết duy nhất là Trưởng nhóm tích hợp

TD-024 ------------------------------ lát độc lập ưu tiên bảo mật

TD-026 --> TD-023 ------------------- ưu tiên nguồn tóm tắt/số lượng dựa trên FE12

hợp đồng yêu cầu FE07 --> TD-025 ----- ưu tiên quyền sở hữu trạng thái kết thúc của máy chủ
```

`TD-023` và `TD-025` là các dự báo phụ thuộc ngoài Lô 1 và không nhận được ủy quyền triển khai từ Lô
1 H1. `TD-023`, `TD-024` và `TD-025` không được triển khai đồng thời trên các nhánh anh em vì chúng
trùng lặp với các tệp tích hợp giao diện người dùng và máy chủ dành cho quản trị viên.

## 13. tệp bàn giao bắt buộc

Đối với mỗi lô:

- Một thiết kế hàng loạt đã được phê duyệt.
- Một PR kích hoạt quản trị với các bước kiểm tra bắt buộc và phê duyệt hợp nhất H3.
- Một kế hoạch triển khai với thứ tự phụ thuộc và quyền sở hữu tệp.
- Nhóm nhiệm vụ nguyên tử có ID ổn định và DoD.
- Hồ sơ xác thực trên mỗi lát với bằng chứng L1-L4.
- Một PR thực hiện cho mỗi lát.
- Một PR kết thúc cơ học cho lô hoàn thành.
- Chỉ cập nhật TASKS, nhật ký thay đổi, sổ đăng ký nợ và bộ nhớ tác nhân khi có bằng chứng hỗ trợ thay đổi trạng thái.

## 14. Rủi ro và giảm nhẹ

| Rủi ro | Giảm thiểu |
| --- | --- |
| Các tác nhân song song tạo mã xung đột | Chỉ một Builder ghi các tệp lõi được chia sẻ; thiết kế hoặc xác minh làn đường khác |
| Các giả định về giao diện khác nhau | Khóa hợp đồng phiên bản tại H1; nhà sản xuất không thể âm thầm thay đổi chúng |
| Ít phê duyệt hơn ẩn việc mở rộng phạm vi | H1 chỉ cấp phạm vi lô rõ ràng; Sự trôi dạt lõi dừng ngay lập tức |
| Khóa sổ hàng loạt để lại bằng chứng đang chờ xử lý trong thời gian ngắn | Sử dụng mẫu được xem xét trước và đóng lô ngay sau CI |
| Dự thảo PR xuất bản tác phẩm được tạo chưa được xem xét | Yêu cầu xác thực cục bộ và xem xét H2 trước khi cam kết/đẩy; giữ bản dự thảo PR cho đến khi các cuộc kiểm tra bắt buộc được thông qua |
| H2 bối rối với đánh giá PR cuối cùng | Xác định H2 là đánh giá đầu ra trước khi cam kết cục bộ và H3 là đánh giá tích hợp Hiến pháp sau kiểm tra |
| Bằng chứng bảo trì xung đột với hợp đồng làm việc | Chuẩn bị song song TD-027 chỉ đọc, nhưng tuần tự hóa bản chỉnh sửa SPEC của nó sau khi hợp nhất TD-026 |
| Thay đổi nhánh cơ sở trong quá trình làm việc | Chỉ tự động đồng bộ trôi dạt không chồng chéo; chồng chéo Sự trôi dạt lõi leo thang |
| Lọc đường dẫn CI bỏ qua hồi quy | Không có bộ lọc đường dẫn trong thiết kế này; tối ưu hóa CI trong tương lai cần xem xét riêng |

## 15. Tiêu chí thành công

Chế độ luồng nhanh thành công khi:

- Công việc chỉ sử dụng các loại cổng H1, H2 và H3: H1 một lần cho mỗi đợt, sau đó là H2/H3 một lần cho mỗi lát PR được tạo; sự khác biệt chính xác về quản trị được H1 xem xét sẽ tiến hành trực tiếp tới cổng hợp nhất H3 cần thiết của nó.
- Đại lý không yêu cầu quyền đối với mỗi lần chạy kiểm thử, sơ đồ công việc, bộ cam kết được xem xét, xuất bản dự thảo hoặc bước kết thúc cơ học đã được cổng ủy quyền.
- Ít nhất hai làn vẫn hoạt động hiệu quả mà không cần chỉnh sửa đồng thời các tệp lõi được chia sẻ.
- Mỗi lát được hợp nhất đều có bằng chứng L1-L4 và liên kết CI sau hợp nhất chính xác.
- Không có hành vi bảo mật, quyền, lược đồ hoặc API công khai nào được triển khai từ một giả định đã được mở khóa.
- Bằng chứng kết thúc được tổng hợp theo từng đợt trong khi bộ nhớ dự án vẫn chính xác.
- Trạng thái hoàn thành toàn bộ chức năng vẫn trung thực.

## 16. Câu hỏi mở

Không có ở cấp độ định hướng thiết kế. Nhật phê duyệt phương hướng điều chỉnh vào ngày 18/07/2026.
Gói H1 chính xác vẫn phải được xem xét trước khi cam kết kích hoạt quản trị/PR và trước khi Lô 1 đi
vào hoạt động.
