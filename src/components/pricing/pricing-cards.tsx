import { Check } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { type BillingPlan, planKeys } from "@/lib/billing";
import { cn } from "@/lib/utils";
import { messages } from "@/messages/en";

type PricingCardsProps = {
  mode?: "link" | "checkout";
  selectedPlan?: string;
};

export function PricingCards({ mode = "link", selectedPlan }: PricingCardsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {planKeys.map((key) => {
        const plan = messages.pricing[key];
        const highlighted = selectedPlan === key || key === "annual";

        return (
          <Card
            className={cn(
              "flex h-full flex-col",
              highlighted ? "border-primary shadow-md" : "border-border shadow-sm"
            )}
            key={key}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-6">
              <div>
                <span className="text-4xl font-bold tracking-normal">{plan.price}</span>
                <span className="ml-1 text-sm text-muted-foreground">{plan.cadence}</span>
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

function PlanAction({ mode, planKey, text }: { mode: "link" | "checkout"; planKey: BillingPlan; text: string }) {
  if (mode === "checkout") {
    return (
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
