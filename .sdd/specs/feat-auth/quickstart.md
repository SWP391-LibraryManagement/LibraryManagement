# CAPTCHA quickstart

1. Start backend and frontend using their existing dev scripts.
2. Open `/login` or `/register`; a letter CAPTCHA image appears.
3. Enter its text and submit valid credentials/details; the existing flow continues.
4. Enter an incorrect CAPTCHA; expect a Vietnamese error, no auth-side effect, and a new image.
5. Run `npm.cmd test -- --runTestsByPath tests/authRoutes.test.js` in `backend`, then `npm.cmd test` and `npm.cmd run build` in `frontend`.
