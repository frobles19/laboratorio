import { AppShell } from "@/components/AppShell";
import { getCurrentAppUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentAppUser();

  return (
    <AppShell userLabel={user?.label ?? "—"} userRole={user?.role ?? "tecnico"}>
      {children}
    </AppShell>
  );
}
