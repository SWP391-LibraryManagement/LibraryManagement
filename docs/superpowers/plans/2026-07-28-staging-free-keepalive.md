# Kế hoạch triển khai Keepalive miễn phí theo giai đoạn

**Trạng thái:** H1 ĐƯỢC PHÊ DUYỆT 2026-07-28

**Mục tiêu:** Thay thế giải pháp B1 trả phí/Luôn bật theo giai đoạn bằng giải pháp GitHub được kiểm
soát bằng kho lưu trữ, duy trì và đưa Azure App Service về F1 một cách an toàn.

**Thiết kế:** `docs/superpowers/specs/2026-07-28-staging-free-keepalive-design.md`

**nhánh:** `codex/chore-staging-free-keepalive`

**mốc cơ sở:** `origin/main` và `2c0b169cbb81421b17ad43580a8688dddffa328c`

## Nhiệm vụ 1: Thiết lập bằng chứng chính sách quy trình làm việc RED

**Tệp:**

- Tạo: `tests/deployment/stagingKeepalivePolicy.test.js`
- Kiểm tra: `.github/workflows/staging-keepalive.yml`
- Kiểm tra: `docs/deployment/azure-staging-guide.md`

- [ ] Viết kiểm thử Node để đọc hướng dẫn triển khai và quy trình làm việc theo kế hoạch.
- [ ] Yêu cầu chính xác sáu lần bù cron 10 phút.
- [ ] Yêu cầu `workflow_dispatch`, `permissions: contents: read`, có giới hạn
      đồng thời, hết thời gian chờ công việc, `curl` không đóng, số lần thử lại, độ trễ thử lại,
      yêu cầu hết thời gian chờ và điểm cuối HTTPS `/health` chính xác.
- [ ] Yêu cầu người hướng dẫn nêu rõ rằng cách tiếp cận này là nỗ lực tốt nhất và
      chạy quy trình làm việc thủ công thành công trước khi hạ cấp F1.
- [ ] Chạy:

```powershell
node --test tests/deployment/stagingKeepalivePolicy.test.js
```

RED dự kiến: kiểm thử thất bại vì `.github/workflows/staging-keepalive.yml` không tồn tại.

## Nhiệm vụ 2: Thêm quy trình làm việc Keepalive tối thiểu

**Tệp:**

- Tạo: `.github/workflows/staging-keepalive.yml`

- [ ] Thêm trình kích hoạt theo lịch trình và thủ công đã được phê duyệt.
- [ ] Chỉ cấp quyền cho nội dung chỉ đọc.
- [ ] Thêm một công việc Ubuntu kéo dài ba phút.
- [ ] Chỉ gọi điểm cuối `/health` môi trường tiền sản xuất công khai.
- [ ] Sử dụng số lần thử có giới hạn và không thành công đối với các phản hồi không phải 2xx.
- [ ] Chạy kiểm thử tập trung từ Nhiệm vụ 1.

Dự kiến GREEN: kiểm thử chính sách quy trình làm việc tập trung đã vượt qua.

## Nhiệm vụ 3: Tài liệu F1 Thao tác và khôi phục

**Tệp:**

- Sửa đổi: `docs/deployment/azure-staging-guide.md`

- [ ] Thêm phần `Free-Tier Staging Keepalive`.
- [ ] Nói rõ rằng việc phân phối theo lịch trình GitHub và tình trạng thức giấc của F1 là nỗ lực tốt nhất.
- [ ] Hợp nhất tài liệu -> gửi thủ công thành công -> tắt Luôn bật ->
      chia tỷ lệ thành F1.
- [ ] Ghi lại tình trạng sau thay đổi, danh mục công khai, cài đặt công nhân và hàng đợi
      xác minh.
- [ ] Tài liệu B1 + Luôn bật hoàn tác.
- [ ] Chạy lại kiểm tra chính sách quy trình làm việc tập trung.

Dự kiến ​​GREEN: xác nhận chính sách quy trình làm việc và tài liệu đã vượt qua.

## Nhiệm vụ 4: Xác thực và dừng đối với H2

**Tệp:**

- Tạo:
  `.sdd/reviews/staging-free-keepalive-validation-2026-07-28.md`

- [ ] Chạy:

```powershell
node --test tests/deployment/stagingKeepalivePolicy.test.js
npm run test:deployment
git diff --check
git diff --name-only
git status --short
```

- [ ] Quét sự khác biệt để tìm thông tin xác thực, mã thông báo, địa chỉ người nhận, giá trị SMTP,
      điểm cuối thao tác ghi và các tập tin không liên quan.
- [ ] Ghi lại lỗi RED và kết quả lệnh GREEN trong tệp xác thực.
- [ ] Trình bày sự khác biệt hoàn toàn khi triển khai và bằng chứng cho H2.

H2 chỉ cho phép xuất bản bộ cam kết đã được xem xét, đẩy nhánh và xuất bản yêu cầu hợp nhất dự thảo.

## Nhiệm vụ 5: Xuất bản và hoàn thành H3

- [ ] Sau khi phê duyệt H2 rõ ràng, hãy cam kết các tệp đã được xem xét.
- [ ] Đẩy `codex/chore-staging-free-keepalive`.
- [ ] Mở một yêu cầu hợp nhất dự thảo và chờ tất cả các bước kiểm tra cần thiết.
- [ ] Xác nhận yêu cầu hợp nhất vẫn có thể hợp nhất được.
- [ ] Trình bày kiểm tra chính xác và bằng chứng khác biệt cho H3.
- [ ] Chỉ hợp nhất sau khi được phê duyệt H3 rõ ràng.
- [ ] Xác minh CI `main` sau hợp nhất để biết cam kết hợp nhất chính xác.

## Nhiệm vụ 6: Kích hoạt Keepalive trước khi hạ cấp

- [ ] Gửi thủ công `Staging keepalive` từ `main`.
- [ ] Đợi quá trình chạy chính xác hoàn tất thành công.
- [ ] Xác minh công việc được gọi là điểm cuối HTTPS `/health` dự kiến và không hiển thị
      bí mật.

Nếu quá trình chạy không thành công, hãy giữ B1/Luôn bật và dừng hạ cấp.

## Nhiệm vụ 7: Trả Azure về F1 và xác minh

- [ ] Đặt `alwaysOn=false` cho
      `app-library-api-staging-nhat714`.
- [ ] Chia tỷ lệ `plan-library-staging` từ B1 đến F1.
- [ ] Xác minh:

```text
App Service plan SKU = F1
alwaysOn = false
GET /health = 200
GET /api/books = 200
NOTIFICATION_WORKER_ENABLED = true
NOTIFICATION_WORKER_INTERVAL_MS = 60000
NOTIFICATION_WORKER_BATCH_SIZE = 20
số lượng hàng đợi PENDING/PROCESSING được ghi lại mà không chứa PII
```

- [ ] Ghi lại quá trình chạy GitHub, trạng thái Azure, kết quả điểm cuối và hàng đợi tổng hợp
      được tính trong bản ghi xác thực mà không có giá trị bí mật.

## Nhiệm vụ 8: Quay lại nếu xác minh trực tiếp không thành công

Nếu quá trình kiểm tra sau hạ cấp liên tục không thành công:

- [ ] Chia tỷ lệ `plan-library-staging` trở lại B1.
- [ ] Đặt `alwaysOn=true`.
- [ ] Chạy lại kiểm tra tình trạng, danh mục, cài đặt công nhân và hàng đợi tổng hợp.
- [ ] Báo cáo chính xác sự thất bại và bằng chứng khôi phục.
