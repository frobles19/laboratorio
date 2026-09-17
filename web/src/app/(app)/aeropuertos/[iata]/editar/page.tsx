import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AeropuertoEditForm } from "./AeropuertoEditForm";

export const dynamic = "force-dynamic";

export default async function EditarAeropuertoPage({ params }: { params: Promise<{ iata: string }> }) {
  const { iata } = await params;
  const supabase = await createClient();

  const { data: airport } = await supabase
    .from("airports")
    .select("*")
    .eq("iata_code", iata.toUpperCase())
    .maybeSingle();

  if (!airport) notFound();

  return (
    <div>
      <Link href={`/aeropuertos/${airport.iata_code}`} className="back-link">
        ‹ {airport.iata_code}
      </Link>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>Editar aeropuerto</h2>
      <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
        Actualizá el nombre y la región de este aeropuerto.
      </p>

      <AeropuertoEditForm iataCode={airport.iata_code} name={airport.name} region={airport.region} />
    </div>
  );
}
