# CONTEXT.md - FE12 Báo cáo và thống kê

# Phiên bản: 0.1.0

# Trạng thái: ĐÃ PHÊ DUYỆT - BASELINE 2026-07-17

# Chủ sở hữu: Nhat

# Cập nhật lần cuối: 2026-06-10

# Thư mục tính năng: `.sdd/specs/feat-reporting-statistics/`

---

## 1. Mục đích tính năng

Báo cáo và thống kê giúp thủ thư và quản trị viên hiểu hoạt động thư viện qua các
bản tóm tắt chỉ đọc.

Tính năng này phải tách báo cáo khỏi workflow nguồn:

- FE12 đọc dữ liệu mượn, kho, người dùng, tư cách thành viên và tiền phạt.
- FE12 không duyệt mượn, thay đổi trạng thái bản sao, quản lý người dùng hay
  tính tiền phạt.
- Tính năng nguồn vẫn chịu trách nhiệm về tính đúng đắn của dữ liệu.

FE12 là tính năng Standard Spec vì tổng hợp dữ liệu nghiệp vụ và cần bảo vệ theo
vai trò, nhưng chỉ đọc trong Giai đoạn 1.

---

## 2. Workflow thực tế

Workflow báo cáo điển hình:

1. Thủ thư/quản trị viên mở báo cáo.
2. Tác nhân chọn loại báo cáo: mượn, kho hoặc thống kê người dùng.
3. Tác nhân chọn bộ lọc như khoảng ngày, trạng thái, thể loại hoặc vai trò nếu
   được hỗ trợ.
4. Hệ thống xác thực bộ lọc.
5. Hệ thống đọc dữ liệu nguồn và tính metric tổng hợp.
6. Hệ thống hiển thị báo cáo mà không thay đổi bản ghi nguồn.

---

## 3. Ranh giới tính năng

FE12 bao gồm:

- Xem báo cáo mượn.
- Xem báo cáo kho.
- Xem thống kê người dùng.
- Tổng hợp chỉ đọc và lọc cho loại báo cáo đã phê duyệt.

FE12 không bao gồm:

- Xử lý mượn/trả. Việc đó thuộc FE07.
- Quản lý bản sao kho. Việc đó thuộc FE06.
- Quản lý người dùng/vai trò. Việc đó thuộc FE11.
- Tính toán/thanh toán tiền phạt. Việc đó thuộc FE09.
- Sửa dữ liệu nguồn từ báo cáo.
- Dashboard BI phức tạp hoặc tích hợp phân tích bên ngoài.

---

## 4. Ghi chú mô hình dữ liệu hiện tại

SQL hiện tại gồm các bảng nguồn báo cáo:

- `Users`, `UserRoles`, `Roles`, `UserProfiles`
- `MembershipApplications`
- `Books`, `Categories`, `Authors`, `Publishers`, `BookCopies`
- `BorrowRequests`, `BorrowDetails`
- `Reservations`
- `Fines`

Các vấn đề tiềm năng cần review:

- Một số metric báo cáo cần giá trị trạng thái nhất quán giữa các tính năng.
- Lọc khoảng ngày cần nguồn ngày rõ ràng: ngày yêu cầu, ngày đến hạn, ngày trả,
  ngày thanh toán hoặc ngày tạo.
- SQL hiện tại không lưu mọi timestamp audit/báo cáo cho từng thực thể.
- Query báo cáo phải chỉ đọc và không trở thành logic workflow nghiệp vụ.
- Định dạng xuất chưa được xác định.

Đây không phải blocker khi soạn thảo, nhưng phải giải quyết trước triển khai.

---

## 5. Use case chính từ bảng phân công

Cột chủ sở hữu phản ánh phân công lại đội hiện tại.

| ID Use Case | Tên Use Case | Chủ sở hữu |
| ----------- | ------------ | ---------- |
| UC58 | Xem báo cáo mượn | Nhat |
| UC59 | Xem báo cáo kho | Nhat |
| UC60 | Xem thống kê người dùng | Nhat |

---

## 6. Feature test từ bảng phân công

Cột chủ sở hữu phản ánh phân công lại đội hiện tại.

| ID kiểm thử | Tên kiểm thử | Chủ sở hữu |
| ------- | ------------- | ---------- |
| FT59 | Xem báo cáo mượn | Nhat |
| FT60 | Xem báo cáo kho | Nhat |
| FT61 | Xem thống kê người dùng | Nhat |

---

## 7. Rủi ro chính

- Báo cáo có thể hiển thị số sai nếu định nghĩa trạng thái khác nhau giữa các
  tính năng.
- Query báo cáo tốn kém có thể chậm nếu không có bộ lọc hoặc index.
- Báo cáo có thể lộ dữ liệu người dùng cá nhân cho tác nhân không được ủy quyền.
- Đội có thể nhầm tổng hợp báo cáo với logic nghiệp vụ nguồn và nhân bản phép
  tính.
- Thiếu timestamp có thể làm báo cáo khoảng ngày không đầy đủ.

---

## 8. Phụ thuộc

| Phụ thuộc | Lý do quan trọng |
| ---------- | ---------------- |
| FE06 Quản lý kho / bản sao sách | Cung cấp trạng thái bản sao và số lượng kho. |
| FE07 Quản lý mượn | Cung cấp bản ghi mượn và trả. |
| FE09 Quản lý tiền phạt | Cung cấp dữ liệu tiền phạt/thanh toán nếu được đưa vào báo cáo sau này. |
| FE11 Quản lý người dùng và vai trò | Cung cấp quyền theo vai trò và nguồn thống kê người dùng. |
| FE04 Quản lý tư cách thành viên | Cung cấp số lượng trạng thái tư cách thành viên nếu được đưa vào. |
| Cơ sở dữ liệu SQL Server | Lưu mọi dữ liệu nguồn báo cáo. |

---

## 9. Câu hỏi đã giải quyết cho đội / giảng viên

| ID | Quyết định đã phê duyệt | Nguồn | Trạng thái |
| -- | ----------------------- | ------ | ---------- |
| Q-FE12-001 | Thủ thư và Quản trị có thể xem cả ba báo cáo; Member/Guest không thể xem báo cáo FE12 nào. | Gói review 2026-06-10; chuẩn hóa 2026-07-17 | APPROVED |
| Q-FE12-002 | Metric mượn: lượt mượn hoạt động, lượt mượn quá hạn, số mượn theo kỳ, sách được mượn nhiều nhất. | Gói review 2026-06-10 | APPROVED |
| Q-FE12-003 | Metric kho: tổng sách, tổng bản sao, bản sao theo trạng thái, sách ít/không còn sẵn có. | Gói review 2026-06-10 | APPROVED |
| Q-FE12-004 | Thống kê người dùng: tổng thành viên, người dùng hoạt động/không hoạt động, thành viên mới theo kỳ. | Gói review 2026-06-10 | APPROVED |
| Q-FE12-005 | Mọi xuất báo cáo hoàn toàn ngoài phạm vi Giai đoạn 1. | Gói review 2026-06-10; chuẩn hóa 2026-07-17 | APPROVED |
| Q-FE12-006 | Truy cập báo cáo ghi audit cho lượt xem báo cáo của Quản trị/Thủ thư. | Gói review 2026-06-10 | APPROVED |
| Q-FE12-007 | ID không rõ có định dạng hợp lệ trả báo cáo rỗng, trạng thái nguồn không rõ nhóm thành `UNKNOWN` và hàng chi tiết dùng phân trang/thứ tự xác định. | Chuẩn hóa spec 2026-07-17 | APPROVED |

---

## 10. Ghi chú triển khai sau này

- Không triển khai cho đến khi `SPEC.md` được review và phê duyệt.
- Lát cắt base đã hoàn tất vẫn là bằng chứng lịch sử; phần theo dõi chuẩn hóa
  được lên kế hoạch riêng sau khi bản sửa này được phê duyệt.
- Giữ báo cáo chỉ đọc.
- Xác thực bộ lọc phía máy chủ.
- Tránh lộ chi tiết cá nhân trừ khi cần thiết và được ủy quyền.
- Giữ phép tính báo cáo truy vết được tới trạng thái tính năng nguồn.
