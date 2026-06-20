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
  };

  return {
    app: createApp({ authService, profileService: service }),
    authService,
    profileService: service,
  };
}

describe('FE03 profile routes', () => {
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
});
