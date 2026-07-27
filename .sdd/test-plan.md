# KẾ HOẠCH KIỂM THỬ - Hệ Thống Quản Lý Thư Viện

Phiên bản: 0.3.0

Trạng thái: CHÍNH SÁCH ĐÃ PHÊ DUYỆT - ĐỐI SOÁT HIỆN TRẠNG ĐƯỢC H2 PHÊ DUYỆT

Cập nhật lần cuối: 2026-07-20

Vị trí chuẩn: `.sdd/test-plan.md`

---

## 0. Mục Đích Và Nguồn Chuẩn

Tài liệu này là **kế hoạch kiểm thử tổng thể (cấp dự án)** cho Hệ thống Quản lý Thư viện SWP391.
Tài liệu tuân theo playbook Phát triển Hướng Đặc tả và Hướng Tác nhân:

- kiểm thử thuộc luồng công việc SHELL và được tạo từ đặc tả + tiêu chí chấp nhận;
- tác nhân có thể soạn thảo kiểm thử, nhưng con người review các khoảng trống;
- một nhiệm vụ **không** hoàn thành chỉ vì ai đó tuyên bố như vậy — nhiệm vụ hoàn thành khi các kiểm thử đều đạt và
  checklist đặc tả hoàn chỉnh (playbook chương 13.3);
- các gate về độ bao phủ và bảo mật được lập kế hoạch rõ ràng trong lộ trình (playbook chương 14).

### 0.1 Cấu Trúc Hai Tầng (Tổng Thể Và Theo Chức Năng)

Hoạt động kiểm thử được tổ chức thành hai tầng theo playbook:

| Tầng | Vị trí | Phạm vi sở hữu |
| ---- | -------------- | ------------ |
| **Theo chức năng (chi tiết)** | `SPEC.md` §8 Tiêu chí chấp nhận + §16 Ma trận truy vết của mỗi chức năng và `.sdd/specs/feat-{name}/TEST_PLAN.md` | các mục tiêu kiểm thử cụ thể và ánh xạ AC↔FR↔kiểm thử của chức năng đó |
| **Dự án (kiểm soát)** | file này + `scripts/check-traceability.js` + CI `ci.yml` | chính sách độ bao phủ, các cấp độ/tháp kiểm thử, lịch trình, Gate Xác thực, Gate Nhất quán và các cột mốc |

### 0.2 Nguồn Chuẩn — Không Trùng Lặp

Để tránh sai lệch giữa Đặc tả-Mã nguồn-Kiểm thử (playbook chương 7.3), mỗi loại dữ kiện chỉ có đúng một nơi lưu trữ:

- **Danh sách ca kiểm thử theo từng yêu cầu** nằm trong §16 Ma trận truy vết của `SPEC.md` thuộc mỗi chức năng
  (`AC-* / FR-* → test`). Đây là nguồn có thẩm quyền.
- **Chiến lược kiểm thử theo chức năng** (phạm vi, mục tiêu unit/API/E2E, bằng chứng, khoảng trống) nằm trong
  `TEST_PLAN.md` của chức năng đó.
- File tổng thể này **không liệt kê lại các ca kiểm thử theo chức năng**. File chỉ chứa chính sách liên chức năng
  và bảng dẫn chiếu (§5). Khi tài liệu tổng thể và tài liệu chức năng không thống nhất, phải sửa cả hai
  cùng nhau thông qua review.

### 0.3 Các File Kế Hoạch Kiểm Thử Theo Chức Năng

| Chức năng | Kế hoạch kiểm thử theo chức năng |
| --- | --- |
| FE01 Công khai / Duyệt sách | `.sdd/specs/feat-public-browse/TEST_PLAN.md` |
| FE02 Xác thực | `.sdd/specs/feat-auth/TEST_PLAN.md` |
| FE03 Hồ sơ người dùng | `.sdd/specs/feat-user-profile/TEST_PLAN.md` |
| FE04 Quản lý tư cách thành viên | `.sdd/specs/feat-membership-management/TEST_PLAN.md` |
| FE05 Quản lý sách | `.sdd/specs/feat-book-management/TEST_PLAN.md` |
| FE06 Kho / Bản sao sách | `.sdd/specs/feat-inventory-book-copy/TEST_PLAN.md` |
| FE07 Quản lý mượn sách | `.sdd/specs/feat-borrowing-management/TEST_PLAN.md` |
| FE08 Quản lý đặt chỗ | `.sdd/specs/feat-reservation-management/TEST_PLAN.md` |
| FE09 Quản lý khoản phạt | `.sdd/specs/feat-fine-management/TEST_PLAN.md` |
| FE10 Quản lý thông báo | `.sdd/specs/feat-notification-management/TEST_PLAN.md` |
| FE11 Quản lý người dùng và vai trò | `.sdd/specs/feat-user-role-management/TEST_PLAN.md` |
| FE12 Báo cáo và thống kê | `.sdd/specs/feat-reporting-statistics/TEST_PLAN.md` |

Quy tắc: khi `SPEC.md`, `PLAN.md` hoặc `TASKS.md` của một chức năng thay đổi, phải cập nhật `TEST_PLAN.md`
của chức năng đó (và nếu ca kiểm thử thay đổi thì cập nhật §16 Ma trận truy vết trong SPEC) trong **cùng PR**.

---

## 1. Mục Tiêu Độ Bao Phủ

### 1.1 Quy Tắc Độ Bao Phủ Tối Thiểu

- Độ bao phủ tối thiểu: `>=80%` đối với toàn bộ mã backend mới (playbook chương 14 Testing Sprint, Hiến chương Điều 5).
- Bắt buộc: kiểm thử unit cho mọi hàm service/logic nghiệp vụ.
- Bắt buộc: kiểm thử tích hợp cho mọi endpoint API — luồng thành công và luồng lỗi.
- Kiểm thử E2E: bắt buộc đối với luồng quan trọng đã chọn; `tests/e2e/system-golden-path.spec.js` bao phủ hành trình kết hợp FE02/FE07/FE09/FE12.
- Không merge nếu các kiểm thử hiện có bị hỏng.

### 1.2 Phạm Vi Bao Phủ Cụ Thể Của Dự Án

Độ bao phủ được áp dụng trước hết cho logic nghiệp vụ backend (backend sở hữu các quy tắc cốt lõi): xác thực
và phân quyền, điều kiện mượn sách, tình trạng có sẵn của sách/bản sao, hàng đợi đặt chỗ, luồng trả sách,
tính tiền phạt, kích hoạt thông báo, tổng hợp báo cáo, kiểm tra dữ liệu đầu vào và kiểm tra quyền.

Độ bao phủ frontend chưa được thực thi bằng kiểm thử component. Cho đến khi bổ sung công cụ kiểm thử frontend,
mọi PR frontend ít nhất phải vượt qua lint/build và có ghi chú xác minh giao diện thủ công.

### 1.3 Trạng Thái Độ Bao Phủ Hiện Tại (2026-07-20)

- Kiểm thử Jest backend: `npm.cmd --prefix backend run test:coverage:ci` -> **917 kiểm thử / 53 bộ kiểm thử đạt**.
- Độ bao phủ đã cấu hình: câu lệnh **92.68%**, nhánh **81.66%**, hàm **96.59%**, dòng **92.61%**.
- Jest thực thi ngưỡng toàn cục 80 phần trăm cho cả bốn chỉ số thông qua `npm --prefix backend run test:coverage:ci` và CI.
- Frontend: **172 kiểm thử đạt** trong lần đối soát cục bộ mới; `npm.cmd --prefix frontend run lint` và `npm.cmd --prefix frontend run build` đều đạt. CI run `29712597463` vẫn là baseline 171 kiểm thử trước đó sau PR #58.
- Gate truy vết: `npm run trace:enforce` (độ bao phủ FR `@spec` tối thiểu 70% cho các chức năng đã triển khai) —
  **được thực thi trong CI** (`.github/workflows/ci.yml`). Cả mười hai chức năng đều ở trạng thái `COMPLETE` với **243/243 thẻ FR (100%)**.
- Tích hợp hệ thống: **10/10** kiểm thử hệ thống trong bộ nhớ đạt. Các bộ kiểm thử dựa trên SQL vẫn được gate rõ ràng đối với thao tác thay đổi dữ liệu và không thuộc job CI mặc định.
- E2E trình duyệt: **4/4** bộ Playwright Chromium đạt trên CI và commit main hiện tại.

---

## 2. Chiến Lược Kiểm Thử

### 2.1 Vị Trí Trong Khung Hybrid

```text
Spec -> Agent generates tests -> Human reviews gaps -> Tests run green -> Spec checklist complete
```

Hãy tin vào bằng chứng (kiểm thử đạt, kiểm tra đạt, checklist đặc tả hoàn chỉnh), không tin vào lời tuyên bố "đã xong".

### 2.2 Tháp Kiểm Thử (Hình Dạng Mục Tiêu)

Bộ kiểm thử nên có dạng hình tháp: nền rộng gồm các kiểm thử unit chạy nhanh, ít kiểm thử tích hợp hơn và
một số lượng nhỏ luồng E2E.

```text
        /\        E2E / manual — few, critical journeys only (login, borrow→return, fine pay)
       /　 \       Integration/API — every endpoint, happy + error path
      /____\      Unit — every service/business rule, edge + boundary (the broad base)
```

| Cấp độ kiểm thử | Mục đích | Bắt buộc cho | Vị trí |
| --- | --- | --- | --- |
| Unit | Xác minh riêng lẻ một service/hàm/quy tắc nghiệp vụ | Mọi hàm service/logic nghiệp vụ | `backend/tests/*.test.js` (repository double trong bộ nhớ) |
| Tích hợp/API | Xác minh endpoint REST, xác thực, validation và tác động dữ liệu | Mọi endpoint API đã triển khai | `backend/tests/*Routes.test.js`, `backend/tests/integration.test.js` |
| E2E | Xác minh các luồng quan trọng ở cấp trình duyệt | Các hành trình quan trọng | Hiện có: `tests/e2e/system-golden-path.spec.js` |
| Giao diện thủ công | Xác minh bố cục/responsive/trạng thái hiển thị | Mọi thay đổi hướng tới giao diện người dùng | Checklist PR / ảnh chụp màn hình |
| Bảo mật/Dependency | Không có lỗ hổng Critical/High, không có dependency drift không an toàn | Tuần 12 + trước khi phát hành | `npm audit`, review mã nguồn, kiểm tra RBAC |

### 2.3 Ma Trận Quyết Định

| Loại nhiệm vụ | Độ sâu đặc tả | Mức tự chủ của tác nhân | Trách nhiệm của con người |
| --- | --- | --- | --- |
| Kiểm thử unit | Bối cảnh mã nguồn/đặc tả trực tiếp | ADD theo tác nhân | Review các quy tắc nghiệp vụ/trường hợp biên còn thiếu |
| Kiểm thử tích hợp | Đặc tả gọn | ADD theo tác nhân | Xác nhận hợp đồng endpoint, xác thực và thiết lập dữ liệu |
| Kiểm thử E2E | Đặc tả gọn | Có hướng dẫn | Chọn luồng quan trọng, xác minh hành vi giao diện |
| Kiểm thử/kiểm toán bảo mật | Ràng buộc an toàn + danh sách endpoint | Có hướng dẫn | Xác nhận độ bao phủ rủi ro thực tế, phê duyệt bản sửa |

### 2.4 Thiết Kế Kiểm Thử Chuẩn

Mọi bộ kiểm thử có ý nghĩa đều bao gồm: luồng thành công; trường hợp lỗi (dữ liệu đầu vào không hợp lệ, thiếu dữ liệu,
chưa xác thực/bị cấm, không tìm thấy); trường hợp biên (`null`/`undefined`/empty); giá trị ranh giới (hạn mức mượn,
ranh giới hạn trả, ranh giới số tiền phạt, phân trang); và kiểm tra bảo mật (vượt qua xác thực/vai trò,
dữ liệu đầu vào injection, lộ dữ liệu nhạy cảm).

---

## 3. Lịch Kiểm Thử

| Giai đoạn / Tuần | Trọng tâm | Đầu ra mong đợi |
| --- | --- | --- |
| Tuần 6 | Gate chất lượng xác thực | Độ bao phủ Auth `>=80%`; kiểm thử login/register/reset/middleware đạt |
| Tuần 10 | Chấp nhận chức năng cốt lõi | Mọi chức năng cốt lõi đạt kiểm thử chấp nhận được ánh xạ tới `SPEC.md` |
| Tuần 11 | Sprint Kiểm thử | Kiểm thử unit cho mọi logic nghiệp vụ; kiểm thử tích hợp cho mọi endpoint; báo cáo độ bao phủ đạt `>=80%` |
| Tuần 12 | Kiểm toán Bảo mật | Kiểm toán bảo mật toàn diện; lỗ hổng Critical/High được sửa; kiểm toán dependency hoàn thành |
| Mỗi sprint | Bảo vệ chống hồi quy | Các kiểm thử hiện có đạt trước khi merge; độ bao phủ không giảm sau baseline |

Tuần 11–12 là sprint chất lượng, không phải sprint phát triển chức năng mới.

### 3.1 Sprint Kiểm Thử Tuần 11
Liệt kê mọi hàm service và endpoint → tạo/viết kiểm thử unit + tích hợp (thành công + lỗi)
→ chạy báo cáo độ bao phủ → Test Engine review các khu vực có độ bao phủ thấp và tiêu chí chấp nhận còn thiếu →
bổ sung khoảng trống cho đến khi đạt mục tiêu hoặc các ngoại lệ được ghi lại.

### 3.2 Kiểm Toán Bảo Mật Tuần 12
Kiểm toán dependency (backend + frontend) → review RBAC phía server trên các endpoint được bảo vệ → kiểm tra hợp lệ
mọi ranh giới dữ liệu đầu vào do người dùng kiểm soát → bảo đảm không để lộ stack trace cho client → bảo đảm
kiểm thử/fixture không chứa thông tin bí mật/dữ liệu cá nhân thật → sửa mọi lỗ hổng Critical/High → ghi lại mọi
rủi ro Medium/Low được chấp nhận cùng lý do và chủ sở hữu.

---

## 4. Vai Trò Test Engine

Mỗi sprint chỉ định một **Test Engine** để điều phối việc viết kiểm thử có tác nhân hỗ trợ và kiểm soát
chất lượng độ bao phủ (mục tiêu: `>=80%` trước khi merge, hoặc có ngoại lệ được review và ghi lại). Trách nhiệm gồm:
duy trì file này; kiểm tra `SPEC.md`/`PLAN.md`/`TASKS.md` của chức năng có các yêu cầu có thể kiểm thử;
yêu cầu tác nhân/thành viên nhóm tạo các kiểm thử còn thiếu từ đặc tả; review bản nháp để phát hiện assertion yếu và
sự tự tin sai lệch; bảo đảm các kiểm thử hiện có đạt và độ bao phủ không bị suy giảm; xác minh kiểm thử tích hợp
bao phủ luồng thành công + lỗi; ghi nhận bằng chứng giao diện thủ công; thực hiện các sprint Tuần 11/12. Vai trò được luân phiên
qua mỗi sprint (ghi nhận bên dưới).

| Sprint | Test Engine | Dự phòng | Ghi chú |
| --- | --- | --- | --- |
| Sprint 1 | TBD | TBD | Kiểm thử nền tảng và xác thực |
| Sprint 2 | TBD | TBD | Các chức năng lưu thông cốt lõi |
| Sprint 3 | TBD | TBD | Báo cáo, thông báo, kiểm thử tích hợp |
| Sprint 4 | TBD | TBD | Sprint kiểm thử / kiểm toán bảo mật |

---

## 5. Dẫn Chiếu Theo Chức Năng (Không Trùng Lặp)

Mục tiêu kiểm thử chi tiết của mỗi chức năng nằm trong `TEST_PLAN.md` (§0.3) của chức năng đó và ánh xạ AC↔kiểm thử
nằm trong §16 của từng `SPEC.md`. Mục này chỉ lưu ma trận chính sách một dòng và bản
tóm tắt mức độ sẵn sàng; mục này chủ đích **không** trình bày lại các ca kiểm thử theo chức năng.

### 5.1 Quy Tắc Chung Cho Mỗi Chức Năng

- Unit: mỗi hàm service/logic nghiệp vụ cần ít nhất một kiểm thử có ý nghĩa.
- Tích hợp: mỗi endpoint API cần kiểm thử luồng thành công và luồng lỗi.
- E2E: các luồng người dùng quan trọng khi có công cụ E2E.
- Giao diện thủ công: mọi màn hình thay đổi phải được kiểm tra các trạng thái đang tải/trống/thành công/lỗi/quyền.
- Truy vết: mọi `AC-*` phải ánh xạ tới một kiểm thử trong §16 của `SPEC.md`; mọi `FR-*` đã triển khai phải
  mang thẻ `@spec` (được kiểm tra bởi `scripts/check-traceability.js`).

### 5.2 Ma Trận Chức Năng (Mỗi Chức Năng Một Dòng)

| Chức năng | Yêu cầu Unit | Yêu cầu Tích hợp/API | Luồng quan trọng E2E / Thủ công |
| --- | --- | --- | --- |
| FE01 Công khai / Duyệt sách | Helper tìm kiếm/lọc/sắp xếp nếu được thêm | Duyệt/tìm kiếm/chi tiết công khai thành công + query không hợp lệ | Khách tìm kiếm và xem chi tiết |
| FE02 Xác thực | Logic băm, token, validation, đặt lại | Đăng ký/đăng nhập/đăng xuất/quên/đặt lại/me thành công + lỗi + xác thực thất bại | Đăng ký, đăng nhập, đặt lại mật khẩu |
| FE03 Hồ sơ người dùng | Quy tắc validation và cập nhật hồ sơ | Đọc/cập nhật/đổi mật khẩu hồ sơ thành công + bị cấm/lỗi | Thành viên cập nhật hồ sơ an toàn |
| FE04 Tư cách thành viên | Quy tắc về điều kiện/trạng thái | Đăng ký/phê duyệt/từ chối/trạng thái thành công + lỗi vai trò | Thành viên đăng ký; nhân viên phê duyệt |
| FE05 Quản lý sách | Quy tắc validation sách/danh mục | CRUD/tìm kiếm thành công + validation + bị cấm | Thủ thư tạo/cập nhật sách |
| FE06 Kho / Bản sao | Quy tắc về trạng thái/tình trạng có sẵn của bản sao | CRUD/trạng thái bản sao thành công + xung đột/lỗi | Thủ thư quản lý bản sao |
| FE07 Mượn sách | Quy tắc về điều kiện, hạn mức, tình trạng có sẵn, trả sách | Yêu cầu/phê duyệt/trả/lịch sử thành công + lỗi | Mượn → phê duyệt → trả |
| FE08 Đặt chỗ | Quy tắc về hàng đợi và hủy | Đặt/hủy/hàng đợi thành công + không có sẵn/lỗi | Thành viên đặt chỗ sách không có sẵn |
| FE09 Khoản phạt | Quy tắc tính phạt và trạng thái thanh toán | Tính/thu/đã trả/danh sách thành công + lỗi | Thủ thư ghi nhận thanh toán khoản phạt |
| FE10 Thông báo | Validation mẫu, payload an toàn, quy tắc kích hoạt | Thông báo/mẫu thành công + không hợp lệ/bị cấm | Người dùng xem hộp thư thông báo |
| FE11 Người dùng và vai trò | Quy tắc gán vai trò và quyền | Người dùng/vai trò thành công + bị cấm + vai trò không hợp lệ | Quản trị viên đổi vai trò người dùng |
| FE12 Báo cáo | Quy tắc tổng hợp và khoảng ngày | Báo cáo thành công + khoảng không hợp lệ + bị cấm | Nhân viên xem báo cáo |

### 5.3 Danh Mục Kiểm Thử Tự Động Hiện Tại (Backend, 2026-06-25)

| File kiểm thử | Khu vực bao phủ chính |
| --- | --- |
| `backend/tests/app.test.js` | Khởi động ứng dụng / hành vi route cơ bản |
| `backend/tests/authRoutes.test.js` | Endpoint xác thực FE02 |
| `backend/tests/authUtils.test.js` | Logic tiện ích xác thực FE02 |
| `backend/tests/borrowingRoutes.test.js` | Route mượn sách FE07 |
| `backend/tests/fineRoutes.test.js` | Route CRUD prototype cũ của FE09 |
| `backend/tests/fineManagementRoutes.test.js` | Tính/thu/đã trả/miễn trừ FE09 ở phía server |
| `backend/tests/integration.test.js` | Luồng tích hợp backend liên chức năng |
| `backend/tests/models.test.js` | Định nghĩa/liên kết model Sequelize |
| `backend/tests/notificationRoutes.test.js` | Route thông báo FE10 |
| `backend/tests/profileRoutes.test.js` | Route hồ sơ FE03 |
| `backend/tests/profileService.test.js` | Logic service hồ sơ FE03 |
| `backend/tests/reportRoutes.test.js` | Route báo cáo FE12 |
| `backend/tests/reservationRoutes.test.js` | Route đặt chỗ FE08 |
| `backend/tests/userManagementRoutes.test.js` | Route người dùng và vai trò FE11 |

Các ranh giới không chặn hiện tại được theo dõi trong `TECH_DEBT.md` và các gói xác thực Giai đoạn 2/3:
SQL Server CI dùng chung có thể hủy bỏ, lưu trữ avatar bền vững cho production, giao diện hộp thư FE10 bị hoãn
và bằng chứng SLA production. Trang trình duyệt FE09 cũ không phải bằng chứng phát hành có thẩm quyền.

### 5.4 Tóm Tắt Mức Độ Sẵn Sàng Theo Chức Năng

| Chức năng | Đặc tả | Kế hoạch/Nhiệm vụ | Bằng chứng tự động | FR `@spec` | Ghi chú sẵn sàng |
| --- | --- | --- | --- | --- | --- |
| FE01 Công khai / Duyệt sách | Đã phê duyệt | Hoàn thành | Route duyệt công khai + gói kết thúc Giai đoạn 2 | 100% | Đã chấp nhận; việc mở rộng danh mục trong tương lai vẫn ngoài phạm vi |
| FE02 Xác thực | Đã phê duyệt | Hoàn thành | Route xác thực, ranh giới OTP, hồi quy bảo mật | 100% | Đã chấp nhận; hợp đồng FE02/FE10 được đồng bộ 2026-07-20 |
| FE03 Hồ sơ người dùng | Đã phê duyệt | Hoàn thành | Route/service hồ sơ + kiểm thử quyền sở hữu/tương tranh | 100% | Lưu trữ avatar bền vững vẫn là ranh giới vận hành |
| FE04 Tư cách thành viên | Đã phê duyệt | Hoàn thành | Route/service thành viên + kiểm thử tương tranh | 100% | Thanh toán và tự động hóa hết hạn vẫn ngoài phạm vi |
| FE05 Quản lý sách | Đã phê duyệt | Hoàn thành | Route sách, migration, kiểm thử tình trạng có sẵn và audit | 100% | Nhập hàng loạt và đa thể loại vẫn ngoài phạm vi |
| FE06 Kho / Bản sao | Đã phê duyệt | Hoàn thành | Route kho, bằng chứng rowversion và tương tranh | 100% | RFID/phần cứng vẫn ngoài phạm vi |
| FE07 Mượn sách | Đã phê duyệt | Hoàn thành | Route, service, tích hợp và E2E cho mượn sách | 100% | Bộ lập lịch và yêu cầu một phần theo từng mục vẫn ngoài phạm vi |
| FE08 Đặt chỗ | Đã phê duyệt | Hoàn thành | Route đặt chỗ, hàng đợi, danh mục ứng viên và E2E | 100% | Đặt chỗ cấp sách vẫn ngoài phạm vi |
| FE09 Khoản phạt | Đã phê duyệt | Hoàn thành | Tính/thu phạt phía server và E2E | 100% | Trang trình duyệt cũ không có thẩm quyền |
| FE10 Thông báo | Đã phê duyệt | Hoàn thành | Route thông báo, mẫu an toàn và ranh giới bên yêu cầu | 100% | Giao diện hộp thư và tích hợp caller FE09 vẫn bị hoãn |
| FE11 Người dùng và vai trò | Đã phê duyệt | Hoàn thành | Vòng đời người dùng, quyền, audit và bằng chứng schema | 100% | Mở rộng vòng đời hàng loạt vẫn ngoài phạm vi |
| FE12 Báo cáo | Đã phê duyệt | Hoàn thành | Route báo cáo, chính sách xác định và E2E | 100% | Export và dashboard thời gian thực vẫn ngoài phạm vi |

---

## 6. Quy Trình Tạo Kiểm Thử Bằng Tác Nhân

### 6.1 Prompt Tạo Kiểm Thử (Mẫu #07)

```text
Write tests for [function/module/API endpoint].

Context:
- Feature: [FE## feature name]
- Source spec: .sdd/specs/feat-{name}/SPEC.md (use §8 Acceptance Criteria + §16 Traceability)
- Module under test: [package/file]
- Test type: [unit / integration / e2e]
- Coverage target: 80% minimum

Include: 1) happy path; 2) error cases from the spec; 3) edge cases (null/undefined/empty);
4) boundary values; 5) security cases where relevant (auth/role bypass, injection, data exposure).

Do not invent business rules not in SPEC.md. Map each important test to a BR/FR/AC where practical.
```

### 6.2 Kiểm Tra Tuân Thủ Đặc Tả (Trước Khi Chấp Nhận Kiểm Thử Được Tạo)

1. Kiểm thử có đọc từ `SPEC.md`, không chỉ từ mã nguồn hiện có không?
2. Mọi tiêu chí chấp nhận quan trọng có bằng chứng kiểm thử hoặc kiểm tra thủ công được ghi lại không?
3. Có cả luồng thành công và luồng lỗi không?
4. Có bao gồm trường hợp biên và giá trị ranh giới khi phù hợp không?
5. Assertion có ý nghĩa, không chỉ kiểm tra mã trạng thái không?
6. Không có thông tin bí mật được mã hóa cứng / dữ liệu cá nhân thật phải không?
7. Không làm yếu hoặc xóa kiểm thử hiện có phải không?
8. Nếu mã nguồn và đặc tả không thống nhất, sự khác biệt có được báo cáo (không bị che giấu) không?

### 6.3 Yêu Cầu Review Của Con Người

Kiểm thử được tạo vẫn là bản nháp cho đến khi con người review các vấn đề: thiếu quy tắc nghiệp vụ; giả định sai; assertion
yếu; mock quá mức làm che giấu lỗi tích hợp; kiểm thử sao chép lỗi triển khai;
thiếu kịch bản bảo mật/quyền; thiếu dọn dẹp hoặc ngày xác định.

---

## 7. Checklist Trước Commit

| # | Khu vực | Hạng mục | Bằng chứng dự án |
| --- | --- | --- | --- |
| 01 | CODE | Chạy được cục bộ, không có lỗi biên dịch/cú pháp | Kiểm thử/khởi động backend hoặc build frontend thành công |
| 02 | CODE | Không còn câu lệnh debug | Grep/review thủ công |
| 03 | CODE | Không còn TODO/FIXME chưa giải quyết trong mã đã merge | Grep/review thủ công |
| 04 | CODE | Tuân theo quy ước đặt tên trong `AGENTS.md` | Người review kiểm tra |
| 06 | TEST | Mọi kiểm thử hiện có đều đạt | `npm --prefix backend test` |
| 07 | TEST | Đã viết kiểm thử unit cho logic nghiệp vụ mới | Mỗi hàm service có kiểm thử có ý nghĩa |
| 08 | TEST | Độ bao phủ không giảm so với baseline | Báo cáo độ bao phủ sau khi bật baseline |
| 09 | SEC | Không có thông tin bí mật/khóa/mật khẩu trong mã nguồn | Review thủ công / quét bí mật |
| 10 | SEC | Kiểm tra dữ liệu đầu vào trên mọi endpoint mới | Validator/controller |
| 11 | SEC | Truy vấn có tham số (không injection) | Review cách dùng Sequelize/SQL thô |
| 12 | SPEC | Triển khai các tiêu chí chấp nhận | Kiểm tra từng AC liên quan trong `SPEC.md` |
| 13 | SPEC | Không mở rộng chức năng ngoài phạm vi | Diff với `SPEC.md`/`TASKS.md` đã phê duyệt |
| 14 | TRACE | FR mới/thay đổi có thẻ `@spec` | `npm run trace:enforce` đạt |
| 15 | DOC | Tài liệu API được cập nhật cho endpoint mới/thay đổi | SPEC §11 / OpenAPI khi sử dụng |

Các lệnh cục bộ được khuyến nghị:

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```

Không merge nếu một lệnh bắt buộc thất bại, trừ khi trưởng nhóm ghi lại ngoại lệ được chấp nhận.

---

## 8. Các Cột Mốc

| Cột mốc | Bằng chứng mục tiêu | Trạng thái |
| --- | --- | --- |
| Tuần 6: Độ bao phủ Auth `>=80%` | Kiểm thử unit/tích hợp Auth đạt; độ bao phủ đã kiểm tra | Đang chờ ngưỡng độ bao phủ chính thức |
| Tuần 10: Chức năng cốt lõi đạt chấp nhận | Mỗi chức năng cốt lõi đã triển khai có bằng chứng chấp nhận ánh xạ tới `SPEC.md` | Sẵn sàng để con người chấp nhận trên staging (6 chức năng) |
| Gate truy vết được thực thi | CI chạy `trace:enforce`; chức năng đã triển khai ≥70% | **Hoàn thành (2026-06-25)** |
| Tuần 11: Độ bao phủ `>=80%` được xác minh | Báo cáo độ bao phủ được tạo; khoảng trống được bổ sung | **Hoàn thành (2026-07-14)** |
| Tuần 11: E2E trình duyệt quan trọng | Playwright bao phủ đăng nhập -> mượn -> phê duyệt -> trả -> phạt -> báo cáo | **Hoàn thành (2026-07-14)** |
| Tuần 12: Bảo mật sạch | Không có lỗ hổng Critical/High; kiểm toán dependency hoàn thành | **Hoàn thành (2026-07-14)** |

---

## 9. Gate Xác Thực B6

Trước khi merge, xác thực bằng bốn lớp bằng chứng (playbook chương 13.3):

| Lớp | Ý nghĩa | Bằng chứng dự án | Kết quả bắt buộc |
| --- | --- | --- | --- |
| L1 Tự động | Kiểm thử unit, lint, build, truy vết | `npm --prefix backend test`, lint/build frontend, `trace:enforce` | Chặn merge nếu kiểm tra bắt buộc thất bại |
| L2 Tuân thủ đặc tả | Mọi hành vi bắt buộc có mã nguồn + truy vết | AC trong `SPEC.md` được kiểm tra với triển khai; có thẻ `@spec` | Nhiệm vụ chưa hoàn thành nếu thiếu độ bao phủ AC/truy vết |
| L3 Hiến chương | Bảo mật, kiến trúc, CI, tiêu chuẩn | Ràng buộc an toàn, RBAC, không có bí mật, ranh giới tầng | Chặn/chuyển cấp nếu vi phạm |
| L4 Chấp nhận | AC từ đặc tả được chứng minh | Kiểm thử thủ công, bằng chứng API, ảnh chụp/demo | Quay lại triển khai nếu chấp nhận thất bại |

```text
A task is done when tests are green and the spec checklist is complete — not because someone says so.
```

---

## 10. Quy Tắc Bảo Trì

Cập nhật file này khi: chính sách độ bao phủ thay đổi; có thêm cấp độ/công cụ kiểm thử mới; CI bắt đầu thực thi
ngưỡng độ bao phủ; một chức năng bổ sung endpoint/luồng quan trọng; kế hoạch Tuần 11/12 thay đổi; hoặc việc luân phiên Test
Engine được phân công. Giữ file này làm **chính sách** chuẩn; giữ chi tiết kiểm thử theo chức năng
trong `TEST_PLAN.md` của từng chức năng và ánh xạ kiểm thử theo yêu cầu trong §16 của từng `SPEC.md`.
