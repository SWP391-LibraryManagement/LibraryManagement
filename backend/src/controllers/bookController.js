const bookService = require('../services/bookService');

async function getHomeBooks(req, res, next) {
  try {
    const books = await bookService.getHomeBooks({
      q: req.query.q,
      category: req.query.category,
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách sách thành công',
      data: books,
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
    const book = await bookService.getBookById(req.params.bookId);

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
    const book = await bookService.updateBook(req.params.bookId, req.body, req.user?.userId);

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
    const book = await bookService.deactivateBook(req.params.bookId, req.user?.userId);

    return res.status(200).json({
      success: true,
      message: 'Vô hiệu hóa sách thành công',
      data: book,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateBookAvailability(req, res, next) {
  try {
    const book = await bookService.updateBookAvailability(req.params.bookId, req.body, req.user?.userId);

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
  updateBookAvailability,
};
