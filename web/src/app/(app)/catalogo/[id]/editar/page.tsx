import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ModeloEditForm } from "./ModeloEditForm";

export const dynamic = "force-dynamic";

export default async function EditarModeloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: model } = await supabase.from("model_catalog").select("*").eq("id", id).maybeSingle();
  if (!model) notFound();

  const { count } = await supabase
    .from("installed_equipment")
    .select("id", { count: "exact", head: true })
    .eq("catalog_model_id", id);

  return (
    <div>
      <Link href={`/catalogo/${id}`} className="back-link">
        ‹ {model.brand} {model.model}
      </Link>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>Editar modelo</h2>
      <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
        Actualizá los datos de este modelo de catálogo.
      </p>

      <ModeloEditForm
        id={model.id}
        brand={model.brand}
        model={model.model}
        type={model.type}
        preventiveFrequencyMonths={model.preventive_frequency_months}
        typeLocked={(count ?? 0) > 0}
      />
    </div>
  );
}
