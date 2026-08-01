# Kế hoạch kiểm thử FE07 - Quản lý mượn sách

Phiên bản: 0.9.0
Trạng thái: HOÀN THÀNH; PR #89 ĐÃ HỢP NHẤT; CI VÀ AZURE ĐÃ CHẠY THÀNH CÔNG TRÊN ĐÚNG COMMIT
Cập nhật lần cuối: 2026-08-01

Đặc tả nguồn: `.sdd/specs/feat-borrowing-management/SPEC.md`
ID tính năng: `BR-FE07-*`, `FR-FE07-*`, `AC-FE07-*`
Nguồn ánh xạ chính thức giữa AC và kiểm thử: §16 Ma trận truy vết trong `SPEC.md` (tệp này mô tả chiến lược, không phải danh sách ca kiểm thử).

---

## 1. Phạm vi kiểm thử

Tạo yêu cầu mượn, phê duyệt/từ chối, lịch sử mượn của thành viên, luồng trả, luồng gia hạn và quy tắc nghiệp vụ lưu hành cốt lõi.

Theo dõi hợp đồng lịch sử: xác thực `status?`, `fromDate?`, `toDate?`, `page?`, `limit?`, `page=1`, `limit=20`, tối đa 100, ngày nghiệp vụ bao gồm hai đầu, từ chối trước truy vấn, phạm vi thành viên và thứ tự `BorrowDate DESC`/`BorrowDetailId DESC` ổn định cho cả endpoint thành viên và nhân sự.

## 2. Mục tiêu kiểm thử đơn vị / tầng dịch vụ

- Điều kiện mượn: thành viên đã phê duyệt, tài khoản hoạt động, không có trạng thái quá hạn/phạt chặn.
- Giới hạn mượn: tối đa 5 bản sao đang mượn.
- Kiểm tra khả dụng bản sao (lúc tạo và kiểm tra lại khi phê duyệt).
- Tính hạn trả: mặc định 14 ngày dương lịch.
- Chuyển đổi trạng thái phê duyệt/từ chối/trả/gia hạn; các ca biên và xung đột gia hạn.
- UX quyết định nhân sự: ngữ cảnh yêu cầu/thành viên/mọi bản sao chuẩn đầy đủ không có thông báo khả dụng tổng hợp dư thừa, trường nhập lý do từ chối được kiểm soát liên tục, trợ giúp có thể tiếp cận và bố cục hộp thoại đáp ứng.
- UX trả: không có thông báo khẳng định dư thừa cho lượt trả `NORMAL` đúng hạn; cảnh báo rà soát phạt ngoại lệ quá hạn/hỏng/mất vẫn hiển thị.
- Tình trạng hạn trả: trường mượn/hạn trả/gia hạn chuẩn, hành vi biên `Asia/Ho_Chi_Minh` và nhãn rõ ràng sắp đến hạn/đến hạn hôm nay/quá hạn.

## 3. Mục tiêu kiểm thử API / tích hợp

- `POST /api/borrow-requests`: hợp lệ, bản sao trùng/không khả dụng, vượt giới hạn, thành viên không hoạt động/chưa được phê duyệt.
- `GET /api/borrow-requests/me`: chỉ lịch sử của chính mình.
- `GET /api/borrow-requests/candidates`, tạo và lịch sử riêng phòng thủ từ chối mảng tương thích cũ/không hợp lệ chứa `MEMBER + LIBRARIAN` hoặc `MEMBER + ADMIN` với `403 ROLE_REQUIRED`; tài khoản đã lưu vẫn một vai trò.
- `GET /api/borrow-requests`: danh sách nhân sự, thành viên không được phép bị từ chối.
- `GET /api/members/:memberId/borrowings`: lịch sử thành viên được chọn của nhân sự, bộ lọc quá hạn/trạng thái/ngày dẫn xuất và ID thành viên không rõ trả về `404 MEMBER_NOT_FOUND`.
- `PATCH /api/borrow-requests/:requestId/approve`: hợp lệ, bản sao không khả dụng, mượn hai lần đồng thời, bị cấm.
- `PATCH /api/borrow-requests/:requestId/reject`: hợp lệ, trạng thái không hợp lệ.
- `PATCH /api/borrow-details/:borrowDetailId/return`: hợp lệ, trạng thái/ngày không hợp lệ, đã trả.
- `PATCH /api/borrow-details/:borrowDetailId/renew`: hợp lệ, quá hạn, giới hạn gia hạn, xung đột đặt trước.

## 4. Luồng chấp nhận E2E / thủ công

- Thành viên yêu cầu mượn → thủ thư phê duyệt → thành viên thấy lịch sử → thủ thư ghi nhận trả.
- Một mảng tương thích cũ Thành viên/nhân sự không hợp lệ bị chuyển hướng khỏi tuyến API thành viên và chỉ giữ quyền truy cập vận hành nhân sự khớp; tài khoản đã lưu vẫn một vai trò.
- FE08 đánh dấu lượt giữ chỗ `NOTIFIED` -> Thành viên theo bàn giao chính xác `bookId`/`copyId`
  -> FE07 chọn trước bản sao được giữ -> Thành viên gửi yêu cầu đang chờ
  -> Thủ thư/Quản trị viên phê duyệt và hoàn tất lượt đặt trước.
- Hành vi quá hạn/gia hạn được xác minh với ngày xác định.

## 5. Bằng chứng hiện có

- Cổng tuyến API/tầng truy cập dữ liệu/hợp đồng/mô hình FE07 tập trung: 66/66 kiểm thử đạt, gồm bộ lọc lịch sử thành viên/nhân sự chuẩn, phân trang máy chủ, ngày bao gồm hai đầu, thứ tự ổn định, `OVERDUE` dẫn xuất và phạm vi chủ sở hữu.
- `backend/tests/models.test.js` (4 kiểm thử; trạng thái FE07 đã lưu và siêu dữ liệu hạn trả có thể để trống).
- `backend/tests/borrowingContract.test.js` (4 kiểm thử; dữ liệu đầu vào OpenAPI FE07, bộ lọc, trường FineCandidate khi chạy, dữ liệu phản hồi và lỗi an toàn).
- `backend/tests/reportRepository.test.js` (9 kiểm thử; gồm lọc SQL `OVERDUE` dẫn xuất).
- `backend/tests/sql/borrowingConcurrency.sqltest.js` đạt trong lượt chạy SQL Server dùng một lần tổng hợp 61/61 và bao phủ tuần tự hóa theo phạm vi thành viên, ưu tiên/hoàn tất đặt trước, kết quả điều kiện hợp lệ và hoàn tác kiểm toán thất bại.
- `backend/tests/integration.test.js`.
- `frontend/test/borrowingFrontend.test.js`: 24/24 kiểm thử tập trung đạt, gồm cấu trúc phản hồi chi tiết chuẩn, hợp đồng trạng thái/phân trang lịch sử do máy chủ sở hữu, ngữ cảnh quyết định Thủ thư/Quản trị viên, tiêu điểm trường nhập từ chối ổn định, tình trạng hạn trả theo thời gian nghiệp vụ và hợp đồng siêu dữ liệu gia hạn.
- Hồi quy frontend đầy đủ đạt 201/201; kiểm thử tập trung cho Quản lý yêu cầu Quản trị, vai trò và khung ứng dụng đạt 25/25.
- Xác minh tuyến API/tầng truy cập dữ liệu/hợp đồng backend FE07 đạt 66/66, giữ bảo vệ `LIBRARIAN`/`ADMIN` chuẩn và các hợp đồng thay đổi.
- Lint/build frontend, truy vết FE07 31/31 và `git diff --check` đạt cho hiệu chỉnh v0.7.3.
- Chấp nhận trên trình duyệt với backend thực: truy cập khách/thành viên/nhân sự, phê duyệt, gia hạn, trả bình thường, lỗi mạng, hiển thị hộp thoại và kiểm tra tràn màn hình máy tính/di động.
- Luồng chính hệ thống xác nhận nhãn đến hạn trả rõ ràng `Quá hạn 14 ngày` trước khi xử lý trả quá hạn và bàn giao phạt FE09.
- Hồi quy E2E Chromium đầy đủ đạt 4/4, gồm luồng đặt trước FE08, quản lý phạt FE09, quản lý yêu cầu Quản trị FE11 và luồng chính hệ thống.
- Truy vết: bao phủ FR `@spec` **100%** (`npm run trace:enforce`).

## 6. Khoảng trống

- TD-007 đã giải quyết: chính sách mượn Giai đoạn 1 là tất cả-hoặc-không (đặc tả căn chỉnh với mã, BR-FE07-022). TD-008 (đồng bộ `allowedValues` mô hình) đã giải quyết.
- Bằng chứng hoàn tác FR-FE07-022 là bao phủ giao dịch SQL thực; kiểm thử hoàn tác tuyến API trong bộ nhớ chỉ là bổ sung.
- Danh mục tạo yêu cầu tạm thời còn tồn tại cho tới khi FE01/FE06 công khai tích hợp duyệt/chọn bản sao môi trường triển khai thực tế mà FE07 yêu cầu.
- Xác thực trình duyệt lịch sử và rà soát của con người bao phủ mốc cơ sở trước đó. Hồi quy kho mã v0.5.1 cuối và chấp nhận tích hợp của con người vẫn bắt buộc.

## 7. Lệnh / bằng chứng bắt buộc trước khi hợp nhất

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
npm.cmd run trace:enforce
```

## 8. Bằng chứng tích hợp B7

- Commit triển khai `3a7b0ad1165607b8912c6c0be5f3ef2025c11b55` có trong `main` qua PR #19 và commit hợp nhất `aeed0dfecb764e6cbe63d7074727f318700e59ea`.
- Lượt chạy GitHub Actions CI `29308540692` đạt trên commit hợp nhất.
- Job CI thành công bao phủ thực thi truy vết, kiểm thử backend, lint/kiểm thử/build frontend và kiểm tra import health backend.
- Bằng chứng chi tiết được ghi tại `.sdd/reviews/fe07-b7-integration-review-closeout-2026-07-14.md`.

## 9. Ma trận kiểm thử đợt FE07-FE12

- AC-FE07-033: thành phần gửi yêu cầu phê duyệt/từ chối không tạo bản ghi trùng
  khi xử lý lặp và chỉ dùng dữ liệu an toàn.
- AC-FE07-034: return bàn giao có/không hàng đợi, không thao tác thay đổi dữ liệu reservation.
- AC-FE07-035: FE10 failure giữ commit FE07 và trả cảnh báo.
- AC-FE07-036: timeline/state/timestamp/điều kiện chặn/lỗi thời màn hình máy tính dữ liệu hiển thị.
- Cross-feature: `AT-001..AT-004`, `AT-009`, `AT-012`.

Yêu cầu RED trước GREEN; các bộ kiểm thử tập trung, toàn bộ kiểm thử backend/frontend, Chromium và
traceability phải đạt trước H2.

## 10. Bằng chứng H2 cục bộ v0.9.0

- RED/GREEN: thiếu result template, queue action, timeline và cảnh báo trung
  thực đều được tái hiện trước khi triển khai.
- Backend FE07: 3 suite, 90/90 kiểm thử.
- Nhóm frontend FE07/FE08: 56/56 kiểm thử.
- Toàn bộ cổng kiểm tra: backend có 69 bộ với 1.125 ca kiểm thử; frontend đạt 269/269; lint và build
  môi trường triển khai thực tế đạt; system integration 11/11.
- Chromium 1440x900: `E2E-CONNECTED-001` đạt 1/1, không tràn ngang và không có
  lỗi console ngoài dự kiến.
- Coverage backend: 91,89% statements, 80,72% branches, 97,61% functions,
  91,81% lines.
- Phần thay đổi của sản phẩm của đợt này sau đó đã qua H2/H3, hợp nhất; hoàn tất cuối được xác
  nhận qua PR #89, CI và Azure trên đúng commit.
