const path = require('path');
const YAML = require('yamljs');

const document = YAML.load(path.resolve(__dirname, '../src/docs/openapi.yaml'));

function parameterNames(endpoint) {
  return document.paths[endpoint].get.parameters.map((parameter) => parameter.name);
}

function schemaRef(endpoint, method) {
  return document.paths[endpoint][method].requestBody.content['application/json'].schema.$ref;
}

test('OpenAPI documents FE07 input constraints and supported history filters', () => {
  const createInput = document.components.schemas.BorrowRequestCreateInput;

  expect(createInput.properties.copyIds).toEqual({
    type: 'array',
    minItems: 1,
    uniqueItems: true,
    items: { type: 'integer', minimum: 1 },
  });
  expect(parameterNames('/api/borrow-requests')).toEqual([
    'status',
    'memberId',
    'fromDate',
    'toDate',
  ]);
  expect(parameterNames('/api/borrow-requests/me')).toEqual(['status', 'fromDate', 'toDate']);
  expect(parameterNames('/api/members/{memberId}/borrowings')).toEqual([
    'memberId',
    'status',
    'fromDate',
    'toDate',
  ]);
  expect(document.paths['/api/members/{memberId}/borrowings'].get.parameters[0].schema.minimum).toBe(1);
});

test('OpenAPI binds FE07 action bodies to the current runtime requests', () => {
  expect(schemaRef('/api/borrow-requests/{requestId}/approve', 'patch')).toBe(
    '#/components/schemas/BorrowRequestApproveInput'
  );
  expect(schemaRef('/api/borrow-requests/{requestId}/reject', 'patch')).toBe(
    '#/components/schemas/BorrowRequestRejectInput'
  );
  expect(schemaRef('/api/borrow-details/{borrowDetailId}/return', 'patch')).toBe(
    '#/components/schemas/BorrowDetailReturnInput'
  );
  expect(schemaRef('/api/borrow-details/{borrowDetailId}/renew', 'patch')).toBe(
    '#/components/schemas/BorrowDetailRenewInput'
  );

  expect(document.components.schemas.BorrowRequestRejectInput.required).toEqual(['reason']);
  expect(document.components.schemas.BorrowDetailReturnInput.required).toEqual(['condition']);
  expect(document.paths['/api/borrow-details/{borrowDetailId}/return'].patch.requestBody.required).toBe(true);
  expect(document.components.schemas.BorrowDetailReturnInput.properties.returnDate.description).toMatch(
    /server date/i
  );

  for (const schemaName of [
    'BorrowRequestApproveInput',
    'BorrowRequestRejectInput',
    'BorrowDetailReturnInput',
    'BorrowDetailRenewInput',
  ]) {
    const notes = document.components.schemas[schemaName].properties.notes;
    if (notes) {
      expect(notes.maxLength).toBe(500);
    }
  }

  for (const endpoint of [
    '/api/borrow-requests/{requestId}/approve',
    '/api/borrow-requests/{requestId}/reject',
    '/api/borrow-details/{borrowDetailId}/return',
    '/api/borrow-details/{borrowDetailId}/renew',
  ]) {
    expect(document.paths[endpoint].patch.parameters[0].schema.minimum).toBe(1);
  }
});

test('OpenAPI reuses FE07 success and safe error responses across every borrowing endpoint', () => {
  const endpointMethods = [
    ['/api/borrow-requests', 'post', '201'],
    ['/api/borrow-requests', 'get', '200'],
    ['/api/borrow-requests/me', 'get', '200'],
    ['/api/members/{memberId}/borrowings', 'get', '200'],
    ['/api/borrow-requests/{requestId}/approve', 'patch', '200'],
    ['/api/borrow-requests/{requestId}/reject', 'patch', '200'],
    ['/api/borrow-details/{borrowDetailId}/return', 'patch', '200'],
    ['/api/borrow-details/{borrowDetailId}/renew', 'patch', '200'],
  ];

  for (const [endpoint, method, successCode] of endpointMethods) {
    const responses = document.paths[endpoint][method].responses;
    expect(responses[successCode].$ref).toMatch(
      /^#\/components\/responses\/(Borrow|MemberBorrowings)/
    );
    expect(responses['401'].$ref).toBe('#/components/responses/Unauthorized');
    expect(responses['403'].$ref).toBe('#/components/responses/Forbidden');
  }

  for (const name of ['Unauthorized', 'Forbidden', 'NotFound', 'Conflict']) {
    expect(document.components.responses[name].content['application/json'].schema.$ref).toBe(
      '#/components/schemas/SafeError'
    );
  }
});

test('OpenAPI documents runtime fine candidate identifiers and selected-member not found', () => {
  const fineCandidate = document.components.schemas.FineCandidate;

  expect(fineCandidate.required).toEqual([
    'userId',
    'borrowDetailId',
    'copyId',
    'condition',
    'overdueDays',
    'needsFineReview',
  ]);
  expect(fineCandidate.properties.userId).toEqual({ type: 'integer', minimum: 1 });
  expect(fineCandidate.properties.copyId).toEqual({ type: 'integer', minimum: 1 });
  expect(document.paths['/api/members/{memberId}/borrowings'].get.responses['404'].$ref).toBe(
    '#/components/responses/NotFound'
  );
});
