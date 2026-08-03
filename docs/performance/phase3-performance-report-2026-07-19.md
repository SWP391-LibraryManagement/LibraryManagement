# Báo cáo Hiệu suất Giai đoạn 3 - 2026-07-19

## Quyết định

Quá trình hoàn thiện Giai đoạn 3 giữ lại các hợp đồng tuyến/API hiện có và tải từng phần các mô-đun
trang React cấp cao nhất. Gói mục nhập JavaScript ban đầu hiện thấp hơn kích thước tư vấn Vite trước
đó; bộ bảo vệ tuyến vẫn còn trong mô-đun nhập nên hành vi ủy quyền không di chuyển vào các phần
trang.

## Đo lường xây dựng giao diện người dùng

Cả hai phép đo đều là các byte JavaScript được rút gọn thô từ `npm.cmd --prefix frontend run build`
trong cây làm việc Giai đoạn 3 bị cô lập.

| Số liệu | mốc cơ sở `origin/main` | nhánh giai đoạn 3 | Thay đổi |
| --- | ---: | ---: | ---: |
| Mục nhập ban đầu JS | 999.203 byte | 320.688 byte | -67,9% |
| Số lượng tài sản JavaScript | 1 | 57 | Đã thêm các đoạn cấp tuyến đường |
| Tổng JS trên tất cả nội dung | 999.203 byte | 1.018.070 byte | +1,9% |

Tổng số lớn hơn một chút vì mỗi đoạn tuyến đường mang chi phí ranh giới mô-đun riêng, nhưng trang
đầu tiên không còn tải xuống mọi màn hình hoạt động nữa. Tài sản lớn nhất và đầu vào sau khi thay
đổi là `index-Dt3UORuG.js`.

## Đo thời gian API

Lệnh:

```powershell
npm.cmd run phase3:performance
```

Môi trường: kho lưu trữ E2E trong bộ nhớ xác định cục bộ, Node.js tích hợp `fetch` và bcrypt có giá
`10` (mức tối thiểu được phê duyệt). Lệnh tạo danh tính member/librarian tổng hợp, làm nóng điểm
cuối, sau đó ghi lại 30 thông tin đăng nhập và 50 mẫu `/api/auth/me`. Mã thông báo và danh tính
không bao giờ được in.

| Hoạt động | Mẫu | p50 | mục tiêu p95 | Quan sát p95 | Kết quả |
| --- | ---: | ---: | ---: | ---: | --- |
| Đăng nhập hợp lệ | 30 | 60,31 mili giây | < 1.000 mili giây | 66,95 mili giây | đạt trong môi trường địa phương được ghi lại |
| Xác thực phiên (`/auth/me`) | 50 | 1,03 mili giây | < 50 mili giây | 1,45 mili giây | đạt trong môi trường địa phương được ghi lại |

Đầu ra được tạo bởi `scripts/phase3-performance.js` và được bao phủ bởi
`tests/performance/phase3-performance.test.js`. Nó báo cáo các giá trị p50/p95 xếp hạng gần nhất, số
lượng mẫu, byte gói và các giới hạn.

### FE02 hòa giải lại - 2026-07-27

Lệnh và môi trường không thay đổi đã được chạy lại cho FE02-T048. Thông tin đăng nhập hợp lệ được
ghi lại p50 `57.59 ms`, p95 `61.46 ms` trên 30 mẫu; `/api/auth/me` đã ghi lại p50 `1.20 ms`, p95
`1.52 ms` trên 50 mẫu. Cả hai mục tiêu FE02 đều vượt qua và các kiểm thử khai thác đều vượt qua
3/3.. Các ranh giới bên dưới vẫn được áp dụng.

## Xác thực

- `node --test tests/performance/phase3-performance.test.js`: 3/3 đã vượt qua.
- `npm.cmd --prefix frontend test`: 151/151 đã vượt qua.
- `npm.cmd --prefix frontend run lint`: đã qua.
- `npm.cmd --prefix frontend run build`: đã vượt qua mà không có cảnh báo đoạn đầu vào.
- `npm.cmd run test:e2e`: luồng nghiệp vụ chuẩn tổng hợp hiện có vẫn là giao diện người dùng L4
  kiểm tra hồi quy và được ghi lại trong bản ghi kiểm tra người dùng Giai đoạn 3.

## ranh giới

- Khai thác thời gian sử dụng kho lưu trữ trong bộ nhớ và do đó loại trừ Azure
  Độ trễ kết nối SQL, gói truy vấn SQL và độ trễ mạng công cộng.
- Mẫu đăng nhập sử dụng bcrypt giá 10 nhưng không chứng minh được Azure sản xuất
  App Service p95 dưới tải đồng thời.
- Không đo được độ trễ của SMTP/nhà cung cấp và việc gửi hộp thư đến thực.
- Tổng số byte JavaScript không phải là thước đo kích thước truyền sản xuất; gzip/Brotli
  kích thước truyền phụ thuộc vào cấu hình CDN lưu trữ.
- Việc chia tách gói tiếp theo có thể vẫn là một cách tối ưu hóa trong tương lai nếu trình duyệt thực
  đo từ xa cho thấy nhu cầu; lời khuyên về phần nhập cảnh Giai đoạn 3 đã được giải quyết.
