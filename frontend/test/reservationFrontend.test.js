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
  assert.equal(isActiveReservationQueueStatus('Ready to pick up'), true);
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
