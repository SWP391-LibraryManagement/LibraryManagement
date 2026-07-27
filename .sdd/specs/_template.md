# Mẫu SPEC.md — Hệ Thống Quản Lý Thư Viện

# Phiên bản: 0.1.0

# Trạng thái: BẢN NHÁP

# Chủ sở hữu: TBD

# Cập nhật lần cuối: YYYY-MM-DD

> Sử dụng mẫu này cho mọi chức năng cốt lõi trong `.sdd/specs/feat-{name}/SPEC.md`.
> SPEC.md là nguồn chuẩn của chức năng. Phần triển khai, kiểm thử, hợp đồng API và hành vi giao diện phải tuân theo file này.

---

## 1. Tổng Quan Chức Năng

### 1.1 Tên Chức Năng

[Tên chức năng]

### 1.2 Bối Cảnh Nghiệp Vụ

[Giải thích lý do chức năng này tồn tại trong Hệ thống Quản lý Thư viện. Mô tả vấn đề thực tế mà chức năng giải quyết cho Thủ thư, Quản trị viên, Thành viên hoặc hoạt động thư viện.]

### 1.3 Mục Tiêu / Kết Quả

[Mô tả kết quả mong đợi. Tập trung vào những gì hệ thống phải đạt được, không tập trung vào cách viết mã nguồn.]

### 1.4 Mức Phạm Vi

Chọn một mức:

- [ ] Đặc tả đầy đủ — logic nghiệp vụ cốt lõi, rủi ro cao, phải chính xác ngay từ đầu
- [ ] Đặc tả tiêu chuẩn — chức năng thông thường có quy tắc nghiệp vụ và validation
- [ ] Đặc tả gọn — giao diện đơn giản, tài liệu hoặc chức năng có rủi ro thấp

---

## 2. Tác Nhân Và Quyền

| Tác nhân   | Mô tả   | Quyền / Trách nhiệm              |
| ------- | ------------- | ---------------------------------------- |
| [Tác nhân] | [Mô tả] | [Những gì tác nhân này có thể làm trong chức năng] |

Ví dụ về tác nhân: Quản trị viên, Thủ thư, Thành viên, Khách.

---

## 3. Điều Kiện Tiên Quyết

Chức năng chỉ có thể bắt đầu khi:

- PRE-001: [Điều kiện trước khi có thể thực thi chức năng]
- PRE-002: [Điều kiện trước khi có thể thực thi chức năng]

---

## 4. Luồng Chính

1. [Bước 1]
2. [Bước 2]
3. [Bước 3]
4. [Bước 4]

---

## 5. Luồng Thay Thế

### AF-001: [Tên luồng thay thế]

1. [Bước thay thế 1]
2. [Bước thay thế 2]
3. [Kết quả mong đợi]

---

## 6. Quy Tắc Nghiệp Vụ

Sử dụng ID ổn định để yêu cầu có thể được truy vết tới nhiệm vụ và kiểm thử.

- BR-001: [Quy tắc nghiệp vụ]
- BR-002: [Quy tắc nghiệp vụ]
- BR-003: [Quy tắc nghiệp vụ]

Ví dụ:

- BR-001: Không thể mượn sách khi số lượng có sẵn bằng 0.
- BR-002: Thành viên không được mượn quá hạn mức đã cấu hình.

---

## 7. Yêu Cầu Chức Năng

Sử dụng cách diễn đạt theo EARS khi có thể.

- FR-001: Khi [sự kiện], hệ thống phải [hành vi mong đợi].
- FR-002: Nếu [điều kiện], hệ thống phải [hành vi mong đợi].
- FR-003: Trong khi [trạng thái], hệ thống phải [hành vi mong đợi].

---

## 8. Tiêu Chí Chấp Nhận

Sử dụng định dạng Cho trước / Khi / Thì.

- AC-001: Cho trước [bối cảnh], khi [hành động], thì [kết quả mong đợi].
- AC-002: Cho trước [bối cảnh], khi [hành động], thì [kết quả mong đợi].
- AC-003: Cho trước [bối cảnh], khi [hành động], thì [kết quả mong đợi].

---

## 9. Trường Hợp Biên Và Xử Lý Lỗi

| ID     | Trường hợp biên / Lỗi | Hành vi hệ thống mong đợi |
| ------ | ----------------- | ------------------------ |
| EC-001 | [Trường hợp biên] | [Hành vi mong đợi]       |
| EC-002 | [Trường hợp biên] | [Hành vi mong đợi]       |

---

## 10. Yêu Cầu Dữ Liệu

### 10.1 Các Thực Thể Liên Quan

| Thực thể   | Mục đích trong chức năng |
| -------- | ----------------------- |
| [Thực thể] | [Mục đích]             |

### 10.2 Các Trường Dữ Liệu

| Trường   | Kiểu   | Bắt buộc | Validation / Ghi chú |
| ------- | ------ | -------- | ------------------ |
| [trường] | [kiểu] | Có/Không | [quy tắc]         |

---

## 11. Hợp Đồng API / Giao Diện

> Giữ nguyên là TBD nếu thiết kế API chưa được phê duyệt.

| Phương thức            | Endpoint   | Tác nhân   | Request       | Response       | Ghi chú   |
| --------------------- | ---------- | ------- | ------------- | -------------- | ------- |
| [GET/POST/PUT/DELETE] | [/api/...] | [Tác nhân] | [Request DTO] | [Response DTO] | [Ghi chú] |

---

## 12. Yêu Cầu Phi Chức Năng

### 12.1 Bảo Mật

- NFR-SEC-001: Mọi dữ liệu đầu vào của người dùng phải được kiểm tra hợp lệ.
- NFR-SEC-002: Không được mã hóa cứng thông tin bí mật, mật khẩu, khóa API hoặc token.
- NFR-SEC-003: Hệ thống phải thực thi kiểm soát truy cập dựa trên vai trò đối với các hành động được bảo vệ.

### 12.2 Hiệu Năng

- NFR-PERF-001: [Yêu cầu hiệu năng mong đợi]

### 12.3 Ghi Log Và Kiểm Toán

- NFR-LOG-001: Các hành động nghiệp vụ quan trọng phải được ghi log cùng tác nhân, timestamp và kết quả.

### 12.4 Tính Dễ Sử Dụng

- NFR-UX-001: Thông báo lỗi phải dễ hiểu đối với người dùng dự kiến.

---

## 13. Ngoài Phạm Vi

Chức năng này không bao gồm:

- [Hạng mục ngoài phạm vi 1]
- [Hạng mục ngoài phạm vi 2]

---

## 14. Phụ Thuộc

| Phụ thuộc                    | Loại              | Ghi chú   |
| ---------------------------- | ----------------- | ------- |
| [Chức năng / Mô-đun / Service] | Nội bộ/Bên ngoài | [Ghi chú] |

---

## 15. Câu Hỏi Còn Mở

| ID    | Câu hỏi   | Chủ sở hữu   | Trạng thái |
| ----- | ---------- | ------- | ------ |
| Q-001 | [Câu hỏi] | [Chủ sở hữu] | Mở   |

---

## 16. Ma Trận Truy Vết

| ID yêu cầu | ID nhiệm vụ liên quan | ID ca kiểm thử liên quan | Trạng thái |
| -------------- | --------------- | -------------------- | ----------- |
| BR-001         | T001            | TC001                | Chưa bắt đầu |
| FR-001         | T002            | TC002                | Chưa bắt đầu |
| AC-001         | T003            | TC003                | Chưa bắt đầu |

---

## 17. Checklist Review

Trước khi SPEC.md này được phê duyệt:

- [ ] Bối cảnh nghiệp vụ rõ ràng.
- [ ] Tác nhân và quyền được xác định.
- [ ] Điều kiện tiên quyết có thể kiểm thử.
- [ ] Quy tắc nghiệp vụ có ID ổn định.
- [ ] Tiêu chí chấp nhận được viết theo định dạng Cho trước / Khi / Thì.
- [ ] Các trường hợp biên được liệt kê.
- [ ] Các hạng mục ngoài phạm vi được nêu rõ.
- [ ] Có các yêu cầu về bảo mật và validation.
- [ ] Các câu hỏi còn mở đã được giải quyết hoặc phân công.
- [ ] Ma trận truy vết đã sẵn sàng cho TASKS.md và kiểm thử.
