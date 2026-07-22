const path = require('path');
const YAML = require('yamljs');

const document = YAML.load(path.resolve(__dirname, '../src/docs/openapi.yaml'));

// @spec FR-FE05-027, FR-FE05-028, AC-FE05-018
test('OpenAPI documents managed cover multipart create and update compatibility', () => {
  const multipart = document.components.schemas.BookMultipartInput;
  expect(multipart.required).toEqual(['metadata']);
  expect(multipart.properties.cover).toMatchObject({ type: 'string', format: 'binary' });

  for (const [endpoint, method] of [
    ['/api/books', 'post'],
    ['/api/books/{bookId}', 'put'],
  ]) {
    const content = document.paths[endpoint][method].requestBody.content;
    expect(content['application/json'].schema.$ref).toBe('#/components/schemas/BookInput');
    expect(content['multipart/form-data'].schema.$ref).toBe('#/components/schemas/BookMultipartInput');
  }
});
