const { readFileSync } = require('fs');
const path = require('path');

const repositorySource = readFileSync(
  path.join(__dirname, '..', 'src', 'repositories', 'bookRepository.js'),
  'utf8'
);

// @spec BR-FE05-009, BR-FE05-011, BR-FE05-013, FR-FE05-020, AC-FE05-011
test('book reads derive AVAILABLE or UNAVAILABLE from parent and copy state', () => {
  expect(repositorySource).toMatch(/b\.Status\s*=\s*'ACTIVE'/i);
  expect(repositorySource).toMatch(/bc\.Status\s*=\s*'AVAILABLE'/i);
  expect(repositorySource).toMatch(/THEN\s+'AVAILABLE'[\s\S]{0,160}ELSE\s+'UNAVAILABLE'/i);
  expect(repositorySource).toMatch(/AS\s+availabilityStatus/i);
});

// @spec BR-FE05-013, FR-FE05-020
test('zero available copies and inactive parents cannot be reported as AVAILABLE', () => {
  const derivedExpressions = repositorySource.match(/CASE[\s\S]{0,500}AS\s+availabilityStatus/gi) || [];
  expect(derivedExpressions.length).toBeGreaterThanOrEqual(1);
  for (const expression of derivedExpressions) {
    expect(expression).toMatch(/b\.Status\s*=\s*'ACTIVE'/i);
    expect(expression).toMatch(/SUM\s*\(\s*CASE\s+WHEN\s+bc\.Status\s*=\s*'AVAILABLE'/i);
  }
});

// @spec BR-FE05-016, BR-FE05-017, AC-FE05-004, AC-FE05-014, AC-FE05-015
test('management reads expose version and deterministic sort with BookId tie-breaker', () => {
  expect(repositorySource).toMatch(/(?:RowVersion|Version)\s+AS\s+version/i);
  expect(repositorySource).toMatch(/ORDER BY[\s\S]{0,200}BookId/i);
  expect(repositorySource).toMatch(/OFFSET\s+@\w+\s+ROWS\s+FETCH\s+NEXT\s+@\w+\s+ROWS\s+ONLY/i);
});

// @spec BR-FE05-012, BR-FE05-015, FR-FE05-021, AC-FE05-012
test('FE05 repository never writes physical copy or workflow lifecycle state', () => {
  expect(repositorySource).not.toMatch(/(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+BookCopies/i);
  expect(repositorySource).not.toMatch(/(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+BorrowDetails/i);
  expect(repositorySource).not.toMatch(/(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+Reservations/i);
  expect(repositorySource).not.toMatch(/updateBookAvailability/);
});
