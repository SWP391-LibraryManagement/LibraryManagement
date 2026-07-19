process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');

const fs = require('fs');
const path = require('path');
const YAML = require('yamljs');
const request = require('supertest');

const openApiDocument = YAML.load(path.resolve(__dirname, '../src/docs/openapi.yaml'));

jest.mock('../src/services/bookService', () => {
  const service = {
    getHomeBooks: jest.fn(),
    getCategories: jest.fn(),
    getMetadata: jest.fn(),
    getManagementBooks: jest.fn(),
    getBookById: jest.fn(),
  };
  return { ...service, defaultBookService: service };
});

const bookService = require('../src/services/bookService');
const { createApp } = require('../src/app');

describe('FE01 public browse contract', () => {
  beforeEach(() => {
    bookService.getHomeBooks.mockReset();
  });

  test('GET /api/books exposes the exact public pagination envelope without auth', async () => {
    bookService.getHomeBooks.mockResolvedValue({
      data: [{ id: 1, title: 'Clean Code', available: 'AVAILABLE' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const response = await request(createApp()).get('/api/books');

    expect(response.status).toBe(200);
    expect(Object.keys(response.body).sort()).toEqual(['data', 'pagination']);
    expect(response.body).toEqual({
      data: [{ id: 1, title: 'Clean Code', available: 'AVAILABLE' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    expect(bookService.getHomeBooks).toHaveBeenCalledWith({
      q: '', categoryId: undefined, authorId: undefined, publisherId: undefined, page: 1, limit: 20,
    });
  });

  test('GET /api/books rejects unknown query fields before service execution', async () => {
    const response = await request(createApp()).get('/api/books?sort=Title');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(bookService.getHomeBooks).not.toHaveBeenCalled();
  });

  test('OpenAPI documents the exact public list envelope and query allowlist', () => {
    const operation = openApiDocument.paths['/api/books'].get;
    const queryNames = operation.parameters.map((parameter) => parameter.name);
    const responseSchema = operation.responses['200'].content['application/json'].schema;
    const publicListSchema = openApiDocument.components.schemas.PublicBookListResponse;

    expect(queryNames).toEqual([
      'q',
      'categoryId',
      'authorId',
      'publisherId',
      'page',
      'limit',
    ]);
    expect(operation.parameters[0].schema).not.toHaveProperty('minLength');
    expect(responseSchema).toEqual({
      $ref: '#/components/schemas/PublicBookListResponse',
    });
    expect(publicListSchema).toMatchObject({
      additionalProperties: false,
      required: ['data', 'pagination'],
      properties: {
        data: {
          type: 'array',
        },
        pagination: {
          $ref: '#/components/schemas/BookPagination',
        },
      },
    });
  });

  test('OpenAPI documents only the approved public-safe book summary fields', () => {
    const publicBookSchema = openApiDocument.components.schemas.PublicBookSummary;

    expect(publicBookSchema.additionalProperties).toBe(false);
    expect(publicBookSchema.required).toEqual(['bookId', 'title', 'availabilityStatus']);
    expect(Object.keys(publicBookSchema.properties)).toEqual([
      'bookId',
      'title',
      'isbn',
      'categoryName',
      'authorName',
      'publisherName',
      'publishYear',
      'description',
      'coverUrl',
      'availabilityStatus',
    ]);
  });

  test('OpenAPI keeps the unauthenticated detail response public-safe', () => {
    const responseSchema = openApiDocument.paths['/api/books/{bookId}']
      .get.responses['200'].content['application/json'].schema;
    const publicDetailSchema = openApiDocument.components.schemas.PublicBookResponse;

    expect(responseSchema).toEqual({
      $ref: '#/components/schemas/PublicBookResponse',
    });
    expect(publicDetailSchema).toEqual({
      type: 'object',
      additionalProperties: false,
      required: ['book'],
      properties: {
        book: { $ref: '#/components/schemas/PublicBookSummary' },
      },
    });
  });

  test('public browse exposes no legacy categories endpoint', () => {
    const routeSource = fs.readFileSync(
      path.resolve(__dirname, '../src/routes/bookRoutes.js'),
      'utf8'
    );

    expect(routeSource).not.toMatch(/router\.get\('\/categories'/);
  });
});
