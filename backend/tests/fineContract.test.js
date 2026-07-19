const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const openApiPath = path.join(__dirname, '../src/docs/openapi.yaml');
const businessTimePath = path.join(__dirname, '../src/utils/libraryBusinessTime.js');

// @spec AC-FE09-001 AC-FE09-002 AC-FE09-006 AC-FE09-007 AC-FE09-013 AC-FE09-014
test('OpenAPI documents the eight canonical FE09 operations without partial-payment input', () => {
  const document = yaml.safeLoad(fs.readFileSync(openApiPath, 'utf8'));
  const operations = [
    ['/api/fines/me', 'get'],
    ['/api/fines', 'get'],
    ['/api/fines/{fineId}', 'get'],
    ['/api/fines/calculate', 'post'],
    ['/api/fines/{fineId}/collections', 'post'],
    ['/api/fines/{fineId}/paid', 'patch'],
    ['/api/fines/{fineId}/waive', 'patch'],
    ['/api/fines/{fineId}/cancel', 'patch'],
  ];

  for (const [route, method] of operations) {
    expect(document.paths?.[route]?.[method]).toBeDefined();
  }

  const collectionSchema =
    document.paths['/api/fines/{fineId}/collections'].post.requestBody.content['application/json']
      .schema;
  expect(collectionSchema.required).toContain('paymentMethod');
  expect(collectionSchema.properties).toHaveProperty('paymentMethod');
  expect(collectionSchema.properties).not.toHaveProperty('collectedAmount');

  const staffList = document.paths['/api/fines'].get;
  expect(staffList.parameters.map((parameter) => parameter.name)).toEqual([
    'q',
    'userId',
    'status',
    'page',
    'limit',
  ]);
  expect(staffList.description).toContain('FineId ASC');
});

// @spec AC-FE09-015 NFR-FE09-TIME-001
test('library business time calculates overdue days at the Asia/Ho_Chi_Minh boundary', () => {
  expect(fs.existsSync(businessTimePath)).toBe(true);
  if (!fs.existsSync(businessTimePath)) return;

  const { overdueDaysBetween } = require(businessTimePath);
  expect(overdueDaysBetween('2026-06-01', new Date('2026-06-01T16:30:00.000Z'))).toBe(0);
  expect(overdueDaysBetween('2026-06-01', new Date('2026-06-01T17:30:00.000Z'))).toBe(1);
});
