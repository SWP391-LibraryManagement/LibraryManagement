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
  const methods = ['create', 'listMine', 'cancel', 'listAll', 'processQueue', 'process', 'expireHolds'];

  for (const method of methods) {
    const methodSource = getReservationApiMethod(reservationApiSource, method);
    assert.match(methodSource, /\bauthorizedReservationRequest\(/, method);
    assert.doesNotMatch(methodSource, /\bauthorizedRequest\(/, method);
  }
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
  assert.match(loadReservationsSource, /const data = await reservationApi\.listAll\(\)/);
  assert.match(loadReservationsSource, /setRows\(\[\]\)/);
  assert.doesNotMatch(source, /DEMO_ALL_RESERVATIONS/);
  assert.match(source, /runHoldExpirationWorkflow/);
  assert.match(source, /isActiveReservationQueueStatus\(item\.status\)/);
  assert.match(source, /expireHolds: reservationApi\.expireHolds/);
  assert.match(source, /reloadReservations: loadReservations/);
  assert.match(source, /onSuccess: \(result\) => showToast\(getExpireHoldsSuccessMessage\(result\), 'success'\)/);
  assert.match(source, /disabled=\{loading \|\| expiringHolds\}/);
  assert.match(source, /onClick=\{loadReservations\} disabled=\{loading \|\| expiringHolds\}/);
  assert.match(source, /POST \/api\/reservations\/expire-holds/);
  assert.doesNotMatch(source, /function fulfill\(/);
  assert.doesNotMatch(source, /function remove\(/);
  assert.doesNotMatch(source, /> Đã giao</);
  assert.doesNotMatch(source, /title="Xóa"/);
  assert.doesNotMatch(source, /item\.status !== 'Ready to pick up'/);
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
  assert.match(mine, /setReservations\(\[\]\)/);
  assert.match(mine, /await reservationApi\.cancel\(cancelTarget\.reservationId/);
  assert.doesNotMatch(staff, /DEMO_ALL_RESERVATIONS/);
  assert.match(staff, /reservationApi\.listAll\(\)/);
  assert.match(mine, /pending=\{cancelling\}/);
  assert.match(staff, /pending=\{notifying\}/);
  assert.doesNotMatch(mine, /<table className="lib-table"/);
  assert.doesNotMatch(staff, /<table className="lib-table"/);
});
