import { AppHeader } from "@/components/layout/app-header";
import { requireUser } from "@/lib/auth";

export default async function ProtectedAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-muted/35">
      <AppHeader user={user} />
      {children}
    </div>
  );
}
