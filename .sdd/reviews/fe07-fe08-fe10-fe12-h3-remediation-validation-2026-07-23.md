# Xác thực khắc phục H3 FE07/FE08/FE10/FE12

**Ngày:** 2026-07-23
**Trạng thái:** ĐANG TIẾN HÀNH - CÁC PHÁT HIỆN H3 LẶP LẠI ĐANG ĐƯỢC KHẮC PHỤC
**Nhánh:** `codex/fe07-fe08-fe10-fe12-business-rules`
**PR:** [#62](https://github.com/SWP391-LibraryManagement/LibraryManagement/pull/62)

## 1. Phạm vi đã phê duyệt

Người dùng đã phê duyệt addendum khắc phục H3 trong
`docs/superpowers/specs/2026-07-23-fe07-fe08-fe10-fe12-final-verification-remediation-design.md`.
Việc khắc phục được giới hạn ở:

1. giữ các cảnh báo notification-audit FE08 an toàn khi `expire-holds` nâng cấp
   reservation;
2. khớp việc tìm kiếm user-report trong bộ nhớ FE12 với ngữ nghĩa SQL `LIKE` có
   tham số hoá hiện có;
3. sửa ranh giới xác minh migration Azure và bằng chứng task-gate cũ;
4. hoàn tất parity dấu ngoặc đóng SQL `LIKE`, bằng chứng regression nhiều cảnh
   báo, hợp đồng OpenAPI cảnh báo FE08 số ít và bằng chứng quản trị sau H2
   sau H3 lặp lại.

Không vai trò, quyền, cột/bảng database, dependency, worker retry notification,
trường báo cáo hay workflow frontend mới nào được cho phép.

## 2. Bằng chứng đã được rà soát trước đó

| Bằng chứng | Kết quả |
| --- | --- |
| H2 ban đầu và addendum H2 | Đạt |
| Head nhánh đã review trước khắc phục H3 | `97aca62667d676fb74a8833b46c27a8f67fefbad` |
| Lần chạy CI PR #62 | `30014066260` - `success` |
| Review H3 đầu tiên | Trả về các phát hiện FE08, FE12 và triển khai/quản trị được khoanh vùng |
| H2 mới cho đợt khắc phục H3 đầu tiên | Đạt |
| Head khắc phục đã H2 review | `b931e005e50dc9c0ec9c177f2874f88a1df943b0` |
| Lần chạy CI PR #62 đã cập nhật | `30019439505` - `success` cho `b931e005e50dc9c0ec9c177f2874f88a1df943b0` |
| Trạng thái PR sau CI đã cập nhật | Mở, sẵn sàng; `MERGEABLE` / `CLEAN` |
| Review H3 lặp lại | Trả về các phát hiện parity dấu ngoặc đóng, regression nhiều cảnh báo, OpenAPI số ít và bằng chứng cũ được khoanh vùng |
| SHA product staging | `9b02c7eb0078c317c3584472c1666cd01159e2c7` |
| Lần chạy triển khai staging | `30012925318` - `success` |

Migration FE10 `2026-07-23-fe10-processing-status.sql` được chứng minh
idempotent bằng cách chạy hai lần trên database SQL Server cục bộ tạm thời có
tên, sau đó áp dụng một lần lên Azure staging theo quy trình operator đã review.
Đợt khắc phục này không chạy lại migration đó.

## 3. Bằng chứng nguyên nhân gốc

### 3.1 Nâng cấp reservation hết hạn FE08

`holdReservation` gắn `notificationWarning` dưới dạng thuộc tính nội bộ không
enumerable. `processQueue` sao chép thuộc tính đó vào phản hồi top-level số ít,
nhưng `expireHolds` chỉ push reservation đã nâng cấp và trả về trước khi sao
chép cảnh báo. Do đó, tuần tự hoá JSON giữ lại việc nâng cấp đã commit nhưng âm
thầm làm mất cảnh báo bắt buộc.

Mốc cơ sở trước regression mới:

```text
Test Suites: 3 passed, 3 total
Tests:       61 passed, 61 total
```

RED sau khi thêm coverage service và route:

```text
Test Suites: 2 failed, 2 total
Tests:       2 failed, 48 passed, 50 total
Expected notificationWarnings; received undefined.
```

GREEN sau bản sửa service được khoanh vùng:

```text
Test Suites: 2 passed, 2 total
Tests:       50 passed, 50 total
```

Xác minh FE08 tập trung:

```text
Backend:  Test Suites 3 passed; Tests 59 passed.
Frontend: Tests 212 passed; 0 failed.
```

Phản hồi nay thêm `notificationWarnings[]` top-level tuỳ chọn; mỗi mục đúng là
`reservationId`, `copyId`, `code` an toàn và `message` an toàn.
`processQueue.notificationWarning` số ít hiện có và DTO reservation đã nâng cấp
không đổi.

### 3.2 Parity SQL `LIKE` FE12

Production đã bind `%${filters.q}%` qua `sql.NVarChar` và đánh giá bằng SQL
`LIKE`. Repository user-report trong bộ nhớ thay vào đó chuyển query sang chữ
thường và dùng `String.includes` literal, vì vậy input wildcard hành xử khác
trong kiểm thử.

RED sau khi thêm các trường hợp wildcard:

```text
Test Suites: 1 failed, 1 total
Tests:       3 failed, 15 passed, 18 total
Failing cases: %MEMBER%, L_BRARIAN, [1-2].
```

GREEN sau khi thêm matcher chỉ dùng cho kiểm thử:

```text
Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
```

Xác minh FE12 tập trung:

```text
Test Suites: 3 passed, 3 total
Tests:       46 passed, 46 total
```

SQL production, tham số query, trường có thể tìm kiếm, payload API, aggregation
và pagination không đổi.

### 3.3 Phát hiện về tính đầy đủ H3 lặp lại

H3 Standards/Spec lặp lại đã review PR chính xác đang sẵn sàng sau lần chạy CI
`30019439505`. Nó xác nhận propagation cảnh báo hết hạn FE08 đã triển khai, các
trường hợp wildcard baseline FE12, quy trình Azure, merge ảo và các ranh giới
bảo mật, rồi phát hiện bốn khoảng trống về tính đầy đủ được khoanh vùng:

1. compiler SQL `LIKE` chỉ dùng cho kiểm thử coi `]` đầu tiên là ký tự kết thúc
   class, vì vậy sai khác với `[]]` và `[^]]`;
2. regression service và route chỉ chứng minh một cảnh báo nâng cấp hết hạn,
   thay vì mọi cảnh báo trong batch nhiều copy;
3. OpenAPI mô tả `expire-holds.notificationWarnings[]` nhưng không mô tả
   `process-queue.notificationWarning` số ít hiện có;
4. bằng chứng validation/task vẫn mô tả nhánh là chưa commit và đang chờ chu kỳ
   H2/CI đã hoàn tất.

RED parity SQL vòng hai:

```text
Test Suites: 1 failed, 1 total
Tests:       2 failed, 18 passed, 20 total
Failing cases: [^]] and []].
```

GREEN parity SQL vòng hai:

```text
Test Suites: 3 passed, 3 total
Tests:       48 passed, 48 total
```

Các regression service/route FE08 nhiều cảnh báo đạt với vòng lặp production
hiện có: 3 suite và 59 kiểm thử đạt. Không cần thay đổi service production
FE08. Phản hồi OpenAPI cảnh báo số ít cũng parse thành công.

## 4. Ranh giới Azure

Hướng dẫn staging nay yêu cầu:

1. chỉ chạy hai lần mọi migration ứng viên trên một database cục bộ tạm thời có
   tên;
2. chạy một lần đã review trên database staging dự kiến;
3. kiểm tra chỉ đọc target, schema và constraint `CK_Notifications_Status`;
4. xoá ngay rule firewall operator tạm thời chính xác.

Chấp nhận staging sau merge cho đợt khắc phục này là schema chỉ đọc cộng với
smoke ứng dụng. Không được chạy lại migration FE10 chỉ để xác nhận lại tính
idempotent.

## 5. Trạng thái tích hợp hiện tại

Làm mới chỉ đọc ngày 2026-07-23:

| Hạng mục | Giá trị hiện tại |
| --- | --- |
| HEAD khắc phục đã H2 review | `b931e005e50dc9c0ec9c177f2874f88a1df943b0` |
| `origin/main` mới nhất | `cfe8954bc49bbcdd46d8f656f9d0d665cc388dd4` |
| Cây merge head đã commit ảo | `e22a848b1f806a4988092581e78e3e76501805c6` |
| Trạng thái PR | Mở, sẵn sàng |
| Kết quả merge GitHub | `MERGEABLE` / `CLEAN` |

`main` mới nhất bao gồm một commit hợp đồng E2E Admin Console FE11 xuất hiện
sau. H3 lặp lại phải review merge ref hiện tại chính xác, bao gồm các thay đổi
OpenAPI độc lập, thay vì dựa vào kết quả CI PR trước đó.

## 6. Rà soát bảo mật và phạm vi

- Các mục cảnh báo FE08 không chứa danh tính member, địa chỉ recipient, message
  provider, nội dung notification đã render, error stack, credential hay secret.
- DTO reservation đã nâng cấp hiện có mà nhân viên thấy được không bị mở rộng
  hoặc thu hẹp.
- SQL production FE12 vẫn có tham số; compiler pattern mới chỉ tồn tại trong
  repository kiểm thử trong bộ nhớ và nhận query tối đa 200 ký tự đã được xác
  thực.
- Tài liệu Azure không chứa password, connection string, token, IP operator hay
  giá trị firewall.
- Thư mục untracked thuộc người dùng
  `output/audit-librarian-2026-07-22/` vẫn ngoài phạm vi và không được stage.

## 7. Ảnh chụp cổng tại thời điểm đóng băng H2

Checklist này ghi nhận ứng viên trước commit đã đóng băng. Kết quả commit, push,
PR-CI và H3 sau H2 được xác minh từ head GitHub sống chính xác, thay vì được dự
đoán bên trong commit tạo head đó.

- [x] Kiểm tra tiện ích triển khai, truy vết và diff hygiene đạt.
- [x] Kiểm thử backend đầy đủ, tích hợp hệ thống, coverage, audit,
      lint/kiểm thử/build frontend, Chromium E2E và kiểm tra import backend đạt.
- [x] Rà soát tương thích main hiện tại và bảo mật/diff cuối cùng đạt.
- [x] H2 mới đã phê duyệt diff khắc phục H3 đầu tiên.
- [x] Chỉ các tệp đã H2 review được commit và push với `b931e00`.
- [x] Kiểm tra PR đã cập nhật đạt trong lần chạy `30019439505`.
- [x] H3 Standards và Spec lặp lại hoàn tất và trả về các phát hiện vòng hai
      được khoanh vùng ghi ở trên.
- [x] H2 mới phê duyệt diff khắc phục vòng hai đầy đủ chưa commit.
- [ ] Chỉ các tệp vòng hai mới đã H2 review được commit và push.
- [ ] Kiểm tra PR đã cập nhật đạt cho head mới đã review.
- [ ] H3 Standards và Spec lặp lại đạt trước merge.
- [ ] CI `main` chính xác sau merge, triển khai staging tự động và xác minh
      staging chỉ đọc đạt.

## 8. Bằng chứng tự động trước H2 của đợt khắc phục H3 đầu tiên

Mọi lệnh bên dưới chạy trên trạng thái khắc phục cuối cùng chưa commit, trừ khi
dòng ghi rõ chỉ frontend; không source frontend nào thay đổi sau lần lint/test/
build đã ghi nhận của nó.

| Kiểm tra | Kết quả |
| --- | --- |
| Backend FE08/FE12 tập trung | 6 suite, 105 kiểm thử đạt |
| Backend đầy đủ | 61 suite, 1,011 kiểm thử đạt |
| Tích hợp hệ thống | 1 suite, 10 kiểm thử đạt |
| Độ bao phủ backend | 91.95% câu lệnh, 81.27% nhánh, 97.29% hàm, 91.86% dòng |
| Frontend | lint đạt; 212 kiểm thử đạt; build production đạt |
| Audit root/backend/frontend | 0 lỗ hổng tại ngưỡng `high` |
| Chromium E2E | 4/4 đạt |
| Tiện ích triển khai | 8/8 đạt |
| Ép truy vết | đạt; thẻ FR FE08 28/29 và FE12 11/11 |
| Parse YAML OpenAPI | đạt |
| Kiểm tra import backend | đạt |
| Diff hygiene | `git diff --check` đạt |
| Áp dụng patch main mới nhất | đạt với `origin/main` `cfe8954bc49bbcdd46d8f656f9d0d665cc388dd4` |

H3 lặp lại sau đó đã review độc lập PR sẵn sàng và trả về các phát hiện vòng hai
ở Phần 3.3. Đây là trạng thái bằng chứng trước H2 trước lần phê duyệt được ghi
ở Phần 10.

## 9. Bằng chứng tự động trước H2 của đợt khắc phục vòng hai

Mọi kiểm tra bên dưới chạy với code và contract diff vòng hai đầy đủ. Bản cập
nhật bằng chứng cuối chỉ về quản trị không thay đổi source thực thi, kiểm thử,
OpenAPI, dependency hay tiện ích triển khai.

| Kiểm tra | Kết quả |
| --- | --- |
| Backend FE08/FE12 tập trung | 6 suite, 107 kiểm thử đạt |
| Backend đầy đủ | 61 suite, 1,013 kiểm thử đạt |
| Tích hợp hệ thống | 1 suite, 10 kiểm thử đạt |
| Độ bao phủ backend | 91.95% câu lệnh (914/994), 81.27% nhánh (699/860), 97.29% hàm (144/148), 91.86% dòng (904/984) |
| Frontend | lint đạt; 212 kiểm thử đạt; build production đạt |
| Audit root/backend/frontend | 0 lỗ hổng tại ngưỡng `high` |
| Chromium E2E | 4/4 đạt |
| Tiện ích triển khai | 8/8 đạt |
| Ép truy vết | đạt; thẻ FR FE08 28/29 và FE12 11/11; không feature nào dưới 70% |
| Parse YAML OpenAPI | đạt |
| Kiểm tra import backend | đạt |
| Diff hygiene | `git diff --check` đạt |
| Rà soát ranh giới production | không có diff vòng hai trong `reservationService.js` hoặc `reportRepository.js` |
| Merge head đã commit của main mới nhất | cây sạch `e22a848b1f806a4988092581e78e3e76501805c6` |
| Merge main mới nhất cộng patch vòng hai trước bằng chứng cuối | cây sạch `9fecfa6dfd5e99dd7476c731163f3be2a7c38fa2` |

Đợt khắc phục vòng hai chỉ thay đổi test helper, regression, contract OpenAPI
và bằng chứng quản trị đã được phê duyệt. Thư mục audit untracked thuộc người
dùng vẫn không bị chạm. Phần này đóng băng ứng viên đầy đủ chưa commit được trình
bày để H2 mới review; không mutation Azure SQL hay triển khai Azure staging nào
xảy ra khi xác thực.

## 10. Addendum phê duyệt H2 cục bộ vòng hai

**Ngày:** 2026-07-23

**Quyết định:** ĐẠT - ĐƯỢC PHÉP COMMIT TẬP ĐÃ REVIEW VÀ PUSH NHÁNH

- L1 tự động: FE08/FE12 tập trung, backend đầy đủ, tích hợp hệ thống, coverage,
  lint/kiểm thử/build frontend, audit, Chromium E2E, tiện ích triển khai,
  truy vết, parse OpenAPI, import backend và diff hygiene đạt với các kết quả
  ghi ở Phần 9.
- L2 spec: diff giới hạn ở các phát hiện H3 lặp lại đã phê duyệt về parity dấu
  ngoặc đóng SQL `LIKE`, bằng chứng FE08 nhiều cảnh báo, contract OpenAPI cảnh
  báo số ít và bằng chứng quản trị trung thực.
- L3 constitution/an toàn: service FE08 production và repository SQL FE12
  không đổi; không mở rộng vai trò, quyền, schema, dependency, frontend, Azure,
  secret, credential hay PII thực.
- L4 chấp nhận: các regression service và route tuần tự hoá chứng minh hai cảnh
  báo an toàn có thứ tự, còn regression parity report chứng minh `[]]` và
  `[^]]`.

Người dùng đã phê duyệt H2 rõ ràng sau khi review ứng viên đóng băng có cây kết
hợp main mới nhất là `2bcb4b89f3a445427189caa9526cf5dae5c17126`. Addendum phê
duyệt cơ học này không mở rộng hành vi hoặc phạm vi tệp đã review. Nó cho phép
commit và push lên PR #62; kiểm tra PR đã cập nhật và H3 lặp lại vẫn bắt buộc
trước merge.
