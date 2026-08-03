# CAPTCHA quickstart

1. Start backend and frontend using their existing dev scripts.
2. Open `/login` or `/register`; a path-rendered 4-6-letter CAPTCHA appears and submit remains disabled until its opaque token loads.
3. Enter the displayed letters and submit valid credentials/details; the existing flow continues once and that challenge cannot be replayed.
4. Enter an incorrect answer; expect `CAPTCHA_INVALID`, no auth-side effect, preserved form fields, and a new image.
5. If the backend restarts or CAPTCHA loading fails, use the retry action to request a new challenge; outstanding tokens from the old process are intentionally invalid.
6. Run `npm.cmd --prefix backend test -- --runTestsByPath tests/captchaService.test.js tests/captchaRoutes.test.js`, then `npm.cmd --prefix frontend test`, `npm.cmd --prefix frontend run lint`, and `npm.cmd --prefix frontend run build`.

The current contract assumes one backend instance. Do not scale horizontally until challenge state is moved to a shared TTL store or an external CAPTCHA provider is approved.
