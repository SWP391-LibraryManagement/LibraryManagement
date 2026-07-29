import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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

async function loadReservationHandoffState() {
  try {
    return await import('../src/utils/reservationHandoffState.js');
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
  const notified = mapReservation({
    reservationId: 8,
    copyId: 10,
    status: 'NOTIFIED',
    notifiedAt: '2026-07-27T00:00:00.000Z',
    expiresAt: '2026-07-29T00:00:00.000Z',
    copy: { bookId: 12 },
  });
  assert.equal(notified.bookId, 12);
  assert.equal(notified.pickupStart, '2026-07-27T00:00:00.000Z');
  assert.equal(notified.deadline, '2026-07-29T00:00:00.000Z');
});

test('reservation queue position is copy-scoped and never invented when absent', async () => {
  const { formatReservationQueuePosition, mapReservation } = await loadViewModels();
  const memberPage = await readFile(
    new URL('../src/page/reservation/MyReservationsPage.jsx', import.meta.url),
    'utf8',
  );
  const staffPage = await readFile(
    new URL('../src/page/reservation/ReservationsLibrarianPage.jsx', import.meta.url),
    'utf8',
  );

  assert.equal(mapReservation({ reservationId: 9, status: 'NOTIFIED' }).queue, null);
  assert.equal(typeof formatReservationQueuePosition, 'function');
  assert.equal(formatReservationQueuePosition(null), 'Chưa xác định');
  assert.equal(formatReservationQueuePosition(undefined), 'Chưa xác định');
  assert.equal(
    formatReservationQueuePosition(2, 'cuốn này'),
    '#2 trong hàng đợi cuốn này',
  );
  assert.match(memberPage, /Vị trí của bản sách/);
  assert.match(memberPage, /formatReservationQueuePosition\(item\.queue, 'cuốn này'\)/);
  assert.match(staffPage, /formatReservationQueuePosition\(item\.queue, 'cuốn sách này'\)/);
  assert.doesNotMatch(memberPage, /#\{(?:item|next|cancelTarget)\.queue\}/);
  assert.doesNotMatch(staffPage, /#\{item\.queue\}/);
});

test('member reservation view separates current state from terminal history and uses visible badge tones', async () => {
  const { memberReservationBadgeStatus, splitMemberReservations } = await loadViewModels();
  const rows = [
    { reservationId: 1, rawStatus: 'CANCELLED' },
    { reservationId: 2, rawStatus: 'ACTIVE' },
    { reservationId: 3, rawStatus: 'NOTIFIED' },
    { reservationId: 4, rawStatus: 'FULFILLED' },
  ];

  assert.deepEqual(splitMemberReservations(rows), {
    current: [rows[1], rows[2]],
    history: [rows[0], rows[3]],
  });
  assert.equal(memberReservationBadgeStatus('ACTIVE'), 'waiting');
  assert.equal(memberReservationBadgeStatus('NOTIFIED'), 'ready');
  assert.equal(memberReservationBadgeStatus('CANCELLED'), 'cancelled');
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

test('hold expiration workflow expires before reloading canonical state and then reports success', async () => {
  const { runHoldExpirationWorkflow } = await loadReservationViewState();
  const calls = [];

  const result = await runHoldExpirationWorkflow({
    expireHolds: async () => {
      calls.push('expire');
      return { expiredCount: 2 };
    },
    reloadReservations: async (options) => {
      calls.push(['reload', options]);
    },
    onSuccess: (expirationResult) => {
      calls.push(['success', expirationResult]);
    },
  });

  assert.deepEqual(calls, [
    'expire',
    ['reload', { fallbackToDemo: false }],
    ['success', { expiredCount: 2 }],
  ]);
  assert.deepEqual(result, { expiredCount: 2 });
});

test('hold expiration workflow propagates reload failures without reporting success', async () => {
  const { runHoldExpirationWorkflow } = await loadReservationViewState();
  const reloadError = new Error('Reload failed');
  const calls = [];

  await assert.rejects(
    runHoldExpirationWorkflow({
      expireHolds: async () => {
        calls.push('expire');
        return { expiredCount: 2 };
      },
      reloadReservations: async (options) => {
        calls.push(['reload', options]);
        throw reloadError;
      },
      onSuccess: () => {
        calls.push('success');
      },
    }),
    reloadError,
  );

  assert.deepEqual(calls, [
    'expire',
    ['reload', { fallbackToDemo: false }],
  ]);
});

async function loadReservationApiSource() {
  return readFile(
    new URL('../src/api/libraryFeatureApi.js', import.meta.url),
    'utf8',
  );
}

function getReservationApiObject(source) {
  const match = source.match(/export const reservationApi = \{([\s\S]*?)\r?\n\};\r?\n\r?\nexport const reportApi/);
  assert.ok(match, 'reservationApi object must be declared before reportApi');
  return match[1];
}

function getReservationApiMethod(reservationApiSource, method) {
  const match = reservationApiSource.match(new RegExp(`\\r?\\n  ${method}\\([^)]*\\) \\{([\\s\\S]*?)\\r?\\n  },`));
  assert.ok(match, `reservationApi.${method}() must be declared`);
  return match[1];
}

test('reservation API routes every method through the reservation resolver', async () => {
  const reservationApiSource = getReservationApiObject(await loadReservationApiSource());
  const methods = ['create', 'listCandidates', 'listMine', 'cancel', 'listAll', 'processQueue', 'expireHolds'];

  for (const method of methods) {
    const methodSource = getReservationApiMethod(reservationApiSource, method);
    assert.match(methodSource, /\bauthorizedReservationRequest\(/, method);
    assert.doesNotMatch(methodSource, /\bauthorizedRequest\(/, method);
  }
  assert.doesNotMatch(reservationApiSource, /\r?\n {2}process\(/);
});

test('reservation candidate API uses the protected server catalog contract', async () => {
  const reservationApiSource = getReservationApiObject(await loadReservationApiSource());
  const listCandidatesSource = getReservationApiMethod(reservationApiSource, 'listCandidates');

  assert.match(listCandidatesSource, /method: 'get', url: '\/reservations\/candidates', params/);
  assert.match(listCandidatesSource, /authorizedReservationRequest\(/);
});

test('reservation API posts hold expiration without a request body', async () => {
  const reservationApiSource = getReservationApiObject(await loadReservationApiSource());
  const expireHoldsSource = getReservationApiMethod(reservationApiSource, 'expireHolds');

  assert.match(
    expireHoldsSource,
    /method: 'post', url: '\/reservations\/expire-holds'/,
  );
  assert.doesNotMatch(expireHoldsSource, /\bdata\s*:/);
});

test('librarian page wires the hold expiration workflow and omits local-only actions', async () => {
  const source = await readFile(
    new URL('../src/page/reservation/ReservationsLibrarianPage.jsx', import.meta.url),
    'utf8',
  );
  const loadReservationsStart = source.indexOf('async function loadReservations');
  const loadReservationsEnd = source.indexOf('\n  useEffect(', loadReservationsStart);
  const loadReservationsSource = source.slice(loadReservationsStart, loadReservationsEnd);

  assert.match(source, /async function loadReservations\(\)/);
  assert.match(loadReservationsSource, /reservationApi\.listAll\(\{ page, limit: RESERVATION_API_PAGE_SIZE \}\)/);
  assert.match(loadReservationsSource, /setRows\(\[\]\)/);
  assert.doesNotMatch(source, /DEMO_ALL_RESERVATIONS/);
  assert.match(source, /runHoldExpirationWorkflow/);
  assert.match(source, /isActiveReservationQueueStatus\(item\.status\)/);
  assert.match(source, /item\.copyId === queueCopyId/);
  assert.match(source, /reservationApi\.processQueue\(notifyTarget\.copyId\)/);
  const confirmNotifyStart = source.indexOf('async function confirmNotify');
  const confirmNotifyEnd = source.indexOf('async function expireHolds', confirmNotifyStart);
  const confirmNotifySource = source.slice(confirmNotifyStart, confirmNotifyEnd);
  assert.match(
    confirmNotifySource,
    /const result = await reservationApi\.processQueue\(notifyTarget\.copyId\)/,
  );
  assert.match(confirmNotifySource, /result\.selectedReservation/);
  assert.match(confirmNotifySource, /mapReservation\(result\.selectedReservation\)/);
  assert.match(confirmNotifySource, /result\.notificationWarning/);
  assert.match(
    confirmNotifySource,
    /showToast\(result\.notificationWarning\.message,\s*'warning'\)/,
  );
  assert.match(
    confirmNotifySource,
    /error\?\.cause\?\.response\?\.status === 409[\s\S]*await loadReservations\(\)/,
  );
  assert.doesNotMatch(confirmNotifySource, /notifyTarget\.member/);
  const confirmDialogStart = source.indexOf('{notifyTarget && (');
  const confirmDialogEnd = source.indexOf('<Toast', confirmDialogStart);
  const confirmDialogSource = source.slice(confirmDialogStart, confirmDialogEnd);
  assert.doesNotMatch(confirmDialogSource, /notifyTarget\.member/);
  assert.match(confirmDialogSource, /máy chủ sẽ kiểm tra lại thành viên đầu tiên đủ điều kiện/i);
  assert.doesNotMatch(source, /reservationApi\.process\(/);
  assert.match(source, /expireHolds: reservationApi\.expireHolds/);
  assert.match(source, /reloadReservations: loadReservations/);
  assert.match(source, /onSuccess: \(result\) => \{/);
  assert.match(source, /showToast\(getExpireHoldsSuccessMessage\(result\), 'success'\)/);
  assert.match(source, /disabled=\{loading \|\| expiringHolds\}/);
  assert.match(source, /onClick=\{loadReservations\} disabled=\{loading \|\| expiringHolds\}/);
  assert.match(source, /POST \/api\/reservations\/expire-holds/);
  assert.doesNotMatch(source, /function fulfill\(/);
  assert.doesNotMatch(source, /function remove\(/);
  assert.doesNotMatch(source, /> Đã giao</);
  assert.doesNotMatch(source, /title="Xóa"/);
  assert.doesNotMatch(source, /item\.status !== 'Ready to pick up'/);
});

test('return handoff opens the exact reservation queue selected by FE07', async () => {
  const source = await readFile(
    new URL('../src/page/reservation/ReservationsLibrarianPage.jsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /import \{ useLocation \} from 'react-router-dom'/);
  assert.match(source, /const location = useLocation\(\)/);
  assert.match(source, /const handoffCopyId = Number\(location\.state\?\.copyId\)/);
  assert.match(
    source,
    /const initialQueueCopyId = Number\.isInteger\(handoffCopyId\)[\s\S]*\? handoffCopyId[\s\S]*: null/,
  );
  assert.match(source, /useState\(initialQueueCopyId \? 'queue' : 'list'\)/);
  assert.match(source, /useState\(initialQueueCopyId\)/);
  assert.match(source, /const pendingHandoffCopyId = useRef\(initialQueueCopyId\)/);
  assert.match(source, /pendingHandoffCopyId\.current = null/);
  assert.match(source, /resolveReservationQueueHandoff\(\{/);
  assert.match(source, /setQueueNotice\(handoffState\.notice\)/);
  assert.match(source, /<option value="" disabled>Chọn bản sao xem hàng đợi<\/option>/);
  assert.match(source, /\/\/ @spec FR-FE08-035, FR-FE08-039, AC-FE08-022/);
  assert.doesNotMatch(source, /useEffect\(\(\) => \{[\s\S]*setQueueCopyId\(handoffCopyId\)/);
});

test('stale FE07 handoff never falls back to a different active reservation queue', async () => {
  const { resolveReservationQueueHandoff, STALE_QUEUE_HANDOFF_NOTICE } = await loadReservationHandoffState();

  assert.equal(typeof resolveReservationQueueHandoff, 'function');
  assert.deepEqual(
    resolveReservationQueueHandoff({
      pendingCopyId: 42,
      currentCopyId: 42,
      reservations: [
        { copyId: 42, status: 'Ready to pick up' },
        { copyId: 99, status: 'Waiting' },
      ],
    }),
    {
      queueCopyId: null,
      notice: STALE_QUEUE_HANDOFF_NOTICE,
      consumePendingHandoff: true,
    },
  );
});

test('queue selection falls back only when no FE07 handoff is pending', async () => {
  const { resolveReservationQueueHandoff } = await loadReservationHandoffState();

  assert.equal(typeof resolveReservationQueueHandoff, 'function');
  assert.deepEqual(
    resolveReservationQueueHandoff({
      pendingCopyId: null,
      currentCopyId: null,
      reservations: [
        { copyId: 42, status: 'Ready to pick up' },
        { copyId: 99, status: 'Waiting' },
      ],
    }),
    {
      queueCopyId: 99,
      notice: '',
      consumePendingHandoff: false,
    },
  );
});

test('FE08 pages adopt shared operational patterns and staff page uses canonical API data', async () => {
  const mine = await readFile(new URL('../src/page/reservation/MyReservationsPage.jsx', import.meta.url), 'utf8');
  const staff = await readFile(new URL('../src/page/reservation/ReservationsLibrarianPage.jsx', import.meta.url), 'utf8');

  assert.match(mine, /DataToolbar/);
  for (const source of [mine, staff]) {
    assert.match(source, /DataTable/);
    assert.match(source, /ConfirmAction/);
  }
  assert.doesNotMatch(mine, /DEMO_MY_RESERVATIONS|RS-DEMO|Backend chưa nhận yêu cầu/);
  assert.doesNotMatch(mine, /DEMO_RESERVABLE|useMemo/);
  assert.match(mine, /reservationApi\.listCandidates/);
  assert.match(mine, /searchParams\.get\('bookId'\)/);
  assert.match(mine, /publicBrowseApi\.detail\(requestedBookId\)/);
  assert.match(mine, /setSearch\(selectedTitle\)/);
  assert.match(mine, /@spec FR-FE08-031/);
  assert.match(mine, /@spec FR-FE08-032/);
  assert.match(mine, /@spec FR-FE08-033/);
  assert.match(mine, /candidate\.copyId/);
  assert.match(mine, /activeReservedCopyIds/);
  assert.match(mine, /isOpenMemberReservationStatus/);
  assert.match(mine, /item\.rawStatus/);
  assert.doesNotMatch(mine, /!\['Cancelled', 'Expired'\]\.includes\(item\.status\)/);
  assert.doesNotMatch(mine, /visibleCandidates/);
  assert.match(mine, /candidate\.hasActiveReservation/);
  assert.match(mine, /hasActiveReservation: true/);
  assert.match(mine, /Đang đặt chỗ/);
  assert.match(mine, /Đến lượt bạn/);
  assert.match(mine, /splitMemberReservations/);
  assert.match(mine, /getStatusLabel\(item\.status\)/);
  assert.match(mine, /memberReservationBadgeStatus\(item\.rawStatus\)/);
  assert.match(mine, /Sách "\$\{item\.title\}" đã sẵn sàng nhận/);
  assert.match(mine, /\/borrowing\/new\?bookId=\$\{item\.bookId\}&copyId=\$\{item\.copyId\}/);
  assert.doesNotMatch(mine, /Danh sách đang được đồng bộ từ thư viện|Đã cập nhật dữ liệu/);
  assert.doesNotMatch(mine, /candidate\.availableCopies|candidate\.eta|book\.availableCopies|book\.eta/);
  assert.match(mine, /setReservations\(\[\]\)/);
  assert.match(mine, /await reservationApi\.cancel\(cancelTarget\.reservationId/);
  assert.doesNotMatch(staff, /DEMO_ALL_RESERVATIONS/);
  assert.match(staff, /reservationApi\.listAll\(\{ page, limit: RESERVATION_API_PAGE_SIZE \}\)/);
  assert.match(mine, /reservationApi\.listMine\(\{ page, limit: RESERVATION_API_PAGE_SIZE \}\)/);
  assert.match(mine, /pending=\{cancelling\}/);
  assert.match(staff, /pending=\{notifying\}/);
  assert.doesNotMatch(mine, /<table className="lib-table"/);
  assert.doesNotMatch(staff, /<table className="lib-table"/);
});

// @spec NFR-FE08-A11Y-001 — librarian tablist tuân thủ WAI-ARIA tab pattern + arrow-key navigation.
// Đồng thời verify `<span class="reservation-updated">` không còn nằm trong role="tablist" (vi phạm ARIA).
test('FE08 librarian tablist exposes roving tabIndex + arrow-key nav and keeps the updated span outside role=tablist', async () => {
  const staff = await readFile(new URL('../src/page/reservation/ReservationsLibrarianPage.jsx', import.meta.url), 'utf8');

  // Cấu trúc: `.reservation-tabs-bar` (wrapper) bọc `.reservation-tabs` (role=tablist) + `.reservation-updated`
  assert.match(staff, /<div className="reservation-tabs-bar">/);
  assert.match(staff, /<div className="reservation-tabs" role="tablist" aria-label="Chế độ xem đặt chỗ">/);
  // Span `reservation-updated` phải là sibling của tablist (không nằm trong role=tablist)
  // Verify bằng cách: trong block `.reservation-tabs-bar`, thẻ đóng của `.reservation-tabs` phải xuất hiện trước `<span className="reservation-updated`
  const barBlock = staff.match(/<div className="reservation-tabs-bar">[\s\S]*?<span className="reservation-updated/);
  assert.ok(barBlock, 'reservation-updated phải nằm sau .reservation-tabs trong khối .reservation-tabs-bar');
  assert.match(barBlock[0], /<\/div>\s*<span className="reservation-updated/);

  // Tabs có đủ ARIA attributes
  assert.match(staff, /role="tab"/);
  assert.match(staff, /id="reservation-tab-list"/);
  assert.match(staff, /id="reservation-tab-queue"/);
  assert.match(staff, /aria-selected=\{view === 'list'\}/);
  assert.match(staff, /aria-selected=\{view === 'queue'\}/);
  assert.match(staff, /aria-controls="reservation-tabpanel"/);
  // Roving tabindex
  assert.match(staff, /tabIndex=\{view === 'list' \? 0 : -1\}/);
  assert.match(staff, /tabIndex=\{view === 'queue' \? 0 : -1\}/);
  assert.match(staff, /onKeyDown=\{handleTabKeyDown\}/);

  // Handler phủ arrow keys + Home/End + preventDefault + focus
  assert.match(staff, /function handleTabKeyDown\(event\)/);
  assert.match(staff, /event\.key === 'ArrowRight' \|\| event\.key === 'ArrowDown'/);
  assert.match(staff, /event\.key === 'ArrowLeft' \|\| event\.key === 'ArrowUp'/);
  assert.match(staff, /event\.key === 'Home'/);
  assert.match(staff, /event\.key === 'End'/);
  assert.match(staff, /event\.preventDefault\(\)/);
  assert.match(staff, /document\.getElementById\(`reservation-tab-\$\{nextKey\}`\)\?\.focus\(\)/);
  assert.match(staff, /@spec NFR-FE08-A11Y-001/);
});

// @spec AT-007 — queue card không sáng tạo ordinal khi item.queue null; list view dùng formatReservationQueuePosition.
test('FE08 librarian queue card uses server queue position and renders em-dash for null instead of inventing an ordinal', async () => {
  const staff = await readFile(new URL('../src/page/reservation/ReservationsLibrarianPage.jsx', import.meta.url), 'utf8');

  // Queue card pos dùng `item.queue` (server position), fallback `—` cho null — không phải `index + 1`
  assert.match(staff, /<span className="queue-pos">\{item\.queue \?\? '—'\}<\/span>/);
  assert.doesNotMatch(staff, /<span className="queue-pos">\{index \+ 1\}<\/span>/);
  assert.doesNotMatch(staff, /<span className="queue-pos">\{item\.queue \?\? index \+ 1\}<\/span>/);
});
