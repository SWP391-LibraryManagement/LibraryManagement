# Login Validation And Error Feedback Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make FE02 login validation and error feedback accurate, actionable, localized, and consistent with the approved 255-character email contract.

**Architecture:** Add pure presentation helpers to `authUx.js`, wire them into the existing login form/API adapter, and preserve mandatory Express validation. Stable backend codes are mapped to safe Vietnamese copy instead of rendering raw server messages.

**Tech Stack:** React 19, MUI 9, Axios, Node test runner, Express 5, express-validator, Jest/Supertest.

## Global Constraints

- Do not reveal whether an email exists or whether an account is inactive.
- Do not log or render passwords, tokens, raw errors, stack traces, or credentials.
- Keep backend validation authoritative.
- Accept email or username in the combined login identifier field.
- Match the approved maximum email length of 255 characters.
- Make only surgical FE02 changes and leave generated implementation uncommitted until human review.

---

### Task 1: Frontend Login Presentation Contracts

**Files:**
- Modify: `frontend/test/authUxFrontend.test.js`
- Modify: `frontend/test/loginFrontend.test.js`
- Modify: `frontend/src/utils/authUx.js`

**Interfaces:**
- Produces: `validateLoginFields(values = {}) -> Record<string, string>`.
- Produces: `getLoginErrorMessage(error) -> string`.

- [x] **Step 1: Write failing pure-helper tests**

Add assertions that whitespace identifiers and empty passwords return field errors, 256-character values are rejected, valid username/password values return `{}`, `INVALID_CREDENTIALS` stays generic, `ACCOUNT_LOCKED` explains reset/wait recovery, and network errors use environment-neutral copy.

- [x] **Step 2: Run tests to verify RED**

Run: `node --test test/authUxFrontend.test.js test/loginFrontend.test.js`

Expected: fail because `validateLoginFields` and `getLoginErrorMessage` are not exported and login wiring is absent.

- [x] **Step 3: Implement the pure helpers**

Implement only required/maximum checks for login fields. Map stable login codes without reading raw `error.response.data.error.message` or details.

- [x] **Step 4: Run tests to verify GREEN**

Run: `node --test test/authUxFrontend.test.js test/loginFrontend.test.js`

Expected: helper tests pass; source wiring assertions may remain RED until Task 2.

### Task 2: Login Form And API Wiring

**Files:**
- Modify: `frontend/src/component/login/LoginForm.jsx`
- Modify: `frontend/src/component/login/AuthCard.jsx`
- Modify: `frontend/src/page/LoginPage.jsx`
- Modify: `frontend/src/api/authApi.js`
- Test: `frontend/test/authUxFrontend.test.js`
- Test: `frontend/test/loginFrontend.test.js`

**Interfaces:**
- Consumes: `validateLoginFields` and `getLoginErrorMessage` from `authUx.js`.
- Produces: field-level MUI feedback and safe page-level API feedback.

- [x] **Step 1: Keep source wiring assertions RED**

Assert that the form imports/calls `validateLoginFields`, renders `error` and `helperText`, disables native form validation, caps both HTML input buffers at 256 characters so the over-255 branch remains observable, guards `isSubmitting`, and calls `onInputChange` while editing. Assert that `authApi.js` calls `getLoginErrorMessage` for login.

- [x] **Step 2: Implement minimal wiring**

Add `fieldErrors` state, validate before submit, trim the identifier only, clear stale feedback on edits, disable fields while pending, and route login Axios failures through the safe mapper.

- [x] **Step 3: Run focused frontend tests**

Run: `node --test test/authUxFrontend.test.js test/loginFrontend.test.js test/vietnameseUi.test.js`

Expected: all focused tests pass without permitting raw backend messages.

### Task 3: Backend Identifier Boundary

**Files:**
- Modify: `backend/tests/authRoutes.test.js`
- Modify: `backend/src/validators/authValidators.js`

**Interfaces:**
- Produces: `/api/auth/login` accepts string identifiers up to 255 characters and rejects longer input with `VALIDATION_ERROR`.

- [x] **Step 1: Write a failing integration test**

Register and verify a standards-valid email longer than 100 characters, then assert login returns `200`.

- [x] **Step 2: Run the focused test to verify RED**

Run: `npm test -- --runTestsByPath tests/authRoutes.test.js`

Expected: the new case receives `400 VALIDATION_ERROR` from the 100-character login validator.

- [x] **Step 3: Align the backend validator**

Change the combined login identifier maximum to 255 and add explicit safe validation messages for wrong type, missing value, and overlength input.

- [x] **Step 4: Run the focused backend suite to verify GREEN**

Run: `npm test -- --runTestsByPath tests/authRoutes.test.js`

Expected: all auth route tests pass.

### Task 4: Traceability And Completion Gate

**Files:**
- Modify: `.sdd/specs/feat-auth/SPEC.md`
- Modify: `.sdd/specs/feat-auth/TASKS.md`
- Modify: `.sdd/specs/feat-auth/CHANGELOG.md`

**Interfaces:**
- Records: login presentation validation, safe localized error mapping, and the 255-character identifier boundary under the existing FE02 rules.

- [x] **Step 1: Update FE02 records**

Clarify that password-strength guidance applies when creating/changing/resetting a password rather than when entering an existing password at login. Add the maintenance task and changelog evidence.

- [x] **Step 2: Run full verification**

Run frontend tests, lint, and build; run focused backend auth tests; run traceability and `git diff --check`; inspect changed files for credential logging and raw backend error rendering.

- [x] **Step 3: Leave changes for human review**

Do not commit, push, or merge until the local diff and verification evidence are reviewed.
