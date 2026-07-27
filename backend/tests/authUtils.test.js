process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');

const crypto = require('crypto');
const jwt = require('../src/node_modules/jsonwebtoken');
const { generateOtp } = require('../src/services/authService');
const { validatePasswordPolicy } = require('../src/utils/passwordPolicy');
const {
  generateRandomToken,
  hashToken,
  signAccessToken,
  verifyAccessToken,
} = require('../src/utils/tokenUtils');

describe('FE02 auth utilities', () => {
  test('password policy accepts a strong password', () => {
    const result = validatePasswordPolicy('Password1!');

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('password policy rejects missing uppercase, number, and special character', () => {
    const result = validatePasswordPolicy('password');

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  test('token helper creates random token and stable hash', () => {
    const token = generateRandomToken();

    expect(token).toEqual(expect.any(String));
    expect(token.length).toBeGreaterThan(20);
    expect(hashToken(token)).toBe(hashToken(token));
  });

  test('OTP generation uses secure randomness and preserves leading zeroes', () => {
    const randomInt = jest.spyOn(crypto, 'randomInt').mockReturnValueOnce(42);

    expect(generateOtp()).toBe('000042');
    expect(randomInt).toHaveBeenCalledWith(0, 1_000_000);
    randomInt.mockRestore();
  });

  test('JWT access token can be signed and verified', () => {
    const token = signAccessToken({
      userId: 123,
      email: 'member@example.test',
      username: 'member',
      roles: ['MEMBER'],
    });

    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe('123');
    expect(payload.roles).toEqual(['MEMBER']);
  });

  test('JWT verification uses the approved 30-second clock tolerance', () => {
    const verify = jest.spyOn(jwt, 'verify').mockReturnValueOnce({ sub: '123' });

    expect(verifyAccessToken('token')).toEqual({ sub: '123' });
    expect(verify).toHaveBeenCalledWith('token', process.env.JWT_SECRET, { clockTolerance: 30 });
    verify.mockRestore();
  });
});
