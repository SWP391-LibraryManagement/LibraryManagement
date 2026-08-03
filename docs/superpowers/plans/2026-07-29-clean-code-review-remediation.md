# Kế hoạch thực hiện khắc phục đánh giá mã sạch

> **Đối với nhân viên đại lý:** BẮT BUỘC SUB-SKILL: Sử dụng `executing-plans` để thực hiện kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Đóng các kết quả đánh giá từ `main@8ef8367` mà không thay đổi API, lược đồ hoặc trạng
thái thời gian chạy Azure.

**Kiến trúc:** Thu hẹp ngoại lệ cố định của máy quét bí mật từ phạm vi tệp đến một dòng được đánh
dấu rõ ràng. Di chuyển lựa chọn chuyển giao FE08 thành một trình trợ giúp thuần túy được chia sẻ bởi
giao diện người dùng và các kiểm thử, sau đó hiển thị một lựa chọn trống rõ ràng cho các chuyển giao
cũ. Những thay đổi về tài liệu chỉ sửa lại siêu dữ liệu quản trị cũ và truy vết.

**Tech bộ công nghệ:** Trình chạy kiểm thử tích hợp Node.js, React 19, GitHub Hành động YAML, SDD
Markdown hiện có.

## Ràng buộc toàn cầu

- Bảo toàn `SAFE-001`: không có bí mật, mật khẩu, mã thông báo hoặc thông tin xác thực thực sự trong nguồn, lịch thi đấu, nhật ký hoặc cam kết.
- Bảo tồn `BR-FE07-012`, `BR-FE07-013` và `FR-FE08-039`; không thay đổi API hoặc lược đồ cơ sở dữ liệu.
- Chỉ sử dụng các phần mềm tích hợp sẵn của Node cho máy quét; không thêm phụ thuộc.
- Azure SQL vẫn bị tạm dừng: không triển khai, chạy di chuyển, tiếp tục cơ sở dữ liệu hoặc thay đổi cài đặt Azure.
- Mỗi bản sửa lỗi hành vi đều có một kiểm thử hồi quy không thành công trước khi thay đổi mã sản xuất.

---

### Nhiệm vụ 1: Thu hẹp ngoại lệ của trình quét bí mật được theo dõi và thực thi các kiểm thử của nó trong CI

**Tệp:**

- Sửa đổi: `scripts/check-tracked-secrets.js`
- Sửa đổi: `scripts/check-tracked-secrets.test.js`
- Sửa đổi: `.github/workflows/ci.yml`
- Sửa đổi: `docs/superpowers/plans/2026-07-29-pre-azure-release-remediation.md`

**Giao diện:**

- `scanTrackedFiles(root)` tiếp tục trả sách `{ path, pattern }[]`.
- Một dòng chứa `secret-scan: allow-synthetic` bị loại khỏi kết quả khớp; tất cả các dòng khác trong tập tin đó vẫn quét.
- CI gọi `npm run test:secrets`, chạy cả kiểm tra đơn vị máy quét và quét kho lưu trữ.

- [ ] **Bước 1: Viết hồi quy thất bại** — lịch thi đấu có dòng URL cơ sở dữ liệu được đánh dấu cộng với dòng khóa AWS không được đánh dấu; máy quét chỉ được báo cáo phát hiện AWS. Xây dựng các giá trị tổng hợp từ các đoạn chuỗi để nguồn kiểm tra có thể quét an toàn.
- [ ] **Bước 2: Xác minh RED** — chạy `node --test scripts/check-tracked-secrets.test.js`; hồi quy phạm vi dòng phải thất bại vì mã hiện tại bỏ qua toàn bộ tệp.
- [ ] **Bước 3: Thực hiện thay đổi máy quét ở mức tối thiểu** — lọc các dòng được đánh dấu trước khi đánh giá, xóa `SCANNER_TEST_PATH` và viết lại các mẫu tĩnh trong kế hoạch kiểm thử/trước.
- [ ] **Bước 4: Dây CI** — thay thế `node scripts/check-tracked-secrets.js` bằng `npm run test:secrets` sau khi root `npm ci` và trước khi kiểm tra.
- [ ] **Bước 5: Xác minh GREEN** — chạy `npm run test:secrets`; không có giá trị bí mật nào xuất hiện ở đầu ra.

### Nhiệm vụ 2: Làm cho trạng thái chuyển giao cũ của FE08 trở nên rõ ràng và được kiểm tra hành vi

**Tệp:**

- Tạo: `frontend/src/utils/reservationHandoffState.js`
- Sửa đổi: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`
- Sửa đổi: `frontend/test/reservationFrontend.test.js`

**Giao diện:**

- `resolveReservationQueueHandoff({ pendingCopyId, currentCopyId, reservations })` trả về `{ queueCopyId, notice, consumePendingHandoff }`.
- `pendingCopyId` cũ trả về `queueCopyId: null`, cảnh báo đã được phê duyệt và `consumePendingHandoff: true`; nó không bao giờ trở lại bản sao đang hoạt động.
- Không có sự chuyển giao đang chờ xử lý, người trợ giúp giữ lại một bản sao hiện tại hợp lệ hoặc chọn bản sao hoạt động đầu tiên.

- [ ] **Bước 1: Viết các kiểm thử hành vi không đạt** — chuyển giao cũ với một bản sao hoạt động khác phải mang lại `null`; tải thông thường không có chuyển giao sẽ chọn bản sao hoạt động đầu tiên.
- [ ] **Bước 2: Xác minh RED** — chạy `npm --prefix frontend test -- --test-name-pattern "stale handoff"`; nó không thành công vì việc xuất trợ giúp không tồn tại.
- [ ] **Bước 3: Triển khai và sử dụng trình trợ giúp** — thay thế lựa chọn nội tuyến trong `loadReservations()`; thêm trình giữ chỗ `value=""` bị vô hiệu hóa có nhãn `Chọn bản sao xem hàng đợi` khi có bản sao đang hoạt động nhưng không có bản sao được chọn.
- [ ] **Bước 4: Xác minh GREEN** — chạy `npm --prefix frontend test -- --test-name-pattern "handoff"`; vượt qua các kiểm thử hành vi.

### Nhiệm vụ 3: truy vết chính xác và siêu dữ liệu trạng thái phát hành

**Tệp:**

- Sửa đổi: `backend/src/repositories/borrowingRepository.js`
- Sửa đổi: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`
- Sửa đổi: `backend/tests/borrowingRepository.test.js`
- Sửa đổi: `frontend/test/reservationFrontend.test.js`
- Sửa đổi: `.sdd/specs/feat-{borrowing-management,reservation-management,notification-management,reporting-statistics}/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/{SPEC.md,PLAN.md}`

**Giao diện:**

- Không có thay đổi giao diện thời gian chạy.
- FE07 trả sách dấu vết mã `BR-FE07-012, BR-FE07-013`; Dấu vết chuyển giao FE08 `FR-FE08-039`.
- Siêu dữ liệu phát hành đồng ý rằng việc hợp nhất/CI đã hoàn tất và giai đoạn Azure bị chặn hạn ngạch; nó không khẳng định H3 vẫn đang chờ xử lý.

- [ ] **Bước 1: Viết xác nhận truy vết không thành công** — mở rộng các kiểm thử FE07/FE08 hiện có để yêu cầu ID chính xác và thêm xác nhận Nút từ chối văn bản phát hành đang chờ xử lý H3 trong bốn tệp TASKS.
- [ ] **Bước 2: Xác minh RED** — chạy các kiểm thử máy chủ, giao diện người dùng và khả năng truy vết tập trung; chúng thất bại do thiếu ID/siêu dữ liệu cũ.
- [ ] **Bước 3: Áp dụng những thay đổi nhỏ nhất** — mở rộng các nhận xét hiện có và chỉ thay thế cách diễn đạt mâu thuẫn ở thì hiện tại, bảo tồn bằng chứng lịch sử.
- [ ] **Bước 4: Xác minh GREEN** — chạy lại các kiểm thử tập trung và `npm run trace:enforce`.

### Nhiệm vụ 4: Xác minh và bàn giao đầy đủ

**Tệp:** Chỉ xác minh.

- [ ] **Bước 1: Chạy cổng** — `npm run test:secrets`, kiểm tra máy chủ tập trung, kiểm tra/kiểm tra mã/xây dựng giao diện người dùng đầy đủ, kiểm tra triển khai, trạng thái/thực thi truy nguyên và `git diff --check`.
- [ ] **Bước 2: Cam kết và xuất bản** — cam kết khắc phục đã được xem xét trên `fix/clean-code-remediation`, đẩy, mở PR và đợi CI chính xác. Không hợp nhất hoặc triển khai mà không có sự chấp thuận của người dùng tiếp theo.
