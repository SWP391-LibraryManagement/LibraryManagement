# Ràng Buộc Toàn Cục — Hệ Thống Quản Lý Thư Viện

# Phiên bản: 0.1.1

# Trạng thái: ĐÃ PHÊ DUYỆT

# Cập nhật lần cuối: 2026-07-20

> Các quy tắc kỹ thuật cấp cao mà mọi chức năng trong dự án phải tuân theo. Xem [`business.md`](business.md) để biết các quy tắc miền nghiệp vụ và [`safety.md`](safety.md) để biết các quy tắc bảo mật.

## Quy Tắc Kỹ Thuật Cấp Cao

- GLB-001: Phát triển theo hướng đặc tả trước. Không xây dựng chức năng cốt lõi khi chưa có [`.sdd/specs/feat-{name}/SPEC.md`](../specs) được phê duyệt.
- GLB-002: Giữ mã nguồn đơn giản và dễ bảo trì. Chọn thiết kế nhỏ nhất đáp ứng được đặc tả.
- GLB-003: Không mở rộng chức năng ngoài phạm vi. Chỉ triển khai những gì `SPEC.md` và `TASKS.md` hiện hành yêu cầu.
- GLB-004: Mã nguồn phải tuân theo `SPEC.md` đã được phê duyệt. Nếu mã nguồn mâu thuẫn với đặc tả thì mã nguồn là sai, trừ khi đặc tả đã được cập nhật và phê duyệt lại.
- GLB-005: Mọi thay đổi đối với hành vi nghiệp vụ có thể quan sát được phải cập nhật `SPEC.md` liên quan (và `CHANGELOG.md`) trước hoặc đồng thời với thay đổi mã nguồn.
- GLB-006: Công nghệ đã được phê duyệt gồm Node.js + Express.js cho backend, React + Bootstrap cho frontend, SQL Server cho cơ sở dữ liệu và RESTful API cho giao tiếp client-server.

> Các quy tắc công cụ cụ thể như thư viện ghi log, trình định dạng, chính sách dependency và mô hình nhánh vẫn có thể được hoàn thiện sau. Công nghệ chính của ứng dụng hiện đã được cố định.
