# Kế hoạch thực hiện Ba Lan và bàn giao giai đoạn 3

> **Đối với nhân viên đại lý:** BẮT BUỘC SUB-SKILL: Sử dụng siêu năng lực:thực thi các kế hoạch (được khuyến nghị) để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Hoàn thành các sản phẩm tài liệu, triển khai, kiểm tra người dùng, hiệu suất, báo cáo,
trình bày và diễn tập Giai đoạn 3 của lộ trình cho bản phát hành FE01-FE12 được chấp nhận.

**Kiến trúc:** Bảo tồn ứng dụng đã được phê duyệt và hợp đồng API. Chỉ thêm cấu hình/tài liệu vận
hành, tập lệnh và bản ghi đo lường xác định cũng như nội dung trình bày. Sử dụng quy trình môi
workflow staging GitHub Actions hiện có, các endpoint Azure App Service/Static Web Apps và
khai thác luồng nghiệp vụ chuẩn của hệ thống cục bộ hiện có làm nguồn bằng chứng.

**bộ công nghệ công nghệ:** Các hành động Node.js 22, Express, React/Vite, Playwright, GitHub, Azure
App Service, Azure Static Web Apps, Azure SQL, Markdown và PowerPoint.

## Ràng buộc toàn cầu

- bộ công nghệ được phê duyệt vẫn là Node.js + Express.js, React + Bootstrap, SQL Server và RESTful API.
- Không có thay đổi nào về hành vi của chức năng cốt lõi nếu không có `SPEC.md`, `PLAN.md`, `TASKS.md` được phê duyệt và đánh giá.
- Không bao giờ cam kết bí mật, thông tin xác thực, mã thông báo, OTP thô, chuỗi kết nối hoặc PII thực.
- Chỉ những kết quả được quan sát mới có thể được đánh dấu `PASS`; bằng chứng không có sẵn về con người/nhà cung cấp vẫn mở một cách rõ ràng.
- CI không làm thay đổi lược đồ Azure SQL; việc thực thi lược đồ vẫn là hành động của người vận hành được xem xét.
- Các ranh giới bị trì hoãn vẫn rõ ràng: phân phối hộp thư đến SMTP, giao diện người dùng hộp thư thông báo, hình đại diện bền bỉ, SQL CI được chia sẻ và phân tách gói giao diện người dùng trừ khi nhiệm vụ hiệu suất của kế hoạch này chứng tỏ được sự hoàn thiện an toàn.

---

### Nhiệm vụ 1: Khóa hợp đồng bằng chứng giai đoạn 3

**Tệp:**
- Tạo: `docs/superpowers/specs/2026-07-19-phase3-polish-delivery-design.md`
- Tạo: `docs/superpowers/plans/2026-07-19-phase3-polish-delivery.md`
- Sửa đổi: `docs/deployment/azure-staging-guide.md`
- Sửa đổi: `docs/release/week13-acceptance-record.md`
- Sửa đổi: `plan.md`

**Giao diện:**
- Tiêu thụ: `origin/main` tại `64831fe`, lộ trình Kết hợp, quy trình triển khai và bằng chứng chức năng đã được phê duyệt.
- Tạo ra: thiết kế/kế hoạch Giai đoạn 3 có thể theo dõi và hướng dẫn vận hành ghi lại `TRUST_PROXY=true` cho lưu lượng App Service sản xuất được ủy quyền.

- [x] **Bước 1: Ghi lại lỗi proxy được quan sát và cách khắc phục**

Cập nhật bảng/lệnh cài đặt thời gian chạy Azure để bao gồm cài đặt `TRUST_PROXY=true` không bí mật.
Giải thích rằng điều này là bắt buộc vì phần mềm trung gian thực thi HTTPS hiện tại chỉ đọc
`x-forwarded-proto` khi cờ này được bật. Không bao gồm bất kỳ giá trị bí mật nào.

- [x] **Bước 2: Làm mới danh sách kiểm tra phát hành từ bằng chứng**

Thay thế số lượng chất lượng được chia sẻ cũ của Tuần 13 bằng bằng chứng `origin/main` hiện tại (916
kiểm thử máy chủ, 149 kiểm thử giao diện người dùng, khả năng truy vết 100%) và thêm phần bằng chứng
môi trường tiền sản xuất Giai đoạn 3 đã cũ. Bỏ chọn sự chấp nhận của người dùng môi trường tiền sản
xuất đã được xác thực cho đến khi con người quan sát nó bằng tài khoản tổng hợp.

- [x] **Bước 3: Đánh dấu kế hoạch Giai đoạn 3 đang hoạt động**

Cập nhật `plan.md` để các điểm kiểm tra hoạt động của nó liên kết với thiết kế Giai đoạn 3, báo cáo
hiệu suất, bản ghi chấp nhận và các tạo phẩm trình bày được tạo bởi các tác vụ sau này. Giữ nguyên
ranh giới hoạt động trì hoãn.

- [x] **Bước 4: Chạy trình giữ chỗ và quét bí mật**

  Chạy:

  ```powershell
  rg -n "<YouTube link>|<Azure Static Web Apps URL>|<Azure App Service URL>|TBD|TODO|API_KEY|PASSWORD=|JWT_SECRET=" docs document plan.md
  ```

Dự kiến: chỉ các tạo phẩm bên ngoài không có sẵn được ghi lại có chủ ý mới có thể tồn tại và không
có giá trị bí mật nào hiện diện.

- [x] **Bước 5: Cam kết hợp đồng bằng chứng**

  ```powershell
  git add docs/superpowers/specs/2026-07-19-phase3-polish-delivery-design.md docs/superpowers/plans/2026-07-19-phase3-polish-delivery.md docs/deployment/azure-staging-guide.md docs/release/week13-acceptance-record.md plan.md
  git commit -m "docs: define phase 3 delivery evidence"
  ```

### Nhiệm vụ 2: Đo lường và cải thiện hiệu suất giao diện người dùng

**Tệp:**
- Tạo: `scripts/phase3-performance.js`
- Tạo: `docs/release/phase3-performance-report.md`
- Sửa đổi: `frontend/src/App.jsx`
- Sửa đổi: `frontend/test/phase3Performance.test.js`

**Giao diện:**
- Tiêu thụ: đầu ra bản dựng Vite hiện có và phần máy chủ E2E xác định tại
  `http://127.0.0.1:3100`.
- Tạo ra: một báo cáo có thể tái tạo với kích thước gói và thời gian p95; tuyến đường
  tải vẫn tương thích với thiết lập Bộ định tuyến React hiện tại.

- [x] **Bước 1: Thêm các kiểm thử hợp đồng không thành công để tải từng phần ở cấp tuyến**

Thêm các kiểm thử nhập nguồn ứng dụng dưới dạng văn bản và xác nhận rằng các trang dành riêng cho
vai trò lớn nhất được tải thông qua `lazy(() => import(...))` và tồn tại dự phòng `Suspense`. Giữ
kiểm thử tập trung vào ranh giới hiệu suất; nó không được khẳng định hành vi kinh doanh hoặc thay
đổi các cuộc gọi API.

- [x] **Bước 2: Chạy kiểm thử tập trung và xác minh trạng thái RED**

  ```powershell
  npm.cmd --prefix frontend test -- --test-name-pattern "Phase 3 performance"
  ```

Dự kiến: xác nhận tải từng phần mới không thành công so với biểu đồ nhập háo hức hiện tại.

- [x] **Bước 3: Thực hiện phân tách mã cấp tuyến an toàn**

Chuyển đổi nội dung nhập trang lớn trong `frontend/src/App.jsx` thành các khai báo `lazy(() =>
import(...))` có tên, bọc cây lộ trình trong `Suspense` với bản trình bày tải trung lập hiện có và
giữ nguyên các đường dẫn tuyến, bộ bảo vệ, đạo cụ, ứng dụng khách API và kiểm tra vai trò.

- [x] **Bước 4: Chạy kiểm tra giao diện người dùng tập trung và đầy đủ**

  ```powershell
  npm.cmd --prefix frontend test
  npm.cmd --prefix frontend run lint
  npm.cmd --prefix frontend run build
  ```

Dự kiến: tất cả các kiểm thử giao diện người dùng đều vượt qua, tìm lỗi mã nguồn sạch và bản dựng
phát ra nhiều đoạn tuyến không có đoạn JavaScript chính nào trên 500 kB.

- [x] **Bước 5: Thêm bộ định thời có thể tái tạo**

  `scripts/phase3-performance.js` sẽ:

  1. đọc các tệp `frontend/dist/assets` được tạo và báo cáo byte thô/gzip
     kích thước;
  2. khởi động `tests/e2e/support/systemTestServer.js` trên một cổng bị cô lập;
  3. tạo một tác nhân tổng hợp đã xác minh qua `POST /__e2e__/setup`;
  4. đăng nhập và gọi `GET /api/auth/me` 30 lần bằng mã thông báo truy cập được trả về;
  5. báo cáo trung bình và p95 đồng hồ treo tường mili giây; Và
  6. chấm dứt tiến trình con trong đường dẫn `finally` mà không in mã thông báo.

  Tập lệnh phải thoát khác 0 nếu quá trình thiết lập, đăng nhập hoặc yêu cầu đo lường không thành công.

- [x] **Bước 6: Chạy khai thác và xuất bản báo cáo**

  ```powershell
  npm.cmd run phase3:performance
  ```

Ghi lại ngày chính xác, cam kết SHA, phiên bản Nút, kích thước gói, thời gian p50/p95 và so sánh với
mục tiêu phiên FE02 đã được phê duyệt. Nếu môi trường không thể chứng minh được mục tiêu, hãy ghi
lại mục tiêu đó là chưa được xác minh thay vì thay đổi mục tiêu.

- [x] **Bước 7: Cam kết phần hiệu suất**

  ```powershell
  git add scripts/phase3-performance.js frontend/src/App.jsx frontend/test/phase3Performance.test.js frontend/package.json docs/release/phase3-performance-report.md
  git commit -m "perf: measure and split phase 3 frontend routes"
  ```

### Nhiệm vụ 3: Ghi lại bằng chứng chấp nhận và kiểm thử của người dùng

**Tệp:**
- Tạo: `docs/release/phase3-user-testing-record.md`
- Sửa đổi: `docs/testing/system-integration-demo-runbook.md`
- Sửa đổi: `docs/release/week13-acceptance-record.md`

**Giao diện:**
- Tiêu thụ: đầu ra luồng nghiệp vụ chuẩn của trình duyệt cục bộ, kết quả kiểm thử nhanh dàn hiện tại,
  danh sách kiểm tra chức năng đã được phê duyệt và các quy tắc dọn dẹp dữ liệu tổng hợp hiện có.
- Tạo ra: một ma trận bằng chứng tách biệt các quan sát tự động khỏi
  sự chấp nhận môi trường tiền sản xuất được xác thực chỉ bởi con người.

- [x] **Bước 1: Chạy luồng nghiệp vụ chuẩn của trình duyệt cục bộ**

  ```powershell
  npm.cmd run test:e2e
  ```

Xác minh thông tin đăng nhập -> mượn -> phê duyệt -> trả sách -> phạt -> luồng báo cáo, xác nhận
tràn máy tính để bàn/thiết bị di động và đầu ra ảnh chụp màn hình. Không sao chép thông tin xác thực
hoặc mã thông báo ghi tên vào hồ sơ.

- [x] **Bước 2: Chạy kiểm thử nhanh môi trường tiền sản xuất độc lập**

  ```powershell
  $env:STAGING_FRONTEND_URL='https://lemon-wave-04db51100.7.azurestaticapps.net'
  $env:STAGING_API_URL='https://app-library-api-staging-nhat714.azurewebsites.net'
  npm.cmd run smoke:staging
  ```

Chỉ ghi lại nguồn gốc điểm cuối và năm kiểm tra được đặt tên từ đầu ra lệnh. Thêm quy trình làm việc
chạy URL và SHA chính xác.

- [x] **Bước 3: Ghi lại ma trận kiểm tra người dùng**

Bao gồm các tình huống duyệt công khai, ranh giới xác thực, mượn thành viên, phê duyệt/trả sách của
nhân viên, xếp hàng đặt chỗ, tính toán/thanh toán khoản phạt, siêu dữ liệu thông báo an toàn, báo
cáo, bố cục phản hồi và dọn dẹp. Mỗi hàng phải có nguồn, kết quả được quan sát, đường dẫn bằng chứng
và chủ sở hữu. Đánh dấu các hàng dàn đã xác thực `OPEN - HUMAN OBSERVATION REQUIRED` trừ khi chúng
được quan sát trực tiếp.

- [x] **Bước 4: Ghi lại hành vi diễn tập và dự phòng**

Cập nhật sổ tay vận hành với đường dẫn năm phút, ảnh chụp màn hình/dự phòng API và quy trình đặt lại. Đảm
bảo không có OTP, mã thông báo, nội dung SMTP hoặc thông tin xác thực thô nào xuất hiện.

- [x] **Bước 5: Cam kết phần chấp nhận**

  ```powershell
  git add docs/release/phase3-user-testing-record.md docs/release/week13-acceptance-record.md docs/testing/system-integration-demo-runbook.md
  git commit -m "docs: record phase 3 user testing evidence"
  ```

### Nhiệm vụ 4: Hoàn thành báo cáo phát hành và các sản phẩm thuyết trình

**Tệp:**
- Tạo: `docs/release/phase3-final-report.md`
- Tạo: `docs/release/phase3-rehearsal-record.md`
- Tạo: `presentation/phase3-final-defense.pptx`
- Sửa đổi: `document/FinalRelease.md`
- Sửa đổi: `README.md`

**Giao diện:**
- Tiêu thụ: tất cả bằng chứng trước đây của Giai đoạn 2, giai đoạn/hiệu suất/kiểm tra người dùng ở Giai đoạn 3
  bản ghi, tài liệu kiến trúc/RDS/SDS và sổ tay vận hành demo hiện có.
- Tạo ra: một báo cáo cuối cùng được liên kết với nguồn và một bản trình bày được hiển thị với
  không có liên kết hoặc khiếu nại bịa đặt.

- [x] **Bước 1: Viết báo cáo cuối cùng**

Phạm vi bao gồm, kiến trúc, khả năng truy vết chức năng, tổng số kiểm thử, triển khai giai đoạn, kết
quả hiệu suất, kết quả kiểm tra người dùng, các hạn chế đã biết, các biện pháp bảo vệ đạo đức/bảo
mật và các lệnh tái tạo chính xác. Tách biệt các kết quả được quan sát khỏi các cuộc kiểm tra mở của
con người/nhà cung cấp.

- [x] **Bước 2: Thay thế phần giữ chỗ phát hành bằng trạng thái trung thực**

Trong `document/FinalRelease.md`, thêm bằng chứng về nguồn gốc và quy trình làm việc của
giao diện/máy chủ trên môi trường tiền sản xuất đã quan sát. Thay thế các liên kết video/thẻ không có sẵn bằng
trạng thái `Not published in this repository` rõ ràng và liên kết tới bản ghi diễn tập cục bộ thay
vì phát minh ra URL.

- [x] **Bước 3: Tạo và hiển thị bản trình bày**

Sử dụng kỹ năng `presentations:Presentations`. Bộ trình chiếu phải chứa: vấn đề và người dùng, kiến trúc,
bản đồ chức năng, luồng nghiệp vụ chuẩn cốt lõi, cổng chất lượng, cấu trúc liên kết môi trường tiền
sản xuất, kết quả hiệu suất, các hạn chế và trình tự demo dài 5 phút. Chỉ sử dụng dữ liệu tổng
hợp/ví dụ.

- [x] **Bước 4: Chạy buổi diễn tập theo thời gian**

Thực hiện theo sổ chạy một lần với tốc độ bình thường và một lần với tốc độ năm phút. Ghi lại thời
gian đã trôi qua, kết quả điểm kiểm tra, dự phòng được sử dụng và mọi hoạt động theo dõi. Kết xuất
bộ trình chiếu thành hình ảnh/PDF và kiểm tra đầu ra trước khi đánh dấu thành phần giả đã được xác minh.

- [x] **Bước 5: Cam kết phân phối tệp bàn giao**

  ```powershell
  git add docs/release/phase3-final-report.md docs/release/phase3-rehearsal-record.md presentation/phase3-final-defense.pptx document/FinalRelease.md README.md
  git commit -m "docs: complete phase 3 delivery package"
  ```

### Nhiệm vụ 5: Chạy xác thực và tích hợp cuối cùng bốn lớp

**Tệp:**
- Sửa đổi: `.github/workflows/deploy-staging.yml` chỉ khi yêu cầu sửa lỗi Giai đoạn 3 đã được chứng minh
- Tạo: `.sdd/reviews/phase3-final-validation-2026-07-19.md`

**Giao diện:**
- Tiêu thụ: tất cả các tạo phẩm Giai đoạn 3 được theo dõi, cam kết của nhánh hiện tại, môi trường tiền sản xuất
  bằng chứng về quy trình làm việc và danh sách kiểm tra xác nhận.
- Tạo ra: một bản ghi đánh giá chứng minh hoặc xác định rõ ràng từng yêu cầu
  Giai đoạn 3 hạng mục trước khi hội nhập.

- [x] **Bước 1: Chạy bộ xác thực cục bộ hoàn chỉnh**

  ```powershell
  npm.cmd ci
  npm.cmd --prefix backend ci
  npm.cmd --prefix frontend ci
  npm.cmd run trace:enforce
  npm.cmd run test:deployment
  npm.cmd --prefix backend run test:coverage:ci
  npm.cmd --prefix backend run test:integration:system
  npm.cmd --prefix frontend test
  npm.cmd --prefix frontend run lint
  npm.cmd --prefix frontend run build
  npm.cmd run test:e2e
  npm.cmd run phase3:performance
  ```

- [ ] **Bước 2: Điều phối dàn từ nhánh cuối cùng/SHA chính**

  ```powershell
  gh workflow run deploy-staging.yml --repo SWP391-LibraryManagement/LibraryManagement --ref main
  gh run watch <observed-run-id> --repo SWP391-LibraryManagement/LibraryManagement --exit-status
  ```

Thay thế `<observed-run-id>` trong lệnh đã thực thi bằng ID thực và ghi lại URL kết quả; không có
phần giữ chỗ nào được giữ lại trong tệp bằng chứng.

- [x] **Bước 3: Kiểm tra tất cả bốn lớp xác thực**

Viết `.sdd/reviews/phase3-final-validation-2026-07-19.md` với cách tiếp cận, tệp chính xác, lệnh/kết
quả, ánh xạ truy vết, đánh giá an toàn, bằng chứng chấp nhận, kiểm tra mở của con người/nhà cung cấp
và rủi ro còn sót lại.

- [ ] **Bước 4: Đẩy một nhánh có thể xem lại và đợi CI được yêu cầu**

  ```powershell
  git push -u origin docs/phase3-polish-delivery
  gh pr create --repo SWP391-LibraryManagement/LibraryManagement --base main --head docs/phase3-polish-delivery --title "docs: complete Phase 3 polish and delivery" --body-file docs/release/phase3-final-report.md
  gh pr checks <observed-pr-number> --repo SWP391-LibraryManagement/LibraryManagement --watch
  ```

- [ ] **Bước 5: Chỉ tích hợp sau khi hoàn tất bằng chứng xác thực**

Hợp nhất thông qua cổng xem xét thông thường của kho lưu trữ, xác minh CI chính sau hợp nhất và cập
nhật bản ghi xác thực cuối cùng với cam kết hợp nhất. Không kết thúc mục tiêu khi thiếu bất kỳ sản
phẩm được yêu cầu nào của Giai đoạn 3 hoặc khi bằng chứng chỉ được suy luận.

## Danh sách kiểm tra tự đánh giá

- Tất cả lộ trình của Giai đoạn 3 đều ánh xạ tới Nhiệm vụ 1-5.
- Không có tuyên bố môi trường tiền sản xuất không được quan sát, SMTP, SQL, video hoặc tuyên bố chấp nhận của con người được đánh dấu
  `PASS`.
- Kế hoạch không chứa `TBD`, `TODO` hoặc bước triển khai mơ hồ.
- Việc tách tuyến duy trì mọi bảo vệ tuyến hiện có và hợp đồng API.
- Mỗi số hiệu suất và chấp nhận trong báo cáo cuối cùng đều có một lệnh,
  đầu ra hoặc tạo phẩm được hiển thị đằng sau nó.
