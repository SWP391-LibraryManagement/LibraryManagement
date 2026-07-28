# Xác thực đồng bộ business rule FE07/FE08/FE10/FE12

Ngày: 2026-07-27

## 1. Trạng thái review

- Nhánh: `codex/fe07-fe10-fe12-rule-alignment`
- Head nhánh đã publish:
  `f346ae07d5d2885c0d5b8131479dee764edd97ec`
- `origin/main` đã tích hợp: `8d0059bd28b6a7fc8e4ccbdf767ce4120a86aee7`
- Trình tự bàn giao đã phê duyệt: SPEC -> PLAN/TASKS -> RED -> code tối thiểu -> GREEN -> bằng chứng L1-L4/runtime
- Mô hình tài khoản đã phê duyệt: mỗi tài khoản được persist có đúng một vai trò
  loại trừ lẫn nhau theo `DEC-GEN-005`; việc gia hạn của Member và nhân viên
  dùng các tài khoản đơn vai trò riêng biệt.
- Trạng thái đối soát: Nhat đã phê duyệt addendum H2 `8d0059b` mới nhất ngày
  2026-07-27. Merge đã review được commit với `f346ae0` và push lên PR #63
  nháp.
- Kiểm tra PR bắt buộc: lần chạy CI `30244750250` đạt cho exact head `f346ae0`.
- Kết quả H3 đầu tiên: không có lỗi product-code hoặc business-spec; một phát
  hiện P2 hợp lệ chỉ ra câu chữ H2 trạng thái hiện tại đã cũ trong tài liệu quản
  trị.
- Ranh giới H2 Task 12 đóng băng: tại lúc đóng băng package, đợt khắc phục H3
  chỉ về tài liệu chưa commit và cần H2 mới trước khi publish. Nhat sau đó đã
  phê duyệt H2 đó; sự kiện sau publish được ghi trong PR #63.

Phần 3-9 giữ bằng chứng `e99daf5` trước đó làm baseline lịch sử. Phần 11 là
addendum product có thẩm quyền cho `8d0059b`; Phần 12 là package H2 Task 12 đã
đóng băng. Trạng thái hiện tại sau publish thuộc về PR #63 và closeout cuối sau
merge, không thuộc một trường đã commit tự tham chiếu.

## 2. Tệp đã thay đổi

- `.sdd/reviews/fe07-fe10-fe12-business-rule-alignment-validation-2026-07-27.md`
- `.sdd/specs/feat-borrowing-management/CHANGELOG.md`
- `.sdd/specs/feat-borrowing-management/PLAN.md`
- `.sdd/specs/feat-borrowing-management/SPEC.md`
- `.sdd/specs/feat-borrowing-management/TASKS.md`
- `.sdd/specs/feat-borrowing-management/TEST_PLAN.md`
- `.sdd/specs/feat-membership-management/SPEC.md`
- `.sdd/specs/feat-public-browse/CHANGELOG.md`
- `.sdd/specs/feat-public-browse/SPEC.md`
- `.sdd/specs/feat-public-browse/TASKS.md`
- `.sdd/specs/feat-reservation-management/CHANGELOG.md`
- `.sdd/specs/feat-reservation-management/PLAN.md`
- `.sdd/specs/feat-reservation-management/SPEC.md`
- `.sdd/specs/feat-reservation-management/TASKS.md`
- `.sdd/specs/feat-reservation-management/TEST_PLAN.md`
- `.sdd/specs/feat-notification-management/CHANGELOG.md`
- `.sdd/specs/feat-notification-management/PLAN.md`
- `.sdd/specs/feat-notification-management/SPEC.md`
- `.sdd/specs/feat-notification-management/TASKS.md`
- `.sdd/specs/feat-reporting-statistics/CHANGELOG.md`
- `.sdd/specs/feat-reporting-statistics/PLAN.md`
- `.sdd/specs/feat-reporting-statistics/SPEC.md`
- `.sdd/specs/feat-reporting-statistics/TASKS.md`
- `backend/src/repositories/borrowingRepository.js`
- `backend/src/services/borrowingService.js`
- `backend/src/services/notificationService.js`
- `backend/src/validators/reportValidators.js`
- `backend/tests/borrowingRepository.test.js`
- `backend/tests/borrowingRoutes.test.js`
- `backend/tests/helpers/inMemoryBorrowingRepositories.js`
- `backend/tests/notificationRoutes.test.js`
- `backend/tests/reportRoutes.test.js`
- `tests/e2e/system-golden-path.spec.js`
- `docs/superpowers/plans/2026-07-27-fe07-fe10-fe12-business-rule-alignment.md`
- `docs/superpowers/specs/2026-07-27-fe07-fe10-fe12-business-rule-alignment-design.md`
- `frontend/test/homeBookActions.test.js`
- `frontend/src/page/reservation/MyReservationsPage.jsx`
- `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`
- `frontend/src/utils/libraryFeatureViewModels.js`
- `frontend/test/reservationFrontend.test.js`

Cây làm việc đã tích hợp chứa 40 tệp thay đổi so với `origin/main`. Delta
production FE08 bổ sung duy nhất so với `origin/main` là phần hiển thị vị trí
queue null-safe được khoanh vùng trong hai trang reservation và formatter
view-model dùng chung. Không schema, route công khai, dependency, vai trò, vòng
đời, thuật toán queue hay kiến trúc nào thay đổi trên nhánh này.

## 3. Bằng chứng RED

| Chấp nhận | Lệnh | Lỗi quan sát được trước thay đổi production |
| --- | --- | --- |
| AT-001 / FE07-T052 | Chỉ lịch sử: kiểm thử nhánh gốc dùng một actor đa vai trò. | `DEC-GEN-005` và xác nhận đơn vai trò của Nhat đã thay thế tiền đề actor đó. Kiểm thử lỗi thời và delta phân quyền bị loại bỏ; đối soát dùng hợp đồng đơn vai trò hiện có làm baseline GREEN, không phải tuyên bố hành vi RED mới. |
| AT-002 / FE07-T049 | `npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js --testNamePattern "due date locked|return serializes"` | Route trả về `overdueDays = 12` đã cũ thay vì `2`; hợp đồng source repository không có ngày đến hạn/user đã khoá, ngày trả đã commit hay callback bằng chứng. |
| AT-003 / FE07-T050 | Chạy kiểm thử business-date một lần với `TZ=UTC` và một lần với `TZ=America/New_York`. | UTC đạt; New York trả về `2026-03-21` thay vì `2026-03-22`. |
| AT-004 / FE10-S11 | `npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js --testNamePattern "unsafe stored template"` | Cả ba definition lưu trữ không an toàn đều resolve thành `{ notificationId: 1, status: "SENT" }` thay vì bị từ chối. |
| AT-005 / FE12-N11 | `npm.cmd --prefix backend test -- --runTestsByPath tests/reportRoutes.test.js --testNamePattern "unsupported query keys"` | Mỗi endpoint borrowing, inventory và users đều trả `200` thay vì `400` an toàn. |
| Tích hợp FE08 main trước đó / FE08-T047 | Lần chạy Chromium đầu tiên với merge trung gian lịch sử `8f231d7`. | Tạo reservation thành công, nhưng E2E nhánh tìm `Đã đặt chỗ` lỗi thời; runtime hiển thị đúng `Đang đặt chỗ`. Upstream `e20fdc3` độc lập chứa bản sửa và handoff held-copy, nên nhánh giữ hành vi đó mà không có thay đổi production FE08 trùng lặp. |
| Quy tắc FE08 cùng sách trên main mới nhất / FE08-T045 | Không có tuyên bố RED mới của nhánh. | `e99daf5` đã chứa SPEC, triển khai và kiểm thử được phê duyệt. Tích hợp này giữ chính xác thay đổi upstream đó và chạy lại các cổng tập trung, cross-feature và runtime của nó. |

## 4. Bằng chứng GREEN và L1

| Phạm vi | Kết quả quan sát được |
| --- | --- |
| Đối soát đơn vai trò FE07-T052 | 3/3 đạt trước dọn dẹp và 3/3 đạt sau dọn dẹp. Librarian đơn vai trò có thể gia hạn khoản mượn đủ điều kiện của member khác; Member riêng vẫn bị giới hạn theo owner; các trường hợp sửa/invariant database FE11 vẫn xanh. |
| FE07-T049 tập trung | 2/2 đạt. Response và audit dùng ngày đến hạn đã khoá, DTO công khai loại trừ `authoritativeReturn`. |
| Ma trận timezone FE07-T050 | UTC 3/3 và America/New_York 3/3 đạt với business date và kết quả vai trò giống hệt. |
| Route/repository FE07 đầy đủ | 79/79 đạt. |
| FE10 tập trung | 4/4 đạt, gồm giữ nguyên sanitization template-data runtime. |
| FE10 đầy đủ | 139/139 đạt. |
| FE12 tập trung | 3/3 đạt với không lần gọi repository được chọn nào và không giá trị unknown trong response. |
| FE12 đầy đủ | 14/14 đạt. |
| Requester FE08 | 1/1 đạt. |
| FE08 SIT-003/SIT-004 | 2/2 đạt bằng pattern tương đương an toàn trên Windows `SIT-00[34]`. Pattern pipe gốc bị command shell Windows diễn giải trước Jest nên không chạy suite. |
| Repository/service/route FE08 cùng sách | 3 suite, 63/63 đạt, bao phủ loại trừ candidate, xung đột direct-create, cho phép terminal-loan, bỏ qua queue cũ, kiểm tra source lock/order và ánh xạ lỗi service. |
| Ánh xạ lỗi frontend FE08 | 7/7 đạt, gồm `BOOK_ALREADY_BORROWED`. |
| Lệnh SQL candidate FE08 | 2/2 kiểm thử source-contract đạt; 2 trường hợp SQL mutable bị bỏ qua vì chưa cấu hình database tạm thời đã phê duyệt. |
| L1 cross-feature | Lần chạy cuối mới với merge `e99daf5` đang mở: 7 suite, 284/284 kiểm thử đạt sau tích hợp đơn vai trò, held-copy và cùng sách. |

## 5. Bằng chứng tự động đầy đủ

| Lệnh | Kết quả quan sát được |
| --- | --- |
| `npm.cmd --prefix backend test` | Lần chạy tích hợp cuối mới: 61 suite, 1,051/1,051 kiểm thử đạt. |
| `npm.cmd --prefix backend run test:coverage:ci` | Lần chạy tích hợp cuối mới: 61 suite, 1,051/1,051 kiểm thử đạt. Câu lệnh 92.08%, nhánh 81.46%, hàm 97.38%, dòng 92.00%. |
| `npm.cmd --prefix frontend test` | Lần chạy tích hợp cuối mới: 231/231 kiểm thử đạt. |
| `npm.cmd --prefix frontend run lint` | Đạt với mã thoát 0. |
| `npm.cmd --prefix frontend run build` | Build production Vite đạt. |
| `npm.cmd run test:traceability-state` | 3/3 đạt. |
| `npm.cmd run trace:enforce` | Đạt; mọi feature active vẫn trên 70%, với FE07/FE10/FE12 tại 100% và FE08 tại 97%. |
| `git diff --check`, `git diff --cached --check`, `git diff HEAD --check`, `git diff origin/main --check` | Đạt với mã thoát 0. Chỉ có cảnh báo working-copy LF sang CRLF thông thường. Quét conflict-marker tìm thấy 0 marker; diff nhánh chứa chính xác 36 tệp so với `origin/main`; tệp production/kiểm thử FE08 upstream có 0 dòng diff so với `origin/main`. |

Các thư mục `backend/coverage`, `frontend/dist`, report/output Playwright và kết
quả kiểm thử được ignore vẫn không thuộc diff H2.

## 6. Bằng chứng SQL và runtime

### SQL mutable tuỳ chọn

- `DB_NAME` chưa được đặt.
- `FE07_SQL_TEST_ALLOW_MUTATION` chưa được đặt.
- Suite SQL mutable FE07 không được chạy và review này không đưa ra tuyên bố
  mutation SQL thực.
- Lệnh SQL candidate FE08 chạy `2/2` kiểm thử source-contract và bỏ qua `2`
  trường hợp database mutable theo cùng ranh giới environment.

### Runtime HTTP/trình duyệt cục bộ

Lệnh:

`npx.cmd playwright test tests/e2e/system-golden-path.spec.js tests/e2e/fe08-reservation-candidate-catalog.spec.js --project=chromium`

Quan sát:

- Lần FE08 đầu tiên lịch sử với merge trước chỉ lỗi ở locator `Đã đặt chỗ` đã
  cũ sau response tạo thành công; snapshot runtime cho thấy nhãn upstream
  `Đang đặt chỗ` do FE08 v0.5.6 yêu cầu.
- Lần chạy Chromium kết hợp cuối với tích hợp `e99daf5` đang mở đạt 2/2 trên
  các HTTP server cục bộ.
- `E2E-SYS-001` đạt login -> borrow -> approve -> return -> fine -> report.
- Cùng golden path quan sát
  `/api/reports/borrowing?bogus=runtime-secret-value` trả về
  `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` mà không echo giá trị.
- `E2E-FE08-ACC01` đạt tìm kiếm candidate và tạo reservation thực.
- Không mutation staging hoặc lần chạy chấp nhận staging nào được thực hiện.

## 7. Rà soát truy vết spec L2

| Quyết định | Task | Kiểm thử/bằng chứng | Triển khai |
| --- | --- | --- | --- |
| BD-007 / AT-001 | FE07-T052 | Baseline đối soát đơn vai trò trước/sau dọn dẹp cùng coverage invariant một vai trò/sửa legacy FE11 | Guard gia hạn một vai trò hiện có: Member chỉ owner; Librarian/Admin cross-member; mọi blocker vẫn theo loan-owner |
| BD-002 / AT-002 | FE07-T049 | Route RED/GREEN preflight cũ cùng hợp đồng source repository | Snapshot due/user/return đã khoá xây một object bằng chứng audit/fine bên trong transaction return |
| BD-003 / AT-003 | FE07-T050 | Ma trận RED/GREEN UTC/New York | Mở rộng gia hạn và so sánh authoritative dùng `libraryBusinessTime` |
| BD-004 / AT-004 | FE10-S11 | Ba trường hợp definition không an toàn cùng giữ giá trị runtime | Definition đã lưu từ chối an toàn trước lookup recipient, render, persistence hoặc provider I/O |
| BD-005 / AT-005 | FE12-N11 | Ba trường hợp allowlist endpoint cùng chấp nhận HTTP cục bộ | Middleware exact-key là phần tử đầu tiên trong mỗi mảng validator endpoint |
| BD-006 / AT-006 | FE08-T047 | Requester 1/1, SIT-003/SIT-004 2/2 và chấp nhận trình duyệt 2/2 | Không thay đổi production hoặc contract FE08 bổ sung từ lát cắt rule-alignment |
| BR-FE08-019 / FR-FE08-034 / AC-FE08-021 | FE08-T045 | Repository/service/route 63/63, ánh xạ lỗi frontend 7/7, cross-feature 284/284 | Loại trừ candidate `e99daf5` upstream, `BOOK_ALREADY_BORROWED` transactional, bỏ qua queue cũ và lock circulation Member FE07 dùng chung được giữ nguyên chính xác |

Kết quả L2: ĐẠT. Không xác định hành vi nào ngoài phạm vi rule-alignment đã
phê duyệt và các contract tích hợp FE08 v0.5.9 upstream.

## 8. Rà soát constitution và an toàn L3

- Mỗi tài khoản được persist có đúng một vai trò theo `DEC-GEN-005`,
  `BR-G-009` và invariant database FE11. Kiểm thử gia hạn Member và nhân viên
  dùng tài khoản riêng.
- Fixture role-array cũ/legacy hiện có là kiểm tra defense-in-depth cho dữ liệu
  không hợp lệ; chúng không phải actor nghiệp vụ đa vai trò được hỗ trợ.
- Route candidate/create FE08 vẫn chỉ Member; SQL cùng sách dùng tham số có
  kiểu, tạo trực tiếp xác thực lại trong transaction, và queue holding xác thực
  lại sau khi lấy lock circulation Member FE07 dùng chung.
- Phân quyền server không cho Member gia hạn khoản mượn của member khác, và
  phạm vi nhân viên không vượt qua blocker loan-owner.
- Audit return vẫn trong transaction SQL/trong bộ nhớ và dùng cùng snapshot
  authoritative với `fineCandidate`.
- Definition đã lưu không an toàn trả về code/message chung và không tạo
  notification, attempt hay gọi provider.
- Giá trị template runtime giữ các đường sanitization và che key giống secret
  hiện có.
- Giá trị query report không được hỗ trợ không bị chuyển tiếp hoặc echo.
- Hành vi report vẫn chỉ đọc và validator giá trị đã phê duyệt hiện có vẫn giữ.
- Không phát hiện mở rộng secret, PII thực, schema, dependency, route công khai,
  vai trò, workflow frontend hay kiến trúc.

Kết quả L3: ĐẠT.

## 9. Rủi ro còn lại

- Hợp đồng repository SQL được bao phủ bởi kiểm thử source-contract, parity
  trong bộ nhớ và regression đầy đủ, nhưng chưa có SQL Server tạm thời có tên
  nào được cấu hình để chạy transaction mutable.
- Chấp nhận trình duyệt/runtime cục bộ đạt; staging không được thực hiện trong
  batch này.
- Cảnh báo working-copy LF sang CRLF thông thường còn lại; `git diff --check`
  đạt.

## 10. Cổng H2 trước đó

Tích hợp `e99daf5` đã được H2 phê duyệt và commit/push với
`2a478ba1ac025d319c6e09ef0eff73ae650a09d3`. Phê duyệt đó không bao phủ merge
mới với `origin/main` tại `8d0059b`.

## 11. Addendum H2 - `main@8d0059b`

### 11.1 Phạm vi đi vào và đối soát

- Commit đi vào: `8d0059b fix: sync reservation queue and fine permissions`.
- FE07: kết hợp các nhánh v0.7.8 song song thành v0.7.9; tiền phạt FE09
  `UNPAID` dương vẫn là blocker borrow/renew chuẩn và đối soát Member vẫn chỉ
  đọc.
- FE08: kết hợp các nhánh v0.5.9 song song thành v0.5.10. `FE08-T046` upstream
  sở hữu vị trí queue theo phạm vi copy; task regression của nhánh nay là
  `FE08-T047`.
- FE09: `FE09-T024` upstream làm `/api/fines/me` chỉ dành cho Member đơn vai
  trò, thêm context due/return/borrow FE07 và giữ phần hiển thị Member chỉ đọc.
- FE11: `BR-FE11-028` nay nêu rõ bao gồm quyền truy cập own-fine FE09, đồng
  thời giữ đúng một vai trò tài khoản loại trừ lẫn nhau.

### 11.2 Bằng chứng RED-GREEN

| Phạm vi | Kết quả quan sát được |
| --- | --- |
| FE08-T046 RED | Kiểm thử frontend tập trung lỗi vì `formatReservationQueuePosition` là `undefined`; mapper trả null trong khi trang đi vào vẫn interpolate `#${item.queue}`. |
| FE08-T046 GREEN | Formatter dùng chung trả về `Chưa xác định` cho null/undefined và giữ `#2 trong hàng đợi cuốn này`; các hợp đồng source Member/nhân viên dùng nó và không có interpolate `#${...queue}` trực tiếp. Kết quả tập trung: 1/1 đạt. |
| Backend FE09 tập trung | 1 suite, 22/22 đạt, gồm Guest 401, Librarian/Admin 403, dòng riêng chỉ Member và context borrowing FE07. |
| Frontend FE08/FE09 tập trung | 17/17 đạt; UI fine Member vẫn chỉ đọc và hiển thị vị trí queue null-safe. |
| Cross-feature | 7 suite, 295/295 đạt trên borrowing, reservation, fine, notification, reporting và tích hợp hệ thống. |
| Invariant một vai trò | 2 suite, 3/3 trường hợp chọn đạt cho gia hạn đơn vai trò, ép đúng một vai trò và sửa nhiều mapping legacy. |
| Ma trận timezone | UTC 3/3 và America/New_York 3/3 đạt với kết quả giống hệt. |

### 11.3 Bằng chứng L1 đầy đủ mới

| Lệnh | Kết quả quan sát được |
| --- | --- |
| `npm.cmd --prefix backend test` | 61 suite, 1,052/1,052 đạt. |
| `npm.cmd --prefix backend run test:coverage:ci` | 61 suite, 1,052/1,052 đạt; câu lệnh 92.08%, nhánh 81.46%, hàm 97.38%, dòng 92.00%. |
| `npm.cmd --prefix frontend test` | 232/232 đạt. |
| `npm.cmd --prefix frontend run lint` | Thoát 0. |
| `npm.cmd --prefix frontend run build` | Build production Vite đạt. |
| `npm.cmd run test:traceability-state` | 3/3 đạt. |
| `npm.cmd run trace:enforce` | ĐẠT; FE07/FE09/FE10/FE12 giữ 100%, FE08 giữ 97% và mọi feature active vượt 70%. |

Các thư mục coverage, build, report/output Playwright và kết quả kiểm thử được
ignore vẫn không thuộc diff H2.

### 11.4 Truy vết spec L2

| Yêu cầu | Task | Bằng chứng code/kiểm thử |
| --- | --- | --- |
| BR-FE08-020, FR-FE08-035, AC-FE08-022 | FE08-T046 | `mapReservation` giữ null; formatter dùng chung và cả hai trang render null là `Chưa xác định`; cổng tập trung/frontend/đầy đủ/trình duyệt đạt. |
| BR-FE09-020, FR-FE09-019, AC-FE09-017 | FE09-T024 | Route và service ép truy cập chỉ Member; repository/OpenAPI phơi bày context FE07; backend 22/22 và kiểm tra frontend chỉ đọc đạt. |
| BD-006, SL-006, AT-006 | FE08-T047 | Coverage Requester/SIT thuộc cross-feature 295/295; cổng đầy đủ và Chromium đạt. |
| DEC-GEN-005, BR-G-009, BR-FE11-028 | Invariant một vai trò FE11 hiện có | Các trường hợp đúng một vai trò và sửa đạt; kiểm thử Member/nhân viên FE09 dùng tài khoản đơn vai trò riêng. |

Kết quả L2: ĐẠT. Không còn va chạm ID task, phiên bản feature trùng hay hành vi
nghiệp vụ không truy vết trong kết quả merge hiện tại.

### 11.5 Constitution và bảo mật L3

- `/api/fines/me` xác thực và áp dụng `requireMemberOnly` trước controller;
  service lặp lại kiểm tra Member/không phải nhân viên.
- Phạm vi Member bị ép từ `actor.userId` đã xác thực; input query không thể chọn
  user khác.
- Quyền sở hữu mutation Librarian/Admin và waive/cancel chỉ Admin không đổi.
- Giá trị tìm kiếm, user, status, offset và limit danh sách fine dùng tham số
  SQL có kiểu. Mảnh `WHERE` động chỉ đến từ clause allowlist cố định.
- React render văn bản bình thường; không có đường raw HTML mới.
- Quét secret diff không tìm thấy pattern credential/private-key. Kiểm thử lỗi
  an toàn và hành vi redaction hiện có vẫn xanh.
- Không đưa vào mở rộng dependency, schema, route công khai, vai trò,
  state-machine hay kiến trúc.

Kết quả L3: ĐẠT.

### 11.6 Chấp nhận runtime L4

Lệnh:

`npx.cmd playwright test tests/e2e/system-golden-path.spec.js tests/e2e/fe08-reservation-candidate-catalog.spec.js --project=chromium`

Quan sát: Chromium 2/2 đạt. `E2E-FE08-ACC01` hoàn tất tìm kiếm candidate thực
và tạo reservation; `E2E-SYS-001` hoàn tất login -> borrow -> approve -> return
-> fine -> report và giữ việc từ chối query report unknown an toàn.

### 11.7 Diff hygiene và rủi ro còn lại

- Diff cây làm việc so với `origin/main`: 40 tệp; chỉ bốn tệp hiển thị/kiểm thử
  FE08 là delta nhánh mới từ tích hợp này.
- `git diff --check`, các biến thể cached/HEAD/origin: thoát 0.
- Quét conflict-marker: 0.
- `DB_NAME` và `FE07_SQL_TEST_ALLOW_MUTATION` chưa đặt; SQL mutable không chạy
  và không có tuyên bố mutation SQL thực mới.
- Chấp nhận trình duyệt cục bộ đạt; staging không được thực hiện.
- Cảnh báo LF sang CRLF thông thường vẫn không chặn.

### 11.8 Bằng chứng product H2 đã publish

Nhat đã phê duyệt merge `8d0059b` đầy đủ, đối soát, khắc phục FE08 được khoanh
vùng và bằng chứng L1-L4 mới tại H2 ngày 2026-07-27. Merge đã review được
commit với `f346ae0`, push lên PR #63 nháp và lần chạy CI `30244750250` đạt.
Review H3 đầu tiên tìm thấy một lỗi trạng thái hiện tại chỉ về tài liệu; Phần 12
thay thế cổng này cho việc khắc phục.

## 12. Khắc phục bằng chứng quản trị H3

### 12.1 Review H3 đầu tiên

Điểm cố định và bằng chứng đã publish:

- Base: `origin/main@8d0059bd28b6a7fc8e4ccbdf767ce4120a86aee7`
- Head: `f346ae07d5d2885c0d5b8131479dee764edd97ec`
- PR nháp: #63, trạng thái merge `CLEAN`
- CI bắt buộc: lần chạy `30244750250`, `foundation-checks` success
- Parity diff: cục bộ và PR cùng chứa 40 tệp, không sai tên, mục chưa merge,
  lỗi khoảng trắng hay conflict marker.

Kết luận review:

- Review Standards không phát hiện commit trái phép sau khi xác nhận phê duyệt
  H2 của Nhat có trước commit và push.
- Review Spec không phát hiện yêu cầu thiếu, scope creep hay hành vi product
  không đúng.
- Lo ngại replay idempotent FE10 ban đầu đã được rút lại:
  `AC-FE10-008`/`EC-FE10-008` yêu cầu key trùng trả về bản ghi `200` hiện có,
  và đường replay không render, persist mới hay provider I/O.
- Còn một P2 hợp lệ: validation trạng thái hiện tại, PLAN, TASKS và một dòng
  truy vết FE10 vẫn mô tả kết quả tích hợp là chưa commit, H2 đang chờ hoặc chờ
  phê duyệt PLAN/TASKS.

### 12.2 Phạm vi khắc phục

Đợt khắc phục chưa commit chỉ cập nhật 12 tệp Markdown sau:

- `.sdd/reviews/fe07-fe10-fe12-business-rule-alignment-validation-2026-07-27.md`
- `.sdd/specs/feat-borrowing-management/PLAN.md`
- `.sdd/specs/feat-borrowing-management/TASKS.md`
- `.sdd/specs/feat-reservation-management/PLAN.md`
- `.sdd/specs/feat-reservation-management/TASKS.md`
- `.sdd/specs/feat-notification-management/PLAN.md`
- `.sdd/specs/feat-notification-management/SPEC.md`
- `.sdd/specs/feat-notification-management/TASKS.md`
- `.sdd/specs/feat-reporting-statistics/PLAN.md`
- `.sdd/specs/feat-reporting-statistics/TASKS.md`
- `docs/superpowers/specs/2026-07-27-fe07-fe10-fe12-business-rule-alignment-design.md`
- `docs/superpowers/plans/2026-07-27-fe07-fe10-fe12-business-rule-alignment.md`

Đợt khắc phục này không thay đổi code production, kiểm thử, schema, dependency,
API, business rule hay hướng dẫn quy trình lịch sử trước H2 nào.

### 12.3 Xác thực được khoanh vùng

| Lệnh | Kết quả quan sát được |
| --- | --- |
| `npm.cmd run test:traceability-state` | 3/3 đạt. |
| `npm.cmd run trace:enforce` | ĐẠT; FE07/FE10/FE12 giữ 100%, FE08 giữ 97% và mọi feature active vượt 70%. |
| `npm.cmd run test:deployment` | 9/9 đạt. |
| Kiểm tra phạm vi chỉ tài liệu | 12 tệp Markdown thay đổi, 0 tệp không phải Markdown và 0 tệp đã stage. |
| Quét câu chữ cũ trạng thái hiện tại | 0 khớp H2 gốc đã cũ; câu chữ H2 mới chỉ nói đến đợt khắc phục tài liệu chưa commit này. |
| `git diff --check`; `git diff --cached --check` | Cả hai đạt với không dòng lỗi; chỉ phát cảnh báo working-copy LF sang CRLF thông thường. |

### 12.4 Ranh giới package H2 đóng băng

Tại thời điểm package Task 12 này được đóng băng cho H2, đợt khắc phục chỉ về
tài liệu chưa commit và chưa push. Cần H2 mới trước commit hoặc push. Tiểu mục
này cố ý giữ sự thật tại thời điểm review đó và không khẳng định mô tả trạng
thái nhánh sau publish. Phê duyệt H2 sau đó của Nhat, commit `2d0ef78`, lần
chạy CI `30246892241` và trạng thái H3 tiếp theo được ghi trong PR #63 cho đến
closeout cuối sau merge.

## 13. Khắc phục bằng chứng đóng băng H3 lặp lại

Review H3 lặp lại dùng exact head
`2d0ef78bc71f9b2f941ac8965e589606cad5f060` sau khi lần chạy CI `30246892241`
hoàn tất thành công.

- Review Spec/nghiệp vụ: ĐẠT, không phát hiện.
- Review Standards: một phát hiện P2. Task 12 đã sửa câu chữ `f346ae0` cũ,
  nhưng các nhãn như "current gate" khiến snapshot Task 12 vừa commit trông cũ
  ngay sau publish.
- Nguyên nhân gốc: tệp đã commit không thể trung thực chứa SHA commit tương
  lai của chính nó hoặc vẫn là sổ cái trạng thái hiện tại sống mà không tạo vòng
  lặp commit chỉ bằng chứng vô hạn.
- Khắc phục: đổi nhãn bằng chứng H2 đã commit thành snapshot package bất biến;
  ghi phê duyệt H2, SHA commit, CI đã cập nhật, H3 lặp lại, SHA merge và CI sau
  merge trong PR #63 cùng biên bản closeout cuối.

Package Task 13 gồm ba tệp này chỉ thay đổi biên bản validation này, thiết kế
rule-alignment và kế hoạch triển khai. Tại lúc đóng băng package, nó chưa commit
và chưa push, đang chờ H2. Câu đó rõ ràng là sự thật đóng băng trước publish,
không phải tuyên bố về trạng thái sau publish về sau.

Xác thực Task 13 được khoanh vùng:

| Lệnh/kiểm tra | Kết quả quan sát được |
| --- | --- |
| `npm.cmd run test:traceability-state` | 3/3 đạt. |
| `npm.cmd run trace:enforce` | ĐẠT; FE07/FE10/FE12 giữ 100%, FE08 giữ 97% và mọi feature active vượt 70%. |
| `npm.cmd run test:deployment` | 9/9 đạt. |
| Quét phạm vi và trạng thái sống | 3 tệp Markdown thay đổi, 0 tệp không phải Markdown, 0 tệp đã stage và 0 nhãn trạng thái sống tự tham chiếu. |
| `git diff --check` | Đạt với không dòng lỗi; chỉ phát cảnh báo working-copy LF sang CRLF thông thường. |
