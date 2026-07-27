# FE07/FE10/FE12 Business-Rule Alignment Design

**Status:** WRITTEN SPEC REVIEW REQUIRED

**Design approved in discussion:** 2026-07-27

**Written-spec approver:** Nhat (SPEC owner and project business approver)

**Delivery method:** Hybrid, Full depth for Core rules

## 1. Decision And Scope

This batch corrects five bounded Core contracts:

1. FE07 staff authorization takes precedence over member ownership checks for a
   multi-role actor performing cross-member renewal.
2. FE07 return output and audit data use the due date locked by the authoritative
   return transaction.
3. FE07 renewal uses the shared `Asia/Ho_Chi_Minh` business-date helpers for
   eligibility and due-date extension.
4. FE10 rejects an unsafe stored template definition before rendering,
   persistence, or delivery while continuing to escape or sanitize runtime
   template values.
5. FE12 rejects every query key outside the exact endpoint allowlist before the
   report service or repository runs.

FE08 has no new product rule in this batch. It remains an integration regression
boundary because FE07 reads reservation claims and FE10 receives FE08
notification requests.

No database schema, public route, role, notification type, report field, or
frontend workflow is added.

## 2. Source-Of-Truth Ledger

| Source ID | Source and location | Revision/date | Evidence it can prove | Authority level | Owner | Conflicts |
| --- | --- | --- | --- | --- | --- | --- |
| S-001 | User decisions in the active task | 2026-07-27 | Approved choices for FE07 authorization/time/transaction data, FE10 rejection policy, FE12 allowlists, and FE08 scope | Highest for this bounded slice | Nhat | None after approval |
| S-002 | `.sdd/constitution.md`, `.sdd/shared_context.md`, `.sdd/constraints/*.md` | Current branch at `ef141a6` | Project law, actors, stack, spec-first order, server authorization, validation, and safety | Project-wide approved baseline | Team | None |
| S-003 | FE07/FE10/FE12 `SPEC.md` files | Current branch at `ef141a6` | Existing stable BR/FR/AC/API contracts | Feature baseline | Nhat | Ambiguities listed in Section 3 |
| S-004 | Current FE07/FE10/FE12 implementation and tests | Current branch at `ef141a6` | Observed behavior and reproducible defects only | Observational, not normative | Engineering team | Conflicts with approved decisions |
| S-005 | `docs/superpowers/specs/2026-07-23-fe07-fe08-fe10-fe12-final-verification-remediation-design.md` | Approved 2026-07-23 | Existing transaction, timezone, notification, and report parity boundaries | Approved prior design | Nhat | Does not resolve the five new gaps |

## 3. Evidence And Conflict Classification

| Evidence ID | Classification | Current evidence | Required resolution |
| --- | --- | --- | --- |
| E-001 | `observed-behavior` | A `MEMBER + LIBRARIAN` actor renewing another member's loan receives `403 BORROW_DETAIL_OWNER_REQUIRED`. | Apply staff-role precedence only to the ownership check. |
| E-002 | `observed-behavior` | A concurrent renewal can change the locked due date while the return response still calculates `fineCandidate.overdueDays` from stale preflight data. | Derive return output and audit metadata from transaction-locked values. |
| E-003 | `observed-behavior` | Renewal date extension differs by host timezone because host-local `Date.setDate()` is used. | Use shared business-date helpers exclusively. |
| E-004 | `unresolved-conflict` resolved by S-001 | FE10 EC-FE10-010 requires rejection, while NFR-FE10-SEC-005 permits sanitizing an unsafe stored definition. | Reject the stored definition; escape/sanitize runtime values. |
| E-005 | `observed-behavior` | FE12 accepts an unknown query key, returns `200`, and forwards it to the report layer. | Return safe `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` before report execution. |

Implementation is evidence of current behavior, not the source of the approved
business policy.

## 4. Business Decision Log

| Decision ID | Slice ID | Question | Options considered | Approved decision | Rationale | Approver | Decision date | Affected requirements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BD-001 | SL-001 | Which role controls ownership for a multi-role renewal actor? | Member-first; staff-first; deny all multi-role cross-member actions | `LIBRARIAN`/`ADMIN` permission takes precedence for cross-member renewal; owner-only applies only without a staff role | Permissions must follow authorized capability, not role-array order | Nhat | 2026-07-27 | BR-FE07-003, FR-FE07-009, AC-FE07-009 |
| BD-002 | SL-002 | Which due date is authoritative after a concurrent change? | Preflight value; transaction-locked value | The locked return transaction value drives mutation, `fineCandidate`, and audit metadata | Prevents response/audit drift from committed state | Nhat | 2026-07-27 | BR-FE07-014, FR-FE07-007/008, AC-FE07-008 |
| BD-003 | SL-003 | Which calendar arithmetic governs renewal? | Host-local `Date`; UTC; shared library business date | Shared `Asia/Ho_Chi_Minh` helpers govern eligibility and `dueDate + 14` | The policy is calendar-day based and host-independent | Nhat | 2026-07-27 | BR-FE07-015, FR-FE07-009/020, NFR-FE07-TIME-001 |
| BD-004 | SL-004 | How should unsafe stored template markup be handled? | Sanitize and accept; reject; allow raw HTML | Reject before rendering/persistence/delivery; continue escaping/sanitizing runtime values | A stored definition is trusted configuration and must fail closed | Nhat | 2026-07-27 | BR-FE10-010, FR-FE10-005/009, AC-FE10-006, NFR-FE10-SEC-005 |
| BD-005 | SL-005 | What happens to unknown FE12 query keys? | Ignore; forward; reject | Reject with safe `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` before service/repository execution | Prevents silent API drift and unreviewed query behavior | Nhat | 2026-07-27 | BR-FE12-008, FR-FE12-005, AC-FE12-005 |
| BD-006 | SL-006 | Does FE08 require a product-rule change? | Modify FE08; regression-only | No FE08 behavior change; verify its FE07 and FE10 handoffs | No independent FE08 defect was established | Nhat | 2026-07-27 | Existing FE08 integration contracts |

## 5. Actor Responsibility Matrix

Every cell below is an `approved-requirement` for this bounded slice and derives
from BD-001 through BD-006 plus the existing approved feature contracts.

| Actor | Business goal | May initiate | Must not perform | State transitions owned | Data read/write scope | Handoffs | Failure paths |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Member without staff role | Renew an eligible own loan | Own-loan renewal | Renew another member's detail | No direct state ownership; FE07 transaction owns the mutation | Own borrowing records only | FE07 may queue FE10 notification | Cross-member request returns owner-required `403` |
| Librarian/Admin, including multi-role account | Process an eligible member's renewal or return | Cross-member renewal and return | Bypass loan-owner eligibility, fine, overdue, reservation, or renewal-limit rules | Authorizes FE07 transaction; does not own source data outside FE07 | Staff borrowing scope | FE07 reads FE08 claims and exposes FE09 return data | Business blocker returns safe 4xx without mutation |
| FE07 return transaction | Commit one authoritative return outcome | Internal locked mutation | Use stale preflight due date in response or audit | Detail/copy/request/audit changes in one transaction | Locked borrowing/copy/reservation rows | Exposes `fineCandidate` to FE09 | Roll back all state on failure |
| FE10 source/worker | Deliver an approved notification | Render only after request and template validation | Accept unsafe stored template definition or expose secret-like values | FE10 notification lifecycle only | Notification/template records and provider boundary | Receives source-owned events | Safe rejection creates no notification/attempt |
| Librarian/Admin report viewer | Read approved reports | Exact endpoint query allowlist | Add arbitrary query behavior or modify source records | None; reports are read-only | Approved aggregate/detail data | FE12 reads source feature records | Unknown key returns safe `400` before report execution |

## 6. Business Slice Contracts

| Slice ID | Actor and outcome | Trigger | Preconditions | Happy path | Alternative/failure paths | Rules/calculations | State invariants | Permissions/data ownership | Acceptance examples | Classification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SL-001 | Staff renews an eligible member loan | Renewal endpoint call | Authenticated actor has `LIBRARIAN` or `ADMIN`; detail is borrowed | Staff ownership scope is accepted, then owner's eligibility is checked and renewal commits | Actor without staff role must own the detail | Staff precedence affects authorization only | No blocker or due-date mutation is bypassed | Loan owner remains the subject of business checks | AT-001 | `approved-requirement` |
| SL-002 | Staff returns a loan with coherent fine-review data | Return confirmation | Detail/copy remain borrowed when locked | Transaction locks current values, commits return, then builds response/audit from that snapshot | Concurrent state conflict returns safe error and no mutation | `overdueDays = business-day boundaries(locked dueDate, committed returnDate)` | Response, audit, and committed row describe one outcome | FE07 owns return; FE09 owns fine creation | AT-002 | `approved-requirement` |
| SL-003 | Member/staff renews with deterministic dates | Eligible renewal | Owner has no blocker and item is not overdue on the business date | Add 14 calendar days using shared helper | Any blocker preserves due date | No host-local calendar arithmetic | Same inputs produce same date in every host timezone | FE07 owns renewal policy | AT-003 | `approved-requirement` |
| SL-004 | FE10 rejects unsafe stored template configuration | Notification request reaches template validation | Canonical pair and template record exist | Safe definition proceeds; runtime values are escaped/sanitized during rendering | Unsafe definition returns safe 4xx before render/persist/send | Definition validation and runtime-data escaping are separate gates | Rejected input creates no notification or attempt | FE10 owns rendering/delivery only | AT-004 | `approved-requirement` |
| SL-005 | Staff receives only documented report behavior | FE12 GET with query string | Actor is authorized | Every key is allowlisted, values validate, report runs | First unknown key returns safe `400` before service/repository execution | Allowlists are endpoint-specific and exact | Reports remain read-only; unknown input has no audit success event | FE12 owns boundary validation | AT-005 | `approved-requirement` |
| SL-006 | FE08 handoffs remain stable | FE07 reservation check or FE08 notification request | Existing FE08 lifecycle contract | Existing behavior remains unchanged | Existing regression failure blocks completion | No new FE08 rule | Queue ownership and notification non-blocking behavior remain intact | FE08 owns queue state | AT-006 | `approved-requirement` |

## 7. Interface And Error Contract

### FE07

- Renewal authorization first checks whether the actor has `LIBRARIAN` or
  `ADMIN`. Only actors without either role are constrained to their own detail.
- The authoritative return repository result supplies the due date and return
  date used by `fineCandidate` and return audit metadata.
- Renewal eligibility and due-date extension use the shared
  `Asia/Ho_Chi_Minh` business-date helpers.

### FE10

- An unsafe stored template title/body returns a safe 4xx template validation
  error before rendering, notification persistence, attempt persistence, or
  provider I/O.
- Phase 1 template definitions are plain text plus `{{variable}}` tokens.
  Raw HTML tag syntax (including `<script>`), inline event-handler attributes,
  and `javascript:` URLs are unsafe definition content.
- Runtime template values continue to be escaped or sanitized.
- Secret-like key rejection and `safePayload` redaction remain unchanged.

### FE12

- Borrowing allowlist: `q`, `fromDate`, `toDate`, `status`, `bookId`, `userId`,
  `page`, `limit`.
- Inventory allowlist: `q`, `categoryId`, `bookId`, `status`, `location`,
  `page`, `limit`.
- User allowlist: `q`, `roleId`, `status`, `membershipStatus`, `fromDate`,
  `toDate`, `page`, `limit`.
- Any other key returns safe
  `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` before the report service or
  repository executes. Error details may identify the unsupported key but must
  not echo its value.

## 8. Acceptance And Traceability

| Acceptance ID | Decision ID | Requirement target | Expected RED evidence before implementation | Later acceptance evidence |
| --- | --- | --- | --- | --- |
| AT-001 | BD-001 | BR-FE07-003, FR-FE07-009, AC-FE07-009 | Multi-role staff cross-member renewal currently returns owner-required `403` | Focused service/route test passes; member-only cross-member denial remains |
| AT-002 | BD-002 | BR-FE07-014, FR-FE07-007/008, AC-FE07-008 | Concurrent renewal/return fixture exposes stale `overdueDays` | Transactional regression proves response/audit use locked due date |
| AT-003 | BD-003 | BR-FE07-015, FR-FE07-009/020, NFR-FE07-TIME-001 | Same renewal input differs under host timezones | Focused test passes under at least UTC and `America/New_York` |
| AT-004 | BD-004 | BR-FE10-010, FR-FE10-005/009, AC-FE10-006 | Unsafe stored definition is accepted and sanitized | Safe 4xx, zero persistence, zero provider call; runtime values remain escaped |
| AT-005 | BD-005 | BR-FE12-008, FR-FE12-005, AC-FE12-005, EC-FE12-011 | `?bogus=1` reaches the service and returns `200` | All three endpoints return safe `400`; service/repository spies remain untouched |
| AT-006 | BD-006 | Existing FE08 integration requirements | Existing focused integration baseline | FE08 reservation and notification regressions remain green |

Traceability must continue after written-spec approval:

```text
BD -> BR/FR/AC -> PLAN -> TASK -> code @spec tag -> RED/GREEN test -> runtime evidence
```

## 9. Slice Roadmap

| Order | Slice ID | Outcome | Dependencies | Business risk | Delivery owner | Business approver | Entry gate | Exit evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | SL-001 | Role-order-independent renewal authorization | Written SPEC approval | Unauthorized denial or privilege ambiguity | Codex / Integration Lead | Nhat | G3 passed | AT-001 plus unchanged member-only denial |
| 2 | SL-002 | Coherent committed return, fine candidate, and audit | SL-001 test boundary only; no code dependency | Incorrect fine-review/audit data | Codex / Integration Lead | Nhat | G3 passed | AT-002 transactional evidence |
| 3 | SL-003 | Host-independent renewal date result | Shared business-time utility | Incorrect due/overdue outcome | Codex / Integration Lead | Nhat | G3 passed | AT-003 timezone matrix |
| 4 | SL-004 | Fail-closed stored template validation | Existing FE10 rendering boundary | Stored executable content | Codex / Integration Lead | Nhat | G3 passed | AT-004 security regression |
| 5 | SL-005 | Exact report query boundaries | Existing report validators/routes | Silent API expansion and unvalidated input | Codex / Integration Lead | Nhat | G3 passed | AT-005 endpoint matrix |
| 6 | SL-006 | Unchanged FE08 handoffs | SL-001 to SL-005 implementation | Cross-feature regression | Codex / Integration Lead | Nhat | G5 passed for prior slices | AT-006 regression evidence |

## 10. Quality Gates

The highest passed gate is G1. G2 and G3 are ready but remain pending until the
written design and three feature SPEC revisions are reviewed and approved.

| Slice ID | G0 | G1 | G2 | G3 | G4 | G5 | G6 | G7 | Blocker | Owner | Next evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SL-001 to SL-006 | passed | passed | ready | ready | not-started | not-started | not-started | not-started | Written SPEC review | Nhat | Approve updated design and feature SPECs |

`G4` through `G7` are intentionally not started. Green historical tests are
baseline evidence only and do not prove these corrected rules.

## 11. Security And Safety Boundary

- Authorization is server-side and role-order independent.
- FE10 fails closed on unsafe stored definitions and never weakens existing
  secret detection, redaction, minimal DTO, or provider-detail protections.
- FE12 validates both key names and values before database work; all SQL remains
  parameterized.
- Safe errors expose no stack trace, secret, query value, provider detail, or
  report data.
- No real PII, credential, token, OTP, or mutable staging data is used as test
  evidence.

## 12. Execution Boundary

Allowed now:

- Update this design, the three feature `SPEC.md` files, and their changelogs.
- Run read-only consistency checks and documentation diff checks.
- Commit the documentation-only written-spec revision on the current branch.

Blocked until the written SPEC is reviewed and approved:

- Writing `PLAN.md` or `TASKS.md`.
- Adding RED tests.
- Changing production code, API documentation, fixtures, or test doubles.
- Running mutable SQL, pushing, opening a PR, or claiming completion.

There are no unresolved business questions inside this bounded slice.
