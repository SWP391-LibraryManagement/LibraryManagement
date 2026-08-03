# Kế hoạch thực hiện hòa giải quản trị và giải phóng

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Đối chiếu Nguồn chuẩn SDD đã được phê duyệt và bằng chứng phát hành hiện tại với việc
triển khai đã được hợp nhất tại `main` mà không thay đổi hoạt động kinh doanh, API hoặc hành vi bảo
mật hay tạo thẻ phát hành.

**Kiến trúc:** Đây là phiên bản kết hợp SDD + ADD. Công việc cốt lõi được giới hạn ở việc đồng bộ
hóa hợp đồng phân phối OTP của FE02 với ranh giới người yêu cầu FE10 đã triển khai. Các bản cập nhật
lớp bao Work phát hành siêu dữ liệu, trạng thái kế hoạch kiểm thử, bằng chứng bản địa hóa, bối cảnh cũ
và các nhãn tiếng Việt chỉ có phần trình bày còn lại. Không có thay đổi nào về máy chủ, cơ sở dữ
liệu, API, quyền hoặc hành vi triển khai được ủy quyền.

**bộ công nghệ công nghệ:** Tạo phẩm Markdown/SDD, siêu dữ liệu Git, tập lệnh xác thực Node.js,
Jest, Trình chạy kiểm thử nút, Vite, Playwright, GitHub Bằng chứng hành động.

## Ràng buộc toàn cầu

- Bảo tồn bộ công nghệ Node.js + Express.js, React + Bootstrap, SQL Server, REST đã được phê duyệt.
- Không thay đổi hành vi kinh doanh, lược đồ, tải trọng API, quyền hoặc cấu hình triển khai. Các thay đổi về nguồn giao diện người dùng được giới hạn ở các nhãn chỉ dành cho bản trình bày đã được yêu cầu bởi thiết kế bản địa hóa được phê duyệt cộng với phần tiếp theo vỏ HomePage đáp ứng H3 được người yêu cầu phê duyệt được ghi lại trong thiết kế đó.
- Giữ `SPEC.md` làm nguồn thông tin chính xác và ghi lại những thay đổi hành vi có thể quan sát được trong nhật ký thay đổi chức năng.
- Sự chấp thuận H2 của con người được ghi lại cho các cam kết đã công bố `962ceb1` và `daaeea6`;
  H3 vẫn cần thiết trước khi hợp nhất.
- Không yêu cầu phê duyệt H3, hợp nhất, tạo `v1.0.3` hoặc xuất bản video từ lô này.
- Xác thực tất cả bốn lớp: kiểm tra tự động, tuân thủ đặc tả, cấu trúc/an toàn và bằng chứng chấp nhận.

---

### Nhiệm vụ 1: Đối chiếu FE02 OTP Nguồn gốc sự thật

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-auth/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-auth/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-auth/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-auth/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/PLAN.md`
- Đánh giá: `.sdd/specs/feat-auth/TASKS.md`, `.sdd/specs/feat-notification-management/SPEC.md`, `.sdd/rfcs/ADR-004-auth-otp-notification-boundary.md`

**Giao diện:**
- Tiêu thụ: ranh giới `createSourceNotificationRequester('FE02')` đã triển khai và các hợp đồng FE02/FE10 hiện có.
- Tạo ra: một hợp đồng FE02 duy nhất nêu rõ rằng FE02 tạo/xác thực OTP và FE10 hiển thị/cung cấp thông báo xác minh và đặt lại thông qua người yêu cầu gắn với FE02.

- [x] **Bước 1: Xác định tất cả các tuyên bố bàn giao trực tiếp FE02 mâu thuẫn**

Chạy:

```powershell
rg -n 'directly through `emailService`|direct email|requester-bound|token-ID idempotency|FE10 requester' .sdd/specs/feat-auth/SPEC.md .sdd/specs/feat-auth/TASKS.md .sdd/specs/feat-notification-management/SPEC.md .sdd/rfcs/ADR-004-auth-otp-notification-boundary.md
```

Dự kiến: mọi tuyên bố phân phối xác minh/đặt lại FE02 đều được xác định trước khi chỉnh sửa.

- [x] **Bước 2: Cập nhật các quy tắc và yêu cầu của FE02 để phù hợp với ranh giới FE10 đã được phê duyệt**

Chỉ thay đổi báo cáo xác minh/đặt lại bàn giao. Duy trì đường dẫn email `CHANGE_PASSWORD_OTP` trực
tiếp riêng biệt, khả năng tương thích mã thông báo cũ, hành vi quên mật khẩu chung và lỗi gửi không
chặn. Cập nhật siêu dữ liệu phiên bản/trạng thái và thêm mục nhật ký thay đổi có ngày giải thích
rằng điều này sẽ đồng bộ hóa đặc tả với quá trình triển khai đã được hợp nhất.

- [x] **Bước 3: Xác minh hợp đồng FE02/FE10 có nhất quán nội bộ**

Chạy lại lệnh từ Bước 1 và kiểm tra các kết quả khớp còn lại. Dự kiến: không có tuyên bố FE02 nào
yêu cầu xác minh trực tiếp/gửi lại; FE02 tham chiếu `createSourceNotificationRequester('FE02')` hoặc
hợp đồng ràng buộc với người yêu cầu tương đương.

---

### Nhiệm vụ 2: Làm mới siêu dữ liệu chức năng và kiểm tra chuẩn

**Tệp:**
- Sửa đổi: `.sdd/test-plan.md`
- Sửa đổi: `.sdd/specs/feat-fine-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-auth/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-public-browse/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-public-browse/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-membership-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-membership-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-book-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-book-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-inventory-book-copy/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-inventory-book-copy/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-inventory-book-copy/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-inventory-book-copy/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-fine-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-fine-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/TASKS.md`
- Đánh giá: tất cả `.sdd/specs/feat-*/PLAN.md`, `TASKS.md` và `TEST_PLAN.md` còn lại

**Giao diện:**
- Tiêu thụ: số lượng đối chiếu cục bộ mới từ cổng xác thực và bằng chứng thoát ra Giai đoạn 2/3.
- Tạo ra: dữ liệu sẵn sàng cho kế hoạch kiểm tra hiện tại và ghi chú rõ ràng rằng các cổng lịch sử cũ chưa được kiểm tra sẽ được thay thế bằng gói thoát Giai đoạn 2 đã ghi ngày thay vì bị xóa âm thầm.

- [x] **Bước 1: Ghi lại khoảng không quảng cáo tự động hiện tại**

Cập nhật siêu dữ liệu `.sdd/test-plan.md` lên `Last Updated: 2026-07-20` và ghi lại mốc cơ sở đối
chiếu cục bộ mới: 917 kiểm thử máy chủ, 172 kiểm thử giao diện người dùng, 53 bộ máy chủ, độ bao phủ
được định cấu hình trên 92%, 10 kiểm thử tích hợp hệ thống và 4 bộ trình duyệt E2E. Giữ kết quả 171
xét nghiệm lịch sử của lần chạy CI từ xa khác biệt với mốc cơ sở cục bộ sau này.

- [x] **Bước 2: Đối chiếu bảng sẵn sàng**

Cập nhật bảng sẵn sàng để FE01-FE12 được đánh dấu là hoàn thành cho phạm vi Giai đoạn 1 đã được phê
duyệt, đồng thời giữ lại các ranh giới trì hoãn rõ ràng và liên kết
`.sdd/reviews/phase2-full-exit-validation-2026-07-19.md` làm bằng chứng thay thế.

- [x] **Bước 3: Bình thường hóa các tiêu đề/bộ đếm chức năng cũ còn lại**

Thay đổi tiêu đề `READY FOR REVIEW` cũ của FE09 thành trạng thái cơ sở đã được phê duyệt, cập nhật
bộ đếm dấu vết lịch sử của FE08 thành `29/29` và thêm ghi chú thay thế ngắn vào FE02/FE11 các khu
vực danh sách kiểm tra lược đồ trỏ đến bằng chứng di chuyển đã hợp nhất. Không xóa các hàng danh
sách kiểm tra lịch sử.

---

### Nhiệm vụ 3: Đối chiếu các tài liệu phát hành và quản trị

**Tệp:**
- Sửa đổi: `README.md`
- Sửa đổi: `plan.md`
- Sửa đổi: `document/FinalRelease.md`
- Sửa đổi: `docs/release/final-submission-checklist-2026-07-20.md`
- Sửa đổi: `docs/release/phase3-final-report.md`
- Sửa đổi: `.sdd/reviews/final-governance-closeout-validation-2026-07-20.md`
- Sửa đổi: `.agents/CLAUDE.md`

**Giao diện:**
- Tiêu thụ: gắn thẻ `v1.0.2` tại `c988af1`, mốc cơ sở ứng dụng đã được xác thực `cce59d0`, PR #54/#57/#58, CI chạy `29712597463` và chạy thử `29712612188`.
- Tạo ra: tài liệu giúp phân biệt tạo phẩm `v1.0.2` đã xuất bản với mốc cơ sở ứng dụng đã được xác thực chưa được gắn thẻ và ghi lại các quyết định còn lại của con người.

- [x] **Bước 1: Nêu rõ phần chia phát hành hiện tại**

Tài liệu cho thấy `v1.0.2` được xuất bản tại `c988af1`, trong khi `cce59d0` là cơ sở ứng dụng đã
được xác thực 20 cam kết trước đó. `v1.0.3` trong tương lai phải trỏ đến `main` SHA được xem xét sau
đó sau khi sự đối chiếu này hợp nhất; không tạo thẻ.

- [x] **Bước 2: Đóng từ ngữ cũ đã sẵn sàng cho H2 mà không cần phê duyệt phát minh**

Thêm phụ lục sau tích hợp vào danh sách kiểm tra gửi và xác thực quản trị cuối cùng ghi lại hợp nhất
PR #54, CI thành công và thẻ đã xuất bản. Giữ lưu ý rõ ràng rằng việc đối chiếu này yêu cầu H2/H3
riêng và CI chính xác sau hợp nhất trước bất kỳ quyết định thẻ phát hành nào sau này.

- [x] **Bước 3: Đồng bộ bộ nhớ dự án**

Cập nhật `.agents/CLAUDE.md`, `README.md`, `plan.md` và `document/FinalRelease.md` để quan sát SMTP
hiện tại, bản địa hóa tiếng Việt, trạng thái chính hiện tại và ranh giới trì hoãn đều đồng ý.

---

### Nhiệm vụ 4: Đóng bằng chứng bản địa hóa tiếng Việt

**Tệp:**
- Sửa đổi: `docs/superpowers/specs/2026-07-20-vietnamese-ui-localization-design.md`
- Sửa đổi: `docs/superpowers/plans/2026-07-20-vietnamese-ui-localization.md`
- Tạo: `.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md`

**Giao diện:**
- Tiêu thụ: PR #58 đã hợp nhất, giao diện người dùng hiện tại tests/lint/build, CI hiện tại và bằng chứng môi trường tiền sản xuất.
- Tạo ra: gói L1-L4 ghi ngày tháng báo cáo những gì đã được xác minh, những gì đã được hợp nhất và những gì vẫn cần có sự xem xét của con người hoặc bằng chứng bên ngoài.

- [x] **Bước 1: Đánh dấu thiết kế là đã được thực hiện bằng bằng chứng**

Thay đổi trạng thái thiết kế để xác định PR #58 đã được hợp nhất và liên kết gói xác thực. Không yêu
cầu trình chuyển đổi ngôn ngữ trong thời gian chạy hoặc dịch nội dung do người dùng sở hữu.

- [x] **Bước 2: Thêm bản tóm tắt kết thúc vào kế hoạch triển khai**

Giữ nguyên các bước lịch sử chi tiết, thêm bản tóm tắt hoàn thành đáng tin cậy và chỉ đánh dấu các
mục trong danh sách kiểm tra xác minh cuối cùng được hỗ trợ bởi bằng chứng mới.

- [x] **Bước 3: Viết gói xác thực L1-L4**

Ghi lại khả năng truy vết, 917 kiểm thử máy chủ, mốc cơ sở giao diện người dùng cục bộ mới 172 kiểm
thử, kiểm tra mã/bản dựng, 4/4 E2E, kiểm thử nhanh môi trường tiền sản xuất hiện tại, trạng thái thô được bảo
toàn/giá trị API và các khoảng trống còn lại: không có bản ghi đánh giá GitHub chuyên dụng cho PR
#58, không có video demo bên ngoài, không có CI SQL được chia sẻ và không sản xuất SLA. Xác định
`29712597463` chạy CI từ xa làm mốc cơ sở cho 171 kiểm thử trước đó.

---

### Nhiệm vụ 4A: Sửa nhãn trình bày tiếng Việt còn sót lại

**Tệp:**
- Sửa đổi: `frontend/test/vietnameseUi.test.js`
- Sửa đổi: `frontend/src/page/UserManagement.jsx`
- Sửa đổi: `frontend/src/component/inventory/BookCopies.jsx`
- Sửa đổi: `frontend/src/component/inventory/Filter.jsx`
- Sửa đổi: `frontend/src/page/borrowing/BorrowRequestsAdminPage.jsx`
- Sửa đổi: `frontend/src/page/borrowing/BorrowRequestPage.jsx`

**Giao diện:**
- Tiêu thụ: API/giá trị trạng thái thô và `getStatusLabel(value)` từ `frontend/src/utils/uiLabels.js`.
- Tạo ra: văn bản tùy chọn/huy hiệu/dự phòng bằng tiếng Việt trong khi vẫn giữ nguyên các giá trị tùy chọn thô, so sánh trạng thái, tải trọng API và các lớp trạng thái CSS.

- [x] **Bước 1: Thêm hồi quy nội địa hóa không thành công**

Mở rộng `frontend/test/vietnameseUi.test.js` để từ chối văn bản tùy chọn `ACTIVE`/`INACTIVE` thô,
kết xuất trạng thái thô, `Copy #` và `No library data found.`, đồng thời yêu cầu `getStatusLabel` ở
ranh giới bản trình bày Inventory/admin/borrowing.

- [x] **Bước 2: Chạy kiểm thử tập trung và xác minh RED**

```powershell
node --test frontend/test/vietnameseUi.test.js
```

Dự kiến: THẤT BẠI trên các chuỗi tiếng Anh/trạng thái thô còn lại.

- [x] **Bước 3: Triển khai bản sửa lỗi trình bày tối thiểu**

Chỉ sử dụng `getStatusLabel` cho văn bản tùy chọn/huy hiệu được hiển thị. Giữ các giá trị trạng thái
thô trong `value`, so sánh, yêu cầu API và tên lớp CSS. Thay thế `Copy #` bằng `Bản sao #` và trạng
thái trống bằng `Không tìm thấy dữ liệu thư viện.`.

- [x] **Bước 4: Chạy kiểm thử tập trung và xác minh GREEN**

```powershell
node --test frontend/test/vietnameseUi.test.js
```

Đã quan sát: 13/13 kiểm thử bản địa hóa tập trung đã vượt qua, tiếp theo là 172/172 kiểm thử giao
diện người dùng đầy đủ trước khi theo dõi phản hồi riêng biệt; Nhiệm vụ 4B nâng tổng số hiện tại lên
173/173.

---

### Nhiệm vụ 4B: Đóng khoảng cách lớp bao đáp ứng H3

**Tệp:**
- Sửa đổi: `frontend/src/page/HomePage.jsx`
- Sửa đổi: `frontend/test/appShellFrontend.test.js`
- Sửa đổi: `.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md`
- Sửa đổi: `.sdd/reviews/governance-release-reconciliation-validation-2026-07-20.md`

**Giao diện:**

- Tiêu thụ: các tuyến HomePage hiện có, hành động tài khoản và phản hồi
  yêu cầu chấp nhận từ thiết kế bản địa hóa.
- Tạo ra: menu di động có thể truy cập và các quy tắc bố cục màn hình hẹp trong khi
  duy trì mọi hành động điều hướng/tài khoản hiện có và giá trị thô.

- [x] **Bước 1: Thêm hợp đồng trình duyệt và nguồn RED.**
- [x] **Bước 2: Triển khai lớp vỏ phản hồi tối thiểu và duy trì quyền truy cập của thành viên.**
- [x] **Bước 3: Xác minh 173/173 kiểm thử giao diện người dùng, kiểm tra mã, bản dựng, 4/4 E2E vĩnh viễn,
  và tập trung vào ảnh chụp màn hình trình duyệt 1440px/390px.**
- [ ] **Bước 4: Hoàn tất quá trình chấp nhận trực quan của con người, H3, hợp nhất và
  CI chính xác sau hợp nhất.**

---

### Nhiệm vụ 5: Xác thực việc đối chiếu

**Tệp:**
- Kiểm tra: các lệnh xác thực kho lưu trữ và sự khác biệt hiện tại.
- Tạo: `.sdd/reviews/governance-release-reconciliation-validation-2026-07-20.md`
- Tạo: `.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md`
- Sửa đổi: `docs/superpowers/plans/2026-07-20-governance-release-reconciliation.md`

- [x] **Bước 1: Chạy kiểm tra tính nhất quán của tài liệu**

```powershell
npm.cmd run trace:enforce
git diff --check
rg -n 'directly through `emailService`|PENDING H3|H2-READY|remains uncommitted|Not started|Status: Approved for implementation planning' .sdd/specs .sdd/test-plan.md docs/release README.md plan.md .agents/CLAUDE.md docs/superpowers/specs docs/superpowers/plans
```

Dự kiến: các kết quả trùng khớp duy nhất còn lại là các ghi chú lịch sử/hoãn lại rõ ràng kèm theo
lời giải thích về phiên thay thế gần đó.

- [x] **Bước 2: Chạy cổng sản phẩm tự động**

```powershell
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix backend run test:integration:system
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
```

Dự kiến: tất cả các lệnh thoát 0; không có thay đổi hành vi nguồn sản phẩm nào được đưa ra.

- [x] **Bước 3: Kiểm tra toàn bộ khác biệt không được cam kết**

```powershell
git status --short
git diff --stat
git diff --check
Get-Content -Raw .sdd/reviews/governance-release-reconciliation-validation-2026-07-20.md
Get-Content -Raw .sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md
Get-Content -Raw docs/superpowers/plans/2026-07-20-governance-release-reconciliation.md
```

Dự kiến: `git diff --stat` và `git diff --check` xác thực khác biệt được theo dõi, trong khi `git
trạng thái --short` cộng với các lần đọc rõ ràng xác thực các tệp bằng chứng/kế hoạch không được theo
dõi. Chỉ các tệp SDD/phát hành/bằng chứng được liệt kê và các tệp trình bày bản địa hóa giới hạn đã
thay đổi; không có bí mật, lược đồ, API, ủy quyền hoặc thay đổi hành vi kinh doanh nào xuất hiện.
