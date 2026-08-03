# CHANGELOG.md - FE05 Quản lý sách

## 2026-08-03 - Xóa vật lý có bảo vệ và hiển thị trạng thái độc lập (v0.6.13)

- Sau lệnh trạng thái, hiển thị tất cả trạng thái từ dữ liệu chuẩn để các sách không bị tác động không có vẻ đổi theo sách được chọn.
- Thêm xóa vật lý riêng cho sách chưa có bản sao, với `If-Match`, xác nhận, lý do và audit nguyên tử.
- Từ chối xóa sách có bản sao/lịch sử bằng `409 BOOK_HAS_DEPENDENCIES` để bảo toàn dữ liệu nghiệp vụ.
## 2026-08-04 - Vệ sinh dữ liệu catalog staging và danh sách nhiều trạng thái (v0.6.13)

- Sau lệnh trạng thái một sách, giữ tìm kiếm/thể loại nhưng chuyển bộ lọc trạng thái sang `Tất cả trạng thái` để các hàng không bị ảnh hưởng vẫn hiển thị trạng thái riêng.
- Hiển thị rõ bộ lọc trạng thái đã áp dụng trên panel danh sách.
- Bổ sung công cụ operator dry-run mặc định, giới hạn `LibraryManagementStaging`, để hard-delete chính xác graph dữ liệu acceptance đã xác minh.
- Giữ ISBN tùy chọn cho sách thật, không đổi schema/API/role và không chuyển quyền sở hữu trạng thái bản sao khỏi FE06.

## 2026-08-03 - Giữ sách vừa đổi trạng thái hiển thị (v0.6.12)

- Sửa cả luồng đổi trạng thái từ biểu mẫu cập nhật và lệnh trạng thái riêng để chuyển bộ lọc sang trạng thái đã commit, đặt lại trang 1 và tải lại dữ liệu chuẩn.
- Giữ nguyên tìm kiếm, thể loại, `If-Match`, bước xác nhận và các endpoint trạng thái riêng.
- Bổ sung kiểm thử hồi quy cho hai điểm vào để tránh giao diện tiếp tục hiển thị trạng thái cũ hoặc làm cuốn sách vừa cập nhật biến mất.

## 2026-08-02 - Hoàn tất audit nguyên tử cho dữ liệu tham chiếu catalog

- Hoàn tất `FE05-T019` qua commit `e64c636`, PR #95, CI sau merge `30711057582` và staging deployment `30711210037` trên `e01585a`.
- Giữ nguyên schema, endpoint, role, response envelope và soft-deactivation hiện có.

## 2026-08-01 - Kích hoạt củng cố audit dữ liệu tham chiếu catalog (v0.6.11)

- Làm rõ mutation tác giả/nhà xuất bản/thể loại của Quản trị viên chịu ranh giới transaction/audit FE05 hiện có.
- Kích hoạt `FE05-T019`; chưa ghi nhận bằng chứng triển khai sản phẩm.

## 2026-07-28 - Giữ bộ lọc sau khi cập nhật trạng thái một sách

- Không để các lệnh trạng thái xóa bộ lọc hiện tại và bất ngờ hiển thị các sách không hoạt động vốn đang bị ẩn.
- Tải lại cùng ngữ cảnh tìm kiếm/danh mục/trạng thái/trang chính tắc sau khi thay đổi `bookId` đã chọn.
- Giữ từng hàng hiển thị gắn với `Books.Status` do máy chủ sở hữu.

## 2026-07-28 - Cho phép migration tương thích tính năng đã được phê duyệt khi khởi động

- Giữ trạng thái sẵn sàng của danh mục FE05 trong khi cho phép cổng khởi động áp dụng migration ràng buộc auth-token FE02 đã được phê duyệt riêng.
- Cập nhật hợp đồng triển khai để yêu cầu migration được đóng gói và xác minh điều kiện sau trước khi lắng nghe.
- Đồng bộ phạm vi SPEC v0.6.9, PLAN, TASKS, hướng dẫn triển khai và phạm vi chính sách quy trình.

## 2026-07-28 - Giữ danh sách nhiều trạng thái sau khi cập nhật một sách

- Giữ phần trình bày khả dụng chỉ đọc ban đầu trong chi tiết sách.
- Không để cả hai điểm vào thay đổi trạng thái chuyển toàn bộ danh sách sang bộ lọc trạng thái đích của sách đã chọn.
- Sau khi thành công, tải lại trang đầu chính tắc có mọi trạng thái để các sách không bị ảnh hưởng vẫn hiển thị cùng trạng thái do máy chủ sở hữu.
- Sửa cột trạng thái của danh sách để hiển thị `Books.Status` chính tắc; tính khả dụng của bản sao vẫn là một mối quan tâm chỉ đọc riêng biệt.

## 2026-07-28 - Bật triển khai staging liên tục có cổng CI

- Chỉ tự động kích hoạt `Deploy staging` sau khi lượt chạy CI `main` thành công và checkout chính xác commit đã được kiểm thử.
- Giữ khả năng chạy lại thủ công, migration khởi động đã đóng gói, hỗ trợ phê duyệt môi trường và smoke staging fail-closed.
- Đồng bộ SPEC v0.6.8, PLAN, TASKS, hướng dẫn triển khai và hồi quy chính sách quy trình.

## 2026-07-27 - Chạy migration tương thích siêu dữ liệu an toàn khi biên dịch lúc khởi động backend

- Đóng gói migration siêu dữ liệu giao dịch đã được rà soát cùng bản triển khai backend.
- Thêm cổng khởi động trước khi lắng nghe để áp dụng migration idempotent, xác minh điều kiện sau của nó,
  và từ chối phục vụ một danh mục chỉ tương thích một phần khi đối soát thất bại.
- Hoãn việc xác thực `Status` của siêu dữ liệu sang `sp_executesql` để SQL Server biên dịch truy vấn sau
  khi các cột còn thiếu được thêm trong giao dịch bao quanh.
- Thêm phạm vi hồi quy và xác minh hai lượt đạt liên tiếp trên cơ sở dữ liệu cục bộ dùng một lần
  `CodexMetadataMigrationValidation_20260727`, sau đó đã xóa cơ sở dữ liệu đó.
- Giữ `/health/ready` chỉ đọc, triển khai staging chỉ thủ công, kiểm tra smoke fail-closed và các
  ranh giới thay đổi chỉ Quản trị viên cùng tham chiếu đang hoạt động dành cho Thủ thư/Quản trị viên hiện có.
- Không dùng đường dẫn Kudu/`Repair staging metadata schema` đã bị loại bỏ và Node runtime tách biệt của nó.
- Đối soát hướng dẫn vận hành với quy trình staging chỉ thủ công và lược đồ chính tắc gồm 21 bảng.

## 2026-07-27 - Loại bỏ quy trình sửa staging Kudu thất bại

- Loại bỏ `Repair staging metadata schema`, trình chạy Kudu/Node, runtime đi kèm, lệnh npm,
  input quy trình, kiểm thử chuyên biệt và bằng chứng phụ lục của nó.
- Chuyển `Deploy staging` thành chỉ thủ công để các lần push chạy CI mà không tự động tạo một lượt
  triển khai staging chắc chắn thất bại khi cơ sở dữ liệu vẫn yêu cầu migration do vận hành viên thực hiện.
- Giữ migration SQL đã được rà soát, endpoint sẵn sàng chỉ đọc, kiểm tra smoke fail-closed và các ranh giới vai trò Quản trị viên/Thủ thư FE05/FE11.

## 2026-07-27 - Phát hiện và sửa lệch lược đồ siêu dữ liệu đã triển khai

- Thêm trạng thái sẵn sàng lược đồ danh mục chỉ đọc cho `Status` và `CreatedAt` đã lưu của tác giả/nhà xuất bản/danh mục.
- Thêm migration SQL tương thích siêu dữ liệu đã được rà soát để vận hành viên được phân quyền thực hiện.
- Mở rộng smoke staging để thất bại trước khi chấp nhận khi lược đồ siêu dữ liệu đã triển khai cũ hơn hợp đồng kho mã.
- Giữ thay đổi siêu dữ liệu chỉ dành cho Quản trị viên và lượt đọc lựa chọn đang hoạt động của Thủ thư/Quản trị viên mà không mở rộng vai trò.

## 2026-07-27 - Ranh giới ISBN công khai/nhân sự

- Phân loại ISBN là siêu dữ liệu quản lý của nhân sự FE05: có thể tìm kiếm và hiển thị cho người dùng Thủ thư/Quản trị viên đã xác thực.
- Loại ISBN khỏi việc khớp tìm kiếm công khai của Khách/Thành viên, DTO danh sách và DTO chi tiết, đồng thời giữ tìm kiếm công khai theo tiêu đề/tác giả.
- Đồng bộ yêu cầu, giao diện, tác vụ và chiến lược kiểm thử FE05 với duyệt công khai FE01 và ủy quyền một vai trò FE11.

## 2026-07-23 - Đối soát vai trò và giao diện FE01/FE11

- Thêm endpoint `/api/books/metadata` đã triển khai và được bảo vệ vào hợp đồng API và chiến lược kiểm thử FE05.
- Làm rõ rằng Thủ thư/Quản trị viên cùng thực hiện thay đổi sách FE05, trong khi thay đổi danh mục/tác giả/nhà xuất bản vẫn chỉ dành cho Quản trị viên thông qua tích hợp Thư viện Quản trị FE11.
- Loại bỏ mâu thuẫn PLAN cũ phân loại tải ảnh bìa do hệ thống quản lý là ngoài phạm vi, và đồng bộ PLAN với SPEC v0.6.2.

## 2026-07-22 - Giữ hiển thị sau khi cập nhật trạng thái

- Đối soát bộ lọc trạng thái quản lý với trạng thái đích đã ghi nhận sau khi biểu mẫu cập nhật kích hoạt/ngừng kích hoạt.
- Đặt lại danh sách chính tắc do máy chủ sở hữu về trang 1 để sách cập nhật không có vẻ biến mất vì bộ lọc trạng thái trước đó vẫn đang hoạt động.

## 2026-07-22 - Tải ảnh bìa sách do hệ thống quản lý

- Thay thế các điều khiển URL ảnh bìa có thể chỉnh sửa trong biểu mẫu tạo và cập nhật của Thủ thư/Quản trị viên bằng chọn tệp JPG/PNG/WebP cục bộ, hướng dẫn tên tệp/loại/kích thước và xem trước ảnh.
- Thêm xử lý tạo/cập nhật multipart tương thích ngược với `metadata` cùng `cover` tùy chọn, giới hạn 2 MB, xác thực phần mở rộng/MIME/chữ ký, tên tệp do máy chủ tạo và phân phối tĩnh `/uploads/book-covers`.
- Thêm cơ chế bù trừ để dữ liệu không hợp lệ, cũ, lỗi cơ sở dữ liệu hoặc lỗi audit không thay thế ảnh bìa đã ghi nhận hay giữ lại tệp do hệ thống quản lý chưa ghi nhận; không bao giờ xóa đường dẫn không được quản lý/bên ngoài.
- Giữ nguyên `Books.CoverUrl`, các client JSON hiện có, lược đồ SQL, `If-Match`, tính nguyên tử audit, dạng phản hồi công khai và ranh giới sở hữu FE06.

## 2026-07-20 - Bản địa hóa giao diện tiếng Việt và kiểu chữ

- Bản địa hóa nhãn, trạng thái, tên trợ năng và phản hồi lỗi an toàn do frontend tạo cho tính năng này.
- Giữ nguyên hợp đồng API, giá trị enum thô, quyền, quy tắc nghiệp vụ và dữ liệu danh mục/hồ sơ do người dùng sở hữu.
- Áp dụng hợp đồng kiểu chữ dùng chung `Be Vietnam Pro` cho thân bài và `Noto Serif` cho tiêu đề, kèm font dự phòng hỗ trợ Unicode.

## 2026-07-19 - Củng cố migration staging Azure giai đoạn 3

- Tái hiện lệch lược đồ staging, nơi truy vấn danh mục FE05 đã triển khai thất bại vì thiếu `Books.RowVersion`.
- Cập nhật migration đối soát FE05 đã phê duyệt để xóa và tạo lại `UX_Books_ISBN_NotNull`, đồng thời thu hẹp `Books.ISBN` cũ, tránh lỗi SQL Server 4922 từ chỉ mục lọc phụ thuộc.
- Áp dụng cả năm migration đối soát được phê duyệt hai lần cho `LibraryManagementStaging`; danh mục công khai và kiểm tra smoke staging có nhận biết SQL sau đó đều đạt.

## 2026-07-19 - Hoàn tất đầu ra giai đoạn 2

- feat-book-management được chấp nhận trong đợt đối soát hoàn chỉnh Giai đoạn 2 FE01-FE12 ghi nhận bởi PR #40/#41; việc xác thực và các ranh giới còn lại được tổng hợp trong `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Các giới hạn đã hoãn và phạm vi tương lai vẫn được nêu rõ, không bị mở rộng bởi đợt hoàn tất này.

## 2026-07-19 - Loại bỏ các thay đổi sách trùng lặp trong Bảng điều khiển Quản trị

- Giữ hàng sách Thư viện của `UserManagement` ở chế độ chỉ đọc và loại bỏ các điều khiển tạo/sửa/ngừng kích hoạt sách.
- Loại bỏ các alias thay đổi sách FE11 `adminApi` không dùng; `BookManagement` chính tắc vẫn là bề mặt thay đổi FE05 duy nhất.
- Thêm phạm vi hồi quy frontend cho ranh giới sở hữu FE05/FE11.

## 2026-07-19 - Bằng chứng đối soát kết hợp

- Thực hiện FE05-T001 đến FE05-T008 từ kiểm thử RED đến xác minh tập trung trong worktree cô lập `feat/fe05-book-reconciliation`.
- Đối soát lượt đọc frontend với `/api/admin/books`, phân trang do máy chủ sở hữu, phản hồi chính tắc `{ items, pagination }`/`{ book }` và truyền phiên bản `If-Match`.
- Thêm UX xác nhận/lý do cho các lệnh ngừng kích hoạt/kích hoạt lại có lý do, và ánh xạ `STALE_BOOK_STATE` thành thông báo tải lại trung thực.
- Thêm bộ SQL FE05 còn thiếu và sửa so sánh rowversion để chuẩn hóa buffer `mssql` thô thay vì so sánh chuỗi nhị phân driver với phiên bản hex API.
- Đạt backend tập trung 45/45, SQL FE05 7/7, frontend 6/6, truy vết 26/26, vệ sinh diff và cổng SQL tổng hợp 61/61 cùng dọn dẹp.
- Chấp nhận trên trình duyệt và các cổng tích hợp do con người thực hiện vẫn đang mở.

## 2026-07-19 - Đang đối soát sở hữu bản sao và route

- Loại bỏ route thay đổi tính khả dụng FE05 và không để giao diện Quản lý sách thay đổi trạng thái bản sao vật lý.
- Thêm route danh sách chuẩn `/api/admin/books` được bảo vệ và các lệnh ngừng kích hoạt/kích hoạt lại rõ ràng có lý do bắt buộc.
- Đổi văn bản bản sao không khả dụng công khai thành `Không khả dụng`; rowversion, audit nguyên tử, truy vấn xác định và bằng chứng tác vụ còn lại vẫn chờ.

## 2026-07-18 - Điều hướng Quản lý sách của Thủ thư

- Thêm mục thanh bên và route `/librarian/books` chuyên biệt cho quản lý sách FE05 của Thủ thư.
- Loại bỏ chuyển hướng trước đây từ `/librarian/books` sang trang phạt FE09.
- Giữ FE05 chỉ dành cho các vai trò Thủ thư/Quản trị viên đã xác thực thông qua page shell chuyên biệt.

## 2026-07-18 - Dấu thời gian tạo siêu dữ liệu danh mục

- Thêm dấu thời gian `CreatedAt` do cơ sở dữ liệu sở hữu cho danh mục, tác giả và nhà xuất bản.
- Cập nhật các lượt đọc/tạo quản lý siêu dữ liệu được bảo vệ để trả về dấu thời gian đã lưu.
- Thay placeholder giao diện quản trị bằng dấu thời gian cơ sở dữ liệu đã định dạng.
- Thực thi quy tắc sách không hoạt động hiện có trong việc tạo mượn FE07 và đặt trước FE08, đồng thời giữ nguyên tồn kho và lượt đọc lịch sử.
- Thêm ngừng kích hoạt theo trạng thái cho danh mục, tác giả và nhà xuất bản mà không tạo thay đổi dây chuyền cho sách hiện có.

## 2026-07-17 - Phê duyệt mốc cơ sở giai đoạn 1

- Nhật đã phê duyệt ranh giới đặc tả, kế hoạch và tác vụ FE05 được chuẩn hóa làm mốc cơ sở Giai đoạn 1; các tác vụ triển khai vẫn đang chờ.

## 2026-07-17 - Rà soát hợp đồng cuối cùng

- Làm cho luồng danh sách sách nhân sự dùng các bộ lọc và hợp đồng sắp xếp/thứ tự đã được phê duyệt.
- Thay cách diễn đạt hiệu năng tìm kiếm không thể xác minh bằng yêu cầu lọc cơ sở dữ liệu.

## 2026-07-17 - Diễn đạt hợp đồng chi tiết - v0.5.1

- Làm rõ rằng lượt đọc chi tiết của nhân sự có thể trả về cả sách `ACTIVE` và `INACTIVE`; người gọi công khai vẫn chỉ nhận chi tiết an toàn cho công khai đang hoạt động hoặc `404`.
- Đánh dấu SPEC/PLAN/TASKS sẵn sàng để con người rà soát lại; không thay đổi hành vi triển khai hoặc mã.

## 2026-07-16 - Phê duyệt rà soát của con người cho việc lập kế hoạch

- Nhat đã phê duyệt kế hoạch đối soát prototype FE05 và yêu cầu phân rã tác vụ.
- Đánh dấu `PLAN.md` và `TASKS.md` là `APPROVED`; các tác vụ triển khai vẫn chưa được chọn và chưa bắt đầu.

## 2026-07-16 - Phân rã lập kế hoạch triển khai

- Thay `PLAN.md` và `TASKS.md` giữ chỗ bằng kế hoạch đối soát `READY FOR REVIEW` cho SPEC v0.5.0 đã được phê duyệt.
- Thêm các tác vụ RED/GREEN có thứ tự cho truy vấn xác định, xác thực siêu dữ liệu, SQL `rowversion`/`If-Match`, ghi audit nguyên tử và các lệnh ngừng kích hoạt/kích hoạt lại chuyên biệt.
- Nêu rõ việc loại bỏ quyền sở hữu thay đổi trạng thái bản sao FE05 và thay thế kỳ vọng frontend prototype, với mọi yêu cầu BR/FR/AC trong tổng số 61 được ánh xạ tới các tác vụ cụ thể và cổng xác minh.

## 2026-07-16 - Phê duyệt rà soát của con người

- Nhat xác nhận đã có rà soát của con người cho bản sửa đổi v0.5.0.
- Đánh dấu `SPEC.md` và `CONTEXT.md` là `APPROVED` và hoàn thành cổng rà soát bản sửa đổi.

## 2026-07-15 - Sở hữu danh mục và hợp đồng xác định (v0.5.0)

- Loại bỏ quyền sở hữu thay đổi trạng thái bản sao FE05 và xóa hợp đồng `/api/books/{bookId}/availability`.
- Xác định tính khả dụng công khai là tổng hợp chỉ đọc của `Books.Status` và các trạng thái bản sao do FE06 sở hữu.
- Chuẩn hóa ngừng kích hoạt/kích hoạt lại `ACTIVE`/`INACTIVE` mà không ghi lại các hàng bản sao, mượn, đặt trước hoặc lịch sử.
- Thêm bảo vệ ghi cũ SQL `rowversion`/`If-Match`, quy tắc tìm kiếm/phân trang/sắp xếp xác định và tiêu chí từ chối rõ ràng cho trang/đánh giá không hợp lệ.
- Chuẩn hóa nhãn hiển thị không khả dụng dẫn xuất là `Không khả dụng` để các bản sao được đặt trước/hỏng/mất/không hoạt động không bị gắn nhãn sai là đã mượn.
- Thêm truy vết BR/FR/AC hoàn chỉnh với ý định kiểm thử dự kiến cụ thể.

## 2026-06-02

- Tạo đặc tả Quản lý sách FE05 ban đầu.
- Xác định phạm vi quản lý danh mục sách, gồm liệt kê, tạo, cập nhật và ngừng kích hoạt sách.
- Làm rõ trách nhiệm của Khách, Thành viên và Thủ thư.
- Thêm ID ổn định cho quy tắc nghiệp vụ, yêu cầu chức năng, tiêu chí chấp nhận, trường hợp biên và câu hỏi mở.
- Xác định các cân nhắc RESTful API cho thao tác quản lý sách.
- Thêm các giả định mô hình dữ liệu cho thực thể Books, Categories, Authors và Publishers.

## 2026-06-10

- Hoàn thành các phần `SPEC.md` FE05 theo yêu cầu của mẫu SDD: tiêu chí chấp nhận, trường hợp biên, yêu cầu dữ liệu, hợp đồng API, yêu cầu phi chức năng, ngoài phạm vi, phụ thuộc, câu hỏi mở, truy vết và danh sách kiểm tra rà soát.
- Căn chỉnh cấp độ phạm vi FE05 với Danh sách tính năng chính thành Đặc tả tiêu chuẩn.
- Cập nhật ghi chú mô hình dữ liệu hiện tại để khớp hơn với tập lệnh SQL.
- Cập nhật chính sách hợp đồng API để cho phép phê duyệt trong `SPEC.md` trừ khi nhóm khôi phục một tài liệu hợp đồng API dùng chung.

## 2026-06-10 - Phê duyệt quyết định rà soát giai đoạn 1

- Phê duyệt các quyết định câu hỏi mở từ `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Cập nhật trạng thái quyết định `SPEC.md` từ draft/proposed/open thành approved ở nơi áp dụng.
- Giữ các biện pháp kiểm soát phạm vi Giai đoạn 1 và nêu rõ các hạng mục công việc tương lai bị hoãn.

## 2026-06-21

- Cập nhật hành vi ngừng kích hoạt FE05 để `Delete Book` thực hiện loại bỏ danh mục dựa trên trạng thái ngay cả khi các bản sao hiện đang được mượn hoặc đặt trước.
- Làm rõ rằng lịch sử mượn/đặt trước và bản ghi bản sao không thay đổi khi một sách bị ẩn khỏi danh mục công khai.
- Thêm hỗ trợ cập nhật của nhân sự để thay đổi trực tiếp `status` của sách giữa `ACTIVE` và `INACTIVE`.
- Cập nhật hợp đồng API và ghi chú bối cảnh FE05 để khớp với payload cập nhật `/api/books/{bookId}` đã triển khai.

## 2026-06-22

- Thêm ghi chú lệch prototype vào `PLAN.md` và `TASKS.md`.
- Làm rõ rằng mã backend/frontend FE05 hiện có là mã prototype/demo cho đến khi được đối soát với các tác vụ đã phê duyệt, thẻ truy vết, kiểm tra vai trò, ghi audit và kiểm thử.

## 2026-06-25

- Tăng phiên bản `SPEC.md` lên 0.2.0 (MINOR) và cập nhật Cập nhật gần nhất thành 2026-06-25; Trạng thái không thay đổi (APPROVED).
- Tăng tỷ trọng Yêu cầu chức năng “Không mong muốn” (điều kiện lỗi/bất thường) để đạt mục tiêu bao phủ EARS >=30%.
- Thêm 9 FR Không mong muốn EARS mới (dạng IF/WHERE), mỗi FR đều truy vết tới Luồng thay thế, Trường hợp biên hoặc Quy tắc nghiệp vụ hiện có — không bổ sung logic mới:
  - FR-FE05-011: Từ chối ISBN trùng lặp khi tạo/cập nhật (AF-FE05-001, EC-FE05-003, BR-FE05-005).
  - FR-FE05-012: Từ chối tiêu đề thiếu/rỗng (EC-FE05-002, BR-FE05-006).
  - FR-FE05-013: Từ chối tham chiếu danh mục/tác giả/nhà xuất bản không tồn tại (AF-FE05-002, EC-FE05-005/006/007).
  - FR-FE05-014: Trả về không tìm thấy cho sách không tồn tại khi xem/cập nhật/ngừng kích hoạt (AF-FE05-003, EC-FE05-001).
  - FR-FE05-015: Từ chối Khách/Thành viên truy cập quản lý sách được bảo vệ (AF-FE05-004, EC-FE05-009, BR-FE05-002/003/004).
  - FR-FE05-016: Từ chối năm xuất bản không hợp lệ hoặc trong tương lai (EC-FE05-008).
  - FR-FE05-017: Từ chối từ khóa tìm kiếm quá dài (EC-FE05-011).
  - FR-FE05-018: Hoàn tác cập nhật sách và nhật ký audit khi thất bại một phần (EC-FE05-012, NFR-FE05-TXN-001).
  - FR-FE05-019: Ngăn mượn và ẩn sách INACTIVE khỏi tìm kiếm công khai trong khi vẫn giữ lịch sử (BR-FE05-008/009, EC-FE05-010, Q-FE05-007).
- Cập nhật §16 Ma trận truy vết với 9 FR mới (Ca kiểm thử được đánh dấu TBD).
- Kết quả: tổng FR 10 -> 19; FR Không mong muốn 0 -> 9 (~47.4%).

## 2026-07-18 - Căn chỉnh bố cục Thủ thư

- Căn chỉnh không gian làm việc quản lý sách của thủ thư với hệ thống trực quan kem-nâu dùng chung.
- Làm rõ các thẻ tổng quan, tìm kiếm, bộ lọc, bảng, nút và nhãn phần tiếng Việt mà không thay đổi hành vi API FE05.
- Loại bỏ tiêu đề mô-đun bên trong bị lặp, cho thao tác làm mới tải lại cả siêu dữ liệu danh mục và hàng sách, đồng thời thêm phân trang quản lý tám hàng.
- Đổi tên khu vực mang tính phá hủy Delete thành hành vi ngừng kích hoạt mềm thực tế, trong khi vẫn giữ danh mục và lịch sử quy trình.
- Sau khi tạo, đặt lại các bộ lọc quản lý không tương thích và chuyển tới trang chứa bản ghi sách chính tắc mới.
- Hiển thị số thứ tự hàng liên tục qua các trang trong khi vẫn dùng BookId cơ sở dữ liệu bất biến cho các lệnh gọi API và quan hệ liên tính năng.

## 2026-07-22

- Kết nối bộ lọc tìm kiếm, trạng thái và danh mục của Thủ thư/Quản trị viên với danh sách sách nhân sự chính tắc.
- Loại bỏ các điều khiển/chi tiết xếp hạng dành cho nhân sự và input lý do/xác nhận trạng thái sách, đồng thời giữ lý do audit được tạo.
- Thêm đối soát lược đồ siêu dữ liệu đã triển khai cho Authors, Publishers và Categories.
- Thêm lựa chọn trạng thái danh mục `Còn sách`/`Không khả dụng` vào biểu mẫu cập nhật của Thủ thư; giao diện tiếp tục dùng các API kích hoạt lại/ngừng kích hoạt chuyên biệt an toàn theo phiên bản và không thay đổi trạng thái bản sao vật lý.
- Ghi nhận rằng Quản lý sách đã triển khai yêu cầu cả migration rowversion FE05 và migration tương thích siêu dữ liệu thư viện vì triển khai mã không áp dụng migration SQL.
