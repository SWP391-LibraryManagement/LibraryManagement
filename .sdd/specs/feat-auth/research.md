# Research - CAPTCHA FE02

## Decision

Use Node.js `crypto` plus an inline SVG data URI and an HMAC-signed, five-minute token.

## Rationale

The server remains authoritative without a database table or a new package. SVG is an image supported by the browser and can be displayed through a normal `img` element.

## Alternatives considered

- Persisting challenge rows: unnecessary state and cleanup for this small feature.
- Client-only random text: insecure because the browser can change the expected answer.
- External CAPTCHA provider: out of scope and adds a third-party dependency.
