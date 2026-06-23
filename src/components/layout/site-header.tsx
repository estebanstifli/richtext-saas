import Link from "next/link";
import { PenLine } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { messages } from "@/messages/en";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-border bg-background/95">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link className="flex items-center gap-2 text-lg font-semibold tracking-normal" href="/">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PenLine className="h-4 w-4" />
          </span>
          {messages.appName}
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link className="hover:text-foreground" href="/#features">
            {messages.nav.features}
          </Link>
          <Link className="hover:text-foreground" href="/#pricing">
            {messages.nav.pricing}
          </Link>
          <Link className="hover:text-foreground" href="/#faq">
            {messages.nav.security}
          </Link>
          <Link className="hover:text-foreground" href="/#features">
            {messages.nav.about}
          </Link>
          <Link className="hover:text-foreground" href="/#pricing">
            {messages.nav.contact}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/app/dashboard">
              {messages.nav.dashboard}
            </Link>
          ) : (
            <>
              <Link className={buttonVariants({ variant: "ghost", size: "sm" })} href="/login">
                {messages.nav.login}
              </Link>
              <Link className={buttonVariants({ size: "sm" })} href="/register">
                {messages.nav.register}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
