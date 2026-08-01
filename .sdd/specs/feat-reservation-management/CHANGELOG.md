# CHANGELOG.md - FE08 Quản lý đặt chỗ

## 2026-08-01 - Đóng truy vết triển khai 100%

- Gắn hành vi giữ bản sao, CTA đúng owner/copy, quyết định xử lý thủ công và cảnh
  báo an toàn đã triển khai vào `FR-FE08-007`, `FR-FE08-036`, `FR-FE08-037`
  và `FR-FE08-038` tại đúng ranh giới production.
- Đổi metadata triển khai sang `COMPLETE`; không thay đổi FIFO, API, schema hoặc
  quyền sở hữu trạng thái FE08.
- Sau reset quota, Azure runtime hiện `Running`/`Online` và smoke bản đang deploy
  đạt; closeout candidate chưa deploy nên chưa thể dùng kết quả này để nghiệm thu.

## 2026-07-29 - Đồng bộ trạng thái phát hành hậu merge (v0.6.2)

- Xác nhận phạm vi FE08 đã merge vào `main` và CI hậu merge đạt.
- Ghi rõ Azure staging chưa thể chấp nhận do Azure SQL đang `Paused` sau khi hết quota;
  không xem đây là bằng chứng triển khai thành công.

## 2026-07-29 - Giữ nguyên bản sao khi handoff bị lỗi thời (v0.6.1)

- FE08 chỉ mở đúng `copyId` do FE07 bàn giao trong lần tải đầu tiên.
- Khi bản sao đó không còn hàng đợi active, UI hiển thị cảnh báo stale state
  và không tự chuyển sang bản sao khác.
- Nhân viên vẫn có thể tải lại hoặc chọn thủ công một bản sao đang có hàng đợi,
  phù hợp `FR-FE08-039`.

## 2026-07-29 - Kích hoạt governance luồng demo liên hoàn (v0.6.0)

- Thêm BR-FE08-021/022, FR-FE08-036..039 và AC-FE08-023..025.
- Chốt owner-only held-copy CTA, decision surface thủ công, safe warning và
  stale refresh.
- Chưa thay đổi product code; H1 đã duyệt và activation đang chờ H3/merge.

## 2026-07-27 - Đối soát các thay đổi song song v0.5.9 (v0.5.10)

- Kết hợp loại trừ khoản mượn cùng sách hiện tại với trình bày vị trí hàng đợi
  theo phạm vi bản sao từ `main@8d0059b`.
- Giữ `FE08-T046` upstream có thẩm quyền cho làm rõ vị trí hàng đợi và
  đánh số lại xác minh bàn giao chỉ hồi quy của nhánh này thành
  `FE08-T047`.
- Làm rõ rằng vị trí hàng đợi chính tắc null hiển thị `Chưa xác định`
  thay vì cách trình bày không hợp lệ `#null`/`#undefined`.
- Bằng chứng tích hợp mới và rà soát H2 vẫn bắt buộc trước commit/push.

## 2026-07-27 - Làm rõ vị trí hàng đợi theo phạm vi bản sao (song song v0.5.9)

- Giữ vị trí hàng đợi chính tắc theo `CopyId` vật lý; `#2` cho hai sách khác nhau hợp lệ vì chúng là hàng đợi riêng.
- Đổi cách diễn đạt nhãn bảng Thành viên và Thủ thư để xác định vị trí thuộc bản sao sách đó.
- Loại dự phòng frontend tạo `#1` khi máy chủ không trả vị trí hàng đợi.

## 2026-07-27 - Tích hợp loại trừ cùng sách với căn chỉnh quy tắc (v0.5.9)

- Tích hợp loại trừ khoản mượn cùng sách hiện tại upstream với cửa sổ nhận sách,
  bàn giao FE07 chính xác và hợp đồng tương thích một vai trò hiện có.
- Giữ `FE08-T045` upstream có thẩm quyền và đánh số lại xác minh bàn giao
  chỉ hồi quy của nhánh này thành `FE08-T046`.
- Bằng chứng tích hợp mới được ghi nhận; phụ lục H2 vẫn bắt buộc trước khi
  merge đang mở có thể được commit hoặc push.

## 2026-07-27 - Đối soát bàn giao nhận sách với căn chỉnh quy tắc (v0.5.8)

- Giữ hành vi cửa sổ nhận sách FE08 upstream và bàn giao `bookId`/`copyId` FE07 chính xác.
- Giữ hợp đồng một tài khoản/một vai trò và ranh giới phòng thủ mảng cũ không hợp lệ.
- Giữ `FE08-T044` upstream có thẩm quyền và đánh số lại tác vụ chỉ hồi quy của lát cắt này thành `FE08-T046`.

## 2026-07-27 - Chặn đặt chỗ cùng sách trong khoản mượn đang hoạt động

- Kết nối điều kiện hợp lệ FE08 với trạng thái `BorrowDetails.Status = BORROWED` chính tắc FE07 ở cấp `BookId`.
- Loại ứng viên cùng sách cho Thành viên hiện tại và thêm xung đột API `409 BOOK_ALREADY_BORROWED` ổn định cho yêu cầu trực tiếp.
- Xác thực lại xử lý hàng đợi Thủ thư/Quản trị viên để đặt chỗ cũ bị bỏ qua không thay đổi trạng thái `ACTIVE` hoặc bản sao khả dụng.
- Chia sẻ khóa lưu hành Thành viên FE07 với thay đổi tạo/giữ FE08 và thêm hồi quy thông báo lỗi backend lẫn frontend.

## 2026-07-27 - Kết nối cửa sổ nhận sách đã thông báo với FE07

- Thêm thông báo nhận sách dành cho Thành viên suy ra từ `NotifiedAt` và `ExpiresAt` chính tắc thay vì thêm ngày ghi chú thủ công riêng.
- Thêm `Tạo yêu cầu mượn` cho hàng `NOTIFIED` và bàn giao chính xác `bookId`/`copyId` được giữ cho FE07.
- Giữ quyền sở hữu hàng đợi Thủ thư/Quản trị viên FE08, phê duyệt yêu cầu đang chờ và hoàn tất đặt chỗ nguyên tử FE07, cùng yêu cầu sẵn sàng đặt chỗ hiện có của FE10.
- Cập nhật assertion chấp nhận ứng viên Chromium thành nhãn `Đang đặt chỗ` hiện tại.

## 2026-07-27 - Đối soát diễn đạt một vai trò v0.5.7 với luồng Thành viên mới nhất

- Giữ bàn giao sách đã chọn và trình bày hiện tại-so-với-lịch-sử được giới thiệu bởi v0.5.6.
- Làm rõ mảng `MEMBER + LIBRARIAN` và `MEMBER + ADMIN` là dữ liệu tương thích cũ bị hỏng có chủ ý, không phải tài khoản được hỗ trợ.
- Đánh số lại tác vụ chỉ hồi quy căn chỉnh quy tắc để `FE08-T042` đến `FE08-T044` upstream vẫn có thẩm quyền.
- Căn chỉnh NFR-FE08-UX-003 và chấp nhận trình duyệt với nhãn vòng đời `Đang đặt chỗ`/`Đến lượt bạn` của v0.5.6.
- Không thêm schema, API, vòng đời, chính sách hàng đợi hay hành vi production FE08.

## 2026-07-27 - Làm rõ lượt đặt chỗ Thành viên hiện tại so với lịch sử

- Tách đặt chỗ `ACTIVE`/`NOTIFIED` chính tắc khỏi lịch sử đặt chỗ kết thúc để hàng đã hủy cũ không bị nhầm với đặt chỗ mới tạo.
- Hiển thị mọi badge vòng đời Thành viên từ trạng thái FE08 thô với sắc độ trực quan được hỗ trợ, gồm trạng thái sẵn sàng nhận sách và hạn chót hiển thị.
- Kết nối từng thao tác ứng viên với lượt đặt chỗ hiện tại khớp: `Đang đặt chỗ` khi chờ và `Đến lượt bạn` khi được giữ.
- Giữ lịch sử đã hủy/hoàn tất/hết hạn, thứ tự hàng đợi Thủ thư/Quản trị viên và chuyển đổi hoàn tất do FE07 sở hữu.

## 2026-07-27 - Bàn giao sách đã chọn FE01

- Kết nối deep link `Đặt chỗ sách này` Thành viên FE01 với FE08 qua `bookId`.
- FE08 phân giải tiêu đề sách công khai và khởi tạo tìm kiếm ứng viên được bảo vệ trong khi giữ chọn `copyId` vật lý và thay đổi đặt chỗ trong FE08.
- Thêm bao phủ hồi quy frontend mà không mở rộng DTO công khai hoặc lộ siêu dữ liệu bản sao trên HomePage.

## 2026-07-27 - Thực thi tự phục vụ thành viên không phải nhân sự

- Thêm ủy quyền chỉ thành viên cho mô hình tài khoản chính xác một vai trò; Quản trị/Thủ thư không thể dùng tự phục vụ đặt chỗ.
- Mảng cũ không hợp lệ `MEMBER + LIBRARIAN` và `MEMBER + ADMIN` không còn có thể mở hoặc gọi luồng ứng viên thành viên, tạo, danh sách riêng hay hủy.
- Giữ danh sách đặt chỗ, xử lý hàng đợi và thao tác hết hạn giữ chỗ của Thủ thư/Quản trị viên.
- Kết nối chuyển hướng route trực tiếp frontend với cùng ranh giới ủy quyền backend.
- Xác thực: route backend FE07/FE08 tập trung đạt 94/94, frontend vai trò/điều hướng tập trung đạt 61/61, backend đầy đủ đạt 1018/1018, frontend đầy đủ đạt 227/227 và lint/build frontend cùng truy vết đều đạt.

## 2026-07-23 - Thực thi hàng đợi cấp bản sao nguyên tử

- Loại endpoint xử lý đặt chỗ trực tiếp không chính tắc và chỉ giữ `POST /api/reservations/process-queue`.
- Di chuyển kiểm tra thành viên, vai trò, bản sao, trùng lặp và ba đặt chỗ đang mở vào một giao dịch tạo có khóa.
- Kiểm tra lại vai trò `MEMBER` hiện tại khi tra cứu hàng đợi và một lần nữa trong giao dịch giữ để mục bị thu hồi vai trò vẫn `ACTIVE` và lượt đặt chỗ hợp lệ tiếp theo được chọn.
- Nhóm hàng đợi nhân sự theo `copyId` vật lý và tải mọi trang máy chủ cần bởi giao diện đặt chỗ thành viên và nhân sự.
- Di chuyển audit vòng đời tạo/hủy/giữ/hết hạn vào giao dịch sở hữu để thay đổi và audit cùng commit hoặc hoàn tác.
- Giữ lượt giữ đã commit khi thông báo FE10 thất bại và công khai metadata cảnh báo `RESERVATION_NOTIFY_AUDIT_FAILED` an toàn khi audit lỗi sau commit cũng không sẵn có.
- Giữ các cảnh báo đó qua lượt nâng `expire-holds` bằng cách trả các mục `notificationWarnings[]` tùy chọn an toàn cấp cao nhất mà không thay đổi DTO đặt chỗ đã nâng.
- Loại danh tính thành viên cache khỏi xác nhận process-queue vì máy chủ xác thực lại và chọn lại mục hàng đợi hợp lệ đầu tiên hiện tại tại thời điểm thay đổi.

## 2026-07-21 - Căn chỉnh điều kiện hợp lệ đặt chỗ với vai trò thành viên

- Thay điều kiện tiên quyết phê duyệt FE04 bằng tài khoản hoạt động cùng ủy quyền vai trò `MEMBER`.
- Xử lý hàng đợi hiện bỏ qua tài khoản không hoạt động mà không tham khảo trạng thái ứng dụng FE04.
- Làm rõ Thủ thư/Quản trị viên xử lý hàng đợi đặt chỗ khi một bản sao khả dụng.
- Giữ ứng viên đã mượn/đặt trước hiển thị, thêm `hasActiveReservation` theo phạm vi thành viên, vô hiệu hóa thao tác đặt chỗ trùng lặp và loại banner đồng bộ thường lệ.

## 2026-07-20 - Bản địa hóa giao diện tiếng Việt và kiểu chữ

- Bản địa hóa nhãn, trạng thái, tên trợ năng và phản hồi lỗi an toàn do frontend tạo cho tính năng này.
- Giữ nguyên hợp đồng API, giá trị enum thô, quyền, quy tắc nghiệp vụ và dữ liệu danh mục/hồ sơ do người dùng sở hữu.
- Áp dụng hợp đồng kiểu chữ dùng chung `Be Vietnam Pro` cho thân bài và `Noto Serif` cho tiêu đề, kèm font dự phòng hỗ trợ Unicode.

## 2026-07-19 - Hoàn tất đầu ra giai đoạn 2

- feat-reservation-management được chấp nhận trong đợt đối soát hoàn chỉnh Giai đoạn 2 FE01-FE12 ghi nhận bởi PR #40/#41; việc xác thực và các ranh giới còn lại được tổng hợp trong `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Các giới hạn đã hoãn và phạm vi tương lai vẫn được nêu rõ, không bị mở rộng bởi đợt hoàn tất này.

## 2026-07-19 - Sửa giới hạn đặt chỗ đang mở

- Đếm cả hàng `ACTIVE` và `NOTIFIED` cho quy tắc tối đa ba lượt đặt chỗ đang mở.
- Coi hàng `NOTIFIED` hiện có là trùng lặp cho cùng thành viên và bản sao vật lý.
- Thêm bao phủ hồi quy route, nguồn SQL và SQL trực tiếp trong khi giữ mã xung đột hiện có.

## 2026-07-19 - Phê duyệt hợp đồng ứng viên an toàn cho thành viên v0.4.4

- Phê duyệt `GET /api/reservations/candidates` chỉ thành viên được bảo vệ làm nguồn mục tiêu `CopyId` vật lý.
- Khóa projection an toàn tới `copyId`, `bookId`, tiêu đề, tác giả nullable, trạng thái `BORROWED`/`RESERVED` và số đếm hàng đợi đang hoạt động.
- Giữ che bớt công khai FE01, truy cập tồn kho nhân sự FE06 và ngữ nghĩa thay đổi `POST /api/reservations { copyId }`.
- Thêm hành vi `q`/page/limit do máy chủ sở hữu, thứ tự xác định, tác vụ triển khai FE08-T035 đến FE08-T039 và cổng xác thực SQL/trình duyệt.
- Người dùng phê duyệt Phương án A và thiết kế viết vào 2026-07-19; triển khai và xác thực tự động tập trung/đầy đủ hiện hoàn tất, trong khi tích hợp H3 con người vẫn mở.

## 2026-07-19 - Xác thực danh mục ứng viên v0.4.4

- Thêm danh mục ứng viên có SQL hỗ trợ chỉ thành viên và chuyển trang thành viên khỏi `DEMO_RESERVABLE`.
- Xác thực projection sáu trường đã che bớt, trạng thái hợp lệ, tìm kiếm/phân trang máy chủ, thay đổi `copyId` thực và làm mới chính tắc qua cổng backend, frontend, SQL và trình duyệt.
- Xác thực SQL dùng một lần tổng hợp đạt `9/9` bộ và `69/69` kiểm thử sau hai lượt migration; dọn dẹp không để lại cơ sở dữ liệu hoặc đăng nhập dùng một lần.
- Đóng `TD-028` cho xác thực phía agent; H3 cuối, merge và CI `main` sau merge vẫn là cổng con người.

## 2026-07-19 - Ghi nhận sai lệch ứng viên đặt chỗ

- Quét sai lệch sản phẩm cuối xác nhận thay đổi đặt chỗ và trạng thái vòng đời do máy chủ sở hữu, nhưng `MyReservationsPage` vẫn hiển thị ứng viên bản sao `DEMO_RESERVABLE` mã cứng.
- Đăng ký `TD-028` cho hợp đồng chọn bản sao FE01/FE06/FE08 an toàn cho thành viên đã phê duyệt; đối soát không tạo endpoint mới hoặc lộ siêu dữ liệu bản sao chỉ nhân sự.

## 2026-07-19 - Đối soát đặt chỗ v0.4.3

- Khóa phân trang chính tắc, xử lý hàng đợi `copyId`, thứ tự ổn định, kết quả hàng đợi rỗng/không hợp lệ/lỗi thông báo xác định và dấu thời gian kết thúc bất biến.
- Đối soát ưu tiên FE07 và hoàn tất chủ sở hữu được giữ với thứ tự khóa bản sao/đặt chỗ dùng chung và ranh giới hoàn tác giao dịch.
- Giữ trang thành viên/nhân sự trên trạng thái vòng đời máy chủ chính tắc với hành vi làm mới sau thay đổi và không mô phỏng hoàn tất/xóa cục bộ.
- Đạt backend/ranh giới dùng chung tập trung 77/77, frontend 9/9, truy vết 28/28, vệ sinh diff và bằng chứng ranh giới đặt chỗ SQL dùng một lần; tích hợp cuối của con người vẫn mở.

## 2026-07-18 - Trạng thái đặt chỗ thành viên trung thực

- Loại thay thế đặt chỗ demo phía thành viên, thành công tạo mô phỏng và thành công hủy chỉ cục bộ khi API FE08 thất bại.
- Giữ danh sách thành viên đồng bộ với trạng thái `/api/reservations/me` chính tắc và cải thiện hệ phân cấp thẻ danh mục/danh sách đáp ứng.

## 2026-07-17 - Phê duyệt mốc cơ sở giai đoạn 1

- Nhật phê duyệt hợp đồng hàng đợi, hoàn tất, hủy, dấu thời gian kết thúc và bàn giao FE07 FE08 đã chuẩn hóa làm mốc cơ sở Giai đoạn 1; theo dõi triển khai vẫn đang chờ.
- Đóng cổng rà soát tài liệu trong `PLAN.md` và `TASKS.md`; tác vụ triển khai chuẩn hóa vẫn chưa bắt đầu.

## 2026-07-17 - Hợp đồng ưu tiên bàn giao trả

- Làm rõ yêu cầu hàng đợi `ACTIVE` vẫn được thực thi khi FE07 trả bản sao về `AVAILABLE` đã lưu.
- Giữ quyền sở hữu hàng đợi FE08 thủ công và yêu cầu hiển thị thứ tự hàng đợi xác định.

## 2026-07-17 - Củng cố hợp đồng đặt chỗ đang mở và hàng đợi

- Đếm `ACTIVE` và `NOTIFIED` là đặt chỗ đang mở cho quy tắc giới hạn và trùng lặp.
- Làm `queuePosition` dẫn xuất và chỉ giữ một endpoint xử lý hàng đợi Giai đoạn 1 chính tắc.
- Căn chỉnh caller đặt chỗ với hợp đồng `RESERVATION_AVAILABLE -> RESERVATION_READY` của FE10.

## 2026-07-17 - Lịch sử dấu thời gian kết thúc - v0.4.3

- Giữ `NotifiedAt` và `ExpiresAt` là lịch sử bất biến sau `NOTIFIED -> FULFILLED`, `EXPIRED` hoặc `CANCELLED`.
- Xác định các trường đó chỉ null cho đặt chỗ chưa từng tới `NOTIFIED` và giới hạn `CancelledAt` cho hàng `CANCELLED`.
- Cập nhật bất biến trạng thái, truy vết, mục tiêu kiểm thử và phạm vi đối soát FE08-T030; không đổi tệp triển khai.

## 2026-07-17 - Chuẩn hóa hợp đồng xác định (v0.4.2)

- Đóng các phương án chính sách còn lại: đặt chỗ không đủ điều kiện bị bỏ qua trong lần chạy hiện tại và vẫn `ACTIVE`; hàng đợi rỗng không chọn gì và giữ trạng thái không đổi; lỗi FE10 giữ lượt giữ đã commit và ghi audit thất bại.
- Chuẩn hóa xử lý hàng đợi chỉ `CopyId`, mặc định/giới hạn phân trang, thứ tự ổn định và ngữ nghĩa `QueuePosition`/dấu thời gian thông báo.
- Thêm FE08-T028 đến FE08-T033 làm tác vụ chuẩn hóa chưa chọn; bằng chứng triển khai B7 lịch sử vẫn tách khỏi rà soát này.
- Cập nhật `TEST_PLAN.md` với mục tiêu hàng đợi, hoàn tất, phân trang, lỗi và đồng thời cấp hợp đồng; thay mục truy vết `TBD` cuối bằng FE08-T11.
- Loại diễn đạt ngày-phạm-vi/thông báo không theo hợp đồng còn lại và làm mục tiêu bản sao vật lý rõ ràng trong vòng đời và cổng rà soát.
- Khóa thứ tự hàng đợi thành `ReservedAt ASC, ReservationId ASC` và hủy không hợp lệ thành `409 RESERVATION_NOT_ACTIVE` với trạng thái không đổi.
- Thêm hàng truy vết AC-FE08-001 đến AC-FE08-010 còn thiếu và giữ bằng chứng phân trang chuẩn hóa đang chờ nêu rõ.
- Thêm ánh xạ kế hoạch kiểm thử rõ ràng cho mọi ID NFR bảo mật, giao dịch, hiệu năng, ghi log và khả dụng FE08.

## 2026-07-15 - Phụ thuộc thành viên chính tắc (v0.4.1)

- Thay lượt đọc điều kiện hợp lệ `MembershipApplications` tùy chọn bằng `Members.Status = APPROVED` chính tắc cùng trạng thái người dùng hoạt động từ FE04.
- Không đổi hành vi vòng đời đặt chỗ, hàng đợi, API hoặc triển khai.

## 2026-07-15 - Hợp đồng bàn giao hoàn tất FE07 (v0.4.0)

- Xác nhận `CopyId` vật lý là mục tiêu đặt chỗ Giai đoạn 1 bắt buộc và loại mơ hồ cấp sách còn lại.
- Xác định phê duyệt FE07 cho cùng thành viên đã thông báo và bản sao là kích hoạt `NOTIFIED -> FULFILLED` duy nhất.
- Xác định ưu tiên hàng đợi `ACTIVE` là yếu tố chặn thao tác tạo/phê duyệt FE07 thông thường và cho phép chủ sở hữu hủy từ `ACTIVE` hoặc `NOTIFIED`.
- Thêm FE08-T025 cho căn chỉnh thứ tự khóa dùng chung và bằng chứng đồng thời.
- Giữ xử lý hàng đợi thủ công và không thêm endpoint, bảng, cột, job hết hạn tự động hay thay đổi giao FE10.

## 2026-07-13 - Tính đúng đắn frontend căn chỉnh vòng đời đã phê duyệt (v0.3.1)

- Ánh xạ `NOTIFIED` thành sẵn sàng nhận sách và `FULFILLED` thành hoàn thành trong mô hình hiển thị frontend dùng chung.
- Thêm lỗi API tiếng Việt riêng cho đặt chỗ mà không đổi hành vi API FE07 hoặc chung.
- Kết nối UI thủ thư với endpoint `POST /api/reservations/expire-holds` hiện có và tải lại trạng thái máy chủ chính tắc sau thành công.
- Loại điều khiển hoàn tất và xóa chỉ cục bộ không lưu trạng thái backend.
- Thêm kiểm thử frontend tập trung và làm mới truy vết kế hoạch/tác vụ FE08.
- Chuẩn hóa hợp đồng `POST /api/reservations/expire-holds` hiện có trong `SPEC.md`, cập nhật phiên bản SPEC thành `0.3.1` và ngày thành 2026-07-13.
- Không thay đổi triển khai backend, schema cơ sở dữ liệu, hoàn tất FE07, giao FE10 hoặc phân trang.

## 2026-06-25 - Thêm mô hình trạng thái đặt chỗ (v0.3.0)

- Tăng phiên bản `SPEC.md` `0.2.0` -> `0.3.0`; `Last Updated` 2026-06-25; Trạng thái không đổi (APPROVED).
- Thêm tiểu mục `10.3 State Model & Transition Rules (Reservation)` ở cuối phần 10, chính thức hóa vòng đời `Reservations.status` theo chuẩn Đặc tả chính thức (Phát triển dựa trên đặc tả).
- Tập trạng thái lấy trực tiếp từ enum khai báo trong 10.2: `ACTIVE`, `NOTIFIED`, `FULFILLED`, `CANCELLED`, `EXPIRED`. Không tạo trạng thái mới.
- Nội dung: (a) Mermaid `stateDiagram-v2` với nút bắt đầu/kết thúc; (b) bảng mô tả trạng thái; (c) bảng Chuyển đổi hợp lệ với trigger/guard và truy vết FR/BR/AF/Q; (d) bảng Chuyển đổi không hợp lệ (trạng thái kết thúc là cuối; không bỏ qua `ACTIVE`->`FULFILLED`; không `NOTIFIED`->`ACTIVE`; không chọn hai lần; đã hủy/hết hạn bị loại khỏi hàng đợi); (e) 7 bất biến (INV-FE08-001..007).
- Truy vết tới FR-FE08-001..024, BR-FE08-003/005/006/008/009/010/011/012/013/014, AF-FE08-003/004, EC-FE08-007/010, Q-FE08-001/004, MF-FE08-001/002/004/005, AC-FE08-004/007 và NFR-FE08-TXN-001/002 + LOG-001.
- Không đổi logic: mô hình trạng thái chỉ hợp nhất chuyển đổi đã được hàm ý bởi luồng, quy tắc và câu hỏi đã giải quyết hiện có.

## 2026-06-02

- Tạo dự thảo đặc tả Quản lý đặt chỗ FE08 ban đầu.
- Thêm bối cảnh, câu hỏi mở, hợp đồng API đề xuất, quy tắc nghiệp vụ, tiêu chí chấp nhận và ma trận truy vết.

## 2026-06-10

- Cập nhật chính sách hợp đồng API để cho phép phê duyệt trong `SPEC.md` trừ khi nhóm khôi phục tài liệu hợp đồng API dùng chung.
- Giải quyết phụ thuộc gia hạn FE08/FE07: đặt chỗ đang hoạt động hoặc bản sao được giữ cho thành viên khác chặn gia hạn khoản mượn FE07.

## 2026-06-10 - Phê duyệt quyết định rà soát giai đoạn 1

- Phê duyệt các quyết định câu hỏi mở từ `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Cập nhật trạng thái quyết định `SPEC.md` từ draft/proposed/open thành approved ở nơi áp dụng.
- Giữ các biện pháp kiểm soát phạm vi Giai đoạn 1 và nêu rõ các hạng mục công việc tương lai bị hoãn.

## 2026-06-10 - Lát cắt backend sẵn sàng để rà soát

- Thêm kế hoạch backend FE08 và checklist tác vụ cho phạm vi đặt chỗ của Nhat.
- Thêm API đặt chỗ thành viên, xử lý hàng đợi nhân sự, ghi audit và bàn giao yêu cầu thông báo FE10.
- Thêm kiểm thử backend cho quy tắc đặt chỗ, quyền sở hữu hủy, thứ tự hàng đợi, thông báo và bảo vệ vai trò.

## 2026-06-25 - Tăng bao phủ hành vi không mong muốn EARS (v0.2.0)

- Tăng phiên bản `SPEC.md` `0.1.0` -> `0.2.0`; cập nhật `Last Updated` thành 2026-06-25; Trạng thái không đổi (APPROVED).
- Thêm phần `7.1 Unwanted Behaviour Requirements` với 14 yêu cầu chức năng Không mong muốn EARS mới (FR-FE08-011 .. FR-FE08-024).
- Không thêm logic mới: mỗi FR mới nâng một nhánh lỗi/bất thường hiện có từ Trường hợp biên (EC-*), Quy tắc nghiệp vụ (BR-*), Luồng thay thế (AF-*) hoặc quyết định đã phê duyệt (Q-*), mỗi mục mang truy vết nguồn.
- Bao phủ nhánh: không tìm thấy thành viên, tài khoản không hoạt động, thành viên chưa phê duyệt, không tìm thấy sách/bản sao, đạt giới hạn đặt chỗ, hủy không phải chủ sở hữu, hủy lặp lại, thành viên không đủ điều kiện lúc xếp hàng, hết hạn đặt chỗ, hàng đợi hợp lệ rỗng, lỗi/thử lại dịch vụ thông báo, chọn hàng đợi đồng thời, chặn mượn bản sao được giữ, chặn gia hạn FE07.
- Nâng tỷ lệ FR Không mong muốn từ ~30% (3/10) lên ~68% (15/22), vượt mục tiêu 30%.
- Cập nhật `16. Traceability Matrix`: thêm hàng cho mọi FR mới (ánh xạ nguồn EC/BR/AF/Q và tham chiếu kiểm thử tạm thời) và bổ sung hàng FR-FE08-001/002/003/006/007/009/010 từng thiếu.

## 2026-06-20 - Triển khai UI frontend và xác thực khả năng tiếp cận

- Triển khai màn hình lượt đặt chỗ của tôi thành viên, quản lý đặt chỗ thủ thư và xử lý hàng đợi đặt chỗ thủ thư.
- Nối mọi màn hình frontend với API backend bằng axios và React hooks.
- Thêm caption bảng, phạm vi header cột, nhãn có thể tiếp cận cho input tìm kiếm, select, nút phân trang và điều khiển icon.
- Thêm trạng thái tải, rỗng và lỗi trên mọi màn hình đã rà soát.
- Xác thực: `npm.cmd --prefix frontend run lint`, `npm.cmd --prefix frontend run build`, `npm.cmd --prefix backend test`.
- Merge qua PR #7 vào `feat/fe07-fe08-fe10-fe12-ui-polish`.

## 2026-07-18 - Thao tác đặt chỗ thủ thư căn chỉnh dữ liệu API chính tắc

- Xây lại màn hình đặt chỗ thủ thư với copy tiếng Việt hợp lệ, bố cục danh sách/hàng đợi rõ ràng hơn, tìm kiếm rõ ràng, bộ lọc sách/trạng thái và phân trang tám hàng.
- Loại fallback dữ liệu demo nhân sự và thông báo làm mới thành công cố định; trạng thái tải, rỗng và lỗi API giờ chỉ biểu thị trạng thái máy chủ chính tắc.
- Tải lại đặt chỗ sau xử lý hàng đợi và hết hạn giữ chỗ để trạng thái UI luôn đồng bộ với chuyển đổi FE07/FE08/FE10.
- Làm phong phú trường danh sách đặt chỗ với họ tên thành viên, email, tác giả, mã vạch, trạng thái bản sao và vị trí từ quan hệ cơ sở dữ liệu hiện có.
- Giữ xử lý hàng đợi thủ công theo thứ tự thời gian đặt chỗ ổn định và giữ quy trình giữ chỗ hết hạn thủ công Giai đoạn 1.
- Xác minh kiểm thử backend FE08 tập trung, lint frontend, kiểm thử đặt chỗ frontend và build production.
- Thêm hành động hàng hiển thị để mở hàng đợi sách đã chọn; thao tác giữ/thông báo chỉ bật sau khi bản sao mục tiêu thành `AVAILABLE`.

## 2026-07-29 - Handoff trả sách và hàng đợi liên hoàn v0.9.0

- Nhận chính xác `copyId` từ kết quả trả FE07 và mở thẳng hàng đợi của bản sao vừa sẵn sàng, không yêu cầu thủ thư tra cứu lại.
- Giữ ưu tiên FIFO theo lượt `ACTIVE`, bắt xung đột trạng thái cũ bằng tải lại dữ liệu và hiển thị cảnh báo khi nghiệp vụ giữ chỗ đã commit nhưng yêu cầu thông báo/audit thất bại.
- Xác minh thành viên kế tiếp mượn đúng bản sao đang được giữ trước khi FE08 hoàn tất lượt đặt.
- Bằng chứng cục bộ: 55/55 kiểm thử FE08 tập trung; kiểm thử frontend liên quan 56/56; SIT 11/11; luồng Playwright liên hoàn 1/1.
- Product diff vẫn chưa stage/commit/push, chờ duyệt H2.
