# Research - CAPTCHA FE02

## Decision

Use Node.js `crypto` to issue an opaque random token backed by a bounded, process-local, one-time challenge store. Render the answer as randomized SVG path segments.

## Rationale

The server remains authoritative without exposing an answer verifier to the client and without adding a database table or package. The current Azure App Service F1 deployment uses one instance, so a process-local TTL store is sufficient for this amendment. SVG path rendering preserves the browser `img` contract while removing machine-readable plaintext text nodes.

## Alternatives considered

- Signed self-contained token: rejected because a client-visible answer digest enables offline recovery in the small answer space and cannot enforce one-time use without server state.
- Persisting challenge rows: unnecessary database state and cleanup for the current single-instance deployment.
- Client-only random text: insecure because the browser can change the expected answer.
- External CAPTCHA provider: out of scope and adds a third-party dependency.

## Operational boundary

- The store is capped at 5.000 active challenges and fails closed when full.
- A backend restart invalidates outstanding challenges; the frontend requests a new challenge without losing form data.
- Before scaling to multiple instances, move challenge state to a shared TTL store or adopt an approved provider.
