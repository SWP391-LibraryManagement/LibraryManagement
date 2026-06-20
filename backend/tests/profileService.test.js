const { createProfileService, validateProfileUpdate, toSafeProfileDto } = require('../src/services/profileService');

function makeProfile(overrides = {}) {
  return {
    userId: 1,
    username: 'member',
    email: 'member@example.test',
    passwordHash: 'secret-hash',
    phone: '0900000001',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: null,
    profileId: 10,
    fullName: 'Demo Member',
    address: 'Old Address',
    dateOfBirth: new Date('2000-01-02T00:00:00.000Z'),
    avatarUrl: 'https://example.test/avatar.png',
    ...overrides,
  };
}

function makeRepository(initialProfile = makeProfile()) {
  const state = {
    profile: initialProfile,
    createdBlank: false,
    updatedPayloads: [],
  };

  return {
    state,
    repository: {
      findByUserId: jest.fn(async () => state.profile),
      createBlankProfile: jest.fn(async (userId) => {
        state.createdBlank = true;
        state.profile = makeProfile({
          userId,
          profileId: 11,
          fullName: null,
          address: null,
          dateOfBirth: null,
          avatarUrl: null,
        });
        return state.profile;
      }),
      updateByUserId: jest.fn(async (userId, updates) => {
        state.updatedPayloads.push({ userId, updates });
        state.profile = {
          ...state.profile,
          ...Object.fromEntries(Object.entries(updates).filter((entry) => entry[1] !== undefined)),
        };
        return state.profile;
      }),
    },
  };
}

describe('FE03 profile service', () => {
  test('toSafeProfileDto excludes password hash and role internals', () => {
    const dto = toSafeProfileDto(makeProfile({ roles: ['MEMBER'], roleId: 2 }));

    expect(dto).toMatchObject({
      userId: 1,
      username: 'member',
      email: 'member@example.test',
      phone: '0900000001',
      status: 'ACTIVE',
      profileId: 10,
      fullName: 'Demo Member',
      dateOfBirth: '2000-01-02',
    });
    expect(dto.passwordHash).toBeUndefined();
    expect(dto.roles).toBeUndefined();
    expect(dto.roleId).toBeUndefined();
  });

  test('getMyProfile auto-creates missing profile record on first view', async () => {
    const { repository } = makeRepository(makeProfile({ profileId: null, fullName: null }));
    const service = createProfileService({ profileRepository: repository });

    const result = await service.getMyProfile(1);

    expect(repository.createBlankProfile).toHaveBeenCalledWith(1);
    expect(result).toMatchObject({
      userId: 1,
      profileId: 11,
      fullName: null,
    });
  });

  test('updateMyProfile saves allowed fields and writes audit for changed fields', async () => {
    const { repository } = makeRepository();
    const auditLogRepository = {
      create: jest.fn(async () => undefined),
    };
    const service = createProfileService({
      profileRepository: repository,
      auditLogRepository,
      clock: () => new Date('2026-06-20T00:00:00.000Z'),
    });

    const result = await service.updateMyProfile(
      1,
      {
        fullName: ' Updated Member ',
        address: 'New Address',
        dateOfBirth: '1999-12-31',
        avatarUrl: 'https://example.test/new.png',
        phone: '+84900000001',
      },
      { ip: '127.0.0.1', userAgent: 'jest' }
    );

    expect(repository.updateByUserId).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        fullName: 'Updated Member',
        address: 'New Address',
        dateOfBirth: '1999-12-31',
        avatarUrl: 'https://example.test/new.png',
        phone: '+84900000001',
      })
    );
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        action: 'PROFILE_UPDATE',
        targetType: 'USER_PROFILE',
        targetId: 1,
        metadata: expect.objectContaining({
          fields: expect.arrayContaining(['fullName', 'address', 'dateOfBirth', 'avatarUrl', 'phone']),
        }),
      })
    );
    expect(result).toMatchObject({
      fullName: 'Updated Member',
      phone: '+84900000001',
      dateOfBirth: '1999-12-31',
    });
  });

  test('protected fields are rejected before repository update', async () => {
    const { repository } = makeRepository();
    const service = createProfileService({ profileRepository: repository });

    await expect(
      service.updateMyProfile(1, {
        fullName: 'Allowed Name',
        email: 'changed@example.test',
        status: 'INACTIVE',
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'PROTECTED_FIELD_SUBMITTED',
    });

    expect(repository.updateByUserId).not.toHaveBeenCalled();
  });

  test('invalid profile update returns field-level errors and does not partially update', async () => {
    const { repository } = makeRepository();
    const service = createProfileService({
      profileRepository: repository,
      clock: () => new Date('2026-06-20T00:00:00.000Z'),
    });

    await expect(
      service.updateMyProfile(1, {
        fullName: 'A'.repeat(101),
        dateOfBirth: '2999-01-01',
        avatarUrl: 'ftp://example.test/avatar.png',
        phone: '123',
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_PROFILE_DATA',
      details: expect.arrayContaining([
        expect.objectContaining({ field: 'fullName' }),
        expect.objectContaining({ field: 'dateOfBirth' }),
        expect.objectContaining({ field: 'avatarUrl' }),
        expect.objectContaining({ field: 'phone' }),
      ]),
    });

    expect(repository.updateByUserId).not.toHaveBeenCalled();
  });

  test('validateProfileUpdate accepts nullable optional fields', () => {
    expect(validateProfileUpdate({ fullName: '', address: null, avatarUrl: '', phone: '' })).toEqual({
      fullName: null,
      address: null,
      dateOfBirth: undefined,
      avatarUrl: null,
      phone: null,
    });
  });
});
