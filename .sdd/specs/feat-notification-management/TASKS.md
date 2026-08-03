# TASKS.md - FE10 Quản lý thông báo

Trạng thái: HOÀN THÀNH; PR #89 ĐÃ HỢP NHẤT; CI VÀ AZURE ĐÃ CHẠY THÀNH CÔNG TRÊN ĐÚNG COMMIT
Implementation State: COMPLETE
Cổng triển khai: V0.6.0 ĐÃ KÍCH HOẠT, H3 PHÊ DUYỆT VÀ TÍCH HỢP

Chi tiết v0.5.0 hiện tại: FE10-I01..I08, biện pháp khắc phục mã băm bản cập nhật
cơ sở dữ liệu và biện pháp khắc phục H3 vòng một có giới hạn đã hoàn tất. Mã
đối chiếu nội dung được H2
phê duyệt sau `main@30f936d` là
`e123345be05b59a9e519d182b301ab5464160e8fc32aed8d17d3c463e28e0a15`.
Commit PR #75 `778e0a470d8a1083bf571a8007b3c058eee4bb22` đạt CI
`30317424995` và môi trường thử nghiệm Azure `30317621429`, nhận H3 hai trục sạch và phê
duyệt rõ ràng, rồi hợp nhất thành `b75776b10d6cf4b6868d2ba51eb3268073483b8b`.
CI hậu hợp nhất `30341279111` và môi trường thử nghiệm Azure tự động `30341540847` đã đạt.

Trạng thái triển khai v0.4.5 trước đó: HOÀN TẤT

Chủ sở hữu: Nhat

Cập nhật: 2026-08-01

Trạng thái quy trình hiện tại: mốc chuẩn Giai đoạn 2/G1-G12, hộp thư v0.5.0
qua PR #75 và mẫu thông báo kết quả FE07 v0.6.0 đều đã hoàn tất. Đợt v0.6.0 được
H3 phê duyệt ở commit `08e472f` và tích hợp vào `main` qua `ba29dc0`. Hoàn tất
bản thay đổi `6189b1a` tiếp tục được phê duyệt H3 trong nhiệm vụ, hợp nhất qua PR #89
thành `main@39092fb`; CI `30675444178` và môi trường thử nghiệm Azure `30675744992` đều đạt
trên đúng commit.

---

## 1. Nhiệm vụ backend

- [x] FE10-T01 Thêm tuyến API yêu cầu thông báo và process-đang chờ.
- [x] FE10-T02 Thêm validator phía máy chủ cho loại, kênh, người nhận, khóa
  mẫu, tham chiếu nguồn, khả năng xử lý lặp an toàn và giới hạn xử lý.
- [x] FE10-T03 Thêm xác thực yêu cầu thông báo ở tầng dịch vụ.
- [x] FE10-T04 Thêm tra cứu mẫu và điền dữ liệu vào mẫu.
- [x] FE10-T05 Thêm che dữ liệu dữ liệu mã thông báo/liên kết/mật khẩu nhạy cảm.
- [x] FE10-T06 Thêm xử lý lũy đẳng cho thông báo hoạt động trùng.
- [x] FE10-T07 Thêm xử lý đang chờ bằng nhà cung cấp mô phỏng.
- [x] FE10-T08 Ghi lần gửi thành công và thất bại.
- [x] FE10-T09 Bảo vệ API thông báo khỏi người gọi công khai/thành viên.
- [x] FE10-T10 Căn chỉnh script SQL với trường, trạng thái, chỉ mục lũy đẳng và
  mẫu bắt buộc FE10.

## 2. Nhiệm vụ kiểm thử

- [x] FE10-T11 Thêm hàm hỗ trợ tầng truy cập dữ liệu thông báo trong bộ nhớ.
- [x] FE10-T12 Kiểm thử tạo yêu cầu xác minh tài khoản.
- [x] FE10-T13 Kiểm thử xử lý khóa chống gửi trùng.
- [x] FE10-T14 Kiểm thử lỗi thiếu biến mẫu.
- [x] FE10-T15 Kiểm thử che dữ liệu dữ liệu đặt lại mật khẩu.
- [x] FE10-T16 Kiểm thử thành công process-đang chờ và ghi log lần thử thất bại
  an toàn.
- [x] FE10-T17 Kiểm thử truy cập API được bảo vệ.

## 3. Xác thực

- [x] `npm test` trong `backend`.

## 4. Truy vết

| ID đặc tả | Được bao phủ bởi |
| --- | --- |
| AC-FE10-001 | FE10-T03, FE10-T04, FE10-T12 |
| AC-FE10-002 | FE10-T03, FE10-T05, FE10-T15 |
| AC-FE10-003 | FE10-T03, FE10-T04, FE10-T14 |
| AC-FE10-004 | FE10-T03, FE10-T07, FE10-T16 |
| AC-FE10-005 | FE10-T03, FE10-T07, FE10-T16 |
| AC-FE10-006 | FE10-T02, FE10-T04, FE10-T14 |
| AC-FE10-007 | FE10-T05, FE10-T15 |
| AC-FE10-008 | FE10-T06, FE10-T13 |
| AC-FE10-009 | FE10-T07, FE10-T08, FE10-T16 |

## 5. Vẫn ngoài phạm vi triển khai v0.4.5 lịch sử

- Tích hợp SMTP/nhà cung cấp thực.
- Màn hình thông báo trong ứng dụng.
- Giao diện quản lý thử lại.

v0.5.0 đã được phê duyệt chuyển hạng mục hộp thư cá nhân/trạng thái đã đọc vào
phạm vi triển khai FE10-I01..I08 mới bên dưới. Danh sách kiểm tra lịch sử này không tuyên
bố phần triển khai mới đã hoàn tất.

## 6. Nhiệm vụ củng cố FE10 - phân rã B4

Trạng thái B4: HOÀN TẤT. Trạng thái triển khai B5: HOÀN TẤT. Trạng thái xác thực
B6: HOÀN TẤT. Trạng thái tích hợp B7: HOÀN TẤT.

Các nhiệm vụ FE10-T01 đến FE10-T17 đã hoàn tất ở trên vẫn là bằng chứng lịch sử
cho phạm vi triển khai backend ban đầu. Các nhiệm vụ củng cố bên dưới triển khai hợp đồng
G1-G7 đã được phê duyệt dưới dạng các phạm vi triển khai dọc theo thứ tự. Mọi nhiệm vụ
triển khai sở hữu kiểm thử tập trung trong cùng phạm vi triển khai.

### FE10-H01 Sửa hợp đồng FE10 đã được phê duyệt

- [x] Trạng thái: HOÀN TẤT (`105e51c`)
- Ước lượng: 2-3 giờ
- Phụ thuộc: phê duyệt G1-G7 được ghi trong `PLAN.md`; không nhiệm vụ code nào
  được bắt đầu trước.
- Ánh xạ tới: G1-G7; BR-FE10-001 đến BR-FE10-013; FR-FE10-001 đến
  FR-FE10-009; AC-FE10-001 đến AC-FE10-009; Q-FE10-005 đến Q-FE10-007;
  NFR-FE10-SEC-001, NFR-FE10-SEC-004, NFR-FE10-REL-001 đến NFR-FE10-REL-003.
- Tệp chính xác: `.sdd/specs/feat-notification-management/SPEC.md`,
  `.sdd/specs/feat-notification-management/CHANGELOG.md`.
- Tiêu chí hoàn thành: `SPEC.md` ghi ánh xạ loại/mẫu chuẩn, gửi đồng bộ nhạy
  cảm so với gửi xếp hàng không nhạy cảm, quy tắc khóa nhạy cảm đệ quy chuẩn
  hóa, DTO tối thiểu, `sourceEntityId` chỉ số nguyên, thành phần gửi yêu cầu ràng buộc,
  thử lại thủ công được bảo vệ, lũy đẳng mọi trạng thái, trì hoãn FE02 và trì
  hoãn triển khai FE09; truy vết và danh sách kiểm tra rà soát được cập
  nhật; `CHANGELOG.md` ghi sửa đổi đã phê duyệt ngày 2026-07-13; không có thay
  đổi tệp triển khai.
- Xác minh: quét mâu thuẫn với G1-G7 và phần BR/FR/AC/API/NFR hiện có; xác nhận
  mọi nhiệm vụ củng cố sau này ánh xạ tới ID ổn định đã sửa.

### FE10-H02 Thực thi mẫu chuẩn và an toàn dữ liệu đã xếp hàng

- [x] Trạng thái: HOÀN TẤT (`3e0cae1`, `5686992`)
- Ước lượng: 3-4 giờ
- Phụ thuộc: FE10-H01.
- Ánh xạ tới: G1, G4, G7; BR-FE10-002, BR-FE10-004, BR-FE10-007, BR-FE10-010;
  FR-FE10-005, FR-FE10-009; AC-FE10-006, AC-FE10-007; EC-FE10-004,
  EC-FE10-006, EC-FE10-007; NFR-FE10-SEC-001, NFR-FE10-SEC-004.
- Tệp chính xác: `backend/src/services/notificationService.js`,
  `database/Librarymanagement.sql`,
  `backend/tests/helpers/inMemoryNotificationRepositories.js`,
  `backend/tests/notificationRoutes.test.js`.
- Tiêu chí hoàn thành: code máy chủ thực thi mọi cặp loại/mẫu đã phê duyệt và
  từ chối không khớp; SQL và dữ liệu kiểm thử kiểm thử dùng `{{otp}}` và
  `{{expiresInMinutes}}`; `templateData` không nhạy cảm đã xếp hàng duyệt đệ
  quy đối tượng/mảng, chuẩn hóa chữ hoa/thường và dấu phân cách của khóa, từ
  chối `token`/`otp`/`password`/`verificationlink`/`resetlink`, đồng thời áp
  dụng cùng phép duyệt với `safePayload`; tham chiếu nguồn số nguyên được đặc
  tả cho nhiệm vụ ranh giới sau; không thêm bí danh `EMAIL_VERIFY` hoặc
  `DUE_OR_FINE_NOTICE`.
- Xác minh: kiểm thử tuyến API tập trung bao phủ mọi cặp loại/mẫu đã quy định, từ chối không khớp,
  mảng/đối tượng lồng nhau, `OTP`, `reset_token` và `verification-link`; chạy
  `npm test -- notificationRoutes.test.js` trong `backend`.

### FE10-H03 Gửi đồng bộ thông báo xác thực nhạy cảm

- [x] Trạng thái: HOÀN TẤT (`6e58c9e` đến `5ce05c8`)
- Ước lượng: 3-4 giờ
- Phụ thuộc: FE10-H02.
- Ánh xạ tới: G1, G2; BR-FE10-003, BR-FE10-004, BR-FE10-008 đến BR-FE10-010,
  BR-FE10-012, BR-FE10-013; FR-FE10-001, FR-FE10-002, FR-FE10-006,
  FR-FE10-007; AC-FE10-001, AC-FE10-002, AC-FE10-007, AC-FE10-009;
  NFR-FE10-REL-001, NFR-FE10-REL-002, NFR-FE10-LOG-001, NFR-FE10-LOG-002.
- Tệp chính xác: `backend/src/services/notificationService.js`,
  `backend/src/repositories/notificationRepository.js`,
  `backend/src/models/Notification.js`,
  `backend/tests/helpers/inMemoryNotificationRepositories.js`,
  `backend/tests/notificationRoutes.test.js`.
- Tiêu chí hoàn thành: với `ACCOUNT_VERIFICATION` và `PASSWORD_RESET`, FE10 chỉ
  điền `otp` và `expiresInMinutes` vào mẫu trong bộ nhớ rồi gửi đồng
  bộ qua bộ điều hợp nhà cung cấp đã cấu hình; thành công lưu `SENT` cùng lần
  thử, thất bại lưu `FAILED` cùng lý do an toàn; thông báo, lần thử, kiểm toán,
  log và dữ liệu HTTP đã lưu không chứa OTP thô hoặc tiêu đề/nội dung nhạy cảm
  đã tạo từ mẫu; bản ghi không nhạy cảm vẫn được xếp hàng và `process-pending`
  loại trừ loại nhạy cảm.
- Xác minh: kiểm thử tập trung chứng minh cả đường thành công/thất bại nhạy
  cảm; nội dung chứa liên kết chỉ được tạo khi gọi nhà cung cấp; dữ liệu lưu đã
  được che; lần thử
  an toàn, không rò rỉ API/kiểm toán/log và xử lý hàng đợi không nhạy cảm không
  đổi; chạy tệp kiểm thử FE10 tập trung.

### FE10-H04 Chứa phản hồi HTTP và căn chỉnh giao diện hợp đồng

- [x] Trạng thái: HOÀN TẤT (`498dc67`, `549c6af`)
- Ước lượng: 2-3 giờ
- Phụ thuộc: FE10-H03.
- Ánh xạ tới: G2, G4, G5; BR-FE10-002, BR-FE10-004, BR-FE10-011;
  FR-FE10-005 đến FR-FE10-007; AC-FE10-006, AC-FE10-009;
  NFR-FE10-SEC-001, NFR-FE10-SEC-002, NFR-FE10-UX-002.
- Tệp chính xác: `backend/src/controllers/notificationController.js`,
  `backend/src/validators/notificationValidators.js`,
  `backend/tests/notificationRoutes.test.js`,
  `backend/tests/integration.test.js`, `backend/src/docs/openapi.yaml`.
- Tiêu chí hoàn thành: thao tác tạo trả `201 { notificationId, status }`; mọi
  yêu cầu trùng theo khóa chống gửi trùng trả `200` cùng hình dạng; xử lý trả
  `200 { processed, failed }`; không đối tượng thông báo đầy đủ, mảng, nội dung
  hoặc `safePayload` nào vượt HTTP; `sourceEntityId` chỉ nhận số nguyên; OpenAPI
  và khẳng định kiểm thử tích hợp ghi nhận phản hồi tạo/yêu cầu trùng/xử lý đã phê duyệt cùng
  hình dạng lỗi xác thực an toàn. Tài liệu thử lại vẫn do FE10-H08 sở hữu cùng
  triển khai tuyến API của nó.
- Xác minh: kiểm thử tuyến API và tích hợp tập trung bao phủ mã trạng thái/khóa thân
  chính xác và từ chối ID nguồn chuỗi; OpenAPI không chứa cấu trúc cơ sở dữ liệu phản hồi bản
  ghi đầy đủ lỗi thời.

### FE10-H05 Thêm thành phần gửi yêu cầu nguồn nội bộ ràng buộc

- [x] Trạng thái: HOÀN TẤT (`2ac8533`, `b877188`)
- Ước lượng: 3-4 giờ
- Phụ thuộc: FE10-H04.
- Ánh xạ tới: G3; BR-FE10-001, BR-FE10-002, BR-FE10-004, BR-FE10-005,
  BR-FE10-011 đến BR-FE10-013; FR-FE10-003 đến FR-FE10-005; AC-FE10-003,
  AC-FE10-004, AC-FE10-006, AC-FE10-009; NFR-FE10-SEC-001,
  NFR-FE10-SEC-006, NFR-FE10-REL-002.
- Tệp chính xác: `backend/src/services/notificationService.js`,
  `backend/tests/notificationRoutes.test.js`.
- Tiêu chí hoàn thành: `createSourceNotificationRequester(sourceFeature)`
  ràng buộc một nguồn trong danh sách cho phép `FE02`, `FE07`, `FE08`, `FE09`,
  `FE11`, `SYSTEM`; người gọi không thể ghi đè; quyền sở hữu nguồn/loại, gửi
  nhạy cảm, che dữ liệu, lũy đẳng và xác thực được dùng chung; kiểm toán nguồn
  dùng `userId: null`; HTTP vẫn được bảo vệ cho Thủ thư/Quản trị viên đối với
  yêu cầu không nhạy cảm.
- Xác minh: kiểm thử tầng dịch vụ cấp đơn vị/tuyến API bao phủ từ chối danh sách cho
  phép, chặn ghi đè nguồn, thực thi chính sách dùng chung, siêu dữ liệu kiểm
  toán người dùng null và lỗi an toàn; người gọi FE02 và FE09 không bị chạm tới.

### FE10-H06 Di chuyển thông báo mượn sách FE07

- [x] Trạng thái: HOÀN TẤT (`c8da11b`)
- Ước lượng: 2-3 giờ
- Phụ thuộc: FE10-H05.
- Ánh xạ tới: G3; BR-FE10-001, BR-FE10-005, BR-FE10-012; FR-FE10-004;
  AC-FE10-004; NFR-FE10-REL-002.
- Tệp chính xác: `backend/src/services/borrowingService.js`,
  `backend/tests/borrowingRoutes.test.js`.
- Tiêu chí hoàn thành: FE07 ngừng ghi thông báo qua
  `notificationRepository.createNotification()` và dùng thành phần gửi yêu cầu ràng
  buộc với `FE07`; siêu dữ liệu nguồn hạn trả/quá hạn đã phê duyệt và khóa
  chuẩn được giữ; lỗi thông báo được bắt an toàn và không bao giờ hoàn tác trạng
  thái mượn/trả; kiểm thử và triển khai thay đổi cùng nhau.
- Xác minh: kiểm thử mượn sách tập trung chứng minh sử dụng thành phần gửi yêu cầu, ràng
  buộc nguồn, hình dạng yêu cầu chuẩn và hành vi thất bại không chặn; chạy
  `npm test -- borrowingRoutes.test.js` trong `backend`.

### FE10-H07 Di chuyển thông báo đặt chỗ FE08

- [x] Trạng thái: HOÀN TẤT (`83b645a`)
- Ước lượng: 2-3 giờ
- Phụ thuộc: FE10-H05.
- Ánh xạ tới: G3; BR-FE10-001, BR-FE10-005, BR-FE10-012; FR-FE10-003;
  AC-FE10-003; NFR-FE10-REL-002.
- Tệp chính xác: `backend/src/services/reservationService.js`,
  `backend/tests/reservationRoutes.test.js`.
- Tiêu chí hoàn thành: FE08 ngừng ghi thông báo qua
  `notificationRepository.createNotification()` và dùng thành phần gửi yêu cầu ràng
  buộc với `FE08`; siêu dữ liệu nguồn đặt chỗ sẵn sàng và khóa chuẩn được giữ;
  lỗi thông báo vẫn không chặn và không hoàn tác giữ chỗ; kiểm thử và triển khai
  thay đổi cùng nhau.
- Xác minh: kiểm thử đặt chỗ tập trung chứng minh sử dụng thành phần gửi yêu cầu, ràng
  buộc nguồn, hình dạng yêu cầu chuẩn và giữ chỗ được bảo toàn khi thông báo thất
  bại; chạy `npm test -- reservationRoutes.test.js` trong `backend`.

### FE10-H08 Thực thi lũy đẳng mọi trạng thái và thử lại thủ công

- [x] Trạng thái: HOÀN TẤT (`5c0c0dd`, `cad91ba`, `7c88223`)
- Ước lượng: 3-4 giờ
- Phụ thuộc: FE10-H04, FE10-H05; chỉ có thể bắt đầu sau khi phần thay đổi tích hợp
  FE10-H06 và FE10-H07 ổn định vì tệp tầng dịch vụ và kiểm thử FE10 dùng chung được
  tái sử dụng.
- Ánh xạ tới: G5, G6; BR-FE10-006, BR-FE10-008, BR-FE10-011, BR-FE10-013;
  FR-FE10-007, FR-FE10-008; AC-FE10-008, AC-FE10-009; EC-FE10-008,
  EC-FE10-009, EC-FE10-011; Q-FE10-005; NFR-FE10-REL-001 đến NFR-FE10-REL-003.
- Tệp chính xác: `backend/src/services/notificationService.js`,
  `backend/src/repositories/notificationRepository.js`,
  `backend/src/models/Notification.js`,
  `backend/src/controllers/notificationController.js`,
  `backend/src/routes/notificationRoutes.js`,
  `backend/src/validators/notificationValidators.js`,
  `backend/tests/helpers/inMemoryNotificationRepositories.js`,
  `backend/tests/notificationRoutes.test.js`,
  `backend/tests/integration.test.js`, `backend/src/docs/openapi.yaml`.
- Tiêu chí hoàn thành: tra cứu theo khóa chống gửi trùng trả về một bản ghi xuyên suốt mọi trạng
  thái và giữ khóa duy nhất mọi trạng thái; `POST /api/notifications/{id}/retry`
  được bảo vệ chỉ cho phép thông báo đã xếp hàng không nhạy cảm thất bại dùng lại
  cùng bản ghi/khóa/lịch sử lần thử và trả `200 { notificationId, status }`;
  trạng thái không hợp lệ trả `409` an toàn; thử lại xác thực nhạy cảm trả
  `409 REISSUE_REQUIRED` an toàn không có chi tiết nhà cung cấp hay bí mật;
  OpenAPI và khẳng định kiểm thử tích hợp ghi nhận tuyến API thử lại đã triển khai cùng thân
  `200`/`409` chính xác.
- Xác minh: kiểm thử tập trung và tích hợp bao phủ yêu cầu trùng ở các trạng thái `PENDING`,
  `SENT`, `FAILED`, chuyển đổi thử lại/bảo toàn lịch sử, truy cập không được
  ủy quyền, xung đột trạng thái, cả hai ca phát hành lại nhạy cảm và tính đồng
  nhất phản hồi được ghi; chạy tệp kiểm thử FE10 và tích hợp tập trung.

### FE10-H09 Vượt cổng xác thực B6

- [x] Trạng thái: HOÀN TẤT
- Ước lượng: 2-4 giờ
- Phụ thuộc: FE10-H01 đến FE10-H08 hoàn tất và được rà soát độc lập.
- Ánh xạ tới: G1-G7 và toàn bộ hàng truy vết BR/FR/AC/API/NFR FE10 đã sửa.
- Tệp chính xác: `.sdd/specs/feat-notification-management/TASKS.md`,
  `.sdd/specs/feat-notification-management/CHANGELOG.md`; không có tệp triển
  khai được lên kế hoạch.
- Tiêu chí hoàn thành: kiểm thử tập trung FE10, FE07 và FE08 đạt; toàn bộ
  backend đạt; truy vết từ SPEC đến nhiệm vụ đến kiểm thử đầy đủ; không bí
  mật/liên kết/mã thông báo nào bị lộ qua dữ liệu kiểm thử, log, khẳng định kiểm thử lưu vào cơ sở dữ liệu hoặc
  phản hồi; phần thay đổi không chứa frontend, triển khai FE02, triển khai FE09, nhà
  cung cấp thực, phụ thuộc, hết hạn hoặc thay đổi tái cấu trúc không liên quan;
  rà soát độc lập không báo phát hiện chặn.
- Xác minh: chạy kiểm thử tập trung, `npm test` trong `backend`,
  `git diff --check`, quét nội dung giữ chỗ, quét mâu thuẫn, quét bí mật và rà soát
  phạm vi tệp đã đổi cuối; ghi lệnh và kết quả chính xác trước khi đánh dấu hoàn
  tất.

Bằng chứng xác thực ghi ngày 2026-07-13:

- `npm.cmd test -- notificationRoutes.test.js borrowingRoutes.test.js reservationRoutes.test.js integration.test.js`
  trong `backend`: ĐẠT, 4 bộ và 136 kiểm thử sau bản sửa rà soát H09.
- `npm.cmd test` trong `backend`: ĐẠT, 15 bộ và 212 kiểm thử sau bản sửa rà soát
  H09.
- `node scripts/check-traceability.js --enforce`: ĐẠT; FE10 bao phủ 9/9 yêu cầu
  chức năng (100%), không tính năng triển khai nào dưới cổng 70%.
- Quét độc lập đầu tiên phát hiện siêu dữ liệu nguồn HTTP không an toàn và văn
  bản thất bại do nhà cung cấp cung cấp. Commit `a04b64b` thêm xác thực
  theo kiểm thử trước và sửa lưu vào cơ sở dữ liệu lỗi chung; lượt kiểm thử trước khi sửa có 6 lỗi kỳ vọng, sau
  đó bộ FE10 tập trung đạt 96/96 kiểm thử.
- `git diff --check a613604..HEAD`: ĐẠT sau bản sửa rà soát.
- Lệnh quét nội dung giữ chỗ:
  `git diff -U0 a613604..HEAD -- backend/src backend/tests database | Select-String -Pattern '^\+.*\b(TODO|FIXME|TBD|XXX)\b' -CaseSensitive`;
  ĐẠT với 0 dấu triển khai chưa giải quyết.
- Lệnh quét mâu thuẫn:
  `rg -n -i "B5 (implementation )?(remains )?not started|stay .*NOT STARTED.* until approval" .sdd/specs/feat-notification-management/PLAN.md .sdd/specs/feat-notification-management/CONTEXT.md`
  và
  `rg -n "DUE_OR_FINE_NOTICE|EMAIL_VERIFY|findActiveByIdempotencyKey" .sdd/specs/feat-notification-management/SPEC.md .sdd/specs/feat-notification-management/PLAN.md .sdd/specs/feat-notification-management/CONTEXT.md backend/src backend/tests database/Librarymanagement.sql`;
  ĐẠT với 0 kết quả B5 lỗi thời và 0 tra cứu chỉ hoạt động lỗi thời. Mọi kết quả
  `DUE_OR_FINE_NOTICE` là phát biểu không chuẩn rõ ràng; `EMAIL_VERIFY` chỉ
  còn trong phần từ chối/trì hoãn FE02 rõ ràng hoặc xử lý cũ phòng vệ.
- Các lệnh quét rò rỉ kiểm tra dòng backend được thêm cho mẫu log/phản hồi nhạy
  cảm và chữ ký thông tin xác thực thật; ĐẠT với 0 log nhạy cảm thêm, 0 phản hồi
  nhạy cảm thêm và 0 chữ ký bí mật thực. Sentinel nhà cung cấp/kiểm thử tổng hợp
  chỉ xuất hiện trong đầu vào bộ nhớ nhà cung cấp và khẳng định kiểm thử âm.
- Lệnh phạm vi tệp thay đổi: `git diff --name-only a613604..HEAD`; ĐẠT với 0
  trường hợp phạm vi bị cấm: không frontend, triển khai FE02, triển khai FE09,
  nhà cung cấp thực, phụ thuộc, hết hạn hoặc tệp tái cấu trúc không liên quan.
- Rà soát tập trung commit `a04b64b`: `Spec compliance: APPROVED`; `Code quality: APPROVED`.
- Rà soát toàn nhánh cuối `a613604..eb82b1d`: APPROVED không phát hiện; người
  rà soát độc lập chạy lại toàn bộ backend (15 bộ, 212 kiểm thử), thực thi
  truy vết và `git diff --check`.

## 7. Tích hợp B7 và kết thúc rà soát

- [x] Nhat xác nhận cổng tích hợp con người và chọn hợp nhất cục bộ.
- [x] Commit `9185a9a91f41e444e0c4e6bd8c0605a281272ee9` đã vào `main` và
  `origin/main`.
- [x] Lượt CI GitHub Actions `29236572558` đạt cho cùng commit.
- [x] Độ phù hợp hệ thống, tính toàn vẹn kiến trúc, tác động tương lai và tài
  liệu đã được rà soát mà không mở rộng phạm vi FE10.
- [x] Bằng chứng chi tiết được ghi trong
  `.sdd/reviews/fe10-b7-integration-review-closeout-2026-07-13.md`.

## 8. Truy vết củng cố và công việc song song

| Cổng đã phê duyệt | Nhiệm vụ củng cố |
| --- | --- |
| G1 | FE10-H01, FE10-H02, FE10-H03, FE10-H09 |
| G2 | FE10-H01, FE10-H03, FE10-H04, FE10-H09 |
| G3 | FE10-H01, FE10-H05, FE10-H06, FE10-H07, FE10-H09 |
| G4 | FE10-H01, FE10-H02, FE10-H04, FE10-H09 |
| G5 | FE10-H01, FE10-H04, FE10-H08, FE10-H09 |
| G6 | FE10-H01, FE10-H08, FE10-H09 |
| G7 | FE10-H01, FE10-H02, FE10-H09 |

Cơ hội song song thận trọng: sau khi FE10-H05 hoàn tất và được rà soát,
FE10-H06 và FE10-H07 có thể chạy song song vì chúng sở hữu tầng dịch vụ nguồn và tệp
kiểm thử tách biệt. Mọi nhiệm vụ khác vẫn theo thứ tự vì chúng chia sẻ hợp đồng
FE10, code tầng dịch vụ/tầng truy cập dữ liệu, kiểm thử tuyến API hoặc bằng chứng xác thực.

Với tập củng cố G1-G7 đã hoàn tất, triển khai FE02 và tích hợp người gọi FE09
đã nằm ngoài phạm vi rõ ràng. ADR-004 và FE10-S01 đến FE10-S05 hiện thay thế
việc trì hoãn FE02; FE09 vẫn không có người gọi/tích hợp hiện tại để bản cập nhật cơ sở dữ liệu.

## 9. Nhiệm vụ theo dõi bảo mật OTP FE10

Các nhiệm vụ FE10-T và FE10-H đã hoàn tất ở trên vẫn là bằng chứng lịch sử.
ADR-004 và G8-G10 chỉ thay thế phần mẫu liên kết và trì hoãn FE02 cũ.

### FE10-S01 Chuẩn hóa hợp đồng liên tính năng

- [x] Trạng thái: TÀI LIỆU HOÀN TẤT - RÀ SOÁT THỦ CÔNG ĐƯỢC NHAT XÁC NHẬN
  2026-07-17
- Ánh xạ tới: G8-G10; ADR-004; BR-FE10-003 đến BR-FE10-005, BR-FE10-010 đến
  BR-FE10-013; FR-FE10-001, FR-FE10-002, FR-FE10-005, FR-FE10-009;
  AC-FE10-001, AC-FE10-002, AC-FE10-006, AC-FE10-007, AC-FE10-009.
- Tệp: `.sdd/rfcs/ADR-004-auth-otp-notification-boundary.md`,
  `.agents/CLAUDE.md`, `CONTEXT.md`, `SPEC.md`, `PLAN.md`, `TASKS.md`,
  `CHANGELOG.md` của FE10 và FE02.
- Tiêu chí hoàn thành: FE02/FE10 thống nhất biến OTP, quyền sở hữu nhạy cảm chỉ
  FE02, không ghi đè nguồn HTTP, lũy đẳng ID mã thông báo, trừu tượng nhà cung
  cấp đã cấu hình, lỗi không chặn, ngữ nghĩa gửi lại và loại trừ
  `CHANGE_PASSWORD_OTP` rõ ràng; không thay đổi tệp triển khai.

### FE10-S02 Thêm kiểm thử tái hiện lỗi trước khi sửa cho ranh giới và hợp đồng OTP

- [x] Trạng thái: KIỂM THỬ TRƯỚC KHI SỬA HOÀN TẤT
- Phụ thuộc: phê duyệt con người FE10-S01.
- Ánh xạ tới: BR-FE10-002 đến BR-FE10-005, BR-FE10-010, BR-FE10-011;
  FR-FE10-001, FR-FE10-002, FR-FE10-005, FR-FE10-009; AC-FE10-001,
  AC-FE10-002, AC-FE10-006.
- Tệp: `backend/tests/notificationRoutes.test.js`,
  `backend/tests/helpers/inMemoryNotificationRepositories.js`,
  `backend/tests/integration.test.js`.
- Tiêu chí hoàn thành: kiểm thử tập trung thất bại cho việc HTTP nhân viên gửi
  nhạy cảm, HTTP `sourceFeature`, dùng thành phần gửi yêu cầu nhạy cảm không phải FE02,
  biến OTP thiếu/không hợp lệ và biến liên kết cũ; kiểm thử đặc tả yêu cầu OTP
  FE02 ràng buộc được chấp nhận cùng lỗi chính xác
  `403 SENSITIVE_NOTIFICATION_INTERNAL_ONLY` an toàn.

### FE10-S03 Triển khai quyền sở hữu nguồn nhạy cảm và gửi qua nhà cung cấp

- [x] Trạng thái: HOÀN TẤT - TRIỂN KHAI, MỐC CẤU TRÚC CƠ SỞ DỮ LIỆU VÀ KIỂM
  THỬ TỰ ĐỘNG ĐỀU ĐẠT
- Phụ thuộc: bằng chứng lỗi được tái hiện trước khi sửa ở FE10-S02.
- Ánh xạ tới: G8, G9; BR-FE10-003, BR-FE10-004, BR-FE10-010 đến BR-FE10-013;
  FR-FE10-001, FR-FE10-002, FR-FE10-005; AC-FE10-001, AC-FE10-002,
  AC-FE10-006, AC-FE10-007.
- Tệp: `backend/src/services/notificationService.js`,
  `backend/src/validators/notificationValidators.js`,
  `backend/src/services/emailService.js`,
  `backend/src/controllers/notificationController.js`,
  `database/Librarymanagement.sql`, `backend/src/docs/openapi.yaml`,
  `backend/tests/helpers/inMemoryNotificationRepositories.js`,
  `backend/tests/notificationRoutes.test.js`,
  `backend/tests/integration.test.js`.
- Tiêu chí hoàn thành: chỉ thành phần gửi yêu cầu ràng buộc FE02 chấp nhận loại nhạy cảm;
  HTTP không thể đặt `sourceFeature`; mẫu OTP yêu cầu
  `otp`/`expiresInMinutes`; bộ điều hợp nhà cung cấp đã cấu hình gửi nội dung
  đã tạo từ mẫu; lưu vào cơ sở dữ liệu/kiểm toán/log/phản hồi không chứa OTP hoặc nội dung nhạy
  cảm đã tạo từ mẫu; siêu dữ liệu nguồn dùng `FE02`/`AuthToken`/ID mã thông báo.
- Bằng chứng: tầng dịch vụ, OpenAPI, mốc chuẩn và bản cập nhật cơ sở dữ liệu mẫu OTP có thể chạy lại an toàn đã
  đồng bộ; bản cập nhật cơ sở dữ liệu đạt hai lần thực thi SQL Server dùng một lần và cổng tập
  trung FE02/FE10 hiện tại đạt.

### FE10-S04 Tích hợp FE02 không gửi trùng

- [x] Trạng thái: HOÀN TẤT - TÍCH HỢP NGUỒN GỬI YÊU CẦU FE02 ĐÃ ĐẠT
- Phụ thuộc: FE10-S03; bằng chứng lỗi được tái hiện trước khi sửa ở FE02-T030.
- Ánh xạ tới: G10; BR-FE10-005, BR-FE10-006, BR-FE10-012, BR-FE10-013;
  FR-FE10-001, FR-FE10-002, FR-FE10-008; AC-FE10-001, AC-FE10-002,
  AC-FE10-008, AC-FE10-009; FE02-T031, FE02-T032.
- Tệp: `backend/src/services/authService.js`,
  `backend/src/repositories/authTokenRepository.js`,
  `backend/tests/helpers/inMemoryAuthRepositories.js`,
  `backend/tests/authRoutes.test.js`.
- Tiêu chí hoàn thành: xác minh/đặt lại tạo một yêu cầu FE10 trên mỗi ID mã
  thông báo đã lưu; loại bỏ lần ghi thông báo trực tiếp, lần gọi email xác minh/
  đặt lại trực tiếp và trường mã thông báo debug HTTP; kiểm thử thu OTP qua
  phụ thuộc được truyền vào; `CHANGE_PASSWORD_OTP` và chấp nhận mã thông báo cũ vẫn
  giữ; lỗi FE10 không chặn và gửi lại tạo sự kiện/khóa mới.

### FE10-S05 Vượt xác thực liên tính năng và rà soát con người

- [x] Trạng thái: HOÀN TẤT QUA B7
- Phụ thuộc: FE10-S02 đến FE10-S04; FE02-T030 đến FE02-T032.
- Ánh xạ tới: hợp đồng xác minh ADR-004 và mọi hàng truy vết G8-G10.
- Tệp: `TASKS.md` và `CHANGELOG.md` FE10/FE02; tệp triển khai chỉ cho bản sửa
  rà soát đã được phê duyệt.
- Tiêu chí hoàn thành: kiểm thử FE10/FE02 tập trung và tích hợp bị ảnh hưởng đạt;
  quét hợp đồng liên kết/trì hoãn cũ không có kết quả hoạt động; quét rò rỉ OTP
  đạt; truy vết và `git diff --check` đạt; phần thay đổi không chứa frontend, người
  gọi FE09, phụ thuộc mới, bản cập nhật cơ sở dữ liệu cấu trúc cơ sở dữ liệu bảng/chỉ mục hoặc bản cập nhật cơ sở dữ liệu
  `CHANGE_PASSWORD_OTP`; rà soát con người được ghi trước commit/hợp nhất.
- Bằng chứng: cổng FE02/FE10/tích hợp tập trung đạt 170/170; toàn bộ backend
  đạt 916/916 với bao phủ đã cấu hình; truy vết là 10/10 cho FE10 và 26/26
  cho FE02; frontend 149/149, hệ thống 10/10, triển khai 7/7, kiểm thử E2E trên trình duyệt 4/4,
  OpenAPI/nạp mô-đun, rò rỉ và kiểm tra phần thay đổi đạt. Bằng chứng mở rộng bao phủ toàn
  bộ danh sách cho phép không phải FE02, lỗi ghi đè nguồn HTTP chính xác và xoay
  vòng sự kiện/khóa đặt lại mật khẩu lặp lại. Không cần sửa môi trường triển khai thực tế. PR #42
  đã hợp nhất thành `34d9180`; PR CI `29688102867` và CI `main` hậu hợp nhất chính
  xác `29688222757` đã đạt.

## 10. Nhiệm vụ theo dõi thiết lập tài khoản FE11

### FE10-S06 Thêm kiểm thử tái hiện lỗi trước khi sửa cho ranh giới thiết lập tài khoản FE11

- [x] Trạng thái: HOÀN TẤT (`547f986`)
- Phụ thuộc: ADR-005 và phê duyệt con người FE11-S01.
- Ánh xạ tới: G11; FR-FE10-005, FR-FE10-009, FR-FE10-010; AC-FE10-006,
  AC-FE10-010.
- Tệp: `backend/tests/notificationRoutes.test.js`,
  `backend/tests/helpers/inMemoryNotificationRepositories.js`.
- Tiêu chí hoàn thành: kiểm thử thất bại cho HTTP nhân viên `ACCOUNT_SETUP`,
  dùng thành phần gửi yêu cầu không phải FE11, `setupLink` hoặc `expiresInHours` thiếu/
  không hợp lệ, ghi đè nguồn, cặp loại/mẫu đã quy định sai được dùng lại và rò rỉ thông tin xác
  thực qua lưu vào cơ sở dữ liệu/phản hồi; yêu cầu FE11 được chấp nhận dùng ID mã thông báo
  `AuthToken` và khóa chống gửi trùng chính xác.

### FE10-S07 Triển khai gửi thiết lập nhạy cảm do FE11 sở hữu

- [x] Trạng thái: HOÀN TẤT (`547f986`, `3e25875`)
- Phụ thuộc: bằng chứng lỗi được tái hiện trước khi sửa FE10-S06 và ranh giới nhà cung cấp dùng chung
  FE10-S03.
- Ánh xạ tới: G11; BR-FE10-002, BR-FE10-004 đến BR-FE10-013; FR-FE10-010;
  AC-FE10-010.
- Tệp: tầng dịch vụ thông báo/validator/bộ điều hợp nhà cung cấp, ràng buộc mẫu/loại
  SQL, OpenAPI, kiểm thử tập trung.
- Tiêu chí hoàn thành: `FE11` thuộc danh sách cho phép mà không làm yếu quyền
  sở hữu FE02; chỉ FE11 gửi `ACCOUNT_SETUP`; nhà cung cấp nhận nội dung thiết
  lập đã tạo từ mẫu trong bộ nhớ; lưu vào cơ sở dữ liệu/kiểm toán/log/phản hồi không chứa mã
  thông báo/liên kết/nội dung đã tạo từ mẫu; kết quả là bản tóm tắt
  `SENT`/`FAILED` tối thiểu.

### FE10-S08 Vượt rà soát tích hợp thiết lập FE11

- [x] Trạng thái: HOÀN TẤT - RÀ SOÁT THỦ CÔNG ĐÃ XÁC NHẬN
- Phụ thuộc: FE10-S07, FE11-S04..S06, FE02-T035..T036.
- Ánh xạ tới: hợp đồng xác minh ADR-005.
- Tệp: tệp nhiệm vụ/changelog FE10/FE11/FE02 và chỉ bản sửa rà soát đã phê duyệt.
- Tiêu chí hoàn thành: kiểm thử tạo, thất bại, hoàn tất, gửi lại, quyền sở hữu,
  lũy đẳng và rò rỉ đạt; hành vi OTP không đổi; truy vết, quét bí mật và
  `git diff --check` đạt; Nhat ghi rà soát con người trước commit/hợp nhất.
- Trạng thái xác thực: ĐẠT ngày 2026-07-15 với 170/170 kiểm thử backend bị ảnh
  hưởng, 75/75 kiểm thử frontend, thực thi truy vết, quét thông tin xác thực
  dòng thay đổi và kiểm tra phần thay đổi. Nhat xác nhận rà soát con người Nhiệm vụ 7 cuối.

## 11. Phần theo dõi kết quả tư cách thành viên FE04

### FE10-S09 Thêm ranh giới nguồn kết quả tư cách thành viên FE04

- [x] Trạng thái: HOÀN TẤT - RANH GIỚI VÀ TÍCH HỢP NGUỒN FE04 ĐÃ ĐẠT
- Phụ thuộc: sửa hợp đồng thành phần gửi yêu cầu FE04/FE10.
- Ánh xạ tới: Q-FE10-009, BR-FE10-005, BR-FE10-011, FR-FE10-006, FR-FE10-009.
- Tiêu chí hoàn thành: FE04 được chấp nhận bởi danh sách cho phép ràng buộc khi
  khởi tạo, chỉ FE04 có thể gửi `MEMBERSHIP_RESULT`, hành vi trạng thái/dấu thời
  gian được kiểm thử và lỗi gửi vẫn không chặn sau khi quyết định tư cách thành
  viên đã commit.

## 12. Khắc phục an toàn cho quy trình gửi thông báo

### FE10-S10 Lưu quyền xử lý trước khi gọi nhà cung cấp

- [x] Trạng thái: HOÀN TẤT; KHẮC PHỤC H3, HỢP NHẤT VÀ AZURE ĐÚNG COMMIT ĐÃ ĐẠT
- Thiết kế đã phê duyệt:
  `docs/superpowers/specs/2026-07-23-fe07-fe08-fe10-fe12-final-verification-remediation-design.md`.
- Ánh xạ tới: BR-FE10-005, BR-FE10-006, BR-FE10-008, BR-FE10-013;
  FR-FE10-001, FR-FE10-002, FR-FE10-006 đến FR-FE10-008, FR-FE10-010;
  AC-FE10-006, AC-FE10-008 đến AC-FE10-010.
- Tệp: đặc tả/ADR/OpenAPI FE10, tầng dịch vụ/tầng truy cập dữ liệu/mô hình thông báo, SQL chuẩn,
  `2026-07-23-fe10-processing-status.sql`, phụ thuộc trong bộ nhớ và kiểm thử
  tập trung.
- Bằng chứng lỗi được tái hiện trước khi sửa: thiếu tham chiếu nguồn nội bộ, lỗi lưu vào cơ sở dữ liệu chuyển đổi kết
  thúc, yêu cầu trùng khi trạng thái không chắc chắn và việc nhận/hoàn tất đồng thời đều thất
  bại với phần triển khai `PENDING`-qua-nhà-cung-cấp trước đó.
- Hợp đồng Sau khi sửa: chấp nhận nhạy cảm và nhận hàng đợi lưu `PROCESSING` trước
  thao tác gọi nhà cung cấp; chuyển đổi kết thúc được bảo vệ dùng giao dịch ngắn mới;
  hàng không chắc chắn không bị nhận lại hay thử lại; thử lại thủ công trả
  `DELIVERY_STATE_UNCERTAIN` an toàn.
- Bằng chứng xác minh: kiểm thử FE10 tập trung, bản cập nhật cơ sở dữ liệu hai lần trên cơ sở dữ
  liệu SQL cục bộ được đặt tên dùng một lần, kiểm tra tầng truy cập dữ liệu đầy đủ, rà soát
  bảo mật/phần thay đổi và dọn dẹp đều xanh. H2 ban đầu và phụ lục H2 đã đạt; commit
  `97aca62` và lượt PR CI `30014066260` đạt; bản cập nhật cơ sở dữ liệu đã rà soát được áp dụng
  một lần lên môi trường thử nghiệm. H2 mới sau đó phê duyệt commit khắc phục `b931e00` và
  PR CI `30019439505` đạt. Rà soát H3 lặp lại chỉ trả về phát hiện hoàn tất vòng
  hai có giới hạn. H2 mới phê duyệt gói vòng hai ngày 2026-07-23 và ủy quyền
  commit/push đã rà soát; phát hiện được khắc phục, H3 lặp lại, hợp nhất và hoàn tất
  cuối đều đã đóng.

## 13. An toàn định nghĩa mẫu đã lưu

### FE10-S11 Từ chối định nghĩa mẫu đã lưu không an toàn

- [x] Trạng thái: ĐÃ TRIỂN KHAI VÀ XÁC THỰC TỰ ĐỘNG; H2 TÍCH HỢP VÀ PR CI ĐẠT
- Ánh xạ tới: BD-004, BR-FE10-010, FR-FE10-005/009, AC-FE10-006,
  EC-FE10-010, NFR-FE10-SEC-005.
- Trước khi sửa: định nghĩa tiêu đề/nội dung đã lưu không an toàn bị làm sạch ngầm và
  được chấp nhận.
- Sau khi sửa: `validateStoredTemplateDefinition(template)` từ chối thẻ HTML thô,
  thuộc tính xử lý sự kiện nội tuyến và URL `javascript:` bằng
  `400 UNSAFE_TEMPLATE_DEFINITION` an toàn trước khi tạo nội dung từ mẫu/lưu vào cơ sở dữ liệu/thao tác gọi nhà
  cung cấp.
- Bằng chứng: 3/3 ca lỗi được tái hiện trước khi sửa được giải quyết là `SENT`; Kiểm thử tập trung sau khi sửa đạt 4/4
  bao gồm làm sạch khi chạy, toàn bộ FE10 đạt 139/139.
- Bảo toàn: giá trị khi chạy vẫn được escape/làm sạch; từ chối khóa giống bí
  mật, che `safePayload`, quyền sở hữu nguồn, lũy đẳng, DTO và trạng thái giao
  hàng bền vững không đổi.
- Tệp: `backend/tests/notificationRoutes.test.js`,
  `backend/src/services/notificationService.js`.
- Cổng: phụ lục H2 sản phẩm phê duyệt commit `f346ae0` và lượt PR CI
  `30244750250` đạt. Khắc phục H3 chỉ tài liệu cần H2 mới và H3 lặp lại trước
  hợp nhất.

## 14. Khắc phục gửi email môi trường thử nghiệm

### FE10-S12 Kích hoạt hợp đồng khắc phục đã phê duyệt

- [x] Trạng thái: THIẾT KẾ VÀ HỢP ĐỒNG BẰNG VĂN BẢN ĐƯỢC PHÊ DUYỆT 2026-07-27
- Tệp: thiết kế đã phê duyệt và FE10 SPEC/PLAN/TASKS/CHANGELOG.
- Tiêu chí hoàn thành: v0.4.5 ghi bản cập nhật cơ sở dữ liệu, bằng chứng ID nhà cung cấp an toàn,
  tiến trình SYSTEM, giới hạn F1 theo khả năng tốt nhất, quyền HTTP không đổi và
  thử lại thủ công.

### FE10-S13 Khôi phục mẫu thiết lập tài khoản cơ sở dữ liệu hiện có

- [x] Trạng thái: H2/CI/MÔI TRƯỜNG THỬ NGHIỆM - CHẠY LẠI AN TOÀN ĐÃ ĐẠT
- Phụ thuộc: FE10-S12.
- Tệp: `database/migrations/2026-07-27-fe10-account-setup-template.sql`,
  `backend/tests/notificationRepository.test.js`.
- Tiêu chí hoàn thành: bản cập nhật cơ sở dữ liệu có giao dịch, lũy đẳng, chỉ bổ sung, chuẩn và đạt
  hai lần thực thi với đúng một hàng `ACCOUNT_SETUP` hoạt động.
- Bằng chứng: bản cập nhật cơ sở dữ liệu dùng `XACT_ABORT`, một giao dịch, hành vi
  update-or-insert chuẩn, hoàn tác/rethrow và không xóa. Kiểm thử hợp đồng
  bản cập nhật cơ sở dữ liệu tĩnh xanh; hai lần thực thi môi trường thử nghiệm vẫn có cổng H2.
- Môi trường thử nghiệm: cả hai lần thực thi đều đạt và kết quả tổng hợp mẫu
  cuối là `1|1|1|1|1`; quy tắc tường lửa tạm thời cho đúng địa chỉ IP đã được
  gỡ bỏ.

### FE10-S14 Bảo toàn ID thông điệp nhà cung cấp nhạy cảm

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #65 ĐÃ HỢP NHẤT, CI SAU HỢP NHẤT ĐẠT
- Phụ thuộc: FE10-S12.
- Tệp: `backend/src/services/notificationService.js`,
  `backend/tests/notificationRoutes.test.js`.
- Tiêu chí hoàn thành: các lần thử thành công nhạy cảm FE02 và FE11 chỉ lưu ID
  thông điệp bộ điều hợp trong khi lưu vào cơ sở dữ liệu, kiểm toán, log và phản hồi vẫn không
  có thông tin xác thực.
- Bằng chứng: khẳng định kiểm thử thành công xác minh/đặt lại FE02 và thiết lập FE11 giữ
  ID thông điệp nhà cung cấp mô phỏng trong khi khẳng định kiểm thử cô lập nội dung nhạy
  cảm hiện có vẫn xanh.

### FE10-S15 Thêm tiến trình SYSTEM theo khả năng tốt nhất

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #65 ĐÃ HỢP NHẤT, CI SAU HỢP NHẤT ĐẠT
- Phụ thuộc: FE10-S12.
- Tệp: tầng dịch vụ/tiến trình xử lý nền/khi chạy/cấu hình/index thông báo, `.env.example` và kiểm
  thử tầng dịch vụ/tiến trình xử lý nền/khi chạy/cấu hình tập trung.
- Tiêu chí hoàn thành: lượt chạy khi khởi động và theo khoảng thời gian khi bật
  không chồng lấp; chế độ tắt không có bộ hẹn giờ; lỗi an toàn phục hồi; dừng xóa
  lịch; chỉ hàng `PENDING` không nhạy cảm được xử lý; quyền HTTP thủ công không
  đổi.
- Bằng chứng: kiểm thử tiến trình xử lý nền/cấu hình/khi chạy bao phủ chế độ tắt, công việc lúc
  khởi động và theo khoảng, chặn chồng lấp, phục hồi an toàn, tắt và hành vi
  nạp mô-đun. Kiểm toán SYSTEM ghi công việc thực nhưng không tạo hàng kiểm toán
  thăm dò định kỳ rỗng; kiểm thử HTTP được bảo vệ hiện có vẫn xanh.
- Phụ lục môi trường thử nghiệm: lần triển khai tiến trình xử lý nền đầu tiên
  phát hiện lỗi SQL Server 650 vì `READPAST` được kết hợp với `HOLDLOCK` ở mức
  cô lập tuần tự. Tiến trình xử lý nền được tắt lại. Bản sửa thay `HOLDLOCK`
  bằng `READCOMMITTEDLOCK`; phép thử có hoàn tác trên Azure SQL và kiểm thử cục
  bộ đều đạt.
- Sau khi sửa trên môi trường thử nghiệm, CI đúng commit `30274110435` và lượt
  triển khai `30274367534` đều đạt. Khi bật lại tiến trình xử lý nền, hàng đợi
  có 0 bản ghi đang chờ/đang xử lý, 15 bản ghi đã gửi và 0 bản ghi thất bại; cả
  15 lần thử đều giữ ID thông điệp của nhà cung cấp.

### FE10-S16 Vượt xác thực H2 cục bộ và môi trường thử nghiệm

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #65 ĐÃ HỢP NHẤT, CI SAU HỢP NHẤT ĐẠT
- Phụ thuộc: FE10-S13..S15.
- Tệp: FE10 TASKS/CHANGELOG và
  `.sdd/reviews/staging-email-delivery-remediation-validation-2026-07-27.md`.
- Tiêu chí hoàn thành: cổng kiểm thử tập trung và đầy đủ đạt; bản cập nhật cơ sở dữ liệu đạt hai
  lần; rà soát phần thay đổi/bảo mật đạt; H2 phê duyệt commit; thiết lập/triển khai mẫu/
  tiến trình xử lý nền môi trường thử nghiệm và bằng chứng hàng đợi/lần thử nhà cung cấp an toàn được ghi
  không có bí mật hay PII.
- Bằng chứng: tập trung 165/165, backend 1079/1079, frontend 232/232, triển
  khai 9/9, tích hợp hệ thống 10/10, kiểm tra mã/bản dựng/trace, vệ sinh phần thay đổi và rà soát
  bí mật/log theo phạm vi đạt trên bản thay đổi H2 chưa commit.
- H2: người dùng phê duyệt toàn bộ bản thay đổi ngày 2026-07-27. Commit sản phẩm là
  `7920d4b`, `2134d44` và `ccb590c`; CI và bằng chứng môi trường thử nghiệm vẫn bắt buộc.
- Công bố ban đầu: commit PR #65 `8f39baa` đạt lượt CI `30272237192`; lượt triển khai
  `30272792025` đạt backend, frontend và kiểm tra nhanh. Bản cập nhật cơ sở dữ liệu đạt hai lần, tổng
  hợp mẫu là `1|1|1|1|1`.
- Xác minh tiến trình xử lý nền môi trường thử nghiệm phát hiện 15 hàng không nhạy cảm vẫn đang chờ và lỗi
  tiến trình xử lý nền mã cố định. Lỗi 650 được tái hiện không thay đổi dữ liệu và thiết lập
  tiến trình xử lý nền trả về `false`; mốc kiểm tra thất bại ban đầu này được thay thế bởi xác
  thực đã sửa bên dưới.
- Phụ lục H2: người dùng phê duyệt sửa nhận hàng tương thích Azure ngày
  2026-07-27; commit sản phẩm là `a98f459`.
- Xác thực đã sửa: CI `30274110435` và triển khai `30274367534` đạt cho commit
  `9240525`; API/frontend là 200, xử lý thủ công ẩn danh là 401, tổng hợp hàng
  đợi là `0|0|15|0`, tổng hợp lần thử/nhà cung cấp là `15|15`, tổng hợp nhạy
  cảm/không an toàn là `21|0`, tổng hợp kiểm toán SYSTEM/không thao tác là `1|0` và
  quy tắc firewall còn lại do nhiệm vụ tạo là 0.
- Tích hợp: sau phê duyệt H3 rõ ràng, PR #65 hợp nhất thành `01807f0`; CI `main`
  hậu hợp nhất chính xác `30275341156` đạt. Triển khai Azure FE10 sau đó
  `30307855616` đạt với mốc chuẩn v0.4.5 này vẫn hoạt động.

## 15. Nhiệm vụ hộp thư thông báo cá nhân v0.5.0

Các bước chi tiết, lệnh trước và sau khi sửa và ranh giới commit nằm trong
`docs/superpowers/plans/2026-07-27-fe10-personal-notification-inbox.md`.

### FE10-I01 Thêm bản cập nhật cơ sở dữ liệu trạng thái đọc chỉ bổ sung

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #75 ĐÃ HỢP NHẤT, CI/AZURE SAU HỢP NHẤT
  ĐẠT
- Ánh xạ tới: BR-FE10-016, BR-FE10-019, BR-FE10-020; AC-FE10-011 đến
  AC-FE10-014.
- Tệp: SQL chuẩn, mô hình Thông báo, bản cập nhật cơ sở dữ liệu lũy đẳng mới, kiểm thử hợp đồng
  bản cập nhật cơ sở dữ liệu.
- Tiêu chí hoàn thành: `ReadAt DATETIME2 NULL`, bản ghi lịch sử đủ điều kiện được
  cập nhật thành `CreatedAt`, chỉ mục hỗ trợ tồn tại, bản ghi nhạy cảm/không người
  dùng bị loại và hai lần thực thi tạo cùng điều kiện hậu.

### FE10-I02 Thêm tầng truy cập dữ liệu bản ghi của chính mình và dữ liệu hiển thị an toàn

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #75 ĐÃ HỢP NHẤT, CI/AZURE SAU HỢP NHẤT
  ĐẠT
- Phụ thuộc: FE10-I01.
- Ánh xạ tới: BR-FE10-014 đến BR-FE10-017, BR-FE10-020; AC-FE10-011 đến
  AC-FE10-015.
- Tệp: tầng truy cập dữ liệu thông báo, tiện ích tạo dữ liệu hiển thị/thao tác hộp thư, tầng truy cập dữ liệu
  trong bộ nhớ, kiểm thử tầng truy cập dữ liệu/đơn vị tập trung.
- Tiêu chí hoàn thành: SQL liệt kê/đếm/đọc lọc theo `UserId` hiện tại và danh
  sách cho phép đủ điều kiện chính xác trước khi hiện thực hóa; phân trang phía
  SQL; thay đổi đọc có khả năng xử lý lặp an toàn và không thay đổi trạng thái gửi; DTO/đường
  dẫn thao tác cố định, không có siêu dữ liệu nhạy cảm hoặc dữ liệu nội bộ về quá trình gửi.

### FE10-I03 Công khai API hộp thư cá nhân đã xác thực

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #75 ĐÃ HỢP NHẤT, CI/AZURE SAU HỢP NHẤT
  ĐẠT
- Phụ thuộc: FE10-I02.
- Ánh xạ tới: FR-FE10-011 đến FR-FE10-015; AC-FE10-011 đến AC-FE10-015.
- Tệp: validator thông báo, tầng dịch vụ, bộ điều khiển, tuyến API, OpenAPI, kiểm thử tuyến API.
- Tiêu chí hoàn thành: tuyến API liệt kê, đếm chưa đọc, đánh dấu một và đánh dấu tất
  cả chấp nhận cả ba vai trò đăng nhập, từ chối người chưa xác thực/vai trò
  không hỗ trợ, kiểm tra bộ lọc, trả DTO an toàn và làm ID không tồn tại/nhạy
  cảm/của người dùng khác thành `404` không thể phân biệt.

### FE10-I04 Thêm phía máy khách frontend và context hộp thư dùng chung

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #75 ĐÃ HỢP NHẤT, CI/AZURE SAU HỢP NHẤT
  ĐẠT
- Phụ thuộc: FE10-I03.
- Ánh xạ tới: FR-FE10-016; AC-FE10-012, AC-FE10-013, AC-FE10-016.
- Tệp: API frontend dùng chung, ánh xạ lỗi, view mô hình/context thông báo, nối
  nhà cung cấp App, kiểm thử frontend.
- Tiêu chí hoàn thành: số lượng chỉ tải cho phiên đã xác thực, làm mới khi nhận
  tiêu điểm, thay đổi thành công và khoảng 60 giây không chồng lấp; lỗi đọc khi
  nhấp phát cảnh báo an toàn trong khi điều hướng trong danh sách cho phép vẫn
  tiếp tục.

### FE10-I05 Thêm chuông và xem trước khung ứng dụng đã xác thực

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #75 ĐÃ HỢP NHẤT, CI/AZURE SAU HỢP NHẤT
  ĐẠT
- Phụ thuộc: FE10-I04.
- Ánh xạ tới: FR-FE10-015, FR-FE10-016; AC-FE10-015, AC-FE10-016.
- Tệp: Tiêu đề cột, thành phần chuông thông báo, kiểu app-khung ứng dụng, kiểm thử frontend.
- Tiêu chí hoàn thành: mọi vai trò đã xác thực thấy chuông, huy hiệu chưa đọc
  giới hạn `99+`, popover tải tối đa năm mục chưa đọc mới nhất với trạng thái
  tải/trống/lỗi rõ ràng và `Xem tất cả` mở `/notifications`.

### FE10-I06 Thêm trang thông báo cá nhân

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #75 ĐÃ HỢP NHẤT, CI/AZURE SAU HỢP NHẤT
  ĐẠT
- Phụ thuộc: FE10-I04.
- Ánh xạ tới: FR-FE10-011, FR-FE10-013, FR-FE10-014, FR-FE10-016;
  AC-FE10-011, AC-FE10-013, AC-FE10-014, AC-FE10-016.
- Tệp: bảo vệ tuyến API đã xác thực, tuyến API App, trang thông báo, kiểu app-khung ứng dụng,
  kiểm thử frontend.
- Tiêu chí hoàn thành: bộ lọc tất cả/chưa đọc/đã đọc, phân trang 20 mục, trạng
  thái tải/trống/lỗi/đã đọc, đánh dấu tất cả và thao tác mục khớp API; không có
  điều khiển xóa/lưu trữ/nhật ký toàn cục.

### FE10-I07 Chứng minh hành vi liên tính năng và trình duyệt

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #75 ĐÃ HỢP NHẤT, CI/AZURE SAU HỢP NHẤT
  ĐẠT
- Phụ thuộc: FE10-I03, FE10-I05, FE10-I06.
- Ánh xạ tới: AC-FE10-011 đến AC-FE10-016.
- Tệp: kiểm thử tích hợp FE04/FE07/FE08, E2E Playwright FE10, bộ kiểm thử hỗ trợ
  kiểm thử, TEST_PLAN FE10.
- Tiêu chí hoàn thành: một sự kiện nguồn tạo một bản ghi được hỗ trợ bởi email
  có thể thấy cho chủ sở hữu; hàng nhạy cảm và khác người dùng không bao giờ
  xuất hiện; luồng trình duyệt MEMBER/LIBRARIAN/ADMIN đạt, gồm lỗi đọc không
  chặn.

### FE10-I08 Vượt cổng H2, môi trường thử nghiệm Azure, H3 và hợp nhất

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #75 ĐÃ HỢP NHẤT, CI/AZURE SAU HỢP NHẤT
  ĐẠT
- Phụ thuộc: FE10-I01..I07.
- Ánh xạ tới: toàn bộ mục BR/FR/AC v0.5.0.
- Tệp: OpenAPI, bản đồ kiến trúc/tích hợp, hướng dẫn người dùng, hướng dẫn/
  kiểm thử quy trình môi trường thử nghiệm Azure, PLAN/TASKS/CHANGELOG FE10, bằng chứng rà soát.
- Tiêu chí hoàn thành: cổng backend/frontend tập trung/đầy đủ, kiểm tra mã/bản dựng,
  triển khai/hệ thống, truy vết, quét bảo mật/bí mật/phần thay đổi, bản cập nhật cơ sở dữ liệu hai
  lượt và kiểm thử E2E trên trình duyệt đạt; H2 phê duyệt bản thay đổi; kiểm tra trước mã băm bản cập nhật cơ sở dữ liệu
  chính xác, backend, frontend, môi trường thử nghiệm kiểm tra nhanh và kiểm tra trình duyệt đạt; H3
  phê duyệt commit chính xác trước hợp nhất; CI hậu hợp nhất và môi trường thử nghiệm tự động được
  theo dõi.
- Bằng chứng sau chênh lệch qua `main@f3ebe95`: bao phủ backend đạt 69/69 bộ và
  1114/1114 kiểm thử; frontend đạt 258/258 cùng kiểm tra mã/bản dựng; triển khai đạt
  15/15; hệ thống đạt 10/10; trạng thái truy vết đạt 3/3 và bao phủ thực thi
  FE10 là 14/16 (88%); Chromium đạt 11/11; bản cập nhật cơ sở dữ liệu chính xác đạt hai lần với
  tổng hợp được bảo vệ không đổi và cơ sở dữ liệu dùng một lần đã xóa. Kiểm toán
  backend không phát hiện lỗ hổng; cổng kiểm toán frontend tầng truy cập dữ liệu chỉ chấp
  nhận cảnh báo React Router RSC không ổn định không áp dụng cho bản dựng
  `BrowserRouter` khai báo.
- TDD rà soát bảo mật cuối phát hiện bộ chọn SQL `listPending` không dùng không
  loại trừ rõ `ACCOUNT_SETUP` nhạy cảm dù tiến trình xử lý nền hoạt động và bộ chọn trong bộ
  nhớ đã làm vậy. Hồi quy tầng truy cập dữ liệu kiểm thử trước khi sửa tái hiện không khớp; cả hai bộ chọn
  đang chờ SQL hiện chia sẻ loại trừ đầy đủ bốn loại, Kiểm thử tập trung sau khi sửa đạt 161/161
  trước khi chạy lại toàn bộ backend.
- H2 phê duyệt mã băm nội dung `2b53d7e`; commit `b11b59e` và CI PR của nó đạt.
  môi trường thử nghiệm Azure đã bản cập nhật cơ sở dữ liệu từ không có lên một cột `ReadAt` và chỉ mục hỗ trợ;
  17 bản ghi lịch sử đủ điều kiện đã được cập nhật, 25 bản ghi bị loại vẫn chưa đọc, một
  probe sau lượt một vẫn chưa đọc sau lượt hai, tổng hợp được bảo vệ không đổi
  và dọn dẹp probe/firewall đạt.
- Lượt triển khai thủ công `30305596861` chặn an toàn khi kiểm tra không đạt trước triển khai vì Windows áp
  dụng byte bản cập nhật cơ sở dữ liệu CRLF (`6e8b6b4...`) trong khi runner Linux băm checkout
  LF tương đương (`143cd8e...`). Bao phủ chính sách triển khai trước và sau khi sửa hiện
  chỉ cho phép đúng bản dựng LF/CRLF của nội dung UTF-8 không đổi đó.
- Phụ lục hash được H2 phê duyệt với mã băm nội dung `f78e0cc9...` và công bố trên
  commit PR chính xác `28c4f80`; CI `30306805399` và môi trường thử nghiệm Azure triển khai
  `30307855616` đạt mọi job. Kiểm tra API/trình duyệt trực tiếp bao phủ cả ba
  vai trò, cô lập bản ghi của chính mình, loại trừ dữ liệu nhạy cảm, gọi lại thao tác đọc, điều
  hướng an toàn, HTTPS/CORS và dọn dẹp probe/firewall Azure.
- H3 vòng một phát hiện thiếu đối soát ADR/trạng thái hiện tại, trạng thái mục
  lỗi thời sau một lần đọc thành công không điều hướng, đánh dấu tất cả bị vô
  hiệu sai bởi trang đã lọc hiện tại và lỗi xếp chồng popover được trình duyệt
  báo cáo. Các sửa TDD/tài liệu có giới hạn đóng các phát hiện triển khai đó.
- H1 phê duyệt chênh lệch không chồng lấp sau qua `main@12faead`. Commit đến
  chỉ xóa tệp kết quả `document/` đã ngừng dùng; nhánh được cập nhật không xung đột.
  môi trường thử nghiệm Azure hiện tại phục vụ `main` đó, vì vậy biện pháp khắc phục phải được
  công bố và triển khai lại tại commit chính xác mới.
- Bằng chứng cục bộ sau cập nhật nhánh mới đạt: backend 69/69 bộ và 1116/1116 kiểm thử;
  frontend 259/259 cùng kiểm tra mã/bản dựng; triển khai 20/20; hệ thống 10/10; trạng thái
  truy vết 3/3 và FE10 14/16 (88%); Chromium 11/11; kiểm toán, chuẩn bị
  cấu trúc cơ sở dữ liệu Azure, vệ sinh phần thay đổi và quét mâu thuẫn.
- H2 vòng 3 đã được phê duyệt nhưng bị thay thế trước khi dùng bởi
  `main@a240705`. Người dùng phê duyệt phụ lục chênh lệch H1 thứ tư; việc
  phần triển khai trước loại chỉnh sửa FE11 Admin, CI main chính xác `30311801599`, triển
  khai Azure `30311973740`; nhánh cũng đã được cập nhật thành công, không có xung đột.
  Ma trận đầy
  đủ và H2 mới vẫn bắt buộc.
- Ma trận mới trên `main@a240705` đạt: backend 69/69 bộ và 1084/1084 kiểm thử;
  frontend 259/259 cùng kiểm tra mã/bản dựng; triển khai 20/20; hệ thống 10/10; trạng thái
  truy vết 3/3 và FE10 14/16 (88%); Chromium 11/11; kiểm toán, chuẩn bị
  cấu trúc cơ sở dữ liệu Azure và vệ sinh phần thay đổi.
- H2 vòng 4 phê duyệt mã băm nội dung `f41dbf50...`; biện pháp khắc phục được commit
  và push dưới commit PR #75 `3f9f23a`. CI đúng commit `30313721511`, Azure triển khai
  `30313949983`, kiểm tra transport công khai/tuyến API được bảo vệ, xác minh cấu trúc cơ sở dữ liệu/
  chỉ mục Azure SQL và dọn dẹp đều đạt. H3 lặp lại, phê duyệt H3 rõ ràng, hợp nhất
  và CI/triển khai hậu hợp nhất là bắt buộc tại mốc kiểm tra lịch sử đó.
- Tích hợp cuối: H2 phê duyệt mã băm nội dung
  `e123345be05b59a9e519d182b301ab5464160e8fc32aed8d17d3c463e28e0a15`;
  commit PR #75 `778e0a470d8a1083bf571a8007b3c058eee4bb22` đạt CI
  `30317424995` và môi trường thử nghiệm Azure `30317621429`, sau đó H3 hai trục sạch và phê
  duyệt rõ ràng. PR #75 hợp nhất thành
  `b75776b10d6cf4b6868d2ba51eb3268073483b8b`; CI hậu hợp nhất chính xác
  `30341279111` và môi trường thử nghiệm Azure tự động `30341540847` đã đạt.

### Truy vết v0.5.0

| Tiêu chí chấp nhận | Phạm vi triển khai đã lên kế hoạch |
| --- | --- |
| AC-FE10-011 | FE10-I01, FE10-I02, FE10-I03, FE10-I06, FE10-I07, FE10-I08 |
| AC-FE10-012 | FE10-I01, FE10-I02, FE10-I03, FE10-I04, FE10-I07, FE10-I08 |
| AC-FE10-013 | FE10-I01, FE10-I02, FE10-I03, FE10-I04, FE10-I06, FE10-I07, FE10-I08 |
| AC-FE10-014 | FE10-I01, FE10-I02, FE10-I03, FE10-I06, FE10-I07, FE10-I08 |
| AC-FE10-015 | FE10-I02, FE10-I03, FE10-I05, FE10-I07, FE10-I08 |
| AC-FE10-016 | FE10-I04, FE10-I05, FE10-I06, FE10-I07, FE10-I08 |

## Đợt FE07-FE12 v0.6.0

- [x] **FE10-I09 - Quy định cặp mẫu/nguồn và quyền sở hữu FE07, kèm kiểm thử tái hiện lỗi trước khi sửa.**
  - Ánh xạ: BR-FE10-021/023, FR-FE10-017, AC-FE10-017/020.
- [x] **FE10-I10 - Lưu dữ liệu không trùng khi xử lý lặp, gửi lại cùng yêu cầu và chỉ bổ sung dữ liệu mẫu.**
  - Ánh xạ: FR-FE10-018, AC-FE10-018.
- [x] **FE10-I11 - Hộp thư điều kiện hiển thị và đường dẫn cố định đến lịch sử mượn.**
  - Ánh xạ: BR-FE10-022, FR-FE10-019/020, AC-FE10-019.
- [x] **FE10-I12 - Tích hợp, quét dữ liệu nhạy cảm và bằng chứng trên giao diện máy tính.**
  - Ánh xạ: `SL-002`, `SL-006`, `AT-002/003/006/009/012`.
  - Bằng chứng H2 cục bộ: 4 bộ FE10/175 kiểm thử; bản cập nhật cơ sở dữ liệu an
    toàn khi chạy lại; tích hợp hệ thống đạt 11/11; kiểm thử liên hoàn Chromium
    đạt 1/1, chứng minh bốn thông báo không trùng, đường dẫn thao tác cố định và
    không lộ lý do từ chối.
- [x] **FE10-I13 - Sửa dữ liệu Unicode staging và ngăn migration FE10 tái diễn lỗi encoding.**
  - Trạng thái: HOÀN TẤT - H3/PR/CI/STAGING/UNICODE VERIFICATION ĐẠT.
  - Ánh xạ tới: BR-FE10-010/014/015/018, FR-FE10-017/019,
    AC-FE10-017/019.
  - Tệp: migration repair FE10, workflow/runbook staging, kiểm thử migration/deployment,
    TASKS/CHANGELOG FE10.
  - Tiêu chí hoàn thành: bốn template và notification history FE07 được lưu đúng Unicode;
    migration chạy hai lần an toàn; mọi lệnh `sqlcmd` dùng UTF-8 code page 65001; Books 34-40
    và BookCopies 60-64 staging được sửa bằng exact preimage guards; SQL/API/browser checks đạt;
    temporary firewall rule đã được xóa.
  - Bằng chứng tích hợp: PR #104 hợp nhất thành `d5464c06eb4ee5f804bd4ca97b49869179aa42ab`;
    PR #105 bổ sung `SET QUOTED_IDENTIFIER ON` và hợp nhất thành
    `827e877c792718bbaa6c9841fe66e13009213008`; CI hậu hợp nhất `30775755119` đạt đúng SHA này.
  - Bằng chứng staging: migration SHA-256
    `a9b3f5c02500a634a7ea0d4fd5775d22c0045d8b9fc0df40fb80fb8d01aa040f` chạy thành công
    hai lần với `sqlcmd -b -f 65001`; deployment thủ công `30776148777` đạt preflight, backend,
    frontend và smoke test trên đúng `main@827e877`.
  - Bằng chứng dữ liệu: repair có tham số sửa 7 Books, 5 BookCopies, 4 template và 17 notification;
    lần chạy lũy đẳng tiếp theo không sửa thêm dòng nào. API xác nhận mô tả Books 34-40 khớp chính
    xác; SQL hash xác nhận BookCopies 60-64 và bốn template `ACTIVE`; 17 notification FE07 không
    null, không còn bảy pattern mojibake của migration hoặc ký tự box-drawing.
  - Bằng chứng browser: catalog công khai và `/borrowing/new` hiển thị đủ bảy sách, không mojibake
    hoặc tràn ngang tại 1440x900 và 390x844. Inbox Member hiện tại có hai thông báo; notification
    gia hạn FE07 hiển thị đúng Unicode ở cả hai viewport. Tài khoản này không có notification
    approved/returned, nên bằng chứng cho các loại đó được giới hạn ở migration assertion và SQL,
    không mở rộng thành tuyên bố browser chưa quan sát.
  - Dọn dẹp: các firewall rule tạm và script repair tạm đều không còn; secret process variables đã
    được xóa; worktree chỉ có đúng hai tệp bằng chứng closeout đang chờ H2 và checkout gốc đang
    dirty được giữ nguyên.
  - Thiết kế: `docs/superpowers/specs/2026-08-03-staging-unicode-data-repair-design.md`.
  - Kế hoạch: `docs/superpowers/plans/2026-08-03-staging-unicode-data-repair.md`.

Không thêm bảng/kênh; phần thay đổi của sản phẩm vẫn giữ chưa được commit tới khi H2 phê duyệt.
