import { AppHeader } from "@/components/layout/app-header";
import { requireUser } from "@/lib/auth";

// Layout compartido para todo /app/*.
// Aqui se fuerza login y se monta el header comun del area privada.
export default async function ProtectedAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Guard de auth: si no hay sesion valida, redirige a /login.
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-muted/35">
      <AppHeader user={user} />
      {children}
    </div>
  );
}
