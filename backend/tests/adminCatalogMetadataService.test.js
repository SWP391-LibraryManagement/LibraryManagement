const mockTransaction = { name: 'catalog-transaction' };

jest.mock('../src/repositories/adminRepository', () => ({
  getResourceConfig: jest.fn(),
  withTransaction: jest.fn(),
  createResource: jest.fn(),
  updateResource: jest.fn(),
  deactivateResource: jest.fn(),
}));
jest.mock('../src/repositories/auditLogRepository', () => ({
  create: jest.fn(),
  listAuditLogs: jest.fn(),
}));

const adminRepository = require('../src/repositories/adminRepository');
const auditLogRepository = require('../src/repositories/auditLogRepository');
const adminService = require('../src/services/adminService');

const context = { actorId: 7, ip: '203.0.113.7', userAgent: 'jest-catalog' };

beforeEach(() => {
  jest.clearAllMocks();
  adminRepository.getResourceConfig.mockImplementation((resource) => ({ resource }));
  adminRepository.withTransaction.mockImplementation((work) => work(mockTransaction));
});

test.each([
  ['authors', 'AUTHOR'],
  ['publishers', 'PUBLISHER'],
  ['categories', 'CATEGORY'],
])('create %s writes required catalog audit in the mutation transaction', async (resource, targetType) => {
  adminRepository.createResource.mockResolvedValue({ id: 11, name: 'Name', status: 'ACTIVE' });

  await expect(adminService.createResource(resource, { name: ' Name ' }, context)).resolves.toEqual({
    data: { id: 11, name: 'Name', status: 'ACTIVE' },
  });
  expect(adminRepository.createResource).toHaveBeenCalledWith(resource, 'Name', mockTransaction);
  expect(auditLogRepository.create).toHaveBeenCalledWith({
    userId: 7,
    action: 'CATALOG_METADATA_CREATE',
    targetType,
    targetId: 11,
    metadata: { resource },
    ipAddress: '203.0.113.7',
    userAgent: 'jest-catalog',
    transaction: mockTransaction,
  });
});

test('update returns not found and does not write a success audit when no row exists', async () => {
  adminRepository.updateResource.mockResolvedValue(null);

  await expect(adminService.updateResource('authors', 404, { name: 'Missing' }, context))
    .rejects.toMatchObject({ statusCode: 404, code: 'ADMIN_RESOURCE_ITEM_NOT_FOUND' });
  expect(auditLogRepository.create).not.toHaveBeenCalled();
});

test('update and deactivate use allowlisted audit payloads in the same transaction', async () => {
  adminRepository.updateResource.mockResolvedValue({ id: 3, name: 'Updated' });
  adminRepository.deactivateResource.mockResolvedValue(1);

  await adminService.updateResource('authors', 3, { name: 'Updated' }, context);
  await adminService.deactivateResource('authors', 3, context);

  expect(auditLogRepository.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
    action: 'CATALOG_METADATA_UPDATE',
    targetType: 'AUTHOR',
    targetId: 3,
    metadata: { resource: 'authors', changedFields: ['name'] },
    transaction: mockTransaction,
  }));
  expect(auditLogRepository.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
    action: 'CATALOG_METADATA_DEACTIVATE',
    targetType: 'AUTHOR',
    targetId: 3,
    metadata: { resource: 'authors', newStatus: 'INACTIVE' },
    transaction: mockTransaction,
  }));
});

test('audit failure rejects the transaction work instead of reporting mutation success', async () => {
  adminRepository.createResource.mockResolvedValue({ id: 5, name: 'Atomic' });
  auditLogRepository.create.mockRejectedValue(new Error('audit insert failed'));

  await expect(adminService.createResource('authors', { name: 'Atomic' }, context))
    .rejects.toThrow('audit insert failed');
});
