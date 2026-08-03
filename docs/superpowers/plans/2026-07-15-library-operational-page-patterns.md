# Kế hoạch triển khai các mẫu trang hoạt động của thư viện

> **Đối với nhân viên đại lý:** BẮT BUỘC SUB-SKILL: Sử dụng siêu năng lực:thực thi các kế hoạch để thực hiện kế hoạch này theo từng nhiệm vụ. Lát này sử dụng rõ ràng việc thực thi nội tuyến mà không có tác nhân phụ hoặc trình đánh giá riêng. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Chuẩn hóa tiêu đề trang vận hành, trạng thái dữ liệu, thanh công cụ, bảng, xác nhận và
phản hồi hoàn thành trên FE07, FE08, FE06, FE09 và FE12 mà không thay đổi hành vi kinh doanh.

**Kiến trúc:** Thêm các nguyên mẫu cấu trúc thành phần nhỏ bên cạnh các nguyên mẫu phản hồi hiện có,
sau đó di chuyển các trang theo thứ tự đã được phê duyệt. Các trang tiếp tục sở hữu các lệnh gọi
API, xem mô hình, bộ lọc, lựa chọn và thao tác ghi; các thành phần được chia sẻ có bố cục riêng, ngữ
nghĩa, móc bảng phản hồi, xác nhận phương thức và ngăn chặn hành động trùng lặp.

**Tech bộ công nghệ:** React 19, React Router 7, Vite 8, Bootstrap 5, MUI/biểu tượng lucide hiện có, trình
chạy kiểm thử tích hợp Node, CSS trong `frontend/src/styles/app-shell.css`.

## Ràng buộc toàn cầu

- Không có máy chủ, hợp đồng API, lược đồ cơ sở dữ liệu hoặc thay đổi quy tắc nghiệp vụ.
- Không có thay đổi nào về cách tính khoản phạt, tính đủ điều kiện vay, quy tắc gia hạn, thứ tự xếp hàng đặt chỗ, số liệu báo cáo hoặc chuyển đổi trạng thái hàng tồn kho.
- Không có vai trò khách hàng mới hoặc hành vi ủy quyền máy chủ.
- Không có sự phụ thuộc vào sản xuất hoặc kiểm thử mới.
- FE06 vẫn chỉ ở chế độ trình bày và giữ lại ranh giới dữ liệu mô phỏng/trong bộ nhớ hiện tại.
- FE09 vẫn chỉ ở chế độ trình bày và giữ lại hành vi localStorage/dữ liệu mẫu; `FE09-T012` vẫn mở.
- Các trang hoạt động được bảo vệ sử dụng nhãn tiếng Việt dành cho người dùng; mã định danh và tên kiểm tra vẫn là tiếng Anh.
- Giữ nguyên các phương thức API, trình trợ giúp mô hình xem, trình bảo vệ tuyến đường và các kiểm thử tiện ích chức năng hiện có.
- Thực hiện theo thứ tự: nguyên thủy được chia sẻ, FE07, FE08, FE06, FE09, FE12, xác thực.
- Sử dụng `apply_patch` để chỉnh sửa thủ công và chỉ xử lý các tệp thuộc nhiệm vụ hiện tại.

## Bản đồ tệp

### Tệp mới

- `frontend/src/component/shared/OperationalPatterns.jsx`: các thành phần cấu trúc `PageHeader`, `DataToolbar` và `DataTable`.
- `frontend/test/operationalPatternsFrontend.test.js`: hợp đồng điều hướng và thành phần dùng chung.
- `frontend/test/inventoryOperationalFrontend.test.js`: Hợp đồng ranh giới trình bày FE06.
- `frontend/test/fineOperationalFrontend.test.js`: Hợp đồng vỏ FE09, trạng thái chia sẻ và ranh giới nguyên mẫu.
- `frontend/test/reportOperationalFrontend.test.js`: Hợp đồng áp dụng mẫu chia sẻ FE12.
- `frontend/src/styles/fine-management.css`: Kiểu trang cục bộ FE09 sau khi loại bỏ lớp vỏ ứng dụng trùng lặp của nó.
- `.sdd/reviews/library-ux-slice3-validation-review-2026-07-15.md`: bằng chứng tự động cuối cùng và danh sách kiểm tra đánh giá của con người.

### Các tệp được chia sẻ được sửa đổi trong suốt kế hoạch

- `frontend/src/component/shared/Feedback.jsx`: `StatusNotice`, khả năng tương thích `DataNotice`, `EmptyState` có thể hành động, `ConfirmAction` và ngữ nghĩa bánh mì nướng được chia sẻ.
- `frontend/src/component/layout/AppLayout.jsx`: soạn `PageHeader` và đăng ký các biểu tượng điều hướng Kho/khoản phạt.
- `frontend/src/utils/appNavigation.js`: hiển thị Hàng tồn kho và khoản phạt cho các vai trò nhân viên hiện có.
- `frontend/src/styles/app-shell.css`: kiểu hoạt động nguyên thủy và hành vi của bảng hàng được gắn nhãn di động.

### Các tập tin chức năng đã được sửa đổi

- FE07: tất cả các tệp dưới `frontend/src/page/borrowing/`.
- FE08: `frontend/src/page/reservation/MyReservationsPage.jsx` và `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`.
- FE06: `frontend/src/page/InventoryPage.jsx` và các tệp dưới `frontend/src/component/inventory/`.
- FE09: `frontend/src/page/FineManagement.jsx`.
- FE12: tất cả các tệp dưới `frontend/src/page/report/`.

---

### Nhiệm vụ 1: Nguyên tắc hoạt động chung và điều hướng nhân viên

**Tệp:**
- Tạo: `frontend/src/component/shared/OperationalPatterns.jsx`
- Tạo: `frontend/test/operationalPatternsFrontend.test.js`
- Sửa đổi: `frontend/src/component/shared/Feedback.jsx:1-151`
- Sửa đổi: `frontend/src/component/layout/AppLayout.jsx:1-161`
- Sửa đổi: `frontend/src/utils/appNavigation.js:1-48`
- Sửa đổi: `frontend/src/styles/app-shell.css:159-230,275-343,519-604`
- Sửa đổi: `frontend/test/appShellFrontend.test.js:12-42`

**Giao diện:**
- Tiêu thụ: `Modal`, `LoadingBlock`, `.ph`, `.toolbar`, `.lib-table` hiện có và khả năng hiển thị vai trò của nhân viên.
- Sản xuất: `PageHeader({ title, subtitle, actions })`, `DataToolbar({ primary, filters, summary, actions, className })`, `DataTable({ caption, headers, loading, loadingRows, isEmpty, emptyState, children, className })`, `StatusNotice`, `ConfirmAction` và `DataNotice` tương thích.

- [ ] **Bước 1: Viết hợp đồng chia sẻ không thành công**

Tạo `frontend/test/operationalPatternsFrontend.test.js`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('shared operational components expose the approved Slice 3 contracts', async () => {
  const structural = await readFile(new URL('../src/component/shared/OperationalPatterns.jsx', import.meta.url), 'utf8');
  const feedback = await readFile(new URL('../src/component/shared/Feedback.jsx', import.meta.url), 'utf8');
  const layout = await readFile(new URL('../src/component/layout/AppLayout.jsx', import.meta.url), 'utf8');

  for (const name of ['PageHeader', 'DataToolbar', 'DataTable']) {
    assert.match(structural, new RegExp(`export function ${name}\\b`), name);
  }
  assert.match(feedback, /export function StatusNotice\b/);
  assert.match(feedback, /export function DataNotice\(props\)/);
  assert.match(feedback, /export function ConfirmAction\b/);
  assert.match(feedback, /pendingLabel = 'Đang xử lý\.\.\.'/);
  assert.match(layout, /import \{ PageHeader \} from '\.\.\/shared\/OperationalPatterns';/);
  assert.match(layout, /<PageHeader title=\{title\} subtitle=\{subtitle\} actions=\{actions\} \/>/);
});

test('shared data table exposes semantic and mobile labeling hooks', async () => {
  const structural = await readFile(new URL('../src/component/shared/OperationalPatterns.jsx', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../src/styles/app-shell.css', import.meta.url), 'utf8');

  assert.match(structural, /<caption className="sr-only">\{caption\}<\/caption>/);
  assert.match(structural, /scope="col"/);
  assert.match(structural, /className=\{`lib-table operational-table/);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*\.operational-table td::before/);
  assert.match(styles, /content:\s*attr\(data-label\)/);
});

test('staff navigation includes Inventory and Fines without changing role groups', async () => {
  const navigation = await import('../src/utils/appNavigation.js');

  assert.deepEqual(
    navigation.getVisibleNavigation(['LIBRARIAN']).map((item) => item.key),
    [
      'home',
      'borrow-requests-admin',
      'process-returns',
      'reservations-librarian',
      'member-details',
      'inventory-management',
      'fine-management',
      'borrowing-report',
      'inventory-report',
      'user-statistics',
    ],
  );
  assert.equal(navigation.getActiveNavigationKey('/librarian/inventory'), 'inventory-management');
  assert.equal(navigation.getActiveNavigationKey('/librarian/fines'), 'fine-management');
});
```

Cập nhật kỳ vọng điều hướng nhân viên hiện có trong `frontend/test/appShellFrontend.test.js` vào
cùng danh sách khóa được sắp xếp.

- [ ] **Bước 2: Chạy hợp đồng và xác minh chúng thất bại**

Chạy:

```powershell
node --test frontend/test/operationalPatternsFrontend.test.js frontend/test/appShellFrontend.test.js
```

Dự kiến: THẤT BẠI vì `OperationalPatterns.jsx`, `StatusNotice`, `ConfirmAction` và hai mục điều
hướng không tồn tại.

- [ ] **Bước 3: Triển khai cấu trúc nguyên thủy**

Tạo `frontend/src/component/shared/OperationalPatterns.jsx`:

```jsx
import { LoadingBlock } from './Feedback';

function joinClassNames(...values) {
  return values.filter(Boolean).join(' ');
}

export function PageHeader({ title, subtitle, actions }) {
  if (!title && !actions) return null;

  return (
    <div className="ph">
      <div>
        {title && <h1 className="ph-title">{title}</h1>}
        {subtitle && <p className="ph-sub">{subtitle}</p>}
      </div>
      {actions && <div className="ph-actions">{actions}</div>}
    </div>
  );
}

export function DataToolbar({ primary, filters, summary, actions, className = '' }) {
  return (
    <div className={joinClassNames('toolbar', 'data-toolbar', className)}>
      {primary && <div className="data-toolbar-primary">{primary}</div>}
      {filters && <div className="data-toolbar-filters">{filters}</div>}
      {(primary || filters) && (summary || actions) && <span className="spacer" />}
      {summary && <div className="data-toolbar-summary">{summary}</div>}
      {actions && <div className="data-toolbar-actions">{actions}</div>}
    </div>
  );
}

export function DataTable({
  caption,
  headers,
  loading = false,
  loadingRows = 4,
  isEmpty = false,
  emptyState,
  children,
  className = '',
}) {
  if (loading) return <LoadingBlock rows={loadingRows} />;

  const normalizedHeaders = headers.map((header) => (
    typeof header === 'string' ? { label: header } : header
  ));

  return (
    <div className="lib-table-wrap">
      <table className={`lib-table operational-table ${className}`.trim()}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {normalizedHeaders.map(({ label, align }) => (
              <th key={label} scope="col" style={align ? { textAlign: align } : undefined}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {isEmpty && emptyState}
    </div>
  );
}
```

- [ ] **Bước 4: Gia hạn hợp đồng phản hồi chung**

Trong `frontend/src/component/shared/Feedback.jsx`, thay thế `DataNotice`, mở rộng `EmptyState` và
thêm `ConfirmAction`:

```jsx
export function StatusNotice({ type = 'info', title, children, action }) {
  const tone = type === 'warning' ? 'warn' : type;
  const Icon = tone === 'error' ? AlertTriangle : tone === 'success' ? CheckCircle2 : Info;
  return (
    <div className={`data-notice ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon size={17} />
      <div className="data-notice-content">
        {title && <strong>{title}</strong>}
        {children && <p>{children}</p>}
      </div>
      {action && <div className="data-notice-action">{action}</div>}
    </div>
  );
}

export function DataNotice(props) {
  return <StatusNotice {...props} />;
}

export function EmptyState({ icon: Icon = Info, title = 'Chưa có dữ liệu', children, action }) {
  return (
    <div className="empty">
      <Icon size={36} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

export function ConfirmAction({
  title,
  eyebrow,
  children,
  cancelLabel = 'Hủy',
  confirmLabel = 'Xác nhận',
  pendingLabel = 'Đang xử lý...',
  tone = 'primary',
  pending = false,
  confirmDisabled = false,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal
      title={title}
      eyebrow={eyebrow}
      onClose={pending ? undefined : onCancel}
      actions={(
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={pending}>{cancelLabel}</button>
          <button
            type="button"
            className={`btn btn-${tone}`}
            onClick={onConfirm}
            disabled={pending || confirmDisabled}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </>
      )}
    >
      {children}
    </Modal>
  );
}
```

Đặt vai trò của Toast thành `toast.type === 'error' ? 'alert' : 'status'` và giữ nguyên vòng đời 3,2
giây hiện tại của nó.

- [ ] **Bước 5: Soạn tiêu đề trang và điều hướng**

Trong `AppLayout.jsx`, nhập `PageHeader`, thêm `ReceiptText` để làm rõ quá trình nhập, thêm ánh xạ
biểu tượng và thay thế khối `.ph` nội tuyến:

```jsx
import { PageHeader } from '../shared/OperationalPatterns';

const NAV_ICONS = {
  // existing mappings stay unchanged
  'inventory-management': Boxes,
  'fine-management': ReceiptText,
};

<main className="app-content">
  <PageHeader title={title} subtitle={subtitle} actions={actions} />
  {children}
</main>
```

Trong `appNavigation.js`, thêm các mục vai trò hiện có sau `member-details`:

```js
{ key: 'inventory-management', label: 'Quản lý kho sách', path: '/librarian/inventory' },
{ key: 'fine-management', label: 'Quản lý tiền phạt', path: '/librarian/fines' },
```

- [ ] **Bước 6: Thêm kiểu cấu trúc và kiểu di động**

Thêm vào `app-shell.css`:

```css
.data-toolbar-primary,
.data-toolbar-filters,
.data-toolbar-summary,
.data-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}
.data-notice-content { flex: 1; min-width: 0; }
.data-notice-action { margin-left: auto; }
.empty-action { display: flex; justify-content: center; margin-top: 14px; }

@media (max-width: 640px) {
  .ph-actions,
  .ph-actions > *,
  .data-toolbar-primary,
  .data-toolbar-filters,
  .data-toolbar-summary,
  .data-toolbar-actions {
    width: 100%;
  }
  .ph-actions .btn,
  .data-toolbar-actions .btn { justify-content: center; }
  .operational-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
  .operational-table,
  .operational-table tbody,
  .operational-table tr,
  .operational-table td { display: block; width: 100%; }
  .operational-table tbody tr { padding: 10px 14px; border-bottom: 1px solid var(--lib-line); }
  .operational-table tbody tr:last-child { border-bottom: 0; }
  .operational-table tbody td {
    display: grid;
    grid-template-columns: minmax(96px, 38%) minmax(0, 1fr);
    gap: 12px;
    padding: 7px 0;
    border-bottom: 0;
    text-align: left !important;
  }
  .operational-table td::before {
    content: attr(data-label);
    color: var(--lib-ink-2);
    font-size: 12px;
    font-weight: 600;
  }
}
```

- [ ] **Bước 7: Chạy kiểm thử tập trung**

Chạy:

```powershell
node --test frontend/test/operationalPatternsFrontend.test.js frontend/test/appShellFrontend.test.js
```

Dự kiến: ĐẠT với 0 lần thất bại.

- [ ] **Bước 8: Cam kết**

```powershell
git add frontend/src/component/shared/OperationalPatterns.jsx frontend/src/component/shared/Feedback.jsx frontend/src/component/layout/AppLayout.jsx frontend/src/utils/appNavigation.js frontend/src/styles/app-shell.css frontend/test/operationalPatternsFrontend.test.js frontend/test/appShellFrontend.test.js
git commit -m "feat: add shared operational page patterns"
```

---

### Nhiệm vụ 2: Người theo dõi vay mượn thành viên FE07

**Tệp:**
- Sửa đổi: `frontend/src/page/borrowing/BorrowRequestPage.jsx:1-93`
- Sửa đổi: `frontend/src/page/borrowing/BorrowingHistoryPage.jsx:1-88`
- Sửa đổi: `frontend/test/borrowingFrontend.test.js`

**Giao diện:**
- Tiêu thụ: `DataToolbar`, `DataTable`, `EmptyState`, `ConfirmAction`, `borrowingApi` hiện có và các mẫu chế độ xem FE07 hiện có.
- Tạo ra: việc áp dụng trang hoàn chỉnh đầu tiên và một tài liệu tham khảo cho những lần di chuyển sau này.

- [ ] **Bước 1: Thêm các kiểm thử chấp nhận thành viên FE07 không thành công**

Nối vào `frontend/test/borrowingFrontend.test.js`:

```js
test('FE07 member pages use shared operational patterns without changing API calls', async () => {
  const request = await readFile(new URL('../src/page/borrowing/BorrowRequestPage.jsx', import.meta.url), 'utf8');
  const history = await readFile(new URL('../src/page/borrowing/BorrowingHistoryPage.jsx', import.meta.url), 'utf8');

  assert.match(request, /DataToolbar/);
  assert.match(request, /EmptyState/);
  assert.doesNotMatch(request, /<div className="empty">/);
  assert.match(request, /borrowingApi\.createRequest\(\[Number\(copyId\)\]\)/);

  assert.match(history, /DataToolbar/);
  assert.match(history, /DataTable/);
  assert.match(history, /ConfirmAction/);
  assert.match(history, /const \[renewing, setRenewing\] = useState\(false\)/);
  assert.match(history, /data-label="Hạn trả"/);
  assert.match(history, /await borrowingApi\.renewDetail\(renewRow\.borrowDetailId\)/);
  assert.doesNotMatch(history, /<table className="lib-table"/);
});
```

- [ ] **Bước 2: Xác minh kiểm thử thất bại**

Chạy:

```powershell
node --test frontend/test/borrowingFrontend.test.js
```

Dự kiến: THẤT BẠI khi thiếu các thành phần cấu trúc dùng chung và trạng thái `renewing`.

- [ ] **Bước 3: Di chuyển `BorrowRequestPage`**

Nhập `DataToolbar` và sử dụng nó để tìm kiếm. Thay thế cả hai khối trống tùy chỉnh bằng trạng thái
trống được chia sẻ:

```jsx
<DataToolbar
  primary={(
    <div className="search-input" style={{ width: '100%' }}>
      <Search size={18} />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên sách hoặc tác giả..." aria-label="Tìm sách" />
    </div>
  )}
/>

{results.length === 0 && (
  <EmptyState icon={BookOpen} title="Không tìm thấy sách phù hợp">
    Hãy thử tên sách hoặc tác giả khác.
  </EmptyState>
)}
```

Giữ nguyên `DEMO_BORROW_CATALOG`, `borrowingApi.createRequest`, bản sao của trình trợ giúp đủ điều
kiện và hành vi gửi không thay đổi.

- [ ] **Bước 4: Di chuyển `BorrowingHistoryPage`**

Thêm trạng thái đang chờ xử lý và bảo vệ thao tác ghi hiện có:

```jsx
const [renewing, setRenewing] = useState(false);

async function confirmRenew() {
  if (!renewRow || renewing) return;
  setRenewing(true);
  try {
    const data = await borrowingApi.renewDetail(renewRow.borrowDetailId);
    const detail = data.borrowDetail;
    setRows((current) => current.map((row) => row.borrowDetailId === renewRow.borrowDetailId
      ? { ...row, dueDate: detail.dueDate, renewalsLeft: Math.max(0, 1 - Number(detail.renewalCount || 0)) }
      : row));
    showToast(`Đã gia hạn "${renewRow.title}".`, 'success');
    setRenewRow(null);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setRenewing(false);
  }
}
```

Thay thế các tab/hàng tìm kiếm bằng `DataToolbar` và hiển thị các hàng thông qua:

```jsx
<DataTable
  caption="Borrowing history table"
  headers={['Sách', 'Ngày mượn', 'Hạn trả', 'Ngày trả', 'Trạng thái', { label: 'Thao tác', align: 'right' }]}
  loading={loading}
  isEmpty={pageRows.length === 0}
  emptyState={<EmptyState icon={History} title="Không có bản ghi nào" />}
>
  {pageRows.map((row) => (
    <tr key={row.id} className={row.status === 'Overdue' ? 'row-overdue' : ''}>
      <td data-label="Sách">
        <div className="row-flex">
          <span className="book-spine" style={{ background: 'linear-gradient(135deg,#a87532,#7b5528)' }} />
          <div className="stack-sm">
            <strong>{row.title}</strong>
            <span className="muted" style={{ fontSize: 13 }}>{row.author}</span>
          </div>
        </div>
      </td>
      <td data-label="Ngày mượn">{fmtDate(row.borrowDate)}</td>
      <td data-label="Hạn trả">{fmtDate(row.dueDate)}</td>
      <td data-label="Ngày trả">{fmtDate(row.returnDate)}</td>
      <td data-label="Trạng thái"><Badge status={row.status} /></td>
      <td data-label="Thao tác" style={{ textAlign: 'right' }}>
        {canRenew(row) && (
          <button className="btn btn-outline btn-sm" onClick={() => setRenewRow(row)}>
            <RefreshCw size={14} /> Gia hạn
          </button>
        )}
      </td>
    </tr>
  ))}
</DataTable>
```

Thay thế `RenewModal` bằng `ConfirmAction`, chuyển `pending={renewing}`, `confirmLabel="Xác nhận gia
hạn"` và nội dung sách/ngày đến hạn hiện có.

- [ ] **Bước 5: Chạy kiểm thử FE07**

Chạy:

```powershell
node --test frontend/test/borrowingFrontend.test.js frontend/test/operationalPatternsFrontend.test.js
```

Dự kiến: ĐẠT với 0 lần thất bại.

- [ ] **Bước 6: Cam kết**

```powershell
git add frontend/src/page/borrowing/BorrowRequestPage.jsx frontend/src/page/borrowing/BorrowingHistoryPage.jsx frontend/test/borrowingFrontend.test.js
git commit -m "feat: standardize member borrowing UX"
```

---

### Nhiệm vụ 3: Mô hình mượn nhân viên FE07

**Tệp:**
- Sửa đổi: `frontend/src/page/borrowing/BorrowRequestsAdminPage.jsx:1-88`
- Sửa đổi: `frontend/src/page/borrowing/ProcessReturnsPage.jsx:1-139`
- Sửa đổi: `frontend/src/page/borrowing/MemberBorrowingDetailsPage.jsx:1-98`
- Sửa đổi: `frontend/test/borrowingFrontend.test.js`

**Giao diện:**
- Tiêu thụ: các hợp đồng gốc của Nhiệm vụ 1 và các hợp đồng FE07 API/mô hình xem không thay đổi.
- Tạo: các bảng nhân viên được chia sẻ và các mẫu xác nhận đang chờ xử lý để có kết quả phê duyệt, từ chối, trả sách và tra cứu.

- [ ] **Bước 1: Thêm các kiểm thử chấp nhận nhân viên không thành công**

Nối thêm:

```js
test('FE07 staff pages use shared tables and pending confirmations', async () => {
  const requests = await readFile(new URL('../src/page/borrowing/BorrowRequestsAdminPage.jsx', import.meta.url), 'utf8');
  const returns = await readFile(new URL('../src/page/borrowing/ProcessReturnsPage.jsx', import.meta.url), 'utf8');
  const member = await readFile(new URL('../src/page/borrowing/MemberBorrowingDetailsPage.jsx', import.meta.url), 'utf8');

  assert.match(requests, /DataTable/);
  assert.match(requests, /ConfirmAction/);
  assert.match(requests, /const \[actionPending, setActionPending\] = useState\(false\)/);
  assert.match(requests, /await borrowingApi\.approve\(approveTarget\.requestId\)/);
  assert.match(requests, /await borrowingApi\.reject\(selected\.requestId, rejectReason\.trim\(\)\)/);

  assert.match(returns, /DataToolbar/);
  assert.match(returns, /DataTable/);
  assert.match(returns, /ConfirmAction/);
  assert.match(returns, /const \[returnTarget, setReturnTarget\] = useState\(null\)/);
  assert.match(returns, /returnDetail\(returnTarget\.borrowDetailId, \{ condition \}\)/);

  assert.match(member, /DataToolbar/);
  assert.match(member, /DataTable/);
  assert.doesNotMatch(member, /<table className="lib-table"/);
});
```

- [ ] **Bước 2: Xác minh lỗi**

Chạy `node --test frontend/test/borrowingFrontend.test.js`.

Dự kiến: THẤT BẠI đối với việc nhập cấu trúc bị thiếu và trạng thái đang chờ xử lý.

- [ ] **Bước 3: Di chuyển phê duyệt và từ chối**

Trong `BorrowRequestsAdminPage.jsx`:

```jsx
const [actionPending, setActionPending] = useState(false);

async function handleApprove() {
  if (!approveTarget || actionPending) return;
  setActionPending(true);
  try {
    await borrowingApi.approve(approveTarget.requestId);
    updateStatus(approveTarget.id, 'Approved', `Đã duyệt yêu cầu ${approveTarget.id}.`);
    setApproveTarget(null);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setActionPending(false);
  }
}
```

Áp dụng mẫu bảo vệ/cuối cùng `actionPending` tương tự để từ chối. Thay thế bảng yêu cầu bằng
`DataTable`, giữ nguyên lựa chọn hàng bàn phím và thêm `data-label` vào mọi ô. Thay thế cả hai hộp
thoại bằng `ConfirmAction`; từ chối giữ vùng văn bản của nó bên trong hộp thoại và sử dụng
`confirmDisabled={!rejectReason.trim()}`.

- [ ] **Bước 4: Thêm xác nhận trả sách**

Trong `ProcessReturnsPage.jsx`:

```jsx
const [returnTarget, setReturnTarget] = useState(null);
const [returning, setReturning] = useState(false);

async function confirmReturn() {
  if (!returnTarget || returning) return;
  setReturning(true);
  try {
    const result = await borrowingApi.returnDetail(returnTarget.borrowDetailId, { condition });
    const remainingLoans = loans.filter((loan) => loan.id !== returnTarget.id);
    setLoans(remainingLoans);
    setSelectedId(remainingLoans[0]?.id || null);
    setCondition('NORMAL');
    setReturnTarget(null);
    showToast(
      result.fineCandidate?.needsFineReview
        ? `Đã ghi nhận trả "${returnTarget.book}". Có dữ liệu cần FE09 xem xét phí phạt.`
        : `Đã ghi nhận trả "${returnTarget.book}".`,
      'success',
    );
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setReturning(false);
  }
}
```

Nút bảng điều khiển đặt `returnTarget` thay vì gọi trực tiếp API. Thêm `ConfirmAction` với thành
viên, sách, tình trạng, ngày đến hạn và cảnh báo đánh giá tốt đã chọn. Di chuyển tìm kiếm sang
`DataToolbar` và cho mượn sang `DataTable`.

- [ ] **Bước 5: Di chuyển bảng tra cứu thành viên**

Sử dụng `DataToolbar` cho trường ID thành viên và nút tải. Viết lại `PendingTable` và `LoanTable` để
trả sách `DataTable` bên trong `.lib-card` hiện có của chúng, giữ nguyên chú thích, lớp hàng, ngày
tháng, huy hiệu trạng thái và bản sao trạng thái trống. Thêm `data-label` vào tất cả các ô.

- [ ] **Bước 6: Chạy kiểm thử FE07**

Chạy:

```powershell
node --test frontend/test/borrowingFrontend.test.js frontend/test/operationalPatternsFrontend.test.js
```

Dự kiến: ĐẠT với 0 lần thất bại và xác nhận API không thay đổi.

- [ ] **Bước 7: Cam kết**

```powershell
git add frontend/src/page/borrowing/BorrowRequestsAdminPage.jsx frontend/src/page/borrowing/ProcessReturnsPage.jsx frontend/src/page/borrowing/MemberBorrowingDetailsPage.jsx frontend/test/borrowingFrontend.test.js
git commit -m "feat: standardize staff borrowing UX"
```

---

### Nhiệm vụ 4: Mẫu đặt chỗ FE08

**Tệp:**
- Sửa đổi: `frontend/src/page/reservation/MyReservationsPage.jsx:1-170`
- Sửa đổi: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx:1-178`
- Sửa đổi: `frontend/test/reservationFrontend.test.js`

**Giao diện:**
- Tiêu thụ: Nguyên tắc nhiệm vụ 1 và người trợ giúp đặt chỗ API/trạng thái xem hiện có.
- Tạo ra: bảng đặt chỗ chung, thanh công cụ, xác nhận hủy/thông báo và dự phòng demo được dán nhãn rõ ràng.

- [ ] **Bước 1: Thêm kiểm thử áp dụng FE08 không thành công**

Nối thêm:

```js
test('FE08 pages adopt shared operational patterns and preserve demo fallback boundaries', async () => {
  const mine = await readFile(new URL('../src/page/reservation/MyReservationsPage.jsx', import.meta.url), 'utf8');
  const staff = await readFile(new URL('../src/page/reservation/ReservationsLibrarianPage.jsx', import.meta.url), 'utf8');

  for (const source of [mine, staff]) {
    assert.match(source, /DataToolbar/);
    assert.match(source, /DataTable/);
    assert.match(source, /ConfirmAction/);
  }
  assert.match(mine, /setReservations\(DEMO_MY_RESERVATIONS\)/);
  assert.match(staff, /setRows\(DEMO_ALL_RESERVATIONS\)/);
  assert.match(mine, /pending=\{cancelling\}/);
  assert.match(staff, /pending=\{notifying\}/);
  assert.doesNotMatch(mine, /<table className="lib-table"/);
  assert.doesNotMatch(staff, /<table className="lib-table"/);
});
```

- [ ] **Bước 2: Xác minh lỗi**

Chạy `node --test frontend/test/reservationFrontend.test.js`.

Dự kiến: THẤT BẠI đối với các xác nhận thành phần được chia sẻ và trạng thái đang chờ xử lý.

- [ ] **Bước 3: Di chuyển đặt chỗ của thành viên**

- Gói tìm kiếm sách có thể đặt chỗ trong `DataToolbar`.
- Hiển thị các hàng đặt chỗ với thuộc tính `DataTable` và `data-label`.
- Giữ `DEMO_RESERVABLE`, `DEMO_MY_RESERVATIONS`, `reservationApi.create`, `listMine` và `cancel` không thay đổi.
- Thêm `const [cancelling, setCancelling] = useState(false)` và bảo vệ `confirmCancel` bằng thử/cuối cùng.
- Thay thế `Modal` hủy bằng `ConfirmAction pending={cancelling}`.
- Hiển thị thông báo cảnh báo khi `isDemo` là đúng; thay đổi bản sao thành công từ từ ngữ điểm cuối sang `Dữ liệu đặt chỗ đã được cập nhật.`

- [ ] **Bước 4: Di chuyển đặt chỗ của nhân viên**

- Sử dụng `DataToolbar` để tìm kiếm, lọc sách, lọc trạng thái và tóm tắt phân trang.
- Sử dụng `DataTable` để xem danh sách.
- Thêm trạng thái `notifying` xung quanh `reservationApi.process` và thay thế thông báo `Modal` bằng `ConfirmAction`.
- Giữ nguyên `runHoldExpirationWorkflow`, dự phòng demo, sắp xếp hàng đợi và vô hiệu hóa các hành động chỉ dành cho máy chủ.
- Giữ chế độ xem hàng đợi dưới dạng danh sách nhưng sử dụng `EmptyState` được chia sẻ và bản sao cảnh báo hướng đến người dùng.

- [ ] **Bước 5: Chạy kiểm thử FE08**

Chạy:

```powershell
node --test frontend/test/reservationFrontend.test.js frontend/test/operationalPatternsFrontend.test.js
```

Dự kiến: ĐẠT với 0 lần thất bại.

- [ ] **Bước 6: Cam kết**

```powershell
git add frontend/src/page/reservation/MyReservationsPage.jsx frontend/src/page/reservation/ReservationsLibrarianPage.jsx frontend/test/reservationFrontend.test.js
git commit -m "feat: standardize reservation UX"
```

---

### Nhiệm vụ 5: Di chuyển chỉ trình bày khoảng không quảng cáo FE06

**Tệp:**
- Tạo: `frontend/test/inventoryOperationalFrontend.test.js`
- Sửa đổi: `frontend/src/page/InventoryPage.jsx:1-42`
- Sửa đổi: `frontend/src/component/inventory/InventoryManagement.jsx:1-176`
- Sửa đổi: `frontend/src/component/inventory/Filter.jsx:1-54`
- Sửa đổi: `frontend/src/component/inventory/EditBookModal.jsx:1-181`
- Sửa đổi: `frontend/src/component/inventory/BookCopies.jsx:1-169`
- Sửa đổi: `frontend/src/component/inventory/StatusBadge.jsx:1-31`

**Giao diện:**
- Tiêu thụ: các nguyên tắc hoạt động được chia sẻ và các phương thức `MOCK_BOOKS`, `MOCK_COPIES` hiện tại cũng như hàng tồn kho API đã có trong `BookCopies`.
- Tạo ra: một trang vỏ ứng dụng với bản trình bày được chia sẻ trong khi vẫn duy trì ranh giới nguyên mẫu.

- [ ] **Bước 1: Viết các kiểm thử ranh giới FE06 không thành công**

Tạo:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('FE06 inventory keeps mock ownership while adopting shared patterns', async () => {
  const management = await readFile(new URL('../src/component/inventory/InventoryManagement.jsx', import.meta.url), 'utf8');
  const filter = await readFile(new URL('../src/component/inventory/Filter.jsx', import.meta.url), 'utf8');

  assert.match(management, /MOCK_BOOKS/);
  assert.match(management, /MOCK_COPIES/);
  assert.doesNotMatch(management, /inventoryApi\.list/);
  assert.match(management, /StatusNotice/);
  assert.match(management, /DataTable/);
  assert.match(management, /Toast/);
  assert.doesNotMatch(management, /<h5/);
  assert.match(filter, /DataToolbar/);
});

test('FE06 dialogs and badges use shared presentation without changing API methods', async () => {
  const edit = await readFile(new URL('../src/component/inventory/EditBookModal.jsx', import.meta.url), 'utf8');
  const copies = await readFile(new URL('../src/component/inventory/BookCopies.jsx', import.meta.url), 'utf8');
  const badge = await readFile(new URL('../src/component/inventory/StatusBadge.jsx', import.meta.url), 'utf8');

  assert.match(edit, /import \{ Modal \}/);
  assert.match(copies, /DataTable/);
  assert.match(copies, /ConfirmAction/);
  assert.match(copies, /inventoryApi\.createCopy/);
  assert.match(copies, /inventoryApi\.updateStatus/);
  assert.match(copies, /inventoryApi\.deactivate/);
  assert.match(badge, /import \{ Badge \}/);
});
```

- [ ] **Bước 2: Xác minh lỗi**

Chạy `node --test frontend/test/inventoryOperationalFrontend.test.js`.

Dự kiến: THẤT BẠI vì FE06 vẫn sử dụng bản trình bày trùng lặp/tùy chỉnh.

- [ ] **Bước 3: Bình thường hóa trạng thái tồn kho và bộ lọc**

Trong `InventoryManagement.jsx`:

```jsx
const EMPTY_FILTER = { title: '', author: '', fromYear: '', toYear: '' };
const [toast, showToast, clearToast] = useToast();

<StatusNotice type="warning" title="Dữ liệu trình diễn">
  Màn hình này vẫn dùng dữ liệu mẫu cho đến khi kế hoạch FE06 được phê duyệt.
</StatusNotice>
<Filter filters={filter} onChange={setFilter} onReset={() => setFilter(EMPTY_FILTER)} />
```

Loại bỏ tiêu đề trang bên trong và phần đệm trang bên ngoài. Tiếp tục lọc `books` nhưng sử dụng
`fromYear` và `toYear` một cách nhất quán. Thay thế bảng tùy chỉnh bằng `DataTable`, thêm nhãn ô,
duy trì hành vi nhấp chuột/chỉnh sửa hàng và chuyển `showToast` cộng với chức năng làm mới không
đồng bộ không hoạt động cho `BookCopies` mà không giới thiệu `inventoryApi.list`.

Trong `Filter.jsx`, nhập `DataToolbar` và sử dụng khối trả về này. Tắt đặt lại khi mọi giá trị bộ
lọc đều trống.

```jsx
const hasFilters = Object.values(filters).some((value) => String(value).trim());

return (
  <div className="lib-card" style={{ marginBottom: 18 }}>
    <DataToolbar
      primary={(
        <div className="search-input">
          <SearchIcon fontSize="small" />
          <input value={filters.title} onChange={(event) => update('title', event.target.value)} placeholder="Tên đầu sách" aria-label="Lọc theo tên đầu sách" />
        </div>
      )}
      filters={(
        <>
          <input className="input" value={filters.author} onChange={(event) => update('author', event.target.value)} placeholder="Tác giả" aria-label="Lọc theo tác giả" />
          <input className="input" type="number" value={filters.fromYear} onChange={(event) => update('fromYear', event.target.value)} placeholder="Từ năm" aria-label="Lọc từ năm xuất bản" />
          <input className="input" type="number" value={filters.toYear} onChange={(event) => update('toYear', event.target.value)} placeholder="Đến năm" aria-label="Lọc đến năm xuất bản" />
        </>
      )}
      actions={(
        <button type="button" className="btn btn-outline" onClick={onReset} disabled={!hasFilters}>
          <RestartAltIcon fontSize="small" /> Đặt lại
        </button>
      )}
    />
  </div>
);
```

- [ ] **Bước 4: Sử dụng lại cách trình bày phương thức và huy hiệu**

Viết lại kết quả trả về của `EditBookModal` với `Modal` được chia sẻ trong khi vẫn giữ nguyên
`form`, `errors`, `validate` và `handleSave`:

```jsx
return (
  <Modal
    title="Chỉnh sửa thông tin đầu sách"
    onClose={onClose}
    width={580}
    actions={(
      <>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          <SaveIcon fontSize="small" /> Lưu thay đổi
        </button>
      </>
    )}
  >
    <div className="form-grid cols-2">
      {[
        ['title', 'Tên đầu sách', 'text'],
        ['author', 'Tác giả', 'text'],
        ['genre', 'Thể loại', 'text'],
        ['isbn', 'ISBN', 'text'],
        ['publishYear', 'Năm xuất bản', 'number'],
        ['publisher', 'Nhà xuất bản', 'text'],
      ].map(([field, label, type]) => (
        <div className="field" key={field}>
          <label htmlFor={`inventory-${field}`}>{label}</label>
          <input
            id={`inventory-${field}`}
            className="input"
            type={type}
            value={form[field]}
            onChange={handle(field)}
          />
          {errors[field] && <span className="field-error">{errors[field]}</span>}
        </div>
      ))}
      <div className="field" style={{ gridColumn: '1 / -1' }}>
        <label htmlFor="inventory-description">Mô tả</label>
        <textarea id="inventory-description" className="textarea" value={form.description} onChange={handle('description')} rows={3} />
      </div>
    </div>
  </Modal>
);
```

Viết lại `StatusBadge` bằng `Badge` được chia sẻ:

```jsx
import { Badge } from '../shared/Feedback';

const STATUS_CONFIG = {
  AVAILABLE: { tone: 'available', label: 'Có sẵn' },
  BORROWED: { tone: 'borrowed', label: 'Đang mượn' },
  RESERVED: { tone: 'info', label: 'Đã đặt trước' },
  DAMAGED: { tone: 'pending', label: 'Hư hỏng' },
  LOST: { tone: 'overdue', label: 'Thất lạc' },
  INACTIVE: { tone: 'inactive', label: 'Ngừng lưu hành' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { tone: 'default', label: status };
  return <Badge status={config.tone}>{config.label}</Badge>;
}
```

- [ ] **Bước 5: Di chuyển phần trình bày bản sao sách**

- Soạn nội dung phương thức hiện có thông qua `Modal` được chia sẻ.
- Kết xuất các hàng sao chép bằng `DataTable`, giữ lại mọi lệnh gọi `inventoryApi` và bộ bảo vệ `saving` hiện có.
- Thêm trạng thái `deactivateTarget`; nút **Ngừng hoạt động** mở `ConfirmAction` và trình xử lý xác nhận gọi hàm `deactivate(copy)` hiện có.
- Sử dụng `DataToolbar` cho các điều khiển thêm bản sao và chia sẻ `EmptyState` khi không có bản sao nào tồn tại.
- Không thêm tải danh sách hoặc quyền sở hữu API mới vào `InventoryManagement`.

- [ ] **Bước 6: Chạy FE06 và chia sẻ các kiểm thử**

Chạy:

```powershell
node --test frontend/test/inventoryOperationalFrontend.test.js frontend/test/operationalPatternsFrontend.test.js
```

Dự kiến: ĐẠT với 0 lần thất bại.

- [ ] **Bước 7: Cam kết**

```powershell
git add frontend/src/page/InventoryPage.jsx frontend/src/component/inventory/InventoryManagement.jsx frontend/src/component/inventory/Filter.jsx frontend/src/component/inventory/EditBookModal.jsx frontend/src/component/inventory/BookCopies.jsx frontend/src/component/inventory/StatusBadge.jsx frontend/test/inventoryOperationalFrontend.test.js
git commit -m "feat: align inventory presentation patterns"
```

---

### Nhiệm vụ 6: Di chuyển lớp bao chia sẻ FE09

**Tệp:**
- Tạo: `frontend/src/styles/fine-management.css`
- Tạo: `frontend/test/fineOperationalFrontend.test.js`
- Sửa đổi: `frontend/src/page/FineManagement.jsx:1-1368`

**Giao diện:**
- Tiêu thụ: `AppLayout`, `StatusNotice`, `BookManagement` hiện có, trạng thái quy trình làm việc tốt cục bộ và các trình trợ giúp localStorage hiện có.
- Tạo ra: FE09 bên trong lớp bao được chia sẻ với các tab trang cục bộ và CSS bên ngoài; chưa có thay đổi hành vi quy trình làm việc tốt nào.

- [ ] **Bước 1: Viết kiểm thử ranh giới lớp bao thất bại**

Tạo:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('FE09 uses AppLayout while retaining prototype data ownership', async () => {
  const source = await readFile(new URL('../src/page/FineManagement.jsx', import.meta.url), 'utf8');

  assert.match(source, /import AppLayout from '\.\.\/component\/layout\/AppLayout';/);
  assert.match(source, /import '\.\.\/styles\/fine-management\.css';/);
  assert.match(source, /getFineRecords/);
  assert.match(source, /saveFineRecords/);
  assert.match(source, /FINE_RECORDS_KEY/);
  assert.match(source, /<BookManagement \/>/);
  assert.match(source, /<AppLayout/);
  assert.doesNotMatch(source, /className="fine-shell"/);
  assert.doesNotMatch(source, /className="fine-sidebar"/);
  assert.doesNotMatch(source, /<style>\{`/);
  assert.doesNotMatch(source, /function handleLogout\(/);
});
```

- [ ] **Bước 2: Xác minh lỗi**

Chạy `node --test frontend/test/fineOperationalFrontend.test.js`.

Dự kiến: THẤT BẠI trên các xác nhận lớp bao được chia sẻ và biểu định kiểu bên ngoài.

- [ ] **Bước 3: Thay thế vỏ ứng dụng trùng lặp**

Xóa `useNavigate`, `Home`, `LogOut`, đánh dấu điều hướng ứng dụng trùng lặp, đánh dấu phiên và
`handleLogout`. Giữ `workspace`, `BookManagement`, `activeSection` và tất cả các trình xử lý quy
trình công việc.

Sử dụng cấu trúc cấp cao nhất này:

```jsx
return (
  <AppLayout
    title={workspace === 'books' ? 'Quản lý sách' : activeMeta.label}
    subtitle={workspace === 'books' ? 'Theo dõi thông tin đầu sách hiện có.' : activeMeta.description}
  >
    <StatusNotice type="warning" title="Dữ liệu trình diễn">
      Giao diện tiền phạt vẫn dùng dữ liệu mẫu và localStorage cho đến khi FE09-T012 được triển khai.
    </StatusNotice>

    <div className="tabs" aria-label="Không gian nghiệp vụ">
      <button type="button" className={`tab${workspace === 'books' ? ' active' : ''}`} onClick={() => setWorkspace('books')}>
        <BookOpen size={14} /> Quản lý sách
      </button>
      <button type="button" className={`tab${workspace === 'fines' ? ' active' : ''}`} onClick={() => setWorkspace('fines')}>
        <ReceiptText size={14} /> Quản lý tiền phạt
      </button>
    </div>

    {workspace === 'books' ? <BookManagement /> : (
      <>
        <div className="tabs" aria-label="Nghiệp vụ tiền phạt">
          {fineSections.map(({ key, label, icon: Icon }) => (
            <button type="button" key={key} className={`tab${activeSection === key ? ' active' : ''}`} onClick={() => setActiveSection(key)}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
        <section className="fine-stats">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`fine-stat ${item.tone}`}>
                <div><Icon size={20} /></div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            );
          })}
        </section>
        {activeSection === 'list' && listSection}
        {activeSection === 'calculate' && calculateSection}
        {activeSection === 'collection' && collectionSection}
        {activeSection === 'paid' && paidSection}
      </>
    )}
    {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
  </AppLayout>
);
```

Trước khi quay trở lại, hãy di chuyển từng khối `activeSection` JSX hiện tại không thay đổi vào bốn
hằng số cục bộ `listSection`, `calculateSection`, `collectionSection` và `paidSection`. Đây chỉ là
trích xuất cơ học: mỗi hằng số chứa phần tử phần hiện tại và tiếp tục tham chiếu cùng trạng thái và
trình xử lý.

- [ ] **Bước 4: Trích xuất kiểu FE09**

Di chuyển các khai báo `.fine-*` không có lớp bao hiện có từ khối kiểu nội tuyến sang
`frontend/src/styles/fine-management.css`. Xóa các bộ chọn chỉ có lớp bao cho `.fine-shell`,
`.fine-sidebar`, `.fine-brand*`, `.fine-app-nav`, `.fine-workflow-nav`, `.fine-session`,
`.fine-main` và các phần ghi đè phản hồi của chúng. Giữ nguyên các khai báo biểu mẫu, số liệu thống
kê, bảng điều khiển, chi tiết, chuyển giao, bảng, trống và phản hồi cho đến Nhiệm vụ 7.

Nhập biểu định kiểu một lần từ `FineManagement.jsx`:

```js
import '../styles/fine-management.css';
```

- [ ] **Bước 5: Chạy kiểm thử lớp bao FE09**

Chạy `node --test frontend/test/fineOperationalFrontend.test.js`.

Dự kiến: ĐẠT với 0 lần thất bại.

- [ ] **Bước 6: Cam kết**

```powershell
git add frontend/src/page/FineManagement.jsx frontend/src/styles/fine-management.css frontend/test/fineOperationalFrontend.test.js
git commit -m "feat: move fine management into app shell"
```

---

### Nhiệm vụ 7: Mẫu quy trình làm việc được chia sẻ FE09

**Tệp:**
- Sửa đổi: `frontend/src/page/FineManagement.jsx`
- Sửa đổi: `frontend/src/styles/fine-management.css`
- Sửa đổi: `frontend/test/fineOperationalFrontend.test.js`

**Giao diện:**
- Tiêu thụ: lớp bao Nhiệm vụ 6 và tất cả trình xử lý/trợ giúp dữ liệu cục bộ FE09 hiện có.
- Tạo ra: thanh công cụ dùng chung, bảng, trạng thái trống, thông báo và xác nhận trong khi vẫn duy trì hành vi localStorage/dữ liệu mẫu.

- [ ] **Bước 1: Thêm hợp đồng quy trình làm việc không thành công**

Nối thêm:

```js
test('FE09 reuses shared workflow components without API alignment', async () => {
  const source = await readFile(new URL('../src/page/FineManagement.jsx', import.meta.url), 'utf8');

  assert.match(source, /DataToolbar/);
  assert.match(source, /DataTable/);
  assert.match(source, /ConfirmAction/);
  assert.match(source, /EmptyState/);
  assert.match(source, /Toast/);
  assert.doesNotMatch(source, /function Toast\(/);
  assert.doesNotMatch(source, /function EmptyState\(/);
  assert.doesNotMatch(source, /<table className="fine-table"/);
  assert.doesNotMatch(source, /authorizedRequest|fineApi/);
  assert.match(source, /DAILY_FINE_RATE/);
  assert.match(source, /saveFineRecords\(fines\)/);
});
```

- [ ] **Bước 2: Xác minh lỗi**

Chạy `node --test frontend/test/fineOperationalFrontend.test.js`.

Dự kiến: THẤT BẠI đối với các thành phần chia sẻ trùng lặp và bị thiếu.

- [ ] **Bước 3: Xóa các thành phần phản hồi trùng lặp và dịch bản sao xác thực**

Nhập chia sẻ `Badge`, `ConfirmAction`, `EmptyState`, `StatusNotice`, `Toast` và cấu trúc
`DataTable`, `DataToolbar`. Xóa các chức năng `Toast` và `EmptyState` cục bộ. Chỉ giữ `StatusBadge`
dưới dạng một bộ chuyển đổi nhỏ trên `Badge` được chia sẻ.

Thay thế chuỗi xác thực bằng chuỗi tương đương chính xác bằng tiếng Việt:

```js
errors[field] = 'Trường này là bắt buộc.';
errors.email = 'Email không đúng định dạng.';
errors[field] = 'Giá trị phải là số nguyên dương.';
errors.overdueDays = 'Số ngày quá hạn phải là số nguyên dương.';
errors.amount = 'Số tiền phải lớn hơn 0.';
errors.status = 'Trạng thái không hợp lệ.';
```

- [ ] **Bước 4: Di chuyển thanh công cụ và bảng danh sách mịn**

Sử dụng `DataToolbar` cho truy vấn, bộ lọc trạng thái, Mới và Xóa. Sử dụng `DataTable` với các tiêu
đề `Phiếu phạt`, `Thành viên`, `Sách`, `Quá hạn`, `Số tiền` và `Trạng thái`; duy trì lựa chọn hàng
và thêm nhãn di động.

sử dụng:

```jsx
emptyState={(
  <EmptyState
    icon={ReceiptText}
    title="Không có phiếu phạt phù hợp"
    action={(query || statusFilter !== 'ALL') ? (
      <button type="button" className="btn btn-outline" onClick={() => { setQuery(''); setStatusFilter('ALL'); }}>
        Xóa bộ lọc
      </button>
    ) : null}
  />
)}
```

Giữ nguyên thứ tự, lọc, hành vi tốt đã chọn, biểu mẫu cục bộ và `saveFineRecords` không thay đổi.

- [ ] **Bước 5: Thêm xác nhận hành động do hậu quả**

Thêm trạng thái `confirmTarget`:

```jsx
const [confirmTarget, setConfirmTarget] = useState(null);
```

Sử dụng các giá trị `{ type: 'delete', fine }`, `{ type: 'collect', fine }` và `{ type: 'đã thanh
toán', khoản phạt
}`. Các nút/biểu mẫu đặt mục tiêu; xác nhận được chia sẻ sẽ gọi trình xử lý đồng bộ hiện có. Chỉ xóa
mục tiêu sau khi trình xử lý hoàn thành.

Đưa ra một xác nhận:

```jsx
{confirmTarget && (
  <ConfirmAction
    title={confirmTarget.type === 'delete' ? 'Xóa phiếu phạt' : confirmTarget.type === 'collect' ? 'Ghi nhận thu tiền' : 'Đánh dấu đã thanh toán'}
    tone={confirmTarget.type === 'delete' ? 'danger' : 'primary'}
    confirmLabel={confirmTarget.type === 'delete' ? 'Xóa phiếu' : 'Xác nhận'}
    onCancel={() => setConfirmTarget(null)}
    onConfirm={() => {
      if (confirmTarget.type === 'delete') handleDeleteFine();
      if (confirmTarget.type === 'collect') recordCollection();
      if (confirmTarget.type === 'paid') handleMarkPaid();
      setConfirmTarget(null);
    }}
  >
    <p>Kiểm tra lại phiếu phạt và số tiền trước khi tiếp tục.</p>
  </ConfirmAction>
)}
```

Tái cấu trúc `handleRecordCollection(event)` thành `recordCollection()` bằng cách chỉ xóa
`event.preventDefault()`. Việc gửi biểu mẫu ngăn chặn mặc định và đặt mục tiêu xác nhận thu thập.
Không thay đổi cách tính, xác thực chuyển khoản hoặc cập nhật trạng thái cục bộ.

- [ ] **Bước 6: Xóa các kiểu trình bày FE09 lỗi thời**

Xóa các khai báo `.fine-toolbar`, `.fine-search`, `.fine-select`, `.fine-table*`, `.fine-empty` và
`.fine-toast*` sau khi đánh dấu của chúng không còn nữa. Giữ các kiểu biểu mẫu/bảng điều khiển/chi
tiết/chuyển giao theo yêu cầu của quy trình làm việc cục bộ còn lại.

- [ ] **Bước 7: Chạy kiểm thử FE09**

Chạy:

```powershell
node --test frontend/test/fineOperationalFrontend.test.js frontend/test/operationalPatternsFrontend.test.js
```

Dự kiến: ĐẠT với 0 lỗi và xác nhận ranh giới nguyên mẫu còn nguyên vẹn.

- [ ] **Bước 8: Cam kết**

```powershell
git add frontend/src/page/FineManagement.jsx frontend/src/styles/fine-management.css frontend/test/fineOperationalFrontend.test.js
git commit -m "feat: standardize fine workflow presentation"
```

---

### Nhiệm vụ 8: Mẫu báo cáo FE12

**Tệp:**
- Tạo: `frontend/test/reportOperationalFrontend.test.js`
- Sửa đổi: `frontend/src/page/report/BorrowingReportPage.jsx:1-133`
- Sửa đổi: `frontend/src/page/report/InventoryReportPage.jsx:1-184`
- Sửa đổi: `frontend/src/page/report/UserStatisticsPage.jsx:1-136`

**Giao diện:**
- Tiêu thụ: Nguyên hàm của Nhiệm vụ 1, API báo cáo hiện có, trình tạo bộ lọc, bảo vệ, biểu đồ và mô hình xem.
- Tạo ra: các bộ lọc/bảng báo cáo được chia sẻ và các thông báo hướng đến kết quả mà không thay đổi giá trị báo cáo.

- [ ] **Bước 1: Viết báo cáo kiểm tra việc áp dụng không thành công**

Tạo:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const reportPages = [
  '../src/page/report/BorrowingReportPage.jsx',
  '../src/page/report/InventoryReportPage.jsx',
  '../src/page/report/UserStatisticsPage.jsx',
];

test('FE12 reports use shared toolbar and table patterns', async () => {
  for (const path of reportPages) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.match(source, /DataToolbar/);
    assert.match(source, /DataTable/);
    assert.doesNotMatch(source, /<table className="lib-table"/);
    assert.doesNotMatch(source, /Đã kết nối backend thật qua GET/);
  }
});

test('FE12 report API and filter contracts remain unchanged', async () => {
  const borrowing = await readFile(new URL(reportPages[0], import.meta.url), 'utf8');
  const inventory = await readFile(new URL(reportPages[1], import.meta.url), 'utf8');
  const users = await readFile(new URL(reportPages[2], import.meta.url), 'utf8');

  assert.match(borrowing, /reportApi\.borrowing\(buildDateRangeReportParams\(from, to\)\)/);
  assert.match(inventory, /reportApi\.inventory\(buildInventoryReportParams\(selectedCategoryId\)\)/);
  assert.match(users, /reportApi\.users\(buildDateRangeReportParams\(from, to\)\)/);
});
```

- [ ] **Bước 2: Xác minh lỗi**

Chạy:

```powershell
node --test frontend/test/reportOperationalFrontend.test.js frontend/test/reportFilters.test.js frontend/test/reportAccess.test.js
```

Dự kiến: THẤT BẠI đối với các xác nhận mẫu được chia sẻ và bản sao điểm cuối; các kiểm thử bộ
lọc/quyền truy cập hiện tại vẫn vượt qua.

- [ ] **Bước 3: Di chuyển thanh công cụ báo cáo**

- Báo cáo mượn/người dùng: đặt đầu vào ngày và Áp dụng theo `DataToolbar filters`; giữ hành động tải lại hiện có trong `AppLayout`.
- Inventory báo cáo: place category select under `filters`, Lọc và icon đặt lại under `actions`.
- Giữ nguyên tất cả các giá trị đầu vào, trình xử lý gửi, trạng thái bị tắt và trình tạo tham số.

Đặt thông báo tải thành công thành:

```js
setNotice('Dữ liệu báo cáo đã được cập nhật.');
```

- [ ] **Bước 4: Di chuyển bảng báo cáo**

Thay thế các bảng top-books, low-inventory và role/membership bằng `DataTable`. Thêm thuộc tính
`data-label` phù hợp với tiêu đề tiếng Việt hiển thị. Giữ nguyên các khóa hàng, giá trị, huy hiệu,
loại hàng sắp hết hàng và bản sao trạng thái trống.

- [ ] **Bước 5: Chạy kiểm thử báo cáo**

Chạy:

```powershell
node --test frontend/test/reportOperationalFrontend.test.js frontend/test/reportFilters.test.js frontend/test/reportAccess.test.js frontend/test/operationalPatternsFrontend.test.js
```

Dự kiến: ĐẠT với 0 lần thất bại.

- [ ] **Bước 6: Cam kết**

```powershell
git add frontend/src/page/report/BorrowingReportPage.jsx frontend/src/page/report/InventoryReportPage.jsx frontend/src/page/report/UserStatisticsPage.jsx frontend/test/reportOperationalFrontend.test.js
git commit -m "feat: standardize report presentation patterns"
```

---

### Nhiệm vụ 9: Cổng xác thực và đánh giá con người lát 3

**Tệp:**
- Tạo: `.sdd/reviews/library-ux-slice3-validation-review-2026-07-15.md`
- Chỉ sửa đổi nếu bằng chứng yêu cầu chỉnh sửa: các tập tin đã thay đổi trong Nhiệm vụ 1-8

**Giao diện:**
- Tiêu thụ: tất cả các cam kết phần việc 3 đã hoàn thành.
- Tạo ra: bằng chứng tự động và một danh sách kiểm tra có giới hạn để Nhật đánh giá con người; không có yêu cầu hợp nhất.

- [ ] **Bước 1: Chạy các hợp đồng giao diện người dùng tập trung**

Chạy:

```powershell
npm.cmd --prefix frontend test
```

Dự kiến: tất cả các kiểm thử Nút giao diện người dùng ĐẠT với 0 lần thất bại.

- [ ] **Bước 2: Chạy công cụ tìm lỗi mã nguồn và bản dựng sản xuất**

Chạy:

```powershell
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Dự kiến: cả hai lệnh đều thoát `0`; cảnh báo kích thước khối Vite không bị lỗi có thể được ghi lại
nhưng không chặn việc đánh giá.

- [ ] **Bước 3: Xác minh phạm vi và khoảng trắng**

Chạy:

```powershell
git diff main...HEAD --check
git diff main...HEAD --name-only
rg -n "Đã kết nối backend thật qua GET|function Toast\(|function EmptyState\(|className=\"fine-shell\"|<table className=\"lib-table\"" frontend/src/page/borrowing frontend/src/page/reservation frontend/src/component/inventory frontend/src/page/FineManagement.jsx frontend/src/page/report
```

Dự kiến:

- `git diff --check` thoát khỏi `0`.
- Các tệp đã thay đổi được giới hạn ở các tài liệu đã được phê duyệt, các mẫu/kiểu/kiểm tra giao diện người dùng được chia sẻ và các trang hoạt động mục tiêu.
- Quá trình quét nguồn không trả về bản sao thành công theo định hướng điểm cuối, các thành phần/vỏ phản hồi trùng lặp FE09 hoặc các bảng kế thừa thô trong các trang đã di chuyển.

- [ ] **Bước 4: Xác minh hợp đồng được bảo vệ không thay đổi**

Chạy:

```powershell
git diff main...HEAD -- frontend/src/api frontend/src/utils/borrowingAccess.js frontend/src/utils/reportAccess.js backend database
```

Dự kiến: không có khác biệt. Nếu bất kỳ kết quả đầu ra nào xuất hiện, hãy dừng và xóa thay đổi ngoài
phạm vi trước khi tiếp tục.

- [ ] **Bước 5: Viết hồ sơ xác nhận**

Tạo `.sdd/reviews/library-ux-slice3-validation-review-2026-07-15.md`:

```markdown
# Rà soát xác nhận lát cắt trải nghiệm thư viện 3 - 2026-07-15

Trạng thái: SẴN SÀNG ĐỂ CON NGƯỜI RÀ SOÁT

Nhánh: `docs/ux-slice3-operational-patterns`

## Phạm vi

Ghi lại bằng chứng tự động về các mô hình hoạt động được chia sẻ và ứng dụng theo thứ tự của chúng vào FE07, FE08, FE06, FE09 và FE12. Bản ghi này không yêu cầu sự chấp nhận của con người, hợp nhất, hoàn thành FE06 hoặc hoàn thành FE09-T012.

## Bằng chứng tự động

|Kiểm tra|kết quả|
| --- | --- |
|Kiểm tra giao diện người dùng|ĐẠT - tất cả các kiểm thử, 0 thất bại|
|kiểm tra mã giao diện người dùng|ĐẠT|
|Xây dựng sản xuất Frontend|ĐẠT|
|Khoảng trắng khác biệt|ĐẠT|
|API/phạm vi cơ sở dữ liệu/máy chủ|ĐẠT - không có thay đổi|
|Ranh giới FE06|PASS - quyền sở hữu mô phỏng/trong bộ nhớ được giữ lại|
|Ranh giới FE09|PASS - localStorage/dữ liệu mẫu được giữ lại; FE09-T012 mở|

## Danh sách rà soát của con người

- Vay: tải, lỗi, trống, lọc, phê duyệt, từ chối, gia hạn và xác nhận trả sách.
- Đặt chỗ: cảnh báo dự phòng demo, hủy bỏ, danh sách nhân viên, xếp hàng và xác nhận thông báo.
- Khoảng không quảng cáo: tiêu đề một trang, bộ lọc, kết quả trống, hộp thoại chỉnh sửa, bảng sao chép và cảnh báo nguyên mẫu.
- khoản phạt: lớp bao được chia sẻ, tab cục bộ, bộ lọc danh sách, xác nhận, bánh mì nướng và không mất quyền truy cập quản lý sách được nhúng.
- Báo cáo: bộ lọc ngày/danh mục, kết quả bằng 0, giá trị, biểu đồ và khả năng đọc bảng.
- Thiết bị di động: các hàng được gắn nhãn vẫn có thể hiểu được ở 390px mà không có sự chồng chéo không mạch lạc.

## Rủi ro còn lại

- FE06 vẫn là nguyên mẫu cho đến khi kế hoạch/nhiệm vụ chức năng của nó được phê duyệt.
- FE09 vẫn giữ nguyên giao diện người dùng dữ liệu cục bộ cho đến khi FE09-T012 được triển khai.
- Khả năng đáp ứng đầy đủ và chấp nhận bàn phím vẫn là phần việc 4.

## Kết quả rà soát

Phán quyết: **Bằng chứng lát 3 tự động đã hoàn tất; Cần có sự đánh giá của con người Nhật trước khi hội nhập.**
```

- [ ] **Bước 6: Cam kết hồ sơ xác nhận**

```powershell
git add .sdd/reviews/library-ux-slice3-validation-review-2026-07-15.md
git commit -m "docs: record operational UX validation"
```

- [ ] **Bước 7: Dừng để con người đánh giá**

Cung cấp cho Nhật đường dẫn bản ghi xác thực, danh sách kiểm tra đánh giá tập trung và bản tóm tắt
cam kết của nhánh. Không hợp nhất hoặc đẩy cho đến khi Nhật xác nhận rõ ràng việc xem xét và yêu cầu
hành động git tiếp theo.

---

## Tóm tắt truy vết

| Yêu cầu | Nhiệm vụ |
| --- | --- |
| Bảo hiểm trạng thái `UX-FE-006`, `AC-UX-005` | 1-8 |
| `AC-UX-004`, hàng được gắn nhãn di động | 1-8 |
| `AC-UX-007`, hợp đồng xác nhận/tập trung | 1-7 |
| `AC-UX-008`, không có thay đổi API/kinh doanh/bảo mật | 1-9 |
| Tiêu đề trang `AC-UX-S3-001` | 1, 5, 6 |
| Trạng thái hoạt động của `AC-UX-S3-002` | 1-8 |
| `AC-UX-S3-003` đang chờ xác nhận | 1-7 |
| Bàn di động `AC-UX-S3-004` | 1-8 |
| Bảo quản `AC-UX-S3-005` FE07 | 2-3, 9 |
| Dự phòng `AC-UX-S3-006` FE08 | 4, 9 |
| `AC-UX-S3-007` FE06 chỉ dành cho bản trình bày | 5, 9 |
| `AC-UX-S3-008` FE09 chỉ dành cho bản trình bày | 6-7, 9 |
| Bảo quản `AC-UX-S3-009` FE12 | 8-9 |
| Cổng phạm vi cuối cùng `AC-UX-S3-010` | 9 |
