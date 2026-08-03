# Kế hoạch kiểm thử FE02 - Xác thực

## CAPTCHA đăng nhập/đăng ký

- `GET /api/auth/captcha` phát SVG path không chứa text/đáp án cùng token opaque 32 byte; challenge process-local hợp lệ 5 phút, dùng một lần và giới hạn 5.000 bản ghi.
- Service test bao phủ đáp án đúng, sai, sai định dạng, expiry, replay, cleanup và fail-closed khi đầy; challenge đã xác định bị tiêu thụ trước so sánh.
- `POST /api/auth/register` và `POST /api/auth/login` thiếu/sai/replay CAPTCHA trả `400 CAPTCHA_INVALID` trước khi gọi auth service, kể cả trong `NODE_ENV=test`; challenge hợp lệ vẫn đi theo happy path hiện có.
- Frontend kiểm tra payload `captchaToken`/`captchaAnswer`, submit bị vô hiệu hóa khi chưa có token, dữ liệu biểu mẫu được giữ và CAPTCHA được làm mới sau lỗi tải hoặc `CAPTCHA_INVALID`.
- Browser E2E lấy đáp án qua endpoint `/__e2e__/captcha-answer` của test server; production Express app không có endpoint trả đáp án hoặc fake CAPTCHA service.
- Renderer test biến đổi endpoint của path tại hai biên xoay và chứng minh cả 6 glyph cùng stroke nằm trong viewport 180px.
- Frontend utility test chứng minh lần tải ban đầu thử tối đa 2 lần; source-contract test chứng minh đổi mã thủ công không xóa challenge còn dùng được khi request thay thế thất bại.
- Deployment policy test chứng minh preflight/backend/frontend đều so sánh SHA với remote `main` trước bước ghi Azure; smoke test từ chối route CAPTCHA thiếu hoặc response công khai không an toàn.

Phiên bản: 0.3.19
Trạng thái: FE02-T071 H2 APPROVED - PENDING EXACT-HEAD CI/H3
Cập nhật lần cuối: 2026-08-04

Đặc tả nguồn: `.sdd/specs/feat-auth/SPEC.md`
ID tính năng: `BR-FE02-*`, `FR-FE02-*`, `AC-FE02-*`
Ánh xạ AC↔kiểm thử có thẩm quyền: Ma trận truy vết tại §16 của `SPEC.md` (tệp này mô tả chiến lược, không phải danh sách test case).

---

## 1. Phạm vi kiểm thử

Hành vi đăng ký, xác minh email, đăng nhập, làm mới token/đăng xuất, truy vấn người dùng hiện tại, quên/đặt lại mật khẩu và thay đổi mật khẩu.

## 2. Mục tiêu kiểm thử unit

- Hash và so sánh mật khẩu.
- Tạo, xác minh và xử lý hết hạn token.
- Đối soát khi khởi động staging cho ràng buộc loại token `CHANGE_PASSWORD_OTP`.
- Dung sai lệch đồng hồ JWT chính xác 30 giây.
- Xác thực OTP/token đặt lại.
- Xác thực token thiết lập tài khoản FE11 và kích hoạt nguyên tử.
- Xác thực định dạng email/mật khẩu không hợp lệ.
- Kiểm tra trạng thái tài khoản (không hoạt động/bị khóa/tự động mở khóa).

## 3. Mục tiêu kiểm thử API/integration

- `POST /auth/register`: happy path; username/email trùng lặp, bao gồm tranh chấp unique index đồng thời mà không phát sinh lưu/gửi bổ sung; mật khẩu yếu không được lưu; dữ liệu đầu vào không hợp lệ.
- Ranh giới OTP FE02/FE10: luồng đăng ký và đặt lại mật khẩu gửi đúng một lần gọi bên yêu cầu gắn với FE02 cùng ID nguồn `AuthToken` và tính idempotent theo ID token; gửi trực tiếp trùng lặp bị từ chối trong khi `CHANGE_PASSWORD_OTP` vẫn thuộc quyền sở hữu của FE02.
- `POST /auth/verify-email`: happy path chuẩn bằng email/OTP và token cũ, thông tin xác thực không hợp lệ/hết hạn, hoàn tất nguyên tử việc kích hoạt/token/audit và từ chối tài khoản đã bị hủy kích hoạt ở trạng thái cuối mà không tiêu thụ thông tin xác thực.
- `POST /auth/resend-verification`: tài khoản tự đăng ký đủ điều kiện đang chờ, người dùng không xác định, tài khoản đã hủy kích hoạt và tài khoản thiết lập do quản trị viên tạo.
- `POST /auth/login`: happy path, sai mật khẩu, cửa sổ thất bại trượt chính xác 15 phút, khôi phục chờ xác minh sau khi chứng minh mật khẩu, xử lý chung cho tài khoản không xác định/đã hủy kích hoạt/tài khoản thiết lập do quản trị viên tạo bao gồm tài khoản tự đăng ký đang chờ đã bị hủy kích hoạt, tài khoản bị khóa, tự động mở khóa có chốt bảo vệ, hủy kích hoạt đồng thời trong lần đăng nhập thất bại/thành công và các sự kiện audit lý do/khóa an toàn.
- `POST /auth/refresh-token`: happy path, token hết hạn, token không hợp lệ.
- Gán vai trò khi đăng ký: tự đăng ký tạo đúng một ánh xạ `Member` và không thể tạo vai trò Librarian/Admin.
- Phân quyền và giao thức truyền: hành động được bảo vệ sử dụng `UserRoles` hiện tại; request xác thực HTTP đã triển khai được chuyển hướng hoặc từ chối trước khi xử lý thông tin xác thực.
- Trạng thái hiện tại của request được bảo vệ: token được cấp trước khi người dùng chuyển thành `INACTIVE` hoặc `LOCKED` bị từ chối trước khi xử lý nghiệp vụ, trong khi phiên đang hoạt động được liên kết vẫn tiếp tục hoạt động.
- Lỗi token được bảo vệ: debug log chỉ chứa mã lỗi ổn định, không bao giờ chứa token được gửi lên và bị tắt trừ khi được cấu hình rõ ràng.
- Giao thức HTTPS: request xác thực qua HTTP thuần bị từ chối trước khi phân luồng body/auth, HTTPS từ proxy đáng tin cậy được chấp nhận và chế độ chuyển hướng explicit sang canonical host được kiểm thử.
- `POST /auth/logout`: happy path, token không hợp lệ.
- `POST /auth/change-password` (+ `/request-otp`, `/confirm`): happy path, sai mật khẩu cũ, tái sử dụng mật khẩu, OTP không hợp lệ, chưa xác thực.
- `POST /auth/forgot-password`, `/reset-password`: ngữ nghĩa request chung; thành công chuẩn bằng email/OTP và token cũ; thông tin xác thực không hợp lệ/hết hạn/tái sử dụng; mật khẩu yếu không làm thay đổi dữ liệu.
- `POST /auth/reset-password` với `ACCOUNT_SETUP`: kích hoạt nguyên tử, từ chối token không hợp lệ/đã dùng/bị thu hồi/không đủ điều kiện/đồng thời và không cho phép thông tin xác thực có mục đích đặt lại kích hoạt tài khoản.
- `GET /auth/me`: happy path đã xác thực, lỗi chưa xác thực.
- Khôi phục frontend FE02: một lần thử refresh sau lỗi 401, lưu access token thay thế trong cơ chế lưu trữ đã chọn, không tạo vòng lặp thử lại, xóa trạng thái xác thực/chuyển hướng sau khi khôi phục thất bại và điều hướng đến `/verify-email` sau response đăng nhập ổn định cho trường hợp chờ xác minh.
- Inject lỗi giao dịch: các thay đổi bắt buộc đối với người dùng/token/audit cùng rollback cho đăng ký, đăng nhập/tạo phiên, thay đổi mật khẩu và đặt lại mật khẩu.
- Hiệu năng: response đăng nhập hợp lệ dưới 1 giây và xác thực access token dưới 50 ms tại p95 trong môi trường và định nghĩa mẫu có thể lặp lại.

## 4. Luồng nghiệm thu E2E/thủ công

- Đăng ký → xác minh email → đăng nhập → xem tài khoản hiện tại → thay đổi mật khẩu → quên/đặt lại mật khẩu.

## 5. Bằng chứng hiện tại

- `backend/tests/authRoutes.test.js`
- `backend/tests/authUtils.test.js`
- Bằng chứng FE02 tập trung: 62/62 kiểm thử auth route/repository vượt qua vào 2026-07-28, bao gồm từ chối username/email trùng lặp hiện có và đồng thời trước khi có trạng thái xác minh, thao tác ghi trạng thái hiện tại khi đăng nhập, từ chối tự động mở khóa đã cũ, chốt bảo vệ xác minh khi hủy kích hoạt ở trạng thái cuối, rollback audit bắt buộc, ghi log xác thực an toàn và khóa theo cửa sổ trượt chính xác.
- Bằng chứng frontend: 242/242 kiểm thử, lint và production build vượt qua vào 2026-07-28; đăng ký giữ phản hồi username/email trùng lặp trước bước OTP, còn đăng nhập vẫn điều hướng tài khoản tự đăng ký đủ điều kiện đang chờ đến `/verify-email`.
- Bằng chứng liên tính năng về tài khoản không hoạt động: các suite FE04/FE07/FE08 tập trung vượt qua 114/114 với hợp đồng `401 INVALID_TOKEN` trước handler của FE02.
- Lần chạy lại toàn bộ backend: 60/61 suite và 1048/1050 kiểm thử vượt qua; mọi suite FE02 đều vượt qua và chỉ có hai assertion về tách biệt DNS/mock tồn tại từ trước trong `dbConfig.test.js` đối với `sql.example.test` thất bại.
- Bằng chứng giao thức tập trung: `backend/tests/httpsEnforcement.test.js` vượt qua `3/3`.
- FE02-T043 ghi lại snapshot lịch sử gồm 924/924 kiểm thử backend đầy đủ và 209/209 kiểm thử frontend đầy đủ; phần FE02/FE10 tập trung trong lịch sử vượt qua 170/170 trước khi các kiểm thử hồi quy xác thực về sau được thêm vào. Các số liệu này không phải kết quả xác minh hiện tại cho đợt đối soát đang mở.
- Candidate lịch sử T043: commit `241907d`, PR #60 head `50e9091`, merge `c052b50`; exact-head CI `29875668029`, post-merge CI `29875885463` và staging `29876046500` đều thành công; PR #60 không có GitHub review record.
- Focused current rerun 2026-08-03: backend `authRoutes`, `authUtils`, `httpsEnforcement` đạt 3 suite/68 kiểm thử; frontend `authUxFrontend` + `loginFrontend` đạt 17/17.
- L1 amendment trước H2 vòng 2: backend 75 suite/1202 test PASS; frontend 281/281, lint/build PASS; Playwright 16/16; deployment 20/20; secret/audit/trace/diff gates PASS.
- CAPTCHA security remediation 2026-08-04: service/renderer và route regression đạt 2 suite/9 kiểm thử sau RED-GREEN; backend full/coverage đạt 78 suite/1221 test; system 11/11; frontend 285/285 cùng lint/build; browser E2E 16/16; deployment 20/20; secret/audit/trace/import/diff gates đạt. PR #111 sau đó đạt exact-head CI/H3 và merge thành `1f0905f`.
- FE02-T071 2026-08-04: focused CAPTCHA service/route `11/11`, frontend recovery/wiring `5/5`, deployment `27/27`; full backend `78 suite/1223 test`; system `11/11`; coverage isolated rerun `78 suite/1223 test` với statements `91.98%`, branches `81.28%`, functions `97.08%`, lines `91.94%`; frontend `288/288` cùng lint/build; Playwright `16/16`; secret/audit/trace/import/YAML/diff gates đạt. Lần coverage đầu chạy đồng thời với E2E có một timeout 5 giây ở test FE05 không liên quan; rerun riêng theo policy flake đã đạt toàn bộ. H2 đã phê duyệt complete diff trước commit.
- Traceability: tất cả 27 ID FR của FE02 có độ bao phủ `@spec` (**100%**) khi chạy `npm run trace:enforce`.
- Bằng chứng hiệu năng: `npm.cmd run phase3:performance` ngày 2026-07-27 vượt qua NFR-FE02-PERF-001/004 trong môi trường cục bộ xác định đã ghi nhận: 30 mẫu đăng nhập hợp lệ có p95 `61.46 ms` và 50 mẫu `/api/auth/me` có p95 `1.52 ms`, với chi phí bcrypt 10; kiểm thử harness vượt qua 3/3 và các giới hạn SQL/mạng vẫn được ghi nhận.

## 6. Khoảng trống

- Các ngưỡng độ bao phủ toàn cục của Jest đã cấu hình đều đạt đối với statement, branch, function và line.
- Nghiệm thu thủ công, tích hợp PR và CI chính xác sau merge trên `main` đã vượt qua cho ranh giới gửi FE10 được inject; việc gửi SMTP thực sau đó được quan sát là PASS trong lần chạy `c6e0c46421f0`.
- Staging run `30855663766` đã deploy merge SHA `1f0905f`, nhưng run cũ `30847497053` cho SHA `908f067` chạy sau và ghi đè; FE02-T071 phải chứng minh guard SHA và smoke CAPTCHA trước khi đóng khoảng trống vận hành này.

Chủ sở hữu cổng tích hợp còn lại:

- FE02-T071: full local gate, H2, exact-head CI, H3, merge và exact post-merge staging verification; không dùng trạng thái xanh của `/health` thay cho route CAPTCHA.

## 7. Lệnh/bằng chứng bắt buộc trước khi merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
