# Thiết kế sửa bố cục lịch sử mượn FE07

Trạng thái: ĐÃ ĐƯỢC NHẤT TRÍ Ở MỨC THIẾT KẾ; CHỜ REVIEW TỆP

Ngày: 2026-08-03

Chủ sở hữu: Nhat

Phương pháp: ADD Light

## 1. Kết quả người dùng

Thành viên đọc được toàn bộ timeline Hành trình trong bảng Lịch sử mượn sách mà ngày và nhãn trạng thái không đè lên các cột Ngày mượn, Hạn trả hoặc Ngày trả. Các trạng thái Hư hỏng và Thất lạc phải có chữ và nền nhìn thấy rõ.

## 2. Bằng chứng lỗi hiện tại

Lỗi đã được tái hiện trên Azure Staging tại:

- frontend: https://www.thuvienhub.io.vn/borrowing/history;
- backend đang phục vụ baseline main@de72ba92c37eaf2f0fd2c7e1c60ab3e313391bcc.

Đo trực tiếp trên viewport 1912x900 cho thấy:

- ô Hành trình có clientWidth 160px;
- nội dung timeline có scrollWidth 336px;
- overflow-x hiện là visible;
- timeline vì vậy vẽ sang các ô ngày kế tiếp;
- bảng có clientWidth 1332px nhưng scrollWidth 1439px;
- badge Hư hỏng có text trong DOM nhưng computed color là trắng trên nền trong suốt.

Nguyên nhân trong CSS:

1. member-history-table dùng table-layout fixed.
2. Sáu cột đầu đã chiếm đủ 100 phần trăm chiều rộng: 38 + 12 + 12 + 12 + 14 + 12.
3. Cột Thao tác thứ bảy bị co về 0px.
4. Cột Hành trình chỉ nhận 12 phần trăm dù borrow-journey đặt min-width 320px.
5. Ô Hành trình không chặn overflow.
6. Badge có mapping cho returned/borrowed/overdue nhưng thiếu damaged/lost.

Đây là lỗi Shell trình bày. API, trạng thái borrowing, timestamp và nghiệp vụ FE07/FE08 đều đang trả dữ liệu đúng cho bảng.

## 3. Phạm vi

### Trong phạm vi

- Phân bổ lại độ rộng đủ cả bảy cột của bảng lịch sử.
- Bảo đảm cột Hành trình có đủ không gian cho timeline tối thiểu 320px.
- Giữ overflow của timeline trong đúng ô Hành trình.
- Giữ cuộn ngang bên trong table wrapper khi viewport không đủ rộng.
- Chuyển timeline sang bố cục dọc dễ đọc tại breakpoint mobile.
- Bổ sung tone nhìn thấy được cho badge Damaged và Lost.
- Thêm kiểm thử hồi quy nguồn CSS và Playwright responsive.

### Ngoài phạm vi

- Không thay đổi BorrowRequests, BorrowDetails, BookCopies hoặc Reservations.
- Không thay đổi API, DTO, query, service, repository hoặc SQL.
- Không đổi cách buildBorrowingJourney tạo nhãn/timestamp.
- Không đổi quy tắc đủ điều kiện mượn hoặc ưu tiên đặt chỗ.
- Không sửa lỗi chênh lệch giữa public availability và borrow candidates trong nhánh này.
- Không thêm dependency, migration hoặc feature mới.
- Không thiết kế lại toàn bộ App Shell hoặc DataTable dùng chung.

## 4. Các phương án đã xem xét

### Phương án A — Phân bổ lại cột và responsive timeline

Giữ nguyên bảng và timeline hiện tại, phân bổ lại đủ bảy cột, chặn overflow trong ô và dùng timeline dọc trên mobile.

Ưu điểm:

- Diff nhỏ và chỉ thuộc FE07.
- Giữ toàn bộ thông tin hành trình luôn nhìn thấy.
- Không đổi component/API hoặc hành vi nghiệp vụ.
- Có thể đo bằng browser bounding boxes.

Nhược điểm:

- Bảng vẫn cần cuộn ngang ở màn hình hẹp.
- Dòng mobile có thể cao hơn do timeline dọc.

Quyết định: CHỌN.

### Phương án B — Timeline chỉ còn icon và tooltip

Thu gọn nhãn/ngày thành icon, chỉ hiện chi tiết khi hover/focus.

Ưu điểm: bảng ngắn và ít cần cuộn.

Nhược điểm: giảm khả năng đọc nhanh, phụ thuộc hover trên desktop và thêm interaction/accessibility.

Quyết định: KHÔNG CHỌN.

### Phương án C — Bỏ timeline khỏi bảng và mở panel chi tiết

Bảng chỉ hiển thị trạng thái hiện tại; người dùng mở từng dòng để xem hành trình.

Ưu điểm: bảng gọn nhất.

Nhược điểm: thay đổi hành vi lớn, thêm state/interaction và làm mất thông tin đang nhìn thấy trực tiếp.

Quyết định: KHÔNG CHỌN.

## 5. Thiết kế được chọn

### 5.1 Bảng desktop

member-history-table tiếp tục dùng table-layout fixed nhưng có min-width 1180px và độ rộng cột sau:

| Cột | Tỷ lệ |
| --- | ---: |
| Sách | 24% |
| Hành trình | 30% |
| Ngày mượn | 9% |
| Hạn trả | 9% |
| Ngày trả | 9% |
| Trạng thái | 10% |
| Thao tác | 9% |

Tổng bằng 100%. Ở min-width 1180px, cột Hành trình rộng khoảng 354px, lớn hơn min-width 320px của timeline. Cột Thao tác còn khoảng 106px, đủ cho nút Gia hạn.

Ô Hành trình phải:

- có min-width 0 theo table layout;
- chặn phần tử con vẽ sang ô kế tiếp;
- không cắt nội dung khi bảng đạt min-width;
- để table wrapper sở hữu cuộn ngang, không đẩy document rộng hơn viewport.

### 5.2 Timeline mobile

Tại viewport tối đa 640px:

- borrow-journey chuyển từ hàng ngang sang cột dọc;
- bỏ min-width ngang 320px;
- marker và connector nằm dọc bên trái;
- mỗi bước vẫn hiển thị đầy đủ label và time;
- thứ tự DOM, aria-label và aria-current giữ nguyên.

Table wrapper tiếp tục cuộn ngang vì bảng có nhiều cột. Document body không được có horizontal overflow.

### 5.3 Badge trạng thái

Badge Damaged và Lost dùng tone đỏ hiện có:

- chữ dùng var(--st-red);
- nền dùng var(--st-red-bg);
- border hiện tại được giữ;
- label tiếng Việt Hư hỏng và Thất lạc không đổi.

Không thêm generic fallback có thể ảnh hưởng badge feature khác.

## 6. Tệp dự kiến

### Sửa

- frontend/src/styles/app-shell.css
  - phân bổ bảy cột;
  - ràng buộc overflow ô Hành trình;
  - timeline mobile dọc;
  - tone damaged/lost.
- frontend/test/borrowingFrontend.test.js
  - contract nguồn CSS cho bảy cột, timeline, overflow và badge.
- tests/e2e/fe07-fe12-connected-demo-flow.spec.js
  - kiểm tra thực tế bounding boxes và responsive khi câu chuyện FE07 đã tạo lịch sử.

### Không sửa

- frontend/src/page/borrowing/BorrowingHistoryPage.jsx
- frontend/src/component/borrowing/BorrowingJourneyTimeline.jsx
- frontend/src/utils/borrowingJourney.js
- frontend/src/utils/libraryFeatureViewModels.js
- toàn bộ backend, database và OpenAPI.

Nếu TDD chứng minh CSS không thể đáp ứng mà không sửa JSX/component, phải dừng và xin amendment thay vì tự mở rộng phạm vi.

## 7. Tiêu chí chấp nhận EARS

- AC-LAYOUT-001: Khi Thành viên mở Lịch sử mượn tại viewport 1440x900, 1366x768 hoặc 1280x720, hệ thống phải giữ bounding box của timeline Hành trình không vượt qua biên trái của ô Ngày mượn.
- AC-LAYOUT-002: Khi một timeline có bốn bước và đầy đủ timestamp, hệ thống phải hiển thị tất cả label/ngày mà không đè lên nhau hoặc sang cột kế tiếp.
- AC-LAYOUT-003: Khi viewport là 390x844, hệ thống phải hiển thị timeline theo chiều dọc, giữ thứ tự bước và không tạo horizontal overflow ở document.
- AC-LAYOUT-004: Khi bảng rộng hơn vùng hiển thị, chỉ table wrapper được cuộn ngang; trang và member-history-card không được mở rộng quá viewport.
- AC-LAYOUT-005: Khi trạng thái lịch sử là Damaged hoặc Lost, badge phải có màu chữ khác nền, nền không trong suốt và label tiếng Việt nhìn thấy được.
- AC-LAYOUT-006: Khi thay đổi CSS hoàn tất, API call, DTO mapping, timeline semantic DOM và nghiệp vụ FE07 phải không đổi.

## 8. Chiến lược kiểm thử

### RED nguồn CSS

Mở rộng borrowingFrontend.test.js để yêu cầu:

- đủ selector width cho cột thứ bảy;
- tổng tỷ lệ cột bằng 100 theo contract đã chọn;
- Hành trình có 30 phần trăm và timeline min-width phù hợp;
- ô Hành trình chặn overflow sang ô bên cạnh;
- breakpoint mobile chuyển borrow-journey sang column và bỏ min-width ngang;
- badge-damaged và badge-lost dùng tone đỏ.

Test mới phải thất bại trên baseline vì cột thứ bảy chưa có width, timeline overflow visible và badge tone còn thiếu.

### GREEN browser

Mở rộng câu chuyện Playwright FE07–FE12 hiện có để:

1. mở borrowing/history sau khi có dữ liệu hành trình;
2. tại 1440, 1366 và 1280 đo journeyCell, journeyList và borrowDateCell;
3. assert journeyList.right không vượt borrowDateCell.left;
4. tại 390 assert timeline flex-direction là column;
5. assert document.scrollWidth bằng document.clientWidth;
6. assert table wrapper sở hữu overflow khi cần;
7. kiểm tra badge terminal có text/nền tương phản.

Không dùng screenshot đơn thuần làm bằng chứng đạt; screenshot chỉ hỗ trợ review trực quan.

### Hồi quy

Chạy:

- node --test frontend/test/borrowingFrontend.test.js frontend/test/borrowingJourneyFrontend.test.js
- npx playwright test tests/e2e/fe07-fe12-connected-demo-flow.spec.js --project=chromium
- npm --prefix frontend run lint
- npm --prefix frontend run build
- npm run trace:enforce
- git diff --check

Baseline trước sửa:

- frontend FE07: 32/32 PASS;
- Playwright connected flow: 1/1 PASS;
- baseline chưa có assertion layout nên vẫn xanh dù lỗi staging tái hiện được.

## 9. Definition of Done

- Mọi AC-LAYOUT-001..006 có kiểm thử hoặc bằng chứng browser.
- Timeline không chồng lên bất kỳ cột ngày nào ở ba viewport desktop.
- Timeline mobile đọc được và giữ semantics.
- Badge Hư hỏng/Thất lạc nhìn thấy rõ.
- Không đổi API, backend, SQL, dependency hoặc business rule.
- Diff chỉ gồm ba tệp triển khai/test được liệt kê cùng design/plan/evidence được phê duyệt.
- Test tập trung, Playwright, lint, build, traceability và diff check đều đạt.
- Người dùng review thay đổi trước commit implementation và H3 trước merge.

## 10. Rủi ro và rollback

Rủi ro chính là tăng chiều rộng tối thiểu khiến người dùng phải cuộn bảng nhiều hơn ở viewport hẹp. Đây là trade-off được chấp nhận để giữ đầy đủ thông tin và không chồng chữ.

Rollback chỉ cần hoàn tác CSS/test của nhánh; không có dữ liệu, schema hoặc API phải phục hồi.

## 11. Cổng tiếp theo

Design approval trong hội thoại cho phép tạo tệp thiết kế này. Tệp phải được người dùng review trước khi writing-plans tạo implementation plan. Không sửa code/CSS trước cổng review đó.
