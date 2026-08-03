# PR C FE04 Acceptance Context-Isolation Amendment Design

Date: 2026-08-03

Status: APPROVED IN CHAT; WRITTEN REVIEW REQUIRED BEFORE IMPLEMENTATION

## 1. Purpose

This amendment changes only the temporary Azure Staging acceptance harness for PR C. It addresses the architecture stop reached after three deterministic harness failures without changing FE04 product code, API contracts, schema, roles, permissions or production dependencies.

FE04 remains `PARTIAL`. The three previous attempts remain failed acceptance attempts with successful cleanup; this amendment does not retroactively mark any of them as passing.

## 2. Evidence and root cause

The third run, `lms-fe04-acceptance-20260803-418d15cc`, confirmed the resubmitted application through the canonical Admin API. The harness then reloaded an already-used Admin page with `waitUntil: 'domcontentloaded'` and immediately counted sidebar items.

The count was `0` instead of `8` because `domcontentloaded` completed before React rendered the Admin navigation. The failure occurred before responsive review and approval. Mandatory cleanup and a fresh read-only preflight both passed, with no active fixture state or remote runtime/helper residue.

The root cause is therefore harness context reuse plus an insufficient UI readiness condition, not a demonstrated FE04 product defect.

## 3. Considered approaches

### A. Fresh Admin context per decision with explicit UI readiness - selected

- Use one newly authenticated Admin context to reject application A.
- Close that context after the rejection is verified.
- After Member resubmission and canonical API readiness, open a second newly authenticated Admin context to review and approve application B.
- Wait for the Admin navigation landmark and its eighth item to be visible before exact count/order assertions.

This keeps both business decisions as real UI actions while eliminating stale mounted state and the `domcontentloaded` timing assumption.

### B. Perform decisions through API and use UI only for display verification - rejected

This would be simpler and less timing-sensitive, but it would weaken the required acceptance evidence that Admin reject/approve works through the actual FE11 shell and FE04 review UI.

### C. Perform a manual authenticated browser acceptance - fallback only

This is useful if automation cannot produce stable evidence, but it is less repeatable and makes cleanup, authorization and exact-state evidence harder to audit consistently.

## 4. Amended architecture

The harness keeps exactly three synthetic actors and the existing canonical FE04 endpoints. Browser state is isolated by decision:

1. Seed three synthetic accounts and verify the authorization matrix.
2. Member submits application A.
3. Open Admin context R, wait for fully rendered navigation, find A and reject it through the UI.
4. Close Admin context R after rejection evidence is captured.
5. Member observes the rejection reason and submits application B.
6. Poll the canonical Admin membership API until B is `PENDING`; polling is readiness evidence only.
7. Open Admin context A, wait for fully rendered navigation, find B and run responsive checks at all four approved viewports.
8. Approve B through the UI in Admin context A.
9. Verify immutable A, approved B, member state, audit counts, terminal conflict behavior and notification non-rollback behavior.
10. Close all contexts and run mandatory cleanup in `finally`.

No storage state is persisted or shared. No Admin page is reloaded to carry directory state across the two decisions.

## 5. UI readiness contract

`verifyAdminNavigation()` must:

- wait for the `Điều hướng quản trị` navigation landmark to be visible;
- wait for navigation item index 7, the eighth item, to be visible;
- only then assert exactly eight items, exact approved order and absence of `Phân quyền`.

`domcontentloaded` alone is not accepted as evidence that the React shell is ready.

## 6. Testing strategy

Before changing the ignored harness, add a failing contract test that proves:

- rejection and approval open separate Admin contexts;
- the first Admin context is closed before the second is created;
- navigation readiness waits occur before exact count assertions;
- the source no longer reloads the Admin page between resubmission and approval.

Then make the smallest harness change that turns the contract GREEN. Run the full harness contract, `node --check` for both temporary scripts and a read-only preflight before any mutation.

## 7. Security and cleanup invariants

- Use only synthetic `.invalid` identities and runtime-only random passwords.
- Keep credentials, tokens, publishing profiles and connection strings out of source and emitted events.
- Preserve parameterized SQL and the exact three-user cleanup manifest.
- Keep reject/approve authorization assertions for anonymous, Member, Librarian and Admin actors.
- Always revoke tokens, deactivate fixture users/members, terminalize pending fixture applications and remove remote runtime/helper state in `finally`.
- Verify all active counts are zero and remote runtime/helper paths return `404` after cleanup.

## 8. Authority and stop condition

The user approved approach A in chat on 2026-08-03. Implementation remains paused until the user reviews this written amendment.

After written review, this amendment authorizes exactly one additional staging mutation with a fresh run ID. It does not authorize product-code changes, a fifth attempt, H2, H3, merge or FE04 completion. If the additional run fails, cleanup is mandatory and execution stops for a new human decision.
