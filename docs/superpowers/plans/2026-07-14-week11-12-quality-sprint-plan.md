# Tuần 11-12 Kế hoạch thực hiện Sprint chất lượng

> **Đối với nhân viên đại lý:** BẮT BUỘC SUB-SKILL: Sử dụng siêu năng lực:thực thi các kế hoạch để thực hiện kế hoạch này theo từng nhiệm vụ. Không sử dụng tác nhân phụ cho tác vụ kho lưu trữ này.

**Mục tiêu:** Thêm bằng chứng về trình duyệt và phạm vi bảo mật của Tuần 11 có thể đo lường được,
sau đó hoàn thành kiểm tra bảo mật Tuần 12 mà không làm thay đổi hành vi kinh doanh sản xuất.

**Kiến trúc:** Jest đo lường bộ mô-đun máy chủ đã hoàn chỉnh và thực thi mức sàn 80%. Playwright
chạy giao diện React thực trên máy chủ Express chỉ dành cho localhost được xây dựng từ khai thác
tích hợp hệ thống hiện có, với FE09 được thực hiện thông qua bối cảnh Playwright API. Bằng chứng bảo
mật kết hợp đầu ra kiểm tra phụ thuộc với RBAC cấp kho lưu trữ, xác thực, lỗi an toàn và kiểm tra bí
mật.

**bộ công nghệ công nghệ:** Node.js, Jest, Playwright Chrome, React/Vite, Express, kho tích hợp
trong bộ nhớ hiện có, kiểm tra npm.

## Ràng buộc toàn cầu

- Làm việc trên nhánh `test/week11-quality-sprint`; không bao giờ sử dụng tên nhánh `codex`.
- Không thay đổi các quy tắc nghiệp vụ sản xuất, lược đồ SQL hoặc thông số chức năng đã được phê duyệt.
- Không cung cấp thông tin xác thực, nội dung `.env`, mức độ bao phủ được tạo, báo cáo, dấu vết hoặc ảnh chụp màn hình Playwright.
- Không sử dụng `npm audit fix --force`.
- Chỉ giữ các kiểm thử thao tác ghi SQL cục bộ.
- Mọi kiểm thử mới phải ánh xạ tới BR/FR/AC hiện có hoặc cổng chất lượng được ghi lại.

---

### Nhiệm vụ 1: Thiết lập mốc cơ sở và ma trận chênh lệch

**Tệp:**
- Tạo: `.sdd/reviews/week11-coverage-evidence-2026-07-14.md`
- Kiểm tra: `backend/package.json`
- Kiểm tra: `backend/coverage/coverage-summary.json`

**Giao diện:**
- Tiêu thụ: cấu hình Jest `collectCoverageFrom` hiện có.
- Tạo ra: tỷ lệ phần trăm cơ sở chính xác và danh sách xếp hạng các tệp/nhánh chưa được phát hiện.

- [x] Chạy `npm.cmd --prefix backend run test:coverage -- --coverageReporters=json-summary --coverageReporters=text`.
- [x] Ghi lại số lượng bộ/kiểm tra và tất cả bốn chỉ số phạm vi toàn cầu.
- [x] Xếp hạng các tệp dưới 80 phần trăm, ưu tiên các dịch vụ và trình xác thực hơn là định tuyến đường dây.
- [x] Ánh xạ từng khoảng trống đã chọn với yêu cầu SPEC/TEST_PLAN của chức năng hiện tại.
- [x] Cam kết với `docs: record week 11 coverage baseline`.

### Nhiệm vụ 2: Thu hẹp khoảng cách có ý nghĩa về mức độ bao phủ

**Tệp:**
- Sửa đổi: tập trung vào `backend/tests/`
- Chỉ sửa đổi nếu được yêu cầu: kiểm tra người trợ giúp trong `backend/tests/helpers/`
- Cập nhật: `.sdd/reviews/week11-coverage-evidence-2026-07-14.md`

**Giao diện:**
- Tiêu thụ: Ma trận khoảng cách nhiệm vụ 1.
- Sản xuất: kiểm tra các nhánh kinh doanh chưa được phát hiện, xác thực, ủy quyền và lỗi an toàn.

- [x] Thêm một kiểm thử thất bại cho mỗi hành vi chưa được phát hiện đã chọn.
- [x] Chạy từng kiểm thử tập trung và xác nhận kết quả màu đỏ dự kiến.
- [x] Chỉ thêm các thay đổi kiểm tra/trợ giúp cần thiết để thực hiện hành vi sản xuất hiện có.
- [x] Chạy lại các kiểm thử tập trung cho đến khi có màu xanh.
- [x] Chạy lại mức độ bao phủ và lặp lại cho đến khi tất cả số liệu đã định cấu hình đạt ít nhất 80 phần trăm hoặc một ngoại lệ được ghi lại được phê duyệt.
- [x] Cam kết trong các cam kết kiểm thử tập trung vào chức năng nhỏ.

### Nhiệm vụ 3: Thực thi phạm vi bảo hiểm trong CI

**Tệp:**
- Sửa đổi: `backend/package.json`
- Sửa đổi: `.github/workflows/ci.yml`
- Cập nhật: `.sdd/test-plan.md`
- Cập nhật: `.sdd/reviews/week11-coverage-evidence-2026-07-14.md`

**Giao diện:**
- Tiêu thụ: màu xanh lá cây >=80 phần trăm cơ sở từ Nhiệm vụ 2.
- Tạo ra: `test:coverage:ci` và bước chặn CI.

- [x] Thêm giá trị Jest `coverageThreshold.global` là 80 cho các nhánh, hàm, dòng và câu lệnh.
- [x] Thêm `test:coverage:ci` bằng `--coverage --coverageReporters=text-summary`.
- [x] Thêm bước CI sau khi kiểm tra máy chủ.
- [x] Đánh dấu cột mốc Tuần 11 chỉ hoàn thành sau khi lệnh thoát 0.
- [x] Cam kết với `test: enforce backend coverage threshold`.

### Nhiệm vụ 4: Thêm luồng nghiệp vụ chuẩn lai Playwright

**Tệp:**
- Sửa đổi: `package.json`
- Sửa đổi: `package-lock.json`
- Tạo: `playwright.config.js`
- Tạo: `tests/e2e/support/systemTestServer.js`
- Tạo: `tests/e2e/system-golden-path.spec.js`
- Sửa đổi: `.gitignore`
- Sửa đổi: `.github/workflows/ci.yml`
- Cập nhật: `.sdd/test-plan.md`

**Giao diện:**
- Máy chủ kiểm thử lắng nghe trên `127.0.0.1:3100` và cài đặt ứng dụng phù hợp với sản xuất.
- Vite nghe trên `127.0.0.1:4173` với `VITE_API_BASE_URL=http://127.0.0.1:3100/api`.
- Playwright sử dụng thông tin xác thực tác nhân được tạo trong thời gian chạy và ID an toàn từ các điều khiển `/__e2e__`.

- [x] Thêm `@playwright/test` làm phần phụ thuộc của nhà phát triển gốc và cài đặt Chrome.
- [x] Trước tiên, hãy viết kiểm thử Playwright và xác nhận rằng nó không thành công do máy chủ/cấu hình kiểm tra không có.
- [x] Thêm server chỉ dành cho kiểm thử với chức năng seed tác nhân runtime, kiểm soát mốc thời gian quá hạn và đồng bộ trạng thái FE09.
- [x] Triển khai hành trình trình duyệt/API: đăng nhập thành viên -> mượn -> đăng nhập thủ thư -> phê duyệt -> trả sách quá hạn -> tính toán/thanh toán FE09 -> báo cáo FE12.
- [x] Ghi lại dấu vết và ảnh chụp màn hình khi thất bại; xác minh kết xuất báo cáo trên máy tính để bàn và thiết bị di động mà không bị chồng chéo.
- [x] Thêm `test:e2e` và bước cài đặt/chạy CI Chrome.
- [x] Cam kết với `test: add system browser golden path`.

### Nhiệm vụ 5: Hoàn thành Kiểm tra bảo mật Tuần 12

**Tệp:**
- Tạo: `.sdd/reviews/week12-security-audit-2026-07-14.md`
- Chỉ sửa đổi các tệp khóa/gói đối với các bản sửa lỗi phụ thuộc Quan trọng/Cao đã được xác minh.
- Chỉ thêm các kiểm thử hồi quy bảo mật tập trung khi tìm thấy lỗi cụ thể.

**Giao diện:**
- Tiêu thụ: tệp khóa npm, định nghĩa tuyến đường được bảo vệ, trình xác thực, phần mềm trung gian lỗi an toàn, nguồn được theo dõi.
- Tạo ra: số lượng phụ thuộc, RBAC/kiểm kê xác thực, kết quả quét bí mật, phát hiện và bảng rủi ro được chấp nhận.

- [x] Chạy kiểm tra sản xuất cho root, máy chủ và giao diện bằng cách sử dụng đầu ra JSON.
- [x] Theo dõi mọi phát hiện Quan trọng/Cao đối với sự phụ thuộc trực tiếp và khả năng tiếp cận thời gian chạy của nó.
- [x] Áp dụng bản sửa lỗi phụ thuộc nhỏ nhất không phá vỡ khi cần thiết và chạy lại kiểm thử.
- [x] Quét các tệp được theo dõi để tìm các mẫu thông tin xác thực/khóa riêng tư phổ biến mà không in các giá trị `.env`.
- [x] Xác minh các tuyến được bảo vệ sử dụng phần mềm trung gian xác thực/vai trò và trình xác thực đầu vào.
- [x] Xác minh phản hồi 5xx và tải trọng thông báo không làm lộ bộ công nghệ/bí mật.
- [x] Ghi lại những rủi ro được chấp nhận ở mức Trung bình/Thấp với chủ sở hữu và người theo dõi; cam kết với `docs: record week 12 security audit`.

### Nhiệm vụ 6: Cổng chất lượng cuối cùng và bàn giao đánh giá

**Tệp:**
- Cập nhật tài liệu bằng chứng chỉ với kết quả được quan sát.

**Giao diện:**
- Sử dụng: tất cả các mệnh lệnh và bằng chứng từ Nhiệm vụ 1-5.
- Sản xuất: một nhánh sạch có thể xem xét được.

- [x] Chạy `npm.cmd --prefix backend test`.
- [x] Chạy `npm.cmd --prefix backend run test:coverage:ci`.
- [x] Chạy kiểm thử hệ thống SQL có kiểm soát thao tác ghi đối với môi trường cục bộ rõ ràng.
- [x] Chạy `npm.cmd --prefix frontend test`, kiểm tra mã và bản dựng.
- [x] Chạy `npm.cmd run test:e2e`.
- [x] Chạy `npm.cmd run trace:enforce` và `git diff --check`.
- [x] Xác nhận các tạo phẩm được tạo và bí mật cục bộ không bị theo dõi/bỏ qua.
- [x] Cam kết cập nhật bằng chứng cuối cùng và đưa ra các tùy chọn hợp nhất/đẩy/giữ/loại bỏ.
