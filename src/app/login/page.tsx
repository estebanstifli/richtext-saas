import { redirect } from "next/navigation";

// Pagina de login publica.
// Si ya hay sesion activa, no tiene sentido quedarse aqui: mandamos al dashboard.

import { AuthForm } from "@/components/auth/auth-form";
import { SiteHeader } from "@/components/layout/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { messages } from "@/messages/en";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Flujo: check sesion -> resolver plan opcional -> render AuthForm en modo login.
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/app/dashboard");
  }

  const params = await searchParams;
  // Plan opcional para mantener contexto si viene desde pricing.
  const plan = typeof params.plan === "string" ? params.plan : undefined;

  return (
    <div className="min-h-screen bg-muted/35">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md px-4 py-16 sm:px-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{messages.auth.loginTitle}</CardTitle>
            <CardDescription>{messages.auth.loginSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm mode="login" plan={plan} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
