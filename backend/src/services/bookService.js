const defaultBookRepository = require('../repositories/bookRepository');
const defaultAuditLogRepository = require('../repositories/auditLogRepository');
const defaultBookCoverStorage = require('../utils/bookCoverStorage');
const AppException = require('../CustomException/AppException');
const path = require('path');

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=420&fit=crop&auto=format';
const BOOK_STATUSES = new Set(['ACTIVE', 'INACTIVE']);
const SORT_FIELDS = new Set(['title', 'publishYear', 'createdAt']);
const SORT_ORDERS = new Set(['asc', 'desc']);
const MAX_BOOK_COVER_BYTES = 2 * 1024 * 1024;
const ALLOWED_BOOK_COVER_TYPES = {
  'image/jpeg': new Set(['.jpg', '.jpeg']),
  'image/png': new Set(['.png']),
  'image/webp': new Set(['.webp']),
};
const BOOK_COVER_SIGNATURES = {
  'image/jpeg': (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  'image/png': (buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (buffer) => buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP',
};
const PROTECTED_MUTATION_FIELDS = [
  'status',
  'copyStatus',
  'availabilityStatus',
  'available',
  'availableCopies',
  'totalCopies',
  'lockedCopies',
  'version',
];

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function badField(field, message) {
  return new AppException(400, 'INVALID_BOOK_FIELD', message, [{ field, message }]);
}

function normalizePositiveInt(
  value,
  fieldName,
  { required = false, max = Number.MAX_SAFE_INTEGER } = {}
) {
  if (value === undefined || value === null || value === '') {
    if (required) throw badField(fieldName, `${fieldName} là bắt buộc.`);
    return null;
  }

  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0 || normalized > max) {
    throw badField(fieldName, `${fieldName} không hợp lệ.`);
  }
  return normalized;
}

function normalizeOptionalText(value, fieldName, maxLength) {
  const text = trimString(value);
  if (text.length > maxLength) {
    throw badField(fieldName, `${fieldName} không được vượt quá ${maxLength} ký tự.`);
  }
  return text;
}

function normalizeRating(value) {
  if (value === undefined || value === null || value === '') return 0;
  const text = String(value).trim();
  const rating = Number(text);
  if (!/^\d(?:\.\d)?$/.test(text) || !Number.isFinite(rating) || rating < 0 || rating > 5) {
    throw badField('rating', 'Đánh giá phải từ 0.0 đến 5.0 và có tối đa một chữ số thập phân.');
  }
  return rating;
}

function normalizeCoverUrl(value) {
  const coverUrl = normalizeOptionalText(value, 'coverUrl', 255);
  if (!coverUrl) return '';
  if (!coverUrl.startsWith('/') && !/^https?:\/\/[^\s]+$/i.test(coverUrl)) {
    throw badField('coverUrl', 'Cover URL phải là đường dẫn bắt đầu bằng / hoặc URL http(s).');
  }
  return coverUrl;
}

// @spec BR-FE05-019, FR-FE05-028
function validateBookCoverUpload(file) {
  if (!file) return;
  const extension = path.extname(String(file.originalName || '')).toLowerCase();
  const allowedExtensions = ALLOWED_BOOK_COVER_TYPES[file.mimeType];
  const hasValidSignature = BOOK_COVER_SIGNATURES[file.mimeType]?.(file.buffer);

  if (!file.buffer?.length || file.size !== file.buffer.length) {
    throw badField('cover', 'Tệp ảnh bìa không hợp lệ.');
  }
  if (file.size > MAX_BOOK_COVER_BYTES) {
    throw badField('cover', 'Ảnh bìa không được vượt quá 2 MB.');
  }
  if (!allowedExtensions?.has(extension) || !hasValidSignature) {
    throw badField('cover', 'Ảnh bìa phải là tệp JPG, PNG hoặc WebP hợp lệ.');
  }
}

function normalizeQueryText(filters, fieldName, maxLength) {
  if (filters[fieldName] === undefined) return '';
  const value = trimString(filters[fieldName]);
  if (!value) return '';
  if (value.length > maxLength) {
    throw new AppException(
      400,
      'INVALID_BOOK_QUERY',
      `${fieldName} phải có từ 1 đến ${maxLength} ký tự khi được cung cấp.`
    );
  }
  return value;
}

function normalizeListFilters(filters = {}, { staff = false } = {}) {
  // @spec FR-FE05-017
  const status = trimString(filters.status).toUpperCase();
  const sort = trimString(filters.sort) || 'title';
  const order = (trimString(filters.order) || 'asc').toLowerCase();

  if (status && (!staff || !BOOK_STATUSES.has(status))) {
    throw new AppException(400, 'INVALID_BOOK_STATUS', 'Trạng thái sách không hợp lệ.');
  }
  if (!SORT_FIELDS.has(sort)) {
    throw new AppException(400, 'INVALID_BOOK_SORT', 'Trường sắp xếp sách không hợp lệ.');
  }
  if (!SORT_ORDERS.has(order)) {
    throw new AppException(400, 'INVALID_BOOK_ORDER', 'Thứ tự sắp xếp sách không hợp lệ.');
  }

  return {
    q: normalizeQueryText(filters, 'q', 200),
    category: filters.category === undefined ? '' : normalizeQueryText(filters, 'category', 100),
    categoryId: normalizePositiveInt(filters.categoryId, 'categoryId'),
    authorId: normalizePositiveInt(filters.authorId, 'authorId'),
    publisherId: normalizePositiveInt(filters.publisherId, 'publisherId'),
    status: staff ? status : 'ACTIVE',
    page: normalizePositiveInt(filters.page, 'page') || 1,
    limit: normalizePositiveInt(filters.limit, 'limit', { max: 100 }) || 20,
    sort,
    order,
  };
}

function availabilityStatus(book) {
  if (book?.availabilityStatus) return book.availabilityStatus;
  return book?.status === 'ACTIVE' && Number(book?.availableCopies || 0) > 0
    ? 'AVAILABLE'
    : 'UNAVAILABLE';
}

function nullableValue(value) {
  if (value === undefined || value === null || value === '') return null;
  return value;
}

function mapPublicBook(book) {
  const availability = availabilityStatus(book);
  return {
    bookId: book.id,
    title: book.title,
    isbn: nullableValue(book.isbn),
    categoryName: nullableValue(book.category),
    authorName: nullableValue(book.author),
    publisherName: nullableValue(book.publisher),
    publishYear: nullableValue(book.year),
    description: nullableValue(book.description),
    coverUrl: nullableValue(book.cover || book.coverUrl),
    availabilityStatus: availability,
  };
}

function mapBook(book, { staff = false } = {}) {
  if (!book) return null;
  if (!staff) return mapPublicBook(book);

  const availability = availabilityStatus(book);
  return {
    id: book.id,
    title: book.title,
    isbn: book.isbn || '',
    category: book.category || 'Chưa phân loại',
    author: book.author || 'Không rõ tác giả',
    publisher: book.publisher || 'Không rõ nhà xuất bản',
    year: book.year || '',
    description: book.description || '',
    cover: book.cover || book.coverUrl || DEFAULT_COVER,
    rating: book.rating === null || book.rating === undefined ? 0 : Number(book.rating),
    pages: book.pages || 0,
    available: availability === 'AVAILABLE',
    availabilityStatus: availability,
    totalCopies: Number(book.totalCopies || 0),
    availableCopies: Number(book.availableCopies || 0),
    categoryId: book.categoryId || null,
    authorId: book.authorId || null,
    publisherId: book.publisherId || null,
    status: book.status,
    version: book.version,
    lockedCopies: Number(book.lockedCopies || 0),
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };
}

function normalizeRepositoryList(result) {
  if (Array.isArray(result)) return { rows: result, total: result.length };
  return { rows: result?.rows || [], total: Number(result?.total || 0) };
}

function listResponse(result, filters, { staff = false } = {}) {
  const normalized = normalizeRepositoryList(result);
  return {
    items: normalized.rows.map((book) => mapBook(book, { staff })),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: normalized.total,
      totalPages: normalized.total === 0 ? 0 : Math.ceil(normalized.total / filters.limit),
    },
  };
}

function normalizeIfMatch(value) {
  const version = trimString(Array.isArray(value) ? value[0] : value).replace(/^W\//, '').replace(/^"|"$/g, '');
  if (!version) {
    throw new AppException(409, 'STALE_BOOK_STATE', 'Book version is missing or stale. Reload before retrying.');
  }
  return version;
}

function normalizeReason(value) {
  const reason = trimString(value);
  if (!reason || reason.length > 500) {
    throw badField('reason', 'Lý do phải có từ 1 đến 500 ký tự.');
  }
  return reason;
}

function rejectProtectedFields(body = {}, { allowCreateStatus = false } = {}) {
  for (const field of PROTECTED_MUTATION_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    if (allowCreateStatus && field === 'status' && trimString(body.status).toUpperCase() === 'ACTIVE') {
      continue;
    }
    throw badField(field, `${field} không thuộc hợp đồng cập nhật metadata FE05.`);
  }
}

function createBookService({
  bookRepository = defaultBookRepository,
  auditLogRepository = defaultAuditLogRepository,
  bookCoverStorage = defaultBookCoverStorage,
} = {}) {
  async function cleanManagedCover(coverUrl) {
    if (!bookCoverStorage || typeof bookCoverStorage.deleteBookCoverFile !== 'function') return;
    try {
      await bookCoverStorage.deleteBookCoverFile(coverUrl);
    } catch {
      console.error('[book cover cleanup failed]');
    }
  }

  async function validateReferences(payload) {
    const [categoryExists, authorExists, publisherExists] = await Promise.all([
      bookRepository.referenceExists('Categories', 'CategoryId', payload.categoryId),
      bookRepository.referenceExists('Authors', 'AuthorId', payload.authorId),
      payload.publisherId
        ? bookRepository.referenceExists('Publishers', 'PublisherId', payload.publisherId)
        : true,
    ]);
    if (!categoryExists) throw badField('categoryId', 'Thể loại không tồn tại hoặc không hoạt động.');
    if (!authorExists) throw badField('authorId', 'Tác giả không tồn tại hoặc không hoạt động.');
    if (!publisherExists) throw badField('publisherId', 'Nhà xuất bản không tồn tại hoặc không hoạt động.');
  }

  async function normalizeBookPayload(body = {}, { existingBookId = null, create = false } = {}) {
    rejectProtectedFields(body, { allowCreateStatus: create });
    const title = normalizeOptionalText(body.title, 'title', 255);
    const isbn = normalizeOptionalText(body.isbn, 'isbn', 20);
    const categoryId = normalizePositiveInt(body.categoryId, 'categoryId', { required: true });
    const authorId = normalizePositiveInt(body.authorId, 'authorId', { required: true });
    const publisherId = normalizePositiveInt(body.publisherId, 'publisherId');
    const publishYear = normalizePositiveInt(body.publishYear, 'publishYear');
    const pages = normalizePositiveInt(body.pages, 'pages', { max: 10000 });
    const rating = normalizeRating(body.rating);
    const description = normalizeOptionalText(body.description, 'description', 2000);
    const coverUrl = normalizeCoverUrl(body.coverUrl || body.cover);

    if (!title) throw badField('title', 'Tên sách là bắt buộc.');
    if (publishYear && publishYear > new Date().getFullYear()) {
      throw badField('publishYear', 'Năm xuất bản không được lớn hơn năm hiện tại.');
    }
    if (isbn && (await bookRepository.isbnExists(isbn, existingBookId))) {
      throw badField('isbn', 'ISBN đã tồn tại.');
    }

    const payload = {
      title,
      isbn,
      categoryId,
      authorId,
      publisherId,
      publishYear,
      pages,
      rating,
      description,
      coverUrl,
      status: 'ACTIVE',
    };
    await validateReferences(payload);
    return payload;
  }

  async function writeAudit({ action, actorUserId, book, metadata, transaction }) {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') return;
    await auditLogRepository.create({
      userId: actorUserId || null,
      action,
      targetType: 'BOOK',
      targetId: book.id,
      metadata: { version: book.version, ...metadata },
      transaction,
    });
  }

  function assertMutationResult(result) {
    if (!result) throw new AppException(404, 'BOOK_NOT_FOUND', 'Không tìm thấy sách.');
    if (result.outcome === 'STALE') {
      throw new AppException(409, 'STALE_BOOK_STATE', 'Book version is missing or stale. Reload before retrying.');
    }
    if (result.outcome === 'INVALID_TRANSITION') {
      throw new AppException(409, 'INVALID_BOOK_TRANSITION', 'Book is already in the requested status.');
    }
    return result.book || result;
  }

  // @spec FR-FE01-003, FR-FE01-004, FR-FE01-008, FR-FE01-010, FR-FE01-013
  // @spec FR-FE05-001 FR-FE05-002 FR-FE05-009 FR-FE05-010 FR-FE05-020 FR-FE05-024
  async function getHomeBooks(filters = {}) {
    const normalized = normalizeListFilters(filters);
    const response = listResponse(await bookRepository.getHomeBooks(normalized), normalized);
    return { data: response.items, pagination: response.pagination };
  }

  // @spec FR-FE05-004 FR-FE05-009 FR-FE05-010 FR-FE05-020 FR-FE05-024
  async function getManagementBooks(filters = {}) {
    const normalized = normalizeListFilters(filters, { staff: true });
    return listResponse(await bookRepository.getManagementBooks(normalized), normalized, { staff: true });
  }

  // @spec FR-FE01-005, FR-FE01-006, FR-FE01-008, FR-FE01-009, FR-FE01-010, FR-FE01-012, FR-FE01-013
  // @spec FR-FE05-003 FR-FE05-014 FR-FE05-019 FR-FE05-020
  async function getBookById(bookId, { staff = false } = {}) {
    const id = normalizePositiveInt(bookId, 'bookId', { required: true });
    const book = await bookRepository.getBookById(id);
    if (!book || (!staff && book.status !== 'ACTIVE')) {
      throw new AppException(404, 'BOOK_NOT_FOUND', 'Không tìm thấy sách.');
    }
    return mapBook(book, { staff });
  }

  async function getMetadata() {
    return bookRepository.getMetadata();
  }

  // @spec FR-FE05-005 FR-FE05-006 FR-FE05-011 FR-FE05-012 FR-FE05-013 FR-FE05-016 FR-FE05-018 FR-FE05-026
  async function createBook(body = {}, actorUserId = null, coverFile = null) {
    const payload = await normalizeBookPayload(body, { create: true });
    validateBookCoverUpload(coverFile);
    let managedCoverUrl = null;

    try {
      if (coverFile) {
        managedCoverUrl = await bookCoverStorage.saveBookCoverFile(coverFile);
        payload.coverUrl = managedCoverUrl;
      }
      const book = await bookRepository.createBook(payload, {
        actorUserId,
        auditLogRepository,
        onBeforeCommit: ({ book: createdBook, transaction }) =>
          writeAudit({ action: 'BOOK_CREATE', actorUserId, book: createdBook, transaction }),
      });
      return mapBook(book, { staff: true });
    } catch (error) {
      if (managedCoverUrl) await cleanManagedCover(managedCoverUrl);
      throw error;
    }
  }

  // @spec FR-FE05-007 FR-FE05-011 FR-FE05-012 FR-FE05-013 FR-FE05-014 FR-FE05-016 FR-FE05-018 FR-FE05-021 FR-FE05-023 FR-FE05-026
  async function updateBook(bookId, body = {}, actorUserId = null, ifMatch, coverFile = null) {
    const id = normalizePositiveInt(bookId, 'bookId', { required: true });
    const expectedVersion = normalizeIfMatch(ifMatch);
    const payload = await normalizeBookPayload(body, { existingBookId: id });
    validateBookCoverUpload(coverFile);
    const existingBook = coverFile ? await bookRepository.getBookById(id) : null;
    if (coverFile && !existingBook) throw new AppException(404, 'BOOK_NOT_FOUND', 'KhÃ´ng tÃ¬m tháº¥y sÃ¡ch.');
    let managedCoverUrl = null;

    try {
      if (coverFile) {
        managedCoverUrl = await bookCoverStorage.saveBookCoverFile(coverFile);
        payload.coverUrl = managedCoverUrl;
      }
      const result = await bookRepository.updateBook(id, payload, expectedVersion, {
        actorUserId,
        auditLogRepository,
        onBeforeCommit: ({ book, transaction }) =>
          writeAudit({ action: 'BOOK_UPDATE', actorUserId, book, transaction }),
      });
      const updatedBook = mapBook(assertMutationResult(result), { staff: true });
      if (managedCoverUrl) {
        const previousCoverUrl = existingBook.cover || existingBook.coverUrl;
        if (previousCoverUrl && previousCoverUrl !== managedCoverUrl) {
          await cleanManagedCover(previousCoverUrl);
        }
      }
      return updatedBook;
    } catch (error) {
      if (managedCoverUrl) await cleanManagedCover(managedCoverUrl);
      throw error;
    }
  }

  async function changeStatus(bookId, targetStatus, body, actorUserId, ifMatch) {
    const id = normalizePositiveInt(bookId, 'bookId', { required: true });
    const expectedVersion = normalizeIfMatch(ifMatch);
    const reason = normalizeReason(body?.reason);
    const action = targetStatus === 'ACTIVE' ? 'BOOK_REACTIVATE' : 'BOOK_DEACTIVATE';
    const result = await bookRepository.changeBookStatus(id, targetStatus, expectedVersion, {
      actorUserId,
      auditLogRepository,
      onBeforeCommit: ({ book, transaction }) =>
        writeAudit({ action, actorUserId, book, metadata: { reason }, transaction }),
    });
    return mapBook(assertMutationResult(result), { staff: true });
  }

  // @spec FR-FE05-008 FR-FE05-018 FR-FE05-019 FR-FE05-023 FR-FE05-025
  function deactivateBook(bookId, body, actorUserId, ifMatch) {
    return changeStatus(bookId, 'INACTIVE', body, actorUserId, ifMatch);
  }

  // @spec FR-FE05-022 FR-FE05-023 FR-FE05-025
  function reactivateBook(bookId, body, actorUserId, ifMatch) {
    return changeStatus(bookId, 'ACTIVE', body, actorUserId, ifMatch);
  }

  async function getCategories() {
    const categories = await bookRepository.getCategories();
    const total = categories.reduce((sum, item) => sum + Number(item.count || 0), 0);
    return [
      { id: 0, name: 'Tất cả', count: total, icon: '📚' },
      ...categories.map((item) => ({ ...item, icon: '📖' })),
    ];
  }

  return {
    getHomeBooks,
    getCategories,
    getMetadata,
    getManagementBooks,
    getBookById,
    createBook,
    updateBook,
    deactivateBook,
    reactivateBook,
  };
}

const defaultBookService = createBookService();

module.exports = {
  createBookService,
  defaultBookService,
  validateBookCoverUpload,
  ...defaultBookService,
};
