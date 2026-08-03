const { createCaptcha, verifyCaptcha } = require('../src/utils/captchaUtils');
const { createCaptchaValidator } = require('../src/middleware/captchaMiddleware');

describe('captchaUtils', () => {
  beforeAll(() => { process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'; });

  test('creates a signed image challenge and accepts its rendered answer', () => {
    const challenge = createCaptcha();
    const svg = Buffer.from(challenge.image.split(',')[1], 'base64').toString('utf8');
    const answer = svg.match(/<text[^>]*>([A-Z]+)<\/text>/)[1];
    expect(answer).toMatch(/^[A-Z]{4,6}$/);
    expect(verifyCaptcha(challenge.captchaToken, answer.toLowerCase())).toBe(true);
    expect(verifyCaptcha(`${challenge.captchaToken}x`, answer)).toBe(false);
    expect(verifyCaptcha(challenge.captchaToken, 'WRONG')).toBe(false);
  });

  test('rejects an invalid CAPTCHA before the auth route can dispatch a service', () => {
    const next = jest.fn();
    createCaptchaValidator({ required: true })({ body: { captchaToken: 'bad', captchaAnswer: 'WRONG' } }, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'CAPTCHA_INVALID', statusCode: 400 }));
  });
});
