# Data model - CAPTCHA FE02

No database entity is added.

| Value | Location | Rules |
| --- | --- | --- |
| `captchaToken` | signed client token | HMAC signature, answer hash, expiry 5 minutes |
| `captchaAnswer` | login/register request | 4-6 Latin letters, trim and case-insensitive comparison |
| `image` | CAPTCHA response | SVG data URI containing only the rendered challenge |
