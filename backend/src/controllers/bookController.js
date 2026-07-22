const { defaultBookService } = require('../services/bookService');

function isBookManager(user) {
  // @spec FR-FE05-015
  const roles = Array.isArray(user?.roles)
    ? user.roles.map((role) => String(role).toUpperCase())
    : [];
  return roles.some((role) => ['LIBRARIAN', 'ADMIN'].includes(role));
}

function createBookController(bookService = defaultBookService) {
  async function getHomeBooks(req, res, next) {
    try {
      return res.status(200).json(await bookService.getHomeBooks({
        q: req.query.q || '',
        categoryId: req.query.categoryId,
        authorId: req.query.authorId,
        publisherId: req.query.publisherId,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      }));
    } catch (error) {
      return next(error);
    }
  }

  async function getCategories(req, res, next) {
    try {
      return res.status(200).json({ data: await bookService.getCategories() });
    } catch (error) {
      return next(error);
    }
  }

  async function getMetadata(req, res, next) {
    try {
      return res.status(200).json({ data: await bookService.getMetadata() });
    } catch (error) {
      return next(error);
    }
  }

  async function getManagementBooks(req, res, next) {
    try {
      return res.status(200).json(await bookService.getManagementBooks(req.query));
    } catch (error) {
      return next(error);
    }
  }

  async function getBookById(req, res, next) {
    try {
      const book = await bookService.getBookById(req.params.bookId, {
        staff: isBookManager(req.user),
      });
      return res.status(200).json({ book });
    } catch (error) {
      return next(error);
    }
  }

  async function createBook(req, res, next) {
    try {
      const book = await bookService.createBook(req.body, req.user?.userId, req.bookCoverFile);
      return res.status(201).json({ book });
    } catch (error) {
      return next(error);
    }
  }

  async function updateBook(req, res, next) {
    try {
      const book = await bookService.updateBook(
        req.params.bookId,
        req.body,
        req.user?.userId,
        req.headers['if-match'],
        req.bookCoverFile
      );
      return res.status(200).json({ book });
    } catch (error) {
      return next(error);
    }
  }

  async function deactivateBook(req, res, next) {
    try {
      const book = await bookService.deactivateBook(
        req.params.bookId,
        req.body,
        req.user?.userId,
        req.headers['if-match']
      );
      return res.status(200).json({ book });
    } catch (error) {
      return next(error);
    }
  }

  async function reactivateBook(req, res, next) {
    try {
      const book = await bookService.reactivateBook(
        req.params.bookId,
        req.body,
        req.user?.userId,
        req.headers['if-match']
      );
      return res.status(200).json({ book });
    } catch (error) {
      return next(error);
    }
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

const defaultController = createBookController();

module.exports = {
  createBookController,
  ...defaultController,
};
