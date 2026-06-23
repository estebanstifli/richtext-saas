import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { getStripe } from "@/lib/stripe";
import { processStripeWebhookEvent } from "@/lib/stripe-sync";
import { messages } from "@/messages/en";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    logger.error("Stripe webhook missing signature or secret");
    return NextResponse.json({ error: messages.errors.invalidWebhook }, { status: 400 });
  }

  const rawBody = await request.text();
  let event;

  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    logger.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: messages.errors.invalidWebhook }, { status: 400 });
  }

  try {
    await processStripeWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Stripe webhook processing failed", error);
    return NextResponse.json({ error: messages.errors.internal }, { status: 500 });
  }
}
