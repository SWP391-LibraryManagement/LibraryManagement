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

Remove the exception and restore the plain audit command when npm publishes a
stable React Router version outside the affected range.
