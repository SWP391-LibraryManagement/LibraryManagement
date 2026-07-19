# Auth Account Setup Boundary Validation Review - 2026-07-15

Status: B7 INTEGRATION COMPLETE

Branch: `fix/auth-account-setup-boundary`

## Scope

Record the Task 7 validation gate for the ADR-005 account-setup lifecycle shared by FE02 Authentication, FE10 Notification Management, and FE11 User & Role Management.

Implementation commits:

- `547f986` - sensitive notification source ownership.
- `3e25875` - configured FE10 provider adapter.
- `ff885b7` - transactional inactive account creation.
- `57068d2` - atomic FE02 setup completion.
- `d80b8f2` - Admin setup resend.
- `fa63acc` - frontend setup-link recovery flow.

## Validated Behavior

- Admin-created accounts remain `INACTIVE` until one valid FE11 `ACCOUNT_SETUP` token is consumed by FE02.
- User/profile/role/setup-token/audit creation commits or rolls back together.
- FE10 accepts `ACCOUNT_SETUP` only from the requester bound to `FE11`, uses `AuthToken` token-ID traceability, and persists no raw setup credential or rendered sensitive content.
- FE02 setup completion atomically updates password, email verification, lock fields, account status, token usage/revocation, and audit state.
- Password-reset credentials cannot activate an inactive account.
- Admin resend rejects missing, active, locked, deleted, self-registered, completed, and cooldown-limited targets without issuing a credential.
- Eligible resend revokes prior active setup tokens, creates a new 24-hour token/event/key, audits transactionally, and treats provider failure as non-blocking.
- The frontend token-query flow renders only password and confirmation controls, submits `{ token, newPassword }`, and shows a safe invalid/expired-link message.

## Automated Evidence

| Check | Result |
| --- | --- |
| Focused FE02/FE10/FE11 plus affected integration tests | PASS - 6 suites, 170/170 tests |
| Frontend tests | PASS - 75/75 |
| Frontend touched-file lint | PASS |
| Frontend production build | PASS; existing 982.35 kB chunk warning only |
| Traceability enforcement | PASS; no enforced feature below 70% |
| Changed-line credential/secret scan | PASS; no credential logging/storage or high-confidence secret additions |
| Placeholder scan | PASS; the only added `ACCOUNT_SETUP_PENDING` match is a negative regression assertion |
| Branch diff whitespace/conflict check | PASS |
| Worktree status before evidence edits | CLEAN |

Backend command:

```text
npm.cmd test -- authRoutes.test.js notificationRoutes.test.js userManagementService.test.js userManagementRoutes.test.js integration.test.js systemIntegration.test.js --runInBand
```

No live SQL suite or unrelated full SQL suite was run, matching the approved Task 7 scope.

## Security Review

- New SQL uses parameterized inputs and locked transactions for setup creation, completion, and resend.
- Raw setup tokens/links exist only in request memory and FE10 provider input; tests prove they do not persist or return.
- The frontend derives the token from `useSearchParams` and does not place it in component state, page copy, browser storage, or logs.
- Invalid, expired, used, revoked, ineligible, and concurrent setup attempts return safe errors without partial activation.
- Pre-existing FE02 test-mode `debugOtp`/legacy debug fields remain outside the ADR-005 account-setup slice. No `debugSetupToken` exists or was added; ADR-004 OTP closeout remains tracked separately by FE02-T030..T033 and FE10-S02..S05.

## Human Review History

Nhat reviewed the implementation incrementally through Task 6 and explicitly confirmed `đã review` for this Task 7 packet on 2026-07-15. This closes FE02-T037, FE10-S08, and FE11-S07; it does not itself select a merge or push option.

## B7 Integration Evidence

- The account-setup boundary merged into `main` as `c7f78213a62a83a133e9571c149468a054e48219`.
- Main commit `e8f467c7f53e75d36c2834429b92beafca819919` contains that merge.
- GitHub Actions CI run `29392143926` completed successfully on `e8f467c7f53e75d36c2834429b92beafca819919`.

This completes B7 integration evidence for the bounded account-setup slice. It does not claim whole-feature completion for FE02, FE10, or FE11.

## Residual Risks

- Live Azure SQL behavior was not rerun in Task 7; transaction semantics are covered by focused rollback/concurrency tests and SQL review, but a deployed-database smoke test remains an integration risk.
- Real SMTP delivery depends on deployment environment variables and provider availability; validation uses the configured adapter contract and injected provider behavior rather than sending a live email.
- Vite reports the existing 982.35 kB JavaScript chunk advisory; this does not block the setup flow but remains a frontend performance debt.
- FE11 user-list/update/deactivation/role-management debt remains explicitly deferred outside this account-setup slice.

## Review Checklist For Nhat

1. Confirm an Admin-created account remains `INACTIVE` before setup and becomes `ACTIVE` only after a valid setup link is completed.
2. Confirm create/resend responses and UI never display a password, setup token, setup link, or provider detail.
3. Confirm resend rejects ineligible accounts and enforces the 60-second cooldown.
4. Confirm an invalid/expired/used setup link shows the safe frontend error and does not activate the account.
5. Confirm the existing verification/reset OTP and `CHANGE_PASSWORD_OTP` behaviors were not widened by ADR-005 work.

Verdict: **Task 7 validation, human review, merge, and post-merge CI are complete through B7 for the bounded account-setup slice.**
