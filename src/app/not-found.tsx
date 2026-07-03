import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { messages } from "@/messages/en";

// Pantalla 404 global de App Router.
// Mantenemos CTA directo para volver al inicio.
export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-blue-500 px-10">
      <div className="max-w-md rounded-lg border border-border bg-blue-100 p-8 text-center shadow-sm">
        <h2 className="text-3xl font-bold tracking-normal">{messages.errors.notFound}</h2>
        <div className="mt-6">
          <Link className={buttonVariants()} href="/">
            {messages.common.home}
          </Link>
        </div>
      </div>
    </main>
  );
}
