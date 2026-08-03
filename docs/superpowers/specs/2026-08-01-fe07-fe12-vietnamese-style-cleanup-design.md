# Thiết Kế Chỉnh Văn Phong Tiếng Việt Cho FE07, FE08, FE10 Và FE12

**Ngày:** 2026-08-01
**Trạng thái:** Chờ người dùng duyệt trước khi lập kế hoạch triển khai
**Phạm vi:** Chỉ chỉnh văn phong trong 24 tệp tài liệu của FE07, FE08, FE10 và FE12

## 1. Mục tiêu

Làm cho tài liệu tiếng Việt tự nhiên, nhất quán và dễ trình bày trước hội đồng, đồng thời giữ nguyên hoàn toàn nội dung kỹ thuật đã được phê duyệt và các bằng chứng hoàn thành hiện có.

Đợt chỉnh sửa này không thay đổi hành vi hệ thống, quy tắc nghiệp vụ, quyền, API, cơ sở dữ liệu, mã nguồn hoặc kiểm thử.

## 2. Phạm vi tệp

Mỗi chức năng gồm sáu tệp: `CONTEXT.md`, `SPEC.md`, `PLAN.md`, `TASKS.md`, `TEST_PLAN.md` và `CHANGELOG.md`.

- FE07: `.sdd/specs/feat-borrowing-management/`
- FE08: `.sdd/specs/feat-reservation-management/`
- FE10: `.sdd/specs/feat-notification-management/`
- FE12: `.sdd/specs/feat-reporting-statistics/`

Không chỉnh các tệp ngoài bốn thư mục trên trong lượt triển khai này, ngoại trừ tài liệu thiết kế và kế hoạch triển khai của chính đợt chỉnh văn phong.

## 3. Nguyên tắc bảo toàn bắt buộc

Các thành phần sau phải được giữ nguyên:

- Tất cả mã yêu cầu và mã truy vết như `BR-*`, `FR-*`, `AC-*`, `PRE-*`, `NFR-*`, `MF-*`, `AF-*`, `Q-*`, `UC*` và mã nhiệm vụ.
- Tên điểm cuối, phương thức HTTP, tên trường, bảng, cột, giá trị liệt kê, mã lỗi và đoạn nằm trong dấu backtick.
- Số phiên bản, ngày tháng, số lượng kiểm thử, phần trăm coverage, PR, bản ghi Git, CI, Azure lượt chạy và URL.
- Trạng thái checkbox, trạng thái hoàn thành, ma trận truy vết và quan hệ giữa các yêu cầu.
- Quy tắc nghiệp vụ, quyền tác nhân, điều kiện tiên quyết, luồng chính, luồng thay thế, ngoại lệ và phạm vi ngoài chức năng.
- Cấu trúc bảng, hàng rào mã, đường dẫn tệp và lệnh kiểm tra.

Không được thêm tuyên bố hoàn thành mới hoặc làm mạnh hơn bằng chứng hiện có.

## 4. Quy chuẩn văn phong

### 4.1 Thuật ngữ nghiệp vụ

- Dùng `mượn sách`, không dùng `vay sách`.
- Dùng `hạn trả`, không dùng `ngày đáo hạn` trong ngữ cảnh thư viện.
- Dùng `đặt chỗ` và `lượt đặt chỗ`; chỉ dùng `giữ chỗ` khi mô tả bản sao đang được hệ thống giữ sau thông báo.
- Dùng cùng một cách gọi vai trò trong toàn bộ tài liệu: Thành viên, Thủ thư và Quản trị viên.

### 4.2 Cách thay các bản dịch sát chữ

Việc thay từ phải dựa vào ngữ cảnh, không thay hàng loạt một cách máy móc.

| Cách viết cần hạn chế | Cách viết ưu tiên |
| --- | --- |
| `lát cắt`, `slice` | đợt triển khai, phạm vi triển khai, phần chức năng |
| `chính tắc` | chuẩn, chính thức, thống nhất |
| `có thẩm quyền` | chính thức, do máy chủ quyết định, là nguồn chuẩn |
| `bề mặt` | giao diện, phần hiển thị, API công khai |
| `closeout` | hoàn tất, đóng hồ sơ, hồ sơ hoàn tất |
| `exact-head` | trên đúng bản ghi Git |
| `wave` | đợt |
| `shell` | phần giao diện hoặc khung ứng dụng |
| `core` | phần nghiệp vụ cốt lõi |
| `envelope` | cấu trúc phản hồi |
| `projection` | dữ liệu hiển thị, dạng biểu diễn |
| `mutation` | thao tác thay đổi dữ liệu |
| `harness` | bộ kiểm thử, hệ thống mô phỏng |
| `review` | rà soát, đánh giá |
| `merge` | hợp nhất |
| `rollback` | hoàn tác |
| `provider` | nhà cung cấp |
| `worker` | tiến trình xử lý nền |

Các thuật ngữ phổ biến và có nghĩa chính xác như API, SQL, CI, giao diện, máy chủ, bản ghi Git, token và
dữ liệu gửi có thể được giữ khi dịch sẽ làm câu khó hiểu hơn. Khi dùng trong văn xuôi, câu phải giải
thích đủ để người đọc không chuyên vẫn theo dõi được.

### 4.3 Cấu trúc câu

- Ưu tiên câu ngắn, nêu chủ thể và hành động rõ ràng.
- Tách câu có nhiều hơn hai mệnh đề khi việc tách không làm thay đổi quan hệ logic.
- Tránh xếp liên tiếp nhiều danh từ kỹ thuật bằng dấu gạch chéo.
- Không lặp lại cùng một bằng chứng CI/Azure trong một đoạn nếu việc lặp không cần thiết cho tính truy vết.
- Giữ giọng văn mô tả trung tính; không thêm các cụm quảng bá hoặc nhận xét chủ quan.

## 5. Cách triển khai

1. Chỉnh `SPEC.md` và `CONTEXT.md` trước để khóa thuật ngữ nghiệp vụ của từng chức năng.
2. Chỉnh `PLAN.md`, `TASKS.md` và `TEST_PLAN.md` theo thuật ngữ đã khóa, ưu tiên các đoạn có mật độ từ Anh-Việt cao.
3. Chỉnh phần văn xuôi lịch sử trong `CHANGELOG.md`, không sửa dữ kiện lịch sử.
4. Thêm một ghi chú ngắn vào `CHANGELOG.md` của mỗi chức năng để xác nhận đây là thay đổi văn phong, không phải thay đổi hành vi.
5. Rà soát chéo bốn chức năng để thống nhất các thuật ngữ dùng chung.

## 6. Kiểm tra và tiêu chí hoàn thành

Đợt chỉnh sửa chỉ hoàn thành khi đáp ứng tất cả điều kiện sau:

- Cả 24 tệp nằm trong phạm vi đã được rà soát.
- Không còn các cụm dịch sát chữ đã xác định trong văn xuôi, trừ trường hợp được giữ có chủ ý và giải thích được.
- `mượn`, `đặt chỗ`, `hạn trả` và tên vai trò được dùng nhất quán.
- Tập mã truy vết, giá trị nguyên văn trong backtick, URL, số liệu, hàng rào mã và checkbox không thay đổi so với `origin/main@194dcf63768b87657c1d9c49fb064bbcc5d8e5d8`.
- `git diff --check` đạt.
- `npm run trace:enforce` đạt cho FE07, FE08, FE10 và FE12.
- khác biệt cuối chỉ chứa thay đổi tài liệu trong phạm vi đã duyệt cùng thiết kế/kế hoạch của đợt này.

## 7. Rủi ro và biện pháp kiểm soát

- **Đổi nghĩa quy tắc khi rút gọn câu:** so sánh từng đoạn với bản gốc và kiểm tra lại ID liên quan.
- **Làm sai giá trị nguyên văn kỹ thuật:** kiểm tra tự động tập giá trị nguyên văn trong backtick và các mã truy vết trước/sau.
- **Thay thuật ngữ không đúng ngữ cảnh:** chỉnh theo câu và theo chức năng, không dùng replace toàn cục không kiểm soát.
- **Làm mất bằng chứng lịch sử:** giữ nguyên mọi bản ghi Git, PR, CI, Azure lượt chạy, số liệu và trạng thái.
- **Phạm vi tăng ngoài kiểm soát:** không chỉnh tài liệu của FE khác trong cùng PR.

## 8. Ranh giới phê duyệt

Tài liệu này chỉ phê duyệt thay đổi văn phong. Mọi phát hiện cho thấy cần đổi quy tắc nghiệp vụ,
API, lược đồ, quyền hoặc tuyên bố hoàn thành phải dừng lại và được xử lý trong một đặc tả riêng.
