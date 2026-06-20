export const BORROW_RECORDS_KEY = 'library.borrowRecords';
export const FINE_RECORDS_KEY = 'library.fineRecords';
export const DAILY_FINE_RATE = 5000;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getBorrowRecords() {
  return readJson(BORROW_RECORDS_KEY, []);
}

export function saveBorrowRecords(records) {
  writeJson(BORROW_RECORDS_KEY, records);
}

export function addBorrowRecord(record) {
  const records = getBorrowRecords();
  const nextId = records.reduce((max, item) => Math.max(max, Number(item.borrowDetailId) || 0), 8000) + 1;
  const nextRecord = {
    borrowDetailId: nextId,
    status: 'BORROWED',
    returnDate: '',
    createdAt: new Date().toISOString(),
    ...record,
  };

  saveBorrowRecords([nextRecord, ...records]);
  return nextRecord;
}

export function getFineRecords() {
  return readJson(FINE_RECORDS_KEY, []);
}

export function saveFineRecords(records) {
  writeJson(FINE_RECORDS_KEY, records);
}

export function calculateOverdueDays(dueDate, returnDate, todayValue = new Date().toISOString().slice(0, 10)) {
  if (!dueDate) {
    return 0;
  }

  const due = new Date(`${dueDate}T00:00:00`);
  const end = new Date(`${returnDate || todayValue}T00:00:00`);
  const diff = Math.floor((end - due) / 86400000);
  return Math.max(diff, 0);
}

export function getMemberUnpaidFineSummary(memberCode) {
  const normalizedCode = String(memberCode || '').trim().toUpperCase();

  if (!normalizedCode) {
    return { count: 0, amount: 0 };
  }

  const fines = getFineRecords().filter(
    (fine) =>
      String(fine.memberCode || '').trim().toUpperCase() === normalizedCode &&
      fine.status === 'UNPAID' &&
      Number(fine.amount || 0) > 0
  );

  return {
    count: fines.length,
    amount: fines.reduce((total, fine) => total + Number(fine.amount || 0), 0),
  };
}
