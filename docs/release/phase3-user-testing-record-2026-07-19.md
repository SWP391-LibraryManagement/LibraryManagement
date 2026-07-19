# Phase 3 User Testing and Rehearsal Record - 2026-07-19

## Evidence boundary

Only observed outcomes are marked `PASS`. The local authenticated workflow used
fresh synthetic identities and the deterministic in-memory E2E server. A
separate live run (`c6e0c46421f0`) also verified authenticated Azure role flows
and real SMTP delivery with ephemeral fixtures. Credentials, tokens, provider
responses, and message bodies are not retained in this record.

## Test environment

| Item | Value |
| --- | --- |
| Branch | `docs/phase3-polish-delivery` |
| Frontend test origin | `http://127.0.0.1:4273` |
| Backend test origin | `http://127.0.0.1:3200` |
| Browser | Playwright Chromium |
| Data | Synthetic `example.test` users; recreated by the E2E setup endpoint |
| Command | `npm.cmd run test:e2e` with the documented alternate port variables |
| Live Azure evidence | Run `c6e0c46421f0`; synthetic fixtures cleaned after observation |

## Automated user-flow results

| Scenario | Expected result | Observed result | Status |
| --- | --- | --- | --- |
| FE08 candidate catalog and reservation | Member sees safe SQL-shaped candidates and creates a real server-backed reservation. | Candidate search, pagination, and reservation creation completed. | PASS |
| FE09 fine workspace | Staff search, status filters, and pagination use the canonical server API. | Server response drove the rendered list; no browser-storage fallback was used. | PASS |
| FE11 Admin request management | Admin list/detail, export, terminal-state controls, and pagination remain authoritative. | The browser flow completed with server-owned request/detail data. | PASS |
| System login | Synthetic Member and Librarian can log in and reach role-correct routes. | Member reached `/home`; Librarian reached the staff workspace. | PASS |
| Borrow request | Eligible Member creates one request. | Request and detail were created as `PENDING`/`REQUESTED`. | PASS |
| Librarian approval | Librarian approves and allocates the copy. | Request became approved and the copy/detail became borrowed. | PASS |
| Overdue return and fine | Fourteen overdue days calculate exactly 70,000 VND. | Return produced the fine handoff; FE09 created `UNPAID` 70,000 VND and then recorded `PAID`. | PASS |
| FE12 report | Borrowing activity appears and the report remains read-only. | One integrated record appeared in the report. | PASS |
| Responsive report | 390x844 viewport has no blocking horizontal overflow. | Browser assertion returned no document overflow. | PASS |

Aggregate browser result: **4/4 Playwright tests passed in 24.4 seconds**.

## Visual review

The following fresh screenshots were inspected after the route-level lazy-load
change:

- [`manual-login.png`](../assets/user-manual/manual-login.png): login form is
  readable, focused, and contains no test credential value.
- [`manual-librarian-approval.png`](../assets/user-manual/manual-librarian-approval.png):
  request list/detail and success state remain coherent.
- [`system-golden-path-desktop.png`](../assets/phase3/system-golden-path-desktop.png):
  report cards, filter controls, and navigation do not overlap.
- [`system-golden-path-mobile.png`](../assets/phase3/system-golden-path-mobile.png):
  mobile controls stack correctly and the page has no horizontal overflow.

Visual decision: **PASS for the inspected synthetic local flow**. This is agent
operator evidence, not a claim that an external end user tested Azure staging.

## Staging acceptance

| Scenario | Status | Evidence |
| --- | --- | --- |
| Frontend HTML | PASS | Phase 3 six-check staging smoke. |
| Backend health | PASS | `/health` returned `200` after App Service warm-up. |
| Azure SQL public catalog | PASS | `/api/books?page=1&limit=1` returned the canonical envelope after migration reconciliation. |
| Strict CORS | PASS | Exact frontend origin allowed; untrusted origin blocked. |
| Anonymous protected route | PASS | `/api/auth/me` returned `401`. |
| Authenticated Member/Librarian Azure flow | PASS | Live run `c6e0c46421f0` verified role login, protected reads, borrow request, approval, and return. |
| Real SMTP delivery | PASS | Notification `8` was `SENT` in one attempt; provider acceptance and Gmail IMAP search were observed. |

Full operational evidence: [`phase3-staging-evidence-2026-07-19.md`](phase3-staging-evidence-2026-07-19.md).

## Rehearsal results

| Rehearsal | Result | Duration/evidence |
| --- | --- | --- |
| Normal browser flow | PASS | Four synthetic browser scenarios completed in 24.4 seconds with screenshots and state assertions. |
| Five-minute fallback | PASS | `npm.cmd run test:system` remains the deterministic API fallback; the current focused suite runs well below five minutes. |
| Deployment preflight | PASS | Staging smoke verifies frontend, health, SQL catalog, CORS, and anonymous auth before the presentation. |
| Performance preflight | PASS | `npm.cmd run phase3:performance` records bcrypt-cost-10 auth timing and production bundle size. |

## Reset and privacy verification

- The E2E server recreates in-memory state for each setup and terminates after
  the run; no shared SQL row is mutated by the browser suite.
- All visible identities use `example.test`; no real personal data is used.
- Access tokens remain in the isolated browser/test process and are not written
  to documentation, screenshots, or command output.
- The temporary Azure SQL operator firewall rule used for migration validation
  was removed and rechecked.
- The live observation fixtures were removed and rechecked: `AuthFixtures=0`,
  `BookFixtures=0`, and `NotificationFixtures=0`.
- No `phase3-live-observation*` SQL firewall rules remained after cleanup.
- SMTP bodies, raw OTP values, provider responses, database passwords, and
  connection strings are absent from this record.

## Evidence-driven polish decisions

1. Added `TRUST_PROXY=true` because Azure TLS termination otherwise caused a
   false `HTTPS_REQUIRED` response.
2. Added a SQL-backed catalog smoke check because `/health` alone hid schema
   drift.
3. Hardened the FE05 migration after the legacy filtered ISBN index blocked the
   Azure staging upgrade.
4. Lazy-loaded top-level pages after the baseline build showed a 999,203-byte
   entry bundle; the new entry is 320,688 bytes.

No additional business feature or role rule was introduced from these findings.
