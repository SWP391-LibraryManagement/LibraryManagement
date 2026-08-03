# FE07-Kế hoạch thực hiện đối chiếu trạng thái truy vết FE12

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Goal:** Đồng bộ trạng thái trong bốn ma trận truy vết với trạng thái phát hành `COMPLETE` và ngăn sai lệch quay lại.

**kiến trúc:** Mở rộng kiểm tra trạng thái truy vết hiện có để phân tích riêng Phần 16 của bốn
`SPEC.md`, sau đó chuẩn hóa duy nhất cột trạng thái của các hàng yêu cầu. Không thay đổi mã nguồn
sản phẩm hoặc hợp đồng nghiệp vụ.

**Tech bộ công nghệ:** Node.js `node:test`, Markdown SDD, npm scripts hiện có.

## Ràng buộc toàn cầu

- Chỉ sửa FE07, FE08, FE10, FE12 và kiểm tra trạng thái truy vết liên quan.
- Giữ nguyên ID, ánh xạ sử dụng case, bằng chứng kiểm thử và trạng thái vòng đời nghiệp vụ.
- Không bổ sung phụ thuộc.
- Mọi chức năng có `Implementation State: COMPLETE` trong phạm vi phải có toàn bộ hàng ma trận ở trạng thái `Hoàn thành`.

---

### Nhiệm vụ 1: Khóa quy tắc trạng thái ma trận bằng kiểm tra hồi quy

**Tệp:**
- Sửa đổi: `scripts/traceability-state.test.js`
- Kiểm tra: `scripts/traceability-state.test.js`

**Giao diện:**
- đầu vào: Bốn `SPEC.md`, tiêu đề `## 16. Ma trận truy vết`, cột cuối `Trạng thái`.
- đầu ra: Kiểm tra `node:test` thất bại nếu một hàng yêu cầu trong Phần 16 không kết thúc bằng `Hoàn thành`.

- [x] **Bước 1: Viết kiểm tra thất bại**

Thêm helper lấy nội dung từ `## 16. Ma trận truy vết` đến `## 17.` và tách
các hàng Markdown có ô đầu chứa ID `BR-`, `FR-`, `AC-` hoặc `NFR-`. Khẳng
định ô cuối của mỗi hàng bằng `Hoàn thành`.

- [x] **Bước 2: Chạy kiểm tra để xác nhận RED**

Chạy: `npm run test:traceability-state`

mong đợi: không đạt và nêu đúng chức năng/hàng còn trạng thái `Sẵn sàng`, `Đã lên kế hoạch` hoặc `Đang chờ`.

- [x] **Bước 3: Căn chỉnh kỳ vọng tiêu đề đã Việt hóa**

Đổi biểu thức tiêu đề phát hành sang
`Trạng thái: HOÀN THÀNH; PR #89 ĐÃ HỢP NHẤT; CI VÀ AZURE ĐÃ CHẠY THÀNH CÔNG TRÊN ĐÚNG COMMIT`
để kiểm tra phản ánh văn bản chuẩn hiện tại.

### Nhiệm vụ 2: Chuẩn hóa bốn ma trận

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-borrowing-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/SPEC.md`
- Kiểm tra: `scripts/traceability-state.test.js`

**Giao diện:**
- đầu vào: Các hàng yêu cầu trong Phần 16 và bằng chứng hiện có ở các cột trước.
- đầu ra: Mọi hàng yêu cầu trong Phần 16 kết thúc bằng `| Hoàn thành |`.

- [x] **Bước 1: Sửa tối thiểu cột trạng thái**

Thay duy nhất ô cuối của mỗi hàng yêu cầu trong Phần 16 thành `Hoàn thành`;
không thay nội dung các ô trước.

- [x] **Bước 2: Chạy kiểm tra để xác nhận GREEN**

Chạy: `npm run test:traceability-state`

mong đợi: đạt toàn bộ kiểm tra.

- [x] **Bước 3: Xác minh hồi quy tài liệu và truy vết**

Chạy: `node --test scripts/fe07-fe12-vietnamese-semantics.test.js`

Dự kiến: ĐẠT 4/4.

Chạy: `npm run trace:enforce`

Dự kiến: ĐẠT; FE07 44/44, FE08 39/39, FE10 20/20, FE12 15/15.

Chạy: `git diff --check`

mong đợi: không có lỗi khoảng trắng.

- [x] **Bước 4: Rà soát phạm vi khác biệt**

lượt chạy: `git diff --stat` và `git khác biệt -- scripts/traceability-state.test.js
.sdd/specs/feat-borrowing-management/SPEC.md .sdd/specs/feat-reservation-management/SPEC.md
.sdd/specs/feat-notification-management/SPEC.md .sdd/specs/feat-reporting-statistics/SPEC.md`

mong đợi: chỉ có kiểm thử trạng thái và cột cuối của bốn ma trận thay đổi.
