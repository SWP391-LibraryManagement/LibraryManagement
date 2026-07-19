process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');

const request = require('supertest');
const { createApp } = require('../src/app');

function makeApp({ userId = 7, profileService, authError } = {}) {
  const authService = {
    authenticateToken: jest.fn(async () => {
      if (authError) {
        throw authError;
      }

      return {
        userId,
        email: 'member@example.test',
        username: 'member',
        roles: ['MEMBER'],
      };
    }),
  };

  const service = profileService || {
    getMyProfile: jest.fn(async () => ({
      userId,
      username: 'member',
      email: 'member@example.test',
      phone: '0900000001',
      status: 'ACTIVE',
      profileId: 3,
      fullName: 'Demo Member',
    })),
    updateMyProfile: jest.fn(async () => ({
      userId,
      username: 'member',
      email: 'member@example.test',
      phone: '0900000002',
      status: 'ACTIVE',
      profileId: 3,
      fullName: 'Updated Member',
    })),
    updateMyAvatar: jest.fn(async () => ({
      userId,
      username: 'member',
      email: 'member@example.test',
      phone: '0900000001',
      status: 'ACTIVE',
      profileId: 3,
      fullName: 'Demo Member',
      avatarUrl: '/uploads/avatars/7-avatar.png',
    })),
  };

  return {
    app: createApp({ authService, profileService: service }),
    authService,
    profileService: service,
  };
}

describe('FE03 profile routes', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('GET /api/profile/me requires authentication', async () => {
    const { app, profileService } = makeApp();

    const response = await request(app).get('/api/profile/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
    expect(profileService.getMyProfile).not.toHaveBeenCalled();
  });

  test('GET /api/profile/me returns current user profile from service', async () => {
    const { app, profileService } = makeApp();

    const response = await request(app)
      .get('/api/profile/me')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      userId: 7,
      email: 'member@example.test',
      fullName: 'Demo Member',
    });
    expect(response.body.passwordHash).toBeUndefined();
    expect(profileService.getMyProfile).toHaveBeenCalledWith(7);
  });

  test('PUT /api/profile/me passes authenticated user, payload, and context to service', async () => {
    const { app, profileService } = makeApp();

    const response = await request(app)
      .put('/api/profile/me')
      .set('Authorization', 'Bearer token')
      .set('User-Agent', 'profile-test')
      .send({
        fullName: 'Updated Member',
        phone: '0900000002',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      userId: 7,
      fullName: 'Updated Member',
      phone: '0900000002',
    });
    expect(profileService.updateMyProfile).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ fullName: 'Updated Member', phone: '0900000002' }),
      expect.objectContaining({ userAgent: 'profile-test' })
    );
  });

  test('POST /api/profile/me/avatar requires authentication', async () => {
    const { app, profileService } = makeApp();

    const response = await request(app)
      .post('/api/profile/me/avatar')
      .attach('avatar', Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
    expect(profileService.updateMyAvatar).not.toHaveBeenCalled();
  });

  test('POST /api/profile/me/avatar passes parsed avatar file to service', async () => {
    const { app, profileService } = makeApp();
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

    const response = await request(app)
      .post('/api/profile/me/avatar')
      .set('Authorization', 'Bearer token')
      .set('User-Agent', 'profile-avatar-test')
      .attach('avatar', pngBuffer, {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      userId: 7,
      avatarUrl: '/uploads/avatars/7-avatar.png',
    });
    expect(profileService.updateMyAvatar).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        originalName: 'avatar.png',
        mimeType: 'image/png',
        size: pngBuffer.length,
        buffer: expect.any(Buffer),
      }),
      expect.objectContaining({ userAgent: 'profile-avatar-test' })
    );
  });

  test('POST /api/profile/me/avatar rejects missing avatar file', async () => {
    const { app, profileService } = makeApp();

    const response = await request(app)
      .post('/api/profile/me/avatar')
      .set('Authorization', 'Bearer token')
      .field('notAvatar', 'value');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('AVATAR_FILE_REQUIRED');
    expect(profileService.updateMyAvatar).not.toHaveBeenCalled();
  });

  test.each([
    ['GET', 'getMyProfile'],
    ['PUT', 'updateMyProfile'],
    ['POST', 'updateMyAvatar'],
  ])('%s profile controller returns a safe generic error when %s fails', async (method, serviceMethod) => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const service = {
      getMyProfile: jest.fn(async () => ({})),
      updateMyProfile: jest.fn(async () => ({})),
      updateMyAvatar: jest.fn(async () => ({})),
    };
    service[serviceMethod].mockRejectedValueOnce(new Error('profile controller failure'));
    const { app } = makeApp({ profileService: service });

    let call;
    if (method === 'POST') {
      call = request(app)
        .post('/api/profile/me/avatar')
        .set('Authorization', 'Bearer token')
        .attach('avatar', Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
          filename: 'avatar.png',
          contentType: 'image/png',
        });
    } else {
      call = request(app)[method.toLowerCase()]('/api/profile/me')
        .set('Authorization', 'Bearer token');
      if (method === 'PUT') {
        call = call.send({ fullName: 'Updated Member' });
      }
    }

    const response = await call;

    expect(response.status).toBe(500);
    expect(response.body.error).toMatchObject({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
    });
    expect(JSON.stringify(response.body)).not.toContain('profile controller failure');
  });
});
