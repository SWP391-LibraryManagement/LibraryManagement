# Kế hoạch triển khai UX xác thực và OTP

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Mang lại trải nghiệm xác thực rõ ràng, có thể phục hồi để đăng ký, xác minh OTP gồm
sáu chữ số, đăng nhập, quên mật khẩu và đặt lại mật khẩu mà không thay đổi quy tắc ủy quyền máy chủ
hoặc lưu giữ lâu dài.

**Kiến trúc:** Đảm bảo tính bảo mật của FE02 và các quyết định của API trong thông số chức năng đã
được phê duyệt. Thêm trình trợ giúp UX giao diện người dùng thuần túy để che email, hướng dẫn mật
khẩu, xác thực trường, chuẩn hóa OTP và thời gian chờ gửi lại 60 giây đã được phê duyệt. Các thành
phần trang hiện có sở hữu trạng thái yêu cầu, trong khi thẻ xác thực trình bày hiển thị tiến trình,
lỗi nội tuyến, trạng thái đang chờ xử lý và hành vi tiêu điểm có thể truy cập.

**Tech bộ công nghệ:** Các thành phần React 19, React Router 7, MUI đã được cài đặt, các điểm cuối FE02
REST hiện có, CSS trong `frontend/src/styles/login.css` và
`frontend/src/styles/forgot-password.css`, trình chạy thử Node.

## Ràng buộc toàn cầu

- FE02 `SPEC.md` và `docs/api/api-contract.md` vẫn là nguồn thông tin chính xác cho hành vi xác thực.
- Email sáu chữ số OTP là luồng xác minh/đặt lại tương tác chính; tải trọng liên kết mã thông báo cũ vẫn được chấp nhận để tương thích và thiết lập tài khoản.
- Thời gian hồi chiêu gửi lại của máy khách là 60 giây sau khi yêu cầu gửi lại thành công.
- Không có ủy quyền máy chủ, lược đồ cơ sở dữ liệu, chính sách mật khẩu, hết hạn mã thông báo hoặc thay đổi quy tắc trạng thái tài khoản.
- Giữ nguyên tất cả các giá trị biểu mẫu không bí mật sau khi xác thực hoặc lỗi API có thể phục hồi.
- Chỉ xóa các trường mật khẩu sau khi tạo tài khoản thành công hoặc đặt lại mật khẩu.
- Không bao giờ ghi lại hoặc hiển thị mật khẩu, OTP, mã thông báo truy cập, mã thông báo làm mới, giá trị SMTP, lỗi API thô hoặc dấu vết bộ công nghệ.
- Giữ các câu trả lời quên mật khẩu chung chung để giao diện người dùng không tiết lộ liệu tài khoản có tồn tại hay không.
- Sử dụng TDD để thay đổi hành vi và cam kết sau mỗi tác vụ có thể xem xét độc lập.

---

## Cấu trúc tệp

- Sửa đổi `.sdd/specs/feat-auth/SPEC.md`: căn chỉnh các luồng FE02 đã được phê duyệt và tiêu chí chấp nhận với OTP cùng với khả năng tương thích của mã thông báo cũ.
- Sửa đổi `.sdd/specs/feat-auth/PLAN.md`: ghi lại thời gian lưu trữ/hết hạn của OTP và phần UX giao diện người dùng đã được phê duyệt.
- Sửa đổi `.sdd/specs/feat-auth/TASKS.md`: thêm các tác vụ tăng cường UX cho giao diện người dùng.
- Sửa đổi `.sdd/specs/feat-auth/CHANGELOG.md`: ghi lại sự liên kết hợp đồng và phạm vi UX.
- Sửa đổi `docs/api/api-contract.md`: tài liệu OTP yêu cầu các lựa chọn thay thế và yêu cầu xác nhận đăng ký.
- Tạo `frontend/src/utils/authUx.js`: trình trợ giúp che giấu và xác thực bản trình bày xác thực thuần túy.
- Tạo `frontend/test/authUxFrontend.test.js`: hợp đồng UX xác thực cấp nguồn và thuần túy.
- Sửa đổi `frontend/src/api/authApi.js`: xóa ghi nhật ký bảng điều khiển mang thông tin xác thực và duy trì phản hồi API an toàn.
- Sửa đổi `frontend/src/page/RegisterPage.jsx`: đăng ký, OTP, gửi lại và trạng thái hồi chiêu.
- Sửa đổi `frontend/src/component/register/AuthCard.jsx`: tiến trình hai bước, trường nội tuyến, tiêu điểm OTP, trạng thái gửi lại và hoàn thành.
- Sửa đổi `frontend/src/component/register/FormInput.jsx`: hỗ trợ cấu hình đầu vào có thể truy cập.
- Sửa đổi `frontend/src/component/register/PasswordInput.jsx`: khả năng hiển thị mật khẩu có thể truy cập và hỗ trợ lỗi trường.
- Sửa đổi `frontend/src/component/register/RegisterFormHeader.jsx`: tiêu đề và hướng dẫn tiếng Việt từng bước.
- Sửa đổi `frontend/src/page/LoginPage.jsx`: định tuyến người dùng thành công thông qua `/home` nhận biết vai trò.
- Sửa đổi `frontend/src/component/login/LoginForm.jsx`: nhãn nhất quán, phản hồi an toàn và khả năng kiểm soát khả năng hiển thị có thể truy cập.
- Sửa đổi `frontend/src/component/forgotpassword/ForgotPasswordForm.jsx`: Phục hồi OTP, đích đến được che giấu, thời gian hồi chiêu, hướng dẫn mật khẩu và hoàn thành.
- Sửa đổi `frontend/src/styles/login.css`: bước đăng ký/đăng nhập, trường, OTP và kiểu phản hồi.
- Sửa đổi `frontend/src/styles/forgot-password.css`: trạng thái phục hồi, thời gian hồi chiêu và kiểu di động.

---

### Nhiệm vụ 1: Căn chỉnh các hợp đồng FE02 OTP

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-auth/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-auth/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-auth/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-auth/CHANGELOG.md`
- Sửa đổi: `docs/api/api-contract.md`

**Giao diện:**
- Tạo ra: các lựa chọn thay thế yêu cầu được phê duyệt `{ email, otp }` hoặc `{ token }`, quy tắc OTP gồm sáu chữ số, thời gian hồi chiêu của máy khách là 60 giây và các tác vụ UX có thể theo dõi.
- Tiêu thụ: hành vi tương thích máy chủ hiện tại trong `authService.verifyEmail` và `authService.resetPassword`.

- [ ] **Bước 1: Cập nhật các yêu cầu và quy trình chính của FE02**

Ghi lại rằng đăng ký sẽ gửi OTP gồm sáu chữ số với thời hạn sử dụng là 24 giờ, đặt lại sẽ gửi OTP
gồm sáu chữ số với thời gian hết hạn là 15 phút, xác thực thành công sẽ tiêu tốn OTP và tải trọng mã
thông báo vẫn được chấp nhận cho các liên kết/thiết lập tài khoản cũ.

- [ ] **Bước 2: Cập nhật ví dụ về yêu cầu API**

Sử dụng các tải trọng chính sau:

```json
{ "email": "user@example.test", "otp": "123456" }
```

```json
{ "email": "user@example.test", "otp": "123456", "newPassword": "NewPassword1!" }
```

Đồng thời ghi lại `{ "token": "legacy-token" }` và `{ "token": "setup-token", "newPassword":
"NewPassword1!" }` làm lựa chọn thay thế tương thích.

- [ ] **Bước 3: Xác minh tính nhất quán của tài liệu**

Chạy:

```powershell
rg -n "six-digit|6 chữ số|60-second|60 giây|legacy token|email.*otp" .sdd/specs/feat-auth docs/api/api-contract.md
git diff --check
```

Dự kiến: có OTP và các quyết định về thời gian hồi chiêu; kiểm tra khác biệt thoát khỏi `0`.

- [ ] **Bước 4: Cam kết căn chỉnh hợp đồng**

```powershell
git add .sdd/specs/feat-auth docs/api/api-contract.md docs/superpowers/plans/2026-07-14-auth-otp-ux.md
git commit -m "docs: align FE02 with OTP authentication UX"
```

---

### Nhiệm vụ 2: Hợp đồng thuần túy xác thực UX và lỗi API an toàn

**Tệp:**
- Tạo: `frontend/src/utils/authUx.js`
- Tạo: `frontend/test/authUxFrontend.test.js`
- Sửa đổi: `frontend/src/api/authApi.js`

**Giao diện:**
- Sản xuất: `RESEND_COOLDOWN_SECONDS`, `maskEmail`, `getPasswordRequirements`, `validateRegistrationFields` và `normalizeOtp`.
- Tiêu thụ: Chính sách mật khẩu FE02 gồm hơn 8 ký tự bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.

- [ ] **Bước 1: Viết các kiểm thử tiện ích không thành công**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  RESEND_COOLDOWN_SECONDS,
  getPasswordRequirements,
  maskEmail,
  normalizeOtp,
  validateRegistrationFields,
} from '../src/utils/authUx.js';

test('auth UX masks email without exposing the full local part', () => {
  assert.equal(maskEmail('nhat@example.com'), 'n***t@example.com');
  assert.equal(maskEmail('a@example.com'), 'a***@example.com');
});

test('auth UX enforces the approved password guidance', () => {
  assert.deepEqual(getPasswordRequirements('Password1!'), {
    minLength: true,
    uppercase: true,
    lowercase: true,
    number: true,
    special: true,
  });
});

test('registration validation maps errors to fields and keeps a 60 second cooldown', () => {
  assert.equal(RESEND_COOLDOWN_SECONDS, 60);
  assert.deepEqual(
    validateRegistrationFields({ fullName: '', username: 'ab', email: 'bad', password: 'weak', confirmPassword: 'other' }),
    {
      fullName: 'Vui lòng nhập họ và tên.',
      username: 'Tên đăng nhập phải có từ 3 đến 50 ký tự.',
      email: 'Vui lòng nhập địa chỉ email hợp lệ.',
      password: 'Mật khẩu chưa đáp ứng đủ yêu cầu.',
      confirmPassword: 'Xác nhận mật khẩu không khớp.',
    },
  );
  assert.equal(normalizeOtp('12a 34-56'), '123456');
});
```

- [ ] **Bước 2: Chạy kiểm thử để xác minh RED**

```powershell
cd frontend
node --test test/authUxFrontend.test.js
```

Dự kiến: THẤT BẠI vì `src/utils/authUx.js` không tồn tại.

- [ ] **Bước 3: Triển khai pure helpers**

Chỉ thực hiện các giao diện đã xuất ở trên. `normalizeOtp` loại bỏ các chữ số không và giới hạn đầu
ra ở sáu ký tự. `validateRegistrationFields` trả về một đối tượng chỉ chứa các trường không hợp lệ.

- [ ] **Bước 4: Thêm hợp đồng nguồn API an toàn**

Thêm một kiểm thử có nội dung `src/api/authApi.js` và khẳng định nó không chứa `console.error`,
`debugOtp`, `debugVerificationToken` hoặc `debugResetToken`.

- [ ] **Bước 5: Xóa ghi nhật ký bảng điều khiển mang thông tin xác thực**

Xóa `console.error('Login API error:', error)` khỏi `loginAccount`; duy trì hành vi tin nhắn `Error`
tiếng Việt an toàn hiện có.

- [ ] **Bước 6: Chạy kiểm thử và tìm lỗi mã nguồn**

```powershell
cd frontend
node --test test/authUxFrontend.test.js
npm run lint
```

Dự kiến: tất cả các kiểm thử UX xác thực đều vượt qua và kiểm tra mã thoát khỏi `0`.

- [ ] **Bước 7: Cam kết hợp đồng thuần túy**

```powershell
git add frontend/src/utils/authUx.js frontend/src/api/authApi.js frontend/test/authUxFrontend.test.js
git commit -m "test: define authentication UX contracts"
```

---

### Nhiệm vụ 3: Chi tiết đăng ký và xác minh OTP

**Tệp:**
- Sửa đổi: `frontend/src/page/RegisterPage.jsx`
- Sửa đổi: `frontend/src/component/register/AuthCard.jsx`
- Sửa đổi: `frontend/src/component/register/FormInput.jsx`
- Sửa đổi: `frontend/src/component/register/PasswordInput.jsx`
- Sửa đổi: `frontend/src/component/register/RegisterFormHeader.jsx`
- Sửa đổi: `frontend/src/styles/login.css`
- Kiểm tra: `frontend/test/authUxFrontend.test.js`

**Giao diện:**
- Tiêu thụ: tất cả những người trợ giúp từ `authUx.js` và các cuộc gọi `registerAccount`, `verifyEmail`, `resendVerification` API hiện có.
- Tạo ra: giao diện người dùng đăng ký hai bước, đầu vào OTP gồm sáu chữ số, thời gian chờ gửi lại 60 giây, chuyển giao tiêu điểm và bảo toàn biểu mẫu an toàn.

- [ ] **Bước 1: Thêm hợp đồng nguồn không thành công**

Khẳng định các nguồn đăng ký có chứa:

```js
assert.match(card, /1\. Thông tin tài khoản/);
assert.match(card, /2\. Xác thực email/);
assert.match(card, /inputMode: 'numeric'/);
assert.match(card, /autoComplete: 'one-time-code'/);
assert.match(page, /RESEND_COOLDOWN_SECONDS/);
assert.match(page, /setResendCooldown/);
assert.match(card, /Gửi lại mã/);
```

- [ ] **Bước 2: Chạy kiểm thử để xác minh RED**

```powershell
cd frontend
node --test test/authUxFrontend.test.js
```

Dự kiến: hợp đồng nguồn đăng ký không thành công.

- [ ] **Bước 3: Thêm hỗ trợ đầu vào có thể tái sử dụng**

`FormInput` chấp nhận `inputRef`, `inputProps`, `autoFocus` và `disabled`, chuyển chúng qua MUI
`slotProps.htmlInput` và `inputRef`. `PasswordInput` đặt cho nút hiển thị của mình một nhãn có thể
truy cập bằng tiếng Việt và sử dụng các API khe MUI hiện tại.

- [ ] **Bước 4: Thực hiện đăng ký theo từng bước**

Sử dụng `validateRegistrationFields` trước khi gọi API. Hiển thị văn bản trợ giúp nội tuyến cho từng
trường không hợp lệ, hiển thị danh sách kiểm tra yêu cầu mật khẩu trước khi gửi và giữ giá trị
tên/tên người dùng/email đầy đủ sau khi xác thực hoặc lỗi API.

- [ ] **Bước 5: Triển khai tiêu điểm OTP và gửi lại thời gian hồi chiêu**

Đầu vào OTP chỉ chấp nhận sáu chữ số, sử dụng `inputMode="numeric"`, `autoComplete="one-time-code"`
và nhận tiêu điểm khi bước 2 mở ra. Vô hiệu hóa gửi lại trong khi chờ xử lý và trong 60 giây sau khi
thành công; hiển thị `Gửi lại mã sau Ns` trong thời gian hồi chiêu.

- [ ] **Bước 6: Chạy kiểm thử và tìm lỗi mã nguồn**

```powershell
cd frontend
node --test test/authUxFrontend.test.js test/loginFrontend.test.js
npm run lint
```

Dự kiến: các kiểm thử và kiểm tra mã đạt.

- [ ] **Bước 7: Cam kết đăng ký UX**

```powershell
git add frontend/src/page/RegisterPage.jsx frontend/src/component/register frontend/src/styles/login.css frontend/test/authUxFrontend.test.js
git commit -m "feat: improve registration and OTP verification UX"
```

---

### Nhiệm vụ 4: Tính nhất quán khi đăng nhập và khôi phục

**Tệp:**
- Sửa đổi: `frontend/src/page/LoginPage.jsx`
- Sửa đổi: `frontend/src/component/login/AuthCard.jsx`
- Sửa đổi: `frontend/src/component/login/LoginForm.jsx`
- Sửa đổi: `frontend/src/component/forgotpassword/ForgotPasswordForm.jsx`
- Sửa đổi: `frontend/src/styles/forgot-password.css`
- Kiểm tra: `frontend/test/authUxFrontend.test.js`

**Giao diện:**
- Tiêu thụ: `maskEmail`, `getPasswordRequirements`, `normalizeOtp` và các chức năng đăng nhập/quên/đặt lại API hiện có.
- Tạo ra: chuyển hướng `/home` nhận biết vai trò, phản hồi đăng nhập chung, đích khôi phục được che giấu, tiêu điểm OTP, thời gian hồi chiêu gửi lại khôi phục và một hành động hoàn thành rõ ràng.

- [ ] **Bước 1: Thêm hợp đồng nguồn không thành công**

Khẳng định:

```js
assert.match(loginPage, /navigate\('\/home'\)/);
assert.doesNotMatch(loginPage, /navigate\('\/admin\/users'\)/);
assert.match(recovery, /maskEmail/);
assert.match(recovery, /autoComplete.*one-time-code/);
assert.match(recovery, /RESEND_COOLDOWN_SECONDS/);
assert.match(recovery, /Quay lại đăng nhập/);
```

- [ ] **Bước 2: Chạy kiểm thử để xác minh RED**

```powershell
cd frontend
node --test test/authUxFrontend.test.js
```

Dự kiến: hợp đồng đăng nhập/khôi phục không thành công.

- [ ] **Bước 3: Định tuyến đăng nhập thành công thông qua `/home`**

Lưu trữ dữ liệu xác thực chính xác như hiện nay, sau đó sử dụng một lệnh gọi `navigate('/home')` để
`HomeRoutePage` chọn đúng bảng điều khiển.

- [ ] **Bước 4: Tăng cường UX phục hồi**

Giữ lại phản hồi thành công khi quên mật khẩu chung, che giấu email đích, tập trung đầu vào OTP gồm
sáu chữ số, hiển thị yêu cầu mật khẩu trước khi đặt lại, lưu giữ email sau khi xảy ra lỗi có thể
khôi phục và áp dụng thời gian chờ gửi lại 60 giây đã được phê duyệt bằng `forgotPassword(email)`.

- [ ] **Bước 5: Chạy kiểm thử và tìm lỗi mã nguồn**

```powershell
cd frontend
node --test test/authUxFrontend.test.js test/loginFrontend.test.js
npm run lint
```

Dự kiến: các kiểm thử và kiểm tra mã đạt.

- [ ] **Bước 6: Xác nhận UX đăng nhập/khôi phục**

```powershell
git add frontend/src/page/LoginPage.jsx frontend/src/component/login frontend/src/component/forgotpassword frontend/src/styles/forgot-password.css frontend/test/authUxFrontend.test.js
git commit -m "feat: align login and recovery UX"
```

---

### Nhiệm vụ 5: Cổng xác thực UX xác thực

**Tệp:**
- Chỉ sửa đổi nếu quá trình xác thực cho thấy lỗi trong các tệp được liệt kê trong Nhiệm vụ 2-4.

**Giao diện:**
- Tiêu thụ: phần UX xác thực đã hoàn thành.
- Tạo ra: bằng chứng tự động, đặc tả, đáp ứng, bảo mật và đánh giá của con người.

- [ ] **Bước 1: Chạy kiểm tra tự động**

```powershell
cd frontend
node --test test/authUxFrontend.test.js test/loginFrontend.test.js test/appShellFrontend.test.js
npm run lint
npm run build
```

Dự kiến: tất cả các lệnh thoát `0`.

- [ ] **Bước 2: Chạy kiểm tra bảo mật/nguồn**

```powershell
rg -n "console\.error|debugOtp|debugVerificationToken|debugResetToken" src/api/authApi.js src/page src/component
rg -n "one-time-code|60|maskedEmail|Mật khẩu" src/page/RegisterPage.jsx src/component/register src/component/forgotpassword
```

Dự kiến: không có tham chiếu ghi nhật ký/mã thông báo gỡ lỗi mang thông tin xác thực; OTP và các hợp
đồng hướng dẫn đều có sẵn.

- [ ] **Bước 3: Chạy chấp nhận đáp ứng**

Tại `1440x900`, `1024x900`, `768x900` và `390x844`, xác minh thông tin đăng nhập, chi tiết đăng ký,
OTP đăng ký, email quên mật khẩu, OTP khôi phục và trạng thái hoàn thành. Không có trường, nhãn,
hành động chính hoặc bề mặt phản hồi nào có thể chồng chéo hoặc không thể truy cập được.

- [ ] **Bước 4: Kiểm tra sự khác biệt cuối cùng**

```powershell
git status --short
git diff --check
git diff --stat origin/main...HEAD
```

Dự kiến: chỉ có tài liệu hợp đồng FE02, gói UX xác thực, tệp giao diện người dùng xác thực và các
kiểm thử đã thay đổi.

- [ ] **Bước 5: Cam kết các bản sửa lỗi chỉ xác thực nếu được yêu cầu**

```powershell
git add frontend .sdd/specs/feat-auth docs/api/api-contract.md
git commit -m "fix: close authentication UX validation gaps"
```

Bỏ qua cam kết này khi không cần chỉnh sửa.

---

## Cổng đánh giá con người

Đánh giá chống lại:

- `UX-FE-002`, `UX-FE-003`, `UX-FE-004`, `UX-FE-005`.
- `NFR-UX-001`, `NFR-UX-002`, `NFR-UX-003`.
- `AC-UX-001`, `AC-UX-002`, `AC-UX-003`, `AC-UX-007`, `AC-UX-008`.
- `FR-FE02-001` đến `FR-FE02-005`, `FR-FE02-011`, `FR-FE02-012`, `FR-FE02-015` đến `FR-FE02-019`.

Không bắt đầu dọn dẹp UX trang vận hành cho đến khi Xác thực/OTP vượt qua quá trình kiểm tra tự động
và đánh giá của con người.
