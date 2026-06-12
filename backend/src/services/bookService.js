const bookRepository = require('../repositories/bookRepository');
const AppException = require('../CustomException/AppException');

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=420&fit=crop&auto=format';

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
};
