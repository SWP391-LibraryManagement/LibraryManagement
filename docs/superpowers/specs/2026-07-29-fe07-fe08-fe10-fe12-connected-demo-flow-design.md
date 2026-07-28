# Thiết Kế Luồng Demo Liên Hoàn FE07/FE08/FE10/FE12

**Trạng thái:** THIẾT KẾ ĐÃ ĐƯỢC DUYỆT TRONG THẢO LUẬN - ĐANG CHỜ RÀ SOÁT FILE

**Ngày duyệt thiết kế trong thảo luận:** 2026-07-29

**Người duyệt trong tác vụ hiện tại:** Người dùng

**Chủ sở hữu các SPEC liên quan:** Nhat

**Mục tiêu giao hàng:** Demo-safe, ưu tiên giao diện web desktop, không thêm bảng
dữ liệu mới và không tự động hóa hàng đợi ngoài tầm kiểm soát của Thủ thư.

## 1. Quyết Định Và Phạm Vi

Thiết kế này bổ sung một luồng demo liên hoàn, giúp người xem quan sát được cách
FE07, FE08, FE10 và FE12 phối hợp trên cùng một chuỗi trạng thái:

```text
Member tạo yêu cầu mượn
  -> Librarian duyệt
  -> FE10 thông báo kết quả
  -> Member khác đặt chỗ
  -> sách được trả
  -> Librarian xử lý hàng đợi
  -> FE10 thông báo sách sẵn sàng
  -> Member tạo yêu cầu mượn bản sao đã giữ
  -> FE07 hoàn tất lượt giữ FE08
  -> FE12 phản ánh trạng thái mới
```

Thiết kế giữ nguyên các quyết định baseline đã được phê duyệt:

- tối đa 5 bản sao đang mượn;
- hạn mức hằng ngày 5 bản sao cho tư cách thành viên FE04 `APPROVED`, 3 bản sao
  cho tài khoản `MEMBER` đang hoạt động khác;
- thời hạn mượn 14 ngày theo lịch;
- tối đa 3 lượt đặt chỗ mở;
- lượt giữ `NOTIFIED` có hiệu lực 2 ngày theo lịch;
- hàng đợi FIFO theo hợp đồng FE08 hiện tại;
- mỗi tài khoản có đúng một vai trò đăng nhập;
- FE12 chỉ đọc;
- lỗi gửi thông báo FE10 không hoàn tác nghiệp vụ nguồn đã commit.

Mọi yêu cầu mới trong tài liệu này được phân loại là `proposed-decision` cho đến
khi file thiết kế được người dùng rà soát và các SPEC liên quan được cập nhật,
phê duyệt bằng revision ổn định.

Tài liệu này không tự cấp quyền sửa product code, schema, API hoặc triển khai.

## 2. Nguồn Bằng Chứng

| Source ID | Nguồn | Revision/ngày | Có thể chứng minh | Mức thẩm quyền | Chủ sở hữu | Xung đột |
| --- | --- | --- | --- | --- | --- | --- |
| S-001 | Quyết định người dùng trong tác vụ hiện tại | 2026-07-29 | Chọn hướng demo-safe, chọn luồng liên hoàn và duyệt ba phần thiết kế | Cao nhất cho lát cắt đề xuất | Người dùng | Chờ rà soát file viết |
| S-002 | `.sdd/constitution.md`, `.sdd/shared_context.md`, `.sdd/constraints/*.md` | Baseline hiện hành khi đọc ngày 2026-07-29 | Quy tắc dự án, vai trò, giới hạn mượn, bảo mật và ownership | Baseline dự án đã phê duyệt | Nhóm | Không |
| S-003 | FE07 `SPEC.md` v0.8.3 | 2026-07-28 | Trạng thái mượn, trả, gia hạn, hàng đợi và hoàn tất lượt giữ | SPEC tính năng | Nhat | Đang trong vòng rà soát con người của revision hiện tại |
| S-004 | FE08 `SPEC.md` v0.5.10 | 2026-07-27 | FIFO, vị trí hàng đợi, xử lý thủ công, `NOTIFIED` và `FULFILLED` | SPEC tính năng đã phê duyệt | Nhat | Không |
| S-005 | FE10 `SPEC.md` v0.5.0 | 2026-07-28 | Hộp thư cá nhân, lũy đẳng, action path và lỗi không chặn nguồn | SPEC tính năng đã hoàn tất | Nhat | Chưa có các mẫu kết quả mượn mới của thiết kế này |
| S-006 | FE12 `SPEC.md` v0.2.0 | 2026-07-27 | Báo cáo chỉ đọc, KPI hiện có và quyền nhân viên | SPEC tính năng đã phê duyệt | Nhat | Chưa có operations summary của thiết kế này |
| S-007 | Mã nguồn, kiểm thử và runtime local hiện tại | Working tree ngày 2026-07-29 | Hành vi quan sát được và bề mặt UI hiện tại | Bằng chứng quan sát, không phải chính sách | Nhóm kỹ thuật | Không được dùng để tự suy ra yêu cầu mới |

## 3. Quyết Định Thiết Kế

| Decision ID | Câu hỏi | Quyết định đề xuất | Lý do | Phân loại |
| --- | --- | --- | --- | --- |
| BD-001 | Mở rộng bốn FE theo cách nào? | Tạo một golden flow xuyên FE07 -> FE08 -> FE10 -> FE12 | Dễ trình bày trước hội đồng và chứng minh ranh giới tính năng | `proposed-decision` |
| BD-002 | Hàng đợi có tự xử lý sau khi trả không? | Không. FE07 chỉ hiển thị handoff; Librarian xác nhận FE08 xử lý | Giữ demo ổn định và đúng baseline xử lý thủ công | `proposed-decision` |
| BD-003 | Có thêm bảng/kênh thông báo mới không? | Không. Tái sử dụng `Notifications` và hộp thư web v0.5.0 | Tránh dual-write và migration schema không cần thiết | `proposed-decision` |
| BD-004 | Thông báo kết quả mượn được mô hình hóa thế nào? | Dùng bản ghi không nhạy cảm `GENERAL_SYSTEM` với template key chuẩn do FE07 sở hữu sự kiện nguồn | Không thêm enum/kênh mới nhưng vẫn có action path an toàn | `proposed-decision` |
| BD-005 | Dashboard có tự đếm dữ liệu trên frontend không? | Không. FE12 cung cấp operations summary chỉ đọc từ database | Số liệu phải tái tạo, phân quyền và kiểm thử được | `proposed-decision` |
| BD-006 | Ưu tiên responsive nào? | Desktop 1440x900 là acceptance chính; không chủ động mở rộng mobile trong lát cắt | Phù hợp mục tiêu demo website của người dùng | `proposed-decision` |

## 4. Ranh Giới Tác Nhân Và Ownership

Mọi ô chưa được trích trực tiếp từ baseline hiện hành là `proposed-decision`.

| Actor | Mục tiêu nghiệp vụ | Có thể khởi tạo | Không được thực hiện | Chuyển trạng thái sở hữu | Phạm vi dữ liệu | Handoff | Lỗi chính |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Member | Mượn sách, theo dõi khoản mượn và nhận sách đã giữ | Yêu cầu mượn của mình, đặt chỗ của mình, yêu cầu mượn bản sao `NOTIFIED` của mình, đọc thông báo của mình | Duyệt/từ chối, xử lý hàng đợi, xem báo cáo nhân viên hoặc thao tác dữ liệu người khác | Không sở hữu transaction; service tính năng sở hữu | Dữ liệu của chính tài khoản | FE07 -> FE10, FE08 -> FE10 | `401/403/404/409` an toàn |
| Librarian | Xử lý lưu thông và hàng đợi | Duyệt/từ chối, trả, gia hạn, xử lý hàng đợi, xem dashboard | Bỏ qua điều kiện hợp lệ, tự quyết định thông báo hoặc sửa số liệu báo cáo | Cho phép FE07/FE08 thực hiện transaction | Phạm vi nghiệp vụ nhân viên | FE07 -> FE08 -> FE10 -> FE12 | Stale state trả `409`, không giả lập thành công |
| Admin | Có quyền nghiệp vụ nhân viên theo SPEC hiện hành | Các thao tác Librarian và xem báo cáo | Bỏ qua rule theo chủ sở hữu khoản mượn hoặc ownership đặt chỗ | Như Librarian | Phạm vi đã được role guard cho phép | Như Librarian | Như Librarian |
| FE07 | Sở hữu yêu cầu mượn, bàn giao, trả, gia hạn | Xử lý lệnh FE07 hợp lệ | Chọn người trong hàng đợi hoặc quyết định trạng thái gửi | `BorrowRequests`, `BorrowDetails`, trạng thái bản sao trong transaction đã phê duyệt, hoàn tất đúng lượt giữ `NOTIFIED` | Dữ liệu mượn và read-only reservation ownership cần thiết | Trả queue handoff cho FE08; yêu cầu FE10 sau commit | Rollback transaction FE07; lỗi FE10 không rollback |
| FE08 | Sở hữu đặt chỗ, FIFO, lượt giữ và hết hạn | Tạo/hủy/xử lý hàng đợi hợp lệ | Duyệt mượn, trả sách hoặc gửi email trực tiếp | `Reservations` và trạng thái giữ bản sao theo contract | Dữ liệu đặt chỗ/hàng đợi | Gọi FE10 sau commit; FE07 hoàn tất lượt giữ đúng owner | Race chỉ một người thắng; lỗi FE10 không rollback lượt giữ |
| FE10 | Gửi và hiển thị thông báo cá nhân | Nhận source request đã ràng buộc | Quyết định trạng thái mượn/đặt chỗ hoặc nhận URL tùy ý | `Notifications`, attempts, delivery/read state | Bản ghi thông báo đủ điều kiện của đúng người dùng | Trả action path allowlist | Lỗi an toàn, lũy đẳng và không chặn nguồn |
| FE12 | Cung cấp tổng hợp chỉ đọc | Nhận yêu cầu report đã phân quyền | Sửa nguồn hoặc tính số liệu từ danh sách frontend không đầy đủ | Không có state transition nghiệp vụ | Aggregate/detail được phê duyệt | Drill-down tới FE07/FE08/report | KPI lỗi riêng, không biến thành số 0 |

## 5. Golden Flow Được Đề Xuất

### 5.1 Tạo Và Duyệt Yêu Cầu Mượn

1. Member A chọn một bản sao đủ điều kiện và gửi yêu cầu FE07.
2. FE07 tạo `BorrowRequests.Status = PENDING` và
   `BorrowDetails.Status = REQUESTED`.
3. UI Member hiển thị timeline với bước `Chờ duyệt`.
4. Librarian mở bối cảnh yêu cầu và phê duyệt.
5. FE07 transaction cập nhật dữ liệu mượn/bản sao/audit theo SPEC hiện hành.
6. Sau commit, FE07 yêu cầu FE10 tạo thông báo kết quả mượn không nhạy cảm.
7. FE10 lưu/gửi một bản ghi lũy đẳng và action path `/borrowing/history`.

Nếu yêu cầu bị từ chối, FE07 giữ lý do trong audit như baseline hiện hành và
FE10 tạo thông báo kết quả từ chối an toàn, không đưa lý do tùy ý vào action
path hoặc metadata nhạy cảm.

### 5.2 Đặt Chỗ Và Trả Sách

1. Member B tạo đặt chỗ FE08 cho bản sao đang được mượn.
2. FE08 giữ FIFO hiện hành và trả `queuePosition`.
3. Member A trả bản sao qua FE07.
4. FE07 commit kết quả trả và giữ nguyên ownership hàng đợi `ACTIVE`.
5. Kết quả FE07 bổ sung read-only `reservationQueueAction`:

```json
{
  "copyId": 123,
  "hasActiveQueue": true,
  "actionPath": "/librarian/reservations"
}
```

Trường này được tính từ trạng thái đã khóa/đọc có thẩm quyền trong luồng trả;
nó không chuyển trạng thái FE08.

6. UI Librarian chỉ hiển thị “Xử lý hàng đợi đặt chỗ” khi
   `hasActiveQueue = true`.
7. Nút chỉ điều hướng tới màn FE08; không tự gọi mutation.

### 5.3 Xử Lý Hàng Đợi Và Bàn Giao

1. Librarian mở FE08 và xác nhận “Giữ sách & thông báo”.
2. FE08 transaction chọn người hợp lệ đầu tiên theo FIFO hiện hành.
3. FE08 chuyển đúng reservation sang `NOTIFIED`, giữ bản sao và đặt
   `ExpiresAt` theo baseline hai ngày.
4. Sau commit, FE08 yêu cầu FE10 tạo `RESERVATION_READY`.
5. Member B nhấn thông báo và được điều hướng tới `/reservations/mine`.
6. UI của reservation `NOTIFIED` hiển thị “Tạo yêu cầu mượn sách đã giữ”.
7. FE07 nhận đúng `copyId`; mọi rule server-side vẫn được đánh giá lại.
8. Khi phê duyệt thành công, FE07 hoàn tất đúng reservation thành `FULFILLED`
   trong cùng transaction đã được phê duyệt.

### 5.4 Quan Sát Qua FE12

Operations summary chỉ đọc phản ánh trạng thái mới sau mỗi mutation đã commit.
Không có optimistic count và không có số liệu do frontend tự suy ra từ một
trang dữ liệu phân trang.

## 6. Thiết Kế Thành Phần

### 6.1 FE07 - Borrowing Journey

Màn lịch sử/chi tiết mượn bổ sung timeline được suy ra từ dữ liệu chuẩn:

- `REQUESTED/PENDING`: Chờ duyệt;
- `BORROWED`: Đang mượn;
- `RETURNED`: Đã trả;
- yêu cầu sở hữu `REJECTED`: Đã từ chối;
- `LOST/DAMAGED`: trạng thái kết thúc tương ứng.

Chỉ hiển thị timestamp đã có trong DTO chuẩn. Không tạo thời gian giả khi
trường nguồn vắng mặt.

Lỗi nghiệp vụ được ánh xạ từ error code server sang mô tả tiếng Việt và hành
động tiếp theo. Các nhóm tối thiểu:

- sách/khoản mượn quá hạn;
- khoản phạt `UNPAID`;
- vượt hạn mức;
- trùng quy trình cùng đầu sách;
- bản sao thuộc yêu cầu chờ khác;
- hàng đợi/lượt giữ FE08 có quyền ưu tiên;
- dữ liệu đã thay đổi và cần tải lại.

### 6.2 FE08 - Queue And Pickup

Màn Member hiển thị:

- vị trí hàng đợi khi có giá trị;
- `Chưa xác định` khi backend trả `null`;
- trạng thái và thời hạn nhận từ `ExpiresAt`;
- CTA mượn bản sao đã giữ chỉ khi reservation thuộc người dùng và là
  `NOTIFIED`.

Màn Librarian gom bản sao, người đầu hàng đợi, tính đủ điều kiện và thao tác
“Giữ sách & thông báo” trong một decision surface. UI không tuyên bố gửi thành
công nếu FE10 trả cảnh báo thất bại sau khi lượt giữ đã commit.

### 6.3 FE10 - Actionable Notification

Tái sử dụng `Notifications`. Không thêm bảng hoặc kênh `IN_APP`.

Các template key mới được đề xuất dưới loại không nhạy cảm
`GENERAL_SYSTEM`:

- `BORROW_REQUEST_APPROVED`;
- `BORROW_REQUEST_REJECTED`;
- `BORROW_RENEWED`;
- `BORROW_RETURNED`.

Các hàng trên được bổ sung vào inbox eligibility và ánh xạ cố định tới
`/borrowing/history`. `RESERVATION_READY` tiếp tục ánh xạ tới
`/reservations/mine`.

Caller không được cung cấp action URL. Backend suy ra action path từ cặp
type/template chuẩn. Nhấn mục thực hiện mark-read best-effort rồi điều hướng;
lỗi mark-read không chặn mở màn nghiệp vụ.

### 6.4 FE12 - Operations Summary

Đề xuất endpoint:

```text
GET /api/reports/operations-summary
Roles: LIBRARIAN, ADMIN
Query: none
```

Response tối thiểu:

```json
{
  "pendingBorrowRequests": 0,
  "activeLoans": 0,
  "overdueLoans": 0,
  "openReservations": 0,
  "availableCopies": 0,
  "lowStockBooks": 0,
  "generatedAt": "server timestamp"
}
```

Định nghĩa:

- `pendingBorrowRequests`: `BorrowRequests.Status = PENDING`;
- `activeLoans`: chi tiết `BORROWED`;
- `overdueLoans`: chi tiết `BORROWED` có `DueDate` trước ngày nghiệp vụ
  `Asia/Ho_Chi_Minh`;
- `openReservations`: reservation `ACTIVE` hoặc `NOTIFIED`;
- `availableCopies`: bản sao khả dụng hiệu lực theo FE06;
- `lowStockBooks`: định nghĩa FE12 hiện hành có 0..2 bản sao khả dụng hiệu lực.

Dashboard desktop hiển thị các KPI và fixed drill-down:

| KPI | Đích |
| --- | --- |
| Yêu cầu chờ duyệt | `/librarian/borrow-requests` |
| Đang mượn / Quá hạn | `/reports/borrowing` |
| Đặt chỗ đang mở | `/librarian/reservations` |
| Bản sao sẵn có / Sắp hết | `/reports/inventory` |

## 7. Hợp Đồng Lỗi

| Điều kiện | Kết quả |
| --- | --- |
| Thiếu xác thực | `401` an toàn |
| Sai role | `403` an toàn |
| Dữ liệu của người khác hoặc bản ghi không được phép tiết lộ | `404` an toàn khi ownership cần được che |
| Trạng thái đã thay đổi trước xác nhận | `409`; UI tải lại trạng thái chuẩn |
| FE10 thất bại sau commit FE07/FE08 | Nghiệp vụ nguồn giữ nguyên; trả cảnh báo không chặn |
| FE10 nhận lại cùng idempotency key | Trả bản ghi hiện có; không tạo hàng/lần gửi trùng |
| Hai nhân viên xử lý cùng hàng đợi/bản sao | Tối đa một transaction thắng; bên còn lại nhận conflict an toàn |
| Không có reservation đủ điều kiện | Không mutation; hiển thị “Chưa có thành viên đủ điều kiện” |
| Một KPI FE12 lỗi | KPI đó hiển thị lỗi/thử lại; không hiển thị số 0 giả |
| Toàn bộ operations summary lỗi | Safe error; không lộ SQL/stack/filter nội bộ |

## 8. Bất Biến

- Một bản sao có nhiều nhất một ownership yêu cầu mượn đang hoạt động.
- Một Member có nhiều nhất một quy trình mượn đang hoạt động trên mỗi
  `BookId`.
- Chỉ chủ sở hữu reservation `NOTIFIED` mới được yêu cầu bản sao `RESERVED`.
- FE07 chỉ hoàn tất đúng reservation liên quan sau khi phê duyệt mượn commit.
- FE08 xử lý FIFO dưới transaction; UI không chọn người chiến thắng.
- FE10 không thay đổi trạng thái FE07/FE08.
- Lỗi FE10 không rollback nghiệp vụ nguồn.
- FE12 không tạo/cập nhật/xóa dữ liệu nguồn.
- Mọi KPI FE12 tái tạo được từ định nghĩa nguồn đã ghi trong SPEC.
- Frontend role guards chỉ là UX; server authorization luôn có thẩm quyền.

## 9. Tiêu Chí Chấp Nhận

| Acceptance ID | Tình huống | Kết quả bắt buộc |
| --- | --- | --- |
| AT-001 | Member tạo yêu cầu hợp lệ | FE07 tạo `PENDING/REQUESTED`, timeline hiện `Chờ duyệt` |
| AT-002 | Librarian duyệt yêu cầu | Bản sao thành `BORROWED`, FE10 tạo đúng một thông báo kết quả |
| AT-003 | Librarian từ chối yêu cầu | UI hiện `Đã từ chối`, FE10 tạo đúng một thông báo từ chối |
| AT-004 | Bản sao được trả và có hàng đợi | FE07 commit trả, không xử lý FE08 tự động, trả handoff có `hasActiveQueue = true` |
| AT-005 | Librarian xử lý hàng đợi | Người hợp lệ đầu tiên thành `NOTIFIED`, bản sao được giữ, FE10 nhận một request |
| AT-006 | Member nhấn thông báo đặt chỗ | Mục được mark read best-effort và mở `/reservations/mine` |
| AT-007 | Owner `NOTIFIED` tạo yêu cầu mượn | FE07 nhận đúng `copyId`; phê duyệt hoàn tất reservation thành `FULFILLED` |
| AT-008 | Hai thao tác queue đồng thời | Chỉ một thao tác commit; không có hai hold/thông báo |
| AT-009 | FE10 lỗi sau commit | FE07/FE08 giữ trạng thái đã commit và UI hiện cảnh báo trung thực |
| AT-010 | Librarian/Admin xem operations summary | KPI khớp nguồn và drill-down đúng route |
| AT-011 | Member/Guest gọi operations summary | Server từ chối; không trả số liệu |
| AT-012 | Desktop browser golden flow | Toàn bộ luồng hoạt động ở 1440x900, không tràn ngang và không lỗi console ngoài lỗi được chủ động kiểm thử |

## 10. Chiến Lược Kiểm Thử

### 10.1 Unit

- mapping timeline và error code FE07;
- mapping trạng thái/vị trí/CTA FE08;
- FE10 inbox eligibility, template allowlist và action path;
- định nghĩa từng KPI FE12 và drill-down map.

### 10.2 Service/Repository Integration

- FE07 trả sách tạo queue handoff từ dữ liệu có thẩm quyền nhưng không mutation
  reservation;
- FE08 transaction FIFO và race hai nhân viên;
- FE10 idempotent replay và failure isolation;
- FE12 operations summary khớp fixture nguồn trước/sau từng transition;
- role/ownership matrix cho Member, Librarian, Admin và Guest.

### 10.3 Cross-Feature

Một fixture liên hoàn phải chứng minh:

```text
FE07 PENDING
-> FE07 BORROWED + FE10 borrow result
-> FE08 ACTIVE
-> FE07 RETURNED + queue handoff
-> FE08 NOTIFIED + FE10 RESERVATION_READY
-> FE07 BORROWED + FE08 FULFILLED
-> FE12 counts reflect committed states
```

### 10.4 Browser

- desktop Chromium 1440x900;
- Member A, Member B và Librarian/Admin;
- timeline, queue position, queue handoff, notification navigation và
  operations summary;
- stale-state refresh và FE10 non-blocking warning;
- không bắt buộc thêm mobile E2E trong lát cắt này.

### 10.5 Regression

- giới hạn 5 bản đang mượn và hạn mức hằng ngày;
- một quy trình cùng đầu sách;
- FIFO và tối đa 3 reservation mở;
- thời hạn giữ 2 ngày;
- due date 14 ngày và business date `Asia/Ho_Chi_Minh`;
- FE10 sensitive exclusions và inbox ownership;
- FE12 báo cáo hiện hành, query allowlist và read-only invariant.

## 11. Lộ Trình Lát Cắt

| Thứ tự | Slice ID | Kết quả | Phụ thuộc | Rủi ro | Gate vào | Bằng chứng ra |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | SL-001 | SPEC fan-out và business IDs được phê duyệt | File thiết kế được review | Mơ hồ/đụng scope hiện hành | Written design approved | SPEC/CONTEXT/CHANGELOG thống nhất |
| 2 | SL-002 | FE10 template/action-path mở rộng | SL-001 | Thông báo lộ dữ liệu hoặc trùng | G3 passed | RED/GREEN FE10 + security |
| 3 | SL-003 | FE07 timeline, blocker copy và queue handoff | SL-001/SL-002 | Stale state hoặc FE07 chiếm ownership FE08 | G3 passed | FE07 focused/integration evidence |
| 4 | SL-004 | FE08 queue decision surface và held-copy CTA | SL-003 | FIFO/race/owner sai | G4/G5 cho SL-003 | FE08 transaction/concurrency evidence |
| 5 | SL-005 | FE12 operations summary và dashboard | SL-001 | KPI sai hoặc lộ dữ liệu | G3 passed | Report parity/permission evidence |
| 6 | SL-006 | Golden-flow browser và release evidence | SL-002..SL-005 | Drift giữa FE và runtime | G6 passed từng slice | Desktop E2E, full gates, human acceptance |

## 12. Ngoài Phạm Vi

- bảng hoặc kênh thông báo mới;
- WebSocket, SSE, mobile push hoặc SMS;
- xử lý hàng đợi hoàn toàn tự động;
- tự động hết hạn/chuyển người tiếp theo ngoài contract FE08 hiện hành;
- scheduler nhắc sắp hết thời hạn giữ mới;
- CSV, PDF hoặc bảng tính;
- dashboard BI thời gian thực;
- quy tắc ưu tiên ngoài FIFO;
- từ chối/phê duyệt từng phần của một borrow request;
- RFID/QR và thanh toán trực tuyến;
- thay đổi schema phá vỡ hoặc thay đổi các giới hạn baseline;
- mở rộng mobile-specific ngoài việc không làm hỏng CSS hiện có.

## 13. Fan-Out Tài Liệu Bắt Buộc

Sau khi file thiết kế được duyệt, trước implementation phải cập nhật và review:

- FE07 `SPEC.md`, `CONTEXT.md`, `CHANGELOG.md`;
- FE08 `SPEC.md`, `CONTEXT.md`, `CHANGELOG.md`;
- FE10 `SPEC.md`, `CONTEXT.md`, `CHANGELOG.md`;
- FE12 `SPEC.md`, `CONTEXT.md`, `CHANGELOG.md`;
- feature integration map và API/OpenAPI contract;
- `PLAN.md`/`TASKS.md` theo một batch H1 mới, sau khi SPEC fan-out được duyệt;
- master test plan, user manual và traceability artifacts trong quá trình giao
  hàng.

Không chỉnh product code trước khi các yêu cầu mới có BR/FR/AC ổn định, actor
boundary được phê duyệt và implementation plan/H1 được duyệt.

## 14. Tự Rà Soát Thiết Kế

- Placeholder scan: không còn mục tạm, ghi chú triển khai sau hoặc yêu cầu chưa định nghĩa.
- Consistency: FE07/FE08/FE10/FE12 giữ ownership hiện hành; FE12 chỉ đọc; FE10
  không rollback nghiệp vụ nguồn.
- Scope: không thêm bảng, kênh hoặc scheduler; luồng đủ nhỏ để chia thành các
  lát cắt tuần tự.
- Ambiguity: KPI, state transition, action path, error behavior và acceptance
  evidence đã có định nghĩa cụ thể.
- Authority: thiết kế trong thảo luận đã được duyệt; file viết và SPEC fan-out
  vẫn cần review riêng trước khi được coi là yêu cầu triển khai.
