# TASKS.md - Xác thực FE02

Trạng thái: COMPLETE - H3 HỒI CỨU ĐÃ ĐƯỢC PHÊ DUYỆT
Implementation State: COMPLETE
Ghi chú baseline: Baseline triển khai và nhiệm vụ đối soát FE02-T049 đã hoàn tất; PR C vẫn cần cổng tích hợp H2 vòng 2, CI exact-head và H3 cuối.
Ngày: 2026-08-03
Chủ sở hữu: Dat

## Quy tắc thực hiện nhiệm vụ

- Chỉ triển khai hành vi Xác thực FE02 từ `SPEC.md` và `PLAN.md`.
- Không triển khai quản lý người dùng quản trị viên FE11 trong các nhiệm vụ này.
- Mỗi nhiệm vụ phải ngăn mật khẩu/token thô xuất hiện trong log và source control.
- Bắt buộc xác thực dữ liệu và phân quyền ở backend.
- Bắt buộc có kiểm thử cho hành vi xác thực cốt lõi.

## Các nhiệm vụ

| ID | Nhiệm vụ | Ánh xạ đặc tả | Phụ thuộc | DoD |
| --- | --- | --- | --- | --- |
| FE02-T001 | Tạo các thư mục kiến trúc backend cho FE02 (`routes`, `controllers`, `services`, `repositories`, `validators`, `middleware`, `config`, `utils`). | ADR-001 | Không có | Các thư mục tồn tại; ứng dụng vẫn import được và `/health` hoạt động. |
| FE02-T002 | Thêm module môi trường/cấu hình cho JWT, chi phí bcrypt, thời hạn token, cấu hình DB và các giá trị mặc định an toàn. | NFR-FE02-SEC | FE02-T001 | Không hardcode secret; thiếu cấu hình bắt buộc phải thất bại an toàn ngoài chế độ kiểm thử. |
| FE02-T003 | Thêm hàm hỗ trợ kết nối SQL Server bằng `mssql`. | ADR-002 | FE02-T002 | Module kết nối sử dụng biến môi trường và cung cấp hàm hỗ trợ query/transaction. |
| FE02-T004 | Triển khai bộ xử lý lỗi chung và hàm hỗ trợ response lỗi an toàn. | SAFE-005, NFR-FE02-SEC | FE02-T001 | Controller trả về lỗi an toàn không chứa stack trace. |
| FE02-T005 | Triển khai tiện ích chính sách mật khẩu và kiểm thử. | BR-FE02-001, BR-FE02-006 | FE02-T001 | Kiểm thử bao phủ mật khẩu hợp lệ và trường hợp thiếu chữ hoa/chữ số/ký tự đặc biệt/độ dài tối thiểu. |
| FE02-T006 | Triển khai tiện ích token cho token ngẫu nhiên, hash token, ký/xác minh JWT access token. | BR-FE02-010, BR-FE02-014 | FE02-T002 | Kiểm thử unit bao phủ cấu hình hết hạn, so sánh hash và hành vi token không hợp lệ. |
| FE02-T007 | Triển khai các repository: `userRepository`, `authTokenRepository`, `auditLogRepository`. | FR-FE02-001 đến FR-FE02-014 | FE02-T003 | Mọi SQL đều sử dụng truy vấn có tham số; không tra cứu token thô mà chỉ dùng token đã hash. |
| FE02-T008 | Triển khai adapter repository/service thông báo tùy chọn/mock cho email xác minh/đặt lại. | FR-FE02-003, FR-FE02-011; phụ thuộc FE10 | FE02-T007 | Tạo bản ghi thông báo an toàn hoặc mock không thực hiện thao tác; token thô không được ghi log. |
| FE02-T009 | Triển khai validator xác thực bằng `express-validator`. | FR-FE02-001, FR-FE02-004, FR-FE02-010 đến FR-FE02-012 | FE02-T001 | Request không hợp lệ trả về 400 cùng lỗi xác thực dữ liệu an toàn. |
| FE02-T010 | Triển khai service và controller đăng ký. | UC05; AC-FE02-001 đến AC-FE02-003, AC-FE02-022 | FE02-T005, FE02-T007, FE02-T008, FE02-T009 | Tự đăng ký hợp lệ tạo Thành viên không hoạt động, hash mật khẩu, tạo token xác minh và trả về 201. |
| FE02-T011 | Triển khai xác minh email và gửi lại xác minh. | UC05; FR-FE02-003; AC-FE02-002, AC-FE02-003 | FE02-T010 | Token hợp lệ kích hoạt tài khoản; token hết hạn/đã dùng thất bại an toàn; gửi lại tránh dò tìm tài khoản. |
| FE02-T012 | Triển khai service/controller đăng nhập cùng bộ đếm đăng nhập thất bại và xử lý khóa. | UC06; AC-FE02-004 đến AC-FE02-010 | FE02-T006, FE02-T007, FE02-T009 | Người dùng hợp lệ đang hoạt động nhận access/refresh token; trường hợp không hợp lệ/không hoạt động/bị khóa thất bại an toàn. |
| FE02-T013 | Triển khai middleware xác thực và `/api/auth/me`. | FR-FE02-008, FR-FE02-009; AC-FE02-009, AC-FE02-010 | FE02-T006, FE02-T012 | Access token hợp lệ thiết lập `req.user`; token thiếu/hết hạn trả về 401. |
| FE02-T014 | Triển khai endpoint refresh token. | BR-FE02-010; hợp đồng API | FE02-T006, FE02-T007, FE02-T012 | Refresh token hợp lệ trả về access token mới; token hết hạn/bị thu hồi thất bại. |
| FE02-T015 | Triển khai endpoint đăng xuất. | UC07; FR-FE02-007; AC-FE02-011 | FE02-T014 | Refresh token bị thu hồi; đăng xuất lặp lại vẫn an toàn. |
| FE02-T016 | Triển khai endpoint thay đổi mật khẩu. | UC08; FR-FE02-010; AC-FE02-012, AC-FE02-013 | FE02-T013, FE02-T005, FE02-T007 | Yêu cầu mật khẩu hiện tại hợp lệ; cập nhật hash; audit lần thử/kết quả. |
| FE02-T017 | Triển khai endpoint quên mật khẩu. | UC09; FR-FE02-011; AC-FE02-014, AC-FE02-015 | FE02-T007, FE02-T008, FE02-T009 | Luôn trả về thành công chung; chỉ tạo token đặt lại cho tài khoản đủ điều kiện. |
| FE02-T018 | Triển khai endpoint đặt lại mật khẩu. | UC10; FR-FE02-012; AC-FE02-016 đến AC-FE02-018 | FE02-T017, FE02-T005 | Token hợp lệ đặt lại mật khẩu và đánh dấu token đã dùng; token hết hạn/đã dùng bị từ chối. |
| FE02-T019 | Kết nối các route xác thực vào ứng dụng Express. | Hợp đồng API | FE02-T010 đến FE02-T018 | Tất cả endpoint `/api/auth/*` truy cập được; `/health` hiện có vẫn hoạt động. |
| FE02-T020 | Thêm kiểm thử integration cho đăng ký, xác minh, đăng nhập, refresh, đăng xuất, thay đổi mật khẩu, quên/đặt lại và `/me`. | FT05 đến FT11 | FE02-T019 | Kiểm thử Jest/Supertest vượt qua cục bộ; lỗi kiểm thử chặn merge. |
| FE02-T021 | Thêm stub API client frontend cho các endpoint xác thực. | Hợp đồng API; tích hợp UI | FE02-T019 | `frontend/src/api/authApi.js` export các hàm endpoint; frontend build vượt qua. |
| FE02-T022 | Kết nối các trang đăng nhập/đăng ký/quên mật khẩu hiện có với API xác thực cùng phản hồi tối thiểu cho người dùng. | UC05, UC06, UC09 | FE02-T021 | Biểu mẫu gọi API; không ghi log giá trị nhạy cảm; frontend build vượt qua. |
| FE02-T023 | Cập nhật CHANGELOG và ghi chú triển khai FE02. | Định nghĩa hoàn tất | FE02-T020 | Changelog ghi nhận phạm vi triển khai, kiểm thử và rủi ro còn lại. |
| FE02-T024 | Đồng bộ tài liệu FE02 và API với OTP sáu chữ số đã triển khai cùng khả năng tương thích token cũ. | FR-FE02-002, FR-FE02-003, FR-FE02-011, FR-FE02-012; Q-FE02-011 | FE02-T023 | SPEC, PLAN, TASKS, CHANGELOG và ví dụ API thống nhất với cấu trúc request đã triển khai. |
| FE02-T025 | Thêm các hàm hỗ trợ UX xác thực thuần ở frontend và kiểm thử hồi quy. | NFR-FE02-UX-002, NFR-FE02-UX-005 đến NFR-FE02-UX-007 | FE02-T024 | Việc che email, hướng dẫn mật khẩu, lỗi trường dữ liệu, chuẩn hóa OTP sáu chữ số và thời gian chờ 60 giây được kiểm thử. |
| FE02-T026 | Triển khai UX đăng ký hai bước và xác minh email. | AC-FE02-001 đến AC-FE02-003; UX-FE-002 đến UX-FE-005 | FE02-T025 | Giá trị an toàn được giữ qua lỗi có thể khôi phục; OTP nhận focus; gửi lại ngăn trùng lặp và hiển thị thời gian chờ. |
| FE02-T027 | Đồng bộ UX đăng nhập và quên/đặt lại mật khẩu với các mẫu xác thực dùng chung. | AC-FE02-004 đến AC-FE02-008, AC-FE02-014 đến AC-FE02-018 | FE02-T025 | Đăng nhập điều hướng qua `/home`; khôi phục giữ phản hồi chung, email được che, focus OTP, hướng dẫn mật khẩu và hành động hoàn tất. |
| FE02-T028 | Chạy cổng xác thực và rà soát thủ công cho Xác thực/OTP. | Định nghĩa hoàn tất; AC-UX-001 đến AC-UX-003, AC-UX-007, AC-UX-008 | FE02-T026, FE02-T027 | Ghi nhận kiểm thử mục tiêu, lint, build, kiểm tra nguồn, rà soát responsive và nghiệm thu thủ công. |

`FE02-T008` được giữ làm bằng chứng lịch sử cho phần mock/gửi trực tiếp ban đầu. ADR-004 và các nhiệm vụ tiếp theo bên dưới thay thế nhiệm vụ này đối với việc gửi OTP xác minh tài khoản và đặt lại mật khẩu.

## Thứ tự triển khai đề xuất

1. FE02-T001 đến FE02-T009: nền tảng, cấu hình, xác thực dữ liệu, repository, tiện ích.
2. FE02-T010 đến FE02-T012: đăng ký/xác minh/đăng nhập.
3. FE02-T013 đến FE02-T018: middleware, token, đăng xuất, luồng mật khẩu.
4. FE02-T019 đến FE02-T020: kết nối route và kiểm thử integration.
5. FE02-T021 đến FE02-T022: tích hợp API frontend.
6. FE02-T023: chốt tài liệu.
7. FE02-T024 đến FE02-T028: tăng cường và xác thực UX Xác thực/OTP đã phê duyệt.

## Phần hoàn tất tối thiểu cho Sprint 1

Nếu thời gian hạn chế, trước tiên hãy hoàn tất lát cắt dọc an toàn sau:

- FE02-T001 đến FE02-T013
- FE02-T019
- Kiểm thử integration cho đăng ký -> xác minh -> đăng nhập -> `/me`

Đặt lại mật khẩu và tích hợp frontend chỉ được thực hiện tiếp nếu nhóm xác định rõ phạm vi Sprint 1 theo hướng đó.

## Bằng chứng B7 của UX Xác thực/OTP

- [x] `FE02-T024` đến `FE02-T028` đã hoàn tất triển khai và xác thực mục tiêu.
- [x] Nhat đã xác nhận các cổng rà soát thủ công App Shell và Xác thực/OTP.
- [x] Merge commit `01c66ef` đã đến `main` và `origin/main`.
- [x] Commit khắc phục E2E `232ee4c` đã đồng bộ golden path với hợp đồng đăng nhập có khả năng truy cập và `/home` đã phê duyệt.
- [x] Commit `main` cuối cùng `6eee459` đã vượt qua GitHub Actions CI run `29358045198`.
- [x] Bằng chứng B7 được ghi tại `.sdd/reviews/library-ux-b7-integration-closeout-2026-07-15.md`.

Bằng chứng này chỉ đóng nhóm nhiệm vụ UX Xác thực/OTP. Phần gửi OTP FE02/FE10 riêng đã hoàn tất đến B7; việc gửi qua nhà cung cấp thực và các công việc FE02 không liên quan vẫn nằm ngoài phần này.

## Nhiệm vụ tiếp theo về gửi OTP FE02/FE10

- [x] **FE02-T029 - Chuẩn hóa hợp đồng gửi OTP đã phê duyệt.**
  - Ánh xạ tới: BR-FE02-020 đến BR-FE02-022; FR-FE02-002, FR-FE02-011, FR-FE02-022, FR-FE02-023; AC-FE02-001, AC-FE02-014, AC-FE02-019; ADR-004.
  - Tệp: `.sdd/specs/feat-auth/CONTEXT.md`, `SPEC.md`, `PLAN.md`, `TASKS.md`, `CHANGELOG.md`, `.sdd/rfcs/ADR-004-auth-otp-notification-boundary.md`.
  - DoD: FE02 và FE10 thống nhất về biến OTP, quyền sở hữu nguồn, tính idempotent theo ID token, quyền sở hữu gửi duy nhất, lỗi không chặn luồng, ngữ nghĩa gửi lại và loại trừ `CHANGE_PASSWORD_OTP`; không thay đổi tệp triển khai.

- [x] **FE02-T030 - Thêm kiểm thử tích hợp bên yêu cầu ở trạng thái RED.**
  - Ánh xạ tới: BR-FE02-020, BR-FE02-021; FR-FE02-002, FR-FE02-011, FR-FE02-022; AC-FE02-001, AC-FE02-014.
  - Tệp: `backend/tests/authRoutes.test.js`, `backend/tests/helpers/inMemoryAuthRepositories.js`.
  - DoD: kiểm thử đang thất bại chứng minh đăng ký, gửi lại xác minh và quên mật khẩu thực hiện đúng một lần gọi bên yêu cầu FE10 chứa `otp`, `expiresInMinutes`, `AuthToken`, ID token và tính idempotent theo ID token; kiểm thử từ chối việc ghi thông báo trực tiếp, gửi email xác minh/đặt lại trực tiếp và các trường HTTP `debugOtp`/`debugVerificationToken`/`debugResetToken`.

- [x] **FE02-T031 - Chuyển việc gửi xác minh/đặt lại sang FE10.**
  - Ánh xạ tới: BR-FE02-020, BR-FE02-021; FR-FE02-002, FR-FE02-011, FR-FE02-022.
  - Phụ thuộc: FE10-S02 và FE10-S03.
  - Tệp: `backend/src/services/authService.js`, `backend/src/repositories/authTokenRepository.js`, `backend/tests/helpers/inMemoryAuthRepositories.js`, `backend/tests/authRoutes.test.js`.
  - DoD: `createOtpToken` trả về bản ghi token đã lưu; việc xác minh/đặt lại chỉ gọi bên yêu cầu gắn với `FE02`; loại bỏ các đường ghi thông báo/gửi email trực tiếp trùng lặp và trường token debug HTTP; kiểm thử thu OTP qua dependency được inject; việc chấp nhận token cũ và email `CHANGE_PASSWORD_OTP` trực tiếp không thay đổi.
  - Bằng chứng: điểm hội tụ schema/OpenAPI của FE10 đã có và cổng liên tính năng FE02/FE10 tập trung hiện tại vượt qua trong 4 suite/154 kiểm thử.

- [x] **FE02-T032 - Khóa chặt hành vi lỗi không chặn luồng và gửi lại.**
  - Ánh xạ tới: BR-FE02-022; FR-FE02-023; AC-FE02-019; EC-FE02-009.
  - Tệp: `backend/tests/authRoutes.test.js`, `backend/src/services/authService.js`.
  - DoD: trạng thái FE10 `FAILED` hoặc exception an toàn không rollback trạng thái người dùng/token hay thay đổi ngữ nghĩa quên mật khẩu chung; OTP không xuất hiện trong log/audit/response; gửi lại tạo ID token và khóa thông báo mới.
  - Bằng chứng: hành vi lỗi/gửi lại của bên yêu cầu, tính idempotent theo ID token, không có trường thông tin xác thực debug và quyền sở hữu `CHANGE_PASSWORD_OTP` không đổi đều vượt qua trong cổng FE02/FE10 tập trung hiện tại.

- [x] **FE02-T033 - Vượt qua cổng xác thực liên tính năng.**
  - Ánh xạ tới: hợp đồng xác minh ADR-004 và mọi yêu cầu tiếp theo của FE02.
  - Phụ thuộc: FE02-T030 đến FE02-T032; FE10-S02 đến FE10-S04.
  - Tệp: `.sdd/specs/feat-auth/TASKS.md`, `.sdd/specs/feat-auth/CHANGELOG.md`; tệp triển khai chỉ thay đổi để sửa lỗi rà soát.
  - DoD: kiểm thử FE02/FE10 tập trung và kiểm thử integration bị ảnh hưởng vượt qua; traceability và quét secret vượt qua; `git diff --check` vượt qua; rà soát thủ công xác nhận hành vi `CHANGE_PASSWORD_OTP` và token cũ không bị mở rộng.
  - Trạng thái: COMPLETE THROUGH B7.
  - Bằng chứng: kiểm thử liên tính năng tập trung vượt qua 170/170; toàn bộ backend vượt qua 916/916 với độ bao phủ đã cấu hình; traceability FE02 là 26/26; frontend, hệ thống, triển khai, browser E2E, OpenAPI/import, kiểm tra rò rỉ và diff đều vượt qua. PR #42 merge thành `34d9180`; PR CI `29688102867` và CI `main` chính xác sau merge `29688222757` vượt qua. Kiểm thử mở rộng bao phủ mọi bên yêu cầu không phải FE02 trong allowlist cho cả hai loại nhạy cảm, lỗi ghi đè nguồn HTTP chính xác và việc luân chuyển ID token/tính idempotent khi đặt lại mật khẩu lặp lại. Không cần sửa production.

## Nhiệm vụ thiết lập tài khoản FE02/FE11

- [x] **FE02-T034 - Soạn hợp đồng tiêu thụ thiết lập chuẩn.**
  - Ánh xạ tới: BR-FE02-023..025; FR-FE02-024..025; AC-FE02-020..021; ADR-005.
  - DoD: FE02, FE10 và FE11 thống nhất về trạng thái không hoạt động ban đầu, quyền sở hữu, hoàn tất nguyên tử, lỗi, gửi lại và mức độ lộ thông tin xác thực; các tệp triển khai không thay đổi.
  - Trạng thái rà soát: Nhat đã rà soát hợp đồng được phê duyệt trước khi triển khai.

- [x] **FE02-T035 - Thêm kiểm thử hoàn tất thiết lập ở trạng thái RED.**
  - Tệp: `backend/tests/authRoutes.test.js`, repository/hàm hỗ trợ kiểm thử xác thực.
  - DoD: kiểm thử đang thất bại chứng minh việc kích hoạt nguyên tử hợp lệ và từ chối thông tin xác thực hết hạn, đã dùng, bị thu hồi, không đủ điều kiện, có mục đích đặt lại và bị tiêu thụ đồng thời.
  - Bằng chứng: độ bao phủ RED được triển khai cùng phần hoàn tất nguyên tử và commit trong `57068d2`.

- [x] **FE02-T036 - Triển khai hoàn tất thiết lập nguyên tử.**
  - Phụ thuộc: FE02-T035, FE11-S04.
  - Tệp: auth service và repository người dùng/token/audit.
  - DoD: một transaction cập nhật mật khẩu, trường xác minh/trạng thái/khóa, việc sử dụng/thu hồi token và audit; hành vi đặt lại mật khẩu không thể kích hoạt tài khoản không hoạt động.
  - Bằng chứng: commit triển khai `57068d2`; xác thực backend bị ảnh hưởng vượt qua 170/170 kiểm thử.

- [x] **FE02-T037 - Xác thực ranh giới thiết lập tài khoản.**
  - Phụ thuộc: FE02-T036, FE11-S03..S06.
  - DoD: kiểm thử liên tính năng tập trung, traceability, quét secret và `git diff --check` vượt qua; Nhat hoàn tất rà soát thủ công.
  - Trạng thái xác thực: PASS vào 2026-07-15; Nhat xác nhận rà soát thủ công cuối cùng cho Nhiệm vụ 7.

- [x] **FE02-T038 - Chuẩn hóa hợp đồng nghiệp vụ FE02 phục vụ rà soát liên tính năng.**
  - Ánh xạ tới: BR-FE02-014, BR-FE02-015, BR-FE02-017; FR-FE02-013, FR-FE02-014; AC-FE02-022..024; Q-FE02-014..016.
  - DoD: tự đăng ký chỉ tạo Member, FE11 sở hữu việc tạo nhân viên/quản trị viên, thiết lập tài khoản hết hạn đúng 24 giờ, đổi refresh token không yêu cầu access token và mọi quy tắc đã chuẩn hóa đều có traceability xác định.
  - Trạng thái rà soát: tài liệu hoàn tất và Nhat xác nhận rà soát thủ công vào 2026-07-17.

- [x] **FE02-T039 - Đóng khoảng trống bằng chứng API và OTP chuẩn.**
  - Ánh xạ tới: FR-FE02-003, FR-FE02-012, FR-FE02-015, FR-FE02-019; AC-FE02-002, AC-FE02-016, AC-FE02-018.
  - Tệp: `backend/tests/authRoutes.test.js`, `TEST_PLAN.md`, `CHANGELOG.md`, `TECH_DEBT.md`.
  - DoD: kiểm thử API chứng minh đăng ký trùng lặp và mật khẩu đăng ký/đặt lại yếu không lưu trạng thái trái phép; việc xác minh/đặt lại chuẩn bằng `{ email, otp }` chỉ kích hoạt hoặc cập nhật tài khoản đủ điều kiện và tiêu thụ OTP gắn với mục đích.
  - Bằng chứng: xác thực tập trung vượt qua 30/30; `TD-018` được giải quyết bởi `0040e0f` và PR CI run `29680011551` vượt qua.

- [x] **FE02-T040 - Đối soát chính sách lạm dụng đăng nhập và dò tìm tài khoản Giai đoạn 1.**
  - Ánh xạ tới: BR-FE02-007, BR-FE02-008, NFR-FE02-SEC-005, NFR-FE02-SEC-010, Q-FE02-005; AC-FE02-005, AC-FE02-007, AC-FE02-008.
  - Tệp: `backend/src/services/authService.js`, `backend/tests/authRoutes.test.js`, `TEST_PLAN.md`, `CHANGELOG.md`, `TECH_DEBT.md`.
  - DoD: khóa tài khoản đã biết vẫn là biện pháp kiểm soát Giai đoạn 1 được phê duyệt; không tuyên bố có giới hạn trên toàn IP; tài khoản không hoạt động và không xác định trả về cùng một lỗi đăng nhập công khai chung, trong khi tài khoản bị khóa giữ thông báo khóa đã phê duyệt.
  - Bằng chứng: kiểm thử hồi quy RED về tính tương đương thất bại với `403 ACCOUNT_INACTIVE`; GREEN vượt qua với `401 INVALID_CREDENTIALS`, sự kiện audit nội bộ cho tài khoản không hoạt động vẫn được giữ và PR CI run `29680011551` vượt qua trên `0040e0f`.

- [x] **FE02-T041 - Thực thi HTTPS trước khi xử lý thông tin xác thực.**
  - Ánh xạ tới: AC-FE02-024, BR-FE02-017, NFR-FE02-SEC-003.
  - Tệp: `backend/src/middleware/httpsEnforcement.js`, `backend/src/app.js`, `backend/tests/httpsEnforcement.test.js`, `TEST_PLAN.md`, `CHANGELOG.md`.
  - RED: request xác thực HTTP thuần đã triển khai đến được auth service và trả về `200`; chính sách chuyển hướng cũng chưa tồn tại.
  - GREEN: request xác thực production bị từ chối với `400 HTTPS_REQUIRED` trước khi phân luồng JSON/auth, `X-Forwarded-Proto: https` đáng tin cậy được chấp nhận và chính sách chuyển hướng `308` rõ ràng chỉ sử dụng `HTTPS_CANONICAL_HOST` đã xác thực.
  - Xác thực: suite giao thức tập trung `3/3`; toàn bộ backend và traceability vẫn là kiểm tra cổng merge.

- [x] **FE02-T042 - Giảm thời hạn OTP xác minh email xuống 15 phút.**
  - Ánh xạ tới: BR-FE02-020, BR-FE02-021, BR-FE02-027; FR-FE02-002; AC-FE02-001, AC-FE02-003; NFR-FE02-SEC-008.
  - Tệp: `backend/src/config/env.js`, `backend/src/services/authService.js`, `backend/.env.example`, `backend/tests/authRoutes.test.js`, `backend/tests/envConfig.test.js`, đặc tả/bản ghi thay đổi FE02.
  - DoD: đăng ký và gửi lại cấp OTP xác minh có thời hạn chính xác 15 phút; cấu hình phút chuẩn được xác thực; cấu hình giờ cũ tạm thời vẫn tương thích; kiểm thử tập trung/đầy đủ, traceability, kiểm tra rò rỉ, Azure health và email Gmail kết xuất thời hạn 15 phút đều vượt qua.
  - Bằng chứng: RED thất bại 5 assertion đối với phần triển khai 24 giờ; xác thực GREEN tập trung vượt qua 35/35, độ bao phủ toàn bộ backend vượt qua 920/920, traceability FE02 duy trì 26/26, `/health` trên Azure trả về 200 và thư Gmail sau khi khởi động lại hiển thị thời hạn 15 phút.

## Tăng cường xác thực dữ liệu đăng nhập và phản hồi

- [x] **FE02-T043 - Tăng cường xác thực dữ liệu ở lớp trình bày khi đăng nhập và lỗi bản địa hóa an toàn.**
  - Ánh xạ tới: AC-FE02-004 đến AC-FE02-008; BR-FE02-007; NFR-FE02-SEC-010, NFR-FE02-SEC-011, NFR-FE02-UX-001, NFR-FE02-UX-002, NFR-FE02-UX-008.
  - Tệp: `frontend/src/utils/authUx.js`, `frontend/src/component/login/LoginForm.jsx`, `frontend/src/component/login/AuthCard.jsx`, `frontend/src/page/LoginPage.jsx`, `frontend/src/api/authApi.js`, `backend/src/validators/authValidators.js`, các kiểm thử frontend/backend tập trung và bản ghi FE02.
  - DoD: giá trị đăng nhập trống/chỉ có khoảng trắng/quá dài nhận phản hồi tiếng Việt ở cấp trường; submission đang chờ không thể trùng lặp; tài khoản không xác định/không hoạt động giữ phản hồi chung; tài khoản bị khóa nhận hướng dẫn khôi phục đã phê duyệt; phản hồi mạng trung lập với môi trường; định danh tối đa 255 ký tự vượt qua xác thực ở server; các cổng xác thực tập trung và đầy đủ vượt qua.
  - Bằng chứng: TDD RED tái hiện việc thiếu hàm hỗ trợ/kết nối, backend từ chối ở 100 ký tự, xác thực native của trình duyệt bỏ qua phản hồi tiếng Việt ở cấp trường và nhánh quá dài không thể tiếp cận tại ranh giới HTML. Xác thực GREEN vượt qua 209/209 kiểm thử frontend đầy đủ, 33/33 kiểm thử xác thực backend tập trung, 924/924 kiểm thử backend đầy đủ, lint/build frontend và `trace:enforce`; Chromium headless xác nhận submission trống và 256 ký tự hiển thị thông báo tiếng Việt ở cấp trường đã phê duyệt, còn phản hồi thông tin xác thực không hợp lệ vẫn chung và được xóa khi chỉnh sửa.

## Đối soát tính nhất quán với bối cảnh

- [x] **FE02-T044 - Đồng bộ tài liệu FE02 với bối cảnh đã phê duyệt.**
  - Ánh xạ tới: `CONTEXT.md`; MF-FE02-006; FR-FE02-010; AC-FE02-012, AC-FE02-013.
  - Tệp: tài liệu context/spec/plan/tasks/test/changelog của FE02.
  - DoD: đường thay đổi mật khẩu trực tiếp và xác nhận bằng OTP, trạng thái tạo phẩm, danh mục endpoint, chính sách mật khẩu, thuật ngữ khóa tài khoản đã biết và khoảng trống bằng chứng đang mở phải nhất quán.

- [x] **FE02-T045 - Thêm kiểm thử hồi quy integration riêng cho OTP thay đổi mật khẩu.**
  - Ánh xạ tới: FR-FE02-010; AC-FE02-012, AC-FE02-013; CG-FE02-004.
  - Phụ thuộc: FE02-T044.
  - DoD: kiểm thử backend bao phủ request/confirm thành công cùng việc từ chối mật khẩu hiện tại không đúng và OTP không hợp lệ, hết hạn, đã dùng, sai người dùng mà không thay đổi mật khẩu.
  - Bằng chứng: `backend/tests/authRoutes.test.js` bao phủ mọi trường hợp từ chối được nêu và lần thay đổi mật khẩu một lần thành công; kiểm thử FE02 tập trung vượt qua 47/47 vào 2026-07-27.

- [x] **FE02-T046 - Chứng minh phân quyền theo vai trò hiện tại ở server.**
  - Ánh xạ tới: FR-FE02-014; AC-FE02-023; CG-FE02-002.
  - Phụ thuộc: FE02-T044.
  - DoD: một kiểm thử hồi quy rõ ràng chứng minh khai báo vai trò từ client không thể ghi đè `UserRoles` hiện tại.
  - Bằng chứng: `backend/tests/authRoutes.test.js` thay đổi vai trò đã lưu sau khi cấp access token và chứng minh việc xác thực được bảo vệ trả về vai trò hiện tại ở server.

- [x] **FE02-T047 - Đồng bộ và xác minh chính xác thời lượng khóa tài khoản.**
  - Ánh xạ tới: BR-FE02-008, BR-FE02-009; FR-FE02-006; AC-FE02-008; CG-FE02-001.
  - Phụ thuộc: FE02-T044.
  - DoD: giá trị mặc định của repository/triển khai là 30 phút và kiểm thử tập trung chứng minh thời lượng chính xác sau năm lần thất bại đủ điều kiện trong cửa sổ trượt 15 phút.
  - Bằng chứng: `backend/.env.example` và `backend/src/config/env.js` mặc định 30 phút; `envConfig.test.js` và `authRoutes.test.js` xác minh giá trị mặc định và thời lượng `lockedUntil` chính xác.

- [x] **FE02-T048 - Ghi nhận bằng chứng hiệu năng hoặc ngoại lệ được phê duyệt.**
  - Ánh xạ tới: NFR-FE02-PERF-001, NFR-FE02-PERF-004; CG-FE02-005.
  - Phụ thuộc: FE02-T044.
  - DoD: phép đo có thể lặp lại chứng minh đăng nhập hợp lệ dưới 1 giây và xác thực token dưới 50 ms tại p95, hoặc một ngoại lệ được người rà soát phê duyệt cập nhật hợp đồng.
  - Bằng chứng: `npm.cmd run phase3:performance` sử dụng môi trường in-memory cục bộ xác định đã ghi nhận, chi phí bcrypt 10, 30 mẫu đăng nhập hợp lệ đã warm up và 50 mẫu `/api/auth/me` đã warm up. Lần chạy lại ngày 2026-07-27 ghi nhận p95 đăng nhập `61.46 ms` và p95 xác thực phiên `1.52 ms`; `node --test tests/performance/phase3-performance.test.js` vượt qua 3/3. Các ranh giới vẫn được nêu rõ trong `docs/performance/phase3-performance-report-2026-07-19.md`.

- [x] **FE02-T050 - Thực thi trạng thái tài khoản hiện tại trên request được bảo vệ.**
  - Ánh xạ tới: FR-FE02-008, FR-FE02-009; AC-FE02-009, AC-FE02-010; CG-FE02-006.
  - Phụ thuộc: FE02-T044.
  - DoD: xác thực từ chối người giữ token có người dùng được lưu không còn là `ACTIVE`, đồng thời giữ kiểm tra phiên được liên kết và vai trò hiện tại; kiểm thử hồi quy tập trung bao phủ hủy kích hoạt/khóa sau khi cấp token.
  - Bằng chứng: `authenticateToken` hiện từ chối người dùng được lưu không có trạng thái `ACTIVE`; kiểm thử hồi quy tập trung bao phủ cả chuyển đổi sang `INACTIVE` và `LOCKED` sau khi cấp token.

- [x] **FE02-T051 - Đồng bộ cơ chế khôi phục phiên frontend của FE02.**
  - Ánh xạ tới: NFR-FE02-UX-009; CG-FE02-007.
  - Phụ thuộc: FE02-T044.
  - DoD: request hồ sơ/thay đổi mật khẩu được bảo vệ của FE02 sử dụng cơ chế lưu trữ đã chọn, thử lại tối đa một lần sau lỗi 401, lưu access token thay thế và xóa trạng thái xác thực rồi chuyển đến trang đăng nhập khi khôi phục thất bại.
  - Bằng chứng: `frontend/src/api/profileApi.js` hiện áp dụng luồng refresh một lần dùng chung cho request hồ sơ và thay đổi mật khẩu; `frontend/test/profileFrontend.test.js` bao phủ việc thử lại, lưu token, dọn dẹp và chuyển hướng.

- [x] **FE02-T052 - Đóng các khoảng trống về tính nguyên tử của giao dịch và audit xác thực.**
  - Ánh xạ tới: NFR-FE02-TXN-001 đến NFR-FE02-TXN-004; CG-FE02-008.
  - Phụ thuộc: FE02-T044.
  - DoD: tạo thông tin xác thực khi đăng ký, đăng nhập/tạo phiên, thay đổi mật khẩu/tiêu thụ OTP, đặt lại mật khẩu/tiêu thụ token và trạng thái audit bắt buộc phải commit hoặc rollback theo hợp đồng đã phê duyệt, với kiểm thử hồi quy lỗi tập trung hoặc ngoại lệ hữu hạn được phê duyệt rõ ràng.
  - Bằng chứng: thao tác thay đổi FE02 hiện dùng chung transaction SQL cho bốn ranh giới NFR-FE02-TXN-001..004; kiểm thử hồi quy lỗi in-memory tập trung chứng minh rollback khi tạo token xác minh, tạo phiên refresh, audit thay đổi mật khẩu bắt buộc và vô hiệu hóa token đặt lại. Kiểm thử FE02 tập trung vượt qua 47/47 vào 2026-07-27.

- [x] **FE02-T049 - Hoàn tất rà soát và chốt đối soát.**
  - Ánh xạ tới: Định nghĩa hoàn tất; CG-FE02-003; SPEC.md v0.6.16.
  - Phụ thuộc: FE02-T045 đến FE02-T048, FE02-T050 đến FE02-T052.
  - DoD: cổng tự động vượt qua, phần chốt H3 FE02-T043 được liên kết, mọi khoảng trống tuân thủ được đóng hoặc hoãn rõ ràng và rà soát thủ công phê duyệt các tạo phẩm đã đối soát.
  - Bằng chứng: T043 commit `241907d`, PR #60, exact-head CI `29875668029`, post-merge CI `29875885463` và staging `29876046500` đã được xác minh; GitHub không có review lịch sử. Focused current auth đạt backend 68/68 và frontend 17/17. H3 hồi cứu/phê duyệt thủ công được liên kết tại PR #107 comment `5162255705`.

## Giai đoạn 1: Hội tụ

- [x] **FE02-T053 - Thực thi cửa sổ trượt cho lần đăng nhập thất bại.**
  - Ánh xạ tới: BR-FE02-008; FR-FE02-006; NFR-FE02-SEC-005.
  - Phụ thuộc: FE02-T047.
  - DoD: chỉ các lần thất bại xảy ra trong cửa sổ trượt 15 phút mới tính vào ngưỡng khóa năm lần; lần thử cũ hơn bắt đầu số đếm mới và kiểm thử hồi quy tập trung chứng minh cả hai đường.
  - Bằng chứng: `LoginFailureAttempts` ghi nhận lỗi của tài khoản đã biết; repository đếm chính xác cửa sổ 15 phút theo transaction và kiểm thử hồi quy tập trung chứng minh lỗi đã hết hạn bị loại trước khi năm lỗi hiện tại khóa tài khoản trong 30 phút.

- [x] **FE02-T054 - Tạo OTP xác thực an toàn về mặt mật mã.**
  - Ánh xạ tới: BR-FE02-010; BR-FE02-014; NFR-FE02-SEC-007.
  - Phụ thuộc: FE02-T044.
  - DoD: bộ tạo OTP mặc định sử dụng nguồn an toàn về mặt mật mã, giữ hợp đồng sáu chữ số bao gồm số 0 ở đầu và một kiểm thử hồi quy tập trung bảo vệ phần triển khai.
  - Bằng chứng: bộ tạo mặc định sử dụng `crypto.randomInt` của Node.js; `backend/tests/authUtils.test.js` chứng minh ranh giới gọi an toàn và kết quả có số 0 ở đầu `000042`.

## Giai đoạn 2: Hội tụ

- [x] **FE02-T055 - Khôi phục quá trình tự đăng ký bị gián đoạn từ đăng nhập.**
  - Ánh xạ tới: BR-FE02-004, BR-FE02-007, BR-FE02-025; AC-FE02-007; trường hợp đăng ký bị gián đoạn đã phê duyệt.
  - Phụ thuộc: FE02-T011, FE02-T012, FE02-T022.
  - DoD: khi thông tin đăng nhập đúng thuộc về tài khoản tự đăng ký vẫn đang chờ xác minh email, đăng nhập trả về tín hiệu yêu cầu xác minh ổn định và frontend điều hướng đến `/verify-email` cùng email đã đăng ký; người dùng không xác định, sai mật khẩu, người dùng đã hủy kích hoạt và người dùng `ACCOUNT_SETUP` do quản trị viên tạo giữ hành vi an toàn không xác minh; gửi lại xác minh chỉ dành cho tài khoản tự đăng ký đủ điều kiện; kiểm thử hồi quy backend/frontend tập trung vượt qua.
  - Bằng chứng: đăng nhập chỉ trả về `403 EMAIL_VERIFICATION_REQUIRED` sau khi chứng minh đúng mật khẩu và nguồn gốc tự đăng ký đủ điều kiện, không cấp phiên refresh và `LoginPage` điều hướng đến `/verify-email`; kiểm thử backend tập trung vượt qua 48/48, kiểm thử frontend vượt qua 220/220, lint/build vượt qua và traceability FE02 vượt qua 27/27. Toàn bộ backend vẫn ở mức 57/61 suite và 1034/1039 kiểm thử vì các kỳ vọng phản hồi tài khoản không hoạt động liên tính năng và tách biệt DNS/mock không liên quan đã ghi nhận.

## Giai đoạn 3: Hội tụ

- [x] **FE02-T056 - Loại tài khoản đã hủy kích hoạt khỏi cơ chế khôi phục xác minh tự đăng ký.**
  - Ánh xạ tới: BR-FE02-028; Q-FE02-017; AC-FE02-026 (`contradicts`).
  - DoD: ánh xạ người dùng ở repository cung cấp `deactivatedAt`; đăng nhập và gửi lại xác minh từ chối tài khoản tự đăng ký đang chờ đã hủy kích hoạt mà không cấp phiên hoặc token xác minh; một kiểm thử hồi quy tập trung chứng minh ranh giới.
  - Bằng chứng: `userRepository` ánh xạ `DeactivatedAt`, predicate khôi phục dùng chung từ chối giá trị này và các kiểm thử hồi quy repository/đăng nhập/gửi lại tập trung vượt qua trong cổng FE02 58/58.

- [x] **FE02-T057 - Áp dụng dung sai lệch đồng hồ JWT đã phê duyệt.**
  - Ánh xạ tới: EC-FE02-015 (`missing`).
  - DoD: xác thực access token sử dụng chính xác 30 giây dung sai đồng hồ và kiểm thử hồi quy tiện ích tập trung bảo vệ tùy chọn.
  - Bằng chứng: `verifyAccessToken` truyền `clockTolerance: 30` cho `jsonwebtoken`; kiểm thử hồi quy tiện ích tập trung vượt qua.

- [x] **FE02-T058 - Hoàn tất ghi log lỗi xác thực an toàn.**
  - Ánh xạ tới: NFR-FE02-LOG-001, NFR-FE02-LOG-005, NFR-FE02-LOG-006; INV-FE02-006 (`partial`).
  - DoD: đăng nhập thất bại ghi nhận định danh được gửi và lý do an toàn, chuyển đổi sang `LOCKED` ghi sự kiện khóa riêng và lỗi xác thực token được bảo vệ phát debug output chỉ chứa mã ngoài production mà không ghi thông tin xác thực; kiểm thử hồi quy tập trung vượt qua.
  - Bằng chứng: audit kết quả đăng nhập chứa định danh/lý do, chuyển đổi đạt ngưỡng ghi `AUTH_ACCOUNT_LOCKED` và debug logging được inject chỉ nhận `INVALID_TOKEN`; kiểm thử FE02 tập trung vượt qua 58/58.

- [x] **FE02-T059 - Đối soát tạo phẩm FE02 với hợp đồng và bằng chứng đã triển khai.**
  - Ánh xạ tới: Mục 10/11/16/17 của SPEC; Mục 4/5/16 của PLAN (`contradicts`).
  - DoD: tạo phẩm ghi nhận `LoginFailureAttempts`, cấu trúc response `expiresIn` đã triển khai và hợp đồng đăng xuất bằng refresh token, bằng chứng AC-FE02-009/010/012/013/023 hiện tại, kiểm tra đối soát đã hoàn tất và số lượng xác thực hiện tại mà không thay đổi hành vi đã phê duyệt.
  - Bằng chứng: SPEC v0.6.14, CONTEXT v0.2.6, PLAN, TEST_PLAN v0.3.11, TASKS, CHANGELOG và hợp đồng API dùng chung hiện thống nhất với mã nguồn và bằng chứng hiện tại.

- [x] **FE02-T060 - Đồng bộ kỳ vọng integration liên tính năng cho tài khoản không hoạt động với xác thực FE02.**
  - Ánh xạ tới: FR-FE02-009; AC-FE02-010 (`contradicts`).
  - DoD: kiểm thử hồi quy integration FE04/FE07/FE08 kỳ vọng `401 INVALID_TOKEN` trước handler nghiệp vụ của FE02 đối với người dùng bị hủy kích hoạt sau khi cấp token; hành vi từ chối tính năng được giữ nguyên và các suite tập trung vượt qua.
  - Bằng chứng: ba kỳ vọng hiện tuân theo FR-FE02-009 và các suite membership/borrowing/reservation bị ảnh hưởng vượt qua 114/114; toàn bộ backend cải thiện lên 60/61 suite và 1040/1042 kiểm thử, chỉ còn `dbConfig.test.js` thất bại.

## Giai đoạn 4: Hội tụ

- [x] **FE02-T061 - Giữ trạng thái đã hủy kích hoạt ở trạng thái cuối trong quá trình xác minh email.**
  - Ánh xạ tới: BR-FE02-004; FR-FE02-003; AC-FE02-002; INV-FE02-004; INV-FE02-006 (`contradicts`, `partial`).
  - DoD: xác minh bằng OTP và token cũ từ chối tài khoản đã hủy kích hoạt hoặc không đủ điều kiện mà không kích hoạt người dùng hay tiêu thụ thông tin xác thực; cập nhật kích hoạt đã lưu không thể thắng tranh chấp hủy kích hoạt đồng thời; xác minh đủ điều kiện thành công vẫn kích hoạt tài khoản, tiêu thụ thông tin xác thực và ghi sự kiện audit cùng kiểm thử hồi quy tập trung.
  - Bằng chứng: đường hoàn tất xác minh dùng chung yêu cầu tự đăng ký đủ điều kiện, sử dụng cập nhật có chốt `INACTIVE`/`DeactivatedAt IS NULL` và commit việc kích hoạt, tiêu thụ thông tin xác thực cùng audit bắt buộc trong một transaction; kiểm thử FE02 tập trung vượt qua 61/61, bao gồm rollback audit bắt buộc.

## Giai đoạn 5: Hội tụ

- [x] **FE02-T062 - Ánh xạ đăng ký trùng lặp đồng thời sang conflict đã phê duyệt.**
  - Ánh xạ tới: FR-FE02-015; EC-FE02-003 (`partial`).
  - DoD: conflict unique-email xác định của SQL Server phát sinh sau truy vấn trước khi insert trả về `409 EMAIL_ALREADY_REGISTERED` cùng thông báo đã phê duyệt và không có trạng thái người dùng/token/gửi bổ sung; lỗi cơ sở dữ liệu không liên quan vẫn là response 500 an toàn; kiểm thử hồi quy tập trung vượt qua.
  - Bằng chứng: `authService.register` chỉ ánh xạ conflict SQL Server `2601`/`2627` có tên `UX_Users_Email`; kiểm thử hồi quy route chứng minh response 409 đã phê duyệt và không có trạng thái người dùng/token được lưu.

- [x] **FE02-T063 - Giữ trạng thái tài khoản hiện tại qua các thao tác ghi khi đăng nhập.**
  - Ánh xạ tới: FR-FE02-004, FR-FE02-006, FR-FE02-008, FR-FE02-009; INV-FE02-004, INV-FE02-007; NFR-FE02-TXN-002 (`contradicts`).
  - DoD: lần đăng nhập thất bại, tự động mở khóa đã hết hạn và thao tác ghi đăng nhập/phiên thành công chỉ áp dụng cho trạng thái đã lưu hiện tại đủ điều kiện; hủy kích hoạt đồng thời không thể chuyển thành `LOCKED` hoặc nhận phiên refresh, còn khóa mới hơn không thể bị xóa bởi thao tác mở khóa đã cũ; kiểm thử hồi quy repository và route vượt qua.
  - Bằng chứng: thao tác ghi repository hiện bảo vệ trạng thái hiện tại trong các ranh giới transaction có sẵn; kiểm thử hồi quy route bao phủ hủy kích hoạt trong đăng nhập thất bại/thành công và tự động mở khóa đã cũ, còn kiểm thử FE02 tập trung vượt qua 66/66.

## Giai đoạn 6: Hội tụ

- [x] **FE02-T064 - Thất bại an toàn khi email OTP thay đổi mật khẩu không được gửi.**
  - Ánh xạ tới: MF-FE02-006, FR-FE02-010, API `/change-password/request-otp` (`partial`).
  - DoD: endpoint request chỉ trả về thành công khi adapter email trực tiếp của FE02 xác nhận đã gửi; thiếu SMTP hoặc lỗi nhà cung cấp trả về lỗi an toàn mà không tuyên bố OTP đã được gửi hoặc ghi log chi tiết nhà cung cấp; kiểm thử hồi quy tập trung vượt qua.
  - Bằng chứng: đường OTP thay đổi mật khẩu trực tiếp hiện yêu cầu `sent: true`, ánh xạ SMTP không khả dụng/lỗi nhà cung cấp sang `EMAIL_DELIVERY_FAILED` an toàn và chỉ ghi audit request sau khi xác nhận gửi; route xác thực tập trung vượt qua 50/50, frontend hồ sơ vượt qua 6/6 và traceability FE02 vượt qua 27/27.

## Giai đoạn 7: Hội tụ schema staging

- [x] **FE02-T065 - Đối soát ràng buộc token OTP thay đổi mật khẩu đã triển khai trước khi khởi động.**
  - Ánh xạ tới: MF-FE02-006, FR-FE02-010, NFR-FE02-DEP-001.
  - DoD: package staging bao gồm migration ràng buộc `CHANGE_PASSWORD_OTP` đã rà soát; quá trình khởi động bỏ qua khi tương thích, áp dụng khi đã cũ, xác minh postcondition và fail closed trước khi lắng nghe nếu thất bại.
  - Bằng chứng: kiểm thử hồi quy sẵn sàng schema và khởi động vượt qua 9/9; chính sách triển khai chứng minh migration được đóng gói cùng backend.

## Giai đoạn 8: Hội tụ

- [x] **FE02-T066 - Từ chối định danh đăng ký trùng lặp trước khi gửi OTP.**
  - Ánh xạ tới: MF-FE02-001, AF-FE02-001, BR-FE02-001, FR-FE02-001, FR-FE02-015, AC-FE02-001, EC-FE02-003 (`partial`).
  - Phụ thuộc: FE02-T010, FE02-T020, FE02-T025.
  - DoD: `POST /api/auth/register` trả về `409 EMAIL_ALREADY_REGISTERED` hoặc `409 USERNAME_ALREADY_REGISTERED` tương ứng cho giá trị trùng lặp tồn tại trước và đồng thời; không tạo người dùng mới, token xác minh hoặc request gửi OTP; frontend vẫn ở biểu mẫu đăng ký với phản hồi theo trường và chỉ vào bước OTP sau khi đăng ký thành công; kiểm thử hồi quy backend/frontend tập trung vượt qua.
  - Bằng chứng: `authService.register` kiểm tra username/email đã chuẩn hóa trước trạng thái xác minh và ánh xạ cả hai conflict tranh chấp unique; kiểm thử hồi quy trùng lặp khi đăng ký chứng minh không có trạng thái người dùng/token/request bổ sung; frontend giữ phản hồi tiếng Việt về trùng lặp ở bước 1. Backend tập trung vượt qua 62/62, frontend 242/242, lint/build và traceability vượt qua.

## Giai đoạn 9: Củng cố runtime và session-audit 2026-08-01

- [x] **FE02-T067 - Củng cố bcrypt, OTP response, HTTPS và audit session nguyên tử.**
  - Ánh xạ tới: BR-FE02-005, BR-FE02-011, BR-FE02-016, BR-FE02-017, BR-FE02-020; AC-FE02-024; NFR-FE02-SEC-001/003/015, NFR-FE02-TXN-002, NFR-FE02-LOG-001/002.
  - Bằng chứng: commit `3a87ee8`, PR #95, foundation checks thành công, CI sau merge `30711057582` và staging deployment `30711210037` trên `e01585a`; kiểm thử auth/config/HTTPS tập trung, backend đầy đủ, coverage, system/E2E/deployment, traceability và secret scan đạt trong lô đã duyệt.
  - Ranh giới: hoàn tất fail-fast bcrypt, loại debug OTP, HTTPS `/api`, audit nguyên tử cho đăng nhập thành công/đăng xuất; audit login attempt/failure/lock/auto-unlock vẫn ngoài phạm vi và không được suy diễn là fail-closed.
