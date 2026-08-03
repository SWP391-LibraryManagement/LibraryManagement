# Kế hoạch triển khai bản sửa nóng trình diễn Thành viên

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Làm cho sáu đường dẫn demo Thành viên được phê duyệt trở nên trung thực và đáng tin
cậy mà không cần thay đổi máy chủ, cơ sở dữ liệu hoặc FE11.

**Kiến trúc:** Giữ nguyên ranh giới React và API hiện có. Sửa hai hợp đồng mô hình xem, thêm một
trang phạt Thành viên chỉ đọc trên điểm cuối `/api/fines/me` hiện có và thực hiện các bản sửa lỗi
điều hướng/tìm kiếm/sao chép HomePage trong phạm vi hẹp. Mỗi thay đổi sản phẩm đều bắt đầu bằng kiểm
thử hồi quy Node tập trung và vẫn có sẵn để xem xét bản demo cục bộ.

**bộ công nghệ công nghệ:** React 19, React Bộ định tuyến 7, Axios, Node `node:test`, Vite 8, ESLint 10.

## Ràng buộc toàn cầu

- ID lô là `DEMO-HOTFIX-USER-2026-07-22`.
- Việc triển khai sản phẩm vẫn mang tính cục bộ và không được cam kết cho đến khi người dùng hoàn thành quá trình xem xét bản demo.
- Không cam kết, đẩy, hợp nhất, thay đổi lược đồ, triển khai hoặc chỉnh sửa mã sản xuất máy chủ.
- Không tạo giai đoạn hoặc sửa đổi bất kỳ tệp `.sdd/specs/feat-user-role-management/` nào.
- Không thiết kế lại việc mượn nhiều bản sao hoặc triển khai phân trang đầy đủ trong danh mục/reservation.
- Sử dụng lại các trình trợ giúp API đã được xác thực hiện có, `BorrowingRouteGuard`, `AppLayout`, `DataTable`, `DataNotice`, `EmptyState` và `Badge`.
- Giữ nguyên các quy định đã được phê duyệt: 3 yêu cầu mượn mỗi ngày trước khi thành viên được phê duyệt, 5 yêu cầu mỗi ngày sau khi được phê duyệt và tối đa 5 sách đang hoạt động.

---

## Bản đồ tệp

- Sửa đổi `frontend/src/page/dashboard/dashboardViewModel.js`: sử dụng phong bì mượn Thành viên chuẩn.
- Sửa đổi `frontend/src/utils/libraryFeatureViewModels.js`: duy trì trạng thái thô đặt chỗ và hiển thị chính sách thiết bị đầu cuối/trạng thái mở.
- Sửa đổi `frontend/src/page/reservation/MyReservationsPage.jsx`: sử dụng trạng thái vòng đời đặt chỗ thô cho các hành động trùng lặp và hủy.
- Sửa đổi `frontend/src/api/libraryFeatureApi.js`: hiển thị điểm cuối đọc khoản phạt của Thành viên hiện có.
- Tạo `frontend/src/page/fine/MemberFinesPage.jsx`: hiển thị khoản phạt của chính Thành viên đã được xác thực ở chế độ chỉ đọc.
- Sửa đổi `frontend/src/App.jsx`: tải chậm và bảo vệ `/fines/mine`.
- Modify `frontend/src/utils/appNavigation.js`: expose “khoản phạt của tôi” to thành viên.
- Sửa đổi `frontend/src/page/HomePage.jsx`: sửa các tuyến đường của khách, đặt lại tìm kiếm trống và bản sao quảng cáo không được hỗ trợ.
- Sửa đổi `frontend/test/appShellFrontend.test.js`: bảng điều khiển, Điều hướng thành viên và hồi quy về độ trung thực của Trang chủ.
- Sửa đổi hồi quy trạng thái đầu cuối `frontend/test/reservationFrontend.test.js`: FE08.
- Tạo `frontend/test/memberFineFrontend.test.js`: API, tuyến đường, điều hướng và hồi quy trang chỉ đọc.
- Sửa đổi `frontend/test/publicBrowseFrontend.test.js`: hồi quy danh mục mặc định tìm kiếm trống.

### Nhiệm vụ 1: Chỉnh sửa phong bì mượn bảng điều khiển Thành viên

**Tệp:**
- Sửa đổi: `frontend/test/appShellFrontend.test.js`
- Sửa đổi: `frontend/src/page/dashboard/dashboardViewModel.js`

**Giao diện:**
- Tiêu thụ: `borrowingApi.listMine(): Promise<{ borrowings: BorrowRequest[], pagination: object }>`.
- Sản xuất: `buildMemberSummary(borrowing, reservations): { activeBorrows: number, completedBorrows: number, activeReservations: number }`.

- [ ] **Bước 1: Viết kiểm thử phong bì chuẩn không thành công**

Thay thế vật cố định của bảng điều khiển Thành viên bằng:

```js
test('member dashboard summarizes the canonical personal borrowing envelope', () => {
  assert.deepEqual(
    buildMemberSummary(
      { borrowings: [{ status: 'APPROVED' }, { status: 'COMPLETED' }] },
      { reservations: [{ status: 'WAITING' }, { status: 'CANCELLED' }] },
    ),
    { activeBorrows: 1, completedBorrows: 1, activeReservations: 1 },
  );
});
```

- [ ] **Bước 2: Chạy kiểm thử tập trung và xác minh RED**

Chạy: `node --test --test-name-pattern="member dashboard" test/appShellFrontend.test.js`

Thư mục làm việc: `frontend`

Dự kiến: THẤT BẠI vì `activeBorrows` và `completedBorrows` là `0` khi thiết bị cố định sử dụng `borrowings`.

- [ ] **Bước 3: Triển khai khóa chuẩn bằng kiểm tra mảng phòng vệ**

Thay đổi dòng đầu tiên bên trong `buildMemberSummary` thành:

```js
const borrowRows = Array.isArray(borrowing.borrowings) ? borrowing.borrowings : [];
```

Giữ bản tóm tắt nhân viên trên `borrowRequests`, vì điểm cuối nhân viên sở hữu phong bì đó.

- [ ] **Bước 4: Chạy kiểm thử tập trung và xác minh GREEN**

Chạy: `node --test --test-name-pattern="member dashboard" test/appShellFrontend.test.js`

Thư mục làm việc: `frontend`

Dự kiến: ĐẠT.

- [ ] **Bước 5: Kiểm tra sự khác biệt của tác vụ mà không cần nhập mã sản phẩm**

Chạy: `git diff -- frontend/test/appShellFrontend.test.js frontend/src/page/dashboard/dashboardViewModel.js`

Dự kiến: chỉ có bản cố định Thành viên và khóa phản hồi Thành viên chuẩn thay đổi.

### Nhiệm vụ 2: Hoàn thành thiết bị đầu cuối đặt chỗ trong hành động của Thành viên

**Tệp:**
- Sửa đổi: `frontend/test/reservationFrontend.test.js`
- Sửa đổi: `frontend/src/utils/libraryFeatureViewModels.js`
- Sửa đổi: `frontend/src/page/reservation/MyReservationsPage.jsx`

**Giao diện:**
- Tạo ra: `isOpenMemberReservationStatus(status): boolean`, chỉ đúng cho các trạng thái máy chủ `ACTIVE` và `NOTIFIED`.
- Tạo ra: `mapReservation(reservation).rawStatus: string`, được chuẩn hóa thành chữ hoa.
- Tiêu thụ: hai đầu ra đó trong các quyết định đặt chỗ trùng lặp và nút hủy.

- [ ] **Bước 1: Viết các kiểm thử chính sách và trạng thái thô không thành công**

Thêm vào `reservationFrontend.test.js`:

```js
test('member reservation actions are open only for ACTIVE and NOTIFIED records', async () => {
  const { isOpenMemberReservationStatus } = await loadViewModels();

  assert.equal(typeof isOpenMemberReservationStatus, 'function');
  assert.equal(isOpenMemberReservationStatus('ACTIVE'), true);
  assert.equal(isOpenMemberReservationStatus('NOTIFIED'), true);
  assert.equal(isOpenMemberReservationStatus('FULFILLED'), false);
  assert.equal(isOpenMemberReservationStatus('CANCELLED'), false);
  assert.equal(isOpenMemberReservationStatus('EXPIRED'), false);
});

test('reservation mapping preserves the normalized backend lifecycle state', async () => {
  const { mapReservation } = await loadViewModels();
  assert.equal(mapReservation({ reservationId: 7, copyId: 9, status: 'fulfilled' }).rawStatus, 'FULFILLED');
});
```

Mở rộng kiểm thử nguồn trang Thành viên hiện có với:

```js
assert.match(mine, /isOpenMemberReservationStatus/);
assert.match(mine, /item\.rawStatus/);
assert.doesNotMatch(mine, /!\['Cancelled', 'Expired'\]\.includes\(item\.status\)/);
```

- [ ] **Bước 2: Chạy tệp FE08 và xác minh RED**

Chạy: `node --test test/reservationFrontend.test.js`

Thư mục làm việc: `frontend`

Dự kiến: THẤT BẠI vì trình trợ giúp và `rawStatus` không tồn tại và trang vẫn cho phép hủy `Completed`.

- [ ] **Bước 3: Thêm chính sách vòng đời vào mô hình xem**

Thêm vào trước `mapReservation`:

```js
export function isOpenMemberReservationStatus(status) {
  return ['ACTIVE', 'NOTIFIED'].includes(String(status || '').toUpperCase());
}
```

Thêm thuộc tính này vào `mapReservation`:

```js
rawStatus: String(reservation.status || '').toUpperCase(),
```

- [ ] **Bước 4: Sử dụng chính sách cho hành động trùng lặp và hủy**

Nhập `isOpenMemberReservationStatus`, sau đó tạo bộ sao chép hoạt động và sử dụng kiểm tra trùng lặp:

```js
.filter((item) => isOpenMemberReservationStatus(item.rawStatus))
```

```js
if (reservations.some((item) => (
  Number(item.copyId) === Number(candidate.copyId)
  && isOpenMemberReservationStatus(item.rawStatus)
))) {
```

Chỉ hiển thị nút hủy khi:

```jsx
{isOpenMemberReservationStatus(item.rawStatus) && (
  <button className="btn btn-outline btn-sm" onClick={() => setCancelTarget(item)}>
    <X size={14} /> Hủy
  </button>
)}
```

Đồng thời hiển thị `-` cho vị trí hàng đợi khi `rawStatus` là thiết bị đầu cuối.

- [ ] **Bước 5: Chạy tệp FE08 và xác minh GREEN**

Chạy: `node --test test/reservationFrontend.test.js`

Thư mục làm việc: `frontend`

Dự kiến: tất cả các kiểm thử giao diện người dùng FE08 đều vượt qua.

### Nhiệm vụ 3: thêm a chỉ đọc “khoản phạt của tôi” page

**Tệp:**
- Tạo: `frontend/test/memberFineFrontend.test.js`
- Sửa đổi: `frontend/test/appShellFrontend.test.js`
- Sửa đổi: `frontend/src/api/libraryFeatureApi.js`
- Tạo: `frontend/src/page/fine/MemberFinesPage.jsx`
- Sửa đổi: `frontend/src/App.jsx`
- Sửa đổi: `frontend/src/utils/appNavigation.js`

**Giao diện:**
- Sản xuất: `fineApi.listMine(params = {}): Promise<{ fines: Fine[], page: number, limit: number, total: number, totalPages: number }>`.
- Tạo ra: tuyến đường được bảo vệ `/fines/mine` và phím điều hướng `my-fines`.
- Tiêu thụ: các trường tốt `fineId`, `borrowDetailId`, `bookTitle`, `reason`, `overdueDays`, `amount`, `status`.

- [ ] **Bước 1: Viết các kiểm thử trang API, tuyến đường, điều hướng và chỉ đọc không thành công**

Tạo `memberFineFrontend.test.js`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Member fines use the authenticated own-fines endpoint', async () => {
  const api = await readFile(new URL('../src/api/libraryFeatureApi.js', import.meta.url), 'utf8');
  assert.match(api, /listMine\(params = \{\}\)/);
  assert.match(api, /method: 'get', url: '\/fines\/me', params/);
});

test('Member fines route is guarded and present in Member navigation', async () => {
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const navigation = await readFile(new URL('../src/utils/appNavigation.js', import.meta.url), 'utf8');
  assert.match(app, /path="\/fines\/mine"[^\n]+BorrowingRouteGuard audience="member"/);
  assert.match(navigation, /key: 'my-fines', label: 'Tiền phạt của tôi', path: '\/fines\/mine'/);
});

test('Member fines page is server-backed, paginated, and read-only', async () => {
  const page = await readFile(new URL('../src/page/fine/MemberFinesPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /fineApi\.listMine\(\{ page, limit: MEMBER_FINE_PAGE_SIZE \}\)/);
  assert.match(page, /onClick=\{loadFines\}/);
  assert.match(page, /result\.totalPages/);
  assert.match(page, /fine\.bookTitle/);
  assert.match(page, /fine\.reason/);
  assert.match(page, /fine\.borrowDetailId/);
  assert.doesNotMatch(page, /fineApi\.(calculate|collect|markPaid|waive|cancel)/);
});
```

Cập nhật kỳ vọng điều hướng Thành viên trong `appShellFrontend.test.js` để bao gồm `my-fines` và thêm:

```js
assert.equal(getActiveNavigationKey('/fines/mine'), 'my-fines');
```

- [ ] **Bước 2: Chạy hai tệp kiểm thử tập trung và xác minh RED**

Chạy: `node --test test/memberFineFrontend.test.js test/appShellFrontend.test.js`

Thư mục làm việc: `frontend`

Dự kiến: THẤT BẠI vì trang, phương thức API, tuyến đường và mục điều hướng không tồn tại.

- [ ] **Bước 3: Thêm phương thức API, tuyến đường được bảo vệ và mục điều hướng**

Thêm đầu tiên vào `fineApi`:

```js
listMine(params = {}) {
  return authorizedRequest(
    { method: 'get', url: '/fines/me', params },
    'Không thể tải tiền phạt của bạn.',
  );
},
```

Thêm chức năng nhập và định tuyến lười biếng trong `App.jsx`:

```js
const MemberFinesPage = lazy(() => import('./page/fine/MemberFinesPage'));
```

```jsx
<Route path="/fines/mine" element={<BorrowingRouteGuard audience="member"><MemberFinesPage /></BorrowingRouteGuard>} />
```

Thêm vào nhóm điều hướng Thành viên:

```js
{ key: 'my-fines', label: 'Tiền phạt của tôi', path: '/fines/mine' },
```

- [ ] **Bước 4: Tạo trang chỉ đọc**

Triển khai `MemberFinesPage.jsx` với trạng thái `MEMBER_FINE_PAGE_SIZE = 8`, `page`, `fines`,
`pagination`, `loading` và `notice`. Tải với:

```js
const result = await fineApi.listMine({ page, limit: MEMBER_FINE_PAGE_SIZE });
setFines(result.fines || []);
setPagination({
  page: Number(result.page || page),
  limit: Number(result.limit || MEMBER_FINE_PAGE_SIZE),
  total: Number(result.total || 0),
  totalPages: Number(result.totalPages || 0),
});
```

Kết xuất `AppLayout active="my-fines"` bằng nút tải lại có `onClick` là `loadFines`, lỗi
`DataNotice` và `DataTable` với các tiêu đề chính xác sau:

```js
['Sách', 'Lý do', 'Quá hạn', 'Số tiền', 'Trạng thái', 'Mã mượn']
```

Sử dụng `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0
})`, `Badge` và các nút trước/tiếp theo chỉ gọi `setPage`. Không hiển thị các nút thao tác ghi.

- [ ] **Bước 5: Chạy hai tệp tập trung và xác minh GREEN**

Chạy: `node --test test/memberFineFrontend.test.js test/appShellFrontend.test.js`

Thư mục làm việc: `frontend`

Dự kiến: cả hai tập tin đều vượt qua.

### Nhiệm vụ 4: Sửa tất cả các điểm nhập xác thực khách

**Tệp:**
- Sửa đổi: `frontend/test/appShellFrontend.test.js`
- Sửa đổi: `frontend/src/page/HomePage.jsx`

**Giao diện:**
- Tiêu thụ: người trợ giúp `goToLogin()` và `goToRegister()` hiện có.
- Tạo ra: các điều khiển dành cho máy tính để bàn, thiết bị di động, CTA và chân trang định tuyến nhất quán đến `/login` hoặc `/register`.

- [ ] **Bước 1: Viết hợp đồng nguồn bị lỗi**

Thêm vào `appShellFrontend.test.js`:

```js
test('homepage guest authentication controls route to their matching screens', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  assert.match(source, />Đăng ký<\/button>/);
  assert.doesNotMatch(source, /onClick=\{goToMembership\}/);
  assert.match(source, /label: 'Đăng nhập', action: goToLogin/);
  assert.match(source, /label: 'Đăng ký', action: goToRegister/);
});
```

- [ ] **Bước 2: Chạy kiểm thử tập trung và xác minh RED**

Chạy: `node --test --test-name-pattern="guest authentication controls" test/appShellFrontend.test.js`

Thư mục làm việc: `frontend`

Dự kiến: THẤT BẠI vì đăng ký trên máy tính để bàn/thiết bị di động sử dụng `goToMembership` và các
tác vụ ở chân trang là các hàm trống.

- [ ] **Bước 3: Đấu dây từng điều khiển cho người trợ giúp hiện có**

Xóa `goToMembership`. Sử dụng `goToRegister` cho nút **Đăng ký** trên máy tính và thiết bị di động.
Thay các liên kết chân trang bằng:

```js
{ label: 'Đăng nhập', action: goToLogin },
{ label: 'Đăng ký', action: goToRegister },
```

- [ ] **Bước 4: Chạy kiểm thử tập trung và xác minh GREEN**

Chạy: `node --test --test-name-pattern="guest authentication controls" test/appShellFrontend.test.js`

Thư mục làm việc: `frontend`

Dự kiến: ĐẠT.

### Nhiệm vụ 5: Làm cho tìm kiếm công khai trống trở về danh mục mặc định

**Tệp:**
- Sửa đổi: `frontend/test/publicBrowseFrontend.test.js`
- Sửa đổi: `frontend/src/page/HomePage.jsx`

**Giao diện:**
- Tiêu thụ: `publicBrowseApi.list()` và `scrollTo('section-books')` hiện có.
- Tạo ra: tìm kiếm trống tải lại danh sách mặc định chuẩn, đặt lại trạng thái tìm kiếm, chọn tất cả các danh mục, mở rộng danh mục và không hiển thị thông báo xác thực.

- [ ] **Bước 1: Viết hợp đồng tìm kiếm trống không thành công**

Thêm vào `publicBrowseFrontend.test.js`:

```js
test('FE01 blank search returns to the loaded default catalog without an error toast', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  const blankBranch = source.match(/if \(!keyword\) \{([\s\S]*?)\n    \}/)?.[1] || '';
  assert.match(blankBranch, /await publicBrowseApi\.list\(\)/);
  assert.match(blankBranch, /setBooks\(result\.data \|\| \[\]\)/);
  assert.match(blankBranch, /setActiveSearch\(''\)/);
  assert.match(blankBranch, /setActiveCategory\('Tất cả'\)/);
  assert.match(blankBranch, /setShowAll\(true\)/);
  assert.match(blankBranch, /scrollTo\('section-books'\)/);
  assert.doesNotMatch(blankBranch, /Vui lòng nhập từ khóa tìm kiếm/);
});
```

- [ ] **Bước 2: Chạy tệp kiểm tra FE01 và xác minh RED**

Chạy: `node --test test/publicBrowseFrontend.test.js`

Thư mục làm việc: `frontend`

Dự kiến: THẤT BẠI vì mục nhập trống hiển thị thông báo xác thực và không tải lại hoặc hiển thị danh
sách mặc định chuẩn.

- [ ] **Bước 3: Thay thế nhánh tìm kiếm trống**

sử dụng:

```js
if (!keyword) {
  setActiveSearch('');
  setSearchResults([]);
  setSearchError('');
  try {
    setSearchingBooks(true);
    setBookError('');
    const result = await publicBrowseApi.list();
    if (!Array.isArray(result.data)) {
      throw new Error(result.error?.message || 'Không thể tải danh sách sách.');
    }
    setBooks(result.data || []);
    setActiveCategory('Tất cả');
    setShowAll(true);
    scrollTo('section-books');
  } catch (error) {
    setBookError(error.message || 'Không thể tải danh sách sách.');
  } finally {
    setSearchingBooks(false);
  }
  return;
}
```

- [ ] **Bước 4: Chạy tệp FE01 và xác minh GREEN**

Chạy: `node --test test/publicBrowseFrontend.test.js`

Thư mục làm việc: `frontend`

Dự kiến: tất cả các kiểm thử duyệt công khai FE01 đều vượt qua.

### Nhiệm vụ 6: Xóa các yêu cầu thành viên không được hỗ trợ khỏi trang chủ công khai

**Tệp:**
- Sửa đổi: `frontend/test/appShellFrontend.test.js`
- Sửa đổi: `frontend/src/page/HomePage.jsx`

**Giao diện:**
- Tiêu thụ: các quy tắc thành viên và mượn đã được phê duyệt từ thông số chức năng của SDD.
- Sản xuất: bản sao công khai chỉ yêu cầu đăng ký, xem xét đơn đăng ký, 3/5 yêu cầu hàng ngày và 5 cuốn sách đang hoạt động.

- [ ] **Bước 1: Viết hợp đồng sao y đúng sự thật**

Thêm vào `appShellFrontend.test.js`:

```js
test('homepage membership copy stays within approved library rules', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  for (const unsupported of [
    '99.000 VND/tháng',
    'Mượn sách không giới hạn',
    'Sách điện tử và sách nói',
    'Thông báo sách mới',
    'Danh sách đọc',
    'Sự kiện riêng',
  ]) assert.doesNotMatch(source, new RegExp(unsupported));
  assert.doesNotMatch(source, /MembershipModal|showMembership/);
  assert.match(source, /Tối đa 5 sách đang mượn/);
  assert.match(source, /3 yêu cầu mỗi ngày/);
  assert.match(source, /5 yêu cầu mỗi ngày sau khi được duyệt hội viên/);
});
```

- [ ] **Bước 2: Chạy kiểm thử tập trung và xác minh RED**

Chạy: `node --test --test-name-pattern="membership copy stays" test/appShellFrontend.test.js`

Thư mục làm việc: `frontend`

Dự kiến: THẤT BẠI vì các thẻ phúc lợi theo phương thức trả phí không hoạt động và không được hỗ trợ
vẫn còn trong nguồn.

- [ ] **Bước 3: Xóa phương thức không hoạt động và thay thế bốn thẻ phúc lợi**

Xóa thành phần `MembershipModal`, trạng thái `showMembership` và nhánh kết xuất của nó. Thay thế dữ
liệu thẻ phúc lợi bằng:

```js
[
  { icon: '01', title: 'Đăng ký trực tuyến', desc: 'Tạo tài khoản và xác thực email để sử dụng hệ thống.' },
  { icon: '02', title: 'Mượn sách có kiểm soát', desc: 'Tối đa 5 sách đang mượn tại cùng một thời điểm.' },
  { icon: '03', title: 'Hạn mức rõ ràng', desc: 'Gửi tối đa 3 yêu cầu mỗi ngày khi chưa được duyệt hội viên.' },
  { icon: '04', title: 'Quyền lợi hội viên', desc: 'Gửi tối đa 5 yêu cầu mỗi ngày sau khi được duyệt hội viên.' },
]
```

- [ ] **Bước 4: Chạy kiểm thử tập trung và xác minh GREEN**

Chạy: `node --test --test-name-pattern="membership copy stays" test/appShellFrontend.test.js`

Thư mục làm việc: `frontend`

Dự kiến: ĐẠT.

### Nhiệm vụ 7: Chạy xác minh đầy đủ và chuẩn bị bàn giao bản trình diễn

**Tệp:**
- Chỉ xác minh: tất cả các tệp được thay đổi bởi Nhiệm vụ 1–6.

**Giao diện:**
- Tiêu thụ: tất cả sáu hotfix xanh độc lập.
- Tạo ra: bằng chứng kiểm thử/kiểm tra mã/bản dựng mới và sự khác biệt giới hạn trong lô đã được phê duyệt.

- [ ] **Bước 1: Chạy tất cả các kiểm thử giao diện người dùng**

Chạy: `npm test`

Thư mục làm việc: `frontend`

Dự kiến: mọi kiểm thử Nút đều vượt qua và không có lỗi nào.

- [ ] **Bước 2: Chạy kiểm tra mã**

Chạy: `npm run lint`

Thư mục làm việc: `frontend`

Dự kiến: mã thoát `0` không có lỗi ESLint.

- [ ] **Bước 3: Xây dựng giao diện sản xuất**

Chạy: `npm run build`

Thư mục làm việc: `frontend`

Dự kiến: Vite hoàn thành quá trình xây dựng sản xuất với mã thoát `0`.

- [ ] **Bước 4: Chạy lại các hợp đồng máy chủ có liên quan mà không cần chỉnh sửa máy chủ**

Chạy: `npm kiểm thử -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingContract.test.js
tests/reservationRoutes.test.js tests/reservationService.test.js tests/fineRoutes.test.js
tests/fineContract.test.js`

Thư mục làm việc: `backend`

Dự kiến: các kiểm thử mượn, đặt chỗ và dịch vụ tốt đã vượt qua.

- [ ] **Bước 5: Kiểm tra khoảng trắng, phạm vi và cách ly FE11**

Chạy: `git diff --check`

Dự kiến: không có lỗi khoảng trắng trong tệp hotfix.

Chạy: `git status --short`

Dự kiến: sáu tệp FE11 có sẵn vẫn chưa được phân loại, các tệp sản phẩm hotfix không được phân loại
và không có tệp backend/schema nào xuất hiện.

Chạy: `git diff --name-only -- frontend`

Dự kiến: chỉ các tệp giao diện người dùng được liệt kê trong Bản đồ tệp mới xuất hiện.

- [ ] **Bước 6: Thực hiện luồng kiểm thử nhanh năm phút**

Chạy ứng dụng với quá trình khởi động cục bộ bình thường của kho lưu trữ. Xác minh theo thứ tự:

1. khách máy tính/di động/footer “Đăng ký” opens `/register`; “Đăng nhập” opens `/login`.
2. Tìm kiếm trống sẽ quay lại danh mục mặc định hoàn chỉnh mà không có lỗi.
3. Trang tổng quan thành viên hiển thị số lượng từ dữ liệu `/borrow-requests/me` thực tế.
4. Việc đặt chỗ đã hoàn thành không có hành động hủy và không chặn việc đặt lại bản sao đó.
5. “khoản phạt của tôi” opens `/fines/mine`, paginates, và exposes no thao tác ghi hành động.
6. Bản sao thành viên công khai không chứa cấp trả phí, mượn không giới hạn, phương tiện kỹ thuật số, sự kiện riêng tư, thông báo hoặc yêu cầu danh sách đọc.
