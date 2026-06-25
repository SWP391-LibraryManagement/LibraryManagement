const AppException = require('../CustomException/AppException');

const DAILY_FINE_RATE = 5000;
const VALID_STATUSES = new Set(['UNPAID', 'PAID', 'WAIVED', 'CANCELLED']);
const TERMINAL_STATUSES = new Set(['PAID', 'WAIVED', 'CANCELLED']);

let fines = [
  {
    fineId: 9001,
    userId: 101,
    memberName: 'Nguyen Minh Anh',
    memberCode: 'USR-1001',
    email: 'minhanh@example.test',
    borrowDetailId: 7001,
    bookTitle: 'Clean Code',
    barcode: 'BC-CLN-001',
    dueDate: '2026-06-01',
    returnDate: '2026-06-08',
    overdueDays: 7,
    ratePerDay: DAILY_FINE_RATE,
    amount: 35000,
    paidAmount: 0,
    reason: 'OVERDUE',
    status: 'UNPAID',
    calculatedAt: '2026-06-08T09:30:00',
    paidAt: '',
    collectionNote: '',
    paymentMethod: '',
    collectedAt: '',
    collectedBy: '',
  },
  {
    fineId: 9002,
    userId: 104,
    memberName: 'Pham Gia Han',
    memberCode: 'USR-1004',
    email: 'giahan@example.test',
    borrowDetailId: 6998,
    bookTitle: 'JavaScript: The Good Parts',
    barcode: 'BC-JSG-002',
    dueDate: '2026-05-22',
    returnDate: '2026-05-25',
    overdueDays: 3,
    ratePerDay: DAILY_FINE_RATE,
    amount: 15000,
    paidAmount: 15000,
    reason: 'OVERDUE',
    status: 'PAID',
    calculatedAt: '2026-05-25T15:05:00',
    paidAt: '2026-05-25T15:20:00',
    collectionNote: 'Da thu tai quay luu thong.',
    paymentMethod: 'Tien mat',
    collectedAt: '2026-05-25T15:18:00',
    collectedBy: 'Thu thu demo',
  },
  {
    fineId: 9003,
    userId: 102,
    memberName: 'Tran Bao Long',
    memberCode: 'USR-1002',
    email: 'baolong@example.test',
    borrowDetailId: 7002,
    bookTitle: 'Database System Concepts',
    barcode: 'BC-DBS-014',
    dueDate: '2026-06-05',
    returnDate: '',
    overdueDays: 15,
    ratePerDay: DAILY_FINE_RATE,
    amount: 75000,
    paidAmount: 75000,
    reason: 'OVERDUE',
    status: 'PAID',
    calculatedAt: '2026-06-14T08:00:00',
    paidAt: '2026-06-20T09:00:00',
    collectionNote: 'Da thanh toan.',
    paymentMethod: 'Tien mat',
    collectedAt: '2026-06-20T09:00:00',
    collectedBy: 'Thu thu demo',
  },
];

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function positiveInt(value, fieldName) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new AppException(400, 'INVALID_FINE_FIELD', `${fieldName} must be a positive integer.`);
  }
  return numberValue;
}

function nonNegativeMoney(value, fieldName) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new AppException(400, 'INVALID_FINE_FIELD', `${fieldName} must be a non-negative number.`);
  }
  return Math.round(numberValue);
}

function positiveMoney(value, fieldName) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new AppException(400, 'INVALID_FINE_FIELD', `${fieldName} must be greater than zero.`);
  }
  return Math.round(numberValue);
}

function optionalDate(value, fieldName, required = false) {
  const text = cleanString(value);
  if (!text) {
    if (required) {
      throw new AppException(400, 'INVALID_FINE_FIELD', `${fieldName} is required.`);
    }
    return '';
  }

  if (Number.isNaN(new Date(text).getTime())) {
    throw new AppException(400, 'INVALID_FINE_FIELD', `${fieldName} must be a valid date.`);
  }

  return text;
}

function requiredText(value, fieldName, maxLength = 255) {
  const text = cleanString(value);
  if (!text) {
    throw new AppException(400, 'INVALID_FINE_FIELD', `${fieldName} is required.`);
  }
  if (text.length > maxLength) {
    throw new AppException(400, 'INVALID_FINE_FIELD', `${fieldName} must be ${maxLength} characters or fewer.`);
  }
  return text;
}

function normalizeFinePayload(body = {}, existingFineId = null) {
  const borrowDetailId = positiveInt(body.borrowDetailId, 'Borrow detail ID');
  const duplicate = fines.some(
    (fine) =>
      fine.borrowDetailId === borrowDetailId &&
      fine.reason === 'OVERDUE' &&
      Number(fine.fineId) !== Number(existingFineId)
  );

  if (duplicate) {
    throw new AppException(400, 'DUPLICATE_FINE', 'Borrow detail already has an overdue fine.');
  }

  const overdueDays = Number(body.overdueDays);
  if (!Number.isInteger(overdueDays) || overdueDays <= 0) {
    throw new AppException(400, 'INVALID_FINE_FIELD', 'Overdue days must be a positive integer.');
  }

  const ratePerDay = positiveMoney(body.ratePerDay ?? DAILY_FINE_RATE, 'Rate per day');
  const amount = body.amount === undefined || body.amount === ''
    ? overdueDays * ratePerDay
    : positiveMoney(body.amount, 'Amount');
  const status = requiredText(body.status || 'UNPAID', 'Status', 20).toUpperCase();

  if (!VALID_STATUSES.has(status)) {
    throw new AppException(400, 'INVALID_FINE_STATUS', 'Fine status must be UNPAID, PAID, WAIVED, or CANCELLED.');
  }

  return {
    userId: positiveInt(body.userId || body.memberId, 'User ID'),
    memberName: requiredText(body.memberName, 'Member name', 120),
    memberCode: requiredText(body.memberCode, 'Member code', 30),
    email: requiredText(body.email, 'Email', 120),
    borrowDetailId,
    bookTitle: requiredText(body.bookTitle, 'Book title', 255),
    barcode: requiredText(body.barcode, 'Barcode', 80),
    dueDate: optionalDate(body.dueDate, 'Due date', true),
    returnDate: optionalDate(body.returnDate, 'Return date'),
    overdueDays,
    ratePerDay,
    amount,
    paidAmount: status === 'PAID' ? amount : nonNegativeMoney(body.paidAmount || 0, 'Paid amount'),
    reason: cleanString(body.reason) || 'OVERDUE',
    status,
    calculatedAt: optionalDate(body.calculatedAt, 'Calculated at') || new Date().toISOString(),
    paidAt: status === 'PAID' ? optionalDate(body.paidAt, 'Paid at') || new Date().toISOString() : '',
    collectionNote: cleanString(body.collectionNote),
    paymentMethod: cleanString(body.paymentMethod),
    collectedAt: optionalDate(body.collectedAt, 'Collected at'),
    collectedBy: cleanString(body.collectedBy),
  };
}

function listFines({ status, q } = {}) {
  const normalizedStatus = cleanString(status).toUpperCase();
  const normalizedQuery = cleanString(q).toLowerCase();

  return fines.filter((fine) => {
    const matchesStatus = !normalizedStatus || normalizedStatus === 'ALL' || fine.status === normalizedStatus;
    const matchesQuery =
      !normalizedQuery ||
      fine.memberName.toLowerCase().includes(normalizedQuery) ||
      fine.memberCode.toLowerCase().includes(normalizedQuery) ||
      fine.bookTitle.toLowerCase().includes(normalizedQuery) ||
      String(fine.borrowDetailId).includes(normalizedQuery);

    return matchesStatus && matchesQuery;
  });
}

function createFine(body = {}) {
  // A fine is never "born resolved": it always starts UNPAID (state model [*] -> UNPAID).
  const payload = normalizeFinePayload({ ...body, status: 'UNPAID' });
  const nextFine = {
    fineId: fines.reduce((max, fine) => Math.max(max, fine.fineId), 9000) + 1,
    ...payload,
  };
  fines = [nextFine, ...fines];
  return nextFine;
}

function updateFine(fineId, body = {}) {
  const id = positiveInt(fineId, 'Fine ID');
  const existing = fines.find((fine) => fine.fineId === id);
  if (!existing) {
    throw new AppException(404, 'FINE_NOT_FOUND', 'Fine was not found.');
  }

  // INV-6: terminal states are final — no re-activation, no double collection.
  if (TERMINAL_STATUSES.has(existing.status)) {
    throw new AppException(409, 'FINE_NOT_EDITABLE', `Fine is already ${existing.status} and cannot be modified.`);
  }

  // INV-3: amount is immutable after creation.
  if (body.amount !== undefined && body.amount !== '' && Number(body.amount) !== Number(existing.amount)) {
    throw new AppException(400, 'FINE_AMOUNT_IMMUTABLE', 'Fine amount cannot be changed after creation.');
  }

  const payload = normalizeFinePayload({ ...existing, ...body }, id);
  const updated = { ...existing, ...payload };
  fines = fines.map((fine) => (fine.fineId === id ? updated : fine));
  return updated;
}

function deleteFine(fineId) {
  const id = positiveInt(fineId, 'Fine ID');
  const existing = fines.find((fine) => fine.fineId === id);
  if (!existing) {
    throw new AppException(404, 'FINE_NOT_FOUND', 'Fine was not found.');
  }
  fines = fines.filter((fine) => fine.fineId !== id);
  return existing;
}

function resetFines(nextFines = undefined) {
  fines = Array.isArray(nextFines) ? nextFines : [];
}

module.exports = {
  listFines,
  createFine,
  updateFine,
  deleteFine,
  resetFines,
};
