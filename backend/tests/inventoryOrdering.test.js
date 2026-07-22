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
