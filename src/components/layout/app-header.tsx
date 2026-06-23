import type { Subscription, User } from "@prisma/client";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { getSubscriptionState } from "@/lib/billing";
import { cn } from "@/lib/utils";
import { messages } from "@/messages/en";

type AppHeaderProps = {
  user: User & {
    subscription: Subscription | null;
  };
};

function planLabel(state: ReturnType<typeof getSubscriptionState>) {
  if (state === "active") {
    return messages.dashboard.planActive;
  }

  if (state === "past_due") {
    return messages.dashboard.planPastDue;
  }

  return messages.dashboard.planFree;
}

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
          {state !== "active" ? (
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/upgrade">
              {messages.nav.upgrade}
            </Link>
          ) : null}
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
