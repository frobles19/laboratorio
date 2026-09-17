import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EquipoEditForm } from "./EquipoEditForm";

export const dynamic = "force-dynamic";

export default async function EditarEquipoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: equipment } = await supabase
    .from("installed_equipment")
    .select("id, aerial_verification_frequency_months, model_catalog(brand, model, type)")
    .eq("id", id)
    .maybeSingle();

  if (!equipment) notFound();

  const model = equipment.model_catalog as unknown as { brand: string; model: string; type: string };

  return (
    <div>
      <Link href={`/equipos/${id}`} className="back-link">
        ‹ {model.brand} {model.model}
      </Link>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>Editar equipo</h2>
      <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
        Solo se puede ajustar la frecuencia de verificación aérea de este equipo. El modelo y el aeropuerto no se
        pueden cambiar una vez instalado.
      </p>

      <EquipoEditForm
        id={id}
        label={`${model.type} — ${model.brand} ${model.model}`}
        aerialVerificationFrequencyMonths={equipment.aerial_verification_frequency_months}
      />
    </div>
  );
}
