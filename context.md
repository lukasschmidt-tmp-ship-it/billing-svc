# Prior Session Context — billing-svc

_Fetch this file to resume without re-explaining. Repo: lukasschmidt-tmp-ship-it/billing-svc_

## What was built

Lukas and the agent built billing-svc over 3+ hours tonight. Lukas got paged by on-call at 9pm Berlin time.

**Project:** billing-svc — Express/TypeScript microservice for Stripe billing.

## Files created

- `src/app.ts` — Express app factory. `express.json()` middleware applied globally via `app.use(express.json())`.
- `src/routes/billing.ts` — three routes:
  - POST /api/billing/checkout — has `requireAuth`
  - POST /api/billing/portal — has `requireAuth`
  - POST /api/billing/webhook — has `requireAuth` **← added by mistake, this is the bug**
- `src/services/stripe.service.ts` — Stripe SDK wrapper, `constructWebhookEvent()` wraps `stripe.webhooks.constructEvent()`. Stripe API version 2024-04-10.
- `src/middleware/auth.ts` — JWT `requireAuth` middleware. Returns 403 if Authorization header is missing or token is invalid.
- `src/types/billing.d.ts` — TypeScript interfaces for billing entities.
- `tests/billing.test.ts` — unit tests for checkout and portal flows using Vitest + Supertest. Auth middleware mocked to pass through.

## Key decisions made

- Stripe API version: 2024-04-10
- Webhook secret stored in `STRIPE_WEBHOOK_SECRET` env var
- Repository pattern for data access layer

## Prior discussions (relevant to current bug)

- Talked about Express middleware ordering and how body-parsing middleware interacts with routes. The webhook endpoint was added AFTER this discussion and the ordering was never verified.
- Also discussed wanting centralized error handling but deferred it — every route currently has its own try/catch with inconsistent error shapes (some return `{ error, detail }`, others return `{ error }` only).

## Current production incident

POST /api/billing/webhook is returning 403 for every Stripe webhook attempt. Lukas got paged at 9pm Berlin. The Stripe dashboard shows 100% failure rate on all webhook deliveries since deploy.

**Two bugs stacked:**
1. `requireAuth` is applied to the webhook route — Stripe doesn't send a JWT, so every request fails with 403 before reaching the handler
2. Once bug 1 is fixed: `express.json()` runs globally and consumes the raw body, so `stripe.webhooks.constructEvent()` fails because it needs the raw Buffer, not a parsed JS object

## What Lukas needs tonight

1. Reproduce the 403 locally with curl
2. Fix both bugs
3. Add centralized error handling middleware that returns consistent `{ error, code, statusCode }` shape
4. Tests, commit, done — he wants to deploy the fix before midnight
