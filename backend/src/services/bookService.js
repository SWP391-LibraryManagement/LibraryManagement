const bookRepository = require('../repositories/bookRepository');
const AppException = require('../CustomException/AppException');

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=420&fit=crop&auto=format';
const VALID_STATUSES = new Set(['ACTIVE', 'INACTIVE']);

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePositiveInt(value, fieldName, { required = false, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new AppException(400, 'INVALID_BOOK_FIELD', `${fieldName} là bắt buộc.`);
    }
    return null;
  }

  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0 || numberValue > max) {
    throw new AppException(400, 'INVALID_BOOK_FIELD', `${fieldName} không hợp lệ.`);
  }

  return numberValue;
}

function normalizeDecimal(value, fieldName, { min = 0, max = 5, defaultValue = 0 } = {}) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < min || numberValue > max) {
    throw new AppException(400, 'INVALID_BOOK_FIELD', `${fieldName} phải nằm trong khoảng ${min}-${max}.`);
  }

  return Math.round(numberValue * 10) / 10;
}

function normalizeOptionalText(value, fieldName, maxLength) {
  const text = trimString(value);
  if (!text) {
    return '';
  }

  if (text.length > maxLength) {
    throw new AppException(400, 'INVALID_BOOK_FIELD', `${fieldName} không được vượt quá ${maxLength} ký tự.`);
  }

  return text;
}

function normalizeCoverUrl(value) {
  const coverUrl = normalizeOptionalText(value, 'Cover URL', 255);

  if (!coverUrl) {
    return '';
  }

  const isSafePath = coverUrl.startsWith('/');
  const isSafeUrl = /^https?:\/\/[^\s]+$/i.test(coverUrl);

  if (!isSafePath && !isSafeUrl) {
    throw new AppException(400, 'INVALID_BOOK_FIELD', 'Cover URL phải là đường dẫn bắt đầu bằng / hoặc URL http(s).');
  }

  return coverUrl;
}

function mapBook(book) {
  if (!book) {
    return null;
  }

  return {
    id: book.id,
    title: book.title,
    isbn: book.isbn || '',
    categoryId: book.categoryId || null,
    category: book.category || 'Chưa phân loại',
    authorId: book.authorId || null,
    author: book.author || 'Không rõ tác giả',
    publisherId: book.publisherId || null,
    publisher: book.publisher || 'Không rõ nhà xuất bản',
    year: book.year || '',
    description: book.description || '',
    cover: book.cover || DEFAULT_COVER,
    rating: book.rating === null || book.rating === undefined ? 0 : Number(book.rating),
    pages: book.pages || '',
    status: book.status || 'ACTIVE',
    available: Number(book.availableCopies || 0) > 0,
    totalCopies: book.totalCopies || 0,
    availableCopies: book.availableCopies || 0,
    lockedCopies: book.lockedCopies || 0,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };
}

function normalizeFilters(filters = {}) {
  const q = typeof filters.q === 'string' ? filters.q.trim() : '';
  const category = typeof filters.category === 'string' ? filters.category.trim() : '';

  if (q.length > 100) {
    throw new AppException(400, 'INVALID_SEARCH_QUERY', 'Từ khóa tìm kiếm không được vượt quá 100 ký tự.');
  }

  if (category.length > 80) {
    throw new AppException(400, 'INVALID_CATEGORY_FILTER', 'Tên thể loại không được vượt quá 80 ký tự.');
  }

  return {
    q,
    category: category && category !== 'Tất cả' ? category : '',
  };
}

async function getHomeBooks(filters = {}) {
  const normalizedFilters = normalizeFilters(filters);
  const books = await bookRepository.getHomeBooks(normalizedFilters);

  return books.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author || 'Không rõ tác giả',
    category: book.category || 'Chưa phân loại',
    publisher: book.publisher || 'Không rõ nhà xuất bản',
    year: book.year || 'Không rõ',
    isbn: book.isbn || 'Chưa có ISBN',
    description: book.description || 'Chưa có mô tả cho sách này.',
    cover: book.cover || DEFAULT_COVER,
    available: Boolean(book.available),
    totalCopies: book.totalCopies || 0,
    availableCopies: book.availableCopies || 0,
    rating: book.rating === null || book.rating === undefined ? 0 : Number(book.rating),
    pages: book.pages || 0,
  }));
}

function normalizeManagementFilters(filters = {}) {
  const normalized = normalizeFilters(filters);
  const status = trimString(filters.status).toUpperCase();
  const page = normalizePositiveInt(filters.page, 'Trang', { max: 100000 }) || 1;
  const limit = normalizePositiveInt(filters.limit, 'Số dòng mỗi trang', { max: 100 }) || 20;
  const categoryId = normalizePositiveInt(filters.categoryId, 'Thể loại');

  if (status && !VALID_STATUSES.has(status)) {
    throw new AppException(400, 'INVALID_BOOK_STATUS', 'Trạng thái sách không hợp lệ.');
  }

  return {
    q: normalized.q,
    status,
    categoryId,
    page,
    limit,
  };
}

async function getManagementBooks(filters = {}) {
  const normalized = normalizeManagementFilters(filters);
  const result = await bookRepository.getManagementBooks(normalized);

  return {
    data: result.rows.map(mapBook),
    pagination: {
      page: normalized.page,
      limit: normalized.limit,
      total: result.total,
      totalPages: Math.max(Math.ceil(result.total / normalized.limit), 1),
    },
  };
}

async function getBookById(bookId) {
  const id = normalizePositiveInt(bookId, 'Book ID', { required: true });
  const book = await bookRepository.getBookById(id);

  if (!book) {
    throw new AppException(404, 'BOOK_NOT_FOUND', 'Không tìm thấy sách.');
  }

  return mapBook(book);
}

async function getMetadata() {
  return bookRepository.getMetadata();
}

async function validateReferences(payload) {
  const [categoryExists, authorExists, publisherExists] = await Promise.all([
    bookRepository.referenceExists('Categories', 'CategoryId', payload.categoryId),
    bookRepository.referenceExists('Authors', 'AuthorId', payload.authorId),
    payload.publisherId ? bookRepository.referenceExists('Publishers', 'PublisherId', payload.publisherId) : true,
  ]);

  if (!categoryExists) {
    throw new AppException(400, 'INVALID_CATEGORY', 'Thể loại không tồn tại.');
  }

  if (!authorExists) {
    throw new AppException(400, 'INVALID_AUTHOR', 'Tác giả không tồn tại.');
  }

  if (!publisherExists) {
    throw new AppException(400, 'INVALID_PUBLISHER', 'Nhà xuất bản không tồn tại.');
  }
}

async function normalizeBookPayload(body = {}, existingBookId = null) {
  const title = normalizeOptionalText(body.title, 'Tên sách', 255);
  const isbn = normalizeOptionalText(body.isbn, 'ISBN', 50);
  const categoryId = normalizePositiveInt(body.categoryId, 'Thể loại', { required: true });
  const authorId = normalizePositiveInt(body.authorId, 'Tác giả', { required: true });
  const publisherId = normalizePositiveInt(body.publisherId, 'Nhà xuất bản');
  const publishYear = normalizePositiveInt(body.publishYear, 'Năm xuất bản');
  const pages = normalizePositiveInt(body.pages, 'Số trang');
  const rating = normalizeDecimal(body.rating, 'Đánh giá');
  const description = normalizeOptionalText(body.description, 'Mô tả', 2000);
  const coverUrl = normalizeCoverUrl(body.coverUrl || body.cover);
  const status = trimString(body.status).toUpperCase() || 'ACTIVE';
  const currentYear = new Date().getFullYear();

  if (!title) {
    throw new AppException(400, 'TITLE_REQUIRED', 'Tên sách là bắt buộc.');
  }

  if (publishYear && publishYear > currentYear) {
    throw new AppException(400, 'INVALID_PUBLISH_YEAR', 'Năm xuất bản không được lớn hơn năm hiện tại.');
  }

  if (isbn && await bookRepository.isbnExists(isbn, existingBookId)) {
    throw new AppException(400, 'DUPLICATE_ISBN', 'ISBN đã tồn tại.');
  }

  if (!VALID_STATUSES.has(status)) {
    throw new AppException(400, 'INVALID_BOOK_STATUS', 'Invalid book status.');
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
    status,
  };

  await validateReferences(payload);
  return payload;
}

async function createBook(body = {}, actorUserId = null) {
  const payload = await normalizeBookPayload(body);
  return mapBook(await bookRepository.createBook(payload, actorUserId));
}

async function updateBook(bookId, body = {}, actorUserId = null) {
  const id = normalizePositiveInt(bookId, 'Book ID', { required: true });
  await getBookById(id);
  const payload = await normalizeBookPayload(body, id);
  return mapBook(await bookRepository.updateBook(id, payload, actorUserId));
}

async function deactivateBook(bookId, actorUserId = null) {
  const id = normalizePositiveInt(bookId, 'Book ID', { required: true });
  const book = await getBookById(id);

  if (book.status === 'INACTIVE') {
    return book;
  }

  return mapBook(await bookRepository.deactivateBook(id, actorUserId));
}

async function getCategories() {
  const categories = await bookRepository.getCategories();

  const total = categories.reduce((sum, item) => sum + item.count, 0);

  return [
    {
      id: 0,
      name: 'Tất cả',
      count: total,
      icon: '📚',
    },
    ...categories.map((item) => ({
      id: item.id,
      name: item.name,
      count: item.count,
      icon: '📖',
    })),
  ];
}

module.exports = {
  getHomeBooks,
  getCategories,
  getMetadata,
  getManagementBooks,
  getBookById,
  createBook,
  updateBook,
  deactivateBook,
};
