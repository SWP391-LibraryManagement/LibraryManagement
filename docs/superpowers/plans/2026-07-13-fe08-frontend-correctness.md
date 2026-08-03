# FE08 Kế hoạch thực hiện chính xác giao diện người dùng

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Căn chỉnh giao diện đặt chỗ FE08 với vòng đời đặt chỗ đã được phê duyệt và hợp đồng
giữ hết hạn máy chủ hiện có.

**Kiến trúc:** Giữ `statusToUi()` làm ranh giới trạng thái máy chủ cho giao diện người dùng, thêm
các trình trợ giúp chế độ xem FE08 thuần túy nhỏ để xác định tính đủ điều kiện của hàng đợi và bản
sao thành công, đồng thời cách ly các lỗi đặt chỗ đằng sau một trình phân giải chuyên dụng chỉ được
sử dụng bởi `reservationApi`. Trang thủ thư gọi điểm cuối máy chủ hiện có và tải lại trạng thái máy
chủ chuẩn thay vì mô phỏng quá trình thực hiện hoặc xóa cục bộ.

**Tech bộ công nghệ:** React 19, Vite 8, Axios, Node.js chạy kiểm thử tích hợp, ESLint, bộ hồi quy
Express/Jest.

## Ràng buộc toàn cầu

- Tuân theo `.sdd/specs/feat-reservation-management/SPEC.md` phiên bản 0.3.1 làm nguồn hành vi đáng tin cậy.
- Chỉ sử dụng hợp đồng máy chủ `POST /api/reservations/expire-holds` hiện có.
- Không thêm điểm cuối máy chủ, thay đổi cơ sở dữ liệu, giá trị trạng thái, phần phụ thuộc hoặc hết hạn tự động theo lịch trình.
- Không triển khai thực hiện FE07, thay đổi phân phối FE10 hoặc phân trang phía máy chủ.
- Giữ các thông báo lỗi API dành riêng cho tiếng Việt được cách ly với `reservationApi`.
- Xóa các hành động trên giao diện người dùng yêu cầu thực hiện hoặc xóa phía máy chủ trong khi chỉ thay đổi trạng thái cục bộ.
- Bảo toàn các tập tin không bị theo dõi không liên quan, đặc biệt là `backend/coverage/` và `docs/briefing-thuyet-trinh-du-an-vi.docx`.
- Sử dụng nhánh `fix/fe08-frontend-correctness`; không tạo nhánh chứa `codex`.

---

## Cấu trúc tệp

- Tạo `frontend/src/utils/reservationViewState.js`: trình trợ giúp về tính đủ điều kiện của hàng đợi FE08 thuần túy và thông báo kết quả hết hạn.
- Tạo `frontend/test/reservationFrontend.test.js`: Kiểm tra nút để ánh xạ vòng đời, tính đủ điều kiện của hàng đợi, bản sao tóm tắt hết hạn và hợp đồng trang thư viện.
- Sửa đổi `frontend/src/utils/libraryFeatureViewModels.js`: thêm ánh xạ chuẩn cho `NOTIFIED` và `FULFILLED`.
- Sửa đổi `frontend/src/api/apiErrorMessages.js`: thêm và xuất trình giải quyết lỗi dành riêng cho việc đặt chỗ.
- Sửa đổi `frontend/test/apiErrorMessages.test.js`: xác minh bản địa hóa FE08 và cách ly nhiều chức năng.
- Sửa đổi `frontend/src/api/libraryFeatureApi.js`: định tuyến tất cả các cuộc gọi đặt chỗ thông qua trình phân giải FE08 và hiển thị `expireHolds()`.
- Sửa đổi `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`: hết hạn giữ dây, tải lại trạng thái máy chủ, lọc các hàng đợi đang hoạt động và xóa các hành động giả mạo.
- Sửa đổi `.sdd/specs/feat-reservation-management/PLAN.md`: mô tả phần giao diện người dùng đã hoàn thành và mức độ chính xác này.
- Sửa đổi `.sdd/specs/feat-reservation-management/TASKS.md`: thêm các nhiệm vụ về tính chính xác của FE08, truy vết và bằng chứng xác minh mới.
- Sửa đổi `.sdd/specs/feat-reservation-management/CHANGELOG.md`: ghi lại bản cập nhật tính chính xác của giao diện người dùng 2026-07-13.

---

### Nhiệm vụ 1: Vòng đời đặt chỗ và Người trợ giúp trạng thái xem

**Tệp:**
- Tạo: `frontend/src/utils/reservationViewState.js`
- Tạo: `frontend/test/reservationFrontend.test.js`
- Sửa đổi: `frontend/src/utils/libraryFeatureViewModels.js:114`

**Giao diện:**
- Tiêu thụ: trạng thái đặt chỗ máy chủ `ACTIVE`, `NOTIFIED`, `FULFILLED`, `CANCELLED` và `EXPIRED`.
- Sản xuất: `statusToUi(status, metadata)`, `isActiveReservationQueueStatus(status)`, `getExpireHoldsSuccessMessage(result)` và `runHoldExpirationWorkflow(dependencies)`.

- [ ] **Bước 1: Viết các kiểm thử vòng đời và trạng thái xem không thành công**

Tạo `frontend/test/reservationFrontend.test.js`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

async function loadViewModels() {
  try {
    return await import('../src/utils/libraryFeatureViewModels.js');
  } catch {
    return {};
  }
}

async function loadReservationViewState() {
  try {
    return await import('../src/utils/reservationViewState.js');
  } catch {
    return {};
  }
}

test('maps every FE08 reservation lifecycle state to its canonical UI state', async () => {
  const { statusToUi } = await loadViewModels();

  assert.equal(typeof statusToUi, 'function');
  assert.equal(statusToUi('ACTIVE'), 'Waiting');
  assert.equal(statusToUi('NOTIFIED'), 'Ready to pick up');
  assert.equal(statusToUi('FULFILLED'), 'Completed');
  assert.equal(statusToUi('CANCELLED'), 'Cancelled');
  assert.equal(statusToUi('EXPIRED'), 'Expired');
});

test('keeps only active FE08 states in the librarian queue', async () => {
  const { isActiveReservationQueueStatus } = await loadReservationViewState();

  assert.equal(typeof isActiveReservationQueueStatus, 'function');
  assert.equal(isActiveReservationQueueStatus('Waiting'), true);
  assert.equal(isActiveReservationQueueStatus('Ready to pick up'), false);
  assert.equal(isActiveReservationQueueStatus('Completed'), false);
  assert.equal(isActiveReservationQueueStatus('Cancelled'), false);
  assert.equal(isActiveReservationQueueStatus('Expired'), false);
});

test('formats expired and promoted counts from the backend response', async () => {
  const { getExpireHoldsSuccessMessage } = await loadReservationViewState();

  assert.equal(typeof getExpireHoldsSuccessMessage, 'function');
  assert.equal(
    getExpireHoldsSuccessMessage({ expiredCount: 2, promoted: [{}, {}] }),
    'Đã xử lý 2 lượt giữ chỗ hết hạn và chuyển tiếp 2 lượt đặt chỗ.',
  );
  assert.equal(
    getExpireHoldsSuccessMessage({}),
    'Đã xử lý 0 lượt giữ chỗ hết hạn và chuyển tiếp 0 lượt đặt chỗ.',
  );
});

```

- [ ] **Bước 2: Chạy kiểm thử mới và xác minh chúng thất bại**

Chạy:

```powershell
node --test frontend/test/reservationFrontend.test.js
```

Dự kiến: THẤT BẠI vì `NOTIFIED` vẫn chưa được ánh xạ và `reservationViewState.js` không tồn tại.

- [ ] **Bước 3: Triển khai ánh xạ trạng thái chuẩn**

Trong `frontend/src/utils/libraryFeatureViewModels.js`, thay thế khối trạng thái FE08 mở bằng:

```js
export function statusToUi(status, { notifiedAt, expiresAt } = {}) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ACTIVE' && notifiedAt) return 'Ready to pick up';
  if (normalized === 'ACTIVE') return 'Waiting';
  if (normalized === 'NOTIFIED') return 'Ready to pick up';
  if (normalized === 'FULFILLED') return 'Completed';
  if (normalized === 'CANCELLED') return 'Cancelled';
  if (normalized === 'EXPIRED') return 'Expired';
  if (normalized === 'PENDING' || normalized === 'REQUESTED') return 'Pending';
```

Giữ nguyên các ánh xạ hiện có sau `PENDING`.

- [ ] **Bước 4: Triển khai công cụ trợ giúp chế độ xem đặt chỗ tập trung**

Tạo `frontend/src/utils/reservationViewState.js`:

```js
const ACTIVE_QUEUE_STATUSES = new Set(['Waiting']);

export function isActiveReservationQueueStatus(status) {
  return ACTIVE_QUEUE_STATUSES.has(status);
}

export function getExpireHoldsSuccessMessage({ expiredCount = 0, promoted = [] } = {}) {
  const normalizedExpiredCount = Number(expiredCount) || 0;
  const promotedCount = Array.isArray(promoted) ? promoted.length : 0;
  return `Đã xử lý ${normalizedExpiredCount} lượt giữ chỗ hết hạn và chuyển tiếp ${promotedCount} lượt đặt chỗ.`;
}

export async function runHoldExpirationWorkflow({ expireHolds, reloadReservations, onSuccess }) {
  const result = await expireHolds();
  await reloadReservations({ fallbackToDemo: false });
  await onSuccess?.(result);
  return result;
}
```

- [ ] **Bước 5: Chỉ chạy các kiểm thử trợ giúp thuần túy**

Chạy:

```powershell
node --test frontend/test/reservationFrontend.test.js
```

Dự kiến: cả 3 bài thi ĐẠT.

- [ ] **Bước 6: Cam kết ranh giới bang**

```powershell
git add -- frontend/src/utils/libraryFeatureViewModels.js frontend/src/utils/reservationViewState.js frontend/test/reservationFrontend.test.js
git commit -m "fix: align FE08 reservation view states"
```

---

### Nhiệm vụ 2: Lỗi cụ thể dành riêng và hợp đồng API

**Tệp:**
- Sửa đổi: `frontend/test/apiErrorMessages.test.js`
- Sửa đổi: `frontend/src/api/apiErrorMessages.js`
- Sửa đổi: `frontend/src/api/libraryFeatureApi.js:82,113`

**Giao diện:**
- Tiêu thụ: hình dạng lỗi máy chủ `{ error: { code, message, details } }` và `authorizedRequest(config, fallbackMessage, resolver)` hiện có.
- Sản xuất: `getReservationErrorMessage(error, fallback)`, `authorizedReservationRequest(config, fallbackMessage)` và `reservationApi.expireHolds()` trả về `{ expiredCount, expired, promoted }`.

- [ ] **Bước 1: Thêm bản đồ lỗi FE08 không thành công và kiểm tra hợp đồng API**

Nối vào `frontend/test/apiErrorMessages.test.js`:

```js
const expectedReservationMessages = {
  MEMBER_ROLE_REQUIRED: 'Chỉ tài khoản thành viên mới được đặt chỗ sách.',
  STAFF_ROLE_REQUIRED: 'Chỉ thủ thư hoặc admin mới được quản lý hàng đợi đặt chỗ.',
  ROLE_REQUIRED: 'Tài khoản hiện tại không có quyền thực hiện thao tác đặt chỗ này.',
  MEMBER_NOT_FOUND: 'Tài khoản hiện tại chưa có hồ sơ thành viên. Vui lòng liên hệ thủ thư/admin.',
  MEMBER_ACCOUNT_INACTIVE: 'Tài khoản của bạn chưa được kích hoạt nên chưa thể đặt chỗ sách.',
  MEMBERSHIP_NOT_APPROVED: 'Membership của bạn chưa được duyệt nên chưa thể đặt chỗ sách.',
  COPY_NOT_FOUND: 'Không tìm thấy bản sao sách này. Vui lòng tải lại dữ liệu và thử lại.',
  COPY_AVAILABLE: 'Bản sao này đang sẵn có. Vui lòng mượn sách thay vì đặt chỗ.',
  RESERVATION_NOT_ALLOWED: 'Không thể đặt chỗ bản sao ở trạng thái hiện tại.',
  DUPLICATE_ACTIVE_RESERVATION: 'Bạn đã có một lượt đặt chỗ đang hoạt động cho bản sao này.',
  ACTIVE_RESERVATION_LIMIT: 'Bạn đã đạt giới hạn 3 lượt đặt chỗ đang hoạt động.',
  RESERVATION_NOT_FOUND: 'Không tìm thấy lượt đặt chỗ này. Vui lòng tải lại dữ liệu.',
  RESERVATION_OWNER_REQUIRED: 'Bạn chỉ có thể hủy lượt đặt chỗ của chính mình.',
  RESERVATION_NOT_ACTIVE: 'Lượt đặt chỗ này không còn ở trạng thái cho phép thực hiện thao tác.',
  COPY_NOT_AVAILABLE: 'Bản sao chưa sẵn sàng để xử lý hàng đợi đặt chỗ.',
  COPY_MISMATCH: 'Bản sao được chọn không khớp với lượt đặt chỗ.',
  INVALID_ID: 'Mã đặt chỗ hoặc bản sao không hợp lệ.',
};

test('maps FE08 API error codes to actionable Vietnamese messages', async () => {
  const { getReservationErrorMessage } = await loadApiErrorMessages();

  assert.equal(typeof getReservationErrorMessage, 'function');
  for (const [code, message] of Object.entries(expectedReservationMessages)) {
    assert.equal(
      getReservationErrorMessage({ response: { status: 400, data: { error: { code } } } }),
      message,
      code,
    );
  }
});

test('keeps FE08 messages isolated from borrowing and generic feature APIs', async () => {
  const { getBorrowingErrorMessage, getLibraryFeatureErrorMessage } = await loadApiErrorMessages();
  const error = {
    response: {
      status: 409,
      data: { error: { code: 'ACTIVE_RESERVATION_LIMIT', message: 'Backend reservation message.' } },
    },
  };

  assert.equal(getBorrowingErrorMessage(error, 'Fallback'), 'Backend reservation message.');
  assert.equal(getLibraryFeatureErrorMessage(error, 'Fallback'), 'Backend reservation message.');
});
```

Thêm mục nhập này bên cạnh các mục nhập hiện có trong `frontend/test/reservationFrontend.test.js`:

```js
import { readFile } from 'node:fs/promises';
```

Nối thêm kiểm thử hợp đồng API này:

```js
test('reservation API exposes the existing hold-expiration endpoint', async () => {
  const source = await readFile(
    new URL('../src/api/libraryFeatureApi.js', import.meta.url),
    'utf8',
  );

  assert.match(
    source,
    /expireHolds\(\)\s*{[\s\S]*?method: 'post', url: '\/reservations\/expire-holds'/,
  );
});
```

- [ ] **Bước 2: Chạy kiểm tra lỗi và xác minh kiểm tra mới không thành công**

Chạy:

```powershell
node --test frontend/test/apiErrorMessages.test.js frontend/test/reservationFrontend.test.js
```

Dự kiến: THẤT BẠI vì `getReservationErrorMessage` không được xuất và `reservationApi.expireHolds()`
không tồn tại.

- [ ] **Bước 3: Triển khai trình phân giải FE08**

Trong `frontend/src/api/apiErrorMessages.js`, thêm:

```js
const RESERVATION_ERROR_MESSAGES = {
  MEMBER_ROLE_REQUIRED: 'Chỉ tài khoản thành viên mới được đặt chỗ sách.',
  STAFF_ROLE_REQUIRED: 'Chỉ thủ thư hoặc admin mới được quản lý hàng đợi đặt chỗ.',
  ROLE_REQUIRED: 'Tài khoản hiện tại không có quyền thực hiện thao tác đặt chỗ này.',
  MEMBER_NOT_FOUND: 'Tài khoản hiện tại chưa có hồ sơ thành viên. Vui lòng liên hệ thủ thư/admin.',
  MEMBER_ACCOUNT_INACTIVE: 'Tài khoản của bạn chưa được kích hoạt nên chưa thể đặt chỗ sách.',
  MEMBERSHIP_NOT_APPROVED: 'Membership của bạn chưa được duyệt nên chưa thể đặt chỗ sách.',
  COPY_NOT_FOUND: 'Không tìm thấy bản sao sách này. Vui lòng tải lại dữ liệu và thử lại.',
  COPY_AVAILABLE: 'Bản sao này đang sẵn có. Vui lòng mượn sách thay vì đặt chỗ.',
  RESERVATION_NOT_ALLOWED: 'Không thể đặt chỗ bản sao ở trạng thái hiện tại.',
  DUPLICATE_ACTIVE_RESERVATION: 'Bạn đã có một lượt đặt chỗ đang hoạt động cho bản sao này.',
  ACTIVE_RESERVATION_LIMIT: 'Bạn đã đạt giới hạn 3 lượt đặt chỗ đang hoạt động.',
  RESERVATION_NOT_FOUND: 'Không tìm thấy lượt đặt chỗ này. Vui lòng tải lại dữ liệu.',
  RESERVATION_OWNER_REQUIRED: 'Bạn chỉ có thể hủy lượt đặt chỗ của chính mình.',
  RESERVATION_NOT_ACTIVE: 'Lượt đặt chỗ này không còn ở trạng thái cho phép thực hiện thao tác.',
  COPY_NOT_AVAILABLE: 'Bản sao chưa sẵn sàng để xử lý hàng đợi đặt chỗ.',
  COPY_MISMATCH: 'Bản sao được chọn không khớp với lượt đặt chỗ.',
  INVALID_ID: 'Mã đặt chỗ hoặc bản sao không hợp lệ.',
};

export function getReservationErrorMessage(error, fallback) {
  const code = error.response?.data?.error?.code;
  const shouldUseGenericMessage = !error.response || code === 'UNAUTHORIZED' || error.response?.status === 401;

  if (!shouldUseGenericMessage && RESERVATION_ERROR_MESSAGES[code]) {
    return RESERVATION_ERROR_MESSAGES[code];
  }

  return getLibraryFeatureErrorMessage(error, fallback);
}
```

Giữ nguyên `BORROWING_ERROR_MESSAGES`, `getBorrowingErrorMessage()` và hành vi của trình phân giải chung.

- [ ] **Bước 4: Chỉ định tuyến các yêu cầu đặt chỗ thông qua trình phân giải FE08**

Cập nhật quá trình nhập và thêm trình bao bọc trong `frontend/src/api/libraryFeatureApi.js`:

```js
import {
  getBorrowingErrorMessage,
  getLibraryFeatureErrorMessage,
  getReservationErrorMessage,
} from './apiErrorMessages';

function authorizedReservationRequest(config, fallbackMessage) {
  return authorizedRequest(config, fallbackMessage, getReservationErrorMessage);
}
```

Thay thế đối tượng `reservationApi` hiện có bằng:

```js
export const reservationApi = {
  create(copyId) {
    return authorizedReservationRequest({ method: 'post', url: '/reservations', data: { copyId } }, 'Không thể đặt chỗ sách.');
  },
  listMine(params = {}) {
    return authorizedReservationRequest({ method: 'get', url: '/reservations/me', params }, 'Không thể tải đặt chỗ của bạn.');
  },
  cancel(reservationId, reason = 'Cancelled by member') {
    return authorizedReservationRequest({ method: 'patch', url: `/reservations/${reservationId}/cancel`, data: { reason } }, 'Không thể hủy đặt chỗ.');
  },
  listAll(params = {}) {
    return authorizedReservationRequest({ method: 'get', url: '/reservations', params }, 'Không thể tải danh sách đặt chỗ.');
  },
  processQueue(copyId) {
    return authorizedReservationRequest({ method: 'post', url: '/reservations/process-queue', data: { copyId } }, 'Không thể xử lý hàng đợi đặt chỗ.');
  },
  process(reservationId, data = {}) {
    return authorizedReservationRequest({ method: 'patch', url: `/reservations/${reservationId}/process`, data }, 'Không thể xử lý đặt chỗ.');
  },
  expireHolds() {
    return authorizedReservationRequest(
      { method: 'post', url: '/reservations/expire-holds' },
      'Không thể xử lý các lượt giữ chỗ hết hạn.',
    );
  },
};
```

- [ ] **Bước 5: Chạy kiểm tra lỗi FE07 và FE08 cùng nhau**

Chạy:

```powershell
node --test frontend/test/apiErrorMessages.test.js frontend/test/reservationFrontend.test.js
```

Dự kiến: tất cả các kiểm thử FE07, FE08, dự phòng và cách ly phù hợp ĐẠT.

- [ ] **Bước 6: Chạy kiểm tra mã trên các tệp API đã thay đổi**

Chạy:

```powershell
Push-Location frontend
npm.cmd exec -- eslint src/api/apiErrorMessages.js src/api/libraryFeatureApi.js test/apiErrorMessages.test.js
Pop-Location
```

Dự kiến: mã thoát 0 không có lỗi ESLint.

- [ ] **Bước 7: Cam kết ranh giới FE08 API**

```powershell
git add -- frontend/src/api/apiErrorMessages.js frontend/src/api/libraryFeatureApi.js frontend/test/apiErrorMessages.test.js frontend/test/reservationFrontend.test.js
git commit -m "fix: localize FE08 reservation API errors"
```

---

### Nhiệm vụ 3: Quy trình làm việc Giữ-Hết hạn của Thủ thư

**Tệp:**
- Sửa đổi: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx:7-143`
- Kiểm tra: `frontend/test/reservationFrontend.test.js`

**Giao diện:**
- Tiêu thụ: `reservationApi.expireHolds()`, `isActiveReservationQueueStatus(status)`, `getExpireHoldsSuccessMessage(result)` và `runHoldExpirationWorkflow(dependencies)` từ Nhiệm vụ 1-2.
- Tạo ra: một hành động của nhân viên nhằm khôi phục trạng thái máy chủ chuẩn và chỉ báo cáo số lượng đã hết hạn/được thăng cấp sau khi tải lại thành công.

- [ ] **Bước 1: Thêm và chạy kiểm thử hợp đồng trang bị lỗi**

Nối kiểm thử này vào `frontend/test/reservationFrontend.test.js`:

```js
test('librarian page wires the hold expiration workflow and omits local-only actions', async () => {
  const source = await readFile(
    new URL('../src/page/reservation/ReservationsLibrarianPage.jsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /runHoldExpirationWorkflow/);
  assert.match(source, /expireHolds: reservationApi\.expireHolds/);
  assert.match(source, /reloadReservations: loadReservations/);
  assert.match(source, /isActiveReservationQueueStatus\(item\.status\)/);
  assert.match(source, /onSuccess: \(result\) => showToast\(getExpireHoldsSuccessMessage\(result\), 'success'\)/);
  assert.doesNotMatch(source, /function fulfill\(/);
  assert.doesNotMatch(source, /function remove\(/);
  assert.doesNotMatch(source, /> Đã giao</);
  assert.doesNotMatch(source, /title="Xóa"/);
});
```

Chạy:

```powershell
node --test --test-name-pattern="librarian page" frontend/test/reservationFrontend.test.js
```

Dự kiến: THẤT BẠI vì trang không kết nối `runHoldExpirationWorkflow()`, vẫn xác định
`fulfill()`/`remove()` và vẫn hiển thị các điều khiển `Đã giao`/`Xóa`. Các kiểm thử trợ giúp thuần
túy xác minh riêng biệt hết hạn -> tải lại chuẩn -> đặt hàng thành công và đảm bảo các lỗi tải lại
không báo cáo thành công.

- [ ] **Bước 2: Thay thế hàng nhập và thêm trạng thái hết hạn**

Trong `ReservationsLibrarianPage.jsx`:

```js
import { Search, CalendarClock, Bell, PackageCheck, ChevronLeft, ChevronRight, Send, RefreshCw } from 'lucide-react';

import {
  getExpireHoldsSuccessMessage,
  isActiveReservationQueueStatus,
} from '../../utils/reservationViewState';
```

Thêm bên cạnh trạng thái tải hiện có:

```js
const [expiringHolds, setExpiringHolds] = useState(false);
```

- [ ] **Bước 3: Hạn chế hàng đợi hoạt động ở trạng thái FE08 đang hoạt động**

Thay thế phép tính hàng đợi bằng:

```js
const queue = useMemo(
  () => rows
    .filter((item) => item.book === queueBook && isActiveReservationQueueStatus(item.status))
    .sort((a, b) => a.queue - b.queue),
  [rows, queueBook],
);
```

- [ ] **Bước 4: Thêm trình xử lý hết hạn do máy chủ hỗ trợ**

Thêm sau `confirmNotify()` và xóa các chức năng `fulfill()` và `remove()` hiện có:

```js
async function expireHolds() {
  setExpiringHolds(true);
  try {
    await runHoldExpirationWorkflow({
      expireHolds: reservationApi.expireHolds,
      reloadReservations: loadReservations,
      onSuccess: (result) => showToast(getExpireHoldsSuccessMessage(result), 'success'),
    });
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setExpiringHolds(false);
  }
}
```

- [ ] **Bước 5: Hiển thị lệnh và xóa các điều khiển không được hỗ trợ**

Thay thế giá trị hành động `AppLayout` bằng:

```jsx
actions={(
  <div className="row-flex" style={{ flexWrap: 'wrap' }}>
    <button
      className="btn btn-outline"
      onClick={expireHolds}
      disabled={loading || expiringHolds || isDemo}
    >
      <CalendarClock size={16} />
      {expiringHolds ? 'Đang xử lý...' : 'Xử lý giữ chỗ hết hạn'}
    </button>
    <button className="btn btn-outline" onClick={loadReservations} disabled={loading || expiringHolds}>
      <RefreshCw size={16} /> Tải lại
    </button>
  </div>
)}
```

Trong mỗi hàng hàng đợi, chỉ giữ lại hành động thông báo được hỗ trợ:

```jsx
<div className="queue-actions">
  {index === 0 && (
    <button className="btn btn-outline btn-sm" onClick={() => setNotifyTarget(item)}>
      <Bell size={13} /> Báo nhận
    </button>
  )}
</div>
```

- [ ] **Bước 6: Chạy kiểm thử hợp đồng trang và trợ giúp**

Chạy:

```powershell
node --test frontend/test/reservationFrontend.test.js
```

Dự kiến: cả 4 bài thi phù hợp đều ĐẠT.

- [ ] **Bước 7: Chạy bản dựng sản xuất và tìm lỗi mã nguồn tập trung**

Chạy:

```powershell
Push-Location frontend
npm.cmd exec -- eslint src/page/reservation/ReservationsLibrarianPage.jsx src/utils/reservationViewState.js test/reservationFrontend.test.js
Pop-Location
npm.cmd --prefix frontend run build
```

Dự kiến: ESLint thoát 0 và quá trình sản xuất Vite hoàn tất thành công.

- [ ] **Bước 8: Cam kết quy trình làm việc của thủ thư**

```powershell
git add -- frontend/src/page/reservation/ReservationsLibrarianPage.jsx frontend/test/reservationFrontend.test.js
git commit -m "fix: connect FE08 hold expiration workflow"
```

---

### Nhiệm vụ 4: Tài liệu lập kế hoạch và truy vết FE08

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-reservation-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/CHANGELOG.md`

**Giao diện:**
- Tiêu thụ: bằng chứng xác minh và thiết kế đã được phê duyệt từ Nhiệm vụ 1-3.
- Tạo ra: phạm vi FE08 hiện tại, ánh xạ nhiệm vụ theo yêu cầu và bản ghi thay đổi theo ngày.

- [ ] **Bước 1: Chỉnh sửa phạm vi gói FE08**

Cập nhật siêu dữ liệu `PLAN.md` lên `Updated: 2026-07-13`. Thay thế khung chỉ máy chủ bằng:

```markdown
## 1. Phạm vi

Duy trì phần đặt chỗ giao diện người dùng và máy chủ FE08 Giai đoạn 1 đã được phê duyệt từ `SPEC.md`.

Bao gồm:

- API đặt chỗ của thành viên và nhân viên hiện tại và màn hình giao diện người dùng.
- Kết xuất chuẩn của vòng đời đặt chỗ FE08 đã được phê duyệt.
- đặt chỗ lỗi API tiếng Việt cụ thể.
- Xử lý hàng đợi nhân viên thủ công và xử lý giữ hết hạn thủ công.
- Làm mới được máy chủ hỗ trợ sau khi hết hạn lưu giữ.

Không bao gồm:

- Triển khai mượn/trả hoặc hoàn tất FE07.
- Thay đổi tiến trình gửi email FE10.
- Phân trang đặt chỗ phía máy chủ.
- Tự động xử lý hàng đợi hoặc tác vụ hết hạn giữ sách.
```

Thêm tiểu mục `3.6 Tính đúng đắn của giao diện`:

```markdown
### 3.6 Tính đúng đắn của giao diện

- Ánh xạ `NOTIFIED` thành sẵn sàng nhận sách và `FULFILLED` thành đã hoàn tất.
- Chỉ giữ đặt chỗ `Đang chờ` (`ACTIVE`) trong hàng đợi của Thủ thư; chỉ hiển thị `Sẵn sàng nhận sách` (`NOTIFIED`) trong danh sách tất cả đặt chỗ.
- Sử dụng bộ phân giải lỗi tiếng Việt riêng cho đặt chỗ.
- Cho nhân viên sử dụng điểm cuối xử lý lượt giữ hết hạn hiện có và tải lại trạng thái máy chủ sau khi thành công.
- Không hiển thị điều khiển hoàn tất hoặc xóa chỉ tồn tại cục bộ.
```

Cập nhật Ghi chú đánh giá để họ không còn yêu cầu loại trừ màn hình giao diện người dùng nữa.

- [ ] **Bước 2: Thêm nhiệm vụ chính xác và truy vết**

Trong `TASKS.md`, cập nhật `Updated: 2026-07-13` và thêm:

```markdown
## 4. Nhiệm vụ bảo đảm tính đúng đắn của giao diện

- [x] FE08-T22 Ánh xạ `NOTIFIED` và `FULFILLED` thành trạng thái giao diện chuẩn.
- [x] FE08-T23 Chỉ giữ đặt chỗ `Đang chờ` (`ACTIVE`) trong hàng đợi của Thủ thư; loại `NOTIFIED` và trạng thái kết thúc khỏi thao tác hàng đợi.
- [x] FE08-T24 Bổ sung lỗi API tiếng Việt riêng cho đặt chỗ mà không ảnh hưởng API khác.
- [x] FE08-T25 Kết nối xử lý lượt giữ hết hạn của nhân viên với `POST /api/reservations/expire-holds`.
- [x] FE08-T26 Loại bỏ điều khiển hoàn tất và xóa chỉ tồn tại cục bộ.
- [x] FE08-T27 Bổ sung kiểm thử hồi quy giao diện tập trung vào vòng đời, cô lập lỗi và hợp đồng trang.
```

Đánh số lại các phần sau và thêm các hàng truy vết này:

```markdown
| FR-FE08-005 | FE08-T17, FE08-T19, FE08-T23 |
| FR-FE08-007 | FE08-T18, FE08-T22, FE08-T23 |
| FR-FE08-009 | FE08-T22, FE08-T23, FE08-T27 |
| FR-FE08-017 | FE08-T24, FE08-T27 |
| FR-FE08-019 | FE08-T25, FE08-T27 |
| NFR-FE08-UX-001 | FE08-T21, FE08-T24, FE08-T27 |
```

Thay thế danh sách kiểm tra xác thực bằng các lệnh chính xác thực sự chạy trong Nhiệm vụ 5 và chỉ
đánh dấu các lệnh chuyển là hoàn thành.

- [ ] **Bước 3: Thêm mục nhật ký thay đổi**

Thêm vào đầu `CHANGELOG.md` sau tiêu đề:

```markdown
## 2026-07-13 - Tính đúng đắn của giao diện được căn chỉnh theo vòng đời đã duyệt

- Đã ánh xạ `NOTIFIED` thành sẵn sàng nhận sách và `FULFILLED` thành đã hoàn tất trong mô hình giao diện dùng chung.
- Đã bổ sung lỗi API tiếng Việt riêng cho đặt chỗ mà không đổi FE07 hoặc hành vi API chung.
- Đã kết nối giao diện Thủ thư với điểm cuối `POST /api/reservations/expire-holds` và tải lại trạng thái chuẩn của máy chủ sau khi thành công.
- Đã loại bỏ điều khiển hoàn tất và xóa chỉ tồn tại cục bộ, vốn không lưu trạng thái máy chủ.
- Đã bổ sung kiểm thử giao diện tập trung và làm mới khả năng truy vết kế hoạch/nhiệm vụ FE08.
- Không thay đổi hợp đồng máy chủ, lược đồ cơ sở dữ liệu, hoàn tất FE07, gửi FE10 hoặc phân trang.
```

- [ ] **Bước 4: Xác thực tính nhất quán của tài liệu**

Chạy:

```powershell
rg -n "backend-only|Frontend reservation screens|FE08-T2[2-7]|FR-FE08-019|Frontend Correctness Aligned" .sdd/specs/feat-reservation-management/PLAN.md .sdd/specs/feat-reservation-management/TASKS.md .sdd/specs/feat-reservation-management/CHANGELOG.md
```

Dự kiến: không có câu lệnh chỉ dành cho phần máy chủ/loại trừ phần giao diện người dùng cũ; ID nhiệm
vụ `FE08-T22` đến `FE08-T27`, `FR-FE08-019` và tiêu đề nhật ký thay đổi ngày đều có mặt.

- [ ] **Bước 5: Cam kết tài liệu FE08**

```powershell
git add -- .sdd/specs/feat-reservation-management/PLAN.md .sdd/specs/feat-reservation-management/TASKS.md .sdd/specs/feat-reservation-management/CHANGELOG.md
git commit -m "docs: refresh FE08 frontend traceability"
```

---

### Nhiệm vụ 5: Xác minh và đánh giá đầy đủ

**Tệp:**
- Chỉ xác minh; chỉ sửa đổi tệp nếu lỗi được phát hiện trực tiếp nằm trong phạm vi FE08 đã được phê duyệt.

**Giao diện:**
- Tiêu thụ: tất cả các thay đổi từ Nhiệm vụ 1-4.
- Tạo ra: kiểm tra, tìm lỗi mã nguồn, xây dựng, hồi quy máy chủ, phạm vi và xem xét bằng chứng phù hợp cho yêu cầu hợp nhất.

- [ ] **Bước 1: Chạy bộ kiểm thử giao diện người dùng hoàn chỉnh**

```powershell
npm.cmd --prefix frontend test
```

Dự kiến: tất cả các kiểm thử Nút giao diện người dùng ĐẠT.

- [ ] **Bước 2: Chạy bộ tìm lỗi mã nguồn giao diện người dùng hoàn chỉnh**

```powershell
npm.cmd --prefix frontend run lint
```

Dự kiến: mã thoát 0 không có lỗi ESLint.

- [ ] **Bước 3: Chạy bản dựng sản xuất giao diện người dùng**

```powershell
npm.cmd --prefix frontend run build
```

Dự kiến: Vite hoàn thành thành công và ghi `frontend/dist/`.

- [ ] **Bước 4: Chạy kiểm thử hồi quy máy chủ**

```powershell
npm.cmd --prefix backend test
```

Dự kiến: tất cả các bộ Jest ĐẠT, bao gồm cả các kiểm thử hết hạn đặt chỗ và khuyến mãi.

- [ ] **Bước 5: Kiểm tra phạm vi và khoảng trắng**

```powershell
git diff main...HEAD --check
git diff main...HEAD --stat
git status --short
```

Dự kiến: chỉ giao diện người dùng FE08, các kiểm thử, tài liệu kế hoạch/thiết kế đã được phê duyệt
và tài liệu đặc tả FE08 mới được theo dõi các thay đổi; `backend/coverage/` và
`docs/briefing-thuyet-trinh-du-an-vi.docx` vẫn không bị theo dõi và không bị ảnh hưởng.

- [ ] **Bước 6: Xem xét thiết kế đã được phê duyệt**

Gọi `superpowers:requesting-code-review`. Đánh giá cụ thể cho:

```text
- tính đúng đắn của vòng đời NOTIFIED và FULFILLED
- cô lập lỗi đặt chỗ
- POST /api/reservations/expire-holds request shape
- reload-after-success behavior
- không có hành động hoàn tất/xóa chỉ tồn tại cục bộ
- không mở rộng FE07, phân trang, lược đồ hoặc hợp đồng máy chủ
```

Dự kiến: không có phát hiện nào ở mức độ nghiêm trọng cao hoặc trung bình chưa được giải quyết. Khắc
phục mọi phát hiện trong phạm vi bằng kiểm thử tập trung và cam kết trước khi tiếp tục.

- [ ] **Bước 7: Ghi lại bằng chứng xác minh cuối cùng trong TASKS.md nếu số lượng thay đổi**

Chỉ cập nhật các dòng xác thực trong `.sdd/specs/feat-reservation-management/TASKS.md` với số lần
kiểm tra giao diện/máy chủ thực tế đạt, sau đó chạy:

```powershell
git add -- .sdd/specs/feat-reservation-management/TASKS.md
git commit -m "docs: record FE08 verification evidence"
```

Dự kiến: một cam kết bằng chứng xác minh được tạo hoặc không cần cam kết nào vì Nhiệm vụ 4 đã ghi
lại số lượng chính xác cuối cùng.

- [ ] **Bước 8: Chuẩn bị nhánh để người dùng xem xét**

```powershell
git status --short --branch
git log --oneline main..HEAD
```

Dự kiến: nhánh là `fix/fe08-frontend-correctness`, cây làm việc được theo dõi sạch sẽ, các tệp không
bị theo dõi không liên quan vẫn còn và danh sách cam kết chứa các cam kết nhỏ chỉ dành cho FE08.
