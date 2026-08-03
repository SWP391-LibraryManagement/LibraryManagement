# Kế hoạch thực hiện điều chỉnh kết thúc phát hành

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Đưa bản sao làm việc lên `origin/main` hiện tại, đóng các lỗ hổng phát hành/bảo
mật/tài liệu đã được xác minh và tạo ra bằng chứng cho quyết định phát hành cuối cùng của con người
mà không âm thầm mở rộng phạm vi FE01-FE12.

**Kiến trúc:** Chuyển nhanh nhánh được theo dõi sạch sang mốc cơ sở từ xa hiện tại, sau đó thực hiện
các thay đổi nhỏ về lớp vỏ cho cổng bảo mật, giải phóng siêu dữ liệu, bằng chứng nhiệm vụ cũ và vệ
sinh tạo tác. Hành vi của sản phẩm không bị thay đổi trừ khi bản cập nhật phụ thuộc yêu cầu sửa lỗi
hồi quy; mọi chức năng mới vẫn hoạt động ở Giai đoạn 4.

**bộ công nghệ công nghệ:** Git, Node.js 22/npm, Express/Jest, React/Vite, Playwright, GitHub Hành
động, tạo phẩm Markdown SDD.

## Ràng buộc toàn cầu

- Giữ các API Node.js + Express.js, React + Bootstrap/Material UI, SQL Server và REST.
- Giữ nguyên các hợp đồng FE01-FE12 đã được phê duyệt và không triển khai hộp thư đến FE10 bị trì hoãn, bộ nhớ hình đại diện lâu bền hoặc phạm vi SLA sản xuất.
- Không bao giờ tiết lộ bí mật, hủy Azure, thông tin xác thực, mã thông báo hoặc dữ liệu cá nhân thực.
- Không tạo thẻ phát hành hoặc xuất bản phương tiện bên ngoài mà không có sự chấp thuận phát hành rõ ràng của con người.
- Mọi hành vi đã thay đổi phải ánh xạ tới `SPEC.md`, các kiểm thử và nhật ký thay đổi có liên quan.

Theo dõi thực thi (21-07-2026): sau quá trình kiểm tra khóa chỉ đọc, cây làm việc bẩn hiện có đã
được chuyển từ `main` sang nhánh `chore/release-closeout-reconciliation` cục bộ mà không cần cam kết
hoặc đẩy. Điều này bảo tồn mốc cơ sở đã được xem xét trong khi chuẩn bị các bằng chứng khác biệt
cuối cùng.

---

### Nhiệm vụ 1: Chuyển nhanh đến mốc cơ sở từ xa hiện tại

**Tệp:**
- Sửa đổi: Các tệp được theo dõi Git thông qua `git pull --ff-only origin main`
- Đánh giá: `backend/.zip` và `output/` chưa được theo dõi

- [x] **Bước 1: Bảo quản và kiểm kê các tệp bàn giao chưa được theo dõi.**

Chạy:

```powershell
git status --short --untracked-files=all
git ls-tree -r --name-only origin/main backend/.zip output
```

Dự kiến: không có va chạm được theo dõi; giữ lại các tập tin không bị theo dõi để xem xét sau.

- [x] **Bước 2: Chuyển tiếp nhanh nhánh.**

Chạy:

```powershell
git pull --ff-only origin main
```

Dự kiến: `HEAD` trở thành `a8729f92d0de98f157ebe8d66ac2000d2ee4f59a` mà không có xung đột hợp nhất
được theo dõi.

- [x] **Bước 3: Xác nhận mốc cơ sở mới.**

Chạy:

```powershell
git status --short --branch
git log --oneline -10
```

Dự kiến: `main` được căn chỉnh với `origin/main`; chỉ còn lại những tệp bàn giao chưa được theo dõi trước đó.

---

### Nhiệm vụ 2: Thêm cổng bảo mật phụ thuộc và giải quyết các tư vấn hiện tại

**Tệp:**
- Sửa đổi: `package.json`
- Sửa đổi: `backend/package.json`
- Sửa đổi: `frontend/package.json`
- Sửa đổi: chỉ các tệp khóa tương ứng khi các phiên bản phụ thuộc được cập nhật có chủ ý
- Sửa đổi: `.github/workflows/ci.yml`
- Sửa đổi: `TECH_DEBT.md` nếu lời khuyên được chấp nhận thay vì cố định

- [x] **Bước 1: Ghi lại chính xác các phát hiện kiểm tra trên mốc cơ sở được đồng bộ hóa.**

Chạy:

```powershell
npm.cmd audit --audit-level=high
npm.cmd --prefix backend audit --audit-level=high
npm.cmd --prefix frontend audit --audit-level=high
```

Dự kiến: xác định các phiên bản cố định chính xác cho `axios`, `body-parser` và `brace-expansion`
(hoặc bất kỳ tư vấn thay thế nào được giới thiệu bởi các tệp khóa hiện tại).

- [x] **Bước 2: Chỉ cập nhật các phần phụ thuộc dễ bị tấn công hoặc ghi đè an toàn.**

Sử dụng đề xuất sửa lỗi kiểm tra của người quản lý gói làm đầu vào, xem xét sự khác biệt của tệp
khóa và duy trì chính sách phụ thuộc đã được phê duyệt. Không chạy bản nâng cấp rộng rãi chưa được
xem xét.

- [x] **Bước 3: Thực hiện các cuộc kiểm tra có mức độ nghiêm trọng cao không đạt CI.**

Thêm ba lệnh này sau mỗi lần cài đặt trong `.github/workflows/ci.yml`:

```yaml
      - name: Root dependency audit
        run: npm audit --audit-level=high

      - name: Backend dependency audit
        run: npm audit --audit-level=high
        working-directory: backend

      - name: Frontend dependency audit
        run: npm audit --audit-level=high
        working-directory: frontend
```

- [x] **Bước 4: Chạy kiểm tra hồi quy tập trung và đầy đủ.**

Chạy:

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Dự kiến: tất cả các bộ đều đạt và ba cuộc kiểm tra sản xuất đều thoát khỏi `0`.

---

### Nhiệm vụ 3: Đối chiếu bản phát hành và bằng chứng đặc trưng với tác phẩm đã hợp nhất

**Tệp:**
- Sửa đổi: `README.md`
- Sửa đổi: `plan.md`
- Sửa đổi: `.agents/CLAUDE.md`
- Sửa đổi: `document/FinalRelease.md`
- Sửa đổi: `docs/release/final-submission-checklist-2026-07-20.md`
- Sửa đổi: `docs/release/phase3-final-report.md`
- Sửa đổi: `.sdd/reviews/governance-release-reconciliation-validation-2026-07-20.md`
- Sửa đổi: `.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md`
- Sửa đổi: cổng hoàn thành cũ theo `.sdd/specs/feat-*/PLAN.md` và `TASKS.md`

- [x] **Bước 1: Ghi lại mốc cơ sở hiện tại thực tế.**

Chỉ thay thế các câu lệnh “H3 đang chờ xử lý” cũ sau khi xác nhận bằng chứng hợp nhất cho PR #59.
Ghi lại SHA `a8729f9` từ xa hiện tại, CI chạy `29824756487`, chạy triển khai `29824944954` và 12 cam
kết sau PR #59 dưới dạng lô đối chiếu mới được đánh giá.

- [x] **Bước 2: Điều chỉnh các hộp đã bỏ chọn trước đây.**

Giữ lại bằng chứng lịch sử, nhưng thêm ghi chú ghi ngày thay thế hoặc đánh dấu hoàn thành cổng hiện
tại nếu có bằng chứng. Không để lại các xác nhận quyền sở hữu trạng thái hiện tại mâu thuẫn như
`Implementation State: COMPLETE` bên cạnh cổng hoàn thành mở không giải thích được.

- [x] **Bước 3: Cập nhật nội dung quyết định phát hành.**

Nêu rõ liệu `v1.0.2` vẫn là bản phát hành đã gửi hay liệu `v1.0.3` được con người phê duyệt có đủ
điều kiện sau khi lô mới vượt qua quá trình đánh giá về bảo mật, hình ảnh và tích hợp hay không.
Không tạo thẻ trong nhiệm vụ này.

- [x] **Bước 4: Xác thực tính nhất quán của tài liệu.**

Chạy:

```powershell
npm.cmd run trace:enforce
rg -n -i "H3 pending|H3 remains pending|PR #59 awaits|Implementation State: COMPLETE|PENDING" README.md plan.md .agents .sdd/reviews docs/release .sdd/specs
```

Dự kiến: văn bản `PENDING` còn lại được xác định rõ ràng trong phạm vi chấp nhận thực sự của con
người hoặc các giới hạn ngoài phạm vi được ghi lại.

---

### Nhiệm vụ 4: Đóng bằng chứng trực quan chấp nhận và nộp

**Tệp:**
- Đánh giá: `docs/release/final-submission-checklist-2026-07-20.md`
- Đánh giá: `.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md`
- Chỉ thêm ảnh chụp màn hình đã được phê duyệt hoặc liên kết demo bên ngoài đã được phê duyệt

- [x] **Bước 1: Chạy dòng trình duyệt và kiểm thử nhanh chạy thử mới nhất.**

Chạy kiểm thử nhanh môi trường tiền sản xuất được ghi lại đối với các URL môi trường tiền sản xuất hiện tại và
bộ Playwright đầy đủ. Dự kiến: giao diện người dùng, tình trạng, danh mục SQL, cho phép/từ chối
CORS, tuyến đường được bảo vệ và luồng trình duyệt 4/4. Quy trình môi trường tiền sản xuất hiện tại
`29824944954` và Playwright cục bộ đáp ứng cổng tự động này.

- [x] **Bước 2: Thực hiện chấp nhận hình ảnh trên máy tính để bàn/thiết bị di động.**

Kiểm tra Trang chủ/danh mục/chi tiết, xác thực, mượn thành viên/reservation, hoạt động của thủ thư,
báo cáo và Quản trị viên trên máy tính để bàn và độ rộng 390px trên thiết bị di động. Giải quyết
hoặc ghi lại rõ ràng mọi lỗi trong danh mục/API trước khi ký chấp nhận.

- [x] **Bước 3: Ghi kết quả nghiệm thu.**

Cập nhật gói xác thực bản địa hóa và danh sách kiểm tra cuối cùng với người đánh giá/ngày/bằng
chứng. Nếu giáo viên yêu cầu video, hãy thêm URL thật; không bao giờ phát minh ra một.

---

### Nhiệm vụ 5: Làm sạch các tạo phẩm phát hành và khoảng trắng

**Tệp:**
- Sửa đổi: `.gitignore` với các mẫu chọn lọc cho các gói/gói Azure được tạo
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md` để xóa khoảng trắng ở cuối đã biết
- Đánh giá: `backend/.zip` và `output/azure-mail-20260721-145625/`

- [x] **Bước 1: Kiểm tra các tệp không bị theo dõi để tìm bí mật/PII.**

Chạy tìm kiếm có mục tiêu trên các tạo phẩm triển khai không được theo dõi. Bảo quản bằng chứng trực
quan có chủ ý; không cam kết nhật ký, kết xuất hoặc gói Azure có chứa thông tin xác thực hoặc dữ
liệu cá nhân.

- [x] **Bước 2: Xóa hoặc bỏ qua có chọn lọc các tạo phẩm đã tạo.**

Sử dụng danh sách mục tiêu rõ ràng, được con người phê duyệt. Không xóa đệ quy tất cả `output/` vì
một số ảnh chụp màn hình có thể là bằng chứng được phát hành.

- [x] **Bước 3: Sửa khoảng trắng và xác minh vệ sinh kho lưu trữ.**

Chạy:

```powershell
git diff --check
git status --short --untracked-files=all
```

Dự kiến: không có lỗi khoảng trắng và chỉ còn lại các tạo phẩm được cố ý giữ lại.

---

### Nhiệm vụ 6: Gói xác nhận cuối cùng

**Tệp:**
- Sửa đổi: hồ sơ xác nhận/phát hành ngày áp dụng

- [x] **Bước 1: Chạy cổng hoàn chỉnh.**

```powershell
npm.cmd run trace:enforce
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:integration:system
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
npm.cmd run test:deployment
git diff --check
```

- [x] **Bước 2: Ghi lại số lượng chính xác và giới hạn còn lại.**

Số lượng kiểm tra tài liệu, phạm vi bao phủ, bằng chứng môi trường tiền sản xuất, trạng thái kiểm
tra phụ thuộc, chấp nhận trực quan và bản phát hành cuối cùng SHA. Giữ SQL CI, bộ lưu trữ hình đại
diện bền bỉ, giao diện người dùng hộp thư đến FE10 và SLA sản xuất được gắn nhãn rõ ràng là các giới
hạn được chấp nhận nếu chúng vẫn nằm ngoài phạm vi.

- [ ] **Bước 3: Dừng lại ở khâu phê duyệt thả người.**

Không tạo `v1.0.3`, xuất bản phương tiện bên ngoài hoặc thay đổi tài nguyên Azure mà không có quyết
định phát hành rõ ràng của nhóm.

---

### Nhiệm vụ 7: Áp dụng biện pháp khắc phục hình ảnh trên thiết bị di động tối thiểu đã được phê duyệt

**Tệp:**
- Sửa đổi: `tests/e2e/fe08-reservation-candidate-catalog.spec.js`
- Sửa đổi: `tests/e2e/fe11-admin-request-management.spec.js`
- Sửa đổi: `frontend/src/styles/app-shell.css`
- Sửa đổi: `frontend/src/page/UserManagement.jsx`
- Đánh giá: `output/playwright/`

**Giao diện:**
- Tiêu thụ: hàng đợi đặt chỗ thành viên FE08 hiện có DOM và FE11 Thanh trên cùng/bảng quản trị DOM.
- Tạo ra: bố cục dành cho thiết bị di động có các điều khiển hiển thị vẫn nằm trong vùng chứa của chúng mà không thay đổi API, hành vi kinh doanh, bố cục máy tính để bàn hoặc cuộn ngang nội bộ của bảng Quản trị.

- [x] **Bước 1: Viết xác nhận ngăn chặn di động FE08 không thành công.**

Sau khi tải lại `390x844` hiện có, hãy đo hàng ứng cử viên đầu tiên, huy hiệu trạng thái và nút hành
động của nó. Xác nhận rằng huy hiệu và nút hiển thị và cạnh phải của chúng không vượt quá cạnh phải
của hàng nhiều hơn một pixel CSS.

- [x] **Bước 2: Chạy kiểm thử FE08 và xác minh RED.**

Chạy:

```powershell
$env:E2E_FRONTEND_PORT='4196'
$env:E2E_BACKEND_PORT='3121'
npx.cmd playwright test tests/e2e/fe08-reservation-candidate-catalog.spec.js --project=chromium
```

Dự kiến trước khi sửa lỗi CSS: THẤT BẠI vì huy hiệu trạng thái chờ lâu bị cắt ra ngoài hàng ứng cử
viên trên khung nhìn `390px`.

- [x] **Bước 3: Triển khai FE08 di động tối thiểu CSS.**

Bên trong khối `@media (max-width: 640px)` hiện có, chỉ thay đổi `.thành viên-đặt chỗ-danh mục
.queue-item`: sử dụng lưới hai cột, cho phép bộ công nghệ văn bản và huy hiệu thu nhỏ/bọc và đặt nút
hành động trên một hàng có chiều rộng đầy đủ.

- [x] **Bước 4: Chạy kiểm thử FE08 và xác minh GREEN.**

Lặp lại lệnh Bước 2. Dự kiến: ĐẠT mà không có tràn ngang cấp tài liệu và tất cả các điều khiển đề cử
có trong hàng.

- [x] **Bước 5: Viết xác nhận thanh trên cùng của thiết bị di động FE11 bị lỗi.**

Trong luồng E2E quản lý yêu cầu quản trị viên, hãy mở `Quản lý người dùng`, chuyển sang `390x844` và
xác nhận rằng `.um-actions` bắt đầu ít nhất tám pixel CSS bên dưới tiêu đề. Đồng thời khẳng định
rằng tài liệu không có tràn ngang và `.um-content` vẫn là vùng chứa cuộn ngang cho bảng rộng.

- [x] **Bước 6: Chạy kiểm thử FE11 và xác minh RED.**

Chạy:

```powershell
$env:E2E_FRONTEND_PORT='4197'
$env:E2E_BACKEND_PORT='3122'
npx.cmd playwright test tests/e2e/fe11-admin-request-management.spec.js --project=chromium
```

Dự kiến trước khi sửa lỗi CSS: THẤT BẠI vì thanh trên cùng trên thiết bị di động không có sự ngăn
cách giữa khối tiêu đề và hàng hành động.

- [x] **Bước 7: Triển khai FE11 di động tối thiểu CSS.**

Bên trong khối `@media (max-width: 900px)` hiện có, hãy thêm một khoảng trống vào `.um-topbar`, cho
phép `.um-actions` bao bọc toàn bộ chiều rộng và cung cấp cho các nút của nó một cơ sở linh hoạt
linh hoạt. Bảo quản `.um-content { overflow: auto; }` và `.um-table { min-width: 850px; }`.

- [x] **Bước 8: Chạy kiểm thử tập trung và cổng hồi quy trực quan đầy đủ.**

Chạy cả hai kiểm thử tập trung, sau đó:

```powershell
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
git diff --check
```

Dự kiến: tất cả các lệnh đều vượt qua. Chụp ảnh chụp màn hình di động FE08 và FE11 mới trong
`output/playwright/` và cập nhật bằng chứng trực quan/phát hành với kết quả chính xác; không cam
kết, gắn thẻ hoặc xuất bản.
