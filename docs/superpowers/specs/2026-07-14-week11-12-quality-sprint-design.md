# Tuần 11-12 Thiết kế Sprint chất lượng

## Mục tiêu

Hoàn thành các cổng chất lượng cẩm nang tiếp theo sau khi tích hợp hệ thống: phạm vi có thể đo
lường, thu hẹp khoảng cách tập trung, ngưỡng phạm vi được thực thi, một hành trình duyệt web quan
trọng và kiểm tra bảo mật được ghi lại.

## Phạm vi

Chạy nước rút bao gồm các mô-đun hoàn chỉnh phù hợp với sản xuất FE07 Vay, đặt chỗ FE08, Thông báo
FE10 và Báo cáo FE12, cùng với chuyển giao tốt phía máy chủ FE09 được hành trình tích hợp sử dụng.

Chạy nước rút không thêm hành vi kinh doanh mới, thiết kế lại trang, căn chỉnh giao diện người dùng
FE09 cũ, thay đổi lược đồ SQL hoặc giới thiệu các điểm cuối kiểm thử chỉ dành cho sản xuất.

## Cách tiếp cận

### Bảo hiểm

Sử dụng độ bao phủ Jest hiện có trong `backend/package.json` làm bộ mô-đun Tuần 11 chính thức. Tạo
mốc cơ sở, xác định các nhánh/hàm chưa được phát hiện theo tệp, thêm các kiểm thử có thể theo dõi
đặc tả để tìm các khoảng trống có ý nghĩa, sau đó thực thi ít nhất 80 phần trăm cho các câu lệnh,
nhánh, hàm và dòng.

Bằng chứng bảo hiểm được ghi lại riêng biệt với các tạo phẩm `backend/coverage/` được tạo. Đầu ra
HTML/LCOV đã tạo vẫn không bị theo dõi.

### Trình duyệt E2E

Thêm Playwright vào thư mục gốc của kho lưu trữ. Máy chủ Express chỉ dành cho kiểm thử khởi động các
dịch vụ `makeSystemIntegrationApp()` hiện có và kho lưu trữ trong bộ nhớ. Máy chủ hiển thị các điểm
cuối kiểm soát trong `/__e2e__` trước khi cài đặt ứng dụng sản xuất; các điểm cuối này tạo tài khoản
do thời gian chạy tạo, khiến lượt mượn đã chọn quá hạn, đồng bộ hóa FE07 trở về trạng thái đầu vào
FE09 và hiển thị các ID không nhạy cảm cần thiết cho quá trình kiểm tra.

Hành trình của trình duyệt sử dụng giao diện React thực sự cho:

1. Đăng nhập thành viên.
2. Tạo yêu cầu mượn.
3. Đăng nhập và phê duyệt thư viện.
4. Thủ thư xử lý trả sách.
5. FE12 hiển thị báo cáo vay mượn.

Ngữ cảnh API của Playwright thực hiện tính toán FE09 và chuyển đổi thanh toán vì
`FineManagement.jsx` hiện tại vẫn là nguyên mẫu cục bộ. kiểm thử phải nêu rõ ranh giới này và không
được yêu cầu độ bao phủ giao diện người dùng FE09 đầy đủ.

Máy chủ E2E chỉ có thể truy cập được trên localhost trong quá trình kiểm thử. Nó sử dụng mật khẩu
được tạo trong thời gian chạy và email `example.test` tổng hợp. Không có thông tin xác thực được cam
kết.

### Kiểm tra an ninh

Chạy kiểm tra phụ thuộc sản xuất cho root, máy chủ và giao diện; kiểm tra mọi phát hiện Quan
trọng/Cao trước khi thay đổi các phần phụ thuộc. Xem lại các tệp được theo dõi để tìm các mẫu thông
tin xác thực, xác nhận phạm vi bảo hiểm của phần mềm trung gian và trình xác thực tuyến đường được
bảo vệ, đồng thời ghi lại các rủi ro ở mức độ nghiêm trọng thấp hơn được chấp nhận với chủ sở
hữu/hành động.

Các bản sửa lỗi bảo mật được giới hạn ở các trình chặn Quan trọng/Cao đã được xác minh hoặc các bản
cập nhật phụ thuộc tối thiểu để duy trì bộ công nghệ đã được phê duyệt. Không được phép sử dụng chăn
`npm audit fix --force`.

## Bằng chứng

Tạo:

- `.sdd/reviews/week11-coverage-evidence-2026-07-14.md`
- `.sdd/reviews/week12-security-audit-2026-07-14.md`
- `tests/e2e/system-golden-path.spec.js`
- Các tạo phẩm Playwright HTML/report trong các thư mục đầu ra bị bỏ qua.

CI chạy cổng phủ sóng và hành trình Playwright Chrome. Bộ thao tác ghi SQL vẫn chỉ cục bộ vì CI không có
dịch vụ SQL Server dùng một lần.

## Tiêu chí thành công

- Phạm vi bao phủ cho các mô-đun máy chủ đã hoàn thành đã được định cấu hình ít nhất là 80 phần trăm cho các câu lệnh, nhánh, hàm và dòng.
- Ngưỡng bảo hiểm chạy trong CI và chặn hồi quy.
- luồng nghiệp vụ chuẩn Playwright đi qua Chrome và tạo ra các tạo phẩm dấu vết/ảnh chụp màn hình khi bị lỗi.
- Không có lỗ hổng phụ thuộc sản xuất nghiêm trọng/cao nào vẫn chưa được ghi lại.
- Kiểm tra bí mật, RBAC, xác thực và lỗi an toàn được ghi lại bằng các lệnh và phát hiện cụ thể.
- Các cổng máy chủ, giao diện người dùng, tích hợp SQL, kiểm tra mã, bản dựng và truy vết hiện tại vẫn có màu xanh.
