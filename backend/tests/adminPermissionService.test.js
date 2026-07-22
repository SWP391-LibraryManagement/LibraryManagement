jest.mock('../src/repositories/adminRepository', () => ({
  getResourceConfig: jest.fn(),
  getDashboard: jest.fn(),
  listBooks: jest.fn(),
  listResource: jest.fn(),
  createResource: jest.fn(),
  updateResource: jest.fn(),
  deactivateResource: jest.fn(),
  listBorrowings: jest.fn(),
  listRequests: jest.fn(),
}));
jest.mock('../src/repositories/auditLogRepository', () => ({
  listAuditLogs: jest.fn(),
}));

const adminRepository = require('../src/repositories/adminRepository');
const auditLogRepository = require('../src/repositories/auditLogRepository');
const adminService = require('../src/services/adminService');

const EXPECTED_PERMISSIONS = [
  { permissionKey: 'USER_VIEW', label: 'View users', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'USER_CREATE', label: 'Create accounts', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'USER_UPDATE', label: 'Update accounts', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'USER_DEACTIVATE', label: 'Deactivate accounts', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'ROLE_MANAGE', label: 'Manage roles', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'AUDIT_VIEW', label: 'View audit logs', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'CATALOG_MANAGE', label: 'Manage library catalog', moduleKey: 'LIBRARY', moduleLabel: 'Library', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'METADATA_MANAGE', label: 'Manage authors/publishers/categories', moduleKey: 'LIBRARY', moduleLabel: 'Library', allowedRoles: ['ADMIN'] },
  { permissionKey: 'BORROW_APPROVE_REJECT', label: 'Approve/reject borrow requests', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'RETURN_RENEW_PROCESS', label: 'Process returns and renewals', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'FINE_CALCULATE_COLLECT', label: 'Calculate and collect fines', moduleKey: 'FINE', moduleLabel: 'Fine', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'FINE_WAIVE_CANCEL', label: 'Waive or cancel fines', moduleKey: 'FINE', moduleLabel: 'Fine', allowedRoles: ['ADMIN'] },
  { permissionKey: 'REPORT_VIEW', label: 'View reports', moduleKey: 'REPORTS', moduleLabel: 'Reports', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'BORROW_REQUEST_CREATE', label: 'Create borrow request', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['MEMBER'] },
  { permissionKey: 'BORROW_HISTORY_VIEW_OWN', label: 'View own borrowing history', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['MEMBER'] },
];

beforeEach(() => {
  jest.clearAllMocks();
});

test('getPermissions returns the exact deterministic allowlisted contract', () => {
  const result = adminService.getPermissions();

  expect(Object.keys(result)).toEqual(['roles', 'permissions']);
  expect(result.roles).toEqual([
    { roleName: 'ADMIN', label: 'Admin' },
    { roleName: 'LIBRARIAN', label: 'Librarian' },
    { roleName: 'MEMBER', label: 'Member' },
  ]);
  expect(result.permissions).toEqual(EXPECTED_PERMISSIONS);

  for (const role of result.roles) {
    expect(Object.keys(role)).toEqual(['roleName', 'label']);
  }
  for (const permission of result.permissions) {
    expect(Object.keys(permission)).toEqual([
      'permissionKey',
      'label',
      'moduleKey',
      'moduleLabel',
      'allowedRoles',
    ]);
    expect(new Set(permission.allowedRoles).size).toBe(permission.allowedRoles.length);
    expect(permission.allowedRoles.every((roleName) => (
      ['ADMIN', 'LIBRARIAN', 'MEMBER'].includes(roleName)
    ))).toBe(true);
  }
  for (const repositoryMethod of Object.values(adminRepository)) {
    expect(repositoryMethod).not.toHaveBeenCalled();
  }
  expect(auditLogRepository.listAuditLogs).not.toHaveBeenCalled();
});

test('getPermissions returns fresh nested objects on every call', () => {
  const first = adminService.getPermissions();
  first.roles[0].label = 'Changed';
  first.permissions[0].label = 'Changed';
  first.permissions[0].allowedRoles.push('MEMBER');
  first.permissions.reverse();

  const second = adminService.getPermissions();
  expect(second.roles[0]).toEqual({ roleName: 'ADMIN', label: 'Admin' });
  expect(second.permissions[0]).toMatchObject({
    permissionKey: 'USER_VIEW',
    label: 'View users',
    allowedRoles: ['ADMIN'],
  });
  expect(second.permissions).toEqual(EXPECTED_PERMISSIONS);
});

test('listBooks forwards normalized search and status filters to the Admin library query', async () => {
  adminRepository.listBooks.mockResolvedValue([{ id: 1, title: 'Clean Code' }]);

  await expect(adminService.listBooks({ q: '  Clean  ', status: 'active' })).resolves.toEqual({
    data: [{ id: 1, title: 'Clean Code' }],
  });
  expect(adminRepository.listBooks).toHaveBeenCalledWith({
    q: 'Clean',
    status: 'ACTIVE',
  });
});
