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

async function deactivateResource(resource, idInput) {
  const normalizedResource = normalizeResource(resource);
  const id = positiveInt(idInput);

  try {
    const affectedRows = await adminRepository.deactivateResource(normalizedResource, id);
    if (!affectedRows) {
      throw errors.notFound('ADMIN_RESOURCE_ITEM_NOT_FOUND', 'Item not found.');
    }
    return { deactivated: true, data: { id, status: 'INACTIVE' } };
  } catch (error) {
    if (error.number === 547) {
      throw errors.conflict('RESOURCE_IN_USE', 'This item is being used and cannot be deactivated.');
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

async function listRequests(filters = {}) {
  const status = cleanText(filters.status, 20).toUpperCase();
  if (status && !REQUEST_STATUSES.has(status)) {
    throw errors.badRequest('INVALID_REQUEST_STATUS', 'Request status is invalid.');
  }

  const fromDate = optionalDate(filters.fromDate, 'From date');
  const toDate = optionalDate(filters.toDate, 'To date');
  if (fromDate && toDate && fromDate > toDate) {
    throw errors.badRequest('INVALID_DATE_RANGE', 'From date cannot be after to date.');
  }

  return {
    data: await adminRepository.listRequests({
      q: cleanText(filters.q, 100),
      status,
      fromDate,
      toDate,
    }),
  };
}

module.exports = {
  getDashboard,
  listBooks,
  listResource,
  createResource,
  updateResource,
  deactivateResource,
  listBorrowings,
  listRequests,
};
