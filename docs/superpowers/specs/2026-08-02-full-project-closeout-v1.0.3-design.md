# Full Project Closeout v1.0.3 — Design

- Date: 2026-08-02
- Baseline: `origin/main@161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27`
- Batch: `FULL-PROJECT-CLOSEOUT-V1.0.3-2026-08-02`
- Design branch: `codex/full-project-closeout-v1.0.3-design`
- Delivery method: Hybrid SDD + ADD, evidence-first bounded PR chain
- Depth: Full for Core auth/permissions/state transitions; Light for Shell closeout/release records
- Business approver: Nhat
- H1 status: written contract approved by Nhat in chat on 2026-08-02; its decisions and file boundaries are active for plan execution

## 1. Outcome

This batch moves the approved FE01-FE12 project from a healthy deployed baseline to a truthful full closeout and a source release `v1.0.3`.

Completion means:

1. already-merged work is reflected in the authoritative SPEC/TASKS/CHANGELOG records;
2. FE02, FE04 and FE11 are no longer marked `PARTIAL` unless a bounded requirement is explicitly moved to a separately approved future scope;
3. FE11 requirement text, traceability rows, implementation, tests and runtime evidence agree;
4. FE04 and FE02 completion gates have L1-L4 evidence and human acceptance where required;
5. release documents point to the final reviewed `main` SHA and exact CI/deployment runs;
6. the demonstration video is recorded as `WAIVED — NOT REQUIRED`, with Nhat as approver, and is not fabricated or published;
7. `v1.0.3` is created only from the final reviewed and deployed `main` commit.

## 2. Approved delivery decision

Three approaches were considered:

| Approach | Benefit | Risk | Decision |
| --- | --- | --- | --- |
| One large implementation/release PR | Fewer ceremonies | Mixes docs, auth, permissions, acceptance and release; hard to review or roll back | Rejected |
| Evidence-first bounded PR chain | Small review surfaces; each Core slice has independent tests and H2/H3 | More PRs and exact-SHA monitoring | Approved |
| Treat every open marker as stale documentation | Fast | Could hide real FE11 auth/permission gaps | Rejected |

The approved chain is:

```text
PR A Shell closeout
  -> PR B FE11 Core reconciliation/implementation
  -> PR C FE04 acceptance + FE02 closeout
  -> PR D final release evidence
  -> v1.0.3 tag/release on exact final main SHA
```

No downstream PR may use evidence from an unmerged predecessor.

## 3. Scope and non-goals

### 3.1 In scope

- Close the already-implemented PR #95 slices `FE02-T067`, `FE05-T019` and `FE11-CAT01` with exact evidence.
- Revalidate the existing React Router advisory exception without silently weakening the audit gate.
- Reconcile FE11 approved requirement text, acceptance/traceability rows, code, tests and runtime behavior.
- Implement only FE11 gaps that remain after reconciliation and have approved normative requirements.
- Complete FE04 L1-L4, Azure staging and human acceptance gates; modify product code only from a reproduced failing acceptance contract.
- Complete FE02 final reconciliation task `FE02-T049` after all dependent evidence is available.
- Synchronize root/release/technical-debt records and publish `v1.0.3` after final integration.
- Preserve the root checkout's existing 11 dirty paths; do not reset, overwrite, stage or publish them from that checkout.

### 3.2 Non-goals

- No demonstration video or external video URL.
- No new role, endpoint, public response envelope, schema or migration unless a separately reviewed requirement proves it necessary.
- No conversion to React Router RSC, Framework Mode, Data Router or server actions.
- No production data mutation, real PII or persistent shared test password.
- No broad refactor of auth, membership or Admin Console code.
- No claim that every historical unchecked checkbox is a product defect; stale evidence is reconciled separately from missing behavior.
- No release tag before PR D is merged and exact post-merge CI/staging are successful.

## 4. Delivery classification

### 4.1 Core — Full depth

The following are Core because mistakes can weaken authorization, corrupt account/session state or produce incorrect audit history:

- FE11 account creation and normalized duplicate-email handling;
- actor revalidation for privileged mutations;
- atomic deactivation and session/refresh credential revocation;
- stale-state protection using `expectedUpdatedAt`;
- self-deactivation and active-loan guards;
- role replacement invariants and audit semantics;
- permission read model and role isolation;
- FE04 approval/rejection/resubmission state transitions;
- authenticated staging acceptance and synthetic-fixture cleanup.

Core changes require G0-G7 traceability, TDD RED-GREEN evidence, server-side authorization tests and four-layer validation.

### 4.2 Shell — Light depth

The following are reversible Shell work:

- task/status/changelog evidence substitutions;
- release README/checklist/report synchronization;
- React Router exception revalidation record;
- video waiver record;
- final tag/release notes after exact-SHA verification.

Shell changes still require changed-file review, secret scan, traceability, immutable evidence links and H2/H3.

## 5. Source-of-truth ledger

| Source ID | Source and location | Revision/date | Evidence it can prove | Authority | Owner | Conflict |
| --- | --- | --- | --- | --- | --- | --- |
| SRC-001 | `.sdd/constitution.md`, `.agents/AGENTS.md`, `.agents/CLAUDE.md` | `origin/main@161cc28d`, accessed 2026-08-02 | workflow, source-of-truth order, H1/H2/H3, Definition of Done | Project governance | Team | None |
| SRC-002 | FE02/FE04/FE11 `SPEC.md` | `origin/main@161cc28d` | approved business rules and acceptance requirements | Normative feature source | Nhat/team | FE11 table drift listed below |
| SRC-003 | FE02/FE04/FE11 `PLAN.md` and `TASKS.md` | `origin/main@161cc28d` | approved execution boundaries and current implementation state | Delivery state | Feature owners | Several statuses lag merged evidence |
| SRC-004 | backend/frontend source and tests | `origin/main@161cc28d` | observed implementation and encoded behavior | Observed behavior only | Engineering team | Cannot override SRC-002 |
| SRC-005 | PR #95, PR #96, PR #97 and exact CI/deploy runs | verified 2026-08-02 | immutable merge/integration evidence | Integration evidence | Repository | Release docs lag these revisions |
| SRC-006 | Azure staging and `npm run smoke:staging` | verified 2026-08-02 | current public runtime readiness | Runtime evidence | Project team | Does not prove authenticated Core behavior by itself |
| SRC-007 | `README.md`, `plan.md`, `TECH_DEBT.md`, release docs | `origin/main@161cc28d` | release narrative and residual boundaries | Reporting artifact | Project team | Contains stale SHA/status claims |

Normative priority remains governance -> approved feature SPEC -> approved plan/tasks -> observed code/tests/runtime -> summary/release documents.

## 6. Business decisions for written H1 activation

The chat approval established the direction behind these rows. They become the active bounded decisions for implementation only when Nhat approves this written design file.

| Decision ID | Slice | Question | Approved decision | Rationale | Approver | Date | Affected requirements |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BD-001 | SL-A | Is a demonstration video required? | `WAIVED — NOT REQUIRED`; no link or artifact will be fabricated | User explicitly excluded it | Nhat | 2026-08-02 | Release checklist/report |
| BD-002 | All | How is full closeout delivered? | Four bounded PRs followed by exact-SHA `v1.0.3` release | Limits Core blast radius and preserves H2/H3 evidence | Nhat | 2026-08-02 | Batch governance |
| BD-003 | SL-B | What happens when Admin assigns the user's current sole role? | Return the canonical safe DTO as an idempotent no-op and write no role-change audit | Normative `FR-FE11-025` text prevails over the stale trace-row phrase “bị từ chối” | Nhat | 2026-08-02 | FR-FE11-025, role tests |
| BD-004 | SL-B | How are roles changed? | Replace the current role atomically so exactly one approved role remains; do not restore legacy grant/revoke semantics | Matches DEC-GEN-005 and the approved FE11 model | Nhat | 2026-08-02 | FR-FE11-012, FR-FE11-026/027 |
| BD-005 | SL-B | Where does the permission matrix live? | Preserve the exact eight-item Admin sidebar; expose read-only permission information inside the existing Manage Roles/permissions surface, not as a ninth sidebar item | Reconciles FR-FE11-030 with FR-FE11-032 without navigation expansion | Nhat | 2026-08-02 | FR-FE11-030/032, AC-FE11-016/017 |
| BD-006 | SL-D | When may `v1.0.3` be published? | Only after PR D merge, exact post-merge CI and staging success, and final smoke/acceptance checks | Prevents stale or retroactive release evidence | Nhat | 2026-08-02 | Release governance |

## 7. Known conflicts to reconcile before product edits

Each statement below starts as evidence; implementation is allowed only after the PR B plan maps the approved decision to tests and exact files.

| Conflict ID | Evidence | Classification | Resolution |
| --- | --- | --- | --- |
| CF-001 | `FR-FE11-025` requires idempotent no-op, while its trace row says “bị từ chối” | unresolved conflict resolved by BD-003 | Correct the trace row; do not change the normative requirement to fit stale text |
| CF-002 | FE11 trace rows for FR-FE11-026/027 describe legacy revoke errors while shared context requires exactly one role via atomic replacement | unresolved conflict resolved by BD-004 | Reconcile rows/tests to replacement and normalization invariants |
| CF-003 | Exact eight-entry sidebar excludes a Permissions item, while FR-FE11-032 requires a read-only permission matrix | unresolved conflict resolved by BD-005 | Keep eight entries and verify the existing embedded permission surface |
| CF-004 | FE11 is `PARTIAL` at 81% trace coverage, yet several untagged requirements are already marked locally complete elsewhere in the matrix | observed status drift | Add missing `@spec` tags only where implementation/tests genuinely prove the exact requirement; implement true gaps separately |
| CF-005 | FE02-T067, FE05-T019 and FE11-CAT01 remain open on `main` although PR #95 merge/CI/deploy evidence exists | observed documentation drift | PR A closes only these bounded slices with exact evidence |
| CF-006 | Release documents reference `a8729f9`, while current verified `main` is `161cc28d` before this batch | observed documentation drift | PR A records current baseline; PR D records the final batch baseline |

## 8. Actor boundaries

| Actor | Goal | May initiate | Must not perform | State transitions owned | Data scope | Handoffs | Failure paths |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Guest | Browse public catalog and authenticate | public reads, register/login/reset flows | protected Admin/Librarian/Member operations | none | public catalog and own auth input | becomes authenticated user after FE02 | neutral auth errors; 401/403 |
| Member | Manage own membership/borrowing profile | own FE04 application/resubmission and allowed self-service | approve membership, manage users/roles, librarian circulation actions | own application submission only | own member/application/account view | Admin reviews FE04; Librarian handles circulation | validation/eligibility/authorization errors |
| Librarian | Operate approved circulation/catalog workflows | approved librarian operations | Admin-only user, role, permission or membership decisions | circulation transitions defined by FE07/FE08 | authorized library operational data | Member requests; Admin owns accounts/policy | server-side 403 and conflict responses |
| Admin | Manage accounts, roles, permissions and FE04 decisions | create/deactivate/replace role/resend setup/review membership | edit existing user profile identity, bypass guards, create extra role mapping | privileged account/membership transitions in approved contracts | safe user-management DTOs, role/permission policy, membership decisions | FE10 setup delivery; FE02 activation; FE07 loan guard | duplicate/stale/self/active-loan/pending-activation conflicts |
| System/worker | Deliver notifications and enforce technical transitions | approved internal jobs | act as a login role or bypass actor attribution | FE10 delivery states only | minimum queued notification data | reports delivery result after source commit | retry/failure policy from FE10 |

## 9. Business slices and PR boundaries

### SL-A / PR A — Shell closeout and current release truth

Outcome: publish already-proven closeouts and current security/release evidence without product behavior changes.

Owned files:

- `.sdd/specs/feat-auth/{TASKS,SPEC,CHANGELOG}.md`
- `.sdd/specs/feat-book-management/{TASKS,CHANGELOG}.md`
- `.sdd/specs/feat-user-role-management/{TASKS,SPEC,CHANGELOG}.md`
- `docs/security/react-router-rsc-audit-exception-2026-07-25.md`
- `README.md`, `plan.md`, `TECH_DEBT.md`
- `docs/release/final-submission-checklist-2026-07-20.md`
- `docs/release/phase3-final-report.md`
- `docs/superpowers/specs/2026-08-02-full-project-closeout-v1.0.3-design.md` and `docs/superpowers/plans/2026-08-02-full-project-closeout-pr-a-shell.md`, limited to written H1 status and fail-closed evidence corrections discovered during execution

Rules:

- close only FE02-T067, FE05-T019 and FE11-CAT01 from PR #95 evidence;
- preserve FE02-T049, FE04, FE09-B7 and FE11 UX/lifecycle/human acceptance as open;
- record BD-001 video waiver;
- keep governance self-edits limited to approval status, executable validation commands and observed immutable/advisory metadata; do not change an approved business decision or product boundary;
- do not change product code, dependencies, lockfiles, workflows, API, schema or requirement meaning;
- preserve the root checkout's existing dirty files byte-for-byte.

### SL-B / PR B — FE11 Core completion

Outcome: reconcile and complete the approved FE11 account lifecycle, role/permission and acceptance requirements.

Allowed production boundaries after RED evidence:

- `backend/src/{routes,controllers,services,repositories,validators,policies}/` files whose names are user-management, user-lifecycle, user-role or admin-permission specific;
- `frontend/src/api/userManagementApi.js`;
- `frontend/src/page/admin/users/**` and `frontend/src/page/admin/permissions/**`;
- focused backend/frontend tests and FE11 E2E coverage;
- FE11 SPEC/PLAN/TASKS/CHANGELOG and a new validation record.

Required behavior groups:

1. duplicate/invalid account creation with no partial user/setup/audit state;
2. active actor revalidation for privileged mutations;
3. atomic deactivation, session/refresh revocation and audit;
4. pending-activation, self-deactivation, active-loan and stale-state guards;
5. exactly-one-role replacement, idempotent same-role result and legacy mapping normalization;
6. read-only permission matrix with eight-entry navigation preserved;
7. server-side role isolation and safe DTO/error envelopes.

No production file is edited merely to raise trace coverage. A missing `@spec` tag is added only after the mapped test and implementation prove the requirement.

### SL-C / PR C — FE04 acceptance and FE02 reconciliation

Outcome: complete FE04 runtime/human gates and close FE02-T049 truthfully.

Default scope is tests/evidence/docs. Product edits are allowed only after a focused acceptance test fails for the expected requirement reason.

Potential product boundaries if RED is reproduced:

- FE04-specific membership route/controller/service/repository/validator files;
- `frontend/src/page/admin/membership/**` and membership API/components;
- FE04 focused backend, frontend, SQL and E2E tests;
- FE04 and FE02 SPEC/PLAN/TASKS/CHANGELOG plus validation records.

Acceptance must cover Admin approve/reject, Member resubmit, server-side authorization, responsive Admin UI, clean Playwright exit, exact staging SHA and cleanup of synthetic accounts/data. FE02-T049 closes only after its dependent H3/manual reconciliation links are present.

### SL-D / PR D — Final release evidence and v1.0.3

Outcome: reconcile project-wide state after PRs A-C and publish a release from the exact final commit.

Owned files:

- `README.md`, `plan.md`, `TECH_DEBT.md`;
- affected feature status/changelog files only when PRs A-C provide immutable evidence;
- release checklist/report and a new final closeout validation record;
- GitHub release notes after PR D integration.

Rules:

- all claims use final merge SHA and exact CI/deploy run IDs;
- `trace:enforce` must show every feature intended complete as `COMPLETE` with 100% coverage;
- any approved future/deferred boundary is named explicitly and is not represented as implemented;
- video remains waived;
- create annotated tag/release `v1.0.3` only after PR D post-merge verification.

## 10. Gate dashboard after written H1 activation

| Slice | G0 | G1 | G2 | G3 | G4 | G5 | G6 | G7 | Blocker | Owner | Next evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SL-A | passed | not-applicable | passed | passed | not-applicable | not-started | not-applicable | not-started | Complete docs diff and H2 review | Integration lead | L1-L4 packet and explicit H2 decision |
| SL-B | passed | passed | passed | ready | not-started | not-started | not-started | not-started | RED contracts and exact implementation plan | FE11 owner | Requirement-to-test ledger |
| SL-C | passed | passed | passed | ready | not-started | not-started | not-started | not-started | Staging/test-account acceptance setup | FE04/FE02 owners | Focused RED or evidence-only PASS |
| SL-D | passed | not-applicable | passed | ready | not-started | not-started | not-started | not-started | PRs A-C merged and deployed | Project lead | Final exact-SHA release packet |

`not-applicable` in SL-A/SL-D actor gates means these Shell-only slices do not create or change actor behavior; Nhat approved that boundary with H1.

## 11. Validation contract

### L1 — Automated

At minimum for every product PR:

```powershell
npm run trace:enforce
npm run test:secrets
npm audit --audit-level=high
npm --prefix backend audit --audit-level=high
npm --prefix frontend run audit:high
npm --prefix backend test
npm --prefix backend run test:integration:system
npm --prefix backend run test:coverage:ci
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
npm run test:e2e
npm run test:deployment
git diff --check
```

Focused RED-GREEN commands and disposable SQL suites are added by the implementation plan for each Core slice. A conditional SQL skip is not accepted as proof of a concurrency/state invariant; use a disposable non-staging SQL target or retain the gate as unresolved.

### L2 — Spec compliance

- each changed behavior maps decision -> requirement -> interface -> code -> RED/GREEN test -> evidence;
- every corrected trace row preserves the approved requirement text;
- no task is closed by broad CI alone;
- deferred/future boundaries stay explicit.

### L3 — Constitution and safety

- role enforcement and input validation remain server-side;
- all SQL writes remain parameterized and Core state/audit changes are atomic;
- errors expose no stack, token, credential or sensitive user data;
- synthetic accounts use random in-memory credentials and are deactivated/revoked during cleanup;
- no unapproved schema/API/dependency change.

### L4 — Acceptance

- FE11 Admin account lifecycle and permission behavior observed through UI/API on the exact staging SHA;
- FE04 reject/resubmit/approve flow observed with Admin/Member roles;
- denied role paths return server-side 401/403/409/404 as specified;
- responsive desktop/mobile behavior and clean browser teardown pass;
- post-run account/session/fixture cleanup is verified;
- final public smoke covers frontend, health, schema readiness, SQL catalog, CORS and protected route.

## 12. Human gates and authority

1. The chat approval established the batch outcome, PR order, Core/Shell split and video waiver.
2. Nhat's review of this written design activates the exact business decisions and file boundaries before the implementation plan is written.
3. The implementation plan must list exact tasks/files/tests/commands and receives its own plan approval before Core execution.
4. H2 reviews each complete generated diff and L1-L4 evidence before commit/push.
5. H3 is required after exact-head CI and before every PR merge.
6. After H3, exact post-merge CI/staging monitoring is authorized for that PR.
7. BD-006 authorizes `v1.0.3` only after PR D exact post-merge verification; any mismatch blocks release.

## 13. Stop conditions

Stop the active slice immediately if any of the following occurs:

- an approved requirement remains materially ambiguous after the decisions above;
- implementation requires a schema, public API, role or dependency change not named here;
- two slices need concurrent edits to the same Core file;
- a secret/credential/PII finding appears;
- server-side authorization unexpectedly succeeds for a denied actor;
- a required SQL invariant can only be “proved” by a skipped suite;
- staging revision/database/host differs from the expected target;
- synthetic cleanup is incomplete;
- required CI fails or the PR head changes after H3 review;
- a deterministic failure reaches three total attempts.

The escape hatch is to record the exact blocker, preserve evidence, narrow the slice and return to the relevant human gate. Do not weaken tests, change the requirement silently or merge around a failed gate.

## 14. Acceptance criteria for the full batch

The batch is complete only when:

- PRs A-D are merged through H3 with exact post-merge CI and staging evidence;
- FE02, FE04 and FE11 status is reconciled to approved scope and evidence;
- FE11 conflicts CF-001..CF-004 are resolved in SPEC/traceability/tests/code;
- all Core RED tests fail for the expected business reason before implementation and pass afterward;
- root/backend/frontend audit gates pass, with only the documented React Router exception accepted by the fail-closed guard;
- no release-blocking unchecked task, unowned P1 debt or contradictory completion claim remains;
- authenticated FE11/FE04 acceptance and cleanup pass on the final staging SHA;
- release documents and GitHub release notes use the final exact commit/run IDs;
- `v1.0.3` tag resolves to that final commit;
- the video item is explicitly waived and absent rather than falsely marked published;
- the original dirty checkout remains recoverable and its existing user changes are not overwritten.
