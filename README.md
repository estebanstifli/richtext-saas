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

## Environment Variables

```bash
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_COOKIE_NAME="rtext_session"
LOGGING_ENABLED="true"
LOG_LEVEL="info"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_MONTHLY_PRICE_ID="price_..."
STRIPE_ANNUAL_PRICE_ID="price_..."
STRIPE_LIFETIME_PRICE_ID="price_..."
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

Create three Stripe Prices:

- Monthly recurring price
- Annual recurring price
- Lifetime one-time price

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
- No automated test suite yet.

## Verification

The project has been checked with:

```powershell
npm run lint
$env:DATABASE_URL='file:./dev.db'; $env:NEXT_PUBLIC_APP_URL='http://localhost:3000'; npm run build
```

The app was also opened locally and verified through registration, dashboard access, document creation, and the non-paying upgrade gate.
