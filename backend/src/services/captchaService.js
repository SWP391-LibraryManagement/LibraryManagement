const crypto = require('crypto');
const errors = require('../utils/safeErrors');
const { renderCaptchaSvgDataUri } = require('../utils/captchaRenderer');

const CAPTCHA_TTL_SECONDS = 5 * 60;
const CAPTCHA_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DEFAULT_MAX_ACTIVE_CHALLENGES = 5000;

function answerDigest(answer) {
  return crypto.createHash('sha256').update(answer).digest();
}

function createCaptchaService({
  clock = Date.now,
  randomInt = crypto.randomInt,
  randomBytes = crypto.randomBytes,
  renderImage = renderCaptchaSvgDataUri,
  maxActiveChallenges = DEFAULT_MAX_ACTIVE_CHALLENGES,
  onChallengeIssued,
} = {}) {
  const challenges = new Map();

  function removeExpired(now) {
    for (const [token, record] of challenges) {
      if (record.expiresAt <= now) challenges.delete(token);
    }
  }

  function createChallenge() {
    const now = clock();
    removeExpired(now);
    if (challenges.size >= maxActiveChallenges) {
      throw errors.serviceUnavailable(
        'CAPTCHA_UNAVAILABLE',
        'Captcha is temporarily unavailable.'
      );
    }

    const answer = Array.from(
      { length: randomInt(3) + 4 },
      () => CAPTCHA_ALPHABET[randomInt(CAPTCHA_ALPHABET.length)]
    ).join('');
    let captchaToken;
    do {
      captchaToken = randomBytes(32).toString('base64url');
    } while (challenges.has(captchaToken));

    const expiresAt = now + CAPTCHA_TTL_SECONDS * 1000;
    challenges.set(captchaToken, {
      answerDigest: answerDigest(answer),
      expiresAt,
    });
    onChallengeIssued?.({ captchaToken, answer, expiresAt });

    return {
      image: renderImage(answer, { randomInt }),
      captchaToken,
      expiresIn: CAPTCHA_TTL_SECONDS,
    };
  }

  function verifyChallenge(captchaToken, captchaAnswer) {
    if (typeof captchaToken !== 'string') return false;

    const record = challenges.get(captchaToken);
    if (!record) return false;
    challenges.delete(captchaToken);
    if (
      record.expiresAt <= clock()
      || typeof captchaAnswer !== 'string'
      || !/^[A-Z]{4,6}$/i.test(captchaAnswer.trim())
    ) return false;

    return crypto.timingSafeEqual(
      answerDigest(captchaAnswer.trim().toUpperCase()),
      record.answerDigest
    );
  }

  return { createChallenge, verifyChallenge };
}

const defaultCaptchaService = createCaptchaService();

module.exports = { createCaptchaService, defaultCaptchaService };
