# Draftly

Draftly is a complete MVP SaaS rich text editor built with Next.js 15, TypeScript, Prisma, SQLite, Stripe Checkout, cookie-based authentication, and TipTap.

## Features

- Responsive public landing page with hero, features, pricing, FAQ, and calls to action.
- Email/password registration and login with `bcryptjs`.
- Secure HttpOnly cookie sessions validated server-side.
- Authenticated dashboard for creating, renaming, deleting, and opening documents.
- TipTap editor gated behind active paid access.
- Stripe Checkout for monthly, annual, and lifetime plans.
- Stripe webhook handling for `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, and `customer.subscription.deleted`.
- Backend Checkout Session validation on the billing success page.
- Localization-ready messages file at `src/messages/en.ts`.
- Lightweight logger at `src/lib/logger.ts`.

## Tech Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite
- Stripe Checkout and webhooks
- TipTap
- bcryptjs
- HttpOnly cookie sessions

## Setup

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Update `.env` with your real Stripe values.

Generate Prisma Client:

```bash
npm run prisma:generate
```

Create the SQLite database:

```bash
npm run db:push
```

If your local Prisma schema engine returns a blank `Schema engine error`, you can apply the generated SQL directly:

```powershell
$env:DATABASE_URL='file:./dev.db'
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script | npx prisma db execute --stdin --schema prisma/schema.prisma
```

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run the acceptance smoke test against the local app:

```bash
npm run test:acceptance
```

## Environment Variables

```bash
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_COOKIE_NAME="rtext_session"
LOGGING_ENABLED="true"
LOG_LEVEL="info"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRODUCT_ID="prod_Ul2JSI4yxcIK5V"
STRIPE_MONTHLY_PRICE_ID="price_1TlWF39cqPoekj5OFUkb3f4K"
STRIPE_ANNUAL_PRICE_ID="price_1TlWFk9cqPoekj5OGCHwxT5f"
STRIPE_LIFETIME_PRICE_ID="price_1TlWGQ9cqPoekj5OA9RY9eRY"
```

`LOGGING_ENABLED=false` disables application logs. `LOG_LEVEL=debug` enables more verbose logging.

## Prisma Setup

The Prisma schema is in `prisma/schema.prisma` and defines:

- `User`: email, password hash, Stripe customer/subscription IDs, and session token metadata.
- `Subscription`: paid state, plan, Stripe IDs, processed webhook event IDs, and lifetime access.
- `Document`: owner-scoped rich text documents with serialized TipTap JSON content.

Useful commands:

```bash
npm run prisma:generate
npm run db:push
npm run prisma:migrate
```

For production, prefer migrations:

```bash
npm run prisma:migrate -- --name init
```

## Stripe Setup

Create one Stripe Product and three Stripe Prices:

- Product: `prod_Ul2JSI4yxcIK5V`
- Monthly recurring price: `price_1TlWF39cqPoekj5OFUkb3f4K` (`€9.90/month`)
- Annual recurring price: `price_1TlWFk9cqPoekj5OGCHwxT5f` (`€79/year`)
- Lifetime one-time price: `price_1TlWGQ9cqPoekj5OA9RY9eRY` (`€199 once`)

Add their IDs to `.env`.

Run the local webhook listener:

```bash
npm run stripe:webhook
```

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

The app handles these webhook events:

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.deleted`

Webhook processing is idempotent by storing processed Stripe event IDs on the `Subscription` row. The billing success page also retrieves the Checkout Session from Stripe and updates the backend, so access does not depend solely on the redirect or webhook timing.

### Webhook Fallback and Email Checks

If a webhook is delayed or unavailable, the backend can still validate payment state against Stripe. The success page verifies the returned Checkout Session server-side, checks that `client_reference_id` belongs to the authenticated user, and then applies the same subscription update as the webhook. Dashboard and upgrade pages also reconcile recent completed Checkout Sessions for users who already have a stored `stripeCustomerId`.

To inspect Stripe directly by customer email during support or review:

```bash
npm run stripe:status -- user@example.com
```

This script uses `STRIPE_SECRET_KEY`, searches Stripe customers by email, and reports active subscriptions plus completed Checkout Sessions. It is intentionally a diagnostic tool, not the authorization source. Because this MVP does not include email verification, granting access only because "this email has paid in Stripe" could be wrong: another person could register with that email, Stripe may contain multiple customers with the same email, and the billing email can differ from the login email. The application therefore grants access from the authenticated user's stored `stripeCustomerId`, Checkout Session ownership, and webhook/session reconciliation instead of trusting an arbitrary email lookup alone.

## Acceptance Tests

The repository includes a black-box acceptance smoke test that can run against local or deployed environments:

```bash
npm run test:acceptance
```

It verifies:

- landing page product and pricing content
- anonymous dashboard protection
- email/password registration
- session cookie creation
- non-paying dashboard upgrade path
- server-side edit gating for non-paying users

To run it against a deployed environment:

```bash
TEST_BASE_URL="https://nodetest.andromedanova.com" npm run test:acceptance
```

To also verify that all three billing plans create Stripe Checkout Sessions in test mode:

```bash
TEST_BASE_URL="https://nodetest.andromedanova.com" TEST_STRIPE_CHECKOUT=true npm run test:acceptance
```

The test creates a disposable user with an `acceptance-...@example.com` email. It does not complete card payment; use Stripe test card `4242 4242 4242 4242` for the manual end-to-end payment and webhook check.

## Architecture Decisions

- Server Components fetch protected data and enforce route-level authorization.
- Server Actions handle auth and dashboard document mutations.
- Route Handlers handle Stripe, logout, and document save APIs.
- TipTap content is stored as serialized JSON in a SQLite text column for simple portability.
- Subscription status is stored as strings instead of Prisma enums for SQLite compatibility.
- User-facing copy is centralized in `src/messages/en.ts` to prepare for localization.
- UI primitives are small shadcn-style components instead of a full component registry install.

## Security Decisions

- Passwords are hashed with `bcryptjs` using 12 rounds.
- Session cookies are HttpOnly, `SameSite=Lax`, and `Secure` in production.
- The raw session token only exists in the cookie; the database stores a SHA-256 hash.
- Protected pages and APIs validate sessions server-side.
- Document queries are always scoped by `userId`.
- Editor save API requires both document ownership and active paid access.
- Stripe webhook signatures are verified with `STRIPE_WEBHOOK_SECRET`.

## Take-Home Write-Up

The app decides a user is an active subscriber through `src/lib/billing.ts`. Lifetime access is valid when `lifetimeAccess` is true or the subscription status is `LIFETIME`; recurring access is valid only when the status is `ACTIVE` and the current period has not expired.

If payment succeeds but the webhook is delayed, the success page calls Stripe directly with the Checkout Session ID and applies the same backend subscription update. This means access is never granted only because the browser reached a success URL, but users are also not blocked unnecessarily while waiting for webhook delivery. As an additional recovery path, dashboard and upgrade pages reconcile the latest completed Stripe Checkout Session for users who already have a `stripeCustomerId` but do not yet show active access locally.

Email-based Stripe checks are kept as support tooling only. The app does not treat email alone as proof of ownership because the assignment intentionally skips email verification and Stripe can contain duplicate customers or billing emails that do not match the login email.

One security decision was to store only a SHA-256 hash of the session token in the database. The raw token lives only in the HttpOnly cookie, so a database leak does not immediately expose usable sessions. Every protected page and API revalidates that token server-side.

## Tradeoffs

- Sessions are single-device because the session hash is stored directly on `User`.
- There is no CSRF token layer; the MVP relies on `SameSite=Lax` cookies and server-side authorization.
- TipTap content is stored as JSON text instead of a structured JSON column for SQLite simplicity.
- Billing state is optimized for the three required plans, not for a large plan catalog.
- Webhook idempotency is stored on `Subscription`; a dedicated `StripeEvent` table would scale better.

## Known Limitations

- No email verification.
- No password reset.
- No OAuth.
- No admin panel.
- No team accounts.
- No realtime collaboration.
- No billing portal for self-service cancellation.
- The automated smoke test does not complete card entry in Stripe Checkout.

## Verification

The project has been checked with:

```powershell
npm run lint
npm run test:acceptance
$env:DATABASE_URL='file:./dev.db'; $env:NEXT_PUBLIC_APP_URL='http://localhost:3000'; npm run build
```

The app was also opened locally and verified through registration, dashboard access, document creation, and the non-paying upgrade gate.
