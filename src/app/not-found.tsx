import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { messages } from "@/messages/en";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/35 px-4">
      <div className="max-w-md rounded-lg border border-border bg-background p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold tracking-normal">{messages.errors.notFound}</h1>
        <div className="mt-6">
          <Link className={buttonVariants()} href="/">
            {messages.common.home}
          </Link>
        </div>
      </div>
    </main>
  );
}
