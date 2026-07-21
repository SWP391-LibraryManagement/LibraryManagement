# Email Verification OTP 15-Minute Implementation Plan

> **For Codex:** Execute this plan inline with test-driven development. Do not push, merge, or deploy code without a separate user request.

**Goal:** Reduce self-registration email-verification OTP lifetime from 24 hours to 15 minutes and keep Azure staging consistent with the code contract.

**Architecture:** FE02 remains responsible for OTP generation, hashing, expiry, revocation, and validation. FE10 continues to receive `expiresInMinutes` from FE02 and only renders/delivers the email. A new minute-based environment setting is canonical; the old hour-based setting remains a temporary fallback for deployed environments.

**Tech Stack:** Node.js, Express, Jest, SQL Server-backed Azure App Service, Gmail SMTP through FE10.

---

### Task 1: Lock the approved contract in tests and specifications

**Files:**
- Modify: `.sdd/specs/feat-auth/SPEC.md`
- Modify: `.sdd/specs/feat-auth/PLAN.md`
- Modify: `.sdd/specs/feat-auth/TASKS.md`
- Modify: `backend/tests/authRoutes.test.js`
- Create: `backend/tests/envConfig.test.js`

1. Change registration and resend expectations from 1440 to 15 minutes.
2. Add configuration tests for the canonical minute setting, legacy-hour fallback, and invalid fractional minute values.
3. Run the focused tests and record the expected RED failure against the 24-hour implementation.

### Task 2: Implement the smallest compatible configuration change

**Files:**
- Modify: `backend/src/config/env.js`
- Modify: `backend/src/services/authService.js`
- Modify: `backend/.env.example`

1. Add validated `EMAIL_VERIFICATION_TTL_MINUTES`, defaulting to 15.
2. If it is absent, convert the legacy `EMAIL_VERIFICATION_TTL_HOURS` value to minutes.
3. Use the minute value directly for registration and resend token creation/delivery.
4. Rerun the focused tests until GREEN.

### Task 3: Verify local and Azure behavior

**Files:**
- Modify: `.sdd/specs/feat-auth/CHANGELOG.md`
- Modify: `.sdd/specs/feat-auth/CONTEXT.md`

1. Run the full backend suite, traceability, secret/leakage checks, and `git diff --check`.
2. Set Azure staging to `EMAIL_VERIFICATION_TTL_MINUTES=15` and legacy `EMAIL_VERIFICATION_TTL_HOURS=0.25` until the new code is deployed.
3. Restart staging, check `/health`, request one verification resend, and confirm Gmail renders a 15-minute expiry without exposing the OTP in project logs or the final report.
4. Leave all code changes unpushed and unmerged for user review.
