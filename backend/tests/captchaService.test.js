const { createCaptchaService } = require('../src/services/captchaService');
const { renderCaptchaSvgDataUri } = require('../src/utils/captchaRenderer');

// @spec BR-FE02-029, FR-FE02-028, FR-FE02-029, FR-FE02-030, AC-FE02-027

function decodeSvg(image) {
  return Buffer.from(image.split(',')[1], 'base64').toString('utf8');
}

function deterministicOptions(overrides = {}) {
  let now = 1_800_000_000_000;
  const values = [0, 0, 1, 2, 3]; // Four letters: A, B, C, D.
  let tokenByte = 1;
  let issued = null;

  return {
    options: {
      clock: () => now,
      randomInt: () => values.shift() ?? 0,
      randomBytes: (size) => Buffer.alloc(size, tokenByte++),
      renderImage: () => 'data:image/svg+xml;base64,PHN2Zy8+',
      onChallengeIssued: (challenge) => { issued = challenge; },
      ...overrides,
    },
    advance(milliseconds) {
      now += milliseconds;
    },
    issued() {
      return issued;
    },
  };
}

test('issues an opaque token and accepts the normalized answer only once', () => {
  const harness = deterministicOptions();
  const service = createCaptchaService(harness.options);
  const challenge = service.createChallenge();

  expect(challenge).toMatchObject({ expiresIn: 300 });
  expect(challenge.captchaToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(challenge.captchaToken).not.toContain('ABCD');
  expect(service.verifyChallenge(`${challenge.captchaToken}x`, 'ABCD')).toBe(false);
  expect(service.verifyChallenge(challenge.captchaToken, ' abcd ')).toBe(true);
  expect(service.verifyChallenge(challenge.captchaToken, 'ABCD')).toBe(false);
});

test('consumes a challenge after an incorrect answer', () => {
  const harness = deterministicOptions();
  const service = createCaptchaService(harness.options);
  const challenge = service.createChallenge();

  expect(service.verifyChallenge(challenge.captchaToken, 'WRONG')).toBe(false);
  expect(service.verifyChallenge(challenge.captchaToken, harness.issued().answer)).toBe(false);
});

test('consumes a challenge after a malformed answer', () => {
  const harness = deterministicOptions();
  const service = createCaptchaService(harness.options);
  const challenge = service.createChallenge();

  expect(service.verifyChallenge(challenge.captchaToken, '1')).toBe(false);
  expect(service.verifyChallenge(challenge.captchaToken, harness.issued().answer)).toBe(false);
});

test('rejects expired challenges and frees bounded capacity during cleanup', () => {
  const harness = deterministicOptions({ maxActiveChallenges: 1 });
  const service = createCaptchaService(harness.options);
  const expired = service.createChallenge();
  harness.advance(300_001);

  expect(service.verifyChallenge(expired.captchaToken, harness.issued().answer)).toBe(false);
  expect(() => service.createChallenge()).not.toThrow();
});

test('fails closed when the active challenge capacity is exhausted', () => {
  const harness = deterministicOptions({ maxActiveChallenges: 1 });
  const service = createCaptchaService(harness.options);
  service.createChallenge();

  let error;
  try {
    service.createChallenge();
  } catch (caught) {
    error = caught;
  }

  expect(error).toMatchObject({
    statusCode: 503,
    code: 'CAPTCHA_UNAVAILABLE',
  });
});

test('renders SVG paths without answer text or text nodes', () => {
  const image = renderCaptchaSvgDataUri('ABCD', { randomInt: () => 0 });
  const svg = decodeSvg(image);

  expect(svg).toContain('<path');
  expect(svg).not.toMatch(/<text\b/i);
  expect(svg).not.toContain('ABCD');
  expect(svg).not.toMatch(/answer|captcha-answer/i);
});
