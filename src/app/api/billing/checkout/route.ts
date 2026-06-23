import { NextResponse } from "next/server";

import { getAuthenticatedUserOrThrow } from "@/lib/auth";
import { getAppUrl, getCheckoutPlan, getStripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUserOrThrow();
    const formData = await request.formData();
    const checkoutPlan = getCheckoutPlan(formData.get("plan"));
    const stripe = getStripe();
    const appUrl = getAppUrl();

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id
        }
      });

      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId }
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: checkoutPlan.mode,
      customer: stripeCustomerId,
      client_reference_id: user.id,
      line_items: [
        {
          price: checkoutPlan.priceId,
          quantity: 1
        }
      ],
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/cancel`,
      allow_promotion_codes: true,
      metadata: {
        userId: user.id,
        plan: checkoutPlan.plan
      },
      subscription_data:
        checkoutPlan.mode === "subscription"
          ? {
              metadata: {
                userId: user.id,
                plan: checkoutPlan.plan
              }
            }
          : undefined,
      payment_intent_data:
        checkoutPlan.mode === "payment"
          ? {
              metadata: {
                userId: user.id,
                plan: checkoutPlan.plan
              }
            }
          : undefined
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    logger.error("Unable to start Stripe Checkout", error);
    return NextResponse.redirect(new URL("/upgrade?error=checkout", request.url), { status: 303 });
  }
}
