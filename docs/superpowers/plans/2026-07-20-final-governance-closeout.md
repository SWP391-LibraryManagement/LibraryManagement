# Kế hoạch thực hiện kết thúc quản trị cuối cùng

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Tạo ra một ứng cử viên khóa sổ `v1.0.2` sẵn sàng đánh giá để khôi phục các bộ lọc Nhật
ký kiểm tra FE11 đã được phê duyệt, điều chỉnh trạng thái SDD hiện tại cũng như điều chỉnh tài liệu
quản trị và phát hành mà không thay đổi hành vi máy chủ.

**Kiến trúc:** Giữ nguyên FE11 API, ranh giới trình tạo truy vấn, ủy quyền và biên tập hiện có. Chỉ
khôi phục các điều khiển React bị thiếu, chứng minh chúng bằng các kiểm thử hồi quy giao diện người
dùng cấp nguồn, sau đó đối chiếu siêu dữ liệu tài liệu và phát hành các tham chiếu dưới dạng một lớp
vỏ riêng biệt.

**bộ công nghệ công nghệ:** Trình chạy thử React 19, Node.js, Express 5, Jest, Playwright, tạo phẩm
Markdown SDD, GitHub Actions.

## Ràng buộc toàn cầu

- bộ công nghệ được phê duyệt vẫn là các API Node.js + Express.js, React + Bootstrap, SQL Server và REST.
- Không có điểm cuối API, lược đồ, quyền vai trò, quy tắc nghiệp vụ, sự phụ thuộc hoặc các thay đổi bí mật theo giai đoạn.
- Bảo toàn tất cả các tập tin không bị theo dõi do người dùng tạo; chỉ bỏ qua `.worktrees/` và `.superpowers/`.
- Mọi hành vi của FE11 đều ánh xạ tới `BR-FE11-018`, `BR-FE11-026`, `FR-FE11-033` và `AC-FE11-018`.
- Sử dụng TDD cho hành vi giao diện người dùng FE11: quan sát RED trước khi chỉnh sửa mã sản xuất.
- Không cam kết các thay đổi triển khai đã tạo cho đến khi đánh giá H2 của con người phê duyệt bằng chứng hoàn chỉnh về khác biệt và L1-L4.

---

### Nhiệm vụ 1: Chuẩn bị mốc cơ sở biệt lập

**Tệp:**
- Cây làm việc hiện có: `D:/SWP391/.worktrees/library-management-system/final-governance-closeout`
- nhánh hiện tại: `docs/final-governance-closeout`

**Giao diện:**
- Tiêu thụ: cam kết thiết kế được phê duyệt `a6f47b6`.
- Tạo ra: các phần phụ thuộc được cài đặt và mốc cơ sở rõ ràng cho bằng chứng RED/GREEN sau này.

- [x] **Bước 1: Xác minh trạng thái nhánh và cây**

Chạy:

```powershell
git status --short --branch
git log -2 --oneline
```

Dự kiến: nhánh `docs/final-governance-closeout`, không có thay đổi nào được theo dõi, cam kết thiết
kế `a6f47b6` tại `HEAD`.

- [x] **Bước 2: Cài đặt các phần phụ thuộc chính xác**

Chạy:

```powershell
npm.cmd ci
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
```

Dự kiến: cả ba lượt cài đặt đều thoát `0` mà không sửa đổi các tệp khóa được theo dõi.

- [x] **Bước 3: Chạy kiểm tra cơ bản tập trung**

Chạy:

```powershell
npm.cmd --prefix frontend test
npm.cmd run trace:enforce
git diff --check
```

Dự kiến: giao diện `151/151`, truy vết `12/12` tại `100%`, không có lỗi khác biệt.

---

### Nhiệm vụ 2: Khôi phục bộ lọc nhật ký kiểm tra FE11 bằng TDD

**Tệp:**
- Sửa đổi: `frontend/test/userManagementFrontend.test.js`
- Sửa đổi: `frontend/src/page/UserManagement.jsx`

**Giao diện:**
- Tiêu thụ: `auditFilters`, `setAuditFilters`, `buildAuditLogParams` và `loadAuditLogs` đã được xác định trong `UserManagement.jsx`.
- Tạo ra: các điều khiển `action` và `actorId` hiển thị cung cấp cho trình tạo truy vấn chuẩn hiện có.

- [x] **Bước 1: Viết kiểm thử hồi quy giao diện người dùng không thành công**

Thêm kiểm thử này sau kiểm thử xây dựng truy vấn kiểm tra hiện có:

```javascript
test('FE11 Audit exposes the approved action and actor filters', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /aria-label="Lọc hành động"[\s\S]*?value=\{auditFilters\.action\}/);
  assert.match(source, /setAuditFilters\(\(current\) => \(\{[\s\S]*?action: event\.target\.value/);
  assert.match(source, /aria-label="Actor ID"[\s\S]*?type="number"[\s\S]*?value=\{auditFilters\.actorId\}/);
  assert.match(source, /setAuditFilters\(\(current\) => \(\{[\s\S]*?actorId: event\.target\.value/);
});
```

- [x] **Bước 2: Chạy kiểm thử tập trung và xác minh RED**

Chạy:

```powershell
npm.cmd --prefix frontend test -- --test-name-pattern="FE11 Audit exposes"
```

Dự kiến: THẤT BẠI vì `UserManagement.jsx` không hiển thị `aria-label="Lọc hành động"` hoặc
`aria-label="Actor ID"`.

- [x] **Bước 3: Khôi phục các biện pháp kiểm soát sản xuất tối thiểu**

Chèn các điều khiển này vào giữa trường tìm kiếm kiểm tra và dữ liệu nhập ngày:

```jsx
<input
  aria-label="Lọc hành động"
  value={auditFilters.action}
  maxLength={100}
  placeholder="AUTH_LOGIN_SUCCESS"
  onChange={(event) => setAuditFilters((current) => ({
    ...current,
    action: event.target.value,
  }))}
/>
<input
  aria-label="Actor ID"
  type="number"
  min="1"
  step="1"
  value={auditFilters.actorId}
  onChange={(event) => setAuditFilters((current) => ({
    ...current,
    actorId: event.target.value,
  }))}
/>
```

Khôi phục lưới thanh công cụ kiểm tra thành:

```css
.um-toolbar.audit { display: grid; grid-template-columns: minmax(260px, 1fr) 190px 100px 150px 150px auto auto; margin-bottom: 0; }
```

- [x] **Bước 4: Xác minh GREEN và hồi quy giao diện người dùng**

Chạy:

```powershell
npm.cmd --prefix frontend test -- --test-name-pattern="FE11 Audit"
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Dự kiến: vượt qua các kiểm thử FE11 tập trung, vượt qua toàn bộ giao diện người dùng `152/152`, kiểm
tra mã và bản dựng.

- [x] **Bước 5: Ghi lại điểm kiểm tra chưa cam kết**

Chạy:

```powershell
git diff -- frontend/test/userManagementFrontend.test.js frontend/src/page/UserManagement.jsx
git diff --check
```

Dự kiến: chỉ xuất hiện các điều khiển bộ lọc FE11 đã được phê duyệt, bố cục thanh công cụ và kiểm tra hồi quy.

---

### Nhiệm vụ 3: Điều chỉnh siêu dữ liệu hoàn thành chức năng hiện tại

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-auth/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-book-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-fine-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-inventory-book-copy/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-membership-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-public-browse/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-user-profile/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`

**Giao diện:**
- Tiêu thụ: `Implementation State: COMPLETE` từ mọi chức năng `TASKS.md` và `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Tạo ra: diễn giải hiện trạng rõ ràng trong khi vẫn giữ lại ảnh chụp nhanh quy hoạch lịch sử.

- [x] **Bước 1: Thêm phiếu bàn giao hiện tại giống nhau cho mọi chức năng SPEC**

Chèn sau tiêu đề `Feature folder` trong tất cả mười hai tệp `SPEC.md`:

```markdown
> Trạng thái bàn giao hiện tại (2026-07-20): `COMPLETE` cho phạm vi Giai đoạn 1 đã phê duyệt.
> `TASKS.md` và `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`
> là nguồn có thẩm quyền cho trạng thái triển khai hiện tại. Các nhãn cũ `Not Started`,
> `PARTIAL`, `READY FOR REVIEW` hoặc đang chờ rà soát được giữ lại bên dưới chỉ là
> ảnh chụp kế hoạch/bằng chứng lịch sử, không phải trạng thái bàn giao hiện tại.
```

- [x] **Bước 2: Đối chiếu các hàng hiện tại của Nhật ký kiểm tra FE11**

Cập nhật phiên bản FE11 thành `0.4.4`, `Last Updated` thành `2026-07-20` và thay đổi các hàng truy
nguyên hiện tại cho `AC-FE11-018` và `FR-FE11-033` thành:

```markdown
| AC-FE11-018 |Chế độ xem nhật ký kiểm tra có thể tìm kiếm/có thể lọc và sắp xếp lại các trường nhạy cảm| FR-FE11-033 | BR-FE11-018, BR-FE11-026 |FE11-AUD01; `frontend/test/userManagementFrontend.test.js`; xác thực khóa quản trị cuối cùng|HOÀN THÀNH (B7 + khóa sổ cuối cùng)|
```

```markdown
| FR-FE11-033 |Nhật ký kiểm tra có thể tìm kiếm/có thể lọc và được biên tập lại| BR-FE11-018, BR-FE11-026 | EC-FE11-018 |FE11-AUD01; `frontend/test/userManagementFrontend.test.js`; xác thực khóa quản trị cuối cùng|HOÀN THÀNH (B7 + khóa sổ cuối cùng)|
```

- [x] **Bước 3: Thêm bằng chứng khóa sổ FE11**

Thêm mục nhập `2026-07-20 - Final Governance Closeout` vào bản ghi `CHANGELOG.md`:

- khôi phục các điều khiển `action` và `actorId`;
- bằng chứng kiểm tra hồi quy;
- không có thay đổi về API, lược đồ, quyền hoặc biên tập;
- cam kết `f10e7f4` được đối chiếu thông qua đợt khóa sổ được xem xét.

Thêm tác vụ `FE11-CLOSE01` đã hoàn thành vào `TASKS.md` được ánh xạ tới `FR-FE11-033` và
`AC-FE11-018`. Thêm các lệnh xác thực và đóng giới hạn tương tự vào phần bằng chứng hiện tại của
`PLAN.md`.

- [x] **Bước 4: Xác minh việc đối chiếu tài liệu**

Chạy:

```powershell
rg -l "Current delivery status \(2026-07-20\): `COMPLETE`" .sdd/specs/*/SPEC.md
rg -n "FR-FE11-033|AC-FE11-018|FE11-CLOSE01" .sdd/specs/feat-user-role-management
npm.cmd run trace:enforce
git diff --check
```

Dự kiến: mười hai đường dẫn SPEC chứa phiếu bàn giao hiện tại; Các hàng và nhiệm vụ FE11 đã hoàn
tất; truy vết vẫn là `12/12`, `100%`.

---

### Nhiệm vụ 4: Phê duyệt siêu dữ liệu quản trị và công bố tài liệu tham khảo của ứng viên

**Tệp:**
- Sửa đổi: `.sdd/constitution.md`
- Sửa đổi: `.agents/AGENTS.md`
- Sửa đổi: `.sdd/constraints/global.md`
- Sửa đổi: `.sdd/constraints/business.md`
- Sửa đổi: `.sdd/constraints/safety.md`
- Sửa đổi: `.gitignore`
- Sửa đổi: `README.md`
- Sửa đổi: `plan.md`
- Sửa đổi: `docs/release/phase3-final-report.md`
- Sửa đổi: `docs/release/final-submission-checklist-2026-07-20.md`
- Sửa đổi: `document/FinalRelease.md`

**Giao diện:**
- Tiêu thụ: sự chấp thuận của con người đối với thiết kế và mốc cơ sở `v1.0.1` đã được công bố.
- Tạo ra: các tiêu đề quản trị đã được phê duyệt và một tham chiếu phát hành bất biến tiếp theo nhất quán, `v1.0.2`.

- [x] **Bước 1: Thúc đẩy các tiêu đề quản trị mà không thay đổi các quy tắc quy phạm**

Áp dụng các chuyển tiếp chỉ dành cho siêu dữ liệu này:

```text
.sdd/constitution.md: Phiên bản 0.1.2, Trạng thái APPROVED, Cập nhật lần cuối 2026-07-20
.agents/AGENTS.md: Phiên bản 0.1.1, Trạng thái APPROVED, Cập nhật lần cuối 2026-07-20
.sdd/constraints/global.md: Phiên bản 0.1.1, Trạng thái APPROVED, Cập nhật lần cuối 2026-07-20
.sdd/constraints/business.md: Phiên bản 0.1.1, Trạng thái APPROVED - PHASE 1 BASELINE, Cập nhật lần cuối 2026-07-20
.sdd/constraints/safety.md: Phiên bản 0.1.1, Trạng thái APPROVED, Cập nhật lần cuối 2026-07-20
```

- [x] **Bước 2: Chỉ bỏ qua các thư mục công cụ cục bộ**

Nối vào phần cào/dụng cụ của `.gitignore`:

```gitignore
.worktrees/
.superpowers/
```

Không thêm quy tắc bỏ qua cho `GLOSSARY.md`, `MISSION.md`, `RESOURCES.md`, `learning-records/` hoặc
tài liệu tóm tắt bản trình bày.

- [x] **Bước 3: Căn chỉnh các tham chiếu phát hành cho `v1.0.2`**

Thay thế tham chiếu phát hành chuẩn trong năm tài liệu phát hành/nguồn và cập nhật các lệnh của
người vận hành cuối cùng và giải phóng URL thành `v1.0.2`. Nêu rõ rằng thẻ chỉ được tạo sau khi hợp
nhất H3 và CI sau hợp nhất chính xác.

- [x] **Bước 4: Xác minh tính nhất quán trong quản trị và phát hành**

Chạy:

```powershell
rg -n "^# Status: DRAFT|^Status: DRAFT" .sdd/constitution.md .agents/AGENTS.md .sdd/constraints
rg -n "v1\.0\.0-final-release" README.md plan.md docs/release document/FinalRelease.md
rg -n "v1\.0\.2" README.md plan.md docs/release document/FinalRelease.md
git check-ignore -v .worktrees .superpowers
git diff --check
```

Dự kiến: không có dự thảo tiêu đề quản trị; không có tài liệu tham khảo phát hành kinh điển cũ; tất
cả các tệp dự định tham chiếu `v1.0.2`; cả hai thư mục công cụ đều bị bỏ qua.

---

### Nhiệm vụ 5: Đưa ra bằng chứng xác thực bốn lớp

**Tệp:**
- Tạo: `.sdd/reviews/final-governance-closeout-validation-2026-07-20.md`
- Sửa đổi: `docs/release/final-submission-checklist-2026-07-20.md`

**Giao diện:**
- Tiêu thụ: đã hoàn thành Nhiệm vụ 2-4 và các URL môi trường tiền sản xuất công khai hiện tại.
- Tạo ra: bằng chứng L1-L4 chính xác cho đánh giá H2/H3 và thẻ `v1.0.2` trong tương lai.

- [x] **Bước 1: Chạy xác thực tự động L1 một cách tuần tự**

Chạy:

```powershell
npm.cmd run trace:enforce
npm.cmd run test:deployment
npm.cmd --prefix backend run test:coverage:ci
npm.cmd run test:system
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
$env:E2E_FRONTEND_PORT='4473'
$env:E2E_BACKEND_PORT='3400'
$env:E2E_FRONTEND_URL='http://127.0.0.1:4473'
$env:E2E_BACKEND_URL='http://127.0.0.1:3400'
npm.cmd run test:e2e
npm.cmd run phase3:performance
```

Dự kiến: tất cả các lệnh đều đạt; tổng giao diện người dùng là `152`, phần máy chủ vẫn là `916`, E2E
vẫn là `4/4`.

- [x] **Bước 2: Chạy kiểm tra độ an toàn và phụ thuộc L3**

Chạy:

```powershell
npm.cmd audit --omit=dev --audit-level=high
npm.cmd --prefix backend audit --omit=dev --audit-level=high
npm.cmd --prefix frontend audit --omit=dev --audit-level=high
node -e "require('yamljs').load('./src/docs/openapi.yaml'); console.log('OPENAPI_PARSE_OK')"
node -e "const app=require('./src/index'); if(!app||typeof app.listen!=='function') throw new Error('invalid export'); console.log('BACKEND_IMPORT_OK')"
```

Chạy hai lệnh Node cuối cùng từ `backend/`. Dự kiến: không có lỗ hổng, thẻ phân tích cú pháp
OpenAPI, thẻ nhập máy chủ.

- [x] **Bước 3: Chạy chấp nhận môi trường tiền sản xuất công khai**

Chạy:

```powershell
$env:STAGING_FRONTEND_URL='https://lemon-wave-04db51100.7.azurestaticapps.net'
$env:STAGING_API_URL='https://app-library-api-staging-nhat714.azurewebsites.net'
npm.cmd run smoke:staging
```

Dự kiến: vượt qua sáu lần kiểm tra: giao diện người dùng, tình trạng, danh mục SQL, CORS được phép,
CORS bị chặn và tuyến đường được bảo vệ.

- [x] **Bước 4: Viết bản ghi xác nhận sử dụng kết quả quan sát được**

Đánh giá phải chứa các phần chính xác sau:

```markdown
# Xác nhận kết thúc quản trị cuối cùng - 2026-07-20

## Quyết định
## Phạm vi thay đổi
## L1 - Kiểm tra tự động
## L2 - Tuân thủ đặc tả và khả năng truy vết
## L3 - Tuân thủ Hiến chương và an toàn
## L4 - Xác minh nghiệm thu
## Ranh giới còn lại
## Ranh giới rà soát H2
```

Ghi lại kết quả lệnh thực tế, ID FE11 đã được phê duyệt, ranh giới quyền/lược đồ/quyền API không
thay đổi, kết quả môi trường tiền sản xuất công khai và các bước H2/H3/thẻ chỉ dành cho con người
còn lại. Thêm bản ghi xác nhận vào danh sách kiểm tra gửi cuối cùng.

- [x] **Bước 5: Chuẩn bị bản đánh giá H2 mà không cần cam kết**

Chạy:

```powershell
git status --short --branch
git diff --stat
git diff --check
git diff -- . ':!package-lock.json' ':!backend/package-lock.json' ':!frontend/package-lock.json'
```

Dự kiến: chỉ các tệp có tên trong gói này mới được thay đổi; tất cả hoạt động triển khai đã tạo vẫn
có sẵn để con người đánh giá H2.
