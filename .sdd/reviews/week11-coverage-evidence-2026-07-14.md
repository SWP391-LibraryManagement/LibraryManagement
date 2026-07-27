# Bằng chứng độ bao phủ Tuần 11 - 2026-07-14

Nhánh: `test/week11-quality-sprint`

Phạm vi: các tệp bộ điều khiển/dịch vụ/tuyến/bộ xác thực FE07, FE08, FE10 và FE12 đã hoàn thành được cấu hình bởi `backend/package.json`.

## Lệnh đường cơ sở

```powershell
npm.cmd --prefix backend run test:coverage -- --coverageReporters=json-summary --coverageReporters=text
```

Kết quả quan sát: 21 bộ đạt, 282 kiểm thử đạt.

| Chỉ số | Đã bao phủ / Tổng | Đường cơ sở | Mục tiêu | Trạng thái |
| --- | --- | --- | --- | --- |
| Câu lệnh | 735 / 817 | 89.96% | 80% | PASS |
| Nhánh | 454 / 596 | 76.17% | 80% | KHOẢNG TRỐNG |
| Hàm | 131 / 138 | 94.92% | 80% | PASS |
| Dòng | 726 / 808 | 89.85% | 80% | PASS |

Phải bao phủ thêm ít nhất 23 nhánh có ý nghĩa để đạt mức sàn nhánh toàn cục 80 phần trăm.

## Ma trận khoảng trống xếp hạng

| Ưu tiên | Tệp | Độ bao phủ nhánh | Khoảng trống có ý nghĩa | Liên kết đặc tả / chất lượng |
| --- | --- | --- | --- | --- |
| 1 | `backend/src/services/reservationService.js` | 59.37% (57/96) | bộ lọc danh sách, tranh chấp hủy, bản sao không khớp, thiếu bản sao/đặt trước, giữ chỗ thất bại, dự phòng thông báo và kiểm toán, hàng đợi trống, nâng cấp khi hết hạn | FE08 FR-010, FR-016/017, FR-019/020/021 và luồng lỗi EC-FE08 |
| 2 | `backend/src/services/reportService.js` | 65.95% (31/47) | mặc định khi thiếu tác nhân/ngữ cảnh, dự phòng mã 5xx an toàn, hành vi khi tắt kiểm toán | Ranh giới vai trò FE12 và bằng chứng kiểm toán an toàn NFR-FE12-LOG |
| 3 | `backend/src/controllers/reservationController.js` | 0% nhánh (0/1), 64.51% dòng | đường dẫn `next(error)` của bộ điều khiển cho endpoint liệt kê/xử lý/hết hạn | Lan truyền lỗi API FE08 |
| 4 | `backend/src/controllers/reportController.js` | 0% nhánh (0/1), 80% dòng | đường dẫn `next(error)` của bộ điều khiển cho cả ba báo cáo | Lan truyền lỗi API FE12 |
| 5 | `backend/src/services/borrowingService.js` | 74.83% (116/155) | các nhánh ID/vai trò/ngày/tranh chấp còn lại | Ca biên FE07; chỉ xử lý nếu khoảng trống FE08/FE12 không đạt ngưỡng |

## Công việc đóng khoảng trống đã chọn

1. Thêm kiểm thử dịch vụ/bộ điều khiển FE08 cho các nhánh hàng đợi, hủy, không khớp và dự phòng đã ghi tài liệu.
2. Thêm kiểm thử dịch vụ/bộ điều khiển FE12 cho kiểm toán lỗi truy cập an toàn và các nhánh phụ thuộc tùy chọn.
3. Chạy lại độ bao phủ sau mỗi nhóm trọng tâm.
4. Không thêm kiểm thử chỉ nhằm gọi mặc định hàm tạo tuyến; phần đóng góp cho ngưỡng phải đến từ hành vi quan sát được hoặc xử lý lỗi an toàn.

## Kết quả đóng khoảng trống

Đã thêm độ bao phủ dịch vụ trực tiếp trong:

- `backend/tests/reservationService.test.js`: 14 kiểm thử FE08 bao phủ bộ lọc danh sách, bộ bảo vệ vai trò, kết quả hủy, xác thực xử lý, kết quả hàng đợi, dự phòng thông báo/kiểm toán và nâng cấp khi giữ chỗ hết hạn.
- `backend/tests/reportService.test.js`: 5 kiểm thử FE12 bao phủ chuyển tiếp báo cáo, bộ bảo vệ vai trò, siêu dữ liệu lỗi 5xx/không xác định an toàn và hoạt động khi tắt kiểm toán.

Quan sát sau các phần bổ sung trọng tâm: 23 bộ đạt, 301 kiểm thử đạt.

| Chỉ số | Đã bao phủ / Tổng | Cuối | Mục tiêu | Trạng thái |
| --- | --- | --- | --- | --- |
| Câu lệnh | 760 / 817 | 93.02% | 80% | PASS |
| Nhánh | 496 / 596 | 83.22% | 80% | PASS |
| Hàm | 133 / 138 | 96.37% | 80% | PASS |
| Dòng | 751 / 808 | 92.94% | 80% | PASS |

Cải thiện chính:

- Độ bao phủ nhánh `reservationService.js`: 59.37% -> 88.54%.
- Độ bao phủ nhánh `reportService.js`: 65.95% -> 95.74%.
- Không thay đổi tệp nguồn production nào để đạt kết quả.

## Cổng được thực thi

`backend/package.json` hiện yêu cầu toàn cục 80 phần trăm cho câu lệnh, nhánh, hàm và dòng. CI chạy:

```powershell
npm.cmd --prefix backend run test:coverage:ci
```

Kết quả quan sát sau khi bật ngưỡng: 23 bộ đạt, 301 kiểm thử đạt và cả bốn chỉ số độ bao phủ vẫn trên 80 phần trăm. Lệnh thoát với mã 0.

## Xác thực lại đợt cuối

Sau khi thêm bộ hồi quy bảo mật Tuần 12, cổng chất lượng cuối đạt 24 bộ và
307 kiểm thử. Phạm vi độ bao phủ đã cấu hình không đổi và lặp lại cùng kết quả đạt:
câu lệnh 93.02%, nhánh 83.22%, hàm 96.37% và dòng 92.94%.

## Hiện vật được tạo

`backend/coverage/` được tạo cục bộ và bị kho mã bỏ qua.
