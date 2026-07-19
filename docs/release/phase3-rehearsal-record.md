# Phase 3 Rehearsal Record

Date: 2026-07-19  
Branch: `docs/phase3-polish-delivery`

## Normal browser rehearsal

- Command: `npm.cmd run test:e2e` with frontend port `4273`, backend port `3200`,
  and matching explicit URL variables.
- Result: **PASS**, 4/4 Playwright tests in 24.4 seconds.
- Path: login -> borrow -> approve -> return -> fine -> report, plus FE08, FE09,
  and FE11 focused browser flows.
- Evidence: `docs/assets/phase3/system-golden-path-desktop.png` and
  `docs/assets/phase3/system-golden-path-mobile.png`.

## Five-minute defense path

1. Login with synthetic `example.test` identity.
2. Borrow one catalog item as Member.
3. Approve and allocate the request as Librarian.
4. Return the overdue copy and show the 70,000 VND fine handoff.
5. Record payment and open the read-only report.
6. If a browser step is unavailable, show the six-check staging smoke, the
   deterministic `test:system` fallback, and the verified screenshots.

## Preflight and reset

- Run `npm.cmd run smoke:staging` before presenting the public staging surface.
- Run `npm.cmd run test:system` as the deterministic API fallback.
- The browser server recreates in-memory data for each setup and terminates at
  the end of the run; no shared SQL row is mutated.
- Use only synthetic `example.test` identities. Do not display credentials,
  bearer tokens, raw OTPs, SMTP bodies, or connection strings.

## Boundaries

This record proves repeatable local rehearsal and public staging preflight. It
does not claim external human observation of authenticated Azure workflows or
real provider inbox delivery.
