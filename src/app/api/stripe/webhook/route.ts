import { NextResponse } from "next/server";

// Puerta de entrada de webhooks Stripe.
// Aqui validamos firma y pasamos el evento al procesador central.

import { logger } from "@/lib/logger";
import { getStripe } from "@/lib/stripe";
import { processStripeWebhookEvent } from "@/lib/stripe-sync";
import { messages } from "@/messages/en";

export const runtime = "nodejs";

// POST webhook: verifica firma, parsea evento y ejecuta sincronizacion de billing.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Si falta firma o secret, ni intentamos procesar.
  if (!signature || !webhookSecret) {
    logger.error("Stripe webhook missing signature or secret");
    return NextResponse.json({ error: messages.errors.invalidWebhook }, { status: 400 });
  }

  // Ojo critico: Stripe firma el raw payload; si lo parseas antes, rompe verificacion.
  const rawBody = await request.text();
  let event;

  try {
    // Verificacion criptografica de que el evento viene de Stripe.
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    logger.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: messages.errors.invalidWebhook }, { status: 400 });
  }

  try {
    // Handler idempotente/centralizado en stripe-sync para no duplicar logica aqui.
    await processStripeWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Stripe webhook processing failed", error);
    return NextResponse.json({ error: messages.errors.internal }, { status: 500 });
  }
}
