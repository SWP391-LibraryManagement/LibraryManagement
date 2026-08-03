# CAPTCHA contract

`GET /api/auth/captcha` returns `{ image, captchaToken, expiresIn: 300 }`.

- `captchaToken` is a cryptographically random 32-byte opaque identifier. It contains no answer, answer hash, expiry payload, or JWT/HMAC data.
- `image` is an SVG data URI built from path segments. It contains no `<text>` node, plaintext answer, or answer metadata.
- The server keeps the answer digest and expiry in a process-local challenge store capped at 5,000 active records.
- The challenge expires after 5 minutes and is deleted on its first identified verification attempt before answer comparison.
- If the store remains full after expired-record cleanup, the endpoint returns `503 CAPTCHA_UNAVAILABLE`.

`POST /api/auth/login` and `POST /api/auth/register` require `captchaToken` and `captchaAnswer`.

- Answers are trimmed and compared case-insensitively.
- Missing, malformed, unknown, expired, incorrect, consumed, or replayed challenges return `400 CAPTCHA_INVALID` before auth service dispatch.
- No production route bypass is derived from `NODE_ENV`.

The approved deployment boundary is one backend instance. A process restart invalidates outstanding challenges; multi-instance deployment requires a shared TTL store or an approved external provider.
