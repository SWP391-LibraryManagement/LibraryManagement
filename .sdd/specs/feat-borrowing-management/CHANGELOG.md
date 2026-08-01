# CHANGELOG.md - FE07 Quản lý mượn sách

## 2026-08-01 - Đóng truy vết triển khai 100%

- Gắn các nghĩa vụ thông báo kết quả, handoff hàng đợi và hướng dẫn stale/blocker
  đã triển khai vào `FR-FE07-040`, `FR-FE07-041`, `FR-FE07-042` và
  `FR-FE07-044` tại đúng ranh giới production sở hữu hành vi.
- Đổi metadata triển khai sang `COMPLETE`; không thay đổi API, schema, trạng thái
  nghiệp vụ hoặc hành vi quan sát được.
- Sau reset quota, Azure runtime hiện `Running`/`Online` và smoke bản đang deploy
  đạt; closeout candidate chưa deploy nên chưa thể dùng kết quả này để nghiệm thu.

## 2026-07-29 - Đồng bộ trạng thái phát hành hậu merge (v0.9.2)

- Xác nhận phạm vi FE07 đã merge vào `main` và CI hậu merge đạt.
- Ghi rõ Azure staging chưa thể chấp nhận do Azure SQL đang `Paused` sau khi hết quota;
  không xem đây là bằng chứng triển khai thành công.

## 2026-07-29 - Chặn handoff hàng đợi cho lượt trả hỏng/thất lạc (v0.9.1)

- `reservationQueueAction.hasActiveQueue` chỉ còn `true` khi lượt trả là `RETURNED`,
  bản sao đã thành `AVAILABLE` và vẫn có hàng đợi `ACTIVE`.
- Giữ reservation `ACTIVE` nguyên trạng cho lượt trả `DAMAGED/LOST`, nhưng không
  phát CTA FE08 sai trạng thái.
- Bổ sung regression coverage cho cả hai tình trạng trả và cập nhật truy vết
  `BR-FE07-012`, `BR-FE07-013`, `FR-FE07-007`.

## 2026-07-29 - Kích hoạt governance luồng demo liên hoàn (v0.9.0)

- Thêm BR-FE07-035..037, FR-FE07-040..044 và AC-FE07-033..036.
- Chốt post-commit FE10 non-blocking, handoff FE08 chỉ đọc và timeline chính tắc.
- Chưa thay đổi product code; H1 đã duyệt và activation đang chờ H3/merge.

## 2026-07-28 - Kết nối lượt trả quá hạn với tạo khoản phạt (v0.8.3)

- Thêm hành động `Tạo phiếu phạt` cho Thủ thư/Quản trị viên đối với khoản mượn đang hoạt động đã chọn
  chỉ khi hạn trả của nó quá hạn.
- Chỉ truyền `borrowDetailId` chính tắc cho FE09 và giữ ngày, số tiền,
  ngăn trùng lặp và trạng thái phạt do máy chủ sở hữu.
- Giữ quyền sở hữu xử lý trả của FE07 và quyền sở hữu lưu khoản phạt của FE09.

## 2026-07-28 - Hiển thị dữ liệu lưu hành Quản trị vừa khung mà không kéo ngang (v0.8.2)

- Loại các cột ID yêu cầu và mã vạch riêng khỏi danh mục lưu hành Quản trị
  và projection DOCX của nó, đồng thời giữ cả hai trường chính tắc cho
  quyết định yêu cầu, theo dõi bản sao, tìm kiếm và chi tiết trả.
- Giữ ID chi tiết mượn làm mã định danh vận hành hiển thị.
- Cân bằng lại chín cột còn lại và cho phép giá trị thành viên/sách dài
  xuống dòng trong ô riêng để bố cục desktop được hỗ trợ không còn cần kéo ngang.

## 2026-07-27 - Ngăn spam yêu cầu cùng tiêu đề (v0.8.1)

- Thực thi một quy trình `PENDING/REQUESTED` hoặc `BORROWED` đang hoạt động cho mỗi Thành viên và
  `BookId`, gồm kiểm tra tạo đồng thời có thẩm quyền giao dịch.
- Từ chối một yêu cầu chứa nhiều bản sao vật lý của cùng một tiêu đề.
- Ẩn mọi bản sao của tiêu đề đã hoạt động khỏi ứng viên của Thành viên đó.
- Ngăn hàng đang chờ trùng lặp cũ trở thành hai khoản mượn cùng tiêu đề đang hoạt động,
  đồng thời giữ đường từ chối của nhân sự.
- Tách lỗi phê duyệt chủ sở hữu cũ khỏi ủy quyền tự phục vụ Thành viên.

## 2026-07-27 - Ngăn yêu cầu đang chờ trùng lặp cho một bản sao (v0.8.0)

- Làm `PENDING + REQUESTED` thành yêu cầu độc quyền logic cho một bản sao vật lý
  mà không thêm trạng thái tồn kho hoặc cột schema mới.
- Ẩn bản sao đã được yêu cầu khỏi ứng viên Thành viên và từ chối các lượt tạo cũ/đồng thời
  một cách nguyên tử với `COPY_PENDING_REQUEST_CONFLICT`.
- Kết nối bảo vệ thay đổi thủ công FE06 và lượt tải lại quyết định chính tắc Quản trị/Thủ thư FE11,
  gồm trạng thái bản sao hiện tại và trợ giúp từ chối rõ ràng hơn.
- Giữ an toàn xung đột cũ: yêu cầu đang chờ không thể phê duyệt vẫn đang
  chờ và vẫn có thể bị từ chối với lý do bắt buộc.

## 2026-07-27 - Đối soát phạt thành viên FE09 với căn chỉnh quy tắc (v0.7.9)

- Kết hợp các thay đổi song song v0.7.8 cho điều kiện hợp lệ cùng sách FE08 và
  yếu tố chặn mượn/gia hạn `UNPAID` dương của FE09.
- Giữ bàn giao bản sao được giữ chính xác, hợp đồng một tài khoản/một vai trò,
  bằng chứng trả có khóa giao dịch và gia hạn độc lập múi giờ.
- Chỉ công khai ngày đến hạn/trả FE07 qua giao diện phạt Thành viên chỉ đọc của FE09;
  Thủ thư/Quản trị viên giữ quyền sở hữu thu tiền.
- Bằng chứng tích hợp mới và rà soát H2 vẫn bắt buộc trước commit/push.

## 2026-07-27 - Tích hợp điều kiện hợp lệ đặt trước cùng sách (v0.7.8)

- Tích hợp tín hiệu khoản mượn hiện tại FE07 upstream dùng bởi FE08 trong khi
  giữ bàn giao bản sao được giữ chính xác, hợp đồng một tài khoản/một vai trò,
  bằng chứng trả có khóa giao dịch và gia hạn độc lập múi giờ.
- Giữ `FE08-T045` upstream có thẩm quyền cho việc loại trừ đặt trước cùng sách
  và giữ `FE07-T049` đến `FE07-T052` cho công việc căn chỉnh quy tắc của nhánh này.
- Bằng chứng tích hợp mới được ghi nhận; phụ lục H2 vẫn bắt buộc trước khi
  merge đang mở có thể được commit hoặc push.

## 2026-07-27 - Đối soát bàn giao bản sao được giữ với căn chỉnh quy tắc (v0.7.7)

- Giữ bàn giao `bookId`/`copyId` chính xác FE08-sang-FE07 upstream và quyền sở hữu
  yêu cầu đang chờ/phê duyệt thông thường.
- Giữ quy tắc một tài khoản/một vai trò, bằng chứng trả có khóa giao dịch
  và hành vi gia hạn độc lập múi giờ.
- Giữ `FE07-T048` upstream có thẩm quyền và đánh số lại các tác vụ căn chỉnh quy tắc
  thành `FE07-T049` đến `FE07-T052`.

## 2026-07-27 - Kết nối yếu tố chặn phạt chưa thanh toán với đối soát Thành viên (song song v0.7.8)

- Liên kết yếu tố chặn mượn/gia hạn FE07 hiện có với trạng thái `UNPAID` dương chính tắc của FE09.
- Công khai ngày đến hạn và trả FE07 qua giao diện phạt Thành viên chỉ đọc để đối soát.
- Giữ quyền sở hữu thu tiền của Thủ thư/Quản trị viên; Thành viên không thể tự đánh dấu khoản phạt đã thanh toán.

## 2026-07-27 - Công khai khoản mượn hiện tại làm điều kiện hợp lệ đặt trước FE08

- Xác định `BorrowDetails.Status = BORROWED` hiện tại cùng `BookId` của bản sao là tín hiệu liên tính năng có thẩm quyền cho việc loại trừ đặt trước cùng sách FE08.
- Giữ chi tiết đã trả/mất/hỏng và lịch sử đặt trước kết thúc ngoài yếu tố chặn này.
- Kết nối khóa lưu hành Thành viên FE07 với xác thực lại tạo/giữ đặt trước FE08.

## 2026-07-27 - Chấp nhận bàn giao chính xác bản sao được giữ FE08

- FE07 hiện đọc cả `bookId` và `copyId` từ thao tác đặt trước FE08 `NOTIFIED` của Thành viên.
- Màn hình yêu cầu chỉ chọn trước bản sao chính xác khi danh mục ứng viên có nhận biết đặt trước được bảo vệ trả nó cho Thành viên hiện tại.
- Giữ tạo yêu cầu đang chờ thông thường, phê duyệt Thủ thư/Quản trị viên, xác thực lại backend và hoàn tất FE08 nguyên tử.

## 2026-07-27 - Đối soát main một vai trò với căn chỉnh quy tắc (v0.7.6)

- Áp dụng `DEC-GEN-005` toàn dự án: mọi tài khoản đã lưu có chính xác một
  vai trò.
- Xác nhận tài khoản đa vai trò không được hỗ trợ; mỗi tài khoản chỉ có chính xác một
  vai trò.
- Giữ gia hạn chỉ chủ sở hữu Thành viên và gia hạn liên thành viên của Thủ thư/Quản trị viên là
  các đường actor một vai trò riêng biệt trong khi giữ mọi kiểm tra
  điều kiện hợp lệ của chủ khoản mượn.
- Đánh số lại các tác vụ căn chỉnh quy tắc vì `main` đã gán `FE07-T047` và
  `FE07-T048` cho tự phục vụ thành viên một vai trò và bàn giao bản sao được giữ.
- Đánh dấu kịch bản gia hạn đa vai trò trước đây là đã bị thay thế và loại bỏ
  kiểm thử/delta ủy quyền cục bộ nhánh của nó trong quá trình tích hợp.

## 2026-07-27 - Xác định ủy quyền gia hạn và dữ liệu trả có thẩm quyền (v0.7.5)

- Làm cho quyền gia hạn liên thành viên `LIBRARIAN`/`ADMIN` được ưu tiên đối với
  actor đa vai trò trong khi vẫn giữ quyền sở hữu chỉ thành viên và các kiểm tra
  điều kiện hợp lệ chủ khoản mượn.
- Yêu cầu `fineCandidate` và siêu dữ liệu audit trả dùng hạn trả và giá trị trả
  đã khóa bởi giao dịch trả có thẩm quyền.
- Yêu cầu điều kiện hợp lệ gia hạn và kéo dài hạn trả dùng helper ngày nghiệp vụ
  `Asia/Ho_Chi_Minh` dùng chung mà không dùng phép tính `Date` cục bộ máy chủ.
- Sửa cách diễn đạt trường hợp biên FE04 cũ: thiếu phê duyệt FE04 chọn tier
  hằng ngày ba bản sao chứ không phải từ chối mượn.
- Nhat đã phê duyệt SPEC được viết vào 2026-07-27, chỉ cho phép chuẩn bị PLAN/TASKS;
  mục này không khẳng định mã hoặc kiểm thử nào.

## 2026-07-27 - Thực thi tự phục vụ thành viên không phải nhân sự

- Thêm ủy quyền chỉ thành viên cho mô hình tài khoản chính xác một vai trò; Quản trị/Thủ thư không thể dùng tự phục vụ mượn thành viên.
- `MEMBER + LIBRARIAN` và `MEMBER + ADMIN` không còn có thể mở hoặc gọi ứng viên mượn thành viên, tạo-yêu-cầu hay luồng lịch sử riêng.
- Giữ thao tác phê duyệt, từ chối, trả, lịch sử thành viên đã chọn và gia hạn nhân sự của Thủ thư/Quản trị viên.
- Kết nối chuyển hướng route trực tiếp frontend với cùng ranh giới ủy quyền backend.
- Xác thực: route backend FE07/FE08 tập trung đạt 94/94, frontend vai trò/điều hướng tập trung đạt 61/61, backend đầy đủ đạt 1018/1018, frontend đầy đủ đạt 227/227 và lint/build frontend cùng truy vết đều đạt.

## 2026-07-23 - Đối soát bất biến giao dịch phê duyệt và trả

- Xác thực lại vai trò `MEMBER` hiện tại của chủ yêu cầu và tier hằng ngày 3/5 suy ra FE04 bên trong giao dịch phê duyệt.
- Khôi phục thứ tự khóa thành viên -> bản sao -> yêu cầu/chi tiết -> đặt trước chính tắc và làm cho trả khóa bản sao, chi tiết và yêu cầu đặt trước trước thay đổi.
- Thêm hồi quy tập trung cho vai trò bị loại bỏ, lượt đọc tier cũ, thứ tự khóa trả và kết quả giao dịch an toàn.
- Thay phép tính lịch trả/gia hạn cục bộ máy chủ bằng helper thời gian nghiệp vụ `Asia/Ho_Chi_Minh` dùng chung, gồm hồi quy nửa đêm máy chủ UTC.
- Yêu cầu đường trả trong bộ nhớ khớp SQL bằng cách từ chối bản sao vật lý không phải `BORROWED` với `BORROW_STATE_CONFLICT` trước thay đổi.
- Đối soát kỳ vọng SQL thay đổi với điều kiện hợp lệ dựa trên vai trò và kết quả xung đột trả đồng thời rõ ràng.

## 2026-07-22 - Bổ sung quyết định mượn nhân sự và ổn định input từ chối

- Mở rộng hộp thoại phê duyệt và từ chối của Thủ thư/Quản trị viên với ID/ngày yêu cầu chính tắc, danh tính/liên hệ thành viên và tiêu đề, tác giả, ID, mã vạch, vị trí cùng trạng thái hiện tại của mọi bản sao được yêu cầu.
- Sửa quản lý focus modal dùng chung để textarea controlled không còn mất focus sau mỗi ký tự được gõ khi callback đóng nội tuyến đổi danh tính.
- Loại bỏ banner khả dụng bản sao tổng hợp dư thừa khỏi phê duyệt; trạng thái chính tắc của mỗi bản sao vẫn hiển thị và xác thực lại phê duyệt phía máy chủ không đổi.
- Loại bỏ banner trả bình thường/đúng hạn dư thừa trong khi vẫn giữ cảnh báo rà soát phạt quá hạn, hỏng hoặc mất ngoại lệ và giao dịch trả chính tắc.
- Thay cách trình bày mơ hồ `Quá hạn: Đúng hạn` bằng nhãn còn lại/hôm nay/quá hạn rõ ràng suy ra từ ngày nghiệp vụ `Asia/Ho_Chi_Minh`, đồng thời công khai số lần gia hạn chính tắc để hạn trả kéo dài có thể giải thích.
- Giữ bảo vệ vai trò FE07, endpoint thay đổi chính tắc, xác thực lại/giao dịch phê duyệt, xác thực lý do từ chối, lịch sử thành viên và ranh giới quyền sở hữu FE06/FE08/FE09/FE10.
- Thêm hồi quy frontend tập trung; FE07 tập trung 24/24, frontend đầy đủ 201/201, backend FE07 66/66, tích hợp Quản trị/vai trò 25/25, lint/build, truy vết và vệ sinh diff đạt. Rà soát con người vẫn đang mở.
- Căn chỉnh assertion E2E golden path hệ thống với nhãn quá hạn rõ v0.7.3 (`Quá hạn 14 ngày`) thay vì văn bản `14 ngày` mơ hồ đã loại bỏ; bộ E2E Chromium đầy đủ đạt 4/4.

## 2026-07-22 - Kích hoạt hành động hàng Xử lý trả

- Kết nối mỗi nút `Xử lý trả` với mục tiêu xác nhận trả hiện có thay vì chỉ làm nổi bật hàng của nó.
- Giữ API trả chính tắc, chọn tình trạng, tích hợp phạt và hành vi chọn hàng.

## 2026-07-22 - Sửa trạng thái yêu cầu bị từ chối trong lịch sử thành viên

- Công khai trạng thái yêu cầu mượn sở hữu trong hàng lịch sử chi tiết chính tắc.
- Hiển thị yêu cầu bị từ chối là `Đã từ chối` trong khi giữ trạng thái chi tiết đã lưu `REQUESTED` và bộ lọc lịch sử hiện có.

## 2026-07-21 - Phân tier mượn hằng ngày theo trạng thái thành viên

- Thêm giới hạn hằng ngày 5 bản sao cho thành viên được FE04 phê duyệt và 3 bản sao cho tài khoản `MEMBER` đang hoạt động khác.
- Thực thi tier trong lúc thành viên tạo yêu cầu và Thủ thư/Quản trị viên phê duyệt trong khi vẫn giữ trần năm bản sao đang mượn.
- Giữ FE04 không chặn: phê duyệt thành viên tăng hạn mức hằng ngày thay vì được yêu cầu để mượn.

## 2026-07-21 - Dùng điều kiện hợp lệ thành viên dựa trên vai trò

- Thay điều kiện tiên quyết phê duyệt FE04 bằng tài khoản hoạt động cùng ủy quyền vai trò `MEMBER`.
- Giữ việc phê duyệt từng yêu cầu mượn bởi thủ thư/quản trị viên là kiểm soát lưu hành FE07.
- Loại đánh giá sách khỏi phản hồi ứng viên yêu cầu mượn thành viên và UI xác nhận.
- Ổn định bố cục thẻ lịch sử mượn thành viên qua vùng thanh công cụ, bảng và phân trang.

## 2026-07-20 - Bản địa hóa giao diện tiếng Việt và kiểu chữ

- Bản địa hóa nhãn, trạng thái, tên trợ năng và phản hồi lỗi an toàn do frontend tạo cho tính năng này.
- Giữ nguyên hợp đồng API, giá trị enum thô, quyền, quy tắc nghiệp vụ và dữ liệu danh mục/hồ sơ do người dùng sở hữu.
- Áp dụng hợp đồng kiểu chữ dùng chung `Be Vietnam Pro` cho thân bài và `Noto Serif` cho tiêu đề, kèm font dự phòng hỗ trợ Unicode.

## 2026-07-19 - Hoàn tất đầu ra giai đoạn 2

- feat-borrowing-management được chấp nhận trong đợt đối soát hoàn chỉnh Giai đoạn 2 FE01-FE12 ghi nhận bởi PR #40/#41; việc xác thực và các ranh giới còn lại được tổng hợp trong `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Các giới hạn đã hoãn và phạm vi tương lai vẫn được nêu rõ, không bị mở rộng bởi đợt hoàn tất này.

## 2026-07-19 - Đối soát v0.5.1 và hợp đồng lịch sử

- Đối soát điều kiện hợp lệ chính tắc, bảo vệ sách cha đang hoạt động, tuần tự hóa phê duyệt theo phạm vi thành viên, siêu dữ liệu phê duyệt/mượn bắt buộc, ngày nghiệp vụ Thành phố Hồ Chí Minh, từ chối trả tương lai/trước mượn và lý do từ chối bắt buộc.
- Thay lịch sử thành viên từ envelope yêu cầu/phân trang client sang hàng chi tiết chính tắc với lọc trạng thái chi tiết, `OVERDUE` dẫn xuất, phạm vi thành viên, ngày bao gồm hai đầu, thứ tự cơ sở dữ liệu ổn định và phân trang máy chủ.
- Đạt backend FE07 tập trung 66/66, frontend 18/18, truy vết 28/28 và cổng SQL Server dùng một lần tổng hợp 61/61 có dọn dẹp.
- Hồi quy toàn kho, rà soát diff và chấp nhận tích hợp của con người cuối vẫn đang mở.

## 2026-07-18 - Chỉnh sửa bố cục không gian thành viên

- Làm rõ hệ phân cấp chọn mượn của thành viên và bố cục hai cột đáp ứng mà không đổi API thay đổi FE07.
- Hợp nhất bộ lọc lịch sử mượn, bảng và phân trang vào một thẻ vận hành đáp ứng.

## 2026-07-18 - Căn chỉnh lưu hành Quản trị

- Làm bảng lưu hành Quản trị chỉ đọc và điều hướng công việc phê duyệt/trả tới màn hình FE07 chính tắc.
- Loại chèn và cập nhật trực tiếp chi tiết mượn chỉ Quản trị không an toàn.
- Suy ra `OVERDUE` từ `BORROWED` cộng hạn trả, đồng thời thêm phản hồi tải/làm mới và xuất cơ sở dữ liệu chính tắc.
- Loại giao dịch lưu hành demo khỏi seed SQL mốc cơ sở.
- Thêm seed lưu hành chính tắc nhất quán với một khoản mượn đang hoạt động và một lượt trả hoàn tất để mô hình đọc Quản trị có thể được xác minh không cần dữ liệu dự phòng frontend.

## 2026-07-17 - Phê duyệt mốc cơ sở giai đoạn 1

- Nhật phê duyệt hợp đồng mượn, trả, gia hạn, lịch sử và ưu tiên đặt trước FE07 đã chuẩn hóa là mốc cơ sở Giai đoạn 1; triển khai đối soát vẫn đang chờ.

## 2026-07-17 - Hợp đồng ưu tiên trả và đặt trước

- Làm lượt trả bình thường nguyên tử với xác thực lại yêu cầu đặt trước FE08 và thứ tự khóa dùng chung.
- Làm rõ rằng bản sao trả về `AVAILABLE` vẫn không khả dụng cho mượn thông thường khi tồn tại yêu cầu hàng đợi đặt trước `ACTIVE`.

## 2026-07-17 - Hợp đồng lịch sử mượn - v0.5.1

- Đổi `SPEC.md` thành `READY FOR REVIEW` trong khi giữ quyết định đối soát v0.5.0.
- Xác định hợp đồng truy vấn lịch sử thành viên/nhân sự dùng chung, gồm bộ lọc trạng thái/ngày, mặc định và giới hạn trang/giới hạn, ngữ nghĩa ngày bao gồm hai đầu, xác thực-trước-truy vấn và thứ tự ổn định.
- Thêm truy vết cho BR-FE07-028, FR-FE07-028, AC-FE07-022 và tác vụ triển khai tập trung; không đổi mã.

## 2026-07-16 - Phê duyệt rà soát con người cho lập kế hoạch đối soát

- Nhat đã phê duyệt kế hoạch đối soát v0.5.0 FE07 và FE07-T031 đến FE07-T038.
- Đánh dấu `PLAN.md` và `TASKS.md` đối soát là `APPROVED`; các tác vụ triển khai và cổng xác thực mới vẫn chưa được chọn.

## 2026-07-16 - Lập kế hoạch đối soát v0.5.0

- Đổi `PLAN.md` và `TASKS.md` thành `READY FOR REVIEW - v0.5.0 RECONCILIATION` sau khi SPEC được phê duyệt.
- Giữ mọi tác vụ đã chọn lịch sử và bằng chứng B7, sau đó thêm FE07-T031 đến FE07-T038 cho điều kiện hợp lệ chính tắc, bảo vệ sách cha, khóa giới hạn theo phạm vi thành viên, siêu dữ liệu phê duyệt, ngày nghiệp vụ Thành phố Hồ Chí Minh, từ chối trả tương lai, lý do từ chối bắt buộc, lỗi frontend và xác minh tập trung.
- Thêm đường dẫn tệp chính xác, cổng RED/GREEN, thứ tự phụ thuộc, kỳ vọng đồng thời SQL và truy vết v0.5.0 bổ sung mà không khẳng định triển khai lịch sử đã thỏa hợp đồng sửa đổi.

## 2026-07-16 - Phê duyệt rà soát của con người

- Nhat xác nhận rà soát của con người cho bản sửa đổi v0.5.0.
- Đánh dấu `SPEC.md` và `CONTEXT.md` là `APPROVED` và hoàn thành cổng rà soát bản sửa đổi.

## 2026-07-15 - Hợp đồng điều kiện hợp lệ, giới hạn và ngày (v0.5.0)

- Yêu cầu `Members.Status = APPROVED` chính tắc và `Books.Status = ACTIVE` cha khi tạo/phê duyệt.
- Xác định công thức năm bản sao khi tạo/phê duyệt và khóa phê duyệt theo phạm vi thành viên ngăn tràn giới hạn đồng thời.
- Yêu cầu `CreatedBy`, `ApprovedAt`, `ApprovedBy` và `BorrowDate` từng chi tiết; hạn trả là `BorrowDate + 14 calendar days`.
- Chuẩn hóa ngày nghiệp vụ mượn/trả/quá hạn theo `Asia/Ho_Chi_Minh` và từ chối ngày trả tương lai.
- Làm lý do từ chối bắt buộc trong siêu dữ liệu audit và thêm truy vết cho mọi BR/FR/AC mới.
- Căn chỉnh khóa phê duyệt với FE06 bằng `member-scoped lock -> BookCopies -> BorrowRequests/BorrowDetails -> Reservations`; việc đếm đang hoạt động và kiểm tra có nhận biết đặt trước chỉ chạy sau khi các hàng liên quan bị khóa.
- Cập nhật `CONTEXT.md` từ giả định dự thảo Giai đoạn 1 đã bị thay thế sang quyết định rà soát/đối soát v0.5.0.

## 2026-07-15 - Hợp đồng mượn có nhận biết đặt trước (v0.4.0)

- Phê duyệt FE07 là chủ sở hữu tạo và phê duyệt yêu cầu mượn cho cả bản sao thông thường và lượt giữ chỗ đã thông báo thuộc người yêu cầu.
- Thêm quy tắc ưu tiên đặt trước chặn thao tác tạo/phê duyệt thông thường khi tồn tại mục hàng đợi `ACTIVE`.
- Thêm hoàn tất phê duyệt nguyên tử cho lượt đặt trước `NOTIFIED` khớp, gồm yêu cầu audit và hoàn tác đặt trước.
- Thêm FE07-T029 và FE07-T030 có truy vết tới định danh BR/FR/AC mới.
- Giữ giới hạn năm bản sao, thời hạn 14 ngày, một lần gia hạn, chính sách tất cả-hoặc-không, xử lý hàng đợi FE08 thủ công, endpoint hiện có và schema hiện có.

## 2026-07-14 - Hoàn tất tích hợp và rà soát B7

- Push commit triển khai `3a7b0ad1165607b8912c6c0be5f3ef2025c11b55` trên `feat/fe07-validation` và mở PR #19 tới `main`.
- GitHub Actions đạt trên PR, sau đó PR #19 merge thành `aeed0dfecb764e6cbe63d7074727f318700e59ea`.
- Lượt chạy GitHub Actions CI `29308540692` đạt cho commit merge trên `main`.
- Ghi bằng chứng tích hợp tại `.sdd/reviews/fe07-b7-integration-review-closeout-2026-07-14.md` và đánh dấu FE07 hoàn tất qua B7.

## 2026-07-14 - Hoàn tất chấp nhận và xác thực trên trình duyệt B6 L4

- Thêm bảo vệ route thành viên/nhân sự cho mọi màn hình FE07 và loại hàng dự phòng API giả cùng thành công thay đổi mô phỏng khỏi lịch sử, phê duyệt, trả và quy trình chi tiết thành viên.
- Đặt namespace style hộp thoại FE07 dùng chung là `lib-modal*`, giữ bảng rộng trong `.lib-table-wrap` và loại tràn cấp trang tại chiều rộng desktop và di động.
- Giữ khoản mượn quá hạn trong danh sách đang hoạt động mà không nhân đôi chúng vào lịch sử đã trả, đồng thời giữ danh mục tạo yêu cầu tạm thời chỉ là ranh giới phụ thuộc FE01/FE06 được ghi nhận.
- Khắc phục rà soát độc lập đã khôi phục `404` thành viên không xác định, ánh xạ race từ chối mất thành `409`, loại ngày trả UTC client và ghi chú/bằng chứng điều kiện hợp lệ phê duyệt do client bịa ra, tách yêu cầu đang chờ khỏi khoản mượn hoạt động và thêm quản lý focus modal.
- Xác minh truy cập khách/thành viên/nhân sự, phê duyệt yêu cầu, gia hạn, trả bình thường, trạng thái lỗi mạng trung thực, hiển thị modal và bố cục đáp ứng với backend FE07 thực.
- Cổng tự động cuối đạt: frontend 37/37, lint, build production, backend 273/273, SQL trực tiếp 14/14 có dọn dẹp, truy vết FE07 22/22 và `git diff --check`. Không thực hiện commit, push hoặc merge.
- Nhat xác nhận rà soát con người bắt buộc vào 2026-07-14; B6 hoàn thành và chờ quyết định tích hợp.

## 2026-07-13 - Củng cố hiến pháp B6 L3

- Giữ lỗi đọc lại sau commit ngoài xử lý hoàn tác thay đổi cho giao dịch tạo, phê duyệt và trả.
- Xác thực lại tài khoản hoạt động, thành viên đã phê duyệt, phạt dương chưa thanh toán và khoản mượn quá hạn đang hoạt động dưới khóa giao dịch phê duyệt; ánh xạ từng kết quả repository tới lỗi API an toàn hiện có.
- Di chuyển ghi audit từ chối và gia hạn vào giao dịch repository để audit thất bại hoàn tác thay đổi trạng thái.
- Hạn chế bộ lọc ngày FE07 và input trả về ngày dương lịch thực `YYYY-MM-DD`.
- Thêm hồi quy route trong bộ nhớ và bằng chứng SQL thực cho kết quả điều kiện hợp lệ giao dịch và hoàn tác audit. B6 vẫn đang thực hiện.

## 2026-07-13 - Căn chỉnh hợp đồng, mô hình và truy vết B6 L2.3

- Theo dõi người rà soát: sửa lọc `OVERDUE` dẫn xuất trong SQL FE07/FE12 và tính tương đương kiểm thử trong bộ nhớ; thêm cô lập lịch sử trực tiếp, bộ lọc thành viên được chọn độc lập, gia hạn bốn yếu tố chặn, hoàn tác SQL thực và bằng chứng hợp đồng FineCandidate runtime.
- Theo dõi người rà soát: loại phản hồi hợp đồng `404` lịch sử thành viên được chọn chưa phê duyệt và ánh xạ lại FR-FE07-022 tới kiểm thử giao dịch SQL thực.
- Thêm `COMPLETED` vào siêu dữ liệu mô hình yêu cầu đã lưu; làm hạn trả chi tiết được yêu cầu nullable; loại `OVERDUE` chi tiết đã lưu khỏi ràng buộc trạng thái mô hình và SQL trong khi giữ ngữ nghĩa báo cáo FE09/FE12 dẫn xuất.
- Ghi tài liệu xác thực yêu cầu OpenAPI FE07 đã phê duyệt, bộ lọc, payload thành công và phản hồi lỗi an toàn mà không đổi dạng phản hồi runtime.
- Thêm bao phủ chấp nhận lịch sử/bộ lọc thành viên được chọn trực tiếp của nhân sự và ánh xạ AC-FE07-001 đến AC-FE07-014 cùng kiểm thử hoàn tác FR-FE07-022 trực tiếp trong truy vết.
- Làm rõ mặc định yêu cầu trả, siêu dữ liệu audit và việc `CANCELLED` không có endpoint/actor/trigger/payload được phê duyệt trong phạm vi hiện tại.

## 2026-07-12 - Bản địa hóa lỗi API mượn

- Thêm thông báo tiếng Việt có thể hành động cho lỗi vai trò, điều kiện hợp lệ, giới hạn mượn, bản sao, phạt, quá hạn và xung đột gia hạn FE07.
- Giới hạn thông báo riêng cho mượn trong `borrowingApi` và giữ xử lý chung cho các lời gọi API FE06, FE08, FE10 và FE12.
- Trích định dạng lỗi API thành helper frontend có thể kiểm thử trong khi giữ dự phòng xác thực, xác thực, mạng và backend.
- Thêm kiểm thử Node tập trung cho hành vi thông báo lỗi `NFR-FE07-UX-001` và nối kiểm thử frontend vào CI.
- Cập nhật `PLAN.md` để phản ánh màn hình frontend FE07 đã triển khai và phạm vi trạng thái lỗi.

## 2026-06-25 - Chính sách mượn tất cả-hoặc-không (v0.3.2, TD-007)

- Giải quyết TD-007: xử lý yêu cầu mượn Giai đoạn 1 là **tất cả-hoặc-không**. Căn chỉnh đặc tả với
  mã hiện tại thay vì đổi logic lưu hành cốt lõi (quyết định nhóm 2026-06-25).
- Cập nhật FR-FE07-003, FR-FE07-017, FR-FE07-018 và AF-FE07-002 để nêu rằng bất kỳ bản sao trùng lặp /
  không tồn tại / không khả dụng nào đều từ chối toàn bộ yêu cầu/phê duyệt (không có yêu cầu một phần).
- Thêm BR-FE07-022 ghi nhận chính sách tất cả-hoặc-không và hoãn từ chối từng mục sang giai đoạn sau.

## 2026-06-25 - Làm rõ OVERDUE là trạng thái dẫn xuất (v0.3.1)

- Ghi nhận `OVERDUE` là trạng thái dẫn xuất trong Giai đoạn 1: hệ thống không lưu
  `BorrowDetails.Status = 'OVERDUE'`; nó được tính từ chi tiết `BORROWED` với `dueDate < today`
  và được FE09 sử dụng. Trạng thái OVERDUE đã lưu + job theo lịch được hoãn sang giai đoạn sau.
- Điều này căn chỉnh đặc tả với triển khai hiện tại (phát hiện Cổng xác thực); không đổi hành vi.

## 2026-06-02

- Thay dự thảo Mượn sách cũ bằng dự thảo Quản lý mượn sách FE07.
- Mở rộng phạm vi gồm yêu cầu mượn, phê duyệt/từ chối, xử lý trả, gia hạn và lịch sử mượn.
- Thêm ID yêu cầu ổn định cho quy tắc nghiệp vụ, yêu cầu chức năng, tiêu chí chấp nhận, trường hợp biên và câu hỏi mở.

## 2026-06-10

- Cập nhật chính sách hợp đồng API để cho phép phê duyệt trong `SPEC.md` trừ khi nhóm khôi phục tài liệu hợp đồng API dùng chung.
- Giải quyết giới hạn mượn FE07 và thời hạn mượn mặc định bằng các quyết định chung Giai đoạn 1: 5 bản sao đang mượn và 14 ngày dương lịch.
- Giải quyết các câu hỏi mở FE07 còn lại: 1 lần gia hạn, phạt chưa thanh toán chặn mượn/gia hạn, thành viên tự tạo yêu cầu, chi tiết đang chờ dùng `REQUESTED`, yêu cầu tự hoàn thành khi mọi chi tiết ở trạng thái kết thúc và FE09 sở hữu tạo khoản phạt.
- Phê duyệt `SPEC.md` FE07 cho lập kế hoạch Giai đoạn 2 sau rà soát luồng, phê duyệt API, kiểm tra phụ thuộc FE08/FE09 và rà soát khả năng kiểm thử tiêu chí chấp nhận.

## 2026-06-10 - Lát cắt backend sẵn sàng để rà soát

- Thêm kế hoạch backend FE07 và checklist tác vụ cho phạm vi mượn của Nhat.
- Thêm logic yêu cầu mượn, phê duyệt, từ chối, trả, gia hạn, lịch sử, audit và bàn giao thông báo.
- Căn chỉnh tập lệnh SQL với trạng thái yêu cầu/chi tiết mượn đã phê duyệt.
- Thêm kiểm thử backend cho quy tắc mượn, dữ liệu trả/rà soát phạt, gia hạn và bảo vệ vai trò.

## 2026-06-20 - Triển khai UI frontend và xác thực khả năng tiếp cận

- Triển khai màn hình yêu cầu mượn thành viên, lịch sử mượn, phê duyệt/từ chối yêu cầu mượn thủ thư, xử lý trả và chi tiết mượn thành viên.
- Nối tất cả màn hình frontend với API backend bằng axios và React hooks.
- Thêm caption bảng, phạm vi header cột, nhãn có thể tiếp cận cho input ngày, select, nút phân trang và điều khiển icon.
- Thêm hỗ trợ bàn phím cho hàng bảng có thể chọn (Enter/Space).
- Thêm trạng thái tải, rỗng và lỗi trên mọi màn hình đã rà soát.
- Xác thực: `npm.cmd --prefix frontend run lint`, `npm.cmd --prefix frontend run build`, `npm.cmd --prefix backend test`.
- Merge qua PR #7 vào `feat/fe07-fe08-fe10-fe12-ui-polish`.

## 2026-06-25 - Tăng bao phủ yêu cầu không mong muốn (xử lý lỗi)

- Tăng phiên bản lên 0.2.0 (MINOR); trạng thái không đổi (APPROVED).
- Thêm tiểu mục “7.1 Yêu cầu hành vi không mong muốn” với 9 yêu cầu EARS không mong muốn (FR-FE07-014 đến FR-FE07-022) bao phủ vượt giới hạn mượn, thành viên không hợp lệ/không hoạt động, chặn phạt chưa thanh toán/quá hạn, mục yêu cầu không hợp lệ/trùng lặp/rỗng, bản sao không khả dụng khi phê duyệt, race phê duyệt đồng thời, gia hạn không được phép, chuyển trạng thái/ngày không hợp lệ và hoàn tác giao dịch.
- Mỗi FR mới được viết dạng `IF`/`WHERE [condition], the system shall ...` và truy vết tới các nguồn EC-*, BR-* và AF-* hiện có (không tạo logic mới).
- Tỷ trọng FR không mong muốn tăng từ ~15% (2/13) lên ~50% (11/22), đạt mục tiêu ≥30%.
- Mở rộng Ma trận truy vết (Phần 16) với các hàng FR-FE07-014 đến FR-FE07-022 (Ca kiểm thử = TBD).

## 2026-06-25 - Thêm mô hình trạng thái chính thức (sơ đồ trạng thái) cho cả hai vòng đời

- Tăng phiên bản lên 0.3.0 (MINOR); trạng thái không đổi (APPROVED).
- Thêm tiểu mục “10.3 Mô hình trạng thái & quy tắc chuyển đổi” ở cuối Phần 10 Yêu cầu dữ liệu, mô hình hóa riêng hai vòng đời của FE07.
- (A) Vòng đời BorrowRequest: trạng thái PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED — với Mermaid `stateDiagram-v2`, mô tả trạng thái, chuyển đổi hợp lệ (Từ/Đến/Kích hoạt/Điều kiện/FR-BR), chuyển đổi bị cấm và bất biến INV-FE07-A1..A6.
- (B) Vòng đời BorrowDetail: trạng thái REQUESTED, BORROWED, RETURNED, LOST, DAMAGED, OVERDUE — với Mermaid `stateDiagram-v2`, mô tả, chuyển đổi hợp lệ, chuyển đổi bị cấm và bất biến INV-FE07-B1..B8.
- Mọi giá trị trạng thái tái sử dụng enum đã khai báo trong Phần 10.2 (không tạo trạng thái mới). Các chuyển đổi truy vết tới nguồn MF-*, FR-*, BR-*, AF-* và EC-* hiện có.
- Ghi nhận trạng thái đã khai báo enum không có luồng rõ ràng (yêu cầu `CANCELLED`, chi tiết `OVERDUE`) được mô hình hóa theo enum đã khai báo cùng phụ thuộc vào xác nhận FE09 / Giai đoạn 2.

## 2026-07-18 - Chỉnh sửa màn hình rà soát yêu cầu mượn của thủ thư

- Sửa nhãn tiếng Việt và cải thiện bố cục danh sách/chi tiết yêu cầu cho màn hình rà soát thủ thư.
- Thêm lọc trạng thái yêu cầu chính tắc và chỉ báo cập nhật gần nhất hiển thị.
- Làm làm mới thủ công cung cấp phản hồi tải/thành công/lỗi và tải lại trạng thái API chính tắc sau phê duyệt hoặc từ chối.
- Công khai hồ sơ thành viên, ID thành viên chính tắc, điện thoại, mã vạch, tác giả, vị trí và mọi bản sao được yêu cầu từ quan hệ cơ sở dữ liệu hiện có.
- Sắp xếp ID yêu cầu thủ thư tăng dần, thêm phân trang tám hàng và tinh chỉnh thanh công cụ tóm tắt/lọc.
- Thay font fallback tiêu đề từng hiển thị sai một số dấu kết hợp tiếng Việt.
- Thêm tìm kiếm không phân biệt dấu qua mã yêu cầu, danh tính thành viên, sách, tác giả và mã vạch; kết quả tìm kiếm hiện cấp vào cùng phân trang được dùng bởi bộ lọc trạng thái chính tắc.
- Thêm thao tác gửi Tìm kiếm rõ ràng có hỗ trợ phím Enter và tách input nháp khỏi truy vấn áp dụng để kết quả chỉ cập nhật sau xác nhận người dùng.
- Xây lại không gian trả của thủ thư với tải khoản mượn đã phê duyệt chính tắc, phản hồi làm mới/tìm kiếm rõ ràng, trường thành viên/bản sao đầy đủ, phân trang và tải lại chính tắc sau thay đổi trả.

## 2026-07-18 - Làm rõ hành động hàng thủ thư

- Thêm hành động hàng có nhận biết trạng thái cho yêu cầu mượn: yêu cầu đang chờ hiển thị phê duyệt/từ chối, còn yêu cầu kết thúc hiển thị xem chi tiết.
- Thêm hành động xử lý trả rõ ràng cho từng hàng khoản mượn đang hoạt động trong khi giữ panel rà soát tình trạng và xác nhận.
- Giữ mọi thay đổi kết nối với API FE07 hiện có và luồng tải lại máy chủ chính tắc.

## 2026-07-18 - Không gian chi tiết mượn thành viên

- Thay tra cứu ID người dùng thủ công mơ hồ bằng danh mục thành viên dựa trên API tự động tải thành viên khả dụng đầu tiên.
- Thêm tìm kiếm thành viên và giao dịch không phân biệt dấu, lọc trạng thái chính tắc, phân trang tám hàng, bộ đếm tóm tắt và bố cục hồ sơ/bảng đáp ứng.
- Hiển thị trường thành viên, liên hệ, sách, bản sao, mã vạch, vị trí, mượn, hạn trả, trả và trạng thái chính tắc từ quan hệ cơ sở dữ liệu FE07 hiện có.
- Giữ màn hình chỉ dành cho Thủ thư/Quản trị viên và nối nó với endpoint yêu cầu mượn và mượn thành viên dùng chung mà không có dữ liệu dự phòng demo.

## 2026-07-22

- Ổn định không gian Xử lý trả thành bố cục một cột không va chạm.
- Củng cố xử lý mục tiêu phê duyệt/từ chối và thêm migration cột quy trình BorrowRequests đã triển khai.

## 2026-07-29 - Luồng lưu thông liên hoàn v0.9.0

- Phát bốn sự kiện kết quả FE07 sau commit cho phê duyệt, từ chối, gia hạn và trả sách; lỗi tạo thông báo chỉ sinh cảnh báo trung thực, không hoàn tác nghiệp vụ đã hoàn tất.
- Bổ sung mốc thời gian nghiệp vụ chính tắc cho hành trình mượn và handoff bản sao vừa trả sang hàng đợi FE08 khi có lượt đặt `ACTIVE`.
- Giữ kín lý do từ chối khỏi nội dung thông báo và dùng đường dẫn hành động cố định, an toàn.
- Bằng chứng cục bộ: 90/90 kiểm thử FE07 tập trung; toàn backend 1125/1125; frontend 269/269; luồng Playwright liên hoàn 1/1.
- Product diff vẫn chưa stage/commit/push, chờ duyệt H2.
