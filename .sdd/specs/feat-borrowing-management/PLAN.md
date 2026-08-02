# PLAN.md - FE07 Quản lý mượn sách

Trạng thái: HOÀN THÀNH; PR #89 ĐÃ HỢP NHẤT; CI VÀ AZURE ĐÃ CHẠY THÀNH CÔNG TRÊN ĐÚNG COMMIT

Chủ sở hữu: Nhat

Cập nhật: 2026-08-01

Trạng thái quy trình: Giai đoạn 2 đã hoàn tất. Nhat phê duyệt phụ lục H2
`8d0059b` vào 2026-07-27. Phần thay đổi đã được rà soát được lưu trong commit
`f346ae0`, đưa lên PR nháp #63 và vượt qua CI `30244750250`. Vấn đề về cách
diễn đạt trong lượt H3 đầu tiên cũng đã được khắc phục. Bản hoàn tất `6189b1a`
được phê duyệt H3, hợp nhất qua PR #89 thành `main@39092fb`; CI `30675444178`
và Azure staging `30675744992` đều đạt.

---

## 1. Phạm vi

Giữ đối soát FE07 Giai đoạn 2 đã hoàn tất và áp dụng hiệu chỉnh UX quyết định nhân sự/trả có phạm vi giới hạn được xác định bởi `SPEC.md` v0.7.3 đã phê duyệt.

## Ghi chú sai lệch bản sửa đổi

Triển khai FE07 hiện có và các tác vụ B7/B8 đã hoàn thành có trước `SPEC.md` v0.5.0. Bản sửa đổi đã được phê duyệt yêu cầu đối soát chuyên biệt cho điều kiện hợp lệ `Members` chuẩn, bảo vệ sách cha, khóa năm bản sao theo phạm vi thành viên, siêu dữ liệu phê duyệt/mượn đã lưu, chính sách ngày `Asia/Ho_Chi_Minh`, từ chối trả trong tương lai và lý do từ chối bắt buộc. Các kết quả đạt hiện có vẫn là bằng chứng lịch sử, không phải bằng chứng cho những yêu cầu mới này.

Bao gồm:

- Thành viên tạo yêu cầu mượn cho bản sao khả dụng thông thường hoặc bản sao do lượt đặt chỗ đã thông báo của chính họ giữ.
- Thành viên chỉ xem lịch sử mượn của chính mình.
- Thủ thư/quản trị viên liệt kê, phê duyệt, từ chối, trả và gia hạn bản ghi mượn.
- Xử lý trả cập nhật trạng thái bản sao và công khai dữ liệu rà soát phạt cho FE09.
- Gia hạn kiểm tra quá hạn, phạt chưa thanh toán, giới hạn gia hạn và xung đột đặt chỗ FE08.
- Các thao tác mượn ghi nhật ký kiểm toán và tạo yêu cầu thông báo FE10 an toàn khi hữu ích.
- Màn hình mượn frontend hiển thị phản hồi có thể hành động cho tải, rỗng, quyền, điều kiện hợp lệ, trạng thái không hợp lệ và lỗi API.
- Quản lý lưu hành của Quản trị viên giữ mã định danh yêu cầu/bản sao trong dữ liệu chuẩn đồng thời hiển thị chín cột vận hành vừa bố cục màn hình máy tính được hỗ trợ mà không cuộn ngang.
- Thủ thư/Quản trị viên có thể gửi một `borrowDetailId` quá hạn đã chọn từ không gian trả đến phép tính chính thức máy chủ của FE09 mà không cung cấp ngày, số ngày quá hạn hay số tiền.

Không bao gồm:

- Tính tiền phạt hoặc tạo khoản phạt FE09.
- Triển khai tiến trình nền gửi thông báo FE10.
- Thiết kế lại màn hình frontend ngoài quy trình mượn FE07.
- Luồng phần cứng/RFID.

---

## 2. Quy tắc đã phê duyệt được dùng

| Quy tắc | Tác động tới kế hoạch |
| --- | --- |
| Số bản sao đang mượn tối đa là 5 | Đường tạo và phê duyệt thực thi giới hạn. |
| Thời hạn mượn mặc định là 14 ngày | Phê duyệt đặt hạn trả là ngày phê duyệt + 14 ngày dương lịch. |
| Một lần gia hạn mỗi chi tiết | Đường gia hạn chỉ tăng `RenewalCount` một lần. |
| Mục đang chờ dùng `BorrowDetails.Status = REQUESTED` | Tập lệnh cơ sở dữ liệu và tầng truy cập dữ liệu dùng trạng thái đã phê duyệt. |
| Phạt chưa thanh toán chặn mượn/gia hạn | Tầng dịch vụ kiểm tra `Fines` trước khi tạo và gia hạn. |
| Lượt đặt chỗ của thành viên khác chặn gia hạn | Tầng dịch vụ kiểm tra trạng thái đặt chỗ FE08 trước khi gia hạn. |
| Hàng đợi đặt chỗ đang hoạt động chặn mượn thông thường | Tạo và phê duyệt trả về `RESERVATION_QUEUE_PRIORITY` cho đến khi nhân sự xử lý hàng đợi. |
| Chủ sở hữu đã thông báo có thể mượn bản sao đang giữ | FE07 chấp nhận yêu cầu bình thường và xác thực lại quyền sở hữu lượt đặt chỗ khi phê duyệt. |
| Phê duyệt FE07 hoàn tất lượt giữ chỗ | Yêu cầu, chi tiết, bản sao, lượt đặt chỗ khớp và kiểm toán được commit trong cùng giao dịch. |
| FE07 không tạo khoản phạt | Phản hồi trả công khai `fineCandidate`; không tầng dịch vụ/tầng truy cập dữ liệu FE07 nào chèn `Fines`. UI trả của nhân sự có thể gọi endpoint tính chuẩn của FE09 cho `borrowDetailId` quá hạn được chọn. |
| Điều kiện hợp lệ chuẩn là tài khoản MEMBER đang hoạt động, không có vai trò Thủ thư/Quản trị viên | Các chức năng tạo, liệt kê bản sao và xem lịch sử tự phục vụ yêu cầu `MEMBER` không có `LIBRARIAN`/`ADMIN`; khi phê duyệt, hệ thống vẫn kiểm tra lại chủ yêu cầu là `MEMBER` đang hoạt động và FE04 không chặn FE07. |
| Sách cha phải vẫn hoạt động | Tạo và phê duyệt từ chối sách cha không hoạt động với `BOOK_INACTIVE`. |
| Phê duyệt dùng khóa năm bản sao theo phạm vi thành viên | Thứ tự khóa là `member -> BookCopies -> BorrowRequests/BorrowDetails -> Reservations`; việc đếm diễn ra sau khóa. |
| Siêu dữ liệu phê duyệt là lịch sử giao dịch | Lưu `CreatedBy`, `ApprovedAt`, `ApprovedBy` và `BorrowDate` từng chi tiết; hạn trả là ngày mượn +14 ngày dương lịch. |
| Ngày nghiệp vụ dùng `Asia/Ho_Chi_Minh` | Ngày trả trước ngày mượn hoặc sau ngày nghiệp vụ hiện tại bị từ chối. |
| Lý do từ chối là bắt buộc | Độ dài sau cắt khoảng trắng là 1..500 và lý do được lưu trong siêu dữ liệu kiểm toán từ chối. |

---

## 3. Kế hoạch triển khai

### 3.1 API và kiểm soát truy cập

- Thêm `/api/borrow-requests`, `/api/borrow-details` và `/api/members/{memberId}/borrowings`.
- Tái sử dụng xác thực FE02.
- Giữ các thao tác thành viên trong phạm vi thành viên hiện tại.
- Hạn chế các thao tác nhân sự cho thủ thư/quản trị viên.

### 3.2 Yêu cầu mượn

- Xác thực `copyIds` và từ chối trùng lặp.
- Kiểm tra tài khoản hoạt động và ủy quyền `MEMBER` không phải nhân sự tại tuyến API tự phục vụ thành viên.
- Áp dụng hợp đồng khả năng mượn có xét trạng thái đặt chỗ cho mọi bản sao.
- Từ chối người dùng bị chặn do khoản mượn quá hạn đang hoạt động hoặc phạt chưa thanh toán.
- Tạo yêu cầu `PENDING` và chi tiết `REQUESTED`.

### 3.3 Phê duyệt và từ chối của nhân sự

- Kiểm tra lại điều kiện của thành viên, yếu tố chặn mượn, khả năng mượn bản sao có xét trạng thái đặt chỗ và giới hạn mượn.
- Phê duyệt theo giao dịch: trạng thái yêu cầu, trạng thái chi tiết, hạn trả, trạng thái bản sao, hoàn tất lượt đặt chỗ khớp và kiểm toán.
- Từ chối yêu cầu đang chờ mà không thay đổi trạng thái bản sao.

### 3.4 Trả và gia hạn

- Trả cập nhật trạng thái chi tiết, ngày trả, trạng thái bản sao và hoàn tất yêu cầu.
- Các lượt trả hỏng/mất/quá hạn chỉ công khai dữ liệu rà soát phạt.
- Gia hạn chỉ kéo dài hạn trả thêm 14 ngày khi mọi quy tắc đều đạt.

### 3.5 Kiểm thử

- Thêm kiểm thử tuyến API với tầng truy cập dữ liệu trong bộ nhớ.
- Bao phủ tạo, bản sao trùng lặp, bản sao không khả dụng, phê duyệt, lịch sử, trả, dữ liệu đề xuất phạt, hoàn tất, gia hạn, xung đột đặt chỗ và bảo vệ một vai trò.
- Thêm kiểm thử Node frontend tập trung cho thông báo lỗi API mượn và hành vi dự phòng chung.

### 3.6 Xử lý lỗi frontend

- Giữ các thông báo lỗi riêng cho mượn trong phạm vi `borrowingApi` để API tính năng khác giữ xử lý chung.
- Chuyển các mã vai trò, điều kiện hợp lệ, giới hạn mượn, bản sao, trạng thái trả và xung đột gia hạn FE07 thành thông báo tiếng Việt có thể hành động.
- Xác thực và triển khai hợp đồng truy vấn lịch sử mượn chính xác: `status?`, `fromDate?`, `toDate?`, `page?`, `limit?`, mặc định/giới hạn, ngữ nghĩa ngày bao gồm hai đầu và thứ tự ổn định.
- Giữ các dự phòng xác thực, chi tiết xác thực, thông báo backend và mạng.

### 3.7 Tích hợp FE07-FE08

- Giữ FE07 là chủ sở hữu duy nhất của tạo và phê duyệt yêu cầu mượn.
- Đọc các lượt đặt chỗ `ACTIVE` và `NOTIFIED` lúc tạo và dưới khóa phê duyệt.
- Khóa bản ghi bản sao trước bản ghi đặt chỗ bất cứ khi nào một giao dịch thay đổi cả hai trạng thái.
- Chặn mượn thông thường khi tồn tại mục hàng đợi `ACTIVE`.
- Chỉ cho phép bản sao `RESERVED` với đúng Thành viên sở hữu lượt đặt chỗ `NOTIFIED` của bản sao đó.
- Hoàn tất lượt đặt chỗ đã thông báo khớp trong giao dịch phê duyệt.
- Giữ xử lý hàng đợi FE08 thủ công, dạng endpoint hiện tại và schema cơ sở dữ liệu hiện có.

### 3.8 Phạm vi triển khai đối soát v0.5.0

#### Tệp

| Khu vực | Tệp | Trách nhiệm đối soát |
| --- | --- | --- |
| Ranh giới | `backend/src/routes/borrowingRoutes.js`, `backend/src/controllers/borrowingController.js`, `backend/src/validators/borrowingValidators.js` | Lý do từ chối bắt buộc, ngày trả nghiêm ngặt, ID/trạng thái và hợp đồng lỗi an toàn. |
| Quy tắc nghiệp vụ | `backend/src/services/borrowingService.js`, tạo `backend/src/utils/libraryBusinessTime.js` | Điều kiện hợp lệ chuẩn, bảo vệ sách cha, công thức năm bản sao và ngày nghiệp vụ Thành phố Hồ Chí Minh xác định. |
| Lưu trữ | `backend/src/repositories/borrowingRepository.js`, `backend/src/repositories/auditLogRepository.js` | Khóa theo phạm vi thành viên, thứ tự khóa đã phê duyệt, siêu dữ liệu, cập nhật lượt đặt chỗ/kiểm toán trong cùng giao dịch và kết quả hoàn tác. |
| Schema/mô hình/API | `database/Librarymanagement.sql`, `backend/src/models/BorrowRequest.js`, `backend/src/models/BorrowDetail.js`, `backend/src/docs/openapi.yaml` | Xác minh cột/enum đã phê duyệt và căn chỉnh siêu dữ liệu khi chạy/API mà không thêm trạng thái chưa được phê duyệt. |
| Kiểm thử backend | `backend/tests/borrowingRoutes.test.js`, `backend/tests/helpers/inMemoryBorrowingRepositories.js`, `backend/tests/borrowingRepository.test.js`, `backend/tests/borrowingContract.test.js`, `backend/tests/sql/borrowingConcurrency.sqltest.js` | RED/GREEN cho điều kiện hợp lệ, sách cha không hoạt động, race giới hạn cùng thành viên, siêu dữ liệu, múi giờ/ngày, lý do, hoàn tác và bằng chứng truy vết. |
| Frontend | `frontend/src/page/borrowing/*`, `frontend/src/api/libraryFeatureApi.js`, `frontend/test/borrowingFrontend.test.js` | Lỗi v0.5.0 có thể hành động và trạng thái thay đổi trung thực. |

#### Chiến lược theo thứ tự

1. Thêm kiểm thử RED tuyến API/tầng truy cập dữ liệu/SQL còn thiếu cho điều kiện hợp lệ chuẩn và kiểm tra sách cha không hoạt động tại cả tạo lẫn phê duyệt.
2. Thêm kiểm thử đồng thời hai yêu cầu cùng thành viên, chứng minh phê duyệt không thể đưa thành viên từ bốn lên sáu bản sao đang mượn.
3. Đối soát khóa tầng truy cập dữ liệu để khóa theo phạm vi thành viên đi trước `BookCopies`, sau đó bản ghi yêu cầu/chi tiết rồi lượt đặt chỗ; chỉ tính số đang hoạt động sau khi khóa.
4. Đối soát ghi `CreatedBy`, `ApprovedAt`, `ApprovedBy`, `BorrowDate` và hạn trả trong giao dịch phê duyệt.
5. Tập trung chuyển đổi ngày nghiệp vụ `Asia/Ho_Chi_Minh`, từ chối lượt trả tương lai/trước mượn và yêu cầu lý do từ chối dài 1..500.
6. Căn chỉnh siêu dữ liệu OpenAPI/mô hình/SQL và hành vi lỗi frontend, sau đó chạy xác thực tập trung và rà soát của con người.

#### Mục tiêu không thực hiện rõ ràng

- Không gắn lại nhãn FE07-T01 đến FE07-T030 hoặc bằng chứng B7 là hoàn thành v0.5.0.
- Không lưu `OVERDUE`, triển khai `CANCELLED`, tạo khoản phạt, tự động hóa hàng đợi đặt chỗ hoặc thêm dạng endpoint mới.
- Không thay đổi quyền sở hữu bản sao/lượt đặt chỗ FE06/FE08 hoặc thứ tự khóa đã phê duyệt.

---

## 4. Ghi chú rà soát

- `database/Librarymanagement.sql` được căn chỉnh với các trạng thái FE07 đã phê duyệt.
- Màn hình frontend FE07 và trạng thái lỗi được triển khai theo FE07-T20 đến FE07-T27.
- Nhat xác nhận rà soát của con người; PR #19 đã hợp nhất commit triển khai `3a7b0ad1165607b8912c6c0be5f3ef2025c11b55` vào `main` thành `aeed0dfecb764e6cbe63d7074727f318700e59ea`.
- Lượt chạy GitHub Actions CI `29308540692` đã đạt cho commit hợp nhất. Bằng chứng B7 chi tiết được ghi tại `.sdd/reviews/fe07-b7-integration-review-closeout-2026-07-14.md`.
- Các bản ghi này chỉ đóng mốc cơ sở cũ. FE07-T031 đến FE07-T038 phải được triển khai và rà soát trước khi v0.5.0 được xem là đã đối soát.

## 5. Cổng xác minh v0.5.0

| Cổng | Lệnh | Kết quả mong đợi |
| --- | --- | --- |
| Tuyến API/tầng truy cập dữ liệu FE07 | `npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js tests/borrowingContract.test.js` | Các ca mới về điều kiện hợp lệ, siêu dữ liệu, ngày, lý do và hợp đồng đạt. |
| Đồng thời SQL FE07 | `npm.cmd --prefix backend test -- --runTestsByPath tests/sql/borrowingConcurrency.sqltest.js` | Các ca tuần tự giới hạn cùng thành viên, thứ tự khóa, hoàn tác và siêu dữ liệu đạt khi cấu hình SQL sẵn có. |
| Frontend FE07 | `node --test frontend/test/borrowingFrontend.test.js` | Các kiểm tra lỗi v0.5.0 và trạng thái trung thực đạt. |
| Truy vết | `npm.cmd run trace:enforce` | Các tệp triển khai v0.5.0 mới thay đổi đạt ngưỡng kho mã. |
| Vệ sinh diff | `git diff --check` | Không có lỗi khoảng trắng. |

## 6. Cổng rà soát của con người v0.5.0

- [x] Xác nhận cơ chế khóa theo phạm vi thành viên hoạt động trên SQL Server và đi trước mọi khóa bản sao/yêu cầu/lượt đặt chỗ.
- [x] Xác nhận việc kiểm tra lại số đếm đang hoạt động và đầu sách/lượt đặt chỗ chỉ diễn ra sau khi giữ các khóa liên quan.
- [x] Xác nhận mọi ngày nghiệp vụ đều xác định trong `Asia/Ho_Chi_Minh`.
- [x] Xác nhận lý do từ chối và siêu dữ liệu phê duyệt được lưu/kiểm toán chính xác như đã phê duyệt.
- [x] Phê duyệt FE07-T031 đến FE07-T038 trước khi triển khai bắt đầu.

## 7. Hiệu chỉnh UX quyết định nhân sự và trả v0.7.3

1. Thêm hồi quy RED frontend yêu cầu ngữ cảnh yêu cầu/thành viên/bản sao chuẩn hoàn chỉnh trong cả hai hộp thoại quyết định nhân sự và dữ liệu đầu vào từ chối nhiều ký tự ổn định.
2. Giữ hộp thoại dùng chung được mount qua các lần render lại trường nhập liệu được kiểm soát bằng cách đọc callback đóng mới nhất qua ref thay vì khởi động lại quản lý focus bất cứ khi nào callback nội tuyến đổi danh tính.
3. Tái sử dụng một tóm tắt rà soát yêu cầu cho phê duyệt và từ chối để Thủ thư/Quản trị viên đưa ra cả hai quyết định trên cùng trường chuẩn.
4. Giữ thông báo vận hành nhân sự theo hướng ngoại lệ: lượt trả bình thường/đúng hạn dựa vào ngày và tình trạng hiển thị thay vì thông báo khẳng định bổ sung; cảnh báo quá hạn/hỏng/mất vẫn hiển thị.
5. Đối soát trình bày tình trạng hạn trả của trả với trường mượn/hạn trả/gia hạn chuẩn và ngày nghiệp vụ `Asia/Ho_Chi_Minh`; phân biệt rõ trạng thái sắp đến hạn, đến hạn hôm nay và quá hạn.
6. Giữ nguyên API FE07, bảo vệ vai trò, xác thực lại phía máy chủ, giao dịch phê duyệt/từ chối/trả, đối soát lịch sử thành viên, quyền sở hữu bản sao FE06, quyền sở hữu lượt đặt chỗ FE08 và ranh giới FE09/FE10 hiện có.
7. Chạy kiểm thử frontend tập trung, lint/build frontend, truy vết FE07 và vệ sinh diff trước khi rà soát của con người.

### Cổng xác minh v0.7.3

| Cổng | Lệnh | Kết quả mong đợi |
| --- | --- | --- |
| Frontend FE07 | `node --test frontend/test/borrowingFrontend.test.js` | Hồi quy ngữ cảnh quyết định và dữ liệu đầu vào từ chối ổn định đạt với bộ hợp đồng frontend FE07 hiện có. |
| Chất lượng frontend | `npm.cmd --prefix frontend run lint` và `npm.cmd --prefix frontend run build` | Không có lỗi lint và bundle môi trường triển khai thực tế được build. |
| Truy vết | `npm.cmd run trace:enforce` | FE07 vẫn đạt ngưỡng kho mã. |
| Vệ sinh diff | `git diff --check` | Không có lỗi khoảng trắng. |

## 8. Khắc phục thời gian nghiệp vụ và trạng thái trả v0.7.4

1. Thêm hồi quy máy chủ UTC chứng minh ngày quá hạn trả và điều kiện gia hạn vẫn dùng ngày nghiệp vụ `Asia/Ho_Chi_Minh`.
2. Điều hướng quyết định trả và gia hạn qua helper thời gian nghiệp vụ dùng chung; loại bỏ phép tính lịch máy chủ cục bộ.
3. Căn chỉnh tầng truy cập dữ liệu trong bộ nhớ với SQL bằng cách yêu cầu bản sao vật lý phải là `BORROWED` trước thay đổi trả và trả về `BORROW_STATE_CONFLICT` nếu không đúng.
4. Đối soát kiểm thử SQL thay đổi với điều kiện hợp lệ theo vai trò và kết quả xung đột trả đồng thời rõ ràng.
5. Chạy kiểm thử tập trung dưới `TZ=UTC`, sau đó chỉ chạy SQL thay đổi trên cơ sở dữ liệu cục bộ dùng một lần có tên trước khi xác minh đầy đủ và H2.

## 9. Bàn giao bản sao được giữ FE08 v0.7.6

1. Chấp nhận `bookId` cùng `copyId` là gợi ý chọn chỉ ở frontend từ FE08.
2. Chỉ chọn đúng bản sao khi nó xuất hiện trong phản hồi được bảo vệ của FE07 dành cho Thành viên hiện tại và có xét trạng thái đặt chỗ.
3. Giữ `POST /api/borrow-requests` và các kiểm tra điều kiện/trạng thái đặt chỗ phía máy chủ làm nguồn quyết định chính thức.
4. Giữ yêu cầu `PENDING` bình thường sau đó là phê duyệt Thủ thư/Quản trị viên và hoàn tất FE08 nguyên tử.

## 10. Kế hoạch căn chỉnh quy tắc v0.7.5

Kế hoạch thực thi chi tiết là
`docs/superpowers/plans/2026-07-27-fe07-fe10-fe12-business-rule-alignment.md`.

1. Đối soát nhánh với `DEC-GEN-005` và tác vụ `FE07-T047` trên `main`: mọi tài khoản có chính xác một vai trò và kịch bản gia hạn đa vai trò trước đây đã bị thay thế.
2. Giữ gia hạn chỉ chủ sở hữu Thành viên và gia hạn liên thành viên của Thủ thư/Quản trị viên là các đường một vai trò riêng biệt; loại bỏ kiểm thử đa vai trò cục bộ nhánh và phần chênh lệch ủy quyền không cần thiết trong khi giữ mọi kiểm tra chủ sở hữu khoản mượn.
3. Thêm hồi quy RED cho lượt trả làm thay đổi hạn trả giữa kiểm tra trước tầng dịch vụ và khóa tầng truy cập dữ liệu, sau đó yêu cầu phản hồi và siêu dữ liệu kiểm toán dùng ảnh chụp trạng thái giao dịch đã khóa.
4. Mở rộng hợp đồng trả của SQL và tầng truy cập dữ liệu trong bộ nhớ với bằng chứng `userId`, `requestId`, `copyId`, `dueDate`, `returnDate` và `overdueDays` chính thức mà không công khai bằng chứng nội bộ trong DTO công khai.
5. Thêm hồi quy gia hạn đạt dưới cả `TZ=UTC` và `TZ=America/New_York`; loại bỏ phép tính ngày cục bộ máy chủ khỏi tầng dịch vụ, kiểm tra SQL tầng truy cập dữ liệu và kiểm tra tương đương trong bộ nhớ.
6. Chạy kiểm thử tuyến API/tầng truy cập dữ liệu FE07 tập trung trước. Chỉ chạy SQL thay đổi khi `DB_NAME` là cơ sở dữ liệu cục bộ dùng một lần có tên và `FE07_SQL_TEST_ALLOW_MUTATION=true`.
7. Giữ diff triển khai chưa commit cho đến khi bằng chứng L1-L4 hoàn thành và Nhat cấp phụ lục H2.

## 11. Phụ lục tích hợp main v0.7.7

1. Giữ `FE07-T047` và `FE07-T048` từ `main` cho tự phục vụ thành viên một vai trò và bàn giao chính xác bản sao được giữ.
2. Dùng `FE07-T049` đến `FE07-T052` cho các tác vụ căn chỉnh quy tắc; không tái sử dụng hoặc ghi đè ID tác vụ phần triển khai trước.
3. Giữ ảnh chụp trạng thái trả chính thức và thay đổi ngày nghiệp vụ dùng chung từ v0.7.5 vì chúng độc lập với số lượng vai trò tài khoản.
4. Chạy các hồi quy vai trò/gia hạn, ảnh chụp trạng thái trả và múi giờ FE07 với triển khai `main` đã hợp nhất trước khi xác minh đầy đủ.
5. Không commit hợp nhất cho đến khi SPEC, PLAN/TASKS, mã, kiểm thử và bằng chứng đã đối soát nhận được phê duyệt phụ lục H2.

## 12. Phụ lục tích hợp phạt thành viên FE09 v0.7.9

1. Giữ nguyên yếu tố chặn mượn/gia hạn `UNPAID` dương của FE07 và xác định FE09 là chủ sở hữu trạng thái phạt chuẩn.
2. Để FE09-T024 chiếu tình trạng hạn trả/trả/mượn FE07 qua đường đọc chỉ Thành viên; không thêm thay đổi phạt FE07.
3. Giữ truy cập chính xác một vai trò: Thành viên đối soát tiền phạt của chính mình, trong khi Thủ thư/Quản trị viên ghi nhận thu tiền qua tuyến API nhân sự.
4. Chạy lại các cổng phạt/mượn tập trung, một vai trò, múi giờ, liên tính năng, đầy đủ và trình duyệt với `main@8d0059b`.
5. Giữ hợp nhất chưa commit và chưa push cho đến khi phụ lục H2 được phê duyệt.

## 13. Hiệu chỉnh yêu cầu bản sao đang chờ v0.8.0

1. Thêm ca RED tập trung chứng minh thành viên thứ hai không thể thấy hay yêu cầu một bản sao đã được yêu cầu `PENDING` giữ.
2. Dưới các khóa giao dịch thành viên/bản sao hiện có, kiểm tra lại yêu cầu `PENDING + REQUESTED` trước khi chèn bất kỳ hàng yêu cầu/chi tiết nào.
3. Giữ `BookCopies.Status` không đổi khi đang chờ; phê duyệt tiêu thụ yêu cầu thành `BORROWED`, và từ chối giải phóng nó qua trạng thái yêu cầu.
4. Làm các thay đổi trạng thái/ngừng kích hoạt FE06 từ chối một yêu cầu FE07 đang chờ.
5. Công khai trạng thái bản sao vật lý hiện tại trong chi tiết Quản trị FE11 an toàn và tải lại trạng thái Quản trị/Thủ thư sau cả quyết định thành công lẫn xung đột.
6. Chạy kiểm thử backend/frontend tập trung, hồi quy đầy đủ, lint/build, truy vết và vệ sinh diff; rà soát của con người vẫn được yêu cầu.

## 14. Bất biến quy trình cùng tiêu đề v0.8.1

1. Thêm bao phủ RED cho Thành viên gửi một bản sao khác của `BookId` đã có trong yêu cầu đang chờ hoặc khoản mượn đang hoạt động.
2. Lọc danh sách bản sao theo `BookId` và kiểm tra lại dưới khóa giao dịch theo phạm vi Thành viên hiện có trước khi chèn yêu cầu.
3. Trong khi phê duyệt, từ chối bản sao cũ trùng lặp nếu Thành viên đã có một chi tiết `BORROWED` cho cùng `BookId`; giữ từ chối như một bước dọn dẹp.
4. Công khai các yếu tố chặn phê duyệt riêng biệt về chủ sở hữu-vai trò/tài khoản/bản sao/cùng tiêu đề cho FE11 mà không chuyển quyền sở hữu lệnh FE07.

## 15. Kế hoạch đợt liên hoàn v0.9.0

1. `SL-001`: hợp nhất phê duyệt kích hoạt trước khi sửa phần sản phẩm.
2. `SL-002`: chờ FE10 chốt mẫu thông báo và đường dẫn thao tác theo quy định.
3. `SL-003`: kiểm thử trước và sau khi sửa cho thành phần gửi yêu cầu sau
   commit, hàng đợi bàn giao, dòng thời gian cùng hướng dẫn về điều kiện chặn và
   dữ liệu lỗi thời; FE07 là chức năng duy nhất chịu trách nhiệm cho phạm vi này.
4. `SL-006`: kiểm thử tích hợp và màn hình máy tính Chromium 1440x900.
5. Giữ toàn bộ phần thay đổi của sản phẩm chưa được commit đến H2; H3 bắt buộc trước hợp nhất.

Lệnh tập trung: `borrowingRoutes`, `borrowingRepository`, frontend journey/error
tests; sau đó toàn bộ kiểm thử backend/frontend, E2E, traceability và `git diff --check`.

## 16. Khắc phục lưu ngày trả nghiệp vụ v0.9.1

1. Dùng ca trả mặc định tại `2026-07-22T17:30:00.000Z` để chứng minh biên tầng dịch vụ-repository đang nhận ngày UTC `2026-07-22` thay vì ngày nghiệp vụ Việt Nam `2026-07-23`.
2. Giữ SPEC, API, schema và repository SQL không đổi; truyền `returnBusinessDate` chuẩn `YYYY-MM-DD` đã có vào tham số `sql.Date` thay cho đối tượng `clock()` thô.
3. Giữ ngày trả rõ ràng, bằng chứng giao dịch/kiểm toán, FE08 handoff và FE09 tính từ ngày trả đã commit như hiện tại.
4. Chạy RED/GREEN tập trung, ma trận `TZ=UTC`, repository/FE09, backend đầy đủ, traceability, secrets và vệ sinh diff; chỉ chạy SQL thay đổi trên cơ sở dữ liệu dùng một lần không phải staging đã được cấu hình.
5. H2 ngày 2026-08-02 phê duyệt đúng diff FE07/evidence để commit, push và mở Draft PR. Giữ FE07-T061 mở; sau khi có bản deploy đúng SHA, L4 yêu cầu một lượt staging acceptance sạch và H3 vẫn bắt buộc trước merge.

Kế hoạch thực thi chi tiết: `docs/superpowers/plans/2026-08-02-fe07-return-date-business-persistence.md`.

Bằng chứng H1 cục bộ: RED chứng minh đối số persistence là ngày UTC thô; GREEN đổi đúng một đối số production. FE07/FE09/repository `114/114`, system `11/11`, backend/coverage `1.175/1.175`, trace FE07 `100%`, secrets `5/5` và vệ sinh diff đạt. SQL dùng một lần không chạy vì chưa có cấu hình. H2 đã cấp cho publication scope; L4 staging, FE07-T061 và H3 vẫn mở.
