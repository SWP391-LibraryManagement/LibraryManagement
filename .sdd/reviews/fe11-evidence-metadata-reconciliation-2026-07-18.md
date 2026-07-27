# Ma trận đối soát siêu dữ liệu bằng chứng FE11

Trạng thái: ĐƯỢC CON NGƯỜI PHÊ DUYỆT - 2026-07-18

Ngày: 2026-07-18

Phạm vi: `TD-027`; chỉ các ô bằng chứng/ca kiểm thử và trạng thái hiện có

## Quy tắc

- Không thay đổi cách diễn đạt yêu cầu, ID, tác nhân, luồng, quy tắc nghiệp vụ, hành vi API, tiêu chí chấp thuận hoặc cấu trúc bảng.
- Chỉ thay đổi các ô `Test Case` và `Status` hiện có được hỗ trợ bởi bản ghi B7 đã hợp nhất.
- Dùng `COMPLETE (B7)` cho hàng hiện có được đáp ứng đầy đủ.
- Dùng `PARTIAL` khi một FR hành vi không mong muốn trải rộng trên các thao tác đã hoàn thành và bị hoãn.
- Các hàng FR mong muốn không có ô trạng thái riêng được biểu diễn qua hàng AC đã ánh xạ; không thêm cấu trúc trạng thái mới.
- Giữ nguyên các hàng cập nhật/vô hiệu hóa, trường Thủ thư, Bảng điều khiển Quản trị viên, Kiểm toán, Quản lý yêu cầu và đồng thời lạc quan chưa triển khai.
- Chuẩn bị ma trận này song song, nhưng chỉ áp dụng chỉnh sửa `SPEC.md` thực tế trong cửa sổ ghi tuần tự của Trưởng tích hợp sau khi TD-026 hợp nhất.

## Các hàng tiêu chí chấp thuận cần đánh dấu hoàn thành

| Hàng AC | Ô `Test Case` thay thế | Ô `Status` thay thế | Bằng chứng |
| --- | --- | --- | --- |
| `AC-FE11-001`, `AC-FE11-002` | `FE11-U01..U06; fe11-safe-user-list-detail-validation-2026-07-18.md` | `COMPLETE (B7)` | PR #27, hợp nhất `ed6bd717`, CI `29639933730` |
| `AC-FE11-003`, `006`, `010`, `020..022` | `FE11-S01..S07; auth-account-setup-boundary-validation-review-2026-07-15.md` | `COMPLETE (B7)` | hợp nhất `c7f7821`, main `e8f467c`, CI `29392143926` |
| `AC-FE11-013..015` | `FE11-R01..R05; FE11-UIR01..UIR05; bounded validation records` | `COMPLETE (B7)` | PR #25 / CI `29631406399`; PR #30 / CI `29644292781` |

Các hàng AC này biểu diễn trạng thái cho `FR-FE11-001..003`, `006`, `009`, `012..014` và `036..038` mong muốn, vốn không có ô trạng thái FR mong muốn độc lập.

## Các hàng FR hành vi không mong muốn cần đánh dấu hoàn thành

| Hàng FR | Ô `Test Case` thay thế | Ô `Status` thay thế | Bằng chứng |
| --- | --- | --- | --- |
| `FR-FE11-015` | `FE11-U01..U06 and FE11-R01..R05 Admin-first route authorization` | `COMPLETE (B7)` | Bản ghi xác thực đọc an toàn và vai trò có giao dịch |
| `FR-FE11-022` | `FE11-S01..S07 account-creation rollback coverage` | `COMPLETE (B7)` | Xác thực thiết lập tài khoản và bằng chứng tích hợp B7 |
| `FR-FE11-024..027` | `FE11-R01..R05 deterministic role outcome coverage` | `COMPLETE (B7)` | Xác thực vai trò có giao dịch; PR #25 / CI `29631406399` |
| `FR-FE11-029` | `FE11-S01..S07 invalid, expired, used, revoked, and ineligible setup-token coverage` | `COMPLETE (B7)` | Xác thực thiết lập tài khoản và kiểm thử tuyến xác thực |
| `FR-FE11-037`, `FR-FE11-038` | `FE11-S01..S07 safe delivery failure and resend eligibility/cooldown coverage` | `COMPLETE (B7)` | Xác thực thiết lập tài khoản; hợp nhất `c7f7821`; CI `29392143926` |

## Các hàng FR hành vi không mong muốn cần đánh dấu một phần

| Hàng FR | Ô `Test Case` thay thế | Ô `Status` thay thế | Lý do |
| --- | --- | --- | --- |
| `FR-FE11-016` | `FE11-U01..U06 detail 404 plus FE11-R01..R05 role-target outcomes; update/deactivation pending` | `PARTIAL` | Chi tiết và đích vai trò đã được bao phủ; cập nhật/vô hiệu hóa và các thao tác đích khác vẫn bị hoãn |
| `FR-FE11-017` | `FE11-R01..R05 acting-admin revalidation; other acting-admin actions pending` | `PARTIAL` | Thay đổi vai trò xác thực lại Quản trị viên đang thao tác; các thao tác FE11 khác chưa đáp ứng đầy đủ hàng |

## Các hàng phải giữ trạng thái chưa bắt đầu

- Hàng AC: `AC-FE11-004`, `005`, `007..009`, `011`, `012`, `016..019`, `023`.
- Hàng FR không mong muốn: `FR-FE11-018..021`, `023`, `028`, `030..035`.
- Mọi ánh xạ cập nhật/vô hiệu hóa, trường Thủ thư, Bảng điều khiển Quản trị viên, Nhật ký kiểm toán, Quản lý yêu cầu hoặc đồng thời lạc quan không được liệt kê là hoàn thành hay một phần ở trên.

## Sửa siêu dữ liệu đi kèm

Cùng PR TD-027 chỉ chứa bằng chứng có thể sửa các mô tả trạng thái cũ này mà không thay đổi yêu cầu:

- `PLAN.md` và `TASKS.md`: trạng thái UI Vai trò Quản trị viên trở thành `COMPLETE (B7)` trong khi toàn bộ FE11 vẫn là `Implementation State: DEFERRED`.
- `TEST_PLAN.md`: xóa các tuyên bố rằng đánh giá của con người/hợp nhất/CI cho UI Vai trò Quản trị viên đang chờ; ghi nhận PR #30 và CI sau hợp nhất `29644292781`.
- `auth-account-setup-boundary-validation-review-2026-07-15.md`: ghi nhận hợp nhất `c7f7821` chứa commit main `e8f467c` và CI `29392143926` thành công trước khi các hàng thiết lập tài khoản trở thành `COMPLETE (B7)`.
- Không viết lại điểm kiểm tra đang chờ trong lịch sử ở `CHANGELOG.md`; mục đầu mới hơn đã ghi nhận việc hoàn thành.

## Khuyến nghị H1

Phê duyệt ma trận này làm nguồn có thẩm quyền duy nhất cho diff TD-027 chỉ chứa bằng chứng về sau. Mọi cách diễn đạt yêu cầu, hành vi API, cấu trúc bảng truy vết mới hoặc thay đổi trạng thái ngoài các hàng trên đều nằm ngoài phạm vi và cần đánh giá đặc tả riêng.
