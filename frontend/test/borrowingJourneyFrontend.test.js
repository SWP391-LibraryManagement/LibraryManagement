import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { buildBorrowingJourney } from '../src/utils/borrowingJourney.js';
import { mapBorrowDetailsToHistoryRows } from '../src/utils/libraryFeatureViewModels.js';

test('borrowing journey renders a rejected request from canonical request state', () => {
  assert.deepEqual(
    buildBorrowingJourney({
      requestStatus: 'REJECTED',
      rawStatus: 'REQUESTED',
      requestDate: '2026-07-29T01:00:00Z',
      processedAt: '2026-07-29T02:00:00Z',
    }).map(({ label, state }) => ({ label, state })),
    [
      { label: 'Đã gửi yêu cầu', state: 'complete' },
      { label: 'Đã từ chối', state: 'current' },
    ],
  );
});

test('borrowing journey represents borrowed and returned states without invented timestamps', () => {
  assert.deepEqual(
    buildBorrowingJourney({
      requestStatus: 'APPROVED',
      rawStatus: 'BORROWED',
      requestDate: '2026-07-29T01:00:00Z',
      approvedAt: '2026-07-29T02:00:00Z',
      borrowDate: '2026-07-29',
    }),
    [
      {
        key: 'requested',
        label: 'Đã gửi yêu cầu',
        state: 'complete',
        at: '2026-07-29T01:00:00Z',
      },
      {
        key: 'approved',
        label: 'Đã duyệt',
        state: 'complete',
        at: '2026-07-29T02:00:00Z',
      },
      {
        key: 'borrowed',
        label: 'Đang mượn',
        state: 'current',
        at: '2026-07-29',
      },
    ],
  );

  const returned = buildBorrowingJourney({
    requestStatus: 'APPROVED',
    rawStatus: 'RETURNED',
    requestDate: null,
    approvedAt: null,
    borrowDate: null,
    returnDate: '2026-08-02',
  });

  assert.deepEqual(returned.map(({ label, state }) => ({ label, state })), [
    { label: 'Đã gửi yêu cầu', state: 'complete' },
    { label: 'Đã duyệt', state: 'complete' },
    { label: 'Đang mượn', state: 'complete' },
    { label: 'Đã trả', state: 'current' },
  ]);
  assert.deepEqual(returned.map(({ at }) => at), [null, null, null, '2026-08-02']);
});

test('history projection preserves only canonical journey fields and null timestamps', () => {
  const [row] = mapBorrowDetailsToHistoryRows([{
    borrowDetailId: 71,
    requestId: 31,
    copyId: 5,
    status: 'REQUESTED',
    requestStatus: 'PENDING',
    requestDate: '2026-07-29T01:00:00Z',
    approvedAt: null,
    processedAt: null,
    createdAt: '2026-07-29T01:00:01Z',
    updatedAt: null,
  }]);

  assert.equal(row.rawStatus, 'REQUESTED');
  assert.equal(row.requestStatus, 'PENDING');
  assert.equal(row.requestDate, '2026-07-29T01:00:00Z');
  assert.equal(row.approvedAt, null);
  assert.equal(row.processedAt, null);
  assert.equal(row.updatedAt, null);
});

test('history page renders an accessible canonical journey timeline', async () => {
  const page = await readFile(
    new URL('../src/page/borrowing/BorrowingHistoryPage.jsx', import.meta.url),
    'utf8',
  );
  const component = await readFile(
    new URL('../src/component/borrowing/BorrowingJourneyTimeline.jsx', import.meta.url),
    'utf8',
  );

  assert.match(page, /<BorrowingJourneyTimeline row=\{row\} \/>/);
  assert.match(component, /aria-label=\{`Hành trình \$\{row\.title\}`\}/);
  assert.match(component, /buildBorrowingJourney\(row\)/);
  assert.doesNotMatch(component, /new Date\(\)/);
});
