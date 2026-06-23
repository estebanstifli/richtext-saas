# Short Write-Up

## 1. How the app decides a user is an active subscriber

The app keeps local billing state in the `Subscription` table and evaluates access in `src/lib/billing.ts`. A user has paid access when they have lifetime access (`lifetimeAccess = true` or status `LIFETIME`) or an active recurring subscription (`status = ACTIVE`) whose `currentPeriodEnd` has not expired. All paid document actions are protected server-side: the dashboard/editor pages, document creation, document update, rename, and delete paths check the authenticated user and their subscription state before allowing access.

Users who register but have no active plan, or who let a subscription lapse, retain read-only access to their own documents. They can view the document list and open any document to read its content, but the editor toolbar and save button are hidden and every write API still returns 403. This preserves their content without granting editing access they have not paid for. Webhooks update `stripeCustomerId`, `stripeSubscriptionId`, plan, status, period end, and lifetime access. This gives the app a simple local decision model without trusting client-side state.

## 2. What happens if payment succeeds but the webhook is delayed

The app does not rely only on the browser redirect or only on the webhook. When Checkout starts, the authenticated user is attached to Stripe through a stored `stripeCustomerId`, `client_reference_id = user.id`, and Checkout metadata. If the user returns to `/billing/success`, the server retrieves the Checkout Session from Stripe, verifies that the session belongs to the authenticated user, checks that the payment/subscription is complete, and applies the same billing update as the webhook.

There is also a second recovery path: when a user with a stored `stripeCustomerId` reaches the dashboard or upgrade page but does not yet have active local access, the backend checks recent completed Checkout Sessions for that Stripe customer and reconciles the local subscription state. This covers the common case where Stripe accepted payment but the webhook is delayed, retried, or temporarily unavailable.

If Stripe itself is unavailable, existing subscribers continue to use the editor from the locally stored entitlement as long as the saved subscription period is still valid. New subscriptions, billing portal sessions, and reconciliation attempts need Stripe, so they fail closed with a retry-later error rather than granting access from client-side state.

For support and review, the project includes `npm run stripe:status -- user@example.com`. That command can inspect Stripe customers, active subscriptions, and completed Checkout Sessions by email. It is intentionally diagnostic only. The app does not grant access merely because an email appears paid in Stripe, because this MVP does not include email verification, Stripe can contain duplicate customers with the same email, and the billing email can differ from the login email.

## 3. One security decision and why

One important security decision is to tie billing authorization to the authenticated app user and Stripe-owned identifiers, not to client-side redirects or email lookup alone. Checkout Sessions are created server-side for the logged-in user, include `client_reference_id = user.id`, and are reconciled against the user's stored `stripeCustomerId`. This prevents a user from gaining access just by visiting a success URL, reusing another email, or matching an unrelated Stripe customer record.

The same principle is used across the app: protected pages and APIs validate the HttpOnly session cookie server-side, documents are always scoped by `userId`, and editor save operations require both document ownership and active paid access.
