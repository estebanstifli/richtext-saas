import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getAppUrl, getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  if (!user.stripeCustomerId) {
    return NextResponse.redirect(new URL("/upgrade", request.url), { status: 303 });
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getAppUrl()}/app/dashboard`
    });

    if (!session.url) {
      throw new Error("Stripe did not return a billing portal URL.");
    }

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    logger.error("Unable to open Stripe billing portal", error);
    return NextResponse.redirect(new URL("/app/dashboard?billing=portal-error", request.url), { status: 303 });
  }
}
