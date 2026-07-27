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

test('staff navigation includes separate Books, Inventory and Fines pages', async () => {
  const navigation = await import('../src/utils/appNavigation.js');

  assert.deepEqual(
    navigation.getVisibleNavigation(['LIBRARIAN']).map((item) => item.key),
    [
      'library-home',
      'home',
      'borrow-requests-admin',
      'process-returns',
      'reservations-librarian',
      'member-details',
      'membership-review',
      'book-management',
      'inventory-management',
      'fine-management',
      'borrowing-report',
      'inventory-report',
      'user-statistics',
    ],
  );
  assert.equal(navigation.getActiveNavigationKey('/librarian/inventory'), 'inventory-management');
  assert.equal(navigation.getActiveNavigationKey('/librarian/books'), 'book-management');
  assert.equal(navigation.getActiveNavigationKey('/librarian/fines'), 'fine-management');
});

// @spec NFR-FE08-UX-004 — toast queue FIFO để warning không thay thế success đang hiển thị.
test('useToast exposes a FIFO queue so a later toast waits for the current one', async () => {
  const feedback = await readFile(new URL('../src/component/shared/Feedback.jsx', import.meta.url), 'utf8');

  // Queue state shape
  assert.match(feedback, /const \[queue, setQueue\] = useState\(\[\]\)/);
  // show() appends to queue (FIFO order preserved)
  assert.match(feedback, /setQueue\(\(current\) => \[\.\.\.current, \{ message, type \}\]\)/);
  // clear() advances the queue (removes head, not reset to null)
  assert.match(feedback, /setQueue\(\(current\) => current\.slice\(1\)\)/);
  // Exposed toast is the queue head, falling back to null when empty
  assert.match(feedback, /const toast = queue\[0\] \|\| null/);
  // Spec tag present so traceability is anchored
  assert.match(feedback, /@spec NFR-FE08-UX-004/);
});

test('Toast component auto-closes via the current toast reference and keeps the close button accessible', async () => {
  const feedback = await readFile(new URL('../src/component/shared/Feedback.jsx', import.meta.url), 'utf8');

  // useEffect keyed on `toast` + `onClose` so the timer resets when the queue advances
  assert.match(feedback, /useEffect\(\(\) => \{[\s\S]*?const duration = TOAST_DURATION[\s\S]*?setTimeout\(onClose, duration\)/);
  assert.match(feedback, /\}, \[toast, onClose\]\)/);
  // Icon-only close button exposes an accessible label
  assert.match(feedback, /aria-label="Đóng thông báo"/);
});
