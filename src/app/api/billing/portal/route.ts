import { NextResponse } from "next/server";

// Endpoint para abrir el Customer Portal de Stripe.
// Sirve para que el usuario gestione su subscripcion/pagos desde Stripe.

import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getAppUrl, getStripe } from "@/lib/stripe";

// POST /api/billing/portal
// Si todo va bien, redirige al portal; si no, vuelve al dashboard con error.
export async function POST(request: Request) {
  const user = await getCurrentUser();

  // Guard de auth: sin cookie/sesion valida no hay portal.
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  // Si no tiene customer, no hay nada que Stripe Portal pueda mostrar/gestionar.
  if (!user.stripeCustomerId) {
    return NextResponse.redirect(new URL("/upgrade", request.url), { status: 303 });
  }

  try {
    // Stripe nos da URL temporal del portal (one-time/session scoped).
    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getAppUrl()}/app/dashboard`
    });

    // Defensa extra: Stripe deberia devolver URL.
    if (!session.url) {
      throw new Error("Stripe did not return a billing portal URL.");
    }

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    logger.error("Unable to open Stripe billing portal", error);
    return NextResponse.redirect(new URL("/app/dashboard?billing=portal-error", request.url), { status: 303 });
  }
}
