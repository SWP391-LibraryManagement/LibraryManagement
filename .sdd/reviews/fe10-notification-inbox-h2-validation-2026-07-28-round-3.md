# FE10 Personal Notification Inbox H2 Validation - Round 3

- Date: 2026-07-28
- Branch: `codex/feat-fe10-personal-notification-inbox`
- Baseline: `main@12faeadb9a92fa30cc8dc16aa01467577374c8b0`
- Rebased committed head: `2dab81c588c3796447d84443a9c3a53aa9516dc1`
- Status: **H2 APPROVED, THEN SUPERSEDED BEFORE USE BY UPSTREAM DRIFT**

This record covers the bounded remediation after H3 round one. It also records
the later H1-approved non-overlapping drift that deletes retired `document/`
artifacts only. The branch rebased without conflict. No candidate file is
staged or committed. At this fingerprint checkpoint, Azure staging served
`main@12faead`, not this uncommitted remediation.

The user approved this exact round-3 fingerprint. The mandatory fetch performed
immediately before staging found one newer upstream commit,
`main@a240705fbd486304464b073cbd3caec77a1fa135`, so the H2 authority stopped
before use. No reviewed file was staged, committed, or pushed.

## 1. Candidate Identity

- Candidate entries: **16** modified or new files.
- Candidate fingerprint:
  `e1143e6ae35d80bbf5ae45f49ab312f84b37fc98615ea877ab39d4699658bb4c`.
- Candidate baseline and `origin/main`:
  `12faeadb9a92fa30cc8dc16aa01467577374c8b0`.
- Committed branch ahead/behind `origin/main`: **2/0**.
- Cached/staged files at fingerprint time: **0**.
- Unmerged paths and conflict markers: **0**.
- This round-3 validation record is deliberately excluded from the candidate
  fingerprint so the human decision can be recorded without changing the
  reviewed remediation.

Fingerprint algorithm:

1. Read `git status --porcelain=v1 --untracked-files=all`.
2. Exclude only
   `.sdd/reviews/fe10-notification-inbox-h2-validation-2026-07-28-round-3.md`.
3. For every remaining file, create
   `<two-character-status>|<lowercase-file-sha256>|<normalized-path>`.
4. Sort entries by case-sensitive normalized path.
5. Join entries with LF, include one final LF, encode as UTF-8 without BOM,
   and calculate SHA-256.

## 2. H1 And Scope Reconciliation

- The user approved the FE10 v0.5.0 design, written SPEC, and FE10-I01..I08
  implementation plan; governance PR #70 merged as `25c09ec`.
- Earlier H2 candidate head `28c4f80` passed CI `30306805399`, Azure deployment
  `30307855616`, and live Azure SQL/API/browser verification.
- H3 round one returned bounded ADR/current-state, notification-page state,
  and popover-stacking findings.
- The user approved `H1 drift addendum main@12faead` on 2026-07-28. Incoming
  changes remove retired `document/` artifacts and have no file or Core
  contract overlap with this 16-entry remediation.
- This candidate changes no backend, API, SQL migration, database schema,
  authorization rule, sensitive-record boundary, or notification delivery
  behavior.

## 3. Four-Layer Review

### L1 - Contract And Traceability

**PASS**

- ADR-002 now records the nullable `ReadAt` decision, exact eligible scope,
  supporting index, repeatability boundary, Azure hash gate, and rollback.
- FE10 SPEC/PLAN/TASKS/CONTEXT/TEST_PLAN/CHANGELOG, project memory, master test
  plan, approved design, prior v0.4.5 closeout, and the new H3 closeout agree.
- Enforced traceability passed with FE10 at **14/16 FR tags = 88%**, above the
  repository's 70% gate. Traceability-state tests passed **3/3**.

### L2 - Automated Quality

**PASS**

| Gate | Fresh result on `main@12faead` |
| --- | --- |
| Backend coverage | 69/69 suites, 1116/1116 tests |
| Coverage | 91.84% statements, 80.70% branches, 97.59% functions, 91.76% lines |
| Frontend | 259/259 tests; ESLint pass; Vite production build pass |
| Deployment policy | 20/20 tests |
| System integration | 10/10 tests |
| Traceability state | 3/3 tests |
| Chromium E2E | 11/11; FE10-specific 3/3 |
| Azure schema preparation | PASS |
| Git whitespace | `git diff --check` PASS |
| Backend dependency audit | 0 vulnerabilities |
| Frontend high audit gate | PASS with only the enforced non-applicable unstable-RSC advisory |
| High-confidence added-secret scan | 0 findings |
| Stale contradiction, unfinished-marker, and conflict scans | 0 findings |

### L3 - Business, UI, And Security

**PASS**

- After a successful mark-read with no navigation, `/notifications` reloads
  the current page so the item no longer remains visually unread.
- Mark-all is disabled only while the page or mutation is loading, so an empty
  filtered page cannot block reading notifications that exist under another
  filter.
- The topbar keeps its normal stack level and rises to `z-index: 100` only
  while it contains the open notification popover. The popover remains
  `380px` wide at the tested desktop viewport and its sampled point is the
  browser's top painted element, above modal, navigation, content, and toast
  layout layers.
- The safe inbox OpenAPI schema remains closed to additional properties.
  Forbidden response metadata is absent from frontend and controller code;
  historical request-only OpenAPI schemas still legitimately document
  recipient/source/idempotency fields for the separate delivery API.
- Sensitive identifiers appear in inbox repository code only as explicit
  exclusions and in tests as negative-boundary fixtures.

### L4 - Migration And Release Safety

**LOCAL REMEDIATION PASS; EXTERNAL GATES PENDING BY DESIGN**

- This remediation does not modify the already reviewed migration, canonical
  schema, backend repository/service/routes, deployment workflow, or Azure
  configuration.
- Azure-compatible schema preparation passes from the rebased checkout.
- Historical exact-head Azure migration and live verification remain valid
  evidence for head `28c4f80`, but do not prove this remediation.
- A fresh pre-H2 Azure check returned frontend `200`, backend health `ok`, and
  readiness `ok`. `GET /api/notifications/mine` returned `404` with the
  approved `Access-Control-Allow-Origin: https://www.thuvienhub.io.vn`, which
  confirmed that checkpoint's staging was healthy but served `main@12faead`
  without the unmerged FE10 inbox route. It is not candidate-pass evidence.
- After H2, the new exact head must pass PR CI, be deployed to Azure staging,
  and repeat Azure SQL/API/browser verification before H3 round two.

## 4. H3 Round-One Findings Closed Locally

| ID | Finding | Resolution |
| --- | --- | --- |
| H3-FE10-001 | ADR-002 omitted the `ReadAt` schema/index/migration decision. | Added the approved schema and Azure rollout/rollback contract. |
| H3-FE10-002 | Current-state documents contradicted completed H2/CI/Azure evidence. | Reconciled all active source-of-truth and closeout records. |
| H3-FE10-003 | Successful no-navigation read left stale unread UI state. | Reload current page after successful non-navigated read; regression test passes. |
| H3-FE10-004 | Mark-all depended on current filtered-page item count. | Disabled only for active loading/mutation; regression test passes. |
| H3-FE10-005 | Page content could paint over the open popover. | Elevate only the open topbar to `z-index: 100`; width and browser top-layer assertions pass. |

No open local Critical, High, Medium, or Low finding remains in this H2
candidate. Azure exact-head and repeated H3 findings remain intentionally
unclaimed.

## 5. Candidate Manifest

```text
 M|eb01d2c8d495534a8141398d1b4e2a9a9282b47341e4d2cbd8fa0365d6a627b7|.agents/CLAUDE.md
??|0e547678958d8fe46f4d81b28b351d1c92383089cb00ea986320ca3b2f81b089|.sdd/reviews/fe10-notification-inbox-staging-h3-closeout-2026-07-27.md
 M|e1a1f12bc2890fbdc916dd0dd87e5b9bdd6acf3bd15b58f1e907b001ab1d85f6|.sdd/reviews/staging-email-delivery-remediation-validation-2026-07-27.md
 M|56d3c92ad63830b2edb5d98d91290896ce21c9b064418414d4464cde40826e6e|.sdd/rfcs/ADR-002-database-design.md
 M|55c1a0e7af49384b2e675024fe409029ca0e848ad486f0fb2b0bc19139659753|.sdd/specs/feat-notification-management/CHANGELOG.md
 M|8a1b04bd09ef047f2b552f15650e629cd51176061e5e6d1188a65cefe663b6bc|.sdd/specs/feat-notification-management/CONTEXT.md
 M|945e885da6ff3c3b6b5bb2cbdc72398d4acd72ff5dfa0dd5dec5b2c3d98cf27d|.sdd/specs/feat-notification-management/PLAN.md
 M|48b188b2a1d722b4cbb5d56ecdeca91f10eef6647adc181f8b8302d3751fc51d|.sdd/specs/feat-notification-management/SPEC.md
 M|53ab533457e1ea990e063fe064cd369c58937f149f4d78285ab3d14c891f575e|.sdd/specs/feat-notification-management/TASKS.md
 M|3f9fee42c905d5912c514e4effbb45072d1e1eb9fd8ae8a2d431ec7b1f2cd1af|.sdd/specs/feat-notification-management/TEST_PLAN.md
 M|08dbdca03ea3c78c24f76c3b1951ed99c65d09141d61cfee0fd4152b72eb73c0|docs/superpowers/specs/2026-07-27-fe10-notification-inbox-expansion-design.md
 M|de1ae17d95ba9fa4c02cdf4eaa6882f1716d3dfa1d3ffa30b971fea8959d2012|docs/testing/master-test-plan.md
 M|54ef3cfb5536a8dfe58078dd44acc4856a12b11f582ab3167bafb32bb499000b|frontend/src/page/notification/NotificationsPage.jsx
 M|d1d0457b076d898829c4070b97a6ef001f735c37e275a6733afbda74588cb823|frontend/src/styles/app-shell.css
 M|b000f739fc7af49210da7622bbae6936babaf8c0fc60754b74933523179ca22b|frontend/test/notificationInboxFrontend.test.js
 M|229763feda67501cfa27cdad3385e7805e9a27a1d9419ef1a7573577eac89c15|tests/e2e/fe10-notification-inbox.spec.js
```

## 6. Human H2 Decision

The user approved the exact candidate with:

```text
duyệt H2 fingerprint e1143e6ae35d80bbf5ae45f49ab312f84b37fc98615ea877ab39d4699658bb4c
```

Decision: **APPROVED, THEN SUPERSEDED BEFORE USE**.

The pre-stage fetch advanced `origin/main` from `12faead` to `a240705`. That
single upstream commit removes the FE11 Admin user-edit action across 24 files.
It has zero path overlap with the 16-entry H3 remediation, the committed
merge-tree is clean, and exact `main` CI run `30311801599` passed. Nevertheless,
the base changed after fingerprinting, so a new H1 drift addendum, rebase,
complete validation, fingerprint, and H2 decision are required. Cached/staged
files remained zero.

The user subsequently approved `H1 drift addendum main@a240705`. Upstream
Azure deployment `30311973740` passed, and the branch rebased without conflict
to committed head `8831571`. This round-3 H2 remains historical and cannot be
reused; a new complete matrix and H2 decision are still required.
