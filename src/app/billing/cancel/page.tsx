import Link from "next/link";

// Pantalla de cancelacion de checkout.
// Solo informa y da CTA para volver a intentar upgrade.

import { AppHeader } from "@/components/layout/app-header";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { messages } from "@/messages/en";

// Flujo simple: usuario autenticado + mensaje de cancel + boton volver a upgrade.
export default async function BillingCancelPage() {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-muted/35">
      <AppHeader user={user} />
      <main className="mx-auto flex w-full max-w-2xl px-4 py-16 sm:px-6">
        <div className="w-full rounded-lg border border-border bg-background p-8 shadow-sm">
          <h1 className="text-3xl font-bold tracking-normal">{messages.billing.canceledTitle}</h1>
          <p className="mt-3 text-muted-foreground">{messages.billing.canceledSubtitle}</p>
          <div className="mt-8">
            <Link className={buttonVariants({ variant: "outline" })} href="/upgrade">
              {messages.billing.upgradeButton}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
