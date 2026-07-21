const path = require('path');
const YAML = require('yamljs');
const {
  borrowingStatuses,
  copyStatuses,
  userStatuses,
  membershipStatuses,
} = require('../src/validators/reportValidators');

const document = YAML.load(path.resolve(__dirname, '../src/docs/openapi.yaml'));

function parameterNames(endpoint) {
  return document.paths[endpoint].get.parameters.map((parameter) => parameter.name);
}

function responseCodes(endpoint) {
  return Object.keys(document.paths[endpoint].get.responses);
}

function parameter(endpoint, name) {
  return document.paths[endpoint].get.parameters.find((item) => item.name === name);
}

test('OpenAPI documents the implemented FE12 report filters', () => {
  expect(parameterNames('/api/reports/borrowing')).toEqual([
    'q',
    'fromDate',
    'toDate',
    'status',
    'bookId',
    'userId',
    'page',
    'limit',
  ]);
  expect(parameterNames('/api/reports/inventory')).toEqual([
    'q',
    'categoryId',
    'bookId',
    'status',
    'location',
    'page',
    'limit',
  ]);
  expect(parameterNames('/api/reports/users')).toEqual([
    'q',
    'fromDate',
    'toDate',
    'roleId',
    'status',
    'membershipStatus',
    'page',
    'limit',
  ]);
});

test('OpenAPI documents validation errors for every FE12 report endpoint', () => {
  for (const endpoint of [
    '/api/reports/borrowing',
    '/api/reports/inventory',
    '/api/reports/users',
  ]) {
    expect(responseCodes(endpoint)).toEqual(expect.arrayContaining(['200', '400', '401', '403']));
  }
});

test('OpenAPI report filters use the exact runtime status enums', () => {
  const expectedRuntimeStatuses = {
    borrowing: [
      'PENDING',
      'APPROVED',
      'REJECTED',
      'COMPLETED',
      'CANCELLED',
      'REQUESTED',
      'BORROWED',
      'RETURNED',
      'LOST',
      'DAMAGED',
      'OVERDUE',
    ],
    copy: ['AVAILABLE', 'BORROWED', 'RESERVED', 'DAMAGED', 'LOST', 'INACTIVE'],
    user: ['ACTIVE', 'INACTIVE', 'LOCKED'],
    membership: ['PENDING', 'APPROVED', 'REJECTED', 'INACTIVE'],
  };
  const openApiStatuses = {
    borrowing: parameter('/api/reports/borrowing', 'status').schema.enum,
    copy: parameter('/api/reports/inventory', 'status').schema.enum,
    user: parameter('/api/reports/users', 'status').schema.enum,
    membership: parameter('/api/reports/users', 'membershipStatus').schema.enum,
  };
  const validatorStatuses = {
    borrowing: borrowingStatuses,
    copy: copyStatuses,
    user: userStatuses,
    membership: membershipStatuses,
  };

  expect(openApiStatuses).toEqual(expectedRuntimeStatuses);
  expect(validatorStatuses).toEqual(expectedRuntimeStatuses);
  expect(openApiStatuses).toEqual(validatorStatuses);
});

test('OpenAPI binds every FE12 success response to its runtime report payload shape', () => {
  const expectations = {
    '/api/reports/borrowing': {
      response: 'BorrowingReportResponse',
      schema: 'BorrowingReport',
      metricProperties: ['activeLoans', 'overdueLoans', 'borrowCountByPeriod', 'topBorrowedBooks'],
    },
    '/api/reports/inventory': {
      response: 'InventoryReportResponse',
      schema: 'InventoryReport',
      metricProperties: ['totalBooks', 'totalCopies', 'copiesByStatus', 'lowStockBooks'],
    },
    '/api/reports/users': {
      response: 'UserStatisticsReportResponse',
      schema: 'UserStatisticsReport',
      metricProperties: [
        'totalMembers',
        'usersByStatus',
        'usersByRole',
        'membershipByStatus',
        'newMembersByPeriod',
      ],
    },
  };

  for (const [endpoint, expected] of Object.entries(expectations)) {
    expect(document.paths[endpoint].get.responses['200']).toEqual({
      $ref: `#/components/responses/${expected.response}`,
    });
    expect(Object.keys(document.components.schemas[expected.schema].properties)).toEqual([
      'metrics',
      'rows',
      'page',
      'limit',
      'totalRows',
    ]);
    expect(Object.keys(document.components.schemas[expected.schema].properties.metrics.properties)).toEqual(
      expected.metricProperties
    );
  }

  expect(document.components.schemas.BorrowingReport.properties.metrics.properties.topBorrowedBooks.items.properties)
    .toEqual(expect.objectContaining({ bookId: expect.any(Object), title: expect.any(Object), borrowCount: expect.any(Object) }));
  expect(document.components.schemas.InventoryReport.properties.metrics.properties.lowStockBooks.items.properties)
    .toEqual(expect.objectContaining({ bookId: expect.any(Object), title: expect.any(Object), effectiveAvailability: expect.any(Object) }));
  expect(document.components.schemas.UserStatisticsReport.properties.metrics.properties)
    .toEqual(expect.objectContaining({ totalMembers: expect.any(Object), usersByStatus: expect.any(Object) }));
});
