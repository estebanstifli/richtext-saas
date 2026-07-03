import type { Subscription, User } from "@prisma/client";
import { CreditCard } from "lucide-react";
import Link from "next/link";

// Header del area privada (/app/*).
// Muestra estado del plan y accesos rapidos (billing, upgrade, logout).

import { Button, buttonVariants } from "@/components/ui/button";
import { getSubscriptionState } from "@/lib/billing";
import { cn } from "@/lib/utils";
import { messages } from "@/messages/en";

type AppHeaderProps = {
  user: User & {
    subscription: Subscription | null;
  };
};

// Traduce estado simplificado a etiqueta visible en la pill del header.
function planLabel(state: ReturnType<typeof getSubscriptionState>) {
  if (state === "active") {
    return messages.dashboard.planActive;
  }

  if (state === "past_due") {
    return messages.dashboard.planPastDue;
  }

  return messages.dashboard.planFree;
}

// Componente principal del header autenticado.
export function AppHeader({ user }: AppHeaderProps) {
  const state = getSubscriptionState(user.subscription);

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link className="text-lg font-semibold tracking-normal" href="/app/dashboard">
            {messages.appName}
          </Link>
          <span
            className={cn(
              "hidden rounded-md px-2.5 py-1 text-xs font-medium sm:inline-flex",
              state === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {planLabel(state)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user.stripeCustomerId ? (
            // Boton que abre Stripe Customer Portal via POST.
            <form action="/api/billing/portal" method="POST">
              <Button size="sm" title={messages.nav.billing} type="submit" variant="outline">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                {messages.nav.billing}
              </Button>
            </form>
          ) : null}
          {state !== "active" ? (
            // Si no hay acceso activo, mostramos CTA de upgrade.
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/upgrade">
              {messages.nav.upgrade}
            </Link>
          ) : null}
          {/* Logout por POST para limpiar sesion server-side. */}
          <form action="/api/auth/logout" method="POST">
            <Button size="sm" type="submit" variant="ghost">
              {messages.nav.logout}
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
