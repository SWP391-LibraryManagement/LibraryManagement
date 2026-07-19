const {
  createProfileService,
  validateAvatarUpload,
  validateProfileUpdate,
  toSafeProfileDto,
} = require('../src/services/profileService');

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
    updateOptions: [],
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
      updateByUserId: jest.fn(async (userId, updates, options = {}) => {
        state.updatedPayloads.push({ userId, updates });
        state.updateOptions.push(options);
        if (options.auditLogRepository && options.auditEntry) {
          await options.auditLogRepository.create(options.auditEntry);
        }
        state.profile = {
          ...state.profile,
          ...Object.fromEntries(Object.entries(updates).filter((entry) => entry[1] !== undefined)),
        };
        return state.profile;
      }),
      updateAvatarByUserId: jest.fn(async (userId, avatarUrl, options = {}) => {
        state.updateOptions.push(options);
        if (options.auditLogRepository && options.auditEntry) {
          await options.auditLogRepository.create(options.auditEntry);
        }
        state.profile = {
          ...state.profile,
          avatarUrl,
        };
        return state.profile;
      }),
    },
  };
}

function validPngFile(overrides = {}) {
  return {
    originalName: 'avatar.png',
    mimeType: 'image/png',
    size: 9,
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
    ...overrides,
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

  test('getMyProfile returns the approved not-found error when the account is missing', async () => {
    const { repository } = makeRepository(null);
    const service = createProfileService({ profileRepository: repository });

    await expect(service.getMyProfile(999)).rejects.toMatchObject({
      statusCode: 404,
      code: 'PROFILE_ACCOUNT_NOT_FOUND',
    });

    expect(repository.createBlankProfile).not.toHaveBeenCalled();
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
        phone: '+84900000001',
      }),
      expect.objectContaining({
        auditLogRepository,
        auditEntry: expect.objectContaining({
          userId: 1,
          action: 'PROFILE_UPDATE',
          targetType: 'USER_PROFILE',
          targetId: 1,
          metadata: { fields: ['fullName', 'address', 'dateOfBirth', 'phone'] },
        }),
      })
    );
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        action: 'PROFILE_UPDATE',
        targetType: 'USER_PROFILE',
        targetId: 1,
        metadata: expect.objectContaining({
          fields: ['fullName', 'address', 'dateOfBirth', 'phone'],
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

  test('empty profile update is rejected without a write or audit', async () => {
    const { repository } = makeRepository();
    const auditLogRepository = { create: jest.fn(async () => undefined) };
    const service = createProfileService({ profileRepository: repository, auditLogRepository });

    await expect(service.updateMyProfile(1, {})).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_PROFILE_DATA',
      details: [expect.objectContaining({ field: 'body' })],
    });

    expect(repository.updateByUserId).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });

  test.each([
    ['read-only avatarUrl', { avatarUrl: '/uploads/avatars/forbidden.png' }],
    ['unknown field', { nickname: 'not-approved' }],
  ])('%s rejects the entire PUT payload before repository update', async (_label, field) => {
    const { repository } = makeRepository();
    const service = createProfileService({
      profileRepository: repository,
      auditLogRepository: { create: jest.fn(async () => undefined) },
    });

    await expect(
      service.updateMyProfile(1, { fullName: 'Allowed Name', ...field })
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
        phone: '123',
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_PROFILE_DATA',
      details: expect.arrayContaining([
        expect.objectContaining({ field: 'fullName' }),
        expect.objectContaining({ field: 'dateOfBirth' }),
        expect.objectContaining({ field: 'phone' }),
      ]),
    });

    expect(repository.updateByUserId).not.toHaveBeenCalled();
  });

  test('validateProfileUpdate accepts nullable optional fields', () => {
    expect(validateProfileUpdate({ fullName: '', address: null, phone: '' })).toEqual({
      fullName: null,
      address: null,
      dateOfBirth: undefined,
      phone: null,
    });
  });

  test('updateMyAvatar stores generated avatar URL and writes audit', async () => {
    const { repository } = makeRepository();
    const auditLogRepository = {
      create: jest.fn(async () => undefined),
    };
    const avatarStorage = {
      saveAvatarFile: jest.fn(async () => '/uploads/avatars/1-generated.png'),
    };
    const service = createProfileService({
      profileRepository: repository,
      auditLogRepository,
      avatarStorage,
    });

    const result = await service.updateMyAvatar(
      1,
      validPngFile({ originalName: 'C:\\fakepath\\my-avatar.png' }),
      { ip: '127.0.0.1', userAgent: 'jest-avatar' }
    );

    expect(avatarStorage.saveAvatarFile).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        mimeType: 'image/png',
        buffer: expect.any(Buffer),
      })
    );
    expect(repository.updateAvatarByUserId).toHaveBeenCalledWith(
      1,
      '/uploads/avatars/1-generated.png',
      expect.objectContaining({
        auditLogRepository,
        auditEntry: expect.objectContaining({
          metadata: { fields: ['avatarUrl'] },
        }),
      })
    );
    expect(repository.updateAvatarByUserId).not.toHaveBeenCalledWith(
      1,
      expect.stringContaining('fakepath')
    );
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PROFILE_UPDATE',
        metadata: expect.objectContaining({ fields: ['avatarUrl'] }),
      })
    );
    expect(result.avatarUrl).toBe('/uploads/avatars/1-generated.png');
  });

  test('updateMyAvatar deletes the new file when the database or audit transaction fails', async () => {
    const { repository } = makeRepository();
    const transactionError = new Error('profile transaction failed');
    repository.updateAvatarByUserId.mockRejectedValueOnce(transactionError);
    const avatarStorage = {
      saveAvatarFile: jest.fn(async () => '/uploads/avatars/1-new.png'),
      deleteAvatarFile: jest.fn(async () => true),
    };
    const service = createProfileService({
      profileRepository: repository,
      auditLogRepository: { create: jest.fn(async () => undefined) },
      avatarStorage,
    });

    await expect(service.updateMyAvatar(1, validPngFile())).rejects.toBe(transactionError);

    expect(avatarStorage.deleteAvatarFile).toHaveBeenCalledWith('/uploads/avatars/1-new.png');
  });

  test('updateMyAvatar removes the replaced managed file only after the transaction commits', async () => {
    const { repository } = makeRepository(makeProfile({ avatarUrl: '/uploads/avatars/1-old.png' }));
    const avatarStorage = {
      saveAvatarFile: jest.fn(async () => '/uploads/avatars/1-new.png'),
      deleteAvatarFile: jest.fn(async () => true),
    };
    const service = createProfileService({
      profileRepository: repository,
      auditLogRepository: { create: jest.fn(async () => undefined) },
      avatarStorage,
    });

    await expect(service.updateMyAvatar(1, validPngFile())).resolves.toMatchObject({
      avatarUrl: '/uploads/avatars/1-new.png',
    });

    expect(avatarStorage.deleteAvatarFile).toHaveBeenCalledWith('/uploads/avatars/1-old.png');
  });

  test('old-avatar cleanup failure is logged without path or PII and does not roll back', async () => {
    const { repository } = makeRepository(makeProfile({ avatarUrl: '/uploads/avatars/1-old.png' }));
    const avatarStorage = {
      saveAvatarFile: jest.fn(async () => '/uploads/avatars/1-new.png'),
      deleteAvatarFile: jest.fn(async () => {
        throw new Error('C:\\sensitive\\uploads\\avatars\\1-old.png');
      }),
    };
    const logger = { error: jest.fn() };
    const service = createProfileService({
      profileRepository: repository,
      auditLogRepository: { create: jest.fn(async () => undefined) },
      avatarStorage,
      logger,
    });

    await expect(service.updateMyAvatar(1, validPngFile())).resolves.toMatchObject({
      avatarUrl: '/uploads/avatars/1-new.png',
    });

    expect(logger.error).toHaveBeenCalledWith('Failed to clean up a replaced avatar file.');
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain('sensitive');
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain('1-old.png');
  });

  test('updateMyAvatar rejects invalid upload without changing avatar', async () => {
    const { repository, state } = makeRepository();
    const avatarStorage = {
      saveAvatarFile: jest.fn(async () => '/uploads/avatars/1-generated.png'),
    };
    const service = createProfileService({ profileRepository: repository, avatarStorage });

    await expect(
      service.updateMyAvatar(
        1,
        validPngFile({
          originalName: 'avatar.txt',
          mimeType: 'text/plain',
        })
      )
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_AVATAR_FILE_TYPE',
    });

    expect(avatarStorage.saveAvatarFile).not.toHaveBeenCalled();
    expect(repository.updateAvatarByUserId).not.toHaveBeenCalled();
    expect(state.profile.avatarUrl).toBe('https://example.test/avatar.png');
  });

  test('validateAvatarUpload rejects oversized avatar files', () => {
    expect(() => validateAvatarUpload(validPngFile({
      size: 2 * 1024 * 1024 + 1,
    }))).toThrow(expect.objectContaining({
      statusCode: 400,
      code: 'AVATAR_FILE_TOO_LARGE',
    }));
  });

  test('validateAvatarUpload accepts jpg extension with jpeg content type', () => {
    expect(() => validateAvatarUpload({
      originalName: 'avatar.jpg',
      mimeType: 'image/jpeg',
      size: 4,
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0x00]),
    })).not.toThrow();
  });
});
