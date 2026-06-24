# Draftly

Draftly is a complete MVP SaaS rich text editor built with Next.js 15, TypeScript, Prisma, SQLite, Stripe Checkout, cookie-based authentication, and TipTap.

## Features

- Responsive public landing page with hero, features, pricing, FAQ, and calls to action.
- Email/password registration and login with `bcryptjs`.
- Secure HttpOnly cookie sessions validated server-side.
- Authenticated dashboard for creating, renaming, deleting, and opening documents.
- Dashboard subscription summary with plan, status, and renewal date.
- TipTap editor gated behind active paid access, with underline, text colors, highlight colors, links, images, image sizing, and text/image alignment.
- Debounced autosave plus live word and character counts in the editor.
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

## Deployment Notes

Deployment was not required for this assignment, but I deployed the application to a public VPS in order to validate the complete Stripe integration in a production-like environment.

This allowed testing:

- Stripe Checkout sessions
- Webhook delivery and signature verification
- Billing Portal integration
- Subscription reconciliation logic
- HTTPS configuration
- Reverse proxy setup
- Environment variable configuration

The application can still be run entirely in local development as described below.

## Setup

For the shortest local setup, copy `.env.example` to `.env`, fill the required Stripe values, then run:

```bash
npm run start:all
```

This installs dependencies, generates Prisma Client, pushes the SQLite schema, builds the app, and starts the production server. For development mode, use the step-by-step flow below.

Install dependencies:

```bash
npm install
```

Create your environment file:

Copy `.env.example` to `.env` and fill the required values. On macOS/Linux you can use `cp .env.example .env`; on Windows, copy the file from Explorer or run `Copy-Item .env.example .env` in PowerShell.

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
- `DocumentAsset`: uploaded image metadata linked to the owning user and document.

Useful commands:

```bash
npm run prisma:generate
npm run db:push
npm run db:deploy
npm run prisma:migrate
```

For this SQLite MVP, `npm run db:deploy` is the deployment-safe schema sync command: it applies the current Prisma schema to the configured SQLite database and regenerates Prisma Client. Run it on the server after pulling changes that modify `prisma/schema.prisma`, such as the `DocumentAsset` table used for uploaded editor images.

For larger production systems, prefer migrations:

```bash
npm run prisma:migrate -- --name init
```

If a deployed server reports `The table main.document_assets does not exist`, the code has been deployed before the remote SQLite schema was synced. Run this in the deployed app directory, with the production `.env` present:

```bash
npm run db:deploy
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

Authenticated users with a Stripe customer can open Stripe-hosted billing management from the app header. Enable Customer Portal in the Stripe Dashboard for the test account. The `/api/billing/portal` route creates a Stripe Customer Portal session server-side and redirects back to the dashboard if Stripe is unavailable.

### Webhook Fallback and Email Checks

If a webhook is delayed or unavailable, the backend can still validate payment state against Stripe. The success page verifies the returned Checkout Session server-side, checks that `client_reference_id` belongs to the authenticated user, and then applies the same subscription update as the webhook. Dashboard and upgrade pages also reconcile recent completed Checkout Sessions for users who already have a stored `stripeCustomerId`.

If Stripe itself is temporarily down, existing subscribers keep access as long as their locally stored subscription state is still valid. New Checkout sessions, billing portal sessions, and payment reconciliation require Stripe and surface a retry-later style error instead of unlocking access from the client.

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
- read-only document access for non-paying users (content visible, all write actions blocked)
- server-side image upload gating for non-paying users
- billing portal route protection

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
- TipTap content is stored as serialized JSON in a SQLite text column for simple portability. The editor uses StarterKit plus underline, text color, multicolor highlight, link, image, character count, and alignment extensions for a richer MVP editing surface.
- Uploaded editor images are validated server-side, stored under `public/uploads/{userId}/{documentId}`, and tracked in Prisma through `DocumentAsset`.
- Non-subscribers retain read-only access to their own documents. The `editable` prop on `RichTextEditor` hides the toolbar and save controls for users without paid access. Every write path (document save PATCH, image upload POST, server actions for create/rename/delete) enforces the subscription check independently on the server, so the read-only UI is an affordance, not the security boundary.
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
- Image uploads require document ownership and active paid access, allow only JPG, PNG, WebP, or GIF, and reject files larger than 5 MB.
- Stripe webhook signatures are verified with `STRIPE_WEBHOOK_SECRET`.

## Take-Home Write-Up

The required one-page written response is available in [WRITEUP.md](./WRITEUP.md). It covers active subscriber detection, webhook fallback behavior, and the billing authorization security decision.

## Tradeoffs

- Sessions are single-device because the session hash is stored directly on `User`.
- There is no CSRF token layer; the MVP relies on `SameSite=Lax` cookies and server-side authorization.
- TipTap content is stored as JSON text instead of a structured JSON column for SQLite simplicity.
- Image storage uses the local filesystem for MVP simplicity; object storage such as S3 or R2 would be better for horizontally scaled or serverless production deployments.
- Billing state is optimized for the three required plans, not for a large plan catalog.
- Webhook idempotency is stored on `Subscription`; a dedicated `StripeEvent` table would scale better.

## Known Limitations

- No email verification.
- No password reset.
- No OAuth.
- No admin panel.
- No team accounts.
- No realtime collaboration.
- No cloud object storage for uploaded images.
- The automated smoke test does not complete card entry in Stripe Checkout.

## Verification

The project has been checked with:

```powershell
npm run lint
npm run test:acceptance
$env:DATABASE_URL='file:./dev.db'; $env:NEXT_PUBLIC_APP_URL='http://localhost:3000'; npm run build
```

The app was also opened locally and verified through registration, dashboard access, document creation, and the non-paying upgrade gate.
