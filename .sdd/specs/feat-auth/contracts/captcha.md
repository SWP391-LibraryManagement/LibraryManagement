# CAPTCHA contract

`GET /api/auth/captcha` returns `{ image, captchaToken, expiresIn: 300 }`.

`POST /api/auth/login` and `POST /api/auth/register` require `captchaToken` and `captchaAnswer`; invalid, tampered or expired input returns `400 CAPTCHA_INVALID`.
