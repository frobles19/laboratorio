import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EquipoForm } from "./EquipoForm";

export const dynamic = "force-dynamic";

export default async function NuevoEquipoPage({ params }: { params: Promise<{ iata: string }> }) {
  const { iata } = await params;
  const supabase = await createClient();

  const { data: airport } = await supabase
    .from("airports")
    .select("iata_code, name")
    .eq("iata_code", iata.toUpperCase())
    .maybeSingle();

  if (!airport) notFound();

  const { data: models } = await supabase
    .from("model_catalog")
    .select("id, brand, model, type")
    .order("type")
    .order("brand");

  return (
    <div>
      <Link href={`/aeropuertos/${airport.iata_code}`} className="back-link">
        ‹ {airport.iata_code}
      </Link>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>Nuevo equipo instalado</h2>
      <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
        Instancia física de un modelo del catálogo en <b className="mono">{airport.iata_code}</b>. Un ILS siempre
        lleva su DME asociado.
      </p>

      <EquipoForm
        airportIata={airport.iata_code}
        airportLabel={`${airport.iata_code} — ${airport.name}`}
        models={(models ?? []) as { id: string; brand: string; model: string; type: "ILS" | "VOR" | "DME" }[]}
      />
    </div>
  );
}
