import { redirect } from "next/navigation";

// Pagina de registro publica.
// Igual que login: si ya estas autenticado, te saca a dashboard.

import { AuthForm } from "@/components/auth/auth-form";
import { SiteHeader } from "@/components/layout/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { messages } from "@/messages/en";

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Flujo: check sesion -> plan opcional -> render AuthForm en modo register.
export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/app/dashboard");
  }

  const params = await searchParams;
  // Si viene plan en query, luego se usa para redirect post-registro.
  const plan = typeof params.plan === "string" ? params.plan : undefined;

  return (
    <div className="min-h-screen bg-muted/35">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md px-4 py-16 sm:px-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{messages.auth.registerTitle}</CardTitle>
            <CardDescription>{messages.auth.registerSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm mode="register" plan={plan} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
