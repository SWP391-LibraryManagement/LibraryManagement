const adminRepository = require('../repositories/adminRepository');
const errors = require('../utils/safeErrors');

const RESOURCE_NAMES = new Set(['authors', 'publishers', 'categories']);
const BORROW_STATUSES = new Set(['REQUESTED', 'BORROWED', 'RETURNED', 'OVERDUE', 'LOST', 'DAMAGED']);
const REQUEST_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED']);

function cleanText(value, max = 120) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length > max) {
    throw errors.badRequest('INVALID_TEXT_LENGTH', `Text must be at most ${max} characters.`);
  }
  return text;
}

function positiveInt(value, fieldName = 'ID') {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw errors.badRequest('INVALID_ID', `${fieldName} must be a positive integer.`);
  }
  return numberValue;
}

function optionalDate(value, fieldName) {
  const text = cleanText(value, 20);
  if (!text) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(new Date(`${text}T00:00:00`).getTime())) {
    throw errors.badRequest('INVALID_DATE', `${fieldName} must use YYYY-MM-DD.`);
  }
  return text;
}

function normalizeResource(resource) {
  const value = String(resource || '').toLowerCase();
  if (!RESOURCE_NAMES.has(value) || !adminRepository.getResourceConfig(value)) {
    throw errors.notFound('ADMIN_RESOURCE_NOT_FOUND', 'Admin library resource not found.');
  }
  return value;
}

function normalizeName(body = {}) {
  const name = cleanText(body.name, 100);
  if (!name) {
    throw errors.badRequest('NAME_REQUIRED', 'Name is required.');
  }
  return name;
}

async function getDashboard() {
  return adminRepository.getDashboard();
}

async function listBooks(filters = {}) {
  return { data: await adminRepository.listBooks({
    q: cleanText(filters.q, 100),
    status: cleanText(filters.status, 20).toUpperCase(),
  }) };
}

async function listResource(resource, filters = {}) {
  const normalizedResource = normalizeResource(resource);
  return { data: await adminRepository.listResource(normalizedResource, { q: cleanText(filters.q, 100) }) };
}

async function createResource(resource, body = {}) {
  const normalizedResource = normalizeResource(resource);
  return { data: await adminRepository.createResource(normalizedResource, normalizeName(body)) };
}

async function updateResource(resource, idInput, body = {}) {
  const normalizedResource = normalizeResource(resource);
  const id = positiveInt(idInput);
  return { data: await adminRepository.updateResource(normalizedResource, id, normalizeName(body)) };
}

async function deleteResource(resource, idInput) {
  const normalizedResource = normalizeResource(resource);
  const id = positiveInt(idInput);

  try {
    const affectedRows = await adminRepository.deleteResource(normalizedResource, id);
    if (!affectedRows) {
      throw errors.notFound('ADMIN_RESOURCE_ITEM_NOT_FOUND', 'Item not found.');
    }
    return { deleted: true };
  } catch (error) {
    if (error.number === 547) {
      throw errors.conflict('RESOURCE_IN_USE', 'This item is being used by books and cannot be deleted.');
    }
    throw error;
  }
}

async function listBorrowings(filters = {}) {
  const status = cleanText(filters.status, 20).toUpperCase();
  if (status && !BORROW_STATUSES.has(status)) {
    throw errors.badRequest('INVALID_BORROW_STATUS', 'Borrowing status is invalid.');
  }
  return { data: await adminRepository.listBorrowings({ q: cleanText(filters.q, 100), status }) };
}

function normalizeBorrowingPayload(body = {}) {
  const status = cleanText(body.status, 20).toUpperCase() || 'BORROWED';
  if (!BORROW_STATUSES.has(status) || status === 'REQUESTED') {
    throw errors.badRequest('INVALID_BORROW_STATUS', 'Borrowing status is invalid.');
  }
  const borrowDate = optionalDate(body.borrowDate, 'Borrow date');
  const dueDate = optionalDate(body.dueDate, 'Due date');
  const returnDate = optionalDate(body.returnDate, 'Return date');
  if (!dueDate) {
    throw errors.badRequest('DUE_DATE_REQUIRED', 'Due date is required.');
  }
  if (borrowDate && returnDate && new Date(returnDate) < new Date(borrowDate)) {
    throw errors.badRequest('INVALID_RETURN_DATE', 'Return date cannot be before borrow date.');
  }

  return { borrowDate, dueDate, returnDate, status };
}

async function createBorrowing(body = {}) {
  const userId = positiveInt(body.userId, 'User ID');
  const copyId = positiveInt(body.copyId, 'Copy ID');
  return { data: await adminRepository.createBorrowing({ userId, copyId, ...normalizeBorrowingPayload(body) }) };
}

async function updateBorrowing(idInput, body = {}) {
  const id = positiveInt(idInput, 'Borrowing ID');
  return { data: await adminRepository.updateBorrowing(id, normalizeBorrowingPayload(body)) };
}

async function listRequests(filters = {}) {
  const status = cleanText(filters.status, 20).toUpperCase();
  if (status && !REQUEST_STATUSES.has(status)) {
    throw errors.badRequest('INVALID_REQUEST_STATUS', 'Request status is invalid.');
  }

  return {
    data: await adminRepository.listRequests({
      q: cleanText(filters.q, 100),
      status,
      fromDate: optionalDate(filters.fromDate, 'From date'),
      toDate: optionalDate(filters.toDate, 'To date'),
    }),
  };
}

async function updateRequestStatus(idInput, body = {}) {
  const id = positiveInt(idInput, 'Request ID');
  const status = cleanText(body.status, 20).toUpperCase();
  if (!['APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED'].includes(status)) {
    throw errors.badRequest('INVALID_REQUEST_STATUS', 'Request status update is invalid.');
  }

  const affectedRows = await adminRepository.updateRequestStatus(id, status);
  if (!affectedRows) {
    throw errors.conflict('REQUEST_NOT_EDITABLE', 'Only pending requests can be updated.');
  }

  return { data: { id, status } };
}

module.exports = {
  getDashboard,
  listBooks,
  listResource,
  createResource,
  updateResource,
  deleteResource,
  listBorrowings,
  createBorrowing,
  updateBorrowing,
  listRequests,
  updateRequestStatus,
};
