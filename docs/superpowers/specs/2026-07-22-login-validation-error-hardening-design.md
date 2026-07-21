# Login Validation And Error Feedback Hardening Design

## Scope

Harden the existing FE02 login screen without changing authentication, account-state, token, or lockout rules.

The change covers:

- Client-side presentation validation for the combined email/username field and password.
- Safe Vietnamese feedback for invalid credentials, locked accounts, invalid request shapes, HTTPS enforcement, and network failures.
- Server-side login identifier length alignment with the approved 255-character email contract.
- Regression tests for the frontend helpers, form wiring, and backend long-email login flow.

## Design

`frontend/src/utils/authUx.js` owns two pure functions:

- `validateLoginFields(values)` returns field-keyed Vietnamese presentation errors. It trims only the identifier, requires both fields, and enforces the server's 255-character boundary. It does not enforce email syntax because the field also accepts usernames, and it does not enforce password complexity during login.
- `getLoginErrorMessage(error)` maps stable safe API codes to Vietnamese copy. Unknown server failures use a generic fallback, and network failures never mention localhost or expose the configured API URL.

`LoginForm.jsx` uses `validateLoginFields` before calling the page callback, disables native form validation so localized MUI field errors remain authoritative, caps the input buffer at 256 so the over-255 branch is observable, clears stale field errors while editing, prevents duplicate submission while pending, and sends a trimmed identifier. `LoginPage.jsx` clears stale API feedback when the user edits credentials.

`authApi.js` delegates login error presentation to `getLoginErrorMessage`. It never renders raw backend messages, validation details, stack traces, credentials, tokens, or account-existence information.

`authValidators.js` retains mandatory server-side validation and changes the combined identifier maximum from 100 to 255 characters, matching `Users.Email` and FE02 data requirements.

## Security Invariants

- Unknown and inactive accounts remain indistinguishable through `INVALID_CREDENTIALS`.
- Only `ACCOUNT_LOCKED` receives account-state-specific guidance because FE02 explicitly requires the lock message.
- No password, token, raw Axios error, stack trace, or backend implementation detail is logged or rendered.
- Client validation improves feedback but never replaces server validation.
- Password values are not trimmed or normalized.

## Test Strategy

- Pure frontend tests cover empty/whitespace identifiers, overlength fields, valid values, safe error-code mapping, generic unknown errors, and environment-neutral network feedback.
- Source integration assertions prove `LoginForm` calls the helper and renders field errors, while `authApi` uses the safe mapper.
- Backend integration proves an email longer than 100 but no longer than 255 characters can register, verify, and login.
- Full frontend tests, focused backend auth tests, frontend lint/build, and diff/secret checks form the completion gate.

## Out Of Scope

- Changing lockout thresholds or timing.
- Revealing inactive, deactivated, or unknown account states.
- Adding password-strength checks to login.
- Moving tokens from the existing storage strategy.
- Refactoring unrelated auth, registration, or recovery flows.
