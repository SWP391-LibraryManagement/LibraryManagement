# Ràng Buộc Nghiệp Vụ — Hệ Thống Quản Lý Thư Viện

# Phiên bản: 0.1.1

# Trạng thái: ĐÃ PHÊ DUYỆT - BASELINE GIAI ĐOẠN 1

# Cập nhật lần cuối: 2026-07-20

> Các quy tắc nghiệp vụ cấp cao áp dụng cho toàn dự án mà mọi chức năng phải tuân thủ. Quy tắc chi tiết nằm trong `SPEC.md` của từng chức năng tại [`.sdd/specs/feat-{name}/SPEC.md`](../specs).

## Quy Tắc Nghiệp Vụ Cấp Cao

- BR-G-001: Không thể mượn sách khi số lượng có sẵn bằng 0.
- BR-G-002: Thành viên không được mượn quá 5 bản sao đang mượn tại cùng một thời điểm. Hạn mức mượn mỗi ngày được phân tầng theo trạng thái FE04: thành viên có trạng thái `APPROVED` có hạn mức 5 bản sao mỗi ngày; các tài khoản `MEMBER` đang hoạt động khác có hạn mức 3 bản sao mỗi ngày.
- BR-G-003: Thành viên có sách quá hạn hoặc khoản phạt chưa thanh toán có thể bị hạn chế mượn sách.
- BR-G-004: Mọi giao dịch mượn và trả sách đều phải được ghi nhận.
- BR-G-005: Việc tính tiền phạt phải có khả năng truy vết và kiểm thử.
- BR-G-006: Thời hạn mượn mặc định là 14 ngày theo lịch, tính từ ngày yêu cầu mượn được phê duyệt.
- BR-G-007: Mức phạt quá hạn là 5,000 VND cho mỗi ngày quá hạn trên mỗi bản sao, bắt đầu từ ngày sau hạn trả.
- BR-G-008: Các vai trò người dùng trong Giai đoạn 1 là Khách, Thành viên, Thủ thư và Quản trị viên. Hệ thống/Bộ lập lịch là tác nhân nội bộ, không phải vai trò đăng nhập.
- BR-G-009: Mỗi tài khoản được lưu trữ có đúng một vai trò đăng nhập. `MEMBER`, `LIBRARIAN` và `ADMIN` là các vai trò tài khoản loại trừ lẫn nhau; việc đổi vai trò sẽ thay thế vai trò hiện tại theo cách nguyên tử.

> Các quyết định baseline của Giai đoạn 1 này bắt nguồn từ `.sdd/shared_context.md`. Nếu giảng viên hoặc trưởng nhóm thay đổi các quyết định đó, phải cập nhật đồng thời shared context, file này và mọi đặc tả chức năng bị ảnh hưởng.
