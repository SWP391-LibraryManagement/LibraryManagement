# React Router RSC Audit Exception — 2026-07-25

## Decision

The frontend temporarily accepts only `GHSA-qwww-vcr4-c8h2` for
`react-router@7.18.1` and `react-router-dom@7.18.1`.

The upstream advisory states that the issue affects unstable React Server
Components APIs. This frontend uses React Router Declarative Mode through
`BrowserRouter`, `Routes`, and `Route`; it does not use RSC, Framework Mode, or
server actions.

## Enforcement

`frontend/scripts/audit-high.js` still runs `npm audit` and fails for every
other High or Critical finding. The exception also fails closed if:

- either React Router package is not exactly `7.18.1`;
- `BrowserRouter` is no longer present; or
- a blocked RSC or data-router API appears in frontend source.

Remove the exception and restore the plain audit command through a separately
approved migration to a compatible React Router version outside the affected
range.

## Revalidation — 2026-08-02

- Owner: project frontend maintainer (Nhat).
- Installed versions: `react-router@7.18.1`, `react-router-dom@7.18.1`.
- Advisory: `GHSA-qwww-vcr4-c8h2`; upstream updated at `2026-07-24T16:44:43Z`; affected range `>= 7.12.0, < 8.3.0`; the official response now reports `first_patched_version: 8.3.0` for `react-router`.
- Migration boundary: React Router v8 requires Node 22.22+ and React/ReactDOM 19.2.7+, and removes `react-router-dom`. This repository's manifests allow React/ReactDOM from `^19.2.6` and the lockfile currently resolves `19.2.7`, but source still imports the removed `react-router-dom` package and the new Node baseline still requires full toolchain validation. Upgrading to 8.3.0 is therefore a dedicated dependency/code/regression batch outside documentation-only PR A.
- Full audit result: only the two controlled React Router package findings are High; no other High or Critical finding is accepted.
- Runtime scope proof: `frontend/src/main.jsx` and `frontend/src/App.jsx` use Declarative `BrowserRouter`, `Routes`, and `Route`; the blocked RSC and Framework/Data Router API scan returned no match.
- Enforcement proof: `npm --prefix frontend run audit:high` passed and still fails closed on version drift, another High/Critical advisory, missing `BrowserRouter`, or a blocked API.

## Next review and removal triggers

- Review on every React Router dependency change, every advisory update, or by 2026-08-16, whichever happens first.
- Replace this exception through a separately approved React Router v8 migration that removes `react-router-dom`, meets the new runtime/React baselines, and passes frontend tests, lint, build, raw audit, Playwright, CI, and staging acceptance.
- Invalidate the exception immediately if RSC, Framework Mode, Data Router, server actions, or a second High/Critical finding enters the frontend.
