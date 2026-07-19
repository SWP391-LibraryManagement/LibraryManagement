# Phase 3 Polish and Delivery Design

Date: 2026-07-19

Decision: Hybrid SDD + ADD, Full depth.

## Goal

Close the roadmap's Phase 3 (weeks 13-15) for the already-accepted FE01-FE12
scope: prove a current staging deployment, capture user-testing and performance
evidence, and deliver the final documentation, presentation, and rehearsal
artifacts without inventing external evidence.

## Boundaries

Core behavior remains the approved Phase 2 contract. This work may change
deployment configuration, operational documentation, measurement tooling, and
presentation assets. It must not change feature business rules, SQL schema, API
ownership, authentication semantics, or role authorization without a separate
approved feature specification and ADR.

The staging environment is Azure Static Web Apps + Azure App Service + Azure
SQL. The workflow remains manually dispatched and must pass its quality gate,
both deployment jobs, and the smoke test. App Service sits behind a proxy, so
production authentication requests require `TRUST_PROXY=true` for the existing
HTTPS enforcement middleware to observe the forwarded protocol correctly.

## Phase 3 Deliverables

1. Current deployment evidence tied to the exact `main` SHA, including the
   workflow run, endpoint checks, strict CORS, protected-route rejection, and
   the runtime configuration correction documented in the staging guide.
2. A reproducible performance report covering the production frontend bundle,
   local deterministic API/session timing, known NFR boundaries, and any
   justified polish. SMTP delivery, shared SQL CI, and durable avatar storage
   remain explicitly unproven boundaries unless observed separately.
3. A user-testing/acceptance record that distinguishes automated browser
   observations, staging smoke observations, and checks that require a human
   with authenticated synthetic staging accounts.
4. Updated release documentation with no unresolved operational placeholders
   for URLs or verified evidence. Unavailable external artifacts must be
   labelled as unavailable, never replaced with a fabricated link.
5. A final presentation deck and a timed rehearsal record based on the
   deterministic golden path and its fallback evidence.

## Validation Contract

All four Hybrid validation layers are required:

- Automated: root traceability/deployment tests, backend coverage and system
  integration, frontend tests/lint/build, browser E2E, and staging smoke.
- Spec: every claim maps to the roadmap, `plan.md`, approved feature specs,
  the deployment workflow, or this Phase 3 evidence record.
- Safety/Constitution: no secrets, tokens, credentials, raw OTPs, or real PII
  enter tracked files; the staging guide records only non-secret names and
  observed outcomes.
- Acceptance: browser golden-path observations, exact staging endpoint
  observations, performance measurements, rendered presentation review, and
  an explicit list of human-only checks that remain open.

## Non-goals and residual risks

This phase does not claim real SMTP inbox delivery without a provider-level
observation, create a shared SQL Server service in GitHub Actions, add durable
avatar storage, or promise a production SLA for the student-credit staging
environment. The current Azure Actions runner warning about forced Node.js 24
is non-blocking and will be recorded as a workflow maintenance note rather than
silently changing action versions during delivery.
