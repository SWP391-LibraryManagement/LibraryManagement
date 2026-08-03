# Thiết kế kết thúc quản trị cuối cùng

Ngày: 2026-07-20

Quyết định: Hybrid SDD + ADD, Độ sâu tiêu chuẩn.

## Mục tiêu

Làm cho gói phát hành FE01-FE12 hiện tại nhất quán và có thể xem lại mà không cần thêm phạm vi kinh
doanh mới: khôi phục bề mặt bộ lọc nhật ký kiểm tra FE11 đã được phê duyệt, điều chỉnh siêu dữ liệu
hoàn thành hiện tại, thiết lập một tham chiếu phát hành chuẩn và loại bỏ các tạo phẩm công cụ cục bộ
ra khỏi cây sản phẩm.

## Bằng chứng và Mô tả vấn đề

- `origin/main` và thẻ `v1.0.1` chứa cây phát hành hiện tại.
- `frontend/src/page/UserManagement.jsx` vẫn xây dựng `action` và `actorId`
  tham số truy vấn nhưng không còn hiển thị các điều khiển tương ứng.
- FE11 Các yêu cầu của SPEC mô tả chế độ xem kiểm tra có thể tìm kiếm/có thể lọc, trong khi
bảng truy vết hiện tại vẫn chứa các hàng `Not Started` cho cùng các ID yêu cầu đã hoàn thành.
- Các tài liệu phát hành vẫn xác định `v1.0.0-final-release` là chuẩn ngay cả
  mặc dù `v1.0.1` là bản phát hành nguồn được xuất bản mới nhất.
- `.worktrees/` và `.superpowers/` là các thư mục công cụ cục bộ và không phải
  hiện bị bỏ qua.

## Thiết kế thay thế

### A. Khôi phục bề mặt bộ lọc đã được phê duyệt (đã chọn)

Kết xuất lại các điều khiển `action` và `actorId` hiện có, duy trì hợp đồng máy chủ hiện tại, thêm
phạm vi hồi quy giao diện người dùng tập trung và điều chỉnh nhật ký thay đổi FE11. Đây là thay đổi
hành vi nhỏ nhất giúp khôi phục tính chẵn lẻ với hợp đồng API/UI đã được phê duyệt.

### B. Giữ giao diện người dùng đơn giản và thay đổi hợp đồng

Xóa `action` và `actorId` khỏi hợp đồng giao diện người dùng và sửa đổi FE11 SPEC, ghi chú, kiểm tra
và bằng chứng chấp nhận hỗ trợ OpenAPI. Điều này thay đổi bề mặt có thể tìm kiếm/có thể lọc đã được
phê duyệt và yêu cầu quyết định yêu cầu mới được con người phê duyệt.

### C. Khóa tài liệu chỉ

Giữ nguyên giao diện người dùng và chỉ cập nhật các tài liệu phát hành/trạng thái. Đây là cách nhanh
nhất nhưng để lại sự không khớp giữa hợp đồng với giao diện người dùng và không loại bỏ được rủi ro
hồi quy đã xác định.

Tùy chọn A được chọn vì backend/API đã hỗ trợ cả hai bộ lọc, trạng thái giao diện người dùng và
trình tạo truy vấn đã bảo toàn chúng và không cần thay đổi lược đồ hoặc API.

## Phạm vi

### Hành vi liền kề lõi

- Khôi phục các điều khiển Nhật ký kiểm tra quản trị viên hiển thị cho `action` và `actorId` dạng số.
- Duy trì xác thực phía máy chủ, biên tập, phân trang và quyền truy cập chỉ dành cho quản trị viên.
- Thêm các kiểm thử chứng minh sự tồn tại của các biện pháp kiểm soát và cung cấp cho trình tạo truy vấn chuẩn.

### Vỏ tài liệu và quản trị

- Thêm chú giải trạng thái hiện tại hoặc đối chiếu các hàng `FR-*`/`AC-*` hiện tại
cũ trong các gói chức năng đã hoàn thiện mà không cần viết lại các mục nhật ký thay đổi lịch sử.
- Ghi lại sự đối chiếu giao diện người dùng FE11 trong `CHANGELOG.md`, `PLAN.md` và
  Phần bằng chứng `TASKS.md`.
- Cập nhật tài liệu phát hành để sử dụng thẻ chuẩn bất biến tiếp theo, `v1.0.2`,
  sau khi khóa này được hợp nhất và xác nhận.
- Chỉ thăng cấp các tiêu đề trạng thái quản trị dự án từ `DRAFT` lên `APPROVED`
trong đó nội dung quy chuẩn hiện tại không thay đổi và người đánh giá chấp nhận rõ ràng việc chuyển
đổi trạng thái.
- Bỏ qua `.worktrees/` và `.superpowers/`; không xóa hoặc viết lại bất kỳ
  các tài liệu do người dùng tạo không bị theo dõi.

## Các tập tin có thể thay đổi

- `frontend/src/page/UserManagement.jsx`
- `frontend/test/userManagementFrontend.test.js`
- `.sdd/specs/feat-user-role-management/SPEC.md`
- `.sdd/specs/feat-user-role-management/PLAN.md`
- `.sdd/specs/feat-user-role-management/TASKS.md`
- `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- `scripts/check-traceability.js` và các kiểm thử của nó, nếu bộ bảo vệ trạng thái cũ
  cần thiết sau khi kiểm tra trình phân tích cú pháp hiện có
- `README.md`, `plan.md`, `docs/release/phase3-final-report.md`,
`docs/release/final-submission-checklist-2026-07-20.md`, `document/FinalRelease.md` và bằng chứng
phát hành liên quan
- `.sdd/constitution.md`, `.agents/AGENTS.md` và
  `.sdd/constraints/*.md` chỉ dành cho những thay đổi tiêu đề trạng thái được phê duyệt rõ ràng
- `.gitignore`
- `docs/superpowers/plans/2026-07-20-final-governance-closeout.md`

## Không có mục tiêu

- Không có điểm cuối API mới, di chuyển cơ sở dữ liệu, quyền vai trò, quy tắc nghiệp vụ hoặc
  hành vi thông báo
- Không xóa `.worktrees/`, `.superpowers/` hoặc không bị theo dõi do người dùng tạo
  tài liệu.
- Không hợp nhất, đẩy, tạo thẻ hoặc thao tác ghi cấu hình môi trường tiền sản xuất ở cục bộ
  thẻ thực hiện; những yêu cầu cổng tích hợp H2/H3 của kho lưu trữ.

## Hợp đồng xác nhận

1. RED: kiểm thử giao diện người dùng tập trung không thành công khi không có điều khiển hành động/tác nhân.
2. GREEN: các điều khiển được khôi phục và kiểm thử tập trung đã vượt qua.
3. L1: truy vết, phạm vi máy chủ, tích hợp hệ thống, giao diện người dùng tests/lint/
xây dựng, E2E, kiểm tra triển khai, phân tích cú pháp OpenAPI, kiểm tra phần phụ thuộc và vượt qua
vệ sinh khác biệt.
4. L2: mọi yêu cầu FE11 đã thay đổi đều ánh xạ tới SPEC, TASKS, mã và các kiểm thử;
   trạng thái hoàn thành hiện tại có thể phân biệt được với ảnh chụp nhanh lịch sử.
5. L3: bộ công nghệ, ủy quyền, xác thực, biên tập, bí mật và phụ thuộc
   các ràng buộc vẫn không thay đổi.
6. L4: chấp nhận trình duyệt Nhật ký kiểm tra quản trị viên hiện có và toàn bộ hệ thống vàng
   đường đi qua; phát hành bằng chứng đặt tên chính xác cho thẻ sau hợp nhất.

## Ranh giới phê duyệt

Thiết kế này đã sẵn sàng để con người xem xét. Quá trình triển khai chỉ bắt đầu sau khi người đánh
giá xác nhận Tùy chọn A và chính sách tiêu đề trạng thái/thẻ phát hành.
