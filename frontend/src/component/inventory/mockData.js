export const MOCK_BOOKS = [
  {
    id: 1,
    title: 'Clean Code',
    author: 'Robert C. Martin',
    genre: 'Software Engineering',
    isbn: '9780132350884',
    publishYear: 2008,
    publisher: 'Prentice Hall',
    description: 'A handbook of agile software craftsmanship.',
  },
  {
    id: 2,
    title: 'Design Patterns',
    author: 'Erich Gamma',
    genre: 'Software Engineering',
    isbn: '9780201633610',
    publishYear: 1994,
    publisher: 'Addison-Wesley',
    description: 'Reusable object-oriented software patterns.',
  },
];

export const MOCK_COPIES = [
  { copyId: 1, bookId: 1, barcode: 'BK-0001', location: 'A1', status: 'AVAILABLE' },
  { copyId: 2, bookId: 1, barcode: 'BK-0002', location: 'A1', status: 'BORROWED' },
  { copyId: 3, bookId: 2, barcode: 'BK-0003', location: 'B2', status: 'AVAILABLE' },
];
