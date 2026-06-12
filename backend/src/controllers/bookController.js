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

module.exports = {
  getHomeBooks,
  getCategories,
};
