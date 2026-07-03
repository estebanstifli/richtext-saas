import { NextResponse } from "next/server";

// Endpoint que arranca Stripe Checkout.
// Flujo rapido: usuario auth -> plan valido -> customer/session en Stripe -> redirect al checkout.

import { getAuthenticatedUserOrThrow } from "@/lib/auth";
import { getAppUrl, getCheckoutPlan, getStripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

// POST /api/billing/checkout
// Crea (si hace falta) customer en Stripe y devuelve redireccion 303 a la URL de Checkout.
export async function POST(request: Request) {
  try {
    // Solo usuarios autenticados pueden pagar.
    const user = await getAuthenticatedUserOrThrow();

    // Leemos el plan seleccionado desde el form.
    const formData = await request.formData();
    const checkoutPlan = getCheckoutPlan(formData.get("plan"));
    const stripe = getStripe();
    const appUrl = getAppUrl();

    // Reutilizamos customer para no fragmentar historial de pagos por usuario.
    let stripeCustomerId = user.stripeCustomerId;

    // Si el usuario aun no tiene customer en Stripe, lo creamos y lo guardamos en DB.
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

    // Creamos la sesion de Checkout.
    // Metemos metadata en varios niveles para hacer reconciliation robusto en webhooks/fallback.
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

    // Defensa extra: Stripe deberia devolver URL, si no, tratamos como error.
    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }

    // 303 para que el navegador haga GET a Stripe Checkout.
    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    // UX de fallback: volvemos a upgrade con query flag y ahi mostramos banner de error.
    logger.error("Unable to start Stripe Checkout", error);
    return NextResponse.redirect(new URL("/upgrade?error=checkout", request.url), { status: 303 });
  }
}
