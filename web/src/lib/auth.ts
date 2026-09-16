import { createClient } from "@/lib/supabase/server";

export async function getCurrentAppUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: appUser } = await supabase
    .from("app_users")
    .select("role, technician_id, technicians(full_name)")
    .eq("id", user.id)
    .single();

  const technicianName = (appUser?.technicians as { full_name: string } | null)?.full_name;

  return {
    id: user.id,
    email: user.email ?? "",
    role: appUser?.role ?? "tecnico",
    label: technicianName ?? user.email ?? "Usuario",
  };
}
