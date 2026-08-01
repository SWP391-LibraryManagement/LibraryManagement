# FE07-FE12 Traceability Status Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đồng bộ trạng thái trong bốn ma trận truy vết với trạng thái phát hành `COMPLETE` và ngăn sai lệch quay lại.

**Architecture:** Mở rộng kiểm tra trạng thái truy vết hiện có để phân tích riêng Phần 16 của bốn `SPEC.md`, sau đó chuẩn hóa duy nhất cột trạng thái của các hàng yêu cầu. Không thay đổi code sản phẩm hoặc hợp đồng nghiệp vụ.

**Tech Stack:** Node.js `node:test`, Markdown SDD, npm scripts hiện có.

## Global Constraints

- Chỉ sửa FE07, FE08, FE10, FE12 và kiểm tra trạng thái truy vết liên quan.
- Giữ nguyên ID, ánh xạ use case, bằng chứng kiểm thử và trạng thái vòng đời nghiệp vụ.
- Không bổ sung dependency.
- Mọi feature có `Implementation State: COMPLETE` trong phạm vi phải có toàn bộ hàng ma trận ở trạng thái `Hoàn thành`.

---

### Task 1: Khóa quy tắc trạng thái ma trận bằng kiểm tra hồi quy

**Files:**
- Modify: `scripts/traceability-state.test.js`
- Test: `scripts/traceability-state.test.js`

**Interfaces:**
- Consumes: Bốn `SPEC.md`, tiêu đề `## 16. Ma trận truy vết`, cột cuối `Trạng thái`.
- Produces: Kiểm tra `node:test` thất bại nếu một hàng yêu cầu trong Phần 16 không kết thúc bằng `Hoàn thành`.

- [x] **Step 1: Viết kiểm tra thất bại**

Thêm helper lấy nội dung từ `## 16. Ma trận truy vết` đến `## 17.` và tách
các hàng Markdown có ô đầu chứa ID `BR-`, `FR-`, `AC-` hoặc `NFR-`. Khẳng
định ô cuối của mỗi hàng bằng `Hoàn thành`.

- [x] **Step 2: Chạy kiểm tra để xác nhận RED**

Run: `npm run test:traceability-state`

Expected: FAIL và nêu đúng feature/hàng còn trạng thái `Sẵn sàng`, `Đã lên kế hoạch` hoặc `Đang chờ`.

- [x] **Step 3: Căn chỉnh kỳ vọng tiêu đề đã Việt hóa**

Đổi biểu thức tiêu đề phát hành sang
`Trạng thái: HOÀN THÀNH; PR #89 ĐÃ HỢP NHẤT; CI VÀ AZURE ĐÃ CHẠY THÀNH CÔNG TRÊN ĐÚNG COMMIT`
để kiểm tra phản ánh văn bản chuẩn hiện tại.

### Task 2: Chuẩn hóa bốn ma trận

**Files:**
- Modify: `.sdd/specs/feat-borrowing-management/SPEC.md`
- Modify: `.sdd/specs/feat-reservation-management/SPEC.md`
- Modify: `.sdd/specs/feat-notification-management/SPEC.md`
- Modify: `.sdd/specs/feat-reporting-statistics/SPEC.md`
- Test: `scripts/traceability-state.test.js`

**Interfaces:**
- Consumes: Các hàng yêu cầu trong Phần 16 và bằng chứng hiện có ở các cột trước.
- Produces: Mọi hàng yêu cầu trong Phần 16 kết thúc bằng `| Hoàn thành |`.

- [x] **Step 1: Sửa tối thiểu cột trạng thái**

Thay duy nhất ô cuối của mỗi hàng yêu cầu trong Phần 16 thành `Hoàn thành`;
không thay nội dung các ô trước.

- [x] **Step 2: Chạy kiểm tra để xác nhận GREEN**

Run: `npm run test:traceability-state`

Expected: PASS toàn bộ kiểm tra.

- [x] **Step 3: Xác minh hồi quy tài liệu và truy vết**

Run: `node --test scripts/fe07-fe12-vietnamese-semantics.test.js`

Expected: PASS 4/4.

Run: `npm run trace:enforce`

Expected: PASS; FE07 44/44, FE08 39/39, FE10 20/20, FE12 15/15.

Run: `git diff --check`

Expected: không có lỗi khoảng trắng.

- [x] **Step 4: Rà soát phạm vi diff**

Run: `git diff --stat` và `git diff -- scripts/traceability-state.test.js .sdd/specs/feat-borrowing-management/SPEC.md .sdd/specs/feat-reservation-management/SPEC.md .sdd/specs/feat-notification-management/SPEC.md .sdd/specs/feat-reporting-statistics/SPEC.md`

Expected: chỉ có test trạng thái và cột cuối của bốn ma trận thay đổi.
