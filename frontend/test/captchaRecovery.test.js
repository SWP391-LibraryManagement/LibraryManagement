import test from 'node:test';
import assert from 'node:assert/strict';

import { loadCaptchaWithRetry } from '../src/utils/captchaRecovery.js';

test('retries one failed CAPTCHA load and returns the next challenge', async () => {
  let calls = 0;
  const challenge = {
    captchaToken: 'opaque-token',
    image: 'data:image/svg+xml;base64,PHN2Zy8+',
  };

  const result = await loadCaptchaWithRetry(async () => {
    calls += 1;
    if (calls === 1) throw new TypeError('temporary failure');
    return challenge;
  }, { retryDelayMs: 0, wait: async () => {} });

  assert.equal(result, challenge);
  assert.equal(calls, 2);
});

test('stops after the configured CAPTCHA attempts', async () => {
  let calls = 0;

  await assert.rejects(
    loadCaptchaWithRetry(async () => {
      calls += 1;
      throw new Error('unavailable');
    }, { attempts: 2, retryDelayMs: 0, wait: async () => {} }),
    /unavailable/
  );

  assert.equal(calls, 2);
});

test('does not retry a permanent CAPTCHA HTTP 404 response', async () => {
  let calls = 0;
  const error = new Error('not found');
  error.response = { status: 404 };

  await assert.rejects(
    loadCaptchaWithRetry(async () => {
      calls += 1;
      throw error;
    }, { attempts: 2, retryDelayMs: 0, wait: async () => {} }),
    /not found/
  );

  assert.equal(calls, 1);
});
