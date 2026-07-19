const fs = require('fs');
const path = require('path');

describe('admin circulation route boundary', () => {
  test('keeps the admin table read-only and delegates mutations to canonical FE07 routes', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/routes/adminRoutes.js'), 'utf8');

    expect(source).toContain("router.get('/borrowings', requireAdmin, controller.listBorrowings)");
    expect(source).not.toContain("router.post('/borrowings'");
    expect(source).not.toContain("router.put('/borrowings/:id'");
    expect(source).toContain("router.get('/requests', requireAdmin, controller.listRequests)");
    expect(source).not.toContain("router.patch('/requests/:id/status'");
  });
});
