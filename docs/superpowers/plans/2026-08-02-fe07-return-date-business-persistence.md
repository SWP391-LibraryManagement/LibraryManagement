# FE07 Kế hoạch thực hiện kiên trì kinh doanh theo ngày trả sách

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng quy trình làm việc TDD của kho lưu trữ và thực hiện nội tuyến kế hoạch này vì H1 hiện tại không ủy quyền ủy quyền, cam kết, đẩy hoặc hợp nhất. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Giữ nguyên ngày trả sách FE07 mặc định là ngày làm việc của `Asia/Ho_Chi_Minh` hiện
tại để FE09 tính toán các khoản phạt quá hạn từ ngày dương lịch đã cam kết mà giao diện người dùng
trả sách nhìn thấy.

**Kiến trúc:** Giữ FE07 làm chủ sở hữu của ngày trả sách đã cam kết và FE09 làm trình đọc xuôi dòng.
Tại ranh giới dịch vụ đến kho lưu trữ, vượt qua ngày kinh doanh `YYYY-MM-DD` chuẩn đã được
`libraryBusinessTime` bắt nguồn; SQL Server tiếp tục liên kết giá trị thông qua đầu vào `sql.Date`
được tham số hóa hiện có.

**bộ công nghệ công nghệ:** Node.js, Express, Jest, kho lưu trữ FE07 trong bộ nhớ kép, `mssql`, SQL Server.

## Ràng buộc toàn cầu

- Nguồn chuẩn vẫn là AC-FE07-006, AC-FE07-008, FR-FE07-021 và dữ liệu `returnDate`/hợp đồng API trong FE07 SPEC đã được phê duyệt.
- Không thay đổi lược đồ, hình dạng API, vai trò, mức phạt, xác thực ngày trả sách rõ ràng, ngữ nghĩa kiểm tra, chuyển giao FE08 hoặc hành vi tính toán FE09.
- Chỉ sửa đổi các tài liệu kế hoạch/nhiệm vụ/bằng chứng `backend/tests/borrowingRoutes.test.js`, `backend/src/services/borrowingService.js` và FE07 không được cam kết.
- H1 chỉ cho phép triển khai RED/GREEN không cam kết và xác thực cục bộ. Cam kết, đẩy, thao tác ghi giai đoạn/chạy lại, đóng tác vụ, H2 và H3 vẫn bị chặn.

---

### Nhiệm vụ 1: Tái tạo sự trôi ngày từ dịch vụ đến SQL

**Tệp:**

- Sửa đổi: `backend/tests/borrowingRoutes.test.js`
- Đọc: `backend/src/services/borrowingService.js`
- Đọc: `backend/src/repositories/borrowingRepository.js`

**Giao diện:**

- Tiêu thụ: `clock() = 2026-07-22T17:30:00.000Z`, là ngày kinh doanh `2026-07-23` trong `Asia/Ho_Chi_Minh`.
- Tạo ra: một hồi quy chứng minh giá trị đầu vào ổn định của kho lưu trữ và giá trị được lưu trữ trong bộ nhớ chính xác là `2026-07-23` trong khi ứng cử viên tốt vẫn quá hạn một ngày.

- [x] **Bước 1: Mở rộng kiểm thử hoàn trả UTC lúc nửa đêm hiện có**

Gói `borrowingDependencies.borrowingRepository.returnBorrowDetail`, chụp `input.returnDate`, thực
hiện trả về ngày mặc định và xác nhận:

```javascript
expect(persistedReturnDate).toBe('2026-07-23');
expect(storedDetail.returnDate).toBe('2026-07-23');
expect(response.body.fineCandidate.overdueDays).toBe(1);
```

- [x] **Bước 2: Chứng minh RED**

Chạy:

```powershell
Push-Location backend
$env:TZ='UTC'
& .\node_modules\.bin\jest.cmd --runInBand tests\borrowingRoutes.test.js -t "default return persists the Vietnam business date across UTC midnight"
Remove-Item Env:TZ -ErrorAction SilentlyContinue
Pop-Location
```

Dự kiến: xác nhận mới không thành công vì kho lưu trữ nhận được UTC `Date`
(`2026-07-22T17:30:00.000Z`) thô thay vì `2026-07-23`.

### Nhiệm vụ 2: Kiên trì ngày kinh doanh chuẩn

**Tệp:**

- Sửa đổi: `backend/src/services/borrowingService.js`
- Kiểm tra: `backend/tests/borrowingRoutes.test.js`

**Giao diện:**

- Tiêu thụ: `returnBusinessDate: YYYY-MM-DD` hiện có bắt nguồn từ đầu vào rõ ràng hoặc `formatBusinessDate(clock())`.
- Sản xuất: `borrowingRepository.returnBorrowDetail({ returnDate: returnBusinessDate })`; không có kho lưu trữ, lược đồ hoặc thay đổi API.

- [x] **Bước 1: Áp dụng bản sửa lỗi tối thiểu**

Chỉ thay đổi đối số kiên trì:

```javascript
const returnedDetail = await borrowingRepository.returnBorrowDetail({
  borrowDetailId,
  detailStatus,
  copyStatus,
  returnDate: returnBusinessDate,
  // existing audit/evidence fields remain unchanged
});
```

- [x] **Bước 2: Chứng minh GREEN và khả năng tương thích ngày rõ ràng**

Chạy:

```powershell
$env:TZ='UTC'
Push-Location backend
& .\node_modules\.bin\jest.cmd --runInBand tests\borrowingRoutes.test.js tests\borrowingRepository.test.js tests\fineManagementRoutes.test.js tests\fineRoutes.test.js tests\fineContract.test.js
Remove-Item Env:TZ -ErrorAction SilentlyContinue
Pop-Location
```

Dự kiến: tất cả các kiểm thử đã chọn đều đạt; bằng chứng giao dịch và xác thực `returnDate` rõ ràng
vẫn không thay đổi.

### Nhiệm vụ 3: Xác thực và dừng ở ranh giới H2

**Tệp:**

- Cập nhật: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Cập nhật: `.sdd/specs/feat-borrowing-management/PLAN.md`
- Cập nhật: `.sdd/reviews/release-closeout-staging-acceptance-2026-08-02.md`

**Giao diện:**

- Tiêu thụ: chênh lệch đầu ra và kho lưu trữ RED/GREEN.
- Tạo ra: bằng chứng L1-L3 cộng với khoảng cách L4 rõ ràng; FE07-T061 vẫn mở cho đến khi quá trình chấp nhận giai đoạn sạch được triển khai được thông qua.

- [x] **Bước 1: Chạy xác thực cục bộ**

```powershell
$env:TZ='UTC'
Push-Location backend
& .\node_modules\.bin\jest.cmd --runInBand tests\borrowingRoutes.test.js tests\borrowingRepository.test.js tests\fineManagementRoutes.test.js
Remove-Item Env:TZ -ErrorAction SilentlyContinue
Pop-Location
npm --prefix backend test
npm --prefix backend run test:coverage:ci -- --silent
npm run test:system
npm run trace:enforce
npm run test:secrets
git diff --check
```

Chỉ chạy bộ FE07 SQL dùng một lần khi cơ sở dữ liệu không phân tầng được đặt tên và
`FE07_SQL_TEST_ALLOW_MUTATION=true` đã được định cấu hình; nếu không thì ghi lại là không chạy và
không thay thế thao tác ghi Môi trường tiền sản xuất Azure.

- [x] **Bước 2: Dừng mà không thực hiện hành động tích hợp**

Báo cáo các tệp đã thay đổi, số lần kiểm tra chính xác, đánh giá L2/L3, chạy lại giai đoạn L4 chưa
được thực hiện và rủi ro còn sót lại. Không cam kết, đẩy, triển khai, chạy lại giai đoạn trực tiếp,
đóng FE07-T061 hoặc cấp H2/H3.

## Bằng chứng thực hiện — 2026-08-02

- mốc cơ sở trước RED: Tuyến FE07 cộng với kho lưu trữ `85/85` đã vượt qua.
- RED: đầu vào ổn định dự kiến `2026-07-23`; đã nhận được `2026-07-22T17:30:00.000Z` thô trong khi xác nhận ứng cử viên tốt có sẵn vẫn giữ nguyên màu xanh.
- GREEN: hồi quy ranh giới UTC tập trung đã vượt qua `1/1`; khác biệt sản xuất là một đối số đã thay đổi, `returnDate: returnBusinessDate`.
- FE07/FE09/kho lưu trữ tập trung trong `TZ=UTC`: bộ `5` và các kiểm thử `114/114` đã vượt qua. Hồi quy tương tự được thực hiện theo `America/New_York`.
- Kiểm thử nhanh hợp đồng Tedious `sql.Date` xác nhận `2026-07-23` được ánh xạ chuẩn thành `2026-07-23` với `useUTC=true`, trong khi giá trị đồng hồ thô ban đầu được ánh xạ thành `2026-07-22`.
- Tích hợp hệ thống: `11/11` đã được thông qua. Phần máy chủ và phạm vi bao phủ đầy đủ: bộ `74` và các kiểm thử `1,175/1,175` đã vượt qua; câu lệnh `91.98%`, nhánh `81.28%`, hàm `97.08%`, dòng `91.94%`.
- Việc thực thi truy vết được thông qua bằng thẻ FE07 `44/44` FR (`100%`); các kiểm thử bí mật được theo dõi đã vượt qua `5/5`; `git diff --check` đã vượt qua.
- SQL dùng một lần không chạy được vì `DB_SERVER`, `DB_NAME` và `FE07_SQL_TEST_ALLOW_MUTATION` chưa được định cấu hình. Môi trường tiền sản xuất Azure không được sử dụng để thay thế.
- L4 vẫn mở: thay đổi chưa được cam kết, triển khai hoặc thực hiện trong một lần chấp nhận môi trường tiền sản xuất trực tiếp khác.

## Ủy quyền xuất bản H2 — 2026-08-02

- Người dùng đã phê duyệt khác biệt khắc phục FE07 đã bị đóng băng cho cam kết trong phạm vi, đẩy nhánh và PR dự thảo.
- Các ràng buộc H1 ban đầu ở trên vẫn là ranh giới thực thi lịch sử; H2 sau này chỉ cho phép xuất bản đối với các tệp được đánh giá được liệt kê trong `.sdd/reviews/fe07-return-date-business-persistence-h2-2026-08-02.md`.
- FE07-T061, SQL thực/chấp nhận theo giai đoạn, H3 và hợp nhất vẫn mở.
