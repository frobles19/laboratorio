import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArticuloForm } from "./ArticuloForm";

export const dynamic = "force-dynamic";

export default async function NuevoArticuloPage() {
  const supabase = await createClient();

  const [{ data: airports }, { data: models }] = await Promise.all([
    supabase.from("airports").select("iata_code, name").order("iata_code"),
    supabase.from("model_catalog").select("id, brand, model, type").order("type").order("brand"),
  ]);

  return (
    <div>
      <Link href="/articulos" className="back-link">
        ‹ Artículos
      </Link>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>Nuevo artículo</h2>
      <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
        Alta de una herramienta o un repuesto en el inventario.
      </p>

      <ArticuloForm airports={airports ?? []} models={models ?? []} />
    </div>
  );
}
