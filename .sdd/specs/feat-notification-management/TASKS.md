# TASKS.md - FE10 Quản lý thông báo

Trạng thái: ĐÃ MERGE VÀO MAIN; CI HẬU MERGE ĐẠT; AZURE STAGING BỊ CHẶN DO AZURE SQL PAUSED/QUOTA
Implementation State: PARTIAL
Cổng giao hàng: V0.6.0 ĐÃ KÍCH HOẠT, H3 PHÊ DUYỆT VÀ TÍCH HỢP

Chi tiết v0.5.0 hiện tại: FE10-I01..I08, biện pháp khắc phục hash migration và
biện pháp khắc phục H3 vòng một có giới hạn đã hoàn tất. Fingerprint được H2
phê duyệt sau `main@30f936d` là
`e123345be05b59a9e519d182b301ab5464160e8fc32aed8d17d3c463e28e0a15`.
Head PR #75 `778e0a470d8a1083bf571a8007b3c058eee4bb22` đạt CI
`30317424995` và Azure staging `30317621429`, nhận H3 hai trục sạch và phê
duyệt rõ ràng, rồi merge thành `b75776b10d6cf4b6868d2ba51eb3268073483b8b`.
CI hậu merge `30341279111` và Azure staging tự động `30341540847` đã đạt.

Trạng thái triển khai v0.4.5 trước đó: HOÀN TẤT

Chủ sở hữu: Nhat

Cập nhật: 2026-07-29

Trạng thái quy trình hiện tại: baseline Giai đoạn 2/G1-G12, hộp thư v0.5.0
qua PR #75 và template kết quả FE07 v0.6.0 đều đã hoàn tất. Batch v0.6.0 được
H3 phê duyệt ở head `08e472f` và tích hợp vào `main` qua `ba29dc0`; CI hậu
merge đã đạt. Azure staging hiện bị chặn vì Azure SQL đang `Paused`/hết quota,
không phải finding FE10.

---

## 1. Nhiệm vụ backend

- [x] FE10-T01 Thêm route yêu cầu thông báo và process-pending.
- [x] FE10-T02 Thêm validator phía máy chủ cho loại, kênh, người nhận, khóa
  mẫu, tham chiếu nguồn, tính lũy đẳng và giới hạn xử lý.
- [x] FE10-T03 Thêm xác thực yêu cầu thông báo ở service.
- [x] FE10-T04 Thêm tra cứu mẫu và kết xuất biến.
- [x] FE10-T05 Thêm che dữ liệu payload mã thông báo/liên kết/mật khẩu nhạy cảm.
- [x] FE10-T06 Thêm xử lý lũy đẳng cho thông báo hoạt động trùng.
- [x] FE10-T07 Thêm xử lý pending bằng nhà cung cấp mô phỏng.
- [x] FE10-T08 Ghi lần gửi thành công và thất bại.
- [x] FE10-T09 Bảo vệ API thông báo khỏi người gọi công khai/thành viên.
- [x] FE10-T10 Căn chỉnh script SQL với trường, trạng thái, chỉ mục lũy đẳng và
  mẫu bắt buộc FE10.

## 2. Nhiệm vụ kiểm thử

- [x] FE10-T11 Thêm helper repository thông báo trong bộ nhớ.
- [x] FE10-T12 Kiểm thử tạo yêu cầu xác minh tài khoản.
- [x] FE10-T13 Kiểm thử xử lý khóa lũy đẳng trùng.
- [x] FE10-T14 Kiểm thử lỗi thiếu biến mẫu.
- [x] FE10-T15 Kiểm thử che dữ liệu payload đặt lại mật khẩu.
- [x] FE10-T16 Kiểm thử thành công process-pending và ghi log lần thử thất bại
  an toàn.
- [x] FE10-T17 Kiểm thử truy cập API được bảo vệ.

## 3. Xác thực

- [x] `npm test` trong `backend`.

## 4. Traceability

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

## 5. Vẫn ngoài lát cắt v0.4.5 lịch sử

- Tích hợp SMTP/nhà cung cấp thực.
- Màn hình thông báo trong ứng dụng.
- Giao diện quản lý thử lại.

v0.5.0 đã được phê duyệt chuyển hạng mục hộp thư cá nhân/trạng thái đã đọc vào
lát cắt FE10-I01..I08 mới bên dưới. Danh sách kiểm tra lịch sử này không tuyên
bố phần triển khai mới đã hoàn tất.

## 6. Nhiệm vụ củng cố FE10 - phân rã B4

Trạng thái B4: HOÀN TẤT. Trạng thái triển khai B5: HOÀN TẤT. Trạng thái xác thực
B6: HOÀN TẤT. Trạng thái tích hợp B7: HOÀN TẤT.

Các nhiệm vụ FE10-T01 đến FE10-T17 đã hoàn tất ở trên vẫn là bằng chứng lịch sử
cho lát cắt backend ban đầu. Các nhiệm vụ củng cố bên dưới triển khai hợp đồng
G1-G7 đã được phê duyệt dưới dạng các lát cắt dọc theo thứ tự. Mọi nhiệm vụ
triển khai sở hữu kiểm thử tập trung trong cùng lát cắt.

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
  hóa, DTO tối thiểu, `sourceEntityId` chỉ số nguyên, trình yêu cầu ràng buộc,
  thử lại thủ công được bảo vệ, lũy đẳng mọi trạng thái, trì hoãn FE02 và trì
  hoãn triển khai FE09; traceability và danh sách kiểm tra review được cập
  nhật; `CHANGELOG.md` ghi sửa đổi đã phê duyệt ngày 2026-07-13; không có thay
  đổi tệp triển khai.
- Xác minh: quét mâu thuẫn với G1-G7 và phần BR/FR/AC/API/NFR hiện có; xác nhận
  mọi nhiệm vụ củng cố sau này ánh xạ tới ID ổn định đã sửa.

### FE10-H02 Thực thi mẫu chuẩn và an toàn payload đã xếp hàng

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
  từ chối không khớp; SQL và fixture kiểm thử dùng `{{otp}}` và
  `{{expiresInMinutes}}`; `templateData` không nhạy cảm đã xếp hàng duyệt đệ
  quy đối tượng/mảng, chuẩn hóa chữ hoa/thường và dấu phân cách của khóa, từ
  chối `token`/`otp`/`password`/`verificationlink`/`resetlink`, đồng thời áp
  dụng cùng phép duyệt với `safePayload`; tham chiếu nguồn số nguyên được đặc
  tả cho nhiệm vụ ranh giới sau; không thêm bí danh `EMAIL_VERIFY` hoặc
  `DUE_OR_FINE_NOTICE`.
- Xác minh: kiểm thử route tập trung bao phủ mọi cặp chuẩn, từ chối không khớp,
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
- Tiêu chí hoàn thành: `ACCOUNT_VERIFICATION` và `PASSWORD_RESET` chỉ kết xuất
  `otp` và `expiresInMinutes` từ dữ liệu yêu cầu thô trong bộ nhớ và gửi đồng
  bộ qua bộ điều hợp nhà cung cấp đã cấu hình; thành công lưu `SENT` cùng lần
  thử, thất bại lưu `FAILED` cùng lý do an toàn; thông báo, lần thử, kiểm toán,
  log và dữ liệu HTTP đã lưu không chứa OTP thô hoặc tiêu đề/nội dung nhạy cảm
  đã kết xuất; bản ghi không nhạy cảm vẫn được xếp hàng và `process-pending`
  loại trừ loại nhạy cảm.
- Xác minh: kiểm thử tập trung chứng minh cả đường thành công/thất bại nhạy
  cảm, kết xuất liên kết chỉ qua nhà cung cấp, lưu bền đã che dữ liệu, lần thử
  an toàn, không rò rỉ API/kiểm toán/log và xử lý hàng đợi không nhạy cảm không
  đổi; chạy tệp kiểm thử FE10 tập trung.

### FE10-H04 Chứa phản hồi HTTP và căn chỉnh bề mặt hợp đồng

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
  phát lại lũy đẳng trả `200` cùng hình dạng; xử lý trả
  `200 { processed, failed }`; không đối tượng thông báo đầy đủ, mảng, nội dung
  hoặc `safePayload` nào vượt HTTP; `sourceEntityId` chỉ nhận số nguyên; OpenAPI
  và assertion tích hợp ghi nhận phản hồi tạo/phát lại/xử lý đã phê duyệt cùng
  hình dạng lỗi xác thực an toàn. Tài liệu thử lại vẫn do FE10-H08 sở hữu cùng
  triển khai route của nó.
- Xác minh: kiểm thử route và tích hợp tập trung bao phủ mã trạng thái/khóa thân
  chính xác và từ chối ID nguồn chuỗi; OpenAPI không chứa schema phản hồi bản
  ghi đầy đủ lỗi thời.

### FE10-H05 Thêm trình yêu cầu nguồn nội bộ ràng buộc

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
- Xác minh: kiểm thử service cấp đơn vị/route bao phủ từ chối danh sách cho
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
  `notificationRepository.createNotification()` và dùng trình yêu cầu ràng
  buộc với `FE07`; siêu dữ liệu nguồn hạn trả/quá hạn đã phê duyệt và khóa
  chuẩn được giữ; lỗi thông báo được bắt an toàn và không bao giờ hoàn tác trạng
  thái mượn/trả; kiểm thử và triển khai thay đổi cùng nhau.
- Xác minh: kiểm thử mượn sách tập trung chứng minh sử dụng trình yêu cầu, ràng
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
  `notificationRepository.createNotification()` và dùng trình yêu cầu ràng
  buộc với `FE08`; siêu dữ liệu nguồn đặt chỗ sẵn sàng và khóa chuẩn được giữ;
  lỗi thông báo vẫn không chặn và không hoàn tác giữ chỗ; kiểm thử và triển khai
  thay đổi cùng nhau.
- Xác minh: kiểm thử đặt chỗ tập trung chứng minh sử dụng trình yêu cầu, ràng
  buộc nguồn, hình dạng yêu cầu chuẩn và giữ chỗ được bảo toàn khi thông báo thất
  bại; chạy `npm test -- reservationRoutes.test.js` trong `backend`.

### FE10-H08 Thực thi lũy đẳng mọi trạng thái và thử lại thủ công

- [x] Trạng thái: HOÀN TẤT (`5c0c0dd`, `cad91ba`, `7c88223`)
- Ước lượng: 3-4 giờ
- Phụ thuộc: FE10-H04, FE10-H05; chỉ có thể bắt đầu sau khi diff tích hợp
  FE10-H06 và FE10-H07 ổn định vì tệp service và kiểm thử FE10 dùng chung được
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
- Tiêu chí hoàn thành: tra cứu lũy đẳng phát lại một bản ghi xuyên suốt mọi trạng
  thái và giữ khóa duy nhất mọi trạng thái; `POST /api/notifications/{id}/retry`
  được bảo vệ chỉ cho phép thông báo đã xếp hàng không nhạy cảm thất bại dùng lại
  cùng bản ghi/khóa/lịch sử lần thử và trả `200 { notificationId, status }`;
  trạng thái không hợp lệ trả `409` an toàn; thử lại xác thực nhạy cảm trả
  `409 REISSUE_REQUIRED` an toàn không có chi tiết nhà cung cấp hay bí mật;
  OpenAPI và assertion tích hợp ghi nhận route thử lại đã triển khai cùng thân
  `200`/`409` chính xác.
- Xác minh: kiểm thử tập trung và tích hợp bao phủ phát lại cho `PENDING`,
  `SENT`, `FAILED`, chuyển đổi thử lại/bảo toàn lịch sử, truy cập không được
  ủy quyền, xung đột trạng thái, cả hai ca phát hành lại nhạy cảm và tính đồng
  nhất phản hồi được ghi; chạy tệp kiểm thử FE10 và tích hợp tập trung.

### FE10-H09 Vượt cổng xác thực B6

- [x] Trạng thái: HOÀN TẤT
- Ước lượng: 2-4 giờ
- Phụ thuộc: FE10-H01 đến FE10-H08 hoàn tất và được review độc lập.
- Ánh xạ tới: G1-G7 và toàn bộ hàng traceability BR/FR/AC/API/NFR FE10 đã sửa.
- Tệp chính xác: `.sdd/specs/feat-notification-management/TASKS.md`,
  `.sdd/specs/feat-notification-management/CHANGELOG.md`; không có tệp triển
  khai được lên kế hoạch.
- Tiêu chí hoàn thành: kiểm thử tập trung FE10, FE07 và FE08 đạt; toàn bộ bộ
  backend đạt; traceability từ SPEC đến nhiệm vụ đến kiểm thử đầy đủ; không bí
  mật/liên kết/mã thông báo nào bị lộ qua fixture, log, assertion lưu bền hoặc
  phản hồi; diff không chứa frontend, triển khai FE02, triển khai FE09, nhà
  cung cấp thực, dependency, hết hạn hoặc thay đổi tái cấu trúc không liên quan;
  review độc lập không báo finding chặn.
- Xác minh: chạy kiểm thử tập trung, `npm test` trong `backend`,
  `git diff --check`, quét placeholder, quét mâu thuẫn, quét bí mật và review
  phạm vi tệp đã đổi cuối; ghi lệnh và kết quả chính xác trước khi đánh dấu hoàn
  tất.

Bằng chứng xác thực ghi ngày 2026-07-13:

- `npm.cmd test -- notificationRoutes.test.js borrowingRoutes.test.js reservationRoutes.test.js integration.test.js`
  trong `backend`: ĐẠT, 4 bộ và 136 kiểm thử sau bản sửa review H09.
- `npm.cmd test` trong `backend`: ĐẠT, 15 bộ và 212 kiểm thử sau bản sửa review
  H09.
- `node scripts/check-traceability.js --enforce`: ĐẠT; FE10 bao phủ 9/9 yêu cầu
  chức năng (100%), không tính năng triển khai nào dưới cổng 70%.
- Quét độc lập đầu tiên phát hiện siêu dữ liệu nguồn HTTP không an toàn và văn
  bản thất bại do nhà cung cấp cung cấp. Commit `a04b64b` thêm xác thực
  theo kiểm thử trước và sửa lưu bền lỗi chung; lượt RED có 6 lỗi kỳ vọng, sau
  đó bộ FE10 tập trung đạt 96/96 kiểm thử.
- `git diff --check a613604..HEAD`: ĐẠT sau bản sửa review.
- Lệnh quét placeholder:
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
  cảm và chữ ký thông tin xác thực thực; ĐẠT với 0 log nhạy cảm thêm, 0 phản hồi
  nhạy cảm thêm và 0 chữ ký bí mật thực. Sentinel nhà cung cấp/kiểm thử tổng hợp
  chỉ xuất hiện trong đầu vào bộ nhớ nhà cung cấp và assertion âm.
- Lệnh phạm vi tệp thay đổi: `git diff --name-only a613604..HEAD`; ĐẠT với 0
  trường hợp phạm vi bị cấm: không frontend, triển khai FE02, triển khai FE09,
  nhà cung cấp thực, dependency, hết hạn hoặc tệp tái cấu trúc không liên quan.
- Review tập trung commit `a04b64b`: `Spec compliance: APPROVED`; `Code quality: APPROVED`.
- Review toàn nhánh cuối `a613604..eb82b1d`: APPROVED không finding; người
  review độc lập chạy lại toàn bộ backend (15 bộ, 212 kiểm thử), thực thi
  traceability và `git diff --check`.

## 7. Tích hợp B7 và kết thúc review

- [x] Nhat xác nhận cổng tích hợp con người và chọn merge cục bộ.
- [x] Commit `9185a9a91f41e444e0c4e6bd8c0605a281272ee9` đã vào `main` và
  `origin/main`.
- [x] Lượt CI GitHub Actions `29236572558` đạt cho cùng commit.
- [x] Độ phù hợp hệ thống, tính toàn vẹn kiến trúc, tác động tương lai và tài
  liệu đã được review mà không mở rộng phạm vi FE10.
- [x] Bằng chứng chi tiết được ghi trong
  `.sdd/reviews/fe10-b7-integration-review-closeout-2026-07-13.md`.

## 8. Traceability củng cố và công việc song song

| Cổng đã phê duyệt | Nhiệm vụ củng cố |
| --- | --- |
| G1 | FE10-H01, FE10-H02, FE10-H03, FE10-H09 |
| G2 | FE10-H01, FE10-H03, FE10-H04, FE10-H09 |
| G3 | FE10-H01, FE10-H05, FE10-H06, FE10-H07, FE10-H09 |
| G4 | FE10-H01, FE10-H02, FE10-H04, FE10-H09 |
| G5 | FE10-H01, FE10-H04, FE10-H08, FE10-H09 |
| G6 | FE10-H01, FE10-H08, FE10-H09 |
| G7 | FE10-H01, FE10-H02, FE10-H09 |

Cơ hội song song thận trọng: sau khi FE10-H05 hoàn tất và được review,
FE10-H06 và FE10-H07 có thể chạy song song vì chúng sở hữu service nguồn và tệp
kiểm thử tách biệt. Mọi nhiệm vụ khác vẫn theo thứ tự vì chúng chia sẻ hợp đồng
FE10, code service/repository, kiểm thử route hoặc bằng chứng xác thực.

Với tập củng cố G1-G7 đã hoàn tất, triển khai FE02 và tích hợp người gọi FE09
đã nằm ngoài phạm vi rõ ràng. ADR-004 và FE10-S01 đến FE10-S05 hiện thay thế
việc trì hoãn FE02; FE09 vẫn không có người gọi/tích hợp hiện tại để migration.

## 9. Nhiệm vụ theo dõi bảo mật OTP FE10

Các nhiệm vụ FE10-T và FE10-H đã hoàn tất ở trên vẫn là bằng chứng lịch sử.
ADR-004 và G8-G10 chỉ thay thế phần mẫu liên kết và trì hoãn FE02 cũ.

### FE10-S01 Chuẩn hóa hợp đồng liên tính năng

- [x] Trạng thái: TÀI LIỆU HOÀN TẤT - REVIEW CON NGƯỜI ĐƯỢC NHAT XÁC NHẬN
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

### FE10-S02 Thêm kiểm thử RED cho ranh giới và hợp đồng OTP

- [x] Trạng thái: KIỂM THỬ RED HOÀN TẤT
- Phụ thuộc: phê duyệt con người FE10-S01.
- Ánh xạ tới: BR-FE10-002 đến BR-FE10-005, BR-FE10-010, BR-FE10-011;
  FR-FE10-001, FR-FE10-002, FR-FE10-005, FR-FE10-009; AC-FE10-001,
  AC-FE10-002, AC-FE10-006.
- Tệp: `backend/tests/notificationRoutes.test.js`,
  `backend/tests/helpers/inMemoryNotificationRepositories.js`,
  `backend/tests/integration.test.js`.
- Tiêu chí hoàn thành: kiểm thử tập trung thất bại cho việc HTTP nhân viên gửi
  nhạy cảm, HTTP `sourceFeature`, dùng trình yêu cầu nhạy cảm không phải FE02,
  biến OTP thiếu/không hợp lệ và biến liên kết cũ; kiểm thử đặc tả yêu cầu OTP
  FE02 ràng buộc được chấp nhận cùng lỗi chính xác
  `403 SENSITIVE_NOTIFICATION_INTERNAL_ONLY` an toàn.

### FE10-S03 Triển khai quyền sở hữu nguồn nhạy cảm và gửi qua nhà cung cấp

- [x] Trạng thái: HOÀN TẤT - TRIỂN KHAI, SCHEMA BASELINE VÀ XÁC THỰC TỰ ĐỘNG
  GREEN
- Phụ thuộc: bằng chứng RED FE10-S02.
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
- Tiêu chí hoàn thành: chỉ trình yêu cầu ràng buộc FE02 chấp nhận loại nhạy cảm;
  HTTP không thể đặt `sourceFeature`; mẫu OTP yêu cầu
  `otp`/`expiresInMinutes`; bộ điều hợp nhà cung cấp đã cấu hình gửi nội dung
  đã kết xuất; lưu bền/kiểm toán/log/phản hồi không chứa OTP hoặc nội dung nhạy
  cảm đã kết xuất; siêu dữ liệu nguồn dùng `FE02`/`AuthToken`/ID mã thông báo.
- Bằng chứng: service, OpenAPI, baseline chuẩn và migration mẫu OTP lũy đẳng đã
  đồng bộ; migration đạt hai lần thực thi SQL Server dùng một lần và cổng tập
  trung FE02/FE10 hiện tại đạt.

### FE10-S04 Tích hợp FE02 không gửi trùng

- [x] Trạng thái: HOÀN TẤT - FE02 REQUESTER FAN-IN GREEN
- Phụ thuộc: FE10-S03; bằng chứng RED FE02-T030.
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
  dependency được chèn; `CHANGE_PASSWORD_OTP` và chấp nhận mã thông báo cũ vẫn
  giữ; lỗi FE10 không chặn và gửi lại tạo sự kiện/khóa mới.

### FE10-S05 Vượt xác thực liên tính năng và review con người

- [x] Trạng thái: HOÀN TẤT QUA B7
- Phụ thuộc: FE10-S02 đến FE10-S04; FE02-T030 đến FE02-T032.
- Ánh xạ tới: hợp đồng xác minh ADR-004 và mọi hàng traceability G8-G10.
- Tệp: `TASKS.md` và `CHANGELOG.md` FE10/FE02; tệp triển khai chỉ cho bản sửa
  review đã được phê duyệt.
- Tiêu chí hoàn thành: kiểm thử FE10/FE02 tập trung và tích hợp bị ảnh hưởng đạt;
  quét hợp đồng liên kết/trì hoãn cũ không có kết quả hoạt động; quét rò rỉ OTP
  đạt; traceability và `git diff --check` đạt; diff không chứa frontend, người
  gọi FE09, dependency mới, migration schema bảng/chỉ mục hoặc migration
  `CHANGE_PASSWORD_OTP`; review con người được ghi trước commit/merge.
- Bằng chứng: cổng FE02/FE10/tích hợp tập trung đạt 170/170; toàn bộ backend
  đạt 916/916 với bao phủ đã cấu hình; traceability là 10/10 cho FE10 và 26/26
  cho FE02; frontend 149/149, hệ thống 10/10, triển khai 7/7, browser E2E 4/4,
  OpenAPI/import, rò rỉ và kiểm tra diff đạt. Bằng chứng mở rộng bao phủ toàn
  bộ danh sách cho phép không phải FE02, lỗi ghi đè nguồn HTTP chính xác và xoay
  vòng sự kiện/khóa đặt lại mật khẩu lặp lại. Không cần sửa production. PR #42
  đã merge thành `34d9180`; PR CI `29688102867` và CI `main` hậu merge chính
  xác `29688222757` đã đạt.

## 10. Nhiệm vụ theo dõi thiết lập tài khoản FE11

### FE10-S06 Thêm kiểm thử RED cho ranh giới thiết lập tài khoản FE11

- [x] Trạng thái: HOÀN TẤT (`547f986`)
- Phụ thuộc: ADR-005 và phê duyệt con người FE11-S01.
- Ánh xạ tới: G11; FR-FE10-005, FR-FE10-009, FR-FE10-010; AC-FE10-006,
  AC-FE10-010.
- Tệp: `backend/tests/notificationRoutes.test.js`,
  `backend/tests/helpers/inMemoryNotificationRepositories.js`.
- Tiêu chí hoàn thành: kiểm thử thất bại cho HTTP nhân viên `ACCOUNT_SETUP`,
  dùng trình yêu cầu không phải FE11, `setupLink` hoặc `expiresInHours` thiếu/
  không hợp lệ, ghi đè nguồn, cặp chuẩn sai được dùng lại và rò rỉ thông tin xác
  thực qua lưu bền/phản hồi; yêu cầu FE11 được chấp nhận dùng ID mã thông báo
  `AuthToken` và khóa lũy đẳng chính xác.

### FE10-S07 Triển khai gửi thiết lập nhạy cảm do FE11 sở hữu

- [x] Trạng thái: HOÀN TẤT (`547f986`, `3e25875`)
- Phụ thuộc: bằng chứng RED FE10-S06 và ranh giới nhà cung cấp dùng chung
  FE10-S03.
- Ánh xạ tới: G11; BR-FE10-002, BR-FE10-004 đến BR-FE10-013; FR-FE10-010;
  AC-FE10-010.
- Tệp: service thông báo/validator/bộ điều hợp nhà cung cấp, ràng buộc mẫu/loại
  SQL, OpenAPI, kiểm thử tập trung.
- Tiêu chí hoàn thành: `FE11` thuộc danh sách cho phép mà không làm yếu quyền
  sở hữu FE02; chỉ FE11 gửi `ACCOUNT_SETUP`; nhà cung cấp nhận nội dung thiết
  lập đã kết xuất trong bộ nhớ; lưu bền/kiểm toán/log/phản hồi không chứa mã
  thông báo/liên kết/nội dung đã kết xuất; kết quả là bản tóm tắt
  `SENT`/`FAILED` tối thiểu.

### FE10-S08 Vượt review tích hợp thiết lập FE11

- [x] Trạng thái: HOÀN TẤT - REVIEW CON NGƯỜI ĐÃ XÁC NHẬN
- Phụ thuộc: FE10-S07, FE11-S04..S06, FE02-T035..T036.
- Ánh xạ tới: hợp đồng xác minh ADR-005.
- Tệp: tệp task/changelog FE10/FE11/FE02 và chỉ bản sửa review đã phê duyệt.
- Tiêu chí hoàn thành: kiểm thử tạo, thất bại, hoàn tất, gửi lại, quyền sở hữu,
  lũy đẳng và rò rỉ đạt; hành vi OTP không đổi; traceability, quét bí mật và
  `git diff --check` đạt; Nhat ghi review con người trước commit/merge.
- Trạng thái xác thực: ĐẠT ngày 2026-07-15 với 170/170 kiểm thử backend bị ảnh
  hưởng, 75/75 kiểm thử frontend, thực thi traceability, quét thông tin xác thực
  dòng thay đổi và kiểm tra diff. Nhat xác nhận review con người Nhiệm vụ 7 cuối.

## 11. Phần theo dõi kết quả tư cách thành viên FE04

### FE10-S09 Thêm ranh giới nguồn kết quả tư cách thành viên FE04

- [x] Trạng thái: HOÀN TẤT - RANH GIỚI NGUỒN FE04 VÀ FAN-IN GREEN
- Phụ thuộc: sửa hợp đồng trình yêu cầu FE04/FE10.
- Ánh xạ tới: Q-FE10-009, BR-FE10-005, BR-FE10-011, FR-FE10-006, FR-FE10-009.
- Tiêu chí hoàn thành: FE04 được chấp nhận bởi danh sách cho phép ràng buộc khi
  khởi tạo, chỉ FE04 có thể gửi `MEMBERSHIP_RESULT`, hành vi trạng thái/dấu thời
  gian được kiểm thử và lỗi gửi vẫn không chặn sau khi quyết định tư cách thành
  viên đã commit.

## 12. Khắc phục an toàn tuyên bố giao hàng

### FE10-S10 Lưu quyền sở hữu giao hàng trước I/O nhà cung cấp

- [~] Trạng thái: ĐÃ TRIỂN KHAI VÀ XÁC THỰC TỰ ĐỘNG; KHẮC PHỤC H3 ĐANG TIẾN
  HÀNH
- Thiết kế đã phê duyệt:
  `docs/superpowers/specs/2026-07-23-fe07-fe08-fe10-fe12-final-verification-remediation-design.md`.
- Ánh xạ tới: BR-FE10-005, BR-FE10-006, BR-FE10-008, BR-FE10-013;
  FR-FE10-001, FR-FE10-002, FR-FE10-006 đến FR-FE10-008, FR-FE10-010;
  AC-FE10-006, AC-FE10-008 đến AC-FE10-010.
- Tệp: đặc tả/ADR/OpenAPI FE10, service/repository/model thông báo, SQL chuẩn,
  `2026-07-23-fe10-processing-status.sql`, dependency trong bộ nhớ và kiểm thử
  tập trung.
- Bằng chứng RED: thiếu tham chiếu nguồn nội bộ, lỗi lưu bền chuyển đổi kết
  thúc, phát lại trùng khi không chắc chắn và đồng thời nhận/hoàn tất đều thất
  bại với phần triển khai `PENDING`-qua-nhà-cung-cấp trước đó.
- Hợp đồng GREEN: chấp nhận nhạy cảm và nhận hàng đợi lưu `PROCESSING` trước
  I/O nhà cung cấp; chuyển đổi kết thúc được bảo vệ dùng giao dịch ngắn mới;
  hàng không chắc chắn không bị nhận lại hay thử lại; thử lại thủ công trả
  `DELIVERY_STATE_UNCERTAIN` an toàn.
- Bằng chứng xác minh: kiểm thử FE10 tập trung, migration hai lần trên cơ sở dữ
  liệu SQL cục bộ được đặt tên dùng một lần, kiểm tra repository đầy đủ, review
  bảo mật/diff và dọn dẹp đều xanh. H2 ban đầu và phụ lục H2 đã đạt; commit
  `97aca62` và lượt PR CI `30014066260` đạt; migration đã review được áp dụng
  một lần lên staging. H2 mới sau đó phê duyệt commit khắc phục `b931e00` và
  PR CI `30019439505` đạt. Review H3 lặp lại chỉ trả về finding hoàn tất vòng
  hai có giới hạn. H2 mới phê duyệt gói vòng hai ngày 2026-07-23 và ủy quyền
  commit/push đã review; CI PR cập nhật và H3 lặp lại vẫn bắt buộc trước merge.

## 13. An toàn định nghĩa mẫu đã lưu

### FE10-S11 Từ chối định nghĩa mẫu đã lưu không an toàn

- [x] Trạng thái: ĐÃ TRIỂN KHAI VÀ XÁC THỰC TỰ ĐỘNG; H2 TÍCH HỢP VÀ PR CI ĐẠT
- Ánh xạ tới: BD-004, BR-FE10-010, FR-FE10-005/009, AC-FE10-006,
  EC-FE10-010, NFR-FE10-SEC-005.
- RED: định nghĩa tiêu đề/nội dung đã lưu không an toàn bị làm sạch ngầm và
  được chấp nhận.
- GREEN: `validateStoredTemplateDefinition(template)` từ chối thẻ HTML thô,
  thuộc tính xử lý sự kiện nội tuyến và URL `javascript:` bằng
  `400 UNSAFE_TEMPLATE_DEFINITION` an toàn trước khi kết xuất/lưu bền/I/O nhà
  cung cấp.
- Bằng chứng: 3/3 ca RED được giải quyết là `SENT`; GREEN tập trung đạt 4/4
  bao gồm làm sạch khi chạy, toàn bộ bộ FE10 đạt 139/139.
- Bảo toàn: giá trị khi chạy vẫn được escape/làm sạch; từ chối khóa giống bí
  mật, che `safePayload`, quyền sở hữu nguồn, lũy đẳng, DTO và trạng thái giao
  hàng bền vững không đổi.
- Tệp: `backend/tests/notificationRoutes.test.js`,
  `backend/src/services/notificationService.js`.
- Cổng: phụ lục H2 sản phẩm phê duyệt commit `f346ae0` và lượt PR CI
  `30244750250` đạt. Khắc phục H3 chỉ tài liệu cần H2 mới và H3 lặp lại trước
  merge.

## 14. Khắc phục gửi email staging

### FE10-S12 Kích hoạt hợp đồng khắc phục đã phê duyệt

- [x] Trạng thái: THIẾT KẾ VÀ HỢP ĐỒNG BẰNG VĂN BẢN ĐƯỢC PHÊ DUYỆT 2026-07-27
- Tệp: thiết kế đã phê duyệt và FE10 SPEC/PLAN/TASKS/CHANGELOG.
- Tiêu chí hoàn thành: v0.4.5 ghi migration, bằng chứng ID nhà cung cấp an toàn,
  tiến trình SYSTEM, giới hạn F1 theo khả năng tốt nhất, quyền HTTP không đổi và
  thử lại thủ công.

### FE10-S13 Khôi phục mẫu thiết lập tài khoản cơ sở dữ liệu hiện có

- [x] Trạng thái: H2/CI/STAGING KHẢ NĂNG LẶP LẠI ĐẠT
- Phụ thuộc: FE10-S12.
- Tệp: `database/migrations/2026-07-27-fe10-account-setup-template.sql`,
  `backend/tests/notificationRepository.test.js`.
- Tiêu chí hoàn thành: migration có giao dịch, lũy đẳng, additive, chuẩn và đạt
  hai lần thực thi với đúng một hàng `ACCOUNT_SETUP` hoạt động.
- Bằng chứng: migration dùng `XACT_ABORT`, một giao dịch, hành vi
  update-or-insert chuẩn, rollback/rethrow và không xóa. Kiểm thử hợp đồng
  migration tĩnh xanh; hai lần thực thi staging vẫn có cổng H2.
- Staging: cả hai lần thực thi đạt và tổng hợp mẫu cuối là `1|1|1|1|1`; quy tắc
  firewall tạm thời IP chính xác đã bị loại.

### FE10-S14 Bảo toàn ID thông điệp nhà cung cấp nhạy cảm

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #65 ĐÃ MERGE, CI HẬU MERGE ĐẠT
- Phụ thuộc: FE10-S12.
- Tệp: `backend/src/services/notificationService.js`,
  `backend/tests/notificationRoutes.test.js`.
- Tiêu chí hoàn thành: các lần thử thành công nhạy cảm FE02 và FE11 chỉ lưu ID
  thông điệp bộ điều hợp trong khi lưu bền, kiểm toán, log và phản hồi vẫn không
  có thông tin xác thực.
- Bằng chứng: assertion thành công xác minh/đặt lại FE02 và thiết lập FE11 giữ
  ID thông điệp nhà cung cấp mô phỏng trong khi assertion cô lập nội dung nhạy
  cảm hiện có vẫn xanh.

### FE10-S15 Thêm tiến trình SYSTEM theo khả năng tốt nhất

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #65 ĐÃ MERGE, CI HẬU MERGE ĐẠT
- Phụ thuộc: FE10-S12.
- Tệp: service/worker/runtime/config/index thông báo, `.env.example` và kiểm
  thử service/worker/runtime/config tập trung.
- Tiêu chí hoàn thành: lượt chạy khi khởi động và theo khoảng thời gian khi bật
  không chồng lấp; chế độ tắt không có timer; lỗi an toàn phục hồi; dừng xóa
  lịch; chỉ hàng `PENDING` không nhạy cảm được xử lý; quyền HTTP thủ công không
  đổi.
- Bằng chứng: kiểm thử worker/config/runtime bao phủ chế độ tắt, công việc lúc
  khởi động và theo khoảng, chặn chồng lấp, phục hồi an toàn, tắt và hành vi
  import. Kiểm toán SYSTEM ghi công việc thực nhưng không tạo hàng kiểm toán
  polling rỗng; kiểm thử HTTP được bảo vệ hiện có vẫn xanh.
- Phụ lục staging: lượt worker triển khai đầu tiên phát hiện lỗi SQL Server 650
  vì `READPAST` được kết hợp với `HOLDLOCK` serializable. Worker đã rollback về
  tắt. Candidate thay `HOLDLOCK` bằng `READCOMMITTEDLOCK`; probe rollback Azure
  SQL và kiểm thử cục bộ đạt.
- Staging đã sửa: CI exact-head `30274110435` và deploy `30274367534` đạt. Khi
  bật lại worker, hàng đợi đạt 0 pending/processing, 15 sent và 0 failed; toàn
  bộ 15 lần thử giữ ID thông điệp nhà cung cấp.

### FE10-S16 Vượt xác thực H2 cục bộ và staging

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #65 ĐÃ MERGE, CI HẬU MERGE ĐẠT
- Phụ thuộc: FE10-S13..S15.
- Tệp: FE10 TASKS/CHANGELOG và
  `.sdd/reviews/staging-email-delivery-remediation-validation-2026-07-27.md`.
- Tiêu chí hoàn thành: cổng kiểm thử tập trung và đầy đủ đạt; migration đạt hai
  lần; review diff/bảo mật đạt; H2 phê duyệt commit; thiết lập/triển khai mẫu/
  worker staging và bằng chứng hàng đợi/lần thử nhà cung cấp an toàn được ghi
  không có bí mật hay PII.
- Bằng chứng: tập trung 165/165, backend 1079/1079, frontend 232/232, triển
  khai 9/9, tích hợp hệ thống 10/10, lint/build/trace, vệ sinh diff và review
  bí mật/log theo phạm vi đạt trên candidate H2 chưa commit.
- H2: người dùng phê duyệt candidate đầy đủ ngày 2026-07-27. Commit sản phẩm là
  `7920d4b`, `2134d44` và `ccb590c`; CI và bằng chứng staging vẫn bắt buộc.
- Công bố ban đầu: head PR #65 `8f39baa` đạt lượt CI `30272237192`; lượt deploy
  `30272792025` đạt backend, frontend và smoke. Migration đạt hai lần, tổng
  hợp mẫu là `1|1|1|1|1`.
- Xác minh worker staging phát hiện 15 hàng không nhạy cảm vẫn pending và lỗi
  worker mã cố định. Lỗi 650 được tái hiện không thay đổi dữ liệu và thiết lập
  worker trả về `false`; checkpoint thất bại ban đầu này được thay thế bởi xác
  thực đã sửa bên dưới.
- Phụ lục H2: người dùng phê duyệt sửa nhận hàng tương thích Azure ngày
  2026-07-27; commit sản phẩm là `a98f459`.
- Xác thực đã sửa: CI `30274110435` và deploy `30274367534` đạt cho head
  `9240525`; API/frontend là 200, xử lý thủ công ẩn danh là 401, tổng hợp hàng
  đợi là `0|0|15|0`, tổng hợp lần thử/nhà cung cấp là `15|15`, tổng hợp nhạy
  cảm/không an toàn là `21|0`, tổng hợp kiểm toán SYSTEM/no-op là `1|0` và
  quy tắc firewall còn lại do nhiệm vụ tạo là 0.
- Tích hợp: sau phê duyệt H3 rõ ràng, PR #65 merge thành `01807f0`; CI `main`
  hậu merge chính xác `30275341156` đạt. Triển khai Azure FE10 sau đó
  `30307855616` đạt với baseline v0.4.5 này vẫn hoạt động.

## 15. Nhiệm vụ hộp thư thông báo cá nhân v0.5.0

Các bước chi tiết, lệnh RED/GREEN và ranh giới commit nằm trong
`docs/superpowers/plans/2026-07-27-fe10-personal-notification-inbox.md`.

### FE10-I01 Thêm migration trạng thái đọc additive

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #75 ĐÃ MERGE, CI/AZURE HẬU MERGE
  ĐẠT
- Ánh xạ tới: BR-FE10-016, BR-FE10-019, BR-FE10-020; AC-FE10-011 đến
  AC-FE10-014.
- Tệp: SQL chuẩn, model Notification, migration lũy đẳng mới, kiểm thử hợp đồng
  migration.
- Tiêu chí hoàn thành: `ReadAt DATETIME2 NULL`, hàng lịch sử đủ điều kiện được
  điền lùi thành `CreatedAt`, chỉ mục hỗ trợ tồn tại, hàng nhạy cảm/không người
  dùng bị loại và hai lần thực thi tạo cùng điều kiện hậu.

### FE10-I02 Thêm repository bản ghi của chính mình và phép chiếu an toàn

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #75 ĐÃ MERGE, CI/AZURE HẬU MERGE
  ĐẠT
- Phụ thuộc: FE10-I01.
- Ánh xạ tới: BR-FE10-014 đến BR-FE10-017, BR-FE10-020; AC-FE10-011 đến
  AC-FE10-015.
- Tệp: repository thông báo, tiện ích phép chiếu/thao tác hộp thư, repository
  trong bộ nhớ, kiểm thử repository/đơn vị tập trung.
- Tiêu chí hoàn thành: SQL liệt kê/đếm/đọc lọc theo `UserId` hiện tại và danh
  sách cho phép đủ điều kiện chính xác trước khi hiện thực hóa; phân trang phía
  SQL; thay đổi đọc có tính lũy đẳng và không thay đổi trạng thái gửi; DTO/đường
  dẫn thao tác cố định, không có siêu dữ liệu nhạy cảm hoặc giao hàng.

### FE10-I03 Công khai API hộp thư cá nhân đã xác thực

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #75 ĐÃ MERGE, CI/AZURE HẬU MERGE
  ĐẠT
- Phụ thuộc: FE10-I02.
- Ánh xạ tới: FR-FE10-011 đến FR-FE10-015; AC-FE10-011 đến AC-FE10-015.
- Tệp: validator thông báo, service, controller, route, OpenAPI, kiểm thử route.
- Tiêu chí hoàn thành: route liệt kê, đếm chưa đọc, đánh dấu một và đánh dấu tất
  cả chấp nhận cả ba vai trò đăng nhập, từ chối người chưa xác thực/vai trò
  không hỗ trợ, kiểm tra bộ lọc, trả DTO an toàn và làm ID không tồn tại/nhạy
  cảm/của người dùng khác thành `404` không thể phân biệt.

### FE10-I04 Thêm client frontend và context hộp thư dùng chung

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #75 ĐÃ MERGE, CI/AZURE HẬU MERGE
  ĐẠT
- Phụ thuộc: FE10-I03.
- Ánh xạ tới: FR-FE10-016; AC-FE10-012, AC-FE10-013, AC-FE10-016.
- Tệp: API frontend dùng chung, ánh xạ lỗi, view model/context thông báo, nối
  provider App, kiểm thử frontend.
- Tiêu chí hoàn thành: số lượng chỉ tải cho phiên đã xác thực, làm mới khi nhận
  tiêu điểm, thay đổi thành công và khoảng 60 giây không chồng lấp; lỗi đọc khi
  nhấp phát cảnh báo an toàn trong khi điều hướng trong danh sách cho phép vẫn
  tiếp tục.

### FE10-I05 Thêm chuông và xem trước shell đã xác thực

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #75 ĐÃ MERGE, CI/AZURE HẬU MERGE
  ĐẠT
- Phụ thuộc: FE10-I04.
- Ánh xạ tới: FR-FE10-015, FR-FE10-016; AC-FE10-015, AC-FE10-016.
- Tệp: Header, thành phần chuông thông báo, kiểu app-shell, kiểm thử frontend.
- Tiêu chí hoàn thành: mọi vai trò đã xác thực thấy chuông, huy hiệu chưa đọc
  giới hạn `99+`, popover tải tối đa năm mục chưa đọc mới nhất với trạng thái
  tải/trống/lỗi rõ ràng và `Xem tất cả` mở `/notifications`.

### FE10-I06 Thêm trang thông báo cá nhân

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #75 ĐÃ MERGE, CI/AZURE HẬU MERGE
  ĐẠT
- Phụ thuộc: FE10-I04.
- Ánh xạ tới: FR-FE10-011, FR-FE10-013, FR-FE10-014, FR-FE10-016;
  AC-FE10-011, AC-FE10-013, AC-FE10-014, AC-FE10-016.
- Tệp: bảo vệ route đã xác thực, route App, trang thông báo, kiểu app-shell,
  kiểm thử frontend.
- Tiêu chí hoàn thành: bộ lọc tất cả/chưa đọc/đã đọc, phân trang 20 mục, trạng
  thái tải/trống/lỗi/đã đọc, đánh dấu tất cả và thao tác mục khớp API; không có
  điều khiển xóa/lưu trữ/nhật ký toàn cục.

### FE10-I07 Chứng minh hành vi liên tính năng và trình duyệt

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #75 ĐÃ MERGE, CI/AZURE HẬU MERGE
  ĐẠT
- Phụ thuộc: FE10-I03, FE10-I05, FE10-I06.
- Ánh xạ tới: AC-FE10-011 đến AC-FE10-016.
- Tệp: kiểm thử tích hợp FE04/FE07/FE08, E2E Playwright FE10, harness hỗ trợ
  kiểm thử, TEST_PLAN FE10.
- Tiêu chí hoàn thành: một sự kiện nguồn tạo một bản ghi được hỗ trợ bởi email
  có thể thấy cho chủ sở hữu; hàng nhạy cảm và khác người dùng không bao giờ
  xuất hiện; luồng trình duyệt MEMBER/LIBRARIAN/ADMIN đạt, gồm lỗi đọc không
  chặn.

### FE10-I08 Vượt cổng H2, Azure staging, H3 và merge

- [x] Trạng thái: HOÀN TẤT - H3 PHÊ DUYỆT, PR #75 ĐÃ MERGE, CI/AZURE HẬU MERGE
  ĐẠT
- Phụ thuộc: FE10-I01..I07.
- Ánh xạ tới: toàn bộ mục BR/FR/AC v0.5.0.
- Tệp: OpenAPI, bản đồ kiến trúc/tích hợp, hướng dẫn người dùng, hướng dẫn/
  kiểm thử workflow Azure staging, PLAN/TASKS/CHANGELOG FE10, bằng chứng review.
- Tiêu chí hoàn thành: cổng backend/frontend tập trung/đầy đủ, lint/build,
  triển khai/hệ thống, traceability, quét bảo mật/bí mật/diff, migration hai
  lượt và browser E2E đạt; H2 phê duyệt candidate; preflight hash migration
  chính xác, backend, frontend, staging smoke và kiểm tra trình duyệt đạt; H3
  phê duyệt head chính xác trước merge; CI hậu merge và staging tự động được
  theo dõi.
- Bằng chứng sau chênh lệch qua `main@f3ebe95`: bao phủ backend đạt 69/69 bộ và
  1114/1114 kiểm thử; frontend đạt 258/258 cùng lint/build; triển khai đạt
  15/15; hệ thống đạt 10/10; trạng thái traceability đạt 3/3 và bao phủ thực thi
  FE10 là 14/16 (88%); Chromium đạt 11/11; migration chính xác đạt hai lần với
  tổng hợp được bảo vệ không đổi và cơ sở dữ liệu dùng một lần đã xóa. Kiểm toán
  backend không phát hiện lỗ hổng; cổng kiểm toán frontend repository chỉ chấp
  nhận advisory React Router RSC không ổn định không áp dụng cho bản dựng
  `BrowserRouter` khai báo.
- TDD review bảo mật cuối phát hiện bộ chọn SQL `listPending` không dùng không
  loại trừ rõ `ACCOUNT_SETUP` nhạy cảm dù worker hoạt động và bộ chọn trong bộ
  nhớ đã làm vậy. Hồi quy repository RED tái hiện không khớp; cả hai bộ chọn
  pending SQL hiện chia sẻ loại trừ đầy đủ bốn loại, GREEN tập trung đạt 161/161
  trước khi chạy lại toàn bộ backend.
- H2 phê duyệt fingerprint `2b53d7e`; commit `b11b59e` và CI PR của nó đạt.
  Azure staging đã migration từ không có lên một cột `ReadAt` và chỉ mục hỗ trợ;
  17 hàng lịch sử đủ điều kiện đã điền lùi, 25 hàng bị loại vẫn chưa đọc, một
  probe sau lượt một vẫn chưa đọc sau lượt hai, tổng hợp được bảo vệ không đổi
  và dọn dẹp probe/firewall đạt.
- Lượt deploy thủ công `30305596861` fail-closed trước triển khai vì Windows áp
  dụng byte migration CRLF (`6e8b6b4...`) trong khi runner Linux băm checkout
  LF tương đương (`143cd8e...`). Bao phủ chính sách triển khai RED/GREEN hiện
  chỉ cho phép đúng bản dựng LF/CRLF của nội dung UTF-8 không đổi đó.
- Phụ lục hash được H2 phê duyệt với fingerprint `f78e0cc9...` và công bố trên
  head PR chính xác `28c4f80`; CI `30306805399` và Azure staging deployment
  `30307855616` đạt mọi job. Kiểm tra API/trình duyệt trực tiếp bao phủ cả ba
  vai trò, cô lập bản ghi của chính mình, loại trừ nhạy cảm, phát lại đọc, điều
  hướng an toàn, HTTPS/CORS và dọn dẹp probe/firewall Azure.
- H3 vòng một phát hiện thiếu đối soát ADR/trạng thái hiện tại, trạng thái mục
  lỗi thời sau một lần đọc thành công không điều hướng, đánh dấu tất cả bị vô
  hiệu sai bởi trang đã lọc hiện tại và lỗi xếp chồng popover được trình duyệt
  báo cáo. Các sửa TDD/tài liệu có giới hạn đóng các finding triển khai đó.
- H1 phê duyệt chênh lệch không chồng lấp sau qua `main@12faead`. Commit đến
  chỉ xóa artifact `document/` đã ngừng dùng; nhánh rebase không xung đột.
  Azure staging hiện tại phục vụ `main` đó, vì vậy biện pháp khắc phục phải được
  công bố và deploy lại tại head chính xác mới.
- Bằng chứng cục bộ sau rebase mới đạt: backend 69/69 bộ và 1116/1116 kiểm thử;
  frontend 259/259 cùng lint/build; triển khai 20/20; hệ thống 10/10; trạng thái
  traceability 3/3 và FE10 14/16 (88%); Chromium 11/11; kiểm toán, chuẩn bị
  schema Azure, vệ sinh diff và quét mâu thuẫn.
- H2 vòng 3 đã được phê duyệt nhưng bị thay thế trước khi dùng bởi
  `main@a240705`. Người dùng phê duyệt phụ lục chênh lệch H1 thứ tư; việc
  upstream loại chỉnh sửa FE11 Admin, CI main chính xác `30311801599`, triển
  khai Azure `30311973740` và rebase không xung đột được bảo toàn. Ma trận đầy
  đủ và H2 mới vẫn bắt buộc.
- Ma trận mới trên `main@a240705` đạt: backend 69/69 bộ và 1084/1084 kiểm thử;
  frontend 259/259 cùng lint/build; triển khai 20/20; hệ thống 10/10; trạng thái
  traceability 3/3 và FE10 14/16 (88%); Chromium 11/11; kiểm toán, chuẩn bị
  schema Azure và vệ sinh diff.
- H2 vòng 4 phê duyệt fingerprint `f41dbf50...`; biện pháp khắc phục được commit
  và push dưới head PR #75 `3f9f23a`. CI exact-head `30313721511`, Azure deploy
  `30313949983`, kiểm tra transport công khai/route được bảo vệ, xác minh schema/
  chỉ mục Azure SQL và dọn dẹp đều đạt. H3 lặp lại, phê duyệt H3 rõ ràng, merge
  và CI/deploy hậu merge là bắt buộc tại checkpoint lịch sử đó.
- Tích hợp cuối: H2 phê duyệt fingerprint
  `e123345be05b59a9e519d182b301ab5464160e8fc32aed8d17d3c463e28e0a15`;
  head PR #75 `778e0a470d8a1083bf571a8007b3c058eee4bb22` đạt CI
  `30317424995` và Azure staging `30317621429`, sau đó H3 hai trục sạch và phê
  duyệt rõ ràng. PR #75 merge thành
  `b75776b10d6cf4b6868d2ba51eb3268073483b8b`; CI hậu merge chính xác
  `30341279111` và Azure staging tự động `30341540847` đã đạt.

### Traceability v0.5.0

| Tiêu chí chấp nhận | Lát cắt đã lên kế hoạch |
| --- | --- |
| AC-FE10-011 | FE10-I01, FE10-I02, FE10-I03, FE10-I06, FE10-I07, FE10-I08 |
| AC-FE10-012 | FE10-I01, FE10-I02, FE10-I03, FE10-I04, FE10-I07, FE10-I08 |
| AC-FE10-013 | FE10-I01, FE10-I02, FE10-I03, FE10-I04, FE10-I06, FE10-I07, FE10-I08 |
| AC-FE10-014 | FE10-I01, FE10-I02, FE10-I03, FE10-I06, FE10-I07, FE10-I08 |
| AC-FE10-015 | FE10-I02, FE10-I03, FE10-I05, FE10-I07, FE10-I08 |
| AC-FE10-016 | FE10-I04, FE10-I05, FE10-I06, FE10-I07, FE10-I08 |

## Batch FE07-FE12 v0.6.0

- [x] **FE10-I09 - Canonical FE07 template/source ownership và RED tests.**
  - Ánh xạ: BR-FE10-021/023, FR-FE10-017, AC-FE10-017/020.
- [x] **FE10-I10 - Idempotent persistence/replay và additive template seed.**
  - Ánh xạ: FR-FE10-018, AC-FE10-018.
- [x] **FE10-I11 - Inbox eligibility và fixed borrowing action path.**
  - Ánh xạ: BR-FE10-022, FR-FE10-019/020, AC-FE10-019.
- [x] **FE10-I12 - Integration, sensitive scan và desktop evidence.**
  - Ánh xạ: `SL-002`, `SL-006`, `AT-002/003/006/009/012`.
  - Bằng chứng H2 cục bộ: 4 suite FE10/175 kiểm thử; migration replay-safe;
    system integration 11/11; Chromium liên hoàn 1/1 chứng minh bốn notification
    không trùng, fixed action path và không lộ rejection reason.

Không thêm bảng/kênh; product diff vẫn giữ uncommitted tới khi H2 phê duyệt.
