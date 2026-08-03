# Data model - CAPTCHA FE02

No database entity is added.

| Value | Location | Rules |
| --- | --- | --- |
| `captchaToken` | Client response/request | Random opaque 32-byte identifier; no embedded answer, digest, expiry, signature, or JWT data. |
| Challenge record | Private process-local `Map` | Keyed by token; stores only answer digest and `expiresAt`; maximum 5.000 active records; removed on first identified verification attempt. |
| `captchaAnswer` | Login/register request | 4-6 ambiguity-reduced Latin letters; trim and case-insensitive comparison. |
| `image` | CAPTCHA response | SVG data URI containing randomized path segments only, with no `<text>` or answer metadata. |

The store is intentionally non-persistent for the approved single-instance deployment. Backend restart invalidates outstanding challenges. No SQL table, migration, cache service, or runtime dependency is introduced.
