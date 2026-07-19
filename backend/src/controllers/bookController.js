const bookService = require('../services/bookService');

async function getHomeBooks(req, res, next) {
  try {
    const result = await bookService.getHomeBooks({
      q: req.query.q,
      categoryId: req.query.categoryId,
      authorId: req.query.authorId,
      publisherId: req.query.publisherId,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
      order: req.query.order,
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách sách thành công',
      ...result,
    });
  } catch (error) {
    return next(error);
  }
}

async function getCategories(req, res, next) {
  try {
    const categories = await bookService.getCategories();

    return res.status(200).json({
      success: true,
      message: 'Lấy danh mục sách thành công',
      data: categories,
    });
  } catch (error) {
    return next(error);
  }
}

async function getMetadata(req, res, next) {
  try {
    const metadata = await bookService.getMetadata();

    return res.status(200).json({
      success: true,
      message: 'Lấy dữ liệu phân loại sách thành công',
      data: metadata,
    });
  } catch (error) {
    return next(error);
  }
}

async function getManagementBooks(req, res, next) {
  try {
    const result = await bookService.getManagementBooks({
      q: req.query.q,
      status: req.query.status,
      categoryId: req.query.categoryId,
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách quản lý sách thành công',
      ...result,
    });
  } catch (error) {
    return next(error);
  }
}

async function getBookById(req, res, next) {
  try {
    const roles = Array.isArray(req.user?.roles) ? req.user.roles.map((role) => String(role).toUpperCase()) : [];
    const includeInactive = roles.some((role) => ['LIBRARIAN', 'ADMIN'].includes(role));
    const book = await bookService.getBookById(req.params.bookId, { includeInactive });

    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết sách thành công',
      data: book,
    });
  } catch (error) {
    return next(error);
  }
}

async function createBook(req, res, next) {
  try {
    const book = await bookService.createBook(req.body, req.user?.userId);

    return res.status(201).json({
      success: true,
      message: 'Thêm sách thành công',
      data: book,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateBook(req, res, next) {
  try {
    const book = await bookService.updateBook(req.params.bookId, req.body, req.user?.userId, req.headers['if-match']);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin sách thành công',
      data: book,
    });
  } catch (error) {
    return next(error);
  }
}

async function deactivateBook(req, res, next) {
  try {
    const book = await bookService.deactivateBook(req.params.bookId, req.body, req.user?.userId, req.headers['if-match']);

    return res.status(200).json({
      success: true,
      message: 'Vô hiệu hóa sách thành công',
      data: book,
    });
  } catch (error) {
    return next(error);
  }
}

async function reactivateBook(req, res, next) {
  try {
    const book = await bookService.reactivateBook(req.params.bookId, req.body, req.user?.userId, req.headers['if-match']);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật tình trạng sách thành công',
      data: book,
    });
  } catch (error) {
    return next(error);
  }
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
  reactivateBook,
};
