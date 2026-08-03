const crypto = require('crypto');
const env = require('../config/env');

const CAPTCHA_TTL_SECONDS = 5 * 60;
const CAPTCHA_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

function answerHash(answer) {
  return crypto.createHash('sha256').update(answer).digest('hex');
}

function sign(payload) {
  return crypto.createHmac('sha256', env.requiredEnv('JWT_SECRET')).update(payload).digest('base64url');
}

function createCaptcha() {
  const answer = Array.from({ length: crypto.randomInt(4, 7) }, () =>
    CAPTCHA_ALPHABET[crypto.randomInt(CAPTCHA_ALPHABET.length)]
  ).join('');
  const payload = Buffer.from(JSON.stringify({ answerHash: answerHash(answer), exp: Math.floor(Date.now() / 1000) + CAPTCHA_TTL_SECONDS })).toString('base64url');
  const captchaToken = `${payload}.${sign(payload)}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="54" viewBox="0 0 180 54"><rect width="180" height="54" fill="#f4eadb"/><text x="90" y="36" text-anchor="middle" font-family="monospace" font-size="30" font-weight="700" letter-spacing="5" fill="#6d4c41">${answer}</text></svg>`;

  return { image: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, captchaToken, expiresIn: CAPTCHA_TTL_SECONDS };
}

function verifyCaptcha(captchaToken, captchaAnswer) {
  if (typeof captchaToken !== 'string' || typeof captchaAnswer !== 'string') return false;
  const [payload, signature, extra] = captchaToken.split('.');
  if (!payload || !signature || extra || !/^[A-Z]{4,6}$/i.test(captchaAnswer.trim())) return false;

  const expectedSignature = sign(payload);
  if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return false;

  try {
    const { answerHash: expectedHash, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number.isInteger(exp) && exp >= Math.floor(Date.now() / 1000)
      && crypto.timingSafeEqual(Buffer.from(answerHash(captchaAnswer.trim().toUpperCase())), Buffer.from(expectedHash));
  } catch (_error) {
    return false;
  }
}

module.exports = { createCaptcha, verifyCaptcha };
