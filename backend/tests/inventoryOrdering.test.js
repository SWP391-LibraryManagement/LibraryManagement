const fs = require('fs');
const path = require('path');

test('inventory list uses deterministic ascending copy ID order before pagination', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'repositories', 'inventoryRepository.js'),
    'utf8'
  );

  expect(source).toMatch(/ORDER BY bc\.CopyId ASC\s+OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY/i);
  expect(source).not.toMatch(/ORDER BY b\.Title ASC, bc\.CopyId ASC/i);
});

test('inventory search joins publishers in both count queries before applying shared filters', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'repositories', 'inventoryRepository.js'),
    'utf8'
  );

  const publisherJoins = source.match(/LEFT JOIN Publishers p ON b\.PublisherId = p\.PublisherId/g) || [];
  expect(publisherJoins.length).toBeGreaterThanOrEqual(3);
  expect(source).toMatch(/OR p\.PublisherName LIKE @Search/i);
  expect(source).toMatch(/SELECT COUNT_BIG\(\*\) AS Total[\s\S]*LEFT JOIN Publishers p[\s\S]*WHERE \$\{whereClause\}/i);
  expect(source).toMatch(/SELECT bc\.Status, COUNT_BIG\(\*\) AS Total[\s\S]*LEFT JOIN Publishers p[\s\S]*WHERE \$\{whereClause\}/i);
});

test('inventory resolves both canonical and legacy BookCopies rowversion column names safely', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'repositories', 'inventoryRepository.js'),
    'utf8'
  );

  expect(source).toMatch(/c\.name IN \(N'Version', N'RowVersion'\)/);
  expect(source).toMatch(/\['Version', 'RowVersion'\]\.includes\(columnName\)/);
  expect(source).toMatch(/INVENTORY_SCHEMA_MIGRATION_REQUIRED/);
  expect(source).toMatch(/bc\.\$\{versionColumn\} AS CopyVersion/);
  expect(source).toMatch(/bc\.\$\{versionColumn\} AS RowVersion/);
});
