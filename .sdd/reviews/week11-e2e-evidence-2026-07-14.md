# Bằng chứng E2E trình duyệt Tuần 11 - 2026-07-14

Nhánh: `test/week11-quality-sprint`

## Phạm vi

`E2E-SYS-001` chứng minh một hành trình kết hợp trọng yếu trên frontend React thật và các dịch vụ bám sát production:

```text
Member browser login
  -> FE07 browser borrow request
  -> Librarian browser login and approval
  -> FE07 browser overdue return
  -> FE09 calculate and paid through Playwright API context
  -> FE12 browser borrowing report
```

Bước FE09 được chủ ý thực hiện ở cấp API vì `FineManagement.jsx` vẫn là nguyên mẫu cục bộ. Bằng chứng này không tuyên bố độ bao phủ trình duyệt FE09 đầy đủ.

## Ranh giới kiến trúc

- Frontend: Vite trên `127.0.0.1:4173`.
- Backend: máy chủ HTTP Node chỉ dành cho localhost trên `127.0.0.1:3100`.
- Dịch vụ nghiệp vụ: các hàm tạo dịch vụ bám sát production hiện có từ `makeSystemIntegrationApp()`.
- Dữ liệu: các kho dữ liệu trong bộ nhớ với người dùng và mật khẩu được tạo khi chạy.
- Điều khiển: `/__e2e__/*` chỉ tồn tại trong `tests/e2e/support/systemTestServer.js` và không được ứng dụng production gắn vào.

## Bằng chứng Đỏ-Xanh

1. Lần chạy kiểm thử đầu tiên thất bại với `ECONNREFUSED 127.0.0.1:3100`, xác nhận kiểm thử cần máy chủ E2E còn thiếu.
2. Lần chạy tích hợp đầu tiên tới trang Thủ thư và làm lộ bộ định vị `Pending` không rõ ràng.
3. Lần chạy thứ hai tới xử lý trả và làm lộ bộ định vị `14 ngay` không rõ ràng.
4. Các bộ định vị được giới hạn trong vùng chứa bảng/bảng điều khiển; không thay đổi hành vi production nào cho các lỗi đó.
5. Sau đó đầu ra trình duyệt làm lộ cảnh báo tương thích MUI thật do `InputProps` cũ gây ra; một kiểm thử hồi quy frontend được thêm trước khi chuyển sang `slotProps`.

## Bằng chứng đạt

```powershell
npm.cmd --prefix frontend test
npm.cmd run test:e2e
```

Kết quả quan sát:

- Frontend: 38 kiểm thử đạt.
- Playwright Chromium: 1 kiểm thử đạt trong 17.6 giây tại cổng chất lượng cuối.
- Khung nhìn máy tính để bàn: báo cáo hiển thị trạng thái yêu cầu/chi tiết đã hoàn thành mà không bị chồng lấn rối.
- Khung nhìn di động `390x844`: không tràn ngang; bộ lọc và thẻ KPI vẫn dễ đọc.
- Bảng điều khiển trình duyệt sau khi sửa MUI: không có lỗi React `InputProps`. Các thông báo SMTP chưa cấu hình và `NO_COLOR` vẫn là khuyến cáo của môi trường kiểm thử.

## Chính sách hiện vật

Ảnh chụp màn hình, dấu vết, video, `playwright-report/` và `test-results/` bị bỏ qua. Hiện vật lỗi vẫn ở cục bộ và không được commit. CI cài đặt Chromium và chạy `npm run test:e2e`.
