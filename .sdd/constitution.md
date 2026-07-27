# Hiến Chương — Hệ Thống Quản Lý Thư Viện

# Phiên bản: 0.1.2

# Trạng thái: ĐÃ PHÊ DUYỆT

# Cập nhật lần cuối: 2026-07-20

## 1. Mục Đích Dự Án

Đây là dự án Hệ thống Quản lý Thư viện dành cho SWP391.
Hệ thống giúp Thủ thư và Quản trị viên quản lý sách, thành viên, việc mượn sách, trả sách, các khoản phạt quá hạn và báo cáo.

## 1.1 Công Nghệ Đã Được Phê Duyệt

- Backend: Node.js với Express.js.
- Frontend: React với Bootstrap.
- Cơ sở dữ liệu: SQL Server.
- Kiểu API: RESTful API.

## 2. Phương Pháp Phát Triển

Nhóm áp dụng phương pháp Phát triển Kết hợp Hướng Đặc tả và Hướng Tác nhân.

- Phát triển Hướng Đặc tả được sử dụng cho các yêu cầu cốt lõi, quy tắc nghiệp vụ, thiết kế cơ sở dữ liệu, hợp đồng API và các chức năng nhạy cảm về bảo mật.
- Phát triển Hướng Tác nhân được sử dụng để hỗ trợ triển khai, kiểm thử, viết tài liệu và tái cấu trúc.
- Không được triển khai chức năng cốt lõi khi chưa có SPEC.md được phê duyệt.

## 3. Nguồn Chuẩn

Nguồn chuẩn của mỗi chức năng là:

.sdd/specs/feat-{name}/SPEC.md

Việc triển khai phải tuân theo:

1. SPEC.md
2. PLAN.md
3. TASKS.md
4. `.agents/AGENTS.md`
5. `.agents/CLAUDE.md`

Nếu mã nguồn mâu thuẫn với SPEC.md thì mã nguồn được xem là sai, trừ khi đặc tả đã được cập nhật và phê duyệt.

## 4. Quy Tắc Nghiệp Vụ Cốt Lõi

- Không thể mượn sách khi số lượng có sẵn bằng 0.
- Thành viên không được mượn vượt quá hạn mức cho phép.
- Thành viên có sách quá hạn hoặc khoản phạt chưa thanh toán có thể bị hạn chế mượn sách.
- Mọi giao dịch mượn và trả sách đều phải được ghi nhận.
- Việc tính tiền phạt phải có khả năng truy vết và kiểm thử.
- Các hành động của Quản trị viên phải được ghi nhật ký khi ảnh hưởng đến sách, thành viên, việc mượn sách, trả sách hoặc khoản phạt.

## 5. Quy Tắc Đặc Tả

Mỗi chức năng cốt lõi phải có:

- SPEC.md
- CONTEXT.md
- PLAN.md
- TASKS.md
- CHANGELOG.md

SPEC.md phải bao gồm:

- Bối cảnh nghiệp vụ
- Tác nhân
- Điều kiện tiên quyết
- Luồng chính
- Quy tắc nghiệp vụ
- Tiêu chí chấp nhận
- Trường hợp biên
- Ngoài phạm vi
- Yêu cầu phi chức năng
- Khả năng truy vết

## 6. Quy Tắc Mã Nguồn

- Mã nguồn phải đơn giản, dễ đọc và dễ bảo trì.
- Không bổ sung chức năng ngoài SPEC.md hiện hành.
- Mọi dữ liệu đầu vào của người dùng phải được kiểm tra hợp lệ.
- Các thao tác cơ sở dữ liệu phải sử dụng ORM hoặc truy vấn có tham số.
- Không được mã hóa cứng mật khẩu, khóa API, token hoặc thông tin bí mật.
- Không được che giấu logic nghiệp vụ trong mã giao diện người dùng.

## 7. Quy Tắc Kiểm Thử

- Các quy tắc nghiệp vụ cốt lõi phải có kiểm thử.
- Chức năng mượn sách, trả sách và tính tiền phạt phải có ca kiểm thử.
- Các kiểm thử hiện có phải đạt trước khi merge.
- Mã do AI tạo ra phải được con người review trước khi commit hoặc merge.

## 8. Quy Tắc Git

Quy tắc đặt tên nhánh:

- docs/{name}
- feat/{feature-name}
- fix/{bug-name}
- refactor/{module-name}

Quy ước commit:

- docs:
- feat:
- fix:
- refactor:
- test:
- chore:


## 8.1 Các Gate Cho Nhánh Và Review

- Công việc phải được thực hiện trên nhánh feature, fix, docs, refactor, test hoặc chore.
- Pull request phải nêu rõ SPEC.md, PLAN.md và mục TASKS.md liên quan khi thay đổi hành vi của chức năng cốt lõi.
- Không merge công việc của chức năng cốt lõi khi thiếu PLAN.md hoặc TASKS.md, hoặc khi các tài liệu này được đánh dấu NOT STARTED.
- Các thay đổi do AI tạo ra có thể phải qua bước review đầu ra cục bộ của con người trước khi được commit hoặc công bố dưới dạng pull request.
- Mọi pull request phải vượt qua các kiểm tra tự động hiện có trước bước review tích hợp cuối cùng của con người và phê duyệt merge.
- Review đầu ra cục bộ không bao giờ cấp quyền merge; phê duyệt merge vẫn là một quyết định tích hợp riêng biệt sau khi kiểm tra.

## 8.2 Tích Hợp Liên Tục

Repository phải duy trì quy trình CI cơ bản để kiểm tra cài đặt, lint/build khi có và tình trạng khởi động của backend.

CI là gate nền tảng trong lộ trình Hybrid. CI thất bại sẽ chặn merge cho đến khi được khắc phục hoặc được trưởng nhóm chấp nhận rõ ràng kèm lý do được ghi lại.

## 9. Quy Tắc Sử Dụng AI

AI/tác nhân có thể hỗ trợ:

- Soạn thảo đặc tả
- Review đặc tả
- Phân rã đặc tả thành các nhiệm vụ
- Tạo mã nguồn từ các nhiệm vụ đã được phê duyệt
- Viết kiểm thử
- Tái cấu trúc
- Viết tài liệu

AI/tác nhân không được:

- Triển khai chức năng khi không có SPEC.md
- Bổ sung chức năng ngoài phạm vi
- Sửa logic nhạy cảm về bảo mật khi chưa được con người review
- Tạo hoặc làm lộ thông tin bí mật
- Thay đổi schema cơ sở dữ liệu mà không cập nhật đặc tả/ADR liên quan

## 10. Định Nghĩa Hoàn Thành

Một chức năng chỉ hoàn thành khi:

- SPEC.md đã được phê duyệt.
- PLAN.md và TASKS.md đã hoàn thành.
- Mã nguồn đáp ứng mọi tiêu chí chấp nhận.
- Các kiểm thử bắt buộc đều đạt.
- Không có thông tin bí mật nào được commit.
- Tài liệu đã được cập nhật.
- Review của con người đã hoàn thành.
