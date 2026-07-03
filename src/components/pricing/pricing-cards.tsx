import { BadgeEuro, CalendarCheck2, Check, Infinity, Sparkles } from "lucide-react";
import Link from "next/link";

// Tarjetas de precios reutilizables.
// Se usan en landing (modo link) y en upgrade (modo checkout).

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { type BillingPlan, planKeys } from "@/lib/billing";
import { cn } from "@/lib/utils";
import { messages } from "@/messages/en";

type PricingCardsProps = {
  mode?: "link" | "checkout";
  selectedPlan?: string;
};

// Renderiza las 3 cards de plan con CTA segun modo.
export function PricingCards({ mode = "link", selectedPlan }: PricingCardsProps) {
  const planIcons = {
    monthly: BadgeEuro,
    annual: CalendarCheck2,
    lifetime: Infinity
  };

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {planKeys.map((key) => {
        const plan = messages.pricing[key];
        // Annual va destacado por defecto salvo que selectedPlan diga otra cosa.
        const highlighted = selectedPlan === key || key === "annual";
        const Icon = planIcons[key];

        return (
          <Card
            className={cn(
              "relative flex h-full flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-1",
              highlighted ? "border-primary shadow-lg shadow-primary/10" : "border-border shadow-sm"
            )}
            key={key}
          >
            {highlighted ? <div className="absolute inset-x-0 top-0 h-1 bg-primary" /> : null}
            <CardHeader className="gap-4">
              <div className="flex items-start justify-between gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-lg",
                    highlighted ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                  )}
                >
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </div>
                <span
                  className={cn(
                    "inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-semibold",
                    highlighted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {highlighted ? <Sparkles aria-hidden="true" className="h-3.5 w-3.5" /> : null}
                  {plan.badge}
                </span>
              </div>
              <div className="space-y-2">
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-7">
              <div className="rounded-lg bg-muted/60 p-4">
                <div>
                  <span className="text-4xl font-bold tracking-normal">{plan.price}</span>
                  <span className="ml-1 text-sm text-muted-foreground">{plan.cadence}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-primary">{plan.note}</p>
              </div>
              <ul className="space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li className="flex gap-2" key={feature}>
                    <Check aria-hidden="true" className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <PlanAction mode={mode} planKey={key} text={plan.cta} />
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

// CTA por plan: o te manda a register con plan, o ejecuta checkout directo via POST.
function PlanAction({ mode, planKey, text }: { mode: "link" | "checkout"; planKey: BillingPlan; text: string }) {
  if (mode === "checkout") {
    return (
      // Form tradicional para que el endpoint pueda devolver redirect 303 a Stripe Checkout.
      <form action="/api/billing/checkout" className="w-full" method="POST">
        <input name="plan" type="hidden" value={planKey} />
        <button className={cn(buttonVariants(), "w-full")} type="submit">
          {text}
        </button>
      </form>
    );
  }

  return (
    <Link className={cn(buttonVariants(), "w-full")} href={`/register?plan=${planKey}`}>
      {text}
    </Link>
  );
}
